# Kafka Installation and Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Docker Setup (Recommended)](#docker-setup-recommended)
- [Manual Installation](#manual-installation)
- [Configuration](#configuration)
- [Verification](#verification)
- [Production Considerations](#production-considerations)

## Prerequisites

### System Requirements
- **Java**: JDK 8+ or JDK 11+ (required for Kafka)
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Disk**: Sufficient space for message storage
- **OS**: Linux, macOS, or Windows

### Check Java Installation
```bash
java -version
```

If Java is not installed:
- **Windows**: Download from [Oracle](https://www.oracle.com/java/technologies/downloads/) or [AdoptOpenJDK](https://adoptopenjdk.net/)
- **macOS**: `brew install openjdk@11`
- **Linux**: `sudo apt-get install openjdk-11-jdk`

## Local Development Setup

### Option 1: Docker Setup (Recommended) ⭐

Docker is the easiest way to get started with Kafka for development.

#### Using Docker Compose (Kafka + ZooKeeper)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    hostname: zookeeper
    container_name: zookeeper
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data
      - zookeeper-logs:/var/lib/zookeeper/log

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    hostname: kafka
    container_name: kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "9101:9101"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_JMX_PORT: 9101
      KAFKA_JMX_HOSTNAME: localhost
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
    volumes:
      - kafka-data:/var/lib/kafka/data

  # Optional: Kafka UI for management
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181

volumes:
  zookeeper-data:
  zookeeper-logs:
  kafka-data:
```

**Start Kafka:**
```bash
docker-compose up -d
```

**Stop Kafka:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f kafka
```

**Access Kafka UI:**
Open browser at `http://localhost:8080`

#### Using Docker Compose (KRaft mode - No ZooKeeper)

For Kafka 3.3+, you can run without ZooKeeper:

```yaml
version: '3.8'

services:
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    hostname: kafka
    container_name: kafka
    ports:
      - "9092:9092"
      - "9093:9093"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: 'broker,controller'
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@kafka:29093'
      KAFKA_LISTENERS: 'PLAINTEXT://kafka:29092,CONTROLLER://kafka:29093,PLAINTEXT_HOST://0.0.0.0:9092'
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092'
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT'
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER'
      KAFKA_INTER_BROKER_LISTENER_NAME: 'PLAINTEXT'
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_LOG_DIRS: '/tmp/kraft-combined-logs'
      CLUSTER_ID: 'MkU3OEVBNTcwNTJENDM2Qk'
    volumes:
      - kafka-data:/var/lib/kafka/data

volumes:
  kafka-data:
```

### Option 2: Manual Installation

#### Download Kafka

**For Windows:**
```bash
# Download from https://kafka.apache.org/downloads
# Extract to C:\kafka

# Or using PowerShell
Invoke-WebRequest -Uri "https://downloads.apache.org/kafka/3.6.0/kafka_2.13-3.6.0.tgz" -OutFile "kafka.tgz"
tar -xzf kafka.tgz
cd kafka_2.13-3.6.0
```

**For macOS/Linux:**
```bash
# Download and extract
wget https://downloads.apache.org/kafka/3.6.0/kafka_2.13-3.6.0.tgz
tar -xzf kafka_2.13-3.6.0.tgz
cd kafka_2.13-3.6.0

# Or using Homebrew (macOS)
brew install kafka
```

#### Start ZooKeeper

**Windows:**
```bash
# Navigate to Kafka directory
cd C:\kafka\kafka_2.13-3.6.0

# Start ZooKeeper
.\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties
```

**macOS/Linux:**
```bash
# Start ZooKeeper
bin/zookeeper-server-start.sh config/zookeeper.properties
```

#### Start Kafka Broker

Open a new terminal window.

**Windows:**
```bash
cd C:\kafka\kafka_2.13-3.6.0
.\bin\windows\kafka-server-start.bat .\config\server.properties
```

**macOS/Linux:**
```bash
bin/kafka-server-start.sh config/server.properties
```

#### Start Kafka in KRaft Mode (No ZooKeeper)

**Step 1: Generate Cluster ID**
```bash
# Windows
.\bin\windows\kafka-storage.bat random-uuid

# Linux/macOS
bin/kafka-storage.sh random-uuid
```

**Step 2: Format Storage**
```bash
# Windows
.\bin\windows\kafka-storage.bat format -t <UUID> -c .\config\kraft\server.properties

# Linux/macOS
bin/kafka-storage.sh format -t <UUID> -c config/kraft/server.properties
```

**Step 3: Start Kafka**
```bash
# Windows
.\bin\windows\kafka-server-start.bat .\config\kraft\server.properties

# Linux/macOS
bin/kafka-server-start.sh config/kraft/server.properties
```

## Configuration

### Basic Broker Configuration

Edit `config/server.properties`:

```properties
# Broker ID (unique for each broker in cluster)
broker.id=0

# Listeners
listeners=PLAINTEXT://localhost:9092

# Log directory
log.dirs=/tmp/kafka-logs  # or C:\tmp\kafka-logs on Windows

# ZooKeeper connection (if using ZooKeeper)
zookeeper.connect=localhost:2181

# Number of partitions per topic (default)
num.partitions=3

# Replication factor for internal topics
default.replication.factor=1
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1

# Log retention
log.retention.hours=168  # 7 days
log.retention.bytes=1073741824  # 1GB

# Log segment size
log.segment.bytes=1073741824  # 1GB

# Auto create topics
auto.create.topics.enable=true

# Max message size
message.max.bytes=1000012  # ~1MB
replica.fetch.max.bytes=1048576  # 1MB
```

### Producer Configuration

```properties
# Bootstrap servers
bootstrap.servers=localhost:9092

# Acknowledgments
acks=all

# Retries
retries=3

# Batch size
batch.size=16384

# Linger time (ms)
linger.ms=10

# Buffer memory
buffer.memory=33554432

# Compression
compression.type=snappy

# Idempotence
enable.idempotence=true
```

### Consumer Configuration

```properties
# Bootstrap servers
bootstrap.servers=localhost:9092

# Consumer group
group.id=my-consumer-group

# Auto offset reset
auto.offset.reset=earliest

# Enable auto commit
enable.auto.commit=true
auto.commit.interval.ms=5000

# Max poll records
max.poll.records=500

# Session timeout
session.timeout.ms=10000

# Heartbeat interval
heartbeat.interval.ms=3000
```

## Verification

### Test Kafka Installation

#### Create a Topic

**Windows:**
```bash
.\bin\windows\kafka-topics.bat --create --topic test-topic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

**macOS/Linux:**
```bash
bin/kafka-topics.sh --create --topic test-topic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

#### List Topics

**Windows:**
```bash
.\bin\windows\kafka-topics.bat --list --bootstrap-server localhost:9092
```

**macOS/Linux:**
```bash
bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

#### Describe Topic

**Windows:**
```bash
.\bin\windows\kafka-topics.bat --describe --topic test-topic --bootstrap-server localhost:9092
```

**macOS/Linux:**
```bash
bin/kafka-topics.sh --describe --topic test-topic --bootstrap-server localhost:9092
```

#### Produce Messages

**Windows:**
```bash
.\bin\windows\kafka-console-producer.bat --topic test-topic --bootstrap-server localhost:9092
```

**macOS/Linux:**
```bash
bin/kafka-console-producer.sh --topic test-topic --bootstrap-server localhost:9092
```

Type messages and press Enter. Press Ctrl+C to exit.

#### Consume Messages

Open a new terminal.

**Windows:**
```bash
.\bin\windows\kafka-console-consumer.bat --topic test-topic --from-beginning --bootstrap-server localhost:9092
```

**macOS/Linux:**
```bash
bin/kafka-console-consumer.sh --topic test-topic --from-beginning --bootstrap-server localhost:9092
```

### Useful Commands

#### Delete a Topic

```bash
# Windows
.\bin\windows\kafka-topics.bat --delete --topic test-topic --bootstrap-server localhost:9092

# Linux/macOS
bin/kafka-topics.sh --delete --topic test-topic --bootstrap-server localhost:9092
```

#### Consumer Groups

```bash
# List consumer groups
# Windows
.\bin\windows\kafka-consumer-groups.bat --list --bootstrap-server localhost:9092

# Linux/macOS
bin/kafka-consumer-groups.sh --list --bootstrap-server localhost:9092

# Describe consumer group
# Windows
.\bin\windows\kafka-consumer-groups.bat --describe --group my-group --bootstrap-server localhost:9092

# Linux/macOS
bin/kafka-consumer-groups.sh --describe --group my-group --bootstrap-server localhost:9092
```

#### Check Broker Configuration

```bash
# Windows
.\bin\windows\kafka-configs.bat --bootstrap-server localhost:9092 --entity-type brokers --entity-default --describe

# Linux/macOS
bin/kafka-configs.sh --bootstrap-server localhost:9092 --entity-type brokers --entity-default --describe
```

## Production Considerations

### Multi-Broker Cluster

For production, run multiple brokers:

1. **Copy broker configuration:**
```bash
cp config/server.properties config/server-1.properties
cp config/server.properties config/server-2.properties
```

2. **Edit each configuration:**

`server-1.properties`:
```properties
broker.id=1
listeners=PLAINTEXT://:9093
log.dirs=/tmp/kafka-logs-1
```

`server-2.properties`:
```properties
broker.id=2
listeners=PLAINTEXT://:9094
log.dirs=/tmp/kafka-logs-2
```

3. **Start brokers:**
```bash
bin/kafka-server-start.sh config/server-1.properties &
bin/kafka-server-start.sh config/server-2.properties &
```

### ZooKeeper Ensemble

For production, run a ZooKeeper ensemble (3 or 5 nodes):

`zoo1.cfg`:
```properties
tickTime=2000
dataDir=/var/zookeeper/data
clientPort=2181
initLimit=5
syncLimit=2
server.1=zoo1:2888:3888
server.2=zoo2:2888:3888
server.3=zoo3:2888:3888
```

### Hardware Recommendations

**Development:**
- 2-4 CPU cores
- 4-8 GB RAM
- 100 GB disk

**Production:**
- 8-16 CPU cores
- 32-64 GB RAM
- Fast SSDs (500+ GB)
- 1 Gbps+ network

### Security Configuration

```properties
# SSL/TLS
listeners=SSL://localhost:9093
ssl.keystore.location=/path/to/keystore.jks
ssl.keystore.password=password
ssl.key.password=password
ssl.truststore.location=/path/to/truststore.jks
ssl.truststore.password=password

# SASL Authentication
listeners=SASL_SSL://localhost:9093
sasl.mechanism.inter.broker.protocol=PLAIN
sasl.enabled.mechanisms=PLAIN
```

### Monitoring

Enable JMX for monitoring:
```properties
# In kafka-server-start script
export JMX_PORT=9999
export KAFKA_JMX_OPTS="-Dcom.sun.management.jmxremote=true"
```

### Cloud Deployment

**AWS MSK (Managed Streaming for Apache Kafka):**
- Fully managed Kafka service
- Automatic patching and upgrades
- Built-in monitoring with CloudWatch

**Confluent Cloud:**
- Fully managed Kafka as a service
- Global availability
- Advanced features included

**Azure Event Hubs:**
- Kafka-compatible event streaming service

## Troubleshooting

### Common Issues

**1. Port Already in Use:**
```bash
# Check what's using port 9092
# Windows
netstat -ano | findstr :9092

# Linux/macOS
lsof -i :9092
```

**2. Cannot Connect to ZooKeeper:**
- Ensure ZooKeeper is running
- Check `zookeeper.connect` in server.properties
- Verify ZooKeeper port (default: 2181)

**3. Out of Memory:**
```bash
# Increase heap size
# Windows: Edit bin\windows\kafka-server-start.bat
set KAFKA_HEAP_OPTS=-Xmx1G -Xms1G

# Linux/macOS: Edit bin/kafka-server-start.sh
export KAFKA_HEAP_OPTS="-Xmx1G -Xms1G"
```

**4. Log Directory Issues:**
- Ensure log.dirs path exists
- Check write permissions
- Verify sufficient disk space

## Next Steps

Now that Kafka is installed, proceed to:
- **[Producers Guide](./03-kafka-producers.md)** - Learn to produce messages
- **[Consumers Guide](./04-kafka-consumers.md)** - Learn to consume messages
- **[Node.js Integration](./05-kafka-nodejs-nestjs.md)** - Integrate with your applications
