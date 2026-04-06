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

describe('Evaluator', () => {
  it('evaluates arithmetic', () => {
    expect(runStr('2 + 3')).toBe('5');
    expect(runStr('10 - 4')).toBe('6');
    expect(runStr('3 * 7')).toBe('21');
    expect(runStr('15 / 3')).toBe('5');
    expect(runStr('2 ** 10')).toBe('1024');
    expect(runStr('17 % 5')).toBe('2');
  });

  it('evaluates variables', () => {
    expect(runStr('lt x = 42\nx')).toBe('42');
    expect(runStr('vr x = 1\nx = 2\nx')).toBe('2');
  });

  it('evaluates functions', () => {
    expect(runStr('fn add(a, b) { rt a + b }\nadd(3, 4)')).toBe('7');
  });

  it('evaluates arrow functions', () => {
    expect(runStr('fn double(x) -> x * 2\ndouble(5)')).toBe('10');
  });

  it('evaluates recursion (fibonacci)', () => {
    expect(runStr('fn fib(n) { if n <= 1 { rt n }\nrt fib(n-1) + fib(n-2) }\nfib(10)')).toBe('55');
  });

  it('evaluates if/ef/el', () => {
    expect(runStr('lt x = 5\nvr result = "none"\nif x > 10 { result = "big" } ef x > 3 { result = "med" } el { result = "small" }\nresult')).toBe('med');
  });

  it('evaluates while loop', () => {
    expect(runStr('vr x = 0\nwl x < 5 { x += 1 }\nx')).toBe('5');
  });

  it('evaluates for loop with range', () => {
    expect(runStr('vr sum = 0\nfr i : 0..5 { sum += i }\nsum')).toBe('10');
  });

  it('evaluates TOON maps', () => {
    expect(runStr('lt m = @{name|"Ada" age|30}\nm.name')).toBe('Ada');
    expect(runStr('lt m = @{x|10}\nm.x')).toBe('10');
  });

  it('evaluates TOON lists', () => {
    expect(runStr('lt l = @[1 2 3]\nl[0]')).toBe('1');
    expect(runStr('lt l = @[10 20 30]\nlen(l)')).toBe('3');
  });

  it('evaluates string concatenation', () => {
    expect(runStr('"hello" + " " + "world"')).toBe('hello world');
  });

  it('evaluates comparison operators', () => {
    expect(runStr('5 > 3')).toBe('tr');
    expect(runStr('5 < 3')).toBe('fl');
    expect(runStr('5 == 5')).toBe('tr');
    expect(runStr('5 != 3')).toBe('tr');
  });

  it('evaluates logical operators', () => {
    expect(runStr('tr & tr')).toBe('tr');
    expect(runStr('tr & fl')).toBe('fl');
    expect(runStr('fl | tr')).toBe('tr');
    expect(runStr('!tr')).toBe('fl');
  });

  it('evaluates compound assignment', () => {
    expect(runStr('vr x = 10\nx += 5\nx')).toBe('15');
    expect(runStr('vr x = 10\nx -= 3\nx')).toBe('7');
    expect(runStr('vr x = 10\nx *= 2\nx')).toBe('20');
  });

  it('evaluates nested function calls', () => {
    expect(runStr('fn add(a, b) { rt a + b }\nfn mul(a, b) { rt a * b }\nadd(mul(2, 3), mul(4, 5))')).toBe('26');
  });

  it('evaluates closures', () => {
    // Closures via lambdas (fn as expression not yet supported)
    expect(runStr(`
      fn make_adder(x) {
        rt |y| -> x + y
      }
      lt add5 = make_adder(5)
      add5(3)
    `)).toBe('8');
  });

  it('evaluates try/catch', () => {
    expect(runStr('vr result = ""\ntx { tw "oops" } ct e { result = e }\nresult')).toBe('oops');
  });

  it('evaluates break in loop', () => {
    expect(runStr('vr x = 0\nlp { x += 1; if x == 5 { br } }\nx')).toBe('5');
  });

  it('prevents reassignment of lt', () => {
    expect(() => run('lt x = 1\nx = 2')).toThrow(/immutable/);
  });

  it('detects undefined variables', () => {
    expect(() => run('x + 1')).toThrow(/Undefined/);
  });
});
