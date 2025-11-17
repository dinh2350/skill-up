# Explain error handling in Node.js

## Short Answer

Error handling in Node.js involves multiple techniques depending on the context:

1. **Synchronous code**: Use `try/catch` blocks
2. **Callbacks**: Error-first callback pattern (err as first parameter)
3. **Promises**: Use `.catch()` or `try/catch` with async/await
4. **Event Emitters**: Listen to `error` events
5. **Express.js**: Error-handling middleware with 4 parameters

```javascript
// Synchronous
try {
  JSON.parse("invalid json");
} catch (err) {
  console.error("Error:", err.message);
}

// Callbacks (error-first pattern)
fs.readFile("file.txt", (err, data) => {
  if (err) return console.error(err);
  console.log(data);
});

// Promises
fetch("url")
  .then((res) => res.json())
  .catch((err) => console.error(err));

// Async/await
try {
  const data = await fetch("url");
} catch (err) {
  console.error(err);
}

// Event Emitter
emitter.on("error", (err) => {
  console.error("Error:", err);
});
```

## Detailed Answer

### Types of Errors in Node.js

#### 1. Standard JavaScript Errors

```javascript
// Error - Base error class
throw new Error("Something went wrong");

// SyntaxError - Invalid JavaScript syntax
try {
  eval("var x = {");
} catch (err) {
  console.error(err.name); // SyntaxError
}

// ReferenceError - Invalid reference
try {
  console.log(undefinedVariable);
} catch (err) {
  console.error(err.name); // ReferenceError
}

// TypeError - Wrong type
try {
  null.toString();
} catch (err) {
  console.error(err.name); // TypeError
}

// RangeError - Value out of range
try {
  new Array(-1);
} catch (err) {
  console.error(err.name); // RangeError
}
```

#### 2. System Errors

Node.js-specific errors from the operating system.

```javascript
const fs = require("fs");

// ENOENT - File not found
fs.readFile("nonexistent.txt", (err, data) => {
  if (err) {
    console.error(err.code); // ENOENT
    console.error(err.errno); // -2
    console.error(err.path); // nonexistent.txt
    console.error(err.syscall); // open
  }
});

// EACCES - Permission denied
// EADDRINUSE - Address already in use
// ECONNREFUSED - Connection refused
// ETIMEDOUT - Connection timed out
```

#### 3. User-specified Errors

Custom error classes for application-specific errors.

```javascript
// Custom error class
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.statusCode = 400;
  }
}

class DatabaseError extends Error {
  constructor(message, query) {
    super(message);
    this.name = "DatabaseError";
    this.query = query;
    this.statusCode = 500;
  }
}

class NotFoundError extends Error {
  constructor(message, resource) {
    super(message);
    this.name = "NotFoundError";
    this.resource = resource;
    this.statusCode = 404;
  }
}

// Usage
throw new ValidationError("Email is invalid", "email");
throw new NotFoundError("User not found", "User");
```

#### 4. Assertion Errors

From the `assert` module for testing conditions.

```javascript
const assert = require("assert");

try {
  assert.strictEqual(1, 2, "Values are not equal");
} catch (err) {
  console.error(err.name); // AssertionError
  console.error(err.message); // Values are not equal
}
```

### Synchronous Error Handling

Use `try/catch` blocks for synchronous code.

```javascript
// Basic try/catch
try {
  const data = JSON.parse("invalid json");
} catch (err) {
  console.error("Parse error:", err.message);
}

// Multiple error types
try {
  // Some operation
  const result = someOperation();
} catch (err) {
  if (err instanceof TypeError) {
    console.error("Type error:", err.message);
  } else if (err instanceof RangeError) {
    console.error("Range error:", err.message);
  } else {
    console.error("Unknown error:", err);
  }
}

// Finally block (always executes)
try {
  const file = fs.readFileSync("file.txt");
  processFile(file);
} catch (err) {
  console.error("Error:", err);
} finally {
  console.log("Cleanup operations");
}
```

### Asynchronous Error Handling

#### Callbacks (Error-first Pattern)

The first parameter is always the error object.

```javascript
const fs = require("fs");

// Error-first callback pattern
fs.readFile("file.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return; // Important: return after handling error
  }

  console.log("File content:", data);
});

// Nested callbacks with error handling
fs.readFile("file1.txt", (err, data1) => {
  if (err) return console.error(err);

  fs.readFile("file2.txt", (err, data2) => {
    if (err) return console.error(err);

    console.log("Both files read successfully");
  });
});

// Custom function with error-first callback
function divide(a, b, callback) {
  if (b === 0) {
    return callback(new Error("Division by zero"));
  }

  callback(null, a / b);
}

divide(10, 2, (err, result) => {
  if (err) return console.error(err);
  console.log("Result:", result);
});
```

#### Promises

Use `.catch()` to handle rejected promises.

```javascript
// Using .catch()
fetch("https://api.example.com/data")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => console.error("Error:", err));

// Chaining with error handling
Promise.resolve(5)
  .then((x) => x * 2)
  .then((x) => {
    if (x > 5) throw new Error("Too large");
    return x;
  })
  .then((x) => console.log(x))
  .catch((err) => console.error("Caught:", err));

// Finally block
fetch("https://api.example.com/data")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err))
  .finally(() => console.log("Cleanup"));

// Creating rejected promises
Promise.reject(new Error("Failed")).catch((err) => console.error(err));

// Promise.all error handling
Promise.all([fetch("url1"), fetch("url2"), fetch("url3")])
  .then((responses) => console.log("All succeeded"))
  .catch((err) => console.error("At least one failed:", err));

// Promise.allSettled (doesn't reject)
Promise.allSettled([
  Promise.resolve(1),
  Promise.reject("error"),
  Promise.resolve(3),
]).then((results) => {
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      console.log("Success:", result.value);
    } else {
      console.error("Failed:", result.reason);
    }
  });
});
```

#### Async/Await

Use `try/catch` with async/await.

```javascript
// Basic async/await error handling
async function fetchData() {
  try {
    const response = await fetch("https://api.example.com/data");
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching data:", err);
    throw err; // Re-throw if needed
  }
}

// Multiple awaits
async function processData() {
  try {
    const user = await getUser(userId);
    const posts = await getPosts(user.id);
    const comments = await getComments(posts[0].id);

    return { user, posts, comments };
  } catch (err) {
    console.error("Error in processData:", err);
    return null;
  }
}

// Handling specific errors
async function login(email, password) {
  try {
    const user = await User.findByEmail(email);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isValid = await user.validatePassword(password);

    if (!isValid) {
      throw new ValidationError("Invalid password");
    }

    return user;
  } catch (err) {
    if (err instanceof NotFoundError) {
      console.error("User not found");
    } else if (err instanceof ValidationError) {
      console.error("Invalid credentials");
    } else {
      console.error("Unexpected error:", err);
    }
    throw err;
  }
}

// Async/await with finally
async function updateUser(userId, data) {
  const transaction = await db.startTransaction();

  try {
    await User.update(userId, data);
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    return { success: false, error: err.message };
  } finally {
    await transaction.close();
  }
}
```

### Event Emitter Error Handling

Event emitters require special error handling.

```javascript
const EventEmitter = require("events");

// Basic error event
const emitter = new EventEmitter();

emitter.on("error", (err) => {
  console.error("Error occurred:", err);
});

// If no error listener, the error will crash the process!
emitter.emit("error", new Error("Something went wrong"));

// Streams (which are event emitters)
const fs = require("fs");
const stream = fs.createReadStream("file.txt");

stream.on("error", (err) => {
  console.error("Stream error:", err);
});

stream.on("data", (chunk) => {
  console.log("Received chunk:", chunk.length);
});

// HTTP server error handling
const http = require("http");

const server = http.createServer((req, res) => {
  res.end("Hello");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("Port is already in use");
  } else {
    console.error("Server error:", err);
  }
});

server.listen(3000);

// Client error handling
server.on("clientError", (err, socket) => {
  console.error("Client error:", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});
```

### Unhandled Errors

Handle uncaught exceptions and unhandled rejections.

```javascript
// Uncaught exceptions (synchronous errors)
process.on("uncaughtException", (err, origin) => {
  console.error("Uncaught Exception:", err);
  console.error("Origin:", origin);

  // Log to file or monitoring service
  logError(err);

  // Graceful shutdown
  process.exit(1);
});

// Unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);

  // Log to monitoring service
  logError(reason);

  // Optional: exit process
  // process.exit(1);
});

// Warning events
process.on("warning", (warning) => {
  console.warn("Warning:", warning.name);
  console.warn("Message:", warning.message);
  console.warn("Stack:", warning.stack);
});

// Example that triggers unhandled rejection
async function riskyOperation() {
  throw new Error("Async error");
}

// This will trigger unhandledRejection if not caught
riskyOperation();

// ✅ Better: Always catch or await
riskyOperation().catch((err) => console.error(err));
```

### Express.js Error Handling

Express requires special error-handling middleware.

```javascript
const express = require("express");
const app = express();

// Regular middleware
app.use(express.json());

// Routes
app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.json(user);
  } catch (err) {
    next(err); // Pass to error handler
  }
});

// Async wrapper to avoid try/catch in every route
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get(
  "/posts/:id",
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }

    res.json(post);
  })
);

// 404 handler (before error handler)
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.statusCode = 404;
  next(error);
});

// Error-handling middleware (4 parameters, must be last)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
  });

  // Send response
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

app.listen(3000);
```

### Real-World Examples

#### Example 1: Custom Error Classes

```javascript
// error-classes.js
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400);
    this.field = field;
    this.type = "validation";
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
    this.type = "authentication";
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403);
    this.type = "authorization";
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
    this.resource = resource;
    this.type = "not_found";
  }
}

class DatabaseError extends AppError {
  constructor(message, query) {
    super(message, 500, false);
    this.query = query;
    this.type = "database";
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
};
```

#### Example 2: Centralized Error Handler

```javascript
// error-handler.js
const { AppError } = require("./error-classes");

class ErrorHandler {
  // Handle operational errors
  handleError(err) {
    if (err.isOperational) {
      this.logError(err);
      return;
    }

    // Programming errors - more serious
    this.logError(err);
    this.crashGracefully();
  }

  // Log errors
  logError(err) {
    console.error({
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
    });

    // Send to monitoring service (Sentry, Datadog, etc.)
    if (process.env.NODE_ENV === "production") {
      // monitoringService.captureException(err);
    }
  }

  // Graceful shutdown
  crashGracefully() {
    console.error("Unhandled error, shutting down gracefully");
    process.exit(1);
  }

  // Check if error is trusted
  isTrustedError(err) {
    return err instanceof AppError && err.isOperational;
  }
}

const errorHandler = new ErrorHandler();

// Setup global error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  errorHandler.handleError(err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);

  const err = reason instanceof Error ? reason : new Error(String(reason));

  errorHandler.handleError(err);
});

module.exports = errorHandler;
```

#### Example 3: Express Error Middleware

```javascript
// error-middleware.js
const { AppError } = require("./error-classes");

// Convert errors to AppError
const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new AppError(message, statusCode, false);
  }

  next(error);
};

// Error handler
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Handle Mongoose errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate ${field}: ${err.keyValue[field]}`;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Log error
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });

  // Prepare response
  const response = {
    status: "error",
    statusCode,
    message,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorConverter, errorHandler };
```

#### Example 4: Database Error Handling

```javascript
// database-operations.js
const { DatabaseError, NotFoundError } = require("./error-classes");

class UserRepository {
  async findById(id) {
    try {
      const user = await User.findById(id);

      if (!user) {
        throw new NotFoundError("User");
      }

      return user;
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw err;
      }

      throw new DatabaseError("Failed to fetch user", `User.findById(${id})`);
    }
  }

  async create(userData) {
    try {
      const user = await User.create(userData);
      return user;
    } catch (err) {
      // Handle duplicate key error
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        throw new ValidationError(`${field} already exists`, field);
      }

      // Handle validation error
      if (err.name === "ValidationError") {
        const messages = Object.values(err.errors)
          .map((e) => e.message)
          .join(", ");
        throw new ValidationError(messages);
      }

      throw new DatabaseError("Failed to create user", "User.create");
    }
  }

  async update(id, data) {
    try {
      const user = await User.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        throw new NotFoundError("User");
      }

      return user;
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw err;
      }

      if (err.name === "ValidationError") {
        const messages = Object.values(err.errors)
          .map((e) => e.message)
          .join(", ");
        throw new ValidationError(messages);
      }

      throw new DatabaseError(
        "Failed to update user",
        `User.findByIdAndUpdate(${id})`
      );
    }
  }

  async delete(id) {
    try {
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        throw new NotFoundError("User");
      }

      return user;
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw err;
      }

      throw new DatabaseError(
        "Failed to delete user",
        `User.findByIdAndDelete(${id})`
      );
    }
  }
}

module.exports = new UserRepository();
```

#### Example 5: Retry Logic with Error Handling

```javascript
// retry-handler.js
async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < maxAttempts) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);

        if (onRetry) {
          onRetry(err, attempt, waitTime);
        }

        console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// Usage
async function fetchData() {
  return retry(
    async () => {
      const response = await fetch("https://api.example.com/data");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    {
      maxAttempts: 3,
      delay: 1000,
      backoff: 2,
      onRetry: (err, attempt, waitTime) => {
        console.log(`Retry attempt ${attempt} after error: ${err.message}`);
      },
    }
  );
}
```

#### Example 6: Graceful Shutdown

```javascript
// graceful-shutdown.js
class GracefulShutdown {
  constructor(server) {
    this.server = server;
    this.isShuttingDown = false;
  }

  async shutdown(signal) {
    if (this.isShuttingDown) {
      console.log("Shutdown already in progress");
      return;
    }

    this.isShuttingDown = true;
    console.log(`\n${signal} received, starting graceful shutdown`);

    // Stop accepting new connections
    this.server.close(async (err) => {
      if (err) {
        console.error("Error closing server:", err);
        process.exit(1);
      }

      console.log("HTTP server closed");

      try {
        // Close database connections
        await this.closeDatabaseConnections();

        // Clear pending jobs
        await this.clearPendingJobs();

        // Save state
        await this.saveState();

        console.log("Graceful shutdown completed");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
      }
    });

    // Force exit after timeout
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 30000); // 30 seconds
  }

  async closeDatabaseConnections() {
    console.log("Closing database connections");
    // await mongoose.connection.close();
    // await redis.quit();
  }

  async clearPendingJobs() {
    console.log("Clearing pending jobs");
    // Clear job queues, etc.
  }

  async saveState() {
    console.log("Saving application state");
    // Save any necessary state
  }
}

// Setup
const server = app.listen(3000);
const gracefulShutdown = new GracefulShutdown(server);

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown.shutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown.shutdown("SIGINT"));

// Handle errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown.shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  gracefulShutdown.shutdown("unhandledRejection");
});
```

#### Example 7: Request Validation

```javascript
// validation.js
const { ValidationError } = require("./error-classes");

function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(", ");

      return next(new ValidationError(messages));
    }

    req.validatedData = value;
    next();
  };
}

// Joi schema
const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
  age: Joi.number().integer().min(18).max(120),
});

// Usage
app.post("/users", validateRequest(userSchema), async (req, res, next) => {
  try {
    const user = await User.create(req.validatedData);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});
```

#### Example 8: Error Monitoring Integration

```javascript
// monitoring.js
const Sentry = require("@sentry/node");

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Sentry request handler (before routes)
app.use(Sentry.Handlers.requestHandler());

// Sentry tracing handler
app.use(Sentry.Handlers.tracingHandler());

// Your routes here
app.use("/api", routes);

// Sentry error handler (before other error handlers)
app.use(Sentry.Handlers.errorHandler());

// Custom error handler
app.use((err, req, res, next) => {
  // Add context to Sentry
  Sentry.configureScope((scope) => {
    scope.setUser({
      id: req.user?.id,
      email: req.user?.email,
    });

    scope.setExtra("body", req.body);
    scope.setExtra("query", req.query);
    scope.setTag("path", req.path);
  });

  // Capture exception in Sentry
  if (err.statusCode >= 500) {
    Sentry.captureException(err);
  }

  // Send response
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message,
  });
});
```

### Error Handling Best Practices

```javascript
// ✅ 1. Always handle errors in callbacks
fs.readFile("file.txt", (err, data) => {
  if (err) {
    console.error("Error:", err);
    return; // Return to prevent further execution
  }
  console.log(data);
});

// ✅ 2. Use try/catch with async/await
async function getData() {
  try {
    const data = await fetchData();
    return data;
  } catch (err) {
    console.error("Error:", err);
    throw err; // Re-throw if needed
  }
}

// ✅ 3. Create custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ✅ 4. Use error-first callbacks
function myFunction(callback) {
  if (error) {
    return callback(new Error("Failed"));
  }
  callback(null, result);
}

// ✅ 5. Handle unhandled rejections
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// ✅ 6. Always listen to 'error' events
emitter.on("error", (err) => {
  console.error("Error:", err);
});

// ✅ 7. Use centralized error handling
app.use((err, req, res, next) => {
  errorHandler.handleError(err);
  res.status(err.statusCode || 500).json({ error: err.message });
});

// ✅ 8. Log errors properly
console.error({
  message: err.message,
  stack: err.stack,
  timestamp: new Date().toISOString(),
});

// ✅ 9. Validate input data
const { error, value } = schema.validate(data);
if (error) {
  throw new ValidationError(error.message);
}

// ✅ 10. Implement graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
```

### Common Mistakes

```javascript
// ❌ 1. Not handling errors in callbacks
fs.readFile("file.txt", (err, data) => {
  console.log(data); // Will crash if error!
});

// ❌ 2. Empty catch blocks
try {
  riskyOperation();
} catch (err) {
  // Silent failure - BAD!
}

// ❌ 3. Not returning after error
if (error) {
  console.error(error);
  // Code continues executing!
}

// ❌ 4. Swallowing errors
promise.catch(() => {}); // Error ignored!

// ❌ 5. Not awaiting promises
async function bad() {
  fetchData(); // Unhandled rejection!
}

// ❌ 6. Mixing callbacks and promises
function mixed(callback) {
  return new Promise((resolve) => {
    // Don't mix these patterns!
    callback(null, result);
    resolve(result);
  });
}

// ❌ 7. Throwing in callbacks
fs.readFile("file.txt", (err, data) => {
  throw new Error("Error"); // Won't be caught!
});

// ❌ 8. Not using error-first pattern
function wrongPattern(callback) {
  callback(result, error); // Wrong order!
}
```

### Error Handling Comparison

| Method              | Use Case         | Syntax                 | Pros               | Cons                 |
| ------------------- | ---------------- | ---------------------- | ------------------ | -------------------- |
| **try/catch**       | Synchronous code | `try { } catch(e) { }` | Simple, familiar   | Only sync code       |
| **Callbacks**       | Async operations | `(err, data) => { }`   | Node.js standard   | Callback hell        |
| **Promises**        | Async operations | `.catch(err => { })`   | Chainable, clean   | Can forget .catch()  |
| **Async/await**     | Async operations | `try/await catch`      | Readable, linear   | Requires try/catch   |
| **Event listeners** | Event emitters   | `.on('error', fn)`     | Multiple listeners | Must remember to add |

### Key Takeaways

- ✅ Node.js has **multiple error handling patterns** for different contexts
- ✅ Use **try/catch** for synchronous code
- ✅ Use **error-first callbacks** (err as first parameter)
- ✅ Use **.catch()** for promises or try/catch with async/await
- ✅ Always listen to **'error' events** on event emitters
- ✅ Express error handlers require **4 parameters** and must be **last**
- ✅ Handle **uncaughtException** and **unhandledRejection**
- ✅ Create **custom error classes** for better organization
- ✅ Use **centralized error handling** for consistency
- ✅ Always **return after handling errors** in callbacks
- ✅ Never leave **empty catch blocks** (silent failures)
- ✅ **Log errors** with context (timestamp, user, path, etc.)
- ✅ Implement **graceful shutdown** for production
- ✅ Use **monitoring tools** (Sentry, Datadog) in production
- ✅ **Validate input** to catch errors early

### Further Reading

- [Node.js Error Handling](https://nodejs.org/api/errors.html)
- [Error Handling in Express](https://expressjs.com/en/guide/error-handling.html)
- [Async Error Handling](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- [Promise Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#error_handling)
- [Production Best Practices: Error Handling](https://expressjs.com/en/advanced/best-practice-performance.html#handle-exceptions-properly)
