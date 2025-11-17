# What is the event loop in Node.js?

## Short Answer

The **event loop** is the mechanism that allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded. It continuously checks if there are tasks waiting to be executed and processes them in a specific order through different phases:

1. **Timers** - Executes `setTimeout()` and `setInterval()` callbacks
2. **Pending callbacks** - Executes I/O callbacks deferred to the next loop iteration
3. **Idle, prepare** - Internal use only
4. **Poll** - Retrieves new I/O events and executes I/O callbacks
5. **Check** - Executes `setImmediate()` callbacks
6. **Close callbacks** - Executes close event callbacks (e.g., `socket.on('close')`)

Between each phase, Node.js checks for `process.nextTick()` and microtasks (Promises), which have higher priority than all phases.

## Detailed Answer

### The Core Concept

Node.js is **single-threaded**, meaning it has only one call stack. However, it can handle thousands of concurrent connections efficiently through the event loop, which delegates I/O operations to the system kernel (via libuv) and processes their callbacks asynchronously.

```javascript
// Single-threaded but non-blocking
console.log("Start");

setTimeout(() => {
  console.log("Timeout");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise");
});

console.log("End");

// Output:
// Start
// End
// Promise
// Timeout
```

### Event Loop Architecture

```
   ┌───────────────────────────┐
┌─>│           timers          │  <- setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  <- I/O callbacks deferred
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  <- Internal use
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │  <- setImmediate
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │  <- socket.on('close')
   └───────────────────────────┘
```

### Event Loop Phases in Detail

#### Phase 1: Timers

Executes callbacks scheduled by `setTimeout()` and `setInterval()`.

```javascript
console.log("Start");

setTimeout(() => {
  console.log("Timer 1 (0ms)");
}, 0);

setTimeout(() => {
  console.log("Timer 2 (10ms)");
}, 10);

setTimeout(() => {
  console.log("Timer 3 (5ms)");
}, 5);

console.log("End");

// Output:
// Start
// End
// Timer 1 (0ms)
// Timer 3 (5ms)
// Timer 2 (10ms)
```

**Key Points:**

- Timers specify a **threshold** after which a callback _may_ execute, not the exact time
- Timers are not guaranteed to execute at the exact time specified
- Multiple timers scheduled for the same time execute in the order they were created

#### Phase 2: Pending Callbacks

Executes I/O callbacks that were deferred to the next loop iteration.

```javascript
const fs = require("fs");

fs.readFile("file.txt", (err, data) => {
  // This callback executes in pending callbacks phase
  // (or poll phase, depending on when it completes)
  console.log("File read complete");
});
```

**Key Points:**

- Executes some system operations callbacks (e.g., TCP errors)
- Most I/O callbacks execute in the poll phase

#### Phase 3: Idle, Prepare

Used internally by Node.js. Not accessible to user code.

#### Phase 4: Poll

**Most important phase** - retrieves new I/O events and executes I/O callbacks.

```javascript
const fs = require("fs");

console.log("1. Start");

fs.readFile("file.txt", (err, data) => {
  console.log("3. File read callback");

  setTimeout(() => {
    console.log("5. Timer inside file callback");
  }, 0);

  setImmediate(() => {
    console.log("4. Immediate inside file callback");
  });
});

console.log("2. End");

// Output:
// 1. Start
// 2. End
// 3. File read callback
// 4. Immediate inside file callback
// 5. Timer inside file callback
```

**Key Points:**

- Calculates how long it should block and poll for I/O
- Processes events in the poll queue
- If poll queue is empty:
  - If `setImmediate()` is scheduled, event loop goes to check phase
  - If no `setImmediate()`, it waits for callbacks to be added
- If timers are scheduled, goes back to timers phase when threshold is reached

#### Phase 5: Check

Executes `setImmediate()` callbacks immediately after the poll phase.

```javascript
console.log("Start");

setTimeout(() => {
  console.log("Timeout");
}, 0);

setImmediate(() => {
  console.log("Immediate");
});

console.log("End");

// Output (when run from main module):
// Start
// End
// Timeout (usually, but order can vary)
// Immediate

// Output (when run inside I/O cycle):
// setImmediate executes before setTimeout
```

**Key Points:**

- `setImmediate()` is designed to execute after the poll phase
- Inside an I/O callback, `setImmediate()` always executes before `setTimeout()`

#### Phase 6: Close Callbacks

Executes close event callbacks (e.g., `socket.on('close')`).

```javascript
const net = require("net");

const server = net.createServer();

server.on("close", () => {
  console.log("Server closed");
});

server.listen(8080, () => {
  console.log("Server listening");
  server.close(); // Triggers close callback
});

// Output:
// Server listening
// Server closed
```

### Microtasks and process.nextTick()

**Between each phase**, Node.js checks for two special queues:

1. **process.nextTick() queue** (highest priority)
2. **Microtask queue** (Promises, queueMicrotask)

```javascript
console.log("1. Start");

setTimeout(() => {
  console.log("6. Timeout");
}, 0);

Promise.resolve()
  .then(() => {
    console.log("4. Promise 1");
  })
  .then(() => {
    console.log("5. Promise 2");
  });

process.nextTick(() => {
  console.log("3. nextTick");
});

console.log("2. End");

// Output:
// 1. Start
// 2. End
// 3. nextTick
// 4. Promise 1
// 5. Promise 2
// 6. Timeout
```

#### Priority Order

```
┌─────────────────────────────────┐
│      Call Stack (Sync Code)     │  <- Highest Priority
├─────────────────────────────────┤
│    process.nextTick() Queue     │
├─────────────────────────────────┤
│      Microtask Queue            │  <- Promises
├─────────────────────────────────┤
│      Event Loop Phases          │  <- Timers, Poll, Check, etc.
└─────────────────────────────────┘
```

### process.nextTick() vs setImmediate()

```javascript
// process.nextTick() - Executes before event loop continues
process.nextTick(() => {
  console.log("nextTick 1");
});

process.nextTick(() => {
  console.log("nextTick 2");
});

// setImmediate() - Executes in check phase
setImmediate(() => {
  console.log("Immediate 1");
});

setImmediate(() => {
  console.log("Immediate 2");
});

console.log("Synchronous");

// Output:
// Synchronous
// nextTick 1
// nextTick 2
// Immediate 1
// Immediate 2
```

#### Key Differences

| Feature        | process.nextTick()          | setImmediate()            |
| -------------- | --------------------------- | ------------------------- |
| **Execution**  | Before event loop continues | In check phase            |
| **Priority**   | Highest (before microtasks) | Normal (after poll)       |
| **Use Case**   | Critical operations first   | After I/O operations      |
| **Risk**       | Can starve I/O              | Won't block I/O           |
| **Inside I/O** | After current operation     | Guaranteed next iteration |

```javascript
// Inside I/O callback: setImmediate executes BEFORE setTimeout
const fs = require("fs");

fs.readFile("file.txt", () => {
  setTimeout(() => {
    console.log("2. Timeout");
  }, 0);

  setImmediate(() => {
    console.log("1. Immediate");
  });
});

// Output:
// 1. Immediate
// 2. Immediate
```

### Real-World Examples

#### Example 1: Understanding Execution Order

```javascript
console.log("1. Script start");

setTimeout(() => {
  console.log("7. setTimeout 1");

  process.nextTick(() => {
    console.log("8. nextTick inside setTimeout");
  });
}, 0);

Promise.resolve()
  .then(() => {
    console.log("4. Promise 1");
    return Promise.resolve();
  })
  .then(() => {
    console.log("5. Promise 2");
  });

process.nextTick(() => {
  console.log("3. nextTick 1");

  process.nextTick(() => {
    console.log("3.5. nextTick inside nextTick");
  });
});

setImmediate(() => {
  console.log("9. setImmediate 1");
});

console.log("2. Script end");

// Output:
// 1. Script start
// 2. Script end
// 3. nextTick 1
// 3.5. nextTick inside nextTick
// 4. Promise 1
// 5. Promise 2
// 7. setTimeout 1
// 8. nextTick inside setTimeout
// 9. setImmediate 1
```

#### Example 2: File Reading with Event Loop

```javascript
const fs = require("fs");

console.log("1. Start reading file");

fs.readFile("large-file.txt", (err, data) => {
  console.log("4. File read complete");

  // These execute in order based on event loop
  setTimeout(() => {
    console.log("7. Timeout after file read");
  }, 0);

  setImmediate(() => {
    console.log("5. Immediate after file read");
  });

  process.nextTick(() => {
    console.log("6. NextTick after file read");
  });
});

setTimeout(() => {
  console.log("3. Timeout in main");
}, 0);

console.log("2. End of main script");

// Output:
// 1. Start reading file
// 2. End of main script
// 3. Timeout in main
// 4. File read complete
// 6. NextTick after file read
// 5. Immediate after file read
// 7. Timeout after file read
```

#### Example 3: Recursive setImmediate (Non-blocking)

```javascript
let counter = 0;

function processChunk() {
  console.log(`Processing chunk ${counter}`);
  counter++;

  if (counter < 5) {
    setImmediate(processChunk); // Allows I/O between iterations
  }
}

// Start processing
setImmediate(processChunk);

// This will still execute between chunks
setTimeout(() => {
  console.log("Timer executed between chunks");
}, 5);

// Output:
// Processing chunk 0
// Processing chunk 1
// Timer executed between chunks
// Processing chunk 2
// Processing chunk 3
// Processing chunk 4
```

#### Example 4: Recursive nextTick (Blocking - Dangerous!)

```javascript
let counter = 0;

function dangerousLoop() {
  counter++;

  if (counter < 1000000) {
    process.nextTick(dangerousLoop); // ⚠️ Blocks event loop!
  } else {
    console.log("Finally done!");
  }
}

process.nextTick(dangerousLoop);

// This will NOT execute until nextTick queue is empty
setTimeout(() => {
  console.log("This waits for all nextTick callbacks");
}, 0);

// ⚠️ Warning: This can starve the event loop!
```

#### Example 5: HTTP Server with Event Loop

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  console.log("1. Request received");

  // Simulate async operation
  setImmediate(() => {
    console.log("2. Processing in setImmediate");

    // Simulate database query
    setTimeout(() => {
      console.log("3. Database query complete");

      res.writeHead(200);
      res.end("Response sent");
      console.log("4. Response sent");
    }, 100);
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

### Blocking vs Non-Blocking Code

#### Blocking (Bad for Event Loop)

```javascript
// ❌ Synchronous - Blocks event loop
const fs = require("fs");

console.log("Start");

const data = fs.readFileSync("large-file.txt", "utf8"); // Blocks!
console.log("File read complete");

console.log("End");

// Nothing else can execute while file is being read
```

#### Non-Blocking (Good for Event Loop)

```javascript
// ✅ Asynchronous - Non-blocking
const fs = require("fs");

console.log("Start");

fs.readFile("large-file.txt", "utf8", (err, data) => {
  console.log("File read complete");
});

console.log("End");

// Event loop can handle other operations while file is being read
```

### Event Loop and libuv

Node.js uses **libuv** library for the event loop and asynchronous I/O:

```
┌─────────────────────────────────┐
│      JavaScript Code (V8)       │
├─────────────────────────────────┤
│         Node.js APIs            │
├─────────────────────────────────┤
│      libuv (Event Loop)         │
│    - Event Loop Management      │
│    - Thread Pool (I/O)          │
│    - Async Operations           │
├─────────────────────────────────┤
│      Operating System           │
│    - File System                │
│    - Network                    │
│    - Timers                     │
└─────────────────────────────────┘
```

**libuv Thread Pool:**

- Default: 4 threads (configurable with `UV_THREADPOOL_SIZE`)
- Used for: File I/O, DNS lookup, crypto operations
- Not used for: Network I/O (uses OS-level async APIs)

```javascript
// Configure thread pool size
process.env.UV_THREADPOOL_SIZE = 8;

const crypto = require("crypto");

// These will use thread pool
crypto.pbkdf2("password", "salt", 100000, 512, "sha512", (err, key) => {
  console.log("Crypto operation complete");
});
```

### Visualizing the Event Loop

```javascript
// Complete example showing all concepts
console.log("1. Sync - Main");

setTimeout(() => {
  console.log("8. Timer Phase - Macro Task");
}, 0);

setImmediate(() => {
  console.log("9. Check Phase - Macro Task");
});

Promise.resolve()
  .then(() => {
    console.log("4. Microtask - Promise 1");
    return Promise.resolve();
  })
  .then(() => {
    console.log("5. Microtask - Promise 2");
  });

process.nextTick(() => {
  console.log("3. Microtask - NextTick 1");

  Promise.resolve().then(() => {
    console.log("6. Microtask - Promise inside NextTick");
  });

  process.nextTick(() => {
    console.log("7. Microtask - NextTick 2");
  });
});

console.log("2. Sync - Main");

/*
Execution Flow:
1. Execute all synchronous code (1, 2)
2. Execute all process.nextTick() callbacks (3)
3. Execute all microtasks/Promises (4, 5, 6, 7)
4. Enter event loop phases
   - Timers: setTimeout (8)
   - Poll: (waiting for I/O)
   - Check: setImmediate (9)
*/
```

### Common Event Loop Patterns

#### Pattern 1: Deferring Execution

```javascript
// Defer execution to next tick
function deferredExecution(callback) {
  process.nextTick(() => {
    callback();
  });
}

deferredExecution(() => {
  console.log("Executed in next tick");
});

console.log("Executed immediately");

// Output:
// Executed immediately
// Executed in next tick
```

#### Pattern 2: Breaking Long Operations

```javascript
// Break long operation into chunks
function processLargeArray(array, processItem) {
  const chunk = 100;
  let index = 0;

  function processChunk() {
    const end = Math.min(index + chunk, array.length);

    for (let i = index; i < end; i++) {
      processItem(array[i]);
    }

    index = end;

    if (index < array.length) {
      setImmediate(processChunk); // Allow I/O between chunks
    }
  }

  processChunk();
}

// Usage
const largeArray = Array.from({ length: 10000 }, (_, i) => i);
processLargeArray(largeArray, (item) => {
  // Process each item
  console.log(`Processing ${item}`);
});
```

#### Pattern 3: Ensuring Async Behavior

```javascript
// Ensure callback is always async
function maybeAsync(value, callback) {
  if (value) {
    callback(value); // ❌ Synchronous sometimes
  } else {
    setTimeout(() => {
      callback("default");
    }, 0);
  }
}

// ✅ Better: Always async
function alwaysAsync(value, callback) {
  process.nextTick(() => {
    callback(value || "default");
  });
}
```

### Event Loop Performance Tips

#### 1. Avoid Blocking the Event Loop

```javascript
// ❌ Bad - Blocks event loop
function heavyComputation() {
  let sum = 0;
  for (let i = 0; i < 1e9; i++) {
    sum += i;
  }
  return sum;
}

// ✅ Good - Break into chunks
function heavyComputationAsync(callback) {
  let sum = 0;
  let i = 0;
  const limit = 1e9;
  const chunkSize = 1e6;

  function processChunk() {
    const end = Math.min(i + chunkSize, limit);

    for (; i < end; i++) {
      sum += i;
    }

    if (i < limit) {
      setImmediate(processChunk);
    } else {
      callback(sum);
    }
  }

  processChunk();
}
```

#### 2. Use Worker Threads for CPU-Intensive Tasks

```javascript
const { Worker } = require("worker_threads");

function heavyComputationWithWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", {
      workerData: data,
    });

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
```

#### 3. Monitor Event Loop Lag

```javascript
const start = Date.now();

function checkEventLoopLag() {
  const now = Date.now();
  const lag = now - start - 1000; // Expected 1000ms

  console.log(`Event loop lag: ${lag}ms`);

  setTimeout(checkEventLoopLag, 1000);
}

setTimeout(checkEventLoopLag, 1000);
```

### Debugging Event Loop Issues

```javascript
// Track event loop performance
const { performance } = require("perf_hooks");

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

obs.observe({ entryTypes: ["measure"] });

performance.mark("start-operation");

// Your async operations here
setTimeout(() => {
  performance.mark("end-operation");
  performance.measure("Operation", "start-operation", "end-operation");
}, 100);
```

### Best Practices

#### ✅ Do's

```javascript
// 1. Use setImmediate for deferring work after I/O
fs.readFile("file.txt", (err, data) => {
  setImmediate(() => {
    processData(data);
  });
});

// 2. Break long operations into chunks
function processInChunks(array) {
  const chunk = 1000;
  let index = 0;

  function process() {
    const end = Math.min(index + chunk, array.length);
    for (let i = index; i < end; i++) {
      // Process item
    }
    index = end;
    if (index < array.length) {
      setImmediate(process);
    }
  }

  process();
}

// 3. Use async/await for cleaner code
async function fetchData() {
  const data = await getData();
  return data;
}

// 4. Handle errors properly
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection:", reason);
});
```

#### ❌ Don'ts

```javascript
// 1. Don't use recursive nextTick (starves I/O)
function bad() {
  process.nextTick(bad); // ❌ Infinite loop blocks everything
}

// 2. Don't block event loop with sync operations
const data = fs.readFileSync("huge-file.txt"); // ❌ Blocks

// 3. Don't use Promise anti-patterns
new Promise((resolve) => {
  setTimeout(() => resolve(), 1000);
}).then(() => {
  // ❌ Don't nest promises
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 1000);
  }).then(() => {
    // More nesting...
  });
});

// 4. Don't forget error handling
setTimeout(() => {
  throw new Error("Unhandled!"); // ❌ Crashes the app
}, 1000);
```

### Key Takeaways

- ✅ Event loop allows Node.js to be non-blocking despite being single-threaded
- ✅ Event loop has 6 phases: timers, pending callbacks, idle/prepare, poll, check, close callbacks
- ✅ `process.nextTick()` executes before all phases (highest priority)
- ✅ Microtasks (Promises) execute after nextTick but before event loop phases
- ✅ `setImmediate()` executes in check phase (after poll)
- ✅ Inside I/O callbacks, `setImmediate()` executes before `setTimeout()`
- ✅ libuv manages the event loop and thread pool (default 4 threads)
- ✅ Avoid blocking the event loop with long synchronous operations
- ✅ Use `setImmediate()` to break up long operations
- ✅ Monitor event loop lag in production applications

### Further Reading

- [Node.js Event Loop Documentation](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [libuv Design Overview](http://docs.libuv.org/en/v1.x/design.html)
- [Understanding the Event Loop (Node.js Guide)](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- [Event Loop Best Practices](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
- [Philip Roberts: What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ)
