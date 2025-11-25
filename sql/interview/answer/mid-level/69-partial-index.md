# What is a Partial Index?

A **partial index** (also called a **filtered index**) is an index that is built on only a subset of the rows in a table, based on a specified WHERE condition. Instead of indexing all rows in a table, a partial index only includes rows that meet certain criteria, making it smaller, faster to maintain, and more efficient for queries that match the index condition.

## Basic Concept and Syntax

```sql
-- Basic partial index syntax
CREATE INDEX index_name ON table_name (column_name) WHERE condition;

-- Example: Index only active users
CREATE INDEX idx_active_users_email ON users (email) WHERE status = 'active';

-- Example: Index only recent orders
CREATE INDEX idx_recent_orders ON orders (customer_id)
WHERE order_date >= '2024-01-01';

-- Example: Index only high-value transactions
CREATE INDEX idx_large_transactions ON transactions (customer_id, transaction_date)
WHERE amount > 1000;
```

## How Partial Indexes Work

### Index Structure Comparison

```sql
-- Sample table for demonstration
CREATE TABLE customer_orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    order_date DATE,
    status VARCHAR(20),
    total_amount DECIMAL(10,2),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Insert sample data
INSERT INTO customer_orders (customer_id, order_date, status, total_amount, is_deleted) VALUES
(1, '2024-01-15', 'completed', 150.00, FALSE),
(2, '2024-01-16', 'pending', 200.00, FALSE),
(3, '2024-01-17', 'cancelled', 75.00, FALSE),
(1, '2023-12-20', 'completed', 300.00, FALSE),
(4, '2024-01-18', 'completed', 125.00, TRUE);  -- Soft deleted

-- Regular index (indexes ALL rows)
CREATE INDEX idx_all_orders_customer ON customer_orders (customer_id);

-- Partial index (indexes only ACTIVE orders)
CREATE INDEX idx_active_orders_customer ON customer_orders (customer_id)
WHERE is_deleted = FALSE AND status != 'cancelled';

-- Compare index sizes
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    'All rows' as coverage
FROM pg_stat_user_indexes
WHERE indexname = 'idx_all_orders_customer'
UNION ALL
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)),
    'Filtered rows only' as coverage
FROM pg_stat_user_indexes
WHERE indexname = 'idx_active_orders_customer';
```

### Query Matching Rules

```sql
-- Queries that CAN use the partial index
-- ✅ Query condition matches or is more restrictive than index condition
SELECT * FROM customer_orders
WHERE customer_id = 123 AND is_deleted = FALSE AND status != 'cancelled';

SELECT * FROM customer_orders
WHERE customer_id = 123 AND is_deleted = FALSE AND status = 'pending';  -- 'pending' != 'cancelled'

SELECT * FROM customer_orders
WHERE customer_id = 123 AND is_deleted = FALSE AND status IN ('pending', 'completed');

-- Queries that CANNOT use the partial index effectively
-- ❌ Query condition is broader than index condition
SELECT * FROM customer_orders WHERE customer_id = 123;  -- Doesn't filter deleted/cancelled

SELECT * FROM customer_orders
WHERE customer_id = 123 AND status = 'cancelled';  -- Includes cancelled orders

SELECT * FROM customer_orders
WHERE customer_id = 123 AND is_deleted = TRUE;  -- Includes deleted orders
```

## Practical Use Cases

### 1. Soft Delete Pattern

```sql
-- Common pattern: soft delete with is_deleted flag
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    category_id INTEGER,
    price DECIMAL(10,2),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partial index excluding soft-deleted records
CREATE INDEX idx_active_products_category ON products (category_id)
WHERE is_deleted = FALSE;

-- Partial index for product search (active products only)
CREATE INDEX idx_active_products_search ON products USING GIN (to_tsvector('english', name))
WHERE is_deleted = FALSE;

-- Queries benefiting from partial indexes
SELECT * FROM products
WHERE category_id = 5 AND is_deleted = FALSE;  -- Uses idx_active_products_category

SELECT * FROM products
WHERE to_tsvector('english', name) @@ to_tsquery('laptop')
AND is_deleted = FALSE;  -- Uses idx_active_products_search

-- Check index usage
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM products
WHERE category_id = 5 AND is_deleted = FALSE;
```

### 2. Status-Based Filtering

```sql
-- E-commerce order status optimization
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    status VARCHAR(20),
    order_date DATE,
    total_amount DECIMAL(10,2)
);

-- Most queries focus on active/pending orders, not completed/cancelled
CREATE INDEX idx_pending_orders ON orders (customer_id, order_date)
WHERE status IN ('pending', 'processing', 'shipped');

CREATE INDEX idx_recent_orders ON orders (customer_id, order_date)
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days';

-- Customer service dashboard queries
SELECT customer_id, COUNT(*) as pending_orders
FROM orders
WHERE status IN ('pending', 'processing', 'shipped')
AND order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY customer_id;
```

### 3. Time-Based Partitioning Alternative

```sql
-- Log table with time-based partial indexes
CREATE TABLE application_logs (
    id BIGSERIAL PRIMARY KEY,
    level VARCHAR(10),
    message TEXT,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Focus indexes on recent data (most queries are on recent logs)
CREATE INDEX idx_recent_logs_level ON application_logs (level, created_at)
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

CREATE INDEX idx_recent_error_logs ON application_logs (user_id, created_at)
WHERE level = 'ERROR' AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Archive old data while keeping indexes small
CREATE INDEX idx_warning_logs_recent ON application_logs (user_id, message)
WHERE level = 'WARNING' AND created_at >= CURRENT_DATE - INTERVAL '24 hours';

-- Monitoring query for recent errors
SELECT user_id, COUNT(*) as error_count, MAX(created_at) as last_error
FROM application_logs
WHERE level = 'ERROR'
AND created_at >= CURRENT_DATE - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 5;
```

### 4. Null Value Exclusion

```sql
-- Table with many NULL values
CREATE TABLE user_profiles (
    user_id INTEGER PRIMARY KEY,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    address TEXT,
    last_login_at TIMESTAMP
);

-- Index only users with phone numbers (exclude NULLs)
CREATE INDEX idx_users_with_phone ON user_profiles (phone_number)
WHERE phone_number IS NOT NULL;

-- Index only recently active users
CREATE INDEX idx_recent_users ON user_profiles (last_login_at)
WHERE last_login_at >= CURRENT_DATE - INTERVAL '90 days';

-- Composite partial index for user contact
CREATE INDEX idx_contactable_users ON user_profiles (email, phone_number)
WHERE email IS NOT NULL AND phone_number IS NOT NULL;

-- Marketing queries for contactable users
SELECT email, phone_number
FROM user_profiles
WHERE email IS NOT NULL
AND phone_number IS NOT NULL
AND last_login_at >= CURRENT_DATE - INTERVAL '30 days';
```

### 5. Boolean Flag Optimization

```sql
-- Table with boolean flags
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    plan_type VARCHAR(50),
    is_active BOOLEAN,
    is_trial BOOLEAN,
    created_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Index only active subscriptions (most queries filter on is_active = TRUE)
CREATE INDEX idx_active_subscriptions ON subscriptions (user_id, plan_type)
WHERE is_active = TRUE;

-- Index trial subscriptions separately
CREATE INDEX idx_trial_subscriptions ON subscriptions (user_id, expires_at)
WHERE is_trial = TRUE AND is_active = TRUE;

-- Business intelligence queries
SELECT plan_type, COUNT(*) as active_count
FROM subscriptions
WHERE is_active = TRUE
GROUP BY plan_type;

SELECT COUNT(*) as expiring_trials
FROM subscriptions
WHERE is_trial = TRUE
AND is_active = TRUE
AND expires_at <= CURRENT_DATE + INTERVAL '7 days';
```

## Advanced Partial Index Techniques

### 1. Complex WHERE Conditions

```sql
-- Advanced filtering with multiple conditions
CREATE TABLE financial_transactions (
    id BIGSERIAL PRIMARY KEY,
    account_id INTEGER,
    transaction_type VARCHAR(20),
    amount DECIMAL(15,2),
    currency VARCHAR(3),
    status VARCHAR(20),
    created_at TIMESTAMP,
    is_internal BOOLEAN,
    risk_score INTEGER
);

-- Index for suspicious transactions only
CREATE INDEX idx_suspicious_transactions ON financial_transactions (account_id, created_at)
WHERE status = 'pending'
AND risk_score > 70
AND amount > 5000
AND is_internal = FALSE;

-- Index for high-value international transactions
CREATE INDEX idx_international_large ON financial_transactions (currency, account_id, amount)
WHERE currency != 'USD'
AND amount > 10000
AND transaction_type = 'wire_transfer';

-- Compliance monitoring queries
SELECT account_id, COUNT(*) as suspicious_count, SUM(amount) as total_amount
FROM financial_transactions
WHERE status = 'pending'
AND risk_score > 70
AND amount > 5000
AND is_internal = FALSE
AND created_at >= CURRENT_DATE - INTERVAL '24 hours'
GROUP BY account_id;
```

### 2. Expression-Based Partial Indexes

```sql
-- Combine partial indexes with expressions
CREATE TABLE sales_data (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    sale_date DATE,
    quantity INTEGER,
    unit_price DECIMAL(8,2),
    discount_percent DECIMAL(5,2),
    customer_region VARCHAR(50)
);

-- Index on calculated revenue for significant sales only
CREATE INDEX idx_significant_sales_revenue ON sales_data (
    product_id,
    (quantity * unit_price * (1 - discount_percent/100))
)
WHERE quantity * unit_price * (1 - discount_percent/100) > 1000;

-- Index on month/year for recent sales only
CREATE INDEX idx_recent_sales_period ON sales_data (
    EXTRACT(YEAR FROM sale_date),
    EXTRACT(MONTH FROM sale_date),
    customer_region
)
WHERE sale_date >= CURRENT_DATE - INTERVAL '12 months';

-- Business analytics queries
SELECT
    product_id,
    AVG(quantity * unit_price * (1 - discount_percent/100)) as avg_revenue
FROM sales_data
WHERE quantity * unit_price * (1 - discount_percent/100) > 1000
GROUP BY product_id;
```

### 3. Multi-Table Partial Indexing Strategy

```sql
-- Coordinated partial indexing across related tables
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    status VARCHAR(20),
    tier VARCHAR(20),
    created_at TIMESTAMP
);

CREATE TABLE customer_orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20)
);

-- Partial indexes focusing on premium active customers
CREATE INDEX idx_premium_customers ON customers (id, tier)
WHERE status = 'active' AND tier IN ('gold', 'platinum');

-- Related orders for premium customers
CREATE INDEX idx_premium_customer_orders ON customer_orders (customer_id, order_date)
WHERE customer_id IN (
    SELECT id FROM customers
    WHERE status = 'active' AND tier IN ('gold', 'platinum')
);  -- Note: Subquery in WHERE not directly supported, use views instead

-- Better approach using a view
CREATE VIEW premium_active_customers AS
SELECT id FROM customers
WHERE status = 'active' AND tier IN ('gold', 'platinum');

-- Then reference in application queries
SELECT c.email, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
FROM customers c
JOIN customer_orders o ON c.id = o.customer_id
WHERE c.status = 'active'
AND c.tier IN ('gold', 'platinum')
AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY c.id, c.email;
```

## Performance Benefits and Analysis

### 1. Size Reduction

```sql
-- Analyze index size differences
CREATE TABLE performance_test (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50),
    status VARCHAR(20),
    amount DECIMAL(10,2),
    created_at TIMESTAMP,
    is_active BOOLEAN
);

-- Insert test data (80% inactive, 20% active)
INSERT INTO performance_test (category, status, amount, created_at, is_active)
SELECT
    'category_' || (i % 10),
    CASE WHEN i % 5 = 0 THEN 'active' ELSE 'inactive' END,
    (random() * 1000)::DECIMAL(10,2),
    CURRENT_TIMESTAMP - (random() * interval '365 days'),
    (i % 5 = 0)
FROM generate_series(1, 100000) as i;

-- Create regular and partial indexes
CREATE INDEX idx_all_category ON performance_test (category);
CREATE INDEX idx_active_category ON performance_test (category) WHERE is_active = TRUE;

-- Compare sizes
SELECT
    'Full index' as index_type,
    pg_size_pretty(pg_relation_size('idx_all_category')) as size,
    'All rows' as coverage
UNION ALL
SELECT
    'Partial index',
    pg_size_pretty(pg_relation_size('idx_active_category')),
    'Active rows only';

-- Compare query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM performance_test
WHERE category = 'category_5' AND is_active = TRUE;
```

### 2. Maintenance Performance

```sql
-- Monitor index maintenance overhead
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%partial%' OR indexname LIKE '%active%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Track write performance impact
SELECT
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_tup_hot_upd,  -- HOT updates (don't require index updates)
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE tablename = 'performance_test';
```

## Best Practices and Guidelines

### 1. When to Use Partial Indexes

```sql
-- ✅ GOOD candidates for partial indexes:
-- 1. Tables with soft delete patterns
CREATE INDEX idx_active_records ON table_name (key_column) WHERE is_deleted = FALSE;

-- 2. Time-based queries on recent data
CREATE INDEX idx_recent_data ON table_name (date_column)
WHERE date_column >= CURRENT_DATE - INTERVAL '90 days';

-- 3. Status-based filtering where most queries focus on subset
CREATE INDEX idx_active_status ON table_name (user_id) WHERE status = 'active';

-- 4. Boolean flags with uneven distribution
CREATE INDEX idx_flagged_items ON table_name (category) WHERE is_flagged = TRUE;

-- 5. Excluding NULL values when most queries filter them out
CREATE INDEX idx_non_null_values ON table_name (column) WHERE column IS NOT NULL;
```

### 2. Design Considerations

```sql
-- Column selectivity analysis for partial index design
SELECT
    'status' as column_name,
    status as value,
    COUNT(*) as row_count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM customer_orders), 2) as percentage
FROM customer_orders
GROUP BY status
ORDER BY COUNT(*) DESC;

-- Determine if partial index makes sense
-- Rule of thumb: If filtering condition eliminates >50% of rows, consider partial index
WITH status_analysis AS (
    SELECT
        status,
        COUNT(*) as count,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
    FROM customer_orders
    GROUP BY status
)
SELECT
    status,
    count,
    percentage,
    CASE
        WHEN percentage < 50 THEN 'Good candidate for partial index'
        ELSE 'Consider full index'
    END as recommendation
FROM status_analysis
ORDER BY count DESC;
```

### 3. Common Pitfalls to Avoid

```sql
-- ❌ DON'T create partial indexes for conditions that change frequently
-- Bad: CREATE INDEX idx_recent ON table_name (column) WHERE created_at >= CURRENT_DATE;
-- Problem: Index becomes invalid as date changes

-- ✅ DO use relative intervals or stable conditions
CREATE INDEX idx_recent ON table_name (column)
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- ❌ DON'T create overlapping partial indexes
-- Bad: Multiple partial indexes with overlapping conditions
-- CREATE INDEX idx_active_users ON users (email) WHERE status = 'active';
-- CREATE INDEX idx_premium_users ON users (email) WHERE tier = 'premium';
-- CREATE INDEX idx_active_premium ON users (email) WHERE status = 'active' AND tier = 'premium';

-- ✅ DO create strategic non-overlapping partial indexes
CREATE INDEX idx_active_users_by_tier ON users (tier, email) WHERE status = 'active';
CREATE INDEX idx_inactive_users ON users (last_login, email) WHERE status = 'inactive';

-- ❌ DON'T use complex expressions in WHERE clause
-- Bad: CREATE INDEX idx_complex ON table_name (col) WHERE EXTRACT(DOW FROM date_col) = 1;
-- Problem: Hard to maintain, limited query matching

-- ✅ DO use simple, stable conditions
CREATE INDEX idx_weekday_data ON table_name (col)
WHERE date_part = 'weekday';  -- Assuming pre-computed column
```

## Monitoring and Maintenance

### 1. Index Usage Analysis

```sql
-- Monitor partial index effectiveness
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED - Consider dropping'
        WHEN idx_scan < 10 THEN 'LOW USAGE'
        WHEN idx_scan < 100 THEN 'MODERATE USAGE'
        ELSE 'HIGH USAGE'
    END as usage_level
FROM pg_stat_user_indexes
WHERE indexname LIKE '%partial%' OR indexname LIKE '%active%' OR indexname LIKE '%recent%'
ORDER BY idx_scan DESC;

-- Check query plan usage
EXPLAIN (ANALYZE, BUFFERS) your_query_here;
```

### 2. Maintenance Automation

```sql
-- Create monitoring view for partial index health
CREATE OR REPLACE VIEW partial_index_health AS
SELECT
    i.schemaname,
    i.tablename,
    i.indexname,
    pg_get_indexdef(i.indexrelid) as index_definition,
    pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch,
    CASE
        WHEN s.idx_scan = 0 THEN 'Consider dropping'
        WHEN s.idx_scan < 10 THEN 'Review necessity'
        ELSE 'Active'
    END as recommendation,
    pg_stat_get_last_analyze_time(i.indrelid) as last_analyzed
FROM pg_indexes i
LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
WHERE pg_get_indexdef(i.indexrelid) LIKE '%WHERE%'  -- Partial indexes only
ORDER BY s.idx_scan DESC NULLS LAST;

-- Query the monitoring view
SELECT * FROM partial_index_health;
```

## Summary

**Partial indexes** are specialized indexes that include only a subset of table rows based on a WHERE condition. They provide:

**Key Benefits:**

- **Smaller index size** - Only relevant rows are indexed
- **Faster maintenance** - Fewer rows to update during writes
- **Improved performance** - Faster scans on focused datasets
- **Storage efficiency** - Reduced disk space usage

**Best Use Cases:**

- **Soft delete patterns** - Index only active/non-deleted records
- **Status filtering** - Focus on specific status values
- **Time-based queries** - Index recent data only
- **Boolean flags** - Index minority conditions (active users, flagged items)
- **NULL exclusion** - Skip NULL values when queries always filter them

**Design Principles:**

- Use when filtering condition eliminates >50% of rows
- Keep WHERE conditions simple and stable
- Ensure query conditions match or are more restrictive than index conditions
- Monitor usage and maintain based on actual query patterns

Partial indexes are powerful optimization tools for scenarios where most queries focus on a predictable subset of data, providing significant performance and storage benefits when used appropriately.
