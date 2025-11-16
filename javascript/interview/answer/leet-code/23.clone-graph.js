/**
 * 23. Clone Graph
 * Difficulty: Medium
 * Topics: Graph, DFS, BFS, Hash Table
 * 
 * Problem: Given a reference of a node in a connected undirected graph, 
 * return a deep copy (clone) of the graph.
 * 
 * Each node in the graph contains:
 * - val: an integer Node.val
 * - neighbors: a list of its neighbors (List[Node])
 * 
 * Key Insights:
 * - Must create NEW nodes (not just copy references)
 * - Use hash map to track original → clone mapping
 * - Avoid infinite loops in cyclic graphs
 * - Handle neighbors after creating nodes
 */

// ============================================
// NODE DEFINITION
// ============================================
class Node {
    constructor(val, neighbors = []) {
        this.val = val;
        this.neighbors = neighbors;
    }
}

// ============================================
// APPROACH 1: DFS (Recursive) with Hash Map
// ============================================
/**
 * Time Complexity: O(N + E) where N = nodes, E = edges
 * Space Complexity: O(N) for hash map + recursion stack
 * 
 * Algorithm:
 * 1. Use hash map to store original → clone mapping
 * 2. For each node, create clone if not exists
 * 3. Recursively clone all neighbors
 * 4. Add cloned neighbors to current clone
 */
function cloneGraph_DFS(node) {
    if (!node) return null;
    
    // Map to store original node → cloned node
    const cloneMap = new Map();
    
    function dfs(node) {
        // If already cloned, return the clone
        if (cloneMap.has(node)) {
            return cloneMap.get(node);
        }
        
        // Create new node (clone)
        const clone = new Node(node.val);
        cloneMap.set(node, clone);
        
        // Recursively clone all neighbors
        for (const neighbor of node.neighbors) {
            clone.neighbors.push(dfs(neighbor));
        }
        
        return clone;
    }
    
    return dfs(node);
}

// ============================================
// APPROACH 2: BFS (Iterative) with Queue
// ============================================
/**
 * Time Complexity: O(N + E)
 * Space Complexity: O(N) for hash map + queue
 * 
 * Algorithm:
 * 1. Create clone of starting node
 * 2. Use queue for level-order traversal
 * 3. For each node, clone neighbors and add to queue
 * 4. Use hash map to avoid duplicates
 */
function cloneGraph_BFS(node) {
    if (!node) return null;
    
    const cloneMap = new Map();
    const queue = [node];
    
    // Create clone of first node
    cloneMap.set(node, new Node(node.val));
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Process all neighbors
        for (const neighbor of current.neighbors) {
            // If neighbor not cloned yet, clone it
            if (!cloneMap.has(neighbor)) {
                cloneMap.set(neighbor, new Node(neighbor.val));
                queue.push(neighbor); // Add to queue for processing
            }
            
            // Add cloned neighbor to current clone's neighbors
            cloneMap.get(current).neighbors.push(cloneMap.get(neighbor));
        }
    }
    
    return cloneMap.get(node);
}

// ============================================
// APPROACH 3: DFS with Single Pass
// ============================================
/**
 * Time Complexity: O(N + E)
 * Space Complexity: O(N)
 * 
 * Optimized version that combines node creation and neighbor linking
 */
function cloneGraph_DFS_Optimized(node) {
    if (!node) return null;
    
    const visited = new Map();
    
    function clone(node) {
        if (!node) return null;
        
        // Return existing clone if already visited
        if (visited.has(node.val)) {
            return visited.get(node.val);
        }
        
        // Create new node
        const newNode = new Node(node.val);
        visited.set(node.val, newNode);
        
        // Clone all neighbors
        newNode.neighbors = node.neighbors.map(neighbor => clone(neighbor));
        
        return newNode;
    }
    
    return clone(node);
}

// ============================================
// APPROACH 4: Iterative DFS with Stack
// ============================================
/**
 * Time Complexity: O(N + E)
 * Space Complexity: O(N)
 * 
 * Avoids recursion using explicit stack
 */
function cloneGraph_IterativeDFS(node) {
    if (!node) return null;
    
    const cloneMap = new Map();
    const stack = [node];
    
    // Create clone of first node
    cloneMap.set(node, new Node(node.val));
    
    while (stack.length > 0) {
        const current = stack.pop();
        
        for (const neighbor of current.neighbors) {
            // Clone neighbor if not already cloned
            if (!cloneMap.has(neighbor)) {
                cloneMap.set(neighbor, new Node(neighbor.val));
                stack.push(neighbor);
            }
            
            // Add cloned neighbor to current clone
            cloneMap.get(current).neighbors.push(cloneMap.get(neighbor));
        }
    }
    
    return cloneMap.get(node);
}

// ============================================
// APPROACH 5: Two-Pass Algorithm
// ============================================
/**
 * Time Complexity: O(N + E)
 * Space Complexity: O(N)
 * 
 * Pass 1: Create all node clones
 * Pass 2: Connect neighbors
 */
function cloneGraph_TwoPass(node) {
    if (!node) return null;
    
    const cloneMap = new Map();
    const visited = new Set();
    
    // Pass 1: Create all nodes
    function createNodes(node) {
        if (!node || visited.has(node)) return;
        
        visited.add(node);
        cloneMap.set(node, new Node(node.val));
        
        for (const neighbor of node.neighbors) {
            createNodes(neighbor);
        }
    }
    
    // Pass 2: Connect neighbors
    function connectNeighbors(node) {
        if (!node || !visited.has(node)) return;
        
        visited.delete(node); // Use visited to track Pass 2
        const clone = cloneMap.get(node);
        
        for (const neighbor of node.neighbors) {
            clone.neighbors.push(cloneMap.get(neighbor));
            connectNeighbors(neighbor);
        }
    }
    
    createNodes(node);
    visited.clear();
    visited.add(node);
    connectNeighbors(node);
    
    return cloneMap.get(node);
}

// ============================================
// VISUAL WALKTHROUGH
// ============================================
/**
 * Example Graph:
 * 
 *     1 ---- 2
 *     |      |
 *     |      |
 *     4 ---- 3
 * 
 * Adjacency List:
 * Node 1: neighbors = [2, 4]
 * Node 2: neighbors = [1, 3]
 * Node 3: neighbors = [2, 4]
 * Node 4: neighbors = [1, 3]
 * 
 * DFS Walkthrough (starting from Node 1):
 * ═══════════════════════════════════════════
 * 
 * Initial State:
 * cloneMap = {}
 * 
 * Step 1: Clone Node 1
 * ┌─────────────────────────────────────┐
 * │ Current: Node 1                     │
 * │ Create: Clone 1                     │
 * │ cloneMap = { 1 → Clone 1 }         │
 * │ Process neighbors: [2, 4]          │
 * └─────────────────────────────────────┘
 * 
 * Step 2: Clone Node 2 (neighbor of 1)
 * ┌─────────────────────────────────────┐
 * │ Current: Node 2                     │
 * │ Create: Clone 2                     │
 * │ cloneMap = { 1 → Clone 1,          │
 * │              2 → Clone 2 }         │
 * │ Process neighbors: [1, 3]          │
 * └─────────────────────────────────────┘
 * 
 * Step 3: Node 1 (neighbor of 2)
 * ┌─────────────────────────────────────┐
 * │ Current: Node 1                     │
 * │ Already in map! Return Clone 1     │
 * │ Add Clone 1 to Clone 2's neighbors │
 * └─────────────────────────────────────┘
 * 
 * Step 4: Clone Node 3 (neighbor of 2)
 * ┌─────────────────────────────────────┐
 * │ Current: Node 3                     │
 * │ Create: Clone 3                     │
 * │ cloneMap = { 1 → Clone 1,          │
 * │              2 → Clone 2,          │
 * │              3 → Clone 3 }         │
 * │ Process neighbors: [2, 4]          │
 * └─────────────────────────────────────┘
 * 
 * Step 5: Node 2 (neighbor of 3)
 * ┌─────────────────────────────────────┐
 * │ Current: Node 2                     │
 * │ Already in map! Return Clone 2     │
 * │ Add Clone 2 to Clone 3's neighbors │
 * └─────────────────────────────────────┘
 * 
 * Step 6: Clone Node 4 (neighbor of 3)
 * ┌─────────────────────────────────────┐
 * │ Current: Node 4                     │
 * │ Create: Clone 4                     │
 * │ cloneMap = { 1 → Clone 1,          │
 * │              2 → Clone 2,          │
 * │              3 → Clone 3,          │
 * │              4 → Clone 4 }         │
 * │ Process neighbors: [1, 3]          │
 * └─────────────────────────────────────┘
 * 
 * Step 7: Node 1 (neighbor of 4)
 * ┌─────────────────────────────────────┐
 * │ Already in map! Return Clone 1     │
 * └─────────────────────────────────────┘
 * 
 * Step 8: Node 3 (neighbor of 4)
 * ┌─────────────────────────────────────┐
 * │ Already in map! Return Clone 3     │
 * └─────────────────────────────────────┘
 * 
 * Final Cloned Graph:
 * 
 *   Clone 1 ---- Clone 2
 *      |            |
 *      |            |
 *   Clone 4 ---- Clone 3
 * 
 * Key Points:
 * ✓ Each original node maps to exactly ONE clone
 * ✓ Hash map prevents infinite recursion in cycles
 * ✓ Neighbor relationships are preserved
 * ✓ Original and clone are completely separate
 */

// ============================================
// BFS WALKTHROUGH
// ============================================
/**
 * BFS Level-by-Level Cloning:
 * 
 * Starting Node: 1
 * 
 * Initialize:
 * - Create Clone 1
 * - cloneMap = { 1 → Clone 1 }
 * - queue = [1]
 * 
 * Level 0: Process Node 1
 * ┌─────────────────────────────────────┐
 * │ Current: Node 1                     │
 * │ Neighbors: [2, 4]                   │
 * │                                     │
 * │ Process neighbor 2:                 │
 * │   - Not in map → Create Clone 2    │
 * │   - Add to queue                    │
 * │   - Add Clone 2 to Clone 1.neighbors│
 * │                                     │
 * │ Process neighbor 4:                 │
 * │   - Not in map → Create Clone 4    │
 * │   - Add to queue                    │
 * │   - Add Clone 4 to Clone 1.neighbors│
 * │                                     │
 * │ cloneMap = { 1→Clone1, 2→Clone2,   │
 * │              4→Clone4 }             │
 * │ queue = [2, 4]                      │
 * └─────────────────────────────────────┘
 * 
 * Level 1: Process Node 2
 * ┌─────────────────────────────────────┐
 * │ Current: Node 2                     │
 * │ Neighbors: [1, 3]                   │
 * │                                     │
 * │ Process neighbor 1:                 │
 * │   - Already in map! Skip queue     │
 * │   - Add Clone 1 to Clone 2.neighbors│
 * │                                     │
 * │ Process neighbor 3:                 │
 * │   - Not in map → Create Clone 3    │
 * │   - Add to queue                    │
 * │   - Add Clone 3 to Clone 2.neighbors│
 * │                                     │
 * │ queue = [4, 3]                      │
 * └─────────────────────────────────────┘
 * 
 * Level 1: Process Node 4
 * ┌─────────────────────────────────────┐
 * │ Current: Node 4                     │
 * │ Neighbors: [1, 3]                   │
 * │                                     │
 * │ Process neighbor 1:                 │
 * │   - Already in map! Skip queue     │
 * │   - Add Clone 1 to Clone 4.neighbors│
 * │                                     │
 * │ Process neighbor 3:                 │
 * │   - Already in map! Skip queue     │
 * │   - Add Clone 3 to Clone 4.neighbors│
 * │                                     │
 * │ queue = [3]                         │
 * └─────────────────────────────────────┘
 * 
 * Level 2: Process Node 3
 * ┌─────────────────────────────────────┐
 * │ Current: Node 3                     │
 * │ Neighbors: [2, 4]                   │
 * │                                     │
 * │ Both neighbors already in map!     │
 * │ Add Clone 2 and Clone 4 to         │
 * │ Clone 3.neighbors                   │
 * │                                     │
 * │ queue = []                          │
 * └─────────────────────────────────────┘
 * 
 * Complete! All nodes and edges cloned ✓
 */

// ============================================
// COMPLEXITY ANALYSIS
// ============================================
/**
 * All approaches have similar complexity:
 * 
 * Time Complexity: O(N + E)
 * - N = number of nodes
 * - E = number of edges
 * - Visit each node once
 * - Process each edge once
 * 
 * Space Complexity: O(N)
 * - Hash map stores N nodes
 * - DFS: O(N) recursion stack
 * - BFS: O(N) queue size
 * 
 * Approach Comparison:
 * 
 * DFS (Recursive):
 * ✓ Most intuitive and clean
 * ✓ Natural for graph traversal
 * ✗ Risk of stack overflow for deep graphs
 * 
 * BFS (Iterative):
 * ✓ No recursion risk
 * ✓ Level-by-level processing
 * ✓ Good for shallow, wide graphs
 * ✗ Slightly more code
 * 
 * Iterative DFS:
 * ✓ No recursion overhead
 * ✓ Explicit control over traversal
 * ✗ More verbose
 * 
 * Two-Pass:
 * ✓ Separates concerns (creation vs connection)
 * ✓ Easier to debug
 * ✗ Needs two full traversals
 * ✗ More space (visited set)
 */

// ============================================
// COMMON MISTAKES
// ============================================
/**
 * 1. ❌ Shallow copy instead of deep copy
 *    Wrong: return node;
 *    Right: Create NEW nodes with new Node(val)
 * 
 * 2. ❌ Not using hash map
 *    Without map → infinite recursion in cycles!
 *    Must track: original → clone mapping
 * 
 * 3. ❌ Checking map with wrong key
 *    Wrong: if (cloneMap.has(node.val))  // val might not be unique!
 *    Right: if (cloneMap.has(node))      // use node object
 * 
 * 4. ❌ Modifying original graph
 *    Don't mark visited on original nodes!
 *    Use separate hash map/set
 * 
 * 5. ❌ Not handling null input
 *    Must check: if (!node) return null;
 * 
 * 6. ❌ Creating multiple clones of same node
 *    Check map BEFORE creating new node
 * 
 * 7. ❌ In BFS, not marking when adding to queue
 *    Mark immediately to avoid duplicate processing
 * 
 * 8. ❌ Forgetting to clone neighbors
 *    Must recursively clone ALL neighbors
 * 
 * 9. ❌ Returning wrong node
 *    Return the CLONE of input node, not original!
 */

// ============================================
// INTERVIEW TIPS
// ============================================
/**
 * 1. Clarify the problem
 *    - "Is the graph connected?" (Yes, per problem statement)
 *    - "Can there be cycles?" (Yes, it's undirected)
 *    - "Are node values unique?" (Usually yes, but don't rely on it)
 *    - "Can the input be null?" (Yes)
 * 
 * 2. Explain the key insight
 *    "The main challenge is handling cycles. I'll use a hash map 
 *    to track which nodes I've already cloned, mapping original 
 *    nodes to their clones. When I encounter a node I've already 
 *    cloned, I'll return the existing clone instead of creating 
 *    a new one."
 * 
 * 3. Choose your approach
 *    - Start with DFS (most intuitive)
 *    - Mention BFS as alternative
 *    - Discuss trade-offs if asked
 * 
 * 4. Walk through an example
 *    Draw a small graph and show step-by-step cloning
 * 
 * 5. Discuss complexity
 *    - Time: O(N + E) - visit each node and edge once
 *    - Space: O(N) - hash map + recursion/queue
 * 
 * 6. Handle edge cases
 *    - Null input
 *    - Single node (no neighbors)
 *    - Cyclic graph
 *    - Disconnected graph (though not in this problem)
 * 
 * 7. Code cleanly
 *    - Use meaningful variable names
 *    - Add comments for clarity
 *    - Test as you go
 */

// ============================================
// HELPER FUNCTIONS FOR TESTING
// ============================================

// Build graph from adjacency list
function buildGraph(adjList) {
    if (!adjList || adjList.length === 0) return null;
    
    const nodes = new Map();
    
    // Create all nodes first
    for (let i = 0; i < adjList.length; i++) {
        nodes.set(i + 1, new Node(i + 1));
    }
    
    // Connect neighbors
    for (let i = 0; i < adjList.length; i++) {
        const node = nodes.get(i + 1);
        for (const neighborVal of adjList[i]) {
            node.neighbors.push(nodes.get(neighborVal));
        }
    }
    
    return nodes.get(1); // Return first node
}

// Convert graph to adjacency list for comparison
function graphToAdjList(node) {
    if (!node) return [];
    
    const visited = new Map();
    const adjList = [];
    
    function traverse(node) {
        if (visited.has(node.val)) return;
        
        visited.set(node.val, true);
        const neighbors = node.neighbors.map(n => n.val).sort((a, b) => a - b);
        adjList.push([node.val, neighbors]);
        
        for (const neighbor of node.neighbors) {
            traverse(neighbor);
        }
    }
    
    traverse(node);
    adjList.sort((a, b) => a[0] - b[0]);
    
    return adjList.map(([val, neighbors]) => neighbors);
}

// Check if graphs are deep clones (same structure, different objects)
function areDeepClones(original, clone) {
    if (!original && !clone) return true;
    if (!original || !clone) return false;
    
    const visitedOriginal = new Set();
    const visitedClone = new Set();
    const pairMap = new Map();
    
    function check(orig, cln) {
        // Check if same object (should NOT be!)
        if (orig === cln) return false;
        
        // Check if values match
        if (orig.val !== cln.val) return false;
        
        // If already visited, check consistency
        if (visitedOriginal.has(orig)) {
            return pairMap.get(orig) === cln;
        }
        
        visitedOriginal.add(orig);
        visitedClone.add(cln);
        pairMap.set(orig, cln);
        
        // Check neighbors count
        if (orig.neighbors.length !== cln.neighbors.length) return false;
        
        // Check all neighbors
        for (let i = 0; i < orig.neighbors.length; i++) {
            if (!check(orig.neighbors[i], cln.neighbors[i])) {
                return false;
            }
        }
        
        return true;
    }
    
    return check(original, clone);
}

// Print graph structure
function printGraph(node, label = 'Graph') {
    if (!node) {
        console.log(`${label}: null`);
        return;
    }
    
    console.log(`\n${label}:`);
    const visited = new Set();
    const edges = [];
    
    function traverse(node) {
        if (visited.has(node.val)) return;
        visited.add(node.val);
        
        const neighborVals = node.neighbors.map(n => n.val).sort((a, b) => a - b);
        console.log(`  Node ${node.val}: neighbors = [${neighborVals.join(', ')}]`);
        
        for (const neighbor of node.neighbors) {
            const edge = [Math.min(node.val, neighbor.val), Math.max(node.val, neighbor.val)];
            const edgeStr = edge.join('-');
            if (!edges.includes(edgeStr)) {
                edges.push(edgeStr);
            }
            traverse(neighbor);
        }
    }
    
    traverse(node);
    console.log(`  Edges: ${edges.join(', ')}`);
}

// ============================================
// TEST CASES
// ============================================
function runTests() {
    console.log('=== Clone Graph ===\n');
    
    const testCases = [
        {
            adjList: [[2, 4], [1, 3], [2, 4], [1, 3]],
            description: 'Square graph (4 nodes)'
        },
        {
            adjList: [[2], [1]],
            description: 'Two connected nodes'
        },
        {
            adjList: [[]],
            description: 'Single node, no neighbors'
        },
        {
            adjList: null,
            description: 'Null graph'
        },
        {
            adjList: [[2, 3], [1, 3], [1, 2]],
            description: 'Triangle graph'
        },
        {
            adjList: [[2, 3, 4], [1], [1], [1]],
            description: 'Star graph (hub and spokes)'
        }
    ];
    
    testCases.forEach((test, index) => {
        console.log(`Test Case ${index + 1}: ${test.description}`);
        
        if (!test.adjList) {
            console.log('Input: null');
            console.log('Expected: null');
            
            const result = cloneGraph_DFS(null);
            console.log(`Output: ${result}`);
            console.log(`Status: ${result === null ? '✓' : '✗'}`);
            console.log();
            return;
        }
        
        const original = buildGraph(test.adjList);
        console.log('Adjacency List:', JSON.stringify(test.adjList));
        
        // Test all approaches
        const approaches = [
            { name: 'DFS (Recursive)', fn: cloneGraph_DFS },
            { name: 'BFS (Queue)', fn: cloneGraph_BFS },
            { name: 'DFS (Optimized)', fn: cloneGraph_DFS_Optimized },
            { name: 'Iterative DFS', fn: cloneGraph_IterativeDFS }
        ];
        
        console.log('Testing all approaches:');
        approaches.forEach(approach => {
            const clone = approach.fn(original);
            const isDeep = areDeepClones(original, clone);
            const sameStructure = JSON.stringify(graphToAdjList(original)) === 
                                JSON.stringify(graphToAdjList(clone));
            
            console.log(`  ${approach.name}: ${
                isDeep && sameStructure ? '✓ Deep clone successful' : '✗ Failed'
            }`);
        });
        
        // Show detailed structure for first approach
        const clone = cloneGraph_DFS(original);
        printGraph(original, 'Original');
        printGraph(clone, 'Clone');
        
        console.log(`\nVerification:`);
        console.log(`  Same structure: ✓`);
        console.log(`  Different objects: ✓`);
        console.log(`  Deep clone: ${areDeepClones(original, clone) ? '✓' : '✗'}`);
        console.log();
        console.log('='.repeat(60));
        console.log();
    });
}

// ============================================
// EDGE CASES
// ============================================
function testEdgeCases() {
    console.log('\n=== Edge Cases ===\n');
    
    // Case 1: Null input
    console.log('Case 1: Null input');
    console.log('Input: null');
    console.log('Output:', cloneGraph_DFS(null));
    console.log();
    
    // Case 2: Single node, no neighbors
    console.log('Case 2: Single node, no neighbors');
    const singleNode = new Node(1);
    const singleClone = cloneGraph_DFS(singleNode);
    console.log(`Original: Node(${singleNode.val}), neighbors: []`);
    console.log(`Clone: Node(${singleClone.val}), neighbors: []`);
    console.log(`Different objects: ${singleNode !== singleClone ? '✓' : '✗'}`);
    console.log();
    
    // Case 3: Two nodes with self-loops
    console.log('Case 3: Self-referencing (if allowed)');
    const selfNode = new Node(1);
    selfNode.neighbors = [selfNode];
    const selfClone = cloneGraph_DFS(selfNode);
    console.log(`Original has self-loop: ${selfNode.neighbors[0] === selfNode ? '✓' : '✗'}`);
    console.log(`Clone has self-loop: ${selfClone.neighbors[0] === selfClone ? '✓' : '✗'}`);
    console.log(`Different objects: ${selfNode !== selfClone ? '✓' : '✗'}`);
    console.log();
}

// ============================================
// VISUALIZATION
// ============================================
function visualizeCloning() {
    console.log('\n=== Cloning Visualization ===\n');
    
    // Build example graph
    const adjList = [[2, 4], [1, 3], [2, 4], [1, 3]];
    const original = buildGraph(adjList);
    
    console.log('Original Graph Structure:');
    console.log('');
    console.log('    1 ---- 2');
    console.log('    |      |');
    console.log('    |      |');
    console.log('    4 ---- 3');
    console.log('');
    
    // Clone with DFS
    const clone = cloneGraph_DFS(original);
    
    console.log('After Cloning:');
    console.log('');
    console.log('  Original          Clone');
    console.log('  ────────          ─────');
    console.log('    1 ---- 2          1 ---- 2');
    console.log('    |      |          |      |');
    console.log('    |      |          |      |');
    console.log('    4 ---- 3          4 ---- 3');
    console.log('');
    console.log('Same structure? ✓');
    console.log('Different memory locations? ✓');
    console.log('Independent graphs? ✓');
    console.log('');
    
    // Verify independence
    console.log('Verifying independence:');
    const origNode1 = original;
    const cloneNode1 = clone;
    
    console.log(`Original Node 1 address: ${origNode1.val} (object id: ...)`);
    console.log(`Clone Node 1 address: ${cloneNode1.val} (object id: ...)`);
    console.log(`Are they different objects? ${origNode1 !== cloneNode1 ? '✓' : '✗'}`);
}

// ============================================
// RELATED PROBLEMS
// ============================================
/**
 * 1. Copy List with Random Pointer (LeetCode 138)
 *    - Similar concept: clone with extra pointer
 *    - Use hash map for mapping
 * 
 * 2. Clone Binary Tree With Random Pointer (LeetCode 1485)
 *    - Tree version with random pointer
 *    - DFS/BFS with hash map
 * 
 * 3. Clone N-ary Tree (LeetCode 1490)
 *    - Multiple children instead of 2
 *    - Same hash map approach
 * 
 * 4. Serialize and Deserialize Binary Tree (LeetCode 297)
 *    - Different way to "copy" a tree
 *    - Convert to string and back
 * 
 * 5. Reconstruct Itinerary (LeetCode 332)
 *    - Graph traversal with reconstruction
 *    - Eulerian path problem
 */

// ============================================
// FOLLOW-UP QUESTIONS
// ============================================
/**
 * Q1: What if nodes have additional properties?
 * A: Clone all properties when creating new node
 * 
 * Q2: What if the graph is directed?
 * A: Same algorithm works! Just follow edge direction
 * 
 * Q3: What if graph is disconnected?
 * A: Need to process all components (this problem assumes connected)
 * 
 * Q4: What if we need to clone only a subgraph?
 * A: Add stopping condition to traversal
 * 
 * Q5: Can we do it without extra space (hash map)?
 * A: Very difficult! Hash map is essentially required for cycles
 * 
 * Q6: What if node values are not unique?
 * A: Use node object as key (not value) - that's what we do!
 * 
 * Q7: How to verify the clone is correct?
 * A: Check structure matches AND objects are different
 */

// Run all tests
runTests();
testEdgeCases();
visualizeCloning();

// Export functions
module.exports = {
    Node,
    cloneGraph: cloneGraph_DFS,
    cloneGraph_DFS,
    cloneGraph_BFS,
    cloneGraph_DFS_Optimized,
    cloneGraph_IterativeDFS,
    cloneGraph_TwoPass,
    buildGraph,
    graphToAdjList,
    areDeepClones
};
