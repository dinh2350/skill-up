# Different Types of Indexes in PostgreSQL

PostgreSQL supports multiple index types, each optimized for different data patterns and query types. Understanding when and how to use each index type is crucial for database performance optimization.

## Overview of PostgreSQL Index Types

PostgreSQL provides six main index types:

1. **B-tree** (default) - General-purpose indexing
2. **Hash** - Equality comparisons only
3. **GIN** (Generalized Inverted Index) - Complex data types
4. **GiST** (Generalized Search Tree) - Geometric and full-text search
5. **SP-GiST** (Space-Partitioned GiST) - Non-balanced data structures
6. **BRIN** (Block Range Index) - Large, naturally ordered tables

## 1. B-tree Indexes

B-tree is the default and most commonly used index type in PostgreSQL.

### Characteristics

- **Structure**: Balanced tree structure
- **Best for**: Range queries, sorting, equality comparisons
- **Supports**: `<`, `<=`, `=`, `>=`, `>`, `BETWEEN`, `IN`, `IS NULL`, `IS NOT NULL`
- **Ordering**: Maintains sorted order for efficient range scans

### Use Cases

```sql
-- Basic B-tree index creation (default type)
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_employees_hire_date ON employees (hire_date);
CREATE INDEX idx_products_price ON products (price);

-- Multi-column B-tree indexes
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);
CREATE INDEX idx_employees_dept_salary ON employees (department_id, salary DESC);

-- Practical examples
-- 1. Range queries
SELECT * FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';

-- 2. Sorting operations
SELECT * FROM employees
ORDER BY hire_date DESC, salary DESC;

-- 3. Composite queries
SELECT * FROM orders
WHERE customer_id = 12345
AND order_date >= '2024-01-01'
ORDER BY order_date;
```

### Performance Characteristics

```sql
-- B-tree efficiency examples
EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, COUNT(*)
FROM orders
WHERE order_date >= '2024-01-01'
GROUP BY customer_id
ORDER BY customer_id;

-- Index-only scans with covering indexes
CREATE INDEX idx_orders_covering ON orders (customer_id, order_date)
INCLUDE (total_amount);

-- This query can use index-only scan
SELECT customer_id, order_date, total_amount
FROM orders
WHERE customer_id BETWEEN 1000 AND 2000;
```

## 2. Hash Indexes

Hash indexes are optimized for equality comparisons only.

### Characteristics

- **Structure**: Hash table
- **Best for**: Equality operations only
- **Supports**: `=` operator only
- **Limitations**: No range queries, no sorting, larger size than B-tree

### Use Cases

```sql
-- Hash index creation
CREATE INDEX USING HASH idx_users_email_hash ON users (email);
CREATE INDEX USING HASH idx_sessions_token_hash ON user_sessions (session_token);

-- Optimal use cases for hash indexes
-- 1. Exact match lookups
SELECT * FROM users WHERE email = 'user@example.com';

-- 2. Session token lookups
SELECT * FROM user_sessions WHERE session_token = 'abc123def456';

-- 3. API key authentication
CREATE INDEX USING HASH idx_api_keys_hash ON api_keys (key_value);
SELECT * FROM api_keys WHERE key_value = 'sk-1234567890abcdef';
```

### When to Use Hash Indexes

```sql
-- Performance comparison: Hash vs B-tree for equality
-- Hash index - faster for pure equality
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table WHERE unique_code = 'SPECIFIC_VALUE';

-- B-tree index - more versatile but slightly slower for equality
-- but supports range queries
SELECT * FROM large_table WHERE unique_code BETWEEN 'A' AND 'Z';
```

## 3. GIN Indexes (Generalized Inverted Index)

GIN indexes are designed for indexing composite values like arrays, JSONB, and full-text search.

### Characteristics

- **Structure**: Inverted index (maps values to row locations)
- **Best for**: Array operations, JSONB queries, full-text search
- **Supports**: `@>`, `<@`, `?`, `?&`, `?|`, `@@` operators
- **Trade-off**: Larger size, slower updates, excellent for complex searches

### Array Indexing

```sql
-- Array GIN indexes
CREATE INDEX USING GIN idx_products_tags ON products (tags);
CREATE INDEX USING GIN idx_users_skills ON users (skills);

-- Array search queries
-- Find products with specific tags
SELECT * FROM products WHERE tags @> ARRAY['electronics', 'mobile'];

-- Find products with any of these tags
SELECT * FROM products WHERE tags && ARRAY['laptop', 'computer'];

-- Find users with all required skills
SELECT * FROM users WHERE skills @> ARRAY['postgresql', 'python', 'docker'];

-- Practical example: E-commerce product filtering
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT,
    tags TEXT[],
    categories TEXT[],
    attributes JSONB
);

CREATE INDEX USING GIN idx_products_tags_gin ON products (tags);
CREATE INDEX USING GIN idx_products_categories_gin ON products (categories);

-- Multi-faceted search
SELECT p.*
FROM products p
WHERE p.tags @> ARRAY['wireless', 'bluetooth']
AND p.categories @> ARRAY['electronics']
AND p.attributes @> '{"brand": "Apple"}';
```

### JSONB Indexing

```sql
-- JSONB GIN indexes
CREATE INDEX USING GIN idx_users_profile ON users (profile_data);
CREATE INDEX USING GIN idx_orders_metadata ON orders (metadata);

-- JSONB containment queries
SELECT * FROM users
WHERE profile_data @> '{"preferences": {"theme": "dark"}}';

-- JSONB key existence
SELECT * FROM users
WHERE profile_data ? 'phone_number';

-- JSONB path queries
SELECT * FROM orders
WHERE metadata #> '{shipping, address, country}' = '"USA"';

-- Advanced JSONB indexing with expressions
CREATE INDEX USING GIN idx_users_preferences
ON users USING GIN ((profile_data->'preferences'));

-- Specific path indexing
CREATE INDEX USING GIN idx_orders_shipping_country
ON orders USING GIN ((metadata #> '{shipping, address, country}'));
```

### Full-Text Search

```sql
-- Full-text search GIN indexes
CREATE INDEX USING GIN idx_articles_search ON articles
USING GIN (to_tsvector('english', title || ' ' || content));

-- Full-text search queries
SELECT article_id, title, ts_rank(to_tsvector('english', title || ' ' || content),
                                  to_tsquery('english', 'postgresql & performance')) as rank
FROM articles
WHERE to_tsvector('english', title || ' ' || content) @@ to_tsquery('english', 'postgresql & performance')
ORDER BY rank DESC;
```

## 4. GiST Indexes (Generalized Search Tree)

GiST indexes support complex data types and are extensible for custom data types.

### Characteristics

- **Structure**: Balanced tree with lossy compression
- **Best for**: Geometric data, ranges, full-text search, custom types
- **Supports**: Various operators depending on operator class
- **Extensible**: Can be extended for custom data types

### Geometric Data

```sql
-- PostGIS geometric indexing
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name TEXT,
    coordinates GEOMETRY(POINT, 4326)
);

CREATE INDEX USING GiST idx_locations_geom ON locations USING GiST (coordinates);

-- Spatial queries
-- Find locations within distance
SELECT name FROM locations
WHERE ST_DWithin(coordinates, ST_GeomFromText('POINT(-122.4194 37.7749)', 4326), 1000);

-- Find locations within bounding box
SELECT name FROM locations
WHERE coordinates && ST_MakeEnvelope(-122.5, 37.7, -122.3, 37.8, 4326);
```

### Range Types

```sql
-- Range type indexing
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER,
    booking_period DATERANGE
);

CREATE INDEX USING GiST idx_bookings_period ON bookings USING GiST (booking_period);

-- Range queries
-- Find overlapping bookings
SELECT * FROM bookings
WHERE booking_period && '[2024-12-20,2024-12-25)'::daterange;

-- Find bookings that contain a specific date
SELECT * FROM bookings
WHERE booking_period @> '2024-12-22'::date;

-- Practical scheduling system
CREATE TABLE employee_schedules (
    employee_id INTEGER,
    work_period TSRANGE,
    schedule_type TEXT
);

CREATE INDEX USING GiST idx_schedules_period ON employee_schedules USING GiST (work_period);

-- Find available employees for a time slot
SELECT DISTINCT employee_id
FROM employee_schedules
WHERE NOT work_period && '[2024-12-22 09:00, 2024-12-22 17:00)'::tsrange;
```

### Full-Text Search (Alternative to GIN)

```sql
-- GiST for full-text search (alternative to GIN)
CREATE INDEX USING GiST idx_documents_search_gist ON documents
USING GiST (to_tsvector('english', content));

-- Generally GIN is preferred for full-text, but GiST can be useful for:
-- - Phrase queries
-- - Complex text operations
-- - When combined with other GiST-indexable columns
```

## 5. SP-GiST Indexes (Space-Partitioned GiST)

SP-GiST indexes are designed for non-balanced data structures.

### Characteristics

- **Structure**: Space-partitioned tree
- **Best for**: Non-uniformly distributed data, specific data patterns
- **Supports**: Text patterns, IP networks, geometric data with specific distributions

### Text Pattern Matching

```sql
-- SP-GiST for text patterns
CREATE INDEX USING SPGIST idx_urls_pattern ON web_requests USING SPGIST (url);

-- Prefix matching (efficient with SP-GiST)
SELECT * FROM web_requests WHERE url ~ '^/api/v1/';

-- Text-based routing patterns
CREATE INDEX USING SPGIST idx_routes_pattern ON api_routes USING SPGIST (route_pattern);
```

### Network Address Indexing

```sql
-- IP network indexing
CREATE TABLE network_logs (
    id SERIAL PRIMARY KEY,
    client_ip INET,
    request_time TIMESTAMP,
    response_code INTEGER
);

CREATE INDEX USING SPGIST idx_network_ip ON network_logs USING SPGIST (client_ip);

-- Network queries
-- Find requests from specific network
SELECT * FROM network_logs WHERE client_ip << '192.168.1.0/24';

-- Find requests from specific IP
SELECT * FROM network_logs WHERE client_ip = '192.168.1.100';
```

## 6. BRIN Indexes (Block Range Index)

BRIN indexes are designed for very large tables with natural ordering.

### Characteristics

- **Structure**: Block-level summary information
- **Best for**: Very large tables, naturally ordered data, time-series data
- **Size**: Extremely small compared to other index types
- **Trade-off**: Less precise, requires sequential scans within blocks

### Time-Series Data

```sql
-- BRIN for time-series tables
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INTEGER,
    reading_time TIMESTAMP,
    temperature DECIMAL,
    humidity DECIMAL
);

-- BRIN index for naturally ordered timestamp data
CREATE INDEX USING BRIN idx_readings_time_brin ON sensor_readings (reading_time);

-- Also useful for other naturally ordered columns
CREATE INDEX USING BRIN idx_readings_id_brin ON sensor_readings (id);

-- Time-range queries (very efficient with BRIN on large tables)
SELECT AVG(temperature), AVG(humidity)
FROM sensor_readings
WHERE reading_time BETWEEN '2024-01-01' AND '2024-01-31';

-- BRIN is excellent for append-only tables
CREATE TABLE financial_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    account_id INTEGER,
    transaction_date DATE,
    amount DECIMAL
);

CREATE INDEX USING BRIN idx_transactions_date_brin ON financial_transactions (transaction_date);
CREATE INDEX USING BRIN idx_transactions_id_brin ON financial_transactions (transaction_id);
```

### BRIN Configuration

```sql
-- BRIN with custom pages_per_range
CREATE INDEX USING BRIN idx_large_table_brin ON large_table (created_at)
WITH (pages_per_range = 32);

-- Monitor BRIN effectiveness
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'sensor_readings'
AND attname IN ('id', 'reading_time');
```

## Index Selection Guidelines

### Decision Matrix

```sql
-- Use B-tree when:
-- - General purpose indexing
-- - Range queries, sorting, equality
-- - Most common scenarios
CREATE INDEX idx_orders_date_btree ON orders (order_date);

-- Use Hash when:
-- - Only equality comparisons needed
-- - High-frequency exact lookups
-- - No sorting or range queries required
CREATE INDEX USING HASH idx_sessions_token ON sessions (session_token);

-- Use GIN when:
-- - Array operations
-- - JSONB containment queries
-- - Full-text search
-- - Complex composite values
CREATE INDEX USING GIN idx_products_features ON products (features);

-- Use GiST when:
-- - Geometric data (PostGIS)
-- - Range types
-- - Custom data types
-- - Extensible indexing needs
CREATE INDEX USING GiST idx_bookings_period ON bookings (date_range);

-- Use SP-GiST when:
-- - Text pattern matching
-- - IP network queries
-- - Non-uniformly distributed data
CREATE INDEX USING SPGIST idx_logs_ip ON access_logs (client_ip);

-- Use BRIN when:
-- - Very large tables (> millions of rows)
-- - Naturally ordered data
-- - Time-series data
-- - Minimal storage overhead required
CREATE INDEX USING BRIN idx_events_timestamp ON event_log (created_at);
```

## Performance Comparison

### Index Size and Performance Trade-offs

```sql
-- Compare index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
JOIN pg_indexes USING (schemaname, tablename, indexname)
ORDER BY pg_relation_size(indexrelid) DESC;

-- Monitor index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY idx_scan DESC;
```

### Query Performance Analysis

```sql
-- Analyze query performance with different index types
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM products
WHERE tags @> ARRAY['electronics']
AND price BETWEEN 100 AND 500
AND created_at >= '2024-01-01';

-- Index effectiveness query
WITH index_usage AS (
    SELECT
        schemaname,
        tablename,
        indexrelname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
)
SELECT
    *,
    CASE
        WHEN idx_scan = 0 THEN 'Never used'
        WHEN idx_scan < 50 THEN 'Rarely used'
        WHEN idx_scan < 1000 THEN 'Moderately used'
        ELSE 'Frequently used'
    END as usage_category
FROM index_usage
ORDER BY idx_scan DESC;
```

## Best Practices for Index Types

### 1. Index Strategy Planning

```sql
-- Start with B-tree for most cases
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_orders_customer_id ON orders (customer_id);

-- Add specialized indexes as needed
-- For JSONB data
CREATE INDEX USING GIN idx_users_preferences ON users (preferences);

-- For full-text search
CREATE INDEX USING GIN idx_articles_search ON articles
USING GIN (to_tsvector('english', title || ' ' || content));

-- For time-series data
CREATE INDEX USING BRIN idx_events_created_at ON events (created_at);
```

### 2. Monitoring and Maintenance

```sql
-- Regular index maintenance queries
-- Check for unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
    idx_scan
FROM pg_stat_user_indexes s
JOIN pg_index i ON s.indexrelid = i.indexrelid
WHERE idx_scan < 10  -- Rarely used
AND NOT i.indisunique  -- Not unique constraints
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- Monitor index bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_total_relation_size(indexrelid)) as total_size,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 10 * 1024 * 1024; -- > 10MB
```

## Advanced Index Configurations

### Partial Indexes

```sql
-- Partial indexes for all index types
CREATE INDEX idx_active_orders ON orders (order_date)
WHERE status = 'active';

CREATE INDEX USING GIN idx_published_articles ON articles USING GIN (tags)
WHERE published = true;

CREATE INDEX USING BRIN idx_recent_events ON events (created_at)
WHERE created_at >= '2024-01-01';
```

### Expression Indexes

```sql
-- Functional indexes with different types
CREATE INDEX idx_users_lower_email ON users (LOWER(email));

CREATE INDEX USING GIN idx_products_search ON products
USING GIN (to_tsvector('english', name || ' ' || description));

CREATE INDEX USING HASH idx_orders_year ON orders USING HASH (EXTRACT(YEAR FROM order_date));
```

Understanding the different index types in PostgreSQL and their appropriate use cases is essential for database performance optimization. Each index type serves specific query patterns and data characteristics, and choosing the right type can significantly impact query performance, storage requirements, and maintenance overhead.
