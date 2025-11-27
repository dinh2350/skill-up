# 119. What is table-level locking?

**Table-level locking** is PostgreSQL's coarse-grained concurrency control mechanism that controls access to entire tables rather than individual rows. These locks coordinate major operations like DDL (Data Definition Language) commands, bulk operations, and maintenance tasks while ensuring data consistency across concurrent transactions.

## Core Concepts

### Lock Hierarchy and Granularity
PostgreSQL implements a hierarchical locking system:
- **Table Level**: Controls access to entire tables (this topic)
- **Row Level**: Controls access to individual rows
- **Page Level**: Internal locks for data pages
- **System Level**: Database and transaction management locks

Table-level locks are the most visible and impactful for application performance, as they can block access to entire tables.

### Lock Acquisition
Table-level locks are automatically acquired by:
- **DDL Operations**: ALTER TABLE, DROP TABLE, CREATE INDEX
- **DML Operations**: SELECT, INSERT, UPDATE, DELETE (different strengths)
- **Maintenance Operations**: VACUUM, ANALYZE, REINDEX
- **Explicit Commands**: LOCK TABLE statements

## The Eight Table Lock Modes

PostgreSQL defines eight distinct table lock modes, ordered from weakest to strongest:

```sql
-- Comprehensive demonstration of all table lock modes
CREATE TABLE IF NOT EXISTS table_lock_demo (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO table_lock_demo (name, data)
VALUES 
    ('Record 1', 'Sample data 1'),
    ('Record 2', 'Sample data 2'),
    ('Record 3', 'Sample data 3'),
    ('Record 4', 'Sample data 4'),
    ('Record 5', 'Sample data 5')
ON CONFLICT DO NOTHING;

-- Function to explain all table lock modes
CREATE OR REPLACE FUNCTION explain_table_lock_modes()
RETURNS TABLE(
    lock_mode VARCHAR(25),
    strength_level INTEGER,
    typical_operations TEXT[],
    allows_concurrent_reads BOOLEAN,
    allows_concurrent_writes BOOLEAN,
    allows_ddl BOOLEAN,
    performance_impact VARCHAR(15),
    description TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    -- Weakest locks (allow most concurrency)
    ('ACCESS SHARE', 1,
     ARRAY['SELECT', 'COPY TO', 'pg_dump'],
     TRUE, TRUE, FALSE,
     'MINIMAL',
     'Weakest lock - only conflicts with ACCESS EXCLUSIVE (table drops/major ALTERs)'),
    
    ('ROW SHARE', 2,
     ARRAY['SELECT FOR UPDATE', 'SELECT FOR SHARE'],
     TRUE, TRUE, FALSE,
     'MINIMAL',
     'Row-level locking queries - conflicts with EXCLUSIVE and ACCESS EXCLUSIVE'),
    
    ('ROW EXCLUSIVE', 3,
     ARRAY['INSERT', 'UPDATE', 'DELETE'],
     TRUE, TRUE, FALSE,
     'LOW',
     'Standard DML operations - conflicts with SHARE and stronger locks'),
    
    ('SHARE UPDATE EXCLUSIVE', 4,
     ARRAY['VACUUM', 'ANALYZE', 'CREATE INDEX CONCURRENTLY'],
     TRUE, TRUE, FALSE,
     'MEDIUM',
     'Maintenance operations - prevents other maintenance but allows DML'),
    
    ('SHARE', 5,
     ARRAY['CREATE INDEX (non-concurrent)', 'COPY FROM'],
     TRUE, FALSE, FALSE,
     'HIGH',
     'Allows concurrent reads but blocks all writes'),
    
    ('SHARE ROW EXCLUSIVE', 6,
     ARRAY['CREATE TRIGGER', 'Some ALTER TABLE operations'],
     TRUE, FALSE, FALSE,
     'HIGH',
     'Very restrictive - only allows concurrent ACCESS SHARE'),
    
    ('EXCLUSIVE', 7,
     ARRAY['REFRESH MATERIALIZED VIEW'],
     TRUE, FALSE, FALSE,
     'VERY HIGH',
     'Blocks everything except ACCESS SHARE (SELECT)'),
    
    -- Strongest lock (blocks everything)
    ('ACCESS EXCLUSIVE', 8,
     ARRAY['DROP TABLE', 'TRUNCATE', 'ALTER TABLE (most)', 'REINDEX', 'CLUSTER'],
     FALSE, FALSE, TRUE,
     'MAXIMUM',
     'Strongest lock - blocks all other access including SELECT');
END;
$$ LANGUAGE plpgsql;

-- Function to demonstrate lock compatibility
CREATE OR REPLACE FUNCTION demonstrate_lock_compatibility()
RETURNS TABLE(
    lock_1 VARCHAR(25),
    lock_2 VARCHAR(25),
    compatible BOOLEAN,
    conflict_scenario TEXT,
    real_world_example TEXT
) AS $$
BEGIN
    -- Show key compatibility relationships
    RETURN QUERY VALUES
    -- Compatible combinations
    ('ACCESS SHARE', 'ACCESS SHARE', TRUE, 'Multiple readers', 'Multiple SELECT queries running simultaneously'),
    ('ACCESS SHARE', 'ROW SHARE', TRUE, 'Reads with row locks', 'SELECT with concurrent SELECT FOR UPDATE'),
    ('ACCESS SHARE', 'ROW EXCLUSIVE', TRUE, 'Reads with writes', 'SELECT during INSERT/UPDATE/DELETE operations'),
    ('ROW EXCLUSIVE', 'ROW EXCLUSIVE', TRUE, 'Multiple DML', 'Concurrent INSERT/UPDATE/DELETE on different rows'),
    ('SHARE', 'SHARE', TRUE, 'Multiple shared operations', 'Multiple CREATE INDEX operations (rare but possible)'),
    
    -- Common conflict scenarios
    ('ACCESS SHARE', 'ACCESS EXCLUSIVE', FALSE, 'Read vs DDL', 'SELECT blocked by ALTER TABLE or DROP TABLE'),
    ('ROW EXCLUSIVE', 'SHARE', FALSE, 'Write vs Index creation', 'INSERT/UPDATE blocked by CREATE INDEX'),
    ('ROW EXCLUSIVE', 'ACCESS EXCLUSIVE', FALSE, 'Write vs DDL', 'DML operations blocked by table restructuring'),
    ('SHARE', 'ROW EXCLUSIVE', FALSE, 'Index vs Write', 'CREATE INDEX blocks INSERT/UPDATE/DELETE'),
    ('EXCLUSIVE', 'ACCESS SHARE', FALSE, 'Exclusive vs Read', 'REFRESH MATERIALIZED VIEW blocks SELECT (rare case)'),
    
    -- Special cases
    ('SHARE UPDATE EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', FALSE, 'Multiple maintenance', 'Two VACUUM operations cannot run simultaneously'),
    ('ACCESS EXCLUSIVE', 'ACCESS EXCLUSIVE', FALSE, 'Multiple DDL', 'Only one DDL operation at a time per table');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM explain_table_lock_modes() ORDER BY strength_level;
SELECT * FROM demonstrate_lock_compatibility() WHERE NOT compatible;
```

## Lock Acquisition and Duration

### Automatic Lock Acquisition

```sql
-- Demonstrating automatic lock acquisition patterns
CREATE OR REPLACE FUNCTION demonstrate_automatic_lock_acquisition()
RETURNS TABLE(
    operation_type VARCHAR(30),
    sql_command TEXT,
    lock_acquired VARCHAR(25),
    lock_duration VARCHAR(20),
    concurrency_impact TEXT,
    optimization_notes TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    -- Query operations
    ('Simple Query', 'SELECT * FROM table_name;',
     'ACCESS SHARE', 'QUERY_DURATION',
     'Minimal - allows all except ACCESS EXCLUSIVE',
     'Fastest lock acquisition, released immediately after query'),
    
    ('Locking Query', 'SELECT * FROM table_name FOR UPDATE;',
     'ROW SHARE', 'TRANSACTION_END',
     'Low - conflicts with EXCLUSIVE and ACCESS EXCLUSIVE',
     'Held until transaction commit/rollback'),
    
    -- DML operations
    ('Insert Operation', 'INSERT INTO table_name VALUES (...);',
     'ROW EXCLUSIVE', 'TRANSACTION_END',
     'Moderate - blocks SHARE and stronger locks',
     'Standard DML lock, good concurrency for different rows'),
    
    ('Update Operation', 'UPDATE table_name SET col = value;',
     'ROW EXCLUSIVE', 'TRANSACTION_END',
     'Moderate - same as INSERT, allows concurrent reads',
     'Can escalate to table lock with large updates'),
    
    ('Delete Operation', 'DELETE FROM table_name WHERE condition;',
     'ROW EXCLUSIVE', 'TRANSACTION_END',
     'Moderate - allows concurrent reads and other DML',
     'TRUNCATE uses ACCESS EXCLUSIVE instead'),
    
    -- Maintenance operations
    ('Vacuum Operation', 'VACUUM table_name;',
     'SHARE UPDATE EXCLUSIVE', 'OPERATION_DURATION',
     'Medium - prevents other maintenance, allows DML',
     'Can run concurrent with application workload'),
    
    ('Analyze Operation', 'ANALYZE table_name;',
     'SHARE UPDATE EXCLUSIVE', 'OPERATION_DURATION',
     'Medium - brief operation, minimal impact',
     'Usually very fast, can run during normal operations'),
    
    ('Index Creation', 'CREATE INDEX ON table_name (column);',
     'SHARE', 'OPERATION_DURATION',
     'High - blocks all writes during creation',
     'Use CREATE INDEX CONCURRENTLY for production'),
    
    ('Concurrent Index', 'CREATE INDEX CONCURRENTLY ON table_name (column);',
     'SHARE UPDATE EXCLUSIVE', 'OPERATION_DURATION',
     'Medium - allows writes, takes longer',
     'Preferred method for production environments'),
    
    -- DDL operations
    ('Table Alteration', 'ALTER TABLE table_name ADD COLUMN ...;',
     'ACCESS EXCLUSIVE', 'OPERATION_DURATION',
     'Maximum - blocks all access to table',
     'Schedule during maintenance windows'),
    
    ('Table Drop', 'DROP TABLE table_name;',
     'ACCESS EXCLUSIVE', 'INSTANTANEOUS',
     'Maximum - table becomes inaccessible',
     'Irreversible operation, use with extreme caution'),
    
    ('Table Truncation', 'TRUNCATE TABLE table_name;',
     'ACCESS EXCLUSIVE', 'OPERATION_DURATION',
     'Maximum - faster than DELETE but blocks all access',
     'Alternative: DELETE in batches for large tables');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_automatic_lock_acquisition() ORDER BY lock_acquired, operation_type;
```

### Explicit Lock Commands

```sql
-- Demonstrating explicit table locking
CREATE OR REPLACE FUNCTION demonstrate_explicit_locking()
RETURNS TABLE(
    explicit_command TEXT,
    acquired_lock VARCHAR(25),
    use_case_scenario TEXT,
    best_practices TEXT[],
    potential_pitfalls TEXT[]
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('LOCK TABLE table_name IN ACCESS SHARE MODE;',
     'ACCESS SHARE',
     'Prevent table modifications while allowing reads',
     ARRAY[
         'Rarely needed - SELECT automatically acquires this',
         'Use for explicit read consistency across multiple queries',
         'Combine with appropriate transaction isolation level'
     ],
     ARRAY[
         'Usually unnecessary due to MVCC',
         'Can create artificial contention'
     ]),
    
    ('LOCK TABLE table_name IN ROW SHARE MODE;',
     'ROW SHARE',
     'Prevent table-level exclusive operations',
     ARRAY[
         'Useful before complex row-locking operations',
         'Ensures table structure remains stable',
         'Good for multi-step row locking algorithms'
     ],
     ARRAY[
         'Blocks EXCLUSIVE and ACCESS EXCLUSIVE operations',
         'May not be necessary with modern PostgreSQL'
     ]),
    
    ('LOCK TABLE table_name IN ROW EXCLUSIVE MODE;',
     'ROW EXCLUSIVE',
     'Reserve table for write operations',
     ARRAY[
         'Useful for batch processing',
         'Prevents SHARE locks during critical updates',
         'Good for ensuring write operation priority'
     ],
     ARRAY[
         'Blocks index creation and other SHARE operations',
         'Can impact concurrent maintenance'
     ]),
    
    ('LOCK TABLE table_name IN SHARE MODE;',
     'SHARE',
     'Allow multiple readers but prevent all writes',
     ARRAY[
         'Useful for consistent backups',
         'Good for report generation requiring consistency',
         'Coordinate with backup procedures'
     ],
     ARRAY[
         'Blocks all DML operations',
         'Can cause significant application impact',
         'Users often underestimate the blocking effect'
     ]),
    
    ('LOCK TABLE table_name IN EXCLUSIVE MODE;',
     'EXCLUSIVE',
     'Serialize access while allowing SELECT',
     ARRAY[
         'Very rare use case',
         'Custom application-level coordination',
         'Ensure minimal lock duration'
     ],
     ARRAY[
         'Blocks almost everything',
         'High risk of creating contention',
         'Usually indicates design problem'
     ]),
    
    ('LOCK TABLE table_name IN ACCESS EXCLUSIVE MODE;',
     'ACCESS EXCLUSIVE',
     'Complete table isolation',
     ARRAY[
         'Emergency maintenance situations',
         'Custom DDL coordination',
         'Ensure operation is truly necessary'
     ],
     ARRAY[
         'Blocks everything including SELECT',
         'Can cause application outages',
         'Should almost never be used explicitly'
     ]);
END;
$$ LANGUAGE plpgsql;

-- Practical example: Coordinated batch processing
CREATE OR REPLACE FUNCTION coordinated_batch_update(
    batch_size INTEGER DEFAULT 1000,
    max_batches INTEGER DEFAULT 10
) RETURNS TABLE(
    batch_number INTEGER,
    records_processed INTEGER,
    lock_strategy VARCHAR(30),
    processing_time_ms DECIMAL(10,2),
    contention_detected BOOLEAN
) AS $$
DECLARE
    current_batch INTEGER := 1;
    records_updated INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    processing_duration DECIMAL(10,2);
    has_contention BOOLEAN;
BEGIN
    WHILE current_batch <= max_batches LOOP
        start_time := CURRENT_TIMESTAMP;
        
        BEGIN
            -- Acquire ROW EXCLUSIVE lock to coordinate with other operations
            LOCK TABLE table_lock_demo IN ROW EXCLUSIVE MODE;
            
            -- Process batch
            UPDATE table_lock_demo 
            SET updated_at = CURRENT_TIMESTAMP,
                data = data || ' (batch ' || current_batch || ')'
            WHERE id IN (
                SELECT id FROM table_lock_demo 
                WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '1 hour'
                ORDER BY id 
                LIMIT batch_size
            );
            
            GET DIAGNOSTICS records_updated = ROW_COUNT;
            end_time := CURRENT_TIMESTAMP;
            processing_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
            has_contention := processing_duration > 1000; -- Simple heuristic
            
            RETURN QUERY SELECT 
                current_batch,
                records_updated,
                'ROW EXCLUSIVE'::VARCHAR(30),
                processing_duration,
                has_contention;
            
            -- Exit if no more records to process
            EXIT WHEN records_updated = 0;
            
        EXCEPTION
            WHEN lock_not_available THEN
                RETURN QUERY SELECT 
                    current_batch,
                    0::INTEGER,
                    'LOCK_FAILED'::VARCHAR(30),
                    0::DECIMAL(10,2),
                    TRUE;
                EXIT;
        END;
        
        current_batch := current_batch + 1;
        
        -- Brief pause between batches
        PERFORM pg_sleep(0.01);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_explicit_locking();
-- Example of coordinated batch processing
-- SELECT * FROM coordinated_batch_update(5, 3);
```

## DDL vs DML Lock Interactions

### Critical Lock Conflicts

```sql
-- Analyzing DDL vs DML lock interactions
CREATE OR REPLACE FUNCTION analyze_ddl_dml_conflicts()
RETURNS TABLE(
    conflict_scenario VARCHAR(50),
    ddl_operation TEXT,
    conflicting_dml TEXT,
    resolution_strategy TEXT,
    prevention_approach TEXT,
    business_impact VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Index Creation Blocking',
     'CREATE INDEX ON large_table (column)',
     'INSERT/UPDATE/DELETE operations',
     'Use CREATE INDEX CONCURRENTLY',
     'Schedule index creation during low activity periods',
     'HIGH'),
    
    ('Table Alteration Impact',
     'ALTER TABLE ADD COLUMN',
     'All DML operations (SELECT/INSERT/UPDATE/DELETE)',
     'Plan maintenance windows, use smaller schema changes',
     'Test schema changes in staging, use migration tools',
     'CRITICAL'),
    
    ('Vacuum Coordination',
     'VACUUM FULL table_name',
     'All table operations',
     'Use regular VACUUM instead of VACUUM FULL',
     'Configure autovacuum properly, avoid VACUUM FULL',
     'HIGH'),
    
    ('Truncate vs Active Queries',
     'TRUNCATE TABLE',
     'SELECT queries and all DML',
     'Use DELETE in batches for large tables',
     'Consider partitioning for regular bulk deletions',
     'HIGH'),
    
    ('Drop Table Safety',
     'DROP TABLE',
     'Any query accessing the table',
     'Coordinate with application deployment',
     'Use dependency checking, gradual migration',
     'CRITICAL'),
    
    ('Reindex Impact',
     'REINDEX TABLE',
     'All operations on the table',
     'Use REINDEX CONCURRENTLY (PostgreSQL 12+)',
     'Monitor index bloat, schedule maintenance',
     'HIGH'),
    
    ('Cluster Operation',
     'CLUSTER table_name USING index_name',
     'All table operations',
     'Avoid CLUSTER on production, use pg_repack',
     'Regular VACUUM and monitoring instead',
     'CRITICAL'),
    
    ('Foreign Key Addition',
     'ALTER TABLE ADD CONSTRAINT ... FOREIGN KEY',
     'INSERT/UPDATE operations on both tables',
     'Add constraint as NOT VALID, then VALIDATE',
     'Design schema with proper constraints from start',
     'MEDIUM'),
    
    ('Statistics Update',
     'ANALYZE table_name',
     'Minimal conflict - only blocks other ANALYZE',
     'Run ANALYZE during normal operations',
     'Configure auto-analyze appropriately',
     'MINIMAL'),
    
    ('Materialized View Refresh',
     'REFRESH MATERIALIZED VIEW',
     'SELECT queries on the materialized view',
     'Use REFRESH MATERIALIZED VIEW CONCURRENTLY',
     'Design views to support concurrent refresh',
     'MEDIUM');
END;
$$ LANGUAGE plpgsql;

-- Function to recommend maintenance strategies
CREATE OR REPLACE FUNCTION recommend_maintenance_strategy(
    table_name TEXT,
    operation_type VARCHAR(50),
    expected_duration_minutes INTEGER DEFAULT 30
) RETURNS TABLE(
    recommendation_category VARCHAR(30),
    recommendation TEXT,
    risk_level VARCHAR(15),
    implementation_steps TEXT[],
    monitoring_points TEXT[]
) AS $$
BEGIN
    -- DDL Operation Recommendations
    IF operation_type ILIKE '%INDEX%' THEN
        RETURN QUERY SELECT 
            'Index Management'::VARCHAR(30),
            'Use CREATE INDEX CONCURRENTLY to avoid blocking writes'::TEXT,
            'LOW'::VARCHAR(15),
            ARRAY[
                'Verify sufficient disk space (3x table size)',
                'Use CREATE INDEX CONCURRENTLY',
                'Monitor for completion and any failures',
                'Consider creating index during low-traffic periods'
            ]::TEXT[],
            ARRAY[
                'Monitor active query count during creation',
                'Watch for lock waits in pg_stat_activity',
                'Check index build progress in pg_stat_progress_create_index'
            ]::TEXT[];
    END IF;
    
    IF operation_type ILIKE '%ALTER%' THEN
        RETURN QUERY SELECT 
            'Schema Changes'::VARCHAR(30),
            'Plan maintenance window due to ACCESS EXCLUSIVE lock requirement'::TEXT,
            CASE 
                WHEN expected_duration_minutes > 60 THEN 'CRITICAL'
                WHEN expected_duration_minutes > 15 THEN 'HIGH' 
                ELSE 'MEDIUM'
            END::VARCHAR(15),
            ARRAY[
                'Schedule during planned maintenance window',
                'Notify stakeholders of expected downtime',
                'Test operation in staging environment first',
                'Prepare rollback plan if necessary',
                'Consider if operation can be broken into smaller steps'
            ]::TEXT[],
            ARRAY[
                'Monitor lock waits during operation',
                'Track operation progress',
                'Watch for blocking queries',
                'Monitor system resource usage'
            ]::TEXT[];
    END IF;
    
    IF operation_type ILIKE '%VACUUM%' THEN
        RETURN QUERY SELECT 
            'Maintenance Operations'::VARCHAR(30),
            'Regular VACUUM can run concurrently with normal operations'::TEXT,
            'LOW'::VARCHAR(15),
            ARRAY[
                'Use regular VACUUM instead of VACUUM FULL when possible',
                'Schedule during lower activity if possible',
                'Monitor vacuum progress and adjust settings if needed'
            ]::TEXT[],
            ARRAY[
                'Watch vacuum progress in pg_stat_progress_vacuum',
                'Monitor for unusual lock waits',
                'Check autovacuum settings and effectiveness'
            ]::TEXT[];
    END IF;
    
    -- Default recommendation for unknown operations
    RETURN QUERY SELECT 
        'General Guidance'::VARCHAR(30),
        'Analyze specific operation requirements and plan accordingly'::TEXT,
        'MEDIUM'::VARCHAR(15),
        ARRAY[
            'Research specific lock requirements for the operation',
            'Test in non-production environment',
            'Plan appropriate timing based on lock strength',
            'Prepare monitoring and rollback procedures'
        ]::TEXT[],
        ARRAY[
            'Monitor pg_locks for lock conflicts',
            'Watch pg_stat_activity for blocking sessions',
            'Track operation-specific progress views if available'
        ]::TEXT[];
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_ddl_dml_conflicts() ORDER BY business_impact DESC;
SELECT * FROM recommend_maintenance_strategy('table_lock_demo', 'CREATE INDEX', 45);
```

## Performance Impact and Monitoring

### Lock Performance Analysis

```sql
-- Comprehensive table lock performance analysis
CREATE OR REPLACE FUNCTION analyze_table_lock_performance()
RETURNS TABLE(
    analysis_aspect VARCHAR(40),
    lock_mode VARCHAR(25),
    performance_rating VARCHAR(15),
    throughput_impact VARCHAR(20),
    latency_impact VARCHAR(20),
    scalability_notes TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    -- Read performance analysis
    ('Read Query Performance', 'ACCESS SHARE', 'EXCELLENT', 'NO_IMPACT', 'NO_IMPACT',
     'Multiple concurrent readers with no performance penalty'),
    ('Read Query Performance', 'ROW SHARE', 'EXCELLENT', 'MINIMAL_IMPACT', 'NO_IMPACT',
     'Slight overhead for row locking metadata'),
    ('Read Query Performance', 'ROW EXCLUSIVE', 'VERY GOOD', 'NO_IMPACT', 'NO_IMPACT',
     'Reads unaffected by write operations due to MVCC'),
    ('Read Query Performance', 'SHARE', 'VERY GOOD', 'NO_IMPACT', 'NO_IMPACT',
     'Reads proceed normally during shared operations'),
    ('Read Query Performance', 'ACCESS EXCLUSIVE', 'BLOCKED', 'COMPLETE_BLOCK', 'INFINITE_WAIT',
     'All reads blocked until DDL operation completes'),
     
    -- Write performance analysis  
    ('Write Query Performance', 'ACCESS SHARE', 'EXCELLENT', 'NO_IMPACT', 'NO_IMPACT',
     'Writes unaffected by read operations'),
    ('Write Query Performance', 'ROW EXCLUSIVE', 'VERY GOOD', 'MINIMAL_IMPACT', 'LOW_IMPACT',
     'Good concurrency for writes to different rows'),
    ('Write Query Performance', 'SHARE UPDATE EXCLUSIVE', 'GOOD', 'LOW_IMPACT', 'MEDIUM_IMPACT',
     'Writes allowed but coordination overhead exists'),
    ('Write Query Performance', 'SHARE', 'BLOCKED', 'COMPLETE_BLOCK', 'HIGH_WAIT',
     'All writes blocked during shared operations like index creation'),
    ('Write Query Performance', 'ACCESS EXCLUSIVE', 'BLOCKED', 'COMPLETE_BLOCK', 'INFINITE_WAIT',
     'Complete write blocking during DDL operations'),
     
    -- Concurrency analysis
    ('Concurrency Level', 'ACCESS SHARE', 'MAXIMUM', 'UNLIMITED', 'NONE',
     'Unlimited concurrent readers with perfect scalability'),
    ('Concurrency Level', 'ROW EXCLUSIVE', 'HIGH', 'HIGH_CONCURRENT', 'ROW_LEVEL',
     'High concurrency limited only by row-level conflicts'),
    ('Concurrency Level', 'SHARE UPDATE EXCLUSIVE', 'MODERATE', 'MEDIUM_CONCURRENT', 'COORDINATION',
     'Good concurrency with coordination overhead'),
    ('Concurrency Level', 'SHARE', 'LIMITED', 'READ_ONLY', 'WRITE_BLOCKING',
     'Multiple readers but no concurrent writers'),
    ('Concurrency Level', 'ACCESS EXCLUSIVE', 'SERIALIZED', 'SINGLE_OPERATION', 'COMPLETE_BLOCKING',
     'Complete serialization - only one operation at a time'),
     
    -- Lock acquisition speed
    ('Lock Acquisition Speed', 'ACCESS SHARE', 'INSTANT', 'IMMEDIATE', 'MICROSECONDS',
     'Fastest lock acquisition with minimal overhead'),
    ('Lock Acquisition Speed', 'ROW EXCLUSIVE', 'FAST', 'NEAR_IMMEDIATE', 'MILLISECONDS',
     'Fast acquisition with row-level coordination'),
    ('Lock Acquisition Speed', 'SHARE UPDATE EXCLUSIVE', 'MODERATE', 'COORDINATION_WAIT', 'VARIABLE',
     'May wait for conflicting maintenance operations'),
    ('Lock Acquisition Speed', 'SHARE', 'SLOW', 'WRITE_COORDINATION', 'SECONDS',
     'Must wait for all conflicting write operations to complete'),
    ('Lock Acquisition Speed', 'ACCESS EXCLUSIVE', 'VERY_SLOW', 'FULL_COORDINATION', 'MINUTES_POSSIBLE',
     'Must wait for all other operations to complete');
END;
$$ LANGUAGE plpgsql;

-- Real-time table lock monitoring
CREATE OR REPLACE FUNCTION monitor_table_locks()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    lock_mode TEXT,
    granted_count INTEGER,
    waiting_count INTEGER,
    total_sessions INTEGER,
    max_wait_seconds DECIMAL(10,2),
    contention_severity VARCHAR(15),
    blocking_assessment TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH table_lock_analysis AS (
        SELECT 
            n.nspname,
            c.relname,
            l.mode,
            l.granted,
            l.pid,
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(sa.query_start, sa.state_change))) as session_time
        FROM pg_locks l
        JOIN pg_class c ON l.relation = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        LEFT JOIN pg_stat_activity sa ON l.pid = sa.pid
        WHERE l.locktype = 'relation'
        AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ),
    lock_summary AS (
        SELECT 
            nspname,
            relname,
            mode,
            COUNT(*) FILTER (WHERE granted) as granted_sessions,
            COUNT(*) FILTER (WHERE NOT granted) as waiting_sessions,
            COUNT(*) as total_session_count,
            MAX(session_time) FILTER (WHERE NOT granted) as max_wait_time
        FROM table_lock_analysis
        GROUP BY nspname, relname, mode
    )
    SELECT 
        ls.nspname::TEXT,
        ls.relname::TEXT,
        ls.mode::TEXT,
        ls.granted_sessions::INTEGER,
        ls.waiting_sessions::INTEGER,
        ls.total_session_count::INTEGER,
        COALESCE(ls.max_wait_time, 0)::DECIMAL(10,2),
        CASE 
            WHEN ls.waiting_sessions = 0 THEN 'NONE'
            WHEN ls.waiting_sessions < 3 AND ls.max_wait_time < 10 THEN 'LOW'
            WHEN ls.waiting_sessions < 10 AND ls.max_wait_time < 60 THEN 'MEDIUM'
            WHEN ls.waiting_sessions < 20 OR ls.max_wait_time < 300 THEN 'HIGH'
            ELSE 'CRITICAL'
        END::VARCHAR(15),
        CASE 
            WHEN ls.waiting_sessions = 0 THEN 'No blocking detected'
            WHEN ls.mode = 'AccessExclusiveLock' THEN 'DDL operation blocking all access'
            WHEN ls.mode = 'ShareLock' THEN 'Index/maintenance operation blocking writes'
            WHEN ls.mode = 'RowExclusiveLock' THEN 'DML operations experiencing contention'
            ELSE format('Lock contention on %s lock', ls.mode)
        END::TEXT
    FROM lock_summary ls
    WHERE ls.total_session_count > 1  -- Only show tables with multiple sessions
    ORDER BY ls.waiting_sessions DESC, ls.max_wait_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_table_lock_performance() 
WHERE performance_rating IN ('BLOCKED', 'VERY_SLOW', 'SLOW')
ORDER BY lock_mode;

SELECT * FROM monitor_table_locks() WHERE contention_severity != 'NONE';
```

## Best Practices and Optimization

### Table Lock Optimization Strategies

```sql
-- Comprehensive table lock optimization guide
CREATE OR REPLACE FUNCTION table_lock_best_practices()
RETURNS TABLE(
    practice_category VARCHAR(30),
    best_practice VARCHAR(60),
    implementation_approach TEXT,
    performance_benefit VARCHAR(20),
    risk_mitigation TEXT,
    example_implementation TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('DDL Operations', 'Use CONCURRENTLY when available',
     'Replace blocking DDL with concurrent variants',
     'VERY_HIGH',
     'Eliminates application blocking during index/maintenance',
     'CREATE INDEX CONCURRENTLY instead of CREATE INDEX'),
    
    ('DDL Operations', 'Schedule DDL during maintenance windows',
     'Plan ACCESS EXCLUSIVE operations for low-traffic periods',
     'HIGH',
     'Minimizes user impact and application disruption',
     'Schedule ALTER TABLE during planned downtime'),
    
    ('DDL Operations', 'Break large operations into smaller steps',
     'Decompose complex schema changes into incremental updates',
     'HIGH',
     'Reduces lock duration and allows rollback points',
     'Add columns one at a time rather than all at once'),
    
    ('Transaction Design', 'Minimize transaction duration',
     'Keep transactions short to reduce lock hold time',
     'CRITICAL',
     'Prevents lock escalation and reduces contention',
     'BEGIN; quick_operation(); COMMIT; -- Keep this minimal'),
    
    ('Transaction Design', 'Acquire locks in consistent order',
     'Always lock tables in same order across transactions',
     'HIGH',
     'Prevents deadlocks in complex multi-table operations',
     'Always lock parent tables before child tables'),
    
    ('Lock Selection', 'Use minimal required lock strength',
     'Choose weakest lock that provides necessary protection',
     'HIGH',
     'Maximizes concurrency and reduces blocking',
     'Use ROW EXCLUSIVE instead of SHARE when possible'),
    
    ('Monitoring', 'Implement lock wait alerting',
     'Set up monitoring for excessive lock wait times',
     'MEDIUM',
     'Early detection prevents escalation to outages',
     'Alert when lock waits exceed 30 seconds'),
    
    ('Monitoring', 'Track lock contention patterns',
     'Monitor which operations cause most blocking',
     'MEDIUM',
     'Identifies optimization opportunities',
     'Regular analysis of pg_stat_activity and pg_locks'),
    
    ('Application Design', 'Use connection pooling',
     'Implement proper connection management',
     'MEDIUM',
     'Reduces connection overhead and lock coordination cost',
     'Configure PgBouncer with appropriate pool sizes'),
    
    ('Application Design', 'Implement retry logic for lock failures',
     'Handle lock timeouts gracefully in application',
     'HIGH',
     'Improves application resilience under contention',
     'Exponential backoff for lock_not_available errors'),
    
    ('Maintenance', 'Configure autovacuum properly',
     'Tune autovacuum to prevent manual VACUUM needs',
     'HIGH',
     'Reduces need for manual maintenance operations',
     'Adjust autovacuum_vacuum_scale_factor and thresholds'),
    
    ('Maintenance', 'Use pg_repack instead of CLUSTER',
     'Avoid CLUSTER for table reorganization',
     'VERY_HIGH',
     'Eliminates blocking reorganization operations',
     'Install pg_repack extension for online table rebuilds');
END;
$$ LANGUAGE plpgsql;

-- Lock optimization assessment
CREATE OR REPLACE FUNCTION assess_lock_optimization_opportunities(
    schema_filter TEXT DEFAULT 'public'
) RETURNS TABLE(
    optimization_area VARCHAR(40),
    current_state VARCHAR(30),
    improvement_opportunity TEXT,
    implementation_effort VARCHAR(15),
    expected_benefit VARCHAR(20),
    priority_level VARCHAR(15)
) AS $$
DECLARE
    large_table_count INTEGER;
    index_count INTEGER;
    maintenance_frequency VARCHAR(20);
BEGIN
    -- Analyze current schema state
    SELECT COUNT(*) INTO large_table_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = schema_filter
    AND c.relkind = 'r'
    AND pg_total_relation_size(c.oid) > 1024 * 1024 * 1024; -- 1GB+
    
    SELECT COUNT(*) INTO index_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = schema_filter
    AND c.relkind = 'i';
    
    -- Table size assessment
    RETURN QUERY SELECT 
        'Large Table Management'::VARCHAR(40),
        CASE 
            WHEN large_table_count = 0 THEN 'NO_LARGE_TABLES'
            WHEN large_table_count < 5 THEN 'FEW_LARGE_TABLES'
            ELSE 'MANY_LARGE_TABLES'
        END::VARCHAR(30),
        CASE 
            WHEN large_table_count > 5 THEN 'Consider partitioning strategy for maintenance operations'
            WHEN large_table_count > 0 THEN 'Monitor DDL operations on large tables carefully'
            ELSE 'Current table sizes should not cause major lock issues'
        END::TEXT,
        CASE 
            WHEN large_table_count > 5 THEN 'HIGH'
            WHEN large_table_count > 0 THEN 'MEDIUM' 
            ELSE 'LOW'
        END::VARCHAR(15),
        CASE 
            WHEN large_table_count > 5 THEN 'HIGH'
            ELSE 'MEDIUM'
        END::VARCHAR(20),
        CASE 
            WHEN large_table_count > 5 THEN 'HIGH'
            WHEN large_table_count > 0 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15);
    
    -- Index management assessment
    RETURN QUERY SELECT 
        'Index Management Strategy'::VARCHAR(40),
        CASE 
            WHEN index_count < 10 THEN 'SIMPLE_SCHEMA'
            WHEN index_count < 50 THEN 'MODERATE_COMPLEXITY'
            ELSE 'COMPLEX_SCHEMA'
        END::VARCHAR(30),
        CASE 
            WHEN index_count > 50 THEN 'Implement index creation standards and monitoring'
            WHEN index_count > 10 THEN 'Establish index maintenance procedures'
            ELSE 'Current index count is manageable'
        END::TEXT,
        CASE 
            WHEN index_count > 50 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15),
        'MEDIUM'::VARCHAR(20),
        CASE 
            WHEN index_count > 50 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15);
    
    -- DDL coordination assessment
    RETURN QUERY SELECT 
        'DDL Coordination'::VARCHAR(40),
        'NEEDS_ASSESSMENT'::VARCHAR(30),
        'Establish DDL deployment procedures and maintenance windows'::TEXT,
        'MEDIUM'::VARCHAR(15),
        'HIGH'::VARCHAR(20),
        'HIGH'::VARCHAR(15);
    
    -- Monitoring setup assessment
    RETURN QUERY SELECT 
        'Lock Monitoring'::VARCHAR(40),
        'NOT_IMPLEMENTED'::VARCHAR(30),
        'Implement comprehensive lock monitoring and alerting'::TEXT,
        'LOW'::VARCHAR(15),
        'HIGH'::VARCHAR(20),
        'HIGH'::VARCHAR(15);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM table_lock_best_practices() ORDER BY practice_category, best_practice;
SELECT * FROM assess_lock_optimization_opportunities('public');
```

## Summary

**Table-Level Locking in PostgreSQL:**

**Core Concept:**
- **Coarse-grained Control**: Manages access to entire tables rather than individual rows
- **Operation Coordination**: Coordinates DDL, DML, and maintenance operations
- **Automatic Acquisition**: Locks acquired automatically based on operation type
- **Hierarchical System**: Part of PostgreSQL's multi-level locking architecture

**Eight Lock Modes (Strength Order):**
1. **ACCESS SHARE**: Weakest, allows all except ACCESS EXCLUSIVE (SELECT)
2. **ROW SHARE**: Row locking operations (SELECT FOR UPDATE/SHARE)
3. **ROW EXCLUSIVE**: Standard DML operations (INSERT/UPDATE/DELETE)
4. **SHARE UPDATE EXCLUSIVE**: Maintenance operations (VACUUM/ANALYZE)
5. **SHARE**: Index creation and bulk operations
6. **SHARE ROW EXCLUSIVE**: Restrictive maintenance operations
7. **EXCLUSIVE**: Very restrictive operations (rare)
8. **ACCESS EXCLUSIVE**: Strongest, blocks everything (DDL operations)

**Key Characteristics:**
- **Compatibility Matrix**: Defined interactions between lock modes
- **Duration**: Held until transaction end or operation completion
- **Automatic vs Explicit**: Most locks automatic, LOCK TABLE for explicit control
- **Performance Impact**: Higher strength = lower concurrency

**Critical Conflicts:**
- **DDL vs DML**: ALTER TABLE blocks all operations
- **Index Creation**: CREATE INDEX blocks writes (use CONCURRENTLY)
- **Maintenance**: VACUUM coordination with application workload
- **Truncate/Drop**: Complete table blocking operations

**Performance Considerations:**
- **Concurrency Trade-off**: Stronger locks reduce concurrent access
- **Lock Duration**: Minimize transaction time to reduce lock hold time
- **Operation Timing**: Schedule heavy DDL during maintenance windows
- **Monitoring**: Track lock waits and contention patterns

**Best Practices:**
- Use concurrent operations when available (CREATE INDEX CONCURRENTLY)
- Schedule DDL operations during low-traffic periods
- Minimize transaction duration to reduce lock hold time
- Implement consistent lock ordering to prevent deadlocks
- Monitor lock contention and establish alerting thresholds
- Use appropriate isolation levels and transaction design

**Optimization Strategies:**
- Break large operations into smaller incremental changes
- Implement retry logic for lock timeout scenarios
- Use proper connection pooling and resource management
- Configure autovacuum to minimize manual maintenance needs
- Consider partitioning for large tables requiring frequent maintenance

Table-level locking provides PostgreSQL with essential coordination mechanisms for maintaining data consistency during concurrent operations while requiring careful consideration of performance and concurrency implications in production environments.