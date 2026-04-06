import { describe, it, expect } from 'vitest';
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
  registerBuiltins(env, (fn, args) => evaluator.callFn(fn, args));
  const ioMap = env.get('io') as any;
  ioMap.entries.set('out', {
    type: 'native_fn', name: 'io.out',
    call: (args: KodeValue[]) => { output.push(args.map(stringify).join(' ')); return { type: 'null' } as KodeValue; },
  });
  const result = evaluator.evalProgram(ast, env);
  return { result, output };
}

function runStr(source: string): string { return stringify(run(source).result); }

describe('Phase 5 — Tools, Memory, State, Safety', () => {
  // State Machines
  describe('st (state machines)', () => {
    it('creates and transitions state machine', () => {
      const { output } = run(`
        st TaskFlow {
          "idle" { on "start" -> "working" }
          "working" { on "done" -> "complete" on "fail" -> "error" }
          "complete" {}
          "error" { on "retry" -> "working" }
        }
        lt flow = TaskFlow.new()
        io.out(flow.state)
        flow.send("start")
        io.out(flow.state)
        flow.send("done")
        io.out(flow.state)
      `);
      expect(output).toEqual(['idle', 'working', 'complete']);
    });

    it('rejects invalid transitions', () => {
      expect(() => run(`
        st Light {
          "off" { on "toggle" -> "on" }
          "on" { on "toggle" -> "off" }
        }
        lt l = Light.new()
        l.send("invalid_event")
      `).result).toThrow(/Invalid transition/);
    });

    it('supports error recovery transitions', () => {
      const { output } = run(`
        st Pipeline {
          "ready" { on "run" -> "running" }
          "running" { on "success" -> "done" on "fail" -> "error" }
          "error" { on "retry" -> "running" on "abort" -> "ready" }
          "done" {}
        }
        lt p = Pipeline.new()
        p.send("run")
        p.send("fail")
        io.out(p.state)
        p.send("retry")
        p.send("success")
        io.out(p.state)
      `);
      expect(output).toEqual(['error', 'done']);
    });
  });

  // Memory
  describe('mem (memory subsystem)', () => {
    it('mem.w — working memory set/get', () => {
      expect(runStr(`
        mem.w.set("key", "value")
        mem.w.get("key")
      `)).toBe('value');
    });

    it('mem.w — has/delete/keys', () => {
      const { output } = run(`
        mem.w.set("a", 1)
        mem.w.set("b", 2)
        io.out(mem.w.has("a"))
        io.out(mem.w.keys())
        mem.w.delete("a")
        io.out(mem.w.has("a"))
      `);
      expect(output[0]).toBe('tr');
      expect(output[1]).toBe('@[a b]');
      expect(output[2]).toBe('fl');
    });

    it('mem.s — semantic memory store/recall', () => {
      expect(runStr(`
        mem.s.store("user_prefs", @{theme|"dark" lang|"en"})
        lt prefs = mem.s.recall("user_prefs")
        prefs.theme
      `)).toBe('dark');
    });

    it('mem.s — search', () => {
      const { output } = run(`
        mem.s.store("topic:ai", "artificial intelligence")
        mem.s.store("topic:ml", "machine learning")
        mem.s.store("other:db", "databases")
        lt results = mem.s.search("topic", 10)
        io.out(len(results))
      `);
      expect(output[0]).toBe('2');
    });

    it('mem.e — episodic memory log/last', () => {
      const { output } = run(`
        mem.e.log(@{event|"login" user|"Ada"})
        mem.e.log(@{event|"action" type|"search"})
        mem.e.log(@{event|"logout" user|"Ada"})
        lt recent = mem.e.last(2)
        io.out(len(recent))
        io.out(mem.e.len())
      `);
      expect(output).toEqual(['2', '3']);
    });

    it('mem.p — procedural memory learn/use', () => {
      expect(runStr(`
        mem.p.learn("greet", |name| -> "Hello, " + name + "!")
        lt greeter = mem.p.use("greet")
        greeter("Ada")
      `)).toBe('Hello, Ada!');
    });
  });

  // Agent with state machine + memory
  describe('agent with state + memory', () => {
    it('agent uses state machine and memory together', () => {
      const { output } = run(`
        st OrderFlow {
          "pending" { on "pay" -> "paid" }
          "paid" { on "ship" -> "shipped" }
          "shipped" { on "deliver" -> "delivered" }
          "delivered" {}
        }

        ag OrderAgent {
          vr flow = OrderFlow.new()

          on "advance" (p) {
            flow.send(p.action)
            mem.e.log(@{action|p.action state|flow.state})
            io.out("Order: " + flow.state)
          }
        }

        lt agent = sp OrderAgent
        em agent @{type|"advance" action|"pay"}
        em agent @{type|"advance" action|"ship"}
        em agent @{type|"advance" action|"deliver"}
        io.out("Events logged: " + mem.e.len())
      `);
      expect(output).toEqual([
        'Order: paid',
        'Order: shipped',
        'Order: delivered',
        'Events logged: 3',
      ]);
    });
  });
});
