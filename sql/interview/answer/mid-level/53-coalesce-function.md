# Question 53: What is the `COALESCE` function?

## Overview

The **`COALESCE`** function is a powerful PostgreSQL function that returns the first non-NULL value from a list of expressions. It evaluates its arguments from left to right and returns the first argument that is not NULL. If all arguments are NULL, it returns NULL.

### Syntax

```sql
COALESCE(value1, value2, ..., valueN)
```

### Key Characteristics:

- **Short-circuit evaluation**: Stops at the first non-NULL value
- **Type coercion**: All arguments must be convertible to a common data type
- **Variadic function**: Accepts any number of arguments (at least 1)
- **Standard SQL**: Part of the SQL standard, portable across databases
- **NULL-safe**: Specifically designed for NULL handling

## Basic Usage Examples

### 1. **Simple NULL Replacement**

```sql
-- Replace NULL values with a default
SELECT
    employee_id,
    first_name,
    last_name,
    COALESCE(middle_name, 'N/A') AS middle_name,
    COALESCE(phone_number, 'No phone provided') AS contact_phone
FROM employees;

-- Handle NULL salaries with department averages or company minimum
SELECT
    employee_id,
    first_name,
    last_name,
    original_salary,
    COALESCE(
        original_salary,           -- Use actual salary if available
        department_avg_salary,     -- Fall back to department average
        50000                      -- Finally, use company minimum
    ) AS effective_salary
FROM employees e
LEFT JOIN department_averages da ON e.department_id = da.department_id;
```

### 2. **Data Cleaning and Validation**

```sql
-- Clean up customer contact information
SELECT
    customer_id,
    customer_name,

    -- Primary contact method
    COALESCE(email, phone, fax, 'No contact info') AS primary_contact,

    -- Address standardization
    COALESCE(street_address, mailing_address, 'Address unknown') AS address,

    -- Name normalization
    COALESCE(
        NULLIF(TRIM(preferred_name), ''),    -- Use preferred name if not empty
        NULLIF(TRIM(first_name), ''),        -- Fall back to first name
        'Unknown'                            -- Default if both are empty/NULL
    ) AS display_name
FROM customers;

-- Handle inconsistent date formats
SELECT
    order_id,
    COALESCE(
        shipped_date,              -- Actual shipping date
        estimated_ship_date,       -- Estimated date
        order_date + INTERVAL '3 days'  -- Default: 3 days after order
    ) AS effective_ship_date
FROM orders;
```

### 3. **Configuration and Defaults**

```sql
-- User preferences with system defaults
SELECT
    user_id,
    username,
    COALESCE(user_timezone, system_timezone, 'UTC') AS effective_timezone,
    COALESCE(user_language, 'en') AS language,
    COALESCE(page_size_preference, 25) AS items_per_page,
    COALESCE(email_notifications, true) AS notify_by_email
FROM users u
CROSS JOIN system_settings ss;

-- Application configuration hierarchy
SELECT
    application_id,
    COALESCE(
        user_specific_config,      -- User override
        department_config,         -- Department default
        organization_config,       -- Organization default
        system_default_config      -- System fallback
    ) AS effective_config
FROM applications a
LEFT JOIN user_configs uc ON a.app_id = uc.app_id AND uc.user_id = ?
LEFT JOIN dept_configs dc ON a.app_id = dc.app_id AND dc.dept_id = ?
LEFT JOIN org_configs oc ON a.app_id = oc.app_id;
```

## Advanced Use Cases

### 1. **Complex Business Logic**

```sql
-- Price calculation with multiple fallback strategies
SELECT
    product_id,
    product_name,

    -- Complex pricing logic
    COALESCE(
        CASE
            WHEN customer_tier = 'VIP' AND vip_price IS NOT NULL
            THEN vip_price
        END,
        CASE
            WHEN quantity >= bulk_threshold AND bulk_price IS NOT NULL
            THEN bulk_price
        END,
        promotional_price,         -- Current promotion
        list_price,               -- Standard price
        cost_price * 1.3          -- Cost + 30% margin as absolute fallback
    ) AS effective_price

FROM products p
CROSS JOIN (SELECT ? AS customer_tier, ? AS quantity) params
WHERE p.product_id = ?;

-- Commission calculation with multiple structures
SELECT
    salesperson_id,
    sale_amount,

    -- Commission calculation priority
    COALESCE(
        -- Special event commission (holidays, etc.)
        CASE
            WHEN is_special_event = true
            THEN sale_amount * special_event_rate
        END,

        -- Product-specific commission
        product_specific_commission,

        -- Tier-based commission
        CASE
            WHEN salesperson_tier = 'Senior' THEN sale_amount * 0.08
            WHEN salesperson_tier = 'Mid' THEN sale_amount * 0.06
            ELSE sale_amount * 0.04
        END,

        -- Fallback: minimum commission
        25.00
    ) AS commission_amount

FROM sales s
JOIN salespeople sp ON s.salesperson_id = sp.salesperson_id
LEFT JOIN product_commissions pc ON s.product_id = pc.product_id;
```

### 2. **Data Integration and ETL**

```sql
-- Merge data from multiple sources during ETL
INSERT INTO unified_customers (
    customer_id,
    name,
    email,
    phone,
    address,
    source_system
)
SELECT
    COALESCE(crm.customer_id, erp.customer_id, web.customer_id) AS customer_id,

    -- Name priority: CRM > ERP > Web
    COALESCE(
        NULLIF(TRIM(crm.full_name), ''),
        NULLIF(TRIM(erp.customer_name), ''),
        NULLIF(TRIM(web.display_name), ''),
        'Unknown Customer'
    ) AS name,

    -- Email priority: Web > CRM > ERP (web likely most current)
    COALESCE(
        CASE WHEN web.email_verified = true THEN web.email END,
        crm.primary_email,
        erp.contact_email
    ) AS email,

    -- Phone number cleanup and prioritization
    COALESCE(
        CASE WHEN LENGTH(REGEXP_REPLACE(crm.phone, '[^0-9]', '', 'g')) = 10
             THEN crm.phone END,  -- Valid 10-digit number
        CASE WHEN LENGTH(REGEXP_REPLACE(erp.phone, '[^0-9]', '', 'g')) = 10
             THEN erp.phone END,
        web.phone_number
    ) AS phone,

    -- Address with preference for most detailed
    COALESCE(
        CASE WHEN crm.street IS NOT NULL AND crm.city IS NOT NULL
             THEN crm.street || ', ' || crm.city || ', ' || crm.state
        END,
        erp.full_address,
        web.shipping_address
    ) AS address,

    -- Track source for data lineage
    CASE
        WHEN crm.customer_id IS NOT NULL THEN 'CRM'
        WHEN erp.customer_id IS NOT NULL THEN 'ERP'
        ELSE 'WEB'
    END AS source_system

FROM crm_customers crm
FULL OUTER JOIN erp_customers erp ON crm.external_id = erp.customer_ref
FULL OUTER JOIN web_customers web ON crm.email = web.email;
```

### 3. **Reporting and Analytics**

```sql
-- Customer lifetime value calculation with fallbacks
SELECT
    customer_id,
    customer_name,

    -- Revenue calculation with multiple data sources
    COALESCE(
        calculated_ltv,           -- Pre-calculated if available
        (
            SELECT SUM(order_total)
            FROM orders o
            WHERE o.customer_id = c.customer_id
        ),                        -- Calculate from orders
        estimated_ltv_from_profile, -- ML/statistical estimate
        average_customer_ltv,     -- Industry/segment average
        0                         -- Absolute minimum
    ) AS customer_lifetime_value,

    -- Churn risk assessment
    COALESCE(
        ml_churn_score,          -- Machine learning prediction
        rules_based_score,       -- Business rules calculation
        CASE
            WHEN days_since_last_order > 365 THEN 0.8
            WHEN days_since_last_order > 180 THEN 0.4
            WHEN days_since_last_order > 90 THEN 0.2
            ELSE 0.1
        END                      -- Simple recency-based score
    ) AS churn_risk_score

FROM customers c
LEFT JOIN customer_analytics ca ON c.customer_id = ca.customer_id
CROSS JOIN (
    SELECT AVG(lifetime_value) as average_customer_ltv
    FROM customer_analytics
    WHERE lifetime_value IS NOT NULL
) avg_stats;

-- Performance reporting with graceful degradation
SELECT
    DATE_TRUNC('month', report_date) AS month,

    -- Revenue with multiple calculation methods
    COALESCE(
        SUM(actual_revenue),      -- Actual if available
        SUM(estimated_revenue),   -- Estimation if actual not ready
        SUM(budgeted_revenue * 0.95)  -- Budget * 95% as conservative estimate
    ) AS reported_revenue,

    -- Customer acquisition cost
    COALESCE(
        SUM(marketing_spend) / NULLIF(SUM(new_customers), 0),
        previous_month_cac,       -- Use previous month if current incomplete
        industry_benchmark_cac    -- Industry benchmark
    ) AS customer_acquisition_cost,

    -- Data quality indicator
    CASE
        WHEN SUM(actual_revenue) IS NOT NULL THEN 'Actual'
        WHEN SUM(estimated_revenue) IS NOT NULL THEN 'Estimated'
        ELSE 'Budgeted'
    END AS data_quality_level

FROM monthly_metrics mm
WHERE report_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', report_date)
ORDER BY month;
```

## COALESCE vs Alternatives

### 1. **COALESCE vs CASE**

```sql
-- Using COALESCE (preferred)
SELECT
    COALESCE(preferred_name, first_name, 'Unknown') AS display_name
FROM users;

-- Equivalent using CASE (more verbose)
SELECT
    CASE
        WHEN preferred_name IS NOT NULL THEN preferred_name
        WHEN first_name IS NOT NULL THEN first_name
        ELSE 'Unknown'
    END AS display_name
FROM users;

-- COALESCE is cleaner for simple NULL replacement
-- CASE is better for complex conditional logic
SELECT
    CASE
        WHEN user_status = 'premium' AND preferred_name IS NOT NULL
        THEN 'VIP: ' || preferred_name
        WHEN preferred_name IS NOT NULL
        THEN preferred_name
        WHEN first_name IS NOT NULL
        THEN first_name
        ELSE 'Guest User'
    END AS display_name_with_status
FROM users;
```

### 2. **COALESCE vs ISNULL/NVL**

```sql
-- PostgreSQL COALESCE (standard SQL)
SELECT COALESCE(column1, column2, 'default') FROM table1;

-- SQL Server ISNULL (only 2 arguments)
-- SELECT ISNULL(column1, 'default') FROM table1;

-- Oracle NVL (only 2 arguments)
-- SELECT NVL(column1, 'default') FROM table1;

-- COALESCE advantages:
-- 1. Standard SQL (portable)
-- 2. Multiple arguments
-- 3. Short-circuit evaluation
SELECT
    employee_id,
    COALESCE(work_email, personal_email, temp_email, 'no-email@company.com') AS contact_email
FROM employees;
```

### 3. **Performance Considerations**

```sql
-- Efficient: COALESCE with constants
SELECT
    customer_id,
    COALESCE(customer_name, 'Unknown Customer') AS name
FROM customers;

-- Less efficient: COALESCE with expensive subqueries
-- (All subqueries may be evaluated)
SELECT
    customer_id,
    COALESCE(
        (SELECT name FROM vip_customers WHERE id = c.customer_id),
        (SELECT name FROM regular_customers WHERE id = c.customer_id),
        'Unknown'
    ) AS name
FROM customers c;

-- Better: Use CASE for expensive operations to ensure short-circuiting
SELECT
    customer_id,
    CASE
        WHEN EXISTS (SELECT 1 FROM vip_customers WHERE id = c.customer_id)
        THEN (SELECT name FROM vip_customers WHERE id = c.customer_id)
        WHEN EXISTS (SELECT 1 FROM regular_customers WHERE id = c.customer_id)
        THEN (SELECT name FROM regular_customers WHERE id = c.customer_id)
        ELSE 'Unknown'
    END AS name
FROM customers c;
```

## Best Practices and Tips

### 1. **Type Compatibility**

```sql
-- Ensure compatible data types
SELECT
    order_id,
    -- This works: all integers
    COALESCE(priority_level, default_priority, 1) AS effective_priority,

    -- This works: all text-compatible
    COALESCE(customer_notes, order_comments, 'No notes') AS notes,

    -- This works: explicit casting
    COALESCE(
        estimated_delivery_days::TEXT,
        'Standard delivery: ' || standard_days::TEXT,
        'Contact customer service'
    ) AS delivery_info
FROM orders;

-- Common type coercion errors to avoid:
-- COALESCE(numeric_column, 'text_value')  -- ERROR!
-- COALESCE(date_column, 123)              -- ERROR!
```

### 2. **Performance Optimization**

```sql
-- Order arguments by likelihood of being non-NULL
SELECT
    product_id,
    -- Most common first
    COALESCE(
        current_price,        -- Usually available (90% of cases)
        list_price,          -- Fallback (9% of cases)
        cost_price * 1.5,    -- Rare fallback (1% of cases)
        99.99               -- Almost never used
    ) AS price
FROM products;

-- Use with indexes effectively
CREATE INDEX idx_products_price_coalesce
ON products (COALESCE(current_price, list_price));

-- Query can use the expression index
SELECT * FROM products
WHERE COALESCE(current_price, list_price) BETWEEN 10 AND 100;
```

### 3. **Debugging and Maintenance**

```sql
-- Add debugging information in development
SELECT
    customer_id,
    preferred_name,
    first_name,
    last_name,
    COALESCE(preferred_name, first_name, last_name, 'Unknown') AS display_name,

    -- Debugging: show which value was used
    CASE
        WHEN preferred_name IS NOT NULL THEN 'preferred'
        WHEN first_name IS NOT NULL THEN 'first'
        WHEN last_name IS NOT NULL THEN 'last'
        ELSE 'default'
    END AS name_source
FROM customers
ORDER BY customer_id;

-- Document complex COALESCE logic
SELECT
    employee_id,
    /*
     * Salary calculation priority:
     * 1. Negotiated salary (individual contracts)
     * 2. Grade-based salary (standard pay scales)
     * 3. Department minimum (department policy)
     * 4. Company minimum wage (legal compliance)
     */
    COALESCE(
        negotiated_salary,     -- Individual contracts
        grade_salary,          -- Pay scale
        dept_minimum_salary,   -- Department policy
        company_minimum_wage   -- Legal minimum
    ) AS effective_salary
FROM employees e
LEFT JOIN salary_grades sg ON e.grade_id = sg.grade_id
LEFT JOIN department_policies dp ON e.dept_id = dp.dept_id
CROSS JOIN company_settings cs;
```

## Common Pitfalls and Solutions

### 1. **Empty String vs NULL**

```sql
-- Problem: Empty strings aren't NULL
SELECT COALESCE(empty_string_column, 'default');  -- Won't use 'default' if column is ''

-- Solution: Use NULLIF to convert empty strings to NULL
SELECT COALESCE(NULLIF(TRIM(column_name), ''), 'default') AS clean_value;

-- Comprehensive cleaning
SELECT
    customer_id,
    COALESCE(
        NULLIF(TRIM(preferred_name), ''),   -- Handle empty/whitespace
        NULLIF(TRIM(first_name), ''),
        NULLIF(TRIM(last_name), ''),
        'Customer #' || customer_id::TEXT
    ) AS display_name
FROM customers;
```

### 2. **Unexpected Type Coercion**

```sql
-- Problem: Implicit casting can cause issues
-- COALESCE(integer_id, 'N/A')  -- Tries to cast 'N/A' to integer

-- Solution: Explicit casting
SELECT
    COALESCE(customer_id::TEXT, 'N/A') AS customer_display,
    COALESCE(order_date::TEXT, 'No date') AS order_date_display;

-- Better: Use appropriate data types from the start
SELECT
    CASE
        WHEN customer_id IS NOT NULL THEN customer_id::TEXT
        ELSE 'N/A'
    END AS customer_display;
```

### 3. **Performance with Large Arguments Lists**

```sql
-- Inefficient: Long COALESCE chain with expensive operations
SELECT
    COALESCE(
        expensive_function1(id),
        expensive_function2(id),
        expensive_function3(id),
        expensive_function4(id),
        'default'
    )
FROM large_table;

-- Better: Use conditional evaluation
SELECT
    CASE
        WHEN condition1 THEN expensive_function1(id)
        WHEN condition2 THEN expensive_function2(id)
        WHEN condition3 THEN expensive_function3(id)
        WHEN condition4 THEN expensive_function4(id)
        ELSE 'default'
    END
FROM large_table;
```

The `COALESCE` function is an essential tool for robust NULL handling in PostgreSQL, enabling clean, readable, and maintainable SQL code for data validation, default value assignment, and graceful error handling.
