/**
 * Node.js Writable Streams - Real-World Examples
 * 
 * Writable streams are destinations where you can write data.
 * Data flows FROM your application TO the stream.
 */

const fs = require('fs');
const { Writable } = require('stream');
const path = require('path');

// ============================================
// EXAMPLE 1: Basic File Writing with Streams
// ============================================

async function example1_BasicFileWriting() {
  console.log('\n=== Example 1: Basic File Writing ===\n');
  
  const outputPath = path.join(__dirname, 'output-example1.txt');
  const writable = fs.createWriteStream(outputPath);
  
  // Write data
  writable.write('Line 1\n');
  writable.write('Line 2\n');
  writable.write('Line 3\n');
  
  // Signal end of writing
  writable.end('Final line\n');
  
  writable.on('finish', () => {
    console.log('✅ File written successfully');
    console.log(`   Location: ${outputPath}`);
  });
  
  writable.on('error', (err) => {
    console.error('❌ Error writing file:', err);
  });
  
  return new Promise((resolve, reject) => {
    writable.on('finish', resolve);
    writable.on('error', reject);
  });
}

// ============================================
// EXAMPLE 2: Handling Backpressure
// ============================================

async function example2_BackpressureHandling() {
  console.log('\n=== Example 2: Backpressure Handling ===\n');
  
  const outputPath = path.join(__dirname, 'output-example2.txt');
  const writable = fs.createWriteStream(outputPath, {
    highWaterMark: 16 // Small buffer to demonstrate backpressure
  });
  
  let bytesWritten = 0;
  let backpressureCount = 0;
  
  function writeData(i) {
    let canWrite = true;
    
    while (i < 1000 && canWrite) {
      const data = `Line ${i}: ${'x'.repeat(100)}\n`;
      canWrite = writable.write(data);
      bytesWritten += data.length;
      i++;
      
      if (!canWrite) {
        backpressureCount++;
        console.log(`⚠️  Backpressure at line ${i} (${backpressureCount} times)`);
        
        // Wait for drain event
        writable.once('drain', () => {
          console.log('✓ Buffer drained, resuming...');
          writeData(i);
        });
      }
    }
    
    if (i >= 1000) {
      writable.end(() => {
        console.log(`\n✅ Wrote ${bytesWritten} bytes`);
        console.log(`   Backpressure occurred ${backpressureCount} times`);
      });
    }
  }
  
  writeData(0);
  
  return new Promise((resolve) => writable.on('finish', resolve));
}

// ============================================
// EXAMPLE 3: Custom Writable Stream
// ============================================

class ConsoleWriterStream extends Writable {
  constructor(prefix = '', options) {
    super(options);
    this.prefix = prefix;
    this.lineCount = 0;
  }
  
  _write(chunk, encoding, callback) {
    this.lineCount++;
    const data = chunk.toString();
    process.stdout.write(`${this.prefix}[${this.lineCount}] ${data}`);
    
    // Simulate async operation
    setTimeout(callback, 10);
  }
  
  _final(callback) {
    console.log(`\n${this.prefix}Total lines written: ${this.lineCount}`);
    callback();
  }
}

async function example3_CustomWritableStream() {
  console.log('\n=== Example 3: Custom Writable Stream ===\n');
  
  const writer = new ConsoleWriterStream('>> ');
  
  writer.write('First line\n');
  writer.write('Second line\n');
  writer.write('Third line\n');
  writer.end('Last line\n');
  
  return new Promise((resolve) => writer.on('finish', resolve));
}

// ============================================
// EXAMPLE 4: CSV Writer Stream
// ============================================

class CSVWriterStream extends Writable {
  constructor(filePath, headers) {
    super({ objectMode: true });
    this.filePath = filePath;
    this.headers = headers;
    this.fileStream = fs.createWriteStream(filePath);
    this.rowCount = 0;
    
    // Write headers
    this.fileStream.write(headers.join(',') + '\n');
  }
  
  _write(row, encoding, callback) {
    try {
      // Convert object to CSV row
      const values = this.headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        if (value.toString().includes(',') || value.toString().includes('"')) {
          return `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value;
      });
      
      this.fileStream.write(values.join(',') + '\n');
      this.rowCount++;
      callback();
    } catch (err) {
      callback(err);
    }
  }
  
  _final(callback) {
    this.fileStream.end(() => {
      console.log(`✅ CSV written: ${this.rowCount} rows`);
      callback();
    });
  }
}

async function example4_CSVWriter() {
  console.log('\n=== Example 4: CSV Writer Stream ===\n');
  
  const outputPath = path.join(__dirname, 'output-example4.csv');
  const csvWriter = new CSVWriterStream(outputPath, ['id', 'name', 'email', 'age']);
  
  // Write rows
  const users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', age: 28 },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', age: 35 },
    { id: 3, name: 'Charlie, Jr.', email: 'charlie@example.com', age: 42 },
    { id: 4, name: 'David "Dave" Lee', email: 'david@example.com', age: 31 }
  ];
  
  users.forEach(user => csvWriter.write(user));
  csvWriter.end();
  
  csvWriter.on('finish', () => {
    console.log(`   Location: ${outputPath}`);
  });
  
  return new Promise((resolve) => csvWriter.on('finish', resolve));
}

// ============================================
// EXAMPLE 5: Logging System with Rotation
// ============================================

class RotatingLogStream extends Writable {
  constructor(baseFilename, maxSize = 1024 * 1024) {
    super();
    this.baseFilename = baseFilename;
    this.maxSize = maxSize;
    this.currentSize = 0;
    this.fileIndex = 1;
    this.currentStream = this._createNewStream();
  }
  
  _createNewStream() {
    const filename = `${this.baseFilename}.${this.fileIndex}.log`;
    console.log(`  Creating new log file: ${filename}`);
    return fs.createWriteStream(filename);
  }
  
  _write(chunk, encoding, callback) {
    const chunkSize = chunk.length;
    
    if (this.currentSize + chunkSize > this.maxSize) {
      // Rotate log file
      this.currentStream.end(() => {
        this.fileIndex++;
        this.currentSize = 0;
        this.currentStream = this._createNewStream();
        this.currentStream.write(chunk, callback);
        this.currentSize += chunkSize;
      });
    } else {
      this.currentStream.write(chunk, callback);
      this.currentSize += chunkSize;
    }
  }
  
  _final(callback) {
    this.currentStream.end(callback);
  }
}

async function example5_RotatingLogs() {
  console.log('\n=== Example 5: Rotating Log Stream ===\n');
  
  const logPath = path.join(__dirname, 'app');
  const logger = new RotatingLogStream(logPath, 500); // 500 bytes per file
  
  // Simulate log entries
  for (let i = 1; i <= 20; i++) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] INFO: Log entry #${i} with some additional data\n`;
    logger.write(logEntry);
  }
  
  logger.end();
  
  logger.on('finish', () => {
    console.log('\n✅ All logs written with rotation');
  });
  
  return new Promise((resolve) => logger.on('finish', resolve));
}

// ============================================
// EXAMPLE 6: Buffered Batch Writer
// ============================================

class BatchWriterStream extends Writable {
  constructor(filePath, batchSize = 10) {
    super({ objectMode: true });
    this.filePath = filePath;
    this.batchSize = batchSize;
    this.buffer = [];
    this.fileStream = fs.createWriteStream(filePath);
    this.totalWritten = 0;
  }
  
  _write(item, encoding, callback) {
    this.buffer.push(item);
    
    if (this.buffer.length >= this.batchSize) {
      this._flush(callback);
    } else {
      callback();
    }
  }
  
  _flush(callback) {
    if (this.buffer.length === 0) {
      callback();
      return;
    }
    
    const batch = this.buffer.splice(0, this.batchSize);
    const data = batch.map(item => JSON.stringify(item)).join('\n') + '\n';
    
    this.fileStream.write(data, () => {
      this.totalWritten += batch.length;
      console.log(`  Flushed batch: ${batch.length} items (total: ${this.totalWritten})`);
      callback();
    });
  }
  
  _final(callback) {
    // Flush remaining items
    this._flush(() => {
      this.fileStream.end(() => {
        console.log(`✅ Total items written: ${this.totalWritten}`);
        callback();
      });
    });
  }
}

async function example6_BatchWriter() {
  console.log('\n=== Example 6: Buffered Batch Writer ===\n');
  
  const outputPath = path.join(__dirname, 'output-example6.jsonl');
  const batchWriter = new BatchWriterStream(outputPath, 5);
  
  // Write items
  for (let i = 1; i <= 23; i++) {
    batchWriter.write({
      id: i,
      timestamp: Date.now(),
      value: Math.random()
    });
  }
  
  batchWriter.end();
  
  return new Promise((resolve) => batchWriter.on('finish', resolve));
}

// ============================================
// EXAMPLE 7: Database Writer Stream
// ============================================

class DatabaseWriterStream extends Writable {
  constructor(tableName, batchSize = 100) {
    super({ objectMode: true });
    this.tableName = tableName;
    this.batchSize = batchSize;
    this.buffer = [];
    this.totalInserted = 0;
  }
  
  async _write(record, encoding, callback) {
    this.buffer.push(record);
    
    if (this.buffer.length >= this.batchSize) {
      try {
        await this._insertBatch();
        callback();
      } catch (err) {
        callback(err);
      }
    } else {
      callback();
    }
  }
  
  async _insertBatch() {
    if (this.buffer.length === 0) return;
    
    const batch = this.buffer.splice(0, this.batchSize);
    
    // Simulate database insert
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this.totalInserted += batch.length;
    console.log(`  Inserted ${batch.length} records (total: ${this.totalInserted})`);
  }
  
  async _final(callback) {
    try {
      // Insert remaining records
      await this._insertBatch();
      console.log(`✅ Total records inserted: ${this.totalInserted}`);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

async function example7_DatabaseWriter() {
  console.log('\n=== Example 7: Database Writer Stream ===\n');
  
  const dbWriter = new DatabaseWriterStream('users', 50);
  
  // Write records
  for (let i = 1; i <= 175; i++) {
    dbWriter.write({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      created: new Date()
    });
  }
  
  dbWriter.end();
  
  return new Promise((resolve) => dbWriter.on('finish', resolve));
}

// ============================================
// EXAMPLE 8: Write with Cork and Uncork
// ============================================

async function example8_CorkUncork() {
  console.log('\n=== Example 8: Cork and Uncork ===\n');
  
  const outputPath = path.join(__dirname, 'output-example8.txt');
  const writable = fs.createWriteStream(outputPath);
  
  console.log('Writing without cork (immediate writes)...');
  writable.write('Line 1\n');
  writable.write('Line 2\n');
  
  console.log('Corking stream (buffering writes)...');
  writable.cork();
  
  // These writes are buffered
  writable.write('Line 3 (buffered)\n');
  writable.write('Line 4 (buffered)\n');
  writable.write('Line 5 (buffered)\n');
  
  console.log('Uncorking stream (flushing buffer)...');
  writable.uncork();
  
  writable.end('Final line\n');
  
  writable.on('finish', () => {
    console.log('✅ File written with cork/uncork');
  });
  
  return new Promise((resolve) => writable.on('finish', resolve));
}

// ============================================
// EXAMPLE 9: JSON Lines Writer
// ============================================

class JSONLinesWriter extends Writable {
  constructor(filePath) {
    super({ objectMode: true });
    this.fileStream = fs.createWriteStream(filePath);
    this.count = 0;
  }
  
  _write(obj, encoding, callback) {
    try {
      const json = JSON.stringify(obj);
      this.fileStream.write(json + '\n');
      this.count++;
      callback();
    } catch (err) {
      callback(err);
    }
  }
  
  _final(callback) {
    this.fileStream.end(() => {
      console.log(`✅ Wrote ${this.count} JSON objects`);
      callback();
    });
  }
}

async function example9_JSONLinesWriter() {
  console.log('\n=== Example 9: JSON Lines Writer ===\n');
  
  const outputPath = path.join(__dirname, 'output-example9.jsonl');
  const writer = new JSONLinesWriter(outputPath);
  
  const events = [
    { type: 'login', user: 'alice', timestamp: Date.now() },
    { type: 'click', element: 'button', timestamp: Date.now() + 1000 },
    { type: 'logout', user: 'alice', timestamp: Date.now() + 2000 }
  ];
  
  events.forEach(event => writer.write(event));
  writer.end();
  
  return new Promise((resolve) => writer.on('finish', resolve));
}

// ============================================
// EXAMPLE 10: Error Handling in Writable Streams
// ============================================

class ErrorHandlingWriter extends Writable {
  constructor() {
    super({ objectMode: true });
    this.writeCount = 0;
  }
  
  _write(chunk, encoding, callback) {
    this.writeCount++;
    
    // Simulate error on 5th write
    if (this.writeCount === 5) {
      callback(new Error('Simulated write error'));
      return;
    }
    
    console.log(`  Written: ${JSON.stringify(chunk)}`);
    callback();
  }
}

async function example10_ErrorHandling() {
  console.log('\n=== Example 10: Error Handling ===\n');
  
  const writer = new ErrorHandlingWriter();
  
  writer.on('error', (err) => {
    console.error(`❌ Error caught: ${err.message}`);
  });
  
  writer.on('finish', () => {
    console.log('✅ Stream finished successfully');
  });
  
  writer.on('close', () => {
    console.log('✅ Stream closed');
  });
  
  for (let i = 1; i <= 10; i++) {
    const canWrite = writer.write({ id: i, data: `Item ${i}` });
    
    if (!canWrite) {
      // Wait for drain
      await new Promise(resolve => writer.once('drain', resolve));
    }
  }
  
  writer.end();
  
  return new Promise((resolve) => {
    writer.on('error', resolve);
    writer.on('finish', resolve);
  });
}

// ============================================
// Run All Examples
// ============================================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Node.js Writable Streams Examples    ║');
  console.log('╚════════════════════════════════════════╝');
  
  await example1_BasicFileWriting();
  await example2_BackpressureHandling();
  await example3_CustomWritableStream();
  await example4_CSVWriter();
  await example5_RotatingLogs();
  await example6_BatchWriter();
  await example7_DatabaseWriter();
  await example8_CorkUncork();
  await example9_JSONLinesWriter();
  await example10_ErrorHandling();
  
  console.log('\n✅ All examples completed!\n');
  console.log('Generated files can be found in:', __dirname);
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  ConsoleWriterStream,
  CSVWriterStream,
  RotatingLogStream,
  BatchWriterStream,
  DatabaseWriterStream,
  JSONLinesWriter
};
