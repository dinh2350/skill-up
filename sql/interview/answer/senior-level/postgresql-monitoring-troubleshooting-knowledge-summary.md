# PostgreSQL Monitoring & Troubleshooting Knowledge Summary (Q361-390)

## Learning Objectives
This guide provides comprehensive knowledge needed to answer PostgreSQL monitoring and troubleshooting interview questions Q361-390, covering performance monitoring, key metrics, system catalog tables, query analysis, configuration tuning, monitoring tools, and common troubleshooting scenarios.

## Core Learning Areas

### 1. PostgreSQL Performance Monitoring Fundamentals (Q361-362)

#### Comprehensive Performance Monitoring Strategy
```sql
-- Multi-layered monitoring approach covering:
-- 1. System-level metrics (CPU, memory, I/O)
-- 2. PostgreSQL-specific metrics (connections, locks, transactions)
-- 3. Query-level performance (execution time, plans)
-- 4. Application-level metrics (response time, throughput)

-- Key monitoring categories:
-- - Resource utilization
-- - Query performance
-- - Connection management
-- - Lock contention
-- - I/O patterns
-- - Replication lag
```

#### Essential Performance Metrics to Monitor

#### System Resource Metrics
```sql
-- CPU utilization
-- Query: Check current system load
SELECT 
    now() as timestamp,
    avg(cpu_user + cpu_system) as cpu_usage_percent,
    cpu_idle
FROM pg_stat_bgwriter;

-- Memory usage
SHOW shared_buffers;
SHOW work_mem;
SHOW maintenance_work_mem;
SHOW effective_cache_size;

-- Disk I/O metrics
SELECT 
    schemaname,
    relname,
    heap_blks_read,
    heap_blks_hit,
    round((heap_blks_hit::numeric / NULLIF(heap_blks_hit + heap_blks_read, 0)) * 100, 2) as cache_hit_ratio
FROM pg_statio_user_tables
WHERE heap_blks_read + heap_blks_hit > 0
ORDER BY cache_hit_ratio ASC;
```

#### Database Performance Metrics
```sql
-- Connection metrics
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections,
    count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity;

-- Transaction throughput
SELECT 
    datname,
    xact_commit,
    xact_rollback,
    round((xact_commit::numeric / NULLIF(xact_commit + xact_rollback, 0)) * 100, 2) as commit_ratio,
    blks_read,
    blks_hit,
    round((blks_hit::numeric / NULLIF(blks_hit + blks_read, 0)) * 100, 2) as cache_hit_ratio
FROM pg_stat_database 
WHERE datname NOT IN ('template0', 'template1');

-- Lock monitoring
SELECT 
    mode,
    count(*) as lock_count
FROM pg_locks 
WHERE granted = true
GROUP BY mode
ORDER BY count(*) DESC;
```

#### Performance Baseline Establishment
```sql
-- Create performance baseline monitoring view
CREATE VIEW performance_baseline AS
SELECT 
    now() as measurement_time,
    -- Connection metrics
    (SELECT count(*) FROM pg_stat_activity) as total_connections,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
    -- Transaction metrics
    (SELECT sum(xact_commit) FROM pg_stat_database) as total_commits,
    (SELECT sum(xact_rollback) FROM pg_stat_database) as total_rollbacks,
    -- I/O metrics
    (SELECT sum(blks_read) FROM pg_stat_database) as total_blocks_read,
    (SELECT sum(blks_hit) FROM pg_stat_database) as total_blocks_hit,
    -- Lock metrics
    (SELECT count(*) FROM pg_locks WHERE granted = false) as waiting_locks;

-- Sample baseline data collection
INSERT INTO performance_history 
SELECT * FROM performance_baseline;
```

### 2. pg_stat_statements Extension (Q363-366)

#### pg_stat_statements Setup and Configuration
```sql
-- Enable pg_stat_statements extension
-- Add to postgresql.conf:
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
pg_stat_statements.track_utility = on
pg_stat_statements.track_planning = on

-- Restart PostgreSQL, then create extension
CREATE EXTENSION pg_stat_statements;

-- Verify installation
SELECT * FROM pg_stat_statements LIMIT 5;
```

#### Query Performance Analysis with pg_stat_statements
```sql
-- Top 10 slowest queries by total time
SELECT 
    query,
    calls,
    total_exec_time,
    round(total_exec_time / calls, 2) as avg_exec_time_ms,
    round((total_exec_time / sum(total_exec_time) OVER()) * 100, 2) as percentage_of_total
FROM pg_stat_statements 
WHERE calls > 10
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Most frequently called queries
SELECT 
    query,
    calls,
    total_exec_time,
    round(total_exec_time / calls, 2) as avg_exec_time_ms,
    round((calls::numeric / sum(calls) OVER()) * 100, 2) as percentage_of_calls
FROM pg_stat_statements 
ORDER BY calls DESC 
LIMIT 10;

-- Queries with highest I/O impact
SELECT 
    query,
    calls,
    shared_blks_hit,
    shared_blks_read,
    shared_blks_written,
    round((shared_blks_read::numeric / NULLIF(shared_blks_hit + shared_blks_read, 0)) * 100, 2) as cache_miss_ratio
FROM pg_stat_statements 
WHERE shared_blks_read + shared_blks_hit > 1000
ORDER BY shared_blks_read DESC 
LIMIT 10;

-- Queries with high variability (inconsistent performance)
SELECT 
    query,
    calls,
    round(mean_exec_time, 2) as avg_time_ms,
    round(stddev_exec_time, 2) as stddev_time_ms,
    round((stddev_exec_time / NULLIF(mean_exec_time, 0)) * 100, 2) as coefficient_of_variation
FROM pg_stat_statements 
WHERE calls > 100
ORDER BY (stddev_exec_time / NULLIF(mean_exec_time, 0)) DESC 
LIMIT 10;
```

#### Slow Query Identification and Analysis
```sql
-- Identify slow queries using log_min_duration_statement
-- In postgresql.conf:
log_min_duration_statement = 1000  -- Log queries > 1 second
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'all'  -- Optional: log all statements

-- Query to find queries that should be optimized
WITH slow_queries AS (
    SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time,
        min_exec_time,
        stddev_exec_time,
        shared_blks_read,
        shared_blks_hit,
        shared_blks_written
    FROM pg_stat_statements
    WHERE mean_exec_time > 100  -- Queries averaging > 100ms
),
query_analysis AS (
    SELECT 
        *,
        round((shared_blks_read::numeric / NULLIF(shared_blks_hit + shared_blks_read, 0)) * 100, 2) as cache_miss_ratio,
        round((total_exec_time / sum(total_exec_time) OVER()) * 100, 2) as time_percentage
    FROM slow_queries
)
SELECT 
    LEFT(query, 80) || '...' as query_preview,
    calls,
    round(mean_exec_time, 2) as avg_time_ms,
    round(max_exec_time, 2) as max_time_ms,
    cache_miss_ratio,
    time_percentage
FROM query_analysis
ORDER BY mean_exec_time DESC;

-- Reset statistics for fresh analysis
SELECT pg_stat_statements_reset();
```

#### Advanced Query Performance Analysis
```sql
-- Query performance trends over time
CREATE TABLE query_performance_history (
    recorded_at TIMESTAMP DEFAULT now(),
    query_hash BIGINT,
    query_text TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    cache_hit_ratio NUMERIC
);

-- Collect performance snapshots
INSERT INTO query_performance_history (query_hash, query_text, calls, total_time, mean_time, cache_hit_ratio)
SELECT 
    queryid,
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    round((shared_blks_hit::numeric / NULLIF(shared_blks_hit + shared_blks_read, 0)) * 100, 2)
FROM pg_stat_statements
WHERE calls > 10;

-- Analyze performance degradation over time
WITH performance_comparison AS (
    SELECT 
        query_hash,
        LEFT(query_text, 50) as query_preview,
        recorded_at,
        mean_time,
        LAG(mean_time) OVER (PARTITION BY query_hash ORDER BY recorded_at) as prev_mean_time
    FROM query_performance_history
    WHERE recorded_at > now() - interval '7 days'
)
SELECT 
    query_preview,
    recorded_at,
    mean_time as current_mean_ms,
    prev_mean_time as previous_mean_ms,
    round(((mean_time - prev_mean_time) / NULLIF(prev_mean_time, 0)) * 100, 2) as performance_change_percent
FROM performance_comparison
WHERE prev_mean_time IS NOT NULL
    AND abs((mean_time - prev_mean_time) / NULLIF(prev_mean_time, 0)) > 0.2  -- 20% change threshold
ORDER BY performance_change_percent DESC;
```

### 3. System Catalog Tables and Statistics Views (Q367-375)

#### Essential System Catalog Tables

#### pg_stat_activity - Current Activity Monitoring
```sql
-- Current active connections and queries
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    state,
    query_start,
    CASE 
        WHEN state = 'active' THEN now() - query_start
        ELSE NULL
    END as query_duration,
    LEFT(query, 100) as current_query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start ASC;

-- Identify long-running queries
SELECT 
    pid,
    usename,
    client_addr,
    state,
    now() - query_start as duration,
    query
FROM pg_stat_activity 
WHERE state = 'active'
    AND now() - query_start > interval '5 minutes'
ORDER BY query_start ASC;

-- Connection state summary
SELECT 
    state,
    count(*) as connection_count,
    round(avg(extract(epoch from now() - backend_start)), 2) as avg_connection_age_seconds
FROM pg_stat_activity
GROUP BY state
ORDER BY connection_count DESC;
```

#### pg_stat_database - Database-Level Statistics
```sql
-- Database activity overview
SELECT 
    datname,
    numbackends as active_connections,
    xact_commit,
    xact_rollback,
    round((xact_commit::numeric / NULLIF(xact_commit + xact_rollback, 0)) * 100, 2) as commit_ratio,
    blks_read,
    blks_hit,
    round((blks_hit::numeric / NULLIF(blks_hit + blks_read, 0)) * 100, 2) as cache_hit_ratio,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database 
WHERE datname NOT IN ('template0', 'template1')
ORDER BY xact_commit DESC;

-- Database I/O performance
SELECT 
    datname,
    blks_read,
    blks_hit,
    round((blks_hit::numeric / NULLIF(blks_hit + blks_read, 0)) * 100, 2) as cache_hit_ratio,
    blk_read_time,
    blk_write_time,
    round(blk_read_time / NULLIF(blks_read, 0), 2) as avg_read_time_ms,
    round(blk_write_time / NULLIF(blks_read + blks_hit, 0), 2) as avg_io_time_ms
FROM pg_stat_database
WHERE datname NOT IN ('template0', 'template1')
ORDER BY cache_hit_ratio ASC;
```

#### pg_stat_user_tables - Table Access Patterns
```sql
-- Table activity analysis
SELECT 
    schemaname,
    relname as table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_tup_hot_upd as hot_updates,
    round((idx_scan::numeric / NULLIF(seq_scan + idx_scan, 0)) * 100, 2) as index_usage_ratio
FROM pg_stat_user_tables
ORDER BY seq_tup_read DESC;

-- Tables needing attention (high sequential scans)
SELECT 
    schemaname,
    relname,
    seq_scan,
    seq_tup_read,
    round(seq_tup_read / NULLIF(seq_scan, 0), 0) as avg_rows_per_scan,
    idx_scan,
    CASE 
        WHEN seq_scan > idx_scan THEN 'Consider adding indexes'
        WHEN seq_tup_read > 10000 AND seq_scan > 100 THEN 'High scan activity'
        ELSE 'OK'
    END as recommendation
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;

-- Table maintenance needs
SELECT 
    schemaname,
    relname,
    n_dead_tup,
    n_live_tup,
    round((n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_tuple_ratio,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_tuple_ratio DESC;
```

#### pg_stat_user_indexes - Index Usage Analysis
```sql
-- Index usage efficiency
SELECT 
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    round(idx_tup_read / NULLIF(idx_scan, 0), 2) as avg_tuples_per_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'Unused - consider dropping'
        WHEN idx_scan < 10 THEN 'Low usage'
        WHEN avg(idx_tup_read / NULLIF(idx_scan, 0)) OVER() > 1000 THEN 'High selectivity'
        ELSE 'Normal usage'
    END as index_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Unused indexes (candidates for removal)
SELECT 
    schemaname,
    relname as table_name,
    indexrelname as index_name,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes pgsui
JOIN pg_index pgi ON pgsui.indexrelid = pgi.indexrelid
WHERE idx_scan = 0 
    AND NOT pgi.indisunique  -- Keep unique indexes
    AND NOT pgi.indisprimary  -- Keep primary key indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index cache hit ratio
SELECT 
    schemaname,
    relname,
    indexrelname,
    idx_blks_read,
    idx_blks_hit,
    round((idx_blks_hit::numeric / NULLIF(idx_blks_hit + idx_blks_read, 0)) * 100, 2) as cache_hit_ratio
FROM pg_statio_user_indexes
WHERE idx_blks_read + idx_blks_hit > 0
ORDER BY cache_hit_ratio ASC;
```

#### pg_locks - Lock Analysis and Blocking Queries
```sql
-- Current lock overview
SELECT 
    mode,
    locktype,
    count(*) as lock_count
FROM pg_locks
WHERE granted = true
GROUP BY mode, locktype
ORDER BY lock_count DESC;

-- Blocking query analysis
SELECT 
    blocking.pid as blocking_pid,
    blocking.usename as blocking_user,
    blocking.query as blocking_query,
    blocked.pid as blocked_pid,
    blocked.usename as blocked_user,
    blocked.query as blocked_query,
    now() - blocked.query_start as blocked_duration
FROM pg_stat_activity blocked
JOIN pg_locks blocked_locks ON blocked.pid = blocked_locks.pid
JOIN pg_locks blocking_locks ON blocking_locks.transactionid = blocked_locks.transactionid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_stat_activity blocking ON blocking.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Lock wait analysis
WITH lock_waits AS (
    SELECT 
        waiting.locktype,
        waiting.mode,
        waiting.pid as waiting_pid,
        waiting_activity.usename as waiting_user,
        waiting_activity.query as waiting_query,
        blocking.pid as blocking_pid,
        blocking_activity.usename as blocking_user,
        blocking_activity.query as blocking_query,
        now() - waiting_activity.query_start as wait_duration
    FROM pg_locks waiting
    JOIN pg_stat_activity waiting_activity ON waiting.pid = waiting_activity.pid
    JOIN pg_locks blocking ON waiting.transactionid = blocking.transactionid
        AND waiting.pid != blocking.pid
    JOIN pg_stat_activity blocking_activity ON blocking.pid = blocking_activity.pid
    WHERE NOT waiting.granted
)
SELECT * FROM lock_waits
ORDER BY wait_duration DESC;
```

#### pg_stat_bgwriter - Background Writer Statistics
```sql
-- Background writer performance
SELECT 
    checkpoints_timed,
    checkpoints_req,
    checkpoint_write_time,
    checkpoint_sync_time,
    buffers_checkpoint,
    buffers_clean,
    buffers_backend,
    buffers_backend_fsync,
    buffers_alloc,
    round((checkpoints_timed::numeric / NULLIF(checkpoints_timed + checkpoints_req, 0)) * 100, 2) as timed_checkpoint_ratio
FROM pg_stat_bgwriter;

-- Checkpoint analysis
SELECT 
    'Checkpoint Frequency' as metric,
    round((checkpoints_timed + checkpoints_req) / 
        extract(epoch from (now() - pg_postmaster_start_time())) * 3600, 2) as checkpoints_per_hour
FROM pg_stat_bgwriter
UNION ALL
SELECT 
    'Average Checkpoint Write Time',
    round(checkpoint_write_time / NULLIF(checkpoints_timed + checkpoints_req, 0), 2)
FROM pg_stat_bgwriter
UNION ALL
SELECT 
    'Average Checkpoint Sync Time',
    round(checkpoint_sync_time / NULLIF(checkpoints_timed + checkpoints_req, 0), 2)
FROM pg_stat_bgwriter;
```

### 4. PostgreSQL Configuration Tuning (Q376-383)

#### Memory Configuration Parameters

#### shared_buffers Optimization
```sql
-- Check current shared_buffers setting
SHOW shared_buffers;

-- Recommended settings based on system memory:
-- - 25% of system RAM for dedicated PostgreSQL servers
-- - 15-25% for mixed workload servers
-- - Minimum 128MB, maximum 8GB (typically)

-- Example configurations in postgresql.conf:
# For 4GB RAM system:
shared_buffers = 1GB

# For 16GB RAM system:  
shared_buffers = 4GB

# For 64GB RAM system:
shared_buffers = 8GB

-- Monitor shared buffer usage
SELECT 
    count(*) as total_buffers,
    count(*) FILTER (WHERE isdirty) as dirty_buffers,
    count(*) FILTER (WHERE pinning_backends > 0) as pinned_buffers,
    round((count(*) FILTER (WHERE isdirty)::numeric / count(*)) * 100, 2) as dirty_buffer_ratio
FROM pg_buffercache;
```

#### work_mem Configuration
```sql
-- Check current work_mem
SHOW work_mem;

-- Work_mem affects:
-- - Sort operations
-- - Hash joins
-- - Hash-based aggregations
-- - Bitmap index scans

-- Calculate appropriate work_mem:
-- work_mem = (Total RAM * 0.25) / max_connections
-- But consider concurrent query complexity

-- Dynamic work_mem adjustment examples:
-- For OLTP workloads:
SET work_mem = '64MB';

-- For analytical queries:
SET work_mem = '512MB';

-- For data warehousing:
SET work_mem = '2GB';

-- Monitor work_mem usage in queries
SELECT 
    query,
    calls,
    mean_exec_time,
    temp_blks_read,
    temp_blks_written,
    round((temp_blks_written::numeric / NULLIF(calls, 0)), 2) as avg_temp_blocks_per_call
FROM pg_stat_statements
WHERE temp_blks_read + temp_blks_written > 0
ORDER BY temp_blks_written DESC;
```

#### maintenance_work_mem and effective_cache_size
```sql
-- maintenance_work_mem affects:
-- - VACUUM operations
-- - CREATE INDEX
-- - ALTER TABLE operations

-- Recommended settings:
# maintenance_work_mem = min(2GB, RAM/16)
maintenance_work_mem = 512MB  # For 8GB+ systems

-- effective_cache_size informs the query planner
-- Set to ~75% of available system memory
# For 16GB system:
effective_cache_size = 12GB

-- Monitor maintenance operations
SELECT 
    query,
    mean_exec_time,
    temp_blks_read,
    temp_blks_written
FROM pg_stat_statements
WHERE query LIKE '%VACUUM%' OR query LIKE '%CREATE INDEX%'
ORDER BY temp_blks_written DESC;
```

#### Configuration Management
```sql
-- View current configuration
SELECT name, setting, unit, context, source
FROM pg_settings
WHERE name IN (
    'shared_buffers',
    'work_mem', 
    'maintenance_work_mem',
    'effective_cache_size',
    'checkpoint_completion_target',
    'wal_buffers',
    'max_connections'
)
ORDER BY name;

-- Check which settings require restart
SELECT name, setting, context
FROM pg_settings
WHERE context = 'postmaster'
    AND name LIKE '%buffer%' OR name LIKE '%mem%'
ORDER BY name;

-- Reload configuration without restart (for eligible settings)
SELECT pg_reload_conf();

-- Check pending restart requirements
SELECT name, setting, pending_restart
FROM pg_settings
WHERE pending_restart = true;
```

#### Advanced Configuration Tuning
```sql
-- Checkpoint tuning for write-heavy workloads
# checkpoint_completion_target = 0.9  # Spread checkpoint I/O
# checkpoint_timeout = 5min           # Checkpoint frequency
# max_wal_size = 1GB                 # WAL size before checkpoint

-- Connection and resource limits
# max_connections = 100               # Adjust based on workload
# superuser_reserved_connections = 3
# max_worker_processes = 8            # For parallel queries

-- Query planning parameters
# random_page_cost = 1.1             # For SSDs
# seq_page_cost = 1.0                # Sequential read cost
# cpu_tuple_cost = 0.01              # CPU processing cost

-- Logging configuration for monitoring
# log_min_duration_statement = 1000  # Log slow queries
# log_checkpoints = on               # Log checkpoint activity
# log_connections = on               # Log connections
# log_disconnections = on            # Log disconnections
# log_lock_waits = on                # Log lock waits

-- Auto-vacuum tuning
# autovacuum_max_workers = 3
# autovacuum_naptime = 1min
# autovacuum_vacuum_threshold = 50
# autovacuum_vacuum_scale_factor = 0.2
```

### 5. Monitoring Tools and Ecosystem (Q384-389)

#### pgAdmin - Web-Based Administration
```sql
-- pgAdmin features for monitoring:
-- 1. Dashboard with real-time metrics
-- 2. Query tool with EXPLAIN visualization
-- 3. Server activity monitoring
-- 4. Lock viewer
-- 5. Database statistics

-- Key monitoring views in pgAdmin:
-- - Server Activity (live queries)
-- - Lock Viewer (blocking queries)
-- - Database Statistics
-- - System Statistics
-- - Query History
```

#### pgBadger - Log Analyzer
```bash
# pgBadger installation and usage
# Install pgBadger
wget https://github.com/darold/pgbadger/archive/refs/tags/v12.2.tar.gz
tar -xzf pgbadger-12.2.tar.gz
cd pgbadger-12.2
perl Makefile.PL
make && sudo make install

# Configure PostgreSQL for pgBadger
# In postgresql.conf:
log_destination = 'stderr'
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
log_min_duration_statement = 0  # Log all statements for analysis

# Generate pgBadger reports
pgbadger /var/log/postgresql/postgresql-*.log -o report.html

# Incremental analysis
pgbadger --incremental --outdir /var/www/pgbadger /var/log/postgresql/

# Focus on specific analysis
pgbadger --top 20 --verbose /var/log/postgresql/postgresql.log

# JSON output for integration
pgbadger --format json /var/log/postgresql/postgresql.log -o report.json
```

#### Prometheus and postgres_exporter
```yaml
# docker-compose.yml for monitoring stack
version: '3.8'
services:
  postgres_exporter:
    image: prometheuscommunity/postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://monitor_user:password@postgres:5432/postgres?sslmode=disable"
    ports:
      - "9187:9187"
    
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
```

```yaml
# prometheus.yml configuration
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres_exporter:9187']
    scrape_interval: 5s
```

```sql
-- Create monitoring user for postgres_exporter
CREATE USER monitor_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE postgres TO monitor_user;
GRANT pg_monitor TO monitor_user;

-- Create custom monitoring queries
CREATE VIEW postgres_exporter_queries AS
SELECT 'pg_stat_activity_count' as metric_name,
       'Number of active connections' as metric_desc,
       'SELECT count(*) FROM pg_stat_activity WHERE state = ''active''' as query;

-- Custom metrics for postgres_exporter
-- queries.yaml
pg_stat_activity:
  query: "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'"
  metrics:
    - active_connections:
        usage: "GAUGE"
        description: "Number of active connections"

pg_stat_database:
  query: |
    SELECT 
      datname,
      numbackends,
      xact_commit,
      xact_rollback,
      blks_read,
      blks_hit
    FROM pg_stat_database 
    WHERE datname NOT IN ('template0', 'template1')
  metrics:
    - datname:
        usage: "LABEL"
        description: "Database name"
    - numbackends:
        usage: "GAUGE"
        description: "Number of backends"
    - xact_commit:
        usage: "COUNTER"
        description: "Number of transactions committed"
    - xact_rollback:
        usage: "COUNTER"
        description: "Number of transactions rolled back"
```

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "PostgreSQL Monitoring",
    "panels": [
      {
        "title": "Active Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "pg_stat_activity_count",
            "legendFormat": "Active Connections"
          }
        ]
      },
      {
        "title": "Database Cache Hit Ratio",
        "type": "stat", 
        "targets": [
          {
            "expr": "rate(pg_stat_database_blks_hit[5m]) / (rate(pg_stat_database_blks_hit[5m]) + rate(pg_stat_database_blks_read[5m])) * 100",
            "legendFormat": "Cache Hit %"
          }
        ]
      },
      {
        "title": "Transaction Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(pg_stat_database_xact_commit[5m])",
            "legendFormat": "Commits/sec"
          },
          {
            "expr": "rate(pg_stat_database_xact_rollback[5m])",
            "legendFormat": "Rollbacks/sec"
          }
        ]
      }
    ]
  }
}
```

#### Alerting Configuration
```yaml
# Prometheus alerting rules (postgresql_alerts.yml)
groups:
  - name: postgresql
    rules:
      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL database is down for more than 0 minutes"

      - alert: PostgreSQLHighConnections
        expr: sum(pg_stat_activity_count) > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL high connection count"
          description: "PostgreSQL has {{ $value }} active connections"

      - alert: PostgreSQLSlowQueries
        expr: rate(pg_stat_statements_mean_time[5m]) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL slow queries detected"
          description: "PostgreSQL has slow queries with average execution time > 1 second"

      - alert: PostgreSQLCacheHitRatio
        expr: |
          rate(pg_stat_database_blks_hit[5m]) / 
          (rate(pg_stat_database_blks_hit[5m]) + rate(pg_stat_database_blks_read[5m])) * 100 < 95
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL low cache hit ratio"
          description: "PostgreSQL cache hit ratio is {{ $value }}%"
```

### 6. Common PostgreSQL Errors and Troubleshooting (Q390)

#### Connection and Authentication Errors

#### Connection Limit Exceeded
```sql
-- Error: FATAL: sorry, too many clients already
-- Diagnosis:
SELECT count(*) as current_connections, setting as max_connections
FROM pg_stat_activity, pg_settings 
WHERE pg_settings.name = 'max_connections';

-- Solutions:
-- 1. Increase max_connections (requires restart)
ALTER SYSTEM SET max_connections = 200;

-- 2. Implement connection pooling
-- 3. Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity 
WHERE state = 'idle' 
    AND query_start < now() - interval '1 hour';

-- 4. Monitor connection sources
SELECT 
    client_addr,
    count(*) as connection_count,
    usename
FROM pg_stat_activity 
GROUP BY client_addr, usename
ORDER BY count(*) DESC;
```

#### Authentication Failures
```sql
-- Error: FATAL: password authentication failed for user "username"
-- Diagnosis steps:

-- 1. Check pg_hba.conf configuration
-- 2. Verify user exists and has correct permissions
SELECT rolname, rolcanlogin, rolpassword IS NOT NULL as has_password
FROM pg_authid 
WHERE rolname = 'username';

-- 3. Check connection method requirements
-- 4. Verify SSL requirements if applicable

-- Common solutions:
-- 1. Reset user password
ALTER USER username WITH PASSWORD 'new_password';

-- 2. Grant login permission
ALTER USER username WITH LOGIN;

-- 3. Update pg_hba.conf for appropriate authentication method
-- 4. Reload configuration
SELECT pg_reload_conf();
```

#### Lock and Deadlock Issues
```sql
-- Deadlock detection and resolution
-- Error: ERROR: deadlock detected

-- Find current blocking queries
WITH blocking_queries AS (
    SELECT 
        blocking.pid as blocking_pid,
        blocking.query as blocking_query,
        blocked.pid as blocked_pid,
        blocked.query as blocked_query,
        now() - blocked.query_start as blocked_duration
    FROM pg_stat_activity blocked
    JOIN pg_locks blocked_locks ON blocked.pid = blocked_locks.pid
    JOIN pg_locks blocking_locks ON blocking_locks.transactionid = blocked_locks.transactionid
        AND blocking_locks.pid != blocked_locks.pid
    JOIN pg_stat_activity blocking ON blocking.pid = blocking_locks.pid
    WHERE NOT blocked_locks.granted
)
SELECT * FROM blocking_queries
ORDER BY blocked_duration DESC;

-- Deadlock prevention strategies:
-- 1. Always acquire locks in the same order
-- 2. Keep transactions short
-- 3. Use appropriate isolation levels
-- 4. Consider advisory locks for application-level coordination

-- Monitor deadlock frequency
SELECT 
    datname,
    deadlocks,
    deadlocks / extract(epoch from now() - stats_reset) * 3600 as deadlocks_per_hour
FROM pg_stat_database
WHERE deadlocks > 0;
```

#### Disk Space and I/O Issues
```sql
-- Error: ERROR: could not extend file... No space left on device

-- Check database sizes
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) as database_size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- Check table sizes
SELECT 
    schemaname,
    relname,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    pg_size_pretty(pg_relation_size(relid)) as table_size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;

-- Check for table bloat
SELECT 
    schemaname,
    relname,
    n_dead_tup,
    n_live_tup,
    round((n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as bloat_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY bloat_ratio DESC;

-- Solutions:
-- 1. Run VACUUM to reclaim space
VACUUM FULL table_name;  -- Requires exclusive lock

-- 2. Increase disk space
-- 3. Archive or drop old data
-- 4. Configure autovacuum more aggressively
```

#### Memory and Performance Issues
```sql
-- Error: ERROR: out of memory

-- Check memory usage patterns
SELECT 
    query,
    calls,
    mean_exec_time,
    max_exec_time,
    temp_blks_read,
    temp_blks_written,
    round((temp_blks_written::numeric * 8192 / 1024 / 1024), 2) as temp_data_mb
FROM pg_stat_statements
WHERE temp_blks_read + temp_blks_written > 0
ORDER BY temp_blks_written DESC;

-- Solutions:
-- 1. Increase work_mem for specific queries
SET work_mem = '512MB';

-- 2. Optimize queries to reduce memory usage
-- 3. Add appropriate indexes
-- 4. Consider query rewriting

-- Monitor memory allocation
SELECT 
    name,
    setting,
    unit,
    short_desc
FROM pg_settings
WHERE name LIKE '%mem%'
ORDER BY name;
```

#### Replication Issues
```sql
-- Replication lag monitoring
SELECT 
    client_addr,
    client_hostname,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    write_lag,
    flush_lag,
    replay_lag
FROM pg_stat_replication;

-- Check replication slot status
SELECT 
    slot_name,
    slot_type,
    database,
    active,
    xmin,
    catalog_xmin,
    restart_lsn,
    confirmed_flush_lsn
FROM pg_replication_slots;

-- WAL file accumulation check
SELECT 
    count(*) as wal_files,
    pg_size_pretty(count(*) * 16 * 1024 * 1024) as wal_size
FROM pg_ls_waldir()
WHERE name ~ '^[0-9A-F]{24}$';
```

#### Performance Troubleshooting Workflow
```sql
-- Step 1: Identify the problem
-- Check active queries and their duration
SELECT 
    pid,
    usename,
    query_start,
    now() - query_start as duration,
    state,
    LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE state = 'active'
    AND now() - query_start > interval '30 seconds'
ORDER BY duration DESC;

-- Step 2: Analyze query plans
-- Use EXPLAIN (ANALYZE, BUFFERS) for problematic queries
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
SELECT * FROM large_table WHERE some_condition = 'value';

-- Step 3: Check system resources
-- Monitor I/O and cache hit ratios
SELECT 
    datname,
    round((blks_hit::numeric / NULLIF(blks_hit + blks_read, 0)) * 100, 2) as cache_hit_ratio
FROM pg_stat_database
WHERE datname NOT IN ('template0', 'template1');

-- Step 4: Implement solutions
-- 1. Add missing indexes
-- 2. Update table statistics
ANALYZE table_name;

-- 3. Optimize configuration
-- 4. Rewrite problematic queries
```

## Study Plan Recommendations

### Phase 1: Monitoring Fundamentals (Days 1-4)
- Master system catalog tables (pg_stat_activity, pg_stat_database)
- Learn pg_stat_statements extension setup and usage
- Practice query performance analysis techniques
- Study essential performance metrics and baselines

### Phase 2: Advanced Monitoring (Days 5-9)
- Deep dive into lock analysis and blocking query identification
- Master configuration tuning (memory, checkpoints, autovacuum)
- Practice with monitoring tools (pgBadger, pgAdmin)
- Learn prometheus/grafana setup for PostgreSQL

### Phase 3: Troubleshooting Mastery (Days 10-12)
- Study common error patterns and resolution strategies
- Practice performance troubleshooting workflows
- Learn alerting configuration and threshold setting
- Master disk space and memory issue resolution

### Phase 4: Enterprise Monitoring (Days 13-15)
- Implement comprehensive monitoring solutions
- Practice with multiple monitoring tool integration
- Study advanced alerting and automation
- Learn capacity planning and trend analysis

## Key Monitoring Best Practices

### 1. **Proactive Monitoring**
- Establish performance baselines
- Set up meaningful alerts and thresholds
- Monitor trends, not just current values
- Regular health checks and maintenance

### 2. **Comprehensive Coverage**
- System resources (CPU, memory, I/O)
- PostgreSQL-specific metrics
- Application-level performance
- User experience indicators

### 3. **Effective Alerting**
- Actionable alerts with clear resolution steps
- Appropriate alert severity levels
- Escalation procedures for critical issues
- Regular alert review and tuning

### 4. **Performance Analysis**
- Regular query performance reviews
- Index effectiveness monitoring
- Lock contention analysis
- Capacity planning and growth projections

### 5. **Documentation and Procedures**
- Documented troubleshooting procedures
- Performance baseline documentation
- Alert response procedures
- Regular monitoring tool maintenance

This comprehensive monitoring and troubleshooting knowledge foundation will enable you to confidently answer all PostgreSQL monitoring questions (Q361-390) in technical interviews, demonstrating both theoretical understanding and practical expertise in production database management.