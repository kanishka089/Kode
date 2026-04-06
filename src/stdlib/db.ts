// Kode stdlib — std.db (Database — SQLite)

import Database from 'better-sqlite3';
import { KodeValue, mkNum, mkStr, mkBool, mkNull, mkList, mkMap, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerDbStdlib(env: Environment): void {
  const dbMod = new Map<string, KodeValue>();

  dbMod.set('open', {
    type: 'native_fn',
    name: 'db.open',
    call: (args: KodeValue[]) => {
      const connStr = args[0]?.type === 'str' ? args[0].value : ':memory:';
      // Parse connection string: "sqlite:path" or just "path"
      let dbPath = connStr;
      if (connStr.startsWith('sqlite:')) dbPath = connStr.slice(7);

      const db = new Database(dbPath);
      db.pragma('journal_mode = WAL');

      // Return a database handle as a map with methods
      const dbHandle = new Map<string, KodeValue>();

      dbHandle.set('exec', {
        type: 'native_fn',
        name: 'db.exec',
        call: (args: KodeValue[]) => {
          const sql = args[0]?.type === 'str' ? args[0].value : '';
          const params = args[1]?.type === 'list' ? args[1].items.map(kodeToSqlParam) : [];
          try {
            if (params.length > 0) {
              db.prepare(sql).run(...params);
            } else {
              db.exec(sql);
            }
            return mkNull();
          } catch (e: any) {
            throw new Error(`[db.exec] ${e.message}`);
          }
        },
      });

      dbHandle.set('query', {
        type: 'native_fn',
        name: 'db.query',
        call: (args: KodeValue[]) => {
          const sql = args[0]?.type === 'str' ? args[0].value : '';
          const params = args[1]?.type === 'list' ? args[1].items.map(kodeToSqlParam) : [];
          try {
            const stmt = db.prepare(sql);
            const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
            return mkList(rows.map(rowToKode));
          } catch (e: any) {
            throw new Error(`[db.query] ${e.message}`);
          }
        },
      });

      dbHandle.set('get', {
        type: 'native_fn',
        name: 'db.get',
        call: (args: KodeValue[]) => {
          const sql = args[0]?.type === 'str' ? args[0].value : '';
          const params = args[1]?.type === 'list' ? args[1].items.map(kodeToSqlParam) : [];
          try {
            const stmt = db.prepare(sql);
            const row = params.length > 0 ? stmt.get(...params) : stmt.get();
            return row ? rowToKode(row) : mkNull();
          } catch (e: any) {
            throw new Error(`[db.get] ${e.message}`);
          }
        },
      });

      dbHandle.set('close', {
        type: 'native_fn',
        name: 'db.close',
        call: () => { db.close(); return mkNull(); },
      });

      return mkMap(dbHandle);
    },
  });

  env.define('db', mkMap(dbMod));
}

// --- Helpers ---

function kodeToSqlParam(v: KodeValue): any {
  switch (v.type) {
    case 'num': return v.value;
    case 'str': return v.value;
    case 'bool': return v.value ? 1 : 0;
    case 'null': return null;
    default: return stringify(v);
  }
}

function rowToKode(row: any): KodeValue {
  if (!row || typeof row !== 'object') return mkNull();
  const entries = new Map<string, KodeValue>();
  for (const [key, val] of Object.entries(row)) {
    if (val === null || val === undefined) entries.set(key, mkNull());
    else if (typeof val === 'number') entries.set(key, mkNum(val));
    else if (typeof val === 'string') entries.set(key, mkStr(val));
    else if (typeof val === 'boolean') entries.set(key, mkBool(val));
    else entries.set(key, mkStr(String(val)));
  }
  return mkMap(entries);
}
