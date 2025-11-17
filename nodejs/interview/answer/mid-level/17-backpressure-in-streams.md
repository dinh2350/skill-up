# What is backpressure in streams?

Backpressure is a mechanism in Node.js streams that occurs when data is being written to a stream faster than it can be consumed or processed. It's a flow control mechanism that prevents memory exhaustion by signaling when the internal buffer is full and the stream cannot accept more data.

## What is Backpressure?

Backpressure happens when:

- A **producer** (source) generates data faster than a **consumer** (destination) can process it
- The internal buffer of a writable stream becomes full
- The system needs to pause or slow down the data flow to prevent memory overflow

Think of it like water flowing through pipes - if water flows in faster than it can flow out, pressure builds up and you need to reduce the input flow.

## How Backpressure Works

### The `write()` Method Return Value

The key to understanding backpressure is the return value of the `write()` method:

```javascript
const fs = require("fs");

const writeStream = fs.createWriteStream("output.txt");

// write() returns a boolean
const canWriteMore = writeStream.write("Hello World\n");

if (!canWriteMore) {
  console.log("Buffer is full! Backpressure detected.");

  // Wait for 'drain' event before writing more
  writeStream.once("drain", () => {
    console.log("Buffer drained, safe to write more");
    // Continue writing...
  });
}
```

### Return Values:

- `true`: The data was successfully buffered, you can write more
- `false`: The buffer is full, stop writing and wait for the 'drain' event

## Manual Backpressure Handling

### Basic Example

```javascript
const fs = require("fs");

function copyFileWithBackpressure(source, destination) {
  const readStream = fs.createReadStream(source);
  const writeStream = fs.createWriteStream(destination);

  readStream.on("data", (chunk) => {
    const canWriteMore = writeStream.write(chunk);

    if (!canWriteMore) {
      // Backpressure detected - pause reading
      console.log("Backpressure: pausing read stream");
      readStream.pause();

      // Wait for buffer to drain
      writeStream.once("drain", () => {
        console.log("Buffer drained: resuming read stream");
        readStream.resume();
      });
    }
  });

  readStream.on("end", () => {
    writeStream.end();
  });

  readStream.on("error", (err) => {
    console.error("Read error:", err);
    writeStream.destroy();
  });

  writeStream.on("error", (err) => {
    console.error("Write error:", err);
    readStream.destroy();
  });
}

copyFileWithBackpressure("large-input.txt", "output.txt");
```

### HTTP Request Processing with Backpressure

```javascript
const http = require("http");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/upload") {
    const writeStream = fs.createWriteStream("uploaded-file.bin");

    req.on("data", (chunk) => {
      const canWriteMore = writeStream.write(chunk);

      if (!canWriteMore) {
        // Pause the request stream to handle backpressure
        req.pause();

        writeStream.once("drain", () => {
          req.resume();
        });
      }
    });

    req.on("end", () => {
      writeStream.end();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Upload complete");
    });

    writeStream.on("error", (err) => {
      console.error("Write error:", err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Upload failed");
    });
  }
});

server.listen(3000);
```

## Automatic Backpressure Handling with Pipes

The `pipe()` method automatically handles backpressure:

```javascript
const fs = require("fs");

// Automatic backpressure handling
fs.createReadStream("large-input.txt").pipe(fs.createWriteStream("output.txt"));

// The pipe() method internally:
// 1. Listens for 'data' events from the readable stream
// 2. Writes data to the writable stream
// 3. Pauses the readable stream when write() returns false
// 4. Resumes when the 'drain' event is emitted
```

## Backpressure in Transform Streams

### Custom Transform with Backpressure Handling

```javascript
const { Transform } = require("stream");

class SlowProcessor extends Transform {
  constructor() {
    super();
    this.processingCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.processingCount++;

    // Simulate slow processing
    setTimeout(() => {
      console.log(
        `Processing chunk ${this.processingCount}: ${chunk.length} bytes`
      );

      // Transform the data
      const processed = chunk.toString().toUpperCase();

      // Push the result
      this.push(processed);

      // Signal completion
      callback();
    }, 100); // 100ms delay per chunk
  }
}

// Usage - backpressure will automatically slow down reading
const fs = require("fs");

fs.createReadStream("input.txt")
  .pipe(new SlowProcessor())
  .pipe(fs.createWriteStream("output.txt"))
  .on("finish", () => {
    console.log("Processing complete");
  });
```

### Monitoring Backpressure in Transform Streams

```javascript
const { Transform } = require("stream");

class MonitoredTransform extends Transform {
  constructor() {
    super();
    this.chunkCount = 0;
    this.backpressureCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.chunkCount++;

    // Check if downstream can accept more data
    const canPushMore = this.push(chunk.toString().toUpperCase());

    if (!canPushMore) {
      this.backpressureCount++;
      console.log(`Backpressure detected! Count: ${this.backpressureCount}`);
    }

    console.log(
      `Chunks processed: ${this.chunkCount}, Backpressure events: ${this.backpressureCount}`
    );

    callback();
  }
}

const fs = require("fs");

fs.createReadStream("large-file.txt", { highWaterMark: 1024 })
  .pipe(new MonitoredTransform())
  .pipe(fs.createWriteStream("output.txt", { highWaterMark: 512 })) // Smaller buffer
  .on("finish", () => {
    console.log("Transform complete");
  });
```

## Buffer Management and highWaterMark

The `highWaterMark` option controls the buffer size and affects backpressure behavior:

```javascript
const fs = require("fs");

// Large buffer - less frequent backpressure
const largeBufferStream = fs.createWriteStream("output1.txt", {
  highWaterMark: 1024 * 1024, // 1MB buffer
});

// Small buffer - more frequent backpressure
const smallBufferStream = fs.createWriteStream("output2.txt", {
  highWaterMark: 1024, // 1KB buffer
});

function writeWithBackpressureMonitoring(stream, data, name) {
  let backpressureEvents = 0;

  for (let i = 0; i < 1000; i++) {
    const canWriteMore = stream.write(`Data chunk ${i}: ${data}\n`);

    if (!canWriteMore) {
      backpressureEvents++;

      stream.once("drain", () => {
        console.log(`${name}: Buffer drained (event ${backpressureEvents})`);
      });
    }
  }

  stream.end();
  console.log(`${name}: Total backpressure events: ${backpressureEvents}`);
}

const testData = "x".repeat(1000); // 1KB of data

writeWithBackpressureMonitoring(largeBufferStream, testData, "Large Buffer");
writeWithBackpressureMonitoring(smallBufferStream, testData, "Small Buffer");
```

## Real-world Example: HTTP Streaming with Backpressure

```javascript
const http = require("http");
const fs = require("fs");
const { Transform } = require("stream");

// Transform that processes data slowly
class SlowJSONParser extends Transform {
  constructor() {
    super({ objectMode: true });
    this.buffer = "";
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();

    const lines = this.buffer.split("\n");
    this.buffer = lines.pop(); // Keep incomplete line

    // Process each complete line slowly
    this.processLines(lines, callback);
  }

  async processLines(lines, callback) {
    for (const line of lines) {
      if (line.trim()) {
        // Simulate slow processing
        await new Promise((resolve) => setTimeout(resolve, 50));

        try {
          const parsed = JSON.parse(line);
          this.push(parsed);
        } catch (err) {
          console.error("Invalid JSON:", line);
        }
      }
    }
    callback();
  }

  _flush(callback) {
    if (this.buffer.trim()) {
      try {
        const parsed = JSON.parse(this.buffer);
        this.push(parsed);
      } catch (err) {
        console.error("Invalid JSON in buffer:", this.buffer);
      }
    }
    callback();
  }
}

// HTTP server that handles backpressure
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/process-json") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    const processor = new SlowJSONParser();

    // Handle backpressure from request to processor
    req.on("data", (chunk) => {
      const canWriteMore = processor.write(chunk);

      if (!canWriteMore) {
        req.pause();
        processor.once("drain", () => {
          req.resume();
        });
      }
    });

    req.on("end", () => {
      processor.end();
    });

    // Handle backpressure from processor to response
    processor.on("data", (processedData) => {
      const jsonString = JSON.stringify(processedData) + "\n";
      const canWriteMore = res.write(jsonString);

      if (!canWriteMore) {
        processor.pause();
        res.once("drain", () => {
          processor.resume();
        });
      }
    });

    processor.on("end", () => {
      res.end();
    });

    processor.on("error", (err) => {
      console.error("Processor error:", err);
      res.statusCode = 500;
      res.end("Processing error");
    });
  }
});

server.listen(3000);
```

## Backpressure Detection and Monitoring

### Custom Stream with Backpressure Metrics

```javascript
const { Writable } = require("stream");

class BackpressureMonitoredWritable extends Writable {
  constructor(options) {
    super(options);
    this.backpressureEvents = 0;
    this.drainEvents = 0;
    this.bytesWritten = 0;
    this.startTime = Date.now();

    this.on("drain", () => {
      this.drainEvents++;
      console.log(`Drain event #${this.drainEvents} - Buffer cleared`);
    });
  }

  _write(chunk, encoding, callback) {
    this.bytesWritten += chunk.length;

    // Simulate slow writing (e.g., to a slow disk or network)
    setTimeout(() => {
      console.log(`Wrote ${chunk.length} bytes (total: ${this.bytesWritten})`);
      callback();
    }, Math.random() * 100); // Random delay 0-100ms
  }

  write(chunk, encoding, callback) {
    const result = super.write(chunk, encoding, callback);

    if (!result) {
      this.backpressureEvents++;
      console.log(
        `⚠️  Backpressure event #${this.backpressureEvents} - Buffer full`
      );
    }

    return result;
  }

  getStats() {
    const elapsed = Date.now() - this.startTime;
    return {
      bytesWritten: this.bytesWritten,
      backpressureEvents: this.backpressureEvents,
      drainEvents: this.drainEvents,
      elapsedMs: elapsed,
      avgThroughput: this.bytesWritten / (elapsed / 1000), // bytes per second
    };
  }
}

// Usage example
const monitoredStream = new BackpressureMonitoredWritable({
  highWaterMark: 1024, // Small buffer to trigger backpressure
});

// Write data that will trigger backpressure
for (let i = 0; i < 100; i++) {
  const data = `Data chunk ${i}: ${"x".repeat(200)}\n`;

  const canWriteMore = monitoredStream.write(data);

  if (!canWriteMore) {
    monitoredStream.once("drain", () => {
      console.log("✅ Ready to write more data");
    });
  }
}

monitoredStream.end();

monitoredStream.on("finish", () => {
  console.log("\n📊 Final Statistics:");
  console.log(monitoredStream.getStats());
});
```

## Handling Backpressure in Different Scenarios

### 1. Database Streaming with Backpressure

```javascript
const { Readable } = require("stream");

// Simulated database query result stream
class DatabaseQueryStream extends Readable {
  constructor(query, batchSize = 100) {
    super({ objectMode: true });
    this.query = query;
    this.batchSize = batchSize;
    this.offset = 0;
    this.isQuerying = false;
  }

  _read() {
    if (this.isQuerying) return;

    this.isQuerying = true;

    // Simulate database query
    setTimeout(() => {
      const results = this.fetchBatch(this.offset, this.batchSize);

      if (results.length === 0) {
        this.push(null); // End of data
      } else {
        results.forEach((row) => this.push(row));
        this.offset += results.length;
      }

      this.isQuerying = false;
    }, 100); // Simulate network delay
  }

  fetchBatch(offset, limit) {
    // Simulate fetching data from database
    if (offset >= 1000) return []; // No more data

    const results = [];
    for (let i = 0; i < limit && offset + i < 1000; i++) {
      results.push({
        id: offset + i,
        name: `User ${offset + i}`,
        email: `user${offset + i}@example.com`,
      });
    }
    return results;
  }
}

// Process database results with backpressure awareness
const fs = require("fs");

const queryStream = new DatabaseQueryStream("SELECT * FROM users");
const outputStream = fs.createWriteStream("users.json");

let userCount = 0;
outputStream.write("[\n");

queryStream.on("data", (user) => {
  userCount++;
  const userJson = JSON.stringify(user);
  const data = userCount === 1 ? `  ${userJson}` : `,\n  ${userJson}`;

  const canWriteMore = outputStream.write(data);

  if (!canWriteMore) {
    console.log("Backpressure: pausing database query stream");
    queryStream.pause();

    outputStream.once("drain", () => {
      console.log("Buffer drained: resuming database query stream");
      queryStream.resume();
    });
  }
});

queryStream.on("end", () => {
  outputStream.write("\n]");
  outputStream.end();
});

outputStream.on("finish", () => {
  console.log(`Processed ${userCount} users`);
});
```

### 2. WebSocket Streaming with Backpressure

```javascript
const WebSocket = require("ws");
const fs = require("fs");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Stream large file to client with backpressure handling
  const fileStream = fs.createReadStream("large-data.json");

  fileStream.on("data", (chunk) => {
    // Check WebSocket readyState and bufferedAmount for backpressure
    if (ws.readyState === WebSocket.OPEN) {
      // Check buffer size (backpressure indicator)
      if (ws.bufferedAmount > 1024 * 1024) {
        // 1MB buffer limit
        console.log("WebSocket backpressure detected - pausing file stream");
        fileStream.pause();

        // Check buffered amount periodically
        const checkBuffer = setInterval(() => {
          if (ws.bufferedAmount < 512 * 1024) {
            // 512KB threshold
            console.log("WebSocket buffer cleared - resuming file stream");
            clearInterval(checkBuffer);
            fileStream.resume();
          }
        }, 100);
      } else {
        ws.send(chunk);
      }
    }
  });

  fileStream.on("end", () => {
    ws.send("END_OF_FILE");
  });

  fileStream.on("error", (err) => {
    console.error("File stream error:", err);
    ws.close();
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    fileStream.destroy();
  });
});
```

## Best Practices for Handling Backpressure

### 1. Always Check write() Return Value

```javascript
// ❌ Bad - ignoring backpressure
function badWrite(stream, data) {
  stream.write(data); // Ignoring return value
}

// ✅ Good - handling backpressure
function goodWrite(stream, data, callback) {
  const canWriteMore = stream.write(data);

  if (!canWriteMore) {
    stream.once("drain", callback);
  } else {
    process.nextTick(callback);
  }
}
```

### 2. Use pipeline() for Automatic Handling

```javascript
const { pipeline } = require("stream");
const fs = require("fs");

// Automatic backpressure handling
pipeline(
  fs.createReadStream("input.txt"),
  new UpperCaseTransform(),
  fs.createWriteStream("output.txt"),
  (err) => {
    if (err) {
      console.error("Pipeline failed:", err);
    } else {
      console.log("Pipeline succeeded");
    }
  }
);
```

### 3. Monitor Buffer Sizes

```javascript
const fs = require("fs");

const writeStream = fs.createWriteStream("output.txt");

// Monitor internal state
setInterval(() => {
  const bufferSize = writeStream.writableBuffer
    ? writeStream.writableBuffer.length
    : 0;
  const highWaterMark = writeStream.writableHighWaterMark;

  console.log(
    `Buffer: ${bufferSize}/${highWaterMark} bytes (${(
      (bufferSize / highWaterMark) *
      100
    ).toFixed(1)}%)`
  );
}, 1000);
```

### 4. Implement Graceful Degradation

```javascript
const fs = require("fs");

class BackpressureAwareProcessor {
  constructor(outputFile) {
    this.writeStream = fs.createWriteStream(outputFile);
    this.backpressureCount = 0;
    this.droppedChunks = 0;
  }

  processChunk(chunk, priority = "normal") {
    const canWriteMore = this.writeStream.write(chunk);

    if (!canWriteMore) {
      this.backpressureCount++;

      if (priority === "low" && this.backpressureCount > 10) {
        // Drop low priority data under high backpressure
        this.droppedChunks++;
        console.log(
          `Dropping low priority chunk (total dropped: ${this.droppedChunks})`
        );
        return;
      }

      // Wait for drain for normal/high priority data
      this.writeStream.once("drain", () => {
        console.log("Buffer drained, ready for more data");
      });
    }
  }
}
```

## Performance Implications

### Memory Usage

```javascript
const fs = require("fs");

// Monitor memory usage during streaming
function monitorMemory(label) {
  const usage = process.memoryUsage();
  console.log(
    `${label} - Heap: ${(usage.heapUsed / 1024 / 1024).toFixed(
      2
    )}MB, External: ${(usage.external / 1024 / 1024).toFixed(2)}MB`
  );
}

// Without proper backpressure handling (bad example)
function badStreaming() {
  const readStream = fs.createReadStream("large-file.txt");
  const chunks = [];

  readStream.on("data", (chunk) => {
    chunks.push(chunk); // Accumulating in memory!
    monitorMemory("Bad streaming");
  });

  readStream.on("end", () => {
    // Process all chunks at once
    const allData = Buffer.concat(chunks);
    fs.writeFileSync("output-bad.txt", allData);
  });
}

// With proper backpressure handling (good example)
function goodStreaming() {
  const readStream = fs.createReadStream("large-file.txt");
  const writeStream = fs.createWriteStream("output-good.txt");

  readStream.pipe(writeStream); // Automatic backpressure

  readStream.on("data", () => {
    monitorMemory("Good streaming");
  });
}
```

## Summary

Backpressure in streams is essential for:

### Key Concepts:

- **Flow Control**: Prevents fast producers from overwhelming slow consumers
- **Memory Protection**: Prevents unlimited buffer growth and memory exhaustion
- **Performance Optimization**: Maintains optimal data flow rates

### How It Works:

- `write()` method returns `false` when buffer is full
- `drain` event signals when buffer has space again
- Producers should pause when backpressure is detected

### Best Practices:

- Always check `write()` return values
- Use `pipe()` or `pipeline()` for automatic handling
- Monitor buffer sizes and memory usage
- Implement graceful degradation for high-load scenarios
- Configure appropriate `highWaterMark` values

### Common Scenarios:

- File processing and copying
- HTTP streaming and uploads
- Database query result streaming
- WebSocket data transmission
- Real-time data processing pipelines

Understanding and properly handling backpressure is crucial for building robust, memory-efficient Node.js applications that can handle large amounts of data without performance degradation or memory leaks.
