/**
 * Valid Sudoku - LeetCode Problem
 * Difficulty: Medium
 * 
 * Problem: Determine if a 9x9 Sudoku board is valid. Only the filled cells need to be validated 
 * according to the following rules:
 * 
 * 1. Each row must contain the digits 1-9 without repetition.
 * 2. Each column must contain the digits 1-9 without repetition.
 * 3. Each of the nine 3x3 sub-boxes must contain the digits 1-9 without repetition.
 * 
 * Note:
 * - A Sudoku board (partially filled) could be valid but is not necessarily solvable.
 * - Only the filled cells need to be validated according to the rules.
 * - Empty cells are represented by '.'
 * 
 * Example 1:
 * Input: board = 
 * [["5","3",".",".","7",".",".",".","."]
 * ,["6",".",".","1","9","5",".",".","."]
 * ,[".","9","8",".",".",".",".","6","."]
 * ,["8",".",".",".","6",".",".",".","3"]
 * ,["4",".",".","8",".","3",".",".","1"]
 * ,["7",".",".",".","2",".",".",".","6"]
 * ,[".","6",".",".",".",".","2","8","."]
 * ,[".",".",".","4","1","9",".",".","5"]
 * ,[".",".",".",".","8",".",".","7","9"]]
 * Output: true
 * 
 * Example 2:
 * Input: board = 
 * [["8","3",".",".","7",".",".",".","."]
 * ,["6",".",".","1","9","5",".",".","."]
 * ,[".","9","8",".",".",".",".","6","."]
 * ,["8",".",".",".","6",".",".",".","3"]
 * ,["4",".",".","8",".","3",".",".","1"]
 * ,["7",".",".",".","2",".",".",".","6"]
 * ,[".","6",".",".",".",".","2","8","."]
 * ,[".",".",".","4","1","9",".",".","5"]
 * ,[".",".",".",".","8",".",".","7","9"]]
 * Output: false
 * Explanation: Same as Example 1, except first row has two 8's.
 */

/**
 * APPROACH 1: Three Separate Hash Sets (MOST INTUITIVE)
 * 
 * Key Insights:
 * 1. Use separate sets for rows, columns, and boxes
 * 2. Single pass through the board
 * 3. Check for duplicates in each set
 * 4. Box index calculation: (row / 3) * 3 + (col / 3)
 * 
 * Time Complexity: O(1) - fixed 9x9 board = 81 cells
 * Space Complexity: O(1) - fixed size sets (max 9 digits each)
 */

/**
 * @param {character[][]} board
 * @return {boolean}
 */
function isValidSudoku(board) {
    // Create 9 sets for rows, 9 for columns, 9 for 3x3 boxes
    const rows = Array.from({ length: 9 }, () => new Set());
    const cols = Array.from({ length: 9 }, () => new Set());
    const boxes = Array.from({ length: 9 }, () => new Set());
    
    // Traverse the entire board
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const num = board[row][col];
            
            // Skip empty cells
            if (num === '.') {
                continue;
            }
            
            // Calculate which 3x3 box this cell belongs to
            // Box numbering: 0-8, left to right, top to bottom
            const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
            
            // Check if number already exists in row, column, or box
            if (rows[row].has(num) || cols[col].has(num) || boxes[boxIndex].has(num)) {
                return false; // Duplicate found
            }
            
            // Add number to respective sets
            rows[row].add(num);
            cols[col].add(num);
            boxes[boxIndex].add(num);
        }
    }
    
    return true; // No duplicates found
}

// ============================================================================
// APPROACH 2: Single Hash Set with Encoded Keys (OPTIMAL)
// ============================================================================

/**
 * Use a single set with encoded strings to track all seen values
 * 
 * Key Insight:
 * - Encode position and value into unique strings
 * - Example: "row 0 has 5", "col 3 has 5", "box 1 has 5"
 * 
 * Time Complexity: O(1) - fixed 9x9 board
 * Space Complexity: O(1) - fixed size set
 */
function isValidSudokuOptimized(board) {
    const seen = new Set();
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const num = board[row][col];
            
            if (num === '.') {
                continue;
            }
            
            // Create unique keys for row, column, and box
            const rowKey = `row${row}-${num}`;
            const colKey = `col${col}-${num}`;
            const boxKey = `box${Math.floor(row / 3)}-${Math.floor(col / 3)}-${num}`;
            
            // Check if any key already exists
            if (seen.has(rowKey) || seen.has(colKey) || seen.has(boxKey)) {
                return false;
            }
            
            // Add all keys to the set
            seen.add(rowKey);
            seen.add(colKey);
            seen.add(boxKey);
        }
    }
    
    return true;
}

// ============================================================================
// APPROACH 3: Bit Manipulation (ADVANCED)
// ============================================================================

/**
 * Use bit masks to track seen numbers
 * Each bit represents whether a digit (1-9) has been seen
 * 
 * Time Complexity: O(1)
 * Space Complexity: O(1) - just 27 integers
 */
function isValidSudokuBitmask(board) {
    // Arrays to store bitmasks for rows, cols, and boxes
    const rows = new Array(9).fill(0);
    const cols = new Array(9).fill(0);
    const boxes = new Array(9).fill(0);
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const num = board[row][col];
            
            if (num === '.') {
                continue;
            }
            
            const digit = parseInt(num);
            const bit = 1 << digit; // Create bit mask for this digit
            const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
            
            // Check if bit is already set (number already seen)
            if ((rows[row] & bit) || (cols[col] & bit) || (boxes[boxIndex] & bit)) {
                return false;
            }
            
            // Set the bit (mark number as seen)
            rows[row] |= bit;
            cols[col] |= bit;
            boxes[boxIndex] |= bit;
        }
    }
    
    return true;
}

// ============================================================================
// APPROACH 4: Separate Validation Functions (VERBOSE BUT CLEAR)
// ============================================================================

/**
 * Break down validation into separate helper functions
 * More readable but less efficient
 */
function isValidSudokuVerbose(board) {
    // Check all rows
    for (let row = 0; row < 9; row++) {
        if (!isValidUnit(board[row])) {
            return false;
        }
    }
    
    // Check all columns
    for (let col = 0; col < 9; col++) {
        const column = [];
        for (let row = 0; row < 9; row++) {
            column.push(board[row][col]);
        }
        if (!isValidUnit(column)) {
            return false;
        }
    }
    
    // Check all 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
            const box = [];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    box.push(board[boxRow * 3 + i][boxCol * 3 + j]);
                }
            }
            if (!isValidUnit(box)) {
                return false;
            }
        }
    }
    
    return true;
}

// Helper function to check if a unit (row/col/box) is valid
function isValidUnit(unit) {
    const seen = new Set();
    for (const num of unit) {
        if (num === '.') {
            continue;
        }
        if (seen.has(num)) {
            return false;
        }
        seen.add(num);
    }
    return true;
}

// ============================================================================
// TEST CASES
// ============================================================================

const validBoard1 = [
    ["5","3",".",".","7",".",".",".","."],
    ["6",".",".","1","9","5",".",".","."],
    [".","9","8",".",".",".",".","6","."],
    ["8",".",".",".","6",".",".",".","3"],
    ["4",".",".","8",".","3",".",".","1"],
    ["7",".",".",".","2",".",".",".","6"],
    [".","6",".",".",".",".","2","8","."],
    [".",".",".","4","1","9",".",".","5"],
    [".",".",".",".","8",".",".","7","9"]
];

const invalidBoard1 = [
    ["8","3",".",".","7",".",".",".","."],
    ["6",".",".","1","9","5",".",".","."],
    [".","9","8",".",".",".",".","6","."],
    ["8",".",".",".","6",".",".",".","3"],
    ["4",".",".","8",".","3",".",".","1"],
    ["7",".",".",".","2",".",".",".","6"],
    [".","6",".",".",".",".","2","8","."],
    [".",".",".","4","1","9",".",".","5"],
    [".",".",".",".","8",".",".","7","9"]
];

const invalidBoard2 = [
    [".",".",".",".","5",".",".","1","."],
    [".","4",".","3",".",".",".",".","."],
    [".",".",".",".",".","3",".",".","1"],
    ["8",".",".",".",".",".",".","2","."],
    [".",".","2",".","7",".",".",".","."],
    [".","1","5",".",".",".",".",".","."],
    [".",".",".",".",".","2",".",".","."],
    [".","2",".","9",".",".",".",".","."],
    [".",".","4",".",".",".",".",".","."]
];

console.log('Test Case 1 (Valid Board):');
console.log('Output:', isValidSudoku(validBoard1));
console.log('Expected: true');
console.log();

console.log('Test Case 2 (Invalid - Duplicate in row):');
console.log('Output:', isValidSudoku(invalidBoard1));
console.log('Expected: false (two 8s in first column)');
console.log();

console.log('Test Case 3 (Invalid - Duplicate in column):');
console.log('Output:', isValidSudoku(invalidBoard2));
console.log('Expected: false (two 2s in second column)');
console.log();

// Test all approaches give same results
console.log('Comparing Approaches on Valid Board:');
console.log('Approach 1 (Three Sets):', isValidSudoku(validBoard1));
console.log('Approach 2 (Single Set):', isValidSudokuOptimized(validBoard1));
console.log('Approach 3 (Bitmask):', isValidSudokuBitmask(validBoard1));
console.log('Approach 4 (Verbose):', isValidSudokuVerbose(validBoard1));
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * UNDERSTANDING THE 3x3 BOX INDEX CALCULATION:
 * 
 * The board is divided into 9 boxes, numbered 0-8:
 * 
 *  +-------+-------+-------+
 *  | 0 0 0 | 1 1 1 | 2 2 2 |
 *  | 0 0 0 | 1 1 1 | 2 2 2 |
 *  | 0 0 0 | 1 1 1 | 2 2 2 |
 *  +-------+-------+-------+
 *  | 3 3 3 | 4 4 4 | 5 5 5 |
 *  | 3 3 3 | 4 4 4 | 5 5 5 |
 *  | 3 3 3 | 4 4 4 | 5 5 5 |
 *  +-------+-------+-------+
 *  | 6 6 6 | 7 7 7 | 8 8 8 |
 *  | 6 6 6 | 7 7 7 | 8 8 8 |
 *  | 6 6 6 | 7 7 7 | 8 8 8 |
 *  +-------+-------+-------+
 * 
 * Formula: boxIndex = (row / 3) * 3 + (col / 3)
 * 
 * Examples:
 * - Cell (0,0): (0/3)*3 + (0/3) = 0*3 + 0 = 0 ✓
 * - Cell (0,4): (0/3)*3 + (4/3) = 0*3 + 1 = 1 ✓
 * - Cell (4,4): (4/3)*3 + (4/3) = 1*3 + 1 = 4 ✓
 * - Cell (7,8): (7/3)*3 + (8/3) = 2*3 + 2 = 8 ✓
 * 
 * Why this works:
 * - row / 3 gives us which horizontal band (0, 1, or 2)
 * - Multiply by 3 to get starting box of that band
 * - col / 3 gives us offset within that band (0, 1, or 2)
 */

/**
 * STEP-BY-STEP WALKTHROUGH:
 * 
 * Example: Check if board is valid
 * 
 * Initial State:
 * rows[0..8] = [Set(), Set(), ..., Set()]
 * cols[0..8] = [Set(), Set(), ..., Set()]
 * boxes[0..8] = [Set(), Set(), ..., Set()]
 * 
 * Process cell (0,0) = '5':
 *   boxIndex = (0/3)*3 + (0/3) = 0
 *   Check: rows[0].has('5')? No
 *          cols[0].has('5')? No
 *          boxes[0].has('5')? No
 *   Add: rows[0].add('5')
 *        cols[0].add('5')
 *        boxes[0].add('5')
 * 
 * Process cell (0,1) = '3':
 *   boxIndex = (0/3)*3 + (1/3) = 0
 *   Check: rows[0].has('3')? No
 *          cols[1].has('3')? No
 *          boxes[0].has('3')? No
 *   Add: rows[0].add('3')
 *        cols[1].add('3')
 *        boxes[0].add('3')
 * 
 * Process cell (0,2) = '.':
 *   Skip empty cell
 * 
 * Continue for all 81 cells...
 * 
 * If at any point we find a duplicate:
 *   Return false immediately
 * 
 * If we process all cells without finding duplicates:
 *   Return true
 */

/**
 * VISUAL EXAMPLE - INVALID BOARD:
 * 
 * Board with duplicate '8' in first column:
 * 
 *  +-------+-------+-------+
 *  | 8 3 . | . 7 . | . . . |  ← First 8
 *  | 6 . . | 1 9 5 | . . . |
 *  | . 9 8 | . . . | . 6 . |
 *  +-------+-------+-------+
 *  | 8 . . | . 6 . | . . 3 |  ← Second 8 (same column!)
 *  | 4 . . | 8 . 3 | . . 1 |
 *  | 7 . . | . 2 . | . . 6 |
 *  +-------+-------+-------+
 *  | . 6 . | . . . | 2 8 . |
 *  | . . . | 4 1 9 | . . 5 |
 *  | . . . | . 8 . | . 7 9 |
 *  +-------+-------+-------+
 * 
 * When processing cell (3,0) = '8':
 *   cols[0].has('8')? YES! (from row 0)
 *   Return false immediately
 */

/**
 * APPROACH COMPARISON:
 * 
 * APPROACH 1: Three Separate Sets
 * Pros:
 * ✓ Most intuitive and readable
 * ✓ Easy to debug (can inspect each set)
 * ✓ Clear separation of concerns
 * Cons:
 * ✗ More memory (27 sets total)
 * 
 * APPROACH 2: Single Set with Keys
 * Pros:
 * ✓ Single data structure
 * ✓ Still very readable
 * ✓ Elegant encoding scheme
 * Cons:
 * ✗ String concatenation overhead
 * 
 * APPROACH 3: Bit Manipulation
 * Pros:
 * ✓ Most memory efficient
 * ✓ Fastest operations
 * ✓ No string operations
 * Cons:
 * ✗ Less readable
 * ✗ Requires bit manipulation knowledge
 * 
 * APPROACH 4: Separate Functions
 * Pros:
 * ✓ Very clear logic flow
 * ✓ Easy to test each part
 * Cons:
 * ✗ Multiple passes through board
 * ✗ More code
 * 
 * RECOMMENDED: Approach 1 for interviews (clear and efficient)
 */

/**
 * KEY INSIGHTS:
 * 
 * 1. HASH SET FOR DUPLICATE DETECTION:
 *    - O(1) insertion and lookup
 *    - Perfect for checking "have we seen this before?"
 * 
 * 2. SINGLE PASS OPTIMIZATION:
 *    - Check rows, columns, and boxes simultaneously
 *    - No need for multiple passes
 * 
 * 3. BOX INDEX FORMULA:
 *    - Mathematical relationship between position and box
 *    - Eliminates need for manual box mapping
 * 
 * 4. EARLY TERMINATION:
 *    - Return false as soon as duplicate found
 *    - No need to check rest of board
 * 
 * 5. SKIP EMPTY CELLS:
 *    - '.' represents empty, not a validation concern
 *    - Only validate filled cells
 */

/**
 * COMMON MISTAKES TO AVOID:
 * 
 * 1. ❌ Checking if board is solvable
 *    - Problem only asks for VALIDITY, not solvability
 *    - Valid board might not have a solution
 * 
 * 2. ❌ Wrong box index calculation
 *    - Must use integer division: Math.floor()
 *    - Formula: (row/3)*3 + (col/3)
 * 
 * 3. ❌ Not handling empty cells
 *    - Must skip '.' cells
 *    - Only validate actual numbers
 * 
 * 4. ❌ Creating too many data structures
 *    - Reuse sets across iterations
 *    - Don't create new sets in loop
 * 
 * 5. ❌ Validating range of numbers
 *    - Problem guarantees valid digits or '.'
 *    - No need to check if number is 1-9
 * 
 * 6. ❌ Using arrays instead of sets
 *    - Array lookup is O(n)
 *    - Set lookup is O(1)
 */

/**
 * INTERVIEW TIPS:
 * 
 * 1. Clarify requirements:
 *    "Do I need to solve the Sudoku?" → No, just validate
 *    "What about empty cells?" → Skip them
 * 
 * 2. Explain approach:
 *    "I'll use hash sets to track seen numbers"
 *    "Need to check rows, columns, and 3x3 boxes"
 * 
 * 3. Discuss box indexing:
 *    "For 3x3 boxes, I can calculate index using (row/3)*3 + (col/3)"
 *    "This maps each cell to its box number 0-8"
 * 
 * 4. Mention optimization:
 *    "Single pass through board checking all three constraints"
 *    "Early termination when duplicate found"
 * 
 * 5. Handle edge cases:
 *    "Empty board is valid"
 *    "All empty cells is valid"
 *    "Only one number filled is valid"
 */

/**
 * RELATED PROBLEMS:
 * - Sudoku Solver (Hard)
 * - Valid Tic-Tac-Toe State
 * - N-Queens
 * - Matrix Traversal problems
 */

// Export for testing
module.exports = { 
    isValidSudoku,
    isValidSudokuOptimized,
    isValidSudokuBitmask,
    isValidSudokuVerbose
};
