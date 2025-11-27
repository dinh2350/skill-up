# 109. What is Read Committed?

## Definition

Read Committed is the default transaction isolation level in PostgreSQL. It ensures that a transaction can only read data that has been committed by other transactions, preventing dirty reads while still allowing non-repeatable reads and phantom reads. This isolation level provides a good balance between data consistency and system performance for most OLTP applications.

## Core Characteristics

### 1. Prevents Dirty Reads

Read Committed ensures transactions never see uncommitted data from other transactions:

```sql
-- Session 1: Start a transaction and modify data
BEGIN;
    UPDATE accounts SET balance = 5000 WHERE account_id = 1;
    -- Transaction not committed yet

-- Session 2: Read Committed transaction
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
    SELECT balance FROM accounts WHERE account_id = 1;
    -- Returns the original committed value, NOT 5000
    -- Will wait if Session 1 has a lock, or see the old value
COMMIT;

-- Session 1: Now commit the change
COMMIT;

-- Session 2: New transaction will now see the committed value
BEGIN;
    SELECT balance FROM accounts WHERE account_id = 1;
    -- Returns: 5000 (the committed value)
COMMIT;
```

### 2. Allows Non-repeatable Reads

Within a single transaction, the same query might return different results:

```sql
-- Demonstration of non-repeatable reads
BEGIN ISOLATION LEVEL READ COMMITTED;
    -- First read
    SELECT balance FROM accounts WHERE account_id = 1;
    -- Returns: 1000
    
    -- Another transaction commits a change to this account
    -- (This would happen in a different session)
    
    -- Second read in the same transaction
    SELECT balance FROM accounts WHERE account_id = 1;
    -- Returns: 1500 (different value - non-repeatable read)
    
COMMIT;
```

### 3. PostgreSQL Implementation with MVCC

```sql
-- PostgreSQL uses MVCC to implement Read Committed efficiently
BEGIN ISOLATION LEVEL READ COMMITTED;
    -- Each statement gets a fresh snapshot
    SELECT balance, xmin, xmax FROM accounts WHERE account_id = 1;
    -- xmin: transaction that created this row version
    -- xmax: transaction that deleted/updated this row (0 if current)
    
    -- Wait a moment for other transactions to modify data
    
    SELECT balance, xmin, xmax FROM accounts WHERE account_id = 1;
    -- May see different xmin/xmax values indicating new row version
    
COMMIT;
```

## Practical Examples and Use Cases

### 1. E-commerce Order Processing

```sql
-- Typical e-commerce order processing with Read Committed
CREATE OR REPLACE FUNCTION process_order(
    customer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER
) RETURNS TABLE(
    order_id INTEGER,
    status VARCHAR(20),
    message TEXT,
    timestamp TIMESTAMP
) AS $$
DECLARE
    available_inventory INTEGER;
    customer_balance DECIMAL(10,2);
    product_price DECIMAL(10,2);
    total_cost DECIMAL(10,2);
    new_order_id INTEGER;
BEGIN
    -- Using Read Committed (default) for order processing
    -- Each SELECT gets fresh committed data
    
    -- Check current inventory (gets latest committed value)
    SELECT quantity INTO available_inventory
    FROM products 
    WHERE product_id = product_id FOR UPDATE; -- Lock for update
    
    IF available_inventory < quantity THEN
        RETURN QUERY SELECT 
            NULL::INTEGER,
            'FAILED'::VARCHAR(20),
            'Insufficient inventory'::TEXT,
            CURRENT_TIMESTAMP;
        RETURN;
    END IF;
    
    -- Get current product price (latest committed value)
    SELECT price INTO product_price
    FROM products 
    WHERE product_id = product_id;
    
    total_cost := product_price * quantity;
    
    -- Check customer balance (latest committed value)
    SELECT account_balance INTO customer_balance
    FROM customers 
    WHERE customer_id = customer_id FOR UPDATE;
    
    IF customer_balance < total_cost THEN
        RETURN QUERY SELECT 
            NULL::INTEGER,
            'FAILED'::VARCHAR(20),
            'Insufficient funds'::TEXT,
            CURRENT_TIMESTAMP;
        RETURN;
    END IF;
    
    -- Create order
    INSERT INTO orders (customer_id, total_amount, status, created_at)
    VALUES (customer_id, total_cost, 'pending', CURRENT_TIMESTAMP)
    RETURNING order_id INTO new_order_id;
    
    -- Reserve inventory
    UPDATE products 
    SET quantity = quantity - quantity
    WHERE product_id = product_id;
    
    -- Deduct from customer balance
    UPDATE customers 
    SET account_balance = account_balance - total_cost
    WHERE customer_id = customer_id;
    
    -- Update order status
    UPDATE orders 
    SET status = 'confirmed'
    WHERE order_id = new_order_id;
    
    RETURN QUERY SELECT 
        new_order_id,
        'SUCCESS'::VARCHAR(20),
        'Order processed successfully'::TEXT,
        CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN; -- Uses Read Committed by default
    SELECT * FROM process_order(123, 456, 2);
COMMIT;
```

### 2. Real-time Dashboard Updates

```sql
-- Dashboard queries that benefit from Read Committed behavior
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE(
    metric_name VARCHAR(50),
    current_value DECIMAL(15,2),
    previous_value DECIMAL(15,2),
    change_percent DECIMAL(5,2),
    last_updated TIMESTAMP
) AS $$
DECLARE
    today_sales DECIMAL(15,2);
    yesterday_sales DECIMAL(15,2);
    today_orders DECIMAL(15,2);
    yesterday_orders DECIMAL(15,2);
BEGIN
    -- Read Committed ensures we see latest committed sales data
    -- Each query sees the most recent committed state
    
    -- Today's sales (latest committed transactions)
    SELECT COALESCE(SUM(amount), 0) INTO today_sales
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE 
    AND status IN ('completed', 'shipped');
    
    -- Yesterday's sales for comparison
    SELECT COALESCE(SUM(amount), 0) INTO yesterday_sales
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    AND status IN ('completed', 'shipped');
    
    -- Return sales metrics
    RETURN QUERY SELECT 
        'Daily Sales'::VARCHAR(50),
        today_sales,
        yesterday_sales,
        CASE 
            WHEN yesterday_sales > 0 THEN 
                ((today_sales - yesterday_sales) / yesterday_sales * 100)
            ELSE 0
        END::DECIMAL(5,2),
        CURRENT_TIMESTAMP;
    
    -- Today's order count
    SELECT COUNT(*) INTO today_orders
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Yesterday's order count
    SELECT COUNT(*) INTO yesterday_orders
    FROM orders 
    WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day';
    
    -- Return order metrics
    RETURN QUERY SELECT 
        'Daily Orders'::VARCHAR(50),
        today_orders,
        yesterday_orders,
        CASE 
            WHEN yesterday_orders > 0 THEN 
                ((today_orders - yesterday_orders) / yesterday_orders * 100)
            ELSE 0
        END::DECIMAL(5,2),
        CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Usage - each call sees fresh data
SELECT * FROM get_dashboard_metrics();
```

### 3. Customer Service Application

```sql
-- Customer service queries that need current data
CREATE OR REPLACE FUNCTION get_customer_summary(p_customer_id INTEGER)
RETURNS TABLE(
    customer_info JSONB,
    account_status VARCHAR(20),
    recent_orders JSONB,
    support_tickets JSONB,
    last_activity TIMESTAMP
) AS $$
DECLARE
    customer_data JSONB;
    status VARCHAR(20);
    orders_data JSONB;
    tickets_data JSONB;
    last_seen TIMESTAMP;
BEGIN
    -- Read Committed ensures customer service sees latest data
    -- without locking other operations
    
    -- Get current customer information
    SELECT jsonb_build_object(
        'id', customer_id,
        'name', name,
        'email', email,
        'phone', phone,
        'balance', account_balance,
        'created_at', created_at
    ) INTO customer_data
    FROM customers 
    WHERE customer_id = p_customer_id;
    
    -- Determine account status based on current data
    SELECT 
        CASE 
            WHEN account_balance < 0 THEN 'OVERDUE'
            WHEN account_balance > 1000 THEN 'PREMIUM'
            WHEN last_login > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'ACTIVE'
            ELSE 'INACTIVE'
        END INTO status
    FROM customers 
    WHERE customer_id = p_customer_id;
    
    -- Get recent orders (latest committed orders)
    SELECT jsonb_agg(
        jsonb_build_object(
            'order_id', order_id,
            'amount', amount,
            'status', status,
            'created_at', created_at
        ) ORDER BY created_at DESC
    ) INTO orders_data
    FROM orders 
    WHERE customer_id = p_customer_id
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
    LIMIT 10;
    
    -- Get active support tickets
    SELECT jsonb_agg(
        jsonb_build_object(
            'ticket_id', ticket_id,
            'subject', subject,
            'status', ticket_status,
            'created_at', created_at
        ) ORDER BY created_at DESC
    ) INTO tickets_data
    FROM support_tickets 
    WHERE customer_id = p_customer_id
    AND ticket_status IN ('open', 'in_progress')
    LIMIT 5;
    
    -- Get last activity
    SELECT GREATEST(
        COALESCE(MAX(last_login), '1970-01-01'::TIMESTAMP),
        COALESCE(MAX(created_at), '1970-01-01'::TIMESTAMP)
    ) INTO last_seen
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    WHERE c.customer_id = p_customer_id;
    
    RETURN QUERY SELECT 
        customer_data,
        status,
        COALESCE(orders_data, '[]'::JSONB),
        COALESCE(tickets_data, '[]'::JSONB),
        last_seen;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM get_customer_summary(12345);
```

### 4. Inventory Management System

```sql
-- Inventory tracking with Read Committed
CREATE OR REPLACE FUNCTION update_inventory_transaction(
    p_product_id INTEGER,
    p_quantity_change INTEGER,
    p_transaction_type VARCHAR(20),
    p_reference_id INTEGER DEFAULT NULL
) RETURNS TABLE(
    success BOOLEAN,
    new_quantity INTEGER,
    transaction_id INTEGER,
    message TEXT
) AS $$
DECLARE
    current_qty INTEGER;
    new_qty INTEGER;
    trans_id INTEGER;
BEGIN
    -- Read Committed allows seeing latest committed inventory levels
    -- while preventing dirty reads from concurrent updates
    
    -- Get current inventory with row lock
    SELECT quantity INTO current_qty
    FROM products 
    WHERE product_id = p_product_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE,
            NULL::INTEGER,
            NULL::INTEGER,
            'Product not found'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate new quantity
    new_qty := current_qty + p_quantity_change;
    
    -- Validate business rules
    IF new_qty < 0 AND p_transaction_type NOT IN ('adjustment', 'audit') THEN
        RETURN QUERY SELECT 
            FALSE,
            current_qty,
            NULL::INTEGER,
            format('Insufficient inventory. Current: %s, Requested change: %s', 
                   current_qty, p_quantity_change)::TEXT;
        RETURN;
    END IF;
    
    -- Update inventory
    UPDATE products 
    SET quantity = new_qty,
        last_updated = CURRENT_TIMESTAMP
    WHERE product_id = p_product_id;
    
    -- Log the transaction
    INSERT INTO inventory_transactions (
        product_id,
        quantity_change,
        transaction_type,
        reference_id,
        previous_quantity,
        new_quantity,
        created_at
    ) VALUES (
        p_product_id,
        p_quantity_change,
        p_transaction_type,
        p_reference_id,
        current_qty,
        new_qty,
        CURRENT_TIMESTAMP
    ) RETURNING transaction_id INTO trans_id;
    
    -- Check if reorder is needed (using current committed thresholds)
    PERFORM check_reorder_level(p_product_id);
    
    RETURN QUERY SELECT 
        TRUE,
        new_qty,
        trans_id,
        format('Inventory updated: %s -> %s', current_qty, new_qty)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Helper function for reorder checking
CREATE OR REPLACE FUNCTION check_reorder_level(p_product_id INTEGER)
RETURNS VOID AS $$
DECLARE
    current_qty INTEGER;
    reorder_level INTEGER;
    reorder_qty INTEGER;
BEGIN
    -- Read latest committed values for reorder logic
    SELECT p.quantity, p.reorder_level, p.reorder_quantity
    INTO current_qty, reorder_level, reorder_qty
    FROM products p
    WHERE product_id = p_product_id;
    
    IF current_qty <= reorder_level THEN
        -- Create reorder notification
        INSERT INTO reorder_notifications (
            product_id,
            current_quantity,
            reorder_level,
            suggested_quantity,
            created_at
        ) VALUES (
            p_product_id,
            current_qty,
            reorder_level,
            reorder_qty,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (product_id) DO UPDATE SET
            current_quantity = EXCLUDED.current_quantity,
            suggested_quantity = EXCLUDED.suggested_quantity,
            created_at = EXCLUDED.created_at;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Usage examples
BEGIN; -- Uses Read Committed by default
    -- Sale transaction
    SELECT * FROM update_inventory_transaction(101, -5, 'sale', 12345);
    
    -- Restock transaction
    SELECT * FROM update_inventory_transaction(102, 100, 'restock', 67890);
    
    -- Adjustment transaction
    SELECT * FROM update_inventory_transaction(103, -2, 'adjustment', NULL);
COMMIT;
```

## Concurrency and Performance Characteristics

### 1. Lock Behavior in Read Committed

```sql
-- Demonstration of Read Committed locking behavior
CREATE OR REPLACE FUNCTION demonstrate_read_committed_locks()
RETURNS TABLE(
    step INTEGER,
    operation TEXT,
    lock_info TEXT,
    result TEXT
) AS $$
BEGIN
    -- Step 1: Show how Read Committed acquires minimal locks for reads
    RETURN QUERY SELECT 
        1,
        'Read operation'::TEXT,
        'No long-term locks held'::TEXT,
        'Allows high concurrency for reads'::TEXT;
    
    -- Example: Reading data doesn't block other transactions
    -- (In practice, this would be demonstrated with concurrent sessions)
    PERFORM COUNT(*) FROM orders WHERE status = 'pending';
    
    RETURN QUERY SELECT 
        2,
        'Read completed'::TEXT,
        'Locks released immediately'::TEXT,
        'Other transactions can proceed'::TEXT;
    
    -- Step 2: Show how writes acquire necessary locks
    RETURN QUERY SELECT 
        3,
        'Write operation'::TEXT,
        'Row-level exclusive locks acquired'::TEXT,
        'Blocks conflicting operations only'::TEXT;
END;
$$ LANGUAGE plpgsql;
```

### 2. Non-repeatable Read Scenarios

```sql
-- Practical example of when non-repeatable reads occur
CREATE OR REPLACE FUNCTION demonstrate_non_repeatable_reads()
RETURNS TABLE(
    read_sequence INTEGER,
    balance_seen DECIMAL(10,2),
    transaction_time TIMESTAMP,
    explanation TEXT
) AS $$
DECLARE
    first_balance DECIMAL(10,2);
    second_balance DECIMAL(10,2);
BEGIN
    -- This simulates what happens in Read Committed isolation
    
    -- First read
    SELECT balance INTO first_balance
    FROM accounts WHERE account_id = 1;
    
    RETURN QUERY SELECT 
        1,
        first_balance,
        CURRENT_TIMESTAMP,
        'Initial balance reading'::TEXT;
    
    -- Simulate time passing and other transactions committing
    PERFORM pg_sleep(0.1);
    
    -- Second read in same transaction - might see different value
    SELECT balance INTO second_balance
    FROM accounts WHERE account_id = 1;
    
    RETURN QUERY SELECT 
        2,
        second_balance,
        CURRENT_TIMESTAMP,
        CASE 
            WHEN first_balance = second_balance THEN 
                'Same value - no concurrent changes'
            ELSE 
                'Different value - non-repeatable read occurred'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Run this in a transaction to see the behavior
BEGIN ISOLATION LEVEL READ COMMITTED;
    SELECT * FROM demonstrate_non_repeatable_reads();
COMMIT;
```

### 3. Performance Optimization with Read Committed

```sql
-- Optimized query patterns for Read Committed
CREATE OR REPLACE FUNCTION optimized_read_committed_queries()
RETURNS TABLE(
    query_type VARCHAR(30),
    execution_time_ms DECIMAL(10,3),
    locks_acquired INTEGER,
    optimization_notes TEXT
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    lock_count_before BIGINT;
    lock_count_after BIGINT;
BEGIN
    -- Pattern 1: Minimize lock duration with specific queries
    SELECT COUNT(*) INTO lock_count_before FROM pg_locks;
    start_time := CURRENT_TIMESTAMP;
    
    -- Efficient query that reads and releases locks quickly
    PERFORM product_id, name, price 
    FROM products 
    WHERE category = 'electronics' 
    AND active = TRUE
    ORDER BY price 
    LIMIT 20;
    
    end_time := CURRENT_TIMESTAMP;
    SELECT COUNT(*) INTO lock_count_after FROM pg_locks;
    
    RETURN QUERY SELECT 
        'Optimized SELECT'::VARCHAR(30),
        (EXTRACT(EPOCH FROM (end_time - start_time)) * 1000)::DECIMAL(10,3),
        (lock_count_after - lock_count_before)::INTEGER,
        'Minimal locks, quick execution'::TEXT;
    
    -- Pattern 2: Batch updates to reduce transaction overhead
    lock_count_before := lock_count_after;
    start_time := CURRENT_TIMESTAMP;
    
    -- Update multiple rows efficiently
    UPDATE order_items 
    SET last_updated = CURRENT_TIMESTAMP
    WHERE order_id IN (
        SELECT order_id 
        FROM orders 
        WHERE status = 'pending' 
        AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 hour'
        LIMIT 100
    );
    
    end_time := CURRENT_TIMESTAMP;
    SELECT COUNT(*) INTO lock_count_after FROM pg_locks;
    
    RETURN QUERY SELECT 
        'Batch UPDATE'::VARCHAR(30),
        (EXTRACT(EPOCH FROM (end_time - start_time)) * 1000)::DECIMAL(10,3),
        (lock_count_after - lock_count_before)::INTEGER,
        'Efficient batch processing'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM optimized_read_committed_queries();
```

## Monitoring and Troubleshooting

### 1. Monitoring Read Committed Transactions

```sql
-- Monitor Read Committed transaction behavior
CREATE OR REPLACE VIEW read_committed_activity AS
SELECT 
    pid,
    application_name,
    state,
    query_start,
    EXTRACT(EPOCH FROM (now() - query_start)) as query_duration_seconds,
    CASE 
        WHEN state = 'active' THEN 'Currently executing'
        WHEN state = 'idle in transaction' THEN 'Holding transaction open'
        WHEN state = 'idle' THEN 'Connection idle'
        ELSE state
    END as status_description,
    LEFT(query, 100) as query_preview
FROM pg_stat_activity 
WHERE isolation_level = 'read committed'
AND state IS NOT NULL
ORDER BY query_start;

-- Usage
SELECT * FROM read_committed_activity;
```

### 2. Detecting Non-repeatable Read Issues

```sql
-- Function to detect potential non-repeatable read issues
CREATE OR REPLACE FUNCTION detect_non_repeatable_read_issues(
    table_name TEXT,
    id_column TEXT,
    monitor_duration_minutes INTEGER DEFAULT 5
) RETURNS TABLE(
    issue_detected BOOLEAN,
    affected_records INTEGER,
    sample_changes JSONB,
    recommendations TEXT
) AS $$
DECLARE
    start_time TIMESTAMP := CURRENT_TIMESTAMP;
    end_time TIMESTAMP := CURRENT_TIMESTAMP + (monitor_duration_minutes || ' minutes')::INTERVAL;
    change_count INTEGER := 0;
    sample_data JSONB;
BEGIN
    -- Create temporary table to track changes
    EXECUTE format('CREATE TEMP TABLE change_tracking AS 
                   SELECT %I, txid_current_snapshot() as initial_snapshot 
                   FROM %I 
                   LIMIT 100', id_column, table_name);
    
    -- Monitor for changes during the specified period
    WHILE CURRENT_TIMESTAMP < end_time LOOP
        -- Check for changes by comparing snapshots
        EXECUTE format('
            SELECT COUNT(*) FROM %I t1
            JOIN change_tracking t2 ON t1.%I = t2.%I
            WHERE txid_snapshot_xmax(t2.initial_snapshot) != txid_current()',
            table_name, id_column, id_column
        ) INTO change_count;
        
        IF change_count > 0 THEN
            EXIT; -- Found changes, stop monitoring
        END IF;
        
        PERFORM pg_sleep(1);
    END LOOP;
    
    -- Prepare sample data if changes were detected
    IF change_count > 0 THEN
        sample_data := jsonb_build_object(
            'monitoring_duration', monitor_duration_minutes,
            'changes_detected', change_count,
            'detection_time', CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN QUERY SELECT 
        change_count > 0,
        change_count,
        COALESCE(sample_data, '{}'::JSONB),
        CASE 
            WHEN change_count > 0 THEN 
                'Consider using REPEATABLE READ for consistent snapshots'
            ELSE 
                'No non-repeatable read issues detected during monitoring period'
        END::TEXT;
    
    -- Cleanup
    DROP TABLE change_tracking;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM detect_non_repeatable_read_issues('orders', 'order_id', 2);
```

### 3. Performance Impact Analysis

```sql
-- Analyze performance impact of Read Committed vs other isolation levels
CREATE OR REPLACE FUNCTION analyze_isolation_performance()
RETURNS TABLE(
    isolation_level TEXT,
    avg_query_time_ms DECIMAL(10,3),
    lock_wait_events INTEGER,
    deadlock_count INTEGER,
    throughput_queries_per_second DECIMAL(10,2)
) AS $$
DECLARE
    rc_performance RECORD;
    rr_performance RECORD;
BEGIN
    -- Analyze Read Committed performance
    SELECT 
        AVG(EXTRACT(EPOCH FROM (now() - query_start)) * 1000) as avg_time,
        COUNT(CASE WHEN wait_event_type = 'Lock' THEN 1 END) as lock_waits
    INTO rc_performance
    FROM pg_stat_activity 
    WHERE isolation_level = 'read committed'
    AND state = 'active';
    
    -- Analyze Repeatable Read performance for comparison
    SELECT 
        AVG(EXTRACT(EPOCH FROM (now() - query_start)) * 1000) as avg_time,
        COUNT(CASE WHEN wait_event_type = 'Lock' THEN 1 END) as lock_waits
    INTO rr_performance
    FROM pg_stat_activity 
    WHERE isolation_level = 'repeatable read'
    AND state = 'active';
    
    -- Return Read Committed stats
    RETURN QUERY SELECT 
        'READ COMMITTED'::TEXT,
        COALESCE(rc_performance.avg_time, 0)::DECIMAL(10,3),
        COALESCE(rc_performance.lock_waits, 0)::INTEGER,
        0::INTEGER, -- Deadlocks would need separate tracking
        CASE 
            WHEN rc_performance.avg_time > 0 THEN 
                (1000.0 / rc_performance.avg_time)::DECIMAL(10,2)
            ELSE 0
        END;
    
    -- Return Repeatable Read stats for comparison
    RETURN QUERY SELECT 
        'REPEATABLE READ'::TEXT,
        COALESCE(rr_performance.avg_time, 0)::DECIMAL(10,3),
        COALESCE(rr_performance.lock_waits, 0)::INTEGER,
        0::INTEGER,
        CASE 
            WHEN rr_performance.avg_time > 0 THEN 
                (1000.0 / rr_performance.avg_time)::DECIMAL(10,2)
            ELSE 0
        END;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_isolation_performance();
```

## Best Practices for Read Committed

### 1. When to Use Read Committed

```sql
-- Decision framework for using Read Committed
CREATE OR REPLACE FUNCTION should_use_read_committed(
    operation_type VARCHAR(50),
    consistency_requirement VARCHAR(20),
    concurrency_need VARCHAR(20)
) RETURNS TABLE(
    recommended BOOLEAN,
    reasoning TEXT,
    alternatives TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            -- Ideal for OLTP operations
            WHEN operation_type IN ('customer_service', 'order_processing', 'inventory_update')
                 AND consistency_requirement IN ('moderate', 'eventual')
                 AND concurrency_need IN ('high', 'very_high') THEN TRUE
            
            -- Good for real-time dashboards
            WHEN operation_type IN ('dashboard', 'monitoring', 'reporting')
                 AND consistency_requirement IN ('low', 'moderate') THEN TRUE
            
            -- Appropriate for web applications
            WHEN operation_type IN ('web_application', 'api_endpoint')
                 AND concurrency_need = 'high' THEN TRUE
            
            -- Not suitable for critical consistency requirements
            WHEN consistency_requirement = 'strict' THEN FALSE
            
            ELSE TRUE -- Default recommendation
        END as is_recommended,
        
        CASE 
            WHEN operation_type IN ('customer_service', 'order_processing') THEN
                'Read Committed provides good balance of consistency and performance for ' || operation_type
            WHEN operation_type IN ('dashboard', 'monitoring') THEN
                'Fresh data visibility important for ' || operation_type || ', non-repeatable reads acceptable'
            WHEN consistency_requirement = 'strict' THEN
                'Read Committed allows non-repeatable reads, not suitable for strict consistency'
            WHEN concurrency_need = 'very_high' THEN
                'Read Committed minimizes locking, supports high concurrency'
            ELSE
                'Read Committed is PostgreSQL default, suitable for most applications'
        END as explanation,
        
        CASE 
            WHEN consistency_requirement = 'strict' THEN
                'Consider REPEATABLE READ or SERIALIZABLE'
            WHEN concurrency_need = 'low' THEN
                'REPEATABLE READ might be acceptable'
            WHEN operation_type IN ('financial', 'audit') THEN
                'Consider REPEATABLE READ or SERIALIZABLE for audit trails'
            ELSE
                'Read Committed is appropriate'
        END as alternative_options;
END;
$$ LANGUAGE plpgsql;

-- Usage examples
SELECT * FROM should_use_read_committed('order_processing', 'moderate', 'high');
SELECT * FROM should_use_read_committed('financial_audit', 'strict', 'low');
SELECT * FROM should_use_read_committed('dashboard', 'moderate', 'very_high');
```

### 2. Optimizing Applications for Read Committed

```sql
-- Best practices for Read Committed applications
CREATE OR REPLACE FUNCTION optimize_for_read_committed()
RETURNS TABLE(
    practice VARCHAR(50),
    description TEXT,
    example_code TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES 
    ('Keep transactions short', 
     'Minimize transaction duration to reduce lock holding time',
     'BEGIN; SELECT/UPDATE/INSERT; COMMIT;'),
    
    ('Use specific WHERE clauses',
     'Reduce lock scope with precise conditions',
     'UPDATE orders SET status = ''shipped'' WHERE order_id = $1'),
    
    ('Batch similar operations',
     'Group related operations in single transaction',
     'UPDATE inventory SET quantity = quantity - vals.qty FROM (VALUES ...) AS vals'),
    
    ('Handle non-repeatable reads',
     'Design application logic to expect data changes',
     'SELECT ... FOR UPDATE when consistency needed within transaction'),
    
    ('Use row-level locking when needed',
     'FOR UPDATE/FOR SHARE for critical reads',
     'SELECT balance FROM accounts WHERE id = $1 FOR UPDATE'),
    
    ('Avoid long-running transactions',
     'Break large operations into smaller transactions',
     'Process records in batches of 1000 with COMMIT between batches');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM optimize_for_read_committed();
```

## Comparison with Other Isolation Levels

### 1. Read Committed vs Read Uncommitted

```sql
-- Compare Read Committed with Read Uncommitted
CREATE OR REPLACE FUNCTION compare_rc_vs_ru()
RETURNS TABLE(
    aspect VARCHAR(30),
    read_committed TEXT,
    read_uncommitted TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES 
    ('Dirty Reads', 'Prevented', 'Allowed'),
    ('Non-repeatable Reads', 'Allowed', 'Allowed'),
    ('Phantom Reads', 'Allowed', 'Allowed'),
    ('Performance', 'Good', 'Best'),
    ('Data Consistency', 'Moderate', 'Lowest'),
    ('Lock Duration', 'Statement-level', 'Minimal'),
    ('Use Cases', 'OLTP applications', 'Analytics, reporting'),
    ('PostgreSQL Behavior', 'Standard behavior', 'Acts like Read Committed due to MVCC');
END;
$$ LANGUAGE plpgsql;
```

### 2. Read Committed vs Repeatable Read

```sql
-- Compare Read Committed with Repeatable Read
CREATE OR REPLACE FUNCTION compare_rc_vs_rr()
RETURNS TABLE(
    aspect VARCHAR(30),
    read_committed TEXT,
    repeatable_read TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES 
    ('Snapshot Scope', 'Per statement', 'Per transaction'),
    ('Non-repeatable Reads', 'Allowed', 'Prevented'),
    ('Phantom Reads', 'Allowed', 'Prevented (PostgreSQL)'),
    ('Performance', 'Better', 'Good'),
    ('Memory Usage', 'Lower', 'Higher'),
    ('Concurrent Updates', 'More permissive', 'More restrictive'),
    ('Use Cases', 'Real-time operations', 'Analytical queries'),
    ('Application Complexity', 'Handle fresh data', 'Handle serialization failures');
END;
$$ LANGUAGE plpgsql;
```

## Summary

**Read Committed Characteristics:**

**Core Features:**
- **Default PostgreSQL isolation level**
- **Prevents dirty reads**: Never sees uncommitted data
- **Allows non-repeatable reads**: Same query may return different results within transaction
- **Allows phantom reads**: New rows may appear in subsequent queries
- **Statement-level snapshots**: Each statement sees latest committed data

**Key Benefits:**
- **Good performance**: Minimal locking overhead
- **High concurrency**: Doesn't block readers unnecessarily
- **Fresh data visibility**: Always sees latest committed changes
- **MVCC efficiency**: PostgreSQL's implementation is very efficient

**Ideal Use Cases:**
- **OLTP applications**: Order processing, customer service, inventory management
- **Real-time dashboards**: Current data visibility important
- **Web applications**: High concurrency requirements
- **API endpoints**: Need fresh data and good performance

**Considerations:**
- **Non-repeatable reads**: Application logic must handle changing data
- **Phantom reads**: New rows may appear during transaction
- **Lock conflicts**: May need explicit locking for consistency requirements

**Best Practices:**
- Keep transactions short
- Use FOR UPDATE when consistency needed
- Design for non-repeatable reads
- Batch similar operations
- Monitor for lock conflicts

**When NOT to Use:**
- Audit trails requiring consistent snapshots
- Financial calculations needing repeatable results
- Complex analytical queries requiring stable data
- Operations requiring strict consistency guarantees

Read Committed provides an excellent balance of performance and consistency for most PostgreSQL applications, making it the ideal default choice for OLTP workloads and real-time systems.