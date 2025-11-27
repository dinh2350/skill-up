# 93. What is the difference between a view and a materialized view?

## Short answer

- A *view* is a stored query (virtual table) that computes its result at query time; it does not store data.
- A *materialized view* stores the query result physically on disk and must be refreshed to update its contents.

## Key differences

1. Storage
   - View: No storage for rows (only the SQL text is stored). Each access runs the underlying query.
   - Materialized view: Stores the result rows on disk; occupies space and can have indexes.

2. Freshness (staleness)
   - View: Always fresh (reflects underlying tables at time of query).
   - Materialized view: Can be stale until `REFRESH MATERIALIZED VIEW` is run.

3. Performance
   - View: Slow for complex queries because the query runs every time.
   - Materialized view: Fast reads because results are precomputed; suitable for heavy read workloads.

4. Maintenance
   - View: No maintenance (beyond view definition changes).
   - Materialized view: Requires refresh (manual, scheduled, or application-driven). Refresh can be full or, in some DBs, incremental.

5. Indexes
   - View: Cannot have indexes directly (but underlying tables can be indexed to help the view's query).
   - Materialized view: Can be indexed like a table; indexes persist until refreshed/dropped.

6. Concurrency and locking
   - View: No special locking beyond what the underlying query causes.
   - Materialized view: `REFRESH` can block reads unless `CONCURRENTLY` is used (PostgreSQL). Concurrent refresh needs a unique index.

7. Use cases
   - View: Simplify complex queries, encapsulate logic, create reusable queries, virtualize joins.
   - Materialized view: Cache expensive aggregate results, speed up dashboards/reports, precompute joins for OLAP-style queries.

8. Updatability
   - View: Some views (simple ones) can be updatable; many complex views are read-only.
   - Materialized view: Typically read-only; some DBs allow writing into materialized views but it's uncommon.

## Examples

View example (always fresh):

```sql
CREATE VIEW v_active_customers AS
SELECT id, name, email FROM customers WHERE active = true;

-- Querying the view returns current active customers
SELECT * FROM v_active_customers;
```

Materialized view example (precomputed):

```sql
CREATE MATERIALIZED VIEW mv_monthly_revenue AS
SELECT date_trunc('month', created_at) AS month,
       SUM(amount) AS revenue
FROM invoices
GROUP BY date_trunc('month', created_at);

-- Querying the materialized view is fast but may be stale
SELECT * FROM mv_monthly_revenue;

-- To refresh with latest data
REFRESH MATERIALIZED VIEW mv_monthly_revenue;
```

## When to use which

Use a view when:
- You need always up-to-date results.
- The underlying query is cheap or underlying tables are small/indexed.
- You want to encapsulate logic without storing results.

Use a materialized view when:
- The underlying query is expensive (heavy joins, aggregations).
- You need low-latency reads and can tolerate some staleness.
- You want to index the precomputed result for faster reads.

## Practical tips and best practices

- If using PostgreSQL and you need non-blocking refreshes, create a unique index and use `REFRESH MATERIALIZED VIEW CONCURRENTLY`.
- Schedule refreshes during off-peak hours, or use incremental refresh strategies if near-real-time is required.
- Monitor storage and refresh time; materialized views can consume significant disk space and I/O.
- Consider combining both: a materialized view for heavy aggregates and lightweight views for always-fresh, low-cost queries.
- For highly dynamic data where staleness is unacceptable, prefer views or caches with immediate invalidation.

## Performance considerations

- Materialized views reduce CPU and I/O at query time by precomputing results. However, refreshing them consumes CPU and I/O.
- Use selective indexing on materialized views for the most common query patterns.
- For very large datasets, break down materialized view refreshes into smaller, incremental operations (custom delta tables or ETL).

## Security and permissions

- Both views and materialized views can have privileges granted (e.g., `GRANT SELECT`).
- Materialized views physically store data, so be mindful of security and backups for their contents.

## Summary

- Views are virtual and always up-to-date but may be slow for complex queries.
- Materialized views store precomputed results for fast reads but require explicit refresh and storage.
- Choose the one that balances freshness, performance, storage, and maintenance needs for your workload.
