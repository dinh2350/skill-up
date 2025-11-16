/**
 * Product of Array Except Self - LeetCode Problem
 * Difficulty: Medium
 *
 * Problem: Given an integer array nums, return an array answer such that answer[i]
 * is equal to the product of all elements of nums except nums[i].
 *
 * The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.
 * You must write an algorithm that runs in O(n) time and without using the division operation.
 *
 * Example 1:
 * Input: nums = [1,2,3,4]
 * Output: [24,12,8,6]
 * Explanation:
 * - answer[0] = 2*3*4 = 24
 * - answer[1] = 1*3*4 = 12
 * - answer[2] = 1*2*4 = 8
 * - answer[3] = 1*2*3 = 6
 *
 * Example 2:
 * Input: nums = [-1,1,0,-3,3]
 * Output: [0,0,9,0,0]
 */

/**
 * APPROACH 1: Left and Right Product Arrays (INTUITIVE)
 *
 * Key Insights:
 * 1. For each index i, result = (product of all left elements) × (product of all right elements)
 * 2. Build two arrays:
 *    - leftProducts[i] = product of all elements to the left of i
 *    - rightProducts[i] = product of all elements to the right of i
 * 3. Result[i] = leftProducts[i] × rightProducts[i]
 *
 * Time Complexity: O(n) - three passes through array
 * Space Complexity: O(n) - two extra arrays
 */

/**
 * @param {number[]} nums
 * @return {number[]}
 */
function productExceptSelfIntuitive(nums) {
  const n = nums.length;

  // Array to store product of all elements to the left
  const leftProducts = new Array(n);
  // Array to store product of all elements to the right
  const rightProducts = new Array(n);
  // Result array
  const result = new Array(n);

  // Build left products array
  // leftProducts[i] = product of all elements before index i
  leftProducts[0] = 1; // No elements to the left of index 0
  for (let i = 1; i < n; i++) {
    leftProducts[i] = leftProducts[i - 1] * nums[i - 1];
  }

  // Build right products array
  // rightProducts[i] = product of all elements after index i
  rightProducts[n - 1] = 1; // No elements to the right of last index
  for (let i = n - 2; i >= 0; i--) {
    rightProducts[i] = rightProducts[i + 1] * nums[i + 1];
  }

  // Multiply left and right products
  for (let i = 0; i < n; i++) {
    result[i] = leftProducts[i] * rightProducts[i];
  }

  return result;
}

// ============================================================================
// APPROACH 2: Optimized with Single Output Array (OPTIMAL)
// ============================================================================

/**
 * Space-optimized version using only the output array
 *
 * Key Insight:
 * - First pass: Store left products in result array
 * - Second pass: Multiply with right products on the fly
 * - Use a variable to track running right product
 *
 * Time Complexity: O(n) - two passes
 * Space Complexity: O(1) - only output array (doesn't count as extra space per problem)
 */
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n);

  // First pass: Calculate left products and store in result
  // result[i] will contain product of all elements to the left of i
  result[0] = 1; // No elements to the left of first element
  for (let i = 1; i < n; i++) {
    result[i] = result[i - 1] * nums[i - 1];
  }

  // Second pass: Multiply with right products
  // Use a variable to track running product from right
  let rightProduct = 1; // Start with 1 (no elements to the right of last element)
  for (let i = n - 1; i >= 0; i--) {
    result[i] = result[i] * rightProduct; // result[i] already has left product
    rightProduct *= nums[i]; // Update right product for next iteration
  }

  return result;
}

// ============================================================================
// APPROACH 3: Using Division (NOT ALLOWED but good to understand)
// ============================================================================

/**
 * Simple approach using division (VIOLATES CONSTRAINT)
 *
 * This is the "obvious" solution but problem specifically says NO DIVISION
 *
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 *
 * Issues:
 * - Division by zero
 * - Integer overflow
 * - Violates problem constraint
 */
function productExceptSelfDivision(nums) {
  const n = nums.length;
  const result = new Array(n);

  // Calculate total product
  let totalProduct = 1;
  let zeroCount = 0;

  for (const num of nums) {
    if (num === 0) {
      zeroCount++;
    } else {
      totalProduct *= num;
    }
  }

  // Handle edge cases with zeros
  for (let i = 0; i < n; i++) {
    if (zeroCount > 1) {
      result[i] = 0; // More than one zero, all results are 0
    } else if (zeroCount === 1) {
      result[i] = nums[i] === 0 ? totalProduct : 0;
    } else {
      result[i] = totalProduct / nums[i]; // No zeros
    }
  }

  return result;
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log("Test Case 1:");
console.log("Input: [1,2,3,4]");
console.log("Output:", productExceptSelf([1, 2, 3, 4]));
console.log("Expected: [24,12,8,6]");
console.log();

console.log("Test Case 2:");
console.log("Input: [-1,1,0,-3,3]");
console.log("Output:", productExceptSelf([-1, 1, 0, -3, 3]));
console.log("Expected: [0,0,9,0,0]");
console.log();

console.log("Test Case 3:");
console.log("Input: [2,3,4,5]");
console.log("Output:", productExceptSelf([2, 3, 4, 5]));
console.log("Expected: [60,40,30,24]");
console.log();

console.log("Test Case 4:");
console.log("Input: [1,1,1,1]");
console.log("Output:", productExceptSelf([1, 1, 1, 1]));
console.log("Expected: [1,1,1,1]");
console.log();

console.log("Test Case 5:");
console.log("Input: [0,0]");
console.log("Output:", productExceptSelf([0, 0]));
console.log("Expected: [0,0]");
console.log();

console.log("Test Case 6:");
console.log("Input: [0,4,0]");
console.log("Output:", productExceptSelf([0, 4, 0]));
console.log("Expected: [0,0,0]");
console.log();

console.log("Test Case 7:");
console.log("Input: [-1,-2,-3,-4]");
console.log("Output:", productExceptSelf([-1, -2, -3, -4]));
console.log("Expected: [-24,-12,-8,-6]");
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * STEP-BY-STEP WALKTHROUGH:
 *
 * Example: nums = [1, 2, 3, 4]
 *
 * APPROACH 1: Using Left and Right Arrays
 *
 * Step 1: Build leftProducts array
 * leftProducts[0] = 1           (no elements to the left)
 * leftProducts[1] = 1           (1)
 * leftProducts[2] = 1 * 2 = 2   (1 * 2)
 * leftProducts[3] = 2 * 3 = 6   (1 * 2 * 3)
 * Result: [1, 1, 2, 6]
 *
 * Step 2: Build rightProducts array
 * rightProducts[3] = 1              (no elements to the right)
 * rightProducts[2] = 4              (4)
 * rightProducts[1] = 4 * 3 = 12     (3 * 4)
 * rightProducts[0] = 12 * 2 = 24    (2 * 3 * 4)
 * Result: [24, 12, 4, 1]
 *
 * Step 3: Multiply corresponding elements
 * result[0] = 1 * 24 = 24    (2 * 3 * 4)
 * result[1] = 1 * 12 = 12    (1 * 3 * 4)
 * result[2] = 2 * 4 = 8      (1 * 2 * 4)
 * result[3] = 6 * 1 = 6      (1 * 2 * 3)
 * Result: [24, 12, 8, 6] ✓
 */

/**
 * OPTIMIZED APPROACH WALKTHROUGH:
 *
 * Example: nums = [1, 2, 3, 4]
 *
 * PASS 1: Build left products in result array
 * result[0] = 1
 * result[1] = 1 * 1 = 1
 * result[2] = 1 * 2 = 2
 * result[3] = 2 * 3 = 6
 * result = [1, 1, 2, 6]
 *
 * PASS 2: Multiply with right products (going backwards)
 * rightProduct = 1 (initial)
 *
 * i=3: result[3] = 6 * 1 = 6
 *      rightProduct = 1 * 4 = 4
 *      result = [1, 1, 2, 6]
 *
 * i=2: result[2] = 2 * 4 = 8
 *      rightProduct = 4 * 3 = 12
 *      result = [1, 1, 8, 6]
 *
 * i=1: result[1] = 1 * 12 = 12
 *      rightProduct = 12 * 2 = 24
 *      result = [1, 12, 8, 6]
 *
 * i=0: result[0] = 1 * 24 = 24
 *      rightProduct = 24 * 1 = 24
 *      result = [24, 12, 8, 6] ✓
 */

/**
 * VISUAL REPRESENTATION:
 *
 * Input: [1, 2, 3, 4]
 *
 * For each position, we need product of all OTHER elements:
 *
 * Index 0: Need product of [2, 3, 4] = 24
 *          Left: []          = 1
 *          Right: [2, 3, 4]  = 24
 *          Result: 1 × 24 = 24
 *
 * Index 1: Need product of [1, 3, 4] = 12
 *          Left: [1]         = 1
 *          Right: [3, 4]     = 12
 *          Result: 1 × 12 = 12
 *
 * Index 2: Need product of [1, 2, 4] = 8
 *          Left: [1, 2]      = 2
 *          Right: [4]        = 4
 *          Result: 2 × 4 = 8
 *
 * Index 3: Need product of [1, 2, 3] = 6
 *          Left: [1, 2, 3]   = 6
 *          Right: []         = 1
 *          Result: 6 × 1 = 6
 */

/**
 * HANDLING ZEROS - IMPORTANT EDGE CASE:
 *
 * Case 1: No zeros
 * Input: [1, 2, 3, 4]
 * Output: [24, 12, 8, 6]
 * Normal calculation
 *
 * Case 2: One zero
 * Input: [1, 2, 0, 4]
 * - Position with zero: product of all others = 1×2×4 = 8
 * - All other positions: will have 0 in product
 * Output: [0, 0, 8, 0]
 *
 * Case 3: Multiple zeros
 * Input: [1, 0, 0, 4]
 * - Every position includes at least one zero
 * Output: [0, 0, 0, 0]
 *
 * The prefix-suffix approach handles zeros naturally!
 * No special case logic needed.
 */

/**
 * WHY NO DIVISION?
 *
 * Naive approach with division:
 * 1. Calculate total product
 * 2. For each position, divide by that element
 *
 * Problems:
 * 1. Division by zero - undefined behavior
 * 2. Integer overflow - product might exceed limits
 * 3. Floating point precision issues
 * 4. Problem explicitly forbids it
 *
 * The prefix-suffix approach is more elegant and handles all edge cases!
 */

/**
 * KEY INSIGHTS:
 *
 * 1. PREFIX-SUFFIX PATTERN:
 *    - Many array problems can be solved by looking left and right
 *    - Result at i = f(elements before i) ⊗ f(elements after i)
 *
 * 2. SPACE OPTIMIZATION:
 *    - Start with intuitive solution using extra space
 *    - Optimize by reusing output array
 *    - Use variables for running calculations
 *
 * 3. TWO-PASS TECHNIQUE:
 *    - First pass: left to right (prefix)
 *    - Second pass: right to left (suffix)
 *    - Combine results for final answer
 *
 * 4. MULTIPLICATION PROPERTIES:
 *    - Commutative: a × b = b × a
 *    - Identity: a × 1 = a
 *    - Zero: a × 0 = 0
 *    - These properties make the algorithm work seamlessly
 */

/**
 * COMPLEXITY ANALYSIS:
 *
 * Time Complexity: O(n)
 * - First pass through array: O(n)
 * - Second pass through array: O(n)
 * - Total: O(n) + O(n) = O(n)
 *
 * Space Complexity: O(1)
 * - Only use result array (required for output)
 * - No additional arrays needed
 * - A few variables (constant space)
 * - Note: Output array doesn't count as "extra" space
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * 1. ❌ Using division
 *    - Problem explicitly forbids it
 *    - Fails with zeros
 *
 * 2. ❌ Using nested loops
 *    - O(n²) time complexity
 *    - Too slow for large inputs
 *
 * 3. ❌ Not handling zeros properly
 *    - Test with single zero
 *    - Test with multiple zeros
 *
 * 4. ❌ Initializing arrays with 0 instead of 1
 *    - Product identity is 1, not 0
 *    - 0 makes everything 0!
 *
 * 5. ❌ Wrong loop direction in second pass
 *    - Must go right to left for suffix products
 *
 * 6. ❌ Off-by-one errors
 *    - Careful with array indices
 *    - result[i-1] and result[i+1]
 */

/**
 * INTERVIEW TIPS:
 *
 * 1. Clarify constraints:
 *    "Can I use division?" → No
 *    "What about space?" → O(1) extra space preferred
 *
 * 2. Start with brute force:
 *    "I could use nested loops to multiply all elements except current"
 *    "That would be O(n²)"
 *
 * 3. Explain intuition:
 *    "For each position, I need left product and right product"
 *    "I can build these in separate passes"
 *
 * 4. Show optimization:
 *    "Instead of two arrays, I can use the output array"
 *    "Store left products first, then multiply with right products"
 *
 * 5. Handle edge cases:
 *    "What if there are zeros?"
 *    "What if array has only two elements?"
 */

/**
 * RELATED PROBLEMS:
 * - Maximum Product Subarray
 * - Range Sum Query - Immutable (Prefix Sum)
 * - Subarray Product Less Than K
 * - Trapping Rain Water (similar two-pass technique)
 */

// Export for testing
module.exports = {
  productExceptSelf,
  productExceptSelfIntuitive,
  productExceptSelfDivision,
};
