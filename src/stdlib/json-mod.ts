// Kode stdlib — std.json (JSON parse/stringify)

import { KodeValue, mkStr, mkNum, mkBool, mkNull, mkList, mkMap, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerJsonStdlib(env: Environment): void {
  const jsonMod = new Map<string, KodeValue>();

  // json.parse(str) — parse JSON string into Kode value
  jsonMod.set('parse', {
    type: 'native_fn',
    name: 'json.parse',
    call: (args: KodeValue[]) => {
      const str = args[0]?.type === 'str' ? args[0].value : '';
      try {
        return jsonToKode(JSON.parse(str));
      } catch (e: any) {
        throw new Error(`[json.parse] ${e.message}`);
      }
    },
  });

  // json.to_str(value) — convert Kode value to JSON string
  jsonMod.set('to_str', {
    type: 'native_fn',
    name: 'json.to_str',
    call: (args: KodeValue[]) => {
      return mkStr(JSON.stringify(kodeToJson(args[0] ?? mkNull()), null, 2));
    },
  });

  // json.to_compact(value) — compact JSON (no whitespace)
  jsonMod.set('to_compact', {
    type: 'native_fn',
    name: 'json.to_compact',
    call: (args: KodeValue[]) => {
      return mkStr(JSON.stringify(kodeToJson(args[0] ?? mkNull())));
    },
  });

  env.define('json', mkMap(jsonMod));
}

// --- Converters ---

function jsonToKode(v: any): KodeValue {
  if (v === null || v === undefined) return mkNull();
  if (typeof v === 'number') return mkNum(v);
  if (typeof v === 'string') return mkStr(v);
  if (typeof v === 'boolean') return mkBool(v);
  if (Array.isArray(v)) return mkList(v.map(jsonToKode));
  if (typeof v === 'object') {
    const entries = new Map<string, KodeValue>();
    for (const [k, val] of Object.entries(v)) entries.set(k, jsonToKode(val));
    return mkMap(entries);
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
      for (const [k, val] of v.entries) {
        if (!k.startsWith('__')) obj[k] = kodeToJson(val);
      }
      return obj;
    }
    default: return stringify(v);
  }
}
