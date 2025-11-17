# How do you implement error handling middleware in Express?

Error handling middleware in Express is a crucial component for managing errors gracefully, providing meaningful responses to clients, and maintaining application stability. Express has a special type of middleware function specifically designed for error handling.

## Basic Error Handling Middleware

Error handling middleware functions have four parameters: `(err, req, res, next)`. Express recognizes error handling middleware by this four-parameter signature.

### Simple Error Handler

```javascript
const express = require("express");
const app = express();

// Basic error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Default error response
  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  });
};

// Sample routes that might throw errors
app.get("/test-error", (req, res, next) => {
  // Synchronous error - will be caught by Express automatically
  throw new Error("This is a test error");
});

app.get("/async-error", async (req, res, next) => {
  try {
    // Simulate async operation that might fail
    const result = await someAsyncOperation();
    res.json(result);
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
});

// Register error handling middleware (must be last)
app.use(errorHandler);

async function someAsyncOperation() {
  throw new Error("Async operation failed");
}

app.listen(3000);
```

## Comprehensive Error Handling System

### Custom Error Classes

```javascript
// Custom error classes for different types of errors
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED");
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}

class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR");
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = "External service unavailable") {
    super(`${service}: ${message}`, 503, "EXTERNAL_SERVICE_ERROR");
  }
}

// Export custom errors
module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
};
```

### Advanced Error Handler

```javascript
const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} = require("./errors");

// Advanced error handling middleware
const advancedErrorHandler = (err, req, res, next) => {
  // Create error object
  const error = {
    timestamp: new Date().toISOString(),
    requestId: req.id || generateRequestId(),
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  };

  // Handle different types of errors
  if (err instanceof AppError) {
    // Custom application errors
    error.type = "APPLICATION_ERROR";
    error.code = err.code;
    error.message = err.message;
    error.statusCode = err.statusCode;
    error.details = err.details;

    // Log based on severity
    if (err.statusCode >= 500) {
      console.error("Application Error:", { ...error, stack: err.stack });
    } else {
      console.warn("Client Error:", error);
    }
  } else if (err.name === "ValidationError") {
    // Mongoose/Joi validation errors
    error.type = "VALIDATION_ERROR";
    error.code = "VALIDATION_FAILED";
    error.message = "Validation failed";
    error.statusCode = 400;
    error.details = formatValidationErrors(err);

    console.warn("Validation Error:", error);
  } else if (err.name === "CastError") {
    // MongoDB cast errors (invalid ObjectId, etc.)
    error.type = "CAST_ERROR";
    error.code = "INVALID_DATA_TYPE";
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = 400;

    console.warn("Cast Error:", error);
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    error.type = "DUPLICATE_KEY_ERROR";
    error.code = "DUPLICATE_ENTRY";
    error.message = "Duplicate entry detected";
    error.statusCode = 409;
    error.details = formatDuplicateKeyError(err);

    console.warn("Duplicate Key Error:", error);
  } else if (err.name === "JsonWebTokenError") {
    // JWT errors
    error.type = "JWT_ERROR";
    error.code = "INVALID_TOKEN";
    error.message = "Invalid authentication token";
    error.statusCode = 401;

    console.warn("JWT Error:", error);
  } else if (err.name === "TokenExpiredError") {
    // Expired JWT
    error.type = "TOKEN_EXPIRED";
    error.code = "TOKEN_EXPIRED";
    error.message = "Authentication token has expired";
    error.statusCode = 401;

    console.warn("Token Expired:", error);
  } else if (err.name === "MulterError") {
    // File upload errors
    error.type = "FILE_UPLOAD_ERROR";
    error.statusCode = 400;

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        error.message = "File too large";
        error.code = "FILE_TOO_LARGE";
        break;
      case "LIMIT_FILE_COUNT":
        error.message = "Too many files";
        error.code = "TOO_MANY_FILES";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        error.message = `Unexpected field: ${err.field}`;
        error.code = "UNEXPECTED_FILE_FIELD";
        break;
      default:
        error.message = "File upload failed";
        error.code = "UPLOAD_FAILED";
    }

    console.warn("File Upload Error:", error);
  } else {
    // Unknown/unexpected errors
    error.type = "UNKNOWN_ERROR";
    error.code = "INTERNAL_SERVER_ERROR";
    error.message =
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message;
    error.statusCode = 500;

    // Always log unknown errors with full details
    console.error("Unknown Error:", {
      ...error,
      originalMessage: err.message,
      stack: err.stack,
      name: err.name,
    });
  }

  // Remove sensitive information in production
  if (process.env.NODE_ENV === "production") {
    delete error.stack;
    if (error.statusCode >= 500) {
      delete error.details;
    }
  } else {
    // Include stack trace in development
    error.stack = err.stack;
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    error: {
      type: error.type,
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      requestId: error.requestId,
      ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
    },
  });
};

// Helper functions
function generateRequestId() {
  return Math.random().toString(36).substr(2, 9);
}

function formatValidationErrors(err) {
  if (err.details) {
    // Joi validation errors
    return err.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
      value: detail.context?.value,
    }));
  } else if (err.errors) {
    // Mongoose validation errors
    return Object.keys(err.errors).map((field) => ({
      field: field,
      message: err.errors[field].message,
      value: err.errors[field].value,
    }));
  }
  return null;
}

function formatDuplicateKeyError(err) {
  const field = Object.keys(err.keyPattern)[0];
  return {
    field: field,
    message: `${field} already exists`,
    value: err.keyValue[field],
  };
}

module.exports = { advancedErrorHandler };
```

## Async Error Wrapper

### Async Error Handling Utility

```javascript
// Utility to wrap async route handlers
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Alternative implementation with more detailed error context
const asyncErrorWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Add request context to error
      error.requestContext = {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString(),
      };
      next(error);
    });
  };
};

// Usage examples
app.get(
  "/users/:id",
  asyncErrorHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFoundError("User");
    }
    res.json(user);
  })
);

app.post(
  "/users",
  asyncErrorWrapper(async (req, res) => {
    // Validate input
    const validationResult = await validateUserInput(req.body);
    if (!validationResult.isValid) {
      throw new ValidationError("Invalid user data", validationResult.errors);
    }

    // Create user
    const user = await User.create(req.body);
    res.status(201).json(user);
  })
);

// Database operation example
app.get(
  "/posts",
  asyncErrorHandler(async (req, res) => {
    try {
      const posts = await Post.find({}).populate("author");
      res.json(posts);
    } catch (dbError) {
      throw new DatabaseError("Failed to retrieve posts");
    }
  })
);

async function validateUserInput(data) {
  // Mock validation - implement with Joi, express-validator, etc.
  const errors = [];
  if (!data.email)
    errors.push({ field: "email", message: "Email is required" });
  if (!data.name) errors.push({ field: "name", message: "Name is required" });

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}
```

## Specialized Error Handlers

### API Error Response Handler

```javascript
// API-specific error handler with structured responses
const apiErrorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  // Base error response structure
  const errorResponse = {
    success: false,
    error: {
      message: err.message,
      type: err.constructor.name,
      timestamp: new Date().toISOString(),
    },
  };

  // Add request tracking
  if (req.requestId) {
    errorResponse.error.requestId = req.requestId;
  }

  // Handle specific error types
  let statusCode = 500;

  if (err instanceof ValidationError) {
    statusCode = 400;
    errorResponse.error.code = "VALIDATION_ERROR";
    errorResponse.error.details = err.details;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorResponse.error.code = "NOT_FOUND";
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    errorResponse.error.code = "UNAUTHORIZED";
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    errorResponse.error.code = "FORBIDDEN";
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    errorResponse.error.code = "CONFLICT";
  } else if (err instanceof RateLimitError) {
    statusCode = 429;
    errorResponse.error.code = "RATE_LIMIT_EXCEEDED";

    // Add rate limit headers
    res.set({
      "X-RateLimit-Limit": err.limit,
      "X-RateLimit-Remaining": err.remaining,
      "X-RateLimit-Reset": err.resetTime,
    });
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    errorResponse.error.code = err.code || "CUSTOM_ERROR";
  } else {
    // Unknown error
    errorResponse.error.code = "INTERNAL_SERVER_ERROR";
    if (isProduction) {
      errorResponse.error.message = "Something went wrong";
    }
  }

  // Add debug information in development
  if (isDevelopment) {
    errorResponse.debug = {
      stack: err.stack,
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body,
      },
    };
  }

  // Log error
  const logLevel = statusCode >= 500 ? "error" : "warn";
  console[logLevel]("API Error:", {
    message: err.message,
    statusCode: statusCode,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    stack: isDevelopment ? err.stack : undefined,
  });

  res.status(statusCode).json(errorResponse);
};
```

### Database Error Handler

```javascript
// Specialized handler for database errors
const dbErrorHandler = (err, req, res, next) => {
  // MongoDB/Mongoose specific errors
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    switch (err.code) {
      case 11000: // Duplicate key
        const field = Object.keys(err.keyPattern)[0];
        const duplicateError = new ConflictError(`${field} already exists`);
        duplicateError.details = {
          field: field,
          value: err.keyValue[field],
        };
        return next(duplicateError);

      case 121: // Document validation failed
        return next(new ValidationError("Document validation failed"));

      default:
        return next(
          new DatabaseError(`Database operation failed: ${err.message}`)
        );
    }
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const validationErrors = Object.keys(err.errors).map((field) => ({
      field: field,
      message: err.errors[field].message,
      value: err.errors[field].value,
      kind: err.errors[field].kind,
    }));

    const validationError = new ValidationError("Validation failed");
    validationError.details = validationErrors;
    return next(validationError);
  }

  // Mongoose cast errors
  if (err.name === "CastError") {
    const castError = new ValidationError(`Invalid ${err.path}: ${err.value}`);
    castError.details = {
      field: err.path,
      value: err.value,
      expectedType: err.kind,
    };
    return next(castError);
  }

  // Pass to next error handler
  next(err);
};
```

## Error Logging and Monitoring

### Advanced Error Logging

```javascript
const winston = require("winston");
const { format } = winston;

// Configure winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // File transport for errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Console transport for development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

// Error handler with advanced logging
const loggingErrorHandler = (err, req, res, next) => {
  const errorId = generateErrorId();
  const userId = req.user?.id || "anonymous";

  // Create detailed error log
  const errorLog = {
    errorId: errorId,
    message: err.message,
    name: err.name,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    user: {
      id: userId,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      headers: filterSensitiveHeaders(req.headers),
      body: filterSensitiveData(req.body),
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // Log based on severity
  if (err.statusCode && err.statusCode < 500) {
    logger.warn("Client Error", errorLog);
  } else {
    logger.error("Server Error", errorLog);
  }

  // Send error ID to client for tracking
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.statusCode < 500 ? err.message : "Internal Server Error",
      errorId: errorId,
      timestamp: new Date().toISOString(),
    },
  });
};

// Helper functions
function generateErrorId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function filterSensitiveHeaders(headers) {
  const filtered = { ...headers };
  delete filtered.authorization;
  delete filtered.cookie;
  delete filtered["x-api-key"];
  return filtered;
}

function filterSensitiveData(data) {
  if (!data || typeof data !== "object") return data;

  const filtered = { ...data };
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "key",
    "ssn",
    "creditCard",
  ];

  sensitiveFields.forEach((field) => {
    if (filtered[field]) {
      filtered[field] = "[REDACTED]";
    }
  });

  return filtered;
}
```

### Error Monitoring Integration

```javascript
// Integration with external monitoring services
const Sentry = require("@sentry/node");

// Initialize Sentry (optional)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

// Monitoring error handler
const monitoringErrorHandler = (err, req, res, next) => {
  const errorContext = {
    user: {
      id: req.user?.id,
      email: req.user?.email,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      params: req.params,
      query: req.query,
    },
    extra: {
      timestamp: new Date().toISOString(),
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    },
  };

  // Send to Sentry if available and it's a server error
  if (process.env.SENTRY_DSN && (!err.statusCode || err.statusCode >= 500)) {
    Sentry.withScope((scope) => {
      scope.setUser(errorContext.user);
      scope.setContext("request", errorContext.request);
      scope.setExtras(errorContext.extra);
      Sentry.captureException(err);
    });
  }

  // Send to custom monitoring service
  if (process.env.CUSTOM_MONITORING_ENDPOINT) {
    sendToCustomMonitoring({
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      context: errorContext,
    }).catch((monitoringError) => {
      logger.error(
        "Failed to send error to monitoring service:",
        monitoringError
      );
    });
  }

  next(err);
};

async function sendToCustomMonitoring(errorData) {
  // Implement custom monitoring service integration
  console.log("Sending to custom monitoring:", errorData);
}
```

## Complete Error Handling Setup

### Full Application Setup

```javascript
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
} = require("./errors");

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  handler: (req, res, next) => {
    const error = new RateLimitError("Too many requests");
    error.limit = 100;
    error.remaining = 0;
    error.resetTime = new Date(Date.now() + 15 * 60 * 1000);
    next(error);
  },
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

// Sample routes
app.get("/api/test/validation-error", (req, res, next) => {
  const error = new ValidationError("Invalid input data");
  error.details = [
    { field: "email", message: "Email is required" },
    { field: "age", message: "Age must be a number" },
  ];
  next(error);
});

app.get("/api/test/not-found", (req, res, next) => {
  next(new NotFoundError("User"));
});

app.get("/api/test/unauthorized", (req, res, next) => {
  next(new UnauthorizedError("Invalid credentials"));
});

app.get("/api/test/forbidden", (req, res, next) => {
  next(new ForbiddenError("Access denied"));
});

app.get("/api/test/server-error", (req, res, next) => {
  next(new Error("Database connection failed"));
});

// 404 handler for undefined routes
app.use("*", (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl}`);
  next(error);
});

// Error handling middleware stack (order matters)
app.use(dbErrorHandler); // Handle database-specific errors
app.use(monitoringErrorHandler); // Send errors to monitoring services
app.use(loggingErrorHandler); // Log errors
app.use(apiErrorHandler); // Send API responses

// Fallback error handler
app.use((err, req, res, next) => {
  console.error("Fallback error handler:", err);
  res.status(500).json({
    success: false,
    error: {
      message: "Something went wrong",
      timestamp: new Date().toISOString(),
    },
  });
});

// Graceful error handling for unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Optionally exit the process
  // process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Gracefully close the server and exit
  process.exit(1);
});

function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

app.listen(3000, () => {
  console.log("Server running on port 3000 with comprehensive error handling");
});
```

## Testing Error Handlers

### Error Handler Testing

```javascript
const request = require("supertest");
const app = require("../app");

describe("Error Handling Middleware", () => {
  test("should handle validation errors properly", async () => {
    const response = await request(app)
      .get("/api/test/validation-error")
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: expect.any(Array),
      },
    });

    expect(response.body.error.details).toHaveLength(2);
    expect(response.body.error.timestamp).toBeDefined();
  });

  test("should handle not found errors", async () => {
    const response = await request(app).get("/api/test/not-found").expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "User not found",
      },
    });
  });

  test("should handle server errors", async () => {
    const response = await request(app)
      .get("/api/test/server-error")
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });

  test("should handle undefined routes", async () => {
    const response = await request(app)
      .get("/api/nonexistent-route")
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: expect.stringContaining("Route GET /api/nonexistent-route"),
      },
    });
  });
});
```

## Summary

### Key Error Handling Components:

1. **Error Handling Middleware**

   - Four-parameter function signature: `(err, req, res, next)`
   - Must be registered after all other middleware and routes
   - Can have multiple error handlers in a stack

2. **Custom Error Classes**

   - Extend base `Error` class for specific error types
   - Include statusCode, error codes, and additional details
   - Maintain operational vs programming error distinction

3. **Async Error Handling**

   - Use wrapper functions to catch async errors
   - Always call `next(error)` in async route handlers
   - Handle Promise rejections properly

4. **Error Response Structure**
   - Consistent error response format
   - Include error codes, messages, and timestamps
   - Provide request tracking with unique IDs

### Best Practices:

- **Centralized Error Handling**: Use middleware for consistent error processing
- **Error Classification**: Create custom error classes for different scenarios
- **Async Safety**: Always wrap async functions to catch errors
- **Security**: Don't expose sensitive information in production errors
- **Logging**: Implement comprehensive error logging with context
- **Monitoring**: Integrate with external monitoring services
- **Testing**: Test all error scenarios thoroughly

### Production Considerations:

- **Environment-Specific Behavior**: Different error details for dev/production
- **Rate Limiting**: Handle rate limit errors gracefully
- **Database Errors**: Transform database-specific errors to user-friendly messages
- **File Upload Errors**: Handle Multer and other middleware errors
- **Security Headers**: Include appropriate security headers in error responses

Error handling middleware is essential for building robust Express applications that gracefully handle failures and provide meaningful feedback to clients while maintaining security and debuggability.
