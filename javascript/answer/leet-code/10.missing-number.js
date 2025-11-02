/**
 * ============================================================================
 * LeetCode Problem 10: Missing Number
 * ============================================================================
 *
 * Difficulty: Easy
 * Topics: Array, Math, Bit Manipulation, Hash Table, Sorting
 *
 * Problem Statement:
 * Given an array nums containing n distinct numbers in the range [0, n],
 * return the only number in the range that is missing from the array.
 *
 * Constraints:
 * - n == nums.length
 * - 1 <= n <= 10^4
 * - 0 <= nums[i] <= n
 * - All the numbers of nums are unique.
 *
 * Examples:
 * Input: nums = [3,0,1]
 * Output: 2
 * Explanation: n = 3 since there are 3 numbers, so all numbers are in the range [0,3].
 * 2 is the missing number in the range since it does not appear in nums.
 *
 * Input: nums = [0,1]
 * Output: 2
 *
 * Input: nums = [9,6,4,2,3,5,7,0,1]
 * Output: 8
 *
 * Follow-up: Could you implement a solution using only O(1) extra space
 * complexity and O(n) runtime complexity?
 */

// ============================================================================
// KEY INSIGHT: Sum Formula Approach
// ============================================================================
//
// If we have numbers from 0 to n, the sum should be: n * (n + 1) / 2
// The missing number = Expected Sum - Actual Sum
//
// Example: [3,0,1] → n = 3
// Expected sum = 0+1+2+3 = 6
// Actual sum = 3+0+1 = 4
// Missing = 6 - 4 = 2

// ============================================================================
// Approach 4: Sorting
// ============================================================================
// Time Complexity: O(n log n) - Sorting dominates
// Space Complexity: O(1) or O(n) - Depends on sorting implementation
//
// Strategy:
// - Sort the array
// - Check if each index matches its expected value
// - First mismatch is the missing number

function missingNumber_Sorting(nums) {
  nums.sort((a, b) => a - b);

  // Check if 0 is missing
  if (nums[0] !== 0) return 0;

  // Check if n is missing
  const n = nums.length;
  if (nums[n - 1] !== n) return n;

  // Check for missing number in the middle
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i) {
      return i;
    }
  }

  return n; // Should never reach here
}

// ============================================================================
// Approach 1: Math - Sum Formula (OPTIMAL) ⭐⭐⭐
// ============================================================================
// Time Complexity: O(n) - Single pass to calculate sum
// Space Complexity: O(1) - Only using variables
//
// Strategy:
// - Calculate expected sum: n * (n + 1) / 2
// - Calculate actual sum of array
// - Missing number = expected - actual
//
// ✅ This is the BEST solution for interviews!

function missingNumber(nums) {
  const n = nums.length;

  // Expected sum of numbers from 0 to n
  const expectedSum = (n * (n + 1)) / 2;

  // Actual sum of numbers in array
  const actualSum = nums.reduce((sum, num) => sum + num, 0);

  // Missing number is the difference
  return expectedSum - actualSum;
}

// ============================================================================
// Approach 2: XOR Bit Manipulation (OPTIMAL) ⭐⭐⭐
// ============================================================================
// Time Complexity: O(n) - Single pass
// Space Complexity: O(1) - Only using variables
//
// Strategy:
// - XOR has property: a ^ a = 0 and a ^ 0 = a
// - XOR all indices (0 to n) with all array values
// - Duplicate values cancel out, leaving only the missing number
//
// Example: [3,0,1]
// XOR: 0^1^2^3 (indices) ^ 3^0^1 (values)
// = (0^0) ^ (1^1) ^ 2 ^ (3^3) = 0 ^ 0 ^ 2 ^ 0 = 2
//
// ✅ This is also optimal and shows advanced knowledge!

function missingNumber_XOR(nums) {
  let missing = nums.length; // Start with n

  // XOR with index and value
  for (let i = 0; i < nums.length; i++) {
    missing ^= i ^ nums[i];
  }

  return missing;
}

// ============================================================================
// Approach 3: XOR (Alternative Implementation)
// ============================================================================
// Time Complexity: O(n)
// Space Complexity: O(1)
//
// More explicit version showing the XOR cancellation

function missingNumber_XOR_Explicit(nums) {
  const n = nums.length;
  let result = n; // Start with n

  // XOR all numbers from 0 to n-1
  for (let i = 0; i < n; i++) {
    result ^= i;
  }

  // XOR all numbers in array
  for (let num of nums) {
    result ^= num;
  }

  return result;
}

// ============================================================================
// Approach 5: Hash Set
// ============================================================================
// Time Complexity: O(n) - Two passes
// Space Complexity: O(n) - Set stores all numbers
//
// Strategy:
// - Store all numbers in a Set
// - Check from 0 to n which number is not in Set

function missingNumber_HashSet(nums) {
  const set = new Set(nums);
  const n = nums.length;

  for (let i = 0; i <= n; i++) {
    if (!set.has(i)) {
      return i;
    }
  }

  return -1; // Should never reach here
}

// ============================================================================
// Approach 6: Binary Search (on sorted array)
// ============================================================================
// Time Complexity: O(n log n) - Sorting + O(log n) search
// Space Complexity: O(1)
//
// Strategy:
// - Sort array
// - Use binary search to find the missing number
// - If nums[mid] === mid, missing is on right; else on left

function missingNumber_BinarySearch(nums) {
  nums.sort((a, b) => a - b);

  let left = 0;
  let right = nums.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] > mid) {
      // Missing number is on the left
      right = mid;
    } else {
      // Missing number is on the right
      left = mid + 1;
    }
  }

  return left;
}

// ============================================================================
// Approach 7: Cyclic Sort Pattern
// ============================================================================
// Time Complexity: O(n)
// Space Complexity: O(1) - In-place sorting
//
// Strategy:
// - Place each number at its correct index
// - First index where nums[i] !== i is the missing number

function missingNumber_CyclicSort(nums) {
  let i = 0;
  const n = nums.length;

  // Place each number at its correct position
  while (i < n) {
    const correctIndex = nums[i];
    // If number is in range and not at correct position, swap
    if (correctIndex < n && nums[i] !== nums[correctIndex]) {
      [nums[i], nums[correctIndex]] = [nums[correctIndex], nums[i]];
    } else {
      i++;
    }
  }

  // Find the first position where index doesn't match value
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i) {
      return i;
    }
  }

  // If all positions match, missing number is n
  return n;
}

// ============================================================================
// VISUALIZATION: Sum Formula Approach
// ============================================================================

function visualizeSumFormula(nums) {
  console.log("\n" + "=".repeat(70));
  console.log("VISUALIZATION: Sum Formula Approach");
  console.log("=".repeat(70));
  console.log(`Input: [${nums.join(", ")}]`);
  console.log("");

  const n = nums.length;
  const expectedSum = (n * (n + 1)) / 2;
  const actualSum = nums.reduce((sum, num) => sum + num, 0);
  const missing = expectedSum - actualSum;

  console.log(`Array length: n = ${n}`);
  console.log(`Range: [0, 1, 2, ..., ${n}]`);
  console.log("");

  console.log("Expected sum calculation:");
  console.log(`  Sum of 0 to ${n} = n × (n + 1) / 2`);
  console.log(`               = ${n} × ${n + 1} / 2`);
  console.log(`               = ${n * (n + 1)} / 2`);
  console.log(`               = ${expectedSum}`);
  console.log("");

  console.log("Actual sum calculation:");
  const sumSteps = nums.join(" + ");
  console.log(`  ${sumSteps} = ${actualSum}`);
  console.log("");

  console.log("Missing number:");
  console.log(
    `  Expected - Actual = ${expectedSum} - ${actualSum} = ${missing}`
  );
  console.log("");

  console.log(`✅ Answer: ${missing}`);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// VISUALIZATION: XOR Approach
// ============================================================================

function visualizeXOR(nums) {
  console.log("\n" + "=".repeat(70));
  console.log("VISUALIZATION: XOR Bit Manipulation");
  console.log("=".repeat(70));
  console.log(`Input: [${nums.join(", ")}]`);
  console.log("");

  const n = nums.length;

  console.log("XOR Properties:");
  console.log("  • a ^ a = 0  (number XOR itself = 0)");
  console.log("  • a ^ 0 = a  (number XOR 0 = itself)");
  console.log("  • XOR is commutative and associative");
  console.log("");

  console.log("Strategy:");
  console.log(`  XOR all indices (0 to ${n}) with all array values`);
  console.log("  Duplicates cancel out, leaving the missing number");
  console.log("");

  // Build visualization
  const indices = Array.from({ length: n + 1 }, (_, i) => i);
  console.log(`Indices:      [${indices.join(", ")}]`);
  console.log(`Array values: [${nums.join(", ")}]`);
  console.log("");

  console.log("Step-by-step XOR:");
  let result = n;
  console.log(`Start:        result = ${n} (n)`);

  for (let i = 0; i < n; i++) {
    const before = result;
    result ^= i;
    console.log(
      `Step ${i * 2 + 1}:       result = ${before} ^ ${i} (index) = ${result}`
    );

    const beforeValue = result;
    result ^= nums[i];
    console.log(
      `Step ${i * 2 + 2}:       result = ${beforeValue} ^ ${
        nums[i]
      } (value) = ${result}`
    );
  }

  console.log("");
  console.log("Cancellations:");
  const present = new Set(nums);
  for (let i = 0; i <= n; i++) {
    if (present.has(i)) {
      console.log(`  ${i} appears in both → cancels out (${i} ^ ${i} = 0)`);
    } else {
      console.log(`  ${i} only in indices → remains (${i} ^ 0 = ${i}) ✓`);
    }
  }

  console.log("");
  console.log(`✅ Answer: ${result}`);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// VISUALIZATION: All Numbers from 0 to n
// ============================================================================

function visualizeRange(nums) {
  console.log("\n" + "=".repeat(70));
  console.log("VISUALIZATION: Finding the Missing Number");
  console.log("=".repeat(70));

  const n = nums.length;
  const present = new Set(nums);

  console.log(`Array: [${nums.join(", ")}]`);
  console.log(`Length: ${n}`);
  console.log(`Expected range: [0, ${n}]`);
  console.log("");

  console.log("Number | Present? | Status");
  console.log("-".repeat(40));

  for (let i = 0; i <= n; i++) {
    if (present.has(i)) {
      console.log(`  ${String(i).padStart(2)}   |   Yes    | ✓`);
    } else {
      console.log(`  ${String(i).padStart(2)}   |   No     | ❌ MISSING!`);
    }
  }

  console.log("-".repeat(40));
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// MATHEMATICAL EXPLANATION
// ============================================================================

function explainMathematically() {
  console.log("\n" + "=".repeat(70));
  console.log("MATHEMATICAL EXPLANATION");
  console.log("=".repeat(70));
  console.log(`
Approach 1: Sum Formula (Gauss's Formula)

For consecutive integers from 0 to n:
    Sum = 0 + 1 + 2 + ... + n = n(n+1)/2

This is called the Triangular Number Formula, discovered by Carl Friedrich Gauss.

Proof:
    Let S = 0 + 1 + 2 + ... + n
    Also S = n + (n-1) + (n-2) + ... + 0
    ──────────────────────────────────────
    2S = n + (n+1) + (n+2) + ... + n
    2S = n(n+1)
    S = n(n+1)/2

Application to Missing Number:
    Expected Sum = n(n+1)/2  (sum of complete sequence)
    Actual Sum = Σ(nums)      (sum of given array)
    Missing = Expected - Actual

Time: O(n), Space: O(1) ⭐

────────────────────────────────────────────────────────────────

Approach 2: XOR Bit Manipulation

XOR Properties:
    1. a ^ a = 0        (self-cancellation)
    2. a ^ 0 = a        (identity)
    3. Commutative:     a ^ b = b ^ a
    4. Associative:     (a ^ b) ^ c = a ^ (b ^ c)

Strategy:
    result = n ^ (0^1^2^...^(n-1)) ^ (nums[0]^nums[1]^...^nums[n-1])

Rearranging using commutativity:
    result = n ^ (0^nums[0]) ^ (1^nums[1]) ^ ... ^ ((n-1)^nums[n-1])

All numbers except the missing one appear twice (once in index, once in array).
They cancel out via XOR, leaving only the missing number.

Example: [3,0,1]
    n = 3
    Indices: 0, 1, 2, 3
    Values:  3, 0, 1
    
    XOR all: 0^1^2^3 ^ 3^0^1
           = (0^0) ^ (1^1) ^ 2 ^ (3^3)
           = 0 ^ 0 ^ 2 ^ 0
           = 2 ✓

Time: O(n), Space: O(1) ⭐

────────────────────────────────────────────────────────────────

Comparison of Optimal Approaches:

Method          | Time  | Space | Pros                    | Cons
──────────────────────────────────────────────────────────────
Sum Formula     | O(n)  | O(1)  | Easy to understand     | Potential overflow
XOR             | O(n)  | O(1)  | No overflow risk       | Less intuitive
Hash Set        | O(n)  | O(n)  | Very clear logic       | Extra space
Sorting         | O(nlogn)| O(1)| No math needed         | Slower

Both Sum Formula and XOR are optimal (O(n) time, O(1) space).
Choose based on:
- Sum Formula: More intuitive, easier to explain
- XOR: Shows advanced bit manipulation knowledge
    `);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// XOR TRUTH TABLE
// ============================================================================

function printXORTruthTable() {
  console.log("\n" + "=".repeat(70));
  console.log("XOR TRUTH TABLE & PROPERTIES");
  console.log("=".repeat(70));
  console.log(`
Basic XOR Truth Table:
    A | B | A ^ B
    ─────────────
    0 | 0 |   0
    0 | 1 |   1
    1 | 0 |   1
    1 | 1 |   0

Key Properties:
    1. Self-Inverse:     a ^ a = 0
    2. Identity:         a ^ 0 = a
    3. Commutative:      a ^ b = b ^ a
    4. Associative:      (a ^ b) ^ c = a ^ (b ^ c)

Examples:
    5 ^ 5 = 0           (binary: 101 ^ 101 = 000)
    5 ^ 0 = 5           (binary: 101 ^ 000 = 101)
    3 ^ 5 ^ 3 = 5       (3 cancels itself)
    1 ^ 2 ^ 3 ^ 1 = 2 ^ 3 = 1  (1 cancels, leaves 2^3)

Why XOR solves Missing Number:
    - Every number from 0 to n appears exactly twice (index + value)
      EXCEPT the missing number (appears only in indices)
    - XOR cancels all pairs, leaving only the missing number
    `);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// EDGE CASES
// ============================================================================

function testEdgeCases() {
  console.log("\n" + "=".repeat(70));
  console.log("EDGE CASES TESTING");
  console.log("=".repeat(70) + "\n");

  const edgeCases = [
    {
      name: "Minimum Input (n=1, missing 0)",
      input: [1],
      expected: 0,
      explanation: "Range [0,1], missing 0",
    },
    {
      name: "Minimum Input (n=1, missing 1)",
      input: [0],
      expected: 1,
      explanation: "Range [0,1], missing 1",
    },
    {
      name: "Missing First Number",
      input: [1, 2, 3],
      expected: 0,
      explanation: "Missing number at start of range",
    },
    {
      name: "Missing Last Number",
      input: [0, 1, 2],
      expected: 3,
      explanation: "Missing number at end of range",
    },
    {
      name: "Missing Middle Number",
      input: [0, 1, 3],
      expected: 2,
      explanation: "Missing number in the middle",
    },
    {
      name: "Unsorted Array",
      input: [3, 0, 1],
      expected: 2,
      explanation: "Array not in order",
    },
    {
      name: "Large Array Missing Last",
      input: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      expected: 9,
      explanation: "Larger array missing last element",
    },
    {
      name: "Large Unsorted Array",
      input: [9, 6, 4, 2, 3, 5, 7, 0, 1],
      expected: 8,
      explanation: "Large unsorted array",
    },
    {
      name: "Two Elements Missing First",
      input: [1, 2],
      expected: 0,
      explanation: "Small array missing first",
    },
    {
      name: "Two Elements Missing Last",
      input: [0, 1],
      expected: 2,
      explanation: "Small array missing last",
    },
  ];

  edgeCases.forEach(({ name, input, expected, explanation }) => {
    const result = missingNumber(input);
    const status = result === expected ? "✅" : "❌";

    console.log(`${status} ${name}`);
    console.log(`   Input: [${input.join(", ")}]`);
    console.log(`   Expected: ${expected}, Got: ${result}`);
    console.log(`   Explanation: ${explanation}`);
    console.log("");
  });

  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// PERFORMANCE COMPARISON
// ============================================================================

function comparePerformance() {
  console.log("\n" + "=".repeat(70));
  console.log("PERFORMANCE COMPARISON");
  console.log("=".repeat(70) + "\n");

  const sizes = [100, 1000, 10000];

  sizes.forEach((size) => {
    // Generate array from 0 to n-1, remove middle element
    const nums = Array.from({ length: size }, (_, i) => i);
    const missingIdx = Math.floor(size / 2);
    nums.splice(missingIdx, 1);

    console.log(
      `Array Size: ${size.toLocaleString()} elements (missing: ${missingIdx})`
    );
    console.log("-".repeat(50));

    // Sum Formula
    const start1 = performance.now();
    const result1 = missingNumber(nums);
    const time1 = performance.now() - start1;
    console.log(`Sum Formula:     ${time1.toFixed(3)}ms (result: ${result1})`);

    // XOR
    const start2 = performance.now();
    const result2 = missingNumber_XOR(nums);
    const time2 = performance.now() - start2;
    console.log(`XOR:             ${time2.toFixed(3)}ms (result: ${result2})`);

    // XOR Explicit
    const start3 = performance.now();
    const result3 = missingNumber_XOR_Explicit(nums);
    const time3 = performance.now() - start3;
    console.log(`XOR Explicit:    ${time3.toFixed(3)}ms (result: ${result3})`);

    // Sorting (create copy)
    const start4 = performance.now();
    const result4 = missingNumber_Sorting([...nums]);
    const time4 = performance.now() - start4;
    console.log(`Sorting:         ${time4.toFixed(3)}ms (result: ${result4})`);

    // Hash Set
    const start5 = performance.now();
    const result5 = missingNumber_HashSet(nums);
    const time5 = performance.now() - start5;
    console.log(`Hash Set:        ${time5.toFixed(3)}ms (result: ${result5})`);

    // Binary Search (create copy)
    const start6 = performance.now();
    const result6 = missingNumber_BinarySearch([...nums]);
    const time6 = performance.now() - start6;
    console.log(`Binary Search:   ${time6.toFixed(3)}ms (result: ${result6})`);

    // Cyclic Sort (create copy)
    const start7 = performance.now();
    const result7 = missingNumber_CyclicSort([...nums]);
    const time7 = performance.now() - start7;
    console.log(`Cyclic Sort:     ${time7.toFixed(3)}ms (result: ${result7})`);

    console.log("");
  });

  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// COMPREHENSIVE TEST CASES
// ============================================================================

function runTests() {
  console.log("\n" + "=".repeat(70));
  console.log("COMPREHENSIVE TEST CASES");
  console.log("=".repeat(70) + "\n");

  const testCases = [
    {
      input: [3, 0, 1],
      expected: 2,
      description: "Example 1: Unsorted small array",
    },
    {
      input: [0, 1],
      expected: 2,
      description: "Example 2: Missing last number",
    },
    {
      input: [9, 6, 4, 2, 3, 5, 7, 0, 1],
      expected: 8,
      description: "Example 3: Large unsorted",
    },
    { input: [0], expected: 1, description: "Single element, missing 1" },
    { input: [1], expected: 0, description: "Single element, missing 0" },
    {
      input: [0, 1, 2, 3, 4, 5, 7],
      expected: 6,
      description: "Missing middle in sorted",
    },
    { input: [1, 2, 3, 4], expected: 0, description: "Missing first" },
    { input: [0, 1, 2, 3], expected: 4, description: "Missing last" },
  ];

  const approaches = [
    { name: "Sum Formula (Optimal)", fn: missingNumber },
    { name: "XOR", fn: missingNumber_XOR },
    { name: "XOR Explicit", fn: missingNumber_XOR_Explicit },
    { name: "Sorting", fn: missingNumber_Sorting },
    { name: "Hash Set", fn: missingNumber_HashSet },
    { name: "Binary Search", fn: missingNumber_BinarySearch },
    { name: "Cyclic Sort", fn: missingNumber_CyclicSort },
  ];

  approaches.forEach(({ name, fn }) => {
    console.log(`\n${name}:`);
    console.log("-".repeat(70));

    let passed = 0;
    testCases.forEach(({ input, expected, description }, index) => {
      // Create copy for methods that modify array
      const inputCopy = [...input];
      const result = fn(inputCopy);
      const status = result === expected ? "✅" : "❌";

      if (result === expected) passed++;

      console.log(`${status} Test ${index + 1}: ${description}`);
      console.log(`   Input: [${input.join(", ")}]`);
      console.log(`   Expected: ${expected}, Got: ${result}`);
    });

    console.log(`\nPassed: ${passed}/${testCases.length}`);
  });

  console.log("\n" + "=".repeat(70) + "\n");
}

// ============================================================================
// INTERVIEW TIPS
// ============================================================================

function printInterviewTips() {
  console.log("\n" + "=".repeat(70));
  console.log("💡 INTERVIEW TIPS & COMMON MISTAKES");
  console.log("=".repeat(70));
  console.log(`
1. CLARIFY THE PROBLEM:
   ✓ "Numbers are in range [0, n], so if array length is 3, range is [0,3]?"
   ✓ "All numbers are distinct/unique?" → Yes
   ✓ "Can I modify the input array?" → Ask before sorting
   ✓ "Only one number is missing?" → Yes

2. RECOGNIZE THE PATTERN:
   - This is a classic "missing number in sequence" problem
   - Two optimal approaches: Math (Sum) and Bit Manipulation (XOR)
   - Both are O(n) time and O(1) space

3. OPTIMAL SOLUTIONS (Choose One):
   
   Option A: Sum Formula ⭐
   - Most intuitive and easy to explain
   - Code: return n*(n+1)/2 - sum(nums)
   - Potential integer overflow for very large n (not an issue in JavaScript)
   
   Option B: XOR ⭐
   - Shows advanced bit manipulation knowledge
   - No overflow risk
   - Code: XOR all indices with all values

4. DISCUSS TRADE-OFFS:
   Sum Formula:
     ✓ Easy to understand
     ✓ Straightforward math
     ⚠ Potential overflow (not in JS)
   
   XOR:
     ✓ No overflow
     ✓ Shows advanced knowledge
     ⚠ Less intuitive to explain

5. COMMON MISTAKES TO AVOID:
   ❌ Off-by-one errors with range [0, n]
   ❌ Not handling missing 0 or missing n
   ❌ Using O(n) space when O(1) is possible
   ❌ Forgetting that n = nums.length (not n-1)
   ❌ Integer overflow in other languages (mention in JS it's safe)

6. WALK THROUGH YOUR SOLUTION:
   Sum Formula:
   a) "Array length is n, so range is [0, n]"
   b) "Expected sum = n(n+1)/2 using Gauss's formula"
   c) "Actual sum = sum of array elements"
   d) "Missing = expected - actual"
   
   XOR:
   a) "XOR has property a^a=0 and a^0=a"
   b) "XOR all indices (0 to n) with all values"
   c) "Duplicates cancel out, leaving missing number"

7. FOLLOW-UP QUESTIONS:
   Q: "What if two numbers are missing?"
   A: Need different approach - sum and product, or XOR with grouping

   Q: "What if array is sorted?"
   A: Can use binary search O(log n) but still O(n) for building array

   Q: "Can you do it without extra space?"
   A: Yes! Both sum and XOR are O(1) space

   Q: "What about integer overflow?"
   A: In JavaScript, numbers are 64-bit floats, safe up to 2^53-1
      In Java/C++, use long or XOR approach

8. CODE QUALITY:
   ✓ Use descriptive names (expectedSum, actualSum)
   ✓ Add comment explaining formula
   ✓ Handle edge cases (single element)
   ✓ Consider readability vs cleverness

9. ALTERNATIVE APPROACHES (Know but don't recommend):
   - Sorting: O(n log n) - too slow
   - Hash Set: O(n) space - unnecessary
   - These show you know multiple solutions but can choose optimal

10. TIME & SPACE COMPLEXITY:
    Always state: "O(n) time, O(1) space"
    Explain: "Single pass to sum/XOR, constant extra variables"
    `);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// RELATED PROBLEMS
// ============================================================================

function printRelatedProblems() {
  console.log("\n" + "=".repeat(70));
  console.log("🔗 RELATED PROBLEMS");
  console.log("=".repeat(70));
  console.log(`
1. Missing Number (This Problem) - Easy
   - Single missing number from [0, n]
   - Sum formula or XOR

2. Find All Numbers Disappeared in Array (Easy)
   - Multiple missing numbers from [1, n]
   - Cyclic sort or marking technique

3. Single Number (Easy)
   - Every element appears twice except one
   - XOR approach (a^a=0)

4. Single Number II (Medium)
   - Every element appears three times except one
   - Bit manipulation with counters

5. Missing Ranges (Easy)
   - Find all missing ranges in a sorted array
   - Two pointer approach

6. First Missing Positive (Hard)
   - Find smallest missing positive integer
   - Cyclic sort pattern

7. Find the Duplicate Number (Medium)
   - One number repeats in [1, n]
   - Floyd's cycle detection or binary search

8. Set Mismatch (Easy)
   - One number duplicated, one missing
   - XOR or math

9. Two Missing Numbers
   - Extension of this problem
   - Sum and product, or XOR with grouping

10. Kth Missing Positive Number (Easy)
    - Find kth missing positive integer
    - Binary search or linear scan
    `);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log("\n🔢 PROBLEM 10: MISSING NUMBER");
console.log("=".repeat(70));

// Example 1
const nums1 = [3, 0, 1];
console.log("\n📌 Example 1:");
console.log(`Input: [${nums1.join(", ")}]`);
console.log(`Output: ${missingNumber(nums1)}`);
console.log("Explanation: n = 3, range is [0,3], missing 2");

// Example 2
const nums2 = [0, 1];
console.log("\n📌 Example 2:");
console.log(`Input: [${nums2.join(", ")}]`);
console.log(`Output: ${missingNumber(nums2)}`);
console.log("Explanation: n = 2, range is [0,2], missing 2");

// Example 3
const nums3 = [9, 6, 4, 2, 3, 5, 7, 0, 1];
console.log("\n📌 Example 3:");
console.log(`Input: [${nums3.join(", ")}]`);
console.log(`Output: ${missingNumber(nums3)}`);
console.log("Explanation: n = 9, range is [0,9], missing 8");

// Detailed visualizations
visualizeSumFormula([3, 0, 1]);
visualizeXOR([3, 0, 1]);
visualizeRange([3, 0, 1]);

// Mathematical explanation
explainMathematically();

// XOR truth table
printXORTruthTable();

// Run all tests
runTests();

// Test edge cases
testEdgeCases();

// Performance comparison
comparePerformance();

// Interview tips
printInterviewTips();

// Related problems
printRelatedProblems();

console.log("\n✅ All implementations completed!");
console.log("Recommended approaches for interviews:");
console.log("  1. Sum Formula: return n*(n+1)/2 - sum(nums)  [Most intuitive]");
console.log(
  "  2. XOR: result = n; XOR all i and nums[i]     [Shows advanced knowledge]"
);
console.log("Both: O(n) time | O(1) space\n");
