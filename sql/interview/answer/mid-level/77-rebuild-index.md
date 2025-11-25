# How Do You Rebuild an Index?

Rebuilding indexes in PostgreSQL is a critical maintenance operation used to eliminate bloat, improve performance, and recover from corruption. This comprehensive guide covers all methods of index rebuilding, from the standard REINDEX command to advanced concurrent techniques and automated strategies.

## Understanding Index Rebuilding

### 1. Why Rebuild Indexes?

```sql
-- Demonstrate scenarios requiring index rebuilds
CREATE TABLE rebuild_demo (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    name VARCHAR(255),
    category VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for demonstration
CREATE INDEX idx_demo_email ON rebuild_demo (email);
CREATE INDEX idx_demo_category ON rebuild_demo (category);
CREATE INDEX idx_demo_status ON rebuild_demo (status);
CREATE INDEX idx_demo_created ON rebuild_demo (created_at);

-- Insert initial data
INSERT INTO rebuild_demo (email, name, category, status)
SELECT
    'user' || generate_series(1,100000) || '@example.com',
    'User ' || generate_series(1,100000),
    CASE (random() * 4)::INTEGER
        WHEN 0 THEN 'premium'
        WHEN 1 THEN 'standard'
        WHEN 2 THEN 'basic'
        ELSE 'trial'
    END,
    CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'active'
        WHEN 1 THEN 'inactive'
        ELSE 'pending'
    END;

-- Check initial index conditions
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
JOIN pg_indexes USING (indexname)
WHERE tablename = 'rebuild_demo'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Scenario 1: Create bloat through updates
UPDATE rebuild_demo
SET email = email || '.v2',
    status = CASE status
        WHEN 'active' THEN 'inactive'
        WHEN 'inactive' THEN 'pending'
        ELSE 'active'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id % 3 = 0;  -- Update 33% of records

-- Scenario 2: More bloat through deletes and inserts
DELETE FROM rebuild_demo WHERE id % 7 = 0;  -- Delete ~14% of records

INSERT INTO rebuild_demo (email, name, category, status)
SELECT
    'newuser' || generate_series(1,20000) || '@example.com',
    'New User ' || generate_series(1,20000),
    CASE (random() * 4)::INTEGER
        WHEN 0 THEN 'premium'
        WHEN 1 THEN 'standard'
        WHEN 2 THEN 'basic'
        ELSE 'trial'
    END,
    'active';

-- Check bloat levels after modifications
CREATE EXTENSION IF NOT EXISTS pgstattuple;

SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as current_size,
    ROUND((pgstatindex(indexname)).leaf_fragmentation, 2) as fragmentation_pct,
    ROUND(100.0 * (pgstatindex(indexname)).dead_version_size /
          NULLIF((pgstatindex(indexname)).index_size, 0), 2) as dead_space_pct
FROM pg_indexes
WHERE tablename = 'rebuild_demo'
AND indexname != 'rebuild_demo_pkey'  -- Skip primary key for pgstatindex
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

### 2. When to Rebuild Indexes

```sql
-- Function to assess if an index needs rebuilding
CREATE OR REPLACE FUNCTION assess_rebuild_need(index_name TEXT)
RETURNS TABLE(
    criterion TEXT,
    current_value TEXT,
    threshold TEXT,
    needs_rebuild BOOLEAN,
    urgency TEXT
) AS $$
DECLARE
    index_stats RECORD;
    usage_stats RECORD;
    table_name TEXT;
BEGIN
    -- Get table name
    SELECT tablename INTO table_name FROM pg_indexes WHERE indexname = index_name;

    -- Get detailed index statistics
    BEGIN
        SELECT * INTO index_stats FROM pgstatindex(index_name);
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Error'::TEXT, 'Cannot analyze'::TEXT, 'N/A'::TEXT, FALSE, 'N/A'::TEXT;
        RETURN;
    END;

    -- Get usage statistics
    SELECT * INTO usage_stats FROM pg_stat_user_indexes WHERE indexname = index_name;

    -- Bloat assessment
    RETURN QUERY
    SELECT
        'Dead Space Percentage'::TEXT,
        ROUND(100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0), 2)::TEXT || '%',
        '> 20%'::TEXT,
        (100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0)) > 20,
        CASE
            WHEN (100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0)) > 40 THEN 'CRITICAL'
            WHEN (100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0)) > 30 THEN 'HIGH'
            WHEN (100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0)) > 20 THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT;

    -- Fragmentation assessment
    RETURN QUERY
    SELECT
        'Leaf Fragmentation'::TEXT,
        ROUND(index_stats.leaf_fragmentation, 2)::TEXT || '%',
        '> 30%'::TEXT,
        index_stats.leaf_fragmentation > 30,
        CASE
            WHEN index_stats.leaf_fragmentation > 50 THEN 'HIGH'
            WHEN index_stats.leaf_fragmentation > 30 THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT;

    -- Size efficiency assessment
    RETURN QUERY
    SELECT
        'Free Space'::TEXT,
        pg_size_pretty(index_stats.free_space),
        '> 10MB'::TEXT,
        index_stats.free_space > 10 * 1024 * 1024,
        CASE
            WHEN index_stats.free_space > 50 * 1024 * 1024 THEN 'HIGH'
            WHEN index_stats.free_space > 10 * 1024 * 1024 THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT;

    -- Usage vs size assessment
    RETURN QUERY
    SELECT
        'Size vs Usage Ratio'::TEXT,
        pg_size_pretty(usage_stats.idx_tup_read) || ' reads / ' || pg_size_pretty(pg_relation_size(index_name::regclass)),
        'Efficiency Analysis'::TEXT,
        (pg_relation_size(index_name::regclass) > 50 * 1024 * 1024 AND usage_stats.idx_scan < 100),
        CASE
            WHEN pg_relation_size(index_name::regclass) > 100 * 1024 * 1024 AND usage_stats.idx_scan < 10 THEN 'HIGH'
            WHEN pg_relation_size(index_name::regclass) > 50 * 1024 * 1024 AND usage_stats.idx_scan < 100 THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Assess rebuild needs for our demo indexes
SELECT * FROM assess_rebuild_need('idx_demo_email');
SELECT * FROM assess_rebuild_need('idx_demo_category');
```

## Standard Index Rebuilding Methods

### 1. Basic REINDEX Operations

```sql
-- Method 1: Single index rebuild
REINDEX INDEX idx_demo_email;

-- Check size reduction after rebuild
SELECT
    'Before rebuild' as timing,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE indexname = 'idx_demo_email'
UNION ALL
SELECT
    'After rebuild' as timing,
    'idx_demo_email',
    pg_size_pretty(pg_relation_size('idx_demo_email'::regclass))
ORDER BY timing;

-- Method 2: Table-wide index rebuild
REINDEX TABLE rebuild_demo;

-- Method 3: Schema-wide index rebuild (use carefully!)
-- REINDEX SCHEMA public;

-- Method 4: Database-wide index rebuild (emergency use only!)
-- REINDEX DATABASE current_database_name;

-- Check overall improvement after table rebuild
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size_after_reindex,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
JOIN pg_indexes USING (indexname)
WHERE tablename = 'rebuild_demo'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

### 2. Concurrent Index Rebuilding (PostgreSQL 12+)

```sql
-- Method 5: Concurrent index rebuild (safer for production)
REINDEX INDEX CONCURRENTLY idx_demo_category;

-- Monitor concurrent rebuild progress
SELECT
    pid,
    application_name,
    state,
    query,
    query_start,
    NOW() - query_start as duration,
    wait_event_type,
    wait_event
FROM pg_stat_activity
WHERE query ILIKE '%REINDEX%CONCURRENTLY%'
AND state = 'active';

-- Concurrent table rebuild (PostgreSQL 12+)
-- Note: This rebuilds all indexes on the table concurrently
REINDEX TABLE CONCURRENTLY rebuild_demo;

-- Check for any failed concurrent operations
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE
        WHEN indisvalid THEN 'VALID'
        ELSE 'INVALID - Rebuild failed'
    END as status
FROM pg_indexes
JOIN pg_index ON indexrelid = (schemaname||'.'||indexname)::regclass
WHERE tablename = 'rebuild_demo';

-- Clean up any invalid indexes from failed concurrent rebuilds
-- DROP INDEX CONCURRENTLY invalid_index_name;  -- Only if rebuild failed
```

### 3. Advanced Rebuilding Techniques

```sql
-- Method 6: Selective rebuilding based on conditions
CREATE OR REPLACE FUNCTION selective_reindex(
    schema_name TEXT DEFAULT 'public',
    min_size_mb INTEGER DEFAULT 10,
    min_bloat_pct NUMERIC DEFAULT 20,
    concurrent BOOLEAN DEFAULT TRUE
) RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    size_before TEXT,
    bloat_before NUMERIC,
    rebuild_duration INTERVAL,
    size_after TEXT,
    size_reduction TEXT,
    status TEXT
) AS $$
DECLARE
    index_record RECORD;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    size_before BIGINT;
    size_after BIGINT;
    bloat_pct NUMERIC;
    reindex_cmd TEXT;
BEGIN
    FOR index_record IN
        SELECT
            i.indexname,
            i.tablename,
            pg_relation_size(s.indexrelid) as current_size
        FROM pg_indexes i
        JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
        WHERE i.schemaname = schema_name
        AND pg_relation_size(s.indexrelid) > min_size_mb * 1024 * 1024
        AND i.indexname NOT LIKE '%_pkey'  -- Skip primary keys
    LOOP
        -- Calculate current bloat
        BEGIN
            SELECT
                ROUND(100.0 * (pgs.dead_version_size + pgs.free_space) /
                      NULLIF(pgs.index_size, 0), 2)
            INTO bloat_pct
            FROM pgstatindex(index_record.indexname) pgs;
        EXCEPTION WHEN OTHERS THEN
            bloat_pct := 0;
            CONTINUE;
        END;

        -- Skip if bloat is below threshold
        IF bloat_pct < min_bloat_pct THEN
            CONTINUE;
        END IF;

        -- Record before metrics
        size_before := index_record.current_size;

        -- Build REINDEX command
        reindex_cmd := 'REINDEX INDEX';
        IF concurrent THEN
            reindex_cmd := reindex_cmd || ' CONCURRENTLY';
        END IF;
        reindex_cmd := reindex_cmd || ' ' || index_record.indexname;

        -- Execute rebuild
        start_time := clock_timestamp();
        BEGIN
            EXECUTE reindex_cmd;
            end_time := clock_timestamp();
            size_after := pg_relation_size(index_record.indexname::regclass);

            RETURN QUERY
            SELECT
                index_record.indexname::TEXT,
                index_record.tablename::TEXT,
                pg_size_pretty(size_before),
                bloat_pct,
                end_time - start_time,
                pg_size_pretty(size_after),
                pg_size_pretty(size_before - size_after),
                'SUCCESS'::TEXT;

        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY
            SELECT
                index_record.indexname::TEXT,
                index_record.tablename::TEXT,
                pg_size_pretty(size_before),
                bloat_pct,
                clock_timestamp() - start_time,
                'N/A'::TEXT,
                'N/A'::TEXT,
                ('ERROR: ' || SQLERRM)::TEXT;
        END;

        -- Brief pause between operations
        PERFORM pg_sleep(0.1);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute selective rebuild (dry run by checking conditions first)
SELECT
    indexname,
    tablename,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    ROUND(100.0 * (pgstatindex(indexname)).dead_version_size /
          NULLIF((pgstatindex(indexname)).index_size, 0), 2) as bloat_pct
FROM pg_stat_user_indexes s
JOIN pg_indexes i USING (indexname)
WHERE i.schemaname = 'public'
AND pg_relation_size(s.indexrelid) > 10 * 1024 * 1024  -- > 10MB
AND indexname NOT LIKE '%_pkey'
AND (SELECT 100.0 * dead_version_size / NULLIF(index_size, 0) FROM pgstatindex(indexname)) > 20;

-- Run the selective rebuild
-- SELECT * FROM selective_reindex('public', 5, 15, true);
```

## Alternative Rebuilding Approaches

### 1. DROP and CREATE Method

```sql
-- Method 7: Manual drop and recreate (for maximum control)
-- This method allows changing index properties during rebuild

-- Step 1: Backup index definition
CREATE TABLE index_rebuild_backup (
    backup_id SERIAL PRIMARY KEY,
    original_index_name VARCHAR(255),
    table_name VARCHAR(255),
    index_definition TEXT,
    backup_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to backup and recreate index
CREATE OR REPLACE FUNCTION rebuild_with_drop_create(
    original_index_name TEXT,
    new_fillfactor INTEGER DEFAULT NULL,
    concurrent_create BOOLEAN DEFAULT TRUE
) RETURNS TEXT AS $$
DECLARE
    index_def TEXT;
    table_name TEXT;
    new_index_name TEXT;
    create_cmd TEXT;
    result TEXT;
BEGIN
    -- Get index definition
    SELECT indexdef, tablename
    INTO index_def, table_name
    FROM pg_indexes
    WHERE indexname = original_index_name;

    IF index_def IS NULL THEN
        RETURN 'Index ' || original_index_name || ' not found';
    END IF;

    -- Backup the definition
    INSERT INTO index_rebuild_backup (original_index_name, table_name, index_definition)
    VALUES (original_index_name, table_name, index_def);

    -- Generate temporary new index name
    new_index_name := original_index_name || '_rebuild_' || extract(epoch from now())::bigint;

    -- Build new create command
    create_cmd := replace(index_def, 'CREATE INDEX ' || original_index_name,
                         'CREATE INDEX' || CASE WHEN concurrent_create THEN ' CONCURRENTLY' ELSE '' END || ' ' || new_index_name);

    -- Add fill factor if specified
    IF new_fillfactor IS NOT NULL THEN
        create_cmd := create_cmd || ' WITH (fillfactor = ' || new_fillfactor || ')';
    END IF;

    -- Create new index
    BEGIN
        EXECUTE create_cmd;
        result := 'Step 1: Created ' || new_index_name || '. ';
    EXCEPTION WHEN OTHERS THEN
        RETURN 'Failed to create new index: ' || SQLERRM;
    END;

    -- Drop old index
    BEGIN
        EXECUTE 'DROP INDEX ' || original_index_name;
        result := result || 'Step 2: Dropped ' || original_index_name || '. ';
    EXCEPTION WHEN OTHERS THEN
        -- Clean up new index if old drop fails
        EXECUTE 'DROP INDEX ' || new_index_name;
        RETURN 'Failed to drop old index, cleaned up: ' || SQLERRM;
    END;

    -- Rename new index to original name
    BEGIN
        EXECUTE 'ALTER INDEX ' || new_index_name || ' RENAME TO ' || original_index_name;
        result := result || 'Step 3: Renamed to ' || original_index_name || '.';
    EXCEPTION WHEN OTHERS THEN
        RETURN 'Index created but rename failed: ' || SQLERRM;
    END;

    RETURN result || ' Rebuild complete.';
END;
$$ LANGUAGE plpgsql;

-- Example usage with improved fill factor
-- SELECT rebuild_with_drop_create('idx_demo_status', 80, true);

-- Verify the rebuild
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
    CASE
        WHEN reloptions IS NULL THEN 'Default (90)'
        ELSE array_to_string(reloptions, ', ')
    END as options
FROM pg_indexes i
JOIN pg_class c ON i.indexname = c.relname
WHERE tablename = 'rebuild_demo';
```

### 2. Background Rebuild Strategies

```sql
-- Method 8: Scheduled background rebuilding
CREATE OR REPLACE FUNCTION background_rebuild_scheduler(
    maintenance_window_hours INTEGER[] DEFAULT ARRAY[2,3,4],  -- 2-4 AM
    max_duration_minutes INTEGER DEFAULT 120,
    dry_run BOOLEAN DEFAULT TRUE
) RETURNS TABLE(
    scheduled_time TEXT,
    index_name TEXT,
    estimated_duration TEXT,
    priority TEXT,
    action TEXT
) AS $$
DECLARE
    index_record RECORD;
    current_hour INTEGER;
    estimated_time INTERVAL;
    priority_score INTEGER;
BEGIN
    current_hour := EXTRACT(hour FROM CURRENT_TIME);

    -- Only proceed if we're in maintenance window
    IF NOT (current_hour = ANY(maintenance_window_hours)) AND NOT dry_run THEN
        RETURN QUERY SELECT 'OUTSIDE_WINDOW'::TEXT, 'N/A'::TEXT, 'N/A'::TEXT, 'N/A'::TEXT, 'Waiting for maintenance window'::TEXT;
        RETURN;
    END IF;

    FOR index_record IN
        SELECT
            i.indexname,
            i.tablename,
            pg_relation_size(s.indexrelid) as size,
            s.idx_scan,
            COALESCE(
                (SELECT ROUND(100.0 * (dead_version_size + free_space) / NULLIF(index_size, 0), 2)
                 FROM pgstatindex(i.indexname)
                ), 0
            ) as bloat_pct
        FROM pg_indexes i
        JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
        WHERE i.schemaname = 'public'
        AND pg_relation_size(s.indexrelid) > 5 * 1024 * 1024  -- > 5MB
        ORDER BY
            -- Prioritize by bloat level and size
            COALESCE(
                (SELECT (dead_version_size + free_space) FROM pgstatindex(i.indexname)), 0
            ) DESC
    LOOP
        -- Estimate rebuild time based on size (rough approximation)
        estimated_time := (index_record.size / (10 * 1024 * 1024)) * INTERVAL '1 minute';

        -- Calculate priority score
        priority_score :=
            CASE
                WHEN index_record.bloat_pct > 40 THEN 100
                WHEN index_record.bloat_pct > 25 THEN 75
                WHEN index_record.bloat_pct > 15 THEN 50
                ELSE 25
            END +
            CASE
                WHEN index_record.size > 100 * 1024 * 1024 THEN 25  -- Large indexes get higher priority
                WHEN index_record.size > 50 * 1024 * 1024 THEN 15
                ELSE 5
            END;

        RETURN QUERY
        SELECT
            CASE
                WHEN dry_run THEN 'PLANNED_' || to_char(CURRENT_TIMESTAMP + estimated_time, 'HH24:MI')
                ELSE to_char(CURRENT_TIMESTAMP, 'HH24:MI')
            END::TEXT,
            index_record.indexname::TEXT,
            estimated_time::TEXT,
            CASE
                WHEN priority_score > 90 THEN 'CRITICAL'
                WHEN priority_score > 70 THEN 'HIGH'
                WHEN priority_score > 50 THEN 'MEDIUM'
                ELSE 'LOW'
            END::TEXT,
            CASE
                WHEN dry_run THEN 'PLAN: REINDEX CONCURRENTLY'
                ELSE 'EXECUTING: REINDEX CONCURRENTLY'
            END::TEXT;

        -- Execute if not dry run and within time limit
        IF NOT dry_run AND estimated_time < (max_duration_minutes || ' minutes')::INTERVAL THEN
            BEGIN
                EXECUTE 'REINDEX INDEX CONCURRENTLY ' || index_record.indexname;
            EXCEPTION WHEN OTHERS THEN
                -- Log error but continue with other indexes
                RAISE WARNING 'Failed to rebuild %: %', index_record.indexname, SQLERRM;
            END;
        END IF;

        -- Stop if we would exceed maintenance window
        EXIT WHEN estimated_time > (max_duration_minutes || ' minutes')::INTERVAL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Plan background rebuilds
SELECT * FROM background_rebuild_scheduler(ARRAY[2,3,4], 60, true);
```

## Monitoring and Validation

### 1. Rebuild Progress Monitoring

```sql
-- Function to monitor ongoing rebuild operations
CREATE OR REPLACE FUNCTION monitor_rebuild_progress()
RETURNS TABLE(
    operation_type TEXT,
    index_name TEXT,
    table_name TEXT,
    duration INTERVAL,
    estimated_completion TEXT,
    blocking_queries INTEGER,
    locks_held TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH active_rebuilds AS (
        SELECT
            pid,
            query,
            query_start,
            CASE
                WHEN query ILIKE '%REINDEX INDEX CONCURRENTLY%' THEN 'REINDEX CONCURRENT'
                WHEN query ILIKE '%REINDEX INDEX%' THEN 'REINDEX STANDARD'
                WHEN query ILIKE '%REINDEX TABLE%' THEN 'REINDEX TABLE'
                ELSE 'OTHER REINDEX'
            END as op_type,
            CASE
                WHEN query ~ 'REINDEX.+(INDEX|TABLE)\s+(CONCURRENTLY\s+)?(\w+)' THEN
                    (regexp_matches(query, 'REINDEX.+(?:INDEX|TABLE)\s+(?:CONCURRENTLY\s+)?(\w+)', 'i'))[1]
                ELSE 'UNKNOWN'
            END as object_name
        FROM pg_stat_activity
        WHERE query ILIKE '%REINDEX%'
        AND state = 'active'
        AND pid != pg_backend_pid()
    ),
    blocking_info AS (
        SELECT
            blocked.pid as blocked_pid,
            COUNT(blocking.pid) as blocking_count
        FROM pg_locks blocked
        JOIN pg_locks blocking ON (
            blocking.locktype = blocked.locktype
            AND blocking.database IS NOT DISTINCT FROM blocked.database
            AND blocking.relation IS NOT DISTINCT FROM blocked.relation
            AND blocking.page IS NOT DISTINCT FROM blocked.page
            AND blocking.tuple IS NOT DISTINCT FROM blocked.tuple
            AND blocking.virtualxid IS NOT DISTINCT FROM blocked.virtualxid
            AND blocking.transactionid IS NOT DISTINCT FROM blocked.transactionid
            AND blocking.classid IS NOT DISTINCT FROM blocked.classid
            AND blocking.objid IS NOT DISTINCT FROM blocked.objid
            AND blocking.objsubid IS NOT DISTINCT FROM blocked.objsubid
            AND blocking.pid != blocked.pid
        )
        WHERE NOT blocked.granted
        GROUP BY blocked.pid
    ),
    lock_info AS (
        SELECT
            l.pid,
            string_agg(DISTINCT l.mode, ', ') as lock_modes
        FROM pg_locks l
        JOIN active_rebuilds ar ON l.pid = ar.pid
        WHERE l.granted
        GROUP BY l.pid
    )
    SELECT
        ar.op_type::TEXT,
        ar.object_name::TEXT,
        COALESCE(i.tablename, 'N/A')::TEXT,
        NOW() - ar.query_start,
        CASE
            WHEN ar.op_type = 'REINDEX CONCURRENT' THEN 'Variable (non-blocking)'
            WHEN ar.op_type = 'REINDEX STANDARD' THEN 'Fast but blocking'
            ELSE 'Unknown'
        END::TEXT,
        COALESCE(bi.blocking_count, 0)::INTEGER,
        COALESCE(li.lock_modes, 'None')::TEXT
    FROM active_rebuilds ar
    LEFT JOIN pg_indexes i ON i.indexname = ar.object_name
    LEFT JOIN blocking_info bi ON bi.blocked_pid = ar.pid
    LEFT JOIN lock_info li ON li.pid = ar.pid;
END;
$$ LANGUAGE plpgsql;

-- Monitor current rebuild operations
SELECT * FROM monitor_rebuild_progress();

-- Historical rebuild tracking
CREATE TABLE IF NOT EXISTS index_rebuild_history (
    id SERIAL PRIMARY KEY,
    index_name VARCHAR(255),
    table_name VARCHAR(255),
    rebuild_type VARCHAR(50),
    size_before BIGINT,
    size_after BIGINT,
    bloat_before NUMERIC,
    bloat_after NUMERIC,
    duration INTERVAL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    success BOOLEAN,
    error_message TEXT
);

-- Function to log rebuild operations
CREATE OR REPLACE FUNCTION log_rebuild_operation(
    p_index_name TEXT,
    p_table_name TEXT,
    p_rebuild_type TEXT,
    p_size_before BIGINT,
    p_duration INTERVAL,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    size_after BIGINT;
    bloat_before NUMERIC;
    bloat_after NUMERIC;
BEGIN
    -- Get current metrics
    size_after := pg_relation_size(p_index_name::regclass);

    -- Calculate bloat (if possible)
    BEGIN
        SELECT
            ROUND(100.0 * (dead_version_size + free_space) / NULLIF(index_size, 0), 2)
        INTO bloat_after
        FROM pgstatindex(p_index_name);

        bloat_before := bloat_after + 20;  -- Estimate (actual before value should be captured)
    EXCEPTION WHEN OTHERS THEN
        bloat_before := NULL;
        bloat_after := NULL;
    END;

    INSERT INTO index_rebuild_history (
        index_name, table_name, rebuild_type, size_before, size_after,
        bloat_before, bloat_after, duration, start_time, end_time, success, error_message
    ) VALUES (
        p_index_name, p_table_name, p_rebuild_type, p_size_before, size_after,
        bloat_before, bloat_after, p_duration,
        CURRENT_TIMESTAMP - p_duration, CURRENT_TIMESTAMP, p_success, p_error_message
    );
END;
$$ LANGUAGE plpgsql;
```

### 2. Post-Rebuild Validation

```sql
-- Comprehensive post-rebuild validation
CREATE OR REPLACE FUNCTION validate_rebuild_success(
    index_name TEXT,
    expected_size_reduction_pct NUMERIC DEFAULT 10
) RETURNS TABLE(
    validation_check TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $$
DECLARE
    index_stats RECORD;
    usage_stats RECORD;
    table_name TEXT;
BEGIN
    -- Get table name
    SELECT tablename INTO table_name FROM pg_indexes WHERE indexname = index_name;

    -- Basic existence check
    IF table_name IS NULL THEN
        RETURN QUERY
        SELECT 'Index Existence'::TEXT, 'FAIL'::TEXT, 'Index not found'::TEXT, 'Verify index name'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 'Index Existence'::TEXT, 'PASS'::TEXT, 'Index exists and accessible'::TEXT, 'None'::TEXT;

    -- Get detailed statistics
    BEGIN
        SELECT * INTO index_stats FROM pgstatindex(index_name);
        SELECT * INTO usage_stats FROM pg_stat_user_indexes WHERE indexname = index_name;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY
        SELECT 'Statistics Access'::TEXT, 'FAIL'::TEXT, 'Cannot access index statistics'::TEXT, 'Check index validity'::TEXT;
        RETURN;
    END;

    -- Bloat level check
    RETURN QUERY
    SELECT
        'Bloat Level'::TEXT,
        CASE
            WHEN (100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0)) < 5 THEN 'EXCELLENT'
            WHEN (100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0)) < 10 THEN 'GOOD'
            WHEN (100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0)) < 20 THEN 'ACCEPTABLE'
            ELSE 'POOR'
        END,
        'Dead space: ' || ROUND(100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0), 2) || '%',
        CASE
            WHEN (100.0 * index_stats.dead_version_size / NULLIF(index_stats.index_size, 0)) < 10 THEN 'Rebuild successful'
            ELSE 'May need another rebuild or investigation'
        END;

    -- Fragmentation check
    RETURN QUERY
    SELECT
        'Fragmentation'::TEXT,
        CASE
            WHEN index_stats.leaf_fragmentation < 10 THEN 'EXCELLENT'
            WHEN index_stats.leaf_fragmentation < 20 THEN 'GOOD'
            WHEN index_stats.leaf_fragmentation < 30 THEN 'ACCEPTABLE'
            ELSE 'POOR'
        END,
        'Leaf fragmentation: ' || ROUND(index_stats.leaf_fragmentation, 2) || '%',
        CASE
            WHEN index_stats.leaf_fragmentation < 20 THEN 'Fragmentation well optimized'
            ELSE 'Consider reviewing update patterns'
        END;

    -- Query performance validation
    RETURN QUERY
    SELECT
        'Query Performance'::TEXT,
        'INFO'::TEXT,
        'Run test queries to validate performance improvement',
        'Execute representative queries and compare execution times';

    -- Usage reset check (statistics are reset after rebuild)
    RETURN QUERY
    SELECT
        'Statistics Reset'::TEXT,
        CASE WHEN usage_stats.idx_scan = 0 THEN 'EXPECTED' ELSE 'UNEXPECTED' END,
        'Scan count: ' || usage_stats.idx_scan || ', Tuples read: ' || usage_stats.idx_tup_read,
        'Statistics reset is normal after rebuild';
END;
$$ LANGUAGE plpgsql;

-- Validate rebuild success
SELECT * FROM validate_rebuild_success('idx_demo_email');

-- Performance comparison function
CREATE OR REPLACE FUNCTION compare_query_performance(
    test_query TEXT,
    index_name TEXT,
    iterations INTEGER DEFAULT 5
) RETURNS TABLE(
    iteration INTEGER,
    execution_time_ms NUMERIC,
    buffers_hit INTEGER,
    buffers_read INTEGER,
    index_used BOOLEAN
) AS $$
DECLARE
    i INTEGER;
    plan_json JSONB;
    exec_time NUMERIC;
    buffers_hit_val INTEGER;
    buffers_read_val INTEGER;
    uses_index BOOLEAN;
BEGIN
    FOR i IN 1..iterations LOOP
        -- Clear buffer cache effect by running a simple query
        PERFORM COUNT(*) FROM pg_class WHERE relname = 'dummy_table_not_exists';

        -- Execute the test query
        EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || test_query INTO plan_json;

        -- Extract metrics
        exec_time := (plan_json->0->'Execution Time')::NUMERIC;
        buffers_hit_val := COALESCE((plan_json->0->'Plan'->'Shared Hit Blocks')::INTEGER, 0);
        buffers_read_val := COALESCE((plan_json->0->'Plan'->'Shared Read Blocks')::INTEGER, 0);
        uses_index := (plan_json->0->'Plan'->>'Index Name' = index_name) OR
                      (plan_json::TEXT ILIKE '%' || index_name || '%');

        RETURN QUERY
        SELECT i, exec_time, buffers_hit_val, buffers_read_val, uses_index;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Test query performance after rebuild
SELECT
    AVG(execution_time_ms) as avg_execution_time_ms,
    AVG(buffers_hit + buffers_read) as avg_buffer_usage,
    bool_and(index_used) as index_consistently_used
FROM compare_query_performance(
    'SELECT COUNT(*) FROM rebuild_demo WHERE email LIKE ''user1%''',
    'idx_demo_email',
    3
);
```

## Best Practices and Recommendations

### 1. Production Rebuild Strategy

```sql
-- Comprehensive production rebuild strategy
CREATE OR REPLACE FUNCTION production_rebuild_strategy()
RETURNS TABLE(
    strategy_component TEXT,
    recommendation TEXT,
    implementation TEXT,
    risk_level TEXT
) AS $$
BEGIN
    -- Timing recommendations
    RETURN QUERY VALUES
    ('Timing', 'Schedule during maintenance windows', 'Use REINDEX CONCURRENTLY during business hours only if necessary', 'LOW'),
    ('Timing', 'Avoid peak usage periods', 'Monitor pg_stat_activity for concurrent load', 'MEDIUM'),
    ('Timing', 'Plan for extended duration', 'REINDEX CONCURRENTLY takes 2-3x longer than standard REINDEX', 'LOW');

    -- Safety recommendations
    RETURN QUERY VALUES
    ('Safety', 'Always backup before major rebuilds', 'pg_dump or filesystem-level backup', 'CRITICAL'),
    ('Safety', 'Test in staging environment first', 'Verify rebuild process and timing', 'HIGH'),
    ('Safety', 'Monitor for blocking queries', 'Check pg_locks and pg_stat_activity during rebuild', 'MEDIUM');

    -- Performance recommendations
    RETURN QUERY VALUES
    ('Performance', 'Use REINDEX CONCURRENTLY for large indexes', 'Avoids exclusive locks but takes longer', 'MEDIUM'),
    ('Performance', 'Increase maintenance_work_mem temporarily', 'SET maintenance_work_mem = ''1GB'' for session', 'LOW'),
    ('Performance', 'Monitor system resources', 'Watch CPU, I/O, and disk space during rebuild', 'MEDIUM');

    -- Monitoring recommendations
    RETURN QUERY VALUES
    ('Monitoring', 'Track rebuild progress', 'Monitor pg_stat_activity and log files', 'LOW'),
    ('Monitoring', 'Validate post-rebuild performance', 'Run representative queries before and after', 'HIGH'),
    ('Monitoring', 'Document size changes', 'Record before/after sizes and bloat levels', 'LOW');
END;
$$ LANGUAGE plpgsql;

-- Get production strategy recommendations
SELECT * FROM production_rebuild_strategy() ORDER BY risk_level DESC, strategy_component;

-- Pre-rebuild checklist function
CREATE OR REPLACE FUNCTION pre_rebuild_checklist(index_name TEXT)
RETURNS TABLE(
    checklist_item TEXT,
    status TEXT,
    action_needed TEXT
) AS $$
DECLARE
    table_name TEXT;
    index_size BIGINT;
    active_queries INTEGER;
    disk_space_gb NUMERIC;
BEGIN
    -- Get basic info
    SELECT i.tablename, pg_relation_size(s.indexrelid)
    INTO table_name, index_size
    FROM pg_indexes i
    JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
    WHERE i.indexname = index_name;

    -- Check if index exists
    RETURN QUERY
    SELECT
        'Index Exists'::TEXT,
        CASE WHEN table_name IS NOT NULL THEN 'PASS' ELSE 'FAIL' END,
        CASE WHEN table_name IS NULL THEN 'Verify index name' ELSE 'None' END;

    IF table_name IS NULL THEN RETURN; END IF;

    -- Check current activity
    SELECT COUNT(*) INTO active_queries
    FROM pg_stat_activity
    WHERE query ILIKE '%' || table_name || '%'
    AND state = 'active'
    AND pid != pg_backend_pid();

    RETURN QUERY
    SELECT
        'Table Activity'::TEXT,
        CASE WHEN active_queries = 0 THEN 'OPTIMAL' WHEN active_queries < 5 THEN 'ACCEPTABLE' ELSE 'HIGH' END,
        CASE
            WHEN active_queries = 0 THEN 'Safe to proceed'
            WHEN active_queries < 5 THEN 'Consider REINDEX CONCURRENTLY'
            ELSE 'Wait for lower activity or use CONCURRENTLY'
        END;

    -- Check disk space (approximate)
    RETURN QUERY
    SELECT
        'Disk Space'::TEXT,
        'CHECK'::TEXT,
        'Ensure ' || pg_size_pretty(index_size * 2) || ' free space available for rebuild';

    -- Check for long-running transactions
    RETURN QUERY
    SELECT
        'Long Transactions'::TEXT,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM pg_stat_activity
                WHERE state = 'active'
                AND NOW() - query_start > INTERVAL '30 minutes'
            ) THEN 'WARNING'
            ELSE 'PASS'
        END,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM pg_stat_activity
                WHERE state = 'active'
                AND NOW() - query_start > INTERVAL '30 minutes'
            ) THEN 'Long transactions may block REINDEX'
            ELSE 'No blocking long transactions'
        END;

    -- Check maintenance window
    RETURN QUERY
    SELECT
        'Maintenance Window'::TEXT,
        CASE
            WHEN EXTRACT(hour FROM CURRENT_TIME) BETWEEN 2 AND 5 THEN 'OPTIMAL'
            WHEN EXTRACT(hour FROM CURRENT_TIME) BETWEEN 22 AND 24 OR EXTRACT(hour FROM CURRENT_TIME) BETWEEN 0 AND 6 THEN 'GOOD'
            ELSE 'SUBOPTIMAL'
        END,
        CASE
            WHEN EXTRACT(hour FROM CURRENT_TIME) BETWEEN 2 AND 5 THEN 'Optimal maintenance window'
            WHEN EXTRACT(hour FROM CURRENT_TIME) BETWEEN 22 AND 24 OR EXTRACT(hour FROM CURRENT_TIME) BETWEEN 0 AND 6 THEN 'Acceptable time'
            ELSE 'Consider using REINDEX CONCURRENTLY'
        END;
END;
$$ LANGUAGE plpgsql;

-- Run pre-rebuild checklist
SELECT * FROM pre_rebuild_checklist('idx_demo_email');
```

### 2. Automated Rebuild Management

```sql
-- Complete automated rebuild management system
CREATE TABLE IF NOT EXISTS rebuild_schedule (
    id SERIAL PRIMARY KEY,
    index_name VARCHAR(255),
    table_name VARCHAR(255),
    rebuild_type VARCHAR(50) DEFAULT 'CONCURRENT',
    schedule_frequency INTERVAL DEFAULT '7 days',
    last_rebuild TIMESTAMP,
    next_rebuild TIMESTAMP,
    min_bloat_threshold NUMERIC DEFAULT 20.0,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to schedule automatic rebuilds
CREATE OR REPLACE FUNCTION schedule_index_rebuild(
    p_index_name TEXT,
    p_frequency INTERVAL DEFAULT '7 days',
    p_bloat_threshold NUMERIC DEFAULT 20.0,
    p_rebuild_type TEXT DEFAULT 'CONCURRENT'
) RETURNS TEXT AS $$
DECLARE
    table_name TEXT;
BEGIN
    -- Get table name
    SELECT tablename INTO table_name FROM pg_indexes WHERE indexname = p_index_name;

    IF table_name IS NULL THEN
        RETURN 'Index ' || p_index_name || ' not found';
    END IF;

    -- Insert or update schedule
    INSERT INTO rebuild_schedule (
        index_name, table_name, rebuild_type, schedule_frequency,
        next_rebuild, min_bloat_threshold
    ) VALUES (
        p_index_name, table_name, p_rebuild_type, p_frequency,
        CURRENT_TIMESTAMP + p_frequency, p_bloat_threshold
    )
    ON CONFLICT (index_name) DO UPDATE SET
        schedule_frequency = p_frequency,
        min_bloat_threshold = p_bloat_threshold,
        rebuild_type = p_rebuild_type,
        next_rebuild = CURRENT_TIMESTAMP + p_frequency,
        enabled = TRUE;

    RETURN 'Scheduled ' || p_rebuild_type || ' rebuild for ' || p_index_name || ' every ' || p_frequency;
END;
$$ LANGUAGE plpgsql;

-- Function to execute scheduled rebuilds
CREATE OR REPLACE FUNCTION execute_scheduled_rebuilds(
    dry_run BOOLEAN DEFAULT TRUE
) RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    current_bloat NUMERIC,
    rebuild_type TEXT,
    execution_status TEXT,
    duration INTERVAL
) AS $$
DECLARE
    schedule_record RECORD;
    current_bloat NUMERIC;
    start_time TIMESTAMP;
    rebuild_cmd TEXT;
BEGIN
    FOR schedule_record IN
        SELECT * FROM rebuild_schedule
        WHERE enabled = TRUE
        AND next_rebuild <= CURRENT_TIMESTAMP
        ORDER BY next_rebuild
    LOOP
        -- Check current bloat level
        BEGIN
            SELECT
                ROUND(100.0 * (pgs.dead_version_size + pgs.free_space) /
                      NULLIF(pgs.index_size, 0), 2)
            INTO current_bloat
            FROM pgstatindex(schedule_record.index_name) pgs;
        EXCEPTION WHEN OTHERS THEN
            current_bloat := 0;
        END;

        -- Skip if bloat is below threshold
        IF current_bloat < schedule_record.min_bloat_threshold THEN
            -- Update next rebuild time
            UPDATE rebuild_schedule
            SET next_rebuild = CURRENT_TIMESTAMP + schedule_frequency,
                last_rebuild = CURRENT_TIMESTAMP
            WHERE id = schedule_record.id;

            RETURN QUERY
            SELECT
                schedule_record.index_name::TEXT,
                schedule_record.table_name::TEXT,
                current_bloat,
                schedule_record.rebuild_type::TEXT,
                'SKIPPED - Below threshold'::TEXT,
                '0 seconds'::INTERVAL;
            CONTINUE;
        END IF;

        -- Build rebuild command
        rebuild_cmd := 'REINDEX INDEX';
        IF schedule_record.rebuild_type = 'CONCURRENT' THEN
            rebuild_cmd := rebuild_cmd || ' CONCURRENTLY';
        END IF;
        rebuild_cmd := rebuild_cmd || ' ' || schedule_record.index_name;

        start_time := clock_timestamp();

        IF dry_run THEN
            RETURN QUERY
            SELECT
                schedule_record.index_name::TEXT,
                schedule_record.table_name::TEXT,
                current_bloat,
                schedule_record.rebuild_type::TEXT,
                ('DRY RUN - Would execute: ' || rebuild_cmd)::TEXT,
                '0 seconds'::INTERVAL;
        ELSE
            -- Execute rebuild
            BEGIN
                EXECUTE rebuild_cmd;

                -- Update schedule
                UPDATE rebuild_schedule
                SET next_rebuild = CURRENT_TIMESTAMP + schedule_frequency,
                    last_rebuild = CURRENT_TIMESTAMP
                WHERE id = schedule_record.id;

                RETURN QUERY
                SELECT
                    schedule_record.index_name::TEXT,
                    schedule_record.table_name::TEXT,
                    current_bloat,
                    schedule_record.rebuild_type::TEXT,
                    'SUCCESS'::TEXT,
                    clock_timestamp() - start_time;

            EXCEPTION WHEN OTHERS THEN
                RETURN QUERY
                SELECT
                    schedule_record.index_name::TEXT,
                    schedule_record.table_name::TEXT,
                    current_bloat,
                    schedule_record.rebuild_type::TEXT,
                    ('ERROR: ' || SQLERRM)::TEXT,
                    clock_timestamp() - start_time;
            END;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule some indexes for automatic rebuild
SELECT schedule_index_rebuild('idx_demo_email', '3 days', 15.0, 'CONCURRENT');
SELECT schedule_index_rebuild('idx_demo_category', '1 week', 25.0, 'CONCURRENT');

-- View current schedule
SELECT
    index_name,
    table_name,
    rebuild_type,
    schedule_frequency,
    last_rebuild,
    next_rebuild,
    min_bloat_threshold || '%' as threshold,
    CASE enabled WHEN TRUE THEN 'Enabled' ELSE 'Disabled' END as status
FROM rebuild_schedule
ORDER BY next_rebuild;

-- Execute scheduled rebuilds (dry run)
SELECT * FROM execute_scheduled_rebuilds(true);
```

## Summary

**Index rebuilding** is a critical PostgreSQL maintenance operation that requires careful planning and execution:

**🔧 Rebuilding Methods:**

- **REINDEX INDEX**: Standard rebuild with table lock (fast but blocking)
- **REINDEX CONCURRENTLY**: Safe production rebuild (slower, non-blocking)
- **DROP/CREATE**: Maximum control with custom options
- **Selective rebuilding**: Automated condition-based rebuilding

**⚡ Key Considerations:**

- **Concurrent vs Standard**: Trade-off between safety and speed
- **Bloat thresholds**: Rebuild when dead space > 20-30%
- **Timing**: Use maintenance windows for standard REINDEX
- **Resource requirements**: 2x index size free space recommended

**📊 Monitoring Requirements:**

- **Progress tracking**: Monitor pg_stat_activity during rebuilds
- **Performance validation**: Test queries before/after rebuild
- **Bloat measurement**: Use pgstattuple for precise analysis
- **Resource monitoring**: Watch CPU, I/O, and disk usage

**🛡️ Production Best Practices:**

- **Always backup** index definitions before rebuilding
- **Use CONCURRENTLY** during business hours
- **Test in staging** environment first
- **Plan for 2-3x duration** with concurrent rebuilds
- **Monitor for blocking** queries and lock contention

**🎯 Automation Strategies:**

- **Scheduled rebuilds**: Automatic maintenance based on bloat thresholds
- **Health monitoring**: Continuous bloat and fragmentation tracking
- **Alerting systems**: Proactive notification of rebuild needs
- **Batch operations**: Efficient maintenance window utilization

**📋 Success Validation:**

- **Bloat reduction**: Verify dead space < 10% after rebuild
- **Performance improvement**: Test representative query performance
- **Statistics reset**: Expect usage counters to reset
- **Fragmentation reduction**: Check leaf fragmentation levels

Effective index rebuilding combines understanding of workload patterns, appropriate tool selection, and systematic monitoring to maintain optimal PostgreSQL performance while minimizing service disruption.
