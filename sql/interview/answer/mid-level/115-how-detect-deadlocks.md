# 115. How do you detect deadlocks?

## Overview

PostgreSQL provides multiple mechanisms to detect deadlocks, ranging from automatic built-in detection to comprehensive monitoring and logging systems. Deadlock detection involves identifying circular wait conditions between transactions and can be implemented through real-time monitoring, log analysis, and proactive alerting systems.

## Automatic Deadlock Detection

### 1. PostgreSQL's Built-in Deadlock Detector

PostgreSQL automatically detects deadlocks using a periodic deadlock detection algorithm.

```sql
-- Understanding PostgreSQL's deadlock detection configuration
CREATE OR REPLACE VIEW deadlock_detection_config AS
SELECT 
    name,
    setting,
    unit,
    category,
    short_desc,
    context,
    CASE 
        WHEN name = 'deadlock_timeout' THEN
            'Time PostgreSQL waits before checking for deadlocks'
        WHEN name = 'log_lock_waits' THEN
            'Whether to log statements that wait longer than deadlock_timeout'
        WHEN name = 'log_statement' THEN
            'Controls which SQL statements are logged'
        ELSE short_desc
    END as explanation
FROM pg_settings
WHERE name IN ('deadlock_timeout', 'log_lock_waits', 'log_statement', 'logging_collector')
ORDER BY 
    CASE name
        WHEN 'deadlock_timeout' THEN 1
        WHEN 'log_lock_waits' THEN 2
        WHEN 'log_statement' THEN 3
        WHEN 'logging_collector' THEN 4
    END;

-- Usage
SELECT * FROM deadlock_detection_config;

-- Demonstrate deadlock detection behavior
CREATE OR REPLACE FUNCTION explain_deadlock_detection()
RETURNS TABLE(
    detection_aspect VARCHAR(40),
    description TEXT,
    configuration_parameter VARCHAR(30),
    recommended_setting VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Detection Frequency', 
     'PostgreSQL checks for deadlocks every deadlock_timeout interval',
     'deadlock_timeout', 
     '1s'),
    
    ('Detection Algorithm', 
     'Wait-for graph analysis to identify circular dependencies',
     'N/A', 
     'Automatic'),
    
    ('Victim Selection', 
     'Choose transaction to abort based on cost estimation',
     'N/A', 
     'Automatic'),
    
    ('Error Generation', 
     'Selected victim receives SQLSTATE 40P01 error',
     'N/A', 
     'Automatic'),
    
    ('Wait Logging', 
     'Log statements that wait longer than deadlock_timeout',
     'log_lock_waits', 
     'on'),
    
    ('Statement Logging', 
     'Control which statements get logged to help with analysis',
     'log_statement', 
     'ddl or all');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM explain_deadlock_detection();
```

### 2. Deadlock Detection Process

```sql
-- Simulating deadlock detection process
CREATE OR REPLACE FUNCTION simulate_deadlock_detection_process()
RETURNS TABLE(
    step_number INTEGER,
    detection_phase VARCHAR(30),
    phase_description TEXT,
    time_estimate VARCHAR(20),
    outcome TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    (1, 'Lock Wait Detection', 
     'Transaction waits for lock longer than deadlock_timeout',
     '1 second (default)',
     'Triggers deadlock detection process'),
    
    (2, 'Wait-for Graph Construction', 
     'Build graph of waiting transactions and held locks',
     '< 1 millisecond',
     'Graph represents current lock dependencies'),
    
    (3, 'Cycle Detection', 
     'Analyze wait-for graph for circular dependencies',
     '< 1 millisecond',
     'Identifies if deadlock exists'),
    
    (4, 'Victim Selection', 
     'Choose transaction to abort using cost-based algorithm',
     '< 1 millisecond',
     'Selects victim with lowest estimated cost'),
    
    (5, 'Deadlock Resolution', 
     'Abort victim transaction with error code 40P01',
     'Immediate',
     'Remaining transactions can proceed'),
    
    (6, 'Lock Release', 
     'Release all locks held by aborted transaction',
     'Immediate',
     'Allows waiting transactions to acquire needed locks');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM simulate_deadlock_detection_process();
```

## Real-Time Deadlock Monitoring

### 1. Live Lock Analysis

```sql
-- Real-time lock monitoring for deadlock detection
CREATE OR REPLACE FUNCTION monitor_locks_for_deadlocks()
RETURNS TABLE(
    monitoring_category VARCHAR(30),
    current_count INTEGER,
    concern_level VARCHAR(15),
    description TEXT,
    immediate_action TEXT
) AS $$
DECLARE
    total_locks INTEGER;
    waiting_locks INTEGER;
    blocked_sessions INTEGER;
    lock_types_count INTEGER;
    avg_wait_time DECIMAL;
BEGIN
    -- Gather lock statistics
    SELECT COUNT(*) INTO total_locks FROM pg_locks;
    SELECT COUNT(*) INTO waiting_locks FROM pg_locks WHERE NOT granted;
    SELECT COUNT(DISTINCT pid) INTO blocked_sessions FROM pg_locks WHERE NOT granted;
    SELECT COUNT(DISTINCT locktype) INTO lock_types_count FROM pg_locks WHERE NOT granted;
    
    -- Calculate average wait time
    SELECT 
        AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start)))
    INTO avg_wait_time
    FROM pg_stat_activity psa
    JOIN pg_locks pl ON psa.pid = pl.pid
    WHERE pl.granted = false AND psa.state = 'active';
    
    -- Return monitoring results
    RETURN QUERY SELECT 
        'Total Active Locks'::VARCHAR(30),
        total_locks,
        CASE 
            WHEN total_locks < 100 THEN 'LOW'
            WHEN total_locks < 500 THEN 'MEDIUM'
            ELSE 'HIGH'
        END::VARCHAR(15),
        format('System currently managing %s active locks', total_locks)::TEXT,
        CASE 
            WHEN total_locks > 1000 THEN 'Monitor for performance impact'
            ELSE 'Normal operation'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Waiting Locks'::VARCHAR(30),
        waiting_locks,
        CASE 
            WHEN waiting_locks = 0 THEN 'GOOD'
            WHEN waiting_locks < 5 THEN 'CAUTION'
            WHEN waiting_locks < 15 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::VARCHAR(15),
        format('%s locks currently waiting - potential deadlock indicators', waiting_locks)::TEXT,
        CASE 
            WHEN waiting_locks > 10 THEN 'Investigate blocking queries immediately'
            WHEN waiting_locks > 0 THEN 'Monitor for deadlock patterns'
            ELSE 'No immediate action needed'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Blocked Sessions'::VARCHAR(30),
        blocked_sessions,
        CASE 
            WHEN blocked_sessions = 0 THEN 'GOOD'
            WHEN blocked_sessions < 3 THEN 'CAUTION'
            WHEN blocked_sessions < 8 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::VARCHAR(15),
        format('%s sessions currently blocked by lock waits', blocked_sessions)::TEXT,
        CASE 
            WHEN blocked_sessions > 5 THEN 'Check for deadlock cycles'
            WHEN blocked_sessions > 0 THEN 'Review blocking relationships'
            ELSE 'No blocked sessions'
        END::TEXT;
    
    RETURN QUERY SELECT 
        'Average Wait Time'::VARCHAR(30),
        ROUND(COALESCE(avg_wait_time, 0))::INTEGER,
        CASE 
            WHEN COALESCE(avg_wait_time, 0) > 30 THEN 'CRITICAL'
            WHEN COALESCE(avg_wait_time, 0) > 10 THEN 'WARNING'
            WHEN COALESCE(avg_wait_time, 0) > 0 THEN 'CAUTION'
            ELSE 'GOOD'
        END::VARCHAR(15),
        format('Sessions waiting average of %.1f seconds for locks', COALESCE(avg_wait_time, 0))::TEXT,
        CASE 
            WHEN COALESCE(avg_wait_time, 0) > 15 THEN 'Long waits indicate potential deadlock or blocking'
            ELSE 'Wait times within acceptable range'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM monitor_locks_for_deadlocks();
```

### 2. Detailed Lock Relationship Analysis

```sql
-- Analyze lock dependencies for potential deadlocks
CREATE OR REPLACE FUNCTION analyze_lock_dependencies()
RETURNS TABLE(
    blocker_pid INTEGER,
    blocker_query TEXT,
    blocked_pid INTEGER,
    blocked_query TEXT,
    lock_type VARCHAR(30),
    wait_duration_seconds DECIMAL(10,3),
    potential_deadlock_risk VARCHAR(15)
) AS $$
BEGIN
    RETURN QUERY
    WITH lock_conflicts AS (
        SELECT 
            bl.pid as blocker_pid,
            bl.mode as blocker_mode,
            bl.locktype,
            bl.database,
            bl.relation,
            wl.pid as blocked_pid,
            wl.mode as blocked_mode,
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ba.query_start)) as wait_time
        FROM pg_locks bl
        JOIN pg_locks wl ON (
            bl.database = wl.database AND
            bl.relation = wl.relation AND
            bl.page IS NOT DISTINCT FROM wl.page AND
            bl.tuple IS NOT DISTINCT FROM wl.tuple AND
            bl.virtualxid IS NOT DISTINCT FROM wl.virtualxid AND
            bl.transactionid IS NOT DISTINCT FROM wl.transactionid AND
            bl.classid IS NOT DISTINCT FROM wl.classid AND
            bl.objid IS NOT DISTINCT FROM wl.objid AND
            bl.objsubid IS NOT DISTINCT FROM wl.objsubid AND
            bl.pid != wl.pid
        )
        JOIN pg_stat_activity ba ON bl.pid = ba.pid
        WHERE bl.granted = true AND wl.granted = false
    ),
    blocking_relationships AS (
        SELECT 
            lc.*,
            ba_blocker.query as blocker_query,
            ba_blocked.query as blocked_query,
            -- Check for potential circular dependencies
            EXISTS (
                SELECT 1 FROM lock_conflicts lc2 
                WHERE lc2.blocker_pid = lc.blocked_pid 
                AND lc2.blocked_pid = lc.blocker_pid
            ) as potential_cycle
        FROM lock_conflicts lc
        JOIN pg_stat_activity ba_blocker ON lc.blocker_pid = ba_blocker.pid
        JOIN pg_stat_activity ba_blocked ON lc.blocked_pid = ba_blocked.pid
    )
    SELECT 
        br.blocker_pid,
        COALESCE(SUBSTRING(br.blocker_query, 1, 100) || '...', '<unknown>')::TEXT,
        br.blocked_pid,
        COALESCE(SUBSTRING(br.blocked_query, 1, 100) || '...', '<unknown>')::TEXT,
        br.locktype::VARCHAR(30),
        ROUND(br.wait_time::NUMERIC, 3),
        CASE 
            WHEN br.potential_cycle THEN 'VERY HIGH'
            WHEN br.wait_time > 30 THEN 'HIGH'
            WHEN br.wait_time > 10 THEN 'MEDIUM'
            ELSE 'LOW'
        END::VARCHAR(15)
    FROM blocking_relationships br
    ORDER BY br.wait_time DESC, br.potential_cycle DESC;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_lock_dependencies();
```

### 3. Deadlock Detection Through Graph Analysis

```sql
-- Advanced deadlock detection using graph theory
CREATE OR REPLACE FUNCTION detect_deadlock_cycles()
RETURNS TABLE(
    cycle_detected BOOLEAN,
    cycle_participants INTEGER[],
    cycle_description TEXT,
    recommended_action TEXT
) AS $$
DECLARE
    lock_graph RECORD;
    cycle_found BOOLEAN := FALSE;
    participants INTEGER[];
    cycle_desc TEXT;
BEGIN
    -- Build wait-for graph and detect cycles
    WITH RECURSIVE wait_graph AS (
        -- Base case: direct blocking relationships
        SELECT 
            bl.pid as waiter,
            wl.pid as holder,
            1 as depth,
            ARRAY[bl.pid, wl.pid] as path
        FROM pg_locks bl
        JOIN pg_locks wl ON (
            bl.database = wl.database AND
            bl.relation = wl.relation AND
            bl.pid != wl.pid
        )
        WHERE bl.granted = false AND wl.granted = true
        
        UNION
        
        -- Recursive case: follow the chain
        SELECT 
            wg.waiter,
            bl.pid as holder,
            wg.depth + 1,
            wg.path || bl.pid
        FROM wait_graph wg
        JOIN pg_locks wl ON wg.holder = wl.pid
        JOIN pg_locks bl ON (
            wl.database = bl.database AND
            wl.relation = bl.relation AND
            wl.pid != bl.pid
        )
        WHERE bl.granted = false AND wl.granted = true
        AND wg.depth < 10  -- Prevent infinite recursion
        AND NOT (bl.pid = ANY(wg.path))  -- Avoid revisiting nodes
    ),
    cycles AS (
        SELECT 
            waiter,
            holder,
            path,
            depth
        FROM wait_graph
        WHERE waiter = holder  -- Cycle detected when waiter equals holder
        OR waiter = ANY(path[1:array_length(path,1)-1])  -- Or waiter appears earlier in path
    )
    SELECT 
        COUNT(*) > 0,
        ARRAY_AGG(DISTINCT unnest) FILTER (WHERE unnest IS NOT NULL),
        string_agg(DISTINCT format('PID %s waiting in cycle of depth %s', waiter, depth), '; '),
        CASE 
            WHEN COUNT(*) > 0 THEN 'Potential deadlock detected - investigate immediately'
            ELSE 'No cycles detected in wait-for graph'
        END
    INTO cycle_found, participants, cycle_desc, recommended_action
    FROM (
        SELECT waiter, path, depth, unnest(path) as unnest
        FROM cycles
    ) cycle_data;
    
    RETURN QUERY SELECT 
        cycle_found,
        COALESCE(participants, ARRAY[]::INTEGER[]),
        COALESCE(cycle_desc, 'No deadlock cycles detected'),
        recommended_action;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            FALSE,
            ARRAY[]::INTEGER[],
            format('Error in cycle detection: %s', SQLERRM),
            'Review wait-for graph analysis logic';
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM detect_deadlock_cycles();
```

## Log-Based Deadlock Detection

### 1. PostgreSQL Log Analysis

```sql
-- Configure logging for deadlock detection
-- Add to postgresql.conf:
-- log_lock_waits = on
-- log_statement = 'ddl'  # or 'all' for complete logging
-- log_min_duration_statement = 1000  # Log statements taking > 1 second
-- deadlock_timeout = '1s'

-- Function to parse and analyze deadlock logs
CREATE OR REPLACE FUNCTION analyze_deadlock_logs(
    log_file_path TEXT DEFAULT '/var/log/postgresql/postgresql.log'
) RETURNS TABLE(
    log_analysis_category VARCHAR(40),
    finding TEXT,
    severity VARCHAR(15),
    recommendation TEXT
) AS $$
BEGIN
    -- Since we can't directly read log files in SQL, provide guidance
    RETURN QUERY VALUES
    ('Log Configuration Check',
     'Verify log_lock_waits and deadlock_timeout settings',
     'CRITICAL',
     'Ensure logging is properly configured to capture deadlock events'),
    
    ('Deadlock Pattern Analysis',
     'Look for "DETAIL: Process X waits for" messages in logs',
     'HIGH',
     'Parse logs for deadlock detection messages and frequency patterns'),
    
    ('Statement Context',
     'Identify SQL statements involved in deadlock scenarios',
     'HIGH',
     'Correlate deadlock events with specific application operations'),
    
    ('Timing Analysis',
     'Analyze deadlock occurrence patterns by time of day',
     'MEDIUM',
     'Identify peak deadlock periods to focus optimization efforts'),
    
    ('Application Correlation',
     'Map deadlocks to specific application modules or users',
     'MEDIUM',
     'Determine which application components need deadlock handling'),
    
    ('Recovery Tracking',
     'Monitor automatic deadlock resolution effectiveness',
     'LOW',
     'Verify that deadlock detection and recovery is working properly');
END;
$$ LANGUAGE plpgsql;

-- Create table to store deadlock events from logs
CREATE TABLE IF NOT EXISTS deadlock_events (
    id SERIAL PRIMARY KEY,
    detected_at TIMESTAMP NOT NULL,
    victim_pid INTEGER,
    victim_query TEXT,
    blocking_pids INTEGER[],
    lock_types TEXT[],
    resolution_time_ms INTEGER,
    application_name TEXT,
    database_name TEXT,
    parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to log deadlock events (called from application)
CREATE OR REPLACE FUNCTION log_deadlock_event(
    victim_pid INTEGER,
    victim_query TEXT,
    blocking_info JSONB DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    event_id INTEGER;
BEGIN
    INSERT INTO deadlock_events (
        detected_at,
        victim_pid,
        victim_query,
        blocking_pids,
        lock_types,
        application_name,
        database_name
    ) VALUES (
        CURRENT_TIMESTAMP,
        victim_pid,
        victim_query,
        COALESCE((blocking_info->>'blocking_pids')::TEXT, '{}')::INTEGER[],
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(blocking_info->'lock_types')), ARRAY[]::TEXT[]),
        current_setting('application_name'),
        current_database()
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_deadlock_logs();
```

### 2. Log Pattern Recognition

```sql
-- Analyze deadlock patterns from logged events
CREATE OR REPLACE FUNCTION analyze_deadlock_patterns(
    analysis_period INTERVAL DEFAULT '7 days'
) RETURNS TABLE(
    pattern_type VARCHAR(30),
    pattern_description TEXT,
    frequency INTEGER,
    severity_score DECIMAL(5,2),
    recommended_action TEXT
) AS $$
DECLARE
    total_deadlocks INTEGER;
    unique_applications INTEGER;
    peak_hour INTEGER;
BEGIN
    -- Get basic statistics
    SELECT COUNT(*) INTO total_deadlocks
    FROM deadlock_events
    WHERE detected_at > CURRENT_TIMESTAMP - analysis_period;
    
    SELECT COUNT(DISTINCT application_name) INTO unique_applications
    FROM deadlock_events
    WHERE detected_at > CURRENT_TIMESTAMP - analysis_period;
    
    SELECT EXTRACT(hour FROM detected_at) INTO peak_hour
    FROM deadlock_events
    WHERE detected_at > CURRENT_TIMESTAMP - analysis_period
    GROUP BY EXTRACT(hour FROM detected_at)
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Application-based patterns
    RETURN QUERY
    WITH app_deadlocks AS (
        SELECT 
            application_name,
            COUNT(*) as deadlock_count,
            AVG(array_length(blocking_pids, 1)) as avg_blocking_sessions
        FROM deadlock_events
        WHERE detected_at > CURRENT_TIMESTAMP - analysis_period
        AND application_name IS NOT NULL
        GROUP BY application_name
    )
    SELECT 
        'Application Pattern'::VARCHAR(30),
        format('%s application(s) experiencing deadlocks - %s most frequent', 
               unique_applications,
               (SELECT application_name FROM app_deadlocks ORDER BY deadlock_count DESC LIMIT 1)
        ),
        total_deadlocks,
        CASE 
            WHEN total_deadlocks > 50 THEN 95.0
            WHEN total_deadlocks > 20 THEN 75.0
            WHEN total_deadlocks > 5 THEN 50.0
            ELSE 25.0
        END::DECIMAL(5,2),
        CASE 
            WHEN unique_applications = 1 THEN 'Focus optimization on single application'
            WHEN unique_applications > 3 THEN 'System-wide deadlock prevention needed'
            ELSE 'Review application interaction patterns'
        END;
    
    -- Temporal patterns
    RETURN QUERY
    SELECT 
        'Temporal Pattern'::VARCHAR(30),
        format('Peak deadlock hour: %s:00 (analysis period: %s)', 
               COALESCE(peak_hour, 0), analysis_period),
        (SELECT COUNT(*) 
         FROM deadlock_events 
         WHERE detected_at > CURRENT_TIMESTAMP - analysis_period
         AND EXTRACT(hour FROM detected_at) = COALESCE(peak_hour, 0)),
        CASE 
            WHEN peak_hour BETWEEN 9 AND 17 THEN 80.0  -- Business hours
            WHEN peak_hour BETWEEN 18 AND 22 THEN 60.0  -- Evening
            ELSE 40.0  -- Off hours
        END::DECIMAL(5,2),
        CASE 
            WHEN peak_hour BETWEEN 9 AND 17 THEN 'Optimize business-hour transaction patterns'
            ELSE 'Investigate batch processing or maintenance conflicts'
        END;
    
    -- Query complexity patterns
    RETURN QUERY
    WITH query_patterns AS (
        SELECT 
            CASE 
                WHEN victim_query ILIKE '%UPDATE%' THEN 'UPDATE operations'
                WHEN victim_query ILIKE '%INSERT%' THEN 'INSERT operations'
                WHEN victim_query ILIKE '%DELETE%' THEN 'DELETE operations'
                WHEN victim_query ILIKE '%SELECT%FOR UPDATE%' THEN 'SELECT FOR UPDATE'
                ELSE 'Other operations'
            END as query_type,
            COUNT(*) as occurrence_count
        FROM deadlock_events
        WHERE detected_at > CURRENT_TIMESTAMP - analysis_period
        AND victim_query IS NOT NULL
        GROUP BY 1
    )
    SELECT 
        'Query Type Pattern'::VARCHAR(30),
        format('Most deadlock-prone: %s (%s occurrences)', 
               qp.query_type, qp.occurrence_count),
        qp.occurrence_count,
        (qp.occurrence_count * 100.0 / NULLIF(total_deadlocks, 0))::DECIMAL(5,2),
        format('Focus deadlock prevention on %s patterns', qp.query_type)
    FROM query_patterns qp
    ORDER BY qp.occurrence_count DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM analyze_deadlock_patterns('24 hours'::INTERVAL);
SELECT * FROM analyze_deadlock_patterns('7 days'::INTERVAL);
```

## Proactive Deadlock Detection

### 1. Early Warning System

```sql
-- Proactive deadlock risk assessment
CREATE OR REPLACE FUNCTION assess_deadlock_risk()
RETURNS TABLE(
    risk_factor VARCHAR(40),
    current_level VARCHAR(15),
    risk_score INTEGER,
    risk_description TEXT,
    mitigation_action TEXT
) AS $$
DECLARE
    concurrent_transactions INTEGER;
    long_running_transactions INTEGER;
    lock_wait_sessions INTEGER;
    recent_deadlocks INTEGER;
    high_contention_tables TEXT[];
BEGIN
    -- Gather risk indicators
    SELECT COUNT(DISTINCT pid) INTO concurrent_transactions
    FROM pg_stat_activity 
    WHERE state = 'active' AND xact_start IS NOT NULL;
    
    SELECT COUNT(*) INTO long_running_transactions
    FROM pg_stat_activity
    WHERE state = 'active' 
    AND xact_start < CURRENT_TIMESTAMP - INTERVAL '30 seconds';
    
    SELECT COUNT(*) INTO lock_wait_sessions
    FROM pg_locks WHERE NOT granted;
    
    SELECT COUNT(*) INTO recent_deadlocks
    FROM deadlock_events
    WHERE detected_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes';
    
    -- Identify high-contention tables
    SELECT ARRAY_AGG(schemaname || '.' || tablename) INTO high_contention_tables
    FROM (
        SELECT schemaname, tablename, COUNT(*) as lock_count
        FROM pg_locks l
        JOIN pg_stat_user_tables t ON l.relation = t.relid
        WHERE NOT granted
        GROUP BY schemaname, tablename
        HAVING COUNT(*) >= 3
        ORDER BY COUNT(*) DESC
        LIMIT 5
    ) contested_tables;
    
    -- Return risk assessment
    RETURN QUERY SELECT 
        'Concurrent Transactions'::VARCHAR(40),
        CASE 
            WHEN concurrent_transactions < 10 THEN 'LOW'
            WHEN concurrent_transactions < 25 THEN 'MEDIUM'
            WHEN concurrent_transactions < 50 THEN 'HIGH'
            ELSE 'VERY HIGH'
        END::VARCHAR(15),
        LEAST(concurrent_transactions * 2, 100)::INTEGER,
        format('%s concurrent active transactions', concurrent_transactions),
        CASE 
            WHEN concurrent_transactions > 50 THEN 'Implement connection pooling'
            WHEN concurrent_transactions > 25 THEN 'Monitor transaction patterns'
            ELSE 'Current level acceptable'
        END;
    
    RETURN QUERY SELECT 
        'Long-Running Transactions'::VARCHAR(40),
        CASE 
            WHEN long_running_transactions = 0 THEN 'GOOD'
            WHEN long_running_transactions < 3 THEN 'CAUTION'
            WHEN long_running_transactions < 8 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::VARCHAR(15),
        LEAST(long_running_transactions * 15, 100)::INTEGER,
        format('%s transactions running >30 seconds', long_running_transactions),
        CASE 
            WHEN long_running_transactions > 5 THEN 'Break down long transactions'
            WHEN long_running_transactions > 0 THEN 'Monitor for optimization opportunities'
            ELSE 'Good transaction hygiene'
        END;
    
    RETURN QUERY SELECT 
        'Current Lock Waits'::VARCHAR(40),
        CASE 
            WHEN lock_wait_sessions = 0 THEN 'GOOD'
            WHEN lock_wait_sessions < 5 THEN 'CAUTION'
            WHEN lock_wait_sessions < 15 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::VARCHAR(15),
        LEAST(lock_wait_sessions * 10, 100)::INTEGER,
        format('%s sessions waiting for locks', lock_wait_sessions),
        CASE 
            WHEN lock_wait_sessions > 10 THEN 'Investigate blocking immediately'
            WHEN lock_wait_sessions > 0 THEN 'Monitor for deadlock development'
            ELSE 'No current lock contention'
        END;
    
    RETURN QUERY SELECT 
        'Recent Deadlock Activity'::VARCHAR(40),
        CASE 
            WHEN recent_deadlocks = 0 THEN 'GOOD'
            WHEN recent_deadlocks = 1 THEN 'CAUTION'
            WHEN recent_deadlocks < 5 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::VARCHAR(15),
        LEAST(recent_deadlocks * 25, 100)::INTEGER,
        format('%s deadlocks in last 5 minutes', recent_deadlocks),
        CASE 
            WHEN recent_deadlocks > 3 THEN 'Implement immediate deadlock prevention'
            WHEN recent_deadlocks > 0 THEN 'Review recent deadlock patterns'
            ELSE 'No recent deadlock activity'
        END;
    
    RETURN QUERY SELECT 
        'Table Contention'::VARCHAR(40),
        CASE 
            WHEN array_length(high_contention_tables, 1) IS NULL THEN 'GOOD'
            WHEN array_length(high_contention_tables, 1) <= 2 THEN 'CAUTION'
            WHEN array_length(high_contention_tables, 1) <= 5 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::VARCHAR(15),
        COALESCE(array_length(high_contention_tables, 1) * 20, 0)::INTEGER,
        format('%s tables with high lock contention: %s', 
               COALESCE(array_length(high_contention_tables, 1), 0),
               COALESCE(array_to_string(high_contention_tables, ', '), 'None')),
        CASE 
            WHEN array_length(high_contention_tables, 1) > 3 THEN 'Optimize high-contention table access'
            WHEN array_length(high_contention_tables, 1) > 0 THEN 'Review table-specific lock patterns'
            ELSE 'No high-contention tables detected'
        END;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM assess_deadlock_risk() ORDER BY risk_score DESC;
```

### 2. Automated Deadlock Alerting

```sql
-- Automated alerting system for deadlock detection
CREATE OR REPLACE FUNCTION deadlock_alert_system()
RETURNS TABLE(
    alert_timestamp TIMESTAMP,
    alert_level VARCHAR(10),
    alert_category VARCHAR(30),
    alert_message TEXT,
    suggested_action TEXT,
    alert_data JSONB
) AS $$
DECLARE
    alert_time TIMESTAMP := CURRENT_TIMESTAMP;
    risk_assessment RECORD;
    lock_analysis RECORD;
    recent_events INTEGER;
BEGIN
    -- Check recent deadlock events
    SELECT COUNT(*) INTO recent_events
    FROM deadlock_events
    WHERE detected_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes';
    
    -- Critical alert: Multiple recent deadlocks
    IF recent_events >= 3 THEN
        RETURN QUERY SELECT 
            alert_time,
            'CRITICAL'::VARCHAR(10),
            'Deadlock Spike'::VARCHAR(30),
            format('Multiple deadlocks detected: %s events in 10 minutes', recent_events)::TEXT,
            'Immediate investigation required - check for deadlock patterns'::TEXT,
            jsonb_build_object(
                'deadlock_count', recent_events,
                'time_window', '10 minutes',
                'threshold_exceeded', true
            );
    END IF;
    
    -- Warning alert: Single recent deadlock
    IF recent_events = 1 THEN
        RETURN QUERY SELECT 
            alert_time,
            'WARNING'::VARCHAR(10),
            'Deadlock Detected'::VARCHAR(30),
            'Single deadlock event detected in last 10 minutes'::TEXT,
            'Monitor for additional deadlocks and review transaction patterns'::TEXT,
            jsonb_build_object(
                'deadlock_count', recent_events,
                'time_window', '10 minutes',
                'monitoring_recommended', true
            );
    END IF;
    
    -- Check for high lock contention
    FOR lock_analysis IN 
        SELECT * FROM monitor_locks_for_deadlocks() 
        WHERE concern_level IN ('WARNING', 'CRITICAL')
    LOOP
        RETURN QUERY SELECT 
            alert_time,
            CASE 
                WHEN lock_analysis.concern_level = 'CRITICAL' THEN 'CRITICAL'
                ELSE 'WARNING'
            END::VARCHAR(10),
            'Lock Contention'::VARCHAR(30),
            format('%s: %s (Current: %s)', 
                   lock_analysis.monitoring_category,
                   lock_analysis.description,
                   lock_analysis.current_count)::TEXT,
            lock_analysis.immediate_action::TEXT,
            jsonb_build_object(
                'category', lock_analysis.monitoring_category,
                'current_value', lock_analysis.current_count,
                'concern_level', lock_analysis.concern_level
            );
    END LOOP;
    
    -- Check risk assessment
    FOR risk_assessment IN 
        SELECT * FROM assess_deadlock_risk() 
        WHERE risk_score > 75
    LOOP
        RETURN QUERY SELECT 
            alert_time,
            'WARNING'::VARCHAR(10),
            'High Deadlock Risk'::VARCHAR(30),
            format('High risk factor detected: %s (%s level, score: %s)', 
                   risk_assessment.risk_factor,
                   risk_assessment.current_level,
                   risk_assessment.risk_score)::TEXT,
            risk_assessment.mitigation_action::TEXT,
            jsonb_build_object(
                'risk_factor', risk_assessment.risk_factor,
                'risk_level', risk_assessment.current_level,
                'risk_score', risk_assessment.risk_score
            );
    END LOOP;
    
    -- Info alert: System healthy
    IF recent_events = 0 AND NOT EXISTS (
        SELECT 1 FROM monitor_locks_for_deadlocks() 
        WHERE concern_level IN ('WARNING', 'CRITICAL')
    ) THEN
        RETURN QUERY SELECT 
            alert_time,
            'INFO'::VARCHAR(10),
            'System Status'::VARCHAR(30),
            'No deadlocks or high-risk conditions detected'::TEXT,
            'Continue normal monitoring'::TEXT,
            jsonb_build_object(
                'system_status', 'healthy',
                'monitoring_active', true
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Usage for monitoring dashboard
SELECT * FROM deadlock_alert_system();

-- Create monitoring view for dashboards
CREATE OR REPLACE VIEW deadlock_monitoring_dashboard AS
SELECT 
    'Deadlock Detection Status' as dashboard_section,
    jsonb_build_object(
        'recent_deadlocks', (
            SELECT COUNT(*) FROM deadlock_events 
            WHERE detected_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
        ),
        'active_locks', (
            SELECT COUNT(*) FROM pg_locks
        ),
        'waiting_locks', (
            SELECT COUNT(*) FROM pg_locks WHERE NOT granted
        ),
        'long_transactions', (
            SELECT COUNT(*) FROM pg_stat_activity
            WHERE state = 'active' 
            AND xact_start < CURRENT_TIMESTAMP - INTERVAL '30 seconds'
        ),
        'detection_config', (
            SELECT jsonb_object_agg(name, setting)
            FROM pg_settings
            WHERE name IN ('deadlock_timeout', 'log_lock_waits')
        ),
        'last_updated', CURRENT_TIMESTAMP
    ) as dashboard_data;

-- Usage
SELECT * FROM deadlock_monitoring_dashboard;
```

## Tools and Extensions for Deadlock Detection

### 1. Third-Party Monitoring Solutions

```sql
-- Guide for external deadlock monitoring tools
CREATE OR REPLACE FUNCTION deadlock_monitoring_tools_guide()
RETURNS TABLE(
    tool_category VARCHAR(30),
    tool_name VARCHAR(40),
    detection_capability VARCHAR(20),
    setup_complexity VARCHAR(15),
    use_case TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Built-in PostgreSQL', 'pg_stat_activity + pg_locks',
     'Real-time', 'LOW', 'Basic deadlock monitoring and analysis'),
    
    ('PostgreSQL Extensions', 'pg_stat_statements',
     'Historical', 'LOW', 'Query performance and deadlock correlation'),
    
    ('Log Analysis', 'pgBadger',
     'Historical', 'MEDIUM', 'Comprehensive log analysis including deadlocks'),
    
    ('Monitoring Platforms', 'Prometheus + postgres_exporter',
     'Real-time', 'HIGH', 'Metrics collection and alerting'),
    
    ('APM Solutions', 'New Relic Database Monitoring',
     'Real-time', 'MEDIUM', 'Application performance and database monitoring'),
    
    ('Database Tools', 'pgAdmin with activity monitor',
     'Real-time', 'LOW', 'GUI-based real-time monitoring'),
    
    ('Custom Solutions', 'pg_stat_monitor (Percona)',
     'Real-time', 'MEDIUM', 'Enhanced statistics and lock monitoring'),
    
    ('Commercial Tools', 'DataDog Database Monitoring',
     'Real-time', 'MEDIUM', 'Enterprise monitoring with deadlock tracking');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM deadlock_monitoring_tools_guide() ORDER BY setup_complexity, detection_capability;
```

## Summary

**PostgreSQL Deadlock Detection Methods:**

**Automatic Detection:**
- **Built-in Detector**: PostgreSQL automatically detects deadlocks every `deadlock_timeout`
- **Wait-for Graph**: Analyzes circular dependencies between transactions
- **Victim Selection**: Automatically chooses transaction to abort (SQLSTATE 40P01)
- **Configuration**: `deadlock_timeout`, `log_lock_waits`, `log_statement`

**Real-Time Monitoring:**
- **pg_locks Analysis**: Monitor active locks and waiting sessions
- **Lock Dependency Tracking**: Identify blocking relationships between transactions
- **Cycle Detection**: Proactive identification of circular wait conditions
- **Risk Assessment**: Evaluate current system state for deadlock probability

**Log-Based Detection:**
- **PostgreSQL Logs**: Parse log files for deadlock detection messages
- **Pattern Analysis**: Identify deadlock trends and recurring scenarios
- **Application Correlation**: Map deadlocks to specific application operations
- **Historical Tracking**: Maintain deadlock event history for analysis

**Proactive Detection:**
- **Early Warning**: Monitor risk factors before deadlocks occur
- **Automated Alerting**: Real-time alerts for deadlock conditions
- **Trend Analysis**: Identify increasing deadlock patterns
- **Performance Impact**: Assess deadlock effects on system performance

**Key Detection Techniques:**
- Monitor `pg_stat_activity` for long-running transactions
- Analyze `pg_locks` for waiting and granted lock patterns
- Configure appropriate logging to capture deadlock events
- Implement real-time alerting for immediate response
- Use wait-for graph analysis to detect potential cycles

**Best Practices:**
- Configure `deadlock_timeout = '1s'` for quick detection
- Enable `log_lock_waits = on` for detailed logging
- Monitor lock contention patterns regularly
- Implement automated alerting systems
- Correlate deadlocks with application operations
- Maintain historical deadlock data for trend analysis

**Tools and Integration:**
- Use built-in PostgreSQL views (`pg_stat_activity`, `pg_locks`)
- Implement custom monitoring functions
- Integrate with external monitoring platforms
- Parse PostgreSQL logs for comprehensive analysis
- Set up real-time dashboards for operations teams

Effective deadlock detection combines PostgreSQL's built-in automatic detection with comprehensive monitoring and alerting systems to ensure rapid identification and resolution of deadlock conditions in production environments.