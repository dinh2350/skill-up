/**
 * ============================================================================
 * LeetCode Problem 9: Contains Duplicate
 * ============================================================================
 *
 * Difficulty: Easy
 * Topics: Array, Hash Table, Sorting
 *
 * Problem Statement:
 * Given an integer array nums, return true if any value appears at least
 * twice in the array, and return false if every element is distinct.
 *
 * Constraints:
 * - 1 <= nums.length <= 10^5
 * - -10^9 <= nums[i] <= 10^9
 *
 * Examples:
 * Input: nums = [1,2,3,1]
 * Output: true
 *
 * Input: nums = [1,2,3,4]
 * Output: false
 *
 * Input: nums = [1,1,1,3,3,4,3,2,4,2]
 * Output: true
 */

// ============================================================================
// Approach 1: Brute Force (Nested Loops)
// ============================================================================
// Time Complexity: O(n²) - Two nested loops
// Space Complexity: O(1) - No extra space
//
// Strategy:
// - Compare each element with every other element
// - If any two elements are the same, return true
//
// ❌ This will get Time Limit Exceeded on LeetCode

function containsDuplicate_BruteForce(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) {
        return true;
      }
    }
  }
  return false;
}

// ============================================================================
// Approach 2: Sorting
// ============================================================================
// Time Complexity: O(n log n) - Sorting dominates
// Space Complexity: O(1) or O(n) - Depends on sorting algorithm
//
// Strategy:
// - Sort the array first
// - Check adjacent elements for duplicates
// - If any two adjacent elements are the same, return true
//
// ✅ Good approach if you can modify the array

function containsDuplicate_Sorting(nums) {
  // Sort the array
  nums.sort((a, b) => a - b);

  // Check adjacent elements
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Approach 3: Hash Set (OPTIMAL) ⭐⭐⭐
// ============================================================================
// Time Complexity: O(n) - Single pass through array
// Space Complexity: O(n) - Set stores up to n elements
//
// Strategy:
// - Use a Set to track seen numbers
// - For each number, check if it's already in the Set
// - If yes, we found a duplicate
// - If no, add it to the Set
//
// ✅ This is the BEST solution for interviews!

function containsDuplicate(nums) {
  const seen = new Set();

  for (let num of nums) {
    if (seen.has(num)) {
      return true;
    }
    seen.add(num);
  }

  return false;
}

// ============================================================================
// Approach 4: Hash Set with Size Comparison (One-Liner)
// ============================================================================
// Time Complexity: O(n) - Creating Set iterates through array
// Space Complexity: O(n) - Set stores unique elements
//
// Strategy:
// - Create a Set from the array (automatically removes duplicates)
// - If Set size < array length, there were duplicates
//
// ✅ Elegant one-liner solution

function containsDuplicate_SetSize(nums) {
  return new Set(nums).size !== nums.length;
}

// ============================================================================
// Approach 5: Hash Map (Object) with Counting
// ============================================================================
// Time Complexity: O(n) - Single pass
// Space Complexity: O(n) - Map stores elements
//
// Strategy:
// - Use a Map/Object to count occurrences
// - If any count > 1, there's a duplicate
//
// Note: This approach does more work than needed but shows frequency counting

function containsDuplicate_HashMap(nums) {
  const map = new Map();

  for (let num of nums) {
    if (map.has(num)) {
      return true; // Found duplicate immediately
    }
    map.set(num, 1);
  }

  return false;
}

// ============================================================================
// Approach 6: Using Array.some() - Functional Approach
// ============================================================================
// Time Complexity: O(n²) in worst case - indexOf searches from start
// Space Complexity: O(1)
//
// Strategy:
// - Use some() to check if any element appears earlier in array
// - For each element, use indexOf to find first occurrence
// - If first occurrence index differs from current index, it's a duplicate
//
// ⚠️ Less efficient but shows functional programming style

function containsDuplicate_Functional(nums) {
  return nums.some((num, index) => nums.indexOf(num) !== index);
}

// ============================================================================
// Approach 7: Early Exit with Set (Optimized for Large Arrays)
// ============================================================================
// Time Complexity: O(n) - Best case O(1) if duplicate is early
// Space Complexity: O(n)
//
// Strategy:
// - Same as Approach 3 but emphasizes early exit
// - Returns immediately when duplicate is found

function containsDuplicate_EarlyExit(nums) {
  const seen = new Set();

  for (const num of nums) {
    // If we've seen this number before, return immediately
    if (seen.has(num)) return true;
    seen.add(num);
  }

  return false;
}

// ============================================================================
// VISUALIZATION: How Hash Set Works
// ============================================================================

function visualizeHashSet(nums) {
  console.log("\n" + "=".repeat(70));
  console.log("VISUALIZATION: Hash Set Approach");
  console.log("=".repeat(70));
  console.log(`Input: [${nums.join(", ")}]`);
  console.log("");

  const seen = new Set();

  console.log("Index | Value | Set Contents          | Action");
  console.log("-".repeat(70));

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    const setContents = Array.from(seen).join(", ");

    if (seen.has(num)) {
      console.log(
        `  ${i}   |  ${String(num).padStart(3)}  | {${setContents.padEnd(
          18
        )}} | ❌ DUPLICATE FOUND!`
      );
      console.log("-".repeat(70));
      console.log(`\n🔍 Result: true (found duplicate: ${num})`);
      console.log("=".repeat(70) + "\n");
      return;
    } else {
      seen.add(num);
      const newSetContents = Array.from(seen).join(", ");
      console.log(
        `  ${i}   |  ${String(num).padStart(3)}  | {${setContents.padEnd(
          18
        )}} | ✓ Add ${num} → {${newSetContents}}`
      );
    }
  }

  console.log("-".repeat(70));
  console.log("\n🔍 Result: false (no duplicates found)");
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// VISUALIZATION: Sorting Approach
// ============================================================================

function visualizeSorting(nums) {
  console.log("\n" + "=".repeat(70));
  console.log("VISUALIZATION: Sorting Approach");
  console.log("=".repeat(70));
  console.log(`Original: [${nums.join(", ")}]`);

  // Create a copy to avoid modifying original
  const sorted = [...nums].sort((a, b) => a - b);
  console.log(`Sorted:   [${sorted.join(", ")}]`);
  console.log("");

  console.log("Index | Value | Next Value | Comparison");
  console.log("-".repeat(70));

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const comparison = current === next ? "❌ DUPLICATE!" : "✓ Different";

    console.log(
      `  ${i}   |  ${String(current).padStart(3)}  |    ${String(next).padStart(
        3
      )}     | ${comparison}`
    );

    if (current === next) {
      console.log("-".repeat(70));
      console.log(`\n🔍 Result: true (found duplicate: ${current})`);
      console.log("=".repeat(70) + "\n");
      return;
    }
  }

  console.log("-".repeat(70));
  console.log("\n🔍 Result: false (no duplicates found)");
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// VISUAL DIAGRAM: Set vs Array Size Comparison
// ============================================================================

function visualizeSetSize(nums) {
  console.log("\n" + "=".repeat(70));
  console.log("VISUALIZATION: Set Size Comparison");
  console.log("=".repeat(70));

  const uniqueSet = new Set(nums);

  console.log(`\nOriginal Array: [${nums.join(", ")}]`);
  console.log(`Array Length:   ${nums.length}`);
  console.log("");
  console.log(`Unique Set:     {${Array.from(uniqueSet).join(", ")}}`);
  console.log(`Set Size:       ${uniqueSet.size}`);
  console.log("");

  if (uniqueSet.size < nums.length) {
    const duplicateCount = nums.length - uniqueSet.size;
    console.log(
      `❌ Set size (${uniqueSet.size}) < Array length (${nums.length})`
    );
    console.log(`   This means ${duplicateCount} duplicate(s) exist!`);
    console.log("\n🔍 Result: true");
  } else {
    console.log(
      `✓ Set size (${uniqueSet.size}) = Array length (${nums.length})`
    );
    console.log("   All elements are unique!");
    console.log("\n🔍 Result: false");
  }

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
Why Hash Set is Optimal:

Problem: Detect if any element appears more than once

Naive Approach (Brute Force):
- Compare every pair of elements
- Number of comparisons = C(n,2) = n(n-1)/2 = O(n²)
- Time: O(n²), Space: O(1)

Sorting Approach:
- Sort array: O(n log n)
- Check adjacent pairs: O(n)
- Total: O(n log n)
- Duplicates must be adjacent after sorting!

Hash Set Approach (Optimal):
- Insert into Set: O(1) average per operation
- Total: O(n) for n elements
- Space: O(n) to store unique elements

Why Set works:
- Set only stores unique values
- If array has duplicates: Set.size < array.length
- If no duplicates: Set.size = array.length

Mathematical proof of correctness:
Let A = array of length n
Let U = set of unique elements in A

If |U| < n, then by Pigeonhole Principle:
  At least two elements in A must be equal
  (n items distributed into |U| < n buckets)
  
Therefore: |U| < n ⟺ A contains duplicates

Time Complexity Comparison:
Algorithm        | Time      | Space | Best Use Case
----------------|-----------|-------|------------------
Brute Force     | O(n²)     | O(1)  | Very small arrays
Sorting         | O(n log n)| O(1)* | When modifying array is OK
Hash Set        | O(n)      | O(n)  | Best overall ⭐
Set Size Check  | O(n)      | O(n)  | Most elegant code
    
* Sorting space depends on implementation (in-place vs not)
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
      name: "Minimum Length with Duplicate",
      input: [1, 1],
      expected: true,
      explanation: "Two identical elements",
    },
    {
      name: "Minimum Length without Duplicate",
      input: [1, 2],
      expected: false,
      explanation: "Two different elements",
    },
    {
      name: "All Same Elements",
      input: [5, 5, 5, 5],
      expected: true,
      explanation: "All elements are duplicates",
    },
    {
      name: "All Unique Elements",
      input: [1, 2, 3, 4, 5],
      expected: false,
      explanation: "No duplicates",
    },
    {
      name: "Duplicate at Start",
      input: [1, 1, 2, 3, 4],
      expected: true,
      explanation: "Early duplicate (best case for early exit)",
    },
    {
      name: "Duplicate at End",
      input: [1, 2, 3, 4, 4],
      expected: true,
      explanation: "Late duplicate (worst case for early exit)",
    },
    {
      name: "Duplicate Far Apart",
      input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 1],
      expected: true,
      explanation: "Duplicate at opposite ends",
    },
    {
      name: "Negative Numbers",
      input: [-1, -2, -3, -1],
      expected: true,
      explanation: "Handles negative numbers",
    },
    {
      name: "Mixed Positive and Negative",
      input: [-1, 0, 1, -1],
      expected: true,
      explanation: "Mix of positive, negative, and zero",
    },
    {
      name: "With Zero",
      input: [0, 1, 2, 0],
      expected: true,
      explanation: "Zero is a valid number",
    },
    {
      name: "Large Numbers",
      input: [1000000000, -1000000000, 1000000000],
      expected: true,
      explanation: "Handles constraint limits (10^9)",
    },
    {
      name: "Single Element",
      input: [42],
      expected: false,
      explanation: "Cannot have duplicate with one element",
    },
  ];

  edgeCases.forEach(({ name, input, expected, explanation }) => {
    const result = containsDuplicate(input);
    const status = result === expected ? "✅" : "❌";

    console.log(`${status} ${name}`);
    console.log(`   Input: [${input.join(", ")}]`);
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

  const sizes = [100, 1000, 10000, 50000];

  sizes.forEach((size) => {
    // Generate array with duplicate at the end (worst case for early exit)
    const nums = Array.from({ length: size }, (_, i) => i);
    nums.push(0); // Add duplicate at end

    console.log(
      `Array Size: ${size.toLocaleString()} elements (duplicate at end)`
    );
    console.log("-".repeat(50));

    // Brute Force (only for small sizes)
    if (size <= 1000) {
      const start1 = performance.now();
      const result1 = containsDuplicate_BruteForce(nums);
      const time1 = performance.now() - start1;
      console.log(
        `Brute Force:     ${time1.toFixed(3)}ms (result: ${result1})`
      );
    } else {
      console.log(`Brute Force:     Skipped (too slow for ${size} elements)`);
    }

    // Sorting (create copy to avoid modifying original)
    const start2 = performance.now();
    const result2 = containsDuplicate_Sorting([...nums]);
    const time2 = performance.now() - start2;
    console.log(`Sorting:         ${time2.toFixed(3)}ms (result: ${result2})`);

    // Hash Set
    const start3 = performance.now();
    const result3 = containsDuplicate(nums);
    const time3 = performance.now() - start3;
    console.log(`Hash Set:        ${time3.toFixed(3)}ms (result: ${result3})`);

    // Set Size
    const start4 = performance.now();
    const result4 = containsDuplicate_SetSize(nums);
    const time4 = performance.now() - start4;
    console.log(`Set Size:        ${time4.toFixed(3)}ms (result: ${result4})`);

    // HashMap
    const start5 = performance.now();
    const result5 = containsDuplicate_HashMap(nums);
    const time5 = performance.now() - start5;
    console.log(`HashMap:         ${time5.toFixed(3)}ms (result: ${result5})`);

    // Functional (only for small sizes)
    if (size <= 1000) {
      const start6 = performance.now();
      const result6 = containsDuplicate_Functional(nums);
      const time6 = performance.now() - start6;
      console.log(
        `Functional:      ${time6.toFixed(3)}ms (result: ${result6})`
      );
    } else {
      console.log(`Functional:      Skipped (too slow for ${size} elements)`);
    }

    console.log("");
  });

  console.log("Performance with early duplicate (best case):");
  console.log("-".repeat(50));

  // Test with duplicate at start (best case)
  const earlyDup = [1, 1, ...Array.from({ length: 10000 }, (_, i) => i + 2)];

  const startEarly = performance.now();
  const resultEarly = containsDuplicate(earlyDup);
  const timeEarly = performance.now() - startEarly;
  console.log(
    `Hash Set (early duplicate): ${timeEarly.toFixed(
      3
    )}ms (result: ${resultEarly})`
  );
  console.log("Note: Much faster when duplicate is found early!\n");

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
    {
      input: [1, 2, 3, 1],
      expected: true,
      description: "Standard case with duplicate",
    },
    {
      input: [1, 2, 3, 4],
      expected: false,
      description: "All unique elements",
    },
    {
      input: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2],
      expected: true,
      description: "Multiple duplicates",
    },
    {
      input: [1],
      expected: false,
      description: "Single element",
    },
    {
      input: [1, 2],
      expected: false,
      description: "Two different elements",
    },
    {
      input: [1, 1],
      expected: true,
      description: "Two same elements",
    },
    {
      input: [0, 0],
      expected: true,
      description: "Duplicate zeros",
    },
    {
      input: [-1, -1],
      expected: true,
      description: "Duplicate negatives",
    },
  ];

  const approaches = [
    { name: "Brute Force", fn: containsDuplicate_BruteForce },
    { name: "Sorting", fn: containsDuplicate_Sorting },
    { name: "Hash Set (Optimal)", fn: containsDuplicate },
    { name: "Set Size", fn: containsDuplicate_SetSize },
    { name: "HashMap", fn: containsDuplicate_HashMap },
    { name: "Functional", fn: containsDuplicate_Functional },
    { name: "Early Exit", fn: containsDuplicate_EarlyExit },
  ];

  approaches.forEach(({ name, fn }) => {
    console.log(`\n${name}:`);
    console.log("-".repeat(70));

    let passed = 0;
    testCases.forEach(({ input, expected, description }, index) => {
      // Create copy for sorting approach
      const inputCopy = [...input];
      const result = fn(inputCopy);
      const status = result === expected ? "✅" : "❌";

      if (result === expected) passed++;

      console.log(`${status} Test ${index + 1}: ${description}`);
      console.log(`   Input: [${input.join(", ")}]`);
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
1. CLARIFY THE PROBLEM:
   ✓ "Do we need to find which element is duplicated?" → No, just return true/false
   ✓ "Can the array be empty?" → No, minimum length is 1
   ✓ "Can we modify the input array?" → Depends (affects if sorting is viable)
   ✓ "What's the range of numbers?" → -10^9 to 10^9

2. DISCUSS TRADE-OFFS:
   Time vs Space:
   - Hash Set: O(n) time, O(n) space → Best overall ⭐
   - Sorting: O(n log n) time, O(1) space → Good if space is limited
   - Brute Force: O(n²) time, O(1) space → Too slow, avoid

3. OPTIMAL SOLUTION FOR INTERVIEWS:
   ✅ Hash Set (Approach 3) or Set Size (Approach 4)
   - O(n) time complexity
   - Easy to explain and implement
   - Most practical in real-world scenarios

4. COMMON MISTAKES TO AVOID:
   ❌ Using indexOf in a loop (O(n²) time)
   ❌ Not considering negative numbers or zero
   ❌ Modifying input array without asking
   ❌ Using includes() instead of Set.has() (O(n) vs O(1))
   ❌ Forgetting that single element array has no duplicates

5. CODE VARIATIONS:
   Concise: return new Set(nums).size !== nums.length
   Verbose: for loop with explicit checks
   Both are acceptable - choose based on interview style

6. FOLLOW-UP QUESTIONS TO EXPECT:
   Q: "What if we need to return the duplicate element?"
   A: Modify to return num instead of true

   Q: "What if we need to find all duplicates?"
   A: Use Map to count frequencies, return keys with count > 1

   Q: "What if we can't use extra space?"
   A: Sorting approach O(n log n) time, O(1) space

   Q: "What if array is already sorted?"
   A: Just check adjacent elements O(n) time

7. EXPLAIN YOUR THOUGHT PROCESS:
   a) "This is a set membership problem"
   b) "I need to track which numbers I've seen"
   c) "Hash Set provides O(1) lookup"
   d) "Total time: O(n), space: O(n)"
   e) "Alternative: sort first, but that's O(n log n)"

8. CODE QUALITY:
   ✓ Use meaningful variable names (seen, not s or x)
   ✓ Add early return for better performance
   ✓ Handle edge cases (empty array, single element)
   ✓ Consider const vs let appropriately

9. RELATED PATTERNS:
   - Two Sum: Also uses hash table for O(n) solution
   - Valid Anagram: Similar set comparison concept
   - Group Anagrams: Hash table to group similar items

10. OPTIMIZATION NOTES:
    - Set operations (has, add) are O(1) average
    - Worst case can be O(n) with many hash collisions
    - In practice, hash collisions are rare with good hash functions
    - Set.size comparison is more elegant than explicit checking
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
1. Contains Duplicate II (Easy)
   - Check if duplicate exists within k distance
   - Use sliding window with hash set

2. Contains Duplicate III (Hard)
   - Check if duplicate exists within value range t and index range k
   - Use bucket sort or balanced BST

3. Find All Duplicates in Array (Medium)
   - Return all elements that appear twice
   - Can solve in O(n) time and O(1) space with clever index marking

4. Find the Duplicate Number (Medium)
   - Array of n+1 integers where one number repeats
   - Floyd's cycle detection (linked list cycle)

5. Two Sum (Easy)
   - Find two numbers that sum to target
   - Similar hash table pattern

6. Valid Anagram (Easy)
   - Check if two strings are anagrams
   - Use hash map to count frequencies

7. Group Anagrams (Medium)
   - Group strings that are anagrams
   - Hash table with sorted string as key

8. Intersection of Two Arrays (Easy)
   - Find common elements
   - Use sets for O(n+m) solution

9. Intersection of Two Arrays II (Easy)
   - Find common elements with duplicates
   - Use hash map to track counts

10. Single Number (Easy)
    - Find element that appears once (others appear twice)
    - XOR bit manipulation or hash set
    `);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log("\n🔍 PROBLEM 9: CONTAINS DUPLICATE");
console.log("=".repeat(70));

// Example 1
const nums1 = [1, 2, 3, 1];
console.log("\n📌 Example 1:");
console.log(`Input: [${nums1.join(", ")}]`);
console.log(`Output: ${containsDuplicate(nums1)}`);
console.log("Explanation: 1 appears twice");

// Example 2
const nums2 = [1, 2, 3, 4];
console.log("\n📌 Example 2:");
console.log(`Input: [${nums2.join(", ")}]`);
console.log(`Output: ${containsDuplicate(nums2)}`);
console.log("Explanation: All elements are unique");

// Example 3
const nums3 = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2];
console.log("\n📌 Example 3:");
console.log(`Input: [${nums3.join(", ")}]`);
console.log(`Output: ${containsDuplicate(nums3)}`);
console.log("Explanation: Multiple elements appear more than once");

// Detailed visualizations
visualizeHashSet([1, 2, 3, 1]);
visualizeSorting([1, 2, 3, 1]);
visualizeSetSize([1, 2, 3, 1]);

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
console.log("Recommended approach for interviews: Approach 3 (Hash Set)");
console.log("Time: O(n) | Space: O(n)");
console.log("One-liner alternative: new Set(nums).size !== nums.length\n");
