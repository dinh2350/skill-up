# What is the difference between `==` and `===` in JavaScript?

## Short Answer

- **`==` (Loose Equality)** - Compares values after performing **type coercion** (converts types to match)
- **`===` (Strict Equality)** - Compares both **value and type** without type coercion

```javascript
// == (loose equality)
5 == "5"; // true (string "5" converted to number)
null == undefined; // true (special case)

// === (strict equality)
5 === "5"; // false (different types)
null === undefined; // false (different types)
```

**Best Practice:** Always use `===` (strict equality) unless you have a specific reason to use `==`.

## Detailed Answer

### The == Operator (Loose Equality)

The `==` operator compares values **after converting them to a common type** (type coercion).

#### Basic Examples

```javascript
// Number and String
5 == "5"; // true (string "5" → number 5)
10 == "10"; // true
0 == ""; // true (empty string → 0)
0 == "0"; // true

// Boolean coercion
true == 1; // true (true → 1)
false == 0; // true (false → 0)
true == "1"; // true (both → 1)

// null and undefined
null == undefined; // true (special case)
null == 0; // false
((undefined ==
  (0)[// Object coercion // false
  1]) ==
  (1)[(1, 2)]) == // true (array → "1" → 1)
  "1,2"; // true (array → "1,2")
```

#### Type Coercion Rules for ==

When comparing `x == y`:

1. If types are the same, behaves like `===`
2. If one is `null` and other is `undefined`, return `true`
3. If one is number and other is string, convert string to number
4. If one is boolean, convert to number (true → 1, false → 0)
5. If one is object and other is primitive, convert object to primitive

```javascript
// String to Number
"42" == 42         // true
// Step 1: "42" (string) → 42 (number)
// Step 2: 42 == 42 → true

// Boolean to Number
true == 1          // true
// Step 1: true → 1
// Step 2: 1 == 1 → true

false == 0         // true
// Step 1: false → 0
// Step 2: 0 == 0 → true

// Object to Primitive
[1] == 1           // true
// Step 1: [1].toString() → "1"
// Step 2: "1" (string) → 1 (number)
// Step 3: 1 == 1 → true

{} == "[object Object]"  // true
// Step 1: {}.toString() → "[object Object]"
// Step 2: "[object Object]" == "[object Object]" → true
```

#### Surprising == Behaviors

```javascript
// These all evaluate to true with ==
"" == 0            // true
"" == false        // true
0 == false         // true
null == undefined  // true
" \t\r\n" == 0     // true (whitespace → 0)

// Arrays
[] == false        // true
[] == 0            // true
[] == ""           // true
[0] == false       // true
[1] == true        // true

// Confusing cases
"0" == false       // true
"0" == 0           // true
0 == false         // true
// But:
"0" == ""          // false

// Really confusing!
null == 0          // false
null >= 0          // true (different comparison rules!)
```

### The === Operator (Strict Equality)

The `===` operator compares **both value and type** without any type conversion.

#### Basic Examples

```javascript
// Same type and value
5 === 5            // true
"hello" === "hello"  // true
true === true      // true

// Same value, different types
5 === "5"          // false (number vs string)
1 === true         // false (number vs boolean)
0 === false        // false (number vs boolean)

// null and undefined
null === undefined // false (different types)
null === null      // true
undefined === undefined  // true

// NaN special case
NaN === NaN        // false (always!)

// Objects
{} === {}          // false (different references)
[] === []          // false (different references)
```

#### Strict Equality Rules

```javascript
// Rule 1: Different types → false
5 === "5"; // false
true === 1; // false
null === undefined; // false

// Rule 2: Same type, different values → false
5 === 10; // false
"hello" === "world"; // false

// Rule 3: Same type and value → true
42 === 42; // true
"test" === "test"; // true
true === true; // true

// Rule 4: Objects compared by reference
const obj1 = { a: 1 };
const obj2 = { a: 1 };
const obj3 = obj1;

obj1 === obj2; // false (different objects)
obj1 === obj3; // true (same reference)

const arr1 = [1, 2, 3];
const arr2 = [1, 2, 3];
const arr3 = arr1;

arr1 === arr2; // false (different arrays)
arr1 === arr3; // true (same reference)
```

### Comparison Table

| Comparison          | `==` Result | `===` Result | Reason                               |
| ------------------- | ----------- | ------------ | ------------------------------------ |
| `5 == "5"`          | `true`      | `false`      | == coerces string to number          |
| `0 == false`        | `true`      | `false`      | == coerces boolean to number         |
| `"" == false`       | `true`      | `false`      | Both coerced to 0                    |
| `null == undefined` | `true`      | `false`      | Special rule in ==                   |
| `null == 0`         | `false`     | `false`      | No coercion between null and numbers |
| `true == 1`         | `true`      | `false`      | true coerced to 1                    |
| `"1" == true`       | `true`      | `false`      | Both coerced to 1                    |
| `[] == false`       | `true`      | `false`      | Array → "" → 0                       |
| `[1] == 1`          | `true`      | `false`      | Array → "1" → 1                      |
| `5 == 5`            | `true`      | `true`       | Same type and value                  |
| `NaN == NaN`        | `false`     | `false`      | NaN is never equal to anything       |
| `{} == {}`          | `false`     | `false`      | Different object references          |

### Special Cases

#### NaN Comparisons

```javascript
// NaN is NEVER equal to anything, including itself
NaN == NaN; // false
NaN === NaN; // false

// Check for NaN
isNaN(NaN); // true
Number.isNaN(NaN); // true (better)

// Proper way to check
const value = 0 / 0; // NaN
Number.isNaN(value); // true
```

#### null vs undefined

```javascript
// With ==
null == undefined; // true (only true for each other)
null == null; // true
undefined == undefined; // true
null == 0; // false
null == false; // false

// With ===
null === undefined; // false (different types)
null === null; // true
undefined === undefined; // true
```

#### Object Comparisons

```javascript
// Objects compared by reference, not content
const user1 = { name: "John" };
const user2 = { name: "John" };
const user3 = user1;

user1 == user2; // false (different objects)
user1 === user2; // false (different objects)
user1 == user3; // true (same reference)
user1 === user3; // true (same reference)

// Arrays
const arr1 = [1, 2, 3];
const arr2 = [1, 2, 3];

arr1 == arr2; // false
arr1 === arr2; // false

// To compare array contents
JSON.stringify(arr1) === JSON.stringify(arr2); // true
arr1.toString() === arr2.toString(); // true
```

### Real-World Examples

#### Example 1: Form Input Validation

```javascript
// User input from HTML form (always strings)
const userAge = document.getElementById("age").value; // "25"
const minimumAge = 18;

// ❌ Bad: Using ==
if (userAge == minimumAge) {
  // "25" == 18 → 25 == 18 → false (works but coercion hidden)
}

// ✅ Good: Explicit conversion + ===
if (Number(userAge) === minimumAge) {
  // Clear intention: convert to number first
}

// ✅ Better: Validate and convert
const age = parseInt(userAge, 10);
if (!isNaN(age) && age >= minimumAge) {
  console.log("Valid age");
}
```

#### Example 2: API Response Handling

```javascript
// API might return different types
const response = await fetch("/api/user");
const data = await response.json();

// ❌ Bad: Loose equality
if (data.status == 200) {
  // Could be "200" or 200
  // Works but unclear if status is string or number
}

// ✅ Good: Strict equality
if (data.status === 200) {
  // Must be number 200
  console.log("Success");
}

// ✅ Better: Type checking
if (typeof data.status === "number" && data.status === 200) {
  console.log("Success");
}
```

#### Example 3: Checking for null/undefined

```javascript
function processUser(user) {
  // ❌ Bad: Using == for null/undefined check
  if (user == null) {
    // Catches both null and undefined
    // But unclear intention
    return;
  }

  // ✅ Good: Explicit checks
  if (user === null || user === undefined) {
    return;
  }

  // ✅ Also good: Check for existence
  if (user == null) {
    // Only acceptable use of ==
    // Explicitly checking for null OR undefined
    return;
  }

  // ✅ Best: Use optional chaining
  const name = user?.name ?? "Unknown";
}
```

#### Example 4: Boolean Checks

```javascript
const isActive = "true"; // String from URL params

// ❌ Bad: Using ==
if (isActive == true) {
  // "true" == true → "true" == 1 → NaN == 1 → false
  console.log("Active"); // Never executes!
}

// ✅ Good: Explicit conversion
if (isActive === "true") {
  console.log("Active");
}

// ✅ Better: Convert to boolean
if (Boolean(isActive)) {
  // Any non-empty string is truthy
  console.log("Active");
}

// ✅ Best: Explicit parsing
const active = isActive === "true";
if (active === true) {
  console.log("Active");
}
```

### When to Use Each

#### Use === (Strict Equality) - Default Choice

```javascript
// ✅ Always use === by default
const age = 25;
if (age === 25) {
  /* ... */
}

const name = "John";
if (name === "John") {
  /* ... */
}

const isValid = true;
if (isValid === true) {
  /* ... */
}

// Better: Just use the boolean directly
if (isValid) {
  /* ... */
}
```

#### Rare Valid Uses of == (Loose Equality)

```javascript
// 1. Checking for null or undefined (only valid use)
function processValue(value) {
  if (value == null) {
    // Catches both null and undefined
    return "No value";
  }
  return value;
}

// Equivalent to:
if (value === null || value === undefined) {
  return "No value";
}

// That's pretty much it. Use === everywhere else!
```

### The != and !== Operators

Same rules apply for inequality operators:

```javascript
// != (loose inequality)
5 != "5"; // false (coerced to same value)
null != undefined; // false (special case)

// !== (strict inequality)
5 !== "5"; // true (different types)
null !== undefined; // true (different types)

// Examples
const x = 10;

// ❌ Avoid !=
if (x != "10") {
  // false, because "10" coerced to 10
  console.log("Not equal");
}

// ✅ Use !==
if (x !== "10") {
  // true, different types
  console.log("Not equal");
}
```

### Common Pitfalls

```javascript
// Pitfall 1: Truthy/Falsy confusion
const value = "0";

if (value) {
  // truthy (non-empty string)
  console.log("Truthy"); // Executes
}

if (value == false) {
  // "0" == false → 0 == 0 → true
  console.log("Equal to false"); // Executes (confusing!)
}

if (value === false) {
  // false (different types)
  console.log("Strictly equal to false"); // Does not execute
}

// Pitfall 2: Array comparisons
const arr = [];

if (arr) {
  // truthy (arrays are objects)
  console.log("Truthy"); // Executes
}

if (arr == false) {
  // [] → "" → 0 → 0 == 0 → true
  console.log("Equal to false"); // Executes (very confusing!)
}

if (arr === false) {
  // false
  console.log("Strictly equal to false"); // Does not execute
}

// Pitfall 3: null comparisons
const x = null;

if (x == 0) {
  // false (no coercion)
  console.log("Equal to 0");
}

if (x >= 0) {
  // true (different comparison rules!)
  console.log("Greater or equal to 0"); // Executes (!!!)
}
```

### ESLint Configuration

Enforce strict equality in your project:

```json
// .eslintrc.json
{
  "rules": {
    "eqeqeq": ["error", "always"], // Always use === and !==
    // or
    "eqeqeq": ["error", "smart"] // Allow == only for null checks
  }
}
```

```javascript
// With "eqeqeq": "error"
if (x == y) {
  // ❌ ESLint error
  // ...
}

if (x === y) {
  // ✅ OK
  // ...
}

// With "smart" option
if (x == null) {
  // ✅ OK (checking null/undefined)
  // ...
}

if (x == y) {
  // ❌ ESLint error (not null check)
  // ...
}
```

### TypeScript and Type Safety

TypeScript helps avoid these issues:

```typescript
const num: number = 5;
const str: string = "5";

if (num === str) {
  // ❌ TypeScript error
  // This comparison appears to be unintentional because
  // the types 'number' and 'string' have no overlap
}

// Force type conversion
if (num === Number(str)) {
  // ✅ OK
  console.log("Equal");
}
```

### Performance Considerations

```javascript
// === is slightly faster than ==
// Because == requires type coercion

// Benchmark (not noticeable in real apps)
// === : ~0.1ms for 1M operations
// ==  : ~0.15ms for 1M operations

// Use === for clarity, not just performance
```

### Best Practices Summary

```javascript
// ✅ DO: Use === by default
if (x === 5) {
  /* ... */
}
if (name === "John") {
  /* ... */
}

// ✅ DO: Use explicit type conversion
if (Number(input) === 42) {
  /* ... */
}
if (String(value) === "test") {
  /* ... */
}

// ✅ DO: Use == for null/undefined check (only valid case)
if (value == null) {
  // null or undefined
  /* ... */
}

// ❌ DON'T: Use == for other comparisons
if (x == "5") {
  /* ... */
} // Use x === 5 or x === "5"

// ❌ DON'T: Rely on type coercion
if (arr == false) {
  /* ... */
} // Confusing!

// ✅ DO: Be explicit
if (arr.length === 0) {
  /* ... */
}

// ❌ DON'T: Compare objects with == or ===
if (obj1 === obj2) {
  /* ... */
} // Compares references

// ✅ DO: Compare object properties
if (obj1.id === obj2.id) {
  /* ... */
}

// Or use deep equality library
import isEqual from "lodash/isEqual";
if (isEqual(obj1, obj2)) {
  /* ... */
}
```

### Key Takeaways

- ✅ **`==`** performs type coercion before comparison (loose equality)
- ✅ **`===`** compares both type and value without coercion (strict equality)
- ✅ **Always use `===`** unless you have a specific reason not to
- ✅ The only acceptable use of `==` is checking for `null` or `undefined`: `value == null`
- ✅ Use ESLint rule `"eqeqeq": "error"` to enforce strict equality
- ✅ Be explicit with type conversions: `Number(x) === 5` instead of `x == 5`
- ✅ Objects are compared by reference, not content
- ✅ `NaN` is never equal to anything, including itself
- ✅ Use TypeScript for additional type safety

### Further Reading

- [MDN: Equality comparisons](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)
- [JavaScript Equality Table](https://dorey.github.io/JavaScript-Equality-Table/)
- [You Don't Know JS: Types & Grammar](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/types-grammar/ch4.md)
- [ESLint eqeqeq rule](https://eslint.org/docs/latest/rules/eqeqeq)
- [Abstract Equality Comparison Algorithm](https://262.ecma-international.org/11.0/#sec-abstract-equality-comparison)
