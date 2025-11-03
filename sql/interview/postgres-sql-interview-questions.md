# PostgreSQL Interview Questions

This document contains a list of PostgreSQL interview questions ranging from junior to senior levels.

## Junior Developer Questions

1.  **What is SQL?**

    - SQL (Structured Query Language) is a standard language for storing, manipulating, and retrieving data in databases.

2.  **What is PostgreSQL?**

    - PostgreSQL is a powerful, open-source object-relational database system. It is known for its reliability, feature robustness, and performance.

3.  **What are primary keys and foreign keys?**

    - **Primary Key**: A constraint that uniquely identifies each record in a table. Primary keys must contain unique values and cannot contain NULL values.
    - **Foreign Key**: A key used to link two tables together. It is a field (or collection of fields) in one table that refers to the Primary Key in another table.

4.  **What is the difference between `DELETE`, `TRUNCATE`, and `DROP`?**

    - `DELETE`: A DML command that removes rows from a table based on a `WHERE` clause. It can be rolled back.
    - `TRUNCATE`: A DDL command that removes all rows from a table quickly. It cannot be rolled back easily and does not fire `DELETE` triggers.
    - `DROP`: A DDL command that removes a table (or other database object) completely from the database.

5.  **What are `JOIN`s? Explain different types of `JOIN`s.**

    - `JOIN`s are used to combine rows from two or more tables based on a related column between them.
    - **`INNER JOIN`**: Returns records that have matching values in both tables.
    - **`LEFT JOIN` (or `LEFT OUTER JOIN`)**: Returns all records from the left table, and the matched records from the right table.
    - **`RIGHT JOIN` (or `RIGHT OUTER JOIN`)**: Returns all records from the right table, and the matched records from the left table.
    - **`FULL JOIN` (or `FULL OUTER JOIN`)**: Returns all records when there is a match in either left or right table.

6.  **What is an index?**
    - An index is a performance-tuning method of allowing faster retrieval of records from a table. An index creates an entry for each value, making it faster to find data.

## Mid-level Developer Questions

1.  **What is a transaction? What are ACID properties?**

    - A transaction is a sequence of operations performed as a single logical unit of work.
    - **ACID** properties guarantee that database transactions are processed reliably:
      - **Atomicity**: Ensures that all operations within a work unit are completed successfully; otherwise, the transaction is aborted, and all previous operations are rolled back.
      - **Consistency**: Ensures that the database properly changes states upon a successfully committed transaction.
      - **Isolation**: Ensures that concurrent execution of transactions leaves the database in the same state that would have been obtained if the transactions were executed sequentially.
      - **Durability**: Ensures that the results of a committed transaction are permanent and survive system failures.

2.  **What is normalization? Explain different normal forms.**

    - Normalization is the process of organizing columns and tables in a relational database to minimize data redundancy.
    - **1NF (First Normal Form)**: Ensures that the table is atomic (no repeating groups).
    - **2NF (Second Normal Form)**: Is in 1NF and all non-key attributes are fully functional dependent on the primary key.
    - **3NF (Third Normal Form)**: Is in 2NF and all attributes are dependent only on the primary key (no transitive dependencies).

3.  **What are views?**

    - A view is a virtual table based on the result-set of an SQL statement. It contains rows and columns, just like a real table. The fields in a view are fields from one or more real tables in the database.

4.  **What are stored procedures and functions?**

    - **Stored Procedures**: A set of SQL statements that can be saved, so the statements can be reused. They can take input parameters but do not have to return a value.
    - **Functions**: Similar to stored procedures, but they must return a value. They can be called from within SQL statements.

5.  **Explain `GROUP BY` and `HAVING`.**

    - `GROUP BY`: Groups rows that have the same values into summary rows, like "find the number of customers in each country". It is often used with aggregate functions (`COUNT`, `MAX`, `MIN`, `SUM`, `AVG`).
    - `HAVING`: Was added to SQL because the `WHERE` keyword could not be used with aggregate functions. It filters groups based on a condition.

6.  **What is the difference between `UNION` and `UNION ALL`?**
    - `UNION`: Combines the result-set of two or more `SELECT` statements and returns distinct rows.
    - `UNION ALL`: Combines the result-set of two or more `SELECT` statements and returns all rows, including duplicates. It is faster than `UNION`.

## Senior Developer Questions

1.  **What is database replication? Explain master-slave replication.**

    - Replication is the process of copying data from a database on one server to a database on another server.
    - **Master-Slave Replication**: The master server gets all the writes. The data is then replicated to one or more slave servers, which can be used for read queries. This improves performance and provides high availability.

2.  **What is partitioning?**

    - Partitioning is the process of dividing a large table into smaller, more manageable pieces (partitions), while still having the table appear as a single entity to queries. This can improve query performance and manageability.

    **Why Use Partitioning?**
    - **Improved Query Performance**: Queries can scan only relevant partitions instead of the entire table (partition pruning)
    - **Better Manageability**: Easier to maintain, backup, and restore smaller partitions
    - **Faster Bulk Operations**: Loading or deleting data from specific partitions is faster
    - **Storage Optimization**: Old partitions can be moved to slower, cheaper storage

    **PostgreSQL Partitioning Types:**

    1. **Range Partitioning**: Divides data based on a range of values (e.g., dates, IDs)
       ```sql
       CREATE TABLE sales (
           id SERIAL,
           sale_date DATE NOT NULL,
           amount NUMERIC
       ) PARTITION BY RANGE (sale_date);

       CREATE TABLE sales_2023 PARTITION OF sales
           FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

       CREATE TABLE sales_2024 PARTITION OF sales
           FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
       ```

    2. **List Partitioning**: Divides data based on a list of discrete values (e.g., regions, categories)
       ```sql
       CREATE TABLE customers (
           id SERIAL,
           name VARCHAR(100),
           country VARCHAR(50)
       ) PARTITION BY LIST (country);

       CREATE TABLE customers_us PARTITION OF customers
           FOR VALUES IN ('USA', 'United States');

       CREATE TABLE customers_eu PARTITION OF customers
           FOR VALUES IN ('UK', 'France', 'Germany');
       ```

    3. **Hash Partitioning**: Distributes data evenly across partitions using a hash function
       ```sql
       CREATE TABLE orders (
           id SERIAL,
           customer_id INTEGER,
           order_date DATE
       ) PARTITION BY HASH (customer_id);

       CREATE TABLE orders_p1 PARTITION OF orders
           FOR VALUES WITH (MODULUS 4, REMAINDER 0);

       CREATE TABLE orders_p2 PARTITION OF orders
           FOR VALUES WITH (MODULUS 4, REMAINDER 1);
       ```

    **Key Considerations:**
    - The parent table becomes a virtual table; data is stored only in partitions
    - Indexes must be created on each partition separately (or on the parent table in PostgreSQL 11+)
    - Primary keys and unique constraints must include the partition key
    - Partition pruning (automatically skipping irrelevant partitions) requires the WHERE clause to match the partition key
    - Maintenance operations like `VACUUM`, `ANALYZE` work on individual partitions

    **Best Practices:**
    - Choose partition keys based on common query patterns
    - Keep the number of partitions manageable (hundreds, not thousands)
    - Use range partitioning for time-series data
    - Consider using declarative partitioning (PostgreSQL 10+) over inheritance-based partitioning
    - Create indexes on frequently queried columns in each partition

3.  **How do you optimize a query? Explain `EXPLAIN` and `EXPLAIN ANALYZE`.**

    **Query Optimization Techniques:**

    1. **Indexing Strategies**
       - Create indexes on columns used in `WHERE`, `JOIN`, `ORDER BY`, and `GROUP BY` clauses
       - Use composite indexes for queries filtering on multiple columns
       - Avoid over-indexing (impacts INSERT/UPDATE performance)
       - Consider partial indexes for specific conditions
       ```sql
       -- Regular index
       CREATE INDEX idx_users_email ON users(email);
       
       -- Composite index
       CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);
       
       -- Partial index
       CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
       ```

    2. **Query Rewriting**
       - Avoid `SELECT *`; specify only needed columns
       - Use `EXISTS` instead of `IN` for subqueries with large datasets
       - Replace correlated subqueries with JOINs when possible
       - Use `LIMIT` to restrict result sets
       - Avoid functions on indexed columns in WHERE clauses
       ```sql
       -- Bad: Function on indexed column
       SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
       
       -- Good: Direct comparison
       SELECT * FROM users WHERE email = 'test@example.com';
       ```

    3. **Join Optimization**
       - Ensure join columns are indexed
       - Order tables from smallest to largest in joins
       - Use appropriate join types (INNER vs OUTER)

    4. **Data Type Optimization**
       - Use appropriate data types (e.g., INT vs BIGINT)
       - Avoid TEXT when VARCHAR with limit suffices

    5. **Database Statistics**
       - Regularly run `ANALYZE` to update table statistics
       - This helps the query planner make better decisions

    **EXPLAIN Command:**

    Shows the execution plan without running the query. Useful for understanding how PostgreSQL will execute a query.

    ```sql
    EXPLAIN SELECT * FROM orders WHERE customer_id = 123;
    ```

    **Output shows:**
    - **Seq Scan**: Sequential scan (reads entire table) - slow for large tables
    - **Index Scan**: Uses an index - fast for selective queries
    - **Index Only Scan**: Retrieves data only from index - fastest
    - **Bitmap Heap Scan**: Combines multiple indexes
    - **Nested Loop**: Join algorithm for small datasets
    - **Hash Join**: Join algorithm for large datasets
    - **Cost**: Estimated cost (startup cost..total cost)
    - **Rows**: Estimated number of rows

    **Example Output:**
    ```
    Seq Scan on orders  (cost=0.00..458.00 rows=100 width=32)
      Filter: (customer_id = 123)
    ```

    **EXPLAIN ANALYZE Command:**

    Actually executes the query and shows real performance metrics alongside the plan.

    ```sql
    EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
    ```

    **Provides additional information:**
    - **Actual time**: Real execution time (startup..total) in milliseconds
    - **Actual rows**: Actual number of rows returned
    - **Loops**: Number of times the operation was repeated
    - **Planning Time**: Time spent creating the execution plan
    - **Execution Time**: Total time to execute the query
    - **Buffers** (with BUFFERS option): Shows disk I/O statistics

    **Example Output:**
    ```
    Index Scan using idx_customer_id on orders  
      (cost=0.29..8.30 rows=1 width=32) 
      (actual time=0.015..0.017 rows=1 loops=1)
      Index Cond: (customer_id = 123)
    Planning Time: 0.123 ms
    Execution Time: 0.045 ms
    ```

    **Key Differences:**

    | Feature | EXPLAIN | EXPLAIN ANALYZE |
    |---------|---------|-----------------|
    | Executes query | No | Yes |
    | Shows estimates | Yes | Yes |
    | Shows actual times | No | Yes |
    | Safe for DML | Yes | No (modifies data) |
    | Use case | Quick analysis | Detailed debugging |

    **Advanced EXPLAIN Options:**

    ```sql
    -- Show buffer usage (disk I/O)
    EXPLAIN (ANALYZE, BUFFERS) SELECT ...;

    -- Verbose output with column details
    EXPLAIN (ANALYZE, VERBOSE) SELECT ...;

    -- JSON format for programmatic parsing
    EXPLAIN (ANALYZE, FORMAT JSON) SELECT ...;
    ```

    **Reading Query Plans - Red Flags:**
    - High cost values relative to data size
    - Sequential scans on large tables with selective WHERE clauses
    - Large discrepancies between estimated and actual rows
    - Multiple sorts or nested loops on large datasets
    - High buffer reads (indicating disk I/O bottlenecks)

    **Optimization Workflow:**
    1. Use `EXPLAIN` to understand the plan without execution
    2. Use `EXPLAIN ANALYZE` to get actual performance metrics
    3. Identify bottlenecks (seq scans, sorts, high-cost operations)
    4. Add appropriate indexes or rewrite the query
    5. Re-run `EXPLAIN ANALYZE` to verify improvements
    6. Monitor with `pg_stat_statements` in production

4.  **What is connection pooling?**

    Connection pooling is a technique used to maintain a cache of database connections that can be reused for future requests. This avoids the overhead of establishing a new connection for every request, which can be a performance bottleneck.

    **Why Connection Pooling is Needed:**

    Creating a new database connection is expensive because it involves:
    - TCP/IP socket establishment
    - Authentication and authorization
    - Memory allocation for connection state
    - PostgreSQL backend process creation
    - Initialization of session variables

    Each connection in PostgreSQL spawns a separate backend process, which consumes memory (typically 5-10 MB per connection). Without pooling, high-traffic applications can:
    - Exhaust available connections (`max_connections` limit)
    - Cause memory pressure on the database server
    - Experience connection latency (50-100ms per new connection)
    - Degrade overall application performance

    **How Connection Pooling Works:**

    ```
    Application Layer
         ↓
    Connection Pool (Middleware)
      [Conn1] [Conn2] [Conn3] ... [ConnN]
         ↓
    PostgreSQL Server
    ```

    1. **Pool Initialization**: Pre-creates a set of database connections on startup
    2. **Connection Checkout**: Application requests a connection from the pool
    3. **Connection Use**: Application executes queries using the borrowed connection
    4. **Connection Return**: Connection is returned to the pool (not closed)
    5. **Connection Reuse**: Same connection can be used by different requests

    **Popular Connection Poolers:**

    1. **PgBouncer** (Most popular for PostgreSQL)
       - Lightweight, standalone connection pooler
       - Written in C, very low overhead
       - Three pooling modes:
         - **Session**: Client gets connection for entire session (default)
         - **Transaction**: Connection returned after each transaction (recommended)
         - **Statement**: Connection returned after each statement (most aggressive)

       ```ini
       # pgbouncer.ini
       [databases]
       mydb = host=localhost port=5432 dbname=production

       [pgbouncer]
       pool_mode = transaction
       max_client_conn = 1000
       default_pool_size = 25
       min_pool_size = 10
       reserve_pool_size = 5
       ```

    2. **PgPool-II**
       - More features than PgBouncer (replication, load balancing)
       - Query caching capabilities
       - Heavier footprint

    3. **Application-Level Poolers**
       - **Node.js**: `pg-pool`, `node-postgres`
       - **Python**: `psycopg2.pool`, `SQLAlchemy pooling`
       - **Java**: HikariCP, Apache DBCP
       - **Go**: `pgx/pgxpool`
       - **.NET**: Npgsql built-in pooling

    **Configuration Example (Node.js with pg):**

    ```javascript
    const { Pool } = require('pg');

    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'mydb',
      user: 'dbuser',
      password: 'password',
      max: 20,              // Maximum pool size
      min: 5,               // Minimum pool size
      idleTimeoutMillis: 30000,  // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Wait 2s for available connection
    });

    // Using pooled connection
    async function getUser(id) {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
      } finally {
        client.release(); // Return to pool
      }
    }
    ```

    **Key Configuration Parameters:**

    - **max_connections** (PostgreSQL): Maximum connections server accepts (default: 100)
    - **pool_size**: Number of connections maintained in pool
    - **max_overflow**: Additional connections beyond pool_size when needed
    - **timeout**: How long to wait for available connection
    - **recycle**: Time after which connections are recycled/renewed
    - **pre_ping**: Test connection validity before use

    **Best Practices:**

    1. **Size the Pool Appropriately**
       - Formula: `connections = ((core_count * 2) + effective_spindle_count)`
       - Start small (10-20 connections) and scale based on monitoring
       - More connections ≠ better performance (context switching overhead)

    2. **Use Transaction-Level Pooling**
       - Session pooling ties up connections longer
       - Transaction pooling maximizes connection reuse

    3. **Monitor Pool Metrics**
       - Active connections
       - Idle connections
       - Wait time for connections
       - Connection errors and timeouts

    4. **Handle Connection Errors**
       - Implement retry logic
       - Gracefully handle pool exhaustion
       - Log and alert on connection failures

    5. **Application Considerations**
       - Always return connections to pool (use try/finally)
       - Avoid long-running transactions holding connections
       - Use read replicas for read-heavy workloads

    **When to Use External Pooler (PgBouncer) vs Application Pooling:**

    | Use Case | External Pooler | Application Pooler |
    |----------|----------------|-------------------|
    | Microservices (many apps) | ✅ Better | ❌ Each app has own pool |
    | Single application | Either works | ✅ Simpler setup |
    | Connection limit issues | ✅ Centralized control | ❌ Harder to manage |
    | Complex routing/failover | ✅ Advanced features | ❌ Limited features |
    | Minimal overhead | ✅ Very lightweight | Depends on library |

    **Performance Impact:**

    Without pooling:
    - 1000 req/s → 1000 connections/s → ~50-100ms overhead per request
    - Quickly hits `max_connections` limit

    With pooling:
    - 1000 req/s → 20 pooled connections → <1ms overhead per request
    - Sustainable under high load

    **Common Issues:**

    1. **Pool Exhaustion**: All connections busy, requests wait/timeout
       - Solution: Increase pool size or optimize query performance
    
    2. **Connection Leaks**: Connections not returned to pool
       - Solution: Always use try/finally or context managers
    
    3. **Stale Connections**: Connections closed by server but still in pool
       - Solution: Enable connection validation/pre_ping
    
    4. **Prepared Statement Conflicts**: In transaction pooling mode
       - Solution: Use unnamed prepared statements or session pooling

5.  **What are window functions?**

    - A window function performs a calculation across a set of table rows that are somehow related to the current row. This is comparable to the type of calculation that can be done with an aggregate function. But unlike regular aggregate functions, use of a window function does not cause rows to become grouped into a single output row.

6.  **What is MVCC (Multi-Version Concurrency Control) in PostgreSQL?**

    - MVCC is a concurrency control method used by PostgreSQL to avoid locking issues. When a row is updated, a new version of the row is created, and the old version is marked as expired. This allows readers to see a consistent snapshot of the database without being blocked by writers.

7.  **Advanced indexing strategies.**
    - Discuss different index types in PostgreSQL beyond B-tree, such as:
      - **GIN (Generalized Inverted Index)**: Useful for indexing composite values where elements within the value are to be searched, such as arrays or full-text search documents.
      - **GiST (Generalized Search Tree)**: A framework for building various kinds of tree-based indexes for complex data types.
      - **BRIN (Block Range Index)**: Stores summary information about blocks of table pages, making it efficient for very large tables with a natural ordering.
