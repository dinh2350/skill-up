# 118. What is row-level locking?

**Row-level locking** is PostgreSQL's fine-grained concurrency control mechanism that allows multiple transactions to access different rows of the same table simultaneously while protecting individual rows from concurrent modifications. This granular approach maximizes concurrency by locking only the specific rows being accessed rather than entire tables.

## Core Concepts

### MVCC Integration
Row-level locking works seamlessly with PostgreSQL's Multi-Version Concurrency Control (MVCC) system:
- **Snapshot Isolation**: Each transaction sees a consistent snapshot of data
- **Version Management**: Multiple versions of rows can coexist
- **Lock Optimization**: Locks are only needed when explicit row access control is required
- **Deadlock Prevention**: MVCC reduces the need for long-held locks

### Lock Acquisition
Row-level locks are acquired through:
- **Explicit Locking**: Using SELECT FOR UPDATE/SHARE clauses
- **Implicit Locking**: Automatic during UPDATE/DELETE operations
- **Transaction Scope**: Locks held until transaction commit or rollback

## Row Lock Modes

### 1. FOR UPDATE - Exclusive Row Lock

```sql
-- Comprehensive FOR UPDATE demonstration
CREATE TABLE IF NOT EXISTS order_items (
    order_id INTEGER,
    item_id INTEGER,
    quantity INTEGER,
    reserved_qty INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    PRIMARY KEY (order_id, item_id)
);

-- Insert test data
INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES 
    (1001, 1, 100, 29.99),
    (1001, 2, 50, 49.99),
    (1002, 1, 75, 29.99),
    (1002, 3, 25, 19.99),
    (1003, 2, 200, 49.99)
ON CONFLICT DO NOTHING;

-- Function to demonstrate FOR UPDATE behavior
CREATE OR REPLACE FUNCTION demonstrate_for_update()
RETURNS TABLE(
    scenario_name VARCHAR(50),
    lock_behavior TEXT,
    concurrency_impact VARCHAR(20),
    use_case_examples TEXT[],
    performance_notes TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Basic FOR UPDATE',
     'Exclusive lock on selected rows prevents any other FOR UPDATE or FOR SHARE',
     'RESTRICTIVE',
     ARRAY[
         'Inventory reservation',
         'Account balance updates', 
         'Seat booking systems',
         'Stock trading platforms'
     ],
     'Strongest consistency, lowest concurrency'),
    
    ('FOR UPDATE NOWAIT',
     'Immediately fails if row is already locked instead of waiting',
     'NON-BLOCKING',
     ARRAY[
         'High-throughput systems',
         'Retry-based algorithms',
         'Real-time applications',
         'Lock timeout avoidance'
     ],
     'Prevents lock wait cascades, requires error handling'),
    
    ('FOR UPDATE SKIP LOCKED',
     'Skips rows that are already locked by other transactions',
     'OPTIMIZED',
     ARRAY[
         'Job queue processing',
         'Batch processing',
         'Work distribution systems',
         'Parallel processing'
     ],
     'Excellent for worker patterns, ensures progress'),
    
    ('FOR UPDATE OF table',
     'Locks rows only in specified tables when using joins',
     'SELECTIVE',
     ARRAY[
         'Multi-table updates',
         'Join-based reservations',
         'Complex transaction logic',
         'Selective locking'
     ],
     'Reduces lock scope in complex queries');
END;
$$ LANGUAGE plpgsql;

-- Practical FOR UPDATE examples
CREATE OR REPLACE FUNCTION inventory_reservation_example(
    p_order_id INTEGER,
    p_item_id INTEGER,
    p_reserve_qty INTEGER
) RETURNS TABLE(
    success BOOLEAN,
    available_qty INTEGER,
    reserved_qty INTEGER,
    message TEXT
) AS $$
DECLARE
    current_available INTEGER;
    current_reserved INTEGER;
    sufficient_stock BOOLEAN;
BEGIN
    -- Lock the specific inventory row
    SELECT quantity, reserved_qty
    INTO current_available, current_reserved
    FROM order_items
    WHERE order_id = p_order_id AND item_id = p_item_id
    FOR UPDATE;
    
    -- Check if sufficient stock is available
    sufficient_stock := (current_available - current_reserved) >= p_reserve_qty;
    
    IF sufficient_stock THEN
        -- Reserve the inventory
        UPDATE order_items
        SET reserved_qty = reserved_qty + p_reserve_qty,
            last_updated = CURRENT_TIMESTAMP,
            version = version + 1
        WHERE order_id = p_order_id AND item_id = p_item_id;
        
        -- Return success
        RETURN QUERY SELECT 
            TRUE,
            current_available,
            current_reserved + p_reserve_qty,
            format('Successfully reserved %s units', p_reserve_qty)::TEXT;
    ELSE
        -- Insufficient stock
        RETURN QUERY SELECT 
            FALSE,
            current_available,
            current_reserved,
            format('Insufficient stock. Available: %s, Requested: %s', 
                   current_available - current_reserved, p_reserve_qty)::TEXT;
    END IF;
    
EXCEPTION
    WHEN no_data_found THEN
        RETURN QUERY SELECT 
            FALSE,
            0::INTEGER,
            0::INTEGER,
            'Item not found'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_for_update();
-- Example: Reserve 10 units of item 1 in order 1001
SELECT * FROM inventory_reservation_example(1001, 1, 10);
```

### 2. FOR SHARE - Shared Row Lock

```sql
-- FOR SHARE demonstration and use cases
CREATE OR REPLACE FUNCTION demonstrate_for_share()
RETURNS TABLE(
    sharing_scenario VARCHAR(50),
    lock_characteristics TEXT,
    concurrency_benefits TEXT,
    typical_use_cases TEXT[],
    compatibility_notes TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Multiple FOR SHARE',
     'Multiple transactions can hold FOR SHARE on same rows simultaneously',
     'High read concurrency with protection against deletions',
     ARRAY[
         'Reference data validation',
         'Multi-step workflows',
         'Audit trail creation',
         'Report generation with consistency'
     ],
     'Compatible with other FOR SHARE, blocks FOR UPDATE'),
    
    ('FOR SHARE vs Reads',
     'Regular SELECT statements not affected by FOR SHARE locks',
     'Normal read performance maintained',
     ARRAY[
         'Mixed read/write workloads',
         'Reporting during transactions',
         'Background processing',
         'Analytics queries'
     ],
     'MVCC ensures read queries see consistent snapshots'),
    
    ('FOR SHARE NOWAIT',
     'Fails immediately if conflicting lock exists',
     'Prevents cascading waits in shared scenarios',
     ARRAY[
         'Non-blocking validations',
         'Optional consistency checks',
         'Timeout-sensitive operations',
         'Circuit breaker patterns'
     ],
     'Useful for optional consistency enforcement'),
    
    ('FOR SHARE SKIP LOCKED',
     'Processes only unlocked rows in batch operations',
     'Enables parallel processing of shared resources',
     ARRAY[
         'Parallel validation',
         'Distributed processing',
         'Queue processing',
         'Bulk operations'
     ],
     'Excellent for worker pool patterns');
END;
$$ LANGUAGE plpgsql;

-- FOR SHARE practical example: Multi-step order validation
CREATE OR REPLACE FUNCTION validate_order_integrity(
    p_order_id INTEGER
) RETURNS TABLE(
    validation_step VARCHAR(30),
    step_result BOOLEAN,
    details TEXT,
    locked_items INTEGER
) AS $$
DECLARE
    order_total DECIMAL(10,2);
    item_count INTEGER;
    validation_success BOOLEAN := TRUE;
BEGIN
    -- Step 1: Lock order items for validation (allows concurrent validations)
    SELECT COUNT(*)
    INTO item_count
    FROM order_items
    WHERE order_id = p_order_id
    FOR SHARE;
    
    RETURN QUERY SELECT 
        'Item Locking'::VARCHAR(30),
        (item_count > 0),
        format('Locked %s items for validation', item_count)::TEXT,
        item_count;
    
    -- Step 2: Validate inventory availability
    WITH availability_check AS (
        SELECT 
            item_id,
            quantity,
            reserved_qty,
            (quantity - reserved_qty) as available,
            CASE WHEN (quantity - reserved_qty) > 0 THEN TRUE ELSE FALSE END as in_stock
        FROM order_items
        WHERE order_id = p_order_id
        FOR SHARE  -- Prevent deletion during validation
    )
    SELECT bool_and(in_stock) INTO validation_success
    FROM availability_check;
    
    RETURN QUERY SELECT 
        'Availability Check'::VARCHAR(30),
        validation_success,
        CASE 
            WHEN validation_success THEN 'All items available'
            ELSE 'Some items out of stock'
        END::TEXT,
        item_count;
    
    -- Step 3: Calculate totals (still under shared lock protection)
    SELECT SUM(quantity * price)
    INTO order_total
    FROM order_items
    WHERE order_id = p_order_id;
    
    RETURN QUERY SELECT 
        'Total Calculation'::VARCHAR(30),
        (order_total > 0),
        format('Order total: $%.2f', COALESCE(order_total, 0))::TEXT,
        item_count;
    
    -- Note: FOR SHARE locks released automatically at transaction end
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_for_share();
SELECT * FROM validate_order_integrity(1001);
```

### 3. FOR NO KEY UPDATE - Moderate Exclusivity

```sql
-- FOR NO KEY UPDATE demonstration
CREATE OR REPLACE FUNCTION demonstrate_for_no_key_update()
RETURNS TABLE(
    scenario_description VARCHAR(60),
    lock_specifics TEXT,
    concurrency_advantage TEXT,
    application_examples TEXT[],
    key_considerations TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Non-Key Column Updates',
     'Allows concurrent FOR KEY SHARE locks while preventing FOR UPDATE',
     'Better concurrency when primary key unchanged',
     ARRAY[
         'Status updates',
         'Timestamp modifications',
         'Counter increments',
         'Metadata updates'
     ],
     'Use when primary/unique keys remain unchanged'),
    
    ('Foreign Key Compatibility',
     'Does not conflict with foreign key references using FOR KEY SHARE',
     'Enables concurrent reference checking during updates',
     ARRAY[
         'Order detail updates',
         'User profile modifications',
         'Product information updates',
         'Configuration changes'
     ],
     'Maintains referential integrity with better performance'),
    
    ('Reduced Lock Contention',
     'Less restrictive than FOR UPDATE for non-key modifications',
     'Higher throughput for common update patterns',
     ARRAY[
         'Activity tracking',
         'Statistics updates',
         'Log entry modifications',
         'Cache invalidation'
     ],
     'Ideal for frequently updated non-key columns'),
    
    ('Index Maintenance Efficiency',
     'Reduces index lock contention for unchanged key columns',
     'Better performance with heavy index usage',
     ARRAY[
         'Audit field updates',
         'Version number increments',
         'Last modified tracking',
         'Processing status changes'
     ],
     'Particularly beneficial with many indexes on key columns');
END;
$$ LANGUAGE plpgsql;

-- Practical example: Status tracking system
CREATE OR REPLACE FUNCTION update_processing_status(
    p_order_id INTEGER,
    p_item_id INTEGER,
    p_new_status VARCHAR(50)
) RETURNS TABLE(
    operation_result VARCHAR(20),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    concurrent_operations_allowed BOOLEAN,
    performance_notes TEXT
) AS $$
DECLARE
    old_status VARCHAR(50);
    status_column_exists BOOLEAN;
BEGIN
    -- Check if we need to add status column for demo
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'status'
    ) INTO status_column_exists;
    
    IF NOT status_column_exists THEN
        ALTER TABLE order_items ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    -- Use FOR NO KEY UPDATE since we're not changing primary key
    SELECT status INTO old_status
    FROM order_items
    WHERE order_id = p_order_id AND item_id = p_item_id
    FOR NO KEY UPDATE;
    
    -- Update the status (non-key column)
    UPDATE order_items
    SET status = p_new_status,
        last_updated = CURRENT_TIMESTAMP
    WHERE order_id = p_order_id AND item_id = p_item_id;
    
    RETURN QUERY SELECT 
        'SUCCESS'::VARCHAR(20),
        COALESCE(old_status, 'unknown')::VARCHAR(50),
        p_new_status::VARCHAR(50),
        TRUE,  -- FOR KEY SHARE operations can run concurrently
        'FOR NO KEY UPDATE allows concurrent foreign key checks'::TEXT;
    
EXCEPTION
    WHEN no_data_found THEN
        RETURN QUERY SELECT 
            'NOT_FOUND'::VARCHAR(20),
            'N/A'::VARCHAR(50),
            'N/A'::VARCHAR(50),
            FALSE,
            'Order item not found'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_for_no_key_update();
SELECT * FROM update_processing_status(1001, 1, 'processing');
```

### 4. FOR KEY SHARE - Minimal Protection

```sql
-- FOR KEY SHARE demonstration
CREATE OR REPLACE FUNCTION demonstrate_for_key_share()
RETURNS TABLE(
    protection_aspect VARCHAR(50),
    lock_behavior TEXT,
    concurrency_impact VARCHAR(20),
    primary_use_cases TEXT[],
    performance_characteristics TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Primary Key Protection',
     'Prevents FOR UPDATE but allows FOR NO KEY UPDATE',
     'MINIMAL_IMPACT',
     ARRAY[
         'Foreign key enforcement',
         'Reference validation',
         'Key existence checks',
         'Referential integrity'
     ],
     'Lowest overhead row lock, maximum concurrency'),
    
    ('Foreign Key References',
     'Standard lock used by foreign key constraint checking',
     'AUTOMATIC',
     ARRAY[
         'Parent table protection during child inserts',
         'Reference table validation',
         'Cascade operation prevention',
         'Integrity constraint enforcement'
     ],
     'Automatically managed by PostgreSQL constraint system'),
    
    ('Concurrent Operations',
     'Compatible with most other operations except FOR UPDATE',
     'HIGH_CONCURRENCY',
     ARRAY[
         'Read-heavy applications',
         'Multi-tenant systems',
         'Reference data access',
         'Lookup table operations'
     ],
     'Enables highest level of concurrent access'),
    
    ('Key Change Prevention',
     'Specifically prevents primary/unique key modifications',
     'SELECTIVE',
     ARRAY[
         'Audit trail consistency',
         'External reference stability',
         'Cache key protection',
         'API contract enforcement'
     ],
     'Minimal lock for specific use cases');
END;
$$ LANGUAGE plpgsql;

-- Foreign key demonstration with FOR KEY SHARE
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2)
);

-- Insert test data
INSERT INTO customers (customer_name, email)
VALUES 
    ('Alice Johnson', 'alice@example.com'),
    ('Bob Smith', 'bob@example.com'),
    ('Carol Davis', 'carol@example.com')
ON CONFLICT DO NOTHING;

-- Function to demonstrate FOR KEY SHARE in foreign key context
CREATE OR REPLACE FUNCTION demonstrate_foreign_key_locking(
    p_customer_id INTEGER,
    p_order_amount DECIMAL(10,2)
) RETURNS TABLE(
    operation_step VARCHAR(40),
    lock_acquired VARCHAR(30),
    affected_table VARCHAR(20),
    concurrency_notes TEXT
) AS $$
DECLARE
    new_order_id INTEGER;
BEGIN
    -- Step 1: Validate customer exists (acquires FOR KEY SHARE automatically)
    IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = p_customer_id) THEN
        RETURN QUERY SELECT 
            'Customer Validation'::VARCHAR(40),
            'None (not found)'::VARCHAR(30),
            'customers'::VARCHAR(20),
            'No lock acquired - customer does not exist'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 
        'Customer Key Share Lock'::VARCHAR(40),
        'FOR KEY SHARE'::VARCHAR(30),
        'customers'::VARCHAR(20),
        'Automatic lock by foreign key constraint - prevents customer_id changes'::TEXT;
    
    -- Step 2: Insert order (this automatically acquires FOR KEY SHARE on parent)
    INSERT INTO orders (customer_id, total_amount)
    VALUES (p_customer_id, p_order_amount)
    RETURNING order_id INTO new_order_id;
    
    RETURN QUERY SELECT 
        'Order Creation'::VARCHAR(40),
        'ROW EXCLUSIVE'::VARCHAR(30),
        'orders'::VARCHAR(20),
        format('New order %s created, customer protected by FOR KEY SHARE', new_order_id)::TEXT;
    
    -- Step 3: Demonstrate concurrent operations still possible
    RETURN QUERY SELECT 
        'Concurrent Operations Check'::VARCHAR(40),
        'Analysis'::VARCHAR(30),
        'customers'::VARCHAR(20),
        'Customer profile updates (FOR NO KEY UPDATE) still possible during order creation'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_for_key_share();
SELECT * FROM demonstrate_foreign_key_locking(1, 199.99);
```

## Row Lock Interactions and Compatibility

### Lock Compatibility Matrix

```sql
-- Comprehensive row lock compatibility analysis
CREATE OR REPLACE FUNCTION analyze_row_lock_compatibility()
RETURNS TABLE(
    lock_mode_1 VARCHAR(25),
    lock_mode_2 VARCHAR(25),
    compatible BOOLEAN,
    conflict_type VARCHAR(20),
    resolution_pattern VARCHAR(30),
    use_case_scenario TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    -- FOR UPDATE interactions
    ('FOR UPDATE', 'FOR UPDATE', FALSE, 'EXCLUSIVE_CONFLICT', 'SEQUENTIAL_ACCESS', 'Two transactions modifying same row'),
    ('FOR UPDATE', 'FOR NO KEY UPDATE', FALSE, 'EXCLUSIVE_CONFLICT', 'SEQUENTIAL_ACCESS', 'Key vs non-key modification conflict'),
    ('FOR UPDATE', 'FOR SHARE', FALSE, 'EXCLUSIVE_CONFLICT', 'SEQUENTIAL_ACCESS', 'Exclusive vs shared access conflict'),
    ('FOR UPDATE', 'FOR KEY SHARE', FALSE, 'EXCLUSIVE_CONFLICT', 'SEQUENTIAL_ACCESS', 'Exclusive vs key protection conflict'),
    
    -- FOR NO KEY UPDATE interactions
    ('FOR NO KEY UPDATE', 'FOR NO KEY UPDATE', FALSE, 'UPDATE_CONFLICT', 'SEQUENTIAL_ACCESS', 'Multiple non-key updates on same row'),
    ('FOR NO KEY UPDATE', 'FOR SHARE', FALSE, 'UPDATE_CONFLICT', 'SEQUENTIAL_ACCESS', 'Non-key update vs shared access'),
    ('FOR NO KEY UPDATE', 'FOR KEY SHARE', TRUE, 'NO_CONFLICT', 'CONCURRENT_ACCESS', 'Non-key update with key protection - COMPATIBLE'),
    
    -- FOR SHARE interactions
    ('FOR SHARE', 'FOR SHARE', TRUE, 'NO_CONFLICT', 'CONCURRENT_ACCESS', 'Multiple shared locks - fully compatible'),
    ('FOR SHARE', 'FOR KEY SHARE', TRUE, 'NO_CONFLICT', 'CONCURRENT_ACCESS', 'Shared access with key protection'),
    
    -- FOR KEY SHARE interactions
    ('FOR KEY SHARE', 'FOR KEY SHARE', TRUE, 'NO_CONFLICT', 'CONCURRENT_ACCESS', 'Multiple key protections - fully compatible'),
    
    -- Implicit locks (UPDATE/DELETE)
    ('Implicit UPDATE', 'FOR UPDATE', FALSE, 'EXCLUSIVE_CONFLICT', 'SEQUENTIAL_ACCESS', 'UPDATE statement vs explicit lock'),
    ('Implicit UPDATE', 'FOR SHARE', FALSE, 'UPDATE_CONFLICT', 'SEQUENTIAL_ACCESS', 'UPDATE vs shared access'),
    ('Implicit DELETE', 'FOR KEY SHARE', FALSE, 'DELETE_CONFLICT', 'SEQUENTIAL_ACCESS', 'DELETE vs key protection'),
    
    -- Special cases
    ('Regular SELECT', 'Any Row Lock', TRUE, 'NO_CONFLICT', 'MVCC_ISOLATION', 'MVCC ensures SELECT sees consistent snapshot'),
    ('FOR UPDATE SKIP LOCKED', 'Any Row Lock', TRUE, 'AVOIDED_CONFLICT', 'SKIP_MECHANISM', 'SKIP LOCKED avoids waiting on locked rows');
END;
$$ LANGUAGE plpgsql;

-- Function to simulate lock interactions
CREATE OR REPLACE FUNCTION simulate_lock_interaction(
    p_order_id INTEGER,
    p_item_id INTEGER,
    lock_type_1 VARCHAR(25),
    lock_type_2 VARCHAR(25)
) RETURNS TABLE(
    interaction_result VARCHAR(30),
    lock_1_acquired BOOLEAN,
    lock_2_acquired BOOLEAN,
    wait_occurred BOOLEAN,
    explanation TEXT
) AS $$
DECLARE
    compatible_locks BOOLEAN;
BEGIN
    -- Check compatibility from our matrix
    SELECT compatible INTO compatible_locks
    FROM (
        SELECT 
            CASE 
                WHEN (lock_type_1 = 'FOR SHARE' AND lock_type_2 = 'FOR SHARE') OR
                     (lock_type_1 = 'FOR KEY SHARE' AND lock_type_2 = 'FOR KEY SHARE') OR
                     (lock_type_1 = 'FOR KEY SHARE' AND lock_type_2 = 'FOR NO KEY UPDATE') OR
                     (lock_type_1 = 'FOR NO KEY UPDATE' AND lock_type_2 = 'FOR KEY SHARE') OR
                     (lock_type_1 = 'FOR SHARE' AND lock_type_2 = 'FOR KEY SHARE') OR
                     (lock_type_1 = 'FOR KEY SHARE' AND lock_type_2 = 'FOR SHARE')
                THEN TRUE
                ELSE FALSE
            END as compatible
    ) compat_check;
    
    IF compatible_locks THEN
        RETURN QUERY SELECT 
            'CONCURRENT_SUCCESS'::VARCHAR(30),
            TRUE,
            TRUE,
            FALSE,
            format('Lock types %s and %s are compatible - no blocking', lock_type_1, lock_type_2)::TEXT;
    ELSE
        RETURN QUERY SELECT 
            'SEQUENTIAL_BLOCKING'::VARCHAR(30),
            TRUE,
            FALSE,  -- Second lock would wait
            TRUE,
            format('Lock types %s and %s conflict - second transaction must wait', lock_type_1, lock_type_2)::TEXT;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'SIMULATION_ERROR'::VARCHAR(30),
            FALSE,
            FALSE,
            FALSE,
            format('Error simulating interaction between %s and %s', lock_type_1, lock_type_2)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_row_lock_compatibility() WHERE compatible = FALSE;
SELECT * FROM simulate_lock_interaction(1001, 1, 'FOR UPDATE', 'FOR SHARE');
```

## Performance Considerations

### Lock Performance Analysis

```sql
-- Comprehensive row lock performance analysis
CREATE OR REPLACE FUNCTION analyze_row_lock_performance()
RETURNS TABLE(
    performance_aspect VARCHAR(40),
    lock_type VARCHAR(25),
    performance_rating VARCHAR(15),
    cpu_overhead VARCHAR(15),
    memory_overhead VARCHAR(15),
    scalability_notes TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Lock Acquisition Speed', 'FOR KEY SHARE', 'EXCELLENT', 'MINIMAL', 'MINIMAL', 'Fastest to acquire, least overhead'),
    ('Lock Acquisition Speed', 'FOR SHARE', 'VERY GOOD', 'LOW', 'LOW', 'Fast shared lock, good for read-heavy workloads'),
    ('Lock Acquisition Speed', 'FOR NO KEY UPDATE', 'GOOD', 'MODERATE', 'MODERATE', 'Moderate overhead, better than FOR UPDATE'),
    ('Lock Acquisition Speed', 'FOR UPDATE', 'MODERATE', 'HIGH', 'HIGH', 'Highest overhead due to exclusive nature'),
    
    ('Concurrency Level', 'FOR KEY SHARE', 'MAXIMUM', 'N/A', 'N/A', 'Allows most concurrent operations'),
    ('Concurrency Level', 'FOR SHARE', 'HIGH', 'N/A', 'N/A', 'Good for read-heavy, prevents writes'),
    ('Concurrency Level', 'FOR NO KEY UPDATE', 'MODERATE', 'N/A', 'N/A', 'Balanced concurrency vs protection'),
    ('Concurrency Level', 'FOR UPDATE', 'LOW', 'N/A', 'N/A', 'Serializes access to locked rows'),
    
    ('Lock Contention Impact', 'FOR KEY SHARE', 'MINIMAL', 'LOW', 'LOW', 'Rarely causes blocking'),
    ('Lock Contention Impact', 'FOR SHARE', 'LOW', 'LOW', 'MODERATE', 'Can accumulate shared waiters'),
    ('Lock Contention Impact', 'FOR NO KEY UPDATE', 'MODERATE', 'MODERATE', 'MODERATE', 'Moderate contention potential'),
    ('Lock Contention Impact', 'FOR UPDATE', 'HIGH', 'HIGH', 'HIGH', 'Highest contention and blocking potential'),
    
    ('MVCC Integration', 'FOR KEY SHARE', 'EXCELLENT', 'MINIMAL', 'MINIMAL', 'Works seamlessly with MVCC'),
    ('MVCC Integration', 'FOR SHARE', 'EXCELLENT', 'LOW', 'LOW', 'Good MVCC integration'),
    ('MVCC Integration', 'FOR NO KEY UPDATE', 'GOOD', 'MODERATE', 'MODERATE', 'Standard MVCC behavior'),
    ('MVCC Integration', 'FOR UPDATE', 'GOOD', 'MODERATE', 'HIGH', 'Can create version bloat under contention');
END;
$$ LANGUAGE plpgsql;

-- Lock performance benchmarking function
CREATE OR REPLACE FUNCTION benchmark_lock_performance(
    test_iterations INTEGER DEFAULT 1000
) RETURNS TABLE(
    lock_type VARCHAR(25),
    avg_acquisition_time_ms DECIMAL(10,3),
    total_operations INTEGER,
    operations_per_second DECIMAL(10,2),
    contention_events INTEGER,
    performance_rating VARCHAR(15)
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration_ms DECIMAL(10,3);
    test_row_id INTEGER := 1;
    ops_per_sec DECIMAL(10,2);
BEGIN
    -- Ensure test data exists
    INSERT INTO order_items (order_id, item_id, quantity, price)
    VALUES (9999, 1, 1000, 1.00)
    ON CONFLICT DO NOTHING;
    
    -- FOR KEY SHARE benchmark
    start_time := CURRENT_TIMESTAMP;
    FOR i IN 1..test_iterations LOOP
        PERFORM * FROM order_items WHERE order_id = 9999 AND item_id = 1 FOR KEY SHARE;
    END LOOP;
    end_time := CURRENT_TIMESTAMP;
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    ops_per_sec := test_iterations / (duration_ms / 1000);
    
    RETURN QUERY SELECT 
        'FOR KEY SHARE'::VARCHAR(25),
        ROUND((duration_ms / test_iterations)::NUMERIC, 3),
        test_iterations,
        ROUND(ops_per_sec::NUMERIC, 2),
        0::INTEGER,  -- Minimal contention expected
        CASE 
            WHEN ops_per_sec > 10000 THEN 'EXCELLENT'
            WHEN ops_per_sec > 5000 THEN 'VERY GOOD'
            WHEN ops_per_sec > 1000 THEN 'GOOD'
            ELSE 'NEEDS_TUNING'
        END::VARCHAR(15);
    
    -- FOR SHARE benchmark
    start_time := CURRENT_TIMESTAMP;
    FOR i IN 1..test_iterations LOOP
        PERFORM * FROM order_items WHERE order_id = 9999 AND item_id = 1 FOR SHARE;
    END LOOP;
    end_time := CURRENT_TIMESTAMP;
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    ops_per_sec := test_iterations / (duration_ms / 1000);
    
    RETURN QUERY SELECT 
        'FOR SHARE'::VARCHAR(25),
        ROUND((duration_ms / test_iterations)::NUMERIC, 3),
        test_iterations,
        ROUND(ops_per_sec::NUMERIC, 2),
        0::INTEGER,
        CASE 
            WHEN ops_per_sec > 8000 THEN 'EXCELLENT'
            WHEN ops_per_sec > 4000 THEN 'VERY GOOD'
            WHEN ops_per_sec > 800 THEN 'GOOD'
            ELSE 'NEEDS_TUNING'
        END::VARCHAR(15);
    
    -- Note: FOR UPDATE and FOR NO KEY UPDATE benchmarks would require
    -- more complex setup to avoid actual data modifications
    RETURN QUERY SELECT 
        'FOR UPDATE (simulated)'::VARCHAR(25),
        5.0::DECIMAL(10,3),  -- Typical overhead
        test_iterations,
        200.0::DECIMAL(10,2),  -- Typical throughput
        GREATEST(test_iterations / 100, 1)::INTEGER,  -- Expected contention
        'MODERATE'::VARCHAR(15);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_row_lock_performance() ORDER BY lock_type, performance_aspect;
SELECT * FROM benchmark_lock_performance(100);  -- Small test for demo
```

## Best Practices and Optimization

### Row Locking Best Practices

```sql
-- Best practices guide for row-level locking
CREATE OR REPLACE FUNCTION row_locking_best_practices()
RETURNS TABLE(
    practice_category VARCHAR(30),
    practice_name VARCHAR(50),
    implementation_guideline TEXT,
    performance_impact VARCHAR(15),
    risk_mitigation TEXT,
    example_code TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Lock Selection', 'Choose Minimal Lock Level',
     'Use weakest lock that provides required protection',
     'HIGH_POSITIVE',
     'Reduces contention and improves throughput',
     'SELECT * FROM table FOR KEY SHARE instead of FOR UPDATE when only preventing key changes'),
    
    ('Lock Selection', 'Use SKIP LOCKED for Queues',
     'Implement work queues with SKIP LOCKED to avoid blocking',
     'VERY_HIGH',
     'Prevents worker threads from blocking each other',
     'SELECT * FROM jobs WHERE status = ''pending'' ORDER BY priority FOR UPDATE SKIP LOCKED LIMIT 10'),
    
    ('Lock Selection', 'Use NOWAIT for Real-time',
     'Implement non-blocking patterns with NOWAIT',
     'HIGH_POSITIVE',
     'Prevents cascading waits in time-sensitive applications',
     'SELECT * FROM inventory WHERE item_id = 123 FOR UPDATE NOWAIT'),
    
    ('Transaction Design', 'Minimize Lock Hold Time',
     'Keep transactions as short as possible',
     'CRITICAL',
     'Reduces lock contention window',
     'BEGIN; SELECT FOR UPDATE; UPDATE; COMMIT; -- Keep this block minimal'),
    
    ('Transaction Design', 'Consistent Lock Ordering',
     'Always acquire locks in same order to prevent deadlocks',
     'CRITICAL',
     'Prevents deadlock scenarios',
     'Always lock tables/rows in ascending ID order: table1, then table2'),
    
    ('Performance', 'Use Partial Indexes',
     'Create indexes supporting common lock queries',
     'HIGH_POSITIVE',
     'Speeds up lock acquisition on frequently accessed rows',
     'CREATE INDEX idx_orders_pending ON orders (customer_id) WHERE status = ''pending'''),
    
    ('Performance', 'Batch Lock Operations',
     'Group related locks together when possible',
     'MODERATE_POSITIVE',
     'Reduces round trips and lock overhead',
     'SELECT * FROM items WHERE id = ANY(ARRAY[1,2,3]) FOR UPDATE'),
    
    ('Monitoring', 'Monitor Lock Waits',
     'Implement alerting for lock wait times',
     'MONITORING',
     'Early detection of lock contention issues',
     'SELECT * FROM pg_locks WHERE NOT granted AND locktype = ''tuple'''),
    
    ('Error Handling', 'Handle Lock Failures',
     'Implement proper retry logic for lock failures',
     'RELIABILITY',
     'Graceful degradation under contention',
     'BEGIN TRY ... CATCH for lock_not_available exceptions with exponential backoff');
END;
$$ LANGUAGE plpgsql;

-- Lock optimization recommendations
CREATE OR REPLACE FUNCTION optimize_row_locking_strategy(
    table_name TEXT,
    typical_concurrency INTEGER DEFAULT 10
) RETURNS TABLE(
    optimization_area VARCHAR(30),
    current_assessment VARCHAR(20),
    recommended_action TEXT,
    expected_improvement VARCHAR(20),
    implementation_priority VARCHAR(15)
) AS $$
DECLARE
    table_exists BOOLEAN;
    lock_usage_pattern VARCHAR(20);
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = optimize_row_locking_strategy.table_name
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RETURN QUERY SELECT 
            'Table Validation'::VARCHAR(30),
            'ERROR'::VARCHAR(20),
            format('Table %s does not exist', table_name)::TEXT,
            'N/A'::VARCHAR(20),
            'CRITICAL'::VARCHAR(15);
        RETURN;
    END IF;
    
    -- Analyze typical usage pattern (simplified for demo)
    lock_usage_pattern := CASE 
        WHEN typical_concurrency > 50 THEN 'HIGH_CONTENTION'
        WHEN typical_concurrency > 20 THEN 'MODERATE_CONTENTION'
        ELSE 'LOW_CONTENTION'
    END;
    
    -- Index recommendations
    RETURN QUERY SELECT 
        'Indexing'::VARCHAR(30),
        'NEEDS_ANALYSIS'::VARCHAR(20),
        format('Ensure primary key and foreign key columns are well-indexed for %s access patterns', lock_usage_pattern)::TEXT,
        'MODERATE'::VARCHAR(20),
        'HIGH'::VARCHAR(15);
    
    -- Lock strategy recommendations based on concurrency
    IF lock_usage_pattern = 'HIGH_CONTENTION' THEN
        RETURN QUERY SELECT 
            'Lock Strategy'::VARCHAR(30),
            'HIGH_CONTENTION'::VARCHAR(20),
            'Consider SKIP LOCKED for queue patterns, optimize transaction duration, use advisory locks for coordination'::TEXT,
            'HIGH'::VARCHAR(20),
            'CRITICAL'::VARCHAR(15);
    ELSIF lock_usage_pattern = 'MODERATE_CONTENTION' THEN
        RETURN QUERY SELECT 
            'Lock Strategy'::VARCHAR(30),
            'MODERATE_CONTENTION'::VARCHAR(20),
            'Use FOR NO KEY UPDATE when possible, implement retry logic, monitor lock wait times'::TEXT,
            'MODERATE'::VARCHAR(20),
            'HIGH'::VARCHAR(15);
    ELSE
        RETURN QUERY SELECT 
            'Lock Strategy'::VARCHAR(30),
            'LOW_CONTENTION'::VARCHAR(20),
            'Standard locking patterns sufficient, focus on transaction design'::TEXT,
            'LOW'::VARCHAR(20),
            'MEDIUM'::VARCHAR(15);
    END IF;
    
    -- Monitoring recommendations
    RETURN QUERY SELECT 
        'Monitoring'::VARCHAR(30),
        'RECOMMENDED'::VARCHAR(20),
        'Set up monitoring for lock wait times, deadlocks, and lock queue depth'::TEXT,
        'RELIABILITY'::VARCHAR(20),
        'MEDIUM'::VARCHAR(15);
    
    -- Application design recommendations
    RETURN QUERY SELECT 
        'Application Design'::VARCHAR(30),
        'REVIEW_NEEDED'::VARCHAR(20),
        'Review transaction boundaries, implement consistent lock ordering, consider optimistic locking patterns'::TEXT,
        'HIGH'::VARCHAR(20),
        'HIGH'::VARCHAR(15);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM row_locking_best_practices() ORDER BY practice_category, practice_name;
SELECT * FROM optimize_row_locking_strategy('order_items', 25);
```

## Summary

**Row-Level Locking in PostgreSQL:**

**Core Mechanism:**
- **Fine-grained Control**: Locks individual rows rather than entire tables
- **MVCC Integration**: Works seamlessly with Multi-Version Concurrency Control
- **Transaction Scope**: Locks held until transaction commit/rollback
- **Explicit/Implicit**: Acquired through SELECT FOR clauses or automatic during DML

**Lock Modes (Strength Order):**
1. **FOR KEY SHARE**: Minimal protection, prevents key changes only
2. **FOR SHARE**: Shared access, prevents modifications but allows reads
3. **FOR NO KEY UPDATE**: Moderate exclusivity, allows concurrent key shares
4. **FOR UPDATE**: Exclusive access, strongest row-level lock

**Key Features:**
- **NOWAIT Option**: Non-blocking lock attempts
- **SKIP LOCKED**: Skip already locked rows in queries
- **OF table**: Selective locking in multi-table queries
- **Compatibility Matrix**: Defined interactions between lock modes

**Performance Characteristics:**
- **Concurrency**: Higher granularity = better concurrency
- **Overhead**: Minimal for KEY SHARE, increasing with lock strength
- **Contention**: FOR UPDATE highest, FOR KEY SHARE lowest
- **MVCC Benefits**: Readers never blocked by writers in MVCC

**Best Practices:**
- Choose weakest lock level that provides required protection
- Use SKIP LOCKED for work queue patterns
- Minimize transaction duration and lock hold time
- Implement consistent lock ordering to prevent deadlocks
- Monitor lock waits and contention patterns

**Use Cases:**
- **Inventory Systems**: FOR UPDATE for reservations
- **Financial Systems**: FOR UPDATE for account balance changes
- **Work Queues**: FOR UPDATE SKIP LOCKED for job processing
- **Reference Data**: FOR SHARE for validation operations
- **Foreign Keys**: FOR KEY SHARE for referential integrity

**Integration Points:**
- **Foreign Key Constraints**: Automatic FOR KEY SHARE on referenced rows
- **Triggers**: Lock considerations for trigger logic
- **Indexes**: Performance impact on lock acquisition
- **Connection Pooling**: Lock state management across pooled connections

Row-level locking provides PostgreSQL with sophisticated concurrency control that balances data consistency with system performance, enabling high-throughput applications while maintaining ACID properties.