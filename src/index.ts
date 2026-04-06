#!/usr/bin/env node
// Kode Language — CLI Entry Point

import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { Lexer } from './lexer/lexer.js';
import { Parser } from './parser/parser.js';
import { Evaluator } from './evaluator/evaluator.js';
import { Environment } from './evaluator/environment.js';
import { registerBuiltins } from './evaluator/builtins.js';
import { registerWebStdlib } from './stdlib/web.js';
import { registerDbStdlib } from './stdlib/db.js';
import { stringify, KodeValue } from './evaluator/values.js';
import { TokenType } from './lexer/tokens.js';
import { formatError } from './errors/reporter.js';
import { kpmInit, kpmAdd, kpmPublish, kpmSearch, kpmList } from './runtime/kpm.js';
import { listFeatures } from './runtime/features.js';
import { intelligence } from './runtime/intelligence.js';

const VERSION = '0.1.0';

const globalEvaluator = new Evaluator();

function createGlobalEnv(): Environment {
  const env = new Environment();
  const callFn = (fn: KodeValue, args: KodeValue[]) => globalEvaluator.callFn(fn, args);
  registerBuiltins(env, callFn);
  registerWebStdlib(env, callFn);
  registerDbStdlib(env);
  return env;
}

function run(source: string, env: Environment, showResult = false): KodeValue | null {
  try {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const result = globalEvaluator.evalProgram(ast, env);
    if (showResult && result.type !== 'null') {
      console.log(stringify(result));
    }
    return result;
  } catch (e: any) {
    console.error(formatError(e.message || String(e), source));
    return null;
  }
}

import { readdirSync } from 'fs';

function runTests(paths: string[]): void {
  let files: string[] = [];

  if (paths.length === 0) {
    // Find all .kd files in current directory
    try {
      files = readdirSync('.').filter(f => f.endsWith('.kd'));
    } catch { files = []; }
  } else {
    files = paths;
  }

  if (files.length === 0) {
    console.log('No .kd files found');
    return;
  }

  let totalPassed = 0;
  let totalFailed = 0;

  for (const file of files) {
    const source = readFileSync(file, 'utf-8');
    const env = createGlobalEnv();

    try {
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      globalEvaluator.evalProgram(ast, env);

      if (globalEvaluator.testBlocks.length > 0) {
        console.log(`\n${file}:`);
        const { passed, failed } = globalEvaluator.runTests();
        totalPassed += passed;
        totalFailed += failed;
      }
    } catch (e: any) {
      console.error(`Error in ${file}: ${e.message}`);
      totalFailed++;
    }
  }

  console.log(`\n${totalPassed + totalFailed} tests: ${totalPassed} passed, ${totalFailed} failed`);
  if (totalFailed > 0) process.exit(1);
}

function runFile(path: string, showTime = false): void {
  const source = readFileSync(path, 'utf-8');
  const env = createGlobalEnv();
  const start = performance.now();
  run(source, env);
  if (showTime) {
    const elapsed = (performance.now() - start).toFixed(2);
    console.log(`\n\x1b[90m[${elapsed}ms]\x1b[0m`);
  }
}

function runRepl(): void {
  console.log(`Kode v${VERSION} — REPL`);
  console.log('Type expressions or statements. Use .exit to quit.\n');

  const env = createGlobalEnv();
  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: 'kode> ' });

  rl.prompt();
  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (trimmed === '.exit' || trimmed === '.quit') { rl.close(); return; }
    if (trimmed === '.help') {
      console.log('  .exit   Exit the REPL');
      console.log('  .help   Show this help');
      rl.prompt();
      return;
    }
    if (trimmed) run(trimmed, env, true);
    rl.prompt();
  });

  rl.on('close', () => { console.log('\nBye!'); process.exit(0); });
}

function printTokens(path: string): void {
  const source = readFileSync(path, 'utf-8');
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  for (const t of tokens) {
    console.log(`${t.line}:${t.col}\t${TokenType[t.type]}\t${t.lexeme}\t${t.literal !== null ? JSON.stringify(t.literal) : ''}`);
  }
}

function printAst(path: string): void {
  const source = readFileSync(path, 'utf-8');
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  console.log(JSON.stringify(ast, null, 2));
}

// --- Main ---
const args = process.argv.slice(2);

if (args.length === 0) {
  runRepl();
} else if (args[0] === '--version' || args[0] === '-v') {
  console.log(`Kode v${VERSION}`);
} else if (args[0] === '--tokens' && args[1]) {
  printTokens(args[1]);
} else if (args[0] === '--ast' && args[1]) {
  printAst(args[1]);
} else if (args[0] === 'test') {
  runTests(args.slice(1));
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`Kode v${VERSION} — Token-efficient language for AI agents`);
  console.log();
  console.log('Usage:');
  console.log('  kode                   Start REPL');
  console.log('  kode <file.kd>         Execute a file');
  console.log('  kode test <file.kd>    Run #test blocks');
  console.log('  kode --tokens <file>   Print tokens');
  console.log('  kode --ast <file>      Print AST');
  console.log('  kode --version         Print version');
} else if (args[0] === '--time' && args[1]) {
  runFile(args[1], true);
} else if (args[0] === 'kpm') {
  const sub = args[1];
  if (sub === 'init') kpmInit(args[2]);
  else if (sub === 'add' && args[2]) kpmAdd(args[2]);
  else if (sub === 'publish') kpmPublish();
  else if (sub === 'search' && args[2]) kpmSearch(args[2]);
  else if (sub === 'list') kpmList();
  else console.log('Usage: kode kpm [init|add|publish|search|list]');
} else if (args[0] === 'features') {
  console.log('Kode Feature Flags:\n');
  for (const f of listFeatures()) {
    console.log(`  ${f.enabled ? '\x1b[32m✓\x1b[0m' : '\x1b[90m○\x1b[0m'} ${f.name}`);
  }
  console.log('\nEnable in code: #feature "name"');
} else if (args[0] === 'migrate') {
  console.log('[migrate] Auto-migration not yet needed (Kode is v0.1.0)');
  console.log('[migrate] Will be available when breaking changes are introduced');
} else if (args[0] === 'telemetry') {
  if (args[1] === 'on') { intelligence.enable(); console.log('Telemetry enabled'); }
  else if (args[1] === 'off') { intelligence.disable(); console.log('Telemetry disabled'); }
  else if (args[1] === 'report') {
    const report = intelligence.getReport();
    console.log(JSON.stringify(report, null, 2));
  }
  else console.log('Usage: kode telemetry [on|off|report]');
} else {
  runFile(args[0]);
}
