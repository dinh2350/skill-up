# Module 03: Architecture Patterns & Best Practices

## 🔄 Saga Pattern

The Saga pattern manages transactions across multiple microservices by breaking them into a sequence of smaller transactions, each with a corresponding compensating action.

### Types of Sagas

#### 1. Choreography Saga
Services communicate through events without a central coordinator.

```
Order Service → OrderCreated Event
                     ↓
Payment Service → PaymentProcessed Event
                     ↓
Inventory Service → InventoryReserved Event
                     ↓
Shipping Service → ShippingScheduled Event
```

**Implementation Example:**

```javascript
// Order Service
class OrderService {
  async createOrder(orderData) {
    const order = await this.orderRepository.save({
      ...orderData,
      status: 'PENDING'
    });
    
    // Publish event to start saga
    await this.eventBus.publish('OrderCreated', {
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount
    });
    
    return order;
  }
  
  // Compensating action
  async handlePaymentFailed(event) {
    await this.orderRepository.updateStatus(event.orderId, 'CANCELLED');
    await this.eventBus.publish('OrderCancelled', { orderId: event.orderId });
  }
}

// Payment Service
class PaymentService {
  constructor() {
    this.eventBus.subscribe('OrderCreated', this.processPayment.bind(this));
    this.eventBus.subscribe('InventoryFailed', this.refundPayment.bind(this));
  }
  
  async processPayment(event) {
    try {
      const payment = await this.paymentProcessor.charge(
        event.customerId, 
        event.totalAmount
      );
      
      await this.eventBus.publish('PaymentProcessed', {
        orderId: event.orderId,
        paymentId: payment.id,
        amount: event.totalAmount
      });
    } catch (error) {
      await this.eventBus.publish('PaymentFailed', {
        orderId: event.orderId,
        reason: error.message
      });
    }
  }
  
  // Compensating action
  async refundPayment(event) {
    await this.paymentProcessor.refund(event.paymentId);
    await this.eventBus.publish('PaymentRefunded', { orderId: event.orderId });
  }
}
```

#### 2. Orchestration Saga
A central orchestrator manages the saga execution.

```
       Saga Orchestrator
            │
    ┌───────┼───────┐
    │       │       │
    ▼       ▼       ▼
Order   Payment  Inventory
Service Service  Service
```

**Implementation Example:**

```javascript
class OrderSagaOrchestrator {
  async executeOrderSaga(orderData) {
    const sagaId = generateId();
    
    try {
      // Step 1: Create Order
      const order = await this.orderService.createOrder(orderData);
      await this.saveSagaStep(sagaId, 'ORDER_CREATED', { orderId: order.id });
      
      // Step 2: Process Payment
      const payment = await this.paymentService.processPayment(
        orderData.customerId, 
        orderData.totalAmount
      );
      await this.saveSagaStep(sagaId, 'PAYMENT_PROCESSED', { paymentId: payment.id });
      
      // Step 3: Reserve Inventory
      await this.inventoryService.reserveItems(orderData.items);
      await this.saveSagaStep(sagaId, 'INVENTORY_RESERVED');
      
      // Step 4: Schedule Shipping
      await this.shippingService.scheduleShipment(order.id);
      await this.saveSagaStep(sagaId, 'SHIPPING_SCHEDULED');
      
      return { success: true, orderId: order.id };
      
    } catch (error) {
      // Execute compensating actions in reverse order
      await this.executeCompensation(sagaId);
      throw error;
    }
  }
  
  async executeCompensation(sagaId) {
    const steps = await this.getSagaSteps(sagaId);
    
    for (const step of steps.reverse()) {
      switch (step.action) {
        case 'SHIPPING_SCHEDULED':
          await this.shippingService.cancelShipment(step.data.orderId);
          break;
        case 'INVENTORY_RESERVED':
          await this.inventoryService.releaseReservation(step.data.items);
          break;
        case 'PAYMENT_PROCESSED':
          await this.paymentService.refundPayment(step.data.paymentId);
          break;
        case 'ORDER_CREATED':
          await this.orderService.cancelOrder(step.data.orderId);
          break;
      }
    }
  }
}
```

### Saga Pattern Comparison

| Aspect | Choreography | Orchestration |
|--------|-------------|---------------|
| Complexity | Higher | Lower |
| Coupling | Loose | Tighter |
| Monitoring | Harder | Easier |
| Failure Handling | Distributed | Centralized |
| Performance | Better | Slightly worse |

## 🔄 CQRS (Command Query Responsibility Segregation)

CQRS separates read and write operations into different models.

### Traditional Approach
```
┌─────────────┐    CRUD     ┌─────────────┐
│   Client    │◄──────────►│   Single    │
│             │   Operations│   Model     │
└─────────────┘             └─────────────┘
                                   │
                            ┌─────────────┐
                            │  Database   │
                            └─────────────┘
```

### CQRS Approach
```
┌─────────────┐   Commands   ┌─────────────┐
│   Client    │─────────────►│ Write Model │
└─────────────┘              └─────────────┘
       │                            │
       │                     Events │
       │ Queries                    ▼
       │          ┌─────────────┐ Events ┌─────────────┐
       └─────────►│ Read Model  │◄───────│Event Store  │
                  └─────────────┘        └─────────────┘
```

### Implementation Example

```javascript
// Command Side (Write Model)
class OrderCommand {
  constructor(orderRepository, eventBus) {
    this.orderRepository = orderRepository;
    this.eventBus = eventBus;
  }
  
  async createOrder(command) {
    const order = new Order(
      command.customerId,
      command.items,
      command.totalAmount
    );
    
    await this.orderRepository.save(order);
    
    // Publish domain event
    await this.eventBus.publish('OrderCreated', {
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount,
      timestamp: new Date()
    });
    
    return order.id;
  }
  
  async updateOrderStatus(command) {
    const order = await this.orderRepository.findById(command.orderId);
    order.updateStatus(command.status);
    
    await this.orderRepository.save(order);
    
    await this.eventBus.publish('OrderStatusUpdated', {
      orderId: order.id,
      status: order.status,
      timestamp: new Date()
    });
  }
}

// Query Side (Read Model)
class OrderQuery {
  constructor(orderViewRepository, eventBus) {
    this.orderViewRepository = orderViewRepository;
    
    // Subscribe to events to update read model
    eventBus.subscribe('OrderCreated', this.handleOrderCreated.bind(this));
    eventBus.subscribe('OrderStatusUpdated', this.handleOrderStatusUpdated.bind(this));
  }
  
  async getOrderById(orderId) {
    return await this.orderViewRepository.findById(orderId);
  }
  
  async getOrdersByCustomer(customerId) {
    return await this.orderViewRepository.findByCustomerId(customerId);
  }
  
  async getOrderSummary(filters) {
    return await this.orderViewRepository.findWithFilters(filters);
  }
  
  // Event handlers to update read model
  async handleOrderCreated(event) {
    const orderView = {
      id: event.orderId,
      customerId: event.customerId,
      items: event.items,
      totalAmount: event.totalAmount,
      status: 'CREATED',
      createdAt: event.timestamp
    };
    
    await this.orderViewRepository.save(orderView);
  }
  
  async handleOrderStatusUpdated(event) {
    await this.orderViewRepository.updateStatus(event.orderId, event.status);
  }
}
```

## 📡 Event Sourcing

Event Sourcing stores all changes to application state as a sequence of events.

### Traditional State Storage vs Event Sourcing

```
Traditional:
┌─────────────────────┐
│ Order ID: 123       │
│ Status: SHIPPED     │
│ Total: $99.99       │
│ Customer: John      │
└─────────────────────┘

Event Sourcing:
┌─────────────────────┐
│ OrderCreated        │
│ PaymentProcessed    │
│ ItemsReserved       │
│ OrderShipped        │
└─────────────────────┘
```

### Implementation Example

```javascript
// Event Store
class EventStore {
  constructor(database) {
    this.database = database;
  }
  
  async saveEvent(aggregateId, event, expectedVersion) {
    const eventData = {
      aggregateId,
      eventType: event.constructor.name,
      eventData: JSON.stringify(event),
      eventVersion: expectedVersion + 1,
      timestamp: new Date()
    };
    
    await this.database.events.insert(eventData);
  }
  
  async getEvents(aggregateId, fromVersion = 0) {
    return await this.database.events.find({
      aggregateId,
      eventVersion: { $gt: fromVersion }
    }).sort({ eventVersion: 1 });
  }
}

// Aggregate Root
class Order {
  constructor() {
    this.id = null;
    this.customerId = null;
    this.items = [];
    this.status = null;
    this.totalAmount = 0;
    this.version = 0;
    this.uncommittedEvents = [];
  }
  
  // Command Methods
  static create(customerId, items, totalAmount) {
    const order = new Order();
    order.applyEvent(new OrderCreated(
      generateId(),
      customerId,
      items,
      totalAmount
    ));
    return order;
  }
  
  processPayment(paymentId, amount) {
    if (this.status !== 'CREATED') {
      throw new Error('Cannot process payment for order in current status');
    }
    
    this.applyEvent(new PaymentProcessed(this.id, paymentId, amount));
  }
  
  ship(trackingNumber) {
    if (this.status !== 'PAID') {
      throw new Error('Cannot ship order that is not paid');
    }
    
    this.applyEvent(new OrderShipped(this.id, trackingNumber));
  }
  
  // Event Application
  applyEvent(event) {
    this.apply(event);
    this.uncommittedEvents.push(event);
  }
  
  apply(event) {
    switch (event.constructor.name) {
      case 'OrderCreated':
        this.id = event.orderId;
        this.customerId = event.customerId;
        this.items = event.items;
        this.totalAmount = event.totalAmount;
        this.status = 'CREATED';
        break;
      
      case 'PaymentProcessed':
        this.status = 'PAID';
        break;
      
      case 'OrderShipped':
        this.status = 'SHIPPED';
        break;
    }
    
    this.version++;
  }
  
  // Rebuild from events
  static fromEvents(events) {
    const order = new Order();
    events.forEach(event => order.apply(event));
    return order;
  }
}

// Events
class OrderCreated {
  constructor(orderId, customerId, items, totalAmount) {
    this.orderId = orderId;
    this.customerId = customerId;
    this.items = items;
    this.totalAmount = totalAmount;
  }
}

class PaymentProcessed {
  constructor(orderId, paymentId, amount) {
    this.orderId = orderId;
    this.paymentId = paymentId;
    this.amount = amount;
  }
}

class OrderShipped {
  constructor(orderId, trackingNumber) {
    this.orderId = orderId;
    this.trackingNumber = trackingNumber;
  }
}
```

## ⚡ Circuit Breaker Pattern

The Circuit Breaker pattern prevents cascading failures by monitoring service calls and stopping calls to failing services.

### Circuit States

```
┌─────────────┐    failures > threshold    ┌─────────────┐
│   CLOSED    │──────────────────────────►│    OPEN     │
│ (Normal)    │                           │ (Blocking)  │
└─────────────┘                           └─────────────┘
       ▲                                         │
       │                                         │
       │ success                                 │ timeout
       │                                         ▼
┌─────────────┐                           ┌─────────────┐
│ HALF_OPEN   │◄──────────────────────────│    OPEN     │
│ (Testing)   │     after timeout         │ (Waiting)   │
└─────────────┘                           └─────────────┘
```

### Implementation Example

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
  
  async call(serviceCall, fallback = null) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
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
      
      if (this.state === 'OPEN') {
        return this.executeFallback(fallback);
      }
      
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require multiple successes
        this.state = 'CLOSED';
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  executeFallback(fallback) {
    if (fallback) {
      return fallback();
    }
    throw new Error('Service unavailable');
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Usage Example
const userServiceBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000
});

class OrderService {
  async createOrder(orderData) {
    const user = await userServiceBreaker.call(
      () => this.userService.getUser(orderData.customerId),
      () => ({ id: orderData.customerId, name: 'Anonymous' }) // Fallback
    );
    
    // Continue with order creation
    return this.processOrder(orderData, user);
  }
}
```

## 🔄 Retry Patterns

### Exponential Backoff with Jitter

```javascript
class RetryService {
  async callWithRetry(serviceCall, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000;
    const maxDelay = options.maxDelay || 10000;
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await serviceCall();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  isRetryableError(error) {
    return error.code === 'ECONNRESET' || 
           error.status === 500 ||
           error.status === 502 ||
           error.status === 503 ||
           error.status === 504;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 🕸️ Service Mesh

Service mesh provides infrastructure for service-to-service communication.

### Service Mesh Architecture

```
┌─────────────────────────────────────────────────────┐
│                Control Plane                        │
│         (Istio, Linkerd, Consul Connect)           │
└─────────────────────────────────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Service │◄──────►│ Service │◄──────►│ Service │
│    A    │  Proxy  │    B    │  Proxy  │    C    │
└─────────┘         └─────────┘         └─────────┘
    │                   │                   │
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Sidecar │         │ Sidecar │         │ Sidecar │
│  Proxy  │         │  Proxy  │         │  Proxy  │
└─────────┘         └─────────┘         └─────────┘
```

### Istio Service Mesh Example

```yaml
# Virtual Service for routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - match:
    - headers:
        version:
          exact: v2
    route:
    - destination:
        host: order-service
        subset: v2
  - route:
    - destination:
        host: order-service
        subset: v1

---
# Destination Rule for load balancing
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

## 📊 Observability & Monitoring

### Three Pillars of Observability

#### 1. Metrics
Numerical measurements over time.

```javascript
const prometheus = require('prom-client');

// Custom metrics
const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path)
      .observe(duration);
  });
  
  next();
});
```

#### 2. Logging
Structured records of events.

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'order-service',
    version: process.env.SERVICE_VERSION 
  },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Structured logging example
logger.info('Order created', {
  orderId: 'order-123',
  customerId: 'user-456',
  amount: 99.99,
  correlationId: req.headers['x-correlation-id']
});
```

#### 3. Distributed Tracing
Tracks requests across multiple services.

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Initialize tracing
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'order-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();

// Custom spans
const { trace } = require('@opentelemetry/api');

async function processOrder(orderData) {
  const tracer = trace.getTracer('order-service');
  
  return tracer.startActiveSpan('process_order', async (span) => {
    try {
      span.setAttributes({
        'order.id': orderData.id,
        'order.customer_id': orderData.customerId,
        'order.amount': orderData.totalAmount
      });
      
      const result = await this.orderRepository.save(orderData);
      span.setStatus({ code: trace.SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: trace.SpanStatusCode.ERROR, 
        message: error.message 
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### Monitoring Stack Example

```yaml
# Prometheus configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'microservices'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true

---
# Grafana Dashboard
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboard
data:
  microservices-dashboard.json: |
    {
      "dashboard": {
        "title": "Microservices Metrics",
        "panels": [
          {
            "title": "Request Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total[5m])"
              }
            ]
          },
          {
            "title": "Response Time",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
              }
            ]
          }
        ]
      }
    }
```

## 🧪 Knowledge Check Quiz

### Question 1
Which Saga pattern provides better monitoring capabilities?
a) Choreography
b) Orchestration
c) Both are equal
d) Neither supports monitoring

<details>
<summary>Answer</summary>
b) Orchestration - Having a central coordinator makes it easier to monitor saga execution and handle failures
</details>

### Question 2
What is the main benefit of CQRS?
a) Reduces database size
b) Eliminates the need for events
c) Optimizes read and write operations separately
d) Simplifies code structure

<details>
<summary>Answer</summary>
c) Optimizes read and write operations separately - CQRS allows you to optimize read models for queries and write models for commands independently
</details>

### Question 3
When should a Circuit Breaker transition from HALF_OPEN to CLOSED?
a) After the timeout expires
b) On the first successful call
c) After several consecutive successful calls
d) When failure count resets

<details>
<summary>Answer</summary>
c) After several consecutive successful calls - Multiple successes ensure the downstream service has recovered before fully opening the circuit
</details>

## 🎯 Mini-Assignment

**Task:** Implement resilience patterns for a payment service

**Requirements:**
1. Implement a Circuit Breaker for external payment API calls
2. Design a Saga for the order payment process
3. Add retry logic with exponential backoff
4. Implement structured logging and metrics
5. Design compensating actions for payment failures

**Deliverable:** 
- Circuit breaker implementation
- Saga orchestrator code
- Monitoring and logging configuration
- Failure scenarios documentation

**Next Module:** [Tech Stack Examples & Implementation](../04-tech-stack/) - Learn practical implementations using modern technologies.