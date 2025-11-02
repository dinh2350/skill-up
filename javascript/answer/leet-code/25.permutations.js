/**
 * 25. Permutations
 * Difficulty: Medium
 * Topics: Array, Backtracking
 *
 * Problem: Given an array nums of distinct integers, return all possible permutations.
 * You can return the answer in any order.
 *
 * Key Insights:
 * - Classic BACKTRACKING problem
 * - Each permutation uses ALL elements exactly once
 * - Total permutations = n! (factorial)
 * - Build permutation incrementally, backtrack when complete
 */

// ============================================
// APPROACH 1: Backtracking with Visited Array
// ============================================
/**
 * Time Complexity: O(n × n!)
 *   - n! permutations
 *   - Each permutation takes O(n) to build and copy
 *
 * Space Complexity: O(n) for recursion stack and visited array
 *
 * Algorithm:
 * 1. Use visited array to track used elements
 * 2. Build permutation one element at a time
 * 3. When size = n, add to result
 * 4. Backtrack by unmarking visited
 */
function permute_Backtracking(nums) {
  const result = [];
  const visited = new Array(nums.length).fill(false);

  function backtrack(current) {
    // Base case: permutation is complete
    if (current.length === nums.length) {
      result.push([...current]); // Important: copy array!
      return;
    }

    // Try adding each unused number
    for (let i = 0; i < nums.length; i++) {
      if (visited[i]) continue; // Skip if already used

      // Choose
      current.push(nums[i]);
      visited[i] = true;

      // Explore
      backtrack(current);

      // Unchoose (backtrack)
      current.pop();
      visited[i] = false;
    }
  }

  backtrack([]);
  return result;
}

// ============================================
// APPROACH 2: Backtracking with Set
// ============================================
/**
 * Time Complexity: O(n × n!)
 * Space Complexity: O(n)
 *
 * Uses Set to track used elements
 */
function permute_Set(nums) {
  const result = [];

  function backtrack(current, remaining) {
    if (current.length === nums.length) {
      result.push([...current]);
      return;
    }

    for (const num of remaining) {
      const newRemaining = new Set(remaining);
      newRemaining.delete(num);

      current.push(num);
      backtrack(current, newRemaining);
      current.pop();
    }
  }

  backtrack([], new Set(nums));
  return result;
}

// ============================================
// APPROACH 3: Swap-based (In-place) - Heap's Algorithm
// ============================================
/**
 * Time Complexity: O(n × n!)
 * Space Complexity: O(n) - only recursion stack
 *
 * Most space-efficient: no extra visited tracking
 * Generates permutations by swapping elements
 */
function permute_Swap(nums) {
  const result = [];

  function backtrack(start) {
    // Base case: reached end, add permutation
    if (start === nums.length) {
      result.push([...nums]);
      return;
    }

    // Try each element in remaining positions
    for (let i = start; i < nums.length; i++) {
      // Swap current position with i
      [nums[start], nums[i]] = [nums[i], nums[start]];

      // Recurse on next position
      backtrack(start + 1);

      // Backtrack: swap back
      [nums[start], nums[i]] = [nums[i], nums[start]];
    }
  }

  backtrack(0);
  return result;
}

// ============================================
// APPROACH 4: Iterative Building (BFS-style)
// ============================================
/**
 * Time Complexity: O(n × n!)
 * Space Complexity: O(n × n!)
 *
 * Builds permutations level by level
 * Good for understanding the process
 */
function permute_Iterative(nums) {
  let result = [[]]; // Start with empty permutation

  // For each number, insert it into all positions of existing permutations
  for (const num of nums) {
    const newResult = [];

    for (const perm of result) {
      // Insert num at every possible position
      for (let i = 0; i <= perm.length; i++) {
        const newPerm = [...perm.slice(0, i), num, ...perm.slice(i)];
        newResult.push(newPerm);
      }
    }

    result = newResult;
  }

  return result;
}

// ============================================
// APPROACH 5: Lexicographic (Next Permutation)
// ============================================
/**
 * Time Complexity: O(n × n!)
 * Space Complexity: O(n!)
 *
 * Generates permutations in lexicographic order
 * Uses next permutation algorithm
 */
function permute_Lexicographic(nums) {
  const result = [];
  const sorted = [...nums].sort((a, b) => a - b);

  // Generate next permutation in lexicographic order
  function nextPermutation(arr) {
    // Find longest non-increasing suffix
    let i = arr.length - 2;
    while (i >= 0 && arr[i] >= arr[i + 1]) {
      i--;
    }

    if (i < 0) return false; // No more permutations

    // Find successor to pivot
    let j = arr.length - 1;
    while (arr[j] <= arr[i]) {
      j--;
    }

    // Swap pivot with successor
    [arr[i], arr[j]] = [arr[j], arr[i]];

    // Reverse suffix
    let left = i + 1;
    let right = arr.length - 1;
    while (left < right) {
      [arr[left], arr[right]] = [arr[right], arr[left]];
      left++;
      right--;
    }

    return true;
  }

  // Add first permutation
  result.push([...sorted]);

  // Generate all permutations
  while (nextPermutation(sorted)) {
    result.push([...sorted]);
  }

  return result;
}

// ============================================
// VISUAL WALKTHROUGH
// ============================================
/**
 * Example: nums = [1, 2, 3]
 *
 * Backtracking Tree Visualization:
 * ═══════════════════════════════════════════
 *
 *                    []
 *          /          |          \
 *        [1]         [2]         [3]
 *       /   \       /   \       /   \
 *    [1,2] [1,3] [2,1] [2,3] [3,1] [3,2]
 *      |     |     |     |     |     |
 *   [1,2,3][1,3,2][2,1,3][2,3,1][3,1,2][3,2,1]
 *
 * Step-by-Step Execution:
 * ═══════════════════════════════════════════
 *
 * Initial: current = [], visited = [F, F, F]
 *
 * Step 1: Choose 1
 * ┌─────────────────────────────────────┐
 * │ current = [1]                       │
 * │ visited = [T, F, F]                 │
 * │ Not complete, continue...           │
 * └─────────────────────────────────────┘
 *
 * Step 2: Choose 2
 * ┌─────────────────────────────────────┐
 * │ current = [1, 2]                    │
 * │ visited = [T, T, F]                 │
 * │ Not complete, continue...           │
 * └─────────────────────────────────────┘
 *
 * Step 3: Choose 3
 * ┌─────────────────────────────────────┐
 * │ current = [1, 2, 3]                 │
 * │ visited = [T, T, T]                 │
 * │ Complete! Add to result ✓           │
 * │ result = [[1,2,3]]                  │
 * └─────────────────────────────────────┘
 *
 * Step 4: Backtrack (remove 3)
 * ┌─────────────────────────────────────┐
 * │ current = [1, 2]                    │
 * │ visited = [T, T, F]                 │
 * │ No more options, backtrack...       │
 * └─────────────────────────────────────┘
 *
 * Step 5: Backtrack (remove 2)
 * ┌─────────────────────────────────────┐
 * │ current = [1]                       │
 * │ visited = [T, F, F]                 │
 * │ Try next option: 3                  │
 * └─────────────────────────────────────┘
 *
 * Step 6: Choose 3
 * ┌─────────────────────────────────────┐
 * │ current = [1, 3]                    │
 * │ visited = [T, F, T]                 │
 * │ Not complete, continue...           │
 * └─────────────────────────────────────┘
 *
 * Step 7: Choose 2
 * ┌─────────────────────────────────────┐
 * │ current = [1, 3, 2]                 │
 * │ visited = [T, T, T]                 │
 * │ Complete! Add to result ✓           │
 * │ result = [[1,2,3], [1,3,2]]         │
 * └─────────────────────────────────────┘
 *
 * ... Continue pattern for [2,1,3], [2,3,1], [3,1,2], [3,2,1]
 *
 * Final Result: 6 permutations (3! = 6)
 * [
 *   [1,2,3], [1,3,2],
 *   [2,1,3], [2,3,1],
 *   [3,1,2], [3,2,1]
 * ]
 */

// ============================================
// SWAP-BASED WALKTHROUGH
// ============================================
/**
 * Swap-based approach: nums = [1, 2, 3]
 *
 * Key Insight: Fix first position, permute rest
 *
 * Level 0: Fix position 0
 * ─────────────────────────────
 * Start: [1, 2, 3]
 *
 * Option 1: Keep 1 at position 0
 *   [1, 2, 3] (no swap)
 *   → Recurse on positions 1-2
 *
 * Option 2: Put 2 at position 0
 *   Swap(0, 1): [2, 1, 3]
 *   → Recurse on positions 1-2
 *
 * Option 3: Put 3 at position 0
 *   Swap(0, 2): [3, 2, 1]
 *   → Recurse on positions 1-2
 *
 * Detailed Trace for Option 1:
 * ──────────────────────────────
 *
 * State: [1, 2, 3], fixing position 0
 *
 * Level 1: Fix position 1
 *   Option A: Keep 2 at position 1
 *     [1, 2, 3] (no swap)
 *     Level 2: Fix position 2
 *       [1, 2, 3] → Add to result ✓
 *
 *   Option B: Put 3 at position 1
 *     Swap(1, 2): [1, 3, 2]
 *     Level 2: Fix position 2
 *       [1, 3, 2] → Add to result ✓
 *     Swap back(1, 2): [1, 2, 3]
 *
 * Backtrack: Swap(0, 1) to try next option
 *
 * This generates all 6 permutations!
 */

// ============================================
// ITERATIVE BUILDING WALKTHROUGH
// ============================================
/**
 * Building permutations iteratively: [1, 2, 3]
 *
 * Start: result = [[]]
 *
 * ── Add 1 ──────────────────────────
 * For each existing permutation:
 *   [] → Insert 1 at position 0
 *   Result: [[1]]
 *
 * result = [[1]]
 *
 * ── Add 2 ──────────────────────────
 * For each existing permutation:
 *   [1] → Insert 2 at positions 0, 1
 *     Position 0: [2, 1]
 *     Position 1: [1, 2]
 *
 * result = [[2,1], [1,2]]
 *
 * ── Add 3 ──────────────────────────
 * For each existing permutation:
 *
 *   [2,1] → Insert 3 at positions 0, 1, 2
 *     Position 0: [3, 2, 1]
 *     Position 1: [2, 3, 1]
 *     Position 2: [2, 1, 3]
 *
 *   [1,2] → Insert 3 at positions 0, 1, 2
 *     Position 0: [3, 1, 2]
 *     Position 1: [1, 3, 2]
 *     Position 2: [1, 2, 3]
 *
 * result = [
 *   [3,2,1], [2,3,1], [2,1,3],
 *   [3,1,2], [1,3,2], [1,2,3]
 * ]
 *
 * Complete! 6 permutations generated ✓
 */

// ============================================
// COMPLEXITY ANALYSIS
// ============================================
/**
 * All approaches generate n! permutations:
 *
 * Time Complexity: O(n × n!)
 * - n! permutations to generate
 * - Each permutation takes O(n) to build/copy
 * - Total: n × n!
 *
 * Space Complexity varies:
 *
 * Backtracking with Visited: O(n)
 * ✓ Visited array: O(n)
 * ✓ Recursion stack: O(n)
 * ✓ Current permutation: O(n)
 * ✗ Result array: O(n × n!) (output, doesn't count)
 *
 * Swap-based: O(n)
 * ✓ Most space-efficient
 * ✓ Only recursion stack
 * ✓ Modifies input in-place
 *
 * Iterative: O(n × n!)
 * ✗ Stores intermediate results
 * ✓ No recursion
 * ✓ Easy to understand
 *
 * Lexicographic: O(n!)
 * ✓ Generates in sorted order
 * ✓ Good for specific permutation needs
 * ✗ Requires initial sort
 *
 * Practical Performance:
 * - For small n (< 10): All approaches work well
 * - For n = 10: 3,628,800 permutations! (3.6M)
 * - For n > 10: Usually not practical
 * - Swap-based is most memory-efficient
 */

// ============================================
// COMMON MISTAKES
// ============================================
/**
 * 1. ❌ Not copying array when adding to result
 *    Wrong: result.push(current)
 *    Right: result.push([...current])
 *    Why: Arrays are passed by reference!
 *
 * 2. ❌ Forgetting to backtrack
 *    Must: current.pop() and visited[i] = false
 *    Without: Won't explore all branches
 *
 * 3. ❌ Using includes() to check if element used
 *    Slow: O(n) check each time
 *    Better: visited array O(1) check
 *
 * 4. ❌ Not swapping back in swap approach
 *    Must swap back to restore state
 *
 * 5. ❌ Wrong base case
 *    Should: current.length === nums.length
 *    Not: i >= nums.length
 *
 * 6. ❌ Modifying nums without copying
 *    When adding to result, copy the array!
 *
 * 7. ❌ Starting loop from 0 in swap approach
 *    Should start from 'start' parameter
 *
 * 8. ❌ Confusing permutations with combinations
 *    Permutations: order matters [1,2] ≠ [2,1]
 *    Combinations: order doesn't matter [1,2] = [2,1]
 */

// ============================================
// INTERVIEW TIPS
// ============================================
/**
 * 1. Clarify the problem
 *    - "Are all elements distinct?" (Yes for this problem)
 *    - "Can array be empty?" (Yes, return [[]])
 *    - "Need specific order?" (No, any order is fine)
 *
 * 2. Explain backtracking pattern
 *    "I'll use backtracking - the classic 'choose, explore,
 *    unchoose' pattern. I'll build permutations one element
 *    at a time, using a visited array to track which elements
 *    I've already used."
 *
 * 3. Walk through small example
 *    Draw the backtracking tree for [1, 2, 3]
 *    Show how each path generates one permutation
 *
 * 4. Discuss complexity
 *    - "There are n! permutations"
 *    - "Each takes O(n) to build"
 *    - "Total time is O(n × n!)"
 *
 * 5. Mention variations
 *    - "For duplicates, I'd need Permutations II"
 *    - "Swap approach is more space-efficient"
 *    - "Iterative approach is easier to understand"
 *
 * 6. Code cleanly
 *    Start with visited array approach (clearest)
 *    Mention swap approach if asked about optimization
 *
 * 7. Test edge cases
 *    - Empty array: []
 *    - Single element: [1]
 *    - Two elements: [1, 2]
 */

// ============================================
// DECISION TREE
// ============================================
/**
 * At each level, we decide which number to add:
 *
 * nums = [1, 2, 3]
 *
 * Level 0 (choose 1st number):
 *          Decision Point
 *         /      |      \
 *       1        2        3
 *
 * Level 1 (choose 2nd number):
 *       1              2              3
 *      / \            / \            / \
 *     2   3          1   3          1   2
 *
 * Level 2 (choose 3rd number):
 *     2   3         1   3         1   2
 *     |   |         |   |         |   |
 *     3   2         3   1         2   1
 *
 * Leaves (complete permutations):
 * [1,2,3] [1,3,2] [2,1,3] [2,3,1] [3,1,2] [3,2,1]
 *
 * Total paths = 3 × 2 × 1 = 6 = 3!
 */

// ============================================
// EDGE CASES
// ============================================
function testEdgeCases() {
  console.log("\n=== Edge Cases ===\n");

  // Case 1: Empty array
  console.log("Case 1: Empty array");
  console.log("Input: []");
  console.log("Expected: [[]]");
  console.log("Output:", JSON.stringify(permute_Backtracking([])));
  console.log();

  // Case 2: Single element
  console.log("Case 2: Single element");
  console.log("Input: [1]");
  console.log("Expected: [[1]]");
  console.log("Output:", JSON.stringify(permute_Backtracking([1])));
  console.log();

  // Case 3: Two elements
  console.log("Case 3: Two elements");
  console.log("Input: [1, 2]");
  console.log("Expected: [[1,2], [2,1]]");
  console.log("Output:", JSON.stringify(permute_Backtracking([1, 2])));
  console.log();

  // Case 4: Three elements
  console.log("Case 4: Three elements");
  console.log("Input: [1, 2, 3]");
  const result = permute_Backtracking([1, 2, 3]);
  console.log(`Expected: 6 permutations (3! = 6)`);
  console.log(`Output: ${result.length} permutations`);
  console.log(JSON.stringify(result));
  console.log();

  // Case 5: Negative numbers
  console.log("Case 5: Negative numbers");
  console.log("Input: [-1, 0, 1]");
  console.log("Output:", JSON.stringify(permute_Backtracking([-1, 0, 1])));
  console.log();
}

// ============================================
// TEST CASES
// ============================================
function runTests() {
  console.log("=== Permutations - Backtracking ===\n");

  const testCases = [
    {
      nums: [1, 2, 3],
      expectedCount: 6,
      description: "Standard case - 3 elements",
    },
    {
      nums: [0, 1],
      expectedCount: 2,
      description: "Two elements",
    },
    {
      nums: [1],
      expectedCount: 1,
      description: "Single element",
    },
    {
      nums: [],
      expectedCount: 1,
      description: "Empty array",
    },
    {
      nums: [1, 2, 3, 4],
      expectedCount: 24,
      description: "Four elements (4! = 24)",
    },
  ];

  testCases.forEach((test, index) => {
    console.log(`Test Case ${index + 1}: ${test.description}`);
    console.log(`Input: [${test.nums.join(", ")}]`);
    console.log(`Expected Count: ${test.expectedCount}`);

    // Test all approaches
    const approaches = [
      { name: "Backtracking (Visited)", fn: permute_Backtracking },
      { name: "Backtracking (Set)", fn: permute_Set },
      { name: "Swap-based", fn: permute_Swap },
      { name: "Iterative Building", fn: permute_Iterative },
      { name: "Lexicographic", fn: permute_Lexicographic },
    ];

    approaches.forEach((approach) => {
      const numsCopy = [...test.nums];
      const result = approach.fn(numsCopy);
      const pass = result.length === test.expectedCount;
      console.log(
        `${approach.name}: ${result.length} permutations ${pass ? "✓" : "✗"}`
      );
    });

    // Show result for first approach
    if (test.nums.length <= 3) {
      const result = permute_Backtracking([...test.nums]);
      console.log("Permutations:");
      result.forEach((perm) => console.log(`  [${perm.join(", ")}]`));
    }

    console.log();
  });

  testEdgeCases();
}

// ============================================
// VISUALIZATION WITH TREE
// ============================================
function visualizeBacktracking(nums) {
  console.log("\n=== Backtracking Tree Visualization ===\n");
  console.log(`Input: [${nums.join(", ")}]\n`);

  const result = [];
  const visited = new Array(nums.length).fill(false);
  let callCount = 0;

  function backtrack(current, depth) {
    callCount++;

    const indent = "  ".repeat(depth);
    console.log(
      `${indent}├─ current: [${current.join(", ")}], visited: [${visited
        .map((v) => (v ? "T" : "F"))
        .join(", ")}]`
    );

    if (current.length === nums.length) {
      console.log(
        `${indent}│  ✓ Complete! Add [${current.join(", ")}] to result`
      );
      result.push([...current]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (visited[i]) continue;

      console.log(`${indent}│  → Try adding ${nums[i]}`);

      current.push(nums[i]);
      visited[i] = true;

      backtrack(current, depth + 1);

      current.pop();
      visited[i] = false;

      console.log(`${indent}│  ← Backtrack (removed ${nums[i]})`);
    }
  }

  console.log("Backtracking Process:");
  console.log("─".repeat(50));
  backtrack([], 0);
  console.log("─".repeat(50));

  console.log(`\nTotal recursive calls: ${callCount}`);
  console.log(`Total permutations: ${result.length}`);
  console.log(`Expected: ${factorial(nums.length)}`);

  return result;
}

// Helper: Calculate factorial
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// ============================================
// COMPARISON TABLE
// ============================================
function printComparisonTable() {
  console.log("\n=== Approach Comparison ===\n");
  console.log(
    "┌────────────────────────┬──────────────┬──────────────┬────────────────────┐"
  );
  console.log(
    "│ Approach               │ Time         │ Space        │ Notes              │"
  );
  console.log(
    "├────────────────────────┼──────────────┼──────────────┼────────────────────┤"
  );
  console.log(
    "│ Backtracking (Visited) │ O(n × n!)    │ O(n)         │ Most intuitive     │"
  );
  console.log(
    "│ Backtracking (Set)     │ O(n × n!)    │ O(n)         │ Similar to visited │"
  );
  console.log(
    "│ Swap-based             │ O(n × n!)    │ O(n)         │ Most efficient     │"
  );
  console.log(
    "│ Iterative Building     │ O(n × n!)    │ O(n × n!)    │ No recursion       │"
  );
  console.log(
    "│ Lexicographic          │ O(n × n!)    │ O(n!)        │ Sorted order       │"
  );
  console.log(
    "└────────────────────────┴──────────────┴──────────────┴────────────────────┘"
  );
  console.log();

  console.log("When to use each:");
  console.log("• Backtracking (Visited): Interviews, clear logic");
  console.log("• Swap-based: Memory-constrained, optimal space");
  console.log("• Iterative: Avoid recursion, educational");
  console.log("• Lexicographic: Need sorted permutations");
  console.log();
}

// ============================================
// PERFORMANCE TEST
// ============================================
function performanceTest() {
  console.log("\n=== Performance Test ===\n");

  const sizes = [5, 6, 7, 8];

  sizes.forEach((n) => {
    const nums = Array.from({ length: n }, (_, i) => i + 1);
    const expected = factorial(n);

    console.log(`n = ${n} (${expected} permutations):`);

    const approaches = [
      { name: "Backtracking", fn: permute_Backtracking },
      { name: "Swap-based", fn: permute_Swap },
      { name: "Iterative", fn: permute_Iterative },
    ];

    approaches.forEach((approach) => {
      console.time(`  ${approach.name}`);
      const result = approach.fn([...nums]);
      console.timeEnd(`  ${approach.name}`);
      console.log(`    Generated: ${result.length} permutations`);
    });

    console.log();
  });
}

// ============================================
// RELATED PROBLEMS
// ============================================
/**
 * 1. Permutations II (LeetCode 47)
 *    - Array with duplicates
 *    - Need to skip duplicate permutations
 *    - Use sorting + skip duplicates
 *
 * 2. Next Permutation (LeetCode 31)
 *    - Find next lexicographic permutation
 *    - In-place algorithm
 *
 * 3. Permutation Sequence (LeetCode 60)
 *    - Find kth permutation directly
 *    - Without generating all
 *
 * 4. Letter Case Permutation (LeetCode 784)
 *    - Permute letter cases
 *    - Similar backtracking
 *
 * 5. Combinations (LeetCode 77)
 *    - Similar to permutations
 *    - But order doesn't matter
 *
 * 6. Subsets (LeetCode 78)
 *    - Generate all subsets
 *    - Related backtracking pattern
 *
 * 7. Palindrome Permutation II (LeetCode 267)
 *    - Generate palindrome permutations
 *    - Constraint: must be palindrome
 */

// ============================================
// FOLLOW-UP QUESTIONS
// ============================================
/**
 * Q1: What if array has duplicates?
 * A: Sort first, skip duplicates in same position (Permutations II)
 *
 * Q2: How to find kth permutation without generating all?
 * A: Use factorial number system (Permutation Sequence)
 *
 * Q3: Can we do it without extra space?
 * A: Yes, swap-based approach modifies array in-place
 *
 * Q4: How to generate in lexicographic order?
 * A: Use next permutation algorithm or sort first
 *
 * Q5: What's the time complexity and why?
 * A: O(n × n!) - generate n! permutations, each takes O(n) to copy
 *
 * Q6: How many recursive calls are made?
 * A: Sum of n!/(n-k)! for k=0 to n ≈ e × n!
 *
 * Q7: Can we use iteration instead of recursion?
 * A: Yes, iterative building approach works well
 *
 * Q8: How to handle very large n?
 * A: Generate permutations on-demand (iterator pattern)
 */

// Run all tests
runTests();

// Visualize for small input
console.log("\n" + "=".repeat(60));
visualizeBacktracking([1, 2, 3]);

// Print comparison table
printComparisonTable();

// Performance test (commented out by default - can be slow)
// performanceTest();

// Export functions
module.exports = {
  permute: permute_Backtracking,
  permute_Backtracking,
  permute_Set,
  permute_Swap,
  permute_Iterative,
  permute_Lexicographic,
  factorial,
};
