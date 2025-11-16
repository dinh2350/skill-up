# How do you write to a file in Node.js?

## Short Answer

Use the **`fs` (File System) module** to write files in Node.js. There are multiple methods:

**Three main approaches:**

1. **Synchronous** - Blocks execution until complete
2. **Asynchronous (callback)** - Non-blocking with callback
3. **Promises** - Non-blocking with async/await

```javascript
const fs = require("fs");

// 1. Synchronous (blocks execution)
fs.writeFileSync("file.txt", "Hello World", "utf8");

// 2. Asynchronous (callback)
fs.writeFile("file.txt", "Hello World", "utf8", (err) => {
  if (err) throw err;
  console.log("File written successfully");
});

// 3. Promises (async/await - modern approach)
const fs = require("fs").promises;
await fs.writeFile("file.txt", "Hello World", "utf8");
console.log("File written successfully");
```

**Recommendation:** Use **async/await with promises** for production code (non-blocking and clean syntax).

## Detailed Answer

### The fs Module

The `fs` (File System) module provides methods to write data to files.

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

### Method 1: fs.writeFileSync() - Synchronous

Writes data to a file synchronously (blocks execution).

#### Basic Usage

```javascript
const fs = require("fs");

try {
  fs.writeFileSync("file.txt", "Hello World", "utf8");
  console.log("File written successfully");
} catch (err) {
  console.error("Error writing file:", err);
}
```

#### Overwriting vs Appending

```javascript
const fs = require("fs");

// Overwrites file (default)
fs.writeFileSync("file.txt", "New content");

// Append to file (use flag: 'a')
fs.writeFileSync("file.txt", "\nMore content", { flag: "a" });
```

#### Writing Different Data Types

```javascript
const fs = require("fs");

// String
fs.writeFileSync("text.txt", "Hello World", "utf8");

// Buffer
const buffer = Buffer.from("Hello Buffer");
fs.writeFileSync("buffer.txt", buffer);

// JSON
const data = { name: "John", age: 30 };
fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

// Array of lines
const lines = ["Line 1", "Line 2", "Line 3"];
fs.writeFileSync("lines.txt", lines.join("\n"));
```

#### When to Use writeFileSync

```javascript
// ✅ Good: Build scripts
const output = generateBuildOutput();
fs.writeFileSync("./dist/bundle.js", output);

// ✅ Good: CLI tools
fs.writeFileSync("./output.txt", result);

// ❌ Bad: In request handlers (blocks event loop!)
app.post("/save", (req, res) => {
  fs.writeFileSync("data.txt", req.body.data); // Blocks!
  res.send("Saved");
});
```

### Method 2: fs.writeFile() - Asynchronous (Callback)

Writes data asynchronously without blocking.

#### Basic Usage

```javascript
const fs = require("fs");

fs.writeFile("file.txt", "Hello World", "utf8", (err) => {
  if (err) {
    console.error("Error writing file:", err);
    return;
  }
  console.log("File written successfully");
});

console.log("This runs immediately");
```

#### With Error Handling

```javascript
const fs = require("fs");

const content = "Hello World";

fs.writeFile("file.txt", content, "utf8", (err) => {
  if (err) {
    if (err.code === "ENOENT") {
      console.error("Directory does not exist");
    } else if (err.code === "EACCES") {
      console.error("Permission denied");
    } else {
      console.error("Error:", err.message);
    }
    return;
  }

  console.log("File saved to file.txt");
});
```

#### Writing JSON

```javascript
const fs = require("fs");

const data = {
  users: [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
  ],
};

fs.writeFile("users.json", JSON.stringify(data, null, 2), (err) => {
  if (err) throw err;
  console.log("JSON file saved");
});
```

### Method 3: fs.promises.writeFile() - Promises/Async-Await (Recommended)

Modern approach using Promises and async/await.

#### Basic Usage

```javascript
const fs = require("fs").promises;

async function writeMyFile() {
  try {
    await fs.writeFile("file.txt", "Hello World", "utf8");
    console.log("File written successfully");
  } catch (err) {
    console.error("Error writing file:", err);
  }
}

writeMyFile();
```

#### With .then()/.catch()

```javascript
const fs = require("fs").promises;

fs.writeFile("file.txt", "Hello World", "utf8")
  .then(() => {
    console.log("File written successfully");
  })
  .catch((err) => {
    console.error("Error:", err);
  });
```

#### Writing Multiple Files

```javascript
const fs = require("fs").promises;

async function writeMultipleFiles() {
  try {
    // Sequential (one after another)
    await fs.writeFile("file1.txt", "Content 1");
    await fs.writeFile("file2.txt", "Content 2");
    await fs.writeFile("file3.txt", "Content 3");

    console.log("All files written");
  } catch (err) {
    console.error("Error:", err);
  }
}

// Parallel (all at once)
async function writeMultipleFilesParallel() {
  try {
    await Promise.all([
      fs.writeFile("file1.txt", "Content 1"),
      fs.writeFile("file2.txt", "Content 2"),
      fs.writeFile("file3.txt", "Content 3"),
    ]);

    console.log("All files written");
  } catch (err) {
    console.error("Error:", err);
  }
}
```

### Method 4: fs.appendFile() - Appending Content

Add content to the end of a file without overwriting.

#### Basic Append

```javascript
const fs = require("fs").promises;

async function appendToFile() {
  try {
    await fs.appendFile("log.txt", "New log entry\n");
    console.log("Content appended");
  } catch (err) {
    console.error("Error:", err);
  }
}

// If file doesn't exist, it creates it
await fs.appendFile("new-file.txt", "First line\n");
await fs.appendFile("new-file.txt", "Second line\n");
```

#### Logging Example

```javascript
const fs = require("fs").promises;

async function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;

  await fs.appendFile("app.log", logEntry);
}

// Usage
await log("Application started");
await log("User logged in");
await log("Error occurred");
```

### Method 5: fs.createWriteStream() - Streaming (For Large Files)

For large amounts of data or continuous writing, use streams.

#### Basic Stream

```javascript
const fs = require("fs");

const writeStream = fs.createWriteStream("output.txt", {
  encoding: "utf8",
  flags: "w", // 'w' = overwrite, 'a' = append
});

writeStream.write("First line\n");
writeStream.write("Second line\n");
writeStream.write("Third line\n");

writeStream.end(() => {
  console.log("Finished writing");
});

writeStream.on("error", (err) => {
  console.error("Stream error:", err);
});
```

#### Writing Large Data in Chunks

```javascript
const fs = require('fs');

function writeLargeFile(filename, totalLines) {
  const writeStream = fs.createWriteStream(filename);

  for (let i = 1; i <= totalLines; i++) {
    const line = `Line ${i}\n`;

    // Check if buffer is full
    if (!writeStream.write(line)) {
      // Buffer is full, wait for drain event
      await new Promise(resolve => {
        writeStream.once('drain', resolve);
      });
    }
  }

  writeStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

// Write 1 million lines
await writeLargeFile('large-file.txt', 1000000);
```

#### Pipe from Readable to Writable

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

### Writing Different File Types

#### JSON Files

```javascript
const fs = require("fs").promises;

async function writeJSON(filename, data) {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filename, json, "utf8");
}

// Usage
const users = [
  { id: 1, name: "John", email: "john@example.com" },
  { id: 2, name: "Jane", email: "jane@example.com" },
];

await writeJSON("users.json", users);
```

#### CSV Files

```javascript
const fs = require("fs").promises;

async function writeCSV(filename, data) {
  if (data.length === 0) return;

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => row[h]).join(",")),
  ].join("\n");

  await fs.writeFile(filename, csv, "utf8");
}

// Usage
const users = [
  { id: 1, name: "John", email: "john@example.com" },
  { id: 2, name: "Jane", email: "jane@example.com" },
];

await writeCSV("users.csv", users);
```

#### Binary Files

```javascript
const fs = require("fs").promises;

// Write Buffer
async function writeBinary() {
  const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  await fs.writeFile("binary.bin", buffer);
}

// Write Base64 as binary
async function writeBase64Image(base64String, filename) {
  const buffer = Buffer.from(base64String, "base64");
  await fs.writeFile(filename, buffer);
}

// Usage
await writeBase64Image(imageBase64, "image.png");
```

#### HTML Files

```javascript
const fs = require("fs").promises;

async function generateHTML(data) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${data.title}</title>
</head>
<body>
  <h1>${data.heading}</h1>
  <p>${data.content}</p>
</body>
</html>
  `.trim();

  await fs.writeFile("output.html", html, "utf8");
}

// Usage
await generateHTML({
  title: "My Page",
  heading: "Welcome",
  content: "This is my page content",
});
```

### File Write Options

```javascript
const fs = require("fs").promises;

// Basic write
await fs.writeFile("file.txt", "content");

// With options
await fs.writeFile("file.txt", "content", {
  encoding: "utf8",
  mode: 0o666, // File permissions (octal)
  flag: "w", // 'w' = write, 'a' = append, 'wx' = write fail if exists
});

// Common flags:
// 'w'  - Write (overwrite)
// 'wx' - Write (fail if exists)
// 'a'  - Append
// 'ax' - Append (fail if exists)
```

### Real-World Examples

#### Example 1: Logger System

```javascript
const fs = require("fs").promises;
const path = require("path");

class Logger {
  constructor(logDir) {
    this.logDir = logDir;
    this.currentDate = new Date().toISOString().split("T")[0];
  }

  getLogFilePath() {
    return path.join(this.logDir, `${this.currentDate}.log`);
  }

  async log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    try {
      await fs.appendFile(this.getLogFilePath(), logEntry);
    } catch (err) {
      console.error("Failed to write log:", err);
    }
  }

  async info(message) {
    await this.log("INFO", message);
  }

  async error(message) {
    await this.log("ERROR", message);
  }

  async warn(message) {
    await this.log("WARN", message);
  }
}

// Usage
const logger = new Logger("./logs");
await logger.info("Application started");
await logger.error("Database connection failed");
```

#### Example 2: Data Export

```javascript
const fs = require("fs").promises;

async function exportUsers(users, format = "json") {
  const timestamp = Date.now();

  if (format === "json") {
    const json = JSON.stringify(users, null, 2);
    await fs.writeFile(`export-${timestamp}.json`, json);
  } else if (format === "csv") {
    const headers = Object.keys(users[0]);
    const rows = users.map((u) => headers.map((h) => u[h]).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    await fs.writeFile(`export-${timestamp}.csv`, csv);
  }

  console.log(`Exported ${users.length} users`);
}

// Usage
const users = await fetchUsersFromDatabase();
await exportUsers(users, "csv");
```

#### Example 3: Configuration Manager

```javascript
const fs = require("fs").promises;
const path = require("path");

class ConfigManager {
  constructor(configPath) {
    this.configPath = configPath;
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, "utf8");
      return JSON.parse(data);
    } catch (err) {
      if (err.code === "ENOENT") {
        return this.getDefaultConfig();
      }
      throw err;
    }
  }

  async save(config) {
    const json = JSON.stringify(config, null, 2);
    await fs.writeFile(this.configPath, json, "utf8");
  }

  async update(updates) {
    const config = await this.load();
    const newConfig = { ...config, ...updates };
    await this.save(newConfig);
    return newConfig;
  }

  getDefaultConfig() {
    return {
      theme: "light",
      language: "en",
      notifications: true,
    };
  }
}

// Usage
const config = new ConfigManager("./config.json");
await config.update({ theme: "dark" });
```

#### Example 4: Report Generator

```javascript
const fs = require("fs").promises;

async function generateReport(data) {
  const timestamp = new Date().toISOString();

  const report = `
SALES REPORT
Generated: ${timestamp}
${"=".repeat(50)}

Total Sales: ${data.totalSales}
Number of Orders: ${data.orderCount}
Average Order Value: ${data.averageValue}

TOP PRODUCTS:
${data.topProducts
  .map((p, i) => `${i + 1}. ${p.name} (${p.sales} units)`)
  .join("\n")}

${"=".repeat(50)}
End of Report
  `.trim();

  const filename = `report-${Date.now()}.txt`;
  await fs.writeFile(filename, report);

  console.log(`Report saved to ${filename}`);
}

// Usage
const salesData = await fetchSalesData();
await generateReport(salesData);
```

#### Example 5: Backup System

```javascript
const fs = require("fs").promises;
const path = require("path");

async function createBackup(sourceDir, backupDir) {
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  // Create backup directory
  await fs.mkdir(backupPath, { recursive: true });

  // Read all files
  const files = await fs.readdir(sourceDir);

  // Copy each file
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(backupPath, file);

    const stats = await fs.stat(sourcePath);

    if (stats.isFile()) {
      await fs.copyFile(sourcePath, destPath);
      console.log(`Backed up: ${file}`);
    }
  }

  // Write backup manifest
  const manifest = {
    timestamp,
    files: files.length,
    source: sourceDir,
  };

  await fs.writeFile(
    path.join(backupPath, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`Backup completed: ${backupPath}`);
}

// Usage
await createBackup("./data", "./backups");
```

### Atomic Writes (Safe File Updates)

```javascript
const fs = require("fs").promises;
const path = require("path");

async function atomicWrite(filename, content) {
  const tempFile = `${filename}.tmp`;

  try {
    // Write to temporary file
    await fs.writeFile(tempFile, content);

    // Rename (atomic operation)
    await fs.rename(tempFile, filename);

    console.log("File written atomically");
  } catch (err) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw err;
  }
}

// Usage
await atomicWrite("important.json", JSON.stringify(data));
```

### Creating Directories Before Writing

```javascript
const fs = require("fs").promises;
const path = require("path");

async function writeFileWithDir(filePath, content) {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Write file
  await fs.writeFile(filePath, content);
}

// Usage
await writeFileWithDir("./logs/2025/11/app.log", "Log entry");
```

### Error Handling

```javascript
const fs = require("fs").promises;

async function safeWriteFile(filename, content) {
  try {
    await fs.writeFile(filename, content);
    return { success: true };
  } catch (err) {
    switch (err.code) {
      case "ENOENT":
        return { success: false, error: "Directory does not exist" };
      case "EACCES":
        return { success: false, error: "Permission denied" };
      case "ENOSPC":
        return { success: false, error: "No space left on device" };
      case "EISDIR":
        return { success: false, error: "Path is a directory" };
      default:
        return { success: false, error: err.message };
    }
  }
}

// Usage
const result = await safeWriteFile("file.txt", "content");
if (result.success) {
  console.log("File written successfully");
} else {
  console.error("Error:", result.error);
}
```

### Write Permissions

```javascript
const fs = require("fs").promises;

// Write with specific permissions
await fs.writeFile("file.txt", "content", { mode: 0o600 });
// 0o600 = Owner read/write only

// Common permissions:
// 0o666 = rw-rw-rw- (default)
// 0o644 = rw-r--r-- (owner write, others read)
// 0o600 = rw------- (owner only)
// 0o755 = rwxr-xr-x (owner all, others read/execute)

// Change permissions after writing
await fs.chmod("file.txt", 0o644);
```

### Comparing Write Methods

```javascript
const fs = require("fs");

// writeFile: Replaces entire file
await fs.promises.writeFile("file.txt", "New content");
// Result: "New content"

// appendFile: Adds to end
await fs.promises.appendFile("file.txt", "\nMore content");
// Result: "New content\nMore content"

// writeFile with flag 'a': Same as appendFile
await fs.promises.writeFile("file.txt", "\nEven more", { flag: "a" });
// Result: "New content\nMore content\nEven more"

// Stream: Best for large data
const stream = fs.createWriteStream("file.txt");
stream.write("Line 1\n");
stream.write("Line 2\n");
stream.end();
```

### Best Practices

```javascript
const fs = require("fs").promises;
const path = require("path");

// ✅ 1. Use async/await
async function goodWrite() {
  try {
    await fs.writeFile("file.txt", "content");
  } catch (err) {
    console.error(err);
  }
}

// ✅ 2. Always handle errors
try {
  await fs.writeFile("file.txt", "content");
} catch (err) {
  console.error("Failed to write file:", err);
}

// ✅ 3. Use path.join() for paths
const filePath = path.join(__dirname, "data", "output.txt");
await fs.writeFile(filePath, "content");

// ✅ 4. Create directories first
await fs.mkdir(path.dirname(filePath), { recursive: true });
await fs.writeFile(filePath, "content");

// ✅ 5. Use atomic writes for important files
await atomicWrite("config.json", JSON.stringify(config));

// ✅ 6. Use streams for large files
if (dataSize > 10 * 1024 * 1024) {
  // > 10MB
  const stream = fs.createWriteStream("large.txt");
  // Write in chunks
}

// ✅ 7. Validate data before writing
function validateJSON(data) {
  try {
    JSON.stringify(data);
    return true;
  } catch {
    return false;
  }
}

if (validateJSON(data)) {
  await fs.writeFile("data.json", JSON.stringify(data, null, 2));
}

// ✅ 8. Clean up temporary files
try {
  await fs.writeFile("temp.txt", "data");
  // Process temp file...
} finally {
  await fs.unlink("temp.txt").catch(() => {});
}

// ✅ 9. Set appropriate permissions
await fs.writeFile("sensitive.txt", secrets, { mode: 0o600 });

// ✅ 10. Use proper encoding
await fs.writeFile("file.txt", "content", "utf8");
```

### Key Takeaways

- ✅ Use `fs.writeFile()` with promises/async-await for most cases
- ✅ Use `fs.createWriteStream()` for large files (memory efficient)
- ✅ Use `fs.appendFile()` to add content without overwriting
- ✅ Always handle errors with try/catch
- ✅ Avoid `writeFileSync()` in production servers (blocks event loop)
- ✅ Create directories with `fs.mkdir()` before writing
- ✅ Use atomic writes for critical files (write to temp, then rename)
- ✅ Specify encoding ('utf8') for text files
- ✅ Use path.join() for cross-platform file paths
- ✅ Set appropriate file permissions for sensitive data
- ✅ Validate data before writing (especially JSON)
- ✅ Clean up temporary files in finally blocks

### Further Reading

- [Node.js fs module documentation](https://nodejs.org/api/fs.html)
- [fs.writeFile()](https://nodejs.org/api/fs.html#fswritefilefile-data-options-callback)
- [fs.writeFileSync()](https://nodejs.org/api/fs.html#fswritefilesyncfile-data-options)
- [fs.appendFile()](https://nodejs.org/api/fs.html#fsappendfilepath-data-options-callback)
- [fs.createWriteStream()](https://nodejs.org/api/fs.html#fscreatewritestreampath-options)
- [File System Flags](https://nodejs.org/api/fs.html#file-system-flags)
