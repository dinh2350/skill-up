# What is the difference between readable and writable streams?

Readable and writable streams are two fundamental types of streams in Node.js that serve opposite purposes in data flow management. Understanding their differences is crucial for effective stream programming.

## Overview

| Aspect             | Readable Stream                   | Writable Stream                        |
| ------------------ | --------------------------------- | -------------------------------------- |
| **Purpose**        | Source of data - you read FROM it | Destination for data - you write TO it |
| **Data Flow**      | Produces/emits data               | Consumes/receives data                 |
| **Primary Method** | `read()` to get data              | `write()` to send data                 |
| **Key Event**      | `'data'` event for incoming data  | `'finish'` event when done writing     |
| **Implementation** | Must implement `_read()`          | Must implement `_write()`              |

## Readable Streams

Readable streams are abstractions for sources from which data is consumed.

### Characteristics

- **Data Source**: Acts as a producer of data
- **Pull-based**: You request data from the stream
- **Events**: Emits `'data'`, `'end'`, `'readable'` events
- **Methods**: `read()`, `pause()`, `resume()`, `pipe()`

### Basic Example

```javascript
const fs = require("fs");

// Create a readable stream
const readableStream = fs.createReadStream("input.txt");

// Read data from the stream
readableStream.on("data", (chunk) => {
  console.log(`Received ${chunk.length} bytes`);
  console.log("Content:", chunk.toString());
});

readableStream.on("end", () => {
  console.log("No more data to read");
});

readableStream.on("error", (err) => {
  console.error("Read error:", err);
});
```

### Reading Modes

#### 1. Flowing Mode

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("file.txt");

// Flowing mode - data flows automatically
readStream.on("data", (chunk) => {
  console.log("Auto-flowing data:", chunk.toString());
});

readStream.on("end", () => {
  console.log("Stream ended");
});
```

#### 2. Paused Mode

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("file.txt");

// Paused mode - manually read data
readStream.on("readable", () => {
  let chunk;
  while (null !== (chunk = readStream.read())) {
    console.log("Manually read chunk:", chunk.toString());
  }
});

readStream.on("end", () => {
  console.log("Stream ended");
});
```

### Common Readable Stream Examples

```javascript
// File reading
const fs = require("fs");
const fileStream = fs.createReadStream("data.txt");

// HTTP request (on server side)
const http = require("http");
const server = http.createServer((req, res) => {
  // req is a readable stream
  req.on("data", (chunk) => {
    console.log("Request data:", chunk.toString());
  });
});

// Process stdin
process.stdin.on("data", (data) => {
  console.log("User input:", data.toString());
});

// Crypto streams
const crypto = require("crypto");
const hash = crypto.createHash("sha256");
hash.update("data to hash");
console.log("Hash:", hash.digest("hex"));
```

## Writable Streams

Writable streams are abstractions for destinations to which data is written.

### Characteristics

- **Data Destination**: Acts as a consumer of data
- **Push-based**: You send data to the stream
- **Events**: Emits `'finish'`, `'drain'`, `'error'` events
- **Methods**: `write()`, `end()`, `cork()`, `uncork()`

### Basic Example

```javascript
const fs = require("fs");

// Create a writable stream
const writableStream = fs.createWriteStream("output.txt");

// Write data to the stream
writableStream.write("Hello, ");
writableStream.write("World!\n");
writableStream.write("This is a writable stream example.\n");

// End the stream
writableStream.end("Final data.\n");

// Handle events
writableStream.on("finish", () => {
  console.log("All data has been written");
});

writableStream.on("error", (err) => {
  console.error("Write error:", err);
});
```

### Backpressure Handling

```javascript
const fs = require("fs");

const writableStream = fs.createWriteStream("output.txt");

function writeData(data) {
  const canWriteMore = writableStream.write(data);

  if (!canWriteMore) {
    console.log("Buffer full - waiting for drain");
    writableStream.once("drain", () => {
      console.log("Buffer drained - can write more");
    });
  }

  return canWriteMore;
}

// Write some data
writeData("Hello ");
writeData("World ");
writeData("from ");
writeData("writable ");
writeData("stream!\n");

writableStream.end();
```

### Common Writable Stream Examples

```javascript
// File writing
const fs = require("fs");
const fileStream = fs.createWriteStream("output.txt");
fileStream.write("Data to file\n");

// HTTP response (on server side)
const http = require("http");
const server = http.createServer((req, res) => {
  // res is a writable stream
  res.write("Hello ");
  res.write("World!");
  res.end();
});

// Process stdout
process.stdout.write("This goes to console\n");

// Crypto streams
const crypto = require("crypto");
const cipher = crypto.createCipher("aes192", "secret");
cipher.write("data to encrypt");
cipher.end();
```

## Detailed Comparison

### 1. Data Flow Direction

```javascript
// Readable Stream - Data flows OUT
const { Readable } = require("stream");

class DataProducer extends Readable {
  constructor() {
    super();
    this.count = 0;
  }

  _read() {
    if (this.count < 5) {
      this.push(`Data item ${this.count++}\n`);
    } else {
      this.push(null); // End stream
    }
  }
}

// Writable Stream - Data flows IN
const { Writable } = require("stream");

class DataConsumer extends Writable {
  constructor() {
    super();
    this.receivedData = [];
  }

  _write(chunk, encoding, callback) {
    this.receivedData.push(chunk.toString());
    console.log("Consumed:", chunk.toString().trim());
    callback();
  }
}

// Usage
const producer = new DataProducer();
const consumer = new DataConsumer();

producer.pipe(consumer);
```

### 2. Event Patterns

```javascript
// Readable Stream Events
const readableStream = fs.createReadStream("input.txt");

readableStream.on("readable", () => {
  // Data is available to read
  console.log("Data available for reading");
});

readableStream.on("data", (chunk) => {
  // Data chunk received
  console.log("Data chunk received");
});

readableStream.on("end", () => {
  // No more data will be provided
  console.log("End of readable stream");
});

// Writable Stream Events
const writableStream = fs.createWriteStream("output.txt");

writableStream.on("drain", () => {
  // Buffer has been emptied, safe to write more
  console.log("Writable buffer drained");
});

writableStream.on("finish", () => {
  // All data has been flushed
  console.log("Writable stream finished");
});

writableStream.on("close", () => {
  // Stream has been closed
  console.log("Writable stream closed");
});
```

### 3. Method Differences

```javascript
// Readable Stream Methods
const readableStream = fs.createReadStream("input.txt");

// Reading methods
readableStream.read(1024); // Read specific amount
readableStream.pause(); // Pause data flow
readableStream.resume(); // Resume data flow
readableStream.pipe(destination); // Pipe to writable stream

// Writable Stream Methods
const writableStream = fs.createWriteStream("output.txt");

// Writing methods
writableStream.write("data"); // Write data
writableStream.end(); // End and close stream
writableStream.cork(); // Buffer writes
writableStream.uncork(); // Flush buffered writes
```

### 4. Implementation Requirements

```javascript
// Custom Readable Stream
const { Readable } = require("stream");

class MyReadable extends Readable {
  _read(size) {
    // Must implement: Generate or fetch data
    this.push("some data");
    // or this.push(null) to end
  }
}

// Custom Writable Stream
const { Writable } = require("stream");

class MyWritable extends Writable {
  _write(chunk, encoding, callback) {
    // Must implement: Process the chunk
    console.log("Processing:", chunk.toString());
    callback(); // Signal completion
  }
}
```

## Practical Examples

### 1. File Processing

```javascript
const fs = require("fs");

// Reading a file (Readable)
function readFile(filename) {
  const readStream = fs.createReadStream(filename);

  readStream.on("data", (chunk) => {
    console.log(`Read ${chunk.length} bytes from ${filename}`);
  });

  readStream.on("end", () => {
    console.log(`Finished reading ${filename}`);
  });

  return readStream;
}

// Writing a file (Writable)
function writeFile(filename, data) {
  const writeStream = fs.createWriteStream(filename);

  data.forEach((item, index) => {
    const success = writeStream.write(`${item}\n`);
    if (!success) {
      writeStream.once("drain", () => {
        console.log("Buffer drained, continuing...");
      });
    }
  });

  writeStream.end();

  writeStream.on("finish", () => {
    console.log(`Finished writing ${filename}`);
  });

  return writeStream;
}

// Usage
const data = ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"];
writeFile("output.txt", data);
```

### 2. HTTP Streaming

```javascript
const http = require("http");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/download") {
    // Readable stream (file) to writable stream (response)
    const fileStream = fs.createReadStream("large-file.pdf");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="file.pdf"');

    fileStream.pipe(res); // Pipe readable to writable

    fileStream.on("error", (err) => {
      res.statusCode = 500;
      res.end("Error reading file");
    });
  } else if (req.method === "POST" && req.url === "/upload") {
    // Readable stream (request) to writable stream (file)
    const fileStream = fs.createWriteStream("uploaded-file.bin");

    req.pipe(fileStream); // Pipe readable to writable

    fileStream.on("finish", () => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Upload complete");
    });

    fileStream.on("error", (err) => {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Upload failed");
    });
  }
});

server.listen(3000);
```

### 3. Data Processing Pipeline

```javascript
const fs = require("fs");
const { Transform } = require("stream");

// Create a transform stream for processing
class DataProcessor extends Transform {
  _transform(chunk, encoding, callback) {
    // Transform data from readable to writable
    const processed = chunk
      .toString()
      .toUpperCase()
      .replace(/\n/g, " [PROCESSED]\n");

    this.push(processed);
    callback();
  }
}

// Pipeline: Readable → Transform → Writable
const readStream = fs.createReadStream("input.txt");
const processor = new DataProcessor();
const writeStream = fs.createWriteStream("processed-output.txt");

readStream
  .pipe(processor) // Readable to Transform
  .pipe(writeStream) // Transform to Writable
  .on("finish", () => {
    console.log("Processing pipeline complete");
  });
```

## Advanced Differences

### 1. Buffer Management

```javascript
// Readable Stream Buffer
const readableStream = fs.createReadStream("file.txt", {
  highWaterMark: 1024, // 1KB read buffer
});

console.log("Readable buffer size:", readableStream.readableHighWaterMark);
console.log("Readable buffer length:", readableStream.readableLength);

// Writable Stream Buffer
const writableStream = fs.createWriteStream("output.txt", {
  highWaterMark: 512, // 512 byte write buffer
});

console.log("Writable buffer size:", writableStream.writableHighWaterMark);
console.log("Writable buffer length:", writableStream.writableLength);
```

### 2. State Management

```javascript
// Readable Stream States
const readableStream = fs.createReadStream("input.txt");

console.log("Readable state:");
console.log("- Destroyed:", readableStream.destroyed);
console.log("- Readable:", readableStream.readable);
console.log("- Reading:", readableStream.readableFlowing);

// Writable Stream States
const writableStream = fs.createWriteStream("output.txt");

console.log("Writable state:");
console.log("- Destroyed:", writableStream.destroyed);
console.log("- Writable:", writableStream.writable);
console.log("- Ended:", writableStream.writableEnded);
console.log("- Finished:", writableStream.writableFinished);
```

### 3. Error Handling Patterns

```javascript
// Readable Stream Error Handling
function handleReadableErrors(readStream) {
  readStream.on("error", (err) => {
    console.error("Readable error:", err);
    readStream.destroy(); // Clean up resources
  });

  readStream.on("close", () => {
    console.log("Readable stream closed");
  });
}

// Writable Stream Error Handling
function handleWritableErrors(writeStream) {
  writeStream.on("error", (err) => {
    console.error("Writable error:", err);
    writeStream.destroy(); // Clean up resources
  });

  writeStream.on("close", () => {
    console.log("Writable stream closed");
  });
}
```

## When to Use Each Type

### Use Readable Streams When:

- Reading files from disk
- Receiving HTTP requests
- Processing database query results
- Reading from external APIs
- Generating data programmatically
- Parsing log files
- Streaming media content

### Use Writable Streams When:

- Writing files to disk
- Sending HTTP responses
- Inserting data into databases
- Sending data to external APIs
- Logging application data
- Compressing or encrypting data
- Buffering data for batch processing

## Best Practices

### For Readable Streams:

```javascript
// ✅ Good - Handle all events
const readStream = fs.createReadStream("file.txt");

readStream.on("data", (chunk) => {
  // Process chunk
});

readStream.on("end", () => {
  // Handle completion
});

readStream.on("error", (err) => {
  // Handle errors
});

// ✅ Good - Use pipe for simple cases
readStream.pipe(writeStream);
```

### For Writable Streams:

```javascript
// ✅ Good - Check return value for backpressure
function writeWithBackpressure(stream, data) {
  const canContinue = stream.write(data);

  if (!canContinue) {
    stream.once("drain", () => {
      console.log("Can continue writing");
    });
  }
}

// ✅ Good - Always end writable streams
writeStream.write("data");
writeStream.end(); // Don't forget this!

// ✅ Good - Handle finish event
writeStream.on("finish", () => {
  console.log("Write complete");
});
```

## Summary

### Key Differences:

| Feature            | Readable Stream              | Writable Stream               |
| ------------------ | ---------------------------- | ----------------------------- |
| **Purpose**        | Data source (producer)       | Data destination (consumer)   |
| **Direction**      | Data flows OUT               | Data flows IN                 |
| **Main Method**    | `read()`                     | `write()`                     |
| **Key Events**     | `data`, `end`, `readable`    | `finish`, `drain`             |
| **Implementation** | `_read()`                    | `_write()`                    |
| **Usage**          | Reading files, HTTP requests | Writing files, HTTP responses |
| **Flow Control**   | Pause/Resume                 | Backpressure (drain)          |

### Common Use Cases:

- **Readable**: File reading, API responses, database queries, user input
- **Writable**: File writing, API requests, database inserts, logging

### Integration:

- Often used together via `pipe()`: `readable.pipe(writable)`
- Transform streams bridge readable and writable
- Both are essential for building efficient data processing pipelines

Understanding these differences is crucial for building efficient, memory-conscious Node.js applications that handle data streams effectively.
