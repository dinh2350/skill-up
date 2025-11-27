# 113. What is a deadlock?

## Definition

A **deadlock** in PostgreSQL occurs when two or more transactions are waiting for each other to release locks, creating a circular dependency that prevents any of the transactions from proceeding. This situation results in an infinite wait unless the database system intervenes to break the deadlock by terminating one of the transactions.

In PostgreSQL, deadlocks are automatically detected by the deadlock detector, which runs periodically and terminates one of the conflicting transactions with a deadlock error (`SQLSTATE 40P01`), allowing the remaining transactions to proceed.

## How Deadlocks Occur

### 1. Basic Deadlock Scenario

```sql
-- Session 1                              -- Session 2
BEGIN;                                    BEGIN;
UPDATE accounts SET balance = 1000        UPDATE accounts SET balance = 2000
WHERE account_id = 1;                     WHERE account_id = 2;
-- Acquires lock on account_id = 1        -- Acquires lock on account_id = 2

-- Now each session tries to access the other's locked resource
UPDATE accounts SET balance = 1500        UPDATE accounts SET balance = 2500  
WHERE account_id = 2;                     WHERE account_id = 1;
-- Waits for lock on account_id = 2       -- Waits for lock on account_id = 1
-- DEADLOCK DETECTED!                     -- One transaction will be terminated

COMMIT;                                   COMMIT;
```

### 2. Multiple Table Deadlock

```sql
-- Demonstration of deadlock across multiple tables
-- Session 1
BEGIN;
    -- Lock order: customers -> orders
    UPDATE customers SET last_updated = NOW() WHERE customer_id = 100;
    -- Simulate some processing time
    SELECT pg_sleep(2);
    UPDATE orders SET status = 'processing' WHERE customer_id = 100;
COMMIT;

-- Session 2 (running concurrently)
BEGIN;
    -- Lock order: orders -> customers (opposite order!)
    UPDATE orders SET priority = 'high' WHERE order_id = 500;
    -- Simulate some processing time  
    SELECT pg_sleep(2);
    UPDATE customers SET loyalty_points = loyalty_points + 100 
    WHERE customer_id = (SELECT customer_id FROM orders WHERE order_id = 500);
COMMIT;
-- If order 500 belongs to customer 100, this creates a deadlock
```

### 3. Complex Multi-Resource Deadlock

```sql
-- Complex scenario involving multiple resources and lock types
CREATE OR REPLACE FUNCTION demonstrate_complex_deadlock()
RETURNS TABLE(
    session_id TEXT,
    step_number INTEGER,
    action_description TEXT,
    lock_acquired TEXT,
    potential_conflict TEXT
) AS $$
BEGIN
    -- Simulate a complex business transaction that can deadlock
    RETURN QUERY VALUES
    ('Session A', 1, 'Lock user account for balance check', 'Row Lock: users.id=123', 'None'),
    ('Session B', 1, 'Lock product inventory for reservation', 'Row Lock: products.id=456', 'None'),
    ('Session A', 2, 'Reserve product inventory', 'Waits for: products.id=456', 'Blocked by Session B'),
    ('Session B', 2, 'Deduct from user account', 'Waits for: users.id=123', 'Blocked by Session A'),
    ('Deadlock Detector', 3, 'Circular dependency detected', 'Terminates Session B', 'Session A proceeds');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_complex_deadlock();
```

## Types of Locks Involved in Deadlocks

### 1. Row-Level Locks

```sql
-- Row-level lock deadlocks (most common)
CREATE OR REPLACE FUNCTION simulate_row_lock_deadlock()
RETURNS VOID AS $$
BEGIN
    -- This function demonstrates how row locks can cause deadlocks
    RAISE NOTICE 'Row-level deadlock simulation:';
    RAISE NOTICE 'Transaction 1: UPDATE table SET col = val WHERE id = 1';
    RAISE NOTICE 'Transaction 2: UPDATE table SET col = val WHERE id = 2';  
    RAISE NOTICE 'Transaction 1: UPDATE table SET col = val WHERE id = 2 -- Waits';
    RAISE NOTICE 'Transaction 2: UPDATE table SET col = val WHERE id = 1 -- Deadlock!';
END;
$$ LANGUAGE plpgsql;

-- Practical example with financial transactions
CREATE TABLE IF NOT EXISTS account_transactions (
    transaction_id SERIAL PRIMARY KEY,
    from_account_id INTEGER NOT NULL,
    to_account_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function that can cause deadlocks
CREATE OR REPLACE FUNCTION transfer_money_unsafe(
    from_id INTEGER,
    to_id INTEGER, 
    transfer_amount DECIMAL(15,2)
) RETURNS BOOLEAN AS $$
DECLARE
    from_balance DECIMAL(15,2);
    to_balance DECIMAL(15,2);
BEGIN
    -- Unsafe pattern: lock order depends on input parameters
    
    -- Lock from account
    SELECT balance INTO from_balance 
    FROM accounts 
    WHERE account_id = from_id FOR UPDATE;
    
    -- Simulate processing time
    PERFORM pg_sleep(0.1);
    
    -- Lock to account (potential deadlock if another transaction 
    -- locks these accounts in opposite order)
    SELECT balance INTO to_balance 
    FROM accounts 
    WHERE account_id = to_id FOR UPDATE;
    
    -- Check sufficient funds
    IF from_balance < transfer_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Perform transfer
    UPDATE accounts SET balance = balance - transfer_amount 
    WHERE account_id = from_id;
    
    UPDATE accounts SET balance = balance + transfer_amount 
    WHERE account_id = to_id;
    
    -- Log transaction
    INSERT INTO account_transactions (from_account_id, to_account_id, amount, status)
    VALUES (from_id, to_id, transfer_amount, 'completed');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Usage that can cause deadlocks:
-- Session 1: SELECT transfer_money_unsafe(1, 2, 100);
-- Session 2: SELECT transfer_money_unsafe(2, 1, 50); -- Potential deadlock!
```

### 2. Table-Level Locks

```sql
-- Table-level lock conflicts leading to deadlocks
CREATE OR REPLACE FUNCTION demonstrate_table_lock_deadlock()
RETURNS TABLE(
    lock_type VARCHAR(30),
    description TEXT,
    deadlock_scenario TEXT,
    prevention_strategy TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('ACCESS SHARE vs ACCESS EXCLUSIVE', 
     'Read operations vs DDL operations',
     'Transaction 1: SELECT (ACCESS SHARE), Transaction 2: ALTER TABLE (ACCESS EXCLUSIVE)',
     'Schedule maintenance during low traffic periods'),
    
    ('SHARE vs EXCLUSIVE', 
     'Bulk operations vs individual updates',
     'Transaction 1: CREATE INDEX (SHARE), Transaction 2: DELETE (ROW EXCLUSIVE)',
     'Coordinate bulk operations, use CONCURRENTLY for indexes'),
    
    ('ROW SHARE vs ACCESS EXCLUSIVE',
     'SELECT FOR UPDATE vs DDL',
     'Transaction 1: SELECT FOR UPDATE, Transaction 2: DROP TABLE',
     'Use shorter transactions, avoid DDL during peak hours'),
    
    ('SHARE UPDATE EXCLUSIVE conflicts',
     'Multiple DDL operations',
     'Transaction 1: VACUUM, Transaction 2: ALTER TABLE',
     'Schedule maintenance operations sequentially');
END;
$$ LANGUAGE plpgsql;

-- Example of table-level deadlock
-- Session 1:
BEGIN;
SELECT * FROM products FOR UPDATE; -- Acquires ROW SHARE lock
-- ... processing time ...
ALTER TABLE products ADD COLUMN new_field TEXT; -- Wants ACCESS EXCLUSIVE

-- Session 2 (concurrent):
BEGIN; 
ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(12,2); -- Wants ACCESS EXCLUSIVE
-- ... this will wait for Session 1's ROW SHARE to be released ...
SELECT * FROM products WHERE id = 1 FOR UPDATE; -- Wants ROW SHARE
-- DEADLOCK: Session 1 waits for ACCESS EXCLUSIVE, Session 2 waits for ROW SHARE
```

### 3. Advisory Locks

```sql
-- Advisory lock deadlocks
CREATE OR REPLACE FUNCTION advisory_lock_deadlock_demo()
RETURNS VOID AS $$
DECLARE
    lock_acquired BOOLEAN;
BEGIN
    -- Advisory locks can also participate in deadlocks
    RAISE NOTICE 'Advisory Lock Deadlock Demonstration:';
    
    -- Session 1 pattern:
    RAISE NOTICE 'Session 1: SELECT pg_advisory_lock(12345);';
    RAISE NOTICE 'Session 1: SELECT pg_advisory_lock(67890);';
    
    -- Session 2 pattern (reverse order):
    RAISE NOTICE 'Session 2: SELECT pg_advisory_lock(67890);';
    RAISE NOTICE 'Session 2: SELECT pg_advisory_lock(12345); -- DEADLOCK!';
    
    -- Safe pattern example:
    lock_acquired := pg_try_advisory_lock(12345);
    IF lock_acquired THEN
        lock_acquired := pg_try_advisory_lock(67890);
        IF lock_acquired THEN
            RAISE NOTICE 'Both locks acquired safely';
            PERFORM pg_advisory_unlock(67890);
        END IF;
        PERFORM pg_advisory_unlock(12345);
    ELSE
        RAISE NOTICE 'Could not acquire first lock, avoiding potential deadlock';
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## Deadlock Detection and Resolution

### 1. PostgreSQL's Deadlock Detection

```sql
-- Understanding PostgreSQL's deadlock detection mechanism
CREATE OR REPLACE VIEW deadlock_detection_info AS
SELECT 
    setting as deadlock_timeout,
    unit,
    short_desc,
    context
FROM pg_settings 
WHERE name = 'deadlock_timeout'
UNION ALL
SELECT 
    'Detection Frequency'::TEXT,
    'automatic'::TEXT,
    'PostgreSQL checks for deadlocks every deadlock_timeout interval'::TEXT,
    'System-wide behavior'::TEXT;

-- Usage
SELECT * FROM deadlock_detection_info;

-- View current deadlock detection settings
SELECT 
    name,
    setting,
    unit,
    short_desc
FROM pg_settings 
WHERE name IN ('deadlock_timeout', 'log_lock_waits');
```

### 2. Deadlock Error Handling

```sql
-- Comprehensive deadlock error handling
CREATE OR REPLACE FUNCTION handle_transfer_with_deadlock_retry(
    from_account INTEGER,
    to_account INTEGER,
    amount DECIMAL(15,2),
    max_retries INTEGER DEFAULT 3
) RETURNS TABLE(
    success BOOLEAN,
    attempts INTEGER,
    final_message TEXT,
    total_time_ms DECIMAL(10,3)
) AS $$
DECLARE
    attempt_count INTEGER := 0;
    start_time TIMESTAMP := CURRENT_TIMESTAMP;
    from_balance DECIMAL(15,2);
    retry_delay DECIMAL := 0.1;
    success_flag BOOLEAN := FALSE;
BEGIN
    WHILE attempt_count < max_retries AND NOT success_flag LOOP
        attempt_count := attempt_count + 1;
        
        BEGIN
            -- Attempt the transfer operation
            
            -- Consistent lock ordering to reduce deadlock probability
            IF from_account < to_account THEN
                SELECT balance INTO from_balance 
                FROM accounts WHERE account_id = from_account FOR UPDATE;
                
                UPDATE accounts SET balance = balance + amount 
                WHERE account_id = to_account;
            ELSE
                UPDATE accounts SET balance = balance + amount 
                WHERE account_id = to_account;
                
                SELECT balance INTO from_balance 
                FROM accounts WHERE account_id = from_account FOR UPDATE;
            END IF;
            
            -- Check sufficient funds
            IF from_balance < amount THEN
                RETURN QUERY SELECT 
                    FALSE, 
                    attempt_count,
                    format('Insufficient funds: %s < %s', from_balance, amount)::TEXT,
                    (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000)::DECIMAL(10,3);
                RETURN;
            END IF;
            
            -- Complete the transfer
            UPDATE accounts SET balance = balance - amount 
            WHERE account_id = from_account;
            
            -- Log successful transfer
            INSERT INTO account_transactions (from_account_id, to_account_id, amount, status)
            VALUES (from_account, to_account, amount, 'completed');
            
            success_flag := TRUE;
            
        EXCEPTION
            WHEN SQLSTATE '40P01' THEN -- Deadlock detected
                -- Log the deadlock occurrence
                INSERT INTO deadlock_log (
                    operation_type,
                    operation_details,
                    attempt_number,
                    error_message,
                    occurred_at
                ) VALUES (
                    'money_transfer',
                    jsonb_build_object(
                        'from_account', from_account,
                        'to_account', to_account,
                        'amount', amount
                    ),
                    attempt_count,
                    SQLERRM,
                    CURRENT_TIMESTAMP
                );
                
                -- Exponential backoff with jitter
                IF attempt_count < max_retries THEN
                    PERFORM pg_sleep(
                        retry_delay * power(2, attempt_count - 1) * (0.5 + random() * 0.5)
                    );
                END IF;
                
            WHEN OTHERS THEN
                -- Non-deadlock error - don't retry
                RETURN QUERY SELECT 
                    FALSE,
                    attempt_count,
                    format('Transfer failed: %s', SQLERRM)::TEXT,
                    (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000)::DECIMAL(10,3);
                RETURN;
        END;
    END LOOP;
    
    -- Return final result
    RETURN QUERY SELECT 
        success_flag,
        attempt_count,
        CASE 
            WHEN success_flag THEN 'Transfer completed successfully'
            ELSE format('Transfer failed after %s attempts due to deadlocks', max_retries)
        END::TEXT,
        (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000)::DECIMAL(10,3);
END;
$$ LANGUAGE plpgsql;

-- Create deadlock logging table
CREATE TABLE IF NOT EXISTS deadlock_log (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50),
    operation_details JSONB,
    attempt_number INTEGER,
    error_message TEXT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage
SELECT * FROM handle_transfer_with_deadlock_retry(1, 2, 100.00, 5);
```

### 3. Deadlock Monitoring and Analysis

```sql
-- Comprehensive deadlock monitoring system
CREATE OR REPLACE VIEW deadlock_analysis AS
WITH deadlock_stats AS (
    SELECT 
        COUNT(*) as total_deadlocks,
        COUNT(DISTINCT operation_type) as affected_operations,
        AVG(attempt_number) as avg_attempts_before_deadlock,
        MAX(attempt_number) as max_attempts_before_deadlock,
        COUNT(*) FILTER (WHERE occurred_at > CURRENT_TIMESTAMP - INTERVAL '1 hour') as recent_deadlocks,
        COUNT(*) FILTER (WHERE occurred_at > CURRENT_TIMESTAMP - INTERVAL '1 day') as daily_deadlocks
    FROM deadlock_log
),
operation_breakdown AS (
    SELECT 
        operation_type,
        COUNT(*) as deadlock_count,
        AVG(attempt_number) as avg_attempts,
        jsonb_object_agg(
            extract(hour from occurred_at)::TEXT, 
            COUNT(*)
        ) as hourly_distribution
    FROM deadlock_log
    WHERE occurred_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    GROUP BY operation_type
),
current_locks AS (
    SELECT 
        COUNT(*) as active_locks,
        COUNT(DISTINCT pid) as sessions_with_locks,
        COUNT(*) FILTER (WHERE NOT granted) as waiting_locks,
        string_agg(DISTINCT locktype, ', ') as lock_types
    FROM pg_locks
    WHERE granted = false
)
SELECT 
    'System Overview' as metric_category,
    jsonb_build_object(
        'total_deadlocks_logged', ds.total_deadlocks,
        'operations_affected', ds.affected_operations,
        'recent_deadlocks_1h', ds.recent_deadlocks,
        'daily_deadlocks', ds.daily_deadlocks,
        'avg_attempts_before_deadlock', ROUND(ds.avg_attempts_before_deadlock, 2),
        'current_waiting_locks', cl.waiting_locks,
        'current_lock_types', cl.lock_types
    ) as metrics
FROM deadlock_stats ds, current_locks cl

UNION ALL

SELECT 
    'Operation: ' || op.operation_type as metric_category,
    jsonb_build_object(
        'deadlock_count_24h', op.deadlock_count,
        'avg_attempts', ROUND(op.avg_attempts, 2),
        'hourly_pattern', op.hourly_distribution
    ) as metrics
FROM operation_breakdown op;

-- Usage
SELECT * FROM deadlock_analysis;

-- Real-time deadlock monitoring function
CREATE OR REPLACE FUNCTION monitor_potential_deadlocks()
RETURNS TABLE(
    potential_deadlock BOOLEAN,
    waiting_sessions INTEGER,
    lock_conflicts TEXT[],
    recommendation TEXT
) AS $$
DECLARE
    waiting_count INTEGER;
    conflict_info TEXT[];
    potential_issue BOOLEAN := FALSE;
BEGIN
    -- Count sessions waiting for locks
    SELECT COUNT(*) INTO waiting_count
    FROM pg_locks
    WHERE NOT granted;
    
    -- Get detailed conflict information
    SELECT ARRAY_AGG(
        format('PID %s waiting for %s lock on %s.%s', 
               pid, mode, 
               COALESCE(schemaname, 'unknown'), 
               COALESCE(tablename, relation::TEXT))
    ) INTO conflict_info
    FROM pg_locks l
    LEFT JOIN pg_stat_user_tables s ON l.relation = s.relid
    WHERE NOT l.granted;
    
    -- Determine if situation looks like potential deadlock
    potential_issue := waiting_count > 1;
    
    RETURN QUERY SELECT 
        potential_issue,
        waiting_count,
        COALESCE(conflict_info, ARRAY[]::TEXT[]),
        CASE 
            WHEN waiting_count = 0 THEN 'No lock conflicts detected'
            WHEN waiting_count = 1 THEN 'Single lock wait - monitor for resolution'
            WHEN waiting_count > 1 THEN 'Multiple lock waits - potential deadlock scenario'
            ELSE 'Unknown lock state'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM monitor_potential_deadlocks();
```

## Real-World Deadlock Scenarios

### 1. E-commerce Order Processing

```sql
-- Common e-commerce deadlock scenario
CREATE OR REPLACE FUNCTION process_order_with_deadlock_risk(
    customer_id INTEGER,
    product_ids INTEGER[],
    quantities INTEGER[]
) RETURNS TABLE(
    step VARCHAR(50),
    status VARCHAR(20),
    details TEXT
) AS $$
DECLARE
    i INTEGER;
    current_inventory INTEGER;
    product_id INTEGER;
    quantity INTEGER;
    order_id INTEGER;
BEGIN
    -- This function demonstrates common deadlock patterns in e-commerce
    
    RETURN QUERY SELECT 'Order Validation'::VARCHAR(50), 'STARTED'::VARCHAR(20), 
                        'Beginning order processing'::TEXT;
    
    -- Step 1: Lock customer record (potential deadlock point #1)
    RETURN QUERY SELECT 'Customer Lock'::VARCHAR(50), 'IN_PROGRESS'::VARCHAR(20),
                        format('Locking customer %s for order processing', customer_id)::TEXT;
    
    -- Step 2: Lock inventory records (potential deadlock point #2)
    -- If multiple orders access products in different orders, deadlock can occur
    FOR i IN 1..array_length(product_ids, 1) LOOP
        product_id := product_ids[i];
        quantity := quantities[i];
        
        RETURN QUERY SELECT 'Inventory Check'::VARCHAR(50), 'IN_PROGRESS'::VARCHAR(20),
                            format('Checking inventory for product %s', product_id)::TEXT;
        
        -- This SELECT FOR UPDATE can cause deadlocks
        SELECT current_stock INTO current_inventory
        FROM products 
        WHERE id = product_id FOR UPDATE;
        
        IF current_inventory < quantity THEN
            RETURN QUERY SELECT 'Inventory Check'::VARCHAR(50), 'FAILED'::VARCHAR(20),
                               format('Insufficient stock for product %s', product_id)::TEXT;
            RETURN;
        END IF;
    END LOOP;
    
    -- Step 3: Create order record (potential deadlock point #3)
    INSERT INTO orders (customer_id, status, created_at)
    VALUES (customer_id, 'processing', CURRENT_TIMESTAMP)
    RETURNING id INTO order_id;
    
    RETURN QUERY SELECT 'Order Creation'::VARCHAR(50), 'SUCCESS'::VARCHAR(20),
                        format('Order %s created successfully', order_id)::TEXT;
    
    -- Step 4: Update inventory (potential deadlock point #4)
    FOR i IN 1..array_length(product_ids, 1) LOOP
        UPDATE products 
        SET current_stock = current_stock - quantities[i]
        WHERE id = product_ids[i];
        
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES (order_id, product_ids[i], quantities[i]);
    END LOOP;
    
    RETURN QUERY SELECT 'Order Completion'::VARCHAR(50), 'SUCCESS'::VARCHAR(20),
                        'Order processed successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Deadlock-prone usage pattern:
-- Session 1: process_order_with_deadlock_risk(100, ARRAY[1,2], ARRAY[1,1])
-- Session 2: process_order_with_deadlock_risk(101, ARRAY[2,1], ARRAY[1,1])
-- ^ Different product order can cause deadlock!
```

### 2. Financial Account Management

```sql
-- Banking scenario with multiple account operations
CREATE OR REPLACE FUNCTION complex_financial_operation(
    primary_account_id INTEGER,
    secondary_account_id INTEGER,
    operation_type VARCHAR(50),
    amount DECIMAL(15,2)
) RETURNS TABLE(
    operation_step VARCHAR(40),
    lock_acquired VARCHAR(30),
    deadlock_risk VARCHAR(10),
    mitigation TEXT
) AS $$
BEGIN
    -- Demonstrate complex financial operations prone to deadlocks
    
    CASE operation_type
        WHEN 'transfer_with_fees' THEN
            RETURN QUERY VALUES
            ('Lock Primary Account', 'Row Lock (Account)', 'LOW', 'First lock acquired'),
            ('Calculate Transfer Fee', 'No Additional Lock', 'LOW', 'Computation only'),
            ('Lock Secondary Account', 'Row Lock (Account)', 'MEDIUM', 'Second account lock - potential conflict'),
            ('Lock Fee Account', 'Row Lock (Account)', 'HIGH', 'Third lock increases deadlock risk'),
            ('Update All Balances', 'Multiple Row Locks', 'HIGH', 'Multiple updates in transaction'),
            ('Log Transaction', 'Table Insert Lock', 'MEDIUM', 'Final operation with insert');
            
        WHEN 'multi_account_balance' THEN
            RETURN QUERY VALUES
            ('Lock Multiple Accounts', 'Multiple Row Locks', 'VERY HIGH', 'Locking multiple accounts simultaneously'),
            ('Calculate Total Balance', 'Read Operations', 'HIGH', 'Consistent read across locked accounts'),
            ('Update Balance Summary', 'Table Update Lock', 'MEDIUM', 'Summary table update'),
            ('Update Account Status', 'Multiple Updates', 'HIGH', 'Batch updates on locked accounts');
            
        WHEN 'credit_limit_adjustment' THEN
            RETURN QUERY VALUES
            ('Lock Account Record', 'Row Lock (Account)', 'LOW', 'Single account lock'),
            ('Check Credit History', 'Join Query Locks', 'MEDIUM', 'Multiple table access'),
            ('Lock Credit Config', 'Config Table Lock', 'MEDIUM', 'Shared configuration access'),
            ('Update Credit Limit', 'Account Update Lock', 'MEDIUM', 'Final account modification'),
            ('Log Credit Change', 'Audit Insert Lock', 'LOW', 'Audit trail creation');
            
        ELSE
            RETURN QUERY VALUES
            ('Unknown Operation', 'N/A', 'UNKNOWN', 'Operation type not recognized');
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM complex_financial_operation(1001, 1002, 'transfer_with_fees', 5000.00);
SELECT * FROM complex_financial_operation(1001, 1002, 'multi_account_balance', 0);
```

### 3. Inventory Management Deadlocks

```sql
-- Warehouse/inventory management deadlock scenarios
CREATE OR REPLACE FUNCTION warehouse_operation_deadlock_analysis()
RETURNS TABLE(
    scenario_name VARCHAR(50),
    description TEXT,
    deadlock_probability VARCHAR(15),
    typical_cause TEXT,
    business_impact VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Concurrent Stock Updates', 
     'Multiple processes updating same product inventory simultaneously',
     'HIGH', 
     'Different processes locking products in different order',
     'Order fulfillment delays'),
    
    ('Batch Processing Conflicts',
     'Bulk inventory updates vs individual order processing',
     'MEDIUM',
     'Batch process locks large ranges, orders lock individual items',
     'Processing bottlenecks'),
    
    ('Cross-Warehouse Transfers',
     'Moving inventory between warehouse locations',
     'MEDIUM',
     'Different source/destination locking order',
     'Transfer delays'),
    
    ('Reorder Point Calculations',
     'Automated reordering vs manual inventory adjustments',
     'LOW',
     'Read-heavy operations rarely conflict',
     'Minor delays'),
    
    ('Promotion Activation',
     'Activating sales promotions affecting multiple products',
     'HIGH',
     'Bulk price updates vs individual product access',
     'Marketing campaign delays'),
    
    ('Supplier Integration',
     'External supplier updates vs internal inventory operations',
     'MEDIUM',
     'External system timing conflicts with internal processes',
     'Supply chain disruption');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM warehouse_operation_deadlock_analysis();
```

## Impact and Performance Considerations

### 1. Measuring Deadlock Impact

```sql
-- Deadlock impact assessment
CREATE OR REPLACE FUNCTION assess_deadlock_impact(
    time_window INTERVAL DEFAULT '1 day'
) RETURNS TABLE(
    impact_metric VARCHAR(40),
    current_value NUMERIC,
    comparison_period VARCHAR(20),
    severity_level VARCHAR(15),
    recommended_action TEXT
) AS $$
DECLARE
    total_deadlocks INTEGER;
    total_transactions INTEGER;
    deadlock_rate NUMERIC;
    avg_retry_count NUMERIC;
    affected_operations INTEGER;
BEGIN
    -- Calculate deadlock statistics
    SELECT 
        COUNT(*),
        AVG(attempt_number),
        COUNT(DISTINCT operation_type)
    INTO total_deadlocks, avg_retry_count, affected_operations
    FROM deadlock_log
    WHERE occurred_at > CURRENT_TIMESTAMP - time_window;
    
    -- Estimate total transactions (approximate)
    SELECT COUNT(*) INTO total_transactions
    FROM pg_stat_statements
    WHERE last_call > CURRENT_TIMESTAMP - time_window;
    
    -- Calculate deadlock rate
    deadlock_rate := CASE 
        WHEN total_transactions > 0 THEN (total_deadlocks::NUMERIC / total_transactions) * 100
        ELSE 0
    END;
    
    -- Return impact metrics
    RETURN QUERY SELECT 
        'Total Deadlocks'::VARCHAR(40),
        total_deadlocks::NUMERIC,
        time_window::VARCHAR(20),
        CASE 
            WHEN total_deadlocks = 0 THEN 'NONE'
            WHEN total_deadlocks < 5 THEN 'LOW'
            WHEN total_deadlocks < 20 THEN 'MEDIUM'
            ELSE 'HIGH'
        END::VARCHAR(15),
        CASE 
            WHEN total_deadlocks = 0 THEN 'No action needed'
            WHEN total_deadlocks < 5 THEN 'Monitor trends'
            WHEN total_deadlocks < 20 THEN 'Review transaction patterns'
            ELSE 'Immediate optimization required'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Deadlock Rate (%)'::VARCHAR(40),
        ROUND(deadlock_rate, 4)::NUMERIC,
        'Per transaction'::VARCHAR(20),
        CASE 
            WHEN deadlock_rate < 0.01 THEN 'ACCEPTABLE'
            WHEN deadlock_rate < 0.1 THEN 'CONCERNING'
            ELSE 'CRITICAL'
        END::VARCHAR(15),
        CASE 
            WHEN deadlock_rate < 0.01 THEN 'Rate within acceptable limits'
            WHEN deadlock_rate < 0.1 THEN 'Consider lock ordering optimization'
            ELSE 'Critical - implement deadlock prevention immediately'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Average Retry Count'::VARCHAR(40),
        ROUND(COALESCE(avg_retry_count, 0), 2)::NUMERIC,
        'Before success'::VARCHAR(20),
        CASE 
            WHEN avg_retry_count <= 1.5 THEN 'GOOD'
            WHEN avg_retry_count <= 3.0 THEN 'MODERATE'
            ELSE 'POOR'
        END::VARCHAR(15),
        CASE 
            WHEN avg_retry_count <= 1.5 THEN 'Retry logic working well'
            WHEN avg_retry_count <= 3.0 THEN 'Consider improved lock ordering'
            ELSE 'High retry count indicates systematic deadlock issues'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Operations Affected'::VARCHAR(40),
        affected_operations::NUMERIC,
        'Distinct types'::VARCHAR(20),
        CASE 
            WHEN affected_operations <= 2 THEN 'FOCUSED'
            WHEN affected_operations <= 5 THEN 'MODERATE'
            ELSE 'WIDESPREAD'
        END::VARCHAR(15),
        CASE 
            WHEN affected_operations <= 2 THEN 'Deadlocks limited to specific operations'
            WHEN affected_operations <= 5 THEN 'Multiple operations affected - review patterns'
            ELSE 'System-wide deadlock issues require comprehensive review'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM assess_deadlock_impact('24 hours'::INTERVAL);
```

### 2. Performance Impact Analysis

```sql
-- Analyze performance impact of deadlocks
CREATE OR REPLACE VIEW deadlock_performance_impact AS
WITH deadlock_timing AS (
    SELECT 
        operation_type,
        attempt_number,
        occurred_at,
        LAG(occurred_at) OVER (
            PARTITION BY operation_type 
            ORDER BY occurred_at
        ) as previous_deadlock,
        COUNT(*) OVER (
            PARTITION BY operation_type, 
            DATE_TRUNC('hour', occurred_at)
        ) as deadlocks_per_hour
    FROM deadlock_log
    WHERE occurred_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
),
impact_metrics AS (
    SELECT 
        operation_type,
        COUNT(*) as total_deadlocks,
        AVG(attempt_number) as avg_retries,
        MAX(attempt_number) as max_retries,
        AVG(deadlocks_per_hour) as avg_deadlocks_per_hour,
        MAX(deadlocks_per_hour) as peak_deadlocks_per_hour,
        -- Estimate time lost due to retries (assuming 100ms base retry delay)
        SUM(attempt_number * 0.1) as estimated_time_lost_seconds
    FROM deadlock_timing
    GROUP BY operation_type
)
SELECT 
    operation_type,
    total_deadlocks,
    ROUND(avg_retries, 2) as avg_retries,
    max_retries,
    ROUND(avg_deadlocks_per_hour, 1) as avg_hourly_rate,
    peak_deadlocks_per_hour,
    ROUND(estimated_time_lost_seconds, 2) as estimated_time_lost_sec,
    CASE 
        WHEN estimated_time_lost_seconds > 60 THEN 'HIGH IMPACT'
        WHEN estimated_time_lost_seconds > 10 THEN 'MEDIUM IMPACT'  
        WHEN estimated_time_lost_seconds > 1 THEN 'LOW IMPACT'
        ELSE 'MINIMAL IMPACT'
    END as performance_impact_level,
    CASE 
        WHEN peak_deadlocks_per_hour > 10 THEN 'IMMEDIATE ATTENTION REQUIRED'
        WHEN peak_deadlocks_per_hour > 5 THEN 'OPTIMIZATION RECOMMENDED'
        WHEN peak_deadlocks_per_hour > 1 THEN 'MONITOR CLOSELY'
        ELSE 'ACCEPTABLE LEVEL'
    END as urgency_level
FROM impact_metrics
ORDER BY estimated_time_lost_seconds DESC;

-- Usage
SELECT * FROM deadlock_performance_impact;
```

## Summary

**Deadlock Definition and Characteristics:**

**Core Concept:**
- **Circular dependency**: Two or more transactions waiting for each other's locks
- **Automatic detection**: PostgreSQL detects deadlocks via deadlock detector
- **Automatic resolution**: One transaction terminated with SQLSTATE 40P01
- **Resource conflicts**: Involves locks on rows, tables, or advisory locks

**Common Deadlock Scenarios:**
- **Row-level locks**: Transactions accessing same rows in different order
- **Table-level locks**: DDL operations conflicting with DML operations  
- **Multi-resource locks**: Complex transactions accessing multiple resources
- **Cross-table dependencies**: Operations spanning multiple related tables

**Types of Locks Involved:**
- **Row locks**: Most common source of deadlocks in OLTP systems
- **Table locks**: DDL operations vs concurrent access
- **Advisory locks**: Application-level locking mechanisms
- **Index locks**: Conflicts during concurrent index operations

**Detection and Resolution:**
- **Detection timeout**: Configurable via `deadlock_timeout` parameter
- **Victim selection**: PostgreSQL chooses transaction to terminate
- **Error handling**: Applications must handle SQLSTATE 40P01
- **Retry mechanisms**: Implement exponential backoff for retries

**Real-World Impact:**
- **E-commerce**: Order processing, inventory management conflicts
- **Financial systems**: Account transfers, balance calculations
- **Warehouse management**: Stock updates, location transfers
- **Multi-user applications**: Concurrent access to shared resources

**Performance Considerations:**
- **Transaction delays**: Failed transactions must restart
- **Resource overhead**: Detection and resolution consume CPU
- **User experience**: Potential delays in application response
- **System scalability**: High deadlock rates limit concurrent throughput

**Monitoring and Analysis:**
- **Deadlock logging**: Track frequency and patterns
- **Performance metrics**: Measure impact on system performance
- **Trend analysis**: Identify increasing deadlock rates
- **Operation profiling**: Determine most deadlock-prone operations

**Best Practices for Handling:**
- **Implement retry logic**: Handle SQLSTATE 40P01 with exponential backoff
- **Monitor deadlock frequency**: Track and alert on deadlock rates
- **Analyze deadlock patterns**: Identify common scenarios for optimization
- **Design for failure**: Build applications expecting occasional deadlocks
- **Performance testing**: Load test with concurrent transactions

Deadlocks are an inherent challenge in concurrent database systems, but PostgreSQL's automatic detection and resolution, combined with proper application design and error handling, can minimize their impact on system performance and user experience.