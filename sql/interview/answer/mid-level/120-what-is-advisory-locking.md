# 120. What is advisory locking?

**Advisory locking** is PostgreSQL's application-level locking mechanism that allows applications to coordinate access to resources using custom lock identifiers. Unlike traditional table and row locks that automatically protect database objects, advisory locks are explicitly managed by the application and don't automatically lock any database objects—they only prevent other sessions from acquiring the same advisory lock.

## Core Concepts

### Application-Controlled Coordination
Advisory locks provide a coordination mechanism where:
- **Custom Lock Keys**: Applications define their own lock identifiers
- **Voluntary Coordination**: Applications must choose to respect the locks
- **No Automatic Protection**: Locks don't automatically protect database objects
- **Session or Transaction Scope**: Different duration options available

### Key Characteristics
- **Highly Performant**: Fast acquisition and release
- **Deadlock Detection**: Integrated with PostgreSQL's deadlock detection
- **Hierarchical Keys**: Support for single or dual-key identification
- **Shared/Exclusive Modes**: Both shared and exclusive locking available

## Advisory Lock Functions

### Session-Scoped Advisory Locks

```sql
-- Comprehensive demonstration of session-scoped advisory locks
CREATE OR REPLACE FUNCTION demonstrate_session_advisory_locks()
RETURNS TABLE(
    function_name VARCHAR(40),
    lock_type VARCHAR(20),
    behavior VARCHAR(20),
    use_cases TEXT[],
    key_characteristics TEXT,
    example_usage TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('pg_advisory_lock(key)', 'EXCLUSIVE', 'BLOCKING',
     ARRAY[
         'Application-level mutexes',
         'Critical section protection',
         'Resource pool management',
         'Singleton process enforcement'
     ],
     'Blocks until lock acquired, held until explicitly released or session ends',
     'SELECT pg_advisory_lock(12345); -- Process exclusive work'),
    
    ('pg_try_advisory_lock(key)', 'EXCLUSIVE', 'NON_BLOCKING',
     ARRAY[
         'Optional exclusive operations',
         'Fallback processing patterns',
         'Non-blocking coordination',
         'Performance-critical paths'
     ],
     'Returns immediately with true/false, no waiting',
     'SELECT pg_try_advisory_lock(12345); -- Returns false if already locked'),
    
    ('pg_advisory_lock_shared(key)', 'SHARED', 'BLOCKING',
     ARRAY[
         'Shared resource access',
         'Reader-writer coordination',
         'Multi-reader scenarios',
         'Shared cache management'
     ],
     'Multiple sessions can hold shared lock simultaneously',
     'SELECT pg_advisory_lock_shared(12345); -- Allow multiple readers'),
    
    ('pg_try_advisory_lock_shared(key)', 'SHARED', 'NON_BLOCKING',
     ARRAY[
         'Non-blocking shared access',
         'Optional shared operations',
         'High-concurrency readers',
         'Conditional shared processing'
     ],
     'Non-blocking shared lock acquisition',
     'SELECT pg_try_advisory_lock_shared(12345); -- Immediate shared access'),
    
    ('pg_advisory_unlock(key)', 'RELEASE', 'EXPLICIT',
     ARRAY[
         'Manual lock release',
         'Early lock release',
         'Error recovery',
         'Resource cleanup'
     ],
     'Explicitly releases held advisory lock',
     'SELECT pg_advisory_unlock(12345); -- Release exclusive lock'),
    
    ('pg_advisory_unlock_shared(key)', 'RELEASE', 'EXPLICIT',
     ARRAY[
         'Shared lock release',
         'Reader coordination',
         'Shared resource cleanup',
         'Multi-reader coordination'
     ],
     'Explicitly releases shared advisory lock',
     'SELECT pg_advisory_unlock_shared(12345); -- Release shared lock'),
    
    ('pg_advisory_unlock_all()', 'RELEASE', 'BULK',
     ARRAY[
         'Emergency cleanup',
         'Session reset',
         'Error recovery',
         'Batch release'
     ],
     'Releases all advisory locks held by current session',
     'SELECT pg_advisory_unlock_all(); -- Clean slate');
END;
$$ LANGUAGE plpgsql;

-- Practical example: Application deployment coordination
CREATE OR REPLACE FUNCTION coordinate_deployment(
    application_name TEXT,
    deployment_timeout_seconds INTEGER DEFAULT 300
) RETURNS TABLE(
    deployment_status VARCHAR(20),
    lock_acquired BOOLEAN,
    deployment_id BIGINT,
    message TEXT,
    next_action TEXT
) AS $$
DECLARE
    deployment_key BIGINT;
    lock_success BOOLEAN;
    deployment_identifier BIGINT;
BEGIN
    -- Generate consistent lock key from application name
    deployment_key := hashtext(application_name || '_deployment');
    deployment_identifier := EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT;
    
    -- Try to acquire deployment lock
    SELECT pg_try_advisory_lock(deployment_key) INTO lock_success;
    
    IF lock_success THEN
        RETURN QUERY SELECT 
            'LOCK_ACQUIRED'::VARCHAR(20),
            TRUE,
            deployment_identifier,
            format('Deployment lock acquired for %s', application_name)::TEXT,
            'Proceed with deployment operations'::TEXT;
        
        -- Simulate deployment work (in real scenario, this would be actual deployment)
        PERFORM pg_sleep(1);  -- Simulate deployment time
        
        -- Note: In real implementation, lock would be released after deployment
        -- SELECT pg_advisory_unlock(deployment_key);
        
        RETURN QUERY SELECT 
            'DEPLOYMENT_COMPLETE'::VARCHAR(20),
            TRUE,
            deployment_identifier,
            format('Deployment completed for %s', application_name)::TEXT,
            'Release deployment lock'::TEXT;
    ELSE
        RETURN QUERY SELECT 
            'LOCK_BUSY'::VARCHAR(20),
            FALSE,
            0::BIGINT,
            format('Another deployment is in progress for %s', application_name)::TEXT,
            'Wait or implement queue mechanism'::TEXT;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ensure lock is released on error
        PERFORM pg_advisory_unlock(deployment_key);
        RETURN QUERY SELECT 
            'ERROR'::VARCHAR(20),
            FALSE,
            0::BIGINT,
            format('Deployment error: %s', SQLERRM)::TEXT,
            'Check logs and retry'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_session_advisory_locks();
SELECT * FROM coordinate_deployment('my_web_app');
```

### Transaction-Scoped Advisory Locks

```sql
-- Transaction-scoped advisory lock demonstration
CREATE OR REPLACE FUNCTION demonstrate_transaction_advisory_locks()
RETURNS TABLE(
    function_name VARCHAR(40),
    scope VARCHAR(15),
    auto_cleanup BOOLEAN,
    performance_characteristics TEXT,
    ideal_use_cases TEXT[],
    example_scenario TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('pg_advisory_xact_lock(key)', 'TRANSACTION', TRUE,
     'Fastest acquisition, automatic cleanup on commit/rollback',
     ARRAY[
         'Transaction-bounded coordination',
         'Batch processing coordination',
         'Short-lived exclusive operations',
         'Database transaction integration'
     ],
     'Coordinate related database operations within single transaction'),
    
    ('pg_try_advisory_xact_lock(key)', 'TRANSACTION', TRUE,
     'Non-blocking with automatic cleanup, ideal for high-throughput',
     ARRAY[
         'High-concurrency applications',
         'Optional transaction coordination',
         'Performance-critical transaction paths',
         'Conditional batch processing'
     ],
     'Try to coordinate transaction work, skip if already in progress'),
    
    ('pg_advisory_xact_lock_shared(key)', 'TRANSACTION', TRUE,
     'Shared coordination with automatic cleanup',
     ARRAY[
         'Multi-reader transaction coordination',
         'Shared resource validation',
         'Concurrent batch processing',
         'Read-heavy transaction patterns'
     ],
     'Multiple transactions accessing shared resources simultaneously'),
    
    ('pg_try_advisory_xact_lock_shared(key)', 'TRANSACTION', TRUE,
     'Non-blocking shared coordination with automatic cleanup',
     ARRAY[
         'High-throughput shared operations',
         'Optional shared coordination',
         'Concurrent validation processes',
         'Performance-optimized readers'
     ],
     'Fast shared access for transaction-scoped operations');
END;
$$ LANGUAGE plpgsql;

-- Practical example: Coordinated batch processing
CREATE OR REPLACE FUNCTION coordinated_batch_processing(
    batch_identifier TEXT,
    worker_id INTEGER,
    max_concurrent_workers INTEGER DEFAULT 3
) RETURNS TABLE(
    worker_status VARCHAR(20),
    batch_lock_acquired BOOLEAN,
    worker_lock_acquired BOOLEAN,
    records_processed INTEGER,
    processing_notes TEXT
) AS $$
DECLARE
    batch_key BIGINT;
    worker_key BIGINT;
    batch_lock_success BOOLEAN;
    worker_lock_success BOOLEAN;
    processed_count INTEGER := 0;
BEGIN
    -- Generate lock keys
    batch_key := hashtext('batch_' || batch_identifier);
    worker_key := batch_key + worker_id;  -- Unique worker key
    
    BEGIN
        -- Try to acquire batch coordination lock (shared)
        SELECT pg_try_advisory_xact_lock_shared(batch_key) INTO batch_lock_success;
        
        IF NOT batch_lock_success THEN
            RETURN QUERY SELECT 
                'BATCH_BUSY'::VARCHAR(20),
                FALSE, FALSE, 0,
                'Batch processing slot not available'::TEXT;
            RETURN;
        END IF;
        
        -- Try to acquire worker-specific lock (exclusive)
        SELECT pg_try_advisory_xact_lock(worker_key) INTO worker_lock_success;
        
        IF NOT worker_lock_success THEN
            RETURN QUERY SELECT 
                'WORKER_CONFLICT'::VARCHAR(20),
                TRUE, FALSE, 0,
                format('Worker %s already processing this batch', worker_id)::TEXT;
            RETURN;
        END IF;
        
        -- Both locks acquired - proceed with processing
        RETURN QUERY SELECT 
            'PROCESSING'::VARCHAR(20),
            TRUE, TRUE, 0,
            format('Worker %s starting batch %s processing', worker_id, batch_identifier)::TEXT;
        
        -- Simulate batch work (in real scenario, this would be actual data processing)
        FOR i IN 1..10 LOOP
            processed_count := processed_count + 1;
            -- Simulate processing time
            PERFORM pg_sleep(0.1);
        END LOOP;
        
        RETURN QUERY SELECT 
            'COMPLETED'::VARCHAR(20),
            TRUE, TRUE, processed_count,
            format('Worker %s completed processing %s records', worker_id, processed_count)::TEXT;
        
        -- Locks automatically released at transaction end
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'ERROR'::VARCHAR(20),
                batch_lock_success, worker_lock_success, processed_count,
                format('Processing error: %s', SQLERRM)::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_transaction_advisory_locks();
-- Example: Multiple workers processing same batch
-- SELECT * FROM coordinated_batch_processing('batch_001', 1);
-- SELECT * FROM coordinated_batch_processing('batch_001', 2);
```

## Practical Use Cases and Patterns

### Common Application Patterns

```sql
-- Comprehensive use case patterns for advisory locks
CREATE OR REPLACE FUNCTION advisory_lock_use_cases()
RETURNS TABLE(
    pattern_name VARCHAR(50),
    pattern_type VARCHAR(30),
    coordination_level VARCHAR(20),
    implementation_complexity VARCHAR(15),
    business_scenarios TEXT[],
    technical_implementation TEXT,
    scalability_considerations TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Singleton Process Pattern', 'EXCLUSIVE_COORDINATION', 'APPLICATION',
     'SIMPLE',
     ARRAY[
         'Scheduled job coordination',
         'Data migration processes',
         'Report generation',
         'Cache warming operations'
     ],
     'Use pg_try_advisory_lock() to ensure only one instance runs',
     'Excellent - prevents resource conflicts and duplicate work'),
    
    ('Leader Election Pattern', 'EXCLUSIVE_COORDINATION', 'CLUSTER',
     'MODERATE',
     ARRAY[
         'Distributed system coordination',
         'Primary node selection',
         'Master-slave coordination',
         'Service discovery'
     ],
     'Combine advisory locks with heartbeat mechanism',
     'Good - requires additional health monitoring'),
    
    ('Resource Pool Management', 'SHARED_COORDINATION', 'APPLICATION',
     'MODERATE',
     ARRAY[
         'Connection pool coordination',
         'Shared cache management',
         'Limited resource allocation',
         'Rate limiting implementation'
     ],
     'Use shared locks for readers, exclusive for resource allocation',
     'Very good - enables efficient resource utilization'),
    
    ('Feature Flag Coordination', 'EXCLUSIVE_COORDINATION', 'DEPLOYMENT',
     'SIMPLE',
     ARRAY[
         'Rolling deployments',
         'Feature rollout coordination',
         'Configuration updates',
         'A/B test coordination'
     ],
     'Lock feature flag changes during deployment windows',
     'Excellent - prevents configuration conflicts'),
    
    ('Data Processing Queue', 'EXCLUSIVE_COORDINATION', 'JOB',
     'MODERATE',
     ARRAY[
         'Job queue processing',
         'Work distribution',
         'Batch processing',
         'Event processing'
     ],
     'Use SKIP LOCKED pattern with advisory locks for work coordination',
     'Excellent - enables parallel processing without conflicts'),
    
    ('Cache Refresh Coordination', 'SHARED_COORDINATION', 'PERFORMANCE',
     'SIMPLE',
     ARRAY[
         'Application cache updates',
         'Materialized view refresh',
         'Precomputed data updates',
         'Search index updates'
     ],
     'Coordinate cache updates while allowing reads',
     'Good - prevents cache stampede while maintaining availability'),
    
    ('Critical Section Protection', 'EXCLUSIVE_COORDINATION', 'ALGORITHM',
     'SIMPLE',
     ARRAY[
         'Counter updates',
         'Sequence generation',
         'State machine transitions',
         'Resource reservation'
     ],
     'Wrap critical code sections with advisory locks',
     'Good - simpler than application-level mutexes'),
    
    ('Database Migration Coordination', 'EXCLUSIVE_COORDINATION', 'SCHEMA',
     'COMPLEX',
     ARRAY[
         'Schema migration coordination',
         'Data migration processes',
         'Multi-step deployments',
         'Zero-downtime updates'
     ],
     'Coordinate complex migration steps across multiple connections',
     'Moderate - requires careful lock hierarchy design');
END;
$$ LANGUAGE plpgsql;

-- Implementation examples for common patterns
CREATE OR REPLACE FUNCTION implement_singleton_pattern(
    process_name TEXT,
    max_runtime_minutes INTEGER DEFAULT 60
) RETURNS TABLE(
    execution_status VARCHAR(20),
    process_started BOOLEAN,
    lock_key BIGINT,
    estimated_completion TIMESTAMP,
    coordination_notes TEXT
) AS $$
DECLARE
    singleton_key BIGINT;
    lock_acquired BOOLEAN;
    completion_time TIMESTAMP;
BEGIN
    -- Generate consistent key for the process
    singleton_key := hashtext('singleton_' || process_name);
    completion_time := CURRENT_TIMESTAMP + (max_runtime_minutes || ' minutes')::INTERVAL;
    
    -- Try to acquire singleton lock
    SELECT pg_try_advisory_lock(singleton_key) INTO lock_acquired;
    
    IF lock_acquired THEN
        RETURN QUERY SELECT 
            'STARTED'::VARCHAR(20),
            TRUE,
            singleton_key,
            completion_time,
            format('Singleton process %s started successfully', process_name)::TEXT;
        
        -- Simulate process work
        PERFORM pg_sleep(2);  -- Replace with actual work
        
        -- Release lock when done (important!)
        PERFORM pg_advisory_unlock(singleton_key);
        
        RETURN QUERY SELECT 
            'COMPLETED'::VARCHAR(20),
            TRUE,
            singleton_key,
            CURRENT_TIMESTAMP,
            format('Singleton process %s completed and lock released', process_name)::TEXT;
    ELSE
        RETURN QUERY SELECT 
            'ALREADY_RUNNING'::VARCHAR(20),
            FALSE,
            singleton_key,
            NULL::TIMESTAMP,
            format('Another instance of %s is already running', process_name)::TEXT;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Always release lock on error
        PERFORM pg_advisory_unlock(singleton_key);
        RETURN QUERY SELECT 
            'ERROR'::VARCHAR(20),
            FALSE,
            singleton_key,
            NULL::TIMESTAMP,
            format('Process error: %s', SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Cache refresh coordination example
CREATE OR REPLACE FUNCTION coordinate_cache_refresh(
    cache_name TEXT,
    refresh_timeout_seconds INTEGER DEFAULT 300
) RETURNS TABLE(
    refresh_status VARCHAR(20),
    cache_key BIGINT,
    refresh_role VARCHAR(10),
    operation_result TEXT,
    performance_notes TEXT
) AS $$
DECLARE
    cache_key_id BIGINT;
    refresh_lock_acquired BOOLEAN;
    read_lock_acquired BOOLEAN;
BEGIN
    cache_key_id := hashtext('cache_' || cache_name);
    
    -- Try to acquire exclusive refresh lock
    SELECT pg_try_advisory_lock(cache_key_id) INTO refresh_lock_acquired;
    
    IF refresh_lock_acquired THEN
        -- We're the refresher
        RETURN QUERY SELECT 
            'REFRESHING'::VARCHAR(20),
            cache_key_id,
            'WRITER'::VARCHAR(10),
            format('Starting cache refresh for %s', cache_name)::TEXT,
            'This process will update the cache'::TEXT;
        
        -- Simulate cache refresh work
        PERFORM pg_sleep(1);
        
        -- Release refresh lock
        PERFORM pg_advisory_unlock(cache_key_id);
        
        RETURN QUERY SELECT 
            'COMPLETED'::VARCHAR(20),
            cache_key_id,
            'WRITER'::VARCHAR(10),
            format('Cache refresh completed for %s', cache_name)::TEXT,
            'Other processes can now use updated cache'::TEXT;
    ELSE
        -- Try to acquire shared read lock to use existing cache
        SELECT pg_try_advisory_lock_shared(cache_key_id) INTO read_lock_acquired;
        
        IF read_lock_acquired THEN
            RETURN QUERY SELECT 
                'USING_CACHE'::VARCHAR(20),
                cache_key_id,
                'READER'::VARCHAR(10),
                format('Using existing cache for %s while refresh in progress', cache_name)::TEXT,
                'Multiple readers can access cache simultaneously'::TEXT;
            
            -- Release shared lock
            PERFORM pg_advisory_unlock_shared(cache_key_id);
        ELSE
            RETURN QUERY SELECT 
                'WAIT_REQUIRED'::VARCHAR(20),
                cache_key_id,
                'WAITER'::VARCHAR(10),
                format('Cache %s is being refreshed, consider retry or fallback', cache_name)::TEXT,
                'Implement retry logic or use stale cache'::TEXT;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM advisory_lock_use_cases() ORDER BY pattern_type, pattern_name;
SELECT * FROM implement_singleton_pattern('daily_report_generator');
SELECT * FROM coordinate_cache_refresh('user_permissions_cache');
```

## Advanced Advisory Lock Techniques

### Hierarchical Lock Coordination

```sql
-- Advanced advisory lock patterns and hierarchical coordination
CREATE OR REPLACE FUNCTION demonstrate_hierarchical_locking()
RETURNS TABLE(
    hierarchy_level INTEGER,
    lock_description VARCHAR(50),
    lock_key_strategy TEXT,
    coordination_benefit TEXT,
    implementation_example TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    (1, 'Global Application Lock',
     'Single application-wide lock key',
     'Prevents conflicting application-wide operations',
     'pg_advisory_lock(hashtext(''app_maintenance''))'),
    
    (2, 'Service-Level Lock',
     'Service or module specific lock keys',
     'Allows concurrent operations across different services',
     'pg_advisory_lock(hashtext(''service_'' || service_name))'),
    
    (3, 'Resource-Level Lock',
     'Specific resource or data partition locks',
     'Fine-grained coordination for specific resources',
     'pg_advisory_lock(hashtext(''resource_'' || resource_id))'),
    
    (4, 'Operation-Level Lock',
     'Operation-specific coordination within resource',
     'Allows different operations on same resource',
     'pg_advisory_lock(hash_combine(resource_id, operation_type))'),
    
    (5, 'Instance-Level Lock',
     'Individual process or worker coordination',
     'Worker-level coordination for parallel processing',
     'pg_advisory_lock(hash_combine(base_key, worker_id))');
END;
$$ LANGUAGE plpgsql;

-- Function to implement hierarchical lock patterns
CREATE OR REPLACE FUNCTION hierarchical_lock_example(
    application_name TEXT,
    service_name TEXT,
    resource_id INTEGER,
    operation_type VARCHAR(20)
) RETURNS TABLE(
    lock_level VARCHAR(20),
    lock_key BIGINT,
    lock_acquired BOOLEAN,
    hierarchy_position INTEGER,
    coordination_scope TEXT
) AS $$
DECLARE
    app_key BIGINT;
    service_key BIGINT;
    resource_key BIGINT;
    operation_key BIGINT;
    app_lock BOOLEAN;
    service_lock BOOLEAN;
    resource_lock BOOLEAN;
    operation_lock BOOLEAN;
BEGIN
    -- Generate hierarchical lock keys
    app_key := hashtext('app_' || application_name);
    service_key := hashtext('service_' || application_name || '_' || service_name);
    resource_key := hashtext('resource_' || service_name || '_' || resource_id::TEXT);
    operation_key := hashtext('op_' || resource_id::TEXT || '_' || operation_type);
    
    -- Try to acquire locks from most general to most specific
    SELECT pg_try_advisory_lock_shared(app_key) INTO app_lock;
    RETURN QUERY SELECT 'APPLICATION'::VARCHAR(20), app_key, app_lock, 1,
        'Application-wide coordination'::TEXT;
    
    IF app_lock THEN
        SELECT pg_try_advisory_lock_shared(service_key) INTO service_lock;
        RETURN QUERY SELECT 'SERVICE'::VARCHAR(20), service_key, service_lock, 2,
            format('Service %s coordination', service_name)::TEXT;
        
        IF service_lock THEN
            SELECT pg_try_advisory_lock_shared(resource_key) INTO resource_lock;
            RETURN QUERY SELECT 'RESOURCE'::VARCHAR(20), resource_key, resource_lock, 3,
                format('Resource %s coordination', resource_id)::TEXT;
            
            IF resource_lock THEN
                SELECT pg_try_advisory_lock(operation_key) INTO operation_lock;
                RETURN QUERY SELECT 'OPERATION'::VARCHAR(20), operation_key, operation_lock, 4,
                    format('%s operation coordination', operation_type)::TEXT;
            END IF;
        END IF;
    END IF;
    
    -- Note: In production, implement proper cleanup logic
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM demonstrate_hierarchical_locking();
SELECT * FROM hierarchical_lock_example('ecommerce', 'inventory', 12345, 'update');
```

## Monitoring and Troubleshooting

### Advisory Lock Monitoring

```sql
-- Comprehensive advisory lock monitoring
CREATE OR REPLACE FUNCTION monitor_advisory_locks()
RETURNS TABLE(
    lock_type VARCHAR(20),
    lock_key BIGINT,
    lock_mode VARCHAR(20),
    session_pid INTEGER,
    application_name TEXT,
    lock_granted BOOLEAN,
    lock_duration INTERVAL,
    blocking_status VARCHAR(20),
    coordination_assessment TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH advisory_lock_details AS (
        SELECT 
            'ADVISORY' as locktype_category,
            (l.classid::BIGINT << 32) | l.objid::BIGINT as advisory_key,
            l.mode,
            l.pid,
            l.granted,
            sa.application_name,
            sa.query_start,
            sa.state,
            CURRENT_TIMESTAMP - COALESCE(sa.query_start, sa.state_change) as duration
        FROM pg_locks l
        LEFT JOIN pg_stat_activity sa ON l.pid = sa.pid
        WHERE l.locktype = 'advisory'
    ),
    blocking_analysis AS (
        SELECT 
            ald.*,
            CASE 
                WHEN NOT ald.granted THEN 'WAITING'
                WHEN EXISTS (
                    SELECT 1 FROM advisory_lock_details ald2 
                    WHERE ald2.advisory_key = ald.advisory_key 
                    AND ald2.pid != ald.pid 
                    AND NOT ald2.granted
                ) THEN 'BLOCKING'
                ELSE 'NORMAL'
            END as blocking_status_calc
        FROM advisory_lock_details ald
    )
    SELECT 
        ba.locktype_category::VARCHAR(20),
        ba.advisory_key,
        ba.mode::VARCHAR(20),
        ba.pid::INTEGER,
        COALESCE(ba.application_name, 'unknown')::TEXT,
        ba.granted,
        ba.duration,
        ba.blocking_status_calc::VARCHAR(20),
        CASE 
            WHEN ba.blocking_status_calc = 'BLOCKING' THEN 'Lock is blocking other sessions'
            WHEN ba.blocking_status_calc = 'WAITING' THEN 'Session waiting for lock'
            WHEN ba.duration > INTERVAL '5 minutes' THEN 'Long-held advisory lock'
            WHEN ba.mode LIKE '%Share%' THEN 'Shared coordination active'
            ELSE 'Normal advisory lock coordination'
        END::TEXT
    FROM blocking_analysis ba
    ORDER BY ba.advisory_key, ba.granted DESC, ba.duration DESC;
END;
$$ LANGUAGE plpgsql;

-- Advisory lock health assessment
CREATE OR REPLACE FUNCTION assess_advisory_lock_health()
RETURNS TABLE(
    health_metric VARCHAR(40),
    current_value TEXT,
    assessment VARCHAR(15),
    recommendation TEXT,
    monitoring_notes TEXT
) AS $$
DECLARE
    total_advisory_locks INTEGER;
    waiting_locks INTEGER;
    long_held_locks INTEGER;
    blocking_locks INTEGER;
    max_lock_duration INTERVAL;
BEGIN
    -- Gather advisory lock statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE NOT granted),
        COUNT(*) FILTER (WHERE granted AND 
                         CURRENT_TIMESTAMP - COALESCE(sa.query_start, sa.state_change) > INTERVAL '10 minutes'),
        COUNT(DISTINCT (classid::BIGINT << 32) | objid::BIGINT) FILTER (WHERE granted),
        MAX(CURRENT_TIMESTAMP - COALESCE(sa.query_start, sa.state_change)) FILTER (WHERE granted)
    INTO 
        total_advisory_locks,
        waiting_locks,
        long_held_locks,
        blocking_locks,
        max_lock_duration
    FROM pg_locks l
    LEFT JOIN pg_stat_activity sa ON l.pid = sa.pid
    WHERE l.locktype = 'advisory';
    
    -- Total locks assessment
    RETURN QUERY SELECT 
        'Total Advisory Locks'::VARCHAR(40),
        total_advisory_locks::TEXT,
        CASE 
            WHEN total_advisory_locks = 0 THEN 'INACTIVE'
            WHEN total_advisory_locks < 10 THEN 'NORMAL'
            WHEN total_advisory_locks < 50 THEN 'ELEVATED'
            ELSE 'HIGH'
        END::VARCHAR(15),
        CASE 
            WHEN total_advisory_locks > 50 THEN 'Review advisory lock usage patterns'
            WHEN total_advisory_locks = 0 THEN 'No advisory locks currently in use'
            ELSE 'Advisory lock usage within normal range'
        END::TEXT,
        'Monitor trends over time for capacity planning'::TEXT;
    
    -- Waiting locks assessment
    RETURN QUERY SELECT 
        'Waiting Advisory Locks'::VARCHAR(40),
        waiting_locks::TEXT,
        CASE 
            WHEN waiting_locks = 0 THEN 'GOOD'
            WHEN waiting_locks < 3 THEN 'CAUTION'
            WHEN waiting_locks < 10 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::VARCHAR(15),
        CASE 
            WHEN waiting_locks > 10 THEN 'Investigate advisory lock contention immediately'
            WHEN waiting_locks > 3 THEN 'Review application lock coordination logic'
            WHEN waiting_locks = 0 THEN 'No advisory lock contention detected'
            ELSE 'Minor advisory lock contention'
        END::TEXT,
        'Waiting locks indicate coordination bottlenecks'::TEXT;
    
    -- Long-held locks assessment
    RETURN QUERY SELECT 
        'Long-held Advisory Locks'::VARCHAR(40),
        long_held_locks::TEXT,
        CASE 
            WHEN long_held_locks = 0 THEN 'GOOD'
            WHEN long_held_locks < 3 THEN 'CAUTION'
            ELSE 'WARNING'
        END::VARCHAR(15),
        CASE 
            WHEN long_held_locks > 3 THEN 'Review long-running processes using advisory locks'
            WHEN long_held_locks > 0 THEN 'Monitor long-held locks for proper cleanup'
            ELSE 'No long-held advisory locks detected'
        END::TEXT,
        'Long-held locks may indicate stuck processes'::TEXT;
    
    -- Maximum duration assessment
    RETURN QUERY SELECT 
        'Maximum Lock Duration'::VARCHAR(40),
        COALESCE(max_lock_duration::TEXT, 'N/A'),
        CASE 
            WHEN max_lock_duration IS NULL THEN 'N/A'
            WHEN max_lock_duration > INTERVAL '1 hour' THEN 'WARNING'
            WHEN max_lock_duration > INTERVAL '10 minutes' THEN 'CAUTION'
            ELSE 'NORMAL'
        END::VARCHAR(15),
        CASE 
            WHEN max_lock_duration > INTERVAL '1 hour' THEN 'Investigate processes with very long lock durations'
            WHEN max_lock_duration > INTERVAL '10 minutes' THEN 'Review if extended lock duration is expected'
            ELSE 'Lock durations appear reasonable'
        END::TEXT,
        'Track maximum duration trends over time'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM monitor_advisory_locks();
SELECT * FROM assess_advisory_lock_health();
```

## Best Practices and Common Pitfalls

### Advisory Lock Best Practices

```sql
-- Comprehensive advisory lock best practices
CREATE OR REPLACE FUNCTION advisory_lock_best_practices()
RETURNS TABLE(
    practice_area VARCHAR(30),
    best_practice VARCHAR(60),
    implementation_guidance TEXT,
    risk_mitigation TEXT,
    performance_impact VARCHAR(15),
    example_code TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Key Management', 'Use consistent key generation schemes',
     'Implement standardized functions for generating lock keys',
     'Prevents accidental key collisions and coordination failures',
     'NONE',
     'CREATE FUNCTION gen_lock_key(category TEXT, id TEXT) RETURNS BIGINT AS $$ SELECT hashtext(category || ''_'' || id); $$ LANGUAGE SQL;'),
    
    ('Key Management', 'Document lock key allocations',
     'Maintain documentation of lock key ranges and purposes',
     'Prevents key conflicts between different application components',
     'NONE',
     '-- Document: Keys 1-1000 for deployment, 1001-2000 for batch jobs'),
    
    ('Error Handling', 'Always handle lock acquisition failures',
     'Check return values and implement appropriate fallback logic',
     'Prevents application hangs and provides graceful degradation',
     'POSITIVE',
     'IF NOT pg_try_advisory_lock(key) THEN -- implement fallback END IF;'),
    
    ('Error Handling', 'Use exception handlers for cleanup',
     'Implement proper cleanup in exception blocks',
     'Ensures locks are released even when errors occur',
     'CRITICAL',
     'BEGIN ... EXCEPTION WHEN OTHERS THEN PERFORM pg_advisory_unlock(key); RAISE; END;'),
    
    ('Lock Duration', 'Minimize lock hold times',
     'Keep critical sections as short as possible',
     'Reduces contention and improves application responsiveness',
     'HIGH_POSITIVE',
     'Acquire lock -> minimal work -> release lock immediately'),
    
    ('Lock Duration', 'Prefer transaction-scoped locks',
     'Use pg_advisory_xact_lock() when operation is transaction-bounded',
     'Automatic cleanup and better integration with database transactions',
     'POSITIVE',
     'SELECT pg_advisory_xact_lock(key); -- automatic cleanup'),
    
    ('Concurrency Design', 'Use shared locks for readers',
     'Implement reader-writer patterns with shared advisory locks',
     'Maximizes concurrency for read-heavy workloads',
     'HIGH_POSITIVE',
     'SELECT pg_advisory_lock_shared(key) for readers'),
    
    ('Concurrency Design', 'Implement timeout patterns',
     'Use non-blocking locks with retry logic and timeouts',
     'Prevents infinite waits and enables fallback strategies',
     'POSITIVE',
     'Multiple attempts with exponential backoff'),
    
    ('Monitoring', 'Implement lock monitoring',
     'Monitor advisory lock usage and duration patterns',
     'Early detection of coordination problems and bottlenecks',
     'MONITORING',
     'Regular queries of pg_locks for advisory lock analysis'),
    
    ('Testing', 'Test lock coordination under load',
     'Verify lock behavior under concurrent access patterns',
     'Ensures coordination works correctly under production conditions',
     'CRITICAL',
     'Concurrent test scenarios with multiple sessions'),
    
    ('Architecture', 'Design lock hierarchies carefully',
     'Plan lock ordering to prevent deadlocks',
     'Prevents complex deadlock scenarios in multi-level coordination',
     'CRITICAL',
     'Always acquire locks in consistent order: global -> specific'),
    
    ('Performance', 'Avoid excessive lock granularity',
     'Balance coordination needs with lock overhead',
     'Prevents performance degradation from lock management overhead',
     'MODERATE',
     'Group related operations under single lock when appropriate');
END;
$$ LANGUAGE plpgsql;

-- Common pitfalls and how to avoid them
CREATE OR REPLACE FUNCTION advisory_lock_pitfalls()
RETURNS TABLE(
    pitfall_category VARCHAR(30),
    common_mistake VARCHAR(50),
    consequences TEXT,
    prevention_strategy TEXT,
    detection_method TEXT,
    fix_implementation TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('Lock Leaks', 'Forgetting to release session-scoped locks',
     'Locks held indefinitely, blocking other processes',
     'Use transaction-scoped locks or implement proper cleanup',
     'Monitor long-held locks in pg_locks',
     'pg_advisory_unlock_all() and fix cleanup code'),
    
    ('Key Collisions', 'Using simple integer keys without coordination',
     'Different application components interfere with each other',
     'Use hash-based key generation with namespacing',
     'Document and review key allocation schemes',
     'Implement consistent key generation functions'),
    
    ('Deadlocks', 'Acquiring locks in inconsistent order',
     'Circular wait conditions causing application deadlocks',
     'Establish consistent lock ordering protocols',
     'Monitor for deadlock detection in PostgreSQL logs',
     'Redesign lock acquisition order'),
    
    ('Missing Error Handling', 'Not checking lock acquisition return values',
     'Applications assume locks are acquired when they fail',
     'Always check return values and implement fallback logic',
     'Test failure scenarios explicitly',
     'Add proper error checking and fallback paths'),
    
    ('Blocking Operations', 'Using blocking locks in high-throughput paths',
     'Application performance degradation and user experience issues',
     'Use non-blocking locks with retry or fallback strategies',
     'Monitor response times and lock wait patterns',
     'Replace with pg_try_advisory_lock() patterns'),
    
    ('Over-coordination', 'Using locks where not necessary',
     'Unnecessary coordination overhead and reduced concurrency',
     'Analyze actual coordination needs before implementing locks',
     'Performance profiling and concurrency testing',
     'Remove unnecessary locks and use weaker coordination'),
    
    ('Lock Scope Confusion', 'Mixing session and transaction scoped locks',
     'Inconsistent cleanup behavior and coordination failures',
     'Establish clear patterns for lock scope usage',
     'Code review and documentation',
     'Standardize on appropriate lock scope for each use case'),
    
    ('Inadequate Testing', 'Testing only single-threaded scenarios',
     'Coordination failures only appear under concurrent load',
     'Implement comprehensive concurrent testing scenarios',
     'Production monitoring and load testing',
     'Develop proper concurrent test suites'),
    
    ('Lock Granularity', 'Using overly coarse-grained locks',
     'Unnecessary blocking and reduced system throughput',
     'Design appropriate lock granularity for actual coordination needs',
     'Analyze contention patterns and blocking statistics',
     'Refine lock granularity based on actual usage patterns'),
    
    ('Resource Cleanup', 'Not releasing locks on application shutdown',
     'Orphaned locks prevent coordination after restart',
     'Implement proper shutdown procedures',
     'Monitor for locks from terminated processes',
     'Use connection cleanup and proper shutdown handling');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM advisory_lock_best_practices() ORDER BY practice_area, best_practice;
SELECT * FROM advisory_lock_pitfalls() ORDER BY pitfall_category, common_mistake;
```

## Summary

**Advisory Locking in PostgreSQL:**

**Core Concept:**
- **Application-Controlled**: Explicit coordination mechanism managed by applications
- **Custom Lock Keys**: Applications define their own lock identifiers
- **No Automatic Protection**: Doesn't automatically protect database objects
- **High Performance**: Fast acquisition and release with minimal overhead

**Lock Scopes:**
- **Session-Scoped**: Held until explicitly released or session ends
- **Transaction-Scoped**: Automatically released at transaction end
- **Blocking vs Non-blocking**: Choose based on application requirements
- **Shared vs Exclusive**: Support for reader-writer coordination patterns

**Key Functions:**
- `pg_advisory_lock(key)` - Session exclusive blocking
- `pg_try_advisory_lock(key)` - Session exclusive non-blocking  
- `pg_advisory_lock_shared(key)` - Session shared blocking
- `pg_advisory_xact_lock(key)` - Transaction exclusive blocking
- `pg_try_advisory_xact_lock(key)` - Transaction exclusive non-blocking

**Common Use Cases:**
- **Singleton Processes**: Ensure only one instance runs
- **Leader Election**: Coordinate distributed system leadership
- **Resource Pools**: Manage shared resource allocation
- **Cache Coordination**: Prevent cache stampede scenarios
- **Job Processing**: Coordinate work distribution
- **Feature Rollouts**: Synchronize configuration changes

**Best Practices:**
- Use consistent key generation schemes with namespacing
- Prefer transaction-scoped locks when operation is transaction-bounded
- Always handle lock acquisition failures with appropriate fallbacks
- Implement proper cleanup in exception handlers
- Minimize lock hold times to reduce contention
- Use shared locks for reader-writer coordination patterns
- Monitor advisory lock usage and duration patterns

**Common Pitfalls:**
- Lock leaks from forgotten cleanup (use transaction scope when possible)
- Key collisions from uncoordinated key generation
- Deadlocks from inconsistent lock ordering
- Missing error handling for lock acquisition failures
- Over-coordination causing unnecessary performance overhead

**Performance Characteristics:**
- **Very Fast**: Minimal overhead compared to table/row locks
- **Scalable**: Excellent performance under high concurrency
- **Integrated**: Works with PostgreSQL's deadlock detection
- **Flexible**: Support for various coordination patterns

**Monitoring Points:**
- Track advisory lock count and duration trends
- Monitor for waiting/blocked advisory locks
- Identify long-held locks that may indicate stuck processes
- Analyze lock key usage patterns for optimization opportunities

Advisory locking provides PostgreSQL applications with powerful, flexible coordination mechanisms that enable sophisticated distributed system patterns while maintaining excellent performance characteristics.