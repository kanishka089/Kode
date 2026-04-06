// Kode stdlib — std.crypto (Hashing, HMAC, random bytes)

import { createHash, createHmac, randomBytes } from 'crypto';
import { KodeValue, mkStr, mkNum, mkMap } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerCryptoStdlib(env: Environment): void {
  const cryptoMod = new Map<string, KodeValue>();

  cryptoMod.set('sha256', { type: 'native_fn', name: 'crypto.sha256',
    call: (args: KodeValue[]) => mkStr(createHash('sha256').update(asStr(args[0])).digest('hex')) });

  cryptoMod.set('sha512', { type: 'native_fn', name: 'crypto.sha512',
    call: (args: KodeValue[]) => mkStr(createHash('sha512').update(asStr(args[0])).digest('hex')) });

  cryptoMod.set('md5', { type: 'native_fn', name: 'crypto.md5',
    call: (args: KodeValue[]) => mkStr(createHash('md5').update(asStr(args[0])).digest('hex')) });

  cryptoMod.set('hmac', { type: 'native_fn', name: 'crypto.hmac',
    call: (args: KodeValue[]) => {
      const data = asStr(args[0]); const key = asStr(args[1]);
      const algo = args[2]?.type === 'str' ? args[2].value : 'sha256';
      return mkStr(createHmac(algo, key).update(data).digest('hex'));
    }});

  cryptoMod.set('random_bytes', { type: 'native_fn', name: 'crypto.random_bytes',
    call: (args: KodeValue[]) => {
      const n = args[0]?.type === 'num' ? args[0].value : 32;
      return mkStr(randomBytes(n).toString('hex'));
    }});

  cryptoMod.set('random_int', { type: 'native_fn', name: 'crypto.random_int',
    call: (args: KodeValue[]) => {
      const min = args[0]?.type === 'num' ? args[0].value : 0;
      const max = args[1]?.type === 'num' ? args[1].value : 100;
      return mkNum(Math.floor(Math.random() * (max - min)) + min);
    }});

  env.define('crypto', mkMap(cryptoMod));
}

function asStr(v: KodeValue): string { return v?.type === 'str' ? v.value : ''; }
