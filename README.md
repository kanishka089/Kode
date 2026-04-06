# Kode

**A token-efficient, full-stack programming language for AI agents.**

Kode uses 48% fewer tokens than Python for the same logic. Built from scratch for AI agents to write, read, and execute code efficiently.

## Quick Start

```bash
npx tsx src/index.ts examples/hello.kd
```

## Syntax Overview

```
-- Variables
lt name = "Kode"        -- immutable
vr count = 0            -- mutable

-- Functions
fn add(a, b) { rt a + b }
fn double(x) -> x * 2

-- Lambdas
lt sq = |x| -> x * 2

-- Control flow
if x > 0 { io.out("pos") } ef x == 0 { io.out("zero") } el { io.out("neg") }
fr item : @[1 2 3] { io.out(item) }
wl count < 10 { count += 1 }

-- TOON data (token-efficient)
lt user = @{name|"Ada" age|30}
lt nums = @[1 2 3 4 5]

-- Pipes
nums |> lst.filter(|x| -> x > 2) |> lst.map(|x| -> x * 10)

-- String interpolation
io.out("Hello ${name}!")

-- Agents
ag Worker {
  on "task" (p) { io.out("Working on: " + p.title) }
}
lt w = sp Worker
em w @{type|"task" title|"Build Kode"}

-- State machines
st Flow { "idle" { on "go" -> "running" } "running" { on "done" -> "idle" } }

-- Memory (4 types)
mem.w.set("key", "value")       -- working (volatile)
mem.s.store("fact", data)        -- semantic (persistent)
mem.e.log(@{event|"login"})      -- episodic (event log)
mem.p.learn("skill", |x| -> x)  -- procedural (functions)

-- Web server + Database
lt db = db.open("sqlite:app.db")
web.route("GET", "/api", |req| -> web.json(db.query("select * from users")))
web.serve(3000)

-- Built-in testing
#test "math works" { assert_eq(2 + 2, 4) }

-- Extensions
ext str { fn shout() -> str.upper(self) + "!" }
"hello".shout()  -- "HELLO!"

-- Decorators
@cached
fn fib(n) { if n <= 1 { rt n }; rt fib(n - 1) + fib(n - 2) }

-- Contracts
fn withdraw(balance, amount) {
  pre: amount > 0
  pre: balance >= amount
  rt balance - amount
}
```

## CLI

```bash
kode <file.kd>           # Run a file
kode                      # Start REPL
kode test <file.kd>       # Run #test blocks
kode --time <file.kd>     # Run with timing
kode --ast <file.kd>      # Print AST
kode --tokens <file.kd>   # Print tokens
kode features             # List feature flags
kode kpm init             # Initialize package
kode kpm add <pkg>        # Add dependency
kode --version            # Print version
```

## Keywords (2-3 chars)

| | | | | | |
|---|---|---|---|---|---|
| `lt` let | `vr` var | `fn` function | `rt` return | `if` | `ef` else-if |
| `el` else | `wl` while | `lp` loop | `fr` for | `mt` match | `br` break |
| `nx` next | `tw` throw | `tx` try | `ct` catch | `fy` finally | `ag` agent |
| `tk` tool | `em` emit | `on` on | `sp` spawn | `aw` await | `st` state |
| `mem` memory | `en` enum | `it` interface | `sv` supervisor | `go` task | `ext` extend |

## Tests

```bash
npm test    # 119 tests
```

## License

MIT
