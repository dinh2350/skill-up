# PostgreSQL Interview Questions

This document contains a comprehensive list of PostgreSQL interview questions ranging from junior to senior developer and software engineer levels.

## Junior Developer Questions

### SQL Basics

1. What is SQL?
2. What is PostgreSQL?
3. What are primary keys and foreign keys?
4. What is the difference between `DELETE`, `TRUNCATE`, and `DROP`?
5. What are `JOIN`s? Explain different types of `JOIN`s.
6. What is an index?
7. What is the difference between `WHERE` and `HAVING`?
8. What is the difference between `CHAR` and `VARCHAR`?
9. What is a `NULL` value?
10. What is the difference between `NULL` and an empty string?
11. What are constraints in SQL?
12. What is a `UNIQUE` constraint?
13. What is a `NOT NULL` constraint?
14. What is a `CHECK` constraint?
15. What is a `DEFAULT` constraint?

### Basic Queries

16. How do you select all columns from a table?
17. How do you select specific columns from a table?
18. How do you filter rows using `WHERE`?
19. How do you sort results using `ORDER BY`?
20. What is the difference between `ASC` and `DESC`?
21. How do you limit the number of rows returned?
22. What is the `DISTINCT` keyword used for?
23. How do you use the `LIKE` operator?
24. What are wildcard characters in SQL?
25. How do you use the `IN` operator?
26. How do you use the `BETWEEN` operator?
27. How do you use the `IS NULL` operator?
28. How do you insert data into a table?
29. How do you update existing data?
30. How do you delete data from a table?

### Basic Data Types

31. What are the numeric data types in PostgreSQL?
32. What are the character data types in PostgreSQL?
33. What are the date/time data types in PostgreSQL?
34. What is the `BOOLEAN` data type?
35. What is the difference between `TIMESTAMP` and `TIMESTAMPTZ`?
36. What is the `SERIAL` data type?
37. What is the `UUID` data type?
38. What is the `JSON` data type?
39. What is the `ARRAY` data type?
40. What is the difference between `TEXT` and `VARCHAR`?

## Mid-level Developer Questions

### Advanced Queries

41. What is a transaction? What are ACID properties?
42. What is normalization? Explain different normal forms.
43. What are views?
44. What are stored procedures and functions?
45. Explain `GROUP BY` and `HAVING`.
46. What is the difference between `UNION` and `UNION ALL`?
47. What is a subquery?
48. What is a correlated subquery?
49. What is the difference between `IN` and `EXISTS`?
50. What is a self-join?
51. What is a cross join?
52. How do you use aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)?
53. What is the `COALESCE` function?
54. What is the `NULLIF` function?
55. What is the `CASE` statement?
56. How do you use `WITH` (Common Table Expressions)?
57. What is a recursive CTE?
58. How do you pivot data in PostgreSQL?
59. How do you use string functions (`CONCAT`, `SUBSTRING`, `UPPER`, `LOWER`)?
60. How do you use date/time functions?

### Indexes & Performance

61. What are the different types of indexes in PostgreSQL?
62. What is a B-tree index?
63. What is a Hash index?
64. What is a GIN index?
65. What is a GiST index?
66. What is a BRIN index?
67. When should you use each type of index?
68. What is a composite index?
69. What is a partial index?
70. What is an expression index?
71. What is a unique index?
72. How do indexes improve query performance?
73. What are the disadvantages of indexes?
74. How do you create an index?
75. How do you drop an index?
76. What is index bloat?
77. How do you rebuild an index?
78. What is the `REINDEX` command?
79. How do you monitor index usage?
80. What is index-only scan?

### Database Design

81. What is denormalization?
82. When should you denormalize a database?
83. What is a one-to-one relationship?
84. What is a one-to-many relationship?
85. What is a many-to-many relationship?
86. How do you implement a many-to-many relationship?
87. What is a junction table?
88. What is referential integrity?
89. What are cascading deletes?
90. What is the `ON DELETE CASCADE` option?
91. What is the `ON UPDATE CASCADE` option?
92. What is a materialized view?
93. What is the difference between a view and a materialized view?
94. How do you refresh a materialized view?
95. What is a database schema?
96. How do you create a schema?
97. What are sequences?
98. How do you create and use sequences?
99. What is the `RETURNING` clause?
100. What are triggers?

### Transactions & Concurrency

101. What is a database transaction?
102. How do you start a transaction?
103. How do you commit a transaction?
104. How do you rollback a transaction?
105. What is a savepoint?
106. How do you use savepoints?
107. What are transaction isolation levels?
108. What is Read Uncommitted?
109. What is Read Committed?
110. What is Repeatable Read?
111. What is Serializable?
112. What is the default isolation level in PostgreSQL?
113. What is a deadlock?
114. How do you prevent deadlocks?
115. How do you detect deadlocks?
116. What is lock contention?
117. What are the different types of locks in PostgreSQL?
118. What is row-level locking?
119. What is table-level locking?
120. What is advisory locking?

## Senior Developer & Software Engineer Questions

### Advanced Performance Tuning

121. How do you optimize a query?
122. What is `EXPLAIN`?
123. What is `EXPLAIN ANALYZE`?
124. What is the difference between `EXPLAIN` and `EXPLAIN ANALYZE`?
125. How do you read a query execution plan?
126. What is a sequential scan?
127. What is an index scan?
128. What is a bitmap scan?
129. What is a nested loop join?
130. What is a hash join?
131. What is a merge join?
132. When does PostgreSQL choose each join algorithm?
133. What is query planner cost estimation?
134. How do you update table statistics?
135. What is the `ANALYZE` command?
136. What is the `VACUUM` command?
137. What is the difference between `VACUUM` and `VACUUM FULL`?
138. What is autovacuum?
139. How do you configure autovacuum?
140. What is table bloat?

### Partitioning & Sharding

141. What is partitioning?
142. Why use partitioning?
143. What are the types of partitioning in PostgreSQL?
144. What is range partitioning?
145. What is list partitioning?
146. What is hash partitioning?
147. How do you create a partitioned table?
148. How do you add a partition?
149. How do you remove a partition?
150. What is partition pruning?
151. What is constraint exclusion?
152. How do partitions affect indexing?
153. What are the best practices for partitioning?
154. What is sharding?
155. What is the difference between partitioning and sharding?
156. How do you implement sharding in PostgreSQL?
157. What are the challenges of sharding?
158. What is horizontal partitioning vs vertical partitioning?
159. How do you choose a partition key?
160. How do you handle queries across multiple partitions?

### Replication & High Availability

161. What is database replication?
162. What is master-slave replication?
163. What is master-master replication?
164. What is streaming replication in PostgreSQL?
165. What is logical replication?
166. What is physical replication?
167. What is the difference between logical and physical replication?
168. How do you set up streaming replication?
169. What is a replication slot?
170. What is Write-Ahead Logging (WAL)?
171. How does WAL work?
172. What is a WAL segment?
173. What is WAL archiving?
174. What is Point-in-Time Recovery (PITR)?
175. How do you implement PITR?
176. What is a hot standby?
177. What is a warm standby?
178. What is a cold standby?
179. What is failover?
180. What is switchover?
181. How do you promote a standby to primary?
182. What is lag in replication?
183. How do you monitor replication lag?
184. What tools can you use for PostgreSQL high availability?
185. What is Patroni?
186. What is pgpool-II?
187. What is repmgr?
188. What is synchronous replication?
189. What is asynchronous replication?
190. What are the trade-offs between synchronous and asynchronous replication?

### Connection Management

191. What is connection pooling?
192. Why is connection pooling important?
193. How does connection pooling work?
194. What is PgBouncer?
195. What is PgPool-II?
196. What are the different pooling modes in PgBouncer?
197. What is session pooling?
198. What is transaction pooling?
199. What is statement pooling?
200. How do you configure connection pooling?
201. What is the `max_connections` parameter?
202. How do you determine the optimal pool size?
203. What are the symptoms of connection pool exhaustion?
204. How do you handle connection leaks?
205. What is connection timeout?
206. What is idle connection timeout?
207. How do you monitor active connections?
208. What is the `pg_stat_activity` view?
209. How do you kill a hanging connection?
210. What is prepared statement pooling?

### Advanced Indexing

211. What are advanced indexing strategies?
212. What is a covering index?
213. What is an index-only scan?
214. How do you create a covering index?
215. What is a filtered index (partial index)?
216. When should you use a partial index?
217. What is a functional index (expression index)?
218. When should you use a functional index?
219. What is a multi-column index?
220. What is index column order?
221. How does column order affect index performance?
222. What is index selectivity?
223. How do you measure index effectiveness?
224. What is the `pg_stat_user_indexes` view?
225. What is index maintenance?
226. How do you identify unused indexes?
227. How do you identify missing indexes?
228. What is the trade-off between read and write performance with indexes?
229. What is a GIN index used for?
230. How do you index JSONB data?
231. How do you index full-text search?
232. What is a tsvector?
233. What is a GiST index used for?
234. How do you index geometric data?
235. What is a BRIN index best suited for?

### MVCC & Internals

236. What is MVCC (Multi-Version Concurrency Control)?
237. How does MVCC work in PostgreSQL?
238. What are tuple versions?
239. What is transaction ID (XID)?
240. What is XID wraparound?
241. How do you prevent XID wraparound?
242. What is a frozen transaction ID?
243. What is visibility in MVCC?
244. How does PostgreSQL determine tuple visibility?
245. What is the system column `xmin`?
246. What is the system column `xmax`?
247. What is the cost of MVCC?
248. How does MVCC affect storage?
249. What are dead tuples?
250. How do dead tuples affect performance?
251. How does VACUUM clean up dead tuples?
252. What is HOT (Heap-Only Tuple)?
253. What is fill factor?
254. How do you configure fill factor?
255. What is the PostgreSQL page structure?

### Window Functions & Advanced SQL

256. What are window functions?
257. What is the difference between window functions and aggregate functions?
258. What is the `OVER` clause?
259. What is `PARTITION BY` in window functions?
260. What is `ORDER BY` in window functions?
261. What are window frame specifications?
262. What is `ROWS` vs `RANGE` in window frames?
263. What is the `ROW_NUMBER()` function?
264. What is the `RANK()` function?
265. What is the `DENSE_RANK()` function?
266. What is the difference between `RANK()` and `DENSE_RANK()`?
267. What is the `LAG()` function?
268. What is the `LEAD()` function?
269. What is the `FIRST_VALUE()` function?
270. What is the `LAST_VALUE()` function?
271. What is the `NTH_VALUE()` function?
272. What are the `NTILE()` function?
273. What is the `PERCENT_RANK()` function?
274. What is the `CUME_DIST()` function?
275. How do you calculate running totals using window functions?
276. How do you calculate moving averages?
277. How do you find gaps in sequences?
278. How do you perform year-over-year comparisons?
279. What are common table expressions (CTEs)?
280. What are recursive CTEs?

### JSONB & Advanced Data Types

281. What is the difference between `JSON` and `JSONB`?
282. When should you use `JSON` vs `JSONB`?
283. How do you query JSONB data?
284. What is the `->` operator?
285. What is the `->>` operator?
286. What is the `#>` operator?
287. What is the `#>>` operator?
288. What is the `@>` operator (containment)?
289. What is the `?` operator (key existence)?
290. How do you create an index on JSONB?
291. What is a GIN index on JSONB?
292. How do you update JSONB data?
293. What is the `jsonb_set()` function?
294. How do you remove keys from JSONB?
295. How do you merge JSONB objects?
296. What are array data types in PostgreSQL?
297. How do you query array data?
298. What is the `ANY()` function with arrays?
299. What is the `ALL()` function with arrays?
300. How do you unnest arrays?
301. What are composite types?
302. How do you create and use custom types?
303. What are enumerated types (ENUMs)?
304. What are range types?
305. What are domain types?

### Security

306. What are roles in PostgreSQL?
307. What is the difference between roles and users?
308. How do you create a role?
309. How do you grant privileges?
310. How do you revoke privileges?
311. What is the principle of least privilege?
312. What are schema-level privileges?
313. What are table-level privileges?
314. What are column-level privileges?
315. What is Row-Level Security (RLS)?
316. How do you implement RLS?
317. What are RLS policies?
318. How do you secure database connections?
319. What is SSL/TLS in PostgreSQL?
320. How do you enable SSL connections?
321. What is the `pg_hba.conf` file?
322. What are the different authentication methods?
323. What is password authentication?
324. What is certificate authentication?
325. What is LDAP authentication?
326. What is Kerberos authentication?
327. How do you prevent SQL injection?
328. What are prepared statements?
329. How do prepared statements prevent SQL injection?
330. What is password encryption in PostgreSQL?
331. What is `SCRAM-SHA-256`?
332. How do you audit database access?
333. What is the `pgaudit` extension?
334. How do you log all queries?
335. What are the security implications of superuser access?

### Backup & Recovery

336. What are the types of backups in PostgreSQL?
337. What is a logical backup?
338. What is a physical backup?
339. What is `pg_dump`?
340. What is `pg_dumpall`?
341. What is `pg_restore`?
342. What is `pg_basebackup`?
343. What is continuous archiving?
344. How do you implement continuous archiving?
345. What is the difference between hot backup and cold backup?
346. How do you perform a hot backup?
347. What is Point-in-Time Recovery (PITR)?
348. How do you restore to a specific point in time?
349. What is a recovery.conf file (or recovery.signal in PostgreSQL 12+)?
350. What are the best practices for backup strategies?
351. How often should you backup?
352. How do you test your backups?
353. What is backup retention policy?
354. How do you automate backups?
355. What tools can you use for backup management?
356. What is Barman?
357. What is pgBackRest?
358. What is WAL-G?
359. How do you backup large databases efficiently?
360. What is incremental backup?

### Monitoring & Troubleshooting

361. How do you monitor PostgreSQL performance?
362. What are the key metrics to monitor?
363. What is the `pg_stat_statements` extension?
364. How do you identify slow queries?
365. What is the `log_min_duration_statement` parameter?
366. How do you analyze query performance?
367. What are the system catalog tables?
368. What is `pg_stat_activity`?
369. What is `pg_stat_database`?
370. What is `pg_stat_user_tables`?
371. What is `pg_stat_user_indexes`?
372. What is `pg_locks`?
373. How do you identify blocking queries?
374. How do you identify long-running queries?
375. What is `pg_stat_bgwriter`?
376. What is the shared buffers parameter?
377. What is the work_mem parameter?
378. What is the maintenance_work_mem parameter?
379. What is effective_cache_size?
380. How do you tune PostgreSQL configuration?
381. What is `postgresql.conf`?
382. How do you reload configuration without restart?
383. What changes require a restart?
384. What monitoring tools are available for PostgreSQL?
385. What is pgAdmin?
386. What is pgBadger?
387. What is Prometheus with postgres_exporter?
388. What is Grafana for PostgreSQL monitoring?
389. How do you set up alerting for PostgreSQL?
390. What are common PostgreSQL errors and how do you troubleshoot them?

### Advanced Topics

391. What are foreign data wrappers (FDW)?
392. How do you use foreign data wrappers?
393. What is postgres_fdw?
394. What are extensions in PostgreSQL?
395. How do you install an extension?
396. What is the PostGIS extension?
397. What is the pg_trgm extension?
398. What is the hstore extension?
399. What is the uuid-ossp extension?
400. What is full-text search in PostgreSQL?
401. How do you implement full-text search?
402. What is a tsvector?
403. What is a tsquery?
404. What are text search configurations?
405. How do you rank search results?
406. What is table inheritance in PostgreSQL?
407. What are the use cases for table inheritance?
408. What are the limitations of table inheritance?
409. What is the difference between inheritance and partitioning?
410. What are stored procedures in PostgreSQL 11+?
411. What is the difference between functions and procedures?
412. What is PL/pgSQL?
413. What are triggers?
414. What are event triggers?
415. What is the difference between BEFORE and AFTER triggers?
416. What is a statement-level trigger?
417. What is a row-level trigger?
418. How do you handle errors in PL/pgSQL?
419. What is the `EXCEPTION` block?
420. What are cursors in PostgreSQL?
421. When should you use cursors?
422. What are the performance implications of cursors?
423. What is the `LISTEN/NOTIFY` mechanism?
424. What are use cases for `LISTEN/NOTIFY`?
425. What is connection scalability in PostgreSQL?
426. How do you handle thousands of concurrent connections?
427. What is the two-phase commit protocol?
428. How do you implement distributed transactions?
429. What are the CAP theorem implications for PostgreSQL?
430. What is eventual consistency?
