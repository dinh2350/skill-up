# 87. What is a junction table?

## Definition

A **junction table** (also called a **bridge table**, **linking table**, **associative table**, or **join table**) is a database table used to implement a many-to-many relationship between two other tables. It contains foreign keys referencing the primary keys of the two tables it connects.

## Purpose

Junction tables solve the problem that many-to-many relationships cannot be directly represented in relational databases. They break down the many-to-many relationship into two one-to-many relationships.

## Visual Representation

```
Without Junction Table (IMPOSSIBLE):
┌──────────┐ ════════ ┌──────────┐
│ Students │ ← M:N → │ Courses  │
└──────────┘ ════════ └──────────┘
     ❌ Cannot directly implement

With Junction Table (CORRECT):
┌──────────┐         ┌──────────────┐         ┌──────────┐
│ Students │         │  Enrollments │         │ Courses  │
│          │         │  (Junction)  │         │          │
│ id (PK)  │←──1:N──→│ student_id   │←──N:1──→│ id (PK)  │
│ name     │         │ course_id    │         │ name     │
└──────────┘         │ PK(s_id,c_id)│         └──────────┘
                     └──────────────┘
```

## Basic Structure

A junction table typically contains:

1. **Foreign Key 1**: References first entity table
2. **Foreign Key 2**: References second entity table
3. **Composite Primary Key**: Usually both foreign keys combined
4. **Optional Additional Columns**: Relationship-specific attributes

## Simple Example

```sql
-- First entity table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Second entity table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(10) UNIQUE NOT NULL
);

-- Junction table connecting students and courses
CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    -- Composite primary key ensures each student-course pair is unique
    PRIMARY KEY (student_id, course_id),
    -- Foreign key to students
    FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE,
    -- Foreign key to courses
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_student_courses_student ON student_courses(student_id);
CREATE INDEX idx_student_courses_course ON student_courses(course_id);
```

## Key Characteristics

### 1. Contains Foreign Keys

```sql
CREATE TABLE junction_table (
    entity1_id INT NOT NULL,  -- Foreign key to first table
    entity2_id INT NOT NULL,  -- Foreign key to second table
    PRIMARY KEY (entity1_id, entity2_id),
    FOREIGN KEY (entity1_id) REFERENCES table1(id),
    FOREIGN KEY (entity2_id) REFERENCES table2(id)
);
```

### 2. Ensures Uniqueness

The composite primary key or unique constraint prevents duplicate relationships:

```sql
-- This prevents the same student enrolling in the same course twice
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id)  -- Ensures uniqueness
);
```

### 3. Can Store Additional Attributes

Junction tables can hold data specific to the relationship:

```sql
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    -- Relationship-specific attributes
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade CHAR(2),
    status VARCHAR(20) DEFAULT 'active',
    semester VARCHAR(20),
    final_score DECIMAL(5,2),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

## Common Examples

### 1. Students and Courses (Enrollments)

```sql
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INT NOT NULL
);

-- Junction table
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_date DATE DEFAULT CURRENT_DATE,
    grade CHAR(2),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);
```

**Enables queries like:**
- Which courses is a student taking?
- Which students are in a course?
- What grade did a student get in each course?

### 2. Products and Tags

```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2)
);

CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL
);

-- Junction table
CREATE TABLE product_tags (
    product_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);
```

**Enables queries like:**
- What tags does a product have?
- Which products have a specific tag?
- When was a tag added to a product?

### 3. Actors and Movies (Cast)

```sql
CREATE TABLE actors (
    actor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
);

CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    release_year INT
);

-- Junction table with additional attributes
CREATE TABLE movie_cast (
    actor_id INT NOT NULL,
    movie_id INT NOT NULL,
    character_name VARCHAR(100),
    role_type VARCHAR(20) DEFAULT 'actor',  -- 'lead', 'supporting', 'cameo'
    billing_order INT,
    PRIMARY KEY (actor_id, movie_id),
    FOREIGN KEY (actor_id) REFERENCES actors(actor_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE
);
```

### 4. Users and Roles (Permissions)

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Junction table
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by INT,  -- user_id of admin who assigned the role
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL
);
```

### 5. Employees and Projects (Assignments)

```sql
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE
);

-- Junction table with rich relationship data
CREATE TABLE project_assignments (
    employee_id INT NOT NULL,
    project_id INT NOT NULL,
    role VARCHAR(50) NOT NULL,  -- 'Developer', 'Manager', 'Designer'
    assigned_date DATE DEFAULT CURRENT_DATE,
    allocation_percentage INT DEFAULT 100,  -- % of time on this project
    hourly_rate DECIMAL(8,2),
    PRIMARY KEY (employee_id, project_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    CHECK (allocation_percentage BETWEEN 1 AND 100)
);
```

## Junction Table Naming Conventions

### Pattern 1: Combine Entity Names

Most common and clear:

```sql
CREATE TABLE student_courses (...);
CREATE TABLE user_roles (...);
CREATE TABLE product_categories (...);
CREATE TABLE actor_movies (...);
```

### Pattern 2: Descriptive Relationship Name

Use a noun describing the relationship:

```sql
CREATE TABLE enrollments (...);      -- students + courses
CREATE TABLE memberships (...);      -- users + groups
CREATE TABLE assignments (...);      -- employees + projects
CREATE TABLE purchases (...);        -- customers + products
CREATE TABLE follows (...);          -- users + users (social media)
```

### Pattern 3: Action-Based Names

When the relationship implies an action:

```sql
CREATE TABLE likes (...);            -- users liking posts
CREATE TABLE bookmarks (...);        -- users bookmarking articles
CREATE TABLE subscriptions (...);    -- users subscribing to newsletters
CREATE TABLE registrations (...);    -- attendees + events
```

## Primary Key Options

### Option 1: Composite Primary Key (Recommended)

```sql
CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

**Advantages:**
- Automatically ensures uniqueness
- No extra column needed
- Natural representation of the relationship

**Disadvantages:**
- Harder to reference this specific relationship from other tables
- Two-column primary key

### Option 2: Surrogate Key

```sql
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,  -- Surrogate key
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    UNIQUE (student_id, course_id),  -- Still need uniqueness constraint
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);
```

**Advantages:**
- Easy to reference from other tables
- Single-column primary key
- Consistent with other tables using surrogate keys

**Disadvantages:**
- Extra column (storage overhead)
- Must remember UNIQUE constraint

**When to use:**
- You need to reference the relationship from other tables
- The relationship itself has child relationships
- Consistency with application ORM requirements

## Querying Junction Tables

### Find Related Records

```sql
-- Get all courses for a specific student
SELECT c.*
FROM courses c
JOIN student_courses sc ON c.course_id = sc.course_id
WHERE sc.student_id = 123;

-- Get all students in a specific course
SELECT s.*
FROM students s
JOIN student_courses sc ON s.student_id = sc.student_id
WHERE sc.course_id = 456;
```

### Count Relationships

```sql
-- Students with their course counts
SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    COUNT(sc.course_id) AS course_count
FROM students s
LEFT JOIN student_courses sc ON s.student_id = sc.student_id
GROUP BY s.student_id, s.first_name, s.last_name;

-- Courses with their enrollment counts
SELECT 
    c.course_id,
    c.course_name,
    COUNT(sc.student_id) AS enrolled_students
FROM courses c
LEFT JOIN student_courses sc ON c.course_id = sc.course_id
GROUP BY c.course_id, c.course_name;
```

### Find Records Without Relationships

```sql
-- Students not enrolled in any course
SELECT s.*
FROM students s
LEFT JOIN student_courses sc ON s.student_id = sc.student_id
WHERE sc.student_id IS NULL;

-- Courses with no students
SELECT c.*
FROM courses c
LEFT JOIN student_courses sc ON c.course_id = sc.course_id
WHERE sc.course_id IS NULL;
```

### Find Common Relationships

```sql
-- Find students who share courses
SELECT DISTINCT
    s1.student_id AS student1_id,
    s1.first_name || ' ' || s1.last_name AS student1,
    s2.student_id AS student2_id,
    s2.first_name || ' ' || s2.last_name AS student2,
    c.course_name AS shared_course
FROM student_courses sc1
JOIN student_courses sc2 ON sc1.course_id = sc2.course_id 
    AND sc1.student_id < sc2.student_id
JOIN students s1 ON sc1.student_id = s1.student_id
JOIN students s2 ON sc2.student_id = s2.student_id
JOIN courses c ON sc1.course_id = c.course_id;
```

## Advanced Junction Table Patterns

### Self-Referencing Junction Table

Used for relationships between records in the same table:

```sql
-- Social network: users following other users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL
);

-- Junction table for user-to-user relationships
CREATE TABLE user_follows (
    follower_id INT NOT NULL,     -- User who is following
    following_id INT NOT NULL,    -- User being followed
    followed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CHECK (follower_id != following_id)  -- Can't follow yourself
);

-- Get followers of a user
SELECT u.*
FROM users u
JOIN user_follows uf ON u.user_id = uf.follower_id
WHERE uf.following_id = 123;

-- Get users that a user is following
SELECT u.*
FROM users u
JOIN user_follows uf ON u.user_id = uf.following_id
WHERE uf.follower_id = 123;
```

### Multi-Way Junction Tables

Junction tables can connect more than two entities:

```sql
-- Scheduling system: teacher, course, classroom, time slot
CREATE TABLE teachers (
    teacher_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL
);

CREATE TABLE classrooms (
    classroom_id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL
);

-- Junction table connecting three entities
CREATE TABLE class_schedule (
    teacher_id INT NOT NULL,
    course_id INT NOT NULL,
    classroom_id INT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    semester VARCHAR(20) NOT NULL,
    PRIMARY KEY (teacher_id, course_id, classroom_id, day_of_week, start_time, semester),
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (classroom_id) REFERENCES classrooms(classroom_id)
);
```

### Temporal Junction Tables

Track relationships over time:

```sql
CREATE TABLE team_memberships (
    user_id INT NOT NULL,
    team_id INT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,  -- NULL means current member
    role VARCHAR(50),
    PRIMARY KEY (user_id, team_id, start_date),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Get current team members
SELECT *
FROM team_memberships
WHERE end_date IS NULL;

-- Get historical team membership
SELECT *
FROM team_memberships
WHERE team_id = 5
ORDER BY start_date;
```

## Best Practices

### 1. Always Use Foreign Key Constraints

```sql
-- ✅ GOOD: Enforces referential integrity
CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- ❌ BAD: No integrity enforcement
CREATE TABLE student_courses (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id)
);
```

### 2. Index Foreign Key Columns

```sql
CREATE INDEX idx_student_courses_student ON student_courses(student_id);
CREATE INDEX idx_student_courses_course ON student_courses(course_id);
```

### 3. Choose Appropriate Referential Actions

```sql
-- CASCADE: Automatically delete relationships when entity is deleted
CREATE TABLE enrollments (
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) 
        ON DELETE CASCADE,  -- Delete enrollments when student deleted
    FOREIGN KEY (course_id) REFERENCES courses(course_id) 
        ON DELETE CASCADE   -- Delete enrollments when course deleted
);

-- RESTRICT: Prevent deletion if relationships exist
CREATE TABLE product_tags (
    product_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id) 
        ON DELETE RESTRICT,  -- Can't delete product with tags
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) 
        ON DELETE RESTRICT   -- Can't delete tag used by products
);
```

### 4. Add Timestamps for Audit

```sql
CREATE TABLE user_groups (
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    joined_by INT,  -- Admin who added the user
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (group_id) REFERENCES groups(group_id),
    FOREIGN KEY (joined_by) REFERENCES users(user_id)
);
```

### 5. Consider Soft Deletes

```sql
CREATE TABLE memberships (
    user_id INT NOT NULL,
    organization_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,  -- NULL = still a member
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (user_id, organization_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
);
```

## Summary

A **junction table** is:

- **Essential** for implementing many-to-many relationships
- **Contains** foreign keys to both related tables
- **Ensures** uniqueness through composite primary key or unique constraint
- **Can store** additional attributes specific to the relationship
- **Breaks down** M:N relationship into two 1:N relationships

**Key components:**
1. Foreign key to first entity table
2. Foreign key to second entity table
3. Primary key (composite or surrogate)
4. Optional: relationship-specific attributes

**Also known as:**
- Bridge table
- Linking table
- Associative table
- Join table
- Cross-reference table
- Intersection table

**Remember:** Without a junction table, many-to-many relationships cannot be properly represented in a relational database.
