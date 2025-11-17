# What is the difference between `require` and `import`?

## Short Answer

`require` is the CommonJS module system used in Node.js by default, while `import` is part of the ES6 (ES2015) module system (ESM). The main differences are:

- `require` is synchronous and dynamic, while `import` is asynchronous and static
- `require` can be called anywhere in the code, while `import` must be at the top of the file
- `require` loads modules at runtime, while `import` is analyzed at parse time
- `require` returns an object, while `import` uses destructuring and named/default exports

## Detailed Answer

### Overview Comparison

| Feature                 | `require` (CommonJS)  | `import` (ES Modules)                 |
| ----------------------- | --------------------- | ------------------------------------- |
| **Module System**       | CommonJS (CJS)        | ES Modules (ESM)                      |
| **Origin**              | Node.js (2009)        | ECMAScript 2015 (ES6)                 |
| **Loading**             | Synchronous           | Asynchronous                          |
| **Execution**           | Runtime (dynamic)     | Parse time (static)                   |
| **Conditional Loading** | ✅ Yes                | ❌ No (use dynamic import)            |
| **Default in Node.js**  | Yes (< v13)           | Opt-in (>= v13)                       |
| **Browser Support**     | ❌ No (needs bundler) | ✅ Yes (modern browsers)              |
| **File Extension**      | `.js`                 | `.mjs` or `.js` with "type": "module" |

### CommonJS (`require`)

#### Basic Syntax

```javascript
// Importing entire module
const express = require("express");

// Importing specific functions using destructuring
const { readFile, writeFile } = require("fs");

// Importing with custom name
const myModule = require("./myModule");

// Conditional require
if (condition) {
  const moduleA = require("moduleA");
} else {
  const moduleB = require("moduleB");
}

// Dynamic require
const moduleName = "express";
const dynamicModule = require(moduleName);
```

#### Exporting with CommonJS

```javascript
// Single export
module.exports = function () {
  console.log("Hello World");
};

// Multiple exports
module.exports = {
  name: "John",
  age: 30,
  greet: function () {
    console.log("Hello!");
  },
};

// Using exports shorthand (creates properties on module.exports)
exports.name = "John";
exports.greet = function () {
  console.log("Hello!");
};

// Named exports
module.exports.myFunction = function () {};
module.exports.myVariable = "value";
```

#### How `require` Works

```javascript
// 1. Module caching - modules are cached after first load
const module1 = require("./myModule"); // Loaded and cached
const module2 = require("./myModule"); // Returns cached version
console.log(module1 === module2); // true

// 2. Synchronous loading
console.log("Before require");
const fs = require("fs");
console.log("After require"); // Executes immediately after

// 3. Can be used anywhere in code
function loadModule() {
  const module = require("./module");
  return module;
}

// 4. Dynamic paths
const environment = "development";
const config = require(`./config.${environment}.js`);
```

### ES Modules (`import`)

#### Basic Syntax

```javascript
// Default import
import express from "express";

// Named imports
import { readFile, writeFile } from "fs";

// Import all as namespace
import * as fs from "fs";

// Import with alias
import { readFile as read } from "fs";

// Mixed default and named imports
import React, { useState, useEffect } from "react";

// Side-effect import (just execute the module)
import "./styles.css";

// Dynamic import (returns a Promise)
const module = await import("./myModule.js");

// Or with then
import("./myModule.js").then((module) => {
  // use module
});
```

#### Exporting with ES Modules

```javascript
// Named exports
export const name = 'John';
export function greet() {
  console.log('Hello!');
}

// Export multiple at once
const name = 'John';
const age = 30;
export { name, age };

// Export with alias
export { myFunction as publicFunction };

// Default export (only one per module)
export default function() {
  console.log('Default export');
}

// Or
function myFunction() {}
export default myFunction;

// Mixed exports
export const helper = () => {};
export default class MyClass {}

// Re-exporting
export { something } from './otherModule.js';
export * from './otherModule.js';
```

### Key Differences Explained

#### 1. **Loading Mechanism**

**CommonJS (require):**

```javascript
// Synchronous - blocks execution until module is loaded
const fs = require("fs");
console.log("This runs after fs is loaded");

// Module code executes immediately
// File: myModule.js
console.log("Module loading...");
module.exports = { data: "value" };

// File: main.js
console.log("Before require");
const myModule = require("./myModule"); // Logs "Module loading..."
console.log("After require");
```

**ES Modules (import):**

```javascript
// Static - imports are hoisted to the top
console.log("This runs first");
import fs from "fs"; // This is hoisted
console.log("This runs second");

// Asynchronous loading with dynamic import
async function loadModule() {
  console.log("Before import");
  const module = await import("./myModule.js");
  console.log("After import");
}
```

#### 2. **Static vs Dynamic**

**CommonJS (Dynamic):**

```javascript
// ✅ Conditional imports work
let config;
if (process.env.NODE_ENV === "production") {
  config = require("./config.prod.js");
} else {
  config = require("./config.dev.js");
}

// ✅ Runtime path resolution
const moduleName = getUserInput();
const module = require(`./modules/${moduleName}`);

// ✅ Can be in any scope
function loadWhenNeeded() {
  return require("./heavyModule");
}
```

**ES Modules (Static):**

```javascript
// ❌ Cannot use conditional imports (syntax error)
if (condition) {
  import module from './module.js'; // SyntaxError
}

// ✅ Use dynamic import instead
if (condition) {
  const module = await import('./module.js');
}

// ❌ Cannot compute import paths statically
const path = './module.js';
import module from path; // SyntaxError

// ✅ Use dynamic import
const module = await import(path);

// ❌ Must be at top level (not in function)
function loadModule() {
  import module from './module.js'; // SyntaxError
}

// ✅ Use dynamic import
async function loadModule() {
  const module = await import('./module.js');
}
```

#### 3. **Export/Import Syntax**

**CommonJS:**

```javascript
// Export
module.exports = value;
module.exports.key = value;
exports.key = value; // Shorthand

// Import
const module = require("./module");
const { key } = require("./module");
```

**ES Modules:**

```javascript
// Export
export default value;
export const key = value;
export { key };

// Import
import module from "./module.js";
import { key } from "./module.js";
import * as module from "./module.js";
```

#### 4. **this Context**

**CommonJS:**

```javascript
// File: module.js
console.log(this); // {} (empty object, module.exports)
console.log(this === module.exports); // true

// In a function
function myFunction() {
  console.log(this); // undefined in strict mode
}
```

**ES Modules:**

```javascript
// File: module.js
console.log(this); // undefined (ES modules are in strict mode)

// Always in strict mode
function myFunction() {
  console.log(this); // undefined
}
```

#### 5. **File Extensions**

**CommonJS:**

```javascript
// Default .js extension
const module = require("./module"); // looks for module.js
const module = require("./module.js"); // explicit

// Can require JSON
const data = require("./data.json");
```

**ES Modules:**

```javascript
// Must specify .js extension
import module from './module.js'; // required

// For ES modules, use .mjs or configure package.json
// File: module.mjs
export default {};

// Or in package.json
{
  "type": "module"
}
```

### Using ES Modules in Node.js

#### Method 1: Use .mjs extension

```javascript
// File: module.mjs
export const greet = () => console.log("Hello");
export default function () {}

// File: main.mjs
import myFunction, { greet } from "./module.mjs";
```

#### Method 2: Use "type": "module" in package.json

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "type": "module"
}
```

```javascript
// Now .js files are treated as ES modules
// File: module.js
export const greet = () => console.log("Hello");

// File: main.js
import { greet } from "./module.js";
```

#### Method 3: Use .cjs for CommonJS with "type": "module"

```json
{
  "type": "module"
}
```

```javascript
// File: module.cjs (CommonJS)
module.exports = { greet: () => console.log("Hello") };

// File: main.js (ES Module)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { greet } = require("./module.cjs");
```

### Interoperability

#### Using CommonJS modules in ES Modules

```javascript
// CommonJS module
// File: commonModule.cjs
module.exports = {
  name: "CommonJS",
  greet: () => console.log("Hello"),
};

// ES Module importing CommonJS
// File: esModule.mjs
import commonModule from "./commonModule.cjs";
console.log(commonModule.name); // 'CommonJS'
commonModule.greet(); // 'Hello'

// Named imports don't work directly
// import { name } from './commonModule.cjs'; // Error

// Use default import and destructure
import common from "./commonModule.cjs";
const { name, greet } = common;
```

#### Using ES Modules in CommonJS (with dynamic import)

```javascript
// ES Module
// File: esModule.mjs
export const name = "ES Module";
export default function () {
  console.log("Hello from ES Module");
}

// CommonJS module
// File: commonModule.cjs
async function loadESModule() {
  const esModule = await import("./esModule.mjs");
  console.log(esModule.name); // 'ES Module'
  esModule.default(); // 'Hello from ES Module'
}

loadESModule();

// Or using .then()
import("./esModule.mjs").then((module) => {
  console.log(module.name);
  module.default();
});
```

### Dynamic Import

Dynamic `import()` works in both CommonJS and ES Modules:

```javascript
// Returns a Promise
import("./module.js")
  .then((module) => {
    console.log(module.default);
    console.log(module.namedExport);
  })
  .catch((err) => console.error(err));

// With async/await
async function loadModule() {
  try {
    const module = await import("./module.js");
    console.log(module.default);
  } catch (err) {
    console.error(err);
  }
}

// Conditional loading
async function loadConfig() {
  const env = process.env.NODE_ENV;
  const config = await import(`./config.${env}.js`);
  return config.default;
}

// Lazy loading for performance
button.addEventListener("click", async () => {
  const module = await import("./heavyModule.js");
  module.initialize();
});
```

### Tree Shaking

One major advantage of ES Modules is tree shaking (dead code elimination).

**CommonJS (Cannot tree shake):**

```javascript
// lodash-full.js
module.exports = {
  map: () => {},
  filter: () => {},
  reduce: () => {},
  // ... hundreds of functions
};

// main.js
const _ = require("lodash");
_.map([1, 2, 3], (x) => x * 2);

// Bundle includes ALL lodash functions (can't eliminate unused)
```

**ES Modules (Can tree shake):**

```javascript
// lodash-es.js
export const map = () => {};
export const filter = () => {};
export const reduce = () => {};

// main.js
import { map } from "lodash-es";
map([1, 2, 3], (x) => x * 2);

// Bundler only includes 'map' function, removes others
```

### Performance Considerations

**CommonJS:**

- ✅ Synchronous loading is faster for server-side
- ✅ Simpler for Node.js scripts
- ❌ Cannot be tree-shaken effectively
- ❌ Larger bundle sizes

**ES Modules:**

- ✅ Better for tree shaking
- ✅ Smaller bundle sizes
- ✅ Better static analysis
- ❌ Asynchronous loading has overhead
- ✅ Better for browser (native support)

### Real-World Examples

#### Example 1: Express Server (CommonJS)

```javascript
// app.js
const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/users");

const app = express();

app.use(bodyParser.json());
app.use("/api/users", userRoutes);

module.exports = app;

// server.js
const app = require("./app");
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### Example 2: Express Server (ES Modules)

```javascript
// app.js
import express from "express";
import bodyParser from "body-parser";
import userRoutes from "./routes/users.js";

const app = express();

app.use(bodyParser.json());
app.use("/api/users", userRoutes);

export default app;

// server.js
import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### Example 3: Conditional Loading

**CommonJS:**

```javascript
// config.js
let config;

if (process.env.NODE_ENV === "production") {
  config = require("./config.production");
} else if (process.env.NODE_ENV === "staging") {
  config = require("./config.staging");
} else {
  config = require("./config.development");
}

module.exports = config;
```

**ES Modules:**

```javascript
// config.js
let config;

const env = process.env.NODE_ENV || "development";

switch (env) {
  case "production":
    config = await import("./config.production.js");
    break;
  case "staging":
    config = await import("./config.staging.js");
    break;
  default:
    config = await import("./config.development.js");
}

export default config.default;
```

### Top-Level Await

ES Modules support top-level await (Node.js 14.8+):

```javascript
// ES Modules only
// File: database.js
import { connectDB } from "./db.js";

// Top-level await
const connection = await connectDB();
export default connection;

// File: main.js
import db from "./database.js";
// db is already connected

// CommonJS equivalent (requires wrapper)
// File: database.js
const { connectDB } = require("./db");

module.exports = (async () => {
  const connection = await connectDB();
  return connection;
})();

// File: main.js
const dbPromise = require("./database");
dbPromise.then((db) => {
  // use db
});
```

### Module Resolution

**CommonJS:**

```javascript
// Can omit .js extension
const module = require("./module");

// Looks for:
// 1. ./module.js
// 2. ./module/index.js
// 3. ./module.json
// 4. ./module.node

// Can require from node_modules
const express = require("express");
// Looks in node_modules/express/
```

**ES Modules:**

```javascript
// Must include .js extension for relative imports
import module from "./module.js";

// For packages, extension can be omitted
import express from "express";

// Import maps can customize resolution (browser)
// In HTML:
// <script type="importmap">
// {
//   "imports": {
//     "react": "/node_modules/react/index.js"
//   }
// }
// </script>
```

### **dirname and **filename

**CommonJS:**

```javascript
console.log(__dirname); // /home/user/project
console.log(__filename); // /home/user/project/file.js

const path = require("path");
const fullPath = path.join(__dirname, "data", "file.txt");
```

**ES Modules:**

```javascript
// __dirname and __filename not available
// Use import.meta.url instead

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname); // /home/user/project
console.log(__filename); // /home/user/project/file.js

// Or use import.meta.url directly
console.log(import.meta.url); // file:///home/user/project/file.js
```

### When to Use Which?

#### Use CommonJS (`require`) when:

- ✅ Working with older Node.js projects
- ✅ Need conditional module loading
- ✅ Need to compute module paths dynamically
- ✅ Working with many legacy npm packages
- ✅ Simpler for quick scripts
- ✅ No need for tree shaking

#### Use ES Modules (`import`) when:

- ✅ Starting a new project
- ✅ Want better tree shaking
- ✅ Need static analysis benefits
- ✅ Working with modern tooling (Vite, Rollup)
- ✅ Want consistency with browser JavaScript
- ✅ Using TypeScript (prefers ES modules)
- ✅ Building libraries for modern consumption

### Migration Strategy

#### Gradual Migration Approach

```javascript
// 1. Start with package.json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}

// 2. Use .cjs for CommonJS files
// File: config.cjs
module.exports = { /* config */ };

// 3. Use .mjs for ES modules
// File: utils.mjs
export const helper = () => {};

// 4. Gradually convert .js files
// Update imports/exports one file at a time

// 5. Update tooling
// - Update build scripts
// - Update test configuration
// - Update linting rules
```

### Best Practices

#### CommonJS Best Practices

```javascript
// ✅ Cache expensive operations
const cachedData = expensiveOperation();
module.exports = cachedData;

// ✅ Use clear naming
module.exports = {
  connect,
  disconnect,
  query,
};

// ❌ Don't reassign exports
exports = { data }; // Wrong! Breaks the reference
module.exports = { data }; // Correct

// ✅ Use destructuring on import
const { connect, disconnect } = require("./database");
```

#### ES Modules Best Practices

```javascript
// ✅ Use named exports for utilities
export const helper = () => {};
export const formatter = () => {};

// ✅ Use default export for main export
export default class MyClass {}

// ✅ Group exports
export { helper, formatter, MyClass };

// ✅ Use dynamic import for code splitting
const HeavyComponent = lazy(() => import("./HeavyComponent.js"));

// ✅ Always include .js extension
import { helper } from "./utils.js"; // Correct
```

### Conclusion

Both `require` (CommonJS) and `import` (ES Modules) are valid module systems, each with their strengths:

- **CommonJS** is mature, synchronous, and works well for Node.js applications
- **ES Modules** are modern, support tree shaking, and align with browser JavaScript

For new projects, **ES Modules are recommended** as they're the future of JavaScript, but CommonJS remains widely used and supported.

### Key Takeaways

- ✅ `require` = CommonJS (synchronous, dynamic, runtime)
- ✅ `import` = ES Modules (asynchronous, static, parse-time)
- ✅ ES Modules enable tree shaking and better optimization
- ✅ CommonJS allows dynamic, conditional loading
- ✅ Node.js supports both with configuration
- ✅ Dynamic `import()` works in both systems
- ✅ ES Modules are the future standard
- ✅ Migration is possible but requires planning
- ✅ Choose based on project requirements and constraints

### Further Reading

- [Node.js ES Modules Documentation](https://nodejs.org/api/esm.html)
- [Node.js Modules Documentation](https://nodejs.org/api/modules.html)
- [MDN: JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [ES Modules: A Cartoon Deep-Dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)
