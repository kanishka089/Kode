// Kode Language — Error Reporter
// Rich error messages with source context and suggestions

const KEYWORD_SUGGESTIONS: Record<string, string> = {
  'let': 'lt', 'const': 'lt', 'var': 'vr', 'mut': 'vr',
  'function': 'fn', 'def': 'fn', 'func': 'fn',
  'return': 'rt', 'ret': 'rt',
  'elif': 'ef', 'else if': 'ef', 'elseif': 'ef',
  'else': 'el',
  'while': 'wl', 'loop': 'lp',
  'for': 'fr', 'foreach': 'fr', 'each': 'fr',
  'match': 'mt', 'switch': 'mt', 'case': 'mt',
  'break': 'br', 'continue': 'nx', 'next': 'nx',
  'try': 'tx', 'catch': 'ct', 'finally': 'fy',
  'throw': 'tw', 'raise': 'tw',
  'import': 'im', 'from': 'im', 'require': 'im',
  'export': 'ex', 'module': 'ex',
  'class': 'ag', 'agent': 'ag',
  'spawn': 'sp', 'new': 'sp',
  'emit': 'em', 'send': 'em',
  'await': 'aw', 'async': 'aw',
  'enum': 'en', 'interface': 'it', 'trait': 'it',
  'true': 'tr', 'false': 'fl', 'null': 'nl', 'none': 'nl', 'nil': 'nl',
  'print': 'io.out', 'console.log': 'io.out', 'println': 'io.out',
};

export function formatError(error: string, source?: string): string {
  let output = '';

  // Extract line/col from error message
  const lineMatch = error.match(/line (\d+)/);
  const colMatch = error.match(/col (\d+)/);
  const line = lineMatch ? parseInt(lineMatch[1]) : 0;
  const col = colMatch ? parseInt(colMatch[1]) : 0;

  // Color the error header
  output += `\x1b[31merror\x1b[0m: ${error}\n`;

  // Show source context if available
  if (source && line > 0) {
    const lines = source.split('\n');
    const startLine = Math.max(0, line - 2);
    const endLine = Math.min(lines.length, line + 1);

    output += '\n';
    for (let i = startLine; i < endLine; i++) {
      const lineNum = String(i + 1).padStart(4);
      const prefix = i + 1 === line ? ' \x1b[31m>\x1b[0m' : '  ';
      output += `${prefix} ${lineNum} | ${lines[i]}\n`;
      if (i + 1 === line && col > 0) {
        output += `       | ${''.padStart(col - 1)}\x1b[31m^\x1b[0m\n`;
      }
    }
  }

  // Add suggestions
  const suggestion = getSuggestion(error);
  if (suggestion) {
    output += `\n\x1b[33mhint\x1b[0m: ${suggestion}\n`;
  }

  return output;
}

function getSuggestion(error: string): string | null {
  // Check for unknown keyword suggestions
  const unknownMatch = error.match(/Unexpected token '(\w+)'/);
  if (unknownMatch) {
    const word = unknownMatch[1].toLowerCase();
    if (KEYWORD_SUGGESTIONS[word]) {
      return `Did you mean '${KEYWORD_SUGGESTIONS[word]}'? Kode uses short keywords: ${word} → ${KEYWORD_SUGGESTIONS[word]}`;
    }
  }

  // Check for common mistakes
  if (error.includes('immutable')) {
    return "Use 'vr' (mutable) instead of 'lt' (immutable) if you need to reassign";
  }
  if (error.includes('Undefined variable')) {
    const varMatch = error.match(/variable '(\w+)'/);
    if (varMatch) {
      const name = varMatch[1].toLowerCase();
      if (KEYWORD_SUGGESTIONS[name]) {
        return `'${varMatch[1]}' is not defined. Did you mean '${KEYWORD_SUGGESTIONS[name]}'?`;
      }
    }
  }
  if (error.includes('Division by zero')) {
    return 'Check that the divisor is not zero before dividing';
  }
  if (error.includes('Maximum recursion depth')) {
    return 'Your function calls itself too many times. Add a base case or use iteration instead.';
  }
  if (error.includes('Cannot call')) {
    return 'Make sure you are calling a function (fn) or native function, not a value';
  }
  if (error.includes('Precondition failed')) {
    return 'A pre: contract was violated. Check the function arguments.';
  }
  if (error.includes("Expected '{'")) {
    return "Kode uses braces { } for blocks, not indentation";
  }

  return null;
}
