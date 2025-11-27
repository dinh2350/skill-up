# 99. What is the `RETURNING` clause?

## Definition

The `RETURNING` clause in PostgreSQL allows you to retrieve values from rows that were just inserted, updated, or deleted. It provides a way to get data back from a DML operation without requiring a separate `SELECT` statement, making operations more efficient and atomic.

## Basic Syntax

```sql
-- INSERT with RETURNING
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...)
RETURNING expression1, expression2, ...;

-- UPDATE with RETURNING  
UPDATE table_name
SET column1 = value1, column2 = value2, ...
WHERE condition
RETURNING expression1, expression2, ...;

-- DELETE with RETURNING
DELETE FROM table_name
WHERE condition
RETURNING expression1, expression2, ...;
```

## Using RETURNING with INSERT

### Basic INSERT Examples

```sql
-- Create sample table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    salary DECIMAL(10,2),
    department VARCHAR(50),
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Return specific columns after INSERT
INSERT INTO employees (name, email, salary, department)
VALUES ('John Doe', 'john.doe@company.com', 75000, 'Engineering')
RETURNING id, name, hire_date;

-- Result:
-- id | name     | hire_date
-- 1  | John Doe | 2025-01-15

-- Return all columns
INSERT INTO employees (name, email, salary, department)
VALUES ('Jane Smith', 'jane.smith@company.com', 80000, 'Marketing')
RETURNING *;

-- Return computed values
INSERT INTO employees (name, email, salary, department)
VALUES ('Bob Wilson', 'bob.wilson@company.com', 70000, 'Sales')
RETURNING 
    id,
    name,
    salary,
    salary * 12 AS annual_salary,
    'Employee #' || id AS employee_code;

-- Result:
-- id | name       | salary | annual_salary | employee_code
-- 3  | Bob Wilson | 70000  | 840000       | Employee #3
```

### Multiple Row INSERT

```sql
-- Insert multiple rows and return results
INSERT INTO employees (name, email, salary, department)
VALUES 
    ('Alice Johnson', 'alice.johnson@company.com', 85000, 'Engineering'),
    ('Mike Brown', 'mike.brown@company.com', 72000, 'Marketing'),
    ('Sarah Davis', 'sarah.davis@company.com', 78000, 'Sales')
RETURNING id, name, department, salary;

-- Result:
-- id | name          | department  | salary
-- 4  | Alice Johnson | Engineering | 85000
-- 5  | Mike Brown    | Marketing   | 72000  
-- 6  | Sarah Davis   | Sales       | 78000

-- Return aggregated information
INSERT INTO employees (name, email, salary, department)
VALUES 
    ('Tom Garcia', 'tom.garcia@company.com', 90000, 'Engineering'),
    ('Lisa White', 'lisa.white@company.com', 65000, 'HR')
RETURNING 
    COUNT(*) OVER () AS total_inserted,
    id,
    name,
    salary,
    AVG(salary) OVER () AS avg_salary_this_batch;
```

## Using RETURNING with UPDATE

### Basic UPDATE Examples

```sql
-- Update single row and return changes
UPDATE employees 
SET salary = salary * 1.10,
    department = 'Senior Engineering'
WHERE name = 'John Doe'
RETURNING 
    id,
    name,
    salary AS new_salary,
    salary / 1.10 AS old_salary,
    (salary - salary / 1.10) AS raise_amount;

-- Update multiple rows
UPDATE employees 
SET salary = salary * 1.05
WHERE department = 'Marketing'
RETURNING 
    id,
    name,
    salary AS new_salary,
    salary / 1.05 AS old_salary,
    department;

-- Update with complex conditions and return computed values
UPDATE employees 
SET 
    salary = CASE 
        WHEN salary < 75000 THEN salary * 1.15  -- 15% raise for lower salaries
        WHEN salary < 85000 THEN salary * 1.10  -- 10% raise for mid salaries  
        ELSE salary * 1.05                      -- 5% raise for higher salaries
    END
WHERE hire_date < CURRENT_DATE - INTERVAL '1 year'
RETURNING 
    id,
    name,
    salary AS new_salary,
    ROUND((salary / 
        CASE 
            WHEN salary < 75000 / 1.15 THEN 1.15
            WHEN salary < 85000 / 1.10 THEN 1.10  
            ELSE 1.05
        END), 2) AS old_salary,
    ROUND(salary - (salary / 
        CASE 
            WHEN salary < 75000 / 1.15 THEN 1.15
            WHEN salary < 85000 / 1.10 THEN 1.10
            ELSE 1.05  
        END), 2) AS raise_amount;
```

### UPDATE with JOIN-like Operations

```sql
-- Create department table for example
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE,
    budget DECIMAL(12,2),
    manager_id INTEGER
);

INSERT INTO departments (name, budget) VALUES 
    ('Engineering', 500000),
    ('Marketing', 200000),
    ('Sales', 300000),
    ('HR', 150000);

-- Update employees and return department information
UPDATE employees e
SET salary = salary * 1.08
FROM departments d  
WHERE e.department = d.name 
    AND d.budget > 250000
RETURNING 
    e.id,
    e.name,
    e.salary,
    e.department,
    d.budget AS dept_budget,
    'High-budget department raise' AS reason;
```

## Using RETURNING with DELETE

### Basic DELETE Examples

```sql
-- Delete and return deleted records for logging
DELETE FROM employees 
WHERE salary < 70000
RETURNING 
    id,
    name,
    email,
    salary,
    department,
    'Salary below threshold' AS deletion_reason;

-- Delete with complex conditions and return summary
DELETE FROM employees 
WHERE hire_date < CURRENT_DATE - INTERVAL '5 years'
    AND department IN ('Marketing', 'Sales')
RETURNING 
    id,
    name,
    department,
    hire_date,
    CURRENT_DATE - hire_date AS tenure,
    'Long-term employee cleanup' AS reason;

-- Conditional delete with detailed return
DELETE FROM employees e
WHERE EXISTS (
    SELECT 1 FROM employees e2 
    WHERE e2.email = e.email 
    AND e2.id < e.id
)
RETURNING 
    id,
    name,
    email,
    'Duplicate email removed' AS reason;
```

## Advanced RETURNING Patterns

### 1. Audit Trail Creation

```sql
-- Create audit table
CREATE TABLE employee_audit (
    audit_id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    operation VARCHAR(10),
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to log changes using RETURNING
CREATE OR REPLACE FUNCTION update_employee_with_audit(
    emp_id INTEGER,
    new_salary DECIMAL(10,2),
    new_dept VARCHAR(50),
    changed_by VARCHAR(100)
) RETURNS TABLE(
    employee_id INTEGER,
    old_salary DECIMAL(10,2),
    new_salary DECIMAL(10,2),
    old_department VARCHAR(50),
    new_department VARCHAR(50)
) AS $$
DECLARE
    audit_rec RECORD;
BEGIN
    -- Capture old values and update
    UPDATE employees 
    SET 
        salary = new_salary,
        department = new_dept
    WHERE id = emp_id
    RETURNING 
        id,
        salary / CASE WHEN new_salary = salary THEN 1 ELSE new_salary/salary END AS old_sal,
        salary,
        CASE WHEN new_dept = department THEN department 
             ELSE lag(department) OVER() 
        END AS old_dept,
        department
    INTO audit_rec;
    
    -- Log to audit table
    INSERT INTO employee_audit (employee_id, operation, old_values, new_values, changed_by)
    VALUES (
        emp_id,
        'UPDATE',
        jsonb_build_object('salary', audit_rec.old_sal, 'department', audit_rec.old_dept),
        jsonb_build_object('salary', audit_rec.salary, 'department', audit_rec.department),
        changed_by
    );
    
    -- Return summary
    RETURN QUERY 
    SELECT 
        audit_rec.id,
        audit_rec.old_sal,
        audit_rec.salary,
        audit_rec.old_dept,
        audit_rec.department;
END;
$$ LANGUAGE plpgsql;
```

### 2. Bulk Operations with Results

```sql
-- Create temporary staging table for bulk operations
CREATE TABLE employee_updates (
    employee_id INTEGER,
    new_salary DECIMAL(10,2),
    new_department VARCHAR(50)
);

INSERT INTO employee_updates VALUES
    (1, 85000, 'Senior Engineering'),
    (2, 88000, 'Marketing'),
    (3, 75000, 'Sales');

-- Bulk update with comprehensive RETURNING
WITH updated_employees AS (
    UPDATE employees e
    SET 
        salary = u.new_salary,
        department = u.new_department
    FROM employee_updates u
    WHERE e.id = u.employee_id
    RETURNING 
        e.id,
        e.name,
        u.new_salary - (SELECT salary FROM employees WHERE id = e.id) AS salary_change,
        e.salary AS new_salary,
        e.department AS new_department
)
SELECT 
    COUNT(*) AS employees_updated,
    SUM(salary_change) AS total_salary_increase,
    AVG(new_salary) AS avg_new_salary,
    STRING_AGG(name, ', ' ORDER BY name) AS updated_employees
FROM updated_employees;
```

### 3. Upsert Operations (INSERT ... ON CONFLICT)

```sql
-- Create unique constraint for upsert example
ALTER TABLE employees ADD CONSTRAINT unique_email UNIQUE (email);

-- Upsert with RETURNING
INSERT INTO employees (name, email, salary, department)
VALUES ('John Doe', 'john.doe@company.com', 80000, 'Engineering')
ON CONFLICT (email) 
DO UPDATE SET 
    salary = EXCLUDED.salary,
    department = EXCLUDED.department
RETURNING 
    id,
    name,
    email,
    salary,
    department,
    CASE 
        WHEN xmax = 0 THEN 'INSERTED'
        ELSE 'UPDATED'
    END AS operation;

-- Bulk upsert with detailed results
INSERT INTO employees (name, email, salary, department)
VALUES 
    ('New Employee', 'new.employee@company.com', 70000, 'Marketing'),
    ('Jane Smith', 'jane.smith@company.com', 85000, 'Senior Marketing'),
    ('Another New', 'another.new@company.com', 72000, 'Sales')
ON CONFLICT (email)
DO UPDATE SET 
    name = EXCLUDED.name,
    salary = EXCLUDED.salary,
    department = EXCLUDED.department
RETURNING 
    *,
    CASE 
        WHEN xmax = 0 THEN 'INSERT'
        ELSE 'UPDATE'
    END AS action_taken;
```

### 4. Complex Calculations and Aggregations

```sql
-- Delete with running totals
WITH deletion_summary AS (
    DELETE FROM employees 
    WHERE department = 'Marketing'
    RETURNING 
        id,
        name,
        salary,
        department,
        ROW_NUMBER() OVER (ORDER BY salary DESC) AS deletion_order
)
SELECT 
    deletion_order,
    id,
    name,
    salary,
    SUM(salary) OVER (ORDER BY deletion_order) AS cumulative_salary_freed,
    COUNT(*) OVER () AS total_deleted
FROM deletion_summary;
```

### 5. Cross-Table Operations

```sql
-- Create projects table for example
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    budget DECIMAL(12,2),
    team_lead_id INTEGER REFERENCES employees(id)
);

-- Update employee and related projects
WITH updated_lead AS (
    UPDATE employees 
    SET salary = salary * 1.20
    WHERE id = 1  -- Promote to team lead
    RETURNING id, name, salary
),
project_updates AS (
    UPDATE projects 
    SET team_lead_id = (SELECT id FROM updated_lead)
    WHERE team_lead_id IS NULL
    RETURNING id, name, budget
)
SELECT 
    'Employee promoted: ' || ul.name || ' with new salary: $' || ul.salary AS employee_update,
    'Projects assigned: ' || COUNT(pu.id) || ' projects worth $' || SUM(pu.budget) AS project_summary
FROM updated_lead ul
CROSS JOIN project_updates pu
GROUP BY ul.name, ul.salary;
```

## Practical Use Cases

### 1. API Response Generation

```sql
-- Create order and return complete response data
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    total_amount DECIMAL(10,2),
    order_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_name VARCHAR(100),
    quantity INTEGER,
    unit_price DECIMAL(10,2)
);

-- Insert order and return API-ready response
WITH new_order AS (
    INSERT INTO orders (customer_id, total_amount)
    VALUES (123, 299.98)
    RETURNING id, customer_id, total_amount, order_date, status
),
order_items_insert AS (
    INSERT INTO order_items (order_id, product_name, quantity, unit_price)
    SELECT 
        o.id,
        items.product_name,
        items.quantity,
        items.unit_price
    FROM new_order o,
    (VALUES 
        ('Laptop', 1, 999.99),
        ('Mouse', 2, 29.99)
    ) AS items(product_name, quantity, unit_price)
    RETURNING order_id, product_name, quantity, unit_price
)
SELECT 
    o.id AS order_id,
    o.customer_id,
    o.total_amount,
    o.order_date,
    o.status,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'product', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'line_total', oi.quantity * oi.unit_price
        )
    ) AS items
FROM new_order o
JOIN order_items_insert oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_id, o.total_amount, o.order_date, o.status;
```

### 2. Data Migration with Validation

```sql
-- Migrate data with validation and detailed results
CREATE TABLE legacy_employees (
    old_id INTEGER,
    full_name VARCHAR(200),
    email_address VARCHAR(100),
    annual_salary DECIMAL(10,2),
    dept_name VARCHAR(50)
);

-- Migration with RETURNING for validation
WITH migrated_data AS (
    INSERT INTO employees (name, email, salary, department)
    SELECT 
        full_name,
        email_address,
        annual_salary,
        dept_name
    FROM legacy_employees
    WHERE email_address IS NOT NULL 
        AND annual_salary > 0
    RETURNING 
        id AS new_id,
        name,
        email,
        salary,
        department
),
migration_summary AS (
    SELECT 
        COUNT(*) AS migrated_count,
        MIN(salary) AS min_salary,
        MAX(salary) AS max_salary,
        AVG(salary) AS avg_salary,
        COUNT(DISTINCT department) AS departments_found
    FROM migrated_data
)
SELECT 
    'Successfully migrated ' || migrated_count || ' employees' AS summary,
    'Salary range: $' || min_salary || ' - $' || max_salary AS salary_range,
    'Average salary: $' || ROUND(avg_salary, 2) AS avg_sal,
    'Departments: ' || departments_found AS dept_count
FROM migration_summary;
```

### 3. Batch Processing with Progress Tracking

```sql
-- Process records in batches with progress reporting
CREATE OR REPLACE FUNCTION process_employee_batch(batch_size INTEGER DEFAULT 100)
RETURNS TABLE (
    batch_number INTEGER,
    processed_count INTEGER,
    avg_salary_increase DECIMAL(10,2),
    processing_time INTERVAL
) AS $$
DECLARE
    start_time TIMESTAMP;
    current_batch INTEGER := 1;
    rows_affected INTEGER;
BEGIN
    LOOP
        start_time := CLOCK_TIMESTAMP();
        
        -- Process batch
        WITH batch_update AS (
            UPDATE employees 
            SET salary = salary * 1.03  -- 3% increase
            WHERE id IN (
                SELECT id FROM employees 
                WHERE salary < 100000
                ORDER BY id
                LIMIT batch_size
                OFFSET (current_batch - 1) * batch_size
            )
            RETURNING 
                id, 
                salary,
                salary / 1.03 AS old_salary
        )
        SELECT 
            current_batch,
            COUNT(*),
            AVG(salary - old_salary),
            CLOCK_TIMESTAMP() - start_time
        FROM batch_update
        INTO batch_number, processed_count, avg_salary_increase, processing_time;
        
        -- Exit if no more rows to process
        EXIT WHEN processed_count = 0;
        
        RETURN NEXT;
        current_batch := current_batch + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM process_employee_batch(50);
```

## Performance Considerations

### 1. Efficient Data Collection

```sql
-- Instead of separate INSERT + SELECT
-- Less efficient:
INSERT INTO employees (name, email) VALUES ('Test', 'test@example.com');
SELECT id, created_at FROM employees WHERE email = 'test@example.com';

-- More efficient:
INSERT INTO employees (name, email) 
VALUES ('Test', 'test@example.com')
RETURNING id, created_at;
```

### 2. Minimizing RETURNING Data

```sql
-- Return only needed columns for better performance
UPDATE employees 
SET salary = salary * 1.1
WHERE department = 'Engineering'
RETURNING id, salary;  -- Only return what you need

-- Avoid returning large text fields unless necessary
-- RETURNING *;  -- Can be inefficient for tables with large columns
```

### 3. Using RETURNING with CTEs for Complex Operations

```sql
-- Efficient complex operation with single round-trip
WITH salary_updates AS (
    UPDATE employees 
    SET salary = salary * 1.1
    WHERE performance_rating = 'excellent'
    RETURNING id, name, salary, department
),
bonus_insertions AS (
    INSERT INTO bonuses (employee_id, amount, bonus_type, granted_date)
    SELECT id, salary * 0.05, 'performance', CURRENT_DATE
    FROM salary_updates
    RETURNING employee_id, amount
)
SELECT 
    su.name,
    su.salary AS new_salary,
    bi.amount AS bonus_amount,
    su.salary + bi.amount AS total_compensation
FROM salary_updates su
JOIN bonus_insertions bi ON su.id = bi.employee_id;
```

## Common Patterns and Best Practices

### 1. Error Handling with RETURNING

```sql
-- Validate operations using RETURNING
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    WITH deleted_rows AS (
        DELETE FROM employees 
        WHERE salary < 50000
        RETURNING id
    )
    SELECT COUNT(*) INTO result_count FROM deleted_rows;
    
    IF result_count = 0 THEN
        RAISE NOTICE 'No employees found with salary below $50,000';
    ELSE
        RAISE NOTICE 'Deleted % employees with low salaries', result_count;
    END IF;
END $$;
```

### 2. Atomic Operations with Validation

```sql
-- Ensure atomic updates with validation
CREATE OR REPLACE FUNCTION transfer_employee(
    emp_id INTEGER,
    new_dept VARCHAR(50)
) RETURNS TABLE(success BOOLEAN, message TEXT, employee_data JSON) AS $$
DECLARE
    result_row RECORD;
BEGIN
    -- Validate department exists
    IF NOT EXISTS (SELECT 1 FROM departments WHERE name = new_dept) THEN
        RETURN QUERY SELECT FALSE, 'Department does not exist', NULL::JSON;
        RETURN;
    END IF;
    
    -- Perform transfer
    UPDATE employees 
    SET department = new_dept
    WHERE id = emp_id
    RETURNING 
        TRUE,
        'Employee successfully transferred',
        JSON_BUILD_OBJECT(
            'id', id,
            'name', name, 
            'new_department', department,
            'transfer_date', CURRENT_DATE
        )
    INTO result_row;
    
    IF result_row IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Employee not found', NULL::JSON;
    ELSE
        RETURN QUERY SELECT result_row.*;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT * FROM transfer_employee(1, 'Engineering');
```

## Summary

The `RETURNING` clause is a powerful PostgreSQL feature that:

**Provides Efficiency:**
- Eliminates need for separate SELECT statements
- Reduces round-trips to database
- Ensures atomic data retrieval

**Supports All DML Operations:**
- INSERT: Get generated IDs, default values, computed columns
- UPDATE: Track changes, calculate differences, validate results
- DELETE: Log deleted data, return cleanup summaries

**Enables Advanced Patterns:**
- Audit trail creation
- Bulk operations with progress tracking
- Upsert operations with conflict resolution
- Cross-table operations in single transactions
- API response generation
- Data migration with validation

**Key Benefits:**
- Atomicity: Get results from the same transaction
- Performance: Single database round-trip
- Flexibility: Return any expression, not just column values
- Integration: Works seamlessly with CTEs and complex queries

The `RETURNING` clause is essential for building efficient, reliable database applications that need to track changes, validate operations, and provide immediate feedback on data modifications.