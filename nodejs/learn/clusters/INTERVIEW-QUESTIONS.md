# Node.js Cluster Module - Interview Questions

Comprehensive interview questions from junior to senior level, covering cluster concepts, IPC, load balancing, and production patterns.

---

## Junior Level Questions

### 1. What is the Node.js Cluster module and why is it needed?

**Answer:**

The Cluster module allows you to create child processes (workers) that share the same server port. It's needed because:

- **Single-threaded limitation**: Node.js runs on a single thread by default, can't utilize multiple CPU cores
- **Performance**: Enables horizontal scaling on multi-core systems
- **Availability**: If one worker crashes, others continue serving requests
- **Load distribution**: Spreads incoming connections across workers

```javascript
const cluster = require('cluster');
const http = require('http');
const os = require('os');

if (cluster.isMaster) {
  // Fork workers equal to CPU cores
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
} else {
  // Each worker creates its own server
  http.createServer((req, res) => {
    res.end('Hello from worker ' + cluster.worker.id);
  }).listen(3000);
}
```

**Key Points:**
- Master process manages workers
- Workers are separate Node.js processes
- All workers share the same port
- Automatic load balancing between workers

---

### 2. What's the difference between cluster.isMaster and cluster.isWorker?

**Answer:**

These properties help distinguish between master and worker processes:

```javascript
const cluster = require('cluster');

if (cluster.isMaster) {
  console.log('I am the master process');
  console.log('PID:', process.pid);
  
  // Master responsibilities:
  // - Fork workers
  // - Monitor worker health
  // - Restart failed workers
  cluster.fork();
  
} else if (cluster.isWorker) {
  console.log('I am a worker process');
  console.log('Worker ID:', cluster.worker.id);
  console.log('PID:', process.pid);
  
  // Worker responsibilities:
  // - Handle actual requests
  // - Do the application work
}
```

**Key Differences:**
| Master | Worker |
|--------|--------|
| One per application | Multiple workers |
| Manages workers | Handles requests |
| Doesn't serve traffic | Serves actual traffic |
| `cluster.isMaster === true` | `cluster.isWorker === true` |

---

### 3. How do you detect when a worker dies and restart it?

**Answer:**

Use the `exit` event on the cluster object:

```javascript
const cluster = require('cluster');

if (cluster.isMaster) {
  cluster.fork();
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.id} died (${code || signal})`);
    console.log('Starting a new worker...');
    
    // Restart the worker
    cluster.fork();
  });
  
} else {
  // Worker code
  const server = require('http').createServer((req, res) => {
    // Simulate crash on /crash endpoint
    if (req.url === '/crash') {
      process.exit(1);
    }
    res.end('OK');
  });
  
  server.listen(3000);
}
```

**Event Parameters:**
- `worker`: The worker object that died
- `code`: Exit code (if exited normally)
- `signal`: Signal that killed the process (e.g., 'SIGTERM')

---

## Intermediate Level Questions

### 4. Explain the load balancing strategies in Node.js Cluster

**Answer:**

Node.js provides two load balancing strategies:

**1. Round-Robin (default on all platforms except Windows)**
```javascript
const cluster = require('cluster');

// Explicitly set round-robin
cluster.schedulingPolicy = cluster.SCHED_RR;

if (cluster.isMaster) {
  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }
  
  let requestCount = {};
  
  cluster.on('message', (worker, msg) => {
    if (msg.type === 'request') {
      requestCount[worker.id] = (requestCount[worker.id] || 0) + 1;
      console.log('Request distribution:', requestCount);
      // Example output: { '1': 25, '2': 24, '3': 26, '4': 25 }
    }
  });
}
```

**How it works:**
- Master process accepts connections
- Distributes them to workers in round-robin fashion
- More predictable, even distribution
- Slight overhead from master handling connections

**2. Operating System (OS) Scheduling**
```javascript
cluster.schedulingPolicy = cluster.SCHED_NONE;
```

**How it works:**
- OS handles load balancing
- Workers compete for connections
- Less predictable distribution
- Lower overhead (no master involvement)

**Choosing a strategy:**
- Round-Robin: Better for even distribution, stateless apps
- OS Scheduling: Better for low latency, kernel handles it

---

### 5. How do workers communicate with the master process?

**Answer:**

Workers and master communicate via IPC (Inter-Process Communication) using `send()` and `message` events:

**Worker → Master:**
```javascript
if (cluster.isWorker) {
  // Worker sends message to master
  process.send({
    type: 'status',
    workerId: cluster.worker.id,
    memory: process.memoryUsage().heapUsed
  });
  
  // Worker receives message from master
  process.on('message', (msg) => {
    console.log('Worker received:', msg);
    if (msg.type === 'shutdown') {
      process.exit(0);
    }
  });
}
```

**Master → Worker:**
```javascript
if (cluster.isMaster) {
  const worker = cluster.fork();
  
  // Master receives message from worker
  worker.on('message', (msg) => {
    console.log(`Master received from Worker ${worker.id}:`, msg);
  });
  
  // Master sends message to worker
  worker.send({
    type: 'config',
    data: { maxConnections: 1000 }
  });
  
  // Broadcast to all workers
  for (const id in cluster.workers) {
    cluster.workers[id].send({ type: 'reload' });
  }
}
```

**Common IPC Patterns:**
- Health checks
- Configuration updates
- Graceful shutdown signals
- Metrics collection
- Coordinated tasks

---

### 6. What is a graceful shutdown and how do you implement it?

**Answer:**

Graceful shutdown means stopping the server without dropping active connections:

```javascript
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {
  const workers = [];
  
  for (let i = 0; i < 4; i++) {
    workers.push(cluster.fork());
  }
  
  // Handle shutdown signals
  process.on('SIGTERM', () => {
    console.log('Master received SIGTERM, shutting down gracefully...');
    
    workers.forEach(worker => {
      worker.send({ type: 'shutdown' });
    });
    
    // Force kill after 10 seconds
    setTimeout(() => {
      workers.forEach(worker => worker.kill('SIGKILL'));
      process.exit(0);
    }, 10000);
  });
  
} else {
  const activeConnections = new Set();
  
  const server = http.createServer((req, res) => {
    const connId = Date.now() + Math.random();
    activeConnections.add(connId);
    
    setTimeout(() => {
      res.end('Done');
      activeConnections.delete(connId);
    }, 1000);
  });
  
  server.listen(3000);
  
  process.on('message', (msg) => {
    if (msg.type === 'shutdown') {
      console.log(`Worker ${cluster.worker.id} shutting down...`);
      
      // Stop accepting new connections
      server.close(() => {
        console.log('Server closed');
      });
      
      // Wait for active connections to complete
      const checkInterval = setInterval(() => {
        if (activeConnections.size === 0) {
          clearInterval(checkInterval);
          process.exit(0);
        } else {
          console.log(`Waiting for ${activeConnections.size} connections...`);
        }
      }, 1000);
      
      // Force exit after timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        process.exit(0);
      }, 10000);
    }
  });
}
```

**Steps:**
1. Stop accepting new connections (`server.close()`)
2. Wait for active requests to complete
3. Clean up resources
4. Exit process
5. Force kill if timeout exceeded

---

### 7. How do you implement session management in a clustered environment?

**Answer:**

Since workers don't share memory, you need external session storage:

**Problem:**
```javascript
// ❌ This won't work - sessions are per-worker
const sessions = {}; // Each worker has separate memory

app.get('/login', (req, res) => {
  const sessionId = generateId();
  sessions[sessionId] = { userId: 123 };
  res.cookie('sessionId', sessionId);
});

app.get('/profile', (req, res) => {
  const session = sessions[req.cookies.sessionId];
  // Might be undefined if different worker handles request
});
```

**Solution 1: Redis-based sessions**
```javascript
const Redis = require('ioredis');
const redis = new Redis();

app.post('/login', async (req, res) => {
  const sessionId = generateId();
  
  await redis.setex(
    `session:${sessionId}`,
    3600, // 1 hour expiry
    JSON.stringify({ userId: 123 })
  );
  
  res.cookie('sessionId', sessionId);
});

app.get('/profile', async (req, res) => {
  const sessionData = await redis.get(
    `session:${req.cookies.sessionId}`
  );
  
  if (!sessionData) {
    return res.status(401).send('Unauthorized');
  }
  
  const session = JSON.parse(sessionData);
  res.json({ userId: session.userId });
});
```

**Solution 2: Sticky sessions (IP-based routing)**
```javascript
// Route requests from same IP to same worker
const crypto = require('crypto');

if (cluster.isMaster) {
  const workers = [];
  
  for (let i = 0; i < 4; i++) {
    workers.push(cluster.fork());
  }
  
  // Simple sticky session implementation
  const server = require('net').createServer(socket => {
    const ip = socket.remoteAddress;
    const hash = crypto.createHash('md5').update(ip).digest('hex');
    const workerIndex = parseInt(hash, 16) % workers.length;
    
    workers[workerIndex].send('connection', socket);
  });
  
  server.listen(3000);
}
```

**Best Practices:**
- Use Redis/Memcached for distributed sessions
- Set appropriate TTL
- Use sticky sessions only if absolutely necessary
- Consider JWT tokens for stateless authentication

---

## Senior Level Questions

### 8. Explain zero-downtime deployment with rolling restarts

**Answer:**

Rolling restart replaces workers one at a time to avoid downtime:

```javascript
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {
  const workers = [];
  const numWorkers = 4;
  
  // Fork initial workers
  for (let i = 0; i < numWorkers; i++) {
    workers.push(cluster.fork());
  }
  
  function rollingRestart() {
    return new Promise((resolve) => {
      let index = 0;
      
      function restartNext() {
        if (index >= workers.length) {
          console.log('Rolling restart complete');
          resolve();
          return;
        }
        
        const oldWorker = workers[index];
        console.log(`Restarting worker ${oldWorker.id}...`);
        
        // 1. Fork new worker
        const newWorker = cluster.fork();
        
        // 2. Wait for new worker to be ready
        newWorker.once('listening', () => {
          console.log(`New worker ${newWorker.id} is ready`);
          
          // 3. Gracefully shutdown old worker
          oldWorker.send({ type: 'shutdown' });
          
          oldWorker.once('exit', () => {
            console.log(`Old worker ${oldWorker.id} shut down`);
            workers[index] = newWorker;
            index++;
            
            // 4. Wait before next restart (allows stabilization)
            setTimeout(restartNext, 2000);
          });
          
          // Force kill if doesn't exit
          setTimeout(() => {
            if (!oldWorker.isDead()) {
              oldWorker.kill('SIGKILL');
            }
          }, 10000);
        });
      }
      
      restartNext();
    });
  }
  
  // Trigger rolling restart on SIGUSR2
  process.on('SIGUSR2', async () => {
    console.log('Starting rolling restart...');
    await rollingRestart();
  });
  
  // Auto-restart on crash
  cluster.on('exit', (worker, code, signal) => {
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(`Worker ${worker.id} crashed, starting replacement...`);
      const newWorker = cluster.fork();
      const idx = workers.indexOf(worker);
      if (idx !== -1) workers[idx] = newWorker;
    }
  });
  
} else {
  const server = http.createServer((req, res) => {
    res.end(`Worker ${cluster.worker.id} (PID: ${process.pid})`);
  });
  
  server.listen(3000, () => {
    console.log(`Worker ${cluster.worker.id} listening`);
  });
  
  // Graceful shutdown
  process.on('message', (msg) => {
    if (msg.type === 'shutdown') {
      console.log(`Worker ${cluster.worker.id} gracefully shutting down...`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 5000);
    }
  });
}
```

**Deployment Steps:**
```bash
# Send SIGUSR2 to trigger rolling restart
kill -SIGUSR2 <master-pid>

# Or with PM2
pm2 reload app --update-env
```

**Key Points:**
- Always have at least N-1 workers running
- New worker must be healthy before killing old one
- Stagger restarts to avoid CPU spikes
- Monitor for failures during rollout
- Have rollback plan

---

### 9. How do you implement health checks and auto-recovery in production?

**Answer:**

Comprehensive health monitoring with auto-recovery:

```javascript
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {
  const workerHealth = new Map();
  const HEALTH_CHECK_INTERVAL = 5000;
  const HEALTH_TIMEOUT = 2000;
  const MAX_FAILURES = 3;
  const MAX_MEMORY = 500 * 1024 * 1024; // 500MB
  const MAX_RESTARTS_PER_HOUR = 5;
  
  class WorkerHealthTracker {
    constructor(workerId) {
      this.workerId = workerId;
      this.consecutiveFailures = 0;
      this.lastHealthCheck = Date.now();
      this.restarts = [];
      this.metrics = {
        memory: 0,
        cpu: 0,
        requests: 0
      };
    }
    
    recordFailure() {
      this.consecutiveFailures++;
      console.log(`⚠️  Worker ${this.workerId} health check failed (${this.consecutiveFailures}/${MAX_FAILURES})`);
      
      if (this.consecutiveFailures >= MAX_FAILURES) {
        return this.shouldRestart();
      }
      return false;
    }
    
    recordSuccess(metrics) {
      this.consecutiveFailures = 0;
      this.lastHealthCheck = Date.now();
      this.metrics = metrics;
      
      // Check memory threshold
      if (metrics.memory > MAX_MEMORY) {
        console.log(`⚠️  Worker ${this.workerId} exceeded memory limit (${(metrics.memory / 1024 / 1024).toFixed(2)}MB)`);
        return this.shouldRestart();
      }
      
      return false;
    }
    
    shouldRestart() {
      // Check restart rate
      const oneHourAgo = Date.now() - 3600000;
      this.restarts = this.restarts.filter(t => t > oneHourAgo);
      
      if (this.restarts.length >= MAX_RESTARTS_PER_HOUR) {
        console.error(`❌ Worker ${this.workerId} restarted too many times, not restarting`);
        return false;
      }
      
      this.restarts.push(Date.now());
      return true;
    }
  }
  
  // Fork workers
  for (let i = 0; i < 4; i++) {
    const worker = cluster.fork();
    workerHealth.set(worker.id, new WorkerHealthTracker(worker.id));
  }
  
  // Handle health check responses
  cluster.on('message', (worker, msg) => {
    if (msg.type === 'health') {
      const tracker = workerHealth.get(worker.id);
      if (!tracker) return;
      
      if (msg.healthy) {
        const shouldRestart = tracker.recordSuccess(msg.metrics);
        if (shouldRestart) {
          console.log(`🔄 Restarting worker ${worker.id} due to health issues...`);
          restartWorker(worker);
        }
      } else {
        const shouldRestart = tracker.recordFailure();
        if (shouldRestart) {
          console.log(`❌ Restarting unhealthy worker ${worker.id}...`);
          restartWorker(worker);
        }
      }
    }
  });
  
  // Periodic health checks
  setInterval(() => {
    for (const id in cluster.workers) {
      cluster.workers[id].send({ type: 'health-check' });
    }
    
    // Check for unresponsive workers
    setTimeout(() => {
      for (const [workerId, tracker] of workerHealth) {
        const timeSinceCheck = Date.now() - tracker.lastHealthCheck;
        
        if (timeSinceCheck > HEALTH_TIMEOUT) {
          const shouldRestart = tracker.recordFailure();
          if (shouldRestart) {
            const worker = cluster.workers[workerId];
            if (worker) {
              console.log(`❌ Worker ${workerId} unresponsive, restarting...`);
              restartWorker(worker);
            }
          }
        }
      }
    }, HEALTH_TIMEOUT);
  }, HEALTH_CHECK_INTERVAL);
  
  function restartWorker(oldWorker) {
    const tracker = workerHealth.get(oldWorker.id);
    
    // Fork new worker
    const newWorker = cluster.fork();
    workerHealth.set(newWorker.id, new WorkerHealthTracker(newWorker.id));
    
    // Wait for new worker, then kill old one
    newWorker.once('listening', () => {
      oldWorker.kill();
      workerHealth.delete(oldWorker.id);
    });
  }
  
  // Display health dashboard
  setInterval(() => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║          Health Dashboard              ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    for (const [workerId, tracker] of workerHealth) {
      const m = tracker.metrics;
      console.log(`Worker ${workerId}:`);
      console.log(`  Failures: ${tracker.consecutiveFailures}/${MAX_FAILURES}`);
      console.log(`  Memory: ${(m.memory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  CPU: ${m.cpu.toFixed(2)}%`);
      console.log(`  Restarts (1h): ${tracker.restarts.length}/${MAX_RESTARTS_PER_HOUR}\n`);
    }
  }, 10000);
  
} else {
  let requestCount = 0;
  
  const server = http.createServer((req, res) => {
    requestCount++;
    res.end('OK');
  });
  
  server.listen(3000);
  
  // Health check handler
  process.on('message', (msg) => {
    if (msg.type === 'health-check') {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      process.send({
        type: 'health',
        healthy: true,
        metrics: {
          memory: memUsage.heapUsed,
          cpu: (cpuUsage.user + cpuUsage.system) / 1000000,
          requests: requestCount
        }
      });
    }
  });
}
```

**Monitoring Points:**
- Response time to health checks
- Memory usage trends
- CPU usage
- Request throughput
- Error rates
- Restart frequency

---

### 10. What are the limitations and anti-patterns of the Cluster module?

**Answer:**

**Limitations:**

1. **Shared State Issues**
```javascript
// ❌ This won't work across workers
let requestCount = 0;

app.get('/count', (req, res) => {
  requestCount++; // Only increments in current worker
  res.json({ count: requestCount });
});

// ✅ Use Redis or shared database
const redis = require('ioredis').createClient();

app.get('/count', async (req, res) => {
  const count = await redis.incr('request-count');
  res.json({ count });
});
```

2. **File Descriptor Limits**
```javascript
// Each worker has separate FD limit
// 4 workers × 1024 FDs = still only 1024 per worker
// Not 4096 total
```

3. **WebSocket Challenges**
```javascript
// WebSocket connections stick to one worker
// Can't easily migrate connections between workers
// Need sticky sessions or external pub/sub

const cluster = require('cluster');
const http = require('http');
const WebSocket = require('ws');
const Redis = require('ioredis');

if (cluster.isWorker) {
  const server = http.createServer();
  const wss = new WebSocket.Server({ server });
  const redis = new Redis();
  const subscriber = new Redis();
  
  // Subscribe to broadcasts
  subscriber.subscribe('broadcast');
  subscriber.on('message', (channel, message) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
      // Broadcast to all workers via Redis
      redis.publish('broadcast', msg);
    });
  });
}
```

**Anti-Patterns:**

1. **Not Handling Worker Crashes**
```javascript
// ❌ Don't ignore crashes
cluster.on('exit', (worker) => {
  console.log('Worker died');
  // And do nothing...
});

// ✅ Always restart
cluster.on('exit', (worker, code, signal) => {
  if (code !== 0 && !worker.exitedAfterDisconnect) {
    console.log(`Worker crashed, restarting...`);
    cluster.fork();
  }
});
```

2. **Spawning Too Many Workers**
```javascript
// ❌ More workers than CPU cores
for (let i = 0; i < 100; i++) { // Overkill!
  cluster.fork();
}

// ✅ Match CPU cores
const numWorkers = os.cpus().length;
for (let i = 0; i < numWorkers; i++) {
  cluster.fork();
}
```

3. **Not Implementing Graceful Shutdown**
```javascript
// ❌ Abrupt shutdown
process.on('SIGTERM', () => {
  process.exit(0); // Kills workers immediately
});

// ✅ Graceful shutdown
process.on('SIGTERM', async () => {
  await gracefulShutdown();
});
```

4. **Ignoring Memory Leaks**
```javascript
// ❌ Let workers leak memory indefinitely
// Worker keeps growing until OOM

// ✅ Proactive restart on memory threshold
if (memoryUsage > threshold) {
  gracefullyRestartWorker();
}
```

**Alternatives to Consider:**
- **PM2**: Production process manager with clustering
- **Kubernetes**: Container orchestration (handles scaling)
- **Worker Threads**: For CPU-intensive tasks (shared memory)
- **Serverless**: Let platform handle scaling

---

## Bonus: Advanced Scenarios

### 11. How do you implement circuit breaker pattern in a clustered application?

**Answer:**

Circuit breaker prevents cascading failures by temporarily blocking requests to failing services:

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000, resetTimeout = 30000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        )
      ]);
      
      this.onSuccess();
      return result;
      
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log('Circuit breaker: HALF_OPEN → CLOSED');
    }
  }
  
  onFailure() {
    this.failures++;
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(`Circuit breaker: CLOSED → OPEN (${this.failures} failures)`);
    }
  }
}

// Usage in clustered app
const breaker = new CircuitBreaker(5, 5000, 30000);

app.get('/api/data', async (req, res) => {
  try {
    const data = await breaker.execute(async () => {
      return await externalService.getData();
    });
    res.json(data);
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      res.status(503).json({ error: 'Service temporarily unavailable' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});
```

---

### 12. Explain how to implement distributed rate limiting across workers

**Answer:**

Use Redis for shared rate limit state:

```javascript
const Redis = require('ioredis');
const redis = new Redis();

class DistributedRateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  async isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Use Redis sorted set with scores as timestamps
    const multi = redis.multi();
    
    // Remove old entries
    multi.zremrangebyscore(key, 0, windowStart);
    
    // Count current entries
    multi.zcard(key);
    
    // Add current request
    multi.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiry
    multi.pexpire(key, this.windowMs);
    
    const results = await multi.exec();
    const count = results[1][1];
    
    return count < this.maxRequests;
  }
}

// Middleware
const limiter = new DistributedRateLimiter(100, 60000); // 100 req/min

app.use(async (req, res, next) => {
  const key = `rate-limit:${req.ip}`;
  
  const allowed = await limiter.isAllowed(key);
  
  if (!allowed) {
    return res.status(429).json({
      error: 'Too many requests'
    });
  }
  
  next();
});
```

---

## Practice Tips

1. **Run the examples**: All code samples are runnable - test them locally
2. **Understand trade-offs**: Know when to use clusters vs alternatives
3. **Monitor in production**: Always track worker health and performance
4. **Practice debugging**: Use `node --inspect` with workers
5. **Study PM2 source**: Learn from production-grade clustering implementation

---

## Additional Resources

- [Node.js Cluster Documentation](https://nodejs.org/api/cluster.html)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [Zero Downtime Deployments](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Worker Threads vs Cluster](https://nodejs.org/api/worker_threads.html)
