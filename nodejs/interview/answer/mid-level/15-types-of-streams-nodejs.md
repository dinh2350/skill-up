# What are the different types of streams in Node.js?

Streams in Node.js are objects that allow you to read data from a source or write data to a destination in a continuous fashion. Node.js provides four fundamental types of streams, each serving different purposes in handling data flow.

## Overview of Streams

Streams are EventEmitter instances that handle data in chunks rather than loading everything into memory at once. This makes them perfect for handling large amounts of data efficiently.

## The Four Types of Streams

### 1. Readable Streams

Readable streams are an abstraction for a source from which data is read.

#### Characteristics:

- Data flows **from** the stream
- You can read data from them
- Examples: HTTP requests (on server), file read streams, `process.stdin`

#### Basic Usage:

```javascript
const fs = require("fs");
const { Readable } = require("stream");

// Using fs.createReadStream
const readableStream = fs.createReadStream("large-file.txt");

readableStream.on("data", (chunk) => {
  console.log(`Received ${chunk.length} bytes of data`);
  console.log(chunk.toString());
});

readableStream.on("end", () => {
  console.log("No more data to read");
});

readableStream.on("error", (err) => {
  console.error("Error reading stream:", err);
});
```

#### Reading Modes:

**1. Flowing Mode:**

```javascript
const readableStream = fs.createReadStream("file.txt");

// Flowing mode - data flows automatically
readableStream.on("data", (chunk) => {
  console.log("Data chunk:", chunk);
});

readableStream.on("end", () => {
  console.log("Stream ended");
});
```

**2. Paused Mode:**

```javascript
const readableStream = fs.createReadStream("file.txt");

// Paused mode - manually read data
readableStream.on("readable", () => {
  let chunk;
  while (null !== (chunk = readableStream.read())) {
    console.log("Read chunk:", chunk);
  }
});
```

#### Custom Readable Stream:

```javascript
const { Readable } = require("stream");

class MyReadableStream extends Readable {
  constructor(options) {
    super(options);
    this.index = 0;
  }

  _read() {
    if (this.index < 5) {
      this.push(`Data chunk ${this.index++}\n`);
    } else {
      this.push(null); // End the stream
    }
  }
}

const myStream = new MyReadableStream();
myStream.on("data", (chunk) => {
  console.log("Received:", chunk.toString());
});
```

### 2. Writable Streams

Writable streams are an abstraction for a destination to which data is written.

#### Characteristics:

- Data flows **to** the stream
- You can write data to them
- Examples: HTTP responses (on server), file write streams, `process.stdout`

#### Basic Usage:

```javascript
const fs = require("fs");
const { Writable } = require("stream");

// Using fs.createWriteStream
const writableStream = fs.createWriteStream("output.txt");

writableStream.write("First chunk of data\n");
writableStream.write("Second chunk of data\n");

writableStream.end("Final chunk and end\n");

writableStream.on("finish", () => {
  console.log("All data has been written");
});

writableStream.on("error", (err) => {
  console.error("Error writing to stream:", err);
});
```

#### Custom Writable Stream:

```javascript
const { Writable } = require("stream");

class MyWritableStream extends Writable {
  constructor(options) {
    super(options);
    this.data = [];
  }

  _write(chunk, encoding, callback) {
    // Process the chunk
    this.data.push(chunk.toString().toUpperCase());
    console.log(`Written: ${chunk.toString().trim()}`);
    callback(); // Signal that write is complete
  }

  _final(callback) {
    console.log("Final data:", this.data);
    callback();
  }
}

const myWritable = new MyWritableStream();
myWritable.write("hello world\n");
myWritable.write("node.js streams\n");
myWritable.end();
```

### 3. Duplex Streams

Duplex streams implement both Readable and Writable interfaces.

#### Characteristics:

- Can both read from and write to
- Independent read and write operations
- Examples: TCP sockets, WebSocket connections

#### Basic Usage:

```javascript
const { Duplex } = require("stream");
const net = require("net");

// TCP socket is a duplex stream
const server = net.createServer((socket) => {
  console.log("Client connected");

  // Reading from the socket
  socket.on("data", (data) => {
    console.log("Received:", data.toString());

    // Writing to the socket
    socket.write(`Echo: ${data}`);
  });

  socket.on("end", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

#### Custom Duplex Stream:

```javascript
const { Duplex } = require("stream");

class MyDuplexStream extends Duplex {
  constructor(options) {
    super(options);
    this.data = [];
    this.index = 0;
  }

  // Implement _read for readable side
  _read() {
    if (this.index < this.data.length) {
      this.push(`Processed: ${this.data[this.index++]}\n`);
    } else {
      this.push(null);
    }
  }

  // Implement _write for writable side
  _write(chunk, encoding, callback) {
    this.data.push(chunk.toString().trim());
    console.log(`Stored: ${chunk.toString().trim()}`);
    callback();
  }
}

const myDuplex = new MyDuplexStream();

// Write some data
myDuplex.write("Hello\n");
myDuplex.write("World\n");
myDuplex.end();

// Read the processed data
myDuplex.on("data", (chunk) => {
  console.log("Read:", chunk.toString());
});
```

### 4. Transform Streams

Transform streams are Duplex streams where the output is computed based on the input.

#### Characteristics:

- Duplex streams with transformation logic
- Input is transformed and passed as output
- Examples: zlib streams, crypto streams

#### Basic Usage:

```javascript
const fs = require("fs");
const zlib = require("zlib");

// Using built-in transform stream (gzip)
const readStream = fs.createReadStream("input.txt");
const writeStream = fs.createWriteStream("output.txt.gz");
const gzipStream = zlib.createGzip();

readStream
  .pipe(gzipStream)
  .pipe(writeStream)
  .on("finish", () => {
    console.log("File compressed successfully");
  });
```

#### Custom Transform Stream:

```javascript
const { Transform } = require("stream");

class UppercaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Transform the chunk to uppercase
    const upperChunk = chunk.toString().toUpperCase();
    this.push(upperChunk);
    callback();
  }
}

// Usage
const fs = require("fs");
const upperTransform = new UppercaseTransform();

fs.createReadStream("input.txt")
  .pipe(upperTransform)
  .pipe(fs.createWriteStream("uppercase-output.txt"))
  .on("finish", () => {
    console.log("Transformation complete");
  });
```

#### More Complex Transform Example:

```javascript
const { Transform } = require("stream");

class JSONParseTransform extends Transform {
  constructor(options) {
    super(options);
    this.buffer = "";
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();

    // Split by newlines to handle multiple JSON objects
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          this.push(JSON.stringify(parsed, null, 2) + "\n");
        } catch (err) {
          this.emit("error", new Error(`Invalid JSON: ${line}`));
          return;
        }
      }
    }

    callback();
  }

  _flush(callback) {
    // Handle any remaining data in buffer
    if (this.buffer.trim()) {
      try {
        const parsed = JSON.parse(this.buffer);
        this.push(JSON.stringify(parsed, null, 2) + "\n");
      } catch (err) {
        this.emit("error", new Error(`Invalid JSON: ${this.buffer}`));
        return;
      }
    }
    callback();
  }
}
```

## Stream Modes

### Object Mode

By default, streams operate on strings and Buffers. Object mode allows streams to work with JavaScript objects:

```javascript
const { Transform } = require("stream");

class ObjectTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(obj, encoding, callback) {
    // Transform the object
    const transformed = {
      ...obj,
      timestamp: new Date().toISOString(),
      processed: true,
    };

    this.push(transformed);
    callback();
  }
}

const objectTransform = new ObjectTransform();

objectTransform.on("data", (obj) => {
  console.log("Transformed object:", obj);
});

objectTransform.write({ id: 1, name: "John" });
objectTransform.write({ id: 2, name: "Jane" });
objectTransform.end();
```

## Stream Events

All streams inherit from EventEmitter and emit various events:

### Common Events:

```javascript
const fs = require("fs");

const stream = fs.createReadStream("file.txt");

// Data event (Readable streams)
stream.on("data", (chunk) => {
  console.log("Data received:", chunk);
});

// End event (Readable streams)
stream.on("end", () => {
  console.log("No more data");
});

// Error event (All streams)
stream.on("error", (err) => {
  console.error("Stream error:", err);
});

// Close event (All streams)
stream.on("close", () => {
  console.log("Stream closed");
});

// Finish event (Writable streams)
// stream.on('finish', () => {
//   console.log('All data written');
// });

// Drain event (Writable streams)
// stream.on('drain', () => {
//   console.log('Buffer drained, safe to write more');
// });
```

## Practical Examples

### 1. File Processing Pipeline

```javascript
const fs = require("fs");
const { Transform } = require("stream");
const readline = require("readline");

// Transform to process CSV data
class CSVProcessor extends Transform {
  constructor() {
    super({ objectMode: true });
    this.isFirstLine = true;
    this.headers = [];
  }

  _transform(line, encoding, callback) {
    if (this.isFirstLine) {
      this.headers = line.split(",");
      this.isFirstLine = false;
    } else {
      const values = line.split(",");
      const obj = {};
      this.headers.forEach((header, index) => {
        obj[header.trim()] = values[index] ? values[index].trim() : "";
      });
      this.push(obj);
    }
    callback();
  }
}

// Create processing pipeline
const fileStream = fs.createReadStream("data.csv");
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

const csvProcessor = new CSVProcessor();

rl.on("line", (line) => {
  csvProcessor.write(line);
});

rl.on("close", () => {
  csvProcessor.end();
});

csvProcessor.on("data", (obj) => {
  console.log("Processed record:", obj);
});
```

### 2. HTTP Request/Response Streams

```javascript
const http = require("http");
const fs = require("fs");
const { Transform } = require("stream");

// Create a transform stream that adds metadata
class RequestLogger extends Transform {
  _transform(chunk, encoding, callback) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      data: chunk.toString(),
      size: chunk.length,
    };

    console.log("Request data:", logEntry);
    this.push(chunk); // Pass through unchanged
    callback();
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST") {
    const logger = new RequestLogger();

    req
      .pipe(logger)
      .pipe(fs.createWriteStream("uploaded-file.txt"))
      .on("finish", () => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("File uploaded successfully");
      })
      .on("error", (err) => {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Upload failed");
      });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### 3. Stream Utilities

```javascript
const { pipeline, finished } = require("stream");
const { promisify } = require("util");

// Promisified pipeline
const pipelineAsync = promisify(pipeline);

async function processFile() {
  try {
    await pipelineAsync(
      fs.createReadStream("input.txt"),
      new UppercaseTransform(),
      fs.createWriteStream("output.txt")
    );
    console.log("Pipeline finished successfully");
  } catch (error) {
    console.error("Pipeline failed:", error);
  }
}

// Using finished to detect when a stream is done
const finishedAsync = promisify(finished);

async function waitForStream(stream) {
  try {
    await finishedAsync(stream);
    console.log("Stream finished");
  } catch (error) {
    console.error("Stream failed:", error);
  }
}
```

## Performance Considerations

### 1. Buffer Size

```javascript
// Customize buffer size for better performance
const options = {
  highWaterMark: 64 * 1024, // 64KB buffer
  encoding: "utf8",
};

const readStream = fs.createReadStream("large-file.txt", options);
const writeStream = fs.createWriteStream("output.txt", options);
```

### 2. Backpressure Handling

```javascript
const fs = require("fs");

function copyFile(src, dest) {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dest);

  readStream.on("data", (chunk) => {
    const canWriteMore = writeStream.write(chunk);

    if (!canWriteMore) {
      // Pause reading until drain
      readStream.pause();

      writeStream.once("drain", () => {
        readStream.resume();
      });
    }
  });

  readStream.on("end", () => {
    writeStream.end();
  });
}
```

## Summary

Node.js provides four fundamental stream types:

1. **Readable Streams**: Read data from a source

   - Examples: File reads, HTTP requests, stdin
   - Modes: Flowing and Paused

2. **Writable Streams**: Write data to a destination

   - Examples: File writes, HTTP responses, stdout
   - Handle backpressure and buffering

3. **Duplex Streams**: Both readable and writable

   - Examples: TCP sockets, WebSocket connections
   - Independent read/write operations

4. **Transform Streams**: Duplex streams with data transformation
   - Examples: gzip, encryption, data parsing
   - Input is processed and output as transformed data

### Key Benefits:

- **Memory Efficiency**: Process large data without loading everything into memory
- **Time Efficiency**: Start processing data as soon as it arrives
- **Composability**: Chain streams together using pipes
- **Event-driven**: Built on EventEmitter for reactive programming

Streams are essential for building scalable Node.js applications that handle large amounts of data efficiently.
