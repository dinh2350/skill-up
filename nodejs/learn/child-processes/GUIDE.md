# Node.js Child Processes - Complete Guide

## 📚 Documentation Structure

This comprehensive guide covers everything you need to know about Node.js child processes:

### 1. **README.md** - Overview & Theory
- What are child processes?
- Why use them?
- Method comparison table
- When to use each method
- Best practices overview

### 2. **Examples** - Hands-on Code

#### **01-spawn-examples.js**
Real-world examples using `spawn()`:
- ✅ File compression with progress
- ✅ Real-time log monitoring
- ✅ Video transcoding with FFmpeg
- ✅ Large file processing
- ✅ Running Python scripts
- ✅ Interactive processes
- ✅ Process with timeout

#### **02-exec-examples.js**
Real-world examples using `exec()`:
- ✅ Git operations
- ✅ System information gathering
- ✅ Database backups
- ✅ File search with wildcards
- ✅ Image optimization
- ✅ Running NPM scripts
- ✅ Log file analysis
- ✅ Environment setup checks
- ✅ Execute with retry logic

#### **03-execFile-examples.js**
Real-world examples using `execFile()`:
- ✅ Python data processing
- ✅ Node.js script execution
- ✅ Image resizing (ImageMagick)
- ✅ PDF generation
- ✅ Custom binary execution
- ✅ Shell script execution
- ✅ Safe execution with validation
- ✅ Batch file processing
- ✅ Resource-limited execution

#### **04-fork-examples.js**
Real-world examples using `fork()`:
- ✅ CPU-intensive calculations
- ✅ Parallel data processing
- ✅ Worker pool pattern
- ✅ Load balancing across cores
- ✅ Master-worker communication
- ✅ Error handling & recovery
- ✅ Graceful shutdown

#### **05-advanced-examples.js**
Production-ready patterns:
- ✅ Image processing service
- ✅ CSV transformation pipeline
- ✅ Report generation system
- ✅ Background job queue
- ✅ Auto-scaling workers
- ✅ Progress tracking
- ✅ Metrics & monitoring

### 3. **COMPARISON.md** - Deep Dive
- Detailed method comparison
- Security best practices
- Performance optimization
- Error handling patterns
- Memory management
- Production monitoring
- Common pitfalls
- Complete checklist

### 4. **INTERVIEW-QUESTIONS.md** - Prepare for Interviews
- 16 comprehensive Q&A
- Junior, Mid, and Senior level
- Real-world scenarios
- Code examples with explanations
- Design patterns
- System architecture

## 🚀 Quick Start

### Run Examples

```bash
# Install dependencies (if any)
npm install

# Run individual examples
node 01-spawn-examples.js
node 02-exec-examples.js
node 03-execFile-examples.js
node 04-fork-examples.js
node 05-advanced-examples.js

# Or use npm scripts
npm run example:spawn
npm run example:exec
npm run example:execFile
npm run example:fork
npm run example:advanced
npm run example:all
```

## 📖 Learning Path

### For Beginners
1. Start with **README.md** - understand the concepts
2. Read **01-spawn-examples.js** - simplest to understand
3. Try **02-exec-examples.js** - most commonly used
4. Study **COMPARISON.md** - learn when to use each method

### For Intermediate Developers
1. Review **03-execFile-examples.js** - security matters
2. Master **04-fork-examples.js** - IPC communication
3. Study **05-advanced-examples.js** - production patterns
4. Practice **INTERVIEW-QUESTIONS.md** (Q1-Q10)

### For Advanced Developers
1. Deep dive into **COMPARISON.md** - optimization techniques
2. Implement patterns from **05-advanced-examples.js**
3. Master **INTERVIEW-QUESTIONS.md** (Q11-Q16)
4. Build your own worker pool implementation

## 🎯 Key Concepts Summary

### Method Selection Guide

```
┌─────────────────────────────────────────┐
│       Need to execute something?        │
└────────────┬────────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
   Node.js?       External?
     │               │
     ├───────┐       ├──────────┐
     │       │       │          │
   Need    Just    Shell     Binary/
   IPC?    run?   command?   Script?
     │       │       │          │
   fork()  spawn() exec()   execFile()
```

### Security Priority

```
Most Secure → Least Secure
execFile() > spawn() > exec()

fork() - Secure (Node.js only, no shell)
```

### Performance Ranking

```
Fastest → Slowest
spawn() ≈ execFile() > fork() > exec()

spawn() - No shell overhead
execFile() - No shell overhead
fork() - Node.js runtime overhead
exec() - Shell + overhead
```

## 💡 Real-World Use Cases

### 1. Video Processing Platform
- **Method**: `spawn()` with FFmpeg
- **Why**: Streaming output, long-running, progress tracking
- **Example**: See `01-spawn-examples.js` - transcodeVideo()

### 2. CI/CD Pipeline
- **Method**: `exec()` for Git, `spawn()` for builds
- **Why**: Quick Git commands, long build processes
- **Example**: See `02-exec-examples.js` - getGitInfo()

### 3. Image Optimization Service
- **Method**: `execFile()` with ImageMagick
- **Why**: Security (user uploads), batch processing
- **Example**: See `03-execFile-examples.js` - resizeImage()

### 4. Data Analytics Pipeline
- **Method**: `fork()` with worker pool
- **Why**: CPU-intensive JS, parallel processing
- **Example**: See `04-fork-examples.js` - WorkerPool

### 5. Background Job Processor
- **Method**: `fork()` with queue system
- **Why**: Isolation, IPC, monitoring
- **Example**: See `05-advanced-examples.js` - BackgroundJobQueue

## 🔒 Security Checklist

- [ ] Never use user input directly in `exec()`
- [ ] Prefer `execFile()` over `exec()` when possible
- [ ] Whitelist allowed commands
- [ ] Sanitize and validate all inputs
- [ ] Set timeout limits
- [ ] Set maxBuffer limits
- [ ] Use least privilege principle
- [ ] Monitor for abnormal behavior
- [ ] Implement rate limiting
- [ ] Log all executions

## 📊 Performance Checklist

- [ ] Use worker pools instead of creating new processes
- [ ] Implement connection pooling
- [ ] Set appropriate concurrency limits
- [ ] Use streaming for large data
- [ ] Batch operations when possible
- [ ] Monitor memory usage
- [ ] Implement graceful shutdown
- [ ] Clean up event listeners
- [ ] Use SharedArrayBuffer for shared data
- [ ] Profile and benchmark regularly

## 🐛 Common Issues & Solutions

### Issue: "Error: spawn ENOENT"
**Cause**: Command not found or not in PATH
**Solution**: Use full path or check PATH environment
```javascript
// Instead of
spawn('python', ['script.py'])

// Use
spawn('/usr/bin/python3', ['script.py'])
// or
spawn('python3', ['script.py'], { env: { ...process.env, PATH: '/custom/path' }})
```

### Issue: "Error: stdout maxBuffer exceeded"
**Cause**: Output larger than buffer limit
**Solution**: Use spawn() or increase maxBuffer
```javascript
// Instead of
exec('large-output-command')

// Use
spawn('large-output-command')
// or
exec('command', { maxBuffer: 10 * 1024 * 1024 }) // 10MB
```

### Issue: Memory leaks
**Cause**: Event listeners not removed
**Solution**: Always clean up
```javascript
function createWorker() {
  const worker = fork('worker.js');
  
  // Clean up on exit
  worker.on('exit', () => {
    worker.removeAllListeners();
  });
  
  return worker;
}
```

### Issue: Zombie processes
**Cause**: Parent not handling child exit
**Solution**: Handle exit events
```javascript
const child = spawn('command');

child.on('exit', (code, signal) => {
  console.log('Process exited:', code, signal);
});

// Clean up on parent exit
process.on('exit', () => {
  child.kill();
});
```

## 📚 Additional Resources

### Official Documentation
- [Node.js Child Process Docs](https://nodejs.org/api/child_process.html)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)
- [Node.js Cluster](https://nodejs.org/api/cluster.html)

### Related Topics
- **Streams**: Understanding I/O in child processes
- **Event Emitters**: How child processes communicate
- **Buffer**: Managing binary data
- **Process**: Understanding Node.js process

### Tools & Libraries
- **pm2**: Process manager for Node.js
- **bull**: Redis-based queue for Node.js
- **node-worker-farm**: Worker pool implementation
- **child-process-promise**: Promisified child_process

## 🎓 Practice Exercises

### Exercise 1: Build a File Converter
Create a service that converts files between formats using child processes:
- Support multiple file types (images, videos, documents)
- Implement a queue system
- Add progress tracking
- Handle errors gracefully

### Exercise 2: Create a Distributed Task Runner
Build a system that distributes tasks across worker processes:
- Dynamic worker scaling
- Task prioritization
- Failure recovery
- Metrics dashboard

### Exercise 3: Build a Safe Code Executor
Create a sandboxed environment for running user code:
- Time limits
- Memory limits
- No network access
- Capture output safely

## 🤝 Contributing

Feel free to add more examples or improve existing ones!

## 📄 License

MIT - Feel free to use these examples in your projects.

---

**Last Updated**: 2024
**Node.js Version**: 14+

For questions or improvements, please open an issue or submit a pull request.
