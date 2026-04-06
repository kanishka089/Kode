// Kode stdlib — std.net (HTTP Client)
// Uses Node.js built-in fetch (Node 18+)

import { KodeValue, mkStr, mkNum, mkNull, mkBool, mkList, mkMap, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerNetStdlib(env: Environment): void {
  const netMod = new Map<string, KodeValue>();

  // net.get(url, headers?) — HTTP GET, returns response map
  netMod.set('get', {
    type: 'native_fn', name: 'net.get',
    call: (args: KodeValue[]) => {
      const url = args[0]?.type === 'str' ? args[0].value : '';
      const headers = args[1]?.type === 'map' ? mapToHeaders(args[1].entries) : {};

      // Synchronous HTTP using child_process (sync context)
      try {
        const { execSync } = require('child_process');
        const cmd = `node -e "fetch('${url.replace(/'/g, "\\'")}',{headers:${JSON.stringify(headers)}}).then(r=>r.text()).then(t=>process.stdout.write(t)).catch(e=>process.stdout.write('__ERROR__'+e.message))"`;
        const result = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
        if (result.startsWith('__ERROR__')) {
          throw new Error(result.slice(9));
        }
        // Try to parse as JSON
        try {
          return jsonToKode(JSON.parse(result));
        } catch {
          return mkStr(result);
        }
      } catch (e: any) {
        throw new Error(`[net.get] ${e.message}`);
      }
    },
  });

  // net.post(url, body, headers?) — HTTP POST
  netMod.set('post', {
    type: 'native_fn', name: 'net.post',
    call: (args: KodeValue[]) => {
      const url = args[0]?.type === 'str' ? args[0].value : '';
      const body = args[1] ? kodeToJson(args[1]) : null;
      const headers = args[2]?.type === 'map' ? mapToHeaders(args[2].entries) : {};
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';

      try {
        const { execSync } = require('child_process');
        const bodyStr = JSON.stringify(body).replace(/'/g, "\\'");
        const headersStr = JSON.stringify(headers).replace(/'/g, "\\'");
        const cmd = `node -e "fetch('${url.replace(/'/g, "\\'")}',{method:'POST',body:'${bodyStr}',headers:${headersStr}}).then(r=>r.text()).then(t=>process.stdout.write(t)).catch(e=>process.stdout.write('__ERROR__'+e.message))"`;
        const result = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
        if (result.startsWith('__ERROR__')) throw new Error(result.slice(9));
        try { return jsonToKode(JSON.parse(result)); }
        catch { return mkStr(result); }
      } catch (e: any) {
        throw new Error(`[net.post] ${e.message}`);
      }
    },
  });

  env.define('net', mkMap(netMod));
}

function mapToHeaders(entries: Map<string, KodeValue>): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [k, v] of entries) headers[k] = v.type === 'str' ? v.value : stringify(v);
  return headers;
}

function jsonToKode(v: any): KodeValue {
  if (v === null || v === undefined) return mkNull();
  if (typeof v === 'number') return mkNum(v);
  if (typeof v === 'string') return mkStr(v);
  if (typeof v === 'boolean') return mkBool(v);
  if (Array.isArray(v)) return mkList(v.map(jsonToKode));
  if (typeof v === 'object') {
    const m = new Map<string, KodeValue>();
    for (const [k, val] of Object.entries(v)) m.set(k, jsonToKode(val));
    return mkMap(m);
  }
  return mkStr(String(v));
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
      for (const [k, val] of v.entries) if (!k.startsWith('__')) obj[k] = kodeToJson(val);
      return obj;
    }
    default: return stringify(v);
  }
}
