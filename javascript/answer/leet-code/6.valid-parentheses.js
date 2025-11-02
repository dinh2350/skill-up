/**
 * LeetCode #20: Valid Parentheses
 * Difficulty: Easy
 * Topics: Stack, String
 *
 * Problem:
 * Given a string s containing just the characters '(', ')', '{', '}', '[' and ']',
 * determine if the input string is valid.
 *
 * An input string is valid if:
 * 1. Open brackets must be closed by the same type of brackets.
 * 2. Open brackets must be closed in the correct order.
 * 3. Every close bracket has a corresponding open bracket of the same type.
 */

// ============================================
// APPROACH 1: Stack with HashMap (Optimal)
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Early return for odd length strings
  if (s.length % 2 !== 0) return false;

  const stack = [];
  const pairs = {
    ")": "(",
    "}": "{",
    "]": "[",
  };

  for (const char of s) {
    // If it's a closing bracket
    if (char in pairs) {
      // Check if stack is empty or top doesn't match
      if (stack.length === 0 || stack[stack.length - 1] !== pairs[char]) {
        return false;
      }
      stack.pop(); // Remove matching opening bracket
    } else {
      // It's an opening bracket, push to stack
      stack.push(char);
    }
  }

  // Valid if stack is empty (all brackets matched)
  return stack.length === 0;
}

// ============================================
// APPROACH 2: Stack with Switch Statement
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isValidSwitch(s) {
  if (s.length % 2 !== 0) return false;

  const stack = [];

  for (const char of s) {
    switch (char) {
      case "(":
      case "{":
      case "[":
        stack.push(char);
        break;
      case ")":
        if (stack.pop() !== "(") return false;
        break;
      case "}":
        if (stack.pop() !== "{") return false;
        break;
      case "]":
        if (stack.pop() !== "[") return false;
        break;
    }
  }

  return stack.length === 0;
}

// ============================================
// APPROACH 3: Stack with Helper Function
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isValidHelper(s) {
  if (s.length % 2 !== 0) return false;

  const stack = [];

  const isOpening = (char) => char === "(" || char === "{" || char === "[";
  const matches = (open, close) => {
    return (
      (open === "(" && close === ")") ||
      (open === "{" && close === "}") ||
      (open === "[" && close === "]")
    );
  };

  for (const char of s) {
    if (isOpening(char)) {
      stack.push(char);
    } else {
      if (stack.length === 0 || !matches(stack.pop(), char)) {
        return false;
      }
    }
  }

  return stack.length === 0;
}

// ============================================
// APPROACH 4: Replace Method (Not Recommended)
// Time Complexity: O(n²)
// Space Complexity: O(n)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isValidReplace(s) {
  if (s.length % 2 !== 0) return false;

  // Keep replacing valid pairs until no more can be replaced
  let prev = "";
  while (prev !== s) {
    prev = s;
    s = s.replace("()", "");
    s = s.replace("{}", "");
    s = s.replace("[]", "");
  }

  return s.length === 0;
}

// ============================================
// APPROACH 5: Array as Stack (Explicit)
// Time Complexity: O(n)
// Space Complexity: O(n)
// ============================================

/**
 * @param {string} s
 * @return {boolean}
 */
function isValidArray(s) {
  if (s.length % 2 !== 0) return false;

  const stack = [];
  const opening = new Set(["(", "{", "["]);
  const closing = new Map([
    [")", "("],
    ["}", "{"],
    ["]", "["],
  ]);

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    if (opening.has(char)) {
      stack.push(char);
    } else if (closing.has(char)) {
      if (stack.length === 0) return false;
      const top = stack.pop();
      if (top !== closing.get(char)) return false;
    }
  }

  return stack.length === 0;
}

// ============================================
// TEST CASES
// ============================================

console.log("=== Valid Parentheses Test Cases ===\n");

function testValidParentheses(testName, input, expected) {
  const result = isValid(input);
  const passed = result === expected;

  console.log(`${testName}:`);
  console.log(`  Input:    "${input}"`);
  console.log(`  Output:   ${result}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Status:   ${passed ? "✅ PASS" : "❌ FAIL"}`);
  console.log();
}

// Test Case 1: All types valid
testValidParentheses("Test 1 (All types)", "()[]{}", true);

// Test Case 2: Wrong order
testValidParentheses("Test 2 (Wrong order)", "(]", false);

// Test Case 3: Nested valid
testValidParentheses("Test 3 (Nested)", "{[()]}", true);

// Test Case 4: Only opening
testValidParentheses("Test 4 (Only opening)", "((((", false);

// Test Case 5: Only closing
testValidParentheses("Test 5 (Only closing)", "))))", false);

// Test Case 6: Mixed nested
testValidParentheses("Test 6 (Complex nested)", "{[()()]}", true);

// Test Case 7: Wrong closing order
testValidParentheses("Test 7 (Wrong closing)", "([)]", false);

// Test Case 8: Single pair
testValidParentheses("Test 8 (Single pair)", "()", true);

// Test Case 9: Empty string
testValidParentheses("Test 9 (Empty)", "", true);

// Test Case 10: Multiple same type
testValidParentheses("Test 10 (Multiple same)", "(())", true);

// Test Case 11: Interleaved
testValidParentheses("Test 11 (Interleaved)", "(){}[]", true);

// Test Case 12: Wrong type closing
testValidParentheses("Test 12 (Wrong type)", "(}", false);

// ============================================
// COMPARE ALL APPROACHES
// ============================================

console.log("=== Testing All Approaches ===\n");

const testString = "{[()()]}";

const approaches = [
  { name: "Stack with HashMap", fn: isValid },
  { name: "Stack with Switch", fn: isValidSwitch },
  { name: "Stack with Helper", fn: isValidHelper },
  { name: "Replace Method", fn: isValidReplace },
  { name: "Array as Stack", fn: isValidArray },
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

// Generate large valid string
const size = 10000;
let largeValid = "";
for (let i = 0; i < size; i++) {
  largeValid += "({[";
}
for (let i = 0; i < size; i++) {
  largeValid += "]})";
}

console.log(`Testing with string of length ${largeValid.length}...\n`);

// Test Stack approach (O(n))
console.time("Stack Approach O(n)");
isValid(largeValid);
console.timeEnd("Stack Approach O(n)");

// Test Replace approach (O(n²))
console.time("Replace Approach O(n²)");
isValidReplace(largeValid);
console.timeEnd("Replace Approach O(n²)");

console.log("\n💡 Stack approach is much faster!\n");

// ============================================
// STEP-BY-STEP VISUALIZATION
// ============================================

console.log("=== Step-by-Step Visualization ===\n");

function isValidVisualized(s) {
  console.log(`Input: "${s}"`);
  console.log();

  if (s.length % 2 !== 0) {
    console.log("❌ Odd length - impossible to be valid!");
    return false;
  }

  const stack = [];
  const pairs = {
    ")": "(",
    "}": "{",
    "]": "[",
  };

  console.log("Processing each character:\n");

  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    console.log(`Step ${i + 1}: char = '${char}'`);

    if (char in pairs) {
      // Closing bracket
      console.log(`  → Closing bracket`);
      console.log(`  → Stack before: [${stack.join(", ")}]`);

      if (stack.length === 0) {
        console.log(`  ❌ Stack is empty! No matching opening bracket.`);
        return false;
      }

      const top = stack[stack.length - 1];
      if (top !== pairs[char]) {
        console.log(`  ❌ Top of stack '${top}' doesn't match '${char}'`);
        return false;
      }

      stack.pop();
      console.log(`  ✅ Matched! Popped '${top}'`);
      console.log(`  → Stack after: [${stack.join(", ")}]`);
    } else {
      // Opening bracket
      stack.push(char);
      console.log(`  → Opening bracket, push to stack`);
      console.log(`  → Stack: [${stack.join(", ")}]`);
    }

    console.log();
  }

  const isValid = stack.length === 0;
  console.log(`Final Stack: [${stack.join(", ")}]`);
  console.log(
    `Result: ${isValid ? "✅ Valid" : "❌ Invalid"} (stack ${
      isValid ? "is" : "is not"
    } empty)`
  );

  return isValid;
}

isValidVisualized("({[]})");
console.log("\n" + "=".repeat(60) + "\n");
isValidVisualized("([)]");

console.log("\n" + "=".repeat(60) + "\n");

// ============================================
// ALGORITHM EXPLANATION
// ============================================

console.log("=== Algorithm Explanation ===\n");
console.log("STACK APPROACH (Optimal):");
console.log("1. Use a stack to keep track of opening brackets");
console.log("2. For each character:");
console.log("   - If opening bracket: push to stack");
console.log("   - If closing bracket:");
console.log("     • Check if stack is empty (no match) → return false");
console.log("     • Check if top of stack matches → pop stack");
console.log("     • If doesn't match → return false");
console.log("3. After processing all characters:");
console.log("   - Stack empty → valid (all matched)");
console.log("   - Stack not empty → invalid (unmatched brackets)");
console.log();
console.log("Time Complexity: O(n)");
console.log("  - Single pass through string");
console.log("  - Each character processed once");
console.log();
console.log("Space Complexity: O(n)");
console.log("  - Stack can hold up to n/2 opening brackets");
console.log('  - Worst case: "((((((("');
console.log();

console.log("WHY STACK?");
console.log("  • Stack is LIFO (Last In, First Out)");
console.log("  • Most recent opening bracket must close first");
console.log("  • Perfect for tracking nested structures!");
console.log();

// ============================================
// VISUAL DIAGRAM
// ============================================

console.log("=== Visual Diagram ===\n");
console.log('Example: "{[()]}"');
console.log();
console.log('Step 1: "{" → Push to stack');
console.log('  Stack: ["{"]');
console.log();
console.log('Step 2: "[" → Push to stack');
console.log('  Stack: ["{", "["]');
console.log();
console.log('Step 3: "(" → Push to stack');
console.log('  Stack: ["{", "[", "("]');
console.log();
console.log('Step 4: ")" → Closing, matches "(" at top');
console.log('  Stack: ["{", "["]   ← Pop "("');
console.log();
console.log('Step 5: "]" → Closing, matches "[" at top');
console.log('  Stack: ["{"]        ← Pop "["');
console.log();
console.log('Step 6: "}" → Closing, matches "{" at top');
console.log('  Stack: []           ← Pop "{"');
console.log();
console.log("✅ Stack is empty → Valid!");
console.log();

console.log('Counter-example: "([)]"');
console.log();
console.log('Step 1: "(" → Push');
console.log('  Stack: ["("]');
console.log();
console.log('Step 2: "[" → Push');
console.log('  Stack: ["(", "["]');
console.log();
console.log('Step 3: ")" → Closing, but top is "["');
console.log('  ❌ Mismatch! Expected "]" to close "["');
console.log("  ❌ Invalid!");
console.log();

// ============================================
// EDGE CASES
// ============================================

console.log("=== Edge Cases to Consider ===\n");

const edgeCases = [
  { input: "", expected: true, description: "Empty string" },
  { input: "(", expected: false, description: "Single opening" },
  { input: ")", expected: false, description: "Single closing" },
  { input: "()", expected: true, description: "Single pair" },
  { input: "((", expected: false, description: "Multiple same opening" },
  { input: "))", expected: false, description: "Multiple same closing" },
  { input: "(]", expected: false, description: "Wrong closing type" },
  { input: "([)]", expected: false, description: "Interleaved wrong" },
  { input: "([{}])", expected: true, description: "Nested valid" },
  { input: "(){}[]", expected: true, description: "Sequential valid" },
  { input: "{[()()]}", expected: true, description: "Complex nested" },
  { input: "((()))", expected: true, description: "All same type" },
];

edgeCases.forEach((testCase, index) => {
  const result = isValid(testCase.input);
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
console.log("  1. Stack is perfect for matching paired structures");
console.log("  2. LIFO property matches bracket closing order");
console.log("  3. O(n) time with single pass through string");
console.log("  4. Use hashmap for cleaner closing bracket lookup");
console.log();
console.log("🎯 What Interviewers Look For:");
console.log("  - Understanding of stack data structure");
console.log("  - Proper handling of edge cases");
console.log("  - Clean, readable code");
console.log("  - Efficient solution (O(n) time)");
console.log();
console.log("⚠️  Common Mistakes to Avoid:");
console.log("  - Not checking if stack is empty before pop");
console.log("  - Forgetting to check if stack is empty at the end");
console.log("  - Not handling odd-length strings");
console.log("  - Using O(n²) replace method");
console.log("  - Not considering all bracket types");
console.log();
console.log("💡 Optimization Tips:");
console.log("  - Early return for odd length strings");
console.log("  - Use hashmap instead of multiple if-else");
console.log("  - Check stack.length before accessing top");
console.log("  - Array can be used as stack in JavaScript");
console.log();
console.log("🗣️  What to Say:");
console.log('  "I\'ll use a stack to track opening brackets..."');
console.log(
  '  "When I see a closing bracket, I\'ll check if it matches the top..."'
);
console.log('  "Finally, the stack should be empty for a valid string..."');
console.log();

// ============================================
// FOLLOW-UP QUESTIONS
// ============================================

console.log("=== Common Follow-up Questions ===\n");
console.log("Q1: What if there are other characters in the string?");
console.log("A: Ignore them, only process bracket characters");
console.log();
console.log("Q2: Can you do it without a stack?");
console.log("A: Very difficult! Stack is the natural solution");
console.log("   (Replace method works but is O(n²))");
console.log();
console.log("Q3: What about performance for very long strings?");
console.log("A: O(n) time and space is optimal for this problem");
console.log();
console.log("Q4: How would you handle more bracket types?");
console.log("A: Just add them to the pairs map - same algorithm!");
console.log();

// ============================================
// RELATED PROBLEMS
// ============================================

console.log("=== Related Problems ===\n");
console.log("1. Generate Parentheses (LeetCode #22) - Medium");
console.log("   - Generate all valid combinations");
console.log();
console.log("2. Longest Valid Parentheses (LeetCode #32) - Hard");
console.log("   - Find longest valid substring");
console.log();
console.log("3. Remove Invalid Parentheses (LeetCode #301) - Hard");
console.log("   - Remove minimum brackets to make valid");
console.log();
console.log(
  "4. Minimum Add to Make Parentheses Valid (LeetCode #921) - Medium"
);
console.log("   - Count minimum additions needed");
console.log();

// ============================================
// STACK OPERATIONS SUMMARY
// ============================================

console.log("=== Stack Operations Used ===\n");
console.log("JavaScript Array as Stack:");
console.log("┌─────────────────┬──────────────────┬─────────────┐");
console.log("│ Operation       │ Method           │ Complexity  │");
console.log("├─────────────────┼──────────────────┼─────────────┤");
console.log("│ Push (add top)  │ stack.push(x)    │ O(1)        │");
console.log("│ Pop (remove)    │ stack.pop()      │ O(1)        │");
console.log("│ Peek (view top) │ stack[length-1]  │ O(1)        │");
console.log("│ Is empty?       │ stack.length===0 │ O(1)        │");
console.log("└─────────────────┴──────────────────┴─────────────┘");
console.log();
console.log("All operations are O(1) - perfect for this problem!");
console.log();

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isValid,
    isValidSwitch,
    isValidHelper,
    isValidReplace,
    isValidArray,
  };
}
