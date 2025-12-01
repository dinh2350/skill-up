# PostgreSQL Partitioning & Sharding Knowledge Summary (Q141-160)

## Learning Objectives
This guide provides comprehensive knowledge needed to answer PostgreSQL partitioning and sharding interview questions Q141-160, covering fundamental concepts, implementation strategies, optimization techniques, and best practices.

## Core Learning Areas

### 1. Partitioning Fundamentals (Q141-143)

#### What is Partitioning?
- **Definition**: Dividing a large table into smaller, more manageable pieces called partitions
- **Logical vs Physical**: Single logical table, multiple physical storage segments
- **Inheritance-Based**: Built on PostgreSQL's table inheritance mechanism
- **Transparency**: Queries work on partitioned tables as if they were single tables

#### Why Use Partitioning?
- **Performance Benefits**:
  - Faster queries through partition pruning
  - Parallel processing across partitions
  - Smaller indexes per partition
  - Improved maintenance operations
- **Management Benefits**:
  - Easier backup/restore of specific time periods
  - Simplified data archival and purging
  - Independent maintenance operations
  - Reduced lock contention

#### Types of Partitioning in PostgreSQL
1. **Range Partitioning**: Based on value ranges (dates, numbers)
2. **List Partitioning**: Based on discrete values (regions, categories)
3. **Hash Partitioning**: Based on hash function output
4. **Multi-level Partitioning**: Combination of above methods

### 2. Range Partitioning (Q144)

#### Concepts
- Most common partitioning type
- Based on continuous value ranges
- Ideal for time-series data, sequential IDs
- Non-overlapping ranges

#### Implementation Example
```sql
-- Parent table
CREATE TABLE sales (
    id SERIAL,
    sale_date DATE NOT NULL,
    amount DECIMAL(10,2),
    region TEXT
) PARTITION BY RANGE (sale_date);

-- Monthly partitions
CREATE TABLE sales_2024_01 PARTITION OF sales
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE sales_2024_02 PARTITION OF sales
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Default partition for unmatched values
CREATE TABLE sales_default PARTITION OF sales DEFAULT;
```

#### Best Practices
- Choose partition boundaries based on query patterns
- Use consistent boundary intervals
- Plan for future partitions
- Monitor partition sizes

### 3. List Partitioning (Q145)

#### Concepts
- Based on discrete, predefined values
- Ideal for categorical data
- Each partition contains specific values
- Values cannot overlap between partitions

#### Implementation Example
```sql
-- Geographic partitioning
CREATE TABLE customers (
    id SERIAL,
    name TEXT,
    region TEXT NOT NULL,
    created_at TIMESTAMP
) PARTITION BY LIST (region);

CREATE TABLE customers_north PARTITION OF customers
    FOR VALUES IN ('north', 'northeast', 'northwest');

CREATE TABLE customers_south PARTITION OF customers
    FOR VALUES IN ('south', 'southeast', 'southwest');

CREATE TABLE customers_international PARTITION OF customers
    FOR VALUES IN ('europe', 'asia', 'oceania');
```

#### Use Cases
- Geographic regions
- Product categories
- User types/roles
- Status values

### 4. Hash Partitioning (Q146)

#### Concepts
- Uses hash function on partition key
- Distributes data evenly across partitions
- Number of partitions must be specified
- Good for load distribution

#### Implementation Example
```sql
-- Hash partitioning by user ID
CREATE TABLE user_activities (
    user_id INTEGER NOT NULL,
    activity_type TEXT,
    timestamp TIMESTAMP,
    data JSONB
) PARTITION BY HASH (user_id);

-- Create 4 hash partitions
CREATE TABLE user_activities_0 PARTITION OF user_activities
    FOR VALUES WITH (modulus 4, remainder 0);

CREATE TABLE user_activities_1 PARTITION OF user_activities
    FOR VALUES WITH (modulus 4, remainder 1);

CREATE TABLE user_activities_2 PARTITION OF user_activities
    FOR VALUES WITH (modulus 4, remainder 2);

CREATE TABLE user_activities_3 PARTITION OF user_activities
    FOR VALUES WITH (modulus 4, remainder 3);
```

#### Considerations
- Even data distribution
- No natural ordering
- Parallel processing benefits
- Difficulty in partition pruning

### 5. Partition Management Operations (Q147-149)

#### Creating Partitioned Tables
```sql
-- Step 1: Create parent table with PARTITION BY
CREATE TABLE logs (
    id BIGSERIAL,
    log_level TEXT,
    message TEXT,
    created_at TIMESTAMP NOT NULL
) PARTITION BY RANGE (created_at);

-- Step 2: Create partitions
CREATE TABLE logs_2024_q1 PARTITION OF logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

#### Adding New Partitions
```sql
-- Add future partition
CREATE TABLE logs_2024_q2 PARTITION OF logs
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Add partition with data
CREATE TABLE logs_2024_q3 PARTITION OF logs
    FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');
```

#### Removing Partitions
```sql
-- Method 1: DROP partition (loses data)
DROP TABLE logs_2023_q1;

-- Method 2: DETACH partition (preserves data)
ALTER TABLE logs DETACH PARTITION logs_2023_q1;

-- Method 3: DETACH CONCURRENTLY (non-blocking)
ALTER TABLE logs DETACH PARTITION logs_2023_q2 CONCURRENTLY;
```

#### Automated Partition Management
```sql
-- Using pg_partman extension
SELECT partman.create_parent(
    p_parent_table => 'public.logs',
    p_control => 'created_at',
    p_type => 'range',
    p_interval => 'monthly'
);
```

### 6. Partition Pruning & Constraint Exclusion (Q150-151)

#### Partition Pruning
- **Definition**: Query planner eliminating irrelevant partitions
- **Automatic**: PostgreSQL 11+ has native partition pruning
- **Runtime Pruning**: Dynamic elimination during execution
- **Startup Pruning**: Static elimination during planning

#### Monitoring Partition Pruning
```sql
-- Check if pruning is working
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM sales 
WHERE sale_date >= '2024-01-01' AND sale_date < '2024-02-01';

-- Look for "Partitions removed" in output
```

#### Constraint Exclusion (Legacy)
- Used before native partition pruning
- Still relevant for inheritance-based partitioning
- Requires CHECK constraints on partitions

```sql
-- Enable constraint exclusion
SET constraint_exclusion = partition;

-- Check constraint example
ALTER TABLE sales_2024_01 ADD CONSTRAINT sales_2024_01_check
    CHECK (sale_date >= '2024-01-01' AND sale_date < '2024-02-01');
```

### 7. Indexing with Partitions (Q152)

#### Index Strategy
- **Local Indexes**: Separate indexes on each partition
- **Global Indexes**: Not supported in PostgreSQL
- **Unique Constraints**: Must include partition key

#### Implementation Examples
```sql
-- Create indexes on individual partitions
CREATE INDEX idx_sales_2024_01_date ON sales_2024_01 (sale_date);
CREATE INDEX idx_sales_2024_01_region ON sales_2024_01 (region);

-- Unique constraint must include partition key
ALTER TABLE sales ADD CONSTRAINT sales_unique 
    UNIQUE (id, sale_date);

-- Automated index creation
CREATE INDEX idx_sales_region ON sales (region); -- Creates on all partitions
```

#### Index Maintenance
```sql
-- Monitor partition indexes
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'sales_%'
ORDER BY tablename;
```

### 8. Partitioning Best Practices (Q153)

#### Design Principles
1. **Choose Right Partition Key**
   - Most common query filter
   - Even data distribution
   - Stable over time
   - Supports partition pruning

2. **Partition Size Guidelines**
   - Target: 1-100GB per partition
   - Consider memory and CPU resources
   - Balance between too few and too many partitions

3. **Maintenance Strategy**
   - Automate partition creation/deletion
   - Regular monitoring and cleanup
   - Backup strategy per partition

#### Implementation Checklist
```sql
-- 1. Design validation
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_returned(c.oid) as rows_read
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE tablename LIKE 'sales_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 2. Query pattern analysis
SELECT query, calls, mean_exec_time, rows
FROM pg_stat_statements 
WHERE query LIKE '%sales%'
ORDER BY calls DESC;

-- 3. Pruning effectiveness
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT COUNT(*) FROM sales WHERE sale_date = '2024-01-15';
```

### 9. Sharding Fundamentals (Q154-155)

#### What is Sharding?
- **Definition**: Horizontal partitioning across multiple database instances
- **Distribution**: Data split across different servers/databases
- **Application-Level**: Requires application logic for routing
- **Scale-Out**: Enables horizontal scaling beyond single machine limits

#### Partitioning vs Sharding Comparison
| Aspect | Partitioning | Sharding |
|--------|-------------|----------|
| **Scope** | Single database | Multiple databases/servers |
| **Transparency** | Fully transparent | Application-aware |
| **Complexity** | Database manages | Application manages |
| **Scaling** | Vertical scaling | Horizontal scaling |
| **Consistency** | ACID guarantees | Eventual consistency |
| **Cross-partition queries** | Efficient | Expensive/complex |

### 10. Sharding Implementation (Q156-157)

#### Implementation Strategies
1. **Application-Level Sharding**
2. **Middleware-Based Sharding** (Citus, Postgres-XL)
3. **Proxy-Based Sharding** (PgPool-II)

#### Application-Level Example
```python
# Python sharding logic
import hashlib
import psycopg2

class ShardManager:
    def __init__(self, shard_configs):
        self.shards = {}
        for shard_id, config in shard_configs.items():
            self.shards[shard_id] = psycopg2.connect(**config)
    
    def get_shard_id(self, user_id):
        hash_value = int(hashlib.md5(str(user_id).encode()).hexdigest(), 16)
        return hash_value % len(self.shards)
    
    def get_connection(self, user_id):
        shard_id = self.get_shard_id(user_id)
        return self.shards[shard_id]
    
    def execute_on_shard(self, user_id, query, params=None):
        conn = self.get_connection(user_id)
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchall()
```

#### Citus Extension Example
```sql
-- Convert table to distributed table
SELECT create_distributed_table('users', 'user_id');

-- Create reference table (replicated to all nodes)
SELECT create_reference_table('countries');

-- Distributed query (automatic routing)
SELECT u.name, c.country_name 
FROM users u 
JOIN countries c ON u.country_id = c.id 
WHERE u.user_id = 12345;
```

#### Sharding Challenges
1. **Cross-Shard Queries**: Expensive joins and aggregations
2. **Data Consistency**: No ACID across shards
3. **Operational Complexity**: Multiple databases to manage
4. **Rebalancing**: Adding/removing shards requires data movement
5. **Schema Changes**: Must coordinate across all shards

### 11. Horizontal vs Vertical Partitioning (Q158)

#### Horizontal Partitioning (Sharding)
- **Definition**: Splitting rows across multiple tables/databases
- **Same Schema**: Each partition has identical structure
- **Row Distribution**: Based on partition key
- **Scale Data Volume**: Handles large number of rows

```sql
-- Example: Users by registration date
-- Shard 1: users_2020 (user_id 1-1000000)
-- Shard 2: users_2021 (user_id 1000001-2000000)
-- Shard 3: users_2022 (user_id 2000001-3000000)
```

#### Vertical Partitioning
- **Definition**: Splitting columns across multiple tables
- **Different Schemas**: Each partition has different columns
- **Column Distribution**: Based on access patterns
- **Normalize Access**: Separate frequently vs rarely accessed data

```sql
-- Example: User profile split
-- Core table: users (id, username, email, created_at)
-- Extended table: user_profiles (user_id, bio, preferences, settings)
-- Activity table: user_activities (user_id, last_login, login_count)
```

### 12. Choosing Partition Keys (Q159)

#### Key Selection Criteria
1. **Query Pattern Alignment**
   - Most common WHERE clause filters
   - Support for partition pruning
   - Range query compatibility

2. **Data Distribution**
   - Even distribution across partitions
   - Avoid data skew
   - Predictable growth patterns

3. **Operational Requirements**
   - Data archival patterns
   - Backup/restore strategies
   - Maintenance windows

#### Examples by Use Case
```sql
-- Time-series data: Use timestamp
CREATE TABLE sensor_readings (
    sensor_id INTEGER,
    reading_time TIMESTAMP NOT NULL,
    value DECIMAL
) PARTITION BY RANGE (reading_time);

-- Geographic data: Use region
CREATE TABLE orders (
    order_id BIGSERIAL,
    region_code TEXT NOT NULL,
    customer_id INTEGER
) PARTITION BY LIST (region_code);

-- User data: Use user_id hash
CREATE TABLE user_sessions (
    session_id UUID,
    user_id INTEGER NOT NULL,
    session_data JSONB
) PARTITION BY HASH (user_id);
```

#### Anti-patterns to Avoid
- **Low Cardinality Keys**: Boolean, small enums
- **Volatile Keys**: Frequently updated columns
- **Non-Selective Keys**: Don't support effective pruning

### 13. Cross-Partition Queries (Q160)

#### Query Types and Strategies
1. **Partition-Aware Queries**
   - Include partition key in WHERE clause
   - Enable automatic partition pruning
   - Best performance

2. **Cross-Partition Aggregations**
   - SUM, COUNT, AVG across partitions
   - Use parallel processing
   - Consider materialized views

3. **Cross-Partition Joins**
   - Expensive operations
   - Consider denormalization
   - Use reference tables

#### Optimization Techniques
```sql
-- 1. Partition pruning optimization
EXPLAIN (ANALYZE, BUFFERS) 
SELECT SUM(amount) 
FROM sales 
WHERE sale_date >= '2024-01-01' AND sale_date < '2024-02-01';

-- 2. Parallel execution
SET max_parallel_workers_per_gather = 4;
SELECT region, COUNT(*) 
FROM sales 
WHERE sale_date >= '2024-01-01'
GROUP BY region;

-- 3. Materialized view for cross-partition aggregations
CREATE MATERIALIZED VIEW monthly_sales_summary AS
SELECT 
    DATE_TRUNC('month', sale_date) as month,
    region,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM sales 
GROUP BY DATE_TRUNC('month', sale_date), region;

CREATE UNIQUE INDEX ON monthly_sales_summary (month, region);
```

#### Performance Monitoring
```sql
-- Monitor cross-partition query performance
SELECT 
    query,
    calls,
    mean_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%sales%'
ORDER BY mean_exec_time DESC;
```

## Study Plan Recommendations

### Phase 1: Fundamentals (Days 1-3)
- Master partitioning concepts and types
- Understand when and why to partition
- Practice basic partition creation

### Phase 2: Implementation (Days 4-6)
- Learn all partition types with hands-on examples
- Practice partition management operations
- Understand indexing strategies

### Phase 3: Optimization (Days 7-9)
- Master partition pruning and constraint exclusion
- Learn performance monitoring techniques
- Practice query optimization across partitions

### Phase 4: Advanced Topics (Days 10-12)
- Study sharding concepts and implementation
- Learn cross-partition query strategies
- Practice real-world scenarios

## Key Resources for Interview Preparation

1. **PostgreSQL Documentation**: Partitioning section
2. **Hands-on Practice**: Set up test environment with sample data
3. **Performance Testing**: Use EXPLAIN ANALYZE extensively
4. **Real-world Examples**: Study partition patterns in your domain
5. **Monitoring Tools**: Learn pg_stat_statements, pg_stat_user_tables

## Common Interview Scenarios

1. **Architecture Design**: Design partitioning strategy for time-series data
2. **Performance Troubleshooting**: Diagnose slow cross-partition queries
3. **Migration Planning**: Convert existing table to partitioned table
4. **Capacity Planning**: Determine optimal partition size and count
5. **Operational Procedures**: Implement automated partition management

This knowledge foundation will enable you to confidently answer all PostgreSQL partitioning and sharding questions (Q141-160) in technical interviews.