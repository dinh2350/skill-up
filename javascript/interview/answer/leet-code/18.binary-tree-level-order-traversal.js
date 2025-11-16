/**
 * Binary Tree Level Order Traversal - LeetCode Problem
 * Difficulty: Medium
 *
 * Problem: Given the root of a binary tree, return the level order traversal
 * of its nodes' values (i.e., from left to right, level by level).
 *
 * Example 1:
 * Input: root = [3,9,20,null,null,15,7]
 *
 * Tree structure:
 *       3
 *      / \
 *     9   20
 *        /  \
 *       15   7
 *
 * Output: [[3],[9,20],[15,7]]
 *
 * Example 2:
 * Input: root = [1]
 * Output: [[1]]
 *
 * Example 3:
 * Input: root = []
 * Output: []
 */

/**
 * Definition for a binary tree node.
 */
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/**
 * APPROACH 1: BFS with Queue (MOST INTUITIVE)
 *
 * Key Insights:
 * 1. Use a queue to process nodes level by level
 * 2. For each level, process all nodes in queue
 * 3. Track queue size to know how many nodes in current level
 * 4. Add children to queue for next level
 *
 * Time Complexity: O(n) - visit each node once
 * Space Complexity: O(w) - w is max width of tree (max nodes in a level)
 * Worst case: O(n) for complete binary tree where bottom level has n/2 nodes
 */

/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
function levelOrder(root) {
  if (!root) {
    return [];
  }

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length; // Number of nodes in current level
    const currentLevel = [];

    // Process all nodes in current level
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift(); // Dequeue from front
      currentLevel.push(node.val);

      // Add children to queue for next level
      if (node.left) {
        queue.push(node.left);
      }
      if (node.right) {
        queue.push(node.right);
      }
    }

    result.push(currentLevel);
  }

  return result;
}

// ============================================================================
// APPROACH 2: BFS with Queue using Two Pointers (More Efficient)
// ============================================================================

/**
 * Use array as queue but with index pointers instead of shift()
 * shift() is O(n), this approach is O(1) for dequeue
 *
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */
function levelOrderOptimized(root) {
  if (!root) {
    return [];
  }

  const result = [];
  const queue = [root];
  let queueIndex = 0; // Current position in queue

  while (queueIndex < queue.length) {
    const levelSize = queue.length - queueIndex;
    const currentLevel = [];

    // Process all nodes in current level
    for (let i = 0; i < levelSize; i++) {
      const node = queue[queueIndex++]; // "Dequeue" by incrementing index
      currentLevel.push(node.val);

      if (node.left) {
        queue.push(node.left);
      }
      if (node.right) {
        queue.push(node.right);
      }
    }

    result.push(currentLevel);
  }

  return result;
}

// ============================================================================
// APPROACH 3: DFS with Level Tracking (Recursive)
// ============================================================================

/**
 * Use DFS but track the level of each node
 * Add nodes to appropriate level array
 *
 * Time Complexity: O(n)
 * Space Complexity: O(h) - h is height of tree (recursion stack)
 * Note: Result array also takes O(n) space
 */
function levelOrderDFS(root) {
  const result = [];

  function dfs(node, level) {
    if (!node) {
      return;
    }

    // Create array for this level if it doesn't exist
    if (result.length === level) {
      result.push([]);
    }

    // Add current node to its level
    result[level].push(node.val);

    // Recurse on children with level + 1
    dfs(node.left, level + 1);
    dfs(node.right, level + 1);
  }

  dfs(root, 0);
  return result;
}

// ============================================================================
// APPROACH 4: BFS with Level Separator (Using null marker)
// ============================================================================

/**
 * Use null as level separator in queue
 *
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */
function levelOrderWithSeparator(root) {
  if (!root) {
    return [];
  }

  const result = [];
  const queue = [root, null]; // null marks end of level
  let currentLevel = [];

  while (queue.length > 0) {
    const node = queue.shift();

    if (node === null) {
      // End of current level
      result.push(currentLevel);
      currentLevel = [];

      // If queue is not empty, add separator for next level
      if (queue.length > 0) {
        queue.push(null);
      }
    } else {
      currentLevel.push(node.val);

      if (node.left) {
        queue.push(node.left);
      }
      if (node.right) {
        queue.push(node.right);
      }
    }
  }

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build tree from array representation (level order)
 * null represents missing nodes
 */
function buildTree(arr) {
  if (!arr || arr.length === 0) {
    return null;
  }

  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;

  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift();

    // Add left child
    if (i < arr.length && arr[i] !== null) {
      node.left = new TreeNode(arr[i]);
      queue.push(node.left);
    }
    i++;

    // Add right child
    if (i < arr.length && arr[i] !== null) {
      node.right = new TreeNode(arr[i]);
      queue.push(node.right);
    }
    i++;
  }

  return root;
}

/**
 * Print tree in visual format
 */
function printTree(root, prefix = "", isLeft = true) {
  if (!root) {
    return;
  }

  console.log(prefix + (isLeft ? "├── " : "└── ") + root.val);

  if (root.left || root.right) {
    if (root.left) {
      printTree(root.left, prefix + (isLeft ? "│   " : "    "), true);
    } else {
      console.log(prefix + (isLeft ? "│   " : "    ") + "├── null");
    }

    if (root.right) {
      printTree(root.right, prefix + (isLeft ? "│   " : "    "), false);
    } else {
      console.log(prefix + (isLeft ? "│   " : "    ") + "└── null");
    }
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log("Test Case 1: Example tree");
const tree1 = buildTree([3, 9, 20, null, null, 15, 7]);
console.log("Tree structure:");
console.log("    3");
console.log("   / \\");
console.log("  9   20");
console.log("     /  \\");
console.log("    15   7");
console.log("Output:", JSON.stringify(levelOrder(tree1)));
console.log("Expected: [[3],[9,20],[15,7]]");
console.log();

console.log("Test Case 2: Single node");
const tree2 = buildTree([1]);
console.log("Tree: 1");
console.log("Output:", JSON.stringify(levelOrder(tree2)));
console.log("Expected: [[1]]");
console.log();

console.log("Test Case 3: Empty tree");
const tree3 = null;
console.log("Tree: null");
console.log("Output:", JSON.stringify(levelOrder(tree3)));
console.log("Expected: []");
console.log();

console.log("Test Case 4: Left-skewed tree");
const tree4 = buildTree([1, 2, null, 3, null, 4]);
console.log("Tree structure:");
console.log("    1");
console.log("   /");
console.log("  2");
console.log(" /");
console.log("3");
console.log(" \\");
console.log("  4");
console.log("Output:", JSON.stringify(levelOrder(tree4)));
console.log("Expected: [[1],[2],[3],[4]]");
console.log();

console.log("Test Case 5: Complete binary tree");
const tree5 = buildTree([1, 2, 3, 4, 5, 6, 7]);
console.log("Tree structure:");
console.log("      1");
console.log("    /   \\");
console.log("   2     3");
console.log("  / \\   / \\");
console.log(" 4   5 6   7");
console.log("Output:", JSON.stringify(levelOrder(tree5)));
console.log("Expected: [[1],[2,3],[4,5,6,7]]");
console.log();

console.log("Test Case 6: Unbalanced tree");
const tree6 = buildTree([1, 2, 3, 4, null, null, 5]);
console.log("Tree structure:");
console.log("    1");
console.log("   / \\");
console.log("  2   3");
console.log(" /     \\");
console.log("4       5");
console.log("Output:", JSON.stringify(levelOrder(tree6)));
console.log("Expected: [[1],[2,3],[4,5]]");
console.log();

console.log("Comparing Different Approaches:");
const testTree = buildTree([3, 9, 20, null, null, 15, 7]);
console.log("BFS (Queue):", JSON.stringify(levelOrder(testTree)));
console.log("BFS (Optimized):", JSON.stringify(levelOrderOptimized(testTree)));
console.log("DFS (Recursive):", JSON.stringify(levelOrderDFS(testTree)));
console.log(
  "BFS (Separator):",
  JSON.stringify(levelOrderWithSeparator(testTree))
);
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * STEP-BY-STEP WALKTHROUGH: BFS with Queue
 *
 * Example tree:
 *       3
 *      / \
 *     9   20
 *        /  \
 *       15   7
 *
 * Initial state:
 * queue = [3]
 * result = []
 *
 * LEVEL 0:
 * levelSize = 1
 * currentLevel = []
 *
 * Process node 3:
 *   - Add 3 to currentLevel: [3]
 *   - Add children: queue = [9, 20]
 *
 * Add level to result: result = [[3]]
 *
 * LEVEL 1:
 * levelSize = 2
 * currentLevel = []
 *
 * Process node 9:
 *   - Add 9 to currentLevel: [9]
 *   - No children
 *
 * Process node 20:
 *   - Add 20 to currentLevel: [9, 20]
 *   - Add children: queue = [15, 7]
 *
 * Add level to result: result = [[3], [9, 20]]
 *
 * LEVEL 2:
 * levelSize = 2
 * currentLevel = []
 *
 * Process node 15:
 *   - Add 15 to currentLevel: [15]
 *   - No children
 *
 * Process node 7:
 *   - Add 7 to currentLevel: [15, 7]
 *   - No children
 *
 * Add level to result: result = [[3], [9, 20], [15, 7]]
 *
 * Queue is empty, done!
 *
 * Final result: [[3], [9, 20], [15, 7]] ✓
 */

/**
 * VISUAL REPRESENTATION: Queue States
 *
 * Tree:      3
 *           / \
 *          9   20
 *             /  \
 *            15   7
 *
 * Step-by-step queue states:
 *
 * Initial:     [3]
 *
 * After 3:     [9, 20]           Level 0: [3]
 *
 * After 9:     [20]
 * After 20:    [15, 7]           Level 1: [9, 20]
 *
 * After 15:    [7]
 * After 7:     []                Level 2: [15, 7]
 *
 * Result: [[3], [9, 20], [15, 7]]
 */

/**
 * UNDERSTANDING LEVEL SIZE TRACKING:
 *
 * WHY do we capture queue.length at the start of each level?
 *
 * Consider this:
 * queue = [9, 20]  (level 1)
 *
 * If we don't capture levelSize:
 *   - Process 9, queue becomes [20]
 *   - Process 20, add 15 and 7, queue becomes [15, 7]
 *   - Continue processing 15 and 7 in same level ❌
 *
 * With levelSize captured:
 *   - levelSize = 2 (frozen at start)
 *   - Process exactly 2 nodes: 9 and 20
 *   - Even though queue grows, we only process 2 ✓
 *
 * This ensures we process exactly one level at a time!
 */

/**
 * DFS APPROACH EXPLANATION:
 *
 * How does DFS achieve level order?
 *
 * Key: Track the level/depth as we traverse
 *
 * Example:
 *       3         level 0
 *      / \
 *     9   20     level 1
 *        /  \
 *       15   7   level 2
 *
 * DFS traversal order:
 * 3 (level 0) → 9 (level 1) → 20 (level 1) → 15 (level 2) → 7 (level 2)
 *
 * As we visit each node:
 * - If result[level] doesn't exist, create it
 * - Add node.val to result[level]
 *
 * result[0] = [3]
 * result[1] = [9, 20]
 * result[2] = [15, 7]
 *
 * Even though we use DFS (depth-first), we group by level!
 */

/**
 * BFS vs DFS COMPARISON:
 *
 * BFS (Iterative with Queue):
 * ✓ Natural for level-order traversal
 * ✓ Processes level by level automatically
 * ✓ Easy to understand
 * ✗ Requires queue (extra space)
 *
 * DFS (Recursive with Level):
 * ✓ No queue needed
 * ✓ Clean recursive code
 * ✓ Works well for this problem
 * ✗ Uses recursion stack
 * ✗ Not as intuitive for level-order
 *
 * Space Complexity:
 * BFS: O(w) where w is max width
 * DFS: O(h) where h is height
 *
 * For balanced tree: w ≈ n/2, h ≈ log(n)
 * For skewed tree: w = 1, h = n
 *
 * BFS is generally preferred for level-order traversal
 */

/**
 * WHY shift() IS SLOW:
 *
 * JavaScript array.shift() is O(n):
 * - Removes first element
 * - Shifts all remaining elements left
 *
 * For a queue of size k:
 * - shift() touches k elements
 * - Over n operations: O(n²) worst case
 *
 * Optimization: Use index pointer
 * - "Dequeue" by incrementing index: O(1)
 * - Trade-off: Don't free memory immediately
 * - Acceptable for this problem
 */

/**
 * APPROACH COMPARISON:
 *
 * APPROACH 1: BFS with shift()
 * Pros:
 * ✓ Most intuitive
 * ✓ True queue operations
 * ✓ Frees memory as we go
 * Cons:
 * ✗ shift() is O(n), making overall O(n²) worst case
 *
 * APPROACH 2: BFS with index pointer
 * Pros:
 * ✓ O(1) dequeue operation
 * ✓ Overall O(n) time
 * ✓ Still intuitive
 * Cons:
 * ✗ Keeps array in memory
 *
 * APPROACH 3: DFS with level tracking
 * Pros:
 * ✓ No queue needed
 * ✓ Clean recursive code
 * ✓ O(h) space for recursion
 * Cons:
 * ✗ Less intuitive for level-order
 * ✗ Stack overflow for very deep trees
 *
 * APPROACH 4: BFS with null separator
 * Pros:
 * ✓ Alternative BFS style
 * ✓ Clear level separation
 * Cons:
 * ✗ More complex logic
 * ✗ shift() still O(n)
 *
 * RECOMMENDED: Approach 1 (BFS with queue) for interviews
 * Note: In production, use Approach 2 for better performance
 */

/**
 * KEY INSIGHTS:
 *
 * 1. BFS IS NATURAL FOR LEVEL-ORDER:
 *    - Queue ensures FIFO (first in, first out)
 *    - Naturally processes level by level
 *    - Parent nodes enqueued before children
 *
 * 2. LEVEL SIZE TRACKING:
 *    - Capture queue.length at start of level
 *    - Process exactly that many nodes
 *    - Ensures one level at a time
 *
 * 3. QUEUE OPERATIONS:
 *    - Enqueue: push() to back - O(1)
 *    - Dequeue: shift() from front - O(n) ⚠️
 *    - Alternative: use index pointer - O(1)
 *
 * 4. CHILD PROCESSING ORDER:
 *    - Always add left child before right
 *    - Maintains left-to-right order in level
 *
 * 5. DFS ALTERNATIVE:
 *    - Can achieve level-order with DFS
 *    - Track level as parameter
 *    - Add to appropriate level array
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * 1. ❌ Not capturing level size
 *    - Processing nodes from multiple levels together
 *    - Lose level boundaries
 *
 * 2. ❌ Forgetting null check
 *    - Always check if root is null
 *    - Return [] for empty tree
 *
 * 3. ❌ Wrong child order
 *    - Must add left before right
 *    - Maintains left-to-right traversal
 *
 * 4. ❌ Not checking if children exist
 *    - Check node.left and node.right before adding
 *    - Avoid adding null to queue
 *
 * 5. ❌ Modifying queue.length in loop
 *    - Capture levelSize before loop
 *    - Don't use queue.length directly in loop condition
 *
 * 6. ❌ Creating result array incorrectly in DFS
 *    - Check if result[level] exists
 *    - Create new array if needed
 */

/**
 * INTERVIEW TIPS:
 *
 * 1. Clarify requirements:
 *    "Should I return values level by level?" → Yes
 *    "Left to right order in each level?" → Yes
 *
 * 2. Choose approach:
 *    "I'll use BFS with a queue for natural level-order traversal"
 *
 * 3. Explain algorithm:
 *    "Start with root in queue"
 *    "For each level, process all nodes currently in queue"
 *    "Add children to queue for next level"
 *
 * 4. Discuss level tracking:
 *    "I'll capture queue size at start of each level"
 *    "This ensures I only process current level"
 *
 * 5. Mention alternatives:
 *    "Could also use DFS with level parameter"
 *    "But BFS is more natural for level-order"
 *
 * 6. Discuss complexity:
 *    "Time is O(n) - visit each node once"
 *    "Space is O(w) - w is maximum width of tree"
 *    "Worst case O(n) for complete binary tree"
 */

/**
 * RELATED PROBLEMS:
 * - Binary Tree Zigzag Level Order Traversal
 * - Binary Tree Right Side View
 * - Average of Levels in Binary Tree
 * - Binary Tree Level Order Traversal II (bottom-up)
 * - Minimum Depth of Binary Tree
 * - Maximum Depth of Binary Tree
 */

/**
 * VARIATIONS:
 *
 * Bottom-up level order:
 * - Same algorithm, reverse result at end
 * - Or use result.unshift(currentLevel)
 *
 * Zigzag level order:
 * - Alternate left-to-right and right-to-left
 * - Reverse odd-numbered levels
 *
 * Right side view:
 * - Only take last node of each level
 * - result.push(currentLevel[currentLevel.length - 1])
 */

// Export for testing
module.exports = {
  levelOrder,
  levelOrderOptimized,
  levelOrderDFS,
  levelOrderWithSeparator,
  TreeNode,
  buildTree,
};
