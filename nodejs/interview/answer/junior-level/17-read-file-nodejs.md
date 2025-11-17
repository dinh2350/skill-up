# How do you read a file in Node.js?

## Short Answer

Use the **`fs` (File System) module** to read files in Node.js. There are multiple methods:

**Three main approaches:**

1. **Synchronous** - Blocks execution until complete
2. **Asynchronous (callback)** - Non-blocking with callback
3. **Promises** - Non-blocking with async/await

```javascript
const fs = require("fs");

// 1. Synchronous (blocks execution)
const data = fs.readFileSync("file.txt", "utf8");
console.log(data);

// 2. Asynchronous (callback)
fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) throw err;
  console.log(data);
});

// 3. Promises (async/await - modern approach)
const fs = require("fs").promises;
const data = await fs.readFile("file.txt", "utf8");
console.log(data);
```

**Recommendation:** Use **async/await with promises** for production code (non-blocking and clean syntax).

## Detailed Answer

### The fs Module

The `fs` (File System) module provides an API for interacting with the file system.

```javascript
// CommonJS
const fs = require("fs");

// ES Modules
import fs from "fs";

// Promises version
const fs = require("fs").promises;
// or
import { promises as fs } from "fs";
```

### Method 1: fs.readFileSync() - Synchronous

Reads the **entire file** into memory synchronously (blocks execution).

#### Basic Usage

```javascript
const fs = require("fs");

try {
  const data = fs.readFileSync("file.txt", "utf8");
  console.log(data);
} catch (err) {
  console.error("Error reading file:", err);
}
```

#### Without Encoding (Returns Buffer)

```javascript
const fs = require("fs");

// Returns Buffer
const buffer = fs.readFileSync("file.txt");
console.log(buffer); // <Buffer 48 65 6c 6c 6f>

// Convert Buffer to string
const text = buffer.toString("utf8");
console.log(text); // 'Hello'
```

#### Reading Different Encodings

```javascript
const fs = require("fs");

// UTF-8 (default for text files)
const utf8Data = fs.readFileSync("file.txt", "utf8");

// ASCII
const asciiData = fs.readFileSync("file.txt", "ascii");

// Base64
const base64Data = fs.readFileSync("file.txt", "base64");

// Latin1
const latin1Data = fs.readFileSync("file.txt", "latin1");
```

#### When to Use readFileSync

```javascript
// ✅ Good: Configuration files at startup
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

// ✅ Good: Build scripts (not serving requests)
const template = fs.readFileSync("./template.html", "utf8");
const output = processTemplate(template);

// ❌ Bad: In request handlers (blocks event loop!)
app.get("/file", (req, res) => {
  const data = fs.readFileSync("large-file.txt", "utf8"); // Blocks!
  res.send(data);
});
```

### Method 2: fs.readFile() - Asynchronous (Callback)

Reads the file asynchronously without blocking.

#### Basic Usage

```javascript
const fs = require("fs");

fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  console.log(data);
});

console.log("This runs immediately");
```

#### Error Handling

```javascript
const fs = require("fs");

fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) {
    if (err.code === "ENOENT") {
      console.error("File not found");
    } else if (err.code === "EACCES") {
      console.error("Permission denied");
    } else {
      console.error("Error:", err.message);
    }
    return;
  }

  console.log("File contents:", data);
});
```

#### Reading Binary Files

```javascript
const fs = require("fs");

fs.readFile("image.png", (err, buffer) => {
  if (err) throw err;

  console.log("File size:", buffer.length, "bytes");
  console.log("First byte:", buffer[0]);

  // Process binary data...
});
```

### Method 3: fs.promises.readFile() - Promises/Async-Await (Recommended)

Modern approach using Promises and async/await.

#### Basic Usage

```javascript
const fs = require("fs").promises;

async function readMyFile() {
  try {
    const data = await fs.readFile("file.txt", "utf8");
    console.log(data);
  } catch (err) {
    console.error("Error reading file:", err);
  }
}

readMyFile();
```

#### With .then()/.catch()

```javascript
const fs = require("fs").promises;

fs.readFile("file.txt", "utf8")
  .then((data) => {
    console.log(data);
  })
  .catch((err) => {
    console.error("Error:", err);
  });
```

#### Reading Multiple Files in Parallel

```javascript
const fs = require("fs").promises;

async function readMultipleFiles() {
  try {
    const [file1, file2, file3] = await Promise.all([
      fs.readFile("file1.txt", "utf8"),
      fs.readFile("file2.txt", "utf8"),
      fs.readFile("file3.txt", "utf8"),
    ]);

    console.log("File 1:", file1);
    console.log("File 2:", file2);
    console.log("File 3:", file3);
  } catch (err) {
    console.error("Error:", err);
  }
}

readMultipleFiles();
```

#### Reading Multiple Files Sequentially

```javascript
const fs = require("fs").promises;

async function readSequentially() {
  try {
    const file1 = await fs.readFile("file1.txt", "utf8");
    console.log("Read file 1");

    const file2 = await fs.readFile("file2.txt", "utf8");
    console.log("Read file 2");

    const file3 = await fs.readFile("file3.txt", "utf8");
    console.log("Read file 3");

    return { file1, file2, file3 };
  } catch (err) {
    console.error("Error:", err);
  }
}
```

### Method 4: fs.createReadStream() - Streaming (For Large Files)

For large files, use streams to avoid loading entire file into memory.

#### Basic Stream

```javascript
const fs = require("fs");

const readStream = fs.createReadStream("large-file.txt", {
  encoding: "utf8",
  highWaterMark: 64 * 1024, // 64KB chunks
});

readStream.on("data", (chunk) => {
  console.log("Received chunk:", chunk.length, "bytes");
});

readStream.on("end", () => {
  console.log("Finished reading file");
});

readStream.on("error", (err) => {
  console.error("Stream error:", err);
});
```

#### Stream with Pipe

```javascript
const fs = require("fs");

// Copy file using streams
const readStream = fs.createReadStream("source.txt");
const writeStream = fs.createWriteStream("destination.txt");

readStream.pipe(writeStream);

writeStream.on("finish", () => {
  console.log("File copied successfully");
});
```

#### Processing Large Files Line by Line

```javascript
const fs = require("fs");
const readline = require("readline");

async function processLineByLine() {
  const fileStream = fs.createReadStream("large-file.txt");

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    console.log(`Line ${lineNumber}: ${line}`);
  }

  console.log(`Processed ${lineNumber} lines`);
}

processLineByLine();
```

### Reading Different File Types

#### JSON Files

```javascript
const fs = require("fs").promises;

// Method 1: readFile + JSON.parse
async function readJSON() {
  try {
    const data = await fs.readFile("config.json", "utf8");
    const json = JSON.parse(data);
    return json;
  } catch (err) {
    console.error("Error reading JSON:", err);
  }
}

// Method 2: require (synchronous, cached)
const config = require("./config.json");

// Usage
const config = await readJSON();
console.log(config.database.host);
```

#### CSV Files

```javascript
const fs = require("fs").promises;

async function readCSV(filename) {
  const data = await fs.readFile(filename, "utf8");
  const lines = data.split("\n");
  const headers = lines[0].split(",");

  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {});
  });

  return rows;
}

// Usage
const users = await readCSV("users.csv");
console.log(users);
```

#### Binary Files (Images, PDFs, etc.)

```javascript
const fs = require("fs").promises;

async function readBinaryFile() {
  try {
    // Read as Buffer
    const buffer = await fs.readFile("image.png");

    console.log("File size:", buffer.length, "bytes");
    console.log("File type:", buffer.slice(0, 4).toString("hex"));

    // Convert to Base64
    const base64 = buffer.toString("base64");
    console.log("Base64:", base64.substring(0, 50) + "...");

    return buffer;
  } catch (err) {
    console.error("Error:", err);
  }
}

readBinaryFile();
```

#### Text Files with Different Line Endings

```javascript
const fs = require("fs").promises;

async function readTextFile() {
  const data = await fs.readFile("file.txt", "utf8");

  // Handle different line endings
  const lines = data.split(/\r?\n/);

  lines.forEach((line, index) => {
    console.log(`Line ${index + 1}: ${line}`);
  });
}
```

### File Reading Options

```javascript
const fs = require("fs").promises;

// Basic read
await fs.readFile("file.txt", "utf8");

// With options object
await fs.readFile("file.txt", {
  encoding: "utf8",
  flag: "r", // 'r' = read mode (default)
});

// Read specific portion of file
const fd = await fs.open("file.txt", "r");
const buffer = Buffer.alloc(100);
await fd.read(buffer, 0, 100, 0); // Read 100 bytes from position 0
await fd.close();
```

### Real-World Examples

#### Example 1: Configuration File Loader

```javascript
const fs = require("fs").promises;
const path = require("path");

class ConfigLoader {
  constructor(configDir) {
    this.configDir = configDir;
    this.cache = {};
  }

  async load(filename) {
    // Check cache
    if (this.cache[filename]) {
      return this.cache[filename];
    }

    try {
      const filePath = path.join(this.configDir, filename);
      const data = await fs.readFile(filePath, "utf8");

      // Parse based on extension
      const ext = path.extname(filename);
      let config;

      if (ext === ".json") {
        config = JSON.parse(data);
      } else if (ext === ".env") {
        config = this.parseEnv(data);
      } else {
        config = data;
      }

      // Cache it
      this.cache[filename] = config;
      return config;
    } catch (err) {
      console.error(`Failed to load config ${filename}:`, err);
      throw err;
    }
  }

  parseEnv(data) {
    const result = {};
    data.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        result[key.trim()] = value.trim();
      }
    });
    return result;
  }
}

// Usage
const loader = new ConfigLoader("./config");
const dbConfig = await loader.load("database.json");
const envConfig = await loader.load(".env");
```

#### Example 2: Template Renderer

```javascript
const fs = require("fs").promises;
const path = require("path");

async function renderTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, "templates", templateName);
    let template = await fs.readFile(templatePath, "utf8");

    // Replace placeholders: {{ key }}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      template = template.replace(regex, value);
    }

    return template;
  } catch (err) {
    console.error("Template error:", err);
    throw err;
  }
}

// Usage
const html = await renderTemplate("email.html", {
  name: "John Doe",
  subject: "Welcome",
  content: "Thank you for signing up!",
});
```

#### Example 3: Log File Analyzer

```javascript
const fs = require("fs");
const readline = require("readline");

async function analyzeLogs(logFile) {
  const stats = {
    totalLines: 0,
    errors: 0,
    warnings: 0,
    info: 0,
  };

  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    stats.totalLines++;

    if (line.includes("[ERROR]")) stats.errors++;
    else if (line.includes("[WARN]")) stats.warnings++;
    else if (line.includes("[INFO]")) stats.info++;
  }

  return stats;
}

// Usage
const stats = await analyzeLogs("application.log");
console.log("Log Analysis:", stats);
```

#### Example 4: File Content Search

```javascript
const fs = require("fs").promises;
const path = require("path");

async function searchInFiles(directory, searchTerm) {
  const results = [];

  const files = await fs.readdir(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = await fs.stat(filePath);

    if (stat.isFile() && file.endsWith(".txt")) {
      const content = await fs.readFile(filePath, "utf8");

      if (content.includes(searchTerm)) {
        const lines = content.split("\n");
        const matchingLines = lines
          .map((line, index) => ({ line: index + 1, content: line }))
          .filter((item) => item.content.includes(searchTerm));

        results.push({
          file: filePath,
          matches: matchingLines,
        });
      }
    }
  }

  return results;
}

// Usage
const results = await searchInFiles("./documents", "TODO");
console.log("Found in:", results);
```

#### Example 5: Data Migration Reader

```javascript
const fs = require("fs");
const readline = require("readline");

async function processMigrationFile(filename, batchSize = 1000) {
  const fileStream = fs.createReadStream(filename);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let batch = [];
  let processedCount = 0;

  for await (const line of rl) {
    if (line.trim()) {
      batch.push(JSON.parse(line));

      if (batch.length >= batchSize) {
        await processBatch(batch);
        processedCount += batch.length;
        console.log(`Processed ${processedCount} records`);
        batch = [];
      }
    }
  }

  // Process remaining
  if (batch.length > 0) {
    await processBatch(batch);
    processedCount += batch.length;
  }

  console.log(`Total processed: ${processedCount} records`);
}

async function processBatch(records) {
  // Insert into database, etc.
  console.log(`Processing batch of ${records.length} records`);
}

// Usage
await processMigrationFile("migration-data.jsonl", 1000);
```

### Error Handling

```javascript
const fs = require("fs").promises;

async function safeReadFile(filename) {
  try {
    return await fs.readFile(filename, "utf8");
  } catch (err) {
    // Handle specific errors
    switch (err.code) {
      case "ENOENT":
        console.error("File not found:", filename);
        break;
      case "EACCES":
        console.error("Permission denied:", filename);
        break;
      case "EISDIR":
        console.error("Path is a directory:", filename);
        break;
      case "EMFILE":
        console.error("Too many open files");
        break;
      default:
        console.error("Error reading file:", err.message);
    }
    throw err;
  }
}
```

### Checking File Existence Before Reading

```javascript
const fs = require("fs").promises;

async function readFileIfExists(filename) {
  try {
    // Check if file exists
    await fs.access(filename, fs.constants.F_OK);

    // File exists, read it
    const data = await fs.readFile(filename, "utf8");
    return data;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("File does not exist");
      return null;
    }
    throw err;
  }
}

// Or use stat
async function readWithStats(filename) {
  try {
    const stats = await fs.stat(filename);

    if (!stats.isFile()) {
      throw new Error("Not a file");
    }

    if (stats.size > 10 * 1024 * 1024) {
      console.warn("Large file, consider using streams");
    }

    return await fs.readFile(filename, "utf8");
  } catch (err) {
    console.error("Error:", err);
  }
}
```

### Performance Comparison

```javascript
const fs = require("fs");

// Synchronous (slowest, blocks)
console.time("sync");
const data1 = fs.readFileSync("large-file.txt", "utf8");
console.timeEnd("sync"); // ~100ms, blocks other operations

// Async callback (fast, non-blocking)
console.time("async");
fs.readFile("large-file.txt", "utf8", (err, data) => {
  console.timeEnd("async"); // ~100ms, doesn't block
});

// Promises (fast, non-blocking, clean syntax)
console.time("promises");
fs.promises.readFile("large-file.txt", "utf8").then((data) => {
  console.timeEnd("promises"); // ~100ms, doesn't block
});

// Stream (best for large files, low memory)
console.time("stream");
const stream = fs.createReadStream("large-file.txt");
stream.on("end", () => {
  console.timeEnd("stream"); // ~100ms, uses minimal memory
});
```

### Best Practices

```javascript
const fs = require("fs").promises;
const path = require("path");

// ✅ 1. Use async/await for clean code
async function goodRead() {
  try {
    const data = await fs.readFile("file.txt", "utf8");
    return data;
  } catch (err) {
    console.error(err);
  }
}

// ✅ 2. Always specify encoding for text files
const text = await fs.readFile("file.txt", "utf8"); // String
const binary = await fs.readFile("file.png"); // Buffer

// ✅ 3. Use path.join() for file paths
const filePath = path.join(__dirname, "data", "config.json");
const data = await fs.readFile(filePath, "utf8");

// ✅ 4. Handle errors appropriately
try {
  const data = await fs.readFile("file.txt", "utf8");
} catch (err) {
  if (err.code === "ENOENT") {
    // File doesn't exist - use default
    return getDefaultData();
  }
  throw err; // Re-throw unexpected errors
}

// ✅ 5. Use streams for large files
if (fileSize > 10 * 1024 * 1024) {
  // > 10MB
  const stream = fs.createReadStream("large-file.txt");
  // Process in chunks
}

// ✅ 6. Cache frequently read files
const cache = new Map();

async function getCachedFile(filename) {
  if (cache.has(filename)) {
    return cache.get(filename);
  }

  const data = await fs.readFile(filename, "utf8");
  cache.set(filename, data);
  return data;
}

// ✅ 7. Validate file paths (security)
function validatePath(userPath) {
  const normalized = path.normalize(userPath);
  const absolute = path.resolve(normalized);
  const baseDir = path.resolve(__dirname, "uploads");

  if (!absolute.startsWith(baseDir)) {
    throw new Error("Access denied");
  }

  return absolute;
}
```

### Key Takeaways

- ✅ Use `fs.readFile()` with promises/async-await for most cases
- ✅ Use `fs.createReadStream()` for large files (memory efficient)
- ✅ Always specify encoding ('utf8') for text files
- ✅ Use try/catch for error handling with async/await
- ✅ Avoid `readFileSync()` in production servers (blocks event loop)
- ✅ Use `path.join()` to build file paths (cross-platform)
- ✅ Check file existence with `fs.access()` or `fs.stat()`
- ✅ Handle specific error codes (ENOENT, EACCES, etc.)
- ✅ Use readline for processing large files line-by-line
- ✅ Cache frequently read files to improve performance
- ✅ Validate user-provided file paths for security
- ✅ Consider file size before choosing read method

### Further Reading

- [Node.js fs module documentation](https://nodejs.org/api/fs.html)
- [fs.readFile()](https://nodejs.org/api/fs.html#fsreadfilepath-options-callback)
- [fs.readFileSync()](https://nodejs.org/api/fs.html#fsreadfilesyncpath-options)
- [fs.createReadStream()](https://nodejs.org/api/fs.html#fscreatereadstreampath-options)
- [Working with Streams in Node.js](https://nodejs.org/api/stream.html)
