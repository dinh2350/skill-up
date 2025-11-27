# 114. How do you prevent deadlocks?

## Overview

Preventing deadlocks in PostgreSQL requires a multi-layered approach combining proper transaction design, consistent lock ordering, timeout configurations, and application-level strategies. While deadlocks cannot be completely eliminated in complex concurrent systems, their frequency and impact can be dramatically reduced through careful planning and implementation of best practices.

## Primary Prevention Strategies

### 1. Consistent Lock Ordering

The most effective deadlock prevention technique is ensuring all transactions acquire locks in the same order.

```sql
-- WRONG: Inconsistent lock ordering (deadlock-prone)
CREATE OR REPLACE FUNCTION transfer_money_wrong(
    from_id INTEGER,
    to_id INTEGER,
    amount DECIMAL(15,2)
) RETURNS BOOLEAN AS $$
DECLARE
    from_balance DECIMAL(15,2);
BEGIN
    -- Lock accounts in parameter order (can cause deadlocks)
    SELECT balance INTO from_balance 
    FROM accounts WHERE account_id = from_id FOR UPDATE;
    
    UPDATE accounts SET balance = balance + amount 
    WHERE account_id = to_id;
    
    -- ... rest of transfer logic
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- CORRECT: Consistent lock ordering (deadlock-safe)
CREATE OR REPLACE FUNCTION transfer_money_safe(
    from_id INTEGER,
    to_id INTEGER,
    amount DECIMAL(15,2)
) RETURNS BOOLEAN AS $$
DECLARE
    first_id INTEGER := LEAST(from_id, to_id);
    second_id INTEGER := GREATEST(from_id, to_id);
    from_balance DECIMAL(15,2);
    to_balance DECIMAL(15,2);
BEGIN
    -- Always lock accounts in ascending ID order
    IF first_id = from_id THEN
        SELECT balance INTO from_balance 
        FROM accounts WHERE account_id = first_id FOR UPDATE;
        
        SELECT balance INTO to_balance 
        FROM accounts WHERE account_id = second_id FOR UPDATE;
    ELSE
        SELECT balance INTO to_balance 
        FROM accounts WHERE account_id = first_id FOR UPDATE;
        
        SELECT balance INTO from_balance 
        FROM accounts WHERE account_id = second_id FOR UPDATE;
    END IF;
    
    -- Check sufficient funds
    IF from_balance < amount THEN
        RETURN FALSE;
    END IF;
    
    -- Perform transfer
    UPDATE accounts SET balance = balance - amount WHERE account_id = from_id;
    UPDATE accounts SET balance = balance + amount WHERE account_id = to_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Advanced consistent ordering for multiple resources
CREATE OR REPLACE FUNCTION process_multi_account_operation(
    account_ids INTEGER[],
    operation_type VARCHAR(50)
) RETURNS TABLE(
    account_id INTEGER,
    old_balance DECIMAL(15,2),
    new_balance DECIMAL(15,2),
    operation_status VARCHAR(20)
) AS $$
DECLARE
    sorted_ids INTEGER[];
    account_id INTEGER;
    current_balance DECIMAL(15,2);
    updated_balance DECIMAL(15,2);
BEGIN
    -- Sort account IDs to ensure consistent locking order
    SELECT ARRAY_AGG(unnest ORDER BY unnest) 
    INTO sorted_ids 
    FROM unnest(account_ids);
    
    -- Lock all accounts in consistent order
    FOREACH account_id IN ARRAY sorted_ids LOOP
        SELECT balance INTO current_balance 
        FROM accounts 
        WHERE id = account_id FOR UPDATE;
        
        -- Perform operation based on type
        CASE operation_type
            WHEN 'interest_calculation' THEN
                updated_balance := current_balance * 1.02; -- 2% interest
            WHEN 'service_fee' THEN
                updated_balance := current_balance - 5.00; -- $5 fee
            WHEN 'balance_reset' THEN
                updated_balance := 0;
            ELSE
                updated_balance := current_balance; -- No change
        END CASE;
        
        -- Update the account
        UPDATE accounts SET balance = updated_balance WHERE id = account_id;
        
        RETURN QUERY SELECT 
            account_id,
            current_balance,
            updated_balance,
            'SUCCESS'::VARCHAR(20);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM process_multi_account_operation(ARRAY[101, 205, 150], 'interest_calculation');
```

### 2. Reduce Transaction Scope and Duration

Keep transactions as short as possible to minimize lock holding time.

```sql
-- WRONG: Long-running transaction with extended lock duration
CREATE OR REPLACE FUNCTION process_order_wrong(
    customer_id INTEGER,
    product_ids INTEGER[],
    quantities INTEGER[]
) RETURNS INTEGER AS $$
DECLARE
    order_id INTEGER;
    product_id INTEGER;
    quantity INTEGER;
    i INTEGER;
    inventory_count INTEGER;
    calculation_result DECIMAL(15,2);
BEGIN
    -- Start transaction that will hold locks for a long time
    
    -- Lock customer (held throughout entire function)
    UPDATE customers SET last_order_date = CURRENT_TIMESTAMP 
    WHERE id = customer_id;
    
    -- Create order
    INSERT INTO orders (customer_id, status, created_at)
    VALUES (customer_id, 'processing', CURRENT_TIMESTAMP)
    RETURNING id INTO order_id;
    
    -- Process each item (locks held during entire loop)
    FOR i IN 1..array_length(product_ids, 1) LOOP
        product_id := product_ids[i];
        quantity := quantities[i];
        
        -- Lock inventory
        SELECT current_stock INTO inventory_count
        FROM products WHERE id = product_id FOR UPDATE;
        
        -- Expensive calculation (while holding locks!)
        SELECT perform_complex_pricing_calculation(product_id, quantity, customer_id)
        INTO calculation_result;
        
        -- Simulate slow external API call (still holding locks!)
        PERFORM pg_sleep(1);
        
        -- Update inventory
        UPDATE products 
        SET current_stock = current_stock - quantity 
        WHERE id = product_id;
        
        -- Create order item
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (order_id, product_id, quantity, calculation_result);
    END LOOP;
    
    -- Final order update
    UPDATE orders SET status = 'confirmed' WHERE id = order_id;
    
    RETURN order_id;
END;
$$ LANGUAGE plpgsql;

-- CORRECT: Minimize transaction scope and lock duration
CREATE OR REPLACE FUNCTION process_order_optimized(
    customer_id INTEGER,
    product_ids INTEGER[],
    quantities INTEGER[]
) RETURNS INTEGER AS $$
DECLARE
    order_id INTEGER;
    product_id INTEGER;
    quantity INTEGER;
    i INTEGER;
    inventory_data RECORD;
    pricing_data JSONB;
    order_items_data JSONB := '[]'::JSONB;
BEGIN
    -- Step 1: Validate customer without locking
    IF NOT EXISTS (SELECT 1 FROM customers WHERE id = customer_id AND active = TRUE) THEN
        RAISE EXCEPTION 'Customer % not found or inactive', customer_id;
    END IF;
    
    -- Step 2: Pre-calculate pricing (no locks held)
    FOR i IN 1..array_length(product_ids, 1) LOOP
        SELECT perform_complex_pricing_calculation(product_ids[i], quantities[i], customer_id)
        INTO pricing_data;
        
        order_items_data := order_items_data || jsonb_build_object(
            'product_id', product_ids[i],
            'quantity', quantities[i],
            'price', pricing_data
        );
    END LOOP;
    
    -- Step 3: Quick transaction for order creation
    BEGIN
        INSERT INTO orders (customer_id, status, created_at)
        VALUES (customer_id, 'processing', CURRENT_TIMESTAMP)
        RETURNING id INTO order_id;
    END;
    
    -- Step 4: Process inventory updates in minimal transactions
    FOR i IN 1..array_length(product_ids, 1) LOOP
        product_id := product_ids[i];
        quantity := quantities[i];
        
        -- Short transaction for each inventory update
        BEGIN
            -- Quick lock, check, and update
            SELECT current_stock INTO inventory_data.stock
            FROM products WHERE id = product_id FOR UPDATE;
            
            IF inventory_data.stock < quantity THEN
                RAISE EXCEPTION 'Insufficient inventory for product %', product_id;
            END IF;
            
            UPDATE products 
            SET current_stock = current_stock - quantity 
            WHERE id = product_id;
            
            -- Create order item immediately
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (
                order_id, 
                product_id, 
                quantity, 
                (order_items_data->(i-1)->>'price')::DECIMAL(10,2)
            );
        END;
    END LOOP;
    
    -- Step 5: Final order status update
    UPDATE orders SET status = 'confirmed' WHERE id = order_id;
    
    -- Step 6: Update customer last order date (separate transaction)
    UPDATE customers SET last_order_date = CURRENT_TIMESTAMP WHERE id = customer_id;
    
    RETURN order_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. Use Lock Timeouts

Configure appropriate timeouts to prevent transactions from waiting indefinitely.

```sql
-- Configure lock timeout settings
-- Global configuration (postgresql.conf)
-- lock_timeout = '30s'
-- deadlock_timeout = '1s'

-- Session-level timeout configuration
SET lock_timeout = '30s';
SET deadlock_timeout = '1s';
SET statement_timeout = '60s';

-- Function to demonstrate timeout-based deadlock prevention
CREATE OR REPLACE FUNCTION transfer_with_timeout(
    from_id INTEGER,
    to_id INTEGER,
    amount DECIMAL(15,2),
    timeout_seconds INTEGER DEFAULT 5
) RETURNS TABLE(
    success BOOLEAN,
    result_message TEXT,
    execution_time_ms DECIMAL(10,3)
) AS $$
DECLARE
    start_time TIMESTAMP := CURRENT_TIMESTAMP;
    from_balance DECIMAL(15,2);
    old_timeout TEXT;
BEGIN
    -- Set conservative timeout for this operation
    SELECT current_setting('lock_timeout') INTO old_timeout;
    EXECUTE format('SET LOCAL lock_timeout = ''%ss''', timeout_seconds);
    
    BEGIN
        -- Consistent lock ordering with timeout protection
        IF from_id < to_id THEN
            SELECT balance INTO from_balance 
            FROM accounts WHERE account_id = from_id FOR UPDATE;
            
            UPDATE accounts SET balance = balance + amount 
            WHERE account_id = to_id;
        ELSE
            UPDATE accounts SET balance = balance + amount 
            WHERE account_id = to_id;
            
            SELECT balance INTO from_balance 
            FROM accounts WHERE account_id = from_id FOR UPDATE;
        END IF;
        
        -- Validate and complete transfer
        IF from_balance < amount THEN
            RETURN QUERY SELECT 
                FALSE,
                format('Insufficient funds: %s < %s', from_balance, amount)::TEXT,
                (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000)::DECIMAL(10,3);
            RETURN;
        END IF;
        
        UPDATE accounts SET balance = balance - amount WHERE account_id = from_id;
        
        RETURN QUERY SELECT 
            TRUE,
            'Transfer completed successfully'::TEXT,
            (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000)::DECIMAL(10,3);
        
    EXCEPTION
        WHEN SQLSTATE '55P03' THEN -- Lock timeout
            RETURN QUERY SELECT 
                FALSE,
                format('Transfer timed out after %s seconds', timeout_seconds)::TEXT,
                (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000)::DECIMAL(10,3);
            
        WHEN SQLSTATE '40P01' THEN -- Deadlock
            RETURN QUERY SELECT 
                FALSE,
                'Transfer failed due to deadlock'::TEXT,
                (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000)::DECIMAL(10,3);
    END;
    
    -- Restore original timeout
    EXECUTE format('SET LOCAL lock_timeout = ''%s''', old_timeout);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM transfer_with_timeout(101, 102, 250.00, 10);
```

### 4. Use Advisory Locks Strategically

Implement application-level coordination using advisory locks.

```sql
-- Advisory lock-based coordination to prevent deadlocks
CREATE OR REPLACE FUNCTION safe_multi_table_operation(
    operation_id INTEGER,
    table_resources TEXT[],
    operation_data JSONB
) RETURNS TABLE(
    step_number INTEGER,
    step_description TEXT,
    lock_status VARCHAR(20),
    execution_result TEXT
) AS $$
DECLARE
    advisory_lock_id BIGINT;
    resource TEXT;
    lock_acquired BOOLEAN;
    all_locks_acquired BOOLEAN := TRUE;
    acquired_locks BIGINT[] := ARRAY[]::BIGINT[];
BEGIN
    -- Step 1: Generate consistent advisory lock ID for operation
    advisory_lock_id := hashtext('multi_table_op_' || operation_id::TEXT);
    
    RETURN QUERY SELECT 1, 'Generate operation lock ID', 'SUCCESS'::VARCHAR(20),
                        format('Advisory lock ID: %s', advisory_lock_id)::TEXT;
    
    -- Step 2: Acquire top-level operation lock
    SELECT pg_try_advisory_lock(advisory_lock_id) INTO lock_acquired;
    
    IF NOT lock_acquired THEN
        RETURN QUERY SELECT 2, 'Acquire operation lock', 'FAILED'::VARCHAR(20),
                            'Another instance of this operation is running'::TEXT;
        RETURN;
    END IF;
    
    acquired_locks := acquired_locks || advisory_lock_id;
    
    RETURN QUERY SELECT 2, 'Acquire operation lock', 'SUCCESS'::VARCHAR(20),
                        'Operation lock acquired'::TEXT;
    
    -- Step 3: Acquire resource-specific locks in sorted order
    FOREACH resource IN ARRAY (
        SELECT ARRAY_AGG(unnest ORDER BY unnest) 
        FROM unnest(table_resources)
    ) LOOP
        advisory_lock_id := hashtext('table_resource_' || resource);
        
        SELECT pg_try_advisory_lock(advisory_lock_id) INTO lock_acquired;
        
        IF NOT lock_acquired THEN
            all_locks_acquired := FALSE;
            RETURN QUERY SELECT 3, 
                               format('Acquire lock for %s', resource), 
                               'FAILED'::VARCHAR(20),
                               format('Resource %s is locked by another operation', resource)::TEXT;
        ELSE
            acquired_locks := acquired_locks || advisory_lock_id;
            RETURN QUERY SELECT 3,
                               format('Acquire lock for %s', resource),
                               'SUCCESS'::VARCHAR(20),
                               format('Lock acquired for resource %s', resource)::TEXT;
        END IF;
    END LOOP;
    
    -- Step 4: Perform operation if all locks acquired
    IF all_locks_acquired THEN
        -- Safe to perform multi-table operation
        RETURN QUERY SELECT 4, 'Execute multi-table operation', 'IN_PROGRESS'::VARCHAR(20),
                            'All locks acquired, executing operation'::TEXT;
        
        -- Simulate complex operation
        PERFORM pg_sleep(0.1);
        
        RETURN QUERY SELECT 4, 'Execute multi-table operation', 'SUCCESS'::VARCHAR(20),
                            format('Operation completed successfully with data: %s', operation_data)::TEXT;
    ELSE
        RETURN QUERY SELECT 4, 'Execute multi-table operation', 'SKIPPED'::VARCHAR(20),
                            'Operation skipped due to lock conflicts'::TEXT;
    END IF;
    
    -- Step 5: Release all acquired locks
    FOR i IN 1..array_length(acquired_locks, 1) LOOP
        PERFORM pg_advisory_unlock(acquired_locks[i]);
        RETURN QUERY SELECT 5,
                           format('Release lock %s', acquired_locks[i]),
                           'SUCCESS'::VARCHAR(20),
                           'Lock released'::TEXT;
    END LOOP;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Emergency cleanup: release any acquired locks
        FOR i IN 1..array_length(acquired_locks, 1) LOOP
            PERFORM pg_advisory_unlock(acquired_locks[i]);
        END LOOP;
        
        RETURN QUERY SELECT 999, 'Error cleanup', 'ERROR'::VARCHAR(20),
                            format('Exception: %s', SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM safe_multi_table_operation(
    12345,
    ARRAY['orders', 'inventory', 'customers'],
    '{"operation_type": "bulk_update", "batch_size": 1000}'::JSONB
);
```

## Advanced Prevention Techniques

### 1. Batch Processing Strategies

Implement batch processing to reduce lock contention and deadlock probability.

```sql
-- Deadlock-safe batch processing
CREATE OR REPLACE FUNCTION process_batch_updates_safe(
    batch_size INTEGER DEFAULT 100,
    operation_type VARCHAR(50) DEFAULT 'price_update'
) RETURNS TABLE(
    batch_number INTEGER,
    records_processed INTEGER,
    batch_status VARCHAR(20),
    processing_time_ms DECIMAL(10,3),
    deadlocks_encountered INTEGER
) AS $$
DECLARE
    current_batch INTEGER := 1;
    records_in_batch INTEGER;
    batch_start_time TIMESTAMP;
    deadlock_count INTEGER := 0;
    total_processed INTEGER := 0;
    max_retries INTEGER := 3;
    retry_attempt INTEGER;
    batch_success BOOLEAN;
BEGIN
    LOOP
        batch_start_time := CURRENT_TIMESTAMP;
        batch_success := FALSE;
        retry_attempt := 0;
        
        -- Retry batch processing with exponential backoff
        WHILE retry_attempt < max_retries AND NOT batch_success LOOP
            retry_attempt := retry_attempt + 1;
            
            BEGIN
                -- Process batch in consistent order to minimize deadlocks
                WITH batch_data AS (
                    SELECT id, current_price, category
                    FROM products 
                    WHERE id > total_processed
                    ORDER BY id -- Consistent ordering!
                    LIMIT batch_size
                    FOR UPDATE SKIP LOCKED -- Skip locked rows to avoid waiting
                )
                UPDATE products p
                SET 
                    current_price = CASE operation_type
                        WHEN 'price_update' THEN bd.current_price * 1.1
                        WHEN 'discount' THEN bd.current_price * 0.9
                        ELSE bd.current_price
                    END,
                    last_updated = CURRENT_TIMESTAMP
                FROM batch_data bd
                WHERE p.id = bd.id;
                
                -- Count records processed in this batch
                GET DIAGNOSTICS records_in_batch = ROW_COUNT;
                total_processed := total_processed + records_in_batch;
                batch_success := TRUE;
                
            EXCEPTION
                WHEN SQLSTATE '40P01' THEN -- Deadlock
                    deadlock_count := deadlock_count + 1;
                    -- Exponential backoff
                    PERFORM pg_sleep(0.1 * power(2, retry_attempt - 1));
                    
                WHEN OTHERS THEN
                    -- Log other errors and continue
                    RAISE NOTICE 'Batch % error: %', current_batch, SQLERRM;
                    batch_success := TRUE; -- Skip this batch
                    records_in_batch := 0;
            END;
        END LOOP;
        
        -- Return batch results
        RETURN QUERY SELECT 
            current_batch,
            COALESCE(records_in_batch, 0),
            CASE 
                WHEN batch_success AND records_in_batch > 0 THEN 'SUCCESS'
                WHEN batch_success AND records_in_batch = 0 THEN 'COMPLETE'
                ELSE 'FAILED'
            END::VARCHAR(20),
            (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - batch_start_time)) * 1000)::DECIMAL(10,3),
            deadlock_count;
        
        -- Exit if no more records to process
        EXIT WHEN records_in_batch = 0 OR records_in_batch < batch_size;
        
        current_batch := current_batch + 1;
        
        -- Brief pause between batches to reduce system load
        PERFORM pg_sleep(0.01);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM process_batch_updates_safe(50, 'price_update');
```

### 2. Optimistic Locking

Use optimistic concurrency control to avoid locks altogether.

```sql
-- Optimistic locking implementation
CREATE TABLE IF NOT EXISTS accounts_versioned (
    account_id INTEGER PRIMARY KEY,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimistic concurrency function
CREATE OR REPLACE FUNCTION transfer_money_optimistic(
    from_id INTEGER,
    to_id INTEGER,
    amount DECIMAL(15,2),
    max_retries INTEGER DEFAULT 5
) RETURNS TABLE(
    success BOOLEAN,
    attempt_count INTEGER,
    final_message TEXT,
    from_balance_after DECIMAL(15,2),
    to_balance_after DECIMAL(15,2)
) AS $$
DECLARE
    from_version INTEGER;
    to_version INTEGER;
    from_balance DECIMAL(15,2);
    to_balance DECIMAL(15,2);
    attempt INTEGER := 0;
    transfer_successful BOOLEAN := FALSE;
BEGIN
    WHILE attempt < max_retries AND NOT transfer_successful LOOP
        attempt := attempt + 1;
        
        -- Read current state without locks
        SELECT balance, version INTO from_balance, from_version
        FROM accounts_versioned WHERE account_id = from_id;
        
        SELECT balance, version INTO to_balance, to_version
        FROM accounts_versioned WHERE account_id = to_id;
        
        -- Validate transfer
        IF from_balance IS NULL THEN
            RETURN QUERY SELECT FALSE, attempt, 'From account not found'::TEXT, 0::DECIMAL, 0::DECIMAL;
            RETURN;
        END IF;
        
        IF to_balance IS NULL THEN
            RETURN QUERY SELECT FALSE, attempt, 'To account not found'::TEXT, 0::DECIMAL, 0::DECIMAL;
            RETURN;
        END IF;
        
        IF from_balance < amount THEN
            RETURN QUERY SELECT FALSE, attempt, 
                   format('Insufficient funds: %s < %s', from_balance, amount)::TEXT, 
                   from_balance, to_balance;
            RETURN;
        END IF;
        
        -- Attempt optimistic update
        BEGIN
            -- Update from account with version check
            UPDATE accounts_versioned 
            SET balance = balance - amount,
                version = version + 1,
                last_updated = CURRENT_TIMESTAMP
            WHERE account_id = from_id AND version = from_version;
            
            IF NOT FOUND THEN
                -- Concurrent modification detected, retry
                CONTINUE;
            END IF;
            
            -- Update to account with version check
            UPDATE accounts_versioned 
            SET balance = balance + amount,
                version = version + 1,
                last_updated = CURRENT_TIMESTAMP
            WHERE account_id = to_id AND version = to_version;
            
            IF NOT FOUND THEN
                -- Rollback from account update
                UPDATE accounts_versioned 
                SET balance = balance + amount,
                    version = version + 1
                WHERE account_id = from_id AND version = from_version + 1;
                
                -- Retry the entire operation
                CONTINUE;
            END IF;
            
            -- Success!
            transfer_successful := TRUE;
            
            -- Get final balances
            SELECT balance INTO from_balance 
            FROM accounts_versioned WHERE account_id = from_id;
            
            SELECT balance INTO to_balance 
            FROM accounts_versioned WHERE account_id = to_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Any error should trigger retry
                CONTINUE;
        END;
        
        -- Brief backoff between retries
        IF NOT transfer_successful THEN
            PERFORM pg_sleep(0.001 * attempt);
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        transfer_successful,
        attempt,
        CASE 
            WHEN transfer_successful THEN 'Transfer completed successfully'
            ELSE format('Transfer failed after %s attempts', attempt)
        END::TEXT,
        COALESCE(from_balance, 0::DECIMAL),
        COALESCE(to_balance, 0::DECIMAL);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM transfer_money_optimistic(101, 102, 150.00, 5);
```

### 3. Resource Pooling and Queuing

Implement queuing systems to serialize access to contended resources.

```sql
-- Resource queue management for deadlock prevention
CREATE TABLE IF NOT EXISTS resource_queue (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    operation_type VARCHAR(50),
    request_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by TEXT
);

-- Queue-based resource access
CREATE OR REPLACE FUNCTION queue_resource_operation(
    res_type VARCHAR(50),
    res_id INTEGER,
    op_type VARCHAR(50),
    op_data JSONB
) RETURNS TABLE(
    queue_id INTEGER,
    queue_position INTEGER,
    estimated_wait_time_seconds INTEGER,
    status VARCHAR(20)
) AS $$
DECLARE
    new_queue_id INTEGER;
    current_position INTEGER;
    avg_processing_time DECIMAL;
BEGIN
    -- Add request to queue
    INSERT INTO resource_queue (resource_type, resource_id, operation_type, request_data)
    VALUES (res_type, res_id, op_type, op_data)
    RETURNING id INTO new_queue_id;
    
    -- Calculate queue position
    SELECT COUNT(*) INTO current_position
    FROM resource_queue
    WHERE resource_type = res_type 
    AND resource_id = res_id 
    AND status = 'pending'
    AND id < new_queue_id;
    
    -- Estimate wait time based on historical data
    SELECT AVG(EXTRACT(EPOCH FROM (processed_at - requested_at))) INTO avg_processing_time
    FROM resource_queue
    WHERE resource_type = res_type
    AND status = 'completed'
    AND processed_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';
    
    RETURN QUERY SELECT 
        new_queue_id,
        current_position + 1, -- Position starts at 1
        (COALESCE(avg_processing_time, 30) * current_position)::INTEGER,
        'queued'::VARCHAR(20);
END;
$$ LANGUAGE plpgsql;

-- Queue processor (would run in background)
CREATE OR REPLACE FUNCTION process_resource_queue(
    max_items INTEGER DEFAULT 10
) RETURNS TABLE(
    queue_id INTEGER,
    resource_info TEXT,
    processing_result VARCHAR(20),
    processing_time_ms DECIMAL(10,3)
) AS $$
DECLARE
    queue_item RECORD;
    start_time TIMESTAMP;
    processing_success BOOLEAN;
BEGIN
    -- Process queued items in FIFO order
    FOR queue_item IN 
        SELECT * FROM resource_queue
        WHERE status = 'pending'
        ORDER BY requested_at
        LIMIT max_items
        FOR UPDATE SKIP LOCKED
    LOOP
        start_time := CURRENT_TIMESTAMP;
        processing_success := TRUE;
        
        BEGIN
            -- Mark as processing
            UPDATE resource_queue 
            SET status = 'processing',
                processed_at = CURRENT_TIMESTAMP,
                processed_by = current_user
            WHERE id = queue_item.id;
            
            -- Perform the actual operation (serialized access prevents deadlocks)
            CASE queue_item.operation_type
                WHEN 'balance_update' THEN
                    UPDATE accounts 
                    SET balance = balance + (queue_item.request_data->>'amount')::DECIMAL
                    WHERE account_id = queue_item.resource_id;
                    
                WHEN 'inventory_update' THEN
                    UPDATE products 
                    SET current_stock = current_stock + (queue_item.request_data->>'quantity')::INTEGER
                    WHERE id = queue_item.resource_id;
                    
                WHEN 'status_change' THEN
                    UPDATE orders 
                    SET status = queue_item.request_data->>'new_status'
                    WHERE id = queue_item.resource_id;
                    
                ELSE
                    processing_success := FALSE;
            END CASE;
            
            -- Mark as completed
            UPDATE resource_queue 
            SET status = CASE 
                WHEN processing_success THEN 'completed' 
                ELSE 'failed' 
            END
            WHERE id = queue_item.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                UPDATE resource_queue 
                SET status = 'failed',
                    request_data = request_data || jsonb_build_object('error', SQLERRM)
                WHERE id = queue_item.id;
                processing_success := FALSE;
        END;
        
        RETURN QUERY SELECT 
            queue_item.id,
            format('%s:%s', queue_item.resource_type, queue_item.resource_id)::TEXT,
            CASE 
                WHEN processing_success THEN 'SUCCESS' 
                ELSE 'FAILED' 
            END::VARCHAR(20),
            (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000)::DECIMAL(10,3);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM queue_resource_operation('account', 101, 'balance_update', '{"amount": 250.00}');
SELECT * FROM process_resource_queue(5);
```

## Configuration and Monitoring

### 1. Optimal Configuration Settings

```sql
-- PostgreSQL configuration recommendations for deadlock prevention
CREATE OR REPLACE VIEW deadlock_prevention_config AS
SELECT 
    'deadlock_timeout' as parameter,
    '1s' as recommended_value,
    current_setting('deadlock_timeout') as current_value,
    'Time to wait before checking for deadlocks' as description,
    CASE 
        WHEN current_setting('deadlock_timeout') = '1s' THEN 'OPTIMAL'
        WHEN current_setting('deadlock_timeout')::INTERVAL < '1s'::INTERVAL THEN 'TOO_AGGRESSIVE'
        ELSE 'TOO_CONSERVATIVE'
    END as status

UNION ALL

SELECT 
    'lock_timeout' as parameter,
    '30s' as recommended_value,
    current_setting('lock_timeout') as current_value,
    'Maximum time to wait for a lock' as description,
    CASE 
        WHEN current_setting('lock_timeout') = '30s' THEN 'OPTIMAL'
        WHEN current_setting('lock_timeout') = '0' THEN 'DISABLED'
        WHEN current_setting('lock_timeout')::INTERVAL < '10s'::INTERVAL THEN 'TOO_AGGRESSIVE'
        ELSE 'ACCEPTABLE'
    END as status

UNION ALL

SELECT 
    'statement_timeout' as parameter,
    '60s' as recommended_value,
    current_setting('statement_timeout') as current_value,
    'Maximum statement execution time' as description,
    CASE 
        WHEN current_setting('statement_timeout') = '0' THEN 'DISABLED'
        WHEN current_setting('statement_timeout')::INTERVAL < '30s'::INTERVAL THEN 'TOO_AGGRESSIVE'
        WHEN current_setting('statement_timeout')::INTERVAL > '300s'::INTERVAL THEN 'TOO_PERMISSIVE'
        ELSE 'ACCEPTABLE'
    END as status

UNION ALL

SELECT 
    'log_lock_waits' as parameter,
    'on' as recommended_value,
    current_setting('log_lock_waits') as current_value,
    'Log long lock waits for monitoring' as description,
    CASE 
        WHEN current_setting('log_lock_waits') = 'on' THEN 'OPTIMAL'
        ELSE 'SHOULD_ENABLE'
    END as status;

-- Usage
SELECT * FROM deadlock_prevention_config;
```

### 2. Deadlock Prevention Monitoring

```sql
-- Comprehensive monitoring for deadlock prevention effectiveness
CREATE OR REPLACE FUNCTION monitor_deadlock_prevention()
RETURNS TABLE(
    metric_category VARCHAR(30),
    metric_name VARCHAR(40),
    current_value NUMERIC,
    threshold_value NUMERIC,
    status VARCHAR(15),
    recommendation TEXT
) AS $$
DECLARE
    current_deadlocks INTEGER;
    current_lock_waits INTEGER;
    avg_transaction_time DECIMAL;
    long_running_transactions INTEGER;
    lock_contention_ratio DECIMAL;
BEGIN
    -- Get current deadlock count from logs
    SELECT COUNT(*) INTO current_deadlocks
    FROM deadlock_log
    WHERE occurred_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';
    
    -- Get current lock waits
    SELECT COUNT(*) INTO current_lock_waits
    FROM pg_locks
    WHERE NOT granted;
    
    -- Get average transaction time
    SELECT AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - xact_start))) INTO avg_transaction_time
    FROM pg_stat_activity
    WHERE state = 'active' AND xact_start IS NOT NULL;
    
    -- Count long-running transactions
    SELECT COUNT(*) INTO long_running_transactions
    FROM pg_stat_activity
    WHERE state = 'active' 
    AND xact_start < CURRENT_TIMESTAMP - INTERVAL '30 seconds';
    
    -- Calculate lock contention ratio
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE NOT granted) * 100.0 / COUNT(*))
            ELSE 0 
        END
    INTO lock_contention_ratio
    FROM pg_locks;
    
    -- Return monitoring results
    RETURN QUERY VALUES
    ('Deadlocks', 'Hourly Count', current_deadlocks::NUMERIC, 5::NUMERIC,
     CASE WHEN current_deadlocks <= 5 THEN 'GOOD' ELSE 'WARNING' END::VARCHAR(15),
     CASE WHEN current_deadlocks <= 5 THEN 'Deadlock rate acceptable' 
          ELSE 'Review transaction patterns and implement better lock ordering' END::TEXT);
    
    RETURN QUERY VALUES
    ('Lock Waits', 'Current Count', current_lock_waits::NUMERIC, 10::NUMERIC,
     CASE WHEN current_lock_waits <= 10 THEN 'GOOD' ELSE 'WARNING' END::VARCHAR(15),
     CASE WHEN current_lock_waits <= 10 THEN 'Lock contention minimal'
          ELSE 'High lock contention - consider optimizing transactions' END::TEXT);
    
    RETURN QUERY VALUES
    ('Performance', 'Avg Transaction Time (s)', ROUND(COALESCE(avg_transaction_time, 0), 3)::NUMERIC, 5::NUMERIC,
     CASE WHEN COALESCE(avg_transaction_time, 0) <= 5 THEN 'GOOD' ELSE 'WARNING' END::VARCHAR(15),
     CASE WHEN COALESCE(avg_transaction_time, 0) <= 5 THEN 'Transaction duration acceptable'
          ELSE 'Long transactions increase deadlock risk - optimize or break down' END::TEXT);
    
    RETURN QUERY VALUES
    ('Performance', 'Long Running Transactions', long_running_transactions::NUMERIC, 5::NUMERIC,
     CASE WHEN long_running_transactions <= 5 THEN 'GOOD' ELSE 'WARNING' END::VARCHAR(15),
     CASE WHEN long_running_transactions <= 5 THEN 'Few long-running transactions'
          ELSE 'Many long transactions - review for optimization opportunities' END::TEXT);
    
    RETURN QUERY VALUES
    ('Contention', 'Lock Contention %', ROUND(lock_contention_ratio, 2)::NUMERIC, 10::NUMERIC,
     CASE WHEN lock_contention_ratio <= 10 THEN 'GOOD' ELSE 'WARNING' END::VARCHAR(15),
     CASE WHEN lock_contention_ratio <= 10 THEN 'Low lock contention'
          ELSE 'High lock contention - implement deadlock prevention strategies' END::TEXT);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM monitor_deadlock_prevention();
```

### 3. Automated Deadlock Prevention Alerts

```sql
-- Automated alerting system for deadlock prevention
CREATE OR REPLACE FUNCTION check_deadlock_prevention_health()
RETURNS TABLE(
    alert_level VARCHAR(10),
    alert_category VARCHAR(30),
    alert_message TEXT,
    recommended_action TEXT,
    alert_timestamp TIMESTAMP
) AS $$
DECLARE
    recent_deadlocks INTEGER;
    current_waits INTEGER;
    long_transactions INTEGER;
    contention_pct DECIMAL;
    alert_time TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- Gather metrics
    SELECT COUNT(*) INTO recent_deadlocks
    FROM deadlock_log
    WHERE occurred_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes';
    
    SELECT COUNT(*) INTO current_waits
    FROM pg_locks WHERE NOT granted;
    
    SELECT COUNT(*) INTO long_transactions
    FROM pg_stat_activity
    WHERE state = 'active' 
    AND xact_start < CURRENT_TIMESTAMP - INTERVAL '60 seconds';
    
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE NOT granted) * 100.0 / COUNT(*))
            ELSE 0 
        END
    INTO contention_pct
    FROM pg_locks;
    
    -- Critical alerts
    IF recent_deadlocks >= 3 THEN
        RETURN QUERY SELECT 
            'CRITICAL'::VARCHAR(10),
            'Deadlock Spike'::VARCHAR(30),
            format('%s deadlocks in last 10 minutes', recent_deadlocks)::TEXT,
            'Immediate investigation required - check application transaction patterns'::TEXT,
            alert_time;
    END IF;
    
    IF current_waits >= 20 THEN
        RETURN QUERY SELECT 
            'CRITICAL'::VARCHAR(10),
            'Lock Contention'::VARCHAR(30),
            format('%s sessions waiting for locks', current_waits)::TEXT,
            'Check for long-running transactions and blocking queries'::TEXT,
            alert_time;
    END IF;
    
    -- Warning alerts
    IF recent_deadlocks >= 1 THEN
        RETURN QUERY SELECT 
            'WARNING'::VARCHAR(10),
            'Deadlock Detected'::VARCHAR(30),
            format('%s deadlock(s) in last 10 minutes', recent_deadlocks)::TEXT,
            'Monitor for patterns and consider implementing prevention strategies'::TEXT,
            alert_time;
    END IF;
    
    IF long_transactions >= 10 THEN
        RETURN QUERY SELECT 
            'WARNING'::VARCHAR(10),
            'Long Transactions'::VARCHAR(30),
            format('%s transactions running >60 seconds', long_transactions)::TEXT,
            'Review long-running transactions for optimization opportunities'::TEXT,
            alert_time;
    END IF;
    
    IF contention_pct >= 15 THEN
        RETURN QUERY SELECT 
            'WARNING'::VARCHAR(10),
            'High Lock Contention'::VARCHAR(30),
            format('%.1f%% of locks are waiting', contention_pct)::TEXT,
            'Implement consistent lock ordering and reduce transaction scope'::TEXT,
            alert_time;
    END IF;
    
    -- Info alerts
    IF recent_deadlocks = 0 AND current_waits < 5 AND long_transactions < 5 THEN
        RETURN QUERY SELECT 
            'INFO'::VARCHAR(10),
            'System Health'::VARCHAR(30),
            'Deadlock prevention strategies working effectively'::TEXT,
            'Continue monitoring and maintain current practices'::TEXT,
            alert_time;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Usage for monitoring dashboard
SELECT * FROM check_deadlock_prevention_health();
```

## Best Practices Summary

### 1. Development Guidelines

```sql
-- Development best practices for deadlock prevention
CREATE OR REPLACE FUNCTION deadlock_prevention_guidelines()
RETURNS TABLE(
    category VARCHAR(30),
    practice VARCHAR(50),
    importance VARCHAR(10),
    description TEXT,
    example_implementation TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Lock Ordering', 'Consistent Resource Access', 'CRITICAL',
     'Always access resources in same order across transactions',
     'ORDER BY resource_id when locking multiple resources'),
    
    ('Transaction Design', 'Minimize Lock Duration', 'HIGH',
     'Keep transactions short and avoid long operations while holding locks',
     'Pre-calculate data before starting transaction'),
    
    ('Error Handling', 'Implement Retry Logic', 'HIGH',
     'Handle SQLSTATE 40P01 with exponential backoff',
     'Use pg_sleep(0.1 * power(2, attempt)) for backoff'),
    
    ('Configuration', 'Set Appropriate Timeouts', 'MEDIUM',
     'Configure lock_timeout and deadlock_timeout properly',
     'SET lock_timeout = ''30s''; SET deadlock_timeout = ''1s'''),
    
    ('Monitoring', 'Track Deadlock Patterns', 'MEDIUM',
     'Monitor and log deadlock occurrences for analysis',
     'Log to deadlock_log table with operation context'),
    
    ('Alternative Patterns', 'Consider Optimistic Locking', 'MEDIUM',
     'Use version-based optimistic concurrency for high-contention scenarios',
     'UPDATE table SET col = val, version = version + 1 WHERE id = ? AND version = ?'),
    
    ('Resource Management', 'Use Advisory Locks', 'LOW',
     'Coordinate application-level resources with advisory locks',
     'SELECT pg_advisory_lock(resource_hash) before critical sections'),
    
    ('Batch Processing', 'Process in Sorted Order', 'MEDIUM',
     'Process batch operations in consistent order',
     'ORDER BY id when processing batches of records');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM deadlock_prevention_guidelines() ORDER BY importance DESC;
```

## Summary

**Deadlock Prevention Strategies:**

**Primary Techniques:**
- **Consistent Lock Ordering**: Always acquire locks in same order (e.g., by ID)
- **Minimize Transaction Scope**: Keep transactions short and focused
- **Use Timeouts**: Configure `lock_timeout` and `deadlock_timeout` appropriately
- **Advisory Locks**: Coordinate access to application-level resources

**Advanced Techniques:**
- **Optimistic Locking**: Use version numbers to avoid locks
- **Batch Processing**: Process records in sorted order with SKIP LOCKED
- **Resource Queuing**: Serialize access to highly contended resources
- **Retry Logic**: Implement exponential backoff for deadlock recovery

**Configuration Best Practices:**
- **deadlock_timeout**: Set to 1s for quick detection
- **lock_timeout**: Set to 30s to prevent indefinite waiting
- **log_lock_waits**: Enable to monitor lock contention
- **statement_timeout**: Set reasonable limits for statement execution

**Development Guidelines:**
- Design transactions to access resources in consistent order
- Pre-calculate data outside transactions when possible
- Use `FOR UPDATE SKIP LOCKED` for queue-like processing
- Implement proper error handling for SQLSTATE 40P01
- Monitor deadlock patterns and optimize frequently conflicting operations

**Monitoring and Alerting:**
- Track deadlock frequency and patterns
- Monitor lock wait times and contention ratios
- Alert on excessive deadlocks or long-running transactions
- Analyze deadlock logs to identify optimization opportunities

**Performance Considerations:**
- Balance deadlock prevention with system performance
- Avoid over-aggressive timeouts that cause unnecessary failures
- Consider application-level concurrency patterns
- Test deadlock prevention strategies under realistic load

**When to Use Each Approach:**
- **Consistent Ordering**: Always use for multi-resource transactions
- **Optimistic Locking**: High-contention scenarios with low conflict rates
- **Advisory Locks**: Complex application-level coordination
- **Batch Processing**: Bulk operations on large datasets
- **Resource Queuing**: Serializing access to critical shared resources

Effective deadlock prevention requires combining multiple strategies based on your application's specific access patterns, concurrency requirements, and performance constraints. The key is to implement these techniques proactively during development rather than reactively after deadlocks become a problem in production.