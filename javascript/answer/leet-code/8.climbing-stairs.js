/**
 * ============================================================================
 * LeetCode Problem 8: Climbing Stairs
 * ============================================================================
 *
 * Difficulty: Easy
 * Topics: Dynamic Programming, Math, Memoization, Recursion
 *
 * Problem Statement:
 * You are climbing a staircase. It takes n steps to reach the top.
 * Each time you can either climb 1 or 2 steps.
 * In how many distinct ways can you climb to the top?
 *
 * Constraints:
 * - 1 <= n <= 45
 *
 * Examples:
 * Input: n = 2
 * Output: 2
 * Explanation: Two ways: 1+1, 2
 *
 * Input: n = 3
 * Output: 3
 * Explanation: Three ways: 1+1+1, 1+2, 2+1
 */

// ============================================================================
// KEY INSIGHT: This is a Fibonacci Problem!
// ============================================================================
//
// To reach step n, you can:
// 1. Come from step (n-1) and climb 1 step
// 2. Come from step (n-2) and climb 2 steps
//
// Therefore: ways(n) = ways(n-1) + ways(n-2)
//
// This is the Fibonacci sequence!
// n = 1: 1 way
// n = 2: 2 ways
// n = 3: 3 ways = ways(2) + ways(1) = 2 + 1
// n = 4: 5 ways = ways(3) + ways(2) = 3 + 2
// n = 5: 8 ways = ways(4) + ways(3) = 5 + 3

// ============================================================================
// Approach 1: Recursive (Brute Force) - NOT RECOMMENDED
// ============================================================================
// Time Complexity: O(2^n) - Exponential! Each call branches into 2 calls
// Space Complexity: O(n) - Recursion call stack depth
//
// ❌ This will get Time Limit Exceeded on LeetCode for n > 40
//
// Why so slow?
// - Recalculates the same subproblems many times
// - Example: climbStairs(5) calls climbStairs(4) and climbStairs(3)
//            climbStairs(4) also calls climbStairs(3)
//            climbStairs(3) is calculated twice!

function climbStairs_Recursive(n) {
  // Base cases
  if (n === 1) return 1;
  if (n === 2) return 2;

  // Recursive case: sum of two previous steps
  return climbStairs_Recursive(n - 1) + climbStairs_Recursive(n - 2);
}

// ============================================================================
// Approach 2: Recursion with Memoization (Top-Down DP)
// ============================================================================
// Time Complexity: O(n) - Each subproblem calculated once
// Space Complexity: O(n) - Memoization cache + recursion stack
//
// Strategy:
// - Cache results of subproblems in a memo object
// - Before calculating, check if result already exists
// - This eliminates redundant calculations

function climbStairs_Memoization(n, memo = {}) {
  // Check if already calculated
  if (n in memo) return memo[n];

  // Base cases
  if (n === 1) return 1;
  if (n === 2) return 2;

  // Calculate and store in memo
  memo[n] =
    climbStairs_Memoization(n - 1, memo) + climbStairs_Memoization(n - 2, memo);

  return memo[n];
}

// ============================================================================
// Approach 3: Dynamic Programming - Tabulation (Bottom-Up) ⭐
// ============================================================================
// Time Complexity: O(n) - Single loop from 3 to n
// Space Complexity: O(n) - DP array of size n+1
//
// Strategy:
// - Build solution from bottom up (smaller problems first)
// - Store results in an array (table)
// - Use previously computed values to calculate current value
//
// ✅ This is a good interview solution - clear and efficient

function climbStairs_DP(n) {
  // Handle base cases
  if (n === 1) return 1;
  if (n === 2) return 2;

  // Create DP array
  const dp = new Array(n + 1);

  // Base cases
  dp[1] = 1; // 1 way to reach step 1
  dp[2] = 2; // 2 ways to reach step 2

  // Fill the DP array
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}

// ============================================================================
// Approach 4: Space-Optimized DP (OPTIMAL) ⭐⭐⭐
// ============================================================================
// Time Complexity: O(n) - Single loop
// Space Complexity: O(1) - Only two variables
//
// Key Insight:
// - We only need the last 2 values to calculate the next one
// - No need to store all previous values in an array
// - Use two variables instead of an array
//
// ✅ This is the BEST solution for interviews!

function climbStairs(n) {
  if (n === 1) return 1;
  if (n === 2) return 2;

  let prev2 = 1; // ways(1)
  let prev1 = 2; // ways(2)
  let current;

  for (let i = 3; i <= n; i++) {
    current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }

  return current;
}

// ============================================================================
// Approach 5: Fibonacci Formula (Mathematical) - ADVANCED
// ============================================================================
// Time Complexity: O(1) - Direct calculation (with math operations)
// Space Complexity: O(1) - Only variables
//
// Binet's Formula:
// F(n) = (φⁿ - ψⁿ) / √5
// where φ = (1 + √5) / 2 (golden ratio)
// and ψ = (1 - √5) / 2
//
// Note: For climbing stairs, result = F(n+1) where F is Fibonacci
//
// ⚠️ May have floating point precision issues for large n

function climbStairs_Formula(n) {
  const sqrt5 = Math.sqrt(5);
  const phi = (1 + sqrt5) / 2; // Golden ratio
  const psi = (1 - sqrt5) / 2;

  // Fibonacci formula (n+1 because stairs sequence is offset by 1)
  return Math.round((Math.pow(phi, n + 1) - Math.pow(psi, n + 1)) / sqrt5);
}

// ============================================================================
// Approach 6: Matrix Exponentiation - ADVANCED
// ============================================================================
// Time Complexity: O(log n) - Using fast exponentiation
// Space Complexity: O(1) - Only matrix variables
//
// Fibonacci using matrix multiplication:
// [F(n+1)]   [1 1]ⁿ   [1]
// [F(n)  ] = [1 0]  × [0]
//
// This is the fastest approach for very large n

function climbStairs_Matrix(n) {
  if (n === 1) return 1;

  // Matrix [[1,1], [1,0]]
  const multiply = (a, b) => {
    return [
      [
        a[0][0] * b[0][0] + a[0][1] * b[1][0],
        a[0][0] * b[0][1] + a[0][1] * b[1][1],
      ],
      [
        a[1][0] * b[0][0] + a[1][1] * b[1][0],
        a[1][0] * b[0][1] + a[1][1] * b[1][1],
      ],
    ];
  };

  const matrixPower = (matrix, n) => {
    if (n === 1) return matrix;
    if (n % 2 === 0) {
      const half = matrixPower(matrix, n / 2);
      return multiply(half, half);
    }
    return multiply(matrix, matrixPower(matrix, n - 1));
  };

  const baseMatrix = [
    [1, 1],
    [1, 0],
  ];
  const result = matrixPower(baseMatrix, n);

  return result[0][0];
}

// ============================================================================
// VISUALIZATION: How the Algorithm Works
// ============================================================================

function visualizeAlgorithm(n) {
  console.log("\n" + "=".repeat(70));
  console.log("VISUALIZATION: Climbing Stairs");
  console.log("=".repeat(70));
  console.log(`Number of steps: ${n}`);
  console.log("");

  if (n === 1) {
    console.log("Step 1: 1 way");
    console.log("  [1]");
    console.log("\n" + "=".repeat(70) + "\n");
    return;
  }

  if (n === 2) {
    console.log("Step 1: 1 way → [1]");
    console.log("Step 2: 2 ways → [1+1], [2]");
    console.log("\n" + "=".repeat(70) + "\n");
    return;
  }

  const dp = [0, 1, 2];

  console.log("Step | Ways | Calculation | Explanation");
  console.log("-".repeat(70));
  console.log("  1  |  1   |     -       | Base case: only one way [1]");
  console.log("  2  |  2   |     -       | Base case: [1+1] or [2]");

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
    console.log(
      `  ${i}  |  ${dp[i]}   | ${dp[i - 1]} + ${dp[i - 2]}     | From step ${
        i - 1
      } (1 step) OR step ${i - 2} (2 steps)`
    );
  }

  console.log("-".repeat(70));
  console.log(`\n💡 Total ways to climb ${n} stairs: ${dp[n]}`);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// VISUAL DIAGRAM: All Possible Paths
// ============================================================================

function visualizeAllPaths(n) {
  console.log("\n" + "=".repeat(70));
  console.log("ALL POSSIBLE PATHS");
  console.log("=".repeat(70));
  console.log(`For n = ${n} stairs:\n`);

  // Generate all possible paths using backtracking
  const paths = [];

  function backtrack(currentStep, path) {
    if (currentStep === n) {
      paths.push([...path]);
      return;
    }
    if (currentStep > n) {
      return;
    }

    // Try taking 1 step
    path.push(1);
    backtrack(currentStep + 1, path);
    path.pop();

    // Try taking 2 steps
    path.push(2);
    backtrack(currentStep + 2, path);
    path.pop();
  }

  backtrack(0, []);

  paths.forEach((path, index) => {
    const pathStr = path.join(" + ");
    const sum = path.reduce((a, b) => a + b, 0);
    console.log(`Path ${index + 1}: [${pathStr}] = ${sum}`);
  });

  console.log(`\nTotal: ${paths.length} distinct ways`);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// VISUAL DIAGRAM: Recursion Tree (for small n)
// ============================================================================

function visualizeRecursionTree(n) {
  if (n > 5) {
    console.log("\nRecursion tree too large to display for n > 5\n");
    return;
  }

  console.log("\n" + "=".repeat(70));
  console.log("RECURSION TREE (showing why memoization helps)");
  console.log("=".repeat(70));
  console.log(`For n = ${n}:\n`);

  const buildTree = (n, indent = "") => {
    if (n === 1) {
      console.log(`${indent}climbStairs(1) → 1`);
      return;
    }
    if (n === 2) {
      console.log(`${indent}climbStairs(2) → 2`);
      return;
    }

    console.log(`${indent}climbStairs(${n})`);
    console.log(`${indent}├─ climbStairs(${n - 1})`);
    buildTree(n - 1, indent + "│  ");
    console.log(`${indent}└─ climbStairs(${n - 2})`);
    buildTree(n - 2, indent + "   ");
  };

  buildTree(n);

  console.log("\n📊 Notice: Many subproblems are calculated multiple times!");
  console.log("   Memoization solves this by caching results.");
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// FIBONACCI SEQUENCE VISUALIZATION
// ============================================================================

function visualizeFibonacci(n) {
  console.log("\n" + "=".repeat(70));
  console.log("FIBONACCI SEQUENCE CONNECTION");
  console.log("=".repeat(70));
  console.log(`
The Climbing Stairs problem follows the Fibonacci sequence!

Position:  1  2  3  4  5  6  7  8  9  10 ...
Fibonacci: 1  1  2  3  5  8  13 21 34 55 ...
Stairs:    1  2  3  5  8  13 21 34 55 89 ...
           ↑  ↑  ↑  ↑  ↑  ↑  ↑
           Same values, just shifted by 1 position!

Stairs(n) = Fibonacci(n + 1)

For n = ${n}:
`);

  const fib = [0, 1, 1];
  for (let i = 3; i <= n + 1; i++) {
    fib[i] = fib[i - 1] + fib[i - 2];
  }

  console.log(`Fibonacci(${n + 1}) = ${fib[n + 1]}`);
  console.log(`Stairs(${n}) = ${fib[n + 1]}`);
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
Why is this a Fibonacci problem?

Let W(n) = number of ways to reach step n

To reach step n, you must be at either:
1. Step (n-1) → then take 1 step to reach n
2. Step (n-2) → then take 2 steps to reach n

These are the ONLY two ways to reach step n.

Therefore:
    W(n) = W(n-1) + W(n-2)

Base cases:
    W(1) = 1  (only one way: [1])
    W(2) = 2  (two ways: [1+1] or [2])

This is the recurrence relation for Fibonacci!

Example calculation for n = 5:
    W(1) = 1
    W(2) = 2
    W(3) = W(2) + W(1) = 2 + 1 = 3
    W(4) = W(3) + W(2) = 3 + 2 = 5
    W(5) = W(4) + W(3) = 5 + 3 = 8

Proof by induction:
    Base case: W(1) = 1 ✓, W(2) = 2 ✓
    
    Inductive step:
    Assume W(k) is correct for all k < n
    Then W(n) = W(n-1) + W(n-2) is the sum of:
    - All ways to reach n-1 (then add 1 step)
    - All ways to reach n-2 (then add 2 steps)
    These cover ALL possible ways (no overlap, no missing cases)
    Therefore W(n) is correct ✓

Time Complexity Analysis:
    Recursive: O(2^n) - exponential branching
    Memoization: O(n) - calculate each subproblem once
    DP Array: O(n) - single loop
    Space-Optimized: O(n) - single loop
    Formula: O(1) - direct calculation
    Matrix: O(log n) - fast exponentiation
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
      name: "Minimum Input (n=1)",
      input: 1,
      expected: 1,
      explanation: "Only one way: [1]",
    },
    {
      name: "Two Steps",
      input: 2,
      expected: 2,
      explanation: "Two ways: [1+1], [2]",
    },
    {
      name: "Three Steps",
      input: 3,
      expected: 3,
      explanation: "Three ways: [1+1+1], [1+2], [2+1]",
    },
    {
      name: "Four Steps",
      input: 4,
      expected: 5,
      explanation: "Five ways: [1+1+1+1], [1+1+2], [1+2+1], [2+1+1], [2+2]",
    },
    {
      name: "Five Steps",
      input: 5,
      expected: 8,
      explanation: "Eight ways total",
    },
    {
      name: "Ten Steps",
      input: 10,
      expected: 89,
      explanation: "Fibonacci(11) = 89",
    },
    {
      name: "Large Input (n=30)",
      input: 30,
      expected: 1346269,
      explanation: "Tests performance with larger input",
    },
    {
      name: "Maximum Input (n=45)",
      input: 45,
      expected: 1836311903,
      explanation: "Maximum constraint value",
    },
  ];

  edgeCases.forEach(({ name, input, expected, explanation }) => {
    const result = climbStairs(input);
    const status = result === expected ? "✅" : "❌";

    console.log(`${status} ${name}`);
    console.log(`   Input: n = ${input}`);
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

  const testCases = [
    { n: 10, name: "Small (n=10)" },
    { n: 20, name: "Medium (n=20)" },
    { n: 30, name: "Large (n=30)" },
    { n: 40, name: "Very Large (n=40)" },
  ];

  testCases.forEach(({ n, name }) => {
    console.log(`${name}:`);
    console.log("-".repeat(50));

    // Recursive (skip for large n)
    if (n <= 30) {
      const start1 = performance.now();
      const result1 = climbStairs_Recursive(n);
      const time1 = performance.now() - start1;
      console.log(
        `Recursive:          ${time1.toFixed(3)}ms (result: ${result1})`
      );
    } else {
      console.log(`Recursive:          Skipped (too slow for n=${n})`);
    }

    // Memoization
    const start2 = performance.now();
    const result2 = climbStairs_Memoization(n);
    const time2 = performance.now() - start2;
    console.log(
      `Memoization:        ${time2.toFixed(3)}ms (result: ${result2})`
    );

    // DP Array
    const start3 = performance.now();
    const result3 = climbStairs_DP(n);
    const time3 = performance.now() - start3;
    console.log(
      `DP Array:           ${time3.toFixed(3)}ms (result: ${result3})`
    );

    // Space-Optimized
    const start4 = performance.now();
    const result4 = climbStairs(n);
    const time4 = performance.now() - start4;
    console.log(
      `Space-Optimized:    ${time4.toFixed(3)}ms (result: ${result4})`
    );

    // Formula
    const start5 = performance.now();
    const result5 = climbStairs_Formula(n);
    const time5 = performance.now() - start5;
    console.log(
      `Formula:            ${time5.toFixed(3)}ms (result: ${result5})`
    );

    // Matrix
    const start6 = performance.now();
    const result6 = climbStairs_Matrix(n);
    const time6 = performance.now() - start6;
    console.log(
      `Matrix:             ${time6.toFixed(3)}ms (result: ${result6})`
    );

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
    { input: 1, expected: 1, description: "Minimum: 1 step" },
    { input: 2, expected: 2, description: "Two steps" },
    { input: 3, expected: 3, description: "Three steps" },
    { input: 4, expected: 5, description: "Four steps" },
    { input: 5, expected: 8, description: "Five steps" },
    { input: 6, expected: 13, description: "Six steps" },
    { input: 7, expected: 21, description: "Seven steps" },
    { input: 8, expected: 34, description: "Eight steps" },
    { input: 10, expected: 89, description: "Ten steps" },
    { input: 15, expected: 987, description: "Fifteen steps" },
  ];

  const approaches = [
    { name: "Recursive (Brute Force)", fn: climbStairs_Recursive },
    { name: "Memoization", fn: climbStairs_Memoization },
    { name: "DP Array", fn: climbStairs_DP },
    { name: "Space-Optimized (Optimal)", fn: climbStairs },
    { name: "Formula", fn: climbStairs_Formula },
    { name: "Matrix", fn: climbStairs_Matrix },
  ];

  approaches.forEach(({ name, fn }) => {
    console.log(`\n${name}:`);
    console.log("-".repeat(70));

    let passed = 0;
    testCases.forEach(({ input, expected, description }, index) => {
      const result = fn(input);
      const status = result === expected ? "✅" : "❌";

      if (result === expected) passed++;

      console.log(`${status} Test ${index + 1}: ${description}`);
      console.log(`   Input: n = ${input}`);
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
1. RECOGNIZE THE PATTERN:
   ✓ "This looks like a Fibonacci problem"
   ✓ "To reach step n, I can come from (n-1) or (n-2)"
   ✓ "So ways(n) = ways(n-1) + ways(n-2)"
   - Recognizing this pattern shows problem-solving skills!

2. START WITH UNDERSTANDING:
   ✓ Draw small examples (n=1, n=2, n=3)
   ✓ List all possible paths
   ✓ Find the pattern before coding

3. DISCUSS MULTIPLE APPROACHES:
   Level 1: Recursive (show you understand the problem)
   Level 2: Memoization (optimize recursive approach)
   Level 3: DP Array (bottom-up thinking)
   Level 4: Space-Optimized (best practical solution) ⭐
   Level 5: Formula/Matrix (show advanced knowledge)

4. OPTIMAL SOLUTION FOR INTERVIEWS:
   ✅ Space-Optimized DP (Approach 4)
   - O(n) time, O(1) space
   - Clear, readable, efficient
   - Easy to explain and implement

5. COMMON MISTAKES TO AVOID:
   ❌ Not handling base cases (n=1, n=2)
   ❌ Starting loop from wrong index
   ❌ Off-by-one errors in array indexing
   ❌ Not considering space optimization
   ❌ Confusing this with permutation/combination problems

6. CLARIFICATION QUESTIONS TO ASK:
   ✓ "Can I take more than 2 steps at a time?" → No, only 1 or 2
   ✓ "Do different orders count as different ways?" → Yes (1+2 ≠ 2+1)
   ✓ "What's the range of n?" → 1 ≤ n ≤ 45
   ✓ "Can n be 0?" → No, minimum is 1

7. FOLLOW-UP VARIATIONS:
   - "What if you could take 1, 2, or 3 steps?"
     → Same approach: ways(n) = ways(n-1) + ways(n-2) + ways(n-3)
   - "What if each step has a cost?"
     → Min cost DP problem
   - "What if some steps are broken?"
     → Add condition to skip those steps

8. CODE QUALITY:
   ✓ Use meaningful variable names (prev1, prev2, not a, b)
   ✓ Handle edge cases explicitly
   ✓ Add comments explaining the logic
   ✓ Test with multiple examples

9. EXPLANATION FRAMEWORK:
   a) "This is a Fibonacci problem"
   b) "To reach step n, I can come from step n-1 or n-2"
   c) "So I need to sum the ways to reach both previous steps"
   d) "I'll use space-optimized DP with O(n) time and O(1) space"
   e) "Only need to track last 2 values, not entire array"

10. TIME & SPACE COMPLEXITY:
    Always state clearly:
    - "O(n) time - single pass from 3 to n"
    - "O(1) space - only two variables"
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
1. Fibonacci Number (Easy)
   - Direct Fibonacci calculation
   - Same techniques apply

2. Min Cost Climbing Stairs (Easy)
   - Each step has a cost
   - Find minimum cost to reach top
   - Similar DP approach

3. House Robber (Medium)
   - Cannot rob adjacent houses
   - Similar DP pattern: max(prev1, prev2 + current)

4. Decode Ways (Medium)
   - Count ways to decode a string
   - Similar recurrence: ways(n) = ways(n-1) + ways(n-2)

5. Unique Paths (Medium)
   - Robot moving in grid
   - 2D version of climbing stairs

6. Jump Game (Medium)
   - Can jump 1 to nums[i] steps
   - More complex version of stairs

7. Triangle (Medium)
   - Minimum path sum in triangle
   - DP optimization similar

8. N-th Tribonacci Number (Easy)
   - Extension: sum of last 3 numbers
   - ways(n) = ways(n-1) + ways(n-2) + ways(n-3)

9. Count Ways to Build Good Strings (Medium)
   - Building strings with constraints
   - Similar DP recurrence

10. Number of Dice Rolls With Target Sum (Medium)
    - Counting combinations
    - Similar DP counting pattern
    `);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log("\n🪜 PROBLEM 8: CLIMBING STAIRS");
console.log("=".repeat(70));

// Example 1: n = 2
console.log("\n📌 Example 1:");
console.log("Input: n = 2");
console.log(`Output: ${climbStairs(2)}`);
console.log("Explanation: Two ways: [1+1], [2]");

// Example 2: n = 3
console.log("\n📌 Example 2:");
console.log("Input: n = 3");
console.log(`Output: ${climbStairs(3)}`);
console.log("Explanation: Three ways: [1+1+1], [1+2], [2+1]");

// Detailed visualizations
visualizeAlgorithm(5);
visualizeAllPaths(4);
visualizeRecursionTree(5);
visualizeFibonacci(10);

// Mathematical explanation
explainMathematically();

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
console.log(
  "Recommended approach for interviews: Approach 4 (Space-Optimized DP)"
);
console.log("Time: O(n) | Space: O(1)\n");
