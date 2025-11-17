# What is the purpose of the `cluster` module?

## Short Answer

The `cluster` module in Node.js is a built-in module that allows you to create multiple child processes (workers) that run simultaneously and share the same server port. Its primary purpose is to enable Node.js applications to take advantage of multi-core systems by distributing the workload across multiple CPU cores, thereby improving performance, reliability, and scalability.

## Detailed Explanation

### Primary Purposes of the Cluster Module

#### 1. **Multi-Core Utilization**

Node.js runs on a single thread by default, which means it can only use one CPU core. The cluster module solves this limitation by creating multiple worker processes.

```javascript
const cluster = require("cluster");
const os = require("os");

const numCPUs = os.cpus().length;
console.log(`System has ${numCPUs} CPU cores`);

if (cluster.isMaster) {
  // Create one worker per CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Worker process handles requests
  require("./app.js");
}
```

#### 2. **Load Distribution**

The cluster module automatically distributes incoming connections across worker processes using built-in load balancing.

```javascript
const cluster = require("cluster");
const http = require("http");

if (cluster.isMaster) {
  console.log("Master process is running");

  // Fork 4 workers
  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }
} else {
  // Each worker creates its own server
  http
    .createServer((req, res) => {
      res.writeHead(200);
      res.end(`Handled by worker ${process.pid}\n`);
    })
    .listen(8000);

  console.log(`Worker ${process.pid} started`);
}

// Requests are automatically distributed among workers
```

#### 3. **Fault Tolerance**

If one worker process crashes, other workers continue running, and the master can spawn new workers.

```javascript
const cluster = require("cluster");

if (cluster.isMaster) {
  cluster.fork();
  cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log("Starting a new worker");
    cluster.fork(); // Automatically restart
  });
} else {
  // Simulate a worker crash after 5 seconds
  setTimeout(() => {
    throw new Error("Worker crashed!");
  }, 5000);
}
```

## Core Features and APIs

### 1. **Master-Worker Detection**

```javascript
const cluster = require("cluster");

if (cluster.isMaster) {
  console.log("This is the master process");
  cluster.fork(); // Create worker
} else {
  console.log("This is a worker process");
}

// Alternative approach
if (cluster.isPrimary) {
  // Node.js 16+ (isMaster is deprecated)
  // Master code
} else {
  // Worker code
}
```

### 2. **Worker Management**

```javascript
const cluster = require("cluster");

if (cluster.isMaster) {
  // Fork workers
  const worker1 = cluster.fork();
  const worker2 = cluster.fork();

  // Get all workers
  console.log(Object.keys(cluster.workers).length); // 2

  // Access specific worker
  cluster.workers[1].send("Hello from master");

  // Disconnect a worker
  worker1.disconnect();

  // Kill a worker
  worker2.kill();
}
```

### 3. **Inter-Process Communication (IPC)**

```javascript
const cluster = require("cluster");

if (cluster.isMaster) {
  const worker = cluster.fork();

  // Send message to worker
  worker.send({ cmd: "start", data: "some data" });

  // Receive message from worker
  worker.on("message", (msg) => {
    console.log("Master received:", msg);
  });
} else {
  // Worker receives messages
  process.on("message", (msg) => {
    console.log("Worker received:", msg);

    // Send response back to master
    process.send({ status: "completed", result: "processed" });
  });
}
```

### 4. **Worker Events**

```javascript
const cluster = require("cluster");

if (cluster.isMaster) {
  const worker = cluster.fork();

  // Worker is online and ready
  worker.on("online", () => {
    console.log("Worker is online");
  });

  // Worker is listening on a port
  worker.on("listening", (address) => {
    console.log(`Worker listening on ${address.address}:${address.port}`);
  });

  // Worker disconnected
  worker.on("disconnect", () => {
    console.log("Worker disconnected");
  });

  // Worker exited
  worker.on("exit", (code, signal) => {
    console.log(`Worker exited with code ${code}`);
  });

  // Worker sent a message
  worker.on("message", (message) => {
    console.log("Message from worker:", message);
  });
}
```

### 5. **Cluster Events**

```javascript
const cluster = require("cluster");

if (cluster.isMaster) {
  // When a new worker is forked
  cluster.on("fork", (worker) => {
    console.log(`Worker ${worker.process.pid} forked`);
  });

  // When a worker comes online
  cluster.on("online", (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

  // When a worker starts listening
  cluster.on("listening", (worker, address) => {
    console.log(
      `Worker ${worker.process.pid} listening on port ${address.port}`
    );
  });

  // When a worker disconnects
  cluster.on("disconnect", (worker) => {
    console.log(`Worker ${worker.process.pid} disconnected`);
  });

  // When a worker exits
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart worker
  });

  // Setup teardown
  cluster.on("setup", (settings) => {
    console.log("Cluster setup:", settings);
  });
}
```

## Practical Examples

### Example 1: Express.js Application with Cluster

```javascript
const cluster = require("cluster");
const express = require("express");
const os = require("os");

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Replace dead workers
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const app = express();
  const port = process.env.PORT || 3000;

  app.get("/", (req, res) => {
    res.json({
      message: "Hello from cluster!",
      worker: process.pid,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/heavy", (req, res) => {
    // CPU-intensive task
    let result = 0;
    for (let i = 0; i < 1000000000; i++) {
      result += Math.sqrt(i);
    }

    res.json({
      result: result,
      worker: process.pid,
    });
  });

  app.listen(port, () => {
    console.log(`Worker ${process.pid} listening on port ${port}`);
  });
}
```

### Example 2: Graceful Shutdown Implementation

```javascript
const cluster = require("cluster");
const http = require("http");

if (cluster.isMaster) {
  const workers = [];

  // Fork workers
  for (let i = 0; i < 2; i++) {
    const worker = cluster.fork();
    workers.push(worker);
  }

  // Handle master shutdown
  process.on("SIGTERM", () => {
    console.log("Master received SIGTERM, shutting down workers...");

    workers.forEach((worker) => {
      worker.send("shutdown");
      worker.disconnect();
    });

    // Force exit after timeout
    setTimeout(() => {
      console.log("Forcing shutdown");
      process.exit(0);
    }, 10000);
  });

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} exited`);
  });
} else {
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Response from worker ${process.pid}\n`);
  });

  server.listen(3000, () => {
    console.log(`Worker ${process.pid} listening on port 3000`);
  });

  // Handle worker shutdown
  process.on("message", (msg) => {
    if (msg === "shutdown") {
      console.log(`Worker ${process.pid} received shutdown signal`);

      server.close(() => {
        console.log(`Worker ${process.pid} closed server`);
        process.exit(0);
      });
    }
  });

  // Handle SIGTERM in worker
  process.on("SIGTERM", () => {
    console.log(`Worker ${process.pid} received SIGTERM`);
    server.close(() => process.exit(0));
  });
}
```

### Example 3: Worker Health Monitoring

```javascript
const cluster = require("cluster");
const os = require("os");

if (cluster.isMaster) {
  const workers = new Map();

  // Fork workers
  for (let i = 0; i < os.cpus().length; i++) {
    forkWorker();
  }

  function forkWorker() {
    const worker = cluster.fork();
    workers.set(worker.id, {
      worker: worker,
      lastHeartbeat: Date.now(),
      healthy: true,
    });

    worker.on("message", (msg) => {
      if (msg.type === "heartbeat") {
        const workerInfo = workers.get(worker.id);
        if (workerInfo) {
          workerInfo.lastHeartbeat = Date.now();
          workerInfo.healthy = true;
        }
      }
    });

    worker.on("exit", () => {
      workers.delete(worker.id);
      console.log(`Worker ${worker.process.pid} died, restarting...`);
      forkWorker(); // Restart
    });
  }

  // Health check interval
  setInterval(() => {
    const now = Date.now();
    const timeout = 10000; // 10 seconds

    workers.forEach((workerInfo, workerId) => {
      if (now - workerInfo.lastHeartbeat > timeout) {
        console.log(`Worker ${workerId} is unhealthy, killing...`);
        workerInfo.worker.kill();
      } else {
        // Request heartbeat
        workerInfo.worker.send({ type: "health-check" });
      }
    });
  }, 5000);
} else {
  const express = require("express");
  const app = express();

  app.get("/", (req, res) => {
    res.json({ worker: process.pid, status: "healthy" });
  });

  app.listen(3000);

  // Handle health check requests
  process.on("message", (msg) => {
    if (msg.type === "health-check") {
      // Send heartbeat
      process.send({ type: "heartbeat", worker: process.pid });
    }
  });

  // Send initial heartbeat
  process.send({ type: "heartbeat", worker: process.pid });
}
```

### Example 4: Load Balancing Configuration

```javascript
const cluster = require("cluster");
const http = require("http");

if (cluster.isMaster) {
  // Configure scheduling policy
  cluster.schedulingPolicy = cluster.SCHED_RR; // Round-robin (default on most platforms)
  // cluster.schedulingPolicy = cluster.SCHED_NONE; // Let OS handle it

  // Setup cluster settings
  cluster.setupMaster({
    exec: __filename, // Script to run in workers
    args: ["--worker"], // Arguments to pass
    silent: false, // Don't redirect worker stdout/stderr
  });

  console.log(
    `Master ${process.pid} starting with scheduling policy: ${
      cluster.schedulingPolicy === cluster.SCHED_RR ? "Round-Robin" : "OS"
    }`
  );

  // Fork workers
  for (let i = 0; i < 4; i++) {
    cluster.fork({ WORKER_ID: i }); // Pass environment variables
  }

  cluster.on("online", (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });
} else {
  const server = http.createServer((req, res) => {
    const workerInfo = {
      worker: process.pid,
      workerId: process.env.WORKER_ID,
      timestamp: new Date().toISOString(),
      url: req.url,
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(workerInfo, null, 2));
  });

  server.listen(3000, () => {
    console.log(`Worker ${process.env.WORKER_ID} (${process.pid}) listening`);
  });
}
```

## Advanced Use Cases

### 1. **Worker Recycling for Memory Management**

```javascript
const cluster = require("cluster");

if (cluster.isMaster) {
  const workers = [];
  const MAX_REQUESTS_PER_WORKER = 1000;

  function createWorker() {
    const worker = cluster.fork();
    workers.push({
      worker: worker,
      requests: 0,
      startTime: Date.now(),
    });

    worker.on("message", (msg) => {
      if (msg.type === "request-processed") {
        const workerInfo = workers.find((w) => w.worker.id === worker.id);
        if (workerInfo) {
          workerInfo.requests++;

          // Recycle worker if it processed too many requests
          if (workerInfo.requests >= MAX_REQUESTS_PER_WORKER) {
            console.log(
              `Recycling worker ${worker.process.pid} after ${workerInfo.requests} requests`
            );
            recycleWorker(workerInfo);
          }
        }
      }
    });
  }

  function recycleWorker(workerInfo) {
    const oldWorker = workerInfo.worker;
    const newWorker = cluster.fork();

    // Replace in workers array
    const index = workers.indexOf(workerInfo);
    workers[index] = {
      worker: newWorker,
      requests: 0,
      startTime: Date.now(),
    };

    // Gracefully shutdown old worker
    newWorker.on("online", () => {
      oldWorker.disconnect();
    });
  }

  // Create initial workers
  for (let i = 0; i < 4; i++) {
    createWorker();
  }
} else {
  const express = require("express");
  const app = express();

  app.use((req, res, next) => {
    // Notify master about processed request
    process.send({ type: "request-processed" });
    next();
  });

  app.get("/", (req, res) => {
    res.json({ worker: process.pid });
  });

  app.listen(3000);
}
```

### 2. **Dynamic Worker Scaling**

```javascript
const cluster = require("cluster");
const os = require("os");

if (cluster.isMaster) {
  let targetWorkers = Math.min(os.cpus().length, 4);
  const workers = new Map();
  const requestCounts = [];

  function addWorker() {
    const worker = cluster.fork();
    workers.set(worker.id, {
      worker: worker,
      requests: 0,
      startTime: Date.now(),
    });
    console.log(`Added worker ${worker.process.pid}. Total: ${workers.size}`);
  }

  function removeWorker() {
    if (workers.size <= 1) return; // Keep at least one worker

    const [workerId, workerInfo] = workers.entries().next().value;
    workers.delete(workerId);
    workerInfo.worker.disconnect();
    console.log(
      `Removed worker ${workerInfo.worker.process.pid}. Total: ${workers.size}`
    );
  }

  // Start with minimum workers
  for (let i = 0; i < 2; i++) {
    addWorker();
  }

  // Monitor load and scale workers
  setInterval(() => {
    const totalRequests = Array.from(workers.values()).reduce(
      (sum, w) => sum + w.requests,
      0
    );

    requestCounts.push(totalRequests);
    if (requestCounts.length > 10) requestCounts.shift();

    const avgRequests =
      requestCounts.reduce((a, b) => a + b, 0) / requestCounts.length;
    const requestsPerWorker = avgRequests / workers.size;

    console.log(`Avg requests/worker: ${requestsPerWorker.toFixed(2)}`);

    // Scale up if high load
    if (requestsPerWorker > 50 && workers.size < targetWorkers) {
      addWorker();
    }

    // Scale down if low load
    if (requestsPerWorker < 10 && workers.size > 2) {
      removeWorker();
    }

    // Reset request counters
    workers.forEach((w) => (w.requests = 0));
  }, 10000);

  // Track worker requests
  cluster.on("message", (worker, msg) => {
    if (msg.type === "request") {
      const workerInfo = workers.get(worker.id);
      if (workerInfo) workerInfo.requests++;
    }
  });
} else {
  const express = require("express");
  const app = express();

  app.use((req, res, next) => {
    process.send({ type: "request" });
    next();
  });

  app.get("/", (req, res) => {
    res.json({ worker: process.pid });
  });

  app.listen(3000);
}
```

## Key Benefits

### 1. **Performance Improvements**

- **CPU Utilization**: Uses all available CPU cores
- **Throughput**: Handles more concurrent requests
- **Response Time**: Reduces response time under load

### 2. **Reliability**

- **Fault Tolerance**: One worker crash doesn't affect others
- **High Availability**: Application stays running even with worker failures
- **Automatic Recovery**: Master can restart failed workers

### 3. **Scalability**

- **Horizontal Scaling**: Easy to add/remove workers
- **Load Distribution**: Automatic load balancing
- **Resource Management**: Better resource utilization

## Limitations and Considerations

### 1. **Memory Overhead**

Each worker process consumes memory:

```javascript
// Monitor memory usage
if (cluster.isMaster) {
  setInterval(() => {
    const usage = process.memoryUsage();
    console.log(`Master memory: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);

    Object.values(cluster.workers).forEach((worker) => {
      worker.send({ cmd: "memory-check" });
    });
  }, 30000);
} else {
  process.on("message", (msg) => {
    if (msg.cmd === "memory-check") {
      const usage = process.memoryUsage();
      console.log(
        `Worker ${process.pid} memory: ${(usage.rss / 1024 / 1024).toFixed(
          2
        )} MB`
      );
    }
  });
}
```

### 2. **No Shared Memory**

Workers don't share variables:

```javascript
// ❌ This doesn't work across workers
let globalCounter = 0;

app.get("/count", (req, res) => {
  globalCounter++; // Only increments in this worker
  res.json({ count: globalCounter, worker: process.pid });
});

// ✅ Use external storage for shared state
const redis = require("redis");
const client = redis.createClient();

app.get("/count", async (req, res) => {
  const count = await client.incr("globalCounter");
  res.json({ count: count, worker: process.pid });
});
```

### 3. **Session Management**

HTTP sessions need special handling in clustered environments:

```javascript
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const redis = require("redis");

const client = redis.createClient();

app.use(
  session({
    store: new RedisStore({ client: client }),
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
```

## Best Practices

### 1. **Always Handle Worker Deaths**

```javascript
cluster.on("exit", (worker, code, signal) => {
  console.log(`Worker ${worker.process.pid} died`);
  if (!worker.exitedAfterDisconnect) {
    cluster.fork(); // Only restart if not intentional shutdown
  }
});
```

### 2. **Implement Graceful Shutdown**

```javascript
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

function gracefulShutdown() {
  console.log("Received kill signal, shutting down gracefully...");

  Object.values(cluster.workers).forEach((worker) => {
    worker.disconnect();
  });

  setTimeout(() => {
    console.log("Forcing shutdown");
    process.exit(1);
  }, 10000);
}
```

### 3. **Monitor Worker Health**

```javascript
setInterval(() => {
  Object.values(cluster.workers).forEach((worker) => {
    if (!worker.isDead()) {
      worker.send({ cmd: "health-check" });
    }
  });
}, 30000);
```

### 4. **Use External Storage for Shared State**

```javascript
// Use Redis, MongoDB, or other external storage for:
// - Session data
// - Application state
// - Cached data
// - Configuration
```

### 5. **Limit the Number of Workers**

```javascript
// Don't always use all CPU cores
const numWorkers = Math.min(os.cpus().length, 8); // Cap at 8 workers
// or
const numWorkers = Math.max(1, os.cpus().length - 1); // Leave one core for OS
```

## Summary

The cluster module is a powerful tool for scaling Node.js applications by:

- **Enabling multi-core utilization** through worker processes
- **Providing automatic load balancing** across workers
- **Improving fault tolerance** with process isolation
- **Offering built-in IPC** for coordination between master and workers
- **Supporting graceful scaling** and worker management

It's essential for production Node.js applications that need to handle high traffic and take advantage of multi-core servers, though it requires careful consideration of shared state, memory usage, and proper error handling.

**Key Takeaways:**

- Cluster module creates multiple worker processes sharing the same port
- Master process manages workers; workers handle requests
- Automatic load balancing distributes requests across workers
- Workers don't share memory - use external storage for shared state
- Always implement graceful shutdown and worker restart logic
- Monitor worker health and implement proper error handling
- Consider memory overhead and limit number of workers appropriately
