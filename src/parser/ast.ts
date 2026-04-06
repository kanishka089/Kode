// Kode Language — AST Node Definitions
// Every node has line/col for error reporting

export interface Loc {
  line: number;
  col: number;
}

// --- Program ---
export interface Program extends Loc {
  type: 'Program';
  body: Stmt[];
}

// --- Statements ---
export type Stmt =
  | LetDecl | VarDecl | Assignment | ExprStmt
  | FnDecl | ReturnStmt
  | IfStmt | WhileStmt | LoopStmt | ForStmt | MatchStmt
  | BreakStmt | NextStmt | ThrowStmt
  | TryCatch
  | ImportStmt | ExportStmt
  | AgentDecl | ToolDecl | EmitStmt | OnHandler | SpawnStmt
  | StateDecl | MemDecl
  | BlockStmt
  | ExtDecl | InterfaceDecl | GetterDecl | DecoratedStmt | ContractFnDecl
  | TestBlock;

// --- Expressions ---
export type Expr =
  | NumberLit | StringLit | BoolLit | NullLit
  | Identifier | BinaryExpr | UnaryExpr | LogicalExpr
  | CallExpr | MemberExpr | IndexExpr
  | AssignExpr
  | FnExpr | Lambda
  | IfExpr
  | ToonMap | ToonList
  | PipeExpr | RangeExpr | SpreadExpr
  | AwaitExpr | SpawnExpr
  | StringInterp;

// --- Literal Nodes ---
export interface NumberLit extends Loc { type: 'NumberLit'; value: number; }
export interface StringLit extends Loc { type: 'StringLit'; value: string; }
export interface BoolLit extends Loc { type: 'BoolLit'; value: boolean; }
export interface NullLit extends Loc { type: 'NullLit'; }

export interface StringInterp extends Loc {
  type: 'StringInterp';
  parts: (string | Expr)[];
}

// --- Identifier ---
export interface Identifier extends Loc { type: 'Identifier'; name: string; }

// --- Declarations ---
export interface LetDecl extends Loc {
  type: 'LetDecl';
  name: string;
  typeAnnotation?: string;
  value: Expr;
}

export interface VarDecl extends Loc {
  type: 'VarDecl';
  name: string;
  typeAnnotation?: string;
  value: Expr;
}

export interface FnDecl extends Loc {
  type: 'FnDecl';
  name: string;
  params: Param[];
  body: Stmt[] | Expr; // block body or single-expression (arrow)
  returnType?: string;
}

export interface Param {
  name: string;
  typeAnnotation?: string;
  defaultValue?: Expr;
}

// --- Expressions ---
export interface BinaryExpr extends Loc {
  type: 'BinaryExpr';
  op: string;
  left: Expr;
  right: Expr;
}

export interface UnaryExpr extends Loc {
  type: 'UnaryExpr';
  op: string;
  operand: Expr;
}

export interface LogicalExpr extends Loc {
  type: 'LogicalExpr';
  op: '&' | '|';
  left: Expr;
  right: Expr;
}

export interface CallExpr extends Loc {
  type: 'CallExpr';
  callee: Expr;
  args: Expr[];
}

export interface MemberExpr extends Loc {
  type: 'MemberExpr';
  object: Expr;
  property: string;
}

export interface IndexExpr extends Loc {
  type: 'IndexExpr';
  object: Expr;
  index: Expr;
}

export interface AssignExpr extends Loc {
  type: 'AssignExpr';
  target: Expr; // Identifier, MemberExpr, or IndexExpr
  op: '=' | '+=' | '-=' | '*=' | '/=';
  value: Expr;
}

export interface PipeExpr extends Loc {
  type: 'PipeExpr';
  left: Expr;
  right: Expr;
}

export interface RangeExpr extends Loc {
  type: 'RangeExpr';
  start: Expr;
  end: Expr;
  inclusive: boolean;
}

export interface SpreadExpr extends Loc {
  type: 'SpreadExpr';
  value: Expr;
}

export interface AwaitExpr extends Loc {
  type: 'AwaitExpr';
  value: Expr;
}

export interface SpawnExpr extends Loc {
  type: 'SpawnExpr';
  name: string;
  args?: Expr[];
}

// --- Function Expressions ---
export interface FnExpr extends Loc {
  type: 'FnExpr';
  params: Param[];
  body: Stmt[] | Expr;
}

export interface Lambda extends Loc {
  type: 'Lambda';
  params: string[];
  body: Stmt[] | Expr;
}

// --- If (works as both statement and expression) ---
export interface IfStmt extends Loc {
  type: 'IfStmt';
  condition: Expr;
  then: Stmt[];
  elifs: { condition: Expr; body: Stmt[] }[];
  else_?: Stmt[];
}

export interface IfExpr extends Loc {
  type: 'IfExpr';
  condition: Expr;
  then: Expr;
  else_: Expr;
}

// --- Loops ---
export interface WhileStmt extends Loc {
  type: 'WhileStmt';
  condition: Expr;
  body: Stmt[];
}

export interface LoopStmt extends Loc {
  type: 'LoopStmt';
  body: Stmt[];
}

export interface ForStmt extends Loc {
  type: 'ForStmt';
  variable: string;
  index?: string; // optional index variable: fr i, item : list
  iterable: Expr;
  body: Stmt[];
}

// --- Match ---
export interface MatchStmt extends Loc {
  type: 'MatchStmt';
  value: Expr;
  arms: MatchArm[];
}

export interface MatchArm {
  pattern: Expr | '_';
  guard?: Expr; // optional: pattern if condition
  body: Stmt[] | Expr;
}

// --- Control flow ---
export interface ReturnStmt extends Loc { type: 'ReturnStmt'; value?: Expr; }
export interface BreakStmt extends Loc { type: 'BreakStmt'; }
export interface NextStmt extends Loc { type: 'NextStmt'; }
export interface ThrowStmt extends Loc { type: 'ThrowStmt'; value: Expr; }

// --- Error handling ---
export interface TryCatch extends Loc {
  type: 'TryCatch';
  tryBody: Stmt[];
  catchParam?: string;
  catchBody?: Stmt[];
  finallyBody?: Stmt[];
}

// --- Modules ---
export interface ImportStmt extends Loc {
  type: 'ImportStmt';
  path: string;
  names: string[];
  isNpm?: boolean;
}

export interface ExportStmt extends Loc {
  type: 'ExportStmt';
  declaration: Stmt;
}

// --- TOON data ---
export interface ToonMap extends Loc {
  type: 'ToonMap';
  entries: { key: string; value: Expr }[];
}

export interface ToonList extends Loc {
  type: 'ToonList';
  elements: Expr[];
}

// --- Agent system ---
export interface AgentDecl extends Loc {
  type: 'AgentDecl';
  name: string;
  traits?: string[];
  body: Stmt[];
}

export interface ToolDecl extends Loc {
  type: 'ToolDecl';
  name: string;
  params: Param[];
  returnType?: string;
  body?: Stmt[];
}

export interface EmitStmt extends Loc {
  type: 'EmitStmt';
  target: Expr;
  payload: Expr;
}

export interface OnHandler extends Loc {
  type: 'OnHandler';
  event: string;
  param?: string;
  body: Stmt[];
}

export interface SpawnStmt extends Loc {
  type: 'SpawnStmt';
  agentName: string;
}

export interface StateDecl extends Loc {
  type: 'StateDecl';
  name: string;
  states: { name: string; transitions: { event: string; target: string }[] }[];
}

export interface MemDecl extends Loc {
  type: 'MemDecl';
  name: string;
  value?: Expr;
  persist?: boolean;
}

// --- Misc ---
export interface Assignment extends Loc {
  type: 'Assignment';
  target: Expr;
  op: string;
  value: Expr;
}

export interface ExprStmt extends Loc {
  type: 'ExprStmt';
  expr: Expr;
}

export interface BlockStmt extends Loc {
  type: 'BlockStmt';
  body: Stmt[];
}

// --- Extension functions ---
export interface ExtDecl extends Loc {
  type: 'ExtDecl';
  targetType: string; // "str", "num", "lst", etc.
  methods: FnDecl[];
}

// --- Interface/Trait ---
export interface InterfaceDecl extends Loc {
  type: 'InterfaceDecl';
  name: string;
  methods: { name: string; params: Param[]; returnType?: string }[];
}

// --- Computed property ---
export interface GetterDecl extends Loc {
  type: 'GetterDecl';
  name: string;
  body: Expr;
}

// --- Decorator ---
export interface DecoratedStmt extends Loc {
  type: 'DecoratedStmt';
  decorator: string;
  args: Expr[];
  target: FnDecl;
}

// --- Contracts ---
// --- Test block ---
export interface TestBlock extends Loc {
  type: 'TestBlock';
  name: string;
  body: Stmt[];
}

export interface ContractFnDecl extends Loc {
  type: 'ContractFnDecl';
  fn: FnDecl;
  preconditions: Expr[];
  postconditions: Expr[];
}
