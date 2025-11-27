# 116. What is lock contention?

## Definition

**Lock contention** occurs when multiple transactions compete for the same database resources simultaneously, causing some transactions to wait for others to release their locks. In PostgreSQL, lock contention happens when concurrent transactions need conflicting access to tables, rows, or other database objects, resulting in performance degradation, increased response times, and potential application bottlenecks.

Lock contention is different from deadlocks - while deadlocks involve circular dependencies, lock contention simply refers to transactions waiting in line for access to locked resources.

## Types of Lock Contention

### 1. Row-Level Lock Contention

The most common type of contention occurs when multiple transactions try to modify the same rows.

```sql
-- Demonstrating row-level lock contention
CREATE TABLE IF NOT EXISTS user_accounts (
    user_id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    balance DECIMAL(15,2) DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- Insert test data
INSERT INTO user_accounts (user_id, username, balance) 
VALUES (1, 'alice', 1000.00), (2, 'bob', 1500.00), (3, 'charlie', 2000.00)
ON CONFLICT DO NOTHING;

-- Simulate row-level lock contention
CREATE OR REPLACE FUNCTION demonstrate_row_lock_contention()
RETURNS TABLE(
    scenario_name VARCHAR(50),
    contention_type VARCHAR(30),
    description TEXT,
    performance_impact VARCHAR(20),
    typical_wait_time VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Single Row Updates', 'Exclusive Row Lock',
     'Multiple transactions updating same user account simultaneously',
     'HIGH', '1-10 seconds'),
    
    ('Popular Row Access', 'Row Lock Queue',
     'Many transactions accessing frequently updated row (hot spot)',
     'VERY HIGH', '5-30 seconds'),
    
    ('Batch Processing Overlap', 'Range Lock Conflict',
     'Bulk update overlapping with individual row modifications',
     'MEDIUM', '2-15 seconds'),
    
    ('Foreign Key Updates', 'Referenced Row Lock',
     'Updates to rows referenced by foreign key constraints',
     'MEDIUM', '1-5 seconds'),
    
    ('Index Maintenance', 'Index Page Lock',
     'Concurrent inserts causing index page contention',
     'LOW-MEDIUM', '0.1-2 seconds');
END;
$$ LANGUAGE plpgsql;

-- Function to simulate and measure row lock contention
CREATE OR REPLACE FUNCTION simulate_row_contention(
    target_user_id INTEGER,
    concurrent_sessions INTEGER DEFAULT 3,
    operation_type VARCHAR(20) DEFAULT 'balance_update'
) RETURNS TABLE(
    session_id INTEGER,
    operation_status VARCHAR(20),
    wait_time_seconds DECIMAL(10,3),
    final_balance DECIMAL(15,2),
    contention_detected BOOLEAN
) AS $$
DECLARE
    session_num INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    current_balance DECIMAL(15,2);
    operation_success BOOLEAN;
    wait_duration DECIMAL(10,3);
BEGIN
    -- Simulate multiple concurrent sessions
    FOR session_num IN 1..concurrent_sessions LOOP
        start_time := CURRENT_TIMESTAMP;
        operation_success := FALSE;
        
        BEGIN
            -- Attempt to acquire row lock
            CASE operation_type
                WHEN 'balance_update' THEN
                    UPDATE user_accounts 
                    SET balance = balance + (session_num * 10),
                        last_activity = CURRENT_TIMESTAMP,
                        version = version + 1
                    WHERE user_id = target_user_id;
                    
                WHEN 'username_change' THEN
                    UPDATE user_accounts 
                    SET username = username || '_' || session_num::TEXT,
                        last_activity = CURRENT_TIMESTAMP
                    WHERE user_id = target_user_id;
                    
                WHEN 'activity_update' THEN
                    UPDATE user_accounts 
                    SET last_activity = CURRENT_TIMESTAMP + (session_num || ' seconds')::INTERVAL
                    WHERE user_id = target_user_id;
            END CASE;
            
            operation_success := TRUE;
            
        EXCEPTION
            WHEN OTHERS THEN
                operation_success := FALSE;
        END;
        
        end_time := CURRENT_TIMESTAMP;
        wait_duration := EXTRACT(EPOCH FROM (end_time - start_time));
        
        -- Get current balance
        SELECT balance INTO current_balance 
        FROM user_accounts WHERE user_id = target_user_id;
        
        RETURN QUERY SELECT 
            session_num,
            CASE 
                WHEN operation_success THEN 'SUCCESS'
                ELSE 'FAILED'
            END::VARCHAR(20),
            wait_duration,
            COALESCE(current_balance, 0::DECIMAL),
            (wait_duration > 0.1)::BOOLEAN;  -- Contention if wait > 100ms
        
        -- Brief delay between simulated sessions
        PERFORM pg_sleep(0.01);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_row_lock_contention();
SELECT * FROM simulate_row_contention(1, 5, 'balance_update');
```

### 2. Table-Level Lock Contention

Occurs when transactions need conflicting table-level access modes.

```sql
-- Table-level lock contention scenarios
CREATE OR REPLACE FUNCTION demonstrate_table_lock_contention()
RETURNS TABLE(
    contention_scenario VARCHAR(50),
    lock_types_involved TEXT,
    typical_cause TEXT,
    business_impact VARCHAR(20),
    resolution_strategy TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('DDL vs DML Operations',
     'ACCESS EXCLUSIVE vs ROW EXCLUSIVE',
     'ALTER TABLE during high transaction volume',
     'SEVERE',
     'Schedule DDL during maintenance windows'),
    
    ('Bulk Operations vs OLTP',
     'SHARE vs ROW EXCLUSIVE', 
     'Large batch imports during normal operations',
     'HIGH',
     'Use smaller batches or off-peak scheduling'),
    
    ('Index Creation vs Queries',
     'SHARE vs ACCESS SHARE',
     'CREATE INDEX on active table',
     'MEDIUM',
     'Use CREATE INDEX CONCURRENTLY'),
    
    ('VACUUM vs Heavy Writes',
     'SHARE UPDATE EXCLUSIVE vs ROW EXCLUSIVE',
     'Manual vacuum during peak write activity',
     'MEDIUM',
     'Rely on autovacuum or schedule appropriately'),
    
    ('Statistics Update vs Queries',
     'SHARE UPDATE EXCLUSIVE vs ACCESS SHARE',
     'ANALYZE command during query workload',
     'LOW',
     'Use automatic statistics or schedule wisely'),
    
    ('Table Truncation vs Access',
     'ACCESS EXCLUSIVE vs any other lock',
     'TRUNCATE TABLE during active use',
     'SEVERE',
     'Use DELETE with batch processing instead');
END;
$$ LANGUAGE plpgsql;

-- Function to analyze current table-level lock contention
CREATE OR REPLACE FUNCTION analyze_table_lock_contention()
RETURNS TABLE(
    table_name TEXT,
    schema_name TEXT,
    conflicting_lock_modes TEXT[],
    waiting_sessions INTEGER,
    blocking_sessions INTEGER,
    max_wait_time_seconds DECIMAL(10,3),
    contention_severity VARCHAR(15)
) AS $$
BEGIN
    RETURN QUERY
    WITH table_locks AS (
        SELECT 
            c.relname,
            n.nspname,
            l.mode,
            l.granted,
            l.pid,
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - sa.query_start)) as wait_time
        FROM pg_locks l
        JOIN pg_class c ON l.relation = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        LEFT JOIN pg_stat_activity sa ON l.pid = sa.pid
        WHERE l.locktype = 'relation'
        AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ),
    contention_analysis AS (
        SELECT 
            relname,
            nspname,
            ARRAY_AGG(DISTINCT mode) as lock_modes,
            COUNT(*) FILTER (WHERE NOT granted) as waiting_count,
            COUNT(*) FILTER (WHERE granted) as granted_count,
            MAX(wait_time) FILTER (WHERE NOT granted) as max_wait
        FROM table_locks
        GROUP BY relname, nspname
        HAVING COUNT(*) FILTER (WHERE NOT granted) > 0  -- Only tables with waiting sessions
    )
    SELECT 
        ca.relname::TEXT,
        ca.nspname::TEXT,
        ca.lock_modes,
        ca.waiting_count::INTEGER,
        ca.granted_count::INTEGER,
        COALESCE(ca.max_wait, 0)::DECIMAL(10,3),
        CASE 
            WHEN ca.max_wait > 60 THEN 'CRITICAL'
            WHEN ca.max_wait > 30 THEN 'HIGH'
            WHEN ca.max_wait > 10 THEN 'MEDIUM'
            WHEN ca.max_wait > 1 THEN 'LOW'
            ELSE 'MINIMAL'
        END::VARCHAR(15)
    FROM contention_analysis ca
    ORDER BY ca.max_wait DESC NULLS LAST, ca.waiting_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_table_lock_contention();
SELECT * FROM analyze_table_lock_contention();
```

### 3. Index Lock Contention

Contention on index pages, particularly in high-concurrency insert scenarios.

```sql
-- Index lock contention analysis
CREATE OR REPLACE FUNCTION analyze_index_contention()
RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    index_type TEXT,
    contention_indicators JSONB,
    optimization_suggestions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH index_stats AS (
        SELECT 
            schemaname,
            tablename,
            indexname,
            idx_tup_read,
            idx_tup_fetch,
            idx_blks_read,
            idx_blks_hit
        FROM pg_stat_user_indexes
    ),
    index_details AS (
        SELECT 
            i.schemaname,
            i.tablename,
            i.indexname,
            pg_get_indexdef(idx.indexrelid) as index_def,
            am.amname as access_method,
            CASE 
                WHEN pg_get_indexdef(idx.indexrelid) LIKE '%UNIQUE%' THEN 'UNIQUE'
                ELSE 'NON_UNIQUE'
            END as uniqueness,
            pg_relation_size(idx.indexrelid) as index_size_bytes
        FROM pg_stat_user_indexes i
        JOIN pg_index idx ON i.indexrelid = idx.indexrelid
        JOIN pg_class ic ON idx.indexrelid = ic.oid
        JOIN pg_am am ON ic.relam = am.oid
    )
    SELECT 
        id.indexname::TEXT,
        id.tablename::TEXT,
        format('%s (%s)', id.access_method, id.uniqueness)::TEXT,
        jsonb_build_object(
            'size_mb', ROUND((id.index_size_bytes / 1024.0 / 1024.0)::NUMERIC, 2),
            'read_ratio', CASE 
                WHEN COALESCE(ist.idx_tup_read, 0) = 0 THEN 0 
                ELSE ROUND((ist.idx_tup_fetch::NUMERIC / NULLIF(ist.idx_tup_read, 0))::NUMERIC, 3)
            END,
            'cache_hit_ratio', CASE
                WHEN (COALESCE(ist.idx_blks_read, 0) + COALESCE(ist.idx_blks_hit, 0)) = 0 THEN 0
                ELSE ROUND((ist.idx_blks_hit::NUMERIC / (ist.idx_blks_read + ist.idx_blks_hit))::NUMERIC, 3)
            END
        ),
        CASE 
            WHEN id.access_method = 'btree' AND id.index_size_bytes > 100 * 1024 * 1024 THEN
                ARRAY['Consider partitioning large B-tree index', 'Monitor for index bloat']
            WHEN id.uniqueness = 'UNIQUE' AND ist.idx_tup_read > 1000000 THEN
                ARRAY['High-traffic unique index - monitor lock contention', 'Consider sequence-based keys']
            WHEN id.access_method = 'btree' AND ist.idx_tup_fetch::NUMERIC / NULLIF(ist.idx_tup_read, 0) < 0.1 THEN
                ARRAY['Low selectivity B-tree index', 'Consider partial or composite index']
            ELSE
                ARRAY['Index performing within normal parameters']
        END::TEXT[]
    FROM index_details id
    LEFT JOIN index_stats ist ON id.indexname = ist.indexname 
                              AND id.tablename = ist.tablename 
                              AND id.schemaname = ist.schemaname
    WHERE id.schemaname NOT IN ('information_schema', 'pg_catalog')
    ORDER BY id.index_size_bytes DESC;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_index_contention();
```

## Identifying Lock Contention

### 1. Real-Time Lock Monitoring

```sql
-- Comprehensive lock contention monitoring
CREATE OR REPLACE FUNCTION monitor_lock_contention()
RETURNS TABLE(
    contention_type VARCHAR(30),
    resource_identifier TEXT,
    waiting_sessions INTEGER,
    longest_wait_seconds DECIMAL(10,3),
    blocking_query TEXT,
    waiting_queries TEXT[],
    severity_level VARCHAR(15),
    immediate_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH lock_waits AS (
        SELECT 
            l.locktype,
            l.database,
            l.relation,
            l.page,
            l.tuple,
            l.classid,
            l.objid,
            l.mode,
            l.granted,
            l.pid,
            sa.query,
            sa.application_name,
            sa.client_addr,
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - sa.query_start)) as wait_duration,
            COALESCE(c.relname, 'unknown') as relation_name,
            COALESCE(n.nspname, 'unknown') as schema_name
        FROM pg_locks l
        LEFT JOIN pg_stat_activity sa ON l.pid = sa.pid
        LEFT JOIN pg_class c ON l.relation = c.oid
        LEFT JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE sa.state = 'active'
    ),
    blocking_relationships AS (
        SELECT 
            blocked.locktype,
            blocked.database,
            blocked.relation,
            blocked.schema_name,
            blocked.relation_name,
            blocked.mode as blocked_mode,
            blocker.mode as blocking_mode,
            blocked.pid as blocked_pid,
            blocker.pid as blocking_pid,
            blocked.query as blocked_query,
            blocker.query as blocking_query,
            blocked.wait_duration,
            blocker.application_name as blocking_app
        FROM lock_waits blocked
        JOIN lock_waits blocker ON (
            blocked.locktype = blocker.locktype AND
            blocked.database = blocker.database AND
            blocked.relation IS NOT DISTINCT FROM blocker.relation AND
            blocked.page IS NOT DISTINCT FROM blocker.page AND
            blocked.tuple IS NOT DISTINCT FROM blocker.tuple AND
            blocked.classid IS NOT DISTINCT FROM blocker.classid AND
            blocked.objid IS NOT DISTINCT FROM blocker.objid AND
            blocked.pid != blocker.pid
        )
        WHERE blocked.granted = false AND blocker.granted = true
    ),
    contention_summary AS (
        SELECT 
            br.locktype,
            format('%s.%s', br.schema_name, br.relation_name) as resource_id,
            COUNT(DISTINCT br.blocked_pid) as waiting_count,
            MAX(br.wait_duration) as max_wait,
            MAX(br.blocking_query) as sample_blocking_query,
            ARRAY_AGG(DISTINCT SUBSTRING(br.blocked_query, 1, 100)) as sample_waiting_queries
        FROM blocking_relationships br
        GROUP BY br.locktype, br.schema_name, br.relation_name
    )
    SELECT 
        cs.locktype::VARCHAR(30),
        cs.resource_id::TEXT,
        cs.waiting_count::INTEGER,
        ROUND(cs.max_wait::NUMERIC, 3),
        COALESCE(SUBSTRING(cs.sample_blocking_query, 1, 150), 'No query info')::TEXT,
        cs.sample_waiting_queries,
        CASE 
            WHEN cs.max_wait > 60 THEN 'CRITICAL'
            WHEN cs.max_wait > 30 THEN 'HIGH'
            WHEN cs.max_wait > 10 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15),
        CASE 
            WHEN cs.max_wait > 60 THEN 'Immediate intervention required'
            WHEN cs.max_wait > 30 THEN 'Investigate blocking query'
            WHEN cs.max_wait > 10 THEN 'Monitor for escalation'
            ELSE 'Normal contention level'
        END::TEXT
    FROM contention_summary cs
    ORDER BY cs.max_wait DESC, cs.waiting_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM monitor_lock_contention();
```

### 2. Historical Contention Analysis

```sql
-- Track lock contention patterns over time
CREATE TABLE IF NOT EXISTS lock_contention_history (
    id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contention_type VARCHAR(30),
    resource_identifier TEXT,
    waiting_sessions INTEGER,
    max_wait_duration DECIMAL(10,3),
    blocking_query_hash TEXT,
    application_name TEXT,
    resolution_method VARCHAR(50)
);

-- Function to record contention events
CREATE OR REPLACE FUNCTION record_contention_event(
    cont_type VARCHAR(30),
    resource_id TEXT,
    waiting_count INTEGER,
    max_wait DECIMAL(10,3),
    blocking_query TEXT DEFAULT NULL,
    app_name TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    event_id INTEGER;
    query_hash TEXT;
BEGIN
    -- Generate hash for blocking query (for pattern analysis)
    SELECT MD5(COALESCE(blocking_query, 'unknown')) INTO query_hash;
    
    INSERT INTO lock_contention_history (
        contention_type,
        resource_identifier,
        waiting_sessions,
        max_wait_duration,
        blocking_query_hash,
        application_name
    ) VALUES (
        cont_type,
        resource_id,
        waiting_count,
        max_wait,
        query_hash,
        COALESCE(app_name, current_setting('application_name'))
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Analyze contention patterns
CREATE OR REPLACE FUNCTION analyze_contention_patterns(
    analysis_period INTERVAL DEFAULT '24 hours'
) RETURNS TABLE(
    pattern_category VARCHAR(40),
    pattern_description TEXT,
    frequency INTEGER,
    avg_severity DECIMAL(5,2),
    peak_time TEXT,
    optimization_priority VARCHAR(15)
) AS $$
BEGIN
    -- Resource-based patterns
    RETURN QUERY
    WITH resource_patterns AS (
        SELECT 
            resource_identifier,
            COUNT(*) as event_count,
            AVG(max_wait_duration) as avg_wait,
            MAX(waiting_sessions) as peak_waiting,
            EXTRACT(hour FROM recorded_at) as hour_of_day
        FROM lock_contention_history
        WHERE recorded_at > CURRENT_TIMESTAMP - analysis_period
        GROUP BY resource_identifier, EXTRACT(hour FROM recorded_at)
    ),
    top_contended_resources AS (
        SELECT 
            resource_identifier,
            SUM(event_count) as total_events,
            AVG(avg_wait) as overall_avg_wait,
            MAX(peak_waiting) as max_concurrent_waiters
        FROM resource_patterns
        GROUP BY resource_identifier
        ORDER BY total_events DESC
        LIMIT 5
    )
    SELECT 
        'Resource Contention'::VARCHAR(40),
        format('Top contended resource: %s (%s events, avg wait: %.2fs)', 
               tcr.resource_identifier, tcr.total_events, tcr.overall_avg_wait),
        tcr.total_events::INTEGER,
        tcr.overall_avg_wait::DECIMAL(5,2),
        'Various'::TEXT,
        CASE 
            WHEN tcr.overall_avg_wait > 30 THEN 'CRITICAL'
            WHEN tcr.total_events > 50 THEN 'HIGH'
            ELSE 'MEDIUM'
        END::VARCHAR(15)
    FROM top_contended_resources tcr
    LIMIT 1;
    
    -- Time-based patterns
    RETURN QUERY
    WITH hourly_patterns AS (
        SELECT 
            EXTRACT(hour FROM recorded_at) as hour_of_day,
            COUNT(*) as events_per_hour,
            AVG(max_wait_duration) as avg_wait_per_hour
        FROM lock_contention_history
        WHERE recorded_at > CURRENT_TIMESTAMP - analysis_period
        GROUP BY EXTRACT(hour FROM recorded_at)
    )
    SELECT 
        'Temporal Pattern'::VARCHAR(40),
        format('Peak contention hour: %s:00 (%s events/hour)', 
               hp.hour_of_day, hp.events_per_hour),
        hp.events_per_hour::INTEGER,
        hp.avg_wait_per_hour::DECIMAL(5,2),
        format('%s:00 - %s:00', hp.hour_of_day, hp.hour_of_day + 1)::TEXT,
        CASE 
            WHEN hp.events_per_hour > 20 THEN 'HIGH'
            WHEN hp.events_per_hour > 10 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15)
    FROM hourly_patterns hp
    ORDER BY hp.events_per_hour DESC
    LIMIT 1;
    
    -- Application-based patterns
    RETURN QUERY
    WITH app_patterns AS (
        SELECT 
            application_name,
            COUNT(*) as app_events,
            AVG(max_wait_duration) as app_avg_wait,
            COUNT(DISTINCT resource_identifier) as resources_affected
        FROM lock_contention_history
        WHERE recorded_at > CURRENT_TIMESTAMP - analysis_period
        AND application_name IS NOT NULL
        GROUP BY application_name
    )
    SELECT 
        'Application Pattern'::VARCHAR(40),
        format('Most problematic app: %s (%s events, %s resources)', 
               ap.application_name, ap.app_events, ap.resources_affected),
        ap.app_events::INTEGER,
        ap.app_avg_wait::DECIMAL(5,2),
        'Application-specific'::TEXT,
        CASE 
            WHEN ap.resources_affected > 5 THEN 'HIGH'
            WHEN ap.app_events > 15 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15)
    FROM app_patterns ap
    ORDER BY ap.app_events DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_contention_patterns('24 hours'::INTERVAL);
```

## Performance Impact of Lock Contention

### 1. Measuring Contention Impact

```sql
-- Comprehensive performance impact assessment
CREATE OR REPLACE FUNCTION assess_contention_performance_impact()
RETURNS TABLE(
    impact_category VARCHAR(30),
    metric_name VARCHAR(40),
    current_value DECIMAL(12,3),
    baseline_value DECIMAL(12,3),
    impact_severity VARCHAR(15),
    business_impact TEXT
) AS $$
DECLARE
    avg_response_time DECIMAL(12,3);
    throughput_tps DECIMAL(12,3);
    connection_utilization DECIMAL(5,2);
    lock_wait_ratio DECIMAL(5,2);
    active_sessions INTEGER;
    waiting_sessions INTEGER;
BEGIN
    -- Calculate current performance metrics
    SELECT 
        AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start)))
    INTO avg_response_time
    FROM pg_stat_activity
    WHERE state = 'active' AND query_start IS NOT NULL;
    
    SELECT 
        COUNT(*)::DECIMAL / 60  -- Approximate TPS over last minute
    INTO throughput_tps
    FROM pg_stat_database
    WHERE datname = current_database();
    
    SELECT COUNT(*) INTO active_sessions
    FROM pg_stat_activity WHERE state = 'active';
    
    SELECT COUNT(*) INTO waiting_sessions
    FROM pg_locks WHERE NOT granted;
    
    -- Calculate ratios
    lock_wait_ratio := CASE 
        WHEN active_sessions > 0 THEN (waiting_sessions * 100.0 / active_sessions)
        ELSE 0 
    END;
    
    connection_utilization := CASE 
        WHEN current_setting('max_connections')::INTEGER > 0 THEN 
            (active_sessions * 100.0 / current_setting('max_connections')::INTEGER)
        ELSE 0 
    END;
    
    -- Return impact assessment
    RETURN QUERY SELECT 
        'Response Time'::VARCHAR(30),
        'Average Query Duration'::VARCHAR(40),
        COALESCE(avg_response_time, 0),
        5.0::DECIMAL(12,3),  -- Baseline: 5 seconds
        CASE 
            WHEN COALESCE(avg_response_time, 0) > 30 THEN 'CRITICAL'
            WHEN COALESCE(avg_response_time, 0) > 15 THEN 'HIGH'
            WHEN COALESCE(avg_response_time, 0) > 5 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15),
        CASE 
            WHEN COALESCE(avg_response_time, 0) > 15 THEN 'Severe user experience degradation'
            WHEN COALESCE(avg_response_time, 0) > 5 THEN 'Noticeable performance impact'
            ELSE 'Acceptable response times'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Concurrency'::VARCHAR(30),
        'Lock Wait Ratio (%)'::VARCHAR(40),
        lock_wait_ratio,
        5.0::DECIMAL(12,3),  -- Baseline: 5% waiting
        CASE 
            WHEN lock_wait_ratio > 25 THEN 'CRITICAL'
            WHEN lock_wait_ratio > 15 THEN 'HIGH'
            WHEN lock_wait_ratio > 5 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15),
        CASE 
            WHEN lock_wait_ratio > 15 THEN 'High percentage of sessions blocked'
            WHEN lock_wait_ratio > 5 THEN 'Moderate lock contention impact'
            ELSE 'Minimal contention impact'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Capacity'::VARCHAR(30),
        'Connection Utilization (%)'::VARCHAR(40),
        connection_utilization,
        70.0::DECIMAL(12,3),  -- Baseline: 70% utilization
        CASE 
            WHEN connection_utilization > 90 THEN 'CRITICAL'
            WHEN connection_utilization > 80 THEN 'HIGH'
            WHEN connection_utilization > 70 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15),
        CASE 
            WHEN connection_utilization > 80 THEN 'Near capacity limits - implement connection pooling'
            WHEN connection_utilization > 70 THEN 'Approaching capacity concerns'
            ELSE 'Adequate connection capacity'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'System Load'::VARCHAR(30),
        'Active Sessions'::VARCHAR(40),
        active_sessions::DECIMAL(12,3),
        50.0::DECIMAL(12,3),  -- Baseline: 50 active sessions
        CASE 
            WHEN active_sessions > 100 THEN 'HIGH'
            WHEN active_sessions > 50 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15),
        CASE 
            WHEN active_sessions > 100 THEN 'High concurrent activity may increase contention'
            ELSE 'Normal concurrent activity level'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM assess_contention_performance_impact() ORDER BY impact_severity DESC;
```

### 2. Contention Cost Analysis

```sql
-- Calculate business cost of lock contention
CREATE OR REPLACE FUNCTION calculate_contention_costs(
    analysis_period INTERVAL DEFAULT '1 hour',
    avg_transaction_value DECIMAL(10,2) DEFAULT 100.00,
    cost_per_second DECIMAL(10,2) DEFAULT 1.00
) RETURNS TABLE(
    cost_category VARCHAR(30),
    total_wait_time_seconds DECIMAL(12,3),
    affected_transactions INTEGER,
    estimated_revenue_impact DECIMAL(15,2),
    productivity_cost DECIMAL(15,2),
    total_estimated_cost DECIMAL(15,2)
) AS $$
DECLARE
    total_wait_time DECIMAL(12,3);
    transaction_count INTEGER;
    avg_wait_per_transaction DECIMAL(10,3);
BEGIN
    -- Calculate wait time statistics
    SELECT 
        COALESCE(SUM(max_wait_duration), 0),
        COALESCE(SUM(waiting_sessions), 0)
    INTO total_wait_time, transaction_count
    FROM lock_contention_history
    WHERE recorded_at > CURRENT_TIMESTAMP - analysis_period;
    
    -- If no historical data, estimate from current state
    IF total_wait_time = 0 THEN
        SELECT 
            COALESCE(SUM(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start))), 0),
            COUNT(*)
        INTO total_wait_time, transaction_count
        FROM pg_stat_activity sa
        JOIN pg_locks l ON sa.pid = l.pid
        WHERE l.granted = false AND sa.state = 'active';
    END IF;
    
    avg_wait_per_transaction := CASE 
        WHEN transaction_count > 0 THEN total_wait_time / transaction_count
        ELSE 0 
    END;
    
    -- Return cost analysis
    RETURN QUERY SELECT 
        'Direct Wait Time'::VARCHAR(30),
        total_wait_time,
        transaction_count,
        -- Revenue impact: delayed transactions * average value * delay factor
        (transaction_count * avg_transaction_value * (avg_wait_per_transaction / 60))::DECIMAL(15,2),
        -- Productivity cost: wait time * cost per second
        (total_wait_time * cost_per_second)::DECIMAL(15,2),
        -- Total cost
        ((transaction_count * avg_transaction_value * (avg_wait_per_transaction / 60)) + 
         (total_wait_time * cost_per_second))::DECIMAL(15,2);
    
    -- Additional indirect costs
    RETURN QUERY SELECT 
        'User Experience Impact'::VARCHAR(30),
        total_wait_time * 0.3,  -- Assume 30% of wait time affects UX
        transaction_count,
        -- Customer satisfaction impact (estimated)
        (transaction_count * avg_transaction_value * 0.1)::DECIMAL(15,2),
        -- Support/troubleshooting costs
        (total_wait_time * cost_per_second * 0.2)::DECIMAL(15,2),
        ((transaction_count * avg_transaction_value * 0.1) + 
         (total_wait_time * cost_per_second * 0.2))::DECIMAL(15,2);
    
    -- System resource costs
    RETURN QUERY SELECT 
        'Resource Utilization'::VARCHAR(30),
        total_wait_time * 0.5,  -- Resource overhead during waits
        transaction_count,
        -- Infrastructure costs due to inefficiency
        (total_wait_time * cost_per_second * 0.1)::DECIMAL(15,2),
        -- Operational overhead
        (total_wait_time * cost_per_second * 0.15)::DECIMAL(15,2),
        (total_wait_time * cost_per_second * 0.25)::DECIMAL(15,2);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM calculate_contention_costs('1 hour'::INTERVAL, 50.00, 2.00);
```

## Optimization Strategies

### 1. Reducing Row-Level Contention

```sql
-- Strategies for reducing row-level lock contention
CREATE OR REPLACE FUNCTION optimize_row_level_contention()
RETURNS TABLE(
    optimization_strategy VARCHAR(50),
    implementation_complexity VARCHAR(15),
    expected_improvement VARCHAR(20),
    implementation_steps TEXT[],
    monitoring_metrics TEXT[]
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Optimistic Locking with Versioning',
     'MEDIUM',
     'HIGH',
     ARRAY[
         'Add version column to tables',
         'Modify update logic to check version',
         'Implement retry logic for version conflicts',
         'Test concurrent update scenarios'
     ],
     ARRAY[
         'Version conflict rate',
         'Retry success rate',
         'Average retry count per transaction'
     ]),
    
    ('Hot Row Partitioning',
     'HIGH',
     'VERY HIGH',
     ARRAY[
         'Identify frequently updated rows',
         'Design partitioning strategy',
         'Implement partition-aware application logic',
         'Migrate data to partitioned structure'
     ],
     ARRAY[
         'Lock wait time per partition',
         'Cross-partition query performance',
         'Partition size distribution'
     ]),
    
    ('Application-Level Queuing',
     'MEDIUM',
     'HIGH',
     ARRAY[
         'Implement operation queue system',
         'Serialize high-contention operations',
         'Add queue monitoring and alerting',
         'Implement queue processing workers'
     ],
     ARRAY[
         'Queue depth and processing time',
         'Operation throughput',
         'Queue worker utilization'
     ]),
    
    ('Batch Processing Optimization',
     'LOW',
     'MEDIUM',
     ARRAY[
         'Group related operations into batches',
         'Implement consistent ordering within batches',
         'Use appropriate batch sizes',
         'Add batch progress monitoring'
     ],
     ARRAY[
         'Batch size vs processing time',
         'Lock contention during batch operations',
         'Overall throughput improvement'
     ]),
    
    ('Read Replica Offloading',
     'HIGH',
     'MEDIUM',
     ARRAY[
         'Set up read replicas',
         'Modify application to use read replicas',
         'Implement connection routing logic',
         'Monitor replica lag and consistency'
     ],
     ARRAY[
         'Read/write traffic distribution',
         'Replica lag metrics',
         'Master write contention reduction'
     ]);
END;
$$ LANGUAGE plpgsql;

-- Implementation example: Optimistic locking
CREATE OR REPLACE FUNCTION update_with_optimistic_lock(
    table_name TEXT,
    row_id INTEGER,
    new_values JSONB,
    current_version INTEGER
) RETURNS TABLE(
    success BOOLEAN,
    new_version INTEGER,
    conflict_detected BOOLEAN,
    retry_recommended BOOLEAN
) AS $$
DECLARE
    updated_rows INTEGER;
    resulting_version INTEGER;
BEGIN
    -- Attempt optimistic update
    EXECUTE format('
        UPDATE %I 
        SET %s, 
            version = version + 1,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = $1 AND version = $2',
        table_name,
        (SELECT string_agg(key || ' = ' || quote_literal(value), ', ')
         FROM jsonb_each_text(new_values))
    ) USING row_id, current_version;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    IF updated_rows = 1 THEN
        -- Success
        EXECUTE format('SELECT version FROM %I WHERE id = $1', table_name) 
        INTO resulting_version USING row_id;
        
        RETURN QUERY SELECT TRUE, resulting_version, FALSE, FALSE;
    ELSE
        -- Version conflict
        EXECUTE format('SELECT version FROM %I WHERE id = $1', table_name) 
        INTO resulting_version USING row_id;
        
        RETURN QUERY SELECT FALSE, resulting_version, TRUE, TRUE;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, current_version, FALSE, FALSE;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM optimize_row_level_contention();
```

### 2. Table-Level Contention Reduction

```sql
-- Table-level optimization strategies
CREATE OR REPLACE FUNCTION optimize_table_level_contention()
RETURNS TABLE(
    strategy_name VARCHAR(50),
    contention_scenario TEXT,
    implementation_approach TEXT,
    expected_benefit VARCHAR(20),
    implementation_timeline VARCHAR(15)
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Concurrent Index Creation',
     'CREATE INDEX blocking queries',
     'Use CREATE INDEX CONCURRENTLY for production environments',
     'HIGH',
     'IMMEDIATE'),
    
    ('DDL Scheduling',
     'ALTER TABLE during business hours',
     'Schedule DDL operations during maintenance windows',
     'VERY HIGH',
     'SHORT'),
    
    ('Batch Size Optimization',
     'Large bulk operations blocking OLTP',
     'Break large operations into smaller batches',
     'HIGH',
     'SHORT'),
    
    ('Connection Pooling',
     'Too many concurrent connections',
     'Implement pgBouncer or similar pooling solution',
     'HIGH',
     'MEDIUM'),
    
    ('Read-Write Splitting',
     'Read queries competing with writes',
     'Direct read queries to read replicas',
     'MEDIUM',
     'LONG'),
    
    ('Table Partitioning',
     'Large table causing lock escalation',
     'Partition tables by appropriate key (time, range, etc.)',
     'VERY HIGH',
     'LONG'),
    
    ('Advisory Lock Coordination',
     'Application-level resource conflicts',
     'Use PostgreSQL advisory locks for coordination',
     'MEDIUM',
     'MEDIUM');
END;
$$ LANGUAGE plpgsql;

-- Example: Intelligent batch processing
CREATE OR REPLACE FUNCTION process_with_contention_awareness(
    target_table TEXT,
    batch_size INTEGER DEFAULT 1000,
    max_wait_threshold DECIMAL DEFAULT 5.0
) RETURNS TABLE(
    batch_number INTEGER,
    rows_processed INTEGER,
    batch_duration DECIMAL(10,3),
    contention_detected BOOLEAN,
    adjustment_made VARCHAR(50)
) AS $$
DECLARE
    current_batch INTEGER := 1;
    processed_count INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    current_wait_time DECIMAL;
    adjusted_batch_size INTEGER := batch_size;
    total_processed INTEGER := 0;
BEGIN
    LOOP
        start_time := CURRENT_TIMESTAMP;
        
        -- Check current contention level
        SELECT COALESCE(MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start))), 0)
        INTO current_wait_time
        FROM pg_stat_activity sa
        JOIN pg_locks l ON sa.pid = l.pid
        WHERE l.granted = false AND l.relation = (
            SELECT oid FROM pg_class WHERE relname = target_table
        );
        
        -- Adjust batch size based on contention
        IF current_wait_time > max_wait_threshold THEN
            adjusted_batch_size := GREATEST(adjusted_batch_size / 2, 100);
        ELSIF current_wait_time < max_wait_threshold / 2 THEN
            adjusted_batch_size := LEAST(adjusted_batch_size * 1.2, batch_size * 2);
        END IF;
        
        -- Process batch with SKIP LOCKED to avoid contention
        EXECUTE format('
            WITH batch_rows AS (
                SELECT ctid FROM %I 
                WHERE processed = false 
                ORDER BY id 
                LIMIT %s
                FOR UPDATE SKIP LOCKED
            )
            UPDATE %I SET processed = true, processed_at = CURRENT_TIMESTAMP
            WHERE ctid IN (SELECT ctid FROM batch_rows)',
            target_table, adjusted_batch_size, target_table);
        
        GET DIAGNOSTICS processed_count = ROW_COUNT;
        total_processed := total_processed + processed_count;
        end_time := CURRENT_TIMESTAMP;
        
        RETURN QUERY SELECT 
            current_batch,
            processed_count,
            EXTRACT(EPOCH FROM (end_time - start_time))::DECIMAL(10,3),
            (current_wait_time > max_wait_threshold),
            CASE 
                WHEN current_wait_time > max_wait_threshold THEN 'Reduced batch size'
                WHEN current_wait_time < max_wait_threshold / 2 THEN 'Increased batch size'
                ELSE 'No adjustment'
            END::VARCHAR(50);
        
        -- Exit if no more rows to process
        EXIT WHEN processed_count = 0;
        
        current_batch := current_batch + 1;
        
        -- Brief pause to allow other operations
        PERFORM pg_sleep(0.01);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM optimize_table_level_contention();
```

## Monitoring and Alerting

### 1. Comprehensive Monitoring Setup

```sql
-- Complete monitoring setup for lock contention
CREATE OR REPLACE VIEW lock_contention_dashboard AS
WITH current_locks AS (
    SELECT 
        COUNT(*) as total_locks,
        COUNT(*) FILTER (WHERE NOT granted) as waiting_locks,
        COUNT(DISTINCT pid) FILTER (WHERE NOT granted) as blocked_sessions,
        COALESCE(MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start))), 0) as max_wait_time
    FROM pg_locks l
    LEFT JOIN pg_stat_activity sa ON l.pid = sa.pid
),
contention_stats AS (
    SELECT 
        COUNT(*) as recent_events,
        AVG(max_wait_duration) as avg_wait_time,
        MAX(waiting_sessions) as peak_waiting_sessions
    FROM lock_contention_history
    WHERE recorded_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
),
system_health AS (
    SELECT 
        COUNT(*) FILTER (WHERE state = 'active') as active_connections,
        COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        current_setting('max_connections')::INTEGER as max_connections
    FROM pg_stat_activity
)
SELECT 
    'Lock Contention Dashboard' as dashboard_name,
    jsonb_build_object(
        'current_status', jsonb_build_object(
            'total_locks', cl.total_locks,
            'waiting_locks', cl.waiting_locks,
            'blocked_sessions', cl.blocked_sessions,
            'max_current_wait_seconds', ROUND(cl.max_wait_time::NUMERIC, 2)
        ),
        'recent_trends', jsonb_build_object(
            'events_last_hour', cs.recent_events,
            'avg_wait_time_seconds', ROUND(COALESCE(cs.avg_wait_time, 0)::NUMERIC, 2),
            'peak_concurrent_waits', COALESCE(cs.peak_waiting_sessions, 0)
        ),
        'system_capacity', jsonb_build_object(
            'active_connections', sh.active_connections,
            'idle_in_transaction', sh.idle_in_transaction,
            'connection_utilization_pct', ROUND(
                (sh.active_connections * 100.0 / sh.max_connections)::NUMERIC, 1
            )
        ),
        'health_indicators', jsonb_build_object(
            'contention_level', CASE 
                WHEN cl.waiting_locks = 0 THEN 'HEALTHY'
                WHEN cl.waiting_locks < 5 THEN 'CAUTION'
                WHEN cl.waiting_locks < 15 THEN 'WARNING'
                ELSE 'CRITICAL'
            END,
            'response_time_status', CASE 
                WHEN cl.max_wait_time < 5 THEN 'GOOD'
                WHEN cl.max_wait_time < 30 THEN 'DEGRADED'
                ELSE 'POOR'
            END,
            'trend_direction', CASE 
                WHEN cs.recent_events = 0 THEN 'STABLE'
                WHEN cs.recent_events < 5 THEN 'INCREASING'
                ELSE 'ESCALATING'
            END
        ),
        'last_updated', CURRENT_TIMESTAMP
    ) as dashboard_data
FROM current_locks cl
CROSS JOIN contention_stats cs
CROSS JOIN system_health sh;

-- Usage
SELECT * FROM lock_contention_dashboard;
```

### 2. Automated Alerting System

```sql
-- Automated alerting for lock contention
CREATE OR REPLACE FUNCTION lock_contention_alert_system()
RETURNS TABLE(
    alert_timestamp TIMESTAMP,
    alert_severity VARCHAR(10),
    alert_type VARCHAR(30),
    alert_message TEXT,
    affected_resources TEXT[],
    recommended_actions TEXT[],
    alert_metadata JSONB
) AS $$
DECLARE
    alert_time TIMESTAMP := CURRENT_TIMESTAMP;
    waiting_locks_count INTEGER;
    max_wait_duration DECIMAL;
    blocked_sessions_count INTEGER;
    high_contention_tables TEXT[];
BEGIN
    -- Gather current metrics
    SELECT 
        COUNT(*) FILTER (WHERE NOT granted),
        COALESCE(MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - sa.query_start))), 0),
        COUNT(DISTINCT l.pid) FILTER (WHERE NOT granted)
    INTO waiting_locks_count, max_wait_duration, blocked_sessions_count
    FROM pg_locks l
    LEFT JOIN pg_stat_activity sa ON l.pid = sa.pid;
    
    -- Identify high-contention tables
    SELECT ARRAY_AGG(schemaname || '.' || relname)
    INTO high_contention_tables
    FROM (
        SELECT n.nspname as schemaname, c.relname, COUNT(*) as lock_count
        FROM pg_locks l
        JOIN pg_class c ON l.relation = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE NOT l.granted
        GROUP BY n.nspname, c.relname
        HAVING COUNT(*) >= 3
        ORDER BY COUNT(*) DESC
        LIMIT 5
    ) contested;
    
    -- Critical alerts
    IF max_wait_duration > 60 THEN
        RETURN QUERY SELECT 
            alert_time,
            'CRITICAL'::VARCHAR(10),
            'Long Lock Wait'::VARCHAR(30),
            format('Sessions waiting for locks for %.1f seconds', max_wait_duration)::TEXT,
            COALESCE(high_contention_tables, ARRAY[]::TEXT[]),
            ARRAY[
                'Identify and terminate blocking queries',
                'Check for deadlocks or long-running transactions',
                'Consider emergency query cancellation'
            ]::TEXT[],
            jsonb_build_object(
                'max_wait_seconds', max_wait_duration,
                'blocked_sessions', blocked_sessions_count,
                'severity_threshold', 60
            );
    END IF;
    
    IF blocked_sessions_count > 20 THEN
        RETURN QUERY SELECT 
            alert_time,
            'CRITICAL'::VARCHAR(10),
            'High Session Blocking'::VARCHAR(30),
            format('%s sessions currently blocked by locks', blocked_sessions_count)::TEXT,
            COALESCE(high_contention_tables, ARRAY[]::TEXT[]),
            ARRAY[
                'Scale up database resources',
                'Implement connection pooling',
                'Review application transaction patterns'
            ]::TEXT[],
            jsonb_build_object(
                'blocked_sessions', blocked_sessions_count,
                'threshold_exceeded', true
            );
    END IF;
    
    -- Warning alerts
    IF waiting_locks_count > 10 AND max_wait_duration > 10 THEN
        RETURN QUERY SELECT 
            alert_time,
            'WARNING'::VARCHAR(10),
            'Moderate Lock Contention'::VARCHAR(30),
            format('%s locks waiting, max wait time %.1f seconds', 
                   waiting_locks_count, max_wait_duration)::TEXT,
            COALESCE(high_contention_tables, ARRAY[]::TEXT[]),
            ARRAY[
                'Monitor for escalation',
                'Review recent application deployments',
                'Check for batch processing interference'
            ]::TEXT[],
            jsonb_build_object(
                'waiting_locks', waiting_locks_count,
                'max_wait_seconds', max_wait_duration
            );
    END IF;
    
    -- Info alerts
    IF waiting_locks_count = 0 THEN
        RETURN QUERY SELECT 
            alert_time,
            'INFO'::VARCHAR(10),
            'System Status'::VARCHAR(30),
            'No lock contention detected - system operating normally'::TEXT,
            ARRAY[]::TEXT[],
            ARRAY['Continue normal monitoring']::TEXT[],
            jsonb_build_object(
                'system_status', 'healthy',
                'monitoring_active', true
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM lock_contention_alert_system();
```

## Summary

**Lock Contention Definition and Characteristics:**

**Core Concept:**
- **Resource Competition**: Multiple transactions competing for same database resources
- **Performance Degradation**: Causes increased response times and reduced throughput
- **Queue Formation**: Transactions wait in line for resource access
- **Different from Deadlocks**: No circular dependencies, just sequential waiting

**Types of Lock Contention:**
- **Row-Level**: Most common, occurs on specific table rows
- **Table-Level**: DDL vs DML operations, bulk vs OLTP conflicts
- **Index-Level**: High-concurrency inserts, index page contention
- **System-Level**: Connection limits, resource exhaustion

**Identification Methods:**
- **Real-Time Monitoring**: `pg_locks` and `pg_stat_activity` analysis
- **Lock Dependency Tracking**: Blocker-blocked relationship mapping
- **Historical Analysis**: Pattern recognition and trend analysis
- **Performance Impact Assessment**: Response time and throughput metrics

**Performance Impact:**
- **Direct Costs**: Increased response times, reduced throughput
- **Indirect Costs**: User experience degradation, resource waste
- **Business Impact**: Revenue loss, customer satisfaction decline
- **System Impact**: Resource utilization inefficiency, capacity limitations

**Optimization Strategies:**
- **Row-Level**: Optimistic locking, hot row partitioning, application queuing
- **Table-Level**: Concurrent operations, DDL scheduling, batch optimization
- **System-Level**: Connection pooling, read-write splitting, resource scaling
- **Application-Level**: Transaction design, retry logic, conflict avoidance

**Monitoring and Prevention:**
- **Real-Time Dashboards**: Current contention status and trends
- **Automated Alerting**: Threshold-based notifications and escalation
- **Historical Tracking**: Pattern analysis and performance correlation
- **Proactive Assessment**: Risk evaluation and early warning systems

**Best Practices:**
- Monitor lock wait times and contention patterns regularly
- Implement appropriate timeout settings and retry logic
- Design applications with contention awareness
- Use connection pooling and resource management
- Schedule maintenance operations during low-activity periods
- Implement graduated response strategies based on contention severity

**Tools and Techniques:**
- Built-in PostgreSQL monitoring views and functions
- Custom monitoring solutions and dashboards
- Third-party monitoring platforms and APM tools
- Log analysis and pattern recognition systems
- Performance testing and capacity planning tools

Lock contention is a fundamental challenge in concurrent database systems that requires comprehensive monitoring, analysis, and optimization strategies to maintain optimal performance and user experience in production environments.