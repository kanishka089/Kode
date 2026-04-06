// Kode stdlib — std.re (Regex)

import { KodeValue, mkStr, mkNull, mkBool, mkList, mkMap, mkNum } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerReStdlib(env: Environment): void {
  const reMod = new Map<string, KodeValue>();

  reMod.set('match', { type: 'native_fn', name: 're.match', call: (args: KodeValue[]) => {
    const pattern = asStr(args[0]); const str = asStr(args[1]);
    const flags = args[2]?.type === 'str' ? args[2].value : '';
    const m = str.match(new RegExp(pattern, flags));
    if (!m) return mkNull();
    return mkList(m.map(mkStr));
  }});

  reMod.set('test', { type: 'native_fn', name: 're.test', call: (args: KodeValue[]) => {
    return mkBool(new RegExp(asStr(args[0])).test(asStr(args[1])));
  }});

  reMod.set('replace', { type: 'native_fn', name: 're.replace', call: (args: KodeValue[]) => {
    const str = asStr(args[0]); const pattern = asStr(args[1]); const replacement = asStr(args[2]);
    const flags = args[3]?.type === 'str' ? args[3].value : 'g';
    return mkStr(str.replace(new RegExp(pattern, flags), replacement));
  }});

  reMod.set('split', { type: 'native_fn', name: 're.split', call: (args: KodeValue[]) => {
    return mkList(asStr(args[0]).split(new RegExp(asStr(args[1]))).map(mkStr));
  }});

  reMod.set('find_all', { type: 'native_fn', name: 're.find_all', call: (args: KodeValue[]) => {
    const matches = [...asStr(args[1]).matchAll(new RegExp(asStr(args[0]), 'g'))];
    return mkList(matches.map(m => mkStr(m[0])));
  }});

  env.define('re', mkMap(reMod));
}

function asStr(v: KodeValue): string { return v?.type === 'str' ? v.value : ''; }
