# Kafka Fundamentals and Core Concepts

## Table of Contents
- [What is Apache Kafka?](#what-is-apache-kafka)
- [Key Concepts](#key-concepts)
- [Kafka Architecture](#kafka-architecture)
- [Core Components](#core-components)
- [How Kafka Works](#how-kafka-works)
- [Use Cases](#use-cases)

## What is Apache Kafka?

Apache Kafka is a distributed event streaming platform designed to handle high-throughput, fault-tolerant, real-time data feeds. Originally developed by LinkedIn and later open-sourced, Kafka is now maintained by the Apache Software Foundation.

### Key Characteristics
- **Distributed**: Runs as a cluster across multiple servers
- **Scalable**: Can handle trillions of events per day
- **Fault-tolerant**: Data is replicated across multiple brokers
- **High-throughput**: Capable of processing millions of messages per second
- **Low-latency**: Messages can be processed in real-time
- **Durable**: Messages are persisted to disk

## Key Concepts

### 1. **Events (Messages)**
An event is a record of something that happened. In Kafka, events have:
- **Key**: Optional identifier for the message
- **Value**: The actual data payload
- **Timestamp**: When the event occurred
- **Headers**: Optional metadata

```json
{
  "key": "user-123",
  "value": {
    "userId": "123",
    "action": "login",
    "timestamp": "2025-11-05T10:30:00Z"
  },
  "headers": {
    "source": "mobile-app",
    "version": "2.1.0"
  }
}
```

### 2. **Topics**
A topic is a category or feed name to which events are published. Think of it as a log or table in a database.

**Characteristics:**
- Topics are multi-subscriber (many consumers can read from one topic)
- Topics are append-only logs
- Events in topics are immutable
- Topics can be configured with retention policies

**Naming Convention:**
```
<domain>.<entity>.<event-type>
Examples:
- user.profile.updated
- order.payment.completed
- inventory.stock.reduced
```

### 3. **Partitions**
Each topic is divided into partitions, which are ordered, immutable sequences of events.

**Why Partitions?**
- **Scalability**: Distribute data across multiple brokers
- **Parallelism**: Multiple consumers can read from different partitions simultaneously
- **Ordering**: Guarantees order within a single partition

```
Topic: user-events (3 partitions)
┌─────────────────┐
│   Partition 0   │ → [msg1, msg2, msg5, msg8, ...]
├─────────────────┤
│   Partition 1   │ → [msg3, msg6, msg9, msg12, ...]
├─────────────────┤
│   Partition 2   │ → [msg4, msg7, msg10, msg11, ...]
└─────────────────┘
```

**Partition Key:**
- Messages with the same key always go to the same partition
- Ensures ordering for related events
- If no key is provided, messages are distributed round-robin

### 4. **Offsets**
An offset is a unique sequential ID assigned to each message within a partition.

- **Purpose**: Track which messages have been consumed
- **Storage**: Consumers commit offsets to track progress
- **Replay**: Can reset offsets to re-process messages

```
Partition 0:
Offset: 0    1    2    3    4    5    6    7    8
        [msg][msg][msg][msg][msg][msg][msg][msg][msg]
                                    ↑
                          Consumer at offset 5
```

## Kafka Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Kafka Cluster                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Broker 1  │  │  Broker 2  │  │  Broker 3  │        │
│  │            │  │            │  │            │        │
│  │ Topic A-P0 │  │ Topic A-P1 │  │ Topic A-P2 │        │
│  │ Topic B-P0 │  │ Topic B-P1 │  │ Topic A-P0 │        │
│  │            │  │            │  │  (replica) │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────┘
         ↑                                      ↓
    ┌─────────┐                          ┌──────────┐
    │Producer │                          │ Consumer │
    └─────────┘                          └──────────┘
         ↑                                      ↓
┌──────────────────┐              ┌──────────────────────┐
│ ZooKeeper Cluster│              │  Consumer Group      │
│ (or KRaft mode)  │              │  (multiple consumers)│
└──────────────────┘              └──────────────────────┘
```

## Core Components

### 1. **Broker**
A Kafka server that stores data and serves client requests.

**Responsibilities:**
- Store partition replicas
- Handle read/write requests from producers and consumers
- Replicate data to other brokers
- Participate in partition leader election

**Configuration:**
- Each broker has a unique ID
- Brokers communicate with each other
- One broker acts as the controller (manages partition assignments)

### 2. **Producer**
Applications that publish events to Kafka topics.

**Key Features:**
- **Batching**: Groups messages for efficiency
- **Compression**: Reduces network bandwidth (gzip, snappy, lz4, zstd)
- **Acknowledgments**: Configurable delivery guarantees
- **Partitioning**: Determines which partition to send messages to

**Acknowledgment Modes:**
- `acks=0`: No acknowledgment (fire and forget)
- `acks=1`: Leader acknowledgment only
- `acks=all`: All in-sync replicas acknowledge

### 3. **Consumer**
Applications that subscribe to topics and process events.

**Key Features:**
- **Consumer Groups**: Coordinate consumption across multiple consumers
- **Offset Management**: Track which messages have been processed
- **Rebalancing**: Automatically redistribute partitions when consumers join/leave
- **Polling**: Pull model (consumers request messages)

### 4. **Consumer Groups**
A group of consumers working together to consume a topic.

```
Topic: orders (4 partitions)
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Partition 0 │  │ Partition 1 │  │ Partition 2 │  │ Partition 3 │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
       ↓                ↓                  ↓                ↓
       └────────────────┴──────────────────┴────────────────┘
                              ↓
              Consumer Group: order-processors
       ┌─────────────┬──────────────┬──────────────┐
       │ Consumer 1  │  Consumer 2  │  Consumer 3  │
       │ (P0, P1)    │  (P2)        │  (P3)        │
       └─────────────┴──────────────┴──────────────┘
```

**Rules:**
- Each partition is consumed by exactly one consumer in a group
- A consumer can consume from multiple partitions
- Different consumer groups can independently consume the same topic

### 5. **ZooKeeper / KRaft**
Cluster coordination and metadata management.

**ZooKeeper (traditional):**
- Manages broker membership
- Tracks partition leaders
- Stores cluster metadata
- Handles leader elections

**KRaft (newer, ZooKeeper-free):**
- Built-in consensus mechanism
- Simplifies deployment
- Improves scalability
- Available since Kafka 2.8 (production-ready in 3.3+)

### 6. **Replication**
Kafka replicates partitions across multiple brokers for fault tolerance.

```
Topic: transactions (replication-factor: 3)

Broker 1 (Leader)     Broker 2 (Follower)   Broker 3 (Follower)
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Partition 0  │  →   │ Partition 0  │  →   │ Partition 0  │
│   (Leader)   │      │  (Replica)   │      │  (Replica)   │
└──────────────┘      └──────────────┘      └──────────────┘
```

**Key Concepts:**
- **Leader**: Handles all reads and writes
- **Follower**: Replicates data from the leader
- **ISR (In-Sync Replicas)**: Followers that are caught up with the leader
- **Min ISR**: Minimum number of replicas that must acknowledge a write

## How Kafka Works

### Message Flow

1. **Producer sends message:**
   - Producer serializes the message
   - Determines the target partition (based on key or round-robin)
   - Sends to the partition leader
   - Waits for acknowledgment (based on `acks` config)

2. **Broker receives message:**
   - Leader writes to local log
   - Followers replicate from leader
   - Leader sends acknowledgment to producer

3. **Consumer reads message:**
   - Consumer polls for new messages
   - Broker returns messages from committed offset
   - Consumer processes messages
   - Consumer commits offset

### Data Retention

Kafka retains messages based on policies:

**Time-based:**
```properties
# Keep messages for 7 days
retention.ms=604800000
```

**Size-based:**
```properties
# Keep up to 1GB per partition
retention.bytes=1073741824
```

**Compaction:**
- Keeps only the latest value for each key
- Useful for changelog topics
- Guarantees at least the last state is preserved

## Use Cases

### 1. **Event Streaming**
Real-time data pipelines and streaming applications.
- User activity tracking
- Log aggregation
- IoT sensor data processing

### 2. **Messaging**
Decoupling microservices and asynchronous communication.
- Order processing systems
- Notification services
- Task queues

### 3. **Metrics & Monitoring**
Operational data collection and monitoring.
- Application metrics
- System logs
- Performance monitoring

### 4. **Data Integration**
Moving data between systems.
- Database change data capture (CDC)
- ETL pipelines
- Data lake ingestion

### 5. **Stream Processing**
Real-time data transformation and analytics.
- Fraud detection
- Real-time analytics
- Complex event processing

### 6. **Event Sourcing**
Storing state changes as a sequence of events.
- Audit trails
- Financial transactions
- CQRS pattern implementation

## Kafka vs Traditional Messaging

| Feature | Kafka | Traditional MQ (RabbitMQ, etc.) |
|---------|-------|----------------------------------|
| Message retention | Persistent (configurable) | Deleted after consumption |
| Throughput | Very high (millions/sec) | Moderate to high |
| Message ordering | Per partition | Per queue |
| Consumer model | Pull-based | Push-based (typically) |
| Scalability | Horizontally scalable | Limited scalability |
| Use case | Event streaming, logs | Task queues, RPC |
| Replay capability | Yes (by offset) | No |

## Performance Characteristics

### Throughput
- **Write**: 100K+ messages/sec per broker
- **Read**: 100K+ messages/sec per consumer
- Linear scalability with more brokers

### Latency
- **End-to-end**: 10-50ms (typical)
- **Producer**: 2-5ms (typical)
- **Consumer**: Near real-time

### Storage
- Sequential I/O operations (very fast)
- Zero-copy transfer (kernel to network)
- Batch compression reduces storage needs

## Next Steps

Now that you understand Kafka fundamentals, proceed to:
1. **[Installation and Setup Guide](./02-kafka-installation-setup.md)** - Set up your Kafka environment
2. **[Producers Guide](./03-kafka-producers.md)** - Learn to produce messages
3. **[Consumers Guide](./04-kafka-consumers.md)** - Learn to consume messages
4. **[Node.js Integration](./05-kafka-nodejs-nestjs.md)** - Integrate Kafka with your applications
5. **[Best Practices](./06-kafka-best-practices.md)** - Production-ready patterns and tips

## Additional Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Kafka Tutorials](https://kafka-tutorials.confluent.io/)
- [Kafka: The Definitive Guide (Book)](https://www.confluent.io/resources/kafka-the-definitive-guide/)
