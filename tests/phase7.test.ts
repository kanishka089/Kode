import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { Evaluator } from '../src/evaluator/evaluator.js';
import { Environment } from '../src/evaluator/environment.js';
import { registerBuiltins } from '../src/evaluator/builtins.js';
import { KodeValue, stringify } from '../src/evaluator/values.js';

function run(source: string): { result: KodeValue; output: string[]; evaluator: Evaluator } {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  const evaluator = new Evaluator();
  const env = new Environment();
  const output: string[] = [];
  registerBuiltins(env, (fn, args) => evaluator.callFn(fn, args));
  const ioMap = env.get('io') as any;
  ioMap.entries.set('out', {
    type: 'native_fn', name: 'io.out',
    call: (args: KodeValue[]) => { output.push(args.map(stringify).join(' ')); return { type: 'null' } as KodeValue; },
  });
  const result = evaluator.evalProgram(ast, env);
  return { result, output, evaluator };
}

function runStr(source: string): string { return stringify(run(source).result); }

describe('Phase 7 — Streams & Testing', () => {
  describe('#test blocks', () => {
    it('collects test blocks during normal execution', () => {
      const { evaluator } = run(`
        #test "example" {
          assert(tr)
        }
      `);
      expect(evaluator.testBlocks.length).toBe(1);
      expect(evaluator.testBlocks[0].name).toBe('example');
    });

    it('tests dont run during normal execution', () => {
      const { output } = run(`
        #test "should not print" {
          io.out("this should not appear")
        }
      `);
      expect(output).toEqual([]); // Nothing printed
    });

    it('runTests executes all test blocks', () => {
      const { evaluator } = run(`
        fn add(a, b) { rt a + b }
        #test "add works" {
          assert_eq(add(2, 3), 5)
        }
        #test "add zero" {
          assert_eq(add(0, 0), 0)
        }
      `);
      // Suppress console output during test
      const origLog = console.log;
      console.log = () => {};
      const results = evaluator.runTests();
      console.log = origLog;
      expect(results.passed).toBe(2);
      expect(results.failed).toBe(0);
    });

    it('runTests catches failing tests', () => {
      const { evaluator } = run(`
        #test "will fail" {
          assert_eq(1, 2)
        }
      `);
      const origLog = console.log;
      console.log = () => {};
      const results = evaluator.runTests();
      console.log = origLog;
      expect(results.passed).toBe(0);
      expect(results.failed).toBe(1);
      expect(results.errors[0].name).toBe('will fail');
    });
  });

  describe('assert functions', () => {
    it('assert passes on truthy', () => {
      run('assert(tr)');
      run('assert(1)');
      run('assert("hello")');
    });

    it('assert fails on falsy', () => {
      expect(() => run('assert(fl)')).toThrow(/Assert/);
      expect(() => run('assert(nl)')).toThrow(/Assert/);
    });

    it('assert_eq passes on equal values', () => {
      run('assert_eq(5, 5)');
      run('assert_eq("hello", "hello")');
      run('assert_eq(tr, tr)');
    });

    it('assert_eq fails on unequal values', () => {
      expect(() => run('assert_eq(1, 2)')).toThrow(/Assert/);
    });

    it('assert_ne passes on unequal values', () => {
      run('assert_ne(1, 2)');
    });

    it('assert_ne fails on equal values', () => {
      expect(() => run('assert_ne(5, 5)')).toThrow(/Assert/);
    });
  });

  describe('streams', () => {
    it('stream.from creates stream from list', () => {
      expect(runStr(`
        lt s = stream.from(@[1 2 3 4 5])
        s.collect()
      `)).toBe('@[1 2 3 4 5]');
    });

    it('stream.map transforms items', () => {
      expect(runStr(`
        lt s = stream.from(@[1 2 3])
        s.map(|x| -> x * 2)
        s.collect()
      `)).toBe('@[2 4 6]');
    });

    it('stream.filter removes items', () => {
      expect(runStr(`
        lt s = stream.from(@[1 2 3 4 5])
        s.filter(|x| -> x > 3)
        s.collect()
      `)).toBe('@[4 5]');
    });

    it('stream.batch groups items', () => {
      expect(runStr(`
        lt s = stream.from(@[1 2 3 4 5 6])
        s.batch(2)
        s.collect()
      `)).toBe('@[@[1 2] @[3 4] @[5 6]]');
    });

    it('stream.take limits items', () => {
      expect(runStr(`
        lt s = stream.from(@[1 2 3 4 5])
        s.take(3)
        s.collect()
      `)).toBe('@[1 2 3]');
    });

    it('stream.skip skips items', () => {
      expect(runStr(`
        lt s = stream.from(@[1 2 3 4 5])
        s.skip(2)
        s.collect()
      `)).toBe('@[3 4 5]');
    });

    it('stream.count returns length', () => {
      expect(runStr(`
        lt s = stream.from(@[1 2 3])
        s.count()
      `)).toBe('3');
    });

    it('stream.reduce aggregates', () => {
      expect(runStr(`
        lt s = stream.from(@[1 2 3 4 5])
        s.reduce(|acc, x| -> acc + x, 0)
      `)).toBe('15');
    });

    it('stream chaining', () => {
      expect(runStr(`
        lt result = stream.from(@[1 2 3 4 5 6 7 8 9 10])
        result.filter(|x| -> x % 2 == 0)
        result.map(|x| -> x * 10)
        result.take(3)
        result.collect()
      `)).toBe('@[20 40 60]');
    });

    it('stream.range creates numeric stream', () => {
      expect(runStr(`
        lt s = stream.range(0, 5)
        s.collect()
      `)).toBe('@[0 1 2 3 4]');
    });
  });
});
