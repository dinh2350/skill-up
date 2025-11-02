/**
 * Group Anagrams - LeetCode Problem
 * Difficulty: Medium
 *
 * Problem: Given an array of strings strs, group the anagrams together.
 * You can return the answer in any order.
 *
 * An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase,
 * typically using all the original letters exactly once.
 *
 * Example 1:
 * Input: strs = ["eat","tea","tan","ate","nat","bat"]
 * Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
 *
 * Example 2:
 * Input: strs = [""]
 * Output: [[""]]
 *
 * Example 3:
 * Input: strs = ["a"]
 * Output: [["a"]]
 */

/**
 * APPROACH 1: Sorted String as Key (MOST COMMON)
 *
 * Key Insights:
 * 1. Anagrams have the same characters, just rearranged
 * 2. If we sort the characters, anagrams become identical
 * 3. Use sorted string as key in hash map
 * 4. Group words with same sorted key together
 *
 * Time Complexity: O(n * k log k)
 * - n = number of strings
 * - k = max length of a string
 * - Sorting each string: O(k log k)
 * - Processing n strings: O(n * k log k)
 *
 * Space Complexity: O(n * k)
 * - Storing all strings in hash map
 */

/**
 * @param {string[]} strs
 * @return {string[][]}
 */
function groupAnagrams(strs) {
  // Map to store sorted string as key, and array of anagrams as value
  const anagramMap = new Map();

  for (const str of strs) {
    // Sort the string to create a key
    // Anagrams will have the same sorted key
    const sortedStr = str.split("").sort().join("");

    // If key doesn't exist, create new array
    if (!anagramMap.has(sortedStr)) {
      anagramMap.set(sortedStr, []);
    }

    // Add current string to its anagram group
    anagramMap.get(sortedStr).push(str);
  }

  // Convert map values to array
  return Array.from(anagramMap.values());
}

// ============================================================================
// APPROACH 2: Character Count as Key (OPTIMAL)
// ============================================================================

/**
 * Using character frequency count instead of sorting
 * More efficient for longer strings
 *
 * Key Insight:
 * - Anagrams have same character frequencies
 * - Create a unique key based on character counts
 * - Example: "aab" → "a2b1" or [2,1,0,0,...] (26 positions for a-z)
 *
 * Time Complexity: O(n * k)
 * - n = number of strings
 * - k = max length of string
 * - No sorting needed!
 *
 * Space Complexity: O(n * k)
 */
function groupAnagramsOptimized(strs) {
  const anagramMap = new Map();

  for (const str of strs) {
    // Create character count array (26 letters)
    const count = new Array(26).fill(0);

    // Count frequency of each character
    for (const char of str) {
      count[char.charCodeAt(0) - "a".charCodeAt(0)]++;
    }

    // Convert count array to string key
    // Example: [1,0,1,...] → "1#0#1#..."
    const key = count.join("#");

    if (!anagramMap.has(key)) {
      anagramMap.set(key, []);
    }

    anagramMap.get(key).push(str);
  }

  return Array.from(anagramMap.values());
}

// ============================================================================
// APPROACH 3: Prime Number Product (CREATIVE)
// ============================================================================

/**
 * Assign each letter a prime number, multiply them
 * Anagrams will have same product (unique factorization)
 *
 * Pros: Very fast, O(n * k)
 * Cons: Can overflow for long strings, not recommended for production
 *
 * Time Complexity: O(n * k)
 * Space Complexity: O(n * k)
 */
function groupAnagramsPrime(strs) {
  // First 26 prime numbers for a-z
  const primes = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
    73, 79, 83, 89, 97, 101,
  ];

  const anagramMap = new Map();

  for (const str of strs) {
    // Calculate product of prime numbers
    let product = 1;
    for (const char of str) {
      product *= primes[char.charCodeAt(0) - "a".charCodeAt(0)];
    }

    const key = product.toString();

    if (!anagramMap.has(key)) {
      anagramMap.set(key, []);
    }

    anagramMap.get(key).push(str);
  }

  return Array.from(anagramMap.values());
}

// ============================================================================
// APPROACH 4: Using Object Instead of Map
// ============================================================================

/**
 * JavaScript object as hash table
 * Slightly different syntax, same logic
 */
function groupAnagramsObject(strs) {
  const anagramObj = {};

  for (const str of strs) {
    const sortedStr = str.split("").sort().join("");

    if (!anagramObj[sortedStr]) {
      anagramObj[sortedStr] = [];
    }

    anagramObj[sortedStr].push(str);
  }

  return Object.values(anagramObj);
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log("Test Case 1:");
console.log('Input: ["eat","tea","tan","ate","nat","bat"]');
console.log(
  "Output:",
  JSON.stringify(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
);
console.log(
  'Expected: [["eat","tea","ate"],["tan","nat"],["bat"]] (order may vary)'
);
console.log();

console.log("Test Case 2:");
console.log('Input: [""]');
console.log("Output:", JSON.stringify(groupAnagrams([""])));
console.log('Expected: [[""]]');
console.log();

console.log("Test Case 3:");
console.log('Input: ["a"]');
console.log("Output:", JSON.stringify(groupAnagrams(["a"])));
console.log('Expected: [["a"]]');
console.log();

console.log("Test Case 4:");
console.log('Input: ["abc","bca","cab","xyz","zyx","yxz"]');
console.log(
  "Output:",
  JSON.stringify(groupAnagrams(["abc", "bca", "cab", "xyz", "zyx", "yxz"]))
);
console.log('Expected: [["abc","bca","cab"],["xyz","zyx","yxz"]]');
console.log();

console.log("Test Case 5:");
console.log('Input: ["a","b","a"]');
console.log("Output:", JSON.stringify(groupAnagrams(["a", "b", "a"])));
console.log('Expected: [["a","a"],["b"]]');
console.log();

// Compare different approaches
console.log("Comparing Approaches:");
console.log(
  "Sorted Key:",
  JSON.stringify(groupAnagrams(["eat", "tea", "tan"]))
);
console.log(
  "Count Key:",
  JSON.stringify(groupAnagramsOptimized(["eat", "tea", "tan"]))
);
console.log(
  "Prime Key:",
  JSON.stringify(groupAnagramsPrime(["eat", "tea", "tan"]))
);
console.log(
  "Object:",
  JSON.stringify(groupAnagramsObject(["eat", "tea", "tan"]))
);
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * STEP-BY-STEP WALKTHROUGH:
 *
 * Example: strs = ["eat","tea","tan","ate","nat","bat"]
 *
 * APPROACH 1: Sorted String as Key
 *
 * Initial State:
 * anagramMap = {}
 *
 * Process "eat":
 *   sortedStr = "aet"
 *   anagramMap = { "aet": ["eat"] }
 *
 * Process "tea":
 *   sortedStr = "aet" (same as "eat"!)
 *   anagramMap = { "aet": ["eat", "tea"] }
 *
 * Process "tan":
 *   sortedStr = "ant"
 *   anagramMap = { "aet": ["eat", "tea"], "ant": ["tan"] }
 *
 * Process "ate":
 *   sortedStr = "aet" (same group as "eat" and "tea")
 *   anagramMap = { "aet": ["eat", "tea", "ate"], "ant": ["tan"] }
 *
 * Process "nat":
 *   sortedStr = "ant" (same as "tan")
 *   anagramMap = { "aet": ["eat", "tea", "ate"], "ant": ["tan", "nat"] }
 *
 * Process "bat":
 *   sortedStr = "abt"
 *   anagramMap = { "aet": ["eat", "tea", "ate"], "ant": ["tan", "nat"], "abt": ["bat"] }
 *
 * Final Result:
 * [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]
 */

/**
 * APPROACH 2 WALKTHROUGH: Character Count as Key
 *
 * Example: "eat"
 *
 * Character count array (26 positions for a-z):
 * a b c d e f g h i j k l m n o p q r s t u v w x y z
 * 1 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0
 *
 * Key: "1#0#0#0#1#0#0#0#0#0#0#0#0#0#0#0#0#0#0#1#0#0#0#0#0#0"
 *
 * Example: "tea"
 * Same character counts → Same key!
 *
 * Example: "tan"
 * a b c d e f g h i j k l m n o p q r s t u v w x y z
 * 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0
 *
 * Different key → Different group
 */

/**
 * VISUAL REPRESENTATION:
 *
 * Input: ["eat","tea","tan","ate","nat","bat"]
 *
 * After sorting each word:
 * "eat" → "aet"
 * "tea" → "aet"  ← Same!
 * "tan" → "ant"
 * "ate" → "aet"  ← Same!
 * "nat" → "ant"  ← Same!
 * "bat" → "abt"
 *
 * Grouping:
 * "aet": ["eat", "tea", "ate"]
 * "ant": ["tan", "nat"]
 * "abt": ["bat"]
 */

/**
 * COMPLEXITY ANALYSIS COMPARISON:
 *
 * APPROACH 1: Sorted String
 * Time: O(n * k log k) - sorting dominates
 * Space: O(n * k)
 * Pros: Simple, intuitive
 * Cons: Slower for long strings
 *
 * APPROACH 2: Character Count
 * Time: O(n * k) - just counting
 * Space: O(n * k)
 * Pros: Fastest, no sorting
 * Cons: Only works for lowercase letters (can be adapted)
 *
 * APPROACH 3: Prime Product
 * Time: O(n * k)
 * Space: O(n * k)
 * Pros: Creative, fast
 * Cons: Can overflow, not reliable
 *
 * RECOMMENDED: Approach 1 for simplicity, Approach 2 for optimization
 */

/**
 * WHY ANAGRAMS WORK AS HASH KEYS:
 *
 * Definition: Anagrams have the same characters with same frequencies
 *
 * Examples of anagrams:
 * ✓ "listen" and "silent"
 * ✓ "evil" and "vile"
 * ✓ "a gentleman" and "elegant man"
 *
 * Not anagrams:
 * ✗ "hello" and "world" (different characters)
 * ✗ "aab" and "abb" (different frequencies)
 *
 * When sorted, anagrams become identical:
 * "listen" → "eilnst"
 * "silent" → "eilnst"  ← Same!
 *
 * This property makes them perfect for hash map keys
 */

/**
 * KEY INSIGHTS:
 *
 * 1. HASH MAP FOR GROUPING:
 *    - Key: Characteristic that's same for all anagrams
 *    - Value: Array of strings belonging to that group
 *
 * 2. CHOOSING THE RIGHT KEY:
 *    - Sorted string: Simple and reliable
 *    - Character count: More efficient
 *    - Must be unique for each anagram group
 *
 * 3. ORDER DOESN'T MATTER:
 *    - Output can be in any order
 *    - Groups can be in any order
 *    - Words within groups can be in any order
 *
 * 4. EDGE CASES:
 *    - Empty strings are valid
 *    - Single character strings
 *    - All strings are anagrams of each other
 *    - No anagrams at all
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * 1. ❌ Not handling empty strings
 *    - Empty string is a valid input
 *
 * 2. ❌ Assuming specific output order
 *    - Problem says "in any order"
 *    - Don't hardcode expected order in tests
 *
 * 3. ❌ Modifying original strings
 *    - Always work with copies when sorting
 *    - Use split('').sort().join('')
 *
 * 4. ❌ Using wrong data structure
 *    - Array for grouping: O(n²) lookup
 *    - Hash Map: O(1) lookup ✓
 *
 * 5. ❌ Overthinking the key generation
 *    - Sorted string is simple and works
 *    - Don't need complex algorithms
 *
 * 6. ❌ Not initializing array for new keys
 *    - Check if key exists before pushing
 */

/**
 * INTERVIEW TIPS:
 *
 * 1. Start with brute force:
 *    "I could compare each string with every other string to check if they're anagrams"
 *    "That would be O(n²) which is not optimal"
 *
 * 2. Explain optimization:
 *    "If I sort each string, anagrams become identical"
 *    "I can use a hash map to group them efficiently"
 *
 * 3. Discuss time complexity:
 *    "Sorting each string is O(k log k)"
 *    "Processing n strings makes it O(n * k log k)"
 *
 * 4. Mention optimization:
 *    "For even better performance, I could use character counting"
 *    "This would reduce time to O(n * k)"
 *
 * 5. Handle edge cases:
 *    "What if the array is empty?"
 *    "What about empty strings or single characters?"
 */

/**
 * RELATED PROBLEMS:
 * - Valid Anagram
 * - Find All Anagrams in a String
 * - Anagram Mappings
 * - Group Shifted Strings
 */

// Export for testing
module.exports = {
  groupAnagrams,
  groupAnagramsOptimized,
  groupAnagramsPrime,
  groupAnagramsObject,
};
