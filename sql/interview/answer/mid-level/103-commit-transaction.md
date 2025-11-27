# 103. How do you commit a transaction?

## Basic Syntax

PostgreSQL provides multiple ways to commit a transaction:

### 1. COMMIT Statement

```sql
-- Most common way to commit a transaction
BEGIN;
    INSERT INTO customers (name, email) VALUES ('John Doe', 'john@email.com');
    UPDATE accounts SET balance = balance - 100 WHERE customer_id = 123;
COMMIT; -- Makes all changes permanent and visible to other transactions
```

### 2. COMMIT TRANSACTION (Full Syntax)

```sql
-- Explicit transaction keyword (equivalent to COMMIT)
BEGIN TRANSACTION;
    INSERT INTO orders (customer_id, total) VALUES (123, 299.99);
    UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 456;
COMMIT TRANSACTION; -- Full SQL standard syntax
```

### 3. END Statement

```sql
-- Alternative to COMMIT (PostgreSQL-specific)
BEGIN;
    DELETE FROM temp_data WHERE created_at < CURRENT_DATE - INTERVAL '7 days';
END; -- Equivalent to COMMIT
```

## What Happens During COMMIT

### 1. Write-Ahead Logging (WAL)

```sql
-- When you commit, PostgreSQL:
-- 1. Writes all changes to Write-Ahead Log (WAL)
-- 2. Forces WAL to disk storage (fsync)
-- 3. Marks transaction as committed
-- 4. Makes changes visible to other transactions

BEGIN;
    INSERT INTO orders (customer_id, total_amount) 
    VALUES (123, 500.00); -- Changes are in memory and WAL
    
    UPDATE customers SET last_order_date = CURRENT_DATE 
    WHERE customer_id = 123; -- More changes to WAL
    
COMMIT; -- WAL is flushed to disk, changes become durable and visible

-- At this point:
-- - Changes are permanently stored
-- - Other transactions can see the new data
-- - Transaction locks are released
```

### 2. Visibility and Isolation

```sql
-- Demonstrate commit visibility across sessions

-- Session A:
BEGIN;
    INSERT INTO products (name, price) VALUES ('New Product', 99.99);
    -- Other sessions cannot see this row yet
    SELECT COUNT(*) FROM products; -- Shows new count only to this session

-- Session B (running concurrently):
SELECT COUNT(*) FROM products; -- Shows old count (isolation)

-- Back to Session A:
COMMIT; -- Changes become visible to all sessions

-- Session B can now see the changes:
SELECT COUNT(*) FROM products; -- Shows new count including the inserted product
```

## Practical COMMIT Examples

### Example 1: E-commerce Order Processing

```sql
-- Complete order transaction with commit
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    account_balance DECIMAL(10,2)
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2),
    stock_quantity INTEGER
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    total_amount DECIMAL(10,2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER,
    unit_price DECIMAL(10,2)
);

-- Process order with proper commit
BEGIN;
    -- 1. Create the order
    INSERT INTO orders (customer_id, total_amount)
    VALUES (1, 199.98)
    RETURNING order_id; -- Assume this returns 100
    
    -- 2. Add order items
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES 
        (100, 1, 2, 49.99),
        (100, 2, 1, 99.99);
    
    -- 3. Update inventory
    UPDATE products 
    SET stock_quantity = stock_quantity - 2 
    WHERE product_id = 1;
    
    UPDATE products 
    SET stock_quantity = stock_quantity - 1 
    WHERE product_id = 2;
    
    -- 4. Update customer balance (if using store credit)
    UPDATE customers 
    SET account_balance = account_balance - 199.98 
    WHERE customer_id = 1;
    
    -- 5. Update order status
    UPDATE orders 
    SET status = 'confirmed' 
    WHERE order_id = 100;

-- All operations succeed together - commit makes them permanent
COMMIT;

-- Verify the committed changes
SELECT 
    o.order_id,
    o.total_amount,
    o.status,
    c.name,
    c.account_balance,
    COUNT(oi.item_id) as item_count
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.order_id = 100
GROUP BY o.order_id, o.total_amount, o.status, c.name, c.account_balance;
```

### Example 2: Bank Account Transfer

```sql
-- Secure money transfer with commit
CREATE TABLE accounts (
    account_id VARCHAR(10) PRIMARY KEY,
    account_holder VARCHAR(100),
    balance DECIMAL(15,2),
    last_transaction TIMESTAMP
);

-- Insert test data
INSERT INTO accounts VALUES 
    ('A001', 'Alice Johnson', 5000.00, CURRENT_TIMESTAMP),
    ('A002', 'Bob Smith', 2000.00, CURRENT_TIMESTAMP);

-- Transfer $1000 from A001 to A002
BEGIN;
    -- Validate source account has sufficient funds
    DO $$
    DECLARE
        source_balance DECIMAL(15,2);
    BEGIN
        SELECT balance INTO source_balance 
        FROM accounts 
        WHERE account_id = 'A001';
        
        IF source_balance < 1000 THEN
            RAISE EXCEPTION 'Insufficient funds. Available: %, Required: %', 
                           source_balance, 1000;
        END IF;
    END $$;
    
    -- Perform the transfer
    UPDATE accounts 
    SET balance = balance - 1000,
        last_transaction = CURRENT_TIMESTAMP
    WHERE account_id = 'A001';
    
    UPDATE accounts 
    SET balance = balance + 1000,
        last_transaction = CURRENT_TIMESTAMP
    WHERE account_id = 'A002';
    
    -- Log the transaction
    INSERT INTO transaction_log (
        from_account, to_account, amount, 
        transaction_date, transaction_type
    ) VALUES (
        'A001', 'A002', 1000,
        CURRENT_TIMESTAMP, 'TRANSFER'
    );

-- Commit makes the transfer permanent and atomic
COMMIT;

-- Verify the transfer
SELECT 
    account_id,
    account_holder,
    balance,
    last_transaction
FROM accounts 
WHERE account_id IN ('A001', 'A002')
ORDER BY account_id;
```

### Example 3: Batch Data Processing

```sql
-- Process batch of records with commit
CREATE TABLE raw_data (
    id SERIAL PRIMARY KEY,
    data_value VARCHAR(255),
    processed BOOLEAN DEFAULT FALSE
);

CREATE TABLE processed_data (
    id SERIAL PRIMARY KEY,
    original_id INTEGER,
    processed_value VARCHAR(255),
    processing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test data
INSERT INTO raw_data (data_value) 
SELECT 'Raw data ' || generate_series(1, 1000);

-- Batch processing with periodic commits
DO $$
DECLARE
    batch_size INTEGER := 100;
    processed_count INTEGER := 0;
    total_processed INTEGER := 0;
BEGIN
    LOOP
        -- Start new transaction for each batch
        -- Process batch of unprocessed records
        WITH batch AS (
            SELECT id, data_value
            FROM raw_data 
            WHERE NOT processed
            ORDER BY id
            LIMIT batch_size
            FOR UPDATE
        )
        INSERT INTO processed_data (original_id, processed_value)
        SELECT 
            id, 
            'PROCESSED: ' || UPPER(data_value)
        FROM batch;
        
        -- Mark records as processed
        UPDATE raw_data 
        SET processed = TRUE
        WHERE id IN (
            SELECT id 
            FROM raw_data 
            WHERE NOT processed
            ORDER BY id
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS processed_count = ROW_COUNT;
        total_processed := total_processed + processed_count;
        
        -- Commit this batch
        COMMIT;
        
        -- Log progress
        RAISE NOTICE 'Processed batch of % records. Total: %', 
                     processed_count, total_processed;
        
        -- Exit when no more records to process
        EXIT WHEN processed_count = 0;
        
        -- Start new transaction for next batch
        BEGIN;
    END LOOP;
END $$;

-- Verify processing results
SELECT 
    COUNT(*) as total_raw,
    SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processed_count,
    (SELECT COUNT(*) FROM processed_data) as output_records
FROM raw_data;
```

## COMMIT with Different Transaction Modes

### 1. Read-Only Transaction Commit

```sql
-- Read-only transactions still need to be committed
BEGIN TRANSACTION READ ONLY;
    -- Generate report data
    SELECT 
        DATE(order_date) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as daily_revenue
    FROM orders 
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(order_date)
    ORDER BY date;
    
    -- Even though no data was modified, commit releases resources
COMMIT;
```

### 2. Serializable Transaction Commit

```sql
-- High isolation level transaction
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    -- Critical financial calculation that needs full isolation
    SELECT SUM(balance) as total_balance FROM accounts;
    
    -- Complex multi-table update that must be consistent
    UPDATE accounts 
    SET balance = balance * 1.02  -- 2% interest
    WHERE account_type = 'savings';
    
    UPDATE account_stats 
    SET last_interest_date = CURRENT_DATE,
        total_interest_paid = total_interest_paid + 
            (SELECT SUM(balance * 0.02) FROM accounts WHERE account_type = 'savings');

-- Commit ensures serializable consistency
COMMIT;
```

## Conditional COMMIT Patterns

### 1. Commit with Validation

```sql
-- Commit only if validation passes
CREATE OR REPLACE FUNCTION process_order_with_validation(
    p_customer_id INTEGER,
    p_product_id INTEGER,
    p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    available_stock INTEGER;
    customer_credit DECIMAL(10,2);
    product_price DECIMAL(10,2);
    total_cost DECIMAL(10,2);
BEGIN
    -- Get product details
    SELECT stock_quantity, price 
    INTO available_stock, product_price
    FROM products 
    WHERE product_id = p_product_id;
    
    -- Calculate total cost
    total_cost := product_price * p_quantity;
    
    -- Get customer credit
    SELECT account_balance 
    INTO customer_credit
    FROM customers 
    WHERE customer_id = p_customer_id;
    
    -- Validation checks
    IF available_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
                       available_stock, p_quantity;
    END IF;
    
    IF customer_credit < total_cost THEN
        RAISE EXCEPTION 'Insufficient credit. Available: %, Required: %', 
                       customer_credit, total_cost;
    END IF;
    
    -- All validations passed - process the order
    INSERT INTO orders (customer_id, total_amount)
    VALUES (p_customer_id, total_cost);
    
    UPDATE products 
    SET stock_quantity = stock_quantity - p_quantity
    WHERE product_id = p_product_id;
    
    UPDATE customers 
    SET account_balance = account_balance - total_cost
    WHERE customer_id = p_customer_id;
    
    -- Function commits automatically when it returns successfully
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Function rolls back automatically on exception
        RAISE NOTICE 'Order processing failed: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Usage - function handles commit/rollback internally
SELECT process_order_with_validation(1, 101, 5);
```

### 2. Commit with Business Logic Validation

```sql
-- Complex business rules validation before commit
BEGIN;
    -- Process payroll
    UPDATE employees 
    SET salary = salary * 1.05  -- 5% raise
    WHERE performance_rating >= 4.0 
        AND department = 'Engineering';
    
    -- Calculate total payroll impact
    WITH payroll_impact AS (
        SELECT 
            SUM(salary * 0.05) as total_raise,
            COUNT(*) as affected_employees
        FROM employees 
        WHERE performance_rating >= 4.0 
            AND department = 'Engineering'
    )
    SELECT 
        total_raise,
        affected_employees,
        CASE 
            WHEN total_raise > 50000 THEN 'REQUIRES_APPROVAL'
            ELSE 'AUTO_APPROVED'
        END as approval_status
    FROM payroll_impact;
    
    -- Conditional commit based on business rules
    DO $$
    DECLARE
        total_impact DECIMAL(12,2);
    BEGIN
        SELECT SUM(salary * 0.05) INTO total_impact
        FROM employees 
        WHERE performance_rating >= 4.0 
            AND department = 'Engineering';
            
        IF total_impact > 50000 THEN
            -- Log for manual approval
            INSERT INTO approval_queue (
                operation_type, 
                total_amount, 
                status, 
                submitted_date
            ) VALUES (
                'SALARY_INCREASE', 
                total_impact, 
                'PENDING_APPROVAL', 
                CURRENT_TIMESTAMP
            );
            
            RAISE NOTICE 'Salary increase requires approval. Amount: $%. Transaction logged for review.', total_impact;
            -- Don't commit yet - requires approval
            ROLLBACK;
        ELSE
            -- Auto-approve smaller increases
            INSERT INTO payroll_log (
                operation_type, 
                total_amount, 
                approved_by, 
                approved_date
            ) VALUES (
                'SALARY_INCREASE', 
                total_impact, 
                'SYSTEM_AUTO', 
                CURRENT_TIMESTAMP
            );
            
            RAISE NOTICE 'Salary increase auto-approved. Amount: $%', total_impact;
            COMMIT;
        END IF;
    END $$;
```

## COMMIT Performance Considerations

### 1. Synchronous vs Asynchronous Commit

```sql
-- Default: Synchronous commit (safer, slower)
BEGIN;
    INSERT INTO critical_data (value) VALUES ('Important data');
COMMIT; -- Waits for WAL to be written to disk

-- Asynchronous commit (faster, slight risk)
SET LOCAL synchronous_commit = off;
BEGIN;
    INSERT INTO log_data (message) VALUES ('Log entry');
COMMIT; -- Returns immediately, WAL written asynchronously

-- For high-throughput logging
SET synchronous_commit = off; -- For session
BEGIN;
    INSERT INTO audit_log (action, timestamp) VALUES ('USER_LOGIN', CURRENT_TIMESTAMP);
COMMIT; -- Much faster for bulk operations

-- Reset to default
SET synchronous_commit = on;
```

### 2. Batch Commits for Performance

```sql
-- Efficient batch processing with optimal commit frequency
CREATE OR REPLACE FUNCTION process_large_dataset()
RETURNS TABLE(batch_number INTEGER, records_processed INTEGER, processing_time INTERVAL) AS $$
DECLARE
    batch_size INTEGER := 1000;
    current_batch INTEGER := 1;
    start_time TIMESTAMP;
    processed_count INTEGER;
BEGIN
    LOOP
        start_time := CLOCK_TIMESTAMP();
        
        -- Process batch within transaction
        WITH batch_data AS (
            UPDATE raw_import_data 
            SET processed = TRUE,
                processed_date = CURRENT_TIMESTAMP
            WHERE NOT processed
                AND id BETWEEN (current_batch - 1) * batch_size + 1 
                           AND current_batch * batch_size
            RETURNING id, data_value
        )
        INSERT INTO processed_import_data (original_id, processed_value)
        SELECT id, UPPER(data_value) FROM batch_data;
        
        GET DIAGNOSTICS processed_count = ROW_COUNT;
        
        -- Commit this batch
        COMMIT;
        
        -- Return batch statistics
        RETURN QUERY SELECT 
            current_batch,
            processed_count,
            CLOCK_TIMESTAMP() - start_time;
            
        -- Exit if no more data
        EXIT WHEN processed_count = 0;
        
        current_batch := current_batch + 1;
        
        -- Start next transaction
        BEGIN;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Process with progress tracking
SELECT * FROM process_large_dataset();
```

## Monitoring and Troubleshooting COMMIT

### 1. Monitor Commit Performance

```sql
-- Check commit/rollback statistics
SELECT 
    datname,
    xact_commit,
    xact_rollback,
    xact_commit + xact_rollback as total_transactions,
    ROUND(
        100.0 * xact_commit / NULLIF(xact_commit + xact_rollback, 0), 
        2
    ) as commit_percentage
FROM pg_stat_database 
WHERE datname = current_database();

-- Monitor WAL activity
SELECT 
    pg_current_wal_lsn() as current_wal_position,
    pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0') / 1024 / 1024 as wal_mb_written;

-- Check transaction duration
SELECT 
    pid,
    usename,
    state,
    xact_start,
    CURRENT_TIMESTAMP - xact_start as transaction_duration,
    query
FROM pg_stat_activity 
WHERE xact_start IS NOT NULL
    AND state = 'idle in transaction'
ORDER BY transaction_duration DESC;
```

### 2. Identify Long-Running Transactions

```sql
-- Find transactions that might need attention
SELECT 
    pid,
    usename,
    application_name,
    state,
    xact_start,
    query_start,
    CURRENT_TIMESTAMP - xact_start as transaction_age,
    CURRENT_TIMESTAMP - query_start as query_age,
    LEFT(query, 100) as query_snippet
FROM pg_stat_activity 
WHERE xact_start IS NOT NULL
    AND CURRENT_TIMESTAMP - xact_start > INTERVAL '5 minutes'
ORDER BY transaction_age DESC;

-- Check for blocking transactions
WITH blocking_pids AS (
    SELECT DISTINCT blocking.pid as blocking_pid
    FROM pg_locks blocked 
    JOIN pg_locks blocking ON (
        blocking.locktype = blocked.locktype
        AND blocking.database = blocked.database  
        AND blocking.relation = blocked.relation
        AND blocking.page = blocked.page
        AND blocking.tuple = blocked.tuple
        AND blocking.virtualxid = blocked.virtualxid
        AND blocking.transactionid = blocked.transactionid
        AND blocking.classid = blocked.classid
        AND blocking.objid = blocked.objid
        AND blocking.objsubid = blocked.objsubid
        AND blocking.pid != blocked.pid
    )
    WHERE NOT blocked.granted
)
SELECT 
    a.pid,
    a.usename,
    a.query,
    a.xact_start,
    CURRENT_TIMESTAMP - a.xact_start as blocking_duration
FROM pg_stat_activity a
JOIN blocking_pids b ON a.pid = b.blocking_pid
ORDER BY blocking_duration DESC;
```

## Error Handling with COMMIT

### 1. Handling COMMIT Failures

```sql
-- Robust commit with error handling
CREATE OR REPLACE FUNCTION safe_data_operation()
RETURNS TEXT AS $$
DECLARE
    result_message TEXT;
BEGIN
    BEGIN
        -- Start transaction operations
        INSERT INTO sensitive_data (value) VALUES ('Critical data');
        UPDATE configuration SET last_update = CURRENT_TIMESTAMP;
        
        -- Attempt commit
        COMMIT;
        result_message := 'SUCCESS: Data operation completed';
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error
            INSERT INTO error_log (
                error_message, 
                error_time, 
                operation_context
            ) VALUES (
                SQLERRM, 
                CURRENT_TIMESTAMP, 
                'safe_data_operation'
            );
            
            -- Ensure rollback
            ROLLBACK;
            result_message := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;
```

### 2. Application-Level Commit Handling

```sql
-- Example of application commit patterns

-- Pattern 1: Explicit transaction control
-- BEGIN;
-- try {
--     executeSQL("INSERT INTO orders ...");
--     executeSQL("UPDATE inventory ...");
--     executeSQL("UPDATE customer_stats ...");
--     
--     connection.commit(); // Explicit commit
--     return "Order processed successfully";
-- } catch (SQLException e) {
--     connection.rollback(); // Explicit rollback
--     log.error("Order processing failed", e);
--     return "Order processing failed: " + e.getMessage();
-- }

-- Pattern 2: Auto-commit management
-- connection.setAutoCommit(false); // Start transaction mode
-- try {
--     // Multiple operations
--     statement.execute("INSERT ...");
--     statement.execute("UPDATE ...");
--     
--     connection.commit(); // Explicit commit
-- } catch (SQLException e) {
--     connection.rollback();
--     throw new BusinessException("Transaction failed", e);
-- } finally {
--     connection.setAutoCommit(true); // Restore auto-commit
-- }
```

## Best Practices for COMMIT

### 1. When to Commit

```sql
-- Good: Commit logical units of work
BEGIN;
    -- All operations for a single business transaction
    INSERT INTO orders (customer_id, total) VALUES (123, 299.99);
    UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 456;
    UPDATE customers SET last_order = CURRENT_DATE WHERE customer_id = 123;
COMMIT;

-- Avoid: Committing too frequently
-- Don't commit after every single operation unless necessary

-- Avoid: Committing too infrequently
-- Don't hold transactions open for extended periods
```

### 2. Commit Timing

```sql
-- Good: Commit promptly after completing logical work
BEGIN;
    -- Do database work
    INSERT INTO logs (message) VALUES ('Process completed');
COMMIT; -- Commit immediately

-- Additional non-database work can happen after commit
-- Complex calculations, external API calls, etc.

-- Bad: Long delays before commit
BEGIN;
    INSERT INTO orders (customer_id) VALUES (123);
    -- Long external API call here...
    -- Complex business logic here...
    -- User interaction here...
COMMIT; -- Commits too late, holding locks unnecessarily
```

## Summary

Committing transactions in PostgreSQL involves several key concepts:

**Basic Commands:**
- `COMMIT;` - Standard way to commit a transaction
- `COMMIT TRANSACTION;` - Full SQL standard syntax
- `END;` - PostgreSQL-specific alternative

**What COMMIT Does:**
- **Durability**: Writes changes to WAL and forces to disk
- **Visibility**: Makes changes visible to other transactions
- **Lock Release**: Frees all locks held by the transaction
- **Resource Cleanup**: Releases transaction-related resources

**Key Considerations:**
- **Performance**: Balance between commit frequency and transaction scope
- **Isolation**: Committed changes become immediately visible to others
- **Error Handling**: Always plan for commit success and failure scenarios
- **Monitoring**: Track commit rates and transaction durations

**Best Practices:**
- Commit logical units of work promptly
- Use appropriate transaction isolation levels
- Handle commit failures gracefully
- Monitor transaction performance and duration
- Use batch commits for large data operations
- Consider asynchronous commits for non-critical operations

**Common Patterns:**
- Simple business transactions
- Batch processing with periodic commits
- Conditional commits based on business rules
- Error recovery with rollback alternatives

Proper commit handling is essential for maintaining data integrity, ensuring good performance, and building reliable database applications.