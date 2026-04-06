import { describe, it, expect, afterEach } from 'vitest';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { Evaluator } from '../src/evaluator/evaluator.js';
import { Environment } from '../src/evaluator/environment.js';
import { registerBuiltins } from '../src/evaluator/builtins.js';
import { registerDbStdlib } from '../src/stdlib/db.js';
import { registerWebStdlib } from '../src/stdlib/web.js';
import { KodeValue, stringify } from '../src/evaluator/values.js';
import { unlinkSync } from 'fs';

function run(source: string): { result: KodeValue; output: string[] } {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  const evaluator = new Evaluator();
  const env = new Environment();
  const output: string[] = [];
  const callFn = (fn: KodeValue, args: KodeValue[]) => evaluator.callFn(fn, args);
  registerBuiltins(env, callFn);
  registerDbStdlib(env);
  registerWebStdlib(env, callFn);
  const ioMap = env.get('io') as any;
  ioMap.entries.set('out', {
    type: 'native_fn', name: 'io.out',
    call: (args: KodeValue[]) => { output.push(args.map(stringify).join(' ')); return { type: 'null' } as KodeValue; },
  });
  const result = evaluator.evalProgram(ast, env);
  return { result, output };
}

function runStr(source: string): string { return stringify(run(source).result); }

const TEST_DB = 'test_kode.db';

afterEach(() => {
  try { unlinkSync(TEST_DB); } catch {}
});

describe('Phase 6 — Full-Stack', () => {
  describe('std.db (SQLite)', () => {
    it('creates table and inserts data', () => {
      const { output } = run(`
        lt store = db.open("sqlite:${TEST_DB}")
        store.exec("create table users (id integer primary key, name text, age integer)")
        store.exec("insert into users values (1, 'Ada', 30)")
        store.exec("insert into users values (2, 'Bob', 25)")
        lt users = store.query("select * from users")
        io.out(len(users))
        io.out(users[0].name)
        io.out(users[1].age)
        store.close()
      `);
      expect(output).toEqual(['2', 'Ada', '25']);
    });

    it('parameterized queries', () => {
      const { output } = run(`
        lt store = db.open("sqlite:${TEST_DB}")
        store.exec("create table items (id integer primary key, name text)")
        store.exec("insert into items (name) values (?)", @["Widget"])
        store.exec("insert into items (name) values (?)", @["Gadget"])
        lt items = store.query("select * from items where name = ?", @["Widget"])
        io.out(len(items))
        io.out(items[0].name)
        store.close()
      `);
      expect(output).toEqual(['1', 'Widget']);
    });

    it('db.get returns single row', () => {
      expect(runStr(`
        lt store = db.open("sqlite:${TEST_DB}")
        store.exec("create table kv (key text, val text)")
        store.exec("insert into kv values ('name', 'Kode')")
        lt row = store.get("select * from kv where key = ?", @["name"])
        store.close()
        row.val
      `)).toBe('Kode');
    });

    it('in-memory database', () => {
      const { output } = run(`
        lt store = db.open(":memory:")
        store.exec("create table t (x integer)")
        store.exec("insert into t values (42)")
        lt rows = store.query("select * from t")
        io.out(rows[0].x)
        store.close()
      `);
      expect(output).toEqual(['42']);
    });

    it('handles empty results', () => {
      expect(runStr(`
        lt store = db.open(":memory:")
        store.exec("create table t (x integer)")
        lt rows = store.query("select * from t")
        store.close()
        len(rows)
      `)).toBe('0');
    });
  });

  describe('web.json and web.html response helpers', () => {
    it('web.json creates json response', () => {
      const { result } = run(`
        lt resp = web.json(@{name|"Ada" age|30})
        resp
      `);
      // web.json wraps in a map with __type, __status, __body
      expect(result.type).toBe('map');
    });

    it('web.html creates html response', () => {
      const { result } = run(`
        lt resp = web.html("<h1>Hello</h1>")
        resp
      `);
      expect(result.type).toBe('map');
    });

    it('web.route registers a route', () => {
      // Just ensure it doesn't throw
      run(`
        web.route("GET", "/test", |req| -> web.json(@{ok|tr}))
      `);
    });
  });

  describe('full-stack integration', () => {
    it('database + agents + state machines together', () => {
      const { output } = run(`
        lt store = db.open(":memory:")
        store.exec("create table orders (id integer primary key, status text)")

        st OrderFlow {
          "new" { on "pay" -> "paid" }
          "paid" { on "ship" -> "shipped" }
          "shipped" {}
        }

        ag OrderProcessor {
          vr flow = OrderFlow.new()

          on "process" (p) {
            store.exec("insert into orders (status) values (?)", @[flow.state])
            flow.send(p.action)
            store.exec("update orders set status = ? where id = 1", @[flow.state])
            io.out("Order: " + flow.state)
          }
        }

        lt proc = sp OrderProcessor
        em proc @{type|"process" action|"pay"}
        em proc @{type|"process" action|"ship"}

        lt orders = store.query("select * from orders")
        io.out("DB rows: " + len(orders))
        store.close()
      `);
      expect(output).toContain('Order: paid');
      expect(output).toContain('Order: shipped');
      // Two process events = two inserts
      expect(output).toContain('DB rows: 2');
    });
  });
});
