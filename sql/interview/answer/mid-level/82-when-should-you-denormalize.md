# 82. When should you denormalize a database?

## Overview

Denormalization should be a deliberate, measured decision based on specific performance requirements and use cases. It's not a default choice but rather an optimization technique applied when normalization becomes a bottleneck.

## When to Denormalize: Key Scenarios

### 1. Read-Heavy Workloads

When your application performs far more reads than writes, denormalization can significantly improve performance.

**Indicators:**
- Read-to-write ratio is 100:1 or higher
- Most queries are SELECT statements
- Write operations are infrequent or can be done in batches

**Example:**

```sql
-- Reporting dashboard that shows customer order summaries
-- Queries run thousands of times per day, orders created only occasionally

-- Normalized (requires multiple joins)
SELECT 
    c.customer_name,
    COUNT(o.order_id) AS order_count,
    SUM(oi.quantity * oi.price) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY c.customer_id, c.customer_name;

-- Denormalized (pre-calculated)
CREATE TABLE customer_summaries (
    customer_id INT PRIMARY KEY,
    customer_name VARCHAR(100),
    order_count INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_order_date DATE,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Simple, fast query
SELECT customer_name, order_count, total_spent
FROM customer_summaries
WHERE order_count > 10;
```

### 2. Complex Joins Are Too Slow

When queries require many joins (5+) and are causing performance issues.

**Indicators:**
- Queries regularly join 5 or more tables
- Query execution time exceeds acceptable limits
- EXPLAIN shows expensive join operations
- High CPU usage during queries

**Example:**

```sql
-- Complex normalized query
SELECT 
    o.order_id,
    c.customer_name,
    c.email,
    a.street,
    a.city,
    a.state,
    p.product_name,
    cat.category_name,
    v.vendor_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN addresses a ON o.shipping_address_id = a.address_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN categories cat ON p.category_id = cat.category_id
JOIN vendors v ON p.vendor_id = v.vendor_id
WHERE o.order_date > '2024-01-01';

-- Denormalized alternative
CREATE TABLE order_details_flat (
    order_id INT,
    order_date DATE,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    shipping_street VARCHAR(100),
    shipping_city VARCHAR(50),
    shipping_state VARCHAR(2),
    product_name VARCHAR(100),
    category_name VARCHAR(50),
    vendor_name VARCHAR(100),
    quantity INT,
    price DECIMAL(10,2)
);

-- Simpler query
SELECT * FROM order_details_flat
WHERE order_date > '2024-01-01';
```

### 3. Reporting and Analytics

Data warehouses and reporting systems are prime candidates for denormalization.

**Indicators:**
- Data is primarily used for analysis, not transactions
- Historical data that rarely changes
- Complex aggregations are common
- Business intelligence tools need fast access

**Example:**

```sql
-- Create star schema for analytics
CREATE TABLE fact_sales (
    sale_id BIGSERIAL PRIMARY KEY,
    date_id INT,
    product_id INT,
    customer_id INT,
    store_id INT,
    -- Denormalized dimensions
    product_name VARCHAR(100),
    product_category VARCHAR(50),
    customer_segment VARCHAR(20),
    store_region VARCHAR(50),
    -- Measures
    quantity INT,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    cost DECIMAL(12,2),
    profit DECIMAL(12,2)
);

-- Fast aggregation queries
SELECT 
    store_region,
    product_category,
    SUM(total_amount) AS revenue,
    SUM(profit) AS profit
FROM fact_sales
WHERE date_id BETWEEN 20240101 AND 20241231
GROUP BY store_region, product_category;
```

### 4. Frequently Accessed Calculated Values

When you repeatedly calculate the same values from raw data.

**Indicators:**
- Same calculations performed in many queries
- Calculations are expensive (aggregations, complex math)
- Source data changes infrequently
- Real-time accuracy is not critical

**Example:**

```sql
-- Without denormalization: calculate on every query
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT,
    order_date DATE
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10,2)
);

-- Expensive calculation repeated often
SELECT 
    order_id,
    SUM(quantity * unit_price) AS order_total,
    COUNT(*) AS item_count,
    AVG(quantity * unit_price) AS avg_item_value
FROM order_items
GROUP BY order_id;

-- With denormalization: pre-calculated values
CREATE TABLE orders_denormalized (
    order_id SERIAL PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    -- Pre-calculated fields
    order_total DECIMAL(12,2),
    item_count INT,
    avg_item_value DECIMAL(10,2),
    calculated_at TIMESTAMP
);

-- Fast retrieval
SELECT order_id, order_total, item_count
FROM orders_denormalized;
```

### 5. Small, Rarely Changing Lookup Tables

When joining with reference data that almost never changes.

**Indicators:**
- Lookup tables are small (< 1000 rows)
- Data changes rarely (monthly, yearly, or never)
- Frequently joined with large tables
- Same lookup data used across many queries

**Example:**

```sql
-- Lookup tables
CREATE TABLE countries (
    country_id INT PRIMARY KEY,
    country_code CHAR(2),
    country_name VARCHAR(50)
);

CREATE TABLE order_statuses (
    status_id INT PRIMARY KEY,
    status_code VARCHAR(20),
    status_description VARCHAR(100)
);

-- Normalized
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    country_id INT REFERENCES countries(country_id),
    status_id INT REFERENCES order_statuses(status_id),
    order_date DATE
);

-- Denormalized: include lookup values directly
CREATE TABLE orders_denormalized (
    order_id SERIAL PRIMARY KEY,
    country_id INT,
    country_code CHAR(2),      -- Denormalized from countries
    country_name VARCHAR(50),   -- Denormalized from countries
    status_id INT,
    status_code VARCHAR(20),    -- Denormalized from order_statuses
    status_description VARCHAR(100), -- Denormalized from order_statuses
    order_date DATE
);
```

### 6. Historical or Archival Data

Data that represents a point-in-time snapshot and won't be updated.

**Indicators:**
- Data represents completed transactions or events
- No updates after initial creation
- Used for historical reporting
- Compliance or audit requirements

**Example:**

```sql
-- Invoice snapshot: capture all data at time of creation
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_date DATE,
    invoice_number VARCHAR(50),
    
    -- Customer info (snapshot at invoice time)
    customer_id INT,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    customer_tax_id VARCHAR(50),
    
    -- Billing address (snapshot)
    billing_street VARCHAR(100),
    billing_city VARCHAR(50),
    billing_state VARCHAR(2),
    billing_zip VARCHAR(10),
    
    -- Totals (pre-calculated)
    subtotal DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    shipping DECIMAL(10,2),
    discount DECIMAL(10,2),
    total DECIMAL(12,2),
    
    -- Status
    status VARCHAR(20),
    paid_date DATE
);

-- Invoice items (snapshot of product details)
CREATE TABLE invoice_items (
    invoice_item_id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(invoice_id),
    
    -- Product info at time of sale
    product_id INT,
    product_name VARCHAR(100),
    product_sku VARCHAR(50),
    product_description TEXT,
    
    -- Pricing
    quantity INT,
    unit_price DECIMAL(10,2),
    line_total DECIMAL(12,2),
    tax_rate DECIMAL(5,4),
    tax_amount DECIMAL(10,2)
);
```

### 7. API Response Optimization

When serving data through APIs that need fast response times.

**Indicators:**
- API endpoints have strict SLA requirements (< 100ms)
- Same data structure requested repeatedly
- Mobile apps or external clients
- High request volume

**Example:**

```sql
-- Normalized: requires multiple queries or complex join
-- GET /api/users/{id}/profile

-- Denormalized: single query for complete profile
CREATE TABLE user_profiles_cache (
    user_id INT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    bio TEXT,
    
    -- Statistics (denormalized)
    post_count INT,
    follower_count INT,
    following_count INT,
    last_post_date TIMESTAMP,
    
    -- Preferences (denormalized)
    timezone VARCHAR(50),
    language VARCHAR(10),
    theme VARCHAR(20),
    
    -- Cache metadata
    cached_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Single fast query
SELECT * FROM user_profiles_cache
WHERE user_id = 12345
AND expires_at > NOW();
```

### 8. Search and Filtering Performance

When building search features that need to scan multiple fields.

**Indicators:**
- Full-text search across multiple tables
- Complex filtering on related data
- Auto-complete or typeahead features
- High search query volume

**Example:**

```sql
-- Denormalized search table
CREATE TABLE product_search_index (
    product_id INT PRIMARY KEY,
    -- Combined searchable content
    search_content TEXT, -- product name + description + category + tags
    
    -- Filterable fields (denormalized)
    product_name VARCHAR(200),
    category_name VARCHAR(50),
    subcategory_name VARCHAR(50),
    brand_name VARCHAR(50),
    vendor_name VARCHAR(100),
    
    -- Attributes for filtering
    price DECIMAL(10,2),
    rating DECIMAL(3,2),
    review_count INT,
    in_stock BOOLEAN,
    
    -- Full-text search vector
    search_vector tsvector
);

-- Create GIN index for fast search
CREATE INDEX idx_product_search_vector 
ON product_search_index 
USING GIN(search_vector);

-- Fast search query
SELECT product_id, product_name, category_name, price
FROM product_search_index
WHERE search_vector @@ to_tsquery('laptop & gaming')
AND price BETWEEN 500 AND 1500
AND in_stock = true;
```

## When NOT to Denormalize

### 1. Write-Heavy Applications

**Don't denormalize if:**
- Frequent updates to denormalized data
- Data changes in real-time
- Maintaining consistency would be complex
- Write performance is more critical than read performance

**Example: Social Media Post Likes**

```sql
-- BAD: Denormalizing like counts on posts that update constantly
CREATE TABLE posts (
    post_id INT PRIMARY KEY,
    content TEXT,
    like_count INT -- Updated on every like/unlike
);

-- GOOD: Keep normalized, use aggregate when needed
CREATE TABLE posts (
    post_id INT PRIMARY KEY,
    content TEXT
);

CREATE TABLE post_likes (
    post_id INT,
    user_id INT,
    created_at TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);

-- Calculate on demand or cache temporarily
SELECT post_id, COUNT(*) as like_count
FROM post_likes
GROUP BY post_id;
```

### 2. Frequently Changing Data

**Don't denormalize if:**
- Source data updates regularly
- Keeping denormalized data in sync is expensive
- Data consistency is critical

### 3. Small Datasets

**Don't denormalize if:**
- Tables are small (< 10,000 rows)
- Queries are already fast enough
- Joins don't impact performance

### 4. Data Integrity is Critical

**Don't denormalize if:**
- Financial transactions
- Medical records
- Legal documents
- Any system where inconsistency has serious consequences

### 5. Storage Constraints

**Don't denormalize if:**
- Disk space is limited
- Cost of storage is a concern
- Data duplication would be excessive

## Decision Framework

### Step 1: Measure First

```sql
-- Benchmark current performance
EXPLAIN ANALYZE
SELECT ...
FROM normalized_tables
...;

-- Is it actually slow? (> 1 second? > 100ms?)
-- How often is it queried? (once/day vs 1000/second)
```

### Step 2: Try Alternatives First

Before denormalizing, try:

1. **Add Indexes**
```sql
CREATE INDEX idx_orders_customer_date 
ON orders(customer_id, order_date);
```

2. **Use Materialized Views**
```sql
CREATE MATERIALIZED VIEW order_summaries AS
SELECT customer_id, COUNT(*), SUM(total)
FROM orders
GROUP BY customer_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW order_summaries;
```

3. **Optimize Queries**
```sql
-- Use CTEs, better join strategies, etc.
```

4. **Add Caching Layer**
- Redis, Memcached for query results
- Application-level caching

### Step 3: Calculate the Cost

```sql
-- Estimate maintenance overhead
-- How many places need to update when data changes?
-- How often does source data change?
-- What's the cost of inconsistency?
```

### Step 4: Implement with Safeguards

```sql
-- Add triggers to maintain consistency
CREATE TRIGGER update_denormalized_data
AFTER INSERT OR UPDATE OR DELETE ON source_table
FOR EACH ROW
EXECUTE FUNCTION sync_denormalized();

-- Add consistency checks
CREATE OR REPLACE FUNCTION check_data_consistency()
RETURNS TABLE(issue TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Inconsistent order total' AS issue
    FROM orders o
    WHERE o.order_total != (
        SELECT SUM(quantity * price)
        FROM order_items
        WHERE order_id = o.order_id
    );
END;
$$ LANGUAGE plpgsql;

-- Run periodically
SELECT * FROM check_data_consistency();
```

## Real-World Examples

### E-commerce Platform

```sql
-- Denormalize: Order history (rarely changes after creation)
-- Don't denormalize: Inventory levels (constantly changing)
-- Denormalize: Product catalog cache for search
-- Don't denormalize: Shopping cart (temporary, frequent updates)
```

### Social Media

```sql
-- Denormalize: User profile data for feed display
-- Don't denormalize: Friend connections (graph data)
-- Denormalize: Post engagement metrics (cached, refreshed periodically)
-- Don't denormalize: Real-time notifications
```

### Banking System

```sql
-- Denormalize: Account statement history (immutable snapshots)
-- Don't denormalize: Account balances (critical accuracy)
-- Denormalize: Customer 360 view for support (read-only dashboard)
-- Don't denormalize: Transaction records (audit trail)
```

## Best Practices Checklist

✅ **Do Denormalize When:**
- [ ] You've measured and confirmed a performance problem
- [ ] Reads vastly outnumber writes (10:1 or higher)
- [ ] You have a strategy to maintain consistency
- [ ] The data is historical/immutable or changes rarely
- [ ] Joins are provably the bottleneck
- [ ] You've tried other optimizations first
- [ ] You can monitor for inconsistencies

❌ **Don't Denormalize When:**
- [ ] You're guessing about performance
- [ ] Data changes frequently
- [ ] You can't maintain consistency reliably
- [ ] Storage cost is prohibitive
- [ ] Data integrity is mission-critical
- [ ] The performance issue can be solved with indexes
- [ ] The dataset is small

## Monitoring Denormalized Data

```sql
-- Create monitoring queries
CREATE VIEW denormalization_health AS
SELECT
    'order_totals' AS denorm_check,
    COUNT(*) AS mismatched_records
FROM orders o
WHERE o.order_total != (
    SELECT COALESCE(SUM(quantity * price), 0)
    FROM order_items oi
    WHERE oi.order_id = o.order_id
)
UNION ALL
SELECT
    'customer_stats' AS denorm_check,
    COUNT(*) AS mismatched_records
FROM customers c
WHERE c.order_count != (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.customer_id = c.customer_id
);

-- Alert if inconsistencies detected
SELECT * FROM denormalization_health
WHERE mismatched_records > 0;
```

## Summary

**Denormalize when:**
- Performance bottlenecks are proven
- Read-heavy workloads dominate
- Data is historical or rarely changes
- Complex joins are unavoidable
- You have maintenance strategies in place

**Key principle:** Denormalization is an optimization technique, not a design pattern. Start normalized, measure performance, and denormalize strategically only when necessary.
