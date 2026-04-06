// Kode stdlib — std.yaml (Simple YAML parser)
// Handles basic YAML: key-value pairs, lists, nested objects

import { KodeValue, mkStr, mkNum, mkBool, mkNull, mkList, mkMap, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerYamlStdlib(env: Environment): void {
  const yamlMod = new Map<string, KodeValue>();

  yamlMod.set('parse', { type: 'native_fn', name: 'yaml.parse',
    call: (args: KodeValue[]) => {
      const str = args[0]?.type === 'str' ? args[0].value : '';
      return parseYaml(str);
    }});

  yamlMod.set('to_str', { type: 'native_fn', name: 'yaml.to_str',
    call: (args: KodeValue[]) => {
      return mkStr(toYaml(args[0] ?? mkNull(), 0));
    }});

  env.define('yaml', mkMap(yamlMod));
}

function parseYaml(str: string): KodeValue {
  const lines = str.split('\n');
  const result = new Map<string, KodeValue>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx < 0) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let val = trimmed.slice(colonIdx + 1).trim();

    // Remove quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    result.set(key, parseValue(val));
  }

  return mkMap(result);
}

function parseValue(val: string): KodeValue {
  if (val === '' || val === 'null' || val === '~') return mkNull();
  if (val === 'true') return mkBool(true);
  if (val === 'false') return mkBool(false);
  const num = parseFloat(val);
  if (!isNaN(num) && String(num) === val) return mkNum(num);
  // Check for list
  if (val.startsWith('[') && val.endsWith(']')) {
    const items = val.slice(1, -1).split(',').map(s => parseValue(s.trim()));
    return mkList(items);
  }
  return mkStr(val);
}

function toYaml(v: KodeValue, indent: number): string {
  const pad = '  '.repeat(indent);
  switch (v.type) {
    case 'num': return String(v.value);
    case 'str': return v.value.includes(':') ? `"${v.value}"` : v.value;
    case 'bool': return v.value ? 'true' : 'false';
    case 'null': return 'null';
    case 'list': return v.items.map(item => `${pad}- ${toYaml(item, indent + 1)}`).join('\n');
    case 'map': {
      const lines: string[] = [];
      for (const [k, val] of v.entries) {
        if (val.type === 'map' || val.type === 'list') {
          lines.push(`${pad}${k}:\n${toYaml(val, indent + 1)}`);
        } else {
          lines.push(`${pad}${k}: ${toYaml(val, indent)}`);
        }
      }
      return lines.join('\n');
    }
    default: return stringify(v);
  }
}
