# What is libuv and how does it work?

libuv is a multi-platform C library that provides asynchronous I/O operations for Node.js. It's the foundation that enables Node.js to be non-blocking and event-driven, handling file system operations, networking, child processes, and other system-level tasks asynchronously.

## Overview of libuv

libuv was originally developed for Node.js but has since become a standalone library used by other projects. It abstracts platform-specific APIs and provides a consistent interface for asynchronous operations across different operating systems (Windows, macOS, Linux, etc.).

### Key Responsibilities of libuv

```javascript
// libuv handles these core functionalities for Node.js
const libuvResponsibilities = {
  eventLoop: "Manages the main event loop that drives Node.js",
  fileSystem: "Asynchronous file operations (read, write, stat, etc.)",
  networking: "TCP and UDP sockets, DNS resolution",
  childProcesses: "Process spawning and IPC (Inter-Process Communication)",
  threading: "Thread pool for CPU-intensive operations",
  signalHandling: "Unix signal handling",
  highResolutionTime: "High-resolution time and timers",
  polling: "File descriptor polling (epoll, kqueue, select)",
  asyncHandles: "Async handles for various operations",
};

console.log("libuv Core Components:", libuvResponsibilities);
```

## libuv Architecture

### Event Loop Implementation

```javascript
// Conceptual representation of libuv's event loop phases
class LibuvEventLoop {
  constructor() {
    this.timers = new Set(); // Timer handles
    this.pending = new Set(); // Pending I/O callbacks
    this.idle = new Set(); // Idle handles
    this.prepare = new Set(); // Prepare handles
    this.poll = new Set(); // I/O polling
    this.check = new Set(); // Check handles (setImmediate)
    this.close = new Set(); // Close callbacks

    this.threadPool = new ThreadPool(); // libuv thread pool
    this.isRunning = false;
  }

  // Main event loop cycle (simplified representation)
  run() {
    this.isRunning = true;

    while (this.isRunning && this.hasActiveHandles()) {
      this.updateTime();

      // Phase 1: Timers
      this.processTimers();

      // Phase 2: Pending callbacks
      this.processPendingCallbacks();

      // Phase 3: Idle, prepare
      this.processIdleAndPrepare();

      // Phase 4: Poll for I/O
      const timeout = this.calculateTimeout();
      this.poll(timeout);

      // Phase 5: Check handles
      this.processCheck();

      // Phase 6: Close callbacks
      this.processCloseCallbacks();
    }
  }

  updateTime() {
    // Update the event loop's time
    this.now = Date.now();
  }

  processTimers() {
    console.log("Processing timer handles...");
    // Process expired timers (setTimeout, setInterval)
    for (const timer of this.timers) {
      if (timer.isExpired(this.now)) {
        timer.execute();
        if (!timer.repeat) {
          this.timers.delete(timer);
        }
      }
    }
  }

  processPendingCallbacks() {
    console.log("Processing pending I/O callbacks...");
    // Process I/O callbacks that were deferred
    const pending = Array.from(this.pending);
    this.pending.clear();

    pending.forEach((callback) => callback.execute());
  }

  processIdleAndPrepare() {
    // Internal libuv housekeeping
    this.idle.forEach((handle) => handle.execute());
    this.prepare.forEach((handle) => handle.execute());
  }

  poll(timeout) {
    console.log(`Polling for I/O events (timeout: ${timeout}ms)...`);

    // This is where libuv uses platform-specific APIs:
    // - epoll on Linux
    // - kqueue on macOS/BSD
    // - IOCP on Windows

    if (this.hasReadyIO()) {
      // Process ready I/O callbacks immediately
      this.processReadyIO();
    } else if (timeout > 0) {
      // Block waiting for I/O events
      this.blockForIO(timeout);
    }
  }

  processCheck() {
    console.log("Processing check handles (setImmediate)...");
    // Process setImmediate callbacks
    const checks = Array.from(this.check);
    this.check.clear();

    checks.forEach((handle) => handle.execute());
  }

  processCloseCallbacks() {
    console.log("Processing close callbacks...");
    // Process close event callbacks
    const closes = Array.from(this.close);
    this.close.clear();

    closes.forEach((handle) => handle.execute());
  }

  hasActiveHandles() {
    return (
      this.timers.size > 0 ||
      this.pending.size > 0 ||
      this.check.size > 0 ||
      this.hasActiveIO()
    );
  }

  calculateTimeout() {
    // Calculate how long to block in poll phase
    if (this.check.size > 0) return 0; // Don't block if setImmediate pending

    const nextTimer = this.getNextTimerTimeout();
    return nextTimer || -1; // -1 means block indefinitely
  }
}
```

### Thread Pool

libuv uses a thread pool for operations that cannot be handled asynchronously by the operating system.

```javascript
// Thread pool operations in libuv
class ThreadPoolDemo {
  constructor() {
    this.poolSize = process.env.UV_THREADPOOL_SIZE || 4;
    console.log(`Thread pool size: ${this.poolSize}`);
  }

  demonstrateThreadPoolOperations() {
    const fs = require("fs");
    const crypto = require("crypto");
    const dns = require("dns");

    console.log("=== THREAD POOL OPERATIONS ===");

    // File system operations (use thread pool)
    console.log("1. File system operations...");
    const startTime = process.hrtime.bigint();

    // These will compete for thread pool resources
    for (let i = 0; i < 8; i++) {
      fs.readFile(__filename, (err, data) => {
        const elapsed = Number(process.hrtime.bigint() - startTime) / 1000000;
        console.log(
          `File read ${i + 1} completed after ${elapsed.toFixed(2)}ms`
        );
      });
    }

    // CPU-intensive crypto operations (use thread pool)
    console.log("2. Crypto operations...");
    for (let i = 0; i < 4; i++) {
      crypto.pbkdf2("password", "salt", 100000, 64, "sha512", (err, key) => {
        const elapsed = Number(process.hrtime.bigint() - startTime) / 1000000;
        console.log(`Crypto ${i + 1} completed after ${elapsed.toFixed(2)}ms`);
      });
    }

    // DNS lookups (may use thread pool depending on system)
    console.log("3. DNS lookups...");
    const domains = [
      "google.com",
      "github.com",
      "stackoverflow.com",
      "nodejs.org",
    ];

    domains.forEach((domain, index) => {
      dns.lookup(domain, (err, address) => {
        const elapsed = Number(process.hrtime.bigint() - startTime) / 1000000;
        if (err) {
          console.log(
            `DNS lookup ${index + 1} (${domain}) failed: ${err.message}`
          );
        } else {
          console.log(
            `DNS lookup ${
              index + 1
            } (${domain}) -> ${address} after ${elapsed.toFixed(2)}ms`
          );
        }
      });
    });
  }

  demonstrateThreadPoolSaturation() {
    console.log("\n=== THREAD POOL SATURATION ===");

    const crypto = require("crypto");
    const startTime = Date.now();

    // Saturate thread pool with CPU-intensive tasks
    for (let i = 0; i < 12; i++) {
      // More than default pool size
      crypto.pbkdf2("password", "salt", 100000, 64, "sha512", (err, key) => {
        const elapsed = Date.now() - startTime;
        console.log(`Task ${i + 1} completed after ${elapsed}ms`);
      });
    }

    // This will be delayed due to thread pool saturation
    setTimeout(() => {
      console.log("Timer executed (should be immediate but may be delayed)");
    }, 0);
  }

  demonstrateNetworkVsFileSystem() {
    console.log("\n=== NETWORK vs FILE SYSTEM ===");

    const http = require("http");
    const fs = require("fs");
    const startTime = Date.now();

    // Network operations (don't use thread pool - use system async I/O)
    for (let i = 0; i < 8; i++) {
      const req = http.get("http://httpbin.org/delay/1", (res) => {
        const elapsed = Date.now() - startTime;
        console.log(`HTTP request ${i + 1} completed after ${elapsed}ms`);
        res.resume(); // Consume response
      });

      req.on("error", (err) => {
        console.log(`HTTP request ${i + 1} failed: ${err.message}`);
      });
    }

    // File operations (use thread pool)
    for (let i = 0; i < 4; i++) {
      fs.readFile(__filename, (err, data) => {
        const elapsed = Date.now() - startTime;
        console.log(`File read ${i + 1} completed after ${elapsed}ms`);
      });
    }
  }
}

// Example usage (uncomment to run)
// const demo = new ThreadPoolDemo();
// demo.demonstrateThreadPoolOperations();
// setTimeout(() => demo.demonstrateThreadPoolSaturation(), 3000);
// setTimeout(() => demo.demonstrateNetworkVsFileSystem(), 6000);
```

### Platform-Specific I/O Mechanisms

libuv abstracts different I/O mechanisms across platforms:

```javascript
// Platform-specific I/O mechanisms that libuv uses
class PlatformIODemo {
  constructor() {
    this.platform = process.platform;
    this.ioMechanism = this.getIOMethod();
  }

  getIOMethod() {
    const mechanisms = {
      linux: "epoll - scalable I/O event notification",
      darwin: "kqueue - kernel event notification",
      freebsd: "kqueue - kernel event notification",
      win32: "IOCP - I/O Completion Ports",
      sunos: "event ports",
      aix: "pollset",
    };

    return mechanisms[this.platform] || "select (fallback)";
  }

  demonstrateIOScaling() {
    console.log(`=== I/O SCALING ON ${this.platform.toUpperCase()} ===`);
    console.log(`Using: ${this.ioMechanism}`);

    const net = require("net");
    const connections = [];
    const maxConnections = 1000;

    // Create a server
    const server = net.createServer((socket) => {
      socket.on("data", (data) => {
        socket.write(`Echo: ${data}`);
      });

      socket.on("error", (err) => {
        console.error("Socket error:", err.message);
      });
    });

    server.listen(0, () => {
      const port = server.address().port;
      console.log(`Server listening on port ${port}`);

      const startTime = Date.now();
      let connectedCount = 0;

      // Create many concurrent connections
      for (let i = 0; i < maxConnections; i++) {
        const client = net.createConnection(port, () => {
          connectedCount++;

          if (connectedCount % 100 === 0) {
            console.log(`Connected: ${connectedCount}/${maxConnections}`);
          }

          if (connectedCount === maxConnections) {
            const elapsed = Date.now() - startTime;
            console.log(
              `All ${maxConnections} connections established in ${elapsed}ms`
            );
            console.log(
              `Platform I/O mechanism (${this.ioMechanism}) handled ${maxConnections} concurrent connections`
            );

            // Cleanup
            setTimeout(() => {
              connections.forEach((conn) => conn.end());
              server.close();
            }, 1000);
          }
        });

        client.on("error", (err) => {
          console.error(`Connection ${i} error:`, err.message);
        });

        connections.push(client);
      }
    });

    server.on("error", (err) => {
      console.error("Server error:", err);
    });
  }

  demonstrateEventNotification() {
    console.log("\n=== EVENT NOTIFICATION MECHANISM ===");

    const fs = require("fs");
    const path = require("path");

    // File watching (uses platform-specific mechanisms)
    const testFile = path.join(__dirname, "test-watch.txt");

    // Create test file
    fs.writeFile(testFile, "Initial content", (err) => {
      if (err) {
        console.error("Failed to create test file:", err);
        return;
      }

      console.log("Created test file for watching");

      // Watch file changes
      const watcher = fs.watch(testFile, (eventType, filename) => {
        console.log(`File event: ${eventType} on ${filename}`);
        console.log(`Detected by platform mechanism: ${this.ioMechanism}`);
      });

      // Make changes to trigger events
      setTimeout(() => {
        fs.appendFile(testFile, "\nModified content", (err) => {
          if (err) console.error("Failed to modify file:", err);
        });
      }, 1000);

      setTimeout(() => {
        fs.unlink(testFile, (err) => {
          if (err) console.error("Failed to delete file:", err);
        });
        watcher.close();
      }, 2000);
    });
  }
}

// Example usage (uncomment to run)
// const ioDemo = new PlatformIODemo();
// ioDemo.demonstrateIOScaling();
// setTimeout(() => ioDemo.demonstrateEventNotification(), 5000);
```

## libuv Handles and Requests

libuv uses handles and requests to manage asynchronous operations:

```javascript
// Understanding libuv handles and requests
class LibuvHandlesDemo {
  constructor() {
    this.activeHandles = new Set();
    this.activeRequests = new Set();
  }

  demonstrateHandles() {
    console.log("=== LIBUV HANDLES ===");

    const net = require("net");
    const fs = require("fs");

    // TCP Handle
    const server = net.createServer();
    server.listen(0, () => {
      console.log("TCP server handle created (persistent)");
      this.logActiveHandles();
    });

    // Timer Handle
    const timer = setInterval(() => {
      console.log("Timer handle executed");
    }, 1000);

    // File System Watcher Handle
    const watcher = fs.watch(__filename, (eventType) => {
      console.log(`File watcher handle: ${eventType}`);
    });

    setTimeout(() => {
      console.log("Cleaning up handles...");
      clearInterval(timer);
      watcher.close();
      server.close(() => {
        console.log("All handles closed");
        this.logActiveHandles();
      });
    }, 5000);
  }

  demonstrateRequests() {
    console.log("\n=== LIBUV REQUESTS ===");

    const fs = require("fs");
    const dns = require("dns");

    console.log("Creating multiple requests...");

    // File system requests
    for (let i = 0; i < 3; i++) {
      fs.readFile(__filename, (err, data) => {
        console.log(`File read request ${i + 1} completed`);
        this.logActiveHandles();
      });
    }

    // DNS requests
    dns.lookup("google.com", (err, address) => {
      console.log(`DNS request completed: ${address}`);
    });

    dns.lookup("github.com", (err, address) => {
      console.log(`DNS request completed: ${address}`);
    });
  }

  demonstrateHandleTypes() {
    console.log("\n=== HANDLE TYPES ===");

    const handleTypes = {
      UV_TCP: "TCP socket handles",
      UV_UDP: "UDP socket handles",
      UV_PIPE: "Named pipe handles",
      UV_TTY: "Terminal handles",
      UV_TIMER: "Timer handles",
      UV_PREPARE: "Prepare handles",
      UV_CHECK: "Check handles (setImmediate)",
      UV_IDLE: "Idle handles",
      UV_ASYNC: "Async handles",
      UV_POLL: "Poll handles",
      UV_SIGNAL: "Signal handles",
      UV_PROCESS: "Child process handles",
      UV_FS_EVENT: "File system event handles",
      UV_FS_POLL: "File system polling handles",
    };

    console.log("libuv Handle Types:");
    Object.entries(handleTypes).forEach(([type, description]) => {
      console.log(`  ${type}: ${description}`);
    });
  }

  logActiveHandles() {
    // Note: These are internal Node.js functions and may not be available in all versions
    try {
      const handles = process._getActiveHandles();
      const requests = process._getActiveRequests();

      console.log(`Active handles: ${handles.length}`);
      console.log(`Active requests: ${requests.length}`);

      if (handles.length > 0) {
        handles.forEach((handle, index) => {
          console.log(`  Handle ${index + 1}: ${handle.constructor.name}`);
        });
      }
    } catch (error) {
      console.log("Cannot access internal handle information");
    }
  }
}

// Example usage (uncomment to run)
// const handlesDemo = new LibuvHandlesDemo();
// handlesDemo.demonstrateHandles();
// setTimeout(() => handlesDemo.demonstrateRequests(), 2000);
// setTimeout(() => handlesDemo.demonstrateHandleTypes(), 4000);
```

## File System Operations

```javascript
// Demonstrating how libuv handles file system operations
class FileSystemDemo {
  constructor() {
    this.operations = [];
  }

  demonstrateAsyncFileOperations() {
    console.log("=== ASYNC FILE OPERATIONS ===");

    const fs = require("fs");
    const path = require("path");

    const testDir = path.join(__dirname, "test-fs");
    const testFile = path.join(testDir, "test.txt");

    // Chain of async operations
    console.log("1. Creating directory...");
    fs.mkdir(testDir, { recursive: true }, (err) => {
      if (err && err.code !== "EEXIST") {
        console.error("Failed to create directory:", err);
        return;
      }

      console.log("2. Writing file...");
      fs.writeFile(testFile, "Hello libuv!", (err) => {
        if (err) {
          console.error("Failed to write file:", err);
          return;
        }

        console.log("3. Reading file...");
        fs.readFile(testFile, "utf8", (err, data) => {
          if (err) {
            console.error("Failed to read file:", err);
            return;
          }

          console.log("4. File content:", data);

          console.log("5. Getting file stats...");
          fs.stat(testFile, (err, stats) => {
            if (err) {
              console.error("Failed to get stats:", err);
              return;
            }

            console.log("6. File stats:", {
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              isFile: stats.isFile(),
            });

            console.log("7. Deleting file...");
            fs.unlink(testFile, (err) => {
              if (err) {
                console.error("Failed to delete file:", err);
                return;
              }

              console.log("8. Removing directory...");
              fs.rmdir(testDir, (err) => {
                if (err) {
                  console.error("Failed to remove directory:", err);
                  return;
                }

                console.log("All file operations completed successfully!");
              });
            });
          });
        });
      });
    });
  }

  demonstrateStreamOperations() {
    console.log("\n=== STREAM OPERATIONS ===");

    const fs = require("fs");
    const path = require("path");

    const inputFile = path.join(__dirname, "input.txt");
    const outputFile = path.join(__dirname, "output.txt");

    // Create a large input file
    const largeContent = "A".repeat(1024 * 1024); // 1MB of 'A's

    fs.writeFile(inputFile, largeContent, (err) => {
      if (err) {
        console.error("Failed to create input file:", err);
        return;
      }

      console.log("Created 1MB input file");

      // Stream copy operation
      const readStream = fs.createReadStream(inputFile, {
        highWaterMark: 16 * 1024, // 16KB chunks
      });

      const writeStream = fs.createWriteStream(outputFile);

      let bytesRead = 0;
      let bytesWritten = 0;

      readStream.on("data", (chunk) => {
        bytesRead += chunk.length;
        console.log(`Read chunk: ${chunk.length} bytes (total: ${bytesRead})`);
      });

      writeStream.on("write", () => {
        bytesWritten += arguments[0].length;
      });

      readStream.on("end", () => {
        console.log("Reading completed");
      });

      writeStream.on("finish", () => {
        console.log("Writing completed");
        console.log(`Copied ${bytesRead} bytes`);

        // Cleanup
        fs.unlink(inputFile, () => {});
        fs.unlink(outputFile, () => {});
      });

      readStream.on("error", (err) => {
        console.error("Read error:", err);
      });

      writeStream.on("error", (err) => {
        console.error("Write error:", err);
      });

      // Pipe the streams
      readStream.pipe(writeStream);
    });
  }

  demonstrateWatchingOperations() {
    console.log("\n=== FILE WATCHING ===");

    const fs = require("fs");
    const path = require("path");

    const watchFile = path.join(__dirname, "watch-test.txt");

    // Initial file creation
    fs.writeFile(watchFile, "Initial content", (err) => {
      if (err) {
        console.error("Failed to create watch file:", err);
        return;
      }

      console.log("Created file to watch");

      // Start watching
      const watcher = fs.watch(
        watchFile,
        { persistent: false },
        (eventType, filename) => {
          console.log(`File event detected:`);
          console.log(`  Event type: ${eventType}`);
          console.log(`  Filename: ${filename}`);
          console.log(
            `  Platform mechanism: ${
              process.platform === "linux"
                ? "inotify"
                : process.platform === "darwin"
                ? "FSEvents"
                : "ReadDirectoryChangesW"
            }`
          );
        }
      );

      // Make some changes
      setTimeout(() => {
        console.log("Modifying file...");
        fs.appendFile(watchFile, "\nAppended content", (err) => {
          if (err) console.error("Append error:", err);
        });
      }, 1000);

      setTimeout(() => {
        console.log("Modifying file again...");
        fs.writeFile(watchFile, "Completely new content", (err) => {
          if (err) console.error("Write error:", err);
        });
      }, 2000);

      // Cleanup
      setTimeout(() => {
        watcher.close();
        fs.unlink(watchFile, (err) => {
          if (err) console.error("Cleanup error:", err);
          else console.log("File watching demo completed");
        });
      }, 3000);
    });
  }
}

// Example usage (uncomment to run)
// const fsDemo = new FileSystemDemo();
// fsDemo.demonstrateAsyncFileOperations();
// setTimeout(() => fsDemo.demonstrateStreamOperations(), 3000);
// setTimeout(() => fsDemo.demonstrateWatchingOperations(), 6000);
```

## Networking Operations

```javascript
// Demonstrating how libuv handles networking
class NetworkingDemo {
  constructor() {
    this.connections = [];
    this.servers = [];
  }

  demonstrateTCPOperations() {
    console.log("=== TCP NETWORKING ===");

    const net = require("net");

    // Create TCP server
    const server = net.createServer((socket) => {
      console.log("Client connected:", socket.remoteAddress);

      socket.on("data", (data) => {
        console.log("Received data:", data.toString().trim());
        socket.write(`Echo: ${data}`);
      });

      socket.on("end", () => {
        console.log("Client disconnected");
      });

      socket.on("error", (err) => {
        console.error("Socket error:", err.message);
      });
    });

    server.listen(0, () => {
      const port = server.address().port;
      console.log(`TCP server listening on port ${port}`);

      // Create client connections
      for (let i = 0; i < 3; i++) {
        const client = net.createConnection(port, () => {
          console.log(`Client ${i + 1} connected`);
          client.write(`Hello from client ${i + 1}`);

          setTimeout(() => {
            client.end();
          }, 1000);
        });

        client.on("data", (data) => {
          console.log(`Client ${i + 1} received:`, data.toString().trim());
        });

        client.on("error", (err) => {
          console.error(`Client ${i + 1} error:`, err.message);
        });
      }

      // Close server after demo
      setTimeout(() => {
        server.close(() => {
          console.log("TCP server closed");
        });
      }, 3000);
    });

    server.on("error", (err) => {
      console.error("Server error:", err);
    });
  }

  demonstrateUDPOperations() {
    console.log("\n=== UDP NETWORKING ===");

    const dgram = require("dgram");

    // Create UDP server
    const server = dgram.createSocket("udp4");

    server.on("error", (err) => {
      console.error("UDP server error:", err);
      server.close();
    });

    server.on("message", (msg, rinfo) => {
      console.log(
        `UDP server received: ${msg} from ${rinfo.address}:${rinfo.port}`
      );

      // Echo back to sender
      server.send(`Echo: ${msg}`, rinfo.port, rinfo.address, (err) => {
        if (err) console.error("UDP send error:", err);
      });
    });

    server.on("listening", () => {
      const address = server.address();
      console.log(`UDP server listening on ${address.address}:${address.port}`);

      // Create UDP client
      const client = dgram.createSocket("udp4");

      const message = Buffer.from("Hello UDP");
      client.send(message, address.port, address.address, (err) => {
        if (err) {
          console.error("UDP client send error:", err);
        } else {
          console.log("UDP message sent");
        }
      });

      client.on("message", (msg, rinfo) => {
        console.log(`UDP client received: ${msg}`);
        client.close();
      });

      client.on("error", (err) => {
        console.error("UDP client error:", err);
      });

      // Close server after demo
      setTimeout(() => {
        server.close(() => {
          console.log("UDP server closed");
        });
      }, 2000);
    });

    server.bind(); // Bind to random port
  }

  demonstrateHTTPOperations() {
    console.log("\n=== HTTP OPERATIONS ===");

    const http = require("http");
    const https = require("https");

    // Create HTTP server
    const server = http.createServer((req, res) => {
      console.log(`HTTP request: ${req.method} ${req.url}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Hello from libuv-powered HTTP server",
          method: req.method,
          url: req.url,
          headers: req.headers,
          timestamp: new Date().toISOString(),
        })
      );
    });

    server.listen(0, () => {
      const port = server.address().port;
      console.log(`HTTP server listening on port ${port}`);

      // Make HTTP requests
      const requests = [
        { path: "/", method: "GET" },
        { path: "/api/data", method: "GET" },
        { path: "/api/users", method: "POST" },
      ];

      requests.forEach((reqConfig, index) => {
        const req = http.request(
          {
            hostname: "localhost",
            port: port,
            path: reqConfig.path,
            method: reqConfig.method,
            headers: { "User-Agent": "libuv-demo" },
          },
          (res) => {
            console.log(`Response ${index + 1}: ${res.statusCode}`);

            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });

            res.on("end", () => {
              try {
                const parsed = JSON.parse(data);
                console.log(`Response ${index + 1} data:`, parsed.message);
              } catch (err) {
                console.log(`Response ${index + 1} data:`, data);
              }
            });
          }
        );

        req.on("error", (err) => {
          console.error(`Request ${index + 1} error:`, err.message);
        });

        if (reqConfig.method === "POST") {
          req.write(JSON.stringify({ data: "test" }));
        }

        req.end();
      });

      // Close server after demo
      setTimeout(() => {
        server.close(() => {
          console.log("HTTP server closed");
        });
      }, 3000);
    });
  }

  demonstrateDNSOperations() {
    console.log("\n=== DNS OPERATIONS ===");

    const dns = require("dns");

    const domains = [
      "google.com",
      "github.com",
      "nodejs.org",
      "stackoverflow.com",
    ];

    console.log("DNS lookups (may use thread pool):");
    domains.forEach((domain, index) => {
      const startTime = process.hrtime.bigint();

      dns.lookup(domain, (err, address, family) => {
        const elapsed = Number(process.hrtime.bigint() - startTime) / 1000000;

        if (err) {
          console.log(
            `DNS lookup ${index + 1} (${domain}) failed: ${err.message}`
          );
        } else {
          console.log(
            `DNS lookup ${
              index + 1
            } (${domain}) -> ${address} (IPv${family}) in ${elapsed.toFixed(
              2
            )}ms`
          );
        }
      });
    });

    console.log("\nDNS resolution (uses c-ares, doesn't use thread pool):");
    domains.forEach((domain, index) => {
      const startTime = process.hrtime.bigint();

      dns.resolve4(domain, (err, addresses) => {
        const elapsed = Number(process.hrtime.bigint() - startTime) / 1000000;

        if (err) {
          console.log(
            `DNS resolve ${index + 1} (${domain}) failed: ${err.message}`
          );
        } else {
          console.log(
            `DNS resolve ${index + 1} (${domain}) -> ${addresses.join(
              ", "
            )} in ${elapsed.toFixed(2)}ms`
          );
        }
      });
    });
  }
}

// Example usage (uncomment to run)
// const netDemo = new NetworkingDemo();
// netDemo.demonstrateTCPOperations();
// setTimeout(() => netDemo.demonstrateUDPOperations(), 4000);
// setTimeout(() => netDemo.demonstrateHTTPOperations(), 7000);
// setTimeout(() => netDemo.demonstrateDNSOperations(), 11000);
```

## Performance Monitoring

```javascript
// Monitoring libuv performance characteristics
class LibuvPerformanceMonitor {
  constructor() {
    this.metrics = {
      eventLoopLag: [],
      activeHandles: [],
      activeRequests: [],
      threadPoolUsage: [],
      memoryUsage: [],
    };
  }

  startMonitoring(intervalMs = 1000) {
    console.log("=== LIBUV PERFORMANCE MONITORING ===");

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    // Monitor event loop lag
    this.monitorEventLoopLag();

    // Monitor thread pool saturation
    this.monitorThreadPool();

    return this;
  }

  monitorEventLoopLag() {
    const checkLag = () => {
      const start = process.hrtime.bigint();

      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
        this.metrics.eventLoopLag.push({
          timestamp: Date.now(),
          lag: lag,
        });

        if (lag > 10) {
          // Alert if lag > 10ms
          console.warn(`⚠️  Event loop lag: ${lag.toFixed(2)}ms`);
        }

        setTimeout(checkLag, 100); // Check every 100ms
      });
    };

    checkLag();
  }

  monitorThreadPool() {
    // Simulate thread pool monitoring
    const crypto = require("crypto");
    let activeThreadPoolTasks = 0;

    const createCryptoTask = () => {
      activeThreadPoolTasks++;

      const start = Date.now();
      crypto.pbkdf2("password", "salt", 10000, 32, "sha256", () => {
        activeThreadPoolTasks--;
        const duration = Date.now() - start;

        this.metrics.threadPoolUsage.push({
          timestamp: Date.now(),
          activeTasks: activeThreadPoolTasks,
          taskDuration: duration,
        });
      });
    };

    // Periodically create crypto tasks to monitor thread pool
    setInterval(() => {
      if (activeThreadPoolTasks < 6) {
        // Don't overwhelm
        createCryptoTask();
      }
    }, 2000);
  }

  collectMetrics() {
    const memory = process.memoryUsage();

    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
    });

    // Try to get active handles and requests (may not be available)
    try {
      const handles = process._getActiveHandles();
      const requests = process._getActiveRequests();

      this.metrics.activeHandles.push({
        timestamp: Date.now(),
        count: handles.length,
        types: this.categorizeHandles(handles),
      });

      this.metrics.activeRequests.push({
        timestamp: Date.now(),
        count: requests.length,
      });
    } catch (err) {
      // Ignore if internal functions not available
    }
  }

  categorizeHandles(handles) {
    const categories = {};
    handles.forEach((handle) => {
      const type = handle.constructor.name;
      categories[type] = (categories[type] || 0) + 1;
    });
    return categories;
  }

  getReport() {
    console.log("\n=== PERFORMANCE REPORT ===");

    // Event loop lag statistics
    if (this.metrics.eventLoopLag.length > 0) {
      const lags = this.metrics.eventLoopLag.map((m) => m.lag);
      const avgLag = lags.reduce((a, b) => a + b, 0) / lags.length;
      const maxLag = Math.max(...lags);

      console.log(`Event Loop Lag:`);
      console.log(`  Average: ${avgLag.toFixed(2)}ms`);
      console.log(`  Maximum: ${maxLag.toFixed(2)}ms`);
      console.log(`  Samples: ${lags.length}`);
    }

    // Memory usage trends
    if (this.metrics.memoryUsage.length > 0) {
      const latest =
        this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];

      console.log(`Memory Usage (latest):`);
      console.log(`  RSS: ${Math.round(latest.rss / 1024 / 1024)}MB`);
      console.log(
        `  Heap Total: ${Math.round(latest.heapTotal / 1024 / 1024)}MB`
      );
      console.log(
        `  Heap Used: ${Math.round(latest.heapUsed / 1024 / 1024)}MB`
      );
      console.log(`  External: ${Math.round(latest.external / 1024 / 1024)}MB`);
    }

    // Active handles and requests
    if (this.metrics.activeHandles.length > 0) {
      const latest =
        this.metrics.activeHandles[this.metrics.activeHandles.length - 1];

      console.log(`Active Handles: ${latest.count}`);
      if (latest.types) {
        Object.entries(latest.types).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
      }
    }

    if (this.metrics.activeRequests.length > 0) {
      const latest =
        this.metrics.activeRequests[this.metrics.activeRequests.length - 1];
      console.log(`Active Requests: ${latest.count}`);
    }

    // Thread pool usage
    if (this.metrics.threadPoolUsage.length > 0) {
      const durations = this.metrics.threadPoolUsage.map((m) => m.taskDuration);
      const avgDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length;

      console.log(`Thread Pool Tasks:`);
      console.log(`  Completed: ${durations.length}`);
      console.log(`  Average Duration: ${avgDuration.toFixed(2)}ms`);
    }
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.getReport();
  }
}

// Stress testing libuv
class LibuvStressTest {
  constructor() {
    this.monitor = new LibuvPerformanceMonitor();
  }

  runStressTest() {
    console.log("=== LIBUV STRESS TEST ===");

    this.monitor.startMonitoring(500);

    // 1. Create many timers
    this.stressTimers();

    // 2. Saturate thread pool
    setTimeout(() => this.stressThreadPool(), 2000);

    // 3. Create many network connections
    setTimeout(() => this.stressNetwork(), 4000);

    // 4. Heavy file I/O
    setTimeout(() => this.stressFileSystem(), 6000);

    // 5. Generate report
    setTimeout(() => {
      this.monitor.stopMonitoring();
    }, 10000);
  }

  stressTimers() {
    console.log("Stressing timer subsystem...");

    // Create many setTimeout calls
    for (let i = 0; i < 1000; i++) {
      setTimeout(() => {
        // Light work
      }, Math.random() * 5000);
    }

    // Create many setInterval calls
    const intervals = [];
    for (let i = 0; i < 100; i++) {
      const interval = setInterval(() => {
        // Light work
      }, 100 + Math.random() * 900);

      intervals.push(interval);
    }

    // Clean up after a while
    setTimeout(() => {
      intervals.forEach((interval) => clearInterval(interval));
      console.log("Timer stress test completed");
    }, 8000);
  }

  stressThreadPool() {
    console.log("Stressing thread pool...");

    const crypto = require("crypto");
    const fs = require("fs");

    // Crypto operations
    for (let i = 0; i < 20; i++) {
      crypto.pbkdf2("password", "salt", 50000, 32, "sha256", () => {
        // Task completed
      });
    }

    // File operations
    for (let i = 0; i < 15; i++) {
      fs.readFile(__filename, () => {
        // File read completed
      });
    }
  }

  stressNetwork() {
    console.log("Stressing network subsystem...");

    const net = require("net");
    const server = net.createServer(() => {});

    server.listen(0, () => {
      const port = server.address().port;

      // Create many concurrent connections
      for (let i = 0; i < 500; i++) {
        const client = net.createConnection(port, () => {
          client.end();
        });

        client.on("error", () => {}); // Ignore errors
      }

      setTimeout(() => {
        server.close();
        console.log("Network stress test completed");
      }, 3000);
    });
  }

  stressFileSystem() {
    console.log("Stressing file system...");

    const fs = require("fs");
    const path = require("path");

    // Create many file operations
    for (let i = 0; i < 100; i++) {
      const filename = path.join(__dirname, `temp-${i}.txt`);

      fs.writeFile(filename, `Content ${i}`, (err) => {
        if (!err) {
          fs.readFile(filename, (err, data) => {
            if (!err) {
              fs.unlink(filename, () => {
                // Cleanup completed
              });
            }
          });
        }
      });
    }
  }
}

// Example usage (uncomment to run)
// const stressTest = new LibuvStressTest();
// stressTest.runStressTest();
```

## Summary

### Key Points about libuv:

1. **Core Foundation**: libuv is the C library that powers Node.js's asynchronous I/O
2. **Event Loop**: Implements the event loop that drives all asynchronous operations
3. **Cross-Platform**: Abstracts platform differences for consistent behavior
4. **Thread Pool**: Uses a thread pool for operations that can't be made asynchronous
5. **I/O Mechanisms**: Uses epoll (Linux), kqueue (macOS), IOCP (Windows) for efficient I/O
6. **Handles and Requests**: Manages long-lived (handles) and short-lived (requests) operations

### libuv Components:

- **Event Loop**: The heart of Node.js asynchronous execution
- **Thread Pool**: For file system, DNS, and CPU-intensive operations
- **Network I/O**: TCP, UDP, and pipe operations
- **File System**: Asynchronous file operations
- **Timers**: setTimeout and setInterval implementation
- **Signal Handling**: Process signal management
- **Child Processes**: Process spawning and management

### Performance Considerations:

- **Thread Pool Size**: Default 4 threads, configurable via `UV_THREADPOOL_SIZE`
- **Event Loop Lag**: Monitor for blocking operations
- **Handle Management**: Properly close handles to prevent memory leaks
- **Platform Optimization**: Different platforms use different I/O mechanisms
- **Concurrency**: Network operations don't use thread pool, file operations do

Understanding libuv is crucial for Node.js developers because it explains why Node.js behaves the way it does, how to write efficient asynchronous code, and how to debug performance issues in Node.js applications.
