# TypeScript Interview Questions

This document contains a comprehensive list of TypeScript interview questions ranging from junior to senior developer and software engineer levels.

## Junior Developer Questions

### TypeScript Basics

1. What is TypeScript?
2. Why use TypeScript over JavaScript?
3. How do you install TypeScript?
4. How do you compile TypeScript code?
5. What is the `tsc` command?
6. What are the basic types in TypeScript?
7. What is type annotation?
8. What is type inference?
9. What is the `any` type?
10. What is the `unknown` type?
11. What is the `void` type?
12. What is the `never` type?
13. What is the `null` type?
14. What is the `undefined` type?
15. What are union types?
16. What are literal types?
17. What is type assertion?
18. What is the `as` keyword?
19. What is the angle-bracket syntax for type assertion?
20. What is the difference between `string` and `String`?

### Functions & Variables

21. How do you type function parameters?
22. How do you type function return values?
23. What are optional parameters?
24. What are default parameters?
25. What are rest parameters in TypeScript?
26. What is a function type?
27. How do you define a function type?
28. What are arrow function types?
29. What is the `this` parameter in functions?
30. What is function overloading?
31. How do you declare variables with types?
32. What is the difference between `let`, `const`, and `var` in TypeScript?
33. What is type widening?
34. What is type narrowing?
35. What are const assertions?

### Objects & Arrays

36. How do you type objects?
37. What are object types?
38. How do you define optional properties?
39. How do you define readonly properties?
40. What are index signatures?
41. How do you type arrays?
42. What is the Array type syntax?
43. What is the tuple type?
44. What are readonly arrays?
45. What is the `ReadonlyArray` type?
46. How do you type object destructuring?
47. How do you type array destructuring?
48. What is the difference between array and tuple?
49. What are rest elements in tuples?
50. What are optional elements in tuples?

### Interfaces

51. What are interfaces?
52. How do you define an interface?
53. What is the difference between an interface and a type alias?
54. Can interfaces extend other interfaces?
55. What is interface inheritance?
56. Can interfaces extend multiple interfaces?
57. What is declaration merging?
58. Can you merge interfaces?
59. What are optional properties in interfaces?
60. What are readonly properties in interfaces?
61. What are function types in interfaces?
62. What are indexable types in interfaces?
63. What is the difference between interface and class?
64. Can a class implement an interface?
65. Can a class implement multiple interfaces?

## Mid-level Developer Questions

### Advanced Types

66. What are intersection types?
67. What is the difference between union and intersection types?
68. What are discriminated unions?
69. What are type guards?
70. What is the `typeof` type guard?
71. What is the `instanceof` type guard?
72. What is the `in` operator type guard?
73. What are user-defined type guards?
74. What is a type predicate?
75. What are nullable types?
76. What is strict null checking?
77. What is the non-null assertion operator (`!`)?
78. What is optional chaining in TypeScript?
79. What is nullish coalescing in TypeScript?
80. What are template literal types?

### Generics

81. What are generics?
82. Why use generics?
83. How do you define a generic function?
84. How do you define a generic interface?
85. How do you define a generic class?
86. What are generic constraints?
87. What is the `extends` keyword in generics?
88. What are default generic parameters?
89. How do you use multiple type parameters?
90. What is a generic type alias?
91. What are conditional types with generics?
92. What is the `infer` keyword?
93. How do you create a generic array type?
94. What is a generic promise type?
95. What are generic utility types?

### Enums

96. What are enums?
97. What is a numeric enum?
98. What is a string enum?
99. What is a heterogeneous enum?
100. What are computed enum members?
101. What are constant enum members?
102. What is a const enum?
103. What is the difference between enum and const enum?
104. What is ambient enum?
105. What are reverse mappings in enums?
106. When should you use enums?
107. What are the alternatives to enums?
108. What are union types vs enums?
109. How do enums compile to JavaScript?
110. What are the performance implications of enums?

### Classes

111. How do you define a class in TypeScript?
112. What are access modifiers?
113. What is the `public` modifier?
114. What is the `private` modifier?
115. What is the `protected` modifier?
116. What is the `readonly` modifier?
117. What are parameter properties?
118. What are accessors (getters and setters)?
119. What are static members?
120. What are abstract classes?
121. What are abstract methods?
122. Can abstract classes have constructors?
123. What is class inheritance in TypeScript?
124. What is the `super` keyword?
125. Can a class implement multiple interfaces?
126. What is method overriding?
127. What are constructor overloads?
128. What is the `this` type in classes?
129. What is polymorphism in TypeScript?
130. What is encapsulation in TypeScript?

### Modules & Namespaces

131. What are modules in TypeScript?
132. What is the difference between modules and namespaces?
133. How do you export from a module?
134. How do you import from a module?
135. What are named exports?
136. What are default exports?
137. What is export equals syntax?
138. What is import equals syntax?
139. What are re-exports?
140. What is module resolution?
141. What are ambient modules?
142. What is the `declare module` syntax?
143. What are namespaces?
144. How do you define a namespace?
145. What are nested namespaces?
146. What is namespace aliasing?
147. When should you use namespaces vs modules?
148. What is the triple-slash directive?
149. What is `/// <reference path="" />`?
150. What is `/// <reference types="" />`?

## Senior Developer & Software Engineer Questions

### Advanced Type System

151. What are mapped types?
152. How do you create a mapped type?
153. What is the `keyof` operator?
154. What is the `typeof` operator in type context?
155. What are index access types?
156. What are conditional types?
157. How do conditional types work?
158. What is distributive conditional types?
159. What is the `infer` keyword in conditional types?
160. How do you create recursive types?
161. What are template literal types?
162. What are key remapping in mapped types?
163. What is the `as` clause in mapped types?
164. What are homomorphic mapped types?
165. What are non-homomorphic mapped types?

### Utility Types

166. What are utility types?
167. What is `Partial<T>`?
168. What is `Required<T>`?
169. What is `Readonly<T>`?
170. What is `Record<K, T>`?
171. What is `Pick<T, K>`?
172. What is `Omit<T, K>`?
173. What is `Exclude<T, U>`?
174. What is `Extract<T, U>`?
175. What is `NonNullable<T>`?
176. What is `ReturnType<T>`?
177. What is `InstanceType<T>`?
178. What is `Parameters<T>`?
179. What is `ConstructorParameters<T>`?
180. What is `ThisParameterType<T>`?
181. What is `OmitThisParameter<T>`?
182. What is `ThisType<T>`?
183. What is `Uppercase<S>`?
184. What is `Lowercase<S>`?
185. What is `Capitalize<S>`?
186. What is `Uncapitalize<S>`?
187. How do you create custom utility types?
188. What are the benefits of utility types?
189. When should you use utility types?
190. How do utility types improve code maintainability?

### Advanced Generics

191. What are generic constraints?
192. How do you constrain a generic type?
193. What is the `extends` keyword in generics?
194. What are multiple constraints?
195. What are generic factories?
196. How do you use class types in generics?
197. What are generic parameter defaults?
198. What is variance in TypeScript?
199. What is covariance?
200. What is contravariance?
201. What is bivariance?
202. What is invariance?
203. How does TypeScript handle variance?
204. What are higher-order types?
205. What are higher-kinded types?
206. How do you implement higher-kinded types?
207. What are generic type inference issues?
208. How do you help type inference?
209. What is contextual typing?
210. What are generic constraints on class constructors?

### Declaration Files

211. What are declaration files?
212. What is a `.d.ts` file?
213. How do you create a declaration file?
214. What is the purpose of declaration files?
215. What is ambient declaration?
216. What is the `declare` keyword?
217. How do you declare global variables?
218. How do you declare global functions?
219. How do you declare global types?
220. What is `declare module`?
221. What is `declare namespace`?
222. What is module augmentation?
223. What is global augmentation?
224. How do you extend third-party modules?
225. What are DefinitelyTyped types?
226. What is the `@types` organization?
227. How do you install type definitions?
228. What is `typeRoots` in tsconfig?
229. What is `types` in tsconfig?
230. How do you publish type definitions?

### TypeScript Compiler

231. What is the TypeScript compiler?
232. What is `tsconfig.json`?
233. How do you create a `tsconfig.json`?
234. What is the `compilerOptions` section?
235. What is the `target` option?
236. What is the `module` option?
237. What is the `lib` option?
238. What is the `strict` option?
239. What is `strictNullChecks`?
240. What is `strictFunctionTypes`?
241. What is `strictBindCallApply`?
242. What is `strictPropertyInitialization`?
243. What is `noImplicitAny`?
244. What is `noImplicitThis`?
245. What is `noImplicitReturns`?
246. What is `noFallthroughCasesInSwitch`?
247. What is `allowUnreachableCode`?
248. What is `allowUnusedLabels`?
249. What is `esModuleInterop`?
250. What is `allowSyntheticDefaultImports`?
251. What is `resolveJsonModule`?
252. What is `skipLibCheck`?
253. What is `forceConsistentCasingInFileNames`?
254. What is `moduleResolution`?
255. What is `baseUrl`?
256. What is `paths`?
257. What is `rootDirs`?
258. What is `typeRoots`?
259. What is `types`?
260. What is `declaration`?
261. What is `declarationMap`?
262. What is `sourceMap`?
263. What is `inlineSourceMap`?
264. What is `outDir`?
265. What is `outFile`?
266. What is `rootDir`?
267. What is `composite`?
268. What is `incremental`?
269. What is `tsBuildInfoFile`?
270. What are project references?

### Module Resolution

271. What is module resolution in TypeScript?
272. What is Classic module resolution?
273. What is Node module resolution?
274. What is the difference between Classic and Node resolution?
275. How does relative import resolution work?
276. How does non-relative import resolution work?
277. What is path mapping?
278. How do you configure path aliases?
279. What is the `baseUrl` option?
280. What is the `paths` option?
281. What are wildcard mappings?
282. What is module resolution tracing?
283. How do you debug module resolution?
284. What is the `traceResolution` option?
285. What are barrel exports?
286. What are index files?
287. How do you resolve node_modules?
288. What is the resolution order?
289. What are package.json exports?
290. What is the `exports` field in package.json?

### Decorators

291. What are decorators?
292. How do you enable decorators?
293. What is the `experimentalDecorators` option?
294. What are class decorators?
295. What are method decorators?
296. What are accessor decorators?
297. What are property decorators?
298. What are parameter decorators?
299. What is the execution order of decorators?
300. How do you create a class decorator?
301. How do you create a method decorator?
302. How do you create a property decorator?
303. What is decorator metadata?
304. What is the `emitDecoratorMetadata` option?
305. What is the `reflect-metadata` library?
306. How do you access metadata?
307. What are decorator factories?
308. What are common use cases for decorators?
309. How are decorators used in frameworks?
310. What is the difference between decorators and annotations?

### Advanced Patterns

311. What is the builder pattern in TypeScript?
312. What is the factory pattern in TypeScript?
313. What is the singleton pattern in TypeScript?
314. What is the observer pattern in TypeScript?
315. What is the strategy pattern in TypeScript?
316. What is dependency injection in TypeScript?
317. How do you implement dependency injection?
318. What is inversion of control?
319. What are abstract factories?
320. What is the adapter pattern?
321. What is the decorator pattern (not TS decorators)?
322. What is the proxy pattern?
323. What is the facade pattern?
324. What is the composite pattern?
325. What is the command pattern?
326. What is the chain of responsibility pattern?
327. What is the iterator pattern?
328. What is the mediator pattern?
329. What is the memento pattern?
330. What is the state pattern?

### Type Manipulation

331. What is type narrowing?
332. What are type predicates?
333. What is discriminated union narrowing?
334. What is control flow analysis?
335. What is the `asserts` keyword?
336. What are assertion functions?
337. How do you narrow types with `typeof`?
338. How do you narrow types with `instanceof`?
339. How do you narrow types with `in`?
340. What is exhaustiveness checking?
341. How do you ensure exhaustive switch statements?
342. What is the `never` type used for?
343. What are branded types?
344. What are nominal types?
345. How do you create nominal types in TypeScript?
346. What is phantom typing?
347. What are opaque types?
348. How do you simulate private properties?
349. What is symbol-based branding?
350. What are unique symbols?

### Performance & Optimization

351. How do you optimize TypeScript compilation time?
352. What is incremental compilation?
353. What is project references?
354. How do you use project references?
355. What is the `composite` flag?
356. What are build modes?
357. What is `tsc --build`?
358. How do you profile TypeScript compilation?
359. What is the `extendedDiagnostics` option?
360. What causes slow compilation?
361. How do you reduce type checking time?
362. What is `skipLibCheck`?
363. What is type inference performance?
364. How do complex types affect performance?
365. What are union type performance considerations?
366. What are intersection type performance considerations?
367. How do conditional types affect performance?
368. What are mapped type performance considerations?
369. How do you optimize generic types?
370. What are the performance implications of decorators?

### Testing

371. How do you test TypeScript code?
372. What are type-level tests?
373. How do you test types?
374. What is the `@ts-expect-error` directive?
375. What is the `@ts-ignore` directive?
376. What is the difference between `@ts-expect-error` and `@ts-ignore`?
377. How do you test generic types?
378. How do you test utility types?
379. What is the `tsd` library?
380. What is the `expect-type` library?
381. How do you mock types in tests?
382. How do you test type guards?
383. How do you test type predicates?
384. How do you test interfaces?
385. How do you test classes?
386. What is type coverage?
387. How do you measure type coverage?
388. What is the `type-coverage` tool?
389. What is a good type coverage percentage?
390. How do you improve type coverage?

### Interoperability

391. How does TypeScript work with JavaScript?
392. Can you use JavaScript libraries in TypeScript?
393. How do you import JavaScript modules?
394. What is the `allowJs` option?
395. What is the `checkJs` option?
396. What is JSDoc in TypeScript?
397. How do you add types to JavaScript files?
398. What is gradual typing?
399. How do you migrate JavaScript to TypeScript?
400. What is the migration strategy?
401. How do you handle third-party libraries without types?
402. How do you create type definitions for JavaScript libraries?
403. What is the `any` escape hatch?
404. When should you use `any`?
405. What are the risks of using `any`?
406. How do you minimize `any` usage?
407. What is the `unknown` type alternative?
408. How do you integrate TypeScript in existing projects?
409. What is incremental adoption?
410. How do you configure mixed JavaScript/TypeScript projects?

### Best Practices

411. What are TypeScript best practices?
412. When should you use interfaces vs type aliases?
413. When should you use enums vs union types?
414. When should you use classes vs interfaces?
415. How do you structure large TypeScript projects?
416. What is the recommended folder structure?
417. How do you organize types?
418. Should you export types separately?
419. How do you name types?
420. What are naming conventions for interfaces?
421. What are naming conventions for types?
422. What are naming conventions for enums?
423. How do you handle errors in TypeScript?
424. How do you type error objects?
425. What is the `unknown` catch clause binding?
426. How do you avoid type assertions?
427. When are type assertions acceptable?
428. How do you avoid the `any` type?
429. How do you make code more type-safe?
430. What is defensive programming in TypeScript?

### Advanced Configuration

431. What are multiple tsconfig files?
432. How do you extend tsconfig.json?
433. What is the `extends` option?
434. How do you share configuration?
435. What are tsconfig bases?
436. What is the `include` option?
437. What is the `exclude` option?
438. What is the `files` option?
439. What are glob patterns in tsconfig?
440. How do you configure for different environments?
441. How do you configure for Node.js?
442. How do you configure for browsers?
443. How do you configure for React?
444. How do you configure for Vue?
445. How do you configure for Angular?
446. What is the `jsx` option?
447. What is the `jsxFactory` option?
448. What is the `jsxFragmentFactory` option?
449. What is the `jsxImportSource` option?
450. How do you configure for monorepos?

### Tooling & Ecosystem

451. What is TSLint vs ESLint?
452. How do you lint TypeScript code?
453. What is `@typescript-eslint`?
454. How do you configure ESLint for TypeScript?
455. What is Prettier and TypeScript?
456. How do you format TypeScript code?
457. What is ts-node?
458. How do you run TypeScript directly?
459. What is tsx?
460. What is ts-jest?
461. How do you test TypeScript with Jest?
462. What is Vitest and TypeScript?
463. What are TypeScript transformers?
464. What is the TypeScript compiler API?
465. How do you use the compiler API?
466. What are custom transformers?
467. What is ttypescript?
468. What is ts-patch?
469. How do you create compiler plugins?
470. What are TypeScript language service plugins?

### Future & Advanced Topics

471. What is TypeScript 5.0?
472. What are the latest TypeScript features?
473. What is the TypeScript roadmap?
474. What are const type parameters?
475. What are decorators stage 3 proposal?
476. What is satisfies operator?
477. What are explicit resource management?
478. What is the using keyword?
479. What are import attributes?
480. What is import reflection?
481. What are type annotations in JavaScript proposal?
482. What is the future of TypeScript?
483. How does TypeScript relate to ECMAScript?
484. What is the relationship between TypeScript and TC39?
485. What are TypeScript alternatives?
486. What is Flow?
487. What is the difference between TypeScript and Flow?
488. What is ReScript?
489. What is AssemblyScript?
490. What is the TypeScript community like?
