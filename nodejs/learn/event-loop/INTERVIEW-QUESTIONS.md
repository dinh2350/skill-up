# Node.js Event Loop - Interview Questions & Answers

## Table of Contents
- [Junior Level Questions](#junior-level-questions)
- [Mid-Level Questions](#mid-level-questions)
- [Senior Level Questions](#senior-level-questions)
- [Scenario-Based Questions](#scenario-based-questions)

---

## Junior Level Questions

### Q1: What is the Event Loop in Node.js?

**Answer:**
The Event Loop is the mechanism that allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded. It continuously monitors the call stack and callback queues, executing callbacks when the call stack is empty.

**Key Points:**
- Single-threaded execution model
- Handles asynchronous operations
- Delegates I/O operations to the system kernel or thread pool
- Processes callbacks from various queues

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
console.log('3');

// Output: 1, 3, 2
// Explanation: setTimeout callback goes to event loop queue
```

---

### Q2: What are the main phases of the Event Loop?

**Answer:**
The Event Loop has 6 phases:

1. **Timers** - Executes `setTimeout` and `setInterval` callbacks
2. **Pending Callbacks** - Executes I/O callbacks deferred from previous iteration
3. **Idle, Prepare** - Internal use only
4. **Poll** - Retrieves new I/O events, executes I/O callbacks
5. **Check** - Executes `setImmediate()` callbacks
6. **Close Callbacks** - Executes close event callbacks (e.g., `socket.on('close')`)

```
   ┌───────────────────────────┐
┌─>│           timers          │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘
```

---

### Q3: What is the difference between `setTimeout()` and `setImmediate()`?

**Answer:**

| setTimeout() | setImmediate() |
|--------------|----------------|
| Executes in **Timers phase** | Executes in **Check phase** |
| Has minimum delay (threshold) | No delay |
| Order is non-deterministic in main module | Always executes after I/O events |

**Example:**
```javascript
// Non-deterministic order (main module)
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// Order may vary!

// Deterministic order (inside I/O)
require('fs').readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// Output: Always immediate, then timeout
```

---

### Q4: What are microtasks in Node.js?

**Answer:**
Microtasks are high-priority tasks that execute **between** Event Loop phases:

**Microtasks (in priority order):**
1. `process.nextTick()` callbacks (highest priority)
2. Promise callbacks (`then`, `catch`, `finally`)

**Macrotasks:**
3. `setTimeout`, `setInterval`
4. `setImmediate`
5. I/O operations

```javascript
setTimeout(() => console.log('1. setTimeout'), 0);
Promise.resolve().then(() => console.log('2. Promise'));
process.nextTick(() => console.log('3. nextTick'));

// Output: 3. nextTick, 2. Promise, 1. setTimeout
```

---

### Q5: When should you use `process.nextTick()`?

**Answer:**
Use `process.nextTick()` when you need to execute a callback **immediately after** the current operation, before any I/O events.

**Use Cases:**
- Deferring execution to allow constructor to complete
- Emitting events after initialization
- Error handling in async APIs

**Warning:** Can starve I/O if used recursively!

```javascript
// ✅ Good use case
function MyEmitter() {
  EventEmitter.call(this);
  
  // Emit after construction completes
  process.nextTick(() => {
    this.emit('ready');
  });
}

// ❌ Bad use case (blocks I/O)
function badRecursive() {
  process.nextTick(badRecursive); // Infinite loop, blocks everything!
}
```

---

## Mid-Level Questions

### Q6: Explain the difference between microtasks and macrotasks with an example.

**Answer:**
**Microtasks** have higher priority and execute completely between Event Loop phases.
**Macrotasks** execute one per Event Loop iteration.

**Key Difference:** ALL microtasks execute before moving to the next macrotask.

```javascript
console.log('1. Start');

setTimeout(() => {
  console.log('5. Macro 1');
  Promise.resolve().then(() => console.log('6. Micro in Macro 1'));
}, 0);

setTimeout(() => {
  console.log('7. Macro 2');
  Promise.resolve().then(() => console.log('8. Micro in Macro 2'));
}, 0);

Promise.resolve().then(() => {
  console.log('3. Micro 1');
});

Promise.resolve().then(() => {
  console.log('4. Micro 2');
});

console.log('2. End');

// Output:
// 1. Start
// 2. End
// 3. Micro 1
// 4. Micro 2
// 5. Macro 1
// 6. Micro in Macro 1
// 7. Macro 2
// 8. Micro in Macro 2
```

---

### Q7: What is blocking code and how does it affect the Event Loop?

**Answer:**
**Blocking code** is synchronous code that prevents the Event Loop from processing other callbacks while executing.

**Impact:**
- No other operations can run
- Server becomes unresponsive
- High latency for all requests

```javascript
// ❌ BLOCKING (BAD)
const fs = require('fs');
const data = fs.readFileSync('huge-file.txt'); // Blocks!
// Nothing else can run until file is read

// ✅ NON-BLOCKING (GOOD)
fs.readFile('huge-file.txt', (err, data) => {
  // Callback executes when ready
});
// Other operations can run immediately
```

**Common Blocking Operations:**
- `fs.readFileSync()`, `fs.writeFileSync()`
- `crypto.pbkdf2Sync()`
- Heavy CPU calculations
- `while(true)` loops
- Large `JSON.parse()` operations

---

### Q8: How does async/await work with the Event Loop?

**Answer:**
`async/await` is syntactic sugar over Promises. The code after `await` is equivalent to a `.then()` callback (microtask).

```javascript
async function example() {
  console.log('1');
  
  await someAsyncOperation(); // Returns a Promise
  
  console.log('3'); // This is like .then() - a microtask
}

// Equivalent to:
function example() {
  console.log('1');
  
  return someAsyncOperation().then(() => {
    console.log('3');
  });
}

console.log('2');
example();

// Output: 1, 2, 3
```

**Execution Flow:**
1. `async function` returns a Promise immediately
2. Code after `await` is scheduled as a microtask
3. Function returns, allowing Event Loop to continue
4. Microtask executes when Promise resolves

---

### Q9: What is the Poll phase and why is it important?

**Answer:**
The **Poll phase** is the most important phase where:
1. It waits for new I/O events
2. Executes I/O-related callbacks
3. Determines when to move to other phases

**Behavior:**
- If poll queue is not empty: Execute callbacks until queue is empty or system limit
- If poll queue is empty:
  - Check for `setImmediate()` → Move to Check phase
  - Check for expired timers → Move to Timers phase
  - Wait for new events if nothing to do

```javascript
const fs = require('fs');

// I/O callback executes in Poll phase
fs.readFile('file.txt', (err, data) => {
  console.log('Poll phase: File read complete');
  
  // Inside Poll phase, setImmediate runs before setTimeout
  setImmediate(() => console.log('Check phase'));
  setTimeout(() => console.log('Next iteration Timers'), 0);
});

// Output:
// Poll phase: File read complete
// Check phase
// Next iteration Timers
```

---

### Q10: How can you detect Event Loop lag/blocking?

**Answer:**
Event Loop lag occurs when operations take too long, delaying callback execution.

**Detection Methods:**

**1. Manual Measurement:**
```javascript
const start = process.hrtime.bigint();
setImmediate(() => {
  const lag = Number(process.hrtime.bigint() - start) / 1000000;
  console.log(`Event loop lag: ${lag.toFixed(2)}ms`);
  
  if (lag > 100) {
    console.warn('High lag detected!');
  }
});
```

**2. Using Monitoring Libraries:**
```javascript
// Using blocked-at package
const blocked = require('blocked-at');

blocked((time, stack) => {
  console.log(`Blocked for ${time}ms`);
  console.log(stack);
}, { threshold: 100 });
```

**3. Production Tools:**
- `clinic.js` - Performance profiling
- `0x` - Flamegraph generation
- `node --prof` - V8 profiler
- APM tools (New Relic, DataDog, etc.)

---

## Senior Level Questions

### Q11: Explain the complete execution flow of this code.

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  process.nextTick(() => console.log('3'));
}, 0);

new Promise((resolve) => {
  console.log('4');
  resolve();
}).then(() => {
  console.log('5');
  setTimeout(() => console.log('6'), 0);
});

process.nextTick(() => console.log('7'));

setTimeout(() => console.log('8'), 0);

console.log('9');
```

**Answer:**

**Step-by-step execution:**

1. **Synchronous code executes first:**
   - `console.log('1')` → Output: **1**
   - `setTimeout` scheduled (Timer 1)
   - Promise constructor executes: `console.log('4')` → Output: **4**
   - Promise `then` scheduled (Microtask 1)
   - `process.nextTick` scheduled (Microtask 0 - highest priority)
   - `setTimeout` scheduled (Timer 2)
   - `console.log('9')` → Output: **9**

2. **Microtasks execute (before any macrotasks):**
   - `process.nextTick` → Output: **7** (highest priority)
   - Promise `then` → Output: **5**, schedules Timer 3

3. **Macrotasks execute (Timers phase):**
   - Timer 1 → Output: **2**, schedules nextTick
   - Microtask (nextTick) → Output: **3** (before next timer!)
   - Timer 2 → Output: **8**
   - Timer 3 → Output: **6**

**Final Output:**
```
1
4
9
7
5
2
3
8
6
```

---

### Q12: How does Node.js handle CPU-intensive tasks without blocking?

**Answer:**
Node.js provides multiple strategies:

**1. Worker Threads (Recommended):**
```javascript
const { Worker } = require('worker_threads');

function fibonacci(n) {
  // CPU-intensive calculation
}

// Run in worker thread
const worker = new Worker('./fib-worker.js', {
  workerData: { n: 45 }
});

worker.on('message', result => {
  console.log('Result:', result);
});

// Main thread remains responsive!
```

**2. Child Processes:**
```javascript
const { fork } = require('child_process');
const worker = fork('./heavy-computation.js');

worker.send({ data: largeDataset });
worker.on('message', result => {
  console.log('Result:', result);
});
```

**3. Break into Chunks:**
```javascript
function processLargeArray(array, index = 0) {
  const chunkSize = 1000;
  const chunk = array.slice(index, index + chunkSize);
  
  // Process chunk...
  
  if (index + chunkSize < array.length) {
    setImmediate(() => processLargeArray(array, index + chunkSize));
  }
}
```

**4. Offload to Services:**
- Use message queues (Redis, RabbitMQ)
- Microservices architecture
- Serverless functions

---

### Q13: What is the libuv thread pool and when is it used?

**Answer:**
**libuv** is the C library that provides the Event Loop implementation. It maintains a **thread pool** (default: 4 threads) for operations that can't be performed asynchronously by the OS.

**Operations using thread pool:**
- File system operations (`fs.*` except watch operations)
- DNS lookups (`dns.lookup()`)
- CPU-intensive crypto operations (`crypto.pbkdf2()`, `crypto.randomBytes()`)
- Compression (`zlib.*`)

**Operations NOT using thread pool:**
- Network I/O (sockets, HTTP) - handled by OS kernel
- Timers - managed by Event Loop
- Child processes

```javascript
const crypto = require('crypto');

// Uses thread pool
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', (err, key) => {
  console.log('Done (thread pool)');
});

// Does NOT use thread pool (OS handles it)
const http = require('http');
http.get('http://example.com', (res) => {
  console.log('Done (OS network stack)');
});
```

**Configuring thread pool size:**
```javascript
// Set before requiring any modules
process.env.UV_THREADPOOL_SIZE = 8;
```

---

### Q14: How would you optimize this code?

```javascript
app.get('/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  
  for (const user of users) {
    user.posts = await db.query('SELECT * FROM posts WHERE user_id = ?', [user.id]);
    user.comments = await db.query('SELECT * FROM comments WHERE user_id = ?', [user.id]);
  }
  
  res.json(users);
});
```

**Answer:**
This code has the **N+1 query problem** and sequential processing. Optimizations:

**Optimized Version:**
```javascript
app.get('/users', async (req, res) => {
  // 1. Get all users
  const users = await db.query('SELECT * FROM users');
  const userIds = users.map(u => u.id);
  
  // 2. Fetch all related data in parallel
  const [postsResult, commentsResult] = await Promise.all([
    db.query('SELECT * FROM posts WHERE user_id IN (?)', [userIds]),
    db.query('SELECT * FROM comments WHERE user_id IN (?)', [userIds])
  ]);
  
  // 3. Map results efficiently
  const postsMap = {};
  const commentsMap = {};
  
  postsResult.forEach(post => {
    if (!postsMap[post.user_id]) postsMap[post.user_id] = [];
    postsMap[post.user_id].push(post);
  });
  
  commentsResult.forEach(comment => {
    if (!commentsMap[comment.user_id]) commentsMap[comment.user_id] = [];
    commentsMap[comment.user_id].push(comment);
  });
  
  // 4. Attach to users (non-blocking)
  users.forEach(user => {
    user.posts = postsMap[user.id] || [];
    user.comments = commentsMap[user.id] || [];
  });
  
  res.json(users);
});
```

**Improvements:**
- Reduced queries from `1 + 2N` to `3`
- Parallel query execution
- Event Loop friendly (no blocking)

---

### Q15: Design a rate limiter using Event Loop concepts.

**Answer:**
```javascript
class TokenBucketRateLimiter {
  constructor(maxTokens, refillRate, refillInterval) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;
    this.queue = [];
    
    // Refill tokens using Event Loop
    setInterval(() => this.refillTokens(), this.refillInterval);
  }
  
  refillTokens() {
    this.tokens = Math.min(this.maxTokens, this.tokens + this.refillRate);
    this.processQueue();
  }
  
  async execute(fn) {
    if (this.tokens > 0) {
      this.tokens--;
      return await fn();
    }
    
    // Queue request
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
    });
  }
  
  processQueue() {
    while (this.tokens > 0 && this.queue.length > 0) {
      this.tokens--;
      const { fn, resolve, reject } = this.queue.shift();
      
      // Execute in next tick (non-blocking)
      process.nextTick(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }
  }
}

// Usage
const limiter = new TokenBucketRateLimiter(10, 2, 1000);

app.get('/api/endpoint', async (req, res) => {
  try {
    const result = await limiter.execute(async () => {
      return await heavyOperation();
    });
    res.json(result);
  } catch (error) {
    res.status(429).json({ error: 'Rate limit exceeded' });
  }
});
```

---

## Scenario-Based Questions

### Q16: Debug this code - why doesn't it work as expected?

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 0);
}
// Expected: 0, 1, 2
// Actual: 3, 3, 3
```

**Answer:**
The issue is with `var` and closure scope. When the timeouts execute, the loop has already completed and `i = 3`.

**Solutions:**

**1. Use `let` (block scope):**
```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Output: 0, 1, 2
```

**2. Use closure (IIFE):**
```javascript
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 0);
  })(i);
}
// Output: 0, 1, 2
```

**3. Pass parameter:**
```javascript
for (var i = 0; i < 3; i++) {
  setTimeout((val) => console.log(val), 0, i);
}
// Output: 0, 1, 2
```

---

### Q17: What happens when you run this code?

```javascript
process.nextTick(() => {
  console.log('tick 1');
  process.nextTick(() => console.log('tick 2'));
});

Promise.resolve().then(() => {
  console.log('promise 1');
  Promise.resolve().then(() => console.log('promise 2'));
});
```

**Answer:**
All `process.nextTick()` callbacks execute before any Promise callbacks.

**Execution:**
1. Current operation completes
2. nextTick queue: `['tick 1']`
3. Promise queue: `['promise 1']`
4. Execute nextTick queue:
   - 'tick 1' → Adds 'tick 2' to nextTick queue
   - 'tick 2' (nextTick queue not empty!)
5. Execute Promise queue:
   - 'promise 1' → Adds 'promise 2' to Promise queue
   - 'promise 2'

**Output:**
```
tick 1
tick 2
promise 1
promise 2
```

---

### Q18: How would you handle this high-traffic scenario?

**Scenario:** API endpoint receiving 10,000 requests/second, each requiring a database query and external API call.

**Answer:**
```javascript
// 1. Implement request batching
class RequestBatcher {
  constructor(batchSize = 100, maxWait = 50) {
    this.batchSize = batchSize;
    this.maxWait = maxWait;
    this.queue = [];
    this.timer = null;
  }
  
  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.maxWait);
      }
    });
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    clearTimeout(this.timer);
    this.timer = null;
    
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      const results = await this.processBatch(batch);
      batch.forEach((item, i) => item.resolve(results[i]));
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
  
  async processBatch(batch) {
    // Batch database queries
    const ids = batch.map(b => b.request.id);
    const dbResults = await db.query(`
      SELECT * FROM data WHERE id IN (?)
    `, [ids]);
    
    return dbResults;
  }
}

// 2. Implement caching
const cache = new Map();

// 3. Use connection pooling
const pool = mysql.createPool({
  connectionLimit: 100,
  // ... other options
});

// 4. Rate limiting per user
const rateLimiter = new RateLimiter();

// 5. Final endpoint
app.get('/api/data/:id', async (req, res) => {
  try {
    // Rate limit
    await rateLimiter.check(req.userId);
    
    // Check cache
    const cacheKey = `data:${req.params.id}`;
    let data = cache.get(cacheKey);
    
    if (!data) {
      // Batch request
      data = await batcher.add({ id: req.params.id });
      
      // Cache result
      cache.set(cacheKey, data);
      setTimeout(() => cache.delete(cacheKey), 60000);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Key Strategies:**
1. Request batching - Reduce DB queries
2. Caching - Avoid repeated work
3. Connection pooling - Reuse connections
4. Rate limiting - Prevent abuse
5. Non-blocking operations - Keep Event Loop responsive

---

## Summary

**Key Concepts to Remember:**
1. Event Loop has 6 phases
2. Microtasks execute between phases
3. `process.nextTick()` > Promises > Timers/Immediate
4. Never block the Event Loop
5. Use Worker Threads for CPU work
6. Understand libuv thread pool
7. Optimize with batching, caching, pooling
8. Monitor Event Loop lag in production

Good luck with your interview! 🚀
