# Question 50: What is a self-join?

## Definition

A **self-join** is a join operation where a table is joined with itself. This technique allows you to compare rows within the same table or establish relationships between different rows in the same table. Despite being the same physical table, you treat it as if it were two different tables by using different aliases.

### Key Characteristics:

- **Same table joined to itself**
- **Requires table aliases** to distinguish between instances
- **Enables row-to-row comparisons** within the same table
- **Common for hierarchical data** and relationship analysis
- **Uses standard JOIN syntax** (INNER, LEFT, RIGHT, FULL OUTER)

## Basic Self-Join Syntax

```sql
SELECT a.column1, a.column2, b.column1, b.column2
FROM table_name a
JOIN table_name b ON a.some_column = b.some_column
WHERE condition;
```

### Simple Example:

```sql
-- Find employees and their managers (assuming manager_id references employee_id)
SELECT
    emp.employee_id,
    emp.first_name AS employee_name,
    mgr.first_name AS manager_name
FROM employees emp
LEFT JOIN employees mgr ON emp.manager_id = mgr.employee_id;
```

## Common Self-Join Patterns

### 1. **Hierarchical Relationships (Manager-Employee)**

```sql
-- Basic manager-employee relationship
SELECT
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    e.job_title,
    m.first_name || ' ' || m.last_name AS manager_name,
    m.job_title AS manager_title
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id
ORDER BY e.department_id, e.employee_id;

-- Find all employees who earn more than their managers
SELECT
    e.employee_id,
    e.first_name AS employee_name,
    e.salary AS employee_salary,
    m.first_name AS manager_name,
    m.salary AS manager_salary
FROM employees e
INNER JOIN employees m ON e.manager_id = m.employee_id
WHERE e.salary > m.salary;

-- Count direct reports for each manager
SELECT
    m.employee_id AS manager_id,
    m.first_name || ' ' || m.last_name AS manager_name,
    COUNT(e.employee_id) AS direct_reports
FROM employees m
LEFT JOIN employees e ON m.employee_id = e.manager_id
GROUP BY m.employee_id, m.first_name, m.last_name
HAVING COUNT(e.employee_id) > 0
ORDER BY direct_reports DESC;
```

### 2. **Finding Duplicates and Similar Records**

```sql
-- Find customers with duplicate emails
SELECT
    c1.customer_id,
    c1.customer_name,
    c1.email,
    c2.customer_id AS duplicate_id,
    c2.customer_name AS duplicate_name
FROM customers c1
INNER JOIN customers c2 ON c1.email = c2.email
WHERE c1.customer_id < c2.customer_id  -- Avoid duplicating pairs
ORDER BY c1.email;

-- Find products with similar names (fuzzy matching)
SELECT
    p1.product_id,
    p1.product_name,
    p2.product_id AS similar_product_id,
    p2.product_name AS similar_product_name,
    SIMILARITY(p1.product_name, p2.product_name) AS similarity_score
FROM products p1
INNER JOIN products p2 ON p1.product_id != p2.product_id
WHERE SIMILARITY(p1.product_name, p2.product_name) > 0.7
ORDER BY similarity_score DESC;

-- Find employees with same last name but different departments
SELECT
    e1.employee_id,
    e1.first_name || ' ' || e1.last_name AS employee1,
    e1.department_id AS dept1,
    e2.employee_id,
    e2.first_name || ' ' || e2.last_name AS employee2,
    e2.department_id AS dept2
FROM employees e1
INNER JOIN employees e2 ON e1.last_name = e2.last_name
WHERE e1.employee_id < e2.employee_id  -- Avoid duplicates
AND e1.department_id != e2.department_id;
```

### 3. **Sequence and Temporal Analysis**

```sql
-- Find consecutive orders from the same customer
SELECT
    o1.order_id AS first_order,
    o1.order_date AS first_date,
    o1.total_amount AS first_amount,
    o2.order_id AS second_order,
    o2.order_date AS second_date,
    o2.total_amount AS second_amount,
    o2.order_date - o1.order_date AS days_between
FROM orders o1
INNER JOIN orders o2 ON o1.customer_id = o2.customer_id
WHERE o2.order_date > o1.order_date
AND o2.order_date <= o1.order_date + INTERVAL '30 days'
ORDER BY o1.customer_id, o1.order_date;

-- Find sales representatives who worked on consecutive days
SELECT
    s1.rep_id,
    s1.sale_date AS first_day,
    s2.sale_date AS second_day,
    s1.total_sales AS day1_sales,
    s2.total_sales AS day2_sales
FROM daily_sales s1
INNER JOIN daily_sales s2 ON s1.rep_id = s2.rep_id
WHERE s2.sale_date = s1.sale_date + INTERVAL '1 day'
ORDER BY s1.rep_id, s1.sale_date;
```

### 4. **Comparison Analysis**

```sql
-- Compare product prices within the same category
SELECT
    p1.product_id,
    p1.product_name,
    p1.price,
    p2.product_id AS compare_product_id,
    p2.product_name AS compare_product_name,
    p2.price AS compare_price,
    p1.price - p2.price AS price_difference,
    ROUND((p1.price - p2.price) / p2.price * 100, 2) AS price_diff_percentage
FROM products p1
INNER JOIN products p2 ON p1.category_id = p2.category_id
WHERE p1.product_id != p2.product_id
AND p1.price > p2.price  -- Only show more expensive comparisons
ORDER BY p1.category_id, price_difference DESC;

-- Find employees with similar experience levels in same department
SELECT
    e1.employee_id,
    e1.first_name || ' ' || e1.last_name AS employee1,
    e1.years_experience AS exp1,
    e2.employee_id,
    e2.first_name || ' ' || e2.last_name AS employee2,
    e2.years_experience AS exp2,
    ABS(e1.years_experience - e2.years_experience) AS experience_diff
FROM employees e1
INNER JOIN employees e2 ON e1.department_id = e2.department_id
WHERE e1.employee_id < e2.employee_id  -- Avoid duplicates
AND ABS(e1.years_experience - e2.years_experience) <= 1
ORDER BY e1.department_id, experience_diff;
```

## Advanced Self-Join Examples

### 1. **Multi-Level Hierarchical Queries**

```sql
-- Find employees and their managers' managers (2 levels up)
SELECT
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee,
    m1.first_name || ' ' || m1.last_name AS direct_manager,
    m2.first_name || ' ' || m2.last_name AS senior_manager,
    m3.first_name || ' ' || m3.last_name AS executive
FROM employees e
LEFT JOIN employees m1 ON e.manager_id = m1.employee_id        -- Direct manager
LEFT JOIN employees m2 ON m1.manager_id = m2.employee_id       -- Manager's manager
LEFT JOIN employees m3 ON m2.manager_id = m3.employee_id       -- Senior executive
WHERE e.employee_id IS NOT NULL
ORDER BY e.department_id, e.employee_id;

-- Find all subordinates (direct and indirect) for a specific manager
WITH RECURSIVE subordinates AS (
    -- Base case: direct reports
    SELECT
        employee_id,
        first_name || ' ' || last_name AS employee_name,
        manager_id,
        1 AS level
    FROM employees
    WHERE manager_id = 100  -- Specific manager ID

    UNION ALL

    -- Recursive case: reports of reports
    SELECT
        e.employee_id,
        e.first_name || ' ' || e.last_name AS employee_name,
        e.manager_id,
        s.level + 1
    FROM employees e
    INNER JOIN subordinates s ON e.manager_id = s.employee_id
    WHERE s.level < 5  -- Prevent infinite recursion
)
SELECT
    employee_id,
    REPEAT('  ', level - 1) || employee_name AS hierarchical_name,
    level
FROM subordinates
ORDER BY level, employee_name;
```

### 2. **Time Series Analysis**

```sql
-- Find month-over-month sales growth
SELECT
    s1.sales_month,
    s1.total_sales AS current_month_sales,
    s2.total_sales AS previous_month_sales,
    s1.total_sales - s2.total_sales AS sales_growth,
    ROUND(
        ((s1.total_sales - s2.total_sales) / s2.total_sales) * 100, 2
    ) AS growth_percentage
FROM monthly_sales s1
INNER JOIN monthly_sales s2 ON s1.sales_month = s2.sales_month + INTERVAL '1 month'
WHERE s1.sales_month >= '2023-02-01'  -- Start from February (need Jan for comparison)
ORDER BY s1.sales_month;

-- Find products with increasing prices over time
SELECT
    p1.product_id,
    p1.product_name,
    p1.effective_date AS price_date1,
    p1.price AS price1,
    p2.effective_date AS price_date2,
    p2.price AS price2,
    p2.price - p1.price AS price_increase
FROM product_price_history p1
INNER JOIN product_price_history p2 ON p1.product_id = p2.product_id
WHERE p2.effective_date > p1.effective_date
AND p2.price > p1.price
AND NOT EXISTS (
    -- Ensure p2 is the next price change after p1
    SELECT 1
    FROM product_price_history p3
    WHERE p3.product_id = p1.product_id
    AND p3.effective_date > p1.effective_date
    AND p3.effective_date < p2.effective_date
)
ORDER BY p1.product_id, p1.effective_date;
```

### 3. **Network and Relationship Analysis**

```sql
-- Find mutual friends (if you have a friends table)
SELECT
    f1.user_id AS user1,
    f2.user_id AS user2,
    f1.friend_id AS mutual_friend
FROM friendships f1
INNER JOIN friendships f2 ON f1.friend_id = f2.friend_id
WHERE f1.user_id < f2.user_id  -- Avoid duplicate pairs
AND f1.user_id != f2.user_id   -- Users can't be mutual friends with themselves
ORDER BY mutual_friend;

-- Find customers who bought similar product combinations
SELECT
    o1.customer_id AS customer1,
    o2.customer_id AS customer2,
    COUNT(*) AS common_products,
    ARRAY_AGG(DISTINCT o1.product_id ORDER BY o1.product_id) AS shared_products
FROM order_items o1
INNER JOIN order_items o2 ON o1.product_id = o2.product_id
WHERE o1.customer_id < o2.customer_id  -- Avoid duplicates
GROUP BY o1.customer_id, o2.customer_id
HAVING COUNT(*) >= 3  -- At least 3 common products
ORDER BY common_products DESC;
```

### 4. **Performance and Ranking Analysis**

```sql
-- Find employees who outperform their peers in the same role
SELECT
    e1.employee_id,
    e1.first_name || ' ' || e1.last_name AS employee,
    e1.job_title,
    e1.performance_score,
    COUNT(e2.employee_id) AS employees_outperformed,
    ROUND(AVG(e2.performance_score), 2) AS avg_peer_score
FROM employees e1
INNER JOIN employees e2 ON e1.job_title = e2.job_title
    AND e1.department_id = e2.department_id
    AND e1.performance_score > e2.performance_score
GROUP BY e1.employee_id, e1.first_name, e1.last_name,
         e1.job_title, e1.performance_score
HAVING COUNT(e2.employee_id) > 0
ORDER BY employees_outperformed DESC;

-- Find products that consistently outsell others in same category
SELECT
    p1.product_id,
    p1.product_name,
    p1.category_id,
    COUNT(DISTINCT p2.product_id) AS products_outsold,
    SUM(p1.units_sold) AS total_units_sold
FROM product_sales p1
INNER JOIN product_sales p2 ON p1.category_id = p2.category_id
    AND p1.sale_month = p2.sale_month
    AND p1.units_sold > p2.units_sold
WHERE p1.sale_month >= '2023-01-01'
GROUP BY p1.product_id, p1.product_name, p1.category_id
HAVING COUNT(DISTINCT p2.product_id) >= 5  -- Outsells at least 5 others
ORDER BY products_outsold DESC;
```

## Self-Join Performance Considerations

### 1. **Indexing Strategies**

```sql
-- Create appropriate indexes for self-join columns
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_department_salary ON employees(department_id, salary);
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Composite indexes for complex self-join conditions
CREATE INDEX idx_products_category_price ON products(category_id, price);
CREATE INDEX idx_sales_rep_date ON daily_sales(rep_id, sale_date);
```

### 2. **Query Optimization**

```sql
-- Use LIMIT when you only need a sample
SELECT e1.first_name, e1.salary, e2.first_name, e2.salary
FROM employees e1
INNER JOIN employees e2 ON e1.department_id = e2.department_id
WHERE e1.employee_id < e2.employee_id
AND ABS(e1.salary - e2.salary) < 5000
LIMIT 100;  -- Limit results for better performance

-- Use EXISTS instead of self-join when checking existence
-- Instead of:
SELECT DISTINCT e1.employee_id
FROM employees e1
INNER JOIN employees e2 ON e1.manager_id = e2.employee_id;

-- Use:
SELECT employee_id
FROM employees e1
WHERE EXISTS (
    SELECT 1
    FROM employees e2
    WHERE e2.employee_id = e1.manager_id
);
```

### 3. **Memory and Complexity Considerations**

```sql
-- Be cautious with cartesian products
-- This could return many rows if not properly filtered:
SELECT e1.first_name, e2.first_name
FROM employees e1
CROSS JOIN employees e2;  -- N × N rows!

-- Always include appropriate WHERE conditions:
SELECT e1.first_name, e2.first_name
FROM employees e1
INNER JOIN employees e2 ON e1.department_id = e2.department_id
WHERE e1.employee_id != e2.employee_id;  -- Proper filtering
```

## Real-World Business Applications

### 1. **Organizational Analysis**

```sql
-- Find management spans that are too wide or narrow
SELECT
    m.employee_id AS manager_id,
    m.first_name || ' ' || m.last_name AS manager_name,
    COUNT(e.employee_id) AS direct_reports,
    CASE
        WHEN COUNT(e.employee_id) > 10 THEN 'Too Many Reports'
        WHEN COUNT(e.employee_id) < 2 THEN 'Too Few Reports'
        ELSE 'Appropriate Span'
    END AS span_assessment
FROM employees m
LEFT JOIN employees e ON m.employee_id = e.manager_id
WHERE m.job_title LIKE '%Manager%'
GROUP BY m.employee_id, m.first_name, m.last_name
ORDER BY direct_reports DESC;
```

### 2. **Customer Behavior Analysis**

```sql
-- Find customers with similar purchase patterns
WITH customer_categories AS (
    SELECT
        o.customer_id,
        p.category_id,
        COUNT(*) AS category_purchases
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY o.customer_id, p.category_id
)
SELECT
    c1.customer_id AS customer1,
    c2.customer_id AS customer2,
    COUNT(*) AS shared_categories,
    ARRAY_AGG(c1.category_id ORDER BY c1.category_id) AS common_categories
FROM customer_categories c1
INNER JOIN customer_categories c2 ON c1.category_id = c2.category_id
WHERE c1.customer_id < c2.customer_id
GROUP BY c1.customer_id, c2.customer_id
HAVING COUNT(*) >= 3  -- At least 3 shared categories
ORDER BY shared_categories DESC;
```

### 3. **Supply Chain Analysis**

```sql
-- Find supplier relationships (suppliers who provide similar products)
SELECT
    s1.supplier_id AS supplier1,
    s1.supplier_name AS supplier1_name,
    s2.supplier_id AS supplier2,
    s2.supplier_name AS supplier2_name,
    COUNT(DISTINCT p1.category_id) AS shared_categories
FROM suppliers s1
INNER JOIN products p1 ON s1.supplier_id = p1.supplier_id
INNER JOIN products p2 ON p1.category_id = p2.category_id
INNER JOIN suppliers s2 ON p2.supplier_id = s2.supplier_id
WHERE s1.supplier_id < s2.supplier_id  -- Avoid duplicates
GROUP BY s1.supplier_id, s1.supplier_name, s2.supplier_id, s2.supplier_name
HAVING COUNT(DISTINCT p1.category_id) >= 2  -- Share at least 2 categories
ORDER BY shared_categories DESC;
```

## Common Pitfalls and Best Practices

### 1. **Always Use Table Aliases**

```sql
-- ❌ Confusing without aliases
SELECT employee_id, first_name, manager_id
FROM employees
JOIN employees ON manager_id = employee_id;

-- ✅ Clear with aliases
SELECT e.employee_id, e.first_name, m.first_name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;
```

### 2. **Avoid Duplicate Results**

```sql
-- ❌ This creates duplicate pairs
SELECT p1.product_name, p2.product_name
FROM products p1
INNER JOIN products p2 ON p1.category_id = p2.category_id
WHERE p1.product_id != p2.product_id;

-- ✅ This avoids duplicates
SELECT p1.product_name, p2.product_name
FROM products p1
INNER JOIN products p2 ON p1.category_id = p2.category_id
WHERE p1.product_id < p2.product_id;  -- Only show each pair once
```

### 3. **Handle NULLs Appropriately**

```sql
-- ✅ Use LEFT JOIN for hierarchical data to include orphaned records
SELECT
    e.employee_id,
    e.first_name,
    COALESCE(m.first_name, 'No Manager') AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;
```

### 4. **Be Specific with Conditions**

```sql
-- ✅ Always include meaningful WHERE conditions
SELECT e1.first_name, e2.first_name
FROM employees e1
INNER JOIN employees e2 ON e1.department_id = e2.department_id
WHERE e1.employee_id != e2.employee_id  -- Exclude self-matches
AND e1.hire_date < e2.hire_date;        -- Add business logic
```

Self-joins are powerful tools for analyzing relationships within data, enabling complex analytical queries that would be difficult or impossible to achieve with other SQL techniques. They're essential for hierarchical data, duplicate detection, temporal analysis, and comparative studies within the same dataset.
