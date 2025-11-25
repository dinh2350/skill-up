# Question 58: How do you pivot data in PostgreSQL?

## Overview

**Data pivoting** transforms rows into columns, converting unique values from one column into multiple columns. PostgreSQL doesn't have a built-in `PIVOT` operator like some other databases, but you can achieve pivoting using several techniques: conditional aggregation with `CASE` statements, the `crosstab()` function from the tablefunc extension, or dynamic SQL generation.

### Common Pivoting Techniques:

1. **Conditional Aggregation** (using `CASE` with `SUM/COUNT/MAX`)
2. **PostgreSQL `crosstab()` function** (requires tablefunc extension)
3. **Dynamic SQL generation** (for unknown column values)
4. **Filter clause** (PostgreSQL 9.4+)

## Method 1: Conditional Aggregation (Most Common)

### 1. **Basic Pivoting with CASE**

```sql
-- Sample data: Sales by salesperson and quarter
CREATE TABLE sales_data (
    salesperson VARCHAR(50),
    quarter VARCHAR(10),
    sales_amount DECIMAL(10,2)
);

INSERT INTO sales_data VALUES
    ('Alice', 'Q1', 15000),
    ('Alice', 'Q2', 18000),
    ('Alice', 'Q3', 16500),
    ('Alice', 'Q4', 19000),
    ('Bob', 'Q1', 12000),
    ('Bob', 'Q2', 14000),
    ('Bob', 'Q4', 13500),
    ('Carol', 'Q2', 17000),
    ('Carol', 'Q3', 15500),
    ('Carol', 'Q4', 18500);

-- Pivot: Transform quarters from rows to columns
SELECT
    salesperson,
    SUM(CASE WHEN quarter = 'Q1' THEN sales_amount ELSE 0 END) AS q1_sales,
    SUM(CASE WHEN quarter = 'Q2' THEN sales_amount ELSE 0 END) AS q2_sales,
    SUM(CASE WHEN quarter = 'Q3' THEN sales_amount ELSE 0 END) AS q3_sales,
    SUM(CASE WHEN quarter = 'Q4' THEN sales_amount ELSE 0 END) AS q4_sales,
    SUM(sales_amount) AS total_sales
FROM sales_data
GROUP BY salesperson
ORDER BY total_sales DESC;

-- Using COUNT for presence/absence
SELECT
    salesperson,
    COUNT(CASE WHEN quarter = 'Q1' THEN 1 END) AS q1_count,
    COUNT(CASE WHEN quarter = 'Q2' THEN 1 END) AS q2_count,
    COUNT(CASE WHEN quarter = 'Q3' THEN 1 END) AS q3_count,
    COUNT(CASE WHEN quarter = 'Q4' THEN 1 END) AS q4_count
FROM sales_data
GROUP BY salesperson;

-- Using MAX for latest/highest values
SELECT
    salesperson,
    MAX(CASE WHEN quarter = 'Q1' THEN sales_amount END) AS q1_max,
    MAX(CASE WHEN quarter = 'Q2' THEN sales_amount END) AS q2_max,
    MAX(CASE WHEN quarter = 'Q3' THEN sales_amount END) AS q3_max,
    MAX(CASE WHEN quarter = 'Q4' THEN sales_amount END) AS q4_max
FROM sales_data
GROUP BY salesperson;
```

### 2. **Complex Pivoting with Multiple Dimensions**

```sql
-- Sales data with product categories
CREATE TABLE detailed_sales (
    region VARCHAR(20),
    product_category VARCHAR(30),
    quarter VARCHAR(10),
    sales_amount DECIMAL(12,2),
    units_sold INTEGER
);

-- Pivot by quarter AND category
SELECT
    region,

    -- Electronics by quarter
    SUM(CASE WHEN product_category = 'Electronics' AND quarter = 'Q1' THEN sales_amount ELSE 0 END) AS electronics_q1,
    SUM(CASE WHEN product_category = 'Electronics' AND quarter = 'Q2' THEN sales_amount ELSE 0 END) AS electronics_q2,
    SUM(CASE WHEN product_category = 'Electronics' AND quarter = 'Q3' THEN sales_amount ELSE 0 END) AS electronics_q3,
    SUM(CASE WHEN product_category = 'Electronics' AND quarter = 'Q4' THEN sales_amount ELSE 0 END) AS electronics_q4,

    -- Clothing by quarter
    SUM(CASE WHEN product_category = 'Clothing' AND quarter = 'Q1' THEN sales_amount ELSE 0 END) AS clothing_q1,
    SUM(CASE WHEN product_category = 'Clothing' AND quarter = 'Q2' THEN sales_amount ELSE 0 END) AS clothing_q2,
    SUM(CASE WHEN product_category = 'Clothing' AND quarter = 'Q3' THEN sales_amount ELSE 0 END) AS clothing_q3,
    SUM(CASE WHEN product_category = 'Clothing' AND quarter = 'Q4' THEN sales_amount ELSE 0 END) AS clothing_q4,

    -- Totals
    SUM(CASE WHEN product_category = 'Electronics' THEN sales_amount ELSE 0 END) AS electronics_total,
    SUM(CASE WHEN product_category = 'Clothing' THEN sales_amount ELSE 0 END) AS clothing_total

FROM detailed_sales
GROUP BY region
ORDER BY region;

-- Pivot with calculated percentages
WITH sales_totals AS (
    SELECT
        region,
        product_category,
        quarter,
        sales_amount,
        SUM(sales_amount) OVER (PARTITION BY region) AS region_total
    FROM detailed_sales
)
SELECT
    region,
    ROUND(SUM(CASE WHEN quarter = 'Q1' THEN sales_amount ELSE 0 END), 2) AS q1_sales,
    ROUND(SUM(CASE WHEN quarter = 'Q2' THEN sales_amount ELSE 0 END), 2) AS q2_sales,
    ROUND(SUM(CASE WHEN quarter = 'Q3' THEN sales_amount ELSE 0 END), 2) AS q3_sales,
    ROUND(SUM(CASE WHEN quarter = 'Q4' THEN sales_amount ELSE 0 END), 2) AS q4_sales,

    -- Percentages
    ROUND(SUM(CASE WHEN quarter = 'Q1' THEN sales_amount ELSE 0 END) / MAX(region_total) * 100, 1) || '%' AS q1_percent,
    ROUND(SUM(CASE WHEN quarter = 'Q2' THEN sales_amount ELSE 0 END) / MAX(region_total) * 100, 1) || '%' AS q2_percent,
    ROUND(SUM(CASE WHEN quarter = 'Q3' THEN sales_amount ELSE 0 END) / MAX(region_total) * 100, 1) || '%' AS q3_percent,
    ROUND(SUM(CASE WHEN quarter = 'Q4' THEN sales_amount ELSE 0 END) / MAX(region_total) * 100, 1) || '%' AS q4_percent

FROM sales_totals
GROUP BY region
ORDER BY SUM(sales_amount) DESC;
```

### 3. **Using FILTER Clause (PostgreSQL 9.4+)**

```sql
-- More readable syntax using FILTER
SELECT
    salesperson,
    SUM(sales_amount) FILTER (WHERE quarter = 'Q1') AS q1_sales,
    SUM(sales_amount) FILTER (WHERE quarter = 'Q2') AS q2_sales,
    SUM(sales_amount) FILTER (WHERE quarter = 'Q3') AS q3_sales,
    SUM(sales_amount) FILTER (WHERE quarter = 'Q4') AS q4_sales,

    COUNT(*) FILTER (WHERE quarter = 'Q1') AS q1_transactions,
    COUNT(*) FILTER (WHERE quarter = 'Q2') AS q2_transactions,
    COUNT(*) FILTER (WHERE quarter = 'Q3') AS q3_transactions,
    COUNT(*) FILTER (WHERE quarter = 'Q4') AS q4_transactions,

    AVG(sales_amount) FILTER (WHERE quarter = 'Q1') AS q1_avg_sale,
    AVG(sales_amount) FILTER (WHERE quarter = 'Q2') AS q2_avg_sale,
    AVG(sales_amount) FILTER (WHERE quarter = 'Q3') AS q3_avg_sale,
    AVG(sales_amount) FILTER (WHERE quarter = 'Q4') AS q4_avg_sale

FROM sales_data
GROUP BY salesperson
ORDER BY salesperson;

-- Complex aggregations with FILTER
SELECT
    region,

    -- Revenue metrics
    SUM(sales_amount) FILTER (WHERE product_category = 'Electronics') AS electronics_revenue,
    SUM(sales_amount) FILTER (WHERE product_category = 'Clothing') AS clothing_revenue,
    SUM(sales_amount) FILTER (WHERE product_category = 'Books') AS books_revenue,

    -- Volume metrics
    SUM(units_sold) FILTER (WHERE product_category = 'Electronics') AS electronics_units,
    SUM(units_sold) FILTER (WHERE product_category = 'Clothing') AS clothing_units,
    SUM(units_sold) FILTER (WHERE product_category = 'Books') AS books_units,

    -- Average selling price
    ROUND(
        SUM(sales_amount) FILTER (WHERE product_category = 'Electronics') /
        NULLIF(SUM(units_sold) FILTER (WHERE product_category = 'Electronics'), 0), 2
    ) AS electronics_avg_price,

    ROUND(
        SUM(sales_amount) FILTER (WHERE product_category = 'Clothing') /
        NULLIF(SUM(units_sold) FILTER (WHERE product_category = 'Clothing'), 0), 2
    ) AS clothing_avg_price

FROM detailed_sales
GROUP BY region
ORDER BY SUM(sales_amount) DESC;
```

## Method 2: PostgreSQL crosstab() Function

### 1. **Setting up tablefunc Extension**

```sql
-- Enable the tablefunc extension
CREATE EXTENSION IF NOT EXISTS tablefunc;

-- Basic crosstab syntax
SELECT *
FROM crosstab(
    'SELECT row_name, category, value FROM source_table ORDER BY row_name, category',
    'VALUES (''cat1''), (''cat2''), (''cat3'')'  -- Define column order
) AS result_table(row_name TEXT, cat1 NUMERIC, cat2 NUMERIC, cat3 NUMERIC);
```

### 2. **Real Examples with crosstab()**

```sql
-- Example: Monthly sales pivot
SELECT *
FROM crosstab(
    'SELECT salesperson, quarter, sales_amount
     FROM sales_data
     ORDER BY salesperson, quarter',
    'VALUES (''Q1''), (''Q2''), (''Q3''), (''Q4'')'
) AS pivoted_sales(
    salesperson TEXT,
    q1 DECIMAL(10,2),
    q2 DECIMAL(10,2),
    q3 DECIMAL(10,2),
    q4 DECIMAL(10,2)
);

-- Example: Product category performance by region
SELECT *
FROM crosstab(
    'SELECT region, product_category, SUM(sales_amount)
     FROM detailed_sales
     GROUP BY region, product_category
     ORDER BY region, product_category',
    'SELECT DISTINCT product_category FROM detailed_sales ORDER BY product_category'
) AS category_by_region(
    region TEXT,
    books DECIMAL(12,2),
    clothing DECIMAL(12,2),
    electronics DECIMAL(12,2)
);

-- Dynamic column definition using crosstab with automatic category detection
SELECT *
FROM crosstab(
    'SELECT employee_id, skill_name, proficiency_score
     FROM employee_skills
     ORDER BY employee_id, skill_name'
) AS skills_matrix(
    employee_id INTEGER,
    java DECIMAL(3,1),
    python DECIMAL(3,1),
    sql DECIMAL(3,1),
    javascript DECIMAL(3,1)
);
```

### 3. **Advanced crosstab() Usage**

```sql
-- Multiple value columns
SELECT *
FROM crosstab(
    'SELECT
        CONCAT(region, '' - '', quarter) as row_id,
        product_category,
        CONCAT(sales_amount, '','', units_sold) as combined_values
     FROM detailed_sales
     ORDER BY 1, 2'
) AS multi_value_pivot(
    region_quarter TEXT,
    electronics TEXT,
    clothing TEXT,
    books TEXT
);

-- Time series pivot with crosstab
SELECT *
FROM crosstab(
    'SELECT
        product_id,
        TO_CHAR(sale_date, ''YYYY-MM'') as month,
        SUM(quantity_sold)
     FROM product_sales
     WHERE sale_date >= ''2024-01-01''
     GROUP BY product_id, TO_CHAR(sale_date, ''YYYY-MM'')
     ORDER BY product_id, month',
    'SELECT generate_series(1,12) as month_num'
) AS monthly_sales(
    product_id INTEGER,
    jan INTEGER,
    feb INTEGER,
    mar INTEGER,
    apr INTEGER,
    may INTEGER,
    jun INTEGER,
    jul INTEGER,
    aug INTEGER,
    sep INTEGER,
    oct INTEGER,
    nov INTEGER,
    dec INTEGER
);
```

## Method 3: Dynamic Pivoting

### 1. **Dynamic SQL Generation**

```sql
-- Function to generate dynamic pivot SQL
CREATE OR REPLACE FUNCTION generate_pivot_sql(
    source_table TEXT,
    row_column TEXT,
    pivot_column TEXT,
    value_column TEXT,
    aggregate_function TEXT DEFAULT 'SUM'
)
RETURNS TEXT AS $$
DECLARE
    sql_query TEXT;
    pivot_values TEXT;
BEGIN
    -- Get distinct values for pivot columns
    EXECUTE format(
        'SELECT string_agg(DISTINCT %L || ''('' || %I || '') AS '' ||
         quote_ident(%I), '', '')
         FROM %I',
        aggregate_function,
        value_column,
        pivot_column,
        source_table
    ) INTO pivot_values;

    -- Build the complete query
    sql_query := format(
        'SELECT %I, %s FROM %I GROUP BY %I ORDER BY %I',
        row_column,
        pivot_values,
        source_table,
        row_column,
        row_column
    );

    RETURN sql_query;
END;
$$ LANGUAGE plpgsql;

-- Usage example
SELECT generate_pivot_sql('sales_data', 'salesperson', 'quarter', 'sales_amount');
```

### 2. **Using DO Block for Dynamic Execution**

```sql
DO $$
DECLARE
    sql_query TEXT;
    pivot_cols TEXT;
BEGIN
    -- Generate pivot columns dynamically
    SELECT string_agg(
        format('SUM(CASE WHEN quarter = %L THEN sales_amount ELSE 0 END) AS %I',
               quarter,
               lower(quarter) || '_sales'
        ), ', '
    )
    INTO pivot_cols
    FROM (SELECT DISTINCT quarter FROM sales_data ORDER BY quarter) q;

    -- Build complete query
    sql_query := format('
        CREATE TEMP VIEW dynamic_sales_pivot AS
        SELECT salesperson, %s, SUM(sales_amount) as total_sales
        FROM sales_data
        GROUP BY salesperson',
        pivot_cols
    );

    -- Execute the dynamic query
    EXECUTE sql_query;
END $$;

-- Query the dynamically created view
SELECT * FROM dynamic_sales_pivot ORDER BY total_sales DESC;
```

## Real-World Pivoting Examples

### 1. **Customer Behavior Analysis**

```sql
-- Customer purchase patterns by product category and month
WITH monthly_purchases AS (
    SELECT
        customer_id,
        EXTRACT(MONTH FROM order_date) AS month,
        product_category,
        SUM(order_amount) AS monthly_spend
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE order_date >= '2024-01-01'
    GROUP BY customer_id, EXTRACT(MONTH FROM order_date), product_category
)
SELECT
    customer_id,

    -- Electronics spending by month
    SUM(monthly_spend) FILTER (WHERE product_category = 'Electronics' AND month = 1) AS electronics_jan,
    SUM(monthly_spend) FILTER (WHERE product_category = 'Electronics' AND month = 2) AS electronics_feb,
    SUM(monthly_spend) FILTER (WHERE product_category = 'Electronics' AND month = 3) AS electronics_mar,

    -- Clothing spending by month
    SUM(monthly_spend) FILTER (WHERE product_category = 'Clothing' AND month = 1) AS clothing_jan,
    SUM(monthly_spend) FILTER (WHERE product_category = 'Clothing' AND month = 2) AS clothing_feb,
    SUM(monthly_spend) FILTER (WHERE product_category = 'Clothing' AND month = 3) AS clothing_mar,

    -- Total spending
    SUM(monthly_spend) AS total_quarterly_spend,

    -- Customer classification
    CASE
        WHEN SUM(monthly_spend) > 5000 THEN 'High Value'
        WHEN SUM(monthly_spend) > 1000 THEN 'Medium Value'
        ELSE 'Low Value'
    END AS customer_tier

FROM monthly_purchases
WHERE month IN (1, 2, 3)  -- Q1 only
GROUP BY customer_id
HAVING SUM(monthly_spend) > 100  -- Minimum spending threshold
ORDER BY total_quarterly_spend DESC;

-- Customer engagement pivot (presence/absence)
SELECT
    customer_id,

    -- Channel engagement (1 if used, 0 if not)
    CASE WHEN COUNT(*) FILTER (WHERE channel = 'web') > 0 THEN 1 ELSE 0 END AS web_user,
    CASE WHEN COUNT(*) FILTER (WHERE channel = 'mobile') > 0 THEN 1 ELSE 0 END AS mobile_user,
    CASE WHEN COUNT(*) FILTER (WHERE channel = 'store') > 0 THEN 1 ELSE 0 END AS store_visitor,
    CASE WHEN COUNT(*) FILTER (WHERE channel = 'phone') > 0 THEN 1 ELSE 0 END AS phone_user,

    -- Engagement score
    (CASE WHEN COUNT(*) FILTER (WHERE channel = 'web') > 0 THEN 1 ELSE 0 END +
     CASE WHEN COUNT(*) FILTER (WHERE channel = 'mobile') > 0 THEN 1 ELSE 0 END +
     CASE WHEN COUNT(*) FILTER (WHERE channel = 'store') > 0 THEN 1 ELSE 0 END +
     CASE WHEN COUNT(*) FILTER (WHERE channel = 'phone') > 0 THEN 1 ELSE 0 END
    ) AS channel_diversity_score,

    COUNT(DISTINCT channel) AS unique_channels_used

FROM customer_interactions
WHERE interaction_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY customer_id;
```

### 2. **Financial Performance Dashboard**

```sql
-- Revenue breakdown by business unit and quarter
WITH quarterly_revenue AS (
    SELECT
        business_unit,
        EXTRACT(QUARTER FROM revenue_date) AS quarter,
        EXTRACT(YEAR FROM revenue_date) AS year,
        SUM(revenue_amount) AS revenue,
        SUM(cost_amount) AS costs
    FROM financial_data
    WHERE revenue_date >= '2023-01-01'
    GROUP BY business_unit, EXTRACT(QUARTER FROM revenue_date), EXTRACT(YEAR FROM revenue_date)
)
SELECT
    business_unit,
    year,

    -- Revenue by quarter
    SUM(revenue) FILTER (WHERE quarter = 1) AS q1_revenue,
    SUM(revenue) FILTER (WHERE quarter = 2) AS q2_revenue,
    SUM(revenue) FILTER (WHERE quarter = 3) AS q3_revenue,
    SUM(revenue) FILTER (WHERE quarter = 4) AS q4_revenue,

    -- Costs by quarter
    SUM(costs) FILTER (WHERE quarter = 1) AS q1_costs,
    SUM(costs) FILTER (WHERE quarter = 2) AS q2_costs,
    SUM(costs) FILTER (WHERE quarter = 3) AS q3_costs,
    SUM(costs) FILTER (WHERE quarter = 4) AS q4_costs,

    -- Profit margins by quarter
    ROUND(
        (SUM(revenue) FILTER (WHERE quarter = 1) - SUM(costs) FILTER (WHERE quarter = 1)) /
        NULLIF(SUM(revenue) FILTER (WHERE quarter = 1), 0) * 100, 2
    ) AS q1_margin_percent,

    ROUND(
        (SUM(revenue) FILTER (WHERE quarter = 2) - SUM(costs) FILTER (WHERE quarter = 2)) /
        NULLIF(SUM(revenue) FILTER (WHERE quarter = 2), 0) * 100, 2
    ) AS q2_margin_percent,

    ROUND(
        (SUM(revenue) FILTER (WHERE quarter = 3) - SUM(costs) FILTER (WHERE quarter = 3)) /
        NULLIF(SUM(revenue) FILTER (WHERE quarter = 3), 0) * 100, 2
    ) AS q3_margin_percent,

    ROUND(
        (SUM(revenue) FILTER (WHERE quarter = 4) - SUM(costs) FILTER (WHERE quarter = 4)) /
        NULLIF(SUM(revenue) FILTER (WHERE quarter = 4), 0) * 100, 2
    ) AS q4_margin_percent,

    -- Annual totals
    SUM(revenue) AS annual_revenue,
    SUM(costs) AS annual_costs,
    ROUND((SUM(revenue) - SUM(costs)) / NULLIF(SUM(revenue), 0) * 100, 2) AS annual_margin_percent

FROM quarterly_revenue
GROUP BY business_unit, year
ORDER BY year, annual_revenue DESC;

-- Budget vs actual variance analysis
SELECT
    department,

    -- Budget amounts by category
    SUM(amount) FILTER (WHERE budget_category = 'Personnel' AND type = 'budget') AS personnel_budget,
    SUM(amount) FILTER (WHERE budget_category = 'Equipment' AND type = 'budget') AS equipment_budget,
    SUM(amount) FILTER (WHERE budget_category = 'Travel' AND type = 'budget') AS travel_budget,
    SUM(amount) FILTER (WHERE budget_category = 'Marketing' AND type = 'budget') AS marketing_budget,

    -- Actual amounts by category
    SUM(amount) FILTER (WHERE budget_category = 'Personnel' AND type = 'actual') AS personnel_actual,
    SUM(amount) FILTER (WHERE budget_category = 'Equipment' AND type = 'actual') AS equipment_actual,
    SUM(amount) FILTER (WHERE budget_category = 'Travel' AND type = 'actual') AS travel_actual,
    SUM(amount) FILTER (WHERE budget_category = 'Marketing' AND type = 'actual') AS marketing_actual,

    -- Variance calculations
    SUM(amount) FILTER (WHERE budget_category = 'Personnel' AND type = 'actual') -
    SUM(amount) FILTER (WHERE budget_category = 'Personnel' AND type = 'budget') AS personnel_variance,

    SUM(amount) FILTER (WHERE budget_category = 'Equipment' AND type = 'actual') -
    SUM(amount) FILTER (WHERE budget_category = 'Equipment' AND type = 'budget') AS equipment_variance,

    -- Variance percentages
    ROUND(
        (SUM(amount) FILTER (WHERE budget_category = 'Personnel' AND type = 'actual') -
         SUM(amount) FILTER (WHERE budget_category = 'Personnel' AND type = 'budget')) /
        NULLIF(SUM(amount) FILTER (WHERE budget_category = 'Personnel' AND type = 'budget'), 0) * 100, 1
    ) AS personnel_variance_percent

FROM budget_data
WHERE fiscal_year = 2024
GROUP BY department
ORDER BY department;
```

### 3. **Survey and Polling Results**

```sql
-- Survey response analysis pivot
SELECT
    question_category,

    -- Response distribution
    COUNT(*) FILTER (WHERE response_value = 1) AS strongly_disagree,
    COUNT(*) FILTER (WHERE response_value = 2) AS disagree,
    COUNT(*) FILTER (WHERE response_value = 3) AS neutral,
    COUNT(*) FILTER (WHERE response_value = 4) AS agree,
    COUNT(*) FILTER (WHERE response_value = 5) AS strongly_agree,

    -- Response percentages
    ROUND(COUNT(*) FILTER (WHERE response_value = 1) * 100.0 / COUNT(*), 1) AS pct_strongly_disagree,
    ROUND(COUNT(*) FILTER (WHERE response_value = 2) * 100.0 / COUNT(*), 1) AS pct_disagree,
    ROUND(COUNT(*) FILTER (WHERE response_value = 3) * 100.0 / COUNT(*), 1) AS pct_neutral,
    ROUND(COUNT(*) FILTER (WHERE response_value = 4) * 100.0 / COUNT(*), 1) AS pct_agree,
    ROUND(COUNT(*) FILTER (WHERE response_value = 5) * 100.0 / COUNT(*), 1) AS pct_strongly_agree,

    -- Summary statistics
    COUNT(*) AS total_responses,
    ROUND(AVG(response_value), 2) AS average_score,
    MODE() WITHIN GROUP (ORDER BY response_value) AS most_common_response,

    -- Satisfaction metrics
    ROUND(
        (COUNT(*) FILTER (WHERE response_value >= 4) * 100.0 / COUNT(*)), 1
    ) AS satisfaction_rate,  -- % agree or strongly agree

    ROUND(
        (COUNT(*) FILTER (WHERE response_value <= 2) * 100.0 / COUNT(*)), 1
    ) AS dissatisfaction_rate  -- % disagree or strongly disagree

FROM survey_responses sr
JOIN questions q ON sr.question_id = q.question_id
GROUP BY question_category
ORDER BY average_score DESC;
```

## Performance Considerations

### 1. **Indexing for Pivot Operations**

```sql
-- Indexes to support efficient pivoting
CREATE INDEX idx_sales_pivot ON sales_data(salesperson, quarter);
CREATE INDEX idx_sales_values ON sales_data(quarter, sales_amount);

-- Covering index for complete pivot operation
CREATE INDEX idx_sales_covering ON sales_data(salesperson, quarter) INCLUDE (sales_amount);
```

### 2. **Optimizing Large Pivot Operations**

```sql
-- Use CTEs to pre-aggregate before pivoting
WITH pre_aggregated AS (
    SELECT
        region,
        product_category,
        quarter,
        SUM(sales_amount) AS total_sales,
        COUNT(*) AS transaction_count
    FROM detailed_sales
    WHERE sale_date >= '2024-01-01'
    GROUP BY region, product_category, quarter
)
SELECT
    region,
    SUM(total_sales) FILTER (WHERE quarter = 'Q1') AS q1_sales,
    SUM(total_sales) FILTER (WHERE quarter = 'Q2') AS q2_sales,
    SUM(total_sales) FILTER (WHERE quarter = 'Q3') AS q3_sales,
    SUM(total_sales) FILTER (WHERE quarter = 'Q4') AS q4_sales
FROM pre_aggregated
GROUP BY region;

-- Materialized views for frequently used pivots
CREATE MATERIALIZED VIEW mv_quarterly_sales_pivot AS
SELECT
    salesperson,
    SUM(sales_amount) FILTER (WHERE quarter = 'Q1') AS q1_sales,
    SUM(sales_amount) FILTER (WHERE quarter = 'Q2') AS q2_sales,
    SUM(sales_amount) FILTER (WHERE quarter = 'Q3') AS q3_sales,
    SUM(sales_amount) FILTER (WHERE quarter = 'Q4') AS q4_sales,
    SUM(sales_amount) AS total_annual_sales
FROM sales_data
GROUP BY salesperson;

-- Refresh the materialized view periodically
REFRESH MATERIALIZED VIEW mv_quarterly_sales_pivot;
```

Data pivoting is essential for reporting, analytics, and data presentation. While PostgreSQL doesn't have a built-in PIVOT operator, the conditional aggregation method with CASE or FILTER clauses provides flexible and powerful pivoting capabilities for most use cases.
