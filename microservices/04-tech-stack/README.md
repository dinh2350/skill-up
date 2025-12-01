# Module 04: Tech Stack Examples & Implementation

## 🚀 Modern Microservices Tech Stacks

### Stack Comparison Matrix

| Technology | Java/Spring Boot | Node.js/NestJS | .NET Core | Golang |
|------------|------------------|----------------|-----------|---------|
| **Performance** | High | Medium-High | High | Excellent |
| **Ecosystem** | Mature | Large | Growing | Growing |
| **Learning Curve** | Medium | Easy | Medium | Easy |
| **Container Size** | Large | Small | Medium | Very Small |
| **Memory Usage** | High | Medium | Medium | Low |
| **Concurrency** | Thread-based | Event-loop | Thread/Async | Goroutines |

## ☕ Java/Spring Boot Implementation

### Project Structure
```
order-service/
├── src/main/java/com/company/order/
│   ├── OrderServiceApplication.java
│   ├── config/
│   │   ├── DatabaseConfig.java
│   │   └── MessageConfig.java
│   ├── controller/
│   │   └── OrderController.java
│   ├── service/
│   │   ├── OrderService.java
│   │   └── OrderSagaOrchestrator.java
│   ├── repository/
│   │   └── OrderRepository.java
│   ├── domain/
│   │   ├── Order.java
│   │   └── events/
│   │       ├── OrderCreated.java
│   │       └── OrderStatusChanged.java
│   └── infrastructure/
│       ├── messaging/
│       │   └── EventPublisher.java
│       └── resilience/
│           └── CircuitBreakerService.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│       └── V1__Create_orders_table.sql
└── pom.xml
```

### Main Application

```java
// OrderServiceApplication.java
@SpringBootApplication
@EnableJpaRepositories
@EnableEurekaClient
@EnableCircuitBreaker
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

### Domain Model with Event Sourcing

```java
// Order.java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    private String id;
    
    @Column(nullable = false)
    private String customerId;
    
    @Embedded
    private Money totalAmount;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    @ElementCollection(cascade = CascadeType.ALL)
    @CollectionTable(name = "order_items")
    private List<OrderItem> items = new ArrayList<>();
    
    @Version
    private Long version;
    
    @Transient
    private List<DomainEvent> domainEvents = new ArrayList<>();
    
    // Constructor, getters, setters
    
    public static Order create(String customerId, List<OrderItem> items, Money totalAmount) {
        Order order = new Order();
        order.id = UUID.randomUUID().toString();
        order.customerId = customerId;
        order.items = new ArrayList<>(items);
        order.totalAmount = totalAmount;
        order.status = OrderStatus.CREATED;
        
        order.addDomainEvent(new OrderCreated(
            order.id,
            order.customerId,
            order.items,
            order.totalAmount
        ));
        
        return order;
    }
    
    public void confirmPayment(String paymentId) {
        if (this.status != OrderStatus.CREATED) {
            throw new IllegalStateException("Cannot confirm payment for order in status: " + this.status);
        }
        
        this.status = OrderStatus.PAYMENT_CONFIRMED;
        addDomainEvent(new PaymentConfirmed(this.id, paymentId));
    }
    
    private void addDomainEvent(DomainEvent event) {
        this.domainEvents.add(event);
    }
    
    public List<DomainEvent> getDomainEvents() {
        return Collections.unmodifiableList(domainEvents);
    }
    
    public void clearDomainEvents() {
        this.domainEvents.clear();
    }
}
```

### Service Layer with Saga Pattern

```java
// OrderService.java
@Service
@Transactional
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final EventPublisher eventPublisher;
    private final PaymentServiceClient paymentServiceClient;
    
    public OrderService(OrderRepository orderRepository, 
                       EventPublisher eventPublisher,
                       PaymentServiceClient paymentServiceClient) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
        this.paymentServiceClient = paymentServiceClient;
    }
    
    public String createOrder(CreateOrderCommand command) {
        // Validate command
        validateCreateOrderCommand(command);
        
        // Create domain object
        Order order = Order.create(
            command.getCustomerId(),
            command.getItems(),
            command.getTotalAmount()
        );
        
        // Save to database
        order = orderRepository.save(order);
        
        // Publish domain events
        publishDomainEvents(order);
        
        return order.getId();
    }
    
    @EventHandler
    public void handle(PaymentProcessedEvent event) {
        Order order = orderRepository.findById(event.getOrderId())
            .orElseThrow(() -> new OrderNotFoundException(event.getOrderId()));
        
        order.confirmPayment(event.getPaymentId());
        orderRepository.save(order);
        
        publishDomainEvents(order);
    }
    
    private void publishDomainEvents(Order order) {
        order.getDomainEvents().forEach(eventPublisher::publish);
        order.clearDomainEvents();
    }
    
    private void validateCreateOrderCommand(CreateOrderCommand command) {
        if (command.getItems().isEmpty()) {
            throw new InvalidOrderException("Order must contain at least one item");
        }
        // Add more validations
    }
}
```

### Circuit Breaker Implementation

```java
// CircuitBreakerService.java
@Component
public class CircuitBreakerService {
    
    private final CircuitBreakerRegistry circuitBreakerRegistry;
    
    public CircuitBreakerService(CircuitBreakerRegistry circuitBreakerRegistry) {
        this.circuitBreakerRegistry = circuitBreakerRegistry;
    }
    
    @CircuitBreaker(name = "payment-service", fallbackMethod = "paymentFallback")
    @Retry(name = "payment-service")
    @TimeLimiter(name = "payment-service")
    public CompletableFuture<PaymentResult> processPayment(PaymentRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            // Call external payment service
            return paymentServiceClient.processPayment(request);
        });
    }
    
    public CompletableFuture<PaymentResult> paymentFallback(PaymentRequest request, Exception ex) {
        // Fallback logic
        return CompletableFuture.completedFuture(
            PaymentResult.failed("Payment service unavailable", request.getOrderId())
        );
    }
}
```

### Configuration

```yaml
# application.yml
server:
  port: 8080

spring:
  application:
    name: order-service
  datasource:
    url: jdbc:postgresql://localhost:5432/orders
    username: ${DB_USERNAME:orders}
    password: ${DB_PASSWORD:password}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      group-id: order-service
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.company.order.events"

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always

resilience4j:
  circuitbreaker:
    instances:
      payment-service:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
  retry:
    instances:
      payment-service:
        max-attempts: 3
        wait-duration: 1s
        exponential-backoff-multiplier: 2
  timelimiter:
    instances:
      payment-service:
        timeout-duration: 5s
```

## 🟢 Node.js/NestJS Implementation

### Project Structure
```
order-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── order/
│   │   ├── order.module.ts
│   │   ├── order.controller.ts
│   │   ├── order.service.ts
│   │   ├── order.entity.ts
│   │   ├── dto/
│   │   │   ├── create-order.dto.ts
│   │   │   └── order-response.dto.ts
│   │   ├── events/
│   │   │   ├── order-created.event.ts
│   │   │   └── payment-processed.event.ts
│   │   └── sagas/
│   │       └── order.saga.ts
│   ├── shared/
│   │   ├── database/
│   │   │   └── database.module.ts
│   │   ├── messaging/
│   │   │   ├── messaging.module.ts
│   │   │   └── event-publisher.service.ts
│   │   └── resilience/
│   │       └── circuit-breaker.service.ts
│   └── config/
│       └── configuration.ts
├── package.json
├── tsconfig.json
└── docker-compose.yml
```

### Main Application

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());
  
  // Configure microservice for event handling
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'order-service',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'order-service-consumer',
      },
    },
  });
  
  await app.startAllMicroservices();
  await app.listen(3000);
}

bootstrap();
```

### Domain Entity with TypeORM

```typescript
// order.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: ['CREATED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'CREATED'
  })
  status: string;

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;

  // Domain events (not persisted)
  private domainEvents: any[] = [];

  static create(customerId: string, items: OrderItem[], totalAmount: number): Order {
    const order = new Order();
    order.customerId = customerId;
    order.items = items;
    order.totalAmount = totalAmount;
    order.status = 'CREATED';

    order.addDomainEvent({
      type: 'OrderCreated',
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount,
      timestamp: new Date()
    });

    return order;
  }

  confirmPayment(paymentId: string): void {
    if (this.status !== 'CREATED') {
      throw new Error(`Cannot confirm payment for order in status: ${this.status}`);
    }

    this.status = 'PAYMENT_CONFIRMED';
    this.addDomainEvent({
      type: 'PaymentConfirmed',
      orderId: this.id,
      paymentId,
      timestamp: new Date()
    });
  }

  private addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): any[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
```

### Service with CQRS

```typescript
// order.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandBus, QueryBus, EventBus } from '@nestjs/cqrs';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderCommand } from './commands/create-order.command';
import { GetOrderQuery } from './queries/get-order.query';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private eventBus: EventBus,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<string> {
    const command = new CreateOrderCommand(
      createOrderDto.customerId,
      createOrderDto.items,
      createOrderDto.totalAmount
    );

    return await this.commandBus.execute(command);
  }

  async getOrder(orderId: string): Promise<Order> {
    const query = new GetOrderQuery(orderId);
    return await this.queryBus.execute(query);
  }
}

// Command Handler
@CommandHandler(CreateOrderCommand)
export class CreateOrderCommandHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private eventBus: EventBus,
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const order = Order.create(
      command.customerId,
      command.items,
      command.totalAmount
    );

    const savedOrder = await this.orderRepository.save(order);

    // Publish domain events
    const events = savedOrder.getDomainEvents();
    events.forEach(event => this.eventBus.publish(event));
    savedOrder.clearDomainEvents();

    return savedOrder.id;
  }
}
```

### Event-Driven Communication

```typescript
// order.saga.ts
import { Injectable } from '@nestjs/common';
import { Saga, ICommand, ofType } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OrderCreatedEvent } from '../events/order-created.event';
import { PaymentProcessedEvent } from '../events/payment-processed.event';
import { ProcessPaymentCommand } from '../commands/process-payment.command';

@Injectable()
export class OrderSaga {
  @Saga()
  orderCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(OrderCreatedEvent),
      map(event => new ProcessPaymentCommand(event.orderId, event.totalAmount))
    );
  };

  @Saga()
  paymentProcessed = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PaymentProcessedEvent),
      map(event => new ReserveInventoryCommand(event.orderId, event.items))
    );
  };
}

// Event Publisher
@Injectable()
export class EventPublisher {
  constructor(
    @Inject('KAFKA_CLIENT')
    private kafkaClient: ClientKafka,
  ) {}

  async publish(eventType: string, data: any): Promise<void> {
    await this.kafkaClient.emit(eventType, {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      data
    });
  }
}
```

### Circuit Breaker Implementation

```typescript
// circuit-breaker.service.ts
import { Injectable } from '@nestjs/common';

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

@Injectable()
export class CircuitBreakerService {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0;

  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 60000,
  ) {}

  async call<T>(
    serviceCall: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime! >= this.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        return this.executeFallback(fallback);
      }
    }

    try {
      const result = await serviceCall();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();

      if (this.state === CircuitState.OPEN) {
        return this.executeFallback(fallback);
      }

      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  private async executeFallback<T>(fallback?: () => Promise<T>): Promise<T> {
    if (fallback) {
      return await fallback();
    }
    throw new Error('Service unavailable');
  }
}
```

## 🐳 Containerization with Docker

### Multi-stage Dockerfile for Java

```dockerfile
# Build stage
FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:17-jre-slim
WORKDIR /app

# Add non-root user
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Copy application
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Multi-stage Dockerfile for Node.js

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Development dependencies for building
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine AS runtime
WORKDIR /app

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
```

## 🎛️ Kubernetes Deployment

### Service Deployment

```yaml
# order-service-deployment.yaml
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
      version: v1
  template:
    metadata:
      labels:
        app: order-service
        version: v1
    spec:
      containers:
      - name: order-service
        image: myregistry/order-service:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 45
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
      volumes:
      - name: config-volume
        configMap:
          name: order-service-config
      imagePullSecrets:
      - name: registry-secret

---
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: order-service-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  tls:
  - hosts:
    - api.company.com
    secretName: tls-secret
  rules:
  - host: api.company.com
    http:
      paths:
      - path: /orders
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 80
```

### HorizontalPodAutoscaler

```yaml
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

## 🔧 Development Tools & Best Practices

### Testing Strategy

```typescript
// order.service.spec.ts
describe('OrderService', () => {
  let service: OrderService;
  let repository: Repository<Order>;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get<Repository<Order>>(getRepositoryToken(Order));
    eventBus = module.get<EventBus>(EventBus);
  });

  describe('createOrder', () => {
    it('should create order and publish event', async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: 'customer-123',
        items: [{ productId: 'product-1', quantity: 2, price: 50 }],
        totalAmount: 100,
      };

      const mockOrder = { id: 'order-123', ...createOrderDto };
      jest.spyOn(repository, 'save').mockResolvedValue(mockOrder as Order);

      const result = await service.createOrder(createOrderDto);

      expect(repository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'OrderCreated',
          orderId: mockOrder.id,
        })
      );
      expect(result).toBe(mockOrder.id);
    });
  });
});
```

### API Documentation with OpenAPI

```typescript
// order.controller.ts
@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ 
    status: 201, 
    description: 'Order created successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data' 
  })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto
  ): Promise<OrderResponseDto> {
    const orderId = await this.orderService.createOrder(createOrderDto);
    const order = await this.orderService.getOrder(orderId);
    return OrderResponseDto.fromEntity(order);
  }
}

@ApiProperty({ example: 'customer-123' })
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  totalAmount: number;
}
```

## 🧪 Knowledge Check Quiz

### Question 1
Which technology stack is best for high-throughput, low-latency microservices?
a) Java/Spring Boot
b) Node.js/NestJS
c) Golang
d) .NET Core

<details>
<summary>Answer</summary>
c) Golang - Golang excels in high-throughput scenarios due to goroutines and efficient memory usage
</details>

### Question 2
What is the main advantage of multi-stage Docker builds?
a) Faster build times
b) Smaller final image size
c) Better security
d) All of the above

<details>
<summary>Answer</summary>
d) All of the above - Multi-stage builds reduce image size, improve security by not including build tools, and can be faster due to layer caching
</details>

### Question 3
Which pattern is best implemented using CQRS in NestJS?
a) Simple CRUD operations
b) Complex read/write operations with different optimization needs
c) Basic API endpoints
d) File upload services

<details>
<summary>Answer</summary>
b) Complex read/write operations with different optimization needs - CQRS shines when read and write models need different optimizations
</details>

## 🎯 Hands-on Project

**Task:** Build a complete Order Service using your preferred technology stack

**Requirements:**
1. **Domain Model**: Order aggregate with business rules
2. **API Layer**: RESTful endpoints with validation
3. **Event-Driven**: Publish events for order lifecycle
4. **Resilience**: Circuit breaker for external calls
5. **Observability**: Metrics, logging, and health checks
6. **Containerization**: Multi-stage Dockerfile
7. **Testing**: Unit and integration tests
8. **Documentation**: OpenAPI/Swagger specs

**Acceptance Criteria:**
- [ ] Order creation with validation
- [ ] Event publishing on state changes
- [ ] Circuit breaker for payment service calls
- [ ] Prometheus metrics exposure
- [ ] Health check endpoints
- [ ] 80%+ test coverage
- [ ] Container image < 200MB
- [ ] API documentation generated

**Next Module:** [DevOps & Deployment](../05-devops/) - Learn CI/CD, Infrastructure as Code, and deployment patterns.