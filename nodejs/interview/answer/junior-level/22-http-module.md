# What is the `http` module used for?

## Short Answer

The **`http` module** is a built-in Node.js module used to create **HTTP servers and clients**. It allows you to:

- **Create web servers** that handle HTTP requests
- **Make HTTP requests** to other servers
- **Handle requests and responses**
- **Work with HTTP headers, methods, and status codes**

```javascript
const http = require("http");

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello World\n");
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});
```

**Use cases:** Building web servers, REST APIs, making HTTP requests, creating microservices, proxies, and more.

## Detailed Answer

### Overview

The `http` module provides HTTP server and client functionality without external dependencies.

```javascript
// CommonJS
const http = require("http");

// ES Modules
import http from "http";
```

### Creating HTTP Servers

#### 1. Basic HTTP Server

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  // req: incoming request
  // res: server response

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World\n");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
```

#### 2. Handling Different Routes

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  const { url, method } = req;

  if (url === "/" && method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Home Page</h1>");
  } else if (url === "/about" && method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>About Page</h1>");
  } else if (url === "/api/data" && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "API Data" }));
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404 Not Found</h1>");
  }
});

server.listen(3000);
```

#### 3. Handling POST Requests (with body)

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/api/users" && req.method === "POST") {
    let body = "";

    // Collect data chunks
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    // When all data received
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        console.log("Received data:", data);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "User created",
            user: data,
          })
        );
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(3000);
```

#### 4. Serving HTML Files

```javascript
const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, "public", "index.html");

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server Error");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(content);
  });
});

server.listen(3000);
```

#### 5. Serving Static Files

```javascript
const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  let filePath = path.join(
    __dirname,
    "public",
    req.url === "/" ? "index.html" : req.url
  );

  const extname = path.extname(filePath);

  // Set content type based on file extension
  const contentTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
  };

  const contentType = contentTypes[extname] || "text/plain";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 Not Found</h1>");
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(3000);
```

### Making HTTP Requests

#### 1. GET Request

```javascript
const http = require("http");

const options = {
  hostname: "jsonplaceholder.typicode.com",
  port: 80,
  path: "/posts/1",
  method: "GET",
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response:", JSON.parse(data));
  });
});

req.on("error", (err) => {
  console.error("Error:", err);
});

req.end();
```

#### 2. Using http.get() (Shortcut for GET)

```javascript
const http = require("http");

http
  .get("http://jsonplaceholder.typicode.com/posts/1", (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Data:", JSON.parse(data));
    });
  })
  .on("error", (err) => {
    console.error("Error:", err);
  });
```

#### 3. POST Request with Data

```javascript
const http = require("http");

const postData = JSON.stringify({
  title: "My Post",
  body: "This is the content",
  userId: 1,
});

const options = {
  hostname: "jsonplaceholder.typicode.com",
  port: 80,
  path: "/posts",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response:", JSON.parse(data));
  });
});

req.on("error", (err) => {
  console.error("Error:", err);
});

req.write(postData);
req.end();
```

#### 4. Making Requests with Promises

```javascript
const http = require("http");

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}

// Usage with async/await
async function fetchData() {
  try {
    const data = await httpGet("http://jsonplaceholder.typicode.com/posts/1");
    console.log("Data:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

fetchData();
```

### Request Object Properties

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  console.log("URL:", req.url);
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  console.log("HTTP Version:", req.httpVersion);

  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log("Pathname:", url.pathname);
  console.log("Search:", url.search);
  console.log("Query:", url.searchParams);

  // Get specific header
  const userAgent = req.headers["user-agent"];
  const contentType = req.headers["content-type"];

  res.end("OK");
});

server.listen(3000);
```

### Response Object Methods

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  // Set status code
  res.statusCode = 200;

  // Set single header
  res.setHeader("Content-Type", "text/html");

  // Set multiple headers
  res.setHeader("X-Custom-Header", "value");
  res.setHeader("X-Another-Header", "another-value");

  // Write response (can call multiple times)
  res.write("<html>");
  res.write("<body>");
  res.write("<h1>Hello World</h1>");
  res.write("</body>");
  res.write("</html>");

  // End response (required)
  res.end();

  // Or combine writeHead and end
  // res.writeHead(200, { 'Content-Type': 'text/html' });
  // res.end('<h1>Hello World</h1>');
});

server.listen(3000);
```

### Real-World Examples

#### Example 1: Simple REST API

```javascript
const http = require("http");

let users = [
  { id: 1, name: "John", email: "john@example.com" },
  { id: 2, name: "Jane", email: "jane@example.com" },
];

const server = http.createServer((req, res) => {
  const { url, method } = req;

  // GET all users
  if (url === "/api/users" && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(users));
  }
  // GET single user
  else if (url.match(/\/api\/users\/(\d+)/) && method === "GET") {
    const id = parseInt(url.split("/")[3]);
    const user = users.find((u) => u.id === id);

    if (user) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "User not found" }));
    }
  }
  // POST new user
  else if (url === "/api/users" && method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const newUser = JSON.parse(body);
      newUser.id = users.length + 1;
      users.push(newUser);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newUser));
    });
  }
  // DELETE user
  else if (url.match(/\/api\/users\/(\d+)/) && method === "DELETE") {
    const id = parseInt(url.split("/")[3]);
    const index = users.findIndex((u) => u.id === id);

    if (index !== -1) {
      users.splice(index, 1);
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "User not found" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

server.listen(3000, () => {
  console.log("API server running on http://localhost:3000");
});
```

#### Example 2: Proxy Server

```javascript
const http = require("http");

const proxyServer = http.createServer((req, res) => {
  console.log(`Proxying: ${req.method} ${req.url}`);

  const options = {
    hostname: "jsonplaceholder.typicode.com",
    port: 80,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Forward status and headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Pipe response
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err);
    res.writeHead(502);
    res.end("Bad Gateway");
  });

  // Pipe request
  req.pipe(proxyReq);
});

proxyServer.listen(3000, () => {
  console.log("Proxy server running on http://localhost:3000");
});
```

#### Example 3: File Upload Server

```javascript
const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  if (req.url === "/upload" && req.method === "POST") {
    const filename = `upload-${Date.now()}.txt`;
    const filePath = path.join(__dirname, "uploads", filename);

    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream);

    writeStream.on("finish", () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "File uploaded successfully",
          filename: filename,
        })
      );
    });

    writeStream.on("error", (err) => {
      console.error("Upload error:", err);
      res.writeHead(500);
      res.end("Upload failed");
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(3000);
```

#### Example 4: Server with Middleware Pattern

```javascript
const http = require("http");

// Middleware functions
function logger(req, res, next) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
}

function cors(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
}

function parseJSON(req, res, next) {
  if (req.method === "POST" || req.method === "PUT") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        req.body = JSON.parse(body);
      } catch (err) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
}

// Simple middleware runner
function runMiddleware(middlewares, req, res) {
  let index = 0;

  function next() {
    if (index < middlewares.length) {
      const middleware = middlewares[index++];
      middleware(req, res, next);
    } else {
      handleRequest(req, res);
    }
  }

  next();
}

function handleRequest(req, res) {
  if (req.url === "/api/data" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Hello" }));
  } else if (req.url === "/api/data" && req.method === "POST") {
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: req.body }));
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
}

const server = http.createServer((req, res) => {
  runMiddleware([logger, cors, parseJSON], req, res);
});

server.listen(3000);
```

#### Example 5: Health Check Endpoint

```javascript
const http = require("http");

const startTime = Date.now();

function healthCheck(req, res) {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const health = {
    status: "OK",
    uptime: uptime,
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(health, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    healthCheck(req, res);
  } else if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is running");
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("Health check: http://localhost:3000/health");
});
```

### Server Events

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  res.end("Hello");
});

// Connection event
server.on("connection", (socket) => {
  console.log("New connection established");
});

// Request event
server.on("request", (req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
});

// Client error event
server.on("clientError", (err, socket) => {
  console.error("Client error:", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

// Close event
server.on("close", () => {
  console.log("Server closed");
});

server.listen(3000);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
```

### HTTP Methods and Status Codes

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  const { url, method } = req;

  // HTTP Methods
  switch (method) {
    case "GET":
      // Read resource
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "GET request" }));
      break;

    case "POST":
      // Create resource
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Resource created" }));
      break;

    case "PUT":
      // Update resource (full)
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Resource updated" }));
      break;

    case "PATCH":
      // Update resource (partial)
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Resource patched" }));
      break;

    case "DELETE":
      // Delete resource
      res.writeHead(204); // No Content
      res.end();
      break;

    case "OPTIONS":
      // Preflight request
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      break;

    default:
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
  }
});

server.listen(3000);
```

### HTTPS Module

For secure connections, use the `https` module (similar API):

```javascript
const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("private-key.pem"),
  cert: fs.readFileSync("certificate.pem"),
};

const server = https.createServer(options, (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello Secure World\n");
});

server.listen(443, () => {
  console.log("HTTPS server running on port 443");
});
```

### Best Practices

```javascript
// ✅ 1. Always set appropriate headers
res.setHeader("Content-Type", "application/json");

// ✅ 2. Handle errors properly
req.on("error", (err) => {
  console.error("Request error:", err);
});

// ✅ 3. Use appropriate status codes
res.statusCode = 404; // Not Found
res.statusCode = 500; // Server Error
res.statusCode = 201; // Created

// ✅ 4. Always end responses
res.end(); // Don't forget this!

// ✅ 5. Validate input
if (!isValidData(data)) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Invalid data" }));
  return;
}

// ✅ 6. Implement graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

// ✅ 7. Use streams for large data
req.pipe(writeStream);

// ✅ 8. Set timeout
server.timeout = 30000; // 30 seconds

// ✅ 9. Limit request size
let size = 0;
const MAX_SIZE = 1024 * 1024; // 1MB

req.on("data", (chunk) => {
  size += chunk.length;
  if (size > MAX_SIZE) {
    res.writeHead(413, { "Content-Type": "text/plain" });
    res.end("Payload Too Large");
    req.connection.destroy();
  }
});

// ✅ 10. Use logging
console.log(`${req.method} ${req.url} - ${res.statusCode}`);
```

### Key Takeaways

- ✅ `http` module creates HTTP servers and clients
- ✅ Use `http.createServer()` to create a server
- ✅ Use `http.request()` or `http.get()` to make requests
- ✅ Request object contains: url, method, headers
- ✅ Response object methods: writeHead(), write(), end()
- ✅ Always call `res.end()` to complete response
- ✅ Use streams for large data (req.pipe(), res.pipe())
- ✅ Handle errors with req.on('error') and res.on('error')
- ✅ Set appropriate status codes (200, 404, 500, etc.)
- ✅ For production, use frameworks like Express.js
- ✅ For HTTPS, use `https` module with SSL certificates
- ✅ Implement graceful shutdown for production servers

### Further Reading

- [Node.js http module documentation](https://nodejs.org/api/http.html)
- [Node.js https module documentation](https://nodejs.org/api/https.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [HTTP Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- [Building HTTP Servers in Node.js](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/)
