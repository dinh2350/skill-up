# Question 57: What is a recursive CTE?

## Overview

A **Recursive Common Table Expression (Recursive CTE)** is a special type of CTE that references itself, allowing you to perform recursive operations in SQL. It's particularly useful for processing hierarchical data, tree structures, graphs, and iterative calculations.

### Basic Syntax:

```sql
WITH RECURSIVE cte_name AS (
    -- Anchor/Base case (non-recursive part)
    SELECT initial_values
    FROM base_table
    WHERE base_condition

    UNION [ALL]

    -- Recursive part (references the CTE itself)
    SELECT recursive_values
    FROM cte_name
    JOIN other_tables ON join_condition
    WHERE recursive_condition
)
SELECT * FROM cte_name;
```

### Key Components:

1. **Anchor Member**: The base case that doesn't reference the CTE itself
2. **UNION/UNION ALL**: Combines anchor and recursive results
3. **Recursive Member**: The part that references the CTE itself
4. **Termination Condition**: Logic that prevents infinite recursion

### How It Works:

1. Execute the anchor member to get initial results
2. Use those results as input to the recursive member
3. Repeat step 2 until no new rows are generated
4. Return the UNION of all iterations

## Basic Recursive CTE Examples

### 1. **Simple Number Sequence**

```sql
-- Generate numbers from 1 to 10
WITH RECURSIVE number_sequence AS (
    -- Anchor: Start with 1
    SELECT 1 AS n

    UNION ALL

    -- Recursive: Add 1 until we reach 10
    SELECT n + 1
    FROM number_sequence
    WHERE n < 10
)
SELECT n FROM number_sequence;

-- Generate Fibonacci sequence
WITH RECURSIVE fibonacci AS (
    -- Anchor: First two Fibonacci numbers
    SELECT 1 AS iteration, 0 AS fib_current, 1 AS fib_next

    UNION ALL

    -- Recursive: Generate next Fibonacci number
    SELECT
        iteration + 1,
        fib_next,
        fib_current + fib_next
    FROM fibonacci
    WHERE iteration < 10
)
SELECT
    iteration,
    fib_current AS fibonacci_number
FROM fibonacci
ORDER BY iteration;

-- Generate date series
WITH RECURSIVE date_series AS (
    -- Anchor: Start date
    SELECT '2024-01-01'::DATE AS date_value

    UNION ALL

    -- Recursive: Add one day until end date
    SELECT date_value + INTERVAL '1 day'
    FROM date_series
    WHERE date_value < '2024-01-31'::DATE
)
SELECT
    date_value,
    TO_CHAR(date_value, 'Day') AS day_name,
    EXTRACT(DOW FROM date_value) AS day_of_week
FROM date_series
ORDER BY date_value;
```

### 2. **Hierarchical Data Processing**

```sql
-- Employee hierarchy (manager-subordinate relationships)
WITH RECURSIVE employee_hierarchy AS (
    -- Anchor: Find all top-level managers (no manager)
    SELECT
        employee_id,
        employee_name,
        manager_id,
        0 AS level,
        ARRAY[employee_name] AS path,
        employee_name AS hierarchy_path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive: Find all subordinates
    SELECT
        e.employee_id,
        e.employee_name,
        e.manager_id,
        eh.level + 1,
        eh.path || e.employee_name,
        eh.hierarchy_path || ' -> ' || e.employee_name
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT
    employee_id,
    employee_name,
    level,
    hierarchy_path,
    CASE
        WHEN level = 0 THEN 'CEO/President'
        WHEN level = 1 THEN 'VP/Director'
        WHEN level = 2 THEN 'Manager'
        WHEN level = 3 THEN 'Team Lead'
        ELSE 'Individual Contributor'
    END AS job_level
FROM employee_hierarchy
ORDER BY level, employee_name;

-- Category hierarchy (parent-child categories)
WITH RECURSIVE category_tree AS (
    -- Anchor: Root categories
    SELECT
        category_id,
        category_name,
        parent_category_id,
        0 AS depth,
        category_name AS full_path,
        ARRAY[category_id] AS path_ids
    FROM categories
    WHERE parent_category_id IS NULL

    UNION ALL

    -- Recursive: Child categories
    SELECT
        c.category_id,
        c.category_name,
        c.parent_category_id,
        ct.depth + 1,
        ct.full_path || ' > ' || c.category_name,
        ct.path_ids || c.category_id
    FROM categories c
    JOIN category_tree ct ON c.parent_category_id = ct.category_id
)
SELECT
    category_id,
    REPEAT('  ', depth) || category_name AS indented_name,
    full_path,
    depth,
    array_length(path_ids, 1) AS path_length
FROM category_tree
ORDER BY full_path;
```

## Advanced Recursive CTE Applications

### 1. **Graph Traversal and Path Finding**

```sql
-- Find all possible paths between two nodes in a network
WITH RECURSIVE network_paths AS (
    -- Anchor: Start from source node
    SELECT
        source_node,
        target_node,
        weight,
        1 AS hop_count,
        ARRAY[source_node, target_node] AS path,
        weight AS total_weight
    FROM network_connections
    WHERE source_node = 'A'  -- Starting point

    UNION ALL

    -- Recursive: Extend paths
    SELECT
        np.source_node,
        nc.target_node,
        nc.weight,
        np.hop_count + 1,
        np.path || nc.target_node,
        np.total_weight + nc.weight
    FROM network_paths np
    JOIN network_connections nc ON np.target_node = nc.source_node
    WHERE
        -- Prevent cycles
        NOT (nc.target_node = ANY(np.path))
        -- Limit path length to prevent runaway recursion
        AND np.hop_count < 10
)
SELECT
    source_node,
    target_node,
    hop_count,
    array_to_string(path, ' -> ') AS route,
    total_weight
FROM network_paths
WHERE target_node = 'Z'  -- Destination
ORDER BY total_weight, hop_count;

-- Social network: Find friends of friends up to N degrees
WITH RECURSIVE friend_network AS (
    -- Anchor: Direct friends
    SELECT
        f.user_id,
        f.friend_id,
        1 AS degree,
        ARRAY[f.user_id, f.friend_id] AS connection_path
    FROM friendships f
    WHERE f.user_id = 12345  -- Starting user

    UNION ALL

    -- Recursive: Friends of friends
    SELECT
        fn.user_id,
        f.friend_id,
        fn.degree + 1,
        fn.connection_path || f.friend_id
    FROM friend_network fn
    JOIN friendships f ON fn.friend_id = f.user_id
    WHERE
        -- Avoid cycles and limit degrees of separation
        NOT (f.friend_id = ANY(fn.connection_path))
        AND fn.degree < 3  -- Up to 3 degrees of separation
)
SELECT
    u.username,
    fn.degree,
    array_to_string(fn.connection_path[2:], ' -> ') AS connection_chain
FROM friend_network fn
JOIN users u ON fn.friend_id = u.user_id
ORDER BY fn.degree, u.username;
```

### 2. **Bill of Materials (BOM) and Manufacturing**

```sql
-- Explode Bill of Materials to show all components
WITH RECURSIVE bom_explosion AS (
    -- Anchor: Top-level product
    SELECT
        product_id,
        component_id,
        quantity_required,
        1 AS level,
        product_id::TEXT AS root_product,
        ARRAY[product_id] AS assembly_path,
        quantity_required AS total_quantity
    FROM bill_of_materials
    WHERE product_id = 'LAPTOP_X1'  -- Final product

    UNION ALL

    -- Recursive: Sub-components
    SELECT
        bom.product_id,
        bom.component_id,
        bom.quantity_required,
        be.level + 1,
        be.root_product,
        be.assembly_path || bom.product_id,
        be.total_quantity * bom.quantity_required
    FROM bill_of_materials bom
    JOIN bom_explosion be ON bom.product_id = be.component_id
    WHERE
        -- Prevent circular references
        NOT (bom.product_id = ANY(be.assembly_path))
        -- Limit recursion depth
        AND be.level < 10
),

-- Calculate total quantities needed for each component
component_totals AS (
    SELECT
        component_id,
        SUM(total_quantity) AS total_needed
    FROM bom_explosion
    GROUP BY component_id
)

-- Final BOM report
SELECT
    p.product_name AS component_name,
    p.product_type,
    ct.total_needed,
    p.unit_cost,
    ct.total_needed * p.unit_cost AS total_cost,
    i.quantity_on_hand,
    CASE
        WHEN i.quantity_on_hand >= ct.total_needed THEN 'In Stock'
        WHEN i.quantity_on_hand > 0 THEN 'Partial Stock'
        ELSE 'Out of Stock'
    END AS stock_status
FROM component_totals ct
JOIN products p ON ct.component_id = p.product_id
LEFT JOIN inventory i ON p.product_id = i.product_id
ORDER BY p.product_type, p.product_name;
```

### 3. **Financial Analysis and Calculations**

```sql
-- Calculate compound interest and investment growth
WITH RECURSIVE investment_growth AS (
    -- Anchor: Initial investment
    SELECT
        0 AS year,
        10000.00 AS balance,
        0.00 AS interest_earned,
        0.00 AS total_interest

    UNION ALL

    -- Recursive: Apply interest each year
    SELECT
        year + 1,
        balance * 1.07 AS balance,  -- 7% annual interest
        balance * 0.07 AS interest_earned,
        total_interest + (balance * 0.07) AS total_interest
    FROM investment_growth
    WHERE year < 30  -- 30 year investment
)
SELECT
    year,
    ROUND(balance, 2) AS account_balance,
    ROUND(interest_earned, 2) AS yearly_interest,
    ROUND(total_interest, 2) AS cumulative_interest,
    ROUND(balance - 10000.00, 2) AS total_growth
FROM investment_growth
ORDER BY year;

-- Amortization schedule for loan payments
WITH RECURSIVE loan_schedule AS (
    -- Anchor: Initial loan
    SELECT
        0 AS payment_number,
        200000.00 AS remaining_balance,  -- $200k loan
        0.00 AS payment_amount,
        0.00 AS interest_payment,
        0.00 AS principal_payment

    UNION ALL

    -- Recursive: Calculate each payment
    SELECT
        payment_number + 1,
        remaining_balance - (1200.00 - (remaining_balance * 0.004167)),  -- Principal reduction
        1200.00 AS payment_amount,  -- Fixed monthly payment
        remaining_balance * 0.004167 AS interest_payment,  -- 5% annual / 12 months
        1200.00 - (remaining_balance * 0.004167) AS principal_payment
    FROM loan_schedule
    WHERE remaining_balance > 0
      AND payment_number < 360  -- 30 year loan (360 payments)
)
SELECT
    payment_number,
    ROUND(payment_amount, 2) AS monthly_payment,
    ROUND(interest_payment, 2) AS interest_portion,
    ROUND(principal_payment, 2) AS principal_portion,
    ROUND(remaining_balance, 2) AS balance_remaining
FROM loan_schedule
WHERE payment_number > 0  -- Skip initial state
ORDER BY payment_number;
```

### 4. **Time Series and Data Generation**

```sql
-- Generate missing time series data
WITH RECURSIVE time_series AS (
    -- Anchor: Start date
    SELECT
        DATE_TRUNC('hour', MIN(timestamp_column)) AS time_slot
    FROM sensor_readings
    WHERE timestamp_column >= '2024-01-01'

    UNION ALL

    -- Recursive: Generate hourly slots
    SELECT time_slot + INTERVAL '1 hour'
    FROM time_series
    WHERE time_slot < (
        SELECT DATE_TRUNC('hour', MAX(timestamp_column))
        FROM sensor_readings
        WHERE timestamp_column >= '2024-01-01'
    )
),

-- Fill in missing data with interpolation
complete_data AS (
    SELECT
        ts.time_slot,
        COALESCE(sr.sensor_value,
            -- Linear interpolation for missing values
            LAG(sr.sensor_value) OVER (ORDER BY ts.time_slot)
        ) AS sensor_value,
        CASE WHEN sr.sensor_value IS NULL THEN 'interpolated' ELSE 'actual' END AS data_type
    FROM time_series ts
    LEFT JOIN sensor_readings sr ON DATE_TRUNC('hour', sr.timestamp_column) = ts.time_slot
)

SELECT
    time_slot,
    sensor_value,
    data_type,
    AVG(sensor_value) OVER (
        ORDER BY time_slot
        ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING
    ) AS smoothed_value
FROM complete_data
ORDER BY time_slot;

-- Generate calendar with business days
WITH RECURSIVE business_calendar AS (
    -- Anchor: Start date
    SELECT
        '2024-01-01'::DATE AS calendar_date,
        EXTRACT(DOW FROM '2024-01-01'::DATE) AS day_of_week

    UNION ALL

    -- Recursive: Next day
    SELECT
        calendar_date + INTERVAL '1 day',
        EXTRACT(DOW FROM calendar_date + INTERVAL '1 day')
    FROM business_calendar
    WHERE calendar_date < '2024-12-31'::DATE
)
SELECT
    calendar_date,
    TO_CHAR(calendar_date, 'Day') AS day_name,
    CASE
        WHEN day_of_week IN (0, 6) THEN 'Weekend'
        WHEN calendar_date IN (
            SELECT holiday_date FROM company_holidays
            WHERE EXTRACT(YEAR FROM holiday_date) = 2024
        ) THEN 'Holiday'
        ELSE 'Business Day'
    END AS day_type,
    -- Business day counter
    SUM(CASE WHEN day_of_week NOT IN (0, 6) THEN 1 ELSE 0 END)
    OVER (ORDER BY calendar_date) AS business_day_number
FROM business_calendar
ORDER BY calendar_date;
```

## Complex Real-World Applications

### 1. **Supply Chain and Logistics**

```sql
-- Multi-level supply chain impact analysis
WITH RECURSIVE supply_chain_impact AS (
    -- Anchor: Directly affected suppliers
    SELECT
        supplier_id,
        supplier_name,
        'Direct Impact' AS impact_type,
        1 AS impact_level,
        ARRAY[supplier_id] AS supply_path,
        disruption_severity
    FROM suppliers
    WHERE location = 'Affected Region'
      AND disruption_severity > 0

    UNION ALL

    -- Recursive: Suppliers who depend on affected suppliers
    SELECT
        s.supplier_id,
        s.supplier_name,
        'Indirect Impact' AS impact_type,
        sci.impact_level + 1,
        sci.supply_path || s.supplier_id,
        GREATEST(sci.disruption_severity - 1, 1)  -- Diminishing impact
    FROM suppliers s
    JOIN supplier_dependencies sd ON s.supplier_id = sd.dependent_supplier_id
    JOIN supply_chain_impact sci ON sd.source_supplier_id = sci.supplier_id
    WHERE
        NOT (s.supplier_id = ANY(sci.supply_path))  -- Prevent cycles
        AND sci.impact_level < 5  -- Limit cascade depth
        AND sci.disruption_severity > 0
),

-- Calculate business impact
impact_summary AS (
    SELECT
        sci.supplier_id,
        sci.supplier_name,
        sci.impact_type,
        sci.impact_level,
        sci.disruption_severity,
        SUM(p.monthly_volume * p.unit_value) AS affected_value,
        COUNT(DISTINCT p.product_id) AS affected_products
    FROM supply_chain_impact sci
    JOIN supplier_products sp ON sci.supplier_id = sp.supplier_id
    JOIN products p ON sp.product_id = p.product_id
    GROUP BY sci.supplier_id, sci.supplier_name, sci.impact_type, sci.impact_level, sci.disruption_severity
)

SELECT
    supplier_name,
    impact_type,
    impact_level,
    disruption_severity,
    affected_products,
    TO_CHAR(affected_value, '$999,999,999') AS monthly_value_at_risk,
    CASE
        WHEN impact_level = 1 AND disruption_severity >= 8 THEN 'Critical'
        WHEN impact_level <= 2 AND disruption_severity >= 6 THEN 'High'
        WHEN impact_level <= 3 AND disruption_severity >= 4 THEN 'Medium'
        ELSE 'Low'
    END AS risk_category
FROM impact_summary
ORDER BY disruption_severity DESC, impact_level, affected_value DESC;
```

### 2. **Customer Journey and Attribution**

```sql
-- Multi-touch attribution analysis
WITH RECURSIVE customer_journey AS (
    -- Anchor: First touchpoint for each customer
    SELECT
        customer_id,
        touchpoint_id,
        touchpoint_type,
        touchpoint_date,
        channel,
        campaign_id,
        1 AS sequence_number,
        ARRAY[touchpoint_type] AS journey_path,
        conversion_value
    FROM customer_touchpoints
    WHERE touchpoint_date >= '2024-01-01'
      AND sequence_number = 1  -- First interaction

    UNION ALL

    -- Recursive: Subsequent touchpoints
    SELECT
        ct.customer_id,
        ct.touchpoint_id,
        ct.touchpoint_type,
        ct.touchpoint_date,
        ct.channel,
        ct.campaign_id,
        cj.sequence_number + 1,
        cj.journey_path || ct.touchpoint_type,
        ct.conversion_value
    FROM customer_touchpoints ct
    JOIN customer_journey cj ON ct.customer_id = cj.customer_id
    WHERE ct.touchpoint_date > cj.touchpoint_date
      AND cj.sequence_number < 20  -- Limit journey length
      AND ct.touchpoint_date <= cj.touchpoint_date + INTERVAL '90 days'  -- Journey window
),

-- Attribution modeling
attribution_analysis AS (
    SELECT
        customer_id,
        touchpoint_type,
        channel,
        campaign_id,
        sequence_number,
        MAX(sequence_number) OVER (PARTITION BY customer_id) AS journey_length,
        conversion_value,
        -- Time-decay attribution
        CASE
            WHEN sequence_number = MAX(sequence_number) OVER (PARTITION BY customer_id)
            THEN conversion_value * 0.4  -- Last touch gets 40%
            WHEN sequence_number = 1
            THEN conversion_value * 0.2  -- First touch gets 20%
            ELSE conversion_value * 0.4 / (MAX(sequence_number) OVER (PARTITION BY customer_id) - 2)  -- Distribute remaining 40%
        END AS attributed_value
    FROM customer_journey
    WHERE conversion_value > 0
)

SELECT
    channel,
    campaign_id,
    COUNT(DISTINCT customer_id) AS customers_influenced,
    SUM(attributed_value) AS total_attributed_revenue,
    AVG(attributed_value) AS avg_attributed_value,
    SUM(CASE WHEN sequence_number = 1 THEN attributed_value ELSE 0 END) AS first_touch_attribution,
    SUM(CASE WHEN sequence_number = journey_length THEN attributed_value ELSE 0 END) AS last_touch_attribution
FROM attribution_analysis
GROUP BY channel, campaign_id
ORDER BY total_attributed_revenue DESC;
```

## Performance Considerations and Best Practices

### 1. **Preventing Infinite Recursion**

```sql
-- Always include termination conditions
WITH RECURSIVE safe_recursion AS (
    -- Anchor
    SELECT id, parent_id, 0 AS level
    FROM hierarchy_table
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive with safety measures
    SELECT h.id, h.parent_id, sr.level + 1
    FROM hierarchy_table h
    JOIN safe_recursion sr ON h.parent_id = sr.id
    WHERE sr.level < 100  -- Maximum depth limit
      AND h.id != sr.id   -- Prevent direct self-reference
)
SELECT * FROM safe_recursion;

-- Track visited nodes to prevent cycles
WITH RECURSIVE cycle_safe AS (
    -- Anchor
    SELECT
        id,
        parent_id,
        0 AS level,
        ARRAY[id] AS visited_path
    FROM hierarchy_table
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive with cycle detection
    SELECT
        h.id,
        h.parent_id,
        cs.level + 1,
        cs.visited_path || h.id
    FROM hierarchy_table h
    JOIN cycle_safe cs ON h.parent_id = cs.id
    WHERE cs.level < 50
      AND NOT (h.id = ANY(cs.visited_path))  -- Cycle prevention
)
SELECT * FROM cycle_safe;
```

### 2. **Performance Optimization**

```sql
-- Use appropriate indexes for recursive queries
CREATE INDEX idx_hierarchy_parent_id ON hierarchy_table(parent_id);
CREATE INDEX idx_hierarchy_id_parent ON hierarchy_table(id, parent_id);

-- Consider using breadth-first vs depth-first traversal
WITH RECURSIVE breadth_first AS (
    -- Process all nodes at each level before going deeper
    SELECT id, parent_id, name, 0 AS level
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT c.id, c.parent_id, c.name, bf.level + 1
    FROM breadth_first bf
    JOIN categories c ON c.parent_id = bf.id
    WHERE bf.level < 10
)
SELECT * FROM breadth_first
ORDER BY level, id;  -- Breadth-first order
```

### 3. **Memory Management**

```sql
-- For large datasets, consider using UNION instead of UNION ALL
-- to eliminate duplicates and reduce memory usage
WITH RECURSIVE large_hierarchy AS (
    SELECT id, parent_id, 0 AS level
    FROM large_hierarchy_table
    WHERE parent_id IS NULL

    UNION  -- Instead of UNION ALL for deduplication

    SELECT h.id, h.parent_id, lh.level + 1
    FROM large_hierarchy_table h
    JOIN large_hierarchy lh ON h.parent_id = lh.id
    WHERE lh.level < 20
)
SELECT * FROM large_hierarchy;

-- Use CTEs to break down complex recursive logic
WITH RECURSIVE step1 AS (
    -- Initial processing
    SELECT id, parent_id FROM table1 WHERE condition1
),
step2 AS (
    -- Recursive processing on subset
    SELECT s1.id, t2.related_id
    FROM step1 s1
    JOIN table2 t2 ON s1.id = t2.id

    UNION ALL

    SELECT t2.id, t2.related_id
    FROM step2 s2
    JOIN table2 t2 ON s2.related_id = t2.id
    WHERE s2.level < 5
)
SELECT * FROM step2;
```

Recursive CTEs are powerful tools for handling hierarchical data and iterative calculations, but they require careful design to ensure performance and prevent infinite recursion. They're essential for many real-world scenarios involving tree structures, graphs, and complex data relationships.
