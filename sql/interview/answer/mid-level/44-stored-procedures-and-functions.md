# Question 44: What are stored procedures and functions?

## Overview

**Stored procedures** and **functions** are reusable blocks of code stored in the database that can be executed on demand. They encapsulate business logic, improve performance, and provide better security and maintainability.

### Key Differences (PostgreSQL 11+):

| Aspect                  | Functions                      | Stored Procedures                         |
| ----------------------- | ------------------------------ | ----------------------------------------- |
| **Return Value**        | Must return a value            | Optional return value                     |
| **Transaction Control** | Cannot manage transactions     | Can manage transactions (COMMIT/ROLLBACK) |
| **Calling**             | Used in SELECT, WHERE, etc.    | Called with CALL statement                |
| **Introduction**        | Available since early versions | Introduced in PostgreSQL 11               |

## Functions in PostgreSQL

### Basic Function Syntax:

```sql
CREATE [OR REPLACE] FUNCTION function_name(parameter1 type1, parameter2 type2)
RETURNS return_type
LANGUAGE language_name
AS $$
    -- function body
$$;
```

### Simple Function Example:

```sql
-- Calculate circle area
CREATE OR REPLACE FUNCTION calculate_circle_area(radius NUMERIC)
RETURNS NUMERIC
LANGUAGE SQL
AS $$
    SELECT 3.14159 * radius * radius;
$$;

-- Usage
SELECT calculate_circle_area(5.0); -- Returns 78.53975
```

## Types of Functions

### 1. **SQL Functions**

Written in pure SQL:

```sql
-- Get customer's total orders
CREATE OR REPLACE FUNCTION get_customer_order_total(customer_id_param INTEGER)
RETURNS NUMERIC
LANGUAGE SQL
AS $$
    SELECT COALESCE(SUM(total_amount), 0)
    FROM orders
    WHERE customer_id = customer_id_param AND status = 'completed';
$$;

-- Usage
SELECT get_customer_order_total(123);
```

### 2. **PL/pgSQL Functions**

Procedural language with variables, loops, conditions:

```sql
-- Calculate employee bonus based on performance
CREATE OR REPLACE FUNCTION calculate_bonus(emp_id INTEGER, performance_score NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    base_salary NUMERIC;
    bonus_percentage NUMERIC;
    final_bonus NUMERIC;
BEGIN
    -- Get employee's base salary
    SELECT salary INTO base_salary
    FROM employees
    WHERE employee_id = emp_id;

    -- Determine bonus percentage based on performance
    IF performance_score >= 90 THEN
        bonus_percentage := 0.15; -- 15%
    ELSIF performance_score >= 80 THEN
        bonus_percentage := 0.10; -- 10%
    ELSIF performance_score >= 70 THEN
        bonus_percentage := 0.05; -- 5%
    ELSE
        bonus_percentage := 0.00; -- No bonus
    END IF;

    -- Calculate final bonus
    final_bonus := base_salary * bonus_percentage;

    RETURN final_bonus;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0; -- Employee not found
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error calculating bonus: %', SQLERRM;
END;
$$;

-- Usage
SELECT calculate_bonus(101, 85.5); -- Returns bonus amount
```

### 3. **Functions with Multiple Return Values**

```sql
-- Return employee details as a record
CREATE TYPE employee_summary AS (
    emp_id INTEGER,
    full_name TEXT,
    department TEXT,
    total_sales NUMERIC
);

CREATE OR REPLACE FUNCTION get_employee_summary(emp_id INTEGER)
RETURNS employee_summary
LANGUAGE plpgsql
AS $$
DECLARE
    result employee_summary;
BEGIN
    SELECT
        e.employee_id,
        e.first_name || ' ' || e.last_name,
        d.department_name,
        COALESCE(SUM(s.amount), 0)
    INTO result
    FROM employees e
    JOIN departments d ON e.department_id = d.department_id
    LEFT JOIN sales s ON e.employee_id = s.employee_id
    WHERE e.employee_id = emp_id
    GROUP BY e.employee_id, e.first_name, e.last_name, d.department_name;

    RETURN result;
END;
$$;

-- Usage
SELECT * FROM get_employee_summary(101);
```

### 4. **Table-Valued Functions**

```sql
-- Return multiple rows
CREATE OR REPLACE FUNCTION get_top_customers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    customer_id INTEGER,
    customer_name TEXT,
    total_orders INTEGER,
    total_spent NUMERIC,
    avg_order_value NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.customer_id,
        c.name,
        COUNT(o.order_id)::INTEGER as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    WHERE o.status = 'completed'
    GROUP BY c.customer_id, c.name
    ORDER BY total_spent DESC
    LIMIT limit_count;
END;
$$;

-- Usage
SELECT * FROM get_top_customers(5);
```

## Stored Procedures (PostgreSQL 11+)

### Basic Procedure Syntax:

```sql
CREATE [OR REPLACE] PROCEDURE procedure_name(parameter1 type1, parameter2 type2)
LANGUAGE language_name
AS $$
    -- procedure body
$$;
```

### Simple Procedure Example:

```sql
-- Update customer status and log the change
CREATE OR REPLACE PROCEDURE update_customer_status(
    p_customer_id INTEGER,
    p_new_status TEXT,
    p_reason TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    old_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO old_status
    FROM customers
    WHERE customer_id = p_customer_id;

    -- Update customer status
    UPDATE customers
    SET status = p_new_status, last_updated = NOW()
    WHERE customer_id = p_customer_id;

    -- Log the change
    INSERT INTO customer_status_log (customer_id, old_status, new_status, reason, changed_at)
    VALUES (p_customer_id, old_status, p_new_status, p_reason, NOW());

    -- Commit the transaction
    COMMIT;

    RAISE NOTICE 'Customer % status updated from % to %', p_customer_id, old_status, p_new_status;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE EXCEPTION 'Failed to update customer status: %', SQLERRM;
END;
$$;

-- Usage
CALL update_customer_status(123, 'inactive', 'Customer requested account suspension');
```

### Procedure with Transaction Control:

```sql
-- Process order with full transaction control
CREATE OR REPLACE PROCEDURE process_order(
    p_customer_id INTEGER,
    p_product_id INTEGER,
    p_quantity INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id INTEGER;
    v_product_price NUMERIC;
    v_available_stock INTEGER;
    v_total_amount NUMERIC;
BEGIN
    -- Start transaction explicitly
    BEGIN
        -- Check product availability
        SELECT price, stock_quantity
        INTO v_product_price, v_available_stock
        FROM products
        WHERE product_id = p_product_id;

        -- Validate stock
        IF v_available_stock < p_quantity THEN
            RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_available_stock, p_quantity;
        END IF;

        -- Calculate total
        v_total_amount := v_product_price * p_quantity;

        -- Create order
        INSERT INTO orders (customer_id, total_amount, status, created_at)
        VALUES (p_customer_id, v_total_amount, 'pending', NOW())
        RETURNING order_id INTO v_order_id;

        -- Add order item
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (v_order_id, p_product_id, p_quantity, v_product_price, v_total_amount);

        -- Update product stock
        UPDATE products
        SET stock_quantity = stock_quantity - p_quantity
        WHERE product_id = p_product_id;

        -- Commit transaction
        COMMIT;

        RAISE NOTICE 'Order % processed successfully', v_order_id;
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback on any error
            ROLLBACK;
            RAISE EXCEPTION 'Order processing failed: %', SQLERRM;
    END;
END;
$$;

-- Usage
CALL process_order(123, 456, 2);
```

## Advanced Features

### 1. **Functions with Default Parameters**

```sql
CREATE OR REPLACE FUNCTION get_sales_report(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE,
    department_name TEXT DEFAULT NULL
)
RETURNS TABLE(
    sales_date DATE,
    department TEXT,
    total_sales NUMERIC,
    order_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.sale_date::DATE,
        d.department_name,
        SUM(s.amount) as total_sales,
        COUNT(*)::INTEGER as order_count
    FROM sales s
    JOIN employees e ON s.employee_id = e.employee_id
    JOIN departments d ON e.department_id = d.department_id
    WHERE s.sale_date BETWEEN start_date AND end_date
    AND (department_name IS NULL OR d.department_name = get_sales_report.department_name)
    GROUP BY s.sale_date::DATE, d.department_name
    ORDER BY s.sale_date DESC;
END;
$$;

-- Usage variations
SELECT * FROM get_sales_report(); -- Last 30 days, all departments
SELECT * FROM get_sales_report('2023-01-01'::DATE, '2023-12-31'::DATE); -- Specific year
SELECT * FROM get_sales_report(department_name := 'Sales'); -- Specific department
```

### 2. **Variadic Functions** (Variable number of arguments)

```sql
CREATE OR REPLACE FUNCTION calculate_average(VARIADIC numbers NUMERIC[])
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    total NUMERIC := 0;
    count_nums INTEGER;
    num NUMERIC;
BEGIN
    count_nums := array_length(numbers, 1);

    IF count_nums IS NULL OR count_nums = 0 THEN
        RETURN NULL;
    END IF;

    FOREACH num IN ARRAY numbers LOOP
        total := total + num;
    END LOOP;

    RETURN total / count_nums;
END;
$$;

-- Usage
SELECT calculate_average(10, 20, 30, 40); -- Returns 25
SELECT calculate_average(VARIADIC ARRAY[1, 2, 3, 4, 5]); -- Returns 3
```

### 3. **Aggregate Functions**

```sql
-- Custom aggregate function to concatenate strings
CREATE OR REPLACE FUNCTION concat_strings_sfunc(acc TEXT, val TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
    SELECT CASE
        WHEN acc IS NULL OR acc = '' THEN val
        WHEN val IS NULL OR val = '' THEN acc
        ELSE acc || ', ' || val
    END;
$$;

CREATE AGGREGATE string_concat(TEXT) (
    SFUNC = concat_strings_sfunc,
    STYPE = TEXT,
    INITCOND = ''
);

-- Usage
SELECT department, string_concat(first_name || ' ' || last_name) as employees
FROM employees
GROUP BY department;
```

## Error Handling

### Exception Handling in Functions:

```sql
CREATE OR REPLACE FUNCTION safe_divide(dividend NUMERIC, divisor NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
    IF divisor = 0 THEN
        RAISE EXCEPTION 'Division by zero is not allowed';
    END IF;

    RETURN dividend / divisor;
EXCEPTION
    WHEN division_by_zero THEN
        RAISE NOTICE 'Division by zero attempted, returning NULL';
        RETURN NULL;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Unexpected error in safe_divide: %', SQLERRM;
END;
$$;
```

### Custom Exception Types:

```sql
CREATE OR REPLACE FUNCTION validate_email(email_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    IF email_address IS NULL THEN
        RAISE EXCEPTION 'INVALID_EMAIL: Email cannot be NULL';
    END IF;

    IF email_address !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'INVALID_EMAIL: Invalid email format: %', email_address;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        IF SQLSTATE = 'P0001' THEN -- User-defined exception
            RAISE;
        ELSE
            RAISE EXCEPTION 'Unexpected error validating email: %', SQLERRM;
        END IF;
END;
$$;
```

## Function Security & Privileges

### Security Definer vs Security Invoker:

```sql
-- SECURITY DEFINER: Runs with creator's privileges
CREATE OR REPLACE FUNCTION get_salary_info(emp_id INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER  -- Important for accessing restricted data
AS $$
DECLARE
    emp_salary NUMERIC;
BEGIN
    SELECT salary INTO emp_salary
    FROM employees
    WHERE employee_id = emp_id;

    RETURN emp_salary;
END;
$$;

-- SECURITY INVOKER: Runs with caller's privileges (default)
CREATE OR REPLACE FUNCTION get_public_info(emp_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN 'Employee ID: ' || emp_id;
END;
$$;
```

### Function Privileges:

```sql
-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_bonus(INTEGER, NUMERIC) TO sales_team;

-- Revoke permission
REVOKE EXECUTE ON FUNCTION get_salary_info(INTEGER) FROM public;
```

## Performance Considerations

### 1. **Function Volatility**

```sql
-- IMMUTABLE: Always returns same result for same inputs
CREATE OR REPLACE FUNCTION calculate_tax_rate(amount NUMERIC)
RETURNS NUMERIC
LANGUAGE SQL
IMMUTABLE  -- Allows optimization
AS $$
    SELECT amount * 0.08;
$$;

-- STABLE: Doesn't change within a single statement
CREATE OR REPLACE FUNCTION get_current_exchange_rate()
RETURNS NUMERIC
LANGUAGE SQL
STABLE  -- Can be cached within statement
AS $$
    SELECT rate FROM exchange_rates WHERE currency = 'USD' AND date = CURRENT_DATE;
$$;

-- VOLATILE: May return different results on each call (default)
CREATE OR REPLACE FUNCTION generate_random_id()
RETURNS INTEGER
LANGUAGE SQL
VOLATILE  -- Cannot be optimized
AS $$
    SELECT (RANDOM() * 1000000)::INTEGER;
$$;
```

### 2. **Function Inlining**

```sql
-- Simple SQL functions can be inlined
CREATE OR REPLACE FUNCTION is_premium_customer(total_spent NUMERIC)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT total_spent > 5000;
$$;

-- Usage in query (PostgreSQL can inline this)
SELECT customer_id, name
FROM customers
WHERE is_premium_customer(total_spent);
```

## Debugging Functions

### 1. **Using RAISE for Debugging**:

```sql
CREATE OR REPLACE FUNCTION debug_function_example(input_val INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    result INTEGER;
BEGIN
    RAISE NOTICE 'Input value: %', input_val;

    result := input_val * 2;
    RAISE NOTICE 'Calculated result: %', result;

    IF result > 100 THEN
        RAISE WARNING 'Result exceeds threshold: %', result;
    END IF;

    RETURN result;
END;
$$;
```

### 2. **Function Information Queries**:

```sql
-- List all functions
SELECT
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- Get function definition
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'your_function_name';
```

## Best Practices

### 1. **Naming Conventions**

```sql
-- Use descriptive names
CREATE FUNCTION calculate_monthly_interest(...)  -- Good
CREATE FUNCTION calc_int(...)                    -- Poor

-- Use consistent prefixes
CREATE FUNCTION get_customer_info(...)     -- Retrieval function
CREATE FUNCTION set_customer_status(...)   -- Modification function
CREATE FUNCTION validate_email(...)        -- Validation function
```

### 2. **Parameter Validation**

```sql
CREATE OR REPLACE FUNCTION transfer_funds(
    from_account INTEGER,
    to_account INTEGER,
    amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate parameters
    IF from_account IS NULL OR to_account IS NULL THEN
        RAISE EXCEPTION 'Account IDs cannot be NULL';
    END IF;

    IF amount IS NULL OR amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive: %', amount;
    END IF;

    IF from_account = to_account THEN
        RAISE EXCEPTION 'Cannot transfer to same account';
    END IF;

    -- Function logic here...
    RETURN TRUE;
END;
$$;
```

### 3. **Documentation**

```sql
-- Add function comments
CREATE OR REPLACE FUNCTION calculate_shipping_cost(weight NUMERIC, distance NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
-- Calculate shipping cost based on package weight and delivery distance
-- Parameters:
--   weight: Package weight in pounds
--   distance: Delivery distance in miles
-- Returns: Shipping cost in dollars
-- Example: SELECT calculate_shipping_cost(5.5, 100.0);
BEGIN
    RETURN (weight * 0.5) + (distance * 0.02);
END;
$$;

COMMENT ON FUNCTION calculate_shipping_cost(NUMERIC, NUMERIC) IS
'Calculates shipping cost based on weight and distance. Used by order processing system.';
```

## Common Use Cases

### 1. **Data Validation Functions**

```sql
CREATE OR REPLACE FUNCTION validate_phone_number(phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN phone ~ '^\+?[1-9]\d{1,14}$';
END;
$$;
```

### 2. **Business Logic Encapsulation**

```sql
CREATE OR REPLACE FUNCTION apply_discount(
    original_price NUMERIC,
    customer_tier TEXT,
    product_category TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    discount_rate NUMERIC := 0;
BEGIN
    -- Tier-based discounts
    discount_rate := CASE customer_tier
        WHEN 'platinum' THEN 0.20
        WHEN 'gold' THEN 0.15
        WHEN 'silver' THEN 0.10
        ELSE 0.05
    END;

    -- Category-specific bonuses
    IF product_category = 'electronics' THEN
        discount_rate := discount_rate + 0.05;
    END IF;

    -- Cap maximum discount
    discount_rate := LEAST(discount_rate, 0.50);

    RETURN original_price * (1 - discount_rate);
END;
$$;
```

### 3. **Data Transformation Functions**

```sql
CREATE OR REPLACE FUNCTION format_currency(amount NUMERIC, currency_code TEXT DEFAULT 'USD')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN CASE currency_code
        WHEN 'USD' THEN '$' || TO_CHAR(amount, 'FM999,999,999.00')
        WHEN 'EUR' THEN '€' || TO_CHAR(amount, 'FM999,999,999.00')
        WHEN 'GBP' THEN '£' || TO_CHAR(amount, 'FM999,999,999.00')
        ELSE currency_code || ' ' || TO_CHAR(amount, 'FM999,999,999.00')
    END;
END;
$$;
```

Functions and stored procedures are powerful tools for encapsulating business logic, improving performance, and maintaining data integrity in PostgreSQL applications. They provide reusability, security, and centralized logic management while offering sophisticated features like transaction control, error handling, and advanced parameter handling.
