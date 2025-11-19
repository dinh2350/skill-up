# How does garbage collection work in V8?

V8's garbage collection is a sophisticated memory management system that automatically reclaims memory used by objects that are no longer reachable. Understanding V8's GC is crucial for Node.js developers to write memory-efficient applications and avoid memory leaks.

## Overview of V8 Garbage Collection

V8 uses a **generational garbage collector** based on the observation that most objects die young. It divides the heap into different generations and uses different collection strategies for each.

### V8 Memory Layout

```javascript
// Understanding V8 memory structure
class V8MemoryExplorer {
  constructor() {
    this.memoryInfo = process.memoryUsage();
    this.v8Stats = v8.getHeapStatistics();
  }

  exploreMemoryLayout() {
    console.log("=== V8 MEMORY LAYOUT ===");

    // Node.js memory usage
    console.log("Process Memory Usage:");
    console.log(
      `  RSS (Resident Set Size): ${Math.round(
        this.memoryInfo.rss / 1024 / 1024
      )}MB`
    );
    console.log(
      `  Heap Total: ${Math.round(this.memoryInfo.heapTotal / 1024 / 1024)}MB`
    );
    console.log(
      `  Heap Used: ${Math.round(this.memoryInfo.heapUsed / 1024 / 1024)}MB`
    );
    console.log(
      `  External: ${Math.round(this.memoryInfo.external / 1024 / 1024)}MB`
    );
    console.log(
      `  Array Buffers: ${Math.round(
        this.memoryInfo.arrayBuffers / 1024 / 1024
      )}MB`
    );

    // V8 heap statistics
    console.log("\nV8 Heap Statistics:");
    console.log(
      `  Total Heap Size: ${Math.round(
        this.v8Stats.total_heap_size / 1024 / 1024
      )}MB`
    );
    console.log(
      `  Total Heap Size Executable: ${Math.round(
        this.v8Stats.total_heap_size_executable / 1024 / 1024
      )}MB`
    );
    console.log(
      `  Total Physical Size: ${Math.round(
        this.v8Stats.total_physical_size / 1024 / 1024
      )}MB`
    );
    console.log(
      `  Total Available Size: ${Math.round(
        this.v8Stats.total_available_size / 1024 / 1024
      )}MB`
    );
    console.log(
      `  Used Heap Size: ${Math.round(
        this.v8Stats.used_heap_size / 1024 / 1024
      )}MB`
    );
    console.log(
      `  Heap Size Limit: ${Math.round(
        this.v8Stats.heap_size_limit / 1024 / 1024
      )}MB`
    );
    console.log(
      `  Malloced Memory: ${Math.round(
        this.v8Stats.malloced_memory / 1024 / 1024
      )}MB`
    );
    console.log(
      `  Peak Malloced Memory: ${Math.round(
        this.v8Stats.peak_malloced_memory / 1024 / 1024
      )}MB`
    );
  }

  demonstrateGenerationalLayout() {
    console.log("\n=== GENERATIONAL HEAP STRUCTURE ===");

    const heapSpaces = {
      "New Space (Young Generation)": {
        description: "Where new objects are allocated",
        size: "1-8MB typically",
        gcType: "Scavenge GC (Minor GC)",
        frequency: "Very frequent (every few MB allocated)",
        algorithm: "Copying collector",
      },
      "Old Space (Old Generation)": {
        description: "Long-lived objects promoted from new space",
        size: "Most of the heap",
        gcType: "Mark-Sweep-Compact (Major GC)",
        frequency: "Less frequent",
        algorithm: "Mark-and-sweep with compaction",
      },
      "Large Object Space": {
        description: "Objects larger than ~500KB",
        size: "Variable",
        gcType: "Mark-Sweep (Major GC)",
        frequency: "With old space",
        algorithm: "Mark-and-sweep (no compaction)",
      },
      "Code Space": {
        description: "Compiled JavaScript code",
        size: "Small",
        gcType: "Mark-Sweep-Compact",
        frequency: "With old space",
        algorithm: "Mark-and-sweep",
      },
      "Map Space": {
        description: "Hidden class maps",
        size: "Small",
        gcType: "Mark-Sweep-Compact",
        frequency: "With old space",
        algorithm: "Mark-and-sweep",
      },
    };

    Object.entries(heapSpaces).forEach(([space, info]) => {
      console.log(`${space}:`);
      Object.entries(info).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      console.log("");
    });
  }
}

// Example usage
const v8 = require("v8");
// const memoryExplorer = new V8MemoryExplorer();
// memoryExplorer.exploreMemoryLayout();
// memoryExplorer.demonstrateGenerationalLayout();
```

## Garbage Collection Algorithms

### 1. Scavenge GC (Minor GC) - Young Generation

```javascript
// Simulating young generation behavior
class YoungGenerationDemo {
  constructor() {
    this.youngObjects = [];
    this.promotedObjects = [];
    this.allocationCount = 0;
  }

  demonstrateScavengeGC() {
    console.log("=== SCAVENGE GC DEMONSTRATION ===");

    // Simulate rapid object allocation (typical in young generation)
    const startMemory = process.memoryUsage();

    console.log("Allocating many short-lived objects...");
    for (let i = 0; i < 100000; i++) {
      // Create short-lived objects
      const obj = {
        id: i,
        data: new Array(100).fill(`data-${i}`),
        timestamp: Date.now(),
        temp: Math.random(),
      };

      this.youngObjects.push(obj);
      this.allocationCount++;

      // Simulate objects becoming unreachable (most objects die young)
      if (i % 1000 === 0) {
        // Remove references to most objects (they become garbage)
        this.youngObjects = this.youngObjects.slice(-50);
      }

      // Simulate some objects surviving (promotion to old generation)
      if (i % 10000 === 0 && this.youngObjects.length > 0) {
        const survivor = this.youngObjects.pop();
        this.promotedObjects.push(survivor);
        console.log(
          `Object ${survivor.id} survived and promoted to old generation`
        );
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      console.log("Forcing garbage collection...");
      global.gc();
    }

    const endMemory = process.memoryUsage();

    console.log("\nScavenge GC Results:");
    console.log(`Objects allocated: ${this.allocationCount}`);
    console.log(`Objects promoted: ${this.promotedObjects.length}`);
    console.log(
      `Heap before: ${Math.round(startMemory.heapUsed / 1024 / 1024)}MB`
    );
    console.log(
      `Heap after: ${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`
    );
    console.log(
      `Memory reclaimed: ${Math.round(
        (startMemory.heapUsed - endMemory.heapUsed) / 1024 / 1024
      )}MB`
    );
  }

  demonstrateCopyingCollector() {
    console.log("\n=== COPYING COLLECTOR ALGORITHM ===");

    // Young generation uses a copying collector
    const explanation = {
      "Semi-Space Design":
        "Young generation divided into two semi-spaces (From, To)",
      Allocation: "New objects allocated in From space",
      "Collection Trigger": "When From space is full",
      "Copying Process": "Live objects copied from From to To space",
      "Space Swap": "From and To spaces swap roles",
      Promotion:
        "Objects surviving multiple collections promoted to old generation",
      Advantages: "Fast allocation, automatic compaction, good cache locality",
      Disadvantages: "Uses 2x memory, copying overhead for long-lived objects",
    };

    Object.entries(explanation).forEach(([step, description]) => {
      console.log(`${step}: ${description}`);
    });

    this.simulateCopyingGC();
  }

  simulateCopyingGC() {
    console.log("\nSimulating Copying GC Process:");

    // Simulate From space with objects
    const fromSpace = [];
    const rootReferences = new Set();

    // Allocate objects
    for (let i = 0; i < 10; i++) {
      const obj = { id: i, refs: [], data: `object-${i}` };
      fromSpace.push(obj);

      // Some objects are referenced by roots
      if (i % 3 === 0) {
        rootReferences.add(obj);
      }

      // Create internal references
      if (i > 0) {
        obj.refs.push(fromSpace[Math.floor(Math.random() * i)]);
      }
    }

    console.log(`From space objects: ${fromSpace.length}`);
    console.log(`Root references: ${rootReferences.size}`);

    // Simulate copying collection
    const toSpace = [];
    const visited = new Set();

    // Copy all reachable objects from roots
    const copyObject = (obj) => {
      if (visited.has(obj)) return;
      visited.add(obj);

      const copy = { ...obj, refs: [] };
      toSpace.push(copy);

      // Copy referenced objects
      obj.refs.forEach((ref) => copyObject(ref));
    };

    rootReferences.forEach((obj) => copyObject(obj));

    console.log(`Objects copied to To space: ${toSpace.length}`);
    console.log(
      `Objects garbage collected: ${fromSpace.length - toSpace.length}`
    );
    console.log(
      `Collection efficiency: ${(
        ((fromSpace.length - toSpace.length) / fromSpace.length) *
        100
      ).toFixed(1)}%`
    );
  }
}

// Example usage (uncomment to run)
// const youngGenDemo = new YoungGenerationDemo();
// youngGenDemo.demonstrateScavengeGC();
// setTimeout(() => youngGenDemo.demonstrateCopyingCollector(), 2000);
```

### 2. Mark-Sweep-Compact (Major GC) - Old Generation

```javascript
// Demonstrating old generation garbage collection
class OldGenerationDemo {
  constructor() {
    this.oldObjects = [];
    this.largeObjects = [];
  }

  demonstrateMarkSweepCompact() {
    console.log("=== MARK-SWEEP-COMPACT DEMONSTRATION ===");

    const startMemory = process.memoryUsage();

    // Create long-lived objects (typical in old generation)
    console.log("Creating long-lived objects...");
    for (let i = 0; i < 10000; i++) {
      const obj = {
        id: i,
        data: new Array(1000).fill(`persistent-data-${i}`),
        timestamp: Date.now(),
        references: [],
      };

      // Create circular references and complex object graphs
      if (i > 0) {
        const refIndex = Math.floor(Math.random() * Math.min(i, 100));
        obj.references.push(this.oldObjects[refIndex]);
        if (this.oldObjects[refIndex]) {
          this.oldObjects[refIndex].references.push(obj);
        }
      }

      this.oldObjects.push(obj);
    }

    // Create some large objects (go to large object space)
    console.log("Creating large objects...");
    for (let i = 0; i < 10; i++) {
      const largeObj = {
        id: `large-${i}`,
        data: new Array(100000).fill(`large-data-${i}`), // ~400KB per object
      };
      this.largeObjects.push(largeObj);
    }

    console.log("Creating garbage (unreferenced objects)...");
    // Create objects that will become garbage
    for (let i = 0; i < 5000; i++) {
      const garbageObj = {
        id: `garbage-${i}`,
        data: new Array(500).fill(`garbage-data-${i}`),
      };
      // Don't store references to these objects - they become garbage
    }

    const beforeGC = process.memoryUsage();

    // Force major GC if available
    if (global.gc) {
      console.log("Forcing major garbage collection...");
      global.gc();
      global.gc(); // Run twice to ensure major GC
    }

    const afterGC = process.memoryUsage();

    console.log("\nMark-Sweep-Compact Results:");
    console.log(`Long-lived objects: ${this.oldObjects.length}`);
    console.log(`Large objects: ${this.largeObjects.length}`);
    console.log(
      `Heap before GC: ${Math.round(beforeGC.heapUsed / 1024 / 1024)}MB`
    );
    console.log(
      `Heap after GC: ${Math.round(afterGC.heapUsed / 1024 / 1024)}MB`
    );
    console.log(
      `Memory reclaimed: ${Math.round(
        (beforeGC.heapUsed - afterGC.heapUsed) / 1024 / 1024
      )}MB`
    );
  }

  demonstrateMarkSweepAlgorithm() {
    console.log("\n=== MARK-SWEEP ALGORITHM ===");

    const algorithm = {
      "Phase 1 - Mark": {
        description: "Traverse object graph from roots, mark reachable objects",
        process: "Depth-first search through all references",
        complexity: "O(reachable objects)",
        result: "All live objects marked",
      },
      "Phase 2 - Sweep": {
        description: "Scan heap, deallocate unmarked objects",
        process: "Linear scan through memory pages",
        complexity: "O(heap size)",
        result: "Dead objects freed, memory holes created",
      },
      "Phase 3 - Compact": {
        description: "Move live objects to eliminate fragmentation",
        process: "Copy objects to compact memory layout",
        complexity: "O(live objects)",
        result: "Contiguous free memory block",
      },
    };

    Object.entries(algorithm).forEach(([phase, info]) => {
      console.log(`${phase}:`);
      Object.entries(info).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      console.log("");
    });

    this.simulateMarkSweep();
  }

  simulateMarkSweep() {
    console.log("Simulating Mark-Sweep Algorithm:");

    // Create a simple object graph
    const objects = [];
    const roots = new Set();

    // Create objects
    for (let i = 0; i < 20; i++) {
      const obj = {
        id: i,
        marked: false,
        refs: [],
        size: Math.floor(Math.random() * 1000) + 100,
      };
      objects.push(obj);

      // Some objects are roots
      if (i % 5 === 0) {
        roots.add(obj);
      }
    }

    // Create references between objects
    objects.forEach((obj, index) => {
      const numRefs = Math.floor(Math.random() * 3);
      for (let i = 0; i < numRefs; i++) {
        const refIndex = Math.floor(Math.random() * objects.length);
        if (refIndex !== index) {
          obj.refs.push(objects[refIndex]);
        }
      }
    });

    console.log(`Created ${objects.length} objects with ${roots.size} roots`);

    // MARK PHASE
    console.log("\nMark Phase:");
    const mark = (obj) => {
      if (obj.marked) return;
      obj.marked = true;
      console.log(`  Marked object ${obj.id}`);
      obj.refs.forEach((ref) => mark(ref));
    };

    roots.forEach((root) => mark(root));

    const markedCount = objects.filter((obj) => obj.marked).length;
    console.log(`Marked ${markedCount} reachable objects`);

    // SWEEP PHASE
    console.log("\nSweep Phase:");
    let totalSizeBefore = objects.reduce((sum, obj) => sum + obj.size, 0);
    const survivors = objects.filter((obj) => {
      if (!obj.marked) {
        console.log(`  Swept object ${obj.id} (${obj.size} bytes)`);
        return false;
      }
      return true;
    });

    let totalSizeAfter = survivors.reduce((sum, obj) => sum + obj.size, 0);
    const freedMemory = totalSizeBefore - totalSizeAfter;

    console.log(`Swept ${objects.length - survivors.length} objects`);
    console.log(`Freed ${freedMemory} bytes`);
    console.log(`Memory usage: ${totalSizeBefore} -> ${totalSizeAfter} bytes`);
    console.log(
      `GC efficiency: ${((freedMemory / totalSizeBefore) * 100).toFixed(1)}%`
    );
  }
}

// Example usage (uncomment to run)
// const oldGenDemo = new OldGenerationDemo();
// oldGenDemo.demonstrateMarkSweepCompact();
// setTimeout(() => oldGenDemo.demonstrateMarkSweepAlgorithm(), 3000);
```

## GC Triggering and Performance

```javascript
// Monitoring and controlling garbage collection
class GCPerformanceMonitor {
  constructor() {
    this.gcEvents = [];
    this.memorySnapshots = [];
    this.isMonitoring = false;
  }

  startMonitoring() {
    console.log("=== GC PERFORMANCE MONITORING ===");
    this.isMonitoring = true;

    // Monitor GC events if performance hooks are available
    try {
      const { PerformanceObserver, performance } = require("perf_hooks");

      const gcObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const gcEvent = {
            type: this.getGCType(entry.detail.kind),
            duration: entry.duration,
            timestamp: entry.startTime,
            flags: entry.detail.flags,
          };

          this.gcEvents.push(gcEvent);
          console.log(
            `GC Event: ${gcEvent.type} took ${gcEvent.duration.toFixed(2)}ms`
          );
        });
      });

      gcObserver.observe({ entryTypes: ["gc"] });
    } catch (error) {
      console.log("Performance hooks not available, using memory monitoring");
    }

    // Monitor memory usage
    this.memoryMonitorInterval = setInterval(() => {
      this.takeMemorySnapshot();
    }, 1000);

    return this;
  }

  getGCType(kind) {
    const gcTypes = {
      1: "Scavenge (Minor GC)",
      2: "Mark-Sweep-Compact (Major GC)",
      4: "Incremental Marking",
      8: "Processing Weak Callbacks",
      15: "All GC Types",
    };
    return gcTypes[kind] || `Unknown (${kind})`;
  }

  takeMemorySnapshot() {
    const memory = process.memoryUsage();
    const snapshot = {
      timestamp: Date.now(),
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
    };

    this.memorySnapshots.push(snapshot);

    // Detect potential memory pressure
    if (memory.heapUsed / memory.heapTotal > 0.85) {
      console.warn(
        `⚠️  High memory pressure: ${(
          (memory.heapUsed / memory.heapTotal) *
          100
        ).toFixed(1)}%`
      );
    }
  }

  triggerGCEvents() {
    console.log("\nTriggering various GC scenarios...");

    // Scenario 1: Young generation pressure
    console.log("1. Creating young generation pressure...");
    this.createYoungGenerationPressure();

    setTimeout(() => {
      // Scenario 2: Old generation pressure
      console.log("2. Creating old generation pressure...");
      this.createOldGenerationPressure();
    }, 2000);

    setTimeout(() => {
      // Scenario 3: Large object allocation
      console.log("3. Allocating large objects...");
      this.allocateLargeObjects();
    }, 4000);

    setTimeout(() => {
      // Scenario 4: Memory fragmentation
      console.log("4. Creating memory fragmentation...");
      this.createFragmentation();
    }, 6000);

    // Generate report after scenarios
    setTimeout(() => {
      this.generateReport();
    }, 8000);
  }

  createYoungGenerationPressure() {
    // Rapidly allocate and discard objects
    for (let i = 0; i < 100000; i++) {
      const obj = {
        id: i,
        data: new Array(50).fill(`temp-${i}`),
        timestamp: Date.now(),
      };

      // Objects go out of scope immediately (become garbage)
      if (i % 10000 === 0) {
        console.log(`  Allocated ${i} temporary objects`);
      }
    }
  }

  createOldGenerationPressure() {
    // Create long-lived objects that will be promoted
    this.longLivedObjects = this.longLivedObjects || [];

    for (let i = 0; i < 5000; i++) {
      const obj = {
        id: this.longLivedObjects.length + i,
        data: new Array(200).fill(`persistent-${i}`),
        created: Date.now(),
        refs: [],
      };

      // Create references to existing objects
      if (this.longLivedObjects.length > 0) {
        const refIndex = Math.floor(
          Math.random() * this.longLivedObjects.length
        );
        obj.refs.push(this.longLivedObjects[refIndex]);
      }

      this.longLivedObjects.push(obj);
    }

    console.log(`  Total long-lived objects: ${this.longLivedObjects.length}`);
  }

  allocateLargeObjects() {
    // Allocate objects that go to large object space
    this.largeObjects = this.largeObjects || [];

    for (let i = 0; i < 5; i++) {
      const largeObj = {
        id: `large-${this.largeObjects.length + i}`,
        buffer: Buffer.alloc(1024 * 1024), // 1MB buffer
        data: new Array(50000).fill(`large-data-${i}`),
      };

      this.largeObjects.push(largeObj);
      console.log(
        `  Allocated large object ${largeObj.id} (${largeObj.buffer.length} bytes)`
      );
    }
  }

  createFragmentation() {
    // Create and delete objects of various sizes to cause fragmentation
    const objects = [];

    // Allocate objects of different sizes
    for (let i = 0; i < 1000; i++) {
      const size = Math.floor(Math.random() * 1000) + 100;
      const obj = {
        id: i,
        data: new Array(size).fill(`frag-${i}`),
      };
      objects.push(obj);
    }

    // Delete every other object to create holes
    for (let i = 0; i < objects.length; i += 2) {
      delete objects[i];
    }

    console.log(
      `  Created fragmentation pattern with ${
        objects.filter(Boolean).length
      } surviving objects`
    );
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
  }

  generateReport() {
    console.log("\n=== GC PERFORMANCE REPORT ===");

    if (this.gcEvents.length > 0) {
      const minorGCs = this.gcEvents.filter((event) =>
        event.type.includes("Minor")
      );
      const majorGCs = this.gcEvents.filter((event) =>
        event.type.includes("Major")
      );

      console.log("GC Events Summary:");
      console.log(`  Total GC Events: ${this.gcEvents.length}`);
      console.log(`  Minor GCs: ${minorGCs.length}`);
      console.log(`  Major GCs: ${majorGCs.length}`);

      if (minorGCs.length > 0) {
        const avgMinorDuration =
          minorGCs.reduce((sum, gc) => sum + gc.duration, 0) / minorGCs.length;
        console.log(
          `  Average Minor GC Duration: ${avgMinorDuration.toFixed(2)}ms`
        );
      }

      if (majorGCs.length > 0) {
        const avgMajorDuration =
          majorGCs.reduce((sum, gc) => sum + gc.duration, 0) / majorGCs.length;
        console.log(
          `  Average Major GC Duration: ${avgMajorDuration.toFixed(2)}ms`
        );
      }
    }

    if (this.memorySnapshots.length > 0) {
      const first = this.memorySnapshots[0];
      const last = this.memorySnapshots[this.memorySnapshots.length - 1];

      console.log("\nMemory Usage Changes:");
      console.log(
        `  Initial Heap Used: ${Math.round(first.heapUsed / 1024 / 1024)}MB`
      );
      console.log(
        `  Final Heap Used: ${Math.round(last.heapUsed / 1024 / 1024)}MB`
      );
      console.log(
        `  Heap Growth: ${Math.round(
          (last.heapUsed - first.heapUsed) / 1024 / 1024
        )}MB`
      );
      console.log(
        `  Peak Memory: ${Math.round(
          Math.max(...this.memorySnapshots.map((s) => s.heapUsed)) / 1024 / 1024
        )}MB`
      );
    }

    this.stopMonitoring();
  }

  // Manual GC control (requires --expose-gc flag)
  forceGC(type = "all") {
    if (global.gc) {
      console.log(`Forcing ${type} garbage collection...`);
      const before = process.memoryUsage();

      global.gc();

      const after = process.memoryUsage();
      const reclaimed = before.heapUsed - after.heapUsed;

      console.log(`Manual GC reclaimed ${Math.round(reclaimed / 1024)}KB`);
      return reclaimed;
    } else {
      console.log("Manual GC not available (run with --expose-gc)");
      return 0;
    }
  }
}

// Example usage (uncomment to run)
// const gcMonitor = new GCPerformanceMonitor();
// gcMonitor.startMonitoring();
// gcMonitor.triggerGCEvents();
```

## Memory Leak Detection and Prevention

```javascript
// Tools and techniques for memory leak detection
class MemoryLeakDetector {
  constructor() {
    this.leakDetectors = [];
    this.baselineMemory = null;
    this.heapDiffs = [];
  }

  demonstrateCommonLeaks() {
    console.log("=== COMMON MEMORY LEAK PATTERNS ===");

    this.baselineMemory = process.memoryUsage();

    // 1. Event listener leaks
    this.demonstrateEventListenerLeak();

    // 2. Timer leaks
    setTimeout(() => this.demonstrateTimerLeak(), 2000);

    // 3. Closure leaks
    setTimeout(() => this.demonstrateClosureLeak(), 4000);

    // 4. Global variable leaks
    setTimeout(() => this.demonstrateGlobalLeak(), 6000);

    // 5. Circular reference leaks
    setTimeout(() => this.demonstrateCircularReferenceLeak(), 8000);

    // Generate leak report
    setTimeout(() => this.generateLeakReport(), 10000);
  }

  demonstrateEventListenerLeak() {
    console.log("\n1. Event Listener Leak:");

    const EventEmitter = require("events");
    const emitter = new EventEmitter();

    // BAD: Adding listeners without removing them
    for (let i = 0; i < 1000; i++) {
      emitter.on("data", (data) => {
        // Process data but listener never removed
        console.log(`Processing: ${data}`);
      });
    }

    console.log(`Event listeners added: ${emitter.listenerCount("data")}`);
    console.log("⚠️  These listeners will never be removed - memory leak!");

    // GOOD: Proper cleanup
    const cleanupEmitter = new EventEmitter();
    const handlers = [];

    for (let i = 0; i < 100; i++) {
      const handler = (data) => {
        // Process data
      };
      cleanupEmitter.on("data", handler);
      handlers.push(handler);
    }

    // Clean up listeners
    handlers.forEach((handler) => {
      cleanupEmitter.removeListener("data", handler);
    });

    console.log(
      `✅ Cleanup emitter listeners: ${cleanupEmitter.listenerCount("data")}`
    );
  }

  demonstrateTimerLeak() {
    console.log("\n2. Timer Leak:");

    // BAD: Timers that are never cleared
    const leakyTimers = [];
    for (let i = 0; i < 100; i++) {
      const timer = setInterval(() => {
        // Do some work but timer never cleared
        Math.random() * 1000;
      }, 100);

      leakyTimers.push(timer);
    }

    console.log(`Created ${leakyTimers.length} leaky timers`);
    console.log("⚠️  These timers will run forever - memory and CPU leak!");

    // GOOD: Proper timer cleanup
    const managedTimers = [];
    for (let i = 0; i < 50; i++) {
      const timer = setInterval(() => {
        // Do work
      }, 100);
      managedTimers.push(timer);
    }

    // Clean up after some time
    setTimeout(() => {
      managedTimers.forEach((timer) => clearInterval(timer));
      console.log("✅ Cleaned up managed timers");
    }, 5000);
  }

  demonstrateClosureLeak() {
    console.log("\n3. Closure Leak:");

    // BAD: Closures holding onto large data
    const createLeakyClosure = () => {
      const largeData = new Array(10000).fill("large data");
      const smallData = "small";

      return () => {
        // Only uses smallData but closure holds reference to largeData
        return smallData;
      };
    };

    const leakyClosures = [];
    for (let i = 0; i < 100; i++) {
      leakyClosures.push(createLeakyClosure());
    }

    console.log(`Created ${leakyClosures.length} leaky closures`);
    console.log("⚠️  Each closure holds reference to large unused data!");

    // GOOD: Optimized closures
    const createOptimizedClosure = () => {
      const largeData = new Array(10000).fill("large data");
      const smallData = "small";

      // Process large data immediately and don't capture it
      const processedResult = largeData.length; // Use it

      return () => {
        return `${smallData} (processed: ${processedResult})`;
      };
    };

    const optimizedClosures = [];
    for (let i = 0; i < 100; i++) {
      optimizedClosures.push(createOptimizedClosure());
    }

    console.log(`✅ Created ${optimizedClosures.length} optimized closures`);
  }

  demonstrateGlobalLeak() {
    console.log("\n4. Global Variable Leak:");

    // BAD: Unintentional globals
    const createGlobalLeak = () => {
      for (let i = 0; i < 1000; i++) {
        // Missing 'var', 'let', or 'const' creates global
        eval(`leakyGlobal${i} = new Array(1000).fill('global data')`);
      }
    };

    createGlobalLeak();
    console.log("⚠️  Created 1000 global variables - memory leak!");

    // GOOD: Proper scoping
    const createProperScope = () => {
      const scopedData = {};
      for (let i = 0; i < 1000; i++) {
        scopedData[`item${i}`] = new Array(1000).fill("scoped data");
      }
      return scopedData; // Return if needed, otherwise will be garbage collected
    };

    const properData = createProperScope();
    console.log("✅ Created properly scoped data structure");
  }

  demonstrateCircularReferenceLeak() {
    console.log("\n5. Circular Reference Leak:");

    // Modern V8 handles most circular references, but can still be problematic
    // with native objects or external resources

    const createCircularReference = () => {
      const parent = {
        id: "parent",
        data: new Array(1000).fill("parent data"),
        children: [],
      };

      for (let i = 0; i < 100; i++) {
        const child = {
          id: `child-${i}`,
          data: new Array(1000).fill(`child data ${i}`),
          parent: parent, // Circular reference
        };
        parent.children.push(child);
      }

      return parent;
    };

    const circularObjects = [];
    for (let i = 0; i < 50; i++) {
      circularObjects.push(createCircularReference());
    }

    console.log(
      `Created ${circularObjects.length} objects with circular references`
    );
    console.log("ℹ️  Modern V8 can handle these, but they use more memory");

    // GOOD: Break circular references when done
    const cleanupCircularReferences = (objects) => {
      objects.forEach((parent) => {
        parent.children.forEach((child) => {
          child.parent = null; // Break the circle
        });
        parent.children = [];
      });
    };

    // Cleanup after demonstration
    setTimeout(() => {
      cleanupCircularReferences(circularObjects);
      console.log("✅ Cleaned up circular references");
    }, 2000);
  }

  generateLeakReport() {
    console.log("\n=== MEMORY LEAK REPORT ===");

    const currentMemory = process.memoryUsage();
    const heapGrowth = currentMemory.heapUsed - this.baselineMemory.heapUsed;

    console.log("Memory Usage Comparison:");
    console.log(
      `  Baseline Heap: ${Math.round(
        this.baselineMemory.heapUsed / 1024 / 1024
      )}MB`
    );
    console.log(
      `  Current Heap: ${Math.round(currentMemory.heapUsed / 1024 / 1024)}MB`
    );
    console.log(`  Heap Growth: ${Math.round(heapGrowth / 1024 / 1024)}MB`);
    console.log(
      `  RSS Growth: ${Math.round(
        (currentMemory.rss - this.baselineMemory.rss) / 1024 / 1024
      )}MB`
    );

    if (heapGrowth > 50 * 1024 * 1024) {
      // More than 50MB growth
      console.log("⚠️  Significant memory growth detected - possible leaks!");
    } else {
      console.log("✅ Memory growth within expected range");
    }

    this.provideMitigationStrategies();
  }

  provideMitigationStrategies() {
    console.log("\n=== MEMORY LEAK MITIGATION STRATEGIES ===");

    const strategies = {
      "Event Listeners": [
        "Always remove listeners with removeListener() or off()",
        "Use once() for single-use listeners",
        'Implement cleanup in finally blocks or process.on("exit")',
        "Consider using weak references for listeners",
      ],
      Timers: [
        "Clear all timers with clearTimeout() and clearInterval()",
        "Track active timers in a Set for bulk cleanup",
        "Use AbortController for cancellable operations",
        "Implement timeout cleanup in error handlers",
      ],
      Closures: [
        "Avoid capturing large objects unnecessarily",
        "Nullify large variables after use",
        "Use WeakMap for object associations",
        "Be careful with function factories",
      ],
      "Global Variables": [
        "Always use let/const/var declarations",
        "Use strict mode to catch accidental globals",
        "Namespace global data properly",
        "Clean up globals in application shutdown",
      ],
      Monitoring: [
        "Use heap snapshots to track object growth",
        "Monitor process.memoryUsage() regularly",
        "Set up memory alerts in production",
        "Use tools like clinic.js or 0x for profiling",
      ],
    };

    Object.entries(strategies).forEach(([category, tips]) => {
      console.log(`${category}:`);
      tips.forEach((tip) => console.log(`  • ${tip}`));
      console.log("");
    });
  }

  // Heap snapshot utilities
  takeHeapSnapshot() {
    try {
      const v8 = require("v8");
      const fs = require("fs");

      const filename = `heap-snapshot-${Date.now()}.heapsnapshot`;
      const snapshot = v8.writeHeapSnapshot(filename);

      console.log(`Heap snapshot saved to: ${snapshot}`);
      return snapshot;
    } catch (error) {
      console.error("Failed to take heap snapshot:", error.message);
      return null;
    }
  }
}

// Example usage (uncomment to run)
// const leakDetector = new MemoryLeakDetector();
// leakDetector.demonstrateCommonLeaks();
```

## GC Tuning and Best Practices

```javascript
// V8 garbage collection tuning and optimization
class GCOptimizer {
  constructor() {
    this.optimizations = {};
  }

  demonstrateGCTuning() {
    console.log("=== V8 GC TUNING STRATEGIES ===");

    this.showGCFlags();
    this.demonstrateObjectPooling();
    this.demonstrateWriteBarriers();
    this.showBestPractices();
  }

  showGCFlags() {
    console.log("\n1. V8 GC Command Line Flags:");

    const gcFlags = {
      "--max-old-space-size=<MB>":
        "Set maximum old generation size (default ~1.4GB on 64-bit)",
      "--max-new-space-size=<MB>":
        "Set maximum new generation size (default ~16MB)",
      "--initial-heap-size=<MB>": "Set initial heap size",
      "--gc-interval=<ms>": "Force GC at regular intervals",
      "--expose-gc": "Expose global.gc() function for manual GC",
      "--trace-gc": "Print GC events to stdout",
      "--trace-gc-verbose": "Print detailed GC information",
      "--optimize-for-size": "Optimize for memory usage over speed",
      "--max-heap-size=<MB>": "Set absolute maximum heap size",
      "--gc-global": "Always perform global GC",
      "--incremental-marking": "Enable incremental marking (default: on)",
      "--concurrent-marking": "Enable concurrent marking (default: on)",
    };

    console.log("Common GC tuning flags:");
    Object.entries(gcFlags).forEach(([flag, description]) => {
      console.log(`  ${flag}: ${description}`);
    });

    console.log("\nExample usage:");
    console.log("  node --max-old-space-size=4096 --trace-gc app.js");
    console.log("  node --expose-gc --gc-interval=1000 app.js");
  }

  demonstrateObjectPooling() {
    console.log("\n2. Object Pooling for GC Optimization:");

    // Object pool to reduce GC pressure
    class ObjectPool {
      constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.acquired = new Set();

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
          this.pool.push(this.createFn());
        }
      }

      acquire() {
        let obj = this.pool.pop();
        if (!obj) {
          obj = this.createFn();
        }
        this.acquired.add(obj);
        return obj;
      }

      release(obj) {
        if (this.acquired.has(obj)) {
          this.resetFn(obj);
          this.acquired.delete(obj);
          this.pool.push(obj);
        }
      }

      getStats() {
        return {
          poolSize: this.pool.length,
          acquired: this.acquired.size,
          total: this.pool.length + this.acquired.size,
        };
      }
    }

    // Example: Buffer pool
    const bufferPool = new ObjectPool(
      () => Buffer.alloc(1024), // Create 1KB buffer
      (buffer) => buffer.fill(0), // Reset buffer
      20 // Initial pool size
    );

    console.log("Buffer Pool Demonstration:");

    // Simulate heavy buffer usage
    const buffers = [];
    const startMemory = process.memoryUsage();

    for (let i = 0; i < 1000; i++) {
      const buffer = bufferPool.acquire();
      buffer.writeInt32LE(i, 0); // Use buffer
      buffers.push(buffer);

      if (i % 100 === 0) {
        console.log(
          `  Pool stats at ${i}: ${JSON.stringify(bufferPool.getStats())}`
        );
      }
    }

    // Release buffers back to pool
    buffers.forEach((buffer) => bufferPool.release(buffer));

    const endMemory = process.memoryUsage();
    console.log(
      `Memory usage: ${Math.round(
        startMemory.heapUsed / 1024
      )}KB -> ${Math.round(endMemory.heapUsed / 1024)}KB`
    );
    console.log(`Final pool stats: ${JSON.stringify(bufferPool.getStats())}`);

    // Object pool for complex objects
    const requestPool = new ObjectPool(
      () => ({ id: null, data: {}, timestamp: null, processed: false }),
      (req) => {
        req.id = null;
        req.data = {};
        req.timestamp = null;
        req.processed = false;
      }
    );

    console.log("\nRequest Object Pool:");

    // Simulate request processing
    for (let i = 0; i < 100; i++) {
      const request = requestPool.acquire();
      request.id = i;
      request.data = { payload: `data-${i}` };
      request.timestamp = Date.now();

      // Process request
      setTimeout(() => {
        request.processed = true;
        requestPool.release(request);
      }, 10);
    }

    setTimeout(() => {
      console.log(
        `Request pool final stats: ${JSON.stringify(requestPool.getStats())}`
      );
    }, 100);
  }

  demonstrateWriteBarriers() {
    console.log("\n3. Understanding Write Barriers:");

    const explanation = {
      "Write Barrier Purpose":
        "Track cross-generational references for incremental GC",
      "When Triggered":
        "When old generation object references new generation object",
      "Performance Impact":
        "Small overhead on writes, enables faster incremental GC",
      Optimization: "Minimize old->new references in hot paths",
    };

    Object.entries(explanation).forEach(([concept, description]) => {
      console.log(`${concept}: ${description}`);
    });

    // Demonstrate write barrier implications
    const oldGenerationObj = {
      id: "old-object",
      data: new Array(10000).fill("old data"),
      references: [],
    };

    console.log("\nWrite Barrier Example:");

    // This creates cross-generational references
    for (let i = 0; i < 100; i++) {
      const newObj = {
        id: `new-${i}`,
        data: `fresh data ${i}`,
      };

      // This assignment triggers write barrier
      oldGenerationObj.references.push(newObj);

      if (i % 20 === 0) {
        console.log(`  Created ${i + 1} cross-generational references`);
      }
    }

    console.log("✅ Write barriers tracked all cross-generational references");
    console.log(
      "ℹ️  This enables incremental marking without scanning entire old generation"
    );
  }

  showBestPractices() {
    console.log("\n4. GC Optimization Best Practices:");

    const bestPractices = {
      "Object Allocation": [
        "Prefer object literals over constructor functions",
        "Reuse objects instead of creating new ones",
        "Use object pooling for frequently created objects",
        "Avoid creating objects in hot code paths",
        "Pre-allocate arrays with known sizes",
      ],
      "Memory Management": [
        "Nullify references when objects are no longer needed",
        "Use WeakMap/WeakSet for loose associations",
        "Avoid large object graphs in closures",
        "Break circular references explicitly",
        "Clean up event listeners and timers",
      ],
      "Code Patterns": [
        "Prefer iterative over recursive algorithms",
        "Use streaming for large data processing",
        "Implement proper error handling to prevent leaks",
        "Cache frequently computed values",
        "Use worker threads for CPU-intensive tasks",
      ],
      Monitoring: [
        "Monitor heap growth trends over time",
        "Set up memory alerts in production",
        "Use heap snapshots to identify leaks",
        "Profile GC pause times under load",
        "Track object allocation rates",
      ],
      "Production Tuning": [
        "Tune --max-old-space-size based on workload",
        "Enable --trace-gc in staging environments",
        "Consider --optimize-for-size for memory-constrained environments",
        "Use container memory limits as heap size guides",
        "Monitor GC impact on application latency",
      ],
    };

    Object.entries(bestPractices).forEach(([category, practices]) => {
      console.log(`${category}:`);
      practices.forEach((practice) => console.log(`  • ${practice}`));
      console.log("");
    });
  }

  demonstrateOptimizedPatterns() {
    console.log("\n5. Memory-Efficient Code Patterns:");

    // Pattern 1: Efficient string building
    console.log("Efficient String Building:");

    const inefficientStringBuild = (items) => {
      let result = "";
      for (const item of items) {
        result += item + "\n"; // Creates many intermediate strings
      }
      return result;
    };

    const efficientStringBuild = (items) => {
      return items.join("\n") + "\n"; // Single concatenation
    };

    const testData = new Array(10000).fill(0).map((_, i) => `item-${i}`);

    console.time("  Inefficient string build");
    inefficientStringBuild(testData);
    console.timeEnd("  Inefficient string build");

    console.time("  Efficient string build");
    efficientStringBuild(testData);
    console.timeEnd("  Efficient string build");

    // Pattern 2: Efficient array operations
    console.log("\nEfficient Array Operations:");

    const inefficientFilter = (arr) => {
      const result = [];
      const intermediate = [];

      for (const item of arr) {
        intermediate.push(item * 2); // Unnecessary intermediate array
      }

      for (const item of intermediate) {
        if (item > 100) {
          result.push(item);
        }
      }

      return result;
    };

    const efficientFilter = (arr) => {
      return arr.map((item) => item * 2).filter((item) => item > 100);
    };

    const numArray = new Array(100000)
      .fill(0)
      .map(() => Math.floor(Math.random() * 100));

    console.time("  Inefficient filter");
    inefficientFilter(numArray);
    console.timeEnd("  Inefficient filter");

    console.time("  Efficient filter");
    efficientFilter(numArray);
    console.timeEnd("  Efficient filter");

    console.log("✅ Efficient patterns reduce temporary object creation");
  }
}

// Example usage (uncomment to run)
// const gcOptimizer = new GCOptimizer();
// gcOptimizer.demonstrateGCTuning();
// setTimeout(() => gcOptimizer.demonstrateOptimizedPatterns(), 2000);
```

## Summary

### Key Concepts of V8 Garbage Collection:

1. **Generational Design**: Young and old generations with different collection strategies
2. **Scavenge GC**: Fast copying collector for young generation (minor GC)
3. **Mark-Sweep-Compact**: Thorough collector for old generation (major GC)
4. **Incremental Marking**: Spreads marking work across multiple cycles
5. **Write Barriers**: Track cross-generational references efficiently

### Performance Implications:

- **Young Generation**: Frequent, fast collections (1-10ms)
- **Old Generation**: Infrequent, slower collections (10-100ms+)
- **Large Objects**: Go directly to large object space, collected with old generation
- **Memory Pressure**: Triggers more aggressive collection strategies

### Optimization Strategies:

- **Object Pooling**: Reuse objects to reduce allocation pressure
- **Proper Cleanup**: Remove event listeners, clear timers, nullify references
- **Efficient Patterns**: Use appropriate data structures and algorithms
- **Monitoring**: Track memory usage and GC performance
- **Tuning**: Adjust heap sizes and GC behavior for workload

Understanding V8's garbage collection is essential for writing high-performance Node.js applications, especially those handling large amounts of data or high-frequency operations. Proper memory management can significantly improve application performance and prevent memory-related issues in production.
