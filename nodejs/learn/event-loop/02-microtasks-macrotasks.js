/**
 * Microtasks vs Macrotasks - Deep Dive
 * 
 * Understanding the difference between:
 * - process.nextTick()
 * - Promise callbacks
 * - setTimeout()
 * - setImmediate()
 */

console.log('='.repeat(60));
console.log('Microtasks vs Macrotasks - Detailed Examples');
console.log('='.repeat(60) + '\n');

// ============================================
// Example 1: Priority Order
// ============================================
function example1_PriorityOrder() {
  console.log('--- Example 1: Execution Priority Order ---\n');
  
  console.log('Start');
  
  // Macrotasks
  setTimeout(() => console.log('5. setTimeout 0ms'), 0);
  setTimeout(() => console.log('6. setTimeout 10ms'), 10);
  setImmediate(() => console.log('7. setImmediate'));
  
  // Microtasks
  Promise.resolve()
    .then(() => console.log('3. Promise.then'))
    .then(() => console.log('4. Promise.then chained'));
  
  process.nextTick(() => console.log('2. process.nextTick'));
  
  console.log('1. End\n');
  
  // Priority: Synchronous → nextTick → Promises → Timers → Immediate
}

// ============================================
// Example 2: Nested Microtasks
// ============================================
function example2_NestedMicrotasks() {
  console.log('\n--- Example 2: Nested Microtasks ---\n');
  
  console.log('1. Start');
  
  process.nextTick(() => {
    console.log('2. nextTick 1');
    
    process.nextTick(() => {
      console.log('3. nextTick 1.1 (nested)');
      
      Promise.resolve().then(() => {
        console.log('4. Promise inside nested nextTick');
      });
    });
    
    Promise.resolve().then(() => {
      console.log('5. Promise 1');
    });
  });
  
  Promise.resolve().then(() => {
    console.log('6. Promise 2');
    
    process.nextTick(() => {
      console.log('7. nextTick inside Promise');
    });
  });
  
  console.log('8. End\n');
  
  // Note: All nextTick callbacks resolve before Promises
}

// ============================================
// Example 3: Microtask Queue Exhaustion
// ============================================
function example3_MicrotaskExhaustion() {
  console.log('\n--- Example 3: Microtask Queue Exhaustion ---\n');
  
  let count = 0;
  
  function recursiveNextTick() {
    if (count < 5) {
      console.log(`nextTick iteration: ${++count}`);
      process.nextTick(recursiveNextTick);
    }
  }
  
  recursiveNextTick();
  
  // This setTimeout will only run after ALL nextTick callbacks
  setTimeout(() => {
    console.log('setTimeout (runs after all nextTick callbacks)');
  }, 0);
  
  console.log('Started recursive nextTick\n');
  
  // WARNING: Infinite nextTick recursion will starve the event loop!
}

// ============================================
// Example 4: Promise Microtasks
// ============================================
function example4_PromiseMicrotasks() {
  console.log('\n--- Example 4: Promise Microtasks ---\n');
  
  console.log('1. Synchronous');
  
  setTimeout(() => console.log('6. setTimeout'), 0);
  
  Promise.resolve()
    .then(() => {
      console.log('2. Promise 1');
      return Promise.resolve();
    })
    .then(() => {
      console.log('3. Promise 2');
    });
  
  Promise.resolve()
    .then(() => {
      console.log('4. Promise 3');
    })
    .then(() => {
      console.log('5. Promise 4');
    });
  
  console.log('7. Synchronous end\n');
  
  // Promises are microtasks, run before macrotasks
}

// ============================================
// Example 5: async/await and Microtasks
// ============================================
async function example5_AsyncAwait() {
  console.log('\n--- Example 5: async/await and Microtasks ---\n');
  
  console.log('1. Start');
  
  setTimeout(() => console.log('7. setTimeout'), 0);
  
  async function async1() {
    console.log('2. async1 start');
    await async2();
    console.log('5. async1 end'); // This is a microtask (Promise.then)
  }
  
  async function async2() {
    console.log('3. async2');
  }
  
  async1();
  
  Promise.resolve().then(() => {
    console.log('6. Promise.then');
  });
  
  console.log('4. End\n');
  
  // await creates a microtask for the code after it
}

// ============================================
// Example 6: nextTick vs setImmediate Performance
// ============================================
function example6_PerformanceComparison() {
  console.log('\n--- Example 6: Performance Comparison ---\n');
  
  const iterations = 10000;
  
  // Test nextTick
  console.time('nextTick');
  let nextTickCount = 0;
  function nextTickLoop() {
    if (++nextTickCount < iterations) {
      process.nextTick(nextTickLoop);
    } else {
      console.timeEnd('nextTick');
      
      // Test setImmediate
      console.time('setImmediate');
      let immediateCount = 0;
      function immediateLoop() {
        if (++immediateCount < iterations) {
          setImmediate(immediateLoop);
        } else {
          console.timeEnd('setImmediate');
          console.log('\nnextTick is faster but can block I/O!');
          console.log('setImmediate is safer for recursive operations\n');
        }
      }
      immediateLoop();
    }
  }
  nextTickLoop();
}

// ============================================
// Example 7: Mixing All Task Types
// ============================================
function example7_MixedTasks() {
  console.log('\n--- Example 7: All Task Types Mixed ---\n');
  
  console.log('1. Sync start');
  
  setTimeout(() => {
    console.log('9. setTimeout 0');
    process.nextTick(() => console.log('10. nextTick in setTimeout'));
  }, 0);
  
  setImmediate(() => {
    console.log('11. setImmediate');
    Promise.resolve().then(() => console.log('12. Promise in setImmediate'));
  });
  
  Promise.resolve()
    .then(() => {
      console.log('4. Promise 1');
      process.nextTick(() => console.log('5. nextTick in Promise'));
      return 'result';
    })
    .then((result) => {
      console.log('7. Promise 2:', result);
    });
  
  process.nextTick(() => {
    console.log('2. nextTick 1');
    Promise.resolve().then(() => console.log('6. Promise in nextTick'));
  });
  
  process.nextTick(() => {
    console.log('3. nextTick 2');
  });
  
  Promise.resolve().then(() => {
    console.log('8. Promise 3');
  });
  
  console.log('13. Sync end\n');
}

// ============================================
// Example 8: Macrotask Queue Behavior
// ============================================
function example8_MacrotaskQueue() {
  console.log('\n--- Example 8: Macrotask Queue Behavior ---\n');
  
  console.log('Scheduling multiple timers...');
  
  setTimeout(() => {
    console.log('Timer 1');
    // Microtask after each macrotask
    Promise.resolve().then(() => console.log('  → Promise after Timer 1'));
  }, 0);
  
  setTimeout(() => {
    console.log('Timer 2');
    Promise.resolve().then(() => console.log('  → Promise after Timer 2'));
  }, 0);
  
  setTimeout(() => {
    console.log('Timer 3');
    Promise.resolve().then(() => console.log('  → Promise after Timer 3'));
  }, 0);
  
  console.log('Timers scheduled\n');
  console.log('Microtasks run between each macrotask!\n');
}

// ============================================
// Example 9: Real-World Pattern - Batching
// ============================================
function example9_RealWorldBatching() {
  console.log('\n--- Example 9: Real-World Pattern - Batching Updates ---\n');
  
  class StateManager {
    constructor() {
      this.state = {};
      this.updateQueue = [];
      this.isUpdating = false;
    }
    
    setState(updates) {
      this.updateQueue.push(updates);
      
      // Batch updates using microtask
      if (!this.isUpdating) {
        this.isUpdating = true;
        Promise.resolve().then(() => this.flushUpdates());
      }
    }
    
    flushUpdates() {
      console.log('Flushing batched updates...');
      
      // Merge all updates
      const mergedUpdates = Object.assign({}, ...this.updateQueue);
      this.state = { ...this.state, ...mergedUpdates };
      
      console.log('New state:', this.state);
      this.updateQueue = [];
      this.isUpdating = false;
    }
  }
  
  const manager = new StateManager();
  
  console.log('Scheduling multiple state updates...');
  manager.setState({ name: 'John' });
  manager.setState({ age: 30 });
  manager.setState({ city: 'New York' });
  
  console.log('All updates batched and will execute in single microtask\n');
}

// ============================================
// Example 10: Common Pitfall - Starving I/O
// ============================================
function example10_IOStarvation() {
  console.log('\n--- Example 10: I/O Starvation Risk ---\n');
  
  const fs = require('fs');
  
  console.log('Reading file...');
  fs.readFile(__filename, () => {
    console.log('✓ File read completed (would be delayed if nextTick starves I/O)');
  });
  
  // BAD: This can starve I/O if count is large
  let count = 0;
  const maxCount = 100; // Safe number
  
  function potentialStarvation() {
    if (count < maxCount) {
      count++;
      process.nextTick(potentialStarvation);
    } else {
      console.log(`Completed ${count} nextTick callbacks`);
      console.log('File I/O could have been delayed!\n');
    }
  }
  
  potentialStarvation();
  
  // BETTER: Use setImmediate for recursive operations
  console.log('Better approach: Use setImmediate for recursive work');
}

// ============================================
// Example 11: Understanding Promise Timing
// ============================================
function example11_PromiseTiming() {
  console.log('\n--- Example 11: Promise Timing Scenarios ---\n');
  
  // Scenario 1: Resolved Promise
  console.log('1. Sync');
  Promise.resolve('immediate').then(val => console.log('2. Resolved promise:', val));
  console.log('3. Sync');
  
  // Scenario 2: Promise constructor
  new Promise(resolve => {
    console.log('4. Inside Promise constructor (sync!)');
    resolve('value');
  }).then(val => console.log('5. Promise.then:', val));
  
  // Scenario 3: Promise.resolve vs new Promise
  const p1 = Promise.resolve('p1');
  const p2 = new Promise(resolve => resolve('p2'));
  
  p1.then(val => console.log('6. p1:', val));
  p2.then(val => console.log('7. p2:', val));
  
  console.log('8. Sync end\n');
}

// ============================================
// Example 12: Comparison Table Visualization
// ============================================
function example12_ComparisonTable() {
  console.log('\n--- Example 12: Comparison Summary ---\n');
  
  console.log('Task Type Comparison:');
  console.log('┌─────────────────────┬──────────────┬───────────┬────────────┐');
  console.log('│ Method              │ Type         │ Priority  │ Blocks I/O │');
  console.log('├─────────────────────┼──────────────┼───────────┼────────────┤');
  console.log('│ process.nextTick()  │ Microtask    │ Highest   │ Yes (risk) │');
  console.log('│ Promise.then()      │ Microtask    │ High      │ Yes (risk) │');
  console.log('│ setTimeout()        │ Macrotask    │ Medium    │ No         │');
  console.log('│ setImmediate()      │ Macrotask    │ Medium    │ No         │');
  console.log('└─────────────────────┴──────────────┴───────────┴────────────┘\n');
  
  console.log('When to use:');
  console.log('• process.nextTick() → Rarely! Only when you need to run before I/O');
  console.log('• Promise.then()     → Async operations, modern async/await code');
  console.log('• setTimeout()       → Delayed execution, debouncing, throttling');
  console.log('• setImmediate()     → After I/O events, recursive operations\n');
}

// ============================================
// Run All Examples
// ============================================
async function runAllExamples() {
  example1_PriorityOrder();
  await sleep(100);
  
  example2_NestedMicrotasks();
  await sleep(100);
  
  example3_MicrotaskExhaustion();
  await sleep(100);
  
  example4_PromiseMicrotasks();
  await sleep(100);
  
  await example5_AsyncAwait();
  await sleep(100);
  
  example6_PerformanceComparison();
  await sleep(1500);
  
  example7_MixedTasks();
  await sleep(100);
  
  example8_MacrotaskQueue();
  await sleep(100);
  
  example9_RealWorldBatching();
  await sleep(100);
  
  example10_IOStarvation();
  await sleep(200);
  
  example11_PromiseTiming();
  await sleep(100);
  
  example12_ComparisonTable();
  
  console.log('='.repeat(60));
  console.log('All examples completed!');
  console.log('='.repeat(60));
}

// Helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export
module.exports = {
  example1_PriorityOrder,
  example2_NestedMicrotasks,
  example3_MicrotaskExhaustion,
  example4_PromiseMicrotasks,
  example5_AsyncAwait,
  example6_PerformanceComparison,
  example7_MixedTasks,
  example8_MacrotaskQueue,
  example9_RealWorldBatching,
  example10_IOStarvation,
  example11_PromiseTiming,
  example12_ComparisonTable
};

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
