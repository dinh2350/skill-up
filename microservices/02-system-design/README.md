# Module 02: System Design Deep Dive

## 🏗️ Bounded Contexts & Domain-Driven Design

### What is Domain-Driven Design (DDD)?

Domain-Driven Design is an approach to software development that focuses on the core domain and domain logic, based on a model of the domain.

### Key DDD Concepts

#### 1. Domain
The sphere of knowledge, influence, or activity around which the application logic revolves.

#### 2. Bounded Context
A central pattern in DDD that defines the boundaries within which a domain model is applicable.

```
┌─────────────────────────────────────────────────────┐
│                 E-Commerce Domain                   │
│  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │   Sales Context │  │    Inventory Context    │   │
│  │                 │  │                         │   │
│  │ • Customer      │  │ • Product               │   │
│  │ • Order         │  │ • Stock                 │   │
│  │ • Payment       │  │ • Warehouse             │   │
│  └─────────────────┘  └─────────────────────────┘   │
│  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │Shipping Context │  │   Support Context       │   │
│  │                 │  │                         │   │
│  │ • Shipment      │  │ • Ticket                │   │
│  │ • Carrier       │  │ • Customer (different)  │   │
│  │ • Tracking      │  │ • Agent                 │   │
│  └─────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### 3. Ubiquitous Language
A common, rigorous language between developers and users, structured around the domain model.

#### 4. Aggregates
A cluster of domain objects that can be treated as a single unit for data changes.

#### 5. Context Map
Shows the contact between bounded contexts and teams.

### Context Mapping Patterns

#### 1. Partnership
Two teams cooperate and succeed/fail together.

#### 2. Shared Kernel
Two teams share a common model subset.

#### 3. Customer/Supplier
Upstream team serves downstream team.

#### 4. Conformist
Downstream team conforms to upstream model.

#### 5. Anti-Corruption Layer
Defensive mechanism to protect downstream model.

```
┌─────────────┐    ACL    ┌─────────────┐
│  Legacy     │◄─────────►│   Modern    │
│  System     │           │  Service    │
└─────────────┘           └─────────────┘
```

## 🔄 Service Boundaries & Communication

### Defining Service Boundaries

#### 1. Business Capability Approach
Services organized around what the business does.

```
Business Capabilities:
├── Customer Management
├── Product Catalog
├── Order Management
├── Payment Processing
├── Inventory Management
└── Shipping & Delivery
```

#### 2. Data Cohesion Approach
Services that work with related data stay together.

#### 3. Team Structure Approach (Conway's Law)
Service boundaries follow team communication patterns.

### Service Size Guidelines

- **Two Pizza Rule**: Team should be fed by two pizzas (6-10 people)
- **Single Responsibility**: One reason to change
- **Database Transactions**: If you need transactions across services, they might be too small

### Communication Patterns

#### 1. Synchronous Communication

**REST APIs**
```http
GET /api/v1/users/123
POST /api/v1/orders
PUT /api/v1/products/456
DELETE /api/v1/inventory/789
```

**GraphQL**
```graphql
query {
  user(id: "123") {
    name
    email
    orders {
      id
      status
      items {
        product {
          name
          price
        }
        quantity
      }
    }
  }
}
```

**gRPC**
```protobuf
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

#### 2. Asynchronous Communication

**Message Queues (Point-to-Point)**
```
Producer → [Queue] → Consumer
```

**Publish-Subscribe**
```
Publisher → [Topic] → Subscriber 1
                  → Subscriber 2
                  → Subscriber 3
```

**Event Streaming**
```
Producer → [Event Stream] → Consumer 1
                        → Consumer 2
                        → Consumer 3
```

### Communication Anti-Patterns

❌ **Chatty Services**
```
Service A → Service B → Service C → Service D
         ↑                          ↓
         └──────────Service E ←──────┘
```

❌ **Shared Database**
```
Service A ──┐
            ├── Shared Database
Service B ──┘
```

❌ **Data Pumping**
```
Service A → (All User Data) → Service B
```

✅ **Better Patterns**
```
Service A → (User ID only) → Service B
Service B → Cache/Local Store for needed data
```

## 🚪 API Gateway Patterns

### What is an API Gateway?

An API Gateway is a server that acts as an API front-end, receives API requests, enforces throttling and security policies, passes requests to the back-end service and then passes the response back to the requester.

### API Gateway Responsibilities

```
┌─────────────────────────────────────────────────────┐
│                 API Gateway                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Request   │  │    Rate     │  │    Auth     │ │
│  │   Routing   │  │  Limiting   │  │ & Security  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Response  │  │   Caching   │  │   Logging   │ │
│  │Aggregation  │  │             │  │& Monitoring │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
               │         │         │
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  Service A  │ │  Service B  │ │  Service C  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### Gateway Patterns

#### 1. Backend for Frontend (BFF)
```
┌─────────────┐     ┌─────────────┐
│   Mobile    │────►│ Mobile BFF  │
│    App      │     └─────────────┘
└─────────────┘           │
                          │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Web      │────►│   Web BFF   │────►│ Microservices│
│    App      │     └─────────────┘     │   Layer     │
└─────────────┘           │             └─────────────┘
                          │
┌─────────────┐     ┌─────────────┐
│   Admin     │────►│ Admin BFF   │
│   Portal    │     └─────────────┘
└─────────────┘
```

#### 2. Single API Gateway
```
┌─────────────┐
│   Clients   │
└─────────────┘
       │
┌─────────────┐
│API Gateway  │
└─────────────┘
   │   │   │
┌─────────────┐
│Microservices│
└─────────────┘
```

### API Gateway Implementation Example

```yaml
# Kong Gateway Configuration
services:
  - name: user-service
    url: http://user-service:3000
    plugins:
      - name: rate-limiting
        config:
          minute: 100
      - name: jwt
        config:
          secret_is_base64: false

  - name: order-service
    url: http://order-service:3001
    plugins:
      - name: rate-limiting
        config:
          minute: 200
      - name: jwt
        config:
          secret_is_base64: false

routes:
  - name: users
    service: user-service
    paths:
      - /api/users
  
  - name: orders
    service: order-service
    paths:
      - /api/orders
```

## 📡 Event-Driven Architecture

### What is Event-Driven Architecture?

A pattern where services produce and consume events to communicate state changes.

### Event Types

#### 1. Domain Events
Business-meaningful occurrences.
```json
{
  "eventType": "OrderPlaced",
  "eventId": "uuid",
  "timestamp": "2023-11-29T10:00:00Z",
  "aggregateId": "order-123",
  "data": {
    "customerId": "user-456",
    "items": [...],
    "totalAmount": 99.99
  }
}
```

#### 2. Integration Events
Cross-bounded context communication.
```json
{
  "eventType": "PaymentProcessed",
  "eventId": "uuid",
  "timestamp": "2023-11-29T10:05:00Z",
  "data": {
    "orderId": "order-123",
    "paymentId": "pay-789",
    "amount": 99.99,
    "status": "completed"
  }
}
```

### Event Sourcing Pattern

Instead of storing current state, store sequence of events.

```
Traditional State Storage:
┌─────────────────────┐
│ User ID: 123        │
│ Name: John Doe      │
│ Email: john@ex.com  │
│ Status: Active      │
└─────────────────────┘

Event Sourcing:
┌─────────────────────┐
│ UserCreated         │
│ EmailUpdated        │
│ UserActivated       │
│ PasswordChanged     │
└─────────────────────┘
     ↓ (replay events)
┌─────────────────────┐
│ Current State       │
└─────────────────────┘
```

### Message Brokers

#### Apache Kafka
```yaml
# Kafka Topic Configuration
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: order-events
spec:
  partitions: 3
  replicas: 3
  config:
    retention.ms: 604800000  # 7 days
    cleanup.policy: delete
```

#### RabbitMQ
```python
# Producer
import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

channel.queue_declare(queue='order_events', durable=True)

message = {
    "eventType": "OrderPlaced",
    "orderId": "order-123",
    "customerId": "user-456"
}

channel.basic_publish(
    exchange='',
    routing_key='order_events',
    body=json.dumps(message),
    properties=pika.BasicProperties(delivery_mode=2)  # Make message persistent
)

connection.close()
```

### Event-Driven Patterns

#### 1. Event Notification
Simple notification that something happened.

#### 2. Event-Carried State Transfer
Event contains all data needed by consumers.

#### 3. Event Sourcing
Events are the source of truth.

#### 4. CQRS (Command Query Responsibility Segregation)
Separate read and write models.

```
┌─────────────┐    Commands    ┌─────────────┐
│   Client    │──────────────►│Write Model  │
└─────────────┘               └─────────────┘
       │                             │
       │                      Events │
       │ Queries                     ▼
       │          ┌─────────────┐ Events ┌─────────────┐
       └─────────►│ Read Model  │◄───────│Event Store  │
                  └─────────────┘        └─────────────┘
```

## 🎯 Service Communication Strategies

### 1. Request-Response (Synchronous)

**Use When:**
- Immediate response needed
- Simple CRUD operations
- Real-time data requirements

**Example:**
```javascript
// Order Service calling User Service
async function createOrder(orderData) {
  // Synchronous call to validate user
  const user = await userService.getUser(orderData.userId);
  
  if (!user.isActive) {
    throw new Error('User not active');
  }
  
  return await this.orderRepository.save(orderData);
}
```

### 2. Event-Driven (Asynchronous)

**Use When:**
- Eventual consistency is acceptable
- Decoupling services
- Long-running processes

**Example:**
```javascript
// Order Service publishes event
async function placeOrder(orderData) {
  const order = await this.orderRepository.save(orderData);
  
  // Publish event asynchronously
  await this.eventBus.publish('OrderPlaced', {
    orderId: order.id,
    customerId: order.customerId,
    items: order.items
  });
  
  return order;
}

// Inventory Service subscribes to event
eventBus.subscribe('OrderPlaced', async (event) => {
  await this.reserveInventory(event.items);
});
```

### 3. Hybrid Approach

```javascript
async function processOrder(orderData) {
  // Synchronous: Critical validations
  const user = await userService.getUser(orderData.userId);
  const inventory = await inventoryService.checkAvailability(orderData.items);
  
  if (!user.isActive || !inventory.isAvailable) {
    throw new Error('Order cannot be processed');
  }
  
  // Save order
  const order = await this.orderRepository.save(orderData);
  
  // Asynchronous: Non-critical operations
  await this.eventBus.publish('OrderPlaced', { orderId: order.id });
  
  return order;
}
```

## 🧪 Knowledge Check Quiz

### Question 1
What is a Bounded Context in DDD?
a) A physical server boundary
b) A boundary within which a domain model is applicable
c) A database schema boundary
d) A team organizational boundary

<details>
<summary>Answer</summary>
b) A boundary within which a domain model is applicable - Bounded Context defines the boundaries where a particular domain model makes sense
</details>

### Question 2
Which communication pattern should you use for real-time user validation?
a) Event-driven asynchronous
b) Message queue
c) Synchronous API call
d) Event sourcing

<details>
<summary>Answer</summary>
c) Synchronous API call - Real-time validation requires immediate response
</details>

### Question 3
What is the main benefit of the Backend for Frontend (BFF) pattern?
a) Reduces number of services
b) Optimizes API responses for specific client types
c) Eliminates need for authentication
d) Simplifies database design

<details>
<summary>Answer</summary>
b) Optimizes API responses for specific client types - BFF allows customization for mobile, web, and other client needs
</details>

## 🎯 Mini-Assignment

**Task:** Design the communication patterns for an e-commerce system

**Scenario:** You have these services:
- User Service
- Product Service
- Order Service
- Payment Service
- Inventory Service
- Notification Service

**Requirements:**
1. Map the synchronous communication patterns
2. Map the asynchronous communication patterns
3. Design the event flow for "Order Placement"
4. Identify potential bounded contexts
5. Suggest an API Gateway strategy

**Deliverable:** Create a communication diagram and event flow documentation

**Next Module:** [Architecture Patterns & Best Practices](../03-architecture-patterns/) - Learn about Saga, CQRS, Circuit Breaker, and observability patterns.