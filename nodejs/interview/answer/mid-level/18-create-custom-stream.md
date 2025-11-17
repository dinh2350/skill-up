# How do you create a custom stream?

Creating custom streams in Node.js involves extending the base stream classes from the `stream` module. You can create custom Readable, Writable, Duplex, or Transform streams by implementing specific methods that define their behavior.

## Overview of Custom Streams

Node.js provides four base classes for creating custom streams:

- `Readable` - for custom readable streams
- `Writable` - for custom writable streams
- `Duplex` - for custom duplex streams (both readable and writable)
- `Transform` - for custom transform streams (duplex with transformation)

## 1. Creating Custom Readable Streams

A custom readable stream must implement the `_read()` method.

### Basic Custom Readable Stream

```javascript
const { Readable } = require("stream");

class CounterStream extends Readable {
  constructor(options) {
    super(options);
    this.count = 0;
    this.max = options?.max || 10;
  }

  _read() {
    if (this.count < this.max) {
      // Push data to the stream
      this.push(`Number: ${this.count++}\n`);
    } else {
      // Signal end of stream
      this.push(null);
    }
  }
}

// Usage
const counter = new CounterStream({ max: 5 });

counter.on("data", (chunk) => {
  console.log("Data:", chunk.toString());
});

counter.on("end", () => {
  console.log("Stream ended");
});
```

### Advanced Readable Stream Example

```javascript
const { Readable } = require("stream");

class DatabaseQueryStream extends Readable {
  constructor(query, options = {}) {
    super({ objectMode: true, ...options });
    this.query = query;
    this.offset = 0;
    this.batchSize = options.batchSize || 100;
    this.hasMore = true;
    this.isReading = false;
  }

  async _read() {
    if (this.isReading || !this.hasMore) {
      return;
    }

    this.isReading = true;

    try {
      // Simulate database query
      const results = await this.fetchBatch();

      if (results.length === 0) {
        this.hasMore = false;
        this.push(null); // End of stream
      } else {
        // Push each result as an object
        results.forEach((row) => this.push(row));
        this.offset += results.length;
      }
    } catch (error) {
      this.emit("error", error);
    } finally {
      this.isReading = false;
    }
  }

  async fetchBatch() {
    // Simulate async database call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.offset >= 1000) {
          resolve([]);
        } else {
          const batch = [];
          for (let i = 0; i < this.batchSize && this.offset + i < 1000; i++) {
            batch.push({
              id: this.offset + i,
              name: `User ${this.offset + i}`,
              email: `user${this.offset + i}@example.com`,
            });
          }
          resolve(batch);
        }
      }, 100);
    });
  }
}

// Usage
const dbStream = new DatabaseQueryStream("SELECT * FROM users");

dbStream.on("data", (user) => {
  console.log("User:", user);
});

dbStream.on("end", () => {
  console.log("All users processed");
});

dbStream.on("error", (err) => {
  console.error("Query error:", err);
});
```

## 2. Creating Custom Writable Streams

A custom writable stream must implement the `_write()` method.

### Basic Custom Writable Stream

```javascript
const { Writable } = require("stream");
const fs = require("fs");

class FileWriterStream extends Writable {
  constructor(filename, options) {
    super(options);
    this.filename = filename;
    this.fd = null;
    this.bytesWritten = 0;

    // Open file for writing
    this.open();
  }

  async open() {
    try {
      this.fd = await fs.promises.open(this.filename, "w");
      this.emit("open");
    } catch (error) {
      this.emit("error", error);
    }
  }

  _write(chunk, encoding, callback) {
    if (!this.fd) {
      this.once("open", () => {
        this._write(chunk, encoding, callback);
      });
      return;
    }

    // Write chunk to file
    this.fd
      .write(chunk)
      .then(() => {
        this.bytesWritten += chunk.length;
        callback();
      })
      .catch((error) => {
        callback(error);
      });
  }

  _destroy(err, callback) {
    if (this.fd) {
      this.fd
        .close()
        .then(() => callback(err))
        .catch(() => callback(err));
    } else {
      callback(err);
    }
  }

  getBytesWritten() {
    return this.bytesWritten;
  }
}

// Usage
const writer = new FileWriterStream("output.txt");

writer.write("Hello, World!\n");
writer.write("This is a custom writable stream.\n");
writer.end("Final line.\n");

writer.on("finish", () => {
  console.log(
    `File written successfully. Total bytes: ${writer.getBytesWritten()}`
  );
});

writer.on("error", (err) => {
  console.error("Write error:", err);
});
```

### Advanced Writable Stream with Batching

```javascript
const { Writable } = require("stream");

class BatchWriterStream extends Writable {
  constructor(options = {}) {
    super({ objectMode: true, ...options });
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 1000; // 1 second
    this.batch = [];
    this.processor = options.processor || this.defaultProcessor;

    // Auto-flush timer
    this.timer = setInterval(() => {
      this.flushBatch();
    }, this.flushInterval);
  }

  _write(chunk, encoding, callback) {
    this.batch.push(chunk);

    if (this.batch.length >= this.batchSize) {
      this.flushBatch(callback);
    } else {
      callback();
    }
  }

  _final(callback) {
    // Flush remaining items when stream ends
    this.flushBatch(() => {
      clearInterval(this.timer);
      callback();
    });
  }

  async flushBatch(callback) {
    if (this.batch.length === 0) {
      if (callback) callback();
      return;
    }

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      await this.processor(currentBatch);
      console.log(`Processed batch of ${currentBatch.length} items`);
      if (callback) callback();
    } catch (error) {
      console.error("Batch processing error:", error);
      if (callback) callback(error);
    }
  }

  async defaultProcessor(items) {
    // Default processor - just log items
    console.log("Processing items:", items);

    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  _destroy(err, callback) {
    clearInterval(this.timer);
    this.flushBatch(() => callback(err));
  }
}

// Usage
const batchWriter = new BatchWriterStream({
  batchSize: 3,
  processor: async (items) => {
    // Custom processor
    console.log(
      "Custom processing:",
      items.map((item) => item.toUpperCase())
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
  },
});

["hello", "world", "node", "js", "streams", "custom"].forEach((item) => {
  batchWriter.write(item);
});

batchWriter.end();

batchWriter.on("finish", () => {
  console.log("Batch writer finished");
});
```

## 3. Creating Custom Transform Streams

A custom transform stream must implement the `_transform()` method and optionally `_flush()`.

### Basic Custom Transform Stream

```javascript
const { Transform } = require("stream");

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Transform chunk to uppercase
    const upperChunk = chunk.toString().toUpperCase();
    this.push(upperChunk);
    callback();
  }
}

// Usage
const fs = require("fs");

fs.createReadStream("input.txt")
  .pipe(new UpperCaseTransform())
  .pipe(fs.createWriteStream("output.txt"))
  .on("finish", () => {
    console.log("Text transformed to uppercase");
  });
```

### Advanced Transform Stream Example

```javascript
const { Transform } = require("stream");

class JSONTransformStream extends Transform {
  constructor(options = {}) {
    super({ objectMode: true, ...options });
    this.transformer = options.transformer || ((obj) => obj);
    this.filter = options.filter || (() => true);
    this.processedCount = 0;
    this.filteredCount = 0;
  }

  _transform(chunk, encoding, callback) {
    try {
      let data;

      // Handle different input types
      if (typeof chunk === "string") {
        data = JSON.parse(chunk);
      } else if (Buffer.isBuffer(chunk)) {
        data = JSON.parse(chunk.toString());
      } else {
        data = chunk;
      }

      // Apply filter
      if (!this.filter(data)) {
        this.filteredCount++;
        callback();
        return;
      }

      // Apply transformation
      const transformed = this.transformer(data);
      this.processedCount++;

      // Push transformed data
      this.push(transformed);
      callback();
    } catch (error) {
      console.error("Transform error:", error);
      callback(error);
    }
  }

  _flush(callback) {
    // Emit final statistics
    this.push({
      _meta: {
        processed: this.processedCount,
        filtered: this.filteredCount,
        total: this.processedCount + this.filteredCount,
      },
    });
    callback();
  }

  getStats() {
    return {
      processed: this.processedCount,
      filtered: this.filteredCount,
      total: this.processedCount + this.filteredCount,
    };
  }
}

// Usage
const transformer = new JSONTransformStream({
  filter: (obj) => obj.age >= 18, // Only adults
  transformer: (obj) => ({
    fullName: `${obj.firstName} ${obj.lastName}`,
    email: obj.email.toLowerCase(),
    isAdult: true,
    processedAt: new Date().toISOString(),
  }),
});

// Sample data
const users = [
  { firstName: "John", lastName: "Doe", email: "JOHN@EXAMPLE.COM", age: 25 },
  { firstName: "Jane", lastName: "Smith", email: "JANE@EXAMPLE.COM", age: 17 },
  { firstName: "Bob", lastName: "Johnson", email: "BOB@EXAMPLE.COM", age: 30 },
];

users.forEach((user) => transformer.write(user));
transformer.end();

transformer.on("data", (data) => {
  console.log("Transformed:", data);
});

transformer.on("end", () => {
  console.log("Transform complete. Stats:", transformer.getStats());
});
```

### CSV Parser Transform Stream

```javascript
const { Transform } = require("stream");

class CSVParserTransform extends Transform {
  constructor(options = {}) {
    super({ objectMode: true, ...options });
    this.headers = null;
    this.delimiter = options.delimiter || ",";
    this.skipEmptyLines = options.skipEmptyLines !== false;
    this.lineNumber = 0;
  }

  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split("\n");

    for (const line of lines) {
      this.lineNumber++;

      if (this.skipEmptyLines && !line.trim()) {
        continue;
      }

      try {
        const fields = this.parseLine(line);

        if (!this.headers) {
          // First line is headers
          this.headers = fields;
          continue;
        }

        // Create object from fields
        const record = {};
        this.headers.forEach((header, index) => {
          record[header.trim()] = fields[index] ? fields[index].trim() : "";
        });

        record._lineNumber = this.lineNumber;
        this.push(record);
      } catch (error) {
        this.emit(
          "error",
          new Error(`Parse error at line ${this.lineNumber}: ${error.message}`)
        );
        return;
      }
    }

    callback();
  }

  parseLine(line) {
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === this.delimiter && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    fields.push(current);
    return fields;
  }

  _flush(callback) {
    // Emit summary
    this.push({
      _summary: {
        totalLines: this.lineNumber,
        headers: this.headers,
      },
    });
    callback();
  }
}

// Usage
const fs = require("fs");
const readline = require("readline");

const csvParser = new CSVParserTransform({ delimiter: "," });

// Read CSV file line by line
const fileStream = fs.createReadStream("users.csv");
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  csvParser.write(line + "\n");
});

rl.on("close", () => {
  csvParser.end();
});

csvParser.on("data", (record) => {
  if (record._summary) {
    console.log("CSV Summary:", record._summary);
  } else {
    console.log("Parsed record:", record);
  }
});

csvParser.on("error", (err) => {
  console.error("CSV parse error:", err);
});
```

## 4. Creating Custom Duplex Streams

A custom duplex stream must implement both `_read()` and `_write()` methods.

### Basic Custom Duplex Stream

```javascript
const { Duplex } = require("stream");

class EchoStream extends Duplex {
  constructor(options) {
    super(options);
    this.data = [];
    this.readIndex = 0;
  }

  _write(chunk, encoding, callback) {
    // Store written data for later reading
    this.data.push({
      data: chunk,
      timestamp: new Date(),
      encoding: encoding,
    });

    console.log(`Stored: ${chunk.toString()}`);
    callback();
  }

  _read() {
    if (this.readIndex < this.data.length) {
      const item = this.data[this.readIndex++];
      const echo = `Echo [${item.timestamp.toISOString()}]: ${item.data}`;
      this.push(echo);
    } else {
      // No more data available right now
      this.push(null);
    }
  }
}

// Usage
const echo = new EchoStream();

// Write some data
echo.write("Hello\n");
echo.write("World\n");
echo.end();

// Read the echoed data
echo.on("data", (chunk) => {
  console.log("Read:", chunk.toString());
});

echo.on("end", () => {
  console.log("Echo stream ended");
});
```

### Advanced Duplex Stream - WebSocket Simulator

```javascript
const { Duplex } = require("stream");
const EventEmitter = require("events");

class WebSocketSimulator extends Duplex {
  constructor(options = {}) {
    super({ objectMode: true, ...options });
    this.connected = false;
    this.messageQueue = [];
    this.outgoingQueue = [];
    this.pingInterval = options.pingInterval || 30000;
    this.eventBus = new EventEmitter();

    // Simulate connection
    this.connect();
  }

  connect() {
    setTimeout(() => {
      this.connected = true;
      this.emit("connect");
      console.log("WebSocket connected");

      // Start ping timer
      this.pingTimer = setInterval(() => {
        this.sendPing();
      }, this.pingInterval);

      // Process queued messages
      this.processQueues();
    }, 100);
  }

  _write(chunk, encoding, callback) {
    if (!this.connected) {
      // Queue messages if not connected
      this.outgoingQueue.push({ chunk, encoding, callback });
      return;
    }

    // Simulate sending message over network
    setTimeout(() => {
      console.log(`Sent: ${JSON.stringify(chunk)}`);

      // Simulate echo response
      this.messageQueue.push({
        type: "echo",
        data: chunk,
        timestamp: Date.now(),
      });

      callback();
    }, Math.random() * 100);
  }

  _read() {
    if (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.push(message);
    }
  }

  sendPing() {
    if (this.connected) {
      this.messageQueue.push({
        type: "ping",
        timestamp: Date.now(),
      });
    }
  }

  processQueues() {
    // Process outgoing queue
    while (this.outgoingQueue.length > 0) {
      const { chunk, encoding, callback } = this.outgoingQueue.shift();
      this._write(chunk, encoding, callback);
    }
  }

  _destroy(err, callback) {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    this.connected = false;
    callback(err);
  }
}

// Usage
const ws = new WebSocketSimulator();

ws.on("connect", () => {
  // Send some messages
  ws.write({ type: "message", text: "Hello WebSocket" });
  ws.write({ type: "message", text: "How are you?" });
});

ws.on("data", (message) => {
  console.log("Received:", message);
});

ws.on("end", () => {
  console.log("WebSocket connection ended");
});

// Clean up after 5 seconds
setTimeout(() => {
  ws.end();
}, 5000);
```

## 5. Stream Factory Patterns

### Stream Factory for Different Types

```javascript
const { Readable, Writable, Transform } = require("stream");

class StreamFactory {
  static createDataGenerator(data, options = {}) {
    return new Readable({
      objectMode: true,
      ...options,
      read() {
        if (data.length > 0) {
          this.push(data.shift());
        } else {
          this.push(null);
        }
      },
    });
  }

  static createDataCollector(callback, options = {}) {
    const collected = [];

    return new Writable({
      objectMode: true,
      ...options,
      write(chunk, encoding, cb) {
        collected.push(chunk);
        cb();
      },
      final(cb) {
        callback(collected);
        cb();
      },
    });
  }

  static createMapper(mapFunction, options = {}) {
    return new Transform({
      objectMode: true,
      ...options,
      transform(chunk, encoding, callback) {
        try {
          const result = mapFunction(chunk);
          this.push(result);
          callback();
        } catch (error) {
          callback(error);
        }
      },
    });
  }

  static createFilter(filterFunction, options = {}) {
    return new Transform({
      objectMode: true,
      ...options,
      transform(chunk, encoding, callback) {
        try {
          if (filterFunction(chunk)) {
            this.push(chunk);
          }
          callback();
        } catch (error) {
          callback(error);
        }
      },
    });
  }
}

// Usage
const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const generator = StreamFactory.createDataGenerator([...data]);
const filter = StreamFactory.createFilter((x) => x % 2 === 0); // Even numbers
const mapper = StreamFactory.createMapper((x) => x * x); // Square numbers
const collector = StreamFactory.createDataCollector((results) => {
  console.log("Final results:", results);
});

generator.pipe(filter).pipe(mapper).pipe(collector);
```

## 6. Advanced Custom Stream Examples

### Rate-Limited Stream

```javascript
const { Transform } = require("stream");

class RateLimitedTransform extends Transform {
  constructor(options = {}) {
    super(options);
    this.rateLimit = options.rateLimit || 10; // items per second
    this.interval = 1000 / this.rateLimit;
    this.lastEmit = 0;
    this.queue = [];
    this.processing = false;
  }

  _transform(chunk, encoding, callback) {
    this.queue.push({ chunk, encoding, callback });
    this.processQueue();
  }

  processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const now = Date.now();
    const timeSinceLastEmit = now - this.lastEmit;

    if (timeSinceLastEmit >= this.interval) {
      // Can emit immediately
      this.emitNext();
    } else {
      // Need to wait
      const delay = this.interval - timeSinceLastEmit;
      setTimeout(() => {
        this.emitNext();
      }, delay);
    }
  }

  emitNext() {
    if (this.queue.length > 0) {
      const { chunk, encoding, callback } = this.queue.shift();
      this.push(chunk);
      this.lastEmit = Date.now();
      callback();
    }

    this.processing = false;

    // Process next item if available
    if (this.queue.length > 0) {
      setImmediate(() => this.processQueue());
    }
  }

  _flush(callback) {
    // Wait for queue to be empty
    const waitForEmpty = () => {
      if (this.queue.length === 0 && !this.processing) {
        callback();
      } else {
        setTimeout(waitForEmpty, 10);
      }
    };
    waitForEmpty();
  }
}

// Usage
const rateLimited = new RateLimitedTransform({ rateLimit: 2 }); // 2 items per second

["a", "b", "c", "d", "e"].forEach((item, index) => {
  setTimeout(() => {
    rateLimited.write(`Item ${item}\n`);
    if (index === 4) rateLimited.end();
  }, index * 100); // Send items quickly
});

rateLimited.on("data", (chunk) => {
  console.log(`${new Date().toISOString()}: ${chunk.toString().trim()}`);
});
```

## Best Practices for Custom Streams

### 1. Error Handling

```javascript
const { Transform } = require("stream");

class RobustTransform extends Transform {
  constructor(options = {}) {
    super(options);
    this.errorCount = 0;
    this.maxErrors = options.maxErrors || 5;
  }

  _transform(chunk, encoding, callback) {
    try {
      // Your transformation logic
      const result = this.processChunk(chunk);
      this.push(result);
      callback();
    } catch (error) {
      this.errorCount++;

      if (this.errorCount > this.maxErrors) {
        callback(new Error(`Too many errors: ${error.message}`));
      } else {
        console.warn(`Error ${this.errorCount}: ${error.message}`);
        callback(); // Continue processing
      }
    }
  }

  processChunk(chunk) {
    // Simulate processing that might fail
    if (Math.random() < 0.1) {
      throw new Error("Random processing error");
    }
    return chunk.toString().toUpperCase();
  }
}
```

### 2. Resource Cleanup

```javascript
const { Writable } = require("stream");
const fs = require("fs");

class FileWriter extends Writable {
  constructor(filename) {
    super();
    this.filename = filename;
    this.fd = null;
    this.opening = this.open();
  }

  async open() {
    try {
      this.fd = await fs.promises.open(this.filename, "w");
    } catch (error) {
      this.emit("error", error);
    }
  }

  async _write(chunk, encoding, callback) {
    if (!this.fd) {
      await this.opening;
    }

    try {
      await this.fd.write(chunk);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _destroy(err, callback) {
    if (this.fd) {
      this.fd.close().finally(() => callback(err));
    } else {
      callback(err);
    }
  }
}
```

## Summary

Creating custom streams in Node.js involves:

### Key Methods to Implement:

- **Readable**: `_read()` - Generate or fetch data
- **Writable**: `_write()` - Process incoming data
- **Transform**: `_transform()` and optionally `_flush()` - Transform data
- **Duplex**: Both `_read()` and `_write()` - Handle both reading and writing

### Best Practices:

- Always handle errors appropriately
- Implement proper resource cleanup in `_destroy()`
- Use `objectMode` for non-string/buffer data
- Handle backpressure correctly
- Emit appropriate events
- Validate input data
- Implement timeouts for async operations

### Common Use Cases:

- Data transformation and filtering
- Database query result streaming
- File processing with custom logic
- Network protocol implementations
- Rate limiting and throttling
- Batch processing
- Real-time data processing

Custom streams provide powerful abstractions for handling data flow in Node.js applications, enabling efficient processing of large datasets with proper memory management and flow control.
