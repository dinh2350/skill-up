# What are EventEmitters in Node.js?

## Short Answer

EventEmitter is a core class in Node.js that provides a way to implement the **Observer pattern** (also known as pub/sub pattern). It allows objects to emit named events and register listener functions that are called when those events are emitted. EventEmitters are fundamental to Node.js's event-driven architecture.

## Detailed Explanation

### The EventEmitter Class

The `EventEmitter` class is part of the `events` module in Node.js. Many Node.js core modules inherit from EventEmitter, including:

- `http.Server`
- `net.Server`
- `fs.ReadStream`
- `process`
- `child_process`

### Basic Usage

```javascript
const EventEmitter = require("events");

// Create an instance
const myEmitter = new EventEmitter();

// Register a listener
myEmitter.on("event", () => {
  console.log("An event occurred!");
});

// Emit the event
myEmitter.emit("event");
```

## Core Methods

### 1. **on(eventName, listener)**

Adds a listener to the end of the listeners array for the specified event.

```javascript
myEmitter.on("data", (data) => {
  console.log("Received data:", data);
});
```

### 2. **emit(eventName, [...args])**

Synchronously calls each listener registered for the event, passing the supplied arguments.

```javascript
myEmitter.emit("data", { id: 1, name: "John" });
```

### 3. **once(eventName, listener)**

Adds a one-time listener that is removed after it's invoked once.

```javascript
myEmitter.once("connection", () => {
  console.log("First connection established!");
});
```

### 4. **removeListener(eventName, listener)** or **off(eventName, listener)**

Removes a specific listener from the event.

```javascript
const callback = () => console.log("Event fired");
myEmitter.on("event", callback);
myEmitter.removeListener("event", callback);
```

### 5. **removeAllListeners([eventName])**

Removes all listeners for a specific event or all events.

```javascript
myEmitter.removeAllListeners("event"); // Remove all listeners for 'event'
myEmitter.removeAllListeners(); // Remove all listeners for all events
```

### 6. **listeners(eventName)**

Returns a copy of the array of listeners for the specified event.

```javascript
const listeners = myEmitter.listeners("event");
console.log(listeners.length);
```

### 7. **listenerCount(eventName)**

Returns the number of listeners for a specific event.

```javascript
const count = myEmitter.listenerCount("event");
```

### 8. **eventNames()**

Returns an array of event names that have registered listeners.

```javascript
const events = myEmitter.eventNames();
console.log(events); // ['event1', 'event2']
```

## Practical Examples

### Example 1: Custom Event Emitter Class

```javascript
const EventEmitter = require("events");

class Logger extends EventEmitter {
  log(message) {
    console.log(message);
    this.emit("messageLogged", { id: 1, message });
  }
}

const logger = new Logger();

// Register a listener
logger.on("messageLogged", (arg) => {
  console.log("Listener called", arg);
});

logger.log("Hello World");
```

### Example 2: Multiple Listeners

```javascript
const EventEmitter = require("events");
const emitter = new EventEmitter();

// First listener
emitter.on("userRegistered", (user) => {
  console.log("Sending welcome email to", user.email);
});

// Second listener
emitter.on("userRegistered", (user) => {
  console.log("Updating analytics for", user.name);
});

// Third listener
emitter.on("userRegistered", (user) => {
  console.log("Sending notification to admin");
});

// Emit the event - all three listeners will be called
emitter.emit("userRegistered", {
  name: "John Doe",
  email: "john@example.com",
});
```

### Example 3: Error Handling

EventEmitters treat the `error` event specially. If an error event is emitted and no listener is registered, Node.js will throw the error and crash the process.

```javascript
const EventEmitter = require("events");
const emitter = new EventEmitter();

// Always listen for error events!
emitter.on("error", (err) => {
  console.error("Error occurred:", err.message);
});

// This won't crash the application
emitter.emit("error", new Error("Something went wrong"));
```

### Example 4: Passing Multiple Arguments

```javascript
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("order", (orderId, product, quantity) => {
  console.log(`Order ${orderId}: ${quantity}x ${product}`);
});

emitter.emit("order", "12345", "Laptop", 2);
// Output: Order 12345: 2x Laptop
```

### Example 5: Real-World Use Case - File Upload Tracker

```javascript
const EventEmitter = require("events");
const fs = require("fs");

class FileUploader extends EventEmitter {
  upload(filePath) {
    this.emit("uploadStarted", filePath);

    // Simulate file reading
    fs.readFile(filePath, (err, data) => {
      if (err) {
        this.emit("uploadFailed", err);
        return;
      }

      // Simulate progress
      this.emit("uploadProgress", 50);

      // Simulate completion
      setTimeout(() => {
        this.emit("uploadProgress", 100);
        this.emit("uploadComplete", filePath);
      }, 1000);
    });
  }
}

const uploader = new FileUploader();

uploader.on("uploadStarted", (file) => {
  console.log("Upload started:", file);
});

uploader.on("uploadProgress", (percent) => {
  console.log(`Progress: ${percent}%`);
});

uploader.on("uploadComplete", (file) => {
  console.log("Upload complete:", file);
});

uploader.on("uploadFailed", (err) => {
  console.error("Upload failed:", err.message);
});

// uploader.upload('./myfile.txt');
```

## Important Concepts

### 1. **Synchronous Execution**

Event listeners are called synchronously in the order they were registered.

```javascript
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("event", () => {
  console.log("First listener");
});

emitter.on("event", () => {
  console.log("Second listener");
});

console.log("Before emit");
emitter.emit("event");
console.log("After emit");

// Output:
// Before emit
// First listener
// Second listener
// After emit
```

### 2. **Memory Leaks Warning**

By default, EventEmitter will print a warning if more than 10 listeners are added for a single event. This helps identify potential memory leaks.

```javascript
const EventEmitter = require("events");
const emitter = new EventEmitter();

// Increase the limit
emitter.setMaxListeners(20);

// Or set to 0 for unlimited (not recommended)
emitter.setMaxListeners(0);

// Get current limit
console.log(emitter.getMaxListeners());
```

### 3. **Prepending Listeners**

You can add listeners to the beginning of the listeners array.

```javascript
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("event", () => {
  console.log("Second");
});

emitter.prependListener("event", () => {
  console.log("First");
});

emitter.emit("event");
// Output:
// First
// Second
```

### 4. **The 'newListener' Event**

EventEmitter emits a `newListener` event when a new listener is added.

```javascript
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("newListener", (event, listener) => {
  console.log(`New listener added for event: ${event}`);
});

emitter.on("data", () => {
  console.log("Data received");
});
// Output: New listener added for event: data
```

### 5. **The 'removeListener' Event**

EventEmitter emits a `removeListener` event when a listener is removed.

```javascript
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("removeListener", (event, listener) => {
  console.log(`Listener removed for event: ${event}`);
});

const callback = () => console.log("test");
emitter.on("test", callback);
emitter.removeListener("test", callback);
// Output: Listener removed for event: test
```

## Best Practices

### 1. Always Handle Error Events

```javascript
emitter.on("error", (err) => {
  console.error("Error:", err);
});
```

### 2. Remove Listeners to Prevent Memory Leaks

```javascript
const listener = () => console.log("Event");
emitter.on("event", listener);

// Later, when no longer needed
emitter.removeListener("event", listener);
```

### 3. Use Once for One-Time Events

```javascript
emitter.once("connect", () => {
  console.log("Connected!");
});
```

### 4. Name Events Consistently

```javascript
// Good
emitter.on("userCreated", handler);
emitter.on("userUpdated", handler);
emitter.on("userDeleted", handler);

// Avoid
emitter.on("user_create", handler);
emitter.on("UPDATE_USER", handler);
```

### 5. Document Events in Your Classes

```javascript
/**
 * @class UserManager
 * @extends EventEmitter
 * @fires UserManager#userCreated
 * @fires UserManager#userDeleted
 */
class UserManager extends EventEmitter {
  // Implementation
}
```

## Real-World Use Cases

1. **HTTP Servers**: Listening for request, connection, and close events
2. **Streams**: Handling data, end, and error events
3. **Custom Application Events**: User registration, order placement, etc.
4. **WebSocket Connections**: Managing connect, disconnect, and message events
5. **Database Connections**: Monitoring connection, error, and disconnection events
6. **File System Watchers**: Detecting file changes, additions, and deletions
7. **Message Queues**: Processing messages and handling queue events
8. **Custom Logging Systems**: Broadcasting log events to multiple handlers

## Common Interview Questions

**Q: What's the difference between on() and once()?**

- `on()` registers a listener that fires every time the event is emitted
- `once()` registers a listener that fires only once and is then automatically removed

**Q: Are event listeners executed synchronously or asynchronously?**

- Event listeners are executed **synchronously** in the order they were registered

**Q: What happens if you emit an 'error' event with no listeners?**

- Node.js will throw the error and crash the process if no error listener is registered

**Q: How do you prevent memory leaks with EventEmitters?**

- Remove listeners when they're no longer needed using `removeListener()` or `removeAllListeners()`
- Use `once()` for one-time events
- Monitor the number of listeners and set appropriate limits with `setMaxListeners()`

## Summary

EventEmitters are a fundamental part of Node.js's event-driven architecture. They provide a powerful and flexible way to implement the Observer pattern, allowing different parts of your application to communicate through events without tight coupling. Understanding EventEmitters is essential for working effectively with Node.js, especially when dealing with asynchronous operations, streams, and building scalable applications.

**Key Takeaways:**

- EventEmitter implements the Observer/pub-sub pattern
- Listeners are executed synchronously in registration order
- Always handle error events to prevent crashes
- Remove listeners to prevent memory leaks
- Many Node.js core modules extend EventEmitter
- Use events to decouple components in your application
