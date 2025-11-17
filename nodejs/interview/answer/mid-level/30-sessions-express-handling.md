# How do you handle sessions in Express.js?

Sessions in Express.js are used to maintain state between HTTP requests for the same user. Since HTTP is stateless, sessions provide a way to store user data on the server side and associate it with a unique session identifier that's typically stored in a cookie on the client side.

## Basic Session Setup with express-session

The most common way to handle sessions in Express.js is using the `express-session` middleware.

### Basic Configuration

```javascript
const express = require("express");
const session = require("express-session");
const app = express();

// Basic session configuration
app.use(
  session({
    secret: "your-secret-key", // Used to sign the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Test route to demonstrate session usage
app.get("/login", (req, res) => {
  // Store data in session
  req.session.userId = 123;
  req.session.username = "john_doe";
  req.session.role = "user";

  res.json({
    message: "Logged in successfully",
    sessionId: req.sessionID,
    session: {
      userId: req.session.userId,
      username: req.session.username,
      role: req.session.role,
    },
  });
});

// Protected route that requires session
app.get("/profile", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Please log in first",
    });
  }

  res.json({
    message: "Profile data",
    user: {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role,
    },
    sessionData: req.session,
  });
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: "Could not log out",
        message: err.message,
      });
    }

    res.clearCookie("connect.sid"); // Clear the session cookie
    res.json({
      message: "Logged out successfully",
    });
  });
});

app.listen(3000);
```

## Production-Ready Session Configuration

### Secure Session Setup with Environment Variables

```javascript
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);
const app = express();

// Environment-based configuration
const isProduction = process.env.NODE_ENV === "production";

// Redis client for session store
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_SESSION_DB || 0,
});

redisClient.on("error", (err) => {
  console.error("Redis session store error:", err);
});

// Production session configuration
app.use(
  session({
    // Security settings
    secret:
      process.env.SESSION_SECRET || "fallback-secret-key-change-in-production",
    name: "sessionId", // Change default session name for security

    // Session behavior
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity

    // Cookie configuration
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true, // Prevent XSS
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? "strict" : "lax", // CSRF protection
    },

    // Session store (Redis in production, memory in development)
    store: isProduction
      ? new RedisStore({
          client: redisClient,
          prefix: "sess:",
          ttl: 86400, // 24 hours
        })
      : undefined,
  })
);

// Session middleware for authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please log in to access this resource",
    });
  }
  next();
};

// Enhanced login with session data
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate credentials (mock validation)
    const user = await validateUserCredentials(username, password);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Username or password is incorrect",
      });
    }

    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.email = user.email;
    req.session.role = user.role;
    req.session.permissions = user.permissions;
    req.session.lastLogin = new Date();
    req.session.loginCount = (req.session.loginCount || 0) + 1;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({
          error: "Login failed",
          message: "Could not create session",
        });
      }

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        sessionInfo: {
          sessionId: req.sessionID,
          expiresAt: new Date(Date.now() + req.session.cookie.maxAge),
          loginCount: req.session.loginCount,
        },
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: "Internal server error",
    });
  }
});

// Mock user validation function
async function validateUserCredentials(username, password) {
  // In real application, validate against database with hashed passwords
  const users = {
    admin: {
      id: 1,
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      permissions: ["read", "write", "delete"],
    },
    user: {
      id: 2,
      username: "user",
      email: "user@example.com",
      role: "user",
      permissions: ["read"],
    },
  };

  // Mock password validation (use bcrypt in real applications)
  if (username === "admin" && password === "admin123") {
    return users.admin;
  }
  if (username === "user" && password === "user123") {
    return users.user;
  }

  return null;
}
```

## Session Stores

### Redis Session Store

```javascript
const RedisStore = require("connect-redis")(session);
const redis = require("redis");

// Redis configuration with clustering support
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_SESSION_DB || 1,
  retry_strategy: (options) => {
    if (options.error && options.error.code === "ECONNREFUSED") {
      return new Error("Redis server refused connection");
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

// Redis session store configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: new RedisStore({
      client: redisClient,
      prefix: "myapp:sess:",
      ttl: 86400, // 24 hours
      disableTouch: false, // Enable touch to reset expiration
      logErrors: true,
    }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Session monitoring and cleanup
redisClient.on("connect", () => {
  console.log("Redis session store connected");
});

redisClient.on("error", (err) => {
  console.error("Redis session store error:", err);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  redisClient.quit(() => {
    console.log("Redis client disconnected");
    process.exit(0);
  });
});
```

### MongoDB Session Store

```javascript
const MongoStore = require("connect-mongo");

// MongoDB session store
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/myapp",
      collectionName: "sessions",
      ttl: 24 * 60 * 60, // 24 hours
      autoRemove: "native", // Let MongoDB handle expired session cleanup
      touchAfter: 24 * 3600, // Lazy session update
      transform: (doc) => {
        // Transform session data before storing
        delete doc.sensitiveData;
        return doc;
      },
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
```

## Advanced Session Management

### Role-Based Session Handling

```javascript
// Role-based middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!roles.includes(req.session.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        current: req.session.role,
      });
    }

    next();
  };
};

// Permission-based middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (
      !req.session.permissions ||
      !req.session.permissions.includes(permission)
    ) {
      return res.status(403).json({
        error: "Permission denied",
        required: permission,
        current: req.session.permissions,
      });
    }

    next();
  };
};

// Protected routes with role/permission checks
app.get("/admin/dashboard", requireRole(["admin"]), (req, res) => {
  res.json({
    message: "Admin dashboard",
    user: {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role,
    },
  });
});

app.delete("/admin/users/:id", requirePermission("delete"), (req, res) => {
  res.json({
    message: `User ${req.params.id} deleted`,
    deletedBy: req.session.username,
  });
});

// Session activity tracking
app.use("/api", (req, res, next) => {
  if (req.session && req.session.userId) {
    // Update last activity
    req.session.lastActivity = new Date();

    // Track page views
    req.session.pageViews = (req.session.pageViews || 0) + 1;

    // Track visited pages
    req.session.visitedPages = req.session.visitedPages || [];
    req.session.visitedPages.push({
      path: req.path,
      method: req.method,
      timestamp: new Date(),
    });

    // Keep only last 10 pages
    if (req.session.visitedPages.length > 10) {
      req.session.visitedPages = req.session.visitedPages.slice(-10);
    }
  }
  next();
});
```

### Session Security and Validation

```javascript
// Session validation middleware
const validateSession = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return next();
  }

  try {
    // Check if user still exists and is active
    const user = await getUserById(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });
      return res.status(401).json({
        error: "Invalid session",
        message: "User account is no longer active",
      });
    }

    // Check for session hijacking (IP address change)
    const currentIP = req.ip || req.connection.remoteAddress;
    if (req.session.ipAddress && req.session.ipAddress !== currentIP) {
      console.warn(
        `Session IP mismatch for user ${req.session.userId}: ${req.session.ipAddress} -> ${currentIP}`
      );

      // Option 1: Destroy session (more secure)
      req.session.destroy();
      return res.status(401).json({
        error: "Session security violation",
        message: "Please log in again",
      });

      // Option 2: Update IP (less secure, but better UX)
      // req.session.ipAddress = currentIP;
    }

    // Check session age
    const sessionAge = Date.now() - new Date(req.session.createdAt);
    const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (sessionAge > maxSessionAge) {
      req.session.destroy();
      return res.status(401).json({
        error: "Session expired",
        message: "Session has exceeded maximum age",
      });
    }

    next();
  } catch (error) {
    console.error("Session validation error:", error);
    next(error);
  }
};

// Apply session validation to all routes
app.use(validateSession);

// Enhanced login with security tracking
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Validate credentials
    const user = await validateUserCredentials(username, password);
    if (!user) {
      // Log failed login attempt
      await logSecurityEvent({
        type: "LOGIN_FAILED",
        username: username,
        ip: clientIP,
        userAgent: userAgent,
        timestamp: new Date(),
      });

      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Create secure session
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ error: "Login failed" });
      }

      // Store session data
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.email = user.email;
      req.session.role = user.role;
      req.session.permissions = user.permissions;
      req.session.createdAt = new Date();
      req.session.ipAddress = clientIP;
      req.session.userAgent = userAgent;
      req.session.loginCount = (req.session.loginCount || 0) + 1;

      // Log successful login
      logSecurityEvent({
        type: "LOGIN_SUCCESS",
        userId: user.id,
        username: username,
        ip: clientIP,
        userAgent: userAgent,
        sessionId: req.sessionID,
        timestamp: new Date(),
      });

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed" });
        }

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          sessionInfo: {
            expiresAt: new Date(Date.now() + req.session.cookie.maxAge),
            loginCount: req.session.loginCount,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Mock functions
async function getUserById(id) {
  // Mock user lookup - implement with your database
  const users = {
    1: { id: 1, username: "admin", isActive: true },
    2: { id: 2, username: "user", isActive: true },
  };
  return users[id];
}

async function logSecurityEvent(event) {
  // Mock security logging - implement with your logging system
  console.log("Security Event:", event);
}
```

## Session Management Utilities

### Session Information and Management

```javascript
// Session management routes
app.get("/auth/session-info", requireAuth, (req, res) => {
  const session = req.session;

  res.json({
    sessionInfo: {
      sessionId: req.sessionID,
      userId: session.userId,
      username: session.username,
      role: session.role,
      permissions: session.permissions,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      pageViews: session.pageViews,
      loginCount: session.loginCount,
      ipAddress: session.ipAddress,
      expiresAt: new Date(Date.now() + session.cookie.maxAge),
      cookie: {
        maxAge: session.cookie.maxAge,
        secure: session.cookie.secure,
        httpOnly: session.cookie.httpOnly,
        sameSite: session.cookie.sameSite,
      },
    },
    recentActivity: session.visitedPages || [],
  });
});

// Extend session (refresh expiration)
app.post("/auth/refresh-session", requireAuth, (req, res) => {
  req.session.touch();

  res.json({
    message: "Session refreshed",
    expiresAt: new Date(Date.now() + req.session.cookie.maxAge),
  });
});

// Update session data
app.put("/auth/session-data", requireAuth, (req, res) => {
  const { theme, language, preferences } = req.body;

  // Update session with user preferences
  if (theme) req.session.theme = theme;
  if (language) req.session.language = language;
  if (preferences) req.session.preferences = preferences;

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({
        error: "Failed to update session data",
      });
    }

    res.json({
      message: "Session data updated",
      sessionData: {
        theme: req.session.theme,
        language: req.session.language,
        preferences: req.session.preferences,
      },
    });
  });
});

// Get all active sessions for a user (requires admin role)
app.get("/admin/sessions/:userId", requireRole(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const sessions = await getActiveSessionsForUser(userId);

    res.json({
      userId: userId,
      activeSessions: sessions.map((session) => ({
        sessionId: session.id,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: session.expiresAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Terminate specific session (admin or user's own session)
app.delete("/auth/sessions/:sessionId", requireAuth, async (req, res) => {
  try {
    const sessionIdToDelete = req.params.sessionId;

    // Check if user can delete this session
    if (req.session.role !== "admin" && req.sessionID !== sessionIdToDelete) {
      return res.status(403).json({
        error: "Permission denied",
        message: "Can only delete your own sessions",
      });
    }

    // Delete session from store
    const success = await deleteSessionById(sessionIdToDelete);

    if (success) {
      res.json({
        message: "Session terminated successfully",
        sessionId: sessionIdToDelete,
      });
    } else {
      res.status(404).json({
        error: "Session not found",
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Terminate all sessions for a user (except current)
app.delete("/auth/sessions", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const currentSessionId = req.sessionID;

    const deletedCount = await deleteAllUserSessions(userId, currentSessionId);

    res.json({
      message: "All other sessions terminated",
      deletedSessions: deletedCount,
      currentSession: currentSessionId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock session management functions
async function getActiveSessionsForUser(userId) {
  // Implementation depends on session store
  // For Redis: scan for sessions with matching userId
  // For MongoDB: query sessions collection
  return []; // Mock return
}

async function deleteSessionById(sessionId) {
  // Implementation depends on session store
  return true; // Mock return
}

async function deleteAllUserSessions(userId, excludeSessionId) {
  // Implementation depends on session store
  return 0; // Mock return
}
```

## Session Configuration Best Practices

### Environment-Based Configuration

```javascript
// config/session.js
const session = require("express-session");
const MongoStore = require("connect-mongo");
const RedisStore = require("connect-redis")(session);
const redis = require("redis");

class SessionConfig {
  constructor() {
    this.environment = process.env.NODE_ENV || "development";
    this.isProduction = this.environment === "production";
  }

  getSessionStore() {
    const storeType = process.env.SESSION_STORE || "memory";

    switch (storeType) {
      case "redis":
        return this.createRedisStore();
      case "mongodb":
        return this.createMongoStore();
      default:
        if (this.isProduction) {
          console.warn("Using memory store in production is not recommended");
        }
        return undefined; // Use default memory store
    }
  }

  createRedisStore() {
    const redisClient = redis.createClient({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_SESSION_DB || 0,
    });

    return new RedisStore({
      client: redisClient,
      prefix: process.env.SESSION_PREFIX || "sess:",
      ttl: parseInt(process.env.SESSION_TTL) || 86400,
    });
  }

  createMongoStore() {
    return MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/sessions",
      collectionName: process.env.SESSION_COLLECTION || "sessions",
      ttl: parseInt(process.env.SESSION_TTL) || 86400,
    });
  }

  getSessionConfig() {
    return {
      secret: this.getSessionSecret(),
      name: process.env.SESSION_NAME || "sessionId",
      store: this.getSessionStore(),
      resave: process.env.SESSION_RESAVE === "true",
      saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED === "true",
      rolling: process.env.SESSION_ROLLING !== "false",
      cookie: this.getCookieConfig(),
    };
  }

  getCookieConfig() {
    return {
      secure: this.isProduction,
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000,
      sameSite: this.isProduction ? "strict" : "lax",
    };
  }

  getSessionSecret() {
    const secret = process.env.SESSION_SECRET;

    if (!secret) {
      if (this.isProduction) {
        throw new Error(
          "SESSION_SECRET environment variable is required in production"
        );
      }
      console.warn("Using default session secret in development mode");
      return "dev-secret-key-change-in-production";
    }

    if (secret.length < 32) {
      console.warn("Session secret should be at least 32 characters long");
    }

    return secret;
  }
}

// Export configured session middleware
module.exports = (app) => {
  const sessionConfig = new SessionConfig();
  const config = sessionConfig.getSessionConfig();

  app.use(session(config));

  return config;
};
```

### Session Monitoring and Analytics

```javascript
// Session analytics middleware
const sessionAnalytics = (req, res, next) => {
  if (req.session && req.session.userId) {
    // Track session metrics
    const analytics = {
      userId: req.session.userId,
      sessionId: req.sessionID,
      timestamp: new Date(),
      endpoint: req.path,
      method: req.method,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      duration: req.session.lastActivity
        ? Date.now() - new Date(req.session.lastActivity).getTime()
        : 0,
    };

    // Store analytics (implement based on your analytics system)
    storeSessionAnalytics(analytics);
  }

  next();
};

// Session health check
app.get("/health/sessions", async (req, res) => {
  try {
    const stats = await getSessionStats();

    res.json({
      status: "healthy",
      sessionStore: {
        type: process.env.SESSION_STORE || "memory",
        connected: true,
      },
      statistics: stats,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date(),
    });
  }
});

async function getSessionStats() {
  // Implementation depends on session store
  return {
    totalSessions: 0,
    activeSessions: 0,
    averageSessionDuration: 0,
    topUserAgents: [],
    topEndpoints: [],
  };
}

function storeSessionAnalytics(analytics) {
  // Implementation depends on your analytics system
  console.log("Session Analytics:", analytics);
}

app.listen(3000);
```

## Summary

### Session Management Best Practices:

1. **Security Configuration**

   - Use strong, random session secrets (32+ characters)
   - Enable `httpOnly` and `secure` cookies
   - Implement proper `sameSite` settings for CSRF protection
   - Use session stores (Redis/MongoDB) in production, not memory

2. **Session Store Selection**

   - **Memory Store**: Development only, not scalable
   - **Redis**: High performance, good for scalable applications
   - **MongoDB**: Persistent storage, good for applications already using MongoDB

3. **Session Validation**

   - Implement session validation middleware
   - Check for session hijacking (IP changes, suspicious activity)
   - Validate user account status on each request
   - Implement session age limits

4. **Session Security**

   - Regenerate session IDs on login/privilege changes
   - Implement proper logout with session destruction
   - Track and log security events
   - Provide session management interfaces for users

5. **Performance Considerations**
   - Use session stores with TTL for automatic cleanup
   - Implement session data minimization
   - Consider session data compression for large datasets
   - Monitor session store performance and capacity

### Key Features to Implement:

- **Authentication middleware** for protected routes
- **Role and permission-based access control**
- **Session information and management endpoints**
- **Security event logging and monitoring**
- **Session analytics and health checks**
- **Graceful session cleanup and expiration**

Sessions are fundamental for maintaining user state in Express.js applications and require careful consideration of security, performance, and user experience factors.
