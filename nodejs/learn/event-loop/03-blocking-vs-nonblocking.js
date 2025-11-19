/**
 * Blocking vs Non-Blocking Code
 * 
 * This file demonstrates the critical difference between
 * blocking and non-blocking operations in Node.js
 */

console.log('='.repeat(60));
console.log('Blocking vs Non-Blocking - Real World Examples');
console.log('='.repeat(60) + '\n');

// ============================================
// Example 1: Blocking Code (BAD)
// ============================================
function example1_BlockingCode() {
  console.log('--- Example 1: Blocking Code (BAD) ---\n');
  
  console.log('Starting blocking operation...');
  const start = Date.now();
  
  // This blocks the event loop for 3 seconds
  while (Date.now() - start < 3000) {
    // Spinning - nothing else can run!
  }
  
  console.log('Blocking operation complete (3 seconds)');
  console.log('⚠️  Nothing else could run during this time!\n');
}

// ============================================
// Example 2: Non-Blocking Alternative (GOOD)
// ============================================
function example2_NonBlockingCode() {
  console.log('--- Example 2: Non-Blocking Alternative (GOOD) ---\n');
  
  console.log('Starting non-blocking operation...');
  const start = Date.now();
  
  setTimeout(() => {
    console.log(`Non-blocking operation complete (${Date.now() - start}ms)`);
    console.log('✓ Other operations could run during this time!\n');
  }, 3000);
  
  console.log('Code continues executing immediately...');
  console.log('Event loop is free to process other tasks\n');
}

// ============================================
// Example 3: Synchronous File Operations (BAD)
// ============================================
function example3_SyncFileOperations() {
  console.log('--- Example 3: Synchronous File Operations (BAD) ---\n');
  
  const fs = require('fs');
  
  console.log('Reading file synchronously...');
  const start = Date.now();
  
  try {
    // Blocks until file is read
    const data = fs.readFileSync(__filename, 'utf8');
    const duration = Date.now() - start;
    
    console.log(`File read complete: ${data.length} bytes`);
    console.log(`Duration: ${duration}ms`);
    console.log('⚠️  Event loop was blocked during this time!\n');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// ============================================
// Example 4: Asynchronous File Operations (GOOD)
// ============================================
function example4_AsyncFileOperations() {
  console.log('--- Example 4: Asynchronous File Operations (GOOD) ---\n');
  
  const fs = require('fs');
  
  console.log('Reading file asynchronously...');
  const start = Date.now();
  
  fs.readFile(__filename, 'utf8', (err, data) => {
    const duration = Date.now() - start;
    
    if (err) {
      console.error('Error:', err.message);
      return;
    }
    
    console.log(`File read complete: ${data.length} bytes`);
    console.log(`Duration: ${duration}ms`);
    console.log('✓ Event loop was free during this time!\n');
  });
  
  console.log('Code continues executing immediately...');
  console.log('Other operations can run while file is being read\n');
}

// ============================================
// Example 5: CPU-Intensive Blocking
// ============================================
function example5_CPUIntensiveBlocking() {
  console.log('--- Example 5: CPU-Intensive Blocking (BAD) ---\n');
  
  console.log('Starting heavy calculation...');
  const start = Date.now();
  
  // Fibonacci - CPU intensive
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
  
  const result = fibonacci(40);
  const duration = Date.now() - start;
  
  console.log(`Result: ${result}`);
  console.log(`Duration: ${duration}ms`);
  console.log('⚠️  Blocked event loop - server can\'t handle requests!\n');
}

// ============================================
// Example 6: CPU-Intensive Non-Blocking (GOOD)
// ============================================
function example6_CPUIntensiveNonBlocking() {
  console.log('--- Example 6: CPU-Intensive Non-Blocking (GOOD) ---\n');
  
  const { Worker } = require('worker_threads');
  const path = require('path');
  
  console.log('Starting heavy calculation in worker thread...');
  const start = Date.now();
  
  // Create worker file on the fly
  const workerCode = `
    const { parentPort, workerData } = require('worker_threads');
    
    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    const result = fibonacci(workerData.n);
    parentPort.postMessage(result);
  `;
  
  const fs = require('fs');
  const workerFile = path.join(__dirname, 'temp-fibonacci-worker.js');
  fs.writeFileSync(workerFile, workerCode);
  
  const worker = new Worker(workerFile, { workerData: { n: 40 } });
  
  worker.on('message', (result) => {
    const duration = Date.now() - start;
    console.log(`Result: ${result}`);
    console.log(`Duration: ${duration}ms`);
    console.log('✓ Main thread was free - could handle other requests!\n');
    
    // Cleanup
    fs.unlinkSync(workerFile);
  });
  
  console.log('Main thread continues executing...');
  console.log('Worker handles CPU-intensive work\n');
}

// ============================================
// Example 7: Demonstrating Impact on Server
// ============================================
function example7_ServerImpact() {
  console.log('--- Example 7: Server Impact Demonstration ---\n');
  
  const http = require('http');
  
  let requestCount = 0;
  
  const server = http.createServer((req, res) => {
    requestCount++;
    const reqNum = requestCount;
    
    console.log(`Request ${reqNum} received`);
    
    if (req.url === '/blocking') {
      // BAD: Blocks for 5 seconds
      const start = Date.now();
      while (Date.now() - start < 5000) {}
      
      res.writeHead(200);
      res.end(`Request ${reqNum} completed (blocking)\n`);
      console.log(`⚠️  Request ${reqNum} blocked server for 5 seconds!`);
      
    } else if (req.url === '/non-blocking') {
      // GOOD: Non-blocking
      setTimeout(() => {
        res.writeHead(200);
        res.end(`Request ${reqNum} completed (non-blocking)\n`);
        console.log(`✓ Request ${reqNum} completed without blocking`);
      }, 5000);
      
    } else {
      res.writeHead(200);
      res.end(`Request ${reqNum} - Fast endpoint\n`);
      console.log(`✓ Request ${reqNum} completed instantly`);
    }
  });
  
  server.listen(3000, () => {
    console.log('Server listening on port 3000');
    console.log('Try these endpoints:');
    console.log('  http://localhost:3000/blocking');
    console.log('  http://localhost:3000/non-blocking');
    console.log('  http://localhost:3000/fast');
    console.log('\nNote: Blocking endpoint will prevent all other requests!\n');
    
    // Auto-close after demonstration
    setTimeout(() => {
      server.close();
      console.log('Server closed\n');
    }, 10000);
  });
}

// ============================================
// Example 8: Database Query Blocking
// ============================================
function example8_DatabaseBlocking() {
  console.log('--- Example 8: Database Query Patterns ---\n');
  
  // Simulated database
  const mockDB = {
    querySync(sql) {
      // Simulates blocking query
      const start = Date.now();
      while (Date.now() - start < 1000) {}
      return [{ id: 1, name: 'User 1' }];
    },
    
    queryAsync(sql, callback) {
      // Simulates non-blocking query
      setTimeout(() => {
        callback(null, [{ id: 1, name: 'User 1' }]);
      }, 1000);
    },
    
    queryPromise(sql) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([{ id: 1, name: 'User 1' }]);
        }, 1000);
      });
    }
  };
  
  // BAD: Synchronous query
  console.log('Executing synchronous query...');
  const start1 = Date.now();
  const result1 = mockDB.querySync('SELECT * FROM users');
  console.log(`⚠️  Query completed in ${Date.now() - start1}ms (blocking)`);
  console.log('Result:', result1);
  
  // GOOD: Async callback
  console.log('\nExecuting async query (callback)...');
  const start2 = Date.now();
  mockDB.queryAsync('SELECT * FROM users', (err, result) => {
    console.log(`✓ Query completed in ${Date.now() - start2}ms (non-blocking)`);
    console.log('Result:', result);
  });
  console.log('Code continues immediately...');
  
  // GOOD: Promise-based
  console.log('\nExecuting async query (promise)...');
  const start3 = Date.now();
  mockDB.queryPromise('SELECT * FROM users')
    .then(result => {
      console.log(`✓ Query completed in ${Date.now() - start3}ms (non-blocking)`);
      console.log('Result:', result);
      console.log();
    });
  console.log('Code continues immediately...\n');
}

// ============================================
// Example 9: Event Loop Lag Monitoring
// ============================================
function example9_EventLoopLag() {
  console.log('--- Example 9: Event Loop Lag Monitoring ---\n');
  
  let lagDetected = false;
  
  function monitorEventLoop() {
    const start = process.hrtime.bigint();
    
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000;
      
      if (lag > 100) {
        console.log(`⚠️  Event loop lag: ${lag.toFixed(2)}ms (threshold: 100ms)`);
        lagDetected = true;
      } else {
        console.log(`✓ Event loop lag: ${lag.toFixed(2)}ms (healthy)`);
      }
    });
  }
  
  console.log('Monitoring event loop lag...\n');
  
  // Check lag before blocking
  monitorEventLoop();
  
  setTimeout(() => {
    // Simulate blocking operation
    console.log('Simulating blocking operation...');
    const start = Date.now();
    while (Date.now() - start < 500) {}
    console.log('Blocking operation complete\n');
    
    // Check lag after blocking
    monitorEventLoop();
    
    setTimeout(() => {
      if (lagDetected) {
        console.log('\nConclusion: Blocking code causes event loop lag!');
      }
      console.log();
    }, 100);
  }, 100);
}

// ============================================
// Example 10: Best Practices Summary
// ============================================
function example10_BestPractices() {
  console.log('--- Example 10: Best Practices ---\n');
  
  console.log('❌ NEVER DO:');
  console.log('  • while(true) loops');
  console.log('  • fs.readFileSync() in production');
  console.log('  • Heavy calculations in main thread');
  console.log('  • Synchronous crypto operations');
  console.log('  • Large JSON.parse() on huge objects');
  console.log('  • Regular expressions on huge strings\n');
  
  console.log('✓ ALWAYS DO:');
  console.log('  • Use async/await or promises');
  console.log('  • Use worker threads for CPU work');
  console.log('  • Stream large files');
  console.log('  • Break up large operations');
  console.log('  • Monitor event loop lag');
  console.log('  • Set appropriate timeouts\n');
  
  console.log('Code Examples:\n');
  
  // BAD
  console.log('// ❌ BAD:');
  console.log('const data = fs.readFileSync("huge.json");');
  console.log('const parsed = JSON.parse(data);');
  console.log('for (let i = 0; i < 1000000000; i++) { /* work */ }\n');
  
  // GOOD
  console.log('// ✓ GOOD:');
  console.log('const data = await fs.promises.readFile("huge.json");');
  console.log('const parsed = JSON.parse(data);');
  console.log('const worker = new Worker("./cpu-intensive.js");\n');
}

// ============================================
// Example 11: Real-World Breaking Large Tasks
// ============================================
function example11_BreakingLargeTasks() {
  console.log('--- Example 11: Breaking Large Tasks ---\n');
  
  // Simulate processing large array
  const largeArray = new Array(10000).fill(0).map((_, i) => i);
  
  console.log(`Processing array with ${largeArray.length} items...\n`);
  
  // BAD: Process all at once (blocking)
  function processAllAtOnce() {
    console.log('Method 1: Process all at once (BLOCKS)');
    const start = Date.now();
    
    const results = largeArray.map(n => n * 2);
    
    console.log(`  Completed in ${Date.now() - start}ms`);
    console.log(`  ⚠️  Blocked event loop\n`);
  }
  
  // GOOD: Process in chunks (non-blocking)
  function processInChunks() {
    console.log('Method 2: Process in chunks (NON-BLOCKING)');
    const start = Date.now();
    const chunkSize = 1000;
    const results = [];
    let index = 0;
    
    function processChunk() {
      const chunk = largeArray.slice(index, index + chunkSize);
      results.push(...chunk.map(n => n * 2));
      
      index += chunkSize;
      
      if (index < largeArray.length) {
        // Use setImmediate to allow other operations
        setImmediate(processChunk);
      } else {
        console.log(`  Completed in ${Date.now() - start}ms`);
        console.log(`  ✓ Event loop stayed responsive\n`);
      }
    }
    
    processChunk();
  }
  
  processAllAtOnce();
  
  setTimeout(() => {
    processInChunks();
  }, 100);
}

// ============================================
// Run All Examples
// ============================================
async function runAllExamples() {
  // Warning examples
  console.log('⚠️  WARNING: Some examples intentionally block the event loop\n');
  
  example1_BlockingCode();
  await sleep(3500);
  
  example2_NonBlockingCode();
  await sleep(3500);
  
  example3_SyncFileOperations();
  await sleep(100);
  
  example4_AsyncFileOperations();
  await sleep(200);
  
  example5_CPUIntensiveBlocking();
  await sleep(100);
  
  example6_CPUIntensiveNonBlocking();
  await sleep(2000);
  
  // Skip server example in automated run
  // example7_ServerImpact();
  
  example8_DatabaseBlocking();
  await sleep(2000);
  
  example9_EventLoopLag();
  await sleep(1000);
  
  example10_BestPractices();
  
  example11_BreakingLargeTasks();
  
  setTimeout(() => {
    console.log('='.repeat(60));
    console.log('All examples completed!');
    console.log('='.repeat(60));
    console.log('\nKey Takeaways:');
    console.log('1. Never block the event loop with synchronous operations');
    console.log('2. Use async/await or callbacks for I/O');
    console.log('3. Use worker threads for CPU-intensive tasks');
    console.log('4. Break large tasks into chunks');
    console.log('5. Monitor event loop lag in production');
  }, 2000);
}

// Helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export
module.exports = {
  example1_BlockingCode,
  example2_NonBlockingCode,
  example3_SyncFileOperations,
  example4_AsyncFileOperations,
  example5_CPUIntensiveBlocking,
  example6_CPUIntensiveNonBlocking,
  example7_ServerImpact,
  example8_DatabaseBlocking,
  example9_EventLoopLag,
  example10_BestPractices,
  example11_BreakingLargeTasks
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
