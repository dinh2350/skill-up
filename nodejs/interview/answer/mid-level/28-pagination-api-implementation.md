# How do you implement pagination in an API?

Pagination is essential for handling large datasets in APIs, improving performance, reducing server load, and providing better user experience. There are several pagination strategies, each with their own use cases and trade-offs.

## Types of Pagination

### 1. Offset-Based Pagination (Page Number + Page Size)

The most common and intuitive pagination method using page numbers and page sizes.

```javascript
const express = require("express");
const app = express();

// Mock database
let users = [];
for (let i = 1; i <= 1000; i++) {
  users.push({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    createdAt: new Date(Date.now() - Math.random() * 31536000000), // Random date within last year
  });
}

// Offset-based pagination endpoint
app.get("/api/users", (req, res) => {
  try {
    // Parse query parameters with defaults
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const sortBy = req.query.sortBy || "id";
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
    const search = req.query.search || "";

    // Filter users based on search
    let filteredUsers = users;
    if (search) {
      filteredUsers = users.filter(
        (user) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort users
    filteredUsers.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (sortOrder === "desc") {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    // Calculate pagination
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    // Validate page number
    if (page > totalPages && totalItems > 0) {
      return res.status(400).json({
        error: "Page not found",
        message: `Page ${page} does not exist. Maximum page is ${totalPages}`,
        totalPages: totalPages,
      });
    }

    // Get paginated results
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    // Calculate pagination metadata
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;
    const nextPage = hasNext ? page + 1 : null;
    const previousPage = hasPrevious ? page - 1 : null;

    res.json({
      data: paginatedUsers,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNext: hasNext,
        hasPrevious: hasPrevious,
        nextPage: nextPage,
        previousPage: previousPage,
      },
      meta: {
        search: search,
        sortBy: sortBy,
        sortOrder: sortOrder,
        requestedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Pagination error:", error);
    res.status(500).json({
      error: "Pagination failed",
      message: error.message,
    });
  }
});

// Example usage:
// GET /api/users?page=2&limit=20&sortBy=name&sortOrder=desc&search=john
```

### 2. Cursor-Based Pagination

Better for real-time data and large datasets, prevents issues with changing data during pagination.

```javascript
// Cursor-based pagination with MongoDB-style implementation
const mongoose = require("mongoose");

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Cursor-based pagination endpoint
app.get("/api/users/cursor", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const cursor = req.query.cursor; // Base64 encoded cursor
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

    // Build query
    let query = {};
    let sort = { [sortBy]: sortOrder, _id: sortOrder }; // Always include _id for stable sorting

    // Decode cursor if provided
    if (cursor) {
      try {
        const decodedCursor = JSON.parse(
          Buffer.from(cursor, "base64").toString()
        );

        // Build cursor-based query
        if (sortOrder === 1) {
          // Ascending order
          query.$or = [
            { [sortBy]: { $gt: decodedCursor[sortBy] } },
            {
              [sortBy]: decodedCursor[sortBy],
              _id: { $gt: decodedCursor._id },
            },
          ];
        } else {
          // Descending order
          query.$or = [
            { [sortBy]: { $lt: decodedCursor[sortBy] } },
            {
              [sortBy]: decodedCursor[sortBy],
              _id: { $lt: decodedCursor._id },
            },
          ];
        }
      } catch (error) {
        return res.status(400).json({
          error: "Invalid cursor",
          message: "The provided cursor is malformed",
        });
      }
    }

    // Execute query with one extra item to check if there's a next page
    const users = await User.find(query)
      .sort(sort)
      .limit(limit + 1)
      .lean();

    // Check if there are more items
    const hasNext = users.length > limit;
    if (hasNext) {
      users.pop(); // Remove the extra item
    }

    // Generate next cursor
    let nextCursor = null;
    if (hasNext && users.length > 0) {
      const lastItem = users[users.length - 1];
      const cursorData = {
        [sortBy]: lastItem[sortBy],
        _id: lastItem._id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
    }

    res.json({
      data: users,
      pagination: {
        hasNext: hasNext,
        nextCursor: nextCursor,
        itemsPerPage: limit,
      },
      meta: {
        sortBy: sortBy,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
        requestedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Cursor pagination error:", error);
    res.status(500).json({
      error: "Pagination failed",
      message: error.message,
    });
  }
});

// Example usage:
// GET /api/users/cursor?limit=20&sortBy=createdAt&sortOrder=desc
// GET /api/users/cursor?cursor=eyJjcmVhdGVkQXQiOiIyMDIzLTEwLTE1VDE0OjMwOjAwLjAwMFoiLCJfaWQiOiI2NTJjYjk4ZTc4OWFiY2RlZjAxMjM0NTYifQ==
```

### 3. Keyset Pagination (Seek Method)

Efficient for large datasets with stable ordering using a known key.

```javascript
// Keyset pagination implementation
app.get("/api/products/keyset", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const afterId = req.query.afterId ? parseInt(req.query.afterId) : null;
    const beforeId = req.query.beforeId ? parseInt(req.query.beforeId) : null;
    const sortBy = req.query.sortBy || "id";
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

    // Build query conditions
    let conditions = {};

    if (afterId && beforeId) {
      return res.status(400).json({
        error: "Invalid parameters",
        message: "Cannot use both afterId and beforeId in the same request",
      });
    }

    if (afterId) {
      conditions.id = sortOrder === "asc" ? { $gt: afterId } : { $lt: afterId };
    } else if (beforeId) {
      conditions.id =
        sortOrder === "asc" ? { $lt: beforeId } : { $gt: beforeId };
    }

    // Execute query
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    let query = Product.find(conditions)
      .sort({ [sortBy]: sortDirection })
      .limit(limit + 1); // Get one extra to check for next page

    const products = await query.exec();

    // Determine if there are more pages
    const hasMore = products.length > limit;
    if (hasMore) {
      products.pop(); // Remove the extra item
    }

    // Generate navigation cursors
    let nextId = null;
    let previousId = null;

    if (products.length > 0) {
      const lastItem = products[products.length - 1];
      const firstItem = products[0];

      if (hasMore) {
        nextId = sortOrder === "asc" ? lastItem.id : firstItem.id;
      }

      // For previous page, we need to check if there are items before the first item
      if (sortOrder === "asc" && firstItem.id > 1) {
        previousId = firstItem.id;
      } else if (sortOrder === "desc") {
        const beforeCount = await Product.countDocuments({
          id: { $gt: firstItem.id },
        });
        if (beforeCount > 0) {
          previousId = firstItem.id;
        }
      }
    }

    res.json({
      data: products,
      pagination: {
        hasNext: hasMore,
        hasPrevious: previousId !== null,
        nextId: nextId,
        previousId: previousId,
        itemsPerPage: limit,
      },
      meta: {
        sortBy: sortBy,
        sortOrder: sortOrder,
        afterId: afterId,
        beforeId: beforeId,
        requestedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Keyset pagination error:", error);
    res.status(500).json({
      error: "Pagination failed",
      message: error.message,
    });
  }
});

// Example usage:
// GET /api/products/keyset?limit=20&sortOrder=asc
// GET /api/products/keyset?afterId=150&limit=20&sortOrder=asc
// GET /api/products/keyset?beforeId=100&limit=20&sortOrder=asc
```

## Database-Specific Pagination

### MongoDB Pagination with Aggregation

```javascript
const { ObjectId } = require("mongodb");

// Advanced MongoDB pagination with aggregation pipeline
app.get("/api/orders/advanced", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const status = req.query.status;
    const minAmount = req.query.minAmount
      ? parseFloat(req.query.minAmount)
      : null;
    const maxAmount = req.query.maxAmount
      ? parseFloat(req.query.maxAmount)
      : null;
    const userId = req.query.userId;

    // Build match conditions
    const matchConditions = {};

    if (status) {
      matchConditions.status = status;
    }

    if (minAmount || maxAmount) {
      matchConditions.totalAmount = {};
      if (minAmount) matchConditions.totalAmount.$gte = minAmount;
      if (maxAmount) matchConditions.totalAmount.$lte = maxAmount;
    }

    if (userId) {
      matchConditions.userId = new ObjectId(userId);
    }

    // Aggregation pipeline for pagination with facets
    const pipeline = [
      // Match stage
      { $match: matchConditions },

      // Lookup user information
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      // Unwind user array
      { $unwind: "$user" },

      // Add computed fields
      {
        $addFields: {
          userName: "$user.name",
          userEmail: "$user.email",
        },
      },

      // Remove sensitive user data
      {
        $project: {
          "user.password": 0,
          "user.internalNotes": 0,
        },
      },

      // Facet for pagination and count
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Order.aggregate(pipeline);

    const orders = result[0].data;
    const totalItems = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Enhanced pagination metadata
    const pagination = {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
      firstPage: 1,
      lastPage: totalPages > 0 ? totalPages : 1,
      itemsOnCurrentPage: orders.length,
      startIndex: totalItems > 0 ? (page - 1) * limit + 1 : 0,
      endIndex: totalItems > 0 ? Math.min(page * limit, totalItems) : 0,
    };

    res.json({
      data: orders,
      pagination: pagination,
      filters: {
        status: status,
        minAmount: minAmount,
        maxAmount: maxAmount,
        userId: userId,
      },
      meta: {
        requestedAt: new Date().toISOString(),
        processingTime: Date.now() - req.startTime,
      },
    });
  } catch (error) {
    console.error("Advanced pagination error:", error);
    res.status(500).json({
      error: "Advanced pagination failed",
      message: error.message,
    });
  }
});

// Middleware to track request start time
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});
```

### SQL Database Pagination with Prisma

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// SQL pagination with Prisma ORM
app.get("/api/posts/sql", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const category = req.query.category;
    const authorId = req.query.authorId;
    const published = req.query.published === "true";
    const searchTerm = req.query.search;

    // Build where conditions
    const whereClause = {
      AND: [],
    };

    if (category) {
      whereClause.AND.push({ category: category });
    }

    if (authorId) {
      whereClause.AND.push({ authorId: parseInt(authorId) });
    }

    if (published !== undefined) {
      whereClause.AND.push({ published: published });
    }

    if (searchTerm) {
      whereClause.AND.push({
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { content: { contains: searchTerm, mode: "insensitive" } },
        ],
      });
    }

    // Remove AND clause if empty
    const finalWhereClause = whereClause.AND.length > 0 ? whereClause : {};

    // Execute count and data queries in parallel
    const [posts, totalItems] = await Promise.all([
      prisma.post.findMany({
        where: finalWhereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          tags: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({
        where: finalWhereClause,
      }),
    ]);

    // Add computed fields
    const enrichedPosts = posts.map((post) => ({
      ...post,
      commentCount: post.comments.length,
      tagNames: post.tags.map((tag) => tag.name),
    }));

    const totalPages = Math.ceil(totalItems / limit);

    // Generate page links for easy navigation
    const generatePageLinks = (currentPage, totalPages, baseUrl) => {
      const links = {};

      if (currentPage > 1) {
        links.first = `${baseUrl}?page=1&limit=${limit}`;
        links.prev = `${baseUrl}?page=${currentPage - 1}&limit=${limit}`;
      }

      if (currentPage < totalPages) {
        links.next = `${baseUrl}?page=${currentPage + 1}&limit=${limit}`;
        links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`;
      }

      return links;
    };

    const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
    const pageLinks = generatePageLinks(page, totalPages, baseUrl);

    res.json({
      data: enrichedPosts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
        links: pageLinks,
      },
      filters: {
        category: category,
        authorId: authorId,
        published: published,
        search: searchTerm,
      },
      meta: {
        requestedAt: new Date().toISOString(),
        itemsOnPage: enrichedPosts.length,
      },
    });
  } catch (error) {
    console.error("SQL pagination error:", error);
    res.status(500).json({
      error: "SQL pagination failed",
      message: error.message,
    });
  }
});
```

## Advanced Pagination Features

### Pagination with Caching

```javascript
const Redis = require("redis");
const redis = Redis.createClient();

// Cached pagination to improve performance
app.get("/api/articles/cached", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const category = req.query.category || "all";

    // Generate cache key
    const cacheKey = `articles:${category}:page:${page}:limit:${limit}`;
    const countCacheKey = `articles:${category}:count`;

    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);
    const cachedCount = await redis.get(countCacheKey);

    if (cachedData && cachedCount) {
      console.log("Serving from cache");
      return res.json({
        data: JSON.parse(cachedData),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(parseInt(cachedCount) / limit),
          totalItems: parseInt(cachedCount),
          itemsPerPage: limit,
          fromCache: true,
        },
        meta: {
          requestedAt: new Date().toISOString(),
          cached: true,
        },
      });
    }

    // If not in cache, fetch from database
    const whereClause = category === "all" ? {} : { category: category };

    const [articles, totalItems] = await Promise.all([
      Article.find(whereClause)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Article.countDocuments(whereClause),
    ]);

    // Cache the results
    const cacheExpiry = 300; // 5 minutes
    await Promise.all([
      redis.setex(cacheKey, cacheExpiry, JSON.stringify(articles)),
      redis.setex(countCacheKey, cacheExpiry, totalItems.toString()),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: articles,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        fromCache: false,
      },
      meta: {
        requestedAt: new Date().toISOString(),
        cached: false,
        cacheExpiry: cacheExpiry,
      },
    });
  } catch (error) {
    console.error("Cached pagination error:", error);
    res.status(500).json({
      error: "Cached pagination failed",
      message: error.message,
    });
  }
});

// Cache invalidation when articles are modified
const invalidateArticleCache = async (category = null) => {
  try {
    const pattern = category ? `articles:${category}:*` : "articles:*";
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Invalidated ${keys.length} cache entries`);
    }
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
};

// Article creation endpoint with cache invalidation
app.post("/api/articles", async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();

    // Invalidate relevant caches
    await invalidateArticleCache(article.category);
    await invalidateArticleCache("all");

    res.status(201).json({
      message: "Article created successfully",
      article: article,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Pagination with Search and Filters

```javascript
// Advanced search and filtering with pagination
app.get("/api/users/search", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    // Search and filter parameters
    const searchTerm = req.query.q || "";
    const role = req.query.role;
    const department = req.query.department;
    const isActive = req.query.active;
    const ageMin = req.query.ageMin ? parseInt(req.query.ageMin) : null;
    const ageMax = req.query.ageMax ? parseInt(req.query.ageMax) : null;
    const registeredAfter = req.query.registeredAfter;
    const registeredBefore = req.query.registeredBefore;

    // Sorting parameters
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const allowedSortFields = [
      "name",
      "email",
      "age",
      "department",
      "createdAt",
      "lastLogin",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        error: "Invalid sort field",
        allowedFields: allowedSortFields,
      });
    }

    // Build aggregation pipeline
    const pipeline = [];

    // Match stage with filters
    const matchConditions = {};

    // Text search across multiple fields
    if (searchTerm) {
      matchConditions.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { department: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Role filter
    if (role) {
      matchConditions.role = role;
    }

    // Department filter
    if (department) {
      matchConditions.department = department;
    }

    // Active status filter
    if (isActive !== undefined) {
      matchConditions.isActive = isActive === "true";
    }

    // Age range filter
    if (ageMin || ageMax) {
      matchConditions.age = {};
      if (ageMin) matchConditions.age.$gte = ageMin;
      if (ageMax) matchConditions.age.$lte = ageMax;
    }

    // Date range filter
    if (registeredAfter || registeredBefore) {
      matchConditions.createdAt = {};
      if (registeredAfter)
        matchConditions.createdAt.$gte = new Date(registeredAfter);
      if (registeredBefore)
        matchConditions.createdAt.$lte = new Date(registeredBefore);
    }

    pipeline.push({ $match: matchConditions });

    // Add score for text search relevance
    if (searchTerm) {
      pipeline.push({
        $addFields: {
          searchScore: {
            $add: [
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$name",
                      regex: searchTerm,
                      options: "i",
                    },
                  },
                  10,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$email",
                      regex: searchTerm,
                      options: "i",
                    },
                  },
                  5,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$department",
                      regex: searchTerm,
                      options: "i",
                    },
                  },
                  3,
                  0,
                ],
              },
            ],
          },
        },
      });
    }

    // Faceted search for pagination and aggregations
    pipeline.push({
      $facet: {
        // Data with pagination
        data: [
          {
            $sort: searchTerm
              ? { searchScore: -1, [sortBy]: sortOrder }
              : { [sortBy]: sortOrder },
          },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],

        // Total count
        totalCount: [{ $count: "count" }],

        // Aggregations for filters
        aggregations: [
          {
            $group: {
              _id: null,
              departments: { $addToSet: "$department" },
              roles: { $addToSet: "$role" },
              avgAge: { $avg: "$age" },
              minAge: { $min: "$age" },
              maxAge: { $max: "$age" },
              activeCount: {
                $sum: { $cond: ["$isActive", 1, 0] },
              },
              inactiveCount: {
                $sum: { $cond: ["$isActive", 0, 1] },
              },
            },
          },
        ],
      },
    });

    const result = await User.aggregate(pipeline);

    const users = result[0].data;
    const totalItems = result[0].totalCount[0]?.count || 0;
    const aggregations = result[0].aggregations[0] || {};
    const totalPages = Math.ceil(totalItems / limit);

    // Enhanced response with search metadata
    res.json({
      data: users,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      },
      search: {
        query: searchTerm,
        totalResults: totalItems,
        hasResults: totalItems > 0,
      },
      filters: {
        role: role,
        department: department,
        active: isActive,
        ageRange: {
          min: ageMin,
          max: ageMax,
        },
        dateRange: {
          after: registeredAfter,
          before: registeredBefore,
        },
      },
      sorting: {
        sortBy: sortBy,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
      },
      aggregations: {
        availableDepartments: aggregations.departments || [],
        availableRoles: aggregations.roles || [],
        ageStatistics: {
          average: aggregations.avgAge,
          minimum: aggregations.minAge,
          maximum: aggregations.maxAge,
        },
        statusCounts: {
          active: aggregations.activeCount || 0,
          inactive: aggregations.inactiveCount || 0,
        },
      },
      meta: {
        requestedAt: new Date().toISOString(),
        processingTime: Date.now() - req.startTime,
      },
    });
  } catch (error) {
    console.error("Search pagination error:", error);
    res.status(500).json({
      error: "Search pagination failed",
      message: error.message,
    });
  }
});
```

## Pagination Utilities and Middleware

### Reusable Pagination Middleware

```javascript
// Reusable pagination middleware
const paginationMiddleware = (options = {}) => {
  return (req, res, next) => {
    const {
      defaultLimit = 10,
      maxLimit = 100,
      defaultSort = "createdAt",
      defaultOrder = "desc",
    } = options;

    // Parse and validate pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(
      maxLimit,
      Math.max(1, parseInt(req.query.limit) || defaultLimit)
    );
    const sortBy = req.query.sortBy || defaultSort;
    const sortOrder = req.query.sortOrder || defaultOrder;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Add pagination object to request
    req.pagination = {
      page,
      limit,
      offset,
      sortBy,
      sortOrder: sortOrder === "asc" ? 1 : -1,
      sortOrderString: sortOrder === "asc" ? "asc" : "desc",
    };

    // Helper function to build pagination response
    req.buildPaginationResponse = (data, totalItems, additionalMeta = {}) => {
      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: data,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
        meta: {
          ...additionalMeta,
          requestedAt: new Date().toISOString(),
        },
      };
    };

    next();
  };
};

// Usage with middleware
app.get(
  "/api/products",
  paginationMiddleware({ defaultLimit: 20, maxLimit: 50 }),
  async (req, res) => {
    try {
      const { page, limit, offset, sortBy, sortOrder } = req.pagination;

      // Execute database query
      const [products, totalItems] = await Promise.all([
        Product.find({})
          .sort({ [sortBy]: sortOrder })
          .skip(offset)
          .limit(limit),
        Product.countDocuments({}),
      ]);

      // Use helper to build response
      const response = req.buildPaginationResponse(products, totalItems, {
        sortBy: sortBy,
        sortOrder: req.pagination.sortOrderString,
      });

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

### Pagination Helper Class

```javascript
// Pagination utility class
class PaginationHelper {
  constructor(options = {}) {
    this.defaultLimit = options.defaultLimit || 10;
    this.maxLimit = options.maxLimit || 100;
    this.defaultSort = options.defaultSort || "createdAt";
  }

  // Parse and validate pagination parameters
  parseParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(
      this.maxLimit,
      Math.max(1, parseInt(query.limit) || this.defaultLimit)
    );
    const sortBy = query.sortBy || this.defaultSort;
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      offset,
      sortBy,
      sortOrder,
      skip: offset,
    };
  }

  // Build pagination metadata
  buildMeta(page, limit, totalItems, additionalData = {}) {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
      firstPage: 1,
      lastPage: totalPages > 0 ? totalPages : 1,
      itemsOnCurrentPage: Math.min(limit, totalItems - (page - 1) * limit),
      startIndex: totalItems > 0 ? (page - 1) * limit + 1 : 0,
      endIndex: totalItems > 0 ? Math.min(page * limit, totalItems) : 0,
      ...additionalData,
    };
  }

  // Generate pagination links
  generateLinks(req, page, totalPages, limit) {
    const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
    const queryParams = { ...req.query, limit };

    const links = {};

    if (page > 1) {
      links.first = this.buildUrl(baseUrl, { ...queryParams, page: 1 });
      links.prev = this.buildUrl(baseUrl, { ...queryParams, page: page - 1 });
    }

    if (page < totalPages) {
      links.next = this.buildUrl(baseUrl, { ...queryParams, page: page + 1 });
      links.last = this.buildUrl(baseUrl, { ...queryParams, page: totalPages });
    }

    links.self = this.buildUrl(baseUrl, { ...queryParams, page });

    return links;
  }

  // Helper to build URLs with query parameters
  buildUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.set(key, params[key]);
      }
    });
    return url.toString();
  }

  // Validate page number
  validatePage(page, totalPages) {
    if (page > totalPages && totalPages > 0) {
      throw new Error(`Page ${page} not found. Maximum page is ${totalPages}`);
    }
  }

  // Create complete pagination response
  createResponse(data, totalItems, req, additionalMeta = {}) {
    const params = this.parseParams(req.query);
    const { page, limit } = params;
    const totalPages = Math.ceil(totalItems / limit);

    this.validatePage(page, totalPages);

    return {
      data: data,
      pagination: this.buildMeta(page, limit, totalItems),
      links: this.generateLinks(req, page, totalPages, limit),
      meta: {
        ...additionalMeta,
        requestedAt: new Date().toISOString(),
        params: params,
      },
    };
  }
}

// Usage example
const paginationHelper = new PaginationHelper({
  defaultLimit: 15,
  maxLimit: 100,
  defaultSort: "updatedAt",
});

app.get("/api/comments", async (req, res) => {
  try {
    const params = paginationHelper.parseParams(req.query);

    const [comments, totalItems] = await Promise.all([
      Comment.find({})
        .sort({ [params.sortBy]: params.sortOrder === "asc" ? 1 : -1 })
        .skip(params.offset)
        .limit(params.limit)
        .populate("author", "name email"),
      Comment.countDocuments({}),
    ]);

    const response = paginationHelper.createResponse(
      comments,
      totalItems,
      req,
      {
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      }
    );

    res.json(response);
  } catch (error) {
    if (error.message.includes("Page") && error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.listen(3000);
```

## Best Practices and Performance Optimization

### Performance Considerations

```javascript
// Performance optimization techniques for pagination

// 1. Database Indexing
// Ensure proper indexes exist for sorting and filtering fields
const createIndexes = async () => {
  try {
    // Compound index for common query patterns
    await User.collection.createIndex({
      department: 1,
      createdAt: -1,
      _id: 1,
    });

    // Text index for search functionality
    await User.collection.createIndex({
      name: "text",
      email: "text",
      department: "text",
    });

    // Index for cursor-based pagination
    await User.collection.createIndex({
      createdAt: -1,
      _id: -1,
    });

    console.log("Pagination indexes created successfully");
  } catch (error) {
    console.error("Index creation failed:", error);
  }
};

// 2. Query optimization with projection
app.get("/api/users/optimized", async (req, res) => {
  try {
    const { page, limit, offset } = paginationHelper.parseParams(req.query);

    // Use lean() for better performance and select only needed fields
    const [users, totalItems] = await Promise.all([
      User.find({})
        .select("name email department createdAt isActive") // Only select needed fields
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .lean(), // Returns plain JavaScript objects

      User.countDocuments({}), // Use countDocuments() instead of count()
    ]);

    const response = paginationHelper.createResponse(users, totalItems, req);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Avoid expensive operations on large datasets
app.get("/api/orders/efficient", async (req, res) => {
  try {
    const { page, limit, offset } = paginationHelper.parseParams(req.query);

    // Use aggregation for complex operations
    const pipeline = [
      // Match first to reduce dataset size
      { $match: { status: { $in: ["pending", "processing"] } } },

      // Sort early
      { $sort: { createdAt: -1, _id: -1 } },

      // Facet for efficient pagination
      {
        $facet: {
          data: [
            { $skip: offset },
            { $limit: limit },
            // Lookup only for paginated results
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "customer",
              },
            },
            { $unwind: "$customer" },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Order.aggregate(pipeline);
    const orders = result[0].data;
    const totalItems = result[0].totalCount[0]?.count || 0;

    const response = paginationHelper.createResponse(orders, totalItems, req);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Summary

### Pagination Strategies Comparison:

1. **Offset-Based (Page/Limit)**

   - ✅ **Pros**: Intuitive, supports jumping to specific pages, good for small-medium datasets
   - ❌ **Cons**: Performance degrades with large offsets, inconsistent results if data changes

2. **Cursor-Based**

   - ✅ **Pros**: Consistent performance, handles real-time data well, no duplicate results
   - ❌ **Cons**: Can't jump to arbitrary pages, more complex implementation

3. **Keyset (Seek)**
   - ✅ **Pros**: Best performance for large datasets, consistent results
   - ❌ **Cons**: Requires stable ordering field, limited to specific use cases

### Key Implementation Points:

- **Validate input parameters** - page numbers, limits, sort fields
- **Use proper database indexes** for pagination and sorting fields
- **Implement caching** for frequently accessed pages
- **Provide comprehensive metadata** - total pages, items, navigation links
- **Handle edge cases** - empty results, invalid pages, large offsets
- **Consider performance** - use lean queries, limit field selection
- **Support filtering and search** alongside pagination
- **Use consistent response format** across all paginated endpoints

### Best Practices:

1. Set reasonable default and maximum page sizes
2. Always validate and sanitize input parameters
3. Use database indexes optimized for your pagination patterns
4. Provide helpful metadata and navigation links
5. Consider caching for improved performance
6. Choose the right pagination strategy for your use case
7. Handle errors gracefully with meaningful error messages
8. Document your pagination API clearly for consumers

Pagination is crucial for API performance and user experience, especially when dealing with large datasets. The choice of strategy depends on your specific requirements for performance, consistency, and functionality.
