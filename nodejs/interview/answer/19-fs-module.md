# What is the `fs` module?

## Short Answer

The **`fs` (File System) module** is a built-in Node.js module that provides an API for interacting with the file system. It allows you to:

- **Read** files
- **Write** files
- **Delete** files
- **Rename/move** files
- **Create/delete** directories
- **Watch** file changes
- **Check** file permissions and metadata

```javascript
const fs = require("fs");

// Read file
const data = fs.readFileSync("file.txt", "utf8");

// Write file
fs.writeFileSync("output.txt", "Hello World");

// Delete file
fs.unlinkSync("temp.txt");

// Create directory
fs.mkdirSync("new-folder");
```

**Three versions available:**

1. **Callback-based** - `fs.readFile()`
2. **Synchronous** - `fs.readFileSync()`
3. **Promise-based** - `fs.promises.readFile()`

## Detailed Answer

### Overview

The `fs` module provides file system operations modeled on standard POSIX functions.

```javascript
// CommonJS
const fs = require("fs");

// ES Modules
import fs from "fs";

// Promises API (recommended)
const fs = require("fs").promises;
// or
import { promises as fs } from "fs";
```

### Core Capabilities

#### 1. File Operations

**Reading Files**

```javascript
const fs = require("fs");

// Synchronous (blocking)
const data = fs.readFileSync("file.txt", "utf8");

// Asynchronous (callback)
fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) throw err;
  console.log(data);
});

// Promises (async/await)
const fs = require("fs").promises;
const data = await fs.readFile("file.txt", "utf8");
```

**Writing Files**

```javascript
const fs = require("fs").promises;

// Write (overwrite)
await fs.writeFile("file.txt", "New content");

// Append
await fs.appendFile("file.txt", "\nMore content");

// Write JSON
const data = { name: "John", age: 30 };
await fs.writeFile("data.json", JSON.stringify(data, null, 2));
```

**Deleting Files**

```javascript
const fs = require("fs").promises;

// Delete file
await fs.unlink("file.txt");

// Delete if exists
try {
  await fs.unlink("file.txt");
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}
```

**Renaming/Moving Files**

```javascript
const fs = require("fs").promises;

// Rename file
await fs.rename("old-name.txt", "new-name.txt");

// Move file
await fs.rename("file.txt", "subfolder/file.txt");
```

**Copying Files**

```javascript
const fs = require("fs").promises;

// Copy file
await fs.copyFile("source.txt", "destination.txt");

// Copy with flag
await fs.copyFile("source.txt", "dest.txt", fs.constants.COPYFILE_EXCL);
// COPYFILE_EXCL: Fail if destination exists
```

#### 2. Directory Operations

**Creating Directories**

```javascript
const fs = require("fs").promises;

// Create single directory
await fs.mkdir("new-folder");

// Create nested directories (recursive)
await fs.mkdir("path/to/nested/folder", { recursive: true });

// Create with permissions
await fs.mkdir("secure-folder", { mode: 0o700 });
```

**Reading Directories**

```javascript
const fs = require("fs").promises;

// Read directory (returns array of filenames)
const files = await fs.readdir(".");
console.log(files); // ['file1.txt', 'file2.txt', 'folder']

// Read with file types
const entries = await fs.readdir(".", { withFileTypes: true });
entries.forEach((entry) => {
  console.log(entry.name, entry.isFile() ? "file" : "directory");
});
```

**Removing Directories**

```javascript
const fs = require("fs").promises;

// Remove empty directory
await fs.rmdir("empty-folder");

// Remove directory with contents (recursive)
await fs.rm("folder", { recursive: true, force: true });

// Or use deprecated recursive rmdir
await fs.rmdir("folder", { recursive: true });
```

#### 3. File Information and Metadata

**Getting File Stats**

```javascript
const fs = require("fs").promises;

const stats = await fs.stat("file.txt");

console.log("File size:", stats.size, "bytes");
console.log("Is file:", stats.isFile());
console.log("Is directory:", stats.isDirectory());
console.log("Created:", stats.birthtime);
console.log("Modified:", stats.mtime);
console.log("Accessed:", stats.atime);
console.log("Permissions:", stats.mode);
```

**Checking File Existence**

```javascript
const fs = require("fs").promises;

// Method 1: Using access()
try {
  await fs.access("file.txt", fs.constants.F_OK);
  console.log("File exists");
} catch {
  console.log("File does not exist");
}

// Method 2: Using stat()
try {
  await fs.stat("file.txt");
  console.log("File exists");
} catch (err) {
  if (err.code === "ENOENT") {
    console.log("File does not exist");
  }
}
```

**Checking Permissions**

```javascript
const fs = require("fs").promises;

// Check if file is readable
try {
  await fs.access("file.txt", fs.constants.R_OK);
  console.log("File is readable");
} catch {
  console.log("File is not readable");
}

// Check if file is writable
try {
  await fs.access("file.txt", fs.constants.W_OK);
  console.log("File is writable");
} catch {
  console.log("File is not writable");
}

// Check if file is executable
try {
  await fs.access("script.sh", fs.constants.X_OK);
  console.log("File is executable");
} catch {
  console.log("File is not executable");
}
```

**Changing Permissions**

```javascript
const fs = require("fs").promises;

// Change file permissions
await fs.chmod("file.txt", 0o644); // rw-r--r--
await fs.chmod("script.sh", 0o755); // rwxr-xr-x

// Change ownership (requires appropriate permissions)
await fs.chown("file.txt", uid, gid);
```

#### 4. Watching Files and Directories

**Watch for Changes**

```javascript
const fs = require("fs");

// Watch file
const watcher = fs.watch("file.txt", (eventType, filename) => {
  console.log(`Event: ${eventType}`);
  console.log(`File: ${filename}`);
});

// Watch directory
const dirWatcher = fs.watch(".", { recursive: true }, (eventType, filename) => {
  console.log(`${filename} was ${eventType}`);
});

// Stop watching
watcher.close();
```

**Using watchFile (polling-based)**

```javascript
const fs = require("fs");

fs.watchFile("file.txt", (curr, prev) => {
  console.log("File was modified");
  console.log("Previous size:", prev.size);
  console.log("Current size:", curr.size);
});

// Stop watching
fs.unwatchFile("file.txt");
```

#### 5. Streams

**Read Streams**

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
  console.log("Finished reading");
});

readStream.on("error", (err) => {
  console.error("Error:", err);
});
```

**Write Streams**

```javascript
const fs = require("fs");

const writeStream = fs.createWriteStream("output.txt", {
  encoding: "utf8",
  flags: "w", // 'w' = write, 'a' = append
});

writeStream.write("Line 1\n");
writeStream.write("Line 2\n");
writeStream.end("Last line\n");

writeStream.on("finish", () => {
  console.log("Finished writing");
});
```

**Piping Streams**

```javascript
const fs = require("fs");

// Copy file using streams
const readStream = fs.createReadStream("source.txt");
const writeStream = fs.createWriteStream("destination.txt");

readStream.pipe(writeStream);

writeStream.on("finish", () => {
  console.log("File copied");
});
```

### API Versions Comparison

#### Callback API (Original)

```javascript
const fs = require("fs");

fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log(data);
});
```

#### Synchronous API

```javascript
const fs = require("fs");

try {
  const data = fs.readFileSync("file.txt", "utf8");
  console.log(data);
} catch (err) {
  console.error("Error:", err);
}
```

#### Promises API (Modern, Recommended)

```javascript
const fs = require("fs").promises;

async function readMyFile() {
  try {
    const data = await fs.readFile("file.txt", "utf8");
    console.log(data);
  } catch (err) {
    console.error("Error:", err);
  }
}

readMyFile();
```

### Complete Method List

#### File Methods

```javascript
const fs = require("fs").promises;

// Reading
fs.readFile(path, encoding); // Read entire file
fs.open(path, flags); // Open file descriptor
fs.read(fd, buffer, offset, length); // Read from file descriptor
fs.readFileSync(path, encoding); // Sync read

// Writing
fs.writeFile(path, data); // Write (overwrite)
fs.appendFile(path, data); // Append to file
fs.write(fd, buffer); // Write to file descriptor
fs.writeFileSync(path, data); // Sync write

// Deleting
fs.unlink(path); // Delete file
fs.unlinkSync(path); // Sync delete

// Renaming/Moving
fs.rename(oldPath, newPath); // Rename/move file
fs.renameSync(oldPath, newPath); // Sync rename

// Copying
fs.copyFile(src, dest); // Copy file
fs.copyFileSync(src, dest); // Sync copy

// Truncating
fs.truncate(path, length); // Truncate to length
fs.ftruncate(fd, length); // Truncate file descriptor
```

#### Directory Methods

```javascript
const fs = require("fs").promises;

// Creating
fs.mkdir(path, options); // Create directory
fs.mkdtemp(prefix); // Create temp directory

// Reading
fs.readdir(path); // Read directory contents
fs.opendir(path); // Open directory for iteration

// Removing
fs.rmdir(path); // Remove empty directory
fs.rm(path, { recursive: true }); // Remove directory recursively
```

#### Metadata Methods

```javascript
const fs = require("fs").promises;

// File info
fs.stat(path); // Get file stats
fs.lstat(path); // Get stats (don't follow symlinks)
fs.fstat(fd); // Get stats from file descriptor

// Permissions
fs.access(path, mode); // Check permissions
fs.chmod(path, mode); // Change permissions
fs.chown(path, uid, gid); // Change ownership

// Timestamps
fs.utimes(path, atime, mtime); // Change timestamps

// Links
fs.link(existingPath, newPath); // Create hard link
fs.symlink(target, path); // Create symbolic link
fs.readlink(path); // Read symbolic link
fs.realpath(path); // Resolve to absolute path
```

#### Stream Methods

```javascript
const fs = require("fs");

fs.createReadStream(path, options); // Create read stream
fs.createWriteStream(path, options); // Create write stream
```

#### Watch Methods

```javascript
const fs = require("fs");

fs.watch(path, options, callback); // Watch file/directory
fs.watchFile(path, options, callback); // Watch file (polling)
fs.unwatchFile(path); // Stop watching file
```

### Real-World Examples

#### Example 1: File Manager

```javascript
const fs = require("fs").promises;
const path = require("path");

class FileManager {
  async listFiles(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    const files = [];
    const folders = [];

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      const stats = await fs.stat(fullPath);

      const item = {
        name: entry.name,
        path: fullPath,
        size: stats.size,
        modified: stats.mtime,
        isDirectory: entry.isDirectory(),
      };

      if (entry.isDirectory()) {
        folders.push(item);
      } else {
        files.push(item);
      }
    }

    return { files, folders };
  }

  async searchFiles(directory, pattern) {
    const results = [];
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        const subResults = await this.searchFiles(fullPath, pattern);
        results.push(...subResults);
      } else if (entry.name.includes(pattern)) {
        results.push(fullPath);
      }
    }

    return results;
  }

  async deleteOldFiles(directory, daysOld) {
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;

    const entries = await fs.readdir(directory);

    for (const entry of entries) {
      const fullPath = path.join(directory, entry);
      const stats = await fs.stat(fullPath);

      if (stats.isFile() && now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(fullPath);
        console.log(`Deleted old file: ${entry}`);
      }
    }
  }
}

// Usage
const manager = new FileManager();
const { files, folders } = await manager.listFiles("./documents");
const results = await manager.searchFiles("./documents", ".pdf");
await manager.deleteOldFiles("./temp", 30);
```

#### Example 2: Backup System

```javascript
const fs = require("fs").promises;
const path = require("path");

async function backupDirectory(sourceDir, backupDir) {
  // Create backup directory
  await fs.mkdir(backupDir, { recursive: true });

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const backupPath = path.join(backupDir, entry.name);

    if (entry.isDirectory()) {
      await backupDirectory(sourcePath, backupPath);
    } else {
      await fs.copyFile(sourcePath, backupPath);
      console.log(`Backed up: ${entry.name}`);
    }
  }
}

// Usage
const timestamp = new Date().toISOString().replace(/:/g, "-");
await backupDirectory("./data", `./backups/backup-${timestamp}`);
```

#### Example 3: Log Rotator

```javascript
const fs = require("fs").promises;
const path = require("path");

class LogRotator {
  constructor(logFile, maxSize = 10 * 1024 * 1024) {
    // 10MB
    this.logFile = logFile;
    this.maxSize = maxSize;
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    // Check file size
    try {
      const stats = await fs.stat(this.logFile);

      if (stats.size > this.maxSize) {
        await this.rotate();
      }
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }

    await fs.appendFile(this.logFile, logEntry);
  }

  async rotate() {
    const timestamp = Date.now();
    const ext = path.extname(this.logFile);
    const basename = path.basename(this.logFile, ext);
    const dir = path.dirname(this.logFile);
    const rotatedFile = path.join(dir, `${basename}-${timestamp}${ext}`);

    await fs.rename(this.logFile, rotatedFile);
    console.log(`Rotated log to: ${rotatedFile}`);
  }
}

// Usage
const logger = new LogRotator("./app.log", 10 * 1024 * 1024);
await logger.log("Application started");
```

#### Example 4: File Sync

```javascript
const fs = require("fs").promises;
const path = require("path");

async function syncDirectories(sourceDir, targetDir) {
  // Create target directory
  await fs.mkdir(targetDir, { recursive: true });

  const sourceFiles = await fs.readdir(sourceDir);
  const targetFiles = await fs.readdir(targetDir);

  // Copy new or modified files
  for (const file of sourceFiles) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    const sourceStats = await fs.stat(sourcePath);

    if (sourceStats.isFile()) {
      let shouldCopy = false;

      try {
        const targetStats = await fs.stat(targetPath);
        shouldCopy = sourceStats.mtime > targetStats.mtime;
      } catch {
        shouldCopy = true; // File doesn't exist in target
      }

      if (shouldCopy) {
        await fs.copyFile(sourcePath, targetPath);
        console.log(`Synced: ${file}`);
      }
    }
  }

  // Delete files that don't exist in source
  for (const file of targetFiles) {
    if (!sourceFiles.includes(file)) {
      const targetPath = path.join(targetDir, file);
      await fs.unlink(targetPath);
      console.log(`Deleted: ${file}`);
    }
  }
}

// Usage
await syncDirectories("./source", "./target");
```

#### Example 5: Temp File Manager

```javascript
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

class TempFileManager {
  constructor() {
    this.tempFiles = [];
  }

  async create(prefix = "temp-") {
    const tempDir = os.tmpdir();
    const tempFile = path.join(
      tempDir,
      `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );

    await fs.writeFile(tempFile, "");
    this.tempFiles.push(tempFile);

    return tempFile;
  }

  async cleanup() {
    for (const file of this.tempFiles) {
      try {
        await fs.unlink(file);
        console.log(`Deleted temp file: ${file}`);
      } catch (err) {
        console.error(`Failed to delete ${file}:`, err);
      }
    }

    this.tempFiles = [];
  }
}

// Usage
const tempManager = new TempFileManager();

try {
  const tempFile = await tempManager.create("data-");
  await fs.writeFile(tempFile, "Temporary data");

  // Use temp file...
} finally {
  await tempManager.cleanup();
}
```

### Error Codes

```javascript
// Common fs error codes
const errorCodes = {
  ENOENT: "File or directory does not exist",
  EEXIST: "File or directory already exists",
  EACCES: "Permission denied",
  EISDIR: "Path is a directory",
  ENOTDIR: "Path is not a directory",
  EMFILE: "Too many open files",
  ENOSPC: "No space left on device",
  EROFS: "Read-only file system",
  ENOTEMPTY: "Directory not empty",
};

// Handling specific errors
try {
  await fs.readFile("file.txt");
} catch (err) {
  switch (err.code) {
    case "ENOENT":
      console.error("File not found");
      break;
    case "EACCES":
      console.error("Permission denied");
      break;
    default:
      console.error("Error:", err.message);
  }
}
```

### Best Practices

```javascript
const fs = require("fs").promises;
const path = require("path");

// ✅ 1. Use promises API with async/await
async function goodRead() {
  const data = await fs.readFile("file.txt", "utf8");
  return data;
}

// ✅ 2. Always handle errors
try {
  await fs.readFile("file.txt");
} catch (err) {
  console.error("Error:", err);
}

// ✅ 3. Close file descriptors
const fd = await fs.open("file.txt", "r");
try {
  // Use file descriptor
} finally {
  await fd.close();
}

// ✅ 4. Use streams for large files
const stream = fs.createReadStream("large-file.txt");
// Process in chunks

// ✅ 5. Check existence before operations
try {
  await fs.access("file.txt");
  await fs.unlink("file.txt");
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

// ✅ 6. Use recursive: true for mkdir
await fs.mkdir("path/to/nested/dir", { recursive: true });

// ✅ 7. Validate user input paths
function validatePath(userPath) {
  const normalized = path.normalize(userPath);
  const absolute = path.resolve(normalized);
  const baseDir = path.resolve(__dirname, "uploads");

  if (!absolute.startsWith(baseDir)) {
    throw new Error("Invalid path");
  }

  return absolute;
}

// ✅ 8. Set appropriate permissions
await fs.writeFile("sensitive.txt", data, { mode: 0o600 });

// ✅ 9. Clean up temporary files
try {
  // Use temp file
} finally {
  await fs.unlink(tempFile).catch(() => {});
}

// ✅ 10. Use atomic operations
const tempFile = `${targetFile}.tmp`;
await fs.writeFile(tempFile, data);
await fs.rename(tempFile, targetFile); // Atomic
```

### Key Takeaways

- ✅ `fs` module provides file system operations in Node.js
- ✅ Three APIs: callback, synchronous, promises (use promises!)
- ✅ Main operations: read, write, delete, rename, copy files
- ✅ Directory operations: create, read, remove directories
- ✅ Metadata: get file stats, check permissions, change permissions
- ✅ Streams for large files (memory efficient)
- ✅ Watch files/directories for changes
- ✅ Always handle errors (ENOENT, EACCES, etc.)
- ✅ Use `fs.promises` with async/await for clean code
- ✅ Avoid synchronous methods in production (blocks event loop)
- ✅ Close file descriptors when done
- ✅ Validate user-provided paths for security
- ✅ Use `path` module with `fs` for cross-platform paths

### Further Reading

- [Node.js fs module documentation](https://nodejs.org/api/fs.html)
- [File System Flags](https://nodejs.org/api/fs.html#file-system-flags)
- [fs Promises API](https://nodejs.org/api/fs.html#promises-api)
- [File Streams](https://nodejs.org/api/stream.html)
- [Working with File Descriptors](https://nodejs.org/api/fs.html#file-descriptors)
