# Question 55: What is the `CASE` statement?

## Overview

The **`CASE` statement** is a conditional expression in SQL that allows you to perform conditional logic within queries. It evaluates conditions in order and returns the first result where the condition is true. It's equivalent to if-then-else logic in programming languages.

### Two Forms of CASE:

1. **Simple CASE**: Compares an expression to multiple values
2. **Searched CASE**: Uses conditional expressions (WHEN conditions)

### Basic Syntax:

```sql
-- Simple CASE
CASE expression
    WHEN value1 THEN result1
    WHEN value2 THEN result2
    ...
    ELSE default_result
END

-- Searched CASE (more common and flexible)
CASE
    WHEN condition1 THEN result1
    WHEN condition2 THEN result2
    ...
    ELSE default_result
END
```

### Key Characteristics:

- **Returns a value**: CASE is an expression, not a statement
- **First match wins**: Evaluates conditions in order, returns first match
- **ELSE is optional**: Returns NULL if no conditions match and no ELSE clause
- **Type consistency**: All result expressions must return compatible data types
- **Can be nested**: CASE expressions can contain other CASE expressions

## Basic Usage Examples

### 1. **Simple CASE Expression**

```sql
-- Simple CASE for status mapping
SELECT
    order_id,
    customer_id,
    status_code,
    CASE status_code
        WHEN 'P' THEN 'Pending'
        WHEN 'S' THEN 'Shipped'
        WHEN 'D' THEN 'Delivered'
        WHEN 'C' THEN 'Cancelled'
        ELSE 'Unknown Status'
    END AS status_description
FROM orders;

-- Simple CASE for category grouping
SELECT
    product_id,
    product_name,
    category_id,
    CASE category_id
        WHEN 1 THEN 'Electronics'
        WHEN 2 THEN 'Clothing'
        WHEN 3 THEN 'Books'
        WHEN 4 THEN 'Home & Garden'
        ELSE 'Other'
    END AS category_name
FROM products;

-- Simple CASE for day of week
SELECT
    order_date,
    CASE EXTRACT(DOW FROM order_date)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS day_of_week
FROM orders;
```

### 2. **Searched CASE Expression (More Common)**

```sql
-- Customer segmentation based on multiple criteria
SELECT
    customer_id,
    customer_name,
    total_orders,
    total_spent,
    last_order_date,
    CASE
        WHEN total_spent > 10000 AND total_orders > 50 THEN 'VIP'
        WHEN total_spent > 5000 AND total_orders > 20 THEN 'Premium'
        WHEN total_spent > 1000 AND total_orders > 5 THEN 'Regular'
        WHEN total_orders > 0 THEN 'Occasional'
        ELSE 'Prospect'
    END AS customer_tier
FROM customer_summary;

-- Employee performance rating
SELECT
    employee_id,
    first_name,
    last_name,
    sales_target,
    actual_sales,
    CASE
        WHEN actual_sales >= sales_target * 1.2 THEN 'Exceeds Expectations'
        WHEN actual_sales >= sales_target THEN 'Meets Expectations'
        WHEN actual_sales >= sales_target * 0.8 THEN 'Below Expectations'
        ELSE 'Needs Improvement'
    END AS performance_rating,

    -- Bonus calculation
    CASE
        WHEN actual_sales >= sales_target * 1.5 THEN actual_sales * 0.15
        WHEN actual_sales >= sales_target * 1.2 THEN actual_sales * 0.10
        WHEN actual_sales >= sales_target THEN actual_sales * 0.05
        ELSE 0
    END AS bonus_amount
FROM sales_performance;

-- Price categorization
SELECT
    product_id,
    product_name,
    price,
    CASE
        WHEN price < 10 THEN 'Budget'
        WHEN price BETWEEN 10 AND 50 THEN 'Economy'
        WHEN price BETWEEN 51 AND 200 THEN 'Standard'
        WHEN price BETWEEN 201 AND 500 THEN 'Premium'
        ELSE 'Luxury'
    END AS price_category
FROM products;
```

## Advanced Use Cases

### 1. **Conditional Aggregation**

```sql
-- Sales summary with conditional counting
SELECT
    salesperson_id,
    COUNT(*) AS total_sales,

    -- Count sales by amount ranges
    COUNT(CASE WHEN sale_amount < 100 THEN 1 END) AS small_sales,
    COUNT(CASE WHEN sale_amount BETWEEN 100 AND 500 THEN 1 END) AS medium_sales,
    COUNT(CASE WHEN sale_amount > 500 THEN 1 END) AS large_sales,

    -- Sum sales by quarter
    SUM(CASE WHEN EXTRACT(QUARTER FROM sale_date) = 1 THEN sale_amount ELSE 0 END) AS q1_sales,
    SUM(CASE WHEN EXTRACT(QUARTER FROM sale_date) = 2 THEN sale_amount ELSE 0 END) AS q2_sales,
    SUM(CASE WHEN EXTRACT(QUARTER FROM sale_date) = 3 THEN sale_amount ELSE 0 END) AS q3_sales,
    SUM(CASE WHEN EXTRACT(QUARTER FROM sale_date) = 4 THEN sale_amount ELSE 0 END) AS q4_sales,

    -- Average sales by customer type
    AVG(CASE WHEN customer_type = 'VIP' THEN sale_amount END) AS avg_vip_sale,
    AVG(CASE WHEN customer_type = 'Regular' THEN sale_amount END) AS avg_regular_sale

FROM sales
WHERE sale_date >= '2023-01-01'
GROUP BY salesperson_id;

-- Product performance analysis
SELECT
    category,
    COUNT(*) AS total_products,

    -- Revenue distribution
    SUM(CASE WHEN revenue > 100000 THEN 1 ELSE 0 END) AS high_revenue_products,
    SUM(CASE WHEN revenue BETWEEN 10000 AND 100000 THEN 1 ELSE 0 END) AS medium_revenue_products,
    SUM(CASE WHEN revenue < 10000 THEN 1 ELSE 0 END) AS low_revenue_products,

    -- Calculate success rate
    ROUND(
        COUNT(CASE WHEN revenue > 50000 THEN 1 END) * 100.0 / COUNT(*),
        2
    ) AS success_rate_percent

FROM product_performance
GROUP BY category;
```

### 2. **Data Transformation and Cleaning**

```sql
-- Data standardization and cleaning
SELECT
    customer_id,

    -- Standardize gender values
    CASE
        WHEN UPPER(TRIM(gender)) IN ('M', 'MALE', 'MAN') THEN 'M'
        WHEN UPPER(TRIM(gender)) IN ('F', 'FEMALE', 'WOMAN') THEN 'F'
        WHEN UPPER(TRIM(gender)) IN ('NB', 'NON-BINARY', 'OTHER') THEN 'NB'
        ELSE NULL
    END AS standardized_gender,

    -- Clean and validate phone numbers
    CASE
        WHEN phone_number ~ '^\+?1?[0-9]{10}$'
        THEN REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g')
        WHEN LENGTH(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g')) = 10
        THEN REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g')
        ELSE NULL
    END AS clean_phone,

    -- Email validation and cleaning
    CASE
        WHEN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        THEN LOWER(TRIM(email))
        ELSE NULL
    END AS valid_email,

    -- Age group classification
    CASE
        WHEN age < 18 THEN 'Minor'
        WHEN age BETWEEN 18 AND 24 THEN 'Young Adult'
        WHEN age BETWEEN 25 AND 34 THEN 'Adult'
        WHEN age BETWEEN 35 AND 44 THEN 'Middle-aged'
        WHEN age BETWEEN 45 AND 64 THEN 'Mature'
        WHEN age >= 65 THEN 'Senior'
        ELSE 'Unknown'
    END AS age_group

FROM customers;

-- Financial data processing
SELECT
    transaction_id,
    amount,
    transaction_type,

    -- Categorize transactions
    CASE
        WHEN transaction_type = 'PURCHASE' AND amount > 1000 THEN 'Large Purchase'
        WHEN transaction_type = 'PURCHASE' AND amount > 100 THEN 'Regular Purchase'
        WHEN transaction_type = 'PURCHASE' THEN 'Small Purchase'
        WHEN transaction_type = 'REFUND' THEN 'Refund'
        WHEN transaction_type = 'TRANSFER' THEN 'Transfer'
        ELSE 'Other'
    END AS transaction_category,

    -- Risk assessment
    CASE
        WHEN transaction_type = 'PURCHASE' AND amount > 5000 THEN 'High Risk'
        WHEN transaction_type = 'PURCHASE' AND amount > 1000 THEN 'Medium Risk'
        WHEN transaction_type IN ('REFUND', 'TRANSFER') AND amount > 2000 THEN 'Medium Risk'
        ELSE 'Low Risk'
    END AS risk_level,

    -- Calculate fees
    CASE
        WHEN transaction_type = 'TRANSFER' AND amount > 1000 THEN amount * 0.001  -- 0.1%
        WHEN transaction_type = 'TRANSFER' THEN 1.00  -- Flat $1
        WHEN transaction_type = 'PURCHASE' AND amount > 100 THEN amount * 0.025   -- 2.5%
        ELSE 0
    END AS processing_fee

FROM transactions;
```

### 3. **Complex Business Logic**

```sql
-- Shipping cost calculation with complex rules
SELECT
    order_id,
    customer_id,
    total_weight,
    total_value,
    destination_country,
    shipping_method,
    is_express,
    is_premium_customer,

    CASE
        -- Free shipping for premium customers on large orders
        WHEN is_premium_customer = true AND total_value > 100 THEN 0

        -- Express shipping calculations
        WHEN is_express = true AND destination_country = 'US' THEN
            CASE
                WHEN total_weight <= 1 THEN 15.00
                WHEN total_weight <= 5 THEN 25.00
                ELSE 25.00 + (total_weight - 5) * 5.00
            END

        -- International shipping
        WHEN destination_country != 'US' THEN
            CASE
                WHEN total_weight <= 1 THEN 35.00
                WHEN total_weight <= 5 THEN 50.00
                ELSE 50.00 + (total_weight - 5) * 10.00
            END

        -- Standard domestic shipping
        WHEN shipping_method = 'STANDARD' THEN
            CASE
                WHEN total_value > 50 THEN 0  -- Free shipping over $50
                WHEN total_weight <= 1 THEN 5.00
                WHEN total_weight <= 5 THEN 8.00
                ELSE 8.00 + (total_weight - 5) * 2.00
            END

        ELSE 10.00  -- Default shipping cost
    END AS shipping_cost,

    -- Estimated delivery time
    CASE
        WHEN is_express = true AND destination_country = 'US' THEN '1-2 business days'
        WHEN is_express = true THEN '3-5 business days'
        WHEN destination_country = 'US' THEN '3-7 business days'
        WHEN destination_country IN ('CA', 'MX') THEN '7-14 business days'
        ELSE '14-21 business days'
    END AS estimated_delivery

FROM orders;

-- Dynamic pricing strategy
SELECT
    product_id,
    base_price,
    competitor_price,
    inventory_level,
    demand_score,
    season,
    is_new_product,

    CASE
        -- New product premium pricing
        WHEN is_new_product = true AND demand_score > 80 THEN base_price * 1.20

        -- Seasonal adjustments
        WHEN season = 'HOLIDAY' AND inventory_level < 100 THEN base_price * 1.15
        WHEN season = 'CLEARANCE' THEN base_price * 0.70

        -- Competitive pricing
        WHEN competitor_price IS NOT NULL AND competitor_price < base_price * 0.95 THEN
            CASE
                WHEN inventory_level > 500 THEN competitor_price * 0.98  -- Match and undercut
                WHEN inventory_level > 100 THEN competitor_price * 1.02  -- Stay competitive
                ELSE base_price  -- Keep price if low inventory
            END

        -- Demand-based pricing
        WHEN demand_score > 90 AND inventory_level < 50 THEN base_price * 1.10
        WHEN demand_score < 30 AND inventory_level > 300 THEN base_price * 0.85

        -- Default pricing
        ELSE base_price
    END AS dynamic_price

FROM product_pricing_data;
```

### 4. **Data Pivoting and Reporting**

```sql
-- Sales report with pivoted monthly data
SELECT
    salesperson_id,
    salesperson_name,

    -- Pivot monthly sales
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 1 THEN sale_amount ELSE 0 END) AS jan_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 2 THEN sale_amount ELSE 0 END) AS feb_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 3 THEN sale_amount ELSE 0 END) AS mar_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 4 THEN sale_amount ELSE 0 END) AS apr_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 5 THEN sale_amount ELSE 0 END) AS may_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 6 THEN sale_amount ELSE 0 END) AS jun_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 7 THEN sale_amount ELSE 0 END) AS jul_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 8 THEN sale_amount ELSE 0 END) AS aug_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 9 THEN sale_amount ELSE 0 END) AS sep_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 10 THEN sale_amount ELSE 0 END) AS oct_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 11 THEN sale_amount ELSE 0 END) AS nov_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 12 THEN sale_amount ELSE 0 END) AS dec_sales,

    -- Performance indicators
    CASE
        WHEN SUM(sale_amount) > 500000 THEN 'Excellent'
        WHEN SUM(sale_amount) > 300000 THEN 'Good'
        WHEN SUM(sale_amount) > 150000 THEN 'Average'
        ELSE 'Below Average'
    END AS annual_performance

FROM sales s
JOIN salespeople sp ON s.salesperson_id = sp.salesperson_id
WHERE EXTRACT(YEAR FROM sale_date) = 2023
GROUP BY s.salesperson_id, sp.salesperson_name
ORDER BY SUM(sale_amount) DESC;

-- Customer behavior analysis
SELECT
    customer_segment,

    -- Order frequency analysis
    COUNT(CASE WHEN order_frequency = 'Daily' THEN 1 END) AS daily_buyers,
    COUNT(CASE WHEN order_frequency = 'Weekly' THEN 1 END) AS weekly_buyers,
    COUNT(CASE WHEN order_frequency = 'Monthly' THEN 1 END) AS monthly_buyers,
    COUNT(CASE WHEN order_frequency = 'Quarterly' THEN 1 END) AS quarterly_buyers,

    -- Purchase behavior
    AVG(CASE WHEN order_frequency = 'Daily' THEN avg_order_value END) AS daily_avg_order,
    AVG(CASE WHEN order_frequency = 'Weekly' THEN avg_order_value END) AS weekly_avg_order,
    AVG(CASE WHEN order_frequency = 'Monthly' THEN avg_order_value END) AS monthly_avg_order,

    -- Revenue contribution
    SUM(CASE WHEN total_spent > 10000 THEN total_spent ELSE 0 END) AS high_value_revenue,
    SUM(CASE WHEN total_spent BETWEEN 1000 AND 10000 THEN total_spent ELSE 0 END) AS medium_value_revenue,
    SUM(CASE WHEN total_spent < 1000 THEN total_spent ELSE 0 END) AS low_value_revenue

FROM customer_analytics
GROUP BY customer_segment;
```

## CASE with Other SQL Functions

### 1. **CASE with Aggregate Functions**

```sql
-- Conditional aggregation for statistical analysis
SELECT
    department,
    COUNT(*) AS total_employees,

    -- Salary statistics by performance level
    AVG(CASE WHEN performance_rating = 'Excellent' THEN salary END) AS avg_excellent_salary,
    AVG(CASE WHEN performance_rating = 'Good' THEN salary END) AS avg_good_salary,
    AVG(CASE WHEN performance_rating = 'Average' THEN salary END) AS avg_average_salary,

    -- Count employees by salary ranges
    COUNT(CASE WHEN salary > 100000 THEN 1 END) AS high_earners,
    COUNT(CASE WHEN salary BETWEEN 50000 AND 100000 THEN 1 END) AS mid_earners,
    COUNT(CASE WHEN salary < 50000 THEN 1 END) AS entry_level,

    -- Calculate percentiles
    COUNT(CASE WHEN salary > (SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) FROM employees) THEN 1 END) AS top_quartile,
    COUNT(CASE WHEN salary < (SELECT PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) FROM employees) THEN 1 END) AS bottom_quartile

FROM employees
GROUP BY department;
```

### 2. **CASE with Window Functions**

```sql
-- Advanced ranking and comparison with CASE
SELECT
    employee_id,
    first_name,
    last_name,
    department,
    salary,
    performance_score,

    -- Conditional ranking
    CASE
        WHEN performance_score >= 90 THEN
            RANK() OVER (PARTITION BY department ORDER BY salary DESC)
        ELSE NULL
    END AS top_performer_salary_rank,

    -- Dynamic comparison
    CASE
        WHEN salary > AVG(salary) OVER (PARTITION BY department) THEN 'Above Average'
        WHEN salary = AVG(salary) OVER (PARTITION BY department) THEN 'Average'
        ELSE 'Below Average'
    END AS salary_vs_dept_avg,

    -- Conditional percentile
    CASE
        WHEN NTILE(4) OVER (ORDER BY performance_score) = 4 THEN 'Top 25%'
        WHEN NTILE(4) OVER (ORDER BY performance_score) = 3 THEN 'Top 50%'
        WHEN NTILE(4) OVER (ORDER BY performance_score) = 2 THEN 'Bottom 50%'
        ELSE 'Bottom 25%'
    END AS performance_quartile

FROM employees;
```

### 3. **Nested CASE Expressions**

```sql
-- Complex nested conditional logic
SELECT
    customer_id,
    order_total,
    customer_type,
    order_date,

    -- Nested discount calculation
    CASE customer_type
        WHEN 'VIP' THEN
            CASE
                WHEN order_total > 1000 THEN order_total * 0.80  -- 20% discount
                WHEN order_total > 500 THEN order_total * 0.85   -- 15% discount
                ELSE order_total * 0.90                          -- 10% discount
            END
        WHEN 'Premium' THEN
            CASE
                WHEN order_total > 1000 THEN order_total * 0.85  -- 15% discount
                WHEN order_total > 500 THEN order_total * 0.90   -- 10% discount
                ELSE order_total * 0.95                          -- 5% discount
            END
        WHEN 'Regular' THEN
            CASE
                WHEN order_total > 1000 THEN order_total * 0.90  -- 10% discount
                WHEN order_total > 500 THEN order_total * 0.95   -- 5% discount
                ELSE order_total                                 -- No discount
            END
        ELSE order_total  -- No discount for other types
    END AS discounted_total,

    -- Nested shipping calculation
    CASE
        WHEN order_total >= 100 THEN 0  -- Free shipping over $100
        ELSE
            CASE
                WHEN customer_type = 'VIP' THEN 0                -- Free shipping for VIP
                WHEN customer_type = 'Premium' THEN 5.00         -- Reduced shipping
                ELSE
                    CASE
                        WHEN order_total > 50 THEN 7.50          -- Standard rate
                        ELSE 10.00                               -- Small order surcharge
                    END
            END
    END AS shipping_cost

FROM orders;

-- Nested categorization
SELECT
    product_id,
    product_name,
    category,
    price,
    inventory_level,

    -- Complex product classification
    CASE category
        WHEN 'Electronics' THEN
            CASE
                WHEN price > 1000 AND inventory_level > 100 THEN 'High-End Available'
                WHEN price > 1000 THEN 'High-End Limited'
                WHEN price > 200 AND inventory_level > 50 THEN 'Mid-Range Available'
                WHEN price > 200 THEN 'Mid-Range Limited'
                ELSE 'Entry-Level'
            END
        WHEN 'Clothing' THEN
            CASE
                WHEN price > 200 THEN 'Designer'
                WHEN price > 50 THEN 'Brand'
                ELSE 'Basic'
            END
        WHEN 'Books' THEN
            CASE
                WHEN price > 100 THEN 'Specialty'
                WHEN price > 25 THEN 'Academic'
                ELSE 'General'
            END
        ELSE 'Uncategorized'
    END AS product_classification

FROM products;
```

## Performance Considerations and Best Practices

### 1. **Index-Friendly CASE Expressions**

```sql
-- Create functional index on CASE expression
CREATE INDEX idx_customer_tier ON customers (
    (CASE
        WHEN total_spent > 10000 AND total_orders > 50 THEN 'VIP'
        WHEN total_spent > 5000 AND total_orders > 20 THEN 'Premium'
        WHEN total_spent > 1000 AND total_orders > 5 THEN 'Regular'
        ELSE 'Basic'
     END)
);

-- Query that can use the functional index
SELECT customer_id, customer_name
FROM customers
WHERE (CASE
        WHEN total_spent > 10000 AND total_orders > 50 THEN 'VIP'
        WHEN total_spent > 5000 AND total_orders > 20 THEN 'Premium'
        WHEN total_spent > 1000 AND total_orders > 5 THEN 'Regular'
        ELSE 'Basic'
       END) = 'VIP';
```

### 2. **Performance Optimization Tips**

```sql
-- Efficient: Put most selective conditions first
SELECT
    product_id,
    CASE
        WHEN price > 10000 THEN 'Luxury'        -- Least common, check first
        WHEN price > 1000 THEN 'Premium'        -- Less common
        WHEN price > 100 THEN 'Standard'        -- Common
        ELSE 'Budget'                           -- Most common, last
    END AS price_tier
FROM products;

-- Inefficient: Expensive operations in CASE
SELECT
    customer_id,
    CASE
        WHEN (SELECT COUNT(*) FROM orders WHERE customer_id = c.customer_id) > 100 THEN 'VIP'  -- Subquery for each row
        ELSE 'Regular'
    END AS customer_type
FROM customers c;

-- Better: Pre-calculate expensive operations
WITH customer_order_counts AS (
    SELECT customer_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY customer_id
)
SELECT
    c.customer_id,
    CASE
        WHEN coc.order_count > 100 THEN 'VIP'
        ELSE 'Regular'
    END AS customer_type
FROM customers c
LEFT JOIN customer_order_counts coc ON c.customer_id = coc.customer_id;
```

### 3. **Data Type Consistency**

```sql
-- Good: Consistent return types
SELECT
    employee_id,
    CASE
        WHEN salary > 100000 THEN 'High'
        WHEN salary > 50000 THEN 'Medium'
        ELSE 'Low'
    END AS salary_category  -- All text values
FROM employees;

-- Good: Consistent numeric types
SELECT
    order_id,
    CASE
        WHEN total_amount > 1000 THEN total_amount * 0.90  -- DECIMAL
        WHEN total_amount > 500 THEN total_amount * 0.95   -- DECIMAL
        ELSE total_amount                                  -- DECIMAL
    END AS discounted_amount
FROM orders;

-- Avoid: Mixed return types (can cause errors)
-- CASE
--     WHEN condition THEN 'Text Value'
--     ELSE 123  -- Different type
-- END
```

### 4. **Readability and Maintenance**

```sql
-- Use meaningful names and formatting
SELECT
    customer_id,
    order_total,

    -- Clear, well-formatted CASE
    CASE
        WHEN order_total >= 1000 THEN 'Large Order'
        WHEN order_total >= 100  THEN 'Medium Order'
        WHEN order_total >= 10   THEN 'Small Order'
        ELSE 'Minimal Order'
    END AS order_size_category,

    -- Document complex logic with comments
    CASE
        -- Premium customers get tiered discounts
        WHEN customer_type = 'Premium' AND order_total > 500 THEN order_total * 0.85
        WHEN customer_type = 'Premium' THEN order_total * 0.90

        -- Regular customers get basic discount on large orders
        WHEN customer_type = 'Regular' AND order_total > 1000 THEN order_total * 0.95

        -- No discount for others
        ELSE order_total
    END AS final_amount

FROM orders;
```

The `CASE` statement is one of the most versatile and powerful tools in SQL for implementing conditional logic, data transformation, and complex business rules directly within queries.
