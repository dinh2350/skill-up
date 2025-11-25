# Question 43: What are views?

## What are Views?

A **view** is a virtual table based on the result set of an SQL statement. It contains rows and columns just like a real table, but it doesn't store data physically. Instead, it's a saved query that dynamically retrieves data from one or more underlying tables when accessed.

### Key Characteristics:

- **Virtual Table**: No physical storage of data
- **Dynamic**: Always shows current data from underlying tables
- **Reusable**: Can be queried like a regular table
- **Security**: Can hide sensitive columns or rows
- **Simplification**: Makes complex queries easier to use

## Basic View Syntax

### Creating a View:

```sql
CREATE VIEW view_name AS
SELECT column1, column2, ...
FROM table_name
WHERE condition;
```

### Basic Example:

```sql
-- Create a view for active customers
CREATE VIEW active_customers AS
SELECT customer_id, name, email, registration_date
FROM customers
WHERE status = 'active';

-- Query the view
SELECT * FROM active_customers;
```

## Types of Views

### 1. Simple Views

Based on a single table with basic operations.

```sql
-- Simple view showing only essential employee information
CREATE VIEW employee_summary AS
SELECT employee_id, first_name, last_name, department, salary
FROM employees
WHERE status = 'active';
```

### 2. Complex Views

Involve multiple tables, joins, aggregations, or complex logic.

```sql
-- Complex view with joins and aggregations
CREATE VIEW sales_summary AS
SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    d.department_name,
    COUNT(s.sale_id) as total_sales,
    SUM(s.amount) as total_revenue,
    AVG(s.amount) as avg_sale_amount
FROM employees e
JOIN departments d ON e.department_id = d.department_id
LEFT JOIN sales s ON e.employee_id = s.employee_id
WHERE e.status = 'active'
GROUP BY e.employee_id, e.first_name, e.last_name, d.department_name;
```

## Benefits of Using Views

### 1. **Data Security and Access Control**

```sql
-- Hide sensitive salary information
CREATE VIEW public_employee_info AS
SELECT employee_id, first_name, last_name, department, email
FROM employees;

-- Grant access to view instead of the full table
GRANT SELECT ON public_employee_info TO public_users;
```

### 2. **Query Simplification**

```sql
-- Instead of writing this complex query repeatedly:
SELECT
    p.product_name,
    c.category_name,
    s.supplier_name,
    i.quantity_in_stock,
    p.unit_price
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN suppliers s ON p.supplier_id = s.supplier_id
JOIN inventory i ON p.product_id = i.product_id
WHERE i.quantity_in_stock > 0;

-- Create a view and use it simply:
CREATE VIEW available_products AS
SELECT
    p.product_name,
    c.category_name,
    s.supplier_name,
    i.quantity_in_stock,
    p.unit_price
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN suppliers s ON p.supplier_id = s.supplier_id
JOIN inventory i ON p.product_id = i.product_id
WHERE i.quantity_in_stock > 0;

-- Now just query the view
SELECT * FROM available_products WHERE category_name = 'Electronics';
```

### 3. **Data Abstraction**

```sql
-- Abstract complex business logic
CREATE VIEW customer_value_tier AS
SELECT
    customer_id,
    name,
    email,
    CASE
        WHEN total_spent >= 10000 THEN 'Platinum'
        WHEN total_spent >= 5000 THEN 'Gold'
        WHEN total_spent >= 1000 THEN 'Silver'
        ELSE 'Bronze'
    END as customer_tier,
    total_spent
FROM (
    SELECT
        c.customer_id,
        c.name,
        c.email,
        COALESCE(SUM(o.total_amount), 0) as total_spent
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, c.name, c.email
) customer_totals;
```

### 4. **Centralized Business Logic**

```sql
-- Centralize calculation logic
CREATE VIEW monthly_sales_report AS
SELECT
    EXTRACT(YEAR FROM order_date) as year,
    EXTRACT(MONTH FROM order_date) as month,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM orders
WHERE order_status = 'completed'
GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
ORDER BY year DESC, month DESC;
```

## View Management

### Viewing Existing Views:

```sql
-- List all views in current database
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public';

-- Get view definition
\d+ view_name  -- In psql
-- or
SELECT definition FROM pg_views WHERE viewname = 'view_name';
```

### Modifying Views:

```sql
-- Replace existing view
CREATE OR REPLACE VIEW employee_summary AS
SELECT employee_id, first_name, last_name, department, salary, hire_date
FROM employees
WHERE status = 'active';

-- Alternative: Drop and recreate
DROP VIEW IF EXISTS employee_summary;
CREATE VIEW employee_summary AS
SELECT employee_id, first_name, last_name, department
FROM employees
WHERE status = 'active';
```

### Dropping Views:

```sql
DROP VIEW view_name;
DROP VIEW IF EXISTS view_name;  -- Won't error if view doesn't exist

-- Drop multiple views
DROP VIEW view1, view2, view3;

-- Drop with dependencies
DROP VIEW view_name CASCADE;  -- Also drops dependent objects
```

## Updatable Views

Some views can be updated (INSERT, UPDATE, DELETE operations).

### Requirements for Updatable Views:

- Based on a single table
- Contains all NOT NULL columns without default values
- No aggregate functions, DISTINCT, GROUP BY, HAVING, UNION
- No window functions or set-returning functions

```sql
-- Updatable view example
CREATE VIEW active_employees AS
SELECT employee_id, first_name, last_name, email, department_id
FROM employees
WHERE status = 'active';

-- These operations work on updatable views:
INSERT INTO active_employees (first_name, last_name, email, department_id)
VALUES ('John', 'Doe', 'john.doe@company.com', 1);

UPDATE active_employees
SET email = 'john.doe.new@company.com'
WHERE employee_id = 100;

DELETE FROM active_employees WHERE employee_id = 100;
```

### Non-Updatable View Example:

```sql
-- This view is NOT updatable due to aggregation
CREATE VIEW department_stats AS
SELECT
    department_id,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary
FROM employees
GROUP BY department_id;

-- This would fail:
-- INSERT INTO department_stats VALUES (5, 10, 50000);  -- ERROR
```

## Advanced View Features

### 1. **Views with Check Options**

```sql
-- Ensure inserted/updated rows satisfy view condition
CREATE VIEW high_salary_employees AS
SELECT employee_id, first_name, last_name, salary
FROM employees
WHERE salary > 50000
WITH CHECK OPTION;

-- This would fail because salary doesn't meet view condition:
-- INSERT INTO high_salary_employees VALUES (1, 'John', 'Doe', 30000);
```

### 2. **Recursive Views** (PostgreSQL 9.1+)

```sql
-- Organizational hierarchy
CREATE RECURSIVE VIEW employee_hierarchy AS
    SELECT employee_id, name, manager_id, 1 as level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    SELECT e.employee_id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id;
```

### 3. **Security-Barrier Views**

```sql
-- For Row Level Security
CREATE VIEW secure_employee_data AS
SELECT employee_id, name, department
FROM employees
WHERE current_user_can_access(employee_id);

ALTER VIEW secure_employee_data SET (security_barrier = true);
```

## Performance Considerations

### 1. **Query Execution**

```sql
-- When you query a view:
SELECT * FROM sales_summary WHERE department_name = 'Sales';

-- PostgreSQL expands it to:
SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    d.department_name,
    COUNT(s.sale_id) as total_sales,
    SUM(s.amount) as total_revenue,
    AVG(s.amount) as avg_sale_amount
FROM employees e
JOIN departments d ON e.department_id = d.department_id
LEFT JOIN sales s ON e.employee_id = s.employee_id
WHERE e.status = 'active' AND d.department_name = 'Sales'
GROUP BY e.employee_id, e.first_name, e.last_name, d.department_name;
```

### 2. **Indexing Considerations**

Views use indexes from underlying tables:

```sql
-- Create index on base table
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);

-- View queries benefit from these indexes
SELECT * FROM employee_summary WHERE department_id = 5;
```

### 3. **View Performance Tips**

- Keep view definitions simple when possible
- Avoid unnecessary columns in SELECT
- Consider materialized views for expensive computations
- Use appropriate WHERE clauses to limit data

## Common Use Cases

### 1. **Reporting Views**

```sql
CREATE VIEW quarterly_sales_report AS
SELECT
    EXTRACT(YEAR FROM order_date) as year,
    EXTRACT(QUARTER FROM order_date) as quarter,
    SUM(total_amount) as revenue,
    COUNT(*) as order_count,
    COUNT(DISTINCT customer_id) as unique_customers
FROM orders
WHERE order_status = 'completed'
GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(QUARTER FROM order_date);
```

### 2. **Data Integration Views**

```sql
CREATE VIEW unified_customer_data AS
SELECT
    c.customer_id,
    c.name,
    c.email,
    a.street_address,
    a.city,
    a.state,
    cp.phone_number,
    COALESCE(SUM(o.total_amount), 0) as lifetime_value
FROM customers c
LEFT JOIN addresses a ON c.customer_id = a.customer_id
LEFT JOIN customer_phones cp ON c.customer_id = cp.customer_id
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name, c.email, a.street_address, a.city, a.state, cp.phone_number;
```

### 3. **Security Views**

```sql
-- Hide sensitive PII
CREATE VIEW customer_public AS
SELECT
    customer_id,
    LEFT(name, 1) || '***' as masked_name,
    REGEXP_REPLACE(email, '(.{2}).*(@.*)', '\1***\2') as masked_email,
    registration_date
FROM customers;
```

## Best Practices

### 1. **Naming Conventions**

```sql
-- Use descriptive names
CREATE VIEW vw_active_employees AS ...;        -- Good
CREATE VIEW employee_view AS ...;              -- Less clear

-- Include purpose in name
CREATE VIEW rpt_monthly_sales AS ...;          -- Reporting view
CREATE VIEW sec_customer_data AS ...;          -- Security view
```

### 2. **Documentation**

```sql
-- Add comments to views
CREATE VIEW customer_summary AS
SELECT
    customer_id,
    name,
    email,
    registration_date
FROM customers
WHERE status = 'active';

COMMENT ON VIEW customer_summary IS
'Active customers only - used by customer service team';
```

### 3. **Dependency Management**

```sql
-- Be careful with view dependencies
-- If you drop a table that a view depends on, the view becomes invalid

-- Check view dependencies before dropping tables
SELECT schemaname, viewname, definition
FROM pg_views
WHERE definition LIKE '%table_name%';
```

### 4. **Version Control**

```sql
-- Use CREATE OR REPLACE for updates
CREATE OR REPLACE VIEW employee_summary AS
SELECT
    employee_id,
    first_name,
    last_name,
    department,
    hire_date  -- Added new column
FROM employees
WHERE status = 'active';
```

## Common Pitfalls

1. **Performance**: Views don't cache results - each query re-executes
2. **Dependencies**: Dropping underlying tables breaks views
3. **Column Changes**: ALTER TABLE on base tables may break views
4. **Security**: Views inherit permissions from base tables
5. **Complex Logic**: Overly complex views can be hard to maintain

## Views vs. Materialized Views

| Aspect         | Views                      | Materialized Views    |
| -------------- | -------------------------- | --------------------- |
| Storage        | No physical storage        | Stores actual data    |
| Performance    | Slower (re-executes query) | Faster (pre-computed) |
| Data Freshness | Always current             | Requires refresh      |
| Disk Usage     | Minimal                    | Uses disk space       |
| Use Case       | Real-time data             | Reports, analytics    |

Views are fundamental database objects that provide data abstraction, security, and query simplification while maintaining real-time access to current data.
