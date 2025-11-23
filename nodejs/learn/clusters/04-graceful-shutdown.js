/**
 * Node.js Cluster - Graceful Shutdown
 * 
 * Zero-downtime deployment patterns:
 * - Graceful worker replacement
 * - Connection draining
 * - Rolling restarts
 * - Signal handling
 * - Timeout handling
 */

const cluster = require('cluster');
const http = require('http');
const os = require('os');

const NUM_WORKERS = Math.min(4, os.cpus().length);
const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

// ============================================
// EXAMPLE 1: Basic Graceful Shutdown
// ============================================

function example1_BasicGracefulShutdown() {
  console.log('\n=== Example 1: Basic Graceful Shutdown ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    // Simulate shutdown after 5 seconds
    setTimeout(() => {
      console.log('\n[Master] Initiating graceful shutdown...\n');
      
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'shutdown' });
      }
      
      // Force kill if not shut down in time
      setTimeout(() => {
        console.log('[Master] Force killing remaining workers...');
        for (const id in cluster.workers) {
          cluster.workers[id].kill();
        }
        process.exit(0);
      }, SHUTDOWN_TIMEOUT);
    }, 5000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    const server = http.createServer((req, res) => {
      // Simulate slow request
      setTimeout(() => {
        res.writeHead(200);
        res.end(`Worker ${cluster.worker.id}`);
      }, 2000);
    });
    
    server.listen(PORT);
    
    // Handle shutdown message
    process.on('message', (message) => {
      if (message.type === 'shutdown') {
        console.log(`[Worker ${cluster.worker.id}] Received shutdown signal`);
        
        // Stop accepting new connections
        server.close(() => {
          console.log(`[Worker ${cluster.worker.id}] Server closed, exiting...`);
          process.exit(0);
        });
      }
    });
  }
}

// ============================================
// EXAMPLE 2: Connection Draining
// ============================================

function example2_ConnectionDraining() {
  console.log('\n=== Example 2: Connection Draining ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    cluster.on('message', (worker, message) => {
      if (message.type === 'connections') {
        console.log(`[Master] Worker ${worker.id}: ${message.count} active connections`);
      }
    });
    
    // Simulate shutdown
    setTimeout(() => {
      console.log('\n[Master] Initiating shutdown with connection draining...\n');
      
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'shutdown' });
      }
    }, 5000);
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`[Master] Worker ${worker.id} exited`);
      
      if (Object.keys(cluster.workers).length === 0) {
        console.log('[Master] All workers shut down gracefully');
        process.exit(0);
      }
    });
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    const activeConnections = new Set();
    let isShuttingDown = false;
    
    const server = http.createServer((req, res) => {
      const connectionId = Date.now() + Math.random();
      activeConnections.add(connectionId);
      
      console.log(`[Worker ${cluster.worker.id}] New connection (${activeConnections.size} active)`);
      
      // Report connections to master
      process.send({ 
        type: 'connections', 
        count: activeConnections.size 
      });
      
      // Simulate work
      setTimeout(() => {
        res.writeHead(isShuttingDown ? 503 : 200);
        res.end(`Worker ${cluster.worker.id}`);
        
        activeConnections.delete(connectionId);
        console.log(`[Worker ${cluster.worker.id}] Connection closed (${activeConnections.size} remaining)`);
        
        // Check if ready to exit
        if (isShuttingDown && activeConnections.size === 0) {
          console.log(`[Worker ${cluster.worker.id}] All connections drained, exiting...`);
          server.close(() => process.exit(0));
        }
      }, 1000 + Math.random() * 2000);
    });
    
    server.listen(PORT);
    
    process.on('message', (message) => {
      if (message.type === 'shutdown') {
        console.log(`[Worker ${cluster.worker.id}] Shutdown signal received`);
        isShuttingDown = true;
        
        // Stop accepting new connections
        server.close(() => {
          console.log(`[Worker ${cluster.worker.id}] Server closed`);
        });
        
        // If no active connections, exit immediately
        if (activeConnections.size === 0) {
          console.log(`[Worker ${cluster.worker.id}] No active connections, exiting...`);
          process.exit(0);
        } else {
          console.log(`[Worker ${cluster.worker.id}] Draining ${activeConnections.size} connections...`);
          
          // Force exit after timeout
          setTimeout(() => {
            console.log(`[Worker ${cluster.worker.id}] Timeout reached, force exiting with ${activeConnections.size} connections`);
            process.exit(0);
          }, SHUTDOWN_TIMEOUT);
        }
      }
    });
  }
}

// ============================================
// EXAMPLE 3: Rolling Restart
// ============================================

function example3_RollingRestart() {
  console.log('\n=== Example 3: Rolling Restart (Zero Downtime) ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const workers = [];
    
    // Fork initial workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      workers.push(cluster.fork());
    }
    
    // Rolling restart function
    function rollingRestart() {
      console.log('\n[Master] Starting rolling restart...\n');
      
      let index = 0;
      
      function restartNext() {
        if (index >= workers.length) {
          console.log('\n[Master] Rolling restart complete!\n');
          return;
        }
        
        const oldWorker = workers[index];
        console.log(`[Master] Restarting Worker ${oldWorker.id}...`);
        
        // Fork new worker
        const newWorker = cluster.fork();
        
        newWorker.on('listening', () => {
          console.log(`[Master] New Worker ${newWorker.id} is ready`);
          
          // Gracefully shutdown old worker
          oldWorker.send({ type: 'shutdown' });
          
          oldWorker.on('exit', () => {
            console.log(`[Master] Old Worker ${oldWorker.id} shut down\n`);
            workers[index] = newWorker;
            index++;
            
            // Wait before restarting next worker
            setTimeout(restartNext, 2000);
          });
        });
      }
      
      restartNext();
    }
    
    // Start rolling restart after 3 seconds
    setTimeout(rollingRestart, 3000);
    
    // Cleanup
    setTimeout(() => {
      console.log('[Master] Shutting down...');
      for (const worker of workers) {
        if (worker.isConnected()) {
          worker.kill();
        }
      }
      process.exit(0);
    }, 20000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end(`Worker ${cluster.worker.id} (PID: ${process.pid})`);
    });
    
    server.listen(PORT, () => {
      console.log(`[Worker ${cluster.worker.id}] Listening on port ${PORT}`);
    });
    
    process.on('message', (message) => {
      if (message.type === 'shutdown') {
        console.log(`[Worker ${cluster.worker.id}] Graceful shutdown initiated`);
        
        server.close(() => {
          console.log(`[Worker ${cluster.worker.id}] Server closed`);
          process.exit(0);
        });
        
        // Force exit after timeout
        setTimeout(() => {
          process.exit(0);
        }, 5000);
      }
    });
  }
}

// ============================================
// EXAMPLE 4: SIGTERM/SIGINT Signal Handling
// ============================================

function example4_SignalHandling() {
  console.log('\n=== Example 4: Signal Handling ===\n');
  console.log('Press Ctrl+C to trigger graceful shutdown\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    let isShuttingDown = false;
    
    function gracefulShutdown(signal) {
      if (isShuttingDown) return;
      isShuttingDown = true;
      
      console.log(`\n[Master] Received ${signal}, initiating graceful shutdown...\n`);
      
      // Send shutdown signal to all workers
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'shutdown' });
      }
      
      // Force kill after timeout
      const forceTimeout = setTimeout(() => {
        console.log('[Master] Timeout reached, force killing workers...');
        for (const id in cluster.workers) {
          cluster.workers[id].kill('SIGKILL');
        }
        process.exit(1);
      }, SHUTDOWN_TIMEOUT);
      
      // Clear timeout when all workers exit
      cluster.on('exit', () => {
        if (Object.keys(cluster.workers).length === 0) {
          clearTimeout(forceTimeout);
          console.log('[Master] All workers exited gracefully');
          process.exit(0);
        }
      });
    }
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    const activeRequests = new Set();
    
    const server = http.createServer((req, res) => {
      const requestId = Date.now() + Math.random();
      activeRequests.add(requestId);
      
      // Simulate async work
      setTimeout(() => {
        res.writeHead(200);
        res.end(`Worker ${cluster.worker.id}`);
        activeRequests.delete(requestId);
      }, 1000);
    });
    
    server.listen(PORT);
    
    function gracefulShutdown() {
      console.log(`[Worker ${cluster.worker.id}] Shutting down gracefully...`);
      
      // Stop accepting new connections
      server.close(() => {
        console.log(`[Worker ${cluster.worker.id}] Server closed`);
      });
      
      // Wait for active requests to complete
      const checkInterval = setInterval(() => {
        if (activeRequests.size === 0) {
          clearInterval(checkInterval);
          console.log(`[Worker ${cluster.worker.id}] All requests completed, exiting...`);
          process.exit(0);
        } else {
          console.log(`[Worker ${cluster.worker.id}] Waiting for ${activeRequests.size} requests...`);
        }
      }, 1000);
      
      // Force exit after timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log(`[Worker ${cluster.worker.id}] Timeout reached, force exiting...`);
        process.exit(0);
      }, SHUTDOWN_TIMEOUT);
    }
    
    process.on('message', (message) => {
      if (message.type === 'shutdown') {
        gracefulShutdown();
      }
    });
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }
}

// ============================================
// EXAMPLE 5: Automatic Worker Replacement
// ============================================

function example5_AutomaticReplacement() {
  console.log('\n=== Example 5: Automatic Worker Replacement ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    let isShuttingDown = false;
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`[Master] Worker ${worker.id} died (${signal || code})`);
      
      if (!isShuttingDown) {
        console.log('[Master] Starting replacement worker...');
        cluster.fork();
      }
    });
    
    // Simulate worker crash
    setTimeout(() => {
      const workerId = Object.keys(cluster.workers)[0];
      console.log(`\n[Master] Simulating crash of Worker ${workerId}...\n`);
      cluster.workers[workerId].send({ type: 'crash' });
    }, 3000);
    
    // Graceful shutdown
    setTimeout(() => {
      console.log('\n[Master] Starting graceful shutdown...\n');
      isShuttingDown = true;
      
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'shutdown' });
      }
      
      setTimeout(() => {
        for (const id in cluster.workers) {
          cluster.workers[id].kill();
        }
        process.exit(0);
      }, 5000);
    }, 8000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end(`Worker ${cluster.worker.id}`);
    });
    
    server.listen(PORT);
    
    process.on('message', (message) => {
      if (message.type === 'crash') {
        console.log(`[Worker ${cluster.worker.id}] Simulating crash...`);
        process.exit(1);
      } else if (message.type === 'shutdown') {
        console.log(`[Worker ${cluster.worker.id}] Graceful shutdown...`);
        server.close(() => {
          process.exit(0);
        });
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
      example1_BasicGracefulShutdown();
      break;
    case 2:
      example2_ConnectionDraining();
      break;
    case 3:
      example3_RollingRestart();
      break;
    case 4:
      example4_SignalHandling();
      break;
    case 5:
      example5_AutomaticReplacement();
      break;
    default:
      console.log('Invalid example number. Choose 1-5.');
      process.exit(1);
  }
}

const exampleNumber = parseInt(process.argv[2]) || 1;

console.log('╔════════════════════════════════════════╗');
console.log('║  Node.js Graceful Shutdown Examples   ║');
console.log('╚════════════════════════════════════════╝');

runExample(exampleNumber);
