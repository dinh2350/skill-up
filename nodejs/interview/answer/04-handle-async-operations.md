# How do you handle asynchronous operations in Node.js?

## Short Answer

Node.js handles asynchronous operations through several mechanisms:

1. **Callbacks** - Traditional approach using callback functions
2. **Promises** - Better error handling and chainable operations
3. **Async/Await** - Modern, synchronous-looking asynchronous code
4. **Event Emitters** - Event-driven asynchronous patterns
5. **Streams** - Handling data asynchronously in chunks

The modern approach favors **async/await** for its readability and error handling, while Promises are used when chaining operations or handling multiple concurrent tasks.

## Detailed Answer

### Why Asynchronous Operations?

Node.js is single-threaded and uses non-blocking I/O, which means it can handle thousands of concurrent connections without creating new threads. Asynchronous operations prevent blocking the main thread while waiting for I/O operations (file system, database, network) to complete.

```javascript
// ❌ Synchronous (Blocking) - Bad for Node.js
const fs = require("fs");
const data = fs.readFileSync("file.txt", "utf8"); // Blocks until file is read
console.log(data);
console.log("This waits for file read to complete");

// ✅ Asynchronous (Non-blocking) - Good for Node.js
fs.readFile("file.txt", "utf8", (err, data) => {
  console.log(data);
});
console.log("This executes immediately without waiting");
```

### 1. Callbacks (Traditional Approach)

Callbacks are functions passed as arguments to be executed once an asynchronous operation completes.

#### Basic Callback Pattern

```javascript
const fs = require("fs");

// Error-first callback pattern
fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  console.log("File content:", data);
});

// Custom callback function
function fetchUser(userId, callback) {
  setTimeout(() => {
    const user = { id: userId, name: "John Doe" };
    callback(null, user); // null = no error
  }, 1000);
}

fetchUser(1, (err, user) => {
  if (err) return console.error(err);
  console.log("User:", user);
});
```

#### Error-First Callback Convention

```javascript
// Error-first callback: (error, result)
function asyncOperation(callback) {
  setTimeout(() => {
    const error = null; // or new Error('Something went wrong')
    const result = "Success!";
    callback(error, result);
  }, 1000);
}

asyncOperation((err, result) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log("Result:", result);
});
```

#### Callback Hell (Pyramid of Doom)

```javascript
// ❌ Callback Hell - Hard to read and maintain
fs.readFile("file1.txt", "utf8", (err1, data1) => {
  if (err1) return console.error(err1);

  fs.readFile("file2.txt", "utf8", (err2, data2) => {
    if (err2) return console.error(err2);

    fs.readFile("file3.txt", "utf8", (err3, data3) => {
      if (err3) return console.error(err3);

      console.log(data1, data2, data3);

      fs.writeFile("output.txt", data1 + data2 + data3, (err4) => {
        if (err4) return console.error(err4);
        console.log("Write complete!");
      });
    });
  });
});
```

**Problems with Callbacks:**

- ❌ Callback hell (nested callbacks)
- ❌ Difficult error handling
- ❌ Hard to reason about code flow
- ❌ No way to return values
- ❌ Difficult to compose operations

### 2. Promises

Promises represent a value that may be available now, in the future, or never. They provide a cleaner way to handle asynchronous operations.

#### Promise States

```javascript
/*
Promise has 3 states:
1. Pending - Initial state, neither fulfilled nor rejected
2. Fulfilled - Operation completed successfully
3. Rejected - Operation failed
*/

const promise = new Promise((resolve, reject) => {
  const success = true;

  setTimeout(() => {
    if (success) {
      resolve("Operation successful!"); // Fulfilled
    } else {
      reject(new Error("Operation failed!")); // Rejected
    }
  }, 1000);
});

promise
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

#### Creating Promises

```javascript
// Method 1: Promise constructor
function fetchUser(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId <= 0) {
        reject(new Error("Invalid user ID"));
      } else {
        resolve({ id: userId, name: "John Doe" });
      }
    }, 1000);
  });
}

// Method 2: Promisify callback-based functions
const util = require("util");
const fs = require("fs");

const readFilePromise = util.promisify(fs.readFile);

readFilePromise("file.txt", "utf8")
  .then((data) => console.log(data))
  .catch((err) => console.error(err));

// Method 3: Using fs.promises (Node.js 10+)
const fsPromises = require("fs").promises;

fsPromises
  .readFile("file.txt", "utf8")
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

#### Promise Chaining

```javascript
// ✅ Clean promise chain - Solves callback hell
fsPromises
  .readFile("file1.txt", "utf8")
  .then((data1) => {
    console.log("File 1:", data1);
    return fsPromises.readFile("file2.txt", "utf8");
  })
  .then((data2) => {
    console.log("File 2:", data2);
    return fsPromises.readFile("file3.txt", "utf8");
  })
  .then((data3) => {
    console.log("File 3:", data3);
  })
  .catch((err) => {
    console.error("Error:", err);
  })
  .finally(() => {
    console.log("All operations complete");
  });
```

#### Promise Methods

```javascript
// Promise.all() - Wait for all promises to resolve
const promise1 = fetchUser(1);
const promise2 = fetchUser(2);
const promise3 = fetchUser(3);

Promise.all([promise1, promise2, promise3])
  .then(([user1, user2, user3]) => {
    console.log("All users:", user1, user2, user3);
  })
  .catch((err) => {
    console.error("One promise failed:", err);
  });

// Promise.allSettled() - Wait for all, regardless of outcome
Promise.allSettled([promise1, promise2, promise3]).then((results) => {
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(`Promise ${index} succeeded:`, result.value);
    } else {
      console.log(`Promise ${index} failed:`, result.reason);
    }
  });
});

// Promise.race() - First to complete wins
Promise.race([promise1, promise2, promise3])
  .then((firstUser) => {
    console.log("First user:", firstUser);
  })
  .catch((err) => {
    console.error("First to complete failed:", err);
  });

// Promise.any() - First to succeed wins
Promise.any([promise1, promise2, promise3])
  .then((firstSuccessful) => {
    console.log("First successful:", firstSuccessful);
  })
  .catch((err) => {
    console.error("All failed:", err);
  });

// Promise.resolve() - Create resolved promise
const resolvedPromise = Promise.resolve("Immediate value");

// Promise.reject() - Create rejected promise
const rejectedPromise = Promise.reject(new Error("Immediate error"));
```

### 3. Async/Await (Modern Approach)

Async/await is syntactic sugar over Promises, making asynchronous code look and behave like synchronous code.

#### Basic Async/Await

```javascript
// Function must be declared with 'async'
async function readFiles() {
  try {
    const data1 = await fsPromises.readFile("file1.txt", "utf8");
    console.log("File 1:", data1);

    const data2 = await fsPromises.readFile("file2.txt", "utf8");
    console.log("File 2:", data2);

    const data3 = await fsPromises.readFile("file3.txt", "utf8");
    console.log("File 3:", data3);

    return "All files read successfully";
  } catch (err) {
    console.error("Error reading files:", err);
    throw err; // Re-throw or handle
  }
}

// Async functions always return a Promise
readFiles()
  .then((result) => console.log(result))
  .catch((err) => console.error("Top-level error:", err));
```

#### Async/Await Rules

```javascript
// ✅ Async function can use await
async function validExample() {
  const result = await someAsyncOperation();
  return result;
}

// ❌ Cannot use await in non-async function
function invalidExample() {
  const result = await someAsyncOperation(); // SyntaxError!
}

// ✅ Async function always returns a Promise
async function returnsPromise() {
  return 'Hello'; // Automatically wrapped in Promise
}

returnsPromise().then(value => console.log(value)); // 'Hello'

// ✅ Top-level await (ES2022, Node.js 14.8+ with ES modules)
// In .mjs file or with "type": "module"
const data = await fetch('https://api.example.com/data');
```

#### Error Handling with Async/Await

```javascript
// Method 1: Try/Catch
async function fetchUserData(userId) {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchUserPosts(userId);
    const comments = await fetchUserComments(userId);

    return { user, posts, comments };
  } catch (err) {
    console.error("Error fetching user data:", err);
    throw new Error("Failed to fetch complete user data");
  }
}

// Method 2: Multiple Try/Catch blocks
async function fetchWithFallback() {
  let primaryData;
  let secondaryData;

  try {
    primaryData = await fetchFromPrimarySource();
  } catch (err) {
    console.log("Primary source failed, trying backup");
    try {
      primaryData = await fetchFromBackupSource();
    } catch (backupErr) {
      console.error("Both sources failed");
      throw backupErr;
    }
  }

  return primaryData;
}

// Method 3: Promise catch
async function usingCatch() {
  const data = await fetchData().catch((err) => {
    console.error("Handled error:", err);
    return null; // Provide default value
  });

  if (!data) {
    console.log("Using default data");
    return getDefaultData();
  }

  return data;
}

// Method 4: Error wrapper utility
function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err); // Pass to Express error handler
    }
  };
}

// Express route with error handling
app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
  })
);
```

#### Parallel vs Sequential Execution

```javascript
// ❌ Sequential - Slow (each waits for previous)
async function sequentialExecution() {
  const user = await fetchUser(1); // Wait 1s
  const posts = await fetchPosts(1); // Wait 1s
  const comments = await fetchComments(1); // Wait 1s
  // Total: 3 seconds

  return { user, posts, comments };
}

// ✅ Parallel - Fast (all run simultaneously)
async function parallelExecution() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1),
  ]);
  // Total: ~1 second (all run at once)

  return { user, posts, comments };
}

// ✅ Parallel with separate variables
async function parallelWithVariables() {
  const userPromise = fetchUser(1);
  const postsPromise = fetchPosts(1);
  const commentsPromise = fetchComments(1);

  const user = await userPromise;
  const posts = await postsPromise;
  const comments = await commentsPromise;

  return { user, posts, comments };
}

// ✅ Mixed parallel and sequential
async function mixedExecution() {
  // First, get user (required for next steps)
  const user = await fetchUser(1);

  // Then, get posts and comments in parallel
  const [posts, comments] = await Promise.all([
    fetchPosts(user.id),
    fetchComments(user.id),
  ]);

  return { user, posts, comments };
}
```

#### Async/Await with Loops

```javascript
// ❌ forEach doesn't work well with async/await
async function wrongForEach() {
  const userIds = [1, 2, 3, 4, 5];

  userIds.forEach(async (id) => {
    const user = await fetchUser(id);
    console.log(user); // May not execute in order
  });

  console.log("Done?"); // Executes before all fetches complete
}

// ✅ for...of loop - Sequential
async function sequentialLoop() {
  const userIds = [1, 2, 3, 4, 5];

  for (const id of userIds) {
    const user = await fetchUser(id);
    console.log(user); // Executes in order, one at a time
  }

  console.log("All done!");
}

// ✅ Promise.all() with map - Parallel
async function parallelLoop() {
  const userIds = [1, 2, 3, 4, 5];

  const users = await Promise.all(userIds.map((id) => fetchUser(id)));

  console.log("All users:", users);
}

// ✅ Controlled concurrency
async function controlledConcurrency(items, limit = 3) {
  const results = [];

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map((item) => processItem(item))
    );
    results.push(...batchResults);
  }

  return results;
}
```

### 4. Event Emitters

Event Emitters follow the observer pattern for handling asynchronous events.

```javascript
const EventEmitter = require("events");

// Create custom event emitter
class UserService extends EventEmitter {
  async createUser(userData) {
    this.emit("userCreating", userData);

    try {
      const user = await saveToDatabase(userData);
      this.emit("userCreated", user);
      return user;
    } catch (err) {
      this.emit("error", err);
      throw err;
    }
  }
}

// Use event emitter
const userService = new UserService();

userService.on("userCreating", (data) => {
  console.log("Creating user:", data);
});

userService.on("userCreated", (user) => {
  console.log("User created:", user);
  // Send welcome email
  sendEmail(user.email);
});

userService.on("error", (err) => {
  console.error("Error:", err);
});

// Create user
userService.createUser({ name: "John", email: "john@example.com" });
```

#### Event Emitter Patterns

```javascript
// once() - Execute handler only once
emitter.once("connect", () => {
  console.log("Connected only once");
});

// removeListener() - Remove specific handler
const handler = () => console.log("Event fired");
emitter.on("data", handler);
emitter.removeListener("data", handler);

// removeAllListeners() - Remove all handlers
emitter.removeAllListeners("data");

// listenerCount() - Count listeners
const count = emitter.listenerCount("data");

// Error handling
emitter.on("error", (err) => {
  console.error("Error event:", err);
});
```

### 5. Streams

Streams handle data asynchronously in chunks, perfect for large files or data.

```javascript
const fs = require("fs");
const { Transform } = require("stream");

// Readable stream
const readStream = fs.createReadStream("large-file.txt", {
  encoding: "utf8",
  highWaterMark: 16 * 1024, // 16KB chunks
});

readStream.on("data", (chunk) => {
  console.log("Received chunk:", chunk.length, "bytes");
});

readStream.on("end", () => {
  console.log("Finished reading");
});

readStream.on("error", (err) => {
  console.error("Read error:", err);
});

// Writable stream
const writeStream = fs.createWriteStream("output.txt");

writeStream.write("Hello ");
writeStream.write("World\n");
writeStream.end("Goodbye!");

writeStream.on("finish", () => {
  console.log("Finished writing");
});

// Piping streams
fs.createReadStream("input.txt")
  .pipe(fs.createWriteStream("output.txt"))
  .on("finish", () => console.log("Copy complete"));

// Transform stream
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  },
});

fs.createReadStream("input.txt")
  .pipe(upperCaseTransform)
  .pipe(fs.createWriteStream("output.txt"));
```

### Real-World Examples

#### Example 1: API Call with Error Handling

```javascript
const axios = require("axios");

async function fetchUserProfile(userId) {
  try {
    // Parallel API calls
    const [user, posts, followers] = await Promise.all([
      axios.get(`/api/users/${userId}`),
      axios.get(`/api/users/${userId}/posts`),
      axios.get(`/api/users/${userId}/followers`),
    ]);

    return {
      user: user.data,
      posts: posts.data,
      followers: followers.data,
    };
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error("User not found");
    }
    console.error("API Error:", err);
    throw new Error("Failed to fetch user profile");
  }
}

// Usage
async function main() {
  try {
    const profile = await fetchUserProfile(123);
    console.log("Profile:", profile);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
```

#### Example 2: Database Operations

```javascript
const mongoose = require("mongoose");

async function createUserWithPosts(userData, postsData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create user
    const user = await User.create([userData], { session });

    // Create posts with user reference
    const posts = await Post.create(
      postsData.map((post) => ({ ...post, userId: user[0]._id })),
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    return { user: user[0], posts };
  } catch (err) {
    // Rollback on error
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
```

#### Example 3: File Processing

```javascript
const fs = require("fs").promises;
const path = require("path");

async function processFilesInDirectory(dirPath) {
  try {
    // Read directory
    const files = await fs.readdir(dirPath);

    // Process files in parallel (with limit)
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (file) => {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, "utf8");

          // Process content
          const processed = content.toUpperCase();

          // Write result
          const outputPath = path.join(dirPath, `processed-${file}`);
          await fs.writeFile(outputPath, processed);

          return { file, success: true };
        })
      );

      results.push(...batchResults);
    }

    return results;
  } catch (err) {
    console.error("Directory processing error:", err);
    throw err;
  }
}
```

#### Example 4: Express API with Async/Await

```javascript
const express = require("express");
const app = express();

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes
app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  })
);

app.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json(user);
  })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message });
});

app.listen(3000);
```

### Best Practices

#### 1. Always Handle Errors

```javascript
// ✅ Good
async function fetchData() {
  try {
    const data = await apiCall();
    return data;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

// ❌ Bad - Unhandled rejection
async function fetchData() {
  const data = await apiCall(); // No error handling!
  return data;
}
```

#### 2. Use Promise.all() for Parallel Operations

```javascript
// ✅ Good - Parallel (fast)
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);

// ❌ Bad - Sequential (slow)
const users = await fetchUsers();
const posts = await fetchPosts();
```

#### 3. Avoid Mixing Callbacks and Promises

```javascript
// ❌ Bad - Mixing patterns
async function mixedPatterns() {
  return new Promise((resolve) => {
    fs.readFile("file.txt", (err, data) => {
      if (err) resolve(null);
      else resolve(data);
    });
  });
}

// ✅ Good - Use promisify
const fsPromises = require("fs").promises;
async function promiseOnly() {
  return await fsPromises.readFile("file.txt", "utf8");
}
```

#### 4. Handle Cleanup with finally

```javascript
async function withCleanup() {
  const connection = await database.connect();

  try {
    const result = await connection.query("SELECT * FROM users");
    return result;
  } catch (err) {
    console.error("Query error:", err);
    throw err;
  } finally {
    await connection.close(); // Always executes
  }
}
```

#### 5. Use Async/Await Over Raw Promises

```javascript
// ❌ Promise chains - harder to read
function fetchUserData(userId) {
  return fetchUser(userId)
    .then((user) => {
      return fetchPosts(user.id).then((posts) => {
        return { user, posts };
      });
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
}

// ✅ Async/await - cleaner
async function fetchUserData(userId) {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchPosts(user.id);
    return { user, posts };
  } catch (err) {
    console.error(err);
    throw err;
  }
}
```

### Common Patterns

#### Retry Pattern

```javascript
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.log(`Attempt ${i + 1} failed, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Usage
const result = await retryOperation(() => fetchData(), 3, 2000);
```

#### Timeout Pattern

```javascript
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeoutMs)
    ),
  ]);
}

// Usage
try {
  const result = await withTimeout(fetchData(), 5000);
} catch (err) {
  if (err.message === "Timeout") {
    console.log("Operation timed out");
  }
}
```

#### Queue Pattern

```javascript
class AsyncQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async push(fn) {
    while (this.running >= this.concurrency) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.running++;

    try {
      return await fn();
    } finally {
      this.running--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }
}

// Usage
const queue = new AsyncQueue(3); // Max 3 concurrent
const results = await Promise.all(
  items.map((item) => queue.push(() => processItem(item)))
);
```

### Conclusion

Node.js provides multiple ways to handle asynchronous operations, each with its use cases:

- **Callbacks**: Legacy, still used in older APIs
- **Promises**: Better than callbacks, chainable
- **Async/Await**: Modern, readable, recommended
- **Event Emitters**: Event-driven patterns
- **Streams**: Large data handling

### Key Takeaways

- ✅ Prefer async/await for readability and error handling
- ✅ Use Promise.all() for parallel operations
- ✅ Always handle errors with try/catch or .catch()
- ✅ Avoid callback hell by using Promises or async/await
- ✅ Use Event Emitters for event-driven architectures
- ✅ Use Streams for handling large data
- ✅ Understand sequential vs parallel execution
- ✅ Use finally for cleanup operations
- ✅ Handle rejected promises to avoid unhandled rejections
- ✅ Consider patterns like retry, timeout, and queuing

### Further Reading

- [Node.js Async Documentation](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [Event Emitter Documentation](https://nodejs.org/api/events.html)
- [Streams Documentation](https://nodejs.org/api/stream.html)
