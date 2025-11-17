# How do you prevent callback hell?

Callback hell is a common problem in asynchronous JavaScript programming where nested callbacks create deeply indented, hard-to-read, and difficult-to-maintain code. This document explores various strategies and techniques to prevent and resolve callback hell.

## What is Callback Hell?

Callback hell (also known as "Pyramid of Doom") occurs when multiple asynchronous operations are nested within each other, creating a pyramid-like structure that becomes increasingly difficult to read and maintain.

### Example of Callback Hell

```javascript
const fs = require("fs");

// BAD: Callback hell example
function processUserData(userId, callback) {
  // Step 1: Read user file
  fs.readFile(`user_${userId}.json`, "utf8", (err, userData) => {
    if (err) return callback(err);

    const user = JSON.parse(userData);

    // Step 2: Read user's posts
    fs.readFile(`posts_${user.id}.json`, "utf8", (err, postsData) => {
      if (err) return callback(err);

      const posts = JSON.parse(postsData);

      // Step 3: Read user's settings
      fs.readFile(`settings_${user.id}.json`, "utf8", (err, settingsData) => {
        if (err) return callback(err);

        const settings = JSON.parse(settingsData);

        // Step 4: Read user's friends
        fs.readFile(`friends_${user.id}.json`, "utf8", (err, friendsData) => {
          if (err) return callback(err);

          const friends = JSON.parse(friendsData);

          // Step 5: Process and combine all data
          const processedData = {
            user: user,
            posts: posts.filter((post) => post.published),
            settings: settings,
            friendsCount: friends.length,
            lastLogin: new Date().toISOString(),
          };

          // Step 6: Save processed data
          fs.writeFile(
            `processed_${user.id}.json`,
            JSON.stringify(processedData),
            (err) => {
              if (err) return callback(err);

              console.log("Data processed successfully");
              callback(null, processedData);
            }
          );
        });
      });
    });
  });
}

// Using the callback hell function
processUserData(123, (err, result) => {
  if (err) {
    console.error("Processing failed:", err);
    return;
  }
  console.log("Final result:", result);
});
```

### Problems with Callback Hell

```javascript
// Issues with deeply nested callbacks:

// 1. Poor readability - hard to follow the flow
// 2. Difficult error handling - errors need to be handled at each level
// 3. Hard to maintain - adding new steps requires deep nesting
// 4. Difficult to test - complex nested structure is hard to unit test
// 5. Variable scope issues - variables from outer scopes can be accidentally modified
// 6. Code duplication - similar error handling repeated at each level

function demonstrateProblems(callback) {
  getData((err, data1) => {
    if (err) return callback(err); // Error handling repetition

    processData(data1, (err, data2) => {
      if (err) return callback(err); // Error handling repetition

      validateData(data2, (err, data3) => {
        if (err) return callback(err); // Error handling repetition

        saveData(data3, (err, data4) => {
          if (err) return callback(err); // Error handling repetition

          // Deep nesting makes it hard to follow the logic
          callback(null, data4);
        });
      });
    });
  });
}
```

## Solution 1: Named Functions (Function Extraction)

Break down nested callbacks into separate named functions to improve readability and maintainability.

```javascript
const fs = require("fs");
const path = require("path");

// GOOD: Using named functions to avoid nesting
function processUserDataWithNamedFunctions(userId, callback) {
  readUserFile(userId, callback);
}

function readUserFile(userId, callback) {
  fs.readFile(`user_${userId}.json`, "utf8", (err, userData) => {
    if (err) {
      console.error("Failed to read user file:", err);
      return callback(err);
    }

    let user;
    try {
      user = JSON.parse(userData);
    } catch (parseErr) {
      console.error("Failed to parse user data:", parseErr);
      return callback(parseErr);
    }

    readUserPosts(user, callback);
  });
}

function readUserPosts(user, callback) {
  fs.readFile(`posts_${user.id}.json`, "utf8", (err, postsData) => {
    if (err) {
      console.error("Failed to read posts file:", err);
      return callback(err);
    }

    let posts;
    try {
      posts = JSON.parse(postsData);
    } catch (parseErr) {
      console.error("Failed to parse posts data:", parseErr);
      return callback(parseErr);
    }

    user.posts = posts.filter((post) => post.published);
    readUserSettings(user, callback);
  });
}

function readUserSettings(user, callback) {
  fs.readFile(`settings_${user.id}.json`, "utf8", (err, settingsData) => {
    if (err) {
      console.error("Failed to read settings file:", err);
      return callback(err);
    }

    let settings;
    try {
      settings = JSON.parse(settingsData);
    } catch (parseErr) {
      console.error("Failed to parse settings data:", parseErr);
      return callback(parseErr);
    }

    user.settings = settings;
    readUserFriends(user, callback);
  });
}

function readUserFriends(user, callback) {
  fs.readFile(`friends_${user.id}.json`, "utf8", (err, friendsData) => {
    if (err) {
      console.error("Failed to read friends file:", err);
      return callback(err);
    }

    let friends;
    try {
      friends = JSON.parse(friendsData);
    } catch (parseErr) {
      console.error("Failed to parse friends data:", parseErr);
      return callback(parseErr);
    }

    user.friendsCount = friends.length;
    processAndSaveUserData(user, callback);
  });
}

function processAndSaveUserData(user, callback) {
  const processedData = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    posts: user.posts,
    settings: user.settings,
    friendsCount: user.friendsCount,
    lastLogin: new Date().toISOString(),
    processedAt: new Date().toISOString(),
  };

  const outputFile = `processed_${user.id}.json`;
  fs.writeFile(outputFile, JSON.stringify(processedData, null, 2), (err) => {
    if (err) {
      console.error("Failed to save processed data:", err);
      return callback(err);
    }

    console.log(`Data processed and saved to ${outputFile}`);
    callback(null, processedData);
  });
}

// Usage remains the same but code is much more readable
processUserDataWithNamedFunctions(123, (err, result) => {
  if (err) {
    console.error("Processing failed:", err);
    return;
  }
  console.log("Processing completed successfully");
  console.log("User:", result.user.name);
  console.log("Posts count:", result.posts.length);
  console.log("Friends count:", result.friendsCount);
});
```

## Solution 2: Promises

Convert callback-based functions to use Promises, which provide better composition and error handling.

```javascript
const fs = require("fs").promises;
const path = require("path");

// GOOD: Using Promises to avoid callback hell
class UserDataProcessor {
  constructor() {
    this.userCache = new Map();
  }

  async processUserData(userId) {
    try {
      console.log(`Starting to process user ${userId}`);

      // Step 1: Read and parse user file
      const user = await this.readUserFile(userId);
      console.log(`User loaded: ${user.name}`);

      // Step 2: Read and filter posts
      const posts = await this.readUserPosts(user.id);
      console.log(`Found ${posts.length} published posts`);

      // Step 3: Read user settings
      const settings = await this.readUserSettings(user.id);
      console.log(`Settings loaded: theme=${settings.theme}`);

      // Step 4: Read friends data
      const friends = await this.readUserFriends(user.id);
      console.log(`Friends loaded: ${friends.length} friends`);

      // Step 5: Process and combine all data
      const processedData = this.combineUserData(
        user,
        posts,
        settings,
        friends
      );

      // Step 6: Save processed data
      await this.saveProcessedData(user.id, processedData);
      console.log(`Data processing completed for user ${userId}`);

      return processedData;
    } catch (error) {
      console.error(`Failed to process user ${userId}:`, error.message);
      throw error;
    }
  }

  async readUserFile(userId) {
    try {
      const filePath = `user_${userId}.json`;
      const userData = await fs.readFile(filePath, "utf8");
      return JSON.parse(userData);
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`User file not found for userId: ${userId}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in user file for userId: ${userId}`);
      }
      throw error;
    }
  }

  async readUserPosts(userId) {
    try {
      const filePath = `posts_${userId}.json`;
      const postsData = await fs.readFile(filePath, "utf8");
      const posts = JSON.parse(postsData);

      // Filter and enhance posts
      return posts
        .filter((post) => post.published)
        .map((post) => ({
          ...post,
          wordCount: post.content ? post.content.split(" ").length : 0,
          readingTime: Math.ceil((post.content?.split(" ").length || 0) / 200),
        }))
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(
          `No posts file found for userId: ${userId}, returning empty array`
        );
        return [];
      }
      throw error;
    }
  }

  async readUserSettings(userId) {
    try {
      const filePath = `settings_${userId}.json`;
      const settingsData = await fs.readFile(filePath, "utf8");
      const settings = JSON.parse(settingsData);

      // Apply default settings
      return {
        theme: "light",
        language: "en",
        notifications: true,
        privacy: "public",
        ...settings,
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(
          `No settings file found for userId: ${userId}, using defaults`
        );
        return {
          theme: "light",
          language: "en",
          notifications: true,
          privacy: "public",
        };
      }
      throw error;
    }
  }

  async readUserFriends(userId) {
    try {
      const filePath = `friends_${userId}.json`;
      const friendsData = await fs.readFile(filePath, "utf8");
      const friends = JSON.parse(friendsData);

      // Enhance friends data
      return friends.map((friend) => ({
        ...friend,
        relationshipDuration: this.calculateRelationshipDuration(
          friend.friendsSince
        ),
      }));
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(
          `No friends file found for userId: ${userId}, returning empty array`
        );
        return [];
      }
      throw error;
    }
  }

  combineUserData(user, posts, settings, friends) {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        joinedAt: user.joinedAt,
        profile: user.profile,
      },
      posts: posts,
      settings: settings,
      social: {
        friendsCount: friends.length,
        friends: friends.slice(0, 10), // Top 10 friends
        averageRelationshipDuration:
          this.calculateAverageRelationshipDuration(friends),
      },
      statistics: {
        totalPosts: posts.length,
        totalWordCount: posts.reduce(
          (sum, post) => sum + (post.wordCount || 0),
          0
        ),
        averageReadingTime:
          posts.length > 0
            ? Math.round(
                posts.reduce((sum, post) => sum + (post.readingTime || 0), 0) /
                  posts.length
              )
            : 0,
      },
      metadata: {
        processedAt: new Date().toISOString(),
        version: "1.0.0",
      },
    };
  }

  async saveProcessedData(userId, processedData) {
    const outputFile = `processed_${userId}.json`;
    try {
      await fs.writeFile(outputFile, JSON.stringify(processedData, null, 2));
      console.log(`Processed data saved to ${outputFile}`);
    } catch (error) {
      throw new Error(`Failed to save processed data: ${error.message}`);
    }
  }

  calculateRelationshipDuration(friendsSince) {
    if (!friendsSince) return null;
    const now = new Date();
    const since = new Date(friendsSince);
    const diffTime = Math.abs(now - since);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      days: diffDays,
      years: Math.floor(diffDays / 365),
      months: Math.floor((diffDays % 365) / 30),
    };
  }

  calculateAverageRelationshipDuration(friends) {
    if (friends.length === 0) return null;
    const totalDays = friends.reduce((sum, friend) => {
      return sum + (friend.relationshipDuration?.days || 0);
    }, 0);
    return Math.round(totalDays / friends.length);
  }
}

// Usage with Promises
async function demonstratePromiseUsage() {
  const processor = new UserDataProcessor();

  try {
    const result = await processor.processUserData(123);

    console.log("=== Processing Results ===");
    console.log(`User: ${result.user.name}`);
    console.log(`Posts: ${result.posts.length}`);
    console.log(`Friends: ${result.social.friendsCount}`);
    console.log(`Total word count: ${result.statistics.totalWordCount}`);
    console.log(
      `Average reading time: ${result.statistics.averageReadingTime} minutes`
    );
  } catch (error) {
    console.error("Processing failed:", error.message);
  }
}

// Multiple users processing with Promise.all
async function processMultipleUsers(userIds) {
  const processor = new UserDataProcessor();

  try {
    console.log("Processing multiple users in parallel...");

    const results = await Promise.all(
      userIds.map((userId) => processor.processUserData(userId))
    );

    console.log(`Successfully processed ${results.length} users`);

    // Aggregate statistics
    const totalPosts = results.reduce(
      (sum, user) => sum + user.posts.length,
      0
    );
    const totalFriends = results.reduce(
      (sum, user) => sum + user.social.friendsCount,
      0
    );

    console.log(
      `Aggregate stats: ${totalPosts} posts, ${totalFriends} friends`
    );

    return results;
  } catch (error) {
    console.error("Batch processing failed:", error.message);
    throw error;
  }
}

// Run demonstrations
// demonstratePromiseUsage();
// processMultipleUsers([123, 456, 789]);
```

## Solution 3: Async/Await

Modern JavaScript's async/await syntax provides the most readable solution for handling asynchronous operations.

```javascript
const fs = require("fs").promises;
const path = require("path");

// BEST: Using async/await for the most readable code
class ModernUserProcessor {
  constructor() {
    this.cache = new Map();
    this.rateLimiter = new Map();
  }

  async processUserDataModern(userId) {
    console.log(`🚀 Starting modern processing for user ${userId}`);
    const startTime = Date.now();

    try {
      // Check rate limiting
      await this.checkRateLimit(userId);

      // Sequential operations with clear flow
      const user = await this.fetchUserData(userId);
      const [posts, settings, friends, analytics] =
        await this.fetchUserRelatedData(user.id);

      // Process and enhance data
      const processedData = await this.enhanceUserData(
        user,
        posts,
        settings,
        friends,
        analytics
      );

      // Save and finalize
      await this.saveAndNotify(user.id, processedData);

      const processingTime = Date.now() - startTime;
      console.log(
        `✅ User ${userId} processed successfully in ${processingTime}ms`
      );

      return {
        ...processedData,
        metadata: {
          ...processedData.metadata,
          processingTime: processingTime,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(
        `❌ Failed to process user ${userId} after ${processingTime}ms:`,
        error.message
      );

      // Log error details for debugging
      await this.logError(userId, error, processingTime);
      throw error;
    }
  }

  async checkRateLimit(userId) {
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(userId);

    if (lastRequest && now - lastRequest < 1000) {
      // 1 second rate limit
      throw new Error(`Rate limit exceeded for user ${userId}. Please wait.`);
    }

    this.rateLimiter.set(userId, now);
  }

  async fetchUserData(userId) {
    console.log(`📖 Reading user data for ${userId}`);

    // Check cache first
    const cacheKey = `user_${userId}`;
    if (this.cache.has(cacheKey)) {
      console.log(`📚 User data found in cache for ${userId}`);
      return this.cache.get(cacheKey);
    }

    try {
      const userData = await fs.readFile(`user_${userId}.json`, "utf8");
      const user = JSON.parse(userData);

      // Validate required fields
      this.validateUserData(user);

      // Cache the result
      this.cache.set(cacheKey, user);

      console.log(`✅ User data loaded: ${user.name} (${user.email})`);
      return user;
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`User ${userId} not found`);
      }
      throw new Error(`Failed to load user ${userId}: ${error.message}`);
    }
  }

  async fetchUserRelatedData(userId) {
    console.log(`📊 Fetching related data for user ${userId}`);

    // Parallel execution of independent operations
    const [posts, settings, friends, analytics] = await Promise.all([
      this.fetchUserPosts(userId),
      this.fetchUserSettings(userId),
      this.fetchUserFriends(userId),
      this.fetchUserAnalytics(userId),
    ]);

    console.log(`✅ All related data fetched for user ${userId}`);
    return [posts, settings, friends, analytics];
  }

  async fetchUserPosts(userId) {
    try {
      const postsData = await fs.readFile(`posts_${userId}.json`, "utf8");
      const posts = JSON.parse(postsData);

      // Process posts with additional metadata
      const processedPosts = posts
        .filter((post) => post.published && !post.deleted)
        .map((post) => ({
          ...post,
          wordCount: this.calculateWordCount(post.content),
          readingTime: this.calculateReadingTime(post.content),
          engagement: this.calculateEngagement(post),
          tags: post.tags || [],
          lastModified: post.lastModified || post.publishedAt,
        }))
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      console.log(
        `📝 Loaded ${processedPosts.length} posts for user ${userId}`
      );
      return processedPosts;
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(`⚠️  No posts found for user ${userId}`);
        return [];
      }
      throw error;
    }
  }

  async fetchUserSettings(userId) {
    try {
      const settingsData = await fs.readFile(`settings_${userId}.json`, "utf8");
      const settings = JSON.parse(settingsData);

      // Merge with defaults and validate
      const finalSettings = {
        // Defaults
        theme: "light",
        language: "en",
        timezone: "UTC",
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
        privacy: {
          profile: "public",
          posts: "friends",
          activity: "private",
        },
        // User overrides
        ...settings,
        // System settings
        lastUpdated: new Date().toISOString(),
      };

      console.log(
        `⚙️  Settings loaded for user ${userId}: theme=${finalSettings.theme}`
      );
      return finalSettings;
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(`⚠️  Using default settings for user ${userId}`);
        return this.getDefaultSettings();
      }
      throw error;
    }
  }

  async fetchUserFriends(userId) {
    try {
      const friendsData = await fs.readFile(`friends_${userId}.json`, "utf8");
      const friends = JSON.parse(friendsData);

      // Enhance friends data
      const enhancedFriends = await Promise.all(
        friends.map(async (friend) => ({
          ...friend,
          relationshipDuration: this.calculateRelationshipDuration(
            friend.friendsSince
          ),
          mutualFriends: await this.calculateMutualFriends(userId, friend.id),
          lastInteraction: friend.lastInteraction || null,
          status: friend.isActive ? "active" : "inactive",
        }))
      );

      console.log(
        `👥 Loaded ${enhancedFriends.length} friends for user ${userId}`
      );
      return enhancedFriends;
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(`⚠️  No friends found for user ${userId}`);
        return [];
      }
      throw error;
    }
  }

  async fetchUserAnalytics(userId) {
    try {
      const analyticsData = await fs.readFile(
        `analytics_${userId}.json`,
        "utf8"
      );
      const analytics = JSON.parse(analyticsData);

      // Calculate additional metrics
      const enhancedAnalytics = {
        ...analytics,
        calculatedMetrics: {
          averagePostsPerMonth: this.calculateAveragePostsPerMonth(
            analytics.postsHistory
          ),
          engagementTrend: this.calculateEngagementTrend(
            analytics.engagementHistory
          ),
          peakActivityHours: this.calculatePeakActivityHours(
            analytics.activityLog
          ),
          topCategories: this.calculateTopCategories(analytics.categoryData),
        },
        lastCalculated: new Date().toISOString(),
      };

      console.log(`📈 Analytics loaded for user ${userId}`);
      return enhancedAnalytics;
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(`⚠️  No analytics found for user ${userId}`);
        return this.getEmptyAnalytics();
      }
      throw error;
    }
  }

  async enhanceUserData(user, posts, settings, friends, analytics) {
    console.log(`🔄 Enhancing data for user ${user.id}`);

    // Create comprehensive user profile
    const enhancedData = {
      user: {
        ...user,
        profile: {
          ...user.profile,
          completionScore: this.calculateProfileCompletion(user),
          verificationStatus: this.checkVerificationStatus(user),
          accountAge: this.calculateAccountAge(user.joinedAt),
        },
      },

      content: {
        posts: posts,
        statistics: {
          totalPosts: posts.length,
          totalWords: posts.reduce(
            (sum, post) => sum + (post.wordCount || 0),
            0
          ),
          averageWordsPerPost:
            posts.length > 0
              ? Math.round(
                  posts.reduce((sum, post) => sum + (post.wordCount || 0), 0) /
                    posts.length
                )
              : 0,
          totalReadingTime: posts.reduce(
            (sum, post) => sum + (post.readingTime || 0),
            0
          ),
          popularTags: this.extractPopularTags(posts),
          engagementRate: this.calculateOverallEngagement(posts),
        },
      },

      social: {
        friends: friends.slice(0, 50), // Limit for performance
        statistics: {
          totalFriends: friends.length,
          activeFriends: friends.filter((f) => f.status === "active").length,
          averageRelationshipDuration:
            this.calculateAverageRelationshipDuration(friends),
          topMutualConnections: this.getTopMutualConnections(friends),
          friendshipGrowthRate: this.calculateFriendshipGrowthRate(friends),
        },
      },

      settings: settings,
      analytics: analytics,

      metadata: {
        processedAt: new Date().toISOString(),
        dataVersion: "2.0.0",
        processorVersion: "1.0.0",
      },
    };

    console.log(`✅ Data enhancement completed for user ${user.id}`);
    return enhancedData;
  }

  async saveAndNotify(userId, processedData) {
    console.log(`💾 Saving processed data for user ${userId}`);

    try {
      // Save to file system
      const outputFile = `processed_${userId}.json`;
      await fs.writeFile(outputFile, JSON.stringify(processedData, null, 2));

      // Save summary for quick access
      const summary = this.createSummary(processedData);
      const summaryFile = `summary_${userId}.json`;
      await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));

      // Send notification (mock)
      await this.sendProcessingNotification(userId, processedData);

      console.log(`✅ Data saved successfully for user ${userId}`);
    } catch (error) {
      throw new Error(
        `Failed to save data for user ${userId}: ${error.message}`
      );
    }
  }

  // Utility methods
  validateUserData(user) {
    const requiredFields = ["id", "name", "email", "joinedAt"];
    for (const field of requiredFields) {
      if (!user[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  calculateWordCount(content) {
    return content ? content.split(/\s+/).length : 0;
  }

  calculateReadingTime(content) {
    const words = this.calculateWordCount(content);
    return Math.ceil(words / 200); // 200 words per minute
  }

  calculateEngagement(post) {
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    const shares = post.shares || 0;
    return likes + comments * 2 + shares * 3; // Weighted engagement
  }

  calculateRelationshipDuration(friendsSince) {
    if (!friendsSince) return null;
    const now = new Date();
    const since = new Date(friendsSince);
    const diffTime = Math.abs(now - since);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      days: diffDays,
      years: Math.floor(diffDays / 365),
      months: Math.floor((diffDays % 365) / 30),
    };
  }

  async calculateMutualFriends(userId1, userId2) {
    // Mock implementation
    return Math.floor(Math.random() * 20);
  }

  getDefaultSettings() {
    return {
      theme: "light",
      language: "en",
      timezone: "UTC",
      notifications: { email: true, push: false, sms: false },
      privacy: { profile: "public", posts: "friends", activity: "private" },
    };
  }

  getEmptyAnalytics() {
    return {
      postsHistory: [],
      engagementHistory: [],
      activityLog: [],
      categoryData: {},
    };
  }

  createSummary(processedData) {
    return {
      userId: processedData.user.id,
      userName: processedData.user.name,
      postsCount: processedData.content.posts.length,
      friendsCount: processedData.social.statistics.totalFriends,
      lastProcessed: processedData.metadata.processedAt,
      profileCompletion: processedData.user.profile.completionScore,
      engagementRate: processedData.content.statistics.engagementRate,
    };
  }

  async sendProcessingNotification(userId, processedData) {
    // Mock notification service
    console.log(`📧 Notification sent to user ${userId}: Processing completed`);
  }

  async logError(userId, error, processingTime) {
    const errorLog = {
      userId: userId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      processingTime: processingTime,
    };

    console.log(`📋 Error logged for user ${userId}:`, errorLog);
  }

  // Additional utility methods would be implemented here...
  calculateProfileCompletion(user) {
    return 85;
  } // Mock
  checkVerificationStatus(user) {
    return "verified";
  } // Mock
  calculateAccountAge(joinedAt) {
    return { years: 2, months: 3 };
  } // Mock
  extractPopularTags(posts) {
    return ["tech", "lifestyle"];
  } // Mock
  calculateOverallEngagement(posts) {
    return 4.5;
  } // Mock
  calculateAverageRelationshipDuration(friends) {
    return 365;
  } // Mock
  getTopMutualConnections(friends) {
    return [];
  } // Mock
  calculateFriendshipGrowthRate(friends) {
    return 2.5;
  } // Mock
  calculateAveragePostsPerMonth(history) {
    return 5;
  } // Mock
  calculateEngagementTrend(history) {
    return "increasing";
  } // Mock
  calculatePeakActivityHours(activityLog) {
    return [9, 14, 20];
  } // Mock
  calculateTopCategories(categoryData) {
    return ["tech", "personal"];
  } // Mock
}

// Usage examples
async function demonstrateModernApproach() {
  const processor = new ModernUserProcessor();

  try {
    console.log("=== Modern Async/Await Processing ===");

    // Single user processing
    const result = await processor.processUserDataModern(123);

    console.log("\n=== Processing Summary ===");
    console.log(`User: ${result.user.name}`);
    console.log(`Posts: ${result.content.posts.length}`);
    console.log(`Friends: ${result.social.statistics.totalFriends}`);
    console.log(`Processing time: ${result.metadata.processingTime}ms`);
  } catch (error) {
    console.error("Processing failed:", error.message);
  }
}

// Batch processing with error handling
async function processBatchUsers(userIds) {
  const processor = new ModernUserProcessor();
  const results = [];
  const errors = [];

  console.log(`🚀 Processing batch of ${userIds.length} users`);

  for (const userId of userIds) {
    try {
      const result = await processor.processUserDataModern(userId);
      results.push(result);
      console.log(`✅ User ${userId} completed`);
    } catch (error) {
      errors.push({ userId, error: error.message });
      console.error(`❌ User ${userId} failed: ${error.message}`);
    }
  }

  console.log(
    `\n📊 Batch Results: ${results.length} successful, ${errors.length} failed`
  );
  return { results, errors };
}

// Concurrent processing with limited parallelism
async function processConcurrentUsers(userIds, maxConcurrent = 3) {
  const processor = new ModernUserProcessor();
  const results = [];

  console.log(
    `🚀 Processing ${userIds.length} users with max concurrency ${maxConcurrent}`
  );

  for (let i = 0; i < userIds.length; i += maxConcurrent) {
    const batch = userIds.slice(i, i + maxConcurrent);

    console.log(
      `Processing batch ${
        Math.floor(i / maxConcurrent) + 1
      }: users ${batch.join(", ")}`
    );

    const batchPromises = batch.map((userId) =>
      processor.processUserDataModern(userId).catch((error) => ({
        userId,
        error: error.message,
      }))
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches to prevent overwhelming the system
    if (i + maxConcurrent < userIds.length) {
      console.log("⏳ Waiting before next batch...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const successful = results.filter((r) => !r.error).length;
  const failed = results.filter((r) => r.error).length;

  console.log(
    `\n📊 Concurrent Results: ${successful} successful, ${failed} failed`
  );
  return results;
}

// Example usage (commented out to prevent execution)
// demonstrateModernApproach();
// processBatchUsers([123, 456, 789]);
// processConcurrentUsers([123, 456, 789, 101, 102], 2);
```

## Solution 4: Using Control Flow Libraries

Leverage libraries like `async.js` to manage complex asynchronous operations.

```javascript
const async = require("async");
const fs = require("fs");

// Using async.js library to prevent callback hell
function processUserDataWithAsyncLib(userId, callback) {
  console.log(`Processing user ${userId} with async.js`);

  async.waterfall(
    [
      // Step 1: Read user file
      function (cb) {
        fs.readFile(`user_${userId}.json`, "utf8", (err, data) => {
          if (err) return cb(err);

          let user;
          try {
            user = JSON.parse(data);
          } catch (parseErr) {
            return cb(parseErr);
          }

          console.log(`✅ User loaded: ${user.name}`);
          cb(null, user);
        });
      },

      // Step 2: Parallel data fetching
      function (user, cb) {
        async.parallel(
          {
            posts: function (parallelCb) {
              fs.readFile(`posts_${user.id}.json`, "utf8", (err, data) => {
                if (err) {
                  if (err.code === "ENOENT") {
                    return parallelCb(null, []);
                  }
                  return parallelCb(err);
                }

                try {
                  const posts = JSON.parse(data);
                  const publishedPosts = posts.filter((post) => post.published);
                  console.log(
                    `✅ Posts loaded: ${publishedPosts.length} posts`
                  );
                  parallelCb(null, publishedPosts);
                } catch (parseErr) {
                  parallelCb(parseErr);
                }
              });
            },

            settings: function (parallelCb) {
              fs.readFile(`settings_${user.id}.json`, "utf8", (err, data) => {
                if (err) {
                  if (err.code === "ENOENT") {
                    // Return default settings
                    return parallelCb(null, {
                      theme: "light",
                      language: "en",
                      notifications: true,
                    });
                  }
                  return parallelCb(err);
                }

                try {
                  const settings = JSON.parse(data);
                  console.log(`✅ Settings loaded: theme=${settings.theme}`);
                  parallelCb(null, settings);
                } catch (parseErr) {
                  parallelCb(parseErr);
                }
              });
            },

            friends: function (parallelCb) {
              fs.readFile(`friends_${user.id}.json`, "utf8", (err, data) => {
                if (err) {
                  if (err.code === "ENOENT") {
                    return parallelCb(null, []);
                  }
                  return parallelCb(err);
                }

                try {
                  const friends = JSON.parse(data);
                  console.log(`✅ Friends loaded: ${friends.length} friends`);
                  parallelCb(null, friends);
                } catch (parseErr) {
                  parallelCb(parseErr);
                }
              });
            },
          },
          function (err, results) {
            if (err) return cb(err);

            // Combine user with parallel results
            const combinedData = {
              user: user,
              posts: results.posts,
              settings: results.settings,
              friends: results.friends,
            };

            console.log("✅ All parallel data fetched");
            cb(null, combinedData);
          }
        );
      },

      // Step 3: Process the combined data
      function (combinedData, cb) {
        console.log("🔄 Processing combined data...");

        const processedData = {
          user: {
            id: combinedData.user.id,
            name: combinedData.user.name,
            email: combinedData.user.email,
          },
          posts: combinedData.posts.map((post) => ({
            ...post,
            wordCount: post.content ? post.content.split(" ").length : 0,
          })),
          settings: combinedData.settings,
          social: {
            friendsCount: combinedData.friends.length,
            friends: combinedData.friends.slice(0, 10), // Top 10 friends
          },
          statistics: {
            totalPosts: combinedData.posts.length,
            totalWords: combinedData.posts.reduce(
              (sum, post) =>
                sum + (post.content ? post.content.split(" ").length : 0),
              0
            ),
          },
          processedAt: new Date().toISOString(),
        };

        console.log("✅ Data processing completed");
        cb(null, processedData);
      },

      // Step 4: Save processed data
      function (processedData, cb) {
        console.log("💾 Saving processed data...");

        const outputFile = `processed_${processedData.user.id}.json`;
        fs.writeFile(
          outputFile,
          JSON.stringify(processedData, null, 2),
          (err) => {
            if (err) return cb(err);

            console.log(`✅ Data saved to ${outputFile}`);
            cb(null, processedData);
          }
        );
      },
    ],
    function (err, finalResult) {
      if (err) {
        console.error(`❌ Processing failed for user ${userId}:`, err.message);
        return callback(err);
      }

      console.log(`🎉 Successfully processed user ${userId}`);
      callback(null, finalResult);
    }
  );
}

// Batch processing with async.js
function processBatchUsersWithAsync(userIds, callback) {
  console.log(`🚀 Processing ${userIds.length} users in batch`);

  async.mapLimit(
    userIds,
    2,
    function (userId, mapCb) {
      console.log(`Starting processing for user ${userId}`);
      processUserDataWithAsyncLib(userId, mapCb);
    },
    function (err, results) {
      if (err) {
        console.error("❌ Batch processing failed:", err.message);
        return callback(err);
      }

      console.log(
        `🎉 Batch processing completed: ${results.length} users processed`
      );

      // Aggregate results
      const summary = {
        totalUsers: results.length,
        totalPosts: results.reduce((sum, user) => sum + user.posts.length, 0),
        totalFriends: results.reduce(
          (sum, user) => sum + user.social.friendsCount,
          0
        ),
        processedAt: new Date().toISOString(),
      };

      callback(null, { users: results, summary: summary });
    }
  );
}

// Queue-based processing with async.js
function createUserProcessingQueue() {
  console.log("🔧 Creating user processing queue");

  const processingQueue = async.queue(function (task, queueCb) {
    const { userId, priority } = task;

    console.log(`🔄 Queue processing user ${userId} (priority: ${priority})`);

    processUserDataWithAsyncLib(userId, (err, result) => {
      if (err) {
        console.error(
          `❌ Queue processing failed for user ${userId}:`,
          err.message
        );
        return queueCb(err);
      }

      console.log(`✅ Queue processing completed for user ${userId}`);
      queueCb(null, result);
    });
  }, 2); // Process 2 users concurrently

  // Queue event handlers
  processingQueue.drain(function () {
    console.log("🏁 All queued users have been processed");
  });

  processingQueue.error(function (err, task) {
    console.error(`❌ Queue error for user ${task.userId}:`, err.message);
  });

  // Add users to queue
  const users = [
    { userId: 123, priority: 1 },
    { userId: 456, priority: 2 },
    { userId: 789, priority: 1 },
    { userId: 101, priority: 3 },
  ];

  users.forEach((user) => {
    processingQueue.push(user, function (err, result) {
      if (err) {
        console.error(
          `Queue callback error for user ${user.userId}:`,
          err.message
        );
      } else {
        console.log(
          `Queue callback success for user ${user.userId}: ${result.user.name}`
        );
      }
    });
  });

  return processingQueue;
}

// Usage examples
console.log("=== Async.js Library Examples ===");

// Single user processing
processUserDataWithAsyncLib(123, (err, result) => {
  if (err) {
    console.error("Single user processing failed:", err.message);
  } else {
    console.log("Single user processing completed:", result.user.name);
  }
});

// Batch processing
processBatchUsersWithAsync([123, 456, 789], (err, result) => {
  if (err) {
    console.error("Batch processing failed:", err.message);
  } else {
    console.log("Batch processing summary:", result.summary);
  }
});

// Queue-based processing
const queue = createUserProcessingQueue();
```

## Solution 5: Error-First Callback Pattern

Implement consistent error handling to prevent callback hell from becoming error hell.

```javascript
// Implementing proper error-first callback pattern
function robustAsyncOperation(data, callback) {
  // Validate input first
  if (!data || typeof data !== "object") {
    return callback(new Error("Invalid input data"));
  }

  if (!callback || typeof callback !== "function") {
    throw new Error("Callback is required and must be a function");
  }

  // Simulate async operation with proper error handling
  setTimeout(() => {
    try {
      if (Math.random() > 0.7) {
        // 30% success rate for demonstration
        const result = {
          id: data.id,
          processed: true,
          timestamp: new Date().toISOString(),
          data: `Processed: ${JSON.stringify(data)}`,
        };

        // Always call callback with (error, result) pattern
        callback(null, result);
      } else {
        // Create descriptive error
        const error = new Error(`Processing failed for id: ${data.id}`);
        error.code = "PROCESSING_FAILED";
        error.data = data;
        callback(error);
      }
    } catch (unexpectedError) {
      // Handle unexpected errors
      callback(unexpectedError);
    }
  }, Math.random() * 1000 + 500);
}

// Wrapper function for better error handling
function safeAsyncWrapper(operation) {
  return function (data, callback) {
    // Input validation
    if (!callback || typeof callback !== "function") {
      throw new Error("Callback is required");
    }

    try {
      operation(data, (err, result) => {
        // Ensure callback is only called once
        if (callback._called) {
          console.warn("Warning: Callback already called");
          return;
        }
        callback._called = true;

        if (err) {
          // Enhance error with additional context
          if (typeof err === "string") {
            err = new Error(err);
          }
          err.timestamp = new Date().toISOString();
          err.operation = operation.name || "unknown";
        }

        callback(err, result);
      });
    } catch (syncError) {
      // Handle synchronous errors
      process.nextTick(() => callback(syncError));
    }
  };
}

// Chain operations with proper error handling
function chainedOperations(initialData, callback) {
  const safeOperation = safeAsyncWrapper(robustAsyncOperation);

  console.log("Starting chained operations...");

  // Step 1
  safeOperation(initialData, (err, result1) => {
    if (err) {
      console.error("Step 1 failed:", err.message);
      return callback(err);
    }

    console.log("Step 1 completed:", result1.id);

    // Step 2
    safeOperation(
      { id: result1.id + "_step2", previousResult: result1 },
      (err, result2) => {
        if (err) {
          console.error("Step 2 failed:", err.message);
          return callback(err);
        }

        console.log("Step 2 completed:", result2.id);

        // Step 3
        safeOperation(
          { id: result2.id + "_step3", previousResult: result2 },
          (err, result3) => {
            if (err) {
              console.error("Step 3 failed:", err.message);
              return callback(err);
            }

            console.log("Step 3 completed:", result3.id);

            // Final result
            const finalResult = {
              step1: result1,
              step2: result2,
              step3: result3,
              chainCompleted: true,
              completedAt: new Date().toISOString(),
            };

            callback(null, finalResult);
          }
        );
      }
    );
  });
}

// Usage with proper error handling
chainedOperations({ id: "initial_data" }, (err, result) => {
  if (err) {
    console.error("Chained operations failed:", err);

    // Log error details
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      timestamp: err.timestamp,
      operation: err.operation,
    });
  } else {
    console.log("Chained operations completed successfully");
    console.log("Final result keys:", Object.keys(result));
  }
});
```

## Best Practices Summary

### 1. Choose the Right Tool for the Job

```javascript
// Use async/await for modern code
async function modernApproach() {
  try {
    const data1 = await operation1();
    const data2 = await operation2(data1);
    const data3 = await operation3(data2);
    return data3;
  } catch (error) {
    console.error("Operation failed:", error);
    throw error;
  }
}

// Use Promises for library compatibility
function promiseApproach() {
  return operation1()
    .then((data1) => operation2(data1))
    .then((data2) => operation3(data2))
    .catch((error) => {
      console.error("Operation failed:", error);
      throw error;
    });
}

// Use named functions for callback-heavy code
function callbackApproach(callback) {
  operation1((err, data1) => {
    if (err) return callback(err);
    operation2(data1, (err, data2) => {
      if (err) return callback(err);
      operation3(data2, callback);
    });
  });
}
```

### 2. Error Handling Strategy

```javascript
// Centralized error handling
class ErrorHandler {
  static handle(error, context = "") {
    console.error(`Error in ${context}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Add error tracking/monitoring here
    // ErrorTracker.track(error, context);
  }

  static async wrapAsync(fn, context) {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      throw error;
    }
  }

  static wrapCallback(fn, context) {
    return function (...args) {
      const callback = args[args.length - 1];

      if (typeof callback !== "function") {
        throw new Error("Callback is required");
      }

      try {
        fn(...args.slice(0, -1), (err, result) => {
          if (err) {
            ErrorHandler.handle(err, context);
          }
          callback(err, result);
        });
      } catch (syncError) {
        ErrorHandler.handle(syncError, context);
        process.nextTick(() => callback(syncError));
      }
    };
  }
}
```

### 3. Performance Considerations

```javascript
// Control concurrency to prevent overwhelming resources
async function processWithConcurrencyLimit(items, processor, limit = 3) {
  const results = [];

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchPromises = batch.map(processor);
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

// Use streaming for large datasets
const { pipeline } = require("stream");
const { promisify } = require("util");
const pipelineAsync = promisify(pipeline);

async function processLargeDataset(inputStream, transformStream, outputStream) {
  try {
    await pipelineAsync(inputStream, transformStream, outputStream);
    console.log("Large dataset processed successfully");
  } catch (error) {
    console.error("Stream processing failed:", error);
    throw error;
  }
}
```

## Migration Guide

### From Callback Hell to Modern Patterns

```javascript
// Before: Callback hell
function oldWay(userId, callback) {
  getUser(userId, (err, user) => {
    if (err) return callback(err);
    getPosts(user.id, (err, posts) => {
      if (err) return callback(err);
      getComments(posts[0].id, (err, comments) => {
        if (err) return callback(err);
        callback(null, { user, posts, comments });
      });
    });
  });
}

// After: Modern async/await
async function newWay(userId) {
  try {
    const user = await getUser(userId);
    const posts = await getPosts(user.id);
    const comments = await getComments(posts[0].id);
    return { user, posts, comments };
  } catch (error) {
    console.error("Operation failed:", error);
    throw error;
  }
}

// Utility to convert callback functions to Promises
function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

// Convert existing callback functions
const getUserAsync = promisify(getUser);
const getPostsAsync = promisify(getPosts);
const getCommentsAsync = promisify(getComments);

// Use converted functions
async function modernConvertedWay(userId) {
  const user = await getUserAsync(userId);
  const posts = await getPostsAsync(user.id);
  const comments = await getCommentsAsync(posts[0].id);
  return { user, posts, comments };
}
```

## Conclusion

Preventing callback hell is essential for maintaining readable, maintainable, and debuggable Node.js applications. The key strategies are:

1. **Use Named Functions** - Break down nested callbacks into separate functions
2. **Embrace Promises** - Convert callback-based operations to Promises
3. **Leverage Async/Await** - Use modern syntax for the most readable code
4. **Control Flow Libraries** - Use libraries like async.js for complex scenarios
5. **Proper Error Handling** - Implement consistent error handling patterns
6. **Limit Concurrency** - Prevent resource exhaustion in parallel operations
7. **Use Streaming** - Handle large datasets efficiently

Modern JavaScript provides excellent tools for handling asynchronous operations. While understanding callback patterns is important for legacy code maintenance, new development should prefer async/await for its readability and error handling capabilities.
