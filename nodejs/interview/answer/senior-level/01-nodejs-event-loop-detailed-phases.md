# Explain the Node.js Event Loop in Detail (All Phases)

The Node.js event loop is the core mechanism that enables Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded. Understanding the event loop is crucial for writing efficient, performant Node.js applications and avoiding common pitfalls like blocking the main thread.

## Overview of the Event Loop

The event loop is what allows Node.js to perform non-blocking I/O operations by offloading operations to the system (when possible) and executing JavaScript code, collecting and processing events, and executing queued sub-tasks.

### Key Concepts

1. **Single-threaded JavaScript execution**: JavaScript runs in a single thread
2. **Multi-threaded I/O operations**: I/O operations are handled by libuv thread pool
3. **Event-driven architecture**: Operations are triggered by events
4. **Non-blocking operations**: The main thread is never blocked by I/O

## Event Loop Architecture

```javascript
// Conceptual representation of the event loop structure
const eventLoopPhases = {
  timers: "Execute callbacks scheduled by setTimeout() and setInterval()",
  pendingCallbacks: "Execute I/O callbacks deferred to the next loop iteration",
  idle: "Internal use only",
  poll: "Fetch new I/O events; execute I/O related callbacks",
  check: "Execute setImmediate() callbacks",
  close: "Execute close event callbacks",
};

// Special queues (processed between phases)
const specialQueues = {
  nextTickQueue: "process.nextTick() callbacks (highest priority)",
  microTaskQueue: "Promise callbacks and queueMicrotask()",
};
```

## Detailed Phase Breakdown

### Phase 1: Timers Phase

The timers phase executes callbacks scheduled by `setTimeout()` and `setInterval()`.

```javascript
console.log("=== TIMERS PHASE DEMONSTRATION ===");

// Example demonstrating timer execution order
function demonstrateTimersPhase() {
  console.log("Start of script");

  // setTimeout with 0ms delay
  setTimeout(() => {
    console.log("Timer 1: setTimeout 0ms");
  }, 0);

  // setTimeout with 1ms delay
  setTimeout(() => {
    console.log("Timer 2: setTimeout 1ms");
  }, 1);

  // setInterval (will execute multiple times)
  const intervalId = setInterval(() => {
    console.log("Timer 3: setInterval 100ms");
  }, 100);

  // Clear interval after 350ms
  setTimeout(() => {
    clearInterval(intervalId);
    console.log("Timer 4: Interval cleared");
  }, 350);

  // Multiple timers with same delay
  setTimeout(() => console.log("Timer 5a: Same delay"), 50);
  setTimeout(() => console.log("Timer 5b: Same delay"), 50);
  setTimeout(() => console.log("Timer 5c: Same delay"), 50);

  console.log("End of script (synchronous)");
}

// Timer precision and minimum delay
function demonstrateTimerPrecision() {
  console.log("\n=== TIMER PRECISION ===");

  const start = Date.now();

  // Node.js has a minimum timer delay of ~1ms
  setTimeout(() => {
    const elapsed = Date.now() - start;
    console.log(`Timer with 0ms delay executed after: ${elapsed}ms`);
  }, 0);

  // Demonstrate timer coalescing
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const elapsed = Date.now() - start;
      console.log(`Timer ${i + 1} executed at: ${elapsed}ms`);
    }, 10);
  }
}

// Advanced timer behavior
function demonstrateTimerBehavior() {
  console.log("\n=== TIMER BEHAVIOR ===");

  const startTime = process.hrtime.bigint();

  // Timer with heavy computation
  setTimeout(() => {
    const elapsed = Number(process.hrtime.bigint() - startTime) / 1000000;
    console.log(`Heavy timer executed after: ${elapsed.toFixed(2)}ms`);

    // Simulate heavy computation
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
  }, 10);

  // Timer that schedules another timer
  setTimeout(() => {
    console.log("Timer scheduling another timer");
    setTimeout(() => {
      console.log("Nested timer executed");
    }, 0);
  }, 20);

  // Timer with error handling
  setTimeout(() => {
    try {
      throw new Error("Timer error");
    } catch (error) {
      console.log("Timer error caught:", error.message);
    }
  }, 30);
}

// Uncomment to run demonstrations
// demonstrateTimersPhase();
// demonstrateTimerPrecision();
// demonstrateTimerBehavior();
```

### Phase 2: Pending Callbacks Phase

This phase executes I/O callbacks that were deferred to the next iteration of the event loop.

```javascript
console.log("=== PENDING CALLBACKS PHASE ===");

const fs = require("fs");
const net = require("net");

function demonstratePendingCallbacks() {
  console.log("Demonstrating pending callbacks...");

  // File system operations that might be deferred
  fs.readFile("./package.json", (err, data) => {
    if (err) {
      console.log("File read error callback (pending phase)");
    } else {
      console.log("File read success callback (pending phase)");
    }
  });

  // Network operations
  const server = net.createServer();

  server.on("error", (err) => {
    console.log("Server error callback (pending phase):", err.code);
  });

  // Try to listen on an invalid port to trigger error
  server.listen(80, () => {
    console.log("Server listening (unlikely to succeed)");
  });

  // Close server after a delay
  setTimeout(() => {
    server.close(() => {
      console.log("Server closed callback");
    });
  }, 100);
}

// Demonstrate TCP connection callbacks
function demonstrateTCPCallbacks() {
  console.log("\n=== TCP CALLBACKS ===");

  const server = net.createServer((socket) => {
    console.log("Client connected (pending callback)");

    socket.on("data", (data) => {
      console.log("Data received (pending callback):", data.toString());
    });

    socket.on("end", () => {
      console.log("Client disconnected (pending callback)");
    });
  });

  server.listen(8080, () => {
    console.log("Server started on port 8080");

    // Create client connection
    const client = net.createConnection(8080, () => {
      console.log("Client connected to server");
      client.write("Hello Server");
      client.end();
    });

    client.on("error", (err) => {
      console.log("Client error:", err.message);
    });

    // Close server after demonstration
    setTimeout(() => {
      server.close();
    }, 200);
  });
}

// Error handling in pending callbacks
function demonstratePendingErrors() {
  console.log("\n=== PENDING CALLBACK ERRORS ===");

  // DNS lookup that will fail
  const dns = require("dns");

  dns.lookup("nonexistent.invalid.domain", (err, address) => {
    if (err) {
      console.log("DNS lookup error (pending phase):", err.code);
    } else {
      console.log("DNS lookup success:", address);
    }
  });

  // File operation on non-existent file
  fs.readFile("./nonexistent.txt", (err, data) => {
    if (err) {
      console.log("File read error (pending phase):", err.code);
    }
  });
}

// Uncomment to run demonstrations
// demonstratePendingCallbacks();
// demonstrateTCPCallbacks();
// demonstratePendingErrors();
```

### Phase 3: Idle, Prepare Phase

This phase is used internally by libuv. It's not directly relevant to application developers.

```javascript
// This phase is internal to libuv and not directly accessible
// It's used for internal housekeeping operations
console.log("=== IDLE/PREPARE PHASE ===");
console.log("This phase is internal to libuv - no user callbacks executed");
```

### Phase 4: Poll Phase

The poll phase is the most important phase. It fetches new I/O events and executes I/O-related callbacks.

```javascript
console.log("=== POLL PHASE DEMONSTRATION ===");

const fs = require("fs");
const http = require("http");
const crypto = require("crypto");

function demonstratePollPhase() {
  console.log("Demonstrating poll phase behavior...");

  const startTime = Date.now();

  // File system operations (handled in poll phase)
  fs.readFile(__filename, "utf8", (err, data) => {
    const elapsed = Date.now() - startTime;
    console.log(`File read completed after ${elapsed}ms (poll phase)`);
    console.log(`File size: ${data.length} characters`);
  });

  // HTTP request (handled in poll phase)
  const req = http.get("http://www.google.com", (res) => {
    const elapsed = Date.now() - startTime;
    console.log(`HTTP response received after ${elapsed}ms (poll phase)`);
    console.log(`Status: ${res.statusCode}`);

    res.on("data", (chunk) => {
      console.log(`Received ${chunk.length} bytes (poll phase)`);
    });

    res.on("end", () => {
      console.log("HTTP response completed (poll phase)");
    });
  });

  req.on("error", (err) => {
    console.log("HTTP request error (poll phase):", err.message);
  });

  // Crypto operation (CPU-intensive, but I/O for thread pool)
  crypto.pbkdf2("password", "salt", 100000, 64, "sha512", (err, derivedKey) => {
    if (err) {
      console.log("Crypto error (poll phase):", err.message);
    } else {
      const elapsed = Date.now() - startTime;
      console.log(`Crypto operation completed after ${elapsed}ms (poll phase)`);
      console.log(`Derived key length: ${derivedKey.length} bytes`);
    }
  });
}

// Poll phase blocking behavior
function demonstratePollBlocking() {
  console.log("\n=== POLL PHASE BLOCKING ===");

  // When poll queue is empty and no timers are scheduled,
  // the event loop will wait (block) in the poll phase

  console.log("Starting I/O operations...");

  // Schedule multiple I/O operations
  const operations = [];

  for (let i = 0; i < 3; i++) {
    operations.push(
      new Promise((resolve) => {
        fs.readFile(__filename, (err, data) => {
          console.log(`I/O operation ${i + 1} completed`);
          resolve();
        });
      })
    );
  }

  Promise.all(operations).then(() => {
    console.log("All I/O operations completed");
  });

  // This timer will cause the poll phase to exit after 100ms
  setTimeout(() => {
    console.log("Timer fired - poll phase will exit");
  }, 100);
}

// Poll phase with immediate callbacks
function demonstratePollImmediate() {
  console.log("\n=== POLL PHASE WITH SETIMMEDIATE ===");

  // setImmediate callbacks are executed after the poll phase
  setImmediate(() => {
    console.log("setImmediate 1 (after poll phase)");
  });

  // I/O operation
  fs.readFile(__filename, () => {
    console.log("File read completed (poll phase)");

    // This setImmediate will be executed in the next iteration
    setImmediate(() => {
      console.log("setImmediate inside I/O callback");
    });

    // This timer might be executed in the current iteration or next
    setTimeout(() => {
      console.log("setTimeout inside I/O callback");
    }, 0);
  });

  setImmediate(() => {
    console.log("setImmediate 2 (after poll phase)");
  });
}

// Uncomment to run demonstrations
// demonstratePollPhase();
// demonstratePollBlocking();
// demonstratePollImmediate();
```

### Phase 5: Check Phase

The check phase executes `setImmediate()` callbacks.

```javascript
console.log("=== CHECK PHASE DEMONSTRATION ===");

function demonstrateCheckPhase() {
  console.log("Demonstrating check phase (setImmediate)...");

  // setImmediate callbacks are executed in the check phase
  setImmediate(() => {
    console.log("setImmediate 1 - executed in check phase");
  });

  setImmediate(() => {
    console.log("setImmediate 2 - executed in check phase");

    // Nested setImmediate
    setImmediate(() => {
      console.log("Nested setImmediate - next iteration check phase");
    });
  });

  setImmediate(() => {
    console.log("setImmediate 3 - executed in check phase");
  });

  // Multiple setImmediate calls are executed in order within the same phase
  for (let i = 0; i < 5; i++) {
    setImmediate(() => {
      console.log(`setImmediate ${i + 4} - check phase`);
    });
  }
}

// setImmediate vs setTimeout timing
function demonstrateImmediateVsTimeout() {
  console.log("\n=== SETIMMEDIATE VS SETTIMEOUT ===");

  // Outside I/O context - order is unpredictable
  setTimeout(() => {
    console.log("setTimeout 0ms (outside I/O)");
  }, 0);

  setImmediate(() => {
    console.log("setImmediate (outside I/O)");
  });

  // Inside I/O context - setImmediate always runs first
  const fs = require("fs");
  fs.readFile(__filename, () => {
    setTimeout(() => {
      console.log("setTimeout 0ms (inside I/O callback)");
    }, 0);

    setImmediate(() => {
      console.log("setImmediate (inside I/O callback) - runs first!");
    });
  });
}

// setImmediate with arguments and error handling
function demonstrateImmediateAdvanced() {
  console.log("\n=== ADVANCED SETIMMEDIATE ===");

  // setImmediate with arguments
  setImmediate(
    (arg1, arg2, arg3) => {
      console.log("setImmediate with arguments:", arg1, arg2, arg3);
    },
    "hello",
    "world",
    123
  );

  // setImmediate with error handling
  setImmediate(() => {
    try {
      throw new Error("Test error in setImmediate");
    } catch (error) {
      console.log("Error caught in setImmediate:", error.message);
    }
  });

  // Clearing setImmediate
  const immediateId = setImmediate(() => {
    console.log("This should not execute - cleared");
  });

  clearImmediate(immediateId);

  setImmediate(() => {
    console.log("This executes - not cleared");
  });
}

// setImmediate performance characteristics
function demonstrateImmediatePerformance() {
  console.log("\n=== SETIMMEDIATE PERFORMANCE ===");

  const start = process.hrtime.bigint();

  // Queue many setImmediate callbacks
  for (let i = 0; i < 1000; i++) {
    setImmediate(() => {
      if (i === 999) {
        const elapsed = Number(process.hrtime.bigint() - start) / 1000000;
        console.log(
          `1000 setImmediate callbacks executed in ${elapsed.toFixed(2)}ms`
        );
      }
    });
  }

  // Compare with setTimeout
  const start2 = process.hrtime.bigint();
  let count = 0;

  function scheduleTimeout() {
    setTimeout(() => {
      count++;
      if (count < 1000) {
        scheduleTimeout();
      } else {
        const elapsed = Number(process.hrtime.bigint() - start2) / 1000000;
        console.log(
          `1000 setTimeout callbacks executed in ${elapsed.toFixed(2)}ms`
        );
      }
    }, 0);
  }

  scheduleTimeout();
}

// Uncomment to run demonstrations
// demonstrateCheckPhase();
// demonstrateImmediateVsTimeout();
// demonstrateImmediateAdvanced();
// demonstrateImmediatePerformance();
```

### Phase 6: Close Callbacks Phase

This phase executes callbacks for close events.

```javascript
console.log("=== CLOSE CALLBACKS PHASE ===");

const fs = require("fs");
const net = require("net");
const { EventEmitter } = require("events");

function demonstrateClosePhase() {
  console.log("Demonstrating close callbacks phase...");

  // File stream close event
  const readStream = fs.createReadStream(__filename);

  readStream.on("close", () => {
    console.log("File stream closed (close phase)");
  });

  readStream.on("data", (chunk) => {
    console.log(`Read ${chunk.length} bytes`);
    // Force close the stream
    readStream.close();
  });

  readStream.on("error", (err) => {
    console.log("Stream error:", err.message);
  });
}

// TCP socket close events
function demonstrateTCPClose() {
  console.log("\n=== TCP SOCKET CLOSE ===");

  const server = net.createServer((socket) => {
    console.log("Client connected");

    socket.on("close", (hadError) => {
      console.log(`Socket closed (close phase), had error: ${hadError}`);
    });

    socket.on("end", () => {
      console.log("Socket ended");
    });

    // Echo server
    socket.on("data", (data) => {
      socket.write(data);
    });
  });

  server.listen(8081, () => {
    console.log("Server listening on port 8081");

    // Create client
    const client = net.createConnection(8081, () => {
      console.log("Client connected");
      client.write("Hello");

      // Close connection after a delay
      setTimeout(() => {
        client.end();
      }, 100);
    });

    client.on("close", (hadError) => {
      console.log(`Client closed (close phase), had error: ${hadError}`);

      // Close server
      server.close(() => {
        console.log("Server closed (close phase)");
      });
    });

    client.on("error", (err) => {
      console.log("Client error:", err.message);
    });
  });

  server.on("error", (err) => {
    console.log("Server error:", err.message);
  });
}

// Custom EventEmitter close events
function demonstrateCustomClose() {
  console.log("\n=== CUSTOM CLOSE EVENTS ===");

  class CustomResource extends EventEmitter {
    constructor(name) {
      super();
      this.name = name;
      this.isOpen = true;

      // Simulate resource cleanup
      this.cleanup = setTimeout(() => {
        this.close();
      }, 200);
    }

    close() {
      if (!this.isOpen) return;

      console.log(`Closing resource: ${this.name}`);
      this.isOpen = false;

      clearTimeout(this.cleanup);

      // Emit close event - will be handled in close phase
      this.emit("close");
    }

    destroy() {
      this.close();
      this.removeAllListeners();
    }
  }

  const resource1 = new CustomResource("Resource1");
  const resource2 = new CustomResource("Resource2");

  resource1.on("close", () => {
    console.log("Resource1 close event (close phase)");
  });

  resource2.on("close", () => {
    console.log("Resource2 close event (close phase)");
  });

  // Manually close one resource
  setTimeout(() => {
    resource1.close();
  }, 100);

  // Clean up after demonstration
  setTimeout(() => {
    resource2.destroy();
  }, 300);
}

// Close events with error handling
function demonstrateCloseWithErrors() {
  console.log("\n=== CLOSE EVENTS WITH ERRORS ===");

  const writeStream = fs.createWriteStream("/invalid/path/file.txt");

  writeStream.on("error", (err) => {
    console.log("Write stream error:", err.code);
    writeStream.destroy(); // Force close
  });

  writeStream.on("close", () => {
    console.log("Write stream closed after error (close phase)");
  });

  writeStream.write("This will fail");
}

// Uncomment to run demonstrations
// demonstrateClosePhase();
// demonstrateTCPClose();
// demonstrateCustomClose();
// demonstrateCloseWithErrors();
```

## Special Queues: process.nextTick() and Microtasks

These are not phases but special queues that are processed between each phase.

```javascript
console.log("=== SPECIAL QUEUES DEMONSTRATION ===");

function demonstrateNextTickQueue() {
  console.log("Demonstrating process.nextTick() queue...");

  // nextTick has highest priority
  process.nextTick(() => {
    console.log("nextTick 1 - highest priority");
  });

  // Promise microtasks
  Promise.resolve().then(() => {
    console.log("Promise microtask 1");
  });

  // More nextTicks
  process.nextTick(() => {
    console.log("nextTick 2 - still highest priority");

    // Nested nextTick
    process.nextTick(() => {
      console.log("Nested nextTick - same queue");
    });
  });

  // More Promise microtasks
  Promise.resolve().then(() => {
    console.log("Promise microtask 2");
  });

  // setTimeout (will run after all nextTicks and microtasks)
  setTimeout(() => {
    console.log("setTimeout - runs after nextTicks and microtasks");
  }, 0);

  console.log("Synchronous code - runs first");
}

// Demonstrate queue processing order
function demonstrateQueueOrder() {
  console.log("\n=== QUEUE PROCESSING ORDER ===");

  setTimeout(() => console.log("Timer 1"), 0);

  process.nextTick(() => {
    console.log("NextTick 1");
    process.nextTick(() => console.log("NextTick 1.1"));
  });

  Promise.resolve()
    .then(() => {
      console.log("Promise 1");
      return Promise.resolve();
    })
    .then(() => {
      console.log("Promise 1.1");
    });

  setImmediate(() => console.log("Immediate 1"));

  process.nextTick(() => console.log("NextTick 2"));

  Promise.resolve().then(() => console.log("Promise 2"));

  setTimeout(() => console.log("Timer 2"), 0);

  console.log("Sync 1");
}

// Demonstrate nextTick recursion danger
function demonstrateNextTickRecursion() {
  console.log("\n=== NEXTTICK RECURSION WARNING ===");

  let count = 0;
  const maxCount = 10;

  function recursiveNextTick() {
    if (count < maxCount) {
      count++;
      console.log(`NextTick recursion ${count}`);
      process.nextTick(recursiveNextTick);
    } else {
      console.log(
        "NextTick recursion stopped - would starve event loop if continued"
      );
    }
  }

  recursiveNextTick();

  // This timer might be delayed due to nextTick recursion
  setTimeout(() => {
    console.log("Timer finally executed");
  }, 0);
}

// Microtask queue with different types
function demonstrateMicrotaskQueue() {
  console.log("\n=== MICROTASK QUEUE ===");

  // Promise then
  Promise.resolve("resolved").then((value) => {
    console.log("Promise.resolve().then():", value);
  });

  // Promise catch
  Promise.reject("rejected").catch((error) => {
    console.log("Promise.reject().catch():", error);
  });

  // queueMicrotask
  queueMicrotask(() => {
    console.log("queueMicrotask()");
  });

  // async/await creates microtasks
  (async () => {
    console.log("async function start");
    await Promise.resolve();
    console.log("after await - microtask");
  })();

  // nextTick still has higher priority
  process.nextTick(() => {
    console.log("nextTick - higher than microtasks");
  });

  console.log("Synchronous code");
}

// Performance implications of special queues
function demonstrateQueuePerformance() {
  console.log("\n=== QUEUE PERFORMANCE ===");

  const start = process.hrtime.bigint();

  // Queue many nextTicks
  for (let i = 0; i < 1000; i++) {
    process.nextTick(() => {
      if (i === 999) {
        const elapsed = Number(process.hrtime.bigint() - start) / 1000000;
        console.log(`1000 nextTicks processed in ${elapsed.toFixed(2)}ms`);
      }
    });
  }

  // Queue many microtasks
  const start2 = process.hrtime.bigint();
  for (let i = 0; i < 1000; i++) {
    Promise.resolve().then(() => {
      if (i === 999) {
        const elapsed = Number(process.hrtime.bigint() - start2) / 1000000;
        console.log(`1000 microtasks processed in ${elapsed.toFixed(2)}ms`);
      }
    });
  }
}

// Uncomment to run demonstrations
// demonstrateNextTickQueue();
// demonstrateQueueOrder();
// demonstrateNextTickRecursion();
// demonstrateMicrotaskQueue();
// demonstrateQueuePerformance();
```

## Complete Event Loop Flow Example

```javascript
console.log("=== COMPLETE EVENT LOOP FLOW ===");

function demonstrateCompleteFlow() {
  console.log("=== Event Loop Complete Flow Demo ===");
  console.log("1. Synchronous code starts");

  // Timers phase
  setTimeout(() => {
    console.log("5. TIMERS: setTimeout 0ms");
  }, 0);

  setTimeout(() => {
    console.log("6. TIMERS: setTimeout 1ms");
  }, 1);

  // Immediate (Check phase)
  setImmediate(() => {
    console.log("7. CHECK: setImmediate");
  });

  // I/O operation (Poll phase)
  const fs = require("fs");
  fs.readFile(__filename, () => {
    console.log("8. POLL: File read completed");

    // These will be in next iteration
    setTimeout(() => {
      console.log("11. TIMERS (next iteration): setTimeout in I/O");
    }, 0);

    setImmediate(() => {
      console.log("9. CHECK (current iteration): setImmediate in I/O");
    });

    process.nextTick(() => {
      console.log("10. NEXTTICK: process.nextTick in I/O");
    });
  });

  // NextTick (highest priority)
  process.nextTick(() => {
    console.log("3. NEXTTICK: process.nextTick 1");
    process.nextTick(() => {
      console.log("3.1. NEXTTICK: nested nextTick");
    });
  });

  // Microtasks
  Promise.resolve().then(() => {
    console.log("4. MICROTASK: Promise.resolve()");
  });

  process.nextTick(() => {
    console.log("3.2. NEXTTICK: process.nextTick 2");
  });

  console.log("2. Synchronous code ends");
}

// Event loop phases visualization
function visualizeEventLoopPhases() {
  console.log("\n=== EVENT LOOP PHASES VISUALIZATION ===");

  let phaseCounter = 1;

  // Helper function to show phase
  function showPhase(phase, operation) {
    console.log(`Phase ${phaseCounter++}: ${phase} - ${operation}`);
  }

  console.log("Starting event loop iteration...");

  // Schedule operations in different phases
  setTimeout(() => {
    showPhase("TIMERS", "setTimeout callback executed");
  }, 0);

  process.nextTick(() => {
    showPhase("NEXTTICK (between phases)", "process.nextTick executed");
  });

  const fs = require("fs");
  fs.stat(__filename, (err, stats) => {
    if (err) {
      showPhase("POLL", "fs.stat error callback");
    } else {
      showPhase("POLL", "fs.stat success callback");
    }
  });

  setImmediate(() => {
    showPhase("CHECK", "setImmediate callback executed");
  });

  const net = require("net");
  const server = net.createServer();
  server.listen(0, () => {
    showPhase("POLL", "server listen callback");
    server.close(() => {
      showPhase("CLOSE", "server close callback");
    });
  });

  Promise.resolve().then(() => {
    showPhase("MICROTASK (between phases)", "Promise microtask executed");
  });
}

// Event loop timing and performance
function demonstrateEventLoopTiming() {
  console.log("\n=== EVENT LOOP TIMING ===");

  const start = process.hrtime.bigint();
  const startTime = Date.now();

  let operations = {
    timers: 0,
    immediate: 0,
    io: 0,
    nextTick: 0,
    microtasks: 0,
  };

  // Track operation timing
  setTimeout(() => {
    operations.timers++;
    console.log(`Timer executed at: ${Date.now() - startTime}ms`);
  }, 10);

  setImmediate(() => {
    operations.immediate++;
    console.log(`Immediate executed at: ${Date.now() - startTime}ms`);
  });

  process.nextTick(() => {
    operations.nextTick++;
    console.log(`NextTick executed at: ${Date.now() - startTime}ms`);
  });

  Promise.resolve().then(() => {
    operations.microtasks++;
    console.log(`Microtask executed at: ${Date.now() - startTime}ms`);
  });

  fs.readFile(__filename, () => {
    operations.io++;
    console.log(`I/O completed at: ${Date.now() - startTime}ms`);

    // Report final statistics
    setTimeout(() => {
      const totalTime = Number(process.hrtime.bigint() - start) / 1000000;
      console.log("\nOperation counts:", operations);
      console.log(`Total execution time: ${totalTime.toFixed(2)}ms`);
    }, 50);
  });
}

// Uncomment to run demonstrations
// demonstrateCompleteFlow();
// visualizeEventLoopPhases();
// demonstrateEventLoopTiming();
```

## Event Loop Best Practices and Common Pitfalls

```javascript
console.log("=== EVENT LOOP BEST PRACTICES ===");

// ❌ BAD: Blocking the event loop
function blockingOperation() {
  console.log("❌ BAD: Blocking operation started");
  const start = Date.now();

  // This blocks the event loop for ~2 seconds
  while (Date.now() - start < 2000) {
    // Busy waiting - blocks everything
  }

  console.log("❌ Blocking operation ended");
}

// ✅ GOOD: Non-blocking operation
function nonBlockingOperation(callback) {
  console.log("✅ GOOD: Non-blocking operation started");

  // Use setImmediate to yield control back to event loop
  setImmediate(() => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    console.log("✅ Non-blocking operation completed");
    if (callback) callback(null, sum);
  });
}

// ❌ BAD: nextTick recursion
function badNextTickRecursion() {
  console.log("❌ BAD: Infinite nextTick recursion");

  process.nextTick(() => {
    console.log("This will starve the event loop");
    badNextTickRecursion(); // This will prevent other callbacks from executing
  });
}

// ✅ GOOD: Using setImmediate for recursion
function goodRecursion(count = 0) {
  if (count < 5) {
    console.log(`✅ GOOD: Recursive operation ${count}`);
    setImmediate(() => goodRecursion(count + 1));
  } else {
    console.log("✅ Recursion completed without blocking");
  }
}

// CPU-intensive task handling
function demonstrateCPUIntensiveHandling() {
  console.log("\n=== CPU-INTENSIVE TASK HANDLING ===");

  // ❌ BAD: All at once
  function badCPUTask() {
    console.log("❌ BAD: Processing large array at once");
    const largeArray = new Array(10000000).fill(0).map((_, i) => i);

    const start = Date.now();
    let sum = 0;
    for (let num of largeArray) {
      sum += num * num;
    }
    console.log(`❌ Completed in ${Date.now() - start}ms (blocked event loop)`);
  }

  // ✅ GOOD: Chunked processing
  function goodCPUTask() {
    console.log("✅ GOOD: Processing large array in chunks");
    const largeArray = new Array(10000000).fill(0).map((_, i) => i);
    const chunkSize = 100000;
    let index = 0;
    let sum = 0;
    const start = Date.now();

    function processChunk() {
      const end = Math.min(index + chunkSize, largeArray.length);

      for (let i = index; i < end; i++) {
        sum += largeArray[i] * largeArray[i];
      }

      index = end;

      if (index < largeArray.length) {
        // Yield control back to event loop
        setImmediate(processChunk);
      } else {
        console.log(`✅ Completed in ${Date.now() - start}ms (non-blocking)`);
      }
    }

    processChunk();
  }

  // Run good example (bad example is commented to prevent blocking)
  // badCPUTask();
  goodCPUTask();
}

// Memory management in event loop
function demonstrateMemoryManagement() {
  console.log("\n=== MEMORY MANAGEMENT ===");

  // ❌ BAD: Memory leak with unclosed resources
  function memoryLeakExample() {
    console.log("❌ BAD: Creating memory leak");

    const intervals = [];

    for (let i = 0; i < 100; i++) {
      const intervalId = setInterval(() => {
        console.log(`Interval ${i} running`);
      }, 1000);

      // Not storing references properly leads to memory leaks
      intervals.push(intervalId);
    }

    // Forgot to clear intervals - memory leak!
  }

  // ✅ GOOD: Proper resource cleanup
  function properResourceManagement() {
    console.log("✅ GOOD: Proper resource management");

    const intervals = new Set();

    for (let i = 0; i < 5; i++) {
      const intervalId = setInterval(() => {
        console.log(`Managed interval ${i}`);
      }, 1000);

      intervals.add(intervalId);
    }

    // Cleanup after demonstration
    setTimeout(() => {
      console.log("✅ Cleaning up resources");
      intervals.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      intervals.clear();
    }, 5000);
  }

  properResourceManagement();
}

// Error handling in different phases
function demonstrateErrorHandling() {
  console.log("\n=== ERROR HANDLING IN EVENT LOOP ===");

  // Error in timer phase
  setTimeout(() => {
    try {
      throw new Error("Timer phase error");
    } catch (error) {
      console.log("✅ Timer error caught:", error.message);
    }
  }, 10);

  // Error in immediate phase
  setImmediate(() => {
    try {
      throw new Error("Immediate phase error");
    } catch (error) {
      console.log("✅ Immediate error caught:", error.message);
    }
  });

  // Error in I/O phase
  const fs = require("fs");
  fs.readFile("/nonexistent/file.txt", (err, data) => {
    if (err) {
      console.log("✅ I/O error handled:", err.code);
    }
  });

  // Uncaught exception handling
  process.on("uncaughtException", (error) => {
    console.log("❌ Uncaught exception:", error.message);
    // In production, you should exit the process
    // process.exit(1);
  });

  // Unhandled promise rejection
  process.on("unhandledRejection", (reason, promise) => {
    console.log("❌ Unhandled rejection:", reason);
  });

  // Trigger unhandled rejection for demonstration
  Promise.reject(new Error("Unhandled promise rejection"));
}

// Performance monitoring
function demonstratePerformanceMonitoring() {
  console.log("\n=== PERFORMANCE MONITORING ===");

  // Monitor event loop lag
  function measureEventLoopLag() {
    const start = process.hrtime.bigint();

    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000;
      console.log(`Event loop lag: ${lag.toFixed(2)}ms`);

      // Continue monitoring
      setTimeout(measureEventLoopLag, 1000);
    });
  }

  measureEventLoopLag();

  // Monitor active handles and requests
  function monitorActiveHandles() {
    console.log("Active handles:", process._getActiveHandles().length);
    console.log("Active requests:", process._getActiveRequests().length);

    setTimeout(monitorActiveHandles, 2000);
  }

  monitorActiveHandles();
}

// Uncomment to run demonstrations
// demonstrateCPUIntensiveHandling();
// demonstrateMemoryManagement();
// demonstrateErrorHandling();
// demonstratePerformanceMonitoring();
```

## Event Loop Debugging and Profiling

```javascript
console.log("=== EVENT LOOP DEBUGGING ===");

function debugEventLoop() {
  console.log("Event loop debugging techniques...");

  // 1. Using async_hooks for detailed tracing
  const async_hooks = require("async_hooks");

  const hook = async_hooks.createHook({
    init(asyncId, type, triggerAsyncId) {
      console.log(
        `ASYNC INIT: ${type} (${asyncId}) triggered by ${triggerAsyncId}`
      );
    },
    before(asyncId) {
      console.log(`ASYNC BEFORE: ${asyncId}`);
    },
    after(asyncId) {
      console.log(`ASYNC AFTER: ${asyncId}`);
    },
    destroy(asyncId) {
      console.log(`ASYNC DESTROY: ${asyncId}`);
    },
  });

  // Enable for demonstration (disable in production due to overhead)
  // hook.enable();

  // 2. Manual timing measurements
  function timePhase(phaseName, operation) {
    const start = process.hrtime.bigint();

    operation(() => {
      const elapsed = Number(process.hrtime.bigint() - start) / 1000000;
      console.log(`${phaseName} took: ${elapsed.toFixed(2)}ms`);
    });
  }

  timePhase("Timer Phase", (done) => {
    setTimeout(done, 10);
  });

  timePhase("Immediate Phase", (done) => {
    setImmediate(done);
  });

  timePhase("I/O Phase", (done) => {
    const fs = require("fs");
    fs.readFile(__filename, done);
  });

  // 3. Event loop utilization
  const { performance, PerformanceObserver } = require("perf_hooks");

  const obs = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log(
        `Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`
      );
    });
  });

  obs.observe({ entryTypes: ["measure"] });

  performance.mark("operation-start");

  setTimeout(() => {
    performance.mark("operation-end");
    performance.measure(
      "Operation Duration",
      "operation-start",
      "operation-end"
    );
  }, 100);
}

// Uncomment to run debugging
// debugEventLoop();
```

## Summary

### Event Loop Phases Summary:

1. **Timers Phase**: Execute `setTimeout()` and `setInterval()` callbacks
2. **Pending Callbacks Phase**: Execute I/O callbacks deferred from previous iteration
3. **Idle, Prepare Phase**: Internal use only
4. **Poll Phase**: Fetch new I/O events; execute I/O callbacks (most important phase)
5. **Check Phase**: Execute `setImmediate()` callbacks
6. **Close Callbacks Phase**: Execute close event callbacks

### Special Queues (Processed Between Phases):

- **process.nextTick() Queue**: Highest priority, processed before microtasks
- **Microtask Queue**: Promise callbacks, processed after nextTick queue

### Key Takeaways:

1. **Understanding is Critical**: Event loop knowledge is essential for Node.js performance
2. **Non-blocking is Key**: Never block the main thread with synchronous operations
3. **Queue Priorities**: nextTick > microtasks > phase-specific callbacks
4. **I/O Operations**: Handled efficiently in the poll phase
5. **Timer Precision**: Minimum ~1ms delay for setTimeout
6. **setImmediate vs setTimeout**: setImmediate runs first inside I/O callbacks
7. **Error Handling**: Different phases require different error handling strategies
8. **Performance**: Monitor event loop lag and active handles for optimization

This comprehensive understanding enables you to write efficient, scalable Node.js applications that properly leverage the event loop's asynchronous capabilities.
