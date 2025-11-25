# Question 59: How do you use string functions (`CONCAT`, `SUBSTRING`, `UPPER`, `LOWER`)?

## Overview

PostgreSQL provides a comprehensive set of string functions for text manipulation, formatting, and processing. These functions are essential for data cleaning, formatting output, searching text, and transforming data for reports and applications.

### Core String Functions Categories:

1. **String Concatenation**: `CONCAT`, `||`, `CONCAT_WS`
2. **Case Conversion**: `UPPER`, `LOWER`, `INITCAP`
3. **String Extraction**: `SUBSTRING`, `LEFT`, `RIGHT`
4. **String Manipulation**: `TRIM`, `LTRIM`, `RTRIM`, `REPLACE`, `TRANSLATE`
5. **String Analysis**: `LENGTH`, `CHAR_LENGTH`, `POSITION`, `STRPOS`
6. **Pattern Matching**: `LIKE`, `ILIKE`, `SIMILAR TO`, Regular Expressions
7. **String Splitting**: `SPLIT_PART`, `STRING_TO_ARRAY`

## Basic String Functions

### 1. **String Concatenation**

```sql
-- CONCAT function - handles NULL values gracefully
SELECT
    CONCAT(first_name, ' ', last_name) AS full_name,
    CONCAT(first_name, ' ', middle_name, ' ', last_name) AS full_name_with_middle,
    CONCAT('Customer: ', customer_id, ' - ', customer_name) AS customer_display
FROM customers;

-- String concatenation operator (||) - more traditional SQL
SELECT
    first_name || ' ' || last_name AS full_name,
    'Order #' || order_id || ' for $' || order_total AS order_summary
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id;

-- CONCAT_WS (Concatenate With Separator) - useful for handling NULLs
SELECT
    CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name,
    CONCAT_WS(', ', street_address, city, state, zip_code) AS full_address,
    CONCAT_WS(' | ', phone, email, website) AS contact_info
FROM customers;

-- Handle NULL values in concatenation
SELECT
    customer_id,
    -- Traditional concatenation (NULLs break the chain)
    first_name || ' ' || last_name AS basic_concat,

    -- Safe concatenation with COALESCE
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') AS safe_concat,

    -- CONCAT handles NULLs automatically
    CONCAT(first_name, ' ', last_name) AS concat_function,

    -- CONCAT_WS skips NULLs
    CONCAT_WS(' ', first_name, middle_name, last_name) AS concat_ws
FROM customers;
```

### 2. **Case Conversion Functions**

```sql
-- Basic case conversion
SELECT
    customer_name,
    UPPER(customer_name) AS uppercase,
    LOWER(customer_name) AS lowercase,
    INITCAP(customer_name) AS proper_case
FROM customers;

-- Data cleaning and standardization
SELECT
    customer_id,

    -- Clean and standardize names
    INITCAP(LOWER(TRIM(first_name))) AS clean_first_name,
    INITCAP(LOWER(TRIM(last_name))) AS clean_last_name,

    -- Standardize email addresses
    LOWER(TRIM(email)) AS clean_email,

    -- Clean phone numbers (remove formatting, then standardize)
    REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g') AS clean_phone,

    -- State abbreviations
    UPPER(TRIM(state)) AS state_abbrev
FROM customers
WHERE email IS NOT NULL;

-- Business logic with case conversion
SELECT
    product_id,
    product_name,
    category,

    -- Create display names
    CASE
        WHEN category = 'electronics' THEN UPPER(product_name)  -- Electronics in caps
        WHEN category = 'books' THEN INITCAP(product_name)      -- Books in proper case
        ELSE LOWER(product_name)                                 -- Others in lowercase
    END AS display_name,

    -- Create product codes
    UPPER(LEFT(category, 3)) || '-' || LPAD(product_id::TEXT, 6, '0') AS product_code
FROM products;
```

### 3. **String Extraction Functions**

```sql
-- SUBSTRING function - extract portions of strings
SELECT
    customer_name,

    -- Basic substring (starting position, length)
    SUBSTRING(customer_name FROM 1 FOR 3) AS first_three_chars,
    SUBSTRING(customer_name FROM 4) AS from_fourth_char,

    -- Extract area code from phone number
    SUBSTRING(phone FROM 1 FOR 3) AS area_code,

    -- Extract domain from email
    SUBSTRING(email FROM POSITION('@' IN email) + 1) AS email_domain,

    -- Using regex with SUBSTRING
    SUBSTRING(phone FROM '^\(?(\d{3})\)?') AS area_code_regex
FROM customers;

-- LEFT and RIGHT functions
SELECT
    order_id,
    order_date,
    customer_notes,

    -- First and last characters
    LEFT(customer_notes, 50) AS notes_preview,
    RIGHT(customer_notes, 10) AS notes_ending,

    -- Extract year from order ID (assuming format like 'ORD2024001')
    RIGHT(LEFT(order_id, 7), 4) AS order_year,

    -- Extract order number
    RIGHT(order_id, 3) AS order_sequence
FROM orders
WHERE customer_notes IS NOT NULL;

-- Complex extraction examples
SELECT
    product_sku,

    -- Extract components from SKU (e.g., 'ELEC-LAP-001-BLK')
    SPLIT_PART(product_sku, '-', 1) AS category_code,
    SPLIT_PART(product_sku, '-', 2) AS subcategory_code,
    SPLIT_PART(product_sku, '-', 3) AS item_number,
    SPLIT_PART(product_sku, '-', 4) AS color_code,

    -- Extract first word from product name
    SPLIT_PART(product_name, ' ', 1) AS first_word,

    -- Extract file extension from filename
    LOWER(RIGHT(image_filename, LENGTH(image_filename) - POSITION('.' IN REVERSE(image_filename)) + 1)) AS file_extension
FROM products
WHERE product_sku LIKE '%-%-%-%';
```

### 4. **String Cleaning and Manipulation**

```sql
-- TRIM functions - remove whitespace and characters
SELECT
    customer_name,

    -- Basic trimming
    LENGTH(customer_name) AS original_length,
    LENGTH(TRIM(customer_name)) AS trimmed_length,

    -- Specific trimming
    LTRIM(customer_name) AS left_trimmed,
    RTRIM(customer_name) AS right_trimmed,

    -- Trim specific characters
    TRIM('.' FROM customer_name) AS trim_dots,
    TRIM(BOTH '"' FROM customer_name) AS trim_quotes,
    TRIM(LEADING '0' FROM phone_number) AS trim_leading_zeros
FROM customers;

-- REPLACE and TRANSLATE functions
SELECT
    product_description,

    -- Basic replacement
    REPLACE(product_description, 'old model', 'new model') AS updated_description,
    REPLACE(product_description, '&', 'and') AS clean_description,

    -- Multiple replacements with nested REPLACE
    REPLACE(
        REPLACE(
            REPLACE(product_description, '&', 'and'),
            '%', ' percent'),
        '$', ' dollars'
    ) AS fully_cleaned,

    -- Character translation
    TRANSLATE(product_code, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') AS lowercase_code,
    TRANSLATE(phone_number, '()- ', '') AS clean_phone
FROM products;

-- Advanced cleaning with regular expressions
SELECT
    customer_id,
    raw_input,

    -- Remove all non-alphanumeric characters
    REGEXP_REPLACE(raw_input, '[^A-Za-z0-9 ]', '', 'g') AS alphanumeric_only,

    -- Clean phone numbers (keep only digits)
    REGEXP_REPLACE(phone, '[^0-9]', '', 'g') AS digits_only,

    -- Extract numbers from mixed text
    REGEXP_REPLACE(product_code, '[^0-9]', '', 'g') AS numbers_only,

    -- Normalize whitespace (multiple spaces to single space)
    REGEXP_REPLACE(TRIM(description), '\s+', ' ', 'g') AS normalized_description,

    -- Remove HTML tags
    REGEXP_REPLACE(html_content, '<[^>]*>', '', 'g') AS plain_text
FROM customer_data;
```

## Advanced String Functions

### 1. **String Analysis and Measurement**

```sql
-- LENGTH and position functions
SELECT
    customer_name,
    email,

    -- Different length measurements
    LENGTH(customer_name) AS byte_length,
    CHAR_LENGTH(customer_name) AS character_length,
    OCTET_LENGTH(customer_name) AS octet_length,

    -- Position finding
    POSITION('@' IN email) AS at_position,
    STRPOS(email, '.') AS dot_position,

    -- Find last occurrence (using REVERSE)
    LENGTH(email) - POSITION('.' IN REVERSE(email)) + 1 AS last_dot_position,

    -- Check if string contains substring
    CASE
        WHEN POSITION('gmail' IN email) > 0 THEN 'Gmail User'
        WHEN POSITION('yahoo' IN email) > 0 THEN 'Yahoo User'
        WHEN POSITION('hotmail' IN email) > 0 THEN 'Hotmail User'
        ELSE 'Other Provider'
    END AS email_provider
FROM customers
WHERE email IS NOT NULL;

-- String comparison and similarity
SELECT
    p1.product_name AS product1,
    p2.product_name AS product2,

    -- Levenshtein distance (requires fuzzystrmatch extension)
    -- levenshtein(p1.product_name, p2.product_name) as edit_distance,

    -- Soundex comparison (requires fuzzystrmatch extension)
    -- soundex(p1.product_name) = soundex(p2.product_name) as sounds_similar,

    -- Simple similarity check
    CASE
        WHEN UPPER(p1.product_name) = UPPER(p2.product_name) THEN 'Exact Match'
        WHEN POSITION(UPPER(p1.product_name) IN UPPER(p2.product_name)) > 0 THEN 'Contains'
        WHEN POSITION(UPPER(p2.product_name) IN UPPER(p1.product_name)) > 0 THEN 'Contained'
        ELSE 'Different'
    END AS similarity_type
FROM products p1
CROSS JOIN products p2
WHERE p1.product_id < p2.product_id
  AND p1.category = p2.category
LIMIT 20;
```

### 2. **Pattern Matching and Regular Expressions**

```sql
-- LIKE and ILIKE pattern matching
SELECT
    customer_name,
    email,
    phone,

    -- Basic patterns
    customer_name LIKE 'A%' AS starts_with_a,
    customer_name ILIKE '%son' AS ends_with_son_case_insensitive,
    phone LIKE '___-___-____' AS standard_phone_format,

    -- More complex patterns
    email LIKE '%@gmail.%' AS gmail_user,
    customer_name LIKE '% %' AS has_space,
    product_code LIKE 'ELEC-[0-9][0-9][0-9]' AS electronics_pattern
FROM customers c
LEFT JOIN products p ON c.preferred_category = p.category;

-- Regular expression matching
SELECT
    customer_id,
    email,
    phone,

    -- Email validation
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AS valid_email,

    -- Phone number patterns
    phone ~ '^\(\d{3}\) \d{3}-\d{4}$' AS formatted_phone,
    phone ~ '^\d{10}$' AS ten_digit_phone,

    -- Extract area code using regex
    SUBSTRING(phone FROM '^(?:\()?(\d{3})') AS area_code_extracted,

    -- Case insensitive matching
    customer_name ~* '^john|^jane' AS starts_with_john_or_jane
FROM customers
WHERE email IS NOT NULL;

-- SIMILAR TO pattern matching (SQL standard)
SELECT
    product_code,
    product_name,

    -- SIMILAR TO patterns
    product_code SIMILAR TO '[A-Z]{2,4}-[0-9]{3}-%' AS standard_format,
    product_name SIMILAR TO '%(laptop|desktop|tablet)%' AS computer_product,

    -- Extract using SIMILAR TO
    SUBSTRING(product_code SIMILAR TO '[A-Z]{2,4}-([0-9]{3})-%' ESCAPE '\') AS product_series
FROM products;
```

### 3. **String Arrays and Splitting**

```sql
-- STRING_TO_ARRAY and ARRAY_TO_STRING
SELECT
    customer_id,
    full_address,
    tags,

    -- Split address into components
    STRING_TO_ARRAY(full_address, ', ') AS address_parts,

    -- Split tags
    STRING_TO_ARRAY(tags, '|') AS tag_array,

    -- Get specific parts
    SPLIT_PART(full_address, ', ', 1) AS street,
    SPLIT_PART(full_address, ', ', 2) AS city,
    SPLIT_PART(full_address, ', ', 3) AS state,

    -- Count parts
    ARRAY_LENGTH(STRING_TO_ARRAY(tags, '|'), 1) AS tag_count,

    -- Rejoin with different separator
    ARRAY_TO_STRING(STRING_TO_ARRAY(tags, '|'), ', ') AS formatted_tags
FROM customers
WHERE full_address IS NOT NULL;

-- Advanced array operations on strings
SELECT
    product_id,
    keywords,

    -- Convert to array and process
    STRING_TO_ARRAY(LOWER(keywords), ',') AS keyword_array,

    -- Clean and process keywords
    ARRAY_TO_STRING(
        ARRAY(
            SELECT TRIM(keyword)
            FROM UNNEST(STRING_TO_ARRAY(keywords, ',')) AS keyword
            WHERE TRIM(keyword) != ''
        ),
        ', '
    ) AS cleaned_keywords,

    -- Check if contains specific keyword
    'electronics' = ANY(STRING_TO_ARRAY(LOWER(keywords), ',')) AS has_electronics_keyword
FROM products
WHERE keywords IS NOT NULL;
```

## Real-World String Function Applications

### 1. **Data Cleaning and Standardization**

```sql
-- Customer data cleaning pipeline
WITH cleaned_customers AS (
    SELECT
        customer_id,

        -- Name cleaning
        INITCAP(TRIM(REGEXP_REPLACE(first_name, '\s+', ' ', 'g'))) AS clean_first_name,
        INITCAP(TRIM(REGEXP_REPLACE(last_name, '\s+', ' ', 'g'))) AS clean_last_name,

        -- Email standardization
        LOWER(TRIM(email)) AS clean_email,

        -- Phone number standardization
        CASE
            WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 10
            THEN REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
            WHEN LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) = 11
                 AND LEFT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 1) = '1'
            THEN RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)
            ELSE NULL
        END AS clean_phone,

        -- Address cleaning
        INITCAP(TRIM(REGEXP_REPLACE(street_address, '\s+', ' ', 'g'))) AS clean_street,
        INITCAP(TRIM(city)) AS clean_city,
        UPPER(TRIM(state)) AS clean_state,
        REGEXP_REPLACE(zip_code, '[^0-9-]', '', 'g') AS clean_zip,

        -- Create standardized full name
        CONCAT_WS(' ',
            INITCAP(TRIM(first_name)),
            CASE WHEN TRIM(middle_name) != '' THEN INITCAP(TRIM(middle_name)) END,
            INITCAP(TRIM(last_name))
        ) AS full_name

    FROM customers
),

validation_results AS (
    SELECT
        *,

        -- Data quality flags
        clean_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AS valid_email,
        LENGTH(clean_phone) = 10 AS valid_phone,
        LENGTH(clean_zip) IN (5, 10) AS valid_zip,

        -- Completeness score
        (CASE WHEN clean_first_name IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN clean_last_name IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN clean_email IS NOT NULL AND clean_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 1 ELSE 0 END +
         CASE WHEN LENGTH(clean_phone) = 10 THEN 1 ELSE 0 END +
         CASE WHEN clean_street IS NOT NULL THEN 1 ELSE 0 END
        ) AS data_quality_score

    FROM cleaned_customers
)

SELECT
    customer_id,
    full_name,
    clean_email,

    -- Format phone number for display
    CASE
        WHEN LENGTH(clean_phone) = 10
        THEN '(' || LEFT(clean_phone, 3) || ') ' ||
             SUBSTRING(clean_phone, 4, 3) || '-' ||
             RIGHT(clean_phone, 4)
        ELSE 'Invalid Phone'
    END AS formatted_phone,

    -- Create full address
    CONCAT_WS(', ', clean_street, clean_city, clean_state, clean_zip) AS full_address,

    -- Data quality assessment
    CASE
        WHEN data_quality_score = 5 THEN 'Complete'
        WHEN data_quality_score >= 3 THEN 'Good'
        WHEN data_quality_score >= 2 THEN 'Fair'
        ELSE 'Poor'
    END AS data_quality_level,

    valid_email,
    valid_phone,
    valid_zip

FROM validation_results
ORDER BY data_quality_score DESC, customer_id;
```

### 2. **Business Intelligence and Reporting**

```sql
-- Product analysis with string functions
SELECT
    -- Product categorization based on name patterns
    CASE
        WHEN UPPER(product_name) LIKE '%LAPTOP%' OR UPPER(product_name) LIKE '%NOTEBOOK%'
        THEN 'Laptops'
        WHEN UPPER(product_name) LIKE '%DESKTOP%' OR UPPER(product_name) LIKE '%PC%'
        THEN 'Desktops'
        WHEN UPPER(product_name) LIKE '%PHONE%' OR UPPER(product_name) LIKE '%MOBILE%'
        THEN 'Mobile Devices'
        WHEN UPPER(product_name) LIKE '%TABLET%' OR UPPER(product_name) LIKE '%IPAD%'
        THEN 'Tablets'
        ELSE 'Other Electronics'
    END AS product_category,

    -- Extract brand information
    CASE
        WHEN UPPER(product_name) LIKE '%APPLE%' OR UPPER(product_name) LIKE '%IPHONE%' OR UPPER(product_name) LIKE '%IPAD%'
        THEN 'Apple'
        WHEN UPPER(product_name) LIKE '%SAMSUNG%' OR UPPER(product_name) LIKE '%GALAXY%'
        THEN 'Samsung'
        WHEN UPPER(product_name) LIKE '%DELL%'
        THEN 'Dell'
        WHEN UPPER(product_name) LIKE '%HP%' OR UPPER(product_name) LIKE '%HEWLETT%'
        THEN 'HP'
        WHEN UPPER(product_name) LIKE '%LENOVO%' OR UPPER(product_name) LIKE '%THINKPAD%'
        THEN 'Lenovo'
        ELSE 'Other Brand'
    END AS brand,

    COUNT(*) AS product_count,
    AVG(price) AS avg_price,
    MIN(price) AS min_price,
    MAX(price) AS max_price,

    -- Price range categorization
    STRING_AGG(
        CASE
            WHEN price < 500 THEN 'Budget'
            WHEN price < 1500 THEN 'Mid-range'
            ELSE 'Premium'
        END,
        ', '
        ORDER BY price
    ) AS price_ranges,

    -- Create summary description
    'Category: ' ||
    CASE
        WHEN UPPER(product_name) LIKE '%LAPTOP%' OR UPPER(product_name) LIKE '%NOTEBOOK%'
        THEN 'Laptops'
        ELSE 'Other Products'
    END ||
    ', Count: ' || COUNT(*)::TEXT ||
    ', Avg Price: $' || ROUND(AVG(price), 2)::TEXT AS category_summary

FROM products
WHERE category = 'Electronics'
GROUP BY
    CASE
        WHEN UPPER(product_name) LIKE '%LAPTOP%' OR UPPER(product_name) LIKE '%NOTEBOOK%'
        THEN 'Laptops'
        WHEN UPPER(product_name) LIKE '%DESKTOP%' OR UPPER(product_name) LIKE '%PC%'
        THEN 'Desktops'
        WHEN UPPER(product_name) LIKE '%PHONE%' OR UPPER(product_name) LIKE '%MOBILE%'
        THEN 'Mobile Devices'
        WHEN UPPER(product_name) LIKE '%TABLET%' OR UPPER(product_name) LIKE '%IPAD%'
        THEN 'Tablets'
        ELSE 'Other Electronics'
    END,
    CASE
        WHEN UPPER(product_name) LIKE '%APPLE%' OR UPPER(product_name) LIKE '%IPHONE%' OR UPPER(product_name) LIKE '%IPAD%'
        THEN 'Apple'
        WHEN UPPER(product_name) LIKE '%SAMSUNG%' OR UPPER(product_name) LIKE '%GALAXY%'
        THEN 'Samsung'
        WHEN UPPER(product_name) LIKE '%DELL%'
        THEN 'Dell'
        WHEN UPPER(product_name) LIKE '%HP%' OR UPPER(product_name) LIKE '%HEWLETT%'
        THEN 'HP'
        WHEN UPPER(product_name) LIKE '%LENOVO%' OR UPPER(product_name) LIKE '%THINKPAD%'
        THEN 'Lenovo'
        ELSE 'Other Brand'
    END
ORDER BY product_count DESC;
```

### 3. **Search and Text Analysis**

```sql
-- Full-text search simulation using string functions
CREATE OR REPLACE FUNCTION simple_search(search_text TEXT, target_text TEXT)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    search_words TEXT[];
    word TEXT;
BEGIN
    -- Convert to lowercase and split into words
    search_words := STRING_TO_ARRAY(LOWER(search_text), ' ');

    -- Score based on word matches
    FOREACH word IN ARRAY search_words LOOP
        IF POSITION(word IN LOWER(target_text)) > 0 THEN
            score := score + 1;
        END IF;
    END LOOP;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Product search with scoring
SELECT
    product_id,
    product_name,
    description,

    -- Search scoring
    simple_search('apple laptop computer', product_name) +
    simple_search('apple laptop computer', description) * 0.5 AS search_score,

    -- Highlight matches (simple version)
    REPLACE(
        REPLACE(
            REPLACE(UPPER(product_name), 'APPLE', '**APPLE**'),
            'LAPTOP', '**LAPTOP**'
        ),
        'COMPUTER', '**COMPUTER**'
    ) AS highlighted_name,

    -- Extract relevant snippets
    CASE
        WHEN POSITION('apple' IN LOWER(description)) > 0 THEN
            SUBSTRING(
                description
                FROM GREATEST(1, POSITION('apple' IN LOWER(description)) - 50)
                FOR 100
            )
        WHEN POSITION('laptop' IN LOWER(description)) > 0 THEN
            SUBSTRING(
                description
                FROM GREATEST(1, POSITION('laptop' IN LOWER(description)) - 50)
                FOR 100
            )
        ELSE LEFT(description, 100)
    END AS snippet

FROM products
WHERE simple_search('apple laptop computer', product_name) > 0
   OR simple_search('apple laptop computer', description) > 0
ORDER BY search_score DESC, product_name
LIMIT 20;
```

## Performance Considerations

### 1. **Indexing for String Operations**

```sql
-- Functional indexes for string operations
CREATE INDEX idx_customers_upper_name ON customers (UPPER(last_name));
CREATE INDEX idx_products_lower_name ON products (LOWER(product_name));

-- Prefix indexes for LIKE queries
CREATE INDEX idx_customers_email_prefix ON customers (email varchar_pattern_ops);
CREATE INDEX idx_products_name_prefix ON products (product_name varchar_pattern_ops);

-- Using the indexes
SELECT * FROM customers WHERE UPPER(last_name) = 'SMITH';  -- Can use functional index
SELECT * FROM products WHERE product_name LIKE 'Apple%';   -- Can use prefix index
```

### 2. **Optimizing String Operations**

```sql
-- Efficient string operations
-- Good: Use specific functions when possible
SELECT product_id FROM products WHERE LEFT(product_code, 4) = 'ELEC';

-- Better: Use LIKE for prefix matching (can use index)
SELECT product_id FROM products WHERE product_code LIKE 'ELEC%';

-- Good: Pre-calculate expensive string operations
WITH processed_data AS (
    SELECT
        customer_id,
        UPPER(TRIM(last_name)) AS clean_last_name
    FROM customers
)
SELECT * FROM processed_data WHERE clean_last_name = 'SMITH';

-- Avoid: Expensive operations in WHERE clause without indexes
-- SELECT * FROM customers WHERE SUBSTRING(phone, 1, 3) = '415';  -- Slow

-- Better: Use pattern matching
SELECT * FROM customers WHERE phone LIKE '415%';  -- Can use index
```

PostgreSQL's string functions provide powerful capabilities for text processing, data cleaning, and analysis. Understanding when and how to use each function effectively is crucial for building efficient and maintainable database applications.
