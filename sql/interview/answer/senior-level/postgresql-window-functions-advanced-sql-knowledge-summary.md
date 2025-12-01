# PostgreSQL Window Functions & Advanced SQL Knowledge Summary (Q256-280)

## Learning Objectives
This guide provides comprehensive knowledge needed to answer PostgreSQL window functions and advanced SQL interview questions Q256-280, covering window function concepts, ranking functions, analytical functions, frame specifications, and Common Table Expressions (CTEs).

## Core Learning Areas

### 1. Window Functions Fundamentals (Q256-257)

#### What are Window Functions?
- **Definition**: Functions that perform calculations across a set of rows related to the current row
- **Key Feature**: Do not collapse rows like aggregate functions
- **Purpose**: Provide analytical capabilities while preserving row-level detail
- **Structure**: `function_name() OVER (window_specification)`

#### Window Functions vs Aggregate Functions
| Aspect | Aggregate Functions | Window Functions |
|--------|-------------------|------------------|
| **Row Reduction** | Collapse rows into single result | Preserve all input rows |
| **Context** | Group-level calculation | Row-level with window context |
| **Output** | One row per group | One row per input row |
| **Usage** | GROUP BY clauses | OVER clause |
| **Examples** | SUM(), COUNT(), AVG() | ROW_NUMBER(), RANK(), LAG() |

#### Basic Window Function Example
```sql
-- Sample data setup
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(50),
    department VARCHAR(50),
    sale_date DATE,
    amount DECIMAL(10,2)
);

INSERT INTO sales (employee_name, department, sale_date, amount) VALUES
('Alice', 'Sales', '2024-01-01', 1000.00),
('Bob', 'Sales', '2024-01-02', 1200.00),
('Carol', 'Marketing', '2024-01-01', 800.00),
('David', 'Sales', '2024-01-03', 1500.00),
('Eve', 'Marketing', '2024-01-02', 900.00);

-- Aggregate function (collapses rows)
SELECT department, SUM(amount) as total_sales
FROM sales
GROUP BY department;

-- Window function (preserves rows)
SELECT 
    employee_name,
    department,
    amount,
    SUM(amount) OVER (PARTITION BY department) as dept_total,
    amount / SUM(amount) OVER (PARTITION BY department) * 100 as percentage_of_dept
FROM sales;
```

### 2. OVER Clause and Window Specification (Q258-262)

#### The OVER Clause
- **Purpose**: Defines the window (set of rows) for the function
- **Components**: PARTITION BY, ORDER BY, frame specification
- **Syntax**: `OVER ([PARTITION BY ...] [ORDER BY ...] [frame_specification])`

#### PARTITION BY in Window Functions
- **Purpose**: Divides result set into partitions
- **Function**: Window function is applied separately to each partition
- **Similar to**: GROUP BY but doesn't collapse rows

```sql
-- PARTITION BY examples
SELECT 
    employee_name,
    department,
    amount,
    -- Running total within each department
    SUM(amount) OVER (PARTITION BY department ORDER BY sale_date) as running_total,
    -- Average within each department
    AVG(amount) OVER (PARTITION BY department) as dept_average,
    -- Rank within each department
    RANK() OVER (PARTITION BY department ORDER BY amount DESC) as dept_rank
FROM sales;
```

#### ORDER BY in Window Functions
- **Purpose**: Defines the order of rows within each partition
- **Impact**: Affects frame boundaries and cumulative calculations
- **Required for**: Ranking functions, LAG/LEAD functions

```sql
-- ORDER BY impact on window functions
SELECT 
    employee_name,
    sale_date,
    amount,
    -- Order affects the running sum
    SUM(amount) OVER (ORDER BY sale_date) as cumulative_sales,
    SUM(amount) OVER (ORDER BY amount DESC) as cumulative_by_amount,
    -- Order affects ranking
    ROW_NUMBER() OVER (ORDER BY sale_date) as chronological_order,
    ROW_NUMBER() OVER (ORDER BY amount DESC) as amount_order
FROM sales;
```

#### Window Frame Specifications
- **Purpose**: Define which rows within the partition to include in the calculation
- **Default**: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
- **Frame Types**: ROWS, RANGE, GROUPS

#### ROWS vs RANGE in Window Frames
```sql
-- Sample data for frame demonstration
CREATE TABLE daily_sales (
    sale_date DATE,
    daily_total DECIMAL(10,2)
);

INSERT INTO daily_sales VALUES
('2024-01-01', 1000),
('2024-01-02', 1200),
('2024-01-03', 1200),  -- Same value as previous day
('2024-01-04', 1500),
('2024-01-05', 800);

-- ROWS frame specification
SELECT 
    sale_date,
    daily_total,
    -- 3-day moving average using ROWS
    AVG(daily_total) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
    ) as moving_avg_rows,
    -- Running sum with ROWS
    SUM(daily_total) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as running_sum_rows
FROM daily_sales;

-- RANGE frame specification
SELECT 
    sale_date,
    daily_total,
    -- RANGE considers logical range of values
    SUM(daily_total) OVER (
        ORDER BY daily_total 
        RANGE BETWEEN 100 PRECEDING AND 100 FOLLOWING
    ) as sum_similar_amounts,
    -- RANGE with dates
    AVG(daily_total) OVER (
        ORDER BY sale_date 
        RANGE BETWEEN INTERVAL '1 day' PRECEDING AND CURRENT ROW
    ) as recent_avg
FROM daily_sales;

-- Frame specification examples
SELECT 
    sale_date,
    daily_total,
    -- Current row only
    SUM(daily_total) OVER (
        ORDER BY sale_date 
        ROWS CURRENT ROW
    ) as current_only,
    -- All preceding rows
    SUM(daily_total) OVER (
        ORDER BY sale_date 
        ROWS UNBOUNDED PRECEDING
    ) as all_preceding,
    -- 2 preceding to 1 following
    AVG(daily_total) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN 2 PRECEDING AND 1 FOLLOWING
    ) as window_avg,
    -- From current to end
    COUNT(*) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
    ) as rows_remaining
FROM daily_sales;
```

### 3. Ranking Functions (Q263-266)

#### ROW_NUMBER() Function
- **Purpose**: Assigns unique sequential integers to rows
- **Characteristics**: Always unique, no gaps
- **Use Cases**: Pagination, deduplication, sequential numbering

#### RANK() Function  
- **Purpose**: Assigns rank with gaps for ties
- **Characteristics**: Same rank for ties, gaps after ties
- **Use Cases**: Sports rankings, performance rankings

#### DENSE_RANK() Function
- **Purpose**: Assigns rank without gaps for ties
- **Characteristics**: Same rank for ties, no gaps
- **Use Cases**: Grade rankings, continuous ranking systems

#### RANK() vs DENSE_RANK() Comparison
```sql
-- Ranking functions demonstration
CREATE TABLE student_scores (
    student_name VARCHAR(50),
    subject VARCHAR(50),
    score INTEGER
);

INSERT INTO student_scores VALUES
('Alice', 'Math', 95),
('Bob', 'Math', 87),
('Carol', 'Math', 92),
('David', 'Math', 87),  -- Tie with Bob
('Eve', 'Math', 90),
('Frank', 'Math', 95);  -- Tie with Alice

SELECT 
    student_name,
    score,
    ROW_NUMBER() OVER (ORDER BY score DESC) as row_num,
    RANK() OVER (ORDER BY score DESC) as rank_with_gaps,
    DENSE_RANK() OVER (ORDER BY score DESC) as rank_no_gaps,
    -- Comparison explanation
    CASE 
        WHEN RANK() OVER (ORDER BY score DESC) = DENSE_RANK() OVER (ORDER BY score DESC)
        THEN 'No ties above'
        ELSE 'Ties exist above'
    END as ranking_note
FROM student_scores
ORDER BY score DESC;

-- Expected output:
-- Alice:    ROW_NUMBER=1, RANK=1, DENSE_RANK=1
-- Frank:    ROW_NUMBER=2, RANK=1, DENSE_RANK=1 (tie)
-- Carol:    ROW_NUMBER=3, RANK=3, DENSE_RANK=2 (after tie)
-- Eve:      ROW_NUMBER=4, RANK=4, DENSE_RANK=3
-- Bob:      ROW_NUMBER=5, RANK=5, DENSE_RANK=4
-- David:    ROW_NUMBER=6, RANK=5, DENSE_RANK=4 (tie)
```

#### Advanced Ranking Examples
```sql
-- Multiple ranking scenarios
SELECT 
    student_name,
    subject,
    score,
    -- Global ranking across all subjects
    RANK() OVER (ORDER BY score DESC) as global_rank,
    -- Ranking within each subject
    RANK() OVER (PARTITION BY subject ORDER BY score DESC) as subject_rank,
    -- Percentile ranking
    PERCENT_RANK() OVER (ORDER BY score DESC) as percentile_rank,
    -- Quartile assignment
    NTILE(4) OVER (ORDER BY score DESC) as quartile
FROM student_scores;
```

### 4. Offset Functions (Q267-271)

#### LAG() and LEAD() Functions
- **LAG()**: Accesses previous row's value
- **LEAD()**: Accesses next row's value
- **Parameters**: `LAG/LEAD(column, offset, default_value)`

#### FIRST_VALUE() and LAST_VALUE() Functions
- **FIRST_VALUE()**: First value in the window frame
- **LAST_VALUE()**: Last value in the window frame
- **Frame Dependency**: Results depend on frame specification

#### NTH_VALUE() Function
- **Purpose**: Access nth value in the window frame
- **Parameters**: `NTH_VALUE(column, n)`

```sql
-- Offset functions demonstration
CREATE TABLE stock_prices (
    trade_date DATE,
    symbol VARCHAR(10),
    closing_price DECIMAL(8,2)
);

INSERT INTO stock_prices VALUES
('2024-01-01', 'AAPL', 180.00),
('2024-01-02', 'AAPL', 182.50),
('2024-01-03', 'AAPL', 178.75),
('2024-01-04', 'AAPL', 185.20),
('2024-01-05', 'AAPL', 183.90),
('2024-01-01', 'GOOGL', 150.00),
('2024-01-02', 'GOOGL', 152.30),
('2024-01-03', 'GOOGL', 148.90),
('2024-01-04', 'GOOGL', 155.80),
('2024-01-05', 'GOOGL', 157.20);

-- LAG and LEAD examples
SELECT 
    symbol,
    trade_date,
    closing_price,
    -- Previous day's price
    LAG(closing_price, 1) OVER (
        PARTITION BY symbol ORDER BY trade_date
    ) as prev_price,
    -- Next day's price
    LEAD(closing_price, 1) OVER (
        PARTITION BY symbol ORDER BY trade_date
    ) as next_price,
    -- Price change from previous day
    closing_price - LAG(closing_price, 1) OVER (
        PARTITION BY symbol ORDER BY trade_date
    ) as daily_change,
    -- Percentage change
    ROUND(
        (closing_price - LAG(closing_price, 1) OVER (
            PARTITION BY symbol ORDER BY trade_date
        )) / LAG(closing_price, 1) OVER (
            PARTITION BY symbol ORDER BY trade_date
        ) * 100, 2
    ) as pct_change
FROM stock_prices;

-- FIRST_VALUE, LAST_VALUE, and NTH_VALUE
SELECT 
    symbol,
    trade_date,
    closing_price,
    -- First price in the partition
    FIRST_VALUE(closing_price) OVER (
        PARTITION BY symbol ORDER BY trade_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as first_price,
    -- Last price in the partition
    LAST_VALUE(closing_price) OVER (
        PARTITION BY symbol ORDER BY trade_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as last_price,
    -- Second trading day price
    NTH_VALUE(closing_price, 2) OVER (
        PARTITION BY symbol ORDER BY trade_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as second_day_price,
    -- Performance vs opening price
    ROUND(
        (closing_price - FIRST_VALUE(closing_price) OVER (
            PARTITION BY symbol ORDER BY trade_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        )) / FIRST_VALUE(closing_price) OVER (
            PARTITION BY symbol ORDER BY trade_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) * 100, 2
    ) as total_return_pct
FROM stock_prices;
```

### 5. Statistical Window Functions (Q272-274)

#### NTILE() Function
- **Purpose**: Divides rows into specified number of buckets
- **Use Cases**: Quartiles, quintiles, percentile buckets
- **Distribution**: As equal as possible

#### PERCENT_RANK() Function
- **Purpose**: Relative rank as percentage (0 to 1)
- **Formula**: `(rank - 1) / (total_rows - 1)`
- **Use Cases**: Percentile calculations, performance metrics

#### CUME_DIST() Function
- **Purpose**: Cumulative distribution (0 to 1)
- **Formula**: Number of rows ≤ current row / total rows
- **Use Cases**: Cumulative frequency, distribution analysis

```sql
-- Statistical window functions
SELECT 
    student_name,
    score,
    -- Divide into quartiles
    NTILE(4) OVER (ORDER BY score) as quartile,
    -- Divide into quintiles  
    NTILE(5) OVER (ORDER BY score) as quintile,
    -- Percentage rank (0 to 1)
    PERCENT_RANK() OVER (ORDER BY score) as percent_rank,
    -- Percentage rank as percentage
    ROUND(PERCENT_RANK() OVER (ORDER BY score) * 100, 1) as percentile,
    -- Cumulative distribution
    CUME_DIST() OVER (ORDER BY score) as cumulative_dist,
    -- Cumulative distribution as percentage
    ROUND(CUME_DIST() OVER (ORDER BY score) * 100, 1) as cum_dist_pct,
    -- Top/Bottom classification
    CASE 
        WHEN NTILE(4) OVER (ORDER BY score) = 4 THEN 'Top Quartile'
        WHEN NTILE(4) OVER (ORDER BY score) = 3 THEN 'Upper Middle'
        WHEN NTILE(4) OVER (ORDER BY score) = 2 THEN 'Lower Middle'
        ELSE 'Bottom Quartile'
    END as performance_tier
FROM student_scores
ORDER BY score DESC;
```

### 6. Advanced Analytical Patterns (Q275-278)

#### Running Totals (Cumulative Sums)
```sql
-- Running totals examples
SELECT 
    sale_date,
    daily_total,
    -- Basic running total
    SUM(daily_total) OVER (ORDER BY sale_date) as running_total,
    -- Running total with frame specification
    SUM(daily_total) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as running_total_explicit,
    -- Running average
    AVG(daily_total) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as running_average,
    -- Running count
    COUNT(*) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as running_count
FROM daily_sales;

-- Monthly running totals
SELECT 
    sale_date,
    daily_total,
    EXTRACT(YEAR FROM sale_date) as year,
    EXTRACT(MONTH FROM sale_date) as month,
    -- Running total within each month
    SUM(daily_total) OVER (
        PARTITION BY EXTRACT(YEAR FROM sale_date), EXTRACT(MONTH FROM sale_date)
        ORDER BY sale_date
    ) as monthly_running_total
FROM daily_sales;
```

#### Moving Averages
```sql
-- Moving averages with different windows
SELECT 
    sale_date,
    daily_total,
    -- 3-day moving average
    AVG(daily_total) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
    ) as ma_3day,
    -- 7-day moving average
    AVG(daily_total) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN 3 PRECEDING AND 3 FOLLOWING
    ) as ma_7day,
    -- Trailing 5-day average
    AVG(daily_total) OVER (
        ORDER BY sale_date 
        ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
    ) as trailing_5day_avg,
    -- Exponential-like weighting (simplified)
    (daily_total * 0.5 + 
     LAG(daily_total, 1, daily_total) OVER (ORDER BY sale_date) * 0.3 +
     LAG(daily_total, 2, daily_total) OVER (ORDER BY sale_date) * 0.2
    ) as weighted_ma
FROM daily_sales
ORDER BY sale_date;
```

#### Finding Gaps in Sequences
```sql
-- Gap analysis in sequences
CREATE TABLE user_logins (
    user_id INTEGER,
    login_date DATE
);

-- Sample data with gaps
INSERT INTO user_logins VALUES
(1, '2024-01-01'), (1, '2024-01-02'), (1, '2024-01-04'), -- Gap on 01-03
(1, '2024-01-05'), (1, '2024-01-08'),                    -- Gap on 01-06, 01-07
(2, '2024-01-01'), (2, '2024-01-03'), (2, '2024-01-04');

-- Find gaps in login sequences
WITH login_analysis AS (
    SELECT 
        user_id,
        login_date,
        LAG(login_date) OVER (
            PARTITION BY user_id ORDER BY login_date
        ) as prev_login,
        login_date - LAG(login_date) OVER (
            PARTITION BY user_id ORDER BY login_date
        ) as days_gap
    FROM user_logins
),
gaps_identified AS (
    SELECT 
        user_id,
        prev_login as gap_start,
        login_date as gap_end,
        days_gap,
        -- Generate missing dates
        prev_login + generate_series(1, days_gap - 1) as missing_date
    FROM login_analysis
    WHERE days_gap > 1
)
SELECT 
    user_id,
    gap_start,
    gap_end,
    missing_date,
    'Missing login' as status
FROM gaps_identified
ORDER BY user_id, missing_date;

-- Alternative approach using row numbers
WITH consecutive_days AS (
    SELECT 
        user_id,
        login_date,
        login_date - ROW_NUMBER() OVER (
            PARTITION BY user_id ORDER BY login_date
        )::INTEGER as group_date
    FROM user_logins
),
login_streaks AS (
    SELECT 
        user_id,
        group_date,
        MIN(login_date) as streak_start,
        MAX(login_date) as streak_end,
        COUNT(*) as streak_length
    FROM consecutive_days
    GROUP BY user_id, group_date
)
SELECT 
    user_id,
    streak_start,
    streak_end,
    streak_length,
    LAG(streak_end) OVER (
        PARTITION BY user_id ORDER BY streak_start
    ) as prev_streak_end,
    streak_start - LAG(streak_end) OVER (
        PARTITION BY user_id ORDER BY streak_start
    ) - 1 as gap_days
FROM login_streaks
ORDER BY user_id, streak_start;
```

#### Year-over-Year Comparisons
```sql
-- Year-over-year analysis
CREATE TABLE monthly_revenue (
    revenue_month DATE,
    revenue DECIMAL(12,2)
);

INSERT INTO monthly_revenue VALUES
('2022-01-01', 100000), ('2022-02-01', 110000), ('2022-03-01', 120000),
('2023-01-01', 120000), ('2023-02-01', 125000), ('2023-03-01', 140000),
('2024-01-01', 135000), ('2024-02-01', 142000), ('2024-03-01', 155000);

SELECT 
    revenue_month,
    revenue,
    EXTRACT(YEAR FROM revenue_month) as year,
    EXTRACT(MONTH FROM revenue_month) as month,
    -- Previous year same month
    LAG(revenue, 12) OVER (ORDER BY revenue_month) as prev_year_revenue,
    -- Year-over-year change
    revenue - LAG(revenue, 12) OVER (ORDER BY revenue_month) as yoy_change,
    -- Year-over-year percentage change
    ROUND(
        (revenue - LAG(revenue, 12) OVER (ORDER BY revenue_month)) / 
        LAG(revenue, 12) OVER (ORDER BY revenue_month) * 100, 2
    ) as yoy_pct_change,
    -- Year-to-date running total
    SUM(revenue) OVER (
        PARTITION BY EXTRACT(YEAR FROM revenue_month)
        ORDER BY revenue_month
    ) as ytd_revenue,
    -- Previous year YTD for comparison
    LAG(
        SUM(revenue) OVER (
            PARTITION BY EXTRACT(YEAR FROM revenue_month)
            ORDER BY revenue_month
        ), 12
    ) OVER (ORDER BY revenue_month) as prev_year_ytd
FROM monthly_revenue
ORDER BY revenue_month;
```

### 7. Common Table Expressions (CTEs) (Q279-280)

#### Basic CTEs
- **Purpose**: Named temporary result sets
- **Benefits**: Code readability, modularity, avoiding repetition
- **Syntax**: `WITH cte_name AS (query) SELECT ...`

#### Recursive CTEs
- **Purpose**: Handle hierarchical or iterative data
- **Structure**: Anchor query + recursive query
- **Use Cases**: Organizational charts, graph traversal, series generation

```sql
-- Basic CTE examples
-- Simple CTE for readability
WITH high_performers AS (
    SELECT 
        student_name,
        score,
        RANK() OVER (ORDER BY score DESC) as rank
    FROM student_scores
    WHERE score >= 90
),
department_stats AS (
    SELECT 
        department,
        COUNT(*) as employee_count,
        AVG(amount) as avg_sales
    FROM sales
    GROUP BY department
)
SELECT 
    hp.student_name,
    hp.score,
    hp.rank,
    'High Performer' as category
FROM high_performers hp
WHERE hp.rank <= 3;

-- Multiple CTEs with dependencies
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', sale_date) as month,
        department,
        SUM(amount) as total_sales
    FROM sales
    GROUP BY DATE_TRUNC('month', sale_date), department
),
department_rankings AS (
    SELECT 
        month,
        department,
        total_sales,
        RANK() OVER (PARTITION BY month ORDER BY total_sales DESC) as rank
    FROM monthly_sales
),
top_departments AS (
    SELECT 
        month,
        department,
        total_sales
    FROM department_rankings
    WHERE rank = 1
)
SELECT 
    month,
    department,
    total_sales,
    'Top Department of Month' as achievement
FROM top_departments
ORDER BY month;
```

#### Recursive CTEs Examples
```sql
-- Recursive CTE examples

-- 1. Generate series
WITH RECURSIVE number_series AS (
    -- Anchor: starting point
    SELECT 1 as n
    
    UNION ALL
    
    -- Recursive: iteration rule
    SELECT n + 1
    FROM number_series
    WHERE n < 10
)
SELECT n FROM number_series;

-- 2. Fibonacci sequence
WITH RECURSIVE fibonacci AS (
    -- Anchor: first two numbers
    SELECT 1 as position, 0 as fib_num, 1 as next_fib
    
    UNION ALL
    
    -- Recursive: generate next number
    SELECT 
        position + 1,
        next_fib,
        fib_num + next_fib
    FROM fibonacci
    WHERE position < 10
)
SELECT position, fib_num FROM fibonacci;

-- 3. Organizational hierarchy
CREATE TABLE employees (
    emp_id INTEGER,
    name VARCHAR(50),
    manager_id INTEGER
);

INSERT INTO employees VALUES
(1, 'CEO', NULL),
(2, 'VP Sales', 1),
(3, 'VP Engineering', 1),
(4, 'Sales Manager', 2),
(5, 'Engineer', 3),
(6, 'Sales Rep', 4);

-- Recursive hierarchy traversal
WITH RECURSIVE org_chart AS (
    -- Anchor: top-level managers
    SELECT 
        emp_id,
        name,
        manager_id,
        0 as level,
        name as path
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive: find direct reports
    SELECT 
        e.emp_id,
        e.name,
        e.manager_id,
        oc.level + 1,
        oc.path || ' -> ' || e.name
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.emp_id
)
SELECT 
    emp_id,
    REPEAT('  ', level) || name as indented_name,
    level,
    path
FROM org_chart
ORDER BY path;

-- 4. Graph traversal (find all paths)
CREATE TABLE connections (
    from_node VARCHAR(10),
    to_node VARCHAR(10),
    weight INTEGER
);

INSERT INTO connections VALUES
('A', 'B', 1), ('A', 'C', 2),
('B', 'D', 3), ('C', 'D', 1),
('D', 'E', 2);

WITH RECURSIVE path_finder AS (
    -- Anchor: starting nodes
    SELECT 
        from_node,
        to_node,
        weight,
        from_node as start_node,
        ARRAY[from_node, to_node] as path,
        weight as total_weight
    FROM connections
    WHERE from_node = 'A'  -- Start from node A
    
    UNION ALL
    
    -- Recursive: extend paths
    SELECT 
        c.from_node,
        c.to_node,
        c.weight,
        pf.start_node,
        pf.path || c.to_node,
        pf.total_weight + c.weight
    FROM connections c
    JOIN path_finder pf ON c.from_node = pf.to_node
    WHERE NOT (c.to_node = ANY(pf.path))  -- Avoid cycles
)
SELECT 
    start_node,
    to_node as end_node,
    path,
    total_weight
FROM path_finder
WHERE to_node = 'E'  -- Paths to node E
ORDER BY total_weight;
```

### 8. Advanced Window Function Patterns

#### Complex Analytical Queries
```sql
-- Advanced analytical patterns combining multiple window functions
WITH sales_analytics AS (
    SELECT 
        employee_name,
        department,
        sale_date,
        amount,
        -- Multiple ranking approaches
        ROW_NUMBER() OVER (ORDER BY amount DESC) as overall_rank,
        RANK() OVER (PARTITION BY department ORDER BY amount DESC) as dept_rank,
        DENSE_RANK() OVER (ORDER BY sale_date, amount DESC) as chronological_rank,
        
        -- Statistical measures
        PERCENT_RANK() OVER (PARTITION BY department ORDER BY amount) as dept_percentile,
        NTILE(5) OVER (ORDER BY amount) as quintile,
        
        -- Running calculations
        SUM(amount) OVER (
            PARTITION BY department 
            ORDER BY sale_date 
            ROWS UNBOUNDED PRECEDING
        ) as dept_running_total,
        
        -- Moving averages
        AVG(amount) OVER (
            ORDER BY sale_date 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) as ma_3day,
        
        -- Comparative analysis
        LAG(amount) OVER (PARTITION BY employee_name ORDER BY sale_date) as prev_sale,
        LEAD(amount) OVER (PARTITION BY employee_name ORDER BY sale_date) as next_sale,
        
        -- First and last values
        FIRST_VALUE(amount) OVER (
            PARTITION BY employee_name 
            ORDER BY sale_date 
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as first_sale,
        LAST_VALUE(amount) OVER (
            PARTITION BY employee_name 
            ORDER BY sale_date 
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) as last_sale
    FROM sales
),
performance_metrics AS (
    SELECT 
        *,
        -- Performance indicators
        CASE 
            WHEN dept_percentile >= 0.8 THEN 'Top Performer'
            WHEN dept_percentile >= 0.6 THEN 'Above Average'
            WHEN dept_percentile >= 0.4 THEN 'Average'
            WHEN dept_percentile >= 0.2 THEN 'Below Average'
            ELSE 'Needs Improvement'
        END as performance_tier,
        
        -- Growth analysis
        CASE 
            WHEN prev_sale IS NULL THEN 'First Sale'
            WHEN amount > prev_sale THEN 'Improving'
            WHEN amount = prev_sale THEN 'Stable'
            ELSE 'Declining'
        END as trend
    FROM sales_analytics
)
SELECT * FROM performance_metrics
ORDER BY department, dept_rank;
```

#### Window Functions for Data Quality
```sql
-- Data quality and anomaly detection using window functions
CREATE TABLE sensor_readings (
    sensor_id INTEGER,
    timestamp TIMESTAMP,
    temperature DECIMAL(5,2)
);

-- Sample data with anomalies
INSERT INTO sensor_readings VALUES
(1, '2024-01-01 10:00', 20.5),
(1, '2024-01-01 11:00', 21.2),
(1, '2024-01-01 12:00', 45.8),  -- Anomaly
(1, '2024-01-01 13:00', 22.1),
(1, '2024-01-01 14:00', 21.8);

WITH anomaly_detection AS (
    SELECT 
        sensor_id,
        timestamp,
        temperature,
        -- Statistical measures for anomaly detection
        AVG(temperature) OVER (
            PARTITION BY sensor_id 
            ORDER BY timestamp 
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ) as moving_avg,
        STDDEV(temperature) OVER (
            PARTITION BY sensor_id 
            ORDER BY timestamp 
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ) as moving_stddev,
        -- Z-score calculation
        (temperature - AVG(temperature) OVER (
            PARTITION BY sensor_id 
            ORDER BY timestamp 
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        )) / NULLIF(STDDEV(temperature) OVER (
            PARTITION BY sensor_id 
            ORDER BY timestamp 
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ), 0) as z_score,
        -- Rate of change
        ABS(temperature - LAG(temperature) OVER (
            PARTITION BY sensor_id ORDER BY timestamp
        )) as rate_of_change
    FROM sensor_readings
)
SELECT 
    *,
    CASE 
        WHEN ABS(z_score) > 2 THEN 'Statistical Anomaly'
        WHEN rate_of_change > 10 THEN 'Rapid Change'
        ELSE 'Normal'
    END as anomaly_status
FROM anomaly_detection
ORDER BY sensor_id, timestamp;
```

## Study Plan Recommendations

### Phase 1: Fundamentals (Days 1-4)
- Master window function concepts and OVER clause
- Understand PARTITION BY and ORDER BY
- Practice basic ranking functions

### Phase 2: Advanced Functions (Days 5-8)  
- Learn offset functions (LAG, LEAD, FIRST_VALUE, etc.)
- Master frame specifications (ROWS vs RANGE)
- Study statistical functions (NTILE, PERCENT_RANK, CUME_DIST)

### Phase 3: Analytical Patterns (Days 9-12)
- Practice running totals and moving averages
- Learn gap analysis and sequence detection
- Master year-over-year comparisons

### Phase 4: CTEs and Complex Queries (Days 13-15)
- Study Common Table Expressions
- Master recursive CTEs
- Practice complex analytical scenarios

## Key Resources for Interview Preparation

1. **PostgreSQL Documentation**: Window functions and CTEs
2. **Hands-on Practice**: Create sample datasets and practice queries
3. **Real-world Scenarios**: Study business analytics use cases
4. **Performance Considerations**: Understand when to use window functions vs GROUP BY
5. **Edge Cases**: Practice with NULL values, empty sets, and boundary conditions

## Common Interview Scenarios

1. **Business Analytics**: Sales performance analysis, ranking employees
2. **Time Series Analysis**: Running totals, moving averages, trend detection
3. **Data Quality**: Anomaly detection, gap analysis, sequence validation
4. **Hierarchy Navigation**: Organizational charts, category trees
5. **Performance Optimization**: When to use window functions vs other approaches

This comprehensive knowledge foundation will enable you to confidently answer all PostgreSQL window functions and advanced SQL questions (Q256-280) in technical interviews.