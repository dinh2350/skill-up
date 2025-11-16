# Node.js Interview Questions

This document contains a comprehensive list of Node.js interview questions ranging from junior to senior developer and software engineer levels.

## Junior Developer Questions

1. What is Node.js?
2. What is NPM?
3. What is the difference between `require` and `import`?
4. How do you handle asynchronous operations in Node.js?
5. What is `package.json`?
6. What is the event loop in Node.js?
7. What is the `node_modules` directory?
8. How do you debug a Node.js application?
9. What is the difference between `==` and `===` in JavaScript?
10. What are callbacks in Node.js?
11. What is a Promise?
12. What is `async/await`?
13. What is the purpose of `npm install`?
14. What is the difference between dependencies and devDependencies?
15. What is the `global` object in Node.js?
16. What is `__dirname` and `__filename`?
17. How do you read a file in Node.js?
18. How do you write to a file in Node.js?
19. What is the `fs` module?
20. What is the `path` module?
21. What is callback hell and how do you avoid it?
22. What is the `http` module used for?
23. How do you create a simple HTTP server in Node.js?
24. What is the difference between synchronous and asynchronous methods?
25. What is `JSON.parse()` and `JSON.stringify()`?

## Mid-level Developer Questions

1. What is the difference between `process.nextTick()` and `setImmediate()`?
2. What are streams in Node.js?
3. How does Node.js handle child processes?
4. What is middleware in the context of Express.js?
5. Explain error handling in Node.js.
6. What is the purpose of `module.exports` and `exports`?
7. What is the difference between `fork()` and `spawn()` in the `child_process` module?
8. What are some common use cases for Node.js?
9. What is the difference between `exec()` and `execFile()` in the child_process module?
10. What are EventEmitters in Node.js?
11. What is clustering in Node.js?
12. What is the purpose of the `cluster` module?
13. How do you handle environment variables in Node.js?
14. What is the `dotenv` package?
15. What are the different types of streams in Node.js?
16. What is piping in streams?
17. What is backpressure in streams?
18. How do you create a custom stream?
19. What is the difference between readable and writable streams?
20. What are duplex and transform streams?
21. What is the purpose of `Buffer.alloc()` vs `Buffer.allocUnsafe()`?
22. How do you handle CORS in an Express.js application?
23. What is request validation and how do you implement it?
24. What are template engines in Express.js?
25. What is the purpose of body-parser middleware?
26. How do you handle file uploads in Node.js?
27. What is the difference between PUT and PATCH HTTP methods?
28. How do you implement pagination in an API?
29. What is the purpose of the `crypto` module?
30. How do you handle sessions in Express.js?
31. What is the difference between cookies and sessions?
32. What are HTTP status codes and when do you use them?
33. How do you implement error handling middleware in Express?
34. What is the purpose of the `async` library?
35. How do you prevent callback hell?

## Senior Developer & Software Engineer Questions

### Architecture & Design

1. Explain the Node.js event loop in detail (all phases).
2. How can you scale a Node.js application?
3. What is libuv and how does it work?
4. How does garbage collection work in V8?
5. What are the security best practices for a Node.js application?
6. What are Buffers in Node.js and when should you use them?
7. Design a RESTful API using Node.js and Express.js (best practices).
8. How does Node.js handle memory leaks? What tools can you use to diagnose them?
9. What is the V8 engine and how does it work with Node.js?
10. What is the difference between worker threads and child processes?
11. When would you use worker threads vs child processes?
12. How do you optimize the performance of a Node.js application?
13. What is the difference between horizontal and vertical scaling?
14. What are microservices and how do they relate to Node.js?
15. How do you design a fault-tolerant system in Node.js?
16. What are the trade-offs between monolithic and microservice architectures?
17. How do you implement service discovery in a microservices architecture?
18. What is event-driven architecture and how does it apply to Node.js?
19. How do you handle backward compatibility in API versioning?
20. What are some strategies for handling high-traffic scenarios?

### Performance & Optimization

21. How do you implement caching in a Node.js application?
22. What is connection pooling and why is it important?
23. How do you handle database connections in a production Node.js application?
24. What is the N+1 query problem and how do you solve it?
25. How do you profile and benchmark a Node.js application?
26. What are memory leaks and how do you prevent them?
27. How do you optimize database queries in Node.js?
28. What is lazy loading and when should you use it?
29. How do you implement efficient data serialization?
30. What are the best practices for handling large files?
31. How do you optimize API response times?
32. What is database indexing and how does it affect performance?
33. How do you implement efficient pagination for large datasets?
34. What is the difference between caching strategies (LRU, LFU, etc.)?
35. How do you handle memory constraints in Node.js?

### Security

36. How do you implement JWT authentication?
37. What is OAuth and how do you implement it in Node.js?
38. How do you handle rate limiting in an API?
39. What is SQL injection and how do you prevent it?
40. What is XSS (Cross-Site Scripting) and how do you prevent it?
41. What is CSRF (Cross-Site Request Forgery) and how do you prevent it?
42. How do you implement encryption in Node.js?
43. What are some best practices for storing passwords?
44. How do you implement API key authentication?
45. What is the principle of least privilege?
46. How do you handle sensitive data in logs?
47. What is HTTPS and how do you implement it in Node.js?
48. How do you implement two-factor authentication?
49. What are security headers and why are they important?
50. How do you perform security audits on Node.js applications?

### DevOps & Deployment

51. What are best practices for logging in Node.js?
52. How do you implement graceful shutdown in Node.js?
53. What is the purpose of process managers like PM2?
54. How do you monitor a Node.js application in production?
55. What is APM (Application Performance Monitoring)?
56. How do you implement distributed tracing?
57. How do you implement CI/CD for Node.js applications?
58. What are Docker containers and how do you use them with Node.js?
59. How do you implement blue-green deployments?
60. What is canary deployment?
61. How do you handle database migrations?
62. What is infrastructure as code (IaC)?
63. How do you implement auto-scaling for Node.js applications?
64. What are health checks and how do you implement them?
65. How do you handle application secrets in production?
66. What is the twelve-factor app methodology?
67. How do you implement zero-downtime deployments?
68. What are rolling deployments?
69. How do you implement backup and disaster recovery?
70. What is container orchestration (Kubernetes)?

### Testing

71. What are some strategies for testing Node.js applications?
72. How do you implement integration testing vs unit testing?
73. What is test-driven development (TDD)?
74. What is the difference between mocking and stubbing?
75. How do you test asynchronous code in Node.js?
76. What is code coverage and why is it important?
77. How do you implement end-to-end testing?
78. What are some popular testing frameworks for Node.js?
79. How do you test APIs?
80. What is continuous testing?
81. How do you implement load testing?
82. What is the difference between functional and non-functional testing?
83. How do you test error handling?
84. What is mutation testing?
85. How do you implement contract testing in microservices?

### Database & Data Management

86. What are ORMs and when would you use them?
87. What is the difference between SQL and NoSQL databases?
88. How do you handle database transactions in Node.js?
89. What is ACID in database transactions?
90. What is eventual consistency?
91. How do you implement data validation at scale?
92. What is database sharding?
93. What is database replication?
94. How do you handle data migration between different database versions?
95. What is the CAP theorem?
96. How do you implement full-text search?
97. What is denormalization and when should you use it?
98. How do you handle time zones in a global application?
99. What is soft delete vs hard delete?
100.  How do you implement data archiving?

### Real-time & Messaging

101. How do you implement message queues in Node.js?
102. What is the difference between Redis and Memcached?
103. How do you implement WebSockets in Node.js?
104. What is the difference between HTTP/1.1 and HTTP/2?
105. How do you implement server-sent events (SSE)?
106. How do you implement real-time features in Node.js?
107. What is pub/sub pattern?
108. What is the difference between message queues and event streaming?
109. How do you implement long polling?
110. What is gRPC and how does it compare to REST?
111. What is GraphQL and how do you implement it in Node.js?
112. How do you handle WebSocket authentication?
113. What are some strategies for handling disconnections in real-time apps?
114. How do you implement room-based messaging?
115. What is backpressure in message queues?

### Design Patterns & Best Practices

116. What are some common Node.js design patterns?
117. What is the Singleton pattern and when do you use it?
118. What is dependency injection?
119. What is the Factory pattern?
120. What is the Observer pattern?
121. What is the Strategy pattern?
122. What is the Repository pattern?
123. How do you implement the Circuit Breaker pattern?
124. What is the Retry pattern?
125. What is the Bulkhead pattern?
126. How do you implement middleware patterns?
127. What is the Adapter pattern?
128. What is the Decorator pattern?
129. What is clean architecture?
130. What is hexagonal architecture?
131. What is the purpose of DTOs (Data Transfer Objects)?
132. How do you implement SOLID principles in Node.js?
133. What is the DRY principle?
134. What is the KISS principle?
135. What is YAGNI?

### Advanced Topics

136. How do you implement distributed locks?
137. What is idempotency and why is it important?
138. How do you handle distributed transactions?
139. What is the Saga pattern?
140. How do you implement rate limiting at scale?
141. What is API gateway pattern?
142. How do you implement request throttling?
143. What is connection draining?
144. How do you implement feature flags?
145. What is A/B testing and how do you implement it?
146. How do you handle versioning in microservices?
147. What is service mesh?
148. How do you implement distributed caching?
149. What is database connection pooling best practices?
150. How do you implement observability (logs, metrics, traces)?
