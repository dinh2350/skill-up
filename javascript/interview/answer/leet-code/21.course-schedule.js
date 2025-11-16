/**
 * 21. Course Schedule (Cycle Detection)
 * Difficulty: Medium
 * Topics: Graph, DFS, BFS, Topological Sort
 *
 * Problem: There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1.
 * Given the total number of courses and prerequisites, return if you can finish all courses.
 *
 * Prerequisites format: [a, b] means you must take course b before course a
 *
 * Key Insight: This is a CYCLE DETECTION problem in a directed graph
 * - If there's a cycle → impossible to complete all courses
 * - If no cycle → can complete all courses
 */

// ============================================
// APPROACH 1: DFS with States (Most Common Interview Solution)
// ============================================
/**
 * Time Complexity: O(V + E) where V = numCourses, E = prerequisites.length
 * Space Complexity: O(V + E) for adjacency list and recursion stack
 *
 * States:
 * - UNVISITED (0): Not yet visited
 * - VISITING (1): Currently in DFS path (if we see this again, it's a cycle!)
 * - VISITED (2): Completely processed (safe, no cycle from this node)
 */
function canFinish_DFS(numCourses, prerequisites) {
  // Build adjacency list
  const graph = Array.from({ length: numCourses }, () => []);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course); // prereq -> course edge
  }

  // States: 0 = unvisited, 1 = visiting, 2 = visited
  const state = new Array(numCourses).fill(0);

  // Helper: Check if there's a cycle starting from 'course'
  function hasCycle(course) {
    if (state[course] === 1) return true; // Cycle detected!
    if (state[course] === 2) return false; // Already checked, safe

    // Mark as visiting
    state[course] = 1;

    // Check all neighbors
    for (const nextCourse of graph[course]) {
      if (hasCycle(nextCourse)) {
        return true;
      }
    }

    // Mark as visited (finished processing)
    state[course] = 2;
    return false;
  }

  // Check each course (handle disconnected components)
  for (let i = 0; i < numCourses; i++) {
    if (state[i] === 0 && hasCycle(i)) {
      return false;
    }
  }

  return true;
}

// ============================================
// APPROACH 2: BFS - Kahn's Algorithm (Topological Sort)
// ============================================
/**
 * Time Complexity: O(V + E)
 * Space Complexity: O(V + E)
 *
 * Algorithm:
 * 1. Calculate in-degree for each node
 * 2. Add all nodes with in-degree 0 to queue
 * 3. Process queue: remove node, decrease neighbors' in-degree
 * 4. If processed all nodes → no cycle, else cycle exists
 */
function canFinish_BFS(numCourses, prerequisites) {
  // Build adjacency list and in-degree array
  const graph = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    inDegree[course]++;
  }

  // Initialize queue with courses that have no prerequisites
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  let processedCourses = 0;

  // Process courses
  while (queue.length > 0) {
    const course = queue.shift();
    processedCourses++;

    // Remove this course from graph
    for (const nextCourse of graph[course]) {
      inDegree[nextCourse]--;

      // If no more prerequisites, add to queue
      if (inDegree[nextCourse] === 0) {
        queue.push(nextCourse);
      }
    }
  }

  // If we processed all courses, no cycle exists
  return processedCourses === numCourses;
}

// ============================================
// APPROACH 3: DFS with Path Tracking (Visual Understanding)
// ============================================
/**
 * Time Complexity: O(V + E)
 * Space Complexity: O(V + E)
 *
 * Explicitly tracks the current path to detect cycles
 */
function canFinish_PathTracking(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
  }

  const visited = new Set();
  const currentPath = new Set();

  function dfs(course) {
    if (currentPath.has(course)) return false; // Cycle!
    if (visited.has(course)) return true; // Already checked

    currentPath.add(course);

    for (const nextCourse of graph[course]) {
      if (!dfs(nextCourse)) {
        return false;
      }
    }

    currentPath.delete(course);
    visited.add(course);
    return true;
  }

  for (let i = 0; i < numCourses; i++) {
    if (!visited.has(i) && !dfs(i)) {
      return false;
    }
  }

  return true;
}

// ============================================
// APPROACH 4: Optimized DFS (Early Termination)
// ============================================
/**
 * Time Complexity: O(V + E)
 * Space Complexity: O(V + E)
 *
 * Optimizations:
 * - Store safe nodes to avoid reprocessing
 * - Early termination on first cycle detection
 */
function canFinish_Optimized(numCourses, prerequisites) {
  const graph = new Map();

  // Build adjacency list
  for (let i = 0; i < numCourses; i++) {
    graph.set(i, []);
  }

  for (const [course, prereq] of prerequisites) {
    graph.get(prereq).push(course);
  }

  const visiting = new Set();
  const safe = new Set();

  function isCyclic(course) {
    if (safe.has(course)) return false;
    if (visiting.has(course)) return true;

    visiting.add(course);

    for (const next of graph.get(course)) {
      if (isCyclic(next)) {
        return true;
      }
    }

    visiting.delete(course);
    safe.add(course);
    return false;
  }

  for (let i = 0; i < numCourses; i++) {
    if (isCyclic(i)) {
      return false;
    }
  }

  return true;
}

// ============================================
// VISUAL WALKTHROUGH
// ============================================
/**
 * Example 1: numCourses = 4, prerequisites = [[1,0], [2,0], [3,1], [3,2]]
 *
 * Graph visualization:
 *     0 → 1 → 3
 *     ↓       ↑
 *     2 ------┘
 *
 * Step-by-step DFS (using states):
 *
 * Initial: state = [0, 0, 0, 0]
 *
 * Start with course 0:
 * 1. state[0] = 1 (visiting)
 *    → Check neighbors: [1, 2]
 *
 * 2. Visit course 1:
 *    state[1] = 1 (visiting)
 *    → Check neighbors: [3]
 *
 * 3. Visit course 3:
 *    state[3] = 1 (visiting)
 *    → Check neighbors: [] (no neighbors)
 *    state[3] = 2 (visited) ✓
 *
 * 4. Back to course 1:
 *    state[1] = 2 (visited) ✓
 *
 * 5. Back to course 0, check course 2:
 *    state[2] = 1 (visiting)
 *    → Check neighbors: [3]
 *    → Course 3 already visited (state[3] = 2) ✓
 *    state[2] = 2 (visited) ✓
 *
 * 6. Back to course 0:
 *    state[0] = 2 (visited) ✓
 *
 * Final state: [2, 2, 2, 2] - All visited, NO CYCLE!
 * Result: true ✓
 *
 * ----------------------------------------
 *
 * Example 2: numCourses = 2, prerequisites = [[1,0], [0,1]]
 *
 * Graph visualization:
 *     0 ⇄ 1  (bidirectional = cycle!)
 *
 * DFS detection:
 * 1. state[0] = 1 (visiting)
 *    → Check neighbor: [1]
 *
 * 2. state[1] = 1 (visiting)
 *    → Check neighbor: [0]
 *
 * 3. Check course 0:
 *    state[0] === 1 → CYCLE DETECTED! ✗
 *
 * Result: false ✗
 */

// ============================================
// BFS (KAHN'S ALGORITHM) WALKTHROUGH
// ============================================
/**
 * Example: numCourses = 4, prerequisites = [[1,0], [2,0], [3,1], [3,2]]
 *
 * Step 1: Build graph and calculate in-degrees
 * graph:
 *   0 → [1, 2]
 *   1 → [3]
 *   2 → [3]
 *   3 → []
 *
 * inDegree: [0, 1, 1, 2]
 *            ↑  ↑  ↑  ↑
 *            0  1  2  3
 *
 * Step 2: Find courses with in-degree 0
 * queue = [0]
 * processedCourses = 0
 *
 * Step 3: Process queue
 *
 * Iteration 1:
 * - Dequeue: 0
 * - processedCourses = 1
 * - Process neighbors [1, 2]:
 *   inDegree[1] = 0 → queue = [1]
 *   inDegree[2] = 0 → queue = [1, 2]
 * - inDegree: [0, 0, 0, 2]
 *
 * Iteration 2:
 * - Dequeue: 1
 * - processedCourses = 2
 * - Process neighbors [3]:
 *   inDegree[3] = 1
 * - inDegree: [0, 0, 0, 1]
 *
 * Iteration 3:
 * - Dequeue: 2
 * - processedCourses = 3
 * - Process neighbors [3]:
 *   inDegree[3] = 0 → queue = [3]
 * - inDegree: [0, 0, 0, 0]
 *
 * Iteration 4:
 * - Dequeue: 3
 * - processedCourses = 4
 * - No neighbors
 *
 * Final: processedCourses (4) === numCourses (4) ✓
 * Result: true
 *
 * Course order: 0 → 1 → 2 → 3 (valid topological sort!)
 */

// ============================================
// COMPLEXITY ANALYSIS
// ============================================
/**
 * All approaches:
 * Time: O(V + E) where V = numCourses, E = prerequisites.length
 *   - Build graph: O(E)
 *   - DFS/BFS: Visit each node once + traverse each edge once = O(V + E)
 *
 * Space: O(V + E)
 *   - Adjacency list: O(V + E)
 *   - DFS: O(V) recursion stack + O(V) state array
 *   - BFS: O(V) queue + O(V) in-degree array
 *
 * When to use which approach:
 *
 * DFS with States (Approach 1):
 * ✓ Most common in interviews
 * ✓ Intuitive cycle detection logic
 * ✓ Easy to explain with states
 *
 * BFS - Kahn's Algorithm (Approach 2):
 * ✓ If you need the actual topological order
 * ✓ More intuitive for some people (level by level)
 * ✓ Easier to understand why it works
 *
 * DFS with Path Tracking (Approach 3):
 * ✓ Visual understanding of "current path"
 * ✓ Good for explaining to others
 *
 * Optimized DFS (Approach 4):
 * ✓ Production code (slight optimization)
 * ✓ Shows advanced understanding
 */

// ============================================
// COMMON MISTAKES
// ============================================
/**
 * 1. ❌ Wrong edge direction in graph
 *    prerequisites = [[1, 0]] means 0 → 1 (not 1 → 0)
 *    Must take 0 before 1
 *
 * 2. ❌ Not handling disconnected components
 *    Must check ALL courses in main loop
 *
 * 3. ❌ Forgetting to reset state in DFS
 *    Must change state[i] = 1 to state[i] = 2 after processing
 *
 * 4. ❌ Using visited instead of three states
 *    Visited alone can't detect cycles in DFS
 *    Need: UNVISITED, VISITING, VISITED
 *
 * 5. ❌ In BFS, checking if processedCourses > 0
 *    Should check: processedCourses === numCourses
 *
 * 6. ❌ Not understanding the difference between:
 *    - Visited in BFS: Already processed and removed
 *    - Visiting in DFS: Currently in recursion stack
 */

// ============================================
// INTERVIEW TIPS
// ============================================
/**
 * 1. Clarify prerequisite format
 *    "For [a, b], do I need to take b before a?"
 *
 * 2. Ask about constraints
 *    - Can there be duplicate prerequisites?
 *    - Self-loops possible? [1, 1]
 *    - Empty prerequisites array?
 *
 * 3. State your approach clearly
 *    "This is a cycle detection problem. I'll use DFS with three states..."
 *
 * 4. Explain the states/colors
 *    White (0): Not visited
 *    Gray (1): Visiting (in current path)
 *    Black (2): Visited (completely processed)
 *
 * 5. Discuss trade-offs
 *    - DFS: More intuitive for cycle detection
 *    - BFS: Can get topological order for free
 *
 * 6. Mention related problems
 *    - Course Schedule II (return the order)
 *    - Detect cycle in directed graph
 *    - Alien Dictionary
 *
 * 7. Handle edge cases
 *    - numCourses = 0 or 1
 *    - prerequisites = []
 *    - No dependencies (all isolated courses)
 */

// ============================================
// EDGE CASES
// ============================================
function testEdgeCases() {
  console.log("\n=== Edge Cases ===\n");

  // Case 1: No prerequisites
  console.log("Case 1: No prerequisites");
  console.log("Input: numCourses = 3, prerequisites = []");
  console.log("Expected: true");
  console.log("Output:", canFinish_DFS(3, []));

  // Case 2: Single course
  console.log("\nCase 2: Single course");
  console.log("Input: numCourses = 1, prerequisites = []");
  console.log("Expected: true");
  console.log("Output:", canFinish_DFS(1, []));

  // Case 3: Self-loop (if possible)
  console.log("\nCase 3: Self-loop");
  console.log("Input: numCourses = 1, prerequisites = [[0,0]]");
  console.log("Expected: false");
  console.log("Output:", canFinish_DFS(1, [[0, 0]]));

  // Case 4: Linear chain (no cycle)
  console.log("\nCase 4: Linear chain");
  console.log(
    "Input: numCourses = 5, prerequisites = [[1,0],[2,1],[3,2],[4,3]]"
  );
  console.log("Expected: true");
  console.log(
    "Output:",
    canFinish_DFS(5, [
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3],
    ])
  );

  // Case 5: Multiple disconnected components
  console.log("\nCase 5: Disconnected components");
  console.log("Input: numCourses = 4, prerequisites = [[1,0],[3,2]]");
  console.log("Expected: true");
  console.log(
    "Output:",
    canFinish_DFS(4, [
      [1, 0],
      [3, 2],
    ])
  );

  // Case 6: Large cycle
  console.log("\nCase 6: Large cycle");
  console.log(
    "Input: numCourses = 5, prerequisites = [[1,0],[2,1],[3,2],[4,3],[0,4]]"
  );
  console.log("Expected: false (cycle: 0→1→2→3→4→0)");
  console.log(
    "Output:",
    canFinish_DFS(5, [
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3],
      [0, 4],
    ])
  );
}

// ============================================
// TEST CASES
// ============================================
function runTests() {
  console.log("=== Course Schedule - Cycle Detection ===\n");

  const testCases = [
    {
      numCourses: 2,
      prerequisites: [[1, 0]],
      expected: true,
      description: "Simple case: 0 → 1",
    },
    {
      numCourses: 2,
      prerequisites: [
        [1, 0],
        [0, 1],
      ],
      expected: false,
      description: "Simple cycle: 0 ⇄ 1",
    },
    {
      numCourses: 4,
      prerequisites: [
        [1, 0],
        [2, 0],
        [3, 1],
        [3, 2],
      ],
      expected: true,
      description: "DAG with multiple paths",
    },
    {
      numCourses: 3,
      prerequisites: [
        [1, 0],
        [1, 2],
        [0, 1],
      ],
      expected: false,
      description: "Cycle: 0 → 1 → 0",
    },
    {
      numCourses: 5,
      prerequisites: [
        [1, 4],
        [2, 4],
        [3, 1],
        [3, 2],
      ],
      expected: true,
      description: "Diamond pattern (DAG)",
    },
  ];

  testCases.forEach((test, index) => {
    console.log(`Test Case ${index + 1}: ${test.description}`);
    console.log(
      `Input: numCourses = ${test.numCourses}, prerequisites = ${JSON.stringify(
        test.prerequisites
      )}`
    );
    console.log(`Expected: ${test.expected}`);

    const result1 = canFinish_DFS(test.numCourses, test.prerequisites);
    const result2 = canFinish_BFS(test.numCourses, test.prerequisites);
    const result3 = canFinish_PathTracking(test.numCourses, test.prerequisites);
    const result4 = canFinish_Optimized(test.numCourses, test.prerequisites);

    console.log(
      `DFS (States):     ${result1} ${result1 === test.expected ? "✓" : "✗"}`
    );
    console.log(
      `BFS (Kahn):       ${result2} ${result2 === test.expected ? "✓" : "✗"}`
    );
    console.log(
      `DFS (Path Track): ${result3} ${result3 === test.expected ? "✓" : "✗"}`
    );
    console.log(
      `DFS (Optimized):  ${result4} ${result4 === test.expected ? "✓" : "✗"}`
    );
    console.log();
  });

  testEdgeCases();
}

// ============================================
// COMPARISON: DFS vs BFS
// ============================================
/**
 * DFS Approach:
 * ✓ Pros:
 *   - Easier to understand cycle detection (visiting state)
 *   - Less memory in best case (no queue)
 *   - Natural recursion
 *
 * ✗ Cons:
 *   - Stack overflow risk with deep graphs
 *   - Harder to get topological order
 *
 * BFS Approach (Kahn's):
 * ✓ Pros:
 *   - Natural topological sort (course order)
 *   - No recursion (iterative)
 *   - Intuitive level-by-level processing
 *
 * ✗ Cons:
 *   - Needs extra space for in-degree array
 *   - Slightly more code
 *
 * Interview Choice:
 * - Explain DFS first (more intuitive for cycle detection)
 * - Mention BFS as alternative
 * - If asked for course order → use BFS
 */

// ============================================
// RELATED PROBLEMS
// ============================================
/**
 * 1. Course Schedule II (LeetCode 210)
 *    - Return the course order (topological sort)
 *    - Use BFS and return the processed order
 *
 * 2. Course Schedule III (LeetCode 630)
 *    - Maximum courses with time constraints
 *    - Greedy + Priority Queue
 *
 * 3. Alien Dictionary (LeetCode 269)
 *    - Build graph from word order
 *    - Topological sort to get character order
 *
 * 4. Minimum Height Trees (LeetCode 310)
 *    - Reverse topological sort
 *    - Remove leaves iteratively
 *
 * 5. Parallel Courses (LeetCode 1136)
 *    - Topological sort with level tracking
 *    - Return minimum semesters needed
 */

// Run tests
runTests();

// Export functions for use in other files
module.exports = {
  canFinish: canFinish_DFS,
  canFinish_DFS,
  canFinish_BFS,
  canFinish_PathTracking,
  canFinish_Optimized,
};
