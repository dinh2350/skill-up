/**
 * Implement Trie (Prefix Tree) - LeetCode Problem
 * Difficulty: Medium
 * 
 * Problem: A trie (pronounced as "try") or prefix tree is a tree data structure 
 * used to efficiently store and retrieve keys in a dataset of strings. 
 * There are various applications of this data structure, such as autocomplete and spellchecker.
 * 
 * Implement the Trie class:
 * 
 * - Trie() Initializes the trie object.
 * - void insert(String word) Inserts the string word into the trie.
 * - boolean search(String word) Returns true if the string word is in the trie, and false otherwise.
 * - boolean startsWith(String prefix) Returns true if there is a previously inserted string word 
 *   that has the prefix prefix, and false otherwise.
 * 
 * Example:
 * Input
 * ["Trie", "insert", "search", "search", "startsWith", "insert", "search"]
 * [[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]]
 * 
 * Output
 * [null, null, true, false, true, null, true]
 * 
 * Explanation:
 * Trie trie = new Trie();
 * trie.insert("apple");
 * trie.search("apple");   // return true
 * trie.search("app");     // return false
 * trie.startsWith("app"); // return true
 * trie.insert("app");
 * trie.search("app");     // return true
 */

/**
 * APPROACH 1: Using Map (MOST COMMON)
 * 
 * Key Insights:
 * 1. Each node contains a Map of children (character → TrieNode)
 * 2. Each node has an isEndOfWord flag
 * 3. Insert: Create nodes along the path, mark last as end
 * 4. Search: Traverse path, check if last node is end
 * 5. StartsWith: Traverse path, check if path exists
 * 
 * Time Complexity:
 * - Insert: O(m) where m is word length
 * - Search: O(m)
 * - StartsWith: O(m)
 * 
 * Space Complexity: O(n * m) where n is number of words, m is average length
 */

class TrieNode {
    constructor() {
        this.children = new Map(); // character → TrieNode
        this.isEndOfWord = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }
    
    /**
     * Inserts a word into the trie
     * @param {string} word
     * @return {void}
     */
    insert(word) {
        let node = this.root;
        
        // Traverse/create path for each character
        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char);
        }
        
        // Mark the end of word
        node.isEndOfWord = true;
    }
    
    /**
     * Returns true if the word is in the trie
     * @param {string} word
     * @return {boolean}
     */
    search(word) {
        let node = this.root;
        
        // Traverse the path
        for (const char of word) {
            if (!node.children.has(char)) {
                return false; // Path doesn't exist
            }
            node = node.children.get(char);
        }
        
        // Check if this node marks end of a word
        return node.isEndOfWord;
    }
    
    /**
     * Returns true if there is any word that starts with the given prefix
     * @param {string} prefix
     * @return {boolean}
     */
    startsWith(prefix) {
        let node = this.root;
        
        // Traverse the path
        for (const char of prefix) {
            if (!node.children.has(char)) {
                return false; // Path doesn't exist
            }
            node = node.children.get(char);
        }
        
        // If we reached here, prefix exists
        return true;
    }
}

// ============================================================================
// APPROACH 2: Using Object (Alternative)
// ============================================================================

/**
 * Using plain JavaScript object instead of Map
 * Slightly cleaner syntax for some operations
 */
class TrieNodeObject {
    constructor() {
        this.children = {}; // character → TrieNode
        this.isEndOfWord = false;
    }
}

class TrieWithObject {
    constructor() {
        this.root = new TrieNodeObject();
    }
    
    insert(word) {
        let node = this.root;
        
        for (const char of word) {
            if (!(char in node.children)) {
                node.children[char] = new TrieNodeObject();
            }
            node = node.children[char];
        }
        
        node.isEndOfWord = true;
    }
    
    search(word) {
        let node = this.root;
        
        for (const char of word) {
            if (!(char in node.children)) {
                return false;
            }
            node = node.children[char];
        }
        
        return node.isEndOfWord;
    }
    
    startsWith(prefix) {
        let node = this.root;
        
        for (const char of prefix) {
            if (!(char in node.children)) {
                return false;
            }
            node = node.children[char];
        }
        
        return true;
    }
}

// ============================================================================
// APPROACH 3: With Additional Features (Extended Trie)
// ============================================================================

/**
 * Extended Trie with additional useful methods
 */
class TrieExtended {
    constructor() {
        this.root = new TrieNode();
    }
    
    insert(word) {
        let node = this.root;
        
        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char);
        }
        
        node.isEndOfWord = true;
    }
    
    search(word) {
        let node = this.root;
        
        for (const char of word) {
            if (!node.children.has(char)) {
                return false;
            }
            node = node.children.get(char);
        }
        
        return node.isEndOfWord;
    }
    
    startsWith(prefix) {
        let node = this.root;
        
        for (const char of prefix) {
            if (!node.children.has(char)) {
                return false;
            }
            node = node.children.get(char);
        }
        
        return true;
    }
    
    /**
     * Delete a word from the trie
     * @param {string} word
     * @return {boolean} true if word was deleted, false if not found
     */
    delete(word) {
        function deleteHelper(node, word, index) {
            if (index === word.length) {
                // Reached end of word
                if (!node.isEndOfWord) {
                    return false; // Word not found
                }
                
                node.isEndOfWord = false;
                
                // Delete node if it has no children
                return node.children.size === 0;
            }
            
            const char = word[index];
            if (!node.children.has(char)) {
                return false; // Word not found
            }
            
            const childNode = node.children.get(char);
            const shouldDeleteChild = deleteHelper(childNode, word, index + 1);
            
            if (shouldDeleteChild) {
                node.children.delete(char);
                // Delete current node if it has no children and is not end of another word
                return node.children.size === 0 && !node.isEndOfWord;
            }
            
            return false;
        }
        
        return deleteHelper(this.root, word, 0);
    }
    
    /**
     * Get all words with given prefix
     * @param {string} prefix
     * @return {string[]}
     */
    getWordsWithPrefix(prefix) {
        const result = [];
        let node = this.root;
        
        // Navigate to prefix node
        for (const char of prefix) {
            if (!node.children.has(char)) {
                return result; // Prefix not found
            }
            node = node.children.get(char);
        }
        
        // DFS to collect all words from this node
        function dfs(node, currentWord) {
            if (node.isEndOfWord) {
                result.push(currentWord);
            }
            
            for (const [char, childNode] of node.children) {
                dfs(childNode, currentWord + char);
            }
        }
        
        dfs(node, prefix);
        return result;
    }
    
    /**
     * Count words with given prefix
     * @param {string} prefix
     * @return {number}
     */
    countWordsWithPrefix(prefix) {
        let node = this.root;
        
        // Navigate to prefix node
        for (const char of prefix) {
            if (!node.children.has(char)) {
                return 0;
            }
            node = node.children.get(char);
        }
        
        // Count all words from this node
        function countWords(node) {
            let count = node.isEndOfWord ? 1 : 0;
            
            for (const childNode of node.children.values()) {
                count += countWords(childNode);
            }
            
            return count;
        }
        
        return countWords(node);
    }
    
    /**
     * Get all words in the trie
     * @return {string[]}
     */
    getAllWords() {
        return this.getWordsWithPrefix('');
    }
    
    /**
     * Check if trie is empty
     * @return {boolean}
     */
    isEmpty() {
        return this.root.children.size === 0;
    }
    
    /**
     * Get the longest common prefix of all words
     * @return {string}
     */
    getLongestCommonPrefix() {
        let prefix = '';
        let node = this.root;
        
        while (node.children.size === 1 && !node.isEndOfWord) {
            const [char, childNode] = node.children.entries().next().value;
            prefix += char;
            node = childNode;
        }
        
        return prefix;
    }
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log('=== Basic Trie Test Cases ===\n');

const trie = new Trie();

console.log('Test 1: Insert and Search');
trie.insert('apple');
console.log('Insert "apple"');
console.log('search("apple"):', trie.search('apple')); // true
console.log('search("app"):', trie.search('app')); // false
console.log('Expected: true, false');
console.log();

console.log('Test 2: StartsWith');
console.log('startsWith("app"):', trie.startsWith('app')); // true
console.log('startsWith("appl"):', trie.startsWith('appl')); // true
console.log('startsWith("apl"):', trie.startsWith('apl')); // false
console.log('Expected: true, true, false');
console.log();

console.log('Test 3: Insert Prefix as Word');
trie.insert('app');
console.log('Insert "app"');
console.log('search("app"):', trie.search('app')); // true
console.log('search("apple"):', trie.search('apple')); // true
console.log('Expected: true, true');
console.log();

console.log('Test 4: Multiple Words');
const trie2 = new Trie();
const words = ['apple', 'app', 'apricot', 'banana'];
words.forEach(word => trie2.insert(word));
console.log('Inserted:', words.join(', '));
console.log('search("apple"):', trie2.search('apple')); // true
console.log('search("app"):', trie2.search('app')); // true
console.log('search("apricot"):', trie2.search('apricot')); // true
console.log('search("banana"):', trie2.search('banana')); // true
console.log('search("ban"):', trie2.search('ban')); // false
console.log('startsWith("ap"):', trie2.startsWith('ap')); // true
console.log('startsWith("ban"):', trie2.startsWith('ban')); // true
console.log();

console.log('Test 5: Empty String');
const trie3 = new Trie();
trie3.insert('');
console.log('Insert ""');
console.log('search(""):', trie3.search('')); // true
console.log('startsWith(""):', trie3.startsWith('')); // true
console.log();

console.log('Test 6: Single Character');
const trie4 = new Trie();
trie4.insert('a');
console.log('Insert "a"');
console.log('search("a"):', trie4.search('a')); // true
console.log('search("ab"):', trie4.search('ab')); // false
console.log('startsWith("a"):', trie4.startsWith('a')); // true
console.log();

// ============================================================================
// EXTENDED TRIE TESTS
// ============================================================================

console.log('=== Extended Trie Features ===\n');

const extTrie = new TrieExtended();
const testWords = ['apple', 'app', 'apricot', 'application', 'banana', 'band', 'bandana'];
testWords.forEach(word => extTrie.insert(word));

console.log('Inserted words:', testWords.join(', '));
console.log();

console.log('Test 1: Get all words with prefix "app"');
console.log(extTrie.getWordsWithPrefix('app'));
console.log('Expected: ["app", "apple", "apricot", "application"]');
console.log();

console.log('Test 2: Count words with prefix "ban"');
console.log('Count:', extTrie.countWordsWithPrefix('ban'));
console.log('Expected: 3 (banana, band, bandana)');
console.log();

console.log('Test 3: Get all words');
console.log(extTrie.getAllWords());
console.log();

console.log('Test 4: Delete word "app"');
console.log('Before delete - search("app"):', extTrie.search('app'));
extTrie.delete('app');
console.log('After delete - search("app"):', extTrie.search('app'));
console.log('search("apple") still exists:', extTrie.search('apple'));
console.log();

console.log('Test 5: Longest common prefix');
const prefixTrie = new TrieExtended();
['flower', 'flow', 'flight'].forEach(word => prefixTrie.insert(word));
console.log('Words: flower, flow, flight');
console.log('Longest common prefix:', prefixTrie.getLongestCommonPrefix());
console.log('Expected: "fl"');
console.log();

// ============================================================================
// DETAILED EXPLANATION & WALKTHROUGH
// ============================================================================

/**
 * STEP-BY-STEP WALKTHROUGH: Inserting "apple"
 * 
 * Initial state: root → empty
 * 
 * Insert 'a':
 *   root → a (create new node)
 * 
 * Insert 'p':
 *   root → a → p (create new node)
 * 
 * Insert 'p':
 *   root → a → p → p (create new node)
 * 
 * Insert 'l':
 *   root → a → p → p → l (create new node)
 * 
 * Insert 'e':
 *   root → a → p → p → l → e (create new node)
 *   Mark e.isEndOfWord = true
 * 
 * Final structure:
 *       root
 *        |
 *        a
 *        |
 *        p
 *        |
 *        p
 *        |
 *        l
 *        |
 *        e* (* = end of word)
 */

/**
 * VISUAL REPRESENTATION: Multiple Words
 * 
 * After inserting: "app", "apple", "apricot", "banana"
 * 
 *           root
 *          /    \
 *         a      b
 *         |      |
 *         p      a
 *        / \     |
 *       p   r    n
 *      /    |    |
 *     *l    i    a
 *      |    |    |
 *      e*   c    n
 *           |    |
 *           o    a*
 *           |
 *           t*
 * 
 * Paths:
 * - a → p → p* (word: "app")
 * - a → p → p → l → e* (word: "apple")
 * - a → p → r → i → c → o → t* (word: "apricot")
 * - b → a → n → a → n → a* (word: "banana")
 * 
 * * indicates isEndOfWord = true
 */

/**
 * SEARCH VS STARTSWITH:
 * 
 * Example: After inserting "apple"
 * 
 * search("apple"):
 *   1. Traverse: a → p → p → l → e
 *   2. Check: node.isEndOfWord? YES ✓
 *   3. Return: true
 * 
 * search("app"):
 *   1. Traverse: a → p → p
 *   2. Check: node.isEndOfWord? NO ❌
 *   3. Return: false
 * 
 * startsWith("app"):
 *   1. Traverse: a → p → p
 *   2. Check: Path exists? YES ✓
 *   3. Return: true (don't check isEndOfWord)
 * 
 * Key difference:
 * - search() checks if exact word exists (isEndOfWord must be true)
 * - startsWith() checks if path exists (any word with this prefix)
 */

/**
 * WHY USE TRIE? ADVANTAGES:
 * 
 * 1. EFFICIENT PREFIX QUERIES:
 *    - Find all words with prefix: O(m + n) where m=prefix length, n=results
 *    - Hash table would require checking all keys: O(k * m) where k=total keys
 * 
 * 2. AUTOCOMPLETE:
 *    - Type "app" → instantly find "app", "apple", "application"
 *    - Real-world use: search engines, IDEs, mobile keyboards
 * 
 * 3. SPELL CHECKER:
 *    - Check if word exists: O(m)
 *    - Suggest corrections by traversing nearby paths
 * 
 * 4. IP ROUTING:
 *    - Match longest prefix for IP addresses
 *    - Used in network routers
 * 
 * 5. SPACE EFFICIENCY (with many shared prefixes):
 *    - Words "app", "apple", "application" share "app" path
 *    - Saves space compared to storing separately
 * 
 * Comparison with Hash Table:
 * 
 * Operation       | Trie    | Hash Table
 * ----------------|---------|------------
 * Insert          | O(m)    | O(m)
 * Search          | O(m)    | O(m)
 * Prefix search   | O(m+n)  | O(k*m)
 * Space           | O(n*m)  | O(n*m)
 * 
 * m = word length, n = results, k = total words
 * 
 * Trie wins for prefix operations!
 */

/**
 * UNDERSTANDING TIME COMPLEXITY:
 * 
 * Insert: O(m) where m is word length
 * - Visit/create m nodes (one per character)
 * - Each node operation is O(1) with Map/Object
 * 
 * Search: O(m)
 * - Visit m nodes
 * - Each lookup is O(1)
 * 
 * StartsWith: O(m)
 * - Visit m nodes for prefix
 * - Each lookup is O(1)
 * 
 * Space: O(ALPHABET_SIZE * N * M)
 * - Worst case: every node has all 26 letters
 * - In practice: much less due to shared prefixes
 * - Best case: O(N * M) for completely shared prefixes
 */

/**
 * MAP VS OBJECT FOR CHILDREN:
 * 
 * Using Map:
 * Pros:
 * ✓ Better for non-string keys
 * ✓ Maintains insertion order
 * ✓ has() method more explicit
 * ✓ Can iterate with for...of
 * 
 * Using Object:
 * Pros:
 * ✓ Slightly cleaner syntax
 * ✓ Familiar to most developers
 * ✓ JSON.stringify works directly
 * ✓ Slightly better performance in V8
 * 
 * Both are O(1) for lookup/insert, either is fine!
 */

/**
 * KEY INSIGHTS:
 * 
 * 1. TREE STRUCTURE:
 *    - Each node represents a character
 *    - Path from root to node forms a prefix
 *    - isEndOfWord marks complete words
 * 
 * 2. SHARED PREFIXES:
 *    - "app" and "apple" share path for "app"
 *    - Space and time efficient for common prefixes
 * 
 * 3. PREFIX MATCHING:
 *    - Any path in trie represents valid prefix
 *    - Don't need to check isEndOfWord for startsWith
 * 
 * 4. NODE DESIGN:
 *    - children: Map/Object to child nodes
 *    - isEndOfWord: boolean flag
 *    - Can add more fields: count, lastInsertTime, etc.
 * 
 * 5. DELETION IS TRICKY:
 *    - Need to check if node is part of other words
 *    - Only delete if no other words use this path
 *    - Recursive approach works well
 */

/**
 * COMMON MISTAKES TO AVOID:
 * 
 * 1. ❌ Not marking isEndOfWord
 *    - Forgot to set flag after inserting
 *    - All searches will return false
 * 
 * 2. ❌ Checking isEndOfWord in startsWith
 *    - startsWith only needs path to exist
 *    - Don't check isEndOfWord
 * 
 * 3. ❌ Not creating new nodes
 *    - Check if child exists before accessing
 *    - Create new node if doesn't exist
 * 
 * 4. ❌ Returning wrong value for empty string
 *    - Empty string is valid prefix of all words
 *    - Should return true for startsWith("")
 * 
 * 5. ❌ Mutating node during iteration
 *    - Be careful when deleting during traversal
 *    - Use helper methods properly
 * 
 * 6. ❌ Not handling edge cases
 *    - Empty string, single character
 *    - Words that are prefixes of other words
 */

/**
 * INTERVIEW TIPS:
 * 
 * 1. Explain structure:
 *    "Each node has children map and isEndOfWord flag"
 *    "Path from root to node represents a prefix"
 * 
 * 2. Discuss use cases:
 *    "Autocomplete, spell checker, IP routing"
 *    "Efficient for prefix operations"
 * 
 * 3. Analyze complexity:
 *    "Insert/Search/StartsWith all O(m) where m is word length"
 *    "Space is O(n*m) but shared prefixes save space"
 * 
 * 4. Compare alternatives:
 *    "Hash table is O(m) for exact match"
 *    "But Trie is better for prefix queries"
 * 
 * 5. Mention extensions:
 *    "Can add count, delete, getAllWords"
 *    "Can optimize space with compressed tries"
 * 
 * 6. Walk through example:
 *    Draw tree structure as you insert words
 *    Show how paths are shared
 */

/**
 * RELATED PROBLEMS:
 * - Design Add and Search Words Data Structure
 * - Word Search II
 * - Replace Words
 * - Longest Word in Dictionary
 * - Implement Magic Dictionary
 * - Maximum XOR of Two Numbers (Trie on bits)
 */

/**
 * VARIATIONS:
 * 
 * 1. Compressed Trie (Radix Tree):
 *    - Compress single-child chains
 *    - Saves space for long unique suffixes
 * 
 * 2. Ternary Search Tree:
 *    - Each node has 3 children: left, middle, right
 *    - Space efficient alternative
 * 
 * 3. Suffix Tree:
 *    - Stores all suffixes of strings
 *    - Used in pattern matching
 * 
 * 4. Binary Trie:
 *    - Store binary representations
 *    - Used for XOR problems
 */

// Export for testing
module.exports = { 
    Trie,
    TrieWithObject,
    TrieExtended,
    TrieNode
};
