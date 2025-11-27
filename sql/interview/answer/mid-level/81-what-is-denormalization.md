# 81. What is denormalization?

## Definition

**Denormalization** is a database optimization technique where redundant data is intentionally added to one or more tables to improve read performance. It's the opposite of normalization—deliberately introducing redundancy to reduce the number of joins needed for queries.

## Why Denormalize?

### Performance Benefits:

1. **Fewer Joins**: Reduce complex multi-table joins
2. **Faster Reads**: Retrieve data from fewer tables
3. **Simplified Queries**: Less complex SQL statements
4. **Better Query Performance**: Especially for read-heavy applications
5. **Reduced I/O**: Fewer disk reads required

### Trade-offs:

- **Increased Storage**: Duplicate data takes more space
- **Data Inconsistency Risk**: Redundant data can become out of sync
- **Slower Writes**: Updates may need to modify multiple places
- **Complex Maintenance**: More logic to keep data consistent

## Common Denormalization Techniques

### 1. Adding Redundant Columns

Instead of joining tables, store frequently accessed data directly.

**Normalized (3NF):**

```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    order_date DATE
);

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100)
);

-- Query requires a join
SELECT o.order_id, c.customer_name, o.order_date
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;
```

**Denormalized:**

```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT,
    customer_name VARCHAR(100),  -- Denormalized: from customers table
    customer_email VARCHAR(100), -- Denormalized: from customers table
    order_date DATE
);

-- No join needed
SELECT order_id, customer_name, order_date
FROM orders;
```

### 2. Storing Calculated Values

Pre-calculate and store aggregated or computed values.

**Normalized:**

```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT,
    order_date DATE
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    product_id INT,
    quantity INT,
    price DECIMAL(10,2)
);

-- Calculate total on every query
SELECT o.order_id, SUM(oi.quantity * oi.price) AS order_total
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id;
```

**Denormalized:**

```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    order_total DECIMAL(10,2), -- Denormalized: pre-calculated
    item_count INT             -- Denormalized: pre-calculated
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    product_id INT,
    quantity INT,
    price DECIMAL(10,2)
);

-- Update trigger to keep order_total in sync
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET 
        order_total = (
            SELECT COALESCE(SUM(quantity * price), 0)
            FROM order_items
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        ),
        item_count = (
            SELECT COUNT(*)
            FROM order_items
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        )
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_totals
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

-- Simple query without aggregation
SELECT order_id, order_total, item_count
FROM orders;
```

### 3. Adding Summary Tables

Create separate tables for aggregated data.

```sql
-- Original normalized table
CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    product_id INT,
    sale_date DATE,
    amount DECIMAL(10,2),
    quantity INT
);

-- Denormalized summary table for reporting
CREATE TABLE daily_sales_summary (
    summary_date DATE PRIMARY KEY,
    total_sales DECIMAL(12,2),
    total_quantity INT,
    transaction_count INT,
    avg_transaction_value DECIMAL(10,2)
);

-- Materialized view alternative
CREATE MATERIALIZED VIEW monthly_sales_by_product AS
SELECT
    DATE_TRUNC('month', sale_date) AS month,
    product_id,
    SUM(amount) AS total_sales,
    SUM(quantity) AS total_quantity,
    COUNT(*) AS transaction_count
FROM sales
GROUP BY DATE_TRUNC('month', sale_date), product_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW monthly_sales_by_product;
```

### 4. Duplicating Lookup Values

Store frequently accessed lookup data directly in the main table.

**Normalized:**

```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100),
    category_id INT REFERENCES categories(category_id)
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50)
);

-- Requires join
SELECT p.product_name, c.category_name
FROM products p
JOIN categories c ON p.category_id = c.category_id;
```

**Denormalized:**

```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100),
    category_id INT,
    category_name VARCHAR(50)  -- Denormalized: from categories table
);

-- No join needed
SELECT product_name, category_name
FROM products;
```

### 5. Combining Tables

Merge related tables into a single table when they're always accessed together.

```sql
-- Instead of separate tables for different address types
CREATE TABLE customer_addresses (
    customer_id INT,
    address_type VARCHAR(20), -- 'billing', 'shipping'
    street VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(2),
    zip VARCHAR(10),
    PRIMARY KEY (customer_id, address_type)
);

-- Single table with all address types
CREATE TABLE customers_denormalized (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    -- Billing address
    billing_street VARCHAR(100),
    billing_city VARCHAR(50),
    billing_state VARCHAR(2),
    billing_zip VARCHAR(10),
    -- Shipping address
    shipping_street VARCHAR(100),
    shipping_city VARCHAR(50),
    shipping_state VARCHAR(2),
    shipping_zip VARCHAR(10)
);
```

## When to Denormalize

### Good Use Cases:

1. **Read-Heavy Workloads**: When reads vastly outnumber writes
2. **Reporting Systems**: Data warehouses and analytics databases
3. **Caching**: Frequently accessed data combinations
4. **Performance Critical Queries**: When specific queries are too slow
5. **Lookup Tables**: Small, rarely changing reference data
6. **Historical Data**: Data that doesn't change after creation

### Example - E-commerce Order History:

```sql
-- Orders are rarely updated after creation
-- Denormalization makes sense for order history
CREATE TABLE order_history (
    order_id SERIAL PRIMARY KEY,
    order_date TIMESTAMP,
    
    -- Customer info (denormalized)
    customer_id INT,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    
    -- Shipping address (denormalized)
    ship_street VARCHAR(100),
    ship_city VARCHAR(50),
    ship_state VARCHAR(2),
    ship_zip VARCHAR(10),
    
    -- Order totals (denormalized)
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2),
    shipping DECIMAL(10,2),
    total DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20)
);
```

### When NOT to Denormalize:

1. **Write-Heavy Systems**: Frequent updates make denormalization costly
2. **Frequently Changing Data**: High maintenance overhead
3. **Storage Constraints**: Limited disk space
4. **Data Integrity Critical**: Where consistency is paramount
5. **Simple Schemas**: When joins are already fast enough

## Maintaining Denormalized Data

### 1. Using Triggers

```sql
-- Keep denormalized data synchronized
CREATE OR REPLACE FUNCTION sync_customer_name()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET customer_name = NEW.customer_name
    WHERE customer_id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_customer_name
AFTER UPDATE OF customer_name ON customers
FOR EACH ROW
WHEN (OLD.customer_name IS DISTINCT FROM NEW.customer_name)
EXECUTE FUNCTION sync_customer_name();
```

### 2. Using Application Logic

```javascript
// Update both tables in application code
async function updateCustomerName(customerId, newName) {
    await db.transaction(async (trx) => {
        // Update customers table
        await trx('customers')
            .where('customer_id', customerId)
            .update({ customer_name: newName });
        
        // Update denormalized data in orders
        await trx('orders')
            .where('customer_id', customerId)
            .update({ customer_name: newName });
    });
}
```

### 3. Using Materialized Views

```sql
-- PostgreSQL materialized views
CREATE MATERIALIZED VIEW product_sales_summary AS
SELECT
    p.product_id,
    p.product_name,
    c.category_name,
    COUNT(o.order_id) AS order_count,
    SUM(o.quantity) AS total_quantity,
    SUM(o.quantity * o.price) AS total_revenue
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN order_items o ON p.product_id = o.product_id
GROUP BY p.product_id, p.product_name, c.category_name;

-- Create index on materialized view
CREATE INDEX idx_product_sales_product ON product_sales_summary(product_id);

-- Refresh on schedule or after updates
REFRESH MATERIALIZED VIEW product_sales_summary;
-- Or concurrent refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY product_sales_summary;
```

### 4. Scheduled Batch Updates

```sql
-- Update denormalized data periodically
CREATE OR REPLACE FUNCTION refresh_order_summaries()
RETURNS void AS $$
BEGIN
    UPDATE orders o
    SET
        order_total = (
            SELECT COALESCE(SUM(quantity * price), 0)
            FROM order_items oi
            WHERE oi.order_id = o.order_id
        ),
        item_count = (
            SELECT COUNT(*)
            FROM order_items oi
            WHERE oi.order_id = o.order_id
        )
    WHERE o.updated_at > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron or external scheduler
-- SELECT cron.schedule('refresh-orders', '*/5 * * * *', 'SELECT refresh_order_summaries()');
```

## Best Practices

### 1. Document Denormalization

```sql
-- Add comments explaining denormalized columns
COMMENT ON COLUMN orders.customer_name IS 
'Denormalized from customers.customer_name for performance. 
Updated by trigger trg_sync_customer_name';
```

### 2. Monitor Data Consistency

```sql
-- Query to check for inconsistencies
SELECT o.order_id, o.customer_name AS order_customer, c.customer_name AS actual_customer
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.customer_name != c.customer_name;
```

### 3. Use Views for Flexibility

```sql
-- Keep normalized tables, use views for denormalized access
CREATE VIEW order_details AS
SELECT
    o.order_id,
    o.order_date,
    c.customer_name,
    c.customer_email,
    o.order_total
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;
```

### 4. Consider Partial Denormalization

Only denormalize the specific columns that cause performance issues, not everything.

## Comparison: Normalized vs Denormalized

| Aspect | Normalized | Denormalized |
|--------|------------|--------------|
| **Data Redundancy** | Minimal | Intentional duplicates |
| **Storage** | Less space | More space |
| **Write Performance** | Faster | Slower (multiple updates) |
| **Read Performance** | Slower (more joins) | Faster (fewer joins) |
| **Data Consistency** | Easier to maintain | Requires extra effort |
| **Query Complexity** | More complex (joins) | Simpler queries |
| **Best For** | Write-heavy, transactional | Read-heavy, analytical |

## Summary

**Denormalization** is a strategic database design decision to optimize read performance by adding redundant data. While it can significantly improve query speed, it comes with trade-offs in storage, consistency, and maintenance complexity.

**Key Points:**
- Use denormalization for read-heavy, performance-critical scenarios
- Always have a strategy to maintain consistency
- Consider materialized views as a middle ground
- Document all denormalization decisions
- Monitor for data inconsistencies
- Measure actual performance improvements before denormalizing

**Remember:** Start with normalization, denormalize only when necessary and with proper maintenance strategies in place.
