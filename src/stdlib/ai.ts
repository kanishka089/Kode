// Kode stdlib — std.ai (Universal LLM Gateway)
// Unified interface for Claude, GPT, Gemini, Llama, local models

import { KodeValue, mkStr, mkNull, mkNum, mkMap, mkList, mkBool, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export function registerAiStdlib(env: Environment): void {
  const aiMod = new Map<string, KodeValue>();

  // ai.ask(prompt, options?) — call an LLM
  aiMod.set('ask', {
    type: 'native_fn',
    name: 'ai.ask',
    call: (args: KodeValue[]) => {
      const prompt = args[0]?.type === 'str' ? args[0].value : stringify(args[0]);
      const opts = args[1]?.type === 'map' ? args[1].entries : new Map();

      const model = (opts.get('model') as any)?.value ?? 'default';
      const maxTokens = (opts.get('max_tokens') as any)?.value ?? 500;

      // For now, return a placeholder — real implementation needs API keys
      // This will be connected to actual LLM APIs in production
      console.log(`[ai.ask] Model: ${model}, Tokens: ${maxTokens}`);
      console.log(`[ai.ask] Prompt: ${prompt.slice(0, 100)}...`);

      // Check for KODE_AI_KEY environment variable
      const apiKey = process.env.KODE_AI_KEY ?? process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return mkStr(`[ai] No API key found. Set KODE_AI_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY environment variable.`);
      }

      // Real implementation would call the API here
      // For MVP, return a note about the needed integration
      return mkStr(`[ai] LLM call queued (model: ${model}, prompt length: ${prompt.length} chars). Connect API key to enable.`);
    },
  });

  // ai.auto(prompt) — auto-select cheapest capable model
  aiMod.set('auto', {
    type: 'native_fn',
    name: 'ai.auto',
    call: (args: KodeValue[]) => {
      const prompt = args[0]?.type === 'str' ? args[0].value : stringify(args[0]);
      // Auto-select model based on prompt complexity
      const model = prompt.length < 100 ? 'haiku' : prompt.length < 1000 ? 'sonnet' : 'opus';
      const opts = new Map<string, KodeValue>();
      opts.set('model', mkStr(model));
      const askFn = aiMod.get('ask') as any;
      return askFn.call([mkStr(prompt), mkMap(opts)]);
    },
  });

  // ai.models() — list available models
  aiMod.set('models', {
    type: 'native_fn',
    name: 'ai.models',
    call: () => mkList([
      mkStr('claude-opus'), mkStr('claude-sonnet'), mkStr('claude-haiku'),
      mkStr('gpt-4o'), mkStr('gpt-4o-mini'),
      mkStr('gemini-pro'), mkStr('gemini-flash'),
      mkStr('llama-3'), mkStr('mistral-large'),
    ]),
  });

  // ai.token_count(text) — estimate tokens
  aiMod.set('token_count', {
    type: 'native_fn',
    name: 'ai.token_count',
    call: (args: KodeValue[]) => {
      const text = args[0]?.type === 'str' ? args[0].value : stringify(args[0]);
      // Rough estimation: ~4 chars per token
      return mkNum(Math.ceil(text.length / 4));
    },
  });

  env.define('ai', mkMap(aiMod));
}
