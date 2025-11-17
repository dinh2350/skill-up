# How does Node.js handle child processes?

## Short Answer

Node.js handles child processes through the **`child_process` module**, which allows you to spawn and manage separate processes. This enables Node.js to execute external commands, run other scripts, and perform CPU-intensive tasks without blocking the main event loop.

```javascript
const { spawn, exec, execFile, fork } = require("child_process");

// 4 methods to create child processes:

// 1. spawn() - Stream interface, for large data
const ls = spawn("ls", ["-lh", "/usr"]);

// 2. exec() - Buffer interface, for small output
exec("ls -lh /usr", (error, stdout, stderr) => {
  console.log(stdout);
});

// 3. execFile() - Like exec but directly executes file
execFile("node", ["--version"], (error, stdout) => {
  console.log(stdout);
});

// 4. fork() - Special case of spawn for Node.js scripts with IPC
const child = fork("child.js");
child.send({ message: "Hello from parent" });
```

**Key differences:**

- **`spawn()`**: Streaming, best for large output
- **`exec()`**: Buffered, runs shell commands
- **`execFile()`**: Buffered, no shell (more secure)
- **`fork()`**: Creates Node.js process with IPC channel

## Detailed Answer

### The child_process Module

Node.js is single-threaded, but the `child_process` module allows you to create additional processes to handle tasks in parallel.

#### Why Use Child Processes?

1. **CPU-intensive tasks** - Offload heavy computation
2. **Run system commands** - Execute shell commands
3. **Parallel processing** - Run multiple tasks simultaneously
4. **Memory isolation** - Separate memory space per process
5. **Language interop** - Run programs in other languages

### Method 1: spawn()

`spawn()` creates a new process with a streaming interface. Best for handling large amounts of data.

#### Basic Usage

```javascript
const { spawn } = require("child_process");

// Spawn a child process
const ls = spawn("ls", ["-lh", "/usr"]);

// Listen to stdout (streaming)
ls.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

// Listen to stderr
ls.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

// Process exit
ls.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});

// Process error
ls.on("error", (err) => {
  console.error("Failed to start child process:", err);
});
```

#### spawn() with Options

```javascript
const child = spawn("node", ["script.js"], {
  cwd: "/path/to/directory", // Working directory
  env: { NODE_ENV: "production" }, // Environment variables
  stdio: "inherit", // Inherit parent's stdio
  detached: false, // Run independently
  shell: false, // Don't spawn shell
});
```

#### stdio Options

```javascript
// 'pipe' - Create pipe (default)
const child1 = spawn("ls", [], { stdio: "pipe" });

// 'inherit' - Inherit parent's stdio
const child2 = spawn("ls", [], { stdio: "inherit" });

// 'ignore' - Ignore child's stdio
const child3 = spawn("ls", [], { stdio: "ignore" });

// Array - Specify for stdin, stdout, stderr
const child4 = spawn("ls", [], {
  stdio: ["pipe", "pipe", "inherit"],
});

// 'ipc' - Create IPC channel
const child5 = spawn("node", ["script.js"], {
  stdio: ["pipe", "pipe", "pipe", "ipc"],
});
```

#### Piping Data to Child Process

```javascript
const { spawn } = require("child_process");

// Pipe data through child process
const grep = spawn("grep", ["ssh"]);

grep.stdout.on("data", (data) => {
  console.log(`Matches: ${data}`);
});

// Write to stdin
grep.stdin.write("Line with ssh\n");
grep.stdin.write("Another line\n");
grep.stdin.write("Line with ssh again\n");
grep.stdin.end();
```

#### Chaining Child Processes

```javascript
const { spawn } = require("child_process");

// Chain: ls | grep node | wc -l
const ls = spawn("ls", ["-lh"]);
const grep = spawn("grep", ["node"]);
const wc = spawn("wc", ["-l"]);

// Pipe ls output to grep
ls.stdout.pipe(grep.stdin);

// Pipe grep output to wc
grep.stdout.pipe(wc.stdin);

// Get final result
wc.stdout.on("data", (data) => {
  console.log(`Number of lines with 'node': ${data}`);
});
```

### Method 2: exec()

`exec()` runs a command in a shell and buffers the output. Best for small output.

#### Basic Usage

```javascript
const { exec } = require("child_process");

exec("ls -lh", (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }

  console.log(`stdout: ${stdout}`);

  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
});
```

#### exec() with Options

```javascript
const options = {
  cwd: "/path/to/directory",
  env: { NODE_ENV: "production" },
  encoding: "utf8",
  timeout: 5000, // Kill after 5 seconds
  maxBuffer: 1024 * 1024, // 1MB buffer (default: 200KB)
  killSignal: "SIGTERM",
  shell: "/bin/bash",
};

exec("your-command", options, (error, stdout, stderr) => {
  // Handle output
});
```

#### exec() Returns ChildProcess

```javascript
const child = exec("node script.js");

// Listen to events
child.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

child.on("exit", (code) => {
  console.log(`Process exited with code ${code}`);
});

// Kill process
setTimeout(() => {
  child.kill("SIGTERM");
}, 5000);
```

#### exec() with Promises

```javascript
const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function runCommand() {
  try {
    const { stdout, stderr } = await exec("ls -lh");
    console.log("stdout:", stdout);
    if (stderr) console.error("stderr:", stderr);
  } catch (error) {
    console.error("Error:", error);
  }
}

runCommand();
```

### Method 3: execFile()

`execFile()` is similar to `exec()` but executes a file directly without spawning a shell (more efficient and secure).

#### Basic Usage

```javascript
const { execFile } = require("child_process");

// Execute node directly
execFile("node", ["--version"], (error, stdout, stderr) => {
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Node version:", stdout);
});

// Execute script
execFile("/path/to/script.sh", (error, stdout, stderr) => {
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Output:", stdout);
});
```

#### execFile() vs exec()

```javascript
const { exec, execFile } = require("child_process");

// ❌ exec - spawns shell (less secure, slower)
exec("node --version", (error, stdout) => {
  console.log(stdout);
});

// ✅ execFile - no shell (more secure, faster)
execFile("node", ["--version"], (error, stdout) => {
  console.log(stdout);
});
```

### Method 4: fork()

`fork()` is a special case of `spawn()` specifically for spawning Node.js processes with IPC (Inter-Process Communication).

#### Basic Usage

```javascript
// parent.js
const { fork } = require("child_process");

const child = fork("child.js");

// Send message to child
child.send({ message: "Hello from parent", data: [1, 2, 3] });

// Receive message from child
child.on("message", (msg) => {
  console.log("Message from child:", msg);
});

child.on("exit", (code) => {
  console.log(`Child exited with code ${code}`);
});
```

```javascript
// child.js
process.on("message", (msg) => {
  console.log("Message from parent:", msg);

  // Process data
  const result = msg.data.reduce((a, b) => a + b, 0);

  // Send result back to parent
  process.send({ result: result });
});
```

#### fork() with Options

```javascript
const child = fork("worker.js", ["arg1", "arg2"], {
  cwd: "/path/to/directory",
  env: { WORKER_ID: "1" },
  silent: false, // Inherit stdio (default)
  execPath: "/usr/bin/node", // Path to Node.js executable
  execArgv: ["--max-old-space-size=4096"], // Node.js flags
});
```

#### Silent Mode (Capture Output)

```javascript
const child = fork("worker.js", [], { silent: true });

// Capture stdout
child.stdout.on("data", (data) => {
  console.log(`Worker stdout: ${data}`);
});

// Capture stderr
child.stderr.on("data", (data) => {
  console.error(`Worker stderr: ${data}`);
});
```

### Real-World Examples

#### Example 1: Running Shell Commands

```javascript
const { exec } = require("child_process");

// Get system information
function getSystemInfo() {
  return new Promise((resolve, reject) => {
    exec("uname -a", (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function main() {
  try {
    const info = await getSystemInfo();
    console.log("System:", info);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
```

#### Example 2: CPU-Intensive Task (Worker)

```javascript
// parent.js - Main process
const { fork } = require("child_process");

function computeHeavyTask(data) {
  return new Promise((resolve, reject) => {
    const worker = fork("worker.js");

    worker.send({ data });

    worker.on("message", (result) => {
      resolve(result);
      worker.kill();
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
async function main() {
  const data = Array.from({ length: 10000000 }, (_, i) => i);

  console.time("computation");
  const result = await computeHeavyTask(data);
  console.timeEnd("computation");

  console.log("Result:", result);
}

main();
```

```javascript
// worker.js - Worker process
process.on("message", ({ data }) => {
  // Heavy computation
  const sum = data.reduce((a, b) => a + b, 0);
  const avg = sum / data.length;

  // Send result back
  process.send({ sum, avg });
});
```

#### Example 3: Parallel Processing

```javascript
const { fork } = require("child_process");

async function processInParallel(tasks) {
  const workers = tasks.map((task, index) => {
    return new Promise((resolve, reject) => {
      const worker = fork("worker.js");

      worker.send({ task, index });

      worker.on("message", (result) => {
        resolve(result);
        worker.kill();
      });

      worker.on("error", reject);
    });
  });

  return Promise.all(workers);
}

// Usage
const tasks = [
  { type: "process", data: [1, 2, 3] },
  { type: "process", data: [4, 5, 6] },
  { type: "process", data: [7, 8, 9] },
];

processInParallel(tasks).then((results) => {
  console.log("All results:", results);
});
```

#### Example 4: Image Processing

```javascript
const { spawn } = require("child_process");
const fs = require("fs");

function resizeImage(inputPath, outputPath, width, height) {
  return new Promise((resolve, reject) => {
    // Using ImageMagick
    const convert = spawn("convert", [
      inputPath,
      "-resize",
      `${width}x${height}`,
      outputPath,
    ]);

    convert.on("close", (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    convert.on("error", reject);
  });
}

// Usage
resizeImage("photo.jpg", "thumbnail.jpg", 200, 200)
  .then((output) => console.log("Resized:", output))
  .catch((err) => console.error("Error:", err));
```

#### Example 5: File Compression

```javascript
const { spawn } = require("child_process");
const fs = require("fs");

function compressFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    const gzip = spawn("gzip", ["-c"]);

    input.pipe(gzip.stdin);
    gzip.stdout.pipe(output);

    output.on("finish", () => resolve(outputPath));
    gzip.on("error", reject);
    output.on("error", reject);
  });
}

// Usage
compressFile("large-file.txt", "large-file.txt.gz")
  .then((file) => console.log("Compressed:", file))
  .catch((err) => console.error("Error:", err));
```

#### Example 6: Video Processing

```javascript
const { spawn } = require("child_process");

function convertVideo(input, output, format = "mp4") {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      input,
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-strict",
      "experimental",
      output,
    ]);

    // Progress tracking
    ffmpeg.stderr.on("data", (data) => {
      console.log(`Progress: ${data}`);
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
convertVideo("input.avi", "output.mp4")
  .then((file) => console.log("Converted:", file))
  .catch((err) => console.error("Error:", err));
```

#### Example 7: Database Backup

```javascript
const { spawn } = require("child_process");
const fs = require("fs");

function backupDatabase(dbName, outputFile) {
  return new Promise((resolve, reject) => {
    const mysqldump = spawn("mysqldump", [
      "-u",
      "root",
      "-p",
      "password",
      dbName,
    ]);

    const output = fs.createWriteStream(outputFile);

    mysqldump.stdout.pipe(output);

    mysqldump.stderr.on("data", (data) => {
      console.error(`Error: ${data}`);
    });

    output.on("finish", () => {
      console.log("Backup complete");
      resolve(outputFile);
    });

    mysqldump.on("error", reject);
  });
}

// Usage
backupDatabase("mydb", "backup.sql")
  .then((file) => console.log("Backup saved:", file))
  .catch((err) => console.error("Backup failed:", err));
```

#### Example 8: Worker Pool Pattern

```javascript
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

// Usage
const pool = new WorkerPool("worker.js", 4);

async function main() {
  const tasks = Array.from({ length: 20 }, (_, i) => i);

  console.time("pool");
  const results = await Promise.all(
    tasks.map((task) => pool.exec({ value: task }))
  );
  console.timeEnd("pool");

  console.log("Results:", results);
  pool.destroy();
}

main();
```

### Process Communication (IPC)

#### Parent to Child

```javascript
// parent.js
const { fork } = require("child_process");
const child = fork("child.js");

// Send message
child.send({ type: "greeting", message: "Hello" });

// Send with callback
child.send({ type: "data", value: 123 }, (error) => {
  if (error) console.error("Send error:", error);
});
```

#### Child to Parent

```javascript
// child.js
process.on("message", (msg) => {
  console.log("Received:", msg);

  // Send response
  process.send({ type: "response", result: "OK" });
});
```

#### Bidirectional Communication

```javascript
// parent.js
const { fork } = require("child_process");
const child = fork("child.js");

child.on("message", (msg) => {
  if (msg.type === "request") {
    child.send({ type: "response", data: "processed" });
  }
});

child.send({ type: "init" });
```

```javascript
// child.js
process.on("message", (msg) => {
  if (msg.type === "init") {
    process.send({ type: "request", data: "need data" });
  }

  if (msg.type === "response") {
    console.log("Got response:", msg.data);
  }
});
```

### Process Management

#### Killing Processes

```javascript
const { spawn } = require("child_process");

const child = spawn("long-running-process");

// Kill with signal
child.kill("SIGTERM"); // Graceful termination
child.kill("SIGKILL"); // Force kill
child.kill("SIGINT"); // Interrupt (Ctrl+C)

// Check if process is running
console.log("PID:", child.pid);
console.log("Killed:", child.killed);
```

#### Detached Processes

```javascript
const { spawn } = require("child_process");
const fs = require("fs");

// Create detached process that continues after parent exits
const child = spawn("node", ["server.js"], {
  detached: true,
  stdio: [
    "ignore",
    fs.openSync("./out.log", "a"),
    fs.openSync("./err.log", "a"),
  ],
});

// Unreference so parent can exit
child.unref();

console.log("Started detached process:", child.pid);
```

#### Process Signals

```javascript
const { spawn } = require("child_process");

const child = spawn("node", ["script.js"]);

// Send custom signals
child.kill("SIGUSR1"); // User-defined signal 1
child.kill("SIGUSR2"); // User-defined signal 2
child.kill("SIGHUP"); // Hangup

// Handle in child process
// script.js
process.on("SIGUSR1", () => {
  console.log("Received SIGUSR1");
});

process.on("SIGTERM", () => {
  console.log("Graceful shutdown");
  process.exit(0);
});
```

### Error Handling

```javascript
const { spawn } = require("child_process");

const child = spawn("nonexistent-command");

// Error starting process
child.on("error", (err) => {
  console.error("Failed to start child process:", err);
});

// Process exited with error
child.on("exit", (code, signal) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
  }
  if (signal) {
    console.error(`Process killed with signal ${signal}`);
  }
});

// Stderr output
child.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

// Timeout handling
const timeout = setTimeout(() => {
  child.kill("SIGTERM");
  console.error("Process timeout");
}, 5000);

child.on("exit", () => {
  clearTimeout(timeout);
});
```

### Comparison Table

| Method         | Shell    | Streaming | Buffer | IPC      | Use Case                     |
| -------------- | -------- | --------- | ------ | -------- | ---------------------------- |
| **spawn()**    | Optional | ✅ Yes    | ❌ No  | Optional | Large output, real-time      |
| **exec()**     | ✅ Yes   | ❌ No     | ✅ Yes | ❌ No    | Shell commands, small output |
| **execFile()** | ❌ No    | ❌ No     | ✅ Yes | ❌ No    | Execute file, more secure    |
| **fork()**     | ❌ No    | ✅ Yes    | ❌ No  | ✅ Yes   | Node.js scripts, CPU tasks   |

### Best Practices

```javascript
// ✅ 1. Always handle errors
child.on("error", (err) => {
  console.error("Error:", err);
});

// ✅ 2. Handle process exit
child.on("exit", (code, signal) => {
  console.log(`Exited with code ${code}`);
});

// ✅ 3. Set timeouts for long-running processes
const timeout = setTimeout(() => {
  child.kill();
}, 30000);

child.on("exit", () => clearTimeout(timeout));

// ✅ 4. Use execFile instead of exec when possible
execFile("node", ["script.js"], callback); // More secure

// ✅ 5. Validate user input to prevent command injection
const { execFile } = require("child_process");
// ❌ BAD
exec(`ls ${userInput}`); // Command injection risk!

// ✅ GOOD
execFile("ls", [userInput], callback);

// ✅ 6. Use fork() for CPU-intensive tasks
const worker = fork("heavy-computation.js");

// ✅ 7. Limit concurrent child processes
const MAX_WORKERS = 4;
// Use worker pool pattern

// ✅ 8. Clean up child processes
process.on("exit", () => {
  child.kill();
});

// ✅ 9. Use stdio options appropriately
const child = spawn("command", [], {
  stdio: ["ignore", "pipe", "inherit"],
});

// ✅ 10. Handle stdout and stderr
child.stdout.on("data", (data) => {});
child.stderr.on("data", (data) => {});
```

### Key Takeaways

- ✅ Node.js uses **`child_process` module** to create child processes
- ✅ **4 methods**: spawn, exec, execFile, fork
- ✅ **spawn()**: Streaming interface, best for large data
- ✅ **exec()**: Buffered output, runs shell commands
- ✅ **execFile()**: Like exec but without shell (more secure)
- ✅ **fork()**: Special spawn for Node.js with IPC
- ✅ Use child processes for **CPU-intensive** tasks
- ✅ Use **fork()** for parallel Node.js processing
- ✅ Always **handle errors** and process exit
- ✅ Use **IPC** to communicate between processes
- ✅ Child processes have **separate memory** space
- ✅ **Validate input** to prevent command injection
- ✅ Set **timeouts** for long-running processes
- ✅ Use **worker pools** for managing multiple workers
- ✅ **Detached processes** continue after parent exits

### Further Reading

- [Node.js child_process documentation](https://nodejs.org/api/child_process.html)
- [spawn() vs exec() vs execFile() vs fork()](https://nodejs.org/api/child_process.html#child_process_asynchronous_process_creation)
- [Child Process IPC](https://nodejs.org/api/child_process.html#child_process_subprocess_send_message_sendhandle_options_callback)
- [Process Communication](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback)
- [Worker Threads vs Child Processes](https://nodejs.org/api/worker_threads.html)
