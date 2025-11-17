# What is the difference between PUT and PATCH HTTP methods?

PUT and PATCH are both HTTP methods used for updating resources, but they differ fundamentally in how they handle updates and what they expect from the client.

## Key Differences Overview

| Aspect                 | PUT                              | PATCH                         |
| ---------------------- | -------------------------------- | ----------------------------- |
| **Purpose**            | Replace entire resource          | Partial update of resource    |
| **Idempotency**        | Idempotent                       | Should be idempotent          |
| **Payload**            | Complete resource representation | Only fields to be updated     |
| **Safety**             | Not safe (modifies state)        | Not safe (modifies state)     |
| **RFC Standard**       | RFC 7231                         | RFC 5789                      |
| **Overwrite Behavior** | Replaces entire resource         | Updates specified fields only |

## PUT Method - Complete Resource Replacement

PUT is designed to **replace the entire resource** with the provided representation. When you send a PUT request, you're saying "replace whatever exists at this URL with this new representation."

### PUT Characteristics

```javascript
// PUT Example - User Update
const express = require("express");
const app = express();

app.use(express.json());

// Mock user database
let users = {
  1: {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    department: "Engineering",
    phone: "+1234567890",
    address: "123 Main St",
  },
};

// PUT - Replace entire user resource
app.put("/api/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const userData = req.body;

  // Validate required fields for complete resource
  const requiredFields = ["name", "email", "age", "department"];
  const missingFields = requiredFields.filter(
    (field) => !userData.hasOwnProperty(field)
  );

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Missing required fields for PUT operation",
      missingFields: missingFields,
      message: "PUT requires complete resource representation",
    });
  }

  // Check if user exists
  const userExists = users[userId] !== undefined;

  // PUT replaces the entire resource
  users[userId] = {
    id: userId,
    ...userData,
    updatedAt: new Date().toISOString(),
  };

  // Return different status codes based on whether resource existed
  if (userExists) {
    res.status(200).json({
      message: "User updated successfully",
      user: users[userId],
    });
  } else {
    res.status(201).json({
      message: "User created successfully",
      user: users[userId],
    });
  }
});

// Example PUT request body - MUST include all fields
/*
PUT /api/users/1
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "age": 31,
  "department": "Engineering",
  "phone": "+1987654321",
  "address": "456 Oak Ave"
}

// Result: Entire user object is replaced
// If any field is omitted, it will be undefined/missing
*/

app.listen(3000);
```

### PUT Idempotency Example

```javascript
// PUT is idempotent - multiple identical requests produce same result
app.put("/api/products/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  const productData = req.body;

  console.log(
    `PUT request for product ${productId} at ${new Date().toISOString()}`
  );

  // Validate complete product representation
  const requiredFields = ["name", "price", "category", "description", "stock"];
  const hasAllFields = requiredFields.every((field) =>
    productData.hasOwnProperty(field)
  );

  if (!hasAllFields) {
    return res.status(400).json({
      error: "Incomplete product data",
      required: requiredFields,
      received: Object.keys(productData),
    });
  }

  // Replace entire product (idempotent operation)
  const product = {
    id: productId,
    ...productData,
    lastModified: new Date().toISOString(),
  };

  // Store in database (mock)
  products[productId] = product;

  res.status(200).json({
    message: "Product replaced successfully",
    product: product,
  });
});

// Multiple identical PUT requests will produce the same result:
/*
PUT /api/products/123 (Request 1)
PUT /api/products/123 (Request 2) - Same as Request 1
PUT /api/products/123 (Request 3) - Same as Request 1

All three requests will result in the exact same product state
*/
```

## PATCH Method - Partial Resource Update

PATCH is designed to **partially update a resource** by applying a set of changes. You only send the fields that need to be modified.

### PATCH Characteristics

```javascript
// PATCH Example - Partial User Update
app.patch("/api/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const updates = req.body;

  // Check if user exists
  if (!users[userId]) {
    return res.status(404).json({
      error: "User not found",
      message: `User with ID ${userId} does not exist`,
    });
  }

  // Validate that updates object is not empty
  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: "No updates provided",
      message: "PATCH request must include fields to update",
    });
  }

  // Validate allowed fields for update
  const allowedFields = [
    "name",
    "email",
    "age",
    "department",
    "phone",
    "address",
  ];
  const invalidFields = Object.keys(updates).filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      error: "Invalid fields in update",
      invalidFields: invalidFields,
      allowedFields: allowedFields,
    });
  }

  // Apply partial updates to existing user
  const existingUser = users[userId];
  users[userId] = {
    ...existingUser,
    ...updates,
    id: userId, // Ensure ID cannot be changed
    updatedAt: new Date().toISOString(),
  };

  res.status(200).json({
    message: "User partially updated successfully",
    user: users[userId],
    updatedFields: Object.keys(updates),
  });
});

// Example PATCH request body - Only include fields to update
/*
PATCH /api/users/1
Content-Type: application/json

{
  "email": "newemail@example.com",
  "age": 32
}

// Result: Only email and age are updated
// All other fields (name, department, phone, address) remain unchanged
*/
```

### Advanced PATCH Implementation with JSON Patch

```javascript
const jsonpatch = require("jsonpatch");

// JSON Patch format for more complex PATCH operations
app.patch("/api/users/:id/json-patch", (req, res) => {
  const userId = parseInt(req.params.id);
  const patchOperations = req.body;

  if (!users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    // Validate JSON Patch format
    if (!Array.isArray(patchOperations)) {
      return res.status(400).json({
        error: "Invalid JSON Patch format",
        message: "Patch operations must be an array",
      });
    }

    // Apply JSON Patch operations
    const originalUser = { ...users[userId] };
    const patchedUser = jsonpatch.apply_patch(originalUser, patchOperations);

    // Validate the result
    if (!patchedUser.id || patchedUser.id !== userId) {
      return res.status(400).json({
        error: "Invalid patch operation",
        message: "Cannot modify user ID",
      });
    }

    users[userId] = {
      ...patchedUser,
      updatedAt: new Date().toISOString(),
    };

    res.status(200).json({
      message: "User updated with JSON Patch",
      user: users[userId],
      appliedOperations: patchOperations.length,
    });
  } catch (error) {
    res.status(400).json({
      error: "Patch application failed",
      message: error.message,
    });
  }
});

// Example JSON Patch request
/*
PATCH /api/users/1/json-patch
Content-Type: application/json

[
  { "op": "replace", "path": "/email", "value": "updated@example.com" },
  { "op": "add", "path": "/skills", "value": ["Node.js", "React"] },
  { "op": "remove", "path": "/phone" }
]
*/
```

### PATCH with Conflict Resolution

```javascript
// PATCH with optimistic concurrency control
app.patch("/api/users/:id/versioned", (req, res) => {
  const userId = parseInt(req.params.id);
  const updates = req.body;
  const expectedVersion = req.headers["if-match"]; // ETag for version control

  if (!users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }

  const currentUser = users[userId];

  // Check version for optimistic concurrency
  if (expectedVersion && currentUser.version !== expectedVersion) {
    return res.status(409).json({
      error: "Conflict detected",
      message: "Resource has been modified by another request",
      currentVersion: currentUser.version,
      expectedVersion: expectedVersion,
      currentUser: currentUser,
    });
  }

  // Apply updates
  const updatedUser = {
    ...currentUser,
    ...updates,
    id: userId,
    version: generateNewVersion(currentUser.version),
    updatedAt: new Date().toISOString(),
  };

  users[userId] = updatedUser;

  res.set("ETag", updatedUser.version);
  res.status(200).json({
    message: "User updated successfully",
    user: updatedUser,
  });
});

function generateNewVersion(currentVersion) {
  // Simple version increment
  const versionNum = parseInt(currentVersion || "0") + 1;
  return versionNum.toString();
}
```

## Practical Examples and Use Cases

### Complete User Profile Update (PUT)

```javascript
// PUT - Complete profile replacement
app.put("/api/profiles/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    // Validate complete profile structure
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "bio",
      "location",
      "website",
      "skills",
      "experience",
    ];

    const validation = validateCompleteProfile(profileData, requiredFields);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid profile data",
        missingFields: validation.missingFields,
        message: "PUT requires complete profile information",
      });
    }

    // Replace entire profile
    const profile = {
      userId: userId,
      ...profileData,
      lastModified: new Date().toISOString(),
      version: 1,
    };

    // Save to database (mock)
    await saveProfileToDatabase(userId, profile);

    res.status(200).json({
      message: "Profile replaced successfully",
      profile: profile,
    });
  } catch (error) {
    res.status(500).json({
      error: "Profile update failed",
      message: error.message,
    });
  }
});

function validateCompleteProfile(data, requiredFields) {
  const missingFields = requiredFields.filter(
    (field) =>
      !data.hasOwnProperty(field) ||
      data[field] === null ||
      data[field] === undefined
  );

  return {
    valid: missingFields.length === 0,
    missingFields: missingFields,
  };
}
```

### Partial Settings Update (PATCH)

```javascript
// PATCH - Partial settings update
app.patch("/api/settings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const settingsUpdates = req.body;

    // Get current settings
    const currentSettings = await getUserSettings(userId);
    if (!currentSettings) {
      return res.status(404).json({ error: "User settings not found" });
    }

    // Validate update fields
    const allowedSettings = [
      "theme",
      "language",
      "notifications",
      "privacy",
      "emailPreferences",
      "displayPreferences",
    ];

    const invalidFields = Object.keys(settingsUpdates).filter(
      (field) => !allowedSettings.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: "Invalid setting fields",
        invalidFields: invalidFields,
        allowedFields: allowedSettings,
      });
    }

    // Apply partial updates with deep merge for nested objects
    const updatedSettings = deepMerge(currentSettings, settingsUpdates);
    updatedSettings.lastModified = new Date().toISOString();

    // Save updated settings
    await saveUserSettings(userId, updatedSettings);

    res.status(200).json({
      message: "Settings updated successfully",
      settings: updatedSettings,
      updatedFields: Object.keys(settingsUpdates),
    });
  } catch (error) {
    res.status(500).json({
      error: "Settings update failed",
      message: error.message,
    });
  }
});

function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Example PATCH request for settings
/*
PATCH /api/settings/123
Content-Type: application/json

{
  "notifications": {
    "email": true,
    "push": false
  },
  "theme": "dark"
}

// Only updates notifications and theme
// All other settings remain unchanged
*/
```

### File Metadata Updates

```javascript
// File metadata management - demonstrating PUT vs PATCH usage

// PUT - Replace all file metadata
app.put("/api/files/:fileId/metadata", async (req, res) => {
  try {
    const { fileId } = req.params;
    const metadata = req.body;

    // Required metadata for complete replacement
    const requiredMetadata = [
      "title",
      "description",
      "tags",
      "category",
      "permissions",
      "visibility",
    ];

    const hasAllMetadata = requiredMetadata.every((field) =>
      metadata.hasOwnProperty(field)
    );

    if (!hasAllMetadata) {
      return res.status(400).json({
        error: "Incomplete metadata",
        message: "PUT requires all metadata fields",
        required: requiredMetadata,
        provided: Object.keys(metadata),
      });
    }

    // Replace entire metadata
    const newMetadata = {
      fileId: fileId,
      ...metadata,
      lastModified: new Date().toISOString(),
      modifiedBy: req.user.id,
    };

    await replaceFileMetadata(fileId, newMetadata);

    res.status(200).json({
      message: "File metadata replaced",
      metadata: newMetadata,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH - Update specific metadata fields
app.patch("/api/files/:fileId/metadata", async (req, res) => {
  try {
    const { fileId } = req.params;
    const updates = req.body;

    // Get current metadata
    const currentMetadata = await getFileMetadata(fileId);
    if (!currentMetadata) {
      return res.status(404).json({ error: "File not found" });
    }

    // Validate updatable fields
    const updatableFields = [
      "title",
      "description",
      "tags",
      "category",
      "permissions",
    ];

    const invalidUpdates = Object.keys(updates).filter(
      (field) => !updatableFields.includes(field)
    );

    if (invalidUpdates.length > 0) {
      return res.status(400).json({
        error: "Invalid update fields",
        invalidFields: invalidUpdates,
      });
    }

    // Apply partial updates
    const updatedMetadata = {
      ...currentMetadata,
      ...updates,
      lastModified: new Date().toISOString(),
      modifiedBy: req.user.id,
    };

    await updateFileMetadata(fileId, updatedMetadata);

    res.status(200).json({
      message: "File metadata updated",
      metadata: updatedMetadata,
      changedFields: Object.keys(updates),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Error Handling and Validation

### Comprehensive Error Handling for PUT and PATCH

```javascript
// Middleware for request validation
const validateRequest = (method) => {
  return (req, res, next) => {
    const errors = [];

    // Common validations
    if (!req.body || Object.keys(req.body).length === 0) {
      errors.push("Request body is required");
    }

    // Method-specific validations
    if (method === "PUT") {
      // PUT should have complete resource representation
      const contentType = req.headers["content-type"];
      if (!contentType || !contentType.includes("application/json")) {
        errors.push("PUT requires application/json content type");
      }
    }

    if (method === "PATCH") {
      // PATCH should indicate what content format is used
      const contentType = req.headers["content-type"];
      const supportedPatchTypes = [
        "application/json",
        "application/json-patch+json",
        "application/merge-patch+json",
      ];

      if (
        !contentType ||
        !supportedPatchTypes.some((type) => contentType.includes(type))
      ) {
        errors.push(`PATCH requires one of: ${supportedPatchTypes.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Request validation failed",
        errors: errors,
      });
    }

    next();
  };
};

// Apply validation middleware
app.put("/api/resources/:id", validateRequest("PUT"), (req, res) => {
  // PUT handler with validation
});

app.patch("/api/resources/:id", validateRequest("PATCH"), (req, res) => {
  // PATCH handler with validation
});

// Custom error handling for different scenarios
const handleUpdateErrors = (error, req, res, next) => {
  console.error(`${req.method} Error:`, error);

  if (error.name === "ValidationError") {
    res.status(400).json({
      error: "Validation failed",
      details: error.details,
      method: req.method,
    });
  } else if (error.name === "ConflictError") {
    res.status(409).json({
      error: "Resource conflict",
      message: error.message,
      method: req.method,
    });
  } else if (error.name === "NotFoundError") {
    res.status(404).json({
      error: "Resource not found",
      message: `Cannot ${req.method} non-existent resource`,
    });
  } else {
    res.status(500).json({
      error: "Internal server error",
      message: "Update operation failed",
    });
  }
};

app.use(handleUpdateErrors);
```

## Best Practices and Guidelines

### When to Use PUT vs PATCH

```javascript
// API design guidelines for choosing between PUT and PATCH

/**
 * Use PUT when:
 * 1. You want to replace the entire resource
 * 2. You have all required fields for the resource
 * 3. You want idempotent behavior (multiple requests = same result)
 * 4. You're implementing a "save" or "overwrite" operation
 * 5. The client has the complete state of the resource
 */

// Example: Document management system
app.put("/api/documents/:id", (req, res) => {
  const document = req.body;

  // PUT expects complete document
  const requiredFields = ["title", "content", "author", "tags", "metadata"];

  // Replace entire document
  documents[req.params.id] = {
    id: req.params.id,
    ...document,
    version: (documents[req.params.id]?.version || 0) + 1,
    lastModified: new Date().toISOString(),
  };

  res.json({
    message: "Document replaced",
    document: documents[req.params.id],
  });
});

/**
 * Use PATCH when:
 * 1. You want to update only specific fields
 * 2. You don't have the complete resource representation
 * 3. You want to minimize bandwidth usage
 * 4. You're implementing incremental updates
 * 5. The client only knows about changed fields
 */

// Example: User preferences update
app.patch("/api/preferences/:userId", (req, res) => {
  const updates = req.body;

  // PATCH only updates provided fields
  const currentPrefs = preferences[req.params.userId] || {};

  preferences[req.params.userId] = {
    ...currentPrefs,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };

  res.json({
    message: "Preferences updated",
    updatedFields: Object.keys(updates),
    preferences: preferences[req.params.userId],
  });
});
```

### RESTful API Design Patterns

```javascript
// Complete RESTful resource management
const express = require("express");
const router = express.Router();

// Resource: Articles
let articles = {};
let nextId = 1;

// GET - Retrieve resource(s)
router.get("/articles", (req, res) => {
  res.json(Object.values(articles));
});

router.get("/articles/:id", (req, res) => {
  const article = articles[req.params.id];
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }
  res.json(article);
});

// POST - Create new resource
router.post("/articles", (req, res) => {
  const articleData = req.body;
  const id = nextId++;

  const article = {
    id,
    ...articleData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  articles[id] = article;

  res.status(201).json({
    message: "Article created",
    article: article,
  });
});

// PUT - Replace entire resource
router.put("/articles/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const articleData = req.body;

  const requiredFields = ["title", "content", "author", "category"];
  const missingFields = requiredFields.filter((field) => !articleData[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Missing required fields",
      missingFields: missingFields,
    });
  }

  const existingArticle = articles[id];
  const isNewResource = !existingArticle;

  // PUT replaces entire resource
  articles[id] = {
    id,
    ...articleData,
    createdAt: existingArticle?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: (existingArticle?.version || 0) + 1,
  };

  res.status(isNewResource ? 201 : 200).json({
    message: isNewResource ? "Article created" : "Article replaced",
    article: articles[id],
  });
});

// PATCH - Partial update
router.patch("/articles/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;

  const existingArticle = articles[id];
  if (!existingArticle) {
    return res.status(404).json({ error: "Article not found" });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No updates provided" });
  }

  // PATCH updates only specified fields
  articles[id] = {
    ...existingArticle,
    ...updates,
    id, // Ensure ID cannot be changed
    updatedAt: new Date().toISOString(),
    version: existingArticle.version + 1,
  };

  res.json({
    message: "Article updated",
    article: articles[id],
    updatedFields: Object.keys(updates),
  });
});

// DELETE - Remove resource
router.delete("/articles/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (!articles[id]) {
    return res.status(404).json({ error: "Article not found" });
  }

  delete articles[id];

  res.status(204).end(); // No content
});

module.exports = router;
```

## Testing PUT vs PATCH

```javascript
// Test examples for PUT and PATCH operations
const request = require("supertest");
const app = require("../app");

describe("PUT vs PATCH Tests", () => {
  let userId;

  beforeEach(() => {
    // Setup test user
    userId = 1;
  });

  describe("PUT /api/users/:id", () => {
    it("should replace entire user with complete data", async () => {
      const completeUserData = {
        name: "Jane Doe",
        email: "jane@example.com",
        age: 28,
        department: "Marketing",
        phone: "+1555123456",
        address: "789 Pine St",
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(completeUserData)
        .expect(200);

      expect(response.body.user).toMatchObject(completeUserData);
      expect(response.body.user.id).toBe(userId);
    });

    it("should return 400 when missing required fields", async () => {
      const incompleteData = {
        name: "Jane Doe",
        email: "jane@example.com",
        // Missing: age, department, phone, address
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toContain("Missing required fields");
      expect(response.body.missingFields).toHaveLength(4);
    });

    it("should be idempotent - multiple identical requests produce same result", async () => {
      const userData = {
        name: "John Smith",
        email: "john@example.com",
        age: 30,
        department: "Engineering",
        phone: "+1234567890",
        address: "123 Main St",
      };

      // First request
      const response1 = await request(app)
        .put(`/api/users/${userId}`)
        .send(userData)
        .expect(200);

      // Second identical request
      const response2 = await request(app)
        .put(`/api/users/${userId}`)
        .send(userData)
        .expect(200);

      // Results should be identical (ignoring timestamps)
      expect(response1.body.user.name).toBe(response2.body.user.name);
      expect(response1.body.user.email).toBe(response2.body.user.email);
    });
  });

  describe("PATCH /api/users/:id", () => {
    it("should update only specified fields", async () => {
      // First, create a user with PUT
      await request(app).put(`/api/users/${userId}`).send({
        name: "Original Name",
        email: "original@example.com",
        age: 25,
        department: "Sales",
        phone: "+1111111111",
        address: "Original Address",
      });

      // Then update only email and age with PATCH
      const updates = {
        email: "updated@example.com",
        age: 26,
      };

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .send(updates)
        .expect(200);

      // Only specified fields should be updated
      expect(response.body.user.email).toBe("updated@example.com");
      expect(response.body.user.age).toBe(26);

      // Other fields should remain unchanged
      expect(response.body.user.name).toBe("Original Name");
      expect(response.body.user.department).toBe("Sales");
      expect(response.body.user.phone).toBe("+1111111111");
      expect(response.body.user.address).toBe("Original Address");

      expect(response.body.updatedFields).toEqual(["email", "age"]);
    });

    it("should return 404 for non-existent user", async () => {
      const updates = { name: "New Name" };

      const response = await request(app)
        .patch("/api/users/999")
        .send(updates)
        .expect(404);

      expect(response.body.error).toContain("User not found");
    });

    it("should return 400 for empty update", async () => {
      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain("No updates provided");
    });

    it("should validate field permissions", async () => {
      const invalidUpdates = {
        id: 999, // Should not be allowed
        invalidField: "value",
      };

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body.error).toContain("Invalid fields");
    });
  });

  describe("Idempotency Comparison", () => {
    it("should demonstrate PUT idempotency vs PATCH non-idempotency", async () => {
      // Setup initial user
      const initialUser = {
        name: "Test User",
        email: "test@example.com",
        age: 30,
        department: "Engineering",
        phone: "+1234567890",
        address: "123 Test St",
      };

      await request(app).put(`/api/users/${userId}`).send(initialUser);

      // PUT - Idempotent
      const putData = { ...initialUser, age: 31 };
      const put1 = await request(app).put(`/api/users/${userId}`).send(putData);
      const put2 = await request(app).put(`/api/users/${userId}`).send(putData);

      expect(put1.body.user.age).toBe(put2.body.user.age);

      // PATCH - Can be made idempotent with proper implementation
      const patchData = { age: 32 };
      const patch1 = await request(app)
        .patch(`/api/users/${userId}`)
        .send(patchData);
      const patch2 = await request(app)
        .patch(`/api/users/${userId}`)
        .send(patchData);

      expect(patch1.body.user.age).toBe(patch2.body.user.age);
      expect(patch1.body.user.age).toBe(32);
    });
  });
});
```

## Summary

### PUT Method Summary:

- **Complete Resource Replacement**: Replaces the entire resource with provided data
- **Idempotent**: Multiple identical requests produce the same result
- **Requires Complete Data**: Must include all required fields for the resource
- **Create or Replace**: Can create new resources if they don't exist
- **HTTP Status**: 200 (OK) for updates, 201 (Created) for new resources

### PATCH Method Summary:

- **Partial Updates**: Updates only the specified fields
- **Bandwidth Efficient**: Sends only changed data
- **Flexible**: Allows various patch formats (JSON, JSON Patch, Merge Patch)
- **Existing Resource Only**: Typically requires resource to exist
- **HTTP Status**: 200 (OK) for successful updates, 404 if resource not found

### Best Practices:

1. **Use PUT** for complete resource replacement when you have all required data
2. **Use PATCH** for partial updates when you only want to change specific fields
3. **Validate appropriately** - PUT needs complete data, PATCH needs valid field subset
4. **Implement proper error handling** for both methods
5. **Consider idempotency** in your implementation design
6. **Use appropriate HTTP status codes** to indicate operation results
7. **Document your API clearly** to indicate expected behavior for each method

The choice between PUT and PATCH depends on your specific use case, data requirements, and API design goals.
