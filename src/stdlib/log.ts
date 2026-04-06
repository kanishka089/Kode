// Kode stdlib — std.log (Structured Logging)

import { KodeValue, mkStr, mkNull, mkMap, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m'
};

let minLevel: LogLevel = 'debug';

function logMsg(level: LogLevel, args: KodeValue[]): KodeValue {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return mkNull();
  const msg = args.map(stringify).join(' ');
  const ts = new Date().toISOString().slice(11, 23);
  const color = LEVEL_COLORS[level];
  console.log(`${color}[${level.toUpperCase()}]\x1b[0m \x1b[90m${ts}\x1b[0m ${msg}`);
  return mkNull();
}

export function registerLogStdlib(env: Environment): void {
  const logMod = new Map<string, KodeValue>();

  logMod.set('debug', { type: 'native_fn', name: 'log.debug', call: (a) => logMsg('debug', a) });
  logMod.set('info', { type: 'native_fn', name: 'log.info', call: (a) => logMsg('info', a) });
  logMod.set('warn', { type: 'native_fn', name: 'log.warn', call: (a) => logMsg('warn', a) });
  logMod.set('error', { type: 'native_fn', name: 'log.error', call: (a) => logMsg('error', a) });

  logMod.set('level', { type: 'native_fn', name: 'log.level',
    call: (args: KodeValue[]) => {
      const l = args[0]?.type === 'str' ? args[0].value as LogLevel : minLevel;
      if (l in LEVEL_ORDER) minLevel = l;
      return mkStr(minLevel);
    }});

  env.define('log', mkMap(logMod));
}
