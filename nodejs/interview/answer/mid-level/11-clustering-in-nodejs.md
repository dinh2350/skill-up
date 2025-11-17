# What is Clustering in Node.js?

## Short Answer

Clustering in Node.js is a technique that allows you to create multiple child processes (workers) that run simultaneously and share the same server port. Since Node.js runs in a single thread by default, clustering enables you to take advantage of multi-core systems by distributing the workload across multiple CPU cores, thereby improving application performance and availability.

## Detailed Explanation

### Why Clustering?

Node.js applications run on a **single thread** by default, which means they can only utilize one CPU core at a time. On modern servers with multiple CPU cores (4, 8, 16, or more), this leaves significant computational power unused. Clustering solves this problem by:

1. **Utilizing all CPU cores** - Creates worker processes equal to the number of CPU cores
2. **Improving performance** - Handles more concurrent requests
3. **Increasing reliability** - If one worker crashes, others continue running
4. **Load balancing** - Distributes incoming connections across workers

### The Cluster Module

Node.js provides a built-in `cluster` module that makes it easy to create child processes that share server ports.

```javascript
const cluster = require("cluster");
const http = require("http");
const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  // Workers can share any TCP connection
  // In this case, it's an HTTP server
  http
    .createServer((req, res) => {
      res.writeHead(200);
      res.end("Hello World\n");
    })
    .listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

## How Clustering Works

### Master-Worker Architecture

```
┌─────────────────────────────────────┐
│         Master Process              │
│      (Coordinates workers)          │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┬──────┬──────┐
    │             │      │      │
┌───▼───┐   ┌────▼──┐ ┌─▼────┐ ┌▼─────┐
│Worker1│   │Worker2│ │Worker3│ │Worker4│
│Port:80│   │Port:80│ │Port:80│ │Port:80│
└───────┘   └───────┘ └───────┘ └──────┘
```

1. **Master Process**: Manages worker processes, doesn't handle requests
2. **Worker Processes**: Handle actual application logic and incoming requests
3. **Load Balancing**: Master distributes connections using round-robin (default on most platforms)

## Practical Examples

### Example 1: Basic HTTP Server with Clustering

```javascript
const cluster = require("cluster");
const http = require("http");
const os = require("os");

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for dying workers
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code ${code}`);
    console.log("Starting a new worker...");
    cluster.fork(); // Replace the dead worker
  });

  // Log when worker is online
  cluster.on("online", (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });
} else {
  // Worker processes
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Handled by worker ${process.pid}\n`);
  });

  server.listen(3000, () => {
    console.log(`Worker ${process.pid} listening on port 3000`);
  });
}
```

### Example 2: Express.js Application with Clustering

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

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  app.get("/", (req, res) => {
    res.send(`Hello from worker ${process.pid}`);
  });

  app.get("/heavy", (req, res) => {
    // Simulate CPU-intensive task
    let sum = 0;
    for (let i = 0; i < 1000000000; i++) {
      sum += i;
    }
    res.send(`Result: ${sum} from worker ${process.pid}`);
  });

  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
```

### Example 3: Clustering with Worker Management

```javascript
const cluster = require("cluster");
const http = require("http");
const os = require("os");

const numCPUs = os.cpus().length;
const workers = [];

if (cluster.isMaster) {
  console.log(`Master ${process.pid} started`);

  // Create workers
  for (let i = 0; i < numCPUs; i++) {
    createWorker();
  }

  function createWorker() {
    const worker = cluster.fork();
    workers.push(worker);

    worker.on("message", (msg) => {
      console.log(`Message from worker ${worker.process.pid}:`, msg);
    });

    return worker;
  }

  // Handle worker exit
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);

    // Remove from workers array
    const index = workers.indexOf(worker);
    if (index !== -1) {
      workers.splice(index, 1);
    }

    // Create replacement worker
    createWorker();
  });

  // Master can send messages to workers
  setInterval(() => {
    workers.forEach((worker) => {
      worker.send({ cmd: "ping" });
    });
  }, 30000); // Ping every 30 seconds
} else {
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Worker ${process.pid}\n`);
  });

  server.listen(3000);

  // Worker receives messages from master
  process.on("message", (msg) => {
    if (msg.cmd === "ping") {
      process.send({ cmd: "pong", pid: process.pid });
    }
  });

  console.log(`Worker ${process.pid} started`);
}
```

### Example 4: Graceful Shutdown with Clustering

```javascript
const cluster = require("cluster");
const http = require("http");
const os = require("os");

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} started`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    if (signal) {
      console.log(`Worker was killed by signal: ${signal}`);
    } else if (code !== 0) {
      console.log(`Worker exited with error code: ${code}`);
      // Restart the worker
      cluster.fork();
    } else {
      console.log("Worker gracefully exited");
    }
  });

  // Handle shutdown signals
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");

    // Disconnect all workers
    for (const id in cluster.workers) {
      cluster.workers[id].disconnect();
    }

    // Force exit after timeout
    setTimeout(() => {
      console.log("Forcing shutdown");
      process.exit(0);
    }, 10000);
  });
} else {
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Worker ${process.pid}\n`);
  });

  server.listen(3000);

  // Graceful shutdown for workers
  process.on("SIGTERM", () => {
    console.log(`Worker ${process.pid} received SIGTERM, closing server...`);

    server.close(() => {
      console.log(`Worker ${process.pid} closed all connections`);
      process.exit(0);
    });

    // Force exit after timeout
    setTimeout(() => {
      console.error("Forcing exit");
      process.exit(1);
    }, 5000);
  });

  console.log(`Worker ${process.pid} started`);
}
```

### Example 5: Clustering with PM2 (Simplified Approach)

Instead of manually managing clusters, you can use PM2, a production process manager:

```javascript
// app.js - Simple Express app without clustering code
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send(`Hello from process ${process.pid}`);
});

app.listen(3000, () => {
  console.log(`Server running on process ${process.pid}`);
});
```

```json
// ecosystem.config.js - PM2 configuration
module.exports = {
  apps: [{
    name: 'my-app',
    script: './app.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 list
pm2 monit
```

## Key Concepts

### 1. **Load Balancing Strategies**

Node.js cluster module uses different load balancing strategies:

- **Round-robin (default on non-Windows)**: Master distributes connections in a circular fashion
- **OS-level (default on Windows)**: OS handles the load balancing

```javascript
// Configure scheduling policy
cluster.schedulingPolicy = cluster.SCHED_RR; // Round-robin
// or
cluster.schedulingPolicy = cluster.SCHED_NONE; // OS handles it
```

### 2. **Inter-Process Communication (IPC)**

Workers can communicate with the master process:

```javascript
// In worker
process.send({ type: "status", data: "healthy" });

// In master
worker.on("message", (msg) => {
  console.log("Received:", msg);
});

// Master to worker
worker.send({ command: "restart" });

// Worker receives
process.on("message", (msg) => {
  console.log("Master says:", msg);
});
```

### 3. **Shared State Considerations**

**Important**: Workers do NOT share memory. Each worker has its own:

- Memory space
- Event loop
- Variables

```javascript
// ❌ This won't work across workers
let requestCount = 0;

app.get("/", (req, res) => {
  requestCount++; // Only counts requests in THIS worker
  res.send(`Requests: ${requestCount}`);
});

// ✅ Use external storage for shared state
const Redis = require("redis");
const client = Redis.createClient();

app.get("/", async (req, res) => {
  const count = await client.incr("requestCount");
  res.send(`Requests: ${count}`);
});
```

### 4. **Worker Recycling**

Periodically restart workers to prevent memory leaks:

```javascript
if (cluster.isMaster) {
  const workers = [];

  for (let i = 0; i < numCPUs; i++) {
    workers.push(cluster.fork());
  }

  // Recycle workers every hour
  setInterval(() => {
    const worker = workers.shift();
    const newWorker = cluster.fork();
    workers.push(newWorker);

    newWorker.on("listening", () => {
      worker.disconnect(); // Gracefully shutdown old worker
    });
  }, 3600000); // 1 hour
}
```

## Advantages of Clustering

1. **Better Performance**: Utilizes all CPU cores
2. **Higher Throughput**: Handles more concurrent requests
3. **Improved Reliability**: One worker crash doesn't bring down the entire app
4. **Zero-downtime Restarts**: Can restart workers one at a time
5. **Built-in Load Balancing**: Automatic distribution of requests

## Disadvantages and Considerations

1. **Memory Overhead**: Each worker consumes memory
2. **No Shared Memory**: Requires external storage (Redis, MongoDB) for shared state
3. **Complexity**: More complex than single-process apps
4. **Not for All Workloads**: I/O-bound apps may not benefit as much
5. **Debugging Challenges**: Harder to debug multi-process applications

## When to Use Clustering

### Good Use Cases:

- ✅ CPU-intensive operations (data processing, image manipulation)
- ✅ High-traffic applications
- ✅ Production environments with multiple cores
- ✅ Applications requiring high availability

### When NOT to Use:

- ❌ I/O-bound applications with light CPU usage
- ❌ Single-core systems
- ❌ Development environments (complicates debugging)
- ❌ Applications with heavy shared state requirements

## Clustering vs. Other Scaling Approaches

### 1. **Clustering (Vertical Scaling)**

- Uses multiple cores on the same machine
- Limited by machine's CPU cores
- Shared disk and network

### 2. **Load Balancer + Multiple Servers (Horizontal Scaling)**

- Multiple machines running the application
- Unlimited scalability
- More complex infrastructure

### 3. **Worker Threads**

- For CPU-intensive tasks within a single process
- Shares memory with main thread
- Better for specific tasks, not for request handling

### 4. **Combination Approach**

```
         Load Balancer
              │
    ┌─────────┼─────────┐
    │         │         │
Server 1   Server 2   Server 3
(4 workers)(4 workers)(4 workers)
```

## Best Practices

### 1. **Always Handle Worker Deaths**

```javascript
cluster.on("exit", (worker, code, signal) => {
  console.log(`Worker ${worker.process.pid} died`);
  cluster.fork(); // Always restart
});
```

### 2. **Implement Graceful Shutdown**

```javascript
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
```

### 3. **Use External Storage for Shared State**

```javascript
// Use Redis, MongoDB, or other external storage
const redis = require("redis");
const client = redis.createClient();
```

### 4. **Monitor Worker Health**

```javascript
setInterval(() => {
  workers.forEach((worker) => {
    worker.send({ cmd: "health-check" });
  });
}, 30000);
```

### 5. **Limit Number of Workers**

```javascript
// Don't always use max CPUs, leave some for OS
const numWorkers = Math.max(1, numCPUs - 1);
```

### 6. **Use Process Managers in Production**

- PM2
- Forever
- Systemd

## Common Interview Questions

**Q: What's the difference between cluster and child_process?**

- **Cluster**: Specifically designed for creating multiple instances of the same application that share a server port
- **Child_process**: General-purpose module for spawning any child process

**Q: Do workers share memory?**

- No, each worker has its own memory space. Use external storage (Redis, DB) for shared state.

**Q: How does load balancing work in cluster?**

- The master process receives connections and distributes them to workers using round-robin (on most platforms) or OS-level load balancing (Windows).

**Q: What happens if a worker crashes?**

- Other workers continue running. The master can detect the crash and spawn a new worker.

**Q: Should you always use clustering?**

- No. Only beneficial for CPU-intensive apps or high-traffic scenarios. I/O-bound apps with light CPU usage may not see significant improvements.

## Performance Comparison

Without Clustering (Single Process):

```
Requests per second: ~1000
CPU Usage: 25% (1 core of 4)
```

With Clustering (4 Workers):

```
Requests per second: ~3500-4000
CPU Usage: 90-100% (all 4 cores)
```

## Summary

Clustering in Node.js is a powerful technique for scaling applications to utilize multiple CPU cores. It's essential for production environments running on multi-core systems and handling high traffic. While it adds complexity, the benefits of improved performance, reliability, and availability make it a crucial tool for building scalable Node.js applications.

**Key Takeaways:**

- Clustering enables Node.js to use multiple CPU cores
- Master process manages multiple worker processes
- Workers share the same server port automatically
- Use external storage for shared state across workers
- Always implement graceful shutdown and worker restart logic
- Consider using PM2 or similar tools for production deployment
- Not all applications benefit from clustering—analyze your workload first
