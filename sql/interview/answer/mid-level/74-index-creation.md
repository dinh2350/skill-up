# How Do You Create an Index?

Creating indexes in PostgreSQL involves various syntax options and configurations depending on the index type, columns, and specific requirements. This comprehensive guide covers all aspects of index creation, from basic syntax to advanced techniques for different scenarios.

## Basic Index Creation Syntax

### 1. Standard B-tree Index (Default)

```sql
-- Basic syntax
CREATE INDEX index_name ON table_name (column_name);

-- Practical examples
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    region VARCHAR(50)
);

-- Single column index
CREATE INDEX idx_customers_email ON customers (email);

-- Multiple single-column indexes
CREATE INDEX idx_customers_phone ON customers (phone);
CREATE INDEX idx_customers_status ON customers (status);
CREATE INDEX idx_customers_region ON customers (region);

-- Check created indexes
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename = 'customers'
AND schemaname = 'public'
ORDER BY indexname;
```

### 2. Composite (Multi-Column) Indexes

```sql
-- Multi-column index syntax
CREATE INDEX index_name ON table_name (column1, column2, column3);

-- Practical composite indexes
CREATE INDEX idx_customers_name ON customers (last_name, first_name);
CREATE INDEX idx_customers_region_status ON customers (region, status);
CREATE INDEX idx_customers_status_created ON customers (status, created_at);

-- Order matters in composite indexes!
-- This index supports queries filtering on:
-- 1. region only
-- 2. region + status
-- 3. region + status + created_at
CREATE INDEX idx_customers_region_status_date ON customers (region, status, created_at);

-- Examples of queries that use the composite index effectively
-- ✅ Can use index efficiently
SELECT * FROM customers WHERE region = 'North';
SELECT * FROM customers WHERE region = 'North' AND status = 'active';
SELECT * FROM customers WHERE region = 'North' AND status = 'active' AND created_at >= '2024-01-01';

-- ❌ Cannot use index efficiently (violates leftmost prefix rule)
SELECT * FROM customers WHERE status = 'active';  -- Skips first column
SELECT * FROM customers WHERE created_at >= '2024-01-01';  -- Skips first two columns
```

### 3. Sorting and Direction Options

```sql
-- Index with sort order specifications
CREATE INDEX idx_customers_created_desc ON customers (created_at DESC);
CREATE INDEX idx_customers_name_mixed ON customers (last_name ASC, first_name DESC);

-- NULLS positioning
CREATE INDEX idx_customers_phone_nulls_last ON customers (phone NULLS LAST);
CREATE INDEX idx_customers_phone_nulls_first ON customers (phone NULLS FIRST);

-- Combined sorting options
CREATE INDEX idx_customers_complex_sort ON customers (
    region ASC NULLS FIRST,
    status ASC NULLS LAST,
    created_at DESC NULLS LAST
);

-- Queries that benefit from sort optimization
SELECT * FROM customers
WHERE region = 'North'
ORDER BY created_at DESC
LIMIT 10;  -- Uses idx_customers_created_desc efficiently

SELECT * FROM customers
ORDER BY last_name ASC, first_name DESC
LIMIT 20;  -- Uses idx_customers_name_mixed for sorting
```

## Specialized Index Types

### 1. Hash Indexes

```sql
-- Hash index for equality-only operations
CREATE INDEX USING hash index_name ON table_name (column_name);

-- Practical hash index examples
CREATE TABLE user_sessions (
    session_id VARCHAR(128) NOT NULL,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Hash indexes for exact lookup operations
CREATE INDEX USING hash idx_sessions_id ON user_sessions (session_id);
CREATE INDEX USING hash idx_sessions_user_id ON user_sessions (user_id);

-- Hash indexes are optimal for these query patterns:
SELECT * FROM user_sessions WHERE session_id = 'abc123def456ghi789';
SELECT * FROM user_sessions WHERE user_id = 12345;

-- ❌ Hash indexes do NOT support:
-- Range queries: WHERE user_id > 1000
-- Sorting: ORDER BY user_id
-- Pattern matching: WHERE session_id LIKE 'abc%'
```

### 2. GIN Indexes (Generalized Inverted Index)

```sql
-- GIN indexes for complex data types
CREATE INDEX USING gin index_name ON table_name USING GIN (column_name);

-- Array data indexing
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    tags TEXT[],
    categories TEXT[],
    features JSONB,
    search_vector tsvector
);

-- GIN indexes for arrays
CREATE INDEX USING gin idx_products_tags ON products USING GIN (tags);
CREATE INDEX USING gin idx_products_categories ON products USING GIN (categories);

-- GIN indexes for JSONB
CREATE INDEX USING gin idx_products_features ON products USING GIN (features);

-- GIN index for full-text search
CREATE INDEX USING gin idx_products_search ON products USING GIN (search_vector);

-- Alternative: Create tsvector index on-the-fly
CREATE INDEX USING gin idx_products_fulltext ON products
USING GIN (to_tsvector('english', name || ' ' || description));

-- Queries optimized by GIN indexes
-- Array containment
SELECT * FROM products WHERE tags @> ARRAY['electronics', 'mobile'];
SELECT * FROM products WHERE tags && ARRAY['laptop', 'computer'];

-- JSONB queries
SELECT * FROM products WHERE features @> '{"color": "red"}';
SELECT * FROM products WHERE features ? 'warranty';
SELECT * FROM products WHERE features ?& ARRAY['color', 'size'];

-- Full-text search
SELECT * FROM products
WHERE to_tsvector('english', name || ' ' || description) @@ to_tsquery('laptop & wireless');
```

### 3. GiST Indexes (Generalized Search Tree)

```sql
-- GiST indexes for geometric and range data
CREATE INDEX USING gist index_name ON table_name USING GIST (column_name);

-- Geometric data (requires PostGIS extension)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    coordinates GEOMETRY(POINT, 4326),
    service_area GEOMETRY(POLYGON, 4326),
    elevation INTEGER
);

-- GiST index for geometric operations
CREATE INDEX USING gist idx_locations_coordinates ON locations USING GIST (coordinates);
CREATE INDEX USING gist idx_locations_service_area ON locations USING GIST (service_area);

-- Range type indexing
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER,
    booking_period daterange,
    time_slot tsrange,
    customer_id INTEGER
);

-- GiST indexes for range operations
CREATE INDEX USING gist idx_bookings_period ON bookings USING GIST (booking_period);
CREATE INDEX USING gist idx_bookings_time ON bookings USING GIST (time_slot);

-- Text search (alternative to GIN)
CREATE INDEX USING gist idx_products_text_gist ON products USING GIST (to_tsvector('english', description));

-- Queries optimized by GiST indexes
-- Geometric queries
SELECT * FROM locations
WHERE ST_DWithin(coordinates, ST_GeomFromText('POINT(-122.4194 37.7749)', 4326), 1000);

-- Range overlap queries
SELECT * FROM bookings
WHERE booking_period && '[2024-12-20,2024-12-30)'::daterange;

SELECT * FROM bookings
WHERE time_slot @> '2024-12-25 14:00'::timestamp;
```

### 4. BRIN Indexes (Block Range Index)

```sql
-- BRIN indexes for large, naturally ordered datasets
CREATE INDEX USING brin index_name ON table_name (column_name);

-- Time-series data table
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INTEGER,
    timestamp TIMESTAMP,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    pressure DECIMAL(7,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BRIN indexes for naturally ordered columns
CREATE INDEX USING brin idx_readings_timestamp ON sensor_readings (timestamp);
CREATE INDEX USING brin idx_readings_id ON sensor_readings (id);

-- BRIN with custom pages_per_range
CREATE INDEX USING brin idx_readings_sensor_custom ON sensor_readings (sensor_id)
WITH (pages_per_range = 128);

-- Multi-column BRIN index
CREATE INDEX USING brin idx_readings_sensor_time ON sensor_readings (sensor_id, timestamp);

-- Check column correlation (important for BRIN effectiveness)
SELECT
    tablename,
    attname,
    correlation,
    CASE
        WHEN ABS(correlation) > 0.9 THEN 'Excellent for BRIN'
        WHEN ABS(correlation) > 0.7 THEN 'Good for BRIN'
        WHEN ABS(correlation) > 0.5 THEN 'Moderate for BRIN'
        ELSE 'Poor for BRIN'
    END as brin_suitability
FROM pg_stats
WHERE tablename = 'sensor_readings'
AND attname IN ('timestamp', 'id', 'sensor_id');

-- Queries optimized by BRIN indexes
SELECT AVG(temperature)
FROM sensor_readings
WHERE timestamp BETWEEN '2024-01-01' AND '2024-01-31';

SELECT sensor_id, COUNT(*)
FROM sensor_readings
WHERE id BETWEEN 1000000 AND 2000000
GROUP BY sensor_id;
```

## Advanced Index Creation Options

### 1. Partial Indexes

```sql
-- Partial indexes with WHERE clauses
CREATE INDEX index_name ON table_name (column_name) WHERE condition;

-- Practical partial index examples
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    order_date DATE,
    cancelled_at TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE
);

-- Index only active orders
CREATE INDEX idx_orders_active_customer ON orders (customer_id)
WHERE status NOT IN ('cancelled', 'refunded');

-- Index recent orders only
CREATE INDEX idx_orders_recent ON orders (order_date, total_amount)
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days';

-- Index unprocessed orders
CREATE INDEX idx_orders_unprocessed ON orders (customer_id, order_date)
WHERE is_processed = FALSE;

-- Index high-value orders
CREATE INDEX idx_orders_high_value ON orders (customer_id, order_date)
WHERE total_amount > 1000;

-- Complex partial index conditions
CREATE INDEX idx_orders_complex_partial ON orders (customer_id, total_amount)
WHERE status = 'active'
AND total_amount > 100
AND order_date >= '2024-01-01'
AND cancelled_at IS NULL;

-- Partial unique indexes
CREATE INDEX idx_orders_unique_processing ON orders (customer_id)
WHERE status = 'processing';  -- Only one processing order per customer
```

### 2. Expression Indexes (Functional Indexes)

```sql
-- Expression indexes on computed values
CREATE INDEX index_name ON table_name (expression);

-- Case-insensitive text indexing
CREATE INDEX idx_customers_email_lower ON customers (LOWER(email));
CREATE INDEX idx_customers_name_full ON customers (first_name || ' ' || last_name);

-- Date part extraction
CREATE INDEX idx_orders_year ON orders (EXTRACT(YEAR FROM order_date));
CREATE INDEX idx_orders_month_year ON orders (
    EXTRACT(YEAR FROM order_date),
    EXTRACT(MONTH FROM order_date)
);

-- Mathematical expressions
CREATE INDEX idx_orders_total_with_tax ON orders ((total_amount * 1.08));
CREATE INDEX idx_orders_profit ON orders ((total_amount - cost_amount));

-- JSON path extraction
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_data JSONB
);

CREATE INDEX idx_profiles_city ON user_profiles ((user_data->>'city'));
CREATE INDEX idx_profiles_age ON user_profiles (((user_data->>'age')::INTEGER));

-- Text processing expressions
CREATE INDEX idx_customers_phone_digits ON customers (REGEXP_REPLACE(phone, '[^0-9]', '', 'g'));

-- Complex expressions
CREATE INDEX idx_customers_score ON customers (
    CASE
        WHEN status = 'premium' THEN 100
        WHEN status = 'active' THEN 50
        ELSE 10
    END
);

-- Expression indexes with custom functions
CREATE OR REPLACE FUNCTION normalize_email(email_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(TRIM(email_text));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE INDEX idx_customers_email_normalized ON customers (normalize_email(email));
```

### 3. Covering Indexes (INCLUDE clause)

```sql
-- Covering indexes include extra columns for index-only scans
CREATE INDEX index_name ON table_name (key_columns) INCLUDE (additional_columns);

-- Basic covering index
CREATE INDEX idx_customers_email_covering ON customers (email)
INCLUDE (first_name, last_name, phone);

-- Multi-column key with covering
CREATE INDEX idx_orders_customer_date_covering ON orders (customer_id, order_date)
INCLUDE (total_amount, status);

-- Partial covering index
CREATE INDEX idx_orders_active_covering ON orders (customer_id)
INCLUDE (order_date, total_amount, status)
WHERE status = 'active';

-- Expression key with covering
CREATE INDEX idx_customers_name_lower_covering ON customers (LOWER(last_name))
INCLUDE (first_name, email, phone);

-- Verify index-only scan usage
EXPLAIN (ANALYZE, BUFFERS)
SELECT first_name, last_name, phone
FROM customers
WHERE email = 'john.doe@example.com';
-- Should show "Index Only Scan" with covering index
```

### 4. Unique Indexes

```sql
-- Unique indexes enforce uniqueness constraints
CREATE UNIQUE INDEX index_name ON table_name (column_name);

-- Single column unique indexes
CREATE UNIQUE INDEX idx_customers_email_unique ON customers (email);
CREATE UNIQUE INDEX idx_customers_phone_unique ON customers (phone);

-- Composite unique indexes
CREATE TABLE user_roles (
    user_id INTEGER,
    role_id INTEGER,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX idx_user_roles_unique ON user_roles (user_id, role_id);

-- Conditional unique indexes
CREATE UNIQUE INDEX idx_user_roles_active_unique ON user_roles (user_id, role_id)
WHERE is_active = TRUE;

-- Expression-based unique indexes
CREATE UNIQUE INDEX idx_customers_email_case_insensitive ON customers (LOWER(email));

-- Unique partial indexes
CREATE UNIQUE INDEX idx_orders_processing_unique ON orders (customer_id)
WHERE status = 'processing';
```

## Index Creation Options and Parameters

### 1. Storage Parameters

```sql
-- Index creation with storage parameters
CREATE INDEX index_name ON table_name (column_name)
WITH (storage_parameter = value);

-- Common storage parameters for B-tree indexes
CREATE INDEX idx_customers_email_custom ON customers (email)
WITH (fillfactor = 90);

-- BRIN specific parameters
CREATE INDEX USING brin idx_readings_custom ON sensor_readings (timestamp)
WITH (pages_per_range = 64, autosummarize = on);

-- GIN specific parameters
CREATE INDEX USING gin idx_products_tags_custom ON products USING GIN (tags)
WITH (fastupdate = on, gin_pending_list_limit = 4096);

-- Hash index parameters
CREATE INDEX USING hash idx_sessions_hash_custom ON user_sessions (session_id)
WITH (fillfactor = 75);
```

### 2. Tablespace Specification

```sql
-- Create index in specific tablespace
CREATE INDEX index_name ON table_name (column_name) TABLESPACE tablespace_name;

-- Example (assuming tablespace exists)
-- CREATE INDEX idx_customers_email_ssd ON customers (email) TABLESPACE ssd_indexes;

-- List available tablespaces
SELECT spcname, spcoptions FROM pg_tablespace;
```

### 3. Concurrent Index Creation

```sql
-- Create index without blocking concurrent operations
CREATE INDEX CONCURRENTLY index_name ON table_name (column_name);

-- Concurrent index creation examples
CREATE INDEX CONCURRENTLY idx_customers_region_concurrent ON customers (region);
CREATE INDEX CONCURRENTLY idx_orders_date_concurrent ON orders (order_date);

-- Check for failed concurrent index creation
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE
        WHEN indisvalid THEN 'VALID'
        ELSE 'INVALID - Creation failed'
    END as status
FROM pg_indexes
JOIN pg_index ON indexrelid = (schemaname||'.'||indexname)::regclass
WHERE indexname LIKE '%concurrent%';

-- Clean up invalid indexes if creation failed
-- DROP INDEX CONCURRENTLY invalid_index_name;
```

## Complete Index Creation Examples

### 1. E-commerce Database

```sql
-- Comprehensive e-commerce indexing strategy
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category_id INTEGER,
    brand_id INTEGER,
    tags TEXT[],
    attributes JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Primary access patterns indexes
CREATE UNIQUE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_category ON products (category_id) WHERE is_active = TRUE;
CREATE INDEX idx_products_brand ON products (brand_id) WHERE is_active = TRUE;
CREATE INDEX idx_products_price ON products (price) WHERE is_active = TRUE;

-- Search and filtering indexes
CREATE INDEX USING gin idx_products_tags ON products USING GIN (tags);
CREATE INDEX USING gin idx_products_attributes ON products USING GIN (attributes);
CREATE INDEX USING gin idx_products_search ON products
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Composite indexes for common query patterns
CREATE INDEX idx_products_category_price ON products (category_id, price)
WHERE is_active = TRUE;
CREATE INDEX idx_products_brand_category ON products (brand_id, category_id)
WHERE is_active = TRUE;

-- Covering indexes for catalog display
CREATE INDEX idx_products_catalog_covering ON products (category_id, price)
INCLUDE (name, sku, brand_id)
WHERE is_active = TRUE;

-- Time-based indexes
CREATE INDEX idx_products_created_recent ON products (created_at)
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

### 2. User Management System

```sql
-- User management with comprehensive indexing
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    profile_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    failed_login_count INTEGER DEFAULT 0
);

-- Authentication indexes
CREATE UNIQUE INDEX idx_users_username_lower ON users (LOWER(username));
CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_users_phone ON users (phone) WHERE phone IS NOT NULL;

-- Security and access control
CREATE INDEX idx_users_active ON users (is_active, email_verified);
CREATE INDEX idx_users_failed_logins ON users (failed_login_count)
WHERE failed_login_count > 0;

-- Profile and search indexes
CREATE INDEX USING gin idx_users_profile ON users USING GIN (profile_data);
CREATE INDEX idx_users_name_search ON users
USING GIN (to_tsvector('english', first_name || ' ' || last_name));

-- Activity tracking
CREATE INDEX idx_users_last_login ON users (last_login_at)
WHERE last_login_at IS NOT NULL;
CREATE INDEX idx_users_recent_activity ON users (last_login_at)
WHERE last_login_at >= CURRENT_DATE - INTERVAL '30 days';

-- Covering indexes for user listings
CREATE INDEX idx_users_list_covering ON users (last_name, first_name)
INCLUDE (username, email, is_active, created_at)
WHERE is_active = TRUE;
```

### 3. Analytics and Reporting

```sql
-- Analytics table with time-series characteristics
CREATE TABLE user_analytics (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(128),
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT
);

-- Time-based indexes (BRIN for large tables)
CREATE INDEX USING brin idx_analytics_timestamp ON user_analytics (timestamp);
CREATE INDEX USING brin idx_analytics_user_time ON user_analytics (user_id, timestamp);

-- Event analysis indexes
CREATE INDEX idx_analytics_event_type ON user_analytics (event_type, timestamp);
CREATE INDEX idx_analytics_user_event ON user_analytics (user_id, event_type);

-- Session tracking
CREATE INDEX USING hash idx_analytics_session ON user_analytics (session_id);

-- JSON analytics
CREATE INDEX USING gin idx_analytics_event_data ON user_analytics USING GIN (event_data);

-- Composite indexes for common analytics queries
CREATE INDEX idx_analytics_user_type_time ON user_analytics (user_id, event_type, timestamp);
CREATE INDEX idx_analytics_daily_events ON user_analytics (
    DATE_TRUNC('day', timestamp),
    event_type
);

-- Covering index for event summaries
CREATE INDEX idx_analytics_summary_covering ON user_analytics (
    user_id,
    DATE_TRUNC('day', timestamp)
) INCLUDE (event_type, session_id);
```

## Index Creation Best Practices

### 1. Naming Conventions

```sql
-- Consistent index naming conventions
-- Pattern: idx_tablename_columns_[type]_[condition]

-- Basic indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_orders_customer_id ON orders (customer_id);

-- Composite indexes
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);
CREATE INDEX idx_products_category_price ON products (category_id, price);

-- Unique indexes
CREATE UNIQUE INDEX idx_users_username_unique ON users (username);
CREATE UNIQUE INDEX idx_products_sku_unique ON products (sku);

-- Partial indexes
CREATE INDEX idx_orders_active_customer ON orders (customer_id) WHERE status = 'active';
CREATE INDEX idx_users_recent_login ON users (last_login_at) WHERE last_login_at >= CURRENT_DATE - INTERVAL '30 days';

-- Expression indexes
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_products_search_text ON products USING GIN (to_tsvector('english', name));

-- Type-specific indexes
CREATE INDEX USING gin idx_products_tags_gin ON products USING GIN (tags);
CREATE INDEX USING hash idx_sessions_hash ON user_sessions (session_id);
CREATE INDEX USING brin idx_logs_timestamp_brin ON application_logs (timestamp);
```

### 2. Index Creation Workflow

```sql
-- Step-by-step index creation process
-- 1. Analyze query patterns
-- 2. Design index strategy
-- 3. Create indexes with proper options
-- 4. Verify index usage
-- 5. Monitor performance

-- Example workflow for a new table
CREATE TABLE example_workflow (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    category VARCHAR(50),
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20)
);

-- Step 1: Create basic indexes for known query patterns
CREATE INDEX idx_workflow_user ON example_workflow (user_id);
CREATE INDEX idx_workflow_category ON example_workflow (category);
CREATE INDEX idx_workflow_created ON example_workflow (created_at);

-- Step 2: Add composite indexes for multi-column queries
CREATE INDEX idx_workflow_user_status ON example_workflow (user_id, status);
CREATE INDEX idx_workflow_category_amount ON example_workflow (category, amount);

-- Step 3: Add specialized indexes as needed
CREATE INDEX idx_workflow_recent ON example_workflow (created_at)
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

-- Step 4: Verify index usage
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM example_workflow
WHERE user_id = 123 AND status = 'active';

-- Step 5: Monitor and adjust
SELECT
    indexname,
    idx_scan,
    idx_tup_read,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE tablename = 'example_workflow';
```

### 3. Error Handling and Troubleshooting

```sql
-- Handle common index creation errors and issues

-- Check for existing indexes before creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'customers'
        AND indexname = 'idx_customers_email'
    ) THEN
        CREATE INDEX idx_customers_email ON customers (email);
        RAISE NOTICE 'Index idx_customers_email created successfully';
    ELSE
        RAISE NOTICE 'Index idx_customers_email already exists';
    END IF;
END $$;

-- Create index with error handling
DO $$
BEGIN
    BEGIN
        CREATE INDEX CONCURRENTLY idx_large_table_column ON large_table (column_name);
        RAISE NOTICE 'Concurrent index created successfully';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'Index creation failed: %', SQLERRM;
    END;
END $$;

-- Check for invalid indexes (failed concurrent creation)
SELECT
    schemaname,
    tablename,
    indexname,
    CASE
        WHEN indisvalid THEN 'VALID'
        ELSE 'INVALID - Needs cleanup'
    END as status,
    pg_get_indexdef(indexrelid) as definition
FROM pg_indexes
JOIN pg_index ON indexrelid = (schemaname||'.'||indexname)::regclass
WHERE NOT indisvalid;

-- Function to safely create indexes
CREATE OR REPLACE FUNCTION safe_create_index(
    index_name TEXT,
    table_name TEXT,
    columns TEXT,
    index_type TEXT DEFAULT 'btree',
    concurrent BOOLEAN DEFAULT TRUE
)
RETURNS TEXT AS $$
DECLARE
    sql_command TEXT;
    result TEXT;
BEGIN
    -- Check if index already exists
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name) THEN
        RETURN 'Index ' || index_name || ' already exists';
    END IF;

    -- Build SQL command
    sql_command := 'CREATE INDEX';

    IF concurrent THEN
        sql_command := sql_command || ' CONCURRENTLY';
    END IF;

    sql_command := sql_command || ' ' || index_name || ' ON ' || table_name;

    IF index_type != 'btree' THEN
        sql_command := sql_command || ' USING ' || index_type;
    END IF;

    sql_command := sql_command || ' (' || columns || ')';

    -- Execute command
    BEGIN
        EXECUTE sql_command;
        result := 'Index ' || index_name || ' created successfully';
    EXCEPTION WHEN others THEN
        result := 'Failed to create index ' || index_name || ': ' || SQLERRM;
    END;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Usage examples
SELECT safe_create_index('idx_test_column', 'test_table', 'column_name');
SELECT safe_create_index('idx_test_gin', 'test_table', 'json_column', 'gin');
```

## Summary

**Index creation in PostgreSQL** involves multiple syntax options and considerations:

**🔧 Basic Syntax:**

```sql
-- Standard: CREATE INDEX idx_name ON table (column);
-- Unique: CREATE UNIQUE INDEX idx_name ON table (column);
-- Partial: CREATE INDEX idx_name ON table (column) WHERE condition;
-- Covering: CREATE INDEX idx_name ON table (key) INCLUDE (data);
-- Concurrent: CREATE INDEX CONCURRENTLY idx_name ON table (column);
```

**🎯 Index Types:**

- **B-tree** (default): General purpose, ranges, sorting
- **Hash**: Equality operations only
- **GIN**: Arrays, JSONB, full-text search
- **GiST**: Geometric data, ranges, custom types
- **BRIN**: Large ordered datasets, time-series

**⚡ Advanced Options:**

- **Expression indexes**: Function-based indexing
- **Partial indexes**: Conditional indexing with WHERE
- **Composite indexes**: Multi-column indexing
- **Storage parameters**: Custom configuration options
- **Concurrent creation**: Non-blocking index creation

**📋 Best Practices:**

- **Consistent naming conventions**: `idx_table_column_type`
- **Analyze query patterns** before creating indexes
- **Use appropriate index types** for data characteristics
- **Monitor index usage** and remove unused indexes
- **Plan maintenance windows** for large index operations
- **Handle errors gracefully** with proper exception handling

**🔍 Key Considerations:**

- **Column order matters** in composite indexes (leftmost prefix rule)
- **Concurrent creation** avoids blocking but has limitations
- **Storage overhead** vs. performance benefits
- **Maintenance requirements** for long-term health

Successful index creation requires understanding both the technical syntax options and the strategic considerations for optimal database performance.
