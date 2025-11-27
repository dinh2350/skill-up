# 89. What are cascading deletes?

## Definition

**Cascading deletes** is a referential integrity feature that automatically deletes all related child records when a parent record is deleted. This maintains data consistency by ensuring that no orphaned records remain after a parent deletion.

## How It Works

```
Parent Table (Orders)          Child Table (Order Items)
┌─────────────────┐           ┌─────────────────┐
│ order_id = 1    │◄──────────│ order_item_id   │
│ customer_id     │           │ order_id = 1    │  ← Automatically deleted
│ order_date      │           │ product_id      │     when order 1 is deleted
└─────────────────┘           │ quantity        │
                              └─────────────────┘

DELETE FROM orders WHERE order_id = 1;
↓
All order_items with order_id = 1 are automatically deleted
```

## Syntax

### Creating Table with CASCADE

```sql
CREATE TABLE parent_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE child_table (
    id SERIAL PRIMARY KEY,
    parent_id INT NOT NULL,
    data VARCHAR(100),
    FOREIGN KEY (parent_id) REFERENCES parent_table(id)
        ON DELETE CASCADE  -- Enable cascading deletes
);
```

### Adding CASCADE to Existing Constraint

```sql
-- First, drop the existing constraint
ALTER TABLE child_table 
DROP CONSTRAINT fk_child_parent;

-- Add new constraint with CASCADE
ALTER TABLE child_table
ADD CONSTRAINT fk_child_parent
FOREIGN KEY (parent_id) REFERENCES parent_table(id)
ON DELETE CASCADE;
```

## Basic Example

### Without Cascading Deletes

```sql
-- Create tables without CASCADE
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    -- Default: ON DELETE RESTRICT (no CASCADE)
);

-- Insert data
INSERT INTO customers (customer_id, customer_name) 
VALUES (1, 'John Doe');

INSERT INTO orders (order_id, customer_id, order_date)
VALUES (101, 1, '2024-01-15');

-- Try to delete customer
DELETE FROM customers WHERE customer_id = 1;
-- ERROR: update or delete on table "customers" violates foreign key constraint
-- DETAIL: Key (customer_id)=(1) is still referenced from table "orders"

-- Must delete child records first
DELETE FROM orders WHERE customer_id = 1;
DELETE FROM customers WHERE customer_id = 1;  -- Now succeeds
```

### With Cascading Deletes

```sql
-- Create tables with CASCADE
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE  -- Enable cascading deletes
);

-- Insert data
INSERT INTO customers (customer_id, customer_name) 
VALUES (1, 'John Doe');

INSERT INTO orders (order_id, customer_id, order_date)
VALUES (101, 1, '2024-01-15'),
       (102, 1, '2024-01-20');

-- Delete customer - automatically deletes all orders
DELETE FROM customers WHERE customer_id = 1;
-- Success! Both orders are automatically deleted

-- Verify
SELECT * FROM orders WHERE customer_id = 1;
-- Returns 0 rows - orders were cascaded
```

## Real-World Examples

### Example 1: Blog Platform

```sql
-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    published_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE  -- Delete all posts when user is deleted
);

-- Comments table
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
        ON DELETE CASCADE,  -- Delete comments when post is deleted
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE   -- Delete comments when user is deleted
);

-- Insert test data
INSERT INTO users (user_id, username, email) 
VALUES (1, 'john_doe', 'john@example.com');

INSERT INTO posts (post_id, user_id, title, content)
VALUES (100, 1, 'My First Post', 'Hello World!');

INSERT INTO comments (comment_id, post_id, user_id, comment_text)
VALUES (1000, 100, 1, 'Great post!'),
       (1001, 100, 1, 'Thanks for sharing!');

-- Delete user - cascades to posts AND comments
DELETE FROM users WHERE user_id = 1;
-- Automatically deletes:
-- - 1 post (post_id = 100)
-- - 2 comments (comment_id = 1000, 1001)

-- Verify cascade
SELECT COUNT(*) FROM posts WHERE user_id = 1;      -- 0
SELECT COUNT(*) FROM comments WHERE user_id = 1;   -- 0
```

### Example 2: E-Commerce System

```sql
-- Products table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending'
);

-- Order items table (cascades from orders)
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE,  -- Delete items when order is deleted
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE RESTRICT  -- Can't delete products with order items
);

-- Order payments table (cascades from orders)
CREATE TABLE order_payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE  -- Delete payments when order is deleted
);

-- Insert test data
INSERT INTO products (product_id, product_name, price)
VALUES (1, 'Laptop', 999.99),
       (2, 'Mouse', 29.99);

INSERT INTO orders (order_id, customer_id, status)
VALUES (500, 123, 'cancelled');

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (500, 1, 1, 999.99),
       (500, 2, 2, 29.99);

INSERT INTO order_payments (order_id, payment_method, amount)
VALUES (500, 'credit_card', 1059.97);

-- Delete cancelled order
DELETE FROM orders WHERE order_id = 500;
-- Automatically deletes:
-- - 2 order items
-- - 1 payment record

-- Verify
SELECT COUNT(*) FROM order_items WHERE order_id = 500;     -- 0
SELECT COUNT(*) FROM order_payments WHERE order_id = 500;  -- 0
```

### Example 3: Educational System

```sql
-- Courses table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL
);

-- Course sections (specific instances of courses)
CREATE TABLE course_sections (
    section_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    section_number VARCHAR(10) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE  -- Delete sections when course is deleted
);

-- Section enrollments
CREATE TABLE section_enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    section_id INT NOT NULL,
    student_id INT NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade CHAR(2),
    FOREIGN KEY (section_id) REFERENCES course_sections(section_id)
        ON DELETE CASCADE  -- Delete enrollments when section is deleted
);

-- Section assignments
CREATE TABLE section_assignments (
    assignment_id SERIAL PRIMARY KEY,
    section_id INT NOT NULL,
    assignment_name VARCHAR(100) NOT NULL,
    due_date DATE NOT NULL,
    max_points INT NOT NULL,
    FOREIGN KEY (section_id) REFERENCES course_sections(section_id)
        ON DELETE CASCADE  -- Delete assignments when section is deleted
);

-- Insert test data
INSERT INTO courses (course_id, course_name, department)
VALUES (1, 'Introduction to SQL', 'Computer Science');

INSERT INTO course_sections (section_id, course_id, section_number, semester, year)
VALUES (10, 1, '001', 'Fall', 2024);

INSERT INTO section_enrollments (section_id, student_id, grade)
VALUES (10, 1001, 'A'),
       (10, 1002, 'B+');

INSERT INTO section_assignments (section_id, assignment_name, due_date, max_points)
VALUES (10, 'Homework 1', '2024-09-15', 100),
       (10, 'Midterm', '2024-10-20', 200);

-- Cancel course section
DELETE FROM course_sections WHERE section_id = 10;
-- Automatically deletes:
-- - 2 enrollments
-- - 2 assignments

-- Delete entire course
DELETE FROM courses WHERE course_id = 1;
-- Would cascade through:
-- - All course sections (if any remained)
-- - All enrollments in those sections
-- - All assignments in those sections
```

### Example 4: Multi-Level Cascade

```sql
-- Categories (Level 1)
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

-- Products (Level 2) - cascades from categories
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE CASCADE
);

-- Product reviews (Level 3) - cascades from products
CREATE TABLE product_reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE CASCADE
);

-- Review replies (Level 4) - cascades from reviews
CREATE TABLE review_replies (
    reply_id SERIAL PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    reply_text TEXT NOT NULL,
    FOREIGN KEY (review_id) REFERENCES product_reviews(review_id)
        ON DELETE CASCADE
);

-- Insert test data
INSERT INTO categories (category_id, category_name)
VALUES (1, 'Electronics');

INSERT INTO products (product_id, category_id, product_name, price)
VALUES (100, 1, 'Smartphone', 699.99);

INSERT INTO product_reviews (review_id, product_id, user_id, rating, review_text)
VALUES (1000, 100, 5, 5, 'Excellent phone!');

INSERT INTO review_replies (reply_id, review_id, user_id, reply_text)
VALUES (10000, 1000, 10, 'Glad you liked it!');

-- Delete category - cascades through 4 levels!
DELETE FROM categories WHERE category_id = 1;
-- Automatically deletes:
-- Level 2: Product (product_id = 100)
-- Level 3: Review (review_id = 1000)
-- Level 4: Reply (reply_id = 10000)
```

## Cascading Delete Chains

### Visualizing the Chain

```sql
-- Example chain: Account → Profile → Posts → Comments → Likes

CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE profiles (
    profile_id SERIAL PRIMARY KEY,
    account_id INT UNIQUE NOT NULL,
    display_name VARCHAR(100),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
        ON DELETE CASCADE
);

CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    profile_id INT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id)
        ON DELETE CASCADE
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    profile_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
        ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id)
        ON DELETE CASCADE
);

CREATE TABLE likes (
    like_id SERIAL PRIMARY KEY,
    comment_id INT NOT NULL,
    profile_id INT NOT NULL,
    FOREIGN KEY (comment_id) REFERENCES comments(comment_id)
        ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(profile_id)
        ON DELETE CASCADE
);

-- Delete account triggers cascade:
-- accounts → profiles → posts → comments → likes
DELETE FROM accounts WHERE account_id = 1;
```

## When to Use Cascading Deletes

### ✅ Good Use Cases

#### 1. Truly Dependent Data

Data that has no meaning without the parent record.

```sql
-- Order items are meaningless without the order
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE  -- ✅ Good: Items should be deleted with order
);
```

#### 2. Temporary or Session Data

```sql
-- Shopping cart items should be deleted when cart is deleted
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(cart_id)
        ON DELETE CASCADE  -- ✅ Good: Temporary data
);
```

#### 3. Hierarchical Data

```sql
-- Comments on a post should be deleted when post is deleted
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    comment_text TEXT,
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
        ON DELETE CASCADE  -- ✅ Good: Comments belong to post
);
```

#### 4. Test or Development Data

```sql
-- Test runs and their results
CREATE TABLE test_results (
    result_id SERIAL PRIMARY KEY,
    test_run_id INT NOT NULL,
    test_case VARCHAR(100),
    status VARCHAR(20),
    FOREIGN KEY (test_run_id) REFERENCES test_runs(test_run_id)
        ON DELETE CASCADE  -- ✅ Good: Results belong to run
);
```

### ❌ Bad Use Cases

#### 1. Historical or Audit Data

```sql
-- ❌ BAD: Don't cascade delete audit logs
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE  -- ❌ Bad: Lose audit trail!
);

-- ✅ GOOD: Use SET NULL or RESTRICT
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT,  -- Nullable
    action VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL  -- ✅ Good: Preserve audit history
);
```

#### 2. Financial or Legal Records

```sql
-- ❌ BAD: Don't cascade delete transactions
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    amount DECIMAL(10,2),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
        ON DELETE CASCADE  -- ❌ Bad: Legal/compliance issue!
);

-- ✅ GOOD: Use RESTRICT
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    amount DECIMAL(10,2),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id)
        ON DELETE RESTRICT  -- ✅ Good: Prevent accidental deletion
);
```

#### 3. Reference Data

```sql
-- ❌ BAD: Don't cascade when child is more important
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    department_id INT NOT NULL,
    employee_name VARCHAR(100),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE CASCADE  -- ❌ Bad: Employees are independent entities
);

-- ✅ GOOD: Use RESTRICT or SET NULL
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    department_id INT,
    employee_name VARCHAR(100),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE SET NULL  -- ✅ Good: Keep employee, clear department
);
```

## Performance Considerations

### Large Cascades Can Be Slow

```sql
-- Deleting one order might cascade to thousands of items
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
);

-- If an order has 10,000 items:
DELETE FROM orders WHERE order_id = 123;
-- This deletes 1 order + 10,000 items (can be slow!)
```

### Index Foreign Keys for Performance

```sql
-- Always index foreign key columns for better cascade performance
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
);

-- Create index on foreign key
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
-- Makes cascading deletes much faster!
```

### Monitor Cascade Depth

```sql
-- Deep cascade chains can cause performance issues
-- and make it hard to predict what gets deleted

-- Level 1: Categories
-- Level 2: Products (cascade from categories)
-- Level 3: Reviews (cascade from products)
-- Level 4: Replies (cascade from reviews)
-- Level 5: Likes (cascade from replies)

-- Deleting a category cascades through 5 levels!
-- Consider if this is really necessary
```

## Safety and Best Practices

### 1. Use Transactions for Safety

```sql
-- Wrap deletes in transactions to allow rollback
BEGIN;
    DELETE FROM customers WHERE customer_id = 1;
    -- Check what was deleted
    SELECT COUNT(*) FROM orders WHERE customer_id = 1;  -- Should be 0
    -- If unexpected, rollback
    ROLLBACK;  -- or COMMIT if correct
```

### 2. Check Dependencies Before Deleting

```sql
-- Count related records before deleting
SELECT 
    'orders' AS table_name,
    COUNT(*) AS related_records
FROM orders WHERE customer_id = 1
UNION ALL
SELECT 
    'order_items',
    COUNT(*)
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
WHERE o.customer_id = 1;

-- Example output:
-- table_name   | related_records
-- orders       | 5
-- order_items  | 23
-- Total: Deleting customer 1 will cascade delete 5 orders and 23 items
```

### 3. Use Soft Deletes for Important Data

```sql
-- Instead of actual deletion, mark as deleted
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    deleted_at TIMESTAMP NULL,  -- NULL = active, NOT NULL = deleted
    deleted_by INT
);

-- "Delete" customer (soft delete)
UPDATE customers 
SET deleted_at = NOW(), deleted_by = 123
WHERE customer_id = 1;

-- Query only active customers
SELECT * FROM customers WHERE deleted_at IS NULL;
```

### 4. Log Cascading Deletes

```sql
-- Create audit table to track cascades
CREATE TABLE deletion_audit (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    deleted_at TIMESTAMP DEFAULT NOW(),
    deleted_by INT,
    deletion_reason TEXT
);

-- Use trigger to log cascades
CREATE OR REPLACE FUNCTION log_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deletion_audit (table_name, record_id, deleted_by)
    VALUES (TG_TABLE_NAME, OLD.id, current_setting('app.user_id', true)::INT);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_order_deletion
BEFORE DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION log_deletion();
```

### 5. Name Constraints Explicitly

```sql
-- ✅ GOOD: Named constraint
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer_cascade
FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
ON DELETE CASCADE;

-- Easy to identify and modify later
ALTER TABLE orders DROP CONSTRAINT fk_orders_customer_cascade;
```

## Verifying Cascading Deletes

### Check Constraint Configuration

```sql
-- Query to see which constraints have CASCADE
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    rc.delete_rule,
    rc.update_rule
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

## Common Pitfalls

### 1. Accidental Mass Deletion

```sql
-- Be careful with broad delete conditions!
DELETE FROM customers WHERE status = 'inactive';
-- If 1000 inactive customers, and each has 50 orders,
-- this cascades to delete 50,000 orders!
```

### 2. Circular Cascade References

```sql
-- ❌ BAD: Can create problems
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    favorite_book_id INT,
    FOREIGN KEY (favorite_book_id) REFERENCES books(book_id)
        ON DELETE CASCADE
);

CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    author_id INT,
    FOREIGN KEY (author_id) REFERENCES authors(author_id)
        ON DELETE CASCADE
);
-- Deleting an author or book can cause unexpected cascades!
```

### 3. Missing Indexes on Foreign Keys

```sql
-- Without index, cascading deletes scan entire table
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,  -- No index!
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
);

-- Delete is slow - must scan all order_items
DELETE FROM orders WHERE order_id = 123;

-- Always add index:
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

## Summary

**Cascading deletes** automatically delete related child records when a parent record is deleted, maintaining referential integrity without manual intervention.

**When to use:**
- Truly dependent data (order items, cart items)
- Temporary or session data
- Data that has no meaning without parent
- Hierarchical structures (comments on posts)

**When NOT to use:**
- Historical or audit data
- Financial or legal records
- Independent entities (employees, customers)
- Data needed for reporting or analytics

**Best practices:**
- Index foreign key columns
- Use transactions for safety
- Check dependencies before deleting
- Consider soft deletes for important data
- Name constraints explicitly
- Log cascading deletes
- Monitor cascade depth and performance

**Remember:** Cascading deletes are powerful but irreversible. Always consider the implications and test thoroughly before implementing in production!
