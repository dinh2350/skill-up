# Node.js Streams - Complete Guide

## Table of Contents
- [What are Streams?](#what-are-streams)
- [Types of Streams](#types-of-streams)
- [Why Use Streams?](#why-use-streams)
- [Stream Architecture](#stream-architecture)
- [Backpressure](#backpressure)
- [Stream Modes](#stream-modes)
- [Piping and Pipeline](#piping-and-pipeline)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## What are Streams?

Streams are collections of data that might not be available all at once and don't have to fit in memory. They process data **piece by piece** (chunks) instead of loading everything into memory.

### Real-World Analogy
Think of streaming a video on Netflix:
- You don't download the entire movie before watching
- Data arrives in chunks and plays immediately
- Memory efficient - only buffer a small portion
- Can start watching while rest downloads

### Key Benefits
✅ **Memory Efficient** - Process large files without loading everything into RAM  
✅ **Time Efficient** - Start processing before all data arrives  
✅ **Composable** - Chain operations together like UNIX pipes  
✅ **Scalable** - Handle files larger than available memory

---

## Types of Streams

Node.js has 4 fundamental stream types:

### 1. Readable Streams
**Data flows FROM the stream TO your application.**

```javascript
const fs = require('fs');
const readable = fs.createReadStream('file.txt');

readable.on('data', (chunk) => {
  console.log('Received chunk:', chunk);
});
```

**Examples:**
- `fs.createReadStream()` - Read files
- `http.IncomingMessage` - HTTP requests (server-side)
- `process.stdin` - Standard input
- Database cursors
- API pagination

### 2. Writable Streams
**Data flows FROM your application TO the stream.**

```javascript
const fs = require('fs');
const writable = fs.createWriteStream('output.txt');

writable.write('Hello ');
writable.write('World!');
writable.end();
```

**Examples:**
- `fs.createWriteStream()` - Write files
- `http.ServerResponse` - HTTP responses
- `process.stdout` - Standard output
- Database writes
- Log files

### 3. Transform Streams
**Duplex stream that modifies or transforms data as it passes through.**

```javascript
const { Transform } = require('stream');

const uppercase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

process.stdin.pipe(uppercase).pipe(process.stdout);
```

**Examples:**
- `zlib.createGzip()` - Compression
- `crypto.createCipher()` - Encryption
- Data parsing (CSV, JSON)
- Data validation

### 4. Duplex Streams
**Both readable AND writable (independent channels).**

```javascript
const net = require('net');

const server = net.createServer((socket) => {
  // socket is duplex: can read and write
  socket.write('Hello!\n');
  socket.on('data', (data) => {
    console.log('Received:', data.toString());
  });
});
```

**Examples:**
- TCP sockets
- WebSockets
- `zlib` streams (can read/write)
- Custom protocols

---

## Why Use Streams?

### Problem: Traditional Approach (Buffering)

```javascript
// ❌ BAD: Loads entire 1GB file into memory
const fs = require('fs');

fs.readFile('huge-1gb-file.txt', (err, data) => {
  if (err) throw err;
  // data is entire file in memory!
  process(data);
});
```

**Issues:**
- Uses 1GB+ RAM
- Nothing happens until entire file loads
- Crashes if file > available RAM
- Can't handle multiple large files

### Solution: Streaming Approach

```javascript
// ✅ GOOD: Processes in small chunks
const fs = require('fs');

const stream = fs.createReadStream('huge-1gb-file.txt');

stream.on('data', (chunk) => {
  // Process 64KB chunk at a time
  process(chunk);
});
```

**Benefits:**
- Uses only ~64KB RAM (configurable)
- Processing starts immediately
- Handles files of any size
- Scales to many concurrent operations

---

## Stream Architecture

### Internal Buffer

Every stream has an internal buffer:
- **Readable**: Stores data waiting to be consumed
- **Writable**: Stores data waiting to be written
- **Default size**: 16KB (can be configured via `highWaterMark`)

```javascript
const readable = fs.createReadStream('file.txt', {
  highWaterMark: 64 * 1024 // 64KB buffer
});
```

### Data Flow Diagram

```
┌─────────────┐
│   Source    │ (File, Network, Database)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Readable Stream │ ──data→ [Internal Buffer] ──data→ Consumer
└─────────────────┘
       │
       ▼ (pipe)
┌─────────────────┐
│Transform Stream │ ──transform→ Modified Data
└─────────────────┘
       │
       ▼ (pipe)
┌─────────────────┐
│ Writable Stream │ ──write→ [Internal Buffer] ──flush→ Destination
└─────────────────┘
       │
       ▼
┌─────────────┐
│ Destination │ (File, Network, Database)
└─────────────┘
```

---

## Backpressure

**Backpressure** occurs when data is produced faster than it can be consumed.

### The Problem

```javascript
// Producer (fast)
readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  
  if (!canContinue) {
    // Buffer is full! Backpressure!
    console.warn('Backpressure detected!');
  }
});
```

### Manual Handling

```javascript
const fs = require('fs');

const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('data', (chunk) => {
  const canWrite = writable.write(chunk);
  
  if (!canWrite) {
    // Pause reading until buffer drains
    readable.pause();
  }
});

writable.on('drain', () => {
  // Buffer drained, resume reading
  readable.resume();
});
```

### Automatic Handling with Pipe

```javascript
// ✅ pipe() handles backpressure automatically!
readable.pipe(writable);
```

**What pipe() does:**
1. Listens for `data` events
2. Writes to destination
3. Pauses source if destination buffer full
4. Resumes when destination drains

---

## Stream Modes

Readable streams operate in two modes:

### 1. Flowing Mode
Data is read automatically and provided via events.

```javascript
const readable = fs.createReadStream('file.txt');

// Switches to flowing mode
readable.on('data', (chunk) => {
  console.log('Chunk:', chunk);
});
```

**Triggers:**
- Attaching `data` event listener
- Calling `stream.resume()`
- Calling `stream.pipe()`

### 2. Paused Mode (Non-Flowing)
Data must be explicitly read.

```javascript
const readable = fs.createReadStream('file.txt');

// Stays in paused mode
readable.on('readable', () => {
  let chunk;
  while ((chunk = readable.read()) !== null) {
    console.log('Chunk:', chunk);
  }
});
```

**Triggers:**
- Initial state (before any event listeners)
- Calling `stream.pause()`
- Removing all `data` event listeners

---

## Piping and Pipeline

### pipe() - Classic Method

```javascript
const fs = require('fs');
const zlib = require('zlib');

// Read → Compress → Write
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'))
  .on('finish', () => console.log('Done!'));
```

**Limitations:**
- Error handling is manual for each stream
- No automatic cleanup
- Memory leaks if not handled properly

### pipeline() - Modern Method (Recommended)

```javascript
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('input.txt.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
    } else {
      console.log('Pipeline succeeded!');
    }
  }
);
```

**Benefits:**
- ✅ Automatic error propagation
- ✅ Automatic cleanup on errors
- ✅ Single error handler
- ✅ Properly destroys all streams
- ✅ Handles backpressure

### Promises with pipeline

```javascript
const { pipeline } = require('stream/promises');

async function compress() {
  try {
    await pipeline(
      fs.createReadStream('input.txt'),
      zlib.createGzip(),
      fs.createWriteStream('input.txt.gz')
    );
    console.log('Success!');
  } catch (err) {
    console.error('Failed:', err);
  }
}
```

---

## Error Handling

### ❌ Bad: Unhandled Errors

```javascript
const readable = fs.createReadStream('nonexistent.txt');
// Crashes the application!
```

### ✅ Good: Handle Errors

```javascript
const readable = fs.createReadStream('file.txt');

readable.on('error', (err) => {
  console.error('Stream error:', err);
});

readable.on('data', (chunk) => {
  // Process chunk
});
```

### ✅ Better: Use pipeline()

```javascript
const { pipeline } = require('stream');

pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('output.gz'),
  (err) => {
    // Catches errors from ANY stream in the pipeline
    if (err) console.error('Error:', err);
  }
);
```

---

## Best Practices

### 1. Always Handle Errors

```javascript
stream.on('error', (err) => {
  console.error('Error:', err);
});
```

### 2. Use pipeline() Over pipe()

```javascript
// ✅ Preferred
pipeline(stream1, stream2, stream3, callback);

// ❌ Avoid
stream1.pipe(stream2).pipe(stream3);
```

### 3. Set Appropriate highWaterMark

```javascript
// For small files
const stream = fs.createReadStream('file.txt', {
  highWaterMark: 16 * 1024 // 16KB
});

// For large files or network streams
const stream = fs.createReadStream('huge.txt', {
  highWaterMark: 256 * 1024 // 256KB
});
```

### 4. Clean Up Resources

```javascript
const stream = fs.createReadStream('file.txt');

// Clean up on error or finish
stream.on('error', () => stream.destroy());
stream.on('end', () => console.log('Cleanup if needed'));
```

### 5. Handle Backpressure

```javascript
// Let pipe/pipeline handle it
source.pipe(destination);

// Or manually
source.on('data', (chunk) => {
  if (!destination.write(chunk)) {
    source.pause();
  }
});

destination.on('drain', () => source.resume());
```

### 6. Use Streaming for Large Data

```javascript
// ❌ Bad for large files
const data = fs.readFileSync('huge.txt');

// ✅ Good
const stream = fs.createReadStream('huge.txt');
```

### 7. Implement Transform Streams for Processing

```javascript
const { Transform } = require('stream');

const processor = new Transform({
  transform(chunk, encoding, callback) {
    // Process chunk
    const processed = doSomething(chunk);
    callback(null, processed);
  }
});

input.pipe(processor).pipe(output);
```

### 8. Monitor Stream Health

```javascript
const readable = fs.createReadStream('file.txt');

readable.on('open', () => console.log('Stream opened'));
readable.on('ready', () => console.log('Stream ready'));
readable.on('data', () => console.log('Data flowing'));
readable.on('end', () => console.log('Stream ended'));
readable.on('close', () => console.log('Stream closed'));
readable.on('error', (err) => console.error('Error:', err));
```

---

## Common Use Cases

### 1. File Processing
- Reading/writing large files
- Log file processing
- CSV/JSON data transformation

### 2. HTTP Requests/Responses
- File uploads/downloads
- Streaming APIs
- Video/audio streaming

### 3. Data Transformation
- Compression/decompression
- Encryption/decryption
- Format conversion

### 4. Database Operations
- Cursor-based queries
- Bulk inserts
- ETL pipelines

### 5. Real-Time Data
- WebSocket streams
- Live logs
- Sensor data processing

---

## Performance Comparison

### Memory Usage

```javascript
// Buffer approach: ~1GB RAM for 1GB file
fs.readFile('1gb-file.txt', callback);

// Stream approach: ~64KB RAM for any size file
fs.createReadStream('1gb-file.txt');
```

### Processing Time

```javascript
// Buffer: Wait for entire file, then process
// 1GB file at 100MB/s = 10 seconds wait + processing

// Stream: Process while reading
// Start processing immediately, overlap I/O and computation
```

---

## Summary

**Key Takeaways:**
1. Streams process data in chunks, not all at once
2. 4 types: Readable, Writable, Transform, Duplex
3. Use `pipeline()` for automatic error handling and cleanup
4. Backpressure is automatic with `pipe()`/`pipeline()`
5. Streams are essential for scalable Node.js applications
6. Always handle errors
7. Choose appropriate `highWaterMark` for your use case

**When to Use Streams:**
- Files larger than available memory
- Data from network (HTTP, WebSockets)
- Real-time processing
- ETL pipelines
- Any I/O-bound operations

**When NOT to Use Streams:**
- Small data that fits easily in memory
- Need random access to data
- Simple synchronous operations
- Data needs to be processed as a whole (e.g., JSON.parse entire object)

---

## Next Steps

Check out the example files:
1. `01-readable-streams.js` - Readable stream patterns
2. `02-writable-streams.js` - Writable stream patterns
3. `03-transform-streams.js` - Transform stream patterns
4. `04-duplex-streams.js` - Duplex stream patterns
5. `05-production-patterns.js` - Real-world production examples
6. `INTERVIEW-QUESTIONS.md` - Interview preparation

Happy streaming! 🚀
