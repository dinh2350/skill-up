# What is request validation and how do you implement it?

Request validation is the process of verifying that incoming HTTP requests meet specific criteria before processing them. It ensures data integrity, security, and prevents errors by checking request structure, data types, formats, and business rules.

## Why Request Validation is Important

### Security Benefits

- **Prevents injection attacks** (SQL injection, NoSQL injection)
- **Blocks malformed data** that could crash the application
- **Enforces data boundaries** and prevents buffer overflows
- **Validates file uploads** and prevents malicious files

### Data Integrity Benefits

- **Ensures consistent data format** across the application
- **Prevents corrupted data** from entering the database
- **Enforces business rules** at the API level
- **Provides clear error messages** for invalid requests

## Types of Request Validation

### 1. Schema Validation

Validates the structure and data types of request data.

### 2. Business Rules Validation

Enforces application-specific logic and constraints.

### 3. Authentication Validation

Verifies user identity and permissions.

### 4. Rate Limiting Validation

Prevents abuse and ensures fair usage.

## Manual Validation Implementation

### Basic Express Validation

```javascript
const express = require("express");
const app = express();

app.use(express.json());

// Manual validation middleware
const validateUser = (req, res, next) => {
  const { name, email, age } = req.body;
  const errors = [];

  // Required field validation
  if (!name || typeof name !== "string") {
    errors.push("Name is required and must be a string");
  }

  if (!email || typeof email !== "string") {
    errors.push("Email is required and must be a string");
  }

  if (age === undefined || typeof age !== "number") {
    errors.push("Age is required and must be a number");
  }

  // Format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push("Email must be a valid email address");
  }

  // Range validation
  if (age && (age < 0 || age > 120)) {
    errors.push("Age must be between 0 and 120");
  }

  // String length validation
  if (name && (name.length < 2 || name.length > 50)) {
    errors.push("Name must be between 2 and 50 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

app.post("/users", validateUser, (req, res) => {
  const { name, email, age } = req.body;
  res.json({
    message: "User created successfully",
    user: { name, email, age },
  });
});

app.listen(3000);
```

### Advanced Manual Validation

```javascript
const express = require("express");
const app = express();

app.use(express.json({ limit: "10mb" }));

class RequestValidator {
  static validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  static validatePhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  static validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static sanitizeString(str) {
    if (typeof str !== "string") return str;
    // Remove HTML tags and escape special characters
    return str.replace(/<[^>]*>/g, "").replace(/[&<>"']/g, (match) => {
      const escapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
      };
      return escapeMap[match];
    });
  }
}

const validateUserRegistration = (req, res, next) => {
  const { email, password, firstName, lastName, phone, website, birthDate } =
    req.body;
  const errors = [];

  // Required fields
  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");
  if (!firstName) errors.push("First name is required");
  if (!lastName) errors.push("Last name is required");

  // Format validation
  if (email && !RequestValidator.validateEmail(email)) {
    errors.push("Invalid email format");
  }

  if (password && !RequestValidator.validatePassword(password)) {
    errors.push(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
    );
  }

  if (phone && !RequestValidator.validatePhoneNumber(phone)) {
    errors.push("Invalid phone number format");
  }

  if (website && !RequestValidator.validateURL(website)) {
    errors.push("Invalid website URL");
  }

  if (birthDate && !RequestValidator.validateDate(birthDate)) {
    errors.push("Invalid birth date");
  }

  // Business logic validation
  if (birthDate) {
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    if (currentYear - birthYear < 13) {
      errors.push("User must be at least 13 years old");
    }
  }

  // Sanitize strings
  if (firstName)
    req.body.firstName = RequestValidator.sanitizeString(firstName);
  if (lastName) req.body.lastName = RequestValidator.sanitizeString(lastName);

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

app.post("/register", validateUserRegistration, (req, res) => {
  res.json({
    message: "User registered successfully",
    user: {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    },
  });
});
```

## Using Joi for Schema Validation

### Basic Joi Implementation

```javascript
const express = require("express");
const Joi = require("joi");
const app = express();

app.use(express.json());

// User schema definition
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  age: Joi.number().integer().min(0).max(120).required().messages({
    "number.min": "Age must be a positive number",
    "number.max": "Age cannot exceed 120",
    "any.required": "Age is required",
  }),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),

  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    zipCode: Joi.string()
      .pattern(/^\d{5}(-\d{4})?$/)
      .required(),
    country: Joi.string().min(2).max(2).required(),
  }).optional(),
});

// Joi validation middleware
const validateWithJoi = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Get all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context.value,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errorDetails,
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

app.post("/users", validateWithJoi(userSchema), (req, res) => {
  res.json({
    message: "User created successfully",
    user: req.body,
  });
});
```

### Advanced Joi Validation

```javascript
const Joi = require("joi");

// Product schema with complex validation
const productSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),

  description: Joi.string().trim().max(1000).optional(),

  price: Joi.number().positive().precision(2).required(),

  category: Joi.string()
    .valid("electronics", "clothing", "books", "home", "sports")
    .required(),

  tags: Joi.array()
    .items(Joi.string().trim().min(2))
    .max(10)
    .unique()
    .optional(),

  specifications: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number()))
    .optional(),

  availability: Joi.object({
    inStock: Joi.boolean().required(),
    quantity: Joi.when("inStock", {
      is: true,
      then: Joi.number().integer().min(1).required(),
      otherwise: Joi.number().valid(0).optional(),
    }),
    restockDate: Joi.when("inStock", {
      is: false,
      then: Joi.date().min("now").optional(),
      otherwise: Joi.forbidden(),
    }),
  }).required(),

  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().max(100).optional(),
        isPrimary: Joi.boolean().default(false),
      })
    )
    .min(1)
    .max(5)
    .custom((value, helpers) => {
      // Ensure only one primary image
      const primaryImages = value.filter((img) => img.isPrimary);
      if (primaryImages.length > 1) {
        return helpers.error("images.multiplePrimary");
      }
      return value;
    })
    .messages({
      "images.multiplePrimary": "Only one image can be marked as primary",
    }),

  metadata: Joi.object({
    createdBy: Joi.string().required(),
    version: Joi.string()
      .pattern(/^\d+\.\d+\.\d+$/)
      .default("1.0.0"),
    lastModified: Joi.date().default(() => new Date(), "current date"),
  }).default(),
});

// Custom validation functions
const customValidators = {
  validateUniqueSKU: async (sku) => {
    // Mock database check
    const existingSKU = await checkSKUInDatabase(sku);
    return !existingSKU;
  },

  validateImageAccessibility: async (images) => {
    for (const image of images) {
      try {
        // Check if image URL is accessible
        const response = await fetch(image.url, { method: "HEAD" });
        if (!response.ok) {
          throw new Error(`Image at ${image.url} is not accessible`);
        }
      } catch (error) {
        return false;
      }
    }
    return true;
  },
};

async function checkSKUInDatabase(sku) {
  // Mock implementation
  return false;
}

// Extended validation middleware with async checks
const validateProductWithAsync = async (req, res, next) => {
  try {
    // First, validate with Joi schema
    const { error, value } = productSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        error: "Schema validation failed",
        details: errorDetails,
      });
    }

    // Async business rule validations
    const asyncErrors = [];

    // Check SKU uniqueness (if provided)
    if (value.sku) {
      const isUniqueSKU = await customValidators.validateUniqueSKU(value.sku);
      if (!isUniqueSKU) {
        asyncErrors.push("SKU already exists");
      }
    }

    // Validate image accessibility
    if (value.images) {
      const areImagesAccessible =
        await customValidators.validateImageAccessibility(value.images);
      if (!areImagesAccessible) {
        asyncErrors.push("One or more images are not accessible");
      }
    }

    if (asyncErrors.length > 0) {
      return res.status(400).json({
        error: "Business rule validation failed",
        details: asyncErrors,
      });
    }

    req.body = value;
    next();
  } catch (error) {
    res.status(500).json({
      error: "Validation process failed",
      message: error.message,
    });
  }
};

app.post("/products", validateProductWithAsync, (req, res) => {
  res.json({
    message: "Product created successfully",
    product: req.body,
  });
});
```

## Using Express-Validator

### Basic Express-Validator Implementation

```javascript
const express = require("express");
const { body, validationResult, param, query } = require("express-validator");
const app = express();

app.use(express.json());

// Validation rules
const userValidationRules = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("Must be a valid email")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain uppercase, lowercase, number, and special character"
      ),

    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters")
      .escape(), // Sanitize HTML

    body("age")
      .isInt({ min: 0, max: 120 })
      .withMessage("Age must be between 0 and 120")
      .toInt(),

    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Must be a valid phone number"),

    body("website").optional().isURL().withMessage("Must be a valid URL"),

    body("birthDate")
      .optional()
      .isISO8601()
      .withMessage("Must be a valid date")
      .custom((value) => {
        const birthYear = new Date(value).getFullYear();
        const currentYear = new Date().getFullYear();
        if (currentYear - birthYear < 13) {
          throw new Error("User must be at least 13 years old");
        }
        return true;
      }),
  ];
};

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

app.post("/users", userValidationRules(), validate, (req, res) => {
  res.json({
    message: "User created successfully",
    user: req.body,
  });
});

// Parameter validation
app.get(
  "/users/:id",
  param("id").isMongoId().withMessage("Invalid user ID format"),
  validate,
  (req, res) => {
    res.json({ userId: req.params.id });
  }
);

// Query parameter validation
app.get(
  "/users",
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sort")
    .optional()
    .isIn(["name", "email", "createdAt"])
    .withMessage("Invalid sort field"),
  validate,
  (req, res) => {
    res.json({
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: req.query.sort || "createdAt",
    });
  }
);
```

### Advanced Express-Validator with Custom Validators

```javascript
const { body, param, validationResult, Meta } = require("express-validator");

// Custom validators
const customValidators = {
  isUniqueEmail: async (email) => {
    // Mock database check
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error("Email already in use");
    }
    return true;
  },

  isStrongPassword: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    if (
      password.length < minLength ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumbers ||
      !hasNonalphas
    ) {
      throw new Error("Password does not meet strength requirements");
    }
    return true;
  },

  isValidAge: (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    if (age < 13 || age > 120) {
      throw new Error("Age must be between 13 and 120 years");
    }
    return true;
  },
};

async function findUserByEmail(email) {
  // Mock implementation
  return null;
}

// Advanced validation rules with conditionals
const advancedUserValidation = () => {
  return [
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail()
      .custom(customValidators.isUniqueEmail),

    body("password").custom(customValidators.isStrongPassword),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),

    body("firstName")
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage("First name must be between 2 and 30 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("First name can only contain letters and spaces")
      .escape(),

    body("lastName")
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage("Last name must be between 2 and 30 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Last name can only contain letters and spaces")
      .escape(),

    body("birthDate")
      .isISO8601()
      .withMessage("Invalid date format")
      .custom(customValidators.isValidAge),

    body("preferences")
      .optional()
      .isObject()
      .withMessage("Preferences must be an object"),

    body("preferences.newsletter")
      .optional()
      .isBoolean()
      .withMessage("Newsletter preference must be boolean"),

    body("preferences.notifications")
      .optional()
      .isObject()
      .withMessage("Notifications must be an object"),

    body("preferences.notifications.email").optional().isBoolean(),

    body("preferences.notifications.sms").optional().isBoolean(),

    // Conditional validation
    body("phone")
      .if(body("preferences.notifications.sms").equals(true))
      .isMobilePhone()
      .withMessage("Phone number required for SMS notifications"),

    body("address").optional().isObject(),

    body("address.street")
      .if(body("address").exists())
      .notEmpty()
      .withMessage("Street is required when address is provided"),

    body("address.city")
      .if(body("address").exists())
      .notEmpty()
      .withMessage("City is required when address is provided"),

    body("address.zipCode")
      .if(body("address").exists())
      .matches(/^\d{5}(-\d{4})?$/)
      .withMessage("Invalid ZIP code format"),
  ];
};

app.post("/users/advanced", advancedUserValidation(), validate, (req, res) => {
  // Remove confirmPassword from the response
  const { confirmPassword, ...userData } = req.body;

  res.json({
    message: "User created successfully",
    user: userData,
  });
});
```

## Using Yup for Schema Validation

### Basic Yup Implementation

```javascript
const express = require("express");
const yup = require("yup");
const app = express();

app.use(express.json());

// Yup schema definition
const userSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .required("Name is required"),

  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),

  age: yup
    .number()
    .integer("Age must be an integer")
    .min(0, "Age cannot be negative")
    .max(120, "Age cannot exceed 120")
    .required("Age is required"),

  phone: yup
    .string()
    .matches(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .nullable(),

  address: yup
    .object({
      street: yup.string().required("Street is required"),
      city: yup.string().required("City is required"),
      zipCode: yup
        .string()
        .matches(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format")
        .required("ZIP code is required"),
      country: yup
        .string()
        .length(2, "Country code must be 2 characters")
        .required("Country is required"),
    })
    .nullable(),

  preferences: yup
    .object({
      newsletter: yup.boolean().default(false),
      notifications: yup
        .object({
          email: yup.boolean().default(true),
          sms: yup.boolean().default(false),
        })
        .default({}),
    })
    .default({}),
});

// Yup validation middleware
const validateWithYup = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate and transform data
      const validatedData = await schema.validate(req.body, {
        abortEarly: false, // Get all validation errors
        stripUnknown: true, // Remove unknown fields
      });

      req.body = validatedData;
      next();
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(500).json({
        error: "Validation process failed",
        message: error.message,
      });
    }
  };
};

app.post("/users", validateWithYup(userSchema), (req, res) => {
  res.json({
    message: "User created successfully",
    user: req.body,
  });
});
```

### Advanced Yup with Custom Methods

```javascript
const yup = require("yup");

// Add custom validation methods
yup.addMethod(yup.string, "strongPassword", function (message) {
  return this.test("strong-password", message, function (value) {
    if (!value) return false;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasNonalphas = /\W/.test(value);

    return (
      value.length >= 8 &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasNonalphas
    );
  });
});

yup.addMethod(yup.string, "uniqueEmail", function (message) {
  return this.test("unique-email", message, async function (value) {
    if (!value) return true;

    // Mock async validation
    const existingUser = await findUserByEmail(value);
    return !existingUser;
  });
});

// Complex schema with relationships
const orderSchema = yup.object({
  customerId: yup
    .string()
    .uuid("Invalid customer ID format")
    .required("Customer ID is required"),

  items: yup
    .array()
    .of(
      yup.object({
        productId: yup.string().uuid().required(),
        quantity: yup.number().integer().min(1).required(),
        price: yup.number().positive().required(),
        discountPercent: yup.number().min(0).max(100).default(0),
      })
    )
    .min(1, "At least one item is required")
    .required(),

  shipping: yup
    .object({
      method: yup
        .string()
        .oneOf(["standard", "express", "overnight"], "Invalid shipping method")
        .required(),

      address: yup
        .object({
          line1: yup.string().required(),
          line2: yup.string().nullable(),
          city: yup.string().required(),
          state: yup.string().required(),
          zipCode: yup
            .string()
            .matches(/^\d{5}(-\d{4})?$/)
            .required(),
          country: yup.string().length(2).required(),
        })
        .required(),
    })
    .required(),

  payment: yup
    .object({
      method: yup
        .string()
        .oneOf(["credit_card", "paypal", "bank_transfer"])
        .required(),

      creditCard: yup
        .object({
          number: yup
            .string()
            .matches(/^\d{13,19}$/, "Invalid credit card number")
            .when("$paymentMethod", {
              is: "credit_card",
              then: (schema) => schema.required(),
              otherwise: (schema) => schema.notRequired(),
            }),

          expiryMonth: yup
            .number()
            .integer()
            .min(1)
            .max(12)
            .when("$paymentMethod", {
              is: "credit_card",
              then: (schema) => schema.required(),
              otherwise: (schema) => schema.notRequired(),
            }),

          expiryYear: yup
            .number()
            .integer()
            .min(new Date().getFullYear())
            .when("$paymentMethod", {
              is: "credit_card",
              then: (schema) => schema.required(),
              otherwise: (schema) => schema.notRequired(),
            }),

          cvv: yup
            .string()
            .matches(/^\d{3,4}$/, "Invalid CVV")
            .when("$paymentMethod", {
              is: "credit_card",
              then: (schema) => schema.required(),
              otherwise: (schema) => schema.notRequired(),
            }),
        })
        .when("method", {
          is: "credit_card",
          then: (schema) => schema.required(),
          otherwise: (schema) => schema.notRequired(),
        }),
    })
    .required(),

  couponCode: yup
    .string()
    .nullable()
    .test("valid-coupon", "Invalid coupon code", async function (value) {
      if (!value) return true;

      // Mock coupon validation
      const isValidCoupon = await validateCouponCode(value);
      return isValidCoupon;
    }),

  notes: yup.string().max(500, "Notes cannot exceed 500 characters").nullable(),
});

async function validateCouponCode(code) {
  // Mock implementation
  return ["SAVE10", "WELCOME20", "FREESHIP"].includes(code);
}

// Validation with context
const validateOrderWithContext = async (req, res, next) => {
  try {
    const context = {
      paymentMethod: req.body.payment?.method,
    };

    const validatedData = await orderSchema.validate(req.body, {
      abortEarly: false,
      context,
    });

    // Additional business logic validation
    const totalAmount = validatedData.items.reduce((sum, item) => {
      const discountedPrice = item.price * (1 - item.discountPercent / 100);
      return sum + discountedPrice * item.quantity;
    }, 0);

    if (totalAmount < 0.01) {
      return res.status(400).json({
        error: "Validation failed",
        details: ["Order total must be at least $0.01"],
      });
    }

    req.body = validatedData;
    req.orderTotal = totalAmount;
    next();
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(500).json({
      error: "Validation process failed",
      message: error.message,
    });
  }
};

app.post("/orders", validateOrderWithContext, (req, res) => {
  res.json({
    message: "Order created successfully",
    order: req.body,
    total: req.orderTotal,
  });
});
```

## File Upload Validation

### Multer with Validation

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const app = express();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (
    allowedTypes.includes(file.mimetype) &&
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Maximum 5 files
  },
  fileFilter: fileFilter,
});

// File validation middleware
const validateFileUpload = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: "No files uploaded",
    });
  }

  const errors = [];

  req.files.forEach((file, index) => {
    // Check file size again (redundant but safe)
    if (file.size > 5 * 1024 * 1024) {
      errors.push(`File ${index + 1}: Size exceeds 5MB`);
    }

    // Check file dimensions (for images)
    if (file.mimetype.startsWith("image/")) {
      // Note: You'd need sharp or similar library to check dimensions
      // This is a placeholder for dimension checking logic
    }

    // Check for malicious content patterns
    const suspiciousPatterns = [/<script/i, /javascript:/i, /vbscript:/i];
    const fileContent = file.buffer.toString(
      "utf8",
      0,
      Math.min(1024, file.buffer.length)
    );

    if (suspiciousPatterns.some((pattern) => pattern.test(fileContent))) {
      errors.push(`File ${index + 1}: Contains suspicious content`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      error: "File validation failed",
      details: errors,
    });
  }

  next();
};

app.post(
  "/upload",
  upload.array("images", 5),
  validateFileUpload,
  (req, res) => {
    res.json({
      message: "Files uploaded successfully",
      files: req.files.map((file) => ({
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      })),
    });
  }
);

// Error handling for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = "File upload error";

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = "File size too large (max 5MB)";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files (max 5)";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        break;
      default:
        message = error.message;
    }

    return res.status(400).json({
      error: "Upload failed",
      message: message,
    });
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({
      error: "Upload failed",
      message: error.message,
    });
  }

  next(error);
});
```

## Comprehensive Validation Strategy

### Layered Validation Architecture

```javascript
const express = require("express");
const Joi = require("joi");
const app = express();

app.use(express.json({ limit: "10mb" }));

class ValidationLayer {
  // Layer 1: Request structure validation
  static validateRequestStructure() {
    return (req, res, next) => {
      const contentType = req.headers["content-type"];

      if (req.method === "POST" || req.method === "PUT") {
        if (!contentType || !contentType.includes("application/json")) {
          return res.status(400).json({
            error: "Invalid content type",
            expected: "application/json",
          });
        }
      }

      // Check for required headers
      const requiredHeaders = ["user-agent"];
      const missingHeaders = requiredHeaders.filter(
        (header) => !req.headers[header]
      );

      if (missingHeaders.length > 0) {
        return res.status(400).json({
          error: "Missing required headers",
          missing: missingHeaders,
        });
      }

      next();
    };
  }

  // Layer 2: Schema validation
  static validateSchema(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        return res.status(400).json({
          error: "Schema validation failed",
          details: error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        });
      }

      req.validatedBody = value;
      next();
    };
  }

  // Layer 3: Business rules validation
  static validateBusinessRules(rules) {
    return async (req, res, next) => {
      try {
        const errors = [];

        for (const rule of rules) {
          const result = await rule(req.validatedBody, req);
          if (result !== true) {
            errors.push(result);
          }
        }

        if (errors.length > 0) {
          return res.status(400).json({
            error: "Business rule validation failed",
            details: errors,
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          error: "Business rule validation error",
          message: error.message,
        });
      }
    };
  }

  // Layer 4: Security validation
  static validateSecurity() {
    return (req, res, next) => {
      const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload|onerror|onclick/gi,
        /(union|select|insert|delete|update|drop|create|alter|exec|execute)/gi,
      ];

      const checkForPatterns = (obj, path = "") => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (typeof value === "string") {
            for (const pattern of suspiciousPatterns) {
              if (pattern.test(value)) {
                return {
                  field: currentPath,
                  message: "Potentially malicious content detected",
                  pattern: pattern.source,
                };
              }
            }
          } else if (typeof value === "object" && value !== null) {
            const result = checkForPatterns(value, currentPath);
            if (result) return result;
          }
        }
        return null;
      };

      if (req.validatedBody) {
        const securityViolation = checkForPatterns(req.validatedBody);
        if (securityViolation) {
          return res.status(400).json({
            error: "Security validation failed",
            details: [securityViolation],
          });
        }
      }

      next();
    };
  }
}

// Example business rules
const userBusinessRules = [
  async (data, req) => {
    if (data.email) {
      const existingUser = await findUserByEmail(data.email);
      if (existingUser) {
        return "Email already in use";
      }
    }
    return true;
  },

  async (data, req) => {
    if (data.age < 13) {
      return "User must be at least 13 years old";
    }
    return true;
  },

  async (data, req) => {
    // Rate limiting check
    const userIP = req.ip;
    const recentRequests = await getRecentRequestsForIP(userIP);
    if (recentRequests > 10) {
      return "Too many registration attempts from this IP";
    }
    return true;
  },
];

// Mock functions
async function findUserByEmail(email) {
  return null;
}

async function getRecentRequestsForIP(ip) {
  return 5;
}

// User schema
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
  age: Joi.number().integer().min(0).max(120).required(),
});

// Apply all validation layers
app.post(
  "/users",
  ValidationLayer.validateRequestStructure(),
  ValidationLayer.validateSchema(userSchema),
  ValidationLayer.validateBusinessRules(userBusinessRules),
  ValidationLayer.validateSecurity(),
  (req, res) => {
    res.json({
      message: "User created successfully",
      user: req.validatedBody,
    });
  }
);

// Global error handler
app.use((error, req, res, next) => {
  console.error("Validation error:", error);

  res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred during validation",
  });
});
```

## Testing Request Validation

### Validation Test Suite

```javascript
// test/validation.test.js
const request = require("supertest");
const express = require("express");

describe("Request Validation", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Apply validation middleware here
    app.post("/users", validateUser, (req, res) => {
      res.json({ message: "Success" });
    });
  });

  describe("Valid Requests", () => {
    test("should accept valid user data", async () => {
      const validUser = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const response = await request(app).post("/users").send(validUser);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Success");
    });
  });

  describe("Invalid Requests", () => {
    test("should reject missing required fields", async () => {
      const invalidUser = {
        name: "John Doe",
        // Missing email and age
      };

      const response = await request(app).post("/users").send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toContain("Email is required");
    });

    test("should reject invalid email format", async () => {
      const invalidUser = {
        name: "John Doe",
        email: "invalid-email",
        age: 30,
      };

      const response = await request(app).post("/users").send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.details).toContain(
        "Email must be a valid email address"
      );
    });

    test("should reject age out of range", async () => {
      const invalidUser = {
        name: "John Doe",
        email: "john@example.com",
        age: -5,
      };

      const response = await request(app).post("/users").send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.details).toContain("Age must be between 0 and 120");
    });
  });
});
```

## Summary

### Request Validation Best Practices:

1. **Layer validation** from basic structure to complex business rules
2. **Use established libraries** (Joi, Express-validator, Yup) over manual validation
3. **Sanitize input** to prevent XSS and injection attacks
4. **Provide clear error messages** for better debugging and user experience
5. **Validate at multiple levels**: request structure, schema, business rules, security
6. **Handle async validation** for database checks and external API calls
7. **Test thoroughly** with valid, invalid, and edge case scenarios
8. **Log validation errors** for monitoring and debugging
9. **Return consistent error formats** across all endpoints
10. **Consider performance** for high-traffic applications

### Validation Hierarchy:

1. **Request Structure** - Content-Type, headers, basic format
2. **Schema Validation** - Data types, formats, required fields
3. **Business Rules** - Application-specific logic and constraints
4. **Security Validation** - Malicious content detection
5. **Authorization** - User permissions and access control

Request validation is fundamental to building secure, reliable, and maintainable APIs that protect against malicious input and ensure data integrity throughout the application.
