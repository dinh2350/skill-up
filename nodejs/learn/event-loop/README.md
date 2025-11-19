# Node.js Event Loop - Deep Dive

## What is the Event Loop?

The **Event Loop** is the heart of Node.js that enables non-blocking I/O operations despite JavaScript being single-threaded. It's a mechanism that continuously checks for and executes tasks from various queues.

### Key Concept

```
JavaScript is single-threaded → Only one call stack
But Node.js handles thousands of concurrent operations → Event Loop + libuv
```

## Event Loop Architecture

```
┌───────────────────────────┐
│           Timers          │  setTimeout, setInterval callbacks
├───────────────────────────┤
│     Pending Callbacks     │  I/O callbacks deferred to next loop iteration
├───────────────────────────┤
│       Idle, Prepare       │  Internal use only
├───────────────────────────┤
│           Poll            │  Retrieve new I/O events; execute I/O callbacks
├───────────────────────────┤
│          Check            │  setImmediate() callbacks
├───────────────────────────┤
│      Close Callbacks      │  socket.on('close', ...)
└───────────────────────────┘

Special Queues (Microtasks - executed between phases):
- process.nextTick() queue
- Promise callbacks (then, catch, finally)
```

## The Six Phases in Detail

### 1. **Timers Phase**
Executes callbacks scheduled by `setTimeout()` and `setInterval()`.

**Important:** The timer specifies the *threshold* after which the callback *may* be executed, not the *exact* time.

```javascript
setTimeout(() => {
  console.log('Timer callback');
}, 100);
// Will execute AFTER at least 100ms, not exactly at 100ms
```

### 2. **Pending Callbacks Phase**
Executes I/O callbacks deferred to the next loop iteration. Some system operations like TCP errors are queued here.

### 3. **Idle, Prepare Phase**
Used internally by Node.js only.

### 4. **Poll Phase** (Most Important!)
This phase has two main functions:

1. **Calculating how long it should block and poll for I/O**
2. **Processing events in the poll queue**

**Poll phase behavior:**
- If poll queue is **not empty**: Execute callbacks synchronously until queue is empty or system limit reached
- If poll queue is **empty**:
  - If `setImmediate()` callbacks exist → Move to Check phase
  - If no `setImmediate()` → Wait for callbacks to be added, then execute them

### 5. **Check Phase**
Executes `setImmediate()` callbacks. This allows you to execute code immediately after the poll phase completes.

### 6. **Close Callbacks Phase**
Executes close event callbacks like `socket.on('close', ...)`.

## Microtasks (Priority Queue)

Between each phase, Node.js checks for **microtasks**:

### Priority Order:
1. **process.nextTick() queue** (highest priority)
2. **Promise callbacks** (then/catch/finally)

```javascript
// Execution order
setTimeout(() => console.log('1. setTimeout'), 0);
setImmediate(() => console.log('2. setImmediate'));
Promise.resolve().then(() => console.log('3. Promise'));
process.nextTick(() => console.log('4. nextTick'));

// Output:
// 4. nextTick          (microtask - highest priority)
// 3. Promise           (microtask)
// 1. setTimeout        (timer phase)
// 2. setImmediate      (check phase)
```

## process.nextTick() vs setImmediate()

### process.nextTick()
- Fires **immediately** after current operation completes
- Executes **before** any I/O events or timers
- Can cause **I/O starvation** if used recursively

```javascript
function recursive() {
  process.nextTick(recursive);
  // This will block the event loop!
}
```

### setImmediate()
- Fires in the **check phase** of the event loop
- Executes **after** I/O events
- Safer for recursive operations

```javascript
function recursive() {
  setImmediate(recursive);
  // This allows other operations to run
}
```

## setTimeout() vs setImmediate()

The execution order depends on the **context**:

### Outside I/O Cycle (Non-deterministic):
```javascript
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// Order may vary: depends on system performance
```

### Inside I/O Cycle (Deterministic):
```javascript
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// Output is always:
// immediate (check phase)
// timeout (next loop's timer phase)
```

## Event Loop Execution Flow

```javascript
console.log('1. Start');

setTimeout(() => console.log('2. setTimeout 0'), 0);
setTimeout(() => console.log('3. setTimeout 10'), 10);

setImmediate(() => console.log('4. setImmediate'));

Promise.resolve().then(() => console.log('5. Promise 1'));
Promise.resolve().then(() => {
  console.log('6. Promise 2');
  process.nextTick(() => console.log('7. nextTick inside Promise'));
});

process.nextTick(() => console.log('8. nextTick 1'));
process.nextTick(() => {
  console.log('9. nextTick 2');
  Promise.resolve().then(() => console.log('10. Promise inside nextTick'));
});

console.log('11. End');

// Output:
// 1. Start
// 11. End
// 8. nextTick 1
// 9. nextTick 2
// 5. Promise 1
// 6. Promise 2
// 10. Promise inside nextTick
// 7. nextTick inside Promise
// 2. setTimeout 0
// 4. setImmediate
// 3. setTimeout 10
```

## Common Misconceptions

### ❌ Myth 1: "setTimeout(fn, 0) executes immediately"
**Reality:** It's queued in the timers phase and executes in the next loop iteration.

### ❌ Myth 2: "Promises are synchronous"
**Reality:** Promise callbacks are microtasks and execute asynchronously.

### ❌ Myth 3: "The event loop runs in the background"
**Reality:** The event loop IS the main thread. It's a loop that processes queues.

### ❌ Myth 4: "Node.js is multi-threaded"
**Reality:** JavaScript execution is single-threaded. Only I/O operations use threads (libuv thread pool).

## Blocking vs Non-Blocking

### Blocking Code (BAD):
```javascript
// Blocks event loop for 5 seconds
const start = Date.now();
while (Date.now() - start < 5000) {}
console.log('Done blocking');
// Nothing else can run during this time!
```

### Non-Blocking Code (GOOD):
```javascript
// Doesn't block event loop
setTimeout(() => {
  console.log('Done after 5 seconds');
}, 5000);
// Other operations can run during this time
```

## libuv Thread Pool

Node.js uses **libuv** which maintains a thread pool (default: 4 threads) for:
- File system operations
- DNS lookups
- Some crypto operations
- Compression

```javascript
// These use the thread pool
fs.readFile('file.txt', callback);  // Thread pool
dns.lookup('google.com', callback); // Thread pool
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', callback); // Thread pool

// These don't use thread pool (OS delegates)
net.connect({ port: 80 }, callback);  // OS handles
http.get('http://google.com', callback); // OS handles
```

## Real-World Implications

### 1. **CPU-Intensive Tasks Block Everything**
```javascript
// BAD: Blocks event loop
app.get('/calculate', (req, res) => {
  const result = fibonacci(45); // Takes seconds!
  res.json({ result });
  // All other requests are blocked!
});

// GOOD: Use worker threads or child processes
const { Worker } = require('worker_threads');
app.get('/calculate', (req, res) => {
  const worker = new Worker('./fibonacci-worker.js');
  worker.on('message', (result) => {
    res.json({ result });
  });
});
```

### 2. **process.nextTick() Can Starve I/O**
```javascript
// BAD: Starves I/O
function badRecursive() {
  process.nextTick(badRecursive);
}
badRecursive(); // Event loop never gets to I/O!

// GOOD: Use setImmediate
function goodRecursive() {
  setImmediate(goodRecursive);
}
goodRecursive(); // Allows I/O between iterations
```

### 3. **Understanding Delays**
```javascript
setTimeout(() => {
  console.log('This might be delayed!');
}, 100);

// Heavy computation blocks the timeout
for (let i = 0; i < 1000000000; i++) {}
// Timeout callback won't run until this finishes!
```

## Performance Tips

1. ✅ **Use asynchronous operations**
   ```javascript
   // Use fs.readFile() not fs.readFileSync()
   ```

2. ✅ **Batch CPU-intensive work**
   ```javascript
   // Process in chunks with setImmediate
   function processLargeArray(array, index = 0) {
     const chunkSize = 1000;
     const chunk = array.slice(index, index + chunkSize);
     
     // Process chunk...
     
     if (index + chunkSize < array.length) {
       setImmediate(() => processLargeArray(array, index + chunkSize));
     }
   }
   ```

3. ✅ **Avoid synchronous operations in production**
   ```javascript
   // BAD
   const data = fs.readFileSync('file.txt');
   
   // GOOD
   fs.readFile('file.txt', (err, data) => {
     // Handle data
   });
   ```

4. ✅ **Use worker threads for CPU-bound tasks**

5. ✅ **Monitor event loop lag**
   ```javascript
   const start = process.hrtime();
   setImmediate(() => {
     const delta = process.hrtime(start);
     const lag = delta[0] * 1000 + delta[1] / 1000000;
     if (lag > 100) {
       console.warn('Event loop lag:', lag, 'ms');
     }
   });
   ```

## Debugging Event Loop Issues

### Tools:
- **`node --trace-warnings`** - Show stack traces for warnings
- **`clinic.js`** - Performance profiling
- **`0x`** - Flamegraph generation
- **`why-is-node-running`** - Find what keeps Node running

### Common Issues:
1. **Event loop blocked** → CPU-intensive code
2. **Memory leaks** → Event listeners not removed
3. **High latency** → Too many synchronous operations
4. **Process won't exit** → Active timers or handles

## Summary

- Event loop has **6 phases** + microtask queues
- **Microtasks** (nextTick, Promises) run between phases
- **process.nextTick() > Promises > setTimeout > setImmediate**
- **Never block the event loop** with CPU-intensive work
- **Use async operations** to keep the loop spinning
- **Understand the difference** between timers and immediate
- **Monitor performance** in production

## Further Reading

- [Node.js Event Loop Official Docs](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [libuv Design Overview](http://docs.libuv.org/en/v1.x/design.html)
- [Understanding the Node.js Event Loop](https://blog.logrocket.com/a-complete-guide-to-the-node-js-event-loop/)
