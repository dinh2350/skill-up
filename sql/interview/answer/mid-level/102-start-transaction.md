# 102. How do you start a transaction?

## Basic Syntax

PostgreSQL provides multiple ways to start a transaction:

### 1. BEGIN Statement

```sql
-- Most common way to start a transaction
BEGIN;
    -- Your SQL statements here
    INSERT INTO customers (name, email) VALUES ('John Doe', 'john@email.com');
    UPDATE orders SET status = 'processing' WHERE order_id = 123;
COMMIT; -- or ROLLBACK;
```

### 2. START TRANSACTION Statement

```sql
-- SQL standard syntax (equivalent to BEGIN)
START TRANSACTION;
    -- Your SQL statements here
    DELETE FROM temp_data WHERE created_at < CURRENT_DATE - INTERVAL '7 days';
COMMIT;
```

### 3. BEGIN TRANSACTION (Full Syntax)

```sql
-- Explicit transaction keyword
BEGIN TRANSACTION;
    -- Your SQL statements here
    INSERT INTO logs (message, timestamp) VALUES ('Process started', NOW());
COMMIT TRANSACTION;
```

## Transaction Modes and Options

### Setting Isolation Level

```sql
-- Set isolation level when starting transaction
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
    -- Default isolation level - each statement sees latest committed data
    SELECT balance FROM accounts WHERE account_id = 'A001';
COMMIT;

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    -- Consistent snapshot for entire transaction
    SELECT COUNT(*) FROM orders WHERE status = 'pending';
    -- Even if other transactions modify data, count remains consistent
    SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- Same result
COMMIT;

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    -- Strongest isolation - transactions appear to run serially
    UPDATE accounts SET balance = balance - 100 WHERE account_id = 'A001';
    UPDATE accounts SET balance = balance + 100 WHERE account_id = 'A002';
COMMIT;
```

### Read-Only Transactions

```sql
-- Start read-only transaction (performance optimization)
BEGIN TRANSACTION READ ONLY;
    -- Only SELECT statements allowed
    SELECT customer_id, name, email FROM customers;
    SELECT order_id, total_amount FROM orders;
    -- INSERT, UPDATE, DELETE will cause error
COMMIT;

-- Read-write transaction (default)
BEGIN TRANSACTION READ WRITE;
    -- All operations allowed
    INSERT INTO customers (name) VALUES ('Jane Smith');
    UPDATE customers SET email = 'jane@email.com' WHERE name = 'Jane Smith';
COMMIT;
```

### Deferrable Transactions

```sql
-- Serializable, read-only, deferrable transaction
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE;
    -- For long-running reports that can wait for a consistent snapshot
    SELECT 
        DATE(created_at) as order_date,
        COUNT(*) as order_count,
        SUM(total_amount) as daily_total
    FROM orders 
    GROUP BY DATE(created_at)
    ORDER BY order_date;
COMMIT;
```

## Autocommit vs Explicit Transactions

### Understanding Autocommit

```sql
-- PostgreSQL has autocommit enabled by default
-- Each statement is automatically wrapped in its own transaction

-- This single statement is automatically committed:
INSERT INTO customers (name, email) VALUES ('Auto Commit', 'auto@email.com');
-- Equivalent to:
-- BEGIN;
-- INSERT INTO customers (name, email) VALUES ('Auto Commit', 'auto@email.com');
-- COMMIT;

-- Check autocommit status in psql
\echo :AUTOCOMMIT

-- Disable autocommit in psql
\set AUTOCOMMIT off

-- Now you must explicitly start and commit transactions
INSERT INTO customers (name, email) VALUES ('Manual Commit', 'manual@email.com');
-- Statement executed but not committed!
COMMIT; -- Now it's committed

-- Re-enable autocommit
\set AUTOCOMMIT on
```

### Application-Level Transaction Control

```sql
-- In application code, you typically control transactions explicitly

-- Python example with psycopg2:
-- conn = psycopg2.connect("dbname=mydb")
-- conn.autocommit = False  # Disable autocommit
-- 
-- cursor = conn.cursor()
-- cursor.execute("BEGIN")
-- cursor.execute("INSERT INTO customers ...")
-- cursor.execute("UPDATE orders ...")
-- conn.commit()  # or conn.rollback()

-- Node.js example with pg:
-- const client = new Client()
-- await client.connect()
-- await client.query('BEGIN')
-- try {
--   await client.query('INSERT INTO customers ...')
--   await client.query('UPDATE orders ...')
--   await client.query('COMMIT')
-- } catch (e) {
--   await client.query('ROLLBACK')
-- }
```

## Complete Transaction Syntax Examples

### Example 1: Simple Transaction

```sql
-- Basic transaction for related operations
BEGIN;
    -- Create customer
    INSERT INTO customers (name, email, phone) 
    VALUES ('Alice Johnson', 'alice@company.com', '+1-555-0123')
    RETURNING customer_id; -- Returns 456
    
    -- Create their first order
    INSERT INTO orders (customer_id, order_date, status) 
    VALUES (456, CURRENT_DATE, 'pending');
    
    -- Update customer statistics
    UPDATE customer_stats 
    SET total_customers = total_customers + 1,
        last_signup = CURRENT_TIMESTAMP;
COMMIT;
```

### Example 2: Transaction with Error Handling

```sql
-- Transaction with explicit error handling
BEGIN;
    -- Attempt to transfer money
    UPDATE accounts 
    SET balance = balance - 1000 
    WHERE account_id = 'A001' AND balance >= 1000;
    
    -- Check if update affected any rows
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        -- Insufficient funds or account doesn't exist
        ROLLBACK;
        SELECT 'Transfer failed: insufficient funds or invalid account' AS result;
    ELSE
        -- Proceed with credit to destination account
        UPDATE accounts 
        SET balance = balance + 1000 
        WHERE account_id = 'A002';
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        
        IF affected_rows = 0 THEN
            -- Destination account doesn't exist
            ROLLBACK;
            SELECT 'Transfer failed: destination account not found' AS result;
        ELSE
            -- Success
            COMMIT;
            SELECT 'Transfer completed successfully' AS result;
        END IF;
    END IF;
```

### Example 3: Transaction with Multiple Isolation Levels

```sql
-- Different transactions for different use cases

-- 1. Financial transaction - requires SERIALIZABLE
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    -- Critical financial operations
    UPDATE accounts SET balance = balance - 5000 WHERE account_id = 'A001';
    UPDATE accounts SET balance = balance + 5000 WHERE account_id = 'A002';
    
    -- Log the transaction
    INSERT INTO transaction_log (from_account, to_account, amount, timestamp)
    VALUES ('A001', 'A002', 5000, CURRENT_TIMESTAMP);
COMMIT;

-- 2. Reporting query - READ COMMITTED is sufficient
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ ONLY;
    -- Generate daily report
    SELECT 
        DATE(order_date) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as daily_revenue
    FROM orders 
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(order_date)
    ORDER BY date;
COMMIT;

-- 3. Bulk data processing - REPEATABLE READ for consistency
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    -- Process all pending orders with consistent view
    UPDATE orders 
    SET status = 'processing' 
    WHERE status = 'pending' AND created_at <= CURRENT_TIMESTAMP - INTERVAL '1 hour';
    
    -- Update inventory based on processed orders
    UPDATE inventory i
    SET quantity = quantity - oi.total_quantity
    FROM (
        SELECT 
            product_id, 
            SUM(quantity) as total_quantity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status = 'processing' 
        GROUP BY product_id
    ) oi
    WHERE i.product_id = oi.product_id;
COMMIT;
```

## Transaction Best Practices

### 1. Start Transactions Close to When Needed

```sql
-- Good: Start transaction right before database operations
-- Application logic here...
-- Validation logic here...

BEGIN;
    -- Database operations only
    INSERT INTO orders (...) VALUES (...);
    UPDATE inventory (...);
    INSERT INTO order_items (...) VALUES (...);
COMMIT;

-- More application logic here...

-- Bad: Long-running transaction
BEGIN;
    INSERT INTO orders (...) VALUES (...);
    
    -- Long external API call here (holds locks!)
    -- Complex calculations here...
    -- User input waiting here...
    
    UPDATE inventory (...);
COMMIT;
```

### 2. Use Appropriate Transaction Scope

```sql
-- Good: Logical unit of work
BEGIN;
    -- All related operations for order creation
    INSERT INTO orders (customer_id, total) VALUES (123, 299.99);
    INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 456, 2);
    UPDATE products SET quantity = quantity - 2 WHERE product_id = 456;
    UPDATE customers SET total_orders = total_orders + 1 WHERE customer_id = 123;
COMMIT;

-- Bad: Unrelated operations in same transaction
BEGIN;
    INSERT INTO orders (...) VALUES (...);      -- Order creation
    UPDATE user_preferences (...);              -- Unrelated user setting
    DELETE FROM temp_logs WHERE (...);          -- Cleanup operation
COMMIT;
```

### 3. Handle Connection and Transaction State

```sql
-- Always ensure transactions are properly closed

-- Method 1: Explicit transaction handling
BEGIN;
    -- Your operations
    INSERT INTO customers (...) VALUES (...);
    
    -- Check for errors and commit/rollback appropriately
    IF no_errors THEN
        COMMIT;
    ELSE
        ROLLBACK;
    END IF;

-- Method 2: Using exception handling in stored procedures
CREATE OR REPLACE FUNCTION safe_customer_creation(
    p_name TEXT,
    p_email TEXT
) RETURNS INTEGER AS $$
DECLARE
    new_customer_id INTEGER;
BEGIN
    -- Function automatically runs in transaction context
    
    INSERT INTO customers (name, email) 
    VALUES (p_name, p_email)
    RETURNING customer_id INTO new_customer_id;
    
    -- Additional operations...
    UPDATE customer_stats SET total_customers = total_customers + 1;
    
    RETURN new_customer_id;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Customer with email % already exists', p_email;
    WHEN OTHERS THEN
        -- Log error
        INSERT INTO error_log (error_message, error_time) 
        VALUES (SQLERRM, CURRENT_TIMESTAMP);
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Usage (function handles transaction automatically)
SELECT safe_customer_creation('John Doe', 'john@email.com');
```

## Advanced Transaction Patterns

### 1. Nested Transactions with Savepoints

```sql
BEGIN;
    INSERT INTO customers (name, email) VALUES ('Customer 1', 'c1@email.com');
    
    SAVEPOINT sp1;
        INSERT INTO orders (customer_id, total) VALUES (1, 100);
        
        SAVEPOINT sp2;
            UPDATE inventory SET quantity = quantity - 5 WHERE product_id = 1;
            -- Error occurs here
            ROLLBACK TO SAVEPOINT sp2; -- Only rollback inventory update
        
        -- Order insert is still active
        INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 1, 5);
    
    -- Commit customer and order, but not the failed inventory update
COMMIT;
```

### 2. Transaction with Advisory Locks

```sql
-- Use advisory locks for application-level coordination
BEGIN;
    -- Acquire advisory lock for specific resource
    SELECT pg_advisory_lock(12345);
    
    -- Critical section - only one transaction can proceed
    SELECT balance FROM accounts WHERE account_id = 'A001';
    
    -- Complex business logic that needs coordination
    UPDATE accounts SET balance = balance - 100 WHERE account_id = 'A001';
    
    -- Lock is automatically released at transaction end
COMMIT;

-- Alternative: Try lock (non-blocking)
BEGIN;
    -- Try to acquire lock, return immediately if not available
    IF pg_try_advisory_lock(12345) THEN
        -- Proceed with critical operations
        UPDATE shared_resource SET status = 'processing';
        
        -- Do work...
        
        -- Explicitly release lock
        SELECT pg_advisory_unlock(12345);
    ELSE
        -- Could not acquire lock, handle accordingly
        RAISE NOTICE 'Resource is busy, try again later';
    END IF;
COMMIT;
```

### 3. Two-Phase Commit (Distributed Transactions)

```sql
-- Prepare transaction for two-phase commit
BEGIN;
    INSERT INTO customers (name, email) VALUES ('2PC Customer', '2pc@email.com');
    UPDATE accounts SET balance = balance - 100 WHERE account_id = 'A001';
    
-- Prepare the transaction (Phase 1)
PREPARE TRANSACTION 'customer_and_payment_tx_001';

-- Later, after coordinating with other systems:
-- Phase 2a: Commit
COMMIT PREPARED 'customer_and_payment_tx_001';

-- Or Phase 2b: Rollback
-- ROLLBACK PREPARED 'customer_and_payment_tx_001';

-- View prepared transactions
SELECT * FROM pg_prepared_xacts;
```

## Monitoring Transaction Startup and State

### 1. View Transaction Information

```sql
-- Check current transaction state
SELECT 
    txid_current() AS current_transaction_id,
    txid_current_if_assigned() AS assigned_transaction_id,
    pg_backend_pid() AS backend_process_id;

-- View active transactions with start times
SELECT 
    pid,
    usename,
    application_name,
    state,
    xact_start,
    CURRENT_TIMESTAMP - xact_start AS transaction_age,
    query
FROM pg_stat_activity 
WHERE xact_start IS NOT NULL
ORDER BY xact_start;
```

### 2. Transaction Statistics

```sql
-- Database-level transaction statistics
SELECT 
    datname,
    xact_commit,
    xact_rollback,
    xact_commit + xact_rollback AS total_transactions,
    ROUND(100.0 * xact_commit / (xact_commit + xact_rollback), 2) AS commit_ratio
FROM pg_stat_database 
WHERE datname = current_database();

-- Transaction rate over time
SELECT 
    datname,
    xact_commit,
    xact_rollback,
    stats_reset,
    ROUND(xact_commit / EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - stats_reset)) * 3600, 2) AS commits_per_hour
FROM pg_stat_database 
WHERE datname = current_database();
```

## Common Transaction Startup Patterns

### 1. Simple Application Pattern

```sql
-- Typical application transaction pattern
BEGIN;
    -- Single logical operation
    INSERT INTO orders (customer_id, total_amount, status) 
    VALUES (123, 299.99, 'pending')
    RETURNING order_id; -- Get the new order ID for immediate use
COMMIT;
```

### 2. Batch Processing Pattern

```sql
-- Process records in transaction batches
DO $$
DECLARE
    batch_size INTEGER := 1000;
    offset_value INTEGER := 0;
    rows_processed INTEGER;
BEGIN
    LOOP
        BEGIN; -- Start new transaction for each batch
            UPDATE large_table 
            SET processed = true 
            WHERE id BETWEEN offset_value AND offset_value + batch_size - 1
                AND processed = false;
            
            GET DIAGNOSTICS rows_processed = ROW_COUNT;
            
        COMMIT; -- Commit this batch
        
        -- Exit if no more rows to process
        EXIT WHEN rows_processed = 0;
        
        offset_value := offset_value + batch_size;
        
        -- Optional: Brief pause between batches
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;
```

### 3. Error Recovery Pattern

```sql
-- Robust transaction with retry logic
CREATE OR REPLACE FUNCTION process_with_retry(max_attempts INTEGER DEFAULT 3)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER := 0;
    success BOOLEAN := FALSE;
BEGIN
    WHILE attempt_count < max_attempts AND NOT success LOOP
        attempt_count := attempt_count + 1;
        
        BEGIN
            -- Start transaction
            BEGIN;
                -- Critical operations
                UPDATE accounts SET balance = balance - 100 WHERE account_id = 'A001';
                UPDATE accounts SET balance = balance + 100 WHERE account_id = 'A002';
                
                -- Log successful transaction
                INSERT INTO transaction_log (operation, attempt, success_time)
                VALUES ('transfer', attempt_count, CURRENT_TIMESTAMP);
                
            COMMIT;
            success := TRUE;
            
        EXCEPTION
            WHEN serialization_failure OR deadlock_detected THEN
                -- Retry on concurrency conflicts
                ROLLBACK;
                RAISE NOTICE 'Attempt % failed due to concurrency conflict, retrying...', attempt_count;
                PERFORM pg_sleep(random() * 0.1); -- Random delay
                
            WHEN OTHERS THEN
                -- Don't retry on other errors
                ROLLBACK;
                RAISE;
        END;
    END LOOP;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT process_with_retry(3);
```

## Summary

Starting transactions in PostgreSQL involves several methods and considerations:

**Basic Commands**:
- `BEGIN;` - Most common way to start a transaction
- `START TRANSACTION;` - SQL standard equivalent
- `BEGIN TRANSACTION;` - Explicit syntax

**Transaction Options**:
- **Isolation Levels**: READ COMMITTED (default), REPEATABLE READ, SERIALIZABLE
- **Access Mode**: READ WRITE (default), READ ONLY
- **Deferrable**: For serializable read-only transactions

**Key Concepts**:
- **Autocommit**: PostgreSQL's default behavior (each statement auto-commits)
- **Explicit Control**: Required for multi-statement transactions
- **Error Handling**: Always plan for COMMIT or ROLLBACK

**Best Practices**:
- Start transactions as late as possible
- Keep transaction scope focused and logical
- Handle errors appropriately
- Use appropriate isolation levels
- Monitor transaction duration and performance

**Advanced Patterns**:
- Savepoints for nested rollbacks
- Advisory locks for coordination
- Batch processing with transaction boundaries
- Error recovery with retry logic

Proper transaction management is crucial for maintaining data integrity and achieving optimal performance in database applications.