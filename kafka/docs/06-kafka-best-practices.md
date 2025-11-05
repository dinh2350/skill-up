# Kafka Best Practices and Patterns

## Table of Contents
- [Design Patterns](#design-patterns)
- [Performance Optimization](#performance-optimization)
- [Reliability and Fault Tolerance](#reliability-and-fault-tolerance)
- [Monitoring and Observability](#monitoring-and-observability)
- [Security Best Practices](#security-best-practices)
- [Operational Best Practices](#operational-best-practices)
- [Common Pitfalls](#common-pitfalls)
- [Production Checklist](#production-checklist)

## Design Patterns

### 1. Event Sourcing

Store all changes as a sequence of events.

**Benefits:**
- Complete audit trail
- Time travel (replay events)
- Easy debugging

**Implementation:**
```javascript
// Event Store
class EventStore {
  constructor(kafkaProducer) {
    this.producer = kafkaProducer;
  }
  
  async appendEvent(aggregateId, event) {
    await this.producer.send({
      topic: 'event-store',
      messages: [{
        key: aggregateId,
        value: JSON.stringify({
          aggregateId,
          eventType: event.type,
          data: event.data,
          timestamp: new Date().toISOString(),
          version: event.version
        })
      }]
    });
  }
}

// Rebuild state from events
async function rebuildAggregate(aggregateId) {
  const events = await fetchEventsForAggregate(aggregateId);
  let state = {};
  
  for (const event of events) {
    state = applyEvent(state, event);
  }
  
  return state;
}
```

### 2. CQRS (Command Query Responsibility Segregation)

Separate read and write models.

```javascript
// Write side (Command)
class OrderCommandService {
  async createOrder(command) {
    // Validate command
    const order = this.validateAndCreate(command);
    
    // Publish event
    await this.producer.send({
      topic: 'order-commands',
      messages: [{
        value: JSON.stringify({
          commandType: 'CreateOrder',
          data: order
        })
      }]
    });
  }
}

// Read side (Query)
class OrderQueryService {
  constructor() {
    this.readModel = new Map();
  }
  
  // Subscribe to events and update read model
  async handleOrderCreated(event) {
    this.readModel.set(event.orderId, {
      id: event.orderId,
      status: 'created',
      items: event.items,
      total: event.total
    });
  }
  
  // Fast queries from read model
  getOrder(orderId) {
    return this.readModel.get(orderId);
  }
  
  getOrdersByUser(userId) {
    return Array.from(this.readModel.values())
      .filter(order => order.userId === userId);
  }
}
```

### 3. Saga Pattern

Manage distributed transactions.

```javascript
class OrderSaga {
  constructor(producer) {
    this.producer = producer;
  }
  
  async executeOrderSaga(order) {
    try {
      // Step 1: Reserve inventory
      await this.reserveInventory(order);
      
      // Step 2: Process payment
      await this.processPayment(order);
      
      // Step 3: Ship order
      await this.shipOrder(order);
      
      // Success: Publish completion event
      await this.producer.send({
        topic: 'order-saga-events',
        messages: [{
          value: JSON.stringify({
            sagaId: order.id,
            status: 'completed'
          })
        }]
      });
    } catch (error) {
      // Compensate: Rollback steps
      await this.compensate(order, error);
    }
  }
  
  async compensate(order, error) {
    // Rollback in reverse order
    await this.cancelShipment(order);
    await this.refundPayment(order);
    await this.releaseInventory(order);
    
    await this.producer.send({
      topic: 'order-saga-events',
      messages: [{
        value: JSON.stringify({
          sagaId: order.id,
          status: 'compensated',
          reason: error.message
        })
      }]
    });
  }
}
```

### 4. Outbox Pattern

Ensure reliable event publishing with database transactions.

```javascript
class OutboxPattern {
  async createOrderWithOutbox(orderData) {
    const transaction = await this.db.beginTransaction();
    
    try {
      // 1. Insert order in database
      const order = await this.orderRepository.create(orderData, transaction);
      
      // 2. Insert event in outbox table
      await this.outboxRepository.create({
        aggregateId: order.id,
        eventType: 'OrderCreated',
        payload: JSON.stringify(order),
        createdAt: new Date()
      }, transaction);
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  // Background job to publish outbox events
  async publishOutboxEvents() {
    const events = await this.outboxRepository.findUnpublished();
    
    for (const event of events) {
      try {
        await this.producer.send({
          topic: 'order-events',
          messages: [{
            key: event.aggregateId,
            value: event.payload
          }]
        });
        
        await this.outboxRepository.markAsPublished(event.id);
      } catch (error) {
        console.error('Failed to publish event:', error);
      }
    }
  }
}
```

### 5. Dead Letter Queue Pattern

Handle failed messages.

```javascript
class MessageProcessor {
  constructor(producer, maxRetries = 3) {
    this.producer = producer;
    this.maxRetries = maxRetries;
  }
  
  async processMessage(message) {
    const retryCount = this.getRetryCount(message);
    
    try {
      await this.handleMessage(message);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        // Retry with backoff
        await this.retryMessage(message, retryCount + 1);
      } else {
        // Send to DLQ
        await this.sendToDeadLetterQueue(message, error);
      }
    }
  }
  
  async retryMessage(message, retryCount) {
    const delay = Math.pow(2, retryCount) * 1000;
    
    await this.producer.send({
      topic: 'retry-topic',
      messages: [{
        key: message.key,
        value: message.value,
        headers: {
          ...message.headers,
          retryCount: retryCount.toString(),
          retryAfter: (Date.now() + delay).toString()
        }
      }]
    });
  }
  
  async sendToDeadLetterQueue(message, error) {
    await this.producer.send({
      topic: 'dlq-topic',
      messages: [{
        key: message.key,
        value: message.value,
        headers: {
          ...message.headers,
          errorMessage: error.message,
          errorStack: error.stack,
          failedAt: new Date().toISOString()
        }
      }]
    });
  }
  
  getRetryCount(message) {
    return parseInt(message.headers?.retryCount || '0');
  }
}
```

### 6. Idempotent Consumer Pattern

Handle duplicate messages safely.

```javascript
class IdempotentConsumer {
  constructor() {
    this.processedMessages = new Set();
  }
  
  async processMessage(message) {
    const messageId = this.getMessageId(message);
    
    // Check if already processed
    if (await this.isProcessed(messageId)) {
      console.log(`Message ${messageId} already processed, skipping`);
      return;
    }
    
    try {
      // Process message
      await this.handleMessage(message);
      
      // Mark as processed
      await this.markAsProcessed(messageId);
    } catch (error) {
      console.error('Processing failed:', error);
      throw error;
    }
  }
  
  getMessageId(message) {
    // Use message offset + partition as unique ID
    return `${message.topic}-${message.partition}-${message.offset}`;
  }
  
  async isProcessed(messageId) {
    // Check in cache or database
    return this.processedMessages.has(messageId) ||
           await this.db.exists('processed_messages', messageId);
  }
  
  async markAsProcessed(messageId) {
    this.processedMessages.add(messageId);
    await this.db.insert('processed_messages', {
      id: messageId,
      processedAt: new Date()
    });
  }
}
```

## Performance Optimization

### 1. Producer Optimization

```javascript
const producer = kafka.producer({
  // Increase batch size for better throughput
  'batch.size': 32768,  // 32KB
  
  // Wait longer to fill batches
  'linger.ms': 100,
  
  // Enable compression
  compression: CompressionTypes.Snappy,
  
  // Allow more in-flight requests
  'max.in.flight.requests.per.connection': 5,
  
  // Larger buffer
  'buffer.memory': 67108864,  // 64MB
  
  // Enable idempotence
  idempotent: true
});
```

### 2. Consumer Optimization

```javascript
const consumer = kafka.consumer({
  groupId: 'my-group',
  
  // Increase fetch size
  maxBytesPerPartition: 2097152,  // 2MB
  minBytes: 1024,
  maxWaitTimeInMs: 100,
  
  // Process multiple partitions concurrently
  partitionsConsumedConcurrently: 5,
  
  // Larger session timeout
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  
  // Increase poll records
  maxPollRecords: 1000
});

// Batch processing
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, commitOffsetsIfNecessary }) => {
    // Process messages in parallel
    await Promise.all(
      batch.messages.map(async (message) => {
        await processMessage(message);
        resolveOffset(message.offset);
      })
    );
    
    await commitOffsetsIfNecessary();
  }
});
```

### 3. Topic Configuration

```bash
# Create topic with optimal settings
kafka-topics.sh --create \
  --topic high-throughput-topic \
  --bootstrap-server localhost:9092 \
  --partitions 12 \
  --replication-factor 3 \
  --config compression.type=snappy \
  --config min.insync.replicas=2 \
  --config retention.ms=604800000 \
  --config segment.ms=3600000
```

### 4. Connection Pooling

```javascript
// Singleton pattern for producer
class ProducerPool {
  static instance = null;
  
  static getInstance() {
    if (!ProducerPool.instance) {
      ProducerPool.instance = kafka.producer({
        // configuration
      });
    }
    return ProducerPool.instance;
  }
}

// Reuse producer across application
const producer = ProducerPool.getInstance();
```

### 5. Message Compression

```javascript
// Compare compression types
const compressionTests = [
  { type: CompressionTypes.None, name: 'None' },
  { type: CompressionTypes.GZIP, name: 'GZIP' },
  { type: CompressionTypes.Snappy, name: 'Snappy' },
  { type: CompressionTypes.LZ4, name: 'LZ4' },
  { type: CompressionTypes.ZSTD, name: 'ZSTD' }
];

for (const test of compressionTests) {
  const startTime = Date.now();
  
  await producer.send({
    topic: 'test-topic',
    compression: test.type,
    messages: largeMessages
  });
  
  const duration = Date.now() - startTime;
  console.log(`${test.name}: ${duration}ms`);
}
```

## Reliability and Fault Tolerance

### 1. Replication Configuration

```javascript
// Producer with strong durability
const producer = kafka.producer({
  acks: 'all',  // Wait for all in-sync replicas
  idempotent: true,
  maxInFlightRequests: 5,
  transactionTimeout: 60000
});

// Topic configuration
// min.insync.replicas=2 (at least 2 replicas must acknowledge)
// replication.factor=3 (data replicated to 3 brokers)
```

### 2. Error Handling Strategy

```javascript
class RobustConsumer {
  async processWithRetry(message, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.processMessage(message);
        return;
      } catch (error) {
        lastError = error;
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
        await this.sleep(delay);
      }
    }
    
    // All retries failed
    await this.handleFailure(message, lastError);
  }
  
  async handleFailure(message, error) {
    // Log error
    console.error('Message processing failed:', error);
    
    // Send to DLQ
    await this.sendToDLQ(message, error);
    
    // Alert ops team
    await this.sendAlert({
      severity: 'error',
      message: 'Consumer processing failure',
      details: { message, error }
    });
  }
}
```

### 3. Circuit Breaker

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000;
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}
```

### 4. Health Checks

```javascript
class KafkaHealthCheck {
  constructor(producer, consumer, admin) {
    this.producer = producer;
    this.consumer = consumer;
    this.admin = admin;
  }
  
  async check() {
    const health = {
      kafka: {
        status: 'healthy',
        producer: 'unknown',
        consumer: 'unknown',
        brokers: []
      }
    };
    
    try {
      // Check brokers
      const cluster = await this.admin.describeCluster();
      health.kafka.brokers = cluster.brokers.map(b => ({
        nodeId: b.nodeId,
        host: b.host,
        port: b.port
      }));
      
      // Check producer
      health.kafka.producer = 'connected';
      
      // Check consumer
      const groups = await this.admin.listGroups();
      health.kafka.consumer = groups.groups.length > 0 ? 'active' : 'inactive';
      
    } catch (error) {
      health.kafka.status = 'unhealthy';
      health.kafka.error = error.message;
    }
    
    return health;
  }
}
```

## Monitoring and Observability

### 1. Metrics Collection

```javascript
class KafkaMetrics {
  constructor() {
    this.metrics = {
      messagesProduced: 0,
      messagesConsumed: 0,
      producerErrors: 0,
      consumerErrors: 0,
      avgProcessingTime: 0,
      lagByPartition: new Map()
    };
  }
  
  recordProduced() {
    this.metrics.messagesProduced++;
  }
  
  recordConsumed(processingTime) {
    this.metrics.messagesConsumed++;
    this.updateAvgProcessingTime(processingTime);
  }
  
  recordProducerError() {
    this.metrics.producerErrors++;
  }
  
  recordConsumerError() {
    this.metrics.consumerErrors++;
  }
  
  updateLag(partition, lag) {
    this.metrics.lagByPartition.set(partition, lag);
  }
  
  updateAvgProcessingTime(time) {
    const { messagesConsumed, avgProcessingTime } = this.metrics;
    this.metrics.avgProcessingTime = 
      (avgProcessingTime * (messagesConsumed - 1) + time) / messagesConsumed;
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      lagByPartition: Object.fromEntries(this.metrics.lagByPartition)
    };
  }
}

// Usage with consumer
const metrics = new KafkaMetrics();

await consumer.run({
  eachMessage: async ({ message }) => {
    const startTime = Date.now();
    
    try {
      await processMessage(message);
      const processingTime = Date.now() - startTime;
      metrics.recordConsumed(processingTime);
    } catch (error) {
      metrics.recordConsumerError();
    }
  }
});
```

### 2. Logging Best Practices

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'kafka-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Structured logging
logger.info('Message processed', {
  topic: message.topic,
  partition: message.partition,
  offset: message.offset,
  key: message.key,
  processingTime: 125,
  timestamp: new Date().toISOString()
});
```

### 3. Consumer Lag Monitoring

```javascript
class LagMonitor {
  constructor(admin, groupId) {
    this.admin = admin;
    this.groupId = groupId;
  }
  
  async getConsumerLag() {
    const groupOffsets = await this.admin.fetchOffsets({
      groupId: this.groupId
    });
    
    const lag = [];
    
    for (const topic of groupOffsets) {
      for (const partition of topic.partitions) {
        const topicOffsets = await this.admin.fetchTopicOffsets(topic.topic);
        const topicPartition = topicOffsets.find(
          p => p.partition === partition.partition
        );
        
        const consumerOffset = parseInt(partition.offset);
        const highWaterMark = parseInt(topicPartition.high);
        const currentLag = highWaterMark - consumerOffset;
        
        lag.push({
          topic: topic.topic,
          partition: partition.partition,
          currentOffset: consumerOffset,
          highWaterMark: highWaterMark,
          lag: currentLag
        });
      }
    }
    
    return lag;
  }
  
  async alertOnHighLag(threshold = 1000) {
    const lag = await this.getConsumerLag();
    const highLag = lag.filter(l => l.lag > threshold);
    
    if (highLag.length > 0) {
      console.error('High lag detected:', highLag);
      // Send alert
    }
  }
}
```

### 4. Distributed Tracing

```javascript
const { trace, context } = require('@opentelemetry/api');

class TracedProducer {
  async send(topic, message) {
    const span = trace.getTracer('kafka').startSpan('kafka.produce');
    span.setAttribute('messaging.system', 'kafka');
    span.setAttribute('messaging.destination', topic);
    
    try {
      const result = await this.producer.send({
        topic,
        messages: [{
          value: JSON.stringify(message),
          headers: {
            traceparent: this.getTraceContext()
          }
        }]
      });
      
      span.setStatus({ code: 0 });
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }
  
  getTraceContext() {
    const ctx = context.active();
    return trace.getSpan(ctx)?.spanContext().traceId || '';
  }
}
```

## Security Best Practices

### 1. SSL/TLS Configuration

```javascript
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['kafka:9093'],
  ssl: {
    rejectUnauthorized: true,
    ca: [fs.readFileSync('./ca-cert.pem', 'utf-8')],
    key: fs.readFileSync('./client-key.pem', 'utf-8'),
    cert: fs.readFileSync('./client-cert.pem', 'utf-8')
  }
});
```

### 2. SASL Authentication

```javascript
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['kafka:9093'],
  ssl: true,
  sasl: {
    mechanism: 'plain',  // or 'scram-sha-256', 'scram-sha-512'
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  }
});
```

### 3. Message Encryption

```javascript
const crypto = require('crypto');

class MessageEncryption {
  constructor(encryptionKey) {
    this.algorithm = 'aes-256-gcm';
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }
  
  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}
```

### 4. Access Control

```javascript
// Producer with ACLs
const producer = kafka.producer({
  // Only produce to specific topics
  allowAutoTopicCreation: false
});

// Validate topic access before sending
async function secureSend(topic, message) {
  const allowedTopics = ['user-events', 'order-events'];
  
  if (!allowedTopics.includes(topic)) {
    throw new Error(`Not authorized to write to topic: ${topic}`);
  }
  
  await producer.send({ topic, messages: [message] });
}
```

## Operational Best Practices

### 1. Topic Naming Convention

```
<domain>.<entity>.<event-type>
Examples:
- user.profile.updated
- order.payment.completed
- inventory.stock.reduced

DLQ:
- user.profile.updated.dlq
- order.payment.completed.dlq
```

### 2. Message Schema Evolution

```javascript
// Use schema versioning
const message = {
  schemaVersion: 2,
  data: {
    // v2 fields
  }
};

// Handle multiple versions
function processMessage(message) {
  switch (message.schemaVersion) {
    case 1:
      return processV1(message.data);
    case 2:
      return processV2(message.data);
    default:
      throw new Error(`Unknown schema version: ${message.schemaVersion}`);
  }
}
```

### 3. Graceful Shutdown

```javascript
class GracefulShutdown {
  constructor(consumer, producer) {
    this.consumer = consumer;
    this.producer = producer;
    this.isShuttingDown = false;
  }
  
  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    console.log('Shutting down gracefully...');
    
    // Stop accepting new messages
    await this.consumer.pause(
      this.consumer.assignment().map(({ topic, partition }) => ({
        topic,
        partitions: [partition]
      }))
    );
    
    // Wait for in-flight processing
    await this.waitForInflightProcessing();
    
    // Disconnect
    await this.consumer.disconnect();
    await this.producer.disconnect();
    
    console.log('Shutdown complete');
    process.exit(0);
  }
  
  async waitForInflightProcessing(timeout = 30000) {
    const start = Date.now();
    while (this.hasInflightMessages() && Date.now() - start < timeout) {
      await this.sleep(100);
    }
  }
}

// Register shutdown handlers
const gracefulShutdown = new GracefulShutdown(consumer, producer);
process.on('SIGTERM', () => gracefulShutdown.shutdown());
process.on('SIGINT', () => gracefulShutdown.shutdown());
```

### 4. Deployment Strategy

```yaml
# Blue-Green Deployment
# 1. Deploy new version (green)
# 2. New consumers join group
# 3. Partitions rebalance
# 4. Old consumers (blue) shut down gracefully

apiVersion: apps/v1
kind: Deployment
metadata:
  name: consumer-green
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: consumer
        image: consumer:v2
        env:
        - name: KAFKA_GROUP_ID
          value: "my-consumer-group"
```

## Common Pitfalls

### 1. Not Handling Rebalances

❌ **Bad:**
```javascript
let cache = new Map();

consumer.run({
  eachMessage: async ({ message }) => {
    cache.set(message.key, message.value);
  }
});
// Cache lost during rebalance!
```

✅ **Good:**
```javascript
consumer.on('consumer.group_join', () => {
  // Reload cache or clear state
  cache.clear();
});
```

### 2. Blocking the Event Loop

❌ **Bad:**
```javascript
consumer.run({
  eachMessage: async ({ message }) => {
    // Synchronous heavy computation blocks other messages
    heavyComputation(message);
  }
});
```

✅ **Good:**
```javascript
consumer.run({
  eachBatch: async ({ batch }) => {
    await Promise.all(
      batch.messages.map(msg => processAsync(msg))
    );
  }
});
```

### 3. Not Committing Offsets

❌ **Bad:**
```javascript
consumer.run({
  autoCommit: false,
  eachMessage: async ({ message }) => {
    await processMessage(message);
    // Forgot to commit!
  }
});
```

✅ **Good:**
```javascript
consumer.run({
  autoCommit: false,
  eachMessage: async ({ message, heartbeat }) => {
    await processMessage(message);
    await consumer.commitOffsets([{
      topic: message.topic,
      partition: message.partition,
      offset: (Number(message.offset) + 1).toString()
    }]);
    await heartbeat();
  }
});
```

### 4. Creating Too Many Producers/Consumers

❌ **Bad:**
```javascript
async function sendMessage(topic, message) {
  const producer = kafka.producer();
  await producer.connect();
  await producer.send({ topic, messages: [message] });
  await producer.disconnect();
}
```

✅ **Good:**
```javascript
const producer = kafka.producer();
await producer.connect();

async function sendMessage(topic, message) {
  await producer.send({ topic, messages: [message] });
}
```

## Production Checklist

### Pre-Deployment

- [ ] Configure appropriate replication factor (3+ for production)
- [ ] Set min.insync.replicas (at least 2)
- [ ] Configure retention policies
- [ ] Set up monitoring and alerting
- [ ] Implement health checks
- [ ] Configure SSL/TLS
- [ ] Set up SASL authentication
- [ ] Define topic naming conventions
- [ ] Implement dead letter queues
- [ ] Configure log aggregation
- [ ] Set up distributed tracing
- [ ] Test disaster recovery procedures

### Deployment

- [ ] Gradual rollout (canary/blue-green)
- [ ] Monitor consumer lag
- [ ] Watch error rates
- [ ] Check resource utilization
- [ ] Verify rebalancing
- [ ] Test graceful shutdown

### Post-Deployment

- [ ] Monitor throughput
- [ ] Track latency
- [ ] Check partition distribution
- [ ] Review error logs
- [ ] Verify backup procedures
- [ ] Document runbooks
- [ ] Conduct post-mortem if issues

### Operational

- [ ] Regular cluster health checks
- [ ] Monitor disk usage
- [ ] Track broker performance
- [ ] Review consumer lag trends
- [ ] Audit security configurations
- [ ] Update documentation
- [ ] Conduct disaster recovery drills
- [ ] Optimize performance based on metrics

## Additional Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Best Practices](https://www.confluent.io/blog/category/best-practices/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Kafka Patterns](https://www.enterpriseintegrationpatterns.com/)

---

**Related Documents:**
- [Fundamentals](./01-kafka-fundamentals.md)
- [Installation](./02-kafka-installation-setup.md)
- [Producers](./03-kafka-producers.md)
- [Consumers](./04-kafka-consumers.md)
- [Node.js/NestJS Integration](./05-kafka-nodejs-nestjs.md)
