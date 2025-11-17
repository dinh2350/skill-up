# How do you handle CORS in an Express.js application?

CORS (Cross-Origin Resource Sharing) is a security mechanism that allows or restricts web pages from making requests to a different domain, protocol, or port than the one serving the web page. In Express.js, there are multiple ways to handle CORS, from manual implementation to using middleware packages.

## What is CORS?

CORS is a browser security feature that blocks requests from one origin (domain, protocol, port) to another unless the server explicitly allows it through specific HTTP headers.

### Origin Examples

```javascript
// Same origin - allowed by default
Origin: https://example.com
Request to: https://example.com/api/users

// Different origins - requires CORS
Origin: https://frontend.com
Request to: https://api.backend.com/users  // Different domain

Origin: https://example.com
Request to: http://example.com/api        // Different protocol

Origin: https://example.com:3000
Request to: https://example.com:8080/api  // Different port
```

## Manual CORS Implementation

### Basic CORS Headers

```javascript
const express = require("express");
const app = express();

// Manual CORS implementation
app.use((req, res, next) => {
  // Allow requests from any origin
  res.header("Access-Control-Allow-Origin", "*");

  // Allow specific headers
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Allow specific HTTP methods
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
});

// Your routes
app.get("/api/users", (req, res) => {
  res.json({ users: ["John", "Jane"] });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### More Secure Manual Implementation

```javascript
const express = require("express");
const app = express();

// Whitelist of allowed origins
const allowedOrigins = [
  "https://mywebsite.com",
  "https://app.mywebsite.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  // Allow credentials (cookies, authorization headers)
  res.header("Access-Control-Allow-Credentials", "true");

  // Specify allowed headers
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key"
  );

  // Specify allowed methods
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );

  // Cache preflight response for 24 hours
  res.header("Access-Control-Max-Age", "86400");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
});

app.get("/api/protected", (req, res) => {
  res.json({ message: "This endpoint supports CORS" });
});

app.listen(3000);
```

## Using the `cors` Package

### Installation

```bash
npm install cors
```

### Basic Usage

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

// Enable CORS for all routes and origins
app.use(cors());

app.get("/api/users", (req, res) => {
  res.json({ users: ["John", "Jane"] });
});

app.listen(3000);
```

### Configured CORS Options

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

const corsOptions = {
  // Allowed origins
  origin: [
    "https://mywebsite.com",
    "https://app.mywebsite.com",
    "http://localhost:3000",
  ],

  // Allow credentials
  credentials: true,

  // Allowed HTTP methods
  methods: ["GET", "POST", "PUT", "DELETE"],

  // Allowed headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-API-Key",
  ],

  // Headers exposed to client
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],

  // Cache preflight response (in seconds)
  maxAge: 86400, // 24 hours

  // Handle preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.get("/api/users", (req, res) => {
  res.set("X-Total-Count", "100");
  res.json({ users: ["John", "Jane"] });
});

app.listen(3000);
```

## Dynamic CORS Configuration

### Origin Validation Function

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "https://mywebsite.com",
      "https://app.mywebsite.com",
    ];

    // Check if origin is in whitelist
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Error handling for CORS errors
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    res.status(403).json({
      error: "CORS policy violation",
      message: "Origin not allowed",
    });
  } else {
    next(err);
  }
});

app.listen(3000);
```

### Environment-Based CORS

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

function getCorsOptions() {
  if (process.env.NODE_ENV === "production") {
    return {
      origin: ["https://myapp.com", "https://www.myapp.com"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };
  } else {
    // Development - more permissive
    return {
      origin: true, // Allow any origin in development
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    };
  }
}

app.use(cors(getCorsOptions()));

app.get("/api/data", (req, res) => {
  res.json({ message: "CORS configured based on environment" });
});

app.listen(3000);
```

## Route-Specific CORS

### Different CORS for Different Routes

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

// Public API - open CORS
const publicCorsOptions = {
  origin: "*",
  methods: ["GET"],
  allowedHeaders: ["Content-Type"],
};

// Private API - restricted CORS
const privateCorsOptions = {
  origin: ["https://admin.myapp.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Public routes
app.get("/api/public/*", cors(publicCorsOptions), (req, res) => {
  res.json({ message: "Public data" });
});

// Private routes
app.use("/api/admin/*", cors(privateCorsOptions));
app.get("/api/admin/users", (req, res) => {
  res.json({ users: ["admin1", "admin2"] });
});

// Specific route with custom CORS
app.get(
  "/api/special",
  cors({
    origin: "https://special-client.com",
    methods: ["GET"],
  }),
  (req, res) => {
    res.json({ message: "Special endpoint" });
  }
);

app.listen(3000);
```

## Advanced CORS Patterns

### CORS with Authentication

```javascript
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://app.mywebsite.com",
      "https://mobile.mywebsite.com",
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Required for sending cookies/auth headers
  exposedHeaders: ["X-Token-Refresh"], // Expose custom headers
};

app.use(cors(corsOptions));
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Login endpoint
app.post("/api/login", (req, res) => {
  // Validate credentials...
  const token = jwt.sign({ userId: 123 }, process.env.JWT_SECRET);

  res.json({
    token,
    user: { id: 123, name: "John Doe" },
  });
});

// Protected endpoint
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    message: "Protected data accessed successfully",
  });
});

app.listen(3000);
```

### CORS with Rate Limiting

```javascript
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();

// Different rate limits for different origins
const createRateLimiter = (maxRequests, windowMs) => {
  return rateLimit({
    windowMs: windowMs,
    max: maxRequests,
    message: {
      error: "Too many requests",
      retryAfter: windowMs / 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// CORS configuration with rate limiting based on origin
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Set CORS headers
  if (origin === "https://premium.myapp.com") {
    res.header("Access-Control-Allow-Origin", origin);
    // Apply generous rate limit for premium users
    createRateLimiter(1000, 15 * 60 * 1000)(req, res, next); // 1000 requests per 15 minutes
  } else if (origin === "https://app.myapp.com") {
    res.header("Access-Control-Allow-Origin", origin);
    // Apply standard rate limit
    createRateLimiter(100, 15 * 60 * 1000)(req, res, next); // 100 requests per 15 minutes
  } else {
    // Apply strict rate limit for unknown origins
    createRateLimiter(10, 15 * 60 * 1000)(req, res, next); // 10 requests per 15 minutes
  }
});

app.use(express.json());

app.get("/api/data", (req, res) => {
  res.json({ message: "Data with rate limiting based on origin" });
});

app.listen(3000);
```

## CORS Troubleshooting

### CORS Error Logging

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ["https://myapp.com"];

    console.log(`CORS request from origin: ${origin}`);

    if (!origin) {
      console.log("No origin header - allowing request");
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`Origin ${origin} is allowed`);
      callback(null, true);
    } else {
      console.log(`Origin ${origin} is not allowed`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message.includes("not allowed by CORS")) {
    console.error("CORS Error:", {
      origin: req.headers.origin,
      method: req.method,
      url: req.url,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
    });

    res.status(403).json({
      error: "CORS Error",
      message: "Origin not allowed",
      allowedOrigins: ["https://myapp.com"],
    });
  } else {
    next(err);
  }
});

app.get("/api/test", (req, res) => {
  res.json({ message: "CORS test endpoint" });
});

app.listen(3000);
```

### Development vs Production CORS

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

class CORSManager {
  static getDevelopmentOptions() {
    return {
      origin: true, // Allow any origin in development
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-API-Key",
        "X-Debug-Mode",
      ],
    };
  }

  static getProductionOptions() {
    return {
      origin: [
        "https://myapp.com",
        "https://www.myapp.com",
        "https://admin.myapp.com",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
      maxAge: 86400, // Cache preflight for 24 hours
    };
  }

  static getTestOptions() {
    return {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };
  }

  static getOptions() {
    const env = process.env.NODE_ENV || "development";

    switch (env) {
      case "production":
        return this.getProductionOptions();
      case "test":
        return this.getTestOptions();
      default:
        return this.getDevelopmentOptions();
    }
  }
}

// Apply CORS based on environment
app.use(cors(CORSManager.getOptions()));

// Environment info endpoint
app.get("/api/info", (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || "development",
    corsConfig: CORSManager.getOptions(),
    origin: req.headers.origin,
  });
});

app.listen(3000);
```

## Security Best Practices

### Secure CORS Implementation

```javascript
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Secure CORS configuration
const secureOrigins = {
  production: ["https://myapp.com", "https://www.myapp.com"],
  development: ["http://localhost:3000", "http://localhost:3001"],
};

const corsOptions = {
  origin: function (origin, callback) {
    const env = process.env.NODE_ENV || "development";
    const allowedOrigins = secureOrigins[env] || [];

    // Allow requests with no origin (mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // Check against whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log unauthorized attempts
      console.warn("Unauthorized CORS attempt:", {
        origin,
        timestamp: new Date().toISOString(),
        userAgent: origin,
      });

      callback(new Error("Not allowed by CORS policy"));
    }
  },

  credentials: true,

  // Strict method control
  methods: ["GET", "POST", "PUT", "DELETE"],

  // Minimal required headers
  allowedHeaders: ["Content-Type", "Authorization"],

  // Cache preflight responses
  maxAge: 86400,

  // Disable unnecessary features
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Content Security Policy for additional security
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'"
  );
  next();
});

app.get("/api/secure", (req, res) => {
  res.json({
    message: "Secure endpoint with proper CORS",
    timestamp: new Date().toISOString(),
  });
});

app.listen(3000);
```

### CORS with API Versioning

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

// Version-specific CORS configurations
const corsConfigurations = {
  v1: {
    origin: ["https://legacy.myapp.com"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "X-API-Key"],
  },
  v2: {
    origin: ["https://app.myapp.com", "https://mobile.myapp.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  v3: {
    origin: [
      "https://app.myapp.com",
      "https://mobile.myapp.com",
      "https://beta.myapp.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Version"],
    credentials: true,
    exposedHeaders: ["X-RateLimit-Remaining", "X-RateLimit-Reset"],
  },
};

// Apply version-specific CORS
app.use("/api/v1", cors(corsConfigurations.v1));
app.use("/api/v2", cors(corsConfigurations.v2));
app.use("/api/v3", cors(corsConfigurations.v3));

// API routes
app.get("/api/v1/users", (req, res) => {
  res.json({ version: "v1", users: [] });
});

app.get("/api/v2/users", (req, res) => {
  res.json({ version: "v2", users: [], features: ["auth"] });
});

app.get("/api/v3/users", (req, res) => {
  res.set("X-RateLimit-Remaining", "99");
  res.set("X-RateLimit-Reset", Date.now() + 3600000);
  res.json({
    version: "v3",
    users: [],
    features: ["auth", "real-time", "analytics"],
  });
});

app.listen(3000);
```

## Testing CORS

### CORS Test Suite

```javascript
// test/cors.test.js
const request = require("supertest");
const express = require("express");
const cors = require("cors");

describe("CORS Configuration", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(
      cors({
        origin: ["https://app.mywebsite.com"],
        credentials: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    app.get("/api/test", (req, res) => {
      res.json({ message: "success" });
    });
  });

  test("should allow requests from allowed origin", async () => {
    const response = await request(app)
      .get("/api/test")
      .set("Origin", "https://app.mywebsite.com");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://app.mywebsite.com"
    );
  });

  test("should reject requests from disallowed origin", async () => {
    const response = await request(app)
      .get("/api/test")
      .set("Origin", "https://malicious.com");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("should handle preflight requests", async () => {
    const response = await request(app)
      .options("/api/test")
      .set("Origin", "https://app.mywebsite.com")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-methods"]).toContain("POST");
  });
});
```

## Common CORS Issues and Solutions

### Issue 1: Credentials Not Working

```javascript
// ❌ Wrong - credentials won't work
app.use(
  cors({
    origin: "*",
    credentials: true, // Can't use wildcard with credentials
  })
);

// ✅ Correct - specify origins when using credentials
app.use(
  cors({
    origin: ["https://app.mywebsite.com"],
    credentials: true,
  })
);
```

### Issue 2: Preflight Requests Failing

```javascript
// ❌ Wrong - not handling OPTIONS
app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});

// ✅ Correct - CORS middleware handles OPTIONS automatically
app.use(cors());
app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});
```

### Issue 3: Custom Headers Not Allowed

```javascript
// ❌ Wrong - custom headers not specified
app.use(
  cors({
    origin: "https://app.mywebsite.com",
  })
);

app.get("/api/users", (req, res) => {
  const apiKey = req.headers["x-api-key"]; // Will fail
  res.json({ users: [] });
});

// ✅ Correct - specify allowed headers
app.use(
  cors({
    origin: "https://app.mywebsite.com",
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);
```

## Summary

### CORS Handling Methods:

1. **Manual Implementation**: Full control over CORS headers
2. **CORS Package**: Convenient middleware with extensive options
3. **Route-Specific**: Different CORS policies per route
4. **Dynamic Configuration**: Origin validation functions

### Key CORS Headers:

- `Access-Control-Allow-Origin`: Allowed origins
- `Access-Control-Allow-Methods`: Allowed HTTP methods
- `Access-Control-Allow-Headers`: Allowed request headers
- `Access-Control-Allow-Credentials`: Allow cookies/auth
- `Access-Control-Max-Age`: Cache preflight response

### Best Practices:

- **Never use wildcards** with credentials
- **Whitelist specific origins** in production
- **Use HTTPS** for all origins in production
- **Log CORS violations** for security monitoring
- **Test thoroughly** with different origins and methods
- **Apply principle of least privilege** - only allow what's needed
- **Use environment-specific configurations**
- **Handle preflight requests** properly

CORS is essential for secure web API development, balancing accessibility with security in cross-origin communications.
