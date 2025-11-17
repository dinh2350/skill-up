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
      path: req.file.path,
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
      mimetype: file.mimetype,
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
const imageDir = path.join(uploadDir, "images");

[uploadDir, profileDir, documentDir, imageDir].forEach((dir) => {
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
    } else if (file.mimetype.startsWith("image/")) {
      cb(null, imageDir);
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

    // Create secure filename
    const hash = crypto
      .createHash("md5")
      .update(file.originalname + uniqueSuffix)
      .digest("hex")
      .substr(0, 8);
    cb(null, `${sanitizedBaseName}_${hash}_${uniqueSuffix}${fileExtension}`);
  },
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  console.log("Processing file:", file.originalname, "Type:", file.mimetype);

  // Define allowed file types per field
  const allowedTypes = {
    avatar: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    data: [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/tiff"],
  };

  const fieldAllowedTypes =
    allowedTypes[file.fieldname] || allowedTypes["image"];

  if (fieldAllowedTypes.includes(file.mimetype)) {
    // Additional file extension check for security
    const allowedExtensions = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "image/tiff": [".tiff", ".tif"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    };

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const validExtensions = allowedExtensions[file.mimetype] || [];

    if (validExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file extension ${fileExtension} for MIME type ${
            file.mimetype
          }. Expected: ${validExtensions.join(", ")}`
        )
      );
    }
  } else {
    cb(
      new Error(
        `File type ${file.mimetype} not allowed for field ${
          file.fieldname
        }. Allowed types: ${fieldAllowedTypes.join(", ")}`
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
        mimetype: req.file.mimetype,
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
            mimetype: file.mimetype,
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
    "image/gif": [0x47, 0x49, 0x46],
    "application/pdf": [0x25, 0x50, 0x44, 0x46],
    "application/msword": [0xd0, 0xcf, 0x11, 0xe0],
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
  const fileContent = fs.readFileSync(filePath);
  const fileString = fileContent.toString(
    "utf8",
    0,
    Math.min(1024, fileContent.length)
  );

  const suspiciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /exec\s*\(/gi,
    /eval\s*\(/gi,
    /document\.cookie/gi,
  ];

  return !suspiciousPatterns.some((pattern) => pattern.test(fileString));
}

async function processProfileImage(file) {
  // Mock image processing - use sharp or similar library in production
  return {
    originalSize: file.size,
    thumbnailGenerated: true,
    optimized: true,
    dimensions: { width: 800, height: 600 }, // Mock dimensions
  };
}

async function processDocument(file) {
  // Mock document processing
  return {
    extracted: true,
    indexed: true,
    thumbnailGenerated: file.mimetype === "application/pdf",
    wordCount: file.mimetype === "text/plain" ? 150 : null,
  };
}

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

      console.log("Processing image:", {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      // Process image in memory using Sharp
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
            .resize(150, 150, { fit: "cover" })
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
        // WebP version for modern browsers
        {
          name: "webp",
          buffer: await sharp(req.file.buffer)
            .resize(800, 600, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 85 })
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

      // Get image metadata
      const metadata = await sharp(req.file.buffer).metadata();

      // Here you would typically save to cloud storage or database
      const savedImages = await saveImagesToStorage(
        processedImages,
        req.file.originalname
      );

      res.json({
        message: "Images processed and saved successfully",
        original: {
          name: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          dimensions: {
            width: metadata.width,
            height: metadata.height,
          },
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

// Batch image processing
app.post(
  "/upload/batch-process",
  memoryUpload.array("images", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      const results = await Promise.all(
        req.files.map(async (file, index) => {
          try {
            const thumbnail = await sharp(file.buffer)
              .resize(200, 200, { fit: "cover" })
              .jpeg({ quality: 80 })
              .toBuffer();

            return {
              index,
              originalName: file.originalname,
              originalSize: file.size,
              thumbnailSize: thumbnail.length,
              processed: true,
            };
          } catch (error) {
            return {
              index,
              originalName: file.originalname,
              error: error.message,
              processed: false,
            };
          }
        })
      );

      const successful = results.filter((r) => r.processed);
      const failed = results.filter((r) => !r.processed);

      res.json({
        message: `Processed ${successful.length}/${req.files.length} images`,
        successful,
        failed,
      });
    } catch (error) {
      console.error("Batch processing error:", error);
      res.status(500).json({
        error: "Batch processing failed",
        message: error.message,
      });
    }
  }
);

async function saveImagesToStorage(images, originalName) {
  // Mock function - implement actual storage logic (S3, local filesystem, etc.)
  return images.map((img) => ({
    name: img.name,
    size: img.size,
    url: `/images/${Date.now()}_${originalName}_${img.name}.${
      img.name === "webp" ? "webp" : "jpg"
    }`,
    saved: true,
  }));
}

app.listen(3000);
```

## Cloud Storage Integration (AWS S3)

```javascript
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
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
      "text/plain",
      "text/csv",
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
    const fileExtension = path.extname(req.file.originalname);
    const fileName = path.basename(req.file.originalname, fileExtension);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const s3Key = `uploads/${timestamp}_${uniqueId}_${sanitizedFileName}${fileExtension}`;

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
        fileSize: req.file.size.toString(),
      },
      // Set ACL based on file type
      ACL: req.file.mimetype.startsWith("image/") ? "public-read" : "private",
    };

    // Upload to S3
    console.log(`Uploading to S3: ${s3Key}`);
    const s3Response = await s3.upload(uploadParams).promise();

    // Save file metadata to database (mock)
    const fileRecord = await saveFileMetadata({
      id: uniqueId,
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
        etag: s3Response.ETag,
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

// Multiple files to S3 with progress tracking
app.post("/upload/s3/multiple", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    console.log(`Starting upload of ${req.files.length} files to S3`);

    const uploadPromises = req.files.map(async (file, index) => {
      try {
        const fileExtension = path.extname(file.originalname);
        const fileName = path.basename(file.originalname, fileExtension);
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
        const s3Key = `uploads/batch_${Date.now()}_${index}_${sanitizedFileName}${fileExtension}`;

        const uploadParams = {
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
            batchIndex: index.toString(),
          },
        };

        const s3Response = await s3.upload(uploadParams).promise();

        return {
          success: true,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          url: s3Response.Location,
          s3Key: s3Key,
        };
      } catch (error) {
        return {
          success: false,
          originalName: file.originalname,
          error: error.message,
        };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    const successful = uploadResults.filter((r) => r.success);
    const failed = uploadResults.filter((r) => !r.success);

    res.json({
      message: `Uploaded ${successful.length}/${uploadResults.length} files to S3`,
      successful,
      failed,
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
    console.log(`Downloading from S3: ${s3Key}`);

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
    res.setHeader("Cache-Control", "max-age=31536000");

    // Pipe S3 stream to response
    s3Stream.pipe(res);

    s3Stream.on("error", (error) => {
      console.error("S3 stream error:", error);
      res.status(500).json({ error: "Download stream failed" });
    });
  } catch (error) {
    if (error.code === "NoSuchKey") {
      res.status(404).json({
        error: "File not found",
        key: req.params.key,
      });
    } else {
      console.error("S3 Download error:", error);
      res.status(500).json({
        error: "Download failed",
        message: error.message,
      });
    }
  }
});

// Get signed URL for private files
app.get("/presigned-url/:key(*)", async (req, res) => {
  try {
    const s3Key = req.params.key;
    const expiresIn = parseInt(req.query.expires) || 3600; // Default 1 hour

    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Expires: expiresIn,
    };

    const signedUrl = s3.getSignedUrl("getObject", params);

    res.json({
      url: signedUrl,
      expires: new Date(Date.now() + expiresIn * 1000).toISOString(),
      key: s3Key,
    });
  } catch (error) {
    console.error("Presigned URL error:", error);
    res.status(500).json({
      error: "Failed to generate presigned URL",
      message: error.message,
    });
  }
});

async function saveFileMetadata(metadata) {
  // Mock database save - implement actual database logic
  console.log("Saving file metadata:", metadata.originalName);
  return {
    ...metadata,
    createdAt: new Date(),
    status: "uploaded",
  };
}

app.listen(3000);
```

## File Upload Progress Tracking

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { EventEmitter } = require("events");
const app = express();

// Progress tracking storage
const uploadProgress = new Map();
const progressEmitter = new EventEmitter();

// Custom Multer engine with progress tracking
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + "-" + uniqueName + extension;

    // Store filename in request for progress tracking
    if (!req.uploadFiles) req.uploadFiles = [];
    req.uploadFiles.push({
      fieldname: file.fieldname,
      originalname: file.originalname,
      filename: filename,
    });

    cb(null, filename);
  },
});

// Progress tracking middleware
const trackProgress = (req, res, next) => {
  const uploadId = req.headers["x-upload-id"] || Date.now().toString();
  const contentLength = parseInt(req.headers["content-length"]) || 0;

  // Initialize progress tracking
  const progressData = {
    uploadId: uploadId,
    totalSize: contentLength,
    uploadedSize: 0,
    progress: 0,
    startTime: Date.now(),
    files: [],
    status: "uploading",
  };

  uploadProgress.set(uploadId, progressData);
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

      // Emit progress event for real-time updates
      progressEmitter.emit("progress", {
        uploadId,
        progress: progress.progress,
        uploadedSize: uploadedBytes,
        totalSize: progress.totalSize,
      });
    }
  });

  req.on("end", () => {
    const progress = uploadProgress.get(uploadId);
    if (progress) {
      progress.progress = 100;
      progress.endTime = Date.now();
      progress.duration = progress.endTime - progress.startTime;
      progress.status = "processing";

      progressEmitter.emit("upload-complete", { uploadId });
    }
  });

  req.on("error", (error) => {
    const progress = uploadProgress.get(uploadId);
    if (progress) {
      progress.status = "error";
      progress.error = error.message;

      progressEmitter.emit("upload-error", { uploadId, error: error.message });
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

app.use("/upload", trackProgress);

app.post("/upload/tracked", upload.array("files", 10), async (req, res) => {
  try {
    const progress = uploadProgress.get(req.uploadId);

    if (!req.files || req.files.length === 0) {
      if (progress) {
        progress.status = "error";
        progress.error = "No files uploaded";
      }
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Update progress with file information
    if (progress) {
      progress.files = req.files.map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
      }));
      progress.status = "completed";

      progressEmitter.emit("processing-complete", {
        uploadId: req.uploadId,
        files: progress.files,
      });
    }

    res.json({
      message: "Upload completed successfully",
      uploadId: req.uploadId,
      files: req.files.length,
      progress: progress,
    });

    // Clean up progress tracking after 10 minutes
    setTimeout(() => {
      uploadProgress.delete(req.uploadId);
    }, 10 * 60 * 1000);
  } catch (error) {
    const progress = uploadProgress.get(req.uploadId);
    if (progress) {
      progress.status = "error";
      progress.error = error.message;
    }

    console.error("Upload processing error:", error);
    res.status(500).json({
      error: "Upload processing failed",
      message: error.message,
    });
  }
});

// Progress endpoint
app.get("/upload/progress/:uploadId", (req, res) => {
  const progress = uploadProgress.get(req.params.uploadId);

  if (!progress) {
    return res.status(404).json({ error: "Upload not found" });
  }

  res.json(progress);
});

// Server-Sent Events for real-time progress
app.get("/upload/progress/:uploadId/stream", (req, res) => {
  const uploadId = req.params.uploadId;

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial progress
  const currentProgress = uploadProgress.get(uploadId);
  if (currentProgress) {
    res.write(`data: ${JSON.stringify(currentProgress)}\n\n`);
  }

  // Listen for progress updates
  const onProgress = (data) => {
    if (data.uploadId === uploadId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  const onComplete = (data) => {
    if (data.uploadId === uploadId) {
      res.write(`data: ${JSON.stringify({ ...data, type: "complete" })}\n\n`);
    }
  };

  const onError = (data) => {
    if (data.uploadId === uploadId) {
      res.write(`data: ${JSON.stringify({ ...data, type: "error" })}\n\n`);
      res.end();
    }
  };

  progressEmitter.on("progress", onProgress);
  progressEmitter.on("upload-complete", onComplete);
  progressEmitter.on("upload-error", onError);

  // Clean up on client disconnect
  req.on("close", () => {
    progressEmitter.removeListener("progress", onProgress);
    progressEmitter.removeListener("upload-complete", onComplete);
    progressEmitter.removeListener("upload-error", onError);
  });
});

app.listen(3000);
```

## Error Handling for File Uploads

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

// Upload endpoint with comprehensive error handling
app.post("/upload/safe", (req, res) => {
  upload.array("files", 5)(req, res, (err) => {
    if (err) {
      // Handle multer-specific errors
      if (err instanceof multer.MulterError) {
        return handleMulterError(err, res);
      }

      // Handle custom validation errors
      if (err.message.includes("not allowed")) {
        return res.status(400).json({
          error: "File validation failed",
          message: err.message,
          code: "INVALID_FILE_TYPE",
        });
      }

      // Handle other upload errors
      console.error("Upload error:", err);
      return res.status(500).json({
        error: "Upload failed",
        message: "An unexpected error occurred during upload",
        code: "UPLOAD_ERROR",
      });
    }

    // Validate uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "No files uploaded",
        code: "NO_FILES",
      });
    }

    // Process files with additional validation
    processUploadedFiles(req.files)
      .then((results) => {
        res.json({
          message: "Files uploaded successfully",
          files: results.successful,
          errors: results.errors,
        });
      })
      .catch((error) => {
        console.error("File processing error:", error);
        res.status(500).json({
          error: "File processing failed",
          message: error.message,
          code: "PROCESSING_ERROR",
        });
      });
  });
});

function handleMulterError(err, res) {
  const errorMap = {
    LIMIT_FILE_SIZE: {
      status: 413,
      message: "File too large. Maximum size is 5MB.",
      code: "FILE_TOO_LARGE",
    },
    LIMIT_FILE_COUNT: {
      status: 400,
      message: "Too many files. Maximum is 5 files.",
      code: "TOO_MANY_FILES",
    },
    LIMIT_UNEXPECTED_FILE: {
      status: 400,
      message: `Unexpected field: ${err.field}`,
      code: "UNEXPECTED_FIELD",
    },
    LIMIT_FIELD_COUNT: {
      status: 400,
      message: "Too many form fields.",
      code: "TOO_MANY_FIELDS",
    },
    LIMIT_FIELD_KEY: {
      status: 400,
      message: "Field name too long.",
      code: "FIELD_NAME_TOO_LONG",
    },
    LIMIT_FIELD_VALUE: {
      status: 400,
      message: "Field value too long.",
      code: "FIELD_VALUE_TOO_LONG",
    },
    LIMIT_PART_COUNT: {
      status: 400,
      message: "Too many parts in multipart data.",
      code: "TOO_MANY_PARTS",
    },
  };

  const errorInfo = errorMap[err.code] || {
    status: 400,
    message: err.message,
    code: "UPLOAD_ERROR",
  };

  res.status(errorInfo.status).json({
    error: "Upload failed",
    message: errorInfo.message,
    code: errorInfo.code,
    field: err.field || undefined,
  });
}

async function processUploadedFiles(files) {
  const successful = [];
  const errors = [];

  for (const file of files) {
    try {
      // Validate file content
      const validation = await validateFileContent(file);
      if (!validation.valid) {
        // Clean up invalid file
        fs.unlinkSync(file.path);
        errors.push({
          filename: file.originalname,
          error: validation.error,
        });
        continue;
      }

      // Additional processing (resize, virus scan, etc.)
      const processed = await processFile(file);

      successful.push({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        processed: processed,
      });
    } catch (error) {
      // Clean up file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      errors.push({
        filename: file.originalname,
        error: error.message,
      });
    }
  }

  return { successful, errors };
}

async function validateFileContent(file) {
  // Check if file exists
  if (!fs.existsSync(file.path)) {
    return { valid: false, error: "File not properly saved" };
  }

  // Check file size
  const stats = fs.statSync(file.path);
  if (stats.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  if (stats.size > 5 * 1024 * 1024) {
    return { valid: false, error: "File exceeds size limit" };
  }

  // Validate file signature
  const buffer = fs.readFileSync(file.path, { start: 0, end: 10 });
  const isValid = validateFileSignature(buffer, file.mimetype);

  if (!isValid) {
    return { valid: false, error: "File content does not match extension" };
  }

  return { valid: true };
}

function validateFileSignature(buffer, mimetype) {
  const signatures = {
    "image/jpeg": [[0xff, 0xd8, 0xff]],
    "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    "image/gif": [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    ],
  };

  const expectedSignatures = signatures[mimetype];
  if (!expectedSignatures) {
    return true; // No signature check available
  }

  return expectedSignatures.some((signature) => {
    for (let i = 0; i < signature.length && i < buffer.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }
    return true;
  });
}

async function processFile(file) {
  // Mock file processing
  return {
    processed: true,
    timestamp: new Date().toISOString(),
    virusScanned: true,
    thumbnailCreated: file.mimetype.startsWith("image/"),
  };
}

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
  });
});

app.listen(3000);
```

## Summary

### File Upload Methods:

1. **Multer Middleware** - Most popular and robust solution for multipart/form-data
2. **Memory Storage** - Process files in memory for immediate manipulation
3. **Disk Storage** - Save files to local filesystem with custom naming
4. **Cloud Storage** - Direct upload to AWS S3, Google Cloud, or Azure
5. **Stream Processing** - Handle large files efficiently with streams

### Key Features:

- **File Validation** - MIME type, size, and content validation
- **Security Scanning** - Malware detection and content filtering
- **Progress Tracking** - Real-time upload progress monitoring
- **Error Handling** - Comprehensive error handling and cleanup
- **Multiple File Support** - Handle single and multiple file uploads
- **Custom Storage** - Flexible storage configuration and organization

### Security Best Practices:

1. **Validate file types** - Check both MIME type and file extension
2. **Limit file sizes** - Prevent DoS attacks and resource exhaustion
3. **Scan for malware** - Integrate virus scanning capabilities
4. **Validate file signatures** - Verify actual file content matches declared type
5. **Sanitize filenames** - Prevent path traversal and injection attacks
6. **Use temporary storage** - Quarantine files before final processing
7. **Implement rate limiting** - Control upload frequency per user
8. **Store files outside web root** - Prevent direct execution of uploaded files

File uploads are critical for many applications and require careful consideration of security, performance, and user experience to implement correctly.
