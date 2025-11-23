/**
 * Node.js Cluster - Worker Communication (IPC)
 * 
 * Examples of Inter-Process Communication between master and workers:
 * - Message passing
 * - Broadcasting
 * - Request-response patterns
 * - Worker coordination
 * - Shared tasks
 */

const cluster = require('cluster');
const os = require('os');

const NUM_WORKERS = Math.min(4, os.cpus().length);

// ============================================
// EXAMPLE 1: Basic Message Passing
// ============================================

function example1_BasicMessagePassing() {
  console.log('\n=== Example 1: Basic Message Passing ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const worker = cluster.fork();
    
    // Master receives message from worker
    worker.on('message', (message) => {
      console.log(`[Master] Received from worker: ${JSON.stringify(message)}`);
      
      // Reply to worker
      worker.send({
        type: 'reply',
        data: 'Message received!',
        timestamp: Date.now()
      });
    });
    
    // Send initial message to worker
    setTimeout(() => {
      console.log('[Master] Sending message to worker...\n');
      worker.send({
        type: 'greeting',
        message: 'Hello from master!'
      });
    }, 1000);
    
    // Cleanup
    setTimeout(() => {
      worker.kill();
      process.exit(0);
    }, 5000);
    
  } else {
    console.log(`Worker ${process.pid} is running\n`);
    
    // Worker receives message from master
    process.on('message', (message) => {
      console.log(`[Worker] Received from master: ${JSON.stringify(message)}`);
      
      if (message.type === 'greeting') {
        // Reply to master
        process.send({
          type: 'acknowledgment',
          workerId: cluster.worker.id,
          message: 'Hello from worker!'
        });
      }
    });
    
    // Worker sends initial message
    setTimeout(() => {
      console.log('[Worker] Sending message to master...\n');
      process.send({
        type: 'status',
        status: 'ready',
        workerId: cluster.worker.id
      });
    }, 500);
  }
}

// ============================================
// EXAMPLE 2: Broadcasting to All Workers
// ============================================

function example2_Broadcasting() {
  console.log('\n=== Example 2: Broadcasting to All Workers ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    // Broadcast function
    function broadcast(message) {
      console.log(`[Master] Broadcasting: ${JSON.stringify(message)}\n`);
      for (const id in cluster.workers) {
        cluster.workers[id].send(message);
      }
    }
    
    // Listen for worker messages
    cluster.on('message', (worker, message) => {
      if (message.type === 'echo') {
        console.log(`[Master] Echo from Worker ${worker.id}: ${message.data}`);
      }
    });
    
    // Broadcast messages
    setTimeout(() => {
      broadcast({ type: 'config', setting: 'value1' });
    }, 1000);
    
    setTimeout(() => {
      broadcast({ type: 'reload', reason: 'config changed' });
    }, 2000);
    
    setTimeout(() => {
      broadcast({ type: 'shutdown', timeout: 5000 });
    }, 3000);
    
    // Cleanup
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 5000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    process.on('message', (message) => {
      console.log(`[Worker ${cluster.worker.id}] Received: ${message.type}`);
      
      // Echo back to master
      process.send({
        type: 'echo',
        workerId: cluster.worker.id,
        data: `Acknowledged ${message.type}`
      });
    });
  }
}

// ============================================
// EXAMPLE 3: Request-Response Pattern
// ============================================

function example3_RequestResponse() {
  console.log('\n=== Example 3: Request-Response Pattern ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const pendingRequests = new Map();
    let requestId = 0;
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      cluster.fork();
    }
    
    // Helper: Send request to worker
    function sendRequest(workerId, data) {
      return new Promise((resolve, reject) => {
        const id = ++requestId;
        const worker = cluster.workers[workerId];
        
        if (!worker) {
          reject(new Error(`Worker ${workerId} not found`));
          return;
        }
        
        pendingRequests.set(id, { resolve, reject });
        
        worker.send({
          type: 'request',
          requestId: id,
          data
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (pendingRequests.has(id)) {
            pendingRequests.delete(id);
            reject(new Error('Request timeout'));
          }
        }, 5000);
      });
    }
    
    // Handle responses
    cluster.on('message', (worker, message) => {
      if (message.type === 'response') {
        const request = pendingRequests.get(message.requestId);
        if (request) {
          request.resolve(message.data);
          pendingRequests.delete(message.requestId);
        }
      }
    });
    
    // Send requests
    setTimeout(async () => {
      try {
        console.log('[Master] Sending request to Worker 1...');
        const response = await sendRequest(1, { task: 'process-data' });
        console.log(`[Master] Response: ${JSON.stringify(response)}\n`);
      } catch (err) {
        console.error('[Master] Error:', err.message);
      }
    }, 1000);
    
    // Cleanup
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 5000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    process.on('message', (message) => {
      if (message.type === 'request') {
        console.log(`[Worker ${cluster.worker.id}] Processing request ${message.requestId}`);
        
        // Simulate async work
        setTimeout(() => {
          process.send({
            type: 'response',
            requestId: message.requestId,
            data: {
              workerId: cluster.worker.id,
              result: 'Task completed',
              timestamp: Date.now()
            }
          });
        }, 500);
      }
    });
  }
}

// ============================================
// EXAMPLE 4: Worker Coordination
// ============================================

function example4_WorkerCoordination() {
  console.log('\n=== Example 4: Worker Coordination ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const workerStatus = {};
    let taskQueue = ['task1', 'task2', 'task3', 'task4', 'task5'];
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      workerStatus[worker.id] = 'idle';
    }
    
    // Handle worker messages
    cluster.on('message', (worker, message) => {
      if (message.type === 'ready') {
        workerStatus[worker.id] = 'idle';
        assignTask(worker);
      } else if (message.type === 'completed') {
        console.log(`[Master] Worker ${worker.id} completed: ${message.task}`);
        workerStatus[worker.id] = 'idle';
        assignTask(worker);
      }
    });
    
    // Assign tasks to workers
    function assignTask(worker) {
      if (taskQueue.length === 0) {
        console.log(`[Master] No more tasks for Worker ${worker.id}`);
        return;
      }
      
      const task = taskQueue.shift();
      workerStatus[worker.id] = 'busy';
      
      console.log(`[Master] Assigning "${task}" to Worker ${worker.id}`);
      worker.send({
        type: 'task',
        task
      });
    }
    
    // Display status
    const statusInterval = setInterval(() => {
      console.log('\n─── Worker Status ───');
      for (const id in workerStatus) {
        console.log(`Worker ${id}: ${workerStatus[id]}`);
      }
      console.log(`Tasks remaining: ${taskQueue.length}\n`);
      
      // Check if all done
      const allIdle = Object.values(workerStatus).every(s => s === 'idle');
      if (allIdle && taskQueue.length === 0) {
        console.log('All tasks completed!');
        clearInterval(statusInterval);
        
        setTimeout(() => {
          for (const id in cluster.workers) {
            cluster.workers[id].kill();
          }
          process.exit(0);
        }, 1000);
      }
    }, 1000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    // Signal ready
    process.send({ type: 'ready', workerId: cluster.worker.id });
    
    process.on('message', (message) => {
      if (message.type === 'task') {
        console.log(`[Worker ${cluster.worker.id}] Processing: ${message.task}`);
        
        // Simulate work
        setTimeout(() => {
          process.send({
            type: 'completed',
            workerId: cluster.worker.id,
            task: message.task
          });
        }, 1000 + Math.random() * 2000);
      }
    });
  }
}

// ============================================
// EXAMPLE 5: Collecting Metrics from Workers
// ============================================

function example5_MetricsCollection() {
  console.log('\n=== Example 5: Metrics Collection ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const metrics = {};
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      metrics[worker.id] = { requests: 0, errors: 0 };
    }
    
    // Collect metrics
    cluster.on('message', (worker, message) => {
      if (message.type === 'metrics') {
        metrics[worker.id] = message.data;
      }
    });
    
    // Request metrics every 2 seconds
    setInterval(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'get-metrics' });
      }
    }, 2000);
    
    // Display aggregated metrics
    setInterval(() => {
      console.log('\n─── Aggregated Metrics ───');
      
      let totalRequests = 0;
      let totalErrors = 0;
      
      for (const id in metrics) {
        const m = metrics[id];
        console.log(`Worker ${id}:`);
        console.log(`  Requests: ${m.requests}`);
        console.log(`  Errors: ${m.errors}`);
        console.log(`  Memory: ${(m.memory / 1024 / 1024).toFixed(2)}MB`);
        
        totalRequests += m.requests;
        totalErrors += m.errors;
      }
      
      console.log(`\nTotal: ${totalRequests} requests, ${totalErrors} errors\n`);
    }, 3000);
    
    // Cleanup
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 10000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    let requests = 0;
    let errors = 0;
    
    // Simulate work
    setInterval(() => {
      requests++;
      if (Math.random() < 0.1) errors++; // 10% error rate
    }, 100);
    
    process.on('message', (message) => {
      if (message.type === 'get-metrics') {
        const memUsage = process.memoryUsage();
        
        process.send({
          type: 'metrics',
          data: {
            requests,
            errors,
            memory: memUsage.heapUsed,
            uptime: process.uptime()
          }
        });
      }
    });
  }
}

// ============================================
// EXAMPLE 6: Worker Health Checks
// ============================================

function example6_HealthChecks() {
  console.log('\n=== Example 6: Worker Health Checks ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const workerHealth = {};
    
    // Fork workers
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      workerHealth[worker.id] = {
        lastCheck: Date.now(),
        status: 'unknown',
        consecutiveFailures: 0
      };
    }
    
    // Handle health responses
    cluster.on('message', (worker, message) => {
      if (message.type === 'health') {
        workerHealth[worker.id] = {
          lastCheck: Date.now(),
          status: message.status,
          consecutiveFailures: 0,
          ...message.data
        };
      }
    });
    
    // Periodic health checks
    setInterval(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'health-check' });
      }
      
      // Check for unresponsive workers
      setTimeout(() => {
        for (const id in workerHealth) {
          const health = workerHealth[id];
          const timeSinceCheck = Date.now() - health.lastCheck;
          
          if (timeSinceCheck > 5000) {
            health.consecutiveFailures++;
            console.log(`⚠️  Worker ${id} unresponsive (${health.consecutiveFailures} failures)`);
            
            if (health.consecutiveFailures >= 3) {
              console.log(`❌ Worker ${id} unhealthy, restarting...`);
              cluster.workers[id].kill();
              cluster.fork();
            }
          }
        }
      }, 2000);
    }, 3000);
    
    // Display health status
    setInterval(() => {
      console.log('\n─── Worker Health Status ───');
      for (const id in workerHealth) {
        const h = workerHealth[id];
        const icon = h.status === 'healthy' ? '✅' : '⚠️';
        console.log(`${icon} Worker ${id}: ${h.status} (${h.consecutiveFailures} failures)`);
      }
      console.log('');
    }, 5000);
    
    // Cleanup
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 15000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    process.on('message', (message) => {
      if (message.type === 'health-check') {
        // Simulate occasional unresponsiveness
        if (Math.random() > 0.1) {
          process.send({
            type: 'health',
            status: 'healthy',
            data: {
              memory: process.memoryUsage().heapUsed,
              uptime: process.uptime()
            }
          });
        }
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
      example1_BasicMessagePassing();
      break;
    case 2:
      example2_Broadcasting();
      break;
    case 3:
      example3_RequestResponse();
      break;
    case 4:
      example4_WorkerCoordination();
      break;
    case 5:
      example5_MetricsCollection();
      break;
    case 6:
      example6_HealthChecks();
      break;
    default:
      console.log('Invalid example number. Choose 1-6.');
      process.exit(1);
  }
}

// Get example number from command line
const exampleNumber = parseInt(process.argv[2]) || 1;

console.log('╔════════════════════════════════════════╗');
console.log('║  Node.js Worker Communication Examples║');
console.log('╚════════════════════════════════════════╝');

runExample(exampleNumber);
