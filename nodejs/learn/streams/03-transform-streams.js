/**
 * Node.js Transform Streams - Real-World Examples
 * 
 * Transform streams are Duplex streams that modify or transform data
 * as it passes through. They read from one end, transform, and write to the other.
 */

const { Transform, pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const path = require('path');

// ============================================
// EXAMPLE 1: Basic Transform - Uppercase
// ============================================

class UppercaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const uppercased = chunk.toString().toUpperCase();
    this.push(uppercased);
    callback();
  }
}

async function example1_BasicTransform() {
  console.log('\n=== Example 1: Basic Transform (Uppercase) ===\n');
  
  const input = 'Hello World\nThis is a test\nTransform streams are cool!\n';
  console.log('Input:');
  console.log(input);
  
  const transform = new UppercaseTransform();
  
  console.log('Output:');
  transform.write(input);
  transform.end();
  
  transform.on('data', (chunk) => {
    process.stdout.write(chunk.toString());
  });
  
  return new Promise((resolve) => transform.on('end', resolve));
}

// ============================================
// EXAMPLE 2: CSV Parser Transform
// ============================================

class CSVParserTransform extends Transform {
  constructor(headers) {
    super({ objectMode: true });
    this.headers = headers;
    this.buffer = '';
  }
  
  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    
    // Keep last incomplete line in buffer
    this.buffer = lines.pop();
    
    lines.forEach(line => {
      if (line.trim()) {
        const values = line.split(',');
        const obj = {};
        
        this.headers.forEach((header, i) => {
          obj[header] = values[i] ? values[i].trim() : '';
        });
        
        this.push(obj);
      }
    });
    
    callback();
  }
  
  _flush(callback) {
    // Process remaining data
    if (this.buffer.trim()) {
      const values = this.buffer.split(',');
      const obj = {};
      
      this.headers.forEach((header, i) => {
        obj[header] = values[i] ? values[i].trim() : '';
      });
      
      this.push(obj);
    }
    callback();
  }
}

async function example2_CSVParser() {
  console.log('\n=== Example 2: CSV Parser Transform ===\n');
  
  const csvData = `1,Alice,alice@example.com,28
2,Bob,bob@example.com,35
3,Charlie,charlie@example.com,42`;
  
  const parser = new CSVParserTransform(['id', 'name', 'email', 'age']);
  
  parser.on('data', (obj) => {
    console.log('Parsed:', JSON.stringify(obj));
  });
  
  parser.write(csvData);
  parser.end();
  
  return new Promise((resolve) => parser.on('end', resolve));
}

// ============================================
// EXAMPLE 3: JSON Stream Parser
// ============================================

class JSONLinesParser extends Transform {
  constructor() {
    super({ objectMode: true });
    this.buffer = '';
  }
  
  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    
    // Keep incomplete line
    this.buffer = lines.pop();
    
    lines.forEach(line => {
      if (line.trim()) {
        try {
          const obj = JSON.parse(line);
          this.push(obj);
        } catch (err) {
          this.emit('error', new Error(`Invalid JSON: ${line}`));
        }
      }
    });
    
    callback();
  }
  
  _flush(callback) {
    if (this.buffer.trim()) {
      try {
        const obj = JSON.parse(this.buffer);
        this.push(obj);
      } catch (err) {
        this.emit('error', new Error(`Invalid JSON: ${this.buffer}`));
      }
    }
    callback();
  }
}

async function example3_JSONParser() {
  console.log('\n=== Example 3: JSON Lines Parser ===\n');
  
  const jsonLines = `{"id":1,"name":"Alice"}
{"id":2,"name":"Bob"}
{"id":3,"name":"Charlie"}`;
  
  const parser = new JSONLinesParser();
  
  parser.on('data', (obj) => {
    console.log(`Parsed: User #${obj.id} - ${obj.name}`);
  });
  
  parser.write(jsonLines);
  parser.end();
  
  return new Promise((resolve) => parser.on('end', resolve));
}

// ============================================
// EXAMPLE 4: Data Validation Transform
// ============================================

class ValidationTransform extends Transform {
  constructor(schema) {
    super({ objectMode: true });
    this.schema = schema;
    this.validCount = 0;
    this.invalidCount = 0;
  }
  
  _transform(obj, encoding, callback) {
    const errors = this.validate(obj);
    
    if (errors.length === 0) {
      this.validCount++;
      this.push(obj);
    } else {
      this.invalidCount++;
      console.log(`  ❌ Invalid: ${JSON.stringify(obj)} - ${errors.join(', ')}`);
    }
    
    callback();
  }
  
  validate(obj) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(this.schema)) {
      const value = obj[field];
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
      }
      
      if (rules.type && value !== undefined) {
        if (rules.type === 'number' && typeof value !== 'number') {
          errors.push(`${field} must be a number`);
        }
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
      }
      
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be >= ${rules.min}`);
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be <= ${rules.max}`);
      }
    }
    
    return errors;
  }
  
  _flush(callback) {
    console.log(`\n  Valid: ${this.validCount}, Invalid: ${this.invalidCount}`);
    callback();
  }
}

async function example4_Validation() {
  console.log('\n=== Example 4: Data Validation Transform ===\n');
  
  const schema = {
    id: { required: true, type: 'number' },
    name: { required: true, type: 'string' },
    age: { required: true, type: 'number', min: 0, max: 150 }
  };
  
  const validator = new ValidationTransform(schema);
  
  const testData = [
    { id: 1, name: 'Alice', age: 28 },      // Valid
    { id: 2, name: 'Bob' },                 // Missing age
    { id: 3, name: 'Charlie', age: 200 },   // Age too high
    { id: 4, name: 'David', age: 35 },      // Valid
    { name: 'Eve', age: 25 }                // Missing id
  ];
  
  validator.on('data', (obj) => {
    console.log(`  ✅ Valid: ${JSON.stringify(obj)}`);
  });
  
  testData.forEach(data => validator.write(data));
  validator.end();
  
  return new Promise((resolve) => validator.on('finish', resolve));
}

// ============================================
// EXAMPLE 5: Data Enrichment Transform
// ============================================

class EnrichmentTransform extends Transform {
  constructor(enrichmentFn) {
    super({ objectMode: true });
    this.enrichmentFn = enrichmentFn;
  }
  
  async _transform(obj, encoding, callback) {
    try {
      const enriched = await this.enrichmentFn(obj);
      this.push(enriched);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

async function example5_DataEnrichment() {
  console.log('\n=== Example 5: Data Enrichment Transform ===\n');
  
  // Simulated database lookup
  const userDatabase = {
    1: { department: 'Engineering', location: 'NYC' },
    2: { department: 'Marketing', location: 'LA' },
    3: { department: 'Sales', location: 'Chicago' }
  };
  
  const enrichFn = async (user) => {
    // Simulate async lookup
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const additionalInfo = userDatabase[user.id] || {};
    return { ...user, ...additionalInfo };
  };
  
  const enricher = new EnrichmentTransform(enrichFn);
  
  enricher.on('data', (obj) => {
    console.log('Enriched:', JSON.stringify(obj));
  });
  
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
  ];
  
  users.forEach(user => enricher.write(user));
  enricher.end();
  
  return new Promise((resolve) => enricher.on('finish', resolve));
}

// ============================================
// EXAMPLE 6: Compression and Decompression
// ============================================

async function example6_Compression() {
  console.log('\n=== Example 6: Compression Transform ===\n');
  
  const inputPath = __filename;
  const compressedPath = path.join(__dirname, 'compressed.gz');
  const decompressedPath = path.join(__dirname, 'decompressed.txt');
  
  // Compress
  console.log('Compressing file...');
  await new Promise((resolve, reject) => {
    pipeline(
      fs.createReadStream(inputPath),
      zlib.createGzip(),
      fs.createWriteStream(compressedPath),
      (err) => {
        if (err) reject(err);
        else {
          const originalSize = fs.statSync(inputPath).size;
          const compressedSize = fs.statSync(compressedPath).size;
          const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
          console.log(`  Original: ${originalSize} bytes`);
          console.log(`  Compressed: ${compressedSize} bytes`);
          console.log(`  Ratio: ${ratio}% smaller`);
          resolve();
        }
      }
    );
  });
  
  // Decompress
  console.log('\nDecompressing file...');
  await new Promise((resolve, reject) => {
    pipeline(
      fs.createReadStream(compressedPath),
      zlib.createGunzip(),
      fs.createWriteStream(decompressedPath),
      (err) => {
        if (err) reject(err);
        else {
          console.log('  ✅ Decompressed successfully');
          resolve();
        }
      }
    );
  });
}

// ============================================
// EXAMPLE 7: Encryption Transform
// ============================================

class EncryptTransform extends Transform {
  constructor(algorithm, key) {
    super();
    this.cipher = crypto.createCipher(algorithm, key);
  }
  
  _transform(chunk, encoding, callback) {
    try {
      const encrypted = this.cipher.update(chunk);
      this.push(encrypted);
      callback();
    } catch (err) {
      callback(err);
    }
  }
  
  _flush(callback) {
    try {
      const final = this.cipher.final();
      this.push(final);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

class DecryptTransform extends Transform {
  constructor(algorithm, key) {
    super();
    this.decipher = crypto.createDecipher(algorithm, key);
  }
  
  _transform(chunk, encoding, callback) {
    try {
      const decrypted = this.decipher.update(chunk);
      this.push(decrypted);
      callback();
    } catch (err) {
      callback(err);
    }
  }
  
  _flush(callback) {
    try {
      const final = this.decipher.final();
      this.push(final);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

async function example7_Encryption() {
  console.log('\n=== Example 7: Encryption Transform ===\n');
  
  const algorithm = 'aes-256-ctr';
  const password = 'my-secret-password';
  
  const plaintext = 'This is a secret message that needs to be encrypted!';
  console.log('Original:', plaintext);
  
  // Encrypt
  const encryptStream = new EncryptTransform(algorithm, password);
  const encrypted = [];
  
  encryptStream.on('data', (chunk) => {
    encrypted.push(chunk);
  });
  
  await new Promise((resolve) => {
    encryptStream.on('end', resolve);
    encryptStream.write(plaintext);
    encryptStream.end();
  });
  
  const encryptedBuffer = Buffer.concat(encrypted);
  console.log('Encrypted:', encryptedBuffer.toString('hex'));
  
  // Decrypt
  const decryptStream = new DecryptTransform(algorithm, password);
  const decrypted = [];
  
  decryptStream.on('data', (chunk) => {
    decrypted.push(chunk);
  });
  
  await new Promise((resolve) => {
    decryptStream.on('end', resolve);
    decryptStream.write(encryptedBuffer);
    decryptStream.end();
  });
  
  const decryptedText = Buffer.concat(decrypted).toString();
  console.log('Decrypted:', decryptedText);
}

// ============================================
// EXAMPLE 8: Batching Transform
// ============================================

class BatchTransform extends Transform {
  constructor(batchSize) {
    super({ objectMode: true });
    this.batchSize = batchSize;
    this.buffer = [];
  }
  
  _transform(item, encoding, callback) {
    this.buffer.push(item);
    
    if (this.buffer.length >= this.batchSize) {
      this.push([...this.buffer]);
      this.buffer = [];
    }
    
    callback();
  }
  
  _flush(callback) {
    if (this.buffer.length > 0) {
      this.push([...this.buffer]);
    }
    callback();
  }
}

async function example8_Batching() {
  console.log('\n=== Example 8: Batching Transform ===\n');
  
  const batcher = new BatchTransform(3);
  
  batcher.on('data', (batch) => {
    console.log(`Batch (${batch.length} items):`, JSON.stringify(batch));
  });
  
  for (let i = 1; i <= 10; i++) {
    batcher.write({ id: i, value: `Item ${i}` });
  }
  
  batcher.end();
  
  return new Promise((resolve) => batcher.on('finish', resolve));
}

// ============================================
// EXAMPLE 9: Rate Limiting Transform
// ============================================

class RateLimitTransform extends Transform {
  constructor(itemsPerSecond) {
    super({ objectMode: true });
    this.itemsPerSecond = itemsPerSecond;
    this.delay = 1000 / itemsPerSecond;
    this.lastTime = Date.now();
  }
  
  async _transform(item, encoding, callback) {
    const now = Date.now();
    const elapsed = now - this.lastTime;
    
    if (elapsed < this.delay) {
      const waitTime = this.delay - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastTime = Date.now();
    this.push(item);
    callback();
  }
}

async function example9_RateLimiting() {
  console.log('\n=== Example 9: Rate Limiting Transform ===\n');
  console.log('Processing at 2 items/second...\n');
  
  const rateLimiter = new RateLimitTransform(2);
  
  const startTime = Date.now();
  
  rateLimiter.on('data', (item) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${elapsed}s] Processed: ${JSON.stringify(item)}`);
  });
  
  for (let i = 1; i <= 6; i++) {
    rateLimiter.write({ id: i, name: `Task ${i}` });
  }
  
  rateLimiter.end();
  
  return new Promise((resolve) => rateLimiter.on('finish', resolve));
}

// ============================================
// EXAMPLE 10: Chaining Multiple Transforms
// ============================================

class FilterTransform extends Transform {
  constructor(predicate) {
    super({ objectMode: true });
    this.predicate = predicate;
  }
  
  _transform(item, encoding, callback) {
    if (this.predicate(item)) {
      this.push(item);
    }
    callback();
  }
}

class MapTransform extends Transform {
  constructor(mapper) {
    super({ objectMode: true });
    this.mapper = mapper;
  }
  
  _transform(item, encoding, callback) {
    this.push(this.mapper(item));
    callback();
  }
}

async function example10_ChainedTransforms() {
  console.log('\n=== Example 10: Chained Transforms ===\n');
  
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  const { Readable } = require('stream');
  const source = Readable.from(numbers);
  
  // Filter even numbers
  const filter = new FilterTransform(n => n % 2 === 0);
  
  // Map to squares
  const mapper = new MapTransform(n => ({ original: n, squared: n * n }));
  
  console.log('Pipeline: Source → Filter (even) → Map (square)\n');
  
  await new Promise((resolve, reject) => {
    pipeline(
      source,
      filter,
      mapper,
      async function* (source) {
        for await (const item of source) {
          console.log(`Result: ${item.original}² = ${item.squared}`);
        }
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// ============================================
// Run All Examples
// ============================================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Node.js Transform Streams Examples   ║');
  console.log('╚════════════════════════════════════════╝');
  
  await example1_BasicTransform();
  await example2_CSVParser();
  await example3_JSONParser();
  await example4_Validation();
  await example5_DataEnrichment();
  await example6_Compression();
  await example7_Encryption();
  await example8_Batching();
  await example9_RateLimiting();
  await example10_ChainedTransforms();
  
  console.log('\n✅ All examples completed!\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  UppercaseTransform,
  CSVParserTransform,
  JSONLinesParser,
  ValidationTransform,
  EnrichmentTransform,
  EncryptTransform,
  DecryptTransform,
  BatchTransform,
  RateLimitTransform,
  FilterTransform,
  MapTransform
};
