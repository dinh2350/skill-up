# What are callbacks in Node.js?

## Short Answer

A **callback** is a function passed as an argument to another function, which is then executed after an asynchronous operation completes. Callbacks are the fundamental pattern for handling asynchronous operations in Node.js.

```javascript
// Callback function passed as argument
fs.readFile("file.txt", "utf8", (err, data) => {
  // This callback executes when file reading is complete
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log("File content:", data);
});

console.log("This runs before file is read");
```

**Key characteristics:**

- **Asynchronous** - Don't block code execution
- **Error-first** - First parameter is typically an error object
- **Non-blocking** - Allow other operations while waiting

## Detailed Answer

### What is a Callback?

A callback is simply a function passed to another function to be executed later.

#### Synchronous Callback (Executes Immediately)

```javascript
// Array methods use synchronous callbacks
const numbers = [1, 2, 3, 4, 5];

numbers.forEach((num) => {
  console.log(num); // Callback executes for each element
});

const doubled = numbers.map((num) => {
  return num * 2; // Callback transforms each element
});

console.log("This runs after all callbacks");
```

#### Asynchronous Callback (Executes Later)

```javascript
const fs = require("fs");

// Asynchronous callback
fs.readFile("file.txt", "utf8", (err, data) => {
  console.log("2. File read complete");
  console.log("Data:", data);
});

console.log("1. This runs first (non-blocking)");

// Output:
// 1. This runs first (non-blocking)
// 2. File read complete
// Data: [file contents]
```

### Error-First Callback Pattern

Node.js uses the **error-first callback** convention:

```javascript
function callback(error, result) {
  // First parameter: error object (null if no error)
  // Subsequent parameters: results
}
```

#### Basic Example

```javascript
const fs = require("fs");

fs.readFile("file.txt", "utf8", (err, data) => {
  // err: Error object or null
  // data: File contents or undefined

  if (err) {
    console.error("Error reading file:", err);
    return; // Stop execution on error
  }

  console.log("Success! Data:", data);
});
```

#### Why Error-First?

```javascript
// ✅ Consistent error handling pattern
function readUserData(userId, callback) {
  database.query("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      // Error occurred
      callback(err, null);
      return;
    }

    // Success
    callback(null, user);
  });
}

// Usage
readUserData(123, (err, user) => {
  if (err) {
    console.error("Failed to read user:", err);
    return;
  }

  console.log("User:", user);
});
```

### Creating Your Own Callbacks

#### Example 1: Simple Async Function

```javascript
function fetchData(url, callback) {
  // Simulate async operation
  setTimeout(() => {
    const data = { id: 1, name: "John" };
    callback(null, data); // Success
  }, 1000);
}

// Usage
fetchData("https://api.example.com/user", (err, data) => {
  if (err) {
    console.error("Error:", err);
    return;
  }

  console.log("Data received:", data);
});
```

#### Example 2: File Processing

```javascript
const fs = require("fs");

function processFile(filename, callback) {
  // Read file
  fs.readFile(filename, "utf8", (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }

    // Process data
    const processed = data.toUpperCase();

    // Write result
    fs.writeFile("output.txt", processed, (err) => {
      if (err) {
        callback(err, null);
        return;
      }

      callback(null, "File processed successfully");
    });
  });
}

// Usage
processFile("input.txt", (err, message) => {
  if (err) {
    console.error("Processing failed:", err);
    return;
  }

  console.log(message);
});
```

#### Example 3: Database Operation

```javascript
function createUser(userData, callback) {
  // Validate input
  if (!userData.email) {
    const error = new Error("Email is required");
    callback(error, null);
    return;
  }

  // Save to database
  database.insert("users", userData, (err, result) => {
    if (err) {
      callback(err, null);
      return;
    }

    callback(null, result);
  });
}

// Usage
createUser({ email: "john@example.com", name: "John" }, (err, user) => {
  if (err) {
    console.error("Failed to create user:", err);
    return;
  }

  console.log("User created:", user);
});
```

### Callback Hell (Pyramid of Doom)

When callbacks are nested, code becomes hard to read and maintain.

#### Example of Callback Hell

```javascript
const fs = require("fs");

// ❌ Callback hell - nested callbacks
fs.readFile("file1.txt", "utf8", (err1, data1) => {
  if (err1) {
    console.error("Error reading file1:", err1);
    return;
  }

  fs.readFile("file2.txt", "utf8", (err2, data2) => {
    if (err2) {
      console.error("Error reading file2:", err2);
      return;
    }

    fs.readFile("file3.txt", "utf8", (err3, data3) => {
      if (err3) {
        console.error("Error reading file3:", err3);
        return;
      }

      const combined = data1 + data2 + data3;

      fs.writeFile("output.txt", combined, (err4) => {
        if (err4) {
          console.error("Error writing file:", err4);
          return;
        }

        console.log("Files combined successfully");
      });
    });
  });
});
```

#### Problems with Callback Hell

1. **Hard to read** - Deep nesting
2. **Hard to maintain** - Difficult to modify
3. **Error handling** - Repetitive error checks
4. **Debugging** - Complex flow control
5. **Code reuse** - Difficult to extract logic

### Avoiding Callback Hell

#### Solution 1: Named Functions

```javascript
const fs = require("fs");

// ✅ Break into named functions
function readFile1(callback) {
  fs.readFile("file1.txt", "utf8", (err, data) => {
    if (err) return callback(err);
    callback(null, data);
  });
}

function readFile2(data1, callback) {
  fs.readFile("file2.txt", "utf8", (err, data2) => {
    if (err) return callback(err);
    callback(null, data1, data2);
  });
}

function readFile3(data1, data2, callback) {
  fs.readFile("file3.txt", "utf8", (err, data3) => {
    if (err) return callback(err);
    callback(null, data1 + data2 + data3);
  });
}

function writeOutput(combined, callback) {
  fs.writeFile("output.txt", combined, callback);
}

// Use named functions
readFile1((err, data1) => {
  if (err) return handleError(err);

  readFile2(data1, (err, data1, data2) => {
    if (err) return handleError(err);

    readFile3(data1, data2, (err, combined) => {
      if (err) return handleError(err);

      writeOutput(combined, (err) => {
        if (err) return handleError(err);
        console.log("Success!");
      });
    });
  });
});

function handleError(err) {
  console.error("Error:", err);
}
```

#### Solution 2: Modularize

```javascript
const fs = require("fs");

// ✅ Create reusable helper
function readFileAsync(filename, callback) {
  fs.readFile(filename, "utf8", callback);
}

// ✅ Separate concerns
function combineFiles(files, callback) {
  let combined = "";
  let completed = 0;

  files.forEach((file, index) => {
    readFileAsync(file, (err, data) => {
      if (err) return callback(err);

      combined += data;
      completed++;

      if (completed === files.length) {
        callback(null, combined);
      }
    });
  });
}

// Usage
combineFiles(["file1.txt", "file2.txt", "file3.txt"], (err, combined) => {
  if (err) {
    console.error("Error:", err);
    return;
  }

  fs.writeFile("output.txt", combined, (err) => {
    if (err) {
      console.error("Error writing:", err);
      return;
    }

    console.log("Files combined!");
  });
});
```

#### Solution 3: Use Control Flow Libraries

```javascript
const async = require("async");
const fs = require("fs");

// ✅ Using async.waterfall
async.waterfall(
  [
    // Read file1
    (callback) => {
      fs.readFile("file1.txt", "utf8", callback);
    },
    // Read file2
    (data1, callback) => {
      fs.readFile("file2.txt", "utf8", (err, data2) => {
        if (err) return callback(err);
        callback(null, data1, data2);
      });
    },
    // Read file3
    (data1, data2, callback) => {
      fs.readFile("file3.txt", "utf8", (err, data3) => {
        if (err) return callback(err);
        callback(null, data1 + data2 + data3);
      });
    },
    // Write output
    (combined, callback) => {
      fs.writeFile("output.txt", combined, callback);
    },
  ],
  (err) => {
    if (err) {
      console.error("Error:", err);
      return;
    }

    console.log("Success!");
  }
);
```

#### Solution 4: Use Promises (Modern Approach)

```javascript
const fs = require("fs").promises;

// ✅ Much cleaner with Promises
async function combineFiles() {
  try {
    const data1 = await fs.readFile("file1.txt", "utf8");
    const data2 = await fs.readFile("file2.txt", "utf8");
    const data3 = await fs.readFile("file3.txt", "utf8");

    const combined = data1 + data2 + data3;

    await fs.writeFile("output.txt", combined);

    console.log("Files combined successfully");
  } catch (err) {
    console.error("Error:", err);
  }
}

combineFiles();
```

### Common Callback Patterns

#### Pattern 1: Single Callback

```javascript
function fetchUser(userId, callback) {
  database.findUser(userId, (err, user) => {
    if (err) return callback(err);
    callback(null, user);
  });
}

// Usage
fetchUser(123, (err, user) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log("User:", user);
});
```

#### Pattern 2: Multiple Callbacks

```javascript
function processData(data, onSuccess, onError) {
  if (!data) {
    onError(new Error("No data provided"));
    return;
  }

  // Process data
  const result = data.toUpperCase();
  onSuccess(result);
}

// Usage
processData(
  "hello",
  (result) => {
    console.log("Success:", result);
  },
  (error) => {
    console.error("Error:", error);
  }
);
```

#### Pattern 3: Event Emitter Pattern

```javascript
const EventEmitter = require("events");

class DataProcessor extends EventEmitter {
  process(data) {
    // Emit events instead of callbacks
    this.emit("start", data);

    setTimeout(() => {
      if (!data) {
        this.emit("error", new Error("Invalid data"));
      } else {
        this.emit("complete", data.toUpperCase());
      }
    }, 1000);
  }
}

// Usage
const processor = new DataProcessor();

processor.on("start", (data) => {
  console.log("Processing started:", data);
});

processor.on("complete", (result) => {
  console.log("Processing complete:", result);
});

processor.on("error", (err) => {
  console.error("Processing error:", err);
});

processor.process("hello");
```

### Real-World Examples

#### Example 1: File System Operations

```javascript
const fs = require("fs");
const path = require("path");

function backupFile(filename, callback) {
  const backupName = filename + ".backup";

  // Check if file exists
  fs.access(filename, fs.constants.F_OK, (err) => {
    if (err) {
      callback(new Error("File does not exist"));
      return;
    }

    // Read original file
    fs.readFile(filename, (err, data) => {
      if (err) {
        callback(err);
        return;
      }

      // Write backup
      fs.writeFile(backupName, data, (err) => {
        if (err) {
          callback(err);
          return;
        }

        callback(null, `Backup created: ${backupName}`);
      });
    });
  });
}

// Usage
backupFile("important.txt", (err, message) => {
  if (err) {
    console.error("Backup failed:", err);
    return;
  }

  console.log(message);
});
```

#### Example 2: HTTP Request

```javascript
const http = require("http");

function makeRequest(url, callback) {
  http
    .get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        callback(null, data);
      });
    })
    .on("error", (err) => {
      callback(err);
    });
}

// Usage
makeRequest("http://api.example.com/data", (err, data) => {
  if (err) {
    console.error("Request failed:", err);
    return;
  }

  console.log("Response:", data);
});
```

#### Example 3: Database Query

```javascript
function getUserWithPosts(userId, callback) {
  // Get user
  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      callback(err);
      return;
    }

    if (!user) {
      callback(new Error("User not found"));
      return;
    }

    // Get user's posts
    db.query(
      "SELECT * FROM posts WHERE user_id = ?",
      [userId],
      (err, posts) => {
        if (err) {
          callback(err);
          return;
        }

        // Combine results
        user.posts = posts;
        callback(null, user);
      }
    );
  });
}

// Usage
getUserWithPosts(123, (err, user) => {
  if (err) {
    console.error("Error:", err);
    return;
  }

  console.log("User:", user.name);
  console.log("Posts:", user.posts.length);
});
```

#### Example 4: Express Route Handler

```javascript
const express = require("express");
const app = express();

// Callback in route handler
app.get("/users/:id", (req, res) => {
  const userId = req.params.id;

  getUserById(userId, (err, user) => {
    if (err) {
      res.status(500).json({ error: "Server error" });
      return;
    }

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  });
});

function getUserById(id, callback) {
  db.findUser(id, callback);
}
```

### Callback vs Promises vs Async/Await

#### Callbacks (Traditional)

```javascript
function fetchUser(userId, callback) {
  database.findUser(userId, (err, user) => {
    if (err) return callback(err);

    database.findPosts(userId, (err, posts) => {
      if (err) return callback(err);

      user.posts = posts;
      callback(null, user);
    });
  });
}

// Usage
fetchUser(123, (err, user) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log("User:", user);
});
```

#### Promises (Modern)

```javascript
function fetchUser(userId) {
  return database.findUser(userId).then((user) => {
    return database.findPosts(userId).then((posts) => {
      user.posts = posts;
      return user;
    });
  });
}

// Usage
fetchUser(123)
  .then((user) => {
    console.log("User:", user);
  })
  .catch((err) => {
    console.error("Error:", err);
  });
```

#### Async/Await (Best)

```javascript
async function fetchUser(userId) {
  const user = await database.findUser(userId);
  const posts = await database.findPosts(userId);
  user.posts = posts;
  return user;
}

// Usage
try {
  const user = await fetchUser(123);
  console.log("User:", user);
} catch (err) {
  console.error("Error:", err);
}
```

### Converting Callbacks to Promises

#### Manual Conversion

```javascript
const fs = require("fs");

// Original callback function
function readFileCallback(filename, callback) {
  fs.readFile(filename, "utf8", callback);
}

// Convert to Promise
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

#### Using util.promisify

```javascript
const fs = require("fs");
const util = require("util");

// Convert callback function to Promise
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Usage
async function processFile() {
  try {
    const data = await readFile("input.txt", "utf8");
    await writeFile("output.txt", data.toUpperCase());
    console.log("File processed");
  } catch (err) {
    console.error("Error:", err);
  }
}

processFile();
```

#### Using fs.promises (Node.js 10+)

```javascript
const fs = require("fs").promises;

async function processFile() {
  try {
    const data = await fs.readFile("input.txt", "utf8");
    await fs.writeFile("output.txt", data.toUpperCase());
    console.log("File processed");
  } catch (err) {
    console.error("Error:", err);
  }
}

processFile();
```

### Best Practices

#### ✅ Do's

```javascript
// 1. Always handle errors
function fetchData(url, callback) {
  request(url, (err, data) => {
    if (err) {
      callback(err); // Pass error to callback
      return;
    }
    callback(null, data);
  });
}

// 2. Use error-first pattern
function readData(callback) {
  callback(error, result); // Error first
}

// 3. Call callback only once
function processData(data, callback) {
  if (!data) {
    callback(new Error("No data"));
    return; // Stop execution
  }

  callback(null, processedData);
  // Don't call callback again!
}

// 4. Return after callback
function getData(callback) {
  if (error) {
    callback(error);
    return; // Exit function
  }

  callback(null, data);
}

// 5. Use named functions for clarity
function onSuccess(data) {
  console.log("Success:", data);
}

function onError(err) {
  console.error("Error:", err);
}

fetchData(url, (err, data) => {
  if (err) return onError(err);
  onSuccess(data);
});
```

#### ❌ Don'ts

```javascript
// 1. Don't call callback multiple times
function badFunction(callback) {
  callback(null, "result1");
  callback(null, "result2"); // ❌ Wrong!
}

// 2. Don't forget to return after callback
function alsoWrong(callback) {
  if (error) {
    callback(error);
    // ❌ Missing return - code continues
  }

  callback(null, data); // Called even with error!
}

// 3. Don't throw errors in async callbacks
function throwingCallback(callback) {
  setTimeout(() => {
    throw new Error("Crash!"); // ❌ Uncaught exception!
    // Should be: callback(new Error('Crash!'));
  }, 1000);
}

// 4. Don't nest too deeply
function deepNesting() {
  callback1(() => {
    callback2(() => {
      callback3(() => {
        // ❌ Callback hell
      });
    });
  });
}

// 5. Don't ignore errors
function ignoringErrors(callback) {
  fetchData((err, data) => {
    // ❌ Not checking err
    console.log(data);
  });
}
```

### Key Takeaways

- ✅ Callbacks are functions passed as arguments to be executed later
- ✅ Node.js uses **error-first callback** pattern: `callback(error, result)`
- ✅ Always check for errors: `if (err) return callback(err);`
- ✅ Callbacks enable **non-blocking**, asynchronous operations
- ✅ **Callback hell** occurs with deeply nested callbacks
- ✅ Avoid callback hell with named functions, modularization, or Promises
- ✅ Call callbacks **only once** and **return** after calling
- ✅ Modern alternative: Use **Promises** and **async/await**
- ✅ Convert callbacks to Promises with `util.promisify()`
- ✅ Use `fs.promises` for Promise-based file operations

### Further Reading

- [Node.js Callback Documentation](https://nodejs.org/en/knowledge/getting-started/control-flow/what-are-callbacks/)
- [Error-First Callbacks](https://nodejs.org/en/knowledge/errors/what-are-the-error-conventions/)
- [Callback Hell](http://callbackhell.com/)
- [util.promisify()](https://nodejs.org/api/util.html#util_util_promisify_original)
- [Async Module](https://caolan.github.io/async/v3/)
- [Promises vs Callbacks](https://nodejs.dev/learn/understanding-javascript-promises)
