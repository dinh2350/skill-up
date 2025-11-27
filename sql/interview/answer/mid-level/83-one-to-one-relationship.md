# 83. What is a one-to-one relationship?

## Definition

A **one-to-one (1:1) relationship** is a database relationship where one record in a table is associated with exactly one record in another table, and vice versa. Each row in Table A can have at most one matching row in Table B, and each row in Table B can have at most one matching row in Table A.

## Characteristics

- **Bidirectional uniqueness**: Both sides of the relationship have unique constraints
- **Optional or mandatory**: Can be required (NOT NULL) or optional (NULL allowed)
- **Less common**: One-to-one relationships are less common than one-to-many relationships
- **Often indicates**: Data that could be in the same table but is separated for specific reasons

## Visual Representation

```
┌─────────────┐         ┌─────────────┐
│   Table A   │         │   Table B   │
├─────────────┤         ├─────────────┤
│ id (PK)     │────1:1──│ id (PK)     │
│ ...         │         │ a_id (FK,UK)│
└─────────────┘         │ ...         │
                        └─────────────┘

PK = Primary Key
FK = Foreign Key
UK = Unique Key
```

## Basic Implementation

### Method 1: Foreign Key with UNIQUE Constraint

The most common approach is to add a foreign key with a unique constraint on one table.

```sql
-- Primary table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Related table with 1:1 relationship
CREATE TABLE user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,  -- UNIQUE constraint enforces 1:1
    bio TEXT,
    avatar_url VARCHAR(255),
    date_of_birth DATE,
    phone_number VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### Method 2: Shared Primary Key

Both tables use the same primary key value.

```sql
-- Primary table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Related table using same primary key
CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,  -- Same value as users.user_id
    bio TEXT,
    avatar_url VARCHAR(255),
    date_of_birth DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

## Common Use Cases

### 1. Separating Sensitive Data

Keep sensitive information in a separate table for security and access control.

```sql
-- Public user information
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sensitive authentication data
CREATE TABLE user_credentials (
    credential_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    two_factor_secret VARCHAR(100),
    last_password_change TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Query user without exposing credentials
SELECT user_id, username, email
FROM users
WHERE user_id = 123;

-- Only access credentials when needed for authentication
SELECT u.username, c.password_hash, c.salt
FROM users u
JOIN user_credentials c ON u.user_id = c.user_id
WHERE u.username = 'john_doe';
```

### 2. Optional Extended Information

Additional details that not all records have.

```sql
-- Basic employee information (always exists)
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    department_id INT
);

-- Extended profile (optional, may not exist for all employees)
CREATE TABLE employee_profiles (
    profile_id SERIAL PRIMARY KEY,
    employee_id INT UNIQUE NOT NULL,
    bio TEXT,
    photo_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    twitter_handle VARCHAR(50),
    personal_website VARCHAR(255),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
);

-- Get employees with or without profiles
SELECT 
    e.employee_id,
    e.first_name,
    e.last_name,
    ep.bio,
    ep.photo_url
FROM employees e
LEFT JOIN employee_profiles ep ON e.employee_id = ep.employee_id;
```

### 3. Different Access Patterns

Separate frequently accessed data from rarely accessed data.

```sql
-- Frequently accessed product core data
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id INT,
    in_stock BOOLEAN DEFAULT true
);

-- Rarely accessed detailed specifications
CREATE TABLE product_specifications (
    spec_id SERIAL PRIMARY KEY,
    product_id INT UNIQUE NOT NULL,
    detailed_description TEXT,
    technical_specs JSONB,
    warranty_info TEXT,
    manufacturer_details TEXT,
    compliance_certifications TEXT[],
    user_manual_url VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Most queries only need the product table
SELECT product_id, product_name, price
FROM products
WHERE category_id = 5;

-- Only fetch specs when needed
SELECT 
    p.product_name,
    ps.detailed_description,
    ps.technical_specs
FROM products p
JOIN product_specifications ps ON p.product_id = ps.product_id
WHERE p.product_id = 101;
```

### 4. Different Data Types or Storage

Separate large objects or special data types.

```sql
-- User account data
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    account_status VARCHAR(20) DEFAULT 'active'
);

-- Large binary data (photos, documents)
CREATE TABLE user_documents (
    document_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    profile_picture BYTEA,
    id_document BYTEA,
    resume_pdf BYTEA,
    picture_content_type VARCHAR(50),
    id_content_type VARCHAR(50),
    resume_content_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### 5. Vertical Partitioning

Split wide tables for performance.

```sql
-- Main customer data (frequently accessed)
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    account_status VARCHAR(20) DEFAULT 'active'
);

-- Additional customer data (less frequently accessed)
CREATE TABLE customer_details (
    detail_id SERIAL PRIMARY KEY,
    customer_id INT UNIQUE NOT NULL,
    company_name VARCHAR(100),
    job_title VARCHAR(100),
    industry VARCHAR(50),
    annual_revenue DECIMAL(15,2),
    employee_count INT,
    website VARCHAR(255),
    notes TEXT,
    preferred_contact_method VARCHAR(20),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);
```

## Implementation Examples

### Example 1: User Authentication System

```sql
-- Main user table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- One-to-one with authentication data
CREATE TABLE user_auth (
    auth_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    password_updated_at TIMESTAMP DEFAULT NOW(),
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert user and auth data
INSERT INTO users (username, email) 
VALUES ('alice', 'alice@example.com')
RETURNING user_id;

-- Assuming user_id returned is 1
INSERT INTO user_auth (user_id, password_hash, password_salt)
VALUES (1, '$2b$12$...', 'random_salt_here');

-- Query for login
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.is_active,
    a.password_hash,
    a.password_salt,
    a.mfa_enabled
FROM users u
JOIN user_auth a ON u.user_id = a.user_id
WHERE u.username = 'alice' AND u.is_active = true;
```

### Example 2: Company and Legal Entity

```sql
-- Main company table
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    website VARCHAR(255),
    industry VARCHAR(100),
    founded_year INT,
    employee_count INT,
    headquarters_location VARCHAR(100)
);

-- Legal entity information (1:1 with company)
CREATE TABLE company_legal_entities (
    entity_id SERIAL PRIMARY KEY,
    company_id INT UNIQUE NOT NULL,
    legal_name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(50) UNIQUE NOT NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    legal_structure VARCHAR(50), -- LLC, Corporation, etc.
    incorporation_date DATE,
    jurisdiction VARCHAR(100),
    registered_address TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- Insert company and legal entity
BEGIN;

INSERT INTO companies (company_name, website, industry)
VALUES ('Tech Innovations Inc', 'https://techinno.com', 'Software')
RETURNING company_id;

-- Assuming company_id is 42
INSERT INTO company_legal_entities (
    company_id, 
    legal_name, 
    tax_id, 
    registration_number,
    legal_structure
)
VALUES (
    42,
    'Tech Innovations Incorporated',
    '12-3456789',
    'REG-2024-001',
    'C-Corporation'
);

COMMIT;
```

### Example 3: Vehicle and Vehicle Registration

```sql
-- Vehicle information
CREATE TABLE vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(30),
    mileage INT
);

-- Vehicle registration (1:1, each vehicle has one current registration)
CREATE TABLE vehicle_registrations (
    registration_id SERIAL PRIMARY KEY,
    vehicle_id INT UNIQUE NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    state VARCHAR(2) NOT NULL,
    registration_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    owner_address TEXT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
);

-- Create indexes for lookups
CREATE INDEX idx_registration_license_plate 
ON vehicle_registrations(license_plate);

CREATE INDEX idx_registration_expiration 
ON vehicle_registrations(expiration_date);

-- Query by license plate
SELECT 
    v.vin,
    v.make,
    v.model,
    v.year,
    vr.license_plate,
    vr.owner_name,
    vr.expiration_date
FROM vehicles v
JOIN vehicle_registrations vr ON v.vehicle_id = vr.vehicle_id
WHERE vr.license_plate = 'ABC-1234';
```

## Best Practices

### 1. Choose the Right Side for the Foreign Key

Place the foreign key on the table that is:
- Optional or dependent
- Less frequently accessed
- Created after the parent record

```sql
-- Users table is primary (always exists)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL
);

-- Profile is optional/secondary (may not exist for all users)
CREATE TABLE user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,  -- Foreign key here
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### 2. Use Appropriate Constraints

```sql
CREATE TABLE user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,  -- NOT NULL + UNIQUE enforces 1:1
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### 3. Consider Using CASCADE

Decide on referential actions for deletes and updates.

```sql
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    -- When user is deleted, delete preferences too
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Alternative: Prevent deletion if preferences exist
CREATE TABLE user_subscription (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE RESTRICT  -- Can't delete user with active subscription
        ON UPDATE CASCADE
);
```

### 4. Add Appropriate Indexes

```sql
-- The UNIQUE constraint automatically creates an index
-- But you might want additional indexes for queries

CREATE TABLE user_addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    street VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    country VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Additional index for geographic queries
CREATE INDEX idx_user_addresses_location 
ON user_addresses(city, state, country);
```

### 5. Document the Reason for Separation

```sql
-- Separate table for audit/compliance reasons
CREATE TABLE employee_ssn (
    ssn_id SERIAL PRIMARY KEY,
    employee_id INT UNIQUE NOT NULL,
    ssn_encrypted VARCHAR(255) NOT NULL,
    encryption_key_version INT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
);

COMMENT ON TABLE employee_ssn IS 
'Separated for PII compliance and access control. 
Only HR personnel should have access to this table.';
```

## When to Use One-to-One Relationships

### Good Reasons:

✅ **Security/Privacy**: Separate sensitive data with different access controls
✅ **Performance**: Split large tables to improve query performance
✅ **Optional Data**: Extended information that doesn't apply to all records
✅ **Different Access Patterns**: Frequently vs. rarely accessed data
✅ **Storage Optimization**: Large BLOBs or special data types
✅ **Compliance**: Legal requirements for data separation
✅ **Table Size Limits**: Work around row size limitations

### Poor Reasons:

❌ **Over-normalization**: Creating too many small tables unnecessarily
❌ **Premature Optimization**: Splitting tables without proven performance issues
❌ **Organizational Convention**: "We always separate data this way"
❌ **Unclear Purpose**: If you can't explain why, probably don't split

## Alternative: Keep Everything in One Table

Sometimes a one-to-one relationship indicates data that should be in the same table.

```sql
-- Instead of two tables with 1:1 relationship:
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

CREATE TABLE user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Consider combining them:
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50)
);
```

## Querying One-to-One Relationships

### INNER JOIN (only records with both sides)

```sql
SELECT 
    u.user_id,
    u.username,
    u.email,
    up.bio,
    up.avatar_url
FROM users u
INNER JOIN user_profiles up ON u.user_id = up.user_id
WHERE u.user_id = 123;
```

### LEFT JOIN (include records without the related table)

```sql
-- Get all users, even those without profiles
SELECT 
    u.user_id,
    u.username,
    u.email,
    up.bio,
    up.avatar_url
FROM users u
LEFT JOIN user_profiles up ON u.user_id = up.user_id;
```

### Using EXISTS (check for existence)

```sql
-- Find users who have completed their profile
SELECT user_id, username, email
FROM users u
WHERE EXISTS (
    SELECT 1 
    FROM user_profiles up 
    WHERE up.user_id = u.user_id
);

-- Find users without profiles
SELECT user_id, username, email
FROM users u
WHERE NOT EXISTS (
    SELECT 1 
    FROM user_profiles up 
    WHERE up.user_id = u.user_id
);
```

## Summary

A **one-to-one relationship** connects exactly one record in one table to exactly one record in another table. It's implemented using:

1. **Foreign Key + UNIQUE constraint** (most common)
2. **Shared Primary Key** (less common)

**Common use cases:**
- Separating sensitive or optional data
- Performance optimization through vertical partitioning
- Different access patterns
- Security and compliance requirements

**Key points:**
- Less common than 1:many or many:many relationships
- Often indicates data that could be in one table but is separated for specific reasons
- Requires UNIQUE constraint to enforce the 1:1 cardinality
- Consider whether true separation is necessary or if one table would suffice
