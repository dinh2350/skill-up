# PostgreSQL Security Knowledge Summary (Q306-335)

## Learning Objectives
This guide provides comprehensive knowledge needed to answer PostgreSQL security interview questions Q306-335, covering roles and users, authentication methods, authorization models, Row-Level Security (RLS), connection security, SQL injection prevention, and database auditing.

## Core Learning Areas

### 1. Roles and Users Fundamentals (Q306-308)

#### PostgreSQL Roles Concept
In PostgreSQL, roles are the foundation of the security model. Unlike many other database systems, PostgreSQL does not distinguish between "users" and "groups" - everything is a role.

```sql
-- Roles are the core security entity in PostgreSQL
-- A role can be a user, a group, or both

-- View all roles
SELECT 
    rolname as role_name,
    rolsuper as is_superuser,
    rolcreaterole as can_create_roles,
    rolcreatedb as can_create_db,
    rolcanlogin as can_login,
    rolconnlimit as connection_limit
FROM pg_roles;

-- Alternative system view
\du  -- In psql
```

#### Difference Between Roles and Users
| Aspect | Traditional "User" | Traditional "Group" | PostgreSQL Role |
|--------|-------------------|-------------------|-----------------|
| **Identity** | Individual login account | Collection of users | Unified concept |
| **Login** | Can login | Cannot login | Configurable with LOGIN attribute |
| **Membership** | Member of groups | Contains users | Can have other roles as members |
| **Inheritance** | Inherits group privileges | N/A | Configurable inheritance |
| **Purpose** | Access database | Organize permissions | Both access and organization |

```sql
-- In PostgreSQL, these are equivalent concepts:
-- "User" = Role with LOGIN privilege
-- "Group" = Role without LOGIN privilege (used for grouping)

-- What people call a "user" in PostgreSQL
CREATE ROLE john_user WITH LOGIN PASSWORD 'secure123';

-- What people call a "group" in PostgreSQL  
CREATE ROLE developers;  -- No LOGIN by default

-- Grant group membership
GRANT developers TO john_user;
```

#### Creating and Managing Roles
```sql
-- Basic role creation
CREATE ROLE basic_role;

-- User role (can login)
CREATE USER app_user WITH PASSWORD 'strong_password123';
-- This is equivalent to:
CREATE ROLE app_user WITH LOGIN PASSWORD 'strong_password123';

-- Role with specific attributes
CREATE ROLE power_user WITH
    LOGIN
    PASSWORD 'secure_pass'
    CREATEDB
    CREATEROLE
    CONNECTION LIMIT 10
    VALID UNTIL '2025-12-31';

-- Superuser role (use with extreme caution)
CREATE ROLE admin_user WITH 
    LOGIN 
    PASSWORD 'admin_secure_pass'
    SUPERUSER;

-- Group role for organizing permissions
CREATE ROLE read_only_group;
CREATE ROLE data_analysts;
CREATE ROLE application_users;

-- Role hierarchy example
CREATE ROLE company_staff;
CREATE ROLE department_managers;
CREATE ROLE executives;

-- Create hierarchy
GRANT company_staff TO department_managers;
GRANT department_managers TO executives;

-- Alter existing roles
ALTER ROLE app_user WITH PASSWORD 'new_password';
ALTER ROLE app_user CONNECTION LIMIT 20;
ALTER ROLE app_user VALID UNTIL '2026-12-31';

-- Drop roles (must revoke all privileges first)
DROP ROLE IF EXISTS temp_user;
```

### 2. Privilege Management (Q309-314)

#### Granting Privileges

#### Database Level Privileges
```sql
-- Database privileges
GRANT CONNECT ON DATABASE myapp TO app_user;
GRANT CREATE ON DATABASE myapp TO app_user;
GRANT TEMPORARY ON DATABASE myapp TO app_user;

-- Connect privilege is needed to access database
GRANT CONNECT ON DATABASE production_db TO read_only_group;

-- Create privilege allows creating schemas, tables, etc.
GRANT CREATE ON DATABASE development_db TO developers;
```

#### Schema Level Privileges
```sql
-- Schema privileges
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO developers;
GRANT ALL ON SCHEMA analytics TO data_analysts;

-- Usage allows accessing objects in schema
GRANT USAGE ON SCHEMA inventory TO warehouse_staff;

-- Create allows creating objects in schema
GRANT CREATE ON SCHEMA reporting TO report_builders;

-- Grant on all schemas in database
GRANT USAGE ON ALL SCHEMAS IN DATABASE myapp TO app_user;

-- Grant on future schemas (PostgreSQL 14+)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO read_only_group;
```

#### Table Level Privileges
```sql
-- Individual table privileges
GRANT SELECT ON customers TO sales_team;
GRANT INSERT, UPDATE ON orders TO order_processors;
GRANT ALL ON products TO product_managers;

-- Grant on multiple tables
GRANT SELECT ON customers, orders, products TO analysts;

-- Grant on all tables in schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_users;

-- Grant with GRANT OPTION (allows re-granting)
GRANT SELECT ON sensitive_data TO trusted_user WITH GRANT OPTION;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO read_only_group;

-- Specific privilege examples
GRANT SELECT (customer_id, name) ON customers TO limited_access;  -- Column-level
GRANT UPDATE (status) ON orders TO status_updaters;
GRANT DELETE ON temp_data TO cleanup_service;
GRANT TRUNCATE ON staging_tables TO etl_process;
GRANT REFERENCES ON lookup_tables TO app_user;
GRANT TRIGGER ON audit_tables TO audit_system;
```

#### Column Level Privileges
```sql
-- Column-specific privileges (granular control)
CREATE TABLE employee_data (
    id SERIAL PRIMARY KEY,
    name TEXT,
    department TEXT,
    salary DECIMAL(10,2),
    ssn TEXT,
    performance_rating INTEGER
);

-- HR can see salary and SSN
GRANT SELECT (id, name, department, salary, ssn) ON employee_data TO hr_role;

-- Managers can see ratings but not salary/SSN
GRANT SELECT (id, name, department, performance_rating) ON employee_data TO manager_role;

-- General staff can only see basic info
GRANT SELECT (id, name, department) ON employee_data TO general_staff;

-- Allow updates to specific columns
GRANT UPDATE (performance_rating) ON employee_data TO manager_role;
GRANT UPDATE (department) ON employee_data TO hr_role;
```

#### Function and Sequence Privileges
```sql
-- Function privileges
CREATE OR REPLACE FUNCTION calculate_bonus(emp_id INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    -- Function logic
    RETURN 1000.00;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION calculate_bonus(INTEGER) TO payroll_team;

-- Sequence privileges
CREATE SEQUENCE order_id_seq;
GRANT USAGE ON SEQUENCE order_id_seq TO order_processors;
GRANT SELECT ON SEQUENCE order_id_seq TO reporting_team;
```

#### Revoking Privileges
```sql
-- Revoke specific privileges
REVOKE INSERT ON orders FROM temp_user;
REVOKE ALL ON customers FROM departed_employee;

-- Revoke with CASCADE (removes dependent privileges)
REVOKE SELECT ON sensitive_data FROM user_with_grant_option CASCADE;

-- Revoke schema access
REVOKE USAGE ON SCHEMA restricted_area FROM unauthorized_user;

-- Revoke database access
REVOKE CONNECT ON DATABASE production FROM test_user;

-- Comprehensive cleanup for departing employee
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM departed_employee;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM departed_employee;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM departed_employee;
REVOKE USAGE ON SCHEMA public FROM departed_employee;
REVOKE CONNECT ON DATABASE myapp FROM departed_employee;
```

#### Principle of Least Privilege Implementation
```sql
-- Start with no access and grant only what's needed

-- 1. Create roles with minimal access
CREATE ROLE customer_service_rep WITH LOGIN PASSWORD 'secure_pass';

-- 2. Grant only database connection
GRANT CONNECT ON DATABASE crm TO customer_service_rep;

-- 3. Grant schema usage
GRANT USAGE ON SCHEMA public TO customer_service_rep;

-- 4. Grant specific table access
GRANT SELECT ON customers TO customer_service_rep;
GRANT SELECT ON orders TO customer_service_rep;
GRANT UPDATE (status, notes) ON support_tickets TO customer_service_rep;

-- 5. No administrative privileges
-- No SUPERUSER, CREATEDB, CREATEROLE

-- 6. Limited connection count
ALTER ROLE customer_service_rep CONNECTION LIMIT 5;

-- 7. Time-limited access if needed
ALTER ROLE customer_service_rep VALID UNTIL '2024-12-31';

-- Role-based access control example
CREATE ROLE read_only_access;
GRANT CONNECT ON DATABASE myapp TO read_only_access;
GRANT USAGE ON SCHEMA public TO read_only_access;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_access;

-- Grant role to users
GRANT read_only_access TO analyst1, analyst2, analyst3;
```

### 3. Row-Level Security (RLS) (Q315-317)

#### RLS Fundamentals and Implementation
Row-Level Security (RLS) allows you to control which rows users can see or modify based on policies you define.

```sql
-- Enable RLS on a table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    owner_id INTEGER,
    department TEXT,
    classification TEXT CHECK (classification IN ('public', 'internal', 'confidential')),
    created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Without policies, only table owner and superusers can access data
-- All other users get zero rows
```

#### RLS Policy Types and Examples

#### Basic RLS Policies
```sql
-- Policy for users to see only their own documents
CREATE POLICY user_documents ON documents
    FOR ALL
    TO application_users
    USING (owner_id = current_setting('app.user_id')::INTEGER);

-- Separate policies for different operations
CREATE POLICY select_own_documents ON documents
    FOR SELECT
    TO application_users
    USING (owner_id = current_setting('app.user_id')::INTEGER);

CREATE POLICY update_own_documents ON documents
    FOR UPDATE  
    TO application_users
    USING (owner_id = current_setting('app.user_id')::INTEGER)
    WITH CHECK (owner_id = current_setting('app.user_id')::INTEGER);

CREATE POLICY insert_as_owner ON documents
    FOR INSERT
    TO application_users
    WITH CHECK (owner_id = current_setting('app.user_id')::INTEGER);

CREATE POLICY delete_own_documents ON documents
    FOR DELETE
    TO application_users
    USING (owner_id = current_setting('app.user_id')::INTEGER);
```

#### Department-Based RLS
```sql
-- Policy for department-level access
CREATE POLICY department_documents ON documents
    FOR SELECT
    TO department_users
    USING (department = current_setting('app.user_department'));

-- Managers can see all documents in their department
CREATE POLICY manager_department_access ON documents
    FOR ALL
    TO department_managers
    USING (
        department = current_setting('app.user_department') 
        AND current_setting('app.user_role') = 'manager'
    );
```

#### Classification-Based RLS
```sql
-- Security clearance-based access
CREATE POLICY classification_access ON documents
    FOR SELECT
    TO all_users
    USING (
        CASE current_setting('app.user_clearance')
            WHEN 'confidential' THEN classification IN ('public', 'internal', 'confidential')
            WHEN 'internal' THEN classification IN ('public', 'internal')
            WHEN 'public' THEN classification = 'public'
            ELSE false
        END
    );
```

#### Advanced RLS with Functions
```sql
-- Function-based policy for complex logic
CREATE OR REPLACE FUNCTION user_has_document_access(doc_owner INTEGER, doc_dept TEXT, doc_classification TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- User owns the document
    IF doc_owner = current_setting('app.user_id')::INTEGER THEN
        RETURN true;
    END IF;
    
    -- Manager in same department
    IF current_setting('app.user_role') = 'manager' 
       AND doc_dept = current_setting('app.user_department') THEN
        RETURN true;
    END IF;
    
    -- Classification check
    IF doc_classification = 'public' THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY complex_document_access ON documents
    FOR SELECT
    TO application_users
    USING (user_has_document_access(owner_id, department, classification));
```

#### Time-Based RLS
```sql
-- Time-sensitive access
CREATE POLICY active_hours_access ON sensitive_operations
    FOR ALL
    TO business_users
    USING (
        EXTRACT(hour FROM now()) BETWEEN 9 AND 17  -- Business hours only
        AND EXTRACT(dow FROM now()) BETWEEN 1 AND 5  -- Weekdays only
    );
```

#### RLS Management and Monitoring
```sql
-- View existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies;

-- Disable RLS temporarily
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY user_documents ON documents;

-- RLS testing approach
-- Set application variables
SET app.user_id = '123';
SET app.user_department = 'sales';
SET app.user_role = 'user';
SET app.user_clearance = 'internal';

-- Test queries
SELECT * FROM documents;  -- Should only return allowed rows

-- Reset for different user
SET app.user_id = '456';
SET app.user_department = 'hr';
SELECT * FROM documents;  -- Different results
```

### 4. Connection Security (Q318-326)

#### SSL/TLS Configuration

#### Enabling SSL in PostgreSQL
```bash
# In postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'ca.crt'  # Optional: for client certificate verification

# SSL cipher configuration
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'  # Strong ciphers only
ssl_prefer_server_ciphers = on

# SSL protocols
ssl_min_protocol_version = 'TLSv1.2'  # Disable older protocols
```

```sql
-- Check SSL status
SELECT name, setting FROM pg_settings WHERE name LIKE 'ssl%';

-- View current connections with SSL status
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    ssl,
    ssl_version,
    ssl_cipher
FROM pg_stat_ssl 
JOIN pg_stat_activity USING (pid);
```

#### pg_hba.conf Authentication Configuration
The `pg_hba.conf` file controls client authentication - who can connect, how they authenticate, and from where.

```bash
# pg_hba.conf structure:
# TYPE  DATABASE    USER    ADDRESS         METHOD    [OPTIONS]

# Local connections (Unix domain sockets)
local   all         postgres                peer
local   all         all                     md5

# Host connections (TCP/IP)
# Require SSL for all remote connections
hostssl all         all         0.0.0.0/0   md5
hostnossl all       all         0.0.0.0/0   reject

# Specific network restrictions
hostssl myapp       app_users   10.0.0.0/8  md5
hostssl myapp       admins      192.168.1.0/24  cert

# Trust local admin connections (use carefully!)
local   all         postgres                trust

# LDAP authentication
hostssl all         employees   10.0.0.0/8  ldap ldapserver=ldap.company.com ldapbasedn="dc=company,dc=com"

# Kerberos authentication  
hostssl all         all         10.0.0.0/8  gss

# Certificate authentication
hostssl all         cert_users  0.0.0.0/0   cert

# Reject specific addresses
host    all         all         192.168.100.0/24 reject
```

#### Authentication Methods

#### Password Authentication (md5/scram-sha-256)
```bash
# Modern password authentication
hostssl all all 0.0.0.0/0 scram-sha-256

# Legacy md5 (less secure)  
hostssl all all 0.0.0.0/0 md5
```

```sql
-- Set password encryption method
SET password_encryption = 'scram-sha-256';

-- Create user with encrypted password
CREATE USER secure_user WITH PASSWORD 'strong_password123';

-- Change existing user password
ALTER USER existing_user WITH PASSWORD 'new_secure_password';
```

#### Certificate Authentication
```bash
# In pg_hba.conf
hostssl all cert_users 0.0.0.0/0 cert

# Certificate requirements:
# - Client must present valid certificate
# - Certificate must be signed by trusted CA
# - Certificate CN must match database username
```

```bash
# Generate certificates
# CA key and certificate
openssl genrsa -out ca.key 2048
openssl req -new -x509 -key ca.key -out ca.crt -days 365

# Server key and certificate
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -out server.crt -days 365

# Client key and certificate
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr -subj "/CN=dbuser"
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -out client.crt -days 365
```

#### LDAP Authentication
```bash
# Simple LDAP bind
hostssl all employees 10.0.0.0/8 ldap ldapserver=ldap.company.com ldapbasedn="dc=company,dc=com"

# LDAP with search+bind
hostssl all employees 10.0.0.0/8 ldap 
    ldapserver=ldap.company.com 
    ldapbasedn="dc=company,dc=com"
    ldapbinddn="cn=admin,dc=company,dc=com"
    ldapbindpasswd="admin_password"
    ldapsearchattribute="uid"
```

#### Kerberos Authentication
```bash
# In pg_hba.conf
hostssl all all 10.0.0.0/8 gss

# Kerberos configuration
# Requires proper Kerberos setup with KDC
# PostgreSQL service principal: postgres/hostname@REALM
```

#### Connection Security Monitoring
```sql
-- Monitor authentication failures
SELECT 
    usename,
    datname,
    client_addr,
    application_name,
    backend_start,
    state
FROM pg_stat_activity;

-- SSL connection monitoring
SELECT 
    datname,
    usename,
    ssl,
    ssl_version,
    ssl_cipher,
    client_addr
FROM pg_stat_ssl s
JOIN pg_stat_activity a USING (pid)
WHERE ssl IS NOT NULL;

-- Connection limits monitoring
SELECT 
    rolname,
    rolconnlimit,
    COUNT(*) as current_connections
FROM pg_roles r
LEFT JOIN pg_stat_activity a ON r.rolname = a.usename
WHERE rolconnlimit <> -1
GROUP BY rolname, rolconnlimit;
```

### 5. SQL Injection Prevention (Q327-329)

#### Understanding SQL Injection Vulnerabilities
```sql
-- VULNERABLE CODE (DO NOT USE)
-- Building queries with string concatenation
vulnerable_query = "SELECT * FROM users WHERE username = '" + user_input + "'";

-- What happens with malicious input:
-- user_input = "admin'; DROP TABLE users; --"
-- Results in: SELECT * FROM users WHERE username = 'admin'; DROP TABLE users; --'
```

#### Prepared Statements (Parameterized Queries)
Prepared statements are the primary defense against SQL injection by separating SQL code from data.

```sql
-- PostgreSQL prepared statement example
PREPARE user_lookup (TEXT) AS 
SELECT user_id, username, email FROM users WHERE username = $1;

EXECUTE user_lookup('john_doe');
EXECUTE user_lookup('admin'); -- Safe even with potential injection attempts

-- Deallocate when done
DEALLOCATE user_lookup;
```

#### Language-Specific Prepared Statement Examples

#### Python (psycopg2/psycopg3)
```python
import psycopg2

# SECURE: Using parameterized queries
def get_user_secure(username):
    conn = psycopg2.connect(database="myapp")
    cur = conn.cursor()
    
    # Safe - parameters are escaped automatically
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    return result

# VULNERABLE: String concatenation (NEVER DO THIS)
def get_user_vulnerable(username):
    conn = psycopg2.connect(database="myapp")
    cur = conn.cursor()
    
    # DANGEROUS - susceptible to SQL injection
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cur.execute(query)
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    return result

# Using named parameters
def update_user_secure(user_id, email, phone):
    conn = psycopg2.connect(database="myapp")
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE users 
        SET email = %(email)s, phone = %(phone)s 
        WHERE user_id = %(user_id)s
    """, {
        'user_id': user_id,
        'email': email, 
        'phone': phone
    })
    
    conn.commit()
    cur.close()
    conn.close()
```

#### Node.js (pg library)
```javascript
const { Pool } = require('pg');
const pool = new Pool();

// SECURE: Parameterized query
async function getUserSecure(username) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0];
    } finally {
        client.release();
    }
}

// SECURE: Named parameters with object
async function updateUserSecure(userId, userData) {
    const client = await pool.connect();
    try {
        await client.query(
            'UPDATE users SET email = $2, phone = $3 WHERE user_id = $1',
            [userId, userData.email, userData.phone]
        );
    } finally {
        client.release();
    }
}
```

#### Java (JDBC)
```java
// SECURE: PreparedStatement
public User getUserSecure(String username) throws SQLException {
    String sql = "SELECT * FROM users WHERE username = ?";
    
    try (Connection conn = dataSource.getConnection();
         PreparedStatement stmt = conn.prepareStatement(sql)) {
        
        stmt.setString(1, username);
        ResultSet rs = stmt.executeQuery();
        
        if (rs.next()) {
            return new User(rs.getInt("user_id"), 
                           rs.getString("username"), 
                           rs.getString("email"));
        }
        return null;
    }
}

// SECURE: CallableStatement for procedures
public void updateUserSecure(int userId, String email, String phone) throws SQLException {
    String sql = "{call update_user_info(?, ?, ?)}";
    
    try (Connection conn = dataSource.getConnection();
         CallableStatement stmt = conn.prepareCall(sql)) {
        
        stmt.setInt(1, userId);
        stmt.setString(2, email);
        stmt.setString(3, phone);
        stmt.execute();
    }
}
```

#### Additional SQL Injection Prevention Techniques

#### Input Validation and Sanitization
```python
def validate_username(username):
    # Allow only alphanumeric and underscore
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValueError("Invalid username format")
    
    # Length limits
    if len(username) < 3 or len(username) > 50:
        raise ValueError("Username must be 3-50 characters")
    
    return username

def get_user_with_validation(username):
    # Validate input first
    safe_username = validate_username(username)
    
    # Then use prepared statement
    conn = psycopg2.connect(database="myapp")
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (safe_username,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    return result
```

#### Escaping for Dynamic Query Building (Last Resort)
```python
# Only when parameterized queries aren't possible
# Use database-specific escaping functions

import psycopg2.extensions

def escape_sql_identifier(identifier):
    # For table/column names that must be dynamic
    return psycopg2.extensions.quote_ident(identifier, conn)

def escape_sql_literal(value):
    # For values (but parameterized queries preferred)
    return psycopg2.extensions.adapt(value)

# Example: Dynamic table name (use with extreme caution)
def get_data_from_table(table_name, user_id):
    # Validate table name against whitelist
    allowed_tables = ['users', 'orders', 'products']
    if table_name not in allowed_tables:
        raise ValueError("Invalid table name")
    
    # Escape identifier
    safe_table = escape_sql_identifier(table_name)
    
    # Use parameterized query for values
    query = f"SELECT * FROM {safe_table} WHERE user_id = %s"
    cur.execute(query, (user_id,))
    return cur.fetchall()
```

#### Stored Procedure Security
```sql
-- Use SECURITY DEFINER functions to encapsulate data access
CREATE OR REPLACE FUNCTION get_user_orders(p_user_id INTEGER)
RETURNS TABLE(order_id INTEGER, order_date DATE, total DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with function owner's privileges
AS $$
BEGIN
    -- Input validation within function
    IF p_user_id IS NULL OR p_user_id <= 0 THEN
        RAISE EXCEPTION 'Invalid user ID';
    END IF;
    
    RETURN QUERY
    SELECT o.order_id, o.order_date, o.total
    FROM orders o
    WHERE o.user_id = p_user_id
    AND o.status != 'deleted';
END;
$$;

-- Grant execute permission only
GRANT EXECUTE ON FUNCTION get_user_orders(INTEGER) TO application_role;
-- Don't grant direct table access
```

### 6. Password Encryption and SCRAM-SHA-256 (Q330-331)

#### Password Encryption Methods
```sql
-- Check current password encryption setting
SHOW password_encryption;

-- Set password encryption method (PostgreSQL 10+)
SET password_encryption = 'scram-sha-256';

-- For older versions or compatibility
SET password_encryption = 'md5';
```

#### SCRAM-SHA-256 Implementation
SCRAM-SHA-256 is the modern, secure password authentication method in PostgreSQL.

```sql
-- Enable SCRAM-SHA-256
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SELECT pg_reload_conf();

-- Create user with SCRAM-SHA-256 password
CREATE USER secure_app_user WITH PASSWORD 'VerySecureP@ssw0rd123!';

-- Verify password encryption method
SELECT rolname, rolpassword 
FROM pg_authid 
WHERE rolname = 'secure_app_user';
-- Password will start with 'SCRAM-SHA-256$'

-- Convert existing MD5 passwords to SCRAM-SHA-256
-- Users must reset their passwords
ALTER USER old_user WITH PASSWORD 'new_secure_password';
```

#### SCRAM-SHA-256 vs MD5 Comparison
| Feature | MD5 | SCRAM-SHA-256 |
|---------|-----|---------------|
| **Security** | Vulnerable to rainbow tables | Strong against attacks |
| **Salt** | Simple salt | Strong salting mechanism |
| **Iteration Count** | Single iteration | Configurable iterations (default 4096) |
| **Password Storage** | Hash stored on server | Verifier stored on server |
| **Network Security** | Vulnerable to replay attacks | Protected against replay |
| **FIPS Compliance** | No | Yes |

#### Password Policy Implementation
```sql
-- Create password validation function
CREATE OR REPLACE FUNCTION validate_password(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Length check
    IF LENGTH(password) < 12 THEN
        RAISE EXCEPTION 'Password must be at least 12 characters long';
    END IF;
    
    -- Complexity checks
    IF password !~ '[A-Z]' THEN
        RAISE EXCEPTION 'Password must contain uppercase letters';
    END IF;
    
    IF password !~ '[a-z]' THEN
        RAISE EXCEPTION 'Password must contain lowercase letters';
    END IF;
    
    IF password !~ '[0-9]' THEN
        RAISE EXCEPTION 'Password must contain numbers';
    END IF;
    
    IF password !~ '[^A-Za-z0-9]' THEN
        RAISE EXCEPTION 'Password must contain special characters';
    END IF;
    
    -- Common password check (simplified)
    IF LOWER(password) = ANY(ARRAY['password123', 'admin123', 'user123']) THEN
        RAISE EXCEPTION 'Password is too common';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Password change function with validation
CREATE OR REPLACE FUNCTION change_password(username TEXT, new_password TEXT)
RETURNS VOID AS $$
DECLARE
    validation_result BOOLEAN;
BEGIN
    -- Validate password
    SELECT validate_password(new_password) INTO validation_result;
    
    -- Change password if validation passes
    EXECUTE format('ALTER USER %I WITH PASSWORD %L', username, new_password);
    
    -- Log password change
    INSERT INTO password_changes (username, changed_at) VALUES (username, now());
    
    RAISE NOTICE 'Password changed successfully for user: %', username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7. Database Auditing (Q332-335)

#### pgaudit Extension
pgaudit provides detailed session and object audit logging for PostgreSQL.

```sql
-- Install pgaudit extension
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure pgaudit settings
-- In postgresql.conf:
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'all'  -- Log all statements
pgaudit.log_catalog = off  -- Don't log catalog queries
pgaudit.log_level = 'log'  -- Log level
pgaudit.log_parameter = on  -- Log statement parameters
pgaudit.log_relation = on  -- Log relation names
pgaudit.log_statement_once = off  -- Log each statement
```

#### pgaudit Configuration Options
```bash
# pgaudit.log options:
# - READ: SELECT, COPY TO
# - WRITE: INSERT, UPDATE, DELETE, TRUNCATE, COPY FROM
# - FUNCTION: Function calls and DO blocks
# - ROLE: Role and privilege statements
# - DDL: Data definition statements  
# - MISC: Miscellaneous statements (DISCARD, FETCH, etc.)
# - ALL: All statements

# Example configurations:
pgaudit.log = 'write, ddl'  # Only writes and DDL
pgaudit.log = 'read, write'  # Data access only
pgaudit.log = 'role'  # Only role management
```

#### Object-Level Auditing
```sql
-- Object-level auditing with pgaudit
-- Create audit role
CREATE ROLE audit_select;
CREATE ROLE audit_write;

-- Grant minimal privileges to audit roles
GRANT SELECT ON sensitive_table TO audit_select;
GRANT INSERT, UPDATE, DELETE ON sensitive_table TO audit_write;

-- Grant audit roles to users for auditing
GRANT audit_select TO user1;  -- Will audit SELECT statements
GRANT audit_write TO user2;   -- Will audit DML statements

-- Configure object auditing
SET pgaudit.role = 'audit_select, audit_write';
```

#### Query Logging Configuration
```bash
# In postgresql.conf - comprehensive query logging

# Log all statements
log_statement = 'all'  # Options: none, ddl, mod, all

# Log statement duration
log_duration = on

# Log statements longer than threshold
log_min_duration_statement = 1000  # 1 second in milliseconds

# Log successful connections
log_connections = on

# Log connection terminations
log_disconnections = on

# Include detailed timing
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Log lock waits
log_lock_waits = on

# Log checkpoints
log_checkpoints = on

# Log temporary files usage
log_temp_files = 0  # Log all temp files

# Log autovacuum activity
log_autovacuum_min_duration = 0
```

#### Custom Audit Logging System
```sql
-- Create audit table
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    schema_name TEXT,
    table_name TEXT,
    operation TEXT,
    old_values JSONB,
    new_values JSONB,
    user_name TEXT DEFAULT current_user,
    timestamp TIMESTAMPTZ DEFAULT now(),
    client_addr INET DEFAULT inet_client_addr(),
    application_name TEXT DEFAULT current_setting('application_name')
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (schema_name, table_name, operation, new_values)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (schema_name, table_name, operation, old_values, new_values)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (schema_name, table_name, operation, old_values)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER financial_data_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

#### Login Attempt Monitoring
```sql
-- Track login attempts (using log analysis or custom solution)
CREATE TABLE login_attempts (
    id BIGSERIAL PRIMARY KEY,
    username TEXT,
    client_addr INET,
    success BOOLEAN,
    attempt_time TIMESTAMPTZ DEFAULT now(),
    application_name TEXT
);

-- Function to log successful logins (called by application)
CREATE OR REPLACE FUNCTION log_successful_login()
RETURNS VOID AS $$
BEGIN
    INSERT INTO login_attempts (username, client_addr, success, application_name)
    VALUES (
        current_user,
        inet_client_addr(),
        true,
        current_setting('application_name')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Monitor suspicious login patterns
CREATE VIEW suspicious_login_activity AS
SELECT 
    username,
    client_addr,
    COUNT(*) as failed_attempts,
    MAX(attempt_time) as last_attempt
FROM login_attempts 
WHERE success = false 
    AND attempt_time > now() - interval '1 hour'
GROUP BY username, client_addr
HAVING COUNT(*) >= 5;
```

#### Superuser Access Monitoring
```sql
-- Monitor superuser activities
CREATE VIEW superuser_activity AS
SELECT 
    usename,
    datname,
    application_name,
    client_addr,
    backend_start,
    query_start,
    state_change,
    state,
    query
FROM pg_stat_activity
WHERE usename IN (
    SELECT rolname 
    FROM pg_roles 
    WHERE rolsuper = true
);

-- Log superuser privilege changes
CREATE TABLE privilege_changes (
    id BIGSERIAL PRIMARY KEY,
    grantor TEXT DEFAULT current_user,
    grantee TEXT,
    privilege_type TEXT,
    object_name TEXT,
    granted BOOLEAN,
    change_time TIMESTAMPTZ DEFAULT now()
);

-- Example trigger for role changes (would need to be implemented at application level)
-- Since PostgreSQL doesn't have DDL triggers for all operations
```

#### Compliance and Regulatory Considerations
```sql
-- GDPR/Data Privacy Audit Queries
-- Track personal data access
SELECT 
    user_name,
    operation,
    timestamp,
    table_name
FROM audit_log 
WHERE table_name IN ('users', 'customer_personal_data')
    AND timestamp >= now() - interval '30 days'
ORDER BY timestamp DESC;

-- SOX Compliance - Financial data access
SELECT 
    user_name,
    operation,
    old_values,
    new_values,
    timestamp
FROM audit_log 
WHERE table_name IN ('financial_transactions', 'accounting_entries')
    AND operation IN ('UPDATE', 'DELETE')
ORDER BY timestamp DESC;

-- PCI DSS - Payment card data access
-- (Should be heavily restricted and logged)
CREATE TABLE pci_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_name TEXT,
    action TEXT,
    cardholder_data_accessed BOOLEAN,
    timestamp TIMESTAMPTZ DEFAULT now(),
    client_addr INET,
    application_name TEXT
);
```

## Study Plan Recommendations

### Phase 1: Authentication and Authorization (Days 1-5)
- Master roles and users concepts
- Learn privilege granting and revoking
- Practice principle of least privilege
- Study pg_hba.conf configuration

### Phase 2: Advanced Security Features (Days 6-10)
- Implement Row-Level Security policies
- Configure SSL/TLS connections
- Practice certificate authentication
- Learn LDAP/Kerberos integration

### Phase 3: Application Security (Days 11-13)
- Master SQL injection prevention
- Practice prepared statements in multiple languages
- Study SCRAM-SHA-256 implementation
- Implement password policies

### Phase 4: Monitoring and Auditing (Days 14-15)
- Configure pgaudit extension
- Set up comprehensive logging
- Create custom audit systems
- Practice compliance reporting

## Key Security Best Practices

### 1. **Defense in Depth**
- Multiple layers of security controls
- Network, application, and database level protection
- Regular security assessments and updates

### 2. **Principle of Least Privilege**  
- Grant minimum necessary permissions
- Regular permission reviews and cleanup
- Role-based access control implementation

### 3. **Secure Development Practices**
- Always use parameterized queries
- Input validation and sanitization
- Secure password policies and encryption

### 4. **Monitoring and Auditing**
- Comprehensive logging and monitoring
- Regular audit log reviews
- Automated alerting for suspicious activities

### 5. **Regular Maintenance**
- Keep PostgreSQL updated
- Regular security patch application
- Password policy enforcement and rotation

This comprehensive security knowledge foundation will enable you to confidently answer all PostgreSQL security questions (Q306-335) in technical interviews, demonstrating both theoretical understanding and practical implementation skills.