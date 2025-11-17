# How do you create a simple HTTP server in Node.js?

## Short Answer

To create a simple HTTP server in Node.js, use the built-in `http` module with `http.createServer()`:

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World\n");
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});
```

**Key steps:**

1. Import the `http` module
2. Create server with `http.createServer(callback)`
3. Handle requests in the callback (req, res)
4. Call `server.listen(port)` to start the server

## Detailed Answer

### Basic HTTP Server

#### 1. Minimal Server Example

```javascript
const http = require("http");

// Create the server
const server = http.createServer((req, res) => {
  // req: incoming request object
  // res: server response object

  res.end("Hello World");
});

// Start listening on port 3000
server.listen(3000);

console.log("Server running at http://localhost:3000/");
```

#### 2. Server with Status Code and Headers

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  // Set status code
  res.statusCode = 200;

  // Set response headers
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("X-Custom-Header", "MyValue");

  // Send response
  res.end("Hello World\n");
});

const PORT = 3000;
const HOST = "localhost";

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
```

#### 3. Using writeHead() Method

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  // Set status code and headers in one call
  res.writeHead(200, {
    "Content-Type": "text/html",
    "X-Powered-By": "Node.js",
  });

  res.end("<h1>Hello World</h1>");
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

### Handling Different Routes

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  const { url, method } = req;

  // Home route
  if (url === "/" && method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Home Page</h1>");
  }
  // About route
  else if (url === "/about" && method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>About Page</h1>");
  }
  // API route
  else if (url === "/api/data" && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "API Data", success: true }));
  }
  // 404 Not Found
  else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404 - Page Not Found</h1>");
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});
```

### Serving HTML Content

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>My Node.js Server</title>
      </head>
      <body>
        <h1>Welcome to Node.js</h1>
        <p>This is a simple HTTP server</p>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </body>
    </html>
  `;

  res.end(html);
});

server.listen(3000);
```

### Serving HTML File

```javascript
const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    const filePath = path.join(__dirname, "index.html");

    fs.readFile(filePath, "utf8", (err, content) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Server Error");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(content);
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(3000);
```

### Handling POST Requests

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/api/users" && req.method === "POST") {
    let body = "";

    // Collect data chunks
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    // When all data is received
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        console.log("Received:", data);

        // Send response
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
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(3000);
```

### Real-World Example: Complete Server

```javascript
const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  const { url, method } = req;

  console.log(`${method} ${url}`);

  // Home page
  if (url === "/" && method === "GET") {
    const filePath = path.join(__dirname, "public", "index.html");
    serveFile(filePath, "text/html", res);
  }
  // API endpoint
  else if (url === "/api/status" && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      })
    );
  }
  // Create resource
  else if (url === "/api/items" && method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const item = JSON.parse(body);
        // Process the item (save to database, etc.)

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Item created",
            item: item,
          })
        );
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid data" }));
      }
    });
  }
  // 404 Not Found
  else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404 - Page Not Found</h1>");
  }
});

// Helper function to serve files
function serveFile(filePath, contentType, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Server Error");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
```

### Serving Static Files

```javascript
const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  // Build file path
  let filePath = path.join(
    __dirname,
    "public",
    req.url === "/" ? "index.html" : req.url
  );

  // Get file extension
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
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };

  const contentType = contentTypes[extname] || "text/plain";

  // Read and serve file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        // File not found
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - File Not Found</h1>");
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(3000, () => {
  console.log("Static file server running on port 3000");
});
```

### URL Parsing with Query Parameters

```javascript
const http = require("http");
const url = require("url");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  if (pathname === "/search") {
    const searchTerm = query.q || "nothing";
    const page = query.page || 1;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        searchTerm: searchTerm,
        page: page,
        results: [],
      })
    );
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(3000);
// Visit: http://localhost:3000/search?q=nodejs&page=2
```

### Modern URL API

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  // Create URL object
  const baseURL = `http://${req.headers.host}`;
  const reqUrl = new URL(req.url, baseURL);

  const pathname = reqUrl.pathname;
  const searchParams = reqUrl.searchParams;

  if (pathname === "/api/users") {
    const name = searchParams.get("name");
    const age = searchParams.get("age");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        pathname: pathname,
        name: name,
        age: age,
      })
    );
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(3000);
// Visit: http://localhost:3000/api/users?name=John&age=30
```

### Server with Environment Variables

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || 3000,
      nodeVersion: process.version,
    })
  );
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
```

### Graceful Shutdown

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello World\n");
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n${signal} received, shutting down gracefully...`);

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

### Server with Error Handling

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  try {
    // Your route handling logic
    if (req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Hello World");
    } else if (req.url === "/error") {
      // Simulate an error
      throw new Error("Something went wrong!");
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Internal Server Error",
        message:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      })
    );
  }
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("Port is already in use");
  } else {
    console.error("Server error:", err);
  }
});

// Handle client errors
server.on("clientError", (err, socket) => {
  console.error("Client error:", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(3000);
```

### Simple REST API

```javascript
const http = require("http");

// In-memory data store
let users = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

const server = http.createServer((req, res) => {
  const { url, method } = req;

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS (preflight)
  if (method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET all users
  if (url === "/api/users" && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(users));
  }
  // GET user by ID
  else if (url.match(/\/api\/users\/\d+/) && method === "GET") {
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
  // CREATE user
  else if (url === "/api/users" && method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const newUser = JSON.parse(body);
        newUser.id = users.length + 1;
        users.push(newUser);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(newUser));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }
  // DELETE user
  else if (url.match(/\/api\/users\/\d+/) && method === "DELETE") {
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
  console.log("REST API server running on http://localhost:3000/");
  console.log("Endpoints:");
  console.log("  GET    /api/users");
  console.log("  GET    /api/users/:id");
  console.log("  POST   /api/users");
  console.log("  DELETE /api/users/:id");
});
```

### Server Configuration

```javascript
const http = require("http");

const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || "localhost",
  timeout: 30000, // 30 seconds
  maxHeaderSize: 16384, // 16KB
};

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Server with custom configuration\n");
});

// Set timeout
server.timeout = config.timeout;

// Set max header size
server.maxHeadersCount = 100;

server.listen(config.port, config.host, () => {
  console.log(`Server running at http://${config.host}:${config.port}/`);
  console.log(`Timeout: ${config.timeout}ms`);
});
```

### Key Concepts

```javascript
// 1. Request object properties
req.url; // '/api/users'
req.method; // 'GET', 'POST', etc.
req.headers; // { 'content-type': 'application/json' }
req.httpVersion; // '1.1'

// 2. Response object methods
res.statusCode = 200;
res.setHeader("Content-Type", "text/html");
res.writeHead(200, { "Content-Type": "text/html" });
res.write("chunk1");
res.write("chunk2");
res.end("final chunk");

// 3. Server methods
server.listen(port, [host], [callback]);
server.close([callback]);
server.setTimeout(msecs, [callback]);

// 4. Server events
server.on("request", (req, res) => {});
server.on("connection", (socket) => {});
server.on("close", () => {});
server.on("error", (err) => {});
```

### Best Practices

```javascript
// ✅ 1. Always set Content-Type
res.setHeader("Content-Type", "application/json");

// ✅ 2. Always call res.end()
res.end("Response body");

// ✅ 3. Handle errors
req.on("error", (err) => console.error(err));
res.on("error", (err) => console.error(err));

// ✅ 4. Use appropriate status codes
res.statusCode = 200; // OK
res.statusCode = 201; // Created
res.statusCode = 400; // Bad Request
res.statusCode = 404; // Not Found
res.statusCode = 500; // Server Error

// ✅ 5. Use environment variables
const PORT = process.env.PORT || 3000;

// ✅ 6. Implement graceful shutdown
process.on("SIGTERM", () => server.close());

// ✅ 7. Log requests
console.log(`${req.method} ${req.url}`);

// ✅ 8. Validate input
if (!data.email) {
  res.writeHead(400);
  res.end("Email required");
  return;
}

// ✅ 9. Set timeouts
server.timeout = 30000;

// ✅ 10. For production, use Express.js
// const express = require('express');
// const app = express();
```

### Key Takeaways

- ✅ Use `http.createServer()` to create a server
- ✅ The callback receives `req` (request) and `res` (response)
- ✅ Call `server.listen(port)` to start the server
- ✅ Always call `res.end()` to finish the response
- ✅ Set appropriate `Content-Type` headers
- ✅ Use `req.url` and `req.method` for routing
- ✅ Use `res.writeHead()` or `res.statusCode` for status codes
- ✅ For POST requests, collect body data with `req.on('data')` and `req.on('end')`
- ✅ Implement error handling with try/catch and error events
- ✅ For production apps, use frameworks like Express.js
- ✅ Implement graceful shutdown for production servers
- ✅ Use environment variables for configuration

### Further Reading

- [Node.js http module documentation](https://nodejs.org/api/http.html)
- [http.createServer() documentation](https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener)
- [Anatomy of an HTTP Transaction](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Express.js framework](https://expressjs.com/)
