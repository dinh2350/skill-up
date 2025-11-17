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
        throw new Error("Invalid signature");
      }
    },
  })
);

function verifySignature(body, signature) {
  // Mock signature verification
  return signature === "valid-signature";
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
    });
  }

  if (err.type === "entity.too.large") {
    // Handle payload too large errors
    return res.status(413).json({
      error: "Payload too large",
      message: "Request body exceeds size limit",
    });
  }

  if (err.type === "entity.parse.failed") {
    // Handle parsing errors
    return res.status(400).json({
      error: "Parse error",
      message: "Failed to parse request body",
    });
  }

  next(err);
});

app.post("/api/test", (req, res) => {
  res.json({
    message: "Data received successfully",
    body: req.body,
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
const xmlParser = (req, res, next) => {
  if (req.headers["content-type"] === "application/xml") {
    let data = "";

    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        // Simple XML parsing (use a proper XML parser in production)
        req.body = parseXML(data);
        next();
      } catch (error) {
        const err = new Error("Invalid XML format");
        err.status = 400;
        next(err);
      }
    });

    req.on("error", (error) => {
      next(error);
    });
  } else {
    next();
  }
};

// Custom CSV parser
const csvParser = (req, res, next) => {
  if (req.headers["content-type"] === "text/csv") {
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
  } else {
    next();
  }
};

// Mock parsing functions
function parseXML(xmlString) {
  // In production, use a proper XML parser like xml2js
  return { xml: xmlString, parsed: true };
}

function parseCSV(csvString) {
  // In production, use a proper CSV parser like csv-parser
  const lines = csvString.split("\n");
  const headers = lines[0].split(",");
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = values[index]?.trim() || "";
      return obj;
    }, {});
  });
  return rows;
}

// Use custom parsers
app.use(xmlParser);
app.use(csvParser);

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

app.listen(3000);
```

# How do you handle file uploads in Node.js?

File uploads in Node.js can be handled using various approaches, from built-in modules to specialized middleware. The most common and robust approach is using Multer middleware, which is built on top of Busboy for handling `multipart/form-data`.

## Using Multer for File Uploads

### Basic Multer Setup

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const app = express();

// Basic multer configuration
const upload = multer({
  dest: "uploads/", // Files will be saved to uploads/ directory
});

// Single file upload
app.post("/upload/single", upload.single("avatar"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("File info:", req.file);
  console.log("Form data:", req.body);

  res.json({
    message: "File uploaded successfully",
    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

// Multiple files upload
app.post("/upload/multiple", upload.array("photos", 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  res.json({
    message: `${req.files.length} files uploaded successfully`,
    files: req.files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
    })),
  });
});

// Multiple fields with different file counts
app.post(
  "/upload/mixed",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "gallery", maxCount: 8 },
  ]),
  (req, res) => {
    res.json({
      message: "Mixed files uploaded",
      avatar: req.files["avatar"] ? req.files["avatar"][0] : null,
      gallery: req.files["gallery"] || [],
      formData: req.body,
    });
  }
);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### Advanced Multer Configuration

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const app = express();

// Ensure upload directories exist
const uploadDir = "uploads";
const profileDir = path.join(uploadDir, "profiles");
const documentDir = path.join(uploadDir, "documents");

[uploadDir, profileDir, documentDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Custom storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Dynamic destination based on file type or user preference
    if (file.fieldname === "avatar") {
      cb(null, profileDir);
    } else if (file.fieldname === "document") {
      cb(null, documentDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, "_");

    cb(null, `${sanitizedBaseName}_${uniqueSuffix}${fileExtension}`);
  },
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  console.log("Processing file:", file.originalname, "Type:", file.mimetype);

  // Define allowed file types
  const allowedTypes = {
    avatar: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    data: [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  };

  const fieldAllowedTypes =
    allowedTypes[file.fieldname] || allowedTypes["avatar"];

  if (fieldAllowedTypes.includes(file.mimetype)) {
    // Additional file extension check for security
    const allowedExtensions = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    };

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const validExtensions = allowedExtensions[file.mimetype] || [];

    if (validExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file extension for ${
            file.mimetype
          }. Expected: ${validExtensions.join(", ")}`
        )
      );
    }
  } else {
    cb(
      new Error(
        `File type ${file.mimetype} not allowed for field ${file.fieldname}`
      )
    );
  }
};

// Create multer instance with advanced configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files
    fields: 20, // Maximum 20 form fields
    fieldNameSize: 50, // Maximum field name size
    fieldSize: 1024 * 1024, // Maximum field value size (1MB)
  },
});

// Upload endpoints with validation
app.post("/upload/profile", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No avatar file provided" });
    }

    // Additional server-side validation
    const validationResult = await validateUploadedFile(req.file);
    if (!validationResult.valid) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: "File validation failed",
        details: validationResult.errors,
      });
    }

    // Process the file (resize, optimize, etc.)
    const processedFile = await processProfileImage(req.file);

    res.json({
      message: "Profile picture uploaded successfully",
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        path: req.file.path,
        processed: processedFile,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      message: error.message,
    });
  }
});

app.post("/upload/documents", upload.array("document", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No documents provided" });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const validation = await validateUploadedFile(file);
        if (validation.valid) {
          const processed = await processDocument(file);
          results.push({
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            processed: processed,
          });
        } else {
          fs.unlinkSync(file.path); // Clean up invalid file
          errors.push({
            file: file.originalname,
            errors: validation.errors,
          });
        }
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Processed ${results.length} documents`,
      success: results,
      errors: errors,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Upload processing failed",
      message: error.message,
    });
  }
});

// File validation functions
async function validateUploadedFile(file) {
  const errors = [];

  // Check file size
  if (file.size > 10 * 1024 * 1024) {
    errors.push("File size exceeds 10MB limit");
  }

  // Check if file actually exists
  if (!fs.existsSync(file.path)) {
    errors.push("File was not properly saved");
  }

  // Validate file content (basic magic number check)
  const fileBuffer = fs.readFileSync(file.path);
  const isValidFile = await validateFileContent(fileBuffer, file.mimetype);
  if (!isValidFile) {
    errors.push("File content does not match declared type");
  }

  // Scan for malicious content
  const isSafe = await scanForMalware(file.path);
  if (!isSafe) {
    errors.push("File appears to contain malicious content");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

async function validateFileContent(buffer, expectedMimetype) {
  // Basic file signature validation
  const signatures = {
    "image/jpeg": [0xff, 0xd8, 0xff],
    "image/png": [0x89, 0x50, 0x4e, 0x47],
    "application/pdf": [0x25, 0x50, 0x44, 0x46],
  };

  const signature = signatures[expectedMimetype];
  if (signature) {
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }
  }

  return true;
}

async function scanForMalware(filePath) {
  // Mock malware scanning - integrate with actual antivirus API
  const fileContent = fs.readFileSync(filePath, "utf8");
  const suspiciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /exec\s*\(/gi,
  ];

  return !suspiciousPatterns.some((pattern) => pattern.test(fileContent));
}

async function processProfileImage(file) {
  // Mock image processing - use sharp or similar library in production
  return {
    originalSize: file.size,
    thumbnailGenerated: true,
    optimized: true,
  };
}

async function processDocument(file) {
  // Mock document processing
  return {
    extracted: true,
    indexed: true,
    thumbnailGenerated: file.mimetype === "application/pdf",
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = "File upload error";
    let statusCode = 400;

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large. Maximum size is 10MB.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Maximum is 10 files.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = `Unexpected field: ${error.field}`;
        break;
      case "LIMIT_FIELD_COUNT":
        message = "Too many form fields.";
        break;
      default:
        message = error.message;
    }

    return res.status(statusCode).json({
      error: "Upload failed",
      message: message,
      code: error.code,
    });
  }

  // Handle custom validation errors
  if (
    error.message.includes("not allowed") ||
    error.message.includes("Invalid file")
  ) {
    return res.status(400).json({
      error: "File validation failed",
      message: error.message,
    });
  }

  next(error);
});

app.listen(3000);
```

## Memory Storage for Temporary Files

```javascript
const express = require("express");
const multer = require("multer");
const sharp = require("sharp"); // For image processing
const app = express();

// Memory storage - files stored in memory as Buffer
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

app.post(
  "/upload/process-image",
  memoryUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Process image in memory
      const processedImages = await Promise.all([
        // Original
        {
          name: "original",
          buffer: req.file.buffer,
          size: req.file.size,
        },
        // Thumbnail
        {
          name: "thumbnail",
          buffer: await sharp(req.file.buffer)
            .resize(150, 150)
            .jpeg({ quality: 80 })
            .toBuffer(),
          size: null,
        },
        // Medium size
        {
          name: "medium",
          buffer: await sharp(req.file.buffer)
            .resize(800, 600, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer(),
          size: null,
        },
      ]);

      // Calculate sizes for processed images
      processedImages.forEach((img) => {
        if (!img.size) {
          img.size = img.buffer.length;
        }
      });

      // Here you would typically save to cloud storage or database
      const savedImages = await saveImagesToStorage(processedImages);

      res.json({
        message: "Images processed and saved successfully",
        original: {
          name: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        processed: savedImages,
      });
    } catch (error) {
      console.error("Image processing error:", error);
      res.status(500).json({
        error: "Image processing failed",
        message: error.message,
      });
    }
  }
);

async function saveImagesToStorage(images) {
  // Mock function - implement actual storage logic
  return images.map((img) => ({
    name: img.name,
    size: img.size,
    url: `/images/${Date.now()}_${img.name}.jpg`,
    saved: true,
  }));
}

app.listen(3000);
```

## Cloud Storage Integration

### AWS S3 Upload Example

```javascript
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const app = express();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "my-upload-bucket";

// Memory storage for S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

app.post("/upload/s3", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Generate unique key for S3
    const fileExtension = req.file.originalname.split(".").pop();
    const s3Key = `uploads/${Date.now()}_${uuidv4()}.${fileExtension}`;

    // S3 upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ContentDisposition: "inline",
      CacheControl: "max-age=31536000", // 1 year cache
      Metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
        userId: req.body.userId || "anonymous",
      },
    };

    // Upload to S3
    const s3Response = await s3.upload(uploadParams).promise();

    // Save file metadata to database (mock)
    const fileRecord = await saveFileMetadata({
      originalName: req.file.originalname,
      s3Key: s3Key,
      s3Url: s3Response.Location,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date(),
      userId: req.body.userId,
    });

    res.json({
      message: "File uploaded to S3 successfully",
      file: {
        id: fileRecord.id,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: s3Response.Location,
        s3Key: s3Key,
      },
    });
  } catch (error) {
    console.error("S3 Upload error:", error);
    res.status(500).json({
      error: "Upload to S3 failed",
      message: error.message,
    });
  }
});

// Multiple files to S3
app.post("/upload/s3/multiple", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const uploadPromises = req.files.map(async (file) => {
      const fileExtension = file.originalname.split(".").pop();
      const s3Key = `uploads/${Date.now()}_${uuidv4()}.${fileExtension}`;

      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      };

      const s3Response = await s3.upload(uploadParams).promise();

      return {
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: s3Response.Location,
        s3Key: s3Key,
      };
    });

    const uploadResults = await Promise.all(uploadPromises);

    res.json({
      message: `${uploadResults.length} files uploaded to S3 successfully`,
      files: uploadResults,
    });
  } catch (error) {
    console.error("S3 Multiple upload error:", error);
    res.status(500).json({
      error: "Multiple upload to S3 failed",
      message: error.message,
    });
  }
});

// Download file from S3
app.get("/download/s3/:key(*)", async (req, res) => {
  try {
    const s3Key = req.params.key;

    // Get file metadata
    const headParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
    };

    const headResponse = await s3.headObject(headParams).promise();

    // Create download stream
    const downloadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
    };

    const s3Stream = s3.getObject(downloadParams).createReadStream();

    // Set response headers
    res.setHeader("Content-Type", headResponse.ContentType);
    res.setHeader("Content-Length", headResponse.ContentLength);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${headResponse.Metadata.originalname || s3Key}"`
    );

    // Pipe S3 stream to response
    s3Stream.pipe(res);
  } catch (error) {
    if (error.code === "NoSuchKey") {
      res.status(404).json({ error: "File not found" });
    } else {
      console.error("S3 Download error:", error);
      res.status(500).json({
        error: "Download failed",
        message: error.message,
      });
    }
  }
});

async function saveFileMetadata(metadata) {
  // Mock database save - implement actual database logic
  return {
    id: uuidv4(),
    ...metadata,
    createdAt: new Date(),
  };
}

app.listen(3000);
```

## File Upload Progress Tracking

### Real-time Upload Progress

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();

// Progress tracking storage
const uploadProgress = new Map();

// Custom Multer engine with progress tracking
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueName + extension);
  },
});

// Progress tracking middleware
const trackProgress = (req, res, next) => {
  const uploadId = req.headers["x-upload-id"] || Date.now().toString();

  // Initialize progress tracking
  uploadProgress.set(uploadId, {
    uploadId: uploadId,
    totalSize: parseInt(req.headers["content-length"]) || 0,
    uploadedSize: 0,
    progress: 0,
    startTime: Date.now(),
    files: [],
  });

  req.uploadId = uploadId;

  // Track upload progress
  let uploadedBytes = 0;

  req.on("data", (chunk) => {
    uploadedBytes += chunk.length;
    const progress = uploadProgress.get(uploadId);
    if (progress) {
      progress.uploadedSize = uploadedBytes;
      progress.progress =
        progress.totalSize > 0
          ? Math.round((uploadedBytes / progress.totalSize) * 100)
          : 0;

      // Emit progress event (in real app, use WebSockets or Server-Sent Events)
      console.log(`Upload ${uploadId}: ${progress.progress}% complete`);
    }
  });

  req.on("end", () => {
    const progress = uploadProgress.get(uploadId);
    if (progress) {
      progress.progress = 100;
      progress.endTime = Date.now();
      progress.duration = progress.endTime - progress.startTime;
    }
  });

  next();
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

app.use(trackProgress);

app.post("/upload/tracked", upload.array("files", 10), (req, res) => {
  const progress = uploadProgress.get(req.uploadId);

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  // Update progress with file information
  if (progress) {
    progress.files = req.files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    }));
  }

  res.json({
    message: "Upload completed",
    uploadId: req.uploadId,
    files: req.files.length,
    progress: progress,
  });

  // Clean up progress tracking after 5 minutes
  setTimeout(() => {
    uploadProgress.delete(req.uploadId);
  }, 5 * 60 * 1000);
});

// Progress endpoint
app.get("/upload/progress/:uploadId", (req, res) => {
  const progress = uploadProgress.get(req.params.uploadId);

  if (!progress) {
    return res.status(404).json({ error: "Upload not found" });
  }

  res.json(progress);
});

app.listen(3000);
```

## Security Best Practices

### Comprehensive File Upload Security

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const app = express();

// Secure file upload configuration
class SecureFileUpload {
  constructor() {
    this.allowedMimeTypes = new Map([
      ["image", ["image/jpeg", "image/png", "image/gif", "image/webp"]],
      [
        "document",
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      ],
      ["spreadsheet", ["text/csv", "application/vnd.ms-excel"]],
    ]);

    this.maxFileSizes = new Map([
      ["image", 5 * 1024 * 1024], // 5MB
      ["document", 20 * 1024 * 1024], // 20MB
      ["spreadsheet", 10 * 1024 * 1024], // 10MB
    ]);

    this.quarantineDir = "quarantine";
    this.uploadDir = "secure-uploads";

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.quarantineDir, this.uploadDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  createSecureStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        // Initially store in quarantine
        cb(null, this.quarantineDir);
      },
      filename: (req, file, cb) => {
        // Generate cryptographically secure filename
        const hash = crypto.randomBytes(16).toString("hex");
        const timestamp = Date.now();
        const safeExtension = this.getSafeExtension(file.originalname);
        cb(null, `${timestamp}_${hash}${safeExtension}`);
      },
    });
  }

  getSafeExtension(filename) {
    const extension = path.extname(filename).toLowerCase();
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".pdf",
      ".doc",
      ".docx",
      ".csv",
      ".xls",
    ];
    return allowedExtensions.includes(extension) ? extension : ".bin";
  }

  createFileFilter(fileType) {
    return (req, file, cb) => {
      const allowedTypes = this.allowedMimeTypes.get(fileType) || [];
      const maxSize = this.maxFileSizes.get(fileType) || 1024 * 1024;

      // Check MIME type
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(
          new Error(`File type ${file.mimetype} not allowed for ${fileType}`)
        );
      }

      // Check file extension
      const extension = path.extname(file.originalname).toLowerCase();
      const validExtensions = this.getValidExtensions(file.mimetype);

      if (!validExtensions.includes(extension)) {
        return cb(
          new Error(
            `Invalid file extension ${extension} for MIME type ${file.mimetype}`
          )
        );
      }

      // Store file type for later validation
      file.uploadType = fileType;

      cb(null, true);
    };
  }

  getValidExtensions(mimetype) {
    const extensionMap = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
    };

    return extensionMap[mimetype] || [];
  }

  async validateAndMoveFile(file) {
    const quarantinePath = file.path;

    try {
      // 1. Validate file signature
      const isValidSignature = await this.validateFileSignature(
        quarantinePath,
        file.mimetype
      );
      if (!isValidSignature) {
        throw new Error("File signature does not match MIME type");
      }

      // 2. Scan for malicious content
      const isSafe = await this.scanForMaliciousContent(quarantinePath);
      if (!isSafe) {
        throw new Error("File contains potentially malicious content");
      }

      // 3. Additional content validation
      const contentValidation = await this.validateFileContent(
        quarantinePath,
        file.uploadType
      );
      if (!contentValidation.valid) {
        throw new Error(
          `Content validation failed: ${contentValidation.error}`
        );
      }

      // 4. Move to secure location
      const securePath = path.join(this.uploadDir, file.filename);
      fs.renameSync(quarantinePath, securePath);

      return {
        success: true,
        securePath: securePath,
        validationDetails: contentValidation.details,
      };
    } catch (error) {
      // Clean up quarantined file
      if (fs.existsSync(quarantinePath)) {
        fs.unlinkSync(quarantinePath);
      }

      throw error;
    }
  }

  async validateFileSignature(filePath, expectedMimetype) {
    const fileBuffer = fs.readFileSync(filePath);

    const signatures = {
      "image/jpeg": [[0xff, 0xd8, 0xff]],
      "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
      "image/gif": [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
      ],
      "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
    };

    const expectedSignatures = signatures[expectedMimetype];
    if (!expectedSignatures) {
      return true; // No signature check available
    }

    return expectedSignatures.some((signature) => {
      for (let i = 0; i < signature.length; i++) {
        if (fileBuffer[i] !== signature[i]) {
          return false;
        }
      }
      return true;
    });
  }

  async scanForMaliciousContent(filePath) {
    const fileContent = fs.readFileSync(filePath);
    const fileString = fileContent.toString(
      "utf8",
      0,
      Math.min(4096, fileContent.length)
    );

    const maliciousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /%3cscript/gi,
      /&lt;script/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi,
      /window\.location/gi,
    ];

    return !maliciousPatterns.some((pattern) => pattern.test(fileString));
  }

  async validateFileContent(filePath, fileType) {
    const fileStats = fs.statSync(filePath);

    // Basic validations
    if (fileStats.size === 0) {
      return { valid: false, error: "File is empty" };
    }

    if (fileType === "image") {
      return await this.validateImageContent(filePath);
    }

    if (fileType === "document") {
      return await this.validateDocumentContent(filePath);
    }

    return {
      valid: true,
      details: { size: fileStats.size },
    };
  }

  async validateImageContent(filePath) {
    // Mock image validation - use libraries like sharp in production
    const fileBuffer = fs.readFileSync(filePath);

    // Check for embedded scripts in EXIF data (simplified check)
    const hasEmbeddedScripts = fileBuffer.includes(Buffer.from("<script>"));

    if (hasEmbeddedScripts) {
      return { valid: false, error: "Image contains embedded scripts" };
    }

    return {
      valid: true,
      details: {
        format: "validated",
        hasEmbeddedContent: false,
      },
    };
  }

  async validateDocumentContent(filePath) {
    // Mock document validation
    const fileStats = fs.statSync(filePath);

    if (fileStats.size > 50 * 1024 * 1024) {
      // 50MB limit for documents
      return { valid: false, error: "Document too large" };
    }

    return {
      valid: true,
      details: {
        size: fileStats.size,
        validated: true,
      },
    };
  }
}

// Initialize secure file upload
const secureUpload = new SecureFileUpload();

// Create upload middleware for different file types
const imageUpload = multer({
  storage: secureUpload.createSecureStorage(),
  fileFilter: secureUpload.createFileFilter("image"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const documentUpload = multer({
  storage: secureUpload.createSecureStorage(),
  fileFilter: secureUpload.createFileFilter("document"),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Secure upload endpoints
app.post(
  "/upload/secure/image",
  imageUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const validationResult = await secureUpload.validateAndMoveFile(req.file);

      res.json({
        message: "Image uploaded and validated successfully",
        file: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          securePath: validationResult.securePath,
          validation: validationResult.validationDetails,
        },
      });
    } catch (error) {
      console.error("Secure upload error:", error);
      res.status(400).json({
        error: "Upload validation failed",
        message: error.message,
      });
    }
  }
);

app.post(
  "/upload/secure/document",
  documentUpload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No document file provided" });
      }

      const validationResult = await secureUpload.validateAndMoveFile(req.file);

      res.json({
        message: "Document uploaded and validated successfully",
        file: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          securePath: validationResult.securePath,
          validation: validationResult.validationDetails,
        },
      });
    } catch (error) {
      console.error("Secure upload error:", error);
      res.status(400).json({
        error: "Upload validation failed",
        message: error.message,
      });
    }
  }
);

// Error handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const errorMessages = {
      LIMIT_FILE_SIZE: "File too large",
      LIMIT_FILE_COUNT: "Too many files",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field",
    };

    return res.status(400).json({
      error: "Upload error",
      message: errorMessages[error.code] || error.message,
    });
  }

  if (
    error.message.includes("not allowed") ||
    error.message.includes("Invalid")
  ) {
    return res.status(400).json({
      error: "File validation error",
      message: error.message,
    });
  }

  next(error);
});

app.listen(3000);
```

## Summary

### Body-Parser Key Points:

1. **Built into Express 4.16+** - No separate package needed for basic parsing
2. **Multiple content types** - JSON, URL-encoded, raw, text parsing
3. **Size limits** - Configurable limits for security
4. **Error handling** - Comprehensive error handling for malformed data
5. **Custom parsers** - Extensible for XML, CSV, or other formats

### File Upload Best Practices:

1. **Use Multer** - Industry standard for handling multipart/form-data
2. **Validate everything** - MIME type, file signature, content, size
3. **Secure storage** - Quarantine, scan, then move to secure location
4. **Limit file sizes** - Prevent DoS attacks
5. **Cloud integration** - Use S3, GCS, or Azure for scalable storage
6. **Progress tracking** - Real-time upload progress for better UX
7. **Error handling** - Comprehensive error handling and cleanup

### Security Considerations:

- **File signature validation** - Verify actual file content
- **Malware scanning** - Check for malicious content
- **Filename sanitization** - Prevent path traversal attacks
- **Storage isolation** - Keep uploads separate from application code
- **Access controls** - Implement proper authentication and authorization
- **Content-Type validation** - Don't trust client-provided MIME types
