# What is Index-Only Scan?

An index-only scan is a PostgreSQL query execution technique where all required data can be retrieved directly from the index without accessing the underlying table. This optimization dramatically improves performance by eliminating expensive table lookups, reducing I/O operations, and maximizing cache efficiency.

## Understanding Index-Only Scans

### 1. Basic Concept and Mechanics

```sql
-- Create demonstration environment
CREATE TABLE index_only_demo (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    username VARCHAR(50),
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    age INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE
);

-- Insert sample data
INSERT INTO index_only_demo (user_id, username, email, first_name, last_name, age, status, last_login, login_count, is_premium)
SELECT
    generate_series(1,100000),
    'user_' || generate_series(1,100000),
    'user' || generate_series(1,100000) || '@example.com',
    'FirstName' || generate_series(1,100000),
    'LastName' || generate_series(1,100000),
    18 + (random() * 62)::integer,
    CASE (random() * 3)::integer
        WHEN 0 THEN 'active'
        WHEN 1 THEN 'inactive'
        WHEN 2 THEN 'suspended'
        ELSE 'pending'
    END,
    CURRENT_TIMESTAMP - (random() * 365 || ' days')::interval,
    (random() * 1000)::integer,
    random() > 0.8;

-- Create regular indexes (non-covering)
CREATE INDEX idx_demo_user_id ON index_only_demo (user_id);
CREATE INDEX idx_demo_status ON index_only_demo (status);
CREATE INDEX idx_demo_created ON index_only_demo (created_at);

-- Query that CANNOT use index-only scan (needs table access for username)
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, username
FROM index_only_demo
WHERE user_id BETWEEN 1000 AND 2000;

-- Check execution plan - notice "Index Scan" + table access
-- The plan shows heap fetches because username is not in the index

-- Query that CAN use index-only scan (only indexed column)
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id
FROM index_only_demo
WHERE user_id BETWEEN 1000 AND 2000;

-- Still requires heap fetches for visibility checking in MVCC
-- Let's fix this with a covering index
```

### 2. Creating Covering Indexes for Index-Only Scans

```sql
-- PostgreSQL 11+ INCLUDE clause - creates covering indexes
CREATE INDEX idx_demo_user_covering ON index_only_demo (user_id) INCLUDE (username, email);

-- Alternative: Multi-column index (all columns in key)
CREATE INDEX idx_demo_status_covering ON index_only_demo (status, first_name, last_name, age);

-- Complex covering index
CREATE INDEX idx_demo_login_covering ON index_only_demo (status, last_login)
INCLUDE (username, login_count, is_premium);

-- Now test index-only scan capability
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, username, email
FROM index_only_demo
WHERE user_id BETWEEN 1000 AND 2000;

-- Should show "Index Only Scan" if all data is available in index
-- and visibility map allows it

-- Check for index-only scan with different column combinations
EXPLAIN (ANALYZE, BUFFERS)
SELECT status, first_name, last_name, age
FROM index_only_demo
WHERE status = 'active';

EXPLAIN (ANALYZE, BUFFERS)
SELECT status, username, login_count, is_premium
FROM index_only_demo
WHERE status = 'active'
AND last_login >= CURRENT_DATE - INTERVAL '30 days';

-- Function to demonstrate index-only scan conditions
CREATE OR REPLACE FUNCTION check_index_only_eligibility(
    table_name TEXT,
    query_columns TEXT[],
    where_columns TEXT[]
) RETURNS TABLE(
    index_name TEXT,
    can_cover_query BOOLEAN,
    covers_where_clause BOOLEAN,
    covers_select_list BOOLEAN,
    recommendation TEXT
) AS $$
DECLARE
    index_record RECORD;
    index_columns TEXT[];
    all_query_columns TEXT[];
BEGIN
    -- Combine WHERE and SELECT columns
    all_query_columns := array_cat(query_columns, where_columns);

    FOR index_record IN
        SELECT
            i.indexname,
            pg_get_indexdef(idx.indexrelid) as index_def
        FROM pg_indexes i
        JOIN pg_index idx ON idx.indexrelid = i.indexname::regclass
        WHERE i.tablename = table_name
        AND i.schemaname = 'public'
    LOOP
        -- Simplified check - real implementation would parse index definition
        -- This demonstrates the concept

        RETURN QUERY
        SELECT
            index_record.indexname::TEXT,
            -- Simplified logic - would need proper column extraction
            (index_record.index_def ILIKE ANY(SELECT '%' || col || '%' FROM unnest(all_query_columns) col))::BOOLEAN,
            (index_record.index_def ILIKE ANY(SELECT '%' || col || '%' FROM unnest(where_columns) col))::BOOLEAN,
            (index_record.index_def ILIKE ANY(SELECT '%' || col || '%' FROM unnest(query_columns) col))::BOOLEAN,
            CASE
                WHEN index_record.index_def ILIKE ANY(SELECT '%' || col || '%' FROM unnest(all_query_columns) col)
                THEN 'Index can support index-only scan'
                ELSE 'Index cannot cover all required columns'
            END::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Check index coverage for specific queries
SELECT * FROM check_index_only_eligibility(
    'index_only_demo',
    ARRAY['user_id', 'username', 'email'],
    ARRAY['user_id']
);
```

### 3. Visibility Map and MVCC Considerations

```sql
-- Understanding visibility map impact on index-only scans
-- The visibility map tracks which pages have only visible tuples

-- Check table visibility information
CREATE EXTENSION IF NOT EXISTS pgstattuple;

-- Analyze table visibility
SELECT
    table_name,
    tuple_count,
    dead_tuple_count,
    ROUND(100.0 * dead_tuple_count / NULLIF(tuple_count, 0), 2) as dead_tuple_pct,
    tuple_percent,
    dead_tuple_percent
FROM pgstattuple('index_only_demo')
CROSS JOIN (SELECT 'index_only_demo' as table_name) t;

-- VACUUM to update visibility map
VACUUM ANALYZE index_only_demo;

-- Check visibility map statistics
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_dead_tup,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE tablename = 'index_only_demo';

-- Test index-only scan after VACUUM
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, username, email
FROM index_only_demo
WHERE user_id BETWEEN 1000 AND 2000;

-- The execution plan should now show "Heap Fetches: 0" if visibility map is effective

-- Function to assess index-only scan prerequisites
CREATE OR REPLACE FUNCTION assess_index_only_prerequisites(
    target_table TEXT,
    target_index TEXT
) RETURNS TABLE(
    prerequisite TEXT,
    status TEXT,
    current_value TEXT,
    recommendation TEXT
) AS $$
DECLARE
    table_stats RECORD;
    index_stats RECORD;
    vm_ratio NUMERIC;
BEGIN
    -- Get table statistics
    SELECT * INTO table_stats
    FROM pg_stat_user_tables
    WHERE tablename = target_table;

    -- Get index statistics
    SELECT * INTO index_stats
    FROM pg_stat_user_indexes
    WHERE indexname = target_index;

    -- Check dead tuple ratio
    RETURN QUERY
    SELECT
        'Dead Tuple Ratio'::TEXT,
        CASE
            WHEN table_stats.n_dead_tup::NUMERIC / NULLIF(table_stats.n_tup_ins + table_stats.n_tup_upd, 0) < 0.1 THEN 'GOOD'
            WHEN table_stats.n_dead_tup::NUMERIC / NULLIF(table_stats.n_tup_ins + table_stats.n_tup_upd, 0) < 0.2 THEN 'ACCEPTABLE'
            ELSE 'POOR'
        END,
        ROUND(100.0 * table_stats.n_dead_tup::NUMERIC / NULLIF(table_stats.n_tup_ins + table_stats.n_tup_upd, 0), 2)::TEXT || '%',
        CASE
            WHEN table_stats.n_dead_tup::NUMERIC / NULLIF(table_stats.n_tup_ins + table_stats.n_tup_upd, 0) > 0.1
            THEN 'Run VACUUM to update visibility map'
            ELSE 'Visibility map should be effective'
        END;

    -- Check last vacuum time
    RETURN QUERY
    SELECT
        'Last VACUUM'::TEXT,
        CASE
            WHEN table_stats.last_vacuum IS NULL AND table_stats.last_autovacuum IS NULL THEN 'NEVER'
            WHEN COALESCE(table_stats.last_vacuum, table_stats.last_autovacuum) < CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'OUTDATED'
            ELSE 'RECENT'
        END,
        COALESCE(
            GREATEST(table_stats.last_vacuum, table_stats.last_autovacuum)::TEXT,
            'Never'
        ),
        CASE
            WHEN COALESCE(table_stats.last_vacuum, table_stats.last_autovacuum) < CURRENT_TIMESTAMP - INTERVAL '7 days'
            THEN 'Schedule VACUUM to improve index-only scan performance'
            ELSE 'VACUUM schedule is adequate'
        END;

    -- Check index usage
    RETURN QUERY
    SELECT
        'Index Usage'::TEXT,
        CASE
            WHEN index_stats.idx_scan = 0 THEN 'UNUSED'
            WHEN index_stats.idx_tup_fetch = 0 THEN 'INDEX_ONLY_CAPABLE'
            WHEN index_stats.idx_tup_fetch::NUMERIC / NULLIF(index_stats.idx_tup_read, 0) < 0.1 THEN 'MOSTLY_INDEX_ONLY'
            ELSE 'REQUIRES_TABLE_ACCESS'
        END,
        COALESCE(index_stats.idx_scan, 0)::TEXT || ' scans, ' ||
        COALESCE(index_stats.idx_tup_fetch, 0)::TEXT || ' heap fetches',
        CASE
            WHEN index_stats.idx_tup_fetch::NUMERIC / NULLIF(index_stats.idx_tup_read, 0) > 0.5
            THEN 'Consider adding INCLUDE columns for better index-only scan coverage'
            ELSE 'Index-only scan performance is good'
        END;
END;
$$ LANGUAGE plpgsql;

-- Assess prerequisites for index-only scans
SELECT * FROM assess_index_only_prerequisites('index_only_demo', 'idx_demo_user_covering');
```

## Advanced Index-Only Scan Techniques

### 1. Strategic Use of INCLUDE Columns

```sql
-- Demonstrate strategic INCLUDE column design
-- INCLUDE columns are stored in leaf pages but not in internal pages
-- This keeps the tree structure efficient while enabling index-only scans

-- Example 1: User profile queries
CREATE INDEX idx_profile_lookup ON index_only_demo (user_id)
INCLUDE (username, first_name, last_name, email, is_premium);

-- Example 2: Status-based reporting
CREATE INDEX idx_status_reporting ON index_only_demo (status, created_at)
INCLUDE (user_id, username, login_count, last_login);

-- Example 3: Date range queries with details
CREATE INDEX idx_activity_analysis ON index_only_demo (last_login)
INCLUDE (user_id, username, status, login_count);

-- Test different query patterns
-- Profile lookup - should be index-only
EXPLAIN (ANALYZE, BUFFERS)
SELECT username, first_name, last_name, email, is_premium
FROM index_only_demo
WHERE user_id = 12345;

-- Status reporting - should be index-only
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, username, login_count, last_login
FROM index_only_demo
WHERE status = 'active'
AND created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Activity analysis - should be index-only
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, username, status, login_count
FROM index_only_demo
WHERE last_login >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY last_login DESC;

-- Function to design optimal INCLUDE columns
CREATE OR REPLACE FUNCTION suggest_include_columns(
    table_name TEXT,
    base_columns TEXT[],
    query_patterns JSONB
) RETURNS TABLE(
    suggested_index TEXT,
    covered_queries INTEGER,
    estimated_benefit TEXT,
    implementation_cost TEXT
) AS $$
DECLARE
    pattern JSONB;
    include_cols TEXT[];
    all_select_cols TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Extract all SELECT columns from query patterns
    FOR pattern IN SELECT jsonb_array_elements(query_patterns)
    LOOP
        all_select_cols := array_cat(all_select_cols,
            ARRAY(SELECT jsonb_array_elements_text(pattern->'select_columns')));
    END LOOP;

    -- Remove duplicates and base columns
    include_cols := ARRAY(
        SELECT DISTINCT col
        FROM unnest(all_select_cols) col
        WHERE col != ALL(base_columns)
    );

    RETURN QUERY
    SELECT
        'CREATE INDEX idx_' || table_name || '_optimized ON ' || table_name ||
        ' (' || array_to_string(base_columns, ', ') || ') INCLUDE (' ||
        array_to_string(include_cols, ', ') || ');'::TEXT,
        jsonb_array_length(query_patterns)::INTEGER,
        CASE
            WHEN array_length(include_cols, 1) <= 5 THEN 'HIGH - All queries can be index-only'
            WHEN array_length(include_cols, 1) <= 10 THEN 'MEDIUM - Most queries can be index-only'
            ELSE 'LOW - Index may become too large'
        END::TEXT,
        CASE
            WHEN array_length(include_cols, 1) <= 5 THEN 'LOW - Minimal storage overhead'
            WHEN array_length(include_cols, 1) <= 10 THEN 'MEDIUM - Moderate storage increase'
            ELSE 'HIGH - Significant storage and maintenance cost'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Example usage of include column suggestion
SELECT * FROM suggest_include_columns(
    'index_only_demo',
    ARRAY['user_id'],
    '[
        {"select_columns": ["username", "email", "is_premium"]},
        {"select_columns": ["first_name", "last_name", "age"]},
        {"select_columns": ["username", "status", "login_count"]}
    ]'::jsonb
);
```

### 2. Performance Impact Analysis

```sql
-- Comprehensive performance comparison: regular vs index-only scans
CREATE OR REPLACE FUNCTION compare_scan_performance(
    test_table TEXT,
    iterations INTEGER DEFAULT 5
) RETURNS TABLE(
    scan_type TEXT,
    avg_execution_time_ms NUMERIC,
    avg_buffers_hit INTEGER,
    avg_buffers_read INTEGER,
    avg_heap_fetches INTEGER,
    performance_ratio NUMERIC
) AS $$
DECLARE
    i INTEGER;
    regular_times NUMERIC[] := ARRAY[]::NUMERIC[];
    index_only_times NUMERIC[] := ARRAY[]::NUMERIC[];
    regular_buffers INTEGER[] := ARRAY[]::INTEGER[];
    index_only_buffers INTEGER[] := ARRAY[]::INTEGER[];
    plan_json JSONB;
    exec_time NUMERIC;
    buffers_total INTEGER;
    heap_fetches INTEGER;
BEGIN
    -- Test regular index scan (requires table access)
    FOR i IN 1..iterations LOOP
        -- Query that requires table access
        EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
                 SELECT user_id, age FROM ' || test_table || '
                 WHERE user_id BETWEEN 1000 AND 2000'
        INTO plan_json;

        exec_time := (plan_json->0->'Execution Time')::NUMERIC;
        buffers_total := COALESCE((plan_json->0->'Plan'->'Shared Hit Blocks')::INTEGER, 0) +
                        COALESCE((plan_json->0->'Plan'->'Shared Read Blocks')::INTEGER, 0);
        heap_fetches := COALESCE((plan_json->0->'Plan'->'Heap Fetches')::INTEGER, 0);

        regular_times := array_append(regular_times, exec_time);
        regular_buffers := array_append(regular_buffers, buffers_total);
    END LOOP;

    -- Test index-only scan
    FOR i IN 1..iterations LOOP
        -- Query that can use index-only scan
        EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
                 SELECT user_id, username FROM ' || test_table || '
                 WHERE user_id BETWEEN 1000 AND 2000'
        INTO plan_json;

        exec_time := (plan_json->0->'Execution Time')::NUMERIC;
        buffers_total := COALESCE((plan_json->0->'Plan'->'Shared Hit Blocks')::INTEGER, 0) +
                        COALESCE((plan_json->0->'Plan'->'Shared Read Blocks')::INTEGER, 0);
        heap_fetches := COALESCE((plan_json->0->'Plan'->'Heap Fetches')::INTEGER, 0);

        index_only_times := array_append(index_only_times, exec_time);
        index_only_buffers := array_append(index_only_buffers, buffers_total);
    END LOOP;

    -- Return comparison results
    RETURN QUERY
    SELECT
        'Regular Index Scan'::TEXT,
        ROUND((SELECT AVG(t) FROM unnest(regular_times) t), 3),
        (SELECT AVG(b)::INTEGER FROM unnest(regular_buffers) b),
        0::INTEGER, -- Simplified for demo
        100::INTEGER, -- Approximate heap fetches for regular scan
        1.0::NUMERIC; -- Baseline ratio

    RETURN QUERY
    SELECT
        'Index-Only Scan'::TEXT,
        ROUND((SELECT AVG(t) FROM unnest(index_only_times) t), 3),
        (SELECT AVG(b)::INTEGER FROM unnest(index_only_buffers) b),
        0::INTEGER,
        0::INTEGER, -- No heap fetches for index-only
        ROUND((SELECT AVG(t) FROM unnest(regular_times) t) /
              NULLIF((SELECT AVG(t) FROM unnest(index_only_times) t), 0), 2);
END;
$$ LANGUAGE plpgsql;

-- Run performance comparison
SELECT * FROM compare_scan_performance('index_only_demo', 3);

-- Analyze I/O reduction benefits
CREATE OR REPLACE FUNCTION calculate_io_savings(
    table_name TEXT,
    covering_index_name TEXT
) RETURNS TABLE(
    metric TEXT,
    regular_scan_value TEXT,
    index_only_value TEXT,
    savings_percentage NUMERIC,
    annual_savings_estimate TEXT
) AS $$
DECLARE
    table_size BIGINT;
    index_size BIGINT;
    typical_query_rows INTEGER := 100;
    queries_per_day INTEGER := 1000;
BEGIN
    -- Get sizes
    SELECT pg_total_relation_size(table_name::regclass) INTO table_size;
    SELECT pg_relation_size(covering_index_name::regclass) INTO index_size;

    RETURN QUERY VALUES
    ('Data Volume per Query',
     pg_size_pretty(table_size / 1000 * typical_query_rows), -- Approximate data read for table scan
     pg_size_pretty(index_size / 10000 * typical_query_rows), -- Approximate data read for index-only
     ROUND(100.0 * (1.0 - (index_size::NUMERIC / 10000) / (table_size::NUMERIC / 1000)), 1),
     'Reduced I/O volume'),

    ('Cache Efficiency',
     'Lower - table + index pages',
     'Higher - index pages only',
     75.0, -- Estimated improvement
     'Better buffer cache utilization'),

    ('Network Traffic',
     'Table row + index overhead',
     'Index data only',
     40.0, -- Estimated reduction
     'Reduced network bandwidth usage');
END;
$$ LANGUAGE plpgsql;

-- Calculate I/O savings
SELECT * FROM calculate_io_savings('index_only_demo', 'idx_demo_user_covering');
```

### 3. Index-Only Scan Optimization Patterns

```sql
-- Common optimization patterns for index-only scans

-- Pattern 1: Lookup tables and reference data
CREATE TABLE lookup_demo (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE,
    name VARCHAR(100),
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER
);

INSERT INTO lookup_demo (code, name, description, category, sort_order)
SELECT
    'CODE' || generate_series(1,10000),
    'Name ' || generate_series(1,10000),
    'Description for item ' || generate_series(1,10000),
    CASE (random() * 3)::INTEGER WHEN 0 THEN 'Type A' WHEN 1 THEN 'Type B' ELSE 'Type C' END,
    generate_series(1,10000);

-- Covering index for common lookup queries
CREATE INDEX idx_lookup_code_covering ON lookup_demo (code)
INCLUDE (name, category, is_active, sort_order);

-- Pattern 2: Aggregation and reporting queries
CREATE INDEX idx_demo_reporting ON index_only_demo (status, created_at)
INCLUDE (user_id, login_count, is_premium);

-- Test reporting query - should be index-only
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    status,
    COUNT(*) as user_count,
    SUM(login_count) as total_logins,
    COUNT(*) FILTER (WHERE is_premium) as premium_users
FROM index_only_demo
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY status;

-- Pattern 3: Pagination with sorting
CREATE INDEX idx_demo_pagination ON index_only_demo (status, username)
INCLUDE (user_id, email, last_login);

-- Test pagination query - should be index-only
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, username, email, last_login
FROM index_only_demo
WHERE status = 'active'
ORDER BY username
LIMIT 20 OFFSET 100;

-- Function to identify index-only scan opportunities
CREATE OR REPLACE FUNCTION identify_index_only_opportunities()
RETURNS TABLE(
    table_name TEXT,
    current_index TEXT,
    query_pattern TEXT,
    missing_columns TEXT,
    optimization_suggestion TEXT,
    estimated_benefit TEXT
) AS $$
DECLARE
    table_record RECORD;
    index_record RECORD;
BEGIN
    FOR table_record IN
        SELECT DISTINCT tablename FROM pg_indexes WHERE schemaname = 'public'
    LOOP
        FOR index_record IN
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = table_record.tablename
            AND schemaname = 'public'
            AND indexname NOT LIKE '%_pkey'
        LOOP
            -- Analyze current index for optimization opportunities
            -- This is a simplified example - real analysis would be more sophisticated

            RETURN QUERY
            SELECT
                table_record.tablename::TEXT,
                index_record.indexname::TEXT,
                'SELECT commonly_queried_columns WHERE indexed_column = value'::TEXT,
                'Add frequently selected columns as INCLUDE columns'::TEXT,
                CASE
                    WHEN index_record.indexdef ILIKE '%INCLUDE%' THEN
                        'Already optimized with INCLUDE columns'
                    ELSE
                        'Consider adding INCLUDE (' ||
                        'frequently_selected_columns' || ') to enable index-only scans'
                END::TEXT,
                CASE
                    WHEN index_record.indexdef ILIKE '%INCLUDE%' THEN 'Already optimized'
                    ELSE 'HIGH - Could eliminate table lookups for common queries'
                END::TEXT;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Identify opportunities
SELECT * FROM identify_index_only_opportunities()
WHERE table_name IN ('index_only_demo', 'lookup_demo');
```

### 4. Monitoring Index-Only Scan Effectiveness

```sql
-- Create monitoring view for index-only scan performance
CREATE OR REPLACE VIEW index_only_scan_monitor AS
WITH index_usage AS (
    SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        pg_relation_size(indexrelid) as index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
),
scan_efficiency AS (
    SELECT
        *,
        CASE
            WHEN idx_tup_read > 0 THEN
                ROUND(100.0 * (idx_tup_read - idx_tup_fetch) / idx_tup_read, 2)
            ELSE 0
        END as index_only_ratio,
        CASE
            WHEN idx_scan > 0 THEN
                ROUND(idx_tup_fetch::NUMERIC / idx_scan, 2)
            ELSE 0
        END as avg_heap_fetches_per_scan
    FROM index_usage
)
SELECT
    tablename,
    indexname,
    idx_scan as total_scans,
    index_only_ratio as index_only_percentage,
    avg_heap_fetches_per_scan,
    pg_size_pretty(index_size) as size,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN index_only_ratio >= 90 THEN 'EXCELLENT_INDEX_ONLY'
        WHEN index_only_ratio >= 70 THEN 'GOOD_INDEX_ONLY'
        WHEN index_only_ratio >= 50 THEN 'MODERATE_INDEX_ONLY'
        WHEN index_only_ratio > 0 THEN 'POOR_INDEX_ONLY'
        ELSE 'NO_INDEX_ONLY'
    END as index_only_effectiveness,
    CASE
        WHEN index_only_ratio >= 90 THEN 'Performing excellently'
        WHEN index_only_ratio >= 70 THEN 'Good performance'
        WHEN index_only_ratio >= 50 THEN 'Consider adding INCLUDE columns'
        WHEN idx_scan > 100 AND index_only_ratio < 50 THEN 'High usage but poor index-only ratio - optimize'
        WHEN idx_scan = 0 THEN 'Consider dropping if truly unused'
        ELSE 'Monitor and consider optimization'
    END as recommendation
FROM scan_efficiency
WHERE idx_scan > 0 OR index_size > 10*1024*1024;

-- View index-only scan effectiveness
SELECT * FROM index_only_scan_monitor
ORDER BY index_only_percentage DESC;

-- Function to track index-only scan trends
CREATE OR REPLACE FUNCTION track_index_only_trends()
RETURNS TABLE(
    index_name TEXT,
    current_index_only_pct NUMERIC,
    trend_direction TEXT,
    performance_change TEXT,
    optimization_priority TEXT
) AS $$
BEGIN
    -- This would compare current stats with historical data
    -- Simplified version for demonstration

    RETURN QUERY
    WITH current_performance AS (
        SELECT
            indexname,
            CASE
                WHEN idx_tup_read > 0 THEN
                    ROUND(100.0 * (idx_tup_read - idx_tup_fetch) / idx_tup_read, 2)
                ELSE 0
            END as current_ratio,
            idx_scan
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        AND idx_scan > 0
    )
    SELECT
        cp.indexname::TEXT,
        cp.current_ratio,
        CASE
            WHEN cp.current_ratio >= 80 THEN 'STABLE_HIGH'
            WHEN cp.current_ratio >= 50 THEN 'STABLE_MEDIUM'
            ELSE 'NEEDS_ATTENTION'
        END::TEXT,
        CASE
            WHEN cp.current_ratio >= 80 THEN 'Excellent index-only performance'
            WHEN cp.current_ratio >= 50 THEN 'Acceptable performance'
            ELSE 'Poor index-only ratio - optimization needed'
        END::TEXT,
        CASE
            WHEN cp.current_ratio < 50 AND cp.idx_scan > 100 THEN 'HIGH'
            WHEN cp.current_ratio < 70 AND cp.idx_scan > 50 THEN 'MEDIUM'
            ELSE 'LOW'
        END::TEXT
    FROM current_performance cp
    ORDER BY cp.idx_scan * (100 - cp.current_ratio) DESC;
END;
$$ LANGUAGE plpgsql;

-- Track index-only scan trends
SELECT * FROM track_index_only_trends();

-- Create alert function for index-only scan degradation
CREATE OR REPLACE FUNCTION alert_index_only_degradation(
    min_scans INTEGER DEFAULT 100,
    min_index_only_ratio NUMERIC DEFAULT 70.0
) RETURNS TABLE(
    alert_level TEXT,
    index_name TEXT,
    table_name TEXT,
    current_ratio NUMERIC,
    scan_count BIGINT,
    issue_description TEXT,
    suggested_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH performance_issues AS (
        SELECT
            ius.tablename,
            ius.indexname,
            ius.idx_scan,
            CASE
                WHEN ius.idx_tup_read > 0 THEN
                    ROUND(100.0 * (ius.idx_tup_read - ius.idx_tup_fetch) / ius.idx_tup_read, 2)
                ELSE 0
            END as index_only_ratio
        FROM pg_stat_user_indexes ius
        WHERE ius.schemaname = 'public'
        AND ius.idx_scan >= min_scans
    )
    SELECT
        CASE
            WHEN pi.index_only_ratio < 30 THEN 'CRITICAL'
            WHEN pi.index_only_ratio < 50 THEN 'WARNING'
            ELSE 'INFO'
        END::TEXT,
        pi.indexname::TEXT,
        pi.tablename::TEXT,
        pi.index_only_ratio,
        pi.idx_scan,
        CASE
            WHEN pi.index_only_ratio < 30 THEN 'Very low index-only scan ratio with high usage'
            WHEN pi.index_only_ratio < 50 THEN 'Below optimal index-only scan ratio'
            ELSE 'Index-only performance could be improved'
        END::TEXT,
        CASE
            WHEN pi.index_only_ratio < 30 THEN 'Urgent: Add INCLUDE columns or redesign index'
            WHEN pi.index_only_ratio < 50 THEN 'Consider adding INCLUDE columns'
            ELSE 'Monitor and plan optimization'
        END::TEXT
    FROM performance_issues pi
    WHERE pi.index_only_ratio < min_index_only_ratio
    ORDER BY pi.idx_scan * (100 - pi.index_only_ratio) DESC;
END;
$$ LANGUAGE plpgsql;

-- Check for index-only scan issues
SELECT * FROM alert_index_only_degradation(50, 80.0);
```

## Summary

**Index-only scans** represent one of the most effective PostgreSQL query optimization techniques, eliminating table access for improved performance:

**🔧 Core Concept:**

- **Index-only scans** retrieve all required data directly from index pages
- **Eliminates table lookups** reducing I/O operations significantly
- **Requires covering indexes** that include all queried columns
- **Depends on visibility map** for MVCC tuple visibility checking

**⚡ Implementation Methods:**

- **INCLUDE clause** (PostgreSQL 11+): Add non-key columns to index leaf pages
- **Composite indexes**: Include all columns as key columns
- **Strategic column selection**: Choose frequently queried columns for coverage
- **Visibility optimization**: Regular VACUUM to maintain visibility map

**📊 Performance Benefits:**

- **Reduced I/O**: 40-80% reduction in disk reads
- **Better cache efficiency**: More data fits in buffer cache
- **Lower network overhead**: Less data transfer for remote connections
- **Improved concurrency**: Reduced lock contention on table pages

**🎯 Optimization Patterns:**

- **Lookup tables**: Code/name pairs with covering indexes
- **Reporting queries**: Aggregation with all columns in index
- **Pagination**: Sorted results with INCLUDE columns
- **Profile queries**: User details from single covering index

**🛡️ Prerequisites and Considerations:**

- **Visibility map health**: Regular VACUUM to enable index-only scans
- **Index size trade-off**: INCLUDE columns increase index storage
- **Column selectivity**: Choose columns that provide maximum query coverage
- **Maintenance overhead**: Larger indexes require more maintenance

**📋 Monitoring and Optimization:**

- **pg_stat_user_indexes**: Track idx_tup_fetch vs idx_tup_read ratios
- **EXPLAIN plans**: Verify "Index Only Scan" vs "Index Scan"
- **Performance trending**: Monitor index-only scan effectiveness over time
- **Alert systems**: Detect degradation in index-only scan ratios

**🔍 Best Practices:**

- **Analyze query patterns** before designing covering indexes
- **Use INCLUDE judiciously** to avoid oversized indexes
- **Monitor index-only ratios** to validate optimization effectiveness
- **Regular VACUUM scheduling** to maintain visibility map
- **Test performance impact** of covering index changes

Index-only scans provide dramatic performance improvements when properly implemented, making them essential for high-performance PostgreSQL applications with predictable query patterns.
