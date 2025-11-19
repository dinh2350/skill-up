/**
 * Node.js Readable Streams - Real-World Examples
 * 
 * Readable streams are sources of data that you can read from.
 * Data flows FROM the stream TO your application.
 */

const fs = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

// ============================================
// EXAMPLE 1: Basic File Reading with Streams
// ============================================

async function example1_BasicFileReading() {
  console.log('\n=== Example 1: Basic File Reading ===\n');
  
  // Create a readable stream
  const readable = fs.createReadStream(__filename, {
    encoding: 'utf8',
    highWaterMark: 64 // Read 64 bytes at a time
  });
  
  let chunkCount = 0;
  let totalBytes = 0;
  
  readable.on('data', (chunk) => {
    chunkCount++;
    totalBytes += chunk.length;
    console.log(`Chunk ${chunkCount}: ${chunk.length} bytes`);
  });
  
  readable.on('end', () => {
    console.log(`\nTotal: ${chunkCount} chunks, ${totalBytes} bytes`);
  });
  
  readable.on('error', (err) => {
    console.error('Error reading file:', err);
  });
  
  // Wait for stream to finish
  return new Promise((resolve) => readable.on('end', resolve));
}

// ============================================
// EXAMPLE 2: Reading Large Files Efficiently
// ============================================

async function example2_LargeFileReading() {
  console.log('\n=== Example 2: Large File Reading ===\n');
  
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = Date.now();
  
  const readable = fs.createReadStream(__filename, {
    highWaterMark: 16 * 1024 // 16KB chunks
  });
  
  let lineCount = 0;
  let buffer = '';
  
  readable.on('data', (chunk) => {
    buffer += chunk.toString();
    
    // Count lines
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line
    lineCount += lines.length;
  });
  
  readable.on('end', () => {
    if (buffer.length > 0) lineCount++; // Last line
    
    const endMemory = process.memoryUsage().heapUsed;
    const endTime = Date.now();
    
    console.log(`Lines: ${lineCount}`);
    console.log(`Time: ${endTime - startTime}ms`);
    console.log(`Memory: ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)}MB`);
  });
  
  return new Promise((resolve) => readable.on('end', resolve));
}

// ============================================
// EXAMPLE 3: Custom Readable Stream
// ============================================

class NumberStream extends Readable {
  constructor(max, options) {
    super(options);
    this.current = 1;
    this.max = max;
  }
  
  _read() {
    if (this.current <= this.max) {
      // Push data to the stream
      this.push(`${this.current}\n`);
      this.current++;
    } else {
      // Signal end of stream
      this.push(null);
    }
  }
}

async function example3_CustomReadableStream() {
  console.log('\n=== Example 3: Custom Readable Stream ===\n');
  
  const numberStream = new NumberStream(10);
  
  numberStream.on('data', (chunk) => {
    process.stdout.write(`Number: ${chunk}`);
  });
  
  return new Promise((resolve) => numberStream.on('end', resolve));
}

// ============================================
// EXAMPLE 4: API Pagination Stream
// ============================================

class PaginatedAPIStream extends Readable {
  constructor(baseUrl, options) {
    super({ objectMode: true, ...options });
    this.baseUrl = baseUrl;
    this.page = 1;
    this.hasMore = true;
  }
  
  async _read() {
    if (!this.hasMore) {
      this.push(null);
      return;
    }
    
    try {
      // Simulate API call
      const data = await this.fetchPage(this.page);
      
      if (data.items.length === 0) {
        this.hasMore = false;
        this.push(null);
      } else {
        data.items.forEach(item => this.push(item));
        this.page++;
      }
    } catch (err) {
      this.destroy(err);
    }
  }
  
  async fetchPage(page) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate paginated data
    if (page > 3) {
      return { items: [] };
    }
    
    return {
      items: Array.from({ length: 5 }, (_, i) => ({
        id: (page - 1) * 5 + i + 1,
        name: `Item ${(page - 1) * 5 + i + 1}`,
        page
      }))
    };
  }
}

async function example4_PaginatedAPI() {
  console.log('\n=== Example 4: API Pagination Stream ===\n');
  
  const apiStream = new PaginatedAPIStream('https://api.example.com/items');
  
  let count = 0;
  
  apiStream.on('data', (item) => {
    count++;
    console.log(`[${count}] ${item.name} (Page ${item.page})`);
  });
  
  apiStream.on('end', () => {
    console.log(`\nFetched ${count} items total`);
  });
  
  return new Promise((resolve, reject) => {
    apiStream.on('end', resolve);
    apiStream.on('error', reject);
  });
}

// ============================================
// EXAMPLE 5: Database Cursor Stream
// ============================================

class DatabaseCursorStream extends Readable {
  constructor(query, batchSize = 100) {
    super({ objectMode: true });
    this.query = query;
    this.batchSize = batchSize;
    this.offset = 0;
    this.hasMore = true;
  }
  
  async _read() {
    if (!this.hasMore) {
      this.push(null);
      return;
    }
    
    try {
      const rows = await this.fetchBatch();
      
      if (rows.length === 0) {
        this.hasMore = false;
        this.push(null);
      } else {
        rows.forEach(row => this.push(row));
        this.offset += rows.length;
        
        if (rows.length < this.batchSize) {
          this.hasMore = false;
        }
      }
    } catch (err) {
      this.destroy(err);
    }
  }
  
  async fetchBatch() {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate returning rows
    const maxRows = 250;
    const remaining = maxRows - this.offset;
    const count = Math.min(this.batchSize, remaining);
    
    if (count <= 0) return [];
    
    return Array.from({ length: count }, (_, i) => ({
      id: this.offset + i + 1,
      name: `User ${this.offset + i + 1}`,
      email: `user${this.offset + i + 1}@example.com`
    }));
  }
}

async function example5_DatabaseCursor() {
  console.log('\n=== Example 5: Database Cursor Stream ===\n');
  
  const dbStream = new DatabaseCursorStream('SELECT * FROM users', 50);
  
  let count = 0;
  const startTime = Date.now();
  
  dbStream.on('data', (row) => {
    count++;
    if (count % 50 === 0) {
      console.log(`Processed ${count} rows...`);
    }
  });
  
  dbStream.on('end', () => {
    const elapsed = Date.now() - startTime;
    console.log(`\nTotal: ${count} rows in ${elapsed}ms`);
    console.log(`Rate: ${(count / elapsed * 1000).toFixed(0)} rows/sec`);
  });
  
  return new Promise((resolve, reject) => {
    dbStream.on('end', resolve);
    dbStream.on('error', reject);
  });
}

// ============================================
// EXAMPLE 6: Stream with Backpressure Control
// ============================================

class ControlledStream extends Readable {
  constructor(max, delay = 10) {
    super();
    this.current = 0;
    this.max = max;
    this.delay = delay;
  }
  
  _read() {
    const sendData = () => {
      if (this.current >= this.max) {
        this.push(null);
        return;
      }
      
      const data = `Data chunk ${this.current}\n`;
      const canContinue = this.push(data);
      this.current++;
      
      if (canContinue && this.current < this.max) {
        // Consumer is ready, send more data
        setTimeout(sendData, this.delay);
      }
      // If canContinue is false, wait for next _read() call
    };
    
    sendData();
  }
}

async function example6_BackpressureControl() {
  console.log('\n=== Example 6: Backpressure Control ===\n');
  
  const stream = new ControlledStream(20, 50);
  
  stream.on('data', (chunk) => {
    console.log(`Received: ${chunk.toString().trim()}`);
    
    // Simulate slow consumer
    if (Math.random() > 0.7) {
      console.log('  [Consumer is slow, backpressure applied]');
    }
  });
  
  return new Promise((resolve) => stream.on('end', resolve));
}

// ============================================
// EXAMPLE 7: Reading from Multiple Sources
// ============================================

async function example7_MultipleReadStreams() {
  console.log('\n=== Example 7: Multiple Read Streams ===\n');
  
  const stream1 = new NumberStream(5);
  const stream2 = new NumberStream(5);
  
  console.log('Stream 1:');
  for await (const chunk of stream1) {
    console.log(`  ${chunk.toString().trim()}`);
  }
  
  console.log('\nStream 2:');
  for await (const chunk of stream2) {
    console.log(`  ${chunk.toString().trim()}`);
  }
  
  console.log('\nBoth streams completed!');
}

// ============================================
// EXAMPLE 8: Stream Pausing and Resuming
// ============================================

async function example8_PauseResume() {
  console.log('\n=== Example 8: Pause and Resume ===\n');
  
  const stream = new NumberStream(100);
  let count = 0;
  
  stream.on('data', (chunk) => {
    count++;
    console.log(`Received: ${chunk.toString().trim()}`);
    
    if (count % 10 === 0) {
      console.log('  [Pausing for 500ms...]');
      stream.pause();
      
      setTimeout(() => {
        console.log('  [Resuming...]');
        stream.resume();
      }, 500);
    }
  });
  
  stream.on('end', () => {
    console.log(`\nProcessed ${count} items with pauses`);
  });
  
  return new Promise((resolve) => stream.on('end', resolve));
}

// ============================================
// EXAMPLE 9: Readable Stream from Array
// ============================================

function createArrayStream(array) {
  let index = 0;
  
  return new Readable({
    objectMode: true,
    read() {
      if (index < array.length) {
        this.push(array[index]);
        index++;
      } else {
        this.push(null);
      }
    }
  });
}

async function example9_ArrayStream() {
  console.log('\n=== Example 9: Array Stream ===\n');
  
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
    { id: 4, name: 'David' },
    { id: 5, name: 'Eve' }
  ];
  
  const stream = createArrayStream(users);
  
  for await (const user of stream) {
    console.log(`User #${user.id}: ${user.name}`);
  }
}

// ============================================
// EXAMPLE 10: Error Handling in Readable Streams
// ============================================

class ErrorProneStream extends Readable {
  constructor() {
    super();
    this.count = 0;
  }
  
  _read() {
    this.count++;
    
    if (this.count === 5) {
      // Simulate an error
      this.destroy(new Error('Simulated error at count 5'));
      return;
    }
    
    if (this.count < 10) {
      this.push(`Data ${this.count}\n`);
    } else {
      this.push(null);
    }
  }
}

async function example10_ErrorHandling() {
  console.log('\n=== Example 10: Error Handling ===\n');
  
  const stream = new ErrorProneStream();
  
  stream.on('data', (chunk) => {
    console.log(`Received: ${chunk.toString().trim()}`);
  });
  
  stream.on('error', (err) => {
    console.error(`❌ Error caught: ${err.message}`);
  });
  
  stream.on('close', () => {
    console.log('✅ Stream closed (cleanup performed)');
  });
  
  return new Promise((resolve) => {
    stream.on('error', resolve);
    stream.on('end', resolve);
  });
}

// ============================================
// Run All Examples
// ============================================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Node.js Readable Streams Examples    ║');
  console.log('╚════════════════════════════════════════╝');
  
  await example1_BasicFileReading();
  await example2_LargeFileReading();
  await example3_CustomReadableStream();
  await example4_PaginatedAPI();
  await example5_DatabaseCursor();
  await example6_BackpressureControl();
  await example7_MultipleReadStreams();
  await example8_PauseResume();
  await example9_ArrayStream();
  await example10_ErrorHandling();
  
  console.log('\n✅ All examples completed!\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  NumberStream,
  PaginatedAPIStream,
  DatabaseCursorStream,
  ControlledStream,
  createArrayStream
};
