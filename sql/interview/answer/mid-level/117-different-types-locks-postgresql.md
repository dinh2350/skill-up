# 117. What are the different types of locks in PostgreSQL?

PostgreSQL implements a sophisticated multi-granularity locking system to ensure data consistency and manage concurrent access. The database uses various types of locks at different levels to balance performance with data integrity.

## Overview of PostgreSQL Lock Types

### Lock Hierarchy
PostgreSQL implements locks at multiple levels:
- **Table-level locks**: Control access to entire tables
- **Row-level locks**: Control access to individual rows
- **Page-level locks**: Internal locks on data pages
- **Advisory locks**: Application-defined locks
- **System locks**: Internal database operation locks

## 1. Table-Level Locks

Table-level locks control concurrent access to entire tables and are the most visible type of locks in PostgreSQL.

```sql
-- Demonstration of table-level lock types
CREATE TABLE IF NOT EXISTS lock_demo (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    value INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO lock_demo (name, value) 
VALUES ('Test1', 100), ('Test2', 200), ('Test3', 300)
ON CONFLICT DO NOTHING;

-- Function to demonstrate different table lock modes
CREATE OR REPLACE FUNCTION demonstrate_table_locks()
RETURNS TABLE(
    lock_mode VARCHAR(25),
    lock_strength VARCHAR(15),
    conflicts_with TEXT[],
    typical_operations TEXT[],
    performance_impact VARCHAR(15),
    description TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    -- Least restrictive locks
    ('ACCESS SHARE', 'WEAKEST',
     ARRAY['ACCESS EXCLUSIVE'],
     ARRAY['SELECT', 'COPY TO'],
     'MINIMAL',
     'Allows concurrent reads, prevents only table drops/alters'),
    
    ('ROW SHARE', 'WEAK',
     ARRAY['EXCLUSIVE', 'ACCESS EXCLUSIVE'],
     ARRAY['SELECT FOR UPDATE', 'SELECT FOR SHARE'],
     'LOW',
     'Allows most operations, prevents exclusive table access'),
    
    ('ROW EXCLUSIVE', 'MODERATE',
     ARRAY['SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
     ARRAY['INSERT', 'UPDATE', 'DELETE'],
     'MEDIUM',
     'Standard DML operations, conflicts with table-level exclusive access'),
    
    ('SHARE UPDATE EXCLUSIVE', 'MODERATE-HIGH',
     ARRAY['SHARE UPDATE EXCLUSIVE', 'SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
     ARRAY['VACUUM', 'ANALYZE', 'CREATE INDEX CONCURRENTLY'],
     'MEDIUM',
     'Utility operations that need to prevent other utility operations'),
    
    ('SHARE', 'HIGH',
     ARRAY['ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
     ARRAY['CREATE INDEX', 'COPY FROM'],
     'HIGH',
     'Allows concurrent reads, prevents writes'),
    
    ('SHARE ROW EXCLUSIVE', 'HIGH',
     ARRAY['ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', 'SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
     ARRAY['CREATE TRIGGER', 'Some ALTER TABLE'],
     'HIGH',
     'Very restrictive, allows only reads'),
    
    ('EXCLUSIVE', 'VERY HIGH',
     ARRAY['ROW SHARE', 'ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', 'SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
     ARRAY['REFRESH MATERIALIZED VIEW'],
     'VERY HIGH',
     'Blocks all but ACCESS SHARE'),
    
    -- Most restrictive lock
    ('ACCESS EXCLUSIVE', 'STRONGEST',
     ARRAY['ACCESS SHARE', 'ROW SHARE', 'ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', 'SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
     ARRAY['DROP TABLE', 'ALTER TABLE', 'TRUNCATE', 'REINDEX'],
     'MAXIMUM',
     'Blocks all other access to the table');
END;
$$ LANGUAGE plpgsql;

-- Function to analyze current table locks
CREATE OR REPLACE FUNCTION analyze_current_table_locks()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    lock_mode TEXT,
    lock_type VARCHAR(20),
    session_count INTEGER,
    blocking_potential VARCHAR(15),
    wait_queue_size INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH table_lock_analysis AS (
        SELECT 
            n.nspname,
            c.relname,
            l.mode,
            l.locktype,
            COUNT(*) as session_count,
            COUNT(*) FILTER (WHERE NOT l.granted) as waiting_sessions
        FROM pg_locks l
        JOIN pg_class c ON l.relation = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE l.locktype = 'relation'
        AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        GROUP BY n.nspname, c.relname, l.mode, l.locktype
    )
    SELECT 
        tla.nspname::TEXT,
        tla.relname::TEXT,
        tla.mode::TEXT,
        tla.locktype::VARCHAR(20),
        tla.session_count::INTEGER,
        CASE 
            WHEN tla.mode IN ('ACCESS EXCLUSIVE', 'EXCLUSIVE') THEN 'VERY HIGH'
            WHEN tla.mode IN ('SHARE', 'SHARE ROW EXCLUSIVE') THEN 'HIGH'
            WHEN tla.mode IN ('SHARE UPDATE EXCLUSIVE', 'ROW EXCLUSIVE') THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15),
        tla.waiting_sessions::INTEGER
    FROM table_lock_analysis tla
    ORDER BY 
        CASE tla.mode
            WHEN 'ACCESS EXCLUSIVE' THEN 8
            WHEN 'EXCLUSIVE' THEN 7
            WHEN 'SHARE ROW EXCLUSIVE' THEN 6
            WHEN 'SHARE' THEN 5
            WHEN 'SHARE UPDATE EXCLUSIVE' THEN 4
            WHEN 'ROW EXCLUSIVE' THEN 3
            WHEN 'ROW SHARE' THEN 2
            WHEN 'ACCESS SHARE' THEN 1
            ELSE 0
        END DESC,
        tla.session_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_table_locks() ORDER BY lock_mode;
SELECT * FROM analyze_current_table_locks();
```

### Table Lock Compatibility Matrix

```sql
-- Function to show lock compatibility matrix
CREATE OR REPLACE FUNCTION show_lock_compatibility_matrix()
RETURNS TABLE(
    lock_mode_1 VARCHAR(25),
    lock_mode_2 VARCHAR(25),
    compatible BOOLEAN,
    conflict_severity VARCHAR(15),
    resolution_strategy TEXT
) AS $$
BEGIN
    -- Create comprehensive compatibility matrix
    RETURN QUERY VALUES
    -- ACCESS SHARE compatibility
    ('ACCESS SHARE', 'ACCESS SHARE', TRUE, 'NONE', 'Concurrent reads allowed'),
    ('ACCESS SHARE', 'ROW SHARE', TRUE, 'NONE', 'Read and row-level locking compatible'),
    ('ACCESS SHARE', 'ROW EXCLUSIVE', TRUE, 'NONE', 'Reads don''t block DML operations'),
    ('ACCESS SHARE', 'SHARE UPDATE EXCLUSIVE', TRUE, 'NONE', 'Utility operations allow reads'),
    ('ACCESS SHARE', 'SHARE', TRUE, 'NONE', 'Index creation allows reads'),
    ('ACCESS SHARE', 'SHARE ROW EXCLUSIVE', TRUE, 'NONE', 'Concurrent reads allowed'),
    ('ACCESS SHARE', 'EXCLUSIVE', TRUE, 'NONE', 'Special case - reads still allowed'),
    ('ACCESS SHARE', 'ACCESS EXCLUSIVE', FALSE, 'BLOCKING', 'DDL operations block all access'),
    
    -- ROW SHARE compatibility
    ('ROW SHARE', 'ROW SHARE', TRUE, 'NONE', 'Multiple row locks compatible'),
    ('ROW SHARE', 'ROW EXCLUSIVE', TRUE, 'NONE', 'Row locks and DML compatible'),
    ('ROW SHARE', 'SHARE UPDATE EXCLUSIVE', TRUE, 'NONE', 'Row locks don''t block utilities'),
    ('ROW SHARE', 'SHARE', TRUE, 'NONE', 'Row locks compatible with shared access'),
    ('ROW SHARE', 'SHARE ROW EXCLUSIVE', TRUE, 'NONE', 'Compatible with shared row access'),
    ('ROW SHARE', 'EXCLUSIVE', FALSE, 'MODERATE', 'Exclusive access blocks row locks'),
    ('ROW SHARE', 'ACCESS EXCLUSIVE', FALSE, 'BLOCKING', 'DDL blocks row-level operations'),
    
    -- ROW EXCLUSIVE compatibility
    ('ROW EXCLUSIVE', 'ROW EXCLUSIVE', TRUE, 'NONE', 'Multiple DML operations compatible'),
    ('ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', TRUE, 'NONE', 'DML compatible with utilities'),
    ('ROW EXCLUSIVE', 'SHARE', FALSE, 'HIGH', 'Writes conflict with shared access'),
    ('ROW EXCLUSIVE', 'SHARE ROW EXCLUSIVE', FALSE, 'HIGH', 'DML conflicts with exclusive shared access'),
    ('ROW EXCLUSIVE', 'EXCLUSIVE', FALSE, 'HIGH', 'DML blocked by exclusive access'),
    ('ROW EXCLUSIVE', 'ACCESS EXCLUSIVE', FALSE, 'BLOCKING', 'DDL blocks all DML'),
    
    -- Higher-level lock conflicts
    ('SHARE', 'SHARE', TRUE, 'NONE', 'Multiple shared locks compatible'),
    ('SHARE', 'SHARE UPDATE EXCLUSIVE', FALSE, 'MODERATE', 'Shared access conflicts with exclusive utilities'),
    ('SHARE', 'EXCLUSIVE', FALSE, 'HIGH', 'Shared access conflicts with exclusive access'),
    
    -- Most restrictive locks
    ('ACCESS EXCLUSIVE', 'ACCESS EXCLUSIVE', FALSE, 'BLOCKING', 'Only one DDL operation at a time'),
    ('EXCLUSIVE', 'EXCLUSIVE', FALSE, 'HIGH', 'Only one exclusive operation at a time');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM show_lock_compatibility_matrix() 
WHERE NOT compatible 
ORDER BY conflict_severity DESC, lock_mode_1, lock_mode_2;
```

## 2. Row-Level Locks

Row-level locks provide fine-grained concurrency control for individual table rows.

```sql
-- Demonstration of row-level locks
CREATE OR REPLACE FUNCTION demonstrate_row_level_locks()
RETURNS TABLE(
    lock_type VARCHAR(30),
    sql_syntax TEXT,
    concurrency_level VARCHAR(15),
    use_cases TEXT[],
    lock_behavior TEXT,
    performance_notes TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('FOR UPDATE', 
     'SELECT ... FOR UPDATE',
     'EXCLUSIVE',
     ARRAY['Pessimistic locking', 'Ensuring row availability for update', 'Preventing lost updates'],
     'Exclusive row lock - blocks other FOR UPDATE and FOR SHARE',
     'Highest lock overhead, strongest consistency'),
    
    ('FOR NO KEY UPDATE',
     'SELECT ... FOR NO KEY UPDATE', 
     'MODERATE',
     ARRAY['Update non-key columns', 'Allow concurrent key updates', 'Reduced lock conflicts'],
     'Allows concurrent FOR KEY SHARE locks',
     'Better concurrency than FOR UPDATE for non-key updates'),
    
    ('FOR SHARE',
     'SELECT ... FOR SHARE',
     'SHARED',
     ARRAY['Prevent row deletion', 'Allow concurrent reads', 'Multi-reader scenarios'],
     'Shared row lock - multiple sessions can hold simultaneously',
     'Blocks FOR UPDATE but allows other FOR SHARE'),
    
    ('FOR KEY SHARE',
     'SELECT ... FOR KEY SHARE',
     'MINIMAL',
     ARRAY['Prevent key changes', 'Maximum concurrency', 'Foreign key enforcement'],
     'Weakest row lock - only blocks FOR UPDATE',
     'Minimal performance impact, maximum concurrency'),
    
    ('Implicit Row Lock',
     'UPDATE/DELETE without FOR clause',
     'AUTOMATIC',
     ARRAY['Standard DML operations', 'Automatic locking', 'MVCC integration'],
     'Automatically acquired during UPDATE/DELETE operations',
     'Optimized for MVCC, minimal explicit overhead');
END;
$$ LANGUAGE plpgsql;

-- Function to demonstrate row lock interactions
CREATE OR REPLACE FUNCTION test_row_lock_interactions(
    test_row_id INTEGER DEFAULT 1
) RETURNS TABLE(
    test_scenario VARCHAR(50),
    session_1_operation TEXT,
    session_2_operation TEXT,
    interaction_result VARCHAR(30),
    explanation TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('FOR UPDATE vs FOR UPDATE',
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id || ' FOR UPDATE',
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id || ' FOR UPDATE',
     'BLOCKS',
     'Second session waits until first releases lock'),
    
    ('FOR UPDATE vs FOR SHARE',
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id || ' FOR UPDATE',
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id || ' FOR SHARE',
     'BLOCKS',
     'FOR SHARE waits for exclusive FOR UPDATE to complete'),
    
    ('FOR SHARE vs FOR SHARE',
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id || ' FOR SHARE',
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id || ' FOR SHARE',
     'CONCURRENT',
     'Multiple sessions can hold FOR SHARE simultaneously'),
    
    ('FOR NO KEY UPDATE vs FOR KEY SHARE',
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id || ' FOR NO KEY UPDATE',
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id || ' FOR KEY SHARE',
     'CONCURRENT',
     'FOR KEY SHARE allowed with FOR NO KEY UPDATE'),
    
    ('UPDATE vs SELECT',
     'UPDATE lock_demo SET value = 999 WHERE id = ' || test_row_id,
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id,
     'MVCC ISOLATION',
     'SELECT sees snapshot, UPDATE creates new version'),
    
    ('UPDATE vs FOR UPDATE',
     'UPDATE lock_demo SET value = 888 WHERE id = ' || test_row_id,
     'SELECT * FROM lock_demo WHERE id = ' || test_row_id || ' FOR UPDATE',
     'BLOCKS',
     'FOR UPDATE waits for UPDATE transaction to complete');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_row_level_locks();
SELECT * FROM test_row_lock_interactions(1);
```

## 3. Advisory Locks

Advisory locks are application-controlled locks that don't automatically lock database objects.

```sql
-- Comprehensive advisory lock demonstration
CREATE OR REPLACE FUNCTION demonstrate_advisory_locks()
RETURNS TABLE(
    lock_function VARCHAR(40),
    lock_scope VARCHAR(20),
    blocking_behavior VARCHAR(15),
    use_cases TEXT[],
    example_usage TEXT,
    best_practices TEXT[]
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('pg_advisory_lock(key)',
     'SESSION',
     'BLOCKING',
     ARRAY['Application-level mutexes', 'Critical section protection', 'Resource coordination'],
     'SELECT pg_advisory_lock(12345);',
     ARRAY['Use consistent key schemes', 'Always unlock in exception handlers', 'Document key allocations']),
    
    ('pg_try_advisory_lock(key)',
     'SESSION', 
     'NON-BLOCKING',
     ARRAY['Optional locking', 'Fallback strategies', 'Performance-critical paths'],
     'SELECT pg_try_advisory_lock(12345);',
     ARRAY['Check return value', 'Implement retry logic', 'Have fallback plans']),
    
    ('pg_advisory_lock_shared(key)',
     'SESSION',
     'BLOCKING-SHARED',
     ARRAY['Reader-writer patterns', 'Shared resource access', 'Multi-reader scenarios'],
     'SELECT pg_advisory_lock_shared(12345);',
     ARRAY['Use for read-heavy workloads', 'Pair with exclusive locks', 'Monitor contention']),
    
    ('pg_advisory_xact_lock(key)',
     'TRANSACTION',
     'BLOCKING',
     ARRAY['Transaction-scoped coordination', 'Automatic cleanup', 'Batch processing'],
     'SELECT pg_advisory_xact_lock(12345);',
     ARRAY['Preferred for transaction-bounded work', 'No explicit unlock needed', 'Use for short-lived locks']),
    
    ('pg_try_advisory_xact_lock(key)',
     'TRANSACTION',
     'NON-BLOCKING',
     ARRAY['Conditional transaction locking', 'Optimistic coordination', 'High-throughput scenarios'],
     'SELECT pg_try_advisory_xact_lock(12345);',
     ARRAY['Ideal for high-concurrency apps', 'Implement proper error handling', 'Consider lock hierarchies']);
END;
$$ LANGUAGE plpgsql;

-- Practical advisory lock examples
CREATE OR REPLACE FUNCTION advisory_lock_examples()
RETURNS TABLE(
    example_name VARCHAR(50),
    scenario_description TEXT,
    implementation_code TEXT,
    coordination_pattern VARCHAR(30),
    scalability_notes TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Application Deployment Lock',
     'Ensure only one deployment process runs at a time',
     'SELECT pg_advisory_lock(hashtext(''deployment_mutex''));
-- Perform deployment operations
SELECT pg_advisory_unlock(hashtext(''deployment_mutex''));',
     'EXCLUSIVE_PROCESS',
     'Prevents concurrent deployments across multiple servers'),
    
    ('Cache Refresh Coordination',
     'Coordinate cache refresh among multiple application instances',
     'IF pg_try_advisory_lock(hashtext(''cache_refresh'')) THEN
  -- Refresh cache
  SELECT pg_advisory_unlock(hashtext(''cache_refresh''));
ELSE
  -- Use existing cache
END IF;',
     'LEADER_ELECTION',
     'Only one instance refreshes cache, others use existing data'),
    
    ('Batch Job Coordination',
     'Prevent multiple batch jobs from processing same data',
     'SELECT pg_advisory_xact_lock(job_id + 1000000);
-- Process batch data for job_id
-- Lock automatically released on transaction end',
     'JOB_SERIALIZATION',
     'Each job gets unique lock, automatic cleanup on completion'),
    
    ('Resource Pool Management',
     'Manage limited shared resources across sessions',
     'SELECT pg_advisory_lock_shared(resource_pool_id);
-- Use shared resource
SELECT pg_advisory_unlock_shared(resource_pool_id);',
     'SHARED_RESOURCE',
     'Multiple readers, exclusive writers pattern for resource access'),
    
    ('Feature Flag Coordination',
     'Coordinate feature rollouts across application tiers',
     'IF pg_try_advisory_lock(feature_flag_id) THEN
  -- Update feature configuration
  SELECT pg_advisory_unlock(feature_flag_id);
  RETURN ''success'';
ELSE
  RETURN ''locked_by_another_process'';
END IF;',
     'CONFIGURATION_SYNC',
     'Prevents concurrent feature flag changes during rollout');
END;
$$ LANGUAGE plpgsql;

-- Monitor advisory locks
CREATE OR REPLACE FUNCTION monitor_advisory_locks()
RETURNS TABLE(
    lock_key BIGINT,
    lock_type VARCHAR(20),
    lock_mode VARCHAR(20),
    session_pid INTEGER,
    application_name TEXT,
    lock_granted BOOLEAN,
    lock_duration INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (l.classid::BIGINT << 32) | l.objid::BIGINT as advisory_key,
        CASE l.locktype
            WHEN 'advisory' THEN 'ADVISORY'
            ELSE l.locktype
        END::VARCHAR(20),
        l.mode::VARCHAR(20),
        l.pid::INTEGER,
        COALESCE(sa.application_name, 'unknown')::TEXT,
        l.granted,
        COALESCE(CURRENT_TIMESTAMP - sa.query_start, INTERVAL '0')
    FROM pg_locks l
    LEFT JOIN pg_stat_activity sa ON l.pid = sa.pid
    WHERE l.locktype = 'advisory'
    ORDER BY advisory_key, l.pid;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_advisory_locks();
SELECT * FROM advisory_lock_examples();
SELECT * FROM monitor_advisory_locks();
```

## 4. System and Internal Locks

PostgreSQL uses various internal locks for system operations.

```sql
-- Function to categorize and explain system locks
CREATE OR REPLACE FUNCTION explain_system_locks()
RETURNS TABLE(
    lock_category VARCHAR(30),
    lock_types TEXT[],
    purpose TEXT,
    visibility VARCHAR(15),
    user_control VARCHAR(15),
    performance_impact VARCHAR(15)
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Transaction Locks',
     ARRAY['transactionid', 'virtualxid'],
     'Control transaction visibility and ordering in MVCC system',
     'INTERNAL',
     'AUTOMATIC',
     'LOW'),
    
    ('Tuple Locks',
     ARRAY['tuple'],
     'Row-level locking implementation for specific row versions',
     'HIDDEN',
     'AUTOMATIC',
     'VARIABLE'),
    
    ('Object Locks',
     ARRAY['object', 'userlock'],
     'Protect database objects during DDL operations',
     'VISIBLE',
     'LIMITED',
     'HIGH'),
    
    ('Page Locks',
     ARRAY['page'],
     'Temporary locks on data pages during I/O operations',
     'INTERNAL',
     'NONE',
     'LOW'),
    
    ('Extend Locks',
     ARRAY['extend'],
     'Coordinate table/index extension operations',
     'INTERNAL',
     'AUTOMATIC',
     'LOW'),
    
    ('Predicate Locks',
     ARRAY['siread'],
     'Implement serializable isolation level guarantees',
     'SPECIALIZED',
     'AUTOMATIC',
     'MEDIUM'),
    
    ('Heavyweight Locks',
     ARRAY['relation', 'database', 'tablespace'],
     'Major database objects and resource protection',
     'VISIBLE',
     'PARTIAL',
     'HIGH');
END;
$$ LANGUAGE plpgsql;

-- Comprehensive system lock monitoring
CREATE OR REPLACE FUNCTION monitor_all_lock_types()
RETURNS TABLE(
    lock_category VARCHAR(30),
    locktype VARCHAR(20),
    lock_count BIGINT,
    granted_locks BIGINT,
    waiting_locks BIGINT,
    avg_hold_time INTERVAL,
    max_wait_time INTERVAL,
    contention_level VARCHAR(15)
) AS $$
BEGIN
    RETURN QUERY
    WITH lock_stats AS (
        SELECT 
            CASE 
                WHEN l.locktype IN ('transactionid', 'virtualxid') THEN 'Transaction'
                WHEN l.locktype = 'relation' THEN 'Table/Index'
                WHEN l.locktype = 'tuple' THEN 'Row-level'
                WHEN l.locktype = 'advisory' THEN 'Advisory'
                WHEN l.locktype IN ('object', 'userlock') THEN 'Object'
                WHEN l.locktype IN ('page', 'extend') THEN 'Storage'
                WHEN l.locktype = 'siread' THEN 'Predicate'
                ELSE 'Other'
            END as category,
            l.locktype,
            l.granted,
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(sa.query_start, sa.state_change))) as hold_duration
        FROM pg_locks l
        LEFT JOIN pg_stat_activity sa ON l.pid = sa.pid
    ),
    aggregated_stats AS (
        SELECT 
            category,
            locktype,
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE granted) as granted_count,
            COUNT(*) FILTER (WHERE NOT granted) as waiting_count,
            AVG(hold_duration) FILTER (WHERE granted) as avg_hold_seconds,
            MAX(hold_duration) FILTER (WHERE NOT granted) as max_wait_seconds
        FROM lock_stats
        GROUP BY category, locktype
    )
    SELECT 
        as2.category::VARCHAR(30),
        as2.locktype::VARCHAR(20),
        as2.total_count,
        as2.granted_count,
        as2.waiting_count,
        (COALESCE(as2.avg_hold_seconds, 0) || ' seconds')::INTERVAL,
        (COALESCE(as2.max_wait_seconds, 0) || ' seconds')::INTERVAL,
        CASE 
            WHEN as2.waiting_count = 0 THEN 'NONE'
            WHEN as2.waiting_count < 3 THEN 'LOW'
            WHEN as2.waiting_count < 10 THEN 'MEDIUM'
            WHEN as2.waiting_count < 25 THEN 'HIGH'
            ELSE 'CRITICAL'
        END::VARCHAR(15)
    FROM aggregated_stats as2
    ORDER BY as2.waiting_count DESC, as2.total_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM explain_system_locks();
SELECT * FROM monitor_all_lock_types() WHERE lock_count > 0;
```

## 5. Lock Monitoring and Troubleshooting

Comprehensive monitoring functions for all lock types.

```sql
-- Complete lock analysis dashboard
CREATE OR REPLACE FUNCTION comprehensive_lock_analysis()
RETURNS TABLE(
    analysis_section VARCHAR(30),
    metric_name VARCHAR(40),
    current_value TEXT,
    threshold_status VARCHAR(15),
    recommendation TEXT
) AS $$
DECLARE
    total_locks INTEGER;
    waiting_locks INTEGER;
    blocked_sessions INTEGER;
    max_wait_seconds DECIMAL;
    advisory_locks INTEGER;
    table_locks INTEGER;
BEGIN
    -- Gather metrics
    SELECT COUNT(*) INTO total_locks FROM pg_locks;
    SELECT COUNT(*) INTO waiting_locks FROM pg_locks WHERE NOT granted;
    SELECT COUNT(DISTINCT pid) INTO blocked_sessions FROM pg_locks WHERE NOT granted;
    
    SELECT COALESCE(MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start))), 0)
    INTO max_wait_seconds
    FROM pg_stat_activity sa
    JOIN pg_locks l ON sa.pid = l.pid
    WHERE NOT l.granted;
    
    SELECT COUNT(*) INTO advisory_locks FROM pg_locks WHERE locktype = 'advisory';
    SELECT COUNT(*) INTO table_locks FROM pg_locks WHERE locktype = 'relation';
    
    -- System Overview
    RETURN QUERY SELECT 
        'System Overview'::VARCHAR(30),
        'Total Active Locks'::VARCHAR(40),
        total_locks::TEXT,
        CASE 
            WHEN total_locks > 1000 THEN 'WARNING'
            WHEN total_locks > 500 THEN 'CAUTION'
            ELSE 'NORMAL'
        END::VARCHAR(15),
        CASE 
            WHEN total_locks > 1000 THEN 'High lock count - investigate lock contention'
            WHEN total_locks > 500 THEN 'Elevated lock usage - monitor trends'
            ELSE 'Lock usage within normal range'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Contention Analysis'::VARCHAR(30),
        'Waiting Sessions'::VARCHAR(40),
        blocked_sessions::TEXT,
        CASE 
            WHEN blocked_sessions > 20 THEN 'CRITICAL'
            WHEN blocked_sessions > 10 THEN 'WARNING'
            WHEN blocked_sessions > 5 THEN 'CAUTION'
            ELSE 'NORMAL'
        END::VARCHAR(15),
        CASE 
            WHEN blocked_sessions > 10 THEN 'Significant blocking detected - immediate investigation needed'
            WHEN blocked_sessions > 5 THEN 'Moderate blocking - monitor for escalation'
            ELSE 'Minimal blocking detected'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Performance Impact'::VARCHAR(30),
        'Maximum Wait Time (seconds)'::VARCHAR(40),
        ROUND(max_wait_seconds::NUMERIC, 2)::TEXT,
        CASE 
            WHEN max_wait_seconds > 60 THEN 'CRITICAL'
            WHEN max_wait_seconds > 30 THEN 'WARNING'
            WHEN max_wait_seconds > 10 THEN 'CAUTION'
            ELSE 'NORMAL'
        END::VARCHAR(15),
        CASE 
            WHEN max_wait_seconds > 60 THEN 'Long waits detected - identify blocking queries'
            WHEN max_wait_seconds > 30 THEN 'Moderate wait times - review query patterns'
            ELSE 'Wait times within acceptable range'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Lock Distribution'::VARCHAR(30),
        'Advisory Locks'::VARCHAR(40),
        advisory_locks::TEXT,
        CASE 
            WHEN advisory_locks > 100 THEN 'WARNING'
            WHEN advisory_locks > 50 THEN 'CAUTION'
            ELSE 'NORMAL'
        END::VARCHAR(15),
        CASE 
            WHEN advisory_locks > 100 THEN 'High advisory lock usage - review application logic'
            ELSE 'Advisory lock usage appears normal'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Lock Distribution'::VARCHAR(30),
        'Table-Level Locks'::VARCHAR(40),
        table_locks::TEXT,
        CASE 
            WHEN table_locks > 200 THEN 'WARNING'
            WHEN table_locks > 100 THEN 'CAUTION'
            ELSE 'NORMAL'
        END::VARCHAR(15),
        CASE 
            WHEN table_locks > 200 THEN 'High table lock count - review transaction patterns'
            ELSE 'Table lock usage within expected range'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM comprehensive_lock_analysis() ORDER BY analysis_section, metric_name;
```

## Summary

**PostgreSQL Lock Types Overview:**

**1. Table-Level Locks:**
- **ACCESS SHARE**: Weakest lock, allows concurrent reads
- **ROW SHARE**: Used by SELECT FOR UPDATE/SHARE
- **ROW EXCLUSIVE**: Standard DML operations (INSERT/UPDATE/DELETE)
- **SHARE UPDATE EXCLUSIVE**: VACUUM, ANALYZE operations
- **SHARE**: CREATE INDEX operations
- **SHARE ROW EXCLUSIVE**: Restrictive utility operations
- **EXCLUSIVE**: REFRESH MATERIALIZED VIEW
- **ACCESS EXCLUSIVE**: Strongest lock, DDL operations

**2. Row-Level Locks:**
- **FOR UPDATE**: Exclusive row access
- **FOR NO KEY UPDATE**: Non-key column updates
- **FOR SHARE**: Shared row access
- **FOR KEY SHARE**: Minimal row protection

**3. Advisory Locks:**
- **Session-scoped**: Manual unlock required
- **Transaction-scoped**: Automatic cleanup
- **Shared/Exclusive**: Reader-writer patterns
- **Blocking/Non-blocking**: Different wait behaviors

**4. System Locks:**
- **Transaction locks**: MVCC coordination
- **Object locks**: DDL protection
- **Page/Extend locks**: Storage operations
- **Predicate locks**: Serializable isolation

**Lock Characteristics:**
- **Granularity**: Table → Row → Internal
- **Strength**: ACCESS EXCLUSIVE strongest → ACCESS SHARE weakest
- **Compatibility**: Defined by lock mode interactions
- **Performance**: Balance between consistency and concurrency

**Best Practices:**
- Monitor lock waits and contention patterns
- Use appropriate lock granularity for workload
- Implement timeout strategies for application locks
- Design transactions to minimize lock hold time
- Use advisory locks for application-level coordination

**Monitoring Tools:**
- `pg_locks` view for current lock status
- `pg_stat_activity` for session information
- Custom functions for lock analysis and alerting
- Performance impact assessment and trending

PostgreSQL's multi-granularity locking system provides flexible concurrency control while maintaining ACID properties, supporting everything from high-concurrency OLTP to complex analytical workloads.