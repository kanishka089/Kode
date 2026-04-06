// Kode Language — Runtime Value Types

import type { Stmt, Expr, Param } from '../parser/ast.js';
import type { Environment } from './environment.js';

export type KodeValue =
  | KodeNum | KodeStr | KodeBool | KodeNull
  | KodeList | KodeMap
  | KodeFn | KodeNativeFn
  | KodeRange
  | KodeStateMachine;

export interface KodeNum { type: 'num'; value: number; }
export interface KodeStr { type: 'str'; value: string; }
export interface KodeBool { type: 'bool'; value: boolean; }
export interface KodeNull { type: 'null'; }
export interface KodeList { type: 'list'; items: KodeValue[]; }
export interface KodeMap { type: 'map'; entries: Map<string, KodeValue>; }
export interface KodeRange { type: 'range'; start: number; end: number; inclusive: boolean; }

export interface KodeStateMachine {
  type: 'state_machine';
  name: string;
  current: string;
  transitions: Map<string, Map<string, string>>; // state -> event -> target
}

export interface KodeFn {
  type: 'fn';
  name: string;
  params: Param[];
  body: Stmt[] | Expr;
  closure: Environment;
}

export interface KodeNativeFn {
  type: 'native_fn';
  name: string;
  call: (args: KodeValue[]) => KodeValue;
}

// --- Helpers ---

export function mkNum(n: number): KodeNum { return { type: 'num', value: n }; }
export function mkStr(s: string): KodeStr { return { type: 'str', value: s }; }
export function mkBool(b: boolean): KodeBool { return { type: 'bool', value: b }; }
export function mkNull(): KodeNull { return { type: 'null' }; }
export function mkList(items: KodeValue[]): KodeList { return { type: 'list', items }; }
export function mkMap(entries: Map<string, KodeValue>): KodeMap { return { type: 'map', entries }; }

export function isTruthy(v: KodeValue): boolean {
  if (v.type === 'null') return false;
  if (v.type === 'bool') return v.value;
  if (v.type === 'num') return v.value !== 0;
  if (v.type === 'str') return v.value.length > 0;
  if (v.type === 'list') return v.items.length > 0;
  return true;
}

export function stringify(v: KodeValue): string {
  switch (v.type) {
    case 'num': return String(v.value);
    case 'str': return v.value;
    case 'bool': return v.value ? 'tr' : 'fl';
    case 'null': return 'nl';
    case 'list': return '@[' + v.items.map(stringify).join(' ') + ']';
    case 'map': {
      const pairs = [...v.entries].map(([k, val]) => `${k}|${stringify(val)}`);
      return '@{' + pairs.join(' ') + '}';
    }
    case 'fn': return `<fn ${v.name}>`;
    case 'native_fn': return `<native ${v.name}>`;
    case 'range': return `${v.start}..${v.inclusive ? '=' : ''}${v.end}`;
    case 'state_machine': return `<state_machine:${v.name}@${v.current}>`;
  }
}

export function kodeEquals(a: KodeValue, b: KodeValue): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'num' && b.type === 'num') return a.value === b.value;
  if (a.type === 'str' && b.type === 'str') return a.value === b.value;
  if (a.type === 'bool' && b.type === 'bool') return a.value === b.value;
  if (a.type === 'null' && b.type === 'null') return true;
  return a === b; // reference equality for complex types
}
