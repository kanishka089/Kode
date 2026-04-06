// Kode stdlib — kode.* (Self-modifying code, meta-programming)

import { KodeValue, mkStr, mkNull, mkBool, mkMap, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';
import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';

type EvalCallback = (source: string, env: Environment) => KodeValue;

export function registerKodeRuntime(env: Environment, evalCb: EvalCallback): void {
  const kodeMod = new Map<string, KodeValue>();

  // kode.eval(source) — parse and execute Kode code from a string
  kodeMod.set('eval', {
    type: 'native_fn',
    name: 'kode.eval',
    call: (args: KodeValue[]) => {
      const source = args[0]?.type === 'str' ? args[0].value : '';
      try {
        const result = evalCb(source, env);
        const resultMap = new Map<string, KodeValue>();
        resultMap.set('ok', mkBool(true));
        resultMap.set('value', result);
        return mkMap(resultMap);
      } catch (e: any) {
        const resultMap = new Map<string, KodeValue>();
        resultMap.set('ok', mkBool(false));
        resultMap.set('error', mkStr(e.message ?? String(e)));
        return mkMap(resultMap);
      }
    },
  });

  // kode.parse(source) — parse source, return AST as string (for inspection)
  kodeMod.set('parse', {
    type: 'native_fn',
    name: 'kode.parse',
    call: (args: KodeValue[]) => {
      const source = args[0]?.type === 'str' ? args[0].value : '';
      try {
        const tokens = new Lexer(source).tokenize();
        const ast = new Parser(tokens).parse();
        return mkStr(JSON.stringify(ast, null, 2));
      } catch (e: any) {
        return mkStr(`Parse error: ${e.message}`);
      }
    },
  });

  // kode.version
  kodeMod.set('version', mkStr('0.1.0'));

  // kode.feedback(msg) — submit feedback for Kode Intelligence
  kodeMod.set('feedback', {
    type: 'native_fn',
    name: 'kode.feedback',
    call: (args: KodeValue[]) => {
      const msg = args[0]?.type === 'str' ? args[0].value : stringify(args[0]);
      console.log(`[kode.feedback] ${msg}`);
      // In production, this would be sent to the intelligence system
      return mkNull();
    },
  });

  // kode.suggest(msg) — suggest a feature
  kodeMod.set('suggest', {
    type: 'native_fn',
    name: 'kode.suggest',
    call: (args: KodeValue[]) => {
      const msg = args[0]?.type === 'str' ? args[0].value : stringify(args[0]);
      console.log(`[kode.suggest] ${msg}`);
      return mkNull();
    },
  });

  env.define('kode', mkMap(kodeMod));
}
