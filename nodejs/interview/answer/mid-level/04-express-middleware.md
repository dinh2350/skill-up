# What is middleware in the context of Express.js?

## Short Answer

**Middleware** in Express.js are functions that have access to the request object (`req`), response object (`res`), and the next middleware function (`next`) in the application's request-response cycle. Middleware can execute code, modify request/response objects, end the request-response cycle, or call the next middleware.

```javascript
const express = require("express");
const app = express();

// Basic middleware function
app.use((req, res, next) => {
  console.log("Time:", Date.now());
  next(); // Pass control to next middleware
});

// Route handler (also middleware)
app.get("/", (req, res) => {
  res.send("Hello World");
});
```

**Key characteristics:**

- Execute in **sequential order** (order matters!)
- Can **modify** req and res objects
- Can **end** the request-response cycle
- Must call **`next()`** to pass control (or send response)

## Detailed Answer

### What is Middleware?

Middleware functions are the core of Express.js applications. They sit between the raw HTTP request and the final route handler.

#### Request-Response Cycle

```
Client Request → Middleware 1 → Middleware 2 → Middleware 3 → Route Handler → Response
                     ↓              ↓              ↓              ↓
                   next()        next()        next()        res.send()
```

#### Basic Middleware Structure

```javascript
function middleware(req, res, next) {
  // 1. Execute any code
  console.log("Middleware executed");

  // 2. Modify request or response objects
  req.customProperty = "value";

  // 3. End request-response cycle
  // res.send('Done');

  // 4. Call next middleware
  next();
}

app.use(middleware);
```

### Types of Middleware

#### 1. Application-level Middleware

Bound to the app object using `app.use()` or `app.METHOD()`.

```javascript
const express = require("express");
const app = express();

// Applies to all routes
app.use((req, res, next) => {
  console.log("Time:", Date.now());
  next();
});

// Applies to specific path
app.use("/user", (req, res, next) => {
  console.log("User route accessed");
  next();
});

// Applies to specific method and path
app.get("/user/:id", (req, res, next) => {
  res.send("User info");
});
```

#### 2. Router-level Middleware

Works like application-level but bound to `express.Router()`.

```javascript
const express = require("express");
const router = express.Router();

// Router-level middleware
router.use((req, res, next) => {
  console.log("Router middleware");
  next();
});

// Router-level route
router.get("/profile", (req, res) => {
  res.send("Profile page");
});

// Mount router
app.use("/user", router);
```

#### 3. Error-handling Middleware

Has **four arguments** (err, req, res, next). Must be defined **last**.

```javascript
// Regular middleware (3 arguments)
app.use((req, res, next) => {
  next();
});

// Error-handling middleware (4 arguments)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
```

#### 4. Built-in Middleware

Express provides built-in middleware functions.

```javascript
// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

// Parse raw bodies
app.use(express.raw());

// Parse text bodies
app.use(express.text());
```

#### 5. Third-party Middleware

Popular npm packages for common tasks.

```javascript
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

// HTTP request logger
app.use(morgan("combined"));

// Enable CORS
app.use(cors());

// Security headers
app.use(helmet());

// Compress responses
app.use(compression());
```

### Middleware Execution Order

Order matters! Middleware executes in the order it's defined.

```javascript
const express = require("express");
const app = express();

// 1. First middleware
app.use((req, res, next) => {
  console.log("1. First");
  next();
});

// 2. Second middleware
app.use((req, res, next) => {
  console.log("2. Second");
  next();
});

// 3. Route handler
app.get("/", (req, res) => {
  console.log("3. Route handler");
  res.send("Done");
});

// Output when GET / is requested:
// 1. First
// 2. Second
// 3. Route handler
```

### The next() Function

The `next()` function passes control to the next middleware.

```javascript
// ✅ Call next() to continue
app.use((req, res, next) => {
  console.log("Processing...");
  next(); // Continue to next middleware
});

// ❌ Without next(), request hangs
app.use((req, res, next) => {
  console.log("Processing...");
  // Request hangs here!
});

// ✅ Or send response to end cycle
app.use((req, res, next) => {
  console.log("Processing...");
  res.send("Done"); // End cycle, no next() needed
});

// Pass error to error handler
app.use((req, res, next) => {
  const error = new Error("Something wrong");
  next(error); // Skip to error-handling middleware
});
```

### Middleware with Path and Method

```javascript
// All methods, specific path
app.use("/api", (req, res, next) => {
  console.log("API route");
  next();
});

// Specific method and path
app.get("/users", (req, res, next) => {
  console.log("GET users");
  next();
});

app.post("/users", (req, res, next) => {
  console.log("POST users");
  next();
});

// Multiple paths
app.use(["/api", "/v1"], (req, res, next) => {
  console.log("API or V1");
  next();
});

// Multiple middleware for one route
app.get(
  "/users",
  (req, res, next) => {
    console.log("First middleware");
    next();
  },
  (req, res, next) => {
    console.log("Second middleware");
    res.send("Users");
  }
);
```

### Real-World Examples

#### Example 1: Authentication Middleware

```javascript
// Authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verify token (using JWT for example)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user to request
    next(); // Continue to next middleware
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Use authentication middleware
app.get("/profile", authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.get("/protected", authenticate, (req, res) => {
  res.json({ message: "Protected data", user: req.user });
});
```

#### Example 2: Logging Middleware

```javascript
// Request logging middleware
function logger(req, res, next) {
  const start = Date.now();

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}

app.use(logger);

// Output example:
// GET /users 200 45ms
// POST /users 201 120ms
```

#### Example 3: Request Validation Middleware

```javascript
const { body, validationResult } = require("express-validator");

// Validation middleware
const validateUser = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("name").trim().notEmpty(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Use validation middleware
app.post("/register", validateUser, (req, res) => {
  // req.body is validated
  const { email, password, name } = req.body;
  res.json({ message: "User registered" });
});
```

#### Example 4: Error Handling Middleware

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Route with async handler
app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    res.json({ user });
  })
);

// 404 handler (before error handler)
app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error
  console.error(err);

  // Send response
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});
```

#### Example 5: Rate Limiting Middleware

```javascript
const rateLimit = require("express-rate-limit");

// Create rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to all routes
app.use(limiter);

// Apply to specific routes only
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 requests per minute
});

app.post("/login", strictLimiter, (req, res) => {
  // Login logic
});
```

#### Example 6: CORS Middleware

```javascript
const cors = require("cors");

// Enable CORS for all routes
app.use(cors());

// CORS with options
app.use(
  cors({
    origin: ["https://example.com", "https://app.example.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Total-Count"],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Custom CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = ["https://example.com"];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});
```

#### Example 7: Request Body Parsing

```javascript
const express = require("express");
const app = express();

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Custom body parser for specific content type
app.use((req, res, next) => {
  if (req.is("text/plain")) {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      req.body = data;
      next();
    });
  } else {
    next();
  }
});
```

#### Example 8: Session Middleware

```javascript
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const redis = require("redis");

// Create Redis client
const redisClient = redis.createClient({
  host: "localhost",
  port: 6379,
});

// Configure session middleware
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Use session in routes
app.post("/login", (req, res) => {
  req.session.userId = user.id;
  res.json({ message: "Logged in" });
});

app.get("/profile", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ userId: req.session.userId });
});
```

### Middleware Patterns

#### Pattern 1: Conditional Middleware

```javascript
// Execute middleware based on condition
function conditionalMiddleware(condition, middleware) {
  return (req, res, next) => {
    if (condition(req)) {
      return middleware(req, res, next);
    }
    next();
  };
}

// Usage
app.use(
  conditionalMiddleware((req) => req.path.startsWith("/api"), authenticate)
);
```

#### Pattern 2: Middleware Factory

```javascript
// Create middleware with options
function createLogger(options = {}) {
  const format = options.format || "combined";

  return (req, res, next) => {
    if (format === "simple") {
      console.log(`${req.method} ${req.path}`);
    } else {
      console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    }
    next();
  };
}

// Usage
app.use(createLogger({ format: "simple" }));
```

#### Pattern 3: Middleware Chain

```javascript
// Create reusable middleware chains
const authMiddleware = [authenticate, checkPermissions, rateLimiter];

// Apply chain to routes
app.get("/admin", authMiddleware, (req, res) => {
  res.send("Admin panel");
});

app.post("/admin/users", authMiddleware, (req, res) => {
  res.send("Create user");
});
```

#### Pattern 4: Async Middleware Wrapper

```javascript
// Wrapper to catch async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
app.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.find();
    res.json(users);
  })
);
```

### Complete Application Example

```javascript
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

const app = express();

// 1. Security middleware (first)
app.use(helmet());

// 2. CORS
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);

// 3. Logging
app.use(morgan("combined"));

// 4. Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. Compression
app.use(compression());

// 6. Custom middleware
app.use((req, res, next) => {
  req.requestTime = Date.now();
  next();
});

// 7. Static files
app.use("/public", express.static("public"));

// 8. Routes
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

app.get("/api/users", authenticate, (req, res) => {
  res.json({ users: [] });
});

// 9. 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Not found" });
});

// 10. Error handler (last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### Middleware Best Practices

```javascript
// ✅ 1. Order matters - security and parsing first
app.use(helmet());
app.use(express.json());
app.use(routes);
app.use(errorHandler);

// ✅ 2. Always call next() or send response
app.use((req, res, next) => {
  console.log("Logged");
  next(); // Don't forget this!
});

// ✅ 3. Use error-handling middleware with 4 parameters
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// ✅ 4. Return after sending response
app.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized"); // Return!
  }
  next();
});

// ✅ 5. Handle async errors
app.get("/users", async (req, res, next) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    next(err); // Pass to error handler
  }
});

// ✅ 6. Use middleware factories for reusability
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).send("Forbidden");
  }
  next();
};

app.get("/admin", requireRole("admin"), handler);

// ✅ 7. Keep middleware focused (single responsibility)
// ❌ BAD
app.use((req, res, next) => {
  authenticate(req);
  checkPermissions(req);
  logRequest(req);
  next();
});

// ✅ GOOD
app.use(authenticate);
app.use(checkPermissions);
app.use(logRequest);

// ✅ 8. Document middleware behavior
/**
 * Authenticates user via JWT token
 * Attaches user object to req.user
 * Returns 401 if authentication fails
 */
function authenticate(req, res, next) {
  // Implementation
}

// ✅ 9. Use descriptive names
// ❌ BAD: middleware1, mw, handler
// ✅ GOOD: authenticate, validateUser, checkPermissions

// ✅ 10. Group related middleware
const authMiddleware = {
  authenticate,
  checkPermissions,
  requireRole,
};

app.use("/admin", [
  authMiddleware.authenticate,
  authMiddleware.requireRole("admin"),
]);
```

### Common Mistakes

```javascript
// ❌ 1. Forgetting to call next()
app.use((req, res, next) => {
  console.log("Processing");
  // Request hangs!
});

// ✅ Fix
app.use((req, res, next) => {
  console.log("Processing");
  next();
});

// ❌ 2. Calling next() after sending response
app.use((req, res, next) => {
  res.send("Done");
  next(); // Error: Cannot set headers after sent
});

// ✅ Fix
app.use((req, res, next) => {
  res.send("Done");
  // Don't call next() after response
});

// ❌ 3. Not handling async errors
app.get("/users", async (req, res) => {
  const users = await User.find(); // Unhandled promise rejection!
  res.json(users);
});

// ✅ Fix
app.get("/users", async (req, res, next) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// ❌ 4. Wrong order - error handler not last
app.use(errorHandler);
app.use(routes); // Error handler won't catch these!

// ✅ Fix
app.use(routes);
app.use(errorHandler); // Last!

// ❌ 5. Modifying res after response sent
app.use((req, res, next) => {
  res.send("First");
  next();
});

app.use((req, res, next) => {
  res.send("Second"); // Error!
});

// ✅ Fix - return after response
app.use((req, res, next) => {
  return res.send("First"); // Return stops execution
});
```

### Middleware Comparison Table

| Type            | Arguments             | Runs          | Use Case          | Example          |
| --------------- | --------------------- | ------------- | ----------------- | ---------------- |
| **Application** | (req, res, next)      | All routes    | Global logic      | Logging, parsing |
| **Router**      | (req, res, next)      | Router routes | Modular routes    | API versioning   |
| **Error**       | (err, req, res, next) | On errors     | Error handling    | 500 errors       |
| **Built-in**    | Varies                | As configured | Common tasks      | express.json()   |
| **Third-party** | Varies                | As configured | External features | morgan, cors     |

### Key Takeaways

- ✅ Middleware are **functions** with access to req, res, next
- ✅ Execute in **sequential order** (order matters!)
- ✅ Must call **next()** to continue or send **response** to end
- ✅ Can **modify** req/res objects
- ✅ **5 types**: application, router, error, built-in, third-party
- ✅ Error handlers have **4 parameters** (err, req, res, next)
- ✅ Error handlers must be defined **last**
- ✅ Use **asyncHandler** wrapper for async middleware
- ✅ Return after sending response to prevent errors
- ✅ Keep middleware **focused** (single responsibility)
- ✅ Common uses: **authentication, logging, validation, error handling**
- ✅ Built-in middleware: **express.json(), express.static()**
- ✅ Popular third-party: **morgan, cors, helmet, compression**
- ✅ Always handle **async errors** with try/catch or wrapper

### Further Reading

- [Express.js Middleware Documentation](https://expressjs.com/en/guide/using-middleware.html)
- [Writing Middleware](https://expressjs.com/en/guide/writing-middleware.html)
- [Error Handling in Express](https://expressjs.com/en/guide/error-handling.html)
- [Popular Express Middleware](https://expressjs.com/en/resources/middleware.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
