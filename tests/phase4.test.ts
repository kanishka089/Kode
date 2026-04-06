import { describe, it, expect, vi } from 'vitest';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { Evaluator } from '../src/evaluator/evaluator.js';
import { Environment } from '../src/evaluator/environment.js';
import { registerBuiltins } from '../src/evaluator/builtins.js';
import { KodeValue, stringify } from '../src/evaluator/values.js';

function run(source: string): { result: KodeValue; output: string[] } {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  const evaluator = new Evaluator();
  const env = new Environment();
  const output: string[] = [];

  // Capture io.out calls
  registerBuiltins(env, (fn, args) => evaluator.callFn(fn, args));
  const ioMap = env.get('io') as any;
  ioMap.entries.set('out', {
    type: 'native_fn',
    name: 'io.out',
    call: (args: KodeValue[]) => {
      output.push(args.map(stringify).join(' '));
      return { type: 'null' } as KodeValue;
    },
  });

  const result = evaluator.evalProgram(ast, env);
  return { result, output };
}

describe('Phase 4 — Agents & Concurrency', () => {
  describe('ag (agent declaration)', () => {
    it('defines and spawns an agent', () => {
      const { output } = run(`
        ag Greeter {
          on "start" () {
            io.out("hello from agent")
          }
        }
        lt g = sp Greeter
      `);
      expect(output).toContain('hello from agent');
    });

    it('agent has its own state', () => {
      const { output } = run(`
        ag Counter {
          vr count = 0
          on "inc" (p) {
            count += 1
            io.out(count)
          }
        }
        lt c = sp Counter
        em c @{type|"inc"}
        em c @{type|"inc"}
        em c @{type|"inc"}
      `);
      expect(output).toEqual(['1', '2', '3']);
    });

    it('agent receives payload data', () => {
      const { output } = run(`
        ag Echo {
          on "say" (p) {
            io.out(p.msg)
          }
        }
        lt e = sp Echo
        em e @{type|"say" msg|"hello"}
        em e @{type|"say" msg|"world"}
      `);
      expect(output).toEqual(['hello', 'world']);
    });
  });

  describe('multi-agent communication', () => {
    it('agents pass messages to each other', () => {
      const { output } = run(`
        ag Producer {
          on "produce" (p) {
            io.out("producing")
            em "Consumer" @{type|"consume" item|"widget"}
          }
        }
        ag Consumer {
          on "consume" (p) {
            io.out("consumed: " + p.item)
          }
        }
        lt prod = sp Producer
        lt cons = sp Consumer
        em prod @{type|"produce"}
      `);
      expect(output).toContain('producing');
      expect(output).toContain('consumed: widget');
    });

    it('three-agent pipeline', () => {
      const { output } = run(`
        ag A {
          on "go" (p) {
            io.out("A")
            em "B" @{type|"go"}
          }
        }
        ag B {
          on "go" (p) {
            io.out("B")
            em "C" @{type|"go"}
          }
        }
        ag C {
          on "go" (p) {
            io.out("C done")
          }
        }
        lt a = sp A
        lt b = sp B
        lt c = sp C
        em a @{type|"go"}
      `);
      expect(output).toEqual(['A', 'B', 'C done']);
    });
  });

  describe('agent with functions', () => {
    it('agent can define and use internal functions', () => {
      const { output } = run(`
        ag Calculator {
          fn compute(x, y) {
            rt x + y
          }
          on "add" (p) {
            lt result = compute(p.a, p.b)
            io.out(result)
          }
        }
        lt calc = sp Calculator
        em calc @{type|"add" a|10 b|20}
      `);
      expect(output).toEqual(['30']);
    });
  });

  describe('spawn returns agent reference', () => {
    it('spawn returns map with id and name', () => {
      const { result } = run(`
        ag Worker {}
        lt w = sp Worker
        w.name
      `);
      expect(stringify(result)).toBe('Worker');
    });
  });

  describe('agent error handling', () => {
    it('agent error handler catches errors', () => {
      const { output } = run(`
        ag Fragile {
          on "crash" (p) {
            tw "something broke"
          }
          on "error" (err) {
            io.out("caught: " + err)
          }
        }
        lt f = sp Fragile
        em f @{type|"crash"}
      `);
      expect(output[0]).toContain('caught:');
    });
  });
});
