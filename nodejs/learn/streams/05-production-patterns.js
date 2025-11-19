/**
 * Node.js Streams - Production Patterns & Real-World Use Cases
 * 
 * This file demonstrates complete, production-ready patterns
 * using Node.js streams for common scenarios.
 */

const fs = require('fs');
const { pipeline, Transform, Readable, Writable } = require('stream');
const { createGzip, createGunzip } = require('zlib');
const crypto = require('crypto');
const path = require('path');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

// ============================================
// PATTERN 1: File Upload with Progress
// ============================================

class UploadProgressTransform extends Transform {
  constructor(totalSize, onProgress) {
    super();
    this.totalSize = totalSize;
    this.uploaded = 0;
    this.onProgress = onProgress;
    this.lastProgressTime = Date.now();
  }
  
  _transform(chunk, encoding, callback) {
    this.uploaded += chunk.length;
    
    // Throttle progress updates (every 100ms)
    const now = Date.now();
    if (now - this.lastProgressTime >= 100 || this.uploaded === this.totalSize) {
      const progress = (this.uploaded / this.totalSize * 100).toFixed(2);
      const speed = this.uploaded / ((now - this.lastProgressTime) / 1000);
      
      this.onProgress({
        uploaded: this.uploaded,
        total: this.totalSize,
        progress: parseFloat(progress),
        speed: Math.round(speed)
      });
      
      this.lastProgressTime = now;
    }
    
    this.push(chunk);
    callback();
  }
}

async function pattern1_FileUpload() {
  console.log('\n=== Pattern 1: File Upload with Progress ===\n');
  
  const sourcePath = __filename;
  const targetPath = path.join(__dirname, 'uploaded-file.txt');
  
  const stats = fs.statSync(sourcePath);
  const totalSize = stats.size;
  
  const progressTracker = new UploadProgressTransform(totalSize, (progress) => {
    const bar = '█'.repeat(Math.floor(progress.progress / 2)) +
                '░'.repeat(50 - Math.floor(progress.progress / 2));
    const speed = (progress.speed / 1024).toFixed(2);
    process.stdout.write(`\r  [${bar}] ${progress.progress}% | ${speed} KB/s`);
  });
  
  await pipelineAsync(
    fs.createReadStream(sourcePath),
    progressTracker,
    fs.createWriteStream(targetPath)
  );
  
  console.log('\n  ✅ Upload complete!\n');
}

// ============================================
// PATTERN 2: Video Streaming with Chunking
// ============================================

class VideoStreamHandler {
  constructor(videoPath) {
    this.videoPath = videoPath;
    this.chunkSize = 1024 * 1024; // 1MB chunks
  }
  
  createStream(range) {
    const stats = fs.statSync(this.videoPath);
    const fileSize = stats.size;
    
    let start = 0;
    let end = fileSize - 1;
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : end;
    }
    
    const contentLength = end - start + 1;
    
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': 'video/mp4'
    };
    
    const stream = fs.createReadStream(this.videoPath, { start, end });
    
    return { stream, headers, statusCode: range ? 206 : 200 };
  }
}

async function pattern2_VideoStreaming() {
  console.log('\n=== Pattern 2: Video Streaming ===\n');
  
  // Simulate video file (use this file as example)
  const videoPath = __filename;
  const handler = new VideoStreamHandler(videoPath);
  
  // Simulate request for bytes 0-1000
  console.log('  Requesting bytes 0-1000...');
  const { stream, headers, statusCode } = handler.createStream('bytes=0-1000');
  
  console.log(`  Status: ${statusCode}`);
  console.log(`  Headers:`, headers);
  
  let bytesReceived = 0;
  stream.on('data', (chunk) => {
    bytesReceived += chunk.length;
  });
  
  await new Promise((resolve) => stream.on('end', () => {
    console.log(`  ✅ Received ${bytesReceived} bytes\n`);
    resolve();
  }));
}

// ============================================
// PATTERN 3: Log File Processing Pipeline
// ============================================

class LogParser extends Transform {
  constructor() {
    super({ objectMode: true });
    this.buffer = '';
  }
  
  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop();
    
    lines.forEach(line => {
      if (line.trim()) {
        const parsed = this.parseLine(line);
        if (parsed) this.push(parsed);
      }
    });
    
    callback();
  }
  
  _flush(callback) {
    if (this.buffer.trim()) {
      const parsed = this.parseLine(this.buffer);
      if (parsed) this.push(parsed);
    }
    callback();
  }
  
  parseLine(line) {
    // Parse log format: [timestamp] LEVEL: message
    const match = line.match(/\[(.+?)\] (\w+): (.+)/);
    if (match) {
      return {
        timestamp: new Date(match[1]),
        level: match[2],
        message: match[3]
      };
    }
    return null;
  }
}

class LogFilter extends Transform {
  constructor(levels) {
    super({ objectMode: true });
    this.levels = new Set(levels);
  }
  
  _transform(log, encoding, callback) {
    if (this.levels.has(log.level)) {
      this.push(log);
    }
    callback();
  }
}

class LogAggregator extends Writable {
  constructor() {
    super({ objectMode: true });
    this.stats = {};
  }
  
  _write(log, encoding, callback) {
    if (!this.stats[log.level]) {
      this.stats[log.level] = 0;
    }
    this.stats[log.level]++;
    callback();
  }
  
  _final(callback) {
    console.log('  Log Statistics:');
    for (const [level, count] of Object.entries(this.stats)) {
      console.log(`    ${level}: ${count}`);
    }
    callback();
  }
}

async function pattern3_LogProcessing() {
  console.log('\n=== Pattern 3: Log Processing Pipeline ===\n');
  
  // Create sample log file
  const logPath = path.join(__dirname, 'sample.log');
  const logs = [
    `[${new Date().toISOString()}] INFO: Application started`,
    `[${new Date().toISOString()}] DEBUG: Loading configuration`,
    `[${new Date().toISOString()}] INFO: Connected to database`,
    `[${new Date().toISOString()}] ERROR: Failed to load user data`,
    `[${new Date().toISOString()}] WARN: Deprecated API used`,
    `[${new Date().toISOString()}] INFO: Request processed`,
    `[${new Date().toISOString()}] ERROR: Connection timeout`
  ];
  fs.writeFileSync(logPath, logs.join('\n'));
  
  console.log('  Processing logs...\n');
  
  await pipelineAsync(
    fs.createReadStream(logPath),
    new LogParser(),
    new LogFilter(['ERROR', 'WARN']),
    new Transform({
      objectMode: true,
      transform(log, encoding, callback) {
        console.log(`  [${log.level}] ${log.message}`);
        this.push(log);
        callback();
      }
    }),
    new LogAggregator()
  );
  
  console.log('');
}

// ============================================
// PATTERN 4: ETL Pipeline (Extract, Transform, Load)
// ============================================

class DataExtractor extends Readable {
  constructor(dataSource, batchSize = 100) {
    super({ objectMode: true });
    this.dataSource = dataSource;
    this.batchSize = batchSize;
    this.offset = 0;
  }
  
  async _read() {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const batch = this.dataSource.slice(this.offset, this.offset + this.batchSize);
    
    if (batch.length === 0) {
      this.push(null);
      return;
    }
    
    batch.forEach(item => this.push(item));
    this.offset += batch.length;
  }
}

class DataTransformer extends Transform {
  constructor(transformFn) {
    super({ objectMode: true });
    this.transformFn = transformFn;
  }
  
  async _transform(item, encoding, callback) {
    try {
      const transformed = await this.transformFn(item);
      this.push(transformed);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

class DataLoader extends Writable {
  constructor(targetDb) {
    super({ objectMode: true });
    this.targetDb = targetDb;
    this.buffer = [];
    this.batchSize = 50;
    this.loaded = 0;
  }
  
  async _write(item, encoding, callback) {
    this.buffer.push(item);
    
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
    
    callback();
  }
  
  async _final(callback) {
    await this.flush();
    console.log(`  ✅ Total records loaded: ${this.loaded}`);
    callback();
  }
  
  async flush() {
    if (this.buffer.length === 0) return;
    
    // Simulate batch insert
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this.loaded += this.buffer.length;
    console.log(`  Loaded batch: ${this.buffer.length} records (total: ${this.loaded})`);
    
    this.buffer = [];
  }
}

async function pattern4_ETLPipeline() {
  console.log('\n=== Pattern 4: ETL Pipeline ===\n');
  
  // Sample data source
  const sourceData = Array.from({ length: 250 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: i % 3 === 0 ? 'inactive' : 'active'
  }));
  
  const transformFn = async (user) => {
    // Transform: add computed fields
    return {
      ...user,
      emailDomain: user.email.split('@')[1],
      isActive: user.status === 'active',
      processed: new Date()
    };
  };
  
  console.log('  Extracting, transforming, and loading data...\n');
  
  await pipelineAsync(
    new DataExtractor(sourceData, 75),
    new DataTransformer(transformFn),
    new DataLoader('target_database')
  );
  
  console.log('');
}

// ============================================
// PATTERN 5: Secure File Transfer (Compress + Encrypt)
// ============================================

async function pattern5_SecureFileTransfer() {
  console.log('\n=== Pattern 5: Secure File Transfer ===\n');
  
  const sourcePath = __filename;
  const encryptedPath = path.join(__dirname, 'secure.enc');
  const decryptedPath = path.join(__dirname, 'decrypted.txt');
  
  const algorithm = 'aes-256-ctr';
  const password = 'secure-password-123';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  // Encrypt and compress
  console.log('  Step 1: Compress and encrypt...');
  await pipelineAsync(
    fs.createReadStream(sourcePath),
    createGzip(),
    crypto.createCipheriv(algorithm, key, iv),
    fs.createWriteStream(encryptedPath)
  );
  
  const originalSize = fs.statSync(sourcePath).size;
  const encryptedSize = fs.statSync(encryptedPath).size;
  console.log(`    Original: ${originalSize} bytes`);
  console.log(`    Encrypted: ${encryptedSize} bytes`);
  
  // Decrypt and decompress
  console.log('  Step 2: Decrypt and decompress...');
  await pipelineAsync(
    fs.createReadStream(encryptedPath),
    crypto.createDecipheriv(algorithm, key, iv),
    createGunzip(),
    fs.createWriteStream(decryptedPath)
  );
  
  console.log('  ✅ Secure transfer complete!\n');
}

// ============================================
// PATTERN 6: Data Deduplication Stream
// ============================================

class DeduplicationTransform extends Transform {
  constructor(keyFn) {
    super({ objectMode: true });
    this.seen = new Set();
    this.keyFn = keyFn || ((item) => JSON.stringify(item));
    this.duplicates = 0;
    this.unique = 0;
  }
  
  _transform(item, encoding, callback) {
    const key = this.keyFn(item);
    
    if (this.seen.has(key)) {
      this.duplicates++;
    } else {
      this.seen.add(key);
      this.unique++;
      this.push(item);
    }
    
    callback();
  }
  
  _flush(callback) {
    console.log(`  Unique: ${this.unique}, Duplicates: ${this.duplicates}`);
    callback();
  }
}

async function pattern6_Deduplication() {
  console.log('\n=== Pattern 6: Data Deduplication ===\n');
  
  const { Readable } = require('stream');
  
  const data = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 1, name: 'Alice' }, // Duplicate
    { id: 3, name: 'Charlie' },
    { id: 2, name: 'Bob' }, // Duplicate
    { id: 4, name: 'David' }
  ];
  
  console.log('  Processing with deduplication...\n');
  
  await pipelineAsync(
    Readable.from(data),
    new DeduplicationTransform((item) => item.id),
    new Writable({
      objectMode: true,
      write(item, encoding, callback) {
        console.log(`  Unique: ${JSON.stringify(item)}`);
        callback();
      }
    })
  );
  
  console.log('');
}

// ============================================
// PATTERN 7: Multi-File Merge Stream
// ============================================

class MergeStream extends Readable {
  constructor(streams) {
    super();
    this.streams = streams;
    this.currentIndex = 0;
  }
  
  _read() {
    if (this.currentIndex >= this.streams.length) {
      this.push(null);
      return;
    }
    
    const currentStream = this.streams[this.currentIndex];
    
    const onData = (chunk) => {
      if (!this.push(chunk)) {
        currentStream.pause();
      }
    };
    
    const onEnd = () => {
      currentStream.removeListener('data', onData);
      currentStream.removeListener('end', onEnd);
      this.currentIndex++;
      this._read();
    };
    
    currentStream.on('data', onData);
    currentStream.once('end', onEnd);
    currentStream.resume();
  }
}

async function pattern7_MultiFileMerge() {
  console.log('\n=== Pattern 7: Multi-File Merge ===\n');
  
  // Create sample files
  const file1 = path.join(__dirname, 'part1.txt');
  const file2 = path.join(__dirname, 'part2.txt');
  const file3 = path.join(__dirname, 'part3.txt');
  const merged = path.join(__dirname, 'merged.txt');
  
  fs.writeFileSync(file1, 'Part 1 content\n');
  fs.writeFileSync(file2, 'Part 2 content\n');
  fs.writeFileSync(file3, 'Part 3 content\n');
  
  const streams = [
    fs.createReadStream(file1),
    fs.createReadStream(file2),
    fs.createReadStream(file3)
  ];
  
  console.log('  Merging 3 files...');
  
  await pipelineAsync(
    new MergeStream(streams),
    fs.createWriteStream(merged)
  );
  
  console.log('  ✅ Files merged successfully!\n');
}

// ============================================
// PATTERN 8: Real-Time Data Processing
// ============================================

class EventStream extends Readable {
  constructor() {
    super({ objectMode: true });
    this.eventCount = 0;
    this.maxEvents = 20;
    this.interval = null;
  }
  
  _read() {
    if (this.interval) return;
    
    this.interval = setInterval(() => {
      if (this.eventCount >= this.maxEvents) {
        clearInterval(this.interval);
        this.push(null);
        return;
      }
      
      const event = {
        id: ++this.eventCount,
        type: ['click', 'view', 'purchase'][Math.floor(Math.random() * 3)],
        timestamp: Date.now(),
        value: Math.random() * 100
      };
      
      this.push(event);
    }, 100);
  }
  
  _destroy(err, callback) {
    if (this.interval) {
      clearInterval(this.interval);
    }
    callback(err);
  }
}

class MetricsAggregator extends Writable {
  constructor(windowSize = 5) {
    super({ objectMode: true });
    this.windowSize = windowSize;
    this.window = [];
    this.metrics = { click: 0, view: 0, purchase: 0 };
  }
  
  _write(event, encoding, callback) {
    this.window.push(event);
    this.metrics[event.type]++;
    
    if (this.window.length >= this.windowSize) {
      this.emitMetrics();
      this.window = [];
      this.metrics = { click: 0, view: 0, purchase: 0 };
    }
    
    callback();
  }
  
  _final(callback) {
    if (this.window.length > 0) {
      this.emitMetrics();
    }
    callback();
  }
  
  emitMetrics() {
    const total = this.window.length;
    console.log(`  Metrics (last ${total} events):`);
    console.log(`    Clicks: ${this.metrics.click}`);
    console.log(`    Views: ${this.metrics.view}`);
    console.log(`    Purchases: ${this.metrics.purchase}`);
    console.log('');
  }
}

async function pattern8_RealTimeProcessing() {
  console.log('\n=== Pattern 8: Real-Time Data Processing ===\n');
  
  console.log('  Processing real-time events...\n');
  
  await pipelineAsync(
    new EventStream(),
    new MetricsAggregator(5)
  );
  
  console.log('  ✅ Real-time processing complete!\n');
}

// ============================================
// Run All Patterns
// ============================================

async function runAllPatterns() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Node.js Streams Production Patterns ║');
  console.log('╚════════════════════════════════════════╝');
  
  await pattern1_FileUpload();
  await pattern2_VideoStreaming();
  await pattern3_LogProcessing();
  await pattern4_ETLPipeline();
  await pattern5_SecureFileTransfer();
  await pattern6_Deduplication();
  await pattern7_MultiFileMerge();
  await pattern8_RealTimeProcessing();
  
  console.log('✅ All production patterns completed!\n');
  console.log('Note: Generated files can be found in:', __dirname);
}

// Run if executed directly
if (require.main === module) {
  runAllPatterns().catch(console.error);
}

module.exports = {
  UploadProgressTransform,
  VideoStreamHandler,
  LogParser,
  LogFilter,
  LogAggregator,
  DataExtractor,
  DataTransformer,
  DataLoader,
  DeduplicationTransform,
  MergeStream,
  EventStream,
  MetricsAggregator
};
