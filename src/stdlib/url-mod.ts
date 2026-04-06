// Kode stdlib — std.url (URL parsing)

import { KodeValue, mkStr, mkNull, mkMap, mkNum, mkBool } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerUrlStdlib(env: Environment): void {
  const urlMod = new Map<string, KodeValue>();

  urlMod.set('parse', { type: 'native_fn', name: 'url.parse',
    call: (args: KodeValue[]) => {
      const str = args[0]?.type === 'str' ? args[0].value : '';
      try {
        const u = new URL(str);
        const m = new Map<string, KodeValue>();
        m.set('protocol', mkStr(u.protocol.replace(':', '')));
        m.set('host', mkStr(u.host));
        m.set('hostname', mkStr(u.hostname));
        m.set('port', mkStr(u.port));
        m.set('path', mkStr(u.pathname));
        m.set('search', mkStr(u.search));
        m.set('hash', mkStr(u.hash));
        m.set('origin', mkStr(u.origin));
        // Parse query params
        const params = new Map<string, KodeValue>();
        for (const [k, v] of u.searchParams) params.set(k, mkStr(v));
        m.set('query', mkMap(params));
        return mkMap(m);
      } catch { throw new Error(`[url.parse] Invalid URL: ${str}`); }
    }});

  urlMod.set('build', { type: 'native_fn', name: 'url.build',
    call: (args: KodeValue[]) => {
      if (args[0]?.type !== 'map') throw new Error('[url.build] Expected a map');
      const m = args[0].entries;
      const protocol = (m.get('protocol') as any)?.value ?? 'https';
      const host = (m.get('host') as any)?.value ?? 'localhost';
      const path = (m.get('path') as any)?.value ?? '/';
      return mkStr(`${protocol}://${host}${path}`);
    }});

  env.define('url', mkMap(urlMod));
}
