# Hash Index in PostgreSQL

A Hash index is a specialized index type in PostgreSQL that uses a hash table data structure to provide extremely fast equality lookups. While limited in functionality compared to B-tree indexes, Hash indexes excel in specific scenarios where only exact equality matches are needed.

## What is a Hash Index?

Hash indexes use a hash function to map indexed values to bucket locations within a hash table. This allows for O(1) average-case lookup time for equality operations, making them theoretically faster than B-tree indexes for exact matches. However, they come with significant limitations that restrict their use cases.

### Key Characteristics

```sql
-- Creating Hash indexes (explicit specification required)
CREATE INDEX USING HASH idx_users_email_hash ON users (email);
CREATE INDEX USING HASH idx_sessions_token_hash ON user_sessions (session_token);
CREATE INDEX USING HASH idx_products_sku_hash ON products (sku);

-- Hash indexes ONLY support equality operations
SELECT * FROM users WHERE email = 'john@example.com';  -- ✓ Uses hash index
SELECT * FROM users WHERE email LIKE 'john%';         -- ✗ Cannot use hash index
SELECT * FROM users WHERE email > 'john@example.com'; -- ✗ Cannot use hash index
```

## Hash Index Structure and Properties

### Internal Hash Table Structure

```sql
-- Demonstrate Hash index behavior with test data
CREATE TABLE hash_test (
    id SERIAL PRIMARY KEY,
    lookup_key VARCHAR(50),
    data TEXT
);

-- Insert test data with known distribution
INSERT INTO hash_test (lookup_key, data)
SELECT
    'key_' || generate_series(1, 100000),
    'data_' || generate_series(1, 100000);

-- Create both Hash and B-tree indexes for comparison
CREATE INDEX USING HASH idx_hash_test_key_hash ON hash_test (lookup_key);
CREATE INDEX idx_hash_test_key_btree ON hash_test (lookup_key);

-- Analyze index sizes
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_relation_size(indexrelid) as size_bytes
FROM pg_stat_user_indexes
WHERE tablename = 'hash_test'
ORDER BY indexname;
```

### Hash Function Properties

```sql
-- PostgreSQL uses internal hash functions for different data types
-- Demonstrate hash distribution with sample data
SELECT
    hashtext(lookup_key) as hash_value,
    lookup_key
FROM hash_test
WHERE id <= 10;

-- Hash values are designed to distribute evenly across buckets
-- This ensures good performance characteristics
```

## Supported Operations and Limitations

### Equality Operations Only

```sql
-- SUPPORTED operations with Hash indexes
-- 1. Exact equality (=)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hash_test WHERE lookup_key = 'key_50000';

-- 2. IN operator with specific values
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hash_test WHERE lookup_key IN ('key_1000', 'key_2000', 'key_3000');

-- NOT SUPPORTED operations (will not use Hash index)
-- 1. Range queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hash_test WHERE lookup_key BETWEEN 'key_1000' AND 'key_2000';

-- 2. Pattern matching
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hash_test WHERE lookup_key LIKE 'key_%';

-- 3. Ordering operations
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hash_test ORDER BY lookup_key;

-- 4. Inequality operators
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hash_test WHERE lookup_key > 'key_50000';
```

### NULL Value Handling

```sql
-- Hash indexes can handle NULL values (improvement from earlier versions)
INSERT INTO hash_test (lookup_key, data) VALUES (NULL, 'null_data');

-- NULL equality searches work with Hash indexes
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hash_test WHERE lookup_key IS NULL;

-- But IS NOT NULL still requires table scan
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM hash_test WHERE lookup_key IS NOT NULL;
```

## Performance Characteristics

### Speed Comparison: Hash vs B-tree

```sql
-- Performance benchmarking setup
CREATE TABLE performance_test (
    id BIGSERIAL PRIMARY KEY,
    hash_key VARCHAR(100),
    btree_key VARCHAR(100),
    random_data TEXT
);

-- Insert large dataset
INSERT INTO performance_test (hash_key, btree_key, random_data)
SELECT
    'hash_' || (random() * 1000000)::INTEGER,
    'btree_' || (random() * 1000000)::INTEGER,
    'data_' || generate_series(1, 1000000)
FROM generate_series(1, 1000000);

-- Create indexes
CREATE INDEX USING HASH idx_perf_hash_key ON performance_test (hash_key);
CREATE INDEX idx_perf_btree_key ON performance_test (btree_key);

-- Update statistics
ANALYZE performance_test;

-- Compare exact lookup performance
-- Hash index lookup
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM performance_test WHERE hash_key = 'hash_500000';

-- B-tree index lookup
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM performance_test WHERE btree_key = 'btree_500000';

-- Multiple equality lookups
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT COUNT(*) FROM performance_test
WHERE hash_key IN (
    'hash_100000', 'hash_200000', 'hash_300000',
    'hash_400000', 'hash_500000'
);
```

### Memory Usage and Storage

```sql
-- Compare index storage requirements
SELECT
    'Hash Index' as index_type,
    pg_size_pretty(pg_relation_size('idx_perf_hash_key')) as size
UNION ALL
SELECT
    'B-tree Index' as index_type,
    pg_size_pretty(pg_relation_size('idx_perf_btree_key')) as size;

-- Hash indexes are typically larger than B-tree for same data
-- due to hash table structure and potential empty buckets
```

## Ideal Use Cases for Hash Indexes

### 1. Session Token Management

```sql
-- User session management with exact token lookups
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT
);

-- Hash index for session token lookups (only equality needed)
CREATE INDEX USING HASH idx_sessions_token_hash ON user_sessions (session_token);

-- Typical session validation query
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, expires_at
FROM user_sessions
WHERE session_token = 'abc123def456ghi789jkl012mno345pqr';

-- This is optimal for Hash index: fast O(1) lookup
-- No need for range queries or sorting on session tokens
```

### 2. API Key Authentication

```sql
-- API key management for microservices
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    key_value VARCHAR(64) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    permissions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Hash index for API key lookups
CREATE INDEX USING HASH idx_api_keys_value ON api_keys (key_value);

-- Typical API authentication query
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, service_name, permissions, is_active
FROM api_keys
WHERE key_value = 'sk-1234567890abcdef1234567890abcdef'
AND is_active = TRUE;

-- Fast exact match lookup for authentication
```

### 3. Cache Key Lookups

```sql
-- Application cache management
CREATE TABLE cache_entries (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    hit_count INTEGER DEFAULT 0
);

-- Hash index for cache key lookups
CREATE INDEX USING HASH idx_cache_key_hash ON cache_entries (cache_key);

-- Cache retrieval operations
EXPLAIN (ANALYZE, BUFFERS)
SELECT cache_value
FROM cache_entries
WHERE cache_key = 'user:profile:12345'
AND expires_at > CURRENT_TIMESTAMP;
```

### 4. Lookup Tables and Reference Data

```sql
-- Product SKU lookups in inventory system
CREATE TABLE inventory (
    sku VARCHAR(50) PRIMARY KEY,
    product_name TEXT,
    quantity INTEGER,
    location VARCHAR(20),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hash index for exact SKU lookups
CREATE INDEX USING HASH idx_inventory_sku_hash ON inventory (sku);

-- Inventory queries (exact SKU matches only)
EXPLAIN (ANALYZE, BUFFERS)
SELECT product_name, quantity, location
FROM inventory
WHERE sku = 'PROD-ABC-123-XL-RED';

-- Batch inventory lookups
EXPLAIN (ANALYZE, BUFFERS)
SELECT sku, quantity
FROM inventory
WHERE sku IN (
    'PROD-ABC-123-XL-RED',
    'PROD-DEF-456-M-BLUE',
    'PROD-GHI-789-L-GREEN'
);
```

## Limitations and Disadvantages

### 1. No Range Queries

```sql
-- Hash indexes cannot support range operations
CREATE TABLE sales_data (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(20),
    sale_amount DECIMAL(10,2),
    sale_date DATE
);

-- Hash index on customer_code
CREATE INDEX USING HASH idx_sales_customer_hash ON sales_data (customer_code);

-- This query CANNOT use the Hash index
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM sales_data
WHERE customer_code BETWEEN 'CUST001' AND 'CUST999';

-- Would need B-tree index for range queries
CREATE INDEX idx_sales_customer_btree ON sales_data (customer_code);
```

### 2. No Ordering Support

```sql
-- Hash indexes cannot help with ORDER BY
-- This query cannot use Hash index for ordering
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM sales_data
ORDER BY customer_code;

-- Hash index provides no benefit for sorted results
-- B-tree index would be needed for efficient ordering
```

### 3. No Pattern Matching

```sql
-- Pattern matching operations are not supported
-- These queries cannot use Hash index
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM inventory WHERE sku LIKE 'PROD-ABC%';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM inventory WHERE sku ~ '^PROD-[A-Z]{3}-[0-9]+';

-- Would need B-tree or specialized indexes for pattern matching
```

### 4. Limited Multi-Column Support

```sql
-- Multi-column Hash indexes have limited utility
CREATE INDEX USING HASH idx_multi_hash ON sales_data (customer_code, sale_date);

-- Only works when ALL indexed columns are in equality predicates
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM sales_data
WHERE customer_code = 'CUST001' AND sale_date = '2024-01-15';

-- Cannot use index if only partial columns are specified
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM sales_data WHERE customer_code = 'CUST001';
```

## When to Choose Hash vs B-tree

### Decision Matrix

```sql
-- Use Hash index when:
-- ✓ Only equality lookups needed
-- ✓ No range queries required
-- ✓ No sorting requirements
-- ✓ High-frequency exact match operations
-- ✓ Lookup tables, tokens, keys

-- Example: User authentication system
CREATE TABLE user_auth (
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    last_login TIMESTAMP
);

CREATE INDEX USING HASH idx_auth_username ON user_auth (username);

-- Use B-tree index when:
-- ✓ Range queries needed
-- ✓ Sorting required
-- ✓ Pattern matching support needed
-- ✓ Multi-purpose indexing
-- ✓ General-purpose scenarios

-- Example: Order management system
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    order_date DATE,
    total_amount DECIMAL
);

CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);
```

### Performance Trade-off Analysis

```sql
-- Compare Hash vs B-tree for different scenarios
-- Scenario 1: Pure equality lookups (Hash advantage)
SELECT COUNT(*) FROM performance_test WHERE hash_key = 'specific_value';

-- Scenario 2: Range queries (B-tree required)
SELECT COUNT(*) FROM performance_test WHERE btree_key BETWEEN 'value1' AND 'value2';

-- Scenario 3: Sorting (B-tree required)
SELECT * FROM performance_test ORDER BY btree_key LIMIT 10;

-- Scenario 4: Mixed operations (B-tree more versatile)
SELECT * FROM performance_test
WHERE btree_key = 'specific_value'
ORDER BY btree_key;
```

## Hash Index Maintenance and Monitoring

### Index Statistics and Usage

```sql
-- Monitor Hash index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE indexname LIKE '%hash%'
ORDER BY idx_scan DESC;

-- Check for unused Hash indexes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as wasted_size
FROM pg_stat_user_indexes
WHERE indexname LIKE '%hash%'
AND idx_scan = 0;
```

### Hash Index Bloat and Maintenance

```sql
-- Hash indexes can become bloated with frequent updates
-- Monitor index size growth
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as current_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_stat_user_indexes
WHERE indexname LIKE '%hash%';

-- Rebuild bloated Hash indexes
REINDEX INDEX CONCURRENTLY idx_sessions_token_hash;

-- Consider recreating Hash indexes for heavily updated tables
DROP INDEX IF EXISTS idx_sessions_token_hash;
CREATE INDEX USING HASH idx_sessions_token_hash ON user_sessions (session_token);
```

## Best Practices for Hash Indexes

### 1. Appropriate Use Case Selection

```sql
-- Good candidates for Hash indexes:
-- - Authentication tokens
-- - Session identifiers
-- - API keys
-- - Cache keys
-- - Primary keys used only for equality
-- - Foreign keys in lookup scenarios

-- Example: OAuth token management
CREATE TABLE oauth_tokens (
    access_token VARCHAR(255) PRIMARY KEY,
    refresh_token VARCHAR(255),
    user_id INTEGER,
    client_id INTEGER,
    expires_at TIMESTAMP
);

CREATE INDEX USING HASH idx_oauth_access_token ON oauth_tokens (access_token);
CREATE INDEX USING HASH idx_oauth_refresh_token ON oauth_tokens (refresh_token);
```

### 2. Avoiding Common Pitfalls

```sql
-- DON'T use Hash indexes for:
-- - Columns that need range queries
-- - Columns used in ORDER BY frequently
-- - Columns with pattern matching requirements
-- - Low-selectivity columns
-- - Frequently updated columns (high bloat)

-- Example of WRONG usage:
-- CREATE INDEX USING HASH idx_orders_date_hash ON orders (order_date);
-- This is wrong because dates often need range queries

-- Correct approach:
CREATE INDEX idx_orders_date_btree ON orders (order_date);  -- B-tree for dates
```

### 3. Monitoring and Optimization

```sql
-- Regular monitoring queries for Hash indexes
-- 1. Check usage frequency
SELECT
    indexname,
    idx_scan,
    idx_tup_read,
    CASE
        WHEN idx_scan = 0 THEN 'Never used'
        WHEN idx_scan < 100 THEN 'Rarely used'
        ELSE 'Frequently used'
    END as usage_category
FROM pg_stat_user_indexes
WHERE indexname LIKE '%hash%';

-- 2. Identify performance issues
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    idx_scan,
    ROUND(pg_relation_size(indexrelid)::NUMERIC / NULLIF(idx_scan, 0), 2) as bytes_per_scan
FROM pg_stat_user_indexes
WHERE indexname LIKE '%hash%'
AND idx_scan > 0
ORDER BY bytes_per_scan DESC;
```

## Migration Strategies

### Converting Between Index Types

```sql
-- Converting from B-tree to Hash (when appropriate)
-- Step 1: Analyze current usage
SELECT
    schemaname, tablename, indexname,
    idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname = 'idx_users_email';

-- Step 2: Create Hash index concurrently
CREATE INDEX CONCURRENTLY USING HASH idx_users_email_hash ON users (email);

-- Step 3: Test performance with new index
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE email = 'test@example.com';

-- Step 4: Drop old index if Hash performs better
-- DROP INDEX idx_users_email;

-- Converting from Hash to B-tree (when range queries needed)
-- Create B-tree index to replace Hash
CREATE INDEX CONCURRENTLY idx_users_email_btree ON users (email);
DROP INDEX idx_users_email_hash;
```

Hash indexes in PostgreSQL are specialized tools that excel in specific scenarios requiring fast equality lookups. While they have significant limitations compared to B-tree indexes, they can provide superior performance for applications with predictable access patterns focused on exact matches. The key to successful Hash index usage is understanding when their benefits outweigh their limitations and choosing the right use cases for deployment.
