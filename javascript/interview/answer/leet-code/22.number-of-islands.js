/**
 * 22. Number of Islands
 * Difficulty: Medium
 * Topics: Array, DFS, BFS, Matrix, Union Find
 *
 * Problem: Given an m x n 2D binary grid which represents a map of '1's (land)
 * and '0's (water), return the number of islands.
 *
 * An island is surrounded by water and is formed by connecting adjacent lands
 * horizontally or vertically. You may assume all four edges of the grid are
 * surrounded by water.
 *
 * Key Insight: Each connected component of '1's is one island
 * - Use DFS/BFS to mark all cells of an island as visited
 * - Count how many times we initiate a DFS/BFS
 */

// ============================================
// APPROACH 1: DFS (Recursive) - Most Intuitive
// ============================================
/**
 * Time Complexity: O(m × n) - visit each cell once
 * Space Complexity: O(m × n) - worst case recursion stack (all land)
 *
 * Algorithm:
 * 1. Iterate through each cell
 * 2. If cell is '1', increment island count and DFS to mark entire island
 * 3. DFS marks all connected '1's as '0' (or visited)
 */
function numIslands_DFS(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let islands = 0;

  // DFS to mark all connected land cells
  function dfs(row, col) {
    // Boundary check and water check
    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      grid[row][col] === "0"
    ) {
      return;
    }

    // Mark as visited by setting to '0'
    grid[row][col] = "0";

    // Explore all 4 directions (up, down, left, right)
    dfs(row - 1, col); // Up
    dfs(row + 1, col); // Down
    dfs(row, col - 1); // Left
    dfs(row, col + 1); // Right
  }

  // Scan the entire grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === "1") {
        islands++; // Found a new island
        dfs(row, col); // Mark entire island
      }
    }
  }

  return islands;
}

// ============================================
// APPROACH 2: BFS (Iterative with Queue)
// ============================================
/**
 * Time Complexity: O(m × n)
 * Space Complexity: O(min(m, n)) - queue size in worst case
 *
 * Better space complexity than DFS for wide grids
 */
function numIslands_BFS(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let islands = 0;

  // BFS to mark all connected land cells
  function bfs(startRow, startCol) {
    const queue = [[startRow, startCol]];
    grid[startRow][startCol] = "0"; // Mark as visited

    // Directions: up, down, left, right
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    while (queue.length > 0) {
      const [row, col] = queue.shift();

      // Check all 4 directions
      for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        // If valid land cell, add to queue
        if (
          newRow >= 0 &&
          newRow < rows &&
          newCol >= 0 &&
          newCol < cols &&
          grid[newRow][newCol] === "1"
        ) {
          queue.push([newRow, newCol]);
          grid[newRow][newCol] = "0"; // Mark as visited
        }
      }
    }
  }

  // Scan the entire grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === "1") {
        islands++;
        bfs(row, col);
      }
    }
  }

  return islands;
}

// ============================================
// APPROACH 3: DFS without Modifying Input
// ============================================
/**
 * Time Complexity: O(m × n)
 * Space Complexity: O(m × n) - visited set + recursion stack
 *
 * Preserves original grid using visited set
 */
function numIslands_DFS_NoModify(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set();
  let islands = 0;

  function dfs(row, col) {
    const key = `${row},${col}`;

    // Check boundaries, water, or already visited
    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      grid[row][col] === "0" ||
      visited.has(key)
    ) {
      return;
    }

    visited.add(key);

    // Explore 4 directions
    dfs(row - 1, col);
    dfs(row + 1, col);
    dfs(row, col - 1);
    dfs(row, col + 1);
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === "1" && !visited.has(`${row},${col}`)) {
        islands++;
        dfs(row, col);
      }
    }
  }

  return islands;
}

// ============================================
// APPROACH 4: Union Find (Disjoint Set)
// ============================================
/**
 * Time Complexity: O(m × n × α(m×n)) ≈ O(m × n) where α is inverse Ackermann
 * Space Complexity: O(m × n)
 *
 * Advanced approach - good for follow-up questions about dynamic updates
 */
class UnionFind {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
    this.count = 0; // Number of connected components
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX !== rootY) {
      // Union by rank
      if (this.rank[rootX] > this.rank[rootY]) {
        this.parent[rootY] = rootX;
      } else if (this.rank[rootX] < this.rank[rootY]) {
        this.parent[rootX] = rootY;
      } else {
        this.parent[rootY] = rootX;
        this.rank[rootX]++;
      }
      this.count--;
    }
  }

  setCount(count) {
    this.count = count;
  }

  getCount() {
    return this.count;
  }
}

function numIslands_UnionFind(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  const uf = new UnionFind(rows * cols);

  // Count initial land cells
  let landCount = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === "1") {
        landCount++;
      }
    }
  }

  uf.setCount(landCount);

  // Helper to convert 2D to 1D index
  const getIndex = (row, col) => row * cols + col;

  // Union adjacent land cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === "1") {
        // Check right neighbor
        if (col + 1 < cols && grid[row][col + 1] === "1") {
          uf.union(getIndex(row, col), getIndex(row, col + 1));
        }
        // Check down neighbor
        if (row + 1 < rows && grid[row + 1][col] === "1") {
          uf.union(getIndex(row, col), getIndex(row + 1, col));
        }
      }
    }
  }

  return uf.getCount();
}

// ============================================
// APPROACH 5: DFS with Iterative Stack
// ============================================
/**
 * Time Complexity: O(m × n)
 * Space Complexity: O(m × n) - worst case stack size
 *
 * Iterative version to avoid recursion stack overflow
 */
function numIslands_IterativeDFS(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let islands = 0;

  function dfsIterative(startRow, startCol) {
    const stack = [[startRow, startCol]];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    while (stack.length > 0) {
      const [row, col] = stack.pop();

      // Skip if out of bounds or water
      if (
        row < 0 ||
        row >= rows ||
        col < 0 ||
        col >= cols ||
        grid[row][col] === "0"
      ) {
        continue;
      }

      // Mark as visited
      grid[row][col] = "0";

      // Add all 4 neighbors to stack
      for (const [dRow, dCol] of directions) {
        stack.push([row + dRow, col + dCol]);
      }
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === "1") {
        islands++;
        dfsIterative(row, col);
      }
    }
  }

  return islands;
}

// ============================================
// VISUAL WALKTHROUGH
// ============================================
/**
 * Example Grid:
 *
 * [
 *   ["1","1","0","0","0"],
 *   ["1","1","0","0","0"],
 *   ["0","0","1","0","0"],
 *   ["0","0","0","1","1"]
 * ]
 *
 * Visual representation:
 *
 *   0 1 2 3 4
 * 0 L L . . .
 * 1 L L . . .
 * 2 . . L . .
 * 3 . . . L L
 *
 * (L = Land, . = Water)
 *
 * DFS Walkthrough:
 *
 * Initial: islands = 0
 *
 * Step 1: Scan grid, find (0,0) = '1'
 * ┌─────────────────────────────┐
 * │ islands = 1                 │
 * │ Start DFS from (0,0)        │
 * └─────────────────────────────┘
 *
 * DFS from (0,0):
 * - Mark (0,0) as '0' ✓
 * - Check Up (−1,0): out of bounds ✗
 * - Check Down (1,0): '1' → recurse
 *   ├─ Mark (1,0) as '0' ✓
 *   ├─ Check Down (2,0): '0' ✗
 *   ├─ Check Right (1,1): '1' → recurse
 *   │  ├─ Mark (1,1) as '0' ✓
 *   │  ├─ Check Up (0,1): '1' → recurse
 *   │  │  └─ Mark (0,1) as '0' ✓
 *   │  │     All neighbors processed
 *   │  └─ All neighbors processed
 *   └─ All neighbors processed
 *
 * Grid after Island 1:
 *   0 1 2 3 4
 * 0 0 0 . . .
 * 1 0 0 . . .
 * 2 . . L . .
 * 3 . . . L L
 *
 * Step 2: Continue scan, find (2,2) = '1'
 * ┌─────────────────────────────┐
 * │ islands = 2                 │
 * │ Start DFS from (2,2)        │
 * └─────────────────────────────┘
 *
 * DFS from (2,2):
 * - Mark (2,2) as '0' ✓
 * - All neighbors are water or out of bounds
 *
 * Grid after Island 2:
 *   0 1 2 3 4
 * 0 0 0 . . .
 * 1 0 0 . . .
 * 2 . . 0 . .
 * 3 . . . L L
 *
 * Step 3: Continue scan, find (3,3) = '1'
 * ┌─────────────────────────────┐
 * │ islands = 3                 │
 * │ Start DFS from (3,3)        │
 * └─────────────────────────────┘
 *
 * DFS from (3,3):
 * - Mark (3,3) as '0' ✓
 * - Check Right (3,4): '1' → recurse
 *   └─ Mark (3,4) as '0' ✓
 *
 * Final Grid:
 *   0 1 2 3 4
 * 0 0 0 . . .
 * 1 0 0 . . .
 * 2 . . 0 . .
 * 3 . . . 0 0
 *
 * Result: islands = 3 ✓
 */

// ============================================
// BFS WALKTHROUGH
// ============================================
/**
 * BFS explores level by level (like ripples in water)
 *
 * Example: Island 1 from (0,0)
 *
 * Initial queue: [(0,0)]
 *
 * Level 0: Process (0,0)
 * ┌──────────────────────────┐
 * │ Current: (0,0)           │
 * │ Mark as '0'              │
 * │ Add neighbors to queue:  │
 * │   - (1,0) [down]         │
 * │   - (0,1) [right]        │
 * └──────────────────────────┘
 * Queue: [(1,0), (0,1)]
 *
 * Level 1: Process (1,0)
 * ┌──────────────────────────┐
 * │ Current: (1,0)           │
 * │ Mark as '0'              │
 * │ Add neighbors:           │
 * │   - (1,1) [right]        │
 * └──────────────────────────┘
 * Queue: [(0,1), (1,1)]
 *
 * Level 1: Process (0,1)
 * ┌──────────────────────────┐
 * │ Current: (0,1)           │
 * │ Mark as '0'              │
 * │ No new land neighbors    │
 * └──────────────────────────┘
 * Queue: [(1,1)]
 *
 * Level 2: Process (1,1)
 * ┌──────────────────────────┐
 * │ Current: (1,1)           │
 * │ Mark as '0'              │
 * │ No new land neighbors    │
 * └──────────────────────────┘
 * Queue: []
 *
 * Island 1 fully explored! ✓
 */

// ============================================
// COMPLEXITY ANALYSIS
// ============================================
/**
 * All approaches visit each cell at most once:
 *
 * DFS (Recursive):
 * ✓ Time: O(m × n)
 * ✓ Space: O(m × n) worst case recursion stack
 * ✓ Best for: Simple implementation, interviews
 * ✗ Risk: Stack overflow for very large grids
 *
 * BFS (Iterative):
 * ✓ Time: O(m × n)
 * ✓ Space: O(min(m, n)) queue size
 * ✓ Best for: Wide grids, avoiding stack overflow
 * ✗ Slightly more code
 *
 * DFS without Modifying:
 * ✓ Time: O(m × n)
 * ✓ Space: O(m × n) for visited set
 * ✓ Best for: When you can't modify input
 * ✗ Extra space for visited tracking
 *
 * Union Find:
 * ✓ Time: O(m × n × α(m×n)) ≈ O(m × n)
 * ✓ Space: O(m × n)
 * ✓ Best for: Dynamic island addition/removal
 * ✗ Overkill for basic problem
 * ✗ More complex to implement
 *
 * Iterative DFS:
 * ✓ Time: O(m × n)
 * ✓ Space: O(m × n) explicit stack
 * ✓ Best for: Avoiding recursion
 * ✗ More verbose than recursive
 */

// ============================================
// COMMON MISTAKES
// ============================================
/**
 * 1. ❌ Forgetting boundary checks
 *    if (row < 0 || row >= rows || col < 0 || col >= cols)
 *
 * 2. ❌ Not checking for water ('0') in base case
 *    Must check: grid[row][col] === '0'
 *
 * 3. ❌ Not marking cells as visited
 *    - Will cause infinite recursion!
 *    - Mark BEFORE adding to queue in BFS
 *
 * 4. ❌ Wrong direction array
 *    Correct: [[-1,0], [1,0], [0,-1], [0,1]]
 *    (up, down, left, right)
 *
 * 5. ❌ In BFS, marking after dequeue
 *    Should mark when adding to queue to avoid duplicates
 *
 * 6. ❌ Not handling empty grid
 *    Check: if (!grid || grid.length === 0) return 0
 *
 * 7. ❌ Counting water cells ('0')
 *    Only increment islands when finding '1'
 *
 * 8. ❌ Diagonal connections
 *    Islands connect only horizontally/vertically, NOT diagonally
 */

// ============================================
// INTERVIEW TIPS
// ============================================
/**
 * 1. Clarify the problem
 *    - "Are diagonal cells considered connected?"
 *    - "Can I modify the input grid?"
 *    - "What's the maximum grid size?"
 *
 * 2. Start with DFS recursive
 *    - Most intuitive and clean
 *    - Easy to explain
 *    - Shows understanding of recursion
 *
 * 3. Explain your approach
 *    "I'll scan the grid. When I find a '1', I'll increment
 *    the island count and use DFS to mark all connected land
 *    cells as visited. The key insight is that each DFS
 *    explores exactly one island."
 *
 * 4. Discuss trade-offs
 *    - DFS vs BFS
 *    - Modifying input vs using visited set
 *    - Recursive vs iterative
 *
 * 5. Mention follow-ups
 *    - "If we need to preserve the grid, I'd use a visited set"
 *    - "For dynamic updates, Union Find would be better"
 *    - "For very large grids, iterative DFS avoids stack overflow"
 *
 * 6. Test with examples
 *    Walk through your code with a small example
 *
 * 7. Handle edge cases
 *    - Empty grid
 *    - All water
 *    - All land
 *    - Single cell
 */

// ============================================
// EDGE CASES
// ============================================
function testEdgeCases() {
  console.log("\n=== Edge Cases ===\n");

  // Case 1: Empty grid
  console.log("Case 1: Empty grid");
  console.log("Input: []");
  console.log("Expected: 0");
  console.log("Output:", numIslands_DFS([]));

  // Case 2: All water
  console.log("\nCase 2: All water");
  const allWater = [
    ["0", "0"],
    ["0", "0"],
  ];
  console.log("Input:", JSON.stringify(allWater));
  console.log("Expected: 0");
  console.log("Output:", numIslands_DFS(allWater));

  // Case 3: All land
  console.log("\nCase 3: All land");
  const allLand = [
    ["1", "1"],
    ["1", "1"],
  ];
  console.log("Input:", JSON.stringify(allLand));
  console.log("Expected: 1");
  console.log("Output:", numIslands_DFS(allLand));

  // Case 4: Single cell land
  console.log("\nCase 4: Single cell land");
  const singleLand = [["1"]];
  console.log("Input:", JSON.stringify(singleLand));
  console.log("Expected: 1");
  console.log("Output:", numIslands_DFS(singleLand));

  // Case 5: Single cell water
  console.log("\nCase 5: Single cell water");
  const singleWater = [["0"]];
  console.log("Input:", JSON.stringify(singleWater));
  console.log("Expected: 0");
  console.log("Output:", numIslands_DFS(singleWater));

  // Case 6: Single row
  console.log("\nCase 6: Single row");
  const singleRow = [["1", "0", "1", "0", "1"]];
  console.log("Input:", JSON.stringify(singleRow));
  console.log("Expected: 3");
  console.log("Output:", numIslands_DFS(singleRow));

  // Case 7: Single column
  console.log("\nCase 7: Single column");
  const singleCol = [["1"], ["0"], ["1"], ["0"], ["1"]];
  console.log("Input:", JSON.stringify(singleCol));
  console.log("Expected: 3");
  console.log("Output:", numIslands_DFS(singleCol));

  // Case 8: Checkerboard pattern
  console.log("\nCase 8: Checkerboard");
  const checkerboard = [
    ["1", "0", "1"],
    ["0", "1", "0"],
    ["1", "0", "1"],
  ];
  console.log("Input:", JSON.stringify(checkerboard));
  console.log("Expected: 5");
  console.log("Output:", numIslands_DFS(checkerboard));
}

// ============================================
// TEST CASES
// ============================================
function runTests() {
  console.log("=== Number of Islands ===\n");

  const testCases = [
    {
      grid: [
        ["1", "1", "1", "1", "0"],
        ["1", "1", "0", "1", "0"],
        ["1", "1", "0", "0", "0"],
        ["0", "0", "0", "0", "0"],
      ],
      expected: 1,
      description: "Single large island",
    },
    {
      grid: [
        ["1", "1", "0", "0", "0"],
        ["1", "1", "0", "0", "0"],
        ["0", "0", "1", "0", "0"],
        ["0", "0", "0", "1", "1"],
      ],
      expected: 3,
      description: "Three separate islands",
    },
    {
      grid: [
        ["1", "0", "1", "0", "1"],
        ["0", "1", "0", "1", "0"],
        ["1", "0", "1", "0", "1"],
      ],
      expected: 9,
      description: "Many small islands",
    },
    {
      grid: [["1"]],
      expected: 1,
      description: "Single land cell",
    },
    {
      grid: [["0"]],
      expected: 0,
      description: "Single water cell",
    },
  ];

  testCases.forEach((test, index) => {
    console.log(`Test Case ${index + 1}: ${test.description}`);
    console.log("Grid:");
    test.grid.forEach((row) => console.log("  ", row.join(" ")));
    console.log(`Expected: ${test.expected}`);

    // Create deep copies for each approach
    const grid1 = test.grid.map((row) => [...row]);
    const grid2 = test.grid.map((row) => [...row]);
    const grid3 = test.grid.map((row) => [...row]);
    const grid4 = test.grid.map((row) => [...row]);
    const grid5 = test.grid.map((row) => [...row]);

    const result1 = numIslands_DFS(grid1);
    const result2 = numIslands_BFS(grid2);
    const result3 = numIslands_DFS_NoModify(grid3);
    const result4 = numIslands_UnionFind(grid4);
    const result5 = numIslands_IterativeDFS(grid5);

    console.log(
      `DFS (Recursive):  ${result1} ${result1 === test.expected ? "✓" : "✗"}`
    );
    console.log(
      `BFS (Queue):      ${result2} ${result2 === test.expected ? "✓" : "✗"}`
    );
    console.log(
      `DFS (No Modify):  ${result3} ${result3 === test.expected ? "✓" : "✗"}`
    );
    console.log(
      `Union Find:       ${result4} ${result4 === test.expected ? "✓" : "✗"}`
    );
    console.log(
      `DFS (Iterative):  ${result5} ${result5 === test.expected ? "✓" : "✗"}`
    );
    console.log();
  });

  testEdgeCases();
}

// ============================================
// VISUALIZATION HELPER
// ============================================
function visualizeIslands(grid) {
  console.log("\n=== Island Visualization ===\n");

  const rows = grid.length;
  const cols = grid[0].length;
  const islandMap = Array.from({ length: rows }, () => new Array(cols).fill(0));
  let islandNum = 0;

  function dfs(row, col, num) {
    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      grid[row][col] === "0" ||
      islandMap[row][col] !== 0
    ) {
      return;
    }

    islandMap[row][col] = num;
    dfs(row - 1, col, num);
    dfs(row + 1, col, num);
    dfs(row, col - 1, num);
    dfs(row, col + 1, num);
  }

  // Find and number each island
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === "1" && islandMap[row][col] === 0) {
        islandNum++;
        dfs(row, col, islandNum);
      }
    }
  }

  // Print original grid
  console.log("Original Grid:");
  for (const row of grid) {
    console.log("  ", row.join(" "));
  }

  // Print island map
  console.log("\nIsland Map (each number is a different island):");
  for (const row of islandMap) {
    console.log("  ", row.map((n) => (n === 0 ? "." : n)).join(" "));
  }

  console.log(`\nTotal Islands: ${islandNum}`);
}

// ============================================
// PERFORMANCE COMPARISON
// ============================================
function comparePerformance() {
  console.log("\n=== Performance Comparison ===\n");

  // Create large grid
  const size = 100;
  const largeGrid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (Math.random() > 0.5 ? "1" : "0"))
  );

  console.log(`Testing with ${size}×${size} grid...\n`);

  const approaches = [
    { name: "DFS (Recursive)", fn: numIslands_DFS },
    { name: "BFS (Queue)", fn: numIslands_BFS },
    { name: "DFS (Iterative)", fn: numIslands_IterativeDFS },
    { name: "Union Find", fn: numIslands_UnionFind },
  ];

  approaches.forEach((approach) => {
    const gridCopy = largeGrid.map((row) => [...row]);
    console.time(approach.name);
    const result = approach.fn(gridCopy);
    console.timeEnd(approach.name);
    console.log(`  Islands found: ${result}\n`);
  });
}

// ============================================
// RELATED PROBLEMS
// ============================================
/**
 * 1. Max Area of Island (LeetCode 695)
 *    - Return the size of the largest island
 *    - Track area during DFS
 *
 * 2. Number of Closed Islands (LeetCode 1254)
 *    - Islands not touching the boundary
 *    - First mark boundary islands, then count remaining
 *
 * 3. Number of Distinct Islands (LeetCode 694)
 *    - Count islands with unique shapes
 *    - Normalize island coordinates
 *
 * 4. Surrounded Regions (LeetCode 130)
 *    - Flip regions not connected to boundary
 *    - Similar DFS/BFS approach
 *
 * 5. Pacific Atlantic Water Flow (LeetCode 417)
 *    - Find cells that flow to both oceans
 *    - Multi-source BFS/DFS
 *
 * 6. Number of Islands II (LeetCode 305)
 *    - Dynamic island addition
 *    - Use Union Find for O(k) operations
 *
 * 7. Making A Large Island (LeetCode 827)
 *    - Maximum island size by changing one 0 to 1
 *    - DFS + greedy
 */

// ============================================
// FOLLOW-UP QUESTIONS
// ============================================
/**
 * Q1: What if the grid is too large to fit in memory?
 * A: Process in chunks, or use streaming algorithm
 *
 * Q2: What if islands can be added/removed dynamically?
 * A: Use Union Find with proper union/find operations
 *
 * Q3: What if we need to find the largest island?
 * A: Track size during DFS, keep max
 *
 * Q4: What if diagonal cells are also connected?
 * A: Add 4 more directions: [[-1,-1],[-1,1],[1,-1],[1,1]]
 *
 * Q5: What if we can't modify the input?
 * A: Use visited set (Approach 3)
 *
 * Q6: What if the grid is represented differently (adjacency list)?
 * A: Same algorithm, just different graph representation
 *
 * Q7: How to find the perimeter of all islands?
 * A: Count edges that border water or boundary
 */

// Run all tests
runTests();

// Visualize example
console.log("\n" + "=".repeat(60));
const exampleGrid = [
  ["1", "1", "0", "0", "0"],
  ["1", "1", "0", "0", "0"],
  ["0", "0", "1", "0", "0"],
  ["0", "0", "0", "1", "1"],
];
visualizeIslands(exampleGrid);

// Performance comparison (commented out by default)
// comparePerformance();

// Export functions
module.exports = {
  numIslands: numIslands_DFS,
  numIslands_DFS,
  numIslands_BFS,
  numIslands_DFS_NoModify,
  numIslands_UnionFind,
  numIslands_IterativeDFS,
};
