# Question 48: What is a correlated subquery?

## Definition

A **correlated subquery** is a subquery that references columns from the outer query. Unlike regular subqueries that execute once and return a result to the outer query, correlated subqueries execute once for each row processed by the outer query, creating a dependency between the inner and outer queries.

### Key Characteristics:

- **References outer query**: Uses columns from the parent query
- **Row-by-row execution**: Executes once per outer query row
- **Cannot run independently**: Depends on outer query context
- **Performance consideration**: Can be slower due to repeated execution
- **Powerful filtering**: Enables complex row-level comparisons

## Basic Syntax Comparison

### Regular Subquery (Independent):

```sql
-- Executes once, returns a single value
SELECT employee_id, first_name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);  -- Independent subquery
```

### Correlated Subquery (Dependent):

```sql
-- Executes once for each employee row
SELECT employee_id, first_name, salary
FROM employees e1
WHERE salary > (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department_id = e1.department_id  -- References outer query
);
```

## How Correlated Subqueries Work

### Execution Process:

1. **Outer query processes first row**
2. **Inner query executes with values from current outer row**
3. **Inner query returns result for comparison**
4. **Outer query applies filter condition**
5. **Process repeats for each outer query row**

### Visual Example:

```sql
-- Find employees earning more than their department average
SELECT e1.employee_id, e1.first_name, e1.department_id, e1.salary
FROM employees e1
WHERE e1.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.department_id = e1.department_id  -- Correlation here
);

-- Execution flow:
-- Row 1: e1.department_id = 1 → Calculate AVG for dept 1 → Compare salary
-- Row 2: e1.department_id = 2 → Calculate AVG for dept 2 → Compare salary
-- Row 3: e1.department_id = 1 → Calculate AVG for dept 1 → Compare salary (again)
```

## Common Correlated Subquery Patterns

### 1. **EXISTS Pattern**

```sql
-- Find customers who have placed orders
SELECT customer_id, customer_name, email
FROM customers c
WHERE EXISTS (
    SELECT 1  -- Don't need actual values, just checking existence
    FROM orders o
    WHERE o.customer_id = c.customer_id  -- Correlation
    AND o.order_status = 'completed'
);

-- Find products that have never been ordered
SELECT product_id, product_name, price
FROM products p
WHERE NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.product_id = p.product_id  -- Correlation
);
```

### 2. **Comparison with Aggregates**

```sql
-- Find employees with above-department-average salaries
SELECT
    employee_id,
    first_name,
    last_name,
    department_id,
    salary,
    (SELECT AVG(salary)
     FROM employees e2
     WHERE e2.department_id = e1.department_id) as dept_avg_salary
FROM employees e1
WHERE salary > (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department_id = e1.department_id  -- Correlation
);

-- Find products priced higher than their category average
SELECT
    product_id,
    product_name,
    category_id,
    price
FROM products p1
WHERE price > (
    SELECT AVG(price)
    FROM products p2
    WHERE p2.category_id = p1.category_id  -- Correlation
    AND p2.product_id != p1.product_id     -- Exclude current product
);
```

### 3. **Top N per Group**

```sql
-- Find the highest-paid employee in each department
SELECT employee_id, first_name, department_id, salary
FROM employees e1
WHERE salary = (
    SELECT MAX(salary)
    FROM employees e2
    WHERE e2.department_id = e1.department_id  -- Correlation
);

-- Find customers with their most recent order
SELECT
    c.customer_id,
    c.customer_name,
    o.order_date,
    o.total_amount
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date = (
    SELECT MAX(order_date)
    FROM orders o2
    WHERE o2.customer_id = c.customer_id  -- Correlation
);
```

## Advanced Correlated Subquery Examples

### 1. **Running Totals and Cumulative Calculations**

```sql
-- Calculate running total of sales for each salesperson
SELECT
    sale_id,
    salesperson_id,
    sale_date,
    amount,
    (SELECT SUM(s2.amount)
     FROM sales s2
     WHERE s2.salesperson_id = s1.salesperson_id  -- Correlation
     AND s2.sale_date <= s1.sale_date             -- Up to current date
    ) as running_total
FROM sales s1
ORDER BY salesperson_id, sale_date;

-- Count of orders placed by each customer up to each order date
SELECT
    customer_id,
    order_date,
    order_id,
    (SELECT COUNT(*)
     FROM orders o2
     WHERE o2.customer_id = o1.customer_id  -- Correlation
     AND o2.order_date <= o1.order_date     -- Up to current date
    ) as order_sequence_number
FROM orders o1
ORDER BY customer_id, order_date;
```

### 2. **Complex Business Logic**

```sql
-- Find customers whose spending in last 30 days exceeds their historical average
SELECT
    c.customer_id,
    c.customer_name,
    recent_spending.total_recent,
    historical_avg.avg_monthly
FROM customers c
JOIN (
    SELECT
        customer_id,
        SUM(total_amount) as total_recent
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY customer_id
) recent_spending ON c.customer_id = recent_spending.customer_id
JOIN (
    SELECT DISTINCT
        customer_id,
        (SELECT AVG(monthly_total)
         FROM (
             SELECT
                 SUM(total_amount) as monthly_total
             FROM orders o2
             WHERE o2.customer_id = c.customer_id  -- Correlation
             AND o2.order_date < CURRENT_DATE - INTERVAL '30 days'
             GROUP BY DATE_TRUNC('month', o2.order_date)
         ) monthly_totals
        ) as avg_monthly
    FROM customers c
) historical_avg ON c.customer_id = historical_avg.customer_id
WHERE recent_spending.total_recent > historical_avg.avg_monthly * 1.5;
```

### 3. **Data Quality and Duplicate Detection**

```sql
-- Find duplicate customers based on name and email
SELECT
    customer_id,
    customer_name,
    email,
    created_date
FROM customers c1
WHERE EXISTS (
    SELECT 1
    FROM customers c2
    WHERE c2.customer_name = c1.customer_name  -- Correlation
    AND c2.email = c1.email                    -- Correlation
    AND c2.customer_id > c1.customer_id        -- Keep earliest record
);

-- Find employees with duplicate Social Security Numbers
SELECT
    employee_id,
    first_name,
    last_name,
    ssn
FROM employees e1
WHERE EXISTS (
    SELECT 1
    FROM employees e2
    WHERE e2.ssn = e1.ssn                -- Correlation
    AND e2.employee_id != e1.employee_id  -- Different employee
);
```

## Performance Considerations

### 1. **Correlated vs Non-Correlated Performance**

```sql
-- Correlated subquery (potentially slower - O(n²))
SELECT customer_id, customer_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id  -- Executes for each customer
);

-- Non-correlated alternative (often faster - O(n))
SELECT DISTINCT c.customer_id, c.customer_name
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id;

-- Using IN with subquery (non-correlated)
SELECT customer_id, customer_name
FROM customers
WHERE customer_id IN (
    SELECT DISTINCT customer_id FROM orders  -- Executes once
);
```

### 2. **Indexing for Correlated Subqueries**

```sql
-- Create indexes to optimize correlated subquery performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Query that benefits from the customer_id index
SELECT c.customer_id, c.customer_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id  -- Uses idx_orders_customer_id
    AND o.order_status = 'completed'
);
```

### 3. **Optimization Techniques**

```sql
-- Use EXISTS instead of IN when possible (better with NULLs and often faster)
-- Good: EXISTS approach
SELECT customer_id, customer_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
    AND o.total_amount > 1000
);

-- Consider: JOIN approach for better performance
SELECT DISTINCT c.customer_id, c.customer_name
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE o.total_amount > 1000;

-- Window functions can replace some correlated subqueries
-- Instead of correlated subquery for ranking:
SELECT employee_id, first_name, salary,
       RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as salary_rank
FROM employees;

-- Instead of:
SELECT employee_id, first_name, salary
FROM employees e1
WHERE (
    SELECT COUNT(*)
    FROM employees e2
    WHERE e2.department_id = e1.department_id
    AND e2.salary >= e1.salary
) <= 3;  -- Top 3 in each department
```

## Real-World Use Cases

### 1. **Customer Lifecycle Analysis**

```sql
-- Find customers who haven't ordered in their typical frequency
SELECT
    c.customer_id,
    c.customer_name,
    c.email,
    last_order.last_order_date,
    avg_frequency.avg_days_between_orders
FROM customers c
JOIN (
    SELECT
        customer_id,
        MAX(order_date) as last_order_date
    FROM orders
    GROUP BY customer_id
) last_order ON c.customer_id = last_order.customer_id
JOIN (
    SELECT DISTINCT
        customer_id,
        (SELECT AVG(days_between)
         FROM (
             SELECT
                 o2.order_date - LAG(o2.order_date) OVER (ORDER BY o2.order_date) as days_between
             FROM orders o2
             WHERE o2.customer_id = c.customer_id
         ) frequency_calc
         WHERE days_between IS NOT NULL
        ) as avg_days_between_orders
    FROM customers c
) avg_frequency ON c.customer_id = avg_frequency.customer_id
WHERE last_order.last_order_date < CURRENT_DATE - (avg_frequency.avg_days_between_orders * 1.5);
```

### 2. **Inventory Management**

```sql
-- Find products that are selling faster than their reorder point suggests
SELECT
    p.product_id,
    p.product_name,
    p.current_stock,
    p.reorder_point,
    recent_sales.sales_rate
FROM products p
JOIN (
    SELECT
        product_id,
        COUNT(*) as sales_count,
        COUNT(*) / 30.0 as sales_rate  -- Sales per day over last 30 days
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY product_id
) recent_sales ON p.product_id = recent_sales.product_id
WHERE p.current_stock / recent_sales.sales_rate < (
    -- Days until reorder point based on historical average
    SELECT AVG(days_to_reorder)
    FROM (
        SELECT p2.current_stock / NULLIF(
            (SELECT COUNT(*)
             FROM order_items oi2
             JOIN orders o2 ON oi2.order_id = o2.order_id
             WHERE oi2.product_id = p2.product_id
             AND o2.order_date >= CURRENT_DATE - INTERVAL '90 days'
            ) / 90.0, 0
        ) as days_to_reorder
        FROM products p2
        WHERE p2.category_id = p.category_id  -- Same category comparison
    ) category_averages
);
```

### 3. **Performance Analytics**

```sql
-- Find sales representatives performing below their team average
SELECT
    sr.rep_id,
    sr.rep_name,
    sr.team_id,
    current_performance.monthly_sales,
    team_average.team_avg_sales
FROM sales_reps sr
JOIN (
    SELECT
        rep_id,
        SUM(amount) as monthly_sales
    FROM sales
    WHERE sale_date >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY rep_id
) current_performance ON sr.rep_id = current_performance.rep_id
JOIN (
    SELECT DISTINCT
        team_id,
        (SELECT AVG(monthly_sales)
         FROM (
             SELECT
                 sr2.rep_id,
                 SUM(s2.amount) as monthly_sales
             FROM sales_reps sr2
             LEFT JOIN sales s2 ON sr2.rep_id = s2.rep_id
             WHERE sr2.team_id = sr.team_id  -- Correlation
             AND s2.sale_date >= DATE_TRUNC('month', CURRENT_DATE)
             GROUP BY sr2.rep_id
         ) team_monthly_sales
        ) as team_avg_sales
    FROM sales_reps sr
) team_average ON sr.team_id = team_average.team_id
WHERE current_performance.monthly_sales < team_average.team_avg_sales * 0.8;  -- 20% below average
```

## Alternative Approaches

### 1. **Window Functions vs Correlated Subqueries**

```sql
-- Correlated subquery approach
SELECT
    employee_id,
    salary,
    (SELECT AVG(salary)
     FROM employees e2
     WHERE e2.department_id = e1.department_id) as dept_avg
FROM employees e1;

-- Window function approach (often more efficient)
SELECT
    employee_id,
    salary,
    AVG(salary) OVER (PARTITION BY department_id) as dept_avg
FROM employees;
```

### 2. **CTEs vs Correlated Subqueries**

```sql
-- Correlated subquery approach
SELECT customer_id, customer_name
FROM customers c
WHERE (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.customer_id = c.customer_id
    AND o.order_date >= CURRENT_DATE - INTERVAL '12 months'
) > 5;

-- CTE approach (more readable, potentially more efficient)
WITH customer_order_counts AS (
    SELECT
        customer_id,
        COUNT(*) as order_count
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY customer_id
)
SELECT c.customer_id, c.customer_name
FROM customers c
JOIN customer_order_counts coc ON c.customer_id = coc.customer_id
WHERE coc.order_count > 5;
```

## Best Practices

### 1. **When to Use Correlated Subqueries**

- **Row-by-row comparisons** needed
- **Complex filtering** that depends on outer query values
- **EXISTS/NOT EXISTS** scenarios
- **When window functions aren't sufficient**

### 2. **When to Avoid Correlated Subqueries**

- **Large datasets** where performance is critical
- **Simple aggregations** that can be done with window functions
- **When JOINs would be more efficient**
- **When the same subquery logic is repeated**

### 3. **Optimization Tips**

```sql
-- Use appropriate indexes
CREATE INDEX idx_composite ON orders(customer_id, order_date, order_status);

-- Limit subquery scope when possible
SELECT customer_id, customer_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
    AND o.order_date >= '2023-01-01'  -- Limit scope
    LIMIT 1  -- Stop after finding first match
);

-- Consider query rewriting
-- Instead of multiple correlated subqueries:
SELECT
    customer_id,
    (SELECT COUNT(*) FROM orders o1 WHERE o1.customer_id = c.customer_id) as order_count,
    (SELECT MAX(order_date) FROM orders o2 WHERE o2.customer_id = c.customer_id) as last_order
FROM customers c;

-- Use a single subquery with aggregation:
SELECT
    c.customer_id,
    COALESCE(order_stats.order_count, 0) as order_count,
    order_stats.last_order
FROM customers c
LEFT JOIN (
    SELECT
        customer_id,
        COUNT(*) as order_count,
        MAX(order_date) as last_order
    FROM orders
    GROUP BY customer_id
) order_stats ON c.customer_id = order_stats.customer_id;
```

Correlated subqueries are powerful tools for complex data analysis, but they require careful consideration of performance implications and should be used when simpler alternatives like JOINs or window functions are insufficient for the business logic required.
