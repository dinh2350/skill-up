# Node.js Cluster Module - Complete Guide

## Table of Contents
- [What is the Cluster Module?](#what-is-the-cluster-module)
- [Why Use Clustering?](#why-use-clustering)
- [How Clustering Works](#how-clustering-works)
- [Master vs Worker Processes](#master-vs-worker-processes)
- [Load Balancing Strategies](#load-balancing-strategies)
- [Inter-Process Communication (IPC)](#inter-process-communication-ipc)
- [Graceful Shutdown](#graceful-shutdown)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)

---

## What is the Cluster Module?

The **Cluster module** allows you to create child processes (workers) that all share the same server port, enabling you to take advantage of **multi-core systems** to handle more load.

### Key Concept
Node.js runs in a **single thread** by default. On a multi-core CPU, this means only one core is being used. The cluster module spawns multiple Node.js processes to utilize all available CPU cores.

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  // Master process
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Worker process
  console.log(`Worker ${process.pid} started`);
}
```

---

## Why Use Clustering?

### 1. **Utilize All CPU Cores**
```
Single Process (No Cluster):
┌─────────────────────────────────────┐
│  CPU Core 1: [████████] 100%       │
│  CPU Core 2: [        ] 0%         │
│  CPU Core 3: [        ] 0%         │
│  CPU Core 4: [        ] 0%         │
└─────────────────────────────────────┘

With Cluster (4 Workers):
┌─────────────────────────────────────┐
│  CPU Core 1: [████] 40% - Worker 1 │
│  CPU Core 2: [████] 40% - Worker 2 │
│  CPU Core 3: [████] 40% - Worker 3 │
│  CPU Core 4: [████] 40% - Worker 4 │
└─────────────────────────────────────┘
```

### 2. **High Availability**
If one worker crashes, others continue serving requests.

### 3. **Zero-Downtime Deployments**
Restart workers one at a time during updates.

### 4. **Increased Throughput**
Handle more concurrent requests with parallel processing.

---

## How Clustering Works

### Architecture Diagram

```
                    ┌─────────────────────┐
                    │   Master Process    │
                    │   (Orchestrator)    │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
    ┌───────▼──────┐   ┌───────▼──────┐   ┌──────▼───────┐
    │  Worker 1    │   │  Worker 2    │   │  Worker 3    │
    │  (PID: 1234) │   │  (PID: 1235) │   │  (PID: 1236) │
    └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
           │                  │                   │
           └──────────────────┼───────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Incoming Traffic  │
                    │   (Load Balanced)   │
                    └─────────────────────┘
```

### Process Flow

1. **Master Process**
   - Spawns worker processes
   - Manages worker lifecycle
   - Distributes incoming connections
   - Monitors worker health

2. **Worker Processes**
   - Handle actual requests
   - Independent memory space
   - Can crash without affecting others
   - Share same server port

3. **Load Balancing**
   - Master distributes connections to workers
   - Round-robin (default on most platforms)
   - Operating system manages the distribution

---

## Master vs Worker Processes

### Master Process Responsibilities

```javascript
if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // 1. Fork workers
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  // 2. Monitor workers
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // 3. Restart dead workers
    cluster.fork();
  });
  
  // 4. Handle IPC messages
  cluster.on('message', (worker, message) => {
    console.log(`Message from worker ${worker.id}:`, message);
  });
}
```

**Master does NOT:**
- Handle HTTP requests
- Process business logic
- Perform heavy computations

### Worker Process Responsibilities

```javascript
if (cluster.isWorker) {
  const http = require('http');
  
  // 1. Create and run the actual server
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Handled by worker ${process.pid}\n`);
  });
  
  // 2. Listen on shared port
  server.listen(3000);
  
  // 3. Communicate with master
  process.send({ type: 'status', data: 'Worker ready' });
}
```

**Worker does:**
- Handle HTTP requests
- Execute business logic
- Process data
- Report status to master

---

## Load Balancing Strategies

### 1. Round-Robin (RR) - Default on most platforms

```javascript
// Enabled by default on Linux/Unix
// Requests distributed sequentially

Request 1 → Worker 1
Request 2 → Worker 2
Request 3 → Worker 3
Request 4 → Worker 1 (cycle repeats)
```

**Configuration:**
```javascript
cluster.schedulingPolicy = cluster.SCHED_RR;
```

### 2. Operating System (None) - Windows Default

```javascript
// OS decides which worker gets the connection
cluster.schedulingPolicy = cluster.SCHED_NONE;
```

### Comparison

| Strategy | Pros | Cons |
|----------|------|------|
| **Round-Robin** | Even distribution, predictable | Slight overhead |
| **OS** | Low overhead, kernel handles it | May be uneven |

---

## Inter-Process Communication (IPC)

Workers and master communicate via message passing.

### Master → Worker

```javascript
// Master
const worker = cluster.fork();

worker.send({ cmd: 'shutdown', timeout: 5000 });

// Worker
process.on('message', (msg) => {
  if (msg.cmd === 'shutdown') {
    console.log('Received shutdown command');
    // Graceful shutdown logic
  }
});
```

### Worker → Master

```javascript
// Worker
process.send({
  type: 'metrics',
  data: {
    requests: 1500,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  }
});

// Master
cluster.on('message', (worker, message) => {
  if (message.type === 'metrics') {
    console.log(`Worker ${worker.id} metrics:`, message.data);
  }
});
```

### Broadcast to All Workers

```javascript
// Master
function broadcastToWorkers(message) {
  for (const id in cluster.workers) {
    cluster.workers[id].send(message);
  }
}

broadcastToWorkers({ cmd: 'reload-config' });
```

---

## Graceful Shutdown

### Problem: Abrupt Shutdown
```javascript
// ❌ BAD: Kills workers immediately
process.exit(0);
```
- Ongoing requests are dropped
- Data may be lost
- Poor user experience

### Solution: Graceful Shutdown

```javascript
// Master
function gracefulShutdown() {
  console.log('Initiating graceful shutdown...');
  
  for (const id in cluster.workers) {
    const worker = cluster.workers[id];
    
    // 1. Stop accepting new connections
    worker.send({ cmd: 'shutdown' });
    
    // 2. Kill if not done in 30s
    setTimeout(() => {
      worker.kill();
    }, 30000);
  }
}

process.on('SIGTERM', gracefulShutdown);

// Worker
process.on('message', (msg) => {
  if (msg.cmd === 'shutdown') {
    // 1. Stop accepting new requests
    server.close(() => {
      // 2. Wait for existing requests to finish
      console.log('All requests finished');
      process.exit(0);
    });
    
    // 3. Set timeout for force exit
    setTimeout(() => {
      console.error('Forcing shutdown');
      process.exit(1);
    }, 29000);
  }
});
```

---

## Best Practices

### 1. **Match Workers to CPU Cores**

```javascript
const numWorkers = os.cpus().length;

// Or leave one core for OS
const numWorkers = Math.max(1, os.cpus().length - 1);
```

### 2. **Auto-Restart Dead Workers**

```javascript
cluster.on('exit', (worker, code, signal) => {
  console.log(`Worker ${worker.id} died (${code}). Restarting...`);
  
  // Prevent restart storm
  setTimeout(() => {
    cluster.fork();
  }, 1000);
});
```

### 3. **Implement Health Checks**

```javascript
// Master
setInterval(() => {
  for (const id in cluster.workers) {
    cluster.workers[id].send({ cmd: 'health-check' });
  }
}, 10000);

// Worker
process.on('message', (msg) => {
  if (msg.cmd === 'health-check') {
    process.send({
      type: 'health',
      status: 'ok',
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  }
});
```

### 4. **Monitor Memory Usage**

```javascript
setInterval(() => {
  const usage = process.memoryUsage();
  const heapUsed = usage.heapUsed / 1024 / 1024;
  
  if (heapUsed > 500) { // 500MB threshold
    console.warn(`High memory usage: ${heapUsed.toFixed(2)}MB`);
  }
}, 60000);
```

### 5. **Use PM2 or Similar Process Managers**

```bash
# PM2 handles clustering automatically
pm2 start app.js -i max  # max = number of CPUs
pm2 start app.js -i 4    # explicitly 4 workers
```

### 6. **Centralized Logging**

```javascript
// Worker
const logger = require('winston');

logger.add(new winston.transports.File({
  filename: `logs/worker-${process.pid}.log`
}));

// Or use centralized logging service
```

### 7. **Share State Carefully**

```javascript
// ❌ BAD: Each worker has its own memory
let counter = 0; // Not shared across workers!

// ✅ GOOD: Use external storage
const redis = require('redis');
const client = redis.createClient();

// Increment in Redis (shared across workers)
client.incr('counter');
```

---

## Common Pitfalls

### 1. **Not Sharing State**

```javascript
// ❌ Problem
let sessions = {}; // Each worker has separate sessions!

// ✅ Solution
// Use Redis, database, or memory cache (e.g., Redis, Memcached)
```

### 2. **Memory Leaks**

```javascript
// ❌ Problem
const cache = {};
app.get('/data/:id', (req, res) => {
  cache[req.params.id] = fetchData(req.params.id); // Never cleaned!
});

// ✅ Solution
const LRU = require('lru-cache');
const cache = new LRU({ max: 500, maxAge: 1000 * 60 * 60 });
```

### 3. **Too Many Workers**

```javascript
// ❌ BAD
const numWorkers = 100; // Way too many!

// ✅ GOOD
const numWorkers = os.cpus().length; // Match CPU cores
```

### 4. **No Restart Limit**

```javascript
// ❌ Problem: Infinite restart loop
cluster.on('exit', () => {
  cluster.fork(); // Immediate restart
});

// ✅ Solution: Implement backoff
let restartCount = 0;
let lastRestart = Date.now();

cluster.on('exit', (worker) => {
  const now = Date.now();
  
  // Reset count if last restart was > 1 minute ago
  if (now - lastRestart > 60000) {
    restartCount = 0;
  }
  
  restartCount++;
  lastRestart = now;
  
  if (restartCount > 5) {
    console.error('Too many restarts. Exiting.');
    process.exit(1);
  }
  
  setTimeout(() => cluster.fork(), 1000 * restartCount);
});
```

### 5. **Blocking the Event Loop**

```javascript
// ❌ Still blocks even with clustering
app.get('/heavy', (req, res) => {
  const result = heavyComputation(); // Blocks worker!
  res.json(result);
});

// ✅ Use worker_threads for CPU-intensive tasks
const { Worker } = require('worker_threads');

app.get('/heavy', async (req, res) => {
  const worker = new Worker('./heavy-task.js');
  worker.postMessage(req.body);
  
  worker.on('message', (result) => {
    res.json(result);
  });
});
```

---

## When to Use Clustering

### ✅ Use Clustering When:
- You have multiple CPU cores
- Handling high traffic (HTTP/WebSocket servers)
- Need high availability
- Stateless application
- I/O-bound operations

### ❌ Don't Use Clustering When:
- CPU-intensive operations (use Worker Threads instead)
- Single-core machine
- Development environment
- Application requires shared memory
- Very low traffic

---

## Cluster vs Worker Threads

| Feature | Cluster | Worker Threads |
|---------|---------|----------------|
| **Purpose** | Parallel HTTP servers | CPU-intensive tasks |
| **Process** | Separate processes | Threads in same process |
| **Memory** | Isolated | Shared (can share) |
| **Startup** | Slower | Faster |
| **Communication** | IPC (slower) | Shared memory (faster) |
| **Use Case** | Web servers | Image processing, crypto |

**Combined Example:**
```javascript
// Master: Cluster for HTTP
// Workers: Handle requests
// Worker Threads: CPU-intensive tasks within workers

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  const { Worker } = require('worker_threads');
  
  http.createServer((req, res) => {
    if (req.url === '/heavy') {
      // Offload to worker thread
      const worker = new Worker('./cpu-task.js');
      worker.on('message', result => res.end(result));
    } else {
      res.end('OK');
    }
  }).listen(3000);
}
```

---

## Performance Metrics

### Measuring Cluster Performance

```javascript
// Master
const startTime = Date.now();
let totalRequests = 0;

cluster.on('message', (worker, msg) => {
  if (msg.type === 'request-handled') {
    totalRequests++;
    
    if (totalRequests % 1000 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rps = totalRequests / elapsed;
      console.log(`Requests/sec: ${rps.toFixed(2)}`);
    }
  }
});

// Worker
http.createServer((req, res) => {
  // Handle request
  res.end('OK');
  
  // Report to master
  process.send({ type: 'request-handled' });
}).listen(3000);
```

### Benchmark Results (Example)

```
Single Worker:   1,000 req/sec
2 Workers:       1,800 req/sec (1.8x)
4 Workers:       3,200 req/sec (3.2x)
8 Workers:       5,500 req/sec (5.5x)

Note: Diminishing returns after matching CPU core count
```

---

## Summary

**Key Takeaways:**
1. Clustering utilizes multiple CPU cores
2. Master manages workers, workers handle requests
3. Workers share the same port automatically
4. Use IPC for communication between processes
5. Implement graceful shutdown for zero downtime
6. Auto-restart dead workers with backoff
7. Don't share state in memory - use external storage
8. Monitor worker health and memory usage

**Quick Reference:**
```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  // Fork workers
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
  
  // Handle worker death
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.id} died`);
    cluster.fork();
  });
} else {
  // Worker code
  require('./app.js'); // Your application
}
```

---

## Next Steps

Check out the example files:
1. `01-basic-cluster.js` - Basic clustering setup
2. `02-http-server-cluster.js` - HTTP server with clustering
3. `03-worker-communication.js` - IPC examples
4. `04-graceful-shutdown.js` - Zero-downtime deployments
5. `05-production-patterns.js` - Real-world production patterns
6. `INTERVIEW-QUESTIONS.md` - Interview preparation

Happy clustering! 🚀
