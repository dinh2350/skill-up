# When Should You Use Each Type of Index?

Choosing the right index type in PostgreSQL is crucial for optimal database performance. Each index type has specific strengths and use cases. This guide provides a comprehensive decision matrix to help you select the most appropriate index type for your specific scenarios.

## Index Type Overview and Quick Reference

```sql
-- Quick reference for PostgreSQL index types
-- B-tree (Default) - General purpose
CREATE INDEX idx_btree_example ON table_name (column_name);

-- Hash - Equality operations only
CREATE INDEX USING HASH idx_hash_example ON table_name (column_name);

-- GIN - Arrays, JSONB, full-text search
CREATE INDEX USING GIN idx_gin_example ON table_name USING GIN (column_name);

-- GiST - Geometric data, ranges, extensible types
CREATE INDEX USING GIST idx_gist_example ON table_name USING GIST (column_name);

-- BRIN - Large ordered tables, time-series
CREATE INDEX USING BRIN idx_brin_example ON table_name (column_name);

-- SP-GiST - Non-uniform data, specialized patterns
CREATE INDEX USING SPGIST idx_spgist_example ON table_name USING SPGIST (column_name);
```

## Decision Matrix: Choosing the Right Index Type

### B-tree Index - The Default Choice

**When to Use:**

```sql
-- ✅ EXCELLENT for:
-- 1. General-purpose indexing (90% of cases)
CREATE INDEX idx_users_email ON users (email);

-- 2. Range queries and sorting
CREATE INDEX idx_orders_date ON orders (order_date);
SELECT * FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';
SELECT * FROM orders ORDER BY order_date;

-- 3. Equality and inequality operations
CREATE INDEX idx_products_price ON products (price);
SELECT * FROM products WHERE price >= 100;

-- 4. Multi-column indexes for complex queries
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);
SELECT * FROM orders WHERE customer_id = 123 AND order_date >= '2024-01-01';

-- 5. Foreign key columns
CREATE INDEX idx_order_items_order_id ON order_items (order_id);

-- 6. Columns used in JOIN conditions
CREATE INDEX idx_employees_department_id ON employees (department_id);
```

**Avoid B-tree for:**

```sql
-- ❌ Poor choices:
-- Arrays (use GIN instead)
-- CREATE INDEX idx_bad_tags ON products (tags);  -- Wrong for arrays

-- JSONB documents (use GIN instead)
-- CREATE INDEX idx_bad_json ON users (profile_data);  -- Wrong for JSONB

-- Geometric data (use GiST instead)
-- CREATE INDEX idx_bad_geom ON locations (coordinates);  -- Wrong for geometry
```

### Hash Index - Equality-Only Operations

**When to Use:**

```sql
-- ✅ EXCELLENT for:
-- 1. High-frequency exact match lookups
CREATE INDEX USING HASH idx_sessions_token ON user_sessions (session_token);
SELECT * FROM user_sessions WHERE session_token = 'abc123def456';

-- 2. API key authentication
CREATE INDEX USING HASH idx_api_keys ON api_keys (key_value);
SELECT * FROM api_keys WHERE key_value = 'sk-1234567890abcdef';

-- 3. Cache key lookups
CREATE INDEX USING HASH idx_cache_keys ON cache_entries (cache_key);
SELECT cache_value FROM cache_entries WHERE cache_key = 'user:profile:12345';

-- 4. UUID primary keys (when only equality needed)
CREATE INDEX USING HASH idx_documents_uuid ON documents (document_uuid);

-- 5. Lookup tables with exact matches
CREATE INDEX USING HASH idx_country_codes ON countries (country_code);
```

**Avoid Hash for:**

```sql
-- ❌ Poor choices:
-- Range queries
-- SELECT * FROM users WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- Sorting operations
-- SELECT * FROM users ORDER BY username;

-- Pattern matching
-- SELECT * FROM users WHERE email LIKE '%@company.com';

-- Multi-column queries (limited benefit)
-- SELECT * FROM orders WHERE customer_id = 123 AND order_date >= '2024-01-01';
```

### GIN Index - Complex Data Types

**When to Use:**

```sql
-- ✅ EXCELLENT for:
-- 1. Array containment operations
CREATE INDEX USING GIN idx_products_tags ON products USING GIN (tags);
SELECT * FROM products WHERE tags @> ARRAY['electronics', 'mobile'];
SELECT * FROM products WHERE tags && ARRAY['laptop', 'computer'];

-- 2. JSONB document queries
CREATE INDEX USING GIN idx_users_profile ON users USING GIN (profile_data);
SELECT * FROM users WHERE profile_data @> '{"city": "New York"}';
SELECT * FROM users WHERE profile_data ? 'phone_number';

-- 3. Full-text search
CREATE INDEX USING GIN idx_articles_search ON articles
USING GIN (to_tsvector('english', title || ' ' || content));
SELECT * FROM articles WHERE to_tsvector('english', title || ' ' || content)
  @@ to_tsquery('english', 'postgresql & performance');

-- 4. Multi-faceted search systems
CREATE INDEX USING GIN idx_products_features ON products USING GIN (features);
CREATE INDEX USING GIN idx_products_attributes ON products USING GIN (attributes);

-- E-commerce product filtering
SELECT * FROM products
WHERE features @> ARRAY['wireless', 'bluetooth']
AND attributes @> '{"brand": "Apple", "color": "black"}';
```

**Performance Considerations:**

```sql
-- GIN indexes are larger but excellent for read-heavy workloads
SELECT
    'GIN Array Index' as index_type,
    pg_size_pretty(pg_relation_size('idx_products_tags')) as size,
    'Excellent for containment queries' as use_case
UNION ALL
SELECT
    'B-tree Index' as index_type,
    pg_size_pretty(pg_relation_size('idx_products_price')) as size,
    'General purpose' as use_case;
```

### GiST Index - Geometric and Range Data

**When to Use:**

```sql
-- ✅ EXCELLENT for:
-- 1. Geometric/spatial data (PostGIS)
CREATE EXTENSION postgis;
CREATE INDEX USING GIST idx_locations_geom ON locations USING GIST (coordinates);

-- Spatial queries
SELECT * FROM locations
WHERE ST_DWithin(coordinates, ST_GeomFromText('POINT(-122.4194 37.7749)', 4326), 1000);

-- 2. Range types and overlap operations
CREATE INDEX USING GIST idx_bookings_period ON bookings USING GIST (booking_period);
SELECT * FROM bookings WHERE booking_period && '[2024-12-20,2024-12-30)'::daterange;

-- 3. Scheduling and time range conflicts
CREATE INDEX USING GIST idx_employee_shifts ON employee_shifts USING GIST (work_period);
SELECT * FROM employee_shifts
WHERE work_period @> '[2024-12-25 14:00, 2024-12-25 16:00)'::tsrange;

-- 4. Full-text search (alternative to GIN for specific cases)
CREATE INDEX USING GIST idx_documents_text ON documents
USING GIST (to_tsvector('english', content));

-- 5. Custom data types with spatial properties
CREATE INDEX USING GIST idx_custom_spatial ON custom_table USING GIST (custom_type);
```

**Real-world Applications:**

```sql
-- Location-based services
SELECT store_name FROM stores
WHERE service_area && ST_MakeEnvelope(-122.5, 37.7, -122.3, 37.8, 4326);

-- Conference room booking system
SELECT room_id FROM room_bookings
WHERE NOT EXISTS (
    SELECT 1 FROM room_bookings rb2
    WHERE rb2.room_id = room_bookings.room_id
    AND rb2.booking_period && '[2024-12-25 14:00, 2024-12-25 16:00)'::tsrange
);
```

### BRIN Index - Large Ordered Tables

**When to Use:**

```sql
-- ✅ EXCELLENT for:
-- 1. Very large time-series tables (millions+ rows)
CREATE INDEX USING BRIN idx_sensor_data_timestamp ON sensor_readings (timestamp);

-- Time-series analysis
SELECT sensor_id, AVG(temperature)
FROM sensor_readings
WHERE timestamp BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY sensor_id;

-- 2. Append-only tables with sequential IDs
CREATE INDEX USING BRIN idx_log_entries_id ON application_logs (id);
CREATE INDEX USING BRIN idx_audit_log_created ON audit_log (created_at);

-- 3. Naturally ordered data with high correlation
CREATE INDEX USING BRIN idx_sales_date ON sales_history (sale_date);

-- Check column correlation (important for BRIN effectiveness)
SELECT attname, correlation FROM pg_stats
WHERE tablename = 'sensor_readings' AND attname = 'timestamp';
-- correlation close to 1.0 or -1.0 is ideal for BRIN
```

**Size Efficiency:**

```sql
-- BRIN indexes are extremely space-efficient
SELECT
    'BRIN Index' as index_type,
    pg_size_pretty(pg_relation_size('idx_sensor_data_timestamp')) as size,
    pg_size_pretty(pg_total_relation_size('sensor_readings')) as table_size,
    'Perfect for time-series' as use_case
UNION ALL
SELECT
    'B-tree Index' as index_type,
    pg_size_pretty(pg_relation_size('idx_sensor_data_id')) as size,
    pg_size_pretty(pg_total_relation_size('sensor_readings')) as table_size,
    'General purpose' as use_case;
```

**Avoid BRIN for:**

```sql
-- ❌ Poor choices:
-- Randomly distributed data
-- Frequently updated columns (breaks ordering)
-- Small tables (overhead not justified)
-- Exact equality searches on unordered data
```

## Practical Decision Framework

### Step-by-Step Index Selection Process

```sql
-- 1. Analyze your query patterns
-- What operations do you need to support?

-- 2. Examine data characteristics
-- Check data distribution and correlation
SELECT
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats
WHERE tablename = 'your_table'
AND attname = 'your_column';

-- 3. Consider data type
-- Different data types suggest different index types
\d+ your_table  -- Check column data types

-- 4. Evaluate query frequency and performance requirements
-- Monitor actual query patterns
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%your_table%'
ORDER BY calls DESC;
```

### Data Type to Index Type Mapping

```sql
-- INTEGER/BIGINT columns
-- Default: B-tree for most operations
CREATE INDEX idx_user_id ON users (id);  -- B-tree

-- High-frequency exact lookups only: Hash
CREATE INDEX USING HASH idx_session_user_id ON sessions (user_id);

-- Large tables with natural ordering: BRIN
CREATE INDEX USING BRIN idx_large_table_id ON huge_table (id);

-- TEXT/VARCHAR columns
-- General text operations: B-tree
CREATE INDEX idx_user_email ON users (email);

-- Exact match lookups: Hash
CREATE INDEX USING HASH idx_user_username ON users (username);

-- Full-text search: GIN
CREATE INDEX USING GIN idx_articles_content ON articles
USING GIN (to_tsvector('english', content));

-- ARRAY columns
-- Array operations: GIN
CREATE INDEX USING GIN idx_product_tags ON products USING GIN (tags);

-- JSONB columns
-- Document queries: GIN
CREATE INDEX USING GIN idx_user_profile ON users USING GIN (profile_data);

-- Specific path queries: GIN on expression
CREATE INDEX USING GIN idx_user_settings ON users
USING GIN ((profile_data->'settings'));

-- GEOMETRY columns (PostGIS)
-- Spatial operations: GiST
CREATE INDEX USING GIST idx_location_geom ON locations USING GIST (coordinates);

-- Range type columns
-- Range operations: GiST
CREATE INDEX USING GIST idx_booking_period ON bookings USING GIST (date_range);

-- TIMESTAMP columns
-- General date operations: B-tree
CREATE INDEX idx_order_created ON orders (created_at);

-- Large time-series data: BRIN
CREATE INDEX USING BRIN idx_events_timestamp ON events (timestamp);
```

### Query Pattern Analysis

```sql
-- Analyze your specific query patterns to choose optimal indexes

-- Pattern 1: Equality searches
-- Query: SELECT * FROM users WHERE email = ?
-- Best: B-tree (general) or Hash (equality only)
CREATE INDEX idx_users_email ON users (email);  -- B-tree: versatile
-- OR
CREATE INDEX USING HASH idx_users_email_hash ON users (email);  -- Hash: faster equality

-- Pattern 2: Range queries
-- Query: SELECT * FROM orders WHERE created_at BETWEEN ? AND ?
-- Best: B-tree or BRIN (for large tables)
CREATE INDEX idx_orders_created ON orders (created_at);  -- B-tree: precise
-- OR
CREATE INDEX USING BRIN idx_orders_created_brin ON orders (created_at);  -- BRIN: space-efficient

-- Pattern 3: Array containment
-- Query: SELECT * FROM products WHERE tags @> ARRAY['electronics']
-- Best: GIN
CREATE INDEX USING GIN idx_products_tags ON products USING GIN (tags);

-- Pattern 4: JSONB queries
-- Query: SELECT * FROM users WHERE profile_data @> '{"city": "NYC"}'
-- Best: GIN
CREATE INDEX USING GIN idx_users_profile ON users USING GIN (profile_data);

-- Pattern 5: Spatial queries
-- Query: SELECT * FROM locations WHERE ST_DWithin(coordinates, point, distance)
-- Best: GiST
CREATE INDEX USING GIST idx_locations_geom ON locations USING GIST (coordinates);

-- Pattern 6: Full-text search
-- Query: SELECT * FROM articles WHERE content @@ to_tsquery('search terms')
-- Best: GIN
CREATE INDEX USING GIN idx_articles_search ON articles
USING GIN (to_tsvector('english', content));
```

## Performance Trade-offs and Considerations

### Index Size Comparison

```sql
-- Create comparison table for different index types
CREATE TABLE index_comparison AS
SELECT
    'B-tree' as index_type,
    'General purpose' as use_case,
    'Medium' as size,
    'Fast' as read_speed,
    'Fast' as write_speed,
    'High' as versatility
UNION ALL
SELECT 'Hash', 'Equality only', 'Large', 'Very Fast', 'Medium', 'Low'
UNION ALL
SELECT 'GIN', 'Complex types', 'Very Large', 'Very Fast', 'Slow', 'Medium'
UNION ALL
SELECT 'GiST', 'Spatial/ranges', 'Large', 'Fast', 'Medium', 'High'
UNION ALL
SELECT 'BRIN', 'Large ordered', 'Very Small', 'Medium', 'Fast', 'Low';
```

### Write Performance Impact

```sql
-- Understand write performance implications
-- B-tree: Balanced impact on writes
-- Hash: Medium impact, can be larger than B-tree
-- GIN: High impact due to inverted index maintenance
-- GiST: Medium impact, lossy compression helps
-- BRIN: Very low impact, block-level summaries

-- Monitor write performance impact
SELECT
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE tablename IN ('high_write_table');

-- Consider partial indexes for write-heavy tables
CREATE INDEX idx_active_orders ON orders (customer_id)
WHERE status = 'active';  -- Only index active orders
```

### Multi-Column Index Strategies

```sql
-- Combine different index types strategically
-- Table with mixed query patterns
CREATE TABLE customer_orders (
    id BIGSERIAL PRIMARY KEY,           -- Automatic B-tree
    customer_id INTEGER,                -- Foreign key
    order_date TIMESTAMP,               -- Time-based queries
    total_amount DECIMAL,               -- Range queries
    status VARCHAR(20),                 -- Equality queries
    tags TEXT[],                        -- Array operations
    metadata JSONB                      -- Document queries
);

-- Strategic index creation
CREATE INDEX idx_orders_customer ON customer_orders (customer_id);  -- B-tree for joins
CREATE INDEX idx_orders_date ON customer_orders (order_date);       -- B-tree for ranges
CREATE INDEX USING BRIN idx_orders_date_brin ON customer_orders (order_date);  -- Alternative for large tables
CREATE INDEX USING HASH idx_orders_status ON customer_orders (status);  -- Hash for exact status
CREATE INDEX USING GIN idx_orders_tags ON customer_orders USING GIN (tags);  -- GIN for arrays
CREATE INDEX USING GIN idx_orders_metadata ON customer_orders USING GIN (metadata);  -- GIN for JSONB

-- Composite indexes for common query patterns
CREATE INDEX idx_orders_customer_date ON customer_orders (customer_id, order_date);
CREATE INDEX idx_orders_status_date ON customer_orders (status, order_date);
```

## Common Anti-Patterns and Mistakes

### What NOT to Do

```sql
-- ❌ WRONG: Using GIN for simple equality
-- CREATE INDEX USING GIN idx_users_id ON users USING GIN (id);  -- Overkill
CREATE INDEX idx_users_id ON users (id);  -- B-tree is better

-- ❌ WRONG: Using Hash for range queries
-- CREATE INDEX USING HASH idx_orders_date ON orders (order_date);  -- Won't work
CREATE INDEX idx_orders_date ON orders (order_date);  -- B-tree for ranges

-- ❌ WRONG: Using BRIN on randomly distributed data
-- CREATE INDEX USING BRIN idx_users_uuid ON users (uuid);  -- Poor correlation
CREATE INDEX idx_users_uuid ON users (uuid);  -- B-tree or Hash

-- ❌ WRONG: Using B-tree for array containment
-- CREATE INDEX idx_products_tags ON products (tags);  -- Won't support @> operator
CREATE INDEX USING GIN idx_products_tags ON products USING GIN (tags);  -- Correct

-- ❌ WRONG: Creating too many indexes
-- Every index has maintenance overhead
-- Only create indexes that are actually used
```

### Index Monitoring and Optimization

```sql
-- Monitor index usage to validate choices
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED - Consider dropping'
        WHEN idx_scan < 100 THEN 'RARELY USED - Review necessity'
        WHEN idx_scan < 1000 THEN 'MODERATELY USED'
        ELSE 'HEAVILY USED'
    END as usage_assessment
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Identify missing indexes by analyzing slow queries
EXPLAIN (ANALYZE, BUFFERS) your_slow_query;

-- Check for index bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as current_size,
    CASE
        WHEN pg_relation_size(indexrelid) > 100 * 1024 * 1024 THEN 'Consider REINDEX'
        ELSE 'OK'
    END as maintenance_recommendation
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 10 * 1024 * 1024  -- > 10MB
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Summary Decision Guide

**Choose B-tree when:**

- General-purpose indexing needs
- Range queries and sorting required
- Standard equality and inequality operations
- Most foreign key relationships
- Multi-column composite indexes

**Choose Hash when:**

- Only exact equality matches needed
- High-frequency lookup operations
- No range queries or sorting required
- Session tokens, API keys, cache keys

**Choose GIN when:**

- Array containment operations (@>, &&, <@)
- JSONB document queries (@>, ?, ?&, ?|)
- Full-text search requirements
- Complex composite value indexing

**Choose GiST when:**

- Geometric/spatial data (PostGIS required)
- Range type overlap operations
- Custom extensible data types
- Scheduling and temporal overlap queries

**Choose BRIN when:**

- Very large tables (millions+ rows)
- Naturally ordered data (high correlation)
- Append-only or time-series patterns
- Storage space is critical concern
- Mostly range queries on ordered data

The key to successful index selection is understanding your specific query patterns, data characteristics, and performance requirements. Monitor actual usage and adjust your indexing strategy based on real-world performance metrics.
