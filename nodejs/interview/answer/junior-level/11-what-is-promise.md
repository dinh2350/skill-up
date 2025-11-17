# What is a Promise?

## Short Answer

A **Promise** is an object representing the eventual completion or failure of an asynchronous operation. It's a better alternative to callbacks for handling async code, providing cleaner syntax and better error handling.

**Three states:**

- **Pending** - Initial state, operation not yet complete
- **Fulfilled** - Operation completed successfully (resolved)
- **Rejected** - Operation failed (rejected)

```javascript
// Creating a Promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Success!"); // or reject(new Error('Failed!'))
  }, 1000);
});

// Using a Promise
promise
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

## Detailed Answer

### What is a Promise?

A Promise is a JavaScript object that represents a value that may be available now, in the future, or never. It's a placeholder for the result of an asynchronous operation.

```javascript
// Promise represents future value
const fetchData = new Promise((resolve, reject) => {
  // Asynchronous operation
  setTimeout(() => {
    const data = { id: 1, name: "John" };
    resolve(data); // Success
  }, 1000);
});

console.log(fetchData); // Promise { <pending> }

fetchData.then((data) => {
  console.log(data); // { id: 1, name: 'John' }
});
```

### Promise States

A Promise can be in one of three states:

```javascript
// 1. Pending - Initial state
const pending = new Promise((resolve, reject) => {
  // Not yet resolved or rejected
});
console.log(pending); // Promise { <pending> }

// 2. Fulfilled - Success
const fulfilled = Promise.resolve("Success");
console.log(fulfilled); // Promise { 'Success' }

// 3. Rejected - Failure
const rejected = Promise.reject(new Error("Failed"));
console.log(rejected); // Promise { <rejected> Error: Failed }
```

**State Transitions:**

```
Pending ──resolve()──> Fulfilled
        └──reject()──> Rejected
```

Once settled (fulfilled or rejected), a Promise cannot change state.

### Creating Promises

#### Method 1: Promise Constructor

```javascript
const myPromise = new Promise((resolve, reject) => {
  // Asynchronous operation
  const success = true;

  if (success) {
    resolve("Operation successful"); // Fulfill
  } else {
    reject(new Error("Operation failed")); // Reject
  }
});
```

#### Method 2: Promise.resolve()

```javascript
// Create already-resolved Promise
const resolved = Promise.resolve(42);

resolved.then((value) => {
  console.log(value); // 42
});

// Shortcut for:
const manual = new Promise((resolve) => {
  resolve(42);
});
```

#### Method 3: Promise.reject()

```javascript
// Create already-rejected Promise
const rejected = Promise.reject(new Error("Something went wrong"));

rejected.catch((error) => {
  console.error(error); // Error: Something went wrong
});

// Shortcut for:
const manual = new Promise((resolve, reject) => {
  reject(new Error("Something went wrong"));
});
```

### Using Promises with .then() and .catch()

#### Basic Usage

```javascript
const fetchUser = new Promise((resolve, reject) => {
  setTimeout(() => {
    const user = { id: 1, name: "John" };
    resolve(user);
  }, 1000);
});

// Handle success with .then()
fetchUser.then((user) => {
  console.log("User:", user);
});

// Handle error with .catch()
fetchUser.catch((error) => {
  console.error("Error:", error);
});

// Both together
fetchUser
  .then((user) => {
    console.log("User:", user);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

#### Promise Chaining

```javascript
// Promises can be chained
fetchUser(1)
  .then((user) => {
    console.log("User:", user);
    return fetchPosts(user.id); // Return another Promise
  })
  .then((posts) => {
    console.log("Posts:", posts);
    return fetchComments(posts[0].id);
  })
  .then((comments) => {
    console.log("Comments:", comments);
  })
  .catch((error) => {
    console.error("Error in chain:", error);
  });
```

#### Returning Values in .then()

```javascript
Promise.resolve(5)
  .then((value) => {
    console.log(value); // 5
    return value * 2; // Return new value
  })
  .then((value) => {
    console.log(value); // 10
    return value + 3;
  })
  .then((value) => {
    console.log(value); // 13
  });
```

#### Returning Promises in .then()

```javascript
function fetchUser(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, name: "John" });
    }, 1000);
  });
}

function fetchPosts(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([{ id: 1, title: "Post 1", userId }]);
    }, 1000);
  });
}

// Chain Promises
fetchUser(1)
  .then((user) => {
    console.log("User:", user);
    return fetchPosts(user.id); // Return Promise
  })
  .then((posts) => {
    console.log("Posts:", posts); // Waits for Promise to resolve
  });
```

### Error Handling

#### Single .catch() for Entire Chain

```javascript
fetchUser(1)
  .then((user) => {
    console.log("User:", user);
    return fetchPosts(user.id);
  })
  .then((posts) => {
    console.log("Posts:", posts);
    return fetchComments(posts[0].id);
  })
  .catch((error) => {
    // Catches errors from any step in the chain
    console.error("Error:", error);
  });
```

#### Multiple .catch() Handlers

```javascript
fetchUser(1)
  .then((user) => {
    console.log("User:", user);
    return fetchPosts(user.id);
  })
  .catch((error) => {
    console.error("Failed to fetch user or posts:", error);
    return []; // Provide default value
  })
  .then((posts) => {
    console.log("Posts:", posts);
    return fetchComments(posts[0]?.id);
  })
  .catch((error) => {
    console.error("Failed to fetch comments:", error);
  });
```

#### Error Recovery

```javascript
fetchUser(1)
  .then((user) => {
    console.log("User:", user);
    return fetchPosts(user.id);
  })
  .catch((error) => {
    console.error("Primary source failed, trying backup");
    return fetchPostsFromBackup(1); // Fallback
  })
  .then((posts) => {
    console.log("Posts:", posts);
  })
  .catch((error) => {
    console.error("All sources failed:", error);
  });
```

### The .finally() Method

Executes regardless of success or failure:

```javascript
fetchUser(1)
  .then((user) => {
    console.log("User:", user);
    return user;
  })
  .catch((error) => {
    console.error("Error:", error);
    throw error;
  })
  .finally(() => {
    // Always executes (cleanup, loading indicators, etc.)
    console.log("Operation complete");
    hideLoadingSpinner();
  });
```

### Promise Static Methods

#### Promise.all() - Wait for All

Waits for all Promises to resolve, or rejects if any fails:

```javascript
const promise1 = fetchUser(1);
const promise2 = fetchUser(2);
const promise3 = fetchUser(3);

Promise.all([promise1, promise2, promise3])
  .then(([user1, user2, user3]) => {
    console.log("All users:", user1, user2, user3);
  })
  .catch((error) => {
    console.error("At least one failed:", error);
  });
```

**Example: Parallel API Calls**

```javascript
async function fetchAllData() {
  const [users, posts, comments] = await Promise.all([
    fetch("/api/users").then((r) => r.json()),
    fetch("/api/posts").then((r) => r.json()),
    fetch("/api/comments").then((r) => r.json()),
  ]);

  return { users, posts, comments };
}
```

#### Promise.allSettled() - Wait for All (Always)

Waits for all Promises to complete, regardless of outcome:

```javascript
const promises = [
  fetchUser(1),
  fetchUser(2),
  fetchUser(999), // This might fail
];

Promise.allSettled(promises).then((results) => {
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(`Promise ${index} succeeded:`, result.value);
    } else {
      console.log(`Promise ${index} failed:`, result.reason);
    }
  });
});

// Output:
// Promise 0 succeeded: { id: 1, name: 'John' }
// Promise 1 succeeded: { id: 2, name: 'Jane' }
// Promise 2 failed: Error: User not found
```

#### Promise.race() - First to Complete

Returns the first Promise to settle (resolve or reject):

```javascript
const slow = new Promise((resolve) => {
  setTimeout(() => resolve("Slow"), 3000);
});

const fast = new Promise((resolve) => {
  setTimeout(() => resolve("Fast"), 1000);
});

Promise.race([slow, fast]).then((result) => {
  console.log(result); // 'Fast' (first to resolve)
});
```

**Example: Timeout Pattern**

```javascript
function withTimeout(promise, timeoutMs) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

// Usage
withTimeout(fetchUser(1), 5000)
  .then((user) => console.log("User:", user))
  .catch((error) => console.error("Error or timeout:", error));
```

#### Promise.any() - First to Succeed

Returns the first Promise to resolve (ignores rejections):

```javascript
const promise1 = Promise.reject("Error 1");
const promise2 = new Promise((resolve) => {
  setTimeout(() => resolve("Success 2"), 2000);
});
const promise3 = new Promise((resolve) => {
  setTimeout(() => resolve("Success 3"), 1000);
});

Promise.any([promise1, promise2, promise3])
  .then((result) => {
    console.log(result); // 'Success 3' (first to resolve)
  })
  .catch((error) => {
    console.error("All failed:", error);
  });
```

**Example: Multiple API Endpoints**

```javascript
// Try multiple API endpoints, use first successful response
Promise.any([
  fetch("https://api1.example.com/data").then((r) => r.json()),
  fetch("https://api2.example.com/data").then((r) => r.json()),
  fetch("https://api3.example.com/data").then((r) => r.json()),
])
  .then((data) => console.log("Data from fastest endpoint:", data))
  .catch((error) => console.error("All endpoints failed:", error));
```

### Comparison of Promise Methods

| Method                   | Resolves When  | Rejects When  | Use Case                  |
| ------------------------ | -------------- | ------------- | ------------------------- |
| **Promise.all()**        | All resolve    | Any rejects   | Need all results          |
| **Promise.allSettled()** | All complete   | Never         | Want all outcomes         |
| **Promise.race()**       | First settles  | First rejects | Timeout, fastest response |
| **Promise.any()**        | First resolves | All reject    | Fallback sources          |

### Converting Callbacks to Promises

#### Manual Conversion

```javascript
const fs = require("fs");

// Callback version
function readFileCallback(filename, callback) {
  fs.readFile(filename, "utf8", callback);
}

// Promise version
function readFilePromise(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// Usage
readFilePromise("file.txt")
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

#### Using util.promisify()

```javascript
const fs = require("fs");
const util = require("util");

// Convert callback function to Promise
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Usage
readFile("input.txt", "utf8")
  .then((data) => {
    console.log("File content:", data);
    return writeFile("output.txt", data.toUpperCase());
  })
  .then(() => {
    console.log("File written");
  })
  .catch((err) => {
    console.error("Error:", err);
  });
```

#### Using fs.promises (Node.js 10+)

```javascript
const fs = require("fs").promises;

// Already promisified
fs.readFile("file.txt", "utf8")
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

### Real-World Examples

#### Example 1: Sequential API Calls

```javascript
function getUserProfile(userId) {
  return fetchUser(userId)
    .then((user) => {
      console.log("User:", user);
      return fetchPosts(userId);
    })
    .then((posts) => {
      console.log("Posts:", posts);
      return fetchComments(posts[0].id);
    })
    .then((comments) => {
      console.log("Comments:", comments);
      return { user, posts, comments };
    })
    .catch((error) => {
      console.error("Failed to fetch profile:", error);
      throw error;
    });
}

// Usage
getUserProfile(123)
  .then((profile) => {
    console.log("Complete profile:", profile);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

#### Example 2: Parallel API Calls

```javascript
function getUserData(userId) {
  return Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchFollowers(userId),
  ]).then(([user, posts, followers]) => {
    return {
      user,
      posts,
      followers,
    };
  });
}

// Usage
getUserData(123)
  .then((data) => {
    console.log("User:", data.user);
    console.log("Posts:", data.posts.length);
    console.log("Followers:", data.followers.length);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

#### Example 3: Error Handling with Retry

```javascript
function fetchWithRetry(url, retries = 3) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        return fetchWithRetry(url, retries - 1);
      }
      throw error;
    });
}

// Usage
fetchWithRetry("https://api.example.com/data")
  .then((data) => console.log("Data:", data))
  .catch((error) => console.error("Failed after retries:", error));
```

#### Example 4: Loading Multiple Resources

```javascript
function loadPageData() {
  const promises = {
    user: fetch("/api/user").then((r) => r.json()),
    settings: fetch("/api/settings").then((r) => r.json()),
    notifications: fetch("/api/notifications").then((r) => r.json()),
  };

  return Promise.all([
    promises.user,
    promises.settings,
    promises.notifications,
  ]).then(([user, settings, notifications]) => {
    return { user, settings, notifications };
  });
}

// Usage
loadPageData()
  .then((data) => {
    renderPage(data);
  })
  .catch((error) => {
    showError("Failed to load page data");
  });
```

#### Example 5: Database Transaction

```javascript
function transferMoney(fromAccount, toAccount, amount) {
  return db.beginTransaction().then((transaction) => {
    return db
      .debit(fromAccount, amount, transaction)
      .then(() => db.credit(toAccount, amount, transaction))
      .then(() => db.commit(transaction))
      .catch((error) => {
        return db.rollback(transaction).then(() => {
          throw error; // Re-throw original error
        });
      });
  });
}

// Usage
transferMoney("account1", "account2", 100)
  .then(() => {
    console.log("Transfer successful");
  })
  .catch((error) => {
    console.error("Transfer failed:", error);
  });
```

### Promise Anti-Patterns

#### ❌ Anti-Pattern 1: Nested Promises

```javascript
// ❌ Bad - Nesting promises (callback hell 2.0)
fetchUser(1).then((user) => {
  fetchPosts(user.id).then((posts) => {
    fetchComments(posts[0].id).then((comments) => {
      console.log(comments);
    });
  });
});

// ✅ Good - Flat chain
fetchUser(1)
  .then((user) => fetchPosts(user.id))
  .then((posts) => fetchComments(posts[0].id))
  .then((comments) => console.log(comments))
  .catch((error) => console.error(error));
```

#### ❌ Anti-Pattern 2: Not Returning Promises

```javascript
// ❌ Bad - Not returning Promise
fetchUser(1)
  .then((user) => {
    fetchPosts(user.id); // Not returned!
  })
  .then((posts) => {
    console.log(posts); // undefined
  });

// ✅ Good - Return Promise
fetchUser(1)
  .then((user) => {
    return fetchPosts(user.id); // Returned
  })
  .then((posts) => {
    console.log(posts); // Actual posts
  });
```

#### ❌ Anti-Pattern 3: Creating Unnecessary Promises

```javascript
// ❌ Bad - Unnecessary Promise wrapper
function fetchData() {
  return new Promise((resolve, reject) => {
    fetch("/api/data")
      .then((response) => resolve(response))
      .catch((error) => reject(error));
  });
}

// ✅ Good - Return existing Promise
function fetchData() {
  return fetch("/api/data");
}
```

#### ❌ Anti-Pattern 4: Not Catching Errors

```javascript
// ❌ Bad - No error handling
fetchUser(1)
  .then((user) => {
    return fetchPosts(user.id);
  })
  .then((posts) => {
    console.log(posts);
  });
// If error occurs, it's unhandled!

// ✅ Good - Catch errors
fetchUser(1)
  .then((user) => fetchPosts(user.id))
  .then((posts) => console.log(posts))
  .catch((error) => console.error("Error:", error));
```

#### ❌ Anti-Pattern 5: Using .then() for Side Effects Only

```javascript
// ❌ Bad - Using .then() but not returning
promise
  .then((data) => {
    console.log(data); // Side effect only
  })
  .then((result) => {
    console.log(result); // undefined
  });

// ✅ Good - Return value or use separate .then()
promise
  .then((data) => {
    console.log(data);
    return data; // Pass data forward
  })
  .then((result) => {
    console.log(result); // Has value
  });
```

### Promises vs Callbacks

```javascript
// Callbacks (old way)
function fetchUserCallback(userId, callback) {
  db.findUser(userId, (err, user) => {
    if (err) return callback(err);

    db.findPosts(userId, (err, posts) => {
      if (err) return callback(err);

      user.posts = posts;
      callback(null, user);
    });
  });
}

// Promises (better)
function fetchUserPromise(userId) {
  return db.findUser(userId).then((user) => {
    return db.findPosts(userId).then((posts) => {
      user.posts = posts;
      return user;
    });
  });
}

// Promises (best - flat chain)
function fetchUserPromise(userId) {
  let user;
  return db
    .findUser(userId)
    .then((foundUser) => {
      user = foundUser;
      return db.findPosts(userId);
    })
    .then((posts) => {
      user.posts = posts;
      return user;
    });
}
```

### Promise Performance

```javascript
// Sequential (slow) - 3 seconds total
async function sequential() {
  const user = await fetchUser(1); // 1s
  const posts = await fetchPosts(1); // 1s
  const comments = await fetchComments(1); // 1s
  return { user, posts, comments };
}

// Parallel (fast) - 1 second total
async function parallel() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(1), // All start together
    fetchPosts(1),
    fetchComments(1),
  ]);
  return { user, posts, comments };
}
```

### Best Practices

```javascript
// ✅ 1. Always return Promises in .then()
fetchUser(1)
  .then((user) => {
    return fetchPosts(user.id); // Return!
  })
  .then((posts) => console.log(posts));

// ✅ 2. Always catch errors
promise.then(handleSuccess).catch(handleError);

// ✅ 3. Use Promise.all() for parallel operations
Promise.all([promise1, promise2, promise3]).then(
  ([result1, result2, result3]) => {
    // All results
  }
);

// ✅ 4. Use .finally() for cleanup
fetchData().then(handleData).catch(handleError).finally(cleanup);

// ✅ 5. Prefer async/await for readability
async function fetchUserData() {
  try {
    const user = await fetchUser(1);
    const posts = await fetchPosts(user.id);
    return { user, posts };
  } catch (error) {
    console.error("Error:", error);
  }
}

// ✅ 6. Don't mix callbacks and Promises
// Bad:
fetchUser().then((user) => {
  oldCallbackFunction(user, (err, result) => {
    // Mixing patterns!
  });
});

// Good: Convert everything to Promises
util.promisify(oldCallbackFunction);
```

### Key Takeaways

- ✅ A Promise represents a future value (pending, fulfilled, or rejected)
- ✅ Use `.then()` for success, `.catch()` for errors, `.finally()` for cleanup
- ✅ Promises can be chained for sequential operations
- ✅ `Promise.all()` runs operations in parallel
- ✅ `Promise.allSettled()` waits for all, regardless of outcome
- ✅ `Promise.race()` returns first to complete
- ✅ `Promise.any()` returns first to succeed
- ✅ Always return Promises in `.then()` chains
- ✅ Always handle errors with `.catch()`
- ✅ Avoid nesting Promises (keep chains flat)
- ✅ Use `util.promisify()` to convert callbacks to Promises
- ✅ Modern alternative: Use `async/await` for cleaner code

### Further Reading

- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Promises/A+ Specification](https://promisesaplus.com/)
- [JavaScript.info: Promises](https://javascript.info/promise-basics)
- [We have a problem with promises](https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html)
- [Promise Anti-patterns](https://github.com/petkaantonov/bluebird/wiki/Promise-anti-patterns)
