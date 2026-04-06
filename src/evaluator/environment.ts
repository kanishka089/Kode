// Kode Language — Environment (Scope Chain)

import { KodeValue } from './values.js';

export class Environment {
  private values = new Map<string, { value: KodeValue; mutable: boolean }>();
  readonly parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  define(name: string, value: KodeValue, mutable: boolean = false): void {
    this.values.set(name, { value, mutable });
  }

  get(name: string): KodeValue {
    const entry = this.values.get(name);
    if (entry) return entry.value;
    if (this.parent) return this.parent.get(name);
    throw new Error(`[Runtime] Undefined variable '${name}'`);
  }

  set(name: string, value: KodeValue): void {
    const entry = this.values.get(name);
    if (entry) {
      if (!entry.mutable) throw new Error(`[Runtime] Cannot reassign immutable variable '${name}' (use 'vr' instead of 'lt')`);
      entry.value = value;
      return;
    }
    if (this.parent) { this.parent.set(name, value); return; }
    throw new Error(`[Runtime] Undefined variable '${name}'`);
  }

  has(name: string): boolean {
    if (this.values.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }
}
