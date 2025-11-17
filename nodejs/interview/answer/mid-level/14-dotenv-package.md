# What is the `dotenv` package?

The `dotenv` package is a zero-dependency Node.js module that loads environment variables from a `.env` file into `process.env`. It's one of the most popular packages for managing environment variables in Node.js applications during development.

## What is dotenv?

`dotenv` is a lightweight package that:

- Reads key-value pairs from a `.env` file
- Loads them into Node.js `process.env` object
- Provides a simple way to separate configuration from code
- Follows the principles of the twelve-factor app methodology

## Installation

```bash
# Using npm
npm install dotenv

# Using yarn
yarn add dotenv

# Using pnpm
pnpm add dotenv
```

## Basic Usage

### 1. Create a .env file

Create a `.env` file in your project root:

```env
# .env
PORT=3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/myapp
API_KEY=your-secret-api-key
JWT_SECRET=super-secret-jwt-key
```

### 2. Load the .env file

```javascript
// Load dotenv at the very beginning of your application
require("dotenv").config();

// Now you can access the variables
console.log(process.env.PORT); // 3000
console.log(process.env.NODE_ENV); // development
console.log(process.env.DATABASE_URL); // mongodb://localhost:27017/myapp
```

### 3. ES6 Modules syntax

```javascript
// For ES6 modules
import dotenv from "dotenv";
dotenv.config();

// Or using import syntax (Node.js 20.6.0+)
import "dotenv/config";
```

## Advanced Configuration Options

### 1. Custom .env file path

```javascript
// Load from a custom path
require("dotenv").config({ path: "./config/.env" });

// Load different files based on environment
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

require("dotenv").config({ path: envFile });
```

### 2. Override existing environment variables

```javascript
// By default, dotenv won't override existing environment variables
// Use override: true to change this behavior
require("dotenv").config({ override: true });
```

### 3. Encoding specification

```javascript
// Specify encoding for the .env file
require("dotenv").config({ encoding: "utf8" });
```

### 4. Debug mode

```javascript
// Enable debug mode to see which .env file is loaded
require("dotenv").config({ debug: process.env.DEBUG });
```

### 5. Preload with Node.js

```bash
# Preload dotenv when starting your application
node -r dotenv/config your_script.js

# With custom path
node -r dotenv/config your_script.js dotenv_config_path=/custom/path/to/.env
```

## Different Environment Files

### File naming convention

```
.env                # Default environment variables
.env.local          # Local overrides (not committed to git)
.env.development    # Development environment
.env.test          # Test environment
.env.production    # Production environment
```

### Loading priority example

```javascript
// config/env.js
const path = require("path");

// Load environment-specific .env file
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
const envPath = path.resolve(process.cwd(), envFile);

// Load default .env first
require("dotenv").config();

// Then load environment-specific file (will override defaults)
require("dotenv").config({ path: envPath });

console.log(`Loaded environment: ${process.env.NODE_ENV || "development"}`);
```

## .env File Syntax and Rules

### Basic syntax

```env
# Comments start with #
# This is a comment

# Basic key-value pairs
PORT=3000
HOST=localhost

# No spaces around the equals sign
DATABASE_URL=mongodb://localhost:27017/myapp

# Values with spaces (no quotes needed)
APP_NAME=My Amazing Application

# Empty values
EMPTY_VALUE=

# Values with special characters
PASSWORD=my@password#123

# Multi-line values (use quotes)
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----"
```

### Variable expansion (dotenv-expand)

For variable expansion, you need the `dotenv-expand` package:

```bash
npm install dotenv dotenv-expand
```

```env
# .env with variable expansion
API_HOST=localhost
API_PORT=3000
API_URL=http://${API_HOST}:${API_PORT}/api

# Default values
DATABASE_HOST=${DB_HOST:-localhost}
DATABASE_PORT=${DB_PORT:-5432}
```

```javascript
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);
```

## Best Practices

### 1. .env file structure

```env
# .env.example (template file - commit this to git)
# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# Database Configuration
DATABASE_URL=your_database_url_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASS=your_password

# Authentication
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# External APIs
STRIPE_SECRET_KEY=your_stripe_secret_key
SENDGRID_API_KEY=your_sendgrid_api_key

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
```

### 2. Gitignore configuration

```gitignore
# .gitignore
.env
.env.local
.env.production
.env.*.local

# But include the example file
!.env.example
```

### 3. Validation and error handling

```javascript
// config/validateEnv.js
require("dotenv").config();

const requiredEnvVars = ["PORT", "DATABASE_URL", "JWT_SECRET", "API_KEY"];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach((envVar) => {
    console.error(`   - ${envVar}`);
  });
  console.error(
    "\n📝 Please check your .env file or environment configuration."
  );
  process.exit(1);
}

console.log("✅ All required environment variables are present");
```

### 4. Type conversion and validation

```javascript
// utils/env.js
require("dotenv").config();

function getEnvVar(name, defaultValue, type = "string") {
  const value = process.env[name];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required but not defined`);
  }

  switch (type) {
    case "number":
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(
          `Environment variable ${name} must be a number, got: ${value}`
        );
      }
      return num;

    case "boolean":
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
      throw new Error(
        `Environment variable ${name} must be 'true' or 'false', got: ${value}`
      );

    case "array":
      return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

    case "url":
      try {
        new URL(value);
        return value;
      } catch (error) {
        throw new Error(
          `Environment variable ${name} must be a valid URL, got: ${value}`
        );
      }

    default:
      return value;
  }
}

// Export validated configuration
module.exports = {
  port: getEnvVar("PORT", 3000, "number"),
  host: getEnvVar("HOST", "localhost"),
  nodeEnv: getEnvVar("NODE_ENV", "development"),
  databaseUrl: getEnvVar("DATABASE_URL", null, "url"),
  jwtSecret: getEnvVar("JWT_SECRET"),
  enableLogging: getEnvVar("ENABLE_LOGGING", true, "boolean"),
  allowedOrigins: getEnvVar(
    "ALLOWED_ORIGINS",
    "http://localhost:3000",
    "array"
  ),
};
```

## Alternative Packages

### 1. dotenv-safe

Ensures all required environment variables are defined:

```bash
npm install dotenv-safe
```

```javascript
require("dotenv-safe").config({
  allowEmptyValues: true,
  example: ".env.example",
});
```

### 2. dotenv-flow

Supports multiple .env files with priority:

```bash
npm install dotenv-flow
```

```javascript
require("dotenv-flow").config();
// Loads .env, .env.local, .env.development, .env.development.local
```

### 3. envalid

Environment variable validation:

```bash
npm install envalid dotenv
```

```javascript
const { cleanEnv, str, num, bool, port } = require("envalid");

require("dotenv").config();

const env = cleanEnv(process.env, {
  PORT: port({ default: 3000 }),
  HOST: str({ default: "localhost" }),
  DATABASE_URL: str(),
  NODE_ENV: str({ choices: ["development", "test", "production"] }),
  ENABLE_LOGGING: bool({ default: false }),
});

module.exports = env;
```

## Complete Application Example

```javascript
// app.js
const express = require("express");
const mongoose = require("mongoose");

// Load environment variables first
require("dotenv").config();

// Validate required environment variables
const requiredVars = ["DATABASE_URL", "JWT_SECRET"];
const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("Missing required environment variables:", missingVars);
  process.exit(1);
}

// Configuration object
const config = {
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || "localhost",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ],
};

const app = express();

// Database connection
mongoose
  .connect(config.databaseUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to database"))
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "API is running",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(config.port, config.host, () => {
  console.log(`🚀 Server running on http://${config.host}:${config.port}`);
  console.log(`📦 Environment: ${config.nodeEnv}`);
});
```

## Common Pitfalls and Solutions

### 1. Loading dotenv too late

```javascript
// ❌ Wrong - other modules might load before dotenv
const express = require("express");
const config = require("./config"); // This might use process.env before dotenv loads
require("dotenv").config();

// ✅ Correct - load dotenv first
require("dotenv").config();
const express = require("express");
const config = require("./config");
```

### 2. Committing .env files to git

```bash
# Always add .env to .gitignore
echo ".env" >> .gitignore
```

### 3. Not providing default values

```javascript
// ❌ Might break if PORT is not defined
const port = process.env.PORT;

// ✅ Provide sensible defaults
const port = process.env.PORT || 3000;
```

### 4. Type issues

```javascript
// ❌ PORT will be a string, not a number
app.listen(process.env.PORT);

// ✅ Convert to number
app.listen(parseInt(process.env.PORT) || 3000);
```

## Summary

The `dotenv` package is essential for:

- **Environment Configuration**: Managing different configurations for development, testing, and production
- **Security**: Keeping sensitive information out of source code
- **Portability**: Making applications easily deployable across different environments
- **Developer Experience**: Simplifying local development setup
- **Twelve-Factor App**: Following best practices for configuration management

Key benefits:

- Zero dependencies and lightweight
- Simple API and easy to use
- Wide ecosystem support
- Follows established conventions
- Great for local development and CI/CD pipelines

The `dotenv` package is a fundamental tool in the Node.js ecosystem that every developer should understand and use properly.
