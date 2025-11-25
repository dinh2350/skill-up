# What is the REINDEX Command?

The REINDEX command is PostgreSQL's primary tool for rebuilding indexes to eliminate bloat, recover from corruption, and restore optimal performance. This comprehensive guide explores all aspects of REINDEX, from basic syntax to advanced usage patterns, limitations, and integration with database maintenance workflows.

## REINDEX Command Overview

### 1. Basic Syntax and Purpose

```sql
-- Basic REINDEX syntax forms:
-- REINDEX INDEX index_name;
-- REINDEX TABLE table_name;
-- REINDEX SCHEMA schema_name;
-- REINDEX DATABASE database_name;
-- REINDEX SYSTEM database_name;

-- Create demonstration environment
CREATE TABLE reindex_demo (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    profile_data JSONB,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create various index types for demonstration
CREATE INDEX idx_reindex_email ON reindex_demo (email);
CREATE INDEX idx_reindex_created ON reindex_demo (created_at);
CREATE INDEX idx_reindex_username_lower ON reindex_demo (LOWER(username));
CREATE INDEX USING gin idx_reindex_profile ON reindex_demo USING GIN (profile_data);
CREATE INDEX USING gin idx_reindex_tags ON reindex_demo USING GIN (tags);
CREATE INDEX idx_reindex_partial ON reindex_demo (email) WHERE created_at >= '2024-01-01';

-- Insert sample data
INSERT INTO reindex_demo (username, email, profile_data, tags)
SELECT
    'user_' || generate_series(1,50000),
    'user' || generate_series(1,50000) || '@example.com',
    jsonb_build_object(
        'age', 18 + (random() * 50)::integer,
        'city', CASE (random() * 5)::integer
                    WHEN 0 THEN 'New York'
                    WHEN 1 THEN 'Los Angeles'
                    WHEN 2 THEN 'Chicago'
                    WHEN 3 THEN 'Houston'
                    ELSE 'Phoenix'
                END,
        'premium', random() > 0.7
    ),
    ARRAY[
        CASE (random() * 3)::integer WHEN 0 THEN 'tech' WHEN 1 THEN 'business' ELSE 'personal' END,
        CASE (random() * 3)::integer WHEN 0 THEN 'active' WHEN 1 THEN 'premium' ELSE 'new' END
    ];

-- Check initial index status
SELECT
    indexname,
    tablename,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE tablename = 'reindex_demo'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

### 2. REINDEX Command Variants

```sql
-- Variant 1: REINDEX INDEX - Single index rebuild
-- Most commonly used form for targeted maintenance
REINDEX INDEX idx_reindex_email;

-- Verify the rebuild
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size_after_reindex,
    (SELECT schemaname || '.' || tablename FROM pg_indexes WHERE indexname = 'idx_reindex_email') as table_location
FROM pg_indexes
WHERE indexname = 'idx_reindex_email';

-- Variant 2: REINDEX TABLE - All indexes on a table
-- Rebuilds all indexes including primary key and constraints
REINDEX TABLE reindex_demo;

-- Check all indexes after table reindex
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
    CASE
        WHEN indexname LIKE '%_pkey' THEN 'Primary Key'
        WHEN indexname LIKE '%_key' THEN 'Unique Constraint'
        ELSE 'Regular Index'
    END as index_type
FROM pg_indexes
WHERE tablename = 'reindex_demo'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Variant 3: REINDEX SCHEMA - All indexes in a schema
-- ⚠️ Use carefully - rebuilds ALL indexes in the schema
-- REINDEX SCHEMA public;  -- Uncomment with caution!

-- Show what would be affected by schema reindex
SELECT
    schemaname,
    COUNT(*) as total_indexes,
    COUNT(DISTINCT tablename) as tables_affected,
    pg_size_pretty(SUM(pg_relation_size(indexname::regclass))) as total_size
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname;

-- Variant 4: REINDEX DATABASE - All user indexes in database
-- ⚠️ EMERGENCY USE ONLY - rebuilds everything
-- REINDEX DATABASE current_database();  -- Extreme caution required!

-- Show scope of database reindex
SELECT
    'Database: ' || current_database() as scope,
    COUNT(*) as total_indexes,
    COUNT(DISTINCT schemaname || '.' || tablename) as total_tables,
    pg_size_pretty(SUM(pg_relation_size(indexname::regclass))) as total_index_size
FROM pg_indexes
WHERE schemaname NOT IN ('information_schema', 'pg_catalog');

-- Variant 5: REINDEX SYSTEM - System catalog indexes only
-- Used for system catalog corruption recovery
-- REINDEX SYSTEM current_database();  -- System maintenance only

-- Show system indexes that would be affected
SELECT
    schemaname,
    COUNT(*) as system_indexes,
    pg_size_pretty(SUM(pg_relation_size(indexname::regclass))) as system_index_size
FROM pg_indexes
WHERE schemaname IN ('pg_catalog', 'information_schema')
GROUP BY schemaname;
```

## REINDEX CONCURRENTLY (PostgreSQL 12+)

### 1. Concurrent Reindexing Syntax

```sql
-- PostgreSQL 12+ feature: Non-blocking reindex operations
-- REINDEX INDEX CONCURRENTLY index_name;
-- REINDEX TABLE CONCURRENTLY table_name;

-- Create bloat for demonstration
UPDATE reindex_demo
SET email = email || '.updated',
    profile_data = profile_data || '{"updated": true}',
    updated_at = CURRENT_TIMESTAMP
WHERE id % 4 = 0;  -- Update 25% of records

-- Concurrent single index reindex
REINDEX INDEX CONCURRENTLY idx_reindex_email;

-- Monitor concurrent reindex progress
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

-- Concurrent table reindex (all indexes)
REINDEX TABLE CONCURRENTLY reindex_demo;

-- Function to compare standard vs concurrent reindex performance
CREATE OR REPLACE FUNCTION compare_reindex_methods(
    test_index_name TEXT,
    table_name TEXT
) RETURNS TABLE(
    method TEXT,
    duration INTERVAL,
    blocking_behavior TEXT,
    resource_usage TEXT,
    recommendation TEXT
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    index_size BIGINT;
BEGIN
    -- Get index size for context
    index_size := pg_relation_size(test_index_name::regclass);

    -- Note: This function demonstrates concepts - actual timing would vary
    RETURN QUERY VALUES
    ('Standard REINDEX',
     '00:02:30'::INTERVAL,  -- Faster execution
     'BLOCKING - Exclusive lock on table',
     'High CPU/IO burst, blocks all operations',
     CASE WHEN index_size > 100*1024*1024 THEN 'Use only in maintenance windows'
          ELSE 'Acceptable for smaller indexes' END),
    ('REINDEX CONCURRENTLY',
     '00:06:45'::INTERVAL,  -- 2-3x longer
     'NON-BLOCKING - Allows concurrent operations',
     'Sustained moderate CPU/IO usage',
     'Preferred for production environments');
END;
$$ LANGUAGE plpgsql;

-- Compare methods for our demo index
SELECT * FROM compare_reindex_methods('idx_reindex_email', 'reindex_demo');
```

### 2. Concurrent Reindex Limitations and Considerations

```sql
-- Demonstration of CONCURRENTLY limitations

-- Limitation 1: Cannot be run inside a transaction block
BEGIN;
-- This will fail:
-- REINDEX INDEX CONCURRENTLY idx_reindex_created;
-- ERROR: REINDEX CONCURRENTLY cannot run inside a transaction block
ROLLBACK;

-- Limitation 2: Cannot be used on system catalogs
-- This will fail:
-- REINDEX INDEX CONCURRENTLY pg_class_oid_index;
-- ERROR: cannot reindex system catalogs concurrently

-- Limitation 3: Cannot be used on shared relations
-- Cannot demonstrate easily, but applies to shared system tables

-- Function to check if an index is eligible for concurrent reindex
CREATE OR REPLACE FUNCTION check_concurrent_reindex_eligibility(index_name TEXT)
RETURNS TABLE(
    check_name TEXT,
    eligible BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    index_info RECORD;
BEGIN
    -- Get index information
    SELECT
        i.schemaname,
        i.tablename,
        i.indexdef,
        c.relkind,
        c.relisshared,
        n.nspname
    INTO index_info
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE i.indexname = index_name;

    IF index_info IS NULL THEN
        RETURN QUERY SELECT 'Index Existence'::TEXT, FALSE, 'Index not found'::TEXT;
        RETURN;
    END IF;

    -- Check if it exists
    RETURN QUERY SELECT 'Index Exists'::TEXT, TRUE, 'Index found'::TEXT;

    -- Check if it's a system catalog
    RETURN QUERY SELECT
        'System Catalog Check'::TEXT,
        index_info.nspname NOT IN ('pg_catalog', 'information_schema'),
        CASE WHEN index_info.nspname IN ('pg_catalog', 'information_schema')
             THEN 'System catalog indexes cannot use CONCURRENTLY'
             ELSE 'Not a system catalog - eligible' END;

    -- Check if it's shared
    RETURN QUERY SELECT
        'Shared Relation Check'::TEXT,
        NOT COALESCE(index_info.relisshared, FALSE),
        CASE WHEN COALESCE(index_info.relisshared, FALSE)
             THEN 'Shared relations cannot use CONCURRENTLY'
             ELSE 'Not shared - eligible' END;

    -- Check PostgreSQL version (for demonstration)
    RETURN QUERY SELECT
        'Version Support'::TEXT,
        current_setting('server_version_num')::INTEGER >= 120000,
        CASE WHEN current_setting('server_version_num')::INTEGER >= 120000
             THEN 'PostgreSQL 12+ supports CONCURRENTLY'
             ELSE 'Requires PostgreSQL 12 or later' END;
END;
$$ LANGUAGE plpgsql;

-- Check eligibility for our indexes
SELECT * FROM check_concurrent_reindex_eligibility('idx_reindex_email');
SELECT * FROM check_concurrent_reindex_eligibility('idx_reindex_profile');

-- Monitor for failed concurrent operations
SELECT
    schemaname,
    tablename,
    indexname,
    CASE
        WHEN indisvalid THEN 'VALID'
        ELSE 'INVALID - Concurrent operation failed'
    END as status,
    CASE
        WHEN NOT indisvalid THEN 'DROP INDEX CONCURRENTLY ' || indexname || ';'
        ELSE 'No action needed'
    END as cleanup_command
FROM pg_indexes
JOIN pg_index ON indexrelid = (schemaname||'.'||indexname)::regclass
WHERE tablename = 'reindex_demo';
```

## Index-Specific REINDEX Behavior

### 1. Different Index Types and REINDEX

```sql
-- REINDEX behavior varies by index type
CREATE EXTENSION IF NOT EXISTS pgstattuple;

-- Function to demonstrate REINDEX effects on different index types
CREATE OR REPLACE FUNCTION analyze_reindex_by_type()
RETURNS TABLE(
    index_name TEXT,
    index_type TEXT,
    size_before TEXT,
    size_after TEXT,
    rebuild_impact TEXT,
    special_considerations TEXT
) AS $$
DECLARE
    index_record RECORD;
    size_before BIGINT;
    size_after BIGINT;
    index_type_name TEXT;
BEGIN
    FOR index_record IN
        SELECT
            i.indexname,
            i.indexdef,
            am.amname as access_method
        FROM pg_indexes i
        JOIN pg_class c ON c.relname = i.indexname
        JOIN pg_am am ON c.relam = am.oid
        WHERE i.tablename = 'reindex_demo'
        AND i.indexname != 'reindex_demo_pkey'  -- Skip primary key for this demo
    LOOP
        -- Record size before
        size_before := pg_relation_size(index_record.indexname::regclass);

        -- Determine index type
        index_type_name := CASE
            WHEN index_record.access_method = 'btree' THEN 'B-tree'
            WHEN index_record.access_method = 'gin' THEN 'GIN'
            WHEN index_record.access_method = 'gist' THEN 'GiST'
            WHEN index_record.access_method = 'hash' THEN 'Hash'
            WHEN index_record.access_method = 'brin' THEN 'BRIN'
            ELSE 'Other'
        END;

        -- Perform REINDEX
        BEGIN
            EXECUTE 'REINDEX INDEX ' || index_record.indexname;
            size_after := pg_relation_size(index_record.indexname::regclass);
        EXCEPTION WHEN OTHERS THEN
            size_after := size_before;  -- No change if failed
        END;

        RETURN QUERY
        SELECT
            index_record.indexname::TEXT,
            index_type_name::TEXT,
            pg_size_pretty(size_before),
            pg_size_pretty(size_after),
            CASE
                WHEN size_after < size_before THEN 'Size reduced by ' || pg_size_pretty(size_before - size_after)
                WHEN size_after > size_before THEN 'Size increased by ' || pg_size_pretty(size_after - size_before)
                ELSE 'No size change'
            END::TEXT,
            CASE index_type_name
                WHEN 'B-tree' THEN 'Most common, good bloat reduction'
                WHEN 'GIN' THEN 'May have pending list cleanup effects'
                WHEN 'GiST' THEN 'Rebuilds R-tree structure'
                WHEN 'Hash' THEN 'Rebuilds hash buckets'
                WHEN 'BRIN' THEN 'Rebuilds block range summaries'
                ELSE 'Varies by implementation'
            END::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Analyze REINDEX effects by index type
SELECT * FROM analyze_reindex_by_type();

-- Special considerations for GIN indexes
-- GIN indexes have a "pending list" that affects REINDEX behavior
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as total_size,
    CASE
        WHEN indexdef LIKE '%gin%' THEN 'GIN index - may have pending insertions'
        ELSE 'Non-GIN index'
    END as gin_notes
FROM pg_indexes
WHERE tablename = 'reindex_demo'
AND indexname LIKE '%gin%';

-- For GIN indexes, check pending list size
CREATE OR REPLACE FUNCTION check_gin_pending_list(gin_index_name TEXT)
RETURNS TABLE(
    index_name TEXT,
    pending_pages INTEGER,
    pending_tuples BIGINT,
    recommendations TEXT
) AS $$
DECLARE
    gin_stats RECORD;
BEGIN
    BEGIN
        SELECT * INTO gin_stats FROM pgstatginindex(gin_index_name);

        RETURN QUERY
        SELECT
            gin_index_name::TEXT,
            gin_stats.pending_pages::INTEGER,
            gin_stats.pending_tuples::BIGINT,
            CASE
                WHEN gin_stats.pending_pages > 100 THEN 'REINDEX will consolidate large pending list'
                WHEN gin_stats.pending_pages > 10 THEN 'REINDEX will provide moderate cleanup'
                ELSE 'REINDEX will have minimal pending list impact'
            END::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT gin_index_name::TEXT, 0::INTEGER, 0::BIGINT, 'Cannot analyze - not a GIN index or error occurred'::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- Check GIN index pending lists
SELECT * FROM check_gin_pending_list('idx_reindex_profile');
SELECT * FROM check_gin_pending_list('idx_reindex_tags');
```

### 2. Constraint-Supporting Indexes

```sql
-- REINDEX behavior with constraint-supporting indexes
-- These indexes cannot be dropped but can be rebuilt

-- Check which indexes support constraints
SELECT
    i.indexname,
    i.tablename,
    c.conname as constraint_name,
    CASE c.contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'x' THEN 'EXCLUSION'
        ELSE 'OTHER'
    END as constraint_type,
    c.conindid::regclass as supporting_index
FROM pg_indexes i
JOIN pg_constraint c ON c.conindid = i.indexname::regclass
WHERE i.tablename = 'reindex_demo'
ORDER BY i.indexname;

-- REINDEX works on constraint-supporting indexes
REINDEX INDEX reindex_demo_pkey;  -- Primary key index
REINDEX INDEX reindex_demo_username_key;  -- Unique constraint index

-- Function to identify and safely reindex constraint indexes
CREATE OR REPLACE FUNCTION reindex_constraint_indexes(
    table_name TEXT,
    concurrent BOOLEAN DEFAULT TRUE
) RETURNS TABLE(
    constraint_name TEXT,
    constraint_type TEXT,
    index_name TEXT,
    reindex_command TEXT,
    execution_status TEXT
) AS $$
DECLARE
    constraint_record RECORD;
    reindex_cmd TEXT;
BEGIN
    FOR constraint_record IN
        SELECT
            c.conname,
            CASE c.contype
                WHEN 'p' THEN 'PRIMARY KEY'
                WHEN 'u' THEN 'UNIQUE'
                WHEN 'x' THEN 'EXCLUSION'
                ELSE 'OTHER'
            END as con_type,
            c.conindid::regclass::text as idx_name
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = table_name
        AND c.contype IN ('p', 'u', 'x')  -- Primary, Unique, Exclusion
    LOOP
        -- Build REINDEX command
        reindex_cmd := 'REINDEX INDEX';
        IF concurrent THEN
            reindex_cmd := reindex_cmd || ' CONCURRENTLY';
        END IF;
        reindex_cmd := reindex_cmd || ' ' || constraint_record.idx_name;

        RETURN QUERY
        SELECT
            constraint_record.conname::TEXT,
            constraint_record.con_type::TEXT,
            constraint_record.idx_name::TEXT,
            reindex_cmd::TEXT,
            'Ready for execution'::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Identify constraint indexes for reindexing
SELECT * FROM reindex_constraint_indexes('reindex_demo', true);
```

## Performance and Resource Considerations

### 1. Resource Usage Monitoring

```sql
-- Function to monitor REINDEX resource usage
CREATE OR REPLACE FUNCTION monitor_reindex_resources()
RETURNS TABLE(
    metric_name TEXT,
    current_value TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check maintenance_work_mem setting
    RETURN QUERY
    SELECT
        'maintenance_work_mem'::TEXT,
        current_setting('maintenance_work_mem'),
        CASE
            WHEN current_setting('maintenance_work_mem')::TEXT ~ '^[0-9]+kB$'
                 AND current_setting('maintenance_work_mem')::TEXT::INTEGER < 256000
            THEN 'Consider increasing for large index rebuilds: SET maintenance_work_mem = ''1GB'';'
            ELSE 'Current setting adequate for REINDEX operations'
        END;

    -- Check max_parallel_workers_maintenance
    RETURN QUERY
    SELECT
        'max_parallel_workers_maintenance'::TEXT,
        current_setting('max_parallel_workers_maintenance'),
        CASE
            WHEN current_setting('max_parallel_workers_maintenance')::INTEGER = 0
            THEN 'Consider enabling parallel workers for large index rebuilds'
            ELSE 'Parallel maintenance workers available'
        END;

    -- Check current database connections
    RETURN QUERY
    SELECT
        'Active Connections'::TEXT,
        (SELECT COUNT(*)::TEXT FROM pg_stat_activity WHERE state = 'active'),
        CASE
            WHEN (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') > 50
            THEN 'High activity - consider REINDEX CONCURRENTLY'
            ELSE 'Normal activity level'
        END;

    -- Check for long-running transactions
    RETURN QUERY
    SELECT
        'Long-running Transactions'::TEXT,
        (SELECT COUNT(*)::TEXT FROM pg_stat_activity
         WHERE state = 'active'
         AND NOW() - query_start > INTERVAL '30 minutes'),
        CASE
            WHEN EXISTS (SELECT 1 FROM pg_stat_activity
                        WHERE state = 'active'
                        AND NOW() - query_start > INTERVAL '30 minutes')
            THEN 'Long transactions may interfere with REINDEX'
            ELSE 'No problematic long transactions'
        END;
END;
$$ LANGUAGE plpgsql;

-- Check current resource status for REINDEX
SELECT * FROM monitor_reindex_resources();

-- Function to estimate REINDEX duration and resource needs
CREATE OR REPLACE FUNCTION estimate_reindex_requirements(
    target_index TEXT
) RETURNS TABLE(
    requirement_type TEXT,
    estimated_value TEXT,
    configuration_advice TEXT
) AS $$
DECLARE
    index_size BIGINT;
    table_name TEXT;
    index_type TEXT;
BEGIN
    -- Get index information
    SELECT
        pg_relation_size(s.indexrelid),
        i.tablename,
        am.amname
    INTO index_size, table_name, index_type
    FROM pg_stat_user_indexes s
    JOIN pg_indexes i ON s.indexname = i.indexname
    JOIN pg_class c ON c.relname = s.indexname
    JOIN pg_am am ON c.relam = am.oid
    WHERE s.indexname = target_index;

    IF index_size IS NULL THEN
        RETURN QUERY SELECT 'Error'::TEXT, 'Index not found'::TEXT, 'Verify index name'::TEXT;
        RETURN;
    END IF;

    -- Estimate duration (rough approximations)
    RETURN QUERY
    SELECT
        'Estimated Duration (Standard)'::TEXT,
        CASE
            WHEN index_size < 100 * 1024 * 1024 THEN '1-5 minutes'
            WHEN index_size < 1024 * 1024 * 1024 THEN '5-30 minutes'
            ELSE '30+ minutes'
        END::TEXT,
        'Standard REINDEX is faster but blocks table access'::TEXT;

    RETURN QUERY
    SELECT
        'Estimated Duration (Concurrent)'::TEXT,
        CASE
            WHEN index_size < 100 * 1024 * 1024 THEN '3-15 minutes'
            WHEN index_size < 1024 * 1024 * 1024 THEN '15-90 minutes'
            ELSE '90+ minutes'
        END::TEXT,
        'CONCURRENT is 2-3x slower but allows concurrent access'::TEXT;

    -- Estimate space requirements
    RETURN QUERY
    SELECT
        'Temporary Space Needed'::TEXT,
        pg_size_pretty(index_size * 2),  -- Rough estimate: 2x index size
        'Ensure adequate free disk space before starting'::TEXT;

    -- Memory recommendations
    RETURN QUERY
    SELECT
        'Recommended maintenance_work_mem'::TEXT,
        CASE
            WHEN index_size < 100 * 1024 * 1024 THEN '256MB'
            WHEN index_size < 1024 * 1024 * 1024 THEN '1GB'
            ELSE '2GB+'
        END::TEXT,
        'SET maintenance_work_mem = ''<value>'' before REINDEX'::TEXT;

    -- Index type specific advice
    RETURN QUERY
    SELECT
        'Index Type Considerations'::TEXT,
        'Type: ' || index_type,
        CASE index_type
            WHEN 'btree' THEN 'B-tree indexes benefit most from REINDEX'
            WHEN 'gin' THEN 'GIN indexes may have significant pending list cleanup'
            WHEN 'gist' THEN 'GiST indexes rebuild spatial/geometric structure'
            WHEN 'hash' THEN 'Hash indexes rebuild bucket structure'
            WHEN 'brin' THEN 'BRIN indexes rebuild block range summaries'
            ELSE 'Consult documentation for this index type'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Get estimates for our demo indexes
SELECT * FROM estimate_reindex_requirements('idx_reindex_email');
SELECT * FROM estimate_reindex_requirements('idx_reindex_profile');
```

### 2. Optimizing REINDEX Performance

```sql
-- Performance optimization techniques for REINDEX

-- Technique 1: Adjust session parameters for REINDEX
CREATE OR REPLACE FUNCTION optimize_reindex_session()
RETURNS TEXT AS $$
BEGIN
    -- Increase work memory for large sorts
    PERFORM set_config('maintenance_work_mem', '1GB', false);

    -- Enable parallel workers if available
    PERFORM set_config('max_parallel_maintenance_workers', '4', false);

    -- Reduce checkpoint frequency impact
    PERFORM set_config('checkpoint_completion_target', '0.9', false);

    -- Increase WAL buffers if doing multiple reindex operations
    -- Note: This requires superuser and often a restart
    -- PERFORM set_config('wal_buffers', '16MB', false);

    RETURN 'Session optimized for REINDEX operations. Settings: ' ||
           'maintenance_work_mem=' || current_setting('maintenance_work_mem') || ', ' ||
           'max_parallel_maintenance_workers=' || current_setting('max_parallel_maintenance_workers');
END;
$$ LANGUAGE plpgsql;

-- Apply optimizations
SELECT optimize_reindex_session();

-- Technique 2: Batch REINDEX operations efficiently
CREATE OR REPLACE FUNCTION batch_reindex_optimized(
    schema_name TEXT DEFAULT 'public',
    batch_size INTEGER DEFAULT 5,
    pause_between_batches INTERVAL DEFAULT '30 seconds'
) RETURNS TABLE(
    batch_number INTEGER,
    index_name TEXT,
    table_name TEXT,
    size_before TEXT,
    duration INTERVAL,
    status TEXT
) AS $$
DECLARE
    index_record RECORD;
    batch_count INTEGER := 0;
    current_batch INTEGER := 1;
    start_time TIMESTAMP;
    size_before BIGINT;
BEGIN
    -- Set optimal session parameters
    PERFORM set_config('maintenance_work_mem', '1GB', false);

    FOR index_record IN
        SELECT
            i.indexname,
            i.tablename,
            pg_relation_size(s.indexrelid) as index_size
        FROM pg_indexes i
        JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
        WHERE i.schemaname = schema_name
        AND pg_relation_size(s.indexrelid) > 10 * 1024 * 1024  -- > 10MB
        ORDER BY pg_relation_size(s.indexrelid) DESC  -- Largest first
    LOOP
        -- Check if we need to start a new batch
        IF batch_count >= batch_size THEN
            -- Pause between batches
            PERFORM pg_sleep(EXTRACT(EPOCH FROM pause_between_batches));
            batch_count := 0;
            current_batch := current_batch + 1;
        END IF;

        size_before := index_record.index_size;
        start_time := clock_timestamp();

        BEGIN
            EXECUTE 'REINDEX INDEX CONCURRENTLY ' || index_record.indexname;

            RETURN QUERY
            SELECT
                current_batch,
                index_record.indexname::TEXT,
                index_record.tablename::TEXT,
                pg_size_pretty(size_before),
                clock_timestamp() - start_time,
                'SUCCESS'::TEXT;

        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY
            SELECT
                current_batch,
                index_record.indexname::TEXT,
                index_record.tablename::TEXT,
                pg_size_pretty(size_before),
                clock_timestamp() - start_time,
                ('ERROR: ' || SQLERRM)::TEXT;
        END;

        batch_count := batch_count + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute optimized batch REINDEX (example - adjust parameters as needed)
-- SELECT * FROM batch_reindex_optimized('public', 3, '10 seconds');
```

## Error Handling and Recovery

### 1. Common REINDEX Errors and Solutions

```sql
-- Function to diagnose common REINDEX problems
CREATE OR REPLACE FUNCTION diagnose_reindex_issues(index_name TEXT)
RETURNS TABLE(
    issue_category TEXT,
    problem_description TEXT,
    solution TEXT,
    prevention TEXT
) AS $$
DECLARE
    table_name TEXT;
    index_size BIGINT;
    schema_name TEXT;
BEGIN
    -- Get index information
    SELECT
        i.tablename,
        i.schemaname,
        pg_relation_size(s.indexrelid)
    INTO table_name, schema_name, index_size
    FROM pg_indexes i
    LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
    WHERE i.indexname = index_name;

    -- Issue 1: Index doesn't exist
    IF table_name IS NULL THEN
        RETURN QUERY VALUES
        ('Index Existence',
         'Index ' || index_name || ' not found',
         'Verify index name with: SELECT indexname FROM pg_indexes WHERE indexname LIKE ''%pattern%''',
         'Use consistent naming conventions and documentation');
        RETURN;
    END IF;

    -- Issue 2: Insufficient disk space
    RETURN QUERY VALUES
    ('Disk Space',
     'REINDEX requires up to 2x index size in temporary space',
     'Ensure ' || pg_size_pretty(index_size * 2) || ' free space available',
     'Monitor disk usage and plan maintenance during low-usage periods');

    -- Issue 3: Long-running transactions blocking REINDEX
    RETURN QUERY VALUES
    ('Blocking Transactions',
     CASE WHEN EXISTS (
         SELECT 1 FROM pg_stat_activity
         WHERE state IN ('idle in transaction', 'active')
         AND NOW() - query_start > INTERVAL '1 hour'
     ) THEN 'Long-running transactions detected'
     ELSE 'No problematic long transactions' END,
     CASE WHEN EXISTS (
         SELECT 1 FROM pg_stat_activity
         WHERE state IN ('idle in transaction', 'active')
         AND NOW() - query_start > INTERVAL '1 hour'
     ) THEN 'Consider REINDEX CONCURRENTLY or terminate blocking transactions'
     ELSE 'No action needed' END,
     'Set statement_timeout and idle_in_transaction_session_timeout');

    -- Issue 4: Memory limitations
    RETURN QUERY VALUES
    ('Memory Configuration',
     'Current maintenance_work_mem: ' || current_setting('maintenance_work_mem'),
     CASE
         WHEN index_size > 1024*1024*1024 AND current_setting('maintenance_work_mem') ~ '^[0-9]+[kK]B$'
         THEN 'Increase maintenance_work_mem to 1-2GB for large indexes'
         ELSE 'Current memory setting adequate'
     END,
     'Set appropriate maintenance_work_mem based on index sizes');

    -- Issue 5: Concurrent REINDEX limitations
    RETURN QUERY VALUES
    ('Concurrent Limitations',
     CASE
         WHEN current_setting('server_version_num')::INTEGER < 120000
         THEN 'PostgreSQL version does not support REINDEX CONCURRENTLY'
         WHEN schema_name IN ('pg_catalog', 'information_schema')
         THEN 'System catalog indexes cannot use CONCURRENTLY'
         ELSE 'CONCURRENTLY is available for this index'
     END,
     CASE
         WHEN current_setting('server_version_num')::INTEGER < 120000
         THEN 'Upgrade to PostgreSQL 12+ or use standard REINDEX in maintenance windows'
         WHEN schema_name IN ('pg_catalog', 'information_schema')
         THEN 'Use standard REINDEX during maintenance windows'
         ELSE 'Can use REINDEX CONCURRENTLY for production safety'
     END,
     'Plan index maintenance strategy based on PostgreSQL version and index types');
END;
$$ LANGUAGE plpgsql;

-- Diagnose potential issues
SELECT * FROM diagnose_reindex_issues('idx_reindex_email');
SELECT * FROM diagnose_reindex_issues('nonexistent_index');

-- Error recovery procedures
CREATE OR REPLACE FUNCTION reindex_with_error_recovery(
    target_index TEXT,
    max_retries INTEGER DEFAULT 3,
    concurrent BOOLEAN DEFAULT TRUE
) RETURNS TABLE(
    attempt INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status TEXT,
    error_message TEXT,
    next_action TEXT
) AS $$
DECLARE
    attempt_num INTEGER := 1;
    start_ts TIMESTAMP;
    end_ts TIMESTAMP;
    reindex_cmd TEXT;
    success BOOLEAN := FALSE;
    error_msg TEXT;
BEGIN
    -- Build REINDEX command
    reindex_cmd := 'REINDEX INDEX';
    IF concurrent THEN
        reindex_cmd := reindex_cmd || ' CONCURRENTLY';
    END IF;
    reindex_cmd := reindex_cmd || ' ' || target_index;

    WHILE attempt_num <= max_retries AND NOT success LOOP
        start_ts := clock_timestamp();
        error_msg := NULL;

        BEGIN
            -- Attempt REINDEX
            EXECUTE reindex_cmd;
            end_ts := clock_timestamp();
            success := TRUE;

            RETURN QUERY
            SELECT
                attempt_num,
                start_ts,
                end_ts,
                'SUCCESS'::TEXT,
                ''::TEXT,
                'REINDEX completed successfully'::TEXT;

        EXCEPTION
            WHEN lock_not_available THEN
                end_ts := clock_timestamp();
                error_msg := 'Lock timeout - ' || SQLERRM;

                RETURN QUERY
                SELECT
                    attempt_num,
                    start_ts,
                    end_ts,
                    'RETRY_NEEDED'::TEXT,
                    error_msg::TEXT,
                    CASE
                        WHEN attempt_num < max_retries THEN 'Will retry with longer timeout'
                        ELSE 'Consider running during maintenance window'
                    END::TEXT;

            WHEN insufficient_resources THEN
                end_ts := clock_timestamp();
                error_msg := 'Insufficient resources - ' || SQLERRM;

                RETURN QUERY
                SELECT
                    attempt_num,
                    start_ts,
                    end_ts,
                    'RESOURCE_ERROR'::TEXT,
                    error_msg::TEXT,
                    'Free up disk space or increase maintenance_work_mem'::TEXT;
                RETURN;  -- Don't retry resource errors

            WHEN OTHERS THEN
                end_ts := clock_timestamp();
                error_msg := SQLERRM;

                RETURN QUERY
                SELECT
                    attempt_num,
                    start_ts,
                    end_ts,
                    'ERROR'::TEXT,
                    error_msg::TEXT,
                    CASE
                        WHEN attempt_num < max_retries THEN 'Will retry'
                        ELSE 'Manual intervention required'
                    END::TEXT;
        END;

        -- Wait before retry
        IF NOT success AND attempt_num < max_retries THEN
            PERFORM pg_sleep(30);  -- 30 second pause between attempts
        END IF;

        attempt_num := attempt_num + 1;
    END LOOP;

    -- If we exit the loop without success
    IF NOT success THEN
        RETURN QUERY
        SELECT
            max_retries + 1,
            NULL::TIMESTAMP,
            NULL::TIMESTAMP,
            'FAILED'::TEXT,
            'Max retries exceeded'::TEXT,
            'Manual diagnosis and intervention required'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Example of error-resistant REINDEX
-- SELECT * FROM reindex_with_error_recovery('idx_reindex_created', 2, true);
```

## Integration with Database Maintenance

### 1. REINDEX in Maintenance Workflows

```sql
-- Comprehensive maintenance workflow including REINDEX
CREATE OR REPLACE FUNCTION maintenance_workflow_with_reindex(
    target_schema TEXT DEFAULT 'public',
    maintenance_window_hours INTEGER DEFAULT 4
) RETURNS TABLE(
    phase TEXT,
    operation TEXT,
    target_object TEXT,
    duration INTERVAL,
    status TEXT,
    details TEXT
) AS $$
DECLARE
    workflow_start TIMESTAMP := clock_timestamp();
    phase_start TIMESTAMP;
    index_record RECORD;
    operation_count INTEGER := 0;
BEGIN
    -- Phase 1: Pre-maintenance analysis
    phase_start := clock_timestamp();

    RETURN QUERY
    SELECT
        'ANALYSIS'::TEXT,
        'Identify bloated indexes'::TEXT,
        target_schema::TEXT,
        clock_timestamp() - phase_start,
        'COMPLETED'::TEXT,
        (SELECT COUNT(*)::TEXT || ' indexes need attention'
         FROM pg_indexes i
         JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
         WHERE i.schemaname = target_schema
         AND pg_relation_size(s.indexrelid) > 10 * 1024 * 1024) AS details;

    -- Phase 2: VACUUM before REINDEX (cleans up dead tuples first)
    FOR index_record IN
        SELECT DISTINCT i.tablename
        FROM pg_indexes i
        JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
        WHERE i.schemaname = target_schema
        AND pg_relation_size(s.indexrelid) > 50 * 1024 * 1024  -- Large indexes only
    LOOP
        phase_start := clock_timestamp();

        BEGIN
            EXECUTE 'VACUUM ANALYZE ' || index_record.tablename;

            RETURN QUERY
            SELECT
                'VACUUM'::TEXT,
                'VACUUM ANALYZE'::TEXT,
                index_record.tablename::TEXT,
                clock_timestamp() - phase_start,
                'COMPLETED'::TEXT,
                'Table cleaned before index rebuild'::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY
            SELECT
                'VACUUM'::TEXT,
                'VACUUM ANALYZE'::TEXT,
                index_record.tablename::TEXT,
                clock_timestamp() - phase_start,
                'ERROR'::TEXT,
                SQLERRM::TEXT;
        END;

        -- Check if we're within maintenance window
        IF (clock_timestamp() - workflow_start) > (maintenance_window_hours || ' hours')::INTERVAL THEN
            RETURN QUERY
            SELECT
                'TIMEOUT'::TEXT,
                'Maintenance window exceeded'::TEXT,
                'N/A'::TEXT,
                clock_timestamp() - workflow_start,
                'STOPPED'::TEXT,
                'Remaining operations postponed'::TEXT;
            RETURN;
        END IF;
    END LOOP;

    -- Phase 3: REINDEX operations
    FOR index_record IN
        SELECT
            i.indexname,
            i.tablename,
            pg_relation_size(s.indexrelid) as size
        FROM pg_indexes i
        JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
        WHERE i.schemaname = target_schema
        AND pg_relation_size(s.indexrelid) > 10 * 1024 * 1024
        ORDER BY pg_relation_size(s.indexrelid) DESC  -- Largest first
    LOOP
        phase_start := clock_timestamp();

        BEGIN
            EXECUTE 'REINDEX INDEX CONCURRENTLY ' || index_record.indexname;

            RETURN QUERY
            SELECT
                'REINDEX'::TEXT,
                'REINDEX CONCURRENTLY'::TEXT,
                index_record.indexname::TEXT,
                clock_timestamp() - phase_start,
                'COMPLETED'::TEXT,
                'Size: ' || pg_size_pretty(index_record.size)::TEXT;

        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY
            SELECT
                'REINDEX'::TEXT,
                'REINDEX CONCURRENTLY'::TEXT,
                index_record.indexname::TEXT,
                clock_timestamp() - phase_start,
                'ERROR'::TEXT,
                SQLERRM::TEXT;
        END;

        operation_count := operation_count + 1;

        -- Brief pause between operations
        PERFORM pg_sleep(1);

        -- Check maintenance window
        IF (clock_timestamp() - workflow_start) > (maintenance_window_hours || ' hours')::INTERVAL THEN
            RETURN QUERY
            SELECT
                'TIMEOUT'::TEXT,
                'Maintenance window exceeded'::TEXT,
                operation_count::TEXT || ' operations completed',
                clock_timestamp() - workflow_start,
                'PARTIAL'::TEXT,
                'Schedule continuation for next window'::TEXT;
            RETURN;
        END IF;
    END LOOP;

    -- Phase 4: Post-maintenance statistics update
    phase_start := clock_timestamp();

    EXECUTE 'ANALYZE';

    RETURN QUERY
    SELECT
        'FINALIZE'::TEXT,
        'Update statistics'::TEXT,
        'Database-wide'::TEXT,
        clock_timestamp() - phase_start,
        'COMPLETED'::TEXT,
        'Statistics updated for all tables'::TEXT;

    -- Summary
    RETURN QUERY
    SELECT
        'SUMMARY'::TEXT,
        'Total maintenance time'::TEXT,
        operation_count::TEXT || ' indexes processed',
        clock_timestamp() - workflow_start,
        'COMPLETED'::TEXT,
        'Maintenance workflow finished successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Execute maintenance workflow (dry run concept)
-- SELECT * FROM maintenance_workflow_with_reindex('public', 2);
```

## Summary

**The REINDEX command** is PostgreSQL's primary index rebuilding tool with multiple variants and important operational considerations:

**🔧 REINDEX Variants:**

- **REINDEX INDEX**: Single index rebuild (most common)
- **REINDEX TABLE**: All indexes on a table
- **REINDEX SCHEMA**: All indexes in a schema (use with caution)
- **REINDEX DATABASE**: All user indexes (emergency use only)
- **REINDEX SYSTEM**: System catalog indexes only

**⚡ REINDEX CONCURRENTLY (PostgreSQL 12+):**

- **Non-blocking**: Allows concurrent table access during rebuild
- **Longer duration**: 2-3x slower than standard REINDEX
- **Limitations**: Cannot be used in transactions, on system catalogs, or shared relations
- **Production safe**: Preferred for business-hours maintenance

**🎯 When to Use REINDEX:**

- **Index bloat** > 20-30% dead space
- **Performance degradation** from fragmented indexes
- **Corruption recovery** after system issues
- **Regular maintenance** to prevent bloat accumulation

**📊 Resource Considerations:**

- **Memory**: Increase maintenance_work_mem for large indexes
- **Disk space**: Requires up to 2x index size temporary space
- **Duration**: Varies by index size and type (minutes to hours)
- **Locking**: Standard REINDEX blocks, CONCURRENTLY allows access

**🛡️ Best Practices:**

- **Use CONCURRENTLY** for production environments during business hours
- **Schedule standard REINDEX** during maintenance windows for speed
- **Monitor resource usage** and long-running transactions
- **Test in staging** before production maintenance
- **Document and automate** regular maintenance procedures

**🔍 Error Handling:**

- **Diagnose issues**: Check disk space, memory, and blocking transactions
- **Retry mechanisms**: Handle temporary failures gracefully
- **Recovery procedures**: Clean up failed concurrent operations
- **Monitoring**: Track progress and validate results

**📋 Integration Points:**

- **VACUUM**: Clean dead tuples before REINDEX for better results
- **ANALYZE**: Update statistics after rebuild
- **Monitoring**: Integrate with alerting and maintenance systems
- **Automation**: Schedule based on bloat thresholds and usage patterns

The REINDEX command is essential for PostgreSQL maintenance but requires careful planning, appropriate timing, and understanding of its variants to use effectively in production environments.
