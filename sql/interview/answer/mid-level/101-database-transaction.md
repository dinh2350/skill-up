# 101. What is a database transaction?

## Definition

A database transaction is a single unit of work that consists of one or more database operations (SELECT, INSERT, UPDATE, DELETE) that are executed as a single, indivisible unit. All operations within a transaction either succeed completely or fail completely - there is no partial completion.

## Core Characteristics

A transaction represents:
- **A logical unit of work** that maintains database consistency
- **An atomic operation** that cannot be partially completed
- **A sequence of database operations** treated as a single unit
- **A mechanism for data integrity** in concurrent environments

## ACID Properties

Every database transaction must satisfy the ACID properties:

### Atomicity

**Definition**: All operations within a transaction succeed or all fail - no partial completion.

```sql
-- Example: Bank transfer transaction
BEGIN;
    -- Both operations must succeed or both must fail
    UPDATE accounts SET balance = balance - 1000 WHERE account_id = 'A001';
    UPDATE accounts SET balance = balance + 1000 WHERE account_id = 'A002';
    
    -- If either operation fails, entire transaction is rolled back
COMMIT;

-- Bad example without transaction atomicity:
UPDATE accounts SET balance = balance - 1000 WHERE account_id = 'A001'; -- Succeeds
-- System crash here!
UPDATE accounts SET balance = balance + 1000 WHERE account_id = 'A002'; -- Never executes
-- Result: Money disappears from A001 but never reaches A002
```

### Consistency

**Definition**: Transactions must maintain database integrity constraints and business rules.

```sql
-- Create table with constraints
CREATE TABLE accounts (
    account_id VARCHAR(10) PRIMARY KEY,
    balance DECIMAL(15,2) NOT NULL CHECK (balance >= 0),
    account_type VARCHAR(20) NOT NULL
);

-- Transaction that maintains consistency
BEGIN;
    UPDATE accounts SET balance = balance - 500 WHERE account_id = 'A001';
    UPDATE accounts SET balance = balance + 500 WHERE account_id = 'A002';
    
    -- Both accounts maintain non-negative balance constraint
    -- Total money in system remains constant
COMMIT;

-- Transaction that would violate consistency
BEGIN;
    UPDATE accounts SET balance = balance - 1500 WHERE account_id = 'A001';
    -- If A001 only has $1000, this violates CHECK constraint
    -- Transaction will be rolled back automatically
ROLLBACK;
```

### Isolation

**Definition**: Transactions execute independently without interfering with each other.

```sql
-- Transaction 1 (Session A):
BEGIN;
    UPDATE products SET quantity = quantity - 5 WHERE product_id = 'P001';
    -- Other transactions cannot see this change yet
    SELECT quantity FROM products WHERE product_id = 'P001'; -- Shows updated value
    -- Long processing time...
    COMMIT; -- Now change becomes visible to other transactions

-- Transaction 2 (Session B) - running concurrently:
BEGIN;
    SELECT quantity FROM products WHERE product_id = 'P001'; 
    -- Shows original value until Transaction 1 commits
    UPDATE products SET quantity = quantity - 3 WHERE product_id = 'P001';
    -- May block waiting for Transaction 1 to complete
COMMIT;
```

### Durability

**Definition**: Committed changes persist permanently, even after system failures.

```sql
BEGIN;
    INSERT INTO orders (order_id, customer_id, total) 
    VALUES ('ORD001', 'CUST123', 299.99);
    
    UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 'P001';
COMMIT; -- Changes are now permanent

-- Even if system crashes immediately after COMMIT,
-- the changes will be recovered when database restarts
-- PostgreSQL uses Write-Ahead Logging (WAL) to ensure durability
```

## Transaction States

### Transaction Lifecycle

```sql
-- 1. ACTIVE: Transaction is executing
BEGIN; -- Transaction becomes ACTIVE
    INSERT INTO customers (name, email) VALUES ('John Doe', 'john@email.com');
    UPDATE orders SET status = 'processing' WHERE customer_id = 123;

-- 2. PARTIALLY COMMITTED: All operations completed, waiting for commit
-- (Internal state - not directly visible)

-- 3. COMMITTED: Transaction successfully completed
COMMIT; -- Transaction becomes COMMITTED, changes are permanent

-- Alternative: ABORTED/ROLLED BACK
BEGIN;
    UPDATE accounts SET balance = balance - 1000 WHERE account_id = 'A001';
    -- Some error occurs or explicit rollback
ROLLBACK; -- Transaction becomes ABORTED, all changes are undone
```

## Transaction Isolation Levels

PostgreSQL supports four isolation levels (from weakest to strongest):

### 1. Read Uncommitted

```sql
-- Set isolation level (rarely used in practice)
BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
    -- Can read uncommitted changes from other transactions (dirty reads)
    SELECT * FROM accounts WHERE account_id = 'A001';
COMMIT;
```

### 2. Read Committed (Default in PostgreSQL)

```sql
-- Default isolation level
BEGIN; -- Equivalent to READ COMMITTED
    -- Sees committed changes from other transactions
    -- Each statement sees latest committed data
    SELECT balance FROM accounts WHERE account_id = 'A001'; -- Snapshot 1
    
    -- If another transaction commits changes to A001 here...
    
    SELECT balance FROM accounts WHERE account_id = 'A001'; -- Snapshot 2 (may be different)
COMMIT;
```

### 3. Repeatable Read

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    -- Consistent snapshot for entire transaction
    SELECT balance FROM accounts WHERE account_id = 'A001'; -- Snapshot taken here
    
    -- Even if other transactions commit changes, 
    -- this transaction sees the same data
    SELECT balance FROM accounts WHERE account_id = 'A001'; -- Same value as before
    
    -- Prevents non-repeatable reads and dirty reads
COMMIT;
```

### 4. Serializable (Strongest)

```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    -- Strongest isolation - transactions appear to run serially
    -- Prevents phantom reads, non-repeatable reads, and dirty reads
    
    SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- Count: 5
    
    -- Another transaction cannot insert/delete orders that would change this count
    -- in a way that affects this transaction's view
    
    SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- Still: 5
COMMIT;
```

## Practical Transaction Examples

### Example 1: E-commerce Order Processing

```sql
-- Complete order processing transaction
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    credit_balance DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2),
    quantity_available INTEGER
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

-- Process an order transaction
BEGIN;
    -- 1. Validate customer credit
    SELECT credit_balance FROM customers WHERE customer_id = 123;
    -- Assume customer has $500 credit
    
    -- 2. Check product availability
    SELECT quantity_available FROM products WHERE product_id = 456;
    -- Assume 10 units available
    
    -- 3. Create order
    INSERT INTO orders (customer_id, total_amount)
    VALUES (123, 299.99)
    RETURNING order_id; -- Returns new order ID (e.g., 789)
    
    -- 4. Add order items
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (789, 456, 2, 149.995);
    
    -- 5. Update inventory
    UPDATE products 
    SET quantity_available = quantity_available - 2 
    WHERE product_id = 456;
    
    -- 6. Update customer credit
    UPDATE customers 
    SET credit_balance = credit_balance - 299.99 
    WHERE customer_id = 123;
    
    -- 7. Update order status
    UPDATE orders 
    SET status = 'confirmed' 
    WHERE order_id = 789;

-- All operations succeed together or fail together
COMMIT;

-- Verify the transaction results
SELECT 
    o.order_id,
    o.total_amount,
    o.status,
    c.name,
    c.credit_balance,
    p.quantity_available
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.order_id = 789;
```

### Example 2: Bank Account Transfer with Error Handling

```sql
-- Bank transfer with comprehensive error handling
CREATE OR REPLACE FUNCTION transfer_money(
    from_account VARCHAR(10),
    to_account VARCHAR(10), 
    amount DECIMAL(15,2)
) RETURNS BOOLEAN AS $$
DECLARE
    from_balance DECIMAL(15,2);
    to_account_exists BOOLEAN;
BEGIN
    -- Start transaction (function runs in transaction context)
    
    -- 1. Validate amount
    IF amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be positive: %', amount;
    END IF;
    
    -- 2. Check if source account exists and has sufficient balance
    SELECT balance INTO from_balance 
    FROM accounts 
    WHERE account_id = from_account
    FOR UPDATE; -- Lock the row to prevent concurrent modifications
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source account not found: %', from_account;
    END IF;
    
    IF from_balance < amount THEN
        RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', 
                       from_balance, amount;
    END IF;
    
    -- 3. Check if destination account exists
    SELECT TRUE INTO to_account_exists
    FROM accounts 
    WHERE account_id = to_account;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Destination account not found: %', to_account;
    END IF;
    
    -- 4. Perform the transfer
    UPDATE accounts 
    SET balance = balance - amount,
        last_transaction = CURRENT_TIMESTAMP
    WHERE account_id = from_account;
    
    UPDATE accounts 
    SET balance = balance + amount,
        last_transaction = CURRENT_TIMESTAMP  
    WHERE account_id = to_account;
    
    -- 5. Log the transaction
    INSERT INTO transaction_log (
        from_account, to_account, amount, 
        transaction_type, transaction_time
    ) VALUES (
        from_account, to_account, amount,
        'TRANSFER', CURRENT_TIMESTAMP
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        INSERT INTO error_log (
            error_message, error_time, context
        ) VALUES (
            SQLERRM, CURRENT_TIMESTAMP, 
            'transfer_money: ' || from_account || ' -> ' || to_account || ' ($' || amount || ')'
        );
        
        -- Re-raise the exception to rollback transaction
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Usage with explicit transaction control
BEGIN;
    SELECT transfer_money('A001', 'A002', 1000.00);
    -- Additional validation or operations can go here
COMMIT;

-- Or let the function handle its own transaction
SELECT transfer_money('A001', 'A002', 1000.00);
```

### Example 3: Batch Processing with Savepoints

```sql
-- Batch processing with partial rollback capability
CREATE OR REPLACE FUNCTION process_batch_orders()
RETURNS TABLE(processed INTEGER, errors INTEGER, error_details TEXT[]) AS $$
DECLARE
    order_record RECORD;
    processed_count INTEGER := 0;
    error_count INTEGER := 0;
    error_list TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Process each pending order
    FOR order_record IN 
        SELECT order_id, customer_id, total_amount 
        FROM pending_orders 
        ORDER BY created_date
    LOOP
        BEGIN
            -- Create savepoint for each order
            SAVEPOINT process_order;
            
            -- Validate and process individual order
            PERFORM validate_order(order_record.order_id);
            PERFORM reserve_inventory(order_record.order_id);
            PERFORM charge_customer(order_record.customer_id, order_record.total_amount);
            PERFORM fulfill_order(order_record.order_id);
            
            -- Mark order as processed
            UPDATE pending_orders 
            SET status = 'processed', processed_date = CURRENT_TIMESTAMP
            WHERE order_id = order_record.order_id;
            
            processed_count := processed_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Rollback just this order, continue with others
                ROLLBACK TO SAVEPOINT process_order;
                
                error_count := error_count + 1;
                error_list := error_list || 
                             ('Order ' || order_record.order_id || ': ' || SQLERRM);
                
                -- Mark order as failed
                UPDATE pending_orders 
                SET status = 'failed', 
                    error_message = SQLERRM,
                    processed_date = CURRENT_TIMESTAMP
                WHERE order_id = order_record.order_id;
        END;
    END LOOP;
    
    -- Return processing summary
    RETURN QUERY SELECT processed_count, error_count, error_list;
END;
$$ LANGUAGE plpgsql;

-- Execute batch processing
BEGIN;
    SELECT * FROM process_batch_orders();
    -- Review results and decide whether to commit or rollback
COMMIT;
```

## Transaction Concurrency Scenarios

### Scenario 1: Lost Update Problem

```sql
-- Problem: Two transactions updating same data simultaneously

-- Transaction A (Session 1):
BEGIN;
    SELECT balance FROM accounts WHERE account_id = 'A001'; -- Reads $1000
    -- Calculate new balance: $1000 + $100 = $1100
    -- Long processing time...
    UPDATE accounts SET balance = 1100 WHERE account_id = 'A001';
COMMIT;

-- Transaction B (Session 2) - running concurrently:
BEGIN;
    SELECT balance FROM accounts WHERE account_id = 'A001'; -- Also reads $1000
    -- Calculate new balance: $1000 + $200 = $1200  
    UPDATE accounts SET balance = 1200 WHERE account_id = 'A001';
COMMIT;

-- Result: Final balance is $1200, but $100 increase is lost!

-- Solution: Use row-level locking
BEGIN;
    SELECT balance FROM accounts WHERE account_id = 'A001' FOR UPDATE;
    -- This locks the row until transaction completes
    UPDATE accounts SET balance = balance + 100 WHERE account_id = 'A001';
COMMIT;
```

### Scenario 2: Phantom Reads

```sql
-- Problem: New rows appearing between reads in same transaction

-- Transaction A:
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- Count: 5
    
    -- Business logic processing...
    
    SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- Still: 5
    -- No phantom reads at REPEATABLE READ level
COMMIT;

-- Transaction B (concurrent):
BEGIN;
    INSERT INTO orders (customer_id, status) VALUES (123, 'pending');
    COMMIT; -- This won't affect Transaction A's view
```

### Scenario 3: Deadlock Detection and Resolution

```sql
-- Deadlock scenario:

-- Transaction A (Session 1):
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE account_id = 'A001';
    -- Waits for Transaction B to release lock on A002
    UPDATE accounts SET balance = balance + 100 WHERE account_id = 'A002';

-- Transaction B (Session 2):
BEGIN;
    UPDATE accounts SET balance = balance - 50 WHERE account_id = 'A002';  
    -- Waits for Transaction A to release lock on A001 -> DEADLOCK!
    UPDATE accounts SET balance = balance + 50 WHERE account_id = 'A001';

-- PostgreSQL automatically detects deadlock and terminates one transaction:
-- ERROR: deadlock detected
-- DETAIL: Process 1234 waits for ShareLock on transaction 5678; 
--         blocked by process 5678.

-- Prevention: Always acquire locks in same order
-- Both transactions should lock accounts in same order (e.g., by account_id)
```

## Transaction Performance Considerations

### 1. Keep Transactions Short

```sql
-- Good: Short transaction
BEGIN;
    UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 'P001';
    INSERT INTO order_items (order_id, product_id, quantity) VALUES (123, 'P001', 1);
COMMIT;

-- Bad: Long-running transaction
BEGIN;
    SELECT * FROM large_table; -- Processes millions of rows
    -- Complex calculations...
    -- External API calls...
    UPDATE summary_table SET total = calculated_value;
COMMIT; -- Holds locks for too long
```

### 2. Minimize Lock Scope

```sql
-- Good: Specific row locking
BEGIN;
    SELECT * FROM accounts WHERE account_id = 'A001' FOR UPDATE;
    UPDATE accounts SET balance = balance + 100 WHERE account_id = 'A001';
COMMIT;

-- Bad: Table-level locking
BEGIN;
    LOCK TABLE accounts IN EXCLUSIVE MODE; -- Blocks all other transactions
    UPDATE accounts SET balance = balance + 100 WHERE account_id = 'A001';
COMMIT;
```

### 3. Use Appropriate Isolation Levels

```sql
-- For read-heavy reporting (allow some inconsistency for performance):
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
    SELECT COUNT(*), AVG(amount) FROM transactions;
COMMIT;

-- For critical financial operations (ensure full consistency):
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    -- Transfer money between accounts
    UPDATE accounts SET balance = balance - 1000 WHERE account_id = 'A001';
    UPDATE accounts SET balance = balance + 1000 WHERE account_id = 'A002';
COMMIT;
```

## Monitoring and Troubleshooting Transactions

### 1. View Active Transactions

```sql
-- See all active transactions
SELECT 
    pid,
    usename,
    application_name,
    state,
    xact_start,
    query_start,
    state_change,
    query
FROM pg_stat_activity 
WHERE state IN ('active', 'idle in transaction')
ORDER BY xact_start;

-- Find long-running transactions
SELECT 
    pid,
    usename,
    query,
    xact_start,
    CURRENT_TIMESTAMP - xact_start AS transaction_duration
FROM pg_stat_activity 
WHERE xact_start IS NOT NULL
    AND CURRENT_TIMESTAMP - xact_start > INTERVAL '10 minutes'
ORDER BY transaction_duration DESC;
```

### 2. Monitor Lock Conflicts

```sql
-- View current locks and blocking
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity 
    ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity 
    ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## Summary

Database transactions are fundamental to maintaining data integrity and consistency. Key concepts:

**Definition**: A transaction is an atomic unit of database operations that either succeeds completely or fails completely.

**ACID Properties**:
- **Atomicity**: All-or-nothing execution
- **Consistency**: Maintains database integrity
- **Isolation**: Transactions don't interfere with each other  
- **Durability**: Committed changes persist permanently

**Isolation Levels**:
- Read Uncommitted (weakest)
- Read Committed (PostgreSQL default)
- Repeatable Read
- Serializable (strongest)

**Best Practices**:
- Keep transactions short and focused
- Use appropriate isolation levels
- Handle errors and rollbacks properly
- Minimize lock scope and duration
- Monitor for deadlocks and long-running transactions

**Common Use Cases**:
- Financial transfers
- Order processing
- Batch operations
- Data migrations
- Multi-step business operations

Transactions are essential for building reliable, concurrent database applications that maintain data integrity under all conditions.