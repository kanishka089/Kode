// Kode stdlib — std.env (Environment Variables)

import { readFileSync, existsSync } from 'fs';
import { KodeValue, mkStr, mkNull, mkBool, mkMap, mkList } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerEnvStdlib(env: Environment): void {
  const envMod = new Map<string, KodeValue>();

  envMod.set('get', {
    type: 'native_fn', name: 'env.get',
    call: (args: KodeValue[]) => {
      const key = args[0]?.type === 'str' ? args[0].value : '';
      const fallback = args[1];
      const val = process.env[key];
      if (val === undefined) return fallback ?? mkNull();
      return mkStr(val);
    },
  });

  envMod.set('set', {
    type: 'native_fn', name: 'env.set',
    call: (args: KodeValue[]) => {
      const key = args[0]?.type === 'str' ? args[0].value : '';
      const val = args[1]?.type === 'str' ? args[1].value : '';
      process.env[key] = val;
      return mkNull();
    },
  });

  envMod.set('has', {
    type: 'native_fn', name: 'env.has',
    call: (args: KodeValue[]) => {
      const key = args[0]?.type === 'str' ? args[0].value : '';
      return mkBool(key in process.env);
    },
  });

  // env.load(".env") — load env file
  envMod.set('load', {
    type: 'native_fn', name: 'env.load',
    call: (args: KodeValue[]) => {
      const path = args[0]?.type === 'str' ? args[0].value : '.env';
      if (!existsSync(path)) return mkBool(false);
      const content = readFileSync(path, 'utf-8');
      let count = 0;
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx < 0) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        // Remove surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
        count++;
      }
      return mkBool(true);
    },
  });

  envMod.set('all', {
    type: 'native_fn', name: 'env.all',
    call: () => {
      const entries = new Map<string, KodeValue>();
      for (const [k, v] of Object.entries(process.env)) {
        if (v !== undefined) entries.set(k, mkStr(v));
      }
      return mkMap(entries);
    },
  });

  env.define('env', mkMap(envMod));
}
