#!/usr/bin/env node
// Kode MCP Server — Enables AI agents to discover, learn, validate, and run Kode
// Protocol: Model Context Protocol (MCP) via stdio

import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';
import { Evaluator } from '../src/evaluator/evaluator.js';
import { Environment } from '../src/evaluator/environment.js';
import { registerBuiltins } from '../src/evaluator/builtins.js';
import { registerJsonStdlib } from '../src/stdlib/json-mod.js';
import { registerEnvStdlib } from '../src/stdlib/env-mod.js';
import { registerFsStdlib } from '../src/stdlib/fs-mod.js';
import { registerProcStdlib } from '../src/stdlib/proc.js';
import { stringify, KodeValue } from '../src/evaluator/values.js';
import { createInterface } from 'readline';

// ---- MCP Protocol Types ----
interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: { code: number; message: string };
}

// ---- Tool Definitions ----
const TOOLS = [
  {
    name: 'kode_syntax',
    description: 'Look up Kode language syntax for a specific feature. Use this to learn how to write Kode code. Features: variables, functions, control-flow, toon-data, strings, lists, pipes, agents, state-machines, memory, extensions, decorators, contracts, testing, web-server, database, error-handling, all-keywords',
    inputSchema: {
      type: 'object',
      properties: {
        feature: {
          type: 'string',
          description: 'The feature to look up. Examples: "variables", "functions", "agents", "web-server", "database", "all-keywords"'
        }
      },
      required: ['feature']
    }
  },
  {
    name: 'kode_run',
    description: 'Execute Kode source code and return the output. Use this to run Kode programs.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Kode source code to execute'
        }
      },
      required: ['code']
    }
  },
  {
    name: 'kode_validate',
    description: 'Check if Kode source code is valid. Returns parse errors with suggestions if invalid.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Kode source code to validate'
        }
      },
      required: ['code']
    }
  },
  {
    name: 'kode_example',
    description: 'Get a complete working example for a specific use case in Kode.',
    inputSchema: {
      type: 'object',
      properties: {
        use_case: {
          type: 'string',
          description: 'What you want to build. Examples: "web-api", "todo-app", "multi-agent", "data-pipeline", "cli-tool", "chat-bot", "url-shortener", "file-processor"'
        }
      },
      required: ['use_case']
    }
  },
  {
    name: 'kode_translate',
    description: 'Show how to translate a concept from Python/JavaScript to Kode.',
    inputSchema: {
      type: 'object',
      properties: {
        from_lang: {
          type: 'string',
          description: 'Source language: "python" or "javascript"'
        },
        concept: {
          type: 'string',
          description: 'The code concept to translate. Examples: "for loop", "class", "async/await", "list comprehension", "try/except", "import", "dictionary"'
        }
      },
      required: ['from_lang', 'concept']
    }
  }
];

// ---- Syntax Reference ----
const SYNTAX: Record<string, string> = {
  'variables': `-- Variables in Kode
lt name = "Kode"          -- immutable (cannot reassign)
vr count = 0              -- mutable (can reassign)
count += 1                -- compound assignment: += -= *= /=
lt x = nl                 -- null value
lt safe = x ?? "default"  -- null coalescing

-- Types: num, str, bool, nl
-- type(x) returns the type name`,

  'functions': `-- Functions in Kode
fn add(a, b) { rt a + b }          -- block body with rt (return)
fn double(x) -> x * 2              -- arrow: single expression
lt sq = |x| -> x * x               -- lambda (anonymous function)
lt f = |a, b| { rt a + b }         -- lambda with block

-- Closures:
fn make_adder(x) { rt |y| -> x + y }
lt add5 = make_adder(5)
add5(3)  -- 8`,

  'control-flow': `-- Control flow in Kode
if x > 0 { io.out("pos") } ef x == 0 { io.out("zero") } el { io.out("neg") }

wl n > 0 { n -= 1 }                -- while loop
lp { if done { br } }              -- infinite loop + break
fr i : 0..10 { io.out(i) }         -- for range (0 to 9)
fr item : list { io.out(item) }    -- for each
fr i, item : list { }              -- with index

mt value {                          -- match (pattern matching)
  1 -> io.out("one")
  2 -> io.out("two")
  _ -> io.out("other")             -- wildcard
}

br    -- break
nx    -- next (continue)`,

  'toon-data': `-- TOON Data (Token-Optimized Object Notation)
-- 30-45% fewer tokens than JSON

lt user = @{name|"Ada" age|30 role|"dev"}    -- map
lt nums = @[1 2 3 4 5]                       -- list
lt nested = @{db|@{host|"localhost" port|5432}}

-- Access:
user.name         -- Ada
nums[0]           -- 1
nested.db.host    -- localhost

-- Mutation (vr only):
vr m = @{x|1}
m.x = 42`,

  'strings': `-- Strings in Kode
"hello \${name}!"        -- interpolation with \${}
'raw \${no interp}'      -- raw string (no interpolation)
"""multi
line"""                  -- multi-line string
"line1\\nline2"          -- escape sequences: \\n \\t \\\\ \\"

-- String module:
str.upper("hi")          -- HI
str.lower("HI")          -- hi
str.split("a-b", "-")   -- @[a b]
str.join(@["a" "b"], "-") -- a-b
str.contains("hi", "h") -- tr
str.replace("ab", "a", "x") -- xb
str.trim("  hi  ")       -- hi`,

  'lists': `-- Lists and Pipes
lt nums = @[1 2 3 4 5]

-- Higher-order functions:
lst.map(nums, |x| -> x * 2)              -- @[2 4 6 8 10]
lst.filter(nums, |x| -> x > 3)           -- @[4 5]
lst.reduce(nums, |acc, x| -> acc + x, 0) -- 15
lst.find(nums, |x| -> x > 3)             -- 4
lst.sort(@[3 1 2])                        -- @[1 2 3]
lst.unique(@[1 1 2])                      -- @[1 2]
lst.chunk(@[1 2 3 4], 2)                  -- @[@[1 2] @[3 4]]

-- Pipe operator |> (chain left to right):
nums |> lst.filter(|x| -> x > 2) |> lst.map(|x| -> x * 10)`,

  'pipes': `-- Pipe operator |>
-- Passes result of left as first argument to right

@[1 2 3 4 5]
  |> lst.filter(|x| -> x > 2)     -- @[3 4 5]
  |> lst.map(|x| -> x * 10)       -- @[30 40 50]
  |> lst.sort()                    -- @[30 40 50]`,

  'agents': `-- Agents in Kode
ag Worker {
  vr count = 0                     -- agent state

  on "start" () { io.out("Ready") }

  on "task" (p) {                  -- handle messages
    count += 1
    io.out("Task: " + p.title)
  }
}

lt w = sp Worker                   -- spawn agent
em w @{type|"task" title|"build"}  -- send message

-- Agent-to-agent:
em "OtherAgent" @{type|"data" value|42}

-- Lifecycle handlers:
-- on "start" ()     -- when spawned
-- on "error" (err)  -- when handler throws`,

  'state-machines': `-- State Machines
st OrderFlow {
  "pending" { on "pay" -> "paid" }
  "paid"    { on "ship" -> "shipped" }
  "shipped" { on "deliver" -> "done" }
  "done"    {}
}

lt order = OrderFlow.new()
order.state                -- "pending"
order.send("pay")
order.state                -- "paid"`,

  'memory': `-- Memory System (4 types)

-- Working memory (volatile):
mem.w.set("key", "value")
mem.w.get("key")
mem.w.has("key")
mem.w.delete("key")

-- Semantic memory (persistent facts):
mem.s.store("user:ada", @{name|"Ada"})
mem.s.recall("user:ada")
mem.s.search("user", 5)

-- Episodic memory (event log):
mem.e.log(@{event|"login" user|"Ada"})
mem.e.last(10)

-- Procedural memory (learned functions):
mem.p.learn("greet", |name| -> "Hi " + name)
lt fn = mem.p.use("greet")
fn("Ada")  -- "Hi Ada"`,

  'extensions': `-- Extension functions
ext str {
  fn is_email() -> str.contains(self, "@")
  fn shout() -> str.upper(self) + "!"
}
"test@mail.com".is_email()   -- tr
"hello".shout()              -- HELLO!

-- Decorators
@cached
fn fib(n) { if n <= 1 { rt n }; rt fib(n-1) + fib(n-2) }

-- Contracts
fn withdraw(bal, amt) {
  pre: amt > 0
  pre: bal >= amt
  rt bal - amt
}`,

  'decorators': `-- Decorators wrap functions with extra behavior

@cached                    -- memoize results
fn expensive(x) { rt x * 2 }

@log                       -- log entry/exit
fn process(data) { rt data + 1 }`,

  'contracts': `-- Contracts validate function inputs/outputs
fn transfer(from, to, amount) {
  pre: amount > 0           -- checked before function runs
  pre: from >= amount
  post: result >= 0          -- checked after (result = return value)
  rt from - amount
}`,

  'testing': `-- Built-in testing
fn add(a, b) { rt a + b }

#test "addition" {
  assert_eq(add(2, 3), 5)
  assert_eq(add(-1, 1), 0)
}

#test "strings" {
  assert(str.contains("hello", "ell"))
  assert_ne("a", "b")
}

-- Run: kode test file.kd`,

  'web-server': `-- Web server
web.route("GET", "/", |req| -> web.html("<h1>Hello!</h1>"))
web.route("GET", "/api/data", |req| -> web.json(@{ok|tr}))
web.route("POST", "/api/items", |req| {
  io.out(req.body)
  rt web.json(@{received|tr})
})
web.route("GET", "/users/:id", |req| -> web.json(@{id|req.params.id}))
web.serve(3000)`,

  'database': `-- SQLite database
lt db = db.open("sqlite:app.db")
db.exec("create table users (id integer primary key, name text)")
db.exec("insert into users (name) values (?)", @["Ada"])
lt users = db.query("select * from users")
lt one = db.get("select * from users where id = ?", @[1])
db.close()`,

  'error-handling': `-- Error handling
tx {                       -- try
  lt data = risky()
} ct e {                   -- catch
  io.out("Error: " + e)
} fy {                     -- finally
  cleanup()
}
tw "something broke"       -- throw`,

  'all-keywords': `-- All Kode Keywords (36 total, avg 2.3 chars)
lt vr fn rt if ef el wl lp fr mt br nx tw tx ct fy
ag tk em on sp aw st mem en it sv go ch ext get im ex
tr fl nl
allow deny budget ensure checkpoint rollback`
};

// ---- Examples ----
const EXAMPLES: Record<string, string> = {
  'web-api': `-- REST API
lt store = db.open("sqlite:api.db")
store.exec("create table if not exists items (id integer primary key autoincrement, name text)")

web.route("GET", "/api/items", |req| -> web.json(store.query("select * from items")))
web.route("POST", "/api/items", |req| {
  store.exec("insert into items (name) values (?)", @[req.body.name])
  rt web.json(@{ok|tr}, 201)
})
web.route("DELETE", "/api/items/:id", |req| {
  store.exec("delete from items where id = ?", @[req.params.id])
  rt web.json(@{ok|tr})
})
web.serve(3000)`,

  'multi-agent': `-- Multi-agent pipeline
ag Researcher {
  on "search" (p) {
    io.out("Researching: " + p.topic)
    em "Writer" @{type|"write" data|"Found: " + p.topic}
  }
}
ag Writer {
  on "write" (p) {
    io.out("Writing: " + p.data)
    em "Reviewer" @{type|"review" article|p.data}
  }
}
ag Reviewer {
  on "review" (p) { io.out("APPROVED: " + p.article) }
}

lt r = sp Researcher
lt w = sp Writer
lt v = sp Reviewer
em r @{type|"search" topic|"AI agents"}`,

  'data-pipeline': `-- Data processing pipeline
lt data = @[
  @{name|"Ada" age|30 score|95}
  @{name|"Bob" age|17 score|82}
  @{name|"Cal" age|25 score|71}
]

lt result = data
  |> lst.filter(|r| -> r.age >= 18)
  |> lst.filter(|r| -> r.score >= 80)
  |> lst.map(|r| -> r.name)
io.out(result)`,

  'cli-tool': `-- CLI tool
io.out("Kode CLI Tool")
io.out("Platform: " + proc.platform)
io.out("CWD: " + proc.cwd())

lt files = fs.list(".")
io.out("Files: " + len(files))

lt config = json.parse(fs.read("config.json"))
io.out("Config loaded: " + mp.keys(config))`,

  'chat-bot': `-- Chat bot with state + memory
st ConvoState {
  "greeting" { on "next" -> "chat" }
  "chat"     { on "done" -> "bye" }
  "bye"      {}
}

ag Bot {
  vr state = ConvoState.new()
  on "message" (p) {
    mt state.state {
      "greeting" -> { io.out("Hi! What topic?"); state.send("next") }
      "chat" -> {
        if p.text == "bye" { state.send("done"); io.out("Goodbye!") }
        el { io.out("Interesting: " + p.text) }
      }
      _ -> { io.out("Bye!") }
    }
    mem.e.log(@{event|"msg" text|p.text})
  }
}
lt bot = sp Bot
em bot @{type|"message" text|"hello"}`,

  'todo-app': `-- Todo app (full-stack)
lt store = db.open("sqlite:todos.db")
store.exec("create table if not exists todos (id integer primary key autoincrement, title text, done integer default 0)")

web.route("GET", "/api/todos", |req| -> web.json(store.query("select * from todos")))
web.route("POST", "/api/todos", |req| {
  store.exec("insert into todos (title) values (?)", @[req.body.title])
  rt web.json(@{ok|tr})
})
web.route("POST", "/toggle/:id", |req| {
  store.exec("update todos set done = case when done=0 then 1 else 0 end where id = ?", @[req.params.id])
  rt web.json(@{ok|tr})
})
web.serve(3000)`,

  'url-shortener': `-- URL shortener
lt store = db.open("sqlite:urls.db")
store.exec("create table if not exists urls (id text primary key, url text, clicks integer default 0)")

fn make_id() -> str.slice(crypto.random_bytes(4), 0, 6)

web.route("POST", "/shorten", |req| {
  lt id = make_id()
  store.exec("insert into urls values (?, ?, 0)", @[id req.body.url])
  rt web.json(@{short|"http://localhost:3000/" + id})
})
web.route("GET", "/:id", |req| {
  lt row = store.get("select * from urls where id = ?", @[req.params.id])
  if row == nl { rt web.json(@{error|"Not found"}, 404) }
  store.exec("update urls set clicks = clicks + 1 where id = ?", @[req.params.id])
  rt web.redirect(row.url)
})
web.serve(3000)`,

  'file-processor': `-- File processor
lt files = fs.list(".")
lt kd_files = lst.filter(files, |f| -> str.ends(f, ".kd"))
io.out("Found " + len(kd_files) + " Kode files")
fr f : kd_files {
  lt stat = fs.stat(f)
  io.out(f + " — " + stat.size + " bytes")
}`
};

// ---- Translation Reference ----
const TRANSLATIONS: Record<string, Record<string, string>> = {
  python: {
    'for loop': 'Python: for i in range(10):\n    print(i)\n\nKode:  fr i : 0..10 { io.out(i) }',
    'class': 'Python: class MyClass:\n    def __init__(self):\n        self.x = 0\n\nKode:  ag MyAgent { vr x = 0 }  (agents replace classes)',
    'async/await': 'Python: async def fetch():\n    data = await get_data()\n\nKode:  fn fetch() { lt data = aw get_data() }',
    'list comprehension': 'Python: [x*2 for x in nums if x > 3]\n\nKode:  nums |> lst.filter(|x| -> x > 3) |> lst.map(|x| -> x * 2)',
    'try/except': 'Python: try:\n    ...\nexcept Exception as e:\n    ...\nfinally:\n    ...\n\nKode:  tx { ... } ct e { ... } fy { ... }',
    'import': 'Python: from math import sqrt\n\nKode:  math.sqrt(16)  (stdlib is built-in, no imports needed)',
    'dictionary': 'Python: {"name": "Ada", "age": 30}\n\nKode:  @{name|"Ada" age|30}  (TOON format, 30% fewer tokens)',
    'lambda': 'Python: lambda x: x * 2\n\nKode:  |x| -> x * 2',
    'print': 'Python: print("hello")\n\nKode:  io.out("hello")',
    'f-string': 'Python: f"Hello {name}!"\n\nKode:  "Hello ${name}!"',
  },
  javascript: {
    'for loop': 'JS: for (let i = 0; i < 10; i++) { console.log(i) }\n\nKode: fr i : 0..10 { io.out(i) }',
    'class': 'JS: class MyClass { constructor() { this.x = 0 } }\n\nKode: ag MyAgent { vr x = 0 }',
    'async/await': 'JS: async function fetch() { const data = await getData() }\n\nKode: fn fetch() { lt data = aw get_data() }',
    'arrow function': 'JS: const double = (x) => x * 2\n\nKode: fn double(x) -> x * 2\nor:   lt double = |x| -> x * 2',
    'try/catch': 'JS: try { } catch(e) { } finally { }\n\nKode: tx { } ct e { } fy { }',
    'import': 'JS: import { readFile } from "fs"\n\nKode: fs.read("file.txt")  (stdlib built-in)',
    'object': 'JS: { name: "Ada", age: 30 }\n\nKode: @{name|"Ada" age|30}',
    'template literal': 'JS: `Hello ${name}!`\n\nKode: "Hello ${name}!"',
    'console.log': 'JS: console.log("hello")\n\nKode: io.out("hello")',
    'map/filter': 'JS: arr.filter(x => x > 3).map(x => x * 2)\n\nKode: arr |> lst.filter(|x| -> x > 3) |> lst.map(|x| -> x * 2)',
    'dictionary': 'JS: { name: "Ada", age: 30 }\n\nKode: @{name|"Ada" age|30}',
  }
};

// ---- Tool Handlers ----
function handleTool(name: string, args: any): { content: { type: string; text: string }[] } {
  switch (name) {
    case 'kode_syntax': {
      const feature = (args.feature ?? '').toLowerCase().replace(/\s+/g, '-');
      const syntax = SYNTAX[feature];
      if (!syntax) {
        const available = Object.keys(SYNTAX).join(', ');
        return { content: [{ type: 'text', text: `Unknown feature "${args.feature}". Available: ${available}` }] };
      }
      return { content: [{ type: 'text', text: syntax }] };
    }

    case 'kode_run': {
      try {
        const evaluator = new Evaluator();
        const env = new Environment();
        const output: string[] = [];
        const callFn = (fn: KodeValue, a: KodeValue[]) => evaluator.callFn(fn, a);
        registerBuiltins(env, callFn);
        registerJsonStdlib(env);

        const ioMap = env.get('io') as any;
        ioMap.entries.set('out', {
          type: 'native_fn', name: 'io.out',
          call: (a: KodeValue[]) => { output.push(a.map(stringify).join(' ')); return { type: 'null' } as KodeValue; },
        });

        const tokens = new Lexer(args.code).tokenize();
        const ast = new Parser(tokens).parse();
        const result = evaluator.evalProgram(ast, env);

        let text = output.length > 0 ? output.join('\n') : '';
        if (result.type !== 'null') text += (text ? '\n' : '') + '→ ' + stringify(result);
        return { content: [{ type: 'text', text: text || '(no output)' }] };
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }] };
      }
    }

    case 'kode_validate': {
      try {
        const tokens = new Lexer(args.code).tokenize();
        new Parser(tokens).parse();
        return { content: [{ type: 'text', text: 'Valid Kode code.' }] };
      } catch (e: any) {
        let hint = '';
        const msg = e.message ?? '';
        if (msg.includes('function')) hint = '\nHint: Use "fn" instead of "function"';
        if (msg.includes('let')) hint = '\nHint: Use "lt" instead of "let"';
        if (msg.includes('return')) hint = '\nHint: Use "rt" instead of "return"';
        if (msg.includes('var')) hint = '\nHint: Use "vr" instead of "var"';
        return { content: [{ type: 'text', text: `Invalid: ${e.message}${hint}` }] };
      }
    }

    case 'kode_example': {
      const key = (args.use_case ?? '').toLowerCase().replace(/\s+/g, '-');
      const example = EXAMPLES[key];
      if (!example) {
        return { content: [{ type: 'text', text: `No example for "${args.use_case}". Available: ${Object.keys(EXAMPLES).join(', ')}` }] };
      }
      return { content: [{ type: 'text', text: example }] };
    }

    case 'kode_translate': {
      const lang = (args.from_lang ?? '').toLowerCase();
      const concept = (args.concept ?? '').toLowerCase();
      const langMap = TRANSLATIONS[lang];
      if (!langMap) {
        return { content: [{ type: 'text', text: `Supported languages: python, javascript` }] };
      }
      const translation = langMap[concept];
      if (!translation) {
        return { content: [{ type: 'text', text: `No translation for "${concept}". Available: ${Object.keys(langMap).join(', ')}` }] };
      }
      return { content: [{ type: 'text', text: translation }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
  }
}

// ---- MCP Protocol Handler ----
function handleRequest(req: MCPRequest): MCPResponse {
  switch (req.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0', id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'kode-mcp', version: '0.1.0' }
        }
      };

    case 'notifications/initialized':
      return { jsonrpc: '2.0', id: req.id, result: {} };

    case 'tools/list':
      return { jsonrpc: '2.0', id: req.id, result: { tools: TOOLS } };

    case 'tools/call': {
      const { name, arguments: args } = req.params;
      const result = handleTool(name, args);
      return { jsonrpc: '2.0', id: req.id, result };
    }

    default:
      return {
        jsonrpc: '2.0', id: req.id,
        error: { code: -32601, message: `Method not found: ${req.method}` }
      };
  }
}

// ---- stdio transport ----
const rl = createInterface({ input: process.stdin });
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const req = JSON.parse(line) as MCPRequest;
      const res = handleRequest(req);
      if (req.method !== 'notifications/initialized') {
        process.stdout.write(JSON.stringify(res) + '\n');
      }
    } catch (e: any) {
      process.stderr.write(`MCP parse error: ${e.message}\n`);
    }
  }
});

process.stderr.write('Kode MCP Server running on stdio\n');
