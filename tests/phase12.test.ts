import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { Evaluator } from '../src/evaluator/evaluator.js';
import { Environment } from '../src/evaluator/environment.js';
import { registerBuiltins } from '../src/evaluator/builtins.js';
import { registerTimeStdlib } from '../src/stdlib/time.js';
import { registerSetStdlib } from '../src/stdlib/set-mod.js';
import { registerNetStdlib } from '../src/stdlib/net.js';
import { KodeValue, stringify } from '../src/evaluator/values.js';

function run(source: string): { result: KodeValue; output: string[] } {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  const evaluator = new Evaluator();
  const env = new Environment();
  const output: string[] = [];
  const callFn = (fn: KodeValue, args: KodeValue[]) => evaluator.callFn(fn, args);
  registerBuiltins(env, callFn);
  registerTimeStdlib(env);
  registerSetStdlib(env);
  registerNetStdlib(env);
  const ioMap = env.get('io') as any;
  ioMap.entries.set('out', {
    type: 'native_fn', name: 'io.out',
    call: (args: KodeValue[]) => { output.push(args.map(stringify).join(' ')); return { type: 'null' } as KodeValue; },
  });
  const result = evaluator.evalProgram(ast, env);
  return { result, output };
}
function runStr(s: string): string { return stringify(run(s).result); }

describe('Phase 12 — Frontier', () => {
  describe('std.time', () => {
    it('time.now returns milliseconds', () => {
      const { result } = run('time.now()');
      expect(result.type).toBe('num');
      expect((result as any).value).toBeGreaterThan(0);
    });

    it('time.iso returns ISO string', () => {
      const { result } = run('time.iso()');
      expect(result.type).toBe('str');
      expect((result as any).value).toContain('T');
    });

    it('time.unix returns seconds', () => {
      const { result } = run('time.unix()');
      expect(result.type).toBe('num');
      expect((result as any).value).toBeGreaterThan(1700000000);
    });

    it('time.parse parses date string', () => {
      expect(runStr('time.parse("2026-01-01T00:00:00Z")')).toBe('1767225600000');
    });

    it('time.diff calculates difference', () => {
      expect(runStr('time.diff(1000, 500)')).toBe('500');
    });

    it('time.date returns date parts', () => {
      const { result } = run('time.date()');
      expect(result.type).toBe('map');
      expect((result as any).entries.has('year')).toBe(true);
      expect((result as any).entries.has('month')).toBe(true);
      expect((result as any).entries.has('day')).toBe(true);
    });

    it('time.measure tracks elapsed', () => {
      const { result } = run('lt t = time.measure()\nt');
      expect(result.type).toBe('map');
    });
  });

  describe('std.set', () => {
    it('set.new creates empty set', () => {
      expect(runStr('lt s = set.new()\ns.len')).toBe('0');
    });

    it('set.new from list deduplicates', () => {
      expect(runStr('lt s = set.new(@[1 1 2 2 3])\ns.len')).toBe('3');
    });

    it('set.has checks membership', () => {
      const { output } = run(`
        lt s = set.new(@[1 2 3])
        io.out(s.has(2))
        io.out(s.has(5))
      `);
      expect(output).toEqual(['tr', 'fl']);
    });

    it('set.add adds unique items', () => {
      expect(runStr(`
        lt s = set.new(@[1 2])
        s.add(3)
        s.add(2)
        s.len
      `)).toBe('3');
    });

    it('set.to_list converts to list', () => {
      expect(runStr('set.new(@[3 1 2 1]).to_list()')).toBe('@[3 1 2]');
    });

    it('set.union combines sets', () => {
      expect(runStr(`
        lt a = set.new(@[1 2 3])
        lt b = set.new(@[3 4 5])
        lt c = set.union(a, b)
        c.len
      `)).toBe('5');
    });

    it('set.intersect finds common', () => {
      expect(runStr(`
        lt a = set.new(@[1 2 3 4])
        lt b = set.new(@[3 4 5 6])
        lt c = set.intersect(a, b)
        c.to_list()
      `)).toBe('@[3 4]');
    });

    it('set.diff finds difference', () => {
      expect(runStr(`
        lt a = set.new(@[1 2 3 4])
        lt b = set.new(@[3 4 5])
        lt c = set.diff(a, b)
        c.to_list()
      `)).toBe('@[1 2]');
    });
  });

  describe('integration', () => {
    it('time + set together', () => {
      const { output } = run(`
        lt timer = time.measure()
        lt s = set.new(@[1 2 3 4 5 1 2 3])
        io.out("Unique: " + s.len)
        io.out("Year: " + time.date().year)
      `);
      expect(output[0]).toBe('Unique: 5');
      expect(output[1]).toContain('Year: 202');
    });
  });
});
