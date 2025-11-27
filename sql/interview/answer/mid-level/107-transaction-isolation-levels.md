# 107. What are transaction isolation levels?

## Definition

Transaction isolation levels define the degree to which transactions are isolated from each other in a multi-user database environment. They control what data a transaction can see when other concurrent transactions are running, determining the balance between data consistency and system performance.

## ACID Properties and Isolation

### Isolation in ACID Context

Transaction isolation is the **"I"** in ACID properties:

- **Atomicity**: Transactions are all-or-nothing
- **Consistency**: Database remains in a valid state
- **Isolation**: Concurrent transactions don't interfere with each other
- **Durability**: Committed changes are permanent

```sql
-- Isolation ensures that concurrent transactions
-- appear to run in some sequential order
-- Transaction A
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;

-- Transaction B (running concurrently)
BEGIN;
    SELECT SUM(balance) FROM accounts; -- Should see consistent state
COMMIT;
```

### Concurrency Issues Without Proper Isolation

```sql
-- Example of problems without isolation
-- Session 1
BEGIN;
    UPDATE products SET quantity = 50 WHERE product_id = 1;
    -- Transaction not committed yet

-- Session 2 (without proper isolation)
BEGIN;
    SELECT quantity FROM products WHERE product_id = 1;
    -- Might see uncommitted value of 50 (dirty read)
    -- Or might see old value depending on isolation level
COMMIT;

-- Session 1
COMMIT; -- Now the change is permanent
```

## SQL Standard Isolation Levels

### 1. Read Uncommitted (Lowest Isolation)

**Characteristics:**
- Allows dirty reads
- Minimal locking
- Highest concurrency
- Lowest consistency

**Issues Allowed:**
- Dirty reads
- Non-repeatable reads
- Phantom reads

```sql
-- Example of Read Uncommitted
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN;
    -- Can read uncommitted data from other transactions
    SELECT balance FROM accounts WHERE account_id = 1;
    -- Might see value that gets rolled back later
COMMIT;
```

### 2. Read Committed (Default in PostgreSQL)

**Characteristics:**
- Prevents dirty reads
- Allows non-repeatable reads
- Good balance of consistency and performance

**Issues Prevented:**
- Dirty reads ✓

**Issues Allowed:**
- Non-repeatable reads
- Phantom reads

```sql
-- Example of Read Committed
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
    SELECT balance FROM accounts WHERE account_id = 1;
    -- Returns: 1000
    
    -- Another transaction commits a change to this account
    
    SELECT balance FROM accounts WHERE account_id = 1;
    -- Returns: 900 (non-repeatable read)
COMMIT;
```

### 3. Repeatable Read

**Characteristics:**
- Prevents dirty reads and non-repeatable reads
- Maintains consistent snapshot within transaction
- Higher isolation than Read Committed

**Issues Prevented:**
- Dirty reads ✓
- Non-repeatable reads ✓

**Issues Allowed:**
- Phantom reads (in SQL standard, but not in PostgreSQL)

```sql
-- Example of Repeatable Read
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
    SELECT balance FROM accounts WHERE account_id = 1;
    -- Returns: 1000
    
    -- Another transaction commits a change to this account
    
    SELECT balance FROM accounts WHERE account_id = 1;
    -- Still returns: 1000 (repeatable read guaranteed)
COMMIT;
```

### 4. Serializable (Highest Isolation)

**Characteristics:**
- Prevents all concurrency issues
- Transactions appear to run serially
- Highest consistency
- Potential for serialization failures

**Issues Prevented:**
- Dirty reads ✓
- Non-repeatable reads ✓
- Phantom reads ✓
- Serialization anomalies ✓

```sql
-- Example of Serializable
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
    SELECT SUM(balance) FROM accounts;
    -- Returns consistent snapshot
    
    -- Complex business logic here
    
    UPDATE accounts SET balance = balance * 1.01 WHERE balance > 1000;
    -- May fail with serialization error if conflicts detected
COMMIT;
```

## PostgreSQL Implementation Details

### MVCC and Isolation

PostgreSQL uses Multi-Version Concurrency Control (MVCC) to implement isolation:

```sql
-- MVCC ensures each transaction sees a consistent snapshot
-- Transaction 1
BEGIN ISOLATION LEVEL REPEATABLE READ;
    SELECT xmin, xmax, balance FROM accounts WHERE account_id = 1;
    -- xmin: transaction that created this version
    -- xmax: transaction that deleted this version (0 if current)

-- Transaction 2
BEGIN;
    UPDATE accounts SET balance = balance + 100 WHERE account_id = 1;
    -- Creates new version of the row
COMMIT;

-- Transaction 1 (continues)
    SELECT xmin, xmax, balance FROM accounts WHERE account_id = 1;
    -- Still sees original version due to MVCC
COMMIT;
```

### PostgreSQL-Specific Behavior

```sql
-- PostgreSQL's Repeatable Read is stronger than SQL standard
-- It prevents phantom reads as well

-- Session 1: Repeatable Read
BEGIN ISOLATION LEVEL REPEATABLE READ;
    SELECT COUNT(*) FROM orders WHERE customer_id = 123;
    -- Returns: 5

-- Session 2: Insert new order
BEGIN;
    INSERT INTO orders (customer_id, amount) VALUES (123, 100);
COMMIT;

-- Session 1: Check again
    SELECT COUNT(*) FROM orders WHERE customer_id = 123;
    -- Still returns: 5 (phantom reads prevented)
COMMIT;
```

## Practical Examples and Use Cases

### 1. Banking System Example

```sql
-- High consistency requirements - use Serializable
CREATE OR REPLACE FUNCTION transfer_funds_safe(
    from_account INTEGER,
    to_account INTEGER,
    amount DECIMAL(10,2)
) RETURNS TEXT AS $$
DECLARE
    from_balance DECIMAL(10,2);
    to_balance DECIMAL(10,2);
    retry_count INTEGER := 0;
    max_retries INTEGER := 3;
BEGIN
    LOOP
        BEGIN
            -- Use Serializable for critical financial operations
            SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
            
            -- Check balances
            SELECT balance INTO from_balance 
            FROM accounts 
            WHERE account_id = from_account FOR UPDATE;
            
            SELECT balance INTO to_balance 
            FROM accounts 
            WHERE account_id = to_account FOR UPDATE;
            
            -- Validate sufficient funds
            IF from_balance < amount THEN
                RETURN 'Insufficient funds';
            END IF;
            
            -- Perform transfer
            UPDATE accounts 
            SET balance = balance - amount,
                last_updated = CURRENT_TIMESTAMP
            WHERE account_id = from_account;
            
            UPDATE accounts 
            SET balance = balance + amount,
                last_updated = CURRENT_TIMESTAMP
            WHERE account_id = to_account;
            
            -- Log transaction
            INSERT INTO transaction_log (
                from_account, 
                to_account, 
                amount, 
                timestamp
            ) VALUES (
                from_account, 
                to_account, 
                amount, 
                CURRENT_TIMESTAMP
            );
            
            EXIT; -- Success, exit retry loop
            
        EXCEPTION
            WHEN SQLSTATE '40001' THEN -- Serialization failure
                retry_count := retry_count + 1;
                
                IF retry_count >= max_retries THEN
                    RETURN 'Transfer failed after ' || max_retries || ' retries';
                END IF;
                
                -- Wait and retry
                PERFORM pg_sleep(0.1 * retry_count);
        END;
    END LOOP;
    
    RETURN 'Transfer completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT transfer_funds_safe(1001, 1002, 500.00);
COMMIT;
```

### 2. Reporting System Example

```sql
-- Reporting can use lower isolation for performance
CREATE OR REPLACE FUNCTION generate_daily_report(report_date DATE)
RETURNS TABLE(
    metric_name VARCHAR(50),
    metric_value DECIMAL(15,2),
    calculation_time TIMESTAMP
) AS $$
BEGIN
    -- Use Read Committed for reporting (better performance)
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    
    RETURN QUERY
    SELECT 
        'Total Sales'::VARCHAR(50),
        SUM(amount),
        CURRENT_TIMESTAMP
    FROM orders 
    WHERE DATE(created_at) = report_date
    
    UNION ALL
    
    SELECT 
        'Average Order Value'::VARCHAR(50),
        AVG(amount),
        CURRENT_TIMESTAMP
    FROM orders 
    WHERE DATE(created_at) = report_date
    
    UNION ALL
    
    SELECT 
        'Total Customers'::VARCHAR(50),
        COUNT(DISTINCT customer_id)::DECIMAL(15,2),
        CURRENT_TIMESTAMP
    FROM orders 
    WHERE DATE(created_at) = report_date;
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT * FROM generate_daily_report('2024-01-15');
COMMIT;
```

### 3. Inventory Management Example

```sql
-- Different isolation levels for different scenarios
CREATE OR REPLACE FUNCTION manage_inventory_operation(
    operation_type VARCHAR(20),
    product_id INTEGER,
    quantity_change INTEGER
) RETURNS TEXT AS $$
DECLARE
    current_quantity INTEGER;
    result_message TEXT;
BEGIN
    CASE operation_type
        WHEN 'CRITICAL_UPDATE' THEN
            -- Use Repeatable Read for critical inventory operations
            SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
            
            SELECT quantity INTO current_quantity
            FROM products 
            WHERE product_id = product_id FOR UPDATE;
            
            IF current_quantity + quantity_change < 0 THEN
                RETURN 'Insufficient inventory';
            END IF;
            
            UPDATE products 
            SET quantity = quantity + quantity_change,
                last_updated = CURRENT_TIMESTAMP
            WHERE product_id = product_id;
            
            result_message := 'Critical update completed';
            
        WHEN 'BULK_UPDATE' THEN
            -- Use Read Committed for bulk operations
            SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
            
            UPDATE products 
            SET quantity = quantity + quantity_change,
                last_updated = CURRENT_TIMESTAMP
            WHERE product_id = product_id
                AND quantity + quantity_change >= 0;
                
            IF NOT FOUND THEN
                result_message := 'Bulk update failed - insufficient inventory';
            ELSE
                result_message := 'Bulk update completed';
            END IF;
            
        WHEN 'AUDIT_CHECK' THEN
            -- Use Serializable for audit consistency
            SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
            
            SELECT quantity INTO current_quantity
            FROM products 
            WHERE product_id = product_id;
            
            INSERT INTO inventory_audit (
                product_id,
                recorded_quantity,
                audit_timestamp,
                audit_type
            ) VALUES (
                product_id,
                current_quantity,
                CURRENT_TIMESTAMP,
                'SCHEDULED_AUDIT'
            );
            
            result_message := 'Audit completed with quantity: ' || current_quantity;
            
        ELSE
            result_message := 'Unknown operation type';
    END CASE;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- Usage examples
BEGIN;
    SELECT manage_inventory_operation('CRITICAL_UPDATE', 101, -5);
COMMIT;

BEGIN;
    SELECT manage_inventory_operation('BULK_UPDATE', 102, 100);
COMMIT;

BEGIN;
    SELECT manage_inventory_operation('AUDIT_CHECK', 103, 0);
COMMIT;
```

## Isolation Level Comparison

### Performance vs Consistency Trade-offs

```sql
-- Performance comparison example
CREATE OR REPLACE FUNCTION test_isolation_performance(
    isolation_level TEXT,
    test_iterations INTEGER DEFAULT 1000
) RETURNS TABLE(
    isolation_level_tested TEXT,
    avg_execution_time_ms DECIMAL(10,3),
    successful_transactions INTEGER,
    failed_transactions INTEGER
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    success_count INTEGER := 0;
    failure_count INTEGER := 0;
    i INTEGER;
BEGIN
    start_time := CURRENT_TIMESTAMP;
    
    FOR i IN 1..test_iterations LOOP
        BEGIN
            EXECUTE format('SET TRANSACTION ISOLATION LEVEL %s', isolation_level);
            
            -- Simple read-write operation
            PERFORM COUNT(*) FROM orders WHERE amount > 100;
            UPDATE order_stats SET last_calculated = CURRENT_TIMESTAMP;
            
            success_count := success_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                failure_count := failure_count + 1;
        END;
    END LOOP;
    
    end_time := CURRENT_TIMESTAMP;
    
    RETURN QUERY SELECT 
        isolation_level,
        EXTRACT(EPOCH FROM (end_time - start_time)) * 1000 / test_iterations,
        success_count,
        failure_count;
END;
$$ LANGUAGE plpgsql;

-- Test different isolation levels
BEGIN;
    SELECT * FROM test_isolation_performance('READ committed');
    SELECT * FROM test_isolation_performance('repeatable read');
    SELECT * FROM test_isolation_performance('serializable');
COMMIT;
```

### Choosing the Right Isolation Level

```sql
-- Decision matrix function
CREATE OR REPLACE FUNCTION recommend_isolation_level(
    operation_type VARCHAR(50),
    data_criticality VARCHAR(20),
    concurrency_requirement VARCHAR(20)
) RETURNS TEXT AS $$
BEGIN
    RETURN CASE 
        -- Financial operations - always high isolation
        WHEN operation_type ILIKE '%financial%' OR operation_type ILIKE '%payment%' THEN
            'SERIALIZABLE - Financial data requires highest consistency'
            
        -- Audit operations - need consistent snapshots
        WHEN operation_type ILIKE '%audit%' OR operation_type ILIKE '%compliance%' THEN
            'REPEATABLE READ - Ensures consistent audit snapshots'
            
        -- Reporting - balance performance and consistency
        WHEN operation_type ILIKE '%report%' OR operation_type ILIKE '%analytics%' THEN
            CASE data_criticality
                WHEN 'HIGH' THEN 'REPEATABLE READ - Critical reports need consistency'
                ELSE 'READ committed - Good balance for reporting'
            END
            
        -- Bulk operations - prioritize performance
        WHEN operation_type ILIKE '%bulk%' OR operation_type ILIKE '%import%' THEN
            CASE concurrency_requirement
                WHEN 'HIGH' THEN 'read committed - Better concurrency for bulk ops'
                ELSE 'READ uncommitted - Maximum performance for imports'
            END
            
        -- Default recommendation based on criticality
        ELSE
            CASE data_criticality
                WHEN 'HIGH' THEN 'SERIALIZABLE - High criticality requires highest isolation'
                WHEN 'MEDIUM' THEN 'REPEATABLE READ - Good consistency for medium criticality'
                ELSE 'read committed - Standard level for normal operations'
            END
    END;
END;
$$ LANGUAGE plpgsql;

-- Usage examples
SELECT recommend_isolation_level('financial_transfer', 'HIGH', 'MEDIUM');
SELECT recommend_isolation_level('daily_report', 'MEDIUM', 'HIGH');
SELECT recommend_isolation_level('bulk_import', 'LOW', 'HIGH');
```

## Monitoring and Troubleshooting

### 1. Monitoring Isolation Level Usage

```sql
-- Track isolation level usage
CREATE OR REPLACE VIEW transaction_isolation_stats AS
SELECT 
    application_name,
    isolation_level,
    COUNT(*) as transaction_count,
    AVG(EXTRACT(EPOCH FROM (now() - xact_start))) as avg_duration_seconds,
    COUNT(CASE WHEN state = 'idle in transaction' THEN 1 END) as idle_in_transaction
FROM pg_stat_activity
WHERE state IS NOT NULL
GROUP BY application_name, isolation_level
ORDER BY transaction_count DESC;

-- Usage
SELECT * FROM transaction_isolation_stats;
```

### 2. Detecting Serialization Failures

```sql
-- Log serialization failures
CREATE TABLE serialization_failures (
    id SERIAL PRIMARY KEY,
    error_code TEXT,
    error_message TEXT,
    query_text TEXT,
    application_name TEXT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to handle serialization failures
CREATE OR REPLACE FUNCTION handle_serialization_failure(
    error_code TEXT,
    error_message TEXT,
    query_text TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO serialization_failures (
        error_code,
        error_message,
        query_text,
        application_name
    ) VALUES (
        error_code,
        error_message,
        query_text,
        current_setting('application_name', true)
    );
    
    -- Send notification for monitoring
    PERFORM pg_notify(
        'serialization_failure',
        json_build_object(
            'error_code', error_code,
            'application', current_setting('application_name', true),
            'timestamp', CURRENT_TIMESTAMP
        )::text
    );
END;
$$ LANGUAGE plpgsql;
```

### 3. Analyzing Lock Conflicts

```sql
-- Monitor lock conflicts by isolation level
CREATE OR REPLACE VIEW lock_conflicts_by_isolation AS
WITH lock_info AS (
    SELECT 
        sa.isolation_level,
        sa.application_name,
        sa.state,
        sa.query,
        l.locktype,
        l.mode,
        l.granted,
        EXTRACT(EPOCH FROM (now() - sa.query_start)) as query_duration
    FROM pg_stat_activity sa
    JOIN pg_locks l ON sa.pid = l.pid
    WHERE sa.state IS NOT NULL
)
SELECT 
    isolation_level,
    locktype,
    mode,
    COUNT(*) as lock_count,
    COUNT(CASE WHEN NOT granted THEN 1 END) as blocked_locks,
    AVG(query_duration) as avg_query_duration
FROM lock_info
GROUP BY isolation_level, locktype, mode
ORDER BY blocked_locks DESC, lock_count DESC;

-- Usage
SELECT * FROM lock_conflicts_by_isolation;
```

## Best Practices

### 1. Application Design Guidelines

```sql
-- Template for transaction isolation selection
CREATE OR REPLACE FUNCTION execute_with_appropriate_isolation(
    operation_category VARCHAR(20),
    sql_command TEXT,
    max_retries INTEGER DEFAULT 3
) RETURNS TEXT AS $$
DECLARE
    isolation_level TEXT;
    retry_count INTEGER := 0;
    result TEXT;
BEGIN
    -- Determine isolation level based on operation
    isolation_level := CASE operation_category
        WHEN 'FINANCIAL' THEN 'SERIALIZABLE'
        WHEN 'AUDIT' THEN 'REPEATABLE READ'
        WHEN 'REPORTING' THEN 'READ COMMITTED'
        WHEN 'BULK' THEN 'READ COMMITTED'
        ELSE 'READ COMMITTED'
    END;
    
    -- Retry loop for serialization failures
    LOOP
        BEGIN
            EXECUTE format('SET TRANSACTION ISOLATION LEVEL %s', isolation_level);
            EXECUTE sql_command;
            result := 'SUCCESS';
            EXIT;
            
        EXCEPTION
            WHEN SQLSTATE '40001' THEN -- Serialization failure
                retry_count := retry_count + 1;
                
                IF retry_count >= max_retries THEN
                    result := 'FAILED_MAX_RETRIES';
                    EXIT;
                END IF;
                
                -- Exponential backoff
                PERFORM pg_sleep(0.1 * power(2, retry_count));
                
            WHEN OTHERS THEN
                result := 'ERROR: ' || SQLERRM;
                EXIT;
        END;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 2. Configuration Recommendations

```sql
-- Check current default isolation level
SHOW default_transaction_isolation;

-- Set appropriate defaults for different applications
-- For OLTP systems (high concurrency)
SET default_transaction_isolation = 'read committed';

-- For OLAP systems (analytical workloads)
SET default_transaction_isolation = 'repeatable read';

-- For critical financial applications
SET default_transaction_isolation = 'serializable';
```

## Summary

**Transaction Isolation Levels in PostgreSQL:**

**1. Read Uncommitted (Lowest)**
- Allows dirty reads
- Best performance, lowest consistency
- Rarely used in practice

**2. Read Committed (Default)**
- Prevents dirty reads
- Good balance of performance and consistency
- Most common choice for OLTP applications

**3. Repeatable Read**
- Prevents dirty and non-repeatable reads
- Consistent snapshot within transaction
- Good for analytical queries and reports

**4. Serializable (Highest)**
- Prevents all concurrency anomalies
- Highest consistency guarantee
- Required for critical financial operations
- May require retry logic for serialization failures

**Key Considerations:**
- **Performance vs Consistency**: Higher isolation = lower performance
- **Application Requirements**: Financial systems need higher isolation
- **Retry Logic**: Serializable transactions may fail and need retries
- **PostgreSQL MVCC**: Provides better isolation than SQL standard requires
- **Monitoring**: Track serialization failures and lock conflicts

**Best Practices:**
- Use Read Committed as default
- Use Repeatable Read for consistent snapshots
- Use Serializable for critical operations
- Implement retry logic for serialization failures
- Monitor and tune based on application behavior
- Choose isolation level based on data criticality and consistency requirements