# How Do You Drop an Index?

Dropping indexes in PostgreSQL involves several considerations including syntax options, safety checks, concurrent operations, and understanding the impact on database performance. This comprehensive guide covers all aspects of safely removing indexes from production systems.

## Basic Index Drop Syntax

### 1. Standard DROP INDEX Statement

```sql
-- Basic syntax
DROP INDEX index_name;

-- Drop index with schema qualification
DROP INDEX schema_name.index_name;

-- Practical examples
-- First, let's see existing indexes
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename = 'customers'
AND schemaname = 'public'
ORDER BY indexname;

-- Drop specific indexes
DROP INDEX idx_customers_email;
DROP INDEX idx_customers_phone;
DROP INDEX idx_customers_region_status;
```

### 2. Safety Checks Before Dropping

```sql
-- Check if index exists before attempting to drop
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_customers_email'
        AND schemaname = 'public'
    ) THEN
        DROP INDEX idx_customers_email;
        RAISE NOTICE 'Index idx_customers_email dropped successfully';
    ELSE
        RAISE NOTICE 'Index idx_customers_email does not exist';
    END IF;
END $$;

-- Alternative: Use IF EXISTS clause
DROP INDEX IF EXISTS idx_customers_email;
DROP INDEX IF EXISTS public.idx_customers_region;

-- Check index usage before dropping
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE indexname = 'idx_customers_email';

-- Verify the index is truly unused
SELECT
    indexname,
    idx_scan,
    CASE
        WHEN idx_scan = 0 THEN 'NEVER USED - Safe to drop'
        WHEN idx_scan < 10 THEN 'RARELY USED - Consider dropping'
        WHEN idx_scan < 100 THEN 'MODERATELY USED - Review carefully'
        ELSE 'FREQUENTLY USED - Do not drop'
    END as usage_recommendation
FROM pg_stat_user_indexes
WHERE tablename = 'customers';
```

### 3. Understanding Dependencies

```sql
-- Check for constraints that depend on the index
SELECT
    conname as constraint_name,
    contype as constraint_type,
    CASE contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        WHEN 'x' THEN 'EXCLUSION'
    END as constraint_description,
    conindid::regclass as index_name
FROM pg_constraint
WHERE conindid = 'idx_customers_email'::regclass;

-- Find all constraints on a table
SELECT
    c.conname,
    c.contype,
    i.indexname,
    t.tablename
FROM pg_constraint c
JOIN pg_indexes i ON c.conindid = i.indexname::regclass::oid
JOIN pg_tables t ON c.conrelid = t.tablename::regclass::oid
WHERE t.tablename = 'customers';

-- ⚠️ WARNING: Cannot drop indexes that support constraints
-- This will fail if the index supports a PRIMARY KEY or UNIQUE constraint:
-- DROP INDEX customers_pkey;  -- Error: cannot drop index customers_pkey because constraint customers_pkey on table customers requires it
```

## Concurrent Index Dropping

### 1. DROP INDEX CONCURRENTLY

```sql
-- Drop index without blocking concurrent operations
DROP INDEX CONCURRENTLY index_name;

-- Practical examples
DROP INDEX CONCURRENTLY idx_customers_region;
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_status;

-- Multiple concurrent drops (run separately, not in transaction)
DROP INDEX CONCURRENTLY idx_products_category;
-- Wait for completion, then:
DROP INDEX CONCURRENTLY idx_products_brand;
-- Wait for completion, then:
DROP INDEX CONCURRENTLY idx_products_tags;

-- Monitor concurrent drop progress
SELECT
    pid,
    application_name,
    state,
    query,
    query_start,
    NOW() - query_start as duration
FROM pg_stat_activity
WHERE query LIKE '%DROP INDEX CONCURRENTLY%'
AND state = 'active';

-- Check for locks during concurrent drop
SELECT
    l.locktype,
    l.mode,
    l.granted,
    c.relname as table_name,
    a.query
FROM pg_locks l
JOIN pg_class c ON l.relation = c.oid
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE c.relname IN ('customers', 'orders', 'products')
ORDER BY l.granted, c.relname;
```

### 2. Concurrent Drop Limitations and Considerations

```sql
-- ❌ Concurrent drop limitations:
-- 1. Cannot be run inside a transaction block
BEGIN;
DROP INDEX CONCURRENTLY idx_test;  -- ERROR: DROP INDEX CONCURRENTLY cannot run inside a transaction block
COMMIT;

-- 2. Cannot drop unique indexes concurrently if they support constraints
-- DROP INDEX CONCURRENTLY customers_email_key;  -- May fail if supports UNIQUE constraint

-- 3. Takes longer than regular DROP INDEX
-- Monitor system load during concurrent operations

-- ✅ Best practices for concurrent drops:
-- 1. Drop during low-traffic periods when possible
-- 2. Monitor for long-running queries that might be blocked
-- 3. Ensure adequate disk space for temporary operations
-- 4. Consider impact on autovacuum and other maintenance operations

-- Check current database activity before concurrent drop
SELECT
    COUNT(*) as active_connections,
    COUNT(CASE WHEN state = 'active' THEN 1 END) as active_queries,
    COUNT(CASE WHEN wait_event IS NOT NULL THEN 1 END) as waiting_queries
FROM pg_stat_activity
WHERE datname = current_database();

-- Verify successful concurrent drop
SELECT
    indexname,
    tablename
FROM pg_indexes
WHERE indexname = 'idx_customers_region';  -- Should return no rows if dropped successfully
```

## Advanced Drop Scenarios

### 1. Dropping Multiple Indexes

```sql
-- Drop multiple related indexes
-- Scenario: Removing unused indexes from a table cleanup

-- First, identify unused indexes on a specific table
SELECT
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    indexdef
FROM pg_stat_user_indexes
JOIN pg_indexes USING (indexname)
WHERE tablename = 'user_analytics'
AND idx_scan < 10  -- Rarely used
ORDER BY pg_relation_size(indexrelid) DESC;

-- Create a script to drop multiple unused indexes
DO $$
DECLARE
    index_record RECORD;
    drop_command TEXT;
BEGIN
    FOR index_record IN
        SELECT indexname
        FROM pg_stat_user_indexes
        WHERE tablename = 'user_analytics'
        AND idx_scan = 0
        AND indexname NOT LIKE '%_pkey'  -- Skip primary keys
    LOOP
        drop_command := 'DROP INDEX IF EXISTS ' || index_record.indexname;
        RAISE NOTICE 'Executing: %', drop_command;
        EXECUTE drop_command;
    END LOOP;
END $$;

-- Alternative: Generate drop statements for review
SELECT
    'DROP INDEX IF EXISTS ' || indexname || ';' as drop_statement,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size_savings
FROM pg_stat_user_indexes
WHERE tablename = 'user_analytics'
AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 2. Conditional Index Drops with Safety Checks

```sql
-- Function to safely drop an index with comprehensive checks
CREATE OR REPLACE FUNCTION safe_drop_index(
    index_name TEXT,
    check_usage BOOLEAN DEFAULT TRUE,
    min_scan_threshold INTEGER DEFAULT 0
)
RETURNS TEXT AS $$
DECLARE
    index_exists BOOLEAN;
    usage_count BIGINT;
    has_constraint BOOLEAN;
    result TEXT;
BEGIN
    -- Check if index exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = index_name
    ) INTO index_exists;

    IF NOT index_exists THEN
        RETURN 'Index ' || index_name || ' does not exist';
    END IF;

    -- Check if index supports a constraint
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conindid = index_name::regclass
    ) INTO has_constraint;

    IF has_constraint THEN
        RETURN 'Cannot drop ' || index_name || ' - supports a constraint';
    END IF;

    -- Check usage if requested
    IF check_usage THEN
        SELECT COALESCE(idx_scan, 0)
        INTO usage_count
        FROM pg_stat_user_indexes
        WHERE indexname = index_name;

        IF usage_count > min_scan_threshold THEN
            RETURN 'Index ' || index_name || ' has ' || usage_count || ' scans - consider if drop is safe';
        END IF;
    END IF;

    -- Safe to drop
    BEGIN
        EXECUTE 'DROP INDEX ' || index_name;
        result := 'Successfully dropped index ' || index_name;
    EXCEPTION WHEN others THEN
        result := 'Failed to drop ' || index_name || ': ' || SQLERRM;
    END;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Usage examples
SELECT safe_drop_index('idx_old_unused_index');
SELECT safe_drop_index('idx_rarely_used_index', TRUE, 5);  -- Only drop if fewer than 5 scans
SELECT safe_drop_index('idx_constraint_backed');  -- Will refuse to drop constraint-supporting index
```

### 3. Temporary and Test Index Cleanup

```sql
-- Clean up temporary indexes (common naming patterns)
-- Find indexes with temporary naming patterns
SELECT
    indexname,
    tablename,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
JOIN pg_stat_user_indexes USING (indexname)
WHERE indexname ~ '^(tmp_|temp_|test_|idx_test_)'
OR indexname ~ '_temp$'
OR indexname ~ '_tmp$'
ORDER BY tablename, indexname;

-- Generate cleanup statements for temporary indexes
SELECT
    'DROP INDEX IF EXISTS ' || indexname || '; -- ' ||
    pg_size_pretty(pg_relation_size(indexrelid)) || ' saved' as cleanup_statement
FROM pg_indexes
JOIN pg_stat_user_indexes USING (indexname)
WHERE indexname ~ '^(tmp_|temp_|test_)'
AND idx_scan = 0;

-- Clean up duplicate indexes (same columns, different names)
WITH index_columns AS (
    SELECT
        i.indexname,
        i.tablename,
        array_agg(a.attname ORDER BY a.attnum) as columns,
        pg_get_indexdef(idx.indexrelid) as definition
    FROM pg_indexes i
    JOIN pg_index idx ON idx.indexrelid = i.indexname::regclass
    JOIN pg_attribute a ON a.attrelid = idx.indrelid AND a.attnum = ANY(idx.indkey)
    WHERE i.schemaname = 'public'
    GROUP BY i.indexname, i.tablename, idx.indexrelid
),
duplicates AS (
    SELECT
        tablename,
        columns,
        array_agg(indexname) as duplicate_indexes,
        COUNT(*) as duplicate_count
    FROM index_columns
    GROUP BY tablename, columns
    HAVING COUNT(*) > 1
)
SELECT
    tablename,
    columns,
    duplicate_indexes,
    'DROP INDEX ' || duplicate_indexes[2] || ';' as drop_duplicate_statement
FROM duplicates;
```

## Error Handling and Recovery

### 1. Common Drop Index Errors

```sql
-- Error 1: Index doesn't exist
DROP INDEX non_existent_index;
-- ERROR: index "non_existent_index" does not exist

-- Solution: Use IF EXISTS
DROP INDEX IF EXISTS non_existent_index;

-- Error 2: Index supports a constraint
DROP INDEX customers_pkey;
-- ERROR: cannot drop index customers_pkey because constraint customers_pkey on table customers requires it

-- Solution: Drop the constraint first, then the index
ALTER TABLE customers DROP CONSTRAINT customers_pkey;
-- Then create a new primary key if needed

-- Error 3: Other objects depend on the index
-- Check dependencies before dropping
SELECT
    d.classid,
    d.objid,
    d.objsubid,
    d.refclassid,
    d.refobjid,
    d.refobjsubid,
    d.deptype,
    pg_describe_object(d.classid, d.objid, d.objsubid) as dependent_object,
    pg_describe_object(d.refclassid, d.refobjid, d.refobjsubid) as referenced_object
FROM pg_depend d
WHERE d.refobjid = 'idx_customers_email'::regclass;
```

### 2. Rollback Strategies

```sql
-- Strategy 1: Document index definitions before dropping
-- Create backup of index definitions
CREATE TABLE index_backup_log (
    id SERIAL PRIMARY KEY,
    index_name VARCHAR(255),
    table_name VARCHAR(255),
    index_definition TEXT,
    dropped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dropped_by VARCHAR(255) DEFAULT current_user
);

-- Function to backup index definition before dropping
CREATE OR REPLACE FUNCTION drop_index_with_backup(index_name TEXT)
RETURNS TEXT AS $$
DECLARE
    index_def TEXT;
    table_name TEXT;
    result TEXT;
BEGIN
    -- Get index definition and table name
    SELECT
        indexdef,
        tablename
    INTO index_def, table_name
    FROM pg_indexes
    WHERE indexname = index_name;

    IF index_def IS NULL THEN
        RETURN 'Index ' || index_name || ' not found';
    END IF;

    -- Backup the definition
    INSERT INTO index_backup_log (index_name, table_name, index_definition)
    VALUES (index_name, table_name, index_def);

    -- Drop the index
    BEGIN
        EXECUTE 'DROP INDEX ' || index_name;
        result := 'Dropped ' || index_name || ' (backup saved)';
    EXCEPTION WHEN others THEN
        result := 'Failed to drop ' || index_name || ': ' || SQLERRM;
    END;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT drop_index_with_backup('idx_customers_phone');

-- Restore an index from backup
SELECT
    index_name,
    index_definition,
    'To restore, run: ' || index_definition as restore_command
FROM index_backup_log
WHERE index_name = 'idx_customers_phone';
```

### 3. Monitoring Drop Operations

```sql
-- Monitor long-running drop operations
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
WHERE query ILIKE '%drop index%'
AND state = 'active';

-- Check for blocking and blocked sessions during drop
SELECT
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED
AND blocking_activity.query ILIKE '%drop index%';
```

## Production Drop Best Practices

### 1. Pre-Drop Checklist

```sql
-- Complete pre-drop validation checklist
CREATE OR REPLACE FUNCTION validate_index_drop(index_name TEXT)
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check 1: Index exists
    RETURN QUERY
    SELECT
        'Index Existence'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name)
             THEN 'PASS' ELSE 'FAIL' END,
        'Index ' || index_name || CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name)
                                      THEN ' exists' ELSE ' does not exist' END,
        CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name)
             THEN 'Proceed with drop' ELSE 'Nothing to drop' END;

    -- Check 2: Constraint dependency
    RETURN QUERY
    SELECT
        'Constraint Dependency'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conindid = index_name::regclass)
             THEN 'FAIL' ELSE 'PASS' END,
        'Index ' || CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conindid = index_name::regclass)
                         THEN 'supports constraints' ELSE 'has no constraint dependencies' END,
        CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conindid = index_name::regclass)
             THEN 'Cannot drop - remove constraint first' ELSE 'Safe to drop' END;

    -- Check 3: Usage statistics
    RETURN QUERY
    SELECT
        'Usage Statistics'::TEXT,
        CASE WHEN COALESCE((SELECT idx_scan FROM pg_stat_user_indexes WHERE indexname = index_name), 0) = 0
             THEN 'PASS' ELSE 'WARNING' END,
        'Index scanned ' || COALESCE((SELECT idx_scan FROM pg_stat_user_indexes WHERE indexname = index_name), 0) || ' times',
        CASE WHEN COALESCE((SELECT idx_scan FROM pg_stat_user_indexes WHERE indexname = index_name), 0) = 0
             THEN 'Unused - safe to drop'
             WHEN COALESCE((SELECT idx_scan FROM pg_stat_user_indexes WHERE indexname = index_name), 0) < 10
             THEN 'Rarely used - review queries'
             ELSE 'Heavily used - reconsider drop' END;

    -- Check 4: Size impact
    RETURN QUERY
    SELECT
        'Storage Impact'::TEXT,
        'INFO'::TEXT,
        'Will free ' || COALESCE(pg_size_pretty(pg_relation_size(index_name::regclass)), '0 bytes') || ' of storage',
        'Document storage savings';

    -- Check 5: Recent activity
    RETURN QUERY
    SELECT
        'Recent Activity'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_stat_activity
            WHERE query ILIKE '%' || (SELECT tablename FROM pg_indexes WHERE indexname = index_name) || '%'
            AND state = 'active'
        ) THEN 'WARNING' ELSE 'PASS' END,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_stat_activity
            WHERE query ILIKE '%' || (SELECT tablename FROM pg_indexes WHERE indexname = index_name) || '%'
            AND state = 'active'
        ) THEN 'Active queries on table' ELSE 'No active queries on table' END,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_stat_activity
            WHERE query ILIKE '%' || (SELECT tablename FROM pg_indexes WHERE indexname = index_name) || '%'
            AND state = 'active'
        ) THEN 'Consider DROP INDEX CONCURRENTLY' ELSE 'Standard drop acceptable' END;
END;
$$ LANGUAGE plpgsql;

-- Usage example
SELECT * FROM validate_index_drop('idx_customers_region');
```

### 2. Post-Drop Verification

```sql
-- Comprehensive post-drop verification
CREATE OR REPLACE FUNCTION verify_index_drop(index_name TEXT, table_name TEXT)
RETURNS TABLE(
    verification_step TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Verify index is actually dropped
    RETURN QUERY
    SELECT
        'Index Removal'::TEXT,
        CASE WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name)
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Index ' || index_name ||
        CASE WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name)
             THEN ' successfully removed' ELSE ' still exists' END;

    -- Check query performance impact (run sample queries)
    RETURN QUERY
    SELECT
        'Performance Impact'::TEXT,
        'INFO'::TEXT,
        'Monitor query performance on table ' || table_name || ' for regression';

    -- Verify no broken constraints
    RETURN QUERY
    SELECT
        'Constraint Integrity'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = table_name::regclass
            AND NOT convalidated
        ) THEN 'WARNING' ELSE 'PASS' END,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = table_name::regclass
            AND NOT convalidated
        ) THEN 'Some constraints not validated' ELSE 'All constraints valid' END;

    -- Check for remaining related indexes
    RETURN QUERY
    SELECT
        'Related Indexes'::TEXT,
        'INFO'::TEXT,
        'Table ' || table_name || ' has ' ||
        (SELECT COUNT(*)::TEXT FROM pg_indexes WHERE tablename = table_name) ||
        ' remaining indexes';
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM verify_index_drop('idx_customers_region', 'customers');
```

### 3. Automated Cleanup Scripts

```sql
-- Automated cleanup for development/testing environments
CREATE OR REPLACE FUNCTION cleanup_unused_indexes(
    min_days_old INTEGER DEFAULT 30,
    min_size_mb INTEGER DEFAULT 10,
    dry_run BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    action TEXT,
    index_name TEXT,
    table_name TEXT,
    last_used TEXT,
    size_mb NUMERIC,
    command TEXT
) AS $$
DECLARE
    index_record RECORD;
    drop_command TEXT;
BEGIN
    FOR index_record IN
        SELECT
            i.indexname,
            i.tablename,
            COALESCE(s.idx_scan, 0) as scans,
            ROUND(pg_relation_size(s.indexrelid) / 1024.0 / 1024.0, 2) as size_mb,
            pg_stat_get_last_autoanalyze_time(s.relid) as last_analyze
        FROM pg_indexes i
        LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
        WHERE i.schemaname = 'public'
        AND i.indexname NOT LIKE '%_pkey'  -- Skip primary keys
        AND NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conindid = s.indexrelid
        )  -- Skip constraint-supporting indexes
        AND COALESCE(s.idx_scan, 0) = 0  -- Never used
        AND pg_relation_size(s.indexrelid) > min_size_mb * 1024 * 1024  -- Larger than minimum size
    LOOP
        drop_command := 'DROP INDEX ' || index_record.indexname || ';';

        RETURN QUERY
        SELECT
            CASE WHEN dry_run THEN 'PLAN' ELSE 'EXECUTE' END::TEXT,
            index_record.indexname::TEXT,
            index_record.tablename::TEXT,
            'Never used'::TEXT,
            index_record.size_mb,
            drop_command::TEXT;

        IF NOT dry_run THEN
            EXECUTE drop_command;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage examples
-- Dry run to see what would be cleaned up
SELECT * FROM cleanup_unused_indexes(30, 5, true);

-- Actually perform cleanup (be very careful!)
-- SELECT * FROM cleanup_unused_indexes(30, 5, false);
```

## Summary

**Dropping PostgreSQL indexes** requires careful consideration of dependencies, usage patterns, and operational impact:

**🔧 Basic Drop Syntax:**

```sql
-- Standard: DROP INDEX index_name;
-- Safe: DROP INDEX IF EXISTS index_name;
-- Concurrent: DROP INDEX CONCURRENTLY index_name;
-- Schema-qualified: DROP INDEX schema.index_name;
```

**⚠️ Critical Considerations:**

- **Check dependencies**: Cannot drop constraint-supporting indexes
- **Verify usage**: Review `pg_stat_user_indexes` before dropping
- **Use concurrent drops**: For production environments during business hours
- **Monitor performance**: Watch for query regression after drops

**🛡️ Safety Best Practices:**

- **Always backup index definitions** before dropping
- **Test impact in staging** environments first
- **Use validation functions** to check dependencies and usage
- **Monitor active queries** on affected tables
- **Document changes** and maintain rollback procedures

**⚡ Production Guidelines:**

- **Prefer `DROP INDEX CONCURRENTLY`** to avoid blocking operations
- **Schedule drops during maintenance windows** when possible
- **Verify post-drop performance** with monitoring tools
- **Clean up unused indexes regularly** to reclaim storage
- **Handle errors gracefully** with proper exception handling

**🔍 Key Operations:**

- **Check existence**: Use `IF EXISTS` clause
- **Validate safety**: Custom validation functions
- **Monitor progress**: Query `pg_stat_activity` for long operations
- **Verify completion**: Confirm index removal and performance impact

Successful index dropping requires balancing storage optimization with query performance while maintaining system stability and avoiding service disruptions.
