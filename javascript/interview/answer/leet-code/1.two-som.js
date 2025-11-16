/**
 * LeetCode #1: Two Sum
 * Difficulty: Easy
 * Topics: Array, Hash Table
 * 
 * Problem:
 * Given an array of integers nums and an integer target, 
 * return indices of the two numbers such that they add up to target.
 * 
 * You may assume that each input would have exactly one solution, 
 * and you may not use the same element twice.
 * You can return the answer in any order.
 */

// ============================================
// APPROACH 1: Brute Force
// Time Complexity: O(n²)
// Space Complexity: O(1)
// ============================================

/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSumBruteForce(nums, target) {
    // Check every pair of numbers
    for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
                return [i, j];
            }
        }
    }
    return []; // No solution found
}

// ============================================
// APPROACH 2: Hash Map (Optimized)
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Create a hash map to store value -> index mapping
    const map = new Map();
    
    // Iterate through the array once
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        // Check if complement exists in map
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        // Store current number and its index
        map.set(nums[i], i);
    }
    
    return []; // No solution found
}

// ============================================
// APPROACH 3: Hash Map with Object (Alternative)
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSumWithObject(nums, target) {
    const hashTable = {};
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (complement in hashTable) {
            return [hashTable[complement], i];
        }
        
        hashTable[nums[i]] = i;
    }
    
    return [];
}

// ============================================
// TEST CASES
// ============================================

console.log('=== Two Sum Test Cases ===\n');

// Test Case 1
const nums1 = [2, 7, 11, 15];
const target1 = 9;
console.log(`Test 1:`);
console.log(`Input: nums = [${nums1}], target = ${target1}`);
console.log(`Brute Force Output: [${twoSumBruteForce(nums1, target1)}]`);
console.log(`Optimized Output: [${twoSum(nums1, target1)}]`);
console.log(`Expected: [0, 1]`);
console.log();

// Test Case 2
const nums2 = [3, 2, 4];
const target2 = 6;
console.log(`Test 2:`);
console.log(`Input: nums = [${nums2}], target = ${target2}`);
console.log(`Brute Force Output: [${twoSumBruteForce(nums2, target2)}]`);
console.log(`Optimized Output: [${twoSum(nums2, target2)}]`);
console.log(`Expected: [1, 2]`);
console.log();

// Test Case 3
const nums3 = [3, 3];
const target3 = 6;
console.log(`Test 3:`);
console.log(`Input: nums = [${nums3}], target = ${target3}`);
console.log(`Brute Force Output: [${twoSumBruteForce(nums3, target3)}]`);
console.log(`Optimized Output: [${twoSum(nums3, target3)}]`);
console.log(`Expected: [0, 1]`);
console.log();

// Test Case 4: Negative numbers
const nums4 = [-1, -2, -3, -4, -5];
const target4 = -8;
console.log(`Test 4 (Negative numbers):`);
console.log(`Input: nums = [${nums4}], target = ${target4}`);
console.log(`Brute Force Output: [${twoSumBruteForce(nums4, target4)}]`);
console.log(`Optimized Output: [${twoSum(nums4, target4)}]`);
console.log(`Expected: [2, 4]`);
console.log();

// Test Case 5: Large array
const nums5 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const target5 = 19;
console.log(`Test 5 (Large array):`);
console.log(`Input: nums = [${nums5}], target = ${target5}`);
console.log(`Brute Force Output: [${twoSumBruteForce(nums5, target5)}]`);
console.log(`Optimized Output: [${twoSum(nums5, target5)}]`);
console.log(`Expected: [8, 9]`);
console.log();

// ============================================
// PERFORMANCE COMPARISON
// ============================================

console.log('=== Performance Comparison ===\n');

// Generate large test array
const largeNums = Array.from({ length: 10000 }, (_, i) => i + 1);
const largeTarget = 19999;

// Test Brute Force
console.time('Brute Force (10000 elements)');
twoSumBruteForce(largeNums, largeTarget);
console.timeEnd('Brute Force (10000 elements)');

// Test Optimized
console.time('Optimized (10000 elements)');
twoSum(largeNums, largeTarget);
console.timeEnd('Optimized (10000 elements)');

// ============================================
// EXPLANATION
// ============================================

console.log('\n=== Algorithm Explanation ===\n');
console.log('BRUTE FORCE APPROACH:');
console.log('- Use nested loops to check every pair');
console.log('- For each element, check if it pairs with any element after it');
console.log('- Time: O(n²) - very slow for large arrays');
console.log('- Space: O(1) - no extra space needed');
console.log();

console.log('HASH MAP APPROACH (Optimal):');
console.log('- Use a hash map to store values we\'ve seen');
console.log('- For each element, check if (target - element) exists in map');
console.log('- If yes, we found our pair!');
console.log('- If no, add current element to map and continue');
console.log('- Time: O(n) - single pass through array');
console.log('- Space: O(n) - hash map can store up to n elements');
console.log();

console.log('KEY INSIGHT:');
console.log('Instead of checking if nums[i] + nums[j] = target,');
console.log('we check if (target - nums[i]) exists in our map!');
console.log('This reduces time from O(n²) to O(n)');

// ============================================
// EDGE CASES TO CONSIDER
// ============================================

console.log('\n=== Edge Cases ===\n');
console.log('1. Array with 2 elements (minimum size)');
console.log('2. Duplicate numbers in array');
console.log('3. Negative numbers');
console.log('4. Zero in the array');
console.log('5. Target is 0');
console.log('6. Same number used twice (e.g., [3,3], target=6)');
console.log('7. No solution exists (though problem guarantees one)');

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        twoSum,
        twoSumBruteForce,
        twoSumWithObject
    };
}
