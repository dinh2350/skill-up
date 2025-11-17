# What is the purpose of the `async` library?

The `async` library is a powerful utility module that provides functions for working with asynchronous JavaScript. It was particularly popular before the widespread adoption of Promises and async/await, offering structured ways to handle callback-based asynchronous operations and avoid callback hell.

## Overview and Purpose

The async library serves several key purposes:

1. **Control Flow**: Manage execution order of asynchronous operations
2. **Collection Iteration**: Perform async operations on arrays and objects
3. **Error Handling**: Centralized error management for async operations
4. **Callback Management**: Structured approach to handling callbacks
5. **Performance Control**: Limit concurrency and manage resource usage

### Installation and Basic Setup

```javascript
// Installation
// npm install async

const async = require("async");

// Modern ES6 import (if using modules)
// import async from 'async';
```

## Control Flow Functions

### Series - Sequential Execution

```javascript
const async = require("async");
const fs = require("fs");

// Execute functions in series (one after another)
async.series(
  [
    function (callback) {
      console.log("Task 1: Reading file 1");
      fs.readFile("file1.txt", "utf8", (err, data) => {
        if (err) return callback(err);
        console.log("File 1 content:", data);
        callback(null, "file1-result");
      });
    },
    function (callback) {
      console.log("Task 2: Reading file 2");
      fs.readFile("file2.txt", "utf8", (err, data) => {
        if (err) return callback(err);
        console.log("File 2 content:", data);
        callback(null, "file2-result");
      });
    },
    function (callback) {
      console.log("Task 3: Processing data");
      setTimeout(() => {
        console.log("Data processed");
        callback(null, "processed-result");
      }, 1000);
    },
  ],
  function (err, results) {
    if (err) {
      console.error("Series execution failed:", err);
      return;
    }
    console.log("All tasks completed successfully");
    console.log("Results:", results); // ['file1-result', 'file2-result', 'processed-result']
  }
);

// Series with named functions for better organization
const taskFunctions = {
  readConfig: function (callback) {
    console.log("Reading configuration...");
    fs.readFile("config.json", "utf8", (err, data) => {
      if (err) return callback(err);
      try {
        const config = JSON.parse(data);
        callback(null, config);
      } catch (parseErr) {
        callback(parseErr);
      }
    });
  },

  connectDatabase: function (callback) {
    console.log("Connecting to database...");
    // Mock database connection
    setTimeout(() => {
      console.log("Database connected");
      callback(null, { connected: true, connectionId: "db123" });
    }, 500);
  },

  initializeCache: function (callback) {
    console.log("Initializing cache...");
    setTimeout(() => {
      console.log("Cache initialized");
      callback(null, { cache: "redis", status: "ready" });
    }, 300);
  },
};

async.series(taskFunctions, function (err, results) {
  if (err) {
    console.error("Initialization failed:", err);
    process.exit(1);
  }

  console.log("Application initialized successfully");
  console.log("Initialization results:", results);
});
```

### Parallel - Concurrent Execution

```javascript
// Execute functions in parallel (concurrently)
async.parallel(
  [
    function (callback) {
      console.log("Starting task A");
      setTimeout(() => {
        console.log("Task A completed");
        callback(null, "result-A");
      }, 2000);
    },
    function (callback) {
      console.log("Starting task B");
      setTimeout(() => {
        console.log("Task B completed");
        callback(null, "result-B");
      }, 1000);
    },
    function (callback) {
      console.log("Starting task C");
      setTimeout(() => {
        console.log("Task C completed");
        callback(null, "result-C");
      }, 1500);
    },
  ],
  function (err, results) {
    if (err) {
      console.error("Parallel execution failed:", err);
      return;
    }
    console.log("All parallel tasks completed");
    console.log("Results:", results); // ['result-A', 'result-B', 'result-C']
  }
);

// Parallel with limit (control concurrency)
const urls = [
  "http://api.service1.com/data",
  "http://api.service2.com/data",
  "http://api.service3.com/data",
  "http://api.service4.com/data",
  "http://api.service5.com/data",
];

// Create tasks for parallel execution with concurrency limit
const tasks = urls.map((url) => {
  return function (callback) {
    // Mock HTTP request
    console.log(`Fetching data from ${url}`);
    setTimeout(() => {
      // Simulate random success/failure
      if (Math.random() > 0.1) {
        callback(null, { url, data: `data-from-${url}`, status: "success" });
      } else {
        callback(new Error(`Failed to fetch from ${url}`));
      }
    }, Math.random() * 2000 + 500);
  };
});

// Execute with concurrency limit of 2
async.parallelLimit(tasks, 2, function (err, results) {
  if (err) {
    console.error("Some requests failed:", err);
    return;
  }
  console.log("All requests completed successfully");
  results.forEach((result) => {
    console.log(`✓ ${result.url}: ${result.status}`);
  });
});
```

### Waterfall - Sequential with Data Flow

```javascript
// Waterfall passes results from one function to the next
async.waterfall(
  [
    function (callback) {
      console.log("Step 1: User authentication");
      // Mock authentication
      setTimeout(() => {
        const user = { id: 123, username: "john_doe", role: "admin" };
        console.log("User authenticated:", user.username);
        callback(null, user);
      }, 500);
    },
    function (user, callback) {
      console.log("Step 2: Fetch user permissions for", user.username);
      // Mock permission fetching
      setTimeout(() => {
        const permissions = ["read", "write", "delete", "admin"];
        console.log("Permissions loaded:", permissions);
        callback(null, user, permissions);
      }, 300);
    },
    function (user, permissions, callback) {
      console.log("Step 3: Generate session token");
      // Mock token generation
      setTimeout(() => {
        const token = `jwt-token-${user.id}-${Date.now()}`;
        const session = {
          user: user,
          permissions: permissions,
          token: token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };
        console.log("Session created with token:", token);
        callback(null, session);
      }, 200);
    },
    function (session, callback) {
      console.log("Step 4: Log login event");
      // Mock event logging
      setTimeout(() => {
        const loginEvent = {
          userId: session.user.id,
          username: session.user.username,
          timestamp: new Date(),
          ip: "192.168.1.100",
          userAgent: "Mock Browser",
        };
        console.log("Login event logged");
        callback(null, session, loginEvent);
      }, 100);
    },
  ],
  function (err, session, loginEvent) {
    if (err) {
      console.error("Authentication flow failed:", err);
      return;
    }

    console.log("Complete authentication flow successful");
    console.log("Session:", {
      userId: session.user.id,
      username: session.user.username,
      tokenPrefix: session.token.substring(0, 20) + "...",
      permissions: session.permissions,
      expiresAt: session.expiresAt,
    });
    console.log("Login event:", loginEvent);
  }
);

// Error handling in waterfall
async.waterfall(
  [
    function (callback) {
      console.log("Attempting database connection...");
      setTimeout(() => {
        // Simulate connection failure
        callback(new Error("Database connection timeout"));
      }, 1000);
    },
    function (dbConnection, callback) {
      // This won't execute due to error in previous step
      console.log("This step will not execute");
      callback(null, "some result");
    },
  ],
  function (err, result) {
    if (err) {
      console.error("Waterfall failed at step:", err.message);
      // Handle error appropriately
      return;
    }
    console.log("Waterfall completed:", result);
  }
);
```

## Collection Functions

### Each - Iterate Over Collections

```javascript
const async = require("async");

// Process each item in an array
const userIds = [1, 2, 3, 4, 5];

async.each(
  userIds,
  function (userId, callback) {
    console.log(`Processing user ${userId}`);

    // Mock user processing
    setTimeout(() => {
      if (userId === 4) {
        // Simulate error for user 4
        return callback(new Error(`Failed to process user ${userId}`));
      }

      console.log(`User ${userId} processed successfully`);
      callback();
    }, Math.random() * 1000 + 500);
  },
  function (err) {
    if (err) {
      console.error("Error processing users:", err.message);
    } else {
      console.log("All users processed successfully");
    }
  }
);

// Each with limit (control concurrency)
const fileNames = [
  "file1.txt",
  "file2.txt",
  "file3.txt",
  "file4.txt",
  "file5.txt",
  "file6.txt",
  "file7.txt",
  "file8.txt",
];

async.eachLimit(
  fileNames,
  3,
  function (fileName, callback) {
    console.log(`Processing file: ${fileName}`);

    // Mock file processing
    setTimeout(() => {
      console.log(`✓ Processed ${fileName}`);
      callback();
    }, Math.random() * 2000 + 500);
  },
  function (err) {
    if (err) {
      console.error("File processing failed:", err);
    } else {
      console.log("All files processed successfully");
    }
  }
);

// Each series (sequential processing)
const tasks = ["task1", "task2", "task3", "task4"];

async.eachSeries(
  tasks,
  function (task, callback) {
    console.log(`Executing ${task} at ${new Date().toISOString()}`);

    setTimeout(() => {
      console.log(`✓ Completed ${task}`);
      callback();
    }, 1000);
  },
  function (err) {
    if (err) {
      console.error("Task execution failed:", err);
    } else {
      console.log("All tasks completed in sequence");
    }
  }
);
```

### Map - Transform Collections

```javascript
// Map transforms each item and returns results
const numbers = [1, 2, 3, 4, 5];

async.map(
  numbers,
  function (number, callback) {
    console.log(`Processing number: ${number}`);

    // Mock async transformation
    setTimeout(() => {
      const result = {
        original: number,
        squared: number * number,
        cubed: number * number * number,
        timestamp: new Date().toISOString(),
      };

      console.log(`Transformed ${number} -> ${JSON.stringify(result)}`);
      callback(null, result);
    }, Math.random() * 1000 + 200);
  },
  function (err, results) {
    if (err) {
      console.error("Map operation failed:", err);
      return;
    }

    console.log("Map operation completed");
    console.log("Transformed results:", results);
  }
);

// Map with limit
const apiEndpoints = [
  "/api/users",
  "/api/posts",
  "/api/comments",
  "/api/categories",
  "/api/tags",
];

async.mapLimit(
  apiEndpoints,
  2,
  function (endpoint, callback) {
    console.log(`Fetching data from ${endpoint}`);

    // Mock API call
    setTimeout(() => {
      const mockData = {
        endpoint: endpoint,
        data: `mock-data-from-${endpoint}`,
        count: Math.floor(Math.random() * 100) + 1,
        timestamp: new Date().toISOString(),
      };

      console.log(`✓ Data fetched from ${endpoint}`);
      callback(null, mockData);
    }, Math.random() * 2000 + 500);
  },
  function (err, results) {
    if (err) {
      console.error("API data fetching failed:", err);
      return;
    }

    console.log("All API data fetched successfully");
    results.forEach((result) => {
      console.log(`${result.endpoint}: ${result.count} items`);
    });
  }
);

// Map series (sequential transformation)
const imageFiles = ["image1.jpg", "image2.png", "image3.gif"];

async.mapSeries(
  imageFiles,
  function (imageFile, callback) {
    console.log(`Processing image: ${imageFile}`);

    // Mock image processing
    setTimeout(() => {
      const processed = {
        originalFile: imageFile,
        thumbnailFile: `thumb_${imageFile}`,
        compressedFile: `compressed_${imageFile}`,
        size: Math.floor(Math.random() * 1000) + 100,
        processingTime: Math.floor(Math.random() * 2000) + 500,
      };

      console.log(`✓ Image processed: ${imageFile}`);
      callback(null, processed);
    }, 1500);
  },
  function (err, processedImages) {
    if (err) {
      console.error("Image processing failed:", err);
      return;
    }

    console.log("All images processed in sequence");
    processedImages.forEach((img) => {
      console.log(
        `${img.originalFile} -> ${img.thumbnailFile} (${img.size}KB)`
      );
    });
  }
);
```

### Filter - Conditional Collection Processing

```javascript
// Filter items based on async conditions
const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

async.filter(
  userIds,
  function (userId, callback) {
    console.log(`Checking user ${userId}`);

    // Mock user validation (check if user is active)
    setTimeout(() => {
      // Simulate: even user IDs are active
      const isActive = userId % 2 === 0;
      console.log(`User ${userId} is ${isActive ? "active" : "inactive"}`);
      callback(null, isActive);
    }, Math.random() * 500 + 100);
  },
  function (err, activeUserIds) {
    if (err) {
      console.error("User filtering failed:", err);
      return;
    }

    console.log("Active users:", activeUserIds);
  }
);

// Filter with limit
const emailAddresses = [
  "user1@example.com",
  "user2@invalid-domain.com",
  "user3@example.com",
  "invalid-email",
  "user4@example.com",
  "user5@spam-domain.com",
  "user6@example.com",
];

async.filterLimit(
  emailAddresses,
  3,
  function (email, callback) {
    console.log(`Validating email: ${email}`);

    // Mock email validation
    setTimeout(() => {
      const isValid =
        email.includes("@") &&
        email.includes(".") &&
        !email.includes("invalid") &&
        !email.includes("spam");

      console.log(`Email ${email} is ${isValid ? "valid" : "invalid"}`);
      callback(null, isValid);
    }, Math.random() * 1000 + 200);
  },
  function (err, validEmails) {
    if (err) {
      console.error("Email validation failed:", err);
      return;
    }

    console.log("Valid emails:", validEmails);
  }
);
```

## Advanced Flow Control

### Auto - Dependency-Based Execution

```javascript
// Auto runs tasks based on dependencies
const autoTasks = {
  // Task with no dependencies
  getData: function (callback) {
    console.log("Fetching raw data...");
    setTimeout(() => {
      const data = { raw: "some raw data", timestamp: Date.now() };
      console.log("Raw data fetched");
      callback(null, data);
    }, 1000);
  },

  // Task that depends on getData
  processData: [
    "getData",
    function (results, callback) {
      console.log("Processing data...");
      const rawData = results.getData;

      setTimeout(() => {
        const processedData = {
          processed: rawData.raw.toUpperCase(),
          timestamp: rawData.timestamp,
          processedAt: Date.now(),
        };
        console.log("Data processed");
        callback(null, processedData);
      }, 800);
    },
  ],

  // Task that depends on both getData and processData
  saveData: [
    "getData",
    "processData",
    function (results, callback) {
      console.log("Saving data...");
      const originalData = results.getData;
      const processedData = results.processData;

      setTimeout(() => {
        const savedData = {
          id: Math.floor(Math.random() * 1000),
          original: originalData,
          processed: processedData,
          savedAt: Date.now(),
        };
        console.log("Data saved successfully");
        callback(null, savedData);
      }, 500);
    },
  ],

  // Independent task
  sendNotification: function (callback) {
    console.log("Sending notification...");
    setTimeout(() => {
      const notification = {
        sent: true,
        sentAt: Date.now(),
        method: "email",
      };
      console.log("Notification sent");
      callback(null, notification);
    }, 600);
  },

  // Task that depends on saveData and sendNotification
  updateStatus: [
    "saveData",
    "sendNotification",
    function (results, callback) {
      console.log("Updating status...");
      const saveResult = results.saveData;
      const notificationResult = results.sendNotification;

      setTimeout(() => {
        const status = {
          dataId: saveResult.id,
          status: "completed",
          notificationSent: notificationResult.sent,
          completedAt: Date.now(),
        };
        console.log("Status updated");
        callback(null, status);
      }, 300);
    },
  ],
};

async.auto(autoTasks, function (err, results) {
  if (err) {
    console.error("Auto execution failed:", err);
    return;
  }

  console.log("All auto tasks completed successfully");
  console.log("Final results:", {
    dataId: results.saveData.id,
    status: results.updateStatus.status,
    completedAt: new Date(results.updateStatus.completedAt).toISOString(),
  });
});
```

### Queue - Task Queue Management

```javascript
// Create a queue with concurrency control
const processingQueue = async.queue(function (task, callback) {
  console.log(`Processing task: ${task.name} (Priority: ${task.priority})`);

  // Mock task processing
  setTimeout(() => {
    if (Math.random() > 0.1) {
      // 90% success rate
      console.log(`✓ Task completed: ${task.name}`);
      callback(null, `Result for ${task.name}`);
    } else {
      console.log(`✗ Task failed: ${task.name}`);
      callback(new Error(`Task ${task.name} failed`));
    }
  }, task.duration || 1000);
}, 2); // Process 2 tasks concurrently

// Queue event handlers
processingQueue.drain(function () {
  console.log("All tasks have been processed");
});

processingQueue.saturated(function () {
  console.log("Queue is saturated");
});

processingQueue.empty(function () {
  console.log("Queue is empty");
});

// Add tasks to queue
const tasks = [
  { name: "Task 1", priority: 1, duration: 1500 },
  { name: "Task 2", priority: 2, duration: 800 },
  { name: "Task 3", priority: 1, duration: 1200 },
  { name: "Task 4", priority: 3, duration: 600 },
  { name: "Task 5", priority: 2, duration: 1000 },
];

tasks.forEach((task) => {
  processingQueue.push(task, function (err, result) {
    if (err) {
      console.error(`Task ${task.name} failed:`, err.message);
    } else {
      console.log(`Task ${task.name} result:`, result);
    }
  });
});

// Priority queue
const priorityQueue = async.priorityQueue(function (task, callback) {
  console.log(
    `Processing priority task: ${task.name} (Priority: ${task.priority})`
  );

  setTimeout(() => {
    console.log(`✓ Priority task completed: ${task.name}`);
    callback(null, `Priority result for ${task.name}`);
  }, task.duration || 500);
}, 1); // Process 1 task at a time

// Add tasks with priorities (lower number = higher priority)
priorityQueue.push({ name: "Low Priority Task", duration: 1000 }, 3);
priorityQueue.push({ name: "High Priority Task", duration: 500 }, 1);
priorityQueue.push({ name: "Medium Priority Task", duration: 800 }, 2);
priorityQueue.push({ name: "Critical Task", duration: 300 }, 0);
```

## Error Handling Patterns

### Comprehensive Error Management

```javascript
// Error handling with retry logic
function retryableOperation(data, callback) {
  console.log("Attempting operation with data:", data.id);

  // Mock operation that might fail
  setTimeout(() => {
    if (Math.random() > 0.3) {
      // 70% failure rate for demonstration
      callback(new Error(`Operation failed for ${data.id}`));
    } else {
      callback(null, `Success result for ${data.id}`);
    }
  }, 500);
}

const retryOptions = {
  times: 3,
  interval: 200,
};

async.retry(
  retryOptions,
  function (callback) {
    retryableOperation({ id: "test-operation" }, callback);
  },
  function (err, result) {
    if (err) {
      console.error("Operation failed after retries:", err.message);
    } else {
      console.log("Operation succeeded:", result);
    }
  }
);

// Error handling in complex workflows
const complexWorkflow = {
  validateInput: function (callback) {
    console.log("Validating input...");
    setTimeout(() => {
      // Mock validation
      if (Math.random() > 0.8) {
        callback(new Error("Input validation failed"));
      } else {
        callback(null, { valid: true, data: "validated-data" });
      }
    }, 300);
  },

  authenticateUser: function (callback) {
    console.log("Authenticating user...");
    setTimeout(() => {
      if (Math.random() > 0.9) {
        callback(new Error("Authentication failed"));
      } else {
        callback(null, { userId: 123, authenticated: true });
      }
    }, 500);
  },

  processRequest: [
    "validateInput",
    "authenticateUser",
    function (results, callback) {
      console.log("Processing request...");
      const validation = results.validateInput;
      const auth = results.authenticateUser;

      setTimeout(() => {
        if (Math.random() > 0.7) {
          callback(new Error("Request processing failed"));
        } else {
          callback(null, {
            requestId: Date.now(),
            userId: auth.userId,
            data: validation.data,
            processed: true,
          });
        }
      }, 800);
    },
  ],
};

async.auto(complexWorkflow, function (err, results) {
  if (err) {
    console.error("Workflow failed:", err.message);

    // Detailed error analysis
    console.log("Completed steps:", Object.keys(results || {}));

    // Implement cleanup or rollback logic here
    console.log("Initiating cleanup procedures...");
  } else {
    console.log("Workflow completed successfully");
    console.log("Final result:", results.processRequest);
  }
});
```

## Migration from Async to Modern JavaScript

### Async Library vs Modern Alternatives

```javascript
// Traditional async.js approach
const asyncLibrary = require("async");

// 1. Series with async library
function seriesWithAsync() {
  asyncLibrary.series(
    [
      (callback) => {
        setTimeout(() => callback(null, "result1"), 1000);
      },
      (callback) => {
        setTimeout(() => callback(null, "result2"), 500);
      },
    ],
    (err, results) => {
      console.log("Async library series results:", results);
    }
  );
}

// Modern async/await equivalent
async function seriesWithAsyncAwait() {
  try {
    const result1 = await new Promise((resolve) =>
      setTimeout(() => resolve("result1"), 1000)
    );
    const result2 = await new Promise((resolve) =>
      setTimeout(() => resolve("result2"), 500)
    );

    const results = [result1, result2];
    console.log("Modern async/await series results:", results);
  } catch (error) {
    console.error("Series error:", error);
  }
}

// 2. Parallel with async library
function parallelWithAsync() {
  asyncLibrary.parallel(
    [
      (callback) => {
        setTimeout(() => callback(null, "result1"), 1000);
      },
      (callback) => {
        setTimeout(() => callback(null, "result2"), 500);
      },
    ],
    (err, results) => {
      console.log("Async library parallel results:", results);
    }
  );
}

// Modern Promise.all equivalent
async function parallelWithPromises() {
  try {
    const promises = [
      new Promise((resolve) => setTimeout(() => resolve("result1"), 1000)),
      new Promise((resolve) => setTimeout(() => resolve("result2"), 500)),
    ];

    const results = await Promise.all(promises);
    console.log("Modern Promise.all results:", results);
  } catch (error) {
    console.error("Parallel error:", error);
  }
}

// 3. Map with async library
function mapWithAsync() {
  const items = [1, 2, 3, 4, 5];

  asyncLibrary.map(
    items,
    (item, callback) => {
      setTimeout(() => {
        callback(null, item * 2);
      }, 100);
    },
    (err, results) => {
      console.log("Async library map results:", results);
    }
  );
}

// Modern Promise.all + map equivalent
async function mapWithPromises() {
  const items = [1, 2, 3, 4, 5];

  try {
    const promises = items.map(
      (item) =>
        new Promise((resolve) => setTimeout(() => resolve(item * 2), 100))
    );

    const results = await Promise.all(promises);
    console.log("Modern Promise map results:", results);
  } catch (error) {
    console.error("Map error:", error);
  }
}

// Utility function to limit concurrency with modern JavaScript
async function mapWithConcurrencyLimit(items, mapFunction, limit = 3) {
  const results = [];

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchPromises = batch.map(mapFunction);
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

// Example usage of modern concurrency control
async function modernConcurrencyExample() {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const results = await mapWithConcurrencyLimit(
    items,
    async (item) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Processed item: ${item}`);
          resolve(item * 2);
        }, 500);
      });
    },
    3 // Process 3 items at a time
  );

  console.log("Modern concurrency limited results:", results);
}

// Run examples
console.log("Running async library examples...");
seriesWithAsync();
parallelWithAsync();
mapWithAsync();

setTimeout(() => {
  console.log("\nRunning modern JavaScript examples...");
  seriesWithAsyncAwait();
  parallelWithPromises();
  mapWithPromises();
  modernConcurrencyExample();
}, 3000);
```

## Practical Use Cases

### Real-World Application Examples

```javascript
// Use case 1: File processing pipeline
const path = require("path");

function fileProcessingPipeline(inputDir, outputDir) {
  async.waterfall(
    [
      // Step 1: Read directory
      function (callback) {
        console.log("Reading directory:", inputDir);
        const mockFiles = ["file1.txt", "file2.txt", "file3.txt", "file4.txt"];
        setTimeout(() => callback(null, mockFiles), 200);
      },

      // Step 2: Filter files
      function (files, callback) {
        console.log("Filtering files...");
        async.filter(
          files,
          function (file, cb) {
            // Mock file validation
            const isValid = !file.includes("3"); // Skip file3.txt
            setTimeout(() => cb(null, isValid), 100);
          },
          function (err, validFiles) {
            if (err) return callback(err);
            console.log("Valid files:", validFiles);
            callback(null, validFiles);
          }
        );
      },

      // Step 3: Process files
      function (files, callback) {
        console.log("Processing files...");
        async.mapLimit(
          files,
          2,
          function (file, cb) {
            console.log(`Processing ${file}...`);

            // Mock file processing
            setTimeout(() => {
              const processedFile = {
                original: file,
                processed: `processed_${file}`,
                size: Math.floor(Math.random() * 1000) + 100,
                processedAt: new Date().toISOString(),
              };
              console.log(`✓ Processed ${file}`);
              cb(null, processedFile);
            }, Math.random() * 1000 + 500);
          },
          function (err, processedFiles) {
            if (err) return callback(err);
            callback(null, processedFiles);
          }
        );
      },

      // Step 4: Save results
      function (processedFiles, callback) {
        console.log("Saving processed files...");
        async.each(
          processedFiles,
          function (file, cb) {
            console.log(`Saving ${file.processed} to ${outputDir}`);

            // Mock file saving
            setTimeout(() => {
              console.log(`✓ Saved ${file.processed}`);
              cb();
            }, 200);
          },
          function (err) {
            if (err) return callback(err);
            callback(null, processedFiles);
          }
        );
      },
    ],
    function (err, finalResults) {
      if (err) {
        console.error("File processing pipeline failed:", err);
        return;
      }

      console.log("File processing pipeline completed successfully");
      console.log(
        "Processed files:",
        finalResults.map((f) => f.processed)
      );
    }
  );
}

// Use case 2: API aggregation service
function apiAggregationService() {
  const apiEndpoints = {
    userProfile: function (callback) {
      console.log("Fetching user profile...");
      setTimeout(() => {
        callback(null, {
          id: 123,
          name: "John Doe",
          email: "john@example.com",
        });
      }, 800);
    },

    userPosts: function (callback) {
      console.log("Fetching user posts...");
      setTimeout(() => {
        callback(null, [
          { id: 1, title: "First Post", content: "Content 1" },
          { id: 2, title: "Second Post", content: "Content 2" },
        ]);
      }, 600);
    },

    userSettings: function (callback) {
      console.log("Fetching user settings...");
      setTimeout(() => {
        callback(null, {
          theme: "dark",
          language: "en",
          notifications: true,
        });
      }, 400);
    },

    userStats: function (callback) {
      console.log("Fetching user statistics...");
      setTimeout(() => {
        callback(null, {
          postsCount: 25,
          followersCount: 150,
          followingCount: 75,
        });
      }, 1000);
    },
  };

  async.parallel(apiEndpoints, function (err, results) {
    if (err) {
      console.error("API aggregation failed:", err);
      return;
    }

    console.log("API aggregation completed successfully");

    // Combine all data
    const aggregatedData = {
      user: results.userProfile,
      posts: results.userPosts,
      settings: results.userSettings,
      statistics: results.userStats,
      lastUpdated: new Date().toISOString(),
    };

    console.log(
      "Aggregated user data:",
      JSON.stringify(aggregatedData, null, 2)
    );
  });
}

// Run use case examples
console.log("=== File Processing Pipeline ===");
fileProcessingPipeline("/input", "/output");

setTimeout(() => {
  console.log("\n=== API Aggregation Service ===");
  apiAggregationService();
}, 5000);
```

## Summary

### Key Purpose and Benefits of Async Library:

1. **Callback Management**

   - Structured approach to handling callbacks
   - Avoid callback hell with organized flow control
   - Consistent error handling patterns

2. **Control Flow**

   - **Series**: Sequential execution of tasks
   - **Parallel**: Concurrent execution with results collection
   - **Waterfall**: Sequential with data passing between steps
   - **Auto**: Dependency-based task execution

3. **Collection Operations**

   - **Each**: Iterate over collections with async operations
   - **Map**: Transform collections asynchronously
   - **Filter**: Conditional async filtering
   - **Reduce**: Accumulate values asynchronously

4. **Concurrency Control**

   - Limit concurrent operations to prevent resource exhaustion
   - Queue management with priority support
   - Backpressure handling for stream-like processing

5. **Error Handling**
   - Centralized error management
   - Retry mechanisms for resilient operations
   - Graceful failure handling in complex workflows

### When to Use Async Library:

**Still Relevant For:**

- Legacy callback-based codebases
- Complex dependency-based workflows (auto function)
- Advanced queue management needs
- Precise concurrency control requirements

**Modern Alternatives:**

- **Promises + async/await** for most use cases
- **Promise.all()** for parallel operations
- **Promise.allSettled()** for partial failure handling
- **Custom utility functions** for specific patterns

### Migration Strategy:

1. **Gradual Migration**: Replace async.js functions with Promise-based equivalents
2. **Utility Functions**: Create reusable utilities for common patterns
3. **Error Handling**: Implement try-catch blocks with async/await
4. **Testing**: Ensure functionality parity during migration

The async library was instrumental in managing asynchronous JavaScript before Promises became mainstream, providing structured patterns for complex async workflows. While modern JavaScript offers more elegant solutions, understanding async.js helps in maintaining legacy code and appreciating the evolution of async programming patterns.
