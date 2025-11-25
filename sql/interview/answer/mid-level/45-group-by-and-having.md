# Question 45: Explain `GROUP BY` and `HAVING`

## Overview

`GROUP BY` and `HAVING` are SQL clauses used together to group rows and filter grouped results. They enable powerful data aggregation and analysis capabilities.

### Key Concepts:

- **GROUP BY**: Groups rows with the same values into summary rows
- **HAVING**: Filters groups based on aggregate conditions
- **Used with aggregate functions**: COUNT, SUM, AVG, MIN, MAX, etc.

## GROUP BY Clause

### Purpose:

The `GROUP BY` clause groups rows that have the same values in specified columns into aggregate rows, allowing you to perform calculations on each group.

### Basic Syntax:

```sql
SELECT column1, column2, aggregate_function(column3)
FROM table_name
WHERE condition
GROUP BY column1, column2
ORDER BY column1;
```

### Simple GROUP BY Example:

```sql
-- Count employees by department
SELECT department, COUNT(*) as employee_count
FROM employees
GROUP BY department;

-- Result:
-- department    | employee_count
-- Sales         | 15
-- Engineering   | 25
-- Marketing     | 8
-- HR            | 5
```

### Multiple Column GROUP BY:

```sql
-- Count employees by department and job title
SELECT department, job_title, COUNT(*) as count, AVG(salary) as avg_salary
FROM employees
GROUP BY department, job_title
ORDER BY department, job_title;

-- Result:
-- department    | job_title      | count | avg_salary
-- Engineering   | Developer      | 20    | 85000
-- Engineering   | Lead           | 5     | 110000
-- Sales         | Representative | 12    | 65000
-- Sales         | Manager        | 3     | 95000
```

## GROUP BY with Different Aggregate Functions

### 1. **COUNT - Counting Records**

```sql
-- Count orders by status
SELECT order_status, COUNT(*) as order_count
FROM orders
GROUP BY order_status;

-- Count distinct customers by month
SELECT
    DATE_TRUNC('month', order_date) as month,
    COUNT(DISTINCT customer_id) as unique_customers
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;
```

### 2. **SUM - Calculating Totals**

```sql
-- Total sales by salesperson
SELECT
    salesperson_id,
    SUM(amount) as total_sales,
    COUNT(*) as number_of_sales
FROM sales
GROUP BY salesperson_id
ORDER BY total_sales DESC;

-- Monthly revenue
SELECT
    EXTRACT(YEAR FROM order_date) as year,
    EXTRACT(MONTH FROM order_date) as month,
    SUM(total_amount) as monthly_revenue
FROM orders
WHERE order_status = 'completed'
GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
ORDER BY year, month;
```

### 3. **AVG - Calculating Averages**

```sql
-- Average salary by department and experience level
SELECT
    department,
    experience_level,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary,
    MIN(salary) as min_salary,
    MAX(salary) as max_salary
FROM employees
GROUP BY department, experience_level
ORDER BY department, experience_level;
```

### 4. **MIN/MAX - Finding Extremes**

```sql
-- First and last order dates by customer
SELECT
    customer_id,
    COUNT(*) as total_orders,
    MIN(order_date) as first_order,
    MAX(order_date) as last_order,
    SUM(total_amount) as lifetime_value
FROM orders
GROUP BY customer_id
ORDER BY lifetime_value DESC;
```

## HAVING Clause

### Purpose:

The `HAVING` clause filters groups created by `GROUP BY` based on aggregate conditions. It's like `WHERE` but for grouped data.

### Key Differences: WHERE vs HAVING

| Aspect        | WHERE           | HAVING              |
| ------------- | --------------- | ------------------- |
| **Filters**   | Individual rows | Groups              |
| **Applied**   | Before grouping | After grouping      |
| **Used with** | Column values   | Aggregate functions |
| **Position**  | Before GROUP BY | After GROUP BY      |

### Basic HAVING Syntax:

```sql
SELECT column1, aggregate_function(column2)
FROM table_name
WHERE condition          -- Filters individual rows
GROUP BY column1
HAVING aggregate_condition  -- Filters groups
ORDER BY column1;
```

### HAVING Examples:

#### 1. **Filtering Groups by Count**

```sql
-- Departments with more than 10 employees
SELECT
    department,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 10
ORDER BY employee_count DESC;
```

#### 2. **Filtering Groups by Sum/Average**

```sql
-- Customers with lifetime value > $10,000
SELECT
    customer_id,
    COUNT(*) as order_count,
    SUM(total_amount) as lifetime_value,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE order_status = 'completed'
GROUP BY customer_id
HAVING SUM(total_amount) > 10000
ORDER BY lifetime_value DESC;
```

#### 3. **Multiple HAVING Conditions**

```sql
-- High-performing sales regions
SELECT
    region,
    COUNT(*) as sales_count,
    SUM(amount) as total_sales,
    AVG(amount) as avg_sale_amount
FROM sales
WHERE sale_date >= '2023-01-01'
GROUP BY region
HAVING COUNT(*) >= 50          -- At least 50 sales
   AND SUM(amount) > 500000    -- Total sales > $500K
   AND AVG(amount) > 1000      -- Average sale > $1K
ORDER BY total_sales DESC;
```

## Advanced GROUP BY Features

### 1. **GROUP BY with Expressions**

```sql
-- Group by calculated values
SELECT
    CASE
        WHEN age < 30 THEN 'Young'
        WHEN age < 50 THEN 'Middle-aged'
        ELSE 'Senior'
    END as age_group,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary
FROM employees
GROUP BY CASE
    WHEN age < 30 THEN 'Young'
    WHEN age < 50 THEN 'Middle-aged'
    ELSE 'Senior'
END
ORDER BY avg_salary DESC;

-- Group by date parts
SELECT
    EXTRACT(YEAR FROM hire_date) as hire_year,
    EXTRACT(QUARTER FROM hire_date) as hire_quarter,
    COUNT(*) as hires_count
FROM employees
GROUP BY EXTRACT(YEAR FROM hire_date), EXTRACT(QUARTER FROM hire_date)
ORDER BY hire_year, hire_quarter;
```

### 2. **GROUP BY with ROLLUP**

```sql
-- Hierarchical grouping with subtotals
SELECT
    department,
    job_title,
    COUNT(*) as employee_count,
    SUM(salary) as total_salary
FROM employees
GROUP BY ROLLUP(department, job_title)
ORDER BY department, job_title;

-- Result includes subtotals at each level:
-- department    | job_title      | employee_count | total_salary
-- Engineering   | Developer      | 20            | 1700000
-- Engineering   | Lead           | 5             | 550000
-- Engineering   | NULL           | 25            | 2250000  -- Subtotal
-- Sales         | Manager        | 3             | 285000
-- Sales         | Representative | 12            | 780000
-- Sales         | NULL           | 15            | 1065000  -- Subtotal
-- NULL          | NULL           | 40            | 3315000  -- Grand total
```

### 3. **GROUP BY with CUBE**

```sql
-- All possible grouping combinations
SELECT
    department,
    EXTRACT(YEAR FROM hire_date) as hire_year,
    COUNT(*) as employee_count
FROM employees
GROUP BY CUBE(department, EXTRACT(YEAR FROM hire_date))
ORDER BY department, hire_year;
```

### 4. **GROUP BY with GROUPING SETS**

```sql
-- Specific grouping combinations
SELECT
    department,
    job_title,
    COUNT(*) as employee_count
FROM employees
GROUP BY GROUPING SETS (
    (department),           -- Group by department only
    (job_title),           -- Group by job_title only
    (department, job_title), -- Group by both
    ()                     -- Grand total
)
ORDER BY department, job_title;
```

## Complex Examples

### 1. **Sales Analysis Report**

```sql
-- Comprehensive sales analysis
SELECT
    s.salesperson_name,
    DATE_TRUNC('quarter', s.sale_date) as quarter,
    COUNT(*) as deals_closed,
    SUM(s.amount) as total_revenue,
    AVG(s.amount) as avg_deal_size,
    MIN(s.amount) as smallest_deal,
    MAX(s.amount) as largest_deal,
    ROUND(SUM(s.amount) / COUNT(*), 2) as revenue_per_deal
FROM sales s
JOIN salespeople sp ON s.salesperson_id = sp.id
WHERE s.sale_date >= '2023-01-01'
GROUP BY s.salesperson_name, DATE_TRUNC('quarter', s.sale_date)
HAVING COUNT(*) >= 5              -- At least 5 deals
   AND SUM(s.amount) > 100000     -- Revenue > $100K
ORDER BY quarter, total_revenue DESC;
```

### 2. **Customer Segmentation**

```sql
-- Customer value segmentation
WITH customer_stats AS (
    SELECT
        c.customer_id,
        c.customer_name,
        COUNT(o.order_id) as order_count,
        SUM(o.total_amount) as lifetime_value,
        AVG(o.total_amount) as avg_order_value,
        MAX(o.order_date) as last_order_date,
        MIN(o.order_date) as first_order_date
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    WHERE o.order_status = 'completed'
    GROUP BY c.customer_id, c.customer_name
    HAVING COUNT(o.order_id) > 0
)
SELECT
    CASE
        WHEN lifetime_value >= 50000 THEN 'VIP'
        WHEN lifetime_value >= 10000 THEN 'Premium'
        WHEN lifetime_value >= 5000 THEN 'Regular'
        ELSE 'Basic'
    END as customer_tier,
    COUNT(*) as customer_count,
    AVG(lifetime_value) as avg_lifetime_value,
    AVG(order_count) as avg_orders_per_customer,
    AVG(avg_order_value) as avg_order_size
FROM customer_stats
GROUP BY CASE
    WHEN lifetime_value >= 50000 THEN 'VIP'
    WHEN lifetime_value >= 10000 THEN 'Premium'
    WHEN lifetime_value >= 5000 THEN 'Regular'
    ELSE 'Basic'
END
ORDER BY avg_lifetime_value DESC;
```

### 3. **Product Performance Analysis**

```sql
-- Product category performance with filtering
SELECT
    p.category,
    COUNT(DISTINCT p.product_id) as products_count,
    COUNT(oi.order_item_id) as total_sales,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total_price) as total_revenue,
    AVG(oi.unit_price) as avg_unit_price,
    SUM(oi.total_price) / SUM(oi.quantity) as avg_revenue_per_unit
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '12 months'
  AND o.order_status = 'completed'
GROUP BY p.category
HAVING COUNT(oi.order_item_id) >= 100  -- At least 100 sales
   AND SUM(oi.total_price) > 50000     -- Revenue > $50K
ORDER BY total_revenue DESC;
```

## Common Patterns and Use Cases

### 1. **Top N Analysis**

```sql
-- Top 5 performing salespeople this year
SELECT
    salesperson_id,
    salesperson_name,
    SUM(amount) as total_sales,
    COUNT(*) as deals_count,
    AVG(amount) as avg_deal_size
FROM sales
WHERE EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY salesperson_id, salesperson_name
ORDER BY total_sales DESC
LIMIT 5;
```

### 2. **Trend Analysis**

```sql
-- Monthly growth analysis
SELECT
    DATE_TRUNC('month', order_date) as month,
    COUNT(*) as orders_count,
    SUM(total_amount) as revenue,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(total_amount) / COUNT(*) as avg_order_value
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
  AND order_status = 'completed'
GROUP BY DATE_TRUNC('month', order_date)
HAVING COUNT(*) > 0
ORDER BY month;
```

### 3. **Statistical Analysis**

```sql
-- Salary distribution by department
SELECT
    department,
    COUNT(*) as employee_count,
    MIN(salary) as min_salary,
    MAX(salary) as max_salary,
    AVG(salary) as avg_salary,
    STDDEV(salary) as salary_stddev,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) as median_salary,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) as q1_salary,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) as q3_salary
FROM employees
GROUP BY department
HAVING COUNT(*) >= 5  -- Departments with at least 5 employees
ORDER BY avg_salary DESC;
```

## Performance Considerations

### 1. **Indexing for GROUP BY**

```sql
-- Index on grouped columns improves performance
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);
CREATE INDEX idx_sales_salesperson_date ON sales(salesperson_id, sale_date);

-- Query that benefits from the index
SELECT
    customer_id,
    DATE_TRUNC('month', order_date) as month,
    SUM(total_amount) as monthly_spending
FROM orders
WHERE customer_id IN (1, 2, 3, 4, 5)
GROUP BY customer_id, DATE_TRUNC('month', order_date);
```

### 2. **WHERE vs HAVING Performance**

```sql
-- More efficient: Filter with WHERE before grouping
SELECT
    department,
    AVG(salary) as avg_salary
FROM employees
WHERE salary > 50000    -- Filter individuals first
GROUP BY department
HAVING COUNT(*) > 5;    -- Then filter groups

-- Less efficient: Using HAVING for non-aggregate conditions
SELECT
    department,
    AVG(salary) as avg_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 5
   AND MIN(salary) > 50000;  -- Less efficient than WHERE
```

## Common Mistakes and Best Practices

### 1. **Common Mistakes**

```sql
-- ❌ ERROR: Column not in GROUP BY
SELECT department, employee_name, COUNT(*)
FROM employees
GROUP BY department;  -- employee_name must be in GROUP BY

-- ✅ CORRECT: Include all non-aggregate columns
SELECT department, COUNT(*)
FROM employees
GROUP BY department;

-- ✅ CORRECT: Or use aggregate function
SELECT department, STRING_AGG(employee_name, ', ') as employees
FROM employees
GROUP BY department;
```

### 2. **Best Practices**

```sql
-- Use meaningful aliases
SELECT
    department as dept,
    COUNT(*) as total_employees,
    AVG(salary) as average_salary,
    SUM(salary) as total_payroll
FROM employees
GROUP BY department
ORDER BY total_employees DESC;

-- Use consistent formatting
SELECT
    region,
    product_category,
    COUNT(*) as sales_count,
    SUM(revenue) as total_revenue,
    AVG(revenue) as avg_revenue
FROM sales
WHERE sale_date >= '2023-01-01'
GROUP BY
    region,
    product_category
HAVING
    COUNT(*) >= 10
    AND SUM(revenue) > 100000
ORDER BY
    total_revenue DESC,
    region;
```

## Real-World Applications

### 1. **Business Intelligence Reporting**

- Sales performance by region/time period
- Customer segmentation and analysis
- Product performance metrics
- Financial reporting and budgeting

### 2. **Data Analytics**

- User behavior analysis
- Website traffic patterns
- A/B testing results
- Conversion funnel analysis

### 3. **Operational Reporting**

- Inventory turnover rates
- Employee productivity metrics
- Quality control statistics
- Resource utilization reports

`GROUP BY` and `HAVING` are fundamental SQL concepts that enable powerful data aggregation and analysis capabilities, essential for reporting, analytics, and business intelligence applications.
