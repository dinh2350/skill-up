# What are streams in Node.js?

## Short Answer

**Streams** are objects in Node.js that allow you to read or write data **piece by piece** (in chunks) rather than loading everything into memory at once. They are used for handling large amounts of data efficiently.

```javascript
const fs = require("fs");

// ❌ Without streams - Loads entire file into memory
const data = fs.readFileSync("large-file.txt");
console.log(data); // 1GB in memory!

// ✅ With streams - Reads file chunk by chunk
const readStream = fs.createReadStream("large-file.txt");
readStream.on("data", (chunk) => {
  console.log("Received chunk:", chunk.length, "bytes");
});
```

**4 Types of Streams:**

1. **Readable** - Read data (e.g., `fs.createReadStream()`)
2. **Writable** - Write data (e.g., `fs.createWriteStream()`)
3. **Duplex** - Both read and write (e.g., TCP sockets)
4. **Transform** - Modify data while reading/writing (e.g., compression)

**Benefits:** Memory efficient, time efficient, composable with pipes

## Detailed Answer

### What Are Streams?

Streams are **EventEmitter** objects that handle data flow in chunks rather than all at once. They enable processing large files or data without loading everything into memory.

#### Key Concepts

```javascript
// Traditional approach - entire file in memory
const data = fs.readFileSync("video.mp4"); // 2GB loaded!
processData(data);

// Stream approach - chunks processed one at a time
const stream = fs.createReadStream("video.mp4");
stream.on("data", (chunk) => {
  processChunk(chunk); // Process 64KB at a time
});
```

#### Why Use Streams?

1. **Memory Efficiency** - Don't load entire file into memory
2. **Time Efficiency** - Start processing before all data arrives
3. **Composability** - Chain operations with pipes
4. **Scalability** - Handle large files without memory issues

### Types of Streams

#### 1. Readable Streams

Readable streams allow you to read data from a source.

```javascript
const fs = require("fs");

// Create readable stream
const readStream = fs.createReadStream("input.txt", {
  encoding: "utf8",
  highWaterMark: 64 * 1024, // 64KB chunks (default: 16KB)
});

// Listen to events
readStream.on("data", (chunk) => {
  console.log("Received chunk:", chunk.length, "bytes");
});

readStream.on("end", () => {
  console.log("Finished reading file");
});

readStream.on("error", (err) => {
  console.error("Error:", err);
});
```

#### Readable Stream Events

```javascript
const readStream = fs.createReadStream("file.txt");

// 'data' - Chunk of data is available
readStream.on("data", (chunk) => {
  console.log("Data:", chunk);
});

// 'end' - No more data to read
readStream.on("end", () => {
  console.log("Stream ended");
});

// 'error' - Error occurred
readStream.on("error", (err) => {
  console.error("Error:", err);
});

// 'close' - Stream closed
readStream.on("close", () => {
  console.log("Stream closed");
});

// 'readable' - Data available to read
readStream.on("readable", () => {
  let chunk;
  while ((chunk = readStream.read()) !== null) {
    console.log("Read:", chunk.length, "bytes");
  }
});
```

#### Readable Stream Methods

```javascript
// Pause stream
readStream.pause();

// Resume stream
readStream.resume();

// Read specific amount
const chunk = readStream.read(100); // Read 100 bytes

// Pipe to writable stream
readStream.pipe(writeStream);

// Unpipe
readStream.unpipe(writeStream);

// Destroy stream
readStream.destroy();
```

#### 2. Writable Streams

Writable streams allow you to write data to a destination.

```javascript
const fs = require("fs");

// Create writable stream
const writeStream = fs.createWriteStream("output.txt", {
  encoding: "utf8",
});

// Write data
writeStream.write("Hello ");
writeStream.write("World\n");

// End stream (optional final chunk)
writeStream.end("Goodbye!");

// Listen to events
writeStream.on("finish", () => {
  console.log("All data written");
});

writeStream.on("error", (err) => {
  console.error("Error:", err);
});
```

#### Writable Stream Events

```javascript
const writeStream = fs.createWriteStream("output.txt");

// 'drain' - OK to write more data
writeStream.on("drain", () => {
  console.log("Drained - can write more");
});

// 'finish' - All data flushed
writeStream.on("finish", () => {
  console.log("Finished writing");
});

// 'error' - Error occurred
writeStream.on("error", (err) => {
  console.error("Error:", err);
});

// 'close' - Stream closed
writeStream.on("close", () => {
  console.log("Stream closed");
});

// 'pipe' - Readable stream piped to this
writeStream.on("pipe", (src) => {
  console.log("Piped from:", src);
});

// 'unpipe' - Readable stream unpiped
writeStream.on("unpipe", (src) => {
  console.log("Unpiped from:", src);
});
```

#### Writable Stream Methods

```javascript
// Write data (returns false if buffer full)
const canWriteMore = writeStream.write("data");

if (!canWriteMore) {
  // Wait for 'drain' event
  writeStream.once("drain", () => {
    // Continue writing
  });
}

// End stream
writeStream.end(); // No more data
writeStream.end("final chunk"); // Write and close

// Destroy stream
writeStream.destroy();

// Cork (buffer writes)
writeStream.cork();
writeStream.write("buffered");
writeStream.write("data");
writeStream.uncork(); // Flush buffer
```

#### 3. Duplex Streams

Duplex streams can both read and write data (e.g., TCP sockets).

```javascript
const { Duplex } = require("stream");
const net = require("net");

// TCP socket is a duplex stream
const socket = net.connect(8080, "localhost");

// Can read from socket
socket.on("data", (data) => {
  console.log("Received:", data.toString());
});

// Can write to socket
socket.write("Hello Server");

// Custom duplex stream
class MyDuplex extends Duplex {
  _read(size) {
    // Push data to be read
    this.push("data chunk");
    this.push(null); // End of data
  }

  _write(chunk, encoding, callback) {
    // Write data somewhere
    console.log("Writing:", chunk.toString());
    callback();
  }
}

const duplex = new MyDuplex();
```

#### 4. Transform Streams

Transform streams modify or transform data as it passes through.

```javascript
const { Transform } = require("stream");

// Custom transform stream - uppercase text
class UpperCase extends Transform {
  _transform(chunk, encoding, callback) {
    const upperChunk = chunk.toString().toUpperCase();
    this.push(upperChunk);
    callback();
  }
}

const upperCase = new UpperCase();

// Use with pipe
fs.createReadStream("input.txt")
  .pipe(upperCase)
  .pipe(fs.createWriteStream("output.txt"));
```

### Piping Streams

Piping connects readable streams to writable streams automatically.

```javascript
const fs = require("fs");

// Basic pipe
const readStream = fs.createReadStream("input.txt");
const writeStream = fs.createWriteStream("output.txt");

readStream.pipe(writeStream);

// Chain multiple pipes
fs.createReadStream("input.txt")
  .pipe(transform1)
  .pipe(transform2)
  .pipe(fs.createWriteStream("output.txt"));

// Handle errors in pipe chain
const pipeline = require("stream").pipeline;

pipeline(
  fs.createReadStream("input.txt"),
  transform1,
  transform2,
  fs.createWriteStream("output.txt"),
  (err) => {
    if (err) {
      console.error("Pipeline error:", err);
    } else {
      console.log("Pipeline succeeded");
    }
  }
);
```

### Real-World Examples

#### Example 1: Copy Large File

```javascript
const fs = require("fs");

// ❌ BAD - Loads entire file into memory
function copyFileBad(src, dest) {
  const data = fs.readFileSync(src);
  fs.writeFileSync(dest, data);
}

// ✅ GOOD - Uses streams (memory efficient)
function copyFileGood(src, dest) {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dest);

  readStream.pipe(writeStream);

  writeStream.on("finish", () => {
    console.log("Copy complete");
  });

  writeStream.on("error", (err) => {
    console.error("Error:", err);
  });
}

copyFileGood("large-video.mp4", "copy.mp4");
```

#### Example 2: HTTP File Download

```javascript
const http = require("http");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.url === "/download") {
    // ❌ BAD - Loads entire file into memory
    // const file = fs.readFileSync('large-file.zip');
    // res.end(file);

    // ✅ GOOD - Stream file to response
    const fileStream = fs.createReadStream("large-file.zip");

    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="file.zip"',
    });

    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      res.statusCode = 500;
      res.end("Server error");
    });
  }
});

server.listen(3000);
```

#### Example 3: HTTP File Upload

```javascript
const http = require("http");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/upload") {
    const writeStream = fs.createWriteStream("uploaded-file.txt");

    // Pipe request body to file
    req.pipe(writeStream);

    writeStream.on("finish", () => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Upload complete");
    });

    writeStream.on("error", (err) => {
      console.error("Upload error:", err);
      res.writeHead(500);
      res.end("Upload failed");
    });
  }
});

server.listen(3000);
```

#### Example 4: Compression (gzip)

```javascript
const fs = require("fs");
const zlib = require("zlib");

// Compress file
fs.createReadStream("input.txt")
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream("input.txt.gz"))
  .on("finish", () => console.log("Compression complete"));

// Decompress file
fs.createReadStream("input.txt.gz")
  .pipe(zlib.createGunzip())
  .pipe(fs.createWriteStream("output.txt"))
  .on("finish", () => console.log("Decompression complete"));
```

#### Example 5: CSV Processing

```javascript
const fs = require("fs");
const { Transform } = require("stream");
const readline = require("readline");

// Transform stream to process CSV lines
class CSVParser extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(line, encoding, callback) {
    const [id, name, email] = line.toString().split(",");
    this.push({ id, name, email });
    callback();
  }
}

// Read and process large CSV file
const readStream = fs.createReadStream("large.csv");
const rl = readline.createInterface({
  input: readStream,
  crlfDelay: Infinity,
});

let count = 0;

rl.on("line", (line) => {
  const [id, name, email] = line.split(",");

  // Process each line
  if (email.includes("@example.com")) {
    count++;
  }
});

rl.on("close", () => {
  console.log(`Found ${count} example.com emails`);
});
```

#### Example 6: Video Streaming Server

```javascript
const http = require("http");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.url === "/video") {
    const videoPath = "video.mp4";
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Partial content (streaming)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      fileStream.pipe(res);
    } else {
      // Entire file
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });

      fs.createReadStream(videoPath).pipe(res);
    }
  }
});

server.listen(3000);
```

#### Example 7: Log File Processing

```javascript
const fs = require("fs");
const { Transform } = require("stream");

// Transform stream to filter log lines
class LogFilter extends Transform {
  constructor(level) {
    super();
    this.level = level;
  }

  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split("\n");
    const filtered = lines.filter((line) => line.includes(this.level));
    this.push(filtered.join("\n") + "\n");
    callback();
  }
}

// Extract only ERROR logs from large log file
fs.createReadStream("app.log")
  .pipe(new LogFilter("ERROR"))
  .pipe(fs.createWriteStream("errors.log"))
  .on("finish", () => console.log("Filtered errors"));
```

#### Example 8: Database Export

```javascript
const fs = require("fs");
const { Transform } = require("stream");

// Simulate database query stream
class DatabaseStream extends Transform {
  constructor() {
    super({ objectMode: true });
    this.count = 0;
  }

  _transform(query, encoding, callback) {
    // Simulate fetching records
    const records = fetchRecordsFromDB(query);

    records.forEach((record) => {
      this.push(JSON.stringify(record) + "\n");
      this.count++;
    });

    callback();
  }
}

// Export large dataset to JSON file
const dbStream = new DatabaseStream();
const writeStream = fs.createWriteStream("export.json");

dbStream.pipe(writeStream);

dbStream.write("SELECT * FROM users LIMIT 1000000");
dbStream.end();

writeStream.on("finish", () => {
  console.log("Export complete");
});
```

### Custom Stream Implementation

#### Creating Custom Readable Stream

```javascript
const { Readable } = require("stream");

class NumberStream extends Readable {
  constructor(max) {
    super();
    this.current = 0;
    this.max = max;
  }

  _read() {
    if (this.current <= this.max) {
      // Push data to stream
      this.push(`${this.current}\n`);
      this.current++;
    } else {
      // End stream
      this.push(null);
    }
  }
}

// Usage
const numberStream = new NumberStream(10);
numberStream.pipe(process.stdout);

// Output: 0, 1, 2, ..., 10
```

#### Creating Custom Writable Stream

```javascript
const { Writable } = require("stream");

class LogStream extends Writable {
  _write(chunk, encoding, callback) {
    const message = chunk.toString();
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
    callback();
  }
}

// Usage
const logger = new LogStream();
logger.write("Application started");
logger.write("User logged in");
logger.end("Application shutdown");
```

#### Creating Custom Transform Stream

```javascript
const { Transform } = require("stream");

// Uppercase transform
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

// CSV to JSON transform
class CSVToJSON extends Transform {
  constructor() {
    super({ objectMode: true });
    this.headers = null;
  }

  _transform(line, encoding, callback) {
    const values = line.toString().split(",");

    if (!this.headers) {
      this.headers = values;
    } else {
      const obj = {};
      this.headers.forEach((header, i) => {
        obj[header] = values[i];
      });
      this.push(JSON.stringify(obj) + "\n");
    }

    callback();
  }
}

// Usage
fs.createReadStream("data.csv")
  .pipe(new CSVToJSON())
  .pipe(fs.createWriteStream("data.json"));
```

### Stream Modes

#### Flowing Mode

Data is automatically read and provided via 'data' events.

```javascript
const readStream = fs.createReadStream("file.txt");

// Enters flowing mode
readStream.on("data", (chunk) => {
  console.log("Chunk:", chunk);
});

// Or
readStream.pipe(writeStream);

// Or
readStream.resume();
```

#### Paused Mode

Data must be explicitly read using `read()`.

```javascript
const readStream = fs.createReadStream("file.txt");

// Paused mode (default)
readStream.on("readable", () => {
  let chunk;
  while ((chunk = readStream.read()) !== null) {
    console.log("Read:", chunk);
  }
});

// Manually pause
readStream.pause();
```

### Backpressure Handling

Backpressure occurs when data is written faster than it can be consumed.

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("large-file.txt");
const writeStream = fs.createWriteStream("output.txt");

// ❌ BAD - Doesn't handle backpressure
readStream.on("data", (chunk) => {
  writeStream.write(chunk); // May cause memory issues
});

// ✅ GOOD - Handle backpressure
readStream.on("data", (chunk) => {
  const canContinue = writeStream.write(chunk);

  if (!canContinue) {
    // Pause reading until drain
    readStream.pause();
  }
});

writeStream.on("drain", () => {
  // Resume reading
  readStream.resume();
});

// ✅ BETTER - Use pipe (handles backpressure automatically)
readStream.pipe(writeStream);
```

### Error Handling

```javascript
const { pipeline } = require("stream");
const fs = require("fs");
const zlib = require("zlib");

// ❌ BAD - Errors not properly handled
fs.createReadStream("input.txt")
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream("output.txt.gz"));

// ✅ GOOD - Proper error handling
const readStream = fs.createReadStream("input.txt");
const gzip = zlib.createGzip();
const writeStream = fs.createWriteStream("output.txt.gz");

readStream.on("error", (err) => console.error("Read error:", err));
gzip.on("error", (err) => console.error("Gzip error:", err));
writeStream.on("error", (err) => console.error("Write error:", err));

readStream.pipe(gzip).pipe(writeStream);

// ✅ BEST - Use pipeline (handles cleanup)
pipeline(
  fs.createReadStream("input.txt"),
  zlib.createGzip(),
  fs.createWriteStream("output.txt.gz"),
  (err) => {
    if (err) {
      console.error("Pipeline failed:", err);
    } else {
      console.log("Pipeline succeeded");
    }
  }
);
```

### Stream Performance

```javascript
const fs = require("fs");

// Create large test file
const testFile = "test-100mb.txt";
const writeStream = fs.createWriteStream(testFile);
const size = 100 * 1024 * 1024; // 100MB
let written = 0;

while (written < size) {
  writeStream.write("x".repeat(1024));
  written += 1024;
}
writeStream.end();

// Benchmark: readFile vs stream
console.time("readFile");
fs.readFile(testFile, (err, data) => {
  console.timeEnd("readFile"); // ~150ms, 100MB memory
  console.log("Memory:", process.memoryUsage().heapUsed / 1024 / 1024, "MB");
});

console.time("stream");
const stream = fs.createReadStream(testFile);
let streamSize = 0;

stream.on("data", (chunk) => {
  streamSize += chunk.length;
});

stream.on("end", () => {
  console.timeEnd("stream"); // ~100ms, 10MB memory
  console.log("Memory:", process.memoryUsage().heapUsed / 1024 / 1024, "MB");
});
```

### Best Practices

```javascript
// ✅ 1. Use pipeline for better error handling
const { pipeline } = require("stream");
pipeline(source, transform, destination, (err) => {
  if (err) console.error("Error:", err);
});

// ✅ 2. Always handle errors
stream.on("error", (err) => console.error(err));

// ✅ 3. Use pipe() for automatic backpressure
readStream.pipe(writeStream);

// ✅ 4. Clean up on errors
readStream.on("error", () => {
  readStream.destroy();
  writeStream.destroy();
});

// ✅ 5. Set appropriate highWaterMark
const stream = fs.createReadStream("file.txt", {
  highWaterMark: 64 * 1024, // 64KB chunks
});

// ✅ 6. Use object mode for non-buffer data
const transform = new Transform({
  objectMode: true,
  transform(obj, enc, cb) {
    this.push(obj);
    cb();
  },
});

// ✅ 7. Implement _destroy for cleanup
class MyStream extends Readable {
  _destroy(err, callback) {
    // Clean up resources
    this.close();
    callback(err);
  }
}

// ✅ 8. Use async iterators (Node 10+)
async function processFile() {
  const stream = fs.createReadStream("file.txt");
  for await (const chunk of stream) {
    console.log("Chunk:", chunk);
  }
}

// ✅ 9. Handle 'close' event for cleanup
stream.on("close", () => {
  console.log("Stream closed, cleaning up");
});

// ✅ 10. Use promises with streams
const { finished } = require("stream/promises");
await finished(stream);
```

### Key Takeaways

- ✅ Streams process data in **chunks** (memory efficient)
- ✅ **4 types**: Readable, Writable, Duplex, Transform
- ✅ Use **pipe()** to connect streams (handles backpressure)
- ✅ Streams emit **events** (data, end, error, finish, etc.)
- ✅ **Readable**: Read data from source
- ✅ **Writable**: Write data to destination
- ✅ **Duplex**: Both read and write
- ✅ **Transform**: Modify data in transit
- ✅ Always **handle errors** in streams
- ✅ Use **pipeline()** for better error handling
- ✅ Streams inherit from **EventEmitter**
- ✅ **Backpressure**: Pause/resume to manage flow
- ✅ Perfect for **large files**, **real-time data**, **network**
- ✅ Use **object mode** for non-buffer data
- ✅ Modern: Use **async iterators** with streams

### Further Reading

- [Node.js Stream Documentation](https://nodejs.org/api/stream.html)
- [Stream Handbook](https://github.com/substack/stream-handbook)
- [Understanding Streams in Node.js](https://nodesource.com/blog/understanding-streams-in-nodejs/)
- [Backpressure in Streams](https://nodejs.org/en/docs/guides/backpressuring-in-streams/)
- [Stream API](https://nodejs.org/api/stream.html#stream_api_for_stream_implementers)
