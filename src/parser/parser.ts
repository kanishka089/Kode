// Kode Language — Parser
// Recursive descent with Pratt parsing for expressions

import { Token, TokenType } from '../lexer/tokens.js';
import { Lexer } from '../lexer/lexer.js';
import * as AST from './ast.js';

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    // Filter out newlines for now (use semicolons / braces for structure)
    this.tokens = tokens.filter(t => t.type !== TokenType.Newline);
  }

  parse(): AST.Program {
    const body: AST.Stmt[] = [];
    while (!this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) body.push(stmt);
    }
    return { type: 'Program', body, line: 1, col: 1 };
  }

  // --- Declarations ---

  private declaration(): AST.Stmt | null {
    // Skip semicolons
    while (this.check(TokenType.Semicolon)) this.advance();
    if (this.isAtEnd()) return null;

    if (this.check(TokenType.Let)) return this.letDecl();
    if (this.check(TokenType.Var)) return this.varDecl();
    if (this.check(TokenType.Fn)) return this.fnDecl();
    if (this.check(TokenType.If)) return this.ifStmt();
    if (this.check(TokenType.While)) return this.whileStmt();
    if (this.check(TokenType.Loop)) return this.loopStmt();
    if (this.check(TokenType.For)) return this.forStmt();
    if (this.check(TokenType.Match)) return this.matchStmt();
    if (this.check(TokenType.Return)) return this.returnStmt();
    if (this.check(TokenType.Break)) return this.breakStmt();
    if (this.check(TokenType.Next)) return this.nextStmt();
    if (this.check(TokenType.Throw)) return this.throwStmt();
    if (this.check(TokenType.Try)) return this.tryCatch();
    if (this.check(TokenType.Import)) return this.importStmt();
    if (this.check(TokenType.Ext)) return this.extDecl();
    if (this.check(TokenType.Interface)) return this.interfaceDecl();
    if (this.check(TokenType.At)) return this.decoratedStmt();
    if (this.check(TokenType.Hash)) return this.testBlock();
    if (this.check(TokenType.Agent)) return this.agentDecl();
    if (this.check(TokenType.Emit)) return this.emitStmt();
    if (this.check(TokenType.State)) return this.stateDecl();
    if (this.check(TokenType.Identifier) && this.peek().lexeme === 'checkpoint') return this.checkpointStmt();
    if (this.check(TokenType.Identifier) && this.peek().lexeme === 'rollback') return this.rollbackStmt();

    return this.exprStmt();
  }

  private letDecl(): AST.LetDecl {
    const tok = this.consume(TokenType.Let, "Expected 'lt'");
    const name = this.consume(TokenType.Identifier, "Expected variable name").lexeme;
    let typeAnnotation: string | undefined;
    if (this.match(TokenType.DoubleColon)) {
      typeAnnotation = this.consume(TokenType.Identifier, "Expected type").lexeme;
      if (this.check(TokenType.Question)) { this.advance(); typeAnnotation += '?'; }
    }
    this.consume(TokenType.Eq, "Expected '=' after variable name");
    const value = this.expression();
    return { type: 'LetDecl', name, typeAnnotation, value, line: tok.line, col: tok.col };
  }

  private varDecl(): AST.VarDecl {
    const tok = this.consume(TokenType.Var, "Expected 'vr'");
    const name = this.consume(TokenType.Identifier, "Expected variable name").lexeme;
    let typeAnnotation: string | undefined;
    if (this.match(TokenType.DoubleColon)) {
      typeAnnotation = this.consume(TokenType.Identifier, "Expected type").lexeme;
      if (this.check(TokenType.Question)) { this.advance(); typeAnnotation += '?'; }
    }
    this.consume(TokenType.Eq, "Expected '=' after variable name");
    const value = this.expression();
    return { type: 'VarDecl', name, typeAnnotation, value, line: tok.line, col: tok.col };
  }

  private fnDecl(): AST.FnDecl {
    const tok = this.consume(TokenType.Fn, "Expected 'fn'");
    const name = this.consume(TokenType.Identifier, "Expected function name").lexeme;
    this.consume(TokenType.LParen, "Expected '(' after function name");
    const params = this.paramList();
    this.consume(TokenType.RParen, "Expected ')' after parameters");

    let returnType: string | undefined;
    if (this.match(TokenType.DoubleColon)) {
      returnType = this.consume(TokenType.Identifier, "Expected return type").lexeme;
    }

    // Arrow form: fn name(params) -> expr
    if (this.match(TokenType.Arrow)) {
      const expr = this.expression();
      return { type: 'FnDecl', name, params, body: expr, returnType, line: tok.line, col: tok.col };
    }

    // Block form: fn name(params) { body }
    this.consume(TokenType.LBrace, "Expected '{' before function body");

    // Check for pre:/post: contracts at the start of the body
    const preconditions: AST.Expr[] = [];
    const postconditions: AST.Expr[] = [];
    while (this.check(TokenType.Identifier) && (this.peek().lexeme === 'pre' || this.peek().lexeme === 'post')) {
      const kind = this.advance().lexeme; // 'pre' or 'post'
      this.consume(TokenType.Colon, `Expected ':' after ${kind}`);
      const condition = this.expression();
      if (kind === 'pre') preconditions.push(condition);
      else postconditions.push(condition);
    }

    const body = this.block();

    if (preconditions.length > 0 || postconditions.length > 0) {
      const fnDecl: AST.FnDecl = { type: 'FnDecl', name, params, body, returnType, line: tok.line, col: tok.col };
      return { type: 'ContractFnDecl', fn: fnDecl, preconditions, postconditions, line: tok.line, col: tok.col } as AST.ContractFnDecl;
    }

    return { type: 'FnDecl', name, params, body, returnType, line: tok.line, col: tok.col };
  }

  private paramList(): AST.Param[] {
    const params: AST.Param[] = [];
    if (!this.check(TokenType.RParen)) {
      do {
        const name = this.consume(TokenType.Identifier, "Expected parameter name").lexeme;
        let typeAnnotation: string | undefined;
        if (this.match(TokenType.DoubleColon)) {
          typeAnnotation = this.consume(TokenType.Identifier, "Expected type").lexeme;
        }
        params.push({ name, typeAnnotation });
      } while (this.match(TokenType.Comma));
    }
    return params;
  }

  // --- Statements ---

  private ifStmt(): AST.IfStmt {
    const tok = this.consume(TokenType.If, "Expected 'if'");
    const condition = this.expression();
    this.consume(TokenType.LBrace, "Expected '{' after if condition");
    const then = this.block();

    const elifs: { condition: AST.Expr; body: AST.Stmt[] }[] = [];
    while (this.match(TokenType.ElIf)) {
      const elifCond = this.expression();
      this.consume(TokenType.LBrace, "Expected '{' after ef condition");
      const elifBody = this.block();
      elifs.push({ condition: elifCond, body: elifBody });
    }

    let else_: AST.Stmt[] | undefined;
    if (this.match(TokenType.Else)) {
      this.consume(TokenType.LBrace, "Expected '{' after el");
      else_ = this.block();
    }

    return { type: 'IfStmt', condition, then, elifs, else_, line: tok.line, col: tok.col };
  }

  private whileStmt(): AST.WhileStmt {
    const tok = this.consume(TokenType.While, "Expected 'wl'");
    const condition = this.expression();
    this.consume(TokenType.LBrace, "Expected '{'");
    const body = this.block();
    return { type: 'WhileStmt', condition, body, line: tok.line, col: tok.col };
  }

  private loopStmt(): AST.LoopStmt {
    const tok = this.consume(TokenType.Loop, "Expected 'lp'");
    this.consume(TokenType.LBrace, "Expected '{'");
    const body = this.block();
    return { type: 'LoopStmt', body, line: tok.line, col: tok.col };
  }

  private forStmt(): AST.ForStmt {
    const tok = this.consume(TokenType.For, "Expected 'fr'");
    const variable = this.consume(TokenType.Identifier, "Expected variable").lexeme;

    let index: string | undefined;
    if (this.match(TokenType.Comma)) {
      index = variable;
      const itemName = this.consume(TokenType.Identifier, "Expected variable").lexeme;
      this.consume(TokenType.Colon, "Expected ':'");
      const iterable = this.expression();
      this.consume(TokenType.LBrace, "Expected '{'");
      const body = this.block();
      return { type: 'ForStmt', variable: itemName, index, iterable, body, line: tok.line, col: tok.col };
    }

    this.consume(TokenType.Colon, "Expected ':' after variable in for");
    const iterable = this.expression();
    this.consume(TokenType.LBrace, "Expected '{'");
    const body = this.block();
    return { type: 'ForStmt', variable, iterable, body, line: tok.line, col: tok.col };
  }

  private matchStmt(): AST.MatchStmt {
    const tok = this.consume(TokenType.Match, "Expected 'mt'");
    const value = this.expression();
    this.consume(TokenType.LBrace, "Expected '{'");
    const arms: AST.MatchArm[] = [];

    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      let pattern: AST.Expr | '_';
      if (this.check(TokenType.Identifier) && this.peek().lexeme === '_') {
        this.advance();
        pattern = '_';
      } else {
        pattern = this.expression();
      }
      this.consume(TokenType.Arrow, "Expected '->' in match arm");
      if (this.check(TokenType.LBrace)) {
        this.advance();
        const body = this.block();
        arms.push({ pattern, body });
      } else {
        const expr = this.expression();
        arms.push({ pattern, body: expr });
      }
    }

    this.consume(TokenType.RBrace, "Expected '}'");
    return { type: 'MatchStmt', value, arms, line: tok.line, col: tok.col };
  }

  private returnStmt(): AST.ReturnStmt {
    const tok = this.consume(TokenType.Return, "Expected 'rt'");
    let value: AST.Expr | undefined;
    if (!this.check(TokenType.RBrace) && !this.check(TokenType.Semicolon) && !this.isAtEnd()) {
      value = this.expression();
    }
    return { type: 'ReturnStmt', value, line: tok.line, col: tok.col };
  }

  private breakStmt(): AST.BreakStmt {
    const tok = this.consume(TokenType.Break, "Expected 'br'");
    return { type: 'BreakStmt', line: tok.line, col: tok.col };
  }

  private nextStmt(): AST.NextStmt {
    const tok = this.consume(TokenType.Next, "Expected 'nx'");
    return { type: 'NextStmt', line: tok.line, col: tok.col };
  }

  private throwStmt(): AST.ThrowStmt {
    const tok = this.consume(TokenType.Throw, "Expected 'tw'");
    const value = this.expression();
    return { type: 'ThrowStmt', value, line: tok.line, col: tok.col };
  }

  private tryCatch(): AST.TryCatch {
    const tok = this.consume(TokenType.Try, "Expected 'tx'");
    this.consume(TokenType.LBrace, "Expected '{'");
    const tryBody = this.block();

    let catchParam: string | undefined;
    let catchBody: AST.Stmt[] | undefined;
    if (this.match(TokenType.Catch)) {
      if (this.match(TokenType.LParen)) {
        // ct (e) { }
        catchParam = this.consume(TokenType.Identifier, "Expected catch variable").lexeme;
        this.consume(TokenType.RParen, "Expected ')'");
      } else if (this.check(TokenType.Identifier)) {
        // ct e { }
        catchParam = this.consume(TokenType.Identifier, "Expected catch variable").lexeme;
      }
      this.consume(TokenType.LBrace, "Expected '{'");
      catchBody = this.block();
    }

    let finallyBody: AST.Stmt[] | undefined;
    if (this.match(TokenType.Finally)) {
      this.consume(TokenType.LBrace, "Expected '{'");
      finallyBody = this.block();
    }

    return { type: 'TryCatch', tryBody, catchParam, catchBody, finallyBody, line: tok.line, col: tok.col };
  }

  // --- Phase 3: ext, it, decorators, contracts ---

  private extDecl(): AST.ExtDecl {
    const tok = this.consume(TokenType.Ext, "Expected 'ext'");
    const targetType = this.consume(TokenType.Identifier, "Expected type name").lexeme;
    this.consume(TokenType.LBrace, "Expected '{'");
    const methods: AST.FnDecl[] = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      while (this.check(TokenType.Semicolon)) this.advance();
      if (this.check(TokenType.RBrace)) break;
      methods.push(this.fnDecl());
    }
    this.consume(TokenType.RBrace, "Expected '}'");
    return { type: 'ExtDecl', targetType, methods, line: tok.line, col: tok.col };
  }

  private interfaceDecl(): AST.InterfaceDecl {
    const tok = this.consume(TokenType.Interface, "Expected 'it'");
    const name = this.consume(TokenType.Identifier, "Expected interface name").lexeme;
    this.consume(TokenType.LBrace, "Expected '{'");
    const methods: { name: string; params: AST.Param[]; returnType?: string }[] = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      while (this.check(TokenType.Semicolon)) this.advance();
      if (this.check(TokenType.RBrace)) break;
      this.consume(TokenType.Fn, "Expected 'fn' in interface");
      const mName = this.consume(TokenType.Identifier, "Expected method name").lexeme;
      this.consume(TokenType.LParen, "Expected '('");
      const params = this.paramList();
      this.consume(TokenType.RParen, "Expected ')'");
      let returnType: string | undefined;
      if (this.match(TokenType.DoubleColon)) {
        returnType = this.consume(TokenType.Identifier, "Expected return type").lexeme;
      }
      methods.push({ name: mName, params, returnType });
    }
    this.consume(TokenType.RBrace, "Expected '}'");
    return { type: 'InterfaceDecl', name, methods, line: tok.line, col: tok.col };
  }

  private testBlock(): AST.TestBlock {
    const tok = this.consume(TokenType.Hash, "Expected '#'");
    // Expect identifier 'test' after #
    const keyword = this.consume(TokenType.Identifier, "Expected 'test' after '#'");
    if (keyword.lexeme !== 'test') throw new Error(`[Parser] Expected 'test' after '#', got '${keyword.lexeme}'`);
    const name = this.consume(TokenType.String, "Expected test name string").literal as string;
    this.consume(TokenType.LBrace, "Expected '{'");
    const body = this.block();
    return { type: 'TestBlock', name, body, line: tok.line, col: tok.col };
  }

  private decoratedStmt(): AST.DecoratedStmt {
    const tok = this.consume(TokenType.At, "Expected '@'");
    const decorator = this.consume(TokenType.Identifier, "Expected decorator name").lexeme;
    let args: AST.Expr[] = [];
    if (this.match(TokenType.LParen)) {
      if (!this.check(TokenType.RParen)) {
        do { args.push(this.expression()); } while (this.match(TokenType.Comma));
      }
      this.consume(TokenType.RParen, "Expected ')'");
    }
    // The decorated target must be a fn declaration
    const target = this.fnDecl();
    return { type: 'DecoratedStmt', decorator, args, target, line: tok.line, col: tok.col };
  }

  // --- Phase 4: Agents ---

  private agentDecl(): AST.AgentDecl {
    const tok = this.consume(TokenType.Agent, "Expected 'ag'");
    const name = this.consume(TokenType.Identifier, "Expected agent name").lexeme;

    // Optional trait implementation: ag MyAgent :: Trait
    let traits: string[] | undefined;
    if (this.match(TokenType.DoubleColon)) {
      traits = [];
      do {
        traits.push(this.consume(TokenType.Identifier, "Expected trait name").lexeme);
      } while (this.match(TokenType.Comma));
    }

    this.consume(TokenType.LBrace, "Expected '{'");
    const body: AST.Stmt[] = [];

    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      while (this.check(TokenType.Semicolon)) this.advance();
      if (this.check(TokenType.RBrace)) break;

      if (this.check(TokenType.On)) {
        body.push(this.onHandler());
      } else if (this.check(TokenType.Let)) {
        body.push(this.letDecl());
      } else if (this.check(TokenType.Var)) {
        body.push(this.varDecl());
      } else if (this.check(TokenType.Fn)) {
        body.push(this.fnDecl());
      } else if (this.check(TokenType.Tool)) {
        body.push(this.toolDecl());
      } else if (this.check(TokenType.Mem)) {
        body.push(this.memDecl());
      } else if (this.check(TokenType.At)) {
        body.push(this.decoratedStmt());
      } else {
        body.push(this.exprStmt());
      }
    }

    this.consume(TokenType.RBrace, "Expected '}'");
    return { type: 'AgentDecl', name, traits, body, line: tok.line, col: tok.col };
  }

  private onHandler(): AST.OnHandler {
    const tok = this.consume(TokenType.On, "Expected 'on'");
    const event = this.consume(TokenType.String, "Expected event name string").literal as string;

    let param: string | undefined;
    if (this.match(TokenType.LParen)) {
      if (!this.check(TokenType.RParen)) {
        param = this.consume(TokenType.Identifier, "Expected parameter name").lexeme;
      }
      this.consume(TokenType.RParen, "Expected ')'");
    }

    this.consume(TokenType.LBrace, "Expected '{'");
    const body = this.block();
    return { type: 'OnHandler', event, param, body, line: tok.line, col: tok.col };
  }

  private toolDecl(): AST.ToolDecl {
    const tok = this.consume(TokenType.Tool, "Expected 'tk'");
    const name = this.consume(TokenType.Identifier, "Expected tool name").lexeme;
    this.consume(TokenType.LParen, "Expected '('");
    const params = this.paramList();
    this.consume(TokenType.RParen, "Expected ')'");

    let returnType: string | undefined;
    if (this.match(TokenType.DoubleColon)) {
      returnType = this.consume(TokenType.Identifier, "Expected return type").lexeme;
    }

    let body: AST.Stmt[] | undefined;
    if (this.match(TokenType.LBrace)) {
      body = this.block();
    }

    return { type: 'ToolDecl', name, params, returnType, body, line: tok.line, col: tok.col };
  }

  private memDecl(): AST.MemDecl {
    const tok = this.consume(TokenType.Mem, "Expected 'mem'");
    const name = this.consume(TokenType.Identifier, "Expected memory name").lexeme;

    let persist = false;
    let value: AST.Expr | undefined;

    if (this.match(TokenType.DoubleColon)) {
      const modifier = this.consume(TokenType.Identifier, "Expected modifier").lexeme;
      if (modifier === 'persist') persist = true;
    } else if (this.match(TokenType.Eq)) {
      value = this.expression();
    }

    return { type: 'MemDecl', name, value, persist, line: tok.line, col: tok.col };
  }

  private stateDecl(): AST.StateDecl {
    const tok = this.consume(TokenType.State, "Expected 'st'");
    const name = this.consume(TokenType.Identifier, "Expected state machine name").lexeme;
    this.consume(TokenType.LBrace, "Expected '{'");

    const states: { name: string; transitions: { event: string; target: string }[] }[] = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      while (this.check(TokenType.Semicolon)) this.advance();
      if (this.check(TokenType.RBrace)) break;
      const stateName = this.consume(TokenType.String, "Expected state name string").literal as string;
      this.consume(TokenType.LBrace, "Expected '{'");
      const transitions: { event: string; target: string }[] = [];
      while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
        while (this.check(TokenType.Semicolon)) this.advance();
        if (this.check(TokenType.RBrace)) break;
        this.consume(TokenType.On, "Expected 'on'");
        const event = this.consume(TokenType.String, "Expected event name").literal as string;
        this.consume(TokenType.Arrow, "Expected '->'");
        const target = this.consume(TokenType.String, "Expected target state").literal as string;
        transitions.push({ event, target });
      }
      this.consume(TokenType.RBrace, "Expected '}'");
      states.push({ name: stateName, transitions });
    }
    this.consume(TokenType.RBrace, "Expected '}'");
    return { type: 'StateDecl', name, states, line: tok.line, col: tok.col };
  }

  private checkpointStmt(): AST.Stmt {
    const tok = this.advance(); // consume 'checkpoint'
    const name = this.consume(TokenType.String, "Expected checkpoint name").literal as string;
    return { type: 'ExprStmt', expr: { type: 'StringLit', value: `__checkpoint:${name}`, line: tok.line, col: tok.col }, line: tok.line, col: tok.col };
  }

  private rollbackStmt(): AST.Stmt {
    const tok = this.advance(); // consume 'rollback'
    const name = this.consume(TokenType.String, "Expected checkpoint name").literal as string;
    return { type: 'ExprStmt', expr: { type: 'StringLit', value: `__rollback:${name}`, line: tok.line, col: tok.col }, line: tok.line, col: tok.col };
  }

  private emitStmt(): AST.EmitStmt {
    const tok = this.consume(TokenType.Emit, "Expected 'em'");
    const target = this.expression();
    const payload = this.expression();
    return { type: 'EmitStmt', target, payload, line: tok.line, col: tok.col };
  }

  private importStmt(): AST.ImportStmt {
    const tok = this.consume(TokenType.Import, "Expected 'im'");
    const path = this.consume(TokenType.String, "Expected import path").literal as string;
    const names: string[] = [];
    if (this.match(TokenType.LBrace)) {
      do {
        names.push(this.consume(TokenType.Identifier, "Expected import name").lexeme);
      } while (this.match(TokenType.Comma));
      this.consume(TokenType.RBrace, "Expected '}'");
    }
    return { type: 'ImportStmt', path, names, line: tok.line, col: tok.col };
  }

  private exprStmt(): AST.ExprStmt | AST.Assignment {
    const tok = this.peek();
    const expr = this.expression();

    // Check for assignment: expr = value, expr += value, etc.
    if (this.check(TokenType.Eq) || this.check(TokenType.PlusEq) ||
        this.check(TokenType.MinusEq) || this.check(TokenType.StarEq) ||
        this.check(TokenType.SlashEq)) {
      const opTok = this.advance();
      const value = this.expression();
      return { type: 'Assignment', target: expr, op: opTok.lexeme, value, line: tok.line, col: tok.col };
    }

    return { type: 'ExprStmt', expr, line: tok.line, col: tok.col };
  }

  // --- Block ---
  private block(): AST.Stmt[] {
    const stmts: AST.Stmt[] = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      while (this.check(TokenType.Semicolon)) this.advance();
      if (this.check(TokenType.RBrace)) break;
      const stmt = this.declaration();
      if (stmt) stmts.push(stmt);
    }
    this.consume(TokenType.RBrace, "Expected '}'");
    return stmts;
  }

  // --- Expressions (Pratt Parsing) ---

  private expression(): AST.Expr {
    return this.pipe();
  }

  private pipe(): AST.Expr {
    let left = this.nullCoalesce();
    while (this.match(TokenType.Pipe)) {
      const right = this.nullCoalesce();
      left = { type: 'PipeExpr', left, right, line: left.line, col: left.col };
    }
    return left;
  }

  private nullCoalesce(): AST.Expr {
    let left = this.logicalOr();
    while (this.match(TokenType.NullCoalesce)) {
      const right = this.logicalOr();
      left = { type: 'BinaryExpr', op: '??', left, right, line: left.line, col: left.col };
    }
    return left;
  }

  private logicalOr(): AST.Expr {
    let left = this.logicalAnd();
    while (this.match(TokenType.Or)) {
      const right = this.logicalAnd();
      left = { type: 'LogicalExpr', op: '|', left, right, line: left.line, col: left.col };
    }
    return left;
  }

  private logicalAnd(): AST.Expr {
    let left = this.equality();
    while (this.match(TokenType.And)) {
      const right = this.equality();
      left = { type: 'LogicalExpr', op: '&', left, right, line: left.line, col: left.col };
    }
    return left;
  }

  private equality(): AST.Expr {
    let left = this.comparison();
    while (this.match(TokenType.EqEq) || this.match(TokenType.NotEq)) {
      const op = this.previous().lexeme;
      const right = this.comparison();
      left = { type: 'BinaryExpr', op, left, right, line: left.line, col: left.col };
    }
    return left;
  }

  private comparison(): AST.Expr {
    let left = this.range();
    while (this.match(TokenType.Lt) || this.match(TokenType.Gt) ||
           this.match(TokenType.LtEq) || this.match(TokenType.GtEq)) {
      const op = this.previous().lexeme;
      const right = this.range();
      left = { type: 'BinaryExpr', op, left, right, line: left.line, col: left.col };
    }
    return left;
  }

  private range(): AST.Expr {
    let left = this.addition();
    if (this.match(TokenType.Range) || this.match(TokenType.RangeInclusive)) {
      const inclusive = this.previous().type === TokenType.RangeInclusive;
      const end = this.addition();
      return { type: 'RangeExpr', start: left, end, inclusive, line: left.line, col: left.col };
    }
    return left;
  }

  private addition(): AST.Expr {
    let left = this.multiplication();
    while (this.match(TokenType.Plus) || this.match(TokenType.Minus)) {
      const op = this.previous().lexeme;
      const right = this.multiplication();
      left = { type: 'BinaryExpr', op, left, right, line: left.line, col: left.col };
    }
    return left;
  }

  private multiplication(): AST.Expr {
    let left = this.power();
    while (this.match(TokenType.Star) || this.match(TokenType.Slash) || this.match(TokenType.Percent)) {
      const op = this.previous().lexeme;
      const right = this.power();
      left = { type: 'BinaryExpr', op, left, right, line: left.line, col: left.col };
    }
    return left;
  }

  private power(): AST.Expr {
    let left = this.unary();
    if (this.match(TokenType.Power)) {
      const right = this.power(); // right-associative
      left = { type: 'BinaryExpr', op: '**', left, right, line: left.line, col: left.col };
    }
    return left;
  }

  private unary(): AST.Expr {
    if (this.match(TokenType.Not) || this.match(TokenType.Minus)) {
      const op = this.previous().lexeme;
      const operand = this.unary();
      return { type: 'UnaryExpr', op, operand, line: this.previous().line, col: this.previous().col };
    }
    return this.call();
  }

  private call(): AST.Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LParen)) {
        const args: AST.Expr[] = [];
        if (!this.check(TokenType.RParen)) {
          do { args.push(this.expression()); } while (this.match(TokenType.Comma));
        }
        this.consume(TokenType.RParen, "Expected ')'");
        expr = { type: 'CallExpr', callee: expr, args, line: expr.line, col: expr.col };
      } else if (this.match(TokenType.Dot)) {
        const prop = this.consumePropertyName();
        expr = { type: 'MemberExpr', object: expr, property: prop, line: expr.line, col: expr.col };
      } else if (this.match(TokenType.LBracket)) {
        const index = this.expression();
        this.consume(TokenType.RBracket, "Expected ']'");
        expr = { type: 'IndexExpr', object: expr, index, line: expr.line, col: expr.col };
      } else if (this.match(TokenType.OptionalChain)) {
        const prop = this.consumePropertyName();
        expr = { type: 'MemberExpr', object: expr, property: prop, line: expr.line, col: expr.col };
      } else {
        break;
      }
    }
    return expr;
  }

  private primary(): AST.Expr {
    const tok = this.peek();

    // Number
    if (this.match(TokenType.Number)) {
      return { type: 'NumberLit', value: this.previous().literal as number, line: tok.line, col: tok.col };
    }

    // String (may contain interpolation)
    if (this.match(TokenType.String) || this.match(TokenType.MultiLineString)) {
      const raw = this.previous().literal as string;
      // Check for ${} interpolation
      if (raw.includes('${')) {
        return this.parseInterpolation(raw, tok);
      }
      return { type: 'StringLit', value: raw, line: tok.line, col: tok.col };
    }

    // Raw string (no interpolation)
    if (this.match(TokenType.RawString)) {
      return { type: 'StringLit', value: this.previous().literal as string, line: tok.line, col: tok.col };
    }

    // If as expression: if cond { expr } el { expr }
    if (this.check(TokenType.If)) {
      const ifStmt = this.ifStmt();
      return ifStmt as any; // IfStmt works as expression too
    }

    // Booleans
    if (this.match(TokenType.True)) return { type: 'BoolLit', value: true, line: tok.line, col: tok.col };
    if (this.match(TokenType.False)) return { type: 'BoolLit', value: false, line: tok.line, col: tok.col };
    if (this.match(TokenType.Null)) return { type: 'NullLit', line: tok.line, col: tok.col };

    // Identifier (and keywords that can also be used as identifiers in expressions)
    if (this.match(TokenType.Identifier) || this.match(TokenType.Mem) ||
        this.match(TokenType.Go) || this.match(TokenType.Chan)) {
      return { type: 'Identifier', name: this.previous().lexeme, line: tok.line, col: tok.col };
    }

    // Parenthesized expression
    if (this.match(TokenType.LParen)) {
      const expr = this.expression();
      this.consume(TokenType.RParen, "Expected ')'");
      return expr;
    }

    // TOON map @{key|value ...}
    if (this.match(TokenType.ToonMapOpen)) {
      return this.toonMap(tok);
    }

    // TOON list @[elem ...]
    if (this.match(TokenType.ToonListOpen)) {
      return this.toonList(tok);
    }

    // Lambda |params| -> expr or |params| { body }
    if (this.check(TokenType.Or)) {
      return this.lambda(tok);
    }

    // sp Agent — spawn an agent
    if (this.match(TokenType.Spawn)) {
      const name = this.consume(TokenType.Identifier, "Expected agent name after 'sp'").lexeme;
      return { type: 'SpawnExpr', name, line: tok.line, col: tok.col } as AST.SpawnExpr;
    }

    // aw expr — await
    if (this.match(TokenType.Await)) {
      const value = this.expression();
      return { type: 'AwaitExpr', value, line: tok.line, col: tok.col } as AST.AwaitExpr;
    }

    throw new Error(`[Parser] Unexpected token '${tok.lexeme}' (${TokenType[tok.type]}) at line ${tok.line}, col ${tok.col}`);
  }

  // --- String interpolation ---
  private parseInterpolation(raw: string, tok: Token): AST.StringInterp {
    const parts: (string | AST.Expr)[] = [];
    let i = 0;
    let current = '';

    while (i < raw.length) {
      if (raw[i] === '$' && raw[i + 1] === '{') {
        if (current) { parts.push(current); current = ''; }
        i += 2; // skip ${
        let depth = 1;
        let exprStr = '';
        while (i < raw.length && depth > 0) {
          if (raw[i] === '{') depth++;
          else if (raw[i] === '}') { depth--; if (depth === 0) break; }
          exprStr += raw[i];
          i++;
        }
        i++; // skip closing }
        // Parse the expression inside ${} using a new Lexer+Parser
        const tokens = new Lexer(exprStr).tokenize();
        const subParser = new Parser(tokens);
        parts.push(subParser.expression());
      } else {
        current += raw[i];
        i++;
      }
    }
    if (current) parts.push(current);

    return { type: 'StringInterp', parts, line: tok.line, col: tok.col };
  }

  // --- TOON ---
  private toonMap(tok: Token): AST.ToonMap {
    const entries: { key: string; value: AST.Expr }[] = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      // Allow keywords as map keys (e.g., @{get|fn type|"str"})
      const keyTok = this.advance();
      const key = keyTok.lexeme;
      this.consume(TokenType.Or, "Expected '|' after map key");
      const value = this.expression();
      entries.push({ key, value });
    }
    this.consume(TokenType.RBrace, "Expected '}'");
    return { type: 'ToonMap', entries, line: tok.line, col: tok.col };
  }

  private toonList(tok: Token): AST.ToonList {
    const elements: AST.Expr[] = [];
    while (!this.check(TokenType.RBracket) && !this.isAtEnd()) {
      elements.push(this.expression());
    }
    this.consume(TokenType.RBracket, "Expected ']'");
    return { type: 'ToonList', elements, line: tok.line, col: tok.col };
  }

  // --- Lambda ---
  private lambda(tok: Token): AST.Lambda {
    this.consume(TokenType.Or, "Expected '|'"); // opening |
    const params: string[] = [];
    if (!this.check(TokenType.Or)) {
      do {
        params.push(this.consume(TokenType.Identifier, "Expected parameter").lexeme);
      } while (this.match(TokenType.Comma));
    }
    this.consume(TokenType.Or, "Expected closing '|'"); // closing |

    if (this.match(TokenType.Arrow)) {
      const body = this.expression();
      return { type: 'Lambda', params, body, line: tok.line, col: tok.col };
    }

    this.consume(TokenType.LBrace, "Expected '{' or '->' after lambda params");
    const body = this.block();
    return { type: 'Lambda', params, body, line: tok.line, col: tok.col };
  }

  // --- Helpers ---

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    const tok = this.peek();
    throw new Error(`[Parser] ${message}, got '${tok.lexeme}' (${TokenType[tok.type]}) at line ${tok.line}, col ${tok.col}`);
  }

  /** Consume any token that can be a property name (identifiers + keywords) */
  private consumePropertyName(): string {
    const tok = this.peek();
    // Allow identifiers and any keyword as property name
    if (tok.type === TokenType.Identifier || tok.type === TokenType.Get ||
        tok.type === TokenType.Mem || tok.type === TokenType.State ||
        tok.type === TokenType.On || tok.type === TokenType.Fn ||
        tok.type === TokenType.Let || tok.type === TokenType.Var ||
        tok.type === TokenType.Return || tok.type === TokenType.If ||
        tok.type === TokenType.Else || tok.type === TokenType.For ||
        tok.type === TokenType.True || tok.type === TokenType.False ||
        tok.type === TokenType.Null || tok.type === TokenType.Ext ||
        tok.type === TokenType.Agent || tok.type === TokenType.Tool ||
        tok.type === TokenType.Emit || tok.type === TokenType.Spawn ||
        tok.type === TokenType.Await || tok.type === TokenType.Go ||
        tok.type === TokenType.Chan || tok.type === TokenType.Enum ||
        tok.type === TokenType.Interface || tok.type === TokenType.Export ||
        tok.type === TokenType.Import) {
      this.advance();
      return tok.lexeme;
    }
    throw new Error(`[Parser] Expected property name, got '${tok.lexeme}' (${TokenType[tok.type]}) at line ${tok.line}, col ${tok.col}`);
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }
}
