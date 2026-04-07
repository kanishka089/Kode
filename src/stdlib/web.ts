// Kode stdlib — std.web (HTTP Server)

import * as http from 'http';
import { KodeValue, mkNum, mkStr, mkBool, mkNull, mkList, mkMap, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

type FnCaller = (fn: KodeValue, args: KodeValue[]) => KodeValue;

interface Route {
  method: string;
  path: string;
  handler: KodeValue;
}

export function registerWebStdlib(env: Environment, callFn: FnCaller): void {
  const webMod = new Map<string, KodeValue>();

  let routes: Route[] = [];
  let server: http.Server | null = null;

  // serve(port) { on "METHOD /path" -> handler }
  // We register the serve function — routes are added via `on` calls before serve starts
  webMod.set('serve', {
    type: 'native_fn',
    name: 'web.serve',
    call: (args: KodeValue[]) => {
      const port = args[0]?.type === 'num' ? args[0].value : 3000;

      server = http.createServer((req, res) => {
        const method = req.method ?? 'GET';
        const url = new URL(req.url ?? '/', `http://localhost:${port}`);
        const path = url.pathname;

        // Find matching route
        let matched: Route | undefined;
        let params: Record<string, string> = {};

        // First pass: exact matches only
        for (const route of routes) {
          if (route.method !== method && route.method !== '*') continue;
          if (route.path === path) { matched = route; break; }
        }

        // Second pass: parameterized matches (only if no exact match)
        if (!matched) {
          for (const route of routes) {
            if (route.method !== method && route.method !== '*') continue;
            if (!route.path.includes(':')) continue;
            const routeParts = route.path.split('/');
            const pathParts = path.split('/');
            if (routeParts.length === pathParts.length) {
              let match = true;
              const p: Record<string, string> = {};
              for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                  p[routeParts[i].slice(1)] = pathParts[i];
                } else if (routeParts[i] !== pathParts[i]) {
                  match = false; break;
                }
              }
              if (match) { matched = route; params = p; break; }
            }
          }
        }

        if (!matched) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
        }

        // Collect body for POST/PUT
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            // Build request map
            const reqMap = new Map<string, KodeValue>();
            reqMap.set('method', mkStr(method));
            reqMap.set('path', mkStr(path));
            reqMap.set('query', parseQuery(url.searchParams));
            reqMap.set('params', strMapToKode(params));
            reqMap.set('headers', parseHeaders(req.headers));

            // Parse body
            if (body) {
              const contentType = req.headers['content-type'] ?? '';
              if (contentType.includes('application/x-www-form-urlencoded')) {
                // Parse URL-encoded form data
                const formData = new Map<string, KodeValue>();
                for (const pair of body.split('&')) {
                  const [key, ...rest] = pair.split('=');
                  const value = decodeURIComponent(rest.join('=').replace(/\+/g, ' '));
                  formData.set(decodeURIComponent(key), mkStr(value));
                }
                reqMap.set('body', mkMap(formData));
              } else {
                try {
                  const parsed = JSON.parse(body);
                  reqMap.set('body', jsonToKode(parsed));
                } catch {
                  reqMap.set('body', mkStr(body));
                }
              }
            } else {
              reqMap.set('body', mkNull());
            }

            const reqVal = mkMap(reqMap);
            const result = callFn(matched!.handler, [reqVal]);

            // Handle response
            sendResponse(res, result);
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message ?? 'Internal server error' }));
          }
        });
      });

      server.listen(port, () => {
        console.log(`[Kode] Server running at http://localhost:${port}`);
      });

      return mkNull();
    },
  });

  // web.route(method, path, handler)
  webMod.set('route', {
    type: 'native_fn',
    name: 'web.route',
    call: (args: KodeValue[]) => {
      const method = args[0]?.type === 'str' ? args[0].value : 'GET';
      const path = args[1]?.type === 'str' ? args[1].value : '/';
      const handler = args[2];
      if (!handler || (handler.type !== 'fn' && handler.type !== 'native_fn')) {
        throw new Error('[web.route] Third argument must be a function');
      }
      routes.push({ method, path, handler });
      return mkNull();
    },
  });

  // web.stop()
  webMod.set('stop', {
    type: 'native_fn',
    name: 'web.stop',
    call: () => {
      if (server) server.close();
      return mkNull();
    },
  });

  // Response helpers
  webMod.set('json', {
    type: 'native_fn',
    name: 'web.json',
    call: (args: KodeValue[]) => {
      const data = args[0];
      const status = args[1]?.type === 'num' ? args[1].value : 200;
      const respMap = new Map<string, KodeValue>();
      respMap.set('__type', mkStr('json'));
      respMap.set('__status', mkNum(status));
      respMap.set('__body', data);
      return mkMap(respMap);
    },
  });

  webMod.set('html', {
    type: 'native_fn',
    name: 'web.html',
    call: (args: KodeValue[]) => {
      const content = args[0]?.type === 'str' ? args[0].value : stringify(args[0]);
      const status = args[1]?.type === 'num' ? args[1].value : 200;
      const respMap = new Map<string, KodeValue>();
      respMap.set('__type', mkStr('html'));
      respMap.set('__status', mkNum(status));
      respMap.set('__body', mkStr(content));
      return mkMap(respMap);
    },
  });

  webMod.set('redirect', {
    type: 'native_fn',
    name: 'web.redirect',
    call: (args: KodeValue[]) => {
      const url = args[0]?.type === 'str' ? args[0].value : '/';
      const respMap = new Map<string, KodeValue>();
      respMap.set('__type', mkStr('redirect'));
      respMap.set('__url', mkStr(url));
      return mkMap(respMap);
    },
  });

  env.define('web', mkMap(webMod));
}

// --- Helpers ---

function sendResponse(res: http.ServerResponse, result: KodeValue): void {
  if (result.type === 'map') {
    const type = result.entries.get('__type');
    if (type?.type === 'str') {
      const status = (result.entries.get('__status') as any)?.value ?? 200;
      if (type.value === 'json') {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(kodeToJson(result.entries.get('__body') ?? mkNull())));
        return;
      }
      if (type.value === 'html') {
        res.writeHead(status, { 'Content-Type': 'text/html' });
        res.end((result.entries.get('__body') as any)?.value ?? '');
        return;
      }
      if (type.value === 'redirect') {
        const url = (result.entries.get('__url') as any)?.value ?? '/';
        res.writeHead(302, { 'Location': url });
        res.end();
        return;
      }
    }
    // Default: treat as JSON
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(kodeToJson(result)));
    return;
  }
  if (result.type === 'str') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(result.value);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(kodeToJson(result)));
}

function kodeToJson(v: KodeValue): any {
  switch (v.type) {
    case 'num': return v.value;
    case 'str': return v.value;
    case 'bool': return v.value;
    case 'null': return null;
    case 'list': return v.items.map(kodeToJson);
    case 'map': {
      const obj: any = {};
      for (const [k, val] of v.entries) {
        if (!k.startsWith('__')) obj[k] = kodeToJson(val);
      }
      return obj;
    }
    default: return stringify(v);
  }
}

function jsonToKode(v: any): KodeValue {
  if (v === null || v === undefined) return mkNull();
  if (typeof v === 'number') return mkNum(v);
  if (typeof v === 'string') return mkStr(v);
  if (typeof v === 'boolean') return mkBool(v);
  if (Array.isArray(v)) return mkList(v.map(jsonToKode));
  if (typeof v === 'object') {
    const entries = new Map<string, KodeValue>();
    for (const [k, val] of Object.entries(v)) {
      entries.set(k, jsonToKode(val));
    }
    return mkMap(entries);
  }
  return mkStr(String(v));
}

function parseQuery(params: URLSearchParams): KodeValue {
  const entries = new Map<string, KodeValue>();
  for (const [k, v] of params) entries.set(k, mkStr(v));
  return mkMap(entries);
}

function parseHeaders(headers: http.IncomingHttpHeaders): KodeValue {
  const entries = new Map<string, KodeValue>();
  for (const [k, v] of Object.entries(headers)) {
    entries.set(k, mkStr(Array.isArray(v) ? v.join(', ') : v ?? ''));
  }
  return mkMap(entries);
}

function strMapToKode(m: Record<string, string>): KodeValue {
  const entries = new Map<string, KodeValue>();
  for (const [k, v] of Object.entries(m)) entries.set(k, mkStr(v));
  return mkMap(entries);
}
