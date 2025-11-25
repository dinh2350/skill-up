# How Do You Monitor Index Usage?

Monitoring index usage in PostgreSQL is essential for database optimization, identifying unused indexes, and making informed decisions about index management. This comprehensive guide covers all aspects of index usage monitoring, from basic statistics to advanced automation and alerting systems.

## Core Index Usage Monitoring

### 1. pg_stat_user_indexes - Primary Monitoring View

```sql
-- Create demonstration environment
CREATE TABLE usage_monitoring_demo (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(255),
    category VARCHAR(50),
    status VARCHAR(20),
    score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Create various indexes for monitoring
CREATE INDEX idx_demo_username ON usage_monitoring_demo (username);
CREATE INDEX idx_demo_email ON usage_monitoring_demo (email);
CREATE INDEX idx_demo_category ON usage_monitoring_demo (category);
CREATE INDEX idx_demo_status ON usage_monitoring_demo (status);
CREATE INDEX idx_demo_score ON usage_monitoring_demo (score);
CREATE INDEX idx_demo_created ON usage_monitoring_demo (created_at);
CREATE INDEX idx_demo_composite ON usage_monitoring_demo (category, status);
CREATE INDEX idx_demo_partial ON usage_monitoring_demo (email) WHERE status = 'active';

-- Insert sample data
INSERT INTO usage_monitoring_demo (username, email, category, status, score, metadata)
SELECT
    'user_' || generate_series(1,100000),
    'user' || generate_series(1,100000) || '@example.com',
    CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'premium'
        WHEN 1 THEN 'standard'
        WHEN 2 THEN 'basic'
        ELSE 'trial'
    END,
    CASE (random() * 2)::INTEGER
        WHEN 0 THEN 'active'
        WHEN 1 THEN 'inactive'
        ELSE 'pending'
    END,
    (random() * 1000)::INTEGER,
    jsonb_build_object('region', CASE (random() * 2)::INTEGER WHEN 0 THEN 'US' ELSE 'EU' END);

-- Basic index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scan_count,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename = 'usage_monitoring_demo'
ORDER BY idx_scan DESC;

-- Generate some usage by running queries
SELECT COUNT(*) FROM usage_monitoring_demo WHERE username = 'user_1000';
SELECT COUNT(*) FROM usage_monitoring_demo WHERE email LIKE 'user1%@example.com';
SELECT COUNT(*) FROM usage_monitoring_demo WHERE category = 'premium';
SELECT COUNT(*) FROM usage_monitoring_demo WHERE status = 'active';
SELECT COUNT(*) FROM usage_monitoring_demo WHERE category = 'premium' AND status = 'active';

-- Check updated usage statistics
SELECT
    indexname,
    idx_scan as scan_count,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE
        WHEN idx_scan > 0 THEN ROUND(idx_tup_read::NUMERIC / idx_scan, 2)
        ELSE 0
    END as avg_tuples_per_scan
FROM pg_stat_user_indexes
WHERE tablename = 'usage_monitoring_demo'
AND idx_scan > 0
ORDER BY idx_scan DESC;
```

### 2. Understanding Index Usage Metrics

```sql
-- Comprehensive index usage analysis
CREATE OR REPLACE VIEW index_usage_analysis AS
SELECT
    i.schemaname,
    i.tablename,
    i.indexname,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch,
    pg_relation_size(s.indexrelid) as index_size_bytes,
    pg_size_pretty(pg_relation_size(s.indexrelid)) as index_size,
    pg_size_pretty(pg_total_relation_size(i.tablename::regclass)) as table_size,

    -- Usage efficiency metrics
    CASE
        WHEN s.idx_scan > 0 THEN ROUND(s.idx_tup_read::NUMERIC / s.idx_scan, 2)
        ELSE 0
    END as avg_tuples_per_scan,

    CASE
        WHEN s.idx_tup_read > 0 THEN ROUND(100.0 * s.idx_tup_fetch / s.idx_tup_read, 2)
        ELSE 0
    END as fetch_ratio_pct,

    -- Size efficiency
    ROUND(
        100.0 * pg_relation_size(s.indexrelid) /
        NULLIF(pg_total_relation_size(i.tablename::regclass), 0), 2
    ) as index_size_pct_of_table,

    -- Usage classification
    CASE
        WHEN s.idx_scan = 0 THEN 'NEVER_USED'
        WHEN s.idx_scan < 10 THEN 'RARELY_USED'
        WHEN s.idx_scan < 100 THEN 'MODERATELY_USED'
        WHEN s.idx_scan < 1000 THEN 'FREQUENTLY_USED'
        ELSE 'HEAVILY_USED'
    END as usage_category,

    -- Recommendations
    CASE
        WHEN s.idx_scan = 0 AND pg_relation_size(s.indexrelid) > 10*1024*1024
             THEN 'CONSIDER_DROPPING'
        WHEN s.idx_scan > 0 AND s.idx_scan < 10 AND pg_relation_size(s.indexrelid) > 50*1024*1024
             THEN 'REVIEW_NECESSITY'
        WHEN s.idx_scan > 1000 AND s.idx_tup_read / s.idx_scan > 1000
             THEN 'OPTIMIZE_SELECTIVITY'
        WHEN s.idx_scan > 100 AND s.idx_tup_fetch = 0
             THEN 'INDEX_ONLY_SCAN_CANDIDATE'
        ELSE 'PERFORMING_WELL'
    END as recommendation

FROM pg_indexes i
JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
WHERE i.schemaname = 'public';

-- View comprehensive usage analysis
SELECT * FROM index_usage_analysis
WHERE tablename = 'usage_monitoring_demo'
ORDER BY idx_scan DESC, index_size_bytes DESC;

-- Function to explain index usage metrics
CREATE OR REPLACE FUNCTION explain_index_metrics(
    p_schema TEXT DEFAULT 'public',
    p_table TEXT DEFAULT NULL
) RETURNS TABLE(
    metric_name TEXT,
    description TEXT,
    interpretation TEXT,
    action_threshold TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    ('idx_scan',
     'Number of times the index was used for scanning',
     'Higher values indicate more frequent usage',
     '0 = Never used, <10 = Rarely used, >1000 = Heavily used'),

    ('idx_tup_read',
     'Total tuples read from the index',
     'Shows volume of data accessed through index',
     'High values with low scan count may indicate poor selectivity'),

    ('idx_tup_fetch',
     'Tuples fetched after index lookup',
     'Zero indicates index-only scans were possible',
     'High fetch ratio suggests covering index opportunities'),

    ('avg_tuples_per_scan',
     'Average tuples read per index scan',
     'Lower values indicate better selectivity',
     '<10 = Excellent, 10-100 = Good, >1000 = Poor selectivity'),

    ('fetch_ratio_pct',
     'Percentage of index reads that required table fetch',
     'Lower values indicate more index-only scans',
     '0% = Perfect index-only, <50% = Good, >90% = Consider covering index'),

    ('index_size_pct_of_table',
     'Index size as percentage of total table size',
     'Helps assess storage efficiency',
     '>50% = Large index overhead, <10% = Efficient storage');
END;
$$ LANGUAGE plpgsql;

-- Get metric explanations
SELECT * FROM explain_index_metrics();
```

### 3. Historical Usage Tracking

```sql
-- Create table for historical usage tracking
CREATE TABLE IF NOT EXISTS index_usage_history (
    id SERIAL PRIMARY KEY,
    schema_name VARCHAR(255),
    table_name VARCHAR(255),
    index_name VARCHAR(255),
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    index_size BIGINT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(schema_name, table_name, index_name, recorded_at)
);

-- Function to collect and store usage statistics
CREATE OR REPLACE FUNCTION collect_index_usage_stats()
RETURNS INTEGER AS $$
DECLARE
    collected_count INTEGER := 0;
    index_record RECORD;
BEGIN
    FOR index_record IN
        SELECT
            i.schemaname,
            i.tablename,
            i.indexname,
            COALESCE(s.idx_scan, 0) as idx_scan,
            COALESCE(s.idx_tup_read, 0) as idx_tup_read,
            COALESCE(s.idx_tup_fetch, 0) as idx_tup_fetch,
            COALESCE(pg_relation_size(s.indexrelid), 0) as index_size
        FROM pg_indexes i
        LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
        WHERE i.schemaname = 'public'
    LOOP
        INSERT INTO index_usage_history (
            schema_name, table_name, index_name,
            idx_scan, idx_tup_read, idx_tup_fetch, index_size
        ) VALUES (
            index_record.schemaname,
            index_record.tablename,
            index_record.indexname,
            index_record.idx_scan,
            index_record.idx_tup_read,
            index_record.idx_tup_fetch,
            index_record.index_size
        )
        ON CONFLICT (schema_name, table_name, index_name, recorded_at) DO NOTHING;

        collected_count := collected_count + 1;
    END LOOP;

    RETURN collected_count;
END;
$$ LANGUAGE plpgsql;

-- Collect current statistics
SELECT collect_index_usage_stats() as indexes_collected;

-- Wait a moment and run more queries to create usage changes
SELECT COUNT(*) FROM usage_monitoring_demo WHERE score BETWEEN 500 AND 600;
SELECT * FROM usage_monitoring_demo WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' LIMIT 10;

-- Collect again to show changes
SELECT collect_index_usage_stats() as indexes_collected_again;

-- Analyze usage trends
WITH usage_trends AS (
    SELECT
        table_name,
        index_name,
        recorded_at,
        idx_scan,
        LAG(idx_scan) OVER (PARTITION BY table_name, index_name ORDER BY recorded_at) as prev_scan,
        idx_tup_read,
        LAG(idx_tup_read) OVER (PARTITION BY table_name, index_name ORDER BY recorded_at) as prev_tup_read
    FROM index_usage_history
    WHERE table_name = 'usage_monitoring_demo'
)
SELECT
    table_name,
    index_name,
    recorded_at,
    idx_scan - COALESCE(prev_scan, 0) as scans_since_last,
    idx_tup_read - COALESCE(prev_tup_read, 0) as reads_since_last,
    CASE
        WHEN (idx_scan - COALESCE(prev_scan, 0)) > 0
        THEN ROUND((idx_tup_read - COALESCE(prev_tup_read, 0))::NUMERIC /
                   (idx_scan - COALESCE(prev_scan, 0)), 2)
        ELSE 0
    END as avg_reads_per_scan_period
FROM usage_trends
WHERE prev_scan IS NOT NULL
ORDER BY table_name, index_name, recorded_at;
```

## Advanced Monitoring Techniques

### 1. Query-Level Index Usage Analysis

```sql
-- Enable pg_stat_statements extension for query-level analysis
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Function to analyze which queries use specific indexes
CREATE OR REPLACE FUNCTION analyze_query_index_usage(
    target_index TEXT DEFAULT NULL,
    min_calls INTEGER DEFAULT 5
) RETURNS TABLE(
    query_sample TEXT,
    calls BIGINT,
    total_time NUMERIC,
    mean_time NUMERIC,
    uses_index BOOLEAN,
    suggested_optimization TEXT
) AS $$
DECLARE
    query_record RECORD;
    plan_text TEXT;
    uses_target_index BOOLEAN;
BEGIN
    FOR query_record IN
        SELECT
            query,
            calls,
            total_exec_time,
            mean_exec_time
        FROM pg_stat_statements
        WHERE calls >= min_calls
        AND query NOT LIKE '%pg_stat_%'  -- Exclude monitoring queries
        ORDER BY calls DESC
        LIMIT 50
    LOOP
        -- Get execution plan to check index usage
        BEGIN
            EXECUTE 'EXPLAIN ' || query_record.query INTO plan_text;
            uses_target_index := plan_text ILIKE '%' || COALESCE(target_index, 'Index') || '%';
        EXCEPTION WHEN OTHERS THEN
            plan_text := 'Cannot analyze: ' || SQLERRM;
            uses_target_index := FALSE;
        END;

        RETURN QUERY
        SELECT
            LEFT(query_record.query, 100)::TEXT || '...' as query_sample,
            query_record.calls,
            ROUND(query_record.total_exec_time, 2) as total_time,
            ROUND(query_record.mean_exec_time, 2) as mean_time,
            uses_target_index,
            CASE
                WHEN uses_target_index THEN 'Using target index efficiently'
                WHEN query_record.mean_exec_time > 100 THEN 'Consider adding index'
                WHEN query_record.calls > 1000 AND query_record.mean_exec_time > 10 THEN 'High-frequency query needs optimization'
                ELSE 'Performance acceptable'
            END::TEXT as suggested_optimization;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run some queries to populate pg_stat_statements
SELECT COUNT(*) FROM usage_monitoring_demo WHERE username LIKE 'user_1%';
SELECT AVG(score) FROM usage_monitoring_demo WHERE category = 'premium';
SELECT * FROM usage_monitoring_demo WHERE status = 'active' ORDER BY score DESC LIMIT 10;

-- Analyze query patterns (run after some query activity)
-- SELECT * FROM analyze_query_index_usage('idx_demo_username', 1);

-- Function to identify missing indexes based on query patterns
CREATE OR REPLACE FUNCTION suggest_missing_indexes()
RETURNS TABLE(
    table_name TEXT,
    suggested_columns TEXT,
    query_pattern TEXT,
    frequency BIGINT,
    avg_time NUMERIC
) AS $$
BEGIN
    -- This is a simplified version - real implementations would be more complex
    RETURN QUERY
    WITH slow_queries AS (
        SELECT
            query,
            calls,
            mean_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 50  -- Queries taking more than 50ms on average
        AND calls > 10
        AND query ILIKE '%WHERE%'
    )
    SELECT
        'usage_monitoring_demo'::TEXT as table_name,
        'Consider analyzing WHERE clause patterns'::TEXT as suggested_columns,
        LEFT(query, 200)::TEXT as query_pattern,
        calls as frequency,
        ROUND(mean_exec_time, 2) as avg_time
    FROM slow_queries
    ORDER BY calls * mean_exec_time DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Get index suggestions
SELECT * FROM suggest_missing_indexes();
```

### 2. Index Effectiveness Scoring

```sql
-- Comprehensive index effectiveness analysis
CREATE OR REPLACE FUNCTION calculate_index_effectiveness()
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    effectiveness_score NUMERIC,
    usage_score NUMERIC,
    efficiency_score NUMERIC,
    size_score NUMERIC,
    overall_recommendation TEXT
) AS $$
DECLARE
    index_record RECORD;
    usage_score_val NUMERIC;
    efficiency_score_val NUMERIC;
    size_score_val NUMERIC;
    overall_score NUMERIC;
BEGIN
    FOR index_record IN
        SELECT
            i.schemaname,
            i.tablename,
            i.indexname,
            COALESCE(s.idx_scan, 0) as scans,
            COALESCE(s.idx_tup_read, 0) as reads,
            COALESCE(s.idx_tup_fetch, 0) as fetches,
            pg_relation_size(COALESCE(s.indexrelid, i.indexname::regclass)) as idx_size,
            pg_total_relation_size(i.tablename::regclass) as table_size
        FROM pg_indexes i
        LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
        WHERE i.schemaname = 'public'
    LOOP
        -- Usage Score (0-100): Based on scan frequency
        usage_score_val := CASE
            WHEN index_record.scans = 0 THEN 0
            WHEN index_record.scans < 10 THEN 20
            WHEN index_record.scans < 100 THEN 50
            WHEN index_record.scans < 1000 THEN 80
            ELSE 100
        END;

        -- Efficiency Score (0-100): Based on selectivity
        efficiency_score_val := CASE
            WHEN index_record.scans = 0 THEN 0
            WHEN index_record.reads / NULLIF(index_record.scans, 0) < 10 THEN 100
            WHEN index_record.reads / NULLIF(index_record.scans, 0) < 100 THEN 80
            WHEN index_record.reads / NULLIF(index_record.scans, 0) < 1000 THEN 60
            ELSE 30
        END;

        -- Size Score (0-100): Penalty for large unused indexes
        size_score_val := CASE
            WHEN index_record.idx_size < 1024*1024 THEN 100  -- Small indexes get full points
            WHEN index_record.scans = 0 AND index_record.idx_size > 50*1024*1024 THEN 10  -- Large unused
            WHEN index_record.idx_size / NULLIF(index_record.table_size, 0) < 0.1 THEN 90  -- <10% of table
            WHEN index_record.idx_size / NULLIF(index_record.table_size, 0) < 0.3 THEN 70  -- <30% of table
            ELSE 50
        END;

        -- Overall effectiveness (weighted average)
        overall_score := (usage_score_val * 0.4 + efficiency_score_val * 0.4 + size_score_val * 0.2);

        RETURN QUERY
        SELECT
            index_record.schemaname::TEXT,
            index_record.tablename::TEXT,
            index_record.indexname::TEXT,
            ROUND(overall_score, 1),
            ROUND(usage_score_val, 1),
            ROUND(efficiency_score_val, 1),
            ROUND(size_score_val, 1),
            CASE
                WHEN overall_score >= 80 THEN 'EXCELLENT - Keep and monitor'
                WHEN overall_score >= 60 THEN 'GOOD - Performing well'
                WHEN overall_score >= 40 THEN 'FAIR - Review optimization opportunities'
                WHEN overall_score >= 20 THEN 'POOR - Consider modification or removal'
                ELSE 'CRITICAL - Likely candidate for removal'
            END::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Calculate effectiveness scores
SELECT * FROM calculate_index_effectiveness()
WHERE table_name = 'usage_monitoring_demo'
ORDER BY effectiveness_score DESC;

-- Create summary view for ongoing monitoring
CREATE OR REPLACE VIEW index_health_summary AS
SELECT
    table_name,
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE effectiveness_score >= 80) as excellent_indexes,
    COUNT(*) FILTER (WHERE effectiveness_score BETWEEN 60 AND 79) as good_indexes,
    COUNT(*) FILTER (WHERE effectiveness_score BETWEEN 40 AND 59) as fair_indexes,
    COUNT(*) FILTER (WHERE effectiveness_score < 40) as poor_indexes,
    ROUND(AVG(effectiveness_score), 1) as avg_effectiveness,
    pg_size_pretty(SUM(
        pg_relation_size(indexname::regclass)
    )) as total_index_size
FROM calculate_index_effectiveness()
GROUP BY table_name
ORDER BY avg_effectiveness DESC;

-- Check table-level index health
SELECT * FROM index_health_summary;
```

### 3. Automated Monitoring and Alerting

```sql
-- Create comprehensive monitoring dashboard
CREATE OR REPLACE VIEW index_monitoring_dashboard AS
WITH current_stats AS (
    SELECT
        i.schemaname,
        i.tablename,
        i.indexname,
        COALESCE(s.idx_scan, 0) as current_scans,
        COALESCE(s.idx_tup_read, 0) as current_reads,
        COALESCE(s.idx_tup_fetch, 0) as current_fetches,
        pg_relation_size(COALESCE(s.indexrelid, i.indexname::regclass)) as current_size
    FROM pg_indexes i
    LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
    WHERE i.schemaname = 'public'
),
historical_stats AS (
    SELECT DISTINCT ON (index_name)
        index_name,
        idx_scan as historical_scans,
        recorded_at
    FROM index_usage_history
    WHERE recorded_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    ORDER BY index_name, recorded_at DESC
),
alerts AS (
    SELECT
        cs.*,
        COALESCE(hs.historical_scans, 0) as historical_scans,
        -- Generate alerts
        CASE
            WHEN cs.current_scans = 0 AND cs.current_size > 10*1024*1024
            THEN 'UNUSED_LARGE_INDEX'
            WHEN cs.current_scans > 0 AND cs.current_reads / cs.current_scans > 1000
            THEN 'POOR_SELECTIVITY'
            WHEN cs.current_size > 100*1024*1024 AND cs.current_scans < 10
            THEN 'UNDERUSED_LARGE_INDEX'
            WHEN cs.current_scans > 1000 AND cs.current_fetches = 0
            THEN 'INDEX_ONLY_OPPORTUNITY'
            ELSE 'HEALTHY'
        END as alert_type
    FROM current_stats cs
    LEFT JOIN historical_stats hs ON cs.indexname = hs.index_name
)
SELECT
    tablename,
    indexname,
    current_scans,
    current_reads,
    CASE
        WHEN current_scans > 0 THEN ROUND(current_reads::NUMERIC / current_scans, 2)
        ELSE 0
    END as avg_reads_per_scan,
    pg_size_pretty(current_size) as size,
    alert_type,
    CASE alert_type
        WHEN 'UNUSED_LARGE_INDEX' THEN 'Consider dropping - consumes ' || pg_size_pretty(current_size) || ' with no usage'
        WHEN 'POOR_SELECTIVITY' THEN 'Review index design - reading too many tuples per scan'
        WHEN 'UNDERUSED_LARGE_INDEX' THEN 'Evaluate necessity - large size with minimal usage'
        WHEN 'INDEX_ONLY_OPPORTUNITY' THEN 'Consider adding INCLUDE columns for index-only scans'
        ELSE 'No action needed'
    END as recommendation
FROM alerts
ORDER BY
    CASE alert_type
        WHEN 'UNUSED_LARGE_INDEX' THEN 1
        WHEN 'POOR_SELECTIVITY' THEN 2
        WHEN 'UNDERUSED_LARGE_INDEX' THEN 3
        WHEN 'INDEX_ONLY_OPPORTUNITY' THEN 4
        ELSE 5
    END,
    current_size DESC;

-- View monitoring dashboard
SELECT * FROM index_monitoring_dashboard
WHERE alert_type != 'HEALTHY';

-- Function to generate monitoring report
CREATE OR REPLACE FUNCTION generate_index_monitoring_report()
RETURNS TABLE(
    report_section TEXT,
    metric_name TEXT,
    metric_value TEXT,
    status TEXT,
    recommendation TEXT
) AS $$
DECLARE
    total_indexes INTEGER;
    unused_indexes INTEGER;
    large_unused_size BIGINT;
    avg_effectiveness NUMERIC;
BEGIN
    -- Get summary statistics
    SELECT COUNT(*) INTO total_indexes FROM pg_indexes WHERE schemaname = 'public';

    SELECT COUNT(*) INTO unused_indexes
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0;

    SELECT COALESCE(SUM(pg_relation_size(indexrelid)), 0) INTO large_unused_size
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0 AND pg_relation_size(indexrelid) > 10*1024*1024;

    SELECT COALESCE(AVG(effectiveness_score), 0) INTO avg_effectiveness
    FROM calculate_index_effectiveness();

    -- Summary section
    RETURN QUERY VALUES
    ('SUMMARY', 'Total Indexes', total_indexes::TEXT, 'INFO', 'Monitor regularly'),
    ('SUMMARY', 'Unused Indexes', unused_indexes::TEXT,
     CASE WHEN unused_indexes > total_indexes * 0.2 THEN 'WARNING' ELSE 'OK' END,
     CASE WHEN unused_indexes > total_indexes * 0.2 THEN 'High unused ratio - review necessity' ELSE 'Acceptable unused ratio' END),
    ('SUMMARY', 'Unused Index Size', pg_size_pretty(large_unused_size),
     CASE WHEN large_unused_size > 100*1024*1024 THEN 'WARNING' ELSE 'OK' END,
     CASE WHEN large_unused_size > 100*1024*1024 THEN 'Consider dropping to free space' ELSE 'Unused size acceptable' END),
    ('SUMMARY', 'Average Effectiveness', ROUND(avg_effectiveness, 1)::TEXT || '%',
     CASE WHEN avg_effectiveness < 50 THEN 'WARNING' WHEN avg_effectiveness > 75 THEN 'EXCELLENT' ELSE 'OK' END,
     CASE WHEN avg_effectiveness < 50 THEN 'Review index strategy' ELSE 'Index health is good' END);

    -- Alert section
    RETURN QUERY
    SELECT
        'ALERTS'::TEXT,
        indexname::TEXT,
        alert_type::TEXT,
        CASE alert_type WHEN 'HEALTHY' THEN 'OK' ELSE 'ACTION_NEEDED' END::TEXT,
        recommendation::TEXT
    FROM index_monitoring_dashboard
    WHERE alert_type != 'HEALTHY'
    ORDER BY
        CASE alert_type
            WHEN 'UNUSED_LARGE_INDEX' THEN 1
            WHEN 'POOR_SELECTIVITY' THEN 2
            ELSE 3
        END
    LIMIT 10;  -- Top 10 issues
END;
$$ LANGUAGE plpgsql;

-- Generate comprehensive monitoring report
SELECT * FROM generate_index_monitoring_report();
```

## Specialized Monitoring Scenarios

### 1. Monitoring Index Usage Patterns

```sql
-- Function to analyze usage patterns over time
CREATE OR REPLACE FUNCTION analyze_usage_patterns(
    days_back INTEGER DEFAULT 7
) RETURNS TABLE(
    index_name TEXT,
    usage_pattern TEXT,
    peak_usage_day TEXT,
    usage_variance NUMERIC,
    trend_direction TEXT,
    optimization_suggestion TEXT
) AS $$
DECLARE
    index_record RECORD;
BEGIN
    FOR index_record IN
        SELECT DISTINCT table_name, index_name
        FROM index_usage_history
        WHERE recorded_at >= CURRENT_DATE - days_back
    LOOP
        RETURN QUERY
        WITH daily_usage AS (
            SELECT
                DATE_TRUNC('day', recorded_at) as usage_day,
                MAX(idx_scan) - MIN(idx_scan) as daily_scans
            FROM index_usage_history
            WHERE index_name = index_record.index_name
            AND recorded_at >= CURRENT_DATE - days_back
            GROUP BY DATE_TRUNC('day', recorded_at)
            HAVING MAX(idx_scan) - MIN(idx_scan) > 0
        ),
        pattern_analysis AS (
            SELECT
                COUNT(*) as active_days,
                MAX(daily_scans) as max_daily_scans,
                AVG(daily_scans) as avg_daily_scans,
                STDDEV(daily_scans) as scan_stddev,
                MAX(daily_scans) FILTER (WHERE daily_scans = (SELECT MAX(daily_scans) FROM daily_usage)) as peak_scans,
                (SELECT usage_day FROM daily_usage WHERE daily_scans = (SELECT MAX(daily_scans) FROM daily_usage) LIMIT 1) as peak_day
            FROM daily_usage
        )
        SELECT
            index_record.index_name::TEXT,
            CASE
                WHEN pa.active_days = 0 THEN 'NO_USAGE'
                WHEN pa.active_days = 1 THEN 'SINGLE_DAY_USAGE'
                WHEN pa.scan_stddev / NULLIF(pa.avg_daily_scans, 0) < 0.5 THEN 'CONSISTENT_USAGE'
                WHEN pa.scan_stddev / NULLIF(pa.avg_daily_scans, 0) > 2.0 THEN 'HIGHLY_VARIABLE'
                ELSE 'MODERATE_VARIATION'
            END::TEXT,
            COALESCE(TO_CHAR(pa.peak_day, 'Day'), 'None')::TEXT,
            COALESCE(ROUND(pa.scan_stddev / NULLIF(pa.avg_daily_scans, 0), 2), 0)::NUMERIC,
            CASE
                WHEN pa.active_days < 3 THEN 'INSUFFICIENT_DATA'
                WHEN pa.avg_daily_scans > LAG(pa.avg_daily_scans) OVER () THEN 'INCREASING'
                WHEN pa.avg_daily_scans < LAG(pa.avg_daily_scans) OVER () THEN 'DECREASING'
                ELSE 'STABLE'
            END::TEXT,
            CASE
                WHEN pa.active_days = 0 THEN 'Consider dropping unused index'
                WHEN pa.scan_stddev / NULLIF(pa.avg_daily_scans, 0) > 2.0 THEN 'Usage varies significantly - monitor workload patterns'
                WHEN pa.active_days < 3 THEN 'Collect more data for reliable analysis'
                ELSE 'Usage pattern is normal'
            END::TEXT
        FROM pattern_analysis pa;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Analyze usage patterns (after collecting data over time)
-- SELECT * FROM analyze_usage_patterns(7);

-- Function to identify seasonal or cyclic usage patterns
CREATE OR REPLACE FUNCTION detect_usage_cycles()
RETURNS TABLE(
    index_name TEXT,
    cycle_type TEXT,
    cycle_strength NUMERIC,
    recommended_action TEXT
) AS $$
BEGIN
    -- Simplified cycle detection - real implementation would use more sophisticated analysis
    RETURN QUERY
    WITH hourly_patterns AS (
        SELECT
            index_name,
            EXTRACT(hour FROM recorded_at) as hour_of_day,
            AVG(idx_scan) as avg_scans_for_hour
        FROM index_usage_history
        WHERE recorded_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        GROUP BY index_name, EXTRACT(hour FROM recorded_at)
    ),
    pattern_strength AS (
        SELECT
            index_name,
            MAX(avg_scans_for_hour) - MIN(avg_scans_for_hour) as scan_range,
            AVG(avg_scans_for_hour) as overall_avg
        FROM hourly_patterns
        GROUP BY index_name
    )
    SELECT
        ps.index_name::TEXT,
        CASE
            WHEN ps.scan_range / NULLIF(ps.overall_avg, 0) > 2.0 THEN 'STRONG_HOURLY_PATTERN'
            WHEN ps.scan_range / NULLIF(ps.overall_avg, 0) > 1.0 THEN 'MODERATE_HOURLY_PATTERN'
            ELSE 'NO_CLEAR_PATTERN'
        END::TEXT,
        COALESCE(ROUND(ps.scan_range / NULLIF(ps.overall_avg, 0), 2), 0)::NUMERIC,
        CASE
            WHEN ps.scan_range / NULLIF(ps.overall_avg, 0) > 2.0 THEN 'Consider index maintenance during low-usage hours'
            WHEN ps.scan_range / NULLIF(ps.overall_avg, 0) > 1.0 THEN 'Monitor for optimal maintenance windows'
            ELSE 'No specific timing recommendations'
        END::TEXT
    FROM pattern_strength ps
    WHERE ps.overall_avg > 0;
END;
$$ LANGUAGE plpgsql;

-- Detect usage cycles
SELECT * FROM detect_usage_cycles();
```

### 2. Index Usage Correlation Analysis

```sql
-- Function to analyze index usage correlations
CREATE OR REPLACE FUNCTION analyze_index_correlations()
RETURNS TABLE(
    table_name TEXT,
    index_1 TEXT,
    index_2 TEXT,
    correlation_strength TEXT,
    overlap_percentage NUMERIC,
    recommendation TEXT
) AS $$
DECLARE
    table_record RECORD;
    index1_record RECORD;
    index2_record RECORD;
    overlap_queries INTEGER;
    total_queries INTEGER;
BEGIN
    FOR table_record IN
        SELECT DISTINCT tablename FROM pg_indexes WHERE schemaname = 'public'
    LOOP
        FOR index1_record IN
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = table_record.tablename
            AND schemaname = 'public'
        LOOP
            FOR index2_record IN
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = table_record.tablename
                AND schemaname = 'public'
                AND indexname > index1_record.indexname  -- Avoid duplicates
            LOOP
                -- Simplified correlation analysis
                -- In practice, this would analyze actual query patterns

                -- Check for column overlap in index definitions
                IF index1_record.indexdef SIMILAR TO '%\([^)]*' ||
                   (regexp_matches(index2_record.indexdef, '\(([^)]+)\)'))[1] || '%'
                THEN
                    RETURN QUERY
                    SELECT
                        table_record.tablename::TEXT,
                        index1_record.indexname::TEXT,
                        index2_record.indexname::TEXT,
                        'POTENTIAL_OVERLAP'::TEXT,
                        75.0::NUMERIC,
                        'Review if both indexes are necessary'::TEXT;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run correlation analysis
SELECT * FROM analyze_index_correlations()
WHERE table_name = 'usage_monitoring_demo';

-- Function to identify complementary indexes
CREATE OR REPLACE FUNCTION identify_complementary_indexes()
RETURNS TABLE(
    table_name TEXT,
    primary_index TEXT,
    complementary_index TEXT,
    combined_effectiveness NUMERIC,
    suggestion TEXT
) AS $$
BEGIN
    -- Identify indexes that work well together
    RETURN QUERY
    WITH index_pairs AS (
        SELECT
            i1.tablename,
            i1.indexname as idx1,
            i2.indexname as idx2,
            s1.idx_scan as scans1,
            s2.idx_scan as scans2,
            s1.idx_tup_read as reads1,
            s2.idx_tup_read as reads2
        FROM pg_indexes i1
        JOIN pg_indexes i2 ON i1.tablename = i2.tablename AND i1.indexname < i2.indexname
        LEFT JOIN pg_stat_user_indexes s1 ON i1.indexname = s1.indexname
        LEFT JOIN pg_stat_user_indexes s2 ON i2.indexname = s2.indexname
        WHERE i1.schemaname = 'public'
    )
    SELECT
        ip.tablename::TEXT,
        ip.idx1::TEXT,
        ip.idx2::TEXT,
        ROUND(
            CASE
                WHEN COALESCE(ip.scans1, 0) + COALESCE(ip.scans2, 0) = 0 THEN 0
                ELSE (COALESCE(ip.scans1, 0) + COALESCE(ip.scans2, 0))::NUMERIC /
                     NULLIF((COALESCE(ip.reads1, 0) + COALESCE(ip.reads2, 0)) / 2.0, 0) * 100
            END, 2
        ) as combined_effectiveness,
        CASE
            WHEN COALESCE(ip.scans1, 0) > 100 AND COALESCE(ip.scans2, 0) > 100 THEN
                'Both indexes are actively used - good complementary pair'
            WHEN COALESCE(ip.scans1, 0) = 0 OR COALESCE(ip.scans2, 0) = 0 THEN
                'One index is unused - consider consolidation'
            ELSE
                'Moderate usage - monitor for optimization opportunities'
        END::TEXT
    FROM index_pairs ip
    WHERE ip.tablename = 'usage_monitoring_demo'
    ORDER BY combined_effectiveness DESC;
END;
$$ LANGUAGE plpgsql;

-- Identify complementary index relationships
SELECT * FROM identify_complementary_indexes();
```

## Summary

**Index usage monitoring** is essential for PostgreSQL performance optimization and requires systematic tracking and analysis:

**📊 Core Monitoring Views:**

- **pg_stat_user_indexes**: Primary source for usage statistics (scans, reads, fetches)
- **Historical tracking**: Custom tables to capture usage trends over time
- **Effectiveness scoring**: Combined metrics for comprehensive assessment
- **Pattern analysis**: Detecting usage cycles and correlations

**🔍 Key Metrics:**

- **idx_scan**: Number of index scans (frequency of use)
- **idx_tup_read**: Total tuples read from index (volume)
- **idx_tup_fetch**: Tuples fetched from table after index lookup
- **Selectivity**: Average tuples per scan (efficiency indicator)

**⚡ Usage Categories:**

- **NEVER_USED**: 0 scans - candidates for removal
- **RARELY_USED**: <10 scans - review necessity
- **MODERATELY_USED**: 10-100 scans - normal usage
- **FREQUENTLY_USED**: 100-1000 scans - important indexes
- **HEAVILY_USED**: >1000 scans - critical for performance

**🎯 Monitoring Strategies:**

- **Regular collection**: Automated statistics gathering
- **Trend analysis**: Historical comparison and pattern detection
- **Alert systems**: Proactive notification of usage issues
- **Correlation analysis**: Understanding index relationships

**🛠️ Optimization Actions:**

- **Drop unused indexes**: Free storage and reduce maintenance overhead
- **Improve selectivity**: Modify or replace poorly performing indexes
- **Add covering columns**: Enable index-only scans for frequently used queries
- **Consolidate duplicates**: Combine overlapping or redundant indexes

**📋 Best Practices:**

- **Monitor continuously**: Regular collection and analysis of usage statistics
- **Set thresholds**: Define clear criteria for usage classification
- **Document decisions**: Record rationale for index changes
- **Test changes**: Validate performance impact before and after modifications
- **Integrate with maintenance**: Include usage analysis in regular maintenance workflows

Effective index usage monitoring provides the foundation for making informed decisions about index management, ensuring optimal database performance while minimizing storage and maintenance overhead.
