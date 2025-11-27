# 84. What is a one-to-many relationship?

## Definition

A **one-to-many (1:N) relationship** is the most common database relationship where one record in a parent table can be associated with multiple records in a child table, but each record in the child table is associated with only one record in the parent table.

## Characteristics

- **Parent table**: Contains the "one" side of the relationship
- **Child table**: Contains the "many" side of the relationship
- **Foreign key**: Placed in the child table, referencing the parent table's primary key
- **Most common**: The majority of database relationships are one-to-many
- **Natural hierarchy**: Represents parent-child or owner-owned relationships

## Visual Representation

```
┌─────────────────┐         ┌─────────────────┐
│  Parent Table   │         │  Child Table    │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │───1:N───│ id (PK)         │
│ ...             │         │ parent_id (FK)  │
└─────────────────┘         │ ...             │
                            └─────────────────┘

One parent → Many children
Each child → One parent
```

## Basic Implementation

The foreign key is always placed in the "many" side of the relationship.

```sql
-- Parent table (the "one" side)
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20)
);

-- Child table (the "many" side)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,  -- Foreign key to parent
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
```

## Common Examples

### 1. Customer and Orders

One customer can have many orders, but each order belongs to one customer.

```sql
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT NOW(),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE RESTRICT  -- Prevent deleting customer with orders
        ON UPDATE CASCADE
);

-- Create index on foreign key for performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Insert data
INSERT INTO customers (first_name, last_name, email)
VALUES ('John', 'Doe', 'john@example.com');

INSERT INTO orders (customer_id, total_amount)
VALUES 
    (1, 150.00),
    (1, 75.50),
    (1, 220.00);

-- Query: Get customer with all their orders
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    COUNT(o.order_id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name;
```

### 2. Department and Employees

One department has many employees, but each employee belongs to one department.

```sql
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(100),
    budget DECIMAL(12,2)
);

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department_id INT NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE RESTRICT  -- Can't delete department with employees
        ON UPDATE CASCADE
);

CREATE INDEX idx_employees_department_id ON employees(department_id);

-- Insert sample data
INSERT INTO departments (department_name, location, budget)
VALUES 
    ('Engineering', 'Building A', 1000000.00),
    ('Sales', 'Building B', 750000.00),
    ('HR', 'Building C', 250000.00);

INSERT INTO employees (first_name, last_name, email, department_id, hire_date, salary)
VALUES 
    ('Alice', 'Smith', 'alice@company.com', 1, '2020-01-15', 85000.00),
    ('Bob', 'Johnson', 'bob@company.com', 1, '2019-06-01', 95000.00),
    ('Carol', 'Williams', 'carol@company.com', 2, '2021-03-20', 70000.00);

-- Query: Department with employee count and average salary
SELECT 
    d.department_name,
    d.location,
    COUNT(e.employee_id) AS employee_count,
    AVG(e.salary) AS avg_salary,
    SUM(e.salary) AS total_payroll
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_id, d.department_name, d.location
ORDER BY employee_count DESC;
```

### 3. Blog Posts and Comments

One blog post can have many comments, but each comment belongs to one post.

```sql
CREATE TABLE blog_posts (
    post_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    parent_comment_id INT,  -- For nested comments (also 1:many)
    created_at TIMESTAMP DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT false,
    FOREIGN KEY (post_id) REFERENCES blog_posts(post_id)
        ON DELETE CASCADE,  -- Delete comments when post is deleted
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- Query: Posts with comment counts
SELECT 
    bp.post_id,
    bp.title,
    bp.published_at,
    COUNT(c.comment_id) AS comment_count,
    COUNT(c.comment_id) FILTER (WHERE c.is_approved) AS approved_comment_count
FROM blog_posts bp
LEFT JOIN comments c ON bp.post_id = c.post_id
GROUP BY bp.post_id, bp.title, bp.published_at
ORDER BY comment_count DESC;
```

### 4. Authors and Books

One author can write many books, but each book has one primary author.

```sql
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birth_date DATE,
    nationality VARCHAR(50),
    biography TEXT
);

CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    isbn VARCHAR(13) UNIQUE NOT NULL,
    author_id INT NOT NULL,
    publication_date DATE,
    page_count INT,
    genre VARCHAR(50),
    price DECIMAL(8,2),
    FOREIGN KEY (author_id) REFERENCES authors(author_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX idx_books_author_id ON books(author_id);
CREATE INDEX idx_books_genre ON books(genre);

-- Query: Authors with their books
SELECT 
    a.author_id,
    a.first_name || ' ' || a.last_name AS author_name,
    COUNT(b.book_id) AS book_count,
    MIN(b.publication_date) AS first_book_date,
    MAX(b.publication_date) AS latest_book_date
FROM authors a
LEFT JOIN books b ON a.author_id = b.author_id
GROUP BY a.author_id, author_name;
```

### 5. Categories and Products

One category contains many products, but each product belongs to one category.

```sql
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id INT,  -- For hierarchical categories
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX idx_products_category_id ON products(category_id);

-- Query: Categories with product counts and total inventory value
SELECT 
    c.category_name,
    COUNT(p.product_id) AS product_count,
    SUM(p.stock_quantity) AS total_items,
    SUM(p.stock_quantity * p.price) AS inventory_value
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id
WHERE c.is_active = true
GROUP BY c.category_id, c.category_name
ORDER BY inventory_value DESC;
```

## Referential Actions

Control what happens to child records when parent records are modified.

### ON DELETE Options

```sql
-- RESTRICT: Prevent deletion if child records exist (default)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE RESTRICT
);

-- CASCADE: Automatically delete child records
CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE  -- Delete items when order is deleted
);

-- SET NULL: Set foreign key to NULL
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INT,  -- Nullable
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE SET NULL  -- Keep product but remove category
);

-- SET DEFAULT: Set to default value
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    assigned_to INT DEFAULT 1,  -- Default user
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
        ON DELETE SET DEFAULT
);

-- NO ACTION: Similar to RESTRICT but check can be deferred
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE NO ACTION
);
```

### ON UPDATE Options

```sql
-- CASCADE: Update foreign key when primary key changes
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON UPDATE CASCADE  -- Update order's customer_id if customer_id changes
);
```

## Querying One-to-Many Relationships

### Get Parent with All Children

```sql
-- Using INNER JOIN (only parents with children)
SELECT 
    c.customer_id,
    c.customer_name,
    o.order_id,
    o.order_date,
    o.total_amount
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
ORDER BY c.customer_id, o.order_date;
```

### Get Parent with or without Children

```sql
-- Using LEFT JOIN (all parents, even without children)
SELECT 
    c.customer_id,
    c.customer_name,
    o.order_id,
    o.order_date,
    o.total_amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
ORDER BY c.customer_id, o.order_date;
```

### Count Children per Parent

```sql
SELECT 
    c.customer_id,
    c.customer_name,
    COUNT(o.order_id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name
HAVING COUNT(o.order_id) > 0;  -- Only customers with orders
```

### Find Parents without Children

```sql
-- Method 1: Using LEFT JOIN and NULL check
SELECT c.customer_id, c.customer_name
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;

-- Method 2: Using NOT EXISTS
SELECT c.customer_id, c.customer_name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
);
```

### Aggregate Children Data

```sql
SELECT 
    c.customer_id,
    c.customer_name,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_spent,
    COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
    MAX(o.order_date) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name;
```

## Best Practices

### 1. Always Index Foreign Keys

```sql
-- Foreign key columns should be indexed for performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### 2. Use Appropriate Referential Actions

```sql
-- Consider the business logic
CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE  -- Delete items with order
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE RESTRICT  -- Prevent deleting customer with orders
);
```

### 3. Use NOT NULL for Required Relationships

```sql
-- If every child MUST have a parent
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,  -- Every order must have a customer
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- If child can exist without parent
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INT,  -- Product can exist without category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
```

### 4. Name Foreign Keys Clearly

```sql
-- Good naming convention
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    CONSTRAINT fk_orders_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
```

### 5. Consider Performance for Large Datasets

```sql
-- Use partial indexes for common queries
CREATE INDEX idx_active_orders_customer 
ON orders(customer_id) 
WHERE status = 'active';

-- Use covering indexes
CREATE INDEX idx_orders_customer_date_amount 
ON orders(customer_id, order_date, total_amount);
```

## Common Patterns

### Self-Referencing One-to-Many

```sql
-- Employee-Manager relationship
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    manager_id INT,  -- References another employee
    FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
);

-- Query: Get employee with their manager
SELECT 
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    m.first_name || ' ' || m.last_name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;

-- Query: Get manager with all their direct reports
SELECT 
    m.employee_id AS manager_id,
    m.first_name || ' ' || m.last_name AS manager_name,
    COUNT(e.employee_id) AS direct_reports
FROM employees m
LEFT JOIN employees e ON e.manager_id = m.employee_id
GROUP BY m.employee_id, manager_name;
```

### Hierarchical Categories

```sql
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id INT,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

-- Query: Get category with its parent
SELECT 
    c.category_id,
    c.category_name,
    p.category_name AS parent_category
FROM categories c
LEFT JOIN categories p ON c.parent_category_id = p.category_id;
```

## Summary

A **one-to-many relationship** is characterized by:

- **Foreign key** in the "many" side table
- **Most common** relationship type in databases
- **Natural representation** of ownership, containment, or hierarchical structures

**Key implementation points:**
- Place foreign key in child table
- Index foreign key columns
- Choose appropriate referential actions (CASCADE, RESTRICT, etc.)
- Use NOT NULL when relationship is mandatory
- Use LEFT JOIN to include parents without children

**Common examples:**
- Customer → Orders
- Department → Employees  
- Blog Post → Comments
- Author → Books
- Category → Products
