# How Can You Scale a Node.js Application?

Scaling a Node.js application involves multiple strategies to handle increased load, improve performance, and ensure high availability. This comprehensive guide covers both vertical and horizontal scaling approaches, along with architectural patterns and best practices.

## Overview of Scaling Strategies

```javascript
// Scaling dimensions for Node.js applications
const scalingDimensions = {
  vertical: "Increase resources of a single server (CPU, RAM, disk)",
  horizontal: "Add more server instances to distribute load",
  functional: "Split application into microservices",
  dataStore: "Scale database layer independently",
};

// Key metrics to monitor for scaling decisions
const scalingMetrics = {
  cpuUtilization: "CPU usage percentage",
  memoryUsage: "RAM consumption",
  eventLoopLag: "Event loop delay",
  requestThroughput: "Requests per second",
  responseTime: "Average response time",
  errorRate: "Percentage of failed requests",
  concurrentConnections: "Active connections count",
};
```

## 1. Vertical Scaling (Scale Up)

Vertical scaling involves increasing the resources of a single machine.

### Optimizing Node.js Process

```javascript
// server.js - Optimized Node.js server configuration
const express = require("express");
const cluster = require("cluster");
const os = require("os");

// Configure Node.js process for better performance
if (process.env.NODE_ENV === "production") {
  // Increase memory limit
  // Start with: node --max-old-space-size=4096 server.js
  // Enable V8 optimizations
  // node --optimize-for-size server.js
  // node --max-semi-space-size=64 server.js
}

// Memory monitoring and optimization
class MemoryMonitor {
  constructor(thresholdMB = 1024) {
    this.thresholdMB = thresholdMB;
    this.warningCount = 0;
  }

  start(intervalMs = 30000) {
    this.interval = setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const rssMB = Math.round(usage.rss / 1024 / 1024);

      console.log("Memory Usage:", {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        rss: `${rssMB}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      });

      // Alert if memory usage is high
      if (heapUsedMB > this.thresholdMB) {
        this.warningCount++;
        console.warn(
          `⚠️  High memory usage: ${heapUsedMB}MB (threshold: ${this.thresholdMB}MB)`
        );

        if (this.warningCount > 3) {
          console.error("❌ Critical memory usage detected. Consider scaling.");
          // Trigger garbage collection if --expose-gc flag is set
          if (global.gc) {
            console.log("🔄 Forcing garbage collection...");
            global.gc();
          }
        }
      } else {
        this.warningCount = 0;
      }
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// CPU monitoring
class CPUMonitor {
  constructor() {
    this.lastUsage = process.cpuUsage();
    this.lastTime = Date.now();
  }

  getCPUUsage() {
    const currentUsage = process.cpuUsage(this.lastUsage);
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.lastTime;

    // Calculate CPU usage percentage
    const cpuPercent =
      ((currentUsage.user + currentUsage.system) / 1000 / elapsedTime) * 100;

    this.lastUsage = process.cpuUsage();
    this.lastTime = currentTime;

    return {
      user: Math.round(currentUsage.user / 1000),
      system: Math.round(currentUsage.system / 1000),
      percent: cpuPercent.toFixed(2),
    };
  }

  start(intervalMs = 30000) {
    this.interval = setInterval(() => {
      const usage = this.getCPUUsage();
      console.log("CPU Usage:", usage);

      if (parseFloat(usage.percent) > 80) {
        console.warn("⚠️  High CPU usage detected:", usage.percent + "%");
      }
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// Event loop monitoring
class EventLoopMonitor {
  constructor(thresholdMs = 50) {
    this.thresholdMs = thresholdMs;
  }

  start(intervalMs = 5000) {
    this.interval = setInterval(() => {
      const start = Date.now();

      setImmediate(() => {
        const lag = Date.now() - start;

        if (lag > this.thresholdMs) {
          console.warn(
            `⚠️  Event loop lag: ${lag}ms (threshold: ${this.thresholdMs}ms)`
          );
        } else {
          console.log(`✅ Event loop healthy: ${lag}ms lag`);
        }
      });
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// Example usage in production
if (process.env.NODE_ENV === "production") {
  const memMonitor = new MemoryMonitor(2048); // 2GB threshold
  const cpuMonitor = new CPUMonitor();
  const loopMonitor = new EventLoopMonitor(100); // 100ms threshold

  memMonitor.start();
  cpuMonitor.start();
  loopMonitor.start();

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, cleaning up...");
    memMonitor.stop();
    cpuMonitor.stop();
    loopMonitor.stop();
    process.exit(0);
  });
}

// Export for use in application
module.exports = {
  MemoryMonitor,
  CPUMonitor,
  EventLoopMonitor,
};
```

### Performance Optimization Techniques

```javascript
// performance-optimizations.js

// 1. Efficient request handling
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");

function createOptimizedApp() {
  const app = express();

  // Enable gzip compression
  app.use(
    compression({
      level: 6, // Balance between compression and CPU
      threshold: 1024, // Only compress responses larger than 1KB
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );

  // Security headers (minimal overhead)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Configure as needed
      crossOriginEmbedderPolicy: false,
    })
  );

  // Increase payload limits if needed
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Optimize ETag generation
  app.set("etag", "weak"); // Use weak ETags for better performance

  // Disable unnecessary features
  app.disable("x-powered-by");

  return app;
}

// 2. Connection pooling for databases
const { Pool } = require("pg"); // PostgreSQL example

class DatabasePool {
  constructor(config) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      // Optimized pool settings
      max: 20, // Maximum pool size
      min: 5, // Minimum pool size
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout after 10 seconds
      maxUses: 7500, // Close connections after 7500 uses
    });

    // Monitor pool metrics
    this.pool.on("connect", (client) => {
      console.log("New database connection established");
    });

    this.pool.on("error", (err, client) => {
      console.error("Unexpected database error:", err);
    });

    this.pool.on("remove", (client) => {
      console.log("Database connection removed from pool");
    });
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        console.warn(`⚠️  Slow query (${duration}ms):`, text);
      }

      return result;
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  }

  async getPoolStatus() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  async close() {
    await this.pool.end();
    console.log("Database pool closed");
  }
}

// 3. Caching strategies
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  set(key, value, ttlMs = 60000) {
    this.cache.set(key, value);

    // Set TTL
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
    }

    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.ttls.delete(key);
      console.log(`Cache expired: ${key}`);
    }, ttlMs);

    this.ttls.set(key, timeout);
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    this.cache.delete(key);
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
      this.ttls.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.ttls.forEach((timeout) => clearTimeout(timeout));
    this.ttls.clear();
  }

  size() {
    return this.cache.size;
  }

  // LRU implementation
  createLRU(maxSize = 1000) {
    const cache = new Map();

    return {
      get(key) {
        if (!cache.has(key)) return undefined;

        // Move to end (most recently used)
        const value = cache.get(key);
        cache.delete(key);
        cache.set(key, value);

        return value;
      },

      set(key, value) {
        if (cache.has(key)) {
          cache.delete(key);
        }

        cache.set(key, value);

        // Evict oldest if over max size
        if (cache.size > maxSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      },

      has(key) {
        return cache.has(key);
      },

      clear() {
        cache.clear();
      },
    };
  }
}

// 4. Stream processing for large data
const { Transform } = require("stream");

class DataProcessor extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });
    this.processed = 0;
  }

  _transform(chunk, encoding, callback) {
    try {
      // Process data in chunks to avoid blocking
      const processed = this.processChunk(chunk);
      this.processed++;

      if (this.processed % 1000 === 0) {
        console.log(`Processed ${this.processed} items`);
      }

      callback(null, processed);
    } catch (error) {
      callback(error);
    }
  }

  processChunk(data) {
    // Implement your processing logic
    return data;
  }
}

// Example: Processing large files efficiently
async function processLargeFile(inputPath, outputPath) {
  const fs = require("fs");
  const { pipeline } = require("stream");
  const { promisify } = require("util");
  const pipelineAsync = promisify(pipeline);

  const readStream = fs.createReadStream(inputPath, {
    highWaterMark: 64 * 1024, // 64KB chunks
  });

  const processor = new DataProcessor();

  const writeStream = fs.createWriteStream(outputPath);

  try {
    await pipelineAsync(readStream, processor, writeStream);
    console.log("File processing completed");
  } catch (error) {
    console.error("File processing failed:", error);
    throw error;
  }
}

module.exports = {
  createOptimizedApp,
  DatabasePool,
  CacheManager,
  DataProcessor,
  processLargeFile,
};
```

## 2. Horizontal Scaling (Scale Out)

Horizontal scaling involves adding more Node.js instances.

### Clustering with Node.js Cluster Module

```javascript
// cluster-server.js
const cluster = require("cluster");
const http = require("http");
const os = require("os");
const express = require("express");

const numCPUs = os.cpus().length;

class ClusterManager {
  constructor(options = {}) {
    this.numWorkers = options.numWorkers || numCPUs;
    this.restartDelay = options.restartDelay || 1000;
    this.workers = new Map();
    this.isShuttingDown = false;
  }

  start(serverFactory) {
    if (cluster.isMaster) {
      console.log(`Master process ${process.pid} is running`);
      console.log(`Starting ${this.numWorkers} workers...`);

      // Create workers
      for (let i = 0; i < this.numWorkers; i++) {
        this.createWorker(i);
      }

      // Handle worker exit
      cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died (${signal || code})`);
        this.workers.delete(worker.id);

        // Restart worker unless shutting down
        if (!this.isShuttingDown) {
          console.log("Starting a new worker...");
          setTimeout(() => {
            this.createWorker();
          }, this.restartDelay);
        }
      });

      // Handle worker online
      cluster.on("online", (worker) => {
        console.log(`Worker ${worker.process.pid} is online`);
      });

      // Handle worker listening
      cluster.on("listening", (worker, address) => {
        console.log(
          `Worker ${worker.process.pid} listening on ${address.address}:${address.port}`
        );
      });

      // Handle worker messages
      cluster.on("message", (worker, message) => {
        console.log(`Message from worker ${worker.process.pid}:`, message);

        // Broadcast to all workers
        if (message.broadcast) {
          this.broadcast(message, worker.id);
        }
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

      // Health monitoring
      this.startHealthCheck();
    } else {
      // Worker process
      const server = serverFactory();

      const port = process.env.PORT || 3000;
      server.listen(port, () => {
        console.log(`Worker ${process.pid} listening on port ${port}`);
      });

      // Worker message handling
      process.on("message", (message) => {
        if (message === "shutdown") {
          console.log(`Worker ${process.pid} shutting down...`);
          server.close(() => {
            process.exit(0);
          });
        }
      });
    }
  }

  createWorker(index) {
    const worker = cluster.fork({
      WORKER_INDEX: index !== undefined ? index : this.workers.size,
    });

    this.workers.set(worker.id, {
      worker,
      startTime: Date.now(),
      requests: 0,
    });

    return worker;
  }

  broadcast(message, excludeWorkerId) {
    for (const [id, { worker }] of this.workers) {
      if (id !== excludeWorkerId) {
        worker.send(message);
      }
    }
  }

  setupGracefulShutdown() {
    const shutdown = () => {
      if (this.isShuttingDown) return;

      console.log("Master process shutting down...");
      this.isShuttingDown = true;

      // Stop health checks
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Send shutdown message to all workers
      for (const { worker } of this.workers.values()) {
        worker.send("shutdown");
      }

      // Force shutdown after timeout
      setTimeout(() => {
        console.log("Force shutdown after timeout");
        process.exit(0);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  }

  startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      console.log(`Active workers: ${this.workers.size}/${this.numWorkers}`);

      // Check if we need to spawn more workers
      if (this.workers.size < this.numWorkers && !this.isShuttingDown) {
        console.log("Worker count below threshold, spawning new worker");
        this.createWorker();
      }
    }, 30000);
  }

  getStatus() {
    return {
      master: process.pid,
      workers: Array.from(this.workers.values()).map(
        ({ worker, startTime, requests }) => ({
          pid: worker.process.pid,
          uptime: Date.now() - startTime,
          requests,
        })
      ),
    };
  }
}

// Example application factory
function createApp() {
  const app = express();

  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });

  app.get("/", (req, res) => {
    res.json({
      message: "Hello from worker",
      pid: process.pid,
      worker: process.env.WORKER_INDEX,
    });
  });

  app.get("/heavy", (req, res) => {
    // Simulate CPU-intensive task
    let sum = 0;
    for (let i = 0; i < 10000000; i++) {
      sum += Math.sqrt(i);
    }

    res.json({
      result: sum,
      pid: process.pid,
    });
  });

  return app;
}

// Start cluster
if (require.main === module) {
  const manager = new ClusterManager({
    numWorkers: process.env.NUM_WORKERS || os.cpus().length,
  });

  manager.start(createApp);
}

module.exports = ClusterManager;
```

### Load Balancing with PM2

```javascript
// pm2-ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "api-server",
      script: "./server.js",
      instances: "max", // Use all CPU cores
      exec_mode: "cluster",

      // Environment variables
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // Advanced features
      max_memory_restart: "1G", // Restart if memory exceeds 1GB
      min_uptime: "10s", // Minimum uptime before considering app stable
      max_restarts: 10, // Maximum restarts within a time window
      autorestart: true,
      watch: false, // Disable in production

      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Health monitoring
      instance_var: "INSTANCE_ID",

      // Advanced options
      cron_restart: "0 3 * * *", // Restart daily at 3 AM

      // Node.js args
      node_args: "--max-old-space-size=2048",
    },
  ],
};

// server.js with PM2 integration
const express = require("express");
const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    pid: process.pid,
    instance: process.env.INSTANCE_ID,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Application routes
app.get("/", (req, res) => {
  res.json({
    message: "API Server",
    instance: process.env.INSTANCE_ID,
    pid: process.pid,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} (PID: ${process.pid})`);

  // Signal PM2 that app is ready
  if (process.send) {
    process.send("ready");
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
});

module.exports = app;
```

### Load Balancer Configuration (NGINX)

```nginx
# /etc/nginx/nginx.conf
# Load balancing configuration for Node.js application

upstream nodejs_backend {
    # Load balancing method
    # Options: round-robin (default), least_conn, ip_hash, hash
    least_conn;

    # Backend servers
    server 127.0.0.1:3000 weight=3 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=3 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=3 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3003 weight=3 max_fails=3 fail_timeout=30s;

    # Backup server
    server 127.0.0.1:3004 backup;

    # Keep alive connections to backend
    keepalive 64;
}

server {
    listen 80;
    server_name api.example.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/api-access.log;
    error_log /var/log/nginx/api-error.log;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=addr:10m;
    limit_conn addr 10;

    # Proxy settings
    location / {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://nodejs_backend/health;
        access_log off;
    }

    # Static files (if serving from Node.js)
    location /static/ {
        proxy_pass http://nodejs_backend;

        # Caching
        proxy_cache_valid 200 30d;
        proxy_cache_valid 404 1m;
        add_header X-Cache-Status $upstream_cache_status;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Include same location blocks as HTTP server
    # ... (same as above)
}
```

## 3. Microservices Architecture

Breaking down a monolithic application into microservices.

```javascript
// microservices-example/

// 1. API Gateway
// gateway/server.js
const express = require("express");
const httpProxy = require("http-proxy");
const app = express();

class APIGateway {
  constructor() {
    this.proxy = httpProxy.createProxyServer();
    this.services = new Map();

    // Service registry
    this.registerService("users", "http://localhost:3001");
    this.registerService("products", "http://localhost:3002");
    this.registerService("orders", "http://localhost:3003");
    this.registerService("payments", "http://localhost:3004");

    // Health check for services
    this.startHealthChecks();
  }

  registerService(name, target) {
    this.services.set(name, {
      target,
      healthy: true,
      lastCheck: Date.now(),
    });
    console.log(`Registered service: ${name} -> ${target}`);
  }

  getService(name) {
    const service = this.services.get(name);
    if (!service || !service.healthy) {
      throw new Error(`Service ${name} is unavailable`);
    }
    return service;
  }

  async checkServiceHealth(name, target) {
    try {
      const fetch = require("node-fetch");
      const response = await fetch(`${target}/health`, { timeout: 5000 });
      return response.ok;
    } catch (error) {
      console.error(`Health check failed for ${name}:`, error.message);
      return false;
    }
  }

  startHealthChecks() {
    setInterval(async () => {
      for (const [name, service] of this.services) {
        const healthy = await this.checkServiceHealth(name, service.target);
        service.healthy = healthy;
        service.lastCheck = Date.now();

        if (!healthy) {
          console.warn(`⚠️  Service ${name} is unhealthy`);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  setupRoutes(app) {
    // Middleware
    app.use(express.json());

    // Request logging
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });

    // Dynamic routing based on service name
    app.use("/:service/*", (req, res) => {
      const serviceName = req.params.service;

      try {
        const service = this.getService(serviceName);

        // Modify request path
        req.url = req.url.replace(`/${serviceName}`, "");

        // Proxy request
        this.proxy.web(
          req,
          res,
          {
            target: service.target,
            changeOrigin: true,
          },
          (error) => {
            console.error(`Proxy error for ${serviceName}:`, error);
            res.status(503).json({
              error: "Service unavailable",
              service: serviceName,
            });
          }
        );
      } catch (error) {
        res.status(503).json({
          error: error.message,
          service: serviceName,
        });
      }
    });

    // Gateway health check
    app.get("/health", (req, res) => {
      const services = Array.from(this.services.entries()).map(
        ([name, service]) => ({
          name,
          healthy: service.healthy,
          lastCheck: new Date(service.lastCheck).toISOString(),
        })
      );

      res.json({
        gateway: "healthy",
        services,
      });
    });

    // Service discovery endpoint
    app.get("/services", (req, res) => {
      const services = Array.from(this.services.entries()).map(
        ([name, service]) => ({
          name,
          target: service.target,
          healthy: service.healthy,
        })
      );

      res.json({ services });
    });
  }
}

// Start gateway
const gateway = new APIGateway();
const app = express();
gateway.setupRoutes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});

// 2. User Service
// services/users/server.js
const express = require("express");
const app = express();

app.use(express.json());

// Mock user database
const users = new Map([
  [1, { id: 1, name: "John Doe", email: "john@example.com" }],
  [2, { id: 2, name: "Jane Smith", email: "jane@example.com" }],
]);

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "users" });
});

app.get("/users", (req, res) => {
  res.json({ users: Array.from(users.values()) });
});

app.get("/users/:id", (req, res) => {
  const user = users.get(parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ user });
});

app.post("/users", (req, res) => {
  const id = users.size + 1;
  const user = { id, ...req.body };
  users.set(id, user);
  res.status(201).json({ user });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`User service listening on port ${PORT}`);
});

// 3. Products Service
// services/products/server.js
const express = require("express");
const app = express();

app.use(express.json());

// Mock product database
const products = new Map([
  [1, { id: 1, name: "Product A", price: 99.99 }],
  [2, { id: 2, name: "Product B", price: 149.99 }],
]);

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "products" });
});

app.get("/products", (req, res) => {
  res.json({ products: Array.from(products.values()) });
});

app.get("/products/:id", (req, res) => {
  const product = products.get(parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ product });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Product service listening on port ${PORT}`);
});

// 4. Inter-service communication
// utils/service-client.js
class ServiceClient {
  constructor(gatewayUrl) {
    this.gatewayUrl = gatewayUrl;
  }

  async callService(serviceName, path, options = {}) {
    const fetch = require("node-fetch");
    const url = `${this.gatewayUrl}/${serviceName}${path}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        timeout: options.timeout || 5000,
      });

      if (!response.ok) {
        throw new Error(`Service call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to call ${serviceName}${path}:`, error);
      throw error;
    }
  }
}

module.exports = ServiceClient;
```

## 4. Database Scaling

```javascript
// database-scaling.js

// 1. Read Replicas
class DatabaseRouter {
  constructor(config) {
    this.master = this.createPool(config.master);
    this.replicas = config.replicas.map((cfg) => this.createPool(cfg));
    this.replicaIndex = 0;
  }

  createPool(config) {
    const { Pool } = require("pg");
    return new Pool(config);
  }

  // Write operations go to master
  async write(query, params) {
    return await this.master.query(query, params);
  }

  // Read operations go to replicas (round-robin)
  async read(query, params) {
    if (this.replicas.length === 0) {
      return await this.master.query(query, params);
    }

    const replica = this.replicas[this.replicaIndex];
    this.replicaIndex = (this.replicaIndex + 1) % this.replicas.length;

    try {
      return await replica.query(query, params);
    } catch (error) {
      console.error("Replica query failed, falling back to master:", error);
      return await this.master.query(query, params);
    }
  }

  // Transaction (must use master)
  async transaction(callback) {
    const client = await this.master.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.master.end();
    await Promise.all(this.replicas.map((r) => r.end()));
  }
}

// Usage example
const dbRouter = new DatabaseRouter({
  master: {
    host: "master.db.example.com",
    port: 5432,
    database: "myapp",
    user: "app_user",
    password: "password",
    max: 20,
  },
  replicas: [
    {
      host: "replica1.db.example.com",
      port: 5432,
      database: "myapp",
      user: "app_user",
      password: "password",
      max: 10,
    },
    {
      host: "replica2.db.example.com",
      port: 5432,
      database: "myapp",
      user: "app_user",
      password: "password",
      max: 10,
    },
  ],
});

// 2. Sharding
class ShardedDatabase {
  constructor(shards) {
    this.shards = shards.map((config) => this.createPool(config));
  }

  createPool(config) {
    const { Pool } = require("pg");
    return new Pool(config);
  }

  // Hash-based sharding
  getShardIndex(key) {
    const hash = this.hashCode(key.toString());
    return Math.abs(hash) % this.shards.length;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  async query(shardKey, query, params) {
    const shardIndex = this.getShardIndex(shardKey);
    const shard = this.shards[shardIndex];

    console.log(`Routing to shard ${shardIndex} for key: ${shardKey}`);

    return await shard.query(query, params);
  }

  // Query all shards and aggregate results
  async queryAll(query, params) {
    const promises = this.shards.map((shard) =>
      shard.query(query, params).catch((err) => {
        console.error("Shard query failed:", err);
        return { rows: [] };
      })
    );

    const results = await Promise.all(promises);

    // Aggregate results
    const allRows = results.flatMap((result) => result.rows);
    return { rows: allRows };
  }

  async close() {
    await Promise.all(this.shards.map((shard) => shard.end()));
  }
}

module.exports = {
  DatabaseRouter,
  ShardedDatabase,
};
```

## 5. Caching Strategies

```javascript
// caching-strategies.js
const Redis = require("ioredis");

class CachingLayer {
  constructor(redisConfig) {
    this.redis = new Redis(redisConfig);
    this.redis.on("error", (err) => {
      console.error("Redis error:", err);
    });
  }

  // Cache-aside pattern
  async cacheAside(key, fetchFunction, ttl = 3600) {
    try {
      // Try to get from cache
      const cached = await this.redis.get(key);

      if (cached) {
        console.log(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      console.log(`Cache miss: ${key}`);

      // Fetch from source
      const data = await fetchFunction();

      // Store in cache
      await this.redis.setex(key, ttl, JSON.stringify(data));

      return data;
    } catch (error) {
      console.error("Cache error:", error);
      // Fallback to direct fetch
      return await fetchFunction();
    }
  }

  // Read-through cache
  async readThrough(key, fetchFunction, ttl = 3600) {
    return await this.cacheAside(key, fetchFunction, ttl);
  }

  // Write-through cache
  async writeThrough(key, data, saveFunction, ttl = 3600) {
    try {
      // Save to database
      await saveFunction(data);

      // Update cache
      await this.redis.setex(key, ttl, JSON.stringify(data));

      return data;
    } catch (error) {
      console.error("Write-through error:", error);
      throw error;
    }
  }

  // Write-behind (write-back) cache
  async writeBehind(key, data, ttl = 3600) {
    try {
      // Immediately update cache
      await this.redis.setex(key, ttl, JSON.stringify(data));

      // Queue for async database write
      await this.redis.lpush(
        "write_queue",
        JSON.stringify({
          key,
          data,
          timestamp: Date.now(),
        })
      );

      return data;
    } catch (error) {
      console.error("Write-behind error:", error);
      throw error;
    }
  }

  // Invalidate cache
  async invalidate(key) {
    await this.redis.del(key);
  }

  // Invalidate pattern
  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Multi-level caching
  async multilevelGet(key, levels) {
    // Level 1: Memory cache
    if (levels.memory && levels.memory.has(key)) {
      console.log("L1 cache hit (memory)");
      return levels.memory.get(key);
    }

    // Level 2: Redis cache
    const cached = await this.redis.get(key);
    if (cached) {
      console.log("L2 cache hit (Redis)");
      const data = JSON.parse(cached);

      // Populate L1 cache
      if (levels.memory) {
        levels.memory.set(key, data);
      }

      return data;
    }

    console.log("Cache miss (all levels)");
    return null;
  }

  async close() {
    await this.redis.quit();
  }
}

// Session storage with Redis
class SessionStore {
  constructor(redisConfig) {
    this.redis = new Redis(redisConfig);
  }

  async createSession(userId, data, ttl = 86400) {
    const sessionId = this.generateSessionId();
    const sessionData = {
      userId,
      ...data,
      createdAt: Date.now(),
    };

    await this.redis.setex(
      `session:${sessionId}`,
      ttl,
      JSON.stringify(sessionData)
    );

    return sessionId;
  }

  async getSession(sessionId) {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async updateSession(sessionId, data, ttl = 86400) {
    const existing = await this.getSession(sessionId);
    if (!existing) {
      throw new Error("Session not found");
    }

    const updated = { ...existing, ...data, updatedAt: Date.now() };
    await this.redis.setex(
      `session:${sessionId}`,
      ttl,
      JSON.stringify(updated)
    );

    return updated;
  }

  async deleteSession(sessionId) {
    await this.redis.del(`session:${sessionId}`);
  }

  generateSessionId() {
    return require("crypto").randomBytes(32).toString("hex");
  }
}

module.exports = {
  CachingLayer,
  SessionStore,
};
```

## 6. Containerization and Orchestration

```dockerfile
# Dockerfile for Node.js application
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Production image
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies and code from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: "3.8"

services:
  # Load balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - app-network

  # Application instances
  app:
    build: .
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DB_HOST=postgres
      - DB_PORT=5432
    depends_on:
      - redis
      - postgres
    deploy:
      replicas: 4
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s

  # Redis cache
  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # PostgreSQL database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=app_user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app_user"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis-data:
  postgres-data:

networks:
  app-network:
    driver: bridge
```

```yaml
# kubernetes-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
  labels:
    app: nodejs-app
spec:
  replicas: 4
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
        - name: app
          image: myapp:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: REDIS_URL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: redis_url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: nodejs-service
spec:
  selector:
    app: nodejs-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nodejs-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nodejs-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Summary

### Scaling Strategies Summary:

1. **Vertical Scaling (Scale Up)**

   - Increase CPU, RAM, and resources
   - Optimize Node.js process and V8 engine
   - Monitor memory, CPU, and event loop
   - Connection pooling and caching

2. **Horizontal Scaling (Scale Out)**

   - Node.js cluster module
   - PM2 process manager
   - Load balancing with NGINX
   - Multiple server instances

3. **Microservices Architecture**

   - Service decomposition
   - API gateway pattern
   - Service discovery
   - Inter-service communication

4. **Database Scaling**

   - Read replicas for read-heavy workloads
   - Sharding for data distribution
   - Connection pooling
   - Query optimization

5. **Caching Strategies**

   - Redis/Memcached
   - Multi-level caching
   - Cache patterns (aside, through, behind)
   - Session management

6. **Containerization**
   - Docker for consistent deployment
   - Docker Compose for multi-container apps
   - Kubernetes for orchestration
   - Auto-scaling and self-healing

### Key Considerations:

- **Monitoring**: Implement comprehensive monitoring and alerting
- **Health Checks**: Regular health checks for all services
- **Graceful Shutdown**: Handle termination signals properly
- **Zero Downtime**: Use rolling deployments
- **State Management**: Handle session and state across instances
- **Database Connections**: Use connection pooling
- **Cost Optimization**: Balance performance with infrastructure costs

Successful scaling requires a combination of these strategies tailored to your specific application needs, traffic patterns, and business requirements.
