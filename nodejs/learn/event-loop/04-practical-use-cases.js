/**
 * Real-World Practical Use Cases
 * 
 * Production-ready patterns and optimizations
 * using Node.js event loop understanding
 */

console.log('='.repeat(60));
console.log('Event Loop - Real-World Practical Use Cases');
console.log('='.repeat(60) + '\n');

// ============================================
// Use Case 1: Batch API Requests
// ============================================
class BatchRequestProcessor {
  constructor(batchSize = 10, batchDelay = 100) {
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
    this.queue = [];
    this.processing = false;
  }
  
  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.scheduleBatch();
    });
  }
  
  scheduleBatch() {
    if (this.processing) return;
    
    if (this.queue.length >= this.batchSize) {
      // Process immediately if batch is full
      setImmediate(() => this.processBatch());
    } else if (this.queue.length > 0) {
      // Wait for more requests or timeout
      this.processing = true;
      setTimeout(() => this.processBatch(), this.batchDelay);
    }
  }
  
  async processBatch() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    const batch = this.queue.splice(0, this.batchSize);
    
    console.log(`Processing batch of ${batch.length} requests...`);
    
    try {
      // Simulate batch API call
      const results = await this.mockBatchAPI(batch.map(b => b.request));
      
      // Resolve all promises
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
    
    this.processing = false;
    
    // Process next batch if queue is not empty
    if (this.queue.length > 0) {
      setImmediate(() => this.processBatch());
    }
  }
  
  async mockBatchAPI(requests) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return requests.map(r => ({ ...r, processed: true }));
  }
}

async function useCase1_BatchRequests() {
  console.log('--- Use Case 1: Batch API Requests ---\n');
  
  const processor = new BatchRequestProcessor(5, 100);
  
  // Simulate multiple individual requests
  const requests = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    data: `request-${i + 1}`
  }));
  
  console.log('Submitting 12 individual requests...');
  console.log('They will be automatically batched!\n');
  
  const promises = requests.map(req => processor.add(req));
  const results = await Promise.all(promises);
  
  console.log(`\n✓ All ${results.length} requests completed`);
  console.log('Benefits: Reduced API calls, better performance\n');
}

// ============================================
// Use Case 2: Rate Limiting with Token Bucket
// ============================================
class RateLimiter {
  constructor(maxTokens = 10, refillRate = 1, refillInterval = 1000) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;
    this.queue = [];
    
    // Refill tokens periodically
    this.startRefilling();
  }
  
  startRefilling() {
    setInterval(() => {
      this.tokens = Math.min(this.maxTokens, this.tokens + this.refillRate);
      this.processQueue();
    }, this.refillInterval);
  }
  
  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }
  
  processQueue() {
    while (this.tokens > 0 && this.queue.length > 0) {
      this.tokens--;
      const { fn, resolve, reject } = this.queue.shift();
      
      // Execute in next tick to avoid blocking
      process.nextTick(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }
  }
}

async function useCase2_RateLimiting() {
  console.log('--- Use Case 2: Rate Limiting ---\n');
  
  const limiter = new RateLimiter(5, 2, 1000);
  
  console.log('Rate limit: 5 tokens, refill 2/second\n');
  
  // Simulate 10 API calls
  const calls = Array.from({ length: 10 }, (_, i) => i + 1);
  
  console.log('Making 10 API calls...');
  
  const promises = calls.map(i => 
    limiter.execute(async () => {
      console.log(`  API call ${i} executing...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return `Result ${i}`;
    })
  );
  
  const results = await Promise.all(promises);
  console.log(`\n✓ All ${results.length} calls completed (rate limited)\n`);
}

// ============================================
// Use Case 3: Debouncing with Event Loop
// ============================================
function debounce(fn, delay) {
  let timeoutId;
  
  return function (...args) {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

function useCase3_Debouncing() {
  console.log('--- Use Case 3: Debouncing ---\n');
  
  let callCount = 0;
  
  // Expensive operation (e.g., API call, database query)
  const expensiveOperation = debounce((value) => {
    callCount++;
    console.log(`Expensive operation executed (call #${callCount}): ${value}`);
  }, 300);
  
  console.log('Simulating rapid user input...');
  
  // Simulate rapid events (e.g., typing)
  expensiveOperation('H');
  expensiveOperation('He');
  expensiveOperation('Hel');
  expensiveOperation('Hell');
  expensiveOperation('Hello');
  
  setTimeout(() => {
    console.log(`\n✓ Debounced: Only 1 call instead of 5`);
    console.log('Use case: Search as you type, form validation, resize events\n');
  }, 500);
}

// ============================================
// Use Case 4: Throttling for Performance
// ============================================
function throttle(fn, interval) {
  let lastCall = 0;
  
  return function (...args) {
    const now = Date.now();
    
    if (now - lastCall >= interval) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

function useCase4_Throttling() {
  console.log('--- Use Case 4: Throttling ---\n');
  
  let callCount = 0;
  
  // Rate-limited operation
  const throttledOperation = throttle((event) => {
    callCount++;
    console.log(`Throttled operation executed (call #${callCount}): ${event}`);
  }, 200);
  
  console.log('Simulating continuous events (every 50ms)...');
  
  // Simulate rapid events (e.g., scroll, mousemove)
  const interval = setInterval(() => {
    throttledOperation('event');
  }, 50);
  
  setTimeout(() => {
    clearInterval(interval);
    console.log(`\n✓ Throttled: ~5 calls instead of 20`);
    console.log('Use case: Scroll events, mouse tracking, progress updates\n');
  }, 1000);
}

// ============================================
// Use Case 5: Event Loop-Aware Cache
// ============================================
class EventLoopCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, value) {
    const expiresAt = Date.now() + this.ttl;
    this.cache.set(key, { value, expiresAt });
    
    // Schedule cleanup using event loop
    setTimeout(() => {
      const item = this.cache.get(key);
      if (item && Date.now() >= item.expiresAt) {
        this.cache.delete(key);
      }
    }, this.ttl);
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() >= item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async getOrFetch(key, fetchFn) {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return { value: cached, fromCache: true };
    }
    
    // Fetch and cache
    const value = await fetchFn();
    this.set(key, value);
    
    return { value, fromCache: false };
  }
}

async function useCase5_EventLoopCache() {
  console.log('--- Use Case 5: Event Loop-Aware Cache ---\n');
  
  const cache = new EventLoopCache(2000); // 2 second TTL
  
  const fetchUser = async (id) => {
    console.log(`  Fetching user ${id} from database...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id, name: `User ${id}`, email: `user${id}@example.com` };
  };
  
  console.log('First request (cache miss):');
  const result1 = await cache.getOrFetch('user:1', () => fetchUser(1));
  console.log(`  ✓ From cache: ${result1.fromCache}, Data:`, result1.value);
  
  console.log('\nSecond request (cache hit):');
  const result2 = await cache.getOrFetch('user:1', () => fetchUser(1));
  console.log(`  ✓ From cache: ${result2.fromCache}, Data:`, result2.value);
  
  console.log('\nWaiting for cache expiration...');
  await new Promise(resolve => setTimeout(resolve, 2100));
  
  console.log('Third request (after expiration):');
  const result3 = await cache.getOrFetch('user:1', () => fetchUser(1));
  console.log(`  ✓ From cache: ${result3.fromCache}, Data:`, result3.value);
  console.log();
}

// ============================================
// Use Case 6: Background Job Queue
// ============================================
class BackgroundJobQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.queue = [];
    this.active = 0;
  }
  
  enqueue(job) {
    return new Promise((resolve, reject) => {
      this.queue.push({ job, resolve, reject });
      this.process();
    });
  }
  
  process() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const { job, resolve, reject } = this.queue.shift();
      this.active++;
      
      // Process job in next tick
      setImmediate(async () => {
        try {
          const result = await job();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.active--;
          this.process(); // Process next job
        }
      });
    }
  }
}

async function useCase6_BackgroundJobs() {
  console.log('--- Use Case 6: Background Job Queue ---\n');
  
  const queue = new BackgroundJobQueue(2);
  
  const jobs = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    duration: Math.random() * 1000 + 500
  }));
  
  console.log(`Enqueuing ${jobs.length} jobs (concurrency: 2)...\n`);
  
  const promises = jobs.map(job => 
    queue.enqueue(async () => {
      console.log(`  Job ${job.id} started`);
      await new Promise(resolve => setTimeout(resolve, job.duration));
      console.log(`  Job ${job.id} completed (${job.duration.toFixed(0)}ms)`);
      return `Result ${job.id}`;
    })
  );
  
  await Promise.all(promises);
  console.log(`\n✓ All jobs completed\n`);
}

// ============================================
// Use Case 7: Progressive Data Loading
// ============================================
async function useCase7_ProgressiveLoading() {
  console.log('--- Use Case 7: Progressive Data Loading ---\n');
  
  const chunks = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    data: `Chunk ${i + 1}`
  }));
  
  console.log('Loading data progressively...\n');
  
  let loaded = 0;
  
  async function loadChunk(chunk) {
    await new Promise(resolve => setTimeout(resolve, 100));
    loaded++;
    
    const progress = (loaded / chunks.length * 100).toFixed(0);
    console.log(`  Loaded chunk ${chunk.id} - Progress: ${progress}%`);
    
    return chunk;
  }
  
  // Load chunks sequentially without blocking
  const results = [];
  for (const chunk of chunks) {
    // Use setImmediate to allow other operations
    await new Promise(resolve => setImmediate(resolve));
    const result = await loadChunk(chunk);
    results.push(result);
  }
  
  console.log(`\n✓ All ${results.length} chunks loaded progressively\n`);
}

// ============================================
// Use Case 8: Real-time Metrics Collection
// ============================================
class MetricsCollector {
  constructor(flushInterval = 5000) {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0
    };
    this.flushInterval = flushInterval;
    this.startFlushing();
  }
  
  startFlushing() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  recordRequest(responseTime) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += responseTime;
  }
  
  recordError() {
    this.metrics.errors++;
  }
  
  flush() {
    if (this.metrics.requests === 0) return;
    
    const avgResponseTime = (this.metrics.totalResponseTime / this.metrics.requests).toFixed(2);
    const errorRate = ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2);
    
    console.log('📊 Metrics flush:');
    console.log(`   Requests: ${this.metrics.requests}`);
    console.log(`   Avg Response Time: ${avgResponseTime}ms`);
    console.log(`   Error Rate: ${errorRate}%\n`);
    
    // Reset metrics
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0
    };
  }
}

async function useCase8_MetricsCollection() {
  console.log('--- Use Case 8: Real-time Metrics Collection ---\n');
  
  const collector = new MetricsCollector(2000);
  
  console.log('Simulating API requests...\n');
  
  // Simulate requests
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const responseTime = Math.random() * 200 + 50;
    collector.recordRequest(responseTime);
    
    if (Math.random() < 0.1) {
      collector.recordError();
    }
  }
  
  // Wait for final flush
  await new Promise(resolve => setTimeout(resolve, 2500));
  console.log('✓ Metrics collection demonstration complete\n');
}

// ============================================
// Run All Use Cases
// ============================================
async function runAllUseCases() {
  await useCase1_BatchRequests();
  await sleep(500);
  
  await useCase2_RateLimiting();
  await sleep(2000);
  
  useCase3_Debouncing();
  await sleep(1000);
  
  useCase4_Throttling();
  await sleep(1500);
  
  await useCase5_EventLoopCache();
  await sleep(500);
  
  await useCase6_BackgroundJobs();
  await sleep(500);
  
  await useCase7_ProgressiveLoading();
  await sleep(500);
  
  await useCase8_MetricsCollection();
  
  console.log('='.repeat(60));
  console.log('All use cases completed!');
  console.log('='.repeat(60));
  console.log('\nProduction Patterns Demonstrated:');
  console.log('1. Batch processing for efficiency');
  console.log('2. Rate limiting for API protection');
  console.log('3. Debouncing for reducing unnecessary calls');
  console.log('4. Throttling for performance optimization');
  console.log('5. Event loop-aware caching');
  console.log('6. Background job queues');
  console.log('7. Progressive data loading');
  console.log('8. Real-time metrics collection');
}

// Helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export
module.exports = {
  BatchRequestProcessor,
  RateLimiter,
  debounce,
  throttle,
  EventLoopCache,
  BackgroundJobQueue,
  MetricsCollector
};

// Run if executed directly
if (require.main === module) {
  runAllUseCases().catch(console.error);
}
