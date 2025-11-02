/**
 * LeetCode #344: Reverse String
 * Difficulty: Easy
 * Topics: String, Two Pointers
 * 
 * Problem:
 * Write a function that reverses a string. 
 * The input string is given as an array of characters s.
 * 
 * You must do this by modifying the input array in-place with O(1) extra memory.
 */

// ============================================
// APPROACH 1: Two Pointers (Optimal)
// Time Complexity: O(n)
// Space Complexity: O(1) - in-place
// ============================================

/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
function reverseString(s) {
    let left = 0;
    let right = s.length - 1;
    
    // Swap characters from both ends moving towards center
    while (left < right) {
        // Swap using destructuring
        [s[left], s[right]] = [s[right], s[left]];
        
        left++;
        right--;
    }
}

// ============================================
// APPROACH 2: Two Pointers with Temp Variable
// Time Complexity: O(n)
// Space Complexity: O(1)
// ============================================

/**
 * @param {character[]} s
 * @return {void}
 */
function reverseStringWithTemp(s) {
    let left = 0;
    let right = s.length - 1;
    
    while (left < right) {
        // Traditional swap using temp variable
        const temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        
        left++;
        right--;
    }
}

// ============================================
// APPROACH 3: Two Pointers with XOR Swap
// Time Complexity: O(n)
// Space Complexity: O(1)
// Note: Only works for same type values
// ============================================

/**
 * @param {character[]} s
 * @return {void}
 */
function reverseStringXOR(s) {
    let left = 0;
    let right = s.length - 1;
    
    while (left < right) {
        // XOR swap trick (works with ASCII values)
        if (s[left] !== s[right]) {
            s[left] = String.fromCharCode(s[left].charCodeAt(0) ^ s[right].charCodeAt(0));
            s[right] = String.fromCharCode(s[left].charCodeAt(0) ^ s[right].charCodeAt(0));
            s[left] = String.fromCharCode(s[left].charCodeAt(0) ^ s[right].charCodeAt(0));
        }
        
        left++;
        right--;
    }
}

// ============================================
// APPROACH 4: Recursion
// Time Complexity: O(n)
// Space Complexity: O(n) - call stack
// ============================================

/**
 * @param {character[]} s
 * @return {void}
 */
function reverseStringRecursive(s) {
    function helper(left, right) {
        if (left >= right) return;
        
        // Swap
        [s[left], s[right]] = [s[right], s[left]];
        
        // Recursive call
        helper(left + 1, right - 1);
    }
    
    helper(0, s.length - 1);
}

// ============================================
// APPROACH 5: Using Built-in reverse() method
// Time Complexity: O(n)
// Space Complexity: O(1) - in-place
// Note: This is the simplest but not suitable for interviews
// ============================================

/**
 * @param {character[]} s
 * @return {void}
 */
function reverseStringBuiltIn(s) {
    s.reverse();
}

// ============================================
// APPROACH 6: For Loop (Half-way swap)
// Time Complexity: O(n)
// Space Complexity: O(1)
// ============================================

/**
 * @param {character[]} s
 * @return {void}
 */
function reverseStringForLoop(s) {
    const n = s.length;
    
    // Only need to iterate halfway
    for (let i = 0; i < Math.floor(n / 2); i++) {
        [s[i], s[n - 1 - i]] = [s[n - 1 - i], s[i]];
    }
}

// ============================================
// TEST CASES
// ============================================

console.log('=== Reverse String Test Cases ===\n');

// Helper function to test and display results
function testReverseString(testName, input, expected, fn) {
    const original = [...input]; // Keep original for display
    fn(input);
    const passed = JSON.stringify(input) === JSON.stringify(expected);
    
    console.log(`${testName}:`);
    console.log(`Input:    [${original.map(c => `"${c}"`).join(',')}]`);
    console.log(`Output:   [${input.map(c => `"${c}"`).join(',')}]`);
    console.log(`Expected: [${expected.map(c => `"${c}"`).join(',')}]`);
    console.log(`Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log();
}

// Test Case 1: Standard case
const test1 = ["h", "e", "l", "l", "o"];
testReverseString('Test 1 (Standard)', test1, ["o", "l", "l", "e", "h"], reverseString);

// Test Case 2: Palindrome
const test2 = ["H", "a", "n", "n", "a", "h"];
testReverseString('Test 2 (Palindrome)', test2, ["h", "a", "n", "n", "a", "H"], reverseString);

// Test Case 3: Single character
const test3 = ["A"];
testReverseString('Test 3 (Single char)', test3, ["A"], reverseString);

// Test Case 4: Two characters
const test4 = ["A", "B"];
testReverseString('Test 4 (Two chars)', test4, ["B", "A"], reverseString);

// Test Case 5: Empty array
const test5 = [];
testReverseString('Test 5 (Empty)', test5, [], reverseString);

// Test Case 6: With numbers and special chars
const test6 = ["1", "2", "!", "@", "#"];
testReverseString('Test 6 (Mixed)', test6, ["#", "@", "!", "2", "1"], reverseString);

// Test Case 7: Long string
const test7 = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
testReverseString('Test 7 (Long)', test7, ["j", "i", "h", "g", "f", "e", "d", "c", "b", "a"], reverseString);

// ============================================
// COMPARE ALL APPROACHES
// ============================================

console.log('=== Testing All Approaches ===\n');

const testInput = ["h", "e", "l", "l", "o"];

// Test all approaches
const approaches = [
    { name: 'Two Pointers (Destructuring)', fn: reverseString },
    { name: 'Two Pointers (Temp Variable)', fn: reverseStringWithTemp },
    { name: 'Recursion', fn: reverseStringRecursive },
    { name: 'Built-in reverse()', fn: reverseStringBuiltIn },
    { name: 'For Loop', fn: reverseStringForLoop }
];

approaches.forEach(approach => {
    const input = [...testInput];
    approach.fn(input);
    console.log(`${approach.name}: [${input.map(c => `"${c}"`).join(',')}]`);
});

console.log();

// ============================================
// PERFORMANCE COMPARISON
// ============================================

console.log('=== Performance Comparison ===\n');

// Generate large test array
const largeArray = Array.from({ length: 1000000 }, (_, i) => String.fromCharCode(65 + (i % 26)));

// Test Two Pointers
const test1Array = [...largeArray];
console.time('Two Pointers (1M elements)');
reverseString(test1Array);
console.timeEnd('Two Pointers (1M elements)');

// Test Built-in
const test2Array = [...largeArray];
console.time('Built-in reverse (1M elements)');
reverseStringBuiltIn(test2Array);
console.timeEnd('Built-in reverse (1M elements)');

// Test For Loop
const test3Array = [...largeArray];
console.time('For Loop (1M elements)');
reverseStringForLoop(test3Array);
console.timeEnd('For Loop (1M elements)');

console.log();

// ============================================
// VISUAL STEP-BY-STEP EXPLANATION
// ============================================

console.log('=== Step-by-Step Visualization ===\n');

function reverseStringVisualized(s) {
    console.log('Input:', s);
    console.log();
    
    let left = 0;
    let right = s.length - 1;
    let step = 1;
    
    while (left < right) {
        console.log(`Step ${step}:`);
        console.log(`  Before: [${s.join(',')}]`);
        console.log(`  Swap index ${left} ("${s[left]}") with index ${right} ("${s[right]}")`);
        
        [s[left], s[right]] = [s[right], s[left]];
        
        console.log(`  After:  [${s.join(',')}]`);
        console.log();
        
        left++;
        right--;
        step++;
    }
    
    console.log('Final:', s);
}

const visualDemo = ["h", "e", "l", "l", "o"];
reverseStringVisualized(visualDemo);

console.log();

// ============================================
// ALGORITHM EXPLANATION
// ============================================

console.log('=== Algorithm Explanation ===\n');
console.log('TWO POINTERS APPROACH (Optimal):');
console.log('1. Initialize two pointers: left (start) and right (end)');
console.log('2. While left < right:');
console.log('   - Swap elements at left and right positions');
console.log('   - Move left pointer forward (left++)');
console.log('   - Move right pointer backward (right--)');
console.log('3. Continue until pointers meet in the middle');
console.log();
console.log('Time Complexity: O(n/2) = O(n)');
console.log('  - We only need to swap half the elements');
console.log();
console.log('Space Complexity: O(1)');
console.log('  - Only using two pointer variables');
console.log('  - Modifying array in-place');
console.log();

// ============================================
// EDGE CASES
// ============================================

console.log('=== Edge Cases to Consider ===\n');
console.log('1. ✅ Empty array []');
console.log('2. ✅ Single character ["a"]');
console.log('3. ✅ Two characters ["a","b"]');
console.log('4. ✅ Palindrome ["r","a","c","e","c","a","r"]');
console.log('5. ✅ All same characters ["a","a","a","a"]');
console.log('6. ✅ Special characters and numbers');
console.log('7. ✅ Very long strings (performance test)');
console.log();

// ============================================
// INTERVIEW TIPS
// ============================================

console.log('=== Interview Tips ===\n');
console.log('✨ Key Points to Mention:');
console.log('  1. This is a classic two-pointer problem');
console.log('  2. In-place modification saves space');
console.log('  3. Only need to iterate halfway through array');
console.log('  4. Can use various swap techniques');
console.log();
console.log('🎯 What Interviewers Look For:');
console.log('  - Understanding of in-place algorithms');
console.log('  - Knowledge of two-pointer technique');
console.log('  - Ability to handle edge cases');
console.log('  - Clean, readable code');
console.log();
console.log('⚠️  Common Mistakes to Avoid:');
console.log('  - Iterating through entire array (should only go halfway)');
console.log('  - Creating a new array (not in-place)');
console.log('  - Not handling empty or single-element arrays');
console.log('  - Forgetting to increment/decrement pointers');
console.log();

// ============================================
// VARIATIONS OF THE PROBLEM
// ============================================

console.log('=== Problem Variations ===\n');

// Reverse only part of the array
function reverseStringRange(s, start, end) {
    while (start < end) {
        [s[start], s[end]] = [s[end], s[start]];
        start++;
        end--;
    }
}

const partialTest = ["h", "e", "l", "l", "o"];
reverseStringRange(partialTest, 1, 3);
console.log('Reverse substring (index 1-3):');
console.log('  Input:  ["h","e","l","l","o"]');
console.log(`  Output: [${partialTest.map(c => `"${c}"`).join(',')}]`);
console.log('  (Only "ell" reversed to "lle")');
console.log();

// Reverse words in a sentence
function reverseWords(s) {
    // Reverse entire array
    reverseString(s);
    
    // Reverse each word back
    let start = 0;
    for (let i = 0; i <= s.length; i++) {
        if (i === s.length || s[i] === ' ') {
            reverseStringRange(s, start, i - 1);
            start = i + 1;
        }
    }
}

const sentence = ["h","e","l","l","o"," ","w","o","r","l","d"];
const sentenceCopy = [...sentence];
reverseWords(sentenceCopy);
console.log('Reverse words in sentence:');
console.log(`  Input:  "${sentence.join('')}"`);
console.log(`  Output: "${sentenceCopy.join('')}"`);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        reverseString,
        reverseStringWithTemp,
        reverseStringRecursive,
        reverseStringBuiltIn,
        reverseStringForLoop,
        reverseStringRange
    };
}
