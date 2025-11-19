# Child Processes: Complete Comparison & Best Practices

## Quick Reference Table

| Feature | spawn() | exec() | execFile() | fork() |
|---------|---------|--------|------------|--------|
| **Returns** | Stream | Buffer | Buffer | Child Process |
| **Uses Shell** | No (optional) | Yes | No | No |
| **Max Output** | Unlimited | 1MB default | 1MB default | Unlimited |
| **IPC Channel** | No | No | No | Yes |
| **Best For** | Large data, long processes | Quick commands | Binary execution | Node.js processes |
| **Performance** | Fast | Slower (shell) | Fast | Medium (Node runtime) |
| **Security** | High | Low (shell injection) | High | High |

## When to Use Each Method

### Use `spawn()` When:

✅ **You need to:**
- Process large amounts of data (streaming)
- Monitor real-time output (logs, progress)
- Run long-running processes (video encoding, file processing)
- Have better performance without shell overhead

❌ **Don't use when:**
- You need shell features (pipes, wildcards)
- Output is small and you need it all at once
- You want simpler code for quick commands

**Real-World Examples:**
```javascript
// ✅ Good: Video transcoding (large data, long process)
const ffmpeg = spawn('ffmpeg', ['-i', 'input.mp4', 'output.avi']);

// ✅ Good: Real-time log monitoring
const tail = spawn('tail', ['-f', '/var/log/app.log']);

// ✅ Good: Large file compression
const tar = spawn('tar', ['-czf', 'archive.tar.gz', 'directory/']);

// ❌ Bad: Simple command with small output
const ls = spawn('ls', ['-la']); // Use exec() instead
```

### Use `exec()` When:

✅ **You need to:**
- Run quick shell commands
- Use shell features (pipes, wildcards, redirects)
- Get complete output at once (small size)
- Execute multiple commands together

❌ **Don't use when:**
- Output is larger than buffer limit (default 1MB)
- Security is critical (user input risk)
- You don't need shell features
- Process is long-running

**Real-World Examples:**
```javascript
// ✅ Good: Git commands
exec('git log -5 --oneline');

// ✅ Good: Shell pipelines
exec('cat file.txt | grep "error" | wc -l');

// ✅ Good: Using wildcards
exec('rm -f *.tmp');

// ✅ Good: Multiple commands
exec('cd /tmp && ls -la && pwd');

// ❌ Bad: Large output
exec('find / -name "*.js"'); // Could exceed buffer limit

// ❌ Bad: User input without sanitization
exec(`rm -rf ${userInput}`); // DANGEROUS!
```

### Use `execFile()` When:

✅ **You need to:**
- Execute a specific binary or script
- Prioritize security (no shell injection)
- Have better performance than exec()
- Run external programs with arguments

❌ **Don't use when:**
- You need shell features
- You're running shell commands (use exec)
- You need streaming output (use spawn)

**Real-World Examples:**
```javascript
// ✅ Good: Execute Python script
execFile('python', ['script.py', 'arg1', 'arg2']);

// ✅ Good: Run ImageMagick
execFile('convert', ['input.jpg', '-resize', '800x600', 'output.jpg']);

// ✅ Good: Safe execution with user input
execFile('node', ['user-script.js', sanitizedInput]);

// ❌ Bad: Shell command
execFile('ls -la'); // Won't work, use exec or spawn

// ❌ Bad: Need shell features
execFile('find', ['/', '-name', '*.js', '|', 'grep', 'test']); // Pipe won't work
```

### Use `fork()` When:

✅ **You need to:**
- Run CPU-intensive Node.js code
- Communicate between parent and child (IPC)
- Distribute workload across CPU cores
- Create worker pools for Node.js tasks

❌ **Don't use when:**
- Running non-Node.js programs
- You don't need IPC communication
- Worker threads would be sufficient
- Memory overhead is a concern

**Real-World Examples:**
```javascript
// ✅ Good: Heavy calculations
const worker = fork('heavy-calculation.js');
worker.send({ data: largeDataset });
worker.on('message', (result) => console.log(result));

// ✅ Good: Parallel data processing
const workers = Array.from({ length: cpus }, () => fork('processor.js'));

// ✅ Good: Background job processing
const jobWorker = fork('job-worker.js');
jobWorker.send({ type: 'email', data: emailData });

// ❌ Bad: Running shell commands
fork('ls-command.js'); // Use spawn/exec instead

// ❌ Bad: No communication needed
fork('standalone-script.js'); // Use spawn instead
```

## Security Best Practices

### 1. Never Trust User Input

```javascript
// ❌ DANGEROUS - Shell injection vulnerability
const userInput = req.query.filename;
exec(`cat ${userInput}`); // User can inject: "file.txt && rm -rf /"

// ✅ SAFE - Use execFile with array arguments
execFile('cat', [userInput]);

// ✅ SAFE - Sanitize and validate
const sanitized = userInput.replace(/[^a-zA-Z0-9.-]/g, '');
execFile('cat', [sanitized]);
```

### 2. Whitelist Allowed Commands

```javascript
// ✅ Good practice
const allowedCommands = {
  'backup': { cmd: 'tar', args: ['-czf'] },
  'list': { cmd: 'ls', args: ['-la'] }
};

function safeExecute(commandName, userArgs) {
  const command = allowedCommands[commandName];
  if (!command) throw new Error('Command not allowed');
  
  execFile(command.cmd, [...command.args, ...userArgs]);
}
```

### 3. Set Resource Limits

```javascript
// ✅ Always set timeout
exec('long-command', { timeout: 5000 }, (error) => {
  if (error && error.killed) {
    console.log('Process timeout');
  }
});

// ✅ Set maximum buffer size
exec('command', { maxBuffer: 1024 * 1024 }); // 1MB

// ✅ Kill signal for cleanup
spawn('process', [], { killSignal: 'SIGTERM' });
```

## Performance Optimization

### 1. Use Streaming for Large Data

```javascript
// ❌ Bad - Loads everything in memory
exec('cat huge-file.txt', { maxBuffer: 100 * 1024 * 1024 });

// ✅ Good - Stream processing
const cat = spawn('cat', ['huge-file.txt']);
cat.stdout.pipe(process.stdout);
```

### 2. Worker Pools for Repeated Tasks

```javascript
// ❌ Bad - Creates new process each time
function processData(data) {
  return new Promise((resolve) => {
    const worker = fork('processor.js');
    worker.send(data);
    worker.on('message', resolve);
  });
}

// ✅ Good - Reuse worker pool
class WorkerPool {
  constructor(size) {
    this.workers = Array.from({ length: size }, 
      () => fork('processor.js')
    );
    this.available = [...this.workers];
  }
  
  async execute(data) {
    const worker = await this.getAvailableWorker();
    return new Promise((resolve) => {
      worker.once('message', (result) => {
        this.available.push(worker);
        resolve(result);
      });
      worker.send(data);
    });
  }
  
  async getAvailableWorker() {
    while (this.available.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return this.available.shift();
  }
}
```

### 3. Batch Processing

```javascript
// ❌ Bad - One at a time
for (const file of files) {
  await processFile(file);
}

// ✅ Good - Controlled concurrency
async function batchProcess(items, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(item => processFile(item))
    );
    results.push(...batchResults);
  }
  return results;
}
```

## Error Handling Patterns

### 1. Proper Error Detection

```javascript
const child = spawn('command', ['args']);

// ✅ Handle all error scenarios
child.on('error', (error) => {
  // Failed to start or killed
  console.error('Spawn error:', error);
});

child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
  }
  if (signal) {
    console.error(`Process killed with signal ${signal}`);
  }
});

child.stderr.on('data', (data) => {
  console.error('stderr:', data.toString());
});
```

### 2. Retry Logic

```javascript
async function executeWithRetry(command, args, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await execFilePromise(command, args);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 3. Graceful Shutdown

```javascript
const workers = [];

// Graceful shutdown handler
async function shutdown() {
  console.log('Shutting down...');
  
  // Send shutdown signal
  workers.forEach(worker => {
    worker.send({ type: 'shutdown' });
  });
  
  // Wait for acknowledgment
  await Promise.all(workers.map(worker => {
    return new Promise(resolve => {
      worker.once('message', (msg) => {
        if (msg.type === 'shutdown_ack') resolve();
      });
      
      // Force kill after timeout
      setTimeout(() => {
        worker.kill('SIGTERM');
        resolve();
      }, 5000);
    });
  }));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

## Memory Management

### 1. Avoid Memory Leaks

```javascript
// ❌ Bad - Memory leak
function createWorker() {
  const worker = fork('worker.js');
  worker.on('message', handleMessage);
  // Event listener never removed!
}

// ✅ Good - Proper cleanup
function createWorker() {
  const worker = fork('worker.js');
  const handler = (msg) => handleMessage(msg);
  
  worker.on('message', handler);
  
  worker.on('exit', () => {
    worker.removeListener('message', handler);
  });
  
  return worker;
}
```

### 2. Monitor Memory Usage

```javascript
function monitorWorker(worker) {
  const interval = setInterval(() => {
    worker.send({ type: 'memory_check' });
  }, 5000);
  
  worker.on('message', (msg) => {
    if (msg.type === 'memory_stats') {
      const usage = msg.memoryUsage.heapUsed / 1024 / 1024;
      
      if (usage > 500) { // 500MB threshold
        console.warn('High memory usage:', usage.toFixed(2), 'MB');
        // Consider restarting worker
      }
    }
  });
  
  worker.on('exit', () => clearInterval(interval));
}
```

## Production Monitoring

### 1. Health Checks

```javascript
class ManagedWorker {
  constructor(scriptPath) {
    this.scriptPath = scriptPath;
    this.worker = null;
    this.lastHeartbeat = Date.now();
    this.start();
  }
  
  start() {
    this.worker = fork(this.scriptPath);
    
    // Heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.worker.send({ type: 'ping' });
      
      // Check for missed heartbeats
      if (Date.now() - this.lastHeartbeat > 30000) {
        console.error('Worker not responding, restarting...');
        this.restart();
      }
    }, 10000);
    
    this.worker.on('message', (msg) => {
      if (msg.type === 'pong') {
        this.lastHeartbeat = Date.now();
      }
    });
  }
  
  restart() {
    clearInterval(this.heartbeatInterval);
    this.worker.kill();
    this.start();
  }
}
```

### 2. Logging and Metrics

```javascript
function createInstrumentedWorker(scriptPath) {
  const worker = fork(scriptPath);
  const startTime = Date.now();
  
  let messagesProcessed = 0;
  let errors = 0;
  
  worker.on('message', (msg) => {
    messagesProcessed++;
    
    if (msg.type === 'error') {
      errors++;
    }
    
    // Log metrics every 100 messages
    if (messagesProcessed % 100 === 0) {
      const uptime = Date.now() - startTime;
      const rate = (messagesProcessed / uptime) * 1000;
      
      console.log({
        worker: worker.pid,
        messagesProcessed,
        errors,
        errorRate: (errors / messagesProcessed * 100).toFixed(2) + '%',
        messageRate: rate.toFixed(2) + '/sec',
        uptime: (uptime / 1000).toFixed(2) + 's'
      });
    }
  });
  
  return worker;
}
```

## Common Pitfalls to Avoid

### 1. ❌ Not Cleaning Up Resources

```javascript
// Bad
function badExample() {
  const worker = fork('worker.js');
  // Worker never killed, accumulates over time
}

// Good
function goodExample() {
  const worker = fork('worker.js');
  
  process.on('exit', () => {
    worker.kill();
  });
  
  return worker;
}
```

### 2. ❌ Synchronous Methods in Production

```javascript
// Bad - Blocks event loop
const result = execSync('long-command');

// Good - Non-blocking
exec('long-command', (error, stdout) => {
  // Handle result
});
```

### 3. ❌ Unbounded Concurrency

```javascript
// Bad - Could spawn thousands of processes
files.forEach(file => {
  fork('process-file.js').send({ file });
});

// Good - Limited concurrency
const pool = new WorkerPool(os.cpus().length);
for (const file of files) {
  await pool.execute({ file });
}
```

### 4. ❌ Ignoring Exit Codes

```javascript
// Bad
const child = spawn('command');
child.on('exit', () => {
  console.log('Done!'); // Might have failed!
});

// Good
const child = spawn('command');
child.on('exit', (code, signal) => {
  if (code === 0) {
    console.log('Success!');
  } else {
    console.error(`Failed with code ${code}, signal ${signal}`);
  }
});
```

## Summary Checklist

✅ **Security:**
- [ ] Never use user input directly in commands
- [ ] Use execFile() instead of exec() when possible
- [ ] Whitelist allowed commands
- [ ] Sanitize and validate all inputs

✅ **Performance:**
- [ ] Use streaming for large data
- [ ] Implement worker pools for repeated tasks
- [ ] Set appropriate concurrency limits
- [ ] Batch process when possible

✅ **Reliability:**
- [ ] Set timeouts on all processes
- [ ] Implement retry logic for transient failures
- [ ] Monitor process health
- [ ] Implement graceful shutdown

✅ **Resource Management:**
- [ ] Clean up event listeners
- [ ] Kill processes on exit
- [ ] Monitor memory usage
- [ ] Set buffer limits

✅ **Error Handling:**
- [ ] Handle all error events
- [ ] Check exit codes
- [ ] Log stderr output
- [ ] Implement fallback mechanisms
