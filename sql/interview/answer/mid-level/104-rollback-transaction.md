# 104. How do you rollback a transaction?

## Basic Syntax

PostgreSQL provides several ways to rollback transactions:

### 1. ROLLBACK Statement

```sql
-- Most common way to rollback a transaction
BEGIN;
    INSERT INTO customers (name, email) VALUES ('John Doe', 'john@email.com');
    UPDATE accounts SET balance = balance - 100 WHERE customer_id = 123;
    -- Something goes wrong...
ROLLBACK; -- Undoes all changes made in this transaction
```

### 2. ROLLBACK TRANSACTION (Full Syntax)

```sql
-- Explicit transaction keyword (equivalent to ROLLBACK)
BEGIN TRANSACTION;
    INSERT INTO orders (customer_id, total) VALUES (123, 299.99);
    UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 456;
    -- Error condition detected...
ROLLBACK TRANSACTION; -- Full SQL standard syntax
```

### 3. ABORT Statement

```sql
-- PostgreSQL-specific alternative to ROLLBACK
BEGIN;
    DELETE FROM temp_data WHERE created_at < CURRENT_DATE - INTERVAL '7 days';
    -- Need to cancel the operation...
ABORT; -- Equivalent to ROLLBACK
```

## When to Use ROLLBACK

### 1. Error Conditions

```sql
-- Rollback when validation fails
BEGIN;
    -- Attempt to transfer money
    UPDATE accounts 
    SET balance = balance - 1000 
    WHERE account_id = 'A001';
    
    -- Check if update affected any rows (account exists and has sufficient funds)
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        ROLLBACK; -- Account doesn't exist or insufficient funds
        SELECT 'Transfer failed: Invalid account or insufficient funds' AS result;
    ELSE
        -- Continue with the transfer
        UPDATE accounts 
        SET balance = balance + 1000 
        WHERE account_id = 'A002';
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        
        IF affected_rows = 0 THEN
            ROLLBACK; -- Destination account doesn't exist
            SELECT 'Transfer failed: Destination account not found' AS result;
        ELSE
            COMMIT; -- Success
            SELECT 'Transfer completed successfully' AS result;
        END IF;
    END IF;
```

### 2. Business Logic Violations

```sql
-- Rollback when business rules are violated
BEGIN;
    -- Process order
    INSERT INTO orders (customer_id, total_amount, order_date)
    VALUES (123, 2500.00, CURRENT_DATE);
    
    -- Check customer's credit limit
    WITH customer_info AS (
        SELECT 
            credit_limit,
            (SELECT COALESCE(SUM(total_amount), 0) 
             FROM orders 
             WHERE customer_id = 123 
               AND order_date >= CURRENT_DATE - INTERVAL '30 days') AS monthly_total
        FROM customers 
        WHERE customer_id = 123
    )
    SELECT 
        credit_limit,
        monthly_total,
        monthly_total > credit_limit AS exceeds_limit
    FROM customer_info;
    
    -- Business logic check
    DO $$
    DECLARE
        monthly_total DECIMAL(10,2);
        credit_limit DECIMAL(10,2);
    BEGIN
        SELECT 
            c.credit_limit,
            COALESCE(SUM(o.total_amount), 0)
        INTO credit_limit, monthly_total
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id 
            AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
        WHERE c.customer_id = 123
        GROUP BY c.credit_limit;
        
        IF monthly_total > credit_limit THEN
            RAISE EXCEPTION 'Credit limit exceeded. Limit: %, Current total: %', 
                           credit_limit, monthly_total;
        END IF;
    END $$;
    
    -- If we reach here, commit the order
COMMIT;

-- Exception handler will automatically rollback
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE NOTICE 'Order cancelled: %', SQLERRM;
```

### 3. User-Initiated Cancellation

```sql
-- Simulate user cancellation scenario
BEGIN;
    -- Start a complex operation
    INSERT INTO temp_calculation_results 
    SELECT 
        product_id,
        SUM(quantity * price) as total_value
    FROM sales_data 
    WHERE sale_date >= CURRENT_DATE - INTERVAL '1 year'
    GROUP BY product_id;
    
    -- Update main tables based on calculations
    UPDATE products p
    SET annual_revenue = tcr.total_value
    FROM temp_calculation_results tcr
    WHERE p.product_id = tcr.product_id;
    
    -- Simulate user deciding to cancel
    -- In real application, this would be based on user input
    DO $$
    BEGIN
        -- Simulate user cancellation
        IF random() > 0.5 THEN  -- 50% chance of cancellation
            RAISE EXCEPTION 'User cancelled the operation';
        END IF;
    END $$;
    
COMMIT;

-- Handle cancellation
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE NOTICE 'Operation cancelled by user or error: %', SQLERRM;
```

## Partial Rollback with Savepoints

### 1. ROLLBACK TO SAVEPOINT

```sql
-- Rollback to specific savepoint instead of entire transaction
BEGIN;
    INSERT INTO customers (name, email) VALUES ('Customer 1', 'c1@email.com');
    
    SAVEPOINT customer_created;
    
    -- Try to create an order
    INSERT INTO orders (customer_id, total_amount) VALUES (1, 500.00);
    
    SAVEPOINT order_created;
    
    -- Try to update inventory
    UPDATE products SET quantity = quantity - 10 WHERE product_id = 1;
    
    -- Check if we have enough inventory
    DO $$
    DECLARE
        available_qty INTEGER;
    BEGIN
        SELECT quantity INTO available_qty 
        FROM products 
        WHERE product_id = 1;
        
        IF available_qty < 0 THEN
            -- Insufficient inventory, rollback only the inventory update
            ROLLBACK TO SAVEPOINT order_created;
            RAISE NOTICE 'Insufficient inventory, order created but not fulfilled';
        END IF;
    END $$;
    
    -- Add order items
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (1, 1, 10, 50.00);

-- Commit what succeeded (customer and possibly order)
COMMIT;
```

### 2. Nested Operations with Savepoints

```sql
-- Complex nested operations with granular rollback control
CREATE OR REPLACE FUNCTION process_bulk_orders()
RETURNS TABLE(
    order_id INTEGER, 
    status VARCHAR(20), 
    error_message TEXT
) AS $$
DECLARE
    order_record RECORD;
    sp_name TEXT;
BEGIN
    -- Process multiple orders
    FOR order_record IN 
        SELECT pending_order_id, customer_id, product_id, quantity
        FROM pending_orders 
        WHERE status = 'new'
        ORDER BY created_date
    LOOP
        -- Create savepoint for each order
        sp_name := 'order_' || order_record.pending_order_id;
        EXECUTE format('SAVEPOINT %I', sp_name);
        
        BEGIN
            -- Process individual order
            INSERT INTO orders (customer_id, total_amount, status)
            SELECT 
                order_record.customer_id,
                order_record.quantity * p.price,
                'processing'
            FROM products p
            WHERE p.product_id = order_record.product_id
            RETURNING orders.order_id INTO order_record.order_id;
            
            -- Update inventory
            UPDATE products 
            SET quantity = quantity - order_record.quantity
            WHERE product_id = order_record.product_id
                AND quantity >= order_record.quantity;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Insufficient inventory for product %', order_record.product_id;
            END IF;
            
            -- Mark pending order as processed
            UPDATE pending_orders 
            SET status = 'processed' 
            WHERE pending_order_id = order_record.pending_order_id;
            
            -- Return success
            RETURN QUERY SELECT 
                order_record.order_id,
                'SUCCESS'::VARCHAR(20),
                NULL::TEXT;
                
        EXCEPTION
            WHEN OTHERS THEN
                -- Rollback only this order
                EXECUTE format('ROLLBACK TO SAVEPOINT %I', sp_name);
                
                -- Return error
                RETURN QUERY SELECT 
                    NULL::INTEGER,
                    'FAILED'::VARCHAR(20),
                    SQLERRM::TEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage - processes orders individually with partial rollbacks
BEGIN;
    SELECT * FROM process_bulk_orders();
COMMIT;
```

## Automatic Rollback Scenarios

### 1. Exception-Triggered Rollback

```sql
-- Automatic rollback on exceptions
CREATE OR REPLACE FUNCTION transfer_with_validation(
    from_account VARCHAR(10),
    to_account VARCHAR(10),
    amount DECIMAL(15,2)
) RETURNS BOOLEAN AS $$
DECLARE
    from_balance DECIMAL(15,2);
BEGIN
    -- Function automatically starts in transaction context
    
    -- Validate amount
    IF amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be positive: %', amount;
    END IF;
    
    -- Check source account
    SELECT balance INTO from_balance 
    FROM accounts 
    WHERE account_id = from_account
    FOR UPDATE; -- Lock the row
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source account not found: %', from_account;
    END IF;
    
    IF from_balance < amount THEN
        RAISE EXCEPTION 'Insufficient balance. Available: %, Required: %', 
                       from_balance, amount;
    END IF;
    
    -- Check destination account
    IF NOT EXISTS (SELECT 1 FROM accounts WHERE account_id = to_account) THEN
        RAISE EXCEPTION 'Destination account not found: %', to_account;
    END IF;
    
    -- Perform transfer
    UPDATE accounts SET balance = balance - amount WHERE account_id = from_account;
    UPDATE accounts SET balance = balance + amount WHERE account_id = to_account;
    
    -- Log transaction
    INSERT INTO transaction_log (from_account, to_account, amount, transaction_time)
    VALUES (from_account, to_account, amount, CURRENT_TIMESTAMP);
    
    RETURN TRUE;
    
    -- Any exception automatically rolls back the entire function
END;
$$ LANGUAGE plpgsql;

-- Usage - automatic rollback on any error
SELECT transfer_with_validation('A001', 'A002', 1000.00);
-- If this fails, entire function is automatically rolled back
```

### 2. Constraint Violation Rollback

```sql
-- Automatic rollback on constraint violations
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    salary DECIMAL(10,2) CHECK (salary > 0),
    department_id INTEGER,
    hire_date DATE DEFAULT CURRENT_DATE
);

-- Transaction that will automatically rollback on constraint violation
BEGIN;
    INSERT INTO employees (email, salary, department_id) 
    VALUES ('john@company.com', 75000, 1);
    
    INSERT INTO employees (email, salary, department_id) 
    VALUES ('jane@company.com', 80000, 2);
    
    -- This will cause automatic rollback due to duplicate email
    INSERT INTO employees (email, salary, department_id) 
    VALUES ('john@company.com', 85000, 3);  -- ERROR: duplicate key
    
    -- This line will never execute due to automatic rollback
    UPDATE employees SET salary = salary * 1.1;
    
COMMIT; -- This will never execute

-- Handle constraint violations gracefully
BEGIN;
    INSERT INTO employees (email, salary, department_id) 
    VALUES ('alice@company.com', 70000, 1);
    
    -- Use exception handling to manage constraint violations
    BEGIN
        INSERT INTO employees (email, salary, department_id) 
        VALUES ('bob@company.com', -5000, 2);  -- Negative salary violates CHECK constraint
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Salary constraint violated for Bob, skipping...';
            -- Continue with transaction
    END;
    
    INSERT INTO employees (email, salary, department_id) 
    VALUES ('charlie@company.com', 65000, 3);
    
COMMIT; -- Alice and Charlie are inserted, Bob is skipped
```

## Rollback in Different Contexts

### 1. Stored Procedures and Functions

```sql
-- Function with explicit rollback handling
CREATE OR REPLACE FUNCTION process_order_safe(
    p_customer_id INTEGER,
    p_product_id INTEGER,
    p_quantity INTEGER
) RETURNS TABLE(success BOOLEAN, message TEXT, order_id INTEGER) AS $$
DECLARE
    v_order_id INTEGER;
    v_product_price DECIMAL(10,2);
    v_available_qty INTEGER;
BEGIN
    -- Get product information
    SELECT price, quantity INTO v_product_price, v_available_qty
    FROM products 
    WHERE product_id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Product not found', NULL::INTEGER;
        RETURN;
    END IF;
    
    IF v_available_qty < p_quantity THEN
        RETURN QUERY SELECT FALSE, 
                           format('Insufficient quantity. Available: %s, Requested: %s', 
                                  v_available_qty, p_quantity),
                           NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Create order
    INSERT INTO orders (customer_id, total_amount, status)
    VALUES (p_customer_id, v_product_price * p_quantity, 'pending')
    RETURNING orders.order_id INTO v_order_id;
    
    -- Update inventory
    UPDATE products 
    SET quantity = quantity - p_quantity 
    WHERE product_id = p_product_id;
    
    -- Create order items
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, p_product_id, p_quantity, v_product_price);
    
    RETURN QUERY SELECT TRUE, 'Order processed successfully', v_order_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Function automatically rolls back on exception
        RETURN QUERY SELECT FALSE, 'Error: ' || SQLERRM, NULL::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT * FROM process_order_safe(1, 101, 5);
    -- Additional operations...
COMMIT; -- or ROLLBACK based on results
```

### 2. Application-Level Rollback Patterns

```sql
-- Simulate application-level transaction management

-- Pattern 1: Explicit rollback in application code
/*
connection.setAutoCommit(false);
try {
    // Execute SQL operations
    statement.execute("INSERT INTO orders ...");
    statement.execute("UPDATE inventory ...");
    
    // Business logic validation
    if (validateBusinessRules()) {
        connection.commit();
        return "Success";
    } else {
        connection.rollback();
        return "Business validation failed";
    }
} catch (SQLException e) {
    connection.rollback();
    log.error("Transaction failed", e);
    return "Database error: " + e.getMessage();
} finally {
    connection.setAutoCommit(true);
}
*/

-- Pattern 2: Declarative transaction management (Spring/Java example)
/*
@Transactional
public OrderResult processOrder(OrderRequest request) {
    try {
        Order order = createOrder(request);
        updateInventory(request.getItems());
        sendNotification(order);
        
        return OrderResult.success(order);
    } catch (InsufficientInventoryException e) {
        // Exception causes automatic rollback
        return OrderResult.failure("Insufficient inventory");
    } catch (Exception e) {
        // Any uncaught exception causes rollback
        log.error("Order processing failed", e);
        return OrderResult.failure("Processing error");
    }
}
*/
```

## Advanced Rollback Scenarios

### 1. Conditional Rollback with Complex Logic

```sql
-- Complex conditional rollback scenario
CREATE OR REPLACE FUNCTION process_payroll_batch(
    pay_period_start DATE,
    pay_period_end DATE
) RETURNS TABLE(
    employee_count INTEGER,
    total_amount DECIMAL(15,2),
    status VARCHAR(20),
    message TEXT
) AS $$
DECLARE
    total_payroll DECIMAL(15,2);
    employee_cnt INTEGER;
    budget_limit DECIMAL(15,2) := 500000.00; -- $500K budget limit
BEGIN
    -- Calculate payroll for the period
    SELECT 
        COUNT(*) as emp_count,
        SUM(salary + COALESCE(bonus, 0)) as total_pay
    INTO employee_cnt, total_payroll
    FROM employees e
    LEFT JOIN employee_bonuses eb ON e.employee_id = eb.employee_id 
        AND eb.pay_period_start = process_payroll_batch.pay_period_start;
    
    -- Check budget constraints
    IF total_payroll > budget_limit THEN
        -- Log budget violation
        INSERT INTO budget_violations (
            violation_type, 
            requested_amount, 
            budget_limit, 
            violation_date
        ) VALUES (
            'PAYROLL_EXCEEDED', 
            total_payroll, 
            budget_limit, 
            CURRENT_DATE
        );
        
        -- Return without processing
        RETURN QUERY SELECT 
            employee_cnt,
            total_payroll,
            'REJECTED'::VARCHAR(20),
            format('Payroll amount $%s exceeds budget limit $%s', 
                   total_payroll, budget_limit);
        
        -- Rollback budget violation log if this is part of larger transaction
        ROLLBACK TO SAVEPOINT payroll_check;
        RETURN;
    END IF;
    
    -- Process payroll entries
    INSERT INTO payroll_entries (
        employee_id, 
        pay_period_start, 
        pay_period_end, 
        base_salary, 
        bonus_amount, 
        total_pay
    )
    SELECT 
        e.employee_id,
        process_payroll_batch.pay_period_start,
        process_payroll_batch.pay_period_end,
        e.salary,
        COALESCE(eb.bonus, 0),
        e.salary + COALESCE(eb.bonus, 0)
    FROM employees e
    LEFT JOIN employee_bonuses eb ON e.employee_id = eb.employee_id 
        AND eb.pay_period_start = process_payroll_batch.pay_period_start;
    
    -- Update budget tracking
    UPDATE budget_tracking 
    SET used_amount = used_amount + total_payroll,
        last_update = CURRENT_TIMESTAMP
    WHERE budget_category = 'PAYROLL' 
        AND fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE);
    
    RETURN QUERY SELECT 
        employee_cnt,
        total_payroll,
        'PROCESSED'::VARCHAR(20),
        'Payroll processed successfully';
        
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and rollback
        INSERT INTO process_errors (
            process_name, 
            error_message, 
            error_time
        ) VALUES (
            'process_payroll_batch', 
            SQLERRM, 
            CURRENT_TIMESTAMP
        );
        
        RETURN QUERY SELECT 
            0,
            0::DECIMAL(15,2),
            'ERROR'::VARCHAR(20),
            'Processing failed: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Usage with savepoint for partial rollback
BEGIN;
    SAVEPOINT payroll_check;
    SELECT * FROM process_payroll_batch('2025-01-01', '2025-01-15');
COMMIT;
```

### 2. Rollback with Cleanup Operations

```sql
-- Rollback with necessary cleanup
CREATE OR REPLACE FUNCTION import_data_with_cleanup(
    file_path TEXT,
    table_name TEXT
) RETURNS TEXT AS $$
DECLARE
    temp_table_name TEXT;
    import_count INTEGER;
    validation_errors INTEGER;
BEGIN
    -- Create temporary table name
    temp_table_name := table_name || '_temp_' || 
                      replace(clock_timestamp()::TEXT, ' ', '_');
    
    -- Create temporary table for import
    EXECUTE format('CREATE TEMPORARY TABLE %I (LIKE %I)', 
                  temp_table_name, table_name);
    
    -- Import data to temporary table
    EXECUTE format('COPY %I FROM %L WITH CSV HEADER', 
                  temp_table_name, file_path);
    
    GET DIAGNOSTICS import_count = ROW_COUNT;
    
    -- Validate imported data
    EXECUTE format('
        SELECT COUNT(*) FROM %I 
        WHERE email IS NULL 
           OR email !~ ''^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$''
           OR salary < 0
    ', temp_table_name) INTO validation_errors;
    
    IF validation_errors > 0 THEN
        -- Clean up temporary table
        EXECUTE format('DROP TABLE IF EXISTS %I', temp_table_name);
        
        -- Rollback any changes (if this is part of a larger transaction)
        RAISE EXCEPTION 'Data validation failed. % invalid records found', 
                       validation_errors;
    END IF;
    
    -- Move data from temp to main table
    EXECUTE format('INSERT INTO %I SELECT * FROM %I', 
                  table_name, temp_table_name);
    
    -- Clean up temporary table
    EXECUTE format('DROP TABLE %I', temp_table_name);
    
    RETURN format('Successfully imported % records', import_count);
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ensure cleanup even on error
        BEGIN
            EXECUTE format('DROP TABLE IF EXISTS %I', temp_table_name);
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore cleanup errors
                NULL;
        END;
        
        -- Re-raise the original error
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Usage with automatic rollback on error
BEGIN;
    SELECT import_data_with_cleanup('/path/to/employees.csv', 'employees');
COMMIT;
```

## Monitoring Rollback Operations

### 1. Track Rollback Statistics

```sql
-- Monitor rollback frequency
SELECT 
    datname,
    xact_commit,
    xact_rollback,
    xact_commit + xact_rollback as total_transactions,
    ROUND(
        100.0 * xact_rollback / NULLIF(xact_commit + xact_rollback, 0), 
        2
    ) as rollback_percentage
FROM pg_stat_database 
WHERE datname = current_database();

-- Track rollback patterns over time
WITH rollback_stats AS (
    SELECT 
        datname,
        xact_rollback,
        stats_reset,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - stats_reset)) / 3600 as hours_since_reset
    FROM pg_stat_database 
    WHERE datname = current_database()
)
SELECT 
    datname,
    xact_rollback,
    ROUND(xact_rollback / hours_since_reset, 2) as rollbacks_per_hour
FROM rollback_stats;
```

### 2. Identify Problematic Transactions

```sql
-- Create table to log rollback reasons
CREATE TABLE IF NOT EXISTS rollback_log (
    log_id SERIAL PRIMARY KEY,
    session_pid INTEGER,
    username VARCHAR(100),
    operation_type VARCHAR(50),
    rollback_reason TEXT,
    rollback_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_duration INTERVAL
);

-- Function to log rollbacks
CREATE OR REPLACE FUNCTION log_rollback(
    operation_type TEXT,
    rollback_reason TEXT,
    transaction_start TIMESTAMP DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO rollback_log (
        session_pid,
        username,
        operation_type,
        rollback_reason,
        transaction_duration
    ) VALUES (
        pg_backend_pid(),
        current_user,
        operation_type,
        rollback_reason,
        CASE 
            WHEN transaction_start IS NOT NULL 
            THEN CURRENT_TIMESTAMP - transaction_start
            ELSE NULL 
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Usage in functions that might rollback
CREATE OR REPLACE FUNCTION risky_operation() RETURNS TEXT AS $$
DECLARE
    start_time TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- Risky operations here
    IF random() < 0.3 THEN  -- 30% chance of failure
        PERFORM log_rollback('risky_operation', 'Random failure simulation', start_time);
        RAISE EXCEPTION 'Simulated failure';
    END IF;
    
    RETURN 'Operation succeeded';
    
EXCEPTION
    WHEN OTHERS THEN
        PERFORM log_rollback('risky_operation', SQLERRM, start_time);
        RAISE;
END;
$$ LANGUAGE plpgsql;
```

## Best Practices for ROLLBACK

### 1. When to Rollback

```sql
-- Good reasons to rollback:
-- 1. Data validation failures
-- 2. Business rule violations  
-- 3. Constraint violations
-- 4. User cancellation
-- 5. External system failures
-- 6. Resource limitations

-- Example of appropriate rollback scenarios
CREATE OR REPLACE FUNCTION appropriate_rollback_example() RETURNS TEXT AS $$
BEGIN
    -- Scenario 1: Data validation
    IF NOT validate_input_data() THEN
        ROLLBACK;
        RETURN 'Invalid input data';
    END IF;
    
    -- Scenario 2: Business rules
    IF violates_business_rules() THEN
        ROLLBACK;
        RETURN 'Business rule violation';
    END IF;
    
    -- Scenario 3: Resource constraints
    IF exceeds_resource_limits() THEN
        ROLLBACK;
        RETURN 'Resource limits exceeded';
    END IF;
    
    -- Continue with operation if all checks pass
    RETURN 'Operation completed';
END;
$$ LANGUAGE plpgsql;
```

### 2. Rollback Timing

```sql
-- Good: Rollback immediately when problems are detected
BEGIN;
    INSERT INTO orders (customer_id) VALUES (123);
    
    -- Check constraint immediately
    IF constraint_violation_detected() THEN
        ROLLBACK; -- Immediate rollback
        SELECT 'Order failed validation' AS result;
    ELSE
        UPDATE inventory SET quantity = quantity - 1;
        COMMIT;
        SELECT 'Order processed successfully' AS result;
    END IF;

-- Avoid: Delaying rollback unnecessarily
-- Don't continue processing if you know the transaction should fail
```

### 3. Error Communication

```sql
-- Good: Clear error messages and logging
CREATE OR REPLACE FUNCTION transfer_with_clear_errors(
    from_account VARCHAR(10),
    to_account VARCHAR(10), 
    amount DECIMAL(15,2)
) RETURNS TEXT AS $$
DECLARE
    error_msg TEXT;
BEGIN
    -- Validate and provide specific error messages
    IF amount <= 0 THEN
        error_msg := format('Invalid amount: %s. Amount must be positive.', amount);
        INSERT INTO error_log (operation, error_message) VALUES ('transfer', error_msg);
        RETURN error_msg;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM accounts WHERE account_id = from_account) THEN
        error_msg := format('Source account %s not found.', from_account);
        INSERT INTO error_log (operation, error_message) VALUES ('transfer', error_msg);
        RETURN error_msg;
    END IF;
    
    -- Continue with clear success/failure reporting
    -- ... rest of transfer logic
    
    RETURN 'Transfer completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        error_msg := format('Transfer failed: %s', SQLERRM);
        INSERT INTO error_log (operation, error_message) VALUES ('transfer', error_msg);
        RETURN error_msg;
END;
$$ LANGUAGE plpgsql;
```

## Summary

Rolling back transactions in PostgreSQL involves several key concepts:

**Basic Commands:**
- `ROLLBACK;` - Standard way to rollback a transaction
- `ROLLBACK TRANSACTION;` - Full SQL standard syntax  
- `ABORT;` - PostgreSQL-specific alternative

**Rollback Scenarios:**
- **Error Conditions**: Data validation failures, constraint violations
- **Business Logic**: Rule violations, resource limits exceeded
- **User Actions**: Cancellation, timeout scenarios
- **System Issues**: External service failures, resource exhaustion

**Partial Rollback:**
- **Savepoints**: `ROLLBACK TO SAVEPOINT name` for granular control
- **Nested Operations**: Complex workflows with multiple rollback points
- **Error Recovery**: Continuing after partial failures

**Automatic Rollback:**
- **Exceptions**: Unhandled errors trigger automatic rollback
- **Constraint Violations**: Integrity constraints cause automatic rollback
- **Function Failures**: PL/pgSQL functions rollback on exceptions

**Best Practices:**
- Rollback immediately when problems are detected
- Use savepoints for complex, multi-step operations
- Provide clear error messages and logging
- Clean up resources even during rollback scenarios
- Monitor rollback frequency to identify systemic issues

**Advanced Patterns:**
- Conditional rollback based on business rules
- Cleanup operations during rollback
- Logging and monitoring rollback events
- Application-level transaction management

Proper rollback handling is essential for maintaining data integrity, providing good user experience, and building robust database applications that can gracefully handle error conditions.