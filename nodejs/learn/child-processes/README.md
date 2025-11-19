# Node.js Child Processes - Real World Examples

## What are Child Processes?

Child processes in Node.js allow you to execute external programs, run scripts, and perform CPU-intensive operations without blocking the main event loop. Node.js provides the `child_process` module with four main methods:

1. **spawn()** - Launches a command in a new process with streaming I/O
2. **exec()** - Executes a command in a shell and buffers the output
3. **execFile()** - Similar to exec() but executes a file directly without spawning a shell
4. **fork()** - Special case of spawn() for creating new Node.js processes with IPC channel

## Why Use Child Processes?

### Real-World Scenarios:

1. **CPU-Intensive Operations**: Heavy computations that would block the event loop
   - Image/Video processing
   - Data encryption/decryption
   - Complex calculations
   - Report generation

2. **External Program Execution**: Running system commands or third-party tools
   - FFmpeg for video conversion
   - ImageMagick for image manipulation
   - Git commands
   - Database backups

3. **Parallel Processing**: Distribute workload across multiple processes
   - Batch processing
   - Web scraping
   - Data transformation
   - CSV/Excel processing

4. **Isolation**: Run untrusted or potentially crashing code in isolated process
   - Plugin systems
   - User-submitted code execution
   - Third-party integrations

## Method Comparison

| Method | Use Case | Shell | Streaming | IPC | Max Buffer |
|--------|----------|-------|-----------|-----|------------|
| spawn() | Long-running, large output | No* | Yes | No | Unlimited |
| exec() | Short commands, small output | Yes | No | No | 1MB default |
| execFile() | Execute binary/script directly | No | No | No | 1MB default |
| fork() | Node.js child processes | No | Yes | Yes | Unlimited |

*Can enable shell with `{ shell: true }` option

## When to Use Each Method

### Use spawn() when:
- Dealing with large amounts of data (streaming)
- Running long processes (video encoding, large file processing)
- Need real-time output
- Want better performance (no shell overhead)

### Use exec() when:
- Running simple shell commands
- Output is small (< 1MB)
- Need shell features (pipes, redirects, wildcards)
- Quick one-off commands

### Use execFile() when:
- Executing a specific binary or script
- Security is important (no shell injection)
- Don't need shell features
- Better performance than exec()

### Use fork() when:
- Running Node.js code in child process
- Need communication between parent and child (IPC)
- CPU-intensive Node.js operations
- Load balancing across CPU cores

## Examples Overview

This folder contains real-world examples demonstrating each method:

1. **01-spawn-examples.js** - Video processing, log tailing, live command output
2. **02-exec-examples.js** - Git operations, system info, database backups
3. **03-execFile-examples.js** - Running Python scripts, custom binaries
4. **04-fork-examples.js** - CPU-intensive tasks, parallel processing
5. **05-advanced-examples.js** - Worker pools, batch processing, queue systems
6. **06-practical-use-cases.js** - Real production scenarios

## Best Practices

1. **Error Handling**: Always handle errors and exit codes
2. **Resource Management**: Clean up processes on exit
3. **Timeouts**: Set timeouts for long-running processes
4. **Security**: Validate and sanitize inputs to prevent command injection
5. **Monitoring**: Track process health and resource usage
6. **Graceful Shutdown**: Properly terminate child processes
7. **Logging**: Log process output and errors
8. **Testing**: Mock child processes in unit tests

## Common Pitfalls

1. **Memory Leaks**: Not removing event listeners
2. **Zombie Processes**: Not handling process exit properly
3. **Buffer Overflow**: Using exec() for large outputs
4. **Shell Injection**: Not sanitizing user inputs
5. **Resource Exhaustion**: Spawning too many processes
6. **Blocking Operations**: Using synchronous methods in production

## Performance Considerations

- **spawn()** is generally faster than exec() (no shell overhead)
- **fork()** has overhead of spawning Node.js runtime
- Use **worker threads** for CPU-bound tasks if you don't need process isolation
- Consider process pooling for frequent operations
- Monitor memory usage, especially with fork()

## Installation

Some examples require additional dependencies:

```bash
npm install
```

## Running Examples

Each example file can be run independently:

```bash
node 01-spawn-examples.js
node 02-exec-examples.js
# ... etc
```

## Additional Resources

- [Node.js Child Process Documentation](https://nodejs.org/api/child_process.html)
- [Worker Threads vs Child Processes](https://nodejs.org/api/worker_threads.html)
- [Process Management with PM2](https://pm2.keymetrics.io/)
