/**
 * Node.js Duplex Streams - Real-World Examples
 * 
 * Duplex streams are both Readable AND Writable.
 * They have independent read and write sides that operate separately.
 */

const { Duplex } = require('stream');
const net = require('net');
const { EventEmitter } = require('events');

// ============================================
// EXAMPLE 1: Basic Duplex Stream
// ============================================

class BasicDuplex extends Duplex {
  constructor() {
    super();
    this.data = [];
  }
  
  _write(chunk, encoding, callback) {
    // Store incoming data
    this.data.push(chunk);
    console.log(`  Written: ${chunk.toString().trim()}`);
    callback();
  }
  
  _read() {
    // Read stored data
    if (this.data.length > 0) {
      const chunk = this.data.shift();
      this.push(chunk);
    } else {
      // No more data
      this.push(null);
    }
  }
}

async function example1_BasicDuplex() {
  console.log('\n=== Example 1: Basic Duplex Stream ===\n');
  
  const duplex = new BasicDuplex();
  
  // Write side
  duplex.write('Hello\n');
  duplex.write('World\n');
  duplex.end('Goodbye\n');
  
  // Read side
  console.log('\nReading back:');
  duplex.on('data', (chunk) => {
    console.log(`  Read: ${chunk.toString().trim()}`);
  });
  
  return new Promise((resolve) => duplex.on('end', resolve));
}

// ============================================
// EXAMPLE 2: Echo Server (TCP Socket)
// ============================================

async function example2_EchoServer() {
  console.log('\n=== Example 2: Echo Server (Duplex Socket) ===\n');
  
  return new Promise((resolve) => {
    const server = net.createServer((socket) => {
      console.log('  Client connected');
      
      // Socket is duplex: can read and write
      socket.on('data', (data) => {
        console.log(`  Received: ${data.toString().trim()}`);
        // Echo back
        socket.write(`Echo: ${data}`);
      });
      
      socket.on('end', () => {
        console.log('  Client disconnected');
      });
    });
    
    server.listen(0, () => {
      const port = server.address().port;
      console.log(`  Server listening on port ${port}`);
      
      // Create client connection
      const client = net.createConnection(port, () => {
        console.log('  Connected to server');
        
        client.write('Hello Server!\n');
        client.write('How are you?\n');
        
        setTimeout(() => {
          client.end('Goodbye!\n');
        }, 100);
      });
      
      client.on('data', (data) => {
        console.log(`  Client received: ${data.toString().trim()}`);
      });
      
      client.on('end', () => {
        console.log('  Connection closed');
        server.close();
        resolve();
      });
    });
  });
}

// ============================================
// EXAMPLE 3: In-Memory Queue (Duplex)
// ============================================

class QueueDuplex extends Duplex {
  constructor() {
    super({ objectMode: true });
    this.queue = [];
    this.maxSize = 10;
  }
  
  _write(item, encoding, callback) {
    if (this.queue.length >= this.maxSize) {
      callback(new Error('Queue is full'));
      return;
    }
    
    this.queue.push(item);
    console.log(`  Enqueued: ${JSON.stringify(item)} (Queue size: ${this.queue.length})`);
    callback();
  }
  
  _read() {
    if (this.queue.length > 0) {
      const item = this.queue.shift();
      this.push(item);
    }
  }
}

async function example3_QueueDuplex() {
  console.log('\n=== Example 3: In-Memory Queue ===\n');
  
  const queue = new QueueDuplex();
  
  // Producer: Write to queue
  console.log('Producing items...');
  for (let i = 1; i <= 5; i++) {
    queue.write({ id: i, task: `Task ${i}` });
  }
  
  // Consumer: Read from queue
  console.log('\nConsuming items...');
  for (let i = 0; i < 5; i++) {
    const item = queue.read();
    if (item) {
      console.log(`  Dequeued: ${JSON.stringify(item)}`);
    }
  }
  
  queue.end();
  
  return new Promise((resolve) => queue.on('finish', resolve));
}

// ============================================
// EXAMPLE 4: Bidirectional Transform
// ============================================

class BidirectionalTransform extends Duplex {
  constructor() {
    super();
  }
  
  _write(chunk, encoding, callback) {
    // Transform incoming data to uppercase
    const transformed = chunk.toString().toUpperCase();
    console.log(`  Write side: ${chunk.toString().trim()} → ${transformed.trim()}`);
    
    // Immediately make it available for reading
    this.push(transformed);
    callback();
  }
  
  _read() {
    // Reading is handled by _write pushing data
  }
}

async function example4_BidirectionalTransform() {
  console.log('\n=== Example 4: Bidirectional Transform ===\n');
  
  const transform = new BidirectionalTransform();
  
  transform.on('data', (chunk) => {
    console.log(`  Read side: ${chunk.toString().trim()}`);
  });
  
  transform.write('hello\n');
  transform.write('world\n');
  transform.end('goodbye\n');
  
  return new Promise((resolve) => transform.on('finish', resolve));
}

// ============================================
// EXAMPLE 5: Custom Protocol Stream
// ============================================

class ProtocolStream extends Duplex {
  constructor() {
    super({ objectMode: true });
    this.buffer = '';
  }
  
  // Incoming data (raw bytes)
  _write(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    
    // Parse complete messages (newline-delimited)
    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const message = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);
      
      try {
        // Parse JSON protocol
        const parsed = JSON.parse(message);
        console.log(`  Received message: ${parsed.type} - ${parsed.data}`);
        
        // Process and respond
        const response = this.processMessage(parsed);
        if (response) {
          this.push(response);
        }
      } catch (err) {
        console.error(`  Error parsing message: ${err.message}`);
      }
    }
    
    callback();
  }
  
  // Outgoing data (objects)
  _read() {
    // Data is pushed in _write
  }
  
  processMessage(message) {
    switch (message.type) {
      case 'ping':
        return { type: 'pong', timestamp: Date.now() };
      case 'echo':
        return { type: 'echo-response', data: message.data };
      case 'uppercase':
        return { type: 'result', data: message.data.toUpperCase() };
      default:
        return { type: 'error', message: 'Unknown message type' };
    }
  }
}

async function example5_CustomProtocol() {
  console.log('\n=== Example 5: Custom Protocol Stream ===\n');
  
  const protocol = new ProtocolStream();
  
  protocol.on('data', (response) => {
    console.log(`  Response: ${JSON.stringify(response)}`);
  });
  
  // Send messages
  protocol.write(JSON.stringify({ type: 'ping' }) + '\n');
  protocol.write(JSON.stringify({ type: 'echo', data: 'Hello!' }) + '\n');
  protocol.write(JSON.stringify({ type: 'uppercase', data: 'make me loud' }) + '\n');
  protocol.end();
  
  return new Promise((resolve) => protocol.on('finish', resolve));
}

// ============================================
// EXAMPLE 6: Chat Room (Multiple Duplexes)
// ============================================

class ChatRoom extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
  }
  
  join(client) {
    this.clients.add(client);
    this.broadcast(`${client.name} joined the room`, client);
  }
  
  leave(client) {
    this.clients.delete(client);
    this.broadcast(`${client.name} left the room`, client);
  }
  
  broadcast(message, sender) {
    for (const client of this.clients) {
      if (client !== sender) {
        client.stream.write(`${message}\n`);
      }
    }
  }
  
  sendMessage(message, sender) {
    this.broadcast(`${sender.name}: ${message}`, sender);
  }
}

class ChatClient {
  constructor(name, room) {
    this.name = name;
    this.room = room;
    this.stream = new Duplex({
      write: (chunk, encoding, callback) => {
        const message = chunk.toString().trim();
        if (message) {
          this.room.sendMessage(message, this);
        }
        callback();
      },
      read: () => {}
    });
    
    this.stream.on('data', (chunk) => {
      console.log(`  [${this.name}] received: ${chunk.toString().trim()}`);
    });
  }
  
  send(message) {
    this.stream.write(message + '\n');
  }
}

async function example6_ChatRoom() {
  console.log('\n=== Example 6: Chat Room ===\n');
  
  const room = new ChatRoom();
  
  const alice = new ChatClient('Alice', room);
  const bob = new ChatClient('Bob', room);
  const charlie = new ChatClient('Charlie', room);
  
  room.join(alice);
  room.join(bob);
  room.join(charlie);
  
  // Simulate chat
  await new Promise(resolve => setTimeout(resolve, 50));
  alice.send('Hello everyone!');
  
  await new Promise(resolve => setTimeout(resolve, 50));
  bob.send('Hi Alice!');
  
  await new Promise(resolve => setTimeout(resolve, 50));
  charlie.send('Hey there!');
  
  await new Promise(resolve => setTimeout(resolve, 50));
  room.leave(bob);
  
  await new Promise(resolve => setTimeout(resolve, 50));
  alice.send('Where did Bob go?');
  
  await new Promise(resolve => setTimeout(resolve, 100));
}

// ============================================
// EXAMPLE 7: Request-Response Pattern
// ============================================

class RequestResponseDuplex extends Duplex {
  constructor() {
    super({ objectMode: true });
    this.pendingRequests = new Map();
    this.requestId = 0;
  }
  
  // Send request
  _write(request, encoding, callback) {
    const id = ++this.requestId;
    const requestWithId = { ...request, id };
    
    console.log(`  → Request ${id}: ${request.method}`);
    
    // Simulate async processing
    setTimeout(() => {
      const response = this.handleRequest(requestWithId);
      this.push(response);
    }, 50);
    
    callback();
  }
  
  // Receive response
  _read() {
    // Data is pushed when response is ready
  }
  
  handleRequest(request) {
    switch (request.method) {
      case 'add':
        return {
          id: request.id,
          result: request.params.a + request.params.b
        };
      case 'multiply':
        return {
          id: request.id,
          result: request.params.a * request.params.b
        };
      default:
        return {
          id: request.id,
          error: 'Unknown method'
        };
    }
  }
}

async function example7_RequestResponse() {
  console.log('\n=== Example 7: Request-Response Pattern ===\n');
  
  const rpc = new RequestResponseDuplex();
  
  rpc.on('data', (response) => {
    if (response.error) {
      console.log(`  ← Response ${response.id}: Error - ${response.error}`);
    } else {
      console.log(`  ← Response ${response.id}: ${response.result}`);
    }
  });
  
  // Send requests
  rpc.write({ method: 'add', params: { a: 5, b: 3 } });
  rpc.write({ method: 'multiply', params: { a: 4, b: 7 } });
  rpc.write({ method: 'unknown', params: {} });
  rpc.end();
  
  return new Promise((resolve) => {
    setTimeout(resolve, 200);
  });
}

// ============================================
// EXAMPLE 8: Buffered Duplex Stream
// ============================================

class BufferedDuplex extends Duplex {
  constructor(options) {
    super(options);
    this.writeBuffer = [];
    this.readBuffer = [];
    this.writeClosed = false;
  }
  
  _write(chunk, encoding, callback) {
    this.writeBuffer.push(chunk);
    console.log(`  Buffered write: ${chunk.toString().trim()} (Buffer: ${this.writeBuffer.length})`);
    
    // Auto-process buffer
    if (this.writeBuffer.length >= 3) {
      this.processBuffer();
    }
    
    callback();
  }
  
  _read() {
    if (this.readBuffer.length > 0) {
      this.push(this.readBuffer.shift());
    }
  }
  
  _final(callback) {
    this.writeClosed = true;
    this.processBuffer();
    callback();
  }
  
  processBuffer() {
    if (this.writeBuffer.length === 0) return;
    
    console.log(`  Processing ${this.writeBuffer.length} buffered items...`);
    
    // Combine and process
    const combined = Buffer.concat(this.writeBuffer);
    this.readBuffer.push(combined);
    this.writeBuffer = [];
    
    // Signal data is available
    this.emit('readable');
  }
}

async function example8_BufferedDuplex() {
  console.log('\n=== Example 8: Buffered Duplex ===\n');
  
  const buffered = new BufferedDuplex();
  
  buffered.on('readable', () => {
    let chunk;
    while ((chunk = buffered.read()) !== null) {
      console.log(`  Read processed: ${chunk.toString().trim()}`);
    }
  });
  
  buffered.write('Part 1\n');
  buffered.write('Part 2\n');
  buffered.write('Part 3\n'); // Triggers processing
  buffered.write('Part 4\n');
  buffered.end('Part 5\n'); // Final processing
  
  return new Promise((resolve) => {
    buffered.on('finish', resolve);
  });
}

// ============================================
// EXAMPLE 9: Proxy Stream
// ============================================

class ProxyDuplex extends Duplex {
  constructor(target) {
    super();
    this.target = target;
    this.bytesIn = 0;
    this.bytesOut = 0;
    
    // Forward data from target to readers
    target.on('data', (chunk) => {
      this.bytesOut += chunk.length;
      this.push(chunk);
    });
    
    target.on('end', () => {
      this.push(null);
    });
  }
  
  _write(chunk, encoding, callback) {
    this.bytesIn += chunk.length;
    this.target.write(chunk, callback);
  }
  
  _read() {
    // Data is pushed from target
  }
  
  _final(callback) {
    this.target.end(callback);
  }
  
  getStats() {
    return {
      bytesIn: this.bytesIn,
      bytesOut: this.bytesOut
    };
  }
}

async function example9_ProxyStream() {
  console.log('\n=== Example 9: Proxy Stream ===\n');
  
  // Create a simple echo duplex
  const echo = new Duplex({
    write(chunk, encoding, callback) {
      this.push(chunk);
      callback();
    },
    read() {}
  });
  
  // Wrap with proxy
  const proxy = new ProxyDuplex(echo);
  
  proxy.on('data', (chunk) => {
    console.log(`  Received: ${chunk.toString().trim()}`);
  });
  
  proxy.write('Test 1\n');
  proxy.write('Test 2\n');
  proxy.end('Test 3\n');
  
  await new Promise((resolve) => proxy.on('finish', resolve));
  
  const stats = proxy.getStats();
  console.log(`\n  Stats: ${stats.bytesIn} bytes in, ${stats.bytesOut} bytes out`);
}

// ============================================
// EXAMPLE 10: Stateful Connection
// ============================================

class StatefulConnection extends Duplex {
  constructor() {
    super({ objectMode: true });
    this.state = 'disconnected';
    this.messageQueue = [];
  }
  
  _write(message, encoding, callback) {
    if (this.state !== 'connected') {
      console.log(`  ⚠️  Cannot send: Not connected (state: ${this.state})`);
      callback(new Error('Not connected'));
      return;
    }
    
    console.log(`  → Sending: ${JSON.stringify(message)}`);
    
    // Simulate send and receive response
    setTimeout(() => {
      this.push({
        type: 'ack',
        originalMessage: message,
        timestamp: Date.now()
      });
    }, 50);
    
    callback();
  }
  
  _read() {
    // Data is pushed when responses arrive
  }
  
  connect() {
    console.log('  Connecting...');
    setTimeout(() => {
      this.state = 'connected';
      console.log('  ✅ Connected!');
      this.emit('connected');
    }, 100);
  }
  
  disconnect() {
    this.state = 'disconnected';
    console.log('  Disconnected');
  }
}

async function example10_StatefulConnection() {
  console.log('\n=== Example 10: Stateful Connection ===\n');
  
  const conn = new StatefulConnection();
  
  conn.on('data', (response) => {
    console.log(`  ← Received: ${JSON.stringify(response)}`);
  });
  
  // Try to send before connecting
  conn.write({ data: 'Too early' }, (err) => {
    if (err) console.log(`  Error: ${err.message}`);
  });
  
  // Connect and send
  conn.connect();
  
  await new Promise((resolve) => conn.once('connected', resolve));
  
  conn.write({ data: 'Message 1' });
  conn.write({ data: 'Message 2' });
  
  await new Promise(resolve => setTimeout(resolve, 150));
  
  conn.disconnect();
  conn.end();
}

// ============================================
// Run All Examples
// ============================================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Node.js Duplex Streams Examples     ║');
  console.log('╚════════════════════════════════════════╝');
  
  await example1_BasicDuplex();
  await example2_EchoServer();
  await example3_QueueDuplex();
  await example4_BidirectionalTransform();
  await example5_CustomProtocol();
  await example6_ChatRoom();
  await example7_RequestResponse();
  await example8_BufferedDuplex();
  await example9_ProxyStream();
  await example10_StatefulConnection();
  
  console.log('\n✅ All examples completed!\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  BasicDuplex,
  QueueDuplex,
  BidirectionalTransform,
  ProtocolStream,
  ChatRoom,
  ChatClient,
  RequestResponseDuplex,
  BufferedDuplex,
  ProxyDuplex,
  StatefulConnection
};
