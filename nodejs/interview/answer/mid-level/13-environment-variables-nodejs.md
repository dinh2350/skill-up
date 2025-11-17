# How do you handle environment variables in Node.js?

Environment variables are key-value pairs that exist in the operating system environment and can be accessed by Node.js applications. They are essential for configuration management, especially for storing sensitive data and environment-specific settings.

## Accessing Environment Variables

### 1. Using process.env

Node.js provides access to environment variables through the `process.env` object:

```javascript
// Access environment variables
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;

console.log(`Server will run on port: ${port}`);
console.log(`Database URL: ${dbUrl}`);
```

### 2. Setting Environment Variables

#### Command Line

```bash
# Set variables when running the application
PORT=8080 NODE_ENV=production node app.js

# Multiple variables
PORT=8080 DATABASE_URL=mongodb://localhost:27017/mydb API_KEY=your-key node app.js
```

#### Shell Export (Unix/Linux/macOS)

```bash
export PORT=8080
export NODE_ENV=production
export DATABASE_URL=mongodb://localhost:27017/mydb
node app.js
```

#### Windows Command Prompt

```cmd
set PORT=8080
set NODE_ENV=production
node app.js
```

#### Windows PowerShell

```powershell
$env:PORT = "8080"
$env:NODE_ENV = "production"
node app.js
```

## Using .env Files with dotenv

### Installation

```bash
npm install dotenv
```

### Creating .env file

Create a `.env` file in your project root:

```env
# .env file
PORT=3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/myapp
API_KEY=your-secret-api-key
JWT_SECRET=your-jwt-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Loading .env variables

```javascript
// Load environment variables as early as possible
require("dotenv").config();

// Or with ES6 modules (Node.js 14+)
import dotenv from "dotenv";
dotenv.config();

// Access the variables
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;
```

### Advanced dotenv configuration

```javascript
// Specify custom .env file path
require("dotenv").config({ path: "./config/.env" });

// Different .env files for different environments
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
require("dotenv").config({ path: envFile });

// Override existing environment variables
require("dotenv").config({ override: true });
```

## Best Practices

### 1. Environment-Specific Configuration

```javascript
// config/config.js
const config = {
  development: {
    port: process.env.PORT || 3000,
    database: {
      url:
        process.env.DEV_DATABASE_URL || "mongodb://localhost:27017/myapp-dev",
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    logLevel: "debug",
  },
  production: {
    port: process.env.PORT || 80,
    database: {
      url: process.env.DATABASE_URL,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: true,
      },
    },
    logLevel: "error",
  },
  test: {
    port: process.env.TEST_PORT || 3001,
    database: {
      url:
        process.env.TEST_DATABASE_URL || "mongodb://localhost:27017/myapp-test",
    },
    logLevel: "silent",
  },
};

const env = process.env.NODE_ENV || "development";
module.exports = config[env];
```

### 2. Validation and Type Conversion

```javascript
// utils/env.js
function getEnvVar(name, defaultValue, type = "string") {
  const value = process.env[name] || defaultValue;

  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`);
  }

  switch (type) {
    case "number":
      return Number(value);
    case "boolean":
      return value.toLowerCase() === "true";
    case "array":
      return value.split(",").map((item) => item.trim());
    default:
      return value;
  }
}

// Usage
const port = getEnvVar("PORT", 3000, "number");
const enableLogging = getEnvVar("ENABLE_LOGGING", false, "boolean");
const allowedOrigins = getEnvVar("ALLOWED_ORIGINS", "", "array");
```

### 3. Using a Configuration Schema

```javascript
// Using joi for validation
const Joi = require("joi");

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  API_KEY: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().required(),
}).unknown();

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = value;
```

## Security Considerations

### 1. Never commit .env files

```gitignore
# .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Use different .env files for different environments

```
.env.example         # Template file (committed)
.env                # Local development (not committed)
.env.production     # Production (not committed)
.env.test          # Testing (not committed)
```

### 3. Sanitize environment variables in logs

```javascript
// Don't log sensitive environment variables
const sanitizedEnv = Object.keys(process.env)
  .filter((key) => !key.includes("SECRET") && !key.includes("PASSWORD"))
  .reduce((obj, key) => {
    obj[key] = process.env[key];
    return obj;
  }, {});

console.log("Environment variables:", sanitizedEnv);
```

## Example: Complete Application Setup

```javascript
// app.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "API_KEY"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

// Configuration
const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  apiKey: process.env.API_KEY,
  nodeEnv: process.env.NODE_ENV || "development",
};

const app = express();

// Connect to database
mongoose.connect(config.databaseUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.listen(config.port, () => {
  console.log(
    `Server running on port ${config.port} in ${config.nodeEnv} mode`
  );
});
```

## Common Environment Variables

```env
# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/myapp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=username
DB_PASS=password

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-session-secret

# External APIs
API_KEY=your-api-key
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG...

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=us-west-2

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Feature Flags
ENABLE_LOGGING=true
ENABLE_ANALYTICS=false
MAINTENANCE_MODE=false
```

## Summary

Environment variables in Node.js are essential for:

- Configuration management across different environments
- Storing sensitive information securely
- Making applications portable and configurable
- Following the twelve-factor app methodology

Key points:

- Use `process.env` to access environment variables
- Use `dotenv` package for local development
- Validate and type-convert environment variables
- Never commit sensitive environment variables to version control
- Use different configuration files for different environments
- Implement proper error handling for missing required variables
