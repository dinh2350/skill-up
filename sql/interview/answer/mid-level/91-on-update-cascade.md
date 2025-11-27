# 91. What is the `ON UPDATE CASCADE` option?

## Definition

`ON UPDATE CASCADE` is a referential action clause in a foreign key constraint that automatically updates all child records' foreign key values when the referenced parent primary key value is updated. This maintains referential integrity by keeping relationships consistent after primary key changes.

## Syntax

```sql
CREATE TABLE child_table (
    id SERIAL PRIMARY KEY,
    parent_id INT NOT NULL,
    data VARCHAR(100),
    FOREIGN KEY (parent_id) REFERENCES parent_table(id)
        ON UPDATE CASCADE
);
```

## How It Works

```
Parent Table                    Child Table
┌──────────────┐               ┌──────────────┐
│ id = 1       │◄──────────────│ parent_id=1  │
│ name = 'A'   │               │ data = 'X'   │
└──────────────┘               └──────────────┘
       ↓
  UPDATE id=1 to id=100
       ↓
┌──────────────┐               ┌──────────────┐
│ id = 100     │◄──────────────│ parent_id=100│ ← Auto-updated
│ name = 'A'   │               │ data = 'X'   │
└──────────────┘               └──────────────┘
```

## Basic Example

### Without CASCADE

```sql
-- Parent table
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL
);

-- Child table without CASCADE (default: RESTRICT)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    -- Default: ON UPDATE RESTRICT
);

-- Insert data
INSERT INTO customers (customer_id, customer_name)
VALUES (1, 'John Doe');

INSERT INTO orders (customer_id, order_date)
VALUES (1, '2024-01-15'), (1, '2024-02-20');

-- Try to update customer ID
UPDATE customers SET customer_id = 999 WHERE customer_id = 1;
-- ERROR: update or delete on table "customers" violates foreign key constraint
-- Cannot update because orders reference it
```

### With CASCADE

```sql
-- Parent table
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL
);

-- Child table with CASCADE
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON UPDATE CASCADE  -- Enable cascading updates
);

-- Insert data
INSERT INTO customers (customer_id, customer_name)
VALUES (1, 'John Doe');

INSERT INTO orders (customer_id, order_date)
VALUES (1, '2024-01-15'), (1, '2024-02-20');

-- Update customer ID
UPDATE customers SET customer_id = 999 WHERE customer_id = 1;
-- Success! All orders are automatically updated

-- Verify cascade
SELECT customer_id, order_id FROM orders WHERE customer_id = 999;
-- Returns: 2 rows with customer_id = 999
SELECT customer_id FROM orders WHERE customer_id = 1;
-- Returns: 0 rows
```

## Complete Examples

### Example 1: Product SKU Changes

```sql
-- Products table (parent)
CREATE TABLE products (
    product_sku VARCHAR(20) PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Inventory table (child with CASCADE)
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_sku VARCHAR(20) NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_sku) REFERENCES products(product_sku)
        ON UPDATE CASCADE
);

-- Order items table (child with CASCADE)
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_sku VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_sku) REFERENCES products(product_sku)
        ON UPDATE CASCADE
);

-- Insert data
INSERT INTO products (product_sku, product_name, price)
VALUES ('SKU-001', 'Laptop', 999.99);

INSERT INTO inventory (product_sku, warehouse_id, quantity)
VALUES ('SKU-001', 1, 50),
       ('SKU-001', 2, 30);

INSERT INTO order_items (order_id, product_sku, quantity)
VALUES (100, 'SKU-001', 2),
       (101, 'SKU-001', 1);

-- Change product SKU
UPDATE products SET product_sku = 'LAPTOP-2024' WHERE product_sku = 'SKU-001';
-- Automatically updates:
-- - 2 inventory records
-- - 2 order items

-- Verify cascade
SELECT product_sku, warehouse_id, quantity FROM inventory WHERE product_sku = 'LAPTOP-2024';
-- Returns: 2 rows with new SKU
SELECT product_sku FROM order_items WHERE product_sku = 'LAPTOP-2024';
-- Returns: 2 rows with new SKU
```

### Example 2: User ID Migration

```sql
-- Users table (parent)
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Multiple child tables with CASCADE
CREATE TABLE user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    bio TEXT,
    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
);

CREATE TABLE user_posts (
    post_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    CONSTRAINT fk_posts_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
);

CREATE TABLE user_followers (
    follower_id VARCHAR(50) NOT NULL,
    following_id VARCHAR(50) NOT NULL,
    followed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT fk_followers_follower
        FOREIGN KEY (follower_id) REFERENCES users(user_id)
        ON UPDATE CASCADE,
    CONSTRAINT fk_followers_following
        FOREIGN KEY (following_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
);

-- Insert data
INSERT INTO users (user_id, username, email)
VALUES ('user-001', 'john_doe', 'john@example.com'),
       ('user-002', 'jane_smith', 'jane@example.com');

INSERT INTO user_profiles (user_id, bio)
VALUES ('user-001', 'Software developer');

INSERT INTO user_posts (user_id, content)
VALUES ('user-001', 'Hello World!'),
       ('user-001', 'My second post');

INSERT INTO user_followers (follower_id, following_id)
VALUES ('user-002', 'user-001');

-- Migrate user ID format (e.g., UUID migration)
UPDATE users SET user_id = 'uuid-a1b2c3' WHERE user_id = 'user-001';
-- Automatically updates:
-- - 1 profile
-- - 2 posts
-- - 1 follower relationship

-- Verify cascade across all tables
SELECT user_id FROM user_profiles WHERE user_id = 'uuid-a1b2c3';   -- 1 row
SELECT user_id FROM user_posts WHERE user_id = 'uuid-a1b2c3';      -- 2 rows
SELECT following_id FROM user_followers WHERE following_id = 'uuid-a1b2c3'; -- 1 row
```

### Example 3: Department Code Standardization

```sql
-- Departments table (parent)
CREATE TABLE departments (
    dept_code VARCHAR(10) PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL
);

-- Employees table (child with CASCADE)
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    employee_name VARCHAR(100) NOT NULL,
    dept_code VARCHAR(10) NOT NULL,
    CONSTRAINT fk_employees_department
        FOREIGN KEY (dept_code) REFERENCES departments(dept_code)
        ON UPDATE CASCADE
);

-- Projects table (child with CASCADE)
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    dept_code VARCHAR(10) NOT NULL,
    CONSTRAINT fk_projects_department
        FOREIGN KEY (dept_code) REFERENCES departments(dept_code)
        ON UPDATE CASCADE
);

-- Insert data
INSERT INTO departments (dept_code, dept_name)
VALUES ('ENG', 'Engineering'),
       ('MKT', 'Marketing');

INSERT INTO employees (employee_name, dept_code)
VALUES ('Alice', 'ENG'),
       ('Bob', 'ENG'),
       ('Carol', 'MKT');

INSERT INTO projects (project_name, dept_code)
VALUES ('Project Alpha', 'ENG'),
       ('Project Beta', 'ENG');

-- Standardize department codes
UPDATE departments SET dept_code = 'ENGINEERING' WHERE dept_code = 'ENG';
-- Automatically updates:
-- - 2 employees
-- - 2 projects

-- Verify
SELECT dept_code, employee_name FROM employees WHERE dept_code = 'ENGINEERING';
-- Returns: Alice, Bob
SELECT dept_code, project_name FROM projects WHERE dept_code = 'ENGINEERING';
-- Returns: Project Alpha, Project Beta
```

### Example 4: Multi-Level Cascade

```sql
-- Level 1: Regions (grandparent)
CREATE TABLE regions (
    region_code VARCHAR(10) PRIMARY KEY,
    region_name VARCHAR(100) NOT NULL
);

-- Level 2: Countries (parent)
CREATE TABLE countries (
    country_code VARCHAR(10) PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    CONSTRAINT fk_countries_region
        FOREIGN KEY (region_code) REFERENCES regions(region_code)
        ON UPDATE CASCADE
);

-- Level 3: Cities (child)
CREATE TABLE cities (
    city_id SERIAL PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    CONSTRAINT fk_cities_country
        FOREIGN KEY (country_code) REFERENCES countries(country_code)
        ON UPDATE CASCADE
);

-- Insert data
INSERT INTO regions (region_code, region_name)
VALUES ('NA', 'North America');

INSERT INTO countries (country_code, country_name, region_code)
VALUES ('US', 'United States', 'NA'),
       ('CA', 'Canada', 'NA');

INSERT INTO cities (city_name, country_code)
VALUES ('New York', 'US'),
       ('Los Angeles', 'US'),
       ('Toronto', 'CA');

-- Update region code - cascades through 3 levels!
UPDATE regions SET region_code = 'NAMERICA' WHERE region_code = 'NA';
-- Level 2: Countries update their region_code
-- Level 3: Cities unchanged (no direct reference to regions)

-- Verify
SELECT region_code FROM countries WHERE region_code = 'NAMERICA';  -- 2 rows

-- Update country code - cascades to cities
UPDATE countries SET country_code = 'USA' WHERE country_code = 'US';
-- Level 3: Cities update their country_code

-- Verify
SELECT country_code, city_name FROM cities WHERE country_code = 'USA';
-- Returns: New York, Los Angeles
```

## Adding CASCADE to Existing Tables

### Method 1: Recreate Constraint

```sql
-- Drop existing constraint
ALTER TABLE orders 
DROP CONSTRAINT fk_orders_customer;

-- Add new constraint with CASCADE
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    ON UPDATE CASCADE;
```

### Method 2: Add Both DELETE and UPDATE CASCADE

```sql
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS fk_order_items_order;

ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;  -- Both actions
```

## Comparison with Other UPDATE Actions

### RESTRICT (Default)

Prevents update if child records exist.

```sql
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
    ON UPDATE RESTRICT
```

### CASCADE

Automatically updates child records.

```sql
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
    ON UPDATE CASCADE
```

### SET NULL

Sets foreign key to NULL when parent is updated.

```sql
CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE SET NULL
);
```

### SET DEFAULT

Sets foreign key to its default value.

```sql
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    assigned_to INT DEFAULT 1,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
        ON UPDATE SET DEFAULT
);
```

### NO ACTION

Similar to RESTRICT but can be deferred.

```sql
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
    ON UPDATE NO ACTION
```

## When to Use ON UPDATE CASCADE

### ✅ Good Use Cases

#### 1. Natural Keys That Might Change

```sql
-- Product SKUs might be updated/standardized
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    product_sku VARCHAR(20) NOT NULL,
    FOREIGN KEY (product_sku) REFERENCES products(product_sku)
        ON UPDATE CASCADE  -- ✅ Good
);
```

#### 2. Business Identifiers

```sql
-- Employee IDs might change during migration
CREATE TABLE timesheets (
    timesheet_id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON UPDATE CASCADE  -- ✅ Good
);
```

#### 3. Code Standardization

```sql
-- Department codes might be standardized
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    dept_code VARCHAR(10) NOT NULL,
    FOREIGN KEY (dept_code) REFERENCES departments(dept_code)
        ON UPDATE CASCADE  -- ✅ Good
);
```

### ❌ Bad Use Cases / Less Common

#### 1. Surrogate Keys (Auto-Increment)

```sql
-- ❌ Unnecessary: SERIAL/auto-increment IDs shouldn't change
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,  -- SERIAL from orders table
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON UPDATE CASCADE  -- ❌ Overkill (IDs shouldn't change)
);

-- ✅ Better: Use default (RESTRICT) or NO ACTION
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    -- Default is fine
);
```

#### 2. Immutable Identifiers

```sql
-- UUIDs are immutable
CREATE TABLE logs (
    log_id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    FOREIGN KEY (user_uuid) REFERENCES users(user_uuid)
        ON UPDATE CASCADE  -- ❌ Unnecessary (UUIDs don't change)
);
```

## Practical Scenarios

### Scenario 1: Data Migration

```sql
-- Migrating from integer IDs to UUIDs
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,  -- Changed from INT to VARCHAR
    username VARCHAR(50) UNIQUE NOT NULL
);

-- Child tables with CASCADE allow smooth migration
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
);

-- Migration process
BEGIN;
    -- Update parent IDs one by one
    UPDATE users SET user_id = 'uuid-' || user_id WHERE user_id::INT < 1000;
    -- Child records automatically update
COMMIT;
```

### Scenario 2: Bulk Updates

```sql
-- Standardize product codes across entire catalog
BEGIN;
    -- Update parent table
    UPDATE products SET product_sku = 'NEW-' || product_sku 
    WHERE category = 'electronics';
    
    -- All related records in inventory, orders, etc. automatically update
    -- due to ON UPDATE CASCADE
COMMIT;

-- Verify cascade
SELECT COUNT(*) FROM inventory WHERE product_sku LIKE 'NEW-%';
SELECT COUNT(*) FROM order_items WHERE product_sku LIKE 'NEW-%';
```

### Scenario 3: Composite Foreign Keys

```sql
-- Multi-column primary key
CREATE TABLE course_sections (
    course_code VARCHAR(10),
    section_number VARCHAR(5),
    semester VARCHAR(20),
    PRIMARY KEY (course_code, section_number, semester)
);

-- Child with composite foreign key
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    course_code VARCHAR(10) NOT NULL,
    section_number VARCHAR(5) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    FOREIGN KEY (course_code, section_number, semester)
        REFERENCES course_sections(course_code, section_number, semester)
        ON UPDATE CASCADE
);

-- Update course code - all enrollments update automatically
UPDATE course_sections 
SET course_code = 'CS101-NEW' 
WHERE course_code = 'CS101';
```

## Performance Considerations

### Index Foreign Keys

```sql
-- Always index foreign key columns
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON UPDATE CASCADE
);

-- Create index for better CASCADE performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

### Monitor Update Impact

```sql
-- Check how many records would be updated
SELECT 
    'orders' AS table_name,
    COUNT(*) AS affected_records
FROM orders WHERE customer_id = 1
UNION ALL
SELECT 
    'order_items',
    COUNT(*)
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
WHERE o.customer_id = 1;

-- Before updating:
-- UPDATE customers SET customer_id = 999 WHERE customer_id = 1;
```

### Lock Considerations

```sql
-- CASCADE updates acquire locks on child rows
-- Large updates can cause contention

-- Consider batching large updates
DO $$
DECLARE
    batch_size INT := 1000;
    offset_val INT := 0;
BEGIN
    LOOP
        UPDATE customers 
        SET customer_id = customer_id + 10000
        WHERE customer_id IN (
            SELECT customer_id 
            FROM customers 
            WHERE customer_id < 5000
            LIMIT batch_size 
            OFFSET offset_val
        );
        
        EXIT WHEN NOT FOUND;
        offset_val := offset_val + batch_size;
    END LOOP;
END $$;
```

## Verification and Monitoring

### Check CASCADE Configuration

```sql
-- Query to see all ON UPDATE CASCADE constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND rc.update_rule = 'CASCADE'
ORDER BY tc.table_name;
```

### Test CASCADE Before Committing

```sql
-- Use transaction to test update cascade
BEGIN;
    -- Update parent
    UPDATE products SET product_sku = 'TEST-SKU' WHERE product_sku = 'OLD-SKU';
    
    -- Verify cascade
    SELECT COUNT(*) FROM inventory WHERE product_sku = 'TEST-SKU';
    SELECT COUNT(*) FROM order_items WHERE product_sku = 'TEST-SKU';
    
    -- If correct, COMMIT; otherwise ROLLBACK
    ROLLBACK;  -- or COMMIT
```

## Best Practices

### 1. Combine with DELETE CASCADE

```sql
-- Most use cases need both
CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
```

### 2. Name Constraints Clearly

```sql
-- ✅ GOOD: Clear naming
CONSTRAINT fk_inventory_product_cascade
    FOREIGN KEY (product_sku) REFERENCES products(product_sku)
    ON UPDATE CASCADE
```

### 3. Use Transactions for Bulk Updates

```sql
BEGIN;
    UPDATE departments SET dept_code = 'NEW-CODE' WHERE dept_code = 'OLD';
    -- Verify cascade results before committing
COMMIT;
```

### 4. Consider Using Surrogate Keys

```sql
-- Instead of natural keys that might change:
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,      -- Immutable surrogate key
    product_sku VARCHAR(20) UNIQUE NOT NULL,  -- Mutable natural key
    product_name VARCHAR(200)
);

-- Child tables reference immutable ID (no CASCADE needed)
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,  -- Reference immutable ID
    FOREIGN KEY (product_id) REFERENCES products(product_id)
    -- No ON UPDATE CASCADE needed
);
```

### 5. Document CASCADE Behavior

```sql
COMMENT ON CONSTRAINT fk_orders_customer_cascade ON orders IS
'Automatically updates order customer_id when customer ID changes';
```

## Common Pitfalls

### 1. Updating Auto-Increment Keys

```sql
-- ❌ BAD: Don't update SERIAL/auto-increment PKs
UPDATE customers SET customer_id = 999 WHERE customer_id = 1;
-- Even with CASCADE, this is a bad practice

-- ✅ GOOD: Use surrogate keys, don't update them
```

### 2. Performance Impact on Large Tables

```sql
-- Updating a key referenced by millions of rows
UPDATE products SET product_sku = 'NEW-SKU' WHERE product_sku = 'OLD-SKU';
-- Could cascade to millions of records, causing locks and delays
```

### 3. Circular Update Chains

```sql
-- Be cautious with bidirectional relationships
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    preferred_contact_id VARCHAR(50),
    FOREIGN KEY (preferred_contact_id) REFERENCES contacts(contact_id)
        ON UPDATE CASCADE
);

CREATE TABLE contacts (
    contact_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
);
-- Can cause complex update chains
```

## Comparison: ON DELETE vs ON UPDATE CASCADE

```sql
-- Both CASCADE options in one constraint
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE    -- Delete items when order deleted
        ON UPDATE CASCADE,   -- Update items when order ID changes
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE RESTRICT   -- Can't delete products with orders
        ON UPDATE CASCADE    -- Update items when product ID changes
);
```

## Summary

**`ON UPDATE CASCADE`** automatically updates all child records' foreign key values when the referenced parent primary key is updated.

**Key Points:**
- Maintains referential integrity during primary key updates
- Useful for natural keys that might change (SKUs, codes, business IDs)
- Less common for surrogate keys (auto-increment, UUIDs)
- Can cascade through multiple levels
- Requires indexed foreign keys for performance
- Should be tested in transactions before committing

**When to use:**
- Natural/business keys that might need updating
- Data migrations (ID format changes)
- Code standardization projects
- Multi-level hierarchies with changeable keys

**When NOT to use:**
- Auto-increment/SERIAL keys (shouldn't change)
- Immutable identifiers (UUIDs)
- When using proper surrogate keys

**Best practice:** Use surrogate keys that never change, eliminating the need for `ON UPDATE CASCADE` in most cases.

**Syntax:**
```sql
FOREIGN KEY (column) REFERENCES parent_table(column)
    ON UPDATE CASCADE
    ON DELETE CASCADE  -- Often combined
```
