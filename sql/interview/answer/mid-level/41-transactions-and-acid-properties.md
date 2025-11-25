# Question 41: What is a transaction? What are ACID properties?

## What is a Transaction?

A **transaction** is a logical unit of work that consists of one or more database operations that are executed as a single, atomic unit. All operations within a transaction either complete successfully (commit) or are entirely undone (rollback), ensuring database consistency.

### Key Characteristics:

- **Logical Unit**: A group of related database operations
- **All-or-Nothing**: Either all operations succeed or none do
- **Maintains Consistency**: Database remains in a valid state
- **Isolated**: Concurrent transactions don't interfere with each other

### Transaction Example:

```sql
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;
```

If either UPDATE fails, both are rolled back, preventing inconsistent data.

## ACID Properties

ACID is an acronym that describes four critical properties that guarantee reliable database transactions:

### 1. Atomicity

**Definition**: A transaction is treated as a single, indivisible unit of work.

**Key Points**:

- Either all operations within a transaction succeed, or none do
- No partial completion of transactions
- If any operation fails, the entire transaction is rolled back

**Example**:

```sql
-- Bank transfer transaction
BEGIN;
    UPDATE accounts SET balance = balance - 500 WHERE id = 'account_a';
    UPDATE accounts SET balance = balance + 500 WHERE id = 'account_b';

    -- If the second UPDATE fails, the first is automatically rolled back
COMMIT;
```

**Real-world Analogy**: Like sending an email - it's either sent completely or not at all.

### 2. Consistency

**Definition**: A transaction must leave the database in a valid state, maintaining all defined rules, constraints, and relationships.

**Key Points**:

- Database constraints are enforced (foreign keys, check constraints, etc.)
- Business rules are maintained
- Data integrity is preserved
- Transition from one valid state to another valid state

**Example**:

```sql
-- This transaction maintains consistency by enforcing foreign key constraints
BEGIN;
    INSERT INTO orders (customer_id, total) VALUES (123, 99.99);
    INSERT INTO order_items (order_id, product_id, quantity)
    VALUES (LASTVAL(), 456, 2);
COMMIT;
-- If customer_id 123 doesn't exist, the transaction fails, maintaining consistency
```

**Database Constraints Enforced**:

- Primary key uniqueness
- Foreign key references
- Check constraints
- Data type constraints
- NOT NULL constraints

### 3. Isolation

**Definition**: Concurrent transactions appear to execute independently, without interfering with each other.

**Key Points**:

- Multiple transactions can run simultaneously
- Each transaction sees a consistent view of the data
- Intermediate results of one transaction are not visible to others
- Controlled by isolation levels

**PostgreSQL Isolation Levels**:

1. **Read Uncommitted**: Lowest level, dirty reads possible
2. **Read Committed**: Default, sees only committed data
3. **Repeatable Read**: Consistent snapshot throughout transaction
4. **Serializable**: Highest level, complete isolation

**Example**:

```sql
-- Transaction 1
BEGIN;
SELECT balance FROM accounts WHERE id = 1; -- Returns 1000
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- Transaction not yet committed

-- Transaction 2 (running concurrently)
BEGIN;
SELECT balance FROM accounts WHERE id = 1; -- Still returns 1000 (isolation)
COMMIT;
```

**Isolation Problems Prevented**:

- **Dirty Reads**: Reading uncommitted changes
- **Non-repeatable Reads**: Getting different values in the same transaction
- **Phantom Reads**: New rows appearing between reads

### 4. Durability

**Definition**: Once a transaction is committed, its changes are permanently stored and survive system failures.

**Key Points**:

- Committed data persists even after system crashes
- Changes are written to non-volatile storage
- Database can be recovered to the last committed state
- Implemented through write-ahead logging (WAL)

**PostgreSQL Durability Mechanisms**:

- **Write-Ahead Logging (WAL)**: Changes logged before data pages
- **Checkpoints**: Periodic flushing of dirty pages to disk
- **fsync**: Forcing data to disk storage
- **Backup and Recovery**: Point-in-time recovery capabilities

**Example**:

```sql
BEGIN;
INSERT INTO critical_data (value) VALUES ('important information');
COMMIT; -- After this point, data is guaranteed to survive system crash
```

## Transaction Commands in PostgreSQL

### Starting Transactions:

```sql
BEGIN;          -- Start transaction
START TRANSACTION; -- Alternative syntax
```

### Ending Transactions:

```sql
COMMIT;         -- Save all changes permanently
ROLLBACK;       -- Undo all changes in transaction
```

### Savepoints:

```sql
BEGIN;
INSERT INTO table1 VALUES (1, 'data');
SAVEPOINT sp1;  -- Create savepoint
INSERT INTO table2 VALUES (2, 'more data');
ROLLBACK TO sp1; -- Rollback to savepoint (keeps first insert)
COMMIT;         -- Commit remaining changes
```

## Real-World Examples

### E-commerce Order Processing:

```sql
BEGIN;
-- 1. Check product availability
SELECT stock_quantity FROM products WHERE id = 123;

-- 2. Reduce inventory
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 123;

-- 3. Create order
INSERT INTO orders (customer_id, total, status) VALUES (456, 29.99, 'pending');

-- 4. Create order items
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (LASTVAL(), 123, 1, 29.99);

-- 5. Process payment (if this fails, everything rolls back)
INSERT INTO payments (order_id, amount, status) VALUES (LASTVAL(), 29.99, 'completed');

COMMIT;
```

### Banking System:

```sql
BEGIN;
-- Atomicity: Both updates must succeed
UPDATE accounts SET balance = balance - 1000 WHERE account_number = 'ACC001';
UPDATE accounts SET balance = balance + 1000 WHERE account_number = 'ACC002';

-- Consistency: Check balance constraints
-- (PostgreSQL enforces CHECK constraints automatically)

-- Isolation: Other transactions see either old or new state, never partial
-- Durability: Changes survive system failures after COMMIT
COMMIT;
```

## Best Practices

1. **Keep Transactions Short**: Minimize lock time and resource usage
2. **Handle Exceptions**: Always include proper error handling
3. **Use Appropriate Isolation Levels**: Balance consistency needs with performance
4. **Avoid Long-Running Transactions**: Can cause blocking and performance issues
5. **Test Transaction Logic**: Verify rollback scenarios work correctly

## Common Pitfalls

1. **Forgetting to COMMIT/ROLLBACK**: Leaves transactions open
2. **Long Transactions**: Can cause deadlocks and performance issues
3. **Inappropriate Isolation Levels**: Can lead to data inconsistency or poor performance
4. **Ignoring Deadlocks**: Not handling deadlock exceptions properly

Understanding transactions and ACID properties is fundamental for building reliable database applications that maintain data integrity under all conditions.
