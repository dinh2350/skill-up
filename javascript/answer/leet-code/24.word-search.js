/**
 * 24. Word Search
 * Difficulty: Medium
 * Topics: Array, Backtracking, Matrix, DFS
 *
 * Problem: Given an m x n grid of characters and a string word,
 * return true if word exists in the grid.
 *
 * The word can be constructed from letters of sequentially adjacent cells,
 * where adjacent cells are horizontally or vertically neighboring.
 * The same letter cell may not be used more than once.
 *
 * Key Insights:
 * - This is a BACKTRACKING problem
 * - Try all possible paths from each cell
 * - Mark cells as visited, then unmark (backtrack)
 * - DFS with 4 directions
 */

// ============================================
// APPROACH 1: Backtracking (Classic Solution)
// ============================================
/**
 * Time Complexity: O(m × n × 4^L) where L = word.length
 *   - Try starting from each cell: m × n
 *   - Each cell explores 4 directions
 *   - Maximum depth is word length
 *
 * Space Complexity: O(L) for recursion stack
 *
 * Algorithm:
 * 1. Try each cell as starting point
 * 2. DFS to match word character by character
 * 3. Mark visited cells temporarily
 * 4. Backtrack if path doesn't work
 */
function exist_Backtracking(board, word) {
  if (!board || board.length === 0) return false;

  const rows = board.length;
  const cols = board[0].length;

  // DFS with backtracking
  function backtrack(row, col, index) {
    // Base case: found entire word
    if (index === word.length) return true;

    // Check boundaries and character match
    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      board[row][col] !== word[index]
    ) {
      return false;
    }

    // Mark as visited (temporarily modify board)
    const temp = board[row][col];
    board[row][col] = "#"; // or any non-letter character

    // Explore all 4 directions
    const found =
      backtrack(row - 1, col, index + 1) || // Up
      backtrack(row + 1, col, index + 1) || // Down
      backtrack(row, col - 1, index + 1) || // Left
      backtrack(row, col + 1, index + 1); // Right

    // Backtrack: restore original value
    board[row][col] = temp;

    return found;
  }

  // Try starting from each cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (backtrack(row, col, 0)) {
        return true;
      }
    }
  }

  return false;
}

// ============================================
// APPROACH 2: Backtracking with Visited Set
// ============================================
/**
 * Time Complexity: O(m × n × 4^L)
 * Space Complexity: O(L) + O(L) for visited set
 *
 * Preserves original board using visited set
 */
function exist_VisitedSet(board, word) {
  if (!board || board.length === 0) return false;

  const rows = board.length;
  const cols = board[0].length;

  function backtrack(row, col, index, visited) {
    if (index === word.length) return true;

    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      board[row][col] !== word[index]
    ) {
      return false;
    }

    const key = `${row},${col}`;
    if (visited.has(key)) return false;

    visited.add(key);

    const found =
      backtrack(row - 1, col, index + 1, visited) ||
      backtrack(row + 1, col, index + 1, visited) ||
      backtrack(row, col - 1, index + 1, visited) ||
      backtrack(row, col + 1, index + 1, visited);

    visited.delete(key); // Backtrack

    return found;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (backtrack(row, col, 0, new Set())) {
        return true;
      }
    }
  }

  return false;
}

// ============================================
// APPROACH 3: Optimized with Early Termination
// ============================================
/**
 * Time Complexity: O(m × n × 4^L) - but faster in practice
 * Space Complexity: O(L)
 *
 * Optimizations:
 * - Check if board has all required characters
 * - Start from less frequent character
 * - Early termination checks
 */
function exist_Optimized(board, word) {
  if (!board || board.length === 0 || !word) return false;

  const rows = board.length;
  const cols = board[0].length;

  // Optimization 1: Count characters in board
  const boardChars = new Map();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const char = board[row][col];
      boardChars.set(char, (boardChars.get(char) || 0) + 1);
    }
  }

  // Optimization 2: Check if all word characters exist
  const wordChars = new Map();
  for (const char of word) {
    wordChars.set(char, (wordChars.get(char) || 0) + 1);
  }

  for (const [char, count] of wordChars) {
    if (!boardChars.has(char) || boardChars.get(char) < count) {
      return false; // Not enough characters
    }
  }

  // Optimization 3: Search from less frequent end
  // If last char is less frequent, reverse word
  const firstCount = boardChars.get(word[0]) || 0;
  const lastCount = boardChars.get(word[word.length - 1]) || 0;

  let searchWord = word;
  if (lastCount < firstCount) {
    searchWord = word.split("").reverse().join("");
  }

  function backtrack(row, col, index) {
    if (index === searchWord.length) return true;

    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      board[row][col] !== searchWord[index]
    ) {
      return false;
    }

    const temp = board[row][col];
    board[row][col] = "#";

    const found =
      backtrack(row - 1, col, index + 1) ||
      backtrack(row + 1, col, index + 1) ||
      backtrack(row, col - 1, index + 1) ||
      backtrack(row, col + 1, index + 1);

    board[row][col] = temp;
    return found;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col] === searchWord[0] && backtrack(row, col, 0)) {
        return true;
      }
    }
  }

  return false;
}

// ============================================
// APPROACH 4: Direction Array Pattern
// ============================================
/**
 * Time Complexity: O(m × n × 4^L)
 * Space Complexity: O(L)
 *
 * Cleaner code with direction arrays
 */
function exist_DirectionArray(board, word) {
  if (!board || board.length === 0) return false;

  const rows = board.length;
  const cols = board[0].length;
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]; // up, down, left, right

  function backtrack(row, col, index) {
    if (index === word.length) return true;

    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      board[row][col] !== word[index]
    ) {
      return false;
    }

    const temp = board[row][col];
    board[row][col] = "#";

    for (const [dRow, dCol] of directions) {
      if (backtrack(row + dRow, col + dCol, index + 1)) {
        board[row][col] = temp;
        return true;
      }
    }

    board[row][col] = temp;
    return false;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (backtrack(row, col, 0)) {
        return true;
      }
    }
  }

  return false;
}

// ============================================
// APPROACH 5: Iterative DFS with Stack
// ============================================
/**
 * Time Complexity: O(m × n × 4^L)
 * Space Complexity: O(L)
 *
 * Avoids recursion using explicit stack
 */
function exist_Iterative(board, word) {
  if (!board || board.length === 0) return false;

  const rows = board.length;
  const cols = board[0].length;
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let startRow = 0; startRow < rows; startRow++) {
    for (let startCol = 0; startCol < cols; startCol++) {
      if (board[startRow][startCol] !== word[0]) continue;

      // Stack: [row, col, index, visited]
      const stack = [
        [startRow, startCol, 0, new Set([`${startRow},${startCol}`])],
      ];

      while (stack.length > 0) {
        const [row, col, index, visited] = stack.pop();

        if (index === word.length - 1) {
          return true;
        }

        for (const [dRow, dCol] of directions) {
          const newRow = row + dRow;
          const newCol = col + dCol;
          const newIndex = index + 1;
          const key = `${newRow},${newCol}`;

          if (
            newRow >= 0 &&
            newRow < rows &&
            newCol >= 0 &&
            newCol < cols &&
            !visited.has(key) &&
            board[newRow][newCol] === word[newIndex]
          ) {
            const newVisited = new Set(visited);
            newVisited.add(key);
            stack.push([newRow, newCol, newIndex, newVisited]);
          }
        }
      }
    }
  }

  return false;
}

// ============================================
// VISUAL WALKTHROUGH
// ============================================
/**
 * Example: Find "ABCCED"
 *
 * Board:
 *   0 1 2 3
 * 0 A B C E
 * 1 S F C S
 * 2 A D E E
 *
 * Step-by-step DFS from (0,0):
 * ════════════════════════════════════════
 *
 * Initial: Looking for 'A' (index 0)
 * Start at (0,0) = 'A' ✓
 *
 * Step 1: Match 'A' at (0,0)
 * ┌────────────────────────────────────┐
 * │ Position: (0,0)                    │
 * │ Character: 'A' = word[0] ✓         │
 * │ Mark visited: board[0][0] = '#'    │
 * │ Looking for: 'B' (index 1)         │
 * │ Try directions: ↑ ↓ ← →           │
 * └────────────────────────────────────┘
 *
 * Board state:
 *   # B C E
 *   S F C S
 *   A D E E
 *
 * Try Up (−1,0): out of bounds ✗
 * Try Down (1,0): 'S' ≠ 'B' ✗
 * Try Left (0,−1): out of bounds ✗
 * Try Right (0,1): 'B' = 'B' ✓ → Continue!
 *
 * Step 2: Match 'B' at (0,1)
 * ┌────────────────────────────────────┐
 * │ Position: (0,1)                    │
 * │ Character: 'B' = word[1] ✓         │
 * │ Mark visited: board[0][1] = '#'    │
 * │ Looking for: 'C' (index 2)         │
 * └────────────────────────────────────┘
 *
 * Board state:
 *   # # C E
 *   S F C S
 *   A D E E
 *
 * Try Up: out of bounds ✗
 * Try Down (1,1): 'F' ≠ 'C' ✗
 * Try Left (0,0): '#' (visited) ✗
 * Try Right (0,2): 'C' = 'C' ✓ → Continue!
 *
 * Step 3: Match 'C' at (0,2)
 * ┌────────────────────────────────────┐
 * │ Position: (0,2)                    │
 * │ Character: 'C' = word[2] ✓         │
 * │ Mark visited: board[0][2] = '#'    │
 * │ Looking for: 'C' (index 3)         │
 * └────────────────────────────────────┘
 *
 * Board state:
 *   # # # E
 *   S F C S
 *   A D E E
 *
 * Try Up: out of bounds ✗
 * Try Down (1,2): 'C' = 'C' ✓ → Continue!
 *
 * Step 4: Match 'C' at (1,2)
 * ┌────────────────────────────────────┐
 * │ Position: (1,2)                    │
 * │ Character: 'C' = word[3] ✓         │
 * │ Mark visited: board[1][2] = '#'    │
 * │ Looking for: 'E' (index 4)         │
 * └────────────────────────────────────┘
 *
 * Board state:
 *   # # # E
 *   S F # S
 *   A D E E
 *
 * Try Up (0,2): '#' (visited) ✗
 * Try Down (2,2): 'E' = 'E' ✓ → Continue!
 *
 * Step 5: Match 'E' at (2,2)
 * ┌────────────────────────────────────┐
 * │ Position: (2,2)                    │
 * │ Character: 'E' = word[4] ✓         │
 * │ Mark visited: board[2][2] = '#'    │
 * │ Looking for: 'D' (index 5)         │
 * └────────────────────────────────────┘
 *
 * Board state:
 *   # # # E
 *   S F # S
 *   A D # E
 *
 * Try Up (1,2): '#' (visited) ✗
 * Try Down: out of bounds ✗
 * Try Left (2,1): 'D' = 'D' ✓ → Continue!
 *
 * Step 6: Match 'D' at (2,1)
 * ┌────────────────────────────────────┐
 * │ Position: (2,1)                    │
 * │ Character: 'D' = word[5] ✓         │
 * │ Index = 6 = word.length            │
 * │ FOUND! Return true ✓               │
 * └────────────────────────────────────┘
 *
 * Path found: A(0,0) → B(0,1) → C(0,2) → C(1,2) → E(2,2) → D(2,1)
 *
 * Result: true ✓
 */

// ============================================
// BACKTRACKING VISUALIZATION
// ============================================
/**
 * Example showing BACKTRACKING when path fails:
 *
 * Board:
 *   A B C
 *   D E F
 *
 * Looking for "AEX"
 *
 * Attempt 1: Start at (0,0)
 * ─────────────────────────
 * Step 1: (0,0) 'A' ✓
 *   # B C
 *   D E F
 *
 * Step 2: Try Down (1,0) 'D' ≠ 'E' ✗
 * Step 2: Try Right (0,1) 'B' ≠ 'E' ✗
 *
 * BACKTRACK: Restore (0,0) to 'A'
 *   A B C
 *   D E F
 *
 * Path from (0,0) failed!
 *
 * Attempt 2: Try starting from (1,1)
 * ─────────────────────────
 * (1,1) = 'E' ≠ 'A' ✗
 * Skip!
 *
 * ... Continue searching all positions
 *
 * Result: false (word doesn't exist)
 *
 * Key Insight: Backtracking allows us to:
 * 1. Mark cells as visited
 * 2. Try a path
 * 3. If it fails, UNMARK cells
 * 4. Try different path
 */

// ============================================
// COMPLEXITY ANALYSIS
// ============================================
/**
 * Time Complexity: O(m × n × 4^L)
 *
 * Breakdown:
 * - m × n: Try each cell as starting point
 * - 4^L: At each step, try 4 directions
 *   - First char: 4 choices
 *   - Second char: 3 choices (can't go back)
 *   - But worst case analysis uses 4
 *   - Depth is L (word length)
 *
 * Practical Performance:
 * - Much better than worst case
 * - Pruning happens early (character mismatch)
 * - Visited cells reduce branching factor
 *
 * Space Complexity: O(L)
 * - Recursion stack depth = word length
 * - If using visited set: O(L) additional space
 * - Approach 1 modifies board: O(1) extra space
 *
 * Optimization Impact:
 * - Character counting: O(m × n + L) preprocessing
 * - Saves time by avoiding impossible searches
 * - Reversing word: can reduce search space significantly
 */

// ============================================
// COMMON MISTAKES
// ============================================
/**
 * 1. ❌ Not marking cells as visited
 *    Will cause infinite loops and reuse cells!
 *    Must: board[row][col] = '#'
 *
 * 2. ❌ Forgetting to backtrack (restore cell)
 *    Other paths won't be able to use the cell!
 *    Must: board[row][col] = temp (after recursive calls)
 *
 * 3. ❌ Wrong base case
 *    Should check: index === word.length
 *    Not: index === word.length - 1
 *
 * 4. ❌ Checking visited after recursion
 *    Should check BEFORE entering recursion
 *
 * 5. ❌ Using OR (||) incorrectly
 *    Correct: found = dfs(...) || dfs(...) || dfs(...) || dfs(...)
 *    This ensures all paths are tried
 *
 * 6. ❌ Not restoring board when returning true
 *    Even when found, must restore for other test cases!
 *
 * 7. ❌ Diagonal movement
 *    Only horizontal and vertical, NOT diagonal!
 *
 * 8. ❌ Modifying word instead of tracking index
 *    Keep word immutable, use index parameter
 *
 * 9. ❌ Early return in loop without backtracking
 *    Must complete backtracking before returning
 */

// ============================================
// INTERVIEW TIPS
// ============================================
/**
 * 1. Clarify the problem
 *    - "Can I use same cell twice?" (No)
 *    - "Only horizontal/vertical?" (Yes, no diagonal)
 *    - "Case sensitive?" (Usually yes)
 *    - "Empty word or board?" (Handle edge cases)
 *
 * 2. Explain backtracking
 *    "I'll use backtracking - try a path, mark cells as visited,
 *    and if it doesn't work, unmark and try a different path.
 *    This explores all possible paths without reusing cells."
 *
 * 3. Start with simple approach
 *    - Begin with Approach 1 (classic backtracking)
 *    - Show you understand the core algorithm
 *    - Mention optimizations if time permits
 *
 * 4. Walk through example
 *    Draw the board and show step-by-step how you:
 *    - Start at first matching cell
 *    - Mark as visited
 *    - Try 4 directions
 *    - Backtrack when needed
 *
 * 5. Discuss optimizations
 *    - "I could count characters first to fail fast"
 *    - "Starting from less frequent character helps"
 *    - "Early termination when characters don't match"
 *
 * 6. Handle edge cases
 *    - Empty board or word
 *    - Word longer than board cells
 *    - Single character word/board
 *    - Word not in board
 *
 * 7. Test your code
 *    Mentally trace through a small example
 */

// ============================================
// EDGE CASES
// ============================================
function testEdgeCases() {
  console.log("\n=== Edge Cases ===\n");

  // Case 1: Empty board
  console.log("Case 1: Empty board");
  console.log('Input: [], word = "A"');
  console.log("Expected: false");
  console.log("Output:", exist_Backtracking([], "A"));
  console.log();

  // Case 2: Empty word
  console.log("Case 2: Empty word");
  const board2 = [
    ["A", "B"],
    ["C", "D"],
  ];
  console.log('Input: board, word = ""');
  console.log("Expected: true (or false, depends on definition)");
  console.log("Output:", exist_Backtracking(board2, ""));
  console.log();

  // Case 3: Single cell, matching
  console.log("Case 3: Single cell matching");
  console.log('Input: [["A"]], word = "A"');
  console.log("Expected: true");
  console.log("Output:", exist_Backtracking([["A"]], "A"));
  console.log();

  // Case 4: Single cell, not matching
  console.log("Case 4: Single cell not matching");
  console.log('Input: [["A"]], word = "B"');
  console.log("Expected: false");
  console.log("Output:", exist_Backtracking([["A"]], "B"));
  console.log();

  // Case 5: Word longer than board
  console.log("Case 5: Word longer than board");
  const board5 = [["A", "B"]];
  console.log('Input: [["A","B"]], word = "ABCD"');
  console.log("Expected: false");
  console.log("Output:", exist_Backtracking(board5, "ABCD"));
  console.log();

  // Case 6: All same characters
  console.log("Case 6: All same characters");
  const board6 = [
    ["A", "A", "A"],
    ["A", "A", "A"],
  ];
  console.log('Input: all A\'s, word = "AAA"');
  console.log("Expected: true");
  console.log("Output:", exist_Backtracking(board6, "AAA"));
  console.log();

  // Case 7: Requires backtracking
  console.log("Case 7: Requires backtracking");
  const board7 = [
    ["A", "B", "C"],
    ["D", "E", "F"],
  ];
  console.log('Input: board, word = "ABFEDA"');
  console.log("Expected: false (would need to reuse cells)");
  console.log("Output:", exist_Backtracking(board7, "ABFEDA"));
  console.log();
}

// ============================================
// TEST CASES
// ============================================
function runTests() {
  console.log("=== Word Search - Backtracking ===\n");

  const testCases = [
    {
      board: [
        ["A", "B", "C", "E"],
        ["S", "F", "C", "S"],
        ["A", "D", "E", "E"],
      ],
      word: "ABCCED",
      expected: true,
      description: "Standard case - word exists",
    },
    {
      board: [
        ["A", "B", "C", "E"],
        ["S", "F", "C", "S"],
        ["A", "D", "E", "E"],
      ],
      word: "SEE",
      expected: true,
      description: "Short word",
    },
    {
      board: [
        ["A", "B", "C", "E"],
        ["S", "F", "C", "S"],
        ["A", "D", "E", "E"],
      ],
      word: "ABCB",
      expected: false,
      description: "Would require reusing cells",
    },
    {
      board: [["A"]],
      word: "A",
      expected: true,
      description: "Single cell match",
    },
    {
      board: [
        ["C", "A", "A"],
        ["A", "A", "A"],
        ["B", "C", "D"],
      ],
      word: "AAB",
      expected: true,
      description: "Multiple same characters",
    },
    {
      board: [
        ["A", "B"],
        ["C", "D"],
      ],
      word: "ABDC",
      expected: false,
      description: "Invalid path",
    },
  ];

  testCases.forEach((test, index) => {
    console.log(`Test Case ${index + 1}: ${test.description}`);
    console.log("Board:");
    test.board.forEach((row) => console.log("  ", row.join(" ")));
    console.log(`Word: "${test.word}"`);
    console.log(`Expected: ${test.expected}`);

    // Test all approaches
    const approaches = [
      { name: "Backtracking", fn: exist_Backtracking },
      { name: "Visited Set", fn: exist_VisitedSet },
      { name: "Optimized", fn: exist_Optimized },
      { name: "Direction Array", fn: exist_DirectionArray },
    ];

    approaches.forEach((approach) => {
      // Create deep copy for each test
      const boardCopy = test.board.map((row) => [...row]);
      const result = approach.fn(boardCopy, test.word);
      console.log(
        `${approach.name}: ${result} ${result === test.expected ? "✓" : "✗"}`
      );
    });

    console.log();
  });

  testEdgeCases();
}

// ============================================
// VISUALIZATION WITH PATH TRACKING
// ============================================
function visualizeSearch(board, word) {
  console.log("\n=== Search Visualization ===\n");
  console.log("Board:");
  board.forEach((row, i) => console.log(`  ${i}: ${row.join(" ")}`));
  console.log(`\nSearching for: "${word}"\n`);

  const rows = board.length;
  const cols = board[0].length;
  let steps = 0;

  function backtrack(row, col, index, path) {
    steps++;

    if (index === word.length) {
      console.log("✓ FOUND! Path:");
      path.forEach(([r, c], i) => {
        console.log(
          `  ${i + 1}. (${r},${c}) = '${board[r][c]}' → '${word[i]}'`
        );
      });
      return true;
    }

    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      board[row][col] !== word[index]
    ) {
      return false;
    }

    const temp = board[row][col];
    board[row][col] = "#";
    path.push([row, col]);

    const found =
      backtrack(row - 1, col, index + 1, [...path]) ||
      backtrack(row + 1, col, index + 1, [...path]) ||
      backtrack(row, col - 1, index + 1, [...path]) ||
      backtrack(row, col + 1, index + 1, [...path]);

    board[row][col] = temp;

    return found;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (backtrack(row, col, 0, [])) {
        console.log(`\nTotal search steps: ${steps}`);
        return true;
      }
    }
  }

  console.log("✗ Word not found");
  console.log(`Total search steps: ${steps}`);
  return false;
}

// ============================================
// RELATED PROBLEMS
// ============================================
/**
 * 1. Word Search II (LeetCode 212)
 *    - Find all words from a dictionary in board
 *    - Use Trie + backtracking
 *    - More efficient than searching each word separately
 *
 * 2. N-Queens (LeetCode 51)
 *    - Classic backtracking problem
 *    - Similar pattern: try, mark, recurse, unmark
 *
 * 3. Sudoku Solver (LeetCode 37)
 *    - Backtracking with constraint checking
 *    - Try values, validate, recurse, undo
 *
 * 4. Combination Sum (LeetCode 39)
 *    - Backtracking to find number combinations
 *    - Build solution incrementally
 *
 * 5. Palindrome Partitioning (LeetCode 131)
 *    - Backtracking to partition strings
 *    - Try all possible splits
 *
 * 6. Letter Combinations of a Phone Number (LeetCode 17)
 *    - Backtracking to generate combinations
 *    - Build strings character by character
 */

// ============================================
// FOLLOW-UP QUESTIONS
// ============================================
/**
 * Q1: What if we need to find ALL paths?
 * A: Continue searching even after finding one, collect all paths
 *
 * Q2: What if diagonal movement is allowed?
 * A: Add 4 more directions: [[-1,-1],[-1,1],[1,-1],[1,1]]
 *
 * Q3: What if we can reuse cells?
 * A: Don't mark as visited (but watch for infinite loops!)
 *
 * Q4: What if we need to find the shortest path?
 * A: Use BFS instead of DFS
 *
 * Q5: What if the board is very large?
 * A: Use optimizations (character counting, heuristics)
 *
 * Q6: What if multiple words need to be searched?
 * A: Use Trie data structure (Word Search II)
 *
 * Q7: What if we can't modify the board?
 * A: Use visited set instead (Approach 2)
 *
 * Q8: How to optimize for very long words?
 * A: Start from less frequent characters in the word
 */

// ============================================
// PERFORMANCE COMPARISON
// ============================================
function comparePerformance() {
  console.log("\n=== Performance Comparison ===\n");

  const largeBoard = [
    ["A", "B", "C", "E", "F", "G"],
    ["S", "F", "C", "S", "H", "I"],
    ["A", "D", "E", "E", "J", "K"],
    ["L", "M", "N", "O", "P", "Q"],
    ["R", "S", "T", "U", "V", "W"],
  ];

  const testWords = [
    { word: "ABCCED", exists: true },
    { word: "ABCDEFGHIJKLMNOP", exists: false },
    { word: "SEE", exists: true },
  ];

  const approaches = [
    { name: "Backtracking (Classic)", fn: exist_Backtracking },
    { name: "Optimized", fn: exist_Optimized },
  ];

  testWords.forEach(({ word, exists }) => {
    console.log(
      `Testing word: "${word}" (${exists ? "exists" : "not exists"})`
    );

    approaches.forEach((approach) => {
      const boardCopy = largeBoard.map((row) => [...row]);
      console.time(`  ${approach.name}`);
      const result = approach.fn(boardCopy, word);
      console.timeEnd(`  ${approach.name}`);
      console.log(`    Result: ${result} ${result === exists ? "✓" : "✗"}`);
    });
    console.log();
  });
}

// Run all tests
runTests();

// Example visualization
console.log("\n" + "=".repeat(60));
const exampleBoard = [
  ["A", "B", "C", "E"],
  ["S", "F", "C", "S"],
  ["A", "D", "E", "E"],
];
visualizeSearch(
  exampleBoard.map((row) => [...row]),
  "ABCCED"
);

// Performance comparison (commented out by default)
// comparePerformance();

// Export functions
module.exports = {
  exist: exist_Backtracking,
  exist_Backtracking,
  exist_VisitedSet,
  exist_Optimized,
  exist_DirectionArray,
  exist_Iterative,
};
