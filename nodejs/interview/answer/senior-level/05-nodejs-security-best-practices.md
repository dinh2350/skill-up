# What are the security best practices for a Node.js application?

Security in Node.js applications requires a multi-layered approach covering authentication, authorization, data protection, infrastructure security, and secure coding practices. This comprehensive guide covers enterprise-level security practices for production Node.js applications.

## Overview of Node.js Security Landscape

Node.js security encompasses several critical areas that must be addressed to build secure applications:

```javascript
// Security assessment framework
class SecurityAssessment {
  constructor() {
    this.securityDomains = {
      authentication: "Who is the user?",
      authorization: "What can the user do?",
      dataProtection: "How is sensitive data protected?",
      inputValidation: "Are inputs properly sanitized?",
      errorHandling: "Do errors expose sensitive information?",
      dependencies: "Are third-party packages secure?",
      infrastructure: "Is the deployment environment secure?",
      monitoring: "Are security events tracked?",
    };
  }

  assessApplication() {
    console.log("=== SECURITY ASSESSMENT FRAMEWORK ===");

    Object.entries(this.securityDomains).forEach(([domain, question]) => {
      console.log(`${domain.toUpperCase()}: ${question}`);
    });

    return this.performSecurityChecklist();
  }

  performSecurityChecklist() {
    const checklist = {
      "Authentication & Authorization": [
        "Implement strong password policies",
        "Use secure session management",
        "Implement JWT properly with secure algorithms",
        "Enable multi-factor authentication",
        "Use principle of least privilege",
      ],
      "Data Protection": [
        "Encrypt sensitive data at rest and in transit",
        "Use HTTPS everywhere",
        "Implement proper key management",
        "Sanitize data before storage",
        "Use secure cryptographic algorithms",
      ],
      "Input Validation & Sanitization": [
        "Validate all input on server side",
        "Use parameterized queries to prevent SQL injection",
        "Sanitize HTML to prevent XSS",
        "Validate file uploads thoroughly",
        "Implement request size limits",
      ],
      "Error Handling & Logging": [
        "Never expose stack traces to users",
        "Log security events properly",
        "Implement centralized error handling",
        "Use structured logging",
        "Monitor for suspicious activities",
      ],
      "Dependencies & Supply Chain": [
        "Regularly audit dependencies",
        "Use lock files to ensure consistent versions",
        "Monitor for known vulnerabilities",
        "Implement dependency scanning in CI/CD",
        "Use minimal base images",
      ],
    };

    console.log("\n=== SECURITY CHECKLIST ===");
    Object.entries(checklist).forEach(([category, items]) => {
      console.log(`\n${category}:`);
      items.forEach((item) => console.log(`  ✓ ${item}`));
    });

    return checklist;
  }
}

// Example usage
// const assessment = new SecurityAssessment();
// assessment.assessApplication();
```

## 1. Authentication and Authorization

### Secure Authentication Implementation

```javascript
// Comprehensive authentication system
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

class SecureAuthentication {
  constructor(options = {}) {
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
    this.jwtRefreshSecret =
      options.jwtRefreshSecret || process.env.JWT_REFRESH_SECRET;
    this.saltRounds = options.saltRounds || 12;
    this.sessionTimeout = options.sessionTimeout || "15m";
    this.refreshTokenTimeout = options.refreshTokenTimeout || "7d";

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error("JWT secrets must be provided");
    }
  }

  // Secure password hashing
  async hashPassword(password) {
    console.log("Hashing password with bcrypt...");

    // Validate password strength
    if (!this.validatePasswordStrength(password)) {
      throw new Error("Password does not meet security requirements");
    }

    const salt = await bcrypt.genSalt(this.saltRounds);
    const hash = await bcrypt.hash(password, salt);

    return {
      hash,
      algorithm: "bcrypt",
      saltRounds: this.saltRounds,
      createdAt: new Date().toISOString(),
    };
  }

  validatePasswordStrength(password) {
    const requirements = {
      minLength: 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password),
      notCommon: !this.isCommonPassword(password),
    };

    const isValid =
      password.length >= requirements.minLength &&
      requirements.hasUppercase &&
      requirements.hasLowercase &&
      requirements.hasNumbers &&
      requirements.hasSpecialChars &&
      requirements.notCommon;

    if (!isValid) {
      console.log("Password requirements:", requirements);
    }

    return isValid;
  }

  isCommonPassword(password) {
    const commonPasswords = [
      "password",
      "password123",
      "123456",
      "qwerty",
      "admin",
      "letmein",
      "welcome",
      "monkey",
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  // Secure password verification with timing attack protection
  async verifyPassword(password, storedHash) {
    try {
      const isValid = await bcrypt.compare(password, storedHash);

      // Add consistent timing to prevent timing attacks
      await this.addTimingDelay();

      return isValid;
    } catch (error) {
      console.error("Password verification error:", error);
      await this.addTimingDelay();
      return false;
    }
  }

  async addTimingDelay() {
    // Add random delay between 10-50ms to prevent timing attacks
    const delay = Math.floor(Math.random() * 40) + 10;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  // JWT token generation with secure practices
  generateTokens(payload) {
    const accessTokenPayload = {
      ...payload,
      type: "access",
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
    };

    const refreshTokenPayload = {
      userId: payload.userId,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
    };

    const accessToken = jwt.sign(accessTokenPayload, this.jwtSecret, {
      expiresIn: this.sessionTimeout,
      algorithm: "HS256",
      issuer: "secure-app",
      audience: "secure-app-users",
    });

    const refreshToken = jwt.sign(refreshTokenPayload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenTimeout,
      algorithm: "HS256",
      issuer: "secure-app",
      audience: "secure-app-users",
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.sessionTimeout,
      tokenType: "Bearer",
    };
  }

  // Secure JWT verification
  verifyToken(token, type = "access") {
    try {
      const secret = type === "access" ? this.jwtSecret : this.jwtRefreshSecret;

      const decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
        issuer: "secure-app",
        audience: "secure-app-users",
      });

      // Verify token type
      if (decoded.type !== type) {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      console.error(`Token verification failed: ${error.message}`);
      return null;
    }
  }

  // Rate limiting for authentication endpoints
  createAuthRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: {
        error: "Too many authentication attempts",
        retryAfter: 15 * 60, // seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        console.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          error: "Too many authentication attempts",
          retryAfter: 900,
        });
      },
    });
  }

  // Session management middleware
  createSessionMiddleware() {
    return (req, res, next) => {
      const token = this.extractToken(req);

      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      const decoded = this.verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // Check if token is close to expiry (refresh if < 5 minutes)
      const timeToExpiry = decoded.exp - Math.floor(Date.now() / 1000);
      if (timeToExpiry < 300) {
        // 5 minutes
        res.set("X-Token-Refresh-Suggested", "true");
      }

      req.user = decoded;
      next();
    };
  }

  extractToken(req) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    return null;
  }
}

// Role-based access control
class RoleBasedAccessControl {
  constructor() {
    this.permissions = new Map();
    this.roles = new Map();
    this.setupDefaultRoles();
  }

  setupDefaultRoles() {
    // Define permissions
    const permissions = {
      "users:read": "Read user information",
      "users:write": "Create and update users",
      "users:delete": "Delete users",
      "admin:system": "System administration",
      "reports:read": "Read reports",
      "reports:write": "Create reports",
    };

    Object.entries(permissions).forEach(([perm, desc]) => {
      this.permissions.set(perm, desc);
    });

    // Define roles with permissions
    this.roles.set("user", ["users:read"]);
    this.roles.set("moderator", ["users:read", "users:write", "reports:read"]);
    this.roles.set("admin", [
      "users:read",
      "users:write",
      "users:delete",
      "reports:read",
      "reports:write",
    ]);
    this.roles.set("superadmin", Array.from(this.permissions.keys()));
  }

  hasPermission(userRoles, requiredPermission) {
    for (const role of userRoles) {
      const rolePermissions = this.roles.get(role);
      if (rolePermissions && rolePermissions.includes(requiredPermission)) {
        return true;
      }
    }
    return false;
  }

  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userRoles = req.user.roles || [];

      if (!this.hasPermission(userRoles, permission)) {
        console.warn(
          `Access denied for user ${req.user.userId} to permission ${permission}`
        );
        return res.status(403).json({
          error: "Insufficient permissions",
          required: permission,
        });
      }

      next();
    };
  }
}

// Example usage
/*
const auth = new SecureAuthentication({
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET
});

const rbac = new RoleBasedAccessControl();

// In your Express app
app.post('/login', auth.createAuthRateLimit(), async (req, res) => {
  // Login implementation
});

app.get('/admin', 
  auth.createSessionMiddleware(), 
  rbac.requirePermission('admin:system'),
  (req, res) => {
    res.json({ message: 'Admin access granted' });
  }
);
*/
```

## 2. Input Validation and Sanitization

### Comprehensive Input Security

```javascript
// Input validation and sanitization framework
const validator = require("validator");
const xss = require("xss");
const helmet = require("helmet");

class InputSecurityManager {
  constructor() {
    this.validationRules = new Map();
    this.sanitizationRules = new Map();
    this.setupDefaultRules();
  }

  setupDefaultRules() {
    // Email validation
    this.validationRules.set("email", (value) => {
      return validator.isEmail(value) && value.length <= 254;
    });

    // Phone validation
    this.validationRules.set("phone", (value) => {
      return validator.isMobilePhone(value) && value.length <= 20;
    });

    // Username validation
    this.validationRules.set("username", (value) => {
      return /^[a-zA-Z0-9_-]{3,30}$/.test(value);
    });

    // Strong password validation
    this.validationRules.set("password", (value) => {
      return (
        value.length >= 8 &&
        /[A-Z]/.test(value) &&
        /[a-z]/.test(value) &&
        /\d/.test(value) &&
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(value)
      );
    });

    // Text sanitization
    this.sanitizationRules.set("text", (value) => {
      return xss(validator.escape(value));
    });

    // HTML sanitization
    this.sanitizationRules.set("html", (value) => {
      return xss(value, {
        whiteList: {
          p: [],
          br: [],
          strong: [],
          em: [],
          ul: [],
          ol: [],
          li: [],
        },
      });
    });
  }

  // SQL injection prevention
  createSQLInjectionProtection() {
    return {
      // Parameterized query helper
      sanitizeQuery: (query, params) => {
        // Validate that query uses parameterized format
        const paramCount = (query.match(/\?/g) || []).length;
        if (paramCount !== params.length) {
          throw new Error("Parameter count mismatch");
        }

        // Additional SQL keyword validation
        const dangerousKeywords =
          /(\b(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|EXECUTE)\b)/i;
        if (dangerousKeywords.test(query) && !query.includes("-- SAFE")) {
          console.warn("Potentially dangerous SQL detected:", query);
        }

        return { query, params };
      },

      // Input sanitization for SQL
      sanitizeInput: (input) => {
        if (typeof input === "string") {
          // Remove SQL comment markers
          return input.replace(/--|\|\/\*|\*\/|;/g, "");
        }
        return input;
      },
    };
  }

  // XSS prevention
  createXSSProtection() {
    return {
      // Content Security Policy
      cspMiddleware: helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
        reportOnly: false,
      }),

      // XSS filter
      sanitizeHtml: (html) => {
        const options = {
          whiteList: {
            p: [],
            br: [],
            strong: [],
            em: [],
            u: [],
            i: [],
            b: [],
            ul: [],
            ol: [],
            li: [],
            h1: [],
            h2: [],
            h3: [],
            h4: [],
            h5: [],
            h6: [],
            blockquote: [],
            a: ["href", "title"],
            img: ["src", "alt", "title", "width", "height"],
          },
          stripIgnoreTag: true,
          stripIgnoreTagBody: ["script", "style"],
          allowCommentTag: false,
          onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
            console.warn(
              `Stripped attribute: ${name}="${value}" from tag: ${tag}`
            );
          },
        };

        return xss(html, options);
      },

      // Output encoding
      encodeOutput: (data) => {
        if (typeof data === "string") {
          return validator.escape(data);
        }
        if (typeof data === "object" && data !== null) {
          const encoded = {};
          for (const [key, value] of Object.entries(data)) {
            encoded[key] = this.encodeOutput(value);
          }
          return encoded;
        }
        return data;
      },
    };
  }

  // File upload security
  createFileUploadSecurity() {
    const crypto = require("crypto");
    const path = require("path");
    const fs = require("fs").promises;

    return {
      // Secure file upload validator
      validateFile: async (file) => {
        const validation = {
          isValid: true,
          errors: [],
          sanitizedFilename: "",
        };

        // File size validation (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          validation.isValid = false;
          validation.errors.push("File size exceeds 10MB limit");
        }

        // File type validation
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "application/pdf",
          "text/plain",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          validation.isValid = false;
          validation.errors.push("File type not allowed");
        }

        // Filename sanitization
        const originalName = file.originalname;
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);

        // Remove dangerous characters
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const timestamp = Date.now();
        const randomStr = crypto.randomBytes(8).toString("hex");

        validation.sanitizedFilename = `${timestamp}_${randomStr}_${sanitizedBaseName}${extension}`;

        // Magic number validation (file signature)
        if (file.buffer) {
          const isValidSignature = await this.validateFileSignature(
            file.buffer,
            file.mimetype
          );
          if (!isValidSignature) {
            validation.isValid = false;
            validation.errors.push(
              "File signature does not match declared type"
            );
          }
        }

        return validation;
      },

      validateFileSignature: async (buffer, expectedMimeType) => {
        const signatures = {
          "image/jpeg": [0xff, 0xd8, 0xff],
          "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
          "image/gif": [0x47, 0x49, 0x46, 0x38],
          "application/pdf": [0x25, 0x50, 0x44, 0x46],
        };

        const signature = signatures[expectedMimeType];
        if (!signature) return true; // No signature to validate

        for (let i = 0; i < signature.length; i++) {
          if (buffer[i] !== signature[i]) {
            return false;
          }
        }

        return true;
      },
    };
  }

  // Request validation middleware
  createValidationMiddleware(schema) {
    return (req, res, next) => {
      const errors = [];

      // Validate request body
      if (schema.body) {
        for (const [field, rules] of Object.entries(schema.body)) {
          const value = req.body[field];

          if (
            rules.required &&
            (value === undefined || value === null || value === "")
          ) {
            errors.push(`${field} is required`);
            continue;
          }

          if (value !== undefined && value !== null) {
            // Type validation
            if (rules.type && typeof value !== rules.type) {
              errors.push(`${field} must be of type ${rules.type}`);
            }

            // Custom validation
            if (rules.validator) {
              const validator = this.validationRules.get(rules.validator);
              if (validator && !validator(value)) {
                errors.push(`${field} is not valid`);
              }
            }

            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
              errors.push(
                `${field} must be at least ${rules.minLength} characters`
              );
            }

            if (rules.maxLength && value.length > rules.maxLength) {
              errors.push(
                `${field} must be no more than ${rules.maxLength} characters`
              );
            }

            // Sanitization
            if (rules.sanitize) {
              const sanitizer = this.sanitizationRules.get(rules.sanitize);
              if (sanitizer) {
                req.body[field] = sanitizer(value);
              }
            }
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
      }

      next();
    };
  }
}

// Example usage
/*
const inputSecurity = new InputSecurityManager();

const userRegistrationSchema = {
  body: {
    username: {
      required: true,
      type: 'string',
      validator: 'username',
      maxLength: 30
    },
    email: {
      required: true,
      type: 'string',
      validator: 'email'
    },
    password: {
      required: true,
      type: 'string',
      validator: 'password'
    },
    bio: {
      required: false,
      type: 'string',
      sanitize: 'html',
      maxLength: 500
    }
  }
};

app.post('/register',
  inputSecurity.createValidationMiddleware(userRegistrationSchema),
  async (req, res) => {
    // Registration logic with validated and sanitized input
  }
);
*/
```

## 3. Data Protection and Encryption

### Comprehensive Data Security

```javascript
// Data encryption and protection framework
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

class DataProtectionManager {
  constructor(options = {}) {
    this.algorithm = options.algorithm || "aes-256-gcm";
    this.keyDerivationIterations = options.keyDerivationIterations || 100000;
    this.masterKey = this.deriveMasterKey(
      options.masterPassword || process.env.MASTER_KEY
    );

    if (!options.masterPassword && !process.env.MASTER_KEY) {
      throw new Error("Master key must be provided for encryption");
    }
  }

  deriveMasterKey(password) {
    const salt = crypto
      .createHash("sha256")
      .update("application-salt-" + (process.env.APP_NAME || "default"))
      .digest();

    return crypto.pbkdf2Sync(
      password,
      salt,
      this.keyDerivationIterations,
      32,
      "sha256"
    );
  }

  // Encrypt sensitive data at rest
  encryptData(plaintext, additionalData = "") {
    try {
      const iv = crypto.randomBytes(12); // 96-bit IV for GCM
      const cipher = crypto.createCipher(this.algorithm, this.masterKey);
      cipher.setAAD(Buffer.from(additionalData, "utf8"));

      let encrypted = cipher.update(plaintext, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
        algorithm: this.algorithm,
      };
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  // Decrypt sensitive data
  decryptData(encryptedData, additionalData = "") {
    try {
      const { encrypted, iv, authTag } = encryptedData;

      const decipher = crypto.createDecipher(this.algorithm, this.masterKey);
      decipher.setAuthTag(Buffer.from(authTag, "hex"));
      decipher.setAAD(Buffer.from(additionalData, "utf8"));

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  // PII (Personally Identifiable Information) protection
  createPIIProtection() {
    return {
      // Hash PII for searching while preserving privacy
      hashPII: (data) => {
        const hash = crypto
          .createHmac("sha256", this.masterKey)
          .update(data.toLowerCase().trim())
          .digest("hex");
        return hash;
      },

      // Encrypt PII for storage
      encryptPII: (data) => {
        return this.encryptData(data, "PII");
      },

      // Decrypt PII for display
      decryptPII: (encryptedData) => {
        return this.decryptData(encryptedData, "PII");
      },

      // Mask PII for logging/display
      maskPII: (data, type = "generic") => {
        if (!data) return data;

        switch (type) {
          case "email":
            const [username, domain] = data.split("@");
            return `${username[0]}***@${domain}`;

          case "phone":
            return `***-***-${data.slice(-4)}`;

          case "ssn":
            return `***-**-${data.slice(-4)}`;

          case "creditcard":
            return `****-****-****-${data.slice(-4)}`;

          default:
            return data.length > 4
              ? `${data.slice(0, 2)}***${data.slice(-2)}`
              : "***";
        }
      },
    };
  }

  // Database field encryption
  createFieldEncryption() {
    return {
      // Encrypt specific database fields
      encryptFields: (obj, fieldsToEncrypt) => {
        const encrypted = { ...obj };

        fieldsToEncrypt.forEach((field) => {
          if (encrypted[field]) {
            encrypted[`${field}_encrypted`] = this.encryptData(
              encrypted[field].toString()
            );
            delete encrypted[field]; // Remove plaintext
          }
        });

        return encrypted;
      },

      // Decrypt specific database fields
      decryptFields: (obj, fieldsToDecrypt) => {
        const decrypted = { ...obj };

        fieldsToDecrypt.forEach((field) => {
          const encryptedField = `${field}_encrypted`;
          if (decrypted[encryptedField]) {
            try {
              decrypted[field] = this.decryptData(decrypted[encryptedField]);
              delete decrypted[encryptedField]; // Remove encrypted data
            } catch (error) {
              console.error(`Failed to decrypt field ${field}:`, error);
            }
          }
        });

        return decrypted;
      },
    };
  }

  // Secure key management
  createKeyManagement() {
    return {
      // Generate secure API keys
      generateAPIKey: (prefix = "ak") => {
        const randomBytes = crypto.randomBytes(32);
        const timestamp = Date.now().toString(36);
        const checksum = crypto
          .createHash("sha256")
          .update(randomBytes)
          .digest()
          .slice(0, 4);

        return `${prefix}_${timestamp}_${randomBytes.toString(
          "hex"
        )}_${checksum.toString("hex")}`;
      },

      // Generate secure session tokens
      generateSessionToken: () => {
        return crypto.randomBytes(32).toString("hex");
      },

      // Key rotation helper
      rotateKey: (currentKey) => {
        const newKey = crypto.randomBytes(32);
        const rotationRecord = {
          oldKeyHash: crypto
            .createHash("sha256")
            .update(currentKey)
            .digest("hex"),
          newKey: newKey,
          rotatedAt: new Date().toISOString(),
          rotationId: crypto.randomUUID(),
        };

        return rotationRecord;
      },

      // Secure key comparison
      compareKeys: (providedKey, storedKeyHash) => {
        const providedKeyHash = crypto
          .createHash("sha256")
          .update(providedKey)
          .digest("hex");

        return crypto.timingSafeEqual(
          Buffer.from(providedKeyHash, "hex"),
          Buffer.from(storedKeyHash, "hex")
        );
      },
    };
  }

  // Data masking for non-production environments
  createDataMasking() {
    return {
      maskSensitiveData: (data, environment = "development") => {
        if (environment === "production") {
          return data; // Don't mask in production
        }

        const masked = JSON.parse(JSON.stringify(data));

        const sensitiveFields = [
          "password",
          "email",
          "phone",
          "ssn",
          "creditCard",
          "address",
          "firstName",
          "lastName",
          "dateOfBirth",
        ];

        const maskValue = (value, fieldName) => {
          if (fieldName.includes("email")) {
            return "test@example.com";
          } else if (fieldName.includes("phone")) {
            return "555-0123";
          } else if (fieldName.includes("password")) {
            return "password123";
          } else if (typeof value === "string") {
            return "masked_" + crypto.randomBytes(4).toString("hex");
          } else {
            return value;
          }
        };

        const maskObject = (obj, path = "") => {
          for (const [key, value] of Object.entries(obj)) {
            const fullPath = path ? `${path}.${key}` : key;

            if (
              sensitiveFields.some((field) => key.toLowerCase().includes(field))
            ) {
              obj[key] = maskValue(value, key);
            } else if (typeof value === "object" && value !== null) {
              maskObject(value, fullPath);
            }
          }
        };

        maskObject(masked);
        return masked;
      },
    };
  }
}

// Example usage
/*
const dataProtection = new DataProtectionManager({
  masterPassword: process.env.MASTER_KEY
});

const piiProtection = dataProtection.createPIIProtection();
const fieldEncryption = dataProtection.createFieldEncryption();

// Example: Encrypting user data before database storage
const userData = {
  username: 'john_doe',
  email: 'john@example.com',
  phone: '555-0123',
  profile: { bio: 'Software engineer' }
};

const encryptedUserData = fieldEncryption.encryptFields(userData, ['email', 'phone']);
console.log('Encrypted user data:', encryptedUserData);

// Example: Decrypting for display
const decryptedUserData = fieldEncryption.decryptFields(encryptedUserData, ['email', 'phone']);
console.log('Decrypted user data:', decryptedUserData);
*/
```

## 4. Security Headers and HTTPS

### Web Security Headers Implementation

```javascript
// Comprehensive security headers and HTTPS setup
const helmet = require("helmet");
const express = require("express");
const https = require("https");
const fs = require("fs");

class WebSecurityManager {
  constructor() {
    this.securityHeaders = this.createSecurityHeaders();
  }

  createSecurityHeaders() {
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Only if absolutely necessary
            "https://fonts.googleapis.com",
            "https://cdnjs.cloudflare.com",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://cdnjs.cloudflare.com",
          ],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: [
            "'self'",
            "'unsafe-eval'", // Avoid if possible
            "https://cdnjs.cloudflare.com",
          ],
          connectSrc: [
            "'self'",
            "https://api.example.com",
            "wss://websocket.example.com",
          ],
          frameAncestors: ["'none'"], // Prevent clickjacking
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
          reportUri: "/csp-report", // CSP violation reporting
        },
        reportOnly: false, // Set to true during development/testing
      },

      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },

      // X-Frame-Options (clickjacking protection)
      frameguard: {
        action: "deny",
      },

      // X-XSS-Protection
      xssFilter: true,

      // X-Content-Type-Options
      noSniff: true,

      // Referrer Policy
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
      },

      // Permissions Policy (formerly Feature Policy)
      permissionsPolicy: {
        features: {
          camera: ["'none'"],
          microphone: ["'none'"],
          geolocation: ["'self'"],
          payment: ["'none'"],
          usb: ["'none'"],
          bluetooth: ["'none'"],
        },
      },

      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: false, // Enable if needed for isolation

      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: { policy: "cross-origin" },
    });
  }

  // HTTPS configuration
  createHTTPSServer(app, options = {}) {
    const httpsOptions = {
      // SSL/TLS certificate configuration
      key:
        options.privateKey ||
        fs.readFileSync(options.keyPath || "./certs/private-key.pem"),
      cert:
        options.certificate ||
        fs.readFileSync(options.certPath || "./certs/certificate.pem"),

      // Additional CA certificates if needed
      ca:
        options.ca ||
        (options.caPath ? fs.readFileSync(options.caPath) : undefined),

      // TLS configuration
      secureProtocol: "TLSv1_2_method", // Minimum TLS 1.2
      honorCipherOrder: true,
      ciphers: [
        "ECDHE-ECDSA-AES256-GCM-SHA384",
        "ECDHE-RSA-AES256-GCM-SHA384",
        "ECDHE-ECDSA-CHACHA20-POLY1305",
        "ECDHE-RSA-CHACHA20-POLY1305",
        "ECDHE-ECDSA-AES128-GCM-SHA256",
        "ECDHE-RSA-AES128-GCM-SHA256",
      ].join(":"),

      // Disable insecure protocols
      secureOptions:
        crypto.constants.SSL_OP_NO_SSLv2 |
        crypto.constants.SSL_OP_NO_SSLv3 |
        crypto.constants.SSL_OP_NO_TLSv1 |
        crypto.constants.SSL_OP_NO_TLSv1_1,
    };

    return https.createServer(httpsOptions, app);
  }

  // HTTP to HTTPS redirect middleware
  createHTTPSRedirect() {
    return (req, res, next) => {
      if (req.headers["x-forwarded-proto"] !== "https" && !req.secure) {
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        console.log(`Redirecting HTTP to HTTPS: ${req.url} -> ${httpsUrl}`);
        return res.redirect(301, httpsUrl);
      }
      next();
    };
  }

  // CSP violation reporting endpoint
  createCSPReportHandler() {
    return (
      express.json({ type: "application/csp-report" }),
      (req, res) => {
        console.log("CSP Violation Report:", JSON.stringify(req.body, null, 2));

        // Log violation details
        const violation = req.body["csp-report"];
        if (violation) {
          const logEntry = {
            timestamp: new Date().toISOString(),
            documentUri: violation["document-uri"],
            violatedDirective: violation["violated-directive"],
            blockedUri: violation["blocked-uri"],
            sourceFile: violation["source-file"],
            lineNumber: violation["line-number"],
            userAgent: req.headers["user-agent"],
            ip: req.ip,
          };

          // In production, send to logging service
          this.logSecurityViolation("csp", logEntry);
        }

        res.status(204).end();
      }
    );
  }

  // Security monitoring and alerting
  createSecurityMonitoring() {
    const suspiciousActivities = new Map();
    const alertThresholds = {
      loginAttempts: 5,
      timeWindow: 15 * 60 * 1000, // 15 minutes
      cspViolations: 10,
    };

    return {
      trackSuspiciousActivity: (ip, activityType) => {
        const key = `${ip}:${activityType}`;
        const now = Date.now();

        if (!suspiciousActivities.has(key)) {
          suspiciousActivities.set(key, []);
        }

        const activities = suspiciousActivities.get(key);
        activities.push(now);

        // Clean old activities outside time window
        const recentActivities = activities.filter(
          (timestamp) => now - timestamp <= alertThresholds.timeWindow
        );
        suspiciousActivities.set(key, recentActivities);

        // Check if threshold exceeded
        if (recentActivities.length >= alertThresholds.loginAttempts) {
          this.triggerSecurityAlert(ip, activityType, recentActivities.length);
          return true; // Should block
        }

        return false;
      },

      logSecurityEvent: (eventType, details) => {
        const logEntry = {
          timestamp: new Date().toISOString(),
          eventType,
          details,
          severity: this.getEventSeverity(eventType),
        };

        console.log("Security Event:", JSON.stringify(logEntry, null, 2));

        // In production: send to SIEM, logging service, etc.
        this.sendToSecurityLog(logEntry);
      },
    };
  }

  logSecurityViolation(type, details) {
    // In production, integrate with your logging infrastructure
    console.warn(`Security Violation [${type.toUpperCase()}]:`, details);

    // Example: Send to external security monitoring service
    // securityService.reportViolation(type, details);
  }

  getEventSeverity(eventType) {
    const severityMap = {
      failed_login: "medium",
      csp_violation: "low",
      suspicious_activity: "high",
      brute_force: "critical",
      injection_attempt: "critical",
    };

    return severityMap[eventType] || "low";
  }

  triggerSecurityAlert(ip, activityType, count) {
    const alert = {
      timestamp: new Date().toISOString(),
      type: "security_alert",
      ip,
      activityType,
      count,
      severity: "high",
    };

    console.error("SECURITY ALERT:", alert);

    // In production: trigger alerts via email, Slack, PagerDuty, etc.
    // alerting.sendAlert(alert);
  }

  sendToSecurityLog(logEntry) {
    // Implement integration with your security logging infrastructure
    // Examples: Splunk, ELK Stack, DataDog, etc.
    console.log("Security Log Entry:", logEntry);
  }

  // Complete security middleware setup
  setupCompleteSecurityMiddleware(app) {
    // Apply security headers
    app.use(this.securityHeaders);

    // HTTPS redirect (if behind a proxy)
    app.use(this.createHTTPSRedirect());

    // CSP violation reporting
    app.post("/csp-report", this.createCSPReportHandler());

    // Additional security middleware
    app.use((req, res, next) => {
      // Remove server information
      res.removeHeader("X-Powered-By");

      // Add additional security headers
      res.set({
        "X-Request-ID": req.headers["x-request-id"] || crypto.randomUUID(),
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      next();
    });

    console.log("✅ Complete security middleware setup applied");
    return app;
  }
}

// Example usage
/*
const webSecurity = new WebSecurityManager();
const app = express();

// Apply all security middleware
webSecurity.setupCompleteSecurityMiddleware(app);

// Create HTTPS server
const httpsServer = webSecurity.createHTTPSServer(app, {
  keyPath: './certs/private-key.pem',
  certPath: './certs/certificate.pem'
});

httpsServer.listen(443, () => {
  console.log('HTTPS server running on port 443');
});

// Optional: HTTP server for redirects
const httpApp = express();
httpApp.use(webSecurity.createHTTPSRedirect());
httpApp.listen(80, () => {
  console.log('HTTP redirect server running on port 80');
});
*/
```

## 5. Dependency Security and Supply Chain Protection

### Comprehensive Dependency Management

```javascript
// Dependency security and supply chain protection
const { execSync } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");

class DependencySecurityManager {
  constructor() {
    this.vulnerabilityDatabase = new Map();
    this.trustedRegistries = [
      "https://registry.npmjs.org/",
      "https://npm.pkg.github.com/",
    ];
  }

  // Automated security auditing
  performSecurityAudit() {
    console.log("=== DEPENDENCY SECURITY AUDIT ===");

    try {
      // Run npm audit
      const auditResult = execSync("npm audit --json", { encoding: "utf8" });
      const audit = JSON.parse(auditResult);

      this.analyzeAuditResults(audit);

      // Check package-lock.json integrity
      this.verifyLockFileIntegrity();

      // Scan for known malicious packages
      this.scanForMaliciousPackages();

      // Verify package signatures
      this.verifyPackageSignatures();
    } catch (error) {
      console.error("Security audit failed:", error.message);
    }
  }

  analyzeAuditResults(audit) {
    const { vulnerabilities, metadata } = audit;

    console.log("\n--- Vulnerability Analysis ---");
    console.log(`Total vulnerabilities: ${metadata.vulnerabilities.total}`);
    console.log(`Critical: ${metadata.vulnerabilities.critical}`);
    console.log(`High: ${metadata.vulnerabilities.high}`);
    console.log(`Moderate: ${metadata.vulnerabilities.moderate}`);
    console.log(`Low: ${metadata.vulnerabilities.low}`);

    // Detailed vulnerability analysis
    Object.entries(vulnerabilities).forEach(([packageName, vuln]) => {
      if (vuln.severity === "critical" || vuln.severity === "high") {
        console.log(
          `\n⚠️  ${vuln.severity.toUpperCase()} vulnerability in ${packageName}:`
        );
        console.log(`   Title: ${vuln.title}`);
        console.log(`   Range: ${vuln.range}`);
        console.log(`   Fix available: ${vuln.fixAvailable ? "Yes" : "No"}`);

        if (vuln.fixAvailable) {
          console.log(
            `   Fix: npm install ${vuln.fixAvailable.name}@${vuln.fixAvailable.version}`
          );
        }
      }
    });

    // Generate security recommendations
    this.generateSecurityRecommendations(audit);
  }

  verifyLockFileIntegrity() {
    console.log("\n--- Lock File Integrity Check ---");

    try {
      // Check if package-lock.json exists and is valid
      if (fs.existsSync("package-lock.json")) {
        const lockContent = fs.readFileSync("package-lock.json", "utf8");
        const lockData = JSON.parse(lockContent);

        // Verify integrity hashes
        let integrityIssues = 0;

        const checkPackageIntegrity = (packages) => {
          Object.entries(packages).forEach(([name, pkg]) => {
            if (pkg.integrity) {
              // In a real implementation, you would verify the integrity hash
              console.log(`✓ ${name}: integrity hash present`);
            } else if (!name.startsWith("node_modules/")) {
              console.warn(`⚠️  ${name}: missing integrity hash`);
              integrityIssues++;
            }
          });
        };

        if (lockData.packages) {
          checkPackageIntegrity(lockData.packages);
        }

        console.log(
          `Integrity check complete. Issues found: ${integrityIssues}`
        );
      } else {
        console.warn(
          "⚠️  package-lock.json not found - dependency versions not locked"
        );
      }
    } catch (error) {
      console.error("Lock file integrity check failed:", error.message);
    }
  }

  scanForMaliciousPackages() {
    console.log("\n--- Malicious Package Scan ---");

    const knownMaliciousPatterns = [
      /bitcoin/i,
      /cryptocurrency/i,
      /miner/i,
      /wallet.*steal/i,
      /password.*extract/i,
    ];

    const suspiciousPackageNames = [
      "event-stream",
      "eslint-scope",
      "flatmap-stream",
    ];

    try {
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };

      let suspiciousPackages = 0;

      Object.keys(allDependencies).forEach((packageName) => {
        // Check against known malicious packages
        if (suspiciousPackageNames.includes(packageName)) {
          console.warn(`⚠️  Suspicious package detected: ${packageName}`);
          suspiciousPackages++;
        }

        // Check package name patterns
        knownMaliciousPatterns.forEach((pattern) => {
          if (pattern.test(packageName)) {
            console.warn(
              `⚠️  Package name matches suspicious pattern: ${packageName}`
            );
            suspiciousPackages++;
          }
        });
      });

      console.log(
        `Malicious package scan complete. Suspicious packages: ${suspiciousPackages}`
      );
    } catch (error) {
      console.error("Malicious package scan failed:", error.message);
    }
  }

  verifyPackageSignatures() {
    console.log("\n--- Package Signature Verification ---");

    // This is a simplified version - in practice, you would verify npm package signatures
    try {
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const dependencies = Object.keys(packageJson.dependencies || {});

      dependencies.forEach((dep) => {
        // In a real implementation, verify package signatures
        console.log(`✓ ${dep}: signature verification (simulated)`);
      });

      console.log("Package signature verification complete");
    } catch (error) {
      console.error("Package signature verification failed:", error.message);
    }
  }

  generateSecurityRecommendations(audit) {
    console.log("\n--- Security Recommendations ---");

    const recommendations = [];

    if (audit.metadata.vulnerabilities.critical > 0) {
      recommendations.push(
        "🔴 CRITICAL: Fix critical vulnerabilities immediately"
      );
      recommendations.push("   Run: npm audit fix --force");
    }

    if (audit.metadata.vulnerabilities.high > 0) {
      recommendations.push("🟡 HIGH: Address high-severity vulnerabilities");
      recommendations.push("   Run: npm audit fix");
    }

    recommendations.push("🔧 Enable automated dependency updates");
    recommendations.push("🔍 Set up continuous dependency monitoring");
    recommendations.push("📋 Implement dependency review process");
    recommendations.push("🔒 Use npm ci in production builds");

    recommendations.forEach((rec) => console.log(rec));
  }

  // Dependency update security checks
  createDependencyUpdateSecurity() {
    return {
      // Pre-update security verification
      preUpdateCheck: async (packageName, newVersion) => {
        console.log(
          `Pre-update security check for ${packageName}@${newVersion}`
        );

        const checks = {
          hasVulnerabilities: false,
          isMaintained: true,
          hasValidSignature: true,
          downloadCount: 0,
          lastPublished: null,
        };

        try {
          // Simulate NPM registry check
          const registryInfo = await this.getPackageRegistryInfo(packageName);

          checks.downloadCount = registryInfo.downloads;
          checks.lastPublished = registryInfo.lastPublished;
          checks.isMaintained = this.isPackageMaintained(registryInfo);

          // Check for known vulnerabilities in the new version
          checks.hasVulnerabilities = await this.checkVersionVulnerabilities(
            packageName,
            newVersion
          );
        } catch (error) {
          console.warn(
            `Could not verify security for ${packageName}: ${error.message}`
          );
        }

        return checks;
      },

      // Post-update security verification
      postUpdateCheck: (packageName, installedVersion) => {
        console.log(
          `Post-update security check for ${packageName}@${installedVersion}`
        );

        // Verify the installed package matches expected version
        const packagePath = `node_modules/${packageName}/package.json`;

        try {
          const packageInfo = JSON.parse(fs.readFileSync(packagePath, "utf8"));

          if (packageInfo.version !== installedVersion) {
            console.error(
              `Version mismatch for ${packageName}: expected ${installedVersion}, got ${packageInfo.version}`
            );
            return false;
          }

          // Check for suspicious files
          const suspiciousFiles =
            this.scanPackageForSuspiciousFiles(packageName);
          if (suspiciousFiles.length > 0) {
            console.warn(
              `Suspicious files found in ${packageName}:`,
              suspiciousFiles
            );
            return false;
          }

          console.log(
            `✓ ${packageName}@${installedVersion} passed post-update security check`
          );
          return true;
        } catch (error) {
          console.error(
            `Post-update check failed for ${packageName}: ${error.message}`
          );
          return false;
        }
      },
    };
  }

  // Simulated package registry information
  async getPackageRegistryInfo(packageName) {
    // In a real implementation, this would query the npm registry API
    return {
      downloads: Math.floor(Math.random() * 1000000),
      lastPublished: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ),
      maintainers: ["maintainer1", "maintainer2"],
      repository: `https://github.com/user/${packageName}`,
    };
  }

  isPackageMaintained(registryInfo) {
    const daysSinceLastPublish =
      (Date.now() - registryInfo.lastPublished) / (24 * 60 * 60 * 1000);
    return daysSinceLastPublish < 365; // Package updated within last year
  }

  async checkVersionVulnerabilities(packageName, version) {
    // In a real implementation, check against vulnerability databases
    const knownVulnerablePackages = ["event-stream", "eslint-scope"];
    return knownVulnerablePackages.includes(packageName);
  }

  scanPackageForSuspiciousFiles(packageName) {
    const suspiciousFiles = [];
    const packageDir = `node_modules/${packageName}`;

    if (fs.existsSync(packageDir)) {
      const files = this.getAllFiles(packageDir);

      files.forEach((file) => {
        // Check for suspicious file patterns
        if (
          file.includes("bitcoin") ||
          file.includes("miner") ||
          file.includes("wallet") ||
          file.endsWith(".exe") ||
          file.endsWith(".bat")
        ) {
          suspiciousFiles.push(file);
        }
      });
    }

    return suspiciousFiles;
  }

  getAllFiles(dir) {
    const files = [];

    try {
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        const fullPath = `${dir}/${item}`;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath));
        } else {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Directory not accessible
    }

    return files;
  }

  // Generate security policies for CI/CD
  generateSecurityPolicies() {
    const policies = {
      // GitHub Actions security workflow
      githubActions: `
name: Security Audit
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm audit --audit-level high
      - run: npx retire --js --node
      - run: npx snyk test
      `,

      // Package.json security scripts
      packageScripts: {
        "security:audit": "npm audit",
        "security:fix": "npm audit fix",
        "security:check": "npx retire && npx snyk test",
        preinstall: 'npx check-node-version --node ">= 16"',
        postinstall: "npm audit --audit-level moderate",
      },

      // .npmrc security configuration
      npmrcConfig: `
audit-level=moderate
fund=false
save-exact=true
engine-strict=true
`,

      // Dependabot configuration
      dependabotConfig: {
        version: 2,
        updates: [
          {
            "package-ecosystem": "npm",
            directory: "/",
            schedule: {
              interval: "weekly",
              day: "monday",
            },
            reviewers: ["security-team"],
            assignees: ["security-team"],
            "open-pull-requests-limit": 5,
          },
        ],
      },
    };

    console.log("Generated security policies for CI/CD integration");
    return policies;
  }
}

// Example usage and automation
/*
const depSecurity = new DependencySecurityManager();

// Perform comprehensive security audit
depSecurity.performSecurityAudit();

// Set up dependency update security
const updateSecurity = depSecurity.createDependencyUpdateSecurity();

// Example: Check before updating a package
updateSecurity.preUpdateCheck('express', '4.18.2').then(checks => {
  console.log('Pre-update security checks:', checks);
  
  if (!checks.hasVulnerabilities && checks.isMaintained) {
    console.log('Package update approved by security checks');
  } else {
    console.log('Package update blocked by security checks');
  }
});

// Generate CI/CD security policies
const policies = depSecurity.generateSecurityPolicies();
console.log('Security policies generated:', policies);
*/
```

## Summary

### Comprehensive Node.js Security Best Practices:

#### 1. **Authentication & Authorization**

- Strong password policies with bcrypt hashing
- Secure JWT implementation with proper algorithms
- Role-based access control (RBAC)
- Multi-factor authentication
- Rate limiting on authentication endpoints

#### 2. **Input Validation & Sanitization**

- Server-side validation for all inputs
- XSS prevention with proper encoding
- SQL injection prevention with parameterized queries
- File upload security with type and size validation
- Request size limiting

#### 3. **Data Protection**

- Encryption at rest and in transit
- PII protection and masking
- Secure key management and rotation
- Database field encryption
- Data masking for non-production environments

#### 4. **Security Headers & HTTPS**

- Comprehensive security headers (CSP, HSTS, X-Frame-Options)
- HTTPS enforcement with secure TLS configuration
- CSP violation reporting
- Security monitoring and alerting

#### 5. **Dependency Security**

- Regular security audits with npm audit
- Dependency scanning in CI/CD pipelines
- Package integrity verification
- Malicious package detection
- Automated security updates

#### 6. **Infrastructure Security**

- Environment variable protection
- Secure error handling without information leakage
- Logging security events
- Container security
- Network security configurations

### Production Implementation Checklist:

✅ **Authentication**: Implement secure password hashing, JWT tokens, and MFA
✅ **Input Security**: Validate and sanitize all inputs, prevent injection attacks
✅ **Data Protection**: Encrypt sensitive data, manage keys securely
✅ **Web Security**: Apply security headers, enforce HTTPS, implement CSP
✅ **Dependencies**: Audit regularly, scan for vulnerabilities, update securely
✅ **Monitoring**: Log security events, set up alerting, track suspicious activity
✅ **Infrastructure**: Secure configurations, environment protection, access controls

This comprehensive approach ensures enterprise-level security for Node.js applications in production environments.
