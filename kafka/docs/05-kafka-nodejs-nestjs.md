# Kafka with Node.js and NestJS Integration

## Table of Contents
- [Introduction](#introduction)
- [Node.js Integration](#nodejs-integration)
- [NestJS Integration](#nestjs-integration)
- [Microservices Architecture](#microservices-architecture)
- [Real-World Examples](#real-world-examples)
- [Testing](#testing)
- [Deployment](#deployment)

## Introduction

This guide covers integrating Apache Kafka with Node.js and NestJS applications, including complete examples for building event-driven microservices.

### Libraries

**KafkaJS** (Recommended for Node.js):
```bash
npm install kafkajs
```

**@nestjs/microservices** (For NestJS):
```bash
npm install @nestjs/microservices kafkajs
```

## Node.js Integration

### 1. Basic Setup

**Project Structure:**
```
my-kafka-app/
├── src/
│   ├── config/
│   │   └── kafka.config.js
│   ├── producers/
│   │   └── event.producer.js
│   ├── consumers/
│   │   └── event.consumer.js
│   ├── services/
│   │   └── message.service.js
│   └── index.js
├── package.json
└── .env
```

**package.json:**
```json
{
  "name": "kafka-nodejs-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "producer": "node src/producers/event.producer.js",
    "consumer": "node src/consumers/event.consumer.js"
  },
  "dependencies": {
    "kafkajs": "^2.2.4",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0"
  }
}
```

**.env:**
```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=my-app
KAFKA_GROUP_ID=my-consumer-group
NODE_ENV=development
```

### 2. Kafka Configuration

**src/config/kafka.config.js:**
```javascript
import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'my-app',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    multiplier: 2,
    factor: 0.2
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
});

export default kafka;
```

### 3. Producer Service

**src/services/producer.service.js:**
```javascript
import kafka from '../config/kafka.config.js';
import { CompressionTypes } from 'kafkajs';

class ProducerService {
  constructor() {
    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
      idempotent: true,
      maxInFlightRequests: 5,
      compression: CompressionTypes.Snappy
    });
    
    this.isConnected = false;
  }
  
  async connect() {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      console.log('✓ Producer connected');
    }
  }
  
  async disconnect() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('✓ Producer disconnected');
    }
  }
  
  async sendMessage(topic, message) {
    await this.connect();
    
    try {
      const result = await this.producer.send({
        topic,
        messages: [
          {
            key: message.key || null,
            value: JSON.stringify(message.value),
            headers: message.headers || {},
            timestamp: Date.now().toString()
          }
        ]
      });
      
      console.log(`✓ Message sent: ${topic}`, result);
      return result;
    } catch (error) {
      console.error('✗ Failed to send message:', error);
      throw error;
    }
  }
  
  async sendBatch(topic, messages) {
    await this.connect();
    
    const kafkaMessages = messages.map(msg => ({
      key: msg.key || null,
      value: JSON.stringify(msg.value),
      headers: msg.headers || {},
      timestamp: Date.now().toString()
    }));
    
    return await this.producer.send({
      topic,
      messages: kafkaMessages
    });
  }
  
  async sendTransaction(operations) {
    await this.connect();
    const transaction = await this.producer.transaction();
    
    try {
      for (const op of operations) {
        await transaction.send({
          topic: op.topic,
          messages: [
            {
              key: op.message.key || null,
              value: JSON.stringify(op.message.value),
              headers: op.message.headers || {}
            }
          ]
        });
      }
      
      await transaction.commit();
      console.log('✓ Transaction committed');
    } catch (error) {
      await transaction.abort();
      console.error('✗ Transaction aborted:', error);
      throw error;
    }
  }
}

export default new ProducerService();
```

### 4. Consumer Service

**src/services/consumer.service.js:**
```javascript
import kafka from '../config/kafka.config.js';

class ConsumerService {
  constructor(groupId) {
    this.consumer = kafka.consumer({
      groupId: groupId || process.env.KAFKA_GROUP_ID || 'default-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.isConnected = false;
    this.handlers = new Map();
  }
  
  async connect() {
    if (!this.isConnected) {
      await this.consumer.connect();
      this.isConnected = true;
      console.log('✓ Consumer connected');
    }
  }
  
  async disconnect() {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('✓ Consumer disconnected');
    }
  }
  
  registerHandler(topic, handler) {
    this.handlers.set(topic, handler);
  }
  
  async subscribe(topics) {
    await this.connect();
    
    const topicList = Array.isArray(topics) ? topics : [topics];
    await this.consumer.subscribe({
      topics: topicList,
      fromBeginning: false
    });
    
    console.log(`✓ Subscribed to: ${topicList.join(', ')}`);
  }
  
  async consume() {
    await this.consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        const startTime = Date.now();
        
        try {
          const data = {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value: JSON.parse(message.value.toString()),
            timestamp: message.timestamp,
            headers: this.parseHeaders(message.headers)
          };
          
          // Get handler for this topic
          const handler = this.handlers.get(topic);
          if (handler) {
            await handler(data);
          } else {
            console.log('No handler for topic:', topic);
          }
          
          // Commit offset
          await this.consumer.commitOffsets([
            {
              topic,
              partition,
              offset: (Number(message.offset) + 1).toString()
            }
          ]);
          
          await heartbeat();
          
          const duration = Date.now() - startTime;
          console.log(`✓ Processed: ${topic} [${partition}] @ ${message.offset} (${duration}ms)`);
        } catch (error) {
          console.error(`✗ Processing error:`, error);
          // Implement your error handling strategy here
        }
      }
    });
  }
  
  parseHeaders(headers) {
    const parsed = {};
    for (const [key, value] of Object.entries(headers || {})) {
      parsed[key] = value.toString();
    }
    return parsed;
  }
}

export default ConsumerService;
```

### 5. Application Example

**src/index.js:**
```javascript
import producerService from './services/producer.service.js';
import ConsumerService from './services/consumer.service.js';

class Application {
  constructor() {
    this.consumerService = new ConsumerService('my-app-group');
  }
  
  async start() {
    // Register handlers
    this.consumerService.registerHandler('user-events', this.handleUserEvent);
    this.consumerService.registerHandler('order-events', this.handleOrderEvent);
    
    // Subscribe and consume
    await this.consumerService.subscribe(['user-events', 'order-events']);
    await this.consumerService.consume();
  }
  
  async handleUserEvent(data) {
    console.log('Handling user event:', data.value);
    
    switch (data.value.action) {
      case 'signup':
        await this.processSignup(data.value);
        break;
      case 'login':
        await this.processLogin(data.value);
        break;
      default:
        console.log('Unknown action:', data.value.action);
    }
  }
  
  async handleOrderEvent(data) {
    console.log('Handling order event:', data.value);
    
    switch (data.value.status) {
      case 'created':
        await this.processOrderCreated(data.value);
        break;
      case 'completed':
        await this.processOrderCompleted(data.value);
        break;
      default:
        console.log('Unknown status:', data.value.status);
    }
  }
  
  async processSignup(data) {
    console.log('Processing signup:', data);
    // Your business logic
  }
  
  async processLogin(data) {
    console.log('Processing login:', data);
    // Your business logic
  }
  
  async processOrderCreated(data) {
    console.log('Processing order created:', data);
    // Your business logic
  }
  
  async processOrderCompleted(data) {
    console.log('Processing order completed:', data);
    // Your business logic
  }
  
  async shutdown() {
    console.log('Shutting down...');
    await this.consumerService.disconnect();
    await producerService.disconnect();
    process.exit(0);
  }
}

// Start application
const app = new Application();

process.on('SIGTERM', () => app.shutdown());
process.on('SIGINT', () => app.shutdown());

app.start().catch(console.error);
```

**Example: Sending messages**
```javascript
// src/examples/send-message.js
import producerService from '../services/producer.service.js';

async function sendUserEvent() {
  await producerService.sendMessage('user-events', {
    key: 'user-123',
    value: {
      userId: '123',
      action: 'signup',
      email: 'user@example.com',
      timestamp: new Date().toISOString()
    }
  });
}

async function sendOrderEvent() {
  await producerService.sendMessage('order-events', {
    key: 'order-456',
    value: {
      orderId: '456',
      userId: '123',
      status: 'created',
      amount: 99.99,
      timestamp: new Date().toISOString()
    }
  });
}

// Send messages
await sendUserEvent();
await sendOrderEvent();
await producerService.disconnect();
```

## NestJS Integration

### 1. Project Setup

```bash
# Create NestJS project
npm i -g @nestjs/cli
nest new kafka-nestjs-app

# Install dependencies
cd kafka-nestjs-app
npm install @nestjs/microservices kafkajs
```

### 2. Kafka Module

**src/kafka/kafka.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaProducerService } from './kafka-producer.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get('KAFKA_CLIENT_ID', 'nestjs-app'),
              brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            consumer: {
              groupId: configService.get('KAFKA_GROUP_ID', 'nestjs-consumer-group'),
            },
            producer: {
              allowAutoTopicCreation: true,
              idempotent: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
```

### 3. Producer Service

**src/kafka/kafka-producer.service.ts:**
```typescript
import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log('✓ Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
    this.logger.log('✓ Kafka producer disconnected');
  }

  async sendMessage<T>(topic: string, message: T): Promise<void> {
    try {
      await this.kafkaClient.emit(topic, message).toPromise();
      this.logger.log(`✓ Message sent to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`✗ Failed to send message to ${topic}:`, error);
      throw error;
    }
  }

  async sendMessageWithKey<T>(
    topic: string,
    key: string,
    message: T,
  ): Promise<void> {
    try {
      await this.kafkaClient
        .emit(topic, { key, value: message })
        .toPromise();
      this.logger.log(`✓ Message sent to topic: ${topic} with key: ${key}`);
    } catch (error) {
      this.logger.error(`✗ Failed to send message to ${topic}:`, error);
      throw error;
    }
  }
}
```

### 4. Consumer Controller

**src/events/events.controller.ts:**
```typescript
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';

interface UserEvent {
  userId: string;
  action: string;
  email?: string;
  timestamp: string;
}

interface OrderEvent {
  orderId: string;
  userId: string;
  status: string;
  amount: number;
  timestamp: string;
}

@Controller()
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  @EventPattern('user-events')
  async handleUserEvent(
    @Payload() message: UserEvent,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = context.getMessage();
    
    this.logger.log(
      `Received user event: ${topic} [${partition}] @ ${offset}`,
    );
    
    try {
      switch (message.action) {
        case 'signup':
          await this.handleSignup(message);
          break;
        case 'login':
          await this.handleLogin(message);
          break;
        default:
          this.logger.warn(`Unknown action: ${message.action}`);
      }
    } catch (error) {
      this.logger.error('Error processing user event:', error);
      throw error;
    }
  }

  @EventPattern('order-events')
  async handleOrderEvent(
    @Payload() message: OrderEvent,
    @Ctx() context: KafkaContext,
  ) {
    const { topic, partition, offset } = context.getMessage();
    
    this.logger.log(
      `Received order event: ${topic} [${partition}] @ ${offset}`,
    );
    
    try {
      switch (message.status) {
        case 'created':
          await this.handleOrderCreated(message);
          break;
        case 'completed':
          await this.handleOrderCompleted(message);
          break;
        default:
          this.logger.warn(`Unknown status: ${message.status}`);
      }
    } catch (error) {
      this.logger.error('Error processing order event:', error);
      throw error;
    }
  }

  private async handleSignup(data: UserEvent) {
    this.logger.log('Processing signup:', data);
    // Your business logic
  }

  private async handleLogin(data: UserEvent) {
    this.logger.log('Processing login:', data);
    // Your business logic
  }

  private async handleOrderCreated(data: OrderEvent) {
    this.logger.log('Processing order created:', data);
    // Your business logic
  }

  private async handleOrderCompleted(data: OrderEvent) {
    this.logger.log('Processing order completed:', data);
    // Your business logic
  }
}
```

### 5. Main Application

**src/main.ts:**
```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Create Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('KAFKA_CLIENT_ID', 'nestjs-app'),
        brokers: configService
          .get('KAFKA_BROKERS', 'localhost:9092')
          .split(','),
      },
      consumer: {
        groupId: configService.get('KAFKA_GROUP_ID', 'nestjs-consumer-group'),
        allowAutoTopicCreation: true,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
  
  console.log('✓ Application is running on: http://localhost:3000');
}

bootstrap();
```

### 6. REST API Example

**src/users/users.controller.ts:**
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

interface CreateUserDto {
  email: string;
  name: string;
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Save user to database
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      ...createUserDto,
      createdAt: new Date(),
    };

    // Publish event to Kafka
    await this.kafkaProducer.sendMessage('user-events', {
      userId: user.id,
      action: 'signup',
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    return user;
  }
}
```

### 7. Complete App Module

**src/app.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { EventsController } from './events/events.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KafkaModule,
  ],
  controllers: [EventsController, UsersController],
})
export class AppModule {}
```

## Microservices Architecture

### Complete Microservices Example

**Project Structure:**
```
microservices/
├── user-service/          # Handles user operations
├── order-service/         # Handles orders
├── notification-service/  # Sends notifications
├── payment-service/       # Processes payments
└── docker-compose.yml     # Infrastructure
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  user-service:
    build: ./user-service
    environment:
      KAFKA_BROKERS: kafka:29092
      KAFKA_GROUP_ID: user-service-group
    depends_on:
      - kafka

  order-service:
    build: ./order-service
    environment:
      KAFKA_BROKERS: kafka:29092
      KAFKA_GROUP_ID: order-service-group
    depends_on:
      - kafka

  notification-service:
    build: ./notification-service
    environment:
      KAFKA_BROKERS: kafka:29092
      KAFKA_GROUP_ID: notification-service-group
    depends_on:
      - kafka
```

### Event Flow Example

```typescript
// order-service: Create order and publish event
@Post('orders')
async createOrder(@Body() orderDto: CreateOrderDto) {
  const order = await this.orderService.create(orderDto);
  
  // Publish order.created event
  await this.kafkaProducer.sendMessage('order-events', {
    eventType: 'order.created',
    orderId: order.id,
    userId: order.userId,
    amount: order.amount,
    timestamp: new Date().toISOString(),
  });
  
  return order;
}

// payment-service: Listen for order.created
@EventPattern('order-events')
async handleOrderEvent(@Payload() event: any) {
  if (event.eventType === 'order.created') {
    // Process payment
    const payment = await this.paymentService.process(event);
    
    // Publish payment.completed event
    await this.kafkaProducer.sendMessage('payment-events', {
      eventType: 'payment.completed',
      orderId: event.orderId,
      paymentId: payment.id,
      status: 'success',
      timestamp: new Date().toISOString(),
    });
  }
}

// notification-service: Listen for multiple events
@EventPattern('order-events')
async handleOrderEvent(@Payload() event: any) {
  if (event.eventType === 'order.created') {
    await this.emailService.sendOrderConfirmation(event.userId, event.orderId);
  }
}

@EventPattern('payment-events')
async handlePaymentEvent(@Payload() event: any) {
  if (event.eventType === 'payment.completed') {
    await this.emailService.sendPaymentReceipt(event.orderId);
  }
}
```

## Real-World Examples

### Example 1: E-commerce Order Processing

```typescript
// order.service.ts
@Injectable()
export class OrderService {
  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    private readonly orderRepository: OrderRepository,
  ) {}

  async createOrder(orderData: CreateOrderDto) {
    // Start transaction
    const transaction = await this.orderRepository.startTransaction();
    
    try {
      // Create order
      const order = await this.orderRepository.create(orderData);
      
      // Publish events
      await this.kafkaProducer.sendMessage('order-events', {
        eventType: 'order.created',
        data: order,
      });
      
      await this.kafkaProducer.sendMessage('inventory-events', {
        eventType: 'inventory.reserve',
        orderId: order.id,
        items: order.items,
      });
      
      await transaction.commit();
      return order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

### Example 2: Real-time Analytics

```typescript
// analytics.controller.ts
@Controller()
export class AnalyticsController {
  private readonly stats = new Map();

  @EventPattern('user-events')
  async trackUserActivity(@Payload() event: any) {
    const action = event.action;
    const current = this.stats.get(action) || 0;
    this.stats.set(action, current + 1);
    
    // Store in time-series database
    await this.analyticsService.track(event);
  }

  @Get('stats')
  getStats() {
    return Object.fromEntries(this.stats);
  }
}
```

### Example 3: CDC (Change Data Capture)

```typescript
// database.service.ts
@Injectable()
export class DatabaseService {
  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  async updateUser(userId: string, updates: any) {
    const user = await this.userRepository.update(userId, updates);
    
    // Publish database change event
    await this.kafkaProducer.sendMessage('database-changes', {
      table: 'users',
      operation: 'UPDATE',
      before: updates,
      after: user,
      timestamp: new Date().toISOString(),
    });
    
    return user;
  }
}
```

## Testing

### Unit Testing

**producer.service.spec.ts:**
```typescript
import { Test } from '@nestjs/testing';
import { KafkaProducerService } from './kafka-producer.service';
import { ClientKafka } from '@nestjs/microservices';

describe('KafkaProducerService', () => {
  let service: KafkaProducerService;
  let kafkaClient: ClientKafka;

  beforeEach(async () => {
    const mockKafkaClient = {
      emit: jest.fn().mockReturnValue({ toPromise: jest.fn() }),
      connect: jest.fn(),
      close: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        KafkaProducerService,
        {
          provide: 'KAFKA_SERVICE',
          useValue: mockKafkaClient,
        },
      ],
    }).compile();

    service = module.get<KafkaProducerService>(KafkaProducerService);
    kafkaClient = module.get<ClientKafka>('KAFKA_SERVICE');
  });

  it('should send message', async () => {
    await service.sendMessage('test-topic', { data: 'test' });
    expect(kafkaClient.emit).toHaveBeenCalledWith('test-topic', { data: 'test' });
  });
});
```

### Integration Testing

```typescript
describe('Kafka Integration', () => {
  let app: INestApplication;
  let kafkaProducer: KafkaProducerService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.startAllMicroservices();
    
    kafkaProducer = app.get<KafkaProducerService>(KafkaProducerService);
  });

  it('should produce and consume message', async (done) => {
    const testMessage = { test: 'data' };
    
    await kafkaProducer.sendMessage('test-topic', testMessage);
    
    // Wait for consumption
    setTimeout(() => {
      // Verify message was consumed
      done();
    }, 1000);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## Deployment

### Environment Configuration

**.env.production:**
```env
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
KAFKA_CLIENT_ID=my-service
KAFKA_GROUP_ID=my-service-group
KAFKA_SSL_ENABLED=true
KAFKA_SASL_MECHANISM=PLAIN
KAFKA_SASL_USERNAME=your-username
KAFKA_SASL_PASSWORD=your-password
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Kubernetes Deployment

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: order-service:latest
        env:
        - name: KAFKA_BROKERS
          valueFrom:
            configMapKeyRef:
              name: kafka-config
              key: brokers
        - name: KAFKA_GROUP_ID
          value: "order-service-group"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Next Steps

- **[Best Practices](./06-kafka-best-practices.md)** - Production patterns and optimization tips
- **[Fundamentals](./01-kafka-fundamentals.md)** - Review core concepts
