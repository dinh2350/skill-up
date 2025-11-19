# Node.js Streams - Interview Questions & Answers

## Table of Contents
- [Junior Level Questions](#junior-level-questions)
- [Mid-Level Questions](#mid-level-questions)
- [Senior Level Questions](#senior-level-questions)
- [Scenario-Based Questions](#scenario-based-questions)

---

## Junior Level Questions

### Q1: What are Streams in Node.js?

**Answer:**
Streams are objects that allow you to read data from a source or write data to a destination in a **continuous, chunk-by-chunk manner** instead of loading everything into memory at once.

**Key Characteristics:**
- Process data piece by piece (chunks)
- Memory efficient
- Time efficient (can start processing before all data arrives)
- Built on EventEmitter

**Example:**
```javascript
const fs = require('fs');

// Without stream: Loads entire file into memory
fs.readFile('huge.txt', (err, data) => {
  // data is entire file (could be GBs!)
});

// With stream: Processes in small chunks
const stream = fs.createReadStream('huge.txt');
stream.on('data', (chunk) => {
  // chunk is only ~64KB
  console.log('Received chunk:', chunk.length);
});
```

---

### Q2: What are the 4 types of streams in Node.js?

**Answer:**

| Type | Direction | Example Use Cases |
|------|-----------|-------------------|
| **Readable** | Data flows OUT of stream | `fs.createReadStream()`, HTTP requests, database cursors |
| **Writable** | Data flows INTO stream | `fs.createWriteStream()`, HTTP responses, log files |
| **Transform** | Modifies data passing through | Compression (`zlib`), encryption, data parsing |
| **Duplex** | Both readable AND writable | TCP sockets, WebSockets |

**Code Example:**
```javascript
const fs = require('fs');
const { Transform } = require('stream');

// Readable
const readable = fs.createReadStream('input.txt');

// Writable
const writable = fs.createWriteStream('output.txt');

// Transform
const uppercase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

// Connect them
readable.pipe(uppercase).pipe(writable);
```

---

### Q3: What is the difference between `pipe()` and `pipeline()`?

**Answer:**

**`pipe()` - Classic Method:**
```javascript
source.pipe(transform).pipe(destination);
```
- ❌ Manual error handling for each stream
- ❌ No automatic cleanup
- ❌ Can cause memory leaks

**`pipeline()` - Modern Method (Recommended):**
```javascript
const { pipeline } = require('stream');

pipeline(
  source,
  transform,
  destination,
  (err) => {
    if (err) console.error('Pipeline failed:', err);
    // All streams are properly cleaned up
  }
);
```
- ✅ Automatic error propagation
- ✅ Automatic cleanup on errors
- ✅ Single error handler
- ✅ Properly destroys all streams

---

### Q4: What is backpressure in streams?

**Answer:**
**Backpressure** occurs when data is produced faster than it can be consumed, causing buffers to fill up.

**The Problem:**
```javascript
const readable = fs.createReadStream('huge.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('data', (chunk) => {
  const canWrite = writable.write(chunk);
  if (!canWrite) {
    // Buffer is full - BACKPRESSURE!
    console.warn('Backpressure detected!');
  }
});
```

**Manual Solution:**
```javascript
readable.on('data', (chunk) => {
  if (!writable.write(chunk)) {
    readable.pause(); // Stop reading
  }
});

writable.on('drain', () => {
  readable.resume(); // Resume reading
});
```

**Automatic Solution:**
```javascript
// pipe() handles backpressure automatically!
readable.pipe(writable);
```

---

### Q5: How do you handle errors in streams?

**Answer:**

**❌ Bad - Unhandled Errors:**
```javascript
const stream = fs.createReadStream('file.txt');
// If file doesn't exist, app crashes!
```

**✅ Good - Individual Error Handlers:**
```javascript
const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('error', (err) => console.error('Read error:', err));
writable.on('error', (err) => console.error('Write error:', err));

readable.pipe(writable);
```

**✅ Better - Use pipeline():**
```javascript
const { pipeline } = require('stream');

pipeline(
  fs.createReadStream('input.txt'),
  fs.createWriteStream('output.txt'),
  (err) => {
    // Catches errors from ANY stream in the pipeline
    if (err) console.error('Error:', err);
    else console.log('Success!');
  }
);
```

---

## Mid-Level Questions

### Q6: What is the difference between flowing and paused mode in Readable streams?

**Answer:**

**Flowing Mode:**
- Data is read automatically
- Pushed to your code as fast as possible
- Triggered by:
  - Attaching `data` event listener
  - Calling `stream.resume()`
  - Calling `stream.pipe()`

```javascript
const stream = fs.createReadStream('file.txt');

stream.on('data', (chunk) => {
  // Stream is in flowing mode
  console.log('Chunk:', chunk);
});
```

**Paused Mode:**
- Data must be explicitly read
- More control over data flow
- Triggered by:
  - Initial state (no listeners)
  - Calling `stream.pause()`
  - Removing all `data` listeners

```javascript
const stream = fs.createReadStream('file.txt');

stream.on('readable', () => {
  // Stream is in paused mode
  let chunk;
  while ((chunk = stream.read()) !== null) {
    console.log('Chunk:', chunk);
  }
});
```

**Recommendation:** Use flowing mode with `pipe()` for most cases.

---

### Q7: Explain `highWaterMark` and when to adjust it.

**Answer:**
`highWaterMark` is the **buffer size** (in bytes) for a stream. It controls how much data is buffered before backpressure is applied.

**Default Values:**
- 16KB for regular streams
- 16 objects for objectMode streams

**When to Adjust:**

**Increase for:**
- Large files
- Fast network connections
- When throughput > latency

```javascript
// 256KB buffer for fast processing
const stream = fs.createReadStream('large.txt', {
  highWaterMark: 256 * 1024
});
```

**Decrease for:**
- Memory-constrained environments
- Many concurrent streams
- When latency > throughput

```javascript
// 4KB buffer for low memory
const stream = fs.createReadStream('file.txt', {
  highWaterMark: 4 * 1024
});
```

**Trade-offs:**
- Larger buffer = Higher throughput, more memory
- Smaller buffer = Less memory, lower throughput

---

### Q8: How do you create a custom Transform stream?

**Answer:**
```javascript
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // Initialize state
  }
  
  // Required: Transform each chunk
  _transform(chunk, encoding, callback) {
    try {
      // 1. Process chunk
      const transformed = chunk.toString().toUpperCase();
      
      // 2. Push transformed data
      this.push(transformed);
      
      // 3. Signal completion
      callback();
    } catch (err) {
      // 4. Pass errors to callback
      callback(err);
    }
  }
  
  // Optional: Process remaining data
  _flush(callback) {
    // Called before stream ends
    this.push('FINAL DATA\n');
    callback();
  }
}

// Usage
const transform = new MyTransform();
input.pipe(transform).pipe(output);
```

**Key Methods:**
- `_transform(chunk, encoding, callback)` - Process each chunk
- `_flush(callback)` - Final processing before end
- `this.push(data)` - Send data to next stream
- `callback(error)` - Signal completion or error

---

### Q9: What is objectMode in streams?

**Answer:**
By default, streams work with **Buffers and Strings**. `objectMode` allows streams to work with **any JavaScript object**.

**Without objectMode:**
```javascript
const stream = new Writable({
  write(chunk, encoding, callback) {
    console.log(chunk); // Buffer or String
    callback();
  }
});

stream.write('text'); // ✅ OK
stream.write(Buffer.from('data')); // ✅ OK
stream.write({ id: 1 }); // ❌ Error!
```

**With objectMode:**
```javascript
const stream = new Writable({
  objectMode: true,
  write(obj, encoding, callback) {
    console.log(obj); // Any object
    callback();
  }
});

stream.write({ id: 1, name: 'Alice' }); // ✅ OK
stream.write([1, 2, 3]); // ✅ OK
stream.write('text'); // ✅ OK
```

**Use Cases:**
- Processing database rows
- API responses
- JSON data pipelines
- ETL operations

**Note:** `highWaterMark` in objectMode represents **number of objects**, not bytes.

---

### Q10: How do streams handle memory compared to buffering?

**Answer:**

**Buffering Approach (Bad for Large Data):**
```javascript
const fs = require('fs');

fs.readFile('1GB-file.txt', (err, data) => {
  // Loads entire 1GB into memory!
  // Memory usage: ~1GB+
  // Nothing happens until file is fully loaded
  process(data);
});
```

**Streaming Approach (Efficient):**
```javascript
const stream = fs.createReadStream('1GB-file.txt', {
  highWaterMark: 64 * 1024 // 64KB chunks
});

stream.on('data', (chunk) => {
  // Process one 64KB chunk at a time
  // Memory usage: ~64KB
  // Processing starts immediately
  process(chunk);
});
```

**Comparison:**

| Aspect | Buffering | Streaming |
|--------|-----------|-----------|
| Memory | Entire file | Small chunks (configurable) |
| Start Time | After full load | Immediate |
| Max File Size | Limited by RAM | Unlimited |
| Concurrent Files | Few | Many |

**Example - 100 concurrent 1GB files:**
- Buffering: 100GB RAM required ❌
- Streaming: 6.4MB RAM required ✅ (64KB × 100)

---

## Senior Level Questions

### Q11: Implement a rate-limited stream that processes N items per second.

**Answer:**
```javascript
const { Transform } = require('stream');

class RateLimitedStream extends Transform {
  constructor(itemsPerSecond, options = {}) {
    super({ objectMode: true, ...options });
    this.itemsPerSecond = itemsPerSecond;
    this.delay = 1000 / itemsPerSecond;
    this.lastTime = Date.now();
    this.queue = [];
    this.processing = false;
  }
  
  async _transform(item, encoding, callback) {
    this.queue.push({ item, callback });
    
    if (!this.processing) {
      this.processing = true;
      this.processQueue();
    }
  }
  
  async processQueue() {
    while (this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastTime;
      
      if (elapsed < this.delay) {
        await new Promise(resolve => 
          setTimeout(resolve, this.delay - elapsed)
        );
      }
      
      const { item, callback } = this.queue.shift();
      this.lastTime = Date.now();
      this.push(item);
      callback();
    }
    
    this.processing = false;
  }
  
  _flush(callback) {
    // Wait for queue to empty
    const checkQueue = () => {
      if (this.queue.length === 0 && !this.processing) {
        callback();
      } else {
        setTimeout(checkQueue, 10);
      }
    };
    checkQueue();
  }
}

// Usage: Process 10 items per second
const rateLimiter = new RateLimitedStream(10);

dataSource
  .pipe(rateLimiter)
  .pipe(destination);
```

**Features:**
- Precise rate limiting
- Queue-based processing
- Async-safe
- Backpressure handling

---

### Q12: How would you implement a stream that processes data in batches?

**Answer:**
```javascript
const { Transform } = require('stream');

class BatchStream extends Transform {
  constructor(batchSize, options = {}) {
    super({ objectMode: true, ...options });
    this.batchSize = batchSize;
    this.buffer = [];
  }
  
  _transform(item, encoding, callback) {
    this.buffer.push(item);
    
    if (this.buffer.length >= this.batchSize) {
      // Emit complete batch
      this.push([...this.buffer]);
      this.buffer = [];
    }
    
    callback();
  }
  
  _flush(callback) {
    // Emit remaining items
    if (this.buffer.length > 0) {
      this.push([...this.buffer]);
      this.buffer = [];
    }
    callback();
  }
}

// Usage Example
const { pipeline } = require('stream');

async function processBatches() {
  await pipeline(
    dataSource,
    new BatchStream(100), // Batch 100 items
    async function* (batchSource) {
      for await (const batch of batchSource) {
        // Process entire batch at once
        await database.insertMany(batch);
        console.log(`Inserted ${batch.length} records`);
      }
    }
  );
}
```

**Benefits:**
- Reduced database/API calls
- Better performance
- Handles incomplete batches

---

### Q13: Design a stream-based file upload system with progress tracking and validation.

**Answer:**
```javascript
const { Transform, pipeline } = require('stream');
const fs = require('fs');
const crypto = require('crypto');

class UploadProgressStream extends Transform {
  constructor(totalSize, onProgress) {
    super();
    this.totalSize = totalSize;
    this.uploaded = 0;
    this.startTime = Date.now();
    this.onProgress = onProgress;
  }
  
  _transform(chunk, encoding, callback) {
    this.uploaded += chunk.length;
    
    const progress = (this.uploaded / this.totalSize) * 100;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const speed = this.uploaded / elapsed;
    const remaining = (this.totalSize - this.uploaded) / speed;
    
    this.onProgress({
      uploaded: this.uploaded,
      total: this.totalSize,
      progress: progress.toFixed(2),
      speed: (speed / 1024 / 1024).toFixed(2), // MB/s
      remaining: remaining.toFixed(0) // seconds
    });
    
    this.push(chunk);
    callback();
  }
}

class HashValidationStream extends Transform {
  constructor(expectedHash, algorithm = 'sha256') {
    super();
    this.expectedHash = expectedHash;
    this.hash = crypto.createHash(algorithm);
  }
  
  _transform(chunk, encoding, callback) {
    this.hash.update(chunk);
    this.push(chunk);
    callback();
  }
  
  _flush(callback) {
    const actual = this.hash.digest('hex');
    
    if (actual !== this.expectedHash) {
      callback(new Error(
        `Hash mismatch! Expected ${this.expectedHash}, got ${actual}`
      ));
    } else {
      console.log('✓ File integrity verified');
      callback();
    }
  }
}

class FileSizeLimitStream extends Transform {
  constructor(maxSize) {
    super();
    this.maxSize = maxSize;
    this.size = 0;
  }
  
  _transform(chunk, encoding, callback) {
    this.size += chunk.length;
    
    if (this.size > this.maxSize) {
      callback(new Error(
        `File too large! Max: ${this.maxSize}, got: ${this.size}`
      ));
    } else {
      this.push(chunk);
      callback();
    }
  }
}

// Usage
async function uploadFile(sourcePath, targetPath, options = {}) {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB
    expectedHash,
    onProgress
  } = options;
  
  const stats = fs.statSync(sourcePath);
  const streams = [
    fs.createReadStream(sourcePath),
    new FileSizeLimitStream(maxSize),
    new UploadProgressStream(stats.size, onProgress)
  ];
  
  if (expectedHash) {
    streams.push(new HashValidationStream(expectedHash));
  }
  
  streams.push(fs.createWriteStream(targetPath));
  
  return new Promise((resolve, reject) => {
    pipeline(...streams, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Example usage
uploadFile('large-file.zip', 'uploads/file.zip', {
  maxSize: 500 * 1024 * 1024, // 500MB limit
  expectedHash: 'abc123...', // SHA256 hash
  onProgress: (progress) => {
    console.log(
      `Upload: ${progress.progress}% | ` +
      `${progress.speed} MB/s | ` +
      `${progress.remaining}s remaining`
    );
  }
}).then(() => {
  console.log('Upload complete!');
}).catch((err) => {
  console.error('Upload failed:', err.message);
});
```

---

### Q14: How would you handle parallel stream processing?

**Answer:**
```javascript
const { Transform, pipeline } = require('stream');
const { promisify } = require('util');

class ParallelTransform extends Transform {
  constructor(transformFn, concurrency = 5) {
    super({ objectMode: true });
    this.transformFn = transformFn;
    this.concurrency = concurrency;
    this.activeCount = 0;
    this.queue = [];
  }
  
  async _transform(item, encoding, callback) {
    if (this.activeCount >= this.concurrency) {
      // Queue item
      this.queue.push({ item, callback });
    } else {
      // Process immediately
      this.processItem(item, callback);
    }
  }
  
  async processItem(item, callback) {
    this.activeCount++;
    
    try {
      const result = await this.transformFn(item);
      this.push(result);
      callback();
    } catch (err) {
      callback(err);
    } finally {
      this.activeCount--;
      
      // Process queued item
      if (this.queue.length > 0) {
        const { item, callback } = this.queue.shift();
        this.processItem(item, callback);
      }
    }
  }
  
  _flush(callback) {
    // Wait for all active operations
    const checkComplete = () => {
      if (this.activeCount === 0 && this.queue.length === 0) {
        callback();
      } else {
        setTimeout(checkComplete, 10);
      }
    };
    checkComplete();
  }
}

// Usage Example
async function processImages() {
  const processImage = async (image) => {
    // Simulate async processing (resize, optimize, etc.)
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      ...image,
      processed: true,
      thumbnail: `thumb_${image.filename}`
    };
  };
  
  await pipeline(
    imageStream, // Source of images
    new ParallelTransform(processImage, 10), // Process 10 at a time
    saveToDatabase // Save results
  );
}
```

**Key Points:**
- Limits concurrent operations
- Maintains order (optional)
- Handles errors properly
- Memory efficient

---

### Q15: Explain how you would implement a stream multiplexer/demultiplexer.

**Answer:**

**Multiplexer - Merge multiple streams into one:**
```javascript
const { PassThrough } = require('stream');

class StreamMultiplexer extends PassThrough {
  constructor(streams) {
    super({ objectMode: true });
    this.streams = streams;
    this.activeStreams = streams.length;
    
    streams.forEach((stream, index) => {
      stream.on('data', (data) => {
        this.push({ streamId: index, data });
      });
      
      stream.on('end', () => {
        this.activeStreams--;
        if (this.activeStreams === 0) {
          this.push(null);
        }
      });
      
      stream.on('error', (err) => {
        this.destroy(err);
      });
    });
  }
}

// Usage
const mux = new StreamMultiplexer([stream1, stream2, stream3]);

mux.on('data', ({ streamId, data }) => {
  console.log(`From stream ${streamId}:`, data);
});
```

**Demultiplexer - Split one stream into multiple:**
```javascript
const { Writable, PassThrough } = require('stream');

class StreamDemultiplexer extends Writable {
  constructor() {
    super({ objectMode: true });
    this.streams = new Map();
  }
  
  getStream(streamId) {
    if (!this.streams.has(streamId)) {
      this.streams.set(streamId, new PassThrough({ objectMode: true }));
    }
    return this.streams.get(streamId);
  }
  
  _write({ streamId, data }, encoding, callback) {
    const stream = this.getStream(streamId);
    stream.write(data);
    callback();
  }
  
  _final(callback) {
    // End all streams
    for (const stream of this.streams.values()) {
      stream.end();
    }
    callback();
  }
}

// Usage
const demux = new StreamDemultiplexer();

source.pipe(demux);

demux.getStream(0).pipe(destination1);
demux.getStream(1).pipe(destination2);
demux.getStream(2).pipe(destination3);
```

**Real-World Use Case:**
```javascript
// HTTP/2 multiplexing
const http2 = require('http2');

// Multiple HTTP requests over single TCP connection
const mux = new StreamMultiplexer([
  http2.get('/api/users'),
  http2.get('/api/posts'),
  http2.get('/api/comments')
]);

const demux = new StreamDemultiplexer();
mux.pipe(demux);

demux.getStream(0).pipe(processUsers);
demux.getStream(1).pipe(processPosts);
demux.getStream(2).pipe(processComments);
```

---

## Scenario-Based Questions

### Q16: You have a 10GB log file. How would you find all ERROR lines efficiently?

**Answer:**
```javascript
const fs = require('fs');
const { Transform, pipeline } = require('stream');
const readline = require('readline');

class LineParser extends Transform {
  constructor() {
    super({ objectMode: true });
    this.buffer = '';
  }
  
  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop(); // Keep incomplete line
    
    lines.forEach(line => {
      if (line.trim()) this.push(line);
    });
    
    callback();
  }
  
  _flush(callback) {
    if (this.buffer) this.push(this.buffer);
    callback();
  }
}

class ErrorFilter extends Transform {
  constructor() {
    super({ objectMode: true });
    this.errorCount = 0;
  }
  
  _transform(line, encoding, callback) {
    if (line.includes('ERROR')) {
      this.errorCount++;
      this.push(line + '\n');
    }
    callback();
  }
  
  _flush(callback) {
    console.log(`Found ${this.errorCount} ERROR lines`);
    callback();
  }
}

async function findErrors() {
  await pipeline(
    fs.createReadStream('10gb-log.txt', {
      highWaterMark: 256 * 1024 // 256KB chunks
    }),
    new LineParser(),
    new ErrorFilter(),
    fs.createWriteStream('errors.txt')
  );
}

// Memory usage: ~300KB (not 10GB!)
// Processes 10GB file efficiently
```

**Why This Works:**
- Streaming: Only loads 256KB at a time
- Line parsing: Handles incomplete lines
- Filtering: Only writes matching lines
- Memory efficient: Works with any file size

---

### Q17: Design an ETL pipeline that reads from a database, transforms data, and loads to another database.

**Answer:**
```javascript
const { Readable, Transform, Writable, pipeline } = require('stream');

// Extract: Read from source database
class DatabaseReader extends Readable {
  constructor(connection, query, batchSize = 1000) {
    super({ objectMode: true });
    this.connection = connection;
    this.query = query;
    this.batchSize = batchSize;
    this.offset = 0;
    this.hasMore = true;
  }
  
  async _read() {
    if (!this.hasMore) {
      this.push(null);
      return;
    }
    
    try {
      const rows = await this.connection.query(
        `${this.query} LIMIT ${this.batchSize} OFFSET ${this.offset}`
      );
      
      if (rows.length === 0) {
        this.hasMore = false;
        this.push(null);
      } else {
        rows.forEach(row => this.push(row));
        this.offset += rows.length;
      }
    } catch (err) {
      this.destroy(err);
    }
  }
}

// Transform: Cleanse and enrich data
class DataTransformer extends Transform {
  constructor(transformRules) {
    super({ objectMode: true });
    this.transformRules = transformRules;
    this.processedCount = 0;
    this.errorCount = 0;
  }
  
  async _transform(row, encoding, callback) {
    try {
      let transformed = { ...row };
      
      // Apply transformation rules
      for (const rule of this.transformRules) {
        transformed = await rule(transformed);
      }
      
      this.processedCount++;
      this.push(transformed);
      callback();
    } catch (err) {
      this.errorCount++;
      console.error(`Transform error for row ${row.id}:`, err);
      callback(); // Continue processing
    }
  }
  
  _flush(callback) {
    console.log(`Transformed: ${this.processedCount}, Errors: ${this.errorCount}`);
    callback();
  }
}

// Load: Write to target database
class DatabaseWriter extends Writable {
  constructor(connection, tableName, batchSize = 500) {
    super({ objectMode: true });
    this.connection = connection;
    this.tableName = tableName;
    this.batchSize = batchSize;
    this.buffer = [];
    this.insertedCount = 0;
  }
  
  async _write(row, encoding, callback) {
    this.buffer.push(row);
    
    if (this.buffer.length >= this.batchSize) {
      try {
        await this.flush();
        callback();
      } catch (err) {
        callback(err);
      }
    } else {
      callback();
    }
  }
  
  async _final(callback) {
    try {
      await this.flush();
      console.log(`Total inserted: ${this.insertedCount}`);
      callback();
    } catch (err) {
      callback(err);
    }
  }
  
  async flush() {
    if (this.buffer.length === 0) return;
    
    await this.connection.insertMany(this.tableName, this.buffer);
    this.insertedCount += this.buffer.length;
    console.log(`Inserted batch: ${this.buffer.length} rows`);
    this.buffer = [];
  }
}

// Complete ETL Pipeline
async function runETL() {
  const transformRules = [
    // Rule 1: Normalize email
    async (row) => ({
      ...row,
      email: row.email?.toLowerCase().trim()
    }),
    
    // Rule 2: Enrich with location data
    async (row) => {
      const location = await getLocationByZip(row.zipCode);
      return { ...row, city: location.city, state: location.state };
    },
    
    // Rule 3: Calculate derived fields
    (row) => ({
      ...row,
      fullName: `${row.firstName} ${row.lastName}`,
      ageGroup: getAgeGroup(row.age)
    })
  ];
  
  await pipeline(
    new DatabaseReader(sourceDB, 'SELECT * FROM users'),
    new DataTransformer(transformRules),
    new DatabaseWriter(targetDB, 'transformed_users'),
    (err) => {
      if (err) {
        console.error('ETL failed:', err);
      } else {
        console.log('ETL completed successfully!');
      }
    }
  );
}
```

**Benefits:**
- Memory efficient: Processes in batches
- Scalable: Handles millions of rows
- Resilient: Continues on errors
- Fast: Batch inserts
- Monitoring: Progress tracking

---

### Q18: How would you implement a real-time log aggregation system using streams?

**Answer:**
```javascript
const { Transform, Writable } = require('stream');
const net = require('net');

// Receive logs from multiple sources
class LogAggregator extends Transform {
  constructor() {
    super({ objectMode: true });
    this.sources = new Map();
  }
  
  _transform({ source, log }, encoding, callback) {
    // Add metadata
    const enriched = {
      ...log,
      source,
      receivedAt: Date.now()
    };
    
    this.push(enriched);
    callback();
  }
}

// Parse and structure logs
class LogStructurer extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  
  _transform(log, encoding, callback) {
    try {
      // Parse log line
      const structured = this.parseLog(log.message);
      
      this.push({
        ...log,
        ...structured,
        parsed: true
      });
      
      callback();
    } catch (err) {
      // Keep unparsed logs
      this.push({ ...log, parsed: false });
      callback();
    }
  }
  
  parseLog(message) {
    // Example: [2024-01-01 12:00:00] ERROR: Something failed
    const match = message.match(/\[(.+?)\] (\w+): (.+)/);
    
    if (match) {
      return {
        timestamp: new Date(match[1]),
        level: match[2],
        message: match[3]
      };
    }
    
    return { message };
  }
}

// Real-time analytics
class LogAnalyzer extends Transform {
  constructor(windowSize = 60000) { // 1 minute
    super({ objectMode: true });
    this.windowSize = windowSize;
    this.window = [];
    this.stats = {
      total: 0,
      byLevel: {},
      bySource: {}
    };
  }
  
  _transform(log, encoding, callback) {
    const now = Date.now();
    
    // Add to window
    this.window.push({ ...log, processedAt: now });
    
    // Remove old logs
    this.window = this.window.filter(
      l => now - l.processedAt < this.windowSize
    );
    
    // Update stats
    this.updateStats(log);
    
    // Pass through with stats
    this.push({
      log,
      stats: { ...this.stats },
      windowSize: this.window.length
    });
    
    callback();
  }
  
  updateStats(log) {
    this.stats.total++;
    
    this.stats.byLevel[log.level] = 
      (this.stats.byLevel[log.level] || 0) + 1;
    
    this.stats.bySource[log.source] = 
      (this.stats.bySource[log.source] || 0) + 1;
  }
}

// Alert on anomalies
class AlertSystem extends Writable {
  constructor(thresholds) {
    super({ objectMode: true });
    this.thresholds = thresholds;
  }
  
  _write({ log, stats }, encoding, callback) {
    // Check for anomalies
    if (stats.byLevel.ERROR > this.thresholds.maxErrors) {
      this.alert('HIGH_ERROR_RATE', {
        count: stats.byLevel.ERROR,
        threshold: this.thresholds.maxErrors
      });
    }
    
    if (stats.total > this.thresholds.maxLogsPerMinute) {
      this.alert('HIGH_VOLUME', {
        count: stats.total,
        threshold: this.thresholds.maxLogsPerMinute
      });
    }
    
    callback();
  }
  
  alert(type, data) {
    console.error(`🚨 ALERT: ${type}`, data);
    // Send to monitoring system
  }
}

// Complete system
class LogAggregationServer {
  constructor(port) {
    this.port = port;
    this.aggregator = new LogAggregator();
    this.setupPipeline();
    this.startServer();
  }
  
  setupPipeline() {
    this.aggregator
      .pipe(new LogStructurer())
      .pipe(new LogAnalyzer(60000))
      .pipe(new AlertSystem({
        maxErrors: 100,
        maxLogsPerMinute: 10000
      }))
      .on('error', (err) => {
        console.error('Pipeline error:', err);
      });
  }
  
  startServer() {
    const server = net.createServer((socket) => {
      const source = `${socket.remoteAddress}:${socket.remotePort}`;
      
      socket.on('data', (data) => {
        const logs = data.toString().split('\n');
        logs.forEach(log => {
          if (log.trim()) {
            this.aggregator.write({ source, log: { message: log } });
          }
        });
      });
    });
    
    server.listen(this.port, () => {
      console.log(`Log aggregator listening on port ${this.port}`);
    });
  }
}

// Usage
const server = new LogAggregationServer(9000);
```

---

## Summary

**Key Takeaways:**
1. Streams are memory-efficient for large data
2. Always use `pipeline()` over `pipe()`
3. Handle backpressure automatically with `pipe()`/`pipeline()`
4. Use `objectMode` for non-buffer data
5. Implement custom streams by extending base classes
6. Monitor stream health in production
7. Use appropriate `highWaterMark` for your use case
8. Always handle errors

**Common Patterns:**
- File processing
- Data transformation
- ETL pipelines
- Real-time analytics
- API streaming
- Video/audio streaming
- Log processing

Good luck with your interview! 🚀
