# What is `async/await`?

## Short Answer

`async/await` is **syntactic sugar** built on top of Promises that makes asynchronous code look and behave like synchronous code. It provides a cleaner, more readable way to work with Promises.

**Key components:**

- **`async`** - Declares an async function that always returns a Promise
- **`await`** - Pauses execution until a Promise resolves (can only be used inside async functions)

```javascript
// Without async/await (Promises)
function fetchUser() {
  return fetch("/api/user")
    .then((response) => response.json())
    .then((user) => {
      console.log(user);
      return user;
    })
    .catch((error) => {
      console.error(error);
    });
}

// With async/await (cleaner)
async function fetchUser() {
  try {
    const response = await fetch("/api/user");
    const user = await response.json();
    console.log(user);
    return user;
  } catch (error) {
    console.error(error);
  }
}
```

## Detailed Answer

### The `async` Keyword

The `async` keyword makes a function return a Promise automatically.

#### Basic async Function

```javascript
// async function always returns a Promise
async function hello() {
  return "Hello World";
}

// Equivalent to:
function hello() {
  return Promise.resolve("Hello World");
}

// Usage
hello().then((message) => {
  console.log(message); // 'Hello World'
});
```

#### async Returns Promise

```javascript
async function getNumber() {
  return 42;
}

console.log(getNumber()); // Promise { 42 }

getNumber().then((num) => {
  console.log(num); // 42
});
```

#### async with Explicit Promise

```javascript
async function fetchData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Data loaded");
    }, 1000);
  });
}

// Usage
fetchData().then((data) => {
  console.log(data); // 'Data loaded'
});
```

### The `await` Keyword

The `await` keyword pauses execution until a Promise resolves.

#### Basic await Usage

```javascript
async function fetchUser() {
  const response = await fetch("/api/user");
  // Execution pauses here until fetch completes

  const user = await response.json();
  // Execution pauses here until JSON parsing completes

  return user;
}
```

#### await Unwraps Promises

```javascript
// Without await
function getData() {
  const promise = fetch("/api/data");
  console.log(promise); // Promise { <pending> }
}

// With await
async function getData() {
  const data = await fetch("/api/data");
  console.log(data); // Response object (not Promise)
}
```

#### await Only in async Functions

```javascript
// ❌ Error: await can only be used in async functions
function regularFunction() {
  const data = await fetch('/api/data');  // SyntaxError!
}

// ✅ Correct: use in async function
async function asyncFunction() {
  const data = await fetch('/api/data');  // Works!
}
```

#### Top-Level await (ES2022, Node.js 14.8+)

```javascript
// In ES modules (.mjs or "type": "module" in package.json)
const data = await fetch("/api/data");
console.log(data);

// No async function wrapper needed!
```

### Error Handling with try/catch

#### Basic try/catch

```javascript
async function fetchUser(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error; // Re-throw or handle
  }
}

// Usage
fetchUser(123)
  .then((user) => console.log("User:", user))
  .catch((error) => console.error("Error:", error));
```

#### Multiple try/catch Blocks

```javascript
async function fetchUserData(userId) {
  let user;
  let posts;

  // Try to fetch user
  try {
    user = await fetchUser(userId);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }

  // Try to fetch posts (even if user fetch succeeds)
  try {
    posts = await fetchPosts(userId);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    posts = []; // Use empty array as fallback
  }

  return { user, posts };
}
```

#### Error Recovery

```javascript
async function fetchWithFallback(primaryUrl, fallbackUrl) {
  try {
    const response = await fetch(primaryUrl);
    return await response.json();
  } catch (error) {
    console.log("Primary failed, trying fallback");

    try {
      const response = await fetch(fallbackUrl);
      return await response.json();
    } catch (fallbackError) {
      console.error("Both sources failed");
      throw fallbackError;
    }
  }
}
```

### Sequential vs Parallel Execution

#### Sequential (Slow) - One After Another

```javascript
async function sequentialFetch() {
  console.time("sequential");

  const user = await fetchUser(1); // Wait 1s
  const posts = await fetchPosts(1); // Wait 1s
  const comments = await fetchComments(1); // Wait 1s

  console.timeEnd("sequential"); // ~3 seconds

  return { user, posts, comments };
}
```

#### Parallel (Fast) - All at Once

```javascript
async function parallelFetch() {
  console.time("parallel");

  // Start all requests simultaneously
  const [user, posts, comments] = await Promise.all([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1),
  ]);

  console.timeEnd("parallel"); // ~1 second

  return { user, posts, comments };
}
```

#### Mixed - Sequential with Parallel

```javascript
async function mixedFetch(userId) {
  // First, get user (sequential - we need the ID)
  const user = await fetchUser(userId);

  // Then, get posts and comments in parallel
  const [posts, comments] = await Promise.all([
    fetchPosts(user.id),
    fetchComments(user.id),
  ]);

  return { user, posts, comments };
}
```

### Using Promise Methods with async/await

#### Promise.all()

```javascript
async function fetchAllUsers() {
  const userIds = [1, 2, 3, 4, 5];

  const users = await Promise.all(userIds.map((id) => fetchUser(id)));

  return users;
}

// Usage
const users = await fetchAllUsers();
console.log("All users:", users);
```

#### Promise.allSettled()

```javascript
async function fetchUsersWithErrors() {
  const userIds = [1, 2, 999, 4]; // 999 might fail

  const results = await Promise.allSettled(userIds.map((id) => fetchUser(id)));

  const successful = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  const failed = results
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason);

  console.log("Successful:", successful.length);
  console.log("Failed:", failed.length);

  return successful;
}
```

#### Promise.race()

```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), timeout);
  });

  try {
    const response = await Promise.race([fetch(url), timeoutPromise]);

    return await response.json();
  } catch (error) {
    if (error.message === "Timeout") {
      console.error("Request timed out");
    }
    throw error;
  }
}

// Usage
try {
  const data = await fetchWithTimeout("/api/slow-endpoint", 3000);
  console.log("Data:", data);
} catch (error) {
  console.error("Error:", error);
}
```

#### Promise.any()

```javascript
async function fetchFromMultipleAPIs() {
  try {
    const data = await Promise.any([
      fetch("https://api1.example.com/data").then((r) => r.json()),
      fetch("https://api2.example.com/data").then((r) => r.json()),
      fetch("https://api3.example.com/data").then((r) => r.json()),
    ]);

    console.log("Got data from fastest API:", data);
    return data;
  } catch (error) {
    console.error("All APIs failed:", error);
    throw error;
  }
}
```

### Loops with async/await

#### for...of Loop (Sequential)

```javascript
async function processUsersSequential(userIds) {
  const results = [];

  for (const id of userIds) {
    const user = await fetchUser(id); // Wait for each
    results.push(user);
    console.log("Processed user:", id);
  }

  return results;
}

// Each user fetched one at a time
await processUsersSequential([1, 2, 3, 4, 5]);
```

#### map with Promise.all() (Parallel)

```javascript
async function processUsersParallel(userIds) {
  const results = await Promise.all(
    userIds.map(async (id) => {
      const user = await fetchUser(id);
      console.log("Processed user:", id);
      return user;
    })
  );

  return results;
}

// All users fetched simultaneously
await processUsersParallel([1, 2, 3, 4, 5]);
```

#### ❌ forEach Doesn't Work with await

```javascript
// ❌ Wrong: forEach doesn't wait for async operations
async function wrongForEach(userIds) {
  userIds.forEach(async (id) => {
    const user = await fetchUser(id);
    console.log(user); // May not complete before function returns
  });

  console.log("Done?"); // Executes immediately!
}

// ✅ Right: Use for...of or map with Promise.all
async function correctForOf(userIds) {
  for (const id of userIds) {
    const user = await fetchUser(id);
    console.log(user);
  }

  console.log("Actually done!"); // Waits for all
}
```

#### Controlled Concurrency

```javascript
async function processWithLimit(items, limit = 3) {
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

// Process 3 items at a time
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
await processWithLimit(items, 3);
```

### Real-World Examples

#### Example 1: API Request with Error Handling

```javascript
async function fetchUserProfile(userId) {
  try {
    // Fetch user data
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new Error(`User not found: ${response.status}`);
    }

    const user = await response.json();

    // Fetch additional data in parallel
    const [posts, followers, following] = await Promise.all([
      fetch(`/api/users/${userId}/posts`).then((r) => r.json()),
      fetch(`/api/users/${userId}/followers`).then((r) => r.json()),
      fetch(`/api/users/${userId}/following`).then((r) => r.json()),
    ]);

    return {
      ...user,
      posts,
      followers,
      following,
    };
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw error;
  }
}

// Usage
try {
  const profile = await fetchUserProfile(123);
  console.log("Profile:", profile);
} catch (error) {
  console.error("Error:", error);
}
```

#### Example 2: Database Operations

```javascript
async function createUserWithPosts(userData, postsData) {
  const session = await db.startSession();
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
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    throw error;
  } finally {
    // Always close session
    session.endSession();
  }
}

// Usage
try {
  const result = await createUserWithPosts(
    { name: "John", email: "john@example.com" },
    [{ title: "Post 1" }, { title: "Post 2" }]
  );
  console.log("Created:", result);
} catch (error) {
  console.error("Transaction failed:", error);
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

    console.log(`Found ${files.length} files`);

    // Process files in batches of 5
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (file) => {
          const filePath = path.join(dirPath, file);

          // Read file
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
      console.log(`Processed batch ${i / batchSize + 1}`);
    }

    return results;
  } catch (error) {
    console.error("Error processing files:", error);
    throw error;
  }
}

// Usage
await processFilesInDirectory("./data");
```

#### Example 4: Retry Logic

```javascript
async function fetchWithRetry(url, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;

      if (isLastAttempt) {
        throw new Error(
          `Failed after ${maxRetries} attempts: ${error.message}`
        );
      }

      console.log(`Attempt ${i + 1} failed, retrying in ${retryDelay}ms...`);

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

// Usage
try {
  const data = await fetchWithRetry("https://api.example.com/data", {
    maxRetries: 5,
    retryDelay: 2000,
  });
  console.log("Data:", data);
} catch (error) {
  console.error("All retries failed:", error);
}
```

#### Example 5: Express Route Handler

```javascript
const express = require("express");
const app = express();

// Async route handler
app.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch related data in parallel
    const [posts, followers] = await Promise.all([
      Post.find({ userId }),
      Follower.find({ followingId: userId }),
    ]);

    res.json({
      user,
      postsCount: posts.length,
      followersCount: followers.length,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Error wrapper for async routes
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Use wrapper
app.get(
  "/posts/:id",
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.json(post);
  })
);
```

### async/await vs Promises vs Callbacks

#### Callbacks (Old)

```javascript
function fetchUserData(userId, callback) {
  fetchUser(userId, (err, user) => {
    if (err) return callback(err);

    fetchPosts(userId, (err, posts) => {
      if (err) return callback(err);

      fetchComments(posts[0].id, (err, comments) => {
        if (err) return callback(err);

        callback(null, { user, posts, comments });
      });
    });
  });
}
```

#### Promises (Better)

```javascript
function fetchUserData(userId) {
  return fetchUser(userId).then((user) => {
    return fetchPosts(userId).then((posts) => {
      return fetchComments(posts[0].id).then((comments) => {
        return { user, posts, comments };
      });
    });
  });
}
```

#### async/await (Best)

```javascript
async function fetchUserData(userId) {
  const user = await fetchUser(userId);
  const posts = await fetchPosts(userId);
  const comments = await fetchComments(posts[0].id);

  return { user, posts, comments };
}
```

### Common Patterns

#### Pattern 1: Async IIFE (Immediately Invoked Function Expression)

```javascript
// Execute async code at top level
(async () => {
  try {
    const data = await fetchData();
    console.log("Data:", data);
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

#### Pattern 2: Async Class Methods

```javascript
class UserService {
  async getUser(userId) {
    const user = await db.users.findById(userId);
    return user;
  }

  async createUser(userData) {
    const user = await db.users.create(userData);
    return user;
  }

  async updateUser(userId, updates) {
    const user = await db.users.update(userId, updates);
    return user;
  }
}

// Usage
const service = new UserService();
const user = await service.getUser(123);
```

#### Pattern 3: Async Getters

```javascript
class DataLoader {
  async getData() {
    if (!this._data) {
      this._data = await fetch("/api/data").then((r) => r.json());
    }
    return this._data;
  }
}

// Usage
const loader = new DataLoader();
const data = await loader.getData();
```

#### Pattern 4: Conditional Async

```javascript
async function fetchUserData(userId, includeDetails = false) {
  const user = await fetchUser(userId);

  if (includeDetails) {
    const [posts, followers] = await Promise.all([
      fetchPosts(userId),
      fetchFollowers(userId),
    ]);

    return { ...user, posts, followers };
  }

  return user;
}
```

### Common Mistakes

#### ❌ Mistake 1: Not Using await

```javascript
// ❌ Wrong: Missing await
async function fetchData() {
  const data = fetchUser(1); // Returns Promise, not user!
  console.log(data); // Promise { <pending> }
  return data;
}

// ✅ Correct: Use await
async function fetchData() {
  const data = await fetchUser(1); // Waits for Promise
  console.log(data); // Actual user object
  return data;
}
```

#### ❌ Mistake 2: Sequential When Should Be Parallel

```javascript
// ❌ Slow: Sequential execution (3 seconds)
async function fetchAll() {
  const user = await fetchUser(1); // 1s
  const posts = await fetchPosts(1); // 1s
  const comments = await fetchComments(1); // 1s
  return { user, posts, comments };
}

// ✅ Fast: Parallel execution (1 second)
async function fetchAll() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1),
  ]);
  return { user, posts, comments };
}
```

#### ❌ Mistake 3: Not Handling Errors

```javascript
// ❌ Wrong: No error handling
async function fetchData() {
  const data = await fetch("/api/data"); // Can throw!
  return data;
}

// ✅ Correct: Handle errors
async function fetchData() {
  try {
    const data = await fetch("/api/data");
    return data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
```

#### ❌ Mistake 4: Using forEach with async

```javascript
// ❌ Wrong: forEach doesn't wait
async function processItems(items) {
  items.forEach(async (item) => {
    await processItem(item);
  });
  console.log("Done?"); // Executes immediately!
}

// ✅ Correct: Use for...of
async function processItems(items) {
  for (const item of items) {
    await processItem(item);
  }
  console.log("Actually done!");
}
```

#### ❌ Mistake 5: Unnecessary async

```javascript
// ❌ Unnecessary: Just returning value
async function getValue() {
  return 42;
}

// ✅ Better: Return directly (unless you need await inside)
function getValue() {
  return 42;
}

// ✅ async needed: Using await inside
async function fetchValue() {
  const data = await fetch("/api/value");
  return data;
}
```

### Best Practices

```javascript
// ✅ 1. Always handle errors with try/catch
async function fetchData() {
  try {
    const data = await fetch("/api/data");
    return data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// ✅ 2. Use Promise.all() for parallel operations
async function fetchAll() {
  const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);
  return { users, posts };
}

// ✅ 3. Use for...of for sequential iteration
async function processItems(items) {
  for (const item of items) {
    await processItem(item);
  }
}

// ✅ 4. Return await only when needed
async function fetchUser() {
  return await fetch("/api/user"); // Unnecessary await
}

// Better:
async function fetchUser() {
  return fetch("/api/user"); // Returns Promise directly
}

// But keep await if you have try/catch:
async function fetchUser() {
  try {
    return await fetch("/api/user"); // Needed for catch to work
  } catch (error) {
    console.error("Error:", error);
  }
}

// ✅ 5. Use finally for cleanup
async function operation() {
  try {
    await doSomething();
  } catch (error) {
    handleError(error);
  } finally {
    cleanup(); // Always runs
  }
}
```

### Key Takeaways

- ✅ `async` makes a function return a Promise automatically
- ✅ `await` pauses execution until a Promise resolves
- ✅ `await` can only be used inside `async` functions (or top-level in ES modules)
- ✅ Use `try/catch` for error handling with async/await
- ✅ Use `Promise.all()` for parallel operations (faster)
- ✅ Sequential await statements run one after another (slower)
- ✅ Use `for...of` loop, not `forEach`, with await
- ✅ async/await makes asynchronous code look synchronous
- ✅ Always handle errors - async functions can still throw
- ✅ async/await is built on Promises (just cleaner syntax)
- ✅ Modern best practice: prefer async/await over raw Promises

### Further Reading

- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN: await operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
- [JavaScript.info: Async/await](https://javascript.info/async-await)
- [Async/await Best Practices](https://advancedweb.hu/how-to-use-async-functions-with-array-foreach-in-javascript/)
- [Top-level await](https://v8.dev/features/top-level-await)
