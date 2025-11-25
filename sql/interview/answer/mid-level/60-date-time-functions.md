# Date/Time Functions in PostgreSQL

Date and time functions in PostgreSQL provide powerful capabilities for extracting, formatting, calculating, and manipulating temporal data. These functions are essential for business analytics, reporting, scheduling systems, and time-series analysis.

## Core Date/Time Functions

### 1. EXTRACT Function

The `EXTRACT` function retrieves specific parts from date/time values.

```sql
-- Basic extraction examples
SELECT
    current_date as today,
    EXTRACT(YEAR FROM current_date) as year,
    EXTRACT(MONTH FROM current_date) as month,
    EXTRACT(DAY FROM current_date) as day,
    EXTRACT(HOUR FROM current_timestamp) as hour,
    EXTRACT(MINUTE FROM current_timestamp) as minute,
    EXTRACT(SECOND FROM current_timestamp) as second;

-- Working with business data
SELECT
    order_id,
    order_date,
    EXTRACT(YEAR FROM order_date) as order_year,
    EXTRACT(QUARTER FROM order_date) as order_quarter,
    EXTRACT(MONTH FROM order_date) as order_month,
    EXTRACT(WEEK FROM order_date) as order_week,
    EXTRACT(DOW FROM order_date) as day_of_week  -- 0=Sunday, 6=Saturday
FROM orders
WHERE EXTRACT(YEAR FROM order_date) = 2024;

-- Advanced extractions
SELECT
    employee_id,
    hire_date,
    EXTRACT(DOY FROM hire_date) as day_of_year,     -- Day of year (1-366)
    EXTRACT(EPOCH FROM hire_date) as unix_timestamp, -- Seconds since 1970-01-01
    EXTRACT(TIMEZONE FROM hire_date AT TIME ZONE 'UTC') as tz_offset
FROM employees;
```

### 2. DATE_PART Function

`DATE_PART` is functionally equivalent to `EXTRACT` but uses string notation.

```sql
-- DATE_PART vs EXTRACT (equivalent results)
SELECT
    order_date,
    DATE_PART('year', order_date) as year_datepart,
    EXTRACT(YEAR FROM order_date) as year_extract,
    DATE_PART('month', order_date) as month_datepart,
    EXTRACT(MONTH FROM order_date) as month_extract
FROM orders
LIMIT 5;

-- Useful for dynamic queries
SELECT
    product_id,
    sale_date,
    DATE_PART('quarter', sale_date) as quarter,
    DATE_PART('isodow', sale_date) as iso_day_of_week  -- 1=Monday, 7=Sunday
FROM sales
WHERE DATE_PART('year', sale_date) = 2024;
```

### 3. Date/Time Formatting with TO_CHAR

The `TO_CHAR` function converts dates/timestamps to formatted strings.

```sql
-- Basic formatting
SELECT
    current_timestamp,
    TO_CHAR(current_timestamp, 'YYYY-MM-DD') as iso_date,
    TO_CHAR(current_timestamp, 'DD/MM/YYYY') as eu_date,
    TO_CHAR(current_timestamp, 'MM/DD/YYYY') as us_date,
    TO_CHAR(current_timestamp, 'YYYY-MM-DD HH24:MI:SS') as full_timestamp;

-- Business-friendly formatting
SELECT
    order_id,
    order_date,
    TO_CHAR(order_date, 'Month DD, YYYY') as formatted_date,
    TO_CHAR(order_date, 'Day') as day_name,
    TO_CHAR(order_date, 'Mon YYYY') as month_year,
    TO_CHAR(order_date, 'Q"Q" YYYY') as quarter_year
FROM orders
ORDER BY order_date DESC
LIMIT 10;

-- Time formatting
SELECT
    appointment_id,
    appointment_time,
    TO_CHAR(appointment_time, 'HH12:MI AM') as twelve_hour,
    TO_CHAR(appointment_time, 'HH24:MI') as twenty_four_hour,
    TO_CHAR(appointment_time, 'Day, Month DD, YYYY at HH12:MI AM') as full_format
FROM appointments
WHERE appointment_time >= current_date;

-- Localized formatting
SELECT
    event_date,
    TO_CHAR(event_date, 'TMDay, TMMonth DD, YYYY') as localized_format
FROM events;
```

### 4. Date/Time Arithmetic

PostgreSQL supports various arithmetic operations on dates and times.

```sql
-- Basic arithmetic with INTERVAL
SELECT
    current_date,
    current_date + INTERVAL '1 day' as tomorrow,
    current_date - INTERVAL '1 day' as yesterday,
    current_date + INTERVAL '1 week' as next_week,
    current_date + INTERVAL '1 month' as next_month,
    current_date + INTERVAL '1 year' as next_year;

-- Complex interval calculations
SELECT
    employee_id,
    hire_date,
    current_date - hire_date as days_employed,
    AGE(current_date, hire_date) as employment_duration,
    hire_date + INTERVAL '90 days' as probation_end_date,
    hire_date + INTERVAL '1 year' as first_anniversary
FROM employees
WHERE hire_date >= current_date - INTERVAL '2 years';

-- Business calculations
SELECT
    project_id,
    start_date,
    estimated_duration,
    start_date + estimated_duration as estimated_end_date,
    CASE
        WHEN current_date > start_date + estimated_duration
        THEN 'Overdue'
        WHEN current_date > start_date + estimated_duration - INTERVAL '1 week'
        THEN 'Due Soon'
        ELSE 'On Track'
    END as status
FROM projects
WHERE start_date IS NOT NULL;

-- Age calculations
SELECT
    customer_id,
    birth_date,
    AGE(birth_date) as current_age,
    AGE('2024-01-01', birth_date) as age_at_year_start,
    EXTRACT(YEAR FROM AGE(birth_date)) as age_in_years
FROM customers
WHERE birth_date IS NOT NULL;
```

### 5. Date/Time Conversion Functions

Convert between different date/time formats and data types.

```sql
-- String to date/timestamp conversion
SELECT
    TO_DATE('2024-12-25', 'YYYY-MM-DD') as christmas_date,
    TO_TIMESTAMP('2024-12-25 15:30:00', 'YYYY-MM-DD HH24:MI:SS') as christmas_datetime,
    '2024-12-25'::DATE as cast_to_date,
    '2024-12-25 15:30:00'::TIMESTAMP as cast_to_timestamp;

-- Handling various input formats
SELECT
    TO_DATE('25/12/2024', 'DD/MM/YYYY') as european_format,
    TO_DATE('Dec 25, 2024', 'Mon DD, YYYY') as text_format,
    TO_TIMESTAMP('2024-12-25T15:30:00Z', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as iso_format;

-- Date truncation for grouping
SELECT
    DATE_TRUNC('day', order_timestamp) as order_date,
    DATE_TRUNC('week', order_timestamp) as order_week,
    DATE_TRUNC('month', order_timestamp) as order_month,
    DATE_TRUNC('quarter', order_timestamp) as order_quarter,
    DATE_TRUNC('year', order_timestamp) as order_year,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue
FROM orders
GROUP BY
    DATE_TRUNC('month', order_timestamp)
ORDER BY order_month;
```

## Advanced Date/Time Operations

### 1. Timezone Handling

```sql
-- Timezone conversion
SELECT
    appointment_time,
    appointment_time AT TIME ZONE 'UTC' as utc_time,
    appointment_time AT TIME ZONE 'America/New_York' as eastern_time,
    appointment_time AT TIME ZONE 'Europe/London' as london_time,
    appointment_time AT TIME ZONE 'Asia/Tokyo' as tokyo_time
FROM appointments
WHERE appointment_time >= current_date;

-- Working with timezone-aware data
SELECT
    event_id,
    event_time_utc,
    event_time_utc AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' as pacific_time,
    EXTRACT(HOUR FROM event_time_utc AT TIME ZONE 'Europe/Paris') as paris_hour
FROM global_events
WHERE event_time_utc >= current_timestamp - INTERVAL '24 hours';

-- Timezone-safe comparisons
SELECT
    user_id,
    login_time,
    login_time AT TIME ZONE 'UTC' as utc_login_time
FROM user_sessions
WHERE (login_time AT TIME ZONE 'UTC') >= (current_timestamp - INTERVAL '1 hour');
```

### 2. Business Day Calculations

```sql
-- Calculate business days (excluding weekends)
WITH business_days AS (
    SELECT
        project_id,
        start_date,
        end_date,
        end_date - start_date as total_days,
        -- Approximate business days calculation
        (end_date - start_date) -
        (EXTRACT(WEEK FROM end_date - start_date) * 2) as approx_business_days
    FROM projects
    WHERE start_date IS NOT NULL AND end_date IS NOT NULL
)
SELECT
    project_id,
    start_date,
    end_date,
    total_days,
    approx_business_days,
    CASE
        WHEN approx_business_days <= 5 THEN 'Short Term'
        WHEN approx_business_days <= 20 THEN 'Medium Term'
        ELSE 'Long Term'
    END as project_duration_category
FROM business_days;

-- Generate series of business days
SELECT
    date_series as business_day
FROM generate_series(
    '2024-01-01'::DATE,
    '2024-01-31'::DATE,
    '1 day'::INTERVAL
) as date_series
WHERE EXTRACT(DOW FROM date_series) NOT IN (0, 6);  -- Exclude Sunday (0) and Saturday (6)
```

### 3. Date Range Operations

```sql
-- Working with date ranges
SELECT
    promotion_id,
    promotion_name,
    start_date,
    end_date,
    current_date BETWEEN start_date AND end_date as is_active,
    CASE
        WHEN current_date < start_date THEN 'Upcoming'
        WHEN current_date > end_date THEN 'Expired'
        ELSE 'Active'
    END as status,
    GREATEST(0, end_date - current_date) as days_remaining
FROM promotions
ORDER BY start_date;

-- Overlapping date ranges
SELECT
    e1.employee_id,
    e1.start_date as employment_start,
    e1.end_date as employment_end,
    e2.project_id,
    e2.start_date as project_start,
    e2.end_date as project_end,
    -- Check for overlap
    (e1.start_date, COALESCE(e1.end_date, current_date)) OVERLAPS
    (e2.start_date, COALESCE(e2.end_date, current_date)) as has_overlap
FROM employee_history e1
JOIN project_assignments e2 ON e1.employee_id = e2.employee_id;
```

## Real-World Business Applications

### 1. Sales Analytics Dashboard

```sql
-- Comprehensive sales analytics with date functions
SELECT
    DATE_TRUNC('month', sale_date) as month,
    TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM') as month_label,
    COUNT(*) as total_sales,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_sale_amount,
    COUNT(CASE WHEN EXTRACT(DOW FROM sale_date) IN (1,2,3,4,5) THEN 1 END) as weekday_sales,
    COUNT(CASE WHEN EXTRACT(DOW FROM sale_date) IN (0,6) THEN 1 END) as weekend_sales,
    -- Year-over-year comparison
    LAG(SUM(amount), 12) OVER (ORDER BY DATE_TRUNC('month', sale_date)) as same_month_last_year,
    ROUND(
        (SUM(amount) - LAG(SUM(amount), 12) OVER (ORDER BY DATE_TRUNC('month', sale_date))) * 100.0 /
        NULLIF(LAG(SUM(amount), 12) OVER (ORDER BY DATE_TRUNC('month', sale_date)), 0),
        2
    ) as yoy_growth_percent
FROM sales
WHERE sale_date >= current_date - INTERVAL '2 years'
GROUP BY DATE_TRUNC('month', sale_date)
ORDER BY month;
```

### 2. Employee Scheduling System

```sql
-- Employee shift scheduling with date/time functions
SELECT
    employee_id,
    shift_date,
    shift_start_time,
    shift_end_time,
    TO_CHAR(shift_start_time, 'Day') as day_of_week,
    EXTRACT(HOUR FROM shift_start_time) as start_hour,
    shift_end_time - shift_start_time as shift_duration,
    CASE
        WHEN EXTRACT(HOUR FROM shift_start_time) < 6 THEN 'Night Shift'
        WHEN EXTRACT(HOUR FROM shift_start_time) < 14 THEN 'Morning Shift'
        WHEN EXTRACT(HOUR FROM shift_start_time) < 22 THEN 'Evening Shift'
        ELSE 'Night Shift'
    END as shift_type,
    -- Overtime calculation (over 8 hours)
    CASE
        WHEN shift_end_time - shift_start_time > INTERVAL '8 hours'
        THEN shift_end_time - shift_start_time - INTERVAL '8 hours'
        ELSE INTERVAL '0'
    END as overtime_hours
FROM employee_shifts
WHERE shift_date BETWEEN current_date AND current_date + INTERVAL '7 days'
ORDER BY employee_id, shift_date, shift_start_time;
```

### 3. Subscription Management

```sql
-- Subscription lifecycle management
SELECT
    subscription_id,
    customer_id,
    start_date,
    end_date,
    plan_duration,
    current_date - start_date as days_active,
    CASE
        WHEN end_date IS NULL THEN 'Active'
        WHEN end_date > current_date THEN 'Active'
        ELSE 'Expired'
    END as status,
    CASE
        WHEN end_date IS NULL THEN NULL
        WHEN end_date <= current_date THEN 0
        ELSE end_date - current_date
    END as days_until_expiry,
    -- Renewal date calculations
    CASE
        WHEN plan_duration = INTERVAL '1 month' THEN
            start_date + (EXTRACT(EPOCH FROM current_date - start_date) / EXTRACT(EPOCH FROM INTERVAL '1 month'))::INTEGER * INTERVAL '1 month'
        WHEN plan_duration = INTERVAL '1 year' THEN
            start_date + (EXTRACT(EPOCH FROM current_date - start_date) / EXTRACT(EPOCH FROM INTERVAL '1 year'))::INTEGER * INTERVAL '1 year'
    END as last_renewal_date,
    -- Next renewal prediction
    CASE
        WHEN end_date IS NULL OR end_date > current_date THEN
            COALESCE(end_date, start_date + plan_duration)
        ELSE NULL
    END as next_renewal_date
FROM subscriptions
WHERE start_date <= current_date
ORDER BY
    CASE WHEN end_date IS NOT NULL AND end_date <= current_date + INTERVAL '30 days' THEN 1 ELSE 2 END,
    end_date NULLS LAST;
```

## Performance Considerations

### 1. Indexing Date Columns

```sql
-- Effective indexing strategies for date queries
CREATE INDEX idx_orders_order_date ON orders (order_date);
CREATE INDEX idx_orders_order_date_desc ON orders (order_date DESC);

-- Partial indexes for active records
CREATE INDEX idx_active_subscriptions_end_date
ON subscriptions (end_date)
WHERE end_date > current_date OR end_date IS NULL;

-- Functional indexes for common extractions
CREATE INDEX idx_orders_year_month ON orders (EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date));
CREATE INDEX idx_events_date_trunc_day ON events (DATE_TRUNC('day', event_timestamp));
```

### 2. Query Optimization Patterns

```sql
-- Efficient date range queries
-- Good: Uses index effectively
SELECT * FROM orders
WHERE order_date >= '2024-01-01'
AND order_date < '2024-02-01';

-- Less efficient: Function prevents index usage
SELECT * FROM orders
WHERE EXTRACT(YEAR FROM order_date) = 2024
AND EXTRACT(MONTH FROM order_date) = 1;

-- Better alternative with computed column or functional index
SELECT * FROM orders
WHERE DATE_TRUNC('month', order_date) = '2024-01-01';
```

### 3. Timezone Best Practices

```sql
-- Store UTC timestamps, display in local time
SELECT
    event_id,
    event_timestamp_utc,
    event_timestamp_utc AT TIME ZONE 'UTC' AT TIME ZONE user_timezone as local_time
FROM events e
JOIN user_preferences up ON e.user_id = up.user_id
WHERE event_timestamp_utc >= current_timestamp - INTERVAL '24 hours';

-- Consistent timezone handling in application logic
-- Always convert to UTC before storing
INSERT INTO events (event_timestamp_utc, description)
VALUES
    (timezone('UTC', '2024-12-25 15:30:00'::timestamp), 'Christmas celebration'),
    (current_timestamp AT TIME ZONE 'UTC', 'Current event');
```

## Common Pitfalls and Solutions

### 1. Leap Year and Month-End Handling

```sql
-- Safe month arithmetic
SELECT
    date_value,
    -- This might fail on January 31st + 1 month
    date_value + INTERVAL '1 month' as unsafe_next_month,
    -- Safer approach using date_trunc
    DATE_TRUNC('month', date_value) + INTERVAL '1 month' as safe_next_month_start,
    -- Last day of next month
    (DATE_TRUNC('month', date_value) + INTERVAL '2 months' - INTERVAL '1 day') as safe_next_month_end
FROM (VALUES
    ('2024-01-31'::DATE),
    ('2024-02-29'::DATE),
    ('2024-03-31'::DATE)
) as test_dates(date_value);
```

### 2. Null Date Handling

```sql
-- Robust null handling in date calculations
SELECT
    employee_id,
    hire_date,
    termination_date,
    COALESCE(termination_date, current_date) - hire_date as employment_duration,
    CASE
        WHEN termination_date IS NULL THEN 'Active'
        ELSE 'Terminated'
    END as status,
    AGE(COALESCE(termination_date, current_date), hire_date) as formatted_duration
FROM employees
WHERE hire_date IS NOT NULL;
```

Date/time functions in PostgreSQL provide comprehensive capabilities for temporal data manipulation, enabling sophisticated business logic, analytics, and reporting. Understanding these functions and their proper usage patterns is crucial for building robust, performance-oriented database applications that handle time-sensitive data effectively.
