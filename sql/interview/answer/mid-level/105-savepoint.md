# 105. What is a savepoint?

## Definition

A savepoint is a named transaction checkpoint within a database transaction that allows you to create a "safe point" to which you can later rollback if needed, without rolling back the entire transaction. Savepoints enable partial rollbacks and provide fine-grained transaction control for complex operations.

## Core Concepts

### 1. Nested Transaction Control

Savepoints create a hierarchical structure within transactions:

```sql
-- Transaction structure with savepoints
BEGIN;                           -- Start main transaction
    -- Some operations here
    
    SAVEPOINT sp1;              -- Create first savepoint
        -- More operations
        
        SAVEPOINT sp2;          -- Create nested savepoint
            -- Additional operations
            -- Can rollback to sp2, sp1, or entire transaction
        -- End of sp2 scope
    -- End of sp1 scope
    
COMMIT; -- Commit entire transaction
```

### 2. Partial Rollback Capability

Unlike full transaction rollback, savepoints allow you to undo only part of a transaction:

```sql
BEGIN;
    INSERT INTO customers (name, email) VALUES ('John Doe', 'john@email.com');
    
    SAVEPOINT customer_created;
    
    -- Try risky operation
    INSERT INTO orders (customer_id, amount) VALUES (999, 100.00); -- May fail
    
    -- If the above fails, rollback only to the savepoint
    -- Customer insert remains, but order insert is undone
    ROLLBACK TO SAVEPOINT customer_created;
    
    -- Continue with other operations
    UPDATE customer_stats SET total_customers = total_customers + 1;
    
COMMIT; -- Customer and stats update are committed, failed order is not
```

### 3. Error Recovery Mechanism

Savepoints provide graceful error handling within complex transactions:

```sql
BEGIN;
    -- Phase 1: Critical operations that must succeed
    INSERT INTO audit_log (action) VALUES ('Process started');
    
    SAVEPOINT phase1_complete;
    
    -- Phase 2: Operations that might fail
    BEGIN
        UPDATE inventory SET quantity = quantity - 100 WHERE product_id = 1;
        INSERT INTO orders (product_id, quantity) VALUES (1, 100);
    EXCEPTION
        WHEN insufficient_inventory THEN
            ROLLBACK TO SAVEPOINT phase1_complete;
            INSERT INTO error_log (message) VALUES ('Insufficient inventory');
    END;
    
    -- Continue with guaranteed operations
    INSERT INTO audit_log (action) VALUES ('Process completed');
    
COMMIT;
```

## Savepoint Characteristics

### 1. Hierarchical Structure

```sql
-- Savepoints can be nested to create a hierarchy
BEGIN;
    INSERT INTO parent_table (name) VALUES ('Parent Record');
    
    SAVEPOINT level_1;
        INSERT INTO child_table (parent_id, name) VALUES (1, 'Child 1');
        
        SAVEPOINT level_2;
            INSERT INTO grandchild_table (child_id, name) VALUES (1, 'Grandchild 1');
            
            SAVEPOINT level_3;
                UPDATE grandchild_table SET status = 'active';
                -- Can rollback to level_3, level_2, level_1, or entire transaction
            -- Operations here are at level_2 scope
        -- Operations here are at level_1 scope
    -- Operations here are at main transaction scope
COMMIT;
```

### 2. Resource Management

```sql
-- Savepoints help manage resources efficiently
BEGIN;
    -- Acquire locks and resources
    SELECT * FROM accounts WHERE account_id = 'A001' FOR UPDATE;
    
    SAVEPOINT resource_acquired;
    
    -- Complex operations that might fail
    PERFORM complex_calculation(account_data);
    
    -- If operations fail, rollback to savepoint
    -- Resources remain locked for alternative operations
    ROLLBACK TO SAVEPOINT resource_acquired;
    
    -- Alternative operations using same locked resources
    PERFORM alternative_calculation(account_data);
    
COMMIT; -- Release all resources
```

### 3. Isolation Boundaries

```sql
-- Savepoints maintain isolation within transactions
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    -- Establish consistent snapshot
    SELECT COUNT(*) FROM orders; -- Snapshot point
    
    SAVEPOINT snapshot_established;
    
    -- Modifications within same transaction
    INSERT INTO orders (customer_id) VALUES (123);
    
    -- Rollback doesn't affect isolation level or snapshot
    ROLLBACK TO SAVEPOINT snapshot_established;
    
    -- Still operating within same isolated snapshot
    SELECT COUNT(*) FROM orders; -- Same count as before
    
COMMIT;
```

## Use Cases and Applications

### 1. Batch Processing with Error Recovery

```sql
-- Process large batch with individual record error handling
CREATE OR REPLACE FUNCTION process_import_batch()
RETURNS TABLE(
    record_id INTEGER,
    status VARCHAR(20),
    error_message TEXT
) AS $$
DECLARE
    import_record RECORD;
    sp_name TEXT;
    processed_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- Process each record in the import table
    FOR import_record IN 
        SELECT id, customer_name, email, phone, address
        FROM import_data 
        WHERE processed = FALSE
        ORDER BY id
    LOOP
        -- Create savepoint for each record
        sp_name := 'import_record_' || import_record.id;
        EXECUTE format('SAVEPOINT %I', sp_name);
        
        BEGIN
            -- Validate and process the record
            IF import_record.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
                RAISE EXCEPTION 'Invalid email format: %', import_record.email;
            END IF;
            
            -- Insert customer
            INSERT INTO customers (name, email, phone, address)
            VALUES (
                import_record.customer_name,
                import_record.email,
                import_record.phone,
                import_record.address
            );
            
            -- Mark as processed
            UPDATE import_data 
            SET processed = TRUE, processed_at = CURRENT_TIMESTAMP
            WHERE id = import_record.id;
            
            processed_count := processed_count + 1;
            
            -- Return success status
            RETURN QUERY SELECT 
                import_record.id,
                'SUCCESS'::VARCHAR(20),
                NULL::TEXT;
                
        EXCEPTION
            WHEN OTHERS THEN
                -- Rollback only this record
                EXECUTE format('ROLLBACK TO SAVEPOINT %I', sp_name);
                
                -- Mark as failed
                UPDATE import_data 
                SET processed = TRUE, 
                    processed_at = CURRENT_TIMESTAMP,
                    error_message = SQLERRM
                WHERE id = import_record.id;
                
                error_count := error_count + 1;
                
                -- Return error status
                RETURN QUERY SELECT 
                    import_record.id,
                    'ERROR'::VARCHAR(20),
                    SQLERRM::TEXT;
        END;
    END LOOP;
    
    -- Log batch summary
    INSERT INTO batch_processing_log (
        processed_count, 
        error_count, 
        processed_at
    ) VALUES (
        processed_count, 
        error_count, 
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT * FROM process_import_batch();
COMMIT;
```

### 2. Multi-Step Wizard Operations

```sql
-- Simulate a multi-step wizard with rollback capabilities
CREATE OR REPLACE FUNCTION wizard_process_order(
    p_customer_data JSONB,
    p_order_items JSONB,
    p_payment_info JSONB
) RETURNS TABLE(
    step VARCHAR(20),
    success BOOLEAN,
    message TEXT,
    data JSONB
) AS $$
DECLARE
    customer_id INTEGER;
    order_id INTEGER;
    total_amount DECIMAL(10,2);
BEGIN
    -- Step 1: Create/Validate Customer
    SAVEPOINT step_1_customer;
    
    BEGIN
        -- Validate customer data
        IF NOT (p_customer_data ? 'name' AND p_customer_data ? 'email') THEN
            RAISE EXCEPTION 'Missing required customer fields';
        END IF;
        
        -- Create or get customer
        INSERT INTO customers (name, email, phone)
        VALUES (
            p_customer_data->>'name',
            p_customer_data->>'email',
            p_customer_data->>'phone'
        )
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone
        RETURNING customer_id INTO customer_id;
        
        RETURN QUERY SELECT 
            'CUSTOMER'::VARCHAR(20),
            TRUE,
            'Customer created/updated successfully',
            jsonb_build_object('customer_id', customer_id);
            
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT step_1_customer;
            RETURN QUERY SELECT 
                'CUSTOMER'::VARCHAR(20),
                FALSE,
                'Customer step failed: ' || SQLERRM,
                NULL::JSONB;
            RETURN;
    END;
    
    -- Step 2: Create Order and Items
    SAVEPOINT step_2_order;
    
    BEGIN
        -- Calculate total
        SELECT SUM((item->>'quantity')::INTEGER * (item->>'price')::DECIMAL)
        INTO total_amount
        FROM jsonb_array_elements(p_order_items) AS item;
        
        -- Create order
        INSERT INTO orders (customer_id, total_amount, status)
        VALUES (customer_id, total_amount, 'pending')
        RETURNING order_id INTO order_id;
        
        -- Create order items
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        SELECT 
            order_id,
            (item->>'product_id')::INTEGER,
            (item->>'quantity')::INTEGER,
            (item->>'price')::DECIMAL
        FROM jsonb_array_elements(p_order_items) AS item;
        
        RETURN QUERY SELECT 
            'ORDER'::VARCHAR(20),
            TRUE,
            'Order created successfully',
            jsonb_build_object('order_id', order_id, 'total', total_amount);
            
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT step_2_order;
            RETURN QUERY SELECT 
                'ORDER'::VARCHAR(20),
                FALSE,
                'Order step failed: ' || SQLERRM,
                NULL::JSONB;
            RETURN;
    END;
    
    -- Step 3: Process Payment
    SAVEPOINT step_3_payment;
    
    BEGIN
        -- Validate payment info
        IF NOT (p_payment_info ? 'card_number' AND p_payment_info ? 'amount') THEN
            RAISE EXCEPTION 'Missing payment information';
        END IF;
        
        -- Simulate payment processing
        IF (p_payment_info->>'amount')::DECIMAL != total_amount THEN
            RAISE EXCEPTION 'Payment amount mismatch';
        END IF;
        
        -- Record payment
        INSERT INTO payments (order_id, amount, payment_method, status)
        VALUES (
            order_id,
            total_amount,
            p_payment_info->>'payment_method',
            'completed'
        );
        
        -- Update order status
        UPDATE orders 
        SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
        WHERE order_id = order_id;
        
        RETURN QUERY SELECT 
            'PAYMENT'::VARCHAR(20),
            TRUE,
            'Payment processed successfully',
            jsonb_build_object('order_id', order_id, 'amount_paid', total_amount);
            
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT step_3_payment;
            
            -- Mark order as payment failed
            UPDATE orders SET status = 'payment_failed' WHERE order_id = order_id;
            
            RETURN QUERY SELECT 
                'PAYMENT'::VARCHAR(20),
                FALSE,
                'Payment step failed: ' || SQLERRM,
                jsonb_build_object('order_id', order_id);
            RETURN;
    END;
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT * FROM wizard_process_order(
        '{"name": "John Doe", "email": "john@email.com", "phone": "555-1234"}',
        '[{"product_id": 1, "quantity": 2, "price": 99.99}]',
        '{"card_number": "****-****-****-1234", "amount": 199.98, "payment_method": "credit_card"}'
    );
COMMIT;
```

### 3. Conditional Operations with Fallbacks

```sql
-- Complex business logic with multiple fallback strategies
CREATE OR REPLACE FUNCTION process_order_with_fallbacks(
    p_customer_id INTEGER,
    p_product_id INTEGER,
    p_quantity INTEGER
) RETURNS TEXT AS $$
DECLARE
    available_quantity INTEGER;
    product_price DECIMAL(10,2);
    customer_credit DECIMAL(10,2);
    total_cost DECIMAL(10,2);
    result_message TEXT;
BEGIN
    -- Get product and customer information
    SELECT quantity, price INTO available_quantity, product_price
    FROM products WHERE product_id = p_product_id;
    
    SELECT account_balance INTO customer_credit
    FROM customers WHERE customer_id = p_customer_id;
    
    total_cost := product_price * p_quantity;
    
    -- Strategy 1: Try full order
    SAVEPOINT try_full_order;
    
    BEGIN
        IF available_quantity >= p_quantity THEN
            IF customer_credit >= total_cost THEN
                -- Process full order
                INSERT INTO orders (customer_id, total_amount, status)
                VALUES (p_customer_id, total_cost, 'confirmed');
                
                UPDATE products 
                SET quantity = quantity - p_quantity 
                WHERE product_id = p_product_id;
                
                UPDATE customers 
                SET account_balance = account_balance - total_cost
                WHERE customer_id = p_customer_id;
                
                RETURN 'SUCCESS: Full order processed for ' || p_quantity || ' items';
            ELSE
                RAISE EXCEPTION 'Insufficient credit';
            END IF;
        ELSE
            RAISE EXCEPTION 'Insufficient inventory';
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT try_full_order;
            -- Continue to fallback strategies
    END;
    
    -- Strategy 2: Try partial order with available inventory
    SAVEPOINT try_partial_order;
    
    BEGIN
        IF available_quantity > 0 THEN
            total_cost := product_price * available_quantity;
            
            IF customer_credit >= total_cost THEN
                -- Process partial order
                INSERT INTO orders (customer_id, total_amount, status)
                VALUES (p_customer_id, total_cost, 'partial');
                
                UPDATE products 
                SET quantity = 0 
                WHERE product_id = p_product_id;
                
                UPDATE customers 
                SET account_balance = account_balance - total_cost
                WHERE customer_id = p_customer_id;
                
                -- Create backorder for remaining items
                INSERT INTO backorders (customer_id, product_id, quantity)
                VALUES (p_customer_id, p_product_id, p_quantity - available_quantity);
                
                RETURN 'PARTIAL: Processed ' || available_quantity || ' items, ' || 
                       (p_quantity - available_quantity) || ' backordered';
            ELSE
                RAISE EXCEPTION 'Insufficient credit for partial order';
            END IF;
        ELSE
            RAISE EXCEPTION 'No inventory available';
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT try_partial_order;
            -- Continue to final fallback
    END;
    
    -- Strategy 3: Create pending order (no inventory or credit)
    SAVEPOINT create_pending_order;
    
    BEGIN
        INSERT INTO orders (customer_id, total_amount, status)
        VALUES (p_customer_id, product_price * p_quantity, 'pending_approval');
        
        INSERT INTO approval_queue (
            order_id, 
            reason, 
            requested_quantity,
            available_quantity,
            customer_credit,
            required_amount
        ) VALUES (
            currval('orders_order_id_seq'),
            CASE 
                WHEN available_quantity < p_quantity AND customer_credit < total_cost THEN 
                    'Insufficient inventory and credit'
                WHEN available_quantity < p_quantity THEN 
                    'Insufficient inventory'
                ELSE 
                    'Insufficient credit'
            END,
            p_quantity,
            available_quantity,
            customer_credit,
            product_price * p_quantity
        );
        
        RETURN 'PENDING: Order created for manual approval due to constraints';
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT create_pending_order;
            RETURN 'FAILED: Could not process order - ' || SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT process_order_with_fallbacks(1, 101, 10);
COMMIT;
```

## Benefits of Savepoints

### 1. Granular Error Handling

```sql
-- Handle different types of errors with appropriate rollback levels
BEGIN;
    INSERT INTO audit_log (action) VALUES ('Bulk operation started');
    
    SAVEPOINT operation_started;
    
    -- Critical setup that must not be rolled back
    CREATE TEMPORARY TABLE temp_results AS
    SELECT product_id, SUM(quantity) as total_qty
    FROM order_items
    GROUP BY product_id;
    
    SAVEPOINT setup_complete;
    
    -- Risky operations that might need rollback
    FOR product_record IN SELECT * FROM temp_results LOOP
        SAVEPOINT process_product;
        
        BEGIN
            UPDATE products 
            SET quantity = quantity - product_record.total_qty
            WHERE product_id = product_record.product_id;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Product % not found', product_record.product_id;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Rollback only this product, continue with others
                ROLLBACK TO SAVEPOINT process_product;
                
                INSERT INTO error_log (product_id, error_message)
                VALUES (product_record.product_id, SQLERRM);
        END;
    END LOOP;
    
    -- Cleanup and final operations
    DROP TABLE temp_results;
    INSERT INTO audit_log (action) VALUES ('Bulk operation completed');
    
COMMIT;
```

### 2. Performance Optimization

```sql
-- Use savepoints to avoid full transaction rollback in batch operations
CREATE OR REPLACE FUNCTION optimized_batch_update()
RETURNS TABLE(processed INTEGER, errors INTEGER) AS $$
DECLARE
    batch_size INTEGER := 1000;
    total_processed INTEGER := 0;
    total_errors INTEGER := 0;
    batch_processed INTEGER;
    batch_errors INTEGER;
BEGIN
    LOOP
        batch_processed := 0;
        batch_errors := 0;
        
        -- Process batch with savepoint
        SAVEPOINT batch_start;
        
        -- Update batch of records
        UPDATE large_table 
        SET processed = TRUE,
            processed_date = CURRENT_TIMESTAMP
        WHERE NOT processed 
            AND id BETWEEN total_processed + 1 AND total_processed + batch_size;
        
        GET DIAGNOSTICS batch_processed = ROW_COUNT;
        
        -- If no rows processed, exit
        EXIT WHEN batch_processed = 0;
        
        -- Validate batch results
        IF batch_processed < batch_size / 2 THEN
            -- Something might be wrong, investigate
            RAISE NOTICE 'Low batch efficiency: only % records processed', batch_processed;
        END IF;
        
        total_processed := total_processed + batch_processed;
        
        -- Commit batch and start new one
        RELEASE SAVEPOINT batch_start;
        
        -- Small delay to reduce lock contention
        PERFORM pg_sleep(0.01);
    END LOOP;
    
    RETURN QUERY SELECT total_processed, total_errors;
END;
$$ LANGUAGE plpgsql;
```

### 3. Transaction State Management

```sql
-- Maintain transaction state across complex operations
CREATE OR REPLACE FUNCTION complex_state_management()
RETURNS TEXT AS $$
DECLARE
    initial_state TEXT;
    checkpoint_state TEXT;
    final_state TEXT;
BEGIN
    -- Record initial state
    SELECT jsonb_agg(jsonb_build_object('id', id, 'status', status))
    INTO initial_state
    FROM orders WHERE status = 'pending';
    
    -- Create checkpoint
    SAVEPOINT state_checkpoint;
    
    -- Perform state changes
    UPDATE orders SET status = 'processing' WHERE status = 'pending';
    
    -- Record checkpoint state
    SELECT jsonb_agg(jsonb_build_object('id', id, 'status', status))
    INTO checkpoint_state
    FROM orders WHERE status = 'processing';
    
    -- Complex validation that might require rollback
    IF validate_processing_state() THEN
        -- Continue with final changes
        UPDATE orders 
        SET status = 'confirmed', 
            confirmed_at = CURRENT_TIMESTAMP
        WHERE status = 'processing';
        
        final_state := 'All orders confirmed successfully';
    ELSE
        -- Rollback to checkpoint but maintain transaction
        ROLLBACK TO SAVEPOINT state_checkpoint;
        
        -- Alternative processing
        UPDATE orders 
        SET status = 'review_required' 
        WHERE status = 'pending';
        
        final_state := 'Orders marked for review due to validation failure';
    END IF;
    
    RETURN final_state;
END;
$$ LANGUAGE plpgsql;
```

## Limitations and Considerations

### 1. Memory Usage

```sql
-- Savepoints consume memory for maintaining state
-- Be mindful of creating too many nested savepoints
DO $$
DECLARE
    i INTEGER;
BEGIN
    -- Avoid excessive nesting like this
    FOR i IN 1..1000 LOOP
        EXECUTE format('SAVEPOINT sp_%s', i);  -- Creates 1000 savepoints
        -- This can consume significant memory
    END LOOP;
    
    -- Better approach: Use fewer, strategic savepoints
    -- Release savepoints when no longer needed
END $$;
```

### 2. Complexity Management

```sql
-- Keep savepoint logic simple and well-documented
CREATE OR REPLACE FUNCTION well_documented_savepoints()
RETURNS VOID AS $$
BEGIN
    -- Main transaction scope
    INSERT INTO transaction_log (message) VALUES ('Operation started');
    
    -- SAVEPOINT: Before risky customer operations
    SAVEPOINT customer_operations;
    -- Purpose: Allow rollback of customer changes without affecting transaction log
    
        INSERT INTO customers (name) VALUES ('Test Customer');
        
        -- SAVEPOINT: Before order creation
        SAVEPOINT order_creation;  
        -- Purpose: Allow order rollback while keeping customer
        
            INSERT INTO orders (customer_id) VALUES (currval('customers_customer_id_seq'));
            
            -- Validation logic here
            IF NOT validate_order() THEN
                ROLLBACK TO SAVEPOINT order_creation;  -- Only rollback order
                INSERT INTO error_log (message) VALUES ('Order validation failed');
            END IF;
        
        -- End order_creation scope
    
    -- End customer_operations scope
    
    INSERT INTO transaction_log (message) VALUES ('Operation completed');
END;
$$ LANGUAGE plpgsql;
```

## Summary

Savepoints in PostgreSQL provide:

**Core Functionality:**
- **Partial Rollback**: Undo specific parts of a transaction without affecting the whole
- **Nested Control**: Create hierarchical checkpoints within transactions
- **Error Recovery**: Graceful handling of failures in complex operations

**Key Benefits:**
- **Granular Error Handling**: Handle errors at different levels of operation
- **State Management**: Maintain transaction state across complex workflows
- **Performance**: Avoid costly full transaction rollbacks
- **Flexibility**: Implement conditional logic with fallback strategies

**Common Use Cases:**
- **Batch Processing**: Handle individual record failures without stopping the batch
- **Multi-Step Wizards**: Allow users to step back without losing all progress
- **Complex Business Logic**: Implement multiple strategies with fallbacks
- **Data Import**: Process records individually with error isolation

**Best Practices:**
- Use descriptive savepoint names
- Release savepoints when no longer needed
- Avoid excessive nesting
- Document savepoint purposes clearly
- Plan rollback strategies in advance

**Limitations:**
- Memory consumption with many savepoints
- Complexity can make code harder to understand
- Not a substitute for proper error handling design

Savepoints are essential for building robust, error-tolerant database applications that require fine-grained transaction control.