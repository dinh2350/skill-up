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

    - Query optimization involves techniques like creating indexes, rewriting queries, and analyzing query plans.
    - `EXPLAIN`: Shows the execution plan that the PostgreSQL planner generates for a given statement. It shows how the table(s) involved in the statement will be scanned.
    - `EXPLAIN ANALYZE`: Executes the statement and then displays the actual run times along with the plan. This is useful for seeing if the planner's estimates are close to reality.

4.  **What is connection pooling?**

    - Connection pooling is a technique used to maintain a cache of database connections that can be reused for future requests. This avoids the overhead of establishing a new connection for every request, which can be a performance bottleneck.

5.  **What are window functions?**

    - A window function performs a calculation across a set of table rows that are somehow related to the current row. This is comparable to the type of calculation that can be done with an aggregate function. But unlike regular aggregate functions, use of a window function does not cause rows to become grouped into a single output row.

6.  **What is MVCC (Multi-Version Concurrency Control) in PostgreSQL?**

    - MVCC is a concurrency control method used by PostgreSQL to avoid locking issues. When a row is updated, a new version of the row is created, and the old version is marked as expired. This allows readers to see a consistent snapshot of the database without being blocked by writers.

7.  **Advanced indexing strategies.**
    - Discuss different index types in PostgreSQL beyond B-tree, such as:
      - **GIN (Generalized Inverted Index)**: Useful for indexing composite values where elements within the value are to be searched, such as arrays or full-text search documents.
      - **GiST (Generalized Search Tree)**: A framework for building various kinds of tree-based indexes for complex data types.
      - **BRIN (Block Range Index)**: Stores summary information about blocks of table pages, making it efficient for very large tables with a natural ordering.
