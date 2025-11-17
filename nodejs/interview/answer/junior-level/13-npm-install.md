# What is the purpose of `npm install`?

## Short Answer

`npm install` is a command that **installs all dependencies** listed in your `package.json` file into the `node_modules` directory. It's the primary way to set up a Node.js project and manage its dependencies.

**Basic usage:**

```bash
# Install all dependencies from package.json
npm install

# Install a specific package and add to dependencies
npm install express

# Install a specific package as devDependency
npm install --save-dev jest

# Install a package globally
npm install -g nodemon
```

## Detailed Answer

### What npm install Does

When you run `npm install`, it:

1. **Reads `package.json`** - Identifies all required dependencies
2. **Resolves versions** - Determines compatible versions of all packages
3. **Downloads packages** - Fetches packages from the npm registry
4. **Installs to `node_modules`** - Places packages in the local directory
5. **Creates/updates `package-lock.json`** - Locks exact versions for reproducibility
6. **Runs lifecycle scripts** - Executes install scripts if defined

### Different Install Commands

#### 1. Install All Dependencies

```bash
# Install all dependencies and devDependencies
npm install

# Alias (shorter version)
npm i
```

**What it does:**

- Installs all packages listed in `dependencies`
- Installs all packages listed in `devDependencies`
- Creates `node_modules` directory if it doesn't exist
- Generates or updates `package-lock.json`

**Example `package.json`:**

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "nodemon": "^2.0.22"
  }
}
```

**After `npm install`:**

```
node_modules/
├── express/
├── mongoose/
├── jest/
├── nodemon/
└── (hundreds of transitive dependencies)
```

#### 2. Install Production Only

```bash
# Install only dependencies (not devDependencies)
npm install --production

# Or set NODE_ENV
NODE_ENV=production npm install
```

**Use case:** Deploying to production where you don't need testing/development tools.

```bash
# Before (with devDependencies): 500MB
npm install

# After (production only): 200MB
npm install --production
```

#### 3. Install Specific Package

```bash
# Install and add to dependencies
npm install express

# Install and add to devDependencies
npm install --save-dev jest

# Install specific version
npm install express@4.18.2

# Install version range
npm install express@^4.0.0

# Install from GitHub
npm install user/repo

# Install from local path
npm install ../local-package
```

#### 4. Install Globally

```bash
# Install package globally (available system-wide)
npm install -g nodemon

# Check global packages
npm list -g --depth=0

# Find global install location
npm root -g
```

**Common global packages:**

```bash
npm install -g nodemon     # Auto-restart dev server
npm install -g pm2         # Production process manager
npm install -g typescript  # TypeScript compiler
npm install -g eslint      # JavaScript linter
npm install -g npm-check-updates  # Update dependencies
```

### Install Flags and Options

#### Common Flags

```bash
# --save or -S (default since npm 5)
npm install express --save
npm install express -S

# --save-dev or -D
npm install jest --save-dev
npm install jest -D

# --save-optional or -O
npm install fsevents --save-optional
npm install fsevents -O

# --no-save (don't modify package.json)
npm install express --no-save

# --save-exact or -E (exact version, not range)
npm install express --save-exact
npm install express -E
# Results in: "express": "4.18.2" (not "^4.18.2")

# --global or -g
npm install nodemon --global
npm install nodemon -g

# --force or -f (force re-download)
npm install --force

# --legacy-peer-deps (ignore peer dependencies)
npm install --legacy-peer-deps

# --dry-run (show what would be installed)
npm install express --dry-run
```

#### Advanced Options

```bash
# Install from package-lock.json exactly
npm ci
# Faster, deterministic, requires package-lock.json

# Install with verbose output
npm install --verbose

# Install without optional dependencies
npm install --no-optional

# Install and ignore scripts
npm install --ignore-scripts

# Install with specific registry
npm install --registry=https://registry.npmjs.org
```

### package-lock.json

#### What It Does

`package-lock.json` ensures **deterministic installs** - everyone gets the exact same dependency tree.

**Example scenario without package-lock.json:**

```json
// package.json
{
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

**Problem:**

- Developer A installs on Jan 1: Gets express 4.18.0
- Developer B installs on Feb 1: Gets express 4.18.2 (new patch)
- Different versions = potential bugs! 😱

**Solution: package-lock.json**

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "packages": {
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "body-parser": "1.20.1",
        "cookie": "0.5.0"
      }
    }
  }
}
```

**Benefits:**

- ✅ Exact versions locked
- ✅ Faster installs (known dependency tree)
- ✅ Reproducible builds
- ✅ Audit trail of changes

### npm install vs npm ci

| Feature          | `npm install`                | `npm ci`                         |
| ---------------- | ---------------------------- | -------------------------------- |
| **Purpose**      | General installation         | Clean install for CI/CD          |
| **Requires**     | package.json                 | package.json + package-lock.json |
| **Modifies**     | Can update package-lock.json | Never modifies package-lock.json |
| **node_modules** | Updates existing             | Deletes and recreates            |
| **Speed**        | Slower                       | Faster (10-20% faster)           |
| **Use case**     | Development                  | Production/CI/CD                 |

**Example usage:**

```bash
# Development: flexible, updates lock file
npm install

# CI/CD: strict, reproducible
npm ci

# Docker production build
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --production  # Fast, deterministic
COPY . .
CMD ["node", "server.js"]
```

### Real-World Examples

#### Example 1: Fresh Project Setup

```bash
# Clone repository
git clone https://github.com/user/project.git
cd project

# Install dependencies
npm install

# Start development
npm run dev
```

**What happens:**

1. Reads `package.json` and `package-lock.json`
2. Downloads all packages to `node_modules`
3. Sets up binaries in `node_modules/.bin`
4. Runs postinstall scripts if defined

#### Example 2: Adding a New Dependency

```bash
# Install and save to package.json
npm install express

# Check what was added
git diff package.json
```

**Before:**

```json
{
  "dependencies": {}
}
```

**After:**

```json
{
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

#### Example 3: Production Deployment

```bash
# Install only production dependencies
npm ci --production

# Verify size difference
du -sh node_modules
# With devDependencies: 500MB
# Production only: 200MB
```

#### Example 4: Fixing Broken Dependencies

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clean install
npm install

# Or force reinstall
npm install --force
```

#### Example 5: Installing from Different Sources

```bash
# From npm registry (default)
npm install express

# Specific version
npm install express@4.18.2

# Version range
npm install express@^4.0.0  # 4.x.x
npm install express@~4.18.0 # 4.18.x

# From GitHub
npm install expressjs/express
npm install expressjs/express#branch-name
npm install expressjs/express#v4.18.2

# From tarball URL
npm install https://github.com/user/repo/tarball/master

# From local directory
npm install ../my-local-package
npm install file:../my-local-package

# From git URL
npm install git+https://github.com/user/repo.git
npm install git+ssh://git@github.com:user/repo.git
```

### Install Lifecycle Scripts

npm install can trigger lifecycle scripts defined in `package.json`:

#### Available Scripts

```json
{
  "scripts": {
    "preinstall": "echo 'Before install'",
    "install": "echo 'During install'",
    "postinstall": "echo 'After install'",
    "prepublish": "echo 'Before publish'",
    "prepare": "npm run build"
  }
}
```

#### Execution Order

```bash
npm install
# 1. preinstall
# 2. install
# 3. postinstall
# 4. prepublish (deprecated)
# 5. prepare
```

#### Real Example: Building TypeScript

```json
{
  "name": "my-package",
  "scripts": {
    "postinstall": "npm run build",
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**After `npm install`:**

- TypeScript is installed
- `postinstall` runs automatically
- TypeScript code is compiled to JavaScript

### Common Issues and Solutions

#### Issue 1: Permission Errors

```bash
# ❌ Error: EACCES permission denied
npm install -g package

# ✅ Solution 1: Use npx instead
npx package

# ✅ Solution 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# Add to ~/.bashrc or ~/.zshrc:
export PATH=~/.npm-global/bin:$PATH

# ✅ Solution 3: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

#### Issue 2: Peer Dependency Conflicts

```bash
# ❌ Error: conflicting peer dependency
npm ERR! peer dep missing: react@^18.0.0

# ✅ Solution 1: Install peer dependencies
npm install react@18.0.0

# ✅ Solution 2: Use legacy peer deps (temporary)
npm install --legacy-peer-deps

# ✅ Solution 3: Update package.json
npm install react@18.0.0 --save
```

#### Issue 3: Network/Registry Issues

```bash
# ❌ Error: network timeout
npm ERR! network timeout

# ✅ Solution 1: Change registry
npm config set registry https://registry.npmjs.org

# ✅ Solution 2: Increase timeout
npm config set fetch-timeout 60000

# ✅ Solution 3: Clear cache
npm cache clean --force
npm install
```

#### Issue 4: Corrupted Dependencies

```bash
# ❌ Symptoms: weird errors, missing modules
npm ERR! Cannot find module 'express'

# ✅ Solution: Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

### Performance Optimization

#### 1. Use npm ci in CI/CD

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci # Faster than npm install
      - run: npm test
```

#### 2. Cache node_modules

```yaml
# GitHub Actions with caching
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

#### 3. Production Builds

```dockerfile
# Dockerfile with multi-stage build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production  # Only production deps
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
```

#### 4. Parallel Installs

```bash
# npm automatically parallelizes (default)
npm install

# Specify number of concurrent downloads
npm install --maxsockets=15
```

### Alternative Package Managers

```bash
# Yarn (faster alternative)
yarn install
yarn add express

# pnpm (disk space efficient)
pnpm install
pnpm add express

# bun (newest, fastest)
bun install
bun add express
```

**Performance comparison:**

| Command        | Time | Disk Space       |
| -------------- | ---- | ---------------- |
| `npm install`  | 50s  | 500MB            |
| `yarn install` | 35s  | 500MB            |
| `pnpm install` | 30s  | 200MB (symlinks) |
| `bun install`  | 10s  | 400MB            |

### Best Practices

```bash
# ✅ 1. Always commit package-lock.json
git add package-lock.json
git commit -m "Update dependencies"

# ✅ 2. Use npm ci in production/CI
npm ci --production

# ✅ 3. Audit for vulnerabilities
npm audit
npm audit fix

# ✅ 4. Keep dependencies updated
npm outdated
npm update

# ✅ 5. Use exact versions for critical deps
npm install express --save-exact
# Results in: "express": "4.18.2" (not "^4.18.2")

# ✅ 6. Clean cache periodically
npm cache clean --force

# ✅ 7. Use .npmrc for configuration
# .npmrc
registry=https://registry.npmjs.org
save-exact=true
engine-strict=true

# ✅ 8. Specify Node.js version in package.json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Common npm install Patterns

```bash
# Fresh install
npm install

# Update to latest compatible versions
npm update

# Install specific version
npm install express@4.18.2

# Install latest version
npm install express@latest

# Install and save exact version
npm install express --save-exact

# Install from GitHub branch
npm install user/repo#branch

# Install and ignore scripts (security)
npm install --ignore-scripts

# Install with verbose logging (debugging)
npm install --verbose

# Dry run (see what would happen)
npm install --dry-run

# Force reinstall
npm install --force

# Install without modifying package.json
npm install express --no-save
```

### Key Takeaways

- ✅ `npm install` installs all dependencies from `package.json`
- ✅ Creates `node_modules` directory with all packages
- ✅ Generates/updates `package-lock.json` for reproducibility
- ✅ Use `npm install <package>` to add new dependencies
- ✅ Use `npm install --save-dev <package>` for dev dependencies
- ✅ Use `npm ci` for faster, deterministic installs in CI/CD
- ✅ Use `npm install --production` to skip devDependencies
- ✅ Always commit `package-lock.json` to version control
- ✅ Use `npm audit` to check for security vulnerabilities
- ✅ Run `npm install` after pulling new code with updated dependencies
- ✅ Delete `node_modules` and reinstall if you encounter issues
- ✅ Use global install (`-g`) sparingly, prefer npx for CLI tools

### Further Reading

- [npm-install documentation](https://docs.npmjs.com/cli/v9/commands/npm-install)
- [npm-ci documentation](https://docs.npmjs.com/cli/v9/commands/npm-ci)
- [package-lock.json explained](https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json)
- [npm dependency management](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#dependencies)
- [Semantic Versioning (semver)](https://semver.org/)
