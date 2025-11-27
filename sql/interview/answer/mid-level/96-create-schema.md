# 96. How do you create a schema?

## Definition

Creating a schema in PostgreSQL involves defining a logical namespace to organize database objects. Schemas provide separation, security, and organization for tables, views, functions, and other database objects.

## Basic Schema Creation Syntax

### Simple Schema Creation

```sql
-- Basic schema creation
CREATE SCHEMA schema_name;

-- Create schema only if it doesn't exist
CREATE SCHEMA IF NOT EXISTS schema_name;
```

### Schema with Authorization

```sql
-- Create schema with specific owner
CREATE SCHEMA schema_name AUTHORIZATION username;

-- Create schema with current user as owner
CREATE SCHEMA schema_name AUTHORIZATION CURRENT_USER;

-- Create schema named after the user
CREATE SCHEMA AUTHORIZATION username; -- Schema name = username
```

### Schema with Objects

```sql
-- Create schema and objects in one statement
CREATE SCHEMA sales
    CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE
    )
    CREATE VIEW active_customers AS
        SELECT * FROM customers WHERE active = true
    CREATE INDEX idx_customers_email ON customers(email);
```

## Complete Examples

### Example 1: E-commerce Application Schemas

```sql
-- Create main application schemas
CREATE SCHEMA IF NOT EXISTS catalog AUTHORIZATION app_user;
CREATE SCHEMA IF NOT EXISTS inventory AUTHORIZATION app_user;
CREATE SCHEMA IF NOT EXISTS orders AUTHORIZATION app_user;
CREATE SCHEMA IF NOT EXISTS users AUTHORIZATION app_user;

-- Catalog schema objects
CREATE TABLE catalog.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE catalog.products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES catalog.categories(id),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory schema objects
CREATE TABLE inventory.stock (
    product_id INT PRIMARY KEY, -- References catalog.products(id)
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory.stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL, -- References catalog.products(id)
    movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INT NOT NULL,
    reference_type VARCHAR(50), -- 'purchase', 'sale', 'return', 'adjustment'
    reference_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders schema objects
CREATE TABLE orders.orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL, -- References users.users(id)
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders.order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders.orders(id),
    product_id INT NOT NULL, -- References catalog.products(id)
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Users schema objects
CREATE TABLE users.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users.user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users.users(id),
    address_type VARCHAR(20) NOT NULL, -- 'billing', 'shipping'
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    is_default BOOLEAN DEFAULT FALSE
);
```

### Example 2: Multi-Tenant Application

```sql
-- Function to create tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_name TEXT)
RETURNS void AS $$
DECLARE
    schema_name TEXT;
    tenant_role TEXT;
BEGIN
    -- Validate tenant name
    IF tenant_name IS NULL OR length(trim(tenant_name)) = 0 THEN
        RAISE EXCEPTION 'Tenant name cannot be empty';
    END IF;
    
    schema_name := 'tenant_' || lower(regexp_replace(tenant_name, '[^a-zA-Z0-9]', '', 'g'));
    tenant_role := schema_name || '_role';
    
    -- Create role for the tenant
    EXECUTE format('CREATE ROLE %I', tenant_role);
    
    -- Create schema owned by the tenant role
    EXECUTE format('CREATE SCHEMA %I AUTHORIZATION %I', schema_name, tenant_role);
    
    -- Create standard tables for the tenant
    EXECUTE format('
        CREATE TABLE %I.users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            full_name VARCHAR(100),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )', schema_name);
    
    EXECUTE format('
        CREATE TABLE %I.projects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            owner_id INT REFERENCES %I.users(id),
            status VARCHAR(20) DEFAULT ''active'',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )', schema_name, schema_name);
    
    EXECUTE format('
        CREATE TABLE %I.tasks (
            id SERIAL PRIMARY KEY,
            project_id INT REFERENCES %I.projects(id),
            title VARCHAR(200) NOT NULL,
            description TEXT,
            assigned_to INT REFERENCES %I.users(id),
            status VARCHAR(20) DEFAULT ''open'',
            priority VARCHAR(10) DEFAULT ''medium'',
            due_date DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )', schema_name, schema_name, schema_name);
    
    -- Create indexes
    EXECUTE format('CREATE INDEX idx_%s_users_email ON %I.users(email)', 
                   replace(schema_name, 'tenant_', ''), schema_name);
    EXECUTE format('CREATE INDEX idx_%s_projects_owner ON %I.projects(owner_id)', 
                   replace(schema_name, 'tenant_', ''), schema_name);
    EXECUTE format('CREATE INDEX idx_%s_tasks_project ON %I.tasks(project_id)', 
                   replace(schema_name, 'tenant_', ''), schema_name);
    EXECUTE format('CREATE INDEX idx_%s_tasks_assigned ON %I.tasks(assigned_to)', 
                   replace(schema_name, 'tenant_', ''), schema_name);
    
    -- Grant permissions
    EXECUTE format('GRANT ALL ON SCHEMA %I TO %I', schema_name, tenant_role);
    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO %I', schema_name, tenant_role);
    EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO %I', schema_name, tenant_role);
    
    -- Set default privileges for future objects
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO %I', 
                   schema_name, tenant_role);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO %I', 
                   schema_name, tenant_role);
    
    -- Insert tenant metadata
    INSERT INTO public.tenant_metadata (tenant_name, schema_name, role_name, created_at)
    VALUES (tenant_name, schema_name, tenant_role, NOW());
    
    RAISE NOTICE 'Created tenant schema: % with role: %', schema_name, tenant_role;
END;
$$ LANGUAGE plpgsql;

-- Create metadata table to track tenants
CREATE TABLE IF NOT EXISTS public.tenant_metadata (
    id SERIAL PRIMARY KEY,
    tenant_name VARCHAR(100) NOT NULL,
    schema_name VARCHAR(100) UNIQUE NOT NULL,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Usage
SELECT create_tenant_schema('Acme Corporation');
SELECT create_tenant_schema('XYZ Company');

-- List all tenant schemas
SELECT tenant_name, schema_name, role_name, created_at
FROM public.tenant_metadata
WHERE is_active = TRUE
ORDER BY created_at;
```

### Example 3: Environment-Specific Schemas

```sql
-- Development environment setup
CREATE SCHEMA IF NOT EXISTS dev AUTHORIZATION dev_user;
CREATE SCHEMA IF NOT EXISTS dev_testing AUTHORIZATION dev_user;

-- Staging environment setup
CREATE SCHEMA IF NOT EXISTS staging AUTHORIZATION staging_user;

-- Production environment setup
CREATE SCHEMA IF NOT EXISTS prod AUTHORIZATION prod_user;

-- Create environment-specific configuration
CREATE TABLE dev.app_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE staging.app_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prod.app_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert environment-specific configurations
INSERT INTO dev.app_config (key, value, description) VALUES
    ('debug_mode', 'true', 'Enable debug logging'),
    ('api_base_url', 'http://localhost:3000', 'Development API URL'),
    ('db_pool_size', '5', 'Development database pool size'),
    ('cache_ttl_seconds', '60', 'Short cache TTL for development');

INSERT INTO staging.app_config (key, value, description) VALUES
    ('debug_mode', 'false', 'Disable debug logging'),
    ('api_base_url', 'https://staging-api.example.com', 'Staging API URL'),
    ('db_pool_size', '10', 'Staging database pool size'),
    ('cache_ttl_seconds', '300', 'Medium cache TTL for staging');

INSERT INTO prod.app_config (key, value, description) VALUES
    ('debug_mode', 'false', 'Disable debug logging'),
    ('api_base_url', 'https://api.example.com', 'Production API URL'),
    ('db_pool_size', '20', 'Production database pool size'),
    ('cache_ttl_seconds', '3600', 'Long cache TTL for production');

-- Function to get configuration by environment
CREATE OR REPLACE FUNCTION get_config_value(env_name TEXT, config_key TEXT)
RETURNS TEXT AS $$
DECLARE
    config_value TEXT;
BEGIN
    EXECUTE format('SELECT value FROM %I.app_config WHERE key = $1', env_name)
    INTO config_value USING config_key;
    
    RETURN config_value;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT get_config_value('dev', 'api_base_url');
SELECT get_config_value('prod', 'db_pool_size');
```

### Example 4: Feature-Based Schema Organization

```sql
-- Authentication and authorization schema
CREATE SCHEMA auth AUTHORIZATION app_admin;

CREATE TABLE auth.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE auth.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE auth.user_roles (
    user_id INT REFERENCES auth.users(id),
    role_id INT REFERENCES auth.roles(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by INT REFERENCES auth.users(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE auth.permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE auth.role_permissions (
    role_id INT REFERENCES auth.roles(id),
    permission_id INT REFERENCES auth.permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

-- Audit and logging schema
CREATE SCHEMA audit AUTHORIZATION app_admin;

CREATE TABLE audit.user_actions (
    id SERIAL PRIMARY KEY,
    user_id INT, -- May be NULL for system actions
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit.data_changes (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    row_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by INT REFERENCES auth.users(id),
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Notifications schema
CREATE SCHEMA notifications AUTHORIZATION app_admin;

CREATE TABLE notifications.notification_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    template_subject TEXT NOT NULL,
    template_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE notifications.user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES auth.users(id),
    notification_type_id INT REFERENCES notifications.notification_types(id),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reporting schema
CREATE SCHEMA reporting AUTHORIZATION app_admin;

CREATE MATERIALIZED VIEW reporting.user_activity_summary AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(DISTINCT ua.id) as action_count,
    MAX(ua.created_at) as last_activity,
    COUNT(DISTINCT CASE WHEN ua.created_at >= NOW() - INTERVAL '7 days' THEN ua.id END) as weekly_actions,
    COUNT(DISTINCT CASE WHEN ua.created_at >= NOW() - INTERVAL '30 days' THEN ua.id END) as monthly_actions
FROM auth.users u
LEFT JOIN audit.user_actions ua ON u.id = ua.user_id
GROUP BY u.id, u.username, u.email;

CREATE UNIQUE INDEX reporting_user_activity_summary_user_id_idx 
ON reporting.user_activity_summary(id);
```

## Schema Creation Best Practices

### 1. Naming Conventions

```sql
-- Good naming practices
CREATE SCHEMA user_management;        -- Clear, descriptive
CREATE SCHEMA financial_reporting;    -- Descriptive with context
CREATE SCHEMA api_v2;                 -- Version indication

-- Avoid these
CREATE SCHEMA um;                     -- Too abbreviated
CREATE SCHEMA "User-Management";      -- Special characters requiring quotes
CREATE SCHEMA userManagement;         -- CamelCase (prefer snake_case)
```

### 2. Permission Management

```sql
-- Create schema with proper permissions
CREATE SCHEMA sales AUTHORIZATION sales_admin;

-- Revoke default public access
REVOKE ALL ON SCHEMA sales FROM PUBLIC;

-- Grant specific access
GRANT USAGE ON SCHEMA sales TO sales_read_only;
GRANT USAGE, CREATE ON SCHEMA sales TO sales_user;
GRANT ALL ON SCHEMA sales TO sales_admin;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA sales 
GRANT SELECT ON TABLES TO sales_read_only;

ALTER DEFAULT PRIVILEGES IN SCHEMA sales 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sales_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA sales 
GRANT ALL ON TABLES TO sales_admin;
```

### 3. Schema Documentation

```sql
-- Document schema purpose and usage
COMMENT ON SCHEMA user_management IS 
'Contains all user-related tables, functions, and views. 
Includes authentication, authorization, and user profile management.
Owner: User Management Team
Contact: user-team@company.com';

COMMENT ON SCHEMA financial_reporting IS 
'Financial reports and materialized views for business intelligence.
Refreshed nightly at 2 AM UTC.
Contains sensitive financial data - restricted access required.';
```

### 4. Schema Initialization Scripts

```sql
-- Schema creation with initialization
CREATE OR REPLACE FUNCTION initialize_application_schemas()
RETURNS void AS $$
BEGIN
    -- Create schemas
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS catalog;
    CREATE SCHEMA IF NOT EXISTS orders;
    CREATE SCHEMA IF NOT EXISTS audit;
    CREATE SCHEMA IF NOT EXISTS reporting;
    
    -- Set up permissions
    REVOKE ALL ON SCHEMA auth, catalog, orders, audit, reporting FROM PUBLIC;
    
    -- Create roles if they don't exist
    DO $role_creation$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
            CREATE ROLE app_admin;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
            CREATE ROLE app_user;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_readonly') THEN
            CREATE ROLE app_readonly;
        END IF;
    END $role_creation$;
    
    -- Grant permissions
    GRANT ALL ON SCHEMA auth, catalog, orders, audit, reporting TO app_admin;
    GRANT USAGE, CREATE ON SCHEMA catalog, orders TO app_user;
    GRANT USAGE ON SCHEMA auth, reporting TO app_user;
    GRANT USAGE ON SCHEMA auth, catalog, orders, reporting TO app_readonly;
    
    RAISE NOTICE 'Application schemas initialized successfully';
END;
$$ LANGUAGE plpgsql;

-- Run initialization
SELECT initialize_application_schemas();
```

## Common Patterns and Use Cases

### 1. Schema Templates

```sql
-- Template for creating standardized schemas
CREATE OR REPLACE FUNCTION create_module_schema(
    module_name TEXT,
    owner_role TEXT DEFAULT 'app_admin'
)
RETURNS void AS $$
DECLARE
    schema_name TEXT;
BEGIN
    schema_name := lower(module_name);
    
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I AUTHORIZATION %I', 
                   schema_name, owner_role);
    
    -- Create standard tables
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.entities (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            metadata JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )', schema_name);
    
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.entity_relationships (
            id SERIAL PRIMARY KEY,
            parent_id INT REFERENCES %I.entities(id),
            child_id INT REFERENCES %I.entities(id),
            relationship_type VARCHAR(50) NOT NULL,
            properties JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        )', schema_name, schema_name, schema_name);
    
    -- Add indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_entities_name ON %I.entities(name)', 
                   schema_name, schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_entities_active ON %I.entities(is_active)', 
                   schema_name, schema_name);
    
    RAISE NOTICE 'Module schema % created successfully', schema_name;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT create_module_schema('inventory');
SELECT create_module_schema('billing');
SELECT create_module_schema('notifications');
```

### 2. Schema Migration Management

```sql
-- Schema version tracking
CREATE SCHEMA IF NOT EXISTS migrations;

CREATE TABLE migrations.schema_versions (
    schema_name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW(),
    applied_by VARCHAR(100) DEFAULT current_user,
    PRIMARY KEY (schema_name, version)
);

-- Migration function
CREATE OR REPLACE FUNCTION apply_schema_migration(
    target_schema TEXT,
    migration_version TEXT,
    migration_description TEXT,
    migration_sql TEXT
)
RETURNS void AS $$
BEGIN
    -- Check if migration already applied
    IF EXISTS (
        SELECT 1 FROM migrations.schema_versions 
        WHERE schema_name = target_schema AND version = migration_version
    ) THEN
        RAISE NOTICE 'Migration % for schema % already applied', 
                     migration_version, target_schema;
        RETURN;
    END IF;
    
    -- Execute migration
    EXECUTE migration_sql;
    
    -- Record migration
    INSERT INTO migrations.schema_versions (schema_name, version, description)
    VALUES (target_schema, migration_version, migration_description);
    
    RAISE NOTICE 'Applied migration % to schema %', migration_version, target_schema;
END;
$$ LANGUAGE plpgsql;

-- Example migration
SELECT apply_schema_migration(
    'catalog',
    '1.1.0',
    'Add product variants table',
    '
    CREATE TABLE catalog.product_variants (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES catalog.products(id),
        variant_name VARCHAR(100) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        price DECIMAL(10,2),
        stock_quantity INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX idx_product_variants_product_id ON catalog.product_variants(product_id);
    '
);
```

### 3. Cross-Schema Views and Functions

```sql
-- Global views that span multiple schemas
CREATE VIEW public.order_summary AS
SELECT 
    o.id as order_id,
    o.order_number,
    u.username,
    u.email,
    p.name as product_name,
    p.sku,
    oi.quantity,
    oi.unit_price,
    o.created_at
FROM orders.orders o
JOIN users.users u ON o.user_id = u.id
JOIN orders.order_items oi ON o.id = oi.order_id
JOIN catalog.products p ON oi.product_id = p.id;

-- Cross-schema utility functions
CREATE OR REPLACE FUNCTION public.get_user_order_count(user_email TEXT)
RETURNS INTEGER AS $$
DECLARE
    order_count INTEGER;
    user_id_val INTEGER;
BEGIN
    SELECT id INTO user_id_val FROM users.users WHERE email = user_email;
    
    IF user_id_val IS NULL THEN
        RETURN 0;
    END IF;
    
    SELECT COUNT(*) INTO order_count 
    FROM orders.orders 
    WHERE user_id = user_id_val;
    
    RETURN order_count;
END;
$$ LANGUAGE plpgsql;
```

## Schema Management Commands

### Listing and Inspecting Schemas

```sql
-- List all schemas
\dn

-- List schemas with additional information
SELECT 
    nspname AS schema_name,
    pg_get_userbyid(nspowner) AS owner,
    nspacl AS permissions
FROM pg_namespace
WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'
ORDER BY nspname;

-- Get schema size
SELECT 
    schemaname,
    pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) AS size
FROM pg_tables
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
GROUP BY schemaname
ORDER BY SUM(pg_total_relation_size(schemaname||'.'||tablename)) DESC;

-- List objects in a schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'catalog'
ORDER BY table_type, table_name;
```

### Dropping Schemas

```sql
-- Drop empty schema
DROP SCHEMA IF EXISTS temp_schema;

-- Drop schema with all objects
DROP SCHEMA IF EXISTS old_schema CASCADE;

-- Safe schema dropping with checks
CREATE OR REPLACE FUNCTION safe_drop_schema(schema_name TEXT)
RETURNS void AS $$
DECLARE
    object_count INTEGER;
BEGIN
    -- Count objects in schema
    SELECT COUNT(*) INTO object_count
    FROM information_schema.tables
    WHERE table_schema = schema_name;
    
    IF object_count > 0 THEN
        RAISE EXCEPTION 'Schema % contains % objects. Use CASCADE to force drop.', 
                        schema_name, object_count;
    END IF;
    
    EXECUTE format('DROP SCHEMA IF EXISTS %I', schema_name);
    RAISE NOTICE 'Schema % dropped successfully', schema_name;
END;
$$ LANGUAGE plpgsql;
```

## Summary

Creating schemas in PostgreSQL involves:

1. **Basic Syntax**: `CREATE SCHEMA schema_name [AUTHORIZATION owner]`
2. **Best Practices**: Use descriptive names, proper permissions, documentation
3. **Common Patterns**: Multi-tenancy, environment separation, feature organization
4. **Management**: Version tracking, migration scripts, monitoring
5. **Security**: Role-based access control, default privileges
6. **Organization**: Logical grouping of related objects

Schemas are essential for organizing complex PostgreSQL databases and providing security boundaries and namespace separation.