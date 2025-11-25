# Question 56: How do you use `WITH` (Common Table Expressions)?

## Overview

**Common Table Expressions (CTEs)** are temporary named result sets defined using the `WITH` clause that exist only for the duration of a single SQL statement. CTEs provide a way to write more readable, maintainable, and organized complex queries by breaking them into logical, reusable components.

### Basic Syntax:

```sql
WITH cte_name (optional_column_list) AS (
    SELECT statement
)
SELECT * FROM cte_name;
```

### Multiple CTEs:

```sql
WITH
cte1 AS (SELECT ...),
cte2 AS (SELECT ...),
cte3 AS (SELECT ...)
SELECT * FROM cte1
JOIN cte2 ON ...
JOIN cte3 ON ...;
```

### Key Characteristics:

- **Temporary scope**: Exists only for the duration of the query
- **Reusable**: Can be referenced multiple times in the same query
- **Readable**: Improves query organization and readability
- **Performance**: Can improve performance by avoiding repeated subqueries
- **Recursive capability**: Supports recursive operations (covered separately)
- **Standard SQL**: Part of the SQL standard, widely supported

## Basic CTE Examples

### 1. **Simple Data Preparation**

```sql
-- Basic CTE for data filtering and preparation
WITH active_customers AS (
    SELECT
        customer_id,
        customer_name,
        email,
        registration_date
    FROM customers
    WHERE status = 'active'
      AND registration_date >= '2023-01-01'
)
SELECT
    customer_id,
    customer_name,
    email
FROM active_customers
ORDER BY registration_date DESC;

-- CTE for calculated columns
WITH customer_metrics AS (
    SELECT
        customer_id,
        customer_name,
        COUNT(*) AS total_orders,
        SUM(order_total) AS total_spent,
        AVG(order_total) AS avg_order_value,
        MAX(order_date) AS last_order_date
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    WHERE o.order_date >= '2023-01-01'
    GROUP BY c.customer_id, c.customer_name
)
SELECT
    customer_name,
    total_orders,
    total_spent,
    ROUND(avg_order_value, 2) AS avg_order_value,
    last_order_date,
    CASE
        WHEN total_spent > 10000 THEN 'VIP'
        WHEN total_spent > 5000 THEN 'Premium'
        ELSE 'Regular'
    END AS customer_tier
FROM customer_metrics
ORDER BY total_spent DESC;
```

### 2. **Multiple CTEs for Complex Logic**

```sql
-- Multi-step analysis using multiple CTEs
WITH
-- Step 1: Calculate monthly sales
monthly_sales AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        salesperson_id,
        COUNT(*) AS orders_count,
        SUM(order_total) AS monthly_revenue
    FROM orders
    WHERE order_date >= '2023-01-01'
    GROUP BY DATE_TRUNC('month', order_date), salesperson_id
),

-- Step 2: Calculate salesperson averages
salesperson_avg AS (
    SELECT
        salesperson_id,
        AVG(monthly_revenue) AS avg_monthly_revenue,
        STDDEV(monthly_revenue) AS revenue_stddev,
        COUNT(*) AS active_months
    FROM monthly_sales
    GROUP BY salesperson_id
),

-- Step 3: Identify top performers
top_performers AS (
    SELECT
        salesperson_id,
        avg_monthly_revenue
    FROM salesperson_avg
    WHERE avg_monthly_revenue > (SELECT AVG(avg_monthly_revenue) FROM salesperson_avg)
      AND active_months >= 6  -- At least 6 months active
)

-- Final query combining all CTEs
SELECT
    sp.salesperson_name,
    sa.avg_monthly_revenue,
    sa.revenue_stddev,
    sa.active_months,
    CASE
        WHEN tp.salesperson_id IS NOT NULL THEN 'Top Performer'
        ELSE 'Regular Performer'
    END AS performance_category
FROM salesperson_avg sa
JOIN salespeople sp ON sa.salesperson_id = sp.salesperson_id
LEFT JOIN top_performers tp ON sa.salesperson_id = tp.salesperson_id
ORDER BY sa.avg_monthly_revenue DESC;
```

### 3. **CTE for Data Deduplication**

```sql
-- Remove duplicates using CTE with window functions
WITH deduplicated_customers AS (
    SELECT
        customer_id,
        customer_name,
        email,
        phone,
        registration_date,
        ROW_NUMBER() OVER (
            PARTITION BY email
            ORDER BY registration_date DESC
        ) AS row_num
    FROM customers
    WHERE email IS NOT NULL
),

unique_customers AS (
    SELECT
        customer_id,
        customer_name,
        email,
        phone,
        registration_date
    FROM deduplicated_customers
    WHERE row_num = 1  -- Keep only the most recent registration per email
)

SELECT
    customer_id,
    customer_name,
    email,
    registration_date
FROM unique_customers
ORDER BY registration_date DESC;
```

## Advanced CTE Applications

### 1. **Data Transformation and ETL**

```sql
-- Complex data transformation pipeline using CTEs
WITH
-- Step 1: Raw data cleaning
cleaned_sales AS (
    SELECT
        sale_id,
        NULLIF(TRIM(customer_name), '') AS customer_name,
        CASE
            WHEN sale_amount <= 0 THEN NULL
            ELSE sale_amount
        END AS sale_amount,
        sale_date,
        UPPER(TRIM(region)) AS region,
        NULLIF(TRIM(product_category), '') AS product_category
    FROM raw_sales_data
    WHERE sale_date IS NOT NULL
      AND sale_id IS NOT NULL
),

-- Step 2: Add derived fields
enriched_sales AS (
    SELECT
        sale_id,
        customer_name,
        sale_amount,
        sale_date,
        region,
        product_category,
        EXTRACT(YEAR FROM sale_date) AS sale_year,
        EXTRACT(QUARTER FROM sale_date) AS sale_quarter,
        EXTRACT(MONTH FROM sale_date) AS sale_month,
        CASE
            WHEN sale_amount > 1000 THEN 'High Value'
            WHEN sale_amount > 100 THEN 'Medium Value'
            ELSE 'Low Value'
        END AS sale_tier
    FROM cleaned_sales
    WHERE sale_amount IS NOT NULL
      AND customer_name IS NOT NULL
),

-- Step 3: Calculate customer aggregates
customer_summary AS (
    SELECT
        customer_name,
        region,
        COUNT(*) AS total_transactions,
        SUM(sale_amount) AS total_revenue,
        AVG(sale_amount) AS avg_transaction_value,
        MIN(sale_date) AS first_purchase_date,
        MAX(sale_date) AS last_purchase_date,
        COUNT(DISTINCT product_category) AS categories_purchased
    FROM enriched_sales
    GROUP BY customer_name, region
),

-- Step 4: Calculate regional benchmarks
regional_benchmarks AS (
    SELECT
        region,
        AVG(total_revenue) AS avg_customer_value,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_revenue) AS median_customer_value,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_revenue) AS p75_customer_value
    FROM customer_summary
    GROUP BY region
)

-- Final output: Customer classification
SELECT
    cs.customer_name,
    cs.region,
    cs.total_transactions,
    cs.total_revenue,
    cs.avg_transaction_value,
    cs.categories_purchased,
    rb.avg_customer_value AS region_avg_value,
    CASE
        WHEN cs.total_revenue > rb.p75_customer_value THEN 'Top 25%'
        WHEN cs.total_revenue > rb.median_customer_value THEN 'Above Average'
        WHEN cs.total_revenue > rb.avg_customer_value * 0.5 THEN 'Below Average'
        ELSE 'Bottom Tier'
    END AS customer_segment,
    ROUND(cs.total_revenue / rb.avg_customer_value, 2) AS vs_region_avg_ratio
FROM customer_summary cs
JOIN regional_benchmarks rb ON cs.region = rb.region
ORDER BY cs.region, cs.total_revenue DESC;
```

### 2. **Financial Analysis and Reporting**

```sql
-- Comprehensive financial analysis using CTEs
WITH
-- Monthly revenue calculations
monthly_revenue AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        SUM(order_total) AS gross_revenue,
        SUM(order_total - COALESCE(discount_amount, 0)) AS net_revenue,
        COUNT(*) AS order_count,
        COUNT(DISTINCT customer_id) AS unique_customers
    FROM orders
    WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
    GROUP BY DATE_TRUNC('month', order_date)
),

-- Calculate growth metrics
revenue_growth AS (
    SELECT
        month,
        gross_revenue,
        net_revenue,
        order_count,
        unique_customers,
        LAG(gross_revenue) OVER (ORDER BY month) AS prev_month_revenue,
        LAG(order_count) OVER (ORDER BY month) AS prev_month_orders,
        LAG(unique_customers) OVER (ORDER BY month) AS prev_month_customers
    FROM monthly_revenue
),

-- Growth rates and trends
growth_analysis AS (
    SELECT
        month,
        gross_revenue,
        net_revenue,
        order_count,
        unique_customers,
        CASE
            WHEN prev_month_revenue > 0 THEN
                ROUND(((gross_revenue - prev_month_revenue) / prev_month_revenue * 100), 2)
            ELSE NULL
        END AS revenue_growth_percent,
        CASE
            WHEN prev_month_orders > 0 THEN
                ROUND(((order_count::DECIMAL - prev_month_orders) / prev_month_orders * 100), 2)
            ELSE NULL
        END AS order_growth_percent,
        CASE
            WHEN prev_month_customers > 0 THEN
                ROUND(((unique_customers::DECIMAL - prev_month_customers) / prev_month_customers * 100), 2)
            ELSE NULL
        END AS customer_growth_percent
    FROM revenue_growth
),

-- Calculate moving averages
trend_analysis AS (
    SELECT
        month,
        gross_revenue,
        revenue_growth_percent,
        order_growth_percent,
        customer_growth_percent,
        AVG(gross_revenue) OVER (
            ORDER BY month
            ROWS 2 PRECEDING
        ) AS three_month_avg_revenue,
        AVG(revenue_growth_percent) OVER (
            ORDER BY month
            ROWS 2 PRECEDING
        ) AS three_month_avg_growth
    FROM growth_analysis
    WHERE revenue_growth_percent IS NOT NULL
)

-- Final report
SELECT
    TO_CHAR(month, 'YYYY-MM') AS month,
    TO_CHAR(gross_revenue, '$999,999,999') AS gross_revenue,
    revenue_growth_percent || '%' AS revenue_growth,
    order_growth_percent || '%' AS order_growth,
    customer_growth_percent || '%' AS customer_growth,
    TO_CHAR(three_month_avg_revenue, '$999,999,999') AS three_month_avg,
    ROUND(three_month_avg_growth, 1) || '%' AS avg_growth_trend,
    CASE
        WHEN revenue_growth_percent > 10 THEN 'Strong Growth'
        WHEN revenue_growth_percent > 5 THEN 'Moderate Growth'
        WHEN revenue_growth_percent > 0 THEN 'Slow Growth'
        WHEN revenue_growth_percent > -5 THEN 'Slight Decline'
        ELSE 'Significant Decline'
    END AS growth_category
FROM trend_analysis
ORDER BY month;
```

### 3. **Customer Cohort Analysis**

```sql
-- Customer cohort analysis using CTEs
WITH
-- Identify first purchase month for each customer
customer_cohorts AS (
    SELECT
        customer_id,
        MIN(DATE_TRUNC('month', order_date)) AS cohort_month
    FROM orders
    WHERE order_date >= '2023-01-01'
    GROUP BY customer_id
),

-- All customer order data with cohort information
customer_orders AS (
    SELECT
        o.customer_id,
        o.order_date,
        o.order_total,
        cc.cohort_month,
        DATE_TRUNC('month', o.order_date) AS order_month,
        EXTRACT(EPOCH FROM DATE_TRUNC('month', o.order_date) - cc.cohort_month)
        / EXTRACT(EPOCH FROM INTERVAL '1 month') AS period_number
    FROM orders o
    JOIN customer_cohorts cc ON o.customer_id = cc.customer_id
    WHERE o.order_date >= '2023-01-01'
),

-- Cohort sizes (customers acquired each month)
cohort_sizes AS (
    SELECT
        cohort_month,
        COUNT(DISTINCT customer_id) AS cohort_size
    FROM customer_cohorts
    GROUP BY cohort_month
),

-- Customer activity by cohort and period
cohort_activity AS (
    SELECT
        cohort_month,
        period_number,
        COUNT(DISTINCT customer_id) AS active_customers,
        SUM(order_total) AS cohort_revenue,
        COUNT(*) AS total_orders
    FROM customer_orders
    GROUP BY cohort_month, period_number
),

-- Calculate retention rates
retention_rates AS (
    SELECT
        ca.cohort_month,
        ca.period_number,
        ca.active_customers,
        ca.cohort_revenue,
        ca.total_orders,
        cs.cohort_size,
        ROUND(ca.active_customers::DECIMAL / cs.cohort_size * 100, 2) AS retention_rate,
        ROUND(ca.cohort_revenue / ca.active_customers, 2) AS avg_revenue_per_customer
    FROM cohort_activity ca
    JOIN cohort_sizes cs ON ca.cohort_month = cs.cohort_month
)

-- Pivot retention data for easy analysis
SELECT
    TO_CHAR(cohort_month, 'YYYY-MM') AS cohort,
    cohort_size,
    MAX(CASE WHEN period_number = 0 THEN retention_rate END) AS month_0,
    MAX(CASE WHEN period_number = 1 THEN retention_rate END) AS month_1,
    MAX(CASE WHEN period_number = 2 THEN retention_rate END) AS month_2,
    MAX(CASE WHEN period_number = 3 THEN retention_rate END) AS month_3,
    MAX(CASE WHEN period_number = 6 THEN retention_rate END) AS month_6,
    MAX(CASE WHEN period_number = 12 THEN retention_rate END) AS month_12,
    SUM(cohort_revenue) AS total_cohort_revenue,
    ROUND(SUM(cohort_revenue) / cohort_size, 2) AS revenue_per_acquired_customer
FROM retention_rates
WHERE period_number IN (0, 1, 2, 3, 6, 12)
GROUP BY cohort_month, cohort_size
ORDER BY cohort_month;
```

### 4. **Product Recommendation Analysis**

```sql
-- Product recommendation engine using CTEs
WITH
-- Customer purchase history
customer_purchases AS (
    SELECT
        o.customer_id,
        oi.product_id,
        p.product_name,
        p.category,
        COUNT(*) AS purchase_count,
        SUM(oi.quantity) AS total_quantity,
        AVG(oi.unit_price) AS avg_price
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY o.customer_id, oi.product_id, p.product_name, p.category
),

-- Find customers who bought similar products
product_similarities AS (
    SELECT
        cp1.customer_id AS customer1,
        cp2.customer_id AS customer2,
        COUNT(*) AS common_products,
        ARRAY_AGG(cp1.product_id) AS shared_products
    FROM customer_purchases cp1
    JOIN customer_purchases cp2 ON cp1.product_id = cp2.product_id
    WHERE cp1.customer_id < cp2.customer_id  -- Avoid duplicates
    GROUP BY cp1.customer_id, cp2.customer_id
    HAVING COUNT(*) >= 3  -- At least 3 common products
),

-- Calculate customer similarity scores
customer_similarities AS (
    SELECT
        customer1,
        customer2,
        common_products,
        ROUND(
            common_products::DECIMAL /
            (SELECT COUNT(DISTINCT product_id) FROM customer_purchases WHERE customer_id IN (customer1, customer2)) * 100,
            2
        ) AS similarity_score
    FROM product_similarities
),

-- Find recommendations for each customer
recommendations AS (
    SELECT
        cs.customer1 AS target_customer,
        cp.product_id AS recommended_product,
        cp.product_name,
        cp.category,
        AVG(cs.similarity_score) AS avg_similarity,
        SUM(cp.purchase_count) AS recommendation_strength,
        COUNT(*) AS recommender_count
    FROM customer_similarities cs
    JOIN customer_purchases cp ON cs.customer2 = cp.customer_id
    LEFT JOIN customer_purchases cp_target ON cs.customer1 = cp_target.customer_id
                                           AND cp.product_id = cp_target.product_id
    WHERE cp_target.product_id IS NULL  -- Customer hasn't bought this product yet
      AND cs.similarity_score > 20  -- Only similar customers
    GROUP BY cs.customer1, cp.product_id, cp.product_name, cp.category
)

-- Top recommendations per customer
SELECT
    c.customer_name,
    r.product_name,
    r.category,
    r.avg_similarity AS similarity_score,
    r.recommendation_strength,
    r.recommender_count,
    ROW_NUMBER() OVER (
        PARTITION BY r.target_customer
        ORDER BY r.recommendation_strength DESC, r.avg_similarity DESC
    ) AS recommendation_rank
FROM recommendations r
JOIN customers c ON r.target_customer = c.customer_id
WHERE r.recommender_count >= 2  -- At least 2 similar customers recommend it
ORDER BY r.target_customer, recommendation_rank
LIMIT 100;
```

## CTEs vs Alternatives

### 1. **CTE vs Subquery**

```sql
-- Using CTE (more readable)
WITH high_value_customers AS (
    SELECT customer_id, total_spent
    FROM customer_summary
    WHERE total_spent > 10000
)
SELECT
    c.customer_name,
    hvc.total_spent,
    COUNT(o.order_id) AS recent_orders
FROM high_value_customers hvc
JOIN customers c ON hvc.customer_id = c.customer_id
LEFT JOIN orders o ON c.customer_id = o.customer_id
                   AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.customer_name, hvc.total_spent;

-- Using subquery (less readable, can't reuse)
SELECT
    c.customer_name,
    cs.total_spent,
    COUNT(o.order_id) AS recent_orders
FROM (
    SELECT customer_id, total_spent
    FROM customer_summary
    WHERE total_spent > 10000
) cs
JOIN customers c ON cs.customer_id = c.customer_id
LEFT JOIN orders o ON c.customer_id = o.customer_id
                   AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.customer_name, cs.total_spent;
```

### 2. **CTE vs Temporary Table**

```sql
-- CTE (cleaner, automatic cleanup)
WITH temp_sales_summary AS (
    SELECT
        salesperson_id,
        SUM(sale_amount) AS total_sales
    FROM sales
    WHERE sale_date >= '2023-01-01'
    GROUP BY salesperson_id
)
SELECT * FROM temp_sales_summary WHERE total_sales > 100000;

-- Temporary table (requires explicit management)
CREATE TEMP TABLE temp_sales_summary AS
SELECT
    salesperson_id,
    SUM(sale_amount) AS total_sales
FROM sales
WHERE sale_date >= '2023-01-01'
GROUP BY salesperson_id;

SELECT * FROM temp_sales_summary WHERE total_sales > 100000;
DROP TABLE temp_sales_summary;  -- Manual cleanup required
```

## Performance Considerations

### 1. **CTE Materialization**

```sql
-- PostgreSQL may materialize CTEs, which can be good or bad for performance
-- Force materialization (PostgreSQL 12+)
WITH MATERIALIZED expensive_calculation AS (
    SELECT
        customer_id,
        complex_calculation_function(customer_data) AS result
    FROM customers
)
SELECT * FROM expensive_calculation WHERE result > 100;

-- Prevent materialization (PostgreSQL 12+)
WITH NOT MATERIALIZED simple_filter AS (
    SELECT customer_id, customer_name
    FROM customers
    WHERE status = 'active'
)
SELECT * FROM simple_filter WHERE customer_name LIKE 'A%';
```

### 2. **Indexing for CTE Performance**

```sql
-- Ensure proper indexes exist for CTE queries
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);
CREATE INDEX idx_orders_date_status ON orders(order_date, status);

-- CTE that can benefit from these indexes
WITH recent_orders AS (
    SELECT
        customer_id,
        COUNT(*) AS order_count,
        SUM(order_total) AS total_spent
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
      AND status = 'completed'
    GROUP BY customer_id
)
SELECT
    c.customer_name,
    ro.order_count,
    ro.total_spent
FROM recent_orders ro
JOIN customers c ON ro.customer_id = c.customer_id
WHERE ro.order_count > 5;
```

### 3. **Best Practices**

```sql
-- Good: Break complex logic into logical steps
WITH
step1_filter AS (
    SELECT customer_id, order_date, order_total
    FROM orders
    WHERE order_date >= '2023-01-01'
      AND status = 'completed'
),
step2_aggregate AS (
    SELECT
        customer_id,
        COUNT(*) AS order_count,
        SUM(order_total) AS total_spent
    FROM step1_filter
    GROUP BY customer_id
),
step3_classify AS (
    SELECT
        customer_id,
        order_count,
        total_spent,
        CASE
            WHEN total_spent > 10000 THEN 'VIP'
            WHEN total_spent > 5000 THEN 'Premium'
            ELSE 'Regular'
        END AS customer_tier
    FROM step2_aggregate
)
SELECT * FROM step3_classify WHERE customer_tier = 'VIP';

-- Avoid: Overly complex single CTE
-- WITH complex_cte AS (
--     -- 50 lines of complex logic here
--     -- Hard to debug and maintain
-- )
```

Common Table Expressions are powerful tools for writing maintainable, readable SQL code that breaks complex operations into logical, reusable components. They're especially valuable for data analysis, reporting, and ETL processes.
