# PostgreSQL Replication & High Availability Knowledge Summary (Q161-190)

## Learning Objectives
This guide provides comprehensive knowledge needed to answer PostgreSQL replication and high availability interview questions Q161-190, covering replication concepts, implementation strategies, disaster recovery, and production-ready HA solutions.

## Core Learning Areas

### 1. Database Replication Fundamentals (Q161-163)

#### What is Database Replication?
- **Definition**: Process of copying and maintaining database objects across multiple database instances
- **Purpose**: Data redundancy, load distribution, disaster recovery, geographic distribution
- **Types**: Master-slave, master-master, streaming, logical, physical
- **Benefits**: High availability, read scalability, disaster recovery, geographic distribution

#### Master-Slave Replication
- **Architecture**: One primary (master) server, multiple read-only secondary (slave) servers
- **Data Flow**: Unidirectional from master to slaves
- **Write Operations**: Only on master server
- **Read Operations**: Can be distributed across slaves
- **Failover**: Manual or automatic promotion of slave to master

```sql
-- Check replication status on primary
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;

-- Check replication status on standby
SELECT now() - pg_last_xact_replay_timestamp() AS replication_delay;
```

#### Master-Master Replication
- **Architecture**: Multiple primary servers that can accept writes
- **Data Flow**: Bidirectional replication between masters
- **Conflict Resolution**: Complex conflict detection and resolution mechanisms
- **Use Cases**: Multi-region applications, load distribution
- **Challenges**: Conflict resolution, consistency guarantees, complexity

### 2. PostgreSQL Replication Types (Q164-167)

#### Streaming Replication
- **Definition**: Real-time replication using WAL streaming
- **Protocol**: Uses PostgreSQL's native streaming protocol
- **Granularity**: WAL record level streaming
- **Performance**: Near real-time with minimal lag
- **Setup**: Relatively simple configuration

```bash
# Primary server configuration
# postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64  # PostgreSQL < 13
wal_keep_size = 1GB     # PostgreSQL >= 13

# pg_hba.conf
host replication replicator 192.168.1.0/24 md5
```

```bash
# Standby server setup
pg_basebackup -h primary_server -D /var/lib/postgresql/data -U replicator -P -W
```

#### Logical Replication
- **Definition**: Row-based replication using logical decoding
- **Granularity**: Table-level, selective replication
- **Features**: Cross-version compatibility, partial replication, schema flexibility
- **Use Cases**: Migrations, selective replication, cross-version upgrades
- **Limitations**: No DDL replication, sequence replication issues

```sql
-- Setup logical replication
-- On publisher (primary)
CREATE PUBLICATION my_publication FOR ALL TABLES;

-- On subscriber (standby)
CREATE SUBSCRIPTION my_subscription
    CONNECTION 'host=primary_server port=5432 user=replicator dbname=mydb'
    PUBLICATION my_publication;

-- Monitor logical replication
SELECT subname, pid, received_lsn, latest_end_lsn, latest_end_time
FROM pg_stat_subscription;
```

#### Physical Replication
- **Definition**: Block-level replication of entire database cluster
- **Granularity**: File system level replication
- **Features**: Exact replica, all databases included, binary compatibility required
- **Use Cases**: Disaster recovery, read replicas, high availability
- **Streaming Replication**: Most common form of physical replication

#### Logical vs Physical Replication Comparison
| Aspect | Logical | Physical |
|--------|---------|----------|
| **Granularity** | Table-level | Cluster-level |
| **Version Compatibility** | Cross-version | Same version only |
| **Selective Replication** | Yes | No |
| **DDL Replication** | Limited | Complete |
| **Performance** | Higher overhead | Lower overhead |
| **Use Cases** | Migrations, partial sync | HA, disaster recovery |

### 3. Streaming Replication Setup (Q168-169)

#### Complete Streaming Replication Setup
```bash
# Step 1: Configure primary server
# postgresql.conf
listen_addresses = '*'
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'

# Create replication user
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure_password';

# pg_hba.conf
host replication replicator 0.0.0.0/0 md5
```

```bash
# Step 2: Create standby server
# Take base backup
pg_basebackup -h primary_ip -D /var/lib/postgresql/13/standby -U replicator -P -W -R

# Step 3: Configure standby (PostgreSQL 12+)
# standby.signal file is created automatically with -R flag
# postgresql.conf on standby
primary_conninfo = 'host=primary_ip port=5432 user=replicator password=secure_password'
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
```

#### Replication Slots
- **Definition**: Named replication streams that ensure WAL retention
- **Purpose**: Prevent WAL removal until consumed by all subscribers
- **Types**: Physical slots, logical slots
- **Benefits**: Reliable replication, automatic WAL retention
- **Monitoring**: Track slot usage and lag

```sql
-- Create replication slot
SELECT pg_create_physical_replication_slot('standby_slot');

-- Use replication slot in standby configuration
primary_slot_name = 'standby_slot'

-- Monitor replication slots
SELECT slot_name, slot_type, active, restart_lsn, confirmed_flush_lsn
FROM pg_replication_slots;

-- Drop unused replication slot
SELECT pg_drop_replication_slot('standby_slot');
```

### 4. Write-Ahead Logging (WAL) (Q170-173)

#### How WAL Works
- **Definition**: Transaction logging mechanism ensuring ACID properties
- **Process**: Changes written to WAL before data files
- **Durability**: Ensures crash recovery and replication
- **Components**: WAL buffers, WAL files, checkpoints

```sql
-- WAL configuration parameters
wal_buffers = 16MB                    -- WAL buffer size
wal_writer_delay = 200ms              -- WAL writer sleep time
wal_writer_flush_after = 1MB          -- Force flush after size
checkpoint_timeout = 5min             -- Maximum checkpoint interval
max_wal_size = 1GB                    -- WAL size before checkpoint
min_wal_size = 80MB                   -- Minimum WAL size

-- Monitor WAL generation
SELECT pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn());

-- WAL statistics
SELECT * FROM pg_stat_wal;
```

#### WAL Segments
- **Structure**: Fixed-size files (typically 16MB)
- **Naming**: Sequential hexadecimal names
- **Lifecycle**: Creation, filling, archival, recycling
- **Management**: Automatic cleanup and recycling

```bash
# WAL file location
ls -la $PGDATA/pg_wal/

# WAL file information
SELECT name, size, timeline, status FROM pg_ls_waldir() ORDER BY name;

# WAL segment size
SHOW wal_segment_size;
```

#### WAL Archiving
- **Purpose**: Long-term WAL retention for PITR and backup
- **Configuration**: archive_mode and archive_command
- **Destinations**: Local filesystem, cloud storage, remote servers
- **Monitoring**: Track archival success and failures

```bash
# Enable WAL archiving
# postgresql.conf
archive_mode = on
archive_command = 'rsync %p backup_server:/wal_archive/%f'
archive_timeout = 300  # Force archival every 5 minutes

# Monitor archiving
SELECT archived_count, failed_count, stats_reset 
FROM pg_stat_archiver;

# Manual WAL switch for immediate archival
SELECT pg_switch_wal();
```

### 5. Point-in-Time Recovery (PITR) (Q174-175)

#### PITR Concepts
- **Definition**: Ability to restore database to any point in time
- **Requirements**: Base backup + WAL archives
- **Granularity**: Transaction-level precision
- **Use Cases**: Data corruption recovery, accidental deletions, compliance

#### PITR Implementation
```bash
# Step 1: Continuous archiving setup
# postgresql.conf
archive_mode = on
archive_command = 'cp %p /backup/wal_archive/%f'

# Step 2: Take base backup
pg_basebackup -D /backup/base_backup_$(date +%Y%m%d_%H%M%S) -Ft -z -P

# Step 3: Recovery procedure
# Stop PostgreSQL service
systemctl stop postgresql

# Restore base backup
rm -rf $PGDATA/*
tar -xzf /backup/base_backup_20241201_100000.tar.gz -C $PGDATA/

# Create recovery configuration (PostgreSQL 12+)
# recovery.signal (empty file)
touch $PGDATA/recovery.signal

# postgresql.conf recovery settings
restore_command = 'cp /backup/wal_archive/%f %p'
recovery_target_time = '2024-12-01 10:30:00'  # Target recovery time
recovery_target_action = promote

# Start PostgreSQL
systemctl start postgresql
```

#### Recovery Target Options
```sql
-- Time-based recovery
recovery_target_time = '2024-12-01 10:30:00'

-- Transaction ID-based recovery
recovery_target_xid = '12345678'

-- LSN-based recovery
recovery_target_lsn = '0/1234ABCD'

-- Named restore point recovery
recovery_target_name = 'before_data_migration'

-- Create named restore point
SELECT pg_create_restore_point('before_data_migration');
```

### 6. Standby Server Types (Q176-178)

#### Hot Standby
- **Definition**: Standby server accepting read-only queries
- **Features**: Active replication, read queries, connection handling
- **Configuration**: hot_standby = on
- **Use Cases**: Read scaling, reporting queries, load distribution

```sql
-- Hot standby configuration
# postgresql.conf
hot_standby = on
max_standby_archive_delay = 30s
max_standby_streaming_delay = 30s
hot_standby_feedback = on

-- Check if server is in hot standby mode
SELECT pg_is_in_recovery();

-- Monitor standby query conflicts
SELECT * FROM pg_stat_database_conflicts;
```

#### Warm Standby
- **Definition**: Standby server not accepting connections
- **Purpose**: Disaster recovery only
- **Features**: Faster recovery, no query conflicts
- **Configuration**: hot_standby = off

#### Cold Standby
- **Definition**: Standby server not actively receiving updates
- **Process**: Manual restoration from backups
- **Use Cases**: Disaster recovery, compliance, archival

### 7. Failover and Switchover (Q179-181)

#### Failover (Unplanned)
- **Definition**: Automatic promotion due to primary failure
- **Trigger**: Primary server crash, network partition
- **Process**: Standby promotion, client redirection
- **Challenges**: Split-brain scenarios, data loss potential

```bash
# Manual failover process
# On standby server
pg_ctl promote -D $PGDATA

# Or using SQL
SELECT pg_promote();

# Update connection strings to point to new primary
```

#### Switchover (Planned)
- **Definition**: Controlled role swap during maintenance
- **Process**: Graceful shutdown, role reversal
- **Benefits**: Zero data loss, controlled process
- **Use Cases**: Maintenance, hardware upgrades

```bash
# Planned switchover process
# 1. Stop writes to primary
# 2. Ensure standby is caught up
SELECT pg_current_wal_lsn() = replay_lsn FROM pg_stat_replication;

# 3. Shutdown primary gracefully
pg_ctl stop -D $PGDATA -m fast

# 4. Promote standby
pg_ctl promote -D $PGDATA

# 5. Reconfigure old primary as new standby
```

#### Standby Promotion
```sql
-- Check promotion eligibility
SELECT pg_is_in_recovery(), pg_last_wal_replay_lsn();

-- Promote standby to primary
SELECT pg_promote();

-- Verify promotion
SELECT pg_is_in_recovery();  -- Should return false

-- Check new primary status
SELECT * FROM pg_stat_replication;
```

### 8. Replication Monitoring (Q182-183)

#### Replication Lag Monitoring
```sql
-- Monitor lag from primary
SELECT 
    client_addr,
    state,
    pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn) AS send_lag_bytes,
    pg_wal_lsn_diff(sent_lsn, write_lsn) AS write_lag_bytes,
    pg_wal_lsn_diff(write_lsn, flush_lsn) AS flush_lag_bytes,
    pg_wal_lsn_diff(flush_lsn, replay_lsn) AS replay_lag_bytes,
    write_lag,
    flush_lag,
    replay_lag
FROM pg_stat_replication;

-- Monitor lag from standby
SELECT 
    now() - pg_last_xact_replay_timestamp() AS replication_delay,
    pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() AS caught_up,
    pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn()) AS replay_lag_bytes;
```

#### Comprehensive Monitoring Dashboard
```sql
-- Replication overview function
CREATE OR REPLACE FUNCTION replication_status()
RETURNS TABLE (
    server_type TEXT,
    is_primary BOOLEAN,
    is_standby BOOLEAN,
    current_lsn TEXT,
    receive_lsn TEXT,
    replay_lsn TEXT,
    lag_seconds INTERVAL,
    connected_standbys INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN NOT pg_is_in_recovery() THEN 'Primary'
            ELSE 'Standby'
        END,
        NOT pg_is_in_recovery(),
        pg_is_in_recovery(),
        pg_current_wal_lsn()::TEXT,
        CASE 
            WHEN pg_is_in_recovery() THEN pg_last_wal_receive_lsn()::TEXT
            ELSE NULL
        END,
        CASE 
            WHEN pg_is_in_recovery() THEN pg_last_wal_replay_lsn()::TEXT
            ELSE NULL
        END,
        CASE 
            WHEN pg_is_in_recovery() THEN now() - pg_last_xact_replay_timestamp()
            ELSE NULL
        END,
        CASE 
            WHEN NOT pg_is_in_recovery() THEN (SELECT count(*) FROM pg_stat_replication)::INTEGER
            ELSE NULL
        END;
END;
$$ LANGUAGE plpgsql;

-- Use the monitoring function
SELECT * FROM replication_status();
```

### 9. High Availability Tools (Q184-187)

#### Patroni
- **Purpose**: HA cluster management for PostgreSQL
- **Features**: Automatic failover, leader election, configuration management
- **Components**: Patroni agent, DCS (etcd/Consul), load balancer
- **Architecture**: Distributed consensus for split-brain prevention

```yaml
# patroni.yml configuration
scope: postgres-cluster
name: node1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 192.168.1.10:8008

etcd:
  hosts: 192.168.1.100:2379,192.168.1.101:2379,192.168.1.102:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 30
    postgresql:
      parameters:
        wal_level: replica
        max_wal_senders: 10
        wal_keep_segments: 64

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.1.10:5432
  data_dir: /var/lib/postgresql/data
  pgpass: /tmp/pgpass
  authentication:
    replication:
      username: replicator
      password: replicator_password
    superuser:
      username: postgres
      password: postgres_password

tags:
    nofailover: false
    noloadbalance: false
    clonefrom: false
    nosync: false
```

#### pgpool-II
- **Purpose**: Connection pooling and load balancing
- **Features**: Load balancing, connection pooling, automatic failover
- **Modes**: Streaming replication mode, master-slave mode
- **Benefits**: Connection efficiency, read load distribution

```bash
# pgpool.conf key settings
backend_hostname0 = 'primary_server'
backend_port0 = 5432
backend_weight0 = 1
backend_data_directory0 = '/var/lib/postgresql/data'

backend_hostname1 = 'standby_server'
backend_port1 = 5432
backend_weight1 = 1
backend_data_directory1 = '/var/lib/postgresql/data'

enable_pool_hba = on
pool_passwd = 'pool_passwd'
load_balance_mode = on
master_slave_mode = on
sr_check_period = 5
```

#### repmgr
- **Purpose**: Replication management and monitoring
- **Features**: Cluster setup, failover management, monitoring
- **Components**: repmgr daemon, command-line tools
- **Benefits**: Simplified replication management, automatic registration

```bash
# repmgr.conf
node_id=1
node_name='node1'
conninfo='host=node1 user=repmgr dbname=repmgr connect_timeout=2'
data_directory='/var/lib/postgresql/data'
failover=automatic
promote_command='repmgr standby promote -f /etc/repmgr.conf --log-to-file'
follow_command='repmgr standby follow -f /etc/repmgr.conf --log-to-file --upstream-node-id=%n'

# Setup repmgr cluster
repmgr primary register
repmgr standby clone
repmgr standby register

# Monitor cluster
repmgr cluster show
repmgr cluster event
```

### 10. Synchronous vs Asynchronous Replication (Q188-190)

#### Synchronous Replication
- **Definition**: Primary waits for standby confirmation before commit
- **Guarantees**: Zero data loss (when properly configured)
- **Performance**: Higher latency due to network roundtrips
- **Configuration**: synchronous_standby_names parameter

```sql
-- Synchronous replication configuration
# postgresql.conf
synchronous_standby_names = 'FIRST 1 (standby1, standby2)'
synchronous_commit = on

-- Monitor synchronous replication
SELECT application_name, client_addr, state, sync_state, sync_priority
FROM pg_stat_replication 
WHERE sync_state IN ('sync', 'potential');
```

#### Asynchronous Replication
- **Definition**: Primary commits without waiting for standby
- **Benefits**: Better performance, lower latency
- **Risk**: Potential data loss during failures
- **Use Cases**: Non-critical data, read replicas, reporting

#### Trade-offs Comparison
| Aspect | Synchronous | Asynchronous |
|--------|-------------|--------------|
| **Data Loss Risk** | Zero (when configured correctly) | Possible during failures |
| **Performance** | Higher latency | Better performance |
| **Network Dependency** | High (commits wait for network) | Low (fire-and-forget) |
| **Complexity** | Higher operational complexity | Simpler to manage |
| **Use Cases** | Critical data, financial systems | Reporting, analytics |
| **Failover** | Instant (no data loss) | Potential data loss |

#### Configuration Examples
```sql
-- Synchronous configuration options
synchronous_standby_names = 'ANY 1 (standby1, standby2, standby3)'  -- Any one standby
synchronous_standby_names = 'FIRST 2 (standby1, standby2, standby3)' -- First two standbys
synchronous_standby_names = 'standby1'                               -- Specific standby

-- Different synchronous commit levels
synchronous_commit = on          -- Wait for flush to disk on standby
synchronous_commit = remote_apply -- Wait for apply on standby
synchronous_commit = remote_write -- Wait for write to standby WAL
synchronous_commit = local        -- Wait for local flush only
synchronous_commit = off          -- Asynchronous (don't wait)
```

## Advanced Topics and Best Practices

### 11. Replication Security
```sql
-- SSL configuration for replication
# postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'ca.crt'

# pg_hba.conf
hostssl replication replicator 0.0.0.0/0 cert

-- Certificate-based authentication
CREATE ROLE replicator WITH REPLICATION LOGIN;
```

### 12. Performance Optimization
```sql
-- Replication performance tuning
max_wal_senders = 10                    -- Number of concurrent standbys
wal_keep_size = 2GB                     -- WAL retention for standbys
max_replication_slots = 10              -- Maximum replication slots
wal_sender_timeout = 60s                -- Standby connection timeout
wal_receiver_timeout = 60s              -- Primary connection timeout
hot_standby_feedback = on               -- Prevent query conflicts

-- Monitor replication performance
SELECT * FROM pg_stat_replication_slots;
SELECT * FROM pg_stat_wal_receiver;
```

### 13. Troubleshooting Common Issues
```sql
-- Check replication issues
-- Slot lag
SELECT slot_name, 
       pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS restart_lag_bytes,
       pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn) AS flush_lag_bytes,
       active
FROM pg_replication_slots;

-- Network connectivity issues
SELECT client_addr, state, backend_start, backend_xmin 
FROM pg_stat_replication;

-- WAL archival issues
SELECT * FROM pg_stat_archiver;
```

## Study Plan Recommendations

### Phase 1: Fundamentals (Days 1-4)
- Master replication concepts and types
- Understand WAL mechanics and archiving
- Learn PITR concepts and procedures

### Phase 2: Implementation (Days 5-8)
- Practice streaming replication setup
- Implement logical replication scenarios
- Configure monitoring and alerts

### Phase 3: High Availability (Days 9-12)
- Study HA tools (Patroni, repmgr, pgpool-II)
- Practice failover and switchover procedures
- Learn cluster management techniques

### Phase 4: Production Readiness (Days 13-15)
- Security configuration and best practices
- Performance tuning and optimization
- Troubleshooting and disaster recovery

## Key Resources for Interview Preparation

1. **PostgreSQL Documentation**: Replication and HA sections
2. **Hands-on Labs**: Set up multi-server replication environment
3. **HA Tools**: Practice with Patroni, repmgr, pgpool-II
4. **Monitoring**: Implement comprehensive replication monitoring
5. **Case Studies**: Study real-world HA architectures

## Common Interview Scenarios

1. **Architecture Design**: Design HA solution for mission-critical application
2. **Disaster Recovery**: Plan and execute disaster recovery procedures
3. **Performance Analysis**: Troubleshoot replication lag issues
4. **Migration Planning**: Migrate from standalone to HA cluster
5. **Operational Procedures**: Implement monitoring and alerting systems

This comprehensive knowledge foundation will enable you to confidently answer all PostgreSQL replication and high availability questions (Q161-190) in technical interviews.