# What is a Unique Index?

A **unique index** is a special type of database index that enforces uniqueness constraints on the indexed column(s), ensuring that no two rows can have the same value(s) in the indexed column(s). Unlike regular indexes that only optimize query performance, unique indexes serve a dual purpose: they both accelerate queries **and** maintain data integrity by preventing duplicate values.

## Basic Concept and Syntax

```sql
-- Basic unique index syntax
CREATE UNIQUE INDEX index_name ON table_name (column_name);

-- Examples of unique indexes
-- Single column uniqueness
CREATE UNIQUE INDEX idx_unique_email ON users (email);

-- Multi-column uniqueness
CREATE UNIQUE INDEX idx_unique_user_role ON user_roles (user_id, role_id);

-- Unique index with WHERE clause (partial unique index)
CREATE UNIQUE INDEX idx_unique_active_username ON users (username)
WHERE is_active = TRUE;

-- Expression-based unique index
CREATE UNIQUE INDEX idx_unique_email_lower ON users (LOWER(email));
```

## How Unique Indexes Work

### Uniqueness Enforcement

```sql
-- Sample table for demonstration
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on email
CREATE UNIQUE INDEX idx_unique_email ON users (email);

-- Successful inserts
INSERT INTO users (username, email, phone) VALUES
('john_doe', 'john@example.com', '555-0101'),
('jane_smith', 'jane@example.com', '555-0102');

-- This will succeed
INSERT INTO users (username, email, phone) VALUES
('bob_wilson', 'bob@example.com', '555-0103');

-- This will FAIL due to unique constraint violation
INSERT INTO users (username, email, phone) VALUES
('john_duplicate', 'john@example.com', '555-0104');
-- ERROR: duplicate key value violates unique constraint "idx_unique_email"

-- Check constraint violation details
SELECT
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'users' AND tc.constraint_type = 'UNIQUE';
```

### Difference from Regular Indexes

```sql
-- Regular index (allows duplicates)
CREATE INDEX idx_regular_username ON users (username);

-- Unique index (prevents duplicates)
CREATE UNIQUE INDEX idx_unique_username ON users (username);

-- Both indexes can be used for query optimization
EXPLAIN SELECT * FROM users WHERE username = 'john_doe';

-- But only the unique index enforces uniqueness
INSERT INTO users (username, email) VALUES ('john_doe', 'john2@example.com');
-- This would fail with unique index on username, succeed with regular index

-- Compare index properties
SELECT
    indexname,
    indexdef,
    CASE
        WHEN indexdef LIKE '%UNIQUE%' THEN 'Unique Index'
        ELSE 'Regular Index'
    END as index_type
FROM pg_indexes
WHERE tablename = 'users'
AND indexname LIKE 'idx_%';
```

## Practical Use Cases

### 1. User Account Management

```sql
-- User authentication system
CREATE TABLE user_accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    social_security_number VARCHAR(11),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure unique usernames (case-insensitive)
CREATE UNIQUE INDEX idx_unique_username_lower ON user_accounts (LOWER(username));

-- Ensure unique email addresses (case-insensitive)
CREATE UNIQUE INDEX idx_unique_email_lower ON user_accounts (LOWER(email));

-- Ensure unique phone numbers for active users only
CREATE UNIQUE INDEX idx_unique_active_phone ON user_accounts (phone_number)
WHERE is_active = TRUE AND phone_number IS NOT NULL;

-- Ensure unique SSN for active users (excluding NULL values)
CREATE UNIQUE INDEX idx_unique_active_ssn ON user_accounts (social_security_number)
WHERE is_active = TRUE AND social_security_number IS NOT NULL;

-- Login validation queries
-- Username login (case-insensitive)
SELECT id, username, email FROM user_accounts
WHERE LOWER(username) = LOWER('JohnDoe') AND is_active = TRUE;

-- Email login (case-insensitive)
SELECT id, username, email FROM user_accounts
WHERE LOWER(email) = LOWER('John.Doe@Example.com') AND is_active = TRUE;

-- Registration validation
-- Check if username already exists
SELECT EXISTS(
    SELECT 1 FROM user_accounts
    WHERE LOWER(username) = LOWER('NewUser123')
) as username_exists;

-- Check if email already exists
SELECT EXISTS(
    SELECT 1 FROM user_accounts
    WHERE LOWER(email) = LOWER('newuser@example.com')
) as email_exists;
```

### 2. Business Entity Relationships

```sql
-- Product catalog system
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER,
    manufacturer_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- Unique product SKU (globally unique)
CREATE UNIQUE INDEX idx_unique_product_sku ON products (sku);

-- Unique product name within category
CREATE UNIQUE INDEX idx_unique_product_name_category ON products (name, category_id);

-- Unique active product per manufacturer-sku combination
CREATE UNIQUE INDEX idx_unique_manufacturer_sku ON products (manufacturer_id, sku)
WHERE is_active = TRUE;

-- Inventory management
CREATE TABLE inventory_locations (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL,
    aisle VARCHAR(10) NOT NULL,
    shelf VARCHAR(10) NOT NULL,
    bin VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Unique location within warehouse
CREATE UNIQUE INDEX idx_unique_warehouse_location ON inventory_locations
(warehouse_id, aisle, shelf, bin);

-- Product inventory tracking
CREATE TABLE product_inventory (
    product_id INTEGER NOT NULL REFERENCES products(id),
    location_id INTEGER NOT NULL REFERENCES inventory_locations(id),
    quantity INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique product-location combination
CREATE UNIQUE INDEX idx_unique_product_location ON product_inventory (product_id, location_id);
```

### 3. Role-Based Access Control

```sql
-- User role management system
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL
);

CREATE TABLE user_roles (
    user_id INTEGER NOT NULL REFERENCES user_accounts(id),
    role_id INTEGER NOT NULL REFERENCES roles(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES user_accounts(id),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id),
    permission_id INTEGER NOT NULL REFERENCES permissions(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique indexes for RBAC
CREATE UNIQUE INDEX idx_unique_role_name ON roles (LOWER(name));
CREATE UNIQUE INDEX idx_unique_permission ON permissions (resource, action);
CREATE UNIQUE INDEX idx_unique_user_role ON user_roles (user_id, role_id);
CREATE UNIQUE INDEX idx_unique_role_permission ON role_permissions (role_id, permission_id);

-- Ensure only one active assignment per user-role
CREATE UNIQUE INDEX idx_unique_active_user_role ON user_roles (user_id, role_id)
WHERE is_active = TRUE;

-- RBAC queries
-- Get user permissions
SELECT DISTINCT p.resource, p.action, p.name as permission_name
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = 123 AND ur.is_active = TRUE;

-- Check specific permission
SELECT EXISTS(
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = 123
    AND p.resource = 'orders'
    AND p.action = 'create'
    AND ur.is_active = TRUE
) as has_permission;
```

### 4. Financial Transaction Integrity

```sql
-- Financial transaction system
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    customer_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL,
    from_account_id INTEGER REFERENCES accounts(id),
    to_account_id INTEGER REFERENCES accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending'
);

-- Financial integrity constraints
CREATE UNIQUE INDEX idx_unique_account_number ON accounts (account_number);
CREATE UNIQUE INDEX idx_unique_transaction_id ON transactions (transaction_id);

-- Unique reference number per date (for daily reconciliation)
CREATE UNIQUE INDEX idx_unique_daily_reference ON transactions
(DATE(transaction_date), reference_number)
WHERE reference_number IS NOT NULL;

-- Prevent duplicate transfers (same accounts, amount, within time window)
CREATE UNIQUE INDEX idx_unique_transfer_window ON transactions
(from_account_id, to_account_id, amount, DATE_TRUNC('minute', transaction_date))
WHERE from_account_id IS NOT NULL AND to_account_id IS NOT NULL;

-- Transaction validation
-- Check for duplicate transaction ID before processing
SELECT EXISTS(
    SELECT 1 FROM transactions
    WHERE transaction_id = 'TXN-20241120-001'
) as transaction_exists;

-- Prevent duplicate daily reference numbers
INSERT INTO transactions (transaction_id, from_account_id, to_account_id, amount, reference_number)
VALUES ('TXN-20241120-002', 1, 2, 100.00, 'REF-001');
-- Will fail if reference REF-001 already exists for today
```

## Advanced Unique Index Techniques

### 1. Conditional Uniqueness (Partial Unique Indexes)

```sql
-- E-commerce order system
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20),
    customer_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Only enforce unique order numbers for non-cancelled orders
CREATE UNIQUE INDEX idx_unique_active_order_number ON orders (order_number)
WHERE status != 'cancelled';

-- Allow only one pending order per customer
CREATE UNIQUE INDEX idx_unique_pending_customer_order ON orders (customer_id)
WHERE status = 'pending';

-- Subscription management
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Only one active subscription per user per plan type
CREATE UNIQUE INDEX idx_unique_active_subscription ON subscriptions (user_id, plan_type)
WHERE is_active = TRUE;

-- Historical data integrity - unique start date per user-plan (excluding cancelled)
CREATE UNIQUE INDEX idx_unique_subscription_start ON subscriptions (user_id, plan_type, DATE(started_at))
WHERE ended_at IS NULL;
```

### 2. Multi-Column Composite Unique Indexes

```sql
-- Event scheduling system
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    venue_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    organizer_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled'
);

-- Prevent venue double-booking (same venue, overlapping times)
CREATE UNIQUE INDEX idx_unique_venue_time ON events (venue_id, start_time)
WHERE status IN ('scheduled', 'confirmed');

-- Unique event name per organizer per day
CREATE UNIQUE INDEX idx_unique_organizer_event_daily ON events
(organizer_id, name, DATE(start_time));

-- Project management
CREATE TABLE project_assignments (
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- One user can have only one active role per project
CREATE UNIQUE INDEX idx_unique_project_user_role ON project_assignments
(project_id, user_id)
WHERE is_active = TRUE;

-- Prevent role conflicts - only one person per role per project period
CREATE UNIQUE INDEX idx_unique_project_role_period ON project_assignments
(project_id, role, start_date)
WHERE role IN ('project_manager', 'team_lead') AND is_active = TRUE;
```

### 3. Expression-Based Unique Constraints

```sql
-- Content management system
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    author_id INTEGER NOT NULL,
    category_id INTEGER,
    published_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft'
);

-- Auto-generated unique slug from title (case-insensitive, URL-friendly)
CREATE UNIQUE INDEX idx_unique_article_slug ON articles
(LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')));

-- Unique title per author (case-insensitive)
CREATE UNIQUE INDEX idx_unique_author_title ON articles
(author_id, LOWER(title));

-- Customer data with fuzzy matching prevention
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE
);

-- Prevent similar customer records (normalized names + DOB)
CREATE UNIQUE INDEX idx_unique_customer_identity ON customers (
    LOWER(TRIM(first_name)),
    LOWER(TRIM(last_name)),
    date_of_birth
);

-- Unique email (normalized)
CREATE UNIQUE INDEX idx_unique_customer_email ON customers (LOWER(TRIM(email)));

-- Unique phone (digits only)
CREATE UNIQUE INDEX idx_unique_customer_phone ON customers
(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'))
WHERE phone IS NOT NULL;
```

## Performance and Implementation Considerations

### 1. Index Size and Maintenance

```sql
-- Monitor unique index performance
SELECT
    indexname,
    tablename,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_get_indexdef(indexrelid) as definition,
    CASE
        WHEN pg_get_indexdef(indexrelid) LIKE '%UNIQUE%' THEN 'Unique'
        ELSE 'Regular'
    END as index_type,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes pgsui
JOIN pg_indexes pgi ON pgsui.indexname = pgi.indexname
WHERE pgi.tablename IN ('users', 'products', 'orders')
ORDER BY pg_relation_size(indexrelid) DESC;

-- Analyze unique constraint violations
-- Create a test function to catch violations
CREATE OR REPLACE FUNCTION test_unique_violation()
RETURNS TABLE(
    violation_type TEXT,
    attempted_value TEXT,
    constraint_name TEXT
) AS $$
BEGIN
    -- Test username uniqueness
    BEGIN
        INSERT INTO user_accounts (username, email) VALUES ('test_user', 'test1@example.com');
        INSERT INTO user_accounts (username, email) VALUES ('test_user', 'test2@example.com');
    EXCEPTION WHEN unique_violation THEN
        violation_type := 'Username Duplicate';
        attempted_value := 'test_user';
        constraint_name := 'idx_unique_username_lower';
        RETURN NEXT;
    END;

    -- Cleanup
    DELETE FROM user_accounts WHERE username = 'test_user';
END;
$$ LANGUAGE plpgsql;

-- Test unique constraints
SELECT * FROM test_unique_violation();
```

### 2. NULL Handling in Unique Indexes

```sql
-- Understand NULL behavior in unique indexes
CREATE TABLE test_nulls (
    id SERIAL PRIMARY KEY,
    unique_column VARCHAR(50),
    nullable_column VARCHAR(50)
);

-- Create unique index
CREATE UNIQUE INDEX idx_test_nulls_unique ON test_nulls (unique_column);

-- Multiple NULLs are allowed in unique indexes (SQL standard behavior)
INSERT INTO test_nulls (nullable_column) VALUES
('value1'),  -- unique_column is NULL
('value2'),  -- unique_column is NULL
('value3');  -- unique_column is NULL - all allowed

-- But non-NULL duplicates are prevented
INSERT INTO test_nulls (unique_column, nullable_column) VALUES ('duplicate', 'first');
-- This will fail:
-- INSERT INTO test_nulls (unique_column, nullable_column) VALUES ('duplicate', 'second');

-- To enforce uniqueness including NULLs, use a partial index or constraint
-- Option 1: Partial unique index excluding NULLs
CREATE UNIQUE INDEX idx_test_nulls_no_null ON test_nulls (unique_column)
WHERE unique_column IS NOT NULL;

-- Option 2: Use COALESCE with a unique value for NULLs
CREATE UNIQUE INDEX idx_test_nulls_coalesce ON test_nulls (COALESCE(unique_column, '__NULL__'));

-- Check NULL behavior
SELECT
    unique_column,
    nullable_column,
    CASE
        WHEN unique_column IS NULL THEN 'NULL (allowed multiple times)'
        ELSE 'NOT NULL (must be unique)'
    END as uniqueness_rule
FROM test_nulls;
```

### 3. Unique Index vs. Unique Constraint

```sql
-- Comparison between unique indexes and unique constraints
CREATE TABLE comparison_test (
    id SERIAL PRIMARY KEY,
    email_idx VARCHAR(255),
    email_constraint VARCHAR(255),
    username VARCHAR(100)
);

-- Method 1: Unique Index
CREATE UNIQUE INDEX idx_unique_email_idx ON comparison_test (email_idx);

-- Method 2: Unique Constraint (creates unique index automatically)
ALTER TABLE comparison_test ADD CONSTRAINT uk_email_constraint UNIQUE (email_constraint);

-- Method 3: Unique constraint with custom index name
ALTER TABLE comparison_test ADD CONSTRAINT uk_username
UNIQUE (username) USING INDEX (CREATE UNIQUE INDEX idx_custom_username ON comparison_test (username));

-- Compare the approaches
SELECT
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'comparison_test'
AND tc.constraint_type = 'UNIQUE';

-- Check generated indexes
SELECT
    indexname,
    indexdef,
    'Constraint: ' || (
        SELECT constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = indexname
        LIMIT 1
    ) as related_constraint
FROM pg_indexes
WHERE tablename = 'comparison_test'
AND indexname LIKE '%unique%';
```

## Best Practices and Guidelines

### 1. Design Principles

```sql
-- ✅ GOOD practices for unique indexes

-- 1. Use meaningful constraint names
CREATE UNIQUE INDEX idx_unique_user_email ON users (email);
-- Better than: CREATE UNIQUE INDEX idx1 ON users (email);

-- 2. Consider case-insensitive uniqueness for text
CREATE UNIQUE INDEX idx_unique_username_ci ON users (LOWER(username));

-- 3. Use partial indexes for conditional uniqueness
CREATE UNIQUE INDEX idx_unique_active_subscription ON subscriptions (user_id, plan_type)
WHERE is_active = TRUE;

-- 4. Combine with functional indexes for data normalization
CREATE UNIQUE INDEX idx_unique_phone_normalized ON users
(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'))
WHERE phone IS NOT NULL;

-- 5. Document business rules clearly
COMMENT ON INDEX idx_unique_user_email IS 'Ensures email addresses are unique across all users';
COMMENT ON INDEX idx_unique_active_subscription IS 'Prevents multiple active subscriptions of same type per user';
```

### 2. Common Pitfalls to Avoid

```sql
-- ❌ Common mistakes with unique indexes

-- 1. DON'T ignore NULL handling
-- Bad: Expecting this to prevent multiple NULL values
-- CREATE UNIQUE INDEX idx_bad_null ON table_name (nullable_column);

-- Good: Handle NULLs explicitly if needed
CREATE UNIQUE INDEX idx_good_null ON table_name (nullable_column)
WHERE nullable_column IS NOT NULL;

-- 2. DON'T create redundant unique constraints
-- Bad: Having both
-- ALTER TABLE users ADD CONSTRAINT pk_users PRIMARY KEY (id);
-- CREATE UNIQUE INDEX idx_duplicate_id ON users (id);  -- Redundant!

-- Good: Primary key constraint is sufficient for uniqueness

-- 3. DON'T ignore case sensitivity for text matching
-- Bad: Allowing 'John@Example.com' and 'john@example.com'
-- CREATE UNIQUE INDEX idx_case_sensitive ON users (email);

-- Good: Use case-insensitive uniqueness
CREATE UNIQUE INDEX idx_case_insensitive ON users (LOWER(email));

-- 4. DON'T create overly complex unique expressions
-- Bad: Hard to maintain and understand
-- CREATE UNIQUE INDEX idx_complex_bad ON table_name (
--     SUBSTRING(UPPER(REVERSE(col1)), 1, 5) ||
--     EXTRACT(DOW FROM complex_date_function(col2))
-- );

-- Good: Keep expressions simple and well-documented
CREATE UNIQUE INDEX idx_simple_good ON table_name (UPPER(code));
```

### 3. Monitoring and Maintenance

```sql
-- Unique index health monitoring
CREATE OR REPLACE VIEW unique_index_health AS
SELECT
    i.schemaname,
    i.tablename,
    i.indexname,
    pg_size_pretty(pg_relation_size(s.indexrelid)) as size,
    s.idx_scan as scans,
    s.idx_tup_read as tuples_read,
    s.idx_tup_fetch as tuples_fetched,
    pg_get_indexdef(s.indexrelid) as definition,
    CASE
        WHEN s.idx_scan = 0 THEN 'UNUSED - Review necessity'
        WHEN s.idx_scan < 100 THEN 'LOW USAGE - Monitor'
        ELSE 'ACTIVE'
    END as usage_status,
    -- Check for constraint violations in application logs
    'Check application error logs for unique violations' as violation_monitoring
FROM pg_indexes i
JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
WHERE i.indexdef LIKE '%UNIQUE%'
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- Query the monitoring view
SELECT * FROM unique_index_health;

-- Identify tables that might need unique indexes
SELECT
    tablename,
    column_name,
    n_distinct,
    correlation,
    most_common_vals[1:5] as sample_values,
    CASE
        WHEN n_distinct = -1 THEN 'Likely unique (consider unique index)'
        WHEN n_distinct > 0.9 * reltuples THEN 'Mostly unique (review for duplicates)'
        ELSE 'Not unique'
    END as uniqueness_assessment
FROM pg_stats ps
JOIN pg_class pc ON ps.tablename = pc.relname
WHERE schemaname = 'public'
AND ps.tablename IN ('users', 'products', 'orders')
AND column_name IN ('email', 'username', 'sku', 'order_number')
ORDER BY tablename, column_name;
```

## Summary

**Unique indexes** are specialized database structures that serve dual purposes: **query optimization** and **data integrity enforcement**. They provide:

**Key Benefits:**

- **Data integrity** - Prevent duplicate values automatically
- **Query performance** - Fast lookups for unique value searches
- **Constraint enforcement** - Database-level validation
- **Application simplification** - Reduce duplicate checking logic

**Best Use Cases:**

- **User credentials** - Usernames, email addresses, phone numbers
- **Business identifiers** - SKUs, order numbers, account numbers
- **Relationship constraints** - User-role assignments, inventory locations
- **Conditional uniqueness** - Active records, time-based constraints

**Design Principles:**

- **Consider case sensitivity** for text fields
- **Handle NULL values** appropriately
- **Use partial indexes** for conditional uniqueness
- **Combine with expressions** for data normalization
- **Monitor usage and violations** regularly

**Common Patterns:**

```sql
-- Basic uniqueness: CREATE UNIQUE INDEX idx_name ON table (column);
-- Case-insensitive: CREATE UNIQUE INDEX idx_name ON table (LOWER(column));
-- Conditional: CREATE UNIQUE INDEX idx_name ON table (column) WHERE condition;
-- Multi-column: CREATE UNIQUE INDEX idx_name ON table (col1, col2);
-- Expression-based: CREATE UNIQUE INDEX idx_name ON table (expression);
```

Unique indexes are fundamental for maintaining data quality and enabling efficient unique value lookups in PostgreSQL applications.
