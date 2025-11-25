# Question 54: What is the `NULLIF` function?

## Overview

The **`NULLIF`** function compares two expressions and returns NULL if they are equal, otherwise it returns the first expression. This function is particularly useful for converting specific values (like empty strings, zeros, or sentinel values) to NULL, which can then be handled appropriately by other functions like `COALESCE`.

### Syntax

```sql
NULLIF(expression1, expression2)
```

**Returns:**

- `NULL` if `expression1` = `expression2`
- `expression1` if `expression1` ≠ `expression2`

### Key Characteristics:

- **Two arguments only**: Unlike `COALESCE`, always takes exactly 2 arguments
- **Equality comparison**: Uses standard SQL equality semantics
- **Type compatible**: Both expressions must be comparable
- **NULL handling**: If either expression is NULL, returns the first expression
- **Standard SQL**: Part of SQL standard, portable across databases

## Basic Usage Examples

### 1. **Converting Empty Strings to NULL**

```sql
-- Convert empty strings to NULL for proper handling
SELECT
    customer_id,
    customer_name,
    NULLIF(phone_number, '') AS phone,           -- Empty string becomes NULL
    NULLIF(email_address, '') AS email,          -- Empty string becomes NULL
    NULLIF(TRIM(notes), '') AS clean_notes       -- Trimmed empty string becomes NULL
FROM customers;

-- Use with COALESCE for complete data cleaning
SELECT
    customer_id,
    COALESCE(
        NULLIF(TRIM(preferred_name), ''),    -- Convert empty to NULL, then...
        NULLIF(TRIM(first_name), ''),        -- Fall back to first name
        'Customer #' || customer_id::TEXT    -- Final fallback
    ) AS display_name
FROM customers;

-- Handle various "empty" scenarios
SELECT
    product_id,
    product_name,
    COALESCE(
        NULLIF(TRIM(description), ''),       -- Empty string
        NULLIF(TRIM(description), 'N/A'),    -- Placeholder text
        NULLIF(TRIM(description), 'TBD'),    -- To be determined
        NULLIF(TRIM(description), '-'),      -- Dash placeholder
        'No description available'
    ) AS clean_description
FROM products;
```

### 2. **Converting Sentinel Values to NULL**

```sql
-- Convert sentinel/placeholder values to NULL
SELECT
    employee_id,
    first_name,
    last_name,
    NULLIF(salary, 0) AS salary,                 -- Zero salary becomes NULL
    NULLIF(manager_id, -1) AS manager_id,        -- -1 (no manager) becomes NULL
    NULLIF(department_id, 999) AS department_id, -- 999 (unassigned) becomes NULL
    NULLIF(phone, '000-000-0000') AS phone,      -- Placeholder phone becomes NULL
    NULLIF(ssn, '000-00-0000') AS ssn            -- Placeholder SSN becomes NULL
FROM employees;

-- Handle multiple sentinel values
SELECT
    order_id,
    customer_id,
    COALESCE(
        NULLIF(NULLIF(discount_code, 'NONE'), 'N/A'),  -- Convert both NONE and N/A to NULL
        'NO_DISCOUNT'
    ) AS effective_discount_code
FROM orders;

-- Convert date sentinels
SELECT
    project_id,
    project_name,
    start_date,
    NULLIF(end_date, '1900-01-01'::DATE) AS actual_end_date,     -- Sentinel date
    NULLIF(deadline, '9999-12-31'::DATE) AS actual_deadline      -- Far future date
FROM projects;
```

### 3. **Data Validation and Cleaning**

```sql
-- Validate and clean numeric data
SELECT
    transaction_id,
    NULLIF(amount, 0) AS non_zero_amount,        -- Exclude zero amounts
    NULLIF(quantity, -1) AS valid_quantity,      -- -1 might mean "unknown"
    NULLIF(tax_rate, 0) AS applicable_tax_rate   -- 0% might be a placeholder
FROM transactions
WHERE NULLIF(amount, 0) IS NOT NULL;             -- Only non-zero transactions

-- Clean up standardized data
SELECT
    address_id,
    street_address,
    NULLIF(UPPER(TRIM(state)), 'XX') AS state,            -- XX = unknown state
    NULLIF(TRIM(zip_code), '00000') AS zip_code,          -- 00000 = unknown zip
    NULLIF(UPPER(TRIM(country)), 'UNKNOWN') AS country    -- Clean country field
FROM addresses;

-- Handle measurement data with invalid readings
SELECT
    sensor_id,
    reading_timestamp,
    NULLIF(temperature, -999.9) AS temperature,   -- Sensor error value
    NULLIF(humidity, -1) AS humidity,            -- Invalid reading indicator
    NULLIF(pressure, 0) AS pressure              -- Zero pressure = no reading
FROM sensor_readings
WHERE reading_timestamp >= CURRENT_DATE - INTERVAL '7 days';
```

## Advanced Use Cases

### 1. **Division by Zero Prevention**

```sql
-- Prevent division by zero errors
SELECT
    product_id,
    total_revenue,
    total_orders,

    -- Safe division using NULLIF
    total_revenue / NULLIF(total_orders, 0) AS average_order_value,

    -- Alternative with explicit NULL handling
    CASE
        WHEN NULLIF(total_orders, 0) IS NOT NULL
        THEN total_revenue / total_orders
        ELSE NULL
    END AS avg_order_value_alt,

    -- With default value
    COALESCE(
        total_revenue / NULLIF(total_orders, 0),
        0
    ) AS avg_order_value_with_default

FROM product_sales_summary;

-- Complex calculations with multiple potential zeros
SELECT
    employee_id,
    total_sales,
    hours_worked,
    calls_made,

    -- Sales per hour (handle zero hours)
    total_sales / NULLIF(hours_worked, 0) AS sales_per_hour,

    -- Call conversion rate (handle zero calls)
    total_sales / NULLIF(calls_made, 0) AS sales_per_call,

    -- Efficiency ratio (handle both zeros)
    COALESCE(
        (total_sales / NULLIF(hours_worked, 0)) / NULLIF(calls_made / NULLIF(hours_worked, 0), 0),
        0
    ) AS efficiency_ratio

FROM sales_performance;
```

### 2. **Data Quality and Profiling**

```sql
-- Analyze data quality by identifying placeholder values
SELECT
    'customers' AS table_name,
    'phone' AS column_name,
    COUNT(*) AS total_rows,
    COUNT(phone) AS non_null_count,
    COUNT(NULLIF(phone, '')) AS non_empty_count,
    COUNT(NULLIF(NULLIF(phone, ''), '000-000-0000')) AS valid_phone_count,

    -- Calculate data quality percentages
    ROUND(
        COUNT(NULLIF(NULLIF(phone, ''), '000-000-0000')) * 100.0 / COUNT(*),
        2
    ) AS data_quality_percentage
FROM customers

UNION ALL

SELECT
    'employees' AS table_name,
    'salary' AS column_name,
    COUNT(*) AS total_rows,
    COUNT(salary) AS non_null_count,
    COUNT(NULLIF(salary, 0)) AS non_zero_count,
    COUNT(NULLIF(NULLIF(salary, 0), -1)) AS valid_salary_count,
    ROUND(
        COUNT(NULLIF(NULLIF(salary, 0), -1)) * 100.0 / COUNT(*),
        2
    ) AS data_quality_percentage
FROM employees;

-- Comprehensive data profiling query
WITH data_quality_metrics AS (
    SELECT
        customer_id,
        CASE WHEN NULLIF(TRIM(first_name), '') IS NOT NULL THEN 1 ELSE 0 END AS has_first_name,
        CASE WHEN NULLIF(TRIM(last_name), '') IS NOT NULL THEN 1 ELSE 0 END AS has_last_name,
        CASE WHEN NULLIF(TRIM(email), '') IS NOT NULL
             AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 1 ELSE 0 END AS has_valid_email,
        CASE WHEN NULLIF(NULLIF(phone, ''), '000-000-0000') IS NOT NULL THEN 1 ELSE 0 END AS has_valid_phone,
        CASE WHEN NULLIF(TRIM(address), '') IS NOT NULL THEN 1 ELSE 0 END AS has_address
    FROM customers
)
SELECT
    COUNT(*) AS total_customers,
    SUM(has_first_name) AS customers_with_first_name,
    SUM(has_last_name) AS customers_with_last_name,
    SUM(has_valid_email) AS customers_with_valid_email,
    SUM(has_valid_phone) AS customers_with_valid_phone,
    SUM(has_address) AS customers_with_address,

    -- Data completeness scores
    ROUND(AVG(has_first_name + has_last_name + has_valid_email + has_valid_phone + has_address) * 20, 2) AS avg_completeness_percentage
FROM data_quality_metrics;
```

### 3. **Financial and Business Calculations**

```sql
-- Financial ratios with zero-handling
SELECT
    company_id,
    company_name,
    revenue,
    expenses,
    assets,
    liabilities,

    -- Profit margin (handle zero revenue)
    COALESCE(
        (revenue - expenses) / NULLIF(revenue, 0) * 100,
        0
    ) AS profit_margin_percent,

    -- Return on assets (handle zero assets)
    COALESCE(
        (revenue - expenses) / NULLIF(assets, 0) * 100,
        0
    ) AS return_on_assets_percent,

    -- Debt to equity ratio (handle zero equity)
    COALESCE(
        liabilities / NULLIF(assets - liabilities, 0),
        999.99  -- High number to indicate excessive debt
    ) AS debt_to_equity_ratio,

    -- Asset turnover (revenue efficiency)
    revenue / NULLIF(assets, 0) AS asset_turnover

FROM financial_statements
WHERE fiscal_year = 2023;

-- Customer metrics with safe division
SELECT
    customer_segment,
    COUNT(*) AS customer_count,
    SUM(total_orders) AS total_orders,
    SUM(total_revenue) AS total_revenue,
    SUM(total_refunds) AS total_refunds,

    -- Average orders per customer (handle zero customers)
    SUM(total_orders) / NULLIF(COUNT(*), 0) AS avg_orders_per_customer,

    -- Average revenue per customer
    SUM(total_revenue) / NULLIF(COUNT(*), 0) AS avg_revenue_per_customer,

    -- Refund rate (handle zero revenue)
    COALESCE(
        SUM(total_refunds) / NULLIF(SUM(total_revenue), 0) * 100,
        0
    ) AS refund_rate_percent,

    -- Customer lifetime value to refund ratio
    COALESCE(
        (SUM(total_revenue) / NULLIF(COUNT(*), 0)) / NULLIF(SUM(total_refunds) / NULLIF(COUNT(*), 0), 0),
        999  -- Very high CLV to refund ratio if no refunds
    ) AS clv_to_refund_ratio

FROM customer_summary
GROUP BY customer_segment;
```

### 4. **ETL and Data Processing**

```sql
-- Data transformation pipeline with NULLIF
WITH cleaned_data AS (
    SELECT
        source_id,

        -- Clean and standardize names
        NULLIF(TRIM(UPPER(first_name)), '') AS first_name,
        NULLIF(TRIM(UPPER(last_name)), '') AS last_name,

        -- Clean email addresses
        LOWER(NULLIF(TRIM(email), '')) AS email,

        -- Standardize phone numbers (remove common placeholders)
        CASE
            WHEN NULLIF(NULLIF(NULLIF(phone, ''), '000-000-0000'), 'N/A') IS NOT NULL
            THEN REGEXP_REPLACE(phone, '[^0-9]', '', 'g')  -- Keep only digits
            ELSE NULL
        END AS clean_phone,

        -- Handle numeric fields with sentinels
        NULLIF(NULLIF(age, 0), 999) AS age,              -- 0 or 999 = unknown age
        NULLIF(NULLIF(income, 0), -1) AS income,         -- 0 or -1 = unknown income

        -- Clean categorical data
        CASE
            WHEN NULLIF(NULLIF(UPPER(TRIM(gender)), ''), 'UNKNOWN') IN ('M', 'MALE') THEN 'M'
            WHEN NULLIF(NULLIF(UPPER(TRIM(gender)), ''), 'UNKNOWN') IN ('F', 'FEMALE') THEN 'F'
            ELSE NULL
        END AS gender,

        -- Handle dates with sentinel values
        NULLIF(birth_date, '1900-01-01'::DATE) AS birth_date

    FROM raw_customer_data
),
validated_data AS (
    SELECT
        source_id,
        first_name,
        last_name,
        email,
        clean_phone,
        age,
        income,
        gender,
        birth_date,

        -- Data quality scoring
        COALESCE(
            (CASE WHEN first_name IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN last_name IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 1 ELSE 0 END +
             CASE WHEN clean_phone IS NOT NULL AND LENGTH(clean_phone) = 10 THEN 1 ELSE 0 END +
             CASE WHEN age IS NOT NULL AND age BETWEEN 16 AND 120 THEN 1 ELSE 0 END +
             CASE WHEN birth_date IS NOT NULL AND birth_date < CURRENT_DATE THEN 1 ELSE 0 END) * 100 / 6,
            0
        ) AS data_quality_score

    FROM cleaned_data
)
SELECT
    *,
    CASE
        WHEN data_quality_score >= 80 THEN 'HIGH'
        WHEN data_quality_score >= 60 THEN 'MEDIUM'
        WHEN data_quality_score >= 40 THEN 'LOW'
        ELSE 'REJECT'
    END AS data_quality_tier
FROM validated_data
WHERE data_quality_score >= 40;  -- Only process records with minimum quality
```

## NULLIF with Other Functions

### 1. **NULLIF + COALESCE Pattern**

```sql
-- The classic cleaning pattern: NULLIF empty strings, then COALESCE with defaults
SELECT
    customer_id,

    -- Clean and provide fallbacks
    COALESCE(
        NULLIF(TRIM(preferred_name), ''),     -- Clean empty preferred name
        NULLIF(TRIM(first_name), ''),         -- Clean empty first name
        'Customer #' || customer_id::TEXT     -- Final fallback
    ) AS display_name,

    -- Multiple level cleaning
    COALESCE(
        NULLIF(NULLIF(TRIM(work_email), ''), 'no-email'),      -- Clean work email
        NULLIF(NULLIF(TRIM(personal_email), ''), 'none'),      -- Clean personal email
        customer_id || '@temp.placeholder.com'                 -- Generate placeholder
    ) AS contact_email,

    -- Complex fallback hierarchy
    COALESCE(
        NULLIF(mobile_phone, ''),
        NULLIF(work_phone, ''),
        NULLIF(home_phone, ''),
        'Contact customer service'
    ) AS primary_contact

FROM customers;

-- Business logic with cleaned data
SELECT
    order_id,
    customer_id,

    -- Use cleaned discount code in business logic
    CASE
        WHEN NULLIF(NULLIF(TRIM(discount_code), ''), 'NONE') IS NOT NULL
        THEN 'DISCOUNT_APPLIED'
        ELSE 'FULL_PRICE'
    END AS pricing_category,

    -- Calculate with cleaned values
    base_amount *
    COALESCE(
        CASE
            WHEN NULLIF(NULLIF(TRIM(discount_code), ''), 'NONE') IS NOT NULL
            THEN (100 - COALESCE(discount_percent, 0)) / 100.0
            ELSE 1.0
        END,
        1.0
    ) AS final_amount

FROM orders;
```

### 2. **NULLIF with Aggregation Functions**

```sql
-- Aggregations that exclude sentinel values
SELECT
    department_id,

    -- Count only valid salaries (exclude 0 and -1)
    COUNT(NULLIF(NULLIF(salary, 0), -1)) AS employees_with_known_salary,

    -- Average of valid salaries only
    AVG(NULLIF(NULLIF(salary, 0), -1)) AS avg_known_salary,

    -- Sum excluding placeholder values
    SUM(NULLIF(NULLIF(bonus, 0), -999)) AS total_actual_bonuses,

    -- Min/Max of valid performance scores (exclude -1 sentinel)
    MIN(NULLIF(performance_score, -1)) AS min_valid_score,
    MAX(NULLIF(performance_score, -1)) AS max_valid_score

FROM employees
GROUP BY department_id;

-- Time-series analysis excluding invalid readings
SELECT
    DATE_TRUNC('hour', reading_timestamp) AS hour,
    sensor_type,

    -- Statistics for valid readings only
    COUNT(NULLIF(NULLIF(value, -999.9), 0)) AS valid_readings,
    AVG(NULLIF(NULLIF(value, -999.9), 0)) AS avg_value,
    STDDEV(NULLIF(NULLIF(value, -999.9), 0)) AS value_stddev,

    -- Data quality metrics
    COUNT(*) AS total_readings,
    ROUND(
        COUNT(NULLIF(NULLIF(value, -999.9), 0)) * 100.0 / COUNT(*),
        2
    ) AS data_quality_percent

FROM sensor_data
WHERE reading_timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', reading_timestamp), sensor_type
ORDER BY hour, sensor_type;
```

### 3. **NULLIF in Window Functions**

```sql
-- Running calculations excluding zero/sentinel values
SELECT
    transaction_date,
    account_id,
    transaction_amount,

    -- Running balance excluding zero amounts
    SUM(NULLIF(transaction_amount, 0)) OVER (
        PARTITION BY account_id
        ORDER BY transaction_date
        ROWS UNBOUNDED PRECEDING
    ) AS running_balance,

    -- Moving average of non-zero transactions
    AVG(NULLIF(transaction_amount, 0)) OVER (
        PARTITION BY account_id
        ORDER BY transaction_date
        ROWS 6 PRECEDING
    ) AS moving_avg_7_days,

    -- Count of valid transactions in window
    COUNT(NULLIF(transaction_amount, 0)) OVER (
        PARTITION BY account_id
        ORDER BY transaction_date
        ROWS 29 PRECEDING
    ) AS valid_transactions_last_30_days,

    -- Rank excluding sentinel values
    RANK() OVER (
        PARTITION BY account_id
        ORDER BY NULLIF(transaction_amount, 0) DESC NULLS LAST
    ) AS transaction_rank

FROM account_transactions
ORDER BY account_id, transaction_date;

-- Performance ranking excluding invalid scores
SELECT
    employee_id,
    review_period,
    performance_score,

    -- Rank only among employees with valid scores
    RANK() OVER (
        PARTITION BY review_period
        ORDER BY NULLIF(NULLIF(performance_score, -1), 0) DESC NULLS LAST
    ) AS performance_rank,

    -- Percentile among valid scores
    PERCENT_RANK() OVER (
        PARTITION BY review_period
        ORDER BY NULLIF(NULLIF(performance_score, -1), 0)
    ) AS performance_percentile,

    -- Compare to departmental average (valid scores only)
    NULLIF(NULLIF(performance_score, -1), 0) -
    AVG(NULLIF(NULLIF(performance_score, -1), 0)) OVER (
        PARTITION BY department_id, review_period
    ) AS vs_dept_average

FROM employee_reviews
WHERE review_period >= '2023-01-01';
```

## Real-World Business Applications

### 1. **E-commerce Data Cleaning**

```sql
-- Product catalog data cleaning for e-commerce
SELECT
    product_id,

    -- Clean product names (remove placeholders)
    COALESCE(
        NULLIF(NULLIF(TRIM(product_name), ''), 'TBD'),
        'Product ' || product_id::TEXT
    ) AS clean_product_name,

    -- Price validation (exclude placeholder prices)
    NULLIF(NULLIF(NULLIF(price, 0), -1), 999999.99) AS valid_price,

    -- Weight handling (exclude negative weights and common placeholders)
    NULLIF(NULLIF(NULLIF(weight_kg, 0), -1), 999.99) AS actual_weight,

    -- Category cleanup
    COALESCE(
        NULLIF(NULLIF(TRIM(category), ''), 'Uncategorized'),
        'General Merchandise'
    ) AS product_category,

    -- Availability status (convert numeric codes to boolean)
    CASE
        WHEN NULLIF(NULLIF(stock_quantity, -1), 999999) IS NULL THEN false  -- Unknown stock
        WHEN NULLIF(NULLIF(stock_quantity, -1), 999999) > 0 THEN true       -- In stock
        ELSE false                                                          -- Out of stock
    END AS is_available,

    -- Shipping calculation (exclude invalid weights)
    CASE
        WHEN NULLIF(NULLIF(weight_kg, 0), -1) IS NOT NULL
        THEN GREATEST(5.00, NULLIF(weight_kg, 0) * 2.50)  -- $2.50/kg, minimum $5
        ELSE NULL  -- Cannot calculate shipping
    END AS estimated_shipping_cost

FROM products
WHERE status = 'active';

-- Customer address standardization
SELECT
    customer_id,

    -- Address line cleanup
    NULLIF(NULLIF(TRIM(address_line1), ''), 'N/A') AS address_line1,
    NULLIF(TRIM(address_line2), '') AS address_line2,

    -- City standardization
    COALESCE(
        NULLIF(NULLIF(TRIM(INITCAP(city)), ''), 'Unknown'),
        'City Not Provided'
    ) AS city,

    -- State/Province code cleanup
    UPPER(NULLIF(NULLIF(TRIM(state_code), ''), 'XX')) AS state_code,

    -- Postal code validation
    CASE
        WHEN NULLIF(NULLIF(TRIM(postal_code), ''), '00000') ~ '^\d{5}(-\d{4})?$'
        THEN NULLIF(TRIM(postal_code), '')
        ELSE NULL
    END AS valid_postal_code,

    -- Country standardization
    COALESCE(
        CASE
            WHEN NULLIF(UPPER(TRIM(country)), 'UNKNOWN') IN ('US', 'USA', 'UNITED STATES') THEN 'US'
            WHEN NULLIF(UPPER(TRIM(country)), 'UNKNOWN') IN ('CA', 'CANADA') THEN 'CA'
            WHEN NULLIF(UPPER(TRIM(country)), 'UNKNOWN') IN ('GB', 'UK', 'GREAT BRITAIN') THEN 'GB'
            ELSE NULLIF(UPPER(TRIM(country)), 'UNKNOWN')
        END,
        'US'  -- Default to US
    ) AS country_code

FROM customer_addresses;
```

### 2. **Financial Data Processing**

```sql
-- Financial statement analysis with sentinel value handling
WITH cleaned_financials AS (
    SELECT
        company_id,
        fiscal_year,
        fiscal_quarter,

        -- Revenue cleaning (exclude negative values used as placeholders)
        NULLIF(revenue, -1) AS clean_revenue,

        -- Expense validation (exclude sentinel values)
        NULLIF(NULLIF(operating_expenses, -1), 0) AS clean_operating_expenses,
        NULLIF(NULLIF(interest_expense, -999), 0) AS clean_interest_expense,

        -- Asset values (exclude placeholder amounts)
        NULLIF(NULLIF(total_assets, -1), 0) AS clean_total_assets,
        NULLIF(NULLIF(current_assets, -1), 0) AS clean_current_assets,

        -- Liability cleaning
        NULLIF(NULLIF(total_liabilities, -1), 0) AS clean_total_liabilities,
        NULLIF(NULLIF(current_liabilities, -1), 0) AS clean_current_liabilities,

        -- Share data (handle stock splits and placeholder values)
        NULLIF(NULLIF(shares_outstanding, 0), -1) AS clean_shares_outstanding

    FROM financial_statements
    WHERE fiscal_year >= 2020
),
financial_ratios AS (
    SELECT
        company_id,
        fiscal_year,
        fiscal_quarter,
        clean_revenue,
        clean_operating_expenses,
        clean_total_assets,
        clean_current_assets,
        clean_total_liabilities,
        clean_current_liabilities,

        -- Calculate ratios with safe division
        COALESCE(
            clean_revenue / NULLIF(clean_total_assets, 0),
            0
        ) AS asset_turnover,

        COALESCE(
            (clean_revenue - clean_operating_expenses) / NULLIF(clean_revenue, 0) * 100,
            0
        ) AS operating_margin_percent,

        COALESCE(
            clean_current_assets / NULLIF(clean_current_liabilities, 0),
            0
        ) AS current_ratio,

        COALESCE(
            clean_total_liabilities / NULLIF(clean_total_assets - clean_total_liabilities, 0),
            999  -- High debt-to-equity if no equity
        ) AS debt_to_equity_ratio,

        -- ROA calculation
        COALESCE(
            (clean_revenue - clean_operating_expenses) / NULLIF(clean_total_assets, 0) * 100,
            0
        ) AS return_on_assets_percent

    FROM cleaned_financials
    WHERE clean_revenue IS NOT NULL  -- Only companies with valid revenue data
)
SELECT
    company_id,
    fiscal_year,

    -- Financial health indicators
    CASE
        WHEN current_ratio >= 2.0 THEN 'Strong'
        WHEN current_ratio >= 1.5 THEN 'Good'
        WHEN current_ratio >= 1.0 THEN 'Adequate'
        WHEN current_ratio > 0 THEN 'Weak'
        ELSE 'Critical'
    END AS liquidity_rating,

    CASE
        WHEN debt_to_equity_ratio <= 0.3 THEN 'Low Risk'
        WHEN debt_to_equity_ratio <= 0.6 THEN 'Medium Risk'
        WHEN debt_to_equity_ratio <= 1.0 THEN 'High Risk'
        ELSE 'Very High Risk'
    END AS leverage_risk,

    CASE
        WHEN operating_margin_percent >= 20 THEN 'Excellent'
        WHEN operating_margin_percent >= 15 THEN 'Good'
        WHEN operating_margin_percent >= 10 THEN 'Average'
        WHEN operating_margin_percent >= 5 THEN 'Below Average'
        ELSE 'Poor'
    END AS profitability_rating,

    -- Raw metrics for reference
    ROUND(current_ratio, 2) AS current_ratio,
    ROUND(debt_to_equity_ratio, 2) AS debt_to_equity,
    ROUND(operating_margin_percent, 2) AS operating_margin,
    ROUND(return_on_assets_percent, 2) AS roa_percent

FROM financial_ratios
ORDER BY company_id, fiscal_year, fiscal_quarter;
```

## Common Patterns and Best Practices

### 1. **The TRIM + NULLIF Pattern**

```sql
-- Always clean whitespace before converting to NULL
SELECT
    NULLIF(TRIM(column_name), '') AS cleaned_column  -- ✅ Good
FROM table_name;

-- Instead of just NULLIF without trimming
SELECT
    NULLIF(column_name, '') AS cleaned_column  -- ❌ Might miss whitespace-only strings
FROM table_name;
```

### 2. **Multiple Sentinel Value Cleanup**

```sql
-- Chain NULLIF calls for multiple sentinel values
SELECT
    customer_id,
    COALESCE(
        NULLIF(NULLIF(NULLIF(phone, ''), '000-000-0000'), 'N/A'),
        'No phone available'
    ) AS contact_phone
FROM customers;

-- More readable with CASE for complex scenarios
SELECT
    customer_id,
    CASE
        WHEN TRIM(phone) IN ('', '000-000-0000', 'N/A', 'None', 'Unknown') THEN NULL
        WHEN phone IS NULL THEN NULL
        ELSE TRIM(phone)
    END AS contact_phone
FROM customers;
```

### 3. **Performance Considerations**

```sql
-- Index on expression using NULLIF for filtering
CREATE INDEX idx_products_valid_price
ON products (product_id)
WHERE NULLIF(NULLIF(price, 0), -1) IS NOT NULL;

-- Query that can use the partial index
SELECT * FROM products
WHERE NULLIF(NULLIF(price, 0), -1) IS NOT NULL
  AND category = 'Electronics';
```

The `NULLIF` function is essential for data cleaning and validation, especially when dealing with legacy systems or external data sources that use sentinel values instead of proper NULLs. Combined with `COALESCE`, it forms the foundation of robust data processing pipelines.
