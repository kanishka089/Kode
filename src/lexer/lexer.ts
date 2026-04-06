// Kode Language — Lexer (Tokenizer)
// Converts source code string into an array of tokens

import { Token, TokenType, KEYWORDS } from './tokens.js';

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private col = 1;
  private startCol = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startCol = this.col;
      this.scanToken();
    }
    this.tokens.push({ type: TokenType.EOF, lexeme: '', literal: null, line: this.line, col: this.col });
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      // Single-char tokens
      case '(': this.addToken(TokenType.LParen); break;
      case ')': this.addToken(TokenType.RParen); break;
      case '{': this.addToken(TokenType.LBrace); break;
      case '}': this.addToken(TokenType.RBrace); break;
      case '[': this.addToken(TokenType.LBracket); break;
      case ']': this.addToken(TokenType.RBracket); break;
      case ',': this.addToken(TokenType.Comma); break;
      case ':': this.match(':') ? this.addToken(TokenType.DoubleColon) : this.addToken(TokenType.Colon); break;
      case ';': this.addToken(TokenType.Semicolon); break;
      case '#': this.addToken(TokenType.Hash); break;

      // Operators
      case '+': this.addToken(this.match('=') ? TokenType.PlusEq : TokenType.Plus); break;
      case '*':
        if (this.match('*')) this.addToken(TokenType.Power);
        else if (this.match('=')) this.addToken(TokenType.StarEq);
        else this.addToken(TokenType.Star);
        break;
      case '%': this.addToken(TokenType.Percent); break;
      case '!': this.addToken(this.match('=') ? TokenType.NotEq : TokenType.Not); break;
      case '&': this.addToken(TokenType.And); break;
      case '=': this.addToken(this.match('=') ? TokenType.EqEq : TokenType.Eq); break;

      // - can be: minus, -=, -- (comment), -* (block comment)
      case '-': this.handleMinus(); break;

      // / can be: slash, /=
      case '/': this.addToken(this.match('=') ? TokenType.SlashEq : TokenType.Slash); break;

      // < can be: <, <=
      case '<': this.addToken(this.match('=') ? TokenType.LtEq : TokenType.Lt); break;

      // > can be: >, >=
      case '>': this.addToken(this.match('=') ? TokenType.GtEq : TokenType.Gt); break;

      // . can be: dot, .., ..=, ...
      case '.': this.handleDot(); break;

      // | can be: |, |> (pipe), or start of lambda |x|
      case '|': this.addToken(this.match('>') ? TokenType.Pipe : TokenType.Or); break;

      // ? can be: ?, ??, ?.
      case '?': this.handleQuestion(); break;

      // @ can be: @{, @[, @ (decorator)
      case '@': this.handleAt(); break;

      // Strings
      case '"': this.handleString(); break;
      case "'": this.handleRawString(); break;

      // Whitespace
      case ' ':
      case '\r':
      case '\t':
        break;

      // Newlines
      case '\n':
        this.addToken(TokenType.Newline);
        this.line++;
        this.col = 1;
        break;

      default:
        if (this.isDigit(c)) {
          this.handleNumber();
        } else if (this.isAlpha(c)) {
          this.handleIdentifier();
        } else {
          throw new Error(`[Lexer] Unexpected character '${c}' at line ${this.line}, col ${this.startCol}`);
        }
    }
  }

  // --- Complex token handlers ---

  private handleMinus(): void {
    if (this.match('-')) {
      // -- is a comment (skip to end of line)
      while (!this.isAtEnd() && this.peek() !== '\n') this.advance();
    } else if (this.match('*')) {
      // -* block comment *-
      this.blockComment();
    } else if (this.match('=')) {
      this.addToken(TokenType.MinusEq);
    } else if (this.match('>')) {
      this.addToken(TokenType.Arrow);
    } else {
      this.addToken(TokenType.Minus);
    }
  }

  private blockComment(): void {
    let depth = 1;
    while (!this.isAtEnd() && depth > 0) {
      if (this.peek() === '*' && this.peekNext() === '-') {
        depth--;
        this.advance(); this.advance();
      } else if (this.peek() === '-' && this.peekNext() === '*') {
        depth++;
        this.advance(); this.advance();
      } else {
        if (this.peek() === '\n') { this.line++; this.col = 0; }
        this.advance();
      }
    }
  }

  private handleDot(): void {
    if (this.match('.')) {
      if (this.match('.')) {
        this.addToken(TokenType.Spread); // ...
      } else if (this.match('=')) {
        this.addToken(TokenType.RangeInclusive); // ..=
      } else {
        this.addToken(TokenType.Range); // ..
      }
    } else {
      this.addToken(TokenType.Dot);
    }
  }

  private handleQuestion(): void {
    if (this.match('?')) {
      this.addToken(TokenType.NullCoalesce); // ??
    } else if (this.match('.')) {
      this.addToken(TokenType.OptionalChain); // ?.
    } else {
      this.addToken(TokenType.Question); // ?
    }
  }

  private handleAt(): void {
    if (this.match('{')) {
      this.addToken(TokenType.ToonMapOpen); // @{
    } else if (this.match('[')) {
      this.addToken(TokenType.ToonListOpen); // @[
    } else {
      this.addToken(TokenType.At); // @ (decorator)
    }
  }

  private handleString(): void {
    // Check for multi-line """ or empty string ""
    if (this.peek() === '"') {
      this.advance(); // consume second "
      if (this.peek() === '"') {
        this.advance(); // consume third " → multi-line string """
        this.multiLineString();
        return;
      }
      // Empty string ""
      this.addTokenLiteral(TokenType.String, '');
      return;
    }

    let current = '';

    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === '\\') {
        this.advance();
        current += this.escapeChar(this.advance());
      } else if (this.peek() === '\n') {
        throw new Error(`[Lexer] Unterminated string at line ${this.line}, col ${this.startCol}`);
      } else {
        current += this.advance();
      }
    }

    if (this.isAtEnd()) throw new Error(`[Lexer] Unterminated string at line ${this.line}, col ${this.startCol}`);
    this.advance(); // closing "

    this.addTokenLiteral(TokenType.String, current);
  }

  private multiLineString(): void {
    let value = '';
    while (!this.isAtEnd()) {
      if (this.peek() === '"' && this.peekNext() === '"' && this.peekAt(2) === '"') {
        this.advance(); this.advance(); this.advance();
        this.addTokenLiteral(TokenType.MultiLineString, value);
        return;
      }
      if (this.peek() === '\n') { this.line++; this.col = 0; }
      if (this.peek() === '\\') {
        this.advance();
        value += this.escapeChar(this.advance());
      } else {
        value += this.advance();
      }
    }
    throw new Error(`[Lexer] Unterminated multi-line string at line ${this.line}`);
  }

  private handleRawString(): void {
    let value = '';
    while (!this.isAtEnd() && this.peek() !== "'") {
      if (this.peek() === '\n') {
        throw new Error(`[Lexer] Unterminated raw string at line ${this.line}, col ${this.startCol}`);
      }
      value += this.advance();
    }
    if (this.isAtEnd()) throw new Error(`[Lexer] Unterminated raw string at line ${this.line}, col ${this.startCol}`);
    this.advance(); // closing '
    this.addTokenLiteral(TokenType.RawString, value);
  }

  private handleNumber(): void {
    // Check for hex, binary, octal
    if (this.source[this.start] === '0') {
      const next = this.peek();
      if (next === 'x' || next === 'X') { this.advance(); this.hexNumber(); return; }
      if (next === 'b' || next === 'B') { this.advance(); this.binaryNumber(); return; }
      if (next === 'o' || next === 'O') { this.advance(); this.octalNumber(); return; }
    }

    // Regular decimal
    while (this.isDigit(this.peek()) || this.peek() === '_') this.advance();

    // Fractional part
    if (this.peek() === '.' && this.peekNext() !== '.' && this.isDigit(this.peekNext())) {
      this.advance(); // consume .
      while (this.isDigit(this.peek()) || this.peek() === '_') this.advance();
    }

    // Scientific notation
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance();
      if (this.peek() === '+' || this.peek() === '-') this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }

    const raw = this.source.slice(this.start, this.current).replace(/_/g, '');
    this.addTokenLiteral(TokenType.Number, parseFloat(raw));
  }

  private hexNumber(): void {
    while (this.isHexDigit(this.peek()) || this.peek() === '_') this.advance();
    const raw = this.source.slice(this.start + 2, this.current).replace(/_/g, '');
    this.addTokenLiteral(TokenType.Number, parseInt(raw, 16));
  }

  private binaryNumber(): void {
    while (this.peek() === '0' || this.peek() === '1' || this.peek() === '_') this.advance();
    const raw = this.source.slice(this.start + 2, this.current).replace(/_/g, '');
    this.addTokenLiteral(TokenType.Number, parseInt(raw, 2));
  }

  private octalNumber(): void {
    while (this.peek() >= '0' && this.peek() <= '7' || this.peek() === '_') this.advance();
    const raw = this.source.slice(this.start + 2, this.current).replace(/_/g, '');
    this.addTokenLiteral(TokenType.Number, parseInt(raw, 8));
  }

  private handleIdentifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.slice(this.start, this.current);

    // Check for ** (power) - handled separately since * is already consumed
    // Keywords
    const keywordType = KEYWORDS[text];
    if (keywordType !== undefined) {
      if (keywordType === TokenType.True) {
        this.addTokenLiteral(TokenType.True, true);
      } else if (keywordType === TokenType.False) {
        this.addTokenLiteral(TokenType.False, false);
      } else if (keywordType === TokenType.Null) {
        this.addTokenLiteral(TokenType.Null, null);
      } else {
        this.addToken(keywordType);
      }
    } else {
      this.addToken(TokenType.Identifier);
    }
  }

  private escapeChar(c: string): string {
    switch (c) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '\\': return '\\';
      case '"': return '"';
      case "'": return "'";
      case '0': return '\0';
      default: return c;
    }
  }

  // --- Helpers ---

  private advance(): string {
    const c = this.source[this.current];
    this.current++;
    this.col++;
    return c;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  private peekAt(offset: number): string {
    if (this.current + offset >= this.source.length) return '\0';
    return this.source[this.current + offset];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    this.col++;
    return true;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isHexDigit(c: string): boolean {
    return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private addToken(type: TokenType): void {
    const lexeme = this.source.slice(this.start, this.current);
    this.tokens.push({ type, lexeme, literal: null, line: this.line, col: this.startCol });
  }

  private addTokenLiteral(type: TokenType, literal: string | number | boolean | null): void {
    const lexeme = this.source.slice(this.start, this.current);
    this.tokens.push({ type, lexeme, literal, line: this.line, col: this.startCol });
  }
}
