# What is the difference between `fork()` and `spawn()` in the `child_process` module?

## Short Answer

`fork()` and `spawn()` are both methods in Node.js's `child_process` module for creating child processes, but they serve different purposes:

**`spawn()`**:

- General-purpose method for spawning **any command** (system commands, executables)
- Streams data (stdin/stdout/stderr)
- No built-in IPC (Inter-Process Communication)
- More memory efficient for large data

**`fork()`**:

- Special case of `spawn()` specifically for **Node.js scripts**
- Creates a new V8 instance
- Built-in **IPC channel** for message passing
- Designed for running JavaScript files

```javascript
const { spawn, fork } = require("child_process");

// spawn - Run any command
const ls = spawn("ls", ["-lh"]);
ls.stdout.on("data", (data) => {
  console.log(`Output: ${data}`);
});

// fork - Run Node.js script with IPC
const child = fork("worker.js");
child.send({ message: "Hello from parent" });
child.on("message", (msg) => {
  console.log("From child:", msg);
});
```

## Detailed Answer

### Understanding spawn()

`spawn()` launches a new process with a given command and streams the I/O.

#### Basic spawn() Usage

```javascript
const { spawn } = require("child_process");

// Execute a system command
const ls = spawn("ls", ["-lh", "/usr"]);

// Handle stdout (streaming)
ls.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

// Handle stderr
ls.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

// Handle process exit
ls.on("close", (code) => {
  console.log(`Process exited with code ${code}`);
});

// Handle errors
ls.on("error", (err) => {
  console.error("Failed to start process:", err);
});
```

#### spawn() Characteristics

```javascript
const { spawn } = require("child_process");

// 1. Streams data (good for large output)
const find = spawn("find", ["/usr", "-name", "*.js"]);

find.stdout.on("data", (chunk) => {
  console.log(`Received ${chunk.length} bytes`);
});

// 2. Can spawn any executable
const python = spawn("python3", ["script.py"]);
const bash = spawn("bash", ["script.sh"]);
const node = spawn("node", ["script.js"]);

// 3. Options for stdio configuration
const child = spawn("command", ["arg1", "arg2"], {
  stdio: "pipe", // 'pipe', 'inherit', 'ignore', or array
  cwd: "/path/to/dir", // Working directory
  env: { ...process.env, CUSTOM: "value" },
  shell: false, // Don't use shell (more secure)
  detached: false, // Don't run independently
});

// 4. No built-in IPC
// To communicate, must use stdin/stdout/stderr
const echo = spawn("node", ["worker.js"]);
echo.stdin.write("data to child\n");
echo.stdout.on("data", (data) => {
  console.log("Response:", data.toString());
});
```

#### spawn() with Shell

```javascript
// Without shell (safer, faster)
const ls1 = spawn("ls", ["-lh"]);

// With shell (enables shell features like pipes, wildcards)
const ls2 = spawn("ls -lh | grep node", {
  shell: true,
});

// Using pipe manually (without shell)
const ls = spawn("ls", ["-lh"]);
const grep = spawn("grep", ["node"]);

ls.stdout.pipe(grep.stdin);
grep.stdout.on("data", (data) => {
  console.log(data.toString());
});
```

### Understanding fork()

`fork()` is a special case of `spawn()` designed specifically for running Node.js modules.

#### Basic fork() Usage

```javascript
// parent.js
const { fork } = require("child_process");

const child = fork("child.js");

// Send message to child
child.send({ type: "greeting", message: "Hello" });

// Receive message from child
child.on("message", (msg) => {
  console.log("Message from child:", msg);
});

// Handle exit
child.on("exit", (code) => {
  console.log(`Child exited with code ${code}`);
});
```

```javascript
// child.js
process.on("message", (msg) => {
  console.log("Message from parent:", msg);

  // Send response back
  process.send({ type: "response", result: "Processed" });
});
```

#### fork() Characteristics

```javascript
const { fork } = require("child_process");

// 1. Always spawns Node.js process
const child = fork("worker.js");

// 2. Built-in IPC channel
child.send({ data: "some data" });
child.on("message", (msg) => {
  console.log("Received:", msg);
});

// 3. Arguments passed to script
const childWithArgs = fork("worker.js", ["arg1", "arg2"]);
// In worker.js: process.argv[2] === 'arg1'

// 4. Options
const childWithOptions = fork("worker.js", [], {
  cwd: "/path/to/dir",
  env: { NODE_ENV: "production" },
  execPath: "/usr/bin/node", // Path to Node.js executable
  execArgv: ["--max-old-space-size=4096"], // Node.js flags
  silent: false, // false: inherit stdio, true: pipe stdio
  stdio: ["pipe", "pipe", "pipe", "ipc"], // Custom stdio
});

// 5. Silent mode (capture stdout/stderr)
const silent = fork("worker.js", [], { silent: true });

silent.stdout.on("data", (data) => {
  console.log(`Child stdout: ${data}`);
});

silent.stderr.on("data", (data) => {
  console.error(`Child stderr: ${data}`);
});
```

#### fork() IPC Communication

```javascript
// parent.js
const { fork } = require("child_process");
const child = fork("worker.js");

// Send different types of messages
child.send({ type: "start", config: { port: 3000 } });
child.send({ type: "process", data: [1, 2, 3, 4, 5] });
child.send({ type: "stop" });

// Handle responses
child.on("message", (msg) => {
  switch (msg.type) {
    case "ready":
      console.log("Worker is ready");
      break;
    case "result":
      console.log("Result:", msg.result);
      break;
    case "error":
      console.error("Error:", msg.error);
      break;
  }
});

// worker.js
process.on("message", (msg) => {
  switch (msg.type) {
    case "start":
      console.log("Starting with config:", msg.config);
      process.send({ type: "ready" });
      break;

    case "process":
      const sum = msg.data.reduce((a, b) => a + b, 0);
      process.send({ type: "result", result: sum });
      break;

    case "stop":
      console.log("Stopping worker");
      process.exit(0);
      break;
  }
});
```

### Key Differences

#### 1. Command vs Node.js Script

```javascript
// spawn - Can run ANY command
spawn("ls", ["-lh"]);
spawn("python3", ["script.py"]);
spawn("bash", ["script.sh"]);
spawn("node", ["script.js"]); // Can run Node.js too!

// fork - ONLY runs Node.js scripts
fork("script.js"); // Automatically uses Node.js
// fork('script.py');  // Won't work!
```

#### 2. IPC (Inter-Process Communication)

```javascript
// spawn - No built-in IPC
const spawned = spawn("node", ["worker.js"]);
// spawned.send() doesn't exist!
// Must use stdin/stdout for communication
spawned.stdin.write("message\n");
spawned.stdout.on("data", (data) => {
  console.log("Response:", data.toString());
});

// fork - Built-in IPC channel
const forked = fork("worker.js");
forked.send({ message: "data" }); // Built-in method
forked.on("message", (msg) => {
  // Built-in event
  console.log(msg);
});
```

#### 3. Memory and Resources

```javascript
// spawn - One process
const spawned = spawn("node", ["script.js"]);
// Runs as a single process

// fork - New V8 instance
const forked = fork("script.js");
// Creates new Node.js runtime with separate V8 instance
// More memory overhead but complete isolation
```

#### 4. stdio Configuration

```javascript
// spawn - Default stdio: pipe
const spawned = spawn("ls");
spawned.stdout.on("data", (data) => {
  console.log(data.toString());
});

// fork - Default stdio: ['pipe', 'pipe', 'pipe', 'ipc']
const forked = fork("worker.js");
// Has an additional IPC channel (4th stdio)
```

### Comparison Table

| Feature           | spawn()                  | fork()                   |
| ----------------- | ------------------------ | ------------------------ |
| **Purpose**       | Run any command          | Run Node.js scripts      |
| **Command**       | Any executable           | Always Node.js           |
| **IPC**           | ❌ No (manual via stdio) | ✅ Yes (built-in)        |
| **Communication** | stdin/stdout/stderr      | .send() / .on('message') |
| **V8 Instance**   | Depends on command       | ✅ New V8 instance       |
| **Memory**        | Lower for non-Node       | Higher (new runtime)     |
| **Use Case**      | System commands          | CPU-intensive JS tasks   |
| **Child Type**    | Any process              | Node.js process only     |
| **Shell**         | Optional                 | No shell                 |
| **Streaming**     | ✅ Yes                   | ✅ Yes (if silent: true) |

### When to Use Each

#### Use spawn() when:

```javascript
// 1. Running system commands
spawn("ls", ["-lh"]);
spawn("grep", ["pattern", "file.txt"]);

// 2. Running non-Node.js programs
spawn("python3", ["script.py"]);
spawn("ffmpeg", ["-i", "input.mp4", "output.avi"]);

// 3. Large output (streaming is efficient)
const find = spawn("find", ["/usr", "-name", "*.log"]);
find.stdout.on("data", (chunk) => {
  // Process large data in chunks
});

// 4. Don't need IPC between processes
const process = spawn("command", ["args"]);
// Just need to run a command and get output

// 5. More control over stdio
spawn("command", [], {
  stdio: ["ignore", "pipe", "inherit"],
});
```

#### Use fork() when:

```javascript
// 1. Running Node.js scripts
fork("worker.js");

// 2. Need IPC for communication
const worker = fork("worker.js");
worker.send({ task: "process" });
worker.on("message", (result) => {
  console.log(result);
});

// 3. CPU-intensive JavaScript tasks
const heavyWorker = fork("heavy-computation.js");
// Offload work to separate V8 instance

// 4. Worker pool pattern
const workers = Array.from({ length: 4 }, () => fork("worker.js"));
// Multiple Node.js workers

// 5. Need separate Node.js runtime
fork("isolated-script.js", [], {
  execArgv: ["--max-old-space-size=2048"],
});
// Each fork has its own memory limits
```

### Real-World Examples

#### Example 1: spawn() - Image Processing

```javascript
const { spawn } = require("child_process");
const fs = require("fs");

function resizeImage(input, output, width, height) {
  return new Promise((resolve, reject) => {
    const convert = spawn("convert", [
      input,
      "-resize",
      `${width}x${height}`,
      output,
    ]);

    convert.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    convert.on("error", reject);
  });
}

// Usage
resizeImage("photo.jpg", "thumbnail.jpg", 200, 200)
  .then((file) => console.log("Resized:", file))
  .catch((err) => console.error("Error:", err));
```

#### Example 2: fork() - CPU-Intensive Task

```javascript
// parent.js
const { fork } = require("child_process");

function calculatePrimes(max) {
  return new Promise((resolve, reject) => {
    const worker = fork("prime-worker.js");

    worker.send({ max });

    worker.on("message", (msg) => {
      if (msg.type === "result") {
        resolve(msg.primes);
        worker.kill();
      }
    });

    worker.on("error", reject);

    // Timeout
    setTimeout(() => {
      worker.kill();
      reject(new Error("Worker timeout"));
    }, 30000);
  });
}

// Usage
calculatePrimes(1000000)
  .then((primes) => console.log(`Found ${primes.length} primes`))
  .catch((err) => console.error("Error:", err));
```

```javascript
// prime-worker.js
function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

process.on("message", (msg) => {
  const { max } = msg;
  const primes = [];

  for (let i = 2; i <= max; i++) {
    if (isPrime(i)) {
      primes.push(i);
    }
  }

  process.send({ type: "result", primes });
});
```

#### Example 3: spawn() - Stream Processing

```javascript
const { spawn } = require("child_process");
const fs = require("fs");

function compressLargeFile(input, output) {
  return new Promise((resolve, reject) => {
    const inputStream = fs.createReadStream(input);
    const outputStream = fs.createWriteStream(output);
    const gzip = spawn("gzip", ["-c"]);

    inputStream.pipe(gzip.stdin);
    gzip.stdout.pipe(outputStream);

    outputStream.on("finish", () => resolve(output));
    gzip.on("error", reject);
    outputStream.on("error", reject);
  });
}

// Usage
compressLargeFile("large-file.txt", "large-file.txt.gz")
  .then((file) => console.log("Compressed:", file))
  .catch((err) => console.error("Error:", err));
```

#### Example 4: fork() - Worker Pool

```javascript
// worker-pool.js
const { fork } = require("child_process");

class WorkerPool {
  constructor(workerScript, poolSize = 4) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];

    this.initWorkers();
  }

  initWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = {
        process: fork(this.workerScript),
        busy: false,
        id: i,
      };

      worker.process.on("message", (result) => {
        if (worker.currentTask) {
          worker.currentTask.resolve(result);
          worker.currentTask = null;
        }
        worker.busy = false;
        this.processQueue();
      });

      worker.process.on("error", (err) => {
        if (worker.currentTask) {
          worker.currentTask.reject(err);
          worker.currentTask = null;
        }
        worker.busy = false;
        this.processQueue();
      });

      this.workers.push(worker);
    }
  }

  exec(data) {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find((w) => !w.busy);
    if (!availableWorker) return;

    const task = this.queue.shift();
    availableWorker.busy = true;
    availableWorker.currentTask = task;
    availableWorker.process.send(task.data);
  }

  destroy() {
    this.workers.forEach((w) => w.process.kill());
  }
}

module.exports = WorkerPool;

// Usage
const WorkerPool = require("./worker-pool");

async function main() {
  const pool = new WorkerPool("worker.js", 4);

  const tasks = Array.from({ length: 20 }, (_, i) => i);

  const results = await Promise.all(
    tasks.map((task) => pool.exec({ value: task }))
  );

  console.log("Results:", results);
  pool.destroy();
}

main();
```

#### Example 5: spawn() vs fork() Comparison

```javascript
const { spawn, fork } = require("child_process");

// Using spawn to run Node.js script (no IPC)
function runWithSpawn() {
  const child = spawn("node", ["worker.js"]);

  // Must use stdin/stdout for communication
  child.stdin.write(JSON.stringify({ task: "process" }) + "\n");

  child.stdout.on("data", (data) => {
    const result = JSON.parse(data.toString());
    console.log("Result from spawn:", result);
  });
}

// Using fork to run Node.js script (with IPC)
function runWithFork() {
  const child = fork("worker.js");

  // Built-in IPC
  child.send({ task: "process" });

  child.on("message", (result) => {
    console.log("Result from fork:", result);
  });
}

// worker.js for spawn
if (require.main === module) {
  process.stdin.on("data", (data) => {
    const msg = JSON.parse(data.toString());
    const result = { processed: msg.task };
    console.log(JSON.stringify(result));
  });
}

// worker.js for fork
process.on("message", (msg) => {
  const result = { processed: msg.task };
  process.send(result);
});
```

#### Example 6: spawn() - Database Backup

```javascript
const { spawn } = require("child_process");
const fs = require("fs");

function backupDatabase(dbName, outputFile) {
  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(outputFile);

    const mysqldump = spawn("mysqldump", [
      "-u",
      "root",
      "-p",
      process.env.DB_PASSWORD,
      dbName,
    ]);

    mysqldump.stdout.pipe(outputStream);

    mysqldump.stderr.on("data", (data) => {
      console.error(`Error: ${data}`);
    });

    outputStream.on("finish", () => {
      console.log("Backup complete");
      resolve(outputFile);
    });

    mysqldump.on("error", reject);
    outputStream.on("error", reject);
  });
}

// Usage
backupDatabase("mydb", "backup.sql")
  .then((file) => console.log("Backup saved:", file))
  .catch((err) => console.error("Backup failed:", err));
```

#### Example 7: fork() - Parallel Processing

```javascript
// parent.js
const { fork } = require("child_process");

async function processInParallel(items) {
  const chunks = chunkArray(items, Math.ceil(items.length / 4));

  const workers = chunks.map((chunk, index) => {
    return new Promise((resolve, reject) => {
      const worker = fork("processor.js");

      worker.send({ items: chunk, workerId: index });

      worker.on("message", (msg) => {
        resolve(msg.results);
        worker.kill();
      });

      worker.on("error", reject);
    });
  });

  const results = await Promise.all(workers);
  return results.flat();
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Usage
const items = Array.from({ length: 1000 }, (_, i) => i);
processInParallel(items)
  .then((results) => console.log("Processed:", results.length))
  .catch((err) => console.error("Error:", err));
```

```javascript
// processor.js
process.on("message", (msg) => {
  const { items, workerId } = msg;

  console.log(`Worker ${workerId} processing ${items.length} items`);

  // Simulate processing
  const results = items.map((item) => item * 2);

  process.send({ results });
});
```

#### Example 8: spawn() - Video Transcoding

```javascript
const { spawn } = require("child_process");
const path = require("path");

function transcodeVideo(input, output, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      resolution = "1280x720",
      bitrate = "1000k",
      codec = "libx264",
    } = options;

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      input,
      "-c:v",
      codec,
      "-b:v",
      bitrate,
      "-s",
      resolution,
      "-preset",
      "fast",
      output,
    ]);

    // Track progress
    ffmpeg.stderr.on("data", (data) => {
      const progress = data.toString();
      if (progress.includes("time=")) {
        console.log("Progress:", progress.match(/time=(\S+)/)?.[1]);
      }
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", reject);
  });
}

// Usage
transcodeVideo("input.mp4", "output.mp4", {
  resolution: "1920x1080",
  bitrate: "2000k",
})
  .then((file) => console.log("Transcoded:", file))
  .catch((err) => console.error("Error:", err));
```

### Best Practices

```javascript
// ✅ 1. Use fork() for Node.js scripts that need IPC
const worker = fork("worker.js");
worker.send({ data: "process this" });

// ✅ 2. Use spawn() for system commands
const ls = spawn("ls", ["-lh"]);

// ✅ 3. Always handle errors
child.on("error", (err) => {
  console.error("Error:", err);
});

// ✅ 4. Clean up child processes
process.on("exit", () => {
  child.kill();
});

// ✅ 5. Set timeouts for long-running processes
const timeout = setTimeout(() => {
  child.kill();
  console.error("Process timeout");
}, 30000);

child.on("exit", () => clearTimeout(timeout));

// ✅ 6. Handle both stdout and stderr
child.stdout.on("data", (data) => {
  console.log(data.toString());
});

child.stderr.on("data", (data) => {
  console.error(data.toString());
});

// ✅ 7. Use silent mode with fork() to capture output
const silent = fork("worker.js", [], { silent: true });
silent.stdout.on("data", (data) => {
  console.log("Output:", data.toString());
});

// ✅ 8. Validate data before sending via IPC
child.send({ type: "valid", data: validatedData });

// ✅ 9. Limit number of child processes
const maxWorkers = require("os").cpus().length;

// ✅ 10. Handle process exit codes
child.on("exit", (code, signal) => {
  if (code !== 0) {
    console.error(`Process failed with code ${code}`);
  }
  if (signal) {
    console.error(`Process killed with signal ${signal}`);
  }
});
```

### Common Mistakes

```javascript
// ❌ 1. Using fork() for non-Node.js commands
fork("python3"); // Won't work! Use spawn()

// ✅ Fix
spawn("python3", ["script.py"]);

// ❌ 2. Using spawn() when you need IPC
const child = spawn("node", ["worker.js"]);
child.send({ data: "test" }); // Error! .send() doesn't exist

// ✅ Fix
const child = fork("worker.js");
child.send({ data: "test" });

// ❌ 3. Not handling errors
const child = fork("worker.js");
// If worker crashes, parent might not know

// ✅ Fix
child.on("error", (err) => console.error(err));
child.on("exit", (code) => {
  if (code !== 0) console.error("Worker failed");
});

// ❌ 4. Memory leaks from not cleaning up
function createWorker() {
  const worker = fork("worker.js");
  // Worker never killed!
}

// ✅ Fix
let worker;
function createWorker() {
  worker = fork("worker.js");
}
process.on("exit", () => {
  if (worker) worker.kill();
});

// ❌ 5. Sending non-serializable data via IPC
child.send({ func: () => {} }); // Functions can't be serialized!

// ✅ Fix
child.send({ type: "action", data: "serializable" });
```

### Key Takeaways

- ✅ **spawn()** is for **any command**, **fork()** is for **Node.js scripts only**
- ✅ **fork()** has **built-in IPC** (.send() / .on('message'))
- ✅ **spawn()** requires **manual communication** via stdin/stdout
- ✅ **fork()** creates a **new V8 instance** (more memory)
- ✅ **spawn()** is more **memory efficient** for non-Node commands
- ✅ Use **fork()** for **CPU-intensive JavaScript** tasks
- ✅ Use **spawn()** for **system commands** and **large output**
- ✅ **fork()** is a **special case** of spawn()
- ✅ Both support **streaming** I/O
- ✅ Always **handle errors** and **clean up** child processes
- ✅ **fork()** is ideal for **worker pools**
- ✅ **spawn()** is ideal for **shell commands** and **external tools**
- ✅ Set **timeouts** for long-running processes
- ✅ Limit **concurrent child processes** based on CPU cores

### Further Reading

- [Node.js child_process.fork() documentation](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options)
- [Node.js child_process.spawn() documentation](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
- [Child Process IPC](https://nodejs.org/api/child_process.html#child_process_subprocess_send_message_sendhandle_options_callback)
- [Difference between spawn and fork](https://nodejs.org/api/child_process.html#child_process_asynchronous_process_creation)
- [Worker Threads vs Child Processes](https://nodejs.org/api/worker_threads.html)
