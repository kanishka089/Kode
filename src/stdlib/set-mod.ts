// Kode stdlib — std.set (Set data structure)

import { KodeValue, mkBool, mkNum, mkNull, mkList, mkMap, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerSetStdlib(env: Environment): void {
  const setMod = new Map<string, KodeValue>();

  // set.new(items?) — create a new set
  setMod.set('new', { type: 'native_fn', name: 'set.new',
    call: (args: KodeValue[]) => {
      const store = new Set<string>();
      const items: KodeValue[] = [];

      if (args[0]?.type === 'list') {
        for (const item of args[0].items) {
          const key = stringify(item);
          if (!store.has(key)) { store.add(key); items.push(item); }
        }
      }

      return makeSetValue(store, items);
    }});

  // set.from(list) — create set from list
  setMod.set('from', setMod.get('new')!);

  // set.union(a, b) — combine two sets
  setMod.set('union', { type: 'native_fn', name: 'set.union',
    call: (args: KodeValue[]) => {
      const a = getSetItems(args[0]);
      const b = getSetItems(args[1]);
      const store = new Set<string>();
      const items: KodeValue[] = [];
      for (const item of [...a, ...b]) {
        const key = stringify(item);
        if (!store.has(key)) { store.add(key); items.push(item); }
      }
      return makeSetValue(store, items);
    }});

  // set.intersect(a, b) — items in both
  setMod.set('intersect', { type: 'native_fn', name: 'set.intersect',
    call: (args: KodeValue[]) => {
      const a = getSetItems(args[0]);
      const bKeys = new Set(getSetItems(args[1]).map(stringify));
      const store = new Set<string>();
      const items: KodeValue[] = [];
      for (const item of a) {
        const key = stringify(item);
        if (bKeys.has(key) && !store.has(key)) { store.add(key); items.push(item); }
      }
      return makeSetValue(store, items);
    }});

  // set.diff(a, b) — items in a but not b
  setMod.set('diff', { type: 'native_fn', name: 'set.diff',
    call: (args: KodeValue[]) => {
      const a = getSetItems(args[0]);
      const bKeys = new Set(getSetItems(args[1]).map(stringify));
      const store = new Set<string>();
      const items: KodeValue[] = [];
      for (const item of a) {
        const key = stringify(item);
        if (!bKeys.has(key) && !store.has(key)) { store.add(key); items.push(item); }
      }
      return makeSetValue(store, items);
    }});

  env.define('set', mkMap(setMod));
}

function makeSetValue(store: Set<string>, items: KodeValue[]): KodeValue {
  const m = new Map<string, KodeValue>();
  m.set('items', mkList(items));
  m.set('len', mkNum(items.length));
  m.set('has', { type: 'native_fn', name: 'set.has',
    call: (args: KodeValue[]) => mkBool(store.has(stringify(args[0]))) });
  m.set('add', { type: 'native_fn', name: 'set.add',
    call: (args: KodeValue[]) => {
      const key = stringify(args[0]);
      if (!store.has(key)) { store.add(key); items.push(args[0]); m.set('len', mkNum(items.length)); }
      return mkNull();
    }});
  m.set('to_list', { type: 'native_fn', name: 'set.to_list',
    call: () => mkList([...items]) });
  return mkMap(m);
}

function getSetItems(v: KodeValue): KodeValue[] {
  if (v.type === 'map' && v.entries.has('items')) {
    const items = v.entries.get('items');
    if (items?.type === 'list') return items.items;
  }
  if (v.type === 'list') return v.items;
  return [];
}
