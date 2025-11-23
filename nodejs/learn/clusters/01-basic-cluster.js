/**
 * Node.js Cluster Module - Basic Examples
 * 
 * This file demonstrates the fundamentals of clustering:
 * - Creating workers
 * - Master/worker detection
 * - Basic worker management
 * - Worker lifecycle
 */

const cluster = require('cluster');
const os = require('os');

// ============================================
// EXAMPLE 1: Minimal Cluster Setup
// ============================================

function example1_MinimalCluster() {
  console.log('\n=== Example 1: Minimal Cluster Setup ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`);
    
    // Fork a single worker
    const worker = cluster.fork();
    console.log(`Forked worker ${worker.id} (PID: ${worker.process.pid})`);
    
    // Wait a bit then exit
    setTimeout(() => {
      console.log('\nMaster shutting down...');
      process.exit(0);
    }, 2000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} (PID: ${process.pid}) started`);
    
    // Worker does some work
    setInterval(() => {
      console.log(`  Worker ${process.pid} is working...`);
    }, 500);
  }
}

// ============================================
// EXAMPLE 2: Fork Multiple Workers
// ============================================

function example2_MultipleWorkers() {
  console.log('\n=== Example 2: Multiple Workers ===\n');
  
  if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    console.log(`Master ${process.pid} is running`);
    console.log(`CPU cores available: ${numCPUs}`);
    console.log(`Forking ${numCPUs} workers...\n`);
    
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork();
      console.log(`Forked worker ${worker.id} (PID: ${worker.process.pid})`);
    }
    
    console.log(`\nTotal workers: ${Object.keys(cluster.workers).length}`);
    
    // Cleanup
    setTimeout(() => {
      console.log('\nShutting down all workers...');
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 3000);
    
  } else {
    console.log(`  → Worker ${cluster.worker.id} started`);
    
    // Simulate work
    setTimeout(() => {
      console.log(`  → Worker ${cluster.worker.id} completed task`);
    }, 1000 + Math.random() * 1000);
  }
}

// ============================================
// EXAMPLE 3: Worker Lifecycle Events
// ============================================

function example3_WorkerLifecycle() {
  console.log('\n=== Example 3: Worker Lifecycle Events ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} starting...\n`);
    
    // Listen to worker events
    cluster.on('fork', (worker) => {
      console.log(`[FORK] Worker ${worker.id} (PID: ${worker.process.pid}) is forking`);
    });
    
    cluster.on('online', (worker) => {
      console.log(`[ONLINE] Worker ${worker.id} is online`);
    });
    
    cluster.on('listening', (worker, address) => {
      console.log(`[LISTENING] Worker ${worker.id} is listening on ${address.address}:${address.port}`);
    });
    
    cluster.on('disconnect', (worker) => {
      console.log(`[DISCONNECT] Worker ${worker.id} has disconnected`);
    });
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`[EXIT] Worker ${worker.id} died (code: ${code}, signal: ${signal})`);
    });
    
    // Fork a worker
    console.log('Forking worker...\n');
    const worker = cluster.fork();
    
    // Kill worker after 2 seconds
    setTimeout(() => {
      console.log('\nMaster sending kill signal...');
      worker.kill();
      
      setTimeout(() => process.exit(0), 1000);
    }, 2000);
    
  } else {
    const http = require('http');
    
    // Create a simple server to trigger 'listening' event
    const server = http.createServer((req, res) => {
      res.end('OK');
    });
    
    server.listen(0); // Random port
    
    console.log(`  Worker ${process.pid} is running`);
  }
}

// ============================================
// EXAMPLE 4: Detecting Master vs Worker
// ============================================

function example4_MasterWorkerDetection() {
  console.log('\n=== Example 4: Master vs Worker Detection ===\n');
  
  // Method 1: cluster.isMaster / cluster.isWorker
  console.log('Method 1: Using cluster properties');
  console.log(`  cluster.isMaster: ${cluster.isMaster}`);
  console.log(`  cluster.isWorker: ${cluster.isWorker}`);
  
  // Method 2: process.env.NODE_UNIQUE_ID
  console.log('\nMethod 2: Using environment variable');
  console.log(`  process.env.NODE_UNIQUE_ID: ${process.env.NODE_UNIQUE_ID || 'undefined (master)'}`);
  
  // Method 3: cluster.worker
  console.log('\nMethod 3: Using cluster.worker');
  console.log(`  cluster.worker: ${cluster.worker ? `Worker ${cluster.worker.id}` : 'undefined (master)'}`);
  
  if (cluster.isMaster) {
    console.log('\n→ This is the MASTER process\n');
    
    const worker = cluster.fork();
    
    setTimeout(() => {
      worker.kill();
      process.exit(0);
    }, 2000);
  } else {
    console.log('\n→ This is a WORKER process\n');
    console.log(`  Worker ID: ${cluster.worker.id}`);
    console.log(`  Worker PID: ${process.pid}`);
  }
}

// ============================================
// EXAMPLE 5: Worker Information
// ============================================

function example5_WorkerInformation() {
  console.log('\n=== Example 5: Worker Information ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    // Fork 3 workers
    for (let i = 0; i < 3; i++) {
      cluster.fork();
    }
    
    // Display worker information after all are online
    setTimeout(() => {
      console.log('\nWorker Information:');
      console.log('═══════════════════════════════════════\n');
      
      for (const id in cluster.workers) {
        const worker = cluster.workers[id];
        console.log(`Worker ${worker.id}:`);
        console.log(`  PID: ${worker.process.pid}`);
        console.log(`  State: ${worker.state}`);
        console.log(`  Connected: ${worker.isConnected()}`);
        console.log(`  Dead: ${worker.isDead()}`);
        console.log('');
      }
      
      // Cleanup
      setTimeout(() => {
        for (const id in cluster.workers) {
          cluster.workers[id].kill();
        }
        process.exit(0);
      }, 2000);
    }, 1000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} (PID: ${process.pid}) started`);
  }
}

// ============================================
// EXAMPLE 6: Forking Workers with Environment Variables
// ============================================

function example6_WorkerEnvironment() {
  console.log('\n=== Example 6: Worker Environment Variables ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    // Fork workers with different environment variables
    const roles = ['api', 'worker', 'scheduler'];
    
    roles.forEach((role, index) => {
      const worker = cluster.fork({ WORKER_ROLE: role });
      console.log(`Forked worker ${worker.id} with role: ${role}`);
    });
    
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 3000);
    
  } else {
    const role = process.env.WORKER_ROLE || 'unknown';
    console.log(`  → Worker ${cluster.worker.id} (PID: ${process.pid}) assigned role: ${role}`);
    
    // Different behavior based on role
    switch (role) {
      case 'api':
        console.log(`    [API Worker] Handling HTTP requests`);
        break;
      case 'worker':
        console.log(`    [Background Worker] Processing jobs`);
        break;
      case 'scheduler':
        console.log(`    [Scheduler] Running scheduled tasks`);
        break;
    }
  }
}

// ============================================
// EXAMPLE 7: Controlled Worker Shutdown
// ============================================

function example7_ControlledShutdown() {
  console.log('\n=== Example 7: Controlled Worker Shutdown ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const worker = cluster.fork();
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`\n[Master] Worker ${worker.id} exited (code: ${code})`);
    });
    
    // Shutdown sequence
    setTimeout(() => {
      console.log('[Master] Requesting graceful shutdown...');
      
      // Disconnect worker (stops accepting new work)
      worker.disconnect();
      
      // Force kill if not done in 5 seconds
      setTimeout(() => {
        if (!worker.isDead()) {
          console.log('[Master] Worker not responding, force killing...');
          worker.kill('SIGKILL');
        }
        process.exit(0);
      }, 5000);
      
    }, 2000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} (PID: ${process.pid}) started`);
    
    // Listen for disconnect
    cluster.worker.on('disconnect', () => {
      console.log(`[Worker ${cluster.worker.id}] Received disconnect signal`);
      console.log(`[Worker ${cluster.worker.id}] Cleaning up...`);
      
      // Simulate cleanup
      setTimeout(() => {
        console.log(`[Worker ${cluster.worker.id}] Cleanup complete, exiting gracefully`);
        process.exit(0);
      }, 1000);
    });
    
    // Simulate work
    setInterval(() => {
      console.log(`  Worker ${cluster.worker.id} is working...`);
    }, 500);
  }
}

// ============================================
// EXAMPLE 8: Worker Restart on Crash
// ============================================

function example8_AutoRestart() {
  console.log('\n=== Example 8: Auto-Restart on Crash ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    let crashCount = 0;
    
    // Fork initial worker
    cluster.fork();
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`\n[Master] Worker ${worker.id} died (code: ${code})`);
      
      // Auto-restart
      if (code !== 0) {
        crashCount++;
        console.log(`[Master] Crash count: ${crashCount}`);
        
        if (crashCount <= 3) {
          console.log('[Master] Restarting worker...\n');
          setTimeout(() => {
            cluster.fork();
          }, 1000);
        } else {
          console.log('[Master] Too many crashes, giving up');
          process.exit(1);
        }
      }
    });
    
    // Cleanup
    setTimeout(() => {
      console.log('\n[Master] Test complete, shutting down...');
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 10000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} (PID: ${process.pid}) started`);
    
    // Simulate random crashes
    const crashAfter = 1000 + Math.random() * 2000;
    setTimeout(() => {
      console.log(`[Worker ${cluster.worker.id}] Simulating crash!`);
      throw new Error('Simulated crash');
    }, crashAfter);
  }
}

// ============================================
// EXAMPLE 9: Worker State Monitoring
// ============================================

function example9_WorkerStateMonitoring() {
  console.log('\n=== Example 9: Worker State Monitoring ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    // Fork workers
    for (let i = 0; i < 2; i++) {
      cluster.fork();
    }
    
    // Monitor worker states
    const monitor = setInterval(() => {
      console.log('\n─── Worker Status ───');
      
      for (const id in cluster.workers) {
        const worker = cluster.workers[id];
        console.log(`Worker ${worker.id}:`);
        console.log(`  State: ${worker.state}`);
        console.log(`  Connected: ${worker.isConnected()}`);
        console.log(`  Dead: ${worker.isDead()}`);
      }
      
      console.log('');
    }, 2000);
    
    // Kill one worker after 3 seconds
    setTimeout(() => {
      const firstWorker = cluster.workers[1];
      console.log(`\nKilling worker ${firstWorker.id}...\n`);
      firstWorker.kill();
    }, 3000);
    
    // Cleanup
    setTimeout(() => {
      clearInterval(monitor);
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 8000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} (PID: ${process.pid}) started`);
    
    // Simulate work
    setInterval(() => {
      // Silent work
    }, 100);
  }
}

// ============================================
// EXAMPLE 10: Cluster Setup Function
// ============================================

function example10_ClusterSetupFunction() {
  console.log('\n=== Example 10: Reusable Cluster Setup ===\n');
  
  function setupCluster(numWorkers, workerFunction) {
    if (cluster.isMaster) {
      console.log(`Master ${process.pid} is running`);
      console.log(`Forking ${numWorkers} workers...\n`);
      
      // Fork workers
      for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
      }
      
      // Handle worker death
      cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.id} died. Restarting...`);
        cluster.fork();
      });
      
      // Handle shutdown
      process.on('SIGTERM', () => {
        console.log('Master received SIGTERM, shutting down...');
        for (const id in cluster.workers) {
          cluster.workers[id].kill();
        }
      });
      
    } else {
      console.log(`Worker ${cluster.worker.id} (PID: ${process.pid}) started`);
      workerFunction();
    }
  }
  
  // Usage
  setupCluster(2, () => {
    // Worker code
    console.log(`  Worker ${process.pid} is processing tasks...`);
    
    setInterval(() => {
      console.log(`  Worker ${process.pid} processed task`);
    }, 2000);
  });
  
  // Cleanup for example
  if (cluster.isMaster) {
    setTimeout(() => {
      console.log('\nExample complete, shutting down...');
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 6000);
  }
}

// ============================================
// Run Examples
// ============================================

function runExample(exampleNumber) {
  switch (exampleNumber) {
    case 1:
      example1_MinimalCluster();
      break;
    case 2:
      example2_MultipleWorkers();
      break;
    case 3:
      example3_WorkerLifecycle();
      break;
    case 4:
      example4_MasterWorkerDetection();
      break;
    case 5:
      example5_WorkerInformation();
      break;
    case 6:
      example6_WorkerEnvironment();
      break;
    case 7:
      example7_ControlledShutdown();
      break;
    case 8:
      example8_AutoRestart();
      break;
    case 9:
      example9_WorkerStateMonitoring();
      break;
    case 10:
      example10_ClusterSetupFunction();
      break;
    default:
      console.log('Invalid example number. Choose 1-10.');
  }
}

// Get example number from command line
const exampleNumber = parseInt(process.argv[2]) || 1;

console.log('╔════════════════════════════════════════╗');
console.log('║   Node.js Cluster Basic Examples      ║');
console.log('╚════════════════════════════════════════╝');

runExample(exampleNumber);

// Export for testing
module.exports = { setupCluster: example10_ClusterSetupFunction };
