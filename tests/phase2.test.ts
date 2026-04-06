import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { Evaluator } from '../src/evaluator/evaluator.js';
import { Environment } from '../src/evaluator/environment.js';
import { registerBuiltins } from '../src/evaluator/builtins.js';
import { KodeValue, stringify } from '../src/evaluator/values.js';

function run(source: string): KodeValue {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  const evaluator = new Evaluator();
  const env = new Environment();
  registerBuiltins(env, (fn, args) => evaluator.callFn(fn, args));
  return evaluator.evalProgram(ast, env);
}

function runStr(source: string): string {
  return stringify(run(source));
}

describe('Phase 2 — Data & Functional', () => {
  // String interpolation
  it('string interpolation with ${} ', () => {
    expect(runStr('lt x = "world"\n"hello ${x}"')).toBe('hello world');
  });

  it('string interpolation with expressions', () => {
    expect(runStr('"2 + 3 = ${2 + 3}"')).toBe('2 + 3 = 5');
  });

  // Higher-order list functions
  it('lst.map', () => {
    expect(runStr('lst.map(@[1 2 3], |x| -> x * 2)')).toBe('@[2 4 6]');
  });

  it('lst.filter', () => {
    expect(runStr('lst.filter(@[1 2 3 4 5], |x| -> x > 3)')).toBe('@[4 5]');
  });

  it('lst.reduce', () => {
    expect(runStr('lst.reduce(@[1 2 3 4 5], |acc, x| -> acc + x, 0)')).toBe('15');
  });

  it('lst.find', () => {
    expect(runStr('lst.find(@[1 2 3 4], |x| -> x > 2)')).toBe('3');
  });

  it('lst.unique', () => {
    expect(runStr('lst.unique(@[1 1 2 2 3])')).toBe('@[1 2 3]');
  });

  it('lst.chunk', () => {
    expect(runStr('lst.chunk(@[1 2 3 4], 2)')).toBe('@[@[1 2] @[3 4]]');
  });

  it('lst.join', () => {
    expect(runStr('lst.join(@["a" "b" "c"], "-")')).toBe('a-b-c');
  });

  it('lst.zip', () => {
    expect(runStr('lst.zip(@[1 2 3], @["a" "b" "c"])')).toBe('@[@[1 a] @[2 b] @[3 c]]');
  });

  // Pipe operator with HOFs
  it('pipe with filter and map', () => {
    expect(runStr('@[1 2 3 4 5] |> lst.filter(|x| -> x > 2) |> lst.map(|x| -> x * 10)')).toBe('@[30 40 50]');
  });

  // TOON
  it('nested TOON map access', () => {
    expect(runStr('lt m = @{a|@{b|42}}\nm.a.b')).toBe('42');
  });

  it('TOON list of maps', () => {
    expect(runStr('lt l = @[@{x|1} @{x|2}]\nl[1].x')).toBe('2');
  });

  // String stdlib
  it('str.upper and str.lower', () => {
    expect(runStr('str.upper("hello")')).toBe('HELLO');
    expect(runStr('str.lower("HELLO")')).toBe('hello');
  });

  it('str.split', () => {
    expect(runStr('str.split("a-b-c", "-")')).toBe('@[a b c]');
  });

  it('str.contains', () => {
    expect(runStr('str.contains("hello world", "world")')).toBe('tr');
    expect(runStr('str.contains("hello world", "xyz")')).toBe('fl');
  });

  it('str.replace', () => {
    expect(runStr('str.replace("hello world", "world", "kode")')).toBe('hello kode');
  });

  it('str.trim', () => {
    expect(runStr('str.trim("  hello  ")')).toBe('hello');
  });

  // Null coalescing
  it('?? returns left if not null', () => {
    expect(runStr('42 ?? 0')).toBe('42');
  });

  it('?? returns right if left is null', () => {
    expect(runStr('nl ?? "default"')).toBe('default');
  });

  // Match
  it('match with wildcard', () => {
    expect(runStr('vr r = ""\nmt 3 { 1 -> { r = "one" } 2 -> { r = "two" } _ -> { r = "other" } }\nr')).toBe('other');
  });

  // Lambda in variables
  it('lambda assigned to variable', () => {
    expect(runStr('lt double = |x| -> x * 2\ndouble(5)')).toBe('10');
  });

  it('lambda with block body', () => {
    expect(runStr('lt add = |a, b| { rt a + b }\nadd(3, 4)')).toBe('7');
  });

  // Map mutation
  it('map property assignment', () => {
    expect(runStr('vr m = @{x|1}\nm.x = 42\nm.x')).toBe('42');
  });

  // List index assignment
  it('list index assignment', () => {
    expect(runStr('vr l = @[10 20 30]\nl[1] = 99\nl[1]')).toBe('99');
  });

  // Empty collections
  it('empty map', () => {
    expect(runStr('lt m = @{}\nlen(m)')).toBe('0');
  });

  it('empty list', () => {
    expect(runStr('lt l = @[]\nlen(l)')).toBe('0');
  });
});
