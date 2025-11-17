# What is `JSON.parse()` and `JSON.stringify()`?

## Short Answer

**`JSON.parse()`** converts a JSON string into a JavaScript object, while **`JSON.stringify()`** converts a JavaScript object into a JSON string.

```javascript
// JSON.stringify() - Object to JSON string
const obj = { name: "John", age: 30 };
const jsonString = JSON.stringify(obj);
console.log(jsonString); // '{"name":"John","age":30}'

// JSON.parse() - JSON string to Object
const jsonStr = '{"name":"John","age":30}';
const parsed = JSON.parse(jsonStr);
console.log(parsed); // { name: 'John', age: 30 }
```

**Use cases:**

- **`JSON.stringify()`**: Sending data to APIs, saving to localStorage, logging
- **`JSON.parse()`**: Receiving API responses, reading from localStorage, parsing config files

## Detailed Answer

### JSON.stringify() - Convert Object to String

`JSON.stringify()` converts a JavaScript value (object, array, etc.) to a JSON string.

#### Basic Usage

```javascript
// Convert object to JSON string
const user = {
  name: "John Doe",
  age: 30,
  email: "john@example.com",
};

const jsonString = JSON.stringify(user);
console.log(jsonString);
// Output: '{"name":"John Doe","age":30,"email":"john@example.com"}'

console.log(typeof jsonString); // 'string'
```

#### Syntax

```javascript
JSON.stringify(value, replacer, space);
```

**Parameters:**

- `value`: The value to convert to JSON string
- `replacer` (optional): Function or array to filter/transform properties
- `space` (optional): Number or string for indentation (pretty printing)

#### Pretty Printing (Formatted Output)

```javascript
const user = {
  name: "John",
  age: 30,
  address: {
    city: "New York",
    country: "USA",
  },
};

// With 2 spaces indentation
const formatted = JSON.stringify(user, null, 2);
console.log(formatted);
/* Output:
{
  "name": "John",
  "age": 30,
  "address": {
    "city": "New York",
    "country": "USA"
  }
}
*/

// With 4 spaces
const formatted4 = JSON.stringify(user, null, 4);

// With tab character
const formattedTab = JSON.stringify(user, null, "\t");
```

#### Using Replacer Function

```javascript
const user = {
  name: "John",
  age: 30,
  password: "secret123",
  email: "john@example.com",
};

// Filter out password field
const json = JSON.stringify(user, (key, value) => {
  if (key === "password") {
    return undefined; // Exclude this property
  }
  return value;
});

console.log(json);
// Output: '{"name":"John","age":30,"email":"john@example.com"}'

// Transform values
const transformed = JSON.stringify(user, (key, value) => {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value;
});
console.log(transformed);
// Output: '{"name":"JOHN","age":30,"password":"SECRET123","email":"JOHN@EXAMPLE.COM"}'
```

#### Using Replacer Array

```javascript
const user = {
  name: "John",
  age: 30,
  password: "secret123",
  email: "john@example.com",
  address: "New York",
};

// Only include specific properties
const json = JSON.stringify(user, ["name", "email"]);
console.log(json);
// Output: '{"name":"John","email":"john@example.com"}'
```

#### What Can Be Stringified

```javascript
// ✅ Primitives
JSON.stringify(42); // '42'
JSON.stringify("hello"); // '"hello"'
JSON.stringify(true); // 'true'
JSON.stringify(null); // 'null'

// ✅ Objects
JSON.stringify({ a: 1 }); // '{"a":1}'

// ✅ Arrays
JSON.stringify([1, 2, 3]); // '[1,2,3]'

// ✅ Nested structures
JSON.stringify({
  users: [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
  ],
});
// '{"users":[{"id":1,"name":"John"},{"id":2,"name":"Jane"}]}'
```

#### What Cannot Be Stringified (Gets Omitted or Converted)

```javascript
const obj = {
  name: "John",
  age: 30,
  greet: function () {
    return "Hello";
  }, // ❌ Function (omitted)
  symbol: Symbol("id"), // ❌ Symbol (omitted)
  undef: undefined, // ❌ undefined (omitted)
  date: new Date(), // ✅ Converted to ISO string
  regex: /test/, // ✅ Converted to {}
  inf: Infinity, // ✅ Converted to null
  nan: NaN, // ✅ Converted to null
};

console.log(JSON.stringify(obj));
// Output: '{"name":"John","age":30,"date":"2025-11-16T...","regex":{},"inf":null,"nan":null}'
```

#### Circular References (Error)

```javascript
const obj = { name: "John" };
obj.self = obj; // Circular reference

try {
  JSON.stringify(obj);
} catch (err) {
  console.error("Error:", err.message);
  // Error: Converting circular structure to JSON
}
```

#### Custom toJSON() Method

```javascript
const user = {
  name: "John",
  age: 30,
  password: "secret123",
  toJSON() {
    // Custom serialization
    return {
      name: this.name,
      age: this.age,
      // password excluded
    };
  },
};

console.log(JSON.stringify(user));
// Output: '{"name":"John","age":30}'

// Date objects have built-in toJSON()
const date = new Date();
console.log(JSON.stringify({ date }));
// Output: '{"date":"2025-11-16T10:30:00.000Z"}'
```

### JSON.parse() - Convert String to Object

`JSON.parse()` parses a JSON string and returns a JavaScript object.

#### Basic Usage

```javascript
// Parse JSON string to object
const jsonString = '{"name":"John","age":30,"email":"john@example.com"}';
const user = JSON.parse(jsonString);

console.log(user); // { name: 'John', age: 30, email: 'john@example.com' }
console.log(user.name); // 'John'
console.log(typeof user); // 'object'
```

#### Syntax

```javascript
JSON.parse(text, reviver);
```

**Parameters:**

- `text`: The JSON string to parse
- `reviver` (optional): Function to transform parsed values

#### Parsing Arrays

```javascript
const jsonArray = "[1, 2, 3, 4, 5]";
const arr = JSON.parse(jsonArray);
console.log(arr); // [1, 2, 3, 4, 5]

const jsonUsers = '[{"id":1,"name":"John"},{"id":2,"name":"Jane"}]';
const users = JSON.parse(jsonUsers);
console.log(users); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
```

#### Using Reviver Function

```javascript
const jsonString = '{"name":"John","age":"30","joined":"2024-01-15"}';

// Convert string numbers to actual numbers
const parsed = JSON.parse(jsonString, (key, value) => {
  if (key === "age") {
    return parseInt(value, 10);
  }
  if (key === "joined") {
    return new Date(value);
  }
  return value;
});

console.log(parsed);
// { name: 'John', age: 30, joined: Date object }
console.log(typeof parsed.age); // 'number'
console.log(parsed.joined instanceof Date); // true
```

#### Error Handling

```javascript
// ❌ Invalid JSON - Will throw error
const invalidJson = '{ name: "John" }'; // Missing quotes around key

try {
  const parsed = JSON.parse(invalidJson);
} catch (err) {
  console.error("Parse error:", err.message);
  // Parse error: Unexpected token n in JSON at position 2
}

// ✅ Safe parsing with try/catch
function safeParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Invalid JSON:", err.message);
    return defaultValue;
  }
}

const result1 = safeParse('{"name":"John"}');
console.log(result1); // { name: 'John' }

const result2 = safeParse("invalid json", {});
console.log(result2); // {}
```

#### Common Parse Errors

```javascript
// ❌ Single quotes (must use double quotes)
// JSON.parse("{'name':'John'}"); // Error!

// ❌ Trailing commas
// JSON.parse('{"name":"John",}'); // Error!

// ❌ Undefined, NaN, Infinity
// JSON.parse('{"value":undefined}'); // Error!

// ❌ Comments
// JSON.parse('{"name":"John"} // comment'); // Error!

// ✅ Valid JSON
JSON.parse('{"name":"John"}'); // OK
JSON.parse("[1,2,3]"); // OK
JSON.parse("null"); // OK
JSON.parse("true"); // OK
JSON.parse("42"); // OK
JSON.parse('"hello"'); // OK
```

### Real-World Examples

#### Example 1: API Communication

```javascript
// Sending data to API
const user = {
  name: "John Doe",
  email: "john@example.com",
  age: 30,
};

// Convert to JSON string for API request
const requestBody = JSON.stringify(user);

fetch("https://api.example.com/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: requestBody,
})
  .then((response) => response.text())
  .then((jsonString) => {
    // Parse JSON response
    const data = JSON.parse(jsonString);
    console.log("User created:", data);
  });

// Or use response.json() which calls JSON.parse internally
fetch("https://api.example.com/users")
  .then((response) => response.json()) // Automatically parses JSON
  .then((data) => {
    console.log("Users:", data);
  });
```

#### Example 2: LocalStorage

```javascript
// Save object to localStorage
const user = {
  id: 1,
  name: "John Doe",
  preferences: {
    theme: "dark",
    language: "en",
  },
};

// localStorage only stores strings
localStorage.setItem("user", JSON.stringify(user));

// Retrieve and parse from localStorage
const storedUser = localStorage.getItem("user");
if (storedUser) {
  const user = JSON.parse(storedUser);
  console.log("User theme:", user.preferences.theme);
}

// Helper functions
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFromStorage(key, defaultValue = null) {
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;

  try {
    return JSON.parse(item);
  } catch (err) {
    console.error("Parse error:", err);
    return defaultValue;
  }
}

// Usage
saveToStorage("settings", { theme: "dark", notifications: true });
const settings = getFromStorage("settings", { theme: "light" });
```

#### Example 3: Deep Clone

```javascript
// Deep clone an object using JSON methods
const original = {
  name: "John",
  age: 30,
  address: {
    city: "New York",
    country: "USA",
  },
  hobbies: ["reading", "coding"],
};

// Deep clone
const clone = JSON.parse(JSON.stringify(original));

clone.address.city = "Los Angeles";
clone.hobbies.push("gaming");

console.log(original.address.city); // 'New York' (unchanged)
console.log(clone.address.city); // 'Los Angeles'

// ⚠️ Limitations: Functions, Date objects, etc. are not cloned properly
const obj = {
  name: "John",
  greet: function () {
    return "Hello";
  },
  date: new Date(),
};

const cloned = JSON.parse(JSON.stringify(obj));
console.log(cloned);
// { name: 'John', date: '2025-11-16T...' }
// Function is lost, Date becomes string
```

#### Example 4: Configuration Files

```javascript
const fs = require("fs");

// Read and parse JSON config file
const configJson = fs.readFileSync("config.json", "utf8");
const config = JSON.parse(configJson);

console.log("Database host:", config.database.host);

// Modify and save config
config.database.port = 5433;
const updatedJson = JSON.stringify(config, null, 2);
fs.writeFileSync("config.json", updatedJson);
```

#### Example 5: Data Validation and Sanitization

```javascript
// Remove sensitive data before logging
function sanitizeForLogging(obj) {
  const sensitiveFields = ["password", "token", "apiKey", "secret"];

  const sanitized = JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (sensitiveFields.includes(key)) {
        return "***REDACTED***";
      }
      return value;
    })
  );

  return sanitized;
}

const user = {
  id: 1,
  name: "John",
  email: "john@example.com",
  password: "secret123",
  apiKey: "abc123xyz",
};

console.log("Logging user:", sanitizeForLogging(user));
// { id: 1, name: 'John', email: 'john@example.com', password: '***REDACTED***', apiKey: '***REDACTED***' }
```

#### Example 6: Express.js Request/Response

```javascript
const express = require("express");
const app = express();

// Parse JSON request body
app.use(express.json()); // Middleware uses JSON.parse()

app.post("/api/users", (req, res) => {
  // req.body is already parsed (JSON.parse was called by middleware)
  const user = req.body;
  console.log("Received:", user);

  // Create response object
  const response = {
    success: true,
    message: "User created",
    user: user,
  };

  // res.json() uses JSON.stringify() internally
  res.json(response);
});

// Manual stringification
app.get("/api/data", (req, res) => {
  const data = { message: "Hello" };
  const jsonString = JSON.stringify(data);

  res.setHeader("Content-Type", "application/json");
  res.send(jsonString);
});
```

#### Example 7: WebSocket Communication

```javascript
const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  // Send JSON data
  const message = {
    type: "chat",
    user: "John",
    text: "Hello World",
  };

  ws.send(JSON.stringify(message));
});

ws.on("message", (data) => {
  // Parse incoming JSON
  try {
    const message = JSON.parse(data);
    console.log("Received:", message.type, message.text);
  } catch (err) {
    console.error("Invalid JSON:", err.message);
  }
});
```

#### Example 8: Custom Serialization

```javascript
class User {
  constructor(name, age, password) {
    this.name = name;
    this.age = age;
    this.password = password;
  }

  // Custom serialization
  toJSON() {
    return {
      name: this.name,
      age: this.age,
      // password excluded for security
    };
  }

  // Static method to create User from JSON
  static fromJSON(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    return new User(obj.name, obj.age, "");
  }
}

const user = new User("John", 30, "secret123");
const json = JSON.stringify(user);
console.log(json); // '{"name":"John","age":30}'

const restored = User.fromJSON(json);
console.log(restored instanceof User); // true
```

### Comparison Table

| Aspect         | JSON.stringify()           | JSON.parse()                |
| -------------- | -------------------------- | --------------------------- |
| **Purpose**    | Object → String            | String → Object             |
| **Input**      | JavaScript value           | JSON string                 |
| **Output**     | JSON string                | JavaScript value            |
| **Use case**   | Sending data, storage      | Receiving data, loading     |
| **Error**      | Circular reference         | Invalid JSON syntax         |
| **Parameters** | (value, replacer, space)   | (text, reviver)             |
| **Common use** | API requests, localStorage | API responses, config files |

### Common Patterns

```javascript
// 1. Safe stringify
function safeStringify(obj, fallback = "{}") {
  try {
    return JSON.stringify(obj);
  } catch (err) {
    console.error("Stringify error:", err);
    return fallback;
  }
}

// 2. Safe parse
function safeParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch (err) {
    console.error("Parse error:", err);
    return fallback;
  }
}

// 3. Pretty print
function prettyPrint(obj) {
  return JSON.stringify(obj, null, 2);
}

// 4. Deep clone (with limitations)
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// 5. Remove undefined/null values
function removeEmpty(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      return value === undefined || value === null ? undefined : value;
    })
  );
}

// 6. Convert to query string
function toQueryString(obj) {
  return Object.entries(obj)
    .map(([key, val]) => `${key}=${encodeURIComponent(JSON.stringify(val))}`)
    .join("&");
}

// 7. Size in bytes
function getJsonSize(obj) {
  return new Blob([JSON.stringify(obj)]).size;
}

// 8. Compress whitespace
function minify(obj) {
  return JSON.stringify(obj); // No space parameter = compact
}

// 9. Sort keys
function sortKeys(obj) {
  return JSON.parse(JSON.stringify(obj, Object.keys(obj).sort()));
}

// 10. Round-trip validation
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
```

### Performance Considerations

```javascript
// Large objects
const largeArray = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  data: "some data",
}));

console.time("stringify");
const json = JSON.stringify(largeArray);
console.timeEnd("stringify"); // ~50ms

console.time("parse");
const parsed = JSON.parse(json);
console.timeEnd("parse"); // ~30ms

// Memory considerations
console.log("JSON size:", (json.length / 1024 / 1024).toFixed(2), "MB");
```

### Best Practices

```javascript
// ✅ 1. Always use try/catch with JSON.parse()
try {
  const data = JSON.parse(jsonString);
} catch (err) {
  console.error("Invalid JSON:", err.message);
}

// ✅ 2. Validate before parsing
function parseIfValid(str) {
  if (typeof str !== "string") return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// ✅ 3. Use pretty printing for debugging
console.log(JSON.stringify(obj, null, 2));

// ✅ 4. Remove sensitive data before logging
const safe = JSON.parse(
  JSON.stringify(obj, (k, v) => (k === "password" ? undefined : v))
);

// ✅ 5. Handle circular references
const CircularJSON = require("circular-json");
const json = CircularJSON.stringify(objWithCircular);

// ✅ 6. Use replacer to filter properties
const filtered = JSON.stringify(obj, ["id", "name", "email"]);

// ✅ 7. Convert dates properly with reviver
const parsed = JSON.parse(json, (key, value) => {
  if (key.endsWith("Date") && typeof value === "string") {
    return new Date(value);
  }
  return value;
});

// ✅ 8. Check for undefined before stringify
function stringify(value) {
  if (value === undefined) return "null";
  return JSON.stringify(value);
}

// ✅ 9. Use schema validation for critical data
const Joi = require("joi");
const schema = Joi.object({ name: Joi.string(), age: Joi.number() });
const { error, value } = schema.validate(JSON.parse(json));

// ✅ 10. Consider alternatives for complex serialization
// Use libraries like: serialize-javascript, flatted, or superjson
```

### Common Mistakes

```javascript
// ❌ 1. Not handling parse errors
const data = JSON.parse(userInput); // May throw!

// ❌ 2. Trying to parse undefined
const result = JSON.parse(undefined); // Error!

// ❌ 3. Expecting functions to be preserved
const obj = { fn: () => "hello" };
const json = JSON.stringify(obj); // '{}' - function lost!

// ❌ 4. Circular references
const obj = { a: 1 };
obj.self = obj;
JSON.stringify(obj); // Error: Converting circular structure

// ❌ 5. Assuming Date objects restore properly
const obj = { date: new Date() };
const parsed = JSON.parse(JSON.stringify(obj));
console.log(parsed.date instanceof Date); // false - it's a string!

// ❌ 6. Double stringifying
const data = { name: "John" };
const json = JSON.stringify(JSON.stringify(data));
// '"{\"name\":\"John\"}"' - escaped string!

// ❌ 7. Not validating input
JSON.parse(userControlledInput); // Security risk!

// ❌ 8. Using for deep clone without understanding limitations
const clone = JSON.parse(JSON.stringify(obj)); // Loses functions, dates, etc.
```

### Key Takeaways

- ✅ `JSON.stringify()` converts objects to JSON strings
- ✅ `JSON.parse()` converts JSON strings to objects
- ✅ Always use try/catch with `JSON.parse()`
- ✅ Functions, undefined, and symbols are omitted in stringify
- ✅ Dates become ISO strings, need reviver to restore
- ✅ Circular references cause errors
- ✅ Use replacer/reviver for custom serialization
- ✅ Pretty print with third parameter: `JSON.stringify(obj, null, 2)`
- ✅ Common use: API communication, localStorage, config files
- ✅ Can be used for deep cloning (with limitations)
- ✅ JSON is a subset of JavaScript object literal syntax
- ✅ Always validate and sanitize untrusted JSON input

### Further Reading

- [JSON.stringify() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [JSON.parse() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [JSON specification](https://www.json.org/)
- [Working with JSON - JavaScript.info](https://javascript.info/json)
- [Circular reference handling libraries](https://www.npmjs.com/package/circular-json)
