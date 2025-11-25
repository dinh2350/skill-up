# What is a Composite Index?

A **composite index** (also called a **multi-column index** or **compound index**) is an index that includes multiple columns from a table. Instead of indexing just one column, a composite index creates a single index structure that spans across multiple columns, allowing PostgreSQL to efficiently handle queries that filter or sort on multiple columns simultaneously.

## Basic Concept and Syntax

```sql
-- Single-column index (regular index)
CREATE INDEX idx_single_column ON users (email);

-- Composite index (multi-column index)
CREATE INDEX idx_composite ON users (last_name, first_name, created_date);

-- Composite index with different index types
CREATE INDEX idx_composite_gin ON products USING GIN (category, tags);
CREATE INDEX idx_composite_gist ON bookings USING GIST (room_id, time_range);
```

## How Composite Indexes Work

### Index Structure and Organization

```sql
-- Example table for demonstration
CREATE TABLE customer_orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    order_date DATE,
    status VARCHAR(20),
    total_amount DECIMAL(10,2),
    region VARCHAR(50)
);

-- Create composite index
CREATE INDEX idx_customer_date_status ON customer_orders (customer_id, order_date, status);

-- The index internally organizes data like this:
-- (customer_id, order_date, status) -> row_pointer
-- (1, '2024-01-15', 'shipped') -> row_1
-- (1, '2024-01-20', 'pending') -> row_2
-- (1, '2024-02-01', 'shipped') -> row_3
-- (2, '2024-01-10', 'delivered') -> row_4
-- (2, '2024-01-25', 'shipped') -> row_5
```

### Column Order Significance

The order of columns in a composite index is **critically important** and affects which queries can use the index effectively.

```sql
-- Index: (customer_id, order_date, status)
CREATE INDEX idx_customer_date_status ON customer_orders (customer_id, order_date, status);

-- ✅ EFFICIENT - Can use the index (leftmost prefix rule)
SELECT * FROM customer_orders WHERE customer_id = 123;
SELECT * FROM customer_orders WHERE customer_id = 123 AND order_date = '2024-01-15';
SELECT * FROM customer_orders WHERE customer_id = 123 AND order_date = '2024-01-15' AND status = 'shipped';
SELECT * FROM customer_orders WHERE customer_id = 123 AND order_date > '2024-01-01';

-- ❌ INEFFICIENT - Cannot use the index effectively
SELECT * FROM customer_orders WHERE order_date = '2024-01-15';  -- Skips first column
SELECT * FROM customer_orders WHERE status = 'shipped';         -- Skips first two columns
SELECT * FROM customer_orders WHERE order_date = '2024-01-15' AND status = 'shipped';  -- Skips first column

-- 🔶 PARTIAL USE - Can use index partially
SELECT * FROM customer_orders WHERE customer_id = 123 AND status = 'shipped';  -- Uses customer_id part only
```

## Practical Use Cases

### 1. Multi-Column WHERE Clauses

```sql
-- Common query pattern requiring composite index
SELECT order_id, total_amount
FROM customer_orders
WHERE customer_id = 12345
AND order_date BETWEEN '2024-01-01' AND '2024-03-31'
AND status IN ('shipped', 'delivered');

-- Optimal composite index for this query
CREATE INDEX idx_customer_date_status ON customer_orders (customer_id, order_date, status);

-- Query execution plan will show index usage
EXPLAIN (ANALYZE, BUFFERS)
SELECT order_id, total_amount
FROM customer_orders
WHERE customer_id = 12345
AND order_date BETWEEN '2024-01-01' AND '2024-03-31'
AND status IN ('shipped', 'delivered');
```

### 2. ORDER BY with Multiple Columns

```sql
-- Query that benefits from composite index for sorting
SELECT customer_id, order_date, total_amount
FROM customer_orders
WHERE status = 'pending'
ORDER BY customer_id, order_date DESC;

-- Composite index supporting both WHERE and ORDER BY
CREATE INDEX idx_status_customer_date ON customer_orders (status, customer_id, order_date DESC);

-- Alternative approach with expression
CREATE INDEX idx_pending_customer_date ON customer_orders (customer_id, order_date DESC)
WHERE status = 'pending';  -- Partial index
```

### 3. JOIN Operations

```sql
-- Tables with foreign key relationships
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    region VARCHAR(50),
    status VARCHAR(20)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    order_date DATE,
    total_amount DECIMAL
);

-- Composite indexes for efficient joins
CREATE INDEX idx_customers_company_region ON customers (company_id, region);
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);

-- Query benefiting from composite indexes
SELECT c.id, c.region, COUNT(o.id) as order_count, SUM(o.total_amount) as total_sales
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE c.company_id = 100
AND c.region = 'North America'
AND o.order_date >= '2024-01-01'
GROUP BY c.id, c.region;
```

### 4. Covering Indexes

```sql
-- Covering index includes all columns needed by query
CREATE INDEX idx_customer_order_covering ON customer_orders (customer_id, order_date)
INCLUDE (status, total_amount);

-- This query can be satisfied entirely from the index (Index-Only Scan)
SELECT customer_id, order_date, status, total_amount
FROM customer_orders
WHERE customer_id = 12345
AND order_date >= '2024-01-01';

-- Check for Index-Only Scan in execution plan
EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, order_date, status, total_amount
FROM customer_orders
WHERE customer_id = 12345
AND order_date >= '2024-01-01';
```

## Design Strategies and Best Practices

### 1. Column Ordering Strategy

```sql
-- Strategy 1: Equality first, then ranges, then others
-- Good: equality -> range -> other conditions
CREATE INDEX idx_optimal_order ON customer_orders (customer_id, status, order_date, total_amount);

-- Query patterns this supports well:
-- WHERE customer_id = ? AND status = ? AND order_date >= ?
-- WHERE customer_id = ? AND status = ?
-- WHERE customer_id = ?

-- Strategy 2: Most selective column first
-- Analyze column selectivity
SELECT
    'customer_id' as column_name,
    COUNT(DISTINCT customer_id)::float / COUNT(*) as selectivity
FROM customer_orders
UNION ALL
SELECT
    'status',
    COUNT(DISTINCT status)::float / COUNT(*)
FROM customer_orders
UNION ALL
SELECT
    'region',
    COUNT(DISTINCT region)::float / COUNT(*)
FROM customer_orders;

-- Create index with most selective column first
CREATE INDEX idx_selective_first ON customer_orders (customer_id, region, status);
```

### 2. Query Pattern Analysis

```sql
-- Analyze your actual query patterns before creating composite indexes
-- Common patterns to look for:

-- Pattern 1: Exact match + Range
SELECT * FROM customer_orders
WHERE customer_id = ? AND order_date >= ?;
-- Index: (customer_id, order_date)

-- Pattern 2: Multiple exact matches
SELECT * FROM customer_orders
WHERE customer_id = ? AND status = ? AND region = ?;
-- Index: (customer_id, status, region) or order by selectivity

-- Pattern 3: Exact match + Sort
SELECT * FROM customer_orders
WHERE customer_id = ?
ORDER BY order_date DESC;
-- Index: (customer_id, order_date DESC)

-- Pattern 4: Complex WHERE with GROUP BY
SELECT customer_id, status, COUNT(*), AVG(total_amount)
FROM customer_orders
WHERE region = 'North America' AND order_date >= '2024-01-01'
GROUP BY customer_id, status;
-- Index: (region, order_date, customer_id, status)
```

### 3. Avoiding Over-Indexing

```sql
-- ❌ WRONG: Too many overlapping indexes
CREATE INDEX idx_customer ON customer_orders (customer_id);
CREATE INDEX idx_customer_date ON customer_orders (customer_id, order_date);
CREATE INDEX idx_customer_status ON customer_orders (customer_id, status);
CREATE INDEX idx_customer_date_status ON customer_orders (customer_id, order_date, status);
-- The first three are redundant if you have the fourth!

-- ✅ CORRECT: Strategic index selection
CREATE INDEX idx_customer_date_status ON customer_orders (customer_id, order_date, status);
CREATE INDEX idx_status_date ON customer_orders (status, order_date);  -- For status-first queries
CREATE INDEX idx_region_date ON customer_orders (region, order_date);  -- For region-based queries

-- Monitor index usage to validate decisions
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE tablename = 'customer_orders'
ORDER BY idx_scan DESC;
```

## Advanced Composite Index Techniques

### 1. Expression-Based Composite Indexes

```sql
-- Composite index with expressions
CREATE INDEX idx_customer_month_year ON customer_orders (
    customer_id,
    EXTRACT(YEAR FROM order_date),
    EXTRACT(MONTH FROM order_date)
);

-- Supports queries like:
SELECT COUNT(*), SUM(total_amount)
FROM customer_orders
WHERE customer_id = 12345
AND EXTRACT(YEAR FROM order_date) = 2024
AND EXTRACT(MONTH FROM order_date) = 3;

-- Text search composite index
CREATE INDEX idx_customer_search ON customers (
    customer_id,
    to_tsvector('english', company_name || ' ' || description)
);
```

### 2. Partial Composite Indexes

```sql
-- Composite index with WHERE clause (partial index)
CREATE INDEX idx_active_customer_orders ON customer_orders (customer_id, order_date, total_amount)
WHERE status IN ('pending', 'processing', 'shipped');

-- More specific partial composite index
CREATE INDEX idx_large_orders_customer_date ON customer_orders (customer_id, order_date)
WHERE total_amount > 1000 AND status != 'cancelled';

-- Benefits: Smaller index size, faster maintenance, focused on relevant data
SELECT pg_size_pretty(pg_relation_size('idx_active_customer_orders')) as partial_index_size,
       pg_size_pretty(pg_relation_size('idx_customer_date_status')) as full_index_size;
```

### 3. Different Data Types in Composite Indexes

```sql
-- Mixed data types in composite index
CREATE TABLE user_analytics (
    user_id INTEGER,
    event_date DATE,
    event_type VARCHAR(50),
    properties JSONB,
    device_info TEXT[],
    location POINT
);

-- B-tree composite with mixed types
CREATE INDEX idx_user_event_analysis ON user_analytics (user_id, event_date, event_type);

-- GIN composite for complex data types
CREATE INDEX idx_user_properties_search ON user_analytics
USING GIN (user_id, properties);

-- GiST composite for spatial and range data
CREATE INDEX idx_user_location_time ON user_analytics
USING GIST (user_id, location, event_date);
```

## Performance Considerations

### 1. Index Size and Maintenance

```sql
-- Monitor composite index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    ROUND(100.0 * pg_relation_size(indexrelid) / pg_total_relation_size(schemaname||'.'||tablename), 2) as index_ratio_percent
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index maintenance impact analysis
SELECT
    schemaname,
    tablename,
    n_tup_ins + n_tup_upd + n_tup_del as write_operations,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;
```

### 2. Query Planning and Index Selection

```sql
-- Force PostgreSQL to show index usage details
SET enable_seqscan = OFF;  -- For testing only, don't use in production

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT customer_id, order_date, total_amount
FROM customer_orders
WHERE customer_id BETWEEN 1000 AND 2000
AND order_date >= '2024-01-01'
AND status = 'shipped'
ORDER BY order_date DESC;

SET enable_seqscan = ON;  -- Reset to default

-- Analyze selectivity for composite index columns
SELECT
    'Single columns' as analysis_type,
    'customer_id' as column_combo,
    COUNT(DISTINCT customer_id) as distinct_values,
    COUNT(*) as total_rows,
    ROUND(COUNT(DISTINCT customer_id)::numeric / COUNT(*), 4) as selectivity
FROM customer_orders
UNION ALL
SELECT
    'Two columns',
    'customer_id + order_date',
    COUNT(DISTINCT (customer_id, order_date)),
    COUNT(*),
    ROUND(COUNT(DISTINCT (customer_id, order_date))::numeric / COUNT(*), 4)
FROM customer_orders
UNION ALL
SELECT
    'Three columns',
    'customer_id + order_date + status',
    COUNT(DISTINCT (customer_id, order_date, status)),
    COUNT(*),
    ROUND(COUNT(DISTINCT (customer_id, order_date, status))::numeric / COUNT(*), 4)
FROM customer_orders;
```

## Common Pitfalls and Solutions

### 1. Incorrect Column Order

```sql
-- ❌ PROBLEM: Wrong column order
CREATE INDEX idx_bad_order ON customer_orders (order_date, customer_id);

-- This query cannot use the index efficiently:
SELECT * FROM customer_orders WHERE customer_id = 12345;  -- Needs seq scan

-- ✅ SOLUTION: Correct column order
DROP INDEX idx_bad_order;
CREATE INDEX idx_good_order ON customer_orders (customer_id, order_date);

-- Now this query can use the index:
SELECT * FROM customer_orders WHERE customer_id = 12345;  -- Uses index scan
```

### 2. Too Many Columns

```sql
-- ❌ PROBLEM: Overly wide composite index
CREATE INDEX idx_too_wide ON customer_orders (
    customer_id, order_date, status, region,
    total_amount, created_at, updated_at, notes
);  -- 8 columns is usually too many

-- ✅ SOLUTION: Create focused indexes for specific query patterns
CREATE INDEX idx_customer_date_status ON customer_orders (customer_id, order_date, status);
CREATE INDEX idx_region_status_amount ON customer_orders (region, status, total_amount);
CREATE INDEX idx_temporal_tracking ON customer_orders (created_at, updated_at)
WHERE status IN ('pending', 'processing');
```

### 3. Ignoring Query Patterns

```sql
-- Analyze actual query patterns before creating indexes
-- Use pg_stat_statements to see real queries
SELECT
    LEFT(query, 100) as query_start,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%customer_orders%'
AND calls > 10
ORDER BY mean_time DESC;

-- Create indexes based on actual usage patterns, not assumptions
```

## Best Practices Summary

### 1. Design Guidelines

```sql
-- 1. Put most selective (equality) columns first
-- 2. Put range columns after equality columns
-- 3. Put sort columns last
-- 4. Consider covering indexes for read-heavy queries
-- 5. Use partial indexes for filtered data

-- Example following all principles:
CREATE INDEX idx_optimized_composite ON customer_orders (
    customer_id,        -- Equality, highly selective
    status,             -- Equality, medium selective
    order_date,         -- Range queries
    total_amount DESC   -- Sorting
) WHERE status != 'cancelled';  -- Partial index for active orders

-- Include frequently accessed columns
CREATE INDEX idx_covering_orders ON customer_orders (customer_id, order_date)
INCLUDE (status, total_amount, shipping_address);
```

### 2. Monitoring and Maintenance

```sql
-- Regular index health check
SELECT
    i.indexname,
    i.tablename,
    pg_size_pretty(pg_relation_size(i.indexrelid)) as size,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch,
    CASE
        WHEN s.idx_scan = 0 THEN 'UNUSED - Consider dropping'
        WHEN s.idx_scan < 100 THEN 'LOW USAGE - Review necessity'
        ELSE 'ACTIVE'
    END as status,
    pg_stat_get_last_autoanalyze_time(i.indrelid) as last_analyzed
FROM pg_indexes i
LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
WHERE i.schemaname = 'public'
AND i.indexname LIKE 'idx_%'
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- Identify potential composite index opportunities
SELECT
    'Potential composite index opportunity' as recommendation,
    COUNT(*) as query_count,
    string_agg(DISTINCT LEFT(query, 50), '; ') as sample_queries
FROM pg_stat_statements
WHERE query LIKE '%WHERE%'
AND query LIKE '%AND%'
AND calls > 5
GROUP BY 1;
```

## Summary

**Composite indexes** are powerful tools for optimizing multi-column queries in PostgreSQL. They work by:

- **Creating a single index structure** across multiple columns
- **Following the leftmost prefix rule** for efficient partial matches
- **Supporting complex query patterns** involving multiple WHERE conditions, JOINs, and ORDER BY clauses

**Key success factors:**

- **Column order matters** - put equality columns first, ranges next, sorts last
- **Match your query patterns** - analyze actual usage before designing
- **Consider selectivity** - more selective columns generally go first
- **Use covering indexes** for read-heavy workloads
- **Monitor and maintain** - track usage and performance over time

**When to use composite indexes:**

- Queries with multiple WHERE conditions
- Complex JOIN operations
- Mixed filtering and sorting requirements
- High-frequency query patterns with predictable column combinations

Composite indexes are essential for high-performance PostgreSQL applications dealing with complex query patterns and large datasets.
