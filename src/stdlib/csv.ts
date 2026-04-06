// Kode stdlib — std.csv (CSV read/write)

import { KodeValue, mkStr, mkNull, mkList, mkMap, mkNum, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerCsvStdlib(env: Environment): void {
  const csvMod = new Map<string, KodeValue>();

  // csv.parse(str, options?) — parse CSV string into list of maps
  csvMod.set('parse', { type: 'native_fn', name: 'csv.parse',
    call: (args: KodeValue[]) => {
      const str = args[0]?.type === 'str' ? args[0].value : '';
      const sep = args[1]?.type === 'str' ? args[1].value : ',';
      const lines = str.trim().split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return mkList([]);

      const headers = parseLine(lines[0], sep);
      const rows: KodeValue[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i], sep);
        const row = new Map<string, KodeValue>();
        for (let j = 0; j < headers.length; j++) {
          const val = values[j] ?? '';
          const num = parseFloat(val);
          row.set(headers[j], isNaN(num) ? mkStr(val) : mkNum(num));
        }
        rows.push(mkMap(row));
      }
      return mkList(rows);
    }});

  // csv.to_str(list, headers?) — convert list of maps to CSV string
  csvMod.set('to_str', { type: 'native_fn', name: 'csv.to_str',
    call: (args: KodeValue[]) => {
      if (args[0]?.type !== 'list') throw new Error('[csv.to_str] Expected a list');
      const items = args[0].items;
      if (items.length === 0) return mkStr('');

      // Get headers from first item
      const first = items[0];
      if (first.type !== 'map') throw new Error('[csv.to_str] Expected list of maps');
      const headers = [...first.entries.keys()];

      let csv = headers.join(',') + '\n';
      for (const item of items) {
        if (item.type !== 'map') continue;
        const vals = headers.map(h => {
          const v = item.entries.get(h);
          return v ? stringify(v) : '';
        });
        csv += vals.join(',') + '\n';
      }
      return mkStr(csv.trimEnd());
    }});

  env.define('csv', mkMap(csvMod));
}

function parseLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; continue; }
    if (line[i] === sep && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += line[i];
  }
  result.push(current.trim());
  return result;
}
