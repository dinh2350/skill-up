# JavaScript Interview Questions

This document contains a list of JavaScript interview questions ranging from junior to senior levels.

## Junior Developer Questions

1.  **What are the different data types in JavaScript?**

    - Primitive types: `String`, `Number`, `Boolean`, `Null`, `Undefined`, `Symbol`, `BigInt`.
    - Non-primitive type: `Object`.

2.  **What is the difference between `==` and `===`?**

    - `==` is the loose equality operator, which performs type coercion.
    - `===` is the strict equality operator, which does not perform type coercion. It checks for both value and type equality.

3.  **What is the difference between `let`, `const`, and `var`?**

    - `var`: Function-scoped or globally-scoped, can be re-declared and updated.
    - `let`: Block-scoped, can be updated but not re-declared within the same scope.
    - `const`: Block-scoped, cannot be updated or re-declared. For objects and arrays, the properties/elements can be changed, but the reference to the object/array cannot.

4.  **What are closures?**

    - A closure is a function that has access to its outer function's scope, even after the outer function has returned.

5.  **What is the `this` keyword?**

    - The `this` keyword refers to the object it belongs to. Its value depends on how a function is called.

6.  **What are arrow functions?**
    - Arrow functions are a more concise syntax for writing function expressions. They do not have their own `this`, `arguments`, `super`, or `new.target`.

## Mid-level Developer Questions

1.  **What is prototypal inheritance?**

    - Prototypal inheritance is a feature in JavaScript where objects can inherit properties and methods from other objects. Every object has a private property which holds a link to another object called its prototype.

2.  **What are Promises and why are they useful?**

    - A `Promise` is an object representing the eventual completion or failure of an asynchronous operation. They are useful for handling async operations without callback hell.

3.  **What is `async/await`?**

    - `async/await` is syntactic sugar built on top of Promises, making asynchronous code look and behave more like synchronous code, which makes it easier to read and write.

4.  **What is the event loop?**

    - The event loop is a mechanism that allows Node.js to perform non-blocking I/O operations, despite the fact that JavaScript is single-threaded. It offloads operations to the system kernel whenever possible.

5.  **What are higher-order functions?**

    - A higher-order function is a function that takes another function as an argument, or returns a function as a result. Examples include `map`, `filter`, and `reduce`.

6.  **What is debouncing and throttling?**
    - **Debouncing**: Groups a sequence of calls to a function into a single call. It is useful for performance-intensive tasks like API calls on user input.
    - **Throttling**: Ensures that a function is called at most once in a specified time period. It is useful for controlling the rate at which a function is executed, like on scroll or resize events.

## Senior Developer Questions

1.  **Explain how `this` works in JavaScript.**

    - In-depth explanation of `this` in different contexts: global, function, method, constructor, arrow function, and with `call`, `apply`, and `bind`.

2.  **What are JavaScript modules (ESM vs. CommonJS)?**

    - **CommonJS**: The module system used in Node.js. Uses `require` and `module.exports`. It's synchronous.
    - **ES Modules (ESM)**: The standard module system for JavaScript. Uses `import` and `export`. It's asynchronous.

3.  **What is the difference between microtasks and macrotasks?**

    - **Macrotasks (or tasks)**: `setTimeout`, `setInterval`, `setImmediate`, I/O, UI rendering.
    - **Microtasks**: `process.nextTick`, `Promises`, `queueMicrotask`.
    - The event loop processes all microtasks in the microtask queue before processing the next macrotask.

4.  **How does garbage collection work in JavaScript?**

    - JavaScript uses automatic garbage collection. The most common algorithm is Mark-and-Sweep. It periodically finds and frees up memory that is no longer reachable from the root objects.

5.  **What are Web Workers?**

    - Web Workers provide a simple means for web content to run scripts in background threads. The worker thread can perform tasks without interfering with the user interface.

6.  **Design Patterns in JavaScript.**

    - Discuss common design patterns like Singleton, Factory, Observer, Module, and their implementation in JavaScript.

7.  **Performance Optimization.**
    - Discuss strategies for optimizing JavaScript performance, such as code splitting, tree shaking, lazy loading, memoization, and reducing reflows/repaints.
