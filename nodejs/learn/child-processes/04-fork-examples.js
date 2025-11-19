const { fork } = require('child_process');
const path = require('path');
const os = require('os');

/**
 * FORK() - Real World Examples
 * 
 * fork() is best for:
 * - Running CPU-intensive Node.js code
 * - Inter-process communication (IPC)
 * - Parallel processing of Node.js tasks
 * - Load balancing across CPU cores
 */

// ============================================
// Example 1: CPU-Intensive Calculation
// ============================================
function runHeavyCalculation(numbers) {
  console.log('=== Example 1: Heavy Calculation in Child Process ===');
  
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, 'workers', 'heavy-calculation.js');
    
    console.log(`Forking worker for ${numbers.length} calculations...`);
    const child = fork(workerPath);
    
    // Send data to child process
    child.send({ type: 'calculate', data: numbers });
    
    // Handle messages from child
    child.on('message', (message) => {
      if (message.type === 'result') {
        console.log('✓ Calculation completed');
        console.log(`  Result: ${JSON.stringify(message.result).substring(0, 100)}...`);
        console.log(`  Time: ${message.time}ms\n`);
        child.kill();
        resolve(message.result);
      } else if (message.type === 'progress') {
        process.stdout.write(`\rProgress: ${message.progress}%`);
      }
    });
    
    // Handle errors
    child.on('error', (error) => {
      console.error('\n✗ Worker error:', error.message);
      reject(error);
    });
    
    child.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.log(`\nWorker exited with code ${code}`);
      }
    });
  });
}

// ============================================
// Example 2: Parallel Data Processing
// ============================================
async function parallelDataProcessing(dataChunks) {
  console.log('=== Example 2: Parallel Data Processing ===');
  console.log(`Processing ${dataChunks.length} chunks in parallel...\n`);
  
  const workers = [];
  const results = [];
  const workerPath = path.join(__dirname, 'workers', 'data-processor.js');
  
  // Create a worker for each chunk
  const promises = dataChunks.map((chunk, index) => {
    return new Promise((resolve, reject) => {
      const worker = fork(workerPath);
      workers.push(worker);
      
      console.log(`Worker ${index + 1} started`);
      
      worker.send({ type: 'process', data: chunk, workerId: index + 1 });
      
      worker.on('message', (message) => {
        if (message.type === 'result') {
          console.log(`✓ Worker ${message.workerId} completed (${message.itemsProcessed} items)`);
          worker.kill();
          resolve(message.result);
        }
      });
      
      worker.on('error', reject);
    });
  });
  
  try {
    const allResults = await Promise.all(promises);
    const totalItems = allResults.reduce((sum, r) => sum + r.length, 0);
    console.log(`\n✓ All workers completed: ${totalItems} total items processed\n`);
    return allResults.flat();
  } catch (error) {
    // Kill all workers on error
    workers.forEach(w => w.kill());
    throw error;
  }
}

// ============================================
// Example 3: Worker Pool Pattern
// ============================================
class WorkerPool {
  constructor(workerScript, poolSize = os.cpus().length) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = new Set();
    
    console.log(`=== Example 3: Worker Pool (${poolSize} workers) ===\n`);
  }
  
  init() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = fork(this.workerScript);
      worker.workerId = i;
      worker.isReady = true;
      this.workers.push(worker);
      
      worker.on('message', (message) => {
        if (message.type === 'ready') {
          worker.isReady = true;
          this.activeWorkers.delete(worker);
          this.processNext();
        } else if (message.type === 'result') {
          // Task completed
          const task = worker.currentTask;
          if (task) {
            console.log(`✓ Worker ${worker.workerId} completed task: ${task.id}`);
            task.resolve(message.result);
          }
          worker.isReady = true;
          this.activeWorkers.delete(worker);
          this.processNext();
        }
      });
      
      worker.on('error', (error) => {
        const task = worker.currentTask;
        if (task) {
          task.reject(error);
        }
        worker.isReady = true;
        this.activeWorkers.delete(worker);
      });
    }
    
    console.log(`Worker pool initialized with ${this.poolSize} workers\n`);
  }
  
  execute(taskId, taskData) {
    return new Promise((resolve, reject) => {
      const task = { id: taskId, data: taskData, resolve, reject };
      this.taskQueue.push(task);
      this.processNext();
    });
  }
  
  processNext() {
    if (this.taskQueue.length === 0) return;
    
    // Find available worker
    const availableWorker = this.workers.find(w => w.isReady && !this.activeWorkers.has(w));
    
    if (!availableWorker) return;
    
    const task = this.taskQueue.shift();
    availableWorker.isReady = false;
    availableWorker.currentTask = task;
    this.activeWorkers.add(availableWorker);
    
    console.log(`→ Worker ${availableWorker.workerId} processing task: ${task.id}`);
    availableWorker.send({ type: 'task', data: task.data, taskId: task.id });
  }
  
  async close() {
    const closePromises = this.workers.map(worker => {
      return new Promise((resolve) => {
        worker.on('exit', resolve);
        worker.kill();
      });
    });
    
    await Promise.all(closePromises);
    console.log('\n✓ Worker pool closed\n');
  }
  
  getStats() {
    return {
      poolSize: this.poolSize,
      activeWorkers: this.activeWorkers.size,
      queuedTasks: this.taskQueue.length,
      availableWorkers: this.workers.filter(w => w.isReady).length
    };
  }
}

// ============================================
// Example 4: Load Balancing Across Cores
// ============================================
async function distributeWorkload(tasks) {
  console.log('=== Example 4: Load Balancing ===');
  
  const numCPUs = os.cpus().length;
  console.log(`Distributing ${tasks.length} tasks across ${numCPUs} CPU cores\n`);
  
  const workerPath = path.join(__dirname, 'workers', 'task-worker.js');
  const workers = [];
  const resultsMap = new Map();
  
  // Create worker for each CPU
  for (let i = 0; i < numCPUs; i++) {
    workers.push(fork(workerPath));
  }
  
  // Distribute tasks round-robin
  const taskPromises = tasks.map((task, index) => {
    const workerIndex = index % numCPUs;
    const worker = workers[workerIndex];
    
    return new Promise((resolve) => {
      const messageHandler = (message) => {
        if (message.taskId === task.id) {
          console.log(`✓ Task ${task.id} completed by worker ${workerIndex}`);
          worker.removeListener('message', messageHandler);
          resolve(message.result);
        }
      };
      
      worker.on('message', messageHandler);
      worker.send({ type: 'task', taskId: task.id, data: task.data });
    });
  });
  
  const results = await Promise.all(taskPromises);
  
  // Cleanup workers
  workers.forEach(w => w.kill());
  
  console.log(`\n✓ Load balancing completed: ${results.length} tasks processed\n`);
  return results;
}

// ============================================
// Example 5: Master-Worker Communication
// ============================================
function masterWorkerCommunication() {
  console.log('=== Example 5: Master-Worker Communication ===\n');
  
  return new Promise((resolve) => {
    const workerPath = path.join(__dirname, 'workers', 'interactive-worker.js');
    const worker = fork(workerPath);
    
    const messages = [
      { type: 'config', data: { mode: 'production', debug: false } },
      { type: 'process', data: { items: [1, 2, 3, 4, 5] } },
      { type: 'status' },
      { type: 'shutdown' }
    ];
    
    let messageIndex = 0;
    
    worker.on('message', (message) => {
      console.log(`← Master received: ${message.type}`, message.data || '');
      
      if (message.type === 'ready' || message.type === 'result' || message.type === 'status') {
        // Send next message
        if (messageIndex < messages.length) {
          const msg = messages[messageIndex++];
          console.log(`→ Master sending: ${msg.type}`, msg.data || '');
          worker.send(msg);
        }
      } else if (message.type === 'shutdown_complete') {
        console.log('✓ Worker shutdown complete\n');
        worker.kill();
        resolve();
      }
    });
    
    worker.on('exit', (code) => {
      console.log(`Worker exited with code ${code}\n`);
      resolve();
    });
  });
}

// ============================================
// Example 6: Error Handling and Recovery
// ============================================
async function errorHandlingExample() {
  console.log('=== Example 6: Error Handling and Recovery ===\n');
  
  const workerPath = path.join(__dirname, 'workers', 'error-prone-worker.js');
  
  const runWorkerWithRetry = async (taskData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}`);
        
        const result = await new Promise((resolve, reject) => {
          const worker = fork(workerPath);
          const timeout = setTimeout(() => {
            worker.kill();
            reject(new Error('Worker timeout'));
          }, 5000);
          
          worker.send({ type: 'task', data: taskData });
          
          worker.on('message', (message) => {
            clearTimeout(timeout);
            if (message.type === 'error') {
              worker.kill();
              reject(new Error(message.error));
            } else if (message.type === 'result') {
              worker.kill();
              resolve(message.result);
            }
          });
          
          worker.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
        
        console.log('✓ Task completed successfully\n');
        return result;
      } catch (error) {
        console.log(`✗ Attempt ${attempt} failed: ${error.message}`);
        if (attempt === maxRetries) {
          console.log('All retry attempts exhausted\n');
          throw error;
        }
        console.log('Retrying...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };
  
  try {
    await runWorkerWithRetry({ value: 42 });
  } catch (error) {
    console.error('Final error:', error.message);
  }
}

// ============================================
// Example 7: Graceful Shutdown
// ============================================
async function gracefulShutdownExample() {
  console.log('=== Example 7: Graceful Shutdown ===\n');
  
  const workerPath = path.join(__dirname, 'workers', 'long-running-worker.js');
  const worker = fork(workerPath);
  
  worker.send({ type: 'start', data: { duration: 10000 } });
  
  // Simulate shutdown after 2 seconds
  setTimeout(() => {
    console.log('Initiating graceful shutdown...');
    worker.send({ type: 'shutdown' });
  }, 2000);
  
  return new Promise((resolve) => {
    worker.on('message', (message) => {
      if (message.type === 'progress') {
        console.log(`Worker progress: ${message.progress}%`);
      } else if (message.type === 'shutdown_complete') {
        console.log('✓ Worker shut down gracefully\n');
        worker.kill();
        resolve();
      }
    });
    
    worker.on('exit', () => {
      resolve();
    });
  });
}

// ============================================
// Main Execution (Demonstration)
// ============================================
async function main() {
  console.log('Node.js Child Process - fork() Examples\n');
  
  // Create workers directory
  const workersDir = path.join(__dirname, 'workers');
  const fs = require('fs');
  if (!fs.existsSync(workersDir)) {
    fs.mkdirSync(workersDir, { recursive: true });
  }
  
  // Create sample worker files
  createSampleWorkers(workersDir);
  
  try {
    // Example 1: Heavy calculation
    const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
    await runHeavyCalculation(numbers);
    
    // Example 3: Worker pool
    const pool = new WorkerPool(path.join(workersDir, 'pool-worker.js'), 4);
    pool.init();
    
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: `task-${i + 1}`,
      data: { value: i + 1 }
    }));
    
    const poolPromises = tasks.map(task => pool.execute(task.id, task.data));
    await Promise.all(poolPromises);
    await pool.close();
    
    // Example 5: Master-Worker communication
    await masterWorkerCommunication();
    
    console.log('✓ All fork() examples demonstrated!');
    console.log('\nKey Takeaways:');
    console.log('- fork() creates Node.js child processes with IPC');
    console.log('- Perfect for CPU-intensive Node.js operations');
    console.log('- Use worker pools for efficient resource management');
    console.log('- Implement proper error handling and retry logic');
    console.log('- Always implement graceful shutdown');
    console.log('- Monitor worker health and resource usage');
    
  } catch (error) {
    console.error('Error in examples:', error);
  }
}

// ============================================
// Helper: Create Sample Worker Files
// ============================================
function createSampleWorkers(workersDir) {
  const fs = require('fs');
  
  // Heavy calculation worker
  const heavyCalcWorker = `
// Heavy calculation worker
process.on('message', (message) => {
  if (message.type === 'calculate') {
    const startTime = Date.now();
    const numbers = message.data;
    
    // Simulate heavy calculation
    const results = numbers.map((num, index) => {
      const progress = Math.round(((index + 1) / numbers.length) * 100);
      process.send({ type: 'progress', progress });
      
      // Calculate factorial (CPU intensive)
      let result = 1;
      for (let i = 1; i <= num * 10000; i++) {
        result = (result * i) % 1000000007;
      }
      return { num, factorial: result };
    });
    
    const time = Date.now() - startTime;
    process.send({ type: 'result', result: results, time });
  }
});
`;
  
  // Data processor worker
  const dataProcessorWorker = `
// Data processor worker
process.on('message', (message) => {
  if (message.type === 'process') {
    const data = message.data;
    const workerId = message.workerId;
    
    // Simulate data processing
    const processed = data.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now(),
      workerId
    }));
    
    setTimeout(() => {
      process.send({
        type: 'result',
        result: processed,
        workerId,
        itemsProcessed: processed.length
      });
    }, Math.random() * 1000 + 500);
  }
});
`;
  
  // Pool worker
  const poolWorker = `
// Pool worker
process.on('message', (message) => {
  if (message.type === 'task') {
    // Simulate work
    setTimeout(() => {
      const result = {
        taskId: message.taskId,
        data: message.data,
        processedAt: Date.now()
      };
      process.send({ type: 'result', result });
    }, Math.random() * 500 + 200);
  }
});
`;
  
  // Interactive worker
  const interactiveWorker = `
// Interactive worker
let config = null;

process.send({ type: 'ready' });

process.on('message', (message) => {
  switch (message.type) {
    case 'config':
      config = message.data;
      process.send({ type: 'ready', data: 'Config received' });
      break;
    case 'process':
      const result = message.data.items.map(i => i * 2);
      process.send({ type: 'result', data: result });
      break;
    case 'status':
      process.send({ type: 'status', data: { config, uptime: process.uptime() } });
      break;
    case 'shutdown':
      process.send({ type: 'shutdown_complete' });
      break;
  }
});
`;
  
  // Write worker files
  fs.writeFileSync(path.join(workersDir, 'heavy-calculation.js'), heavyCalcWorker.trim());
  fs.writeFileSync(path.join(workersDir, 'data-processor.js'), dataProcessorWorker.trim());
  fs.writeFileSync(path.join(workersDir, 'pool-worker.js'), poolWorker.trim());
  fs.writeFileSync(path.join(workersDir, 'interactive-worker.js'), interactiveWorker.trim());
  
  console.log('Sample worker files created\n');
}

// Export for use in other modules
module.exports = {
  runHeavyCalculation,
  parallelDataProcessing,
  WorkerPool,
  distributeWorkload,
  masterWorkerCommunication,
  errorHandlingExample,
  gracefulShutdownExample
};

// Run examples if executed directly
if (require.main === module) {
  main();
}
