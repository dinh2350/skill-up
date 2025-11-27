# 106. How do you use savepoints?

## Basic Savepoint Syntax

### Creating Savepoints

```sql
-- Basic syntax to create a savepoint
SAVEPOINT savepoint_name;

-- Example
BEGIN;
    INSERT INTO customers (name, email) VALUES ('John Doe', 'john@email.com');
    
    SAVEPOINT customer_created;  -- Create a savepoint
    
    INSERT INTO orders (customer_id, amount) VALUES (1, 100.00);
    
COMMIT;
```

### Rolling Back to Savepoints

```sql
-- Basic rollback syntax
ROLLBACK TO SAVEPOINT savepoint_name;

-- Example with rollback
BEGIN;
    INSERT INTO customers (name, email) VALUES ('Jane Smith', 'jane@email.com');
    
    SAVEPOINT customer_added;
    
    -- This operation might fail
    INSERT INTO orders (customer_id, amount) VALUES (999, -100.00); -- Invalid
    
    -- Rollback to the savepoint
    ROLLBACK TO SAVEPOINT customer_added;
    
    -- Customer insert remains, order insert is undone
    INSERT INTO orders (customer_id, amount) VALUES (1, 150.00); -- Valid order
    
COMMIT; -- Customer and second order are committed
```

### Releasing Savepoints

```sql
-- Release a savepoint when no longer needed
RELEASE SAVEPOINT savepoint_name;

-- Example
BEGIN;
    INSERT INTO products (name, price) VALUES ('Product A', 99.99);
    
    SAVEPOINT product_created;
    
    INSERT INTO categories (name) VALUES ('Electronics');
    
    -- Operations successful, release the savepoint
    RELEASE SAVEPOINT product_created;
    
    -- Continue with other operations
    UPDATE products SET category_id = currval('categories_category_id_seq');
    
COMMIT;
```

## Practical Usage Patterns

### 1. Exception Handling Pattern

```sql
-- Using savepoints in stored procedures for error handling
CREATE OR REPLACE FUNCTION transfer_funds(
    from_account_id INTEGER,
    to_account_id INTEGER,
    amount DECIMAL(10,2)
) RETURNS TEXT AS $$
DECLARE
    from_balance DECIMAL(10,2);
    to_balance DECIMAL(10,2);
    transfer_id INTEGER;
BEGIN
    -- Validate accounts exist
    SELECT balance INTO from_balance 
    FROM accounts 
    WHERE account_id = from_account_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source account % not found', from_account_id;
    END IF;
    
    SELECT balance INTO to_balance 
    FROM accounts 
    WHERE account_id = to_account_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Destination account % not found', to_account_id;
    END IF;
    
    -- Check sufficient funds
    IF from_balance < amount THEN
        RAISE EXCEPTION 'Insufficient funds. Available: %, Requested: %', from_balance, amount;
    END IF;
    
    -- Create savepoint before critical operations
    SAVEPOINT before_transfer;
    
    BEGIN
        -- Create transfer record
        INSERT INTO transfers (from_account_id, to_account_id, amount, status, created_at)
        VALUES (from_account_id, to_account_id, amount, 'processing', CURRENT_TIMESTAMP)
        RETURNING transfer_id INTO transfer_id;
        
        -- Debit from source account
        UPDATE accounts 
        SET balance = balance - amount,
            last_updated = CURRENT_TIMESTAMP
        WHERE account_id = from_account_id;
        
        -- Credit to destination account
        UPDATE accounts 
        SET balance = balance + amount,
            last_updated = CURRENT_TIMESTAMP
        WHERE account_id = to_account_id;
        
        -- Mark transfer as completed
        UPDATE transfers 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE transfer_id = transfer_id;
        
        -- Log successful transfer
        INSERT INTO audit_log (
            action, 
            details, 
            performed_at
        ) VALUES (
            'TRANSFER_COMPLETED',
            jsonb_build_object(
                'transfer_id', transfer_id,
                'from_account', from_account_id,
                'to_account', to_account_id,
                'amount', amount
            ),
            CURRENT_TIMESTAMP
        );
        
        RETURN format('Transfer completed successfully. Transfer ID: %s', transfer_id);
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback to savepoint
            ROLLBACK TO SAVEPOINT before_transfer;
            
            -- Mark transfer as failed (if transfer record was created)
            BEGIN
                UPDATE transfers 
                SET status = 'failed', 
                    error_message = SQLERRM,
                    failed_at = CURRENT_TIMESTAMP
                WHERE transfer_id = transfer_id;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Transfer record might not exist, ignore
                    NULL;
            END;
            
            -- Log failed transfer attempt
            INSERT INTO audit_log (
                action, 
                details, 
                performed_at
            ) VALUES (
                'TRANSFER_FAILED',
                jsonb_build_object(
                    'from_account', from_account_id,
                    'to_account', to_account_id,
                    'amount', amount,
                    'error', SQLERRM
                ),
                CURRENT_TIMESTAMP
            );
            
            RETURN format('Transfer failed: %s', SQLERRM);
    END;
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT transfer_funds(1001, 1002, 500.00);
COMMIT;
```

### 2. Nested Operations Pattern

```sql
-- Using nested savepoints for complex operations
CREATE OR REPLACE FUNCTION process_order_with_inventory(
    customer_id INTEGER,
    order_items JSONB
) RETURNS TABLE(
    step VARCHAR(50),
    status VARCHAR(20),
    message TEXT,
    data JSONB
) AS $$
DECLARE
    order_id INTEGER;
    item RECORD;
    available_qty INTEGER;
    item_total DECIMAL(10,2);
    order_total DECIMAL(10,2) := 0;
BEGIN
    -- Step 1: Create order header
    SAVEPOINT create_order;
    
    BEGIN
        INSERT INTO orders (customer_id, status, created_at)
        VALUES (customer_id, 'pending', CURRENT_TIMESTAMP)
        RETURNING order_id INTO order_id;
        
        RETURN QUERY SELECT 
            'CREATE_ORDER'::VARCHAR(50),
            'SUCCESS'::VARCHAR(20),
            format('Order %s created', order_id),
            jsonb_build_object('order_id', order_id);
            
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT create_order;
            
            RETURN QUERY SELECT 
                'CREATE_ORDER'::VARCHAR(50),
                'FAILED'::VARCHAR(20),
                format('Failed to create order: %s', SQLERRM),
                NULL::JSONB;
            RETURN;
    END;
    
    -- Step 2: Process each order item
    FOR item IN SELECT * FROM jsonb_to_recordset(order_items) 
                AS x(product_id INTEGER, quantity INTEGER, price DECIMAL(10,2))
    LOOP
        -- Create savepoint for each item
        SAVEPOINT process_item;
        
        BEGIN
            -- Check inventory
            SELECT quantity INTO available_qty
            FROM products 
            WHERE product_id = item.product_id;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Product % not found', item.product_id;
            END IF;
            
            IF available_qty < item.quantity THEN
                RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', 
                                available_qty, item.quantity;
            END IF;
            
            -- Calculate item total
            item_total := item.quantity * item.price;
            order_total := order_total + item_total;
            
            -- Reserve inventory
            UPDATE products 
            SET quantity = quantity - item.quantity,
                reserved_quantity = reserved_quantity + item.quantity
            WHERE product_id = item.product_id;
            
            -- Create order item
            INSERT INTO order_items (
                order_id, 
                product_id, 
                quantity, 
                unit_price, 
                total_price
            ) VALUES (
                order_id, 
                item.product_id, 
                item.quantity, 
                item.price, 
                item_total
            );
            
            RETURN QUERY SELECT 
                format('ITEM_%s', item.product_id)::VARCHAR(50),
                'SUCCESS'::VARCHAR(20),
                format('Item processed: %s x %s', item.quantity, item.product_id),
                jsonb_build_object(
                    'product_id', item.product_id,
                    'quantity', item.quantity,
                    'total', item_total
                );
                
        EXCEPTION
            WHEN OTHERS THEN
                -- Rollback only this item
                ROLLBACK TO SAVEPOINT process_item;
                
                RETURN QUERY SELECT 
                    format('ITEM_%s', item.product_id)::VARCHAR(50),
                    'FAILED'::VARCHAR(20),
                    format('Item failed: %s', SQLERRM),
                    jsonb_build_object('product_id', item.product_id);
                
                -- Continue with next item
                CONTINUE;
        END;
    END LOOP;
    
    -- Step 3: Finalize order
    SAVEPOINT finalize_order;
    
    BEGIN
        -- Update order total
        UPDATE orders 
        SET total_amount = order_total,
            status = 'confirmed',
            confirmed_at = CURRENT_TIMESTAMP
        WHERE order_id = order_id;
        
        -- Create payment record
        INSERT INTO payments (order_id, amount, status, created_at)
        VALUES (order_id, order_total, 'pending', CURRENT_TIMESTAMP);
        
        RETURN QUERY SELECT 
            'FINALIZE_ORDER'::VARCHAR(50),
            'SUCCESS'::VARCHAR(20),
            format('Order %s finalized with total %s', order_id, order_total),
            jsonb_build_object(
                'order_id', order_id,
                'total_amount', order_total,
                'status', 'confirmed'
            );
            
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT finalize_order;
            
            -- Mark order as failed
            UPDATE orders 
            SET status = 'failed', 
                error_message = SQLERRM
            WHERE order_id = order_id;
            
            RETURN QUERY SELECT 
                'FINALIZE_ORDER'::VARCHAR(50),
                'FAILED'::VARCHAR(20),
                format('Order finalization failed: %s', SQLERRM),
                jsonb_build_object('order_id', order_id);
    END;
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT * FROM process_order_with_inventory(
        1,
        '[
            {"product_id": 101, "quantity": 2, "price": 49.99},
            {"product_id": 102, "quantity": 1, "price": 99.99},
            {"product_id": 103, "quantity": 3, "price": 29.99}
        ]'::JSONB
    );
COMMIT;
```

### 3. Conditional Rollback Pattern

```sql
-- Using savepoints for conditional business logic
CREATE OR REPLACE FUNCTION apply_discount_with_validation(
    customer_id INTEGER,
    discount_code VARCHAR(50),
    order_total DECIMAL(10,2)
) RETURNS TABLE(
    action VARCHAR(30),
    applied BOOLEAN,
    discount_amount DECIMAL(10,2),
    final_total DECIMAL(10,2),
    message TEXT
) AS $$
DECLARE
    discount_record RECORD;
    calculated_discount DECIMAL(10,2);
    customer_tier VARCHAR(20);
    usage_count INTEGER;
    tier_multiplier DECIMAL(3,2) := 1.0;
BEGIN
    -- Get customer tier
    SELECT membership_tier INTO customer_tier
    FROM customers 
    WHERE customer_id = customer_id;
    
    -- Set tier multiplier
    tier_multiplier := CASE customer_tier
        WHEN 'GOLD' THEN 1.2
        WHEN 'SILVER' THEN 1.1
        WHEN 'BRONZE' THEN 1.0
        ELSE 0.9  -- Regular customers get reduced discount
    END;
    
    -- Strategy 1: Try applying the requested discount code
    SAVEPOINT try_discount_code;
    
    BEGIN
        -- Get discount details
        SELECT 
            discount_id,
            discount_type,
            discount_value,
            min_order_amount,
            max_usage_per_customer,
            valid_from,
            valid_until,
            is_active
        INTO discount_record
        FROM discount_codes 
        WHERE code = discount_code;
        
        -- Validate discount code exists
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Discount code not found';
        END IF;
        
        -- Validate discount is active
        IF NOT discount_record.is_active THEN
            RAISE EXCEPTION 'Discount code is not active';
        END IF;
        
        -- Validate date range
        IF CURRENT_DATE < discount_record.valid_from OR CURRENT_DATE > discount_record.valid_until THEN
            RAISE EXCEPTION 'Discount code is expired or not yet valid';
        END IF;
        
        -- Validate minimum order amount
        IF order_total < discount_record.min_order_amount THEN
            RAISE EXCEPTION 'Order total %s is below minimum required amount %s', 
                            order_total, discount_record.min_order_amount;
        END IF;
        
        -- Check usage limit
        SELECT COUNT(*) INTO usage_count
        FROM order_discounts od
        JOIN orders o ON od.order_id = o.order_id
        WHERE o.customer_id = customer_id 
          AND od.discount_code_id = discount_record.discount_id;
          
        IF usage_count >= discount_record.max_usage_per_customer THEN
            RAISE EXCEPTION 'Customer has exceeded usage limit for this discount';
        END IF;
        
        -- Calculate discount amount
        IF discount_record.discount_type = 'PERCENTAGE' THEN
            calculated_discount := order_total * (discount_record.discount_value / 100.0) * tier_multiplier;
        ELSE -- FIXED_AMOUNT
            calculated_discount := discount_record.discount_value * tier_multiplier;
        END IF;
        
        -- Ensure discount doesn't exceed order total
        calculated_discount := LEAST(calculated_discount, order_total);
        
        -- Record discount usage
        INSERT INTO discount_usage_log (
            customer_id,
            discount_code_id,
            order_total,
            discount_applied,
            tier_multiplier,
            applied_at
        ) VALUES (
            customer_id,
            discount_record.discount_id,
            order_total,
            calculated_discount,
            tier_multiplier,
            CURRENT_TIMESTAMP
        );
        
        RETURN QUERY SELECT 
            'DISCOUNT_CODE'::VARCHAR(30),
            TRUE,
            calculated_discount,
            order_total - calculated_discount,
            format('Applied discount code %s with %s%% tier bonus', 
                   discount_code, (tier_multiplier - 1) * 100);
                   
        RETURN; -- Success, exit function
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback discount code attempt
            ROLLBACK TO SAVEPOINT try_discount_code;
            
            -- Log the failed attempt
            INSERT INTO discount_failure_log (
                customer_id,
                discount_code,
                failure_reason,
                order_total,
                attempted_at
            ) VALUES (
                customer_id,
                discount_code,
                SQLERRM,
                order_total,
                CURRENT_TIMESTAMP
            );
            
            -- Continue to fallback strategies
    END;
    
    -- Strategy 2: Try automatic tier-based discount
    SAVEPOINT try_tier_discount;
    
    BEGIN
        -- Only apply if customer has a tier
        IF customer_tier IS NOT NULL AND customer_tier != 'REGULAR' THEN
            calculated_discount := CASE customer_tier
                WHEN 'GOLD' THEN order_total * 0.10    -- 10% for gold
                WHEN 'SILVER' THEN order_total * 0.05  -- 5% for silver
                WHEN 'BRONZE' THEN order_total * 0.02  -- 2% for bronze
                ELSE 0
            END;
            
            -- Apply minimum threshold for automatic discounts
            IF order_total >= 100.00 THEN
                INSERT INTO discount_usage_log (
                    customer_id,
                    discount_type,
                    order_total,
                    discount_applied,
                    tier_multiplier,
                    applied_at
                ) VALUES (
                    customer_id,
                    'AUTO_TIER',
                    order_total,
                    calculated_discount,
                    1.0,
                    CURRENT_TIMESTAMP
                );
                
                RETURN QUERY SELECT 
                    'AUTO_TIER_DISCOUNT'::VARCHAR(30),
                    TRUE,
                    calculated_discount,
                    order_total - calculated_discount,
                    format('Applied automatic %s tier discount', customer_tier);
                    
                RETURN; -- Success, exit function
            ELSE
                RAISE EXCEPTION 'Order total below threshold for automatic tier discount';
            END IF;
        ELSE
            RAISE EXCEPTION 'Customer not eligible for tier-based discount';
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT try_tier_discount;
            -- Continue to next strategy
    END;
    
    -- Strategy 3: Try loyalty points discount
    SAVEPOINT try_loyalty_discount;
    
    BEGIN
        DECLARE
            loyalty_points INTEGER;
            points_discount DECIMAL(10,2);
        BEGIN
            SELECT points_balance INTO loyalty_points
            FROM customer_loyalty
            WHERE customer_id = customer_id;
            
            IF loyalty_points >= 1000 THEN
                -- Convert points to discount (100 points = $1 discount)
                points_discount := LEAST(loyalty_points / 100.0, order_total * 0.20); -- Max 20%
                
                -- Deduct points
                UPDATE customer_loyalty 
                SET points_balance = points_balance - (points_discount * 100),
                    points_used = points_used + (points_discount * 100)
                WHERE customer_id = customer_id;
                
                INSERT INTO discount_usage_log (
                    customer_id,
                    discount_type,
                    order_total,
                    discount_applied,
                    tier_multiplier,
                    applied_at
                ) VALUES (
                    customer_id,
                    'LOYALTY_POINTS',
                    order_total,
                    points_discount,
                    1.0,
                    CURRENT_TIMESTAMP
                );
                
                RETURN QUERY SELECT 
                    'LOYALTY_POINTS'::VARCHAR(30),
                    TRUE,
                    points_discount,
                    order_total - points_discount,
                    format('Applied loyalty points discount using %s points', points_discount * 100);
                    
                RETURN; -- Success, exit function
            ELSE
                RAISE EXCEPTION 'Insufficient loyalty points';
            END IF;
        END;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT try_loyalty_discount;
            -- No more strategies
    END;
    
    -- No discounts could be applied
    RETURN QUERY SELECT 
        'NO_DISCOUNT'::VARCHAR(30),
        FALSE,
        0.00::DECIMAL(10,2),
        order_total,
        'No applicable discounts found';
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT * FROM apply_discount_with_validation(1, 'SUMMER20', 150.00);
COMMIT;
```

### 4. Batch Processing with Savepoints

```sql
-- Batch processing with individual record savepoints
CREATE OR REPLACE FUNCTION process_data_import(
    batch_id INTEGER,
    batch_size INTEGER DEFAULT 100
) RETURNS TABLE(
    batch_number INTEGER,
    records_processed INTEGER,
    records_failed INTEGER,
    processing_time INTERVAL
) AS $$
DECLARE
    import_record RECORD;
    batch_count INTEGER := 0;
    current_batch INTEGER := 1;
    processed_count INTEGER := 0;
    failed_count INTEGER := 0;
    batch_start_time TIMESTAMP;
    total_start_time TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- Process records in batches
    FOR import_record IN 
        SELECT id, customer_name, email, phone, address, product_orders
        FROM data_import_staging
        WHERE batch_id = batch_id
          AND status = 'pending'
        ORDER BY id
    LOOP
        -- Start new batch if needed
        IF batch_count = 0 THEN
            batch_start_time := CURRENT_TIMESTAMP;
            processed_count := 0;
            failed_count := 0;
            
            -- Create batch-level savepoint
            EXECUTE format('SAVEPOINT batch_%s', current_batch);
        END IF;
        
        -- Create record-level savepoint
        EXECUTE format('SAVEPOINT record_%s', import_record.id);
        
        BEGIN
            -- Process individual record
            DECLARE
                new_customer_id INTEGER;
                order_data JSONB;
            BEGIN
                -- Validate and create customer
                IF import_record.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
                    RAISE EXCEPTION 'Invalid email format: %', import_record.email;
                END IF;
                
                INSERT INTO customers (name, email, phone, address, created_at)
                VALUES (
                    import_record.customer_name,
                    import_record.email,
                    import_record.phone,
                    import_record.address,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    phone = EXCLUDED.phone,
                    address = EXCLUDED.address,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING customer_id INTO new_customer_id;
                
                -- Process orders if any
                IF import_record.product_orders IS NOT NULL THEN
                    FOR order_data IN SELECT * FROM jsonb_array_elements(import_record.product_orders)
                    LOOP
                        INSERT INTO orders (
                            customer_id, 
                            product_id, 
                            quantity, 
                            unit_price,
                            total_amount,
                            status,
                            created_at
                        ) VALUES (
                            new_customer_id,
                            (order_data->>'product_id')::INTEGER,
                            (order_data->>'quantity')::INTEGER,
                            (order_data->>'unit_price')::DECIMAL(10,2),
                            (order_data->>'quantity')::INTEGER * (order_data->>'unit_price')::DECIMAL(10,2),
                            'confirmed',
                            CURRENT_TIMESTAMP
                        );
                    END LOOP;
                END IF;
                
                -- Mark record as processed
                UPDATE data_import_staging 
                SET status = 'processed',
                    processed_at = CURRENT_TIMESTAMP,
                    customer_id = new_customer_id
                WHERE id = import_record.id;
                
                processed_count := processed_count + 1;
                
                -- Release record savepoint (success)
                EXECUTE format('RELEASE SAVEPOINT record_%s', import_record.id);
                
            EXCEPTION
                WHEN OTHERS THEN
                    -- Rollback only this record
                    EXECUTE format('ROLLBACK TO SAVEPOINT record_%s', import_record.id);
                    
                    -- Mark record as failed
                    UPDATE data_import_staging 
                    SET status = 'failed',
                        processed_at = CURRENT_TIMESTAMP,
                        error_message = SQLERRM
                    WHERE id = import_record.id;
                    
                    failed_count := failed_count + 1;
            END;
        END;
        
        batch_count := batch_count + 1;
        
        -- Process batch when full or at end
        IF batch_count >= batch_size OR 
           import_record.id = (SELECT MAX(id) FROM data_import_staging WHERE batch_id = batch_id) THEN
            
            -- Commit batch
            EXECUTE format('RELEASE SAVEPOINT batch_%s', current_batch);
            
            -- Return batch results
            RETURN QUERY SELECT 
                current_batch,
                processed_count,
                failed_count,
                CURRENT_TIMESTAMP - batch_start_time;
            
            -- Reset for next batch
            current_batch := current_batch + 1;
            batch_count := 0;
        END IF;
    END LOOP;
    
    -- Update batch summary
    INSERT INTO import_batch_summary (
        batch_id,
        total_records,
        processed_records,
        failed_records,
        processing_time,
        completed_at
    ) VALUES (
        batch_id,
        processed_count + failed_count,
        processed_count,
        failed_count,
        CURRENT_TIMESTAMP - total_start_time,
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT * FROM process_data_import(12345, 50);
COMMIT;
```

## Advanced Savepoint Techniques

### 1. Dynamic Savepoint Management

```sql
-- Function to manage dynamic savepoints
CREATE OR REPLACE FUNCTION execute_with_savepoint(
    operation_name TEXT,
    sql_statement TEXT
) RETURNS TABLE(
    operation TEXT,
    success BOOLEAN,
    result TEXT,
    execution_time INTERVAL
) AS $$
DECLARE
    savepoint_name TEXT;
    start_time TIMESTAMP;
    execution_result TEXT;
BEGIN
    -- Generate unique savepoint name
    savepoint_name := 'sp_' || operation_name || '_' || extract(epoch from now())::bigint;
    start_time := CURRENT_TIMESTAMP;
    
    -- Create savepoint
    EXECUTE format('SAVEPOINT %I', savepoint_name);
    
    BEGIN
        -- Execute the SQL statement
        EXECUTE sql_statement;
        
        -- If we get here, operation succeeded
        execution_result := 'Operation completed successfully';
        
        -- Release savepoint
        EXECUTE format('RELEASE SAVEPOINT %I', savepoint_name);
        
        RETURN QUERY SELECT 
            operation_name,
            TRUE,
            execution_result,
            CURRENT_TIMESTAMP - start_time;
            
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback to savepoint
            EXECUTE format('ROLLBACK TO SAVEPOINT %I', savepoint_name);
            
            RETURN QUERY SELECT 
                operation_name,
                FALSE,
                'Operation failed: ' || SQLERRM,
                CURRENT_TIMESTAMP - start_time;
    END;
END;
$$ LANGUAGE plpgsql;

-- Usage example
BEGIN;
    -- Execute multiple operations with individual savepoints
    SELECT * FROM execute_with_savepoint(
        'update_prices',
        'UPDATE products SET price = price * 1.1 WHERE category = ''electronics'''
    );
    
    SELECT * FROM execute_with_savepoint(
        'update_inventory',
        'UPDATE products SET quantity = quantity + 100 WHERE quantity < 10'
    );
    
    SELECT * FROM execute_with_savepoint(
        'invalid_operation',
        'UPDATE non_existent_table SET column = value'
    );
COMMIT;
```

### 2. Savepoint Stack Management

```sql
-- Manage a stack of savepoints for complex nested operations
CREATE OR REPLACE FUNCTION manage_savepoint_stack()
RETURNS TABLE(
    level INTEGER,
    operation TEXT,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    savepoint_stack TEXT[] := ARRAY[]::TEXT[];
    current_level INTEGER := 0;
    sp_name TEXT;
BEGIN
    -- Level 1: Customer operations
    current_level := 1;
    sp_name := 'level_' || current_level;
    savepoint_stack := array_append(savepoint_stack, sp_name);
    EXECUTE format('SAVEPOINT %I', sp_name);
    
    BEGIN
        INSERT INTO customers (name, email) VALUES ('Test Customer', 'test@example.com');
        
        RETURN QUERY SELECT 
            current_level,
            'Customer Creation'::TEXT,
            'SUCCESS'::TEXT,
            'Customer created successfully'::TEXT;
        
        -- Level 2: Address operations
        current_level := 2;
        sp_name := 'level_' || current_level;
        savepoint_stack := array_append(savepoint_stack, sp_name);
        EXECUTE format('SAVEPOINT %I', sp_name);
        
        BEGIN
            INSERT INTO addresses (customer_id, address_line1, city)
            VALUES (currval('customers_customer_id_seq'), '123 Main St', 'Sample City');
            
            RETURN QUERY SELECT 
                current_level,
                'Address Creation'::TEXT,
                'SUCCESS'::TEXT,
                'Address created successfully'::TEXT;
            
            -- Level 3: Order operations
            current_level := 3;
            sp_name := 'level_' || current_level;
            savepoint_stack := array_append(savepoint_stack, sp_name);
            EXECUTE format('SAVEPOINT %I', sp_name);
            
            BEGIN
                -- Simulate potential failure
                IF random() > 0.7 THEN
                    RAISE EXCEPTION 'Simulated order processing failure';
                END IF;
                
                INSERT INTO orders (customer_id, total_amount, status)
                VALUES (currval('customers_customer_id_seq'), 99.99, 'pending');
                
                RETURN QUERY SELECT 
                    current_level,
                    'Order Creation'::TEXT,
                    'SUCCESS'::TEXT,
                    'Order created successfully'::TEXT;
                
                -- Release level 3 savepoint
                EXECUTE format('RELEASE SAVEPOINT %I', sp_name);
                savepoint_stack := savepoint_stack[1:array_length(savepoint_stack,1)-1];
                
            EXCEPTION
                WHEN OTHERS THEN
                    -- Rollback level 3 only
                    EXECUTE format('ROLLBACK TO SAVEPOINT %I', sp_name);
                    
                    RETURN QUERY SELECT 
                        current_level,
                        'Order Creation'::TEXT,
                        'FAILED'::TEXT,
                        ('Order failed: ' || SQLERRM)::TEXT;
                    
                    savepoint_stack := savepoint_stack[1:array_length(savepoint_stack,1)-1];
            END;
            
            -- Release level 2 savepoint
            current_level := 2;
            sp_name := savepoint_stack[array_length(savepoint_stack,1)];
            EXECUTE format('RELEASE SAVEPOINT %I', sp_name);
            savepoint_stack := savepoint_stack[1:array_length(savepoint_stack,1)-1];
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Rollback level 2 and above
                current_level := 2;
                sp_name := savepoint_stack[array_length(savepoint_stack,1)];
                EXECUTE format('ROLLBACK TO SAVEPOINT %I', sp_name);
                
                RETURN QUERY SELECT 
                    current_level,
                    'Address Creation'::TEXT,
                    'FAILED'::TEXT,
                    ('Address failed: ' || SQLERRM)::TEXT;
                
                savepoint_stack := savepoint_stack[1:array_length(savepoint_stack,1)-1];
        END;
        
        -- Release level 1 savepoint
        current_level := 1;
        sp_name := savepoint_stack[array_length(savepoint_stack,1)];
        EXECUTE format('RELEASE SAVEPOINT %I', sp_name);
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback everything
            current_level := 1;
            sp_name := savepoint_stack[array_length(savepoint_stack,1)];
            EXECUTE format('ROLLBACK TO SAVEPOINT %I', sp_name);
            
            RETURN QUERY SELECT 
                current_level,
                'Customer Creation'::TEXT,
                'FAILED'::TEXT,
                ('Customer creation failed: ' || SQLERRM)::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT * FROM manage_savepoint_stack();
COMMIT;
```

## Best Practices and Guidelines

### 1. Naming Conventions

```sql
-- Use descriptive, consistent naming for savepoints
BEGIN;
    -- Good naming practices
    SAVEPOINT before_customer_update;    -- Descriptive action
    SAVEPOINT sp_inventory_check;        -- Prefixed with 'sp_'
    SAVEPOINT order_items_processed;     -- State description
    
    -- Avoid generic names
    -- SAVEPOINT sp1;                    -- Too generic
    -- SAVEPOINT temp;                   -- Not descriptive
    -- SAVEPOINT a;                      -- Meaningless
    
    -- Use consistent patterns
    SAVEPOINT before_critical_operation;
    SAVEPOINT after_validation;
    SAVEPOINT pre_payment_processing;
    
COMMIT;
```

### 2. Error Handling Strategy

```sql
-- Comprehensive error handling with savepoints
CREATE OR REPLACE FUNCTION robust_operation_example()
RETURNS TEXT AS $$
DECLARE
    operation_id INTEGER;
    checkpoint_data JSONB;
BEGIN
    -- Create operation log entry
    INSERT INTO operation_log (operation_type, status, started_at)
    VALUES ('COMPLEX_BUSINESS_PROCESS', 'STARTED', CURRENT_TIMESTAMP)
    RETURNING operation_id INTO operation_id;
    
    -- Main operation savepoint
    SAVEPOINT main_operation;
    
    BEGIN
        -- Phase 1: Data validation
        SAVEPOINT validation_phase;
        
        BEGIN
            -- Perform validations
            PERFORM validate_business_rules();
            
            -- Save checkpoint data
            checkpoint_data := jsonb_build_object(
                'phase', 'validation',
                'completed_at', CURRENT_TIMESTAMP
            );
            
            UPDATE operation_log 
            SET checkpoint_data = checkpoint_data
            WHERE operation_id = operation_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                ROLLBACK TO SAVEPOINT validation_phase;
                
                UPDATE operation_log 
                SET status = 'VALIDATION_FAILED',
                    error_message = SQLERRM,
                    completed_at = CURRENT_TIMESTAMP
                WHERE operation_id = operation_id;
                
                RAISE EXCEPTION 'Validation failed: %', SQLERRM;
        END;
        
        -- Phase 2: Core processing
        SAVEPOINT core_processing;
        
        BEGIN
            -- Perform core operations
            PERFORM execute_core_business_logic();
            
            -- Update checkpoint
            checkpoint_data := checkpoint_data || jsonb_build_object(
                'phase', 'core_processing',
                'completed_at', CURRENT_TIMESTAMP
            );
            
            UPDATE operation_log 
            SET checkpoint_data = checkpoint_data
            WHERE operation_id = operation_id;
            
        EXCEPTION
            WHEN OTHERS THEN
                ROLLBACK TO SAVEPOINT core_processing;
                
                UPDATE operation_log 
                SET status = 'PROCESSING_FAILED',
                    error_message = SQLERRM,
                    completed_at = CURRENT_TIMESTAMP
                WHERE operation_id = operation_id;
                
                RAISE EXCEPTION 'Core processing failed: %', SQLERRM;
        END;
        
        -- Phase 3: Finalization
        SAVEPOINT finalization;
        
        BEGIN
            -- Finalize operation
            PERFORM finalize_operation();
            
            -- Mark as completed
            UPDATE operation_log 
            SET status = 'COMPLETED',
                completed_at = CURRENT_TIMESTAMP,
                checkpoint_data = checkpoint_data || jsonb_build_object(
                    'phase', 'completed',
                    'completed_at', CURRENT_TIMESTAMP
                )
            WHERE operation_id = operation_id;
            
            RETURN 'Operation completed successfully';
            
        EXCEPTION
            WHEN OTHERS THEN
                ROLLBACK TO SAVEPOINT finalization;
                
                UPDATE operation_log 
                SET status = 'FINALIZATION_FAILED',
                    error_message = SQLERRM,
                    completed_at = CURRENT_TIMESTAMP
                WHERE operation_id = operation_id;
                
                RAISE EXCEPTION 'Finalization failed: %', SQLERRM;
        END;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT main_operation;
            
            UPDATE operation_log 
            SET status = 'FAILED',
                error_message = SQLERRM,
                completed_at = CURRENT_TIMESTAMP
            WHERE operation_id = operation_id;
            
            RETURN 'Operation failed: ' || SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;
```

### 3. Performance Considerations

```sql
-- Optimize savepoint usage for performance
CREATE OR REPLACE FUNCTION efficient_bulk_processing()
RETURNS VOID AS $$
DECLARE
    batch_size INTEGER := 1000;
    processed_count INTEGER := 0;
    batch_count INTEGER := 0;
    record_cursor CURSOR FOR 
        SELECT id, data FROM large_processing_table 
        WHERE status = 'pending' 
        ORDER BY id;
BEGIN
    -- Use larger batch sizes to reduce savepoint overhead
    FOR record IN record_cursor LOOP
        -- Only create savepoint at batch boundaries
        IF batch_count = 0 THEN
            EXECUTE format('SAVEPOINT batch_%s', processed_count / batch_size + 1);
        END IF;
        
        BEGIN
            -- Process individual record
            UPDATE large_processing_table 
            SET status = 'processed', 
                processed_data = process_record_data(record.data)
            WHERE id = record.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but continue processing
                INSERT INTO error_log (record_id, error_message)
                VALUES (record.id, SQLERRM);
        END;
        
        batch_count := batch_count + 1;
        processed_count := processed_count + 1;
        
        -- Commit batch when full
        IF batch_count >= batch_size THEN
            EXECUTE format('RELEASE SAVEPOINT batch_%s', processed_count / batch_size);
            batch_count := 0;
            
            -- Small pause to reduce lock contention
            PERFORM pg_sleep(0.001);
        END IF;
    END LOOP;
    
    -- Handle remaining records
    IF batch_count > 0 THEN
        EXECUTE format('RELEASE SAVEPOINT batch_%s', processed_count / batch_size + 1);
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### 4. Monitoring and Debugging

```sql
-- Add monitoring and debugging for savepoint operations
CREATE OR REPLACE FUNCTION debug_savepoint_operations()
RETURNS TABLE(
    savepoint_name TEXT,
    created_at TIMESTAMP,
    operation_type TEXT,
    status TEXT,
    duration INTERVAL
) AS $$
DECLARE
    sp_info RECORD;
    start_time TIMESTAMP;
BEGIN
    -- Create debug table for tracking savepoints
    CREATE TEMP TABLE IF NOT EXISTS savepoint_debug (
        name TEXT,
        created_at TIMESTAMP,
        operation TEXT,
        status TEXT,
        duration INTERVAL
    );
    
    -- Example operations with monitoring
    start_time := CURRENT_TIMESTAMP;
    SAVEPOINT debug_operation_1;
    
    INSERT INTO savepoint_debug VALUES (
        'debug_operation_1',
        start_time,
        'Customer Data Update',
        'CREATED',
        NULL
    );
    
    BEGIN
        -- Simulate operation
        UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE active = TRUE;
        
        -- Record success
        UPDATE savepoint_debug 
        SET status = 'SUCCESS',
            duration = CURRENT_TIMESTAMP - start_time
        WHERE name = 'debug_operation_1';
        
        RELEASE SAVEPOINT debug_operation_1;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO SAVEPOINT debug_operation_1;
            
            UPDATE savepoint_debug 
            SET status = 'FAILED',
                duration = CURRENT_TIMESTAMP - start_time
            WHERE name = 'debug_operation_1';
    END;
    
    -- Return debugging information
    RETURN QUERY 
    SELECT 
        sp.name,
        sp.created_at,
        sp.operation,
        sp.status,
        sp.duration
    FROM savepoint_debug sp
    ORDER BY sp.created_at;
    
    -- Clean up
    DROP TABLE savepoint_debug;
END;
$$ LANGUAGE plpgsql;

-- Usage
BEGIN;
    SELECT * FROM debug_savepoint_operations();
COMMIT;
```

## Summary

**Key Savepoint Operations:**
- **CREATE**: `SAVEPOINT savepoint_name;`
- **ROLLBACK**: `ROLLBACK TO SAVEPOINT savepoint_name;`
- **RELEASE**: `RELEASE SAVEPOINT savepoint_name;`

**Essential Usage Patterns:**
- **Exception Handling**: Rollback partial operations on errors
- **Nested Operations**: Create hierarchical transaction control
- **Conditional Logic**: Implement fallback strategies
- **Batch Processing**: Process records with individual error handling

**Best Practices:**
- Use descriptive, consistent naming conventions
- Release savepoints when no longer needed to free memory
- Plan rollback strategies before implementing
- Monitor savepoint usage for performance impact
- Document savepoint purposes clearly

**Performance Considerations:**
- Avoid excessive nesting
- Use appropriate batch sizes
- Release savepoints promptly
- Monitor memory usage with many savepoints

**Common Use Cases:**
- **Multi-step wizards** with step-by-step rollback
- **Batch imports** with individual record error handling
- **Complex business logic** with multiple fallback strategies
- **Financial transactions** with validation checkpoints
- **Data migrations** with partial rollback capabilities

Savepoints provide essential fine-grained transaction control, enabling robust error handling and flexible business logic implementation in PostgreSQL applications.