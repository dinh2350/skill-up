# What is the purpose of body-parser middleware?

Body-parser middleware is used to parse incoming request bodies in Express.js applications before your handlers process them. It extracts the request body from the HTTP request and makes it available under the `req.body` property. Body-parser handles different content types like JSON, URL-encoded form data, and raw data.

## What is Body-Parser?

Body-parser is middleware that:

- **Parses incoming request bodies** in various formats
- **Makes parsed data available** in `req.body`
- **Handles different content types** (JSON, form data, text, raw)
- **Provides size limits** for security
- **Offers encoding options** for internationalization

## Built-in Body Parsing in Express 4.16+

Since Express 4.16.0, body-parser functionality is built into Express itself, so you often don't need the separate `body-parser` package.

### Using Built-in Express Body Parsers

```javascript
const express = require("express");
const app = express();

// Parse JSON bodies (application/json)
app.use(
  express.json({
    limit: "10mb", // Maximum request body size
    strict: true, // Only parse objects and arrays
    type: "application/json", // Content-Type to parse
  })
);

// Parse URL-encoded bodies (application/x-www-form-urlencoded)
app.use(
  express.urlencoded({
    extended: true, // Use qs library for rich objects
    limit: "10mb", // Maximum request body size
    parameterLimit: 1000, // Maximum number of parameters
  })
);

// Parse raw bodies (for webhooks, binary data)
app.use(
  express.raw({
    limit: "5mb",
    type: "application/octet-stream",
  })
);

// Parse text bodies
app.use(
  express.text({
    limit: "1mb",
    type: "text/plain",
  })
);

// Example routes
app.post("/api/users", (req, res) => {
  // req.body will contain parsed JSON data
  console.log("JSON data:", req.body);
  res.json({ message: "User data received", data: req.body });
});

app.post("/form", (req, res) => {
  // req.body will contain parsed form data
  console.log("Form data:", req.body);
  res.json({ message: "Form submitted", data: req.body });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### Using the Separate body-parser Package

```javascript
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// JSON parser
app.use(
  bodyParser.json({
    limit: "10mb",
    strict: false,
    type: ["application/json", "application/csp-report"],
  })
);

// URL-encoded parser
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "10mb",
    parameterLimit: 1000,
  })
);

// Raw parser for specific content types
app.use(
  bodyParser.raw({
    limit: "5mb",
    type: "application/vnd.custom-type",
  })
);

// Text parser
app.use(
  bodyParser.text({
    limit: "1mb",
    type: "text/csv",
  })
);

app.post("/webhook", (req, res) => {
  // Handle raw webhook data
  console.log("Raw webhook data:", req.body);
  res.status(200).send("Webhook received");
});

app.listen(3000);
```

## Different Content Types

### JSON Data Parsing

```javascript
const express = require("express");
const app = express();

// Configure JSON parser with options
app.use(
  express.json({
    limit: "50mb",
    strict: true,
    type: ["application/json", "application/csp-report"],
    verify: (req, res, buf, encoding) => {
      // Optional verification function
      console.log("Received JSON data, size:", buf.length);
    },
  })
);

app.post("/api/data", (req, res) => {
  // Handle JSON data
  const { name, email, preferences } = req.body;

  console.log("Received data:", {
    name,
    email,
    preferences,
  });

  res.json({
    message: "JSON data processed successfully",
    receivedFields: Object.keys(req.body),
  });
});

// Example request body:
// {
//   "name": "John Doe",
//   "email": "john@example.com",
//   "preferences": {
//     "theme": "dark",
//     "notifications": true
//   }
// }

app.listen(3000);
```

### URL-Encoded Form Data

```javascript
const express = require("express");
const app = express();

// Configure URL-encoded parser
app.use(
  express.urlencoded({
    extended: true, // Use qs library for nested objects
    limit: "10mb",
    parameterLimit: 1000,
    type: "application/x-www-form-urlencoded",
  })
);

app.post("/contact", (req, res) => {
  // Handle form submission
  const { name, email, message, subscribe } = req.body;

  console.log("Form data received:", {
    name,
    email,
    message,
    subscribe: subscribe === "on", // checkbox handling
  });

  res.json({
    message: "Contact form submitted successfully",
    data: req.body,
  });
});

// Example form data:
// name=John+Doe&email=john%40example.com&message=Hello+World&subscribe=on

app.listen(3000);
```

### Raw Data Parsing

```javascript
const express = require("express");
const crypto = require("crypto");
const app = express();

// Configure raw parser for webhooks
app.use(
  "/webhooks",
  express.raw({
    limit: "1mb",
    type: "application/json",
  })
);

app.post("/webhooks/github", (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const payload = req.body;

  // Verify webhook signature
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).send("Unauthorized");
  }

  // Parse JSON manually from raw buffer
  const data = JSON.parse(payload.toString());

  console.log("GitHub webhook received:", {
    action: data.action,
    repository: data.repository?.name,
  });

  res.status(200).send("Webhook processed");
});

app.listen(3000);
```

## Advanced Body-Parser Configuration

### Conditional Body Parsing

```javascript
const express = require("express");
const app = express();

// Conditional JSON parsing based on content type
app.use(
  "/api",
  express.json({
    type: (req) => {
      // Only parse JSON for API routes
      return req.headers["content-type"] === "application/json";
    },
    limit: "1mb",
  })
);

// Different parsers for different routes
app.use("/forms", express.urlencoded({ extended: true }));
app.use("/webhooks", express.raw({ type: "application/json" }));

// Custom verification function
app.use(
  "/secure",
  express.json({
    verify: (req, res, buf, encoding) => {
      // Custom verification logic
      const signature = req.headers["x-signature"];
      if (!verifySignature(buf, signature)) {
        const error = new Error("Invalid signature");
        error.status = 400;
        throw error;
      }
    },
  })
);

function verifySignature(body, signature) {
  // Mock signature verification
  const expectedSignature = crypto
    .createHmac("sha256", process.env.SECRET_KEY)
    .update(body)
    .digest("hex");

  return signature === expectedSignature;
}

app.post("/api/data", (req, res) => {
  res.json({ received: req.body });
});

app.post("/forms/contact", (req, res) => {
  res.json({ formData: req.body });
});

app.post("/webhooks/payment", (req, res) => {
  res.status(200).send("OK");
});

app.listen(3000);
```

### Error Handling for Body Parsing

```javascript
const express = require("express");
const app = express();

// Body parser with error handling
app.use(
  express.json({
    limit: "1mb",
    strict: true,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

// Error handling middleware for body parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    // Handle JSON syntax errors
    console.error("Bad JSON:", err.message);
    return res.status(400).json({
      error: "Invalid JSON format",
      message: "Request body contains malformed JSON",
      details: {
        position: err.body?.indexOf?.(err.message) || "unknown",
        received: typeof req.body,
      },
    });
  }

  if (err.type === "entity.too.large") {
    // Handle payload too large errors
    return res.status(413).json({
      error: "Payload too large",
      message: "Request body exceeds size limit",
      maxSize: "1MB",
    });
  }

  if (err.type === "entity.parse.failed") {
    // Handle parsing errors
    return res.status(400).json({
      error: "Parse error",
      message: "Failed to parse request body",
      contentType: req.headers["content-type"],
    });
  }

  if (err.type === "charset.unsupported") {
    // Handle unsupported charset
    return res.status(415).json({
      error: "Unsupported charset",
      message: "Character encoding not supported",
    });
  }

  next(err);
});

app.post("/api/test", (req, res) => {
  res.json({
    message: "Data received successfully",
    body: req.body,
    contentType: req.headers["content-type"],
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred",
  });
});

app.listen(3000);
```

## Custom Body Parsers

### Creating Custom Middleware

```javascript
const express = require("express");
const app = express();

// Custom XML parser
const xmlParser = (options = {}) => {
  const { limit = "1mb", type = "application/xml" } = options;

  return (req, res, next) => {
    if (req.headers["content-type"] !== type) {
      return next();
    }

    let data = "";
    let size = 0;
    const maxSize = parseSize(limit);

    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);

      if (size > maxSize) {
        const err = new Error("Request body too large");
        err.status = 413;
        err.type = "entity.too.large";
        return next(err);
      }

      data += chunk;
    });

    req.on("end", () => {
      try {
        req.body = parseXML(data);
        next();
      } catch (error) {
        const err = new Error("Invalid XML format");
        err.status = 400;
        err.type = "entity.parse.failed";
        next(err);
      }
    });

    req.on("error", (error) => {
      next(error);
    });
  };
};

// Custom CSV parser
const csvParser = (options = {}) => {
  const { limit = "5mb", type = "text/csv" } = options;

  return (req, res, next) => {
    if (req.headers["content-type"] !== type) {
      return next();
    }

    let data = "";

    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        req.body = parseCSV(data);
        next();
      } catch (error) {
        const err = new Error("Invalid CSV format");
        err.status = 400;
        next(err);
      }
    });

    req.on("error", next);
  };
};

// Helper functions
function parseSize(size) {
  if (typeof size === "number") return size;
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) throw new Error("Invalid size format");
  return Math.floor(parseFloat(match[1]) * units[match[2]]);
}

function parseXML(xmlString) {
  // Simple XML parsing (use xml2js or similar in production)
  const tagPattern = /<(\w+)>([^<]+)<\/\1>/g;
  const result = {};
  let match;

  while ((match = tagPattern.exec(xmlString)) !== null) {
    result[match[1]] = match[2];
  }

  return result;
}

function parseCSV(csvString) {
  // Simple CSV parsing (use csv-parser in production)
  const lines = csvString.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || "";
      return obj;
    }, {});
  });

  return rows;
}

// Use custom parsers
app.use(xmlParser({ limit: "2mb" }));
app.use(csvParser({ limit: "5mb" }));

// Standard parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/xml", (req, res) => {
  console.log("XML data:", req.body);
  res.json({ message: "XML received", data: req.body });
});

app.post("/api/csv", (req, res) => {
  console.log("CSV data:", req.body);
  res.json({ message: "CSV received", rows: req.body.length });
});

app.post("/api/json", (req, res) => {
  console.log("JSON data:", req.body);
  res.json({ message: "JSON received", data: req.body });
});

app.listen(3000);
```

## Environment-Based Configuration

```javascript
const express = require("express");
const app = express();

// Environment-based body parser configuration
class BodyParserConfig {
  static getConfiguration() {
    const env = process.env.NODE_ENV || "development";

    const configs = {
      development: {
        json: {
          limit: "50mb",
          strict: false,
          type: ["application/json"],
        },
        urlencoded: {
          extended: true,
          limit: "50mb",
          parameterLimit: 2000,
        },
      },

      production: {
        json: {
          limit: "1mb",
          strict: true,
          type: ["application/json"],
        },
        urlencoded: {
          extended: true,
          limit: "1mb",
          parameterLimit: 100,
        },
      },

      test: {
        json: {
          limit: "10mb",
          strict: true,
          type: ["application/json"],
        },
        urlencoded: {
          extended: true,
          limit: "10mb",
          parameterLimit: 500,
        },
      },
    };

    return configs[env] || configs.development;
  }

  static applyMiddleware(app) {
    const config = this.getConfiguration();

    app.use(express.json(config.json));
    app.use(express.urlencoded(config.urlencoded));

    // Add security headers in production
    if (process.env.NODE_ENV === "production") {
      app.use((req, res, next) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        next();
      });
    }
  }
}

// Apply configuration
BodyParserConfig.applyMiddleware(app);

app.post("/api/data", (req, res) => {
  res.json({
    message: "Data received",
    environment: process.env.NODE_ENV,
    bodySize: JSON.stringify(req.body).length,
    data: req.body,
  });
});

app.listen(3000, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode`);
});
```

## Testing Body Parser Configuration

```javascript
// test/bodyParser.test.js
const request = require("supertest");
const express = require("express");

describe("Body Parser Configuration", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: true, limit: "1mb" }));

    app.post("/test", (req, res) => {
      res.json({ received: req.body });
    });

    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ error: err.message });
    });
  });

  describe("JSON Parsing", () => {
    test("should parse valid JSON", async () => {
      const data = { name: "John", age: 30 };

      const response = await request(app).post("/test").send(data).expect(200);

      expect(response.body.received).toEqual(data);
    });

    test("should reject malformed JSON", async () => {
      const response = await request(app)
        .post("/test")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(400);

      expect(response.body.error).toContain("JSON");
    });

    test("should reject oversized payloads", async () => {
      const largeData = { data: "x".repeat(2 * 1024 * 1024) }; // 2MB

      const response = await request(app)
        .post("/test")
        .send(largeData)
        .expect(413);

      expect(response.body.error).toContain("too large");
    });
  });

  describe("URL-encoded Parsing", () => {
    test("should parse form data", async () => {
      const response = await request(app)
        .post("/test")
        .type("form")
        .send("name=John&age=30")
        .expect(200);

      expect(response.body.received).toEqual({
        name: "John",
        age: "30",
      });
    });

    test("should parse nested objects with extended option", async () => {
      const response = await request(app)
        .post("/test")
        .type("form")
        .send("user[name]=John&user[age]=30")
        .expect(200);

      expect(response.body.received).toEqual({
        user: {
          name: "John",
          age: "30",
        },
      });
    });
  });
});
```

## Summary

### Key Body-Parser Functions:

1. **Request Parsing** - Converts raw request data into usable JavaScript objects
2. **Content-Type Handling** - Supports JSON, URL-encoded, raw, and text formats
3. **Size Limiting** - Prevents DoS attacks through payload size restrictions
4. **Error Handling** - Provides clear error messages for malformed data
5. **Custom Parsing** - Extensible for additional formats like XML, CSV

### Best Practices:

1. **Use built-in Express parsers** for most applications (Express 4.16+)
2. **Set appropriate size limits** to prevent memory exhaustion
3. **Implement comprehensive error handling** for parsing failures
4. **Use conditional parsing** for different routes when needed
5. **Validate parsed data** with additional validation middleware
6. **Consider security implications** of different parser configurations
7. **Test all parser configurations** thoroughly including edge cases

Body-parser middleware is essential for any Express.js application that needs to handle user input, forming the foundation for secure and robust request processing.
