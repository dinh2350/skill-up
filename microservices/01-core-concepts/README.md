# Module 01: Core Concepts & Fundamentals

## 📖 What Are Microservices?

Microservices are an architectural approach to building software applications as a collection of small, independent services that communicate over well-defined APIs. Each service is:

- **Independently deployable**
- **Loosely coupled**
- **Organized around business capabilities**
- **Owned by a small team**

### 🏗️ Key Characteristics

1. **Componentization via Services**
   - Services are components that are out-of-process
   - Communication via web request or remote procedure call

2. **Organized around Business Capabilities**
   - Teams are cross-functional
   - Services align with business domains

3. **Products not Projects**
   - Teams own the product for its lifetime
   - "You build it, you run it" mentality

4. **Smart endpoints and dumb pipes**
   - Services process requests intelligently
   - Communication protocols are simple (HTTP, messaging)

5. **Decentralized Governance**
   - Each service can use different technologies
   - Teams choose their own tools and languages

6. **Decentralized Data Management**
   - Each service manages its own data
   - Database-per-service pattern

7. **Infrastructure Automation**
   - Automated testing, deployment, and monitoring
   - DevOps practices are essential

8. **Design for Failure**
   - Services must handle partial failures gracefully
   - Circuit breakers, timeouts, and fallbacks

## 🔄 Architecture Comparison

### Monolithic Architecture

```
┌─────────────────────────────────────┐
│          Monolithic App             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ UI  │ │Auth │ │Order│ │User │   │
│  │     │ │     │ │     │ │     │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│              │                     │
│         ┌─────────┐                │
│         │Database │                │
│         └─────────┘                │
└─────────────────────────────────────┘
```

**Pros:**
- Simple to develop, test, and deploy initially
- Better performance (no network calls)
- Easier debugging and monitoring
- Strong consistency

**Cons:**
- Becomes complex as it grows
- Technology lock-in
- Difficult to scale individual components
- Single point of failure

### Service-Oriented Architecture (SOA)

```
┌─────────────────────────────────────┐
│           ESB (Enterprise           │
│          Service Bus)               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Service│Service│Service│Service│  │
│  │  A  │ │  B  │ │  C  │ │  D  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
└─────────────────────────────────────┘
```

**Characteristics:**
- Heavy middleware (ESB)
- XML-based protocols (SOAP)
- Centralized governance
- Larger, more coarse-grained services

### Microservices Architecture

```
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Service │   │ Service │   │ Service │
│    A    │◄──┤    B    ├──►│    C    │
│         │   │         │   │         │
└─────────┘   └─────────┘   └─────────┘
     │             │             │
┌─────────┐   ┌─────────┐   ┌─────────┐
│   DB    │   │   DB    │   │   DB    │
│    A    │   │    B    │   │    C    │
└─────────┘   └─────────┘   └─────────┘
```

**Characteristics:**
- Lightweight protocols (HTTP/REST, messaging)
- Decentralized governance
- Smart endpoints, dumb pipes
- Fine-grained services

### Modular Monoliths

```
┌─────────────────────────────────────┐
│         Modular Monolith            │
│  ┌─────────┐ ┌─────────┐           │
│  │ Module  │ │ Module  │           │
│  │    A    │ │    B    │           │
│  └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐           │
│  │ Module  │ │ Module  │           │
│  │    C    │ │    D    │           │
│  └─────────┘ └─────────┘           │
│              │                     │
│         ┌─────────┐                │
│         │Database │                │
│         └─────────┘                │
└─────────────────────────────────────┘
```

**Benefits of Modular Monoliths:**
- Clear module boundaries
- Simpler deployment
- Better than traditional monoliths
- Good stepping stone to microservices

## ⚖️ Microservices: Pros and Cons

### ✅ Advantages

1. **Technology Diversity**
   - Choose the right tool for each job
   - Experiment with new technologies

2. **Independent Scaling**
   - Scale services based on demand
   - Optimize resource usage

3. **Team Independence**
   - Teams can work autonomously
   - Faster development cycles

4. **Fault Isolation**
   - Failures are contained
   - System remains partially functional

5. **Business Alignment**
   - Services align with business domains
   - Easier to understand and maintain

### ❌ Disadvantages

1. **Distributed System Complexity**
   - Network latency and failures
   - Eventual consistency challenges

2. **Operational Overhead**
   - More services to monitor and maintain
   - Complex deployment pipelines

3. **Data Consistency**
   - No ACID transactions across services
   - Eventually consistent systems

4. **Testing Complexity**
   - Integration testing is harder
   - End-to-end testing challenges

5. **Network Communication**
   - Latency between services
   - Serialization overhead

## 🎯 When to Use Microservices?

### ✅ Good Candidates

- **Large, complex applications** with multiple business domains
- **Multiple teams** working on the same system
- **Different scaling requirements** for different components
- **Technology diversity** requirements
- **Mature DevOps practices** in place

### ❌ Poor Candidates

- **Small applications** with simple business logic
- **Small teams** (< 10 developers)
- **Lack of DevOps maturity**
- **Strong consistency** requirements
- **Simple CRUD applications**

### 📊 Decision Matrix

| Factor | Monolith | Microservices |
|--------|----------|---------------|
| Team size | < 10 | 10+ |
| Complexity | Low-Medium | High |
| DevOps maturity | Basic | Advanced |
| Scaling needs | Uniform | Variable |
| Technology diversity | No | Yes |
| Time to market | Fast | Medium |

## 🚦 Migration Strategy: The Strangler Fig Pattern

Instead of a big bang migration, use the **Strangler Fig Pattern**:

```
1. Start with Monolith
┌─────────────────┐
│    Monolith     │
└─────────────────┘

2. Extract First Service
┌─────────────────┐    ┌─────────┐
│    Monolith     │◄──►│Service A│
└─────────────────┘    └─────────┘

3. Continue Extraction
┌─────────────────┐    ┌─────────┐
│   Monolith      │◄──►│Service A│
│   (Reduced)     │    └─────────┘
└─────────────────┘    ┌─────────┐
                       │Service B│
                       └─────────┘

4. Complete Migration
┌─────────┐    ┌─────────┐    ┌─────────┐
│Service A│◄──►│Service B│◄──►│Service C│
└─────────┘    └─────────┘    └─────────┘
```

## 🏗️ Key Principles

### 1. Single Responsibility Principle
- Each service should have one reason to change
- High cohesion within services

### 2. Loose Coupling
- Services should be independently deployable
- Minimize dependencies between services

### 3. High Autonomy
- Teams own their services end-to-end
- Independent technology choices

### 4. Decentralized
- No single point of failure
- Distributed decision making

### 5. Failure Resilient
- Design for partial failures
- Graceful degradation

## 🧪 Knowledge Check Quiz

### Question 1
Which is NOT a characteristic of microservices?
a) Independently deployable
b) Shared database across services
c) Organized around business capabilities
d) Loosely coupled

<details>
<summary>Answer</summary>
b) Shared database across services - Microservices should have their own databases (database-per-service pattern)
</details>

### Question 2
What is the main difference between SOA and Microservices?
a) SOA uses HTTP, Microservices use SOAP
b) Microservices are lighter weight with decentralized governance
c) SOA is newer than Microservices
d) No significant difference

<details>
<summary>Answer</summary>
b) Microservices are lighter weight with decentralized governance - SOA typically uses heavy middleware (ESB) while microservices prefer lightweight protocols
</details>

### Question 3
When should you NOT use microservices?
a) Large team (50+ developers)
b) Complex business domain
c) Small team (5 developers)
d) Need for different scaling patterns

<details>
<summary>Answer</summary>
c) Small team (5 developers) - Small teams don't have the capacity to manage multiple services effectively
</details>

## 🎯 Mini-Assignment

**Task:** Design a high-level microservices architecture for an e-commerce platform.

**Requirements:**
1. Identify 5-7 services based on business capabilities
2. Define the primary responsibility of each service
3. Identify which services need to communicate with each other
4. Create a simple diagram showing the relationships

**Deliverable:** A markdown document with your design decisions and a text-based diagram.

**Example Services to Consider:**
- User Management
- Product Catalog
- Inventory Management
- Order Processing
- Payment
- Notification
- Shipping

**Next Module:** [System Design Deep Dive](../02-system-design/) - Learn about bounded contexts, DDD, and service communication patterns.