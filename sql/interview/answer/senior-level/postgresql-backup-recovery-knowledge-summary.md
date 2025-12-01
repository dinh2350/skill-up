# PostgreSQL Backup & Recovery Knowledge Summary (Q336-360)

## Learning Objectives
This guide provides comprehensive knowledge needed to answer PostgreSQL backup and recovery interview questions Q336-360, covering backup types, logical and physical backups, PostgreSQL native tools, continuous archiving, Point-in-Time Recovery (PITR), backup strategies, and advanced backup management tools.

## Core Learning Areas

### 1. Backup Types Overview (Q336-338)

#### Types of Backups in PostgreSQL
PostgreSQL supports several backup approaches, each with specific use cases and characteristics:

| Backup Type | Method | Use Case | Recovery Granularity | Size | Performance Impact |
|-------------|--------|----------|---------------------|------|-------------------|
| **Logical Backup** | pg_dump, pg_dumpall | Schema/data portability | Database/schema/table level | Larger | Low during backup |
| **Physical Backup** | pg_basebackup, file system | Full instance recovery | Cluster level | Smaller | Medium during backup |
| **Continuous Archiving** | WAL archiving | PITR, streaming backup | Transaction level | Variable | Low ongoing impact |
| **Incremental Backup** | Tools like pgBackRest | Large database efficiency | Block level | Smallest | Lowest impact |

#### Logical vs Physical Backup Comparison

#### Logical Backups
```bash
# Logical backup characteristics:
# - Platform independent (can restore on different architectures)
# - Human-readable SQL format
# - Selective backup/restore (specific databases, schemas, tables)
# - Schema and data migration friendly
# - Version independent (within reason)
# - Slower for large databases

# Examples:
pg_dump myapp > myapp_backup.sql
pg_dump -Fc myapp > myapp_backup.custom
pg_dumpall > full_cluster_backup.sql
```

#### Physical Backups
```bash
# Physical backup characteristics:
# - Binary copy of data files
# - Platform dependent
# - Full cluster backup only
# - Faster for large databases
# - Version dependent
# - Requires identical PostgreSQL version and architecture

# Examples:
pg_basebackup -D /backup/base -Ft -z -P
cp -R $PGDATA /backup/physical_backup  # Cold backup only
```

### 2. PostgreSQL Native Backup Tools (Q339-342)

#### pg_dump - Database Logical Backup

#### Basic pg_dump Usage
```bash
# Basic database dump
pg_dump dbname > backup.sql

# Compressed custom format (recommended)
pg_dump -Fc dbname > backup.custom

# Directory format (parallel restore)
pg_dump -Fd dbname -j 4 -f backup_directory

# Tar format
pg_dump -Ft dbname > backup.tar

# Plain SQL format with options
pg_dump -h hostname -p 5432 -U username -W dbname > backup.sql
```

#### Advanced pg_dump Options
```bash
# Schema-only backup
pg_dump --schema-only dbname > schema_backup.sql

# Data-only backup
pg_dump --data-only dbname > data_backup.sql

# Specific schema backup
pg_dump --schema=sales dbname > sales_schema.sql

# Specific table backup
pg_dump --table=customers dbname > customers_backup.sql

# Multiple tables
pg_dump --table=customers --table=orders dbname > tables_backup.sql

# Exclude specific tables
pg_dump --exclude-table=audit_logs dbname > backup_no_audit.sql

# Include table data pattern
pg_dump --exclude-table-data='audit_*' dbname > backup_no_audit_data.sql

# Parallel dump for large databases
pg_dump -Fd -j 8 dbname -f backup_dir

# Verbose output with progress
pg_dump -v --progress dbname > backup.sql

# Include large objects
pg_dump --blobs dbname > backup_with_blobs.sql
```

#### pg_dump Automation Script
```bash
#!/bin/bash
# automated_backup.sh

# Configuration
DB_NAME="myapp"
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.custom"
LOG_FILE="${BACKUP_DIR}/backup_${DATE}.log"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Perform backup
echo "Starting backup of ${DB_NAME} at $(date)" | tee "${LOG_FILE}"

pg_dump -Fc "${DB_NAME}" > "${BACKUP_FILE}" 2>>"${LOG_FILE}"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: ${BACKUP_FILE}" | tee -a "${LOG_FILE}"
    
    # Verify backup
    pg_restore --list "${BACKUP_FILE}" > /dev/null 2>>"${LOG_FILE}"
    
    if [ $? -eq 0 ]; then
        echo "Backup verification passed" | tee -a "${LOG_FILE}"
    else
        echo "ERROR: Backup verification failed" | tee -a "${LOG_FILE}"
        exit 1
    fi
else
    echo "ERROR: Backup failed" | tee -a "${LOG_FILE}"
    exit 1
fi

# Cleanup old backups (keep last 7 days)
find "${BACKUP_DIR}" -name "${DB_NAME}_*.custom" -mtime +7 -delete

echo "Backup process completed at $(date)" | tee -a "${LOG_FILE}"
```

#### pg_dumpall - Cluster-Wide Backup
```bash
# Complete PostgreSQL cluster backup
pg_dumpall > full_cluster_backup.sql

# Only global objects (roles, tablespaces)
pg_dumpall --globals-only > globals_backup.sql

# Only schema definitions
pg_dumpall --schema-only > cluster_schema.sql

# Exclude specific databases
pg_dumpall --exclude-database=test_db > production_backup.sql

# Compressed cluster backup
pg_dumpall | gzip > cluster_backup.sql.gz

# Automated cluster backup script
#!/bin/bash
BACKUP_FILE="/backups/cluster_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dumpall | gzip > "${BACKUP_FILE}"
echo "Cluster backup completed: ${BACKUP_FILE}"
```

#### pg_restore - Restoring from Logical Backups
```bash
# Restore from custom format
pg_restore -d dbname backup.custom

# Restore to different database
pg_restore -d new_dbname backup.custom

# Create database and restore
pg_restore -C -d postgres backup.custom

# Restore specific schema
pg_restore --schema=sales -d dbname backup.custom

# Restore specific table
pg_restore --table=customers -d dbname backup.custom

# Parallel restore
pg_restore -j 4 -d dbname backup.custom

# Restore with data cleaning
pg_restore --clean -d dbname backup.custom

# Restore schema only
pg_restore --schema-only -d dbname backup.custom

# Restore data only
pg_restore --data-only -d dbname backup.custom

# List backup contents without restoring
pg_restore --list backup.custom

# Restore with custom options
pg_restore \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    --dbname=target_db \
    backup.custom

# Selective restore using list file
pg_restore --list backup.custom > backup.list
# Edit backup.list to comment out unwanted items
pg_restore --use-list=backup.list -d dbname backup.custom
```

#### pg_basebackup - Physical Backup
```bash
# Basic physical backup
pg_basebackup -D /backup/base

# Compressed tar format
pg_basebackup -D /backup -Ft -z

# With progress reporting
pg_basebackup -D /backup/base -P -v

# Specify connection parameters
pg_basebackup -h primary_server -p 5432 -U replicator -D /backup/base

# Include WAL files
pg_basebackup -D /backup/base -X stream

# Fetch method for WAL
pg_basebackup -D /backup/base -X fetch

# Checkpoint control
pg_basebackup -D /backup/base -c fast

# Exclude specific files
pg_basebackup -D /backup/base --exclude='*.log'

# Write recovery.conf for standby setup
pg_basebackup -D /backup/base -R

# Verify backup after completion
pg_basebackup -D /backup/base --verify-checksums
```

### 3. Continuous Archiving and WAL Management (Q343-344)

#### Understanding WAL Archiving
Write-Ahead Logging (WAL) archiving enables continuous backup by copying WAL files to a safe location.

```bash
# Configure WAL archiving in postgresql.conf
wal_level = replica                    # or higher
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'

# Advanced archive command with compression
archive_command = 'gzip -c %p > /archive/%f.gz'

# Archive command with verification
archive_command = 'rsync -a %p backup_server:/archive/%f'

# Conditional archive command
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'

# Archive timeout for low-activity databases
archive_timeout = 300  # 5 minutes
```

#### Implementing Continuous Archiving
```bash
#!/bin/bash
# setup_wal_archiving.sh

# Create archive directory
ARCHIVE_DIR="/archive/wal"
mkdir -p "${ARCHIVE_DIR}"
chown postgres:postgres "${ARCHIVE_DIR}"
chmod 750 "${ARCHIVE_DIR}"

# Configure PostgreSQL for archiving
cat >> postgresql.conf << EOF
# WAL Archiving Configuration
wal_level = replica
archive_mode = on
archive_command = 'test ! -f ${ARCHIVE_DIR}/%f && cp %p ${ARCHIVE_DIR}/%f'
archive_timeout = 300

# Checkpoint configuration for archiving
checkpoint_completion_target = 0.9
wal_buffers = 16MB
max_wal_size = 1GB
min_wal_size = 80MB
EOF

# Restart PostgreSQL
systemctl restart postgresql

# Verify archiving is working
psql -c "SELECT pg_switch_wal();"
sleep 10
ls -la "${ARCHIVE_DIR}"
```

#### Advanced Archive Scripts
```bash
#!/bin/bash
# advanced_archive_command.sh
# Usage: advanced_archive_command.sh %p %f

WAL_PATH="$1"
WAL_FILE="$2"
ARCHIVE_DIR="/archive/wal"
REMOTE_ARCHIVE="backup-server:/archive/wal"
LOG_FILE="/var/log/postgresql/archive.log"

# Local archive
if cp "${WAL_PATH}" "${ARCHIVE_DIR}/${WAL_FILE}"; then
    echo "$(date): Local archive successful: ${WAL_FILE}" >> "${LOG_FILE}"
else
    echo "$(date): Local archive failed: ${WAL_FILE}" >> "${LOG_FILE}"
    exit 1
fi

# Remote archive (async)
if rsync -a "${ARCHIVE_DIR}/${WAL_FILE}" "${REMOTE_ARCHIVE}/" >> "${LOG_FILE}" 2>&1; then
    echo "$(date): Remote archive successful: ${WAL_FILE}" >> "${LOG_FILE}"
else
    echo "$(date): Remote archive failed: ${WAL_FILE}" >> "${LOG_FILE}"
    # Don't fail here - local archive succeeded
fi

# Cleanup old local archives (keep last 100 files)
cd "${ARCHIVE_DIR}"
ls -1t | tail -n +101 | xargs rm -f

exit 0
```

### 4. Hot vs Cold Backups (Q345-346)

#### Hot Backup (Online Backup)
Hot backups are performed while the database is running and accepting connections.

```bash
# Hot backup using pg_basebackup
pg_basebackup -D /backup/hot_backup -Ft -z -P

# Hot backup with streaming WAL
pg_basebackup -D /backup/hot_backup -X stream -P

# Hot logical backup
pg_dump -Fc myapp > /backup/myapp_hot.custom

# Hot backup verification
pg_basebackup -D /backup/hot_backup -c fast --verify-checksums
```

#### Cold Backup (Offline Backup)
Cold backups require stopping the PostgreSQL service.

```bash
#!/bin/bash
# cold_backup.sh

PGDATA="/var/lib/postgresql/data"
BACKUP_DIR="/backup/cold_backup_$(date +%Y%m%d_%H%M%S)"
SERVICE_NAME="postgresql"

echo "Starting cold backup process..."

# Stop PostgreSQL
echo "Stopping PostgreSQL..."
systemctl stop "${SERVICE_NAME}"

# Verify PostgreSQL is stopped
if systemctl is-active "${SERVICE_NAME}" > /dev/null; then
    echo "ERROR: PostgreSQL is still running"
    exit 1
fi

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Copy data directory
echo "Copying data directory..."
cp -R "${PGDATA}" "${BACKUP_DIR}/"

# Copy configuration files
cp /etc/postgresql/*/main/postgresql.conf "${BACKUP_DIR}/"
cp /etc/postgresql/*/main/pg_hba.conf "${BACKUP_DIR}/"

# Create backup info
cat > "${BACKUP_DIR}/backup_info.txt" << EOF
Backup Type: Cold Backup
Backup Date: $(date)
PostgreSQL Data Directory: ${PGDATA}
PostgreSQL Version: $(su - postgres -c "postgres --version")
Backup Size: $(du -sh "${BACKUP_DIR}" | cut -f1)
EOF

# Restart PostgreSQL
echo "Starting PostgreSQL..."
systemctl start "${SERVICE_NAME}"

# Verify PostgreSQL is running
if systemctl is-active "${SERVICE_NAME}" > /dev/null; then
    echo "Cold backup completed successfully: ${BACKUP_DIR}"
else
    echo "ERROR: Failed to restart PostgreSQL"
    exit 1
fi
```

#### Hot vs Cold Backup Comparison
| Aspect | Hot Backup | Cold Backup |
|--------|------------|-------------|
| **Service Availability** | Database remains online | Database must be stopped |
| **Data Consistency** | Consistent via WAL | Guaranteed consistent |
| **Performance Impact** | Some I/O impact | No impact while running |
| **Backup Speed** | Slower (ongoing activity) | Faster (no concurrent activity) |
| **Use Cases** | Production systems | Maintenance windows |
| **Risk** | Transaction log required | No additional dependencies |

### 5. Point-in-Time Recovery (PITR) (Q347-349)

#### PITR Fundamentals
PITR allows restoring a database to any specific point in time using base backups and WAL archives.

#### PITR Implementation Setup
```bash
# 1. Configure continuous archiving (prerequisite)
# In postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'

# 2. Take base backup
pg_basebackup -D /backup/base_backup -Ft

# 3. Ensure WAL archiving is working
psql -c "SELECT pg_switch_wal();"
```

#### PITR Recovery Process
```bash
#!/bin/bash
# pitr_recovery.sh

TARGET_TIME="2024-12-01 14:30:00"
BASE_BACKUP="/backup/base_backup"
ARCHIVE_DIR="/archive"
RECOVERY_DIR="/recovery/pitr_restore"

echo "Starting PITR recovery to: ${TARGET_TIME}"

# 1. Stop PostgreSQL if running
systemctl stop postgresql

# 2. Create recovery directory
rm -rf "${RECOVERY_DIR}"
mkdir -p "${RECOVERY_DIR}"

# 3. Extract base backup
cd "${RECOVERY_DIR}"
tar -xf "${BASE_BACKUP}/base.tar"

# 4. Create recovery configuration
cat > recovery.signal << EOF
# This file indicates recovery mode
EOF

cat > postgresql.conf << EOF
# Basic configuration for recovery
restore_command = 'cp ${ARCHIVE_DIR}/%f %p'
recovery_target_time = '${TARGET_TIME}'
recovery_target_timeline = 'latest'
recovery_target_action = 'promote'
EOF

# 5. Set ownership
chown -R postgres:postgres "${RECOVERY_DIR}"

# 6. Update PostgreSQL data directory
sudo -u postgres cp -R "${RECOVERY_DIR}"/* /var/lib/postgresql/data/

# 7. Start PostgreSQL for recovery
systemctl start postgresql

echo "PITR recovery initiated. Monitor logs for completion."
```

#### Advanced PITR Recovery Options
```bash
# Recovery to specific time
recovery_target_time = '2024-12-01 14:30:00'

# Recovery to specific transaction ID
recovery_target_xid = '12345678'

# Recovery to specific WAL location
recovery_target_lsn = '0/1234ABCD'

# Recovery to named restore point
# First create restore point:
# SELECT pg_create_restore_point('before_major_update');
recovery_target_name = 'before_major_update'

# Recovery actions after reaching target
recovery_target_action = 'pause'     # Pause for inspection
recovery_target_action = 'promote'   # Promote immediately
recovery_target_action = 'shutdown'  # Shutdown after recovery

# Recovery timeline
recovery_target_timeline = 'latest'  # Follow latest timeline
recovery_target_timeline = '1'       # Specific timeline

# Recovery command examples
restore_command = 'cp /archive/%f %p'
restore_command = 'gunzip -c /archive/%f.gz > %p'
restore_command = 'rsync backup-server:/archive/%f %p'
```

#### PostgreSQL 12+ Recovery Configuration
```bash
# PostgreSQL 12+ uses different recovery configuration

# 1. Create recovery.signal file (empty file indicates recovery mode)
touch recovery.signal

# 2. Add recovery settings to postgresql.conf
cat >> postgresql.conf << EOF
# Recovery Configuration
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2024-12-01 14:30:00'
recovery_target_action = 'promote'
EOF

# For standby server, use standby.signal instead
touch standby.signal

# Standby configuration
cat >> postgresql.conf << EOF
primary_conninfo = 'host=primary_server port=5432 user=replicator'
restore_command = 'cp /archive/%f %p'
EOF
```

### 6. Backup Strategies and Best Practices (Q350-354)

#### Comprehensive Backup Strategy
```bash
#!/bin/bash
# comprehensive_backup_strategy.sh

# Configuration
DB_NAME="production_app"
BACKUP_BASE="/backups"
DAILY_DIR="${BACKUP_BASE}/daily"
WEEKLY_DIR="${BACKUP_BASE}/weekly"
MONTHLY_DIR="${BACKUP_BASE}/monthly"
ARCHIVE_DIR="/archive/wal"

# Create directories
mkdir -p "${DAILY_DIR}" "${WEEKLY_DIR}" "${MONTHLY_DIR}"

# Get current date info
CURRENT_DATE=$(date +%Y%m%d)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +%d)

# Daily logical backup
echo "Performing daily logical backup..."
pg_dump -Fc "${DB_NAME}" > "${DAILY_DIR}/${DB_NAME}_${CURRENT_DATE}.custom"

# Weekly physical backup (Sundays)
if [ "${DAY_OF_WEEK}" -eq 7 ]; then
    echo "Performing weekly physical backup..."
    pg_basebackup -D "${WEEKLY_DIR}/base_${CURRENT_DATE}" -Ft -z -P
fi

# Monthly full cluster backup (1st of month)
if [ "${DAY_OF_MONTH}" -eq 1 ]; then
    echo "Performing monthly cluster backup..."
    pg_dumpall | gzip > "${MONTHLY_DIR}/cluster_${CURRENT_DATE}.sql.gz"
fi

# Cleanup old backups
echo "Cleaning up old backups..."
# Keep 7 daily backups
find "${DAILY_DIR}" -name "*.custom" -mtime +7 -delete

# Keep 4 weekly backups
find "${WEEKLY_DIR}" -name "base_*" -mtime +28 -exec rm -rf {} \;

# Keep 12 monthly backups
find "${MONTHLY_DIR}" -name "*.sql.gz" -mtime +365 -delete

# WAL archive cleanup (keep 7 days)
find "${ARCHIVE_DIR}" -name "*.wal" -mtime +7 -delete

echo "Backup strategy completed at $(date)"
```

#### Backup Frequency Guidelines

#### Production Environment Backup Schedule
```bash
# Backup frequency recommendations based on business requirements:

# Critical systems (financial, healthcare):
# - Continuous WAL archiving
# - Hourly logical backups of critical schemas
# - Daily full logical backups
# - Weekly physical backups
# - Monthly full cluster backups

# Standard production systems:
# - Daily logical backups
# - Weekly physical backups  
# - Continuous WAL archiving
# - Monthly archive cleanups

# Development/staging systems:
# - Daily or weekly backups
# - Before major deployments
# - Monthly cleanups

# Example crontab entries:
# 0 2 * * * /scripts/daily_backup.sh
# 0 3 * * 0 /scripts/weekly_backup.sh
# 0 4 1 * * /scripts/monthly_backup.sh
# 0 1 * * * /scripts/cleanup_archives.sh
```

#### Backup Testing and Validation
```bash
#!/bin/bash
# backup_validation.sh

BACKUP_FILE="$1"
TEST_DB="backup_test_$(date +%s)"

echo "Validating backup: ${BACKUP_FILE}"

# Test 1: Verify backup file integrity
if pg_restore --list "${BACKUP_FILE}" > /dev/null 2>&1; then
    echo "✓ Backup file format is valid"
else
    echo "✗ Backup file is corrupted"
    exit 1
fi

# Test 2: Restore to test database
createdb "${TEST_DB}"
if pg_restore -d "${TEST_DB}" "${BACKUP_FILE}" > /dev/null 2>&1; then
    echo "✓ Backup restoration successful"
else
    echo "✗ Backup restoration failed"
    dropdb "${TEST_DB}" 2>/dev/null
    exit 1
fi

# Test 3: Verify data integrity
ORIGINAL_COUNT=$(psql -d production_app -t -c "SELECT COUNT(*) FROM users;")
RESTORED_COUNT=$(psql -d "${TEST_DB}" -t -c "SELECT COUNT(*) FROM users;")

if [ "${ORIGINAL_COUNT}" -eq "${RESTORED_COUNT}" ]; then
    echo "✓ Data integrity check passed"
else
    echo "✗ Data integrity check failed"
    dropdb "${TEST_DB}"
    exit 1
fi

# Test 4: Application connectivity test
if psql -d "${TEST_DB}" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✓ Database connectivity test passed"
else
    echo "✗ Database connectivity test failed"
    dropdb "${TEST_DB}"
    exit 1
fi

# Cleanup
dropdb "${TEST_DB}"
echo "✓ Backup validation completed successfully"
```

#### Backup Retention Policy
```bash
#!/bin/bash
# backup_retention_policy.sh

# Retention policy implementation
# - Daily backups: Keep 7 days
# - Weekly backups: Keep 4 weeks  
# - Monthly backups: Keep 12 months
# - WAL archives: Keep 7 days (or until next full backup)

BACKUP_DIR="/backups"

# Daily retention (7 days)
find "${BACKUP_DIR}/daily" -type f -mtime +7 -delete

# Weekly retention (4 weeks = 28 days)
find "${BACKUP_DIR}/weekly" -type d -mtime +28 -exec rm -rf {} \;

# Monthly retention (12 months = 365 days)
find "${BACKUP_DIR}/monthly" -type f -mtime +365 -delete

# WAL archive retention with safety check
# Only delete WAL files older than the oldest full backup
OLDEST_BACKUP=$(find "${BACKUP_DIR}" -name "*.custom" -o -name "base_*" | xargs ls -t | tail -1)
if [ -n "${OLDEST_BACKUP}" ]; then
    OLDEST_DATE=$(stat -c %Y "${OLDEST_BACKUP}")
    find "/archive/wal" -type f -not -newer "${OLDEST_BACKUP}" -delete
fi

# Log retention activity
echo "$(date): Backup retention policy applied" >> /var/log/backup_retention.log
```

#### Backup Automation with Monitoring
```bash
#!/bin/bash
# automated_backup_with_monitoring.sh

SCRIPT_NAME="PostgreSQL Backup"
EMAIL_ALERT="dba@company.com"
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Function to send alerts
send_alert() {
    local message="$1"
    local status="$2"
    
    # Email alert
    echo "${message}" | mail -s "${SCRIPT_NAME} - ${status}" "${EMAIL_ALERT}"
    
    # Slack alert
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"${SCRIPT_NAME} - ${status}: ${message}\"}" \
        "${SLACK_WEBHOOK}"
}

# Main backup process with error handling
{
    # Perform backup
    pg_dump -Fc production_app > "/backups/daily/app_$(date +%Y%m%d).custom"
    
    if [ $? -eq 0 ]; then
        # Verify backup
        pg_restore --list "/backups/daily/app_$(date +%Y%m%d).custom" > /dev/null
        
        if [ $? -eq 0 ]; then
            send_alert "Backup completed successfully" "SUCCESS"
        else
            send_alert "Backup verification failed" "ERROR"
            exit 1
        fi
    else
        send_alert "Backup process failed" "ERROR"
        exit 1
    fi
    
} || {
    send_alert "Backup script encountered an error" "ERROR"
    exit 1
}
```

### 7. Advanced Backup Management Tools (Q355-358)

#### Barman (Backup and Recovery Manager)

#### Barman Installation and Configuration
```bash
# Install Barman
yum install barman barman-cli  # CentOS/RHEL
apt-get install barman         # Ubuntu/Debian

# Barman configuration (/etc/barman.conf)
cat > /etc/barman.conf << EOF
[barman]
barman_home = /var/lib/barman
barman_user = barman
log_file = /var/log/barman/barman.log
log_level = INFO
compression = gzip
immediate_checkpoint = true
basebackup_retry_times = 3
basebackup_retry_sleep = 30

[production]
description = "Production PostgreSQL Database"
conninfo = host=pg-server user=barman dbname=postgres
streaming_conninfo = host=pg-server user=streaming_barman dbname=postgres
backup_method = rsync
streaming_archiver = on
slot_name = barman
path_prefix = /usr/pgsql-13/bin
EOF

# PostgreSQL configuration for Barman
# In postgresql.conf:
wal_level = replica
max_wal_senders = 2
max_replication_slots = 2
archive_mode = on
archive_command = 'barman-wal-archive pg-server %p'

# In pg_hba.conf:
host    all             barman          10.0.0.0/8              md5
host    replication     streaming_barman 10.0.0.0/8              md5
```

#### Barman Operations
```bash
# Initialize Barman
barman receive-wal --create-slot production
barman cron

# Perform backup
barman backup production

# List backups
barman list-backup production

# Show backup details
barman show-backup production latest

# Restore operations
# Full recovery
barman recover production latest /var/lib/postgresql/13/main

# Point-in-time recovery
barman recover production latest /var/lib/postgresql/13/main \
    --target-time "2024-12-01 14:30:00"

# Remote recovery
barman recover --remote-ssh-command "ssh postgres@pg-server" \
    production latest /var/lib/postgresql/13/main

# Check backup integrity
barman check production

# Delete old backups
barman delete production oldest
```

#### pgBackRest - Enterprise Backup Solution

#### pgBackRest Configuration
```bash
# Install pgBackRest
yum install pgbackrest  # CentOS/RHEL
apt install pgbackrest  # Ubuntu/Debian

# pgBackRest configuration (/etc/pgbackrest/pgbackrest.conf)
cat > /etc/pgbackrest/pgbackrest.conf << EOF
[global]
repo1-type=posix
repo1-path=/backup/pgbackrest
repo1-retention-full=2
repo1-retention-diff=7
repo1-retention-archive=7
start-fast=y
stop-auto=y
resume=n
archive-async=y
spool-path=/tmp/pgbackrest

[main]
pg1-path=/var/lib/postgresql/data
pg1-port=5432
pg1-user=postgres

[global:archive-push]
compress-level=3

[global:backup]
process-max=4
delta=y
compress-level=3
EOF

# PostgreSQL configuration for pgBackRest
# In postgresql.conf:
archive_mode = on
archive_command = 'pgbackrest --stanza=main archive-push %p'
max_wal_senders = 3

# Initialize pgBackRest
pgbackrest --stanza=main stanza-create
pgbackrest --stanza=main check
```

#### pgBackRest Operations
```bash
# Full backup
pgbackrest --stanza=main backup --type=full

# Incremental backup
pgbackrest --stanza=main backup --type=incr

# Differential backup
pgbackrest --stanza=main backup --type=diff

# List backups
pgbackrest --stanza=main info

# Restore operations
# Latest backup restore
pgbackrest --stanza=main restore

# Point-in-time recovery
pgbackrest --stanza=main restore \
    --type=time --target="2024-12-01 14:30:00"

# Transaction ID recovery
pgbackrest --stanza=main restore \
    --type=xid --target="12345678"

# Specific backup restore
pgbackrest --stanza=main restore --set=20241201-143000F

# Delta restore (only changed files)
pgbackrest --stanza=main restore --delta

# Verify backup
pgbackrest --stanza=main check
```

#### WAL-G - Go-based Backup Tool

#### WAL-G Setup
```bash
# Install WAL-G
wget https://github.com/wal-g/wal-g/releases/latest/download/wal-g-pg-ubuntu-20.04-amd64.tar.gz
tar -xzf wal-g-pg-ubuntu-20.04-amd64.tar.gz
mv wal-g-pg-ubuntu-20.04-amd64 /usr/local/bin/wal-g
chmod +x /usr/local/bin/wal-g

# Configuration via environment variables
cat > /etc/postgresql/wal-g.env << EOF
WALG_S3_PREFIX=s3://backup-bucket/postgresql
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
WALG_COMPRESSION_METHOD=brotli
WALG_DELTA_MAX_STEPS=6
EOF

# PostgreSQL configuration
# In postgresql.conf:
archive_mode = on
archive_command = '/usr/local/bin/wal-g wal-push %p'
restore_command = '/usr/local/bin/wal-g wal-fetch %f %p'
```

#### WAL-G Operations
```bash
# Source environment
source /etc/postgresql/wal-g.env

# Create backup
wal-g backup-push

# List backups
wal-g backup-list

# Restore latest backup
wal-g backup-fetch LATEST /var/lib/postgresql/data

# Point-in-time recovery
wal-g backup-fetch LATEST /var/lib/postgresql/data
# Then set recovery target in postgresql.conf

# Delete old backups
wal-g delete retain FULL 3

# Delete before specific backup
wal-g delete before backup_20241201_143000

# Verify backup
wal-g backup-list --detail
```

### 8. Large Database and Incremental Backup Strategies (Q359-360)

#### Large Database Backup Challenges and Solutions

#### Parallel Backup Strategies
```bash
#!/bin/bash
# parallel_large_db_backup.sh

DB_NAME="large_production_db"
BACKUP_DIR="/backups/parallel"
PARALLEL_JOBS=8
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory structure
mkdir -p "${BACKUP_DIR}/${DATE}"

# Parallel logical backup using directory format
pg_dump -Fd "${DB_NAME}" -j "${PARALLEL_JOBS}" -f "${BACKUP_DIR}/${DATE}"

# Alternative: Schema-specific parallel backups
SCHEMAS=("sales" "inventory" "customers" "orders" "analytics")

for schema in "${SCHEMAS[@]}"; do
    {
        echo "Backing up schema: ${schema}"
        pg_dump --schema="${schema}" -Fc "${DB_NAME}" > \
            "${BACKUP_DIR}/${DATE}/${schema}_${DATE}.custom"
        echo "Completed: ${schema}"
    } &
done

# Wait for all background jobs to complete
wait

echo "Parallel backup completed: ${BACKUP_DIR}/${DATE}"
```

#### Table-Level Parallel Backup
```bash
#!/bin/bash
# table_level_parallel_backup.sh

DB_NAME="large_db"
BACKUP_DIR="/backups/tables"
MAX_PARALLEL=6
DATE=$(date +%Y%m%d_%H%M%S)

# Get list of large tables
LARGE_TABLES=$(psql -d "${DB_NAME}" -t -c "
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
        SELECT tablename 
        FROM pg_stats 
        GROUP BY tablename 
        HAVING COUNT(*) > 100000
    )"
)

# Function to backup individual table
backup_table() {
    local table="$1"
    local backup_file="${BACKUP_DIR}/${DATE}/${table}_${DATE}.custom"
    
    echo "Starting backup of table: ${table}"
    pg_dump -Fc -t "${table}" "${DB_NAME}" > "${backup_file}"
    
    if [ $? -eq 0 ]; then
        echo "Completed backup of table: ${table}"
    else
        echo "Failed backup of table: ${table}"
    fi
}

# Create backup directory
mkdir -p "${BACKUP_DIR}/${DATE}"

# Export function for parallel execution
export -f backup_table
export BACKUP_DIR DATE DB_NAME

# Execute parallel backups
echo "${LARGE_TABLES}" | xargs -n 1 -P "${MAX_PARALLEL}" -I {} bash -c 'backup_table "$@"' _ {}

echo "Table-level parallel backup completed"
```

#### Incremental Backup Implementation

#### Custom Incremental Backup Solution
```bash
#!/bin/bash
# incremental_backup_system.sh

DB_NAME="production_app"
BACKUP_BASE="/backups/incremental"
FULL_BACKUP_DIR="${BACKUP_BASE}/full"
INCR_BACKUP_DIR="${BACKUP_BASE}/incremental"
METADATA_DIR="${BACKUP_BASE}/metadata"

# Create directories
mkdir -p "${FULL_BACKUP_DIR}" "${INCR_BACKUP_DIR}" "${METADATA_DIR}"

# Function to perform full backup
perform_full_backup() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_path="${FULL_BACKUP_DIR}/full_${backup_date}"
    
    echo "Performing full backup: ${backup_date}"
    
    # Physical backup
    pg_basebackup -D "${backup_path}" -Ft -z -P
    
    # Store backup metadata
    cat > "${METADATA_DIR}/full_${backup_date}.meta" << EOF
backup_type=full
backup_date=${backup_date}
backup_path=${backup_path}
database_name=${DB_NAME}
checkpoint_lsn=$(psql -d ${DB_NAME} -t -c "SELECT pg_current_wal_lsn();")
EOF
    
    # Update latest full backup pointer
    echo "full_${backup_date}" > "${METADATA_DIR}/latest_full.txt"
    
    echo "Full backup completed: ${backup_path}"
}

# Function to perform incremental backup
perform_incremental_backup() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local latest_full=$(cat "${METADATA_DIR}/latest_full.txt" 2>/dev/null)
    
    if [ -z "${latest_full}" ]; then
        echo "No full backup found. Performing full backup first."
        perform_full_backup
        return
    fi
    
    # Get last checkpoint LSN from latest full backup
    local last_lsn=$(grep "checkpoint_lsn" "${METADATA_DIR}/${latest_full}.meta" | cut -d'=' -f2)
    local current_lsn=$(psql -d ${DB_NAME} -t -c "SELECT pg_current_wal_lsn();")
    
    echo "Performing incremental backup: ${backup_date}"
    echo "From LSN: ${last_lsn} To LSN: ${current_lsn}"
    
    # Archive WAL files for incremental recovery
    local incr_path="${INCR_BACKUP_DIR}/incr_${backup_date}"
    mkdir -p "${incr_path}"
    
    # Copy recent WAL files (simplified approach)
    cp /archive/*.wal "${incr_path}/" 2>/dev/null || true
    
    # Store incremental backup metadata
    cat > "${METADATA_DIR}/incr_${backup_date}.meta" << EOF
backup_type=incremental
backup_date=${backup_date}
backup_path=${incr_path}
database_name=${DB_NAME}
base_backup=${latest_full}
start_lsn=${last_lsn}
end_lsn=${current_lsn}
EOF
    
    echo "Incremental backup completed: ${incr_path}"
}

# Main logic
case "${1:-auto}" in
    full)
        perform_full_backup
        ;;
    incremental)
        perform_incremental_backup
        ;;
    auto)
        # Auto mode: full backup weekly, incremental daily
        if [ $(date +%u) -eq 1 ]; then  # Monday
            perform_full_backup
        else
            perform_incremental_backup
        fi
        ;;
    *)
        echo "Usage: $0 {full|incremental|auto}"
        exit 1
        ;;
esac
```

#### Large Database Optimization Techniques
```bash
#!/bin/bash
# large_db_backup_optimization.sh

# 1. Network optimization for large backups
optimize_network() {
    # Increase network buffer sizes
    echo 'net.core.rmem_max = 134217728' >> /etc/sysctl.conf
    echo 'net.core.wmem_max = 134217728' >> /etc/sysctl.conf
    sysctl -p
}

# 2. I/O optimization
optimize_io() {
    # Use faster compression
    export PGDUMP_COMPRESS_LEVEL=1
    
    # Parallel I/O for large files
    export PGDUMP_PARALLEL_JOBS=$(nproc)
}

# 3. Memory optimization
optimize_memory() {
    # Increase work_mem for dump operations
    psql -c "SET work_mem = '1GB';"
    
    # Tune shared_buffers for backup operations
    psql -c "SHOW shared_buffers;"
}

# 4. Selective backup strategy
selective_backup() {
    local db_name="$1"
    
    # Backup critical tables with full data
    CRITICAL_TABLES=("users" "orders" "payments")
    
    # Backup large tables with recent data only
    LARGE_TABLES=("audit_logs" "session_data" "temp_calculations")
    
    for table in "${CRITICAL_TABLES[@]}"; do
        pg_dump -Fc -t "${table}" "${db_name}" > "critical_${table}.custom"
    done
    
    for table in "${LARGE_TABLES[@]}"; do
        # Only backup recent data (last 30 days)
        pg_dump -Fc --where="created_at > now() - interval '30 days'" \
                -t "${table}" "${db_name}" > "recent_${table}.custom"
    done
}

# Apply optimizations
optimize_network
optimize_io
optimize_memory

echo "Large database backup optimizations applied"
```

## Study Plan Recommendations

### Phase 1: Backup Fundamentals (Days 1-4)
- Master logical vs physical backup concepts
- Practice pg_dump, pg_dumpall, and pg_restore
- Learn pg_basebackup for physical backups
- Understand hot vs cold backup scenarios

### Phase 2: Advanced Recovery (Days 5-9)
- Implement continuous WAL archiving
- Practice Point-in-Time Recovery (PITR)
- Study PostgreSQL 12+ recovery configuration
- Learn recovery.signal vs standby.signal usage

### Phase 3: Backup Strategies (Days 10-12)
- Design comprehensive backup strategies
- Implement backup automation and monitoring
- Practice backup testing and validation
- Study retention policies and cleanup procedures

### Phase 4: Enterprise Tools (Days 13-15)
- Learn Barman configuration and operations
- Practice pgBackRest for enterprise environments
- Explore WAL-G for cloud-based backups
- Study incremental backup strategies for large databases

## Key Backup and Recovery Best Practices

### 1. **3-2-1 Backup Rule**
- 3 copies of important data
- 2 different storage media types
- 1 offsite backup location

### 2. **Recovery Testing**
- Regular recovery drills and testing
- Automated backup validation
- Document recovery procedures
- Measure recovery time objectives (RTO)

### 3. **Monitoring and Alerting**
- Monitor backup completion and failures
- Alert on backup size anomalies
- Track backup and restore performance
- Automated notification systems

### 4. **Security Considerations**
- Encrypt backups at rest and in transit
- Secure backup storage locations
- Control access to backup files
- Regular security audits of backup systems

### 5. **Documentation and Procedures**
- Detailed backup and recovery procedures
- Emergency contact information
- Recovery time and point objectives
- Regular procedure updates and training

This comprehensive backup and recovery knowledge foundation will enable you to confidently answer all PostgreSQL backup questions (Q336-360) in technical interviews, demonstrating both theoretical understanding and practical implementation expertise.