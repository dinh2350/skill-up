# Kafka Consumers Guide

## Table of Contents
- [Consumer Overview](#consumer-overview)
- [Consumer Configuration](#consumer-configuration)
- [Consumer Groups](#consumer-groups)
- [Offset Management](#offset-management)
- [Message Consumption Patterns](#message-consumption-patterns)
- [Rebalancing](#rebalancing)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Code Examples](#code-examples)

## Consumer Overview

A Kafka consumer is an application that subscribes to topics and processes messages. Consumers are responsible for:
- Subscribing to topics
- Polling for messages
- Processing messages
- Managing offsets
- Handling rebalances

### Consumer Workflow

```
[Subscribe to Topic(s)]
         ↓
[Join Consumer Group]
         ↓
[Partition Assignment] ← Rebalance triggered here
         ↓
[Poll for Messages]
         ↓
[Deserialize Data]
         ↓
[Process Messages]
         ↓
[Commit Offsets]
         ↓
[Repeat Polling...]
```

## Consumer Configuration

### Essential Configuration Properties

```javascript
const consumerConfig = {
  // Required: Kafka broker addresses
  'bootstrap.servers': 'localhost:9092',
  
  // Required: Consumer group ID
  'group.id': 'my-consumer-group',
  
  // Deserializers
  'key.deserializer': 'org.apache.kafka.common.serialization.StringDeserializer',
  'value.deserializer': 'org.apache.kafka.common.serialization.StringDeserializer',
  
  // Auto offset reset (earliest, latest, none)
  'auto.offset.reset': 'earliest',
  
  // Auto commit
  'enable.auto.commit': true,
  'auto.commit.interval.ms': 5000,
  
  // Polling
  'max.poll.records': 500,
  'max.poll.interval.ms': 300000,  // 5 minutes
  
  // Session management
  'session.timeout.ms': 10000,  // 10 seconds
  'heartbeat.interval.ms': 3000,  // 3 seconds
  
  // Fetch settings
  'fetch.min.bytes': 1,
  'fetch.max.wait.ms': 500,
  'max.partition.fetch.bytes': 1048576,  // 1MB
  
  // Client ID
  'client.id': 'my-consumer-app'
};
```

### Configuration Deep Dive

#### 1. Consumer Group ID

```javascript
// Same group.id = consumers in same group (load balancing)
'group.id': 'order-processors'

// Different group.id = independent consumers (fan-out)
'group.id': 'email-notifier'
```

#### 2. Auto Offset Reset

Controls where to start reading when no offset exists:

```javascript
// Start from earliest message in topic
'auto.offset.reset': 'earliest'

// Start from latest message (skip old messages)
'auto.offset.reset': 'latest'

// Throw error if no offset exists
'auto.offset.reset': 'none'
```

#### 3. Offset Commit Strategies

**Auto Commit (easier, less control):**
```javascript
{
  'enable.auto.commit': true,
  'auto.commit.interval.ms': 5000  // Commit every 5 seconds
}
```

**Manual Commit (more control, more complex):**
```javascript
{
  'enable.auto.commit': false
}
```

#### 4. Polling Configuration

```javascript
// Max records returned in single poll
'max.poll.records': 500,

// Max time between polls before consumer is considered dead
'max.poll.interval.ms': 300000,  // 5 minutes

// Min bytes to fetch (increases throughput)
'fetch.min.bytes': 1024,

// Max wait time for min.bytes
'fetch.max.wait.ms': 500
```

#### 5. Session Management

```javascript
// Time before consumer is considered dead
'session.timeout.ms': 10000,  // 10 seconds

// Heartbeat frequency (should be < 1/3 of session.timeout.ms)
'heartbeat.interval.ms': 3000  // 3 seconds
```

## Consumer Groups

### How Consumer Groups Work

```
Topic: orders (4 partitions)
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  P0     │ │  P1     │ │  P2     │ │  P3     │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
     │           │           │           │
     └───────────┴───────────┴───────────┘
                    ↓
        Consumer Group: processors
     ┌──────────┬──────────┬──────────┐
     │ C1 (P0)  │ C2 (P1)  │ C3 (P2,P3)│
     └──────────┴──────────┴──────────┘
```

### Key Rules

1. **Each partition is consumed by exactly one consumer in a group**
2. **A consumer can consume from multiple partitions**
3. **More consumers than partitions = some consumers idle**
4. **Different groups independently consume the same data**

### Multiple Consumer Groups

```
Topic: user-events
     ↓
┌────────────────────────────────┐
│ Consumer Group: analytics      │ → Process for analytics
│ (3 consumers)                  │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Consumer Group: email-service  │ → Send email notifications
│ (2 consumers)                  │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Consumer Group: audit-logger   │ → Log for audit trail
│ (1 consumer)                   │
└────────────────────────────────┘
```

## Offset Management

### What Are Offsets?

Offsets track which messages have been consumed:

```
Partition 0:
Offset:  0    1    2    3    4    5    6    7    8    9
        [msg][msg][msg][msg][msg][msg][msg][msg][msg][msg]
                              ↑
                    Current offset: 4
                    (Next message to read: offset 5)
```

### Offset Storage

Offsets are stored in the internal Kafka topic: `__consumer_offsets`

### Commit Strategies

#### 1. Auto Commit

**Pros:**
- Simple
- No code needed

**Cons:**
- Less control
- Risk of duplicate/lost messages

```javascript
const consumer = kafka.consumer({
  groupId: 'my-group',
  autoCommit: true,
  autoCommitInterval: 5000
});
```

#### 2. Manual Commit (Synchronous)

Commit after processing each batch:

```javascript
const consumer = kafka.consumer({
  groupId: 'my-group',
  autoCommit: false
});

await consumer.run({
  eachBatch: async ({ batch, resolveOffset, commitOffsetsIfNecessary }) => {
    for (let message of batch.messages) {
      // Process message
      await processMessage(message);
      
      // Resolve offset (mark as processed)
      resolveOffset(message.offset);
    }
    
    // Commit all resolved offsets
    await commitOffsetsIfNecessary();
  }
});
```

#### 3. Manual Commit (Per Message)

Commit after processing each message:

```javascript
await consumer.run({
  eachMessage: async ({ topic, partition, message, heartbeat }) => {
    // Process message
    await processMessage(message);
    
    // Manual commit
    await consumer.commitOffsets([{
      topic,
      partition,
      offset: (Number(message.offset) + 1).toString()
    }]);
    
    // Send heartbeat to prevent rebalance
    await heartbeat();
  }
});
```

#### 4. Commit with Specific Offset

```javascript
// Commit specific offset
await consumer.commitOffsets([
  {
    topic: 'user-events',
    partition: 0,
    offset: '100'
  }
]);
```

### Offset Reset

Reset consumer to specific position:

```javascript
// Seek to beginning
await consumer.seek({
  topic: 'user-events',
  partition: 0,
  offset: '0'
});

// Seek to specific offset
await consumer.seek({
  topic: 'user-events',
  partition: 0,
  offset: '1000'
});

// Seek to end
const topicMetadata = await admin.fetchTopicMetadata({ topics: ['user-events'] });
const partition = topicMetadata.topics[0].partitions[0];
await consumer.seek({
  topic: 'user-events',
  partition: 0,
  offset: partition.high.toString()
});
```

### Offset Management Tools

**List consumer groups:**
```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
```

**Describe consumer group:**
```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --describe
```

**Reset offsets:**
```bash
# Reset to earliest
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --reset-offsets --to-earliest \
  --topic my-topic --execute

# Reset to specific offset
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --reset-offsets --to-offset 1000 \
  --topic my-topic:0 --execute

# Reset by datetime
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --reset-offsets \
  --to-datetime 2025-11-05T10:00:00.000 \
  --topic my-topic --execute
```

## Message Consumption Patterns

### 1. Simple Consumer

Basic message consumption:

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'my-group' });

async function consume() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-events', fromBeginning: true });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        value: message.value.toString()
      });
    }
  });
}

consume().catch(console.error);
```

### 2. Batch Consumer

Process messages in batches for better performance:

```javascript
await consumer.run({
  eachBatch: async ({ 
    batch, 
    resolveOffset, 
    heartbeat, 
    commitOffsetsIfNecessary 
  }) => {
    console.log(`Received batch of ${batch.messages.length} messages`);
    
    for (let message of batch.messages) {
      // Process message
      const value = JSON.parse(message.value.toString());
      await processMessage(value);
      
      // Mark as processed
      resolveOffset(message.offset);
      
      // Send heartbeat periodically
      await heartbeat();
    }
    
    // Commit offsets
    await commitOffsetsIfNecessary();
    console.log('Batch processed successfully');
  }
});
```

### 3. Multiple Topics Consumer

Subscribe to multiple topics:

```javascript
await consumer.subscribe({ 
  topics: ['user-events', 'order-events', 'payment-events'],
  fromBeginning: false 
});

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    switch (topic) {
      case 'user-events':
        await handleUserEvent(message);
        break;
      case 'order-events':
        await handleOrderEvent(message);
        break;
      case 'payment-events':
        await handlePaymentEvent(message);
        break;
    }
  }
});
```

### 4. Pattern-Based Subscription

Subscribe using regex pattern:

```javascript
// Subscribe to all topics matching pattern
await consumer.subscribe({ 
  topics: /^events-.*/,  // All topics starting with 'events-'
  fromBeginning: false 
});
```

### 5. Pause and Resume

Control consumption flow:

```javascript
const consumer = kafka.consumer({ groupId: 'my-group' });

await consumer.subscribe({ topic: 'events' });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    try {
      await processMessage(message);
    } catch (error) {
      if (error.message.includes('rate limit')) {
        // Pause consumption
        consumer.pause([{ topic, partitions: [partition] }]);
        
        // Resume after delay
        setTimeout(() => {
          consumer.resume([{ topic, partitions: [partition] }]);
        }, 5000);
      }
    }
  }
});
```

### 6. Concurrent Processing

Process messages concurrently:

```javascript
await consumer.run({
  partitionsConsumedConcurrently: 3,  // Process 3 partitions concurrently
  eachMessage: async ({ topic, partition, message }) => {
    await processMessage(message);
  }
});
```

## Rebalancing

### When Rebalancing Occurs

1. Consumer joins the group
2. Consumer leaves the group
3. Consumer is considered dead
4. New partitions added to topic
5. Partition reassignment

### Rebalancing Process

```
1. Stop consuming
2. Revoke assigned partitions
3. Redistribute partitions among consumers
4. Assign new partitions
5. Resume consuming
```

### Handling Rebalancing

```javascript
const consumer = kafka.consumer({
  groupId: 'my-group',
  sessionTimeout: 30000,
  rebalanceTimeout: 60000
});

// Listen to rebalance events
consumer.on('consumer.group_join', (event) => {
  console.log('Consumer joined group:', event);
});

consumer.on('consumer.rebalancing', (event) => {
  console.log('Rebalancing started');
  // Save state, flush buffers, etc.
});

consumer.on('consumer.connect', (event) => {
  console.log('Consumer connected');
});

consumer.on('consumer.disconnect', (event) => {
  console.log('Consumer disconnected');
});
```

### Rebalance Strategies

#### 1. Range Assignor (Default)

Assigns contiguous partitions:
```
Consumer 1: P0, P1
Consumer 2: P2, P3
Consumer 3: P4
```

#### 2. Round Robin Assignor

Distributes partitions evenly:
```
Consumer 1: P0, P3
Consumer 2: P1, P4
Consumer 3: P2, P5
```

#### 3. Sticky Assignor

Minimizes partition movement during rebalance:
```javascript
const consumer = kafka.consumer({
  groupId: 'my-group',
  partitionAssigners: [PartitionAssigners.roundRobin]
});
```

## Error Handling

### 1. Message Processing Errors

```javascript
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    try {
      await processMessage(message);
    } catch (error) {
      console.error('Processing error:', error);
      
      // Option 1: Dead Letter Queue
      await sendToDeadLetterQueue(topic, message, error);
      
      // Option 2: Retry with backoff
      await retryWithBackoff(message, 3);
      
      // Option 3: Skip and log
      console.error('Skipping message:', message.offset);
    }
  }
});
```

### 2. Retry Pattern

```javascript
async function retryWithBackoff(message, maxRetries) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await processMessage(message);
      return;
    } catch (error) {
      retries++;
      const delay = Math.pow(2, retries) * 1000;  // Exponential backoff
      console.log(`Retry ${retries}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  
  // Max retries reached
  await sendToDeadLetterQueue(message);
}
```

### 3. Dead Letter Queue

```javascript
const dlqProducer = kafka.producer();

async function sendToDeadLetterQueue(originalTopic, message, error) {
  await dlqProducer.send({
    topic: `${originalTopic}.dlq`,
    messages: [{
      key: message.key,
      value: message.value,
      headers: {
        ...message.headers,
        'original-topic': originalTopic,
        'error-message': error.message,
        'error-timestamp': new Date().toISOString(),
        'original-offset': message.offset
      }
    }]
  });
}
```

### 4. Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
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
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log('Circuit breaker opened');
    }
  }
}

// Usage
const breaker = new CircuitBreaker();

await consumer.run({
  eachMessage: async ({ message }) => {
    await breaker.execute(() => processMessage(message));
  }
});
```

## Performance Optimization

### 1. Batch Processing

```javascript
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, commitOffsetsIfNecessary }) => {
    // Process all messages in parallel
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

### 2. Increase Fetch Size

```javascript
const consumer = kafka.consumer({
  groupId: 'my-group',
  maxBytesPerPartition: 1048576,  // 1MB
  minBytes: 1024,  // 1KB
  maxWaitTimeInMs: 100
});
```

### 3. Concurrent Partition Processing

```javascript
await consumer.run({
  partitionsConsumedConcurrently: 10,
  eachMessage: async ({ message }) => {
    await processMessage(message);
  }
});
```

### 4. Optimize Commit Frequency

```javascript
// Commit less frequently for better performance
const consumer = kafka.consumer({
  groupId: 'my-group',
  autoCommitInterval: 10000  // 10 seconds
});
```

### 5. Connection Pooling

Share consumer instances when possible:

```javascript
// Create consumer once
const consumer = kafka.consumer({ groupId: 'my-group' });
await consumer.connect();

// Reuse for entire application lifecycle
process.on('SIGTERM', async () => {
  await consumer.disconnect();
});
```

## Code Examples

### Complete Consumer Example (Node.js)

```javascript
const { Kafka, logLevel } = require('kafkajs');

class KafkaConsumerService {
  constructor(groupId) {
    this.kafka = new Kafka({
      clientId: 'my-app',
      brokers: ['localhost:9092'],
      logLevel: logLevel.INFO
    });
    
    this.consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.dlqProducer = this.kafka.producer();
  }
  
  async connect() {
    await this.consumer.connect();
    await this.dlqProducer.connect();
    console.log('✓ Consumer connected');
  }
  
  async subscribe(topics) {
    await this.consumer.subscribe({
      topics: Array.isArray(topics) ? topics : [topics],
      fromBeginning: false
    });
    console.log(`✓ Subscribed to: ${topics}`);
  }
  
  async consume(handler) {
    await this.consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        const startTime = Date.now();
        
        try {
          // Parse message
          const data = {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value: JSON.parse(message.value.toString()),
            timestamp: message.timestamp,
            headers: message.headers
          };
          
          // Process message
          await handler(data);
          
          // Commit offset
          await this.consumer.commitOffsets([{
            topic,
            partition,
            offset: (Number(message.offset) + 1).toString()
          }]);
          
          // Send heartbeat
          await heartbeat();
          
          const duration = Date.now() - startTime;
          console.log(`✓ Processed: ${topic} [${partition}] @ ${message.offset} (${duration}ms)`);
        } catch (error) {
          console.error(`✗ Processing error:`, error);
          
          // Send to DLQ
          await this.sendToDLQ(topic, message, error);
        }
      }
    });
  }
  
  async sendToDLQ(originalTopic, message, error) {
    try {
      await this.dlqProducer.send({
        topic: `${originalTopic}.dlq`,
        messages: [{
          key: message.key,
          value: message.value,
          headers: {
            ...message.headers,
            'original-topic': originalTopic,
            'error-message': error.message,
            'error-timestamp': new Date().toISOString(),
            'original-offset': message.offset
          }
        }]
      });
      console.log(`→ Sent to DLQ: ${originalTopic}.dlq`);
    } catch (dlqError) {
      console.error('Failed to send to DLQ:', dlqError);
    }
  }
  
  async disconnect() {
    await this.consumer.disconnect();
    await this.dlqProducer.disconnect();
    console.log('✓ Consumer disconnected');
  }
}

// Usage
async function main() {
  const consumerService = new KafkaConsumerService('my-consumer-group');
  
  await consumerService.connect();
  await consumerService.subscribe(['user-events', 'order-events']);
  
  await consumerService.consume(async (message) => {
    console.log('Processing:', message.value);
    
    // Your business logic here
    if (message.topic === 'user-events') {
      await handleUserEvent(message.value);
    } else if (message.topic === 'order-events') {
      await handleOrderEvent(message.value);
    }
  });
}

async function handleUserEvent(data) {
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('User event processed:', data);
}

async function handleOrderEvent(data) {
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Order event processed:', data);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

main().catch(console.error);
```

### Complete Consumer Example (Python)

```python
from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KafkaConsumerService:
    def __init__(self, group_id, bootstrap_servers=['localhost:9092']):
        self.consumer = KafkaConsumer(
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            key_deserializer=lambda k: k.decode('utf-8') if k else None,
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            auto_offset_reset='earliest',
            enable_auto_commit=False,
            max_poll_records=500,
            session_timeout_ms=30000,
            heartbeat_interval_ms=3000
        )
        
        self.dlq_producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        
        logger.info("✓ Consumer created")
    
    def subscribe(self, topics):
        if isinstance(topics, str):
            topics = [topics]
        self.consumer.subscribe(topics)
        logger.info(f"✓ Subscribed to: {topics}")
    
    def consume(self, handler):
        try:
            for message in self.consumer:
                try:
                    # Process message
                    data = {
                        'topic': message.topic,
                        'partition': message.partition,
                        'offset': message.offset,
                        'key': message.key,
                        'value': message.value,
                        'timestamp': message.timestamp
                    }
                    
                    handler(data)
                    
                    # Commit offset
                    self.consumer.commit()
                    
                    logger.info(f"✓ Processed: {message.topic} [{message.partition}] @ {message.offset}")
                except Exception as error:
                    logger.error(f"✗ Processing error: {error}")
                    self.send_to_dlq(message, error)
        except KeyboardInterrupt:
            logger.info("Consumer stopped by user")
        finally:
            self.close()
    
    def send_to_dlq(self, message, error):
        try:
            dlq_topic = f"{message.topic}.dlq"
            self.dlq_producer.send(
                dlq_topic,
                value={
                    'original_topic': message.topic,
                    'original_partition': message.partition,
                    'original_offset': message.offset,
                    'original_key': message.key,
                    'original_value': message.value,
                    'error_message': str(error),
                    'timestamp': message.timestamp
                }
            )
            logger.info(f"→ Sent to DLQ: {dlq_topic}")
        except Exception as dlq_error:
            logger.error(f"Failed to send to DLQ: {dlq_error}")
    
    def close(self):
        self.consumer.close()
        self.dlq_producer.close()
        logger.info("✓ Consumer closed")

# Usage
if __name__ == '__main__':
    consumer_service = KafkaConsumerService('my-consumer-group')
    
    def message_handler(message):
        print(f"Processing: {message['value']}")
        # Your business logic here
    
    consumer_service.subscribe(['user-events', 'order-events'])
    consumer_service.consume(message_handler)
```

## Next Steps

- **[Node.js/NestJS Integration](./05-kafka-nodejs-nestjs.md)** - Full integration with your projects
- **[Best Practices](./06-kafka-best-practices.md)** - Production patterns and tips
- **[Producers Guide](./03-kafka-producers.md)** - Review producer concepts
