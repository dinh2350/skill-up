# Node.js Interview Questions

This document contains a list of Node.js interview questions ranging from junior to senior levels.

## Junior Developer Questions

1.  **What is Node.js?**

    - Node.js is an open-source, cross-platform, back-end JavaScript runtime environment that runs on the V8 engine and executes JavaScript code outside a web browser.

2.  **What is NPM?**

    - NPM (Node Package Manager) is the default package manager for Node.js. It is used to install, manage, and share packages (reusable code).

3.  **What is the difference between `require` and `import`?**

    - `require` is part of the CommonJS module system and is used in traditional Node.js.
    - `import` is part of the ES Modules (ESM) standard and is the modern way to handle modules in JavaScript and Node.js.

4.  **How do you handle asynchronous operations in Node.js?**

    - Callbacks, Promises, and `async/await`.

5.  **What is `package.json`?**

    - It's a file that holds metadata about a project, such as its name, version, and dependencies. It also contains scripts that can be run.

6.  **What is the event loop in Node.js?**

    - The event loop allows Node.js to perform non-blocking I/O operations. It's the mechanism that enables Node.js's asynchronous nature, by offloading operations to the system kernel whenever possible.

7.  **What is the `node_modules` directory?**

    - The `node_modules` directory is where all the dependencies (packages) for a project are stored. When you run `npm install`, the packages listed in `package.json` are downloaded into this directory.

8.  **How do you debug a Node.js application?**
    - You can use the built-in Node.js debugger, the Chrome DevTools for Node, or the debugger in an IDE like VS Code. You can start the debugger by running `node inspect <file.js>`.

## Mid-level Developer Questions

1.  **What is the difference between `process.nextTick()` and `setImmediate()`?**

    - `process.nextTick()` defers the execution of a function until the next pass around the event loop. It fires immediately after the current operation completes.
    - `setImmediate()` executes a callback on the next cycle of the event loop. It will be executed after any I/O events' callbacks.

2.  **What are streams in Node.js?**

    - Streams are objects that let you read data from a source or write data to a destination in a continuous fashion. There are four types of streams: Readable, Writable, Duplex, and Transform.

3.  **How does Node.js handle child processes?**

    - Node.js can create child processes using the `child_process` module. This is useful for running external commands or for creating worker processes to handle CPU-intensive tasks. Functions include `spawn()`, `exec()`, `execFile()`, and `fork()`.

4.  **What is middleware in the context of Express.js?**

    - Middleware functions are functions that have access to the request object (`req`), the response object (`res`), and the `next` function in the application’s request-response cycle. They can execute code, make changes to the request and response objects, end the request-response cycle, and call the next middleware in the stack.

5.  **Explain error handling in Node.js.**

    - Discuss strategies for handling errors: using `try...catch` for synchronous code, `.catch()` for Promises, and error-first callbacks. Also, mention global error handling with `process.on('uncaughtException')`.

6.  **What is the purpose of `module.exports` and `exports`?**

    - `module.exports` is an object that is returned when a module is `require`'d. `exports` is just a reference to `module.exports`. You can add properties to `exports`, but you cannot reassign it, as that would break the reference.

7.  **What is the difference between `fork()` and `spawn()` in the `child_process` module?**

    - **`spawn()`**: Launches a new process with a given command. It's best for when you want the child process to return a large amount of data to Node.
    - **`fork()`**: A special case of `spawn()` that creates a new instance of the V8 engine. It's primarily used for creating worker processes to run parts of your application in parallel.

8.  **What are some common use cases for Node.js?**
    - Real-time applications (chat, online gaming), data streaming applications, single-page applications, and building RESTful APIs.

## Senior Developer Questions

1.  **Explain the Node.js event loop in detail.**

    - Provide a deep dive into the phases of the event loop: timers, pending callbacks, idle/prepare, poll, check, and close callbacks. Explain how microtasks (`process.nextTick`, Promises) are processed.

2.  **How can you scale a Node.js application?**

    - Discuss strategies like clustering (using the `cluster` module to run multiple instances of the app), using a process manager like PM2, and using a reverse proxy (like Nginx) for load balancing. Also, mention microservices architecture.

3.  **What is libuv?**

    - `libuv` is a multi-platform C library that provides support for asynchronous I/O based on an event loop. It is the core library that backs Node.js's asynchronous capabilities.

4.  **How does garbage collection work in V8?**

    - Explain V8's garbage collection process, including the concepts of young generation (scavenge) and old generation (mark-sweep & mark-compact).

5.  **What are the security best practices for a Node.js application?**

    - Discuss topics like preventing SQL injection, XSS attacks, using Helmet.js for setting security-related HTTP headers, managing dependencies for vulnerabilities (e.g., with `npm audit`), and proper error handling to avoid leaking sensitive information.

6.  **What are Buffers in Node.js?**

    - A `Buffer` is a global object in Node.js used to handle binary data directly. It is a raw memory allocation that is not resizable. Buffers are particularly useful when dealing with network protocols, file system operations, or other sources of binary data.

7.  **Design a RESTful API using Node.js and Express.js.**

    - Discuss API design principles, including proper use of HTTP methods (GET, POST, PUT, DELETE), status codes, versioning, authentication (e.g., JWT), and documentation.

8.  **How does Node.js handle memory leaks? What tools can you use to diagnose them?**

    - Memory leaks in Node.js occur when objects are not properly deallocated. You can use tools like the built-in `heapdump` module, Chrome DevTools for Node, or third-party services like Clinic.js to take heap snapshots and analyze memory usage to find leaks.

9.  **What is the V8 engine and how does it work with Node.js?**
    - V8 is Google's open-source high-performance JavaScript and WebAssembly engine, written in C++. It's the engine that Node.js uses to execute JavaScript code. V8 compiles JavaScript directly to native machine code before executing it, which makes it very fast.
