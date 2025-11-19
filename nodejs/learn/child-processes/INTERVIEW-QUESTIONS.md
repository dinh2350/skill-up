# Node.js Child Processes - Interview Questions & Answers

## Junior Level Questions

### Q1: What is a child process in Node.js?

**Answer:**
A child process is a separate process created by a parent Node.js process. Node.js provides the `child_process` module that allows you to execute external commands, run scripts, and perform CPU-intensive operations without blocking the main event loop.

**Key Points:**
- Runs independently from parent process
- Has its own memory and resources
- Communicates with parent via IPC or stdio
- Can run system commands or other Node.js scripts

---

### Q2: What are the four main methods in the child_process module?

**Answer:**
1. **spawn()** - Launches a command in a new process with streaming I/O
2. **exec()** - Executes a command in a shell and buffers the output
3. **execFile()** - Executes a file directly without spawning a shell
4. **fork()** - Special case of spawn() for creating Node.js processes with IPC

---

### Q3: When would you use child processes?

**Answer:**
- **CPU-intensive operations** - Heavy calculations, image/video processing
- **External program execution** - Running system commands, calling Python/Ruby scripts
- **Parallel processing** - Distributing work across multiple cores
- **Isolation** - Running untrusted code safely in separate process
- **Long-running tasks** - Operations that would block the event loop

---

### Q4: What is the difference between spawn() and exec()?

**Answer:**
| spawn() | exec() |
|---------|--------|
| Returns a stream | Returns a buffer |
| No shell by default | Uses shell |
| Unlimited output | Limited output (1MB default) |
| Better for large data | Better for small output |
| Event-based | Callback-based |

**Example:**
```javascript
// spawn - for large output
const spawn = require('child_process').spawn;
const ls = spawn('ls', ['-lh', '/usr']);
ls.stdout.on('data', (data) => console.log(data));

// exec - for small output
const exec = require('child_process').exec;
exec('ls -lh /usr', (error, stdout) => {
  console.log(stdout);
});
```

---

### Q5: How do you handle errors in child processes?

**Answer:**
```javascript
const { spawn } = require('child_process');
const child = spawn('command', ['args']);

// 1. Handle spawn errors (failed to start)
child.on('error', (error) => {
  console.error('Failed to start:', error);
});

// 2. Handle stderr output
child.stderr.on('data', (data) => {
  console.error('stderr:', data.toString());
});

// 3. Handle exit codes
child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
  }
});
```

---

## Mid-Level Questions

### Q6: Explain the difference between exec() and execFile().

**Answer:**
- **exec()** spawns a shell and executes the command within that shell
  - Supports shell features: pipes, wildcards, redirects
  - More vulnerable to shell injection attacks
  - Slightly slower due to shell overhead

- **execFile()** executes the file directly without spawning a shell
  - More secure (no shell parsing)
  - Better performance
  - No shell features available
  - Arguments passed as array

**Security Example:**
```javascript
const userInput = "file.txt && rm -rf /"; // Malicious input

// UNSAFE - Shell injection vulnerability
exec(`cat ${userInput}`); // WILL DELETE FILES!

// SAFE - No shell, arguments are escaped
execFile('cat', [userInput]); // Just tries to read that filename
```

---

### Q7: What is IPC and how does it work with fork()?

**Answer:**
IPC (Inter-Process Communication) is a channel for communication between parent and child processes. When using `fork()`, Node.js creates an IPC channel automatically.

**Key Features:**
- Bidirectional communication
- Message-based (JSON serializable objects)
- Asynchronous
- Uses Unix domain sockets or named pipes

**Example:**
```javascript
// parent.js
const { fork } = require('child_process');
const child = fork('child.js');

// Send message to child
child.send({ type: 'task', data: [1, 2, 3] });

// Receive message from child
child.on('message', (message) => {
  console.log('Result:', message.result);
});

// child.js
process.on('message', (message) => {
  const result = message.data.reduce((a, b) => a + b, 0);
  process.send({ result });
});
```

---

### Q8: How do you implement a worker pool pattern?

**Answer:**
```javascript
class WorkerPool {
  constructor(workerScript, size = os.cpus().length) {
    this.workers = [];
    this.queue = [];
    
    // Create workers
    for (let i = 0; i < size; i++) {
      const worker = fork(workerScript);
      worker.isReady = true;
      
      worker.on('message', (msg) => {
        worker.currentTask.resolve(msg.result);
        worker.isReady = true;
        this.processNext();
      });
      
      this.workers.push(worker);
    }
  }
  
  execute(data) {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.processNext();
    });
  }
  
  processNext() {
    if (this.queue.length === 0) return;
    
    const worker = this.workers.find(w => w.isReady);
    if (!worker) return;
    
    const task = this.queue.shift();
    worker.isReady = false;
    worker.currentTask = task;
    worker.send({ data: task.data });
  }
}
```

**Benefits:**
- Reuses workers (avoids spawn overhead)
- Controls concurrency
- Efficient resource usage
- Load balancing

---

### Q9: What happens if a child process crashes?

**Answer:**
When a child process crashes:

1. **Exit event** fires on the child process object
2. **Exit code** will be non-zero (or null if killed by signal)
3. **Parent process** continues running
4. **Resources** are released
5. **Event listeners** should be cleaned up

**Handling:**
```javascript
function createResilientWorker(scriptPath, maxRestarts = 3) {
  let restarts = 0;
  
  function start() {
    const worker = fork(scriptPath);
    
    worker.on('exit', (code, signal) => {
      if (code !== 0 && restarts < maxRestarts) {
        console.log(`Worker crashed, restarting... (${++restarts}/${maxRestarts})`);
        setTimeout(() => start(), 1000); // Exponential backoff better
      } else if (restarts >= maxRestarts) {
        console.error('Max restarts reached, giving up');
      }
    });
    
    return worker;
  }
  
  return start();
}
```

---

### Q10: How do you implement timeout for child processes?

**Answer:**
```javascript
function executeWithTimeout(command, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let output = '';
    let killed = false;
    
    // Set timeout
    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      
      // Force kill after grace period
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 1000);
      
      reject(new Error('Process timeout'));
    }, timeoutMs);
    
    child.stdout.on('data', (data) => {
      output += data;
    });
    
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (!killed) {
        resolve(output);
      }
    });
  });
}
```

---

## Senior Level Questions

### Q11: Explain the complete Node.js event loop and how child processes fit in.

**Answer:**
The Node.js event loop has several phases:

1. **Timers** - setTimeout/setInterval callbacks
2. **Pending callbacks** - I/O callbacks deferred from previous iteration
3. **Idle, prepare** - Internal use
4. **Poll** - Retrieve new I/O events
5. **Check** - setImmediate callbacks
6. **Close callbacks** - close events

**Child Processes and Event Loop:**
- Child processes are handled through **libuv**
- Process creation is **asynchronous** (doesn't block event loop)
- I/O from child processes enters **poll phase**
- `process.nextTick()` in child processes vs parent:
  ```javascript
  // Parent process
  const child = fork('child.js');
  
  // This runs in parent's event loop
  process.nextTick(() => console.log('Parent nextTick'));
  
  // Child runs in its own event loop
  // child.js
  process.nextTick(() => console.log('Child nextTick'));
  ```

---

### Q12: How would you design a scalable job queue system using child processes?

**Answer:**
```javascript
class ScalableJobQueue {
  constructor(config = {}) {
    this.maxWorkers = config.maxWorkers || os.cpus().length;
    this.minWorkers = config.minWorkers || 1;
    this.scaleUpThreshold = config.scaleUpThreshold || 10;
    this.scaleDownThreshold = config.scaleDownThreshold || 2;
    
    this.workers = new Map();
    this.queue = [];
    this.activeJobs = new Map();
    this.metrics = {
      processed: 0,
      failed: 0,
      avgProcessTime: 0
    };
    
    this.initWorkers(this.minWorkers);
    this.startAutoScaling();
  }
  
  initWorkers(count) {
    for (let i = 0; i < count; i++) {
      this.createWorker();
    }
  }
  
  createWorker() {
    const worker = fork('./worker.js');
    const workerId = worker.pid;
    
    this.workers.set(workerId, {
      process: worker,
      busy: false,
      processed: 0,
      created: Date.now()
    });
    
    worker.on('message', (msg) => 
      this.handleWorkerMessage(workerId, msg)
    );
    
    worker.on('exit', () => {
      this.workers.delete(workerId);
      if (this.workers.size < this.minWorkers) {
        this.createWorker();
      }
    });
  }
  
  startAutoScaling() {
    setInterval(() => {
      const queueSize = this.queue.length;
      const workerCount = this.workers.size;
      
      // Scale up
      if (queueSize > this.scaleUpThreshold && 
          workerCount < this.maxWorkers) {
        console.log('Scaling up workers');
        this.createWorker();
      }
      
      // Scale down
      if (queueSize < this.scaleDownThreshold && 
          workerCount > this.minWorkers) {
        const idleWorker = [...this.workers.entries()]
          .find(([id, w]) => !w.busy && 
            Date.now() - w.created > 60000);
        
        if (idleWorker) {
          console.log('Scaling down workers');
          idleWorker[1].process.kill();
        }
      }
    }, 5000);
  }
  
  async enqueue(job) {
    return new Promise((resolve, reject) => {
      const jobId = generateId();
      this.queue.push({ jobId, job, resolve, reject });
      this.processQueue();
    });
  }
  
  // ... rest of implementation
}
```

**Key Design Decisions:**
- Auto-scaling based on queue size
- Metrics tracking for monitoring
- Worker lifecycle management
- Graceful shutdown
- Error handling and retries

---

### Q13: What are the security implications of using child processes?

**Answer:**

**Major Security Risks:**

1. **Command Injection**
```javascript
// VULNERABLE
const filename = req.query.file;
exec(`cat ${filename}`); // User can inject: "file; rm -rf /"

// SECURE
execFile('cat', [filename]);
```

2. **Path Traversal**
```javascript
// VULNERABLE
const script = req.body.script;
fork(`./scripts/${script}`); // User can inject: "../../../etc/passwd"

// SECURE
const allowedScripts = ['worker1.js', 'worker2.js'];
if (!allowedScripts.includes(script)) {
  throw new Error('Invalid script');
}
fork(`./scripts/${script}`);
```

3. **Resource Exhaustion**
```javascript
// VULNERABLE
app.post('/process', (req, res) => {
  fork('heavy-task.js'); // No limit, can spawn unlimited processes
});

// SECURE
const pool = new WorkerPool(maxWorkers);
app.post('/process', async (req, res) => {
  try {
    const result = await pool.execute(req.body);
    res.json(result);
  } catch (err) {
    res.status(429).json({ error: 'Too many requests' });
  }
});
```

**Best Practices:**
- ✅ Use `execFile()` instead of `exec()` when possible
- ✅ Whitelist allowed commands and paths
- ✅ Validate and sanitize all inputs
- ✅ Set resource limits (timeout, maxBuffer, memory)
- ✅ Run with least privileges (drop privileges if needed)
- ✅ Use sandboxing (containers, VMs) for untrusted code
- ✅ Monitor for abnormal behavior

---

### Q14: How do you handle inter-process communication at scale?

**Answer:**

**Challenges at Scale:**
- Message serialization overhead
- IPC channel congestion
- Memory pressure from buffering
- Coordinating multiple workers

**Solutions:**

1. **Message Batching**
```javascript
class BatchedIPC {
  constructor(worker, batchSize = 10, flushInterval = 100) {
    this.worker = worker;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.buffer = [];
    this.timer = null;
  }
  
  send(message) {
    this.buffer.push(message);
    
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }
  
  flush() {
    if (this.buffer.length === 0) return;
    
    this.worker.send({ batch: this.buffer });
    this.buffer = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
```

2. **Shared Memory (via SharedArrayBuffer)**
```javascript
// Parent
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

const worker = fork('worker.js');
worker.send({ sharedBuffer }, (err) => {
  if (err) console.error(err);
});

// Write to shared memory (atomic operations)
Atomics.store(sharedArray, 0, 42);

// Worker
let sharedArray;
process.on('message', (msg) => {
  sharedArray = new Int32Array(msg.sharedBuffer);
  const value = Atomics.load(sharedArray, 0);
  console.log('Read from shared memory:', value);
});
```

3. **External Message Queue**
```javascript
// For large-scale systems, use Redis/RabbitMQ
const Redis = require('ioredis');
const pub = new Redis();
const sub = new Redis();

// Parent publishes tasks
pub.publish('tasks', JSON.stringify({ type: 'process', data: {} }));

// Workers subscribe
sub.subscribe('tasks');
sub.on('message', (channel, message) => {
  const task = JSON.parse(message);
  // Process task
});
```

---

### Q15: Compare child processes, worker threads, and cluster module. When to use each?

**Answer:**

| Feature | Child Processes | Worker Threads | Cluster |
|---------|----------------|----------------|---------|
| **Use Case** | External commands, isolation | CPU-intensive JS | Load balancing HTTP |
| **Memory** | Separate | Shared | Separate |
| **Startup** | Slow (~30ms) | Fast (~1ms) | Medium |
| **IPC** | Yes | Yes (faster) | Yes |
| **Language** | Any | JavaScript only | JavaScript only |
| **Isolation** | Full | Partial | Full |

**Decision Tree:**

```
Need to run external programs? 
  → YES: Use Child Processes (spawn/exec/execFile)

CPU-intensive JavaScript work?
  → Need full isolation? 
    → YES: Use Child Processes (fork)
    → NO: Use Worker Threads (faster, shared memory)

HTTP server load balancing?
  → Use Cluster module

Need to process many small tasks quickly?
  → Worker Threads (lower overhead)

Need to process large tasks with isolation?
  → Child Processes (fork)
```

**Examples:**

```javascript
// 1. Child Process - Running Python script
const { execFile } = require('child_process');
execFile('python', ['ml-model.py'], (err, stdout) => {
  console.log('Model output:', stdout);
});

// 2. Worker Thread - Heavy JS calculation
const { Worker } = require('worker_threads');
const worker = new Worker('./fibonacci.js');
worker.postMessage({ n: 40 });
worker.on('message', (result) => {
  console.log('Fibonacci result:', result);
});

// 3. Cluster - HTTP server
const cluster = require('cluster');
if (cluster.isMaster) {
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  require('./app').listen(3000);
}
```

---

## Practical Scenario Questions

### Q16: Design a system to process 1 million images with thumbnails

**Answer:**
```javascript
class ImageProcessingSystem {
  constructor() {
    this.poolSize = os.cpus().length;
    this.pool = [];
    this.queue = [];
    this.processed = 0;
    this.failed = 0;
    
    this.initPool();
  }
  
  initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = fork('./image-worker.js');
      this.pool.push({
        worker,
        busy: false
      });
      
      worker.on('message', (msg) => {
        if (msg.type === 'complete') {
          this.processed++;
          this.handleWorkerComplete(worker, msg);
        } else if (msg.type === 'error') {
          this.failed++;
          this.handleWorkerError(worker, msg);
        }
      });
    }
  }
  
  async processImages(imagePaths) {
    console.log(`Processing ${imagePaths.length} images...`);
    
    // Process in chunks to avoid memory issues
    const chunkSize = 10000;
    for (let i = 0; i < imagePaths.length; i += chunkSize) {
      const chunk = imagePaths.slice(i, i + chunkSize);
      await this.processChunk(chunk);
      
      console.log(`Progress: ${this.processed}/${imagePaths.length}`);
    }
    
    return {
      processed: this.processed,
      failed: this.failed
    };
  }
  
  processChunk(images) {
    return Promise.all(
      images.map(image => this.processOne(image))
    );
  }
  
  processOne(imagePath) {
    return new Promise((resolve, reject) => {
      this.queue.push({ imagePath, resolve, reject });
      this.processQueue();
    });
  }
  
  processQueue() {
    if (this.queue.length === 0) return;
    
    const availableWorker = this.pool.find(w => !w.busy);
    if (!availableWorker) return;
    
    const task = this.queue.shift();
    availableWorker.busy = true;
    availableWorker.currentTask = task;
    
    availableWorker.worker.send({
      type: 'process',
      imagePath: task.imagePath,
      operations: {
        thumbnail: { width: 150, height: 150 },
        medium: { width: 800, height: 600 }
      }
    });
  }
  
  handleWorkerComplete(worker, msg) {
    const workerInfo = this.pool.find(w => w.worker === worker);
    if (workerInfo.currentTask) {
      workerInfo.currentTask.resolve(msg.result);
    }
    workerInfo.busy = false;
    this.processQueue();
  }
  
  handleWorkerError(worker, msg) {
    const workerInfo = this.pool.find(w => w.worker === worker);
    if (workerInfo.currentTask) {
      workerInfo.currentTask.reject(new Error(msg.error));
    }
    workerInfo.busy = false;
    this.processQueue();
  }
}
```

**Key Considerations:**
- Chunk processing to manage memory
- Worker pool for efficiency
- Error handling and retry logic
- Progress tracking
- Graceful shutdown

---

## Conclusion

Understanding child processes is crucial for building scalable Node.js applications. Key takeaways:

1. **Choose the right method** - spawn/exec/execFile/fork each has its use case
2. **Security first** - Always sanitize inputs, use whitelists
3. **Resource management** - Set limits, implement pooling
4. **Error handling** - Handle all failure modes
5. **Monitoring** - Track metrics, implement health checks
6. **Testing** - Mock child processes, test failure scenarios
