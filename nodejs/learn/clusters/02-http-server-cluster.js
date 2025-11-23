/**
 * Node.js Cluster - HTTP Server Examples
 * 
 * Real-world examples of using cluster with HTTP servers:
 * - Basic clustered HTTP server
 * - Load distribution
 * - Session handling
 * - Performance testing
 * - Express.js clustering
 */

const cluster = require('cluster');
const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 3000;
const NUM_WORKERS = process.env.WORKERS || os.cpus().length;

// ============================================
// EXAMPLE 1: Basic Clustered HTTP Server
// ============================================

function example1_BasicHTTPCluster() {
  if (cluster.isMaster) {
    console.log('\n=== Example 1: Basic HTTP Cluster ===\n');
    console.log(`Master ${process.pid} is running`);
    console.log(`Starting ${NUM_WORKERS} workers on port ${PORT}\n`);
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    cluster.on('online', (worker) => {
      console.log(`Worker ${worker.id} (PID: ${worker.process.pid}) is online`);
    });
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.id} died. Starting new worker...`);
      cluster.fork();
    });
    
  } else {
    // Workers create HTTP servers
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Hello from worker ${process.pid}\n`);
    });
    
    server.listen(PORT, () => {
      console.log(`  Worker ${cluster.worker.id} listening on port ${PORT}`);
    });
  }
}

// ============================================
// EXAMPLE 2: Load Distribution Demonstration
// ============================================

function example2_LoadDistribution() {
  if (cluster.isMaster) {
    console.log('\n=== Example 2: Load Distribution ===\n');
    console.log(`Master ${process.pid} is running`);
    console.log(`Starting ${NUM_WORKERS} workers\n`);
    
    const workerStats = {};
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      workerStats[worker.id] = 0;
    }
    
    // Collect stats from workers
    cluster.on('message', (worker, message) => {
      if (message.type === 'request-handled') {
        workerStats[worker.id]++;
      }
    });
    
    // Display stats every 2 seconds
    setInterval(() => {
      console.log('\n─── Request Distribution ───');
      for (const id in workerStats) {
        console.log(`Worker ${id}: ${workerStats[id]} requests`);
      }
      console.log('');
    }, 2000);
    
  } else {
    const server = http.createServer((req, res) => {
      // Notify master
      process.send({ type: 'request-handled' });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        worker: cluster.worker.id,
        pid: process.pid,
        message: 'Request processed'
      }));
    });
    
    server.listen(PORT);
  }
}

// ============================================
// EXAMPLE 3: Worker-Specific Routes
// ============================================

function example3_WorkerSpecificRoutes() {
  if (cluster.isMaster) {
    console.log('\n=== Example 3: Worker-Specific Routes ===\n');
    console.log(`Master ${process.pid} is running\n`);
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker) => {
      console.log(`Worker ${worker.id} died. Restarting...`);
      cluster.fork();
    });
    
  } else {
    const server = http.createServer((req, res) => {
      const url = require('url').parse(req.url, true);
      
      switch (url.pathname) {
        case '/':
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>Clustered Server</h1>
            <p>Served by Worker ${cluster.worker.id} (PID: ${process.pid})</p>
            <p>Try these endpoints:</p>
            <ul>
              <li><a href="/status">/status</a> - Server status</li>
              <li><a href="/heavy">/heavy</a> - CPU-intensive task</li>
              <li><a href="/info">/info</a> - Worker info</li>
            </ul>
          `);
          break;
          
        case '/status':
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            worker: cluster.worker.id,
            pid: process.pid,
            uptime: process.uptime(),
            memory: process.memoryUsage()
          }, null, 2));
          break;
          
        case '/heavy':
          // Simulate CPU-intensive task
          const start = Date.now();
          let sum = 0;
          for (let i = 0; i < 1e7; i++) {
            sum += Math.sqrt(i);
          }
          const duration = Date.now() - start;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            worker: cluster.worker.id,
            duration: `${duration}ms`,
            result: sum
          }));
          break;
          
        case '/info':
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            workerId: cluster.worker.id,
            processId: process.pid,
            totalWorkers: NUM_WORKERS,
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch
          }, null, 2));
          break;
          
        default:
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
      }
    });
    
    server.listen(PORT, () => {
      console.log(`Worker ${cluster.worker.id} listening on port ${PORT}`);
    });
  }
}

// ============================================
// EXAMPLE 4: Express.js Clustering
// ============================================

function example4_ExpressClustering() {
  if (cluster.isMaster) {
    console.log('\n=== Example 4: Express.js Clustering ===\n');
    console.log(`Master ${process.pid} is running\n`);
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.id} died (${signal || code}). Restarting...`);
      cluster.fork();
    });
    
  } else {
    // Simplified Express-like routing
    const server = http.createServer((req, res) => {
      const url = require('url').parse(req.url, true);
      
      // Middleware: Logging
      console.log(`[Worker ${cluster.worker.id}] ${req.method} ${req.url}`);
      
      // Middleware: Response helpers
      res.json = (data) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      };
      
      // Routes
      if (req.method === 'GET' && url.pathname === '/api/users') {
        res.json({
          worker: cluster.worker.id,
          users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Charlie' }
          ]
        });
      } else if (req.method === 'GET' && url.pathname.startsWith('/api/users/')) {
        const userId = url.pathname.split('/')[3];
        res.json({
          worker: cluster.worker.id,
          user: { id: userId, name: `User ${userId}` }
        });
      } else if (req.method === 'POST' && url.pathname === '/api/users') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          res.json({
            worker: cluster.worker.id,
            message: 'User created',
            data: JSON.parse(body || '{}')
          });
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    });
    
    server.listen(PORT, () => {
      console.log(`Worker ${cluster.worker.id} listening on port ${PORT}`);
    });
  }
}

// ============================================
// EXAMPLE 5: Session Handling with Shared State
// ============================================

function example5_SessionHandling() {
  // Simulate shared session store (in production, use Redis)
  const sessions = new Map();
  
  if (cluster.isMaster) {
    console.log('\n=== Example 5: Session Handling ===\n');
    console.log(`Master ${process.pid} is running\n`);
    console.log('Note: In production, use Redis for session storage\n');
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    // Handle session requests from workers
    cluster.on('message', (worker, message) => {
      if (message.type === 'session-get') {
        const session = sessions.get(message.sessionId) || null;
        worker.send({
          type: 'session-response',
          requestId: message.requestId,
          session
        });
      } else if (message.type === 'session-set') {
        sessions.set(message.sessionId, message.data);
        worker.send({
          type: 'session-response',
          requestId: message.requestId,
          success: true
        });
      }
    });
    
    cluster.on('exit', (worker) => {
      console.log(`Worker ${worker.id} died. Restarting...`);
      cluster.fork();
    });
    
  } else {
    const crypto = require('crypto');
    const pendingRequests = new Map();
    
    // Helper: Get session from master
    function getSession(sessionId) {
      return new Promise((resolve) => {
        const requestId = crypto.randomBytes(16).toString('hex');
        pendingRequests.set(requestId, resolve);
        
        process.send({
          type: 'session-get',
          sessionId,
          requestId
        });
      });
    }
    
    // Helper: Set session in master
    function setSession(sessionId, data) {
      return new Promise((resolve) => {
        const requestId = crypto.randomBytes(16).toString('hex');
        pendingRequests.set(requestId, resolve);
        
        process.send({
          type: 'session-set',
          sessionId,
          data,
          requestId
        });
      });
    }
    
    // Handle responses from master
    process.on('message', (message) => {
      if (message.type === 'session-response') {
        const resolve = pendingRequests.get(message.requestId);
        if (resolve) {
          resolve(message.session || message.success);
          pendingRequests.delete(message.requestId);
        }
      }
    });
    
    const server = http.createServer(async (req, res) => {
      const url = require('url').parse(req.url, true);
      
      // Get session ID from cookie or create new
      const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {}) || {};
      
      let sessionId = cookies.sessionId;
      if (!sessionId) {
        sessionId = crypto.randomBytes(16).toString('hex');
      }
      
      if (url.pathname === '/login') {
        // Create session
        await setSession(sessionId, {
          username: 'user' + Math.floor(Math.random() * 1000),
          loggedInAt: Date.now()
        });
        
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': `sessionId=${sessionId}; HttpOnly`
        });
        res.end(JSON.stringify({
          worker: cluster.worker.id,
          message: 'Logged in',
          sessionId
        }));
        
      } else if (url.pathname === '/profile') {
        // Get session
        const session = await getSession(sessionId);
        
        if (session) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            worker: cluster.worker.id,
            session
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not authenticated' }));
        }
        
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <h1>Session Demo</h1>
          <p>Worker ${cluster.worker.id}</p>
          <p><a href="/login">Login</a> | <a href="/profile">Profile</a></p>
        `);
      }
    });
    
    server.listen(PORT, () => {
      console.log(`Worker ${cluster.worker.id} listening on port ${PORT}`);
    });
  }
}

// ============================================
// EXAMPLE 6: Performance Benchmarking
// ============================================

function example6_PerformanceBenchmark() {
  if (cluster.isMaster) {
    console.log('\n=== Example 6: Performance Benchmark ===\n');
    console.log(`Master ${process.pid} is running\n`);
    
    const startTime = Date.now();
    let totalRequests = 0;
    const workerRequests = {};
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      workerRequests[worker.id] = 0;
    }
    
    // Collect metrics
    cluster.on('message', (worker, message) => {
      if (message.type === 'request-handled') {
        totalRequests++;
        workerRequests[worker.id]++;
      }
    });
    
    // Display metrics every 2 seconds
    const metricsInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const rps = (totalRequests / elapsed).toFixed(2);
      
      console.log('\n─── Performance Metrics ───');
      console.log(`Total Requests: ${totalRequests}`);
      console.log(`Elapsed Time: ${elapsed.toFixed(2)}s`);
      console.log(`Requests/sec: ${rps}`);
      console.log('\nPer Worker:');
      for (const id in workerRequests) {
        console.log(`  Worker ${id}: ${workerRequests[id]} requests`);
      }
      console.log('');
    }, 2000);
    
    // Cleanup
    process.on('SIGTERM', () => {
      clearInterval(metricsInterval);
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    });
    
  } else {
    const server = http.createServer((req, res) => {
      // Notify master
      process.send({ type: 'request-handled' });
      
      // Simple response
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
    
    server.listen(PORT, () => {
      console.log(`Worker ${cluster.worker.id} listening on port ${PORT}`);
    });
  }
}

// ============================================
// EXAMPLE 7: Sticky Sessions (Simple Implementation)
// ============================================

function example7_StickySessions() {
  if (cluster.isMaster) {
    console.log('\n=== Example 7: Sticky Sessions ===\n');
    console.log(`Master ${process.pid} is running\n`);
    
    const workers = [];
    const ipToWorker = new Map();
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      workers.push(cluster.fork());
    }
    
    // Simple sticky session by IP
    const net = require('net');
    const server = net.createServer({ pauseOnConnect: true }, (connection) => {
      const ip = connection.remoteAddress;
      
      // Get or assign worker for this IP
      let workerId = ipToWorker.get(ip);
      if (!workerId || !cluster.workers[workerId]) {
        // Round-robin for new IPs
        workerId = workers[ipToWorker.size % workers.length].id;
        ipToWorker.set(ip, workerId);
      }
      
      // Forward connection to worker
      cluster.workers[workerId].send('sticky-session', connection);
      console.log(`Routed ${ip} to Worker ${workerId}`);
    });
    
    server.listen(PORT, () => {
      console.log(`Master listening on port ${PORT} with sticky sessions`);
    });
    
  } else {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Worker ${cluster.worker.id} (PID: ${process.pid})\n`);
    });
    
    // Listen on a random port initially
    server.listen(0, () => {
      console.log(`Worker ${cluster.worker.id} ready for sticky sessions`);
    });
    
    // Receive connections from master
    process.on('message', (message, connection) => {
      if (message === 'sticky-session') {
        server.emit('connection', connection);
        connection.resume();
      }
    });
  }
}

// ============================================
// Run Examples
// ============================================

function runExample(exampleNumber) {
  switch (exampleNumber) {
    case 1:
      example1_BasicHTTPCluster();
      break;
    case 2:
      example2_LoadDistribution();
      break;
    case 3:
      example3_WorkerSpecificRoutes();
      break;
    case 4:
      example4_ExpressClustering();
      break;
    case 5:
      example5_SessionHandling();
      break;
    case 6:
      example6_PerformanceBenchmark();
      break;
    case 7:
      example7_StickySessions();
      break;
    default:
      console.log('Invalid example number. Choose 1-7.');
      process.exit(1);
  }
}

// Get example number from command line
const exampleNumber = parseInt(process.argv[2]) || 1;

console.log('╔════════════════════════════════════════╗');
console.log('║  Node.js HTTP Server Cluster Examples ║');
console.log('╚════════════════════════════════════════╝');

runExample(exampleNumber);

// Handle graceful shutdown
if (cluster.isMaster) {
  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    process.exit(0);
  });
}
