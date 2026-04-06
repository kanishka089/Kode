// Kode stdlib — std.fs (File System)

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs';
import { KodeValue, mkStr, mkNull, mkBool, mkNum, mkList, mkMap } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerFsStdlib(env: Environment): void {
  const fsMod = new Map<string, KodeValue>();

  fsMod.set('read', {
    type: 'native_fn', name: 'fs.read',
    call: (args: KodeValue[]) => {
      const path = args[0]?.type === 'str' ? args[0].value : '';
      try { return mkStr(readFileSync(path, 'utf-8')); }
      catch (e: any) { throw new Error(`[fs.read] ${e.message}`); }
    },
  });

  fsMod.set('write', {
    type: 'native_fn', name: 'fs.write',
    call: (args: KodeValue[]) => {
      const path = args[0]?.type === 'str' ? args[0].value : '';
      const content = args[1]?.type === 'str' ? args[1].value : '';
      try { writeFileSync(path, content, 'utf-8'); return mkNull(); }
      catch (e: any) { throw new Error(`[fs.write] ${e.message}`); }
    },
  });

  fsMod.set('exists', {
    type: 'native_fn', name: 'fs.exists',
    call: (args: KodeValue[]) => {
      const path = args[0]?.type === 'str' ? args[0].value : '';
      return mkBool(existsSync(path));
    },
  });

  fsMod.set('list', {
    type: 'native_fn', name: 'fs.list',
    call: (args: KodeValue[]) => {
      const path = args[0]?.type === 'str' ? args[0].value : '.';
      try { return mkList(readdirSync(path).map(mkStr)); }
      catch (e: any) { throw new Error(`[fs.list] ${e.message}`); }
    },
  });

  fsMod.set('mkdir', {
    type: 'native_fn', name: 'fs.mkdir',
    call: (args: KodeValue[]) => {
      const path = args[0]?.type === 'str' ? args[0].value : '';
      mkdirSync(path, { recursive: true });
      return mkNull();
    },
  });

  fsMod.set('remove', {
    type: 'native_fn', name: 'fs.remove',
    call: (args: KodeValue[]) => {
      const path = args[0]?.type === 'str' ? args[0].value : '';
      try { unlinkSync(path); return mkNull(); }
      catch (e: any) { throw new Error(`[fs.remove] ${e.message}`); }
    },
  });

  fsMod.set('stat', {
    type: 'native_fn', name: 'fs.stat',
    call: (args: KodeValue[]) => {
      const path = args[0]?.type === 'str' ? args[0].value : '';
      try {
        const s = statSync(path);
        const m = new Map<string, KodeValue>();
        m.set('size', mkNum(s.size));
        m.set('is_file', mkBool(s.isFile()));
        m.set('is_dir', mkBool(s.isDirectory()));
        m.set('modified', mkNum(s.mtimeMs));
        return mkMap(m);
      } catch (e: any) { throw new Error(`[fs.stat] ${e.message}`); }
    },
  });

  env.define('fs', mkMap(fsMod));
}
