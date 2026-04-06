// Kode Language — Feature Flag System
// Users opt into experimental features via #feature "name"

const KNOWN_FEATURES = new Set([
  'pattern_guards',    // Guard clauses in match arms
  'async_streams',     // Async stream operators
  'distributed',       // Distributed agent networking
  'self_modify',       // kode.eval / kode.reload
  'mcp',              // MCP protocol support
]);

const enabledFeatures = new Set<string>();

export function enableFeature(name: string): void {
  if (!KNOWN_FEATURES.has(name)) {
    const suggestions = [...KNOWN_FEATURES].filter(f => f.includes(name) || name.includes(f));
    const hint = suggestions.length > 0 ? ` Did you mean '${suggestions[0]}'?` : '';
    console.warn(`[Feature] Unknown feature '${name}'.${hint} Available: ${[...KNOWN_FEATURES].join(', ')}`);
    return;
  }
  enabledFeatures.add(name);
}

export function isFeatureEnabled(name: string): boolean {
  return enabledFeatures.has(name);
}

export function getEnabledFeatures(): string[] {
  return [...enabledFeatures];
}

export function listFeatures(): { name: string; enabled: boolean }[] {
  return [...KNOWN_FEATURES].map(name => ({ name, enabled: enabledFeatures.has(name) }));
}
