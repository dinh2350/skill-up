/**
 * Rotate Image - LeetCode Problem
 * Difficulty: Medium
 *
 * Problem: You are given an n x n 2D matrix representing an image,
 * rotate the image by 90 degrees (clockwise).
 *
 * You have to rotate the image in-place, which means you have to modify
 * the input 2D matrix directly. DO NOT allocate another 2D matrix.
 *
 * Example 1:
 * Input: matrix = [[1,2,3],
 *                  [4,5,6],
 *                  [7,8,9]]
 *
 * Output: [[7,4,1],
 *          [8,5,2],
 *          [9,6,3]]
 *
 * Example 2:
 * Input: matrix = [[5,1,9,11],
 *                  [2,4,8,10],
 *                  [13,3,6,7],
 *                  [15,14,12,16]]
 *
 * Output: [[15,13,2,5],
 *          [14,3,4,1],
 *          [12,6,8,9],
 *          [16,7,10,11]]
 */

/**
 * APPROACH 1: Transpose + Reverse (MOST INTUITIVE)
 *
 * Key Insights:
 * 1. Rotating 90° clockwise = Transpose + Reverse each row
 * 2. Transpose: Flip along main diagonal (swap matrix[i][j] with matrix[j][i])
 * 3. Reverse: Reverse each row left to right
 *
 * Visual:
 * [1,2,3]    Transpose    [1,4,7]    Reverse     [7,4,1]
 * [4,5,6]  ----------->   [2,5,8]  ---------->   [8,5,2]
 * [7,8,9]                 [3,6,9]                 [9,6,3]
 *
 * Time Complexity: O(n²) - visit each element once
 * Space Complexity: O(1) - in-place rotation
 */

/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 */
function rotate(matrix) {
  const n = matrix.length;

  // Step 1: Transpose the matrix (swap matrix[i][j] with matrix[j][i])
  // Only need to iterate upper triangle (i < j) to avoid swapping twice
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Swap matrix[i][j] and matrix[j][i]
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }

  // Step 2: Reverse each row
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
}

// ============================================================================
// APPROACH 2: Rotate Four Rectangles (LAYER BY LAYER)
// ============================================================================

/**
 * Rotate the matrix layer by layer from outside to inside
 *
 * Key Insight:
 * - Process matrix in concentric squares (layers)
 * - For each layer, rotate 4 elements at a time
 * - Perform cyclic rotation: top → right → bottom → left → top
 *
 * Time Complexity: O(n²)
 * Space Complexity: O(1)
 */
function rotateLayerByLayer(matrix) {
  const n = matrix.length;

  // Process layers from outside to inside
  // Only need to process n/2 layers
  for (let layer = 0; layer < Math.floor(n / 2); layer++) {
    const first = layer;
    const last = n - 1 - layer;

    // Process each element in current layer
    for (let i = first; i < last; i++) {
      const offset = i - first;

      // Save top element
      const top = matrix[first][i];

      // Move left to top
      matrix[first][i] = matrix[last - offset][first];

      // Move bottom to left
      matrix[last - offset][first] = matrix[last][last - offset];

      // Move right to bottom
      matrix[last][last - offset] = matrix[i][last];

      // Move top to right
      matrix[i][last] = top;
    }
  }
}

// ============================================================================
// APPROACH 3: Direct Position Mapping
// ============================================================================

/**
 * Calculate new position directly using mathematical formula
 *
 * For 90° clockwise rotation:
 * New position (i, j) = Old position (n-1-j, i)
 *
 * Or reverse: Old position (row, col) → New position (col, n-1-row)
 *
 * Time Complexity: O(n²)
 * Space Complexity: O(n²) - needs temp array (violates constraint)
 */
function rotateWithFormula(matrix) {
  const n = matrix.length;
  const temp = Array.from({ length: n }, () => new Array(n));

  // Copy to new position using formula
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      // After 90° clockwise rotation: (row, col) → (col, n-1-row)
      temp[col][n - 1 - row] = matrix[row][col];
    }
  }

  // Copy back to original matrix
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = temp[i][j];
    }
  }
}

// ============================================================================
// APPROACH 4: Reverse Rows + Transpose (ALTERNATIVE)
// ============================================================================

/**
 * Alternative approach: Reverse rows first, then transpose
 * This gives 90° clockwise rotation
 *
 * Time Complexity: O(n²)
 * Space Complexity: O(1)
 */
function rotateAlternative(matrix) {
  const n = matrix.length;

  // Step 1: Reverse rows (flip upside down)
  matrix.reverse();

  // Step 2: Transpose
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR OTHER ROTATIONS
// ============================================================================

/**
 * Rotate 90° counter-clockwise
 * Approach: Transpose + Reverse each column (or reverse rows + transpose)
 */
function rotateCounterClockwise(matrix) {
  const n = matrix.length;

  // Transpose
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }

  // Reverse columns (flip vertically)
  for (let col = 0; col < n; col++) {
    for (let row = 0; row < Math.floor(n / 2); row++) {
      [matrix[row][col], matrix[n - 1 - row][col]] = [
        matrix[n - 1 - row][col],
        matrix[row][col],
      ];
    }
  }
}

/**
 * Rotate 180°
 * Approach: Reverse entire matrix
 */
function rotate180(matrix) {
  const n = matrix.length;

  // Reverse all rows
  matrix.reverse();

  // Reverse each row
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

function printMatrix(matrix) {
  console.log("[");
  for (const row of matrix) {
    console.log("  " + JSON.stringify(row));
  }
  console.log("]");
}

console.log("Test Case 1: 3x3 Matrix");
const matrix1 = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
console.log("Input:");
printMatrix(matrix1);
rotate(matrix1);
console.log("Output (90° clockwise):");
printMatrix(matrix1);
console.log("Expected: [[7,4,1],[8,5,2],[9,6,3]]");
console.log();

console.log("Test Case 2: 4x4 Matrix");
const matrix2 = [
  [5, 1, 9, 11],
  [2, 4, 8, 10],
  [13, 3, 6, 7],
  [15, 14, 12, 16],
];
console.log("Input:");
printMatrix(matrix2);
rotate(matrix2);
console.log("Output (90° clockwise):");
printMatrix(matrix2);
console.log("Expected: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]");
console.log();

console.log("Test Case 3: 1x1 Matrix");
const matrix3 = [[1]];
console.log("Input:", JSON.stringify(matrix3));
rotate(matrix3);
console.log("Output:", JSON.stringify(matrix3));
console.log("Expected: [[1]]");
console.log();

console.log("Test Case 4: 2x2 Matrix");
const matrix4 = [
  [1, 2],
  [3, 4],
];
console.log("Input:", JSON.stringify(matrix4));
rotate(matrix4);
console.log("Output:", JSON.stringify(matrix4));
console.log("Expected: [[3,1],[4,2]]");
console.log();

console.log("Test Case 5: Compare Different Approaches");
const test1 = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const test2 = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const test3 = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
rotate(test1);
rotateLayerByLayer(test2);
rotateAlternative(test3);
console.log("Transpose + Reverse:", JSON.stringify(test1));
console.log("Layer by Layer:", JSON.stringify(test2));
console.log("Alternative:", JSON.stringify(test3));
console.log("All should be equal!");
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * STEP-BY-STEP WALKTHROUGH: Transpose + Reverse
 *
 * Original Matrix:
 * [1, 2, 3]
 * [4, 5, 6]
 * [7, 8, 9]
 *
 * STEP 1: TRANSPOSE (flip along main diagonal)
 *
 * Main diagonal: 1, 5, 9 (stay in place)
 *
 * Swaps to perform:
 * - Swap (0,1) with (1,0): 2 ↔ 4
 * - Swap (0,2) with (2,0): 3 ↔ 7
 * - Swap (1,2) with (2,1): 6 ↔ 8
 *
 * After transpose:
 * [1, 4, 7]  ← row 0 (was column 0)
 * [2, 5, 8]  ← row 1 (was column 1)
 * [3, 6, 9]  ← row 2 (was column 2)
 *
 * STEP 2: REVERSE EACH ROW
 *
 * Row 0: [1, 4, 7] → [7, 4, 1]
 * Row 1: [2, 5, 8] → [8, 5, 2]
 * Row 2: [3, 6, 9] → [9, 6, 3]
 *
 * Final Result:
 * [7, 4, 1]
 * [8, 5, 2]
 * [9, 6, 3]
 */

/**
 * VISUAL REPRESENTATION: Element Movement
 *
 * Original positions → Final positions (90° clockwise)
 *
 * [0,0]→[0,2]  [0,1]→[1,2]  [0,2]→[2,2]
 * [1,0]→[0,1]  [1,1]→[1,1]  [1,2]→[2,1]
 * [2,0]→[0,0]  [2,1]→[1,0]  [2,2]→[2,0]
 *
 * Pattern: (row, col) → (col, n-1-row)
 *
 * Examples:
 * - 1 at (0,0) → (0,2)
 * - 2 at (0,1) → (1,2)
 * - 3 at (0,2) → (2,2)
 * - 7 at (2,0) → (0,0)
 *
 * Visual transformation:
 *
 *   1 2 3          7 4 1
 *   4 5 6   --->   8 5 2
 *   7 8 9          9 6 3
 *
 *   ↑ ↑ ↑          ← ← ←
 *   Left column    becomes top row
 */

/**
 * LAYER-BY-LAYER APPROACH EXPLANATION:
 *
 * For a 4x4 matrix, we have 2 layers:
 *
 * Layer 0 (outer):
 * [X X X X]
 * [X . . X]
 * [X . . X]
 * [X X X X]
 *
 * Layer 1 (inner):
 * [. . . .]
 * [. X X .]
 * [. X X .]
 * [. . . .]
 *
 * For each layer, rotate 4 elements at a time in cycles:
 *
 * Example for layer 0, first cycle:
 * top = matrix[0][0]
 * matrix[0][0] = matrix[3][0]  (left → top)
 * matrix[3][0] = matrix[3][3]  (bottom → left)
 * matrix[3][3] = matrix[0][3]  (right → bottom)
 * matrix[0][3] = top           (top → right)
 *
 * This creates a circular rotation of 4 elements
 */

/**
 * UNDERSTANDING THE ROTATION FORMULAS:
 *
 * For an n×n matrix:
 *
 * 90° Clockwise:
 * (row, col) → (col, n-1-row)
 * Example: (0,1) in 3×3 → (1,2)
 *
 * 90° Counter-Clockwise:
 * (row, col) → (n-1-col, row)
 * Example: (0,1) in 3×3 → (1,0)
 *
 * 180° Rotation:
 * (row, col) → (n-1-row, n-1-col)
 * Example: (0,1) in 3×3 → (2,1)
 *
 * 270° Clockwise (same as 90° counter-clockwise):
 * (row, col) → (n-1-col, row)
 */

/**
 * WHY TRANSPOSE + REVERSE WORKS:
 *
 * Transpose: Reflects across main diagonal
 * - (i,j) → (j,i)
 *
 * [1 2 3]    Transpose    [1 4 7]
 * [4 5 6]  ----------->   [2 5 8]
 * [7 8 9]                 [3 6 9]
 *
 * Reverse each row: Mirrors horizontally
 * - (i,j) → (i, n-1-j)
 *
 * [1 4 7]    Reverse     [7 4 1]
 * [2 5 8]  ---------->   [8 5 2]
 * [3 6 9]                [9 6 3]
 *
 * Combined effect:
 * (i,j) → (j,i) → (j, n-1-i)
 *
 * This is exactly 90° clockwise rotation!
 */

/**
 * APPROACH COMPARISON:
 *
 * APPROACH 1: Transpose + Reverse
 * Pros:
 * ✓ Most intuitive
 * ✓ Easy to remember
 * ✓ Clean code
 * ✓ Uses built-in reverse()
 * Cons:
 * ✗ Two separate steps
 *
 * APPROACH 2: Layer by Layer
 * Pros:
 * ✓ Single pass
 * ✓ True in-place rotation
 * ✓ No temporary storage
 * Cons:
 * ✗ More complex logic
 * ✗ Harder to visualize
 * ✗ More error-prone
 *
 * APPROACH 3: Direct Formula
 * Pros:
 * ✓ Clear mathematical approach
 * ✓ Easy to understand mapping
 * Cons:
 * ✗ Requires O(n²) extra space
 * ✗ Violates in-place constraint
 *
 * RECOMMENDED: Approach 1 (Transpose + Reverse) for interviews
 */

/**
 * KEY INSIGHTS:
 *
 * 1. MATRIX TRANSFORMATIONS:
 *    - Transpose: Reflection across main diagonal
 *    - Reverse: Horizontal flip
 *    - Combined: 90° rotation
 *
 * 2. IN-PLACE MODIFICATION:
 *    - Must modify original matrix
 *    - Cannot use extra n×n space
 *    - Can use O(1) temp variables
 *
 * 3. SYMMETRY PROPERTIES:
 *    - Only swap upper triangle in transpose
 *    - Main diagonal elements stay in place
 *    - Process n/2 layers for layer-by-layer
 *
 * 4. MATHEMATICAL PATTERN:
 *    - 90° clockwise: (row,col) → (col, n-1-row)
 *    - Each rotation can be broken into simpler operations
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * 1. ❌ Swapping entire matrix in transpose
 *    - Only swap upper triangle (j starts from i+1)
 *    - Avoid swapping twice
 *
 * 2. ❌ Using extra n×n matrix
 *    - Problem requires in-place rotation
 *    - Only O(1) extra space allowed
 *
 * 3. ❌ Wrong rotation direction
 *    - Transpose + Reverse rows = 90° clockwise
 *    - Transpose + Reverse cols = 90° counter-clockwise
 *
 * 4. ❌ Not handling odd-sized matrices
 *    - Center element stays in place
 *    - Works naturally with correct logic
 *
 * 5. ❌ Off-by-one errors in layer approach
 *    - Careful with indices: first, last, offset
 *    - Test with small matrices (2×2, 3×3)
 *
 * 6. ❌ Modifying and reading same element
 *    - Use temp variable when swapping
 *    - Or use array destructuring: [a,b] = [b,a]
 */

/**
 * INTERVIEW TIPS:
 *
 * 1. Clarify requirements:
 *    "Should I rotate clockwise or counter-clockwise?" → Clockwise
 *    "Can I use extra space?" → No, must be in-place
 *
 * 2. Start with intuition:
 *    "I notice that after rotation, the first column becomes the first row"
 *    "This looks like a transpose followed by a horizontal flip"
 *
 * 3. Explain approach:
 *    "I'll first transpose the matrix by swapping across the diagonal"
 *    "Then reverse each row to complete the rotation"
 *
 * 4. Discuss complexity:
 *    "Time is O(n²) since we touch each element once"
 *    "Space is O(1) since we modify in-place"
 *
 * 5. Handle edge cases:
 *    "For 1×1 matrix, no rotation needed"
 *    "For 2×2, all elements move"
 *    "Works for any n×n matrix"
 *
 * 6. Mention alternatives:
 *    "Could also do layer-by-layer rotation"
 *    "But transpose + reverse is cleaner"
 */

/**
 * RELATED PROBLEMS:
 * - Rotate Array
 * - Transpose Matrix
 * - Spiral Matrix
 * - Set Matrix Zeroes
 * - Rotate List
 */

/**
 * BONUS: ALL ROTATION TYPES
 *
 * 90° Clockwise: Transpose + Reverse each row
 * 90° Counter-Clockwise: Transpose + Reverse each column
 * 180°: Reverse matrix + Reverse each row
 * 270° Clockwise: Same as 90° counter-clockwise
 */

// Export for testing
module.exports = {
  rotate,
  rotateLayerByLayer,
  rotateWithFormula,
  rotateAlternative,
  rotateCounterClockwise,
  rotate180,
};
