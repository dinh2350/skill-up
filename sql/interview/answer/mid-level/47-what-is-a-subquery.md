# Question 47: What is a subquery?

## Definition

A **subquery** (also called a **nested query** or **inner query**) is a query that is embedded within another SQL statement. The subquery is executed first, and its result is used by the outer query to complete the operation.

### Key Characteristics:

- **Nested structure**: Query within another query
- **Enclosed in parentheses**: Always wrapped in ()
- **Executed first**: Inner query runs before outer query
- **Can return**: Single value, single row, multiple rows, or multiple columns
- **Reusable logic**: Encapsulates complex filtering conditions

## Basic Subquery Syntax

```sql
SELECT column1, column2
FROM table1
WHERE column3 = (SELECT column4 FROM table2 WHERE condition);
```

## Types of Subqueries

### 1. **Scalar Subqueries** (Single Value)

Returns exactly one row and one column:

```sql
-- Find employees with salary higher than average
SELECT employee_id, first_name, last_name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Get customer with highest order total
SELECT customer_id, customer_name
FROM customers
WHERE customer_id = (
    SELECT customer_id
    FROM orders
    WHERE total_amount = (SELECT MAX(total_amount) FROM orders)
);
```

### 2. **Row Subqueries** (Single Row, Multiple Columns)

Returns one row but multiple columns:

```sql
-- Find employee with same department and salary as employee ID 100
SELECT employee_id, first_name, last_name
FROM employees
WHERE (department_id, salary) = (
    SELECT department_id, salary
    FROM employees
    WHERE employee_id = 100
);
```

### 3. **Column Subqueries** (Multiple Rows, Single Column)

Returns multiple rows but single column:

```sql
-- Find customers who have placed orders
SELECT customer_id, customer_name
FROM customers
WHERE customer_id IN (
    SELECT DISTINCT customer_id
    FROM orders
    WHERE order_status = 'completed'
);

-- Find products not in any order
SELECT product_id, product_name
FROM products
WHERE product_id NOT IN (
    SELECT DISTINCT product_id
    FROM order_items
    WHERE product_id IS NOT NULL
);
```

### 4. **Table Subqueries** (Multiple Rows and Columns)

Returns multiple rows and columns:

```sql
-- Compare with department averages
SELECT
    e.employee_id,
    e.first_name,
    e.salary,
    dept_avg.avg_salary
FROM employees e
JOIN (
    SELECT department_id, AVG(salary) as avg_salary
    FROM employees
    GROUP BY department_id
) dept_avg ON e.department_id = dept_avg.department_id
WHERE e.salary > dept_avg.avg_salary;
```

## Subquery Locations

### 1. **SELECT Clause Subqueries**

```sql
-- Add calculated columns using subqueries
SELECT
    customer_id,
    customer_name,
    (SELECT COUNT(*)
     FROM orders o
     WHERE o.customer_id = c.customer_id) as total_orders,
    (SELECT COALESCE(SUM(total_amount), 0)
     FROM orders o
     WHERE o.customer_id = c.customer_id
     AND o.order_status = 'completed') as total_spent
FROM customers c;
```

### 2. **FROM Clause Subqueries** (Derived Tables)

```sql
-- Use subquery as a virtual table
SELECT
    sales_summary.region,
    sales_summary.total_sales,
    sales_summary.avg_sale
FROM (
    SELECT
        region,
        SUM(amount) as total_sales,
        AVG(amount) as avg_sale,
        COUNT(*) as sale_count
    FROM sales
    WHERE sale_date >= '2023-01-01'
    GROUP BY region
) sales_summary
WHERE sales_summary.sale_count > 100;
```

### 3. **WHERE Clause Subqueries**

```sql
-- Filter based on subquery results
SELECT product_id, product_name, price
FROM products
WHERE category_id IN (
    SELECT category_id
    FROM categories
    WHERE category_name IN ('Electronics', 'Books')
);

-- Find customers with above-average order frequency
SELECT customer_id, customer_name
FROM customers
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
    GROUP BY customer_id
    HAVING COUNT(*) > (
        SELECT AVG(order_count)
        FROM (
            SELECT COUNT(*) as order_count
            FROM orders
            GROUP BY customer_id
        ) customer_orders
    )
);
```

### 4. **HAVING Clause Subqueries**

```sql
-- Filter grouped results using subqueries
SELECT
    department,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > (
    SELECT AVG(salary) * 1.1  -- 10% above company average
    FROM employees
);
```

## Common Subquery Operators

### 1. **IN / NOT IN**

```sql
-- Find customers who ordered specific products
SELECT customer_id, customer_name
FROM customers
WHERE customer_id IN (
    SELECT DISTINCT customer_id
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE oi.product_id IN (1, 2, 3)
);

-- Find employees not in management positions
SELECT employee_id, first_name, last_name
FROM employees
WHERE employee_id NOT IN (
    SELECT DISTINCT manager_id
    FROM employees
    WHERE manager_id IS NOT NULL
);
```

### 2. **EXISTS / NOT EXISTS**

```sql
-- Find customers who have placed orders (EXISTS is more efficient than IN for large datasets)
SELECT customer_id, customer_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
);

-- Find products never ordered
SELECT product_id, product_name
FROM products p
WHERE NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.product_id = p.product_id
);
```

### 3. **Comparison Operators with ALL/ANY/SOME**

```sql
-- Find products more expensive than ALL products in 'Budget' category
SELECT product_id, product_name, price
FROM products
WHERE price > ALL (
    SELECT price
    FROM products
    WHERE category = 'Budget'
);

-- Find products more expensive than ANY product in 'Premium' category
SELECT product_id, product_name, price
FROM products
WHERE price > ANY (
    SELECT price
    FROM products
    WHERE category = 'Premium'
);
```

## Advanced Subquery Examples

### 1. **Multiple Level Nesting**

```sql
-- Find employees in departments with highest average salaries
SELECT employee_id, first_name, last_name, department_id
FROM employees
WHERE department_id IN (
    SELECT department_id
    FROM (
        SELECT
            department_id,
            AVG(salary) as avg_salary
        FROM employees
        GROUP BY department_id
    ) dept_averages
    WHERE avg_salary = (
        SELECT MAX(avg_salary)
        FROM (
            SELECT AVG(salary) as avg_salary
            FROM employees
            GROUP BY department_id
        ) all_dept_averages
    )
);
```

### 2. **Subqueries with Window Functions**

```sql
-- Find top 2 employees by salary in each department
SELECT
    employee_id,
    first_name,
    last_name,
    department_id,
    salary
FROM (
    SELECT
        employee_id,
        first_name,
        last_name,
        department_id,
        salary,
        ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as salary_rank
    FROM employees
) ranked_employees
WHERE salary_rank <= 2;
```

### 3. **Complex Business Logic**

```sql
-- Find customers whose last order was more than 6 months ago
SELECT
    c.customer_id,
    c.customer_name,
    c.email
FROM customers c
WHERE c.customer_id IN (
    SELECT customer_id
    FROM orders
    WHERE customer_id = c.customer_id
    AND order_date = (
        SELECT MAX(order_date)
        FROM orders o2
        WHERE o2.customer_id = c.customer_id
    )
    AND order_date < CURRENT_DATE - INTERVAL '6 months'
);
```

## Performance Considerations

### 1. **Subquery vs JOIN Performance**

```sql
-- Subquery approach (might be slower for large datasets)
SELECT customer_id, customer_name
FROM customers
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
    WHERE order_status = 'completed'
);

-- JOIN approach (often faster)
SELECT DISTINCT c.customer_id, c.customer_name
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_status = 'completed';
```

### 2. **EXISTS vs IN Performance**

```sql
-- EXISTS (generally more efficient, especially with NULLs)
SELECT customer_id, customer_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
    AND o.order_status = 'completed'
);

-- IN (can have issues with NULL values)
SELECT customer_id, customer_name
FROM customers
WHERE customer_id IN (
    SELECT customer_id  -- Problem if this contains NULLs
    FROM orders
    WHERE order_status = 'completed'
);
```

### 3. **Indexing for Subqueries**

```sql
-- Create indexes to optimize subquery performance
CREATE INDEX idx_orders_customer_status ON orders(customer_id, order_status);
CREATE INDEX idx_employees_department_salary ON employees(department_id, salary);

-- Query that benefits from the indexes
SELECT employee_id, first_name, salary
FROM employees e
WHERE department_id = (
    SELECT department_id
    FROM departments
    WHERE department_name = 'Engineering'
)
AND salary > (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department_id = e.department_id
);
```

## Common Use Cases

### 1. **Data Validation and Quality Checks**

```sql
-- Find duplicate customers by email
SELECT customer_id, customer_name, email
FROM customers c1
WHERE EXISTS (
    SELECT 1
    FROM customers c2
    WHERE c2.email = c1.email
    AND c2.customer_id != c1.customer_id
);

-- Find orders without corresponding customers (data integrity check)
SELECT order_id, customer_id, total_amount
FROM orders
WHERE customer_id NOT IN (
    SELECT customer_id
    FROM customers
    WHERE customer_id IS NOT NULL
);
```

### 2. **Business Analytics**

```sql
-- Find products performing better than category average
SELECT
    p.product_id,
    p.product_name,
    p.category_id,
    sales_data.total_sales
FROM products p
JOIN (
    SELECT
        oi.product_id,
        SUM(oi.quantity * oi.unit_price) as total_sales
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY oi.product_id
) sales_data ON p.product_id = sales_data.product_id
WHERE sales_data.total_sales > (
    SELECT AVG(category_sales.total_sales)
    FROM (
        SELECT
            p2.product_id,
            SUM(oi2.quantity * oi2.unit_price) as total_sales
        FROM products p2
        JOIN order_items oi2 ON p2.product_id = oi2.product_id
        JOIN orders o2 ON oi2.order_id = o2.order_id
        WHERE p2.category_id = p.category_id
        AND o2.order_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY p2.product_id
    ) category_sales
);
```

### 3. **Reporting and Dashboard Queries**

```sql
-- Create a summary report with subqueries
SELECT
    'Total Customers' as metric,
    (SELECT COUNT(*) FROM customers)::TEXT as value
UNION ALL
SELECT
    'Active Customers' as metric,
    (SELECT COUNT(DISTINCT customer_id)
     FROM orders
     WHERE order_date >= CURRENT_DATE - INTERVAL '30 days')::TEXT
UNION ALL
SELECT
    'Average Order Value' as metric,
    '$' || ROUND((SELECT AVG(total_amount) FROM orders), 2)::TEXT
UNION ALL
SELECT
    'Top Product Category' as metric,
    (SELECT c.category_name
     FROM categories c
     JOIN products p ON c.category_id = p.category_id
     JOIN order_items oi ON p.product_id = oi.product_id
     GROUP BY c.category_id, c.category_name
     ORDER BY SUM(oi.quantity * oi.unit_price) DESC
     LIMIT 1);
```

## Best Practices

### 1. **Readability and Maintenance**

```sql
-- Use meaningful aliases and formatting
SELECT
    c.customer_id,
    c.customer_name,
    recent_orders.order_count
FROM customers c
JOIN (
    SELECT
        customer_id,
        COUNT(*) as order_count
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY customer_id
) recent_orders ON c.customer_id = recent_orders.customer_id
WHERE recent_orders.order_count > 5;
```

### 2. **Avoid Deep Nesting**

```sql
-- Instead of deeply nested subqueries, use CTEs
WITH department_averages AS (
    SELECT
        department_id,
        AVG(salary) as avg_salary
    FROM employees
    GROUP BY department_id
),
high_performing_depts AS (
    SELECT department_id
    FROM department_averages
    WHERE avg_salary > (SELECT AVG(avg_salary) FROM department_averages)
)
SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    e.salary
FROM employees e
JOIN high_performing_depts hpd ON e.department_id = hpd.department_id;
```

### 3. **Handle NULL Values Properly**

```sql
-- Be careful with NOT IN when NULLs are possible
SELECT customer_id, customer_name
FROM customers
WHERE customer_id NOT IN (
    SELECT customer_id
    FROM orders
    WHERE customer_id IS NOT NULL  -- Explicitly exclude NULLs
    AND order_status = 'cancelled'
);

-- Or use NOT EXISTS (safer with NULLs)
SELECT customer_id, customer_name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
    AND o.order_status = 'cancelled'
);
```

## Common Pitfalls

1. **Performance Issues**: Subqueries can be slower than JOINs for large datasets
2. **NULL Handling**: NOT IN with NULL values can produce unexpected results
3. **Deep Nesting**: Makes queries hard to read and maintain
4. **Inefficient Execution**: Some subqueries are executed for each row of the outer query
5. **Missing Indexes**: Subquery predicates need appropriate indexing

Subqueries are powerful tools for creating complex, readable SQL that encapsulates business logic and enables sophisticated data analysis and reporting.
