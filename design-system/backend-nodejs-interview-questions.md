# Backend Node.js Developer Interview Questions

## Mid to Senior Level - Design Systems, Architecture & Advanced Topics

---

## Table of Contents

1. [System Design & Architecture](#system-design--architecture)
2. [Design Patterns](#design-patterns)
3. [API Design](#api-design)
4. [Database Design & Optimization](#database-design--optimization)
5. [Microservices Architecture](#microservices-architecture)
6. [Scalability & Performance](#scalability--performance)
7. [Security](#security)
8. [DevOps & Infrastructure](#devops--infrastructure)
9. [Node.js Specific](#nodejs-specific)
10. [Code Quality & Best Practices](#code-quality--best-practices)
11. [Real-World Scenarios](#real-world-scenarios)

---

## System Design & Architecture

### Fundamental Questions

**Q1: Design a URL shortening service (like bit.ly)**

- Expected answer should cover:
  - Database schema design
  - Hash generation algorithm (Base62, MD5, etc.)
  - API endpoints design
  - Scalability considerations
  - Caching strategy
  - Analytics tracking
  - Custom URLs handling
  - Rate limiting

**Q2: Design a real-time notification system**

- Should discuss:
  - WebSocket vs Server-Sent Events vs Long Polling
  - Message queue (Redis, RabbitMQ, Kafka)
  - Database design for notifications
  - Push notification services integration
  - Read/unread status management
  - Notification preferences
  - Scalability for millions of users

**Q3: Design a rate limiting system**

- Should cover:
  - Different algorithms (Token bucket, Leaky bucket, Fixed window, Sliding window)
  - Storage options (Redis, in-memory)
  - Distributed rate limiting
  - Per-user vs per-IP vs per-API key
  - Error handling and user feedback

**Q4: How would you design a file upload system that handles large files (GB size)?**

- Should mention:
  - Chunked upload strategy
  - Resume capability
  - Storage options (S3, local, CDN)
  - File validation and virus scanning
  - Progress tracking
  - Presigned URLs
  - Multipart upload

**Q5: Design a caching strategy for a high-traffic e-commerce website**

- Should discuss:
  - Cache layers (CDN, Application, Database)
  - Cache invalidation strategies
  - Cache-aside vs Write-through vs Write-behind
  - Redis vs Memcached
  - Cache warming
  - Cache stampede prevention
  - TTL strategies

**Q6: Explain the differences between monolithic, microservices, and serverless architectures**

- When to use each?
- Trade-offs of each approach
- Migration strategies

**Q7: How would you design a multi-tenant SaaS application?**

- Should cover:
  - Data isolation strategies (separate DB, separate schema, shared schema)
  - Tenant identification (subdomain, custom domain, path-based)
  - Resource quotas and billing
  - Performance isolation
  - Security considerations
  - Deployment strategies

**Q8: Design a distributed logging and monitoring system**

- Should mention:
  - Centralized logging (ELK stack, CloudWatch)
  - Log aggregation
  - Structured logging
  - Tracing (distributed tracing with correlation IDs)
  - Metrics collection
  - Alerting strategies

---

## Design Patterns

**Q9: Explain the Repository Pattern and when to use it**

- Provide code example
- Benefits and drawbacks
- Difference from Data Access Layer

**Q10: What is Dependency Injection? Implement it in Node.js**

```javascript
// Expected to write something like:
class UserService {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }
}
```

**Q11: Explain the following patterns with Node.js examples:**

- Singleton Pattern
- Factory Pattern
- Strategy Pattern
- Observer Pattern (EventEmitter)
- Decorator Pattern
- Adapter Pattern
- Middleware Pattern

**Q12: What is the Circuit Breaker pattern? Why and when would you use it?**

- Implementation example
- Integration with microservices
- Libraries like opossum

**Q13: Explain the CQRS (Command Query Responsibility Segregation) pattern**

- When to use it?
- Benefits and complexity trade-offs
- Implementation with Node.js

**Q14: What is Event Sourcing? How would you implement it?**

- Benefits and challenges
- Example use cases
- Difference from CQRS

**Q15: Explain the Saga pattern for distributed transactions**

- Choreography vs Orchestration
- Compensation logic
- Implementation strategies

---

## API Design

**Q16: Design a RESTful API for a blog platform**

- Resource naming conventions
- HTTP methods usage
- Status codes
- Pagination strategy
- Filtering and sorting
- Versioning

**Q17: REST vs GraphQL vs gRPC - when to use each?**

- Pros and cons
- Real-world use cases
- Performance considerations

**Q18: How do you version your APIs? What are the pros/cons of each approach?**

- URL versioning (/v1/users)
- Header versioning
- Query parameter
- Content negotiation

**Q19: How would you design an API rate limiting system?**

- Rate limit headers
- 429 status code handling
- Different tiers for different users
- Burst vs sustained rate limits

**Q20: Explain API Gateway pattern**

- Responsibilities
- Implementation options (Kong, API Gateway, custom)
- Benefits in microservices

**Q21: How do you handle API errors and error responses?**

- Error response format
- Error codes vs HTTP status codes
- Error logging and tracking
- User-friendly error messages

**Q22: Design an API for a multi-tenant application**

- Tenant isolation
- Authentication and authorization
- Data filtering
- Performance considerations

**Q23: How would you implement API documentation?**

- OpenAPI/Swagger
- API documentation tools
- Keeping docs in sync with code
- Examples and testing

---

## Database Design & Optimization

**Q24: Design a database schema for a social media application**

- Users, Posts, Comments, Likes, Followers
- Indexes strategy
- Relationship modeling
- Normalization vs denormalization decisions

**Q25: Explain database indexing. When would you use composite indexes?**

- B-tree vs Hash indexes
- Index selectivity
- Index maintenance cost
- Query optimization with EXPLAIN

**Q26: How do you handle database migrations in a production environment?**

- Zero-downtime migrations
- Backward compatibility
- Rollback strategies
- Tools (Knex, TypeORM, Sequelize migrations)

**Q27: Explain the CAP theorem and its implications**

- Consistency, Availability, Partition Tolerance
- Real-world examples (MongoDB, Cassandra, PostgreSQL)
- Eventual consistency

**Q28: SQL vs NoSQL - when to use each?**

- Use cases for each
- Polyglot persistence
- Data modeling differences

**Q29: How would you optimize a slow database query?**

- Query analysis with EXPLAIN
- Index optimization
- Query rewriting
- Caching strategies
- Database-specific optimizations

**Q30: Explain database sharding and partitioning**

- Horizontal vs vertical sharding
- Sharding key selection
- Challenges (cross-shard queries, rebalancing)
- Implementation strategies

**Q31: How do you handle database connection pooling?**

- Pool size configuration
- Connection lifecycle
- Error handling
- Libraries (pg, mysql2)

**Q32: Explain ACID properties and transaction management**

- Implementation in Node.js
- Transaction isolation levels
- Handling distributed transactions
- Deadlock prevention

**Q33: How would you design a database for time-series data?**

- Time-series databases (InfluxDB, TimescaleDB)
- Partitioning strategies
- Retention policies
- Aggregation and downsampling

---

## Microservices Architecture

**Q34: What are the key principles of microservices architecture?**

- Service boundaries
- Data ownership
- Communication patterns
- Deployment independence

**Q35: How do microservices communicate with each other?**

- Synchronous (REST, gRPC)
- Asynchronous (Message queues, Event bus)
- Service mesh
- Trade-offs of each approach

**Q36: How do you handle distributed transactions in microservices?**

- Saga pattern
- 2-phase commit
- Eventual consistency
- Compensation logic

**Q37: Explain service discovery in microservices**

- Client-side vs Server-side discovery
- Tools (Consul, Eureka, Kubernetes service discovery)
- Health checks

**Q38: How do you handle data consistency across microservices?**

- Eventual consistency
- Event sourcing
- CQRS
- Data synchronization strategies

**Q39: What is an API Gateway and why is it important in microservices?**

- Responsibilities
- Authentication/Authorization
- Rate limiting
- Request aggregation
- Implementation options

**Q40: How do you monitor and debug microservices?**

- Distributed tracing (Jaeger, Zipkin)
- Centralized logging
- Correlation IDs
- Service mesh observability
- APM tools

**Q41: How do you handle service failures in microservices?**

- Circuit breaker pattern
- Retry logic with exponential backoff
- Timeout configuration
- Bulkhead pattern
- Graceful degradation

---

## Scalability & Performance

**Q42: How do you scale a Node.js application?**

- Vertical vs Horizontal scaling
- Clustering (cluster module)
- Load balancing
- PM2, Docker, Kubernetes
- Stateless design

**Q43: Explain the Node.js event loop and its impact on performance**

- Event loop phases
- Blocking vs Non-blocking operations
- Worker threads
- Child processes

**Q44: How do you handle memory leaks in Node.js?**

- Detection tools (heapdump, clinic.js)
- Common causes
- Prevention strategies
- Monitoring

**Q45: What strategies would you use to optimize API response time?**

- Database query optimization
- Caching
- Compression (gzip)
- CDN usage
- Pagination
- Connection pooling
- Async operations

**Q46: Explain load balancing strategies**

- Round-robin
- Least connections
- IP hash
- Sticky sessions
- Layer 4 vs Layer 7 load balancing

**Q47: How do you implement caching in a Node.js application?**

- In-memory caching
- Redis caching
- Cache invalidation strategies
- Cache-aside pattern
- HTTP caching headers

**Q48: What is backpressure and how do you handle it?**

- Stream backpressure
- Message queue backpressure
- Rate limiting
- Circuit breaker

**Q49: How do you profile and optimize Node.js applications?**

- Profiling tools (v8-profiler, Chrome DevTools)
- Flame graphs
- CPU profiling
- Memory profiling
- Performance monitoring

---

## Security

**Q50: How do you implement authentication and authorization?**

- JWT vs Session-based
- OAuth 2.0 / OpenID Connect
- RBAC (Role-Based Access Control)
- ABAC (Attribute-Based Access Control)
- Refresh token rotation

**Q51: Explain common security vulnerabilities and how to prevent them:**

- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- NoSQL Injection
- Command Injection
- Path Traversal

**Q52: How do you secure API endpoints?**

- Authentication mechanisms
- Rate limiting
- Input validation
- CORS configuration
- API keys management
- HTTPS enforcement

**Q53: How do you store sensitive data like passwords and API keys?**

- Password hashing (bcrypt, argon2)
- Environment variables
- Secrets management (Vault, AWS Secrets Manager)
- Encryption at rest
- Key rotation

**Q54: Explain JWT and its security considerations**

- Structure of JWT
- Signing algorithms (HS256 vs RS256)
- Token expiration
- Refresh tokens
- Token revocation strategies

**Q55: How do you implement rate limiting to prevent abuse?**

- Algorithms (token bucket, sliding window)
- Storage (Redis, in-memory)
- Per-user vs per-IP
- Different limits for different endpoints

**Q56: What is OWASP Top 10? Explain how you mitigate these risks**

- Injection
- Broken Authentication
- Sensitive Data Exposure
- XML External Entities (XXE)
- Broken Access Control
- Security Misconfiguration
- XSS
- Insecure Deserialization
- Using Components with Known Vulnerabilities
- Insufficient Logging & Monitoring

**Q57: How do you handle CORS in production?**

- CORS headers configuration
- Preflight requests
- Credentials handling
- Security implications

**Q58: Explain encryption in transit and at rest**

- TLS/SSL
- Database encryption
- File encryption
- Key management

---

## DevOps & Infrastructure

**Q59: Explain CI/CD pipeline for Node.js applications**

- Build process
- Testing stages
- Deployment strategies
- Tools (Jenkins, GitHub Actions, GitLab CI)

**Q60: How do you implement blue-green deployment?**

- Strategy explanation
- Zero-downtime deployment
- Rollback process
- Database migration considerations

**Q61: Explain containerization with Docker**

- Dockerfile best practices for Node.js
- Multi-stage builds
- Image optimization
- Docker compose for local development

**Q62: How would you deploy a Node.js application to Kubernetes?**

- Deployment manifests
- Services and Ingress
- ConfigMaps and Secrets
- Health checks (liveness, readiness)
- Auto-scaling

**Q63: How do you handle environment configuration?**

- Environment variables
- Config files per environment
- Secrets management
- Configuration validation

**Q64: Explain infrastructure as code (IaC)**

- Terraform
- CloudFormation
- Benefits and challenges
- Best practices

**Q65: How do you implement logging in production?**

- Structured logging
- Log levels
- Centralized logging (ELK, CloudWatch)
- Log rotation
- Sensitive data masking

**Q66: Explain monitoring and alerting strategies**

- Metrics to monitor (CPU, memory, response time, error rate)
- Tools (Prometheus, Grafana, DataDog, New Relic)
- Alert fatigue prevention
- On-call procedures

**Q67: How do you handle database backups and disaster recovery?**

- Backup strategies (full, incremental, differential)
- Backup frequency
- Restore testing
- RTO and RPO
- Multi-region replication

---

## Node.js Specific

**Q68: Explain the differences between CommonJS and ES Modules**

- Syntax differences
- Loading behavior (synchronous vs asynchronous)
- Migration strategies
- Top-level await

**Q69: How does Node.js handle asynchronous operations?**

- Callbacks
- Promises
- Async/await
- Event emitters
- Streams

**Q70: Explain Node.js streams and when to use them**

- Readable, Writable, Transform, Duplex
- Backpressure handling
- Piping
- Use cases (file processing, HTTP responses)

**Q71: What is the difference between process.nextTick() and setImmediate()?**

- Event loop phases
- Execution order
- Use cases

**Q72: How do you handle errors in Node.js?**

- Try-catch for synchronous code
- Promise rejection handling
- Error-first callbacks
- Async/await error handling
- Uncaught exception handling
- Process error events

**Q73: Explain worker threads in Node.js**

- When to use them
- Difference from child processes
- Communication between threads
- CPU-intensive tasks

**Q74: How do you debug Node.js applications?**

- Built-in debugger
- Chrome DevTools
- VS Code debugging
- Remote debugging
- Production debugging considerations

**Q75: Explain memory management in Node.js**

- V8 garbage collection
- Memory leaks detection
- Heap size configuration
- Buffer usage

**Q76: What are Node.js best practices for production?**

- Error handling
- Logging
- Clustering
- Security
- Performance monitoring
- Graceful shutdown

**Q77: Explain the difference between spawn, exec, and fork**

- Use cases for each
- Stdio handling
- Performance considerations

---

## Code Quality & Best Practices

**Q78: How do you ensure code quality in your projects?**

- Linting (ESLint)
- Code formatting (Prettier)
- Code reviews
- Static analysis
- Testing pyramid

**Q79: Explain different types of testing**

- Unit testing
- Integration testing
- E2E testing
- Performance testing
- Security testing
- When to use each?

**Q80: How do you structure a large Node.js application?**

- Folder structure
- Separation of concerns
- Layered architecture (Controller, Service, Repository)
- Module organization
- Monorepo vs multi-repo

**Q81: Explain SOLID principles with Node.js examples**

- Single Responsibility
- Open-Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

**Q82: How do you handle technical debt?**

- Identification
- Prioritization
- Refactoring strategies
- Balance with feature development

**Q83: What is your approach to writing testable code?**

- Dependency injection
- Pure functions
- Mocking strategies
- Test coverage goals

**Q84: How do you handle configuration in Node.js?**

- Environment variables
- Configuration files
- Config validation (joi, ajv)
- Different configs per environment
- Secrets management

**Q85: Explain the importance of documentation**

- Code comments
- README files
- API documentation
- Architecture decision records (ADR)
- Runbooks

---

## Real-World Scenarios

**Q86: Your API is experiencing high latency. How do you investigate and resolve it?**

- Should mention:
  - APM tools
  - Database query analysis
  - Caching implementation
  - Code profiling
  - Network analysis
  - Load testing

**Q87: A service in your microservices architecture is down. How do you handle it?**

- Circuit breaker pattern
- Graceful degradation
- Retry logic
- Error messaging to users
- Incident response
- Post-mortem

**Q88: You need to migrate a monolithic application to microservices. What's your approach?**

- Incremental migration (Strangler Fig pattern)
- Service boundary identification
- Data migration strategy
- Testing strategy
- Rollback plan

**Q89: Your database is reaching capacity. What options do you have?**

- Vertical scaling
- Horizontal scaling (sharding)
- Archiving old data
- Read replicas
- Caching layer
- Query optimization

**Q90: How would you handle a sudden traffic spike (10x normal traffic)?**

- Auto-scaling
- Rate limiting
- Caching
- CDN usage
- Load balancing
- Queue-based architecture
- Graceful degradation

**Q91: A critical bug is found in production. Walk through your response process**

- Incident detection
- Impact assessment
- Communication plan
- Hot fix process
- Testing in production
- Post-mortem
- Prevention measures

**Q92: You need to refactor a legacy codebase. What's your approach?**

- Understanding existing code
- Adding tests
- Incremental refactoring
- Risk assessment
- Feature flag usage
- Code review process

**Q93: How do you handle data inconsistency in a distributed system?**

- Eventual consistency
- Conflict resolution
- Retry mechanisms
- Idempotency
- Monitoring and alerting

**Q94: Design a system to handle Black Friday level traffic**

- Capacity planning
- Auto-scaling
- Caching strategy
- Queue-based processing
- CDN optimization
- Database optimization
- Monitoring and alerting
- Chaos engineering testing

**Q95: How would you implement a feature flag system?**

- Storage (database, config service)
- Evaluation logic
- Gradual rollout
- A/B testing
- Emergency kill switch
- Analytics integration

---

## Advanced Architectural Questions

**Q96: Explain Domain-Driven Design (DDD)**

- Bounded contexts
- Aggregates
- Entities vs Value Objects
- Domain events
- Implementation in Node.js

**Q97: What is Event-Driven Architecture?**

- Event producers and consumers
- Event bus implementation
- Message queues (RabbitMQ, Kafka, SQS)
- Eventual consistency
- Error handling in async systems

**Q98: How would you implement a webhook system?**

- Webhook registration
- Retry logic
- Security (signing payloads)
- Delivery guarantees
- Timeout handling
- Status tracking

**Q99: Design a job queue system for background processing**

- Queue selection (Bull, BullMQ, Agenda)
- Job priority
- Retry logic
- Failed job handling
- Job monitoring
- Distributed workers

**Q100: Explain the concept of "Observability" in distributed systems**

- Logging
- Metrics
- Tracing
- Tools and practices
- Correlation between different signals
- Debugging production issues

---

## Bonus Questions

**Q101: How do you stay updated with Node.js and backend development trends?**

**Q102: Describe a challenging technical problem you solved. What was your approach?**

**Q103: How do you mentor junior developers?**

**Q104: What's your approach to technical decision making?**

**Q105: How do you balance technical excellence with business requirements?**

**Q106: Describe your experience with different cloud providers (AWS, GCP, Azure)**

**Q107: How do you handle database schema changes in a microservices environment?**

**Q108: Explain your experience with message queues and event streaming platforms**

**Q109: How do you ensure high availability in your applications?**

**Q110: What metrics do you consider most important for backend services?**

---

## Evaluation Criteria

### Mid-Level Developer Should Know:

- ✅ Core Node.js concepts
- ✅ Basic design patterns
- ✅ RESTful API design
- ✅ Database basics and SQL
- ✅ Authentication/Authorization
- ✅ Basic security practices
- ✅ Testing fundamentals
- ✅ Git and CI/CD basics

### Senior Developer Should Know:

- ✅ System design and architecture
- ✅ Advanced design patterns
- ✅ Microservices architecture
- ✅ Scalability and performance optimization
- ✅ Advanced security practices
- ✅ DevOps and infrastructure
- ✅ Database optimization and sharding
- ✅ Distributed systems concepts
- ✅ Leadership and mentoring
- ✅ Trade-off analysis
- ✅ Production debugging and troubleshooting
- ✅ Cloud infrastructure (AWS/GCP/Azure)

---

## Interview Tips

### For Interviewers:

1. Start with easier questions and gradually increase difficulty
2. Look for thought process, not just answers
3. Ask follow-up questions based on candidate's experience
4. Give time for the candidate to think
5. Discuss real-world scenarios from your company
6. Assess communication skills
7. Look for problem-solving approach

### For Candidates:

1. Clarify requirements before answering
2. Think out loud
3. Discuss trade-offs
4. Use examples from your experience
5. Ask questions
6. Be honest about what you don't know
7. Discuss scalability, security, and maintainability
8. Draw diagrams when helpful
9. Consider edge cases

---

## Additional Resources

### System Design

- "Designing Data-Intensive Applications" by Martin Kleppmann
- System Design Primer (GitHub)
- Educative.io System Design courses

### Node.js

- Node.js official documentation
- "Node.js Design Patterns" by Mario Casciaro
- Node.js Best Practices (GitHub repo)

### Architecture

- "Building Microservices" by Sam Newman
- "Clean Architecture" by Robert C. Martin
- "Domain-Driven Design" by Eric Evans

### Practice Platforms

- LeetCode (System Design section)
- System Design Interview questions
- Practicing real-world scenarios

---

Good luck with your interviews! 🚀
