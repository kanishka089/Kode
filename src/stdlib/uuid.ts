// Kode stdlib — std.uuid

import { randomBytes } from 'crypto';
import { KodeValue, mkStr, mkMap } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerUuidStdlib(env: Environment): void {
  const uuidMod = new Map<string, KodeValue>();

  uuidMod.set('v4', { type: 'native_fn', name: 'uuid.v4',
    call: () => {
      const bytes = randomBytes(16);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = bytes.toString('hex');
      return mkStr(
        `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`
      );
    }});

  env.define('uuid', mkMap(uuidMod));
}
