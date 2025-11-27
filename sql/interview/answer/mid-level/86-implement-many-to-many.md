# 86. How do you implement a many-to-many relationship?

## Overview

A many-to-many (M:N) relationship is implemented using a **junction table** (also called a bridge table, linking table, or associative table) that sits between the two entity tables and contains foreign keys referencing both.

## Core Implementation Steps

### Step 1: Create the First Entity Table

```sql
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE
);
```

### Step 2: Create the Second Entity Table

```sql
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(10) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    department VARCHAR(50)
);
```

### Step 3: Create the Junction Table

```sql
-- Junction table connects students and courses
CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    -- Composite primary key ensures uniqueness
    PRIMARY KEY (student_id, course_id),
    -- Foreign key to students table
    FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    -- Foreign key to courses table
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

### Step 4: Create Indexes for Performance

```sql
-- Index on first foreign key (usually created automatically with PK)
CREATE INDEX idx_student_courses_student ON student_courses(student_id);

-- Index on second foreign key
CREATE INDEX idx_student_courses_course ON student_courses(course_id);
```

## Complete Example: E-Learning Platform

```sql
-- Step 1: Create Students table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    date_of_birth DATE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create Courses table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(10) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INT NOT NULL,
    max_students INT DEFAULT 30,
    department VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create Junction table with additional attributes
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    -- Additional attributes specific to the relationship
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade CHAR(2),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'dropped', 'completed'
    semester VARCHAR(20) NOT NULL,
    final_score DECIMAL(5,2),
    attendance_percentage DECIMAL(5,2),
    -- Composite primary key
    PRIMARY KEY (student_id, course_id, semester), -- Include semester if student can retake
    -- Foreign key constraints
    CONSTRAINT fk_enrollments_student
        FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_enrollments_course
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    -- Additional constraints
    CHECK (grade IN ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', NULL)),
    CHECK (status IN ('active', 'dropped', 'completed', 'withdrawn')),
    CHECK (final_score BETWEEN 0 AND 100),
    CHECK (attendance_percentage BETWEEN 0 AND 100)
);

-- Step 4: Create indexes
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_semester ON enrollments(semester);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Step 5: Add comments for documentation
COMMENT ON TABLE enrollments IS 
'Junction table linking students to courses with enrollment details';
COMMENT ON COLUMN enrollments.semester IS 
'Format: Fall2024, Spring2025, etc.';
```

## Inserting Data

```sql
-- Insert students
INSERT INTO students (first_name, last_name, email) VALUES
    ('Alice', 'Johnson', 'alice.johnson@university.edu'),
    ('Bob', 'Smith', 'bob.smith@university.edu'),
    ('Carol', 'Williams', 'carol.williams@university.edu');

-- Insert courses
INSERT INTO courses (course_code, course_name, credits, department) VALUES
    ('CS101', 'Introduction to Programming', 3, 'Computer Science'),
    ('CS201', 'Data Structures', 4, 'Computer Science'),
    ('MATH101', 'Calculus I', 4, 'Mathematics'),
    ('ENG102', 'English Composition', 3, 'English');

-- Enroll students in courses (create many-to-many relationships)
INSERT INTO enrollments (student_id, course_id, semester, status) VALUES
    -- Alice enrolled in 3 courses
    (1, 1, 'Fall2024', 'active'),
    (1, 2, 'Fall2024', 'active'),
    (1, 3, 'Fall2024', 'active'),
    -- Bob enrolled in 2 courses
    (2, 1, 'Fall2024', 'active'),
    (2, 4, 'Fall2024', 'active'),
    -- Carol enrolled in 3 courses
    (3, 2, 'Fall2024', 'active'),
    (3, 3, 'Fall2024', 'active'),
    (3, 4, 'Fall2024', 'active');

-- Update enrollment with grades
UPDATE enrollments 
SET grade = 'A', final_score = 95.5, status = 'completed'
WHERE student_id = 1 AND course_id = 1 AND semester = 'Fall2024';
```

## Querying Many-to-Many Relationships

### Get All Students and Their Courses

```sql
SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    c.course_code,
    c.course_name,
    e.semester,
    e.grade,
    e.status
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
ORDER BY s.last_name, c.course_code;
```

### Get Courses for a Specific Student

```sql
SELECT 
    c.course_code,
    c.course_name,
    c.credits,
    e.semester,
    e.grade,
    e.final_score
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.student_id = 1
ORDER BY e.semester DESC, c.course_code;
```

### Get Students in a Specific Course

```sql
SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.email,
    e.enrollment_date,
    e.status,
    e.grade
FROM courses c
JOIN enrollments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE c.course_code = 'CS101' AND e.semester = 'Fall2024'
ORDER BY s.last_name;
```

### Count Enrollments

```sql
-- Students with their course counts
SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    COUNT(e.course_id) AS enrolled_courses,
    SUM(c.credits) AS total_credits
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN courses c ON e.course_id = c.course_id
WHERE e.status = 'active'
GROUP BY s.student_id, student_name
ORDER BY enrolled_courses DESC;

-- Courses with their enrollment counts
SELECT 
    c.course_id,
    c.course_code,
    c.course_name,
    COUNT(e.student_id) AS enrolled_students,
    c.max_students,
    c.max_students - COUNT(e.student_id) AS available_seats
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id 
    AND e.status = 'active'
    AND e.semester = 'Fall2024'
GROUP BY c.course_id, c.course_code, c.course_name, c.max_students
ORDER BY enrolled_students DESC;
```

## Junction Table Variations

### Option 1: Composite Primary Key (Most Common)

```sql
CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

**Pros:**
- Automatically ensures uniqueness of relationships
- No extra column needed
- Efficient for join queries

**Cons:**
- Harder to reference this specific relationship from other tables
- Primary key is two columns

### Option 2: Surrogate Primary Key

```sql
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,  -- Surrogate key
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    -- Still need unique constraint to prevent duplicates
    UNIQUE (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

**Pros:**
- Easy to reference from other tables
- Single-column primary key
- Useful if the relationship needs to be referenced elsewhere

**Cons:**
- Extra column (storage overhead)
- Must remember to add UNIQUE constraint

**Use surrogate key when:**
- You need to reference the relationship from another table
- The junction table has many other attributes
- You prefer consistency with other tables using surrogate keys

### Option 3: Composite Primary Key + Surrogate Key

```sql
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    -- Use composite unique constraint
    UNIQUE (student_id, course_id, semester),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

## Adding Relationship Attributes

Junction tables can store additional data about the relationship itself:

```sql
CREATE TABLE project_assignments (
    assignment_id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL,
    project_id INT NOT NULL,
    -- Relationship-specific attributes
    role VARCHAR(50) NOT NULL,  -- 'Developer', 'Manager', 'Designer'
    assigned_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    allocation_percentage INT DEFAULT 100,
    hourly_rate DECIMAL(8,2),
    notes TEXT,
    -- Constraints
    UNIQUE (employee_id, project_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
        ON DELETE CASCADE,
    CHECK (allocation_percentage BETWEEN 1 AND 100),
    CHECK (end_date IS NULL OR end_date >= assigned_date)
);
```

## Real-World Example: E-Commerce Platform

```sql
-- Products table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_category_id INT,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

-- Junction table: Products can belong to multiple categories
CREATE TABLE product_categories (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT false,  -- Mark primary category
    display_order INT,  -- Order to display in category
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);
CREATE INDEX idx_product_categories_primary ON product_categories(category_id) 
WHERE is_primary = true;

-- Query: Get products with all their categories
SELECT 
    p.product_id,
    p.product_name,
    STRING_AGG(
        c.category_name, 
        ', ' 
        ORDER BY pc.is_primary DESC, c.category_name
    ) AS categories,
    STRING_AGG(
        CASE WHEN pc.is_primary THEN c.category_name END,
        ''
    ) AS primary_category
FROM products p
LEFT JOIN product_categories pc ON p.product_id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.category_id
GROUP BY p.product_id, p.product_name;
```

## Best Practices

### 1. Always Use Foreign Key Constraints

```sql
-- DO: Use foreign key constraints
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- DON'T: Omit foreign keys
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id)
);  -- No referential integrity!
```

### 2. Index Foreign Key Columns

```sql
-- Create indexes on both foreign keys for performance
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

### 3. Choose Appropriate ON DELETE Actions

```sql
-- CASCADE: Delete relationship when either entity is deleted
CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE,  -- Delete enrollments when student is deleted
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE   -- Delete enrollments when course is deleted
);

-- RESTRICT: Prevent deletion if relationships exist
CREATE TABLE actor_movies (
    actor_id INT NOT NULL,
    movie_id INT NOT NULL,
    PRIMARY KEY (actor_id, movie_id),
    FOREIGN KEY (actor_id) REFERENCES actors(actor_id)
        ON DELETE RESTRICT,  -- Can't delete actor with movies
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
        ON DELETE RESTRICT   -- Can't delete movie with actors
);
```

### 4. Name Junction Tables Clearly

```sql
-- Good naming patterns:

-- Pattern 1: Combine entity names
CREATE TABLE student_courses (...);
CREATE TABLE author_books (...);
CREATE TABLE user_roles (...);

-- Pattern 2: Use descriptive relationship name
CREATE TABLE enrollments (...);      -- students + courses
CREATE TABLE assignments (...);      -- employees + projects
CREATE TABLE memberships (...);      -- users + groups
CREATE TABLE subscriptions (...);    -- users + plans

-- Pattern 3: Use action-based names
CREATE TABLE follows (...);          -- users following users
CREATE TABLE likes (...);            -- users liking posts
CREATE TABLE purchases (...);        -- customers buying products
```

### 5. Add Timestamps for Audit Trail

```sql
CREATE TABLE product_tags (
    product_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INT,  -- user who created the relationship
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

### 6. Consider Soft Deletes

```sql
CREATE TABLE team_members (
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,  -- NULL means still active
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Query only active memberships
SELECT * FROM team_members WHERE is_active = true AND left_at IS NULL;
```

## Common Patterns

### Self-Referencing Many-to-Many (Social Network)

```sql
-- Users following other users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE user_follows (
    follower_id INT NOT NULL,  -- User who is following
    following_id INT NOT NULL,  -- User being followed
    followed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CHECK (follower_id != following_id)  -- User can't follow themselves
);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Get user's followers
SELECT u.*
FROM users u
JOIN user_follows uf ON u.user_id = uf.follower_id
WHERE uf.following_id = 123;

-- Get users that user is following
SELECT u.*
FROM users u
JOIN user_follows uf ON u.user_id = uf.following_id
WHERE uf.follower_id = 123;

-- Find mutual follows (friends)
SELECT 
    u.user_id,
    u.username
FROM users u
WHERE EXISTS (
    SELECT 1 FROM user_follows 
    WHERE follower_id = 123 AND following_id = u.user_id
)
AND EXISTS (
    SELECT 1 FROM user_follows 
    WHERE follower_id = u.user_id AND following_id = 123
);
```

### Hierarchical Many-to-Many

```sql
-- Products and categories with product appearing in multiple category levels
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id INT,
    level INT,  -- 1 = top level, 2 = sub-category, etc.
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

CREATE TABLE product_categories (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    is_direct BOOLEAN DEFAULT true,  -- Direct vs inherited categorization
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
```

## Performance Optimization

### Composite Indexes for Common Queries

```sql
-- If you frequently query by student and filter by status
CREATE INDEX idx_enrollments_student_status 
ON enrollments(student_id, status);

-- If you frequently query by course and semester
CREATE INDEX idx_enrollments_course_semester 
ON enrollments(course_id, semester);
```

### Partial Indexes

```sql
-- Index only active enrollments
CREATE INDEX idx_enrollments_active 
ON enrollments(student_id, course_id)
WHERE status = 'active';
```

### Materialized Views for Complex Aggregations

```sql
CREATE MATERIALIZED VIEW student_enrollment_stats AS
SELECT 
    s.student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    COUNT(e.course_id) AS total_courses,
    SUM(c.credits) AS total_credits,
    AVG(e.final_score) AS gpa,
    COUNT(*) FILTER (WHERE e.status = 'completed') AS completed_courses
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN courses c ON e.course_id = c.course_id
GROUP BY s.student_id, student_name;

-- Refresh periodically
REFRESH MATERIALIZED VIEW student_enrollment_stats;
```

## Summary

**To implement a many-to-many relationship:**

1. **Create two entity tables** with their own primary keys
2. **Create a junction table** with:
   - Foreign key to first entity
   - Foreign key to second entity
   - Composite primary key (or surrogate key + unique constraint)
   - Optional: Additional relationship attributes
3. **Add indexes** on both foreign keys
4. **Choose appropriate referential actions** (CASCADE, RESTRICT, etc.)
5. **Add constraints** to maintain data integrity

**Key components:**
- Entity Table 1 → Foreign Key 1 in Junction Table
- Entity Table 2 → Foreign Key 2 in Junction Table
- Junction Table = Bridge connecting both entities

**Remember:**
- Junction table is required for many-to-many relationships
- Always use foreign key constraints
- Index foreign key columns for performance
- Junction tables can store relationship-specific attributes
- Choose meaningful names for junction tables
