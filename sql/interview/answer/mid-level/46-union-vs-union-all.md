# Question 46: What is the difference between `UNION` and `UNION ALL`?

## Overview

`UNION` and `UNION ALL` are SQL operators used to combine the results of two or more SELECT statements. The key difference is how they handle duplicate rows.

### Quick Comparison:

| Aspect           | UNION                                   | UNION ALL                                      |
| ---------------- | --------------------------------------- | ---------------------------------------------- |
| **Duplicates**   | Removes duplicate rows                  | Keeps all rows including duplicates            |
| **Performance**  | Slower (requires sorting/deduplication) | Faster (no duplicate processing)               |
| **Memory Usage** | Higher (for deduplication process)      | Lower                                          |
| **Use Case**     | When you need unique results            | When you want all results including duplicates |

## UNION Operator

### Definition:

`UNION` combines the results of two or more SELECT statements and **removes duplicate rows** from the final result set.

### Syntax:

```sql
SELECT column1, column2 FROM table1
UNION
SELECT column1, column2 FROM table2;
```

### Basic UNION Example:

```sql
-- Get all unique customer names from orders and prospects
SELECT customer_name FROM orders
UNION
SELECT prospect_name FROM prospects;

-- Sample Data:
-- orders table: 'John Doe', 'Jane Smith', 'Bob Johnson'
-- prospects table: 'Jane Smith', 'Alice Brown', 'John Doe'

-- Result (duplicates removed):
-- 'John Doe'
-- 'Jane Smith'
-- 'Bob Johnson'
-- 'Alice Brown'
```

## UNION ALL Operator

### Definition:

`UNION ALL` combines the results of two or more SELECT statements and **keeps all rows**, including duplicates.

### Syntax:

```sql
SELECT column1, column2 FROM table1
UNION ALL
SELECT column1, column2 FROM table2;
```

### Basic UNION ALL Example:

```sql
-- Get all customer names from orders and prospects (including duplicates)
SELECT customer_name FROM orders
UNION ALL
SELECT prospect_name FROM prospects;

-- Using same sample data as above

-- Result (all rows included):
-- 'John Doe'      -- from orders
-- 'Jane Smith'    -- from orders
-- 'Bob Johnson'   -- from orders
-- 'Jane Smith'    -- from prospects (duplicate kept)
-- 'Alice Brown'   -- from prospects
-- 'John Doe'      -- from prospects (duplicate kept)
```

## Detailed Examples

### 1. **E-commerce Product Catalog**

```sql
-- Scenario: Combine active products and discontinued products

-- UNION: Get unique product names (removes duplicates)
SELECT product_name, category FROM active_products
UNION
SELECT product_name, category FROM discontinued_products;

-- UNION ALL: Get all product records (keeps duplicates)
SELECT product_name, category FROM active_products
UNION ALL
SELECT product_name, category FROM discontinued_products;
```

### 2. **Employee Data from Multiple Sources**

```sql
-- UNION: Unique employees across all departments
SELECT
    employee_id,
    first_name,
    last_name,
    'Full-time' as employment_type
FROM full_time_employees
UNION
SELECT
    employee_id,
    first_name,
    last_name,
    'Part-time' as employment_type
FROM part_time_employees;

-- UNION ALL: All employee records (if someone works both full and part-time)
SELECT
    employee_id,
    first_name,
    last_name,
    'Full-time' as employment_type
FROM full_time_employees
UNION ALL
SELECT
    employee_id,
    first_name,
    last_name,
    'Part-time' as employment_type
FROM part_time_employees;
```

### 3. **Sales Data Analysis**

```sql
-- UNION: Unique customers who made purchases in Q1 or Q2
SELECT DISTINCT customer_id, customer_name FROM q1_sales
UNION
SELECT DISTINCT customer_id, customer_name FROM q2_sales;

-- UNION ALL: All purchase records from Q1 and Q2
SELECT customer_id, customer_name, sale_amount FROM q1_sales
UNION ALL
SELECT customer_id, customer_name, sale_amount FROM q2_sales;
```

## Performance Comparison

### 1. **UNION Performance Characteristics**

```sql
-- UNION requires additional processing:
-- 1. Combine all rows
-- 2. Sort the combined result set
-- 3. Remove duplicates
-- 4. Return final result

EXPLAIN ANALYZE
SELECT product_name FROM products_2022
UNION
SELECT product_name FROM products_2023;

-- Execution plan typically shows:
-- -> Unique  (cost=X..Y rows=Z)
--    -> Sort  (cost=A..B rows=C)
--        -> Append  (cost=...)
--            -> Seq Scan on products_2022
--            -> Seq Scan on products_2023
```

### 2. **UNION ALL Performance Characteristics**

```sql
-- UNION ALL is simpler:
-- 1. Combine all rows
-- 2. Return result immediately

EXPLAIN ANALYZE
SELECT product_name FROM products_2022
UNION ALL
SELECT product_name FROM products_2023;

-- Execution plan typically shows:
-- -> Append  (cost=X..Y rows=Z)
--    -> Seq Scan on products_2022
--    -> Seq Scan on products_2023
```

### 3. **Performance Comparison Example**

```sql
-- Timing comparison with large datasets
\timing on

-- UNION (slower due to deduplication)
SELECT customer_id FROM large_orders_table_1
UNION
SELECT customer_id FROM large_orders_table_2;
-- Time: 1250.123 ms

-- UNION ALL (faster, no deduplication)
SELECT customer_id FROM large_orders_table_1
UNION ALL
SELECT customer_id FROM large_orders_table_2;
-- Time: 234.567 ms
```

## Requirements for UNION Operations

### 1. **Column Count Must Match**

```sql
-- ✅ CORRECT: Same number of columns
SELECT customer_id, customer_name FROM customers
UNION
SELECT supplier_id, supplier_name FROM suppliers;

-- ❌ ERROR: Different number of columns
SELECT customer_id, customer_name FROM customers
UNION
SELECT supplier_id FROM suppliers;  -- Missing column
```

### 2. **Compatible Data Types**

```sql
-- ✅ CORRECT: Compatible data types
SELECT employee_id, salary FROM employees     -- INTEGER, NUMERIC
UNION
SELECT contractor_id, rate FROM contractors;  -- INTEGER, NUMERIC

-- ❌ ERROR: Incompatible data types
SELECT employee_id, hire_date FROM employees  -- INTEGER, DATE
UNION
SELECT contractor_id, hourly_rate FROM contractors;  -- INTEGER, NUMERIC
```

### 3. **Column Names from First Query**

```sql
-- Column names come from the first SELECT statement
SELECT customer_id as id, customer_name as name FROM customers
UNION ALL
SELECT supplier_id, supplier_name FROM suppliers;

-- Result columns will be named: "id", "name"
```

## Real-World Use Cases

### 1. **Data Migration and Integration**

```sql
-- Combine data from multiple legacy systems
SELECT
    customer_id,
    customer_name,
    email,
    'System_A' as source_system
FROM legacy_system_a.customers
WHERE last_updated >= '2023-01-01'

UNION ALL

SELECT
    customer_id,
    customer_name,
    email,
    'System_B' as source_system
FROM legacy_system_b.customers
WHERE last_updated >= '2023-01-01';
```

### 2. **Reporting Across Time Periods**

```sql
-- Monthly sales report combining historical and current data
SELECT
    'Historical' as period_type,
    EXTRACT(YEAR FROM sale_date) as year,
    EXTRACT(MONTH FROM sale_date) as month,
    SUM(amount) as total_sales
FROM historical_sales
WHERE sale_date >= '2022-01-01'
GROUP BY EXTRACT(YEAR FROM sale_date), EXTRACT(MONTH FROM sale_date)

UNION ALL

SELECT
    'Current' as period_type,
    EXTRACT(YEAR FROM sale_date) as year,
    EXTRACT(MONTH FROM sale_date) as month,
    SUM(amount) as total_sales
FROM current_sales
WHERE sale_date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY EXTRACT(YEAR FROM sale_date), EXTRACT(MONTH FROM sale_date)

ORDER BY year, month, period_type;
```

### 3. **Audit and Compliance Reporting**

```sql
-- Combine different types of transactions for audit
SELECT
    transaction_id,
    transaction_date,
    amount,
    'Purchase' as transaction_type,
    vendor_name as counterparty
FROM purchase_transactions
WHERE transaction_date BETWEEN '2023-01-01' AND '2023-12-31'

UNION ALL

SELECT
    transaction_id,
    transaction_date,
    amount,
    'Sale' as transaction_type,
    customer_name as counterparty
FROM sales_transactions
WHERE transaction_date BETWEEN '2023-01-01' AND '2023-12-31'

UNION ALL

SELECT
    transaction_id,
    transaction_date,
    amount,
    'Refund' as transaction_type,
    customer_name as counterparty
FROM refund_transactions
WHERE transaction_date BETWEEN '2023-01-01' AND '2023-12-31'

ORDER BY transaction_date, transaction_type;
```

### 4. **Data Warehouse ETL Processes**

```sql
-- Combine data from multiple source tables for dimension building
SELECT
    product_id,
    product_name,
    category_id,
    'Online' as sales_channel
FROM online_products
WHERE active = true

UNION ALL

SELECT
    product_id,
    product_name,
    category_id,
    'Retail' as sales_channel
FROM retail_products
WHERE active = true

UNION ALL

SELECT
    product_id,
    product_name,
    category_id,
    'Wholesale' as sales_channel
FROM wholesale_products
WHERE active = true;
```

## Advanced UNION Patterns

### 1. **Multiple UNION Operations**

```sql
-- Combining more than two queries
SELECT customer_type, COUNT(*) FROM retail_customers
UNION ALL
SELECT customer_type, COUNT(*) FROM wholesale_customers
UNION ALL
SELECT customer_type, COUNT(*) FROM online_customers
ORDER BY customer_type;
```

### 2. **UNION with Subqueries**

```sql
-- Using UNION in subqueries
SELECT customer_id, total_orders
FROM (
    SELECT customer_id, COUNT(*) as total_orders
    FROM online_orders
    GROUP BY customer_id

    UNION ALL

    SELECT customer_id, COUNT(*) as total_orders
    FROM retail_orders
    GROUP BY customer_id
) combined_orders
WHERE total_orders > 5;
```

### 3. **UNION with Common Table Expressions (CTEs)**

```sql
-- Using UNION in CTEs for complex analysis
WITH all_sales AS (
    SELECT
        sale_date,
        customer_id,
        amount,
        'Online' as channel
    FROM online_sales
    WHERE sale_date >= '2023-01-01'

    UNION ALL

    SELECT
        sale_date,
        customer_id,
        amount,
        'Retail' as channel
    FROM retail_sales
    WHERE sale_date >= '2023-01-01'
),
customer_summary AS (
    SELECT
        customer_id,
        channel,
        COUNT(*) as purchase_count,
        SUM(amount) as total_spent
    FROM all_sales
    GROUP BY customer_id, channel
)
SELECT
    channel,
    COUNT(*) as customer_count,
    AVG(total_spent) as avg_spending_per_customer
FROM customer_summary
GROUP BY channel;
```

## When to Use Each

### Use UNION When:

1. **Unique results needed**: Removing duplicates is required
2. **Data quality is important**: Want to ensure no duplicate records
3. **Performance is not critical**: Can afford the deduplication overhead
4. **Combining master data**: Like unique customer lists, product catalogs

### Examples:

```sql
-- Unique customer email list for marketing
SELECT email FROM newsletter_subscribers
UNION
SELECT email FROM customers
WHERE email IS NOT NULL;

-- Unique product categories across all systems
SELECT DISTINCT category_name FROM product_categories_old
UNION
SELECT DISTINCT category_name FROM product_categories_new;
```

### Use UNION ALL When:

1. **All records needed**: Including duplicates is important
2. **Performance is critical**: Need faster query execution
3. **Analytical queries**: Aggregating data across sources
4. **Known unique sources**: Already know there are no duplicates

### Examples:

```sql
-- All transaction records for analysis (including duplicate entries)
SELECT * FROM jan_transactions
UNION ALL
SELECT * FROM feb_transactions
UNION ALL
SELECT * FROM mar_transactions;

-- Combining log files where duplicates might be meaningful
SELECT timestamp, event_type, message FROM app_log_2023
UNION ALL
SELECT timestamp, event_type, message FROM app_log_2024;
```

## Common Mistakes and Best Practices

### 1. **Common Mistakes**

```sql
-- ❌ Using UNION when UNION ALL would be more efficient
-- If you know there are no duplicates, use UNION ALL
SELECT id, name FROM table1
UNION  -- Unnecessary deduplication
SELECT id, name FROM table2;

-- ✅ Better approach when no duplicates expected
SELECT id, name FROM table1
UNION ALL
SELECT id, name FROM table2;
```

### 2. **Best Practices**

```sql
-- Use meaningful column aliases
SELECT
    customer_id as id,
    customer_name as name,
    'Customer' as record_type
FROM customers

UNION ALL

SELECT
    supplier_id as id,
    supplier_name as name,
    'Supplier' as record_type
FROM suppliers
ORDER BY name;  -- ORDER BY applies to entire result set
```

### 3. **Performance Optimization**

```sql
-- Add conditions to reduce dataset size before UNION
SELECT customer_id, customer_name
FROM customers
WHERE created_date >= '2023-01-01'  -- Filter early

UNION ALL

SELECT prospect_id, prospect_name
FROM prospects
WHERE created_date >= '2023-01-01'  -- Filter early

-- Rather than:
SELECT customer_id, customer_name FROM customers
UNION ALL
SELECT prospect_id, prospect_name FROM prospects
-- WHERE created_date >= '2023-01-01'  -- Cannot filter here
```

Understanding the differences between `UNION` and `UNION ALL` is crucial for writing efficient SQL queries and choosing the right operator based on your specific requirements for data uniqueness and performance.
