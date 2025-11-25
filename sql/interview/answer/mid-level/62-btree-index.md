# B-tree Index in PostgreSQL

A B-tree (Balanced tree) index is the default and most commonly used index type in PostgreSQL. It provides efficient access for equality and range queries while maintaining sorted order, making it the go-to choice for most indexing scenarios.

## What is a B-tree Index?

A B-tree is a self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time. In PostgreSQL, B-tree indexes are the default index type created when you use the `CREATE INDEX` statement without specifying a type.

### Key Characteristics

```sql
-- Default B-tree index creation
CREATE INDEX idx_customers_email ON customers (email);
CREATE INDEX idx_orders_order_date ON orders (order_date);
CREATE INDEX idx_products_price ON products (price);

-- Explicit B-tree specification (same as default)
CREATE INDEX idx_employees_salary USING BTREE ON employees (salary);
```

## B-tree Structure and Properties

### Internal Structure

```sql
-- Demonstrate B-tree structure with analysis
CREATE TABLE large_table (
    id SERIAL PRIMARY KEY,
    value INTEGER,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO large_table (value, category)
SELECT
    (random() * 1000000)::INTEGER,
    (ARRAY['A', 'B', 'C', 'D', 'E'])[ceil(random() * 5)]
FROM generate_series(1, 1000000);

-- Create B-tree indexes
CREATE INDEX idx_large_table_value ON large_table (value);
CREATE INDEX idx_large_table_category ON large_table (category);

-- Analyze index structure
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_relation_size(indexrelid) / pg_relation_size('large_table'::regclass) * 100 as size_percentage
FROM pg_stat_user_indexes
WHERE tablename = 'large_table';
```

### Balance and Height

```sql
-- Check B-tree depth and statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'large_table';

-- Use pageinspect extension to examine B-tree structure (if available)
CREATE EXTENSION IF NOT EXISTS pageinspect;

-- Get index metadata
SELECT
    level,
    live_items,
    dead_items,
    avg_item_size,
    page_size,
    free_size
FROM bt_page_stats('idx_large_table_value', 1);
```

## Supported Operations and Operators

B-tree indexes support a wide range of comparison operators:

### Equality and Inequality

```sql
-- Equality operations (=)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table WHERE value = 50000;

-- Inequality operations (<, <=, >, >=)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table WHERE value > 500000;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table WHERE value <= 100000;
```

### Range Queries

```sql
-- BETWEEN operator
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM large_table
WHERE value BETWEEN 100000 AND 200000;

-- Combined range and equality
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table
WHERE category = 'A' AND value BETWEEN 100000 AND 200000;
```

### Pattern Matching (Limited)

```sql
-- Prefix matching (left-anchored patterns)
CREATE INDEX idx_customers_name_btree ON customers (name);

-- This uses the index (left-anchored)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM customers WHERE name LIKE 'John%';

-- This does NOT use the index efficiently (not left-anchored)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM customers WHERE name LIKE '%Smith';
```

### NULL Handling

```sql
-- B-tree indexes support IS NULL and IS NOT NULL
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table WHERE value IS NULL;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table WHERE value IS NOT NULL;

-- Create partial index excluding NULLs for better performance
CREATE INDEX idx_large_table_value_not_null ON large_table (value)
WHERE value IS NOT NULL;
```

## Multi-Column B-tree Indexes

### Column Order Importance

```sql
-- Create multi-column index
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);

-- Efficient queries (uses index effectively)
-- 1. Both columns in WHERE
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE customer_id = 12345 AND order_date = '2024-01-15';

-- 2. Leading column only
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 12345;

-- 3. Leading column with range on second column
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE customer_id = 12345 AND order_date >= '2024-01-01';

-- Less efficient query (cannot use index effectively)
-- Only non-leading column
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE order_date = '2024-01-15';
```

### Compound Index Strategy

```sql
-- Design indexes based on query patterns
-- Common query: Find orders by customer in date range
CREATE INDEX idx_orders_customer_date_amount ON orders (customer_id, order_date, total_amount);

-- This enables efficient queries like:
SELECT customer_id, order_date, total_amount
FROM orders
WHERE customer_id = 12345
AND order_date BETWEEN '2024-01-01' AND '2024-01-31'
ORDER BY order_date;

-- Index can also support sorting
SELECT * FROM orders
WHERE customer_id = 12345
ORDER BY order_date DESC, total_amount DESC;
```

## Performance Characteristics

### Time Complexity

```sql
-- Demonstrate O(log n) performance
-- Create tables of different sizes
CREATE TABLE small_table AS SELECT generate_series(1, 1000) as id, random() as value;
CREATE TABLE medium_table AS SELECT generate_series(1, 100000) as id, random() as value;
CREATE TABLE large_table_perf AS SELECT generate_series(1, 10000000) as id, random() as value;

-- Create indexes
CREATE INDEX idx_small_id ON small_table (id);
CREATE INDEX idx_medium_id ON medium_table (id);
CREATE INDEX idx_large_perf_id ON large_table_perf (id);

-- Compare performance across different table sizes
-- Small table
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM small_table WHERE id = 500;

-- Medium table
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM medium_table WHERE id = 50000;

-- Large table
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM large_table_perf WHERE id = 5000000;
```

### Index Scan Types

```sql
-- Index Scan - when few rows match
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table WHERE value = 50000;

-- Bitmap Index Scan - when moderate number of rows match
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table WHERE value BETWEEN 50000 AND 51000;

-- Index Only Scan - when all needed data is in index
CREATE INDEX idx_large_table_value_id ON large_table (value) INCLUDE (id);

EXPLAIN (ANALYZE, BUFFERS)
SELECT value, id FROM large_table WHERE value BETWEEN 50000 AND 51000;
```

## Advanced B-tree Features

### Covering Indexes (INCLUDE clause)

```sql
-- Covering index includes additional columns in leaf pages
CREATE INDEX idx_orders_customer_covering ON orders (customer_id)
INCLUDE (order_date, total_amount, status);

-- This query can use index-only scan
EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, order_date, total_amount, status
FROM orders
WHERE customer_id = 12345;

-- Compare with regular index
CREATE INDEX idx_orders_customer_regular ON orders (customer_id);

-- This requires table access
EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, order_date, total_amount, status
FROM orders
WHERE customer_id = 67890;
```

### Partial Indexes

```sql
-- Index only active records
CREATE INDEX idx_orders_active_customer ON orders (customer_id)
WHERE status = 'active';

-- Index only recent data
CREATE INDEX idx_orders_recent_date ON orders (order_date)
WHERE order_date >= '2024-01-01';

-- Index only high-value transactions
CREATE INDEX idx_orders_high_value ON orders (customer_id, order_date)
WHERE total_amount >= 1000;

-- Partial index usage
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE customer_id = 12345 AND status = 'active';
```

### Expression Indexes

```sql
-- Functional indexes for computed values
CREATE INDEX idx_customers_lower_email ON customers (LOWER(email));

-- Case-insensitive email lookup
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM customers WHERE LOWER(email) = 'john@example.com';

-- Mathematical expressions
CREATE INDEX idx_products_discounted_price ON products ((price * (1 - discount_rate)));

-- Query using the expression
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM products
WHERE (price * (1 - discount_rate)) < 100;

-- Date/time expressions
CREATE INDEX idx_orders_year_month ON orders (EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date));

-- Monthly analysis queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*), SUM(total_amount)
FROM orders
WHERE EXTRACT(YEAR FROM order_date) = 2024
AND EXTRACT(MONTH FROM order_date) = 11;
```

## B-tree Index Maintenance

### Index Statistics and Health

```sql
-- Monitor index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY idx_scan DESC;

-- Check for unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND NOT indisprimary -- Exclude primary keys
AND NOT indisunique  -- Exclude unique constraints
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Index Bloat Detection

```sql
-- Estimate index bloat
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    ROUND(100 * pg_relation_size(indexrelid) / pg_total_relation_size(schemaname||'.'||tablename), 2) as index_ratio
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### REINDEX Operations

```sql
-- Rebuild individual index
REINDEX INDEX idx_orders_customer_date;

-- Rebuild all indexes on a table
REINDEX TABLE orders;

-- Rebuild with CONCURRENTLY (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_large_table_value;

-- Monitor reindex progress
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
FROM pg_stat_activity
WHERE query LIKE '%REINDEX%' AND state = 'active';
```

## Performance Optimization Techniques

### Index Selection Strategy

```sql
-- Analyze query patterns to design optimal indexes
-- Query 1: Customer order history
SELECT * FROM orders
WHERE customer_id = ?
ORDER BY order_date DESC;
-- Optimal index: (customer_id, order_date DESC)

-- Query 2: Date range analysis
SELECT COUNT(*), AVG(total_amount)
FROM orders
WHERE order_date BETWEEN ? AND ?;
-- Optimal index: (order_date)

-- Query 3: Complex filtering
SELECT * FROM orders
WHERE status = 'shipped'
AND order_date >= '2024-01-01'
AND total_amount > 100;
-- Consider: (status, order_date, total_amount) or partial index
```

### Fill Factor Optimization

```sql
-- Adjust fill factor for high-update tables
CREATE INDEX idx_orders_updated_customer ON orders (customer_id)
WITH (fillfactor = 80);

-- This leaves 20% space for updates, reducing page splits
-- Useful for frequently updated columns
```

### Index Creation Strategy

```sql
-- Create index concurrently to avoid blocking
CREATE INDEX CONCURRENTLY idx_large_table_concurrent ON large_table (category, value);

-- Monitor concurrent index creation
SELECT
    query,
    state,
    query_start,
    now() - query_start as duration
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX%';
```

## Common B-tree Index Patterns

### Primary Key and Unique Indexes

```sql
-- Primary key automatically creates unique B-tree index
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE
);

-- Check automatically created indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users';
```

### Foreign Key Optimization

```sql
-- Foreign keys benefit greatly from indexes
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER,
    unit_price DECIMAL
);

-- Create indexes on foreign keys for join performance
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);

-- Composite foreign key index for common query patterns
CREATE INDEX idx_order_items_order_product ON order_items (order_id, product_id);
```

### Sorting and Grouping Optimization

```sql
-- Index supports ORDER BY operations
CREATE INDEX idx_products_category_price_desc ON products (category, price DESC);

-- Efficient for queries like:
SELECT * FROM products
WHERE category = 'Electronics'
ORDER BY price DESC;

-- Supports GROUP BY operations
SELECT category, COUNT(*), AVG(price)
FROM products
GROUP BY category
ORDER BY category;
```

## Troubleshooting B-tree Performance Issues

### Identifying Performance Problems

```sql
-- Find slow queries using indexes inefficiently
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) as hit_percent
FROM pg_stat_statements
WHERE query LIKE '%SELECT%'
ORDER BY total_time DESC;

-- Check for missing indexes
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.email = 'customer@example.com'
AND o.order_date >= '2024-01-01';
```

### Index Selectivity Analysis

```sql
-- Check column selectivity for index effectiveness
SELECT
    attname,
    n_distinct,
    correlation,
    most_common_vals
FROM pg_stats
WHERE tablename = 'orders'
AND attname IN ('customer_id', 'status', 'order_date');

-- Low selectivity columns might not benefit from single-column indexes
-- Consider composite indexes or partial indexes instead
```

### Query Plan Analysis

```sql
-- Analyze different index usage patterns
-- Sequential scan (no index used)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT COUNT(*) FROM large_table WHERE value > 999000;

-- Index scan (selective query)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM large_table WHERE value = 500000;

-- Bitmap scan (moderate selectivity)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM large_table WHERE value BETWEEN 100000 AND 200000;
```

## Best Practices for B-tree Indexes

### Design Guidelines

```sql
-- 1. Create indexes based on actual query patterns
-- Before creating an index, analyze your queries:

-- Common WHERE clause patterns
SELECT column_name, COUNT(*) as usage_count
FROM (
    -- This would come from analyzing your application queries
    SELECT 'customer_id' as column_name UNION ALL
    SELECT 'order_date' UNION ALL
    SELECT 'status'
) query_patterns
GROUP BY column_name;

-- 2. Consider composite indexes for multi-column queries
CREATE INDEX idx_orders_multi_column ON orders (customer_id, order_date, status);

-- 3. Use partial indexes for commonly filtered data
CREATE INDEX idx_orders_pending ON orders (customer_id, order_date)
WHERE status = 'pending';
```

### Maintenance Best Practices

```sql
-- Regular index maintenance routine
-- 1. Update table statistics
ANALYZE orders;

-- 2. Check for bloated indexes
SELECT
    indexrelname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 3. Consider REINDEX for heavily updated tables
-- Schedule during maintenance windows
REINDEX INDEX CONCURRENTLY idx_orders_customer_date;
```

B-tree indexes are the foundation of PostgreSQL query performance. Understanding their structure, capabilities, and optimization techniques is crucial for building high-performance database applications. Their balanced tree structure provides consistent O(log n) performance for searches, making them suitable for the vast majority of indexing scenarios in PostgreSQL.
