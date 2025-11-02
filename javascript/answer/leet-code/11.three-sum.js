/**
 * Three Sum - LeetCode Problem
 * Difficulty: Medium
 *
 * Problem: Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]]
 * such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.
 *
 * Example 1:
 * Input: nums = [-1,0,1,2,-1,-4]
 * Output: [[-1,-1,2],[-1,0,1]]
 *
 * Example 2:
 * Input: nums = [0,1,1]
 * Output: []
 *
 * Example 3:
 * Input: nums = [0,0,0]
 * Output: [[0,0,0]]
 */

/**
 * APPROACH: Sorting + Two Pointers
 *
 * Key Insights:
 * 1. Sorting helps us avoid duplicates and use two-pointer technique
 * 2. Fix one element and find two other elements that sum to -element
 * 3. Use two pointers (left, right) to find the pair efficiently
 * 4. Skip duplicates to avoid duplicate triplets
 *
 * Time Complexity: O(n²)
 * - Sorting: O(n log n)
 * - Outer loop: O(n)
 * - Inner two-pointer search: O(n)
 * - Overall: O(n log n) + O(n²) = O(n²)
 *
 * Space Complexity: O(1) or O(n)
 * - O(1) if we don't count the output array
 * - O(n) for the space used by sorting (depends on sort implementation)
 */

/**
 * @param {number[]} nums
 * @return {number[][]}
 */
function threeSum(nums) {
  const result = [];

  // Edge case: array too small
  if (nums.length < 3) {
    return result;
  }

  // Step 1: Sort the array
  // Sorting helps us:
  // - Use two-pointer technique
  // - Skip duplicates easily
  // - Early termination when number is positive
  nums.sort((a, b) => a - b);

  // Step 2: Iterate through array with first pointer
  for (let i = 0; i < nums.length - 2; i++) {
    // Optimization: if current number is positive,
    // no way to get sum of 0 (since array is sorted)
    if (nums[i] > 0) {
      break;
    }

    // Skip duplicates for first element
    // We check i > 0 to avoid skipping the first element
    if (i > 0 && nums[i] === nums[i - 1]) {
      continue;
    }

    // Step 3: Use two pointers to find the other two numbers
    let left = i + 1;
    let right = nums.length - 1;

    // We need to find: nums[left] + nums[right] = -nums[i]
    const target = -nums[i];

    while (left < right) {
      const sum = nums[left] + nums[right];

      if (sum === target) {
        // Found a valid triplet
        result.push([nums[i], nums[left], nums[right]]);

        // Skip duplicates for left pointer
        while (left < right && nums[left] === nums[left + 1]) {
          left++;
        }

        // Skip duplicates for right pointer
        while (left < right && nums[right] === nums[right - 1]) {
          right--;
        }

        // Move both pointers
        left++;
        right--;
      } else if (sum < target) {
        // Sum is too small, move left pointer to increase sum
        left++;
      } else {
        // Sum is too large, move right pointer to decrease sum
        right--;
      }
    }
  }

  return result;
}

// ============================================================================
// ALTERNATIVE APPROACH: Using HashSet (Less Efficient)
// ============================================================================

/**
 * Alternative approach using HashSet
 * This is less efficient but helps understand the problem
 *
 * Time Complexity: O(n²)
 * Space Complexity: O(n) for the set
 *
 * Note: This approach is harder to avoid duplicates, so we still need sorting
 * or use a Set to store unique triplets (which adds complexity)
 */
function threeSumHashSet(nums) {
  const result = [];
  nums.sort((a, b) => a - b);

  for (let i = 0; i < nums.length - 2; i++) {
    // Skip duplicates for first element
    if (i > 0 && nums[i] === nums[i - 1]) {
      continue;
    }

    const seen = new Set();

    for (let j = i + 1; j < nums.length; j++) {
      const complement = -nums[i] - nums[j];

      if (seen.has(complement)) {
        result.push([nums[i], complement, nums[j]]);

        // Skip duplicates for second element
        while (j + 1 < nums.length && nums[j] === nums[j + 1]) {
          j++;
        }
      }

      seen.add(nums[j]);
    }
  }

  return result;
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log("Test Case 1:");
console.log("Input: [-1,0,1,2,-1,-4]");
console.log("Output:", JSON.stringify(threeSum([-1, 0, 1, 2, -1, -4])));
console.log("Expected: [[-1,-1,2],[-1,0,1]]");
console.log();

console.log("Test Case 2:");
console.log("Input: [0,1,1]");
console.log("Output:", JSON.stringify(threeSum([0, 1, 1])));
console.log("Expected: []");
console.log();

console.log("Test Case 3:");
console.log("Input: [0,0,0]");
console.log("Output:", JSON.stringify(threeSum([0, 0, 0])));
console.log("Expected: [[0,0,0]]");
console.log();

console.log("Test Case 4:");
console.log("Input: [-2,0,0,2,2]");
console.log("Output:", JSON.stringify(threeSum([-2, 0, 0, 2, 2])));
console.log("Expected: [[-2,0,2]]");
console.log();

console.log("Test Case 5:");
console.log("Input: [-4,-1,-1,0,1,2]");
console.log("Output:", JSON.stringify(threeSum([-4, -1, -1, 0, 1, 2])));
console.log("Expected: [[-1,-1,2],[-1,0,1]]");
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * STEP-BY-STEP WALKTHROUGH:
 *
 * Example: nums = [-1, 0, 1, 2, -1, -4]
 *
 * Step 1: Sort the array
 * Sorted: [-4, -1, -1, 0, 1, 2]
 *
 * Step 2: Iterate with first pointer (i)
 *
 * Iteration 1: i = 0, nums[i] = -4
 *   target = 4 (need to find two numbers that sum to 4)
 *   left = 1, right = 5
 *
 *   Check: nums[1] + nums[5] = -1 + 2 = 1 < 4 → move left
 *   Check: nums[2] + nums[5] = -1 + 2 = 1 < 4 → move left
 *   Check: nums[3] + nums[5] = 0 + 2 = 2 < 4 → move left
 *   Check: nums[4] + nums[5] = 1 + 2 = 3 < 4 → move left
 *   left >= right, no triplet found
 *
 * Iteration 2: i = 1, nums[i] = -1
 *   target = 1 (need to find two numbers that sum to 1)
 *   left = 2, right = 5
 *
 *   Check: nums[2] + nums[5] = -1 + 2 = 1 ✓ Found! [-1, -1, 2]
 *   Skip duplicates and move both pointers
 *   left = 3, right = 4
 *
 *   Check: nums[3] + nums[4] = 0 + 1 = 1 ✓ Found! [-1, 0, 1]
 *   Move both pointers
 *   left >= right, done
 *
 * Iteration 3: i = 2, nums[i] = -1
 *   This is a duplicate of previous iteration, skip!
 *
 * Iteration 4: i = 3, nums[i] = 0
 *   target = 0 (need to find two numbers that sum to 0)
 *   left = 4, right = 5
 *
 *   Check: nums[4] + nums[5] = 1 + 2 = 3 > 0 → move right
 *   left >= right, no more pairs
 *
 * Result: [[-1, -1, 2], [-1, 0, 1]]
 */

/**
 * KEY INSIGHTS FOR AVOIDING DUPLICATES:
 *
 * 1. Sorting is crucial - it allows us to skip adjacent duplicates
 *
 * 2. Skip duplicates at THREE levels:
 *    - First element (i): if (i > 0 && nums[i] === nums[i-1]) continue
 *    - Left pointer: while (left < right && nums[left] === nums[left+1]) left++
 *    - Right pointer: while (left < right && nums[right] === nums[right-1]) right--
 *
 * 3. Why we check i > 0 for skipping first element:
 *    - We compare with previous element (i-1)
 *    - Don't want to skip the very first element
 *
 * 4. After finding a valid triplet, we must move BOTH pointers
 *    - If we only move one, we might find duplicates
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * 1. ❌ Not sorting the array first
 *    - Two-pointer technique only works on sorted arrays
 *
 * 2. ❌ Not skipping duplicates properly
 *    - Results in duplicate triplets in output
 *
 * 3. ❌ Not moving both pointers after finding a match
 *    - Can cause infinite loops or duplicate results
 *
 * 4. ❌ Wrong boundary checks
 *    - i should go up to length - 2 (need space for two more elements)
 *    - Always ensure left < right
 *
 * 5. ❌ Trying to use three nested loops
 *    - O(n³) time complexity, not optimal
 */

// Export for testing
module.exports = { threeSum, threeSumHashSet };
