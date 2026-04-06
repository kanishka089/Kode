import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer/lexer.js';
import { TokenType } from '../src/lexer/tokens.js';

describe('Lexer', () => {
  it('tokenizes keywords', () => {
    const tokens = new Lexer('lt vr fn rt if ef el').tokenize();
    expect(tokens[0].type).toBe(TokenType.Let);
    expect(tokens[1].type).toBe(TokenType.Var);
    expect(tokens[2].type).toBe(TokenType.Fn);
    expect(tokens[3].type).toBe(TokenType.Return);
    expect(tokens[4].type).toBe(TokenType.If);
    expect(tokens[5].type).toBe(TokenType.ElIf);
    expect(tokens[6].type).toBe(TokenType.Else);
  });

  it('tokenizes numbers', () => {
    const tokens = new Lexer('42 3.14 0xFF 0b1010 1_000').tokenize();
    expect(tokens[0].literal).toBe(42);
    expect(tokens[1].literal).toBe(3.14);
    expect(tokens[2].literal).toBe(255);
    expect(tokens[3].literal).toBe(10);
    expect(tokens[4].literal).toBe(1000);
  });

  it('tokenizes strings', () => {
    const tokens = new Lexer('"hello world"').tokenize();
    expect(tokens[0].type).toBe(TokenType.String);
    expect(tokens[0].literal).toBe('hello world');
  });

  it('tokenizes raw strings', () => {
    const tokens = new Lexer("'no ${interp}'").tokenize();
    expect(tokens[0].type).toBe(TokenType.RawString);
    expect(tokens[0].literal).toBe('no ${interp}');
  });

  it('tokenizes operators', () => {
    const tokens = new Lexer('+ - * / ** == != <= >= |> -> :: .. ...').tokenize();
    expect(tokens[0].type).toBe(TokenType.Plus);
    expect(tokens[1].type).toBe(TokenType.Minus);
    expect(tokens[2].type).toBe(TokenType.Star);
    expect(tokens[3].type).toBe(TokenType.Slash);
    expect(tokens[4].type).toBe(TokenType.Power);
    expect(tokens[5].type).toBe(TokenType.EqEq);
    expect(tokens[6].type).toBe(TokenType.NotEq);
    expect(tokens[7].type).toBe(TokenType.LtEq);
    expect(tokens[8].type).toBe(TokenType.GtEq);
    expect(tokens[9].type).toBe(TokenType.Pipe);
    expect(tokens[10].type).toBe(TokenType.Arrow);
    expect(tokens[11].type).toBe(TokenType.DoubleColon);
    expect(tokens[12].type).toBe(TokenType.Range);
    expect(tokens[13].type).toBe(TokenType.Spread);
  });

  it('tokenizes TOON delimiters', () => {
    const tokens = new Lexer('@{ @[').tokenize();
    expect(tokens[0].type).toBe(TokenType.ToonMapOpen);
    expect(tokens[1].type).toBe(TokenType.ToonListOpen);
  });

  it('handles comments', () => {
    const tokens = new Lexer('lt x = 5 -- this is a comment\nlt y = 10').tokenize();
    const meaningful = tokens.filter(t => t.type !== TokenType.Newline && t.type !== TokenType.EOF);
    // lt x = 5 (comment stripped) lt y = 10
    expect(meaningful.length).toBe(8); // lt x = 5 10 lt y = 10 — wait, the 5 before -- should still be there
    // Actually: lt, x, =, 5, lt, y, =, 10 = 8 tokens
    expect(meaningful[0].type).toBe(TokenType.Let);
    expect(meaningful[3].literal).toBe(5);
    expect(meaningful[4].type).toBe(TokenType.Let);
  });

  it('handles escape sequences in strings', () => {
    const tokens = new Lexer('"hello\\nworld"').tokenize();
    expect(tokens[0].literal).toBe('hello\nworld');
  });

  it('tokenizes booleans and null', () => {
    const tokens = new Lexer('tr fl nl').tokenize();
    expect(tokens[0].type).toBe(TokenType.True);
    expect(tokens[0].literal).toBe(true);
    expect(tokens[1].type).toBe(TokenType.False);
    expect(tokens[1].literal).toBe(false);
    expect(tokens[2].type).toBe(TokenType.Null);
    expect(tokens[2].literal).toBe(null);
  });

  it('tokenizes null coalescing and optional chaining', () => {
    const tokens = new Lexer('?? ?.').tokenize();
    expect(tokens[0].type).toBe(TokenType.NullCoalesce);
    expect(tokens[1].type).toBe(TokenType.OptionalChain);
  });
});
