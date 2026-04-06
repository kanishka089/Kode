import { describe, it, expect, afterEach } from 'vitest';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { Evaluator } from '../src/evaluator/evaluator.js';
import { Environment } from '../src/evaluator/environment.js';
import { registerBuiltins } from '../src/evaluator/builtins.js';
import { registerJsonStdlib } from '../src/stdlib/json-mod.js';
import { registerEnvStdlib } from '../src/stdlib/env-mod.js';
import { registerFsStdlib } from '../src/stdlib/fs-mod.js';
import { registerProcStdlib } from '../src/stdlib/proc.js';
import { registerAiStdlib } from '../src/stdlib/ai.js';
import { registerKodeRuntime } from '../src/stdlib/kode-runtime.js';
import { KodeValue, stringify } from '../src/evaluator/values.js';
import { writeFileSync, unlinkSync } from 'fs';

function run(source: string): { result: KodeValue; output: string[] } {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  const evaluator = new Evaluator();
  const env = new Environment();
  const output: string[] = [];
  const callFn = (fn: KodeValue, args: KodeValue[]) => evaluator.callFn(fn, args);
  registerBuiltins(env, callFn);
  registerJsonStdlib(env);
  registerEnvStdlib(env);
  registerFsStdlib(env);
  registerProcStdlib(env);
  registerAiStdlib(env);
  registerKodeRuntime(env, (src, evalEnv) => {
    const t = new Lexer(src).tokenize();
    const a = new Parser(t).parse();
    return evaluator.evalProgram(a, evalEnv);
  });
  const ioMap = env.get('io') as any;
  ioMap.entries.set('out', {
    type: 'native_fn', name: 'io.out',
    call: (args: KodeValue[]) => { output.push(args.map(stringify).join(' ')); return { type: 'null' } as KodeValue; },
  });
  const result = evaluator.evalProgram(ast, env);
  return { result, output };
}

function runStr(source: string): string { return stringify(run(source).result); }

describe('Phase 10 — AI Gateway + Essential Integrations', () => {
  describe('std.json', () => {
    it('json.parse parses JSON string', () => {
      expect(runStr('json.parse(\'{"name":"Ada","age":30}\').name')).toBe('Ada');
    });

    it('json.parse handles arrays', () => {
      expect(runStr('len(json.parse("[1,2,3]"))')).toBe('3');
    });

    it('json.to_str converts Kode value to JSON', () => {
      const { output } = run('io.out(json.to_compact(@{x|1 y|2}))');
      expect(output[0]).toBe('{"x":1,"y":2}');
    });

    it('json roundtrip', () => {
      expect(runStr(`
        lt data = @{name|"Kode" version|1}
        lt jsonStr = json.to_compact(data)
        lt parsed = json.parse(jsonStr)
        parsed.name
      `)).toBe('Kode');
    });
  });

  describe('std.env', () => {
    it('env.set and env.get', () => {
      expect(runStr('env.set("KODE_TEST", "hello")\nenv.get("KODE_TEST")')).toBe('hello');
    });

    it('env.get with fallback', () => {
      expect(runStr('env.get("NONEXISTENT_VAR_XYZ", "default")')).toBe('default');
    });

    it('env.has', () => {
      const { output } = run(`
        env.set("KODE_CHECK", "1")
        io.out(env.has("KODE_CHECK"))
        io.out(env.has("TOTALLY_MISSING"))
      `);
      expect(output).toEqual(['tr', 'fl']);
    });

    it('env.load parses .env file', () => {
      writeFileSync('test.env', 'KEY1=value1\nKEY2="value2"\n# comment\nKEY3=value3');
      try {
        run('env.load("test.env")');
        expect(process.env.KEY1).toBe('value1');
        expect(process.env.KEY2).toBe('value2');
        expect(process.env.KEY3).toBe('value3');
      } finally {
        unlinkSync('test.env');
        delete process.env.KEY1;
        delete process.env.KEY2;
        delete process.env.KEY3;
      }
    });
  });

  describe('std.fs', () => {
    const testFile = 'kode_test_file.txt';
    afterEach(() => { try { unlinkSync(testFile); } catch {} });

    it('fs.write and fs.read', () => {
      expect(runStr(`
        fs.write("${testFile}", "hello kode")
        fs.read("${testFile}")
      `)).toBe('hello kode');
    });

    it('fs.exists', () => {
      const { output } = run(`
        io.out(fs.exists("${testFile}"))
        fs.write("${testFile}", "test")
        io.out(fs.exists("${testFile}"))
      `);
      expect(output).toEqual(['fl', 'tr']);
    });

    it('fs.list returns directory contents', () => {
      const { result } = run('fs.list(".")');
      expect(result.type).toBe('list');
    });

    it('fs.stat returns file info', () => {
      run(`fs.write("${testFile}", "hello")`);
      const { output } = run(`
        lt s = fs.stat("${testFile}")
        io.out(s.is_file)
        io.out(s.size)
      `);
      expect(output[0]).toBe('tr');
      expect(output[1]).toBe('5');
    });
  });

  describe('std.proc', () => {
    it('proc.exec runs command', () => {
      const { result } = run('proc.exec("echo hello")');
      expect(stringify(result)).toBe('hello');
    });

    it('proc.cwd returns current directory', () => {
      const { result } = run('proc.cwd()');
      expect(result.type).toBe('str');
      expect(stringify(result).length).toBeGreaterThan(0);
    });

    it('proc.platform returns os', () => {
      const { result } = run('proc.platform');
      expect(['win32', 'linux', 'darwin']).toContain(stringify(result));
    });
  });

  describe('std.ai', () => {
    it('ai.models returns model list', () => {
      const { result } = run('ai.models()');
      expect(result.type).toBe('list');
    });

    it('ai.token_count estimates tokens', () => {
      expect(runStr('ai.token_count("hello world")')).toBe('3');
    });
  });

  describe('kode.eval (self-modifying code)', () => {
    it('kode.eval executes code string', () => {
      expect(runStr(`
        lt result = kode.eval("2 + 3")
        result.ok
      `)).toBe('tr');
    });

    it('kode.eval returns result value', () => {
      const { output } = run(`
        lt result = kode.eval("2 + 3")
        io.out(result.value)
      `);
      expect(output[0]).toBe('5');
    });

    it('kode.eval handles errors', () => {
      expect(runStr(`
        lt result = kode.eval("undefined_var + 1")
        result.ok
      `)).toBe('fl');
    });

    it('kode.parse returns AST', () => {
      const { result } = run('kode.parse("lt x = 1")');
      expect(result.type).toBe('str');
      expect(stringify(result)).toContain('LetDecl');
    });
  });

  describe('integration: fs + json + proc', () => {
    const testFile = 'kode_integration_test.json';
    afterEach(() => { try { unlinkSync(testFile); } catch {} });

    it('write JSON to file, read it back', () => {
      const { output } = run(`
        lt data = @{users|@[@{name|"Ada"} @{name|"Bob"}] count|2}
        fs.write("${testFile}", json.to_str(data))
        lt loaded = json.parse(fs.read("${testFile}"))
        io.out(loaded.count)
        io.out(loaded.users[0].name)
      `);
      expect(output).toEqual(['2', 'Ada']);
    });
  });
});
