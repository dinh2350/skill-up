# What are duplex and transform streams?

Duplex and Transform streams are advanced stream types in Node.js that combine the functionality of readable and writable streams. They represent more complex data flow patterns where streams can both read and write data.

## Overview

| Stream Type   | Description                     | Inheritance         | Key Methods                | Use Cases                    |
| ------------- | ------------------------------- | ------------------- | -------------------------- | ---------------------------- |
| **Duplex**    | Both readable and writable      | Readable + Writable | `_read()`, `_write()`      | TCP sockets, WebSockets      |
| **Transform** | Duplex with data transformation | Duplex              | `_transform()`, `_flush()` | Data processing, compression |

## Duplex Streams

Duplex streams implement both the Readable and Writable interfaces, allowing them to be both read from and written to. The read and write operations are independent of each other.

### Characteristics

- **Bidirectional**: Can both read and write data
- **Independent Operations**: Reading and writing are separate operations
- **Implementation**: Must implement both `_read()` and `_write()` methods
- **Examples**: TCP sockets, WebSocket connections, crypto streams

### Basic Duplex Stream Example

```javascript
const { Duplex } = require("stream");

class EchoDuplex extends Duplex {
  constructor(options) {
    super(options);
    this.data = [];
    this.readIndex = 0;
  }

  // Writable side - handle incoming data
  _write(chunk, encoding, callback) {
    console.log(`Received: ${chunk.toString()}`);

    // Store the data for later reading
    this.data.push({
      data: chunk,
      timestamp: new Date(),
    });

    callback(); // Signal write completion
  }

  // Readable side - provide data for reading
  _read() {
    if (this.readIndex < this.data.length) {
      const item = this.data[this.readIndex++];
      const output = `Echo [${item.timestamp.toISOString()}]: ${item.data}`;
      this.push(output);
    } else {
      // No more data available right now
      // Don't push null unless we want to end the stream
    }
  }
}

// Usage
const echo = new EchoDuplex();

// Write some data (writable side)
echo.write("Hello ");
echo.write("World!\n");

// Read the echoed data (readable side)
echo.on("data", (chunk) => {
  console.log("Read:", chunk.toString());
});

// After some time, read more data
setTimeout(() => {
  echo.write("Another message\n");
}, 1000);
```

### Real-World Duplex Example: TCP Socket Simulation

```javascript
const { Duplex } = require("stream");
const EventEmitter = require("events");

class TCPSocketSimulator extends Duplex {
  constructor(options = {}) {
    super(options);
    this.connected = false;
    this.remoteAddress = options.remoteAddress || "127.0.0.1";
    this.remotePort = options.remotePort || 8080;
    this.incomingData = [];
    this.outgoingQueue = [];

    // Simulate connection establishment
    this.connect();
  }

  connect() {
    setTimeout(() => {
      this.connected = true;
      this.emit("connect");
      console.log(`Connected to ${this.remoteAddress}:${this.remotePort}`);

      // Start simulating incoming data
      this.simulateIncomingData();
    }, 100);
  }

  // Writable side - data to send over the socket
  _write(chunk, encoding, callback) {
    if (!this.connected) {
      this.outgoingQueue.push({ chunk, encoding, callback });
      return;
    }

    // Simulate network transmission
    console.log(`Sending: ${chunk.toString()}`);

    // Simulate transmission delay
    setTimeout(() => {
      console.log(`Sent: ${chunk.toString()}`);
      callback();
    }, Math.random() * 100);
  }

  // Readable side - data received from the socket
  _read() {
    if (this.incomingData.length > 0) {
      const data = this.incomingData.shift();
      this.push(data);
    }
  }

  simulateIncomingData() {
    // Simulate receiving data from remote
    const messages = [
      "Welcome to the server\n",
      "Your connection is established\n",
      "Type your message:\n",
    ];

    messages.forEach((msg, index) => {
      setTimeout(() => {
        this.incomingData.push(Buffer.from(msg));
      }, (index + 1) * 500);
    });
  }

  _destroy(err, callback) {
    this.connected = false;
    console.log("Socket disconnected");
    callback(err);
  }
}

// Usage
const socket = new TCPSocketSimulator();

socket.on("connect", () => {
  // Send data to server
  socket.write("Hello Server!\n");
  socket.write("How are you?\n");
});

socket.on("data", (data) => {
  console.log("Received from server:", data.toString());
});

socket.on("end", () => {
  console.log("Server ended the connection");
});
```

## Transform Streams

Transform streams are a special type of duplex stream where the output is computed based on the input. They're designed for data transformation scenarios.

### Characteristics

- **Data Transformation**: Input data is transformed and passed as output
- **Inheritance**: Extends Duplex stream
- **Implementation**: Must implement `_transform()` and optionally `_flush()`
- **Examples**: gzip/gunzip, encryption/decryption, parsing, filtering

### Basic Transform Stream Example

```javascript
const { Transform } = require("stream");

class UppercaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Transform the input chunk
    const upperChunk = chunk.toString().toUpperCase();

    // Push the transformed data to the output
    this.push(upperChunk);

    // Signal completion
    callback();
  }
}

// Usage
const fs = require("fs");

fs.createReadStream("input.txt")
  .pipe(new UppercaseTransform())
  .pipe(fs.createWriteStream("output.txt"))
  .on("finish", () => {
    console.log("Text transformed to uppercase");
  });
```

### Advanced Transform Stream Example

```javascript
const { Transform } = require("stream");

class JSONLineProcessor extends Transform {
  constructor(options = {}) {
    super({ objectMode: true, ...options });
    this.lineNumber = 0;
    this.processedCount = 0;
    this.errorCount = 0;
    this.filter = options.filter || (() => true);
    this.transformer = options.transformer || ((obj) => obj);
  }

  _transform(line, encoding, callback) {
    this.lineNumber++;

    try {
      // Skip empty lines
      if (!line.toString().trim()) {
        callback();
        return;
      }

      // Parse JSON
      const data = JSON.parse(line.toString());

      // Apply filter
      if (!this.filter(data)) {
        callback();
        return;
      }

      // Apply transformation
      const transformed = this.transformer(data);

      // Add metadata
      const enriched = {
        ...transformed,
        _meta: {
          lineNumber: this.lineNumber,
          processedAt: new Date().toISOString(),
          processedCount: ++this.processedCount,
        },
      };

      this.push(enriched);
      callback();
    } catch (error) {
      this.errorCount++;
      console.warn(
        `Error processing line ${this.lineNumber}: ${error.message}`
      );

      // Emit error object instead of failing
      this.push({
        _error: {
          lineNumber: this.lineNumber,
          error: error.message,
          originalData: line.toString(),
        },
      });

      callback();
    }
  }

  _flush(callback) {
    // Emit final statistics
    this.push({
      _summary: {
        totalLines: this.lineNumber,
        processedCount: this.processedCount,
        errorCount: this.errorCount,
        successRate:
          (this.processedCount / (this.lineNumber - this.errorCount)) * 100,
      },
    });

    callback();
  }
}

// Usage
const processor = new JSONLineProcessor({
  filter: (obj) => obj.age >= 18, // Only adults
  transformer: (obj) => ({
    fullName: `${obj.firstName} ${obj.lastName}`,
    email: obj.email.toLowerCase(),
    isAdult: true,
    category: obj.age >= 65 ? "senior" : "adult",
  }),
});

// Sample JSON lines
const jsonLines = [
  '{"firstName": "John", "lastName": "Doe", "email": "JOHN@EXAMPLE.COM", "age": 25}',
  '{"firstName": "Jane", "lastName": "Smith", "email": "JANE@EXAMPLE.COM", "age": 17}',
  '{"firstName": "Bob", "lastName": "Johnson", "email": "BOB@EXAMPLE.COM", "age": 70}',
  "invalid json line",
  '{"firstName": "Alice", "lastName": "Wilson", "email": "ALICE@EXAMPLE.COM", "age": 30}',
];

jsonLines.forEach((line) => processor.write(line + "\n"));
processor.end();

processor.on("data", (result) => {
  if (result._summary) {
    console.log("Processing Summary:", result._summary);
  } else if (result._error) {
    console.log("Error:", result._error);
  } else {
    console.log("Processed:", result);
  }
});
```

## Key Differences Between Duplex and Transform

### 1. Purpose and Data Flow

```javascript
// Duplex Stream - Independent read/write operations
class IndependentDuplex extends Duplex {
  constructor() {
    super();
    this.writeData = [];
    this.readData = ["predefined", "data", "items"];
    this.readIndex = 0;
  }

  _write(chunk, encoding, callback) {
    // Writing doesn't affect reading
    this.writeData.push(chunk.toString());
    console.log("Stored for writing:", chunk.toString());
    callback();
  }

  _read() {
    // Reading is independent of writing
    if (this.readIndex < this.readData.length) {
      this.push(this.readData[this.readIndex++]);
    }
  }
}

// Transform Stream - Input directly affects output
class DirectTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Input is directly transformed to output
    const reversed = chunk.toString().split("").reverse().join("");
    this.push(reversed);
    callback();
  }
}
```

### 2. Implementation Requirements

```javascript
// Duplex requires both _read and _write
class MyDuplex extends Duplex {
  _read(size) {
    // Must implement readable behavior
  }

  _write(chunk, encoding, callback) {
    // Must implement writable behavior
  }
}

// Transform requires _transform (and optionally _flush)
class MyTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Must implement transformation logic
  }

  _flush(callback) {
    // Optional: final processing when input ends
  }
}
```

## Real-World Examples

### 1. CSV to JSON Transform

```javascript
const { Transform } = require("stream");

class CSVToJSONTransform extends Transform {
  constructor(options = {}) {
    super({ objectMode: true, ...options });
    this.headers = null;
    this.delimiter = options.delimiter || ",";
    this.skipHeader = options.skipHeader !== false;
  }

  _transform(line, encoding, callback) {
    const lineStr = line.toString().trim();

    if (!lineStr) {
      callback();
      return;
    }

    const fields = this.parseCSVLine(lineStr);

    if (!this.headers) {
      if (this.skipHeader) {
        this.headers = fields;
        callback();
        return;
      } else {
        // Generate headers if not skipping
        this.headers = fields.map((_, index) => `field_${index}`);
      }
    }

    // Create JSON object
    const jsonObj = {};
    this.headers.forEach((header, index) => {
      jsonObj[header] = fields[index] || "";
    });

    this.push(jsonObj);
    callback();
  }

  parseCSVLine(line) {
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === this.delimiter && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    fields.push(current.trim());
    return fields;
  }

  _flush(callback) {
    console.log(`Processed CSV with headers: ${this.headers?.join(", ")}`);
    callback();
  }
}

// Usage
const fs = require("fs");
const readline = require("readline");

const csvTransform = new CSVToJSONTransform();
const fileStream = fs.createReadStream("users.csv");
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  csvTransform.write(line);
});

rl.on("close", () => {
  csvTransform.end();
});

csvTransform.on("data", (jsonObj) => {
  console.log("JSON Object:", jsonObj);
});
```

### 2. Compression Transform with Built-in Streams

```javascript
const fs = require("fs");
const zlib = require("zlib");
const crypto = require("crypto");

// Built-in transform streams
const gzipTransform = zlib.createGzip();
const cryptoTransform = crypto.createCipher("aes192", "secret-key");

// Custom transform for adding metadata
class MetadataTransform extends Transform {
  constructor() {
    super();
    this.startTime = Date.now();
    this.byteCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.byteCount += chunk.length;

    // Add processing timestamp every 1KB
    if (this.byteCount % 1024 === 0) {
      const metadata = `\n[PROCESSED: ${
        this.byteCount
      } bytes at ${new Date().toISOString()}]\n`;
      this.push(metadata);
    }

    this.push(chunk);
    callback();
  }

  _flush(callback) {
    const duration = Date.now() - this.startTime;
    const summary = `\n[SUMMARY: ${this.byteCount} total bytes processed in ${duration}ms]\n`;
    this.push(summary);
    callback();
  }
}

// Pipeline with multiple transforms
fs.createReadStream("large-file.txt")
  .pipe(new MetadataTransform()) // Add metadata
  .pipe(gzipTransform) // Compress
  .pipe(cryptoTransform) // Encrypt
  .pipe(fs.createWriteStream("output.gz.enc"))
  .on("finish", () => {
    console.log("File processed: metadata added, compressed, and encrypted");
  });
```

### 3. WebSocket-like Duplex Stream

```javascript
const { Duplex } = require("stream");

class WebSocketSimulator extends Duplex {
  constructor(options = {}) {
    super({ objectMode: true, ...options });
    this.connected = false;
    this.messageQueue = [];
    this.incomingQueue = [];
    this.heartbeatInterval = options.heartbeat || 30000;

    this.connect();
  }

  connect() {
    setTimeout(() => {
      this.connected = true;
      this.emit("connect");
      console.log("WebSocket connected");

      // Start heartbeat
      this.heartbeat = setInterval(() => {
        this.incomingQueue.push({
          type: "ping",
          timestamp: Date.now(),
        });
      }, this.heartbeatInterval);

      // Process any queued messages
      this.processQueues();
    }, 100);
  }

  // Writable side - outgoing messages
  _write(chunk, encoding, callback) {
    if (!this.connected) {
      this.messageQueue.push({ chunk, encoding, callback });
      return;
    }

    const message = typeof chunk === "string" ? JSON.parse(chunk) : chunk;

    console.log("Sending message:", message);

    // Simulate network delay
    setTimeout(() => {
      // Echo the message back (simulate server response)
      this.incomingQueue.push({
        type: "echo",
        original: message,
        timestamp: Date.now(),
      });

      callback();
    }, Math.random() * 200);
  }

  // Readable side - incoming messages
  _read() {
    if (this.incomingQueue.length > 0) {
      const message = this.incomingQueue.shift();
      this.push(message);
    }
  }

  processQueues() {
    // Send any queued outgoing messages
    while (this.messageQueue.length > 0) {
      const { chunk, encoding, callback } = this.messageQueue.shift();
      this._write(chunk, encoding, callback);
    }
  }

  _destroy(err, callback) {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
    }
    this.connected = false;
    console.log("WebSocket disconnected");
    callback(err);
  }
}

// Usage
const ws = new WebSocketSimulator();

ws.on("connect", () => {
  // Send messages
  ws.write(JSON.stringify({ type: "chat", text: "Hello!" }));
  ws.write(JSON.stringify({ type: "status", value: "active" }));
});

ws.on("data", (message) => {
  console.log("Received:", message);

  if (message.type === "ping") {
    // Respond to ping
    ws.write(JSON.stringify({ type: "pong", timestamp: Date.now() }));
  }
});

// Clean up after 10 seconds
setTimeout(() => {
  ws.end();
}, 10000);
```

## Built-in Examples

### Node.js Built-in Duplex Streams

```javascript
const net = require("net");
const crypto = require("crypto");
const zlib = require("zlib");

// TCP Socket (Duplex)
const server = net.createServer((socket) => {
  console.log("Client connected");

  // socket is a duplex stream
  socket.write("Welcome to the server!\n");

  socket.on("data", (data) => {
    console.log("Received:", data.toString());
    socket.write(`Echo: ${data}`);
  });

  socket.on("end", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000);
```

### Node.js Built-in Transform Streams

```javascript
const fs = require("fs");
const zlib = require("zlib");
const crypto = require("crypto");

// Compression transform
const gzipStream = zlib.createGzip();

// Encryption transform
const cipherStream = crypto.createCipher("aes192", "password");

// Chaining transforms
fs.createReadStream("input.txt")
  .pipe(gzipStream) // Transform: compress
  .pipe(cipherStream) // Transform: encrypt
  .pipe(fs.createWriteStream("output.gz.enc"))
  .on("finish", () => {
    console.log("File compressed and encrypted");
  });
```

## Best Practices

### 1. Error Handling

```javascript
const { Transform } = require("stream");

class RobustTransform extends Transform {
  constructor(options = {}) {
    super(options);
    this.maxErrors = options.maxErrors || 10;
    this.errorCount = 0;
  }

  _transform(chunk, encoding, callback) {
    try {
      const result = this.processChunk(chunk);
      this.push(result);
      callback();
    } catch (error) {
      this.errorCount++;

      if (this.errorCount > this.maxErrors) {
        callback(new Error(`Too many errors: ${error.message}`));
      } else {
        console.warn(`Transform error ${this.errorCount}: ${error.message}`);
        // Skip this chunk and continue
        callback();
      }
    }
  }

  processChunk(chunk) {
    // Your processing logic here
    return chunk.toString().toUpperCase();
  }
}
```

### 2. Resource Management

```javascript
const { Duplex } = require("stream");

class ResourceManagedDuplex extends Duplex {
  constructor(options) {
    super(options);
    this.resources = new Set();
    this.setupCleanup();
  }

  setupCleanup() {
    // Clean up on various exit scenarios
    process.once("exit", () => this.cleanup());
    process.once("SIGINT", () => this.cleanup());
    process.once("SIGTERM", () => this.cleanup());
  }

  addResource(resource) {
    this.resources.add(resource);
  }

  cleanup() {
    this.resources.forEach((resource) => {
      try {
        if (resource.close) resource.close();
        if (resource.destroy) resource.destroy();
      } catch (err) {
        console.warn("Cleanup error:", err);
      }
    });
    this.resources.clear();
  }

  _destroy(err, callback) {
    this.cleanup();
    callback(err);
  }
}
```

### 3. Performance Optimization

```javascript
const { Transform } = require("stream");

class OptimizedTransform extends Transform {
  constructor(options = {}) {
    super({
      // Optimize buffer sizes
      highWaterMark: options.highWaterMark || 64 * 1024, // 64KB
      ...options,
    });

    this.batchSize = options.batchSize || 100;
    this.batch = [];
    this.processedCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.batch.push(chunk);

    if (this.batch.length >= this.batchSize) {
      this.processBatch();
    }

    callback();
  }

  _flush(callback) {
    if (this.batch.length > 0) {
      this.processBatch();
    }
    callback();
  }

  processBatch() {
    // Process items in batches for better performance
    const processedBatch = this.batch.map((chunk) => {
      this.processedCount++;
      return this.transformChunk(chunk);
    });

    processedBatch.forEach((item) => this.push(item));
    this.batch = [];

    console.log(`Processed ${this.processedCount} items`);
  }

  transformChunk(chunk) {
    return chunk.toString().toUpperCase();
  }
}
```

## When to Use Each Type

### Use Duplex Streams When:

- **Network connections**: TCP sockets, WebSockets
- **Bidirectional communication**: Client-server protocols
- **Independent read/write operations**: File handles, device interfaces
- **Real-time systems**: Chat applications, gaming protocols
- **Proxy/gateway scenarios**: Data forwarding between systems

### Use Transform Streams When:

- **Data processing**: Parsing, validation, filtering
- **Format conversion**: CSV to JSON, XML to JSON
- **Compression/decompression**: gzip, deflate
- **Encryption/decryption**: AES, RSA
- **Text processing**: Case conversion, search/replace
- **Data enrichment**: Adding metadata, timestamps
- **Protocol translation**: Converting between formats

## Summary

### Key Differences:

| Feature          | Duplex                 | Transform                   |
| ---------------- | ---------------------- | --------------------------- |
| **Purpose**      | Independent read/write | Data transformation         |
| **Data Flow**    | Separate input/output  | Input → Process → Output    |
| **Methods**      | `_read()` + `_write()` | `_transform()` + `_flush()` |
| **Relationship** | Read ≠ Write           | Output = f(Input)           |
| **Use Cases**    | Sockets, connections   | Processing, conversion      |

### Best Practices:

- Handle errors gracefully
- Manage resources properly
- Optimize buffer sizes for performance
- Use object mode when appropriate
- Implement proper cleanup in `_destroy()`
- Monitor memory usage for large data processing
- Use built-in transforms when available (zlib, crypto)

Both duplex and transform streams are powerful abstractions that enable building sophisticated data processing pipelines and bidirectional communication systems in Node.js applications.
