# What is the `global` object in Node.js?

## Short Answer

The `global` object in Node.js is the **global namespace** - similar to `window` in browsers. It contains properties and methods that are available throughout your entire application without needing to import them.

**Key points:**

- Variables declared with `var` at the top level do NOT become global properties (unlike browsers)
- Built-in globals include: `console`, `setTimeout`, `Buffer`, `process`, `__dirname`, `__filename`
- You can add your own properties to `global` (but it's generally not recommended)

```javascript
// Accessing global properties
console.log(global.console); // [Object: console]
console.log(global.process); // Process object
console.log(global.Buffer); // Buffer constructor

// Adding to global (not recommended)
global.myConfig = { apiKey: "123" };

// Access anywhere in your app
console.log(myConfig.apiKey); // '123'
```

## Detailed Answer

### What is the global Object?

The `global` object is the **top-level namespace** in Node.js, analogous to the `window` object in browsers.

#### Browser vs Node.js

```javascript
// Browser
console.log(window); // Window object
console.log(this === window); // true (in global scope)
var x = 5;
console.log(window.x); // 5

// Node.js
console.log(global); // Global object
console.log(this === global); // false (in module scope)
var x = 5;
console.log(global.x); // undefined (not added to global!)
```

**Key difference:** In Node.js, variables declared at the top level are **scoped to the module**, not added to `global`.

### Built-in Global Properties

#### 1. Console Methods

```javascript
// Available without importing
console.log("Hello");
console.error("Error");
console.warn("Warning");
console.info("Info");
console.table([{ name: "John", age: 30 }]);

// These are all on global
console.log(global.console === console); // true
```

#### 2. Timers

```javascript
// setTimeout
const timeoutId = setTimeout(() => {
  console.log("Executed after 1 second");
}, 1000);

// setInterval
const intervalId = setInterval(() => {
  console.log("Executed every 2 seconds");
}, 2000);

// setImmediate
setImmediate(() => {
  console.log("Executed in next event loop iteration");
});

// clearTimeout / clearInterval / clearImmediate
clearTimeout(timeoutId);
clearInterval(intervalId);

// All accessible via global
console.log(typeof global.setTimeout); // 'function'
console.log(typeof global.setInterval); // 'function'
console.log(typeof global.setImmediate); // 'function'
```

#### 3. Buffer

```javascript
// Buffer is globally available
const buf = Buffer.from("Hello World");
console.log(buf); // <Buffer 48 65 6c 6c 6f 20 57 6f 72 6c 64>

// Same as
const buf2 = global.Buffer.from("Hello World");

console.log(Buffer === global.Buffer); // true
```

#### 4. Process

```javascript
// Process information
console.log(process.version); // v18.16.0
console.log(process.platform); // 'darwin', 'linux', 'win32'
console.log(process.arch); // 'x64', 'arm64'
console.log(process.pid); // Process ID

// Environment variables
console.log(process.env.NODE_ENV); // 'development', 'production'

// Exit process
process.exit(0); // Exit with success code

// Same as
console.log(global.process === process); // true
```

#### 5. URL and URLSearchParams

```javascript
// URL parsing (globally available since Node.js 10+)
const myUrl = new URL("https://example.com/path?name=John&age=30");
console.log(myUrl.hostname); // 'example.com'
console.log(myUrl.pathname); // '/path'
console.log(myUrl.search); // '?name=John&age=30'

// URL search params
const params = new URLSearchParams("name=John&age=30");
console.log(params.get("name")); // 'John'
console.log(params.get("age")); // '30'

console.log(URL === global.URL); // true
```

#### 6. TextEncoder and TextDecoder

```javascript
// TextEncoder (globally available since Node.js 11+)
const encoder = new TextEncoder();
const encoded = encoder.encode("Hello");
console.log(encoded); // Uint8Array [72, 101, 108, 108, 111]

// TextDecoder
const decoder = new TextDecoder();
const decoded = decoder.decode(encoded);
console.log(decoded); // 'Hello'

console.log(TextEncoder === global.TextEncoder); // true
```

#### 7. Performance API

```javascript
// Performance measurements (globally available since Node.js 16+)
const start = performance.now();

// Some operation
for (let i = 0; i < 1000000; i++) {}

const end = performance.now();
console.log(`Operation took ${end - start}ms`);

console.log(performance === global.performance); // true
```

### Complete List of Global Objects

```javascript
// Core globals
global.console;
global.process;
global.Buffer;
global.setImmediate;
global.setTimeout;
global.setInterval;
global.clearImmediate;
global.clearTimeout;
global.clearInterval;

// URL APIs
global.URL;
global.URLSearchParams;

// Encoding
global.TextEncoder;
global.TextDecoder;
global.atob; // Base64 decode
global.btoa; // Base64 encode

// Performance
global.performance;

// Abort
global.AbortController;
global.AbortSignal;

// Crypto (Node.js 19+)
global.crypto;

// Fetch API (Node.js 18+)
global.fetch;
global.Request;
global.Response;
global.Headers;
global.FormData;

// Module-specific (not truly global, but injected into modules)
__dirname; // Current directory path
__filename; // Current file path
require; // Module loader
module; // Current module
exports; // Module exports
```

### Module-Level Variables (Not Global!)

These look global but are actually **injected into each module**:

```javascript
// These are module-scoped, not global
console.log(__dirname); // Current directory
console.log(__filename); // Current file
console.log(require); // Module loader
console.log(module); // Current module
console.log(exports); // Module exports

// They are NOT on global
console.log(global.__dirname); // undefined
console.log(global.require); // undefined
console.log(global.module); // undefined
```

**Why?** Node.js wraps each module in a function:

```javascript
(function (exports, require, module, __filename, __dirname) {
  // Your module code here
  console.log(__dirname); // Available as parameter
});
```

### Adding Properties to global

#### Basic Addition

```javascript
// Add property to global
global.APP_NAME = "My Application";
global.API_VERSION = "v1";

// Access anywhere
console.log(APP_NAME); // 'My Application'
console.log(global.APP_NAME); // 'My Application'
```

#### Adding Configuration

```javascript
// config.js
global.config = {
  database: {
    host: "localhost",
    port: 5432,
    name: "mydb",
  },
  api: {
    baseUrl: "https://api.example.com",
    timeout: 5000,
  },
};

// app.js (different file)
console.log(config.database.host); // 'localhost'
console.log(config.api.baseUrl); // 'https://api.example.com'
```

#### Adding Helper Functions

```javascript
// helpers.js
global.log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

global.formatMoney = (amount) => {
  return `$${amount.toFixed(2)}`;
};

// Use anywhere
log("Application started"); // [2025-11-16T10:30:00.000Z] Application started
console.log(formatMoney(99.5)); // $99.50
```

### Why Adding to global is NOT Recommended

#### Problem 1: Hard to Track Dependencies

```javascript
// user.js
function getUser() {
  return db.query("SELECT * FROM users"); // Where does 'db' come from?
}

// Hard to trace - could be defined anywhere
```

#### Problem 2: Naming Conflicts

```javascript
// file1.js
global.config = { mode: "development" };

// file2.js (loaded later)
global.config = { mode: "production" }; // Overwrites!

// file3.js
console.log(config.mode); // Which one? 🤔
```

#### Problem 3: Difficult to Test

```javascript
// hard-to-test.js
function processData() {
  const apiKey = API_KEY; // Global variable
  // Hard to mock for testing
}

// Better: Dependency injection
function processData(apiKey) {
  // Easy to test with any value
}
```

#### Problem 4: Memory Leaks

```javascript
// memory-leak.js
global.cache = {};

function cacheData(key, value) {
  cache[key] = value; // Never cleaned up!
}

// Cache grows forever
for (let i = 0; i < 1000000; i++) {
  cacheData(`key${i}`, { data: "large object" });
}
```

### Better Alternatives to global

#### 1. Module Exports (Recommended)

```javascript
// config.js
module.exports = {
  database: {
    host: "localhost",
    port: 5432,
  },
};

// app.js
const config = require("./config");
console.log(config.database.host); // Clear dependency!
```

#### 2. Environment Variables

```javascript
// Use process.env instead of global
process.env.API_KEY = "secret123";

// Access anywhere
console.log(process.env.API_KEY);

// Better: Use .env file with dotenv
require("dotenv").config();
console.log(process.env.API_KEY);
```

#### 3. Dependency Injection

```javascript
// database.js
class Database {
  constructor(config) {
    this.config = config;
  }

  connect() {
    console.log(`Connecting to ${this.config.host}`);
  }
}

module.exports = Database;

// app.js
const Database = require("./database");
const config = require("./config");

const db = new Database(config.database);
db.connect();
```

#### 4. Singleton Pattern

```javascript
// logger.js
class Logger {
  constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }

    this.logs = [];
    Logger.instance = this;
  }

  log(message) {
    this.logs.push(message);
    console.log(message);
  }
}

module.exports = new Logger(); // Export single instance

// Use anywhere
const logger = require("./logger");
logger.log("Message");
```

### Real-World Examples

#### Example 1: Checking Global Properties

```javascript
// debug.js
function listGlobals() {
  console.log("Built-in globals:");

  const globals = [
    "console",
    "process",
    "Buffer",
    "setTimeout",
    "setInterval",
    "setImmediate",
    "clearTimeout",
    "clearInterval",
    "clearImmediate",
    "URL",
    "URLSearchParams",
    "TextEncoder",
    "TextDecoder",
  ];

  globals.forEach((name) => {
    console.log(`${name}: ${typeof global[name]}`);
  });
}

listGlobals();
```

#### Example 2: Polyfilling Global APIs

```javascript
// polyfill.js
if (typeof global.fetch === "undefined") {
  console.log("fetch not available, using node-fetch");
  global.fetch = require("node-fetch");
}

// Now fetch is available everywhere
fetch("https://api.example.com/data")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

#### Example 3: Global Error Handler

```javascript
// error-handler.js
global.handleError = (error, context = "Unknown") => {
  console.error(`[${context}] Error:`, error.message);
  console.error(error.stack);

  // Send to error tracking service
  // errorTracker.captureException(error);
};

// Use anywhere
try {
  throw new Error("Something went wrong");
} catch (error) {
  handleError(error, "User Service");
}
```

#### Example 4: Development vs Production

```javascript
// setup.js
if (process.env.NODE_ENV === "development") {
  // Add debug helpers in development only
  global.debug = (...args) => {
    console.log("[DEBUG]", ...args);
  };
} else {
  // No-op in production
  global.debug = () => {};
}

// Use anywhere
debug("This only logs in development");
```

#### Example 5: Global Constants

```javascript
// constants.js
// Define once
global.CONSTANTS = Object.freeze({
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  API_TIMEOUT: 5000,
  CACHE_TTL: 3600,
  STATUS_CODES: {
    OK: 200,
    NOT_FOUND: 404,
    ERROR: 500,
  },
});

// Use anywhere (read-only)
console.log(CONSTANTS.MAX_UPLOAD_SIZE);
console.log(CONSTANTS.STATUS_CODES.OK);

// Can't modify (frozen)
CONSTANTS.NEW_PROP = "value"; // Silently fails
console.log(CONSTANTS.NEW_PROP); // undefined
```

### Detecting Global Pollution

```javascript
// detect-globals.js
const builtInGlobals = new Set([
  "console",
  "process",
  "Buffer",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "clearTimeout",
  "clearInterval",
  "clearImmediate",
  "URL",
  "URLSearchParams",
  "TextEncoder",
  "TextDecoder",
  "performance",
  "fetch",
  "AbortController",
  "crypto",
]);

function detectCustomGlobals() {
  const customGlobals = [];

  for (const key in global) {
    if (!builtInGlobals.has(key)) {
      customGlobals.push(key);
    }
  }

  if (customGlobals.length > 0) {
    console.warn("Custom globals detected:", customGlobals);
  }

  return customGlobals;
}

// Check for pollution
detectCustomGlobals();
```

### globalThis (Modern Alternative)

`globalThis` is the **standardized way** to access the global object across environments (Node.js, browsers, workers).

```javascript
// Works everywhere
console.log(globalThis);

// Node.js
console.log(globalThis === global); // true

// Browser
console.log(globalThis === window); // true

// Web Worker
console.log(globalThis === self); // true

// Use globalThis for cross-platform code
globalThis.myApp = {
  version: "1.0.0",
};
```

### Accessing global in Different Contexts

```javascript
// Regular module
console.log(this);           // {} (empty module.exports)
console.log(global);         // Global object

// Function context
function test() {
  console.log(this);         // undefined (strict mode) or global
}

// Arrow function
const arrow = () => {
  console.log(this);         // {} (lexical this from module)
};

// REPL
> this
[Object: global]

// Strict mode
'use strict';
console.log(this);           // undefined
```

### Best Practices

```javascript
// ✅ 1. Avoid adding to global unless absolutely necessary
// ❌ Bad
global.db = new Database();

// ✅ Good
const db = require("./database");

// ✅ 2. Use const/let instead of var at module level
// ❌ Bad (might be confusing)
var config = {};

// ✅ Good (clearly module-scoped)
const config = {};

// ✅ 3. Use environment variables for configuration
// ✅ Good
const apiKey = process.env.API_KEY;

// ✅ 4. If you must use global, document it clearly
/**
 * Global error handler
 * @global
 * @param {Error} error - The error to handle
 */
global.handleError = (error) => {
  console.error(error);
};

// ✅ 5. Freeze global objects to prevent modification
global.config = Object.freeze({
  apiUrl: "https://api.example.com",
});

// ✅ 6. Use globalThis for cross-platform code
globalThis.myLogger = new Logger();

// ✅ 7. Check if global property exists before using
if (typeof global.fetch === "function") {
  fetch("https://api.example.com");
}

// ✅ 8. Clean up global properties when no longer needed
global.tempData = {};
// ... use it ...
delete global.tempData;
```

### Common Use Cases for global

```javascript
// 1. Application-wide logger (acceptable)
global.logger = require("./logger");

// 2. Feature flags (acceptable)
global.features = {
  newUI: process.env.FEATURE_NEW_UI === "true",
  betaAPI: process.env.FEATURE_BETA_API === "true",
};

// 3. Test mocking (acceptable in tests only)
if (process.env.NODE_ENV === "test") {
  global.mockDatabase = {};
}

// 4. Development tools (acceptable in dev only)
if (process.env.NODE_ENV === "development") {
  global.printRoutes = () => {
    console.log(app._router.stack);
  };
}
```

### Key Takeaways

- ✅ `global` is Node.js's global namespace (like `window` in browsers)
- ✅ Many built-in objects are available globally: `console`, `Buffer`, `process`, `setTimeout`, etc.
- ✅ Variables declared with `var/let/const` at top level are **module-scoped**, not global
- ✅ `__dirname`, `__filename`, `require`, `module`, `exports` are **module-level**, not on `global`
- ✅ You CAN add properties to `global`, but it's generally NOT recommended
- ✅ Use module exports, dependency injection, or singletons instead
- ✅ Use `globalThis` for cross-platform compatibility
- ✅ Only use `global` for truly application-wide utilities
- ✅ Avoid global pollution - it makes code harder to test and maintain
- ✅ Document any custom global properties clearly
- ✅ Use `Object.freeze()` on global objects to prevent modification
- ✅ Check `typeof global.property` before using to avoid errors

### Further Reading

- [Node.js Global Objects Documentation](https://nodejs.org/api/globals.html)
- [globalThis - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis)
- [Node.js Modules Wrapper](https://nodejs.org/api/modules.html#modules_the_module_wrapper)
- [JavaScript Global Object](https://javascript.info/global-object)
- [Best Practices for Node.js Globals](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
