// Kode stdlib — std.time (Time, timestamps, sleep)

import { KodeValue, mkStr, mkNum, mkNull, mkBool, mkMap } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerTimeStdlib(env: Environment): void {
  const timeMod = new Map<string, KodeValue>();

  // time.now() — current timestamp in milliseconds
  timeMod.set('now', { type: 'native_fn', name: 'time.now',
    call: () => mkNum(Date.now()) });

  // time.iso() — current time as ISO string
  timeMod.set('iso', { type: 'native_fn', name: 'time.iso',
    call: () => mkStr(new Date().toISOString()) });

  // time.unix() — current unix timestamp in seconds
  timeMod.set('unix', { type: 'native_fn', name: 'time.unix',
    call: () => mkNum(Math.floor(Date.now() / 1000)) });

  // time.format(ms, format?) — format timestamp
  timeMod.set('format', { type: 'native_fn', name: 'time.format',
    call: (args: KodeValue[]) => {
      const ms = args[0]?.type === 'num' ? args[0].value : Date.now();
      const d = new Date(ms);
      return mkStr(d.toISOString());
    }});

  // time.parse(str) — parse date string to ms
  timeMod.set('parse', { type: 'native_fn', name: 'time.parse',
    call: (args: KodeValue[]) => {
      const str = args[0]?.type === 'str' ? args[0].value : '';
      const ms = Date.parse(str);
      if (isNaN(ms)) throw new Error(`[time.parse] Invalid date: ${str}`);
      return mkNum(ms);
    }});

  // time.diff(a, b) — difference in milliseconds
  timeMod.set('diff', { type: 'native_fn', name: 'time.diff',
    call: (args: KodeValue[]) => {
      const a = args[0]?.type === 'num' ? args[0].value : 0;
      const b = args[1]?.type === 'num' ? args[1].value : 0;
      return mkNum(Math.abs(a - b));
    }});

  // time.sleep(ms) — synchronous sleep
  timeMod.set('sleep', { type: 'native_fn', name: 'time.sleep',
    call: (args: KodeValue[]) => {
      const ms = args[0]?.type === 'num' ? args[0].value : 0;
      const { execSync } = require('child_process');
      execSync(`node -e "setTimeout(()=>{},${ms})"`, { timeout: ms + 5000 });
      return mkNull();
    }});

  // time.measure(fn) — measure execution time
  timeMod.set('measure', { type: 'native_fn', name: 'time.measure',
    call: (args: KodeValue[]) => {
      // Returns a map with start/stop/elapsed
      const start = performance.now();
      const m = new Map<string, KodeValue>();
      m.set('start', mkNum(start));
      m.set('elapsed', { type: 'native_fn', name: 'time.measure.elapsed',
        call: () => mkNum(performance.now() - start) });
      return mkMap(m);
    }});

  // time.date() — current date parts as map
  timeMod.set('date', { type: 'native_fn', name: 'time.date',
    call: () => {
      const d = new Date();
      const m = new Map<string, KodeValue>();
      m.set('year', mkNum(d.getFullYear()));
      m.set('month', mkNum(d.getMonth() + 1));
      m.set('day', mkNum(d.getDate()));
      m.set('hour', mkNum(d.getHours()));
      m.set('minute', mkNum(d.getMinutes()));
      m.set('second', mkNum(d.getSeconds()));
      m.set('weekday', mkNum(d.getDay()));
      return mkMap(m);
    }});

  env.define('time', mkMap(timeMod));
}
