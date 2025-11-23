/**
 * Node.js Cluster - Production Patterns
 * 
 * Production-ready clustering patterns:
 * - Health monitoring
 * - Memory leak detection
 * - CPU monitoring
 * - Auto-scaling
 * - Circuit breaker
 * - Request timeout
 * - Rate limiting
 */

const cluster = require('cluster');
const http = require('http');
const os = require('os');

const NUM_WORKERS = Math.min(4, os.cpus().length);
const PORT = process.env.PORT || 3000;

// ============================================
// EXAMPLE 1: Health Monitoring System
// ============================================

function example1_HealthMonitoring() {
  console.log('\n=== Example 1: Health Monitoring System ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const workerHealth = new Map();
    const HEALTH_CHECK_INTERVAL = 3000;
    const HEALTH_TIMEOUT = 2000;
    const MAX_FAILURES = 3;
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      workerHealth.set(worker.id, {
        failures: 0,
        lastCheck: Date.now(),
        status: 'unknown'
      });
    }
    
    cluster.on('message', (worker, message) => {
      if (message.type === 'health') {
        const health = workerHealth.get(worker.id);
        if (health) {
          health.failures = 0;
          health.lastCheck = Date.now();
          health.status = message.healthy ? 'healthy' : 'unhealthy';
          health.metrics = message.metrics;
        }
      }
    });
    
    // Periodic health checks
    setInterval(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'health-check' });
      }
      
      setTimeout(() => {
        for (const [workerId, health] of workerHealth) {
          const timeSinceCheck = Date.now() - health.lastCheck;
          
          if (timeSinceCheck > HEALTH_TIMEOUT) {
            health.failures++;
            console.log(`⚠️  Worker ${workerId} health check timeout (${health.failures}/${MAX_FAILURES})`);
            
            if (health.failures >= MAX_FAILURES) {
              console.log(`❌ Worker ${workerId} exceeded max failures, restarting...`);
              const worker = cluster.workers[workerId];
              if (worker) {
                worker.kill();
                workerHealth.delete(workerId);
              }
            }
          }
        }
      }, HEALTH_TIMEOUT);
    }, HEALTH_CHECK_INTERVAL);
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`[Master] Worker ${worker.id} died, starting replacement...`);
      const newWorker = cluster.fork();
      workerHealth.set(newWorker.id, {
        failures: 0,
        lastCheck: Date.now(),
        status: 'starting'
      });
    });
    
    // Display health dashboard
    setInterval(() => {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║          Health Dashboard              ║');
      console.log('╚════════════════════════════════════════╝\n');
      
      for (const [workerId, health] of workerHealth) {
        const icon = health.status === 'healthy' ? '✅' : health.status === 'unhealthy' ? '❌' : '⚠️';
        console.log(`${icon} Worker ${workerId}:`);
        console.log(`   Status: ${health.status}`);
        console.log(`   Failures: ${health.failures}/${MAX_FAILURES}`);
        if (health.metrics) {
          console.log(`   Memory: ${(health.metrics.memory / 1024 / 1024).toFixed(2)}MB`);
          console.log(`   CPU: ${health.metrics.cpu.toFixed(2)}%`);
        }
        console.log('');
      }
    }, 5000);
    
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 20000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end(`Worker ${cluster.worker.id}`);
    });
    
    server.listen(PORT);
    
    process.on('message', (message) => {
      if (message.type === 'health-check') {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        process.send({
          type: 'health',
          healthy: true,
          metrics: {
            memory: memUsage.heapUsed,
            cpu: (cpuUsage.user + cpuUsage.system) / 1000,
            uptime: process.uptime()
          }
        });
      }
    });
  }
}

// ============================================
// EXAMPLE 2: Memory Leak Detection
// ============================================

function example2_MemoryLeakDetection() {
  console.log('\n=== Example 2: Memory Leak Detection ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const workerMemory = new Map();
    const MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB
    const GROWTH_RATE_THRESHOLD = 10 * 1024 * 1024; // 10MB per check
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      workerMemory.set(worker.id, {
        samples: [],
        restarts: 0
      });
    }
    
    cluster.on('message', (worker, message) => {
      if (message.type === 'memory') {
        const memData = workerMemory.get(worker.id);
        if (memData) {
          memData.samples.push({
            memory: message.heapUsed,
            timestamp: Date.now()
          });
          
          // Keep only last 10 samples
          if (memData.samples.length > 10) {
            memData.samples.shift();
          }
          
          // Check for memory leak
          if (memData.samples.length >= 5) {
            const growth = memData.samples[memData.samples.length - 1].memory - 
                          memData.samples[0].memory;
            const timespan = memData.samples[memData.samples.length - 1].timestamp - 
                           memData.samples[0].timestamp;
            const growthRate = growth / (timespan / 1000); // bytes per second
            
            if (message.heapUsed > MEMORY_THRESHOLD || growthRate > GROWTH_RATE_THRESHOLD / 5) {
              console.log(`⚠️  Worker ${worker.id} potential memory leak detected:`);
              console.log(`   Current: ${(message.heapUsed / 1024 / 1024).toFixed(2)}MB`);
              console.log(`   Growth rate: ${(growthRate / 1024 / 1024).toFixed(2)}MB/s`);
              console.log(`   Restarting worker...\n`);
              
              memData.restarts++;
              worker.kill();
            }
          }
        }
      }
    });
    
    cluster.on('exit', (worker, code, signal) => {
      const memData = workerMemory.get(worker.id);
      console.log(`[Master] Worker ${worker.id} exited (restarts: ${memData?.restarts || 0})`);
      
      const newWorker = cluster.fork();
      workerMemory.set(newWorker.id, {
        samples: [],
        restarts: memData?.restarts || 0
      });
      workerMemory.delete(worker.id);
    });
    
    // Request memory stats
    setInterval(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'get-memory' });
      }
    }, 2000);
    
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 20000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    // Simulate memory leak
    const leak = [];
    setInterval(() => {
      leak.push(new Array(1000000).fill('x')); // Add ~1MB
    }, 1000);
    
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end(`Worker ${cluster.worker.id}`);
    });
    
    server.listen(PORT);
    
    process.on('message', (message) => {
      if (message.type === 'get-memory') {
        const memUsage = process.memoryUsage();
        process.send({
          type: 'memory',
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal
        });
      }
    });
  }
}

// ============================================
// EXAMPLE 3: CPU Monitoring & Load Balancing
// ============================================

function example3_CPUMonitoring() {
  console.log('\n=== Example 3: CPU Monitoring ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const workerLoad = new Map();
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      workerLoad.set(worker.id, {
        requests: 0,
        cpuTime: 0,
        lastCPU: null
      });
    }
    
    cluster.on('message', (worker, message) => {
      if (message.type === 'stats') {
        const load = workerLoad.get(worker.id);
        if (load) {
          if (load.lastCPU) {
            const cpuDiff = {
              user: message.cpu.user - load.lastCPU.user,
              system: message.cpu.system - load.lastCPU.system
            };
            load.cpuTime = (cpuDiff.user + cpuDiff.system) / 1000000; // Convert to seconds
          }
          load.lastCPU = message.cpu;
          load.requests = message.requests;
        }
      }
    });
    
    // Request stats
    setInterval(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'get-stats' });
      }
    }, 2000);
    
    // Display load distribution
    setInterval(() => {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║        CPU & Load Dashboard            ║');
      console.log('╚════════════════════════════════════════╝\n');
      
      let totalRequests = 0;
      let totalCPU = 0;
      
      for (const [workerId, load] of workerLoad) {
        console.log(`Worker ${workerId}:`);
        console.log(`  Requests: ${load.requests}`);
        console.log(`  CPU Time: ${load.cpuTime.toFixed(2)}s`);
        
        totalRequests += load.requests;
        totalCPU += load.cpuTime;
      }
      
      console.log(`\nTotal: ${totalRequests} requests, ${totalCPU.toFixed(2)}s CPU time\n`);
    }, 5000);
    
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 15000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    let requestCount = 0;
    
    const server = http.createServer((req, res) => {
      requestCount++;
      
      // Simulate CPU work
      const start = Date.now();
      while (Date.now() - start < 100) {
        Math.sqrt(Math.random());
      }
      
      res.writeHead(200);
      res.end(`Worker ${cluster.worker.id}`);
    });
    
    server.listen(PORT);
    
    process.on('message', (message) => {
      if (message.type === 'get-stats') {
        process.send({
          type: 'stats',
          requests: requestCount,
          cpu: process.cpuUsage()
        });
      }
    });
  }
}

// ============================================
// EXAMPLE 4: Circuit Breaker Pattern
// ============================================

function example4_CircuitBreaker() {
  console.log('\n=== Example 4: Circuit Breaker Pattern ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const circuitBreakers = new Map();
    const FAILURE_THRESHOLD = 5;
    const TIMEOUT = 10000; // 10 seconds
    const HALF_OPEN_TIMEOUT = 5000; // 5 seconds
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      circuitBreakers.set(worker.id, {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failures: 0,
        lastFailure: null,
        successCount: 0
      });
    }
    
    cluster.on('message', (worker, message) => {
      if (message.type === 'health') {
        const breaker = circuitBreakers.get(worker.id);
        if (!breaker) return;
        
        if (message.healthy) {
          breaker.failures = 0;
          breaker.successCount++;
          
          if (breaker.state === 'HALF_OPEN' && breaker.successCount >= 3) {
            console.log(`✅ Worker ${worker.id} circuit breaker: HALF_OPEN -> CLOSED`);
            breaker.state = 'CLOSED';
            breaker.successCount = 0;
          }
        } else {
          breaker.failures++;
          breaker.lastFailure = Date.now();
          breaker.successCount = 0;
          
          if (breaker.state === 'CLOSED' && breaker.failures >= FAILURE_THRESHOLD) {
            console.log(`❌ Worker ${worker.id} circuit breaker: CLOSED -> OPEN`);
            breaker.state = 'OPEN';
            
            setTimeout(() => {
              console.log(`⚠️  Worker ${worker.id} circuit breaker: OPEN -> HALF_OPEN`);
              breaker.state = 'HALF_OPEN';
              breaker.failures = 0;
            }, HALF_OPEN_TIMEOUT);
          } else if (breaker.state === 'HALF_OPEN') {
            console.log(`❌ Worker ${worker.id} circuit breaker: HALF_OPEN -> OPEN`);
            breaker.state = 'OPEN';
          }
        }
      }
    });
    
    // Health checks
    setInterval(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'health-check' });
      }
    }, 2000);
    
    // Display circuit breaker status
    setInterval(() => {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║       Circuit Breaker Status           ║');
      console.log('╚════════════════════════════════════════╝\n');
      
      for (const [workerId, breaker] of circuitBreakers) {
        const icon = breaker.state === 'CLOSED' ? '✅' : 
                     breaker.state === 'OPEN' ? '❌' : '⚠️';
        console.log(`${icon} Worker ${workerId}: ${breaker.state}`);
        console.log(`   Failures: ${breaker.failures}/${FAILURE_THRESHOLD}`);
        console.log(`   Success Count: ${breaker.successCount}\n`);
      }
    }, 5000);
    
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 20000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end(`Worker ${cluster.worker.id}`);
    });
    
    server.listen(PORT);
    
    process.on('message', (message) => {
      if (message.type === 'health-check') {
        // Simulate random failures
        const healthy = Math.random() > 0.3;
        
        process.send({
          type: 'health',
          healthy
        });
      }
    });
  }
}

// ============================================
// EXAMPLE 5: Rate Limiting Per Worker
// ============================================

function example5_RateLimiting() {
  console.log('\n=== Example 5: Rate Limiting ===\n');
  
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running\n`);
    
    const workerStats = new Map();
    
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = cluster.fork();
      workerStats.set(worker.id, {
        requests: 0,
        limited: 0
      });
    }
    
    cluster.on('message', (worker, message) => {
      if (message.type === 'stats') {
        workerStats.set(worker.id, message.stats);
      }
    });
    
    // Request stats
    setInterval(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'get-stats' });
      }
    }, 1000);
    
    // Display stats
    setInterval(() => {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║         Rate Limiting Stats            ║');
      console.log('╚════════════════════════════════════════╝\n');
      
      let totalRequests = 0;
      let totalLimited = 0;
      
      for (const [workerId, stats] of workerStats) {
        console.log(`Worker ${workerId}:`);
        console.log(`  Accepted: ${stats.requests}`);
        console.log(`  Limited: ${stats.limited}`);
        
        totalRequests += stats.requests;
        totalLimited += stats.limited;
      }
      
      console.log(`\nTotal: ${totalRequests} accepted, ${totalLimited} limited\n`);
    }, 3000);
    
    setTimeout(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    }, 15000);
    
  } else {
    console.log(`Worker ${cluster.worker.id} started\n`);
    
    const RATE_LIMIT = 10; // requests per second
    const WINDOW = 1000; // 1 second
    
    const requestLog = [];
    let requestCount = 0;
    let limitedCount = 0;
    
    const server = http.createServer((req, res) => {
      const now = Date.now();
      
      // Remove old requests
      while (requestLog.length > 0 && requestLog[0] < now - WINDOW) {
        requestLog.shift();
      }
      
      if (requestLog.length >= RATE_LIMIT) {
        limitedCount++;
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end('Too Many Requests');
      } else {
        requestLog.push(now);
        requestCount++;
        res.writeHead(200);
        res.end(`Worker ${cluster.worker.id}`);
      }
    });
    
    server.listen(PORT);
    
    process.on('message', (message) => {
      if (message.type === 'get-stats') {
        process.send({
          type: 'stats',
          stats: {
            requests: requestCount,
            limited: limitedCount
          }
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
      example1_HealthMonitoring();
      break;
    case 2:
      example2_MemoryLeakDetection();
      break;
    case 3:
      example3_CPUMonitoring();
      break;
    case 4:
      example4_CircuitBreaker();
      break;
    case 5:
      example5_RateLimiting();
      break;
    default:
      console.log('Invalid example number. Choose 1-5.');
      process.exit(1);
  }
}

const exampleNumber = parseInt(process.argv[2]) || 1;

console.log('╔════════════════════════════════════════╗');
console.log('║  Node.js Production Patterns Examples ║');
console.log('╚════════════════════════════════════════╝');

runExample(exampleNumber);
