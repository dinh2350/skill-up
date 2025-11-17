# What is the difference between synchronous and asynchronous methods?

## Short Answer

**Synchronous methods** block execution until they complete, while **asynchronous methods** run in the background and don't block the execution of subsequent code.

```javascript
const fs = require("fs");

// ❌ Synchronous - BLOCKS execution
const data = fs.readFileSync("file.txt", "utf8");
console.log(data);
console.log("After sync read"); // Waits for file to be read

// ✅ Asynchronous - NON-BLOCKING
fs.readFile("file.txt", "utf8", (err, data) => {
  console.log(data);
});
console.log("After async read"); // Executes immediately!
```

**Key differences:**

- **Synchronous:** Blocks thread, returns value directly, simpler code
- **Asynchronous:** Non-blocking, uses callbacks/promises, better performance

## Detailed Answer

### Synchronous Methods

Synchronous methods execute one at a time, in order, **blocking** the execution of code until they complete.

#### Characteristics

```javascript
// Synchronous execution - Line by line
console.log("Start"); // 1. Executes first
const result = compute(); // 2. Blocks here until done
console.log("Result:", result); // 3. Executes after compute()
console.log("End"); // 4. Executes last

// Output order is predictable:
// Start
// Result: ...
// End
```

#### File System Example (Sync)

```javascript
const fs = require("fs");

console.log("Before reading file");

// ❌ Synchronous - BLOCKS execution
try {
  const data = fs.readFileSync("file.txt", "utf8");
  console.log("File content:", data);
} catch (err) {
  console.error("Error:", err);
}

console.log("After reading file");

// Output order (predictable):
// Before reading file
// File content: ...
// After reading file
```

#### Multiple Synchronous Operations

```javascript
const fs = require("fs");

console.log("Start");

// Read three files synchronously (BLOCKING)
const file1 = fs.readFileSync("file1.txt", "utf8");
console.log("File 1 loaded");

const file2 = fs.readFileSync("file2.txt", "utf8");
console.log("File 2 loaded");

const file3 = fs.readFileSync("file3.txt", "utf8");
console.log("File 3 loaded");

console.log("All files loaded");

// Output (always in this order):
// Start
// File 1 loaded
// File 2 loaded
// File 3 loaded
// All files loaded
```

### Asynchronous Methods

Asynchronous methods start an operation and immediately continue execution **without blocking**, handling the result later via callbacks, promises, or async/await.

#### Characteristics

```javascript
// Asynchronous execution - Non-blocking
console.log("Start"); // 1. Executes first
setTimeout(() => {
  console.log("Timeout callback"); // 4. Executes last (after 1 second)
}, 1000);
console.log("After setTimeout"); // 2. Executes immediately!
console.log("End"); // 3. Executes before timeout

// Output order:
// Start
// After setTimeout
// End
// Timeout callback (after 1 second)
```

#### File System Example (Async - Callback)

```javascript
const fs = require("fs");

console.log("Before reading file");

// ✅ Asynchronous - NON-BLOCKING
fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log("File content:", data); // Executes later
});

console.log("After starting read"); // Executes immediately!

// Output order:
// Before reading file
// After starting read
// File content: ...
```

#### Multiple Asynchronous Operations

```javascript
const fs = require("fs");

console.log("Start");

// Start three async operations (NON-BLOCKING)
fs.readFile("file1.txt", "utf8", (err, data) => {
  console.log("File 1 loaded");
});

fs.readFile("file2.txt", "utf8", (err, data) => {
  console.log("File 2 loaded");
});

fs.readFile("file3.txt", "utf8", (err, data) => {
  console.log("File 3 loaded");
});

console.log("All reads started");

// Output (order may vary!):
// Start
// All reads started
// File 2 loaded  (or any order)
// File 1 loaded
// File 3 loaded
```

### Side-by-Side Comparison

#### Example 1: Reading Files

```javascript
const fs = require("fs");

// ❌ SYNCHRONOUS - Takes 3 seconds total (blocking)
console.time("sync");
const file1 = fs.readFileSync("file1.txt", "utf8"); // 1 second
const file2 = fs.readFileSync("file2.txt", "utf8"); // 1 second
const file3 = fs.readFileSync("file3.txt", "utf8"); // 1 second
console.timeEnd("sync"); // ~3000ms

// ✅ ASYNCHRONOUS - Takes 1 second total (parallel)
console.time("async");
let completed = 0;

fs.readFile("file1.txt", "utf8", (err, data) => {
  if (++completed === 3) console.timeEnd("async");
});

fs.readFile("file2.txt", "utf8", (err, data) => {
  if (++completed === 3) console.timeEnd("async");
});

fs.readFile("file3.txt", "utf8", (err, data) => {
  if (++completed === 3) console.timeEnd("async");
}); // ~1000ms (all run in parallel!)
```

#### Example 2: Database Queries

```javascript
// ❌ SYNCHRONOUS (pseudo-code - blocks execution)
console.log("Start");
const user = db.getUserSync(1); // Blocks for 100ms
const posts = db.getPostsSync(user.id); // Blocks for 200ms
const comments = db.getCommentsSync(posts[0].id); // Blocks for 150ms
console.log("Done"); // Total: 450ms

// ✅ ASYNCHRONOUS (non-blocking)
console.log("Start");
db.getUser(1, (err, user) => {
  db.getPosts(user.id, (err, posts) => {
    db.getComments(posts[0].id, (err, comments) => {
      console.log("Done"); // Total: 450ms (sequential)
    });
  });
});
console.log("Queries started"); // Executes immediately!
```

### Synchronous vs Asynchronous Comparison Table

| Aspect              | Synchronous                       | Asynchronous                      |
| ------------------- | --------------------------------- | --------------------------------- |
| **Execution**       | Blocking                          | Non-blocking                      |
| **Order**           | Sequential (predictable)          | May vary (unpredictable)          |
| **Performance**     | Slower (waits for each operation) | Faster (parallel execution)       |
| **Code Complexity** | Simpler                           | More complex (callbacks/promises) |
| **Error Handling**  | try/catch                         | Error-first callbacks or .catch() |
| **Return Value**    | Direct return                     | Via callback/promise              |
| **Use Case**        | Scripts, initialization           | Servers, I/O operations           |
| **Thread**          | Blocks main thread                | Doesn't block                     |
| **Example**         | `fs.readFileSync()`               | `fs.readFile()`                   |

### Node.js Built-in Methods

#### File System (fs)

```javascript
const fs = require("fs");

// Synchronous methods (end with "Sync")
fs.readFileSync(path, encoding);
fs.writeFileSync(path, data);
fs.appendFileSync(path, data);
fs.unlinkSync(path);
fs.mkdirSync(path);
fs.readdirSync(path);

// Asynchronous methods (callback-based)
fs.readFile(path, encoding, callback);
fs.writeFile(path, data, callback);
fs.appendFile(path, data, callback);
fs.unlink(path, callback);
fs.mkdir(path, callback);
fs.readdir(path, callback);

// Asynchronous methods (promise-based)
const fsPromises = require("fs").promises;
fsPromises.readFile(path, encoding);
fsPromises.writeFile(path, data);
fsPromises.appendFile(path, data);
fsPromises.unlink(path);
fsPromises.mkdir(path);
fsPromises.readdir(path);
```

#### Crypto Module

```javascript
const crypto = require("crypto");

// Synchronous
const hash = crypto.createHash("sha256").update("data").digest("hex");

// Asynchronous
crypto.pbkdf2("password", "salt", 100000, 64, "sha512", (err, key) => {
  console.log("Key:", key.toString("hex"));
});
```

### When to Use Synchronous Methods

```javascript
// ✅ 1. Initialization/startup (before server starts)
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const app = express();
app.listen(3000);

// ✅ 2. Command-line scripts
const data = fs.readFileSync("input.txt", "utf8");
const processed = processData(data);
fs.writeFileSync("output.txt", processed);
console.log("Done!");

// ✅ 3. Simple scripts where blocking is acceptable
const file1 = fs.readFileSync("file1.txt", "utf8");
const file2 = fs.readFileSync("file2.txt", "utf8");
console.log("Files loaded");
```

### When to Use Asynchronous Methods

```javascript
// ✅ 1. Web servers (don't block other requests!)
app.get("/user/:id", async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
});

// ✅ 2. I/O operations in production
fs.readFile("large-file.txt", "utf8", (err, data) => {
  // Process data without blocking
});

// ✅ 3. Multiple operations (parallel execution)
const [users, posts, comments] = await Promise.all([
  db.getUsers(),
  db.getPosts(),
  db.getComments(),
]);

// ✅ 4. Long-running operations
await processLargeDataset();
```

### Real-World Examples

#### Example 1: Configuration Loading

```javascript
// ✅ Synchronous at startup (OK - runs once)
const express = require("express");
const fs = require("fs");

// Load config synchronously at startup
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

const app = express();

// ✅ Asynchronous for requests (required)
app.get("/data", async (req, res) => {
  try {
    const data = await fs.promises.readFile("data.json", "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port);
```

#### Example 2: Build Script

```javascript
// ✅ Synchronous for build scripts (acceptable)
const fs = require("fs");
const path = require("path");

console.log("Building project...");

// Clean dist folder
if (fs.existsSync("dist")) {
  fs.rmSync("dist", { recursive: true });
}

// Create dist folder
fs.mkdirSync("dist");

// Copy files synchronously
const files = fs.readdirSync("src");
files.forEach((file) => {
  const content = fs.readFileSync(path.join("src", file), "utf8");
  fs.writeFileSync(path.join("dist", file), content);
});

console.log("Build complete!");
```

#### Example 3: Web Server (Must be Async)

```javascript
const http = require("http");
const fs = require("fs").promises;

// ❌ BAD - Synchronous blocks all requests!
const badServer = http.createServer((req, res) => {
  const data = fs.readFileSync("file.txt", "utf8"); // Blocks!
  res.end(data);
});

// ✅ GOOD - Asynchronous handles multiple requests
const goodServer = http.createServer(async (req, res) => {
  try {
    const data = await fs.readFile("file.txt", "utf8"); // Non-blocking!
    res.end(data);
  } catch (err) {
    res.statusCode = 500;
    res.end("Error");
  }
});

goodServer.listen(3000);
```

#### Example 4: Parallel vs Sequential

```javascript
const fs = require("fs").promises;

// ❌ Sequential (slow - 3 seconds total)
async function sequentialRead() {
  console.time("sequential");

  const file1 = await fs.readFile("file1.txt", "utf8"); // 1 sec
  const file2 = await fs.readFile("file2.txt", "utf8"); // 1 sec
  const file3 = await fs.readFile("file3.txt", "utf8"); // 1 sec

  console.timeEnd("sequential"); // ~3000ms
  return [file1, file2, file3];
}

// ✅ Parallel (fast - 1 second total)
async function parallelRead() {
  console.time("parallel");

  const [file1, file2, file3] = await Promise.all([
    fs.readFile("file1.txt", "utf8"),
    fs.readFile("file2.txt", "utf8"),
    fs.readFile("file3.txt", "utf8"),
  ]);

  console.timeEnd("parallel"); // ~1000ms (3x faster!)
  return [file1, file2, file3];
}
```

#### Example 5: Error Handling

```javascript
const fs = require("fs");
const fsPromises = require("fs").promises;

// Synchronous error handling (try/catch)
function readSync() {
  try {
    const data = fs.readFileSync("file.txt", "utf8");
    return data;
  } catch (err) {
    console.error("Sync error:", err);
    return null;
  }
}

// Asynchronous error handling (callback)
function readAsync(callback) {
  fs.readFile("file.txt", "utf8", (err, data) => {
    if (err) {
      console.error("Async error:", err);
      callback(err, null);
      return;
    }
    callback(null, data);
  });
}

// Asynchronous error handling (promise)
async function readAsyncPromise() {
  try {
    const data = await fsPromises.readFile("file.txt", "utf8");
    return data;
  } catch (err) {
    console.error("Promise error:", err);
    return null;
  }
}
```

### Converting Sync to Async

```javascript
// ❌ Synchronous version
function processFilesSync() {
  const file1 = fs.readFileSync("file1.txt", "utf8");
  const file2 = fs.readFileSync("file2.txt", "utf8");
  const combined = file1 + file2;
  fs.writeFileSync("output.txt", combined);
  return "Done";
}

// ✅ Asynchronous version (callbacks)
function processFilesAsync(callback) {
  fs.readFile("file1.txt", "utf8", (err, file1) => {
    if (err) return callback(err);

    fs.readFile("file2.txt", "utf8", (err, file2) => {
      if (err) return callback(err);

      const combined = file1 + file2;
      fs.writeFile("output.txt", combined, (err) => {
        if (err) return callback(err);
        callback(null, "Done");
      });
    });
  });
}

// ✅ Asynchronous version (async/await - cleanest!)
async function processFilesAsyncAwait() {
  const [file1, file2] = await Promise.all([
    fs.promises.readFile("file1.txt", "utf8"),
    fs.promises.readFile("file2.txt", "utf8"),
  ]);

  const combined = file1 + file2;
  await fs.promises.writeFile("output.txt", combined);
  return "Done";
}
```

### Performance Implications

```javascript
const fs = require("fs");

// ❌ Synchronous - Blocks for 100 requests
console.time("sync-performance");
for (let i = 0; i < 100; i++) {
  const data = fs.readFileSync("file.txt", "utf8");
}
console.timeEnd("sync-performance"); // Very slow!

// ✅ Asynchronous - Handles 100 requests in parallel
console.time("async-performance");
const promises = [];
for (let i = 0; i < 100; i++) {
  promises.push(fs.promises.readFile("file.txt", "utf8"));
}
Promise.all(promises).then(() => {
  console.timeEnd("async-performance"); // Much faster!
});
```

### Best Practices

```javascript
// ✅ 1. Use async for I/O operations in servers
app.get("/data", async (req, res) => {
  const data = await fetchData();
  res.json(data);
});

// ✅ 2. Use sync for initialization/startup
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

// ✅ 3. Use Promise.all() for parallel operations
const [users, posts, comments] = await Promise.all([
  db.getUsers(),
  db.getPosts(),
  db.getComments(),
]);

// ✅ 4. Handle errors appropriately
try {
  const data = await fs.promises.readFile("file.txt", "utf8");
} catch (err) {
  console.error("Error:", err);
}

// ✅ 5. Avoid synchronous methods in request handlers
// ❌ BAD
app.get("/file", (req, res) => {
  const data = fs.readFileSync("file.txt", "utf8"); // Blocks!
  res.send(data);
});

// ✅ GOOD
app.get("/file", async (req, res) => {
  const data = await fs.promises.readFile("file.txt", "utf8");
  res.send(data);
});

// ✅ 6. Use async/await over callbacks
// ❌ Callback hell
fs.readFile("file1.txt", (err, data1) => {
  fs.readFile("file2.txt", (err, data2) => {
    fs.readFile("file3.txt", (err, data3) => {
      // ...
    });
  });
});

// ✅ Clean async/await
const data1 = await fs.promises.readFile("file1.txt", "utf8");
const data2 = await fs.promises.readFile("file2.txt", "utf8");
const data3 = await fs.promises.readFile("file3.txt", "utf8");
```

### Common Pitfalls

```javascript
// ❌ 1. Using sync methods in production servers
app.get("/data", (req, res) => {
  const data = fs.readFileSync("data.json"); // Blocks all requests!
  res.json(JSON.parse(data));
});

// ❌ 2. Not handling async errors
async function fetchData() {
  const data = await db.query(); // Unhandled error!
  return data;
}

// ❌ 3. Sequential when parallel is better
const user = await db.getUser(1); // Wait 100ms
const posts = await db.getPosts(); // Wait 200ms
// Total: 300ms

// ✅ Better - parallel
const [user, posts] = await Promise.all([db.getUser(1), db.getPosts()]); // Total: 200ms (parallel!)

// ❌ 4. Forgetting await
async function getData() {
  const data = fs.promises.readFile("file.txt"); // Forgot await!
  console.log(data); // Logs Promise, not data!
}
```

### Key Takeaways

- ✅ **Synchronous:** Blocks execution, simpler code, use for scripts/initialization
- ✅ **Asynchronous:** Non-blocking, better performance, use for servers/I/O
- ✅ Sync methods end with `Sync` (e.g., `readFileSync`)
- ✅ Async methods use callbacks, promises, or async/await
- ✅ **Never use sync methods in request handlers** (blocks all users!)
- ✅ Use `Promise.all()` for parallel async operations
- ✅ Use async/await for cleaner async code
- ✅ Handle errors with try/catch for async/await
- ✅ Sync is predictable, async order may vary
- ✅ Async is essential for Node.js scalability
- ✅ Choose sync for build scripts, async for production apps
- ✅ Test async code thoroughly

### Further Reading

- [Node.js Asynchronous Programming](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
- [Understanding the Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [Async/Await Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [Promises - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Node.js fs module](https://nodejs.org/api/fs.html)
