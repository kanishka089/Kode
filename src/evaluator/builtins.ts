// Kode Language — Built-in Functions

import { Environment } from './environment.js';
import { KodeValue, KodeNativeFn, mkNum, mkStr, mkBool, mkNull, mkList, mkMap, stringify } from './values.js';

export type FnCaller = (fn: KodeValue, args: KodeValue[]) => KodeValue;

export function registerBuiltins(env: Environment, callFn?: FnCaller): void {
  // --- Memory subsystem ---
  registerMemory(env);
  // --- Streams ---
  registerStreams(env, callFn);

  // io module as a map-like namespace
  const io = new Map<string, KodeValue>();

  io.set('out', nativeFn('io.out', (args) => {
    console.log(args.map(stringify).join(' '));
    return mkNull();
  }));

  io.set('err', nativeFn('io.err', (args) => {
    console.error(args.map(stringify).join(' '));
    return mkNull();
  }));

  env.define('io', {
    type: 'map',
    entries: io,
  });

  // math module
  const math = new Map<string, KodeValue>();
  math.set('abs', nativeFn('math.abs', ([a]) => mkNum(Math.abs(asNum(a)))));
  math.set('floor', nativeFn('math.floor', ([a]) => mkNum(Math.floor(asNum(a)))));
  math.set('ceil', nativeFn('math.ceil', ([a]) => mkNum(Math.ceil(asNum(a)))));
  math.set('round', nativeFn('math.round', ([a]) => mkNum(Math.round(asNum(a)))));
  math.set('sqrt', nativeFn('math.sqrt', ([a]) => mkNum(Math.sqrt(asNum(a)))));
  math.set('random', nativeFn('math.random', () => mkNum(Math.random())));
  math.set('min', nativeFn('math.min', (args) => mkNum(Math.min(...args.map(asNum)))));
  math.set('max', nativeFn('math.max', (args) => mkNum(Math.max(...args.map(asNum)))));
  math.set('pi', mkNum(Math.PI));
  math.set('e', mkNum(Math.E));

  env.define('math', { type: 'map', entries: math });

  // Top-level utility functions
  env.define('type', nativeFn('type', ([v]) => mkStr(v.type)));
  env.define('len', nativeFn('len', ([v]) => {
    if (v.type === 'str') return mkNum(v.value.length);
    if (v.type === 'list') return mkNum(v.items.length);
    if (v.type === 'map') return mkNum(v.entries.size);
    throw new Error(`[Runtime] len() not supported for type '${v.type}'`);
  }));
  env.define('str', nativeFn('str', ([v]) => mkStr(stringify(v))));
  env.define('num', nativeFn('num', ([v]) => {
    if (v.type === 'num') return v;
    if (v.type === 'str') return mkNum(parseFloat(v.value));
    if (v.type === 'bool') return mkNum(v.value ? 1 : 0);
    throw new Error(`[Runtime] Cannot convert ${v.type} to num`);
  }));
  // Assert functions (for #test blocks)
  env.define('assert', nativeFn('assert', ([v, msg]) => {
    const truthy = v.type === 'bool' ? v.value : v.type !== 'null';
    if (!truthy) throw new Error(`[Assert] ${msg?.type === 'str' ? msg.value : 'Assertion failed'}`);
    return mkNull();
  }));
  env.define('assert_eq', nativeFn('assert_eq', ([a, b, msg]) => {
    const eq = stringify(a) === stringify(b);
    if (!eq) throw new Error(`[Assert] ${msg?.type === 'str' ? msg.value : `Expected ${stringify(a)} == ${stringify(b)}`}`);
    return mkNull();
  }));
  env.define('assert_ne', nativeFn('assert_ne', ([a, b, msg]) => {
    const eq = stringify(a) === stringify(b);
    if (eq) throw new Error(`[Assert] ${msg?.type === 'str' ? msg.value : `Expected ${stringify(a)} != ${stringify(b)}`}`);
    return mkNull();
  }));

  env.define('bool', nativeFn('bool', ([v]) => {
    if (v.type === 'bool') return v;
    if (v.type === 'num') return mkBool(v.value !== 0);
    if (v.type === 'str') return mkBool(v.value.length > 0);
    if (v.type === 'null') return mkBool(false);
    return mkBool(true);
  }));

  // str module
  const strMod = new Map<string, KodeValue>();
  strMod.set('split', nativeFn('str.split', ([s, sep]) => ({
    type: 'list', items: asStr(s).split(asStr(sep)).map(mkStr)
  })));
  strMod.set('join', nativeFn('str.join', ([lst, sep]) => {
    if (lst.type !== 'list') throw new Error('[Runtime] str.join expects a list');
    return mkStr(lst.items.map(stringify).join(sep ? asStr(sep) : ''));
  }));
  strMod.set('trim', nativeFn('str.trim', ([s]) => mkStr(asStr(s).trim())));
  strMod.set('upper', nativeFn('str.upper', ([s]) => mkStr(asStr(s).toUpperCase())));
  strMod.set('lower', nativeFn('str.lower', ([s]) => mkStr(asStr(s).toLowerCase())));
  strMod.set('contains', nativeFn('str.contains', ([s, sub]) => mkBool(asStr(s).includes(asStr(sub)))));
  strMod.set('starts', nativeFn('str.starts', ([s, pre]) => mkBool(asStr(s).startsWith(asStr(pre)))));
  strMod.set('ends', nativeFn('str.ends', ([s, suf]) => mkBool(asStr(s).endsWith(asStr(suf)))));
  strMod.set('replace', nativeFn('str.replace', ([s, from, to]) => mkStr(asStr(s).replaceAll(asStr(from), asStr(to)))));
  strMod.set('len', nativeFn('str.len', ([s]) => mkNum(asStr(s).length)));
  strMod.set('slice', nativeFn('str.slice', ([s, start, end]) => mkStr(asStr(s).slice(asNum(start), end ? asNum(end) : undefined))));
  env.define('str', { type: 'map', entries: strMod });

  // lst module
  const lstMod = new Map<string, KodeValue>();
  lstMod.set('len', nativeFn('lst.len', ([l]) => mkNum(asList(l).length)));
  lstMod.set('push', nativeFn('lst.push', ([l, v]) => { asList(l).push(v); return mkNull(); }));
  lstMod.set('pop', nativeFn('lst.pop', ([l]) => asList(l).pop() ?? mkNull()));
  lstMod.set('reverse', nativeFn('lst.reverse', ([l]) => ({ type: 'list', items: [...asList(l)].reverse() })));
  lstMod.set('sort', nativeFn('lst.sort', ([l]) => ({
    type: 'list', items: [...asList(l)].sort((a, b) => {
      if (a.type === 'num' && b.type === 'num') return a.value - b.value;
      return stringify(a).localeCompare(stringify(b));
    })
  })));

  // Higher-order functions (need callFn)
  if (callFn) {
    lstMod.set('map', nativeFn('lst.map', ([l, f]) => {
      return mkList(asList(l).map(item => callFn(f, [item])));
    }));
    lstMod.set('filter', nativeFn('lst.filter', ([l, f]) => {
      return mkList(asList(l).filter(item => {
        const result = callFn(f, [item]);
        return result.type === 'bool' ? result.value : result.type !== 'null';
      }));
    }));
    lstMod.set('reduce', nativeFn('lst.reduce', ([l, f, init]) => {
      return asList(l).reduce((acc, item) => callFn(f, [acc, item]), init);
    }));
    lstMod.set('find', nativeFn('lst.find', ([l, f]) => {
      const found = asList(l).find(item => {
        const result = callFn(f, [item]);
        return result.type === 'bool' ? result.value : result.type !== 'null';
      });
      return found ?? mkNull();
    }));
    lstMod.set('flat', nativeFn('lst.flat', ([l]) => {
      const items = asList(l);
      const result: KodeValue[] = [];
      for (const item of items) {
        if (item.type === 'list') result.push(...item.items);
        else result.push(item);
      }
      return mkList(result);
    }));
    lstMod.set('unique', nativeFn('lst.unique', ([l]) => {
      const seen = new Set<string>();
      const result: KodeValue[] = [];
      for (const item of asList(l)) {
        const key = stringify(item);
        if (!seen.has(key)) { seen.add(key); result.push(item); }
      }
      return mkList(result);
    }));
    lstMod.set('chunk', nativeFn('lst.chunk', ([l, size]) => {
      const items = asList(l);
      const n = asNum(size);
      const chunks: KodeValue[] = [];
      for (let i = 0; i < items.length; i += n) {
        chunks.push(mkList(items.slice(i, i + n)));
      }
      return mkList(chunks);
    }));
    lstMod.set('zip', nativeFn('lst.zip', ([a, b]) => {
      const la = asList(a), lb = asList(b);
      const len = Math.min(la.length, lb.length);
      const result: KodeValue[] = [];
      for (let i = 0; i < len; i++) {
        result.push(mkList([la[i], lb[i]]));
      }
      return mkList(result);
    }));
    lstMod.set('join', nativeFn('lst.join', ([l, sep]) => {
      return mkStr(asList(l).map(stringify).join(sep ? asStr(sep) : ''));
    }));
  }

  lstMod.set('slice', nativeFn('lst.slice', ([l, start, end]) => {
    return mkList(asList(l).slice(asNum(start), end ? asNum(end) : undefined));
  }));
  lstMod.set('contains', nativeFn('lst.contains', ([l, v]) => {
    return mkBool(asList(l).some(item => stringify(item) === stringify(v)));
  }));

  env.define('lst', { type: 'map', entries: lstMod });

  // mp module
  const mpMod = new Map<string, KodeValue>();
  mpMod.set('keys', nativeFn('mp.keys', ([m]) => ({
    type: 'list', items: [...asMap(m).keys()].map(mkStr)
  })));
  mpMod.set('values', nativeFn('mp.values', ([m]) => ({
    type: 'list', items: [...asMap(m).values()]
  })));
  mpMod.set('has', nativeFn('mp.has', ([m, k]) => mkBool(asMap(m).has(asStr(k)))));
  mpMod.set('len', nativeFn('mp.len', ([m]) => mkNum(asMap(m).size)));
  env.define('mp', { type: 'map', entries: mpMod });
}

// --- Helpers ---

function nativeFn(name: string, call: (args: KodeValue[]) => KodeValue): KodeNativeFn {
  return { type: 'native_fn', name, call };
}

// --- Streams ---
function registerStreams(env: Environment, callFn?: FnCaller): void {
  const streamMod = new Map<string, KodeValue>();

  // stream.from(list) — create a stream from a list
  streamMod.set('from', nativeFn('stream.from', ([source]) => {
    if (source.type !== 'list') throw new Error('[stream.from] Expected a list');
    // Return a "stream" which is just a tagged list with stream ops
    const s = new Map<string, KodeValue>();
    s.set('__items', source);
    s.set('__type', mkStr('stream'));

    if (callFn) {
      s.set('map', nativeFn('stream.map', ([fn]) => {
        const items = (s.get('__items') as any).items as KodeValue[];
        const mapped = mkList(items.map(item => callFn(fn, [item])));
        s.set('__items', mapped);
        return mkMap(s);
      }));
      s.set('filter', nativeFn('stream.filter', ([fn]) => {
        const items = (s.get('__items') as any).items as KodeValue[];
        const filtered = mkList(items.filter(item => {
          const r = callFn(fn, [item]);
          return r.type === 'bool' ? r.value : r.type !== 'null';
        }));
        s.set('__items', filtered);
        return mkMap(s);
      }));
      s.set('reduce', nativeFn('stream.reduce', ([fn, init]) => {
        const items = (s.get('__items') as any).items as KodeValue[];
        return items.reduce((acc, item) => callFn(fn, [acc, item]), init);
      }));
    }

    s.set('batch', nativeFn('stream.batch', ([size]) => {
      const items = (s.get('__items') as any).items as KodeValue[];
      const n = asNum(size);
      const batches: KodeValue[] = [];
      for (let i = 0; i < items.length; i += n) {
        batches.push(mkList(items.slice(i, i + n)));
      }
      s.set('__items', mkList(batches));
      return mkMap(s);
    }));

    s.set('take', nativeFn('stream.take', ([n]) => {
      const items = (s.get('__items') as any).items as KodeValue[];
      s.set('__items', mkList(items.slice(0, asNum(n))));
      return mkMap(s);
    }));

    s.set('skip', nativeFn('stream.skip', ([n]) => {
      const items = (s.get('__items') as any).items as KodeValue[];
      s.set('__items', mkList(items.slice(asNum(n))));
      return mkMap(s);
    }));

    s.set('collect', nativeFn('stream.collect', () => {
      return s.get('__items') ?? mkList([]);
    }));

    s.set('count', nativeFn('stream.count', () => {
      const items = (s.get('__items') as any).items as KodeValue[];
      return mkNum(items.length);
    }));

    return mkMap(s);
  }));

  // stream.range(start, end) — create a stream from a range
  streamMod.set('range', nativeFn('stream.range', ([start, end]) => {
    const items: KodeValue[] = [];
    for (let i = asNum(start); i < asNum(end); i++) items.push(mkNum(i));
    const source = mkList(items);
    // Reuse stream.from
    const fromFn = streamMod.get('from') as KodeNativeFn;
    return fromFn.call([source]);
  }));

  env.define('stream', mkMap(streamMod));
}

// --- Memory subsystem ---
function registerMemory(env: Environment): void {
  const memMod = new Map<string, KodeValue>();

  // mem.w — working memory (volatile, in-memory)
  const workingStore = new Map<string, KodeValue>();
  const wMod = new Map<string, KodeValue>();
  wMod.set('set', nativeFn('mem.w.set', ([k, v]) => { workingStore.set(asStr(k), v); return mkNull(); }));
  wMod.set('get', nativeFn('mem.w.get', ([k]) => workingStore.get(asStr(k)) ?? mkNull()));
  wMod.set('has', nativeFn('mem.w.has', ([k]) => mkBool(workingStore.has(asStr(k)))));
  wMod.set('delete', nativeFn('mem.w.delete', ([k]) => { workingStore.delete(asStr(k)); return mkNull(); }));
  wMod.set('keys', nativeFn('mem.w.keys', () => mkList([...workingStore.keys()].map(mkStr))));
  wMod.set('clear', nativeFn('mem.w.clear', () => { workingStore.clear(); return mkNull(); }));
  memMod.set('w', mkMap(wMod));

  // mem.s — semantic memory (persistent facts, for now in-memory)
  const semanticStore = new Map<string, KodeValue>();
  const sMod = new Map<string, KodeValue>();
  sMod.set('store', nativeFn('mem.s.store', ([k, v]) => { semanticStore.set(asStr(k), v); return mkNull(); }));
  sMod.set('recall', nativeFn('mem.s.recall', ([k]) => semanticStore.get(asStr(k)) ?? mkNull()));
  sMod.set('has', nativeFn('mem.s.has', ([k]) => mkBool(semanticStore.has(asStr(k)))));
  sMod.set('search', nativeFn('mem.s.search', ([query, limit]) => {
    // Simple substring search for now
    const q = asStr(query).toLowerCase();
    const n = limit ? asNum(limit) : 5;
    const results: KodeValue[] = [];
    for (const [key, val] of semanticStore) {
      if (key.toLowerCase().includes(q) || stringify(val).toLowerCase().includes(q)) {
        results.push(mkMap(new Map([['key', mkStr(key)], ['value', val]])));
        if (results.length >= n) break;
      }
    }
    return mkList(results);
  }));
  sMod.set('keys', nativeFn('mem.s.keys', () => mkList([...semanticStore.keys()].map(mkStr))));
  memMod.set('s', mkMap(sMod));

  // mem.e — episodic memory (event log)
  const episodicLog: KodeValue[] = [];
  const eMod = new Map<string, KodeValue>();
  eMod.set('log', nativeFn('mem.e.log', ([entry]) => { episodicLog.push(entry); return mkNull(); }));
  eMod.set('last', nativeFn('mem.e.last', ([n]) => {
    const count = n ? asNum(n) : 10;
    return mkList(episodicLog.slice(-count));
  }));
  eMod.set('all', nativeFn('mem.e.all', () => mkList([...episodicLog])));
  eMod.set('len', nativeFn('mem.e.len', () => mkNum(episodicLog.length)));
  eMod.set('clear', nativeFn('mem.e.clear', () => { episodicLog.length = 0; return mkNull(); }));
  memMod.set('e', mkMap(eMod));

  // mem.p — procedural memory (learned functions)
  const proceduralStore = new Map<string, KodeValue>();
  const pMod = new Map<string, KodeValue>();
  pMod.set('learn', nativeFn('mem.p.learn', ([name, fn]) => { proceduralStore.set(asStr(name), fn); return mkNull(); }));
  pMod.set('use', nativeFn('mem.p.use', ([name]) => proceduralStore.get(asStr(name)) ?? mkNull()));
  pMod.set('has', nativeFn('mem.p.has', ([name]) => mkBool(proceduralStore.has(asStr(name)))));
  pMod.set('list', nativeFn('mem.p.list', () => mkList([...proceduralStore.keys()].map(mkStr))));
  memMod.set('p', mkMap(pMod));

  env.define('mem', mkMap(memMod));
}

function asNum(v: KodeValue): number {
  if (v.type === 'num') return v.value;
  throw new Error(`[Runtime] Expected num, got ${v.type}`);
}

function asStr(v: KodeValue): string {
  if (v.type === 'str') return v.value;
  throw new Error(`[Runtime] Expected str, got ${v.type}`);
}

function asList(v: KodeValue): KodeValue[] {
  if (v.type === 'list') return v.items;
  throw new Error(`[Runtime] Expected list, got ${v.type}`);
}

function asMap(v: KodeValue): Map<string, KodeValue> {
  if (v.type === 'map') return v.entries;
  throw new Error(`[Runtime] Expected map, got ${v.type}`);
}
