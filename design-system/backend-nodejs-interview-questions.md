# Backend Node.js Design System & Architecture Interview Questions

This document contains a comprehensive list of backend Node.js design system and architecture interview questions ranging from junior to senior developer and software engineer levels.

## Junior Developer Questions

### Node.js Fundamentals

1. What is Node.js and what is it used for?
2. What is the event loop in Node.js?
3. What is npm and what is it used for?
4. What is package.json?
5. What is the difference between dependencies and devDependencies?
6. What is the purpose of node_modules folder?
7. What is require() and how does it work?
8. What is module.exports?
9. What are callbacks in Node.js?
10. What is callback hell and how do you avoid it?
11. What are Promises?
12. What is async/await?
13. What is the difference between synchronous and asynchronous code?
14. What is the fs module used for?
15. What is the path module?

### Basic API Development

16. What is Express.js?
17. What is middleware in Express?
18. How do you create a basic Express server?
19. What is routing in Express?
20. What are HTTP methods (GET, POST, PUT, DELETE)?
21. What is the difference between PUT and PATCH?
22. What are HTTP status codes?
23. What does status code 200 mean?
24. What does status code 404 mean?
25. What does status code 500 mean?
26. How do you handle query parameters?
27. How do you handle route parameters?
28. How do you parse request body in Express?
29. What is body-parser middleware?
30. How do you handle JSON data in Express?

### Basic Database Concepts

31. What is a database?
32. What is SQL?
33. What is the difference between SQL and NoSQL databases?
34. What is MongoDB?
35. What is PostgreSQL?
36. What is a table/collection?
37. What is a primary key?
38. What is a foreign key?
39. What is CRUD?
40. How do you connect to a database in Node.js?
41. What is Mongoose?
42. What is an ORM?
43. What is a database schema?
44. What is data validation?
45. What is a database query?

### Error Handling Basics

46. What is error handling?
47. What is try-catch?
48. How do you handle errors in async functions?
49. What is error-first callback pattern?
50. How do you create custom errors?
51. What is the purpose of error middleware in Express?
52. What is a 400 error?
53. What is a 401 error?
54. What is a 403 error?
55. How do you log errors?

### Basic Security

56. What is authentication?
57. What is authorization?
58. What is the difference between authentication and authorization?
59. What is a password hash?
60. What is bcrypt?
61. What is a JWT token?
62. What is CORS?
63. Why is CORS important?
64. What is SQL injection?
65. How do you prevent SQL injection?
66. What is XSS?
67. What is HTTPS?
68. What are environment variables?
69. What is the .env file?
70. Why should you not commit sensitive data to Git?

### Testing Basics

71. What is unit testing?
72. What is integration testing?
73. What is a test case?
74. What is Jest?
75. What is Mocha?
76. What is an assertion?
77. What is test coverage?
78. Why is testing important?
79. What is TDD (Test-Driven Development)?
80. How do you test an API endpoint?

## Mid-level Developer Questions

### Advanced Node.js

81. What is the Node.js event loop in detail?
82. What are the phases of the event loop?
83. What is process.nextTick()?
84. What is setImmediate()?
85. What is the difference between process.nextTick() and setImmediate()?
86. What are Node.js streams?
87. What are the types of streams?
88. What is a readable stream?
89. What is a writable stream?
90. What is a transform stream?
91. What is backpressure in streams?
92. What is the buffer in Node.js?
93. What is the cluster module?
94. What are worker threads?
95. What is the difference between child processes and worker threads?
96. What is the difference between CommonJS and ES Modules?
97. How do you handle memory leaks in Node.js?
98. What is garbage collection?
99. What are Node.js best practices?
100. How do you debug Node.js applications?

### API Design & Architecture

101. What is RESTful API?
102. What are REST principles?
103. What is resource-based URL design?
104. How do you version APIs?
105. What is API versioning?
106. What is pagination?
107. How do you implement pagination?
108. What is filtering in APIs?
109. What is sorting in APIs?
110. What is HATEOAS?
111. What is GraphQL?
112. What is the difference between REST and GraphQL?
113. When should you use REST vs GraphQL?
114. What is an API Gateway?
115. What is rate limiting?
116. How do you implement rate limiting?
117. What is API throttling?
118. What is request validation?
119. What is response formatting?
120. What is content negotiation?

### Database Design & Optimization

121. What is database normalization?
122. What are the normal forms (1NF, 2NF, 3NF)?
123. What is denormalization?
124. When should you denormalize?
125. What is a database index?
126. How do indexes improve performance?
127. What are the types of indexes?
128. What is a composite index?
129. What is query optimization?
130. What is the EXPLAIN command?
131. What is database connection pooling?
132. Why is connection pooling important?
133. What is a database transaction?
134. What are ACID properties?
135. What is database migration?
136. How do you handle schema changes?
137. What is a database seed?
138. What is the N+1 query problem?
139. How do you solve the N+1 problem?
140. What is lazy loading vs eager loading?

### Design Patterns

141. What is a design pattern?
142. What is the Singleton pattern?
143. What is the Factory pattern?
144. What is the Repository pattern?
145. What is the Service pattern?
146. What is Dependency Injection?
147. What is the MVC pattern?
148. What is the difference between MVC and MVVM?
149. What is the Observer pattern?
150. What is the Strategy pattern?
151. What is the Decorator pattern?
152. What is the Adapter pattern?
153. What is the Middleware pattern?
154. What is the Module pattern?
155. When should you use each pattern?

### Authentication & Authorization

156. What is session-based authentication?
157. What is token-based authentication?
158. What is the difference between sessions and tokens?
159. What is JWT and how does it work?
160. What are the parts of a JWT?
161. What is JWT signing?
162. What is HS256 vs RS256?
163. What is refresh token?
164. How do you implement refresh tokens?
165. What is OAuth 2.0?
166. What is OpenID Connect?
167. What is RBAC (Role-Based Access Control)?
168. What is ABAC (Attribute-Based Access Control)?
169. How do you implement authorization middleware?
170. What is the difference between authentication and authorization middleware?
171. What is password hashing?
172. What is the difference between bcrypt and argon2?
173. What is salt in password hashing?
174. What is two-factor authentication (2FA)?
175. How do you implement 2FA?

### Caching Strategies

176. What is caching?
177. Why is caching important?
178. What is in-memory caching?
179. What is Redis?
180. What is Memcached?
181. What is the difference between Redis and Memcached?
182. What is cache invalidation?
183. What are cache invalidation strategies?
184. What is cache-aside pattern?
185. What is write-through caching?
186. What is write-behind caching?
187. What is TTL (Time To Live)?
188. What is cache stampede?
189. How do you prevent cache stampede?
190. What is CDN caching?

### Error Handling & Logging

191. What is centralized error handling?
192. How do you implement global error handler in Express?
193. What is error propagation?
194. What are operational vs programmer errors?
195. How do you handle async errors?
196. What is unhandled promise rejection?
197. What is uncaught exception?
198. What is structured logging?
199. What is Winston logger?
200. What is Morgan logger?
201. What log levels should you use?
202. What is log rotation?
203. What is ELK stack?
204. What is centralized logging?
205. How do you correlate logs across services?

### Testing & Quality

206. What is the testing pyramid?
207. What is the difference between unit and integration tests?
208. What is end-to-end testing?
209. What is mocking?
210. What is stubbing?
211. What is spying?
212. What is test coverage and what's a good percentage?
213. What is code coverage?
214. What is mutation testing?
215. What is Supertest?
216. How do you test API endpoints?
217. How do you test database interactions?
218. What is test isolation?
219. What are test fixtures?
220. What is Continuous Integration?

## Senior Developer & Software Engineer Questions

### System Design & Architecture

221. How would you design a URL shortening service?
222. How would you design a rate limiting system?
223. How would you design a real-time notification system?
224. How would you design a file upload system for large files?
225. How would you design a caching strategy for an e-commerce site?
226. What is microservices architecture?
227. What is monolithic architecture?
228. What are the differences between monolithic and microservices?
229. When should you use microservices vs monolith?
230. What is serverless architecture?
231. What are the pros and cons of serverless?
232. How would you design a multi-tenant SaaS application?
233. What are data isolation strategies in multi-tenant apps?
234. What is event-driven architecture?
235. What is CQRS (Command Query Responsibility Segregation)?
236. What is Event Sourcing?
237. What is the Saga pattern?
238. What is eventual consistency?
239. What is distributed logging and monitoring?
240. What is Domain-Driven Design (DDD)?

### Microservices Architecture

241. What are the principles of microservices?
242. How do microservices communicate?
243. What is service discovery?
244. What is a service mesh?
245. What is API Gateway pattern?
246. What is the Backend for Frontend (BFF) pattern?
247. What is circuit breaker pattern?
248. What is bulkhead pattern?
249. How do you handle distributed transactions?
250. What is the two-phase commit protocol?
251. What is compensating transactions?
252. How do you maintain data consistency across services?
253. What is distributed tracing?
254. What is correlation ID?
255. What is service orchestration vs choreography?
256. How do you handle service failures?
257. What is graceful degradation?
258. What is fault tolerance?
259. What is service versioning?
260. How do you handle breaking changes in microservices?

### Scalability & Performance

261. What is vertical scaling vs horizontal scaling?
262. What is load balancing?
263. What are load balancing algorithms?
264. What is sticky session?
265. What is the Node.js cluster module and how does it work?
266. What is PM2?
267. How do you scale Node.js applications?
268. What is database replication?
269. What is master-slave replication?
270. What is master-master replication?
271. What is database sharding?
272. What is horizontal vs vertical partitioning?
273. How do you choose a sharding key?
274. What is the CAP theorem?
275. What is the difference between consistency and availability?
276. What is eventual consistency?
277. How do you handle backpressure?
278. What is connection pooling and why is it important?
279. What is the N+1 problem and how do you solve it?
280. What is DataLoader pattern?
281. How do you optimize API response time?
282. What is database query optimization?
283. What is profiling and how do you profile Node.js apps?
284. What tools do you use for performance monitoring?
285. What is memory leak and how do you detect it?
286. How do you handle high-traffic scenarios?
287. What is CDN and how does it help with performance?
288. What is edge computing?
289. What is lazy loading?
290. What is pagination vs infinite scroll?

### Advanced Database

291. What is database indexing strategy?
292. What are covering indexes?
293. What is index selectivity?
294. What is query execution plan?
295. What is database partitioning?
296. What is table partitioning?
297. What is read replica?
298. How do you handle database migrations in production?
299. What is zero-downtime migration?
300. What is blue-green deployment?
301. What is database backup strategy?
302. What is RTO and RPO?
303. What is point-in-time recovery?
304. What is database monitoring?
305. What is slow query log?
306. What is connection pooling configuration?
307. What is deadlock and how do you prevent it?
308. What is optimistic vs pessimistic locking?
309. What is database snapshot?
310. What is polyglot persistence?
311. When should you use SQL vs NoSQL?
312. What is time-series database?
313. What is graph database?
314. What is document database?
315. What is key-value store?
316. What is in-memory database?
317. What is eventual consistency in NoSQL?
318. What is write amplification?
319. What is read amplification?
320. What is bloom filter?

### Security

321. What are common security vulnerabilities in Node.js?
322. What is OWASP Top 10?
323. How do you prevent SQL injection?
324. How do you prevent NoSQL injection?
325. What is XSS (Cross-Site Scripting)?
326. How do you prevent XSS attacks?
327. What is CSRF (Cross-Site Request Forgery)?
328. How do you prevent CSRF attacks?
329. What is Content Security Policy (CSP)?
330. What is Same-Origin Policy?
331. What is CORS in detail?
332. How do you configure CORS properly?
333. What is helmet.js?
334. What is rate limiting for security?
335. How do you store sensitive data?
336. What is encryption at rest vs in transit?
337. What is TLS/SSL?
338. What is certificate pinning?
339. What is secrets management?
340. What is HashiCorp Vault?
341. What is AWS Secrets Manager?
342. How do you handle API keys securely?
343. What is password policy?
344. How do you implement password reset securely?
345. What is account lockout policy?
346. What is security headers?
347. What is X-Frame-Options?
348. What is X-Content-Type-Options?
349. What is Strict-Transport-Security?
350. What is input validation vs sanitization?
351. How do you validate user input?
352. What is parameterized queries?
353. What is prepared statements?
354. What is principle of least privilege?
355. What is defense in depth?
356. What is security audit logging?
357. What is intrusion detection?
358. What is DDoS attack and how do you prevent it?
359. What is API security best practices?
360. What is zero trust security model?

### Message Queues & Event Streaming

361. What is a message queue?
362. What is RabbitMQ?
363. What is Apache Kafka?
364. What is Amazon SQS?
365. What is the difference between message queue and event streaming?
366. What is pub/sub pattern?
367. What is point-to-point messaging?
368. What is message broker?
369. What is message acknowledgment?
370. What is dead letter queue?
371. What is message ordering guarantee?
372. What is at-least-once delivery?
373. What is exactly-once delivery?
374. What is at-most-once delivery?
375. What is message partitioning?
376. What is consumer group?
377. What is event sourcing with Kafka?
378. What is CQRS with Kafka?
379. How do you handle message failures?
380. What is message retry strategy?
381. What is exponential backoff?
382. What is circuit breaker with message queues?
383. What is idempotency?
384. Why is idempotency important?
385. How do you make operations idempotent?
386. What is event-driven architecture?
387. What is choreography vs orchestration?
388. What is event schema registry?
389. What is event versioning?
390. How do you handle schema evolution?

### DevOps & Deployment

391. What is CI/CD?
392. What is Continuous Integration?
393. What is Continuous Deployment?
394. What is Continuous Delivery?
395. What is Docker?
396. What is a container?
397. What is the difference between VM and container?
398. What is Dockerfile?
399. What are Docker best practices for Node.js?
400. What is multi-stage Docker build?
401. What is Docker Compose?
402. What is Kubernetes?
403. What is a pod in Kubernetes?
404. What is a deployment in Kubernetes?
405. What is a service in Kubernetes?
406. What is Ingress in Kubernetes?
407. What is ConfigMap?
408. What is Secret in Kubernetes?
409. What is liveness probe?
410. What is readiness probe?
411. What is horizontal pod autoscaling?
412. What is Infrastructure as Code (IaC)?
413. What is Terraform?
414. What is CloudFormation?
415. What is blue-green deployment?
416. What is canary deployment?
417. What is rolling deployment?
418. What is feature flag?
419. How do you implement feature flags?
420. What is A/B testing?
421. What is smoke testing in deployment?
422. What is health check endpoint?
423. What is graceful shutdown?
424. How do you handle zero-downtime deployment?
425. What is database migration in deployment?
426. What is rollback strategy?
427. What is monitoring in production?
428. What is alerting strategy?
429. What is on-call rotation?
430. What is incident response?

### Cloud Architecture

431. What is cloud computing?
432. What is AWS?
433. What is Azure?
434. What is Google Cloud Platform?
435. What is EC2?
436. What is Lambda?
437. What is serverless computing?
438. What is API Gateway in AWS?
439. What is S3?
440. What is CloudFront?
441. What is RDS?
442. What is DynamoDB?
443. What is ElastiCache?
444. What is SQS?
445. What is SNS?
446. What is CloudWatch?
447. What is VPC?
448. What is subnet?
449. What is security group?
450. What is IAM?
451. What is auto-scaling?
452. What is elastic load balancer?
453. What is Route 53?
454. What is multi-region deployment?
455. What is disaster recovery strategy?
456. What is backup and restore?
457. What is pilot light?
458. What is warm standby?
459. What is multi-site active-active?
460. What is cloud cost optimization?

### Monitoring & Observability

461. What is observability?
462. What are the three pillars of observability?
463. What is logging?
464. What is metrics?
465. What is tracing?
466. What is APM (Application Performance Monitoring)?
467. What is New Relic?
468. What is DataDog?
469. What is Prometheus?
470. What is Grafana?
471. What is ELK stack (Elasticsearch, Logstash, Kibana)?
472. What is distributed tracing?
473. What is Jaeger?
474. What is Zipkin?
475. What is OpenTelemetry?
476. What metrics should you monitor?
477. What is RED method (Rate, Errors, Duration)?
478. What is USE method (Utilization, Saturation, Errors)?
479. What is SLA (Service Level Agreement)?
480. What is SLO (Service Level Objective)?
481. What is SLI (Service Level Indicator)?
482. What is error budget?
483. What is synthetic monitoring?
484. What is real user monitoring (RUM)?
485. What is alerting strategy?
486. What is alert fatigue?
487. What is incident management?
488. What is post-mortem?
489. What is root cause analysis?
490. What is chaos engineering?

### Code Quality & Best Practices

491. What is SOLID principles?
492. What is Single Responsibility Principle?
493. What is Open/Closed Principle?
494. What is Liskov Substitution Principle?
495. What is Interface Segregation Principle?
496. What is Dependency Inversion Principle?
497. What is DRY (Don't Repeat Yourself)?
498. What is KISS (Keep It Simple, Stupid)?
499. What is YAGNI (You Aren't Gonna Need It)?
500. What is separation of concerns?
501. What is code smell?
502. What is technical debt?
503. How do you manage technical debt?
504. What is refactoring?
505. What is code review?
506. What are code review best practices?
507. What is pair programming?
508. What is clean code?
509. What is self-documenting code?
510. What is API documentation?
511. What is Swagger/OpenAPI?
512. What is API versioning strategy?
513. What is semantic versioning?
514. What is backward compatibility?
515. What is forward compatibility?
516. What is deprecation strategy?
517. What is linting?
518. What is ESLint?
519. What is Prettier?
520. What is code formatting?
521. What is static code analysis?
522. What is SonarQube?
523. What is code complexity?
524. What is cyclomatic complexity?
525. What is coupling and cohesion?
526. What is tight coupling vs loose coupling?
527. What is dependency management?
528. What is semantic versioning for dependencies?
529. What is lock file (package-lock.json)?
530. What is npm audit?

### Advanced Topics

531. What is WebSocket?
532. How do you implement real-time features?
533. What is Socket.io?
534. What is Server-Sent Events (SSE)?
535. What is long polling?
536. What is gRPC?
537. What is Protocol Buffers?
538. When should you use gRPC vs REST?
539. What is GraphQL subscription?
540. What is webhook?
541. How do you implement webhooks?
542. What is webhook security?
543. What is webhook retry logic?
544. What is batch processing?
545. What is cron job?
546. What is job queue?
547. What is Bull queue?
548. What is background job processing?
549. What is worker pattern?
550. What is distributed lock?
551. What is Redis lock?
552. What is leader election?
553. What is consensus algorithm?
554. What is Raft?
555. What is Paxos?
556. What is distributed cache?
557. What is cache coherence?
558. What is cache consistency?
559. What is distributed session management?
560. What is session affinity?
561. What is API composition?
562. What is GraphQL federation?
563. What is schema stitching?
564. What is Apollo Federation?
565. What is API versioning in microservices?
566. What is contract testing?
567. What is Pact?
568. What is service mesh?
569. What is Istio?
570. What is Linkerd?
571. What is sidecar pattern?
572. What is ambassador pattern?
573. What is adapter pattern in microservices?
574. What is anti-corruption layer?
575. What is strangler fig pattern?
576. What is circuit breaker implementation?
577. What is retry mechanism?
578. What is timeout strategy?
579. What is fallback strategy?
580. What is chaos engineering?

### Architecture Patterns & Trade-offs

581. What is hexagonal architecture?
582. What is clean architecture?
583. What is onion architecture?
584. What is layered architecture?
585. What is event-driven architecture in detail?
586. What is space-based architecture?
587. What is peer-to-peer architecture?
588. What is client-server architecture?
589. What is three-tier architecture?
590. What is n-tier architecture?
591. What are architecture trade-offs?
592. What is consistency vs availability trade-off?
593. What is latency vs throughput trade-off?
594. What is complexity vs simplicity trade-off?
595. What is cost vs performance trade-off?
596. When should you choose SQL over NoSQL?
597. When should you choose synchronous over asynchronous?
598. When should you choose monolith over microservices?
599. When should you choose REST over GraphQL?
600. When should you choose serverless over containers?

### Real-World Scenarios

601. Your API is experiencing high latency - how do you investigate?
602. A service in your microservices is down - how do you handle it?
603. How do you migrate a monolith to microservices?
604. Your database is reaching capacity - what are your options?
605. How do you handle a sudden 10x traffic spike?
606. A critical bug is found in production - what's your response?
607. How do you refactor a legacy codebase?
608. How do you handle data inconsistency in distributed systems?
609. How do you design a system for Black Friday level traffic?
610. How do you implement a feature flag system?
611. How do you handle database schema changes in production?
612. How do you ensure high availability in your applications?
613. How do you debug a memory leak in production?
614. How do you handle cascading failures?
615. How do you implement disaster recovery?
616. How do you handle data migration between databases?
617. How do you implement multi-region deployment?
618. How do you handle time zone issues in global applications?
619. How do you implement soft delete vs hard delete?
620. How do you handle race conditions?
621. How do you implement optimistic locking?
622. How do you handle eventual consistency in UI?
623. How do you implement audit logging?
624. How do you handle GDPR compliance?
625. How do you implement data retention policies?
626. How do you handle large file uploads?
627. How do you implement video/image processing?
628. How do you handle internationalization (i18n)?
629. How do you implement search functionality?
630. How do you handle email delivery at scale?
631. How do you implement notification system?
632. How do you handle scheduled tasks in distributed systems?
633. How do you implement API rate limiting per user?
634. How do you handle API deprecation?
635. How do you implement data export functionality?
636. How do you handle database backup and restore?
637. How do you implement tenant isolation in multi-tenant app?
638. How do you handle cross-cutting concerns?
639. How do you implement request throttling?
640. How do you handle distributed transactions?

### Leadership & Soft Skills

641. How do you mentor junior developers?
642. How do you conduct code reviews?
643. How do you make technical decisions?
644. How do you balance technical debt vs new features?
645. How do you prioritize technical work?
646. How do you handle disagreements in technical discussions?
647. How do you document architectural decisions?
648. What is Architecture Decision Record (ADR)?
649. How do you communicate technical concepts to non-technical stakeholders?
650. How do you estimate project timelines?
651. How do you handle scope creep?
652. How do you manage technical risk?
653. How do you handle production incidents?
654. What is your on-call experience?
655. How do you conduct post-mortems?
656. How do you build a culture of quality?
657. How do you promote best practices in a team?
658. How do you handle technical interviews?
659. How do you evaluate technical candidates?
660. How do you onboard new team members?
661. How do you share knowledge within a team?
662. How do you stay updated with technology trends?
663. How do you decide when to adopt new technologies?
664. How do you handle legacy code?
665. How do you introduce testing in a project without tests?
666. How do you improve system reliability?
667. How do you improve system performance?
668. How do you improve developer productivity?
669. How do you reduce deployment time?
670. How do you improve code quality?
671. How do you handle technical presentations?
672. How do you write technical documentation?
673. How do you create technical roadmaps?
674. How do you align technical goals with business goals?
675. How do you handle changing requirements?
676. How do you manage stakeholder expectations?
677. How do you build consensus in technical decisions?
678. How do you handle pressure in production issues?
679. How do you learn from failures?
680. How do you celebrate successes?
