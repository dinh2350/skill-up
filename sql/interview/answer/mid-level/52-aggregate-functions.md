# Question 52: How do you use aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)?

## Overview

**Aggregate functions** perform calculations on a set of rows and return a single result. They are fundamental for data analysis, reporting, and statistical calculations in SQL. The most common aggregate functions are `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX`.

### Key Characteristics:

- **Single result**: Returns one value from multiple input rows
- **Ignores NULL values**: (except COUNT(\*))
- **Used with GROUP BY**: To calculate aggregates per group
- **Can be filtered**: Using WHERE clause or FILTER
- **Window function capable**: Can be used with OVER clause

## Basic Aggregate Functions

### 1. **COUNT - Counting Rows**

```sql
-- COUNT(*): Count all rows (including NULLs)
SELECT COUNT(*) AS total_employees
FROM employees;

-- COUNT(column): Count non-NULL values in a column
SELECT COUNT(email) AS employees_with_email
FROM employees;

-- COUNT(DISTINCT column): Count unique non-NULL values
SELECT COUNT(DISTINCT department_id) AS number_of_departments
FROM employees;

-- Conditional counting
SELECT
    COUNT(*) AS total_employees,
    COUNT(CASE WHEN salary > 50000 THEN 1 END) AS high_salary_employees,
    COUNT(CASE WHEN hire_date >= '2023-01-01' THEN 1 END) AS recent_hires
FROM employees;
```

### 2. **SUM - Adding Values**

```sql
-- Basic sum
SELECT SUM(salary) AS total_payroll
FROM employees;

-- Sum with conditions
SELECT
    SUM(CASE WHEN department_id = 1 THEN salary ELSE 0 END) AS engineering_payroll,
    SUM(CASE WHEN department_id = 2 THEN salary ELSE 0 END) AS sales_payroll
FROM employees;

-- Sum of calculations
SELECT
    SUM(quantity * unit_price) AS total_order_value,
    SUM(quantity * unit_price * discount_rate) AS total_discount_amount
FROM order_items;

-- Handle NULL values explicitly
SELECT
    SUM(COALESCE(bonus, 0)) AS total_bonuses,
    SUM(salary + COALESCE(bonus, 0)) AS total_compensation
FROM employees;
```

### 3. **AVG - Calculating Averages**

```sql
-- Basic average
SELECT AVG(salary) AS average_salary
FROM employees;

-- Average with filtering
SELECT
    AVG(salary) AS overall_average,
    AVG(CASE WHEN experience_years > 5 THEN salary END) AS senior_average,
    AVG(CASE WHEN experience_years <= 5 THEN salary END) AS junior_average
FROM employees;

-- Weighted average
SELECT
    SUM(grade_points * credit_hours) / SUM(credit_hours) AS weighted_gpa
FROM student_grades
WHERE student_id = 123;

-- Average of distinct values only
SELECT AVG(DISTINCT salary) AS average_unique_salary
FROM employees;
```

### 4. **MIN - Finding Minimum Values**

```sql
-- Basic minimum
SELECT MIN(salary) AS lowest_salary
FROM employees;

-- MIN with dates
SELECT
    MIN(hire_date) AS earliest_hire_date,
    MIN(CASE WHEN department_id = 1 THEN hire_date END) AS earliest_eng_hire
FROM employees;

-- MIN with strings (alphabetical)
SELECT
    MIN(last_name) AS alphabetically_first_name,
    MIN(product_name) AS first_product_alphabetically
FROM employees, products;

-- Using MIN for existence checks
SELECT
    customer_id,
    MIN(order_date) AS first_order_date
FROM orders
GROUP BY customer_id;
```

### 5. **MAX - Finding Maximum Values**

```sql
-- Basic maximum
SELECT MAX(salary) AS highest_salary
FROM employees;

-- MAX with multiple conditions
SELECT
    MAX(CASE WHEN department_id = 1 THEN salary END) AS highest_eng_salary,
    MAX(CASE WHEN department_id = 2 THEN salary END) AS highest_sales_salary,
    MAX(order_date) AS most_recent_order
FROM employees, orders;

-- Using MAX for latest records
SELECT
    product_id,
    MAX(price_effective_date) AS latest_price_date
FROM product_prices
GROUP BY product_id;
```

## Aggregate Functions with GROUP BY

### 1. **Basic Grouping**

```sql
-- Sales summary by region
SELECT
    region,
    COUNT(*) AS number_of_sales,
    SUM(amount) AS total_sales,
    AVG(amount) AS average_sale,
    MIN(amount) AS smallest_sale,
    MAX(amount) AS largest_sale
FROM sales
GROUP BY region
ORDER BY total_sales DESC;

-- Employee statistics by department
SELECT
    d.department_name,
    COUNT(e.employee_id) AS employee_count,
    AVG(e.salary) AS avg_salary,
    MIN(e.salary) AS min_salary,
    MAX(e.salary) AS max_salary,
    SUM(e.salary) AS total_payroll
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_id, d.department_name
ORDER BY avg_salary DESC;
```

### 2. **Multiple Grouping Levels**

```sql
-- Sales analysis by region and product category
SELECT
    s.region,
    p.category,
    COUNT(*) AS sales_count,
    SUM(s.amount) AS total_revenue,
    AVG(s.amount) AS avg_order_value,
    MIN(s.sale_date) AS first_sale,
    MAX(s.sale_date) AS last_sale
FROM sales s
JOIN products p ON s.product_id = p.product_id
WHERE s.sale_date >= '2023-01-01'
GROUP BY s.region, p.category
ORDER BY s.region, total_revenue DESC;

-- Time-based aggregation
SELECT
    EXTRACT(YEAR FROM order_date) AS year,
    EXTRACT(MONTH FROM order_date) AS month,
    COUNT(*) AS order_count,
    SUM(total_amount) AS monthly_revenue,
    AVG(total_amount) AS avg_order_value,
    COUNT(DISTINCT customer_id) AS unique_customers
FROM orders
WHERE order_date >= '2022-01-01'
GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
ORDER BY year, month;
```

### 3. **Advanced Grouping with ROLLUP, CUBE, and GROUPING SETS**

```sql
-- ROLLUP: Hierarchical aggregation
SELECT
    region,
    product_category,
    COUNT(*) AS sales_count,
    SUM(amount) AS total_sales
FROM sales s
JOIN products p ON s.product_id = p.product_id
GROUP BY ROLLUP(region, product_category)
ORDER BY region, product_category;

-- CUBE: All possible combinations
SELECT
    region,
    salesperson_id,
    EXTRACT(QUARTER FROM sale_date) AS quarter,
    SUM(amount) AS total_sales
FROM sales
WHERE sale_date >= '2023-01-01'
GROUP BY CUBE(region, salesperson_id, EXTRACT(QUARTER FROM sale_date))
ORDER BY region, salesperson_id, quarter;

-- GROUPING SETS: Specific combinations
SELECT
    department_id,
    job_title,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY GROUPING SETS (
    (department_id),           -- By department
    (job_title),              -- By job title
    (department_id, job_title), -- By both
    ()                        -- Grand total
)
ORDER BY department_id, job_title;
```

## Filtering Aggregated Results (HAVING)

### 1. **Basic HAVING Clause**

```sql
-- Find departments with more than 10 employees
SELECT
    department_id,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 10
ORDER BY employee_count DESC;

-- Customers with high lifetime value
SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(total_amount) AS lifetime_value,
    AVG(total_amount) AS avg_order_value
FROM orders
GROUP BY customer_id
HAVING SUM(total_amount) > 10000
   AND COUNT(*) >= 5
ORDER BY lifetime_value DESC;
```

### 2. **Complex HAVING Conditions**

```sql
-- Sales regions performing above average
SELECT
    region,
    COUNT(*) AS sales_count,
    SUM(amount) AS total_sales,
    AVG(amount) AS avg_sale_amount
FROM sales
WHERE sale_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY region
HAVING SUM(amount) > (
    SELECT AVG(region_total)
    FROM (
        SELECT SUM(amount) AS region_total
        FROM sales
        WHERE sale_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY region
    ) region_totals
)
ORDER BY total_sales DESC;

-- Products with consistent high performance
SELECT
    product_id,
    COUNT(*) AS sale_count,
    AVG(amount) AS avg_sale_amount,
    STDDEV(amount) AS sale_amount_stddev
FROM sales
WHERE sale_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY product_id
HAVING COUNT(*) >= 20                    -- Sufficient data points
   AND AVG(amount) > 500                 -- High average
   AND STDDEV(amount) < AVG(amount) * 0.3 -- Low variability
ORDER BY avg_sale_amount DESC;
```

## Advanced Aggregate Techniques

### 1. **Conditional Aggregation**

```sql
-- Sales performance by quarter using conditional aggregation
SELECT
    salesperson_id,
    SUM(CASE WHEN EXTRACT(QUARTER FROM sale_date) = 1 THEN amount ELSE 0 END) AS q1_sales,
    SUM(CASE WHEN EXTRACT(QUARTER FROM sale_date) = 2 THEN amount ELSE 0 END) AS q2_sales,
    SUM(CASE WHEN EXTRACT(QUARTER FROM sale_date) = 3 THEN amount ELSE 0 END) AS q3_sales,
    SUM(CASE WHEN EXTRACT(QUARTER FROM sale_date) = 4 THEN amount ELSE 0 END) AS q4_sales,
    COUNT(CASE WHEN amount > 1000 THEN 1 END) AS high_value_sales_count,
    AVG(CASE WHEN customer_type = 'VIP' THEN amount END) AS avg_vip_sale
FROM sales
WHERE sale_date >= '2023-01-01'
GROUP BY salesperson_id
ORDER BY (q1_sales + q2_sales + q3_sales + q4_sales) DESC;

-- Customer segmentation analysis
SELECT
    CASE
        WHEN total_orders >= 50 THEN 'Platinum'
        WHEN total_orders >= 20 THEN 'Gold'
        WHEN total_orders >= 5 THEN 'Silver'
        ELSE 'Bronze'
    END AS customer_tier,
    COUNT(*) AS customer_count,
    AVG(total_spent) AS avg_lifetime_value,
    MIN(total_spent) AS min_spent,
    MAX(total_spent) AS max_spent
FROM (
    SELECT
        customer_id,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_spent
    FROM orders
    GROUP BY customer_id
) customer_summary
GROUP BY CASE
    WHEN total_orders >= 50 THEN 'Platinum'
    WHEN total_orders >= 20 THEN 'Gold'
    WHEN total_orders >= 5 THEN 'Silver'
    ELSE 'Bronze'
END
ORDER BY avg_lifetime_value DESC;
```

### 2. **Statistical Functions**

```sql
-- Comprehensive statistical analysis
SELECT
    department_id,
    COUNT(*) AS employee_count,

    -- Central tendency
    AVG(salary) AS mean_salary,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary,
    MODE() WITHIN GROUP (ORDER BY salary) AS modal_salary,

    -- Spread
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    MAX(salary) - MIN(salary) AS salary_range,
    STDDEV_POP(salary) AS salary_stddev,
    VAR_POP(salary) AS salary_variance,

    -- Quartiles
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) AS q1_salary,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) AS q3_salary,

    -- Distribution shape
    PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY salary) AS p10_salary,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY salary) AS p90_salary
FROM employees
GROUP BY department_id
HAVING COUNT(*) >= 10  -- Ensure sufficient sample size
ORDER BY mean_salary DESC;
```

### 3. **String Aggregation**

```sql
-- PostgreSQL string aggregation functions
SELECT
    department_id,
    COUNT(*) AS employee_count,
    STRING_AGG(first_name || ' ' || last_name, ', ' ORDER BY last_name) AS employee_list,
    ARRAY_AGG(salary ORDER BY salary DESC) AS salary_array,
    STRING_AGG(DISTINCT job_title, ', ') AS unique_job_titles
FROM employees
GROUP BY department_id
ORDER BY department_id;

-- Create hierarchical summaries
SELECT
    manager_id,
    COUNT(*) AS direct_reports,
    STRING_AGG(
        first_name || ' ' || last_name || ' ($' || salary::TEXT || ')',
        '; '
        ORDER BY salary DESC
    ) AS team_summary,
    SUM(salary) AS team_total_salary
FROM employees
WHERE manager_id IS NOT NULL
GROUP BY manager_id
ORDER BY team_total_salary DESC;
```

## Aggregate Functions with Window Functions

### 1. **Running Totals and Moving Averages**

```sql
-- Running totals and comparative analysis
SELECT
    order_id,
    customer_id,
    order_date,
    total_amount,

    -- Running aggregates
    SUM(total_amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS UNBOUNDED PRECEDING
    ) AS running_total_spent,

    COUNT(*) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS UNBOUNDED PRECEDING
    ) AS order_sequence_number,

    -- Moving averages
    AVG(total_amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS 2 PRECEDING
    ) AS moving_avg_3_orders,

    -- Comparison to overall aggregates
    total_amount - AVG(total_amount) OVER (PARTITION BY customer_id) AS vs_customer_avg,
    total_amount / SUM(total_amount) OVER (PARTITION BY customer_id) AS pct_of_customer_total
FROM orders
ORDER BY customer_id, order_date;
```

### 2. **Ranking and Percentiles**

```sql
-- Employee performance ranking within departments
SELECT
    employee_id,
    first_name,
    last_name,
    department_id,
    salary,

    -- Rankings
    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_rank,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_dense_rank,
    PERCENT_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_percentile,

    -- Quartiles
    NTILE(4) OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_quartile,

    -- Comparisons
    salary - AVG(salary) OVER (PARTITION BY department_id) AS vs_dept_average,
    salary / MAX(salary) OVER (PARTITION BY department_id) AS pct_of_max_salary
FROM employees
ORDER BY department_id, salary_rank;
```

## Real-World Business Examples

### 1. **Sales Performance Dashboard**

```sql
-- Comprehensive sales performance analysis
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', sale_date) AS month,
        salesperson_id,
        COUNT(*) AS deals_closed,
        SUM(amount) AS total_revenue,
        AVG(amount) AS avg_deal_size,
        MIN(amount) AS smallest_deal,
        MAX(amount) AS largest_deal
    FROM sales
    WHERE sale_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', sale_date), salesperson_id
),
salesperson_summary AS (
    SELECT
        salesperson_id,
        COUNT(*) AS months_active,
        SUM(deals_closed) AS total_deals,
        SUM(total_revenue) AS total_revenue,
        AVG(total_revenue) AS avg_monthly_revenue,
        MAX(total_revenue) AS best_month_revenue,
        MIN(total_revenue) AS worst_month_revenue,
        STDDEV(total_revenue) AS revenue_consistency
    FROM monthly_sales
    GROUP BY salesperson_id
)
SELECT
    sp.salesperson_name,
    ss.total_deals,
    ss.total_revenue,
    ss.avg_monthly_revenue,
    ss.best_month_revenue,
    ss.worst_month_revenue,
    CASE
        WHEN ss.revenue_consistency < ss.avg_monthly_revenue * 0.2 THEN 'Very Consistent'
        WHEN ss.revenue_consistency < ss.avg_monthly_revenue * 0.4 THEN 'Consistent'
        ELSE 'Variable'
    END AS performance_consistency,
    RANK() OVER (ORDER BY ss.total_revenue DESC) AS revenue_rank
FROM salesperson_summary ss
JOIN salespeople sp ON ss.salesperson_id = sp.salesperson_id
WHERE ss.months_active >= 6  -- At least 6 months of data
ORDER BY ss.total_revenue DESC;
```

### 2. **Customer Behavior Analysis**

```sql
-- Customer lifecycle and behavior patterns
WITH customer_metrics AS (
    SELECT
        o.customer_id,

        -- Order patterns
        COUNT(*) AS total_orders,
        MIN(o.order_date) AS first_order_date,
        MAX(o.order_date) AS last_order_date,
        MAX(o.order_date) - MIN(o.order_date) AS customer_lifespan_days,

        -- Financial metrics
        SUM(o.total_amount) AS lifetime_value,
        AVG(o.total_amount) AS avg_order_value,
        MIN(o.total_amount) AS smallest_order,
        MAX(o.total_amount) AS largest_order,

        -- Product diversity
        COUNT(DISTINCT oi.product_id) AS unique_products_purchased,
        COUNT(DISTINCT p.category_id) AS unique_categories_purchased,

        -- Frequency analysis
        AVG(
            CASE
                WHEN LAG(o.order_date) OVER (PARTITION BY o.customer_id ORDER BY o.order_date) IS NOT NULL
                THEN o.order_date - LAG(o.order_date) OVER (PARTITION BY o.customer_id ORDER BY o.order_date)
            END
        ) AS avg_days_between_orders

    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '24 months'
    GROUP BY o.customer_id
),
customer_segments AS (
    SELECT
        customer_id,
        total_orders,
        lifetime_value,
        avg_order_value,
        unique_products_purchased,
        avg_days_between_orders,
        CASE
            WHEN lifetime_value >= 10000 AND total_orders >= 20 THEN 'VIP'
            WHEN lifetime_value >= 5000 AND total_orders >= 10 THEN 'High Value'
            WHEN lifetime_value >= 1000 AND total_orders >= 5 THEN 'Regular'
            WHEN total_orders >= 2 THEN 'Occasional'
            ELSE 'One-time'
        END AS customer_segment
    FROM customer_metrics
)
SELECT
    customer_segment,
    COUNT(*) AS customer_count,
    ROUND(AVG(lifetime_value), 2) AS avg_lifetime_value,
    ROUND(AVG(avg_order_value), 2) AS avg_order_value,
    ROUND(AVG(total_orders), 1) AS avg_orders_per_customer,
    ROUND(AVG(unique_products_purchased), 1) AS avg_product_diversity,
    ROUND(AVG(avg_days_between_orders), 1) AS avg_purchase_frequency_days,
    SUM(lifetime_value) AS segment_total_value,
    ROUND(SUM(lifetime_value) * 100.0 / SUM(SUM(lifetime_value)) OVER (), 2) AS pct_of_total_revenue
FROM customer_segments
GROUP BY customer_segment
ORDER BY avg_lifetime_value DESC;
```

### 3. **Inventory and Product Performance**

```sql
-- Product performance and inventory optimization analysis
SELECT
    p.product_id,
    p.product_name,
    p.category,

    -- Sales performance
    COUNT(oi.order_item_id) AS times_ordered,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.quantity * oi.unit_price) AS total_revenue,
    AVG(oi.unit_price) AS avg_selling_price,

    -- Inventory efficiency
    ROUND(
        SUM(oi.quantity) /
        NULLIF(AVG(i.quantity_on_hand), 0), 2
    ) AS inventory_turnover_ratio,

    -- Customer reach
    COUNT(DISTINCT o.customer_id) AS unique_customers,

    -- Performance metrics
    AVG(pr.rating) AS avg_rating,
    COUNT(pr.review_id) AS review_count,

    -- Time-based analysis
    MIN(o.order_date) AS first_sale_date,
    MAX(o.order_date) AS last_sale_date,
    MAX(o.order_date) - MIN(o.order_date) AS product_active_days,

    -- Profitability (assuming cost data available)
    SUM(oi.quantity * (oi.unit_price - p.cost_price)) AS total_profit,
    AVG(oi.unit_price - p.cost_price) AS avg_profit_per_unit,

    -- Performance ranking
    RANK() OVER (ORDER BY SUM(oi.quantity * oi.unit_price) DESC) AS revenue_rank,
    RANK() OVER (PARTITION BY p.category ORDER BY SUM(oi.quantity) DESC) AS category_quantity_rank

FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id
LEFT JOIN inventory i ON p.product_id = i.product_id
LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '12 months'
   OR o.order_date IS NULL  -- Include products with no sales
GROUP BY p.product_id, p.product_name, p.category, p.cost_price
HAVING COUNT(oi.order_item_id) > 0  -- Only products with at least one sale
ORDER BY total_revenue DESC;
```

## Best Practices and Performance Tips

### 1. **Efficient Aggregation**

```sql
-- Use appropriate indexes for grouping columns
CREATE INDEX idx_sales_date_region ON sales(sale_date, region);
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Prefer covering indexes when possible
CREATE INDEX idx_orders_covering ON orders(customer_id, order_date)
INCLUDE (total_amount, order_status);
```

### 2. **Handling NULL Values**

```sql
-- Be explicit about NULL handling
SELECT
    department_id,
    COUNT(*) AS total_employees,
    COUNT(salary) AS employees_with_salary,    -- Excludes NULLs
    COUNT(*) - COUNT(salary) AS employees_without_salary,

    -- Use COALESCE for default values
    AVG(COALESCE(bonus, 0)) AS avg_bonus_including_zero,
    AVG(bonus) AS avg_bonus_excluding_null,

    -- Sum with explicit NULL handling
    SUM(CASE WHEN bonus IS NOT NULL THEN bonus ELSE 0 END) AS total_bonuses
FROM employees
GROUP BY department_id;
```

### 3. **Performance Optimization**

```sql
-- Use WHERE before GROUP BY to reduce data
SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_spent
FROM orders
WHERE order_date >= '2023-01-01'    -- Filter first
  AND order_status = 'completed'
GROUP BY customer_id
HAVING SUM(total_amount) > 1000;    -- Then filter aggregates

-- Consider using LIMIT with ORDER BY for top-N queries
SELECT
    product_id,
    SUM(quantity) AS total_sold
FROM order_items
GROUP BY product_id
ORDER BY total_sold DESC
LIMIT 10;  -- Top 10 best-selling products
```

Aggregate functions are essential tools for data analysis and reporting, enabling you to transform raw data into meaningful insights through summarization, statistical analysis, and pattern recognition.
