# Kode — A Full-Stack, Token-Efficient Programming Language for AI Agents

## Progress Tracker

**Current Phase**: Phase 9 COMPLETE  
**Last Updated**: 2026-04-06  
**Overall Status**: Phase 1-9 done. 119/119 tests pass. Git repo, CI/CD, kpm, feature flags, intelligence tracker, README all done. Ready for Phase 10 (AI Gateway).

### Phase 1: Foundation — Lexer + Parser + Basic Eval
- [ ] 1.1 Project setup
  - `package.json` (name: kode, typescript, vitest, tsx for dev)
  - `tsconfig.json` (strict, ES2022, NodeNext module)
  - `.gitignore`, folder structure creation
- [ ] 1.2 `src/lexer/tokens.ts` — Token types enum
  - All keywords: lt, vr, fn, rt, if, ef, el, mt, lp, wl, fr, br, nx, tw, ag, tk, em, on, sp, aw, st, mem, tx, ct, fy, im, ex, nl, tr, fl, en, it, sv, go, ch, ext, get
  - NOTE: `tr` = ONLY true (boolean). `it` = interface/trait. `wl` = while. `tw` = throw. `fy` = finally.
  - All operators: + - * / % ** == != < > <= >= & | ! = += -= *= /= |> -> :: .. ..= ... ?? ?.
  - Delimiters: ( ) { } [ ] @{ @[
  - Token interface: { type, lexeme, literal, line, col }
- [ ] 1.3 `src/lexer/lexer.ts` — Tokenizer
  - Scan source string into token array
  - Handle: numbers (int, float, 0xFF hex, 0b1010 binary, 0o77 octal, 1.5e10 sci, 1_000_000 sep)
  - Handle: strings ("interp" and 'raw'), multi-line """...""", escape sequences (\n \t \\ \" \u{xxxx})
  - Handle: tagged templates (sql"...", html"...", url"...")
  - Handle: duration literals (5s, 30m, 2h, 1d)
  - Handle: TOON @{ and @[ prefixes
  - Handle: comments (-- at line start/after whitespace, -* block *-)
  - Track line/col for error reporting
  - Handle: | vs |> disambiguation (| after ( or , or = or start = lambda; else = OR)
  - Handle: .. vs ... (greedy: try ... first, then ..)
- [ ] 1.4 `src/parser/ast.ts` — AST node definitions
  - Program, LetDecl, VarDecl, Assignment, FnDecl, Lambda
  - IfExpr, WhileStmt, LoopStmt, ForStmt, MatchExpr, ReturnStmt, BreakStmt, NextStmt, ThrowStmt, FinallyBlock
  - BinaryExpr, UnaryExpr, CallExpr, MemberExpr, IndexExpr
  - StringInterp, ToonMap, ToonList
  - AgentDecl, ToolDecl, MemDecl, EmitStmt, OnHandler, SpawnExpr, AwaitExpr
  - StateDecl, TryCatch, PipeExpr, ImportStmt, ExportStmt
  - EnumDecl, SupervisorDecl, GoExpr, ChanExpr
  - ExtDecl, InterfaceDecl, GetterDecl, DecoratorExpr, NpmImport
  - ContractPre, ContractPost, RecoverBlock, EnsureStmt
  - CheckpointStmt, RollbackStmt, TestBlock
  - All nodes have { line, col } for error reporting
- [ ] 1.5 `src/parser/parser.ts` — Recursive descent + Pratt parser
  - Pratt parsing for expressions with precedence:
    1. Pipe |>  2. Or |  3. And &  4. Equality == !=
    5. Comparison < > <= >=  6. NullCoalesce ??  7. Range ..
    8. Addition + -  9. Multiplication * / %  10. Power **
    11. Unary ! -  12. OptionalChain ?.  13. Call/Index () [] .
  - Statement parsing: lt, vr, fn, if/ef/el, wl, lp, fr, mt, ag, tk, em, on, sp, aw, st, mem, tx/ct/fy, tw, im (+ npm), ex, en, it, sv, go, ext, get, @decorator, @recover, ensure, checkpoint, rollback, #test, rt, br, nx
  - Newline = statement terminator. Semicolons optional for same-line.
  - `if` is an expression (can be used in `lt y = if ...`)
- [ ] 1.6 `src/evaluator/values.ts` — Runtime value types
  - AiNum, AiStr, AiBool, AiNull
  - AiList, AiMap (TOON)
  - AiFn (params, body, closure env, name)
  - AiNativeFn (name, call function)
  - AiAgent (id, name, env, handlers, message queue)
  - AiTool, AiStateMachine, AiChannel, AiStream
  - AiEnum, AiEnumVariant
  - AiResult (Ok/Err), AiOption (Some/None)
  - AiError (msg, type, line, col)
- [ ] 1.7 `src/evaluator/environment.ts` — Scope chain
  - Environment class with parent pointer
  - define(name, value), get(name), set(name, value)
  - Support for closures (capture enclosing env)
  - Global env with built-in functions pre-loaded
- [ ] 1.8 `src/evaluator/evaluator.ts` — Tree-walking interpreter
  - Async evaluate(node) returns Promise<AiValue>
  - Handle all expression types (binary, unary, call, member, index, pipe)
  - Handle all statement types (let, var, assign, if, while, loop, for, match, return, break, next, throw)
  - Handle functions (declaration, call, closures, lambdas, variadic ...args)
  - Handle string interpolation + tagged templates
  - Handle TOON map/list evaluation
  - Handle try/catch/finally (tx/ct/fy)
  - Handle assign to member/index: user.name = "x", items[0] = 5
  - Sync fast path: only create Promises when aw/go/em encountered
  - Max recursion depth: 10,000 (configurable)
- [ ] 1.9 `src/evaluator/builtins.ts` — Built-in functions
  - `io.out(value)` — print to stdout
  - `io.err(value)` — print to stderr
  - `io.read()` — read from stdin
  - Basic math: `math.abs`, `math.floor`, `math.ceil`, `math.round`, `math.random`
  - Type checking: `type(value)` returns "num"/"str"/"bool"/"nl"/"lst"/"mp"/"fn"
  - Conversion: `num("42")`, `str(42)`, `bool(0)`
  - `len(value)` — length of str/lst/mp
- [ ] 1.10 `src/index.ts` — CLI entry point
  - `kode <file.kd>` — execute file
  - `kode` — start REPL (read-eval-print loop)
  - `kode --version` — print version
  - `kode --ast <file.kd>` — print AST (debug)
  - `kode --tokens <file.kd>` — print tokens (debug)
  - Use `process.argv` for argument parsing
  - REPL: readline interface, evaluate each line, print result
- [ ] 1.11 `examples/hello.kd` — First working program
  ```
  lt name = "Kode"
  io.out("Hello from ${name}!")
  
  fn fib(n) {
    if n <= 1 { rt n }
    rt fib(n - 1) + fib(n - 2)
  }
  
  fr i : 0..10 {
    io.out("fib(${i}) = ${fib(i)}")
  }
  ```
- [ ] 1.12 Tests
  - `tests/lexer.test.ts` — tokenize keywords, operators, strings, TOON, comments
  - `tests/parser.test.ts` — parse expressions, statements, functions
  - `tests/evaluator.test.ts` — evaluate arithmetic, variables, functions, control flow
- [ ] **MILESTONE: `kode examples/hello.kd` runs and prints fibonacci**

### Phase 2: Type System & Data
- [ ] 2.1 TOON `@{}` and `@[]` parsing + evaluation
  - `@{key|value key2|value2}` → AiMap
  - `@[1 2 3]` → AiList
  - Nested: `@{user|@{name|"Ada" age|30}}`
  - Access: `user.name`, `items[0]`, `nested.deep.value`
- [ ] 2.2 Null safety
  - `str?` nullable type annotation
  - `??` null coalescing: `name ?? "default"`
  - `?.` optional chaining: `user?.address?.city`
  - Compile-time check: non-nullable can't be assigned nl
- [ ] 2.3 `en` enums / tagged unions
  - Simple: `en Color { Red Green Blue }`
  - With data: `en Result[T] { Ok(T) Err(str) }`
  - Pattern match: `mt result { Ok(v) -> use(v)  Err(e) -> io.err(e) }`
- [ ] 2.4 `Result[T]` and `Option[T]` as built-in types
  - `Ok(value)`, `Err(msg)` constructors
  - `Some(value)`, `None` constructors
  - `.unwrap()`, `.unwrap_or(default)`, `.map(fn)`, `.and_then(fn)`
- [ ] 2.5 Generics
  - Functions: `fn first[T](items :: lst[T]) :: T`
  - Enums: `en Result[T] { Ok(T) Err(str) }`
  - Type inference: `lt x = first(@[1 2 3])` infers T=num
- [ ] 2.6 Destructuring
  - Map: `lt @{name, age} = user`
  - List: `lt @[first, ...rest] = items`
  - Nested: `lt @{address: @{city}} = user`
  - In function params: `fn greet(@{name, age}) { ... }`
- [ ] 2.7 String interpolation + tagged templates
  - `"hello ${name}"` — interpolated
  - `'raw ${no_interp}'` — raw literal
  - `"""multi\nline"""` — multi-line
  - `sql"select * from users where id = ${id}"` — parameterized
  - `html"<h1>${title}</h1>"` — auto-escaped
- [ ] 2.8 Operators
  - Pipe: `data |> fn1() |> fn2()`
  - Range: `0..10` (exclusive), `0..=10` (inclusive)
  - Spread: `@{...base, name|"new"}`, `@[...old, 4, 5]`
- [ ] **MILESTONE: TOON data + type system + null safety working**

### Phase 3: Functions & Composition
- [ ] 3.1 Closures and lambdas
  - `|x| -> x * 2` single expression
  - `|x, y| { lt z = x + y; rt z }` block body
  - Closures capture enclosing environment
- [ ] 3.2 `ext` extension functions
  - `ext str { fn is_email() :: bool -> self.contains("@") }`
  - `ext num { fn clamp(min, max) -> ... }`
  - `self` keyword refers to the extended value
- [ ] 3.3 `it` interfaces/traits (keyword `it`, not `tr` — `tr` = true)
  - `it Printable { fn to_str() :: str }`
  - `ag MyAgent :: Printable { fn to_str() -> "agent" }`
  - Trait bounds on generics: `fn print[T :: Printable](val :: T)`
- [ ] 3.4 `get` computed properties
  - `get full_name -> "${first} ${last}"`
  - Read-only, recalculated on every access
- [ ] 3.5 Decorators
  - `@cached(ttl: 60s)` — memoize function results
  - `@rate_limit(100, per: "1m")` — throttle calls
  - `@log` — log entry/exit/duration
  - `@timeout(5s)` — fail if function takes too long
  - Custom decorators: `fn my_decorator(wrapped_fn) -> |...args| { ... }`
- [ ] 3.6 Contracts
  - `pre: amount > 0` — validate before function body
  - `post: result.len() > 0` — validate after function returns
  - `old.balance` — reference to pre-call state in post conditions
  - Runtime error with line number if contract violated
- [ ] 3.7 Standard library modules
  - `io`: out, err, read, read_line
  - `str`: split, join, trim, starts, ends, contains, replace, upper, lower, len, slice, pad
  - `lst`: map, filter, reduce, find, sort, reverse, flat, zip, chunk, unique, len, push, pop, slice
  - `mp`: keys, values, entries, has, get, set, delete, merge, len
  - `math`: abs, floor, ceil, round, random, min, max, pow, sqrt, sin, cos, pi, e
  - `time`: now, sleep, format, parse, diff (supports duration type: 5s, 30m, 2h)
  - `json`: parse(str), to_str(value) — convert between JSON and TOON
  - `re`: match, replace, test, split — regex operations
  - `enc`: base64, base64_decode, url_encode, url_decode, hex
  - `crypto`: sha256, hmac, encrypt, decrypt, random_bytes
  - `uuid`: v4()
  - `env`: get("KEY"), set("KEY","val"), load(".env")
  - `log`: debug, info, warn, error — structured logging with levels
  - `url`: parse, build
  - `proc`: exec("cmd"), spawn("cmd", args) — run external commands
  - `set`: new, add, has, delete, union, intersect, diff
- [ ] 3.8 Import/export module system
  - `im "./utils" {parse, format}` — import from file
  - `im std.io {out, err}` — import from stdlib
  - `ex fn helper() { ... }` — export
  - Module resolution: relative paths, then std, then kpm packages
- [ ] **MILESTONE: Full function system + stdlib + modules working**

### Phase 4: Agents & Concurrency
- [ ] 4.1 `ag` agent declaration
  - Agent has own environment (scope)
  - Can contain: vr, fn, tk, mem, on, get, allow, deny, budget
  - Agent instances are values (can be stored in variables)
- [ ] 4.2 `sp` spawn
  - `lt scout = sp Scout` — create agent instance
  - Agent starts its own message loop
  - Returns agent reference
- [ ] 4.3 `em` emit messages
  - `em scout @{type|"search" query|"AI"}` — send to specific agent
  - `em * @{type|"shutdown"}` — broadcast to all
  - `lt reply = aw em scout @{type|"question"}` — request-response
- [ ] 4.4 `on` event handlers
  - `on "search" (payload) { ... }` — handle named events
  - `on "start" () { ... }` — lifecycle: agent started
  - `on "stop" () { ... }` — lifecycle: agent stopping
  - `on "error" (err) { ... }` — lifecycle: unhandled error
- [ ] 4.5 `go` + `chan` concurrency
  - `lt task = go expensive_fn()` — spawn lightweight task
  - `lt result = aw task` — await task result
  - `lt ch = chan[str]()` — create typed channel
  - `ch.send("hello")` — send to channel
  - `lt msg = ch.recv()` — receive from channel
  - `ch.close()` — close channel
  - `fr msg : ch { ... }` — iterate channel
- [ ] 4.6 Async patterns
  - `aw expr` — await a single async value
  - `aw all(t1, t2, t3)` — await all, return list of results
  - `aw race(t1, t2)` — return first to complete
  - `aw any(t1, t2)` — return first success (skip errors)
- [ ] 4.7 Agent event loop
  - Cooperative scheduling using Node.js event loop
  - Message queue per agent (FIFO)
  - Process one message at a time per agent
  - Agents run concurrently (not parallel — single thread)
- [ ] 4.8 `sv` supervisor trees
  - `sv MySupervisor { strategy: one_for_one  children: @[...] }`
  - Strategies: one_for_one (restart failed child), all_for_one (restart all)
  - `max_restarts: N  within: Xs` — crash if too many restarts
  - Auto-restart crashed agents
- [ ] `examples/team.kd` — multi-agent example
- [ ] **MILESTONE: Multi-agent programs run with concurrency**

### Phase 5: Tools, Memory, State, Safety
- [ ] 5.1 `tk` tool declaration + registry
  - `tk web_search(q :: str) :: str { ... }` — tool with body
  - `tk external_api(url :: str) :: mp` — external tool (host provides impl)
  - Tool registry: register, lookup, invoke
  - Tool timeout: `aw tk.search(q) :: @{timeout|5000 retry|3}`
- [ ] 5.2 `mem` memory subsystem
  - `mem.w` working: in-memory Map, volatile, per-agent
  - `mem.s` semantic: persistent JSON file, store/recall/search
  - `mem.e` episodic: append-only event log, last(N)
  - `mem.p` procedural: store/retrieve learned functions
  - Persistence backend: JSON files in `.kode-data/` directory
- [ ] 5.3 `st` state machines
  - `st Flow { "idle" { on "go" -> "running" } ... }`
  - `vr f = Flow.new()` — instantiate
  - `f.send("go")` — trigger transition
  - `f.state` — current state
  - Invalid transitions throw error
- [ ] 5.4 `@recover`/`fix` self-healing
  - `@recover { risky_code } fix (err, ctx) { ... }`
  - `ctx` contains: vars, stack, line, col, attempt number
  - `retry(N)` — retry up to N times
  - `retry_with(new_args)` — retry with modified inputs
- [ ] 5.5 `checkpoint`/`rollback`
  - `checkpoint "name"` — snapshot current state
  - `rollback "name"` — restore to snapshot
  - Snapshots include: all variables in scope, agent state, memory
- [ ] 5.6 Sandboxing
  - `allow fs.read("/data/*")` — whitelist
  - `deny fs.write("*.env")` — blacklist
  - `deny net.get("*")` — block all network
  - Violations throw PermissionError with details
- [ ] 5.7 Budget system
  - `budget tokens: 50000` — max LLM tokens
  - `budget time: 30s` — max execution time
  - `budget cost: "$5.00"` — max dollar spend
  - Exceeding budget throws BudgetError
- [ ] 5.8 Cost tracking
  - `cost.estimate(fn, args)` — estimate before running
  - `cost.spent` — tokens/dollars used so far
  - `cost.remaining` — budget left
  - Per-agent and per-tool tracking
- [ ] 5.9 `ensure` intent declarations
  - `ensure db.users has_column "email" :: str`
  - `ensure file "config.kd" exists`
  - Runtime interprets intent → executes necessary steps
- [ ] 5.10 Network + filesystem stdlib
  - `net.get(url, headers?)`, `net.post(url, body, headers?)`
  - `fs.read(path)`, `fs.write(path, content)`, `fs.exists(path)`
  - `fs.list(dir)`, `fs.mkdir(path)`, `fs.remove(path)`
- [ ] `examples/researcher.kd`, `examples/workflow.kd`
- [ ] **MILESTONE: Complete agent feature set with safety**

### Phase 6: Full-Stack — Web, Database, HTML
- [ ] 6.1 `std.web` — HTTP server
  - `serve(port) { on "GET /path" -> handler }` routing
  - `req` object: .body, .headers, .query, .params, .method, .path, .cookies, .files
  - Response helpers: `json(data, status?)`, `html(str)`, `redirect(url)`
  - `res.cookie("name", "val", @{httpOnly|tr})`, `res.stream(fn(send) { ... })` (SSE)
  - `static("./public")` — serve static files
  - Middleware: `use(logger)`, `use(cors(@{origins|"*"}))`, `use(auth_check)`
  - Auto-parse urlencoded + multipart form data on POST
  - Auto `/health` endpoint, auto security headers (X-Frame-Options, CSP, HSTS)
  - HTTPS: `serve(3000, @{tls|@{cert|"cert.pem" key|"key.pem"}})`
  - `req.validate(@{name|str email|str})` — request body validation
  - Graceful shutdown: auto SIGTERM handling, drain requests, close DB
  - Multi-core: `kode run --workers 4 app.kd` (Node.js cluster)
  - Built on Node.js `http`/`https` module
- [ ] 6.2 `std.html` — HTML templating
  - `html"<h1>${title}</h1>"` — tagged template, auto-escaped
  - Component functions: `fn card(title, body) -> html"<div>...</div>"`
  - Compose: `fn page(content) -> html"<html><body>${content}</body></html>"`
- [ ] 6.3 `std.db` — Database
  - `open("sqlite:app.db")` — SQLite (bundled, zero config)
  - `open("postgres://user:pass@host/db")` — Postgres connector
  - `db.exec(sql, params?)` — execute statement
  - `db.query(sql, params?)` — query rows
  - LINQ-style: `db.users |> where(|u| -> u.age > 18) |> select(...) |> limit(10)`
  - Connection pooling: `open("postgres://...", @{pool|10 idle_timeout|30s})`
  - Dependencies: `better-sqlite3` for SQLite, `pg` for Postgres
- [ ] 6.4 `std.auth`
  - `jwt.create(payload, secret)`, `jwt.verify(token, secret)`
  - `hash(password)`, `verify(password, hash)` — bcrypt
  - Session: `session.set(key, val)`, `session.get(key)`
  - CSRF: `csrf.token()`, `csrf.verify(req)` middleware
  - `secret("API_KEY")` — marked sensitive, excluded from logs
  - Dependencies: `jsonwebtoken`, `bcrypt`
- [ ] 6.5 `std.ws` — WebSocket
  - `socket.on_connect(port, path) (client) { ... }`
  - `socket.join(client, room)`, `socket.leave(client, room)`
  - `socket.broadcast(room, data)`, `socket.send(client, data)`
  - Dependency: `ws` npm package
- [ ] 6.6 `examples/todo-app.kd`
  - Full todo app: auth + database + HTML + API + WebSocket
  - ~120 lines of Kode
- [ ] **MILESTONE: Complete web app runs at localhost:3000**

### Phase 7: Reactive Streams & Testing
- [ ] 7.1 Stream operators
  - `stream.from(source)` — create stream from iterable/channel/API
  - `stream.filter(fn)`, `stream.map(fn)`, `stream.reduce(fn, init)`
  - `stream.batch(size)`, `stream.debounce(ms)`, `stream.throttle(ms)`
  - `stream.merge(s1, s2)`, `stream.concat(s1, s2)`
  - `stream.take(n)`, `stream.skip(n)`
- [ ] 7.2 Backpressure
  - If consumer is slow, producer pauses automatically
  - Buffer size configurable: `stream.from(src, @{buffer|100})`
- [ ] 7.3 WebSocket streams
  - `lt ws_stream = stream.from(socket.messages(client))`
  - Pipe WebSocket data through stream operators
- [ ] 7.4 Agent-to-agent streaming
  - `lt ch = chan[str]()` as stream source
  - `stream.from(ch) |> stream.map(...) |> stream.batch(10)`
- [ ] 7.5 Built-in testing
  - `#test "name" { assert expr; assert_eq(a, b); assert_ne(a, b) }`
  - Tests are ignored during normal execution
  - `kode test file.kd` runs all #test blocks
  - Output: pass/fail count, failure details with line numbers
- [ ] 7.6 `kode test` CLI
  - `kode test` — run all tests in current directory
  - `kode test file.kd` — run tests in specific file
  - `kode test --watch` — re-run on file changes
- [ ] **MILESTONE: Streams + testing framework work**

### Phase 8: Developer Experience
- [ ] 8.1 Hot code reload
  - `kode watch app.kd` — restart on file change
  - `kode reload "agents/scout.kd"` — reload specific agent without restart
  - File watcher using `fs.watch` or `chokidar`
- [ ] 8.2 Rich error messages
  - Show source line with arrow pointing to error
  - Suggestions: "did you mean 'fn' instead of 'fun'?"
  - Color-coded output (red errors, yellow warnings)
  - Stack trace with file:line:col
- [ ] 8.3 REPL improvements
  - Arrow keys for history (readline)
  - Tab completion for keywords + variables in scope
  - Multi-line input (detect incomplete expressions)
  - `.help`, `.clear`, `.exit` commands
- [ ] 8.4 Debug flags
  - `kode --ast file.kd` — print AST as JSON
  - `kode --tokens file.kd` — print token list
  - `kode --time file.kd` — print execution time
- [ ] 8.5 npm packaging
  - `npx kode file.kd` — run without install
  - `npm install -g kode` — global install
  - `bin` field in package.json pointing to compiled CLI
  - Build with `tsup` or `esbuild` for single-file bundle
- [ ] 8.6 VS Code extension
  - Syntax highlighting (TextMate grammar for .kd files)
  - Keyword highlighting, string highlighting, comment highlighting
  - File icon for .kd files
  - Basic snippets (ag, fn, fr, if/ef/el, etc.)
- [ ] 8.7 Documentation
  - `docs/language-spec.md` — complete language specification
  - `docs/stdlib-reference.md` — all stdlib functions
  - `docs/tutorial.md` — getting started guide
  - README.md with quick examples
- [ ] **MILESTONE: Kode is polished and ready for public release**

### Phase 9: Rapid Evolution Infrastructure
- [ ] 9.1 CI/CD pipeline
  - GitHub Actions: build on push, test on PR
  - Build for Windows/Mac/Linux
  - Auto-publish to npm on tagged release
- [ ] 9.2 Release channels
  - `canary` tag on npm (daily from main)
  - `beta` tag (weekly)
  - `latest` tag (bi-weekly stable)
- [ ] 9.3 Feature flags
  - `#feature "name"` pragma in .kd files
  - Feature registry in interpreter
  - `kode --features x,y run file.kd` CLI flag
- [ ] 9.4 Auto-migration
  - `kode migrate` CLI command
  - Migration rules as JSON: `{ from: "tx", to: "try", version: "0.6" }`
  - `--dry-run`, `--undo` flags
- [ ] 9.5 Crater testing
  - Clone top N Kode projects from registry
  - Run their tests with new interpreter version
  - Block release if any project breaks
- [ ] 9.6 `kpm` package manager
  - `kpm init` — create kode.pkg
  - `kpm add <package>` — install + add to deps
  - `kpm publish` — publish to registry
  - `kpm search <query>` — find packages
  - Registry: initially GitHub-based, later dedicated server
- [ ] 9.7 Plugin system
  - `kpm add --plugin kode-react` — install language plugin
  - Plugins can register: decorators, tagged templates, stdlib modules
  - Plugin API: `export fn activate(kode) { kode.addDecorator(...) }`
- [ ] 9.8 Self-update
  - `kode upgrade` — update to latest stable
  - `kode upgrade --canary` / `--beta`
  - `kode downgrade` — revert to previous
  - `kode --version` — show current + check for updates
- [ ] 9.9 Editions
  - `edition|"2026.1"` in kode.pkg
  - Auto-migration between editions: `kode migrate --edition 2027.1`
  - Old editions always supported
- [ ] 9.10 Telemetry + community
  - `kode telemetry on/off` — opt-in usage data
  - `kode feedback "message"` — send feedback
  - `kode vote RFC-042` — vote on proposals
- [ ] 9.11 Kode Intelligence
  - Error tracker — cluster common errors
  - Usage tracker — feature usage + error rates
  - Perf profiler — auto-detect slow operations
  - Community NLP — analyze issues/chat for themes
  - Code analyzer — detect repetitive patterns/workarounds
- [ ] 9.12 Auto-priority engine
  - Weekly priority score from all intelligence layers
  - Auto-generated improvement list
  - Dashboard for team to review priorities
- [ ] **MILESTONE: Self-improving language infrastructure live**

### Phase 10: AI Gateway + Essential Integrations
- [ ] 10.1 `std.ai` — universal LLM gateway (Claude, GPT, Gemini, Llama, local)
  - `ai.ask(prompt, options)`, `ai.generate_image()`, `ai.code()`, `ai.auto()`
  - Model routing: pick cheapest model that can handle the task
  - Streaming responses, token counting, cost tracking integrated with `budget`
- [ ] 10.2 MCP protocol support — `im mcp "server" {tools}`
- [ ] 10.3 Distributed agents — `expose on port`, `connect("kode://host:port")`
- [ ] 10.4 Self-modifying code — `kode.eval()`, `kode.reload()`, `kode.parse()`, `kode.format()`
- [ ] 10.5 Visual agent debugger — `kode run --inspect` dashboard
- [ ] 10.6 AI agent feedback loop — auto-collect errors, retries, suggestions
- [ ] 10.7 `std.cron` — scheduled tasks
- [ ] 10.8 `std.email` — SMTP send, IMAP receive
- [ ] 10.9 `std.csv` — CSV read/write
- [ ] 10.10 `std.yaml` — YAML parsing
- [ ] 10.11 `std.redis` — Redis client
- [ ] 10.12 `std.graphql` — GraphQL server + client
- [ ] **MILESTONE: AI agents can use any LLM, talk across machines, improve themselves**

### Phase 11: Extended Integrations
- [ ] 11.1 `std.sms` — Twilio SMS
- [ ] 11.2 `std.pdf` — PDF generation/reading
- [ ] 11.3 `std.image` — image processing
- [ ] 11.4 `std.chart` — chart/graph generation
- [ ] 11.5 `std.ssh` — SSH connections
- [ ] 11.6 `std.mongo` — MongoDB client
- [ ] 11.7 `std.grpc` — gRPC server/client
- [ ] 11.8 `std.queue` — message queues (RabbitMQ, Kafka)
- [ ] 11.9 `std.xml` — XML/SOAP parsing
- [ ] **MILESTONE: Kode integrates with every major service**

### Phase 12: Frontier
- [ ] 12.1 `std.ml` — machine learning (ONNX runtime)
- [ ] 12.2 `std.gui` — desktop GUI via webview
- [ ] 12.3 `std.mobile` — mobile apps via Capacitor
- [ ] 12.4 `std.chain` — blockchain/smart contracts
- [ ] 12.5 `std.iot` — IoT device communication
- [ ] 12.6 Bytecode compiler — 10-100x speedup for hot paths
- [ ] 12.7 WASM target — run Kode in browsers
- [ ] **MILESTONE: Kode can do literally anything**

---

## Context

AI agents (LLMs) frequently need to write and execute code, but existing languages (Python, JS) are verbose and waste tokens on boilerplate. **Kode** is a new **full-stack** general-purpose language designed from scratch for AI agents — with minimal keywords (2-3 chars), built-in agent primitives, and a TOON data format that's 30-45% more token-efficient than JSON.

An AI agent can build **entire applications** in Kode — web servers, APIs, databases, HTML pages — without needing Python, JavaScript, or any other language.

The interpreter will be written in **TypeScript/Node.js**. File extension: `.kd`. CLI command: `kode`.

---

## Language Design Summary

### Keywords (all 2-3 chars)
| Keyword | Meaning | | Keyword | Meaning |
|---------|----------|-|---------|---------|
| `lt` | let (immutable) | | `vr` | var (mutable) |
| `fn` | function | | `rt` | return |
| `if` | if | | `ef` | else-if |
| `el` | else | | `mt` | match |
| `lp` | loop (infinite) | | `wl` | while (conditional loop) |
| `fr` | for-each | | `br` | break |
| `nx` | next/continue | | `tw` | throw error |
| `ag` | agent | | `tk` | tool |
| `em` | emit msg | | `on` | on event |
| `sp` | spawn | | `aw` | await |
| `st` | state machine | | `mem` | memory |
| `tx` | try | | `ct` | catch |
| `fy` | finally | | `nl` | null |
| `im` | import | | `ex` | export |
| `en` | enum/union | | `it` | interface/trait |
| `sv` | supervisor | | `go` | lightweight task |
| `ch` | channel | | `ext` | extension |
| `get` | computed property | | | |
| `tr`/`fl` | true/false (ONLY boolean, never trait) |

**Resolved conflicts:**
- `tr` = ONLY true (boolean). Trait/interface = `it` (no collision)
- `on` = context-dependent (inside `ag` = event handler, inside `st` = transition)
- `|x|` = lambda delimiters. `&`/`|` = logical AND/OR (space required: `a | b`)
- `--` = comment when at line start or preceded by whitespace. `5 - -3` uses spaces.
- Newline = statement terminator (like Go). Semicolons optional for same-line: `lt a = 1; lt b = 2`
- `if` is an expression: `lt y = if x > 0 { "pos" } el { "neg" }`

### Operators
`+` `-` `*` `/` `%` `**` `==` `!=` `<` `>` `<=` `>=` `&` `|` `!` `=` `+=` `-=` `*=` `/=` `|>` `->` `::` `..` `..=` `...` `??` `?.`

### Data Types
Primitives: `num`, `str`, `bool`, `nl`, `bytes`  
Composites: `lst` (list), `mp` (map), `tpl` (tuple), `set`  
Special: `ag`, `tk`, `fn`, `err`, `Result[T]`, `Option[T]`  
Nullable: `str?`, `num?` (append `?` for nullable)  
Duration: `5s`, `30m`, `2h`, `1d` (number + unit)

### String Escape Sequences
`\n` newline, `\t` tab, `\\` backslash, `\"` quote, `\'` quote, `\0` null, `\u{xxxx}` unicode

### Number Formats
`42` int, `3.14` float, `0xFF` hex, `0b1010` binary, `0o77` octal, `1.5e10` scientific, `1_000_000` separators

### TOON Data Literals (token-efficient)
```
lt user = @{name|"Ada" age|30 role|"dev"}
lt nums = @[1 2 3 4 5]
```

### Core Syntax Examples
```
-- variables
lt x = 10
vr count = 0

-- functions  
fn add(a, b) { rt a + b }
fn double(x) -> x * 2

-- lambdas
lt sq = |x| -> x * x

-- control flow
if x > 0 { rt "pos" } ef x == 0 { rt "zero" } el { rt "neg" }
fr item : my_list { io.out(item) }
mt val { 1 -> "one"  _ -> "other" }

-- pipes
data |> lst.filter(|x| -> x > 0) |> lst.map(|x| -> x * 2)

-- strings: "interpolated ${var}" and 'raw literal'
-- comments: -- single line   -* block *-
```

### Agent System
```
ag Scout {
  vr findings = @[]
  tk web_search(q :: str) :: str
  mem semantic :: persist

  on "search" (p) {
    lt results = aw tk.web_search(p.query)
    findings = findings + @[results]
    em "reporter" @{type|"results" data|results}
  }
}

lt s = sp Scout
em s @{type|"search" query|"AI languages"}
```

### Memory (4 types)
- `mem.w` — working (volatile, in-memory)
- `mem.s` — semantic (persistent facts, searchable)
- `mem.e` — episodic (event log/history)
- `mem.p` — procedural (learned functions/skills)

### State Machines
```
st Flow { "idle" { on "go" -> "running" } "running" { on "done" -> "idle" } }
```

### Self-Healing Code (`@recover`)
```
@recover {
  lt data = aw tk.fetch_api("/users")
} fix (err, ctx) {
  io.out("failed: ${err.msg}, vars: ${ctx.vars}")
  retry(3)
}
```

### Intent-Based Declarations (`ensure`)
```
ensure db.users has_column "email" :: str
ensure server is_running on 3000
```

### Contracts (`pre`/`post`)
```
fn transfer(from, to, amount) {
  pre: from.balance >= amount
  pre: amount > 0
  post: from.balance == old.from.balance - amount
  from.balance -= amount
  to.balance += amount
}
```

### Sandboxing & Permissions (`allow`/`deny`/`budget`)
```
ag Worker {
  allow fs.read("/data/*")
  deny fs.write("*.env")
  budget tokens: 50000
  budget time: 30s
}
```

### Cost Awareness
```
budget @{tokens|100000 cost|"$5.00"}
lt est = cost.estimate(tk.llm_call, "prompt")
io.out(cost.spent)
io.out(cost.remaining)
```

### Checkpoints & Rollback
```
checkpoint "before_migration"
db.exec("alter table users add column email str")
if !ok { rollback "before_migration" }
```

### Reactive Streams
```
lt feed = stream.from(tk.watch_api("/events"))
  |> stream.filter(|e| -> e.type == "alert")
  |> stream.batch(10)
fr batch : feed { process(batch) }
```

### Null Safety (from Kotlin/Swift)
```
lt name :: str? = nl          -- nullable
lt age :: num = 10            -- non-nullable (can't be nl)
lt safe = name ?? "default"   -- null coalescing
lt len = name?.len()          -- optional chaining
```

### Enums / Tagged Unions (from Rust)
```
en Result[T] { Ok(T)  Err(str) }

en TaskStatus {
  Todo
  Doing(assigned_to :: str)
  Done(completed_at :: num)
  Blocked(reason :: str)
}

mt status {
  Todo -> "not started"
  Doing(who) -> "${who} is working"
  Done(when) -> "finished at ${when}"
  Blocked(why) -> "blocked: ${why}"
}
```

### Error as Values (from Rust/Go)
```
fn read_file(path :: str) :: Result[str] {
  if !fs.exists(path) { rt Err("not found") }
  rt Ok(fs.read(path))
}

lt content = read_file("data.txt") ?? "fallback"
mt read_file("data.txt") {
  Ok(data) -> process(data)
  Err(msg) -> io.err(msg)
}
```

### Generics (from TypeScript/Rust)
```
fn first[T](items :: lst[T]) :: T { rt items[0] }
fn map_values[K, V, R](m :: mp[K, V], f :: fn(V) -> R) :: mp[K, R] { ... }
```

### Goroutine-Style Concurrency (from Go)
```
lt t1 = go fetch_users()
lt t2 = go fetch_orders()
lt users, orders = aw all(t1, t2)

lt ch = chan[num]()
go fn() { fr i : 0..10 { ch.send(i) } ch.close() }
fr val : ch { io.out(val) }
```

### Supervisor Trees (from Elixir/Erlang)
```
sv AppSupervisor {
  strategy: one_for_one
  children: @[sp WebServer  sp DatabasePool  sp TaskAssistant]
  max_restarts: 5
  within: 60s
}
```

### Extension Functions (from Kotlin/Swift)
```
ext str {
  fn is_email() :: bool -> self.contains("@") & self.contains(".")
  fn truncate(n :: num) :: str -> if self.len() > n { self[0..n] + "..." } el { self }
}
"test@mail.com".is_email()   -- tr
```

### LINQ-Style DB Queries (from C#)
```
lt users = db.users
  |> where(|u| -> u.age > 18)
  |> order_by(|u| -> u.name)
  |> select(|u| -> @{name|u.name email|u.email})
  |> limit(10)
```

### Hot Code Reload (from Elixir/Dart)
```
kode reload "agents/scout.kd"   -- updates running agent without restart
```

### Decorators (from Python/Java)
```
@cached(ttl: 60s)
@rate_limit(100, per: "1m")
@log
fn get_user(id :: num) :: mp {
  rt db.query("select * from users where id = ?", @[id])
}
```

### Tagged Templates (from JS/Kotlin)
```
lt query = sql"select * from users where age > ${min_age}"  -- parameterized
lt page = html"<h1>${title}</h1>"                            -- auto-escaped
lt path = url"https://api.com/${version}/users"              -- validated
```

### Interfaces / Traits (from Rust/Go) — keyword: `it`
```
it Searchable {
  fn search(query :: str) :: lst
  fn index() :: mp
}

ag WebCrawler :: Searchable {
  fn search(query) { ... }
  fn index() { ... }
}
```

### Computed Properties (from Swift/C#)
```
ag User {
  vr first_name = ""
  vr last_name = ""
  get full_name -> "${first_name} ${last_name}"
  get is_admin -> role == "admin"
}
```

### Built-in Testing (from Rust/Zig)
```
#test "addition works" {
  assert add(2, 3) == 5
}

-- run: kode test file.kd
```

### Full-Stack: Web Server + Database + HTML
Kode can build complete applications — no other language needed.

**Web server with routes:**
```
im std.web {serve, html, json}
im std.db {open}

lt db = open("sqlite:app.db")

-- create table
db.exec("create table if not exists todos (id int, title str, done bool)")

-- HTML page
fn home_page() -> html("""
  <h1>My Todos</h1>
  <form method="post" action="/add">
    <input name="title" />
    <button>Add</button>
  </form>
""")

-- JSON API
fn api_todos() {
  lt rows = db.query("select * from todos")
  rt json(rows)
}

-- start server
serve(3000) {
  on "GET /" -> home_page()
  on "GET /api/todos" -> api_todos()
  on "POST /add" (req) {
    db.exec("insert into todos values(?, ?, ?)", @[req.body.id req.body.title fl])
    rt redirect("/")
  }
}
```

**What full-stack means for Kode:**
| Capability | Stdlib Module | What it does |
|-----------|--------------|-------------|
| Web server | `std.web` | HTTP server, routing, middleware, static files |
| HTML/CSS | `std.html` | HTML templating, CSS generation |
| Database | `std.db` | SQLite built-in, Postgres/MySQL connectors |
| REST API | `std.web` | JSON responses, request parsing |
| Auth | `std.auth` | JWT tokens, session management |
| WebSocket | `std.ws` | Real-time bidirectional communication |
| File system | `std.fs` | Read/write files, directories |
| HTTP client | `std.net` | Make HTTP requests to external APIs |
| JSON | `std.json` | json.parse(), json.to_str() — convert to/from TOON |
| Regex | `std.re` | re.match(), re.replace(), re.test() |
| Encoding | `std.enc` | base64, URL encode/decode, hex |
| Crypto | `std.crypto` | sha256, hmac, encrypt, decrypt, random_bytes |
| UUID | `std.uuid` | uuid.v4() |
| Environment | `std.env` | env.get("KEY"), env.set(), env.load(".env") |
| Logging | `std.log` | log.debug/info/warn/error with levels |
| URL | `std.url` | url.parse(), url.build() |
| Process | `std.proc` | proc.exec("cmd"), proc.spawn() |
| Set | `std.set` | set.new(), add, has, union, intersect, diff |

---

## Project Structure

```
d:/Company/AiLang/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  -- CLI entry (REPL + file exec)
│   ├── lexer/
│   │   ├── tokens.ts             -- Token types enum
│   │   └── lexer.ts              -- Tokenizer
│   ├── parser/
│   │   ├── ast.ts                -- AST node definitions
│   │   └── parser.ts             -- Recursive descent + Pratt parsing
│   ├── evaluator/
│   │   ├── values.ts             -- Runtime value types
│   │   ├── environment.ts        -- Scope chain
│   │   ├── evaluator.ts          -- Tree-walking interpreter
│   │   └── builtins.ts           -- Built-in functions
│   ├── runtime/
│   │   ├── agent-runtime.ts      -- Agent spawn/message/lifecycle
│   │   ├── memory-store.ts       -- 4-type memory subsystem
│   │   ├── tool-registry.ts      -- Tool registration & invocation
│   │   ├── state-machine.ts      -- State machine runtime
│   │   ├── channel.ts            -- Inter-agent channels
│   │   ├── sandbox.ts            -- Permission & sandboxing engine
│   │   ├── cost-tracker.ts       -- Token/cost budget tracking
│   │   ├── contracts.ts          -- Pre/post condition validation
│   │   ├── checkpoint.ts         -- State snapshot & rollback
│   │   ├── recovery.ts           -- @recover self-healing runtime
│   │   ├── intent.ts             -- ensure/intent-based execution
│   │   ├── stream.ts             -- Reactive stream runtime
│   │   ├── supervisor.ts         -- Supervisor tree (auto-restart)
│   │   ├── concurrency.ts        -- go/chan goroutine-style tasks
│   │   ├── extensions.ts         -- ext (extension functions)
│   │   ├── decorators.ts         -- @cached, @rate_limit, @log
│   │   ├── hot-reload.ts         -- Hot code reload engine
│   │   └── test-runner.ts        -- #test built-in test framework
│   ├── stdlib/
│   │   ├── io.ts                 -- Standard I/O
│   │   ├── json.ts               -- JSON parse/stringify
│   │   ├── str.ts                -- String utils
│   │   ├── lst.ts                -- List utils
│   │   ├── mp.ts                 -- Map utils
│   │   ├── net.ts                -- HTTP client (fetch/get/post)
│   │   ├── time.ts               -- Time utils
│   │   ├── math.ts               -- Math utils
│   │   ├── fs.ts                 -- File system
│   │   ├── web.ts                -- HTTP server, routing, middleware
│   │   ├── html.ts               -- HTML templating & generation
│   │   ├── db.ts                 -- Database (SQLite built-in, Postgres/MySQL)
│   │   ├── auth.ts               -- JWT, sessions, basic auth
│   │   ├── ws.ts                 -- WebSocket support
│   │   ├── re.ts                 -- Regex
│   │   ├── enc.ts                -- Encoding (base64, URL, hex)
│   │   ├── crypto.ts             -- Crypto (sha256, hmac, encrypt)
│   │   ├── uuid.ts               -- UUID generation
│   │   ├── env.ts                -- Environment variables
│   │   ├── log.ts                -- Structured logging
│   │   ├── url.ts                -- URL parsing
│   │   ├── proc.ts               -- Process/exec
��   │   └── set.ts                -- Set data structure
│   └── errors/
│       ├── errors.ts             -- Error types
│       └── reporter.ts           -- Error formatting
├── infrastructure/
│   ├── ci/
│   │   ├── build.yml             -- Cross-platform builds
│   │   ├── test.yml              -- Unit + integration tests
│   │   ├── crater.yml            -- Regression test against all projects
│   │   └── release.yml           -- Auto-publish to npm + GitHub
│   ├── migrate/
│   │   ├── migrator.ts           -- Auto-migration engine
│   │   └── rules/                -- Migration rules per version
│   └── registry/
│       └── kpm-cli.ts            -- Package manager CLI
├── tests/
│   ├── lexer.test.ts
│   ├── parser.test.ts
│   ├── evaluator.test.ts
│   └── integration/
├── examples/
│   ├── hello.kd
│   ├── researcher.kd
│   ├── team.kd
│   └── workflow.kd
└── docs/
    └── language-spec.md
```

---

## Implementation Phases

### Phase 1: Foundation — Lexer + Parser + Basic Eval
**Goal**: Run `hello.kd` with variables, functions, control flow, I/O.

1. `package.json` + `tsconfig.json` setup (TypeScript, vitest for testing)
2. `src/lexer/tokens.ts` — Token type enum, Token interface
3. `src/lexer/lexer.ts` — Tokenize all keywords, operators, strings, TOON literals, comments
4. `src/parser/ast.ts` — All AST node type definitions
5. `src/parser/parser.ts` — Recursive descent parser with Pratt expression parsing
6. `src/evaluator/values.ts` — Runtime value types
7. `src/evaluator/environment.ts` — Scope chain with parent pointers
8. `src/evaluator/evaluator.ts` — Tree-walking interpreter
9. `src/evaluator/builtins.ts` — `io.out`, basic math
10. `src/index.ts` — CLI: `kode file.kd` and `kode` (REPL)
11. `examples/hello.kd` — First working program
12. Tests for lexer, parser, evaluator

### Phase 2: Type System & Data
**Goal**: TOON literals, null safety, enums, generics, Result types.

1. TOON `@{}` and `@[]` parsing and evaluation
2. Null safety — `str?` nullable types, `??` coalescing, `?.` optional chaining
3. `en` enums / tagged unions with pattern matching in `mt`
4. `Result[T]` and `Option[T]` built-in types — error-as-values
5. Generics — `fn first[T](items :: lst[T]) :: T`
6. Dot access, index access, comprehensive destructuring
7. String interpolation + tagged templates (`sql""`, `html""`, `url""`)
8. Pipe operator `|>`, range `..`, spread `...`

### Phase 3: Functions & Composition
**Goal**: Advanced function features.

1. Closures and lambdas
2. `ext` extension functions — add methods to existing types
3. `tr` traits/interfaces — define shared behavior
4. `get` computed properties
5. Decorators — `@cached`, `@rate_limit`, `@log`
6. `pre:`/`post:` contracts on functions
7. Stdlib: `io`, `str`, `lst`, `mp`, `math`, `time`
8. Import/export module system

### Phase 4: Agents & Concurrency
**Goal**: Run multi-agent programs with lightweight concurrency.

1. `ag` declaration parsing + agent instance creation
2. `sp` (spawn) — instantiate agent with own environment + message queue
3. `em` (emit) — post messages to agent queues
4. `on` handlers — register and dispatch event handlers
5. `go` lightweight tasks (goroutine-style) + `chan` channels
6. `aw` (await), `aw all()`, `aw race()` — async patterns
7. Agent event loop — cooperative scheduling
8. `sv` supervisor trees — auto-restart crashed agents

### Phase 5: Tools, Memory, State, Safety
**Goal**: Complete core agent features with safety.

1. `tk` declaration and tool registry
2. `mem.w/s/e/p` memory subsystem with JSON file persistence
3. `st` state machine declaration and runtime
4. `@recover`/`fix` self-healing blocks with context capture
5. `checkpoint`/`rollback` state snapshot system
6. `allow`/`deny` permission declarations — sandboxing per agent
7. `budget` — token/cost/time limits per agent
8. `cost.estimate()`, `cost.spent`, `cost.remaining` tracking
9. `ensure` intent-based declarations
10. `net` stdlib (HTTP client), `fs` stdlib (file system)

### Phase 6: Full-Stack — Web, Database, HTML
**Goal**: Build complete applications in Kode.

1. `std.web` — HTTP server
   - `serve(port) { on "METHOD /path" -> handler }` routing
   - Request/response, headers, status codes, middleware
   - `json()`, `html()`, `redirect()` helpers
   - Static file serving
2. `std.html` — HTML templating with `${}` interpolation
3. `std.db` — Database
   - SQLite via `better-sqlite3` (built-in, zero config)
   - LINQ-style queries: `db.users |> where() |> order_by() |> select()`
   - Postgres/MySQL connectors (optional)
4. `std.auth` — JWT, sessions, password hashing
5. `std.ws` — WebSocket server/client
6. Example: `examples/todo-app.kd`

### Phase 7: Reactive Streams & Testing
**Goal**: Real-time data + built-in testing.

1. `stream.from()`, `stream.filter()`, `stream.map()`, `stream.batch()`
2. Backpressure management
3. WebSocket streams integration
4. Agent-to-agent streaming via channels
5. `#test` built-in test blocks + `assert`
6. `kode test file.kd` CLI command

### Phase 8: Developer Experience
**Goal**: Make Kode delightful to use.

1. Hot code reload — update running agents without restart
2. Rich error messages with line/col context + suggestions
3. REPL with history and tab completion
4. `--ast` and `--tokens` debug flags
5. npm packaging (`npx kode file.kd`)
6. Syntax highlighting (VS Code extension)
7. Documentation + language spec

### Phase 9: Rapid Evolution Infrastructure
**Goal**: Ship updates faster than any other language.

1. CI/CD pipeline — auto-build for Windows/Mac/Linux
2. Canary/beta/stable release channels
3. `#feature` flag system — opt-in experimental features
4. `kode migrate` auto-migration tool
5. Crater regression testing — test against all known projects
6. `kpm` package manager — init, add, publish, search
7. Plugin system — community extends syntax
8. `kode upgrade` / `kode downgrade` — self-updating CLI
9. Edition system — backwards-compatible milestones
10. Opt-in telemetry + RFC voting system
11. **Kode Intelligence** — error clustering, usage tracking, perf profiling
12. Community NLP — auto-analyze GitHub issues + Discord for pain points
13. Code pattern analyzer — detect workarounds = missing features
14. Auto-priority engine — weekly ranked improvement list from all signals

---

## Verification Plan

After each phase:
- **Unit tests**: Run `npx vitest` — lexer, parser, evaluator tests
- **Integration**: Execute example `.kd` files and verify output
- **Phase 1 check**: `kode examples/hello.kd` prints fibonacci sequence
- **Phase 3 check**: `kode examples/team.kd` runs multi-agent workflow
- **Phase 4 check**: All 4 example programs run successfully
- **Phase 6 check**: `kode examples/todo-app.kd` starts a web server, visit `localhost:3000` to see a working todo app with database
- **Final check**: `kode` starts REPL, can interactively define agents and run code

---

## Why Kode — Competitive Analysis

**The crisis**: 95% of AI agent projects fail, $340K avg failed project cost, 70% token waste.

**Token efficiency**: Kode uses 48% fewer tokens than Python across 5 benchmarked tasks (1,740 → 905 tokens).

### 7 Original Features (nobody else has)
1. Self-healing (`@recover`) — auto-capture context + retry
2. Cost awareness (`budget`) — track/estimate/limit token spending
3. Per-agent sandboxing (`allow`/`deny`) — fine-grained permissions
4. Intent-based (`ensure`) — declare what, not how
5. Built-in contracts (`pre`/`post`) — catch 60-80% of bugs
6. Token-optimized syntax — 2-char keywords + TOON data
7. Full-stack — web + db + html + auth in one language

### 15 Best Features Borrowed from Other Languages
| Feature | Borrowed From | Why Users Need It |
|---------|--------------|-------------------|
| Null safety (`str?`, `??`, `?.`) | Kotlin/Swift | Prevents null crashes |
| Enums / tagged unions (`en`) | Rust/Haskell | Safe state modeling |
| Result type errors | Rust/Go | Explicit error handling |
| Generics (`fn first[T]`) | TypeScript/Rust | Reusable typed code |
| Goroutines (`go`, `chan`) | Go/Elixir | Lightweight concurrency |
| Supervisor trees (`sv`) | Erlang/Elixir | Auto-restart on crash |
| Extension functions (`ext`) | Kotlin/Swift | Extend existing types |
| LINQ-style DB queries | C# | Type-safe queries |
| Hot code reload | Elixir/Dart | Update without restart |
| Decorators (`@cached`) | Python/Java | Cross-cutting concerns |
| Tagged templates (`sql""`) | JS/Kotlin | Safe interpolation |
| Traits/interfaces (`tr`) | Rust/Go | Shared behavior |
| Computed properties (`get`) | Swift/C# | Dynamic fields |
| Built-in testing (`#test`) | Rust/Zig | No test framework needed |
| Comprehensive destructuring | JS/Rust | Pattern matching everywhere |

### Why Developers From Any Language Will Switch
- **Python devs**: Readability + null safety + 48% fewer tokens
- **JS/TS devs**: Full-stack + agents + no node_modules
- **Rust devs**: Enums + Result types + traits — but interpreted
- **Go devs**: Goroutines + channels + simplicity + agents
- **Elixir devs**: Supervisors + hot reload + fault tolerance
- **Kotlin devs**: Null safety + extensions + data classes
- **C# devs**: LINQ-style queries + computed properties

**Only competitor**: Pel (Lisp-based agent language) — has basic agent primitives but lacks all 22 features above.

---

## Rapid Evolution System

### Release Channels
```
CANARY (daily) → BETA (weekly) → STABLE (bi-weekly)
```
- `kode upgrade` / `kode upgrade --canary` / `kode upgrade --beta`
- `kode downgrade` for instant rollback

### Feature Flags
```
#feature "pattern_guards"    -- opt into experimental features
kode --features X,Y run app.kd
```

### Auto-Migration
```
kode migrate                 -- auto-fix code for new version
kode migrate --dry-run       -- preview changes
kode migrate --edition 2027.1
```

### Package Manager (`kpm`)
```
kpm init / kpm add X / kpm publish / kpm search
```
Package file: `kode.pkg` using TOON format.

### Plugin System
Community extends syntax without forking core:
```
kpm add --plugin kode-react
```

### Crater Regression Testing
Every release auto-tested against top 100 Kode projects. If any break → release blocked.

### Version Editions (every 6 months)
```
edition|"2026.1"  -- Core language
edition|"2026.2"  -- Full-stack + agents
edition|"2027.1"  -- Advanced type system
```
Old editions always work. Auto-migration between editions.

### Kode Intelligence (auto-detect what to improve)
ML-powered system that automatically finds what needs fixing:

**6 Intelligence Layers:**
1. **Error Intelligence** — clusters common errors across all users, surfaces top bugs
2. **Usage Intelligence** — tracks which features are used/unused/broken (usage × error rate)
3. **Performance Intelligence** — auto-profiles every operation, flags bottlenecks
4. **Community Intelligence** — NLP analyzes GitHub issues, Discord, feedback for themes
5. **Code Pattern Intelligence** — detects repetitive workarounds (= missing features)
6. **AI Agent Feedback Loop** — agents DIRECTLY report what's hard, confusing, or missing

**AI Agent Feedback Loop (Layer 6 — unique to Kode):**
Since Kode is used BY AI agents, the agents themselves are the best testers. Built-in:
```
-- The runtime automatically collects from every agent:
-- 1. Syntax errors the agent made (what did the AI get wrong?)
-- 2. How many attempts before correct code (difficulty score)
-- 3. Which features the agent avoided (too complex?)
-- 4. What the agent tried to do but couldn't (missing feature)
-- 5. Token count of generated code (efficiency tracking)
-- 6. Explicit agent feedback via kode.feedback()

-- Agents can report issues directly:
kode.feedback("pipe operator confusing with nested lambdas")
kode.suggest("need a built-in CSV parser")
kode.report_bug("@recover doesn't capture closure variables")
```

**How it works:**
- When an AI agent writes Kode and hits an error → the error + context is logged
- When an AI agent retries 3+ times → the syntax is flagged as "confusing for AI"
- When an AI agent writes a workaround → the missing feature is detected
- All of this feeds into the Auto-Priority Engine automatically
- **The more agents use Kode, the faster it improves** — network effect

**Auto-Priority Engine** — combines all 6 signals into a weekly ranked list:
```
Priority = (Error Frequency × 3) + (AI Agent Difficulty × 3) + (Usage × 2) + (Community × 2) + (Performance × 1) + (Agent Suggestions × 2)
```
No guessing. Data from both humans AND AI agents decides what ships next.

**Files:**
- `src/intelligence/error-tracker.ts` — error clustering
- `src/intelligence/usage-tracker.ts` — feature usage analytics
- `src/intelligence/perf-profiler.ts` — auto performance profiling
- `src/intelligence/community-nlp.ts` — NLP on community signals
- `src/intelligence/code-analyzer.ts` — code pattern detection
- `src/intelligence/priority-engine.ts` — auto-generated improvement priorities

### Telemetry (opt-in)
```
kode telemetry on/off
kode feedback "message"
kode vote RFC-042
```

### Release Velocity
| Cadence | What ships |
|---------|-----------|
| Daily | Canary builds |
| Weekly | Beta with feature flags |
| Bi-weekly | Stable release |
| Quarterly | Minor version (0.1 → 0.2) |
| Bi-annually | Edition release |

---

## Monetization Strategy

**Kode is a full-stack language.** People will build two things with it:
1. **Applications** — web apps, APIs, services, dashboards
2. **AI agents** — autonomous agents with tools, memory, collaboration

Revenue comes from **hosting and scaling everything built with Kode.**

### Free Forever
- Kode language + interpreter — 100% free, open source
- `kpm` package manager — free
- Run locally — free forever (apps + agents)

### Paid: Kode Cloud (host anything)
One command to deploy any Kode app or agent to production.
```
kode deploy app.kd              -- deploy web app or agent
kode deploy --scale 10          -- auto-scale
kode status / kode logs         -- monitor
kode domains add myapp.com      -- custom domain
```
| Plan | Price | What you get |
|------|-------|-------------|
| Free | $0 | 1 project, 100K requests/month, .kode.dev subdomain |
| Pro | $29/month | 10 projects, 1M requests, custom domains, SSL, databases |
| Scale | $99/month | 100 projects, 10M requests, auto-scaling, priority compute |
| Enterprise | Custom | Unlimited, SLA, dedicated infra, private cloud |

Works for both:
- **Web apps**: `serve(3000) { ... }` → deployed with HTTPS, CDN, database
- **AI agents**: `ag Scout { ... }` → running 24/7 in the cloud
- **APIs**: REST/WebSocket endpoints live and scalable
- **Cron jobs**: scheduled Kode scripts

### Paid: Managed Database
`std.db` works locally with SQLite for free. Cloud adds managed Postgres/MySQL.
| Plan | Price | What you get |
|------|-------|-------------|
| Free | $0 | SQLite (local, bundled) |
| Cloud | $10/month | Managed Postgres, 5GB, auto-backup |
| Scale | $50/month | 100GB, read replicas, point-in-time recovery |

### Paid: Memory Storage (for agents)
`mem.s` and `mem.e` work locally for free. Cloud adds persistent + vector search.
| Plan | Price | What you get |
|------|-------|-------------|
| Free | $0 | 100MB local memory |
| Cloud | $5/month | 10GB synced semantic memory |
| Scale | $25/month | 100GB + vector search for mem.s |

### Paid: LLM Gateway
Unified API for all LLM providers. Built into `tk.llm_call()`.
```
lt resp = aw tk.llm_call("summarize this", @{model|"claude"})
```
- One syntax for Claude, GPT, Gemini, Llama
- Built-in cost tracking (`cost.spent` / `cost.remaining`)
- Prompt caching (saves 50-90%)
- We add 5-10% margin on LLM provider costs

### Paid: Marketplace (15% commission)
```
kpm publish --premium my-package
kpm install smart-researcher
```
People sell and buy:
- **Pre-built apps** — admin dashboards, e-commerce templates, landing pages
- **Pre-built agents** — researcher, coder, scheduler, data analyst
- **Tool plugins** — Slack, GitHub, Stripe, Twilio connectors
- **UI components** — charts, forms, tables for `std.html`
- **Kode takes 15% of every sale**

### Paid: Monitoring Dashboard ($15/month)
Web dashboard for everything running on Kode Cloud:
- App performance — requests, latency, errors
- Agent activity — message flows, memory usage, task progress
- Cost breakdown — per app, per agent, per LLM call
- Alerts — crash notifications, budget exceeded, high latency

### Revenue Projection
| Year | Projects Deployed | Revenue |
|------|------------------|---------|
| Year 1 | 1K | $0 (growth) |
| Year 2 | 50K | $100K-$500K |
| Year 3 | 500K | $2M-$10M |
| Year 4 | 5M | $20M-$50M |
| Year 5 | 50M+ | $100M+ |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `--` for comments | Unambiguous when at line start / after whitespace |
| `@{}` for TOON maps | Distinguishes data from code blocks `{}` |
| `&`/`|` for logic | Single char; lambda `|x|` disambiguated by position |
| Sync-first evaluator | Sync by default; only async when aw/go/em used (perf) |
| Braces not indentation | LLMs miscount whitespace; braces are explicit |
| 2-char keywords | Maximizes token efficiency while staying readable |
| Newline as terminator | Like Go — no semicolons needed (optional for same-line) |
| `if` is an expression | `lt y = if cond { a } el { b }` — reduces need for ternary |
| `it` for trait (not `tr`) | Avoids collision with `tr` (true) |

## Architecture Decisions

| Decision | Detail |
|----------|--------|
| **Sync fast path** | Evaluator is synchronous by default. Only wraps in Promise when `aw`/`go`/`em` is encountered. Avoids 3M Promise allocations in tight loops. |
| **Max recursion depth** | Default 10,000. Configurable via `kode --max-depth 50000`. Prevents stack overflow. |
| **Circular reference detection** | Detect cycles in checkpoint/JSON serialization. Use seen-set to break infinite loops. |
| **Circular imports** | Partially-initialized modules (like Node.js). Reference resolved on access, not import. |
| **Copy-on-write checkpoints** | Only snapshot changed variables. Not full deep-copy every time. |
| **Garbage collection** | Relies on V8 GC. Kode-level cleanup: agents deregistered on stop, channels closed, streams unsubscribed. |
| **Memory budget** | `budget memory: 100mb` alongside tokens/time/cost. Tracks AiList/AiMap sizes. |
| **Future: bytecode** | Phase 10+: compile hot paths to bytecode for 10-100x speedup. Not in initial release. |

## Interoperability

| Feature | Syntax | Detail |
|---------|--------|--------|
| **npm FFI** | `im npm "axios" {get, post}` | Import npm packages directly into Kode |
| **Shell exec** | `proc.exec("ls -la")` | Run external commands, get stdout |
| **Embed Kode** | `kode.eval("lt x = 1 + 2")` | Use Kode as scripting engine in Node.js apps |
| **Binary data** | `bytes.from("hello")`, `bytes.read(file)` | Handle raw binary, images, protocols |
| **JSON interop** | `json.parse(str)`, `json.to_str(val)` | Convert between JSON and TOON |
| **Stdin piping** | `cat data.txt \| kode script.kd` | Kode reads piped input via `io.read()` |

## Web Server Completeness

| Feature | Syntax |
|---------|--------|
| **CORS** | `use(cors(@{origins\|"*"}))` |
| **File uploads** | `req.files` for multipart form data |
| **Cookies** | `req.cookies`, `res.cookie("name", "val", @{httpOnly\|tr})` |
| **Form parsing** | Auto-parse urlencoded + multipart on POST |
| **HTTPS** | `serve(3000, @{tls\|@{cert\|"cert.pem" key\|"key.pem"}})` |
| **SSE streaming** | `res.stream(fn(send) { send("data") })` |
| **Security headers** | Auto X-Frame-Options, CSP, HSTS. Opt-out configurable. |
| **Health check** | Auto `/health` endpoint |
| **Request validation** | `req.validate(@{name\|str email\|str age\|num})` |
| **DB connection pool** | `open("postgres://...", @{pool\|10})` |
| **Graceful shutdown** | Auto SIGTERM: drain requests, close DB, exit clean |
| **Multi-core** | `kode run --workers 4 app.kd` — Node.js cluster mode |

## Security Built-in

| Feature | How |
|---------|-----|
| SQL injection prevention | Runtime warning if `db.exec` gets interpolated string. Encourage `sql""` or params. |
| XSS prevention | `html()` auto-escapes. Raw only via `html.raw(str)`. |
| CSRF | `csrf.token()`, `csrf.verify(req)` in std.auth |
| Secrets | `secret("API_KEY")` — excluded from logs/checkpoints |
| Sandbox non-agents | `kode run --sandbox app.kd` — restrict even top-level code |
| HTTP security headers | Auto-added by default on web server |

## Advanced Capabilities (World's Best Agent Language)

### std.ai — Universal AI Gateway (built-in)
```
lt answer = aw ai.ask("summarize this", @{model|"claude" max_tokens|500})
lt image = aw ai.generate_image("a sunset", @{model|"dall-e"})
lt code = aw ai.code("sort this list", @{model|"codestral"})
lt auto = aw ai.auto("simple question")  -- runtime picks cheapest capable model
```
Supports: Claude, GPT, Gemini, Llama, Mistral, local models. One syntax for all.

### Distributed Agents (across machines)
```
ag SearchAgent {
  expose on 8080  -- network-accessible
  on "search" (p) { rt aw tk.web_search(p.query) }
}

-- connect from another machine
lt remote = connect("kode://search.company.com:8080")
lt results = aw em remote @{type|"search" query|"AI"}
```

### MCP Protocol Support (native)
```
im mcp "github" {search_repos, create_issue}
im mcp "slack" {send_message}

ag Assistant {
  tk mcp.github.search_repos
  tk mcp.slack.send_message
}
```

### Self-Modifying Code (agents improve themselves)
```
lt my_code = fs.read("agents/worker.kd")
lt improved = aw ai.ask("optimize: ${my_code}")
lt test = aw kode.eval(improved)
if test.ok { fs.write("agents/worker.kd", improved); kode.reload("agents/worker.kd") }
```
Built-in: `kode.eval()`, `kode.reload()`, `kode.parse()`, `kode.format()`

### Visual Agent Debugging
```
kode run app.kd --inspect    -- opens dashboard at localhost:9229
```
Live visualization: agent graph, message flow, memory, costs, state machines, errors.

### AI Agent Feedback Loop
```
kode.feedback("pipe operator confusing with nested lambdas")
kode.suggest("need CSV parser")
kode.report_bug("@recover doesn't capture closures")
```
Runtime auto-collects: AI error patterns, retry counts, avoided features, missing capabilities.

### Complete Stdlib — Do Anything in Kode
| Module | What | Priority |
|--------|------|----------|
| `std.ai` | Universal LLM gateway (Claude, GPT, Gemini, local) | Phase 10 |
| `std.email` | Send/receive emails (SMTP, IMAP) | Phase 10 |
| `std.sms` | Send SMS (Twilio integration) | Phase 11 |
| `std.cron` | Schedule recurring tasks | Phase 10 |
| `std.pdf` | Generate/read PDFs | Phase 11 |
| `std.image` | Resize, crop, convert images | Phase 11 |
| `std.chart` | Generate charts/graphs | Phase 11 |
| `std.ssh` | SSH connections to servers | Phase 11 |
| `std.redis` | Redis client | Phase 10 |
| `std.mongo` | MongoDB client | Phase 11 |
| `std.graphql` | GraphQL server + client | Phase 10 |
| `std.grpc` | gRPC server + client | Phase 11 |
| `std.queue` | Message queues (RabbitMQ, Kafka) | Phase 11 |
| `std.ml` | Machine learning (ONNX runtime) | Phase 12 |
| `std.gui` | Desktop GUI (via webview) | Phase 12 |
| `std.mobile` | Mobile apps (via Capacitor) | Phase 12 |
| `std.chain` | Blockchain/smart contracts | Phase 12 |
| `std.iot` | IoT device communication | Phase 12 |
| `std.csv` | CSV read/write | Phase 10 |
| `std.xml` | XML/SOAP parsing | Phase 11 |
| `std.yaml` | YAML parsing | Phase 10 |

---

## Agent Adoption Strategy (TO BE DECIDED)

How AI agents learn to write Kode — to be finalized later:

**Option A: MCP Server + Tools (immediate)**
- Build MCP server so agents query syntax, get examples, validate code via tool calls
- Works with existing models, no fine-tuning needed

**Option B: Training Dataset + Fine-Tuning (medium-term)**  
- Create large Kode code dataset (thousands of examples)
- Fine-tune open-source models (Llama, Mistral) to natively understand Kode
- Publish as "Kode-capable" model variants

**Option C: Get into LLM Training Data (long-term)**
- Publish Kode code publicly on GitHub
- Docs on crawlable website
- Next model training cycle picks it up (6-12 months)

**Also needed:**
- Error messages that teach: `Unknown keyword 'function'. Did you mean 'fn'?`
- `kode fix` CLI — agent submits broken code, gets corrected version
- `kode explain <feature>` — agent queries interpreter for syntax help
- LSP (Language Server Protocol) for IDE integration

---

## TOON Edge Cases

| Case | Behavior |
|------|----------|
| Empty map | `@{}` is valid |
| Empty list | `@[]` is valid |
| Keys with `\|` | Escape: `@{key\\\|name\|"value"}` |
| Values with `}` | Strings are quoted: `@{msg\|"hello }"}` |
| Mixed type lists | `@[1 "two" tr nl]` is valid |
| Multiline TOON | Newlines inside `@{...}` are treated as whitespace separators |
| Trailing separators | Ignored (lenient parsing) |
