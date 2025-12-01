# Microservices Architecture: Interactive Examples & Templates

## 🎯 Hands-On Code Examples

### 1. Simple E-Commerce Order Service (Node.js/TypeScript)

This example demonstrates a complete order service with proper microservices patterns.

```typescript
// order.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column('json')
  items: OrderItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Domain methods
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Order can only be confirmed when pending');
    }
    this.status = OrderStatus.CONFIRMED;
  }

  ship(): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new Error('Order must be confirmed before shipping');
    }
    this.status = OrderStatus.SHIPPED;
  }

  cancel(): void {
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(this.status)) {
      throw new Error('Cannot cancel delivered or already cancelled order');
    }
    this.status = OrderStatus.CANCELLED;
  }
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

```typescript
// order.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CircuitBreakerService } from '../common/circuit-breaker.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private eventEmitter: EventEmitter2,
    private circuitBreaker: CircuitBreakerService
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // Validate customer exists (with circuit breaker)
    const customer = await this.circuitBreaker.call(
      'user-service',
      () => this.userService.getCustomer(createOrderDto.customerId),
      () => ({ id: createOrderDto.customerId, name: 'Anonymous' }) // Fallback
    );

    // Calculate total
    const totalAmount = createOrderDto.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice), 0
    );

    // Create order
    const order = this.orderRepository.create({
      customerId: customer.id,
      items: createOrderDto.items,
      totalAmount,
      status: OrderStatus.PENDING
    });

    const savedOrder = await this.orderRepository.save(order);

    // Emit domain event
    this.eventEmitter.emit('order.created', {
      orderId: savedOrder.id,
      customerId: savedOrder.customerId,
      items: savedOrder.items,
      totalAmount: savedOrder.totalAmount
    });

    return savedOrder;
  }

  async getOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrder(orderId);
    
    switch (status) {
      case OrderStatus.CONFIRMED:
        order.confirm();
        break;
      case OrderStatus.SHIPPED:
        order.ship();
        break;
      case OrderStatus.CANCELLED:
        order.cancel();
        break;
      default:
        throw new Error(`Invalid status transition: ${status}`);
    }

    const updatedOrder = await this.orderRepository.save(order);

    // Emit status change event
    this.eventEmitter.emit('order.status.changed', {
      orderId: updatedOrder.id,
      oldStatus: order.status,
      newStatus: status
    });

    return updatedOrder;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' }
    });
  }
}
```

### 2. Event-Driven Saga Implementation

```typescript
// order.saga.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface SagaStep {
  execute(): Promise<void>;
  compensate(): Promise<void>;
}

@Injectable()
export class OrderSaga {
  private readonly logger = new Logger(OrderSaga.name);
  private sagaSteps = new Map<string, SagaStep[]>();

  constructor(
    @InjectQueue('payment') private paymentQueue: Queue,
    @InjectQueue('inventory') private inventoryQueue: Queue,
    @InjectQueue('shipping') private shippingQueue: Queue
  ) {}

  @OnEvent('order.created')
  async handleOrderCreated(event: any) {
    const sagaId = `saga-${event.orderId}`;
    this.logger.log(`Starting saga ${sagaId} for order ${event.orderId}`);

    try {
      // Step 1: Reserve Inventory
      await this.reserveInventory(event);
      
      // Step 2: Process Payment
      await this.processPayment(event);
      
      // Step 3: Create Shipment
      await this.createShipment(event);
      
      this.logger.log(`Saga ${sagaId} completed successfully`);
    } catch (error) {
      this.logger.error(`Saga ${sagaId} failed: ${error.message}`);
      await this.compensate(sagaId, error);
    }
  }

  private async reserveInventory(event: any): Promise<void> {
    await this.inventoryQueue.add('reserve', {
      orderId: event.orderId,
      items: event.items
    }, {
      attempts: 3,
      backoff: 'exponential',
      delay: 1000
    });
  }

  private async processPayment(event: any): Promise<void> {
    await this.paymentQueue.add('process', {
      orderId: event.orderId,
      customerId: event.customerId,
      amount: event.totalAmount
    }, {
      attempts: 3,
      backoff: 'exponential',
      delay: 2000
    });
  }

  private async createShipment(event: any): Promise<void> {
    await this.shippingQueue.add('create', {
      orderId: event.orderId,
      customerId: event.customerId,
      items: event.items
    });
  }

  private async compensate(sagaId: string, error: Error): Promise<void> {
    const steps = this.sagaSteps.get(sagaId) || [];
    
    // Execute compensation in reverse order
    for (let i = steps.length - 1; i >= 0; i--) {
      try {
        await steps[i].compensate();
      } catch (compensationError) {
        this.logger.error(`Compensation failed for step ${i}: ${compensationError.message}`);
      }
    }
  }
}
```

### 3. Monitoring & Health Checks

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () => this.checkExternalServices()
    ]);
  }

  @Get('liveness')
  @HealthCheck()
  liveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024)
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkExternalServices()
    ]);
  }

  private async checkExternalServices() {
    // Custom health check for external dependencies
    const services = ['user-service', 'payment-service', 'inventory-service'];
    const results = await Promise.allSettled(
      services.map(service => this.pingService(service))
    );

    const healthyServices = results.filter(result => result.status === 'fulfilled').length;
    const isHealthy = healthyServices >= Math.ceil(services.length * 0.7); // 70% threshold

    return {
      'external-services': {
        status: isHealthy ? 'up' : 'down',
        healthy: healthyServices,
        total: services.length
      }
    };
  }

  private async pingService(serviceName: string): Promise<void> {
    // Implementation to ping external services
    // This could use service discovery to get the actual endpoint
    return Promise.resolve();
  }
}
```

## 🛠️ Project Templates

### Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'
services:
  # API Gateway
  api-gateway:
    image: kong:latest
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/declarative/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    volumes:
      - ./kong.yml:/kong/declarative/kong.yml
    ports:
      - "8000:8000"
      - "8001:8001"

  # Databases
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: microservices
      POSTGRES_PASSWORD: password
      POSTGRES_DB: microservices
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Message Broker
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"

  # Microservices
  order-service:
    build: ./services/order-service
    environment:
      - DATABASE_URL=postgresql://microservices:password@postgres:5432/orders
      - REDIS_URL=redis://redis:6379
      - KAFKA_BROKERS=kafka:9092
      - JAEGER_ENDPOINT=http://jaeger:14268/api/traces
    ports:
      - "3001:3000"
    depends_on:
      - postgres
      - redis
      - kafka

  user-service:
    build: ./services/user-service
    environment:
      - DATABASE_URL=postgresql://microservices:password@postgres:5432/users
      - REDIS_URL=redis://redis:6379
    ports:
      - "3002:3000"
    depends_on:
      - postgres
      - redis

  payment-service:
    build: ./services/payment-service
    environment:
      - DATABASE_URL=postgresql://microservices:password@postgres:5432/payments
      - KAFKA_BROKERS=kafka:9092
    ports:
      - "3003:3000"
    depends_on:
      - postgres
      - kafka

volumes:
  postgres_data:
  grafana_data:
```

### Kubernetes Deployment Template

```yaml
# k8s/order-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  labels:
    app: order-service
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "3000"
    spec:
      containers:
      - name: order-service
        image: order-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: order-service-secrets
              key: database-url
        - name: KAFKA_BROKERS
          value: "kafka:9092"
        - name: REDIS_URL
          value: "redis://redis:6379"
        livenessProbe:
          httpGet:
            path: /health/liveness
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: order-service
  labels:
    app: order-service
spec:
  selector:
    app: order-service
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 📊 Architecture Decision Records (ADRs)

### ADR-001: Event Sourcing for Order Management

```markdown
# ADR-001: Event Sourcing for Order Management

## Status
Accepted

## Context
We need to track the complete lifecycle of orders for audit purposes and enable 
complex business logic around order state transitions.

## Decision
We will use Event Sourcing for the Order domain, storing all state changes as events.

## Consequences

### Positive
- Complete audit trail
- Temporal queries possible
- Easy to replay events for debugging
- Natural fit for CQRS

### Negative
- Increased complexity
- Event schema evolution challenges
- Higher storage requirements
- Eventual consistency

## Implementation
- Events stored in Kafka with topic per aggregate
- Event store implemented using Kafka + PostgreSQL projection
- Snapshots every 100 events for performance
```

### ADR-002: API Gateway Technology Choice

```markdown
# ADR-002: API Gateway Technology Choice

## Status
Accepted

## Context
Need to choose between Kong, Istio Service Mesh, and AWS API Gateway for our 
microservices architecture.

## Decision
Use Kong for API Gateway with Istio for service mesh internally.

## Consequences

### Positive
- Kong provides rich plugin ecosystem
- Istio handles internal service communication
- Clear separation of concerns
- Good performance characteristics

### Negative
- Operational complexity of running two systems
- Learning curve for both technologies
- Potential vendor lock-in

## Alternatives Considered
- AWS API Gateway: Too much vendor lock-in
- Istio only: Less mature for external API management
- Kong only: Lacks advanced service mesh features
```

## 🎯 Learning Exercises

### Exercise 1: Design a Chat Application Microservices

**Scenario**: Design microservices for a Slack-like chat application.

**Requirements**:
- Real-time messaging
- Multiple workspaces
- File sharing
- User presence
- Message search
- Push notifications

**Your Task**:
1. Identify the microservices
2. Design the data model for each service
3. Plan the communication patterns
4. Consider scalability challenges

**Expected Services**:
- User Service
- Workspace Service
- Channel Service
- Message Service
- Presence Service
- Notification Service
- File Service
- Search Service

### Exercise 2: Implement Circuit Breaker Pattern

**Task**: Implement a circuit breaker with the following states:
- CLOSED: Normal operation
- OPEN: Failing fast
- HALF_OPEN: Testing if service recovered

**Requirements**:
- Configurable failure threshold
- Configurable timeout
- Metrics collection
- Fallback support

**Bonus**: Add jitter to prevent thundering herd problem.

### Exercise 3: Design Saga for E-commerce Checkout

**Scenario**: Design a saga for the checkout process:
1. Validate cart
2. Apply discounts
3. Reserve inventory
4. Process payment
5. Create shipment
6. Send confirmation

**Requirements**:
- Handle partial failures
- Implement compensation logic
- Add timeout handling
- Log saga execution

## 🧪 Testing Strategies

### Unit Testing Microservices

```typescript
// order.service.spec.ts
describe('OrderService', () => {
  let service: OrderService;
  let repository: MockRepository<Order>;

  beforeEach(() => {
    const module = Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useFactory: () => ({
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn()
          })
        }
      ]
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get(getRepositoryToken(Order));
  });

  describe('createOrder', () => {
    it('should create order with correct total', async () => {
      const orderDto = {
        customerId: 'user-123',
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10 },
          { productId: 'prod-2', quantity: 1, unitPrice: 20 }
        ]
      };

      const mockOrder = { id: 'order-123', totalAmount: 40 };
      repository.create.mockReturnValue(mockOrder);
      repository.save.mockResolvedValue(mockOrder);

      const result = await service.createOrder(orderDto);

      expect(result.totalAmount).toBe(40);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 40 })
      );
    });
  });
});
```

### Integration Testing

```typescript
// order.integration.spec.ts
describe('Order Integration Tests', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture = Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = moduleFixture.get(Connection);
  });

  beforeEach(async () => {
    await connection.synchronize(true); // Reset database
  });

  it('/orders (POST) should create order', () => {
    return request(app.getHttpServer())
      .post('/orders')
      .send({
        customerId: 'user-123',
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: 10 }]
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.totalAmount).toBe(10);
        expect(res.body.status).toBe('PENDING');
      });
  });
});
```

This comprehensive learning path provides you with all the tools, patterns, and real-world examples you need to master microservices architecture. Start with the basics, practice with the code examples, and gradually build your expertise through hands-on projects.