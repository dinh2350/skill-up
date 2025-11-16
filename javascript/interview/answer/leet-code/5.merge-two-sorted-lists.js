/**
 * LeetCode #21: Merge Two Sorted Lists
 * Difficulty: Easy
 * Topics: Linked List, Recursion
 * 
 * Problem:
 * You are given the heads of two sorted linked lists list1 and list2.
 * Merge the two lists in a one sorted list. The list should be made by 
 * splicing together the nodes of the first two lists.
 * 
 * Return the head of the merged linked list.
 */

// ============================================
// LINKED LIST NODE DEFINITION
// ============================================

class ListNode {
    constructor(val, next = null) {
        this.val = val;
        this.next = next;
    }
}

// ============================================
// APPROACH 1: Iterative with Dummy Node (Optimal)
// Time Complexity: O(n + m)
// Space Complexity: O(1)
// ============================================

/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoLists(list1, list2) {
    // Create a dummy node to simplify edge cases
    const dummy = new ListNode(-1);
    let current = dummy;
    
    // Traverse both lists
    while (list1 !== null && list2 !== null) {
        if (list1.val <= list2.val) {
            current.next = list1;
            list1 = list1.next;
        } else {
            current.next = list2;
            list2 = list2.next;
        }
        current = current.next;
    }
    
    // Attach remaining nodes (if any)
    current.next = list1 !== null ? list1 : list2;
    
    return dummy.next;
}

// ============================================
// APPROACH 2: Recursive (Elegant)
// Time Complexity: O(n + m)
// Space Complexity: O(n + m) - call stack
// ============================================

/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoListsRecursive(list1, list2) {
    // Base cases
    if (list1 === null) return list2;
    if (list2 === null) return list1;
    
    // Recursive case: choose smaller head
    if (list1.val <= list2.val) {
        list1.next = mergeTwoListsRecursive(list1.next, list2);
        return list1;
    } else {
        list2.next = mergeTwoListsRecursive(list1, list2.next);
        return list2;
    }
}

// ============================================
// APPROACH 3: Iterative without Dummy Node
// Time Complexity: O(n + m)
// Space Complexity: O(1)
// ============================================

/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoListsNoDummy(list1, list2) {
    // Handle empty lists
    if (list1 === null) return list2;
    if (list2 === null) return list1;
    
    // Determine head of merged list
    let head, current;
    if (list1.val <= list2.val) {
        head = list1;
        list1 = list1.next;
    } else {
        head = list2;
        list2 = list2.next;
    }
    
    current = head;
    
    // Merge remaining nodes
    while (list1 !== null && list2 !== null) {
        if (list1.val <= list2.val) {
            current.next = list1;
            list1 = list1.next;
        } else {
            current.next = list2;
            list2 = list2.next;
        }
        current = current.next;
    }
    
    // Attach remaining nodes
    current.next = list1 !== null ? list1 : list2;
    
    return head;
}

// ============================================
// APPROACH 4: Using Array (Not Recommended)
// Time Complexity: O(n + m)
// Space Complexity: O(n + m)
// ============================================

/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoListsArray(list1, list2) {
    const values = [];
    
    // Collect all values
    let current = list1;
    while (current !== null) {
        values.push(current.val);
        current = current.next;
    }
    
    current = list2;
    while (current !== null) {
        values.push(current.val);
        current = current.next;
    }
    
    // Sort values
    values.sort((a, b) => a - b);
    
    // Build new linked list
    if (values.length === 0) return null;
    
    const dummy = new ListNode(-1);
    current = dummy;
    
    for (const val of values) {
        current.next = new ListNode(val);
        current = current.next;
    }
    
    return dummy.next;
}

// ============================================
// APPROACH 5: Using Spread Operator + Sort
// Time Complexity: O((n + m) log(n + m))
// Space Complexity: O(n + m)
// ⚠️ NOT OPTIMAL - Doesn't use the sorted property!
// ============================================

/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoListsSpreadSort(list1, list2) {
    // Convert linked lists to arrays
    const arr1 = linkedListToArray(list1);
    const arr2 = linkedListToArray(list2);
    
    // Spread and sort: c = [...a, ...b]; c.sort()
    const merged = [...arr1, ...arr2].sort((a, b) => a - b);
    
    // Convert back to linked list
    return createLinkedList(merged);
}

// ============================================
// COMPARISON: Why Spread+Sort is NOT optimal
// ============================================

/**
 * Let's compare the approaches:
 * 
 * OPTIMAL (Two Pointers):
 * - Time: O(n + m) - linear, takes advantage of sorted lists
 * - Space: O(1) - only pointers
 * - Uses the fact that lists are ALREADY SORTED
 * 
 * SPREAD + SORT:
 * - Time: O((n+m) log(n+m)) - sorting is expensive!
 * - Space: O(n + m) - creates new arrays
 * - IGNORES the sorted property - wastes time re-sorting
 * 
 * Example: If n = 1000, m = 1000:
 * - Two Pointers: ~2000 operations
 * - Spread+Sort: ~20,000 operations (10x slower!)
 * 
 * WHY IT'S BAD FOR INTERVIEWS:
 * 1. Doesn't show understanding of the problem
 * 2. Throws away the "sorted" information
 * 3. Uses unnecessary extra space
 * 4. Much slower time complexity
 * 5. Not what the interviewer wants to see
 * 
 * WHEN IT MIGHT BE ACCEPTABLE:
 * - Quick prototyping/testing
 * - Very small lists (< 10 elements)
 * - You explicitly explain it's suboptimal
 * - As a starting point before optimizing
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a linked list from an array
 * @param {number[]} arr
 * @return {ListNode}
 */
function createLinkedList(arr) {
    if (arr.length === 0) return null;
    
    const dummy = new ListNode(-1);
    let current = dummy;
    
    for (const val of arr) {
        current.next = new ListNode(val);
        current = current.next;
    }
    
    return dummy.next;
}

/**
 * Convert linked list to array
 * @param {ListNode} head
 * @return {number[]}
 */
function linkedListToArray(head) {
    const result = [];
    let current = head;
    
    while (current !== null) {
        result.push(current.val);
        current = current.next;
    }
    
    return result;
}

/**
 * Print linked list
 * @param {ListNode} head
 * @return {string}
 */
function printList(head) {
    const arr = linkedListToArray(head);
    return arr.length > 0 ? arr.join(' -> ') : 'null';
}

// ============================================
// TEST CASES
// ============================================

console.log('=== Merge Two Sorted Lists Test Cases ===\n');

function testMergeTwoLists(testName, arr1, arr2, expected) {
    const list1 = createLinkedList(arr1);
    const list2 = createLinkedList(arr2);
    
    const merged = mergeTwoLists(list1, list2);
    const result = linkedListToArray(merged);
    
    const passed = JSON.stringify(result) === JSON.stringify(expected);
    
    console.log(`${testName}:`);
    console.log(`  List1:    [${arr1.join(',')}] → ${printList(createLinkedList(arr1))}`);
    console.log(`  List2:    [${arr2.join(',')}] → ${printList(createLinkedList(arr2))}`);
    console.log(`  Output:   [${result.join(',')}] → ${printList(merged)}`);
    console.log(`  Expected: [${expected.join(',')}]`);
    console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log();
}

// Test Case 1: Standard case
testMergeTwoLists(
    'Test 1 (Standard)',
    [1, 2, 4],
    [1, 3, 4],
    [1, 1, 2, 3, 4, 4]
);

// Test Case 2: Empty lists
testMergeTwoLists(
    'Test 2 (Both empty)',
    [],
    [],
    []
);

// Test Case 3: One empty list
testMergeTwoLists(
    'Test 3 (First empty)',
    [],
    [0],
    [0]
);

// Test Case 4: Second empty
testMergeTwoLists(
    'Test 4 (Second empty)',
    [1, 2, 3],
    [],
    [1, 2, 3]
);

// Test Case 5: Different lengths
testMergeTwoLists(
    'Test 5 (Different lengths)',
    [1, 3, 5, 7, 9],
    [2, 4],
    [1, 2, 3, 4, 5, 7, 9]
);

// Test Case 6: No overlap
testMergeTwoLists(
    'Test 6 (No overlap)',
    [1, 2, 3],
    [4, 5, 6],
    [1, 2, 3, 4, 5, 6]
);

// Test Case 7: All duplicates
testMergeTwoLists(
    'Test 7 (Duplicates)',
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1, 1, 1, 1]
);

// Test Case 8: Single elements
testMergeTwoLists(
    'Test 8 (Single elements)',
    [5],
    [3],
    [3, 5]
);

// Test Case 9: Negative numbers
testMergeTwoLists(
    'Test 9 (Negative numbers)',
    [-10, -5, 0],
    [-8, -3, 2],
    [-10, -8, -5, -3, 0, 2]
);

// ============================================
// COMPARE ALL APPROACHES
// ============================================

console.log('=== Testing All Approaches ===\n');

const testList1 = createLinkedList([1, 2, 4]);
const testList2 = createLinkedList([1, 3, 4]);

const approaches = [
    { 
        name: 'Iterative with Dummy Node', 
        fn: mergeTwoLists,
        list1: createLinkedList([1, 2, 4]),
        list2: createLinkedList([1, 3, 4])
    },
    { 
        name: 'Recursive', 
        fn: mergeTwoListsRecursive,
        list1: createLinkedList([1, 2, 4]),
        list2: createLinkedList([1, 3, 4])
    },
    { 
        name: 'Iterative without Dummy', 
        fn: mergeTwoListsNoDummy,
        list1: createLinkedList([1, 2, 4]),
        list2: createLinkedList([1, 3, 4])
    },
    { 
        name: 'Using Array', 
        fn: mergeTwoListsArray,
        list1: createLinkedList([1, 2, 4]),
        list2: createLinkedList([1, 3, 4])
    },
    { 
        name: 'Spread + Sort (NOT OPTIMAL)', 
        fn: mergeTwoListsSpreadSort,
        list1: createLinkedList([1, 2, 4]),
        list2: createLinkedList([1, 3, 4])
    }
];

approaches.forEach(approach => {
    const result = approach.fn(approach.list1, approach.list2);
    const arr = linkedListToArray(result);
    console.log(`${approach.name}: [${arr.join(',')}]`);
});

console.log();

// ============================================
// WHY SPREAD + SORT IS BAD (Visual Example)
// ============================================

console.log('=== Why [...a, ...b].sort() is Suboptimal ===\n');

console.log('Given: list1 = [1,2,4], list2 = [1,3,4]');
console.log();

console.log('TWO POINTERS APPROACH (O(n+m)):');
console.log('  Compare: 1 vs 1 → choose 1');
console.log('  Compare: 2 vs 1 → choose 1');
console.log('  Compare: 2 vs 3 → choose 2');
console.log('  Compare: 4 vs 3 → choose 3');
console.log('  Attach remaining: 4, 4');
console.log('  Total comparisons: 4');
console.log('  ✅ Takes advantage of sorted property!');
console.log();

console.log('SPREAD + SORT APPROACH (O((n+m)log(n+m))):');
console.log('  Step 1: Convert to arrays [1,2,4], [1,3,4]');
console.log('  Step 2: Spread [...1,2,4,...1,3,4] = [1,2,4,1,3,4]');
console.log('  Step 3: Sort [1,2,4,1,3,4] → [1,1,2,3,4,4]');
console.log('          Uses quicksort/mergesort internally');
console.log('          ~15-20 comparisons for 6 elements!');
console.log('  Step 4: Convert back to linked list');
console.log('  ❌ Ignores that lists were already sorted!');
console.log();

console.log('COMPLEXITY COMPARISON:');
console.log('┌────────────┬──────────────┬──────────────┐');
console.log('│ List Size  │ Two Pointers │ Spread+Sort  │');
console.log('├────────────┼──────────────┼──────────────┤');
console.log('│ 10+10      │ ~20 ops      │ ~100 ops     │');
console.log('│ 100+100    │ ~200 ops     │ ~1,600 ops   │');
console.log('│ 1000+1000  │ ~2,000 ops   │ ~22,000 ops  │');
console.log('└────────────┴──────────────┴──────────────┘');
console.log();

console.log('INTERVIEWER\'S PERSPECTIVE:');
console.log('  ❌ "They didn\'t notice the lists are sorted"');
console.log('  ❌ "They chose the brute force approach"');
console.log('  ❌ "They don\'t understand time complexity"');
console.log('  ❌ "They\'re wasting the sorted property"');
console.log();

console.log('CORRECT ANSWER IF YOU USE IT:');
console.log('  "I could use [...a, ...b].sort(), but that would be');
console.log('   O((n+m)log(n+m)) and ignore the sorted property.');
console.log('   Better to use two pointers for O(n+m) time."');
console.log();

// ============================================
// PERFORMANCE COMPARISON
// ============================================

console.log('=== Performance Test: Two Pointers vs Spread+Sort ===\n');

// Create large sorted lists
const size = 5000;
console.log(`Testing with lists of size ${size} each...\n`);

// Test Two Pointers
const l1Copy1 = createLinkedList(Array.from({ length: size }, (_, i) => i * 2));
const l2Copy1 = createLinkedList(Array.from({ length: size }, (_, i) => i * 2 + 1));
console.time('Two Pointers O(n+m)');
mergeTwoLists(l1Copy1, l2Copy1);
console.timeEnd('Two Pointers O(n+m)');

// Test Spread + Sort
const l1Copy2 = createLinkedList(Array.from({ length: size }, (_, i) => i * 2));
const l2Copy2 = createLinkedList(Array.from({ length: size }, (_, i) => i * 2 + 1));
console.time('Spread+Sort O((n+m)log(n+m))');
mergeTwoListsSpreadSort(l1Copy2, l2Copy2);
console.timeEnd('Spread+Sort O((n+m)log(n+m))');

console.log('\n💡 Notice: Two Pointers is significantly faster!\n');

// ============================================
// STEP-BY-STEP VISUALIZATION
// ============================================

console.log('=== Step-by-Step Visualization (Iterative) ===\n');

function mergeTwoListsVisualized(list1, list2) {
    console.log('Initial Lists:');
    console.log(`  List1: ${printList(list1)}`);
    console.log(`  List2: ${printList(list2)}`);
    console.log();
    
    const dummy = new ListNode(-1);
    let current = dummy;
    let step = 1;
    
    console.log('Create dummy node: -1');
    console.log();
    
    while (list1 !== null && list2 !== null) {
        console.log(`Step ${step}:`);
        console.log(`  Compare: list1.val = ${list1.val}, list2.val = ${list2.val}`);
        
        if (list1.val <= list2.val) {
            console.log(`  → Choose ${list1.val} from list1`);
            current.next = list1;
            list1 = list1.next;
        } else {
            console.log(`  → Choose ${list2.val} from list2`);
            current.next = list2;
            list2 = list2.next;
        }
        
        current = current.next;
        console.log(`  Merged so far: ${printList(dummy.next)}`);
        console.log();
        step++;
    }
    
    // Attach remaining
    if (list1 !== null) {
        console.log(`Attach remaining from list1: ${printList(list1)}`);
        current.next = list1;
    } else if (list2 !== null) {
        console.log(`Attach remaining from list2: ${printList(list2)}`);
        current.next = list2;
    }
    
    console.log();
    console.log(`Final Result: ${printList(dummy.next)}`);
    return dummy.next;
}

mergeTwoListsVisualized(
    createLinkedList([1, 2, 4]),
    createLinkedList([1, 3, 4])
);

console.log('\n' + '='.repeat(60) + '\n');

// ============================================
// RECURSIVE VISUALIZATION
// ============================================

console.log('=== Recursive Approach Visualization ===\n');

function mergeTwoListsRecursiveVisualized(list1, list2, depth = 0) {
    const indent = '  '.repeat(depth);
    
    console.log(`${indent}mergeTwoLists(${list1?.val ?? 'null'}, ${list2?.val ?? 'null'})`);
    
    // Base cases
    if (list1 === null) {
        console.log(`${indent}→ list1 is null, return list2: ${printList(list2)}`);
        return list2;
    }
    if (list2 === null) {
        console.log(`${indent}→ list2 is null, return list1: ${printList(list1)}`);
        return list1;
    }
    
    // Recursive case
    if (list1.val <= list2.val) {
        console.log(`${indent}→ ${list1.val} ≤ ${list2.val}, choose ${list1.val}`);
        list1.next = mergeTwoListsRecursiveVisualized(list1.next, list2, depth + 1);
        console.log(`${indent}← Return list starting with ${list1.val}`);
        return list1;
    } else {
        console.log(`${indent}→ ${list2.val} < ${list1.val}, choose ${list2.val}`);
        list2.next = mergeTwoListsRecursiveVisualized(list1, list2.next, depth + 1);
        console.log(`${indent}← Return list starting with ${list2.val}`);
        return list2;
    }
}

console.log('Merging [1,2,4] and [1,3,4]:\n');
const recursiveResult = mergeTwoListsRecursiveVisualized(
    createLinkedList([1, 2, 4]),
    createLinkedList([1, 3, 4])
);
console.log(`\nFinal: ${printList(recursiveResult)}`);

console.log('\n' + '='.repeat(60) + '\n');

// ============================================
// ALGORITHM EXPLANATION
// ============================================

console.log('=== Algorithm Explanation ===\n');
console.log('ITERATIVE APPROACH (with Dummy Node):');
console.log('1. Create a dummy node to simplify edge cases');
console.log('2. Use a current pointer starting at dummy');
console.log('3. While both lists have nodes:');
console.log('   - Compare current nodes from both lists');
console.log('   - Link the smaller one to current.next');
console.log('   - Move the pointer of the list we took from');
console.log('   - Move current pointer forward');
console.log('4. Attach remaining nodes from non-empty list');
console.log('5. Return dummy.next (skip dummy node)');
console.log();
console.log('Time Complexity: O(n + m)');
console.log('  - Visit each node exactly once');
console.log();
console.log('Space Complexity: O(1)');
console.log('  - Only using pointers, no extra data structures');
console.log();

console.log('RECURSIVE APPROACH:');
console.log('1. Base cases: if one list is empty, return the other');
console.log('2. Compare heads of both lists');
console.log('3. Choose smaller head as current node');
console.log('4. Recursively merge rest of lists');
console.log('5. Return the chosen head');
console.log();
console.log('Time Complexity: O(n + m)');
console.log('Space Complexity: O(n + m) - recursion call stack');
console.log();

// ============================================
// VISUAL DIAGRAM
// ============================================

console.log('=== Visual Diagram ===\n');
console.log('Example: Merge [1,2,4] and [1,3,4]');
console.log();
console.log('Initial:');
console.log('  List1: 1 → 2 → 4 → null');
console.log('  List2: 1 → 3 → 4 → null');
console.log();
console.log('Step-by-step:');
console.log('  Dummy → 1 (list1) → 1 (list2) → 2 (list1) → 3 (list2) → 4 (list1) → 4 (list2) → null');
console.log('          ↑');
console.log('       Compare 1 vs 1, choose list1');
console.log();
console.log('Final Result:');
console.log('  1 → 1 → 2 → 3 → 4 → 4 → null');
console.log();

// ============================================
// EDGE CASES
// ============================================

console.log('=== Edge Cases to Consider ===\n');

const edgeCases = [
    { list1: [], list2: [], expected: [], description: 'Both empty' },
    { list1: [1], list2: [], expected: [1], description: 'Second empty' },
    { list1: [], list2: [1], expected: [1], description: 'First empty' },
    { list1: [1], list2: [1], expected: [1, 1], description: 'Both single, equal' },
    { list1: [1, 2, 3], list2: [4, 5, 6], expected: [1, 2, 3, 4, 5, 6], description: 'No overlap' },
    { list1: [1, 1, 1], list2: [2, 2, 2], expected: [1, 1, 1, 2, 2, 2], description: 'All duplicates' },
    { list1: [-1, 0, 1], list2: [-2, 2], expected: [-2, -1, 0, 1, 2], description: 'Negative numbers' },
    { list1: [1], list2: [1, 2, 3, 4, 5], expected: [1, 1, 2, 3, 4, 5], description: 'Very different lengths' }
];

edgeCases.forEach((testCase, index) => {
    const l1 = createLinkedList(testCase.list1);
    const l2 = createLinkedList(testCase.list2);
    const result = linkedListToArray(mergeTwoLists(l1, l2));
    const status = JSON.stringify(result) === JSON.stringify(testCase.expected) ? '✅' : '❌';
    
    console.log(`${index + 1}. ${status} ${testCase.description}`);
    console.log(`   Input: [${testCase.list1.join(',')}] + [${testCase.list2.join(',')}]`);
    console.log(`   Output: [${result.join(',')}] (expected: [${testCase.expected.join(',')}])`);
});

console.log();

// ============================================
// INTERVIEW TIPS
// ============================================

console.log('=== Interview Tips ===\n');
console.log('✨ Key Points to Mention:');
console.log('  1. Dummy node simplifies edge cases (no special handling for head)');
console.log('  2. Both iterative and recursive solutions are valid');
console.log('  3. Iterative is more space-efficient (O(1) vs O(n))');
console.log('  4. Lists are already sorted - take advantage of this!');
console.log();
console.log('🎯 What Interviewers Look For:');
console.log('  - Understanding of linked list manipulation');
console.log('  - Proper pointer management (avoiding null pointer errors)');
console.log('  - Handling edge cases (empty lists)');
console.log('  - Clean, readable code');
console.log();
console.log('⚠️  Common Mistakes to Avoid:');
console.log('  - Forgetting to handle empty lists');
console.log('  - Not attaching remaining nodes after one list ends');
console.log('  - Losing track of the head node');
console.log('  - Creating new nodes instead of reusing existing ones');
console.log('  - Forgetting to return dummy.next (not dummy)');
console.log();
console.log('💡 Optimization Tips:');
console.log('  - Dummy node eliminates special case for head');
console.log('  - Iterative approach saves stack space');
console.log('  - No need to create new nodes, just rewire pointers');
console.log();
console.log('🗣️  What to Say:');
console.log('  "I\'ll use a dummy node to simplify edge cases..."');
console.log('  "Since both lists are sorted, I can merge in O(n+m) time..."');
console.log('  "I\'ll maintain a current pointer and compare nodes..."');
console.log();

// ============================================
// FOLLOW-UP QUESTIONS
// ============================================

console.log('=== Common Follow-up Questions ===\n');
console.log('Q1: What if the lists weren\'t sorted?');
console.log('A: Would need to sort first or use different approach (heap, etc.)');
console.log();
console.log('Q2: Can you do it in-place?');
console.log('A: Yes! We\'re already reusing nodes, just rewiring pointers');
console.log();
console.log('Q3: What about merging K sorted lists?');
console.log('A: Use a min-heap or divide-and-conquer approach');
console.log('   (LeetCode #23: Merge k Sorted Lists)');
console.log();
console.log('Q4: Recursive vs Iterative - which is better?');
console.log('A: Iterative is better for production (O(1) space)');
console.log('   Recursive is more elegant but uses O(n) stack space');
console.log();

// ============================================
// RELATED PROBLEMS
// ============================================

console.log('=== Related Problems ===\n');
console.log('1. Merge k Sorted Lists (LeetCode #23) - Hard');
console.log('   - Merge multiple sorted lists');
console.log();
console.log('2. Merge Sorted Array (LeetCode #88) - Easy');
console.log('   - Similar concept but with arrays');
console.log();
console.log('3. Sort List (LeetCode #148) - Medium');
console.log('   - Sort an unsorted linked list');
console.log();
console.log('4. Add Two Numbers (LeetCode #2) - Medium');
console.log('   - Add two numbers represented as linked lists');
console.log();

// ============================================
// COMPLEXITY ANALYSIS
// ============================================

console.log('=== Complexity Analysis ===\n');
console.log('Given: list1 has n nodes, list2 has m nodes');
console.log();
console.log('Iterative Approach:');
console.log('  Time:  O(n + m) - visit each node once');
console.log('  Space: O(1) - only using pointers');
console.log();
console.log('Recursive Approach:');
console.log('  Time:  O(n + m) - visit each node once');
console.log('  Space: O(n + m) - recursion call stack depth');
console.log();
console.log('Why O(n + m)?');
console.log('  - We process each node from both lists exactly once');
console.log('  - No nested loops or repeated work');
console.log();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ListNode,
        mergeTwoLists,
        mergeTwoListsRecursive,
        mergeTwoListsNoDummy,
        mergeTwoListsArray,
        createLinkedList,
        linkedListToArray,
        printList
    };
}
