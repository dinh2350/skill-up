# 42. What is normalization? Explain different normal forms.

## What is Normalization?

**Normalization** is a database design technique that organizes tables to reduce data redundancy and improve data integrity. It involves decomposing a table into multiple related tables and defining relationships between them to eliminate redundant data.

### Goals of Normalization:

- **Eliminate Redundancy**: Remove duplicate data
- **Ensure Data Integrity**: Maintain consistency across the database
- **Reduce Storage Space**: Minimize wasted storage
- **Prevent Update Anomalies**: Avoid inconsistencies during data modifications
- **Improve Database Performance**: Optimize queries and maintenance

## Normal Forms

Normal forms are rules that define the level of normalization. Each normal form builds upon the previous one.

### 1. First Normal Form (1NF)

A table is in 1NF if:

- Each column contains atomic (indivisible) values
- No repeating groups or arrays
- Each row is unique

**Example - Violation of 1NF:**

```sql
-- BAD: Multiple phone numbers in one column
CREATE TABLE employees_bad (
    emp_id INT,
    emp_name VARCHAR(50),
    phone_numbers VARCHAR(100) -- "123-456-7890, 098-765-4321"
);
```

**Example - Following 1NF:**

```sql
-- GOOD: Each phone number in separate row
CREATE TABLE employees (
    emp_id INT,
    emp_name VARCHAR(50)
);

CREATE TABLE employee_phones (
    emp_id INT,
    phone_number VARCHAR(15),
    phone_type VARCHAR(10) -- 'home', 'work', 'mobile'
);
```

### 2. Second Normal Form (2NF)

A table is in 2NF if:

- It's in 1NF
- All non-key attributes are fully functionally dependent on the primary key
- No partial dependencies (applies to composite primary keys)

**Example - Violation of 2NF:**

```sql
-- BAD: course_name depends only on course_id, not the full primary key
CREATE TABLE student_courses_bad (
    student_id INT,
    course_id INT,
    course_name VARCHAR(50),  -- Depends only on course_id
    grade CHAR(1),
    PRIMARY KEY (student_id, course_id)
);
```

**Example - Following 2NF:**

```sql
-- GOOD: Separate tables for students, courses, and enrollments
CREATE TABLE students (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(50)
);

CREATE TABLE courses (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(50)
);

CREATE TABLE enrollments (
    student_id INT,
    course_id INT,
    grade CHAR(1),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

### 3. Third Normal Form (3NF)

A table is in 3NF if:

- It's in 2NF
- No transitive dependencies (non-key attributes don't depend on other non-key attributes)

**Example - Violation of 3NF:**

```sql
-- BAD: department_name depends on department_id, not directly on emp_id
CREATE TABLE employees_bad (
    emp_id INT PRIMARY KEY,
    emp_name VARCHAR(50),
    department_id INT,
    department_name VARCHAR(50)  -- Transitive dependency
);
```

**Example - Following 3NF:**

```sql
-- GOOD: Remove transitive dependency
CREATE TABLE departments (
    department_id INT PRIMARY KEY,
    department_name VARCHAR(50)
);

CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    emp_name VARCHAR(50),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
```

### 4. Boyce-Codd Normal Form (BCNF)

A table is in BCNF if:

- It's in 3NF
- Every determinant is a candidate key
- No overlapping candidate keys

**Example - Violation of BCNF:**

```sql
-- BAD: professor determines subject, but professor is not a candidate key
CREATE TABLE class_schedule_bad (
    student_id INT,
    subject VARCHAR(50),
    professor VARCHAR(50),
    PRIMARY KEY (student_id, subject)
);
-- Assumption: Each professor teaches only one subject
-- Problem: professor → subject, but professor is not a candidate key
```

**Example - Following BCNF:**

```sql
-- GOOD: Separate the professor-subject relationship
CREATE TABLE professors (
    professor_id INT PRIMARY KEY,
    professor_name VARCHAR(50),
    subject VARCHAR(50)
);

CREATE TABLE class_schedule (
    student_id INT,
    professor_id INT,
    PRIMARY KEY (student_id, professor_id),
    FOREIGN KEY (professor_id) REFERENCES professors(professor_id)
);
```

### 5. Fourth Normal Form (4NF)

A table is in 4NF if:

- It's in BCNF
- No multi-valued dependencies
- Each non-key attribute depends on the key, the whole key, and nothing but the key

**Example - Violation of 4NF:**

```sql
-- BAD: Multi-valued dependencies (skills and languages are independent)
CREATE TABLE employee_skills_languages_bad (
    emp_id INT,
    skill VARCHAR(50),
    language VARCHAR(50),
    PRIMARY KEY (emp_id, skill, language)
);
-- Problem: Skills and languages are independent of each other
```

**Example - Following 4NF:**

```sql
-- GOOD: Separate multi-valued dependencies
CREATE TABLE employee_skills (
    emp_id INT,
    skill VARCHAR(50),
    PRIMARY KEY (emp_id, skill)
);

CREATE TABLE employee_languages (
    emp_id INT,
    language VARCHAR(50),
    PRIMARY KEY (emp_id, language)
);
```

### 6. Fifth Normal Form (5NF)

A table is in 5NF if:

- It's in 4NF
- No join dependencies
- Cannot be decomposed into smaller tables without losing information

**Example - 5NF decomposition:**

```sql
-- Complex relationship: suppliers, parts, and projects
CREATE TABLE supplier_part_project (
    supplier_id INT,
    part_id INT,
    project_id INT,
    PRIMARY KEY (supplier_id, part_id, project_id)
);

-- If this can be reconstructed from these three tables:
CREATE TABLE supplier_part (
    supplier_id INT,
    part_id INT,
    PRIMARY KEY (supplier_id, part_id)
);

CREATE TABLE part_project (
    part_id INT,
    project_id INT,
    PRIMARY KEY (part_id, project_id)
);

CREATE TABLE supplier_project (
    supplier_id INT,
    project_id INT,
    PRIMARY KEY (supplier_id, project_id)
);
```

## When to Denormalize

While normalization is generally good, sometimes **denormalization** is necessary for:

### Performance Reasons:

- **Read-heavy applications**: Fewer JOINs needed
- **Reporting systems**: Aggregated data storage
- **Caching**: Pre-computed values

### Common Denormalization Techniques:

```sql
-- Example: Store calculated values
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_total DECIMAL(10,2), -- Denormalized: sum of order_items
    order_date DATE
);

-- Example: Store lookup values
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100),
    category_id INT,
    category_name VARCHAR(50) -- Denormalized: from categories table
);
```

## Best Practices

1. **Start with 3NF**: Most applications benefit from 3NF
2. **Consider BCNF**: When you have complex dependencies
3. **Monitor Performance**: Denormalize if joins become too expensive
4. **Use Views**: Create denormalized views while keeping normalized tables
5. **Document Decisions**: Keep track of denormalization choices

### Example of Using Views for Denormalization:

```sql
-- Normalized tables
CREATE TABLE customers (id INT, name VARCHAR(50), city_id INT);
CREATE TABLE cities (id INT, name VARCHAR(50), state_id INT);
CREATE TABLE states (id INT, name VARCHAR(50));

-- Denormalized view for reporting
CREATE VIEW customer_details AS
SELECT
    c.id,
    c.name AS customer_name,
    ci.name AS city_name,
    s.name AS state_name
FROM customers c
JOIN cities ci ON c.city_id = ci.id
JOIN states s ON ci.state_id = s.id;
```

## Summary

- **1NF**: Atomic values, no repeating groups
- **2NF**: 1NF + no partial dependencies
- **3NF**: 2NF + no transitive dependencies
- **BCNF**: 3NF + every determinant is a candidate key
- **4NF**: BCNF + no multi-valued dependencies
- **5NF**: 4NF + no join dependencies

**Key Takeaway**: Normalization reduces redundancy and improves integrity, but consider performance trade-offs and business requirements when choosing the appropriate level of normalization.
