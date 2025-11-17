# What is piping in streams?

Piping in streams is a mechanism that allows you to connect the output of one stream to the input of another stream, creating a chain of data transformation. It's a fundamental concept in Node.js that enables elegant and efficient data processing workflows.

## What is Piping?

Piping takes the readable output from one stream and feeds it as writable input to another stream. It's similar to Unix pipes (`|`) but for Node.js streams. The `pipe()` method automatically handles:

- Data flow between streams
- Backpressure management
- Error propagation
- End event handling

## Basic Syntax

```javascript
readableStream.pipe(writableStream);
```

## Simple Piping Example

### Basic File Copy

```javascript
const fs = require("fs");

// Create readable and writable streams
const readStream = fs.createReadStream("input.txt");
const writeStream = fs.createWriteStream("output.txt");

// Pipe readable to writable
readStream.pipe(writeStream);

writeStream.on("finish", () => {
  console.log("File copied successfully!");
});

writeStream.on("error", (err) => {
  console.error("Error writing file:", err);
});
```

### HTTP Response Piping

```javascript
const http = require("http");
const fs = require("fs");

const server = http.createServer((req, res) => {
  if (req.url === "/download") {
    const fileStream = fs.createReadStream("large-file.pdf");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="file.pdf"');

    // Pipe file directly to HTTP response
    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      res.statusCode = 500;
      res.end("Error reading file");
    });
  }
});
```

## Chaining Streams

One of the most powerful features of piping is the ability to chain multiple streams together:

```javascript
const fs = require("fs");
const zlib = require("zlib");
const crypto = require("crypto");

fs.createReadStream("input.txt")
  .pipe(zlib.createGzip()) // Compress
  .pipe(crypto.createCipher("aes192", "secret-key")) // Encrypt
  .pipe(fs.createWriteStream("output.txt.gz.enc")) // Write
  .on("finish", () => {
    console.log("File compressed, encrypted, and saved!");
  });
```

## Transform Stream Piping

```javascript
const fs = require("fs");
const { Transform } = require("stream");

// Create a transform stream to uppercase text
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

// Create a transform stream to add line numbers
class LineNumberTransform extends Transform {
  constructor() {
    super();
    this.lineNumber = 1;
  }

  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split("\n");
    const numberedLines = lines
      .map((line, index) => {
        if (index === lines.length - 1 && line === "") return line;
        return `${this.lineNumber++}: ${line}`;
      })
      .join("\n");

    this.push(numberedLines);
    callback();
  }
}

// Chain transforms
fs.createReadStream("input.txt")
  .pipe(new UpperCaseTransform())
  .pipe(new LineNumberTransform())
  .pipe(fs.createWriteStream("output.txt"))
  .on("finish", () => {
    console.log("Text transformed and saved!");
  });
```

## Advanced Piping Patterns

### 1. Multiple Destinations (Splitting)

```javascript
const fs = require("fs");
const { PassThrough } = require("stream");

const sourceStream = fs.createReadStream("source.txt");
const passThrough = new PassThrough();

// Split to multiple destinations
sourceStream.pipe(passThrough);

passThrough.pipe(fs.createWriteStream("copy1.txt"));
passThrough.pipe(fs.createWriteStream("copy2.txt"));

// You can also process differently
const upperStream = passThrough.pipe(new UpperCaseTransform());
upperStream.pipe(fs.createWriteStream("uppercase.txt"));
```

### 2. Conditional Piping

```javascript
const fs = require("fs");
const path = require("path");

function processFile(inputFile) {
  const readStream = fs.createReadStream(inputFile);
  const ext = path.extname(inputFile);

  let pipeline = readStream;

  // Conditional piping based on file type
  if (ext === ".txt") {
    pipeline = pipeline.pipe(new UpperCaseTransform());
  } else if (ext === ".json") {
    pipeline = pipeline.pipe(new JSONPrettyPrintTransform());
  }

  // Always compress
  pipeline = pipeline.pipe(zlib.createGzip());

  // Write to output
  pipeline.pipe(fs.createWriteStream(`processed${ext}.gz`));
}
```

### 3. Error Handling in Pipelines

```javascript
const fs = require("fs");
const { pipeline } = require("stream");
const { promisify } = require("util");

const pipelineAsync = promisify(pipeline);

async function safePipeline() {
  try {
    await pipelineAsync(
      fs.createReadStream("input.txt"),
      new UpperCaseTransform(),
      fs.createWriteStream("output.txt")
    );
    console.log("Pipeline succeeded");
  } catch (error) {
    console.error("Pipeline failed:", error);
  }
}

// Alternative error handling with manual pipeline
function manualErrorHandling() {
  const readStream = fs.createReadStream("input.txt");
  const transform = new UpperCaseTransform();
  const writeStream = fs.createWriteStream("output.txt");

  // Handle errors on each stream
  readStream.on("error", handleError);
  transform.on("error", handleError);
  writeStream.on("error", handleError);

  function handleError(err) {
    console.error("Stream error:", err);

    // Cleanup
    readStream.destroy();
    transform.destroy();
    writeStream.destroy();
  }

  readStream.pipe(transform).pipe(writeStream);
}
```

## HTTP Streaming Examples

### 1. Streaming JSON API

```javascript
const http = require("http");
const { Readable, Transform } = require("stream");

class DataStream extends Readable {
  constructor(data) {
    super({ objectMode: true });
    this.data = data;
    this.index = 0;
  }

  _read() {
    if (this.index < this.data.length) {
      this.push(this.data[this.index++]);
    } else {
      this.push(null);
    }
  }
}

class JSONTransform extends Transform {
  constructor() {
    super({ objectMode: true });
    this.first = true;
  }

  _transform(obj, encoding, callback) {
    const prefix = this.first ? "[" : ",";
    this.first = false;
    this.push(prefix + JSON.stringify(obj));
    callback();
  }

  _flush(callback) {
    this.push("]");
    callback();
  }
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/users") {
    const users = [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
      { id: 3, name: "Bob" },
    ];

    res.setHeader("Content-Type", "application/json");

    new DataStream(users).pipe(new JSONTransform()).pipe(res);
  }
});
```

### 2. Upload Processing Pipeline

```javascript
const http = require("http");
const fs = require("fs");
const crypto = require("crypto");

class FileHashTransform extends Transform {
  constructor() {
    super();
    this.hash = crypto.createHash("md5");
  }

  _transform(chunk, encoding, callback) {
    this.hash.update(chunk);
    this.push(chunk); // Pass through
    callback();
  }

  _flush(callback) {
    const finalHash = this.hash.digest("hex");
    console.log("File hash:", finalHash);
    callback();
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/upload") {
    const hashTransform = new FileHashTransform();
    const writeStream = fs.createWriteStream("uploaded-file.bin");

    req
      .pipe(hashTransform)
      .pipe(writeStream)
      .on("finish", () => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ status: "success", message: "File uploaded" })
        );
      })
      .on("error", (err) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: err.message }));
      });
  }
});
```

## Stream Utilities for Piping

### 1. pipeline() Function

The `pipeline()` function provides better error handling and cleanup:

```javascript
const { pipeline } = require("stream");
const fs = require("fs");

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

### 2. pump() from pump package

```javascript
const pump = require("pump");
const fs = require("fs");

pump(
  fs.createReadStream("input.txt"),
  new UpperCaseTransform(),
  fs.createWriteStream("output.txt"),
  (err) => {
    if (err) {
      console.error("Pump failed:", err);
    } else {
      console.log("Pump succeeded");
    }
  }
);
```

## Complex Pipeline Examples

### 1. Log Processing Pipeline

```javascript
const fs = require("fs");
const { Transform } = require("stream");
const readline = require("readline");

class LogParser extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(line, encoding, callback) {
    try {
      // Parse log line: "2023-01-01 10:00:00 INFO Message"
      const match = line.match(
        /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (\w+) (.+)$/
      );
      if (match) {
        const [, timestamp, level, message] = match;
        this.push({
          timestamp: new Date(timestamp),
          level,
          message,
          original: line,
        });
      }
    } catch (err) {
      // Skip invalid lines
    }
    callback();
  }
}

class LogFilter extends Transform {
  constructor(filterLevel) {
    super({ objectMode: true });
    this.filterLevel = filterLevel;
    this.levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  }

  _transform(logEntry, encoding, callback) {
    if (this.levels[logEntry.level] >= this.levels[this.filterLevel]) {
      this.push(logEntry);
    }
    callback();
  }
}

class LogFormatter extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(logEntry, encoding, callback) {
    const formatted =
      JSON.stringify({
        timestamp: logEntry.timestamp.toISOString(),
        level: logEntry.level,
        message: logEntry.message,
      }) + "\n";
    this.push(formatted);
    callback();
  }
}

// Process log file
const fileStream = fs.createReadStream("app.log");
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

const logParser = new LogParser();
const logFilter = new LogFilter("WARN"); // Only WARN and ERROR
const logFormatter = new LogFormatter();

rl.on("line", (line) => {
  logParser.write(line);
});

rl.on("close", () => {
  logParser.end();
});

logParser
  .pipe(logFilter)
  .pipe(logFormatter)
  .pipe(fs.createWriteStream("filtered-logs.json"))
  .on("finish", () => {
    console.log("Log processing complete");
  });
```

### 2. CSV Processing Pipeline

```javascript
const fs = require("fs");
const { Transform } = require("stream");

class CSVParser extends Transform {
  constructor() {
    super({ objectMode: true });
    this.headers = null;
    this.isFirstLine = true;
  }

  _transform(line, encoding, callback) {
    const fields = line.split(",").map((field) => field.trim());

    if (this.isFirstLine) {
      this.headers = fields;
      this.isFirstLine = false;
    } else {
      const record = {};
      this.headers.forEach((header, index) => {
        record[header] = fields[index] || "";
      });
      this.push(record);
    }
    callback();
  }
}

class DataValidator extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(record, encoding, callback) {
    // Validate required fields
    if (record.email && record.name && record.age) {
      // Additional validation
      if (record.email.includes("@") && !isNaN(record.age)) {
        this.push(record);
      }
    }
    callback();
  }
}

class DataTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(record, encoding, callback) {
    // Transform data
    const transformed = {
      fullName: record.name.toUpperCase(),
      emailDomain: record.email.split("@")[1],
      age: parseInt(record.age),
      isAdult: parseInt(record.age) >= 18,
      processedAt: new Date().toISOString(),
    };
    this.push(JSON.stringify(transformed) + "\n");
    callback();
  }
}

// Process CSV file
const readline = require("readline");
const fileStream = fs.createReadStream("users.csv");
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

const csvParser = new CSVParser();
const validator = new DataValidator();
const transformer = new DataTransformer();

rl.on("line", (line) => {
  csvParser.write(line);
});

rl.on("close", () => {
  csvParser.end();
});

csvParser
  .pipe(validator)
  .pipe(transformer)
  .pipe(fs.createWriteStream("processed-users.json"))
  .on("finish", () => {
    console.log("CSV processing complete");
  });
```

## Best Practices for Piping

### 1. Always Handle Errors

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("input.txt");
const writeStream = fs.createWriteStream("output.txt");

readStream.pipe(writeStream).on("error", (err) => {
  console.error("Write stream error:", err);
  readStream.destroy(); // Cleanup read stream
});

readStream.on("error", (err) => {
  console.error("Read stream error:", err);
  writeStream.destroy(); // Cleanup write stream
});
```

### 2. Use pipeline() for Better Error Handling

```javascript
const { pipeline } = require("stream");
const fs = require("fs");

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

### 3. Handle Backpressure

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("large-file.txt");
const writeStream = fs.createWriteStream("output.txt");

// The pipe() method automatically handles backpressure
readStream.pipe(writeStream);

// Manual handling (not recommended when using pipe())
// readStream.on('data', (chunk) => {
//   const canContinue = writeStream.write(chunk);
//   if (!canContinue) {
//     readStream.pause();
//     writeStream.once('drain', () => {
//       readStream.resume();
//     });
//   }
// });
```

### 4. Proper Cleanup

```javascript
const fs = require("fs");

function createProcessingPipeline(inputFile, outputFile) {
  const readStream = fs.createReadStream(inputFile);
  const transform = new UpperCaseTransform();
  const writeStream = fs.createWriteStream(outputFile);

  const cleanup = () => {
    readStream.destroy();
    transform.destroy();
    writeStream.destroy();
  };

  // Handle process termination
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  return readStream.pipe(transform).pipe(writeStream);
}
```

## Performance Considerations

### 1. Buffer Size Optimization

```javascript
const fs = require("fs");

// Optimize buffer sizes for large files
const options = {
  highWaterMark: 1024 * 1024, // 1MB buffer
};

fs.createReadStream("large-file.txt", options)
  .pipe(new UpperCaseTransform({ highWaterMark: 1024 * 1024 }))
  .pipe(fs.createWriteStream("output.txt", options));
```

### 2. Memory Usage Monitoring

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("large-file.txt");
const writeStream = fs.createWriteStream("output.txt");

let totalBytes = 0;

readStream.on("data", (chunk) => {
  totalBytes += chunk.length;
  console.log(
    `Processed: ${totalBytes} bytes, Memory: ${
      process.memoryUsage().heapUsed / 1024 / 1024
    } MB`
  );
});

readStream.pipe(writeStream);
```

## Summary

Piping in streams is a powerful mechanism for:

### Key Benefits:

- **Elegant Data Flow**: Connect streams in a readable, chainable manner
- **Automatic Management**: Handles backpressure, errors, and cleanup automatically
- **Memory Efficiency**: Process large data without loading everything into memory
- **Composability**: Build complex data processing pipelines from simple components
- **Error Propagation**: Errors flow through the pipeline appropriately

### Best Practices:

- Always handle errors properly
- Use `pipeline()` or `pump()` for better error handling
- Clean up resources in case of failures
- Optimize buffer sizes for performance
- Monitor memory usage for large data processing

### Common Use Cases:

- File processing and transformation
- HTTP streaming responses
- Data compression and encryption
- Log processing and analysis
- Real-time data transformation
- API data streaming

Piping is essential for building efficient, scalable Node.js applications that handle data streams effectively.
