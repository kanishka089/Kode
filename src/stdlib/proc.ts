// Kode stdlib — std.proc (Process / External Commands)

import { execSync } from 'child_process';
import { KodeValue, mkStr, mkNull, mkNum, mkMap, mkList } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerProcStdlib(env: Environment): void {
  const procMod = new Map<string, KodeValue>();

  // proc.exec("command") — run command, return stdout
  procMod.set('exec', {
    type: 'native_fn', name: 'proc.exec',
    call: (args: KodeValue[]) => {
      const cmd = args[0]?.type === 'str' ? args[0].value : '';
      try {
        const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
        return mkStr(output.trim());
      } catch (e: any) {
        throw new Error(`[proc.exec] Command failed: ${e.message}`);
      }
    },
  });

  // proc.args — command-line arguments passed to the Kode script
  procMod.set('args', mkList(process.argv.slice(3).map(mkStr)));

  // proc.exit(code?) — exit process
  procMod.set('exit', {
    type: 'native_fn', name: 'proc.exit',
    call: (args: KodeValue[]) => {
      const code = args[0]?.type === 'num' ? args[0].value : 0;
      process.exit(code);
    },
  });

  // proc.cwd() — current working directory
  procMod.set('cwd', {
    type: 'native_fn', name: 'proc.cwd',
    call: () => mkStr(process.cwd()),
  });

  // proc.pid — process ID
  procMod.set('pid', mkNum(process.pid));

  // proc.platform — 'win32', 'linux', 'darwin'
  procMod.set('platform', mkStr(process.platform));

  env.define('proc', mkMap(procMod));
}
