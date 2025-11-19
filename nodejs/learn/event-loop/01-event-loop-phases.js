/**
 * Event Loop Phases - Detailed Examples
 * 
 * This file demonstrates each phase of the Node.js event loop
 * with real examples and explanations.
 */

console.log('='.repeat(60));
console.log('Event Loop Phases - Detailed Examples');
console.log('='.repeat(60) + '\n');

// ============================================
// Example 1: Basic Event Loop Order
// ============================================
function example1_BasicOrder() {
  console.log('--- Example 1: Basic Event Loop Order ---\n');
  
  console.log('1. Synchronous start');
  
  setTimeout(() => {
    console.log('4. setTimeout (Timer phase)');
  }, 0);
  
  setImmediate(() => {
    console.log('6. setImmediate (Check phase)');
  });
  
  Promise.resolve().then(() => {
    console.log('3. Promise (Microtask)');
  });
  
  process.nextTick(() => {
    console.log('2. nextTick (Microtask - highest priority)');
  });
  
  console.log('1. Synchronous end\n');
  
  // Expected order:
  // 1. Synchronous start
  // 1. Synchronous end
  // 2. nextTick (microtask)
  // 3. Promise (microtask)
  // 4. setTimeout (timer phase)
  // 6. setImmediate (check phase) - may vary with setTimeout
}

// ============================================
// Example 2: Timer Phase Details
// ============================================
function example2_TimerPhase() {
  console.log('\n--- Example 2: Timer Phase ---\n');
  
  const start = Date.now();
  
  setTimeout(() => {
    console.log(`Timer 1 executed after ${Date.now() - start}ms (scheduled for 0ms)`);
  }, 0);
  
  setTimeout(() => {
    console.log(`Timer 2 executed after ${Date.now() - start}ms (scheduled for 50ms)`);
  }, 50);
  
  setTimeout(() => {
    console.log(`Timer 3 executed after ${Date.now() - start}ms (scheduled for 100ms)`);
  }, 100);
  
  // Timers are not guaranteed to execute at exact time
  // They execute AFTER at least the specified delay
  
  console.log('Timers scheduled. They will execute in order based on delay.\n');
}

// ============================================
// Example 3: Poll Phase with I/O
// ============================================
function example3_PollPhase() {
  console.log('\n--- Example 3: Poll Phase (I/O) ---\n');
  
  const fs = require('fs');
  
  console.log('Starting file read...');
  
  // File I/O - handled in poll phase
  fs.readFile(__filename, (err, data) => {
    console.log('File read complete (Poll phase callback)');
    console.log(`File size: ${data.length} bytes`);
    
    // Inside I/O callback, setImmediate runs before setTimeout
    setTimeout(() => {
      console.log('  → setTimeout inside I/O callback');
    }, 0);
    
    setImmediate(() => {
      console.log('  → setImmediate inside I/O callback (runs first!)');
    });
  });
  
  console.log('File read initiated (non-blocking)\n');
}

// ============================================
// Example 4: Check Phase (setImmediate)
// ============================================
function example4_CheckPhase() {
  console.log('\n--- Example 4: Check Phase ---\n');
  
  const fs = require('fs');
  
  fs.readFile(__filename, () => {
    console.log('I/O callback executed (Poll phase)');
    
    // setImmediate executes in check phase
    // After poll phase completes
    setImmediate(() => {
      console.log('  → Check phase: setImmediate 1');
      
      // Nested setImmediate goes to next iteration
      setImmediate(() => {
        console.log('  → Check phase: setImmediate 2 (next iteration)');
      });
    });
    
    // setTimeout goes to next iteration's timer phase
    setTimeout(() => {
      console.log('  → Timer phase: setTimeout (next iteration)');
    }, 0);
  });
  
  console.log('Demonstrating check phase...\n');
}

// ============================================
// Example 5: Close Callbacks Phase
// ============================================
function example5_CloseCallbacks() {
  console.log('\n--- Example 5: Close Callbacks Phase ---\n');
  
  const net = require('net');
  
  const server = net.createServer();
  
  server.on('close', () => {
    console.log('Server closed (Close callbacks phase)');
  });
  
  server.listen(0, () => {
    console.log('Server started');
    console.log('Closing server...');
    server.close();
  });
  
  console.log('Close callbacks example initiated\n');
}

// ============================================
// Example 6: Complete Phase Cycle
// ============================================
function example6_CompletePhases() {
  console.log('\n--- Example 6: Complete Phase Cycle ---\n');
  
  const fs = require('fs');
  
  // Timer phase
  setTimeout(() => console.log('1. Timer phase: setTimeout'), 0);
  setInterval(() => {
    console.log('2. Timer phase: setInterval');
    clearInterval(this); // Run only once
  }, 0);
  
  // Poll phase (I/O)
  fs.readFile(__filename, () => {
    console.log('3. Poll phase: I/O callback');
    
    // Check phase
    setImmediate(() => {
      console.log('4. Check phase: setImmediate');
    });
  });
  
  // Microtasks (between phases)
  Promise.resolve().then(() => console.log('5. Microtask: Promise'));
  process.nextTick(() => console.log('6. Microtask: nextTick'));
  
  console.log('All phases demonstrated\n');
}

// ============================================
// Example 7: Microtasks Between Phases
// ============================================
function example7_MicrotasksBetweenPhases() {
  console.log('\n--- Example 7: Microtasks Between Phases ---\n');
  
  setTimeout(() => {
    console.log('Timer 1');
    
    // Microtasks run after each timer callback
    Promise.resolve().then(() => console.log('  → Promise after Timer 1'));
    process.nextTick(() => console.log('  → nextTick after Timer 1'));
  }, 0);
  
  setTimeout(() => {
    console.log('Timer 2');
    
    Promise.resolve().then(() => console.log('  → Promise after Timer 2'));
    process.nextTick(() => console.log('  → nextTick after Timer 2'));
  }, 0);
  
  setTimeout(() => {
    console.log('Timer 3\n');
  }, 0);
  
  console.log('Microtasks execute between each timer callback\n');
}

// ============================================
// Example 8: Recursive setImmediate vs nextTick
// ============================================
function example8_RecursiveComparison() {
  console.log('\n--- Example 8: Recursive setImmediate vs nextTick ---\n');
  
  let immediateCount = 0;
  let tickCount = 0;
  
  // Safe recursive setImmediate (allows I/O)
  function recursiveImmediate() {
    immediateCount++;
    if (immediateCount <= 3) {
      console.log(`setImmediate iteration ${immediateCount}`);
      setImmediate(recursiveImmediate);
    }
  }
  
  // Dangerous recursive nextTick (blocks I/O)
  function recursiveTick() {
    tickCount++;
    if (tickCount <= 3) {
      console.log(`nextTick iteration ${tickCount}`);
      process.nextTick(recursiveTick);
    }
  }
  
  console.log('Safe: setImmediate allows I/O between iterations');
  recursiveImmediate();
  
  console.log('\nCareful: nextTick can block if not limited');
  recursiveTick();
  
  console.log('\nBoth completed\n');
}

// ============================================
// Example 9: Understanding Execution Context
// ============================================
function example9_ExecutionContext() {
  console.log('\n--- Example 9: Execution Context Matters ---\n');
  
  const fs = require('fs');
  
  // Context 1: Main module (order may vary)
  console.log('Context: Main module');
  setTimeout(() => console.log('  setTimeout'), 0);
  setImmediate(() => console.log('  setImmediate'));
  console.log('  (Order may vary)\n');
  
  // Context 2: Inside I/O callback (setImmediate always first)
  fs.readFile(__filename, () => {
    console.log('Context: Inside I/O callback');
    setTimeout(() => console.log('  setTimeout'), 0);
    setImmediate(() => console.log('  setImmediate (always first here!)'));
    console.log('  (setImmediate always wins)\n');
  });
}

// ============================================
// Example 10: Practical - Event Loop Monitoring
// ============================================
function example10_EventLoopMonitoring() {
  console.log('\n--- Example 10: Event Loop Monitoring ---\n');
  
  const start = process.hrtime.bigint();
  
  // Schedule a check
  setImmediate(() => {
    const end = process.hrtime.bigint();
    const lag = Number(end - start) / 1000000; // Convert to milliseconds
    
    console.log(`Event loop lag: ${lag.toFixed(2)}ms`);
    
    if (lag > 10) {
      console.log('⚠️  High event loop lag detected!');
    } else {
      console.log('✓ Event loop is responsive');
    }
  });
  
  // Simulate some work
  const arr = new Array(1000).fill(0);
  arr.forEach((_, i) => arr[i] = Math.random());
  
  console.log('Monitoring event loop lag...\n');
}

// ============================================
// Run Examples Sequentially
// ============================================
async function runAllExamples() {
  example1_BasicOrder();
  
  await sleep(100);
  example2_TimerPhase();
  
  await sleep(200);
  example3_PollPhase();
  
  await sleep(100);
  example4_CheckPhase();
  
  await sleep(100);
  example5_CloseCallbacks();
  
  await sleep(100);
  example6_CompletePhases();
  
  await sleep(100);
  example7_MicrotasksBetweenPhases();
  
  await sleep(100);
  example8_RecursiveComparison();
  
  await sleep(100);
  example9_ExecutionContext();
  
  await sleep(200);
  example10_EventLoopMonitoring();
  
  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    console.log('All examples completed!');
    console.log('='.repeat(60));
    console.log('\nKey Takeaways:');
    console.log('1. Event loop has 6 phases: timers, pending, idle, poll, check, close');
    console.log('2. Microtasks (nextTick, Promises) run between phases');
    console.log('3. process.nextTick() has highest priority');
    console.log('4. setImmediate() runs in check phase after I/O');
    console.log('5. Context matters for setTimeout vs setImmediate order');
    console.log('6. Never block the event loop with CPU-intensive work');
  }, 500);
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for testing
module.exports = {
  example1_BasicOrder,
  example2_TimerPhase,
  example3_PollPhase,
  example4_CheckPhase,
  example5_CloseCallbacks,
  example6_CompletePhases,
  example7_MicrotasksBetweenPhases,
  example8_RecursiveComparison,
  example9_ExecutionContext,
  example10_EventLoopMonitoring
};

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
