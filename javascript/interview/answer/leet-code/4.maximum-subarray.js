/**
 * LeetCode #53: Maximum Subarray (Kadane's Algorithm)
 * Difficulty: Easy (Medium conceptually)
 * Topics: Array, Dynamic Programming, Divide and Conquer
 *
 * Problem:
 * Given an integer array nums, find the contiguous subarray
 * (containing at least one number) which has the largest sum and return its sum.
 *
 * A subarray is a contiguous part of an array.
 */

// ============================================
// APPROACH 0: Kadane's with Detailed Tracking
// Time Complexity: O(n)
// Space Complexity: O(1)
// ============================================

/**
 * Returns both max sum and the subarray indices
 * @param {number[]} nums
 * @return {object}
 */
function maxSubArrayWithIndices(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];

  let maxStart = 0;
  let maxEnd = 0;
  let currentStart = 0;

  for (let i = 1; i < nums.length; i++) {
    // If current sum becomes negative, start fresh from current element
    if (currentSum < 0) {
      currentSum = nums[i];
      currentStart = i;
    } else {
      currentSum += nums[i];
    }

    // Update max if we found a better sum
    if (currentSum > maxSum) {
      maxSum = currentSum;
      maxStart = currentStart;
      maxEnd = i;
    }
  }

  return {
    maxSum,
    start: maxStart,
    end: maxEnd,
    subarray: nums.slice(maxStart, maxEnd + 1),
  };
}

// ============================================
// APPROACH 1: Kadane's Algorithm (Optimal) ⭐
// Time Complexity: O(n)
// Space Complexity: O(1)
// ============================================

/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  let maxSum = nums[0]; // Track the maximum sum found so far
  let currentSum = nums[0]; // Track current subarray sum

  // Iterate through array starting from second element
  for (let i = 1; i < nums.length; i++) {
    // Either extend existing subarray or start new one
    currentSum = Math.max(nums[i], currentSum + nums[i]);

    // Update maximum if current sum is larger
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}

// ============================================
// APPROACH 3: Brute Force (For Understanding)
// Time Complexity: O(n²)
// Space Complexity: O(1)
// ============================================

/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArrayBruteForce(nums) {
  let maxSum = -Infinity;

  // Try all possible subarrays
  for (let i = 0; i < nums.length; i++) {
    let currentSum = 0;

    for (let j = i; j < nums.length; j++) {
      currentSum += nums[j];
      maxSum = Math.max(maxSum, currentSum);
    }
  }

  return maxSum;
}

// ============================================
// APPROACH 4: Dynamic Programming (Explicit)
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArrayDP(nums) {
  const n = nums.length;
  const dp = new Array(n);

  // dp[i] represents max subarray sum ending at index i
  dp[0] = nums[0];
  let maxSum = dp[0];

  for (let i = 1; i < n; i++) {
    // Either extend previous subarray or start new one
    dp[i] = Math.max(nums[i], dp[i - 1] + nums[i]);
    maxSum = Math.max(maxSum, dp[i]);
  }

  return maxSum;
}

// ============================================
// APPROACH 5: Divide and Conquer
// Time Complexity: O(n log n)
// Space Complexity: O(log n) - recursion stack
// ============================================

/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArrayDivideConquer(nums) {
  function maxSubArrayHelper(nums, left, right) {
    // Base case: only one element
    if (left === right) {
      return nums[left];
    }

    const mid = Math.floor((left + right) / 2);

    // Maximum subarray in left half
    const leftMax = maxSubArrayHelper(nums, left, mid);

    // Maximum subarray in right half
    const rightMax = maxSubArrayHelper(nums, mid + 1, right);

    // Maximum subarray crossing the middle
    const crossMax = maxCrossingSum(nums, left, mid, right);

    // Return maximum of three
    return Math.max(leftMax, rightMax, crossMax);
  }

  function maxCrossingSum(nums, left, mid, right) {
    // Find max sum in left half (including mid)
    let leftSum = -Infinity;
    let sum = 0;
    for (let i = mid; i >= left; i--) {
      sum += nums[i];
      leftSum = Math.max(leftSum, sum);
    }

    // Find max sum in right half (excluding mid)
    let rightSum = -Infinity;
    sum = 0;
    for (let i = mid + 1; i <= right; i++) {
      sum += nums[i];
      rightSum = Math.max(rightSum, sum);
    }

    return leftSum + rightSum;
  }

  return maxSubArrayHelper(nums, 0, nums.length - 1);
}

// ============================================
// TEST CASES
// ============================================

console.log("=== Maximum Subarray Test Cases ===\n");

function testMaxSubArray(testName, nums, expected) {
  const result = maxSubArray(nums);
  const detailed = maxSubArrayWithIndices(nums);
  const passed = result === expected;

  console.log(`${testName}:`);
  console.log(`  Input:    [${nums.join(", ")}]`);
  console.log(`  Output:   ${result}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Subarray: [${detailed.subarray.join(", ")}]`);
  console.log(`  Indices:  [${detailed.start}, ${detailed.end}]`);
  console.log(`  Status:   ${passed ? "✅ PASS" : "❌ FAIL"}`);
  console.log();
}

// Test Case 1: Mixed positive and negative
testMaxSubArray("Test 1 (Classic)", [-2, 1, -3, 4, -1, 2, 1, -5, 4], 6);

// Test Case 2: Single element
testMaxSubArray("Test 2 (Single element)", [1], 1);

// Test Case 3: All positive
testMaxSubArray("Test 3 (All positive)", [5, 4, -1, 7, 8], 23);

// Test Case 4: All negative
testMaxSubArray("Test 4 (All negative)", [-2, -3, -1, -4], -1);

// Test Case 5: Two elements
testMaxSubArray("Test 5 (Two elements)", [-2, 1], 1);

// Test Case 6: Large positive at end
testMaxSubArray("Test 6 (Large at end)", [-1, -2, -3, 100], 100);

// Test Case 7: Zeros included
testMaxSubArray("Test 7 (With zeros)", [0, -3, 1, 1], 2);

// Test Case 8: Complex case
testMaxSubArray("Test 8 (Complex)", [1, -1, 1, -1, 1, -1, 1], 1);

// ============================================
// COMPARE ALL APPROACHES
// ============================================

console.log("=== Testing All Approaches ===\n");

const testNums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];

const approaches = [
  { name: "Kadane's Algorithm", fn: maxSubArray },
  { name: "Brute Force", fn: maxSubArrayBruteForce },
  { name: "Dynamic Programming", fn: maxSubArrayDP },
  { name: "Divide and Conquer", fn: maxSubArrayDivideConquer },
];

approaches.forEach((approach) => {
  const result = approach.fn(testNums);
  console.log(`${approach.name}: ${result}`);
});

console.log();

// ============================================
// PERFORMANCE COMPARISON
// ============================================

console.log("=== Performance Comparison ===\n");

// Generate large test array
const largeNums = Array.from(
  { length: 10000 },
  () => Math.floor(Math.random() * 200) - 100
);

// Test Kadane's O(n)
console.time("Kadane's Algorithm (10K elements)");
maxSubArray(largeNums);
console.timeEnd("Kadane's Algorithm (10K elements)");

// Test DP O(n) with O(n) space
console.time("Dynamic Programming (10K elements)");
maxSubArrayDP(largeNums);
console.timeEnd("Dynamic Programming (10K elements)");

// Test Divide & Conquer O(n log n)
console.time("Divide and Conquer (10K elements)");
maxSubArrayDivideConquer(largeNums);
console.timeEnd("Divide and Conquer (10K elements)");

// Brute Force would be too slow for 10K elements
console.log("Brute Force: ⏭️  Skipped (too slow for 10K elements - O(n²))");

console.log();

// ============================================
// STEP-BY-STEP VISUALIZATION
// ============================================

console.log("=== Step-by-Step Kadane's Algorithm ===\n");

function maxSubArrayVisualized(nums) {
  console.log(`Input: [${nums.join(", ")}]`);
  console.log();

  let maxSum = nums[0];
  let currentSum = nums[0];

  console.log(`Initialize:`);
  console.log(`  maxSum = ${maxSum}, currentSum = ${currentSum}`);
  console.log();

  for (let i = 1; i < nums.length; i++) {
    console.log(`Step ${i}: Process nums[${i}] = ${nums[i]}`);

    const extendSum = currentSum + nums[i];
    const freshStart = nums[i];

    console.log(
      `  Option 1: Extend existing (${currentSum} + ${nums[i]} = ${extendSum})`
    );
    console.log(`  Option 2: Start fresh (${freshStart})`);

    currentSum = Math.max(freshStart, extendSum);
    console.log(`  → Choose: currentSum = ${currentSum}`);

    const oldMaxSum = maxSum;
    maxSum = Math.max(maxSum, currentSum);

    if (maxSum !== oldMaxSum) {
      console.log(`  → New maximum found! maxSum = ${maxSum} ⭐`);
    } else {
      console.log(`  → maxSum stays ${maxSum}`);
    }

    console.log();
  }

  console.log(`Final Result: ${maxSum}`);
  return maxSum;
}

maxSubArrayVisualized([-2, 1, -3, 4, -1, 2, 1, -5, 4]);

console.log("\n" + "=".repeat(60) + "\n");

// ============================================
// KADANE'S ALGORITHM EXPLANATION
// ============================================

console.log("=== Kadane's Algorithm Explained ===\n");
console.log("💡 KEY INSIGHT:");
console.log("At each position, we have two choices:");
console.log("  1. Extend the existing subarray by adding current element");
console.log("  2. Start a new subarray from current element");
console.log();
console.log("We choose whichever gives us a larger sum!");
console.log();
console.log("DECISION RULE:");
console.log("  currentSum = max(nums[i], currentSum + nums[i])");
console.log();
console.log("WHY IT WORKS:");
console.log(
  "  • If currentSum + nums[i] < nums[i], the previous sum was dragging us down"
);
console.log("  • Better to start fresh from current element");
console.log("  • If currentSum + nums[i] ≥ nums[i], extending is beneficial");
console.log();
console.log("COMPLEXITY:");
console.log("  Time:  O(n) - single pass through array");
console.log("  Space: O(1) - only two variables needed");
console.log();

// ============================================
// VISUAL EXAMPLES
// ============================================

console.log("=== Visual Example ===\n");

function visualizeSubarray(nums) {
  const result = maxSubArrayWithIndices(nums);

  console.log(`Array: [${nums.join(", ")}]`);
  console.log();

  // Show the array with the max subarray highlighted
  let visual = "";
  for (let i = 0; i < nums.length; i++) {
    if (i >= result.start && i <= result.end) {
      visual += `[${nums[i]}] `;
    } else {
      visual += ` ${nums[i]}  `;
    }
  }

  console.log("Visual:");
  console.log(visual);
  console.log(
    " ".repeat(result.start * 5) +
      "└" +
      "─".repeat((result.end - result.start) * 5) +
      "┘"
  );
  console.log(
    " ".repeat(result.start * 5) + `Max Subarray (sum = ${result.maxSum})`
  );
  console.log();
}

visualizeSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]);
visualizeSubarray([5, 4, -1, 7, 8]);
visualizeSubarray([-2, -3, -1, -4]);

console.log("=".repeat(60) + "\n");

// ============================================
// EDGE CASES
// ============================================

console.log("=== Edge Cases to Consider ===\n");

const edgeCases = [
  { input: [1], expected: 1, description: "Single positive element" },
  { input: [-1], expected: -1, description: "Single negative element" },
  { input: [0], expected: 0, description: "Single zero" },
  { input: [-2, -3, -1, -4], expected: -1, description: "All negative" },
  { input: [1, 2, 3, 4, 5], expected: 15, description: "All positive" },
  { input: [0, 0, 0, 0], expected: 0, description: "All zeros" },
  { input: [-1, 0, -2], expected: 0, description: "Zero among negatives" },
  { input: [5, -3, 5], expected: 7, description: "Negative in middle" },
  { input: [-2, 1], expected: 1, description: "Two elements" },
  { input: [1, -2, 3, -1, 2], expected: 4, description: "Multiple subarrays" },
];

edgeCases.forEach((testCase, index) => {
  const result = maxSubArray(testCase.input);
  const status = result === testCase.expected ? "✅" : "❌";
  console.log(`${index + 1}. ${status} ${testCase.description}`);
  console.log(
    `   Input: [${testCase.input.join(", ")}] → ${result} (expected: ${
      testCase.expected
    })`
  );
});

console.log();

// ============================================
// INTERVIEW TIPS
// ============================================

console.log("=== Interview Tips ===\n");
console.log("✨ Key Points to Mention:");
console.log("  1. Kadane's Algorithm is the optimal solution");
console.log("  2. Classic dynamic programming problem");
console.log("  3. Can be solved with O(1) space (space-optimized DP)");
console.log("  4. At each step: extend existing or start fresh");
console.log();
console.log("🎯 What Interviewers Look For:");
console.log("  - Understanding of greedy/DP approach");
console.log("  - Ability to optimize from brute force");
console.log("  - Handling of all negative numbers");
console.log("  - Clean implementation");
console.log();
console.log("⚠️  Common Mistakes to Avoid:");
console.log("  - Forgetting to initialize with first element");
console.log("  - Not handling all negative arrays correctly");
console.log("  - Confusing maxSum and currentSum");
console.log("  - Using 0 as initial value (fails for all negative)");
console.log();
console.log("💡 Follow-up Questions:");
console.log("  Q: Can you return the actual subarray, not just sum?");
console.log(
  "  A: Yes! Track start and end indices (see maxSubArrayWithIndices)"
);
console.log();
console.log("  Q: What if we need to exclude empty subarray?");
console.log("  A: The problem guarantees at least one element");
console.log();
console.log("  Q: Can you do it with O(1) space?");
console.log("  A: Yes! Kadane's uses only two variables");
console.log();

// ============================================
// RELATED PROBLEMS
// ============================================

console.log("=== Related Problems ===\n");
console.log("1. Maximum Product Subarray (LeetCode #152)");
console.log("   - Find max product instead of sum");
console.log();
console.log("2. Best Time to Buy and Sell Stock (LeetCode #121)");
console.log("   - Similar concept, find max profit");
console.log();
console.log("3. Maximum Sum Circular Subarray (LeetCode #918)");
console.log("   - Array is circular");
console.log();
console.log("4. Longest Turbulent Subarray (LeetCode #978)");
console.log("   - Finding patterns in subarrays");
console.log();

// ============================================
// WHY KADANE'S WORKS (MATHEMATICAL PROOF)
// ============================================

console.log("=== Why Kadane's Algorithm Works ===\n");
console.log("PROOF BY INDUCTION:");
console.log();
console.log("Let dp[i] = maximum sum of subarray ending at index i");
console.log();
console.log("Base case:");
console.log("  dp[0] = nums[0] (only one choice)");
console.log();
console.log("Recurrence relation:");
console.log("  dp[i] = max(nums[i], dp[i-1] + nums[i])");
console.log();
console.log("Explanation:");
console.log("  • If dp[i-1] + nums[i] > nums[i]:");
console.log("    → Previous subarray was positive, extend it");
console.log("  • If dp[i-1] + nums[i] ≤ nums[i]:");
console.log("    → Previous subarray was negative, start fresh");
console.log();
console.log("Final answer:");
console.log("  max(dp[0], dp[1], ..., dp[n-1])");
console.log();
console.log("Space optimization:");
console.log("  We only need dp[i-1] to compute dp[i]");
console.log("  → Can use single variable instead of array!");
console.log();

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    maxSubArray,
    maxSubArrayWithIndices,
    maxSubArrayBruteForce,
    maxSubArrayDP,
    maxSubArrayDivideConquer,
  };
}
