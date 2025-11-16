/**
 * Spiral Matrix - LeetCode Problem
 * Difficulty: Medium
 *
 * Problem: Given an m x n matrix, return all elements of the matrix in spiral order.
 *
 * Example 1:
 * Input: matrix = [[1,2,3],
 *                  [4,5,6],
 *                  [7,8,9]]
 * Output: [1,2,3,6,9,8,7,4,5]
 *
 * Visual:
 * 1 → 2 → 3
 *         ↓
 * 4 → 5   6
 * ↑       ↓
 * 7 ← 8 ← 9
 *
 * Example 2:
 * Input: matrix = [[1,2,3,4],
 *                  [5,6,7,8],
 *                  [9,10,11,12]]
 * Output: [1,2,3,4,8,12,11,10,9,5,6,7]
 *
 * Visual:
 * 1 → 2 → 3 → 4
 *             ↓
 * 5 → 6 → 7   8
 * ↑           ↓
 * 9 ← 10← 11← 12
 */

/**
 * APPROACH 1: Layer by Layer (MOST INTUITIVE)
 *
 * Key Insights:
 * 1. Process matrix in concentric rectangular layers
 * 2. For each layer, traverse 4 sides: top → right → bottom → left
 * 3. Shrink boundaries after each complete layer
 * 4. Continue until all elements visited
 *
 * Time Complexity: O(m × n) - visit each element once
 * Space Complexity: O(1) - excluding output array
 */

/**
 * @param {number[][]} matrix
 * @return {number[]}
 */
function spiralOrder(matrix) {
  if (!matrix || matrix.length === 0) {
    return [];
  }

  const result = [];
  const m = matrix.length; // number of rows
  const n = matrix[0].length; // number of columns

  // Define boundaries
  let top = 0;
  let bottom = m - 1;
  let left = 0;
  let right = n - 1;

  while (top <= bottom && left <= right) {
    // Traverse top row (left to right)
    for (let col = left; col <= right; col++) {
      result.push(matrix[top][col]);
    }
    top++; // Move top boundary down

    // Traverse right column (top to bottom)
    for (let row = top; row <= bottom; row++) {
      result.push(matrix[row][right]);
    }
    right--; // Move right boundary left

    // Traverse bottom row (right to left)
    // Check if there's still a row to traverse
    if (top <= bottom) {
      for (let col = right; col >= left; col--) {
        result.push(matrix[bottom][col]);
      }
      bottom--; // Move bottom boundary up
    }

    // Traverse left column (bottom to top)
    // Check if there's still a column to traverse
    if (left <= right) {
      for (let row = bottom; row >= top; row--) {
        result.push(matrix[row][left]);
      }
      left++; // Move left boundary right
    }
  }

  return result;
}

// ============================================================================
// APPROACH 2: Direction Vectors (CLEANER CODE)
// ============================================================================

/**
 * Use direction vectors to simulate movement
 * Change direction when hitting boundary or visited cell
 *
 * Directions: right → down → left → up (repeat)
 *
 * Time Complexity: O(m × n)
 * Space Complexity: O(m × n) - for visited array
 */
function spiralOrderDirections(matrix) {
  if (!matrix || matrix.length === 0) {
    return [];
  }

  const m = matrix.length;
  const n = matrix[0].length;
  const result = [];

  // Direction vectors: right, down, left, up
  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  let directionIndex = 0;

  // Track visited cells
  const visited = Array.from({ length: m }, () => new Array(n).fill(false));

  let row = 0,
    col = 0;

  for (let i = 0; i < m * n; i++) {
    result.push(matrix[row][col]);
    visited[row][col] = true;

    // Calculate next position
    const [dr, dc] = directions[directionIndex];
    let newRow = row + dr;
    let newCol = col + dc;

    // Check if we need to change direction
    if (
      newRow < 0 ||
      newRow >= m ||
      newCol < 0 ||
      newCol >= n ||
      visited[newRow][newCol]
    ) {
      // Change direction (turn right)
      directionIndex = (directionIndex + 1) % 4;
      const [newDr, newDc] = directions[directionIndex];
      newRow = row + newDr;
      newCol = col + newDc;
    }

    row = newRow;
    col = newCol;
  }

  return result;
}

// ============================================================================
// APPROACH 3: Recursive Layer Peeling
// ============================================================================

/**
 * Recursively process outer layer and recurse on inner matrix
 *
 * Time Complexity: O(m × n)
 * Space Complexity: O(min(m, n)) - recursion stack
 */
function spiralOrderRecursive(matrix) {
  if (!matrix || matrix.length === 0) {
    return [];
  }

  const result = [];

  function spiralHelper(top, bottom, left, right) {
    if (top > bottom || left > right) {
      return;
    }

    // Top row
    for (let col = left; col <= right; col++) {
      result.push(matrix[top][col]);
    }

    // Right column
    for (let row = top + 1; row <= bottom; row++) {
      result.push(matrix[row][right]);
    }

    // Bottom row (if exists)
    if (top < bottom) {
      for (let col = right - 1; col >= left; col--) {
        result.push(matrix[bottom][col]);
      }
    }

    // Left column (if exists)
    if (left < right) {
      for (let row = bottom - 1; row > top; row--) {
        result.push(matrix[row][left]);
      }
    }

    // Recurse on inner layer
    spiralHelper(top + 1, bottom - 1, left + 1, right - 1);
  }

  spiralHelper(0, matrix.length - 1, 0, matrix[0].length - 1);
  return result;
}

// ============================================================================
// APPROACH 4: Simulation with State Machine
// ============================================================================

/**
 * Treat as state machine with 4 states (directions)
 *
 * Time Complexity: O(m × n)
 * Space Complexity: O(1)
 */
function spiralOrderStateMachine(matrix) {
  if (!matrix || matrix.length === 0) {
    return [];
  }

  const result = [];
  const m = matrix.length;
  const n = matrix[0].length;

  let top = 0,
    bottom = m - 1,
    left = 0,
    right = n - 1;
  let state = 0; // 0: right, 1: down, 2: left, 3: up

  while (result.length < m * n) {
    if (state === 0) {
      // Move right
      for (let col = left; col <= right && result.length < m * n; col++) {
        result.push(matrix[top][col]);
      }
      top++;
      state = 1;
    } else if (state === 1) {
      // Move down
      for (let row = top; row <= bottom && result.length < m * n; row++) {
        result.push(matrix[row][right]);
      }
      right--;
      state = 2;
    } else if (state === 2) {
      // Move left
      for (let col = right; col >= left && result.length < m * n; col--) {
        result.push(matrix[bottom][col]);
      }
      bottom--;
      state = 3;
    } else {
      // Move up
      for (let row = bottom; row >= top && result.length < m * n; row--) {
        result.push(matrix[row][left]);
      }
      left++;
      state = 0;
    }
  }

  return result;
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log("Test Case 1: 3x3 Matrix");
console.log("Input: [[1,2,3],[4,5,6],[7,8,9]]");
console.log(
  "Output:",
  spiralOrder([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ])
);
console.log("Expected: [1,2,3,6,9,8,7,4,5]");
console.log();

console.log("Test Case 2: 3x4 Matrix");
console.log("Input: [[1,2,3,4],[5,6,7,8],[9,10,11,12]]");
console.log(
  "Output:",
  spiralOrder([
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ])
);
console.log("Expected: [1,2,3,4,8,12,11,10,9,5,6,7]");
console.log();

console.log("Test Case 3: Single Row");
console.log("Input: [[1,2,3,4]]");
console.log("Output:", spiralOrder([[1, 2, 3, 4]]));
console.log("Expected: [1,2,3,4]");
console.log();

console.log("Test Case 4: Single Column");
console.log("Input: [[1],[2],[3],[4]]");
console.log("Output:", spiralOrder([[1], [2], [3], [4]]));
console.log("Expected: [1,2,3,4]");
console.log();

console.log("Test Case 5: 1x1 Matrix");
console.log("Input: [[1]]");
console.log("Output:", spiralOrder([[1]]));
console.log("Expected: [1]");
console.log();

console.log("Test Case 6: 2x2 Matrix");
console.log("Input: [[1,2],[3,4]]");
console.log(
  "Output:",
  spiralOrder([
    [1, 2],
    [3, 4],
  ])
);
console.log("Expected: [1,2,4,3]");
console.log();

console.log("Test Case 7: 4x4 Matrix");
const matrix4x4 = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
];
console.log("Input: [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]");
console.log("Output:", spiralOrder(matrix4x4));
console.log("Expected: [1,2,3,4,8,12,16,15,14,13,9,5,6,7,11,10]");
console.log();

console.log("Comparing Different Approaches:");
const test = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
console.log("Layer by Layer:", spiralOrder(test));
console.log("Direction Vectors:", spiralOrderDirections(test));
console.log("Recursive:", spiralOrderRecursive(test));
console.log("State Machine:", spiralOrderStateMachine(test));
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * STEP-BY-STEP WALKTHROUGH: Layer by Layer
 *
 * Example: matrix = [[1,2,3],[4,5,6],[7,8,9]]
 *
 * Initial boundaries:
 * top = 0, bottom = 2, left = 0, right = 2
 *
 * LAYER 1 (Outer):
 *
 * Step 1: Traverse top row (left to right)
 *   col: 0 → 1 → 2
 *   Add: 1, 2, 3
 *   result = [1, 2, 3]
 *   top = 1 (move down)
 *
 * Step 2: Traverse right column (top to bottom)
 *   row: 1 → 2
 *   Add: 6, 9
 *   result = [1, 2, 3, 6, 9]
 *   right = 1 (move left)
 *
 * Step 3: Traverse bottom row (right to left)
 *   col: 1 → 0
 *   Add: 8, 7
 *   result = [1, 2, 3, 6, 9, 8, 7]
 *   bottom = 1 (move up)
 *
 * Step 4: Traverse left column (bottom to top)
 *   row: 1
 *   Add: 4
 *   result = [1, 2, 3, 6, 9, 8, 7, 4]
 *   left = 1 (move right)
 *
 * LAYER 2 (Inner):
 * Boundaries: top = 1, bottom = 1, left = 1, right = 1
 *
 * Step 1: Traverse top row
 *   col: 1
 *   Add: 5
 *   result = [1, 2, 3, 6, 9, 8, 7, 4, 5]
 *   top = 2
 *
 * Now top > bottom, so we're done!
 *
 * Final: [1, 2, 3, 6, 9, 8, 7, 4, 5] ✓
 */

/**
 * VISUAL REPRESENTATION: Layer by Layer
 *
 * 3x3 Matrix:
 * [1  2  3]
 * [4  5  6]
 * [7  8  9]
 *
 * Layer 1 (outer):
 * [→  →  →]
 * [↑  .  ↓]
 * [↑  ←  ←]
 * Order: 1,2,3,6,9,8,7,4
 *
 * Layer 2 (center):
 * [.  .  .]
 * [.  5  .]
 * [.  .  .]
 * Order: 5
 *
 * Combined: [1,2,3,6,9,8,7,4,5]
 */

/**
 * VISUAL REPRESENTATION: 4x4 Matrix
 *
 * [1   2   3   4 ]
 * [5   6   7   8 ]
 * [9   10  11  12]
 * [13  14  15  16]
 *
 * Layer 1 (outer):
 * [→   →   →   → ]
 * [↑   .   .   ↓ ]
 * [↑   .   .   ↓ ]
 * [↑   ←   ←   ← ]
 * Order: 1,2,3,4,8,12,16,15,14,13,9,5
 *
 * Layer 2 (inner 2x2):
 * [.   .   .   . ]
 * [.   →   →   . ]
 * [.   ↑   ←   . ]
 * [.   .   .   . ]
 * Order: 6,7,11,10
 *
 * Combined: [1,2,3,4,8,12,16,15,14,13,9,5,6,7,11,10]
 */

/**
 * UNDERSTANDING THE BOUNDARY CHECKS:
 *
 * WHY CHECK "if (top <= bottom)" before bottom row?
 *
 * Example: Single row matrix [[1,2,3]]
 *
 * After traversing top row: top = 1, bottom = 0
 * Now top > bottom, but we haven't checked yet!
 * If we traverse bottom row, we'd process it again (duplicate!)
 *
 * So we check: if (top <= bottom) before bottom traversal
 *
 * WHY CHECK "if (left <= right)" before left column?
 *
 * Example: Single column matrix [[1],[2],[3]]
 *
 * After traversing right column: left = 1, right = 0
 * Now left > right, but we haven't checked yet!
 * If we traverse left column, we'd process it again (duplicate!)
 *
 * So we check: if (left <= right) before left traversal
 */

/**
 * EDGE CASES HANDLING:
 *
 * 1. Empty matrix: []
 *    Return: []
 *
 * 2. Single element: [[1]]
 *    top=0, bottom=0, left=0, right=0
 *    Traverse top: [1]
 *    top becomes 1, loop ends
 *    Return: [1]
 *
 * 3. Single row: [[1,2,3,4]]
 *    Traverse top: [1,2,3,4]
 *    Traverse right: nothing (top > bottom)
 *    Return: [1,2,3,4]
 *
 * 4. Single column: [[1],[2],[3]]
 *    Traverse top: [1]
 *    Traverse right: [2,3]
 *    Return: [1,2,3]
 *
 * 5. 2x2 Matrix: [[1,2],[3,4]]
 *    Layer 1: 1,2,4,3
 *    Return: [1,2,4,3]
 */

/**
 * DIRECTION VECTORS APPROACH EXPLANATION:
 *
 * Directions array: [[0,1], [1,0], [0,-1], [-1,0]]
 * Index 0: [0,1]  = right (row+0, col+1)
 * Index 1: [1,0]  = down  (row+1, col+0)
 * Index 2: [0,-1] = left  (row+0, col-1)
 * Index 3: [-1,0] = up    (row-1, col+0)
 *
 * Algorithm:
 * 1. Start at (0,0) going right
 * 2. Try to move in current direction
 * 3. If can't (boundary or visited), turn right (next direction)
 * 4. Repeat until all cells visited
 *
 * Turning right: directionIndex = (directionIndex + 1) % 4
 * - From right(0) → down(1)
 * - From down(1) → left(2)
 * - From left(2) → up(3)
 * - From up(3) → right(0)
 */

/**
 * APPROACH COMPARISON:
 *
 * APPROACH 1: Layer by Layer
 * Pros:
 * ✓ Most intuitive
 * ✓ No extra space (no visited array)
 * ✓ Clean boundary management
 * ✓ Easy to debug
 * Cons:
 * ✗ Requires careful boundary checks
 * ✗ Longer code
 *
 * APPROACH 2: Direction Vectors
 * Pros:
 * ✓ Simpler logic
 * ✓ Easy to understand simulation
 * ✓ Extensible to other patterns
 * Cons:
 * ✗ Requires O(m×n) space for visited array
 * ✗ Slightly slower due to checks
 *
 * APPROACH 3: Recursive
 * Pros:
 * ✓ Elegant and concise
 * ✓ Natural layer peeling
 * Cons:
 * ✗ Recursion overhead
 * ✗ Stack space O(min(m,n))
 *
 * APPROACH 4: State Machine
 * Pros:
 * ✓ Clear state transitions
 * ✓ No visited array
 * Cons:
 * ✗ Similar to approach 1, just different style
 *
 * RECOMMENDED: Approach 1 (Layer by Layer) for interviews
 */

/**
 * KEY INSIGHTS:
 *
 * 1. BOUNDARY MANAGEMENT:
 *    - Track 4 boundaries: top, bottom, left, right
 *    - Shrink boundaries after each side traversal
 *    - Stop when boundaries cross
 *
 * 2. LAYER PROCESSING:
 *    - Process outer layers first, then inner
 *    - Each layer is a rectangular ring
 *    - Center element(s) are the innermost layer
 *
 * 3. DIRECTION ORDER:
 *    - Always: right → down → left → up
 *    - This creates clockwise spiral
 *    - Consistent order prevents missing elements
 *
 * 4. EDGE CASE CHECKS:
 *    - Check if row exists before bottom traversal
 *    - Check if column exists before left traversal
 *    - Prevents duplicate processing
 *
 * 5. TERMINATION CONDITION:
 *    - top <= bottom AND left <= right
 *    - OR result.length === m * n
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * 1. ❌ Not checking boundaries before bottom/left traversal
 *    - Results in duplicate elements
 *    - Especially for single row/column matrices
 *
 * 2. ❌ Wrong loop conditions
 *    - Use <= for comparison, not <
 *    - Careful with >= in reverse traversal
 *
 * 3. ❌ Forgetting to update boundaries
 *    - Must update after each side
 *    - top++, right--, bottom--, left++
 *
 * 4. ❌ Wrong boundary update order
 *    - Update AFTER traversing that side
 *    - Not before
 *
 * 5. ❌ Not handling empty matrix
 *    - Check for null or empty input
 *    - Return [] immediately
 *
 * 6. ❌ Processing corners twice
 *    - Each corner belongs to exactly 2 sides
 *    - Careful with loop bounds to avoid duplicates
 */

/**
 * INTERVIEW TIPS:
 *
 * 1. Clarify requirements:
 *    "Should I return clockwise spiral?" → Yes
 *    "What about empty matrix?" → Return empty array
 *
 * 2. Visualize first:
 *    Draw arrows on matrix showing traversal order
 *    Identify the pattern (outer to inner layers)
 *
 * 3. Explain approach:
 *    "I'll track 4 boundaries and shrink them as I traverse"
 *    "Process in order: top, right, bottom, left"
 *
 * 4. Mention edge cases:
 *    "Need to check if row/column still exists"
 *    "Prevents duplicate processing for non-square matrices"
 *
 * 5. Discuss complexity:
 *    "Time is O(m×n) - visit each element once"
 *    "Space is O(1) - only output array"
 *
 * 6. Test with examples:
 *    "Let me trace through a 3×3 matrix"
 *    "And a single row to verify edge cases"
 */

/**
 * RELATED PROBLEMS:
 * - Spiral Matrix II (Generate spiral matrix)
 * - Spiral Matrix III
 * - Rotate Image
 * - Diagonal Traverse
 * - Matrix Traversal problems
 */

/**
 * VARIATIONS:
 *
 * Counter-clockwise spiral:
 * - Order: top, left, bottom, right
 *
 * Diagonal spiral:
 * - Traverse diagonally instead of rectangularly
 *
 * Inward-outward spiral:
 * - Start from center, go outward
 */

// Export for testing
module.exports = {
  spiralOrder,
  spiralOrderDirections,
  spiralOrderRecursive,
  spiralOrderStateMachine,
};
