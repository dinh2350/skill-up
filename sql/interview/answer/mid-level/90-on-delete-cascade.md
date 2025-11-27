# 90. What is the `ON DELETE CASCADE` option?

## Definition

`ON DELETE CASCADE` is a referential action clause in a foreign key constraint that automatically deletes all child records when their parent record is deleted. This ensures referential integrity by preventing orphaned records.

## Syntax

```sql
CREATE TABLE child_table (
    id SERIAL PRIMARY KEY,
    parent_id INT NOT NULL,
    data VARCHAR(100),
    FOREIGN KEY (parent_id) REFERENCES parent_table(id)
        ON DELETE CASCADE
);
```

## How It Works

```
Parent Table                    Child Table
┌──────────────┐               ┌──────────────┐
│ id = 1       │◄──────────────│ parent_id=1  │ ← Auto-deleted
│ name = 'A'   │               │ data = 'X'   │
└──────────────┘               └──────────────┘
       ↓
  DELETE id=1
       ↓
┌──────────────┐               ┌──────────────┐
│ (empty)      │               │ (empty)      │
└──────────────┘               └──────────────┘
```

## Basic Example

### Without CASCADE

```sql
-- Parent table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL
);

-- Child table without CASCADE (default: RESTRICT)
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    employee_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    -- Default behavior: ON DELETE RESTRICT
);

-- Insert data
INSERT INTO departments (department_id, department_name) 
VALUES (1, 'Engineering');

INSERT INTO employees (employee_name, department_id)
VALUES ('Alice', 1), ('Bob', 1);

-- Try to delete department
DELETE FROM departments WHERE department_id = 1;
-- ERROR: update or delete on table "departments" violates foreign key constraint
-- Cannot delete because employees reference it
```

### With CASCADE

```sql
-- Parent table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL
);

-- Child table with CASCADE
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    employee_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE CASCADE  -- Enable cascading deletes
);

-- Insert data
INSERT INTO departments (department_id, department_name) 
VALUES (1, 'Engineering');

INSERT INTO employees (employee_name, department_id)
VALUES ('Alice', 1), ('Bob', 1);

-- Delete department
DELETE FROM departments WHERE department_id = 1;
-- Success! Both employees are automatically deleted

-- Verify
SELECT * FROM employees WHERE department_id = 1;
-- Returns 0 rows
```

## Complete Examples

### Example 1: Blog System

```sql
-- Posts table (parent)
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comments table (child with CASCADE)
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_comments_post
        FOREIGN KEY (post_id) REFERENCES posts(post_id)
        ON DELETE CASCADE
);

-- Insert data
INSERT INTO posts (post_id, title, content)
VALUES (1, 'Hello World', 'My first post!');

INSERT INTO comments (post_id, comment_text)
VALUES (1, 'Great post!'),
       (1, 'Thanks for sharing!'),
       (1, 'Very helpful!');

-- Delete the post
DELETE FROM posts WHERE post_id = 1;
-- Automatically deletes all 3 comments

-- Verify comments are gone
SELECT COUNT(*) FROM comments WHERE post_id = 1;
-- Returns: 0
```

### Example 2: E-Commerce Orders

```sql
-- Orders table (parent)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending'
);

-- Order items table (child with CASCADE)
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
);

-- Order payments table (another child with CASCADE)
CREATE TABLE order_payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
);

-- Insert data
INSERT INTO orders (order_id, customer_id, status)
VALUES (100, 5, 'cancelled');

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (100, 1, 2, 29.99),
       (100, 2, 1, 49.99);

INSERT INTO order_payments (order_id, payment_method, amount)
VALUES (100, 'credit_card', 79.98);

-- Delete cancelled order
DELETE FROM orders WHERE order_id = 100;
-- Automatically deletes:
-- - 2 order items
-- - 1 payment record

-- Verify
SELECT COUNT(*) FROM order_items WHERE order_id = 100;    -- 0
SELECT COUNT(*) FROM order_payments WHERE order_id = 100; -- 0
```

### Example 3: Multi-Level Cascade

```sql
-- Level 1: Categories (grandparent)
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

-- Level 2: Products (parent)
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE CASCADE
);

-- Level 3: Product images (child)
CREATE TABLE product_images (
    image_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    CONSTRAINT fk_images_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE CASCADE
);

-- Insert data
INSERT INTO categories (category_id, category_name)
VALUES (1, 'Electronics');

INSERT INTO products (product_id, category_id, product_name)
VALUES (10, 1, 'Laptop'), (11, 1, 'Mouse');

INSERT INTO product_images (product_id, image_url)
VALUES (10, 'laptop1.jpg'),
       (10, 'laptop2.jpg'),
       (11, 'mouse1.jpg');

-- Delete category - cascades through 3 levels!
DELETE FROM categories WHERE category_id = 1;
-- Automatically deletes:
-- - 2 products (10, 11)
-- - 3 product images (all associated images)

-- Verify all levels are cleared
SELECT COUNT(*) FROM products WHERE category_id = 1;         -- 0
SELECT COUNT(*) FROM product_images WHERE product_id IN (10, 11); -- 0
```

### Example 4: User Accounts with Multiple Dependencies

```sql
-- Users table (parent)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Multiple child tables all with CASCADE
CREATE TABLE user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    bio TEXT,
    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE user_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    setting_name VARCHAR(50) NOT NULL,
    setting_value VARCHAR(200),
    CONSTRAINT fk_preferences_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- Insert data
INSERT INTO users (user_id, username, email)
VALUES (1, 'john_doe', 'john@example.com');

INSERT INTO user_profiles (user_id, bio)
VALUES (1, 'Software developer');

INSERT INTO user_sessions (user_id, token, expires_at)
VALUES (1, 'abc123', NOW() + INTERVAL '1 day'),
       (1, 'xyz789', NOW() + INTERVAL '2 days');

INSERT INTO user_preferences (user_id, setting_name, setting_value)
VALUES (1, 'theme', 'dark'),
       (1, 'language', 'en');

-- Delete user account
DELETE FROM users WHERE user_id = 1;
-- Automatically deletes from all child tables:
-- - 1 profile
-- - 2 sessions
-- - 2 preferences
```

## Adding CASCADE to Existing Tables

### Method 1: Modify Existing Constraint

```sql
-- First, drop the existing constraint
ALTER TABLE comments 
DROP CONSTRAINT fk_comments_post;

-- Add new constraint with CASCADE
ALTER TABLE comments
ADD CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
    ON DELETE CASCADE;
```

### Method 2: Using ALTER TABLE (if no constraint exists)

```sql
-- Add foreign key with CASCADE to table without constraint
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE;
```

## Comparison with Other DELETE Actions

### RESTRICT (Default)

Prevents deletion if child records exist.

```sql
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
    ON DELETE RESTRICT  -- Explicit
-- OR
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
    -- Default behavior
```

### CASCADE

Automatically deletes child records.

```sql
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
    ON DELETE CASCADE
```

### SET NULL

Sets foreign key to NULL when parent is deleted.

```sql
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    manager_id INT,  -- Nullable
    FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
        ON DELETE SET NULL
);
```

### SET DEFAULT

Sets foreign key to its default value.

```sql
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    assigned_to INT DEFAULT 1,  -- Default user
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
        ON DELETE SET DEFAULT
);
```

### NO ACTION

Similar to RESTRICT but can be deferred.

```sql
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
    ON DELETE NO ACTION
```

## When to Use ON DELETE CASCADE

### ✅ Good Use Cases

#### 1. Dependent Data

Data that has no meaning without the parent.

```sql
-- Order items are meaningless without the order
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE  -- ✅ Correct
);
```

#### 2. Temporary/Session Data

```sql
-- Shopping cart items
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(cart_id)
        ON DELETE CASCADE  -- ✅ Correct
);
```

#### 3. Hierarchical/Nested Data

```sql
-- Comments on a post
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
        ON DELETE CASCADE  -- ✅ Correct
);
```

### ❌ Bad Use Cases

#### 1. Independent Entities

```sql
-- ❌ BAD: Employees are independent
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    department_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE CASCADE  -- ❌ Wrong! Don't delete employees
);

-- ✅ GOOD: Use RESTRICT or SET NULL
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE SET NULL  -- ✅ Correct
);
```

#### 2. Historical/Audit Data

```sql
-- ❌ BAD: Lose audit trail
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE  -- ❌ Wrong! Preserve history
);

-- ✅ GOOD: Preserve audit data
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL  -- ✅ Correct
);
```

#### 3. Financial/Legal Records

```sql
-- ❌ BAD: Compliance violation
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
        ON DELETE CASCADE  -- ❌ Wrong! Never delete transactions
);

-- ✅ GOOD: Prevent deletion
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
        ON DELETE RESTRICT  -- ✅ Correct
);
```

## Performance Considerations

### Index Foreign Keys

```sql
-- Always index foreign key columns for better performance
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
);

-- Create index for faster cascade operations
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### Monitor Large Cascades

```sql
-- Check how many records would be deleted
SELECT 
    'orders' AS table_name,
    COUNT(*) AS records_to_delete
FROM orders 
WHERE customer_id = 123
UNION ALL
SELECT 
    'order_items',
    COUNT(*)
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
WHERE o.customer_id = 123;
```

## Verification and Monitoring

### Check CASCADE Configuration

```sql
-- Query to see all ON DELETE CASCADE constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND rc.delete_rule = 'CASCADE'
ORDER BY tc.table_name;
```

### Test CASCADE Before Using

```sql
-- Use transaction to test without committing
BEGIN;
    -- Delete parent record
    DELETE FROM posts WHERE post_id = 1;
    
    -- Check what was cascaded
    SELECT COUNT(*) FROM comments WHERE post_id = 1;  -- Should be 0
    
    -- If correct, commit; otherwise rollback
    ROLLBACK;  -- or COMMIT
```

## Best Practices

### 1. Name Constraints Explicitly

```sql
-- ✅ GOOD: Named constraint
CONSTRAINT fk_comments_post_cascade
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
    ON DELETE CASCADE
```

### 2. Use Transactions for Safety

```sql
BEGIN;
    DELETE FROM categories WHERE category_id = 5;
    -- Verify cascade results
    -- Then COMMIT or ROLLBACK
COMMIT;
```

### 3. Document CASCADE Behavior

```sql
COMMENT ON CONSTRAINT fk_comments_post_cascade ON comments IS
'Automatically deletes all comments when parent post is deleted';
```

### 4. Consider Soft Deletes for Important Data

```sql
-- Instead of CASCADE, use soft delete flag
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    deleted_at TIMESTAMP NULL  -- NULL = active
);

-- Mark as deleted instead of actual deletion
UPDATE posts SET deleted_at = NOW() WHERE post_id = 1;
```

### 5. Log Cascading Deletes

```sql
-- Create trigger to log cascades
CREATE OR REPLACE FUNCTION log_cascade_delete()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deletion_audit (table_name, record_id, deleted_at)
    VALUES (TG_TABLE_NAME, OLD.id, NOW());
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_order_deletion
BEFORE DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION log_cascade_delete();
```

## Common Pitfalls

### 1. Unintentional Mass Deletion

```sql
-- Be careful with broad conditions!
DELETE FROM users WHERE status = 'inactive';
-- Could cascade to delete thousands of related records
```

### 2. Missing Indexes

```sql
-- Without index, cascade scan is slow
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,  -- Should be indexed!
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
);

-- Always add index:
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### 3. Circular References

```sql
-- Avoid circular CASCADE relationships
CREATE TABLE table_a (
    id SERIAL PRIMARY KEY,
    b_id INT,
    FOREIGN KEY (b_id) REFERENCES table_b(id) ON DELETE CASCADE
);

CREATE TABLE table_b (
    id SERIAL PRIMARY KEY,
    a_id INT,
    FOREIGN KEY (a_id) REFERENCES table_a(id) ON DELETE CASCADE
);
-- This can cause complex cascade chains
```

## Summary

**`ON DELETE CASCADE`** is a referential action that automatically deletes all child records when their parent is deleted.

**Key Points:**
- Maintains referential integrity automatically
- Useful for dependent data (order items, comments, cart items)
- Can cascade through multiple levels
- Requires careful consideration for important data
- Always index foreign key columns for performance
- Use transactions to test cascade behavior
- Not appropriate for independent entities or historical data

**Syntax:**
```sql
FOREIGN KEY (column) REFERENCES parent_table(column)
    ON DELETE CASCADE
```

**Remember:** CASCADE is powerful but irreversible. Always consider the implications and test thoroughly before implementing in production!
