// Kode stdlib — std.enc (Encoding: base64, URL, hex)

import { KodeValue, mkStr } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';
import { mkMap } from '../evaluator/values.js';

export function registerEncStdlib(env: Environment): void {
  const encMod = new Map<string, KodeValue>();

  encMod.set('base64', { type: 'native_fn', name: 'enc.base64',
    call: (args: KodeValue[]) => mkStr(Buffer.from(asStr(args[0])).toString('base64')) });

  encMod.set('base64_decode', { type: 'native_fn', name: 'enc.base64_decode',
    call: (args: KodeValue[]) => mkStr(Buffer.from(asStr(args[0]), 'base64').toString('utf-8')) });

  encMod.set('url_encode', { type: 'native_fn', name: 'enc.url_encode',
    call: (args: KodeValue[]) => mkStr(encodeURIComponent(asStr(args[0]))) });

  encMod.set('url_decode', { type: 'native_fn', name: 'enc.url_decode',
    call: (args: KodeValue[]) => mkStr(decodeURIComponent(asStr(args[0]))) });

  encMod.set('hex', { type: 'native_fn', name: 'enc.hex',
    call: (args: KodeValue[]) => mkStr(Buffer.from(asStr(args[0])).toString('hex')) });

  encMod.set('hex_decode', { type: 'native_fn', name: 'enc.hex_decode',
    call: (args: KodeValue[]) => mkStr(Buffer.from(asStr(args[0]), 'hex').toString('utf-8')) });

  env.define('enc', mkMap(encMod));
}

function asStr(v: KodeValue): string { return v?.type === 'str' ? v.value : ''; }
