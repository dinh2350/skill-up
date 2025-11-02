/**
 * LeetCode #125: Valid Palindrome
 * Difficulty: Easy
 * Topics: String, Two Pointers
 *
 * Problem:
 * A phrase is a palindrome if, after converting all uppercase letters into
 * lowercase letters and removing all non-alphanumeric characters, it reads
 * the same forward and backward. Alphanumeric characters include letters and numbers.
 *
 * Given a string s, return true if it is a palindrome, or false otherwise.
 */

// ============================================
// APPROACH 0: Filter with Two Pointers
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindromeFilterTwoPointers(s) {
  // Create filtered string
  const filtered = s.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Use two pointers on filtered string
  let left = 0;
  let right = filtered.length - 1;

  while (left < right) {
    if (filtered[left] !== filtered[right]) {
      return false;
    }
    left++;
    right--;
  }

  return true;
}

// ============================================
// APPROACH 1: Two Pointers (Optimal)
// Time Complexity: O(n)
// Space Complexity: O(1)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    // Skip non-alphanumeric characters from left
    while (left < right && !isAlphanumeric(s[left])) {
      left++;
    }

    // Skip non-alphanumeric characters from right
    while (left < right && !isAlphanumeric(s[right])) {
      right--;
    }

    // Compare characters (case-insensitive)
    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }

    left++;
    right--;
  }

  return true;
}

// Helper function to check if character is alphanumeric
function isAlphanumeric(char) {
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122)
  ); // a-z
}

// ============================================
// APPROACH 2: Two Pointers with Regex Helper
// Time Complexity: O(n)
// Space Complexity: O(1)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindromeRegex(s) {
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    // Skip non-alphanumeric from left
    while (left < right && !/[a-zA-Z0-9]/.test(s[left])) {
      left++;
    }

    // Skip non-alphanumeric from right
    while (left < right && !/[a-zA-Z0-9]/.test(s[right])) {
      right--;
    }

    // Compare
    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }

    left++;
    right--;
  }

  return true;
}

// ============================================
// APPROACH 3: Filter and Compare
// Time Complexity: O(n)
// Space Complexity: O(n) - creates new string
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindromeFilter(s) {
  // Filter to keep only alphanumeric and convert to lowercase
  const filtered = s.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Compare with reversed version
  const reversed = filtered.split("").reverse().join("");

  return filtered === reversed;
}

// ============================================
// APPROACH 4: Filter with Two Pointers
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindromeFilterTwoPointers(s) {
  // Create filtered string
  const filtered = s.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Use two pointers on filtered string
  let left = 0;
  let right = filtered.length - 1;

  while (left < right) {
    if (filtered[left] !== filtered[right]) {
      return false;
    }
    left++;
    right--;
  }

  return true;
}

// ============================================
// APPROACH 5: Array Filter and Every
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindromeFunctional(s) {
  const chars = s
    .toLowerCase()
    .split("")
    .filter((char) => /[a-z0-9]/.test(char));

  const len = chars.length;
  return chars.every((char, i) => char === chars[len - 1 - i]);
}

// ============================================
// APPROACH 6: Recursive (for learning)
// Time Complexity: O(n)
// Space Complexity: O(n) - call stack
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindromeRecursive(s) {
  const filtered = s.toLowerCase().replace(/[^a-z0-9]/g, "");

  function helper(left, right) {
    if (left >= right) return true;
    if (filtered[left] !== filtered[right]) return false;
    return helper(left + 1, right - 1);
  }

  return helper(0, filtered.length - 1);
}

// ============================================
// TEST CASES
// ============================================

console.log("=== Valid Palindrome Test Cases ===\n");

// Helper function to test
function testPalindrome(testName, input, expected) {
  const result = isPalindrome(input);
  const passed = result === expected;

  console.log(`${testName}:`);
  console.log(`  Input:    "${input}"`);
  console.log(`  Output:   ${result}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Status:   ${passed ? "✅ PASS" : "❌ FAIL"}`);
  console.log();
}

// Test Case 1: Classic palindrome with spaces and punctuation
testPalindrome("Test 1 (Classic)", "A man, a plan, a canal: Panama", true);

// Test Case 2: Not a palindrome
testPalindrome("Test 2 (Not palindrome)", "race a car", false);

// Test Case 3: Single character
testPalindrome("Test 3 (Single char)", "a", true);

// Test Case 4: Empty string
testPalindrome("Test 4 (Empty)", " ", true);

// Test Case 5: Numbers included
testPalindrome("Test 5 (With numbers)", "A1B2C2B1A", true);

// Test Case 6: Only special characters
testPalindrome("Test 6 (Only special)", "!!!", true);

// Test Case 7: Mixed case palindrome
testPalindrome("Test 7 (Mixed case)", "RaceCar", true);

// Test Case 8: Palindrome with lots of punctuation
testPalindrome(
  "Test 8 (Heavy punctuation)",
  "Was it a car or a cat I saw?",
  true
);

// Test Case 9: Not palindrome with numbers
testPalindrome("Test 9 (Numbers not palindrome)", "0P", false);

// Test Case 10: Complex valid palindrome
testPalindrome("Test 10 (Complex)", "Madam, I'm Adam", true);

// ============================================
// COMPARE ALL APPROACHES
// ============================================

console.log("=== Testing All Approaches ===\n");

const testString = "A man, a plan, a canal: Panama";

const approaches = [
  { name: "Two Pointers (Optimal)", fn: isPalindrome },
  { name: "Two Pointers with Regex", fn: isPalindromeRegex },
  { name: "Filter and Compare", fn: isPalindromeFilter },
  { name: "Filter with Two Pointers", fn: isPalindromeFilterTwoPointers },
  { name: "Functional Approach", fn: isPalindromeFunctional },
  { name: "Recursive", fn: isPalindromeRecursive },
];

approaches.forEach((approach) => {
  const result = approach.fn(testString);
  console.log(`${approach.name}: ${result}`);
});

console.log();

// ============================================
// PERFORMANCE COMPARISON
// ============================================

console.log("=== Performance Comparison ===\n");

// Generate large test string
const largeString =
  "A".repeat(500000) +
  "B".repeat(500000).split("").reverse().join("") +
  "A".repeat(500000);

// Test Two Pointers (O(1) space)
console.time("Two Pointers (1M chars)");
isPalindrome(largeString);
console.timeEnd("Two Pointers (1M chars)");

// Test Filter approach (O(n) space)
console.time("Filter Approach (1M chars)");
isPalindromeFilter(largeString);
console.timeEnd("Filter Approach (1M chars)");

console.log();

// ============================================
// STEP-BY-STEP VISUALIZATION
// ============================================

console.log("=== Step-by-Step Visualization ===\n");

function isPalindromeVisualized(s) {
  console.log(`Input: "${s}"`);
  console.log();

  let left = 0;
  let right = s.length - 1;
  let step = 1;

  while (left < right) {
    // Skip non-alphanumeric from left
    while (left < right && !isAlphanumeric(s[left])) {
      console.log(
        `Step ${step}: Skip '${s[left]}' at index ${left} (not alphanumeric)`
      );
      left++;
      step++;
    }

    // Skip non-alphanumeric from right
    while (left < right && !isAlphanumeric(s[right])) {
      console.log(
        `Step ${step}: Skip '${s[right]}' at index ${right} (not alphanumeric)`
      );
      right--;
      step++;
    }

    if (left < right) {
      console.log(`Step ${step}:`);
      console.log(
        `  Compare: '${s[left]}' (index ${left}) with '${s[right]}' (index ${right})`
      );
      console.log(
        `  Lowercase: '${s[left].toLowerCase()}' vs '${s[right].toLowerCase()}'`
      );

      if (s[left].toLowerCase() !== s[right].toLowerCase()) {
        console.log(`  ❌ Not equal! Not a palindrome.`);
        return false;
      }

      console.log(`  ✅ Equal! Continue...`);
      console.log();

      left++;
      right--;
      step++;
    }
  }

  console.log("✅ All characters matched! It is a palindrome.");
  return true;
}

isPalindromeVisualized("A man, a plan");
console.log("\n" + "=".repeat(50) + "\n");
isPalindromeVisualized("race a car");

console.log("\n" + "=".repeat(50) + "\n");

// ============================================
// ALGORITHM EXPLANATION
// ============================================

console.log("=== Algorithm Explanation ===\n");
console.log("TWO POINTERS APPROACH (Optimal):");
console.log("1. Initialize left pointer at start, right pointer at end");
console.log("2. Skip non-alphanumeric characters from both ends");
console.log("3. Compare characters (case-insensitive)");
console.log("4. If different, return false");
console.log("5. If same, move pointers inward");
console.log("6. If pointers cross, return true (all matched)");
console.log();
console.log("Time Complexity: O(n)");
console.log("  - Single pass through the string");
console.log("  - Each character visited at most once");
console.log();
console.log("Space Complexity: O(1)");
console.log("  - Only using pointer variables");
console.log("  - No additional data structures");
console.log();

console.log("FILTER APPROACH:");
console.log("1. Filter out non-alphanumeric characters");
console.log("2. Convert to lowercase");
console.log("3. Compare with reversed version");
console.log();
console.log("Time Complexity: O(n)");
console.log("Space Complexity: O(n) - creates filtered string");
console.log();

// ============================================
// CHARACTER CHECKING METHODS
// ============================================

console.log("=== Character Checking Methods ===\n");

const testChar = "A";
console.log(`Character: '${testChar}'`);
console.log();

// Method 1: ASCII code check
const code = testChar.charCodeAt(0);
const isAlphaNum1 =
  (code >= 48 && code <= 57) ||
  (code >= 65 && code <= 90) ||
  (code >= 97 && code <= 122);
console.log(`1. ASCII check: ${isAlphaNum1}`);
console.log(`   (48-57: digits, 65-90: uppercase, 97-122: lowercase)`);

// Method 2: Regex
const isAlphaNum2 = /[a-zA-Z0-9]/.test(testChar);
console.log(`2. Regex check: ${isAlphaNum2}`);

// Method 3: Built-in methods
const isAlphaNum3 = /^[a-z0-9]$/i.test(testChar);
console.log(`3. Regex with flags: ${isAlphaNum3}`);

console.log();

// ============================================
// EDGE CASES
// ============================================

console.log("=== Edge Cases to Consider ===\n");

const edgeCases = [
  { input: "", expected: true, description: "Empty string" },
  { input: " ", expected: true, description: "Only spaces" },
  { input: "a", expected: true, description: "Single character" },
  { input: "ab", expected: false, description: "Two different chars" },
  { input: "aa", expected: true, description: "Two same chars" },
  { input: ".,", expected: true, description: "Only punctuation" },
  { input: "0P", expected: false, description: "Number and letter" },
  { input: "a.", expected: true, description: "Letter with punctuation" },
  {
    input: "A man, a plan, a canal: Panama",
    expected: true,
    description: "Classic example",
  },
  { input: "12321", expected: true, description: "Only numbers" },
];

edgeCases.forEach((testCase, index) => {
  const result = isPalindrome(testCase.input);
  const status = result === testCase.expected ? "✅" : "❌";
  console.log(`${index + 1}. ${status} ${testCase.description}`);
  console.log(
    `   Input: "${testCase.input}" → ${result} (expected: ${testCase.expected})`
  );
});

console.log();

// ============================================
// INTERVIEW TIPS
// ============================================

console.log("=== Interview Tips ===\n");
console.log("✨ Key Points to Mention:");
console.log("  1. Two-pointer technique is optimal (O(1) space)");
console.log("  2. Need to handle case-insensitivity");
console.log("  3. Must skip non-alphanumeric characters");
console.log("  4. Can use ASCII codes or regex for validation");
console.log();
console.log("🎯 What Interviewers Look For:");
console.log("  - Proper handling of edge cases");
console.log("  - Understanding of string manipulation");
console.log("  - Space-efficient solution");
console.log("  - Clean, readable code");
console.log();
console.log("⚠️  Common Mistakes to Avoid:");
console.log("  - Forgetting to skip non-alphanumeric characters");
console.log("  - Not handling case-insensitivity");
console.log("  - Creating unnecessary copies of the string");
console.log("  - Not handling empty strings or special chars");
console.log();
console.log("💡 Optimization Tips:");
console.log("  - Two pointers is more space-efficient than filter");
console.log("  - ASCII check is faster than regex for simple cases");
console.log("  - Avoid creating new strings if possible");
console.log();

// ============================================
// RELATED PROBLEMS
// ============================================

console.log("=== Related Problems ===\n");
console.log("1. Valid Palindrome II (LeetCode #680)");
console.log("   - Can delete at most one character");
console.log();
console.log("2. Palindrome Linked List (LeetCode #234)");
console.log("   - Check if linked list is palindrome");
console.log();
console.log("3. Longest Palindromic Substring (LeetCode #5)");
console.log("   - Find longest palindrome substring");
console.log();
console.log("4. Palindrome Number (LeetCode #9)");
console.log("   - Check if integer is palindrome");
console.log();

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isPalindrome,
    isPalindromeRegex,
    isPalindromeFilter,
    isPalindromeFilterTwoPointers,
    isPalindromeFunctional,
    isPalindromeRecursive,
    isAlphanumeric,
  };
}
