# How do you debug a Node.js application?

## Short Answer

Node.js applications can be debugged using multiple approaches:

1. **console.log()** - Simple output debugging
2. **Node.js built-in debugger** - `node inspect` command
3. **Chrome DevTools** - `node --inspect` with Chrome browser
4. **VS Code Debugger** - Integrated debugging in VS Code
5. **Debug module** - Conditional logging with the `debug` package
6. **Error stack traces** - Analyzing error messages
7. **Third-party tools** - ndb, node-inspect, etc.

The most popular methods are **Chrome DevTools** (`node --inspect`) and **VS Code integrated debugger** for their powerful features like breakpoints, step-through debugging, and variable inspection.

## Detailed Answer

### 1. Console Logging (Basic Debugging)

The simplest debugging method using `console` methods.

#### console.log()

```javascript
function calculateTotal(price, quantity) {
  console.log("Price:", price);
  console.log("Quantity:", quantity);

  const total = price * quantity;
  console.log("Total:", total);

  return total;
}

calculateTotal(10, 5);
// Output:
// Price: 10
// Quantity: 5
// Total: 50
```

#### Other Console Methods

```javascript
// console.error() - Red text, goes to stderr
console.error("This is an error!");

// console.warn() - Yellow text
console.warn("This is a warning!");

// console.info() - Informational message
console.info("Application started");

// console.debug() - Debug level message
console.debug("Debug information");

// console.table() - Display data as table
const users = [
  { name: "John", age: 30 },
  { name: "Jane", age: 25 },
];
console.table(users);

// console.time() / console.timeEnd() - Measure performance
console.time("API Call");
await fetch("https://api.example.com/data");
console.timeEnd("API Call");
// Output: API Call: 234.567ms

// console.trace() - Print stack trace
function a() {
  b();
}
function b() {
  c();
}
function c() {
  console.trace("Trace:");
}
a();

// console.dir() - Display object properties
console.dir(process, { depth: 2, colors: true });

// console.assert() - Conditional logging
console.assert(1 === 1, "This will not print");
console.assert(1 === 2, "This will print!");

// console.count() - Count function calls
for (let i = 0; i < 5; i++) {
  console.count("Loop iteration");
}
// Output:
// Loop iteration: 1
// Loop iteration: 2
// Loop iteration: 3
// Loop iteration: 4
// Loop iteration: 5

// console.group() - Group related logs
console.group("User Details");
console.log("Name: John");
console.log("Age: 30");
console.groupEnd();
```

### 2. Node.js Built-in Debugger

Node.js includes a command-line debugger.

#### Starting the Debugger

```bash
# Start debugger
node inspect app.js

# Or
node inspect script.js arg1 arg2
```

#### Debugger Commands

```javascript
// app.js
function greet(name) {
  debugger; // Breakpoint
  return `Hello, ${name}!`;
}

console.log(greet("World"));
```

```bash
# Run with debugger
node inspect app.js
```

**Debugger commands:**

```
cont, c     Continue execution
next, n     Step to next line
step, s     Step into function
out, o      Step out of function
pause       Pause running code
backtrace, bt   Show backtrace
setBreakpoint('script.js', 10), sb(...)   Set breakpoint
clearBreakpoint('script.js', 10), cb(...) Clear breakpoint
watch(expr)     Add expression to watch list
unwatch(expr)   Remove expression from watch list
list(5)         Show source code around current line
repl            Enter REPL to evaluate expressions
exec expr       Execute expression in current context
quit, q         Exit debugger
```

**Example session:**

```bash
$ node inspect app.js
< Debugger listening on ws://127.0.0.1:9229/...
< For help, see: https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in app.js:1
> 1 function greet(name) {
  2   debugger;
  3   return `Hello, ${name}!`;

debug> n
break in app.js:2
  1 function greet(name) {
> 2   debugger;
  3   return `Hello, ${name}!`;
  4 }

debug> c
< Hello, World!
```

### 3. Chrome DevTools (Most Popular)

Debug Node.js using Chrome browser's powerful debugging tools.

#### Starting with --inspect

```bash
# Start app with inspector
node --inspect app.js

# Or with break on first line
node --inspect-brk app.js

# Specify port
node --inspect=9229 app.js
```

**Output:**

```
Debugger listening on ws://127.0.0.1:9229/...
For help, see: https://nodejs.org/en/docs/inspector
```

#### Connecting Chrome DevTools

1. Open Chrome browser
2. Navigate to: `chrome://inspect`
3. Click "Open dedicated DevTools for Node"
4. Or click "inspect" under your running process

#### Example Application

```javascript
// app.js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  debugger; // Execution will pause here in DevTools
  const message = "Hello World!";
  console.log("Request received");
  res.send(message);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

```bash
# Run with debugger
node --inspect app.js
```

#### Chrome DevTools Features

**1. Breakpoints**

- Click line numbers to set breakpoints
- Right-click for conditional breakpoints
- Logpoints (log without breaking)

**2. Step Through Code**

- Step Over (F10) - Next line
- Step Into (F11) - Enter function
- Step Out (Shift+F11) - Exit function
- Continue (F8) - Resume execution

**3. Watch Expressions**

```javascript
// Add watch expressions to monitor variables
req.body;
user.email;
total > 100;
```

**4. Call Stack**

- View function call hierarchy
- Click stack frames to inspect context

**5. Scope Variables**

- Local variables
- Closure variables
- Global variables

**6. Console**

- Execute code in current context
- Inspect variables
- Test expressions

### 4. VS Code Debugger (Recommended)

VS Code has the best integrated debugging experience.

#### Method 1: Auto Configuration

```bash
# Open VS Code
code .

# Press F5 or click "Run and Debug"
# VS Code will create .vscode/launch.json automatically
```

#### Method 2: Manual Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/app.js"
    }
  ]
}
```

#### Common Configurations

**Configuration 1: Basic Launch**

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch App",
  "program": "${workspaceFolder}/src/index.js",
  "console": "integratedTerminal"
}
```

**Configuration 2: Attach to Running Process**

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Process",
  "port": 9229
}
```

```bash
# Start app with --inspect
node --inspect app.js

# Then attach VS Code debugger
```

**Configuration 3: Debug with Nodemon**

```json
{
  "type": "node",
  "request": "launch",
  "name": "Nodemon",
  "runtimeExecutable": "nodemon",
  "program": "${workspaceFolder}/app.js",
  "restart": true,
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

**Configuration 4: Debug with Environment Variables**

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch with Env",
  "program": "${workspaceFolder}/app.js",
  "env": {
    "NODE_ENV": "development",
    "PORT": "3000",
    "DEBUG": "*"
  }
}
```

**Configuration 5: Debug Tests (Jest)**

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

**Configuration 6: Debug TypeScript**

```json
{
  "type": "node",
  "request": "launch",
  "name": "TypeScript Debug",
  "program": "${workspaceFolder}/src/index.ts",
  "preLaunchTask": "tsc: build - tsconfig.json",
  "outFiles": ["${workspaceFolder}/dist/**/*.js"],
  "sourceMaps": true
}
```

**Configuration 7: Multiple Configurations**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Server",
      "program": "${workspaceFolder}/server.js"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Worker",
      "program": "${workspaceFolder}/worker.js"
    }
  ],
  "compounds": [
    {
      "name": "Server + Worker",
      "configurations": ["Launch Server", "Launch Worker"]
    }
  ]
}
```

#### VS Code Debugging Features

**1. Breakpoints**

```javascript
// Click gutter to set breakpoint
function calculatePrice(price, tax) {
  const total = price + price * tax; // <- Set breakpoint here
  return total;
}
```

**Breakpoint types:**

- Regular breakpoint (red dot)
- Conditional breakpoint (right-click line)
- Logpoint (right-click, "Add Logpoint")
- Function breakpoint

**2. Debug Console**

```javascript
// While paused at breakpoint, evaluate in Debug Console:
> price
10
> tax
0.15
> price * tax
1.5
> total
11.5
```

**3. Variable Inspection**

- Hover over variables
- View in Variables pane
- Watch expressions

**4. Call Stack**

- See function call hierarchy
- Click to jump to frame

**5. Debug Actions**

- Continue (F5)
- Step Over (F10)
- Step Into (F11)
- Step Out (Shift+F11)
- Restart (Ctrl+Shift+F5)
- Stop (Shift+F5)

### 5. Debug Module

The `debug` package provides conditional logging.

#### Installation

```bash
npm install debug
```

#### Basic Usage

```javascript
// logger.js
const debug = require("debug");

const dbDebug = debug("app:db");
const apiDebug = debug("app:api");

function connectDatabase() {
  dbDebug("Connecting to database...");
  // Database connection code
  dbDebug("Database connected");
}

function callAPI() {
  apiDebug("Calling external API...");
  // API call code
  apiDebug("API call complete");
}

connectDatabase();
callAPI();
```

#### Running with Debug

```bash
# Enable all debug logs
DEBUG=* node app.js

# Enable specific namespace
DEBUG=app:db node app.js

# Enable multiple namespaces
DEBUG=app:db,app:api node app.js

# Wildcard
DEBUG=app:* node app.js

# Exclude namespace
DEBUG=*,-app:db node app.js
```

#### Advanced Debug Usage

```javascript
const debug = require("debug");
const log = debug("app:server");

// Format output
log("Server started on port %d", 3000);
log("User: %s, Age: %d", "John", 30);
log("Object: %O", { name: "John", age: 30 });

// Extend debug
const error = log.extend("error");
const warn = log.extend("warn");

log("Normal log");
error("Error message");
warn("Warning message");
```

**Output with colors:**

```bash
DEBUG=app:* node app.js
# app:server Server started on port 3000 +0ms
# app:server:error Error message +5ms
# app:server:warn Warning message +2ms
```

### 6. Error Stack Traces

Understanding and using stack traces for debugging.

#### Basic Stack Trace

```javascript
function a() {
  b();
}

function b() {
  c();
}

function c() {
  throw new Error("Something went wrong!");
}

try {
  a();
} catch (err) {
  console.error(err.stack);
}

// Output:
// Error: Something went wrong!
//     at c (/path/to/app.js:10:9)
//     at b (/path/to/app.js:6:3)
//     at a (/path/to/app.js:2:3)
//     at Object.<anonymous> (/path/to/app.js:14:3)
```

#### Custom Error with Stack

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

function divide(a, b) {
  if (b === 0) {
    throw new AppError("Cannot divide by zero", 400);
  }
  return a / b;
}

try {
  divide(10, 0);
} catch (err) {
  console.error("Error:", err.message);
  console.error("Status:", err.statusCode);
  console.error("Stack:", err.stack);
}
```

#### Source Maps for TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSourceMap": false
  }
}
```

```bash
# Install source-map-support
npm install source-map-support

# In your app
require('source-map-support').install();
```

### 7. Advanced Debugging Techniques

#### Async Stack Traces

```javascript
// Enable long stack traces for async operations
async function fetchUser() {
  const user = await db.findUser();
  return user;
}

async function processUser() {
  const user = await fetchUser();
  // Error here will show full async stack
  throw new Error("Processing failed");
}

processUser().catch((err) => {
  console.error(err.stack);
});
```

**Node.js 12+: --async-stack-traces**

```bash
node --async-stack-traces app.js
```

#### Memory Profiling

```javascript
// Check memory usage
const used = process.memoryUsage();
console.log(
  "Heap Used:",
  Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
  "MB"
);

// Force garbage collection (requires --expose-gc)
if (global.gc) {
  global.gc();
  console.log("GC executed");
}
```

```bash
# Run with GC exposed
node --expose-gc app.js

# Take heap snapshot
node --inspect app.js
# Then in Chrome DevTools: Memory > Take snapshot
```

#### CPU Profiling

```bash
# Generate CPU profile
node --prof app.js

# This creates: isolate-0x...-v8.log

# Process profile
node --prof-process isolate-0x...-v8.log > profile.txt
```

#### Using Inspector API

```javascript
const inspector = require("inspector");
const fs = require("fs");
const session = new inspector.Session();

session.connect();

// Take heap snapshot
session.post("HeapProfiler.takeHeapSnapshot", (err, snapshot) => {
  fs.writeFileSync("heap.heapsnapshot", JSON.stringify(snapshot));
});

// Start CPU profiling
session.post("Profiler.enable");
session.post("Profiler.start");

// Your code here
heavyComputation();

// Stop profiling
session.post("Profiler.stop", (err, { profile }) => {
  fs.writeFileSync("cpu.cpuprofile", JSON.stringify(profile));
});
```

### 8. Debugging Production Issues

#### Logging Frameworks

```bash
npm install winston
# or
npm install pino
```

**Winston Example:**

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Usage
logger.info("User logged in", { userId: 123 });
logger.error("Database connection failed", { error: err.message });
```

**Pino Example (Faster):**

```javascript
const pino = require("pino");
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

logger.info("Application started");
logger.error({ err }, "Error occurred");
```

#### Application Performance Monitoring (APM)

```bash
# Install APM tool
npm install @newrelic/native-metrics
npm install elastic-apm-node
npm install @sentry/node
```

**Sentry Example:**

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "your-dsn-here",
  environment: process.env.NODE_ENV,
});

// Catch errors
app.get("/", (req, res) => {
  try {
    throw new Error("Test error");
  } catch (err) {
    Sentry.captureException(err);
    res.status(500).send("Error occurred");
  }
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### 9. Debugging Tools Comparison

| Tool                | Pros                  | Cons                              | Best For        |
| ------------------- | --------------------- | --------------------------------- | --------------- |
| **console.log()**   | Simple, fast          | Clutters code, not for production | Quick debugging |
| **Node debugger**   | Built-in, no setup    | Basic features, CLI-based         | Simple scripts  |
| **Chrome DevTools** | Powerful, familiar UI | Requires browser                  | Full debugging  |
| **VS Code**         | Best IDE integration  | Requires VS Code                  | Development     |
| **debug module**    | Conditional logging   | Setup needed                      | Production logs |
| **Winston/Pino**    | Production-ready      | Complexity                        | Production      |
| **APM tools**       | Real-time monitoring  | Cost, overhead                    | Production      |

### 10. Debugging Best Practices

#### ✅ Do's

```javascript
// 1. Use meaningful log messages
console.log("User authenticated:", { userId, email });

// 2. Log at appropriate levels
logger.debug("Detailed debug info");
logger.info("Normal operation");
logger.warn("Warning condition");
logger.error("Error occurred", { error });

// 3. Include context
logger.error("Database query failed", {
  query: sql,
  params,
  error: err.message,
});

// 4. Use structured logging
logger.info({
  event: "user_login",
  userId: 123,
  timestamp: new Date(),
  ip: req.ip,
});

// 5. Handle errors properly
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection:", { reason, promise });
});
```

#### ❌ Don'ts

```javascript
// 1. Don't leave console.log in production
console.log("Debug info"); // ❌ Remove before deploy

// 2. Don't log sensitive data
logger.info({ password: user.password }); // ❌ Security risk

// 3. Don't use console.log for errors
console.log(err); // ❌ Use console.error or logger.error

// 4. Don't ignore errors
try {
  riskyOperation();
} catch (err) {
  // ❌ Silent failure
}

// 5. Don't log synchronously in production
logger.writeSync("message"); // ❌ Blocks event loop
```

### Key Takeaways

- ✅ Use **VS Code debugger** or **Chrome DevTools** for best debugging experience
- ✅ Set breakpoints instead of console.log() for complex debugging
- ✅ Use `--inspect` flag to enable remote debugging
- ✅ Use `debug` module for conditional logging
- ✅ Implement proper error handling with try/catch
- ✅ Use logging frameworks (Winston, Pino) in production
- ✅ Enable source maps for TypeScript debugging
- ✅ Monitor production with APM tools (Sentry, New Relic)
- ✅ Use async stack traces for better async debugging
- ✅ Remove debug code before production deployment

### Further Reading

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [VS Code Node.js Debugging](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [Chrome DevTools for Node.js](https://nodejs.org/en/docs/guides/debugging-getting-started/#chrome-devtools-55)
- [Debug Module Documentation](https://github.com/debug-js/debug)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Pino Logger](https://github.com/pinojs/pino)
