# 85. What is a many-to-many relationship?

## Definition

A **many-to-many (M:N) relationship** is a database relationship where multiple records in one table can be associated with multiple records in another table. For example, a student can enroll in many courses, and each course can have many students enrolled.

## Characteristics

- **Bidirectional multiplicity**: Many records on both sides
- **Cannot be directly implemented**: Requires a junction/bridge table
- **Three tables involved**: Two entity tables and one junction table
- **Composite relationships**: Combines two one-to-many relationships
- **Common in real-world scenarios**: Students-Courses, Products-Tags, Actors-Movies

## Visual Representation

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Table A    │         │  Junction Table  │         │   Table B    │
├──────────────┤         ├──────────────────┤         ├──────────────┤
│ id (PK)      │───1:N───│ table_a_id (FK)  │───N:1───│ id (PK)      │
│ ...          │         │ table_b_id (FK)  │         │ ...          │
└──────────────┘         │ PK(a_id, b_id)   │         └──────────────┘
                         │ ...              │
                         └──────────────────┘

Many A records ↔ Many B records
Through junction table
```

## Why Junction Table is Needed

### ❌ Cannot Do This (violates normalization):

```sql
-- BAD: Storing multiple values in a column
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    student_name VARCHAR(100),
    course_ids VARCHAR(255)  -- "1,3,5,7" - NOT normalized!
);
```

### ✅ Correct Implementation:

```sql
-- Entity tables
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    student_name VARCHAR(100)
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100)
);

-- Junction table
CREATE TABLE student_courses (
    student_id INT,
    course_id INT,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

## Basic Implementation

### Students and Courses Example

```sql
-- First entity table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE
);

-- Second entity table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(10) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    department VARCHAR(50)
);

-- Junction table (also called bridge, linking, or associative table)
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade CHAR(2),  -- Additional attributes of the relationship
    semester VARCHAR(20),
    PRIMARY KEY (student_id, course_id),  -- Composite primary key
    FOREIGN KEY (student_id) REFERENCES students(student_id) 
        ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) 
        ON DELETE CASCADE
);

-- Create indexes on foreign keys for better performance
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- Insert sample data
INSERT INTO students (first_name, last_name, email) VALUES
    ('Alice', 'Johnson', 'alice@university.edu'),
    ('Bob', 'Smith', 'bob@university.edu'),
    ('Carol', 'Williams', 'carol@university.edu');

INSERT INTO courses (course_code, course_name, credits, department) VALUES
    ('CS101', 'Introduction to Programming', 3, 'Computer Science'),
    ('MATH201', 'Calculus II', 4, 'Mathematics'),
    ('ENG102', 'English Composition', 3, 'English');

INSERT INTO enrollments (student_id, course_id, semester, grade) VALUES
    (1, 1, 'Fall 2024', 'A'),   -- Alice enrolled in CS101
    (1, 2, 'Fall 2024', 'B+'),  -- Alice enrolled in MATH201
    (2, 1, 'Fall 2024', 'A-'),  -- Bob enrolled in CS101
    (2, 3, 'Fall 2024', NULL),  -- Bob enrolled in ENG102 (no grade yet)
    (3, 2, 'Fall 2024', 'A'),   -- Carol enrolled in MATH201
    (3, 3, 'Fall 2024', 'B');   -- Carol enrolled in ENG102
```

## Common Examples

### 1. Products and Tags

```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT
);

CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE product_tags (
    product_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id) 
        ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_product_tags_product ON product_tags(product_id);
CREATE INDEX idx_product_tags_tag ON product_tags(tag_id);

-- Query: Get products with their tags
SELECT 
    p.product_id,
    p.product_name,
    STRING_AGG(t.tag_name, ', ' ORDER BY t.tag_name) AS tags
FROM products p
LEFT JOIN product_tags pt ON p.product_id = pt.product_id
LEFT JOIN tags t ON pt.tag_id = t.tag_id
GROUP BY p.product_id, p.product_name;

-- Query: Get tag with product count
SELECT 
    t.tag_name,
    COUNT(pt.product_id) AS product_count
FROM tags t
LEFT JOIN product_tags pt ON t.tag_id = pt.tag_id
GROUP BY t.tag_id, t.tag_name
ORDER BY product_count DESC;
```

### 2. Authors and Books (Multiple Authors per Book)

```sql
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    biography TEXT
);

CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    isbn VARCHAR(13) UNIQUE NOT NULL,
    publication_date DATE,
    publisher VARCHAR(100)
);

CREATE TABLE book_authors (
    book_id INT NOT NULL,
    author_id INT NOT NULL,
    author_order INT,  -- 1st author, 2nd author, etc.
    contribution_type VARCHAR(50) DEFAULT 'author',  -- 'author', 'editor', 'contributor'
    PRIMARY KEY (book_id, author_id),
    FOREIGN KEY (book_id) REFERENCES books(book_id) 
        ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(author_id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_book_authors_book ON book_authors(book_id);
CREATE INDEX idx_book_authors_author ON book_authors(author_id);

-- Query: Books with multiple authors
SELECT 
    b.title,
    STRING_AGG(
        a.first_name || ' ' || a.last_name, 
        ', ' 
        ORDER BY ba.author_order
    ) AS authors
FROM books b
JOIN book_authors ba ON b.book_id = ba.book_id
JOIN authors a ON ba.author_id = a.author_id
GROUP BY b.book_id, b.title;
```

### 3. Actors and Movies

```sql
CREATE TABLE actors (
    actor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birth_date DATE,
    nationality VARCHAR(50)
);

CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    release_year INT,
    genre VARCHAR(50),
    duration_minutes INT
);

CREATE TABLE movie_cast (
    movie_id INT NOT NULL,
    actor_id INT NOT NULL,
    character_name VARCHAR(100),
    role_type VARCHAR(20) DEFAULT 'actor',  -- 'lead', 'supporting', 'cameo'
    billing_order INT,  -- Order in credits
    PRIMARY KEY (movie_id, actor_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) 
        ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES actors(actor_id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_movie_cast_movie ON movie_cast(movie_id);
CREATE INDEX idx_movie_cast_actor ON movie_cast(actor_id);

-- Query: Actor filmography
SELECT 
    a.first_name || ' ' || a.last_name AS actor_name,
    m.title,
    m.release_year,
    mc.character_name,
    mc.role_type
FROM actors a
JOIN movie_cast mc ON a.actor_id = mc.actor_id
JOIN movies m ON mc.movie_id = m.movie_id
WHERE a.actor_id = 1
ORDER BY m.release_year DESC;
```

### 4. Projects and Employees (Team Assignments)

```sql
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50)
);

CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planning',
    budget DECIMAL(12,2)
);

CREATE TABLE project_assignments (
    employee_id INT NOT NULL,
    project_id INT NOT NULL,
    role VARCHAR(50),  -- 'project manager', 'developer', 'designer'
    assigned_date DATE DEFAULT CURRENT_DATE,
    allocation_percentage INT DEFAULT 100,  -- % of time allocated
    hourly_rate DECIMAL(8,2),
    PRIMARY KEY (employee_id, project_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) 
        ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) 
        ON DELETE CASCADE,
    CHECK (allocation_percentage BETWEEN 1 AND 100)
);

CREATE INDEX idx_assignments_employee ON project_assignments(employee_id);
CREATE INDEX idx_assignments_project ON project_assignments(project_id);

-- Query: Employee workload
SELECT 
    e.first_name || ' ' || e.last_name AS employee_name,
    COUNT(pa.project_id) AS active_projects,
    SUM(pa.allocation_percentage) AS total_allocation
FROM employees e
LEFT JOIN project_assignments pa ON e.employee_id = pa.employee_id
LEFT JOIN projects p ON pa.project_id = p.project_id AND p.status = 'active'
GROUP BY e.employee_id, employee_name;

-- Query: Project team roster
SELECT 
    p.project_name,
    e.first_name || ' ' || e.last_name AS team_member,
    pa.role,
    pa.allocation_percentage
FROM projects p
JOIN project_assignments pa ON p.project_id = pa.project_id
JOIN employees e ON pa.employee_id = e.employee_id
WHERE p.project_id = 1
ORDER BY pa.role, e.last_name;
```

### 5. Users and Roles (Permissions System)

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false
);

CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by INT,  -- user_id of admin who assigned
    expires_at TIMESTAMP,  -- Optional: role expiration
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) 
        ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) 
        ON DELETE SET NULL
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) 
WHERE expires_at IS NOT NULL;

-- Query: User permissions
SELECT 
    u.username,
    STRING_AGG(r.role_name, ', ' ORDER BY r.role_name) AS roles
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.role_id
WHERE ur.expires_at IS NULL OR ur.expires_at > NOW()
GROUP BY u.user_id, u.username;

-- Query: Find users with specific role
SELECT 
    u.user_id,
    u.username,
    ur.assigned_at
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE r.role_name = 'admin';
```

## Junction Table with Additional Attributes

Junction tables can store additional information about the relationship.

```sql
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL
);

-- Junction table with relationship attributes
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,  -- Optional surrogate key
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    -- Relationship-specific attributes
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade CHAR(2),
    attendance_percentage DECIMAL(5,2),
    final_score DECIMAL(5,2),
    semester VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',  -- 'active', 'dropped', 'completed'
    UNIQUE (student_id, course_id),  -- Ensure uniqueness
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

## Querying Many-to-Many Relationships

### Get All Related Records

```sql
-- Students and their courses
SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    c.course_code,
    c.course_name,
    e.grade,
    e.semester
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
ORDER BY s.last_name, c.course_code;
```

### Count Relationships

```sql
-- Students with course count
SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    COUNT(e.course_id) AS enrolled_courses,
    SUM(c.credits) AS total_credits
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN courses c ON e.course_id = c.course_id
GROUP BY s.student_id, student_name;

-- Courses with student count
SELECT 
    c.course_code,
    c.course_name,
    COUNT(e.student_id) AS enrolled_students,
    c.credits
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_code, c.course_name, c.credits
ORDER BY enrolled_students DESC;
```

### Find Common Relationships

```sql
-- Students who share courses
SELECT DISTINCT
    s1.student_id AS student1_id,
    s1.first_name || ' ' || s1.last_name AS student1_name,
    s2.student_id AS student2_id,
    s2.first_name || ' ' || s2.last_name AS student2_name,
    c.course_code,
    c.course_name
FROM enrollments e1
JOIN enrollments e2 ON e1.course_id = e2.course_id AND e1.student_id < e2.student_id
JOIN students s1 ON e1.student_id = s1.student_id
JOIN students s2 ON e2.student_id = s2.student_id
JOIN courses c ON e1.course_id = c.course_id
ORDER BY s1.last_name, s2.last_name;
```

### Find Records Without Relationships

```sql
-- Students not enrolled in any course
SELECT s.student_id, s.first_name, s.last_name
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
WHERE e.student_id IS NULL;

-- Courses with no students
SELECT c.course_id, c.course_code, c.course_name
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
WHERE e.course_id IS NULL;
```

## Best Practices

### 1. Choose Appropriate Primary Key

```sql
-- Option 1: Composite primary key (most common)
CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id)
);

-- Option 2: Surrogate key (when you need to reference the relationship)
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    UNIQUE (student_id, course_id)  -- Still ensure uniqueness
);
```

### 2. Name Junction Tables Clearly

```sql
-- Good naming patterns:
-- 1. Combine entity names: student_courses, author_books
-- 2. Use descriptive name: enrollments, assignments, memberships
-- 3. Use plural form: user_roles, product_tags
```

### 3. Always Index Foreign Keys

```sql
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- Consider composite indexes for common queries
CREATE INDEX idx_enrollments_student_semester 
ON enrollments(student_id, semester);
```

### 4. Use Appropriate Constraints

```sql
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    grade CHAR(2),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (grade IN ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'))
);
```

### 5. Consider Soft Deletes for Historical Data

```sql
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    drop_date DATE,  -- When student dropped the course
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (student_id, course_id)
);

-- Query only active enrollments
SELECT * FROM enrollments WHERE is_active = true;
```

## Common Pitfalls to Avoid

### ❌ Storing Arrays or Delimited Strings

```sql
-- DON'T DO THIS
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    course_ids INT[],  -- Array of course IDs - hard to query and maintain
);
```

### ❌ Missing Indexes on Foreign Keys

```sql
-- DON'T FORGET INDEXES
-- Without indexes, joins will be very slow
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
```

### ❌ No Primary Key on Junction Table

```sql
-- AVOID: No way to ensure uniqueness
CREATE TABLE student_courses (
    student_id INT,
    course_id INT
);
-- Can insert duplicates!

-- CORRECT:
CREATE TABLE student_courses (
    student_id INT,
    course_id INT,
    PRIMARY KEY (student_id, course_id)
);
```

## Summary

A **many-to-many relationship** requires:

1. **Two entity tables**: Representing the two entities
2. **One junction table**: Connecting the entities
3. **Two foreign keys** in junction table: Referencing both entity tables
4. **Composite primary key**: Or surrogate key with unique constraint

**Key implementation steps:**
- Create both entity tables first
- Create junction table with two foreign keys
- Add composite primary key on junction table
- Index both foreign keys
- Optionally add relationship-specific attributes

**Common patterns:**
- Students ↔ Courses (enrollments)
- Products ↔ Tags (categorization)
- Actors ↔ Movies (cast)
- Employees ↔ Projects (assignments)
- Users ↔ Roles (permissions)
