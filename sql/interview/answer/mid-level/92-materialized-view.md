# 92. What is a materialized view?

## Definition

A materialized view is a database object that stores the result of a query physically. Unlike a regular (non-materialized) view, which is a saved query executed on demand, a materialized view holds the query output on disk and can be refreshed periodically or on demand.

Materialized views are useful when a complex query is expensive to compute repeatedly and the result can be reused for read-heavy workloads.

## Basic Syntax

```sql
-- Create a materialized view and populate it immediately
CREATE MATERIALIZED VIEW mv_sales_summary AS
SELECT product_id, SUM(quantity) AS total_qty, SUM(price*quantity) AS total_amount
FROM sales
GROUP BY product_id;

-- Create materialized view without populating data
CREATE MATERIALIZED VIEW mv_sales_summary_no_data
AS
SELECT product_id, SUM(quantity) AS total_qty
FROM sales
GROUP BY product_id
WITH NO DATA;
```

## Refreshing a Materialized View

Materialized views do not stay current automatically (unless some DBs support incremental or refresh mechanisms). In PostgreSQL you refresh with:

```sql
-- Full refresh (recomputes the view)
REFRESH MATERIALIZED VIEW mv_sales_summary;

-- Concurrent refresh (allows reads during refresh) - requires unique index
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_summary;
```

Notes on CONCURRENTLY:
- `REFRESH MATERIALIZED VIEW CONCURRENTLY` allows reads to continue while the refresh runs.
- It requires the materialized view to have at least one unique index that covers the rows (so PostgreSQL can perform a non-blocking replace).
- CONCURRENTLY is slower and uses more resources but avoids blocking readers.

## Incremental / Fast Refresh

PostgreSQL's built-in materialized views perform a full refresh. Some RDBMS (or extensions/tools) support incremental/fast refresh by applying only the changes (deltas). For PostgreSQL, incremental refresh requires custom logic (triggers, rules, or extension-based approaches) or using tools like "pg_matview" or change-data-capture patterns.

## Indexing

Because materialized views store data physically, you can create indexes on them to speed queries:

```sql
CREATE UNIQUE INDEX mv_sales_summary_prod_idx ON mv_sales_summary(product_id);
CREATE INDEX mv_sales_summary_total_amount_idx ON mv_sales_summary(total_amount);
```

Indexes are required for `REFRESH MATERIALIZED VIEW CONCURRENTLY`.

## Common Use Cases

- Pre-aggregating large datasets for dashboards and reporting
- Caching results of expensive joins and calculations
- Improving query latency for read-heavy workloads where slightly stale data is acceptable
- Supporting OLAP-like workloads on a transactional database

## Example: Sales Report

```sql
-- Base tables
CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    sold_at TIMESTAMP NOT NULL
);

-- Materialized view for daily product sales
CREATE MATERIALIZED VIEW daily_product_sales AS
SELECT product_id,
       date_trunc('day', sold_at) AS day,
       SUM(quantity) AS total_qty,
       SUM(price * quantity) AS total_amount
FROM sales
GROUP BY product_id, date_trunc('day', sold_at);

-- Add index to support concurrent refresh and queries
CREATE UNIQUE INDEX daily_product_sales_prod_day_idx
    ON daily_product_sales(product_id, day);

-- Refresh nightly
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_product_sales;
```

## Pros and Cons

Pros:
- Much faster reads for expensive queries because results are precomputed and stored
- Can be indexed like a table, enabling optimized access patterns
- Useful for reducing load on transactional tables during heavy reporting

Cons:
- Data can be stale; needs explicit refresh (or custom incremental refresh)
- Requires storage for the materialized data and indexes
- Refreshing can be expensive and may impact performance if not scheduled carefully
- Concurrent refresh requires special setup (unique index) and is slower

## Maintenance Strategies

- Schedule periodic refreshes (cron, pg_cron, scheduler) at off-peak hours
- Use `REFRESH CONCURRENTLY` during daytime if read availability is required (requires index)
- For near-real-time needs, implement incremental update pipelines using triggers + delta tables or CDC tools
- Monitor refresh duration and impact using `pg_stat_activity` and logs

## Alternatives

- Regular views (no storage, always up-to-date, slower if query is expensive)
- Cached result tables maintained by application logic (manually maintained tables)
- Materialized view frameworks or extensions providing incremental refresh

## How to Inspect Materialized Views

List materialized views in the current database:

```sql
SELECT matviewname, matviewowner
FROM pg_matviews;

-- Or using information_schema
SELECT table_name
FROM information_schema.tables
WHERE table_type = 'MATERIALIZED VIEW'
  AND table_schema = 'public';
```

## Permissions

Materialized views are database objects and can have privileges granted, e.g.,

```sql
GRANT SELECT ON daily_product_sales TO analytics_role;
```

## Summary

A materialized view stores the results of a query physically for fast reads. It needs explicit refresh (full or concurrently) to stay current. Use it to speed up expensive or frequently used read queries when some staleness is acceptable, and remember to index appropriately and schedule refreshes to limit operational impact.
