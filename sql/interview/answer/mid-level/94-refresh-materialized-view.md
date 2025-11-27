# 94. How do you refresh a materialized view?

## Definition

Refreshing a materialized view means recomputing and updating the stored data with the latest results from the underlying query. Since materialized views store precomputed data, they become stale over time and need explicit refresh to stay current.

## Basic Refresh Syntax

### Standard Refresh

```sql
REFRESH MATERIALIZED VIEW view_name;
```

This performs a full refresh:
- Drops all existing data in the materialized view
- Re-executes the underlying query
- Stores the new results
- Blocks all reads during the refresh process

### Example

```sql
-- Create a materialized view
CREATE MATERIALIZED VIEW daily_sales AS
SELECT 
    DATE(order_date) AS sale_date,
    SUM(amount) AS total_sales,
    COUNT(*) AS order_count
FROM orders
GROUP BY DATE(order_date);

-- Refresh it (full refresh, blocking)
REFRESH MATERIALIZED VIEW daily_sales;
```

## Concurrent Refresh

### CONCURRENTLY Option

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY view_name;
```

Benefits of concurrent refresh:
- Allows reads to continue during the refresh
- Uses a temporary copy to compute new data
- Swaps the data atomically when complete
- Minimizes downtime for queries

### Requirements for CONCURRENTLY

1. **Unique Index Required**: The materialized view must have at least one unique index

```sql
-- Create materialized view
CREATE MATERIALIZED VIEW product_summary AS
SELECT 
    product_id,
    product_name,
    SUM(quantity) AS total_sold,
    AVG(price) AS avg_price
FROM sales s
JOIN products p ON s.product_id = p.id
GROUP BY product_id, product_name;

-- Create unique index (required for CONCURRENTLY)
CREATE UNIQUE INDEX product_summary_product_id_idx 
ON product_summary(product_id);

-- Now can refresh concurrently
REFRESH MATERIALIZED VIEW CONCURRENTLY product_summary;
```

### Why Unique Index is Required

PostgreSQL needs to:
- Identify which rows changed between old and new data
- Perform incremental updates rather than full replacement
- Ensure data consistency during the swap operation

## WITH NO DATA Option

### Creating Without Data

```sql
-- Create materialized view without populating it
CREATE MATERIALIZED VIEW sales_summary AS
SELECT region, SUM(amount) AS total_sales
FROM sales
GROUP BY region
WITH NO DATA;
```

### Refreshing Empty Materialized View

```sql
-- Populate the materialized view for the first time
REFRESH MATERIALIZED VIEW sales_summary;

-- Cannot use CONCURRENTLY on empty materialized view
-- This would fail:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY sales_summary;
```

## Complete Examples

### Example 1: E-commerce Analytics

```sql
-- Sales analytics materialized view
CREATE MATERIALIZED VIEW monthly_product_sales AS
SELECT 
    DATE_TRUNC('month', order_date) AS month,
    product_id,
    product_name,
    SUM(quantity * price) AS revenue,
    SUM(quantity) AS units_sold,
    COUNT(DISTINCT order_id) AS order_count
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE order_date >= '2023-01-01'
GROUP BY DATE_TRUNC('month', order_date), product_id, product_name;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX monthly_product_sales_month_product_idx 
ON monthly_product_sales(month, product_id);

-- Initial refresh
REFRESH MATERIALIZED VIEW monthly_product_sales;

-- Daily concurrent refresh (non-blocking)
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_product_sales;
```

### Example 2: User Activity Dashboard

```sql
-- User activity summary
CREATE MATERIALIZED VIEW user_activity_summary AS
SELECT 
    user_id,
    username,
    last_login,
    login_count,
    posts_count,
    comments_count,
    total_activity_score
FROM (
    SELECT 
        u.id AS user_id,
        u.username,
        u.last_login,
        COALESCE(l.login_count, 0) AS login_count,
        COALESCE(p.posts_count, 0) AS posts_count,
        COALESCE(c.comments_count, 0) AS comments_count,
        (COALESCE(l.login_count, 0) + 
         COALESCE(p.posts_count, 0) * 2 + 
         COALESCE(c.comments_count, 0)) AS total_activity_score
    FROM users u
    LEFT JOIN (
        SELECT user_id, COUNT(*) AS login_count
        FROM user_logins 
        WHERE login_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY user_id
    ) l ON u.id = l.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) AS posts_count
        FROM posts 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY user_id
    ) p ON u.id = p.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) AS comments_count
        FROM comments 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY user_id
    ) c ON u.id = c.user_id
) subquery;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX user_activity_summary_user_id_idx 
ON user_activity_summary(user_id);

-- Refresh hourly
REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
```

### Example 3: Financial Reporting

```sql
-- Quarterly financial summary
CREATE MATERIALIZED VIEW quarterly_revenue AS
SELECT 
    EXTRACT(YEAR FROM invoice_date) AS year,
    EXTRACT(QUARTER FROM invoice_date) AS quarter,
    department,
    SUM(amount) AS total_revenue,
    COUNT(*) AS invoice_count,
    AVG(amount) AS avg_invoice_amount
FROM invoices
WHERE invoice_date >= '2020-01-01'
GROUP BY 
    EXTRACT(YEAR FROM invoice_date),
    EXTRACT(QUARTER FROM invoice_date),
    department;

-- Composite unique index
CREATE UNIQUE INDEX quarterly_revenue_year_quarter_dept_idx 
ON quarterly_revenue(year, quarter, department);

-- Refresh quarterly
REFRESH MATERIALIZED VIEW CONCURRENTLY quarterly_revenue;
```

## Refresh Strategies and Scheduling

### 1. Scheduled Refresh with pg_cron

```sql
-- Install pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily refresh at 2 AM
SELECT cron.schedule(
    'refresh-daily-sales',
    '0 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;'
);

-- Schedule hourly refresh during business hours
SELECT cron.schedule(
    'refresh-user-activity',
    '0 9-17 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;'
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule a job
SELECT cron.unschedule('refresh-daily-sales');
```

### 2. Application-Level Scheduling

```sql
-- Create a refresh function
CREATE OR REPLACE FUNCTION refresh_reporting_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_product_sales;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
    
    -- Log refresh completion
    INSERT INTO refresh_log (view_name, refreshed_at, status)
    VALUES ('reporting_views', NOW(), 'success');
    
EXCEPTION WHEN OTHERS THEN
    INSERT INTO refresh_log (view_name, refreshed_at, status, error_message)
    VALUES ('reporting_views', NOW(), 'failed', SQLERRM);
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Create log table
CREATE TABLE refresh_log (
    id SERIAL PRIMARY KEY,
    view_name VARCHAR(100) NOT NULL,
    refreshed_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT
);
```

### 3. Conditional Refresh

```sql
-- Refresh only if data has changed
CREATE OR REPLACE FUNCTION smart_refresh_daily_sales()
RETURNS void AS $$
DECLARE
    last_refresh TIMESTAMP;
    latest_data TIMESTAMP;
BEGIN
    -- Get last refresh time
    SELECT refreshed_at INTO last_refresh
    FROM refresh_log 
    WHERE view_name = 'daily_sales' 
      AND status = 'success'
    ORDER BY refreshed_at DESC 
    LIMIT 1;
    
    -- Get latest data timestamp
    SELECT MAX(order_date) INTO latest_data
    FROM orders;
    
    -- Refresh only if new data exists
    IF latest_data > last_refresh OR last_refresh IS NULL THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;
        
        INSERT INTO refresh_log (view_name, refreshed_at, status)
        VALUES ('daily_sales', NOW(), 'success');
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## Monitoring Refresh Operations

### 1. Check Refresh Progress

```sql
-- View active refresh operations
SELECT 
    pid,
    state,
    query,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE query LIKE '%REFRESH MATERIALIZED VIEW%'
  AND state != 'idle';
```

### 2. Monitor Refresh Performance

```sql
-- Create monitoring table
CREATE TABLE mv_refresh_stats (
    view_name VARCHAR(100) NOT NULL,
    refresh_start TIMESTAMP NOT NULL,
    refresh_end TIMESTAMP,
    duration_seconds NUMERIC,
    concurrent BOOLEAN DEFAULT FALSE,
    rows_affected BIGINT,
    success BOOLEAN
);

-- Function to log refresh stats
CREATE OR REPLACE FUNCTION log_mv_refresh(
    p_view_name VARCHAR(100),
    p_concurrent BOOLEAN DEFAULT FALSE
)
RETURNS void AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    row_count BIGINT;
BEGIN
    start_time := clock_timestamp();
    
    -- Perform refresh
    IF p_concurrent THEN
        EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || p_view_name;
    ELSE
        EXECUTE 'REFRESH MATERIALIZED VIEW ' || p_view_name;
    END IF;
    
    end_time := clock_timestamp();
    
    -- Get row count
    EXECUTE 'SELECT COUNT(*) FROM ' || p_view_name INTO row_count;
    
    -- Log statistics
    INSERT INTO mv_refresh_stats (
        view_name, refresh_start, refresh_end, 
        duration_seconds, concurrent, rows_affected, success
    ) VALUES (
        p_view_name, start_time, end_time,
        EXTRACT(EPOCH FROM (end_time - start_time)),
        p_concurrent, row_count, TRUE
    );
    
EXCEPTION WHEN OTHERS THEN
    INSERT INTO mv_refresh_stats (
        view_name, refresh_start, refresh_end,
        duration_seconds, concurrent, success
    ) VALUES (
        p_view_name, start_time, clock_timestamp(),
        EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
        p_concurrent, FALSE
    );
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT log_mv_refresh('daily_sales', TRUE);
```

### 3. Refresh History Query

```sql
-- Query refresh statistics
SELECT 
    view_name,
    DATE(refresh_start) AS refresh_date,
    COUNT(*) AS refresh_count,
    AVG(duration_seconds) AS avg_duration_seconds,
    MAX(duration_seconds) AS max_duration_seconds,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful_refreshes
FROM mv_refresh_stats
WHERE refresh_start >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY view_name, DATE(refresh_start)
ORDER BY view_name, refresh_date;
```

## Best Practices

### 1. Choose Refresh Strategy

```sql
-- For low-traffic times: Standard refresh (faster)
REFRESH MATERIALIZED VIEW daily_sales;

-- For high-traffic times: Concurrent refresh (non-blocking)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;
```

### 2. Create Appropriate Indexes

```sql
-- Always create unique index for concurrent refresh capability
CREATE UNIQUE INDEX mv_sales_summary_date_product_idx 
ON sales_summary(sale_date, product_id);

-- Create additional indexes for common queries
CREATE INDEX mv_sales_summary_date_idx ON sales_summary(sale_date);
CREATE INDEX mv_sales_summary_product_idx ON sales_summary(product_id);
```

### 3. Handle Large Materialized Views

```sql
-- For very large materialized views, consider:
-- 1. Partitioning the underlying data
-- 2. Incremental refresh strategies
-- 3. Breaking into smaller materialized views

-- Example: Partition by date range
CREATE MATERIALIZED VIEW recent_sales AS
SELECT * FROM sales_summary 
WHERE sale_date >= CURRENT_DATE - INTERVAL '90 days';

CREATE MATERIALIZED VIEW historical_sales AS
SELECT * FROM sales_summary 
WHERE sale_date < CURRENT_DATE - INTERVAL '90 days';
```

### 4. Error Handling

```sql
-- Robust refresh with retry logic
CREATE OR REPLACE FUNCTION refresh_with_retry(
    p_view_name VARCHAR(100),
    p_max_retries INTEGER DEFAULT 3
)
RETURNS void AS $$
DECLARE
    retry_count INTEGER := 0;
BEGIN
    LOOP
        BEGIN
            EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || p_view_name;
            EXIT; -- Success, exit loop
        EXCEPTION 
            WHEN lock_not_available OR deadlock_detected THEN
                retry_count := retry_count + 1;
                IF retry_count >= p_max_retries THEN
                    RAISE; -- Re-raise the exception
                END IF;
                PERFORM pg_sleep(retry_count * 5); -- Wait before retry
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Common Issues and Solutions

### 1. "Cannot refresh concurrently without unique index"

```sql
-- Error: cannot refresh materialized view "sales_summary" concurrently
-- Solution: Add unique index
CREATE UNIQUE INDEX sales_summary_unique_idx ON sales_summary(id);
```

### 2. Long-Running Refresh Blocking Queries

```sql
-- Monitor blocking
SELECT 
    blocking_pid,
    blocked_pid,
    blocking_query,
    blocked_query
FROM pg_blocking_pids() b
JOIN pg_stat_activity ba ON b.blocking_pid = ba.pid
JOIN pg_stat_activity bl ON b.blocked_pid = bl.pid;

-- Kill blocking query if necessary (be careful!)
SELECT pg_terminate_backend(blocking_pid);
```

### 3. Out of Disk Space During Refresh

```sql
-- Monitor disk usage during refresh
SELECT 
    schemaname,
    matviewname,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS size
FROM pg_matviews
ORDER BY pg_total_relation_size(schemaname||'.'||matviewname) DESC;
```

## Performance Tips

1. **Use CONCURRENTLY for production systems** to avoid blocking reads
2. **Create appropriate indexes** before the first concurrent refresh
3. **Schedule refreshes during low-traffic periods** when possible
4. **Monitor refresh duration** and optimize underlying queries
5. **Consider incremental refresh patterns** for very large datasets
6. **Use transactions** when refreshing multiple related views
7. **Test refresh procedures** in development environments first

## Summary

Refreshing materialized views in PostgreSQL:
- **Standard refresh**: `REFRESH MATERIALIZED VIEW view_name;` (blocking, faster)
- **Concurrent refresh**: `REFRESH MATERIALIZED VIEW CONCURRENTLY view_name;` (non-blocking, requires unique index)
- **Schedule refreshes** using pg_cron or application logic
- **Monitor performance** and handle errors appropriately
- **Choose the right strategy** based on data size, update frequency, and availability requirements

The key is balancing data freshness with system performance and availability.