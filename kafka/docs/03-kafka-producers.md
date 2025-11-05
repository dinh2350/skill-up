# Kafka Producers Guide

## Table of Contents
- [Producer Overview](#producer-overview)
- [Producer Configuration](#producer-configuration)
- [Message Production Patterns](#message-production-patterns)
- [Partitioning Strategies](#partitioning-strategies)
- [Delivery Guarantees](#delivery-guarantees)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Code Examples](#code-examples)

## Producer Overview

A Kafka producer is an application that publishes messages to Kafka topics. Producers are responsible for:
- Serializing data
- Determining the target partition
- Sending data to the appropriate broker
- Handling retries and errors

### Producer Workflow

```
Application Data
      ↓
[Serialization] → Convert data to bytes
      ↓
[Partitioner] → Determine target partition
      ↓
[Compression] → Compress batch (optional)
      ↓
[Buffer/Batch] → Accumulate messages
      ↓
[Network Send] → Send to broker
      ↓
[Acknowledgment] → Receive confirmation
```

## Producer Configuration

### Essential Configuration Properties

```javascript
const producerConfig = {
  // Required: Kafka broker addresses
  'bootstrap.servers': 'localhost:9092',
  
  // Serializers
  'key.serializer': 'org.apache.kafka.common.serialization.StringSerializer',
  'value.serializer': 'org.apache.kafka.common.serialization.StringSerializer',
  
  // Acknowledgments (0, 1, all/-1)
  'acks': 'all',
  
  // Retries
  'retries': 3,
  'retry.backoff.ms': 100,
  
  // Batching
  'batch.size': 16384,  // 16KB
  'linger.ms': 10,
  
  // Compression
  'compression.type': 'snappy',  // none, gzip, snappy, lz4, zstd
  
  // Buffer memory
  'buffer.memory': 33554432,  // 32MB
  
  // Request timeout
  'request.timeout.ms': 30000,
  
  // Idempotence (exactly-once semantics)
  'enable.idempotence': true,
  
  // Max in-flight requests
  'max.in.flight.requests.per.connection': 5,
  
  // Client ID for identification
  'client.id': 'my-producer-app'
};
```

### Configuration Deep Dive

#### 1. Acknowledgments (`acks`)

Controls durability and reliability:

```javascript
// acks=0: Fire and forget (no acknowledgment)
// Fastest but least reliable
'acks': '0'

// acks=1: Leader acknowledgment only
// Balance between performance and reliability
'acks': '1'

// acks=all or acks=-1: All in-sync replicas acknowledge
// Slowest but most reliable
'acks': 'all'
```

**Trade-offs:**
| acks | Latency | Durability | Use Case |
|------|---------|------------|----------|
| 0 | Lowest | None | Metrics, logs (loss acceptable) |
| 1 | Medium | Medium | General use cases |
| all | Highest | Highest | Financial, critical data |

#### 2. Batching Configuration

```javascript
// batch.size: Max bytes per batch
'batch.size': 16384,  // 16KB

// linger.ms: Wait time to fill batch
// 0 = send immediately
// Higher value = better throughput, higher latency
'linger.ms': 10,

// max.request.size: Max size of a single request
'max.request.size': 1048576  // 1MB
```

#### 3. Compression

Reduces network bandwidth and storage:

```javascript
// Options: none, gzip, snappy, lz4, zstd
'compression.type': 'snappy'
```

**Compression Comparison:**
| Type | Speed | Ratio | CPU Usage | Best For |
|------|-------|-------|-----------|----------|
| none | Fastest | 1:1 | Lowest | Small messages |
| lz4 | Very Fast | Good | Low | General purpose |
| snappy | Fast | Good | Low | General purpose |
| gzip | Medium | Better | Medium | High compression needs |
| zstd | Medium | Best | Medium | Best compression ratio |

#### 4. Idempotence

Prevents duplicate messages:

```javascript
'enable.idempotence': true,

// Required settings when idempotence is enabled:
'acks': 'all',
'max.in.flight.requests.per.connection': 5,
'retries': Integer.MAX_VALUE
```

## Message Production Patterns

### 1. Fire-and-Forget

Send messages without waiting for acknowledgment.

**Node.js (KafkaJS):**
```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

async function fireAndForget() {
  await producer.connect();
  
  // Don't wait for response
  producer.send({
    topic: 'user-events',
    messages: [
      { key: 'user1', value: 'User logged in' }
    ]
  }).catch(console.error);
  
  console.log('Message sent (fire and forget)');
}
```

**Java:**
```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("acks", "0");

Producer<String, String> producer = new KafkaProducer<>(props);

ProducerRecord<String, String> record = 
    new ProducerRecord<>("user-events", "user1", "User logged in");

// Fire and forget
producer.send(record);
```

### 2. Synchronous Send

Wait for acknowledgment before continuing.

**Node.js (KafkaJS):**
```javascript
async function synchronousSend() {
  await producer.connect();
  
  try {
    const metadata = await producer.send({
      topic: 'user-events',
      messages: [
        { 
          key: 'user1', 
          value: JSON.stringify({ 
            userId: 'user1', 
            action: 'login',
            timestamp: new Date().toISOString()
          })
        }
      ]
    });
    
    console.log('Message sent successfully:', metadata);
    // metadata contains: topicName, partition, errorCode, offset, timestamp
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}
```

**Java:**
```java
try {
    RecordMetadata metadata = producer.send(record).get();
    System.out.println("Message sent to partition " + 
                       metadata.partition() + 
                       " with offset " + 
                       metadata.offset());
} catch (ExecutionException | InterruptedException e) {
    System.err.println("Failed to send message: " + e.getMessage());
}
```

### 3. Asynchronous with Callback

Send messages asynchronously with callback for handling results.

**Node.js (KafkaJS):**
```javascript
async function asyncWithCallback() {
  await producer.connect();
  
  const messages = [
    { key: 'user1', value: 'Event 1' },
    { key: 'user2', value: 'Event 2' },
    { key: 'user3', value: 'Event 3' }
  ];
  
  // Send multiple messages asynchronously
  const promises = messages.map(message =>
    producer.send({
      topic: 'user-events',
      messages: [message]
    })
    .then(metadata => {
      console.log(`✓ Sent: ${message.key} -> Partition ${metadata[0].partition}`);
      return metadata;
    })
    .catch(error => {
      console.error(`✗ Failed: ${message.key} -> ${error.message}`);
      throw error;
    })
  );
  
  await Promise.all(promises);
}
```

**Java:**
```java
producer.send(record, new Callback() {
    @Override
    public void onCompletion(RecordMetadata metadata, Exception exception) {
        if (exception == null) {
            System.out.println("Message sent successfully: " +
                             "partition=" + metadata.partition() +
                             ", offset=" + metadata.offset());
        } else {
            System.err.println("Failed to send message: " + exception.getMessage());
        }
    }
});
```

### 4. Batch Production

Send multiple messages efficiently.

**Node.js (KafkaJS):**
```javascript
async function batchProduction() {
  await producer.connect();
  
  const messages = [];
  for (let i = 0; i < 1000; i++) {
    messages.push({
      key: `key-${i}`,
      value: JSON.stringify({
        id: i,
        timestamp: Date.now(),
        data: `Message ${i}`
      })
    });
  }
  
  // Send in batches
  const batchSize = 100;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    await producer.send({
      topic: 'events',
      messages: batch
    });
    console.log(`Sent batch ${i / batchSize + 1}`);
  }
}
```

### 5. Transactional Production

Ensure exactly-once semantics across multiple topics.

**Node.js (KafkaJS):**
```javascript
const producer = kafka.producer({
  transactionalId: 'my-transactional-producer',
  maxInFlightRequests: 1,
  idempotent: true
});

async function transactionalSend() {
  await producer.connect();
  
  const transaction = await producer.transaction();
  
  try {
    // Send to multiple topics atomically
    await transaction.send({
      topic: 'orders',
      messages: [{ key: 'order1', value: 'Order created' }]
    });
    
    await transaction.send({
      topic: 'inventory',
      messages: [{ key: 'item1', value: 'Stock reduced' }]
    });
    
    await transaction.send({
      topic: 'payments',
      messages: [{ key: 'payment1', value: 'Payment processed' }]
    });
    
    // Commit transaction
    await transaction.commit();
    console.log('Transaction committed successfully');
  } catch (error) {
    // Rollback on error
    await transaction.abort();
    console.error('Transaction aborted:', error);
  }
}
```

## Partitioning Strategies

### 1. Key-Based Partitioning (Default)

Messages with the same key go to the same partition.

```javascript
// All messages with key 'user123' go to the same partition
await producer.send({
  topic: 'user-events',
  messages: [
    { key: 'user123', value: 'login' },
    { key: 'user123', value: 'view_page' },
    { key: 'user123', value: 'logout' }
  ]
});
```

**Partition calculation:**
```
partition = hash(key) % number_of_partitions
```

### 2. Round-Robin Partitioning

When no key is provided, messages are distributed evenly.

```javascript
await producer.send({
  topic: 'logs',
  messages: [
    { value: 'Log entry 1' },  // No key -> round-robin
    { value: 'Log entry 2' },
    { value: 'Log entry 3' }
  ]
});
```

### 3. Custom Partitioner

Implement custom partitioning logic.

**Node.js (KafkaJS):**
```javascript
const producer = kafka.producer({
  createPartitioner: () => {
    return ({ topic, partitionMetadata, message }) => {
      // Custom logic: route based on message value
      const value = JSON.parse(message.value.toString());
      
      if (value.priority === 'high') {
        return 0;  // High priority -> partition 0
      } else if (value.priority === 'medium') {
        return 1;  // Medium priority -> partition 1
      } else {
        return 2;  // Low priority -> partition 2
      }
    };
  }
});
```

**Java:**
```java
public class CustomPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                        Object value, byte[] valueBytes,
                        Cluster cluster) {
        List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
        int numPartitions = partitions.size();
        
        // Custom logic
        if (key == null) {
            return ThreadLocalRandom.current().nextInt(numPartitions);
        }
        
        // VIP users go to partition 0
        if (key.toString().startsWith("vip-")) {
            return 0;
        }
        
        // Others use hash
        return Math.abs(Utils.murmur2(keyBytes)) % numPartitions;
    }
}
```

### 4. Explicit Partition Selection

Specify the partition directly.

```javascript
await producer.send({
  topic: 'events',
  messages: [
    { 
      partition: 0,  // Explicit partition
      value: 'Message for partition 0' 
    }
  ]
});
```

## Delivery Guarantees

### At-Most-Once (0 ≤ messages received ≤ 1)

**Configuration:**
```javascript
{
  'acks': '0',
  'retries': 0
}
```
- Fastest
- Messages may be lost
- No duplicates
- Use case: Metrics, logs

### At-Least-Once (1 ≤ messages received)

**Configuration:**
```javascript
{
  'acks': 'all',
  'retries': 3,
  'enable.idempotence': false
}
```
- Messages guaranteed to be delivered
- May have duplicates
- Use case: Most applications

### Exactly-Once (messages received = 1)

**Configuration:**
```javascript
{
  'acks': 'all',
  'retries': Integer.MAX_VALUE,
  'enable.idempotence': true,
  'transactional.id': 'unique-id'
}
```
- No message loss or duplicates
- Requires transactions
- Use case: Financial systems, critical data

## Error Handling

### Retriable Errors

Errors that can be retried:
- Network errors
- Leader not available
- Not enough replicas

```javascript
const producer = kafka.producer({
  retry: {
    initialRetryTime: 100,
    retries: 8,
    multiplier: 2,
    maxRetryTime: 30000
  }
});
```

### Non-Retriable Errors

Errors that cannot be retried:
- Message too large
- Invalid topic
- Serialization errors

```javascript
try {
  await producer.send({
    topic: 'events',
    messages: [{ value: data }]
  });
} catch (error) {
  if (error.name === 'KafkaJSNumberOfRetriesExceeded') {
    console.error('Max retries exceeded');
    // Handle accordingly (dead letter queue, alert, etc.)
  } else if (error.name === 'KafkaJSProtocolError') {
    console.error('Protocol error:', error.message);
    // Log and investigate
  }
}
```

### Dead Letter Queue Pattern

```javascript
async function sendWithDLQ(topic, message) {
  try {
    await producer.send({
      topic: topic,
      messages: [message]
    });
  } catch (error) {
    console.error(`Failed to send to ${topic}:`, error);
    
    // Send to dead letter queue
    await producer.send({
      topic: `${topic}.dlq`,
      messages: [{
        value: JSON.stringify({
          originalTopic: topic,
          originalMessage: message,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }]
    });
  }
}
```

## Performance Optimization

### 1. Batching

```javascript
const producer = kafka.producer({
  // Increase batch size
  'batch.size': 32768,  // 32KB
  
  // Wait longer to fill batch
  'linger.ms': 100,
  
  // Allow more in-flight requests
  'max.in.flight.requests.per.connection': 5
});
```

### 2. Compression

```javascript
await producer.send({
  topic: 'events',
  compression: CompressionTypes.Snappy,
  messages: messages
});
```

### 3. Connection Pooling

Reuse producer instances:

```javascript
// DON'T: Create new producer for each message
async function bad() {
  const producer = kafka.producer();
  await producer.connect();
  await producer.send({ /*...*/ });
  await producer.disconnect();
}

// DO: Reuse producer
const producer = kafka.producer();
await producer.connect();

async function good() {
  await producer.send({ /*...*/ });
}
```

### 4. Async Processing

```javascript
// Parallel sends
const sends = messages.map(msg =>
  producer.send({
    topic: 'events',
    messages: [msg]
  })
);

await Promise.all(sends);
```

## Code Examples

### Complete Producer Example (Node.js)

```javascript
const { Kafka, CompressionTypes, logLevel } = require('kafkajs');

class KafkaProducerService {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'my-app',
      brokers: ['localhost:9092'],
      logLevel: logLevel.INFO,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
      idempotent: true,
      maxInFlightRequests: 5,
      compression: CompressionTypes.Snappy
    });
    
    this.connected = false;
  }
  
  async connect() {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
      console.log('✓ Producer connected');
    }
  }
  
  async sendMessage(topic, key, value, headers = {}) {
    await this.connect();
    
    try {
      const metadata = await this.producer.send({
        topic,
        messages: [{
          key: key ? String(key) : null,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          headers,
          timestamp: Date.now().toString()
        }]
      });
      
      console.log(`✓ Message sent: ${topic} [${metadata[0].partition}] @ ${metadata[0].offset}`);
      return metadata;
    } catch (error) {
      console.error('✗ Failed to send message:', error);
      throw error;
    }
  }
  
  async sendBatch(topic, messages) {
    await this.connect();
    
    const kafkaMessages = messages.map(msg => ({
      key: msg.key ? String(msg.key) : null,
      value: typeof msg.value === 'string' ? msg.value : JSON.stringify(msg.value),
      headers: msg.headers || {},
      timestamp: Date.now().toString()
    }));
    
    return await this.producer.send({
      topic,
      messages: kafkaMessages
    });
  }
  
  async disconnect() {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      console.log('✓ Producer disconnected');
    }
  }
}

// Usage
async function main() {
  const producerService = new KafkaProducerService();
  
  try {
    // Single message
    await producerService.sendMessage(
      'user-events',
      'user123',
      { action: 'login', timestamp: Date.now() }
    );
    
    // Batch messages
    await producerService.sendBatch('logs', [
      { key: 'log1', value: 'Log entry 1' },
      { key: 'log2', value: 'Log entry 2' },
      { key: 'log3', value: 'Log entry 3' }
    ]);
  } finally {
    await producerService.disconnect();
  }
}

main().catch(console.error);
```

### Complete Producer Example (Python)

```python
from kafka import KafkaProducer
from kafka.errors import KafkaError
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KafkaProducerService:
    def __init__(self, bootstrap_servers=['localhost:9092']):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            acks='all',
            retries=3,
            compression_type='snappy',
            linger_ms=10,
            batch_size=32768
        )
        logger.info("✓ Producer created")
    
    def send_message(self, topic, key, value):
        try:
            future = self.producer.send(topic, key=key, value=value)
            record_metadata = future.get(timeout=10)
            logger.info(f"✓ Message sent: {topic} [{record_metadata.partition}] @ {record_metadata.offset}")
            return record_metadata
        except KafkaError as e:
            logger.error(f"✗ Failed to send message: {e}")
            raise
    
    def send_async(self, topic, key, value):
        def on_success(record_metadata):
            logger.info(f"✓ Message sent: {topic} [{record_metadata.partition}] @ {record_metadata.offset}")
        
        def on_error(exception):
            logger.error(f"✗ Failed to send message: {exception}")
        
        self.producer.send(topic, key=key, value=value) \
            .add_callback(on_success) \
            .add_errback(on_error)
    
    def close(self):
        self.producer.flush()
        self.producer.close()
        logger.info("✓ Producer closed")

# Usage
if __name__ == '__main__':
    producer_service = KafkaProducerService()
    
    try:
        # Send message
        producer_service.send_message(
            'user-events',
            'user123',
            {'action': 'login', 'timestamp': '2025-11-05T10:30:00Z'}
        )
        
        # Send async
        for i in range(10):
            producer_service.send_async(
                'events',
                f'key-{i}',
                {'id': i, 'data': f'Message {i}'}
            )
    finally:
        producer_service.close()
```

## Next Steps

- **[Consumers Guide](./04-kafka-consumers.md)** - Learn to consume messages
- **[Node.js/NestJS Integration](./05-kafka-nodejs-nestjs.md)** - Full integration examples
- **[Best Practices](./06-kafka-best-practices.md)** - Production patterns and tips
