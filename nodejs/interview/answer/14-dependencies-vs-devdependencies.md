# What is the difference between dependencies and devDependencies?

## Short Answer

**`dependencies`** are packages **required to run your application in production**, while **`devDependencies`** are packages **only needed for development and testing**.

```json
{
  "dependencies": {
    "express": "^4.18.2", // Needed in production
    "mongoose": "^7.0.0" // Needed in production
  },
  "devDependencies": {
    "jest": "^29.5.0", // Only for testing
    "nodemon": "^2.0.22" // Only for development
  }
}
```

**Key difference:**

- `npm install --production` installs **only** `dependencies` (not `devDependencies`)
- In production, you exclude `devDependencies` to reduce bundle size and security surface

## Detailed Answer

### Dependencies

Packages in `dependencies` are **required for your application to function** in any environment.

#### What Goes in dependencies

```json
{
  "dependencies": {
    // Web frameworks
    "express": "^4.18.2",
    "fastify": "^4.15.0",

    // Database clients
    "mongoose": "^7.0.0",
    "pg": "^8.10.0",

    // Utilities used at runtime
    "lodash": "^4.17.21",
    "moment": "^2.29.4",

    // Authentication
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",

    // Validation
    "joi": "^17.9.1",

    // HTTP client (if used in production)
    "axios": "^1.3.4"
  }
}
```

#### Installing as dependency

```bash
# Add to dependencies (default)
npm install express

# Explicit --save flag (unnecessary in npm 5+)
npm install express --save
```

#### When to Use dependencies

Use `dependencies` when the package is:

- ✅ Required for the application to run
- ✅ Used in production code
- ✅ Imported in your source files that run in production
- ✅ Needed by end users of your package

**Examples:**

```javascript
// src/server.js - Production code
const express = require("express"); // ✅ dependency
const mongoose = require("mongoose"); // ✅ dependency
const jwt = require("jsonwebtoken"); // ✅ dependency

const app = express();
// Application logic...
```

### devDependencies

Packages in `devDependencies` are **only needed during development** and are not required in production.

#### What Goes in devDependencies

```json
{
  "devDependencies": {
    // Testing frameworks
    "jest": "^29.5.0",
    "mocha": "^10.2.0",
    "chai": "^4.3.7",
    "supertest": "^6.3.3",

    // Build tools
    "webpack": "^5.76.0",
    "babel": "^7.21.0",
    "typescript": "^5.0.0",

    // Linters
    "eslint": "^8.38.0",
    "prettier": "^2.8.7",

    // Development servers
    "nodemon": "^2.0.22",
    "ts-node-dev": "^2.0.0",

    // Type definitions
    "@types/node": "^18.15.11",
    "@types/express": "^4.17.17",

    // Documentation
    "jsdoc": "^4.0.2",

    // Git hooks
    "husky": "^8.0.3"
  }
}
```

#### Installing as devDependency

```bash
# Add to devDependencies
npm install --save-dev jest
npm install -D jest  # Shorthand

# Multiple packages
npm install -D jest eslint prettier
```

#### When to Use devDependencies

Use `devDependencies` when the package is:

- ✅ Used only during development
- ✅ Testing tools and frameworks
- ✅ Build and compilation tools
- ✅ Linters and formatters
- ✅ Development servers
- ✅ Type definitions
- ✅ Not needed in production bundle

**Examples:**

```javascript
// test/app.test.js - Test code (not in production)
const request = require("supertest"); // ✅ devDependency
const { expect } = require("chai"); // ✅ devDependency

// Development only
// package.json scripts use these
```

### Side-by-Side Comparison

| Feature                 | dependencies              | devDependencies       |
| ----------------------- | ------------------------- | --------------------- |
| **Purpose**             | Runtime requirements      | Development tools     |
| **Install in prod**     | ✅ Yes                    | ❌ No                 |
| **Install in dev**      | ✅ Yes                    | ✅ Yes                |
| **npm install**         | ✅ Installed              | ✅ Installed          |
| **npm ci --production** | ✅ Installed              | ❌ Skipped            |
| **Used in code**        | Production code           | Tests, build scripts  |
| **Bundle size impact**  | High                      | None (excluded)       |
| **Examples**            | express, mongoose, lodash | jest, eslint, webpack |

### Installation Behavior

#### Development Environment

```bash
# Install all dependencies (dependencies + devDependencies)
npm install
```

**Result:**

```
node_modules/
├── express/         # dependency
├── mongoose/        # dependency
├── jest/            # devDependency
├── eslint/          # devDependency
└── ...
```

#### Production Environment

```bash
# Install only dependencies (skip devDependencies)
npm install --production

# Or
NODE_ENV=production npm install

# Or (CI/CD recommended)
npm ci --production
```

**Result:**

```
node_modules/
├── express/         # dependency
├── mongoose/        # dependency
└── ...
# jest/ and eslint/ NOT installed
```

### Real-World Example

#### Complete package.json

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "Example Node.js application",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "lint": "eslint .",
    "build": "webpack"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "joi": "^17.9.1",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "eslint": "^8.38.0",
    "prettier": "^2.8.7",
    "@types/node": "^18.15.11",
    "@types/express": "^4.17.17",
    "webpack": "^5.76.0"
  }
}
```

#### Production Code (uses dependencies)

```javascript
// src/server.js - Deployed to production
const express = require("express"); // dependency
const mongoose = require("mongoose"); // dependency
const jwt = require("jsonwebtoken"); // dependency
const cors = require("cors"); // dependency
require("dotenv").config(); // dependency

const app = express();

app.use(cors());
app.use(express.json());

// Application routes...

mongoose.connect(process.env.MONGODB_URI);

app.listen(3000);
```

#### Development Code (uses devDependencies)

```javascript
// test/app.test.js - NOT deployed to production
const request = require("supertest"); // devDependency
const app = require("../src/server");

describe("API Tests", () => {
  test("GET / should return 200", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });
});
```

### Size and Security Impact

#### With devDependencies (Development)

```bash
npm install
du -sh node_modules
# 500 MB (includes testing, build tools, etc.)
```

**Package count:**

```bash
npm list --all
# 1,500 packages (dependencies + devDependencies + their dependencies)
```

#### Without devDependencies (Production)

```bash
npm ci --production
du -sh node_modules
# 200 MB (only runtime requirements)
```

**Package count:**

```bash
npm list --all
# 500 packages (only dependencies + their dependencies)
```

**Benefits:**

- ✅ 60% smaller bundle size
- ✅ Faster deployment
- ✅ Reduced security surface (fewer packages to audit)
- ✅ Lower memory usage

### Docker Example

#### Multi-stage Build (Best Practice)

```dockerfile
# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build (uses devDependencies like webpack, typescript)
RUN npm run build

# Stage 2: Production
FROM node:18-slim
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Run application
CMD ["node", "dist/server.js"]
```

**Result:**

- Build stage: Has devDependencies (webpack, TypeScript, etc.)
- Production stage: Only has dependencies (express, mongoose, etc.)
- Final image: Smaller, faster, more secure

### Common Mistakes

#### ❌ Mistake 1: Putting Test Framework in dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "jest": "^29.5.0" // ❌ Wrong! Should be devDependency
  }
}
```

**Why wrong:** Jest is not needed in production, increases bundle size.

**Fix:**

```json
{
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.5.0" // ✅ Correct
  }
}
```

#### ❌ Mistake 2: Putting Runtime Library in devDependencies

```json
{
  "devDependencies": {
    "express": "^4.18.2" // ❌ Wrong! Needed in production
  }
}
```

**Why wrong:** Production build will fail - express not installed.

**Fix:**

```json
{
  "dependencies": {
    "express": "^4.18.2" // ✅ Correct
  }
}
```

#### ❌ Mistake 3: Type Definitions in dependencies

```json
{
  "dependencies": {
    "@types/node": "^18.15.11", // ❌ Wrong!
    "@types/express": "^4.17.17" // ❌ Wrong!
  }
}
```

**Why wrong:** Type definitions are only used by TypeScript compiler (development tool).

**Fix:**

```json
{
  "devDependencies": {
    "@types/node": "^18.15.11", // ✅ Correct
    "@types/express": "^4.17.17" // ✅ Correct
  }
}
```

#### ❌ Mistake 4: Nodemon in dependencies

```json
{
  "dependencies": {
    "nodemon": "^2.0.22" // ❌ Wrong! Only for development
  }
}
```

**Why wrong:** Nodemon is a development server, not needed in production.

**Fix:**

```json
{
  "devDependencies": {
    "nodemon": "^2.0.22" // ✅ Correct
  },
  "scripts": {
    "start": "node src/server.js", // Production
    "dev": "nodemon src/server.js" // Development
  }
}
```

### How to Decide: dependencies vs devDependencies

Use this decision tree:

```
Is the package imported/required in production code?
├── YES → dependencies
│   └── Example: require('express') in src/server.js
│
└── NO → Check further
    ├── Used only in tests?
    │   └── YES → devDependencies (jest, mocha, chai)
    │
    ├── Used only during build/compilation?
    │   └── YES → devDependencies (webpack, babel, typescript)
    │
    ├── Used only for linting/formatting?
    │   └── YES → devDependencies (eslint, prettier)
    │
    ├── Used only in development server?
    │   └── YES → devDependencies (nodemon, ts-node-dev)
    │
    └── Type definitions for TypeScript?
        └── YES → devDependencies (@types/*)
```

### Special Cases

#### Case 1: CLI Tools

```json
{
  "dependencies": {
    // If your package IS a CLI tool
    "commander": "^10.0.0"
  },
  "devDependencies": {
    // If you USE a CLI tool for development
    "eslint": "^8.38.0"
  }
}
```

#### Case 2: Type Definitions

```json
{
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    // Always devDependency (only for TypeScript compiler)
    "@types/express": "^4.17.17",
    "@types/node": "^18.15.11"
  }
}
```

#### Case 3: Build Output

If you bundle your application (webpack, rollup), external dependencies still need to be in `dependencies`:

```json
{
  "dependencies": {
    // Still needed at runtime (not bundled)
    "mongoose": "^7.0.0"
  },
  "devDependencies": {
    // Bundler (creates bundle.js)
    "webpack": "^5.76.0"
  }
}
```

#### Case 4: Monorepo/Workspace

```json
{
  "dependencies": {
    // Shared library (published)
    "@mycompany/shared": "^1.0.0"
  },
  "devDependencies": {
    // Development tool (not published)
    "@mycompany/build-tools": "^1.0.0"
  }
}
```

### Package.json Scripts Context

```json
{
  "scripts": {
    "start": "node src/server.js", // Uses dependencies
    "dev": "nodemon src/server.js", // Uses devDependencies
    "test": "jest", // Uses devDependencies
    "lint": "eslint .", // Uses devDependencies
    "build": "webpack" // Uses devDependencies
  }
}
```

**In production:**

- Only `npm start` is run
- Only `dependencies` are installed
- Scripts using `devDependencies` won't work (that's OK!)

### peerDependencies and optionalDependencies

#### peerDependencies

Packages that your library expects the consumer to install:

```json
{
  "name": "my-react-component",
  "peerDependencies": {
    "react": "^18.0.0", // Consumer must install
    "react-dom": "^18.0.0" // Consumer must install
  },
  "devDependencies": {
    "react": "^18.0.0", // For development/testing
    "react-dom": "^18.0.0" // For development/testing
  }
}
```

#### optionalDependencies

Packages that enhance functionality but aren't required:

```json
{
  "dependencies": {
    "chokidar": "^3.5.3"
  },
  "optionalDependencies": {
    "fsevents": "^2.3.2" // Mac-only optimization (optional)
  }
}
```

### CI/CD Best Practices

#### GitHub Actions

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      # Install ALL dependencies (dev + prod)
      - run: npm ci

      # Run tests (needs devDependencies)
      - run: npm test

      # Lint (needs devDependencies)
      - run: npm run lint

  deploy:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      # Install ONLY production dependencies
      - run: npm ci --production

      # Deploy
      - run: npm run deploy
```

### Best Practices

```bash
# ✅ 1. Install runtime dependencies correctly
npm install express mongoose

# ✅ 2. Install dev dependencies correctly
npm install -D jest eslint nodemon

# ✅ 3. In production, skip devDependencies
npm ci --production

# ✅ 4. Check what will be installed
npm list --depth=0
npm list --dev --depth=0

# ✅ 5. Audit both types
npm audit
npm audit --production

# ✅ 6. Review package.json regularly
# Move misplaced packages to correct section

# ✅ 7. Document why each package is needed
{
  "dependencies": {
    "express": "^4.18.2"      // Web framework
  },
  "devDependencies": {
    "jest": "^29.5.0"         // Testing framework
  }
}
```

### Key Takeaways

- ✅ **`dependencies`** = Required in production (runtime)
- ✅ **`devDependencies`** = Only needed for development/testing
- ✅ Use `npm install package` for dependencies
- ✅ Use `npm install -D package` for devDependencies
- ✅ Production installs skip devDependencies (`npm ci --production`)
- ✅ Excluding devDependencies reduces bundle size by 50-70%
- ✅ Test frameworks, linters, build tools → devDependencies
- ✅ Express, database clients, runtime utilities → dependencies
- ✅ Type definitions (`@types/*`) → devDependencies
- ✅ Development servers (nodemon) → devDependencies
- ✅ Always check: "Is this package imported in production code?"
- ✅ When in doubt: If it's used in `src/`, it's probably a dependency

### Further Reading

- [npm dependencies documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#dependencies)
- [npm devDependencies documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#devdependencies)
- [Understanding package.json](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [Production best practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Semantic Versioning](https://semver.org/)
