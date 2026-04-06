// Kode Language — Token Types
// All keywords are 2-3 chars for token efficiency

export enum TokenType {
  // Literals
  Number, String, RawString, MultiLineString,
  True, False, Null,

  // Identifier
  Identifier,

  // Keywords — variables
  Let, Var,                     // lt, vr

  // Keywords — functions
  Fn, Return,                   // fn, rt

  // Keywords — control flow
  If, ElIf, Else,               // if, ef, el
  While, Loop, For,             // wl, lp, fr
  Match,                        // mt
  Break, Next,                  // br, nx

  // Keywords — error handling
  Try, Catch, Finally, Throw,   // tx, ct, fy, tw

  // Keywords — agents
  Agent, Tool, Emit, On,        // ag, tk, em, on
  Spawn, Await,                 // sp, aw

  // Keywords — advanced
  State, Mem,                   // st, mem
  Enum, Interface,              // en, it
  Supervisor,                   // sv
  Go, Chan,                     // go, ch
  Ext, Get,                     // ext, get

  // Keywords — modules
  Import, Export,               // im, ex

  // Keywords — safety
  Allow, Deny, Budget,          // allow, deny, budget
  Ensure,                       // ensure
  Checkpoint, Rollback,         // checkpoint, rollback

  // Operators — arithmetic
  Plus, Minus, Star, Slash, Percent, Power,  // + - * / % **

  // Operators — comparison
  EqEq, NotEq, Lt, Gt, LtEq, GtEq,         // == != < > <= >=

  // Operators — logical
  And, Or, Not,                              // & | !

  // Operators — assignment
  Eq, PlusEq, MinusEq, StarEq, SlashEq,     // = += -= *= /=

  // Operators — special
  Arrow, Pipe, Range, RangeInclusive,        // -> |> .. ..=
  DoubleColon, Spread,                       // :: ...
  NullCoalesce, OptionalChain,               // ?? ?.
  At, Hash,                                  // @ #

  // Delimiters
  LParen, RParen,              // ( )
  LBrace, RBrace,              // { }
  LBracket, RBracket,          // [ ]
  ToonMapOpen, ToonListOpen,   // @{ @[

  // Punctuation
  Comma, Colon, Semicolon, Dot, // , : ; .
  Question,                     // ?

  // Special
  Newline,
  EOF,
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal: string | number | boolean | null;
  line: number;
  col: number;
}

// Keyword map — maps lexeme to token type
export const KEYWORDS: Record<string, TokenType> = {
  'lt': TokenType.Let,
  'vr': TokenType.Var,
  'fn': TokenType.Fn,
  'rt': TokenType.Return,
  'if': TokenType.If,
  'ef': TokenType.ElIf,
  'el': TokenType.Else,
  'wl': TokenType.While,
  'lp': TokenType.Loop,
  'fr': TokenType.For,
  'mt': TokenType.Match,
  'br': TokenType.Break,
  'nx': TokenType.Next,
  'tx': TokenType.Try,
  'ct': TokenType.Catch,
  'fy': TokenType.Finally,
  'tw': TokenType.Throw,
  'ag': TokenType.Agent,
  'tk': TokenType.Tool,
  'em': TokenType.Emit,
  'on': TokenType.On,
  'sp': TokenType.Spawn,
  'aw': TokenType.Await,
  'st': TokenType.State,
  'mem': TokenType.Mem,
  'en': TokenType.Enum,
  'it': TokenType.Interface,
  'sv': TokenType.Supervisor,
  'go': TokenType.Go,
  'ch': TokenType.Chan,
  'ext': TokenType.Ext,
  'get': TokenType.Get,
  'im': TokenType.Import,
  'ex': TokenType.Export,
  'nl': TokenType.Null,
  'tr': TokenType.True,
  'fl': TokenType.False,
  'allow': TokenType.Allow,
  'deny': TokenType.Deny,
  'budget': TokenType.Budget,
  'ensure': TokenType.Ensure,
  'checkpoint': TokenType.Checkpoint,
  'rollback': TokenType.Rollback,
};
