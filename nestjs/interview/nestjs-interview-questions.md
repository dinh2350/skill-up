# NestJS Interview Questions

This document contains a comprehensive list of NestJS interview questions ranging from junior to senior developer and software engineer levels.

## Junior Developer Questions

### Core Concepts

1. What is NestJS?
2. What are the main building blocks of a NestJS application?
3. What is a decorator in NestJS? Give some examples.
4. What is a DTO (Data Transfer Object)?
5. How do you define a route in NestJS?
6. What is dependency injection in NestJS?
7. What are Injection Scopes in NestJS?
8. What is the difference between SINGLETON, REQUEST, and TRANSIENT scopes?
9. What is a module in NestJS?
10. What is a controller in NestJS?
11. What is a provider in NestJS?
12. What is the `@Injectable()` decorator used for?
13. How do you create a new NestJS project?
14. What is the purpose of the `main.ts` file?
15. What is the difference between `@Module()` and `@Global()`?

### Basic Operations

16. How do you handle GET requests in NestJS?
17. How do you handle POST requests in NestJS?
18. How do you access route parameters?
19. How do you access query parameters?
20. How do you access the request body?
21. What is the `@Body()` decorator?
22. What is the `@Param()` decorator?
23. What is the `@Query()` decorator?
24. How do you return different HTTP status codes?
25. What is the `@HttpCode()` decorator?
26. How do you handle file uploads in NestJS?
27. What is the difference between `@Res()` and `@Response()`?
28. How do you set custom headers in a response?
29. What is the purpose of the `@Req()` decorator?
30. How do you handle exceptions in NestJS?

## Mid-level Developer Questions

### Advanced Request Handling

31. What are pipes in NestJS?
32. What are guards in NestJS?
33. What are interceptors in NestJS?
34. What is the difference between middleware and interceptors?
35. What are filters in NestJS?
36. What is the `ValidationPipe` and how do you use it?
37. What is the `ParseIntPipe` used for?
38. How do you create a custom pipe?
39. How do you create a custom guard?
40. How do you create a custom interceptor?
41. What is the request lifecycle in NestJS?
42. In what order do middleware, guards, interceptors, and pipes execute?
43. How do you implement authentication in NestJS?
44. How do you implement authorization in NestJS?
45. What is the difference between authentication and authorization?

### Configuration & Database

46. How do you handle configuration in a NestJS application?
47. What is the `@nestjs/config` module?
48. How do you use environment variables in NestJS?
49. How do you connect to a database in NestJS?
50. What is TypeORM and how do you use it with NestJS?
51. What is Mongoose and how do you use it with NestJS?
52. What is Prisma and how do you integrate it with NestJS?
53. How do you define entities in TypeORM?
54. How do you create database migrations?
55. What is a repository pattern in NestJS?
56. How do you perform database transactions?
57. What is the difference between `@nestjs/typeorm` and `@nestjs/mongoose`?
58. How do you handle database relationships in TypeORM?
59. What are database seeders and how do you implement them?
60. How do you implement pagination in NestJS?

### Validation & Transformation

61. What is `class-validator`?
62. What is `class-transformer`?
63. How do you validate nested objects?
64. How do you create custom validation decorators?
65. What is the difference between transformation and validation?
66. How do you handle optional fields in DTOs?
67. How do you implement conditional validation?
68. What is the `@IsOptional()` decorator?
69. What is the `@Transform()` decorator?
70. How do you validate arrays in DTOs?

## Senior Developer & Software Engineer Questions

### Architecture & Design Patterns

71. What are Dynamic Modules in NestJS?
72. What is the difference between `register()`, `forRoot()`, and `forFeature()`?
73. What is `forRootAsync()` used for?
74. What are custom decorators? How do you create one?
75. How do you implement the repository pattern in NestJS?
76. What is the factory pattern and how do you use it in NestJS?
77. How do you implement the strategy pattern in NestJS?
78. What is CQRS (Command and Query Responsibility Segregation)?
79. How can CQRS be implemented in NestJS?
80. What is Event Sourcing?
81. What is the difference between Commands and Queries in CQRS?
82. What are Sagas in the context of CQRS?
83. How do you implement domain-driven design (DDD) in NestJS?
84. What are Aggregates in DDD?
85. What are Value Objects in DDD?

### Advanced Concepts

86. What is Module Reference and how is it used?
87. What is Lazy-loading Modules in NestJS?
88. What is Execution Context in NestJS?
89. What are Lifecycle Events in NestJS?
90. What is the Discovery Service in NestJS?
91. What is the `Reflector` class used for?
92. How do you implement circular dependencies in NestJS?
93. What is the `forwardRef()` utility?
94. How do you handle race conditions in NestJS?
95. What is the `MetadataScanner` service?

### Microservices & Communication

96. What are microservices in the context of NestJS?
97. What transport layers does NestJS support for microservices?
98. How do you create a microservice in NestJS?
99. What is the difference between HTTP microservices and message-based microservices?
100. How do you implement gRPC in NestJS?
101. How do you implement message patterns with TCP?
102. How do you use Redis for microservices communication?
103. How do you implement RabbitMQ in NestJS?
104. What is the `@MessagePattern()` decorator?
105. What is the `@EventPattern()` decorator?
106. How do you handle microservice exceptions?
107. What is service discovery in microservices?
108. How do you implement API Gateway pattern in NestJS?
109. What is circuit breaker pattern and how do you implement it?
110. How do you handle distributed transactions?

### WebSockets & Real-time

111. How do you implement WebSockets in NestJS?
112. What is the `@WebSocketGateway()` decorator?
113. How do you handle WebSocket events?
114. What is the difference between `@SubscribeMessage()` and `@MessageBody()`?
115. How do you implement Socket.io in NestJS?
116. How do you handle WebSocket authentication?
117. How do you broadcast messages to all connected clients?
118. How do you implement rooms in WebSocket?
119. How do you handle WebSocket namespaces?
120. What is the difference between WebSockets and Server-Sent Events (SSE)?

### Testing

121. What are some strategies for testing a NestJS application?
122. How do you write unit tests in NestJS?
123. How do you write integration tests in NestJS?
124. How do you write end-to-end tests in NestJS?
125. What is `Test.createTestingModule()`?
126. How do you mock dependencies in tests?
127. How do you test controllers in NestJS?
128. How do you test services in NestJS?
129. How do you test guards in NestJS?
130. How do you test interceptors in NestJS?
131. How do you test pipes in NestJS?
132. What is the difference between `jest` and `supertest`?
133. How do you test database operations?
134. How do you implement test fixtures?
135. How do you test WebSocket gateways?
136. How do you implement code coverage in NestJS?
137. What is mutation testing?
138. How do you test microservices?
139. How do you implement contract testing?
140. What is the testing pyramid?

### Custom Providers

141. How would you implement a custom provider?
142. What is a Value Provider?
143. What is a Factory Provider?
144. What is an Alias Provider?
145. What is a Class Provider?
146. When would you use `useValue` vs `useFactory`?
147. How do you inject dependencies into a factory provider?
148. What is `useExisting` used for?
149. How do you create async providers?
150. What is the `@Inject()` decorator used for?

### Performance & Optimization

151. How do you optimize a NestJS application for production?
152. What are some caching strategies in NestJS?
153. How do you implement Redis caching in NestJS?
154. What is the `@nestjs/cache-manager` module?
155. How do you implement response compression?
156. How do you handle rate limiting in NestJS?
157. What is the `@nestjs/throttler` module?
158. How do you implement database connection pooling?
159. How do you optimize database queries?
160. How do you implement lazy loading for better performance?
161. What is clustering and how do you implement it in NestJS?
162. How do you profile a NestJS application?
163. What are some common performance bottlenecks?
164. How do you implement pagination efficiently?
165. How do you handle memory leaks in NestJS?

### Security

166. What are some security best practices for NestJS applications?
167. How do you implement JWT authentication in NestJS?
168. What is Passport.js and how do you use it with NestJS?
169. How do you implement OAuth2 in NestJS?
170. What is helmet and why should you use it?
171. How do you prevent SQL injection attacks?
172. How do you prevent XSS attacks in NestJS?
173. How do you implement CSRF protection?
174. What is CORS and how do you configure it?
175. How do you implement role-based access control (RBAC)?
176. How do you implement attribute-based access control (ABAC)?
177. How do you secure sensitive data in environment variables?
178. How do you implement API key authentication?
179. What is the principle of least privilege?
180. How do you implement two-factor authentication?
181. How do you handle password hashing?
182. What is bcrypt and how do you use it?
183. How do you implement refresh tokens?
184. How do you handle session management?
185. How do you implement security headers?

### GraphQL

186. How do you implement GraphQL in NestJS?
187. What is the `@nestjs/graphql` module?
188. What is the difference between code-first and schema-first approaches?
189. How do you define resolvers in NestJS?
190. What are GraphQL mutations?
191. What are GraphQL subscriptions?
192. How do you implement authentication in GraphQL?
193. How do you handle N+1 query problem in GraphQL?
194. What is DataLoader and how do you use it?
195. How do you implement pagination in GraphQL?
196. What are GraphQL directives?
197. How do you implement custom scalars in GraphQL?
198. How do you handle file uploads in GraphQL?
199. What is the difference between Query and Mutation?
200. How do you implement real-time updates with GraphQL subscriptions?

### DevOps & Deployment

201. How do you deploy a NestJS application?
202. How do you containerize a NestJS application with Docker?
203. How do you implement health checks in NestJS?
204. What is the `@nestjs/terminus` module?
205. How do you implement graceful shutdown?
206. How do you handle application logging?
207. What is Winston and how do you integrate it?
208. How do you implement structured logging?
209. How do you monitor a NestJS application in production?
210. How do you implement distributed tracing?
211. What is OpenTelemetry?
212. How do you implement CI/CD for NestJS applications?
213. How do you handle database migrations in production?
214. How do you implement blue-green deployment?
215. How do you implement canary deployment?
216. How do you handle secrets management?
217. How do you implement auto-scaling?
218. What is Kubernetes and how do you deploy NestJS on it?
219. How do you implement horizontal pod autoscaling?
220. How do you handle application configuration in different environments?

### Advanced Topics

221. How do you implement multi-tenancy in NestJS?
222. How do you implement soft deletes?
223. How do you implement audit logging?
224. How do you implement event-driven architecture?
225. What is the difference between events and messages?
226. How do you implement background jobs in NestJS?
227. What is BullMQ and how do you use it with NestJS?
228. How do you implement scheduled tasks (cron jobs)?
229. What is the `@nestjs/schedule` module?
230. How do you implement worker threads in NestJS?
231. How do you handle long-running processes?
232. How do you implement idempotency in APIs?
233. How do you implement API versioning?
234. What are some strategies for API versioning?
235. How do you implement request/response logging?
236. How do you implement global exception filters?
237. How do you implement custom exception classes?
238. How do you handle file streaming?
239. How do you implement server-side rendering (SSR)?
240. How do you implement webhooks in NestJS?
241. How do you handle webhook retries?
242. How do you implement feature flags?
243. How do you implement A/B testing?
244. How do you implement distributed locks?
245. How do you implement saga pattern for distributed transactions?
246. How do you handle eventual consistency?
247. What is the outbox pattern?
248. How do you implement API documentation?
249. What is Swagger and how do you integrate it with NestJS?
250. How do you implement OpenAPI specification?
