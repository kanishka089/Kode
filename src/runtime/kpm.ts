// Kode Package Manager (kpm) — Skeleton
// Package format: kode.pkg (TOON format)

import { readFileSync, writeFileSync, existsSync } from 'fs';

const PKG_FILE = 'kode.pkg';

interface KodePkg {
  name: string;
  version: string;
  description?: string;
  deps?: Record<string, string>;
  edition?: string;
}

export function kpmInit(name?: string): void {
  if (existsSync(PKG_FILE)) {
    console.log(`${PKG_FILE} already exists`);
    return;
  }

  const pkg = `@{
  name|"${name ?? 'my-kode-app'}"
  version|"0.1.0"
  description|""
  edition|"2026.1"
  deps|@{}
}`;

  writeFileSync(PKG_FILE, pkg);
  console.log(`Created ${PKG_FILE}`);
}

export function kpmAdd(packageName: string): void {
  console.log(`[kpm] Installing ${packageName}...`);
  // TODO: fetch from registry, download, extract
  console.log(`[kpm] Package registry not yet available. Coming soon!`);
}

export function kpmPublish(): void {
  if (!existsSync(PKG_FILE)) {
    console.error(`[kpm] No ${PKG_FILE} found. Run 'kode kpm init' first.`);
    return;
  }
  console.log(`[kpm] Publishing...`);
  // TODO: upload to registry
  console.log(`[kpm] Package registry not yet available. Coming soon!`);
}

export function kpmSearch(query: string): void {
  console.log(`[kpm] Searching for '${query}'...`);
  // TODO: query registry
  console.log(`[kpm] Package registry not yet available. Coming soon!`);
}

export function kpmList(): void {
  if (!existsSync(PKG_FILE)) {
    console.log(`No ${PKG_FILE} found`);
    return;
  }
  const content = readFileSync(PKG_FILE, 'utf-8');
  console.log(content);
}
