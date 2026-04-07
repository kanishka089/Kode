// Kode Language — Evaluator (Tree-Walking Interpreter)
// Sync-first: only async when aw/go/em encountered

import * as AST from '../parser/ast.js';
import { Environment } from './environment.js';
import { KodeValue, KodeStateMachine, mkNum, mkStr, mkBool, mkNull, mkList, mkMap, isTruthy, stringify, kodeEquals } from './values.js';
import { AgentRuntime, AgentInstance } from '../runtime/agent-runtime.js';

// Signals for control flow
class ReturnSignal { constructor(public value: KodeValue) {} }
class BreakSignal {}
class NextSignal {}
class ThrowSignal { constructor(public value: KodeValue) {} }

export class Evaluator {
  private maxDepth = 10000;
  private depth = 0;
  // Extension methods: type -> method name -> function value
  private extensions = new Map<string, Map<string, KodeValue>>();
  // Interface definitions
  private interfaces = new Map<string, { name: string; methods: string[] }>();
  // Agent runtime
  readonly agentRuntime = new AgentRuntime();
  // Agent definitions (ag Name { ... } stores the template)
  private agentDefs = new Map<string, { body: AST.Stmt[]; defEnv: Environment }>();
  // Test blocks collected during parsing (run only in test mode)
  readonly testBlocks: { name: string; body: AST.Stmt[]; env: Environment }[] = [];
  testMode = false;
  // State machine definitions
  private stateMachineDefs = new Map<string, { states: Map<string, Map<string, string>>; initial: string }>();

  /** Call a Kode function value with arguments — used by native builtins */
  callFn(fn: KodeValue, args: KodeValue[]): KodeValue {
    if (fn.type === 'native_fn') return fn.call(args);
    if (fn.type === 'fn') {
      if (this.depth >= this.maxDepth) throw new Error(`[Runtime] Maximum recursion depth exceeded`);
      this.depth++;
      try {
        const fnEnv = new Environment(fn.closure);
        for (let i = 0; i < fn.params.length; i++) {
          fnEnv.define(fn.params[i].name, args[i] ?? mkNull(), false);
        }
        if (!Array.isArray(fn.body)) return this.evalExpr(fn.body, fnEnv);
        try {
          let result: KodeValue = mkNull();
          for (const stmt of fn.body) { result = this.execStmt(stmt, fnEnv); }
          return result;
        } catch (e) {
          if (e instanceof ReturnSignal) return e.value;
          throw e;
        }
      } finally { this.depth--; }
    }
    throw new Error(`[Runtime] Cannot call ${fn.type}`);
  }

  evalProgram(program: AST.Program, env: Environment): KodeValue {
    // Wire up agent runtime eval callback
    this.agentRuntime.setEvalCallback((stmts, env) => {
      let result: KodeValue = mkNull();
      for (const stmt of stmts) {
        result = this.execStmt(stmt, env);
      }
      return result;
    });

    let result: KodeValue = mkNull();
    for (const stmt of program.body) {
      result = this.execStmt(stmt, env);
    }

    // Process any pending agent messages after main program
    let rounds = 0;
    while (this.agentRuntime.hasPendingMessages() && rounds < 100) {
      this.agentRuntime.processMessages();
      rounds++;
    }

    return result;
  }

  execStmt(stmt: AST.Stmt, env: Environment): KodeValue {
    switch (stmt.type) {
      case 'LetDecl': return this.execLet(stmt, env);
      case 'VarDecl': return this.execVar(stmt, env);
      case 'FnDecl': return this.execFnDecl(stmt, env);
      case 'IfStmt': return this.execIf(stmt, env);
      case 'WhileStmt': return this.execWhile(stmt, env);
      case 'LoopStmt': return this.execLoop(stmt, env);
      case 'ForStmt': return this.execFor(stmt, env);
      case 'MatchStmt': return this.execMatch(stmt, env);
      case 'ReturnStmt': throw new ReturnSignal(stmt.value ? this.evalExpr(stmt.value, env) : mkNull());
      case 'BreakStmt': throw new BreakSignal();
      case 'NextStmt': throw new NextSignal();
      case 'ThrowStmt': throw new ThrowSignal(this.evalExpr(stmt.value, env));
      case 'TryCatch': return this.execTryCatch(stmt, env);
      case 'Assignment': return this.execAssignment(stmt, env);
      case 'ExprStmt': return this.evalExpr(stmt.expr, env);
      case 'BlockStmt': return this.execBlock(stmt.body, env);
      case 'AgentDecl': return this.execAgentDecl(stmt as AST.AgentDecl, env);
      case 'EmitStmt': return this.execEmit(stmt as AST.EmitStmt, env);
      case 'TestBlock': return this.execTestBlock(stmt as AST.TestBlock, env);
      case 'StateDecl': return this.execStateDecl(stmt as AST.StateDecl, env);
      case 'OnHandler': return mkNull(); // Handled inside agent
      case 'ToolDecl': return mkNull(); // Handled inside agent
      case 'MemDecl': return mkNull(); // Handled inside agent
      case 'ExtDecl': return this.execExt(stmt as AST.ExtDecl, env);
      case 'InterfaceDecl': return this.execInterface(stmt as AST.InterfaceDecl, env);
      case 'DecoratedStmt': return this.execDecorated(stmt as AST.DecoratedStmt, env);
      case 'ContractFnDecl': return this.execContractFn(stmt as AST.ContractFnDecl, env);
      case 'ImportStmt': return mkNull(); // TODO: implement modules
      case 'ExportStmt': return mkNull(); // TODO
      default: throw new Error(`[Runtime] Unknown statement type: ${(stmt as any).type}`);
    }
  }

  private execLet(stmt: AST.LetDecl, env: Environment): KodeValue {
    const value = this.evalExpr(stmt.value, env);
    env.define(stmt.name, value, false);
    return value;
  }

  private execVar(stmt: AST.VarDecl, env: Environment): KodeValue {
    const value = this.evalExpr(stmt.value, env);
    env.define(stmt.name, value, true);
    return value;
  }

  private execFnDecl(stmt: AST.FnDecl, env: Environment): KodeValue {
    const fn: KodeValue = {
      type: 'fn',
      name: stmt.name,
      params: stmt.params,
      body: stmt.body,
      closure: env,
    };
    env.define(stmt.name, fn, false);
    return fn;
  }

  private execIf(stmt: AST.IfStmt, env: Environment): KodeValue {
    if (isTruthy(this.evalExpr(stmt.condition, env))) {
      return this.execBlock(stmt.then, env);
    }
    for (const elif of stmt.elifs) {
      if (isTruthy(this.evalExpr(elif.condition, env))) {
        return this.execBlock(elif.body, env);
      }
    }
    if (stmt.else_) {
      return this.execBlock(stmt.else_, env);
    }
    return mkNull();
  }

  private execWhile(stmt: AST.WhileStmt, env: Environment): KodeValue {
    let result: KodeValue = mkNull();
    while (isTruthy(this.evalExpr(stmt.condition, env))) {
      try {
        result = this.execBlock(stmt.body, env);
      } catch (e) {
        if (e instanceof BreakSignal) break;
        if (e instanceof NextSignal) continue;
        throw e;
      }
    }
    return result;
  }

  private execLoop(stmt: AST.LoopStmt, env: Environment): KodeValue {
    let result: KodeValue = mkNull();
    while (true) {
      try {
        result = this.execBlock(stmt.body, env);
      } catch (e) {
        if (e instanceof BreakSignal) break;
        if (e instanceof NextSignal) continue;
        throw e;
      }
    }
    return result;
  }

  private execFor(stmt: AST.ForStmt, env: Environment): KodeValue {
    const iterable = this.evalExpr(stmt.iterable, env);
    let items: KodeValue[];

    if (iterable.type === 'list') {
      items = iterable.items;
    } else if (iterable.type === 'range') {
      items = [];
      const end = iterable.inclusive ? iterable.end : iterable.end;
      for (let i = iterable.start; iterable.inclusive ? i <= iterable.end : i < iterable.end; i++) {
        items.push(mkNum(i));
      }
    } else if (iterable.type === 'map') {
      // Iterate over map entries as @{key|"k" value|v} maps
      items = [...iterable.entries].map(([k, v]) => {
        const m = new Map<string, KodeValue>();
        m.set('key', mkStr(k));
        m.set('value', v);
        return mkMap(m) as KodeValue;
      });
    } else {
      throw new Error(`[Runtime] Cannot iterate over ${iterable.type}`);
    }

    let result: KodeValue = mkNull();
    for (let i = 0; i < items.length; i++) {
      const loopEnv = new Environment(env);
      loopEnv.define(stmt.variable, items[i], false);
      if (stmt.index) loopEnv.define(stmt.index, mkNum(i), false);
      try {
        result = this.execBlock(stmt.body, loopEnv);
      } catch (e) {
        if (e instanceof BreakSignal) break;
        if (e instanceof NextSignal) continue;
        throw e;
      }
    }
    return result;
  }

  private execMatch(stmt: AST.MatchStmt, env: Environment): KodeValue {
    const value = this.evalExpr(stmt.value, env);
    for (const arm of stmt.arms) {
      if (arm.pattern === '_') {
        return this.evalArmBody(arm.body, env);
      }
      const pattern = this.evalExpr(arm.pattern, env);
      if (kodeEquals(value, pattern)) {
        return this.evalArmBody(arm.body, env);
      }
    }
    return mkNull();
  }

  private evalArmBody(body: AST.Stmt[] | AST.Expr, env: Environment): KodeValue {
    if (Array.isArray(body)) return this.execBlock(body, env);
    return this.evalExpr(body, env);
  }

  private execTryCatch(stmt: AST.TryCatch, env: Environment): KodeValue {
    try {
      return this.execBlock(stmt.tryBody, env);
    } catch (e) {
      // Don't catch control flow signals
      if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof NextSignal) throw e;

      if (stmt.catchBody) {
        const catchEnv = new Environment(env);
        if (stmt.catchParam) {
          if (e instanceof ThrowSignal) {
            catchEnv.define(stmt.catchParam, e.value, false);
          } else if (e instanceof Error) {
            catchEnv.define(stmt.catchParam, mkStr(e.message), false);
          } else {
            catchEnv.define(stmt.catchParam, mkStr(String(e)), false);
          }
        }
        return this.execBlock(stmt.catchBody, catchEnv);
      }
      throw e;
    } finally {
      if (stmt.finallyBody) {
        this.execBlock(stmt.finallyBody, env);
      }
    }
  }

  private execAssignment(stmt: AST.Assignment, env: Environment): KodeValue {
    const value = this.evalExpr(stmt.value, env);

    if (stmt.target.type === 'Identifier') {
      if (stmt.op === '=') {
        env.set(stmt.target.name, value);
      } else {
        const current = env.get(stmt.target.name);
        env.set(stmt.target.name, this.compoundAssign(current, stmt.op, value));
      }
      return value;
    }

    if (stmt.target.type === 'MemberExpr') {
      const obj = this.evalExpr(stmt.target.object, env);
      if (obj.type === 'map') {
        const newVal = stmt.op === '=' ? value :
          this.compoundAssign(obj.entries.get(stmt.target.property) ?? mkNull(), stmt.op, value);
        obj.entries.set(stmt.target.property, newVal);
        return newVal;
      }
    }

    if (stmt.target.type === 'IndexExpr') {
      const obj = this.evalExpr(stmt.target.object, env);
      const idx = this.evalExpr(stmt.target.index, env);
      if (obj.type === 'list' && idx.type === 'num') {
        const newVal = stmt.op === '=' ? value :
          this.compoundAssign(obj.items[idx.value] ?? mkNull(), stmt.op, value);
        obj.items[idx.value] = newVal;
        return newVal;
      }
    }

    throw new Error(`[Runtime] Invalid assignment target`);
  }

  private compoundAssign(current: KodeValue, op: string, value: KodeValue): KodeValue {
    if (current.type !== 'num' || value.type !== 'num') {
      if (op === '+=' && current.type === 'str' && value.type === 'str') return mkStr(current.value + value.value);
      if (op === '+=' && current.type === 'list') return mkList([...current.items, value]);
      throw new Error(`[Runtime] Cannot apply ${op} to ${current.type} and ${value.type}`);
    }
    switch (op) {
      case '+=': return mkNum(current.value + value.value);
      case '-=': return mkNum(current.value - value.value);
      case '*=': return mkNum(current.value * value.value);
      case '/=': return mkNum(current.value / value.value);
      default: throw new Error(`[Runtime] Unknown compound operator ${op}`);
    }
  }

  // --- Phase 7: Test blocks ---

  private execTestBlock(stmt: AST.TestBlock, env: Environment): KodeValue {
    // Collect test, don't run unless in test mode
    this.testBlocks.push({ name: stmt.name, body: stmt.body, env });
    return mkNull();
  }

  /** Run all collected test blocks. Returns { passed, failed, errors } */
  runTests(): { passed: number; failed: number; errors: { name: string; error: string }[] } {
    this.testMode = true;
    let passed = 0;
    let failed = 0;
    const errors: { name: string; error: string }[] = [];

    for (const test of this.testBlocks) {
      try {
        const testEnv = new Environment(test.env);
        for (const stmt of test.body) {
          this.execStmt(stmt, testEnv);
        }
        passed++;
        console.log(`  \x1b[32m✓\x1b[0m ${test.name}`);
      } catch (e: any) {
        failed++;
        const msg = e.message ?? String(e);
        errors.push({ name: test.name, error: msg });
        console.log(`  \x1b[31m✗\x1b[0m ${test.name}`);
        console.log(`    ${msg}`);
      }
    }

    return { passed, failed, errors };
  }

  // --- Phase 5: State Machines, Memory ---

  private execStateDecl(stmt: AST.StateDecl, env: Environment): KodeValue {
    const transitions = new Map<string, Map<string, string>>();
    let initial = '';
    for (const state of stmt.states) {
      if (!initial) initial = state.name;
      const eventMap = new Map<string, string>();
      for (const t of state.transitions) {
        eventMap.set(t.event, t.target);
      }
      transitions.set(state.name, eventMap);
    }

    this.stateMachineDefs.set(stmt.name, { states: transitions, initial });

    // Define a factory in env: StateName.new() creates an instance
    const smFactory = new Map<string, KodeValue>();
    const self = this;
    smFactory.set('new', {
      type: 'native_fn',
      name: `${stmt.name}.new`,
      call: () => {
        const sm: KodeStateMachine = {
          type: 'state_machine',
          name: stmt.name,
          current: initial,
          transitions,
        };
        // Return as a map with state property and send method
        const smMap = new Map<string, KodeValue>();
        smMap.set('state', mkStr(sm.current));
        smMap.set('send', {
          type: 'native_fn',
          name: `${stmt.name}.send`,
          call: (args: KodeValue[]) => {
            const event = args[0];
            if (event.type !== 'str') throw new Error('[StateMachine] send() requires a string event');
            const currentTrans = sm.transitions.get(sm.current);
            if (!currentTrans || !currentTrans.has(event.value)) {
              throw new Error(`[StateMachine] Invalid transition: '${event.value}' from state '${sm.current}'`);
            }
            sm.current = currentTrans.get(event.value)!;
            smMap.set('state', mkStr(sm.current));
            return mkStr(sm.current);
          },
        });
        return mkMap(smMap);
      },
    });

    env.define(stmt.name, mkMap(smFactory), false);
    return mkNull();
  }

  // --- Phase 3: Extensions, Interfaces, Decorators, Contracts ---

  private execExt(stmt: AST.ExtDecl, env: Environment): KodeValue {
    if (!this.extensions.has(stmt.targetType)) {
      this.extensions.set(stmt.targetType, new Map());
    }
    const extMap = this.extensions.get(stmt.targetType)!;
    for (const method of stmt.methods) {
      const fn: KodeValue = {
        type: 'fn',
        name: `${stmt.targetType}.${method.name}`,
        params: method.params,
        body: method.body,
        closure: env,
      };
      extMap.set(method.name, fn);
    }
    return mkNull();
  }

  private execInterface(stmt: AST.InterfaceDecl, env: Environment): KodeValue {
    this.interfaces.set(stmt.name, {
      name: stmt.name,
      methods: stmt.methods.map(m => m.name),
    });
    return mkNull();
  }

  private execDecorated(stmt: AST.DecoratedStmt, env: Environment): KodeValue {
    // First, register the function
    const fn: KodeValue = {
      type: 'fn',
      name: stmt.target.name,
      params: stmt.target.params,
      body: stmt.target.body,
      closure: env,
    };

    // Apply decorator
    let wrapped = fn;
    const args = stmt.args.map(a => this.evalExpr(a, env));

    switch (stmt.decorator) {
      case 'log': {
        const original = fn;
        wrapped = {
          type: 'native_fn',
          name: stmt.target.name,
          call: (callArgs: KodeValue[]) => {
            console.log(`[log] ${stmt.target.name}(${callArgs.map(stringify).join(', ')})`);
            const result = this.callFn(original, callArgs);
            console.log(`[log] ${stmt.target.name} -> ${stringify(result)}`);
            return result;
          },
        };
        break;
      }
      case 'cached': {
        const original = fn;
        const cache = new Map<string, KodeValue>();
        wrapped = {
          type: 'native_fn',
          name: stmt.target.name,
          call: (callArgs: KodeValue[]) => {
            const key = callArgs.map(stringify).join(',');
            if (cache.has(key)) return cache.get(key)!;
            const result = this.callFn(original, callArgs);
            cache.set(key, result);
            return result;
          },
        };
        break;
      }
      case 'timeout': {
        // For sync evaluator, timeout is a no-op placeholder
        wrapped = fn;
        break;
      }
      default: {
        // Custom decorator: look up a function with that name and call it with the fn
        if (env.has(stmt.decorator)) {
          const decoratorFn = env.get(stmt.decorator);
          wrapped = this.callFn(decoratorFn, [fn, ...args]);
        }
        break;
      }
    }

    env.define(stmt.target.name, wrapped, false);
    return wrapped;
  }

  private execContractFn(stmt: AST.ContractFnDecl, env: Environment): KodeValue {
    const fnDecl = stmt.fn;
    const preconditions = stmt.preconditions;
    const postconditions = stmt.postconditions;

    const originalFn: KodeValue = {
      type: 'fn',
      name: fnDecl.name,
      params: fnDecl.params,
      body: fnDecl.body,
      closure: env,
    };

    // Wrap with contract checking
    const self = this;
    const contractFn: KodeValue = {
      type: 'native_fn',
      name: fnDecl.name,
      call: (args: KodeValue[]) => {
        // Set up env with params for contract checking
        const contractEnv = new Environment(env);
        for (let i = 0; i < fnDecl.params.length; i++) {
          contractEnv.define(fnDecl.params[i].name, args[i] ?? mkNull(), false);
        }

        // Check preconditions
        for (const pre of preconditions) {
          const result = self.evalExpr(pre, contractEnv);
          if (!isTruthy(result)) {
            throw new Error(`[Contract] Precondition failed: ${pre.type === 'BinaryExpr' ? `${(pre as any).left?.name ?? ''} ${(pre as any).op} ${stringify(self.evalExpr((pre as any).right, contractEnv))}` : 'condition not met'}`);
          }
        }

        // Call the actual function
        const result = self.callFn(originalFn, args);

        // Check postconditions (with 'result' available)
        contractEnv.define('result', result, false);
        for (const post of postconditions) {
          const check = self.evalExpr(post, contractEnv);
          if (!isTruthy(check)) {
            throw new Error(`[Contract] Postcondition failed`);
          }
        }

        return result;
      },
    };

    env.define(fnDecl.name, contractFn, false);
    return contractFn;
  }

  // --- Phase 4: Agents ---

  private execAgentDecl(stmt: AST.AgentDecl, env: Environment): KodeValue {
    // Store the agent definition (template) — not instantiated until `sp`
    this.agentDefs.set(stmt.name, { body: stmt.body, defEnv: env });
    // Also define the agent name in scope so `sp AgentName` can find it
    env.define(stmt.name, mkStr(`<agent_def:${stmt.name}>`), false);
    return mkNull();
  }

  private spawnAgent(name: string, env: Environment): KodeValue {
    const def = this.agentDefs.get(name);
    if (!def) throw new Error(`[Agent] Unknown agent '${name}'`);

    const agentEnv = new Environment(def.defEnv);
    const agent = this.agentRuntime.createAgent(name, agentEnv);

    // Execute agent body to set up state, handlers, etc.
    for (const stmt of def.body) {
      if (stmt.type === 'OnHandler') {
        const onStmt = stmt as AST.OnHandler;
        this.agentRuntime.registerHandler(agent.id, onStmt.event, onStmt.param, onStmt.body);
      } else if (stmt.type === 'VarDecl') {
        const vd = stmt as AST.VarDecl;
        const value = this.evalExpr(vd.value, agentEnv);
        agentEnv.define(vd.name, value, true);
      } else if (stmt.type === 'LetDecl') {
        const ld = stmt as AST.LetDecl;
        const value = this.evalExpr(ld.value, agentEnv);
        agentEnv.define(ld.name, value, false);
      } else if (stmt.type === 'FnDecl') {
        this.execStmt(stmt, agentEnv);
      }
    }

    // Fire "start" handler if exists
    const startHandler = agent.handlers.get('start');
    if (startHandler) {
      const startEnv = new Environment(agentEnv);
      if (startHandler.param) startEnv.define(startHandler.param, mkNull(), false);
      this.agentRuntime.setEvalCallback((stmts, env) => {
        let result: KodeValue = mkNull();
        for (const s of stmts) result = this.execStmt(s, env);
        return result;
      });
      try {
        let result: KodeValue = mkNull();
        for (const s of startHandler.body) result = this.execStmt(s, startEnv);
      } catch {}
    }

    // Return a map representing the agent reference
    const agentRef = new Map<string, KodeValue>();
    agentRef.set('id', mkStr(agent.id));
    agentRef.set('name', mkStr(agent.name));
    return mkMap(agentRef);
  }

  private execEmit(stmt: AST.EmitStmt, env: Environment): KodeValue {
    const target = this.evalExpr(stmt.target, env);
    const payload = this.evalExpr(stmt.payload, env);

    // Determine target agent
    let targetId: string;
    if (target.type === 'str') {
      targetId = target.value;
    } else if (target.type === 'map' && target.entries.has('id')) {
      targetId = (target.entries.get('id') as any).value;
    } else {
      throw new Error(`[Agent] Invalid emit target: ${stringify(target)}`);
    }

    // Extract event type from payload
    let event = 'message';
    if (payload.type === 'map' && payload.entries.has('type')) {
      const t = payload.entries.get('type');
      if (t && t.type === 'str') event = t.value;
    }

    if (targetId === '*') {
      this.agentRuntime.broadcast(event, payload);
    } else {
      this.agentRuntime.emit(targetId, event, payload);
    }

    // Process messages immediately (cooperative scheduling)
    this.agentRuntime.processMessages();

    return mkNull();
  }

  /** Look up extension method for a value type */
  private getExtMethod(valueType: string, method: string): KodeValue | null {
    const extMap = this.extensions.get(valueType);
    if (extMap && extMap.has(method)) return extMap.get(method)!;
    return null;
  }

  // --- Block execution ---
  execBlock(stmts: AST.Stmt[], parentEnv: Environment): KodeValue {
    const env = new Environment(parentEnv);
    let result: KodeValue = mkNull();
    for (const stmt of stmts) {
      result = this.execStmt(stmt, env);
    }
    return result;
  }

  // --- Expression evaluation ---
  evalExpr(expr: AST.Expr, env: Environment): KodeValue {
    switch (expr.type) {
      case 'NumberLit': return mkNum(expr.value);
      case 'StringLit': return mkStr(expr.value);
      case 'BoolLit': return mkBool(expr.value);
      case 'NullLit': return mkNull();
      case 'Identifier': return env.get(expr.name);
      case 'BinaryExpr': return this.evalBinary(expr, env);
      case 'UnaryExpr': return this.evalUnary(expr, env);
      case 'LogicalExpr': return this.evalLogical(expr, env);
      case 'CallExpr': return this.evalCall(expr, env);
      case 'MemberExpr': return this.evalMember(expr, env);
      case 'IndexExpr': return this.evalIndex(expr, env);
      case 'PipeExpr': return this.evalPipe(expr, env);
      case 'RangeExpr': return this.evalRange(expr, env);
      case 'ToonMap': return this.evalToonMap(expr, env);
      case 'ToonList': return this.evalToonList(expr, env);
      case 'Lambda': return this.evalLambda(expr, env);
      case 'StringInterp': return this.evalStringInterp(expr, env);
      case 'IfStmt': return this.execIf(expr as any, env);
      case 'SpawnExpr': return this.spawnAgent((expr as AST.SpawnExpr).name, env);
      case 'AwaitExpr': return this.evalExpr((expr as AST.AwaitExpr).value, env); // sync for now
      case 'AssignExpr': return this.evalAssignExpr(expr, env);
      default: throw new Error(`[Runtime] Unknown expression type: ${(expr as any).type}`);
    }
  }

  private evalBinary(expr: AST.BinaryExpr, env: Environment): KodeValue {
    const left = this.evalExpr(expr.left, env);
    const right = this.evalExpr(expr.right, env);

    // Null coalescing
    if (expr.op === '??') return left.type === 'null' ? right : left;

    // String concatenation
    if (expr.op === '+' && (left.type === 'str' || right.type === 'str')) {
      return mkStr(stringify(left) + stringify(right));
    }

    // List concatenation
    if (expr.op === '+' && left.type === 'list' && right.type === 'list') {
      return mkList([...left.items, ...right.items]);
    }

    // Equality (works for all types)
    if (expr.op === '==') return mkBool(kodeEquals(left, right));
    if (expr.op === '!=') return mkBool(!kodeEquals(left, right));

    // Numeric operations
    if (left.type === 'num' && right.type === 'num') {
      switch (expr.op) {
        case '+': return mkNum(left.value + right.value);
        case '-': return mkNum(left.value - right.value);
        case '*': return mkNum(left.value * right.value);
        case '/':
          if (right.value === 0) throw new Error('[Runtime] Division by zero');
          return mkNum(left.value / right.value);
        case '%': return mkNum(left.value % right.value);
        case '**': return mkNum(left.value ** right.value);
        case '<': return mkBool(left.value < right.value);
        case '>': return mkBool(left.value > right.value);
        case '<=': return mkBool(left.value <= right.value);
        case '>=': return mkBool(left.value >= right.value);
      }
    }

    // String comparison
    if (left.type === 'str' && right.type === 'str') {
      switch (expr.op) {
        case '<': return mkBool(left.value < right.value);
        case '>': return mkBool(left.value > right.value);
        case '<=': return mkBool(left.value <= right.value);
        case '>=': return mkBool(left.value >= right.value);
      }
    }

    throw new Error(`[Runtime] Cannot apply '${expr.op}' to ${left.type} and ${right.type}`);
  }

  private evalUnary(expr: AST.UnaryExpr, env: Environment): KodeValue {
    const val = this.evalExpr(expr.operand, env);
    if (expr.op === '-') {
      if (val.type !== 'num') throw new Error(`[Runtime] Cannot negate ${val.type}`);
      return mkNum(-val.value);
    }
    if (expr.op === '!') return mkBool(!isTruthy(val));
    throw new Error(`[Runtime] Unknown unary operator '${expr.op}'`);
  }

  private evalLogical(expr: AST.LogicalExpr, env: Environment): KodeValue {
    const left = this.evalExpr(expr.left, env);
    if (expr.op === '|') return isTruthy(left) ? left : this.evalExpr(expr.right, env);
    if (expr.op === '&') return !isTruthy(left) ? left : this.evalExpr(expr.right, env);
    throw new Error(`[Runtime] Unknown logical operator '${expr.op}'`);
  }

  private evalCall(expr: AST.CallExpr, env: Environment): KodeValue {
    const callee = this.evalExpr(expr.callee, env);
    const args = expr.args.map(a => this.evalExpr(a, env));

    if (callee.type === 'native_fn') {
      return callee.call(args);
    }

    if (callee.type === 'fn') {
      if (this.depth >= this.maxDepth) throw new Error(`[Runtime] Maximum recursion depth (${this.maxDepth}) exceeded`);
      this.depth++;
      try {
        const fnEnv = new Environment(callee.closure);
        for (let i = 0; i < callee.params.length; i++) {
          fnEnv.define(callee.params[i].name, args[i] ?? mkNull(), false);
        }
        // Arrow form (single expression)
        if (!Array.isArray(callee.body)) {
          return this.evalExpr(callee.body, fnEnv);
        }
        // Block form
        try {
          this.execBlock(callee.body, fnEnv);
          return mkNull();
        } catch (e) {
          if (e instanceof ReturnSignal) return e.value;
          throw e;
        }
      } finally {
        this.depth--;
      }
    }

    throw new Error(`[Runtime] Cannot call ${callee.type}`);
  }

  private evalMember(expr: AST.MemberExpr, env: Environment): KodeValue {
    const obj = this.evalExpr(expr.object, env);
    if (obj.type === 'map') {
      const val = obj.entries.get(expr.property);
      if (val === undefined) {
        // Check extensions for map type
        const ext = this.getExtMethod('map', expr.property);
        if (ext) return this.bindSelf(ext, obj);
        throw new Error(`[Runtime] Property '${expr.property}' not found`);
      }
      return val;
    }
    if (obj.type === 'str') {
      switch (expr.property) {
        case 'len': return mkNum(obj.value.length);
      }
      // Check string extensions
      const ext = this.getExtMethod('str', expr.property);
      if (ext) return this.bindSelf(ext, obj);
    }
    if (obj.type === 'list') {
      switch (expr.property) {
        case 'len': return mkNum(obj.items.length);
      }
      const ext = this.getExtMethod('lst', expr.property);
      if (ext) return this.bindSelf(ext, obj);
    }
    if (obj.type === 'num') {
      const ext = this.getExtMethod('num', expr.property);
      if (ext) return this.bindSelf(ext, obj);
    }
    if (obj.type === 'bool') {
      const ext = this.getExtMethod('bool', expr.property);
      if (ext) return this.bindSelf(ext, obj);
    }
    throw new Error(`[Runtime] Cannot access property '${expr.property}' on ${obj.type}`);
  }

  /** Bind 'self' to an extension method, returning a callable */
  private bindSelf(fn: KodeValue, self: KodeValue): KodeValue {
    if (fn.type !== 'fn') return fn;
    const evaluator = this;
    return {
      type: 'native_fn',
      name: fn.name,
      call: (args: KodeValue[]) => {
        const fnEnv = new Environment(fn.closure);
        fnEnv.define('self', self, false);
        for (let i = 0; i < fn.params.length; i++) {
          fnEnv.define(fn.params[i].name, args[i] ?? mkNull(), false);
        }
        if (!Array.isArray(fn.body)) return evaluator.evalExpr(fn.body, fnEnv);
        try {
          let result: KodeValue = mkNull();
          for (const stmt of fn.body) { result = evaluator.execStmt(stmt, fnEnv); }
          return result;
        } catch (e) {
          if (e instanceof ReturnSignal) return e.value;
          throw e;
        }
      },
    };
  }

  private evalIndex(expr: AST.IndexExpr, env: Environment): KodeValue {
    const obj = this.evalExpr(expr.object, env);
    const idx = this.evalExpr(expr.index, env);
    if (obj.type === 'list' && idx.type === 'num') {
      const i = idx.value < 0 ? obj.items.length + idx.value : idx.value;
      return obj.items[i] ?? mkNull();
    }
    if (obj.type === 'str' && idx.type === 'num') {
      return mkStr(obj.value[idx.value] ?? '');
    }
    if (obj.type === 'map' && idx.type === 'str') {
      return obj.entries.get(idx.value) ?? mkNull();
    }
    throw new Error(`[Runtime] Cannot index ${obj.type} with ${idx.type}`);
  }

  private evalPipe(expr: AST.PipeExpr, env: Environment): KodeValue {
    const left = this.evalExpr(expr.left, env);
    // Pipe passes left as first argument to right (which should be a call)
    if (expr.right.type === 'CallExpr') {
      const callee = this.evalExpr(expr.right.callee, env);
      const args = [left, ...expr.right.args.map(a => this.evalExpr(a, env))];
      if (callee.type === 'native_fn') return callee.call(args);
      if (callee.type === 'fn') {
        const fnEnv = new Environment(callee.closure);
        for (let i = 0; i < callee.params.length; i++) {
          fnEnv.define(callee.params[i].name, args[i] ?? mkNull(), false);
        }
        if (!Array.isArray(callee.body)) return this.evalExpr(callee.body, fnEnv);
        try { this.execBlock(callee.body, fnEnv); return mkNull(); }
        catch (e) { if (e instanceof ReturnSignal) return e.value; throw e; }
      }
    }
    throw new Error('[Runtime] Pipe (|>) requires a function call on the right');
  }

  private evalRange(expr: AST.RangeExpr, env: Environment): KodeValue {
    const start = this.evalExpr(expr.start, env);
    const end = this.evalExpr(expr.end, env);
    if (start.type !== 'num' || end.type !== 'num') throw new Error('[Runtime] Range requires numbers');
    return { type: 'range', start: start.value, end: end.value, inclusive: expr.inclusive };
  }

  private evalToonMap(expr: AST.ToonMap, env: Environment): KodeValue {
    const entries = new Map<string, KodeValue>();
    for (const { key, value } of expr.entries) {
      entries.set(key, this.evalExpr(value, env));
    }
    return mkMap(entries);
  }

  private evalToonList(expr: AST.ToonList, env: Environment): KodeValue {
    return mkList(expr.elements.map(e => this.evalExpr(e, env)));
  }

  private evalLambda(expr: AST.Lambda, env: Environment): KodeValue {
    return {
      type: 'fn',
      name: '<lambda>',
      params: expr.params.map(name => ({ name })),
      body: expr.body,
      closure: env,
    };
  }

  private evalStringInterp(expr: AST.StringInterp, env: Environment): KodeValue {
    let result = '';
    for (const part of expr.parts) {
      if (typeof part === 'string') {
        result += part;
      } else {
        result += stringify(this.evalExpr(part, env));
      }
    }
    return mkStr(result);
  }

  private evalAssignExpr(expr: AST.AssignExpr, env: Environment): KodeValue {
    const value = this.evalExpr(expr.value, env);
    if (expr.target.type === 'Identifier') {
      env.set(expr.target.name, value);
      return value;
    }
    throw new Error('[Runtime] Invalid assignment target');
  }
}
