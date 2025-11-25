# What is an Expression Index?

An **expression index** (also called a **functional index**) is an index built on the result of an expression or function call, rather than directly on column values. This allows PostgreSQL to efficiently handle queries that filter or sort based on computed values, transformations, or function results without needing to calculate the expression for every row during query execution.

## Basic Concept and Syntax

```sql
-- Basic expression index syntax
CREATE INDEX index_name ON table_name (expression);

-- Examples of expression indexes
-- Case-insensitive search
CREATE INDEX idx_users_email_lower ON users (LOWER(email));

-- Date extraction
CREATE INDEX idx_orders_year ON orders (EXTRACT(YEAR FROM order_date));

-- String concatenation
CREATE INDEX idx_full_name ON customers (first_name || ' ' || last_name);

-- Mathematical calculations
CREATE INDEX idx_total_price ON order_items (quantity * unit_price);

-- JSON path extraction
CREATE INDEX idx_user_city ON users ((profile_data->>'city'));
```

## How Expression Indexes Work

### Index Structure and Query Matching

```sql
-- Sample table for demonstration
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP,
    profile_data JSONB
);

-- Insert sample data
INSERT INTO customers (email, first_name, last_name, created_at, profile_data) VALUES
('John.Doe@EXAMPLE.com', 'John', 'Doe', '2024-01-15', '{"city": "New York", "age": 30}'),
('jane.smith@Gmail.COM', 'Jane', 'Smith', '2024-02-20', '{"city": "Boston", "age": 25}'),
('Bob.Wilson@company.org', 'Bob', 'Wilson', '2024-03-10', '{"city": "Chicago", "age": 35}');

-- Create expression indexes
CREATE INDEX idx_email_lower ON customers (LOWER(email));
CREATE INDEX idx_full_name ON customers (first_name || ' ' || last_name);
CREATE INDEX idx_signup_year ON customers (EXTRACT(YEAR FROM created_at));
CREATE INDEX idx_profile_city ON customers ((profile_data->>'city'));

-- Queries that can use expression indexes
-- ✅ Query matches index expression exactly
SELECT * FROM customers WHERE LOWER(email) = 'john.doe@example.com';
-- Uses idx_email_lower

SELECT * FROM customers WHERE first_name || ' ' || last_name = 'John Doe';
-- Uses idx_full_name

SELECT * FROM customers WHERE EXTRACT(YEAR FROM created_at) = 2024;
-- Uses idx_signup_year

SELECT * FROM customers WHERE profile_data->>'city' = 'New York';
-- Uses idx_profile_city

-- ❌ Queries that CANNOT use expression indexes
SELECT * FROM customers WHERE email = 'john.doe@example.com';  -- Different from LOWER(email)
SELECT * FROM customers WHERE first_name = 'John';  -- Different from full name expression
```

### Expression Evaluation and Storage

```sql
-- PostgreSQL evaluates and stores the expression result in the index
-- Example: For LOWER(email) index, the index actually contains:
-- 'john.doe@example.com' -> row_pointer_1
-- 'jane.smith@gmail.com' -> row_pointer_2
-- 'bob.wilson@company.org' -> row_pointer_3

-- Verify index usage with EXPLAIN
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM customers WHERE LOWER(email) = 'jane.smith@gmail.com';

-- Check index size and structure
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    pg_get_indexdef(indexrelid) as definition
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Practical Use Cases

### 1. Case-Insensitive Search

```sql
-- User authentication and search
CREATE TABLE user_accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100)
);

-- Case-insensitive username lookup
CREATE INDEX idx_username_lower ON user_accounts (LOWER(username));

-- Case-insensitive email lookup
CREATE INDEX idx_email_lower ON user_accounts (LOWER(email));

-- Full name search (case-insensitive)
CREATE INDEX idx_full_name_lower ON user_accounts (LOWER(first_name || ' ' || last_name));

-- Efficient login queries
SELECT id, username FROM user_accounts
WHERE LOWER(username) = LOWER('JohnDoe123');  -- Will use idx_username_lower

SELECT id, email FROM user_accounts
WHERE LOWER(email) = LOWER('John.Doe@Example.com');  -- Will use idx_email_lower

-- User search functionality
SELECT id, first_name, last_name FROM user_accounts
WHERE LOWER(first_name || ' ' || last_name) LIKE LOWER('%john doe%');
```

### 2. Date and Time Extractions

```sql
-- Analytics and reporting table
CREATE TABLE sales_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    amount DECIMAL(10,2),
    transaction_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Date part extraction indexes
CREATE INDEX idx_transaction_year ON sales_transactions (EXTRACT(YEAR FROM transaction_date));
CREATE INDEX idx_transaction_month ON sales_transactions (EXTRACT(MONTH FROM transaction_date));
CREATE INDEX idx_transaction_dow ON sales_transactions (EXTRACT(DOW FROM transaction_date));  -- Day of week
CREATE INDEX idx_transaction_quarter ON sales_transactions (EXTRACT(QUARTER FROM transaction_date));

-- Composite expression index for year-month
CREATE INDEX idx_transaction_year_month ON sales_transactions (
    EXTRACT(YEAR FROM transaction_date),
    EXTRACT(MONTH FROM transaction_date)
);

-- Date truncation for grouping
CREATE INDEX idx_transaction_date_trunc ON sales_transactions (DATE_TRUNC('day', transaction_date));

-- Efficient reporting queries
-- Monthly sales report
SELECT
    EXTRACT(YEAR FROM transaction_date) as year,
    EXTRACT(MONTH FROM transaction_date) as month,
    COUNT(*) as transaction_count,
    SUM(amount) as total_sales
FROM sales_transactions
WHERE EXTRACT(YEAR FROM transaction_date) = 2024
GROUP BY EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date)
ORDER BY year, month;

-- Weekly sales analysis
SELECT
    EXTRACT(DOW FROM transaction_date) as day_of_week,
    AVG(amount) as avg_transaction_amount
FROM sales_transactions
WHERE EXTRACT(DOW FROM transaction_date) IN (1, 2, 3, 4, 5)  -- Weekdays only
GROUP BY EXTRACT(DOW FROM transaction_date);

-- Daily aggregation
SELECT
    DATE_TRUNC('day', transaction_date) as day,
    COUNT(*) as daily_transactions,
    SUM(amount) as daily_revenue
FROM sales_transactions
WHERE DATE_TRUNC('day', transaction_date) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', transaction_date)
ORDER BY day;
```

### 3. JSON and JSONB Operations

```sql
-- User profile management
CREATE TABLE user_profiles (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    profile_data JSONB,
    preferences JSONB,
    created_at TIMESTAMP
);

-- JSON path extraction indexes
CREATE INDEX idx_user_city ON user_profiles ((profile_data->>'city'));
CREATE INDEX idx_user_age ON user_profiles (((profile_data->>'age')::INTEGER));
CREATE INDEX idx_user_country ON user_profiles ((profile_data->'address'->>'country'));

-- Preference-based indexes
CREATE INDEX idx_email_notifications ON user_profiles (((preferences->>'email_notifications')::BOOLEAN));
CREATE INDEX idx_language_preference ON user_profiles ((preferences->>'language'));

-- Complex JSON expression indexes
CREATE INDEX idx_full_address ON user_profiles (
    (profile_data->'address'->>'street') || ', ' ||
    (profile_data->'address'->>'city') || ', ' ||
    (profile_data->'address'->>'country')
);

-- Numerical calculations from JSON
CREATE INDEX idx_profile_score ON user_profiles (
    (COALESCE((profile_data->>'age')::INTEGER, 0) * 0.3 +
     COALESCE((profile_data->>'experience_years')::INTEGER, 0) * 0.7)::INTEGER
);

-- Efficient JSON queries
-- Location-based search
SELECT username, profile_data->>'city' as city
FROM user_profiles
WHERE profile_data->>'city' = 'New York';

-- Age-based filtering
SELECT username, profile_data->>'age' as age
FROM user_profiles
WHERE (profile_data->>'age')::INTEGER BETWEEN 25 AND 35;

-- Preference filtering
SELECT username
FROM user_profiles
WHERE (preferences->>'email_notifications')::BOOLEAN = true
AND preferences->>'language' = 'english';

-- Address search
SELECT username,
       profile_data->'address'->>'street' || ', ' ||
       profile_data->'address'->>'city' || ', ' ||
       profile_data->'address'->>'country' as full_address
FROM user_profiles
WHERE (profile_data->'address'->>'street') || ', ' ||
      (profile_data->'address'->>'city') || ', ' ||
      (profile_data->'address'->>'country') LIKE '%New York%';
```

### 4. Mathematical Calculations

```sql
-- E-commerce order items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    unit_price DECIMAL(8,2),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0
);

-- Calculated value indexes
CREATE INDEX idx_line_total ON order_items (quantity * unit_price);
CREATE INDEX idx_discounted_price ON order_items (unit_price * (1 - discount_percent/100));
CREATE INDEX idx_final_amount ON order_items (
    quantity * unit_price * (1 - discount_percent/100) * (1 + tax_rate/100)
);

-- Price range categorization
CREATE INDEX idx_price_category ON order_items (
    CASE
        WHEN unit_price < 50 THEN 'low'
        WHEN unit_price < 200 THEN 'medium'
        WHEN unit_price < 500 THEN 'high'
        ELSE 'premium'
    END
);

-- Profit margin calculation (assuming cost price stored elsewhere)
CREATE INDEX idx_profit_margin ON order_items (
    CASE
        WHEN unit_price > 0 THEN
            ((unit_price - COALESCE((SELECT cost_price FROM products p WHERE p.id = order_items.product_id), 0)) / unit_price * 100)
        ELSE 0
    END
);

-- Business analytics queries
-- High-value order analysis
SELECT order_id, SUM(quantity * unit_price) as order_total
FROM order_items
WHERE quantity * unit_price > 500  -- Uses idx_line_total
GROUP BY order_id
ORDER BY order_total DESC;

-- Discount effectiveness analysis
SELECT
    discount_percent,
    COUNT(*) as item_count,
    AVG(unit_price * (1 - discount_percent/100)) as avg_discounted_price
FROM order_items
WHERE discount_percent > 0
GROUP BY discount_percent
ORDER BY discount_percent;

-- Revenue by price category
SELECT
    CASE
        WHEN unit_price < 50 THEN 'low'
        WHEN unit_price < 200 THEN 'medium'
        WHEN unit_price < 500 THEN 'high'
        ELSE 'premium'
    END as price_category,
    COUNT(*) as item_count,
    SUM(quantity * unit_price * (1 - discount_percent/100) * (1 + tax_rate/100)) as total_revenue
FROM order_items
GROUP BY 1  -- Uses idx_price_category and idx_final_amount
ORDER BY total_revenue DESC;
```

### 5. Text Processing and Search

```sql
-- Content management system
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    author_id INTEGER,
    slug VARCHAR(255),
    published_at TIMESTAMP
);

-- Text processing expression indexes
CREATE INDEX idx_title_tsvector ON articles USING GIN (to_tsvector('english', title));
CREATE INDEX idx_content_search ON articles USING GIN (to_tsvector('english', title || ' ' || content));

-- URL-friendly slug from title
CREATE INDEX idx_generated_slug ON articles (LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')));

-- Reading time estimation (assuming 200 words per minute)
CREATE INDEX idx_reading_time ON articles (
    CEIL(array_length(string_to_array(content, ' '), 1) / 200.0)
);

-- Content length categorization
CREATE INDEX idx_content_length_category ON articles (
    CASE
        WHEN LENGTH(content) < 500 THEN 'short'
        WHEN LENGTH(content) < 2000 THEN 'medium'
        WHEN LENGTH(content) < 5000 THEN 'long'
        ELSE 'very_long'
    END
);

-- Publication period grouping
CREATE INDEX idx_publication_period ON articles (
    CASE
        WHEN published_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'this_week'
        WHEN published_at >= CURRENT_DATE - INTERVAL '30 days' THEN 'this_month'
        WHEN published_at >= CURRENT_DATE - INTERVAL '90 days' THEN 'this_quarter'
        ELSE 'older'
    END
);

-- Content search and discovery queries
-- Full-text search
SELECT id, title, author_id
FROM articles
WHERE to_tsvector('english', title || ' ' || content) @@ to_tsquery('english', 'postgresql & performance');

-- Find articles by estimated reading time
SELECT title, CEIL(array_length(string_to_array(content, ' '), 1) / 200.0) as reading_minutes
FROM articles
WHERE CEIL(array_length(string_to_array(content, ' '), 1) / 200.0) BETWEEN 5 AND 15
ORDER BY reading_minutes;

-- Content analysis by length category
SELECT
    CASE
        WHEN LENGTH(content) < 500 THEN 'short'
        WHEN LENGTH(content) < 2000 THEN 'medium'
        WHEN LENGTH(content) < 5000 THEN 'long'
        ELSE 'very_long'
    END as content_category,
    COUNT(*) as article_count,
    AVG(LENGTH(content)) as avg_length
FROM articles
GROUP BY 1
ORDER BY avg_length;
```

## Advanced Expression Index Techniques

### 1. Composite Expression Indexes

```sql
-- Multi-column expressions in single index
CREATE TABLE customer_analytics (
    customer_id INTEGER,
    first_purchase_date DATE,
    last_purchase_date DATE,
    total_spent DECIMAL(10,2),
    purchase_count INTEGER
);

-- Customer lifecycle analysis index
CREATE INDEX idx_customer_metrics ON customer_analytics (
    customer_id,
    EXTRACT(DAYS FROM (last_purchase_date - first_purchase_date)) / 365.0,  -- Customer lifetime in years
    total_spent / NULLIF(purchase_count, 0)  -- Average order value
);

-- Customer segmentation index
CREATE INDEX idx_customer_segment ON customer_analytics (
    CASE
        WHEN total_spent > 5000 AND purchase_count > 50 THEN 'vip'
        WHEN total_spent > 1000 AND purchase_count > 20 THEN 'loyal'
        WHEN total_spent > 500 THEN 'regular'
        ELSE 'new'
    END,
    last_purchase_date
);

-- Query using composite expression
SELECT
    customer_id,
    EXTRACT(DAYS FROM (last_purchase_date - first_purchase_date)) / 365.0 as lifetime_years,
    total_spent / NULLIF(purchase_count, 0) as avg_order_value
FROM customer_analytics
WHERE EXTRACT(DAYS FROM (last_purchase_date - first_purchase_date)) / 365.0 > 2.0
AND total_spent / NULLIF(purchase_count, 0) > 100
ORDER BY lifetime_years DESC;
```

### 2. Conditional Expression Indexes

```sql
-- Performance monitoring table
CREATE TABLE query_performance (
    query_id VARCHAR(50),
    execution_time_ms INTEGER,
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_mb INTEGER,
    timestamp TIMESTAMP
);

-- Performance classification index
CREATE INDEX idx_performance_classification ON query_performance (
    CASE
        WHEN execution_time_ms > 5000 THEN 'slow'
        WHEN execution_time_ms > 1000 THEN 'medium'
        ELSE 'fast'
    END,
    CASE
        WHEN cpu_usage_percent > 80 THEN 'high_cpu'
        WHEN cpu_usage_percent > 40 THEN 'medium_cpu'
        ELSE 'low_cpu'
    END,
    timestamp
);

-- Resource efficiency index
CREATE INDEX idx_efficiency_score ON query_performance (
    ROUND(
        (100.0 - cpu_usage_percent) *
        (10000.0 / NULLIF(execution_time_ms, 0)) *
        (1000.0 / NULLIF(memory_usage_mb, 0)),
        2
    )  -- Higher score = more efficient
);

-- Performance analysis queries
SELECT
    query_id,
    ROUND(AVG(
        (100.0 - cpu_usage_percent) *
        (10000.0 / NULLIF(execution_time_ms, 0)) *
        (1000.0 / NULLIF(memory_usage_mb, 0))
    ), 2) as avg_efficiency_score
FROM query_performance
WHERE timestamp >= CURRENT_DATE - INTERVAL '24 hours'
GROUP BY query_id
ORDER BY avg_efficiency_score DESC;
```

### 3. Array and Aggregate Expression Indexes

```sql
-- Product reviews table
CREATE TABLE product_reviews (
    product_id INTEGER,
    user_id INTEGER,
    rating INTEGER,  -- 1-5 scale
    review_text TEXT,
    tags TEXT[],
    created_at TIMESTAMP
);

-- Tag-based expression indexes
CREATE INDEX idx_tag_count ON product_reviews (array_length(tags, 1));
CREATE INDEX idx_has_positive_tags ON product_reviews (tags && ARRAY['excellent', 'great', 'amazing']);
CREATE INDEX idx_tag_variety ON product_reviews (array_length(array(SELECT DISTINCT unnest(tags)), 1));

-- Review quality scoring
CREATE INDEX idx_review_quality_score ON product_reviews (
    (rating * 20) +  -- Rating component (0-100)
    (LEAST(LENGTH(review_text) / 10, 30)) +  -- Length component (0-30, capped)
    (array_length(tags, 1) * 5)  -- Tag component (5 points per tag)
);

-- Time-based sentiment analysis
CREATE INDEX idx_sentiment_trend ON product_reviews (
    product_id,
    DATE_TRUNC('month', created_at),
    CASE
        WHEN rating >= 4 THEN 1
        WHEN rating <= 2 THEN -1
        ELSE 0
    END  -- Sentiment score
);

-- Product quality analysis
SELECT
    product_id,
    AVG(rating) as avg_rating,
    AVG(array_length(tags, 1)) as avg_tag_count,
    AVG(
        (rating * 20) +
        (LEAST(LENGTH(review_text) / 10, 30)) +
        (array_length(tags, 1) * 5)
    ) as avg_quality_score
FROM product_reviews
WHERE array_length(tags, 1) >= 3  -- Reviews with substantial tagging
GROUP BY product_id
ORDER BY avg_quality_score DESC;
```

## Performance Considerations and Optimization

### 1. Expression Cost Analysis

```sql
-- Compare different expression index approaches
CREATE TABLE test_performance (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    created_at TIMESTAMP,
    data_json JSONB
);

-- Different indexing strategies for email search
CREATE INDEX idx_email_lower_simple ON test_performance (LOWER(email));
CREATE INDEX idx_email_lower_collate ON test_performance (LOWER(email) COLLATE "C");
CREATE INDEX idx_email_functional ON test_performance USING hash (LOWER(email));

-- Benchmark different approaches
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM test_performance WHERE LOWER(email) = 'test@example.com';

-- Monitor expression evaluation cost
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_email%'
ORDER BY idx_scan DESC;
```

### 2. Expression Stability and Determinism

```sql
-- ✅ GOOD: Stable, deterministic expressions
CREATE INDEX idx_stable_expression ON table_name (LOWER(column_name));
CREATE INDEX idx_date_stable ON table_name (EXTRACT(YEAR FROM date_column));
CREATE INDEX idx_math_stable ON table_name (price * quantity);

-- ❌ BAD: Non-deterministic expressions (PostgreSQL will prevent these)
-- CREATE INDEX idx_bad_random ON table_name (random());  -- Error: functions must be IMMUTABLE
-- CREATE INDEX idx_bad_now ON table_name (NOW());        -- Error: functions must be IMMUTABLE
-- CREATE INDEX idx_bad_current ON table_name (CURRENT_DATE);  -- Error: functions must be IMMUTABLE

-- ✅ GOOD: Use deterministic alternatives
CREATE INDEX idx_good_date ON table_name (date_column)  -- Index the column directly
WHERE date_column >= '2024-01-01';  -- Use WHERE for time-based filtering

-- Check function volatility for index safety
SELECT
    proname,
    provolatile,
    CASE provolatile
        WHEN 'i' THEN 'IMMUTABLE - Safe for indexes'
        WHEN 's' THEN 'STABLE - Generally safe for indexes'
        WHEN 'v' THEN 'VOLATILE - NOT safe for indexes'
    END as index_safety
FROM pg_proc
WHERE proname IN ('lower', 'upper', 'extract', 'now', 'random', 'current_date');
```

### 3. Maintenance and Monitoring

```sql
-- Expression index health monitoring
CREATE OR REPLACE VIEW expression_index_analysis AS
SELECT
    schemaname,
    tablename,
    indexname,
    pg_get_indexdef(indexrelid) as index_definition,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE
        WHEN pg_get_indexdef(indexrelid) ~ '\(' THEN 'Expression Index'
        ELSE 'Regular Index'
    END as index_type,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE USAGE'
        ELSE 'HIGH USAGE'
    END as usage_level
FROM pg_stat_user_indexes
WHERE pg_get_indexdef(indexrelid) ~ '\('  -- Contains parentheses (likely expression)
ORDER BY pg_relation_size(indexrelid) DESC;

-- Query the analysis view
SELECT * FROM expression_index_analysis;

-- Identify slow expression evaluations
SELECT
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements
WHERE query ~ 'LOWER|UPPER|EXTRACT|::|\|\|'  -- Common expression patterns
AND calls > 10
ORDER BY mean_time DESC;
```

## Best Practices and Guidelines

### 1. When to Use Expression Indexes

```sql
-- ✅ GOOD candidates for expression indexes:
-- 1. Case-insensitive searches
CREATE INDEX idx_case_insensitive ON table_name (LOWER(text_column));

-- 2. Date/time part extractions for reporting
CREATE INDEX idx_date_parts ON table_name (EXTRACT(YEAR FROM date_column));

-- 3. JSON path extractions for frequent queries
CREATE INDEX idx_json_path ON table_name ((json_column->>'key'));

-- 4. Mathematical calculations used in WHERE/ORDER BY
CREATE INDEX idx_calculated_total ON table_name (price * quantity);

-- 5. String concatenations for full-text search
CREATE INDEX idx_full_text ON table_name USING GIN (to_tsvector('english', title || ' ' || content));

-- ❌ AVOID for:
-- Complex expressions that change frequently
-- Expensive function calls that slow down inserts/updates
-- Non-deterministic functions
-- Expressions that are rarely used in queries
```

### 2. Design Best Practices

```sql
-- Keep expressions simple and efficient
-- ✅ GOOD: Simple function calls
CREATE INDEX idx_simple_lower ON users (LOWER(email));
CREATE INDEX idx_simple_extract ON orders (EXTRACT(MONTH FROM order_date));

-- ❌ AVOID: Complex nested expressions
-- CREATE INDEX idx_complex_bad ON table_name (
--     CASE
--         WHEN EXTRACT(DOW FROM complex_date_calc(col1, col2)) IN (1,2,3,4,5)
--         THEN UPPER(SUBSTR(text_col, 1, 10))
--         ELSE LOWER(REVERSE(text_col))
--     END
-- );

-- Use partial indexes with expressions for better targeting
CREATE INDEX idx_active_users_email_lower ON users (LOWER(email))
WHERE status = 'active';

CREATE INDEX idx_recent_orders_total ON orders (price * quantity)
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days';
```

### 3. Query Optimization with Expression Indexes

```sql
-- Ensure queries match index expressions exactly
-- ✅ CORRECT: Query matches index expression
-- Index: CREATE INDEX idx_email_lower ON users (LOWER(email));
SELECT * FROM users WHERE LOWER(email) = LOWER('User@Example.com');

-- ❌ INCORRECT: Query doesn't match index expression
-- SELECT * FROM users WHERE email ILIKE 'user@example.com';  -- Won't use idx_email_lower

-- Use expressions consistently in application code
-- Define helper functions for complex expressions
CREATE OR REPLACE FUNCTION calculate_order_total(quantity INTEGER, unit_price DECIMAL, discount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN quantity * unit_price * (1 - discount/100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create index using the function
CREATE INDEX idx_order_total_func ON orders (calculate_order_total(quantity, unit_price, discount_percent));

-- Use consistently in queries
SELECT * FROM orders
WHERE calculate_order_total(quantity, unit_price, discount_percent) > 1000;
```

## Summary

**Expression indexes** enable efficient querying on computed values by pre-calculating and indexing function results. They provide:

**Key Benefits:**

- **Avoid runtime calculations** - Pre-computed expression results
- **Enable complex query optimization** - Support for functions in WHERE/ORDER BY
- **Case-insensitive search** - LOWER/UPPER function indexes
- **JSON path optimization** - Direct indexing of JSONB extractions
- **Date/time analytics** - EXTRACT function indexes for reporting

**Best Use Cases:**

- **Case-insensitive searches** - `LOWER(email)`, `UPPER(name)`
- **Date/time extractions** - `EXTRACT(YEAR FROM date)`, `DATE_TRUNC()`
- **JSON operations** - `(json_column->>'key')`, `(json_column#>'{path}')`
- **Mathematical calculations** - `quantity * price`, computed totals
- **Text processing** - `to_tsvector()` for full-text search

**Design Principles:**

- Use **IMMUTABLE** functions only
- Keep expressions **simple and efficient**
- **Match queries exactly** to expression syntax
- **Combine with partial indexes** for better targeting
- **Monitor usage and performance** regularly

**Common Patterns:**

```sql
-- Case-insensitive: LOWER(column)
-- Date parts: EXTRACT(part FROM date)
-- JSON paths: (json_col->>'key')
-- Calculations: (col1 * col2)
-- Text search: to_tsvector('lang', text)
```

Expression indexes are essential for applications with complex query patterns, enabling PostgreSQL to efficiently handle computed values, case-insensitive searches, JSON operations, and analytical queries without sacrificing performance.
