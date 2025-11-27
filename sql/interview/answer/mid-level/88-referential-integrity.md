# 88. What is referential integrity?

## Definition

**Referential integrity** is a database constraint that ensures relationships between tables remain consistent. It guarantees that a foreign key value in one table always refers to an existing primary key value in the referenced table, preventing orphaned records and maintaining data consistency.

## Core Concept

Referential integrity enforces the rule: **"A foreign key must either be NULL or match an existing primary key value in the referenced table."**

```
Parent Table (Customers)          Child Table (Orders)
┌─────────────────┐              ┌─────────────────┐
│ customer_id (PK)│◄─────────────│ customer_id (FK)│
│ name            │              │ order_id        │
│ email           │              │ order_date      │
└─────────────────┘              └─────────────────┘

Referential Integrity ensures:
- Every customer_id in Orders exists in Customers
- Can't delete a customer who has orders (without CASCADE)
- Can't insert an order with non-existent customer_id
```

## Why Referential Integrity Matters

### Without Referential Integrity (Problems)

```sql
-- Create tables WITHOUT foreign key constraints
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT,  -- No foreign key constraint!
    order_date DATE
);

-- Problem 1: Can insert invalid customer_id
INSERT INTO orders (customer_id, order_date) 
VALUES (999, '2024-01-01');  -- customer_id 999 doesn't exist!

-- Problem 2: Can delete customer with existing orders
DELETE FROM customers WHERE customer_id = 1;
-- Now orders for customer 1 are orphaned!

-- Problem 3: No data consistency
SELECT o.*, c.customer_name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id;
-- Returns orders with NULL customer_name (orphaned records)
```

### With Referential Integrity (Protected)

```sql
-- Create tables WITH foreign key constraints
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Protection 1: Can't insert invalid customer_id
INSERT INTO orders (customer_id, order_date) 
VALUES (999, '2024-01-01');
-- ERROR: insert or update on table "orders" violates foreign key constraint
-- DETAIL: Key (customer_id)=(999) is not present in table "customers"

-- Protection 2: Can't delete customer with existing orders
DELETE FROM customers WHERE customer_id = 1;
-- ERROR: update or delete on table "customers" violates foreign key constraint
-- DETAIL: Key (customer_id)=(1) is still referenced from table "orders"

-- Protection 3: Data consistency guaranteed
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;
-- All orders have valid customers
```

## Implementing Referential Integrity

### Basic Foreign Key Constraint

```sql
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL
);

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    -- Foreign key constraint ensures referential integrity
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
```

### Named Foreign Key Constraint

```sql
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    -- Named constraint for easier management
    CONSTRAINT fk_employees_department 
        FOREIGN KEY (department_id) 
        REFERENCES departments(department_id)
);
```

### Adding Foreign Key to Existing Table

```sql
-- Add foreign key constraint to existing table
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_customer 
FOREIGN KEY (customer_id) 
REFERENCES customers(customer_id);
```

## Referential Actions

Referential integrity constraints can specify what happens when referenced data is modified or deleted.

### ON DELETE Actions

#### 1. RESTRICT (Default)

Prevents deletion if referenced records exist.

```sql
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE RESTRICT  -- Default behavior
);

-- Attempt to delete customer with orders
DELETE FROM customers WHERE customer_id = 1;
-- ERROR: cannot delete because orders reference this customer
```

#### 2. CASCADE

Automatically deletes child records when parent is deleted.

```sql
CREATE TABLE blog_posts (
    post_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES blog_posts(post_id)
        ON DELETE CASCADE  -- Delete comments when post is deleted
);

-- Delete post
DELETE FROM blog_posts WHERE post_id = 1;
-- All comments for post_id = 1 are automatically deleted
```

#### 3. SET NULL

Sets foreign key to NULL when parent is deleted.

```sql
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    category_id INT,  -- Nullable
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE SET NULL  -- Set to NULL when category is deleted
);

-- Delete category
DELETE FROM categories WHERE category_id = 5;
-- Products in category 5 now have category_id = NULL
```

#### 4. SET DEFAULT

Sets foreign key to its default value when parent is deleted.

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL
);

-- Insert a default "unassigned" user
INSERT INTO users (user_id, username) VALUES (1, 'unassigned');

CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    task_name VARCHAR(200) NOT NULL,
    assigned_to INT DEFAULT 1,  -- Default to "unassigned" user
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
        ON DELETE SET DEFAULT  -- Set to default when user is deleted
);

-- Delete user
DELETE FROM users WHERE user_id = 5;
-- Tasks assigned to user 5 now have assigned_to = 1 (unassigned)
```

#### 5. NO ACTION

Similar to RESTRICT but can be deferred until end of transaction.

```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE NO ACTION
);
```

### ON UPDATE Actions

Control what happens when the referenced primary key is updated.

```sql
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON UPDATE CASCADE  -- Update foreign key when primary key changes
        ON DELETE RESTRICT
);

-- Update customer_id
UPDATE customers SET customer_id = 999 WHERE customer_id = 1;
-- All orders with customer_id = 1 automatically update to 999
```

## Real-World Examples

### Example 1: E-Commerce System

```sql
-- Parent table: customers
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Child table: orders (enforces referential integrity)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT NOW(),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    CONSTRAINT fk_orders_customer 
        FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT  -- Can't delete customers with orders
        ON UPDATE CASCADE
);

-- Grandchild table: order_items
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_orderitems_order 
        FOREIGN KEY (order_id) 
        REFERENCES orders(order_id)
        ON DELETE CASCADE,  -- Delete items when order is deleted
    CONSTRAINT fk_orderitems_product 
        FOREIGN KEY (product_id) 
        REFERENCES products(product_id)
        ON DELETE RESTRICT  -- Can't delete products with order items
);

-- Referential integrity ensures:
-- 1. Every order belongs to a valid customer
-- 2. Can't delete a customer with pending orders
-- 3. Every order item belongs to a valid order and product
-- 4. Deleting an order automatically removes its items
```

### Example 2: University Database

```sql
-- Departments table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    budget DECIMAL(12,2)
);

-- Professors table
CREATE TABLE professors (
    professor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    CONSTRAINT fk_professors_department 
        FOREIGN KEY (department_id) 
        REFERENCES departments(department_id)
        ON DELETE RESTRICT  -- Can't delete department with professors
);

-- Courses table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    professor_id INT,  -- Nullable, course can exist without assigned professor
    CONSTRAINT fk_courses_department 
        FOREIGN KEY (department_id) 
        REFERENCES departments(department_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_courses_professor 
        FOREIGN KEY (professor_id) 
        REFERENCES professors(professor_id)
        ON DELETE SET NULL  -- Unassign professor if they're deleted
);

-- Students table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    major_department_id INT,
    CONSTRAINT fk_students_department 
        FOREIGN KEY (major_department_id) 
        REFERENCES departments(department_id)
        ON DELETE SET NULL  -- Keep student if department is deleted
);

-- Enrollments (junction table with referential integrity)
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade CHAR(2),
    PRIMARY KEY (student_id, course_id),
    CONSTRAINT fk_enrollments_student 
        FOREIGN KEY (student_id) 
        REFERENCES students(student_id)
        ON DELETE CASCADE,  -- Remove enrollments when student leaves
    CONSTRAINT fk_enrollments_course 
        FOREIGN KEY (course_id) 
        REFERENCES courses(course_id)
        ON DELETE CASCADE   -- Remove enrollments when course is cancelled
);
```

### Example 3: Blog Platform

```sql
-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Posts table
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    author_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    published_at TIMESTAMP,
    CONSTRAINT fk_posts_author 
        FOREIGN KEY (author_id) 
        REFERENCES users(user_id)
        ON DELETE RESTRICT  -- Can't delete users with posts
);

-- Comments table
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    parent_comment_id INT,  -- For nested comments
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_comments_post 
        FOREIGN KEY (post_id) 
        REFERENCES posts(post_id)
        ON DELETE CASCADE,  -- Delete comments when post is deleted
    CONSTRAINT fk_comments_author 
        FOREIGN KEY (author_id) 
        REFERENCES users(user_id)
        ON DELETE CASCADE,  -- Delete comments when user is deleted
    CONSTRAINT fk_comments_parent 
        FOREIGN KEY (parent_comment_id) 
        REFERENCES comments(comment_id)
        ON DELETE CASCADE   -- Delete replies when parent comment is deleted
);

-- Likes table
CREATE TABLE post_likes (
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    liked_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_likes_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_likes_post 
        FOREIGN KEY (post_id) 
        REFERENCES posts(post_id)
        ON DELETE CASCADE
);
```

## Checking Referential Integrity

### View Foreign Key Constraints

```sql
-- Query to see all foreign key constraints in a database
SELECT
    tc.table_name AS child_table,
    kcu.column_name AS child_column,
    ccu.table_name AS parent_table,
    ccu.column_name AS parent_column,
    tc.constraint_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;
```

### Test Referential Integrity

```sql
-- Find orphaned records (shouldn't exist with proper RI)
SELECT o.*
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL;

-- Find records that would violate RI if constraint was added
SELECT DISTINCT customer_id
FROM orders
WHERE customer_id NOT IN (SELECT customer_id FROM customers);
```

## Temporarily Disabling Referential Integrity

**Warning:** Only use during data migration or bulk operations, and re-enable immediately after.

```sql
-- Disable triggers (including foreign key checks)
SET session_replication_role = replica;

-- Perform operations...

-- Re-enable triggers
SET session_replication_role = DEFAULT;
```

## Managing Referential Integrity

### Adding Constraint to Existing Data

```sql
-- First, fix any violations
DELETE FROM orders 
WHERE customer_id NOT IN (SELECT customer_id FROM customers);

-- Then add the constraint
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer
FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
```

### Removing a Constraint

```sql
-- Drop foreign key constraint
ALTER TABLE orders 
DROP CONSTRAINT fk_orders_customer;
```

### Deferring Constraint Checks

```sql
-- Create deferrable constraint
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    CONSTRAINT fk_orders_customer 
        FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id)
        DEFERRABLE INITIALLY DEFERRED
);

-- Constraint is checked at transaction commit, not immediately
BEGIN;
    INSERT INTO orders (customer_id, order_id) VALUES (999, 1);
    INSERT INTO customers (customer_id, customer_name) VALUES (999, 'New Customer');
COMMIT;  -- Constraint checked here
```

## Benefits of Referential Integrity

### 1. Data Consistency

Ensures all relationships are valid, preventing orphaned records.

### 2. Data Quality

Maintains accurate and reliable data across related tables.

### 3. Automatic Enforcement

Database automatically validates relationships, reducing application code.

### 4. Clear Documentation

Foreign keys document table relationships explicitly.

### 5. Query Optimization

Database can use foreign key information for query optimization.

### 6. Simplified Application Logic

Don't need to manually check if referenced records exist.

## Common Scenarios

### Scenario 1: Preventing Orphaned Records

```sql
-- With referential integrity
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- This fails:
INSERT INTO orders (customer_id) VALUES (999);
-- ERROR: foreign key violation

-- Must insert customer first:
INSERT INTO customers (customer_id, name) VALUES (999, 'John');
INSERT INTO orders (customer_id) VALUES (999);  -- Now succeeds
```

### Scenario 2: Cascading Deletes for Related Data

```sql
CREATE TABLE shopping_carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES shopping_carts(cart_id)
        ON DELETE CASCADE  -- Delete cart items when cart is deleted
);

-- Delete cart
DELETE FROM shopping_carts WHERE cart_id = 123;
-- All cart items automatically deleted
```

### Scenario 3: Maintaining Historical Data

```sql
CREATE TABLE order_history (
    history_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,  -- Denormalized snapshot
    order_date TIMESTAMP NOT NULL,
    -- Use RESTRICT to preserve history
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE RESTRICT  -- Can't delete orders with history
);
```

## Best Practices

### 1. Always Define Foreign Keys

```sql
-- ✅ GOOD: Explicit foreign key
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- ❌ BAD: No foreign key constraint
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL  -- No referential integrity!
);
```

### 2. Name Constraints Explicitly

```sql
-- ✅ GOOD: Named constraint
CONSTRAINT fk_orders_customer 
    FOREIGN KEY (customer_id) 
    REFERENCES customers(customer_id)

-- ❌ OKAY but less maintainable: Auto-generated name
FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
```

### 3. Choose Appropriate Referential Actions

```sql
-- Historical/permanent data: RESTRICT
FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    ON DELETE RESTRICT

-- Dependent data: CASCADE
FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE

-- Optional relationships: SET NULL
FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
    ON DELETE SET NULL
```

### 4. Index Foreign Key Columns

```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Create index on foreign key for performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

### 5. Document Referential Integrity Rules

```sql
COMMENT ON CONSTRAINT fk_orders_customer ON orders IS
'Orders must belong to a valid customer. Cannot delete customers with orders.';
```

## Summary

**Referential integrity** is a fundamental database concept that:

- **Ensures** foreign key values always reference existing primary key values
- **Prevents** orphaned records and data inconsistencies
- **Enforces** relationships between tables automatically
- **Supports** various actions (CASCADE, RESTRICT, SET NULL, etc.) when data changes
- **Maintains** data quality and consistency

**Key components:**
- Foreign key constraints
- Primary key references
- Referential actions (ON DELETE, ON UPDATE)

**Benefits:**
- Data consistency and accuracy
- Automatic validation
- Clear documentation of relationships
- Reduced application complexity

**Remember:** Referential integrity is enforced at the database level, ensuring data consistency regardless of which application or user accesses the database.
