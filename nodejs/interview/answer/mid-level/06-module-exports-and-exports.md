# What is the purpose of `module.exports` and `exports`?

## Short Answer

`module.exports` and `exports` are used in Node.js to **export functions, objects, or values** from a module so they can be used in other files via `require()`.

- **`module.exports`**: The actual object that gets returned when you `require()` a module
- **`exports`**: A shorthand reference to `module.exports` (initially points to the same object)

```javascript
// math.js - Exporting functions

// Using module.exports
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};

// OR using exports (shorthand)
exports.multiply = (a, b) => a * b;
exports.divide = (a, b) => a / b;

// app.js - Importing
const math = require("./math");
console.log(math.add(5, 3)); // 8
```

**Key difference:**

- ✅ `module.exports = value` - Replaces entire export object
- ✅ `exports.key = value` - Adds properties to export object
- ❌ `exports = value` - Breaks the reference (doesn't work!)

## Detailed Answer

### The Module System

Node.js uses the **CommonJS module system** where each file is treated as a separate module.

#### How Modules Work

When you require a module, Node.js wraps your code in a function:

```javascript
(function (exports, require, module, __filename, __dirname) {
  // Your module code here
  // exports and module are available here
});
```

This is why `module`, `exports`, `require`, `__filename`, and `__dirname` are available in every module without importing them.

### Understanding module.exports

`module.exports` is the object that's actually returned when you `require()` a module.

```javascript
// user.js
const name = "John";
const age = 30;

module.exports = {
  name: name,
  age: age,
};

// app.js
const user = require("./user");
console.log(user); // { name: 'John', age: 30 }
console.log(user.name); // 'John'
```

#### Exporting Different Types

```javascript
// 1. Export an object
module.exports = {
  firstName: "John",
  lastName: "Doe",
};

// 2. Export a function
module.exports = function (name) {
  console.log("Hello " + name);
};

// 3. Export a class
module.exports = class User {
  constructor(name) {
    this.name = name;
  }
};

// 4. Export a primitive value
module.exports = 42;

// 5. Export an array
module.exports = [1, 2, 3, 4, 5];
```

### Understanding exports

`exports` is a **shorthand reference** to `module.exports`. Initially, they point to the same object.

```javascript
// Initially:
exports === module.exports; // true

// You can add properties to exports
exports.name = "John";
exports.age = 30;

// This is equivalent to:
module.exports.name = "John";
module.exports.age = 30;
```

#### Using exports

```javascript
// calculator.js
exports.add = (a, b) => a + b;
exports.subtract = (a, b) => a - b;
exports.multiply = (a, b) => a * b;
exports.divide = (a, b) => a / b;

// app.js
const calc = require("./calculator");
console.log(calc.add(5, 3)); // 8
console.log(calc.multiply(4, 2)); // 8
```

### The Key Difference

The crucial difference is that `module.exports` can be **reassigned**, but `exports` cannot.

```javascript
// ✅ CORRECT: Using module.exports
module.exports = function () {
  console.log("Hello");
};

// ❌ WRONG: Reassigning exports
exports = function () {
  console.log("Hello");
};
// This breaks the reference to module.exports!

// ✅ CORRECT: Adding to exports
exports.greet = function () {
  console.log("Hello");
};
```

#### Why exports = value Doesn't Work

```javascript
// What happens behind the scenes:

// 1. Initially
let module = { exports: {} };
let exports = module.exports; // exports points to same object

// 2. Adding properties (WORKS)
exports.name = "John";
// Both exports and module.exports have name property

// 3. Reassigning exports (DOESN'T WORK)
exports = { name: "John" };
// exports now points to a NEW object
// module.exports still points to the ORIGINAL empty object
// require() returns module.exports, NOT exports!
```

### Visual Representation

```javascript
// Initial state
module.exports = {};
exports = module.exports;  // Same reference

┌─────────┐
│ module  │
│ exports ├──────┐
└─────────┘      │
                 ▼
┌─────────┐   ┌─────┐
│ exports ├──▶│  {}  │
└─────────┘   └─────┘

// After: exports.name = 'John'
┌─────────┐
│ module  │
│ exports ├──────┐
└─────────┘      │
                 ▼
┌─────────┐   ┌──────────────┐
│ exports ├──▶│ { name: ... } │
└─────────┘   └──────────────┘

// After: exports = { name: 'John' }
┌─────────┐
│ module  │
│ exports ├──────┐
└─────────┘      │
                 ▼
              ┌─────┐
              │  {}  │  ← require() returns this!
              └─────┘

┌─────────┐   ┌──────────────┐
│ exports ├──▶│ { name: ... } │  ← Lost reference!
└─────────┘   └──────────────┘
```

### Export Patterns

#### Pattern 1: Export Object with Properties

```javascript
// user.js
const firstName = "John";
const lastName = "Doe";
const age = 30;

module.exports = {
  firstName,
  lastName,
  age,
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  },
};

// app.js
const user = require("./user");
console.log(user.firstName); // 'John'
console.log(user.getFullName()); // 'John Doe'
```

#### Pattern 2: Export Individual Functions

```javascript
// utils.js
exports.formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

exports.capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

exports.randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// app.js
const utils = require("./utils");
console.log(utils.formatDate(new Date()));
console.log(utils.capitalize("hello"));
```

#### Pattern 3: Export a Single Function

```javascript
// logger.js
module.exports = function (message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// app.js
const logger = require("./logger");
logger("Application started"); // Direct function call
```

#### Pattern 4: Export a Class

```javascript
// User.js
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  getProfile() {
    return {
      name: this.name,
      email: this.email,
    };
  }
}

module.exports = User;

// app.js
const User = require("./User");
const user = new User("John", "john@example.com");
console.log(user.getProfile());
```

#### Pattern 5: Export Factory Function

```javascript
// database.js
module.exports = function (config) {
  return {
    host: config.host,
    port: config.port,
    connect() {
      console.log(`Connecting to ${this.host}:${this.port}`);
    },
    disconnect() {
      console.log("Disconnecting");
    },
  };
};

// app.js
const createDatabase = require("./database");
const db = createDatabase({ host: "localhost", port: 3306 });
db.connect();
```

#### Pattern 6: Export Multiple Classes/Functions

```javascript
// shapes.js
class Circle {
  constructor(radius) {
    this.radius = radius;
  }
  area() {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  area() {
    return this.width * this.height;
  }
}

module.exports = {
  Circle,
  Rectangle,
};

// app.js
const { Circle, Rectangle } = require("./shapes");
const circle = new Circle(5);
const rect = new Rectangle(4, 6);
console.log(circle.area()); // 78.54
console.log(rect.area()); // 24
```

#### Pattern 7: Revealing Module Pattern

```javascript
// counter.js
let count = 0;

function increment() {
  count++;
}

function decrement() {
  count--;
}

function getCount() {
  return count;
}

// Only export what you want to expose
module.exports = {
  increment,
  decrement,
  getCount,
};
// count is private, cannot be accessed directly

// app.js
const counter = require("./counter");
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
console.log(counter.count); // undefined (private)
```

### Real-World Examples

#### Example 1: Configuration Module

```javascript
// config.js
const config = {
  development: {
    database: {
      host: "localhost",
      port: 3306,
      name: "dev_db",
    },
    apiUrl: "http://localhost:3000",
  },
  production: {
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      name: process.env.DB_NAME,
    },
    apiUrl: process.env.API_URL,
  },
};

const env = process.env.NODE_ENV || "development";

module.exports = config[env];

// app.js
const config = require("./config");
console.log(config.database.host);
console.log(config.apiUrl);
```

#### Example 2: Database Connection Module

```javascript
// db.js
const mongoose = require("mongoose");

let connection = null;

const connect = async () => {
  if (connection) {
    return connection;
  }

  try {
    connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connected");
    return connection;
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;
  }
};

const disconnect = async () => {
  if (connection) {
    await mongoose.disconnect();
    connection = null;
    console.log("Database disconnected");
  }
};

module.exports = {
  connect,
  disconnect,
};

// app.js
const db = require("./db");

async function main() {
  await db.connect();
  // Your app logic
  await db.disconnect();
}
```

#### Example 3: API Service Module

```javascript
// userService.js
const axios = require("axios");

const API_BASE_URL = "https://api.example.com";

class UserService {
  async getUser(id) {
    const response = await axios.get(`${API_BASE_URL}/users/${id}`);
    return response.data;
  }

  async createUser(userData) {
    const response = await axios.post(`${API_BASE_URL}/users`, userData);
    return response.data;
  }

  async updateUser(id, userData) {
    const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id) {
    await axios.delete(`${API_BASE_URL}/users/${id}`);
    return { success: true };
  }
}

module.exports = new UserService();

// app.js
const userService = require("./userService");

async function main() {
  const user = await userService.getUser(1);
  console.log(user);
}
```

#### Example 4: Validation Module

```javascript
// validators.js
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s-()]+$/;

exports.validateEmail = (email) => {
  return emailRegex.test(email);
};

exports.validatePhone = (phone) => {
  return phoneRegex.test(phone);
};

exports.validatePassword = (password) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

exports.validateUser = (user) => {
  const errors = [];

  if (!exports.validateEmail(user.email)) {
    errors.push("Invalid email");
  }

  if (!exports.validatePassword(user.password)) {
    errors.push(
      "Password must be at least 8 characters with upper, lower, and number"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// app.js
const validators = require("./validators");

const user = {
  email: "test@example.com",
  password: "Password123",
};

const result = validators.validateUser(user);
console.log(result);
```

#### Example 5: Middleware Module

```javascript
// middleware/auth.js
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};

// app.js
const express = require("express");
const { authenticate, authorize } = require("./middleware/auth");

const app = express();

app.get("/profile", authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.delete("/users/:id", authenticate, authorize("admin"), (req, res) => {
  res.json({ message: "User deleted" });
});
```

#### Example 6: Utility Module with Mixed Exports

```javascript
// utils/index.js
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Export all utilities
module.exports = {
  formatDate,
  formatCurrency,
  sleep,
  chunk,
};

// app.js
const { formatDate, formatCurrency, chunk } = require("./utils");

console.log(formatDate(new Date()));
console.log(formatCurrency(1234.56));
console.log(chunk([1, 2, 3, 4, 5, 6], 2));
```

#### Example 7: Singleton Pattern

```javascript
// logger.js
class Logger {
  constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }

    this.logs = [];
    Logger.instance = this;
  }

  log(message) {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
    };
    this.logs.push(entry);
    console.log(`[${entry.timestamp}] ${message}`);
  }

  getLogs() {
    return this.logs;
  }
}

// Export singleton instance
module.exports = new Logger();

// app.js
const logger1 = require("./logger");
const logger2 = require("./logger");

logger1.log("First message");
logger2.log("Second message");

console.log(logger1 === logger2); // true (same instance)
console.log(logger1.getLogs()); // Both messages
```

#### Example 8: Module with Private State

```javascript
// cache.js
const cache = new Map();

const set = (key, value, ttl = 60000) => {
  const expiry = Date.now() + ttl;
  cache.set(key, { value, expiry });
};

const get = (key) => {
  const item = cache.get(key);

  if (!item) {
    return null;
  }

  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }

  return item.value;
};

const del = (key) => {
  return cache.delete(key);
};

const clear = () => {
  cache.clear();
};

const size = () => {
  return cache.size;
};

// Only export public API
module.exports = {
  set,
  get,
  del,
  clear,
  size,
};
// The 'cache' Map is private

// app.js
const cache = require("./cache");

cache.set("user:1", { name: "John" }, 5000);
console.log(cache.get("user:1")); // { name: 'John' }
console.log(cache.size()); // 1
```

### Common Mistakes

```javascript
// ❌ 1. Reassigning exports
exports = function () {
  console.log("Hello");
};
// Doesn't work! Use module.exports instead

// ✅ Fix
module.exports = function () {
  console.log("Hello");
};

// ❌ 2. Mixing patterns
module.exports = {
  name: "John",
};
exports.age = 30; // This won't work!

// ✅ Fix - Choose one pattern
module.exports = {
  name: "John",
  age: 30,
};

// ❌ 3. Circular dependencies
// fileA.js
const fileB = require("./fileB");
exports.funcA = () => fileB.funcB();

// fileB.js
const fileA = require("./fileA");
exports.funcB = () => fileA.funcA(); // Circular!

// ✅ Fix - Restructure to avoid circular dependencies

// ❌ 4. Returning wrong type
module.exports.getData = () => {
  return data;
};

// Later importing as:
const getData = require("./module"); // Wrong!

// ✅ Fix - Import correctly
const { getData } = require("./module");
// OR
const module = require("./module");
module.getData();

// ❌ 5. Mutating exports after require
// config.js
module.exports = {
  apiKey: "abc123",
};

// app.js
const config = require("./config");
config.apiKey = "modified"; // Mutates the cached module!

// anotherFile.js
const config = require("./config");
console.log(config.apiKey); // 'modified' (unexpected!)

// ✅ Fix - Use Object.freeze or getter functions
module.exports = Object.freeze({
  apiKey: "abc123",
});
```

### Best Practices

```javascript
// ✅ 1. Use module.exports for single export
module.exports = class User {};
module.exports = function createServer() {};

// ✅ 2. Use exports for multiple properties
exports.add = (a, b) => a + b;
exports.subtract = (a, b) => a - b;

// ✅ 3. Use object shorthand
const func1 = () => {};
const func2 = () => {};
module.exports = { func1, func2 };

// ✅ 4. Export at the end of file
const helper1 = () => {};
const helper2 = () => {};
// ... more code ...
module.exports = { helper1, helper2 };

// ✅ 5. Use descriptive names
module.exports = {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

// ✅ 6. Document your exports
/**
 * User service for managing user operations
 * @module userService
 */

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User object
 */
exports.getUserById = async (id) => {
  // Implementation
};

// ✅ 7. Freeze configuration objects
module.exports = Object.freeze({
  API_KEY: "secret",
  API_URL: "https://api.example.com",
});

// ✅ 8. Use factory functions for stateful modules
module.exports = function createCache() {
  const cache = new Map();

  return {
    set: (key, value) => cache.set(key, value),
    get: (key) => cache.get(key),
  };
};
```

### Comparison: CommonJS vs ES Modules

```javascript
// CommonJS (Node.js default)
// user.js
module.exports = {
  name: "John",
  age: 30,
};

// app.js
const user = require("./user");

// ES Modules (Modern JavaScript)
// user.js
export const name = "John";
export const age = 30;
// OR
export default { name: "John", age: 30 };

// app.js
import { name, age } from "./user.js";
// OR
import user from "./user.js";
```

### Comparison Table

| Feature                      | module.exports      | exports            |
| ---------------------------- | ------------------- | ------------------ |
| **Can be reassigned**        | ✅ Yes              | ❌ No              |
| **Add properties**           | ✅ Yes              | ✅ Yes             |
| **What's returned**          | ✅ This is returned | ❌ Reference only  |
| **Use for single export**    | ✅ Recommended      | ❌ Not possible    |
| **Use for multiple exports** | ✅ Yes              | ✅ Yes (preferred) |
| **Direct function/class**    | ✅ Yes              | ❌ No              |

### Key Takeaways

- ✅ `module.exports` is what actually gets **returned** by `require()`
- ✅ `exports` is a **shorthand reference** to `module.exports`
- ✅ You can **reassign** `module.exports`, but NOT `exports`
- ✅ Use `module.exports` for **single** exports (function, class)
- ✅ Use `exports.property` for **multiple** exports
- ✅ `exports = value` **doesn't work** (breaks reference)
- ✅ Both point to the **same object** initially
- ✅ Modules are **cached** after first require
- ✅ Each module has its own **scope** (no global pollution)
- ✅ Node.js uses **CommonJS** module system
- ✅ Use **revealing module pattern** to hide private data
- ✅ Avoid **circular dependencies** between modules
- ✅ **Freeze** configuration objects to prevent mutation
- ✅ Export at the **end of file** for clarity

### Further Reading

- [Node.js Modules Documentation](https://nodejs.org/api/modules.html)
- [CommonJS Module System](https://nodejs.org/docs/latest/api/modules.html#modules_the_module_object)
- [Module Exports vs Exports](https://nodejs.org/api/modules.html#modules_exports_shortcut)
- [ES Modules in Node.js](https://nodejs.org/api/esm.html)
- [Module Design Patterns](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/)
