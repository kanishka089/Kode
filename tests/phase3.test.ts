import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { Evaluator } from '../src/evaluator/evaluator.js';
import { Environment } from '../src/evaluator/environment.js';
import { registerBuiltins } from '../src/evaluator/builtins.js';
import { KodeValue, stringify } from '../src/evaluator/values.js';

let evaluator: Evaluator;

function run(source: string): KodeValue {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  evaluator = new Evaluator();
  const env = new Environment();
  registerBuiltins(env, (fn, args) => evaluator.callFn(fn, args));
  return evaluator.evalProgram(ast, env);
}

function runStr(source: string): string {
  return stringify(run(source));
}

describe('Phase 3 — Functions & Composition', () => {
  // Extension functions
  describe('ext (extension functions)', () => {
    it('extends str with custom method', () => {
      expect(runStr(`
        ext str {
          fn is_empty() -> self.len == 0
        }
        "hello".is_empty()
      `)).toBe('fl');
    });

    it('extends str with parameterized method', () => {
      expect(runStr(`
        ext str {
          fn shout() -> str.upper(self) + "!"
        }
        "hello".shout()
      `)).toBe('HELLO!');
    });

    it('extends num with custom method', () => {
      expect(runStr(`
        ext num {
          fn double() -> self * 2
        }
        5.double()
      `)).toBe('10');
    });

    it('extends num with clamp method', () => {
      expect(runStr(`
        ext num {
          fn clamp(min, max) {
            if self < min { rt min }
            if self > max { rt max }
            rt self
          }
        }
        15.clamp(0, 10)
      `)).toBe('10');
    });
  });

  // Interfaces
  describe('it (interface declarations)', () => {
    it('parses interface declaration', () => {
      // Interface declarations are parsed and stored, no runtime error
      expect(runStr(`
        it Printable {
          fn to_str() :: str
        }
        "ok"
      `)).toBe('ok');
    });
  });

  // Decorators
  describe('decorators', () => {
    it('@cached memoizes results', () => {
      expect(runStr(`
        vr call_count = 0
        @cached
        fn expensive(x) {
          call_count += 1
          rt x * 2
        }
        expensive(5)
        expensive(5)
        expensive(5)
        call_count
      `)).toBe('1'); // Only called once, rest from cache
    });

    it('@cached with different args', () => {
      expect(runStr(`
        vr call_count = 0
        @cached
        fn calc(x) {
          call_count += 1
          rt x * 10
        }
        calc(1)
        calc(2)
        calc(1)
        call_count
      `)).toBe('2'); // Called twice (once for 1, once for 2)
    });
  });

  // Contracts
  describe('pre/post contracts', () => {
    it('pre: passes when condition met', () => {
      expect(runStr(`
        fn divide(a, b) {
          pre: b != 0
          rt a / b
        }
        divide(10, 2)
      `)).toBe('5');
    });

    it('pre: throws when condition violated', () => {
      expect(() => run(`
        fn divide(a, b) {
          pre: b != 0
          rt a / b
        }
        divide(10, 0)
      `)).toThrow(/Contract.*Precondition/);
    });

    it('post: validates return value', () => {
      expect(runStr(`
        fn abs_val(x) {
          post: result >= 0
          if x < 0 { rt -x }
          rt x
        }
        abs_val(-5)
      `)).toBe('5');
    });

    it('post: throws when postcondition violated', () => {
      expect(() => run(`
        fn bad_abs(x) {
          post: result >= 0
          rt x
        }
        bad_abs(-5)
      `)).toThrow(/Contract.*Postcondition/);
    });

    it('multiple pre conditions', () => {
      expect(runStr(`
        fn safe_divide(a, b) {
          pre: b != 0
          pre: a >= 0
          rt a / b
        }
        safe_divide(10, 2)
      `)).toBe('5');
    });
  });

  // Closures and higher-order functions
  describe('closures & HOFs', () => {
    it('closure captures enclosing variable', () => {
      expect(runStr(`
        fn make_adder(x) {
          rt |y| -> x + y
        }
        lt add10 = make_adder(10)
        add10(5)
      `)).toBe('15');
    });

    it('function as argument', () => {
      expect(runStr(`
        fn apply(f, x) { rt f(x) }
        fn triple(n) -> n * 3
        apply(triple, 7)
      `)).toBe('21');
    });

    it('returned lambda chains', () => {
      expect(runStr(`
        fn multiplier(factor) -> |x| -> x * factor
        lt double = multiplier(2)
        lt triple = multiplier(3)
        double(5) + triple(5)
      `)).toBe('25');
    });
  });
});
