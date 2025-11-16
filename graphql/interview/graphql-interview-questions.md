# GraphQL Interview Questions

This document contains a comprehensive list of GraphQL interview questions ranging from junior to senior developer and software engineer levels.

## Junior Developer Questions

### GraphQL Basics

1. What is GraphQL?
2. Who created GraphQL and when?
3. What problems does GraphQL solve?
4. What is the difference between GraphQL and REST?
5. What are the main advantages of GraphQL over REST?
6. What are the disadvantages of GraphQL?
7. What is a GraphQL schema?
8. What is a GraphQL query?
9. What is a GraphQL mutation?
10. What is a GraphQL subscription?
11. What is the GraphQL type system?
12. What are scalar types in GraphQL?
13. What are the default scalar types?
14. What is a GraphQL field?
15. What is a GraphQL argument?

### Queries & Types

16. How do you write a basic GraphQL query?
17. What is query syntax in GraphQL?
18. How do you pass arguments to a query?
19. What are aliases in GraphQL?
20. What are fragments in GraphQL?
21. What is the purpose of fragments?
22. How do you use variables in GraphQL queries?
23. What are operation names?
24. What is the exclamation mark (!) in GraphQL?
25. What does the question mark mean in GraphQL types?
26. What is a nullable field?
27. What is a non-nullable field?
28. What is a list type in GraphQL?
29. How do you define an array in GraphQL?
30. What is the difference between [String]! and [String!]!?

### Schema Definition

31. What is SDL (Schema Definition Language)?
32. How do you define a type in GraphQL?
33. What is an Object type?
34. What is the Query type?
35. What is the Mutation type?
36. What is the Subscription type?
37. What is an Input type?
38. What is an Interface type?
39. What is a Union type?
40. What is an Enum type?
41. How do you define required fields?
42. How do you define optional fields?
43. What is the ID scalar type?
44. When should you use ID vs String?
45. What is a custom scalar type?

### Resolvers

46. What is a resolver?
47. What is the purpose of resolvers?
48. What are the parameters of a resolver function?
49. What is the parent/root argument in a resolver?
50. What is the args argument in a resolver?
51. What is the context argument in a resolver?
52. What is the info argument in a resolver?
53. How do resolvers work?
54. What is resolver chaining?
55. What is the execution order of resolvers?
56. How do you return data from a resolver?
57. How do you handle errors in resolvers?
58. What is a default resolver?
59. What is a trivial resolver?
60. When do you need to write explicit resolvers?

## Mid-level Developer Questions

### Advanced Queries

61. What are nested queries in GraphQL?
62. How does GraphQL handle nested data?
63. What are inline fragments?
64. What are named fragments?
65. What is fragment spreading?
66. What are directives in GraphQL?
67. What is the @include directive?
68. What is the @skip directive?
69. What is the @deprecated directive?
70. How do you create custom directives?
71. What are variables in GraphQL?
72. How do you define variable types?
73. What are default values for variables?
74. What is query batching?
75. What is query complexity?

### Mutations

76. What is a mutation in GraphQL?
77. How do you define a mutation?
78. What is the difference between Query and Mutation?
79. How do you perform multiple mutations?
80. What is the execution order of multiple mutations?
81. Are mutations executed serially or parallel?
82. How do you return data from a mutation?
83. What are input types in mutations?
84. Why use Input types instead of regular types?
85. What is a payload type?
86. What are mutation best practices?
87. How do you handle validation in mutations?
88. How do you handle authorization in mutations?
89. What is optimistic UI with mutations?
90. What are mutation patterns?

### Subscriptions

91. What are subscriptions in GraphQL?
92. How do subscriptions differ from queries and mutations?
93. When should you use subscriptions?
94. What protocol do subscriptions use?
95. What is WebSocket in GraphQL subscriptions?
96. How do you define a subscription?
97. How do you implement a subscription resolver?
98. What is PubSub in GraphQL?
99. How do you publish events in subscriptions?
100. How do you subscribe to events?
101. What is subscription filtering?
102. What are subscription best practices?
103. What are the alternatives to subscriptions?
104. What is polling vs subscriptions?
105. What are Server-Sent Events (SSE) vs WebSockets?

### Schema Design

106. What are schema design best practices?
107. What is schema stitching?
108. What is schema federation?
109. What is the difference between stitching and federation?
110. How do you design a good GraphQL schema?
111. What is the Connection pattern?
112. What is pagination in GraphQL?
113. What are the different pagination patterns?
114. What is cursor-based pagination?
115. What is offset-based pagination?
116. What is the Relay cursor connection specification?
117. What are edges and nodes in pagination?
118. What is the PageInfo type?
119. How do you implement filtering in GraphQL?
120. How do you implement sorting in GraphQL?

### Type System

121. What is the GraphQL type system?
122. What are Object types?
123. What are Scalar types?
124. What are Enum types?
125. What are Interface types?
126. What are Union types?
127. What are Input Object types?
128. What is the difference between type and input?
129. When should you use Interface vs Union?
130. How do you extend types?
131. What is type extension?
132. What are implements in GraphQL?
133. How does interface inheritance work?
134. What is polymorphism in GraphQL?
135. What are abstract types?

### Error Handling

136. How does error handling work in GraphQL?
137. What is the errors field in a GraphQL response?
138. What is partial data in GraphQL?
139. How do you throw errors in resolvers?
140. What is the GraphQLError class?
141. How do you create custom error types?
142. What are error extensions?
143. How do you handle validation errors?
144. How do you handle authentication errors?
145. How do you handle authorization errors?
146. What are error codes in GraphQL?
147. What is error masking?
148. How do you log errors in GraphQL?
149. What are best practices for error handling?
150. How do you handle null propagation?

## Senior Developer & Software Engineer Questions

### Advanced Architecture

151. What is the N+1 problem in GraphQL?
152. How do you solve the N+1 problem?
153. What is DataLoader?
154. How does DataLoader work?
155. What is batching in DataLoader?
156. What is caching in DataLoader?
157. How do you implement DataLoader?
158. What are the benefits of DataLoader?
159. What are DataLoader best practices?
160. What is the execution model of GraphQL?
161. What is the GraphQL execution algorithm?
162. How does GraphQL resolve fields?
163. What is the resolver execution order?
164. What is parallel execution in GraphQL?
165. What is the complexity of GraphQL queries?

### Performance Optimization

166. How do you optimize GraphQL performance?
167. What is query complexity analysis?
168. How do you calculate query complexity?
169. What is query depth limiting?
170. What is query timeout?
171. What is rate limiting in GraphQL?
172. What is query cost analysis?
173. How do you implement query complexity limits?
174. What is persisted queries?
175. What are automatic persisted queries (APQ)?
176. What are the benefits of persisted queries?
177. How do you implement query whitelisting?
178. What is response caching in GraphQL?
179. What is partial query caching?
180. What is HTTP caching with GraphQL?
181. What are cache directives?
182. What is the @cacheControl directive?
183. How do you implement field-level caching?
184. What is CDN caching for GraphQL?
185. What are cache invalidation strategies?

### Security

186. What are GraphQL security concerns?
187. How do you prevent DoS attacks in GraphQL?
188. What is query depth attack?
189. What is query complexity attack?
190. How do you implement authentication in GraphQL?
191. How do you implement authorization in GraphQL?
192. What is field-level authorization?
193. What is the context object used for in security?
194. How do you protect against introspection attacks?
195. Should you disable introspection in production?
196. What is query batching attack?
197. How do you sanitize user input?
198. What is injection attack prevention?
199. How do you handle sensitive data in GraphQL?
200. What are security best practices for GraphQL?

### Schema Federation

201. What is Apollo Federation?
202. What are federated services?
203. What is a subgraph?
204. What is a supergraph?
205. What is the gateway in federation?
206. How does schema federation work?
207. What is the @key directive in federation?
208. What is the @extends directive?
209. What is the @external directive?
210. What is the @requires directive?
211. What is the @provides directive?
212. What is entity resolution in federation?
213. How do you reference entities across services?
214. What is the _entities query?
215. What is the _service query?
216. What are federation best practices?
217. How do you handle breaking changes in federation?
218. What is schema composition?
219. What are composition errors?
220. How do you test federated schemas?

### Advanced Patterns

221. What is the Relay specification?
222. What is the Relay cursor connection?
223. What are Global Object Identification in Relay?
224. What is the Node interface?
225. What is refetching in GraphQL?
226. What is the defer directive?
227. What is the stream directive?
228. What is incremental delivery?
229. What is live queries?
230. What is the difference between subscriptions and live queries?
231. What are custom scalars?
232. How do you create custom scalar types?
233. What is scalar serialization?
234. What is scalar parsing?
235. What is scalar validation?
236. What are schema directives?
237. How do you create custom schema directives?
238. What is directive composition?
239. What are executable directives?
240. What are type system directives?

### Testing

241. How do you test GraphQL APIs?
242. What is unit testing for resolvers?
243. What is integration testing for GraphQL?
244. What is end-to-end testing for GraphQL?
245. How do you mock GraphQL responses?
246. What are GraphQL testing libraries?
247. How do you test queries?
248. How do you test mutations?
249. How do you test subscriptions?
250. How do you test error handling?
251. What is schema testing?
252. How do you validate schemas?
253. What is the GraphQL schema linter?
254. How do you test performance?
255. How do you test query complexity?
256. What is snapshot testing for GraphQL?
257. How do you test authentication?
258. How do you test authorization?
259. What are GraphQL testing best practices?
260. How do you test federated schemas?

### GraphQL Clients

261. What are GraphQL clients?
262. What is Apollo Client?
263. What is Relay?
264. What is URQL?
265. What is graphql-request?
266. What are the differences between GraphQL clients?
267. What is client-side caching?
268. What is normalized caching?
269. How does Apollo Client cache work?
270. What is the InMemoryCache?
271. What are cache policies?
272. What is fetch policy in Apollo Client?
273. What is optimistic UI?
274. How do you implement optimistic updates?
275. What is cache invalidation?
276. What is refetching queries?
277. What is polling in GraphQL clients?
278. What are client-side schemas?
279. What is local state management in GraphQL?
280. What are reactive variables?

### GraphQL Servers

281. What are popular GraphQL server implementations?
282. What is Apollo Server?
283. What is GraphQL Yoga?
284. What is Express GraphQL?
285. What is GraphQL.js?
286. What is Mercurius?
287. What is Hasura?
288. What is Postgraphile?
289. What is Prisma?
290. How do you set up a GraphQL server?
291. What is schema-first development?
292. What is code-first development?
293. What are the pros/cons of schema-first vs code-first?
294. What is type-graphql?
295. What is graphql-code-generator?
296. What is automatic schema generation?
297. What is schema delegation?
298. What is remote schema execution?
299. What is schema transformation?
300. What are GraphQL middleware?

### Advanced Type System

301. What is conditional type resolution?
302. What are abstract types in GraphQL?
303. How do you resolve Union types?
304. How do you resolve Interface types?
305. What is the __resolveType function?
306. What is the isTypeOf function?
307. When should you use __resolveType vs isTypeOf?
308. What is type narrowing in GraphQL?
309. What are type guards in resolvers?
310. What is covariance in GraphQL types?
311. What is contravariance in GraphQL types?
312. What is schema evolution?
313. How do you version GraphQL schemas?
314. What are breaking changes in schemas?
315. What are non-breaking changes in schemas?
316. How do you deprecate fields?
317. What is field deprecation strategy?
318. How do you handle schema migrations?
319. What is backward compatibility?
320. What is forward compatibility?

### Real-time & Streaming

321. What are different real-time patterns in GraphQL?
322. What is the difference between subscriptions and live queries?
323. What is the GraphQL over WebSocket protocol?
324. What is graphql-ws library?
325. What is subscriptions-transport-ws?
326. What is the difference between graphql-ws and subscriptions-transport-ws?
327. How do you handle subscription authentication?
328. How do you handle subscription authorization?
329. What is subscription filtering on the server?
330. What is subscription throttling?
331. What are subscription connection management strategies?
332. What is subscription scalability?
333. How do you scale subscriptions horizontally?
334. What is Redis PubSub for subscriptions?
335. What are distributed subscriptions?
336. What is the @defer directive for incremental delivery?
337. What is the @stream directive for lists?
338. How does incremental delivery work?
339. What are multipart responses?
340. What are the benefits of incremental delivery?

### Monitoring & Observability

341. How do you monitor GraphQL APIs?
342. What metrics should you track?
343. What is query tracing?
344. What is Apollo Studio?
345. What is GraphQL metrics?
346. How do you measure query performance?
347. What is resolver-level tracing?
348. What is field-level metrics?
349. How do you implement logging in GraphQL?
350. What is structured logging?
351. How do you track errors in production?
352. What is error reporting in GraphQL?
353. What is distributed tracing?
354. How do you integrate GraphQL with APM tools?
355. What is OpenTelemetry for GraphQL?
356. How do you debug GraphQL queries?
357. What is the GraphQL Playground?
358. What is GraphiQL?
359. What is the Apollo Sandbox?
360. What are GraphQL developer tools?

### Code Generation

361. What is GraphQL code generation?
362. What is graphql-code-generator?
363. What types can be generated from schemas?
364. How do you generate TypeScript types?
365. How do you generate resolvers?
366. What is client-side code generation?
367. What is server-side code generation?
368. What are code generation plugins?
369. How do you generate React hooks from queries?
370. What is type-safe GraphQL development?
371. What are the benefits of code generation?
372. What are code generation best practices?
373. How do you keep generated code in sync?
374. What is schema introspection for codegen?
375. What is operation extraction?
376. How do you generate documentation from schemas?
377. What is GraphQL schema documentation?
378. What are schema comments?
379. What is the description field in schemas?
380. How do you generate API documentation?

### Advanced Resolver Patterns

381. What are resolver chains?
382. What is resolver composition?
383. What are higher-order resolvers?
384. What are resolver middleware?
385. How do you implement field middleware?
386. What is the resolver wrapper pattern?
387. What is lazy loading in resolvers?
388. What is eager loading in resolvers?
389. What is data prefetching?
390. What is resolver delegation?
391. What is schema delegation pattern?
392. What are remote resolvers?
393. What is the gateway pattern?
394. What is BFF (Backend for Frontend) with GraphQL?
395. What is resolver batching?
396. What is resolver memoization?
397. What is context injection in resolvers?
398. What is dependency injection with GraphQL?
399. What are resolver factories?
400. What are generic resolvers?

### Microservices & Distribution

401. How do you use GraphQL in microservices?
402. What is the GraphQL gateway pattern?
403. What is schema stitching in microservices?
404. What is federation in microservices?
405. What are the differences between gateway patterns?
406. How do you handle service discovery?
407. What is service composition?
408. How do you handle cross-service queries?
409. What is distributed GraphQL architecture?
410. How do you handle transactions across services?
411. What is the saga pattern with GraphQL?
412. What is eventual consistency in GraphQL?
413. How do you handle service failures?
414. What is circuit breaking in GraphQL?
415. What is retry logic in resolvers?
416. What is graceful degradation?
417. How do you handle partial failures?
418. What is the bulkhead pattern?
419. How do you implement timeout strategies?
420. What are distributed caching strategies?

### GraphQL Ecosystem

421. What is the GraphQL Foundation?
422. What is the GraphQL specification?
423. What is the GraphQL Working Group?
424. What are GraphQL RFCs?
425. What is the future of GraphQL?
426. What are upcoming GraphQL features?
427. What is GraphQL-over-HTTP specification?
428. What is the GraphQL multipart request specification?
429. What are GraphQL best practices from the community?
430. What are popular GraphQL tools?
431. What is GraphQL Inspector?
432. What is GraphQL ESLint?
433. What is GraphQL Config?
434. What are GraphQL IDE tools?
435. What is Postman for GraphQL?
436. What is Insomnia for GraphQL?
437. What are GraphQL schema registries?
438. What is schema governance?
439. What are GraphQL conventions?
440. What is the GraphQL style guide?

### Advanced Topics

441. What is GraphQL subscriptions over SSE?
442. What is nullability in GraphQL?
443. What is the null propagation model?
444. How do you handle nullable errors?
445. What is schema transformation?
446. What are schema directives for transformation?
447. What is dynamic schema generation?
448. What is runtime schema modification?
449. What is the visitor pattern in GraphQL?
450. What is AST manipulation?
451. What is the GraphQL AST?
452. How do you parse GraphQL queries?
453. What is query validation?
454. What are validation rules?
455. How do you create custom validation rules?
456. What is the execution engine?
457. How do you customize the execution engine?
458. What are execution extensions?
459. What is the GraphQL middleware pattern?
460. What are lifecycle hooks?

### Integration & Interoperability

461. How do you integrate GraphQL with REST APIs?
462. What is the REST wrapper pattern?
463. How do you migrate from REST to GraphQL?
464. What is incremental GraphQL adoption?
465. How do you integrate GraphQL with gRPC?
466. How do you integrate GraphQL with WebSockets?
467. How do you integrate GraphQL with message queues?
468. What is GraphQL with Kafka?
469. What is GraphQL with RabbitMQ?
470. How do you integrate GraphQL with databases?
471. What is direct database access vs service layer?
472. What is GraphQL with SQL databases?
473. What is GraphQL with NoSQL databases?
474. What is Prisma for GraphQL?
475. What is Hasura for databases?
476. What is Postgraphile for PostgreSQL?
477. What is GraphQL with MongoDB?
478. What is GraphQL with Redis?
479. What is GraphQL with Elasticsearch?
480. How do you handle database transactions in GraphQL?

### Production & Operations

481. How do you deploy GraphQL to production?
482. What are GraphQL production considerations?
483. How do you handle GraphQL versioning?
484. What is schema registry in production?
485. How do you manage schema changes?
486. What is blue-green deployment for GraphQL?
487. What is canary deployment for GraphQL?
488. How do you rollback GraphQL changes?
489. What is feature flagging with GraphQL?
490. How do you handle backward compatibility?
491. What are GraphQL SLA considerations?
492. How do you ensure high availability?
493. What is load balancing for GraphQL?
494. What is horizontal scaling for GraphQL?
495. What is vertical scaling considerations?
496. How do you handle GraphQL in serverless?
497. What is GraphQL with AWS Lambda?
498. What is GraphQL with edge computing?
499. What are GraphQL CDN strategies?
500. What are GraphQL production best practices?
