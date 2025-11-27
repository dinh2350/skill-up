# 100. What are triggers?

## Definition

A trigger in PostgreSQL is a special kind of stored procedure that automatically executes (or "fires") in response to specific database events. Triggers are database objects that run automatically when certain operations occur on a table or view, such as INSERT, UPDATE, DELETE, or TRUNCATE operations.

## Key Characteristics

Triggers are:
- **Event-driven**: Execute automatically in response to database events
- **Transparent**: Applications don't directly call triggers
- **Atomic**: Part of the triggering transaction
- **Cascadable**: Can trigger other triggers
- **Flexible**: Can execute before, after, or instead of the triggering event

## Types of Triggers

### By Timing

```sql
-- BEFORE triggers: Execute before the triggering event
CREATE TRIGGER trigger_name
    BEFORE INSERT OR UPDATE OR DELETE ON table_name
    FOR EACH ROW EXECUTE FUNCTION function_name();

-- AFTER triggers: Execute after the triggering event
CREATE TRIGGER trigger_name
    AFTER INSERT OR UPDATE OR DELETE ON table_name
    FOR EACH ROW EXECUTE FUNCTION function_name();

-- INSTEAD OF triggers: Replace the triggering event (views only)
CREATE TRIGGER trigger_name
    INSTEAD OF INSERT OR UPDATE OR DELETE ON view_name
    FOR EACH ROW EXECUTE FUNCTION function_name();
```

### By Level

```sql
-- ROW-level triggers: Fire once for each affected row
CREATE TRIGGER audit_employee_changes
    AFTER UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION log_employee_change();

-- STATEMENT-level triggers: Fire once per triggering statement
CREATE TRIGGER validate_bulk_operation
    BEFORE DELETE ON employees
    FOR EACH STATEMENT EXECUTE FUNCTION check_bulk_delete();
```

## Creating Trigger Functions

### Basic Trigger Function Structure

```sql
-- Trigger functions must return TRIGGER type
CREATE OR REPLACE FUNCTION trigger_function_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Trigger logic here
    
    -- For BEFORE triggers on INSERT/UPDATE: return NEW or NULL
    -- For BEFORE triggers on DELETE: return OLD or NULL
    -- For AFTER triggers: return value is ignored
    -- For INSTEAD OF triggers: return NEW, OLD, or NULL
    
    RETURN NEW; -- or OLD, or NULL
END;
$$ LANGUAGE plpgsql;
```

### Available Variables in Trigger Functions

```sql
CREATE OR REPLACE FUNCTION demo_trigger_variables()
RETURNS TRIGGER AS $$
BEGIN
    -- TG_OP: Operation type (INSERT, UPDATE, DELETE, TRUNCATE)
    RAISE NOTICE 'Operation: %', TG_OP;
    
    -- TG_WHEN: Timing (BEFORE, AFTER, INSTEAD OF)
    RAISE NOTICE 'When: %', TG_WHEN;
    
    -- TG_LEVEL: Level (ROW, STATEMENT)  
    RAISE NOTICE 'Level: %', TG_LEVEL;
    
    -- TG_TABLE_NAME: Name of the table that triggered
    RAISE NOTICE 'Table: %', TG_TABLE_NAME;
    
    -- TG_TABLE_SCHEMA: Schema of the triggering table
    RAISE NOTICE 'Schema: %', TG_TABLE_SCHEMA;
    
    -- NEW: New row (INSERT/UPDATE)
    -- OLD: Old row (UPDATE/DELETE)
    IF TG_OP = 'INSERT' THEN
        RAISE NOTICE 'New row ID: %', NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        RAISE NOTICE 'Old ID: %, New ID: %', OLD.id, NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        RAISE NOTICE 'Deleted row ID: %', OLD.id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## Common Trigger Use Cases

### 1. Audit Trail Implementation

```sql
-- Create audit table
CREATE TABLE employee_audit (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(50),
    operation VARCHAR(10),
    user_name VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB
);

-- Create employees table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    salary DECIMAL(10,2),
    department VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit record
    INSERT INTO employee_audit (
        table_name,
        operation,
        user_name,
        old_values,
        new_values
    )
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        current_user,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW)::jsonb 
             WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW)::jsonb 
             ELSE NULL END
    );
    
    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER employee_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_employee_changes();

-- Test the audit trail
INSERT INTO employees (name, email, salary, department) 
VALUES ('John Doe', 'john@company.com', 75000, 'Engineering');

UPDATE employees SET salary = 80000 WHERE name = 'John Doe';

DELETE FROM employees WHERE name = 'John Doe';

-- View audit records
SELECT 
    audit_id,
    operation,
    user_name,
    timestamp,
    old_values->>'name' AS old_name,
    new_values->>'name' AS new_name,
    old_values->>'salary' AS old_salary,
    new_values->>'salary' AS new_salary
FROM employee_audit 
ORDER BY audit_id;
```

### 2. Automatic Timestamp Updates

```sql
-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to employees table
CREATE TRIGGER update_employee_timestamp
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Test timestamp update
UPDATE employees SET department = 'Senior Engineering' WHERE id = 1;
SELECT name, department, updated_at FROM employees WHERE id = 1;
```

### 3. Data Validation and Business Rules

```sql
-- Validation trigger function
CREATE OR REPLACE FUNCTION validate_employee_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Salary validation
    IF NEW.salary IS NOT NULL AND NEW.salary < 0 THEN
        RAISE EXCEPTION 'Salary cannot be negative: %', NEW.salary;
    END IF;
    
    -- Email format validation
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', NEW.email;
    END IF;
    
    -- Department validation
    IF NEW.department IS NOT NULL AND NEW.department NOT IN 
       ('Engineering', 'Marketing', 'Sales', 'HR', 'Finance') THEN
        RAISE EXCEPTION 'Invalid department: %. Must be one of: Engineering, Marketing, Sales, HR, Finance', 
                       NEW.department;
    END IF;
    
    -- Salary cap by department
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.salary != OLD.salary) THEN
        IF NEW.department = 'HR' AND NEW.salary > 90000 THEN
            RAISE EXCEPTION 'HR salary cannot exceed $90,000. Attempted: $%', NEW.salary;
        ELSIF NEW.department = 'Sales' AND NEW.salary > 120000 THEN
            RAISE EXCEPTION 'Sales salary cannot exceed $120,000. Attempted: $%', NEW.salary;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger
CREATE TRIGGER validate_employee_trigger
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION validate_employee_data();

-- Test validation
INSERT INTO employees (name, email, salary, department) 
VALUES ('Test User', 'invalid-email', -1000, 'InvalidDept');
-- ERROR: Invalid email format: invalid-email

INSERT INTO employees (name, email, salary, department) 
VALUES ('HR User', 'hr@company.com', 95000, 'HR');
-- ERROR: HR salary cannot exceed $90,000. Attempted: $95000
```

### 4. Automatic Data Derivation

```sql
-- Add computed columns to employees
ALTER TABLE employees ADD COLUMN full_name_upper VARCHAR(200);
ALTER TABLE employees ADD COLUMN annual_salary DECIMAL(12,2);
ALTER TABLE employees ADD COLUMN salary_grade CHAR(1);

-- Function to derive computed values
CREATE OR REPLACE FUNCTION compute_employee_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Convert name to uppercase
    NEW.full_name_upper = UPPER(NEW.name);
    
    -- Calculate annual salary (assuming monthly salary)
    NEW.annual_salary = NEW.salary * 12;
    
    -- Assign salary grade
    NEW.salary_grade = CASE 
        WHEN NEW.salary < 60000 THEN 'C'
        WHEN NEW.salary < 90000 THEN 'B'
        ELSE 'A'
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create computation trigger
CREATE TRIGGER compute_employee_fields_trigger
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION compute_employee_fields();

-- Test computed fields
INSERT INTO employees (name, email, salary, department) 
VALUES ('Alice Johnson', 'alice@company.com', 85000, 'Engineering');

SELECT name, full_name_upper, annual_salary, salary_grade 
FROM employees WHERE name = 'Alice Johnson';
```

### 5. Cascading Updates and Referential Actions

```sql
-- Create related tables
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE,
    budget DECIMAL(12,2),
    head_count INTEGER DEFAULT 0
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    department_id INTEGER REFERENCES departments(id),
    total_budget DECIMAL(12,2),
    allocated_budget DECIMAL(12,2) DEFAULT 0
);

-- Add foreign key to employees
ALTER TABLE employees ADD COLUMN department_id INTEGER REFERENCES departments(id);

-- Function to update department head count
CREATE OR REPLACE FUNCTION update_department_headcount()
RETURNS TRIGGER AS $$
DECLARE
    dept_id INTEGER;
BEGIN
    -- Determine which department to update
    IF TG_OP = 'INSERT' THEN
        dept_id = NEW.department_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle department transfers
        IF OLD.department_id != NEW.department_id THEN
            -- Decrease old department count
            UPDATE departments 
            SET head_count = head_count - 1 
            WHERE id = OLD.department_id;
            
            dept_id = NEW.department_id;
        ELSE
            RETURN NEW; -- No department change
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        dept_id = OLD.department_id;
    END IF;
    
    -- Update head count
    IF TG_OP = 'DELETE' THEN
        UPDATE departments 
        SET head_count = head_count - 1 
        WHERE id = dept_id;
        RETURN OLD;
    ELSE
        UPDATE departments 
        SET head_count = head_count + 1 
        WHERE id = dept_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create department headcount trigger
CREATE TRIGGER department_headcount_trigger
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_department_headcount();
```

### 6. Preventing Unauthorized Operations

```sql
-- Function to prevent deletions during business hours
CREATE OR REPLACE FUNCTION prevent_business_hours_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if it's business hours (9 AM to 5 PM, Monday to Friday)
    IF EXTRACT(DOW FROM CURRENT_TIMESTAMP) BETWEEN 1 AND 5 -- Monday to Friday
       AND EXTRACT(HOUR FROM CURRENT_TIMESTAMP) BETWEEN 9 AND 17 THEN
        RAISE EXCEPTION 'Employee deletions are not allowed during business hours (9 AM - 5 PM, Monday-Friday)';
    END IF;
    
    -- Check if user has permission (example)
    IF current_user NOT IN ('hr_manager', 'admin') THEN
        RAISE EXCEPTION 'Only HR managers and admins can delete employee records';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create security trigger
CREATE TRIGGER prevent_employee_deletion_trigger
    BEFORE DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION prevent_business_hours_deletion();
```

### 7. Complex Business Logic Implementation

```sql
-- Complex business logic: Employee bonus calculation
CREATE TABLE employee_bonuses (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    bonus_amount DECIMAL(10,2),
    bonus_type VARCHAR(50),
    calculated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    year INTEGER
);

CREATE OR REPLACE FUNCTION calculate_annual_bonus()
RETURNS TRIGGER AS $$
DECLARE
    years_employed INTEGER;
    performance_rating DECIMAL(2,1);
    bonus_amount DECIMAL(10,2);
    bonus_type VARCHAR(50);
BEGIN
    -- Only calculate bonus on salary updates
    IF TG_OP = 'UPDATE' AND (OLD.salary IS DISTINCT FROM NEW.salary) THEN
        
        -- Calculate years employed (simplified)
        years_employed := EXTRACT(YEAR FROM CURRENT_DATE) - 
                         EXTRACT(YEAR FROM COALESCE(NEW.hire_date, CURRENT_DATE));
        
        -- Get performance rating (would normally come from performance table)
        performance_rating := 4.2; -- Mock rating
        
        -- Calculate bonus based on complex rules
        bonus_amount := CASE 
            WHEN years_employed >= 5 AND performance_rating >= 4.0 THEN
                NEW.salary * 0.15  -- 15% bonus for senior high performers
            WHEN years_employed >= 3 AND performance_rating >= 3.5 THEN  
                NEW.salary * 0.10  -- 10% bonus for experienced good performers
            WHEN performance_rating >= 4.0 THEN
                NEW.salary * 0.08  -- 8% bonus for high performers
            WHEN performance_rating >= 3.0 THEN
                NEW.salary * 0.05  -- 5% bonus for average performers
            ELSE
                0 -- No bonus for poor performers
        END;
        
        bonus_type := CASE
            WHEN years_employed >= 5 THEN 'Senior Performance Bonus'
            WHEN performance_rating >= 4.0 THEN 'High Performance Bonus' 
            ELSE 'Standard Performance Bonus'
        END;
        
        -- Insert bonus record if applicable
        IF bonus_amount > 0 THEN
            INSERT INTO employee_bonuses (
                employee_id, 
                bonus_amount, 
                bonus_type, 
                year
            ) VALUES (
                NEW.id, 
                bonus_amount, 
                bonus_type, 
                EXTRACT(YEAR FROM CURRENT_DATE)
            );
            
            RAISE NOTICE 'Bonus calculated for %: $% (%)', 
                        NEW.name, bonus_amount, bonus_type;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create bonus calculation trigger
CREATE TRIGGER calculate_bonus_trigger
    AFTER UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION calculate_annual_bonus();
```

## Advanced Trigger Concepts

### 1. Conditional Triggers

```sql
-- Trigger that only fires for specific conditions
CREATE OR REPLACE FUNCTION conditional_audit()
RETURNS TRIGGER AS $$
BEGIN
    -- Only audit changes to sensitive fields
    IF TG_OP = 'UPDATE' THEN
        IF OLD.salary IS DISTINCT FROM NEW.salary OR 
           OLD.department IS DISTINCT FROM NEW.department THEN
            INSERT INTO employee_audit (
                table_name, operation, user_name, 
                old_values, new_values
            ) VALUES (
                TG_TABLE_NAME, TG_OP, current_user,
                row_to_json(OLD)::jsonb,
                row_to_json(NEW)::jsonb
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create conditional trigger with WHEN clause
CREATE TRIGGER conditional_audit_trigger
    AFTER UPDATE ON employees
    FOR EACH ROW 
    WHEN (OLD.salary IS DISTINCT FROM NEW.salary OR 
          OLD.department IS DISTINCT FROM NEW.department)
    EXECUTE FUNCTION conditional_audit();
```

### 2. Statement-Level Triggers

```sql
-- Statement-level trigger for bulk operation validation
CREATE OR REPLACE FUNCTION validate_bulk_operations()
RETURNS TRIGGER AS $$
DECLARE
    operation_count INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Count how many rows will be affected
        SELECT COUNT(*) INTO operation_count 
        FROM employees 
        WHERE id IN (
            SELECT id FROM employees 
            -- This is simplified; in practice you'd need to reconstruct the WHERE clause
        );
        
        -- Prevent bulk deletions of more than 10 records
        IF operation_count > 10 THEN
            RAISE EXCEPTION 'Bulk deletion of more than 10 employees requires special authorization';
        END IF;
        
        RAISE NOTICE 'Bulk delete operation will affect % employees', operation_count;
    END IF;
    
    RETURN NULL; -- Statement-level triggers ignore return value
END;
$$ LANGUAGE plpgsql;

-- Create statement-level trigger
CREATE TRIGGER validate_bulk_delete_trigger
    BEFORE DELETE ON employees
    FOR EACH STATEMENT EXECUTE FUNCTION validate_bulk_operations();
```

### 3. INSTEAD OF Triggers (for Views)

```sql
-- Create a view for employee summary
CREATE VIEW employee_summary AS
SELECT 
    e.id,
    e.name,
    e.email,
    e.salary,
    d.name AS department_name,
    d.budget AS department_budget
FROM employees e
JOIN departments d ON e.department_id = d.id;

-- Create INSTEAD OF trigger for the view
CREATE OR REPLACE FUNCTION employee_summary_instead_of()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Handle INSERT into view
        INSERT INTO employees (name, email, salary, department_id)
        SELECT NEW.name, NEW.email, NEW.salary, d.id
        FROM departments d
        WHERE d.name = NEW.department_name;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle UPDATE through view
        UPDATE employees 
        SET name = NEW.name, 
            email = NEW.email, 
            salary = NEW.salary,
            department_id = (SELECT id FROM departments WHERE name = NEW.department_name)
        WHERE id = OLD.id;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Handle DELETE through view
        DELETE FROM employees WHERE id = OLD.id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create INSTEAD OF trigger
CREATE TRIGGER employee_summary_instead_of_trigger
    INSTEAD OF INSERT OR UPDATE OR DELETE ON employee_summary
    FOR EACH ROW EXECUTE FUNCTION employee_summary_instead_of();

-- Now you can INSERT/UPDATE/DELETE through the view
INSERT INTO employee_summary (name, email, salary, department_name)
VALUES ('Bob Smith', 'bob@company.com', 70000, 'Engineering');
```

### 4. Trigger Ordering and Dependencies

```sql
-- Create multiple triggers with different priorities
CREATE OR REPLACE FUNCTION log_operation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'Log trigger: % operation on %', TG_OP, TG_TABLE_NAME;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_operation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'Validation trigger: % operation on %', TG_OP, TG_TABLE_NAME;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers with specific ordering (alphabetical by default)
CREATE TRIGGER a_validate_first
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION validate_operation();

CREATE TRIGGER b_log_second  
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION log_operation();

-- Triggers fire in alphabetical order: a_validate_first, then b_log_second
```

## Trigger Management

### Viewing Trigger Information

```sql
-- List all triggers
SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name,
    n.nspname AS schema_name,
    p.proname AS function_name,
    CASE t.tgtype & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS timing,
    CASE t.tgtype & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'  
        WHEN 12 THEN 'INSERT, DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 20 THEN 'INSERT, UPDATE'
        WHEN 24 THEN 'UPDATE, DELETE'
        WHEN 28 THEN 'INSERT, UPDATE, DELETE'
    END AS events,
    CASE t.tgtype & 1
        WHEN 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END AS level,
    t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal  -- Exclude system triggers
ORDER BY n.nspname, c.relname, t.tgname;

-- Get detailed trigger definition
SELECT pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger 
WHERE tgname = 'your_trigger_name';
```

### Disabling and Enabling Triggers

```sql
-- Disable a specific trigger
ALTER TABLE employees DISABLE TRIGGER audit_employee_changes;

-- Enable a specific trigger
ALTER TABLE employees ENABLE TRIGGER audit_employee_changes;

-- Disable all triggers on a table
ALTER TABLE employees DISABLE TRIGGER ALL;

-- Enable all triggers on a table
ALTER TABLE employees ENABLE TRIGGER ALL;

-- Disable all triggers on a table except replica triggers
ALTER TABLE employees DISABLE TRIGGER USER;
```

### Dropping Triggers

```sql
-- Drop a specific trigger
DROP TRIGGER IF EXISTS audit_employee_changes ON employees;

-- Drop trigger and its function
DROP TRIGGER IF EXISTS audit_employee_changes ON employees;
DROP FUNCTION IF EXISTS audit_employee_changes();
```

## Performance Considerations

### 1. Efficient Trigger Design

```sql
-- Efficient trigger: Only process necessary operations
CREATE OR REPLACE FUNCTION efficient_audit()
RETURNS TRIGGER AS $$
BEGIN
    -- Quick exit for operations we don't care about
    IF TG_OP = 'UPDATE' AND OLD = NEW THEN
        RETURN NEW; -- No actual changes
    END IF;
    
    -- Only audit specific columns
    IF TG_OP = 'UPDATE' AND NOT (
        OLD.salary IS DISTINCT FROM NEW.salary OR
        OLD.department IS DISTINCT FROM NEW.department
    ) THEN
        RETURN NEW; -- No relevant changes
    END IF;
    
    -- Efficient logging
    INSERT INTO employee_audit (operation, employee_id, changes)
    VALUES (TG_OP, NEW.id, 
        CASE TG_OP
            WHEN 'INSERT' THEN jsonb_build_object('action', 'created')
            WHEN 'UPDATE' THEN jsonb_build_object(
                'salary_from', OLD.salary, 'salary_to', NEW.salary,
                'dept_from', OLD.department, 'dept_to', NEW.department
            )
            WHEN 'DELETE' THEN jsonb_build_object('action', 'deleted')
        END);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### 2. Avoiding Infinite Loops

```sql
-- Use a flag to prevent recursive triggers
CREATE OR REPLACE FUNCTION safe_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for special marker to avoid recursion
    IF NEW.updated_by_trigger IS TRUE THEN
        NEW.updated_by_trigger := FALSE;
        RETURN NEW;
    END IF;
    
    -- Perform update with marker
    UPDATE employees 
    SET some_field = computed_value,
        updated_by_trigger = TRUE
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Alternative: Use session variables
CREATE OR REPLACE FUNCTION safe_trigger_with_session_var()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if we're already in trigger processing
    IF current_setting('myapp.in_trigger', true) = 'true' THEN
        RETURN NEW;
    END IF;
    
    -- Set flag and perform operations
    PERFORM set_config('myapp.in_trigger', 'true', true);
    
    -- Do trigger work here
    
    -- Reset flag
    PERFORM set_config('myapp.in_trigger', 'false', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Best Practices

### 1. Keep Triggers Simple and Fast

```sql
-- Good: Simple, fast trigger
CREATE OR REPLACE FUNCTION simple_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Avoid: Complex, slow operations in triggers
-- Don't do heavy calculations, external API calls, or complex queries
```

### 2. Use Appropriate Trigger Timing

```sql
-- Use BEFORE triggers for:
-- - Data validation
-- - Data modification before storage
-- - Preventing operations

-- Use AFTER triggers for:
-- - Audit logging
-- - Notifications
-- - Cascading updates to other tables

-- Use INSTEAD OF triggers for:
-- - Making views updatable
-- - Complex view logic
```

### 3. Error Handling in Triggers

```sql
CREATE OR REPLACE FUNCTION robust_trigger()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        -- Trigger logic here
        INSERT INTO log_table (message) VALUES ('Processing ' || TG_OP);
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't fail the transaction
            INSERT INTO error_log (error_message, occurred_at) 
            VALUES (SQLERRM, CURRENT_TIMESTAMP);
            
            -- Re-raise if critical, or continue if non-critical
            -- RAISE; -- Uncomment to fail the transaction
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

## Summary

PostgreSQL triggers are powerful database objects that:

**Provide Automation:**
- Automatically execute in response to database events
- Implement business rules at the database level
- Ensure data consistency and integrity

**Support Multiple Types:**
- **Timing**: BEFORE, AFTER, INSTEAD OF
- **Events**: INSERT, UPDATE, DELETE, TRUNCATE
- **Level**: ROW-level, STATEMENT-level

**Common Use Cases:**
- Audit trails and change logging
- Data validation and business rules
- Automatic timestamp updates
- Cascading updates and referential actions
- Security and access control
- Complex business logic implementation

**Key Benefits:**
- Transparent to applications
- Guaranteed execution (part of transaction)
- Centralized business rules
- Data integrity enforcement

**Best Practices:**
- Keep triggers simple and fast
- Avoid complex logic and external dependencies
- Use appropriate timing (BEFORE vs AFTER)
- Handle errors gracefully
- Be mindful of performance impact
- Document trigger dependencies and ordering

Triggers are essential for maintaining data integrity and implementing business rules that must be enforced at the database level, regardless of how applications access the data.