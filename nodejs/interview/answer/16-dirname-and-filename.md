# What is `__dirname` and `__filename`?

## Short Answer

`__dirname` and `__filename` are **magic variables** available in every Node.js module that provide:

- **`__dirname`** - The **absolute path** to the directory containing the current file
- **`__filename`** - The **absolute path** to the current file (including the filename)

```javascript
// /Users/john/projects/my-app/src/server.js

console.log(__dirname); // /Users/john/projects/my-app/src
console.log(__filename); // /Users/john/projects/my-app/src/server.js

// Very useful for building file paths
const path = require("path");
const configPath = path.join(__dirname, "config", "database.json");
// Result: /Users/john/projects/my-app/src/config/database.json
```

**Note:** These are **NOT available in ES modules** (.mjs or "type": "module"). Use `import.meta.url` instead.

## Detailed Answer

### What are `__dirname` and `__filename`?

They are **local variables** injected into every CommonJS module by Node.js.

#### How Node.js Injects Them

Node.js wraps your module code in a function:

```javascript
// Your code:
console.log(__dirname);
console.log(__filename);

// What Node.js actually runs:
(function (exports, require, module, __filename, __dirname) {
  console.log(__dirname); // Passed as parameter!
  console.log(__filename); // Passed as parameter!
});
```

### `__dirname` - Directory Name

The absolute path to the **directory** containing the current file.

#### Basic Usage

```javascript
// File: /Users/john/projects/my-app/src/utils/helper.js

console.log(__dirname);
// Output: /Users/john/projects/my-app/src/utils

// Note: No trailing slash
console.log(__dirname[__dirname.length - 1]); // 's' (not '/')
```

#### Different Files, Different Values

```javascript
// File: /Users/john/projects/my-app/server.js
console.log(__dirname); // /Users/john/projects/my-app

// File: /Users/john/projects/my-app/src/routes/users.js
console.log(__dirname); // /Users/john/projects/my-app/src/routes

// File: /Users/john/projects/my-app/test/unit/auth.test.js
console.log(__dirname); // /Users/john/projects/my-app/test/unit
```

#### Platform Differences

```javascript
// macOS / Linux
console.log(__dirname);
// /Users/john/projects/my-app/src

// Windows
console.log(__dirname);
// C:\Users\john\projects\my-app\src

// Always use path.join() for cross-platform compatibility!
```

### `__filename` - File Name

The absolute path to the **current file** (including directory and filename).

#### Basic Usage

```javascript
// File: /Users/john/projects/my-app/src/server.js

console.log(__filename);
// Output: /Users/john/projects/my-app/src/server.js

// Extract just the filename
const path = require("path");
console.log(path.basename(__filename)); // server.js

// Extract just the directory (same as __dirname)
console.log(path.dirname(__filename)); // /Users/john/projects/my-app/src
```

#### Getting File Information

```javascript
const path = require("path");

// Current file: /Users/john/projects/my-app/src/utils/helper.js

console.log(__filename); // Full path
console.log(path.basename(__filename)); // helper.js
console.log(path.extname(__filename)); // .js
console.log(path.dirname(__filename)); // /Users/john/projects/my-app/src/utils
console.log(path.basename(__filename, ".js")); // helper (without extension)
```

### Common Use Cases

#### 1. Building File Paths

```javascript
const path = require("path");

// Read a config file relative to current file
const configPath = path.join(__dirname, "config", "database.json");
// Result: /current/directory/config/database.json

// Read a file in parent directory
const envPath = path.join(__dirname, "..", ".env");
// Result: /parent/directory/.env

// Build public assets path
const publicPath = path.join(__dirname, "..", "public", "images");
// Result: /parent/directory/public/images
```

#### 2. Loading Files

```javascript
const fs = require("fs");
const path = require("path");

// Read a template file
const templatePath = path.join(__dirname, "templates", "email.html");
const template = fs.readFileSync(templatePath, "utf8");

// Load JSON configuration
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Load image
const imagePath = path.join(__dirname, "assets", "logo.png");
const imageBuffer = fs.readFileSync(imagePath);
```

#### 3. Serving Static Files (Express.js)

```javascript
const express = require("express");
const path = require("path");

const app = express();

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Send HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
```

#### 4. Database Migrations

```javascript
const path = require("path");

module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: path.join(__dirname, "dev.sqlite3"),
    },
    migrations: {
      directory: path.join(__dirname, "migrations"),
    },
    seeds: {
      directory: path.join(__dirname, "seeds"),
    },
  },
};
```

#### 5. Loading Environment Variables

```javascript
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

console.log(process.env.DATABASE_URL);
```

#### 6. Module Resolution

```javascript
const path = require("path");

// Load a module from a specific path
const helperPath = path.join(__dirname, "utils", "helper.js");
const helper = require(helperPath);

// Load all files in a directory
const fs = require("fs");
const routesDir = path.join(__dirname, "routes");
const routeFiles = fs.readdirSync(routesDir);

routeFiles.forEach((file) => {
  if (file.endsWith(".js")) {
    const routePath = path.join(routesDir, file);
    const route = require(routePath);
    // Use route...
  }
});
```

### Real-World Examples

#### Example 1: Project Structure Navigation

```javascript
const path = require("path");

// Current file: /project/src/controllers/users.js

// Get project root (2 levels up from controllers)
const projectRoot = path.join(__dirname, "..", "..");
// Result: /project

// Access different directories
const modelsDir = path.join(projectRoot, "src", "models");
const viewsDir = path.join(projectRoot, "src", "views");
const publicDir = path.join(projectRoot, "public");
const uploadsDir = path.join(projectRoot, "uploads");

console.log("Project root:", projectRoot);
console.log("Models dir:", modelsDir);
console.log("Views dir:", viewsDir);
```

#### Example 2: Logger with File Information

```javascript
const path = require("path");

function log(message) {
  const timestamp = new Date().toISOString();
  const filename = path.basename(__filename);
  console.log(`[${timestamp}] [${filename}] ${message}`);
}

// Usage
log("User logged in");
// Output: [2025-11-16T10:30:00.000Z] [server.js] User logged in
```

#### Example 3: Dynamic Route Loading

```javascript
// routes/index.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Load all route files in current directory
const routeFiles = fs.readdirSync(__dirname);

routeFiles.forEach((file) => {
  if (file !== "index.js" && file.endsWith(".js")) {
    const routePath = path.join(__dirname, file);
    const route = require(routePath);

    // Get route name from filename
    const routeName = path.basename(file, ".js");
    router.use(`/${routeName}`, route);

    console.log(`Loaded route: /${routeName}`);
  }
});

module.exports = router;
```

#### Example 4: Configuration Management

```javascript
// config/index.js
const path = require("path");
const fs = require("fs");

// Get environment
const env = process.env.NODE_ENV || "development";

// Load environment-specific config
const configFile = path.join(__dirname, `${env}.json`);

if (!fs.existsSync(configFile)) {
  throw new Error(`Config file not found: ${configFile}`);
}

const config = JSON.parse(fs.readFileSync(configFile, "utf8"));

// Add computed paths
config.paths = {
  root: path.join(__dirname, ".."),
  public: path.join(__dirname, "..", "public"),
  uploads: path.join(__dirname, "..", "uploads"),
  logs: path.join(__dirname, "..", "logs"),
};

module.exports = config;
```

#### Example 5: File Upload Handler

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

const app = express();

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    filename: req.file.filename,
    path: req.file.path,
  });
});
```

### `__dirname` vs `process.cwd()`

These are **different** and often confused!

```javascript
// Assume current file: /Users/john/projects/my-app/src/server.js
// Assume running from: /Users/john/projects/my-app

console.log(__dirname); // /Users/john/projects/my-app/src
console.log(process.cwd()); // /Users/john/projects/my-app

// __dirname: Directory of the CURRENT FILE
// process.cwd(): Directory where you RAN the command
```

#### Example Showing the Difference

```javascript
// File: /project/src/utils/helper.js

const path = require("path");

console.log("__dirname:", __dirname);
// Always: /project/src/utils

console.log("process.cwd():", process.cwd());
// Depends on where you run the command

// Run from /project:
// node src/utils/helper.js
// Output: /project

// Run from /project/src:
// node utils/helper.js
// Output: /project/src

// Run from /project/src/utils:
// node helper.js
// Output: /project/src/utils
```

#### When to Use Which

```javascript
// Use __dirname for:
// - Loading files relative to current module
const config = require(path.join(__dirname, "config.json"));

// Use process.cwd() for:
// - Loading files relative to project root
const packageJson = require(path.join(process.cwd(), "package.json"));

// Best practice: Use __dirname most of the time
```

### ES Modules (import.meta.url)

`__dirname` and `__filename` are **NOT available** in ES modules. Use `import.meta.url` instead.

#### Converting to ES Module Equivalent

```javascript
// CommonJS (works)
console.log(__dirname);
console.log(__filename);

// ES Module (doesn't work!)
// console.log(__dirname);     // ReferenceError
// console.log(__filename);    // ReferenceError

// ES Module (correct way)
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname); // Works!
console.log(__filename); // Works!
```

#### Complete ES Module Example

```javascript
// server.mjs (ES module)
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Now you can use them like in CommonJS
const configPath = join(__dirname, "config", "database.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

console.log("Config loaded from:", configPath);
```

#### Helper for ES Modules

```javascript
// fileURLHelper.js
import { fileURLToPath } from "url";
import { dirname } from "path";

export function getDirname(importMetaUrl) {
  return dirname(fileURLToPath(importMetaUrl));
}

export function getFilename(importMetaUrl) {
  return fileURLToPath(importMetaUrl);
}

// Usage in other files
import { getDirname } from "./fileURLHelper.js";
const __dirname = getDirname(import.meta.url);
```

### Path Manipulation with `__dirname`

```javascript
const path = require("path");

// Current file: /Users/john/projects/my-app/src/controllers/users.js

// Join paths (recommended)
path.join(__dirname, "views", "user.html");
// Result: /Users/john/projects/my-app/src/controllers/views/user.html

// Go up one directory
path.join(__dirname, "..", "models", "user.js");
// Result: /Users/john/projects/my-app/src/models/user.js

// Go up two directories
path.join(__dirname, "..", "..", "public", "css", "style.css");
// Result: /Users/john/projects/my-app/public/css/style.css

// Resolve (creates absolute path)
path.resolve(__dirname, "config.json");
// Result: /Users/john/projects/my-app/src/controllers/config.json

// Normalize (cleans up path)
path.normalize(path.join(__dirname, "..", "..", "src", "models"));
// Result: /Users/john/projects/my-app/src/models
```

### Security Considerations

```javascript
const path = require("path");
const express = require("express");

const app = express();

// ❌ Dangerous: User input in path
app.get("/file/:filename", (req, res) => {
  const filePath = path.join(__dirname, req.params.filename);
  // User could request: ../../../etc/passwd
  res.sendFile(filePath);
});

// ✅ Safe: Validate and sanitize
app.get("/file/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, "public", filename);

  // Ensure path is within public directory
  if (!filePath.startsWith(path.join(__dirname, "public"))) {
    return res.status(403).send("Access denied");
  }

  res.sendFile(filePath);
});
```

### Common Patterns

#### Pattern 1: Get Project Root

```javascript
const path = require("path");

// Method 1: Relative to current file
const projectRoot = path.join(__dirname, "..", "..");

// Method 2: Using process.cwd() (if running from root)
const projectRoot = process.cwd();

// Method 3: Find package.json (most reliable)
function findProjectRoot(startPath = __dirname) {
  const fs = require("fs");
  let currentPath = startPath;

  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, "package.json"))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  throw new Error("Could not find project root");
}

const projectRoot = findProjectRoot();
```

#### Pattern 2: Create Directory Structure

```javascript
const fs = require("fs");
const path = require("path");

// Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Create uploads directory
const uploadsDir = path.join(__dirname, "..", "uploads");
ensureDir(uploadsDir);

// Create logs directory
const logsDir = path.join(__dirname, "..", "logs");
ensureDir(logsDir);
```

#### Pattern 3: Dynamic Module Loading

```javascript
const fs = require("fs");
const path = require("path");

function loadModules(directory) {
  const modules = {};
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    if (file.endsWith(".js") && file !== "index.js") {
      const moduleName = path.basename(file, ".js");
      const modulePath = path.join(directory, file);
      modules[moduleName] = require(modulePath);
    }
  });

  return modules;
}

// Load all models
const models = loadModules(path.join(__dirname, "models"));
// Result: { user: {...}, post: {...}, comment: {...} }
```

### Debugging Tips

```javascript
// Print path information for debugging
console.log("=== Path Information ===");
console.log("__dirname:", __dirname);
console.log("__filename:", __filename);
console.log("process.cwd():", process.cwd());
console.log("require.main.filename:", require.main.filename);
console.log("process.argv[1]:", process.argv[1]);

// Check if paths exist
const path = require("path");
const fs = require("fs");

const checkPath = (filePath) => {
  console.log(`Path: ${filePath}`);
  console.log(`Exists: ${fs.existsSync(filePath)}`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`Is file: ${stats.isFile()}`);
    console.log(`Is directory: ${stats.isDirectory()}`);
  }
  console.log("---");
};

checkPath(__dirname);
checkPath(__filename);
checkPath(path.join(__dirname, "config.json"));
```

### Best Practices

```javascript
const path = require("path");

// ✅ 1. Always use path.join() for building paths
const configPath = path.join(__dirname, "config", "database.json");

// ❌ Don't use string concatenation
const badPath = __dirname + "/config/database.json"; // Fails on Windows!

// ✅ 2. Use path.resolve() for absolute paths
const absolutePath = path.resolve(__dirname, "uploads");

// ✅ 3. Check if paths exist before using
const fs = require("fs");
if (fs.existsSync(configPath)) {
  const config = require(configPath);
}

// ✅ 4. Store commonly used paths in constants
const PATHS = {
  ROOT: path.join(__dirname, ".."),
  PUBLIC: path.join(__dirname, "..", "public"),
  UPLOADS: path.join(__dirname, "..", "uploads"),
  VIEWS: path.join(__dirname, "views"),
  LOGS: path.join(__dirname, "..", "logs"),
};

// ✅ 5. Use environment variables for configurable paths
const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, "uploads");

// ✅ 6. Normalize paths to prevent traversal attacks
const userPath = path.normalize(userInput);
if (!userPath.startsWith(publicDir)) {
  throw new Error("Access denied");
}
```

### Key Takeaways

- ✅ `__dirname` = Absolute path to the **directory** of current file
- ✅ `__filename` = Absolute path to the **current file** (with filename)
- ✅ Available in **CommonJS modules only** (not ES modules)
- ✅ Use `import.meta.url` in ES modules
- ✅ Always use `path.join()` to build paths (cross-platform)
- ✅ `__dirname` ≠ `process.cwd()` (file location vs command location)
- ✅ Useful for loading files relative to current module
- ✅ Use for building paths to config files, templates, static assets
- ✅ Great for dynamic module loading
- ✅ Validate paths before using user input in file operations
- ✅ Use `path.normalize()` and check path prefixes for security
- ✅ Store common paths in constants for reusability

### Further Reading

- [Node.js \_\_dirname documentation](https://nodejs.org/api/modules.html#__dirname)
- [Node.js \_\_filename documentation](https://nodejs.org/api/modules.html#__filename)
- [Node.js path module](https://nodejs.org/api/path.html)
- [import.meta in ES modules](https://nodejs.org/api/esm.html#importmetaurl)
- [File system operations](https://nodejs.org/api/fs.html)
