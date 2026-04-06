import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { Evaluator } from '../src/evaluator/evaluator.js';
import { Environment } from '../src/evaluator/environment.js';
import { registerBuiltins } from '../src/evaluator/builtins.js';
import { registerReStdlib } from '../src/stdlib/re.js';
import { registerEncStdlib } from '../src/stdlib/enc.js';
import { registerCryptoStdlib } from '../src/stdlib/crypto-mod.js';
import { registerUuidStdlib } from '../src/stdlib/uuid.js';
import { registerUrlStdlib } from '../src/stdlib/url-mod.js';
import { registerCsvStdlib } from '../src/stdlib/csv.js';
import { registerYamlStdlib } from '../src/stdlib/yaml-mod.js';
import { registerLogStdlib } from '../src/stdlib/log.js';
import { KodeValue, stringify } from '../src/evaluator/values.js';

function run(source: string): { result: KodeValue; output: string[] } {
  const tokens = new Lexer(source).tokenize();
  const ast = new Parser(tokens).parse();
  const evaluator = new Evaluator();
  const env = new Environment();
  const output: string[] = [];
  const callFn = (fn: KodeValue, args: KodeValue[]) => evaluator.callFn(fn, args);
  registerBuiltins(env, callFn);
  registerReStdlib(env); registerEncStdlib(env); registerCryptoStdlib(env);
  registerUuidStdlib(env); registerUrlStdlib(env); registerCsvStdlib(env);
  registerYamlStdlib(env); registerLogStdlib(env);
  const ioMap = env.get('io') as any;
  ioMap.entries.set('out', {
    type: 'native_fn', name: 'io.out',
    call: (args: KodeValue[]) => { output.push(args.map(stringify).join(' ')); return { type: 'null' } as KodeValue; },
  });
  const result = evaluator.evalProgram(ast, env);
  return { result, output };
}
function runStr(s: string): string { return stringify(run(s).result); }

describe('Phase 11 — Extended Integrations', () => {
  describe('std.re (regex)', () => {
    it('re.test matches pattern', () => {
      expect(runStr('re.test("^[0-9]+$", "12345")')).toBe('tr');
      expect(runStr('re.test("^[0-9]+$", "abc")')).toBe('fl');
    });
    it('re.match returns captures', () => {
      expect(runStr('re.match("(\\\\d+)-(\\\\d+)", "123-456")[0]')).toBe('123-456');
    });
    it('re.replace substitutes', () => {
      expect(runStr('re.replace("hello world", "world", "kode")')).toBe('hello kode');
    });
    it('re.split splits by pattern', () => {
      expect(runStr('len(re.split("a1b2c3", "[0-9]"))')).toBe('4');
    });
    it('re.find_all returns all matches', () => {
      expect(runStr('len(re.find_all("[0-9]+", "a1b22c333"))')).toBe('3');
    });
  });

  describe('std.enc (encoding)', () => {
    it('base64 encode/decode', () => {
      expect(runStr('enc.base64("hello")')).toBe('aGVsbG8=');
      expect(runStr('enc.base64_decode("aGVsbG8=")')).toBe('hello');
    });
    it('url encode/decode', () => {
      expect(runStr('enc.url_encode("hello world")')).toBe('hello%20world');
      expect(runStr('enc.url_decode("hello%20world")')).toBe('hello world');
    });
    it('hex encode/decode', () => {
      expect(runStr('enc.hex("AB")')).toBe('4142');
      expect(runStr('enc.hex_decode("4142")')).toBe('AB');
    });
  });

  describe('std.crypto', () => {
    it('sha256 hashes', () => {
      const hash = runStr('crypto.sha256("hello")');
      expect(hash).toHaveLength(64);
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });
    it('hmac generates', () => {
      const hmac = runStr('crypto.hmac("data", "secret")');
      expect(hmac).toHaveLength(64);
    });
    it('random_bytes generates hex string', () => {
      const bytes = runStr('crypto.random_bytes(16)');
      expect(bytes).toHaveLength(32); // 16 bytes = 32 hex chars
    });
  });

  describe('std.uuid', () => {
    it('generates valid v4 UUID', () => {
      const id = runStr('uuid.v4()');
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
    it('generates unique UUIDs', () => {
      const { output } = run('io.out(uuid.v4())\nio.out(uuid.v4())');
      expect(output[0]).not.toBe(output[1]);
    });
  });

  describe('std.url', () => {
    it('parses URL', () => {
      const { output } = run(`
        lt u = url.parse("https://api.example.com:8080/v1/users?page=2&limit=10#top")
        io.out(u.protocol)
        io.out(u.hostname)
        io.out(u.port)
        io.out(u.path)
        io.out(u.query.page)
      `);
      expect(output).toEqual(['https', 'api.example.com', '8080', '/v1/users', '2']);
    });
    it('builds URL', () => {
      expect(runStr('url.build(@{protocol|"https" host|"api.com" path|"/v1"})')).toBe('https://api.com/v1');
    });
  });

  describe('std.csv', () => {
    it('parses CSV string', () => {
      const { output } = run(`
        lt data = csv.parse("name,age\\nAda,30\\nBob,25")
        io.out(len(data))
        io.out(data[0].name)
        io.out(data[1].age)
      `);
      expect(output).toEqual(['2', 'Ada', '25']);
    });
    it('converts to CSV string', () => {
      const { output } = run(`
        lt data = @[@{name|"Ada" age|30} @{name|"Bob" age|25}]
        io.out(csv.to_str(data))
      `);
      expect(output[0]).toContain('name,age');
      expect(output[0]).toContain('Ada,30');
    });
    it('csv roundtrip', () => {
      expect(runStr(`
        lt data = @[@{x|1 y|2} @{x|3 y|4}]
        lt csvStr = csv.to_str(data)
        lt parsed = csv.parse(csvStr)
        parsed[1].y
      `)).toBe('4');
    });
  });

  describe('std.yaml', () => {
    it('parses YAML string', () => {
      const { output } = run(`
        lt data = yaml.parse("name: Ada\\nage: 30\\nactive: true")
        io.out(data.name)
        io.out(data.age)
        io.out(data.active)
      `);
      expect(output).toEqual(['Ada', '30', 'tr']);
    });
    it('converts to YAML string', () => {
      const { result } = run('yaml.to_str(@{name|"Kode" version|1})');
      expect(stringify(result)).toContain('name: Kode');
    });
  });

  describe('integration: all modules together', () => {
    it('regex + encoding + crypto pipeline', () => {
      const { output } = run(`
        lt email = "user@example.com"
        lt is_valid = re.test("^[\\\\w.]+@[\\\\w.]+$", email)
        lt encoded = enc.base64(email)
        lt hashed = crypto.sha256(email)
        io.out(is_valid)
        io.out(len(encoded) > 0)
        io.out(len(hashed))
      `);
      expect(output).toEqual(['tr', 'tr', '64']);
    });

    it('csv + uuid data pipeline', () => {
      const { output } = run(`
        lt rows = @[
          @{id|uuid.v4() name|"Ada"}
          @{id|uuid.v4() name|"Bob"}
        ]
        lt csvData = csv.to_str(rows)
        lt parsed = csv.parse(csvData)
        io.out(len(parsed))
        io.out(parsed[0].name)
      `);
      expect(output).toEqual(['2', 'Ada']);
    });
  });
});
