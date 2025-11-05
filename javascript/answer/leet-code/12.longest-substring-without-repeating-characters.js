/**
 * Longest Substring Without Repeating Characters - LeetCode Problem
 * Difficulty: Medium
 *
 * Problem: Given a string s, find the length of the longest substring without repeating characters.
 *
 * Example 1:
 * Input: s = "abcabcbb"
 * Output: 3
 * Explanation: The answer is "abc", with the length of 3.
 *
 * Example 2:
 * Input: s = "bbbbb"
 * Output: 1
 * Explanation: The answer is "b", with the length of 1.
 *
 * Example 3:
 * Input: s = "pwwkew"
 * Output: 3
 * Explanation: The answer is "wke", with the length of 3.
 * Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.
 */

/**
 * APPROACH 1: Sliding Window + Hash Map (OPTIMAL)
 *
 * Key Insights:
 * 1. Use a sliding window with two pointers (left and right)
 * 2. Expand window by moving right pointer
 * 3. When duplicate found, shrink window by moving left pointer
 * 4. Track characters and their indices in a hash map
 * 5. Update max length at each step
 *
 * Time Complexity: O(n) - each character visited at most twice
 * Space Complexity: O(min(m, n)) where m is charset size, n is string length
 */

/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // Map to store character and its most recent index
  const charIndexMap = new Map();

  let maxLength = 0;
  let left = 0; // Left boundary of sliding window

  // Right pointer expands the window
  for (let right = 0; right < s.length; right++) {
    const currentChar = s[right];

    // If character already exists in current window
    // Move left pointer to skip the duplicate
    if (charIndexMap.has(currentChar)) {
      // Important: only move forward, never backward
      // Example: "abcbcdbb" - when we see second 'a', left should not go back
      left = Math.max(left, charIndexMap.get(currentChar) + 1);
    }

    // Update character's latest index
    charIndexMap.set(currentChar, right);

    // Calculate current window size and update max
    const currentLength = right - left + 1;
    maxLength = Math.max(maxLength, currentLength);
  }

  return maxLength;
}

// ============================================================================
// APPROACH 2: Sliding Window + Set (Alternative)
// ============================================================================

/**
 * Using Set instead of Map
 * More intuitive but slightly less efficient
 *
 * Time Complexity: O(2n) = O(n) - worst case each char visited twice
 * Space Complexity: O(min(m, n))
 */
function lengthOfLongestSubstringSet(s) {
  const charSet = new Set();

  let maxLength = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const currentChar = s[right];

    // While duplicate exists, remove from left
    while (charSet.has(currentChar)) {
      charSet.delete(s[left]);
      left++;
    }

    // Add current character
    charSet.add(currentChar);

    // Update max length
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

// ============================================================================
// APPROACH 3: Optimized with Character Array (for ASCII)
// ============================================================================

/**
 * Using array instead of Map for ASCII characters
 * Faster for ASCII-only strings
 *
 * Time Complexity: O(n)
 * Space Complexity: O(1) - fixed size array of 128 or 256
 */
function lengthOfLongestSubstringArray(s) {
  // Array to store last index of each ASCII character
  // Initialize with -1 (not seen yet)
  const charIndex = new Array(128).fill(-1);

  let maxLength = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const charCode = s.charCodeAt(right);

    // If character seen before and within current window
    if (charIndex[charCode] >= left) {
      left = charIndex[charCode] + 1;
    }

    // Update character's latest index
    charIndex[charCode] = right;

    // Update max length
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log("Test Case 1:");
console.log('Input: "abcabcbb"');
console.log("Output:", lengthOfLongestSubstring("abcabcbb"));
console.log('Expected: 3 (substring "abc")');
console.log();

console.log("Test Case 2:");
console.log('Input: "bbbbb"');
console.log("Output:", lengthOfLongestSubstring("bbbbb"));
console.log('Expected: 1 (substring "b")');
console.log();

console.log("Test Case 3:");
console.log('Input: "pwwkew"');
console.log("Output:", lengthOfLongestSubstring("pwwkew"));
console.log('Expected: 3 (substring "wke")');
console.log();

console.log("Test Case 4:");
console.log('Input: "" (empty string)');
console.log("Output:", lengthOfLongestSubstring(""));
console.log("Expected: 0");
console.log();

console.log("Test Case 5:");
console.log('Input: " " (single space)');
console.log("Output:", lengthOfLongestSubstring(" "));
console.log("Expected: 1");
console.log();

console.log("Test Case 6:");
console.log('Input: "abba"');
console.log("Output:", lengthOfLongestSubstring("abba"));
console.log('Expected: 2 (substring "ab" or "ba")');
console.log();

console.log("Test Case 7:");
console.log('Input: "dvdf"');
console.log("Output:", lengthOfLongestSubstring("dvdf"));
console.log('Expected: 3 (substring "vdf")');
console.log();

console.log("Test Case 8:");
console.log('Input: "tmmzuxt"');
console.log("Output:", lengthOfLongestSubstring("tmmzuxt"));
console.log('Expected: 5 (substring "mzuxt")');
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * STEP-BY-STEP WALKTHROUGH:
 *
 * Example: s = "abcabcbb"
 *
 * Goal: Find longest substring without repeating characters
 *
 * Initial State:
 * - charIndexMap = {}
 * - maxLength = 0
 * - left = 0
 *
 * Step-by-step execution:
 *
 * right=0, char='a':
 *   - 'a' not in map
 *   - Add: charIndexMap = {a: 0}
 *   - Window: "a", length=1
 *   - maxLength = 1
 *
 * right=1, char='b':
 *   - 'b' not in map
 *   - Add: charIndexMap = {a: 0, b: 1}
 *   - Window: "ab", length=2
 *   - maxLength = 2
 *
 * right=2, char='c':
 *   - 'c' not in map
 *   - Add: charIndexMap = {a: 0, b: 1, c: 2}
 *   - Window: "abc", length=3
 *   - maxLength = 3
 *
 * right=3, char='a':
 *   - 'a' found at index 0!
 *   - Move left to: 0 + 1 = 1
 *   - Update: charIndexMap = {a: 3, b: 1, c: 2}
 *   - Window: "bca", length=3
 *   - maxLength = 3 (unchanged)
 *
 * right=4, char='b':
 *   - 'b' found at index 1!
 *   - Move left to: max(1, 1+1) = 2
 *   - Update: charIndexMap = {a: 3, b: 4, c: 2}
 *   - Window: "cab", length=3
 *   - maxLength = 3
 *
 * right=5, char='c':
 *   - 'c' found at index 2!
 *   - Move left to: max(2, 2+1) = 3
 *   - Update: charIndexMap = {a: 3, b: 4, c: 5}
 *   - Window: "abc", length=3
 *   - maxLength = 3
 *
 * right=6, char='b':
 *   - 'b' found at index 4!
 *   - Move left to: max(3, 4+1) = 5
 *   - Update: charIndexMap = {a: 3, b: 6, c: 5}
 *   - Window: "cb", length=2
 *   - maxLength = 3
 *
 * right=7, char='b':
 *   - 'b' found at index 6!
 *   - Move left to: max(5, 6+1) = 7
 *   - Update: charIndexMap = {a: 3, b: 7, c: 5}
 *   - Window: "b", length=1
 *   - maxLength = 3
 *
 * Final Answer: 3
 */

/**
 * VISUAL REPRESENTATION OF SLIDING WINDOW:
 *
 * String: "abcabcbb"
 * Indices: 0123456789
 *
 * Step 1-3: [abc]abcbb     maxLen=3
 * Step 4:   a[bca]bcbb     maxLen=3 (duplicate 'a')
 * Step 5:   ab[cab]cbb     maxLen=3 (duplicate 'b')
 * Step 6:   abc[abc]bb     maxLen=3 (duplicate 'c')
 * Step 7:   abcab[cb]b     maxLen=3 (duplicate 'b')
 * Step 8:   abcabc[b]b     maxLen=3 (duplicate 'b')
 *
 * The window slides and shrinks when duplicates are found
 */

/**
 * WHY USE Math.max(left, charIndexMap.get(currentChar) + 1)?
 *
 * Example: "abba"
 *
 * right=0, char='a': charIndexMap={a:0}, left=0, window="a"
 * right=1, char='b': charIndexMap={a:0,b:1}, left=0, window="ab"
 * right=2, char='b': charIndexMap={a:0,b:2}, left=2, window="b"
 * right=3, char='a': charIndexMap={a:3,b:2}, left=?
 *
 * Without Math.max:
 *   left = charIndexMap.get('a') + 1 = 0 + 1 = 1
 *   This would move left BACKWARD from 2 to 1! ❌
 *   Window would incorrectly be "bba" with duplicate 'b'
 *
 * With Math.max:
 *   left = Math.max(2, 0 + 1) = 2 ✓
 *   Window stays "ba", no duplicates
 *
 * Rule: Left pointer should only move FORWARD, never backward!
 */

/**
 * COMPARISON: Map vs Set Approach
 *
 * Map Approach:
 * ✓ O(n) time - single pass
 * ✓ Direct jump to skip duplicates
 * ✓ More efficient
 * ✗ Slightly more complex logic
 *
 * Set Approach:
 * ✓ More intuitive
 * ✓ Easier to understand
 * ✗ O(2n) time - may visit chars twice
 * ✗ Must remove chars one by one
 *
 * Both are acceptable, Map is slightly better
 */

/**
 * KEY INSIGHTS:
 *
 * 1. SLIDING WINDOW TECHNIQUE:
 *    - Two pointers define a window
 *    - Expand window by moving right pointer
 *    - Shrink window when constraint violated (duplicate found)
 *
 * 2. HASH MAP FOR TRACKING:
 *    - Store character positions for O(1) lookup
 *    - Helps determine where to move left pointer
 *
 * 3. GREEDY APPROACH:
 *    - Always try to maximize window size
 *    - Only shrink when necessary (duplicate found)
 *
 * 4. SUBSTRING vs SUBSEQUENCE:
 *    - Substring: continuous characters
 *    - Subsequence: can skip characters
 *    - This problem requires SUBSTRING (continuous)
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * 1. ❌ Moving left pointer backward
 *    - Always use Math.max to ensure forward movement
 *
 * 2. ❌ Forgetting to update character index after moving left
 *    - Always update map with latest position
 *
 * 3. ❌ Confusing substring with subsequence
 *    - Must be continuous characters
 *
 * 4. ❌ Not handling edge cases
 *    - Empty string: return 0
 *    - Single character: return 1
 *    - All same characters: return 1
 *
 * 5. ❌ Using nested loops (brute force)
 *    - O(n³) or O(n²) is too slow
 *    - Sliding window achieves O(n)
 */

/**
 * RELATED PROBLEMS:
 * - Longest Substring with At Most K Distinct Characters
 * - Longest Repeating Character Replacement
 * - Minimum Window Substring
 * - Permutation in String
 */

// Export for testing
module.exports = {
  lengthOfLongestSubstring,
  lengthOfLongestSubstringSet,
  lengthOfLongestSubstringArray,
};
