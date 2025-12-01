# PostgreSQL JSONB & Advanced Data Types Knowledge Summary (Q281-305)

## Learning Objectives
This guide provides comprehensive knowledge needed to answer PostgreSQL JSONB and advanced data types interview questions Q281-305, covering JSON vs JSONB, JSONB operators and functions, array types, composite types, enumerated types, range types, and domain types.

## Core Learning Areas

### 1. JSON vs JSONB Fundamentals (Q281-282)

#### Key Differences Between JSON and JSONB
| Aspect | JSON | JSONB |
|--------|------|-------|
| **Storage Format** | Text-based, exact copy | Binary, preprocessed |
| **Parsing** | Parsed on each access | Pre-parsed, faster access |
| **Whitespace** | Preserved | Removed |
| **Key Order** | Preserved | Not guaranteed to preserve |
| **Duplicate Keys** | Allowed | Automatically de-duplicated |
| **Performance** | Slower operations | Faster operations |
| **Indexing** | Limited indexing options | Full GIN indexing support |
| **Size** | Smaller storage | Slightly larger but more efficient |

#### When to Use JSON vs JSONB
```sql
-- JSON use cases:
-- 1. Exact formatting preservation required
-- 2. Logging/auditing where original format matters
-- 3. Temporary data storage
-- 4. Small, infrequently accessed data

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    event_data JSON,  -- Preserve exact format for compliance
    created_at TIMESTAMP DEFAULT now()
);

-- JSONB use cases (recommended for most scenarios):
-- 1. Frequent querying and manipulation
-- 2. Performance-critical applications
-- 3. Complex data structures
-- 4. Need for indexing

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    profile_data JSONB,  -- Better performance for queries
    preferences JSONB,
    metadata JSONB
);

-- Performance comparison example
-- Insert test data
INSERT INTO user_profiles (profile_data) VALUES 
('{"name": "John Doe", "age": 30, "city": "New York", "skills": ["Python", "SQL", "JavaScript"]}'),
('{"name": "Jane Smith", "age": 25, "city": "San Francisco", "skills": ["Java", "React", "Node.js"]}');

-- JSONB automatically removes whitespace and handles duplicates
INSERT INTO user_profiles (profile_data) VALUES 
('  {  "name"  :  "Bob"  ,  "age"  :  35  ,  "name"  :  "Robert"  }  ');
-- Result: {"age": 35, "name": "Robert"} - duplicate key removed, whitespace cleaned
```

### 2. JSONB Query Operators (Q283-289)

#### Basic JSONB Access Operators

#### `->` Operator: Get JSON Object Field
```sql
-- Extract JSON object field (returns JSONB)
SELECT 
    profile_data->'name' as name_jsonb,
    profile_data->'age' as age_jsonb,
    profile_data->'skills' as skills_array
FROM user_profiles;

-- Nested access
SELECT profile_data->'address'->'city' as nested_city
FROM user_profiles;

-- Array element access by index
SELECT profile_data->'skills'->0 as first_skill
FROM user_profiles;
```

#### `->>` Operator: Get JSON Object Field as Text
```sql
-- Extract JSON field as text (returns TEXT)
SELECT 
    profile_data->>'name' as name_text,
    profile_data->>'age' as age_text,
    (profile_data->>'age')::INTEGER as age_integer
FROM user_profiles;

-- Use in WHERE clauses
SELECT * FROM user_profiles 
WHERE profile_data->>'city' = 'New York';

-- Comparison with proper type casting
SELECT * FROM user_profiles 
WHERE (profile_data->>'age')::INTEGER > 25;
```

#### `#>` Operator: Get JSON Object at Path
```sql
-- Access nested paths (returns JSONB)
CREATE TABLE complex_data (
    id SERIAL PRIMARY KEY,
    data JSONB
);

INSERT INTO complex_data (data) VALUES 
('{"user": {"profile": {"personal": {"name": "John", "age": 30}, "professional": {"title": "Developer", "years": 5}}}}');

-- Path-based access
SELECT 
    data#>'{user,profile,personal,name}' as name,
    data#>'{user,profile,professional}' as professional_info
FROM complex_data;

-- Array path access
INSERT INTO complex_data (data) VALUES 
('{"users": [{"name": "Alice"}, {"name": "Bob"}]}');

SELECT 
    data#>'{users,0,name}' as first_user,
    data#>'{users,1,name}' as second_user
FROM complex_data;
```

#### `#>>` Operator: Get JSON Object at Path as Text
```sql
-- Path-based text extraction
SELECT 
    data#>>'{user,profile,personal,name}' as name_text,
    data#>>'{user,profile,professional,title}' as title_text
FROM complex_data;

-- Use in conditions
SELECT * FROM complex_data 
WHERE data#>>'{user,profile,personal,name}' = 'John';
```

#### `@>` Operator: Containment (Does Left Contain Right?)
```sql
-- Test if JSONB contains another JSONB
SELECT * FROM user_profiles 
WHERE profile_data @> '{"city": "New York"}';

-- Test for array containment
SELECT * FROM user_profiles 
WHERE profile_data @> '{"skills": ["Python"]}';

-- Complex containment queries
SELECT * FROM user_profiles 
WHERE profile_data @> '{"age": 30, "city": "New York"}';

-- Nested containment
SELECT * FROM complex_data 
WHERE data @> '{"user": {"profile": {"personal": {"age": 30}}}}';
```

#### `?` Operator: Key/Element Existence
```sql
-- Check if key exists
SELECT * FROM user_profiles 
WHERE profile_data ? 'age';

-- Check for multiple keys (any exists)
SELECT * FROM user_profiles 
WHERE profile_data ?| array['age', 'birthday'];

-- Check for multiple keys (all exist)  
SELECT * FROM user_profiles 
WHERE profile_data ?& array['name', 'age'];

-- Check for array element
SELECT * FROM user_profiles 
WHERE profile_data->'skills' ? 'Python';
```

### 3. JSONB Indexing (Q290-291)

#### Creating Indexes on JSONB
```sql
-- GIN index for general JSONB operations
CREATE INDEX idx_user_profiles_data_gin ON user_profiles USING GIN (profile_data);

-- GIN index with specific operator class for containment queries
CREATE INDEX idx_user_profiles_data_gin_ops ON user_profiles USING GIN (profile_data jsonb_ops);

-- GIN index optimized for path operations
CREATE INDEX idx_user_profiles_data_path_ops ON user_profiles USING GIN (profile_data jsonb_path_ops);

-- Specific field indexing using expression indexes
CREATE INDEX idx_user_profiles_name ON user_profiles USING BTREE ((profile_data->>'name'));
CREATE INDEX idx_user_profiles_age ON user_profiles USING BTREE (((profile_data->>'age')::INTEGER));

-- Partial index for specific conditions
CREATE INDEX idx_user_profiles_active_users ON user_profiles 
USING GIN (profile_data) 
WHERE profile_data->>'status' = 'active';
```

#### GIN Index Types for JSONB
```sql
-- jsonb_ops (default) - supports all JSONB operators
-- Best for: @>, ?, ?&, ?| operators
-- Larger index size but more versatile

-- jsonb_path_ops - optimized for @> operator
-- Best for: containment queries only
-- Smaller index size, faster containment queries

-- Performance comparison example
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM user_profiles 
WHERE profile_data @> '{"skills": ["Python"]}';

-- Monitor index usage
SELECT 
    schemaname,
    tablename,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'user_profiles';
```

### 4. JSONB Modification Functions (Q292-295)

#### Updating JSONB Data
```sql
-- jsonb_set() function for updates
-- Syntax: jsonb_set(target, path, new_value, create_missing)

-- Update existing field
UPDATE user_profiles 
SET profile_data = jsonb_set(profile_data, '{age}', '31')
WHERE profile_data->>'name' = 'John Doe';

-- Update nested field
UPDATE user_profiles 
SET profile_data = jsonb_set(profile_data, '{address, city}', '"Chicago"', true)
WHERE id = 1;

-- Update array element
UPDATE user_profiles 
SET profile_data = jsonb_set(profile_data, '{skills, 0}', '"Advanced Python"')
WHERE id = 1;

-- Add new field
UPDATE user_profiles 
SET profile_data = jsonb_set(profile_data, '{last_login}', to_jsonb(now()), true)
WHERE id = 1;

-- Multiple updates using jsonb_set chaining
UPDATE user_profiles 
SET profile_data = jsonb_set(
    jsonb_set(profile_data, '{age}', '32'),
    '{status}', '"updated"', true
)
WHERE id = 1;
```

#### Removing Keys from JSONB
```sql
-- Remove single key using - operator
UPDATE user_profiles 
SET profile_data = profile_data - 'temporary_field'
WHERE id = 1;

-- Remove multiple keys using - operator with array
UPDATE user_profiles 
SET profile_data = profile_data - array['field1', 'field2']
WHERE id = 1;

-- Remove nested keys using path
UPDATE user_profiles 
SET profile_data = profile_data #- '{address, zipcode}'
WHERE id = 1;

-- Remove array element by index
UPDATE user_profiles 
SET profile_data = jsonb_set(
    profile_data, 
    '{skills}', 
    (profile_data->'skills') - 1
)
WHERE id = 1;

-- Conditional removal
UPDATE user_profiles 
SET profile_data = CASE 
    WHEN profile_data ? 'temporary' 
    THEN profile_data - 'temporary'
    ELSE profile_data
END;
```

#### Merging JSONB Objects
```sql
-- Simple merge using || operator (concatenation)
UPDATE user_profiles 
SET profile_data = profile_data || '{"last_modified": "2024-12-01"}'
WHERE id = 1;

-- Merge with overwrite
UPDATE user_profiles 
SET profile_data = profile_data || jsonb_build_object(
    'status', 'verified',
    'verification_date', now(),
    'verified_by', 'system'
)
WHERE profile_data->>'email_verified' = 'true';

-- Deep merge function (custom)
CREATE OR REPLACE FUNCTION jsonb_merge_deep(left_json jsonb, right_json jsonb)
RETURNS jsonb AS $$
BEGIN
    RETURN CASE
        WHEN left_json IS NULL THEN right_json
        WHEN right_json IS NULL THEN left_json
        WHEN jsonb_typeof(left_json) <> 'object' OR jsonb_typeof(right_json) <> 'object' 
        THEN right_json
        ELSE (
            SELECT jsonb_object_agg(key, value)
            FROM (
                SELECT key, CASE
                    WHEN jsonb_typeof(left_json->key) = 'object' AND jsonb_typeof(right_json->key) = 'object'
                    THEN jsonb_merge_deep(left_json->key, right_json->key)
                    ELSE COALESCE(right_json->key, left_json->key)
                END as value
                FROM (
                    SELECT key FROM jsonb_object_keys(left_json)
                    UNION
                    SELECT key FROM jsonb_object_keys(right_json)
                ) keys
            ) merged
        )
    END;
END;
$$ LANGUAGE plpgsql;

-- Usage example
SELECT jsonb_merge_deep(
    '{"a": {"b": 1, "c": 2}, "d": 3}',
    '{"a": {"c": 3, "e": 4}, "f": 5}'
);
-- Result: {"a": {"b": 1, "c": 3, "e": 4}, "d": 3, "f": 5}
```

### 5. Array Data Types (Q296-300)

#### Array Fundamentals
```sql
-- Array type declaration and usage
CREATE TABLE array_examples (
    id SERIAL PRIMARY KEY,
    integer_array INTEGER[],
    text_array TEXT[],
    multidimensional_array INTEGER[][],
    fixed_array INTEGER[3]
);

-- Array literals
INSERT INTO array_examples (integer_array, text_array) VALUES 
(ARRAY[1, 2, 3], ARRAY['a', 'b', 'c']),
('{4, 5, 6}', '{"d", "e", "f"}'),  -- Alternative syntax
(ARRAY[7, 8, NULL], ARRAY['g', NULL, 'h']);  -- With NULLs

-- Multidimensional arrays
INSERT INTO array_examples (multidimensional_array) VALUES 
('{{1,2},{3,4}}'),
(ARRAY[[1,2],[3,4]]);
```

#### Array Query Operations
```sql
-- Array element access (1-based indexing)
SELECT 
    text_array[1] as first_element,
    text_array[2] as second_element,
    text_array[array_length(text_array, 1)] as last_element
FROM array_examples;

-- Array slicing
SELECT 
    text_array[1:2] as first_two,
    text_array[2:] as from_second,
    integer_array[:2] as first_two_ints
FROM array_examples;

-- Array functions
SELECT 
    array_length(text_array, 1) as array_length,
    array_dims(text_array) as dimensions,
    array_upper(text_array, 1) as upper_bound,
    array_lower(text_array, 1) as lower_bound,
    cardinality(text_array) as element_count
FROM array_examples;

-- Array concatenation
SELECT 
    integer_array || ARRAY[99] as append_element,
    ARRAY[0] || integer_array as prepend_element,
    integer_array || ARRAY[10, 11] as append_array
FROM array_examples;
```

#### ANY() and ALL() Functions with Arrays
```sql
-- ANY() - true if any element matches condition
SELECT * FROM array_examples 
WHERE 2 = ANY(integer_array);

SELECT * FROM array_examples 
WHERE 'b' = ANY(text_array);

-- ALL() - true if all elements match condition
SELECT * FROM array_examples 
WHERE integer_array IS NOT NULL 
AND array_length(integer_array, 1) > 0
AND 0 < ALL(integer_array);  -- All elements positive

-- Using ANY/ALL with subqueries
CREATE TABLE user_tags (
    user_id INTEGER,
    tags TEXT[]
);

INSERT INTO user_tags VALUES 
(1, ARRAY['developer', 'python', 'senior']),
(2, ARRAY['designer', 'ui', 'junior']),
(3, ARRAY['manager', 'agile', 'senior']);

-- Find users with any senior-related tag
SELECT * FROM user_tags 
WHERE 'senior' = ANY(tags);

-- Find users where all tags are work-related
SELECT * FROM user_tags 
WHERE tags <@ ARRAY['developer', 'designer', 'manager', 'python', 'ui', 'agile', 'senior', 'junior'];
```

#### Array Operators and Functions
```sql
-- Array containment operators
SELECT 
    ARRAY[1,2] <@ ARRAY[1,2,3,4] as is_contained,     -- true
    ARRAY[1,2,3,4] @> ARRAY[2,3] as contains,       -- true
    ARRAY[1,2] && ARRAY[2,3] as overlaps;           -- true

-- Array comparison
SELECT 
    ARRAY[1,2,3] = ARRAY[1,2,3] as equal,           -- true
    ARRAY[1,2,3] <> ARRAY[1,3,2] as not_equal;     -- true

-- Array manipulation functions
SELECT 
    array_append(ARRAY[1,2], 3) as append_result,           -- {1,2,3}
    array_prepend(0, ARRAY[1,2]) as prepend_result,         -- {0,1,2}
    array_remove(ARRAY[1,2,1,3], 1) as remove_result,      -- {2,3}
    array_replace(ARRAY[1,2,1,3], 1, 9) as replace_result; -- {9,2,9,3}

-- Array aggregation
CREATE TABLE sales_data (
    id SERIAL PRIMARY KEY,
    sales_rep TEXT,
    monthly_sales INTEGER[]
);

INSERT INTO sales_data VALUES 
(1, 'Alice', ARRAY[1000, 1200, 1100]),
(2, 'Bob', ARRAY[900, 1000, 1300]);

SELECT 
    sales_rep,
    array_agg(unnest_sales ORDER BY unnest_sales) as sorted_sales
FROM (
    SELECT sales_rep, unnest(monthly_sales) as unnest_sales
    FROM sales_data
) expanded
GROUP BY sales_rep;
```

#### UNNEST Arrays
```sql
-- Unnest array to rows
SELECT unnest(ARRAY[1, 2, 3]) as value;

-- Unnest with ordinality (position)
SELECT value, position 
FROM unnest(ARRAY['a', 'b', 'c']) WITH ORDINALITY AS t(value, position);

-- Multiple arrays with unnest
SELECT name, skill, skill_level
FROM (
    SELECT 'John' as name, 
           ARRAY['Python', 'SQL', 'JavaScript'] as skills,
           ARRAY[9, 8, 7] as skill_levels
) data
CROSS JOIN LATERAL unnest(skills, skill_levels) AS t(skill, skill_level);

-- Practical unnest example
CREATE TABLE product_categories (
    product_id INTEGER,
    categories TEXT[]
);

INSERT INTO product_categories VALUES 
(1, ARRAY['electronics', 'computers', 'laptops']),
(2, ARRAY['clothing', 'accessories', 'jewelry']);

-- Normalize array data
SELECT 
    product_id,
    category,
    row_number() OVER (PARTITION BY product_id ORDER BY category) as category_rank
FROM product_categories
CROSS JOIN LATERAL unnest(categories) AS t(category);
```

### 6. Composite Types (Q301-302)

#### Creating and Using Custom Composite Types
```sql
-- Define composite types
CREATE TYPE address_type AS (
    street TEXT,
    city TEXT,
    state TEXT,
    zipcode TEXT,
    country TEXT
);

CREATE TYPE contact_info AS (
    email TEXT,
    phone TEXT,
    address address_type
);

-- Use composite types in tables
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    contact contact_info
);

-- Insert data into composite type columns
INSERT INTO customers (name, contact) VALUES 
('John Doe', ROW(
    'john@example.com',
    '555-1234',
    ROW('123 Main St', 'New York', 'NY', '10001', 'USA')::address_type
)::contact_info);

-- Alternative insertion syntax
INSERT INTO customers (name, contact) VALUES 
('Jane Smith', '("jane@example.com","555-5678","(""456 Oak Ave"",""San Francisco"",""CA"",""94102"",""USA"")")');
```

#### Querying Composite Types
```sql
-- Access composite type fields
SELECT 
    name,
    (contact).email as email,
    (contact).phone as phone,
    ((contact).address).city as city,
    ((contact).address).state as state
FROM customers;

-- Use composite types in WHERE clauses
SELECT * FROM customers 
WHERE ((contact).address).state = 'NY';

-- Update composite type fields
UPDATE customers 
SET contact = ROW(
    (contact).email,
    '555-9999',  -- New phone
    (contact).address
)::contact_info
WHERE name = 'John Doe';

-- Update nested composite fields
UPDATE customers 
SET contact = ROW(
    (contact).email,
    (contact).phone,
    ROW(
        ((contact).address).street,
        'Boston',  -- New city
        'MA',      -- New state
        ((contact).address).zipcode,
        ((contact).address).country
    )::address_type
)::contact_info
WHERE name = 'John Doe';
```

#### Advanced Composite Type Operations
```sql
-- Composite type arrays
CREATE TABLE company (
    id SERIAL PRIMARY KEY,
    name TEXT,
    offices address_type[]
);

INSERT INTO company (name, offices) VALUES 
('TechCorp', ARRAY[
    ROW('100 Main St', 'New York', 'NY', '10001', 'USA')::address_type,
    ROW('200 Market St', 'San Francisco', 'CA', '94102', 'USA')::address_type
]);

-- Query composite type arrays
SELECT 
    name,
    (offices[1]).city as headquarters_city,
    array_length(offices, 1) as office_count
FROM company;

-- Functions returning composite types
CREATE OR REPLACE FUNCTION get_full_address(addr address_type)
RETURNS TEXT AS $$
BEGIN
    RETURN addr.street || ', ' || addr.city || ', ' || addr.state || ' ' || addr.zipcode;
END;
$$ LANGUAGE plpgsql;

SELECT 
    name,
    get_full_address(((contact).address)) as full_address
FROM customers;
```

### 7. Enumerated Types (ENUMs) (Q303)

#### Creating and Using ENUM Types
```sql
-- Create enumerated types
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE user_role AS ENUM ('guest', 'user', 'moderator', 'admin', 'superuser');

-- Use ENUMs in table definitions
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT UNIQUE,
    status order_status DEFAULT 'pending',
    priority priority_level DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    role user_role DEFAULT 'user',
    active BOOLEAN DEFAULT true
);

-- Insert data with ENUM values
INSERT INTO orders (order_number, status, priority) VALUES 
('ORD-001', 'pending', 'high'),
('ORD-002', 'processing', 'medium'),
('ORD-003', 'shipped', 'low');

INSERT INTO users (username, role) VALUES 
('john_doe', 'user'),
('admin_user', 'admin'),
('mod_user', 'moderator');
```

#### ENUM Operations and Queries
```sql
-- Query with ENUM values
SELECT * FROM orders WHERE status = 'pending';
SELECT * FROM users WHERE role IN ('admin', 'superuser');

-- ENUM comparison (ordered by definition order)
SELECT * FROM orders WHERE priority >= 'medium';

-- ENUM ordering
SELECT order_number, status, priority
FROM orders 
ORDER BY priority DESC, status;

-- Get all possible ENUM values
SELECT unnest(enum_range(NULL::order_status)) as possible_statuses;
SELECT unnest(enum_range(NULL::user_role)) as possible_roles;

-- Check if value exists in ENUM
SELECT 'shipped'::order_status IS NOT NULL;  -- Valid enum value
-- SELECT 'invalid'::order_status;  -- Would cause error
```

#### Modifying ENUM Types
```sql
-- Add new ENUM value
ALTER TYPE order_status ADD VALUE 'returned' AFTER 'delivered';
ALTER TYPE priority_level ADD VALUE 'critical' AFTER 'urgent';

-- Cannot remove ENUM values directly, but can work around:
-- 1. Create new ENUM type
CREATE TYPE order_status_new AS ENUM ('pending', 'processing', 'shipped', 'delivered');

-- 2. Add new column
ALTER TABLE orders ADD COLUMN status_new order_status_new;

-- 3. Update data
UPDATE orders SET status_new = status::text::order_status_new 
WHERE status::text IN ('pending', 'processing', 'shipped', 'delivered');

-- 4. Drop old column and rename (in transaction)
BEGIN;
ALTER TABLE orders DROP COLUMN status;
ALTER TABLE orders RENAME COLUMN status_new TO status;
COMMIT;

-- ENUM utility functions
CREATE OR REPLACE FUNCTION is_valid_enum_value(enum_type regtype, value text)
RETURNS boolean AS $$
BEGIN
    PERFORM value::text = any(enum_range(NULL::order_status)::text[]);
    RETURN FOUND;
EXCEPTION
    WHEN others THEN RETURN false;
END;
$$ LANGUAGE plpgsql;
```

### 8. Range Types (Q304)

#### Built-in Range Types
```sql
-- PostgreSQL built-in range types:
-- int4range, int8range, numrange, tsrange, tstzrange, daterange

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    room_id INTEGER,
    guest_name TEXT,
    stay_period daterange,
    check_in_time tsrange,
    price_range numrange
);

-- Insert range data
INSERT INTO reservations (room_id, guest_name, stay_period, check_in_time, price_range) VALUES 
(101, 'John Doe', '[2024-12-01,2024-12-05)', '[2024-12-01 14:00, 2024-12-05 11:00)', '[200.00,250.00]'),
(102, 'Jane Smith', '[2024-12-03,2024-12-07)', '[2024-12-03 15:00, 2024-12-07 10:00)', '[180.00,220.00)'),
(101, 'Bob Wilson', '[2024-12-06,2024-12-10)', '[2024-12-06 16:00, 2024-12-10 12:00)', '[220.00,280.00]');

-- Range notation:
-- [a,b] = inclusive of both bounds
-- (a,b) = exclusive of both bounds  
-- [a,b) = inclusive of lower, exclusive of upper
-- (a,b] = exclusive of lower, inclusive of upper
```

#### Range Operations and Queries
```sql
-- Range containment and overlap
SELECT 
    guest_name,
    stay_period,
    stay_period @> '2024-12-04'::date as contains_date,
    stay_period && '[2024-12-02,2024-12-06)'::daterange as overlaps_period
FROM reservations;

-- Range operators
SELECT 
    guest_name,
    stay_period,
    -- Containment
    stay_period @> '[2024-12-02,2024-12-03]'::daterange as contains_range,
    '[2024-12-01,2024-12-10]'::daterange @> stay_period as contained_by,
    -- Overlap
    stay_period && '[2024-12-04,2024-12-08]'::daterange as overlaps,
    -- Adjacency
    stay_period -|- '[2024-12-05,2024-12-08]'::daterange as adjacent,
    -- Union and intersection
    stay_period + '[2024-12-04,2024-12-08]'::daterange as union_range,
    stay_period * '[2024-12-04,2024-12-08]'::daterange as intersection
FROM reservations;

-- Range functions
SELECT 
    guest_name,
    stay_period,
    lower(stay_period) as check_in_date,
    upper(stay_period) as check_out_date,
    lower_inc(stay_period) as lower_inclusive,
    upper_inc(stay_period) as upper_inclusive,
    isempty(stay_period) as is_empty,
    lower_inf(stay_period) as lower_infinite,
    upper_inf(stay_period) as upper_infinite
FROM reservations;
```

#### Custom Range Types
```sql
-- Create custom range type
CREATE TYPE float_range AS RANGE (
    subtype = float8,
    subtype_diff = float8mi
);

-- Create table using custom range
CREATE TABLE measurements (
    id SERIAL PRIMARY KEY,
    sensor_name TEXT,
    temperature_range float_range,
    recorded_at TIMESTAMP DEFAULT now()
);

INSERT INTO measurements (sensor_name, temperature_range) VALUES 
('Sensor_A', '[20.5, 25.3]'::float_range),
('Sensor_B', '[18.2, 22.7)'::float_range);

-- Range type with custom operators
CREATE OR REPLACE FUNCTION temperature_diff(float8, float8)
RETURNS float8 AS $$
BEGIN
    RETURN $1 - $2;
END;
$$ LANGUAGE plpgsql;

-- Range aggregation and analysis
SELECT 
    sensor_name,
    range_merge(temperature_range) as merged_range,
    avg(upper(temperature_range) - lower(temperature_range)) as avg_range_width
FROM measurements
GROUP BY sensor_name;
```

### 9. Domain Types (Q305)

#### Creating Domain Types
```sql
-- Domain types are user-defined data types based on existing types with constraints

-- Simple domains with constraints
CREATE DOMAIN email_address AS TEXT
    CHECK (VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

CREATE DOMAIN positive_integer AS INTEGER
    CHECK (VALUE > 0);

CREATE DOMAIN percentage AS NUMERIC(5,2)
    CHECK (VALUE >= 0 AND VALUE <= 100);

CREATE DOMAIN us_postal_code AS TEXT
    CHECK (VALUE ~ '^\d{5}(-\d{4})?$');

-- Domain with default value
CREATE DOMAIN priority_score AS INTEGER
    DEFAULT 0
    CHECK (VALUE >= 0 AND VALUE <= 10);
```

#### Using Domain Types
```sql
-- Use domains in table definitions
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email email_address,
    salary positive_integer,
    performance_rating percentage,
    zip_code us_postal_code,
    priority priority_score
);

-- Insert valid data
INSERT INTO employees (name, email, salary, performance_rating, zip_code, priority) VALUES 
('John Doe', 'john@company.com', 75000, 85.5, '12345', 8),
('Jane Smith', 'jane@company.com', 80000, 92.0, '54321-1234', DEFAULT);

-- These would fail constraint checks:
-- INSERT INTO employees (email) VALUES ('invalid-email');  -- Email format check
-- INSERT INTO employees (salary) VALUES (-1000);            -- Positive integer check
-- INSERT INTO employees (performance_rating) VALUES (150);  -- Percentage range check
```

#### Domain Operations and Maintenance
```sql
-- Query domain information
SELECT 
    typname as domain_name,
    typdefault as default_value,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_type typ
LEFT JOIN pg_constraint con ON typ.oid = con.contypid
WHERE typtype = 'd';  -- 'd' indicates domain type

-- Alter domain constraints
-- Add new constraint
ALTER DOMAIN email_address ADD CONSTRAINT email_length_check CHECK (char_length(VALUE) <= 254);

-- Drop constraint
ALTER DOMAIN email_address DROP CONSTRAINT email_length_check;

-- Change default value
ALTER DOMAIN priority_score SET DEFAULT 5;
ALTER DOMAIN priority_score DROP DEFAULT;

-- Domain validation function
CREATE OR REPLACE FUNCTION validate_domain_value(domain_name text, test_value text)
RETURNS boolean AS $$
DECLARE
    result boolean;
BEGIN
    EXECUTE format('SELECT $1::%I IS NOT NULL', domain_name) USING test_value INTO result;
    RETURN result;
EXCEPTION
    WHEN others THEN RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Test domain validation
SELECT validate_domain_value('email_address', 'test@example.com');
SELECT validate_domain_value('email_address', 'invalid-email');
```

### 10. Advanced Data Type Patterns and Best Practices

#### Combining Advanced Data Types
```sql
-- Complex example combining multiple advanced data types
CREATE TYPE contact_method AS ENUM ('email', 'phone', 'mail', 'in_person');

CREATE TYPE address_with_coords AS (
    street TEXT,
    city TEXT,
    state TEXT,
    zipcode us_postal_code,
    coordinates POINT
);

CREATE TYPE contact_record AS (
    method contact_method,
    value TEXT,
    preferred BOOLEAN,
    valid_period tsrange
);

CREATE TABLE comprehensive_customers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email email_address,
    addresses address_with_coords[],
    contact_methods contact_record[],
    preferences JSONB,
    active_periods daterange[],
    priority priority_score DEFAULT 5,
    created_at TIMESTAMP DEFAULT now()
);

-- Insert complex data
INSERT INTO comprehensive_customers (
    name, email, addresses, contact_methods, preferences, active_periods
) VALUES (
    'John Complex',
    'john.complex@example.com',
    ARRAY[
        ROW('123 Main St', 'New York', 'NY', '10001', POINT(40.7128, -74.0060))::address_with_coords,
        ROW('456 Oak Ave', 'San Francisco', 'CA', '94102', POINT(37.7749, -122.4194))::address_with_coords
    ],
    ARRAY[
        ROW('email', 'john.complex@example.com', true, '[2024-01-01, 2024-12-31]'::tsrange)::contact_record,
        ROW('phone', '555-1234', false, '[2024-06-01, 2024-12-31]'::tsrange)::contact_record
    ],
    '{"newsletter": true, "theme": "dark", "notifications": {"email": true, "sms": false}}',
    ARRAY['[2024-01-01, 2024-06-30]'::daterange, '[2024-09-01, 2024-12-31]'::daterange]
);
```

#### Performance Considerations
```sql
-- Indexing strategies for advanced data types
-- JSONB indexes
CREATE INDEX idx_customers_preferences_gin ON comprehensive_customers USING GIN (preferences);
CREATE INDEX idx_customers_newsletter ON comprehensive_customers USING BTREE ((preferences->>'newsletter'));

-- Array indexes
CREATE INDEX idx_customers_addresses_gin ON comprehensive_customers USING GIN (addresses);

-- Range indexes  
CREATE INDEX idx_customers_active_periods_gist ON comprehensive_customers USING GIST (active_periods);

-- Composite type field indexes
CREATE INDEX idx_customers_first_address_city ON comprehensive_customers 
USING BTREE (((addresses[1]).city));

-- Query optimization examples
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM comprehensive_customers 
WHERE preferences @> '{"newsletter": true}';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM comprehensive_customers 
WHERE active_periods && ARRAY['[2024-06-01, 2024-06-30]'::daterange];
```

## Study Plan Recommendations

### Phase 1: JSON/JSONB Foundations (Days 1-4)
- Master JSON vs JSONB differences and use cases
- Learn all JSONB operators (→, -→>, #>, #→>, @>, ?)
- Practice JSONB indexing with GIN indexes

### Phase 2: JSONB Operations (Days 5-8)
- Study JSONB modification functions (jsonb_set, merge, remove)
- Practice complex JSONB queries and updates
- Learn performance optimization techniques

### Phase 3: Arrays and Composite Types (Days 9-12)
- Master array operations, ANY/ALL, and unnesting
- Learn composite type creation and manipulation
- Practice combining arrays with other data types

### Phase 4: Specialized Types (Days 13-15)
- Study ENUMs, ranges, and domains
- Learn advanced data type combinations
- Practice real-world scenarios and optimization

## Key Resources for Interview Preparation

1. **PostgreSQL Documentation**: JSON/JSONB, arrays, and advanced types
2. **Hands-on Practice**: Create comprehensive examples with all data types
3. **Performance Testing**: Benchmark different approaches and indexing strategies
4. **Real-world Applications**: Study schema design patterns using advanced types
5. **Edge Cases**: Practice with NULL values, empty arrays, invalid data

## Common Interview Scenarios

1. **Schema Design**: Design flexible schema using JSONB for dynamic attributes
2. **Data Migration**: Convert relational data to JSONB or advanced types
3. **Performance Optimization**: Optimize queries using proper indexing strategies
4. **Data Validation**: Implement business rules using domains and constraints
5. **API Integration**: Handle complex JSON payloads and array data efficiently

This comprehensive knowledge foundation will enable you to confidently answer all PostgreSQL JSONB and advanced data types questions (Q281-305) in technical interviews.