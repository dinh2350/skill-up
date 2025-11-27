# 95. What is a database schema?

## Definition

A database schema is a logical container and namespace that organizes database objects (tables, views, functions, indexes, etc.) within a PostgreSQL database. It provides a way to group related objects together and control access permissions at a higher level than individual objects.

Think of schemas as folders or directories in a file system - they help organize and separate different parts of your database.

## Basic Concepts

### Schema as Namespace

```sql
-- Different schemas can have tables with the same name
CREATE SCHEMA sales;
CREATE SCHEMA marketing;

-- Both schemas can have a 'customers' table
CREATE TABLE sales.customers (id INT, name VARCHAR(100));
CREATE TABLE marketing.customers (id INT, email VARCHAR(100));

-- Query specific schema
SELECT * FROM sales.customers;
SELECT * FROM marketing.customers;
```

### Default Schema: public

Every PostgreSQL database has a default schema called `public`:

```sql
-- These are equivalent
CREATE TABLE customers (id INT, name VARCHAR(100));
CREATE TABLE public.customers (id INT, name VARCHAR(100));

-- These queries are also equivalent
SELECT * FROM customers;
SELECT * FROM public.customers;
```

## Creating and Managing Schemas

### Create Schema

```sql
-- Basic schema creation
CREATE SCHEMA hr;

-- Create schema with specific owner
CREATE SCHEMA hr AUTHORIZATION hr_user;

-- Create schema only if it doesn't exist
CREATE SCHEMA IF NOT EXISTS hr;

-- Create schema with default permissions
CREATE SCHEMA hr
    CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100))
    CREATE VIEW active_employees AS SELECT * FROM employees WHERE active = true;
```

### List Schemas

```sql
-- List all schemas
SELECT schema_name 
FROM information_schema.schemata 
ORDER BY schema_name;

-- List schemas with additional info
SELECT 
    nspname AS schema_name,
    pg_get_userbyid(nspowner) AS owner
FROM pg_namespace
WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY nspname;
```

### Drop Schema

```sql
-- Drop empty schema
DROP SCHEMA hr;

-- Drop schema with all objects (CASCADE)
DROP SCHEMA hr CASCADE;

-- Drop schema only if it exists
DROP SCHEMA IF EXISTS hr CASCADE;
```

## Search Path

The search path determines which schemas PostgreSQL searches when you don't specify a schema name explicitly.

### View Current Search Path

```sql
-- Show current search path
SHOW search_path;
-- Default output: "$user", public

-- View as a query
SELECT current_setting('search_path');
```

### Modify Search Path

```sql
-- Add schema to search path
SET search_path = hr, public;

-- Set for current session
SET search_path = sales, marketing, public;

-- Set permanently for a user
ALTER USER sales_user SET search_path = sales, public;

-- Set for a database
ALTER DATABASE mydb SET search_path = hr, sales, public;

-- Reset to default
RESET search_path;
```

### Search Path Example

```sql
-- Create schemas and tables
CREATE SCHEMA app;
CREATE SCHEMA config;

CREATE TABLE app.users (id INT, name VARCHAR(100));
CREATE TABLE config.users (id INT, setting VARCHAR(100));
CREATE TABLE public.users (id INT, email VARCHAR(100));

-- Set search path
SET search_path = app, config, public;

-- This queries app.users (first in search path)
SELECT * FROM users;

-- Explicitly specify schema
SELECT * FROM config.users;
SELECT * FROM public.users;
```

## Practical Examples

### Example 1: Multi-Tenant Application

```sql
-- Create schemas for different tenants
CREATE SCHEMA tenant_acme;
CREATE SCHEMA tenant_xyz;

-- Each tenant has their own tables
CREATE TABLE tenant_acme.customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tenant_xyz.customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Function to switch tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_name TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('SET search_path = tenant_%s, public', tenant_name);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT set_tenant_context('acme');
INSERT INTO customers (name) VALUES ('John Doe'); -- Goes to tenant_acme.customers

SELECT set_tenant_context('xyz');
INSERT INTO customers (name) VALUES ('Jane Smith'); -- Goes to tenant_xyz.customers
```

### Example 2: Environment Separation

```sql
-- Separate schemas for different environments
CREATE SCHEMA dev;
CREATE SCHEMA staging;
CREATE SCHEMA prod;

-- Development tables
CREATE TABLE dev.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    price DECIMAL(10,2),
    test_flag BOOLEAN DEFAULT true  -- Development-specific column
);

-- Production tables (cleaner structure)
CREATE TABLE prod.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0)
);

-- Environment-specific configurations
CREATE TABLE dev.config (key VARCHAR(50), value TEXT);
CREATE TABLE prod.config (key VARCHAR(50), value TEXT);

INSERT INTO dev.config VALUES ('debug_mode', 'true');
INSERT INTO prod.config VALUES ('debug_mode', 'false');
```

### Example 3: Feature-Based Organization

```sql
-- Organize by business domains/features
CREATE SCHEMA user_management;
CREATE SCHEMA inventory;
CREATE SCHEMA billing;
CREATE SCHEMA reporting;

-- User management schema
CREATE TABLE user_management.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_management.user_roles (
    user_id INT REFERENCES user_management.users(id),
    role_name VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP DEFAULT NOW()
);

-- Inventory schema
CREATE TABLE inventory.products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    stock_quantity INT DEFAULT 0
);

CREATE TABLE inventory.stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES inventory.products(id),
    movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INT NOT NULL,
    movement_date TIMESTAMP DEFAULT NOW()
);

-- Billing schema
CREATE TABLE billing.invoices (
    id SERIAL PRIMARY KEY,
    user_id INT, -- Reference to user_management.users.id
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cross-schema views in reporting
CREATE VIEW reporting.user_invoice_summary AS
SELECT 
    u.username,
    u.email,
    COUNT(i.id) AS invoice_count,
    COALESCE(SUM(i.total_amount), 0) AS total_billed
FROM user_management.users u
LEFT JOIN billing.invoices i ON u.id = i.user_id
GROUP BY u.id, u.username, u.email;
```

### Example 4: Version Control / Schema Migrations

```sql
-- Schema versioning approach
CREATE SCHEMA app_v1;
CREATE SCHEMA app_v2;

-- Version 1 tables
CREATE TABLE app_v1.customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100), -- Single name field
    email VARCHAR(100)
);

-- Version 2 tables (improved structure)
CREATE TABLE app_v2.customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50), -- Split name fields
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration function
CREATE OR REPLACE FUNCTION migrate_customers_v1_to_v2()
RETURNS void AS $$
BEGIN
    INSERT INTO app_v2.customers (first_name, last_name, email)
    SELECT 
        SPLIT_PART(full_name, ' ', 1) AS first_name,
        SPLIT_PART(full_name, ' ', 2) AS last_name,
        email
    FROM app_v1.customers
    WHERE email IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
```

## Permissions and Security

### Schema-Level Permissions

```sql
-- Create users/roles
CREATE ROLE hr_admin;
CREATE ROLE hr_read_only;
CREATE ROLE sales_team;

-- Grant schema permissions
GRANT ALL ON SCHEMA hr TO hr_admin;
GRANT USAGE ON SCHEMA hr TO hr_read_only;
GRANT USAGE, CREATE ON SCHEMA sales TO sales_team;

-- Grant table permissions within schema
GRANT ALL ON ALL TABLES IN SCHEMA hr TO hr_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA hr TO hr_read_only;

-- Grant permissions on future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA hr 
GRANT ALL ON TABLES TO hr_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA hr 
GRANT SELECT ON TABLES TO hr_read_only;
```

### Row-Level Security with Schemas

```sql
CREATE SCHEMA company_a;
CREATE SCHEMA company_b;

-- Create identical table structure in both schemas
CREATE TABLE company_a.documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    content TEXT,
    created_by VARCHAR(50)
);

CREATE TABLE company_b.documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    content TEXT,
    created_by VARCHAR(50)
);

-- Create users for each company
CREATE ROLE company_a_user;
CREATE ROLE company_b_user;

-- Grant access only to respective schemas
GRANT USAGE ON SCHEMA company_a TO company_a_user;
GRANT USAGE ON SCHEMA company_b TO company_b_user;

GRANT ALL ON ALL TABLES IN SCHEMA company_a TO company_a_user;
GRANT ALL ON ALL TABLES IN SCHEMA company_b TO company_b_user;
```

## Advanced Schema Patterns

### Dynamic Schema Creation

```sql
-- Function to create tenant schema dynamically
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_name TEXT)
RETURNS void AS $$
DECLARE
    schema_name TEXT;
BEGIN
    schema_name := 'tenant_' || lower(tenant_name);
    
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Create standard tables
    EXECUTE format('
        CREATE TABLE %I.users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )', schema_name);
        
    EXECUTE format('
        CREATE TABLE %I.settings (
            key VARCHAR(50) PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP DEFAULT NOW()
        )', schema_name);
        
    -- Insert default settings
    EXECUTE format('
        INSERT INTO %I.settings (key, value) VALUES 
        (''tenant_name'', %L),
        (''created_at'', %L)
    ', schema_name, tenant_name, NOW());
    
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT create_tenant_schema('NewClient');
```

### Schema Information Functions

```sql
-- Function to get all tables in a schema
CREATE OR REPLACE FUNCTION get_schema_tables(schema_name TEXT)
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.table_name::TEXT
    FROM information_schema.tables t
    WHERE t.table_schema = schema_name
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get schema size
CREATE OR REPLACE FUNCTION get_schema_size(schema_name TEXT)
RETURNS TEXT AS $$
DECLARE
    total_size BIGINT := 0;
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = schema_name
    LOOP
        SELECT total_size + pg_total_relation_size(quote_ident(rec.schemaname) || '.' || quote_ident(rec.tablename))
        INTO total_size;
    END LOOP;
    
    RETURN pg_size_pretty(total_size);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT get_schema_size('public');
SELECT * FROM get_schema_tables('hr');
```

## Best Practices

### 1. Naming Conventions

```sql
-- Use clear, descriptive schema names
CREATE SCHEMA user_management;    -- ✅ Good
CREATE SCHEMA um;                 -- ❌ Too abbreviated

-- Use consistent naming patterns
CREATE SCHEMA sales_reporting;
CREATE SCHEMA inventory_management;
CREATE SCHEMA billing_system;
```

### 2. Organize by Business Domain

```sql
-- Group related functionality
CREATE SCHEMA authentication;  -- Users, roles, permissions
CREATE SCHEMA catalog;         -- Products, categories
CREATE SCHEMA orders;          -- Orders, payments, shipping
CREATE SCHEMA analytics;       -- Reports, dashboards
```

### 3. Security Best Practices

```sql
-- Revoke public access from new schemas
CREATE SCHEMA sensitive_data;
REVOKE ALL ON SCHEMA sensitive_data FROM PUBLIC;

-- Grant minimal necessary permissions
GRANT USAGE ON SCHEMA sensitive_data TO data_analyst;
GRANT SELECT ON ALL TABLES IN SCHEMA sensitive_data TO data_analyst;
```

### 4. Avoid Schema-Specific Code

```sql
-- ❌ Bad: Hard-coded schema names in application code
SELECT * FROM sales.customers WHERE id = 1;

-- ✅ Good: Use search_path and unqualified names
SET search_path = sales, public;
SELECT * FROM customers WHERE id = 1;
```

### 5. Documentation and Migration

```sql
-- Document schema purpose
COMMENT ON SCHEMA user_management IS 
'Contains all user-related tables, functions, and views for authentication and authorization';

-- Version your schema changes
CREATE SCHEMA migration_log;

CREATE TABLE migration_log.applied_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(100) NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW(),
    applied_by VARCHAR(50) DEFAULT current_user
);
```

## Common Use Cases

1. **Multi-tenancy**: Separate schemas per tenant/client
2. **Environment separation**: dev, staging, prod schemas
3. **Feature organization**: Group related tables by business domain
4. **Security isolation**: Sensitive data in restricted schemas
5. **Version management**: Different schema versions during migrations
6. **Third-party integration**: Separate schemas for external data
7. **Testing**: Test schemas that can be easily created/dropped

## Limitations and Considerations

- Cross-schema foreign keys require explicit schema qualification
- Some tools may have limited schema support
- Backup/restore operations may need schema-specific handling
- Complex search paths can make debugging difficult
- Schema-level permissions need careful management

## Summary

Database schemas in PostgreSQL are:
- **Logical containers** for organizing database objects
- **Namespaces** that allow objects with same names in different schemas
- **Security boundaries** with granular permission control
- **Organizational tools** for multi-tenant applications, environment separation, and feature grouping
- **Accessed** via qualified names (`schema.object`) or search_path configuration

Schemas provide a powerful way to organize, secure, and manage database objects in complex applications.