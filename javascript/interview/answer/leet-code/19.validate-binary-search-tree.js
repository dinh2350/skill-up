/**
 * Validate Binary Search Tree - LeetCode Problem
 * Difficulty: Medium
 *
 * Problem: Given the root of a binary tree, determine if it is a valid binary search tree (BST).
 *
 * A valid BST is defined as follows:
 * 1. The left subtree of a node contains only nodes with keys less than the node's key.
 * 2. The right subtree of a node contains only nodes with keys greater than the node's key.
 * 3. Both the left and right subtrees must also be binary search trees.
 *
 * Example 1:
 * Input: root = [2,1,3]
 *
 * Tree:    2
 *         / \
 *        1   3
 *
 * Output: true
 *
 * Example 2:
 * Input: root = [5,1,4,null,null,3,6]
 *
 * Tree:      5
 *           / \
 *          1   4
 *             / \
 *            3   6
 *
 * Output: false
 * Explanation: The root node's value is 5 but its right child's value is 4.
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
 * APPROACH 1: Recursive with Range Validation (OPTIMAL)
 *
 * Key Insights:
 * 1. Each node must be within a valid range [min, max]
 * 2. For left child: max becomes parent's value
 * 3. For right child: min becomes parent's value
 * 4. Initially: min = -Infinity, max = +Infinity
 *
 * Time Complexity: O(n) - visit each node once
 * Space Complexity: O(h) - recursion stack, h is height
 */

/**
 * @param {TreeNode} root
 * @return {boolean}
 */
function isValidBST(root) {
  function validate(node, min, max) {
    // Empty node is valid
    if (!node) {
      return true;
    }

    // Current node must be within range
    if (node.val <= min || node.val >= max) {
      return false;
    }

    // Validate left subtree: all values must be < node.val
    // Validate right subtree: all values must be > node.val
    return (
      validate(node.left, min, node.val) && validate(node.right, node.val, max)
    );
  }

  // Start with infinite range
  return validate(root, -Infinity, Infinity);
}

// ============================================================================
// APPROACH 2: In-Order Traversal (ELEGANT)
// ============================================================================

/**
 * In-order traversal of BST produces sorted sequence
 * If we find any value <= previous value, it's not a BST
 *
 * Key Insight:
 * - In-order: left → root → right
 * - For BST: should produce ascending order
 *
 * Time Complexity: O(n)
 * Space Complexity: O(h) - recursion stack
 */
function isValidBSTInOrder(root) {
  let prev = -Infinity;

  function inOrder(node) {
    if (!node) {
      return true;
    }

    // Check left subtree
    if (!inOrder(node.left)) {
      return false;
    }

    // Check current node
    if (node.val <= prev) {
      return false;
    }
    prev = node.val; // Update previous value

    // Check right subtree
    return inOrder(node.right);
  }

  return inOrder(root);
}

// ============================================================================
// APPROACH 3: In-Order Traversal with Array (CLEARER)
// ============================================================================

/**
 * Store in-order traversal in array, then check if sorted
 *
 * Time Complexity: O(n)
 * Space Complexity: O(n) - array stores all values
 */
function isValidBSTArray(root) {
  const values = [];

  function inOrder(node) {
    if (!node) {
      return;
    }

    inOrder(node.left);
    values.push(node.val);
    inOrder(node.right);
  }

  inOrder(root);

  // Check if array is strictly increasing
  for (let i = 1; i < values.length; i++) {
    if (values[i] <= values[i - 1]) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// APPROACH 4: Iterative with Stack
// ============================================================================

/**
 * Iterative in-order traversal using stack
 *
 * Time Complexity: O(n)
 * Space Complexity: O(h) - stack size
 */
function isValidBSTIterative(root) {
  const stack = [];
  let current = root;
  let prev = -Infinity;

  while (current || stack.length > 0) {
    // Go to leftmost node
    while (current) {
      stack.push(current);
      current = current.left;
    }

    // Process current node
    current = stack.pop();

    // Check BST property
    if (current.val <= prev) {
      return false;
    }
    prev = current.val;

    // Move to right subtree
    current = current.right;
  }

  return true;
}

// ============================================================================
// APPROACH 5: Morris Traversal (O(1) Space)
// ============================================================================

/**
 * In-order traversal without recursion or stack
 * Uses threaded binary tree concept
 *
 * Time Complexity: O(n)
 * Space Complexity: O(1) - no extra space!
 */
function isValidBSTMorris(root) {
  let current = root;
  let prev = -Infinity;

  while (current) {
    if (!current.left) {
      // No left child, process current node
      if (current.val <= prev) {
        return false;
      }
      prev = current.val;
      current = current.right;
    } else {
      // Find in-order predecessor
      let predecessor = current.left;
      while (predecessor.right && predecessor.right !== current) {
        predecessor = predecessor.right;
      }

      if (!predecessor.right) {
        // Create thread
        predecessor.right = current;
        current = current.left;
      } else {
        // Remove thread and process current
        predecessor.right = null;
        if (current.val <= prev) {
          return false;
        }
        prev = current.val;
        current = current.right;
      }
    }
  }

  return true;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build tree from array (level-order)
 */
function buildTree(arr) {
  if (!arr || arr.length === 0 || arr[0] === null) {
    return null;
  }

  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;

  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift();

    if (i < arr.length && arr[i] !== null) {
      node.left = new TreeNode(arr[i]);
      queue.push(node.left);
    }
    i++;

    if (i < arr.length && arr[i] !== null) {
      node.right = new TreeNode(arr[i]);
      queue.push(node.right);
    }
    i++;
  }

  return root;
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log("Test Case 1: Valid BST");
const tree1 = buildTree([2, 1, 3]);
console.log("Tree:    2");
console.log("        / \\");
console.log("       1   3");
console.log("Output:", isValidBST(tree1));
console.log("Expected: true");
console.log();

console.log("Test Case 2: Invalid BST (right child < root)");
const tree2 = buildTree([5, 1, 4, null, null, 3, 6]);
console.log("Tree:      5");
console.log("          / \\");
console.log("         1   4");
console.log("            / \\");
console.log("           3   6");
console.log("Output:", isValidBST(tree2));
console.log("Expected: false (4 < 5 but 4 is in right subtree)");
console.log();

console.log("Test Case 3: Single node");
const tree3 = buildTree([1]);
console.log("Tree: 1");
console.log("Output:", isValidBST(tree3));
console.log("Expected: true");
console.log();

console.log("Test Case 4: Empty tree");
const tree4 = null;
console.log("Tree: null");
console.log("Output:", isValidBST(tree4));
console.log("Expected: true");
console.log();

console.log("Test Case 5: Invalid BST (duplicate values)");
const tree5 = buildTree([1, 1]);
console.log("Tree:  1");
console.log("      /");
console.log("     1");
console.log("Output:", isValidBST(tree5));
console.log("Expected: false (BST must have strictly less/greater)");
console.log();

console.log("Test Case 6: Valid left-skewed BST");
const tree6 = buildTree([5, 3, null, 2, null, 1]);
console.log("Tree:  5");
console.log("      /");
console.log("     3");
console.log("    /");
console.log("   2");
console.log("  /");
console.log(" 1");
console.log("Output:", isValidBST(tree6));
console.log("Expected: true");
console.log();

console.log("Test Case 7: Invalid BST (left subtree has larger value)");
const tree7 = buildTree([5, 4, 6, null, null, 3, 7]);
console.log("Tree:      5");
console.log("          / \\");
console.log("         4   6");
console.log("            / \\");
console.log("           3   7");
console.log("Output:", isValidBST(tree7));
console.log("Expected: false (3 < 5 but in right subtree)");
console.log();

console.log("Test Case 8: Tricky - deep violation");
const tree8 = buildTree([10, 5, 15, null, null, 6, 20]);
console.log("Tree:      10");
console.log("          /  \\");
console.log("         5    15");
console.log("             /  \\");
console.log("            6    20");
console.log("Output:", isValidBST(tree8));
console.log("Expected: false (6 < 10 but in right subtree)");
console.log();

console.log("Comparing Different Approaches:");
const testTree = buildTree([2, 1, 3]);
console.log("Range Validation:", isValidBST(testTree));
console.log("In-Order (prev):", isValidBSTInOrder(testTree));
console.log("In-Order (array):", isValidBSTArray(testTree));
console.log("Iterative:", isValidBSTIterative(testTree));
console.log("Morris:", isValidBSTMorris(testTree));
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * STEP-BY-STEP WALKTHROUGH: Range Validation
 *
 * Example: Valid BST
 *       5
 *      / \
 *     3   7
 *    / \
 *   2   4
 *
 * Initial call: validate(5, -∞, +∞)
 *   - 5 is in range (-∞, +∞) ✓
 *   - Left: validate(3, -∞, 5)
 *   - Right: validate(7, 5, +∞)
 *
 * Left subtree: validate(3, -∞, 5)
 *   - 3 is in range (-∞, 5) ✓
 *   - Left: validate(2, -∞, 3)
 *   - Right: validate(4, 3, 5)
 *
 * Node 2: validate(2, -∞, 3)
 *   - 2 is in range (-∞, 3) ✓
 *   - No children
 *   - Return true
 *
 * Node 4: validate(4, 3, 5)
 *   - 4 is in range (3, 5) ✓
 *   - No children
 *   - Return true
 *
 * Right subtree: validate(7, 5, +∞)
 *   - 7 is in range (5, +∞) ✓
 *   - No children
 *   - Return true
 *
 * All nodes valid → true ✓
 */

/**
 * INVALID BST EXAMPLE:
 *
 *       5
 *      / \
 *     1   4
 *        / \
 *       3   6
 *
 * Initial call: validate(5, -∞, +∞)
 *   - 5 is in range (-∞, +∞) ✓
 *   - Left: validate(1, -∞, 5) → true
 *   - Right: validate(4, 5, +∞)
 *
 * Right subtree: validate(4, 5, +∞)
 *   - Is 4 in range (5, +∞)?
 *   - 4 <= 5 → FALSE! ❌
 *
 * The problem: 4 < 5, but 4 is in the right subtree of 5
 * In a BST, right subtree must have ALL values > 5
 */

/**
 * WHY SIMPLE COMPARISON DOESN'T WORK:
 *
 * WRONG APPROACH:
 * if (node.left && node.left.val >= node.val) return false;
 * if (node.right && node.right.val <= node.val) return false;
 *
 * This only checks immediate children!
 *
 * Example that passes wrong check but is invalid:
 *       10
 *      /  \
 *     5    15
 *         /  \
 *        6    20
 *
 * - 5 < 10 ✓ (left child)
 * - 15 > 10 ✓ (right child)
 * - 6 < 15 ✓ (left child of 15)
 * - 20 > 15 ✓ (right child of 15)
 *
 * But 6 < 10, so 6 should NOT be in right subtree of 10!
 * This is INVALID BST!
 *
 * Need to check ALL descendants, not just immediate children.
 * Hence, we use range [min, max] that propagates down.
 */

/**
 * IN-ORDER TRAVERSAL EXPLANATION:
 *
 * For a valid BST, in-order traversal produces ascending sequence.
 *
 * Example BST:
 *       4
 *      / \
 *     2   6
 *    / \ / \
 *   1  3 5  7
 *
 * In-order: left → root → right
 * Sequence: 1, 2, 3, 4, 5, 6, 7 (strictly increasing) ✓
 *
 * Invalid BST:
 *       4
 *      / \
 *     2   6
 *    / \ / \
 *   1  5 3  7
 *
 * In-order: 1, 2, 5, 4, 3, 6, 7
 * Not sorted! (5 > 4, 4 > 3) ❌
 *
 * Algorithm:
 * 1. Traverse in-order
 * 2. Keep track of previous value
 * 3. If current <= previous, not a BST
 */

/**
 * UNDERSTANDING THE RANGE PROPAGATION:
 *
 * Starting with node value = 10, range = (-∞, +∞)
 *
 * Left child:
 *   - Must be < 10
 *   - New range: (-∞, 10)
 *   - max becomes 10
 *
 * Right child:
 *   - Must be > 10
 *   - New range: (10, +∞)
 *   - min becomes 10
 *
 * Visual:
 *              10 [-∞, +∞]
 *             /  \
 *   [-∞,10]  5    15 [10,+∞]
 *           / \   / \
 * [-∞,5]  3   7  12  20 [15,+∞]
 *         ↑   ↑  ↑
 *         Valid because:
 *         3 in (-∞, 5) ✓
 *         7 in (5, 10) ✓
 *         12 in (10, 15) ✓
 */

/**
 * APPROACH COMPARISON:
 *
 * APPROACH 1: Range Validation
 * Pros:
 * ✓ Most intuitive for BST property
 * ✓ Catches violations early
 * ✓ Clean recursive solution
 * ✓ O(h) space
 * Cons:
 * ✗ Requires understanding of range propagation
 *
 * APPROACH 2: In-Order with Prev
 * Pros:
 * ✓ Elegant use of BST property
 * ✓ O(h) space
 * ✓ Simple logic
 * Cons:
 * ✗ Needs to process entire tree
 * ✗ Can't stop early on left side
 *
 * APPROACH 3: In-Order with Array
 * Pros:
 * ✓ Very clear and easy to understand
 * ✓ Separates traversal from validation
 * Cons:
 * ✗ O(n) space for array
 * ✗ Two passes (traverse + validate)
 *
 * APPROACH 4: Iterative
 * Pros:
 * ✓ No recursion (avoid stack overflow)
 * ✓ O(h) space
 * Cons:
 * ✗ More complex code
 * ✗ Harder to understand
 *
 * APPROACH 5: Morris Traversal
 * Pros:
 * ✓ O(1) space! Amazing!
 * ✓ No recursion, no stack
 * Cons:
 * ✗ Very complex
 * ✗ Modifies tree temporarily
 * ✗ Hard to implement correctly
 *
 * RECOMMENDED: Approach 1 (Range Validation) for interviews
 */

/**
 * KEY INSIGHTS:
 *
 * 1. BST PROPERTY IS GLOBAL:
 *    - Not just about parent-child relationship
 *    - ALL left descendants < node < ALL right descendants
 *    - Must check entire subtrees
 *
 * 2. RANGE PROPAGATION:
 *    - Each node has valid range [min, max]
 *    - Left child inherits min, gets parent as max
 *    - Right child inherits max, gets parent as min
 *
 * 3. IN-ORDER PRODUCES SORTED SEQUENCE:
 *    - Key property of BST
 *    - Can validate by checking if strictly increasing
 *
 * 4. STRICT INEQUALITY:
 *    - Must use < and >, not <= or >=
 *    - No duplicate values allowed in BST
 *
 * 5. EDGE CASES:
 *    - Empty tree is valid BST
 *    - Single node is valid BST
 *    - Duplicate values make it invalid
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * 1. ❌ Only checking immediate children
 *    - Must check ALL descendants
 *    - Use range validation
 *
 * 2. ❌ Using >= or <= instead of > or <
 *    - BST requires strict inequality
 *    - Duplicates are not allowed
 *
 * 3. ❌ Not handling null nodes
 *    - null is considered valid BST
 *    - Check for null before accessing properties
 *
 * 4. ❌ Forgetting to check both subtrees
 *    - Must validate both left AND right
 *    - Use && not ||
 *
 * 5. ❌ Wrong range propagation
 *    - Left: (min, node.val) not (min, node.val - 1)
 *    - Right: (node.val, max) not (node.val + 1, max)
 *
 * 6. ❌ Integer overflow with min/max
 *    - Use -Infinity and +Infinity
 *    - Or use null and handle specially
 */

/**
 * INTERVIEW TIPS:
 *
 * 1. Clarify BST definition:
 *    "Should I allow duplicate values?" → No, strictly less/greater
 *
 * 2. Explain wrong approach:
 *    "Just checking node.left < node < node.right is not enough"
 *    "We need to check ALL descendants"
 *
 * 3. Choose approach:
 *    "I'll use range validation - each node has valid range"
 *    "Alternative: in-order traversal should be sorted"
 *
 * 4. Explain range propagation:
 *    "For left child, max becomes parent value"
 *    "For right child, min becomes parent value"
 *
 * 5. Discuss complexity:
 *    "Time O(n) - visit each node once"
 *    "Space O(h) - recursion stack"
 *
 * 6. Handle edge cases:
 *    "Empty tree is valid"
 *    "Single node is valid"
 *    "Check for duplicates"
 */

/**
 * RELATED PROBLEMS:
 * - Binary Search Tree Iterator
 * - Kth Smallest Element in BST
 * - Recover Binary Search Tree
 * - Convert Sorted Array to BST
 * - Validate Binary Tree
 */

// Export for testing
module.exports = {
  isValidBST,
  isValidBSTInOrder,
  isValidBSTArray,
  isValidBSTIterative,
  isValidBSTMorris,
  TreeNode,
  buildTree,
};
