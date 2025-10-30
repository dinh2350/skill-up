# LeetCode Interview Questions - Junior to Senior JavaScript Developer

## Table of Contents

1. [Junior Level (Easy)](#junior-level-easy)
2. [Mid-Level (Easy-Medium)](#mid-level-easy-medium)
3. [Senior Level (Medium-Hard)](#senior-level-medium-hard)
4. [Bonus: System Design & Optimization](#bonus-system-design--optimization)

---

## Junior Level (Easy)

### 1. Two Sum

**Difficulty:** Easy  
**Topics:** Array, Hash Table

**Problem:**
Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

```javascript
// Input: nums = [2,7,11,15], target = 9
// Output: [0,1]
// Explanation: nums[0] + nums[1] == 9, so return [0, 1]
```

**Expected Solution:**

- Brute Force: O(n²)
- Optimized: O(n) using hash map

---

### 2. Reverse String

**Difficulty:** Easy  
**Topics:** String, Two Pointers

**Problem:**
Write a function that reverses a string. The input string is given as an array of characters.

```javascript
// Input: s = ["h","e","l","l","o"]
// Output: ["o","l","l","e","h"]
```

---

### 3. Valid Palindrome

**Difficulty:** Easy  
**Topics:** String, Two Pointers

**Problem:**
Given a string `s`, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.

```javascript
// Input: s = "A man, a plan, a canal: Panama"
// Output: true
```

---

### 4. Maximum Subarray (Kadane's Algorithm)

**Difficulty:** Easy  
**Topics:** Array, Dynamic Programming

**Problem:**
Given an integer array `nums`, find the contiguous subarray with the largest sum and return its sum.

```javascript
// Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
// Output: 6
// Explanation: [4,-1,2,1] has the largest sum = 6
```

---

### 5. Merge Two Sorted Lists

**Difficulty:** Easy  
**Topics:** Linked List, Recursion

**Problem:**
Merge two sorted linked lists and return it as a sorted list.

```javascript
// Input: list1 = [1,2,4], list2 = [1,3,4]
// Output: [1,1,2,3,4,4]
```

---

### 6. Valid Parentheses

**Difficulty:** Easy  
**Topics:** Stack, String

**Problem:**
Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

```javascript
// Input: s = "()[]{}"
// Output: true

// Input: s = "(]"
// Output: false
```

---

### 7. Best Time to Buy and Sell Stock

**Difficulty:** Easy  
**Topics:** Array, Dynamic Programming

**Problem:**
You are given an array `prices` where `prices[i]` is the price of a given stock on the ith day. Return the maximum profit you can achieve.

```javascript
// Input: prices = [7,1,5,3,6,4]
// Output: 5
// Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5
```

---

### 8. Climbing Stairs

**Difficulty:** Easy  
**Topics:** Dynamic Programming, Math

**Problem:**
You are climbing a staircase. It takes `n` steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?

```javascript
// Input: n = 3
// Output: 3
// Explanation: Three ways: 1+1+1, 1+2, 2+1
```

---

### 9. Contains Duplicate

**Difficulty:** Easy  
**Topics:** Array, Hash Table

**Problem:**
Given an integer array `nums`, return `true` if any value appears at least twice in the array.

```javascript
// Input: nums = [1,2,3,1]
// Output: true
```

---

### 10. Missing Number

**Difficulty:** Easy  
**Topics:** Array, Math, Bit Manipulation

**Problem:**
Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing from the array.

```javascript
// Input: nums = [3,0,1]
// Output: 2
```

---

## Mid-Level (Easy-Medium)

### 11. Three Sum

**Difficulty:** Medium  
**Topics:** Array, Two Pointers, Sorting

**Problem:**
Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.

```javascript
// Input: nums = [-1,0,1,2,-1,-4]
// Output: [[-1,-1,2],[-1,0,1]]
```

**Key Skills:**

- Avoiding duplicates
- Two-pointer technique
- Time complexity optimization

---

### 12. Longest Substring Without Repeating Characters

**Difficulty:** Medium  
**Topics:** String, Sliding Window, Hash Table

**Problem:**
Given a string `s`, find the length of the longest substring without repeating characters.

```javascript
// Input: s = "abcabcbb"
// Output: 3
// Explanation: "abc" is the longest substring
```

---

### 13. Group Anagrams

**Difficulty:** Medium  
**Topics:** Array, Hash Table, String, Sorting

**Problem:**
Given an array of strings `strs`, group the anagrams together.

```javascript
// Input: strs = ["eat","tea","tan","ate","nat","bat"]
// Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
```

---

### 14. Product of Array Except Self

**Difficulty:** Medium  
**Topics:** Array, Prefix Sum

**Problem:**
Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all elements of `nums` except `nums[i]`.

```javascript
// Input: nums = [1,2,3,4]
// Output: [24,12,8,6]
```

**Constraint:** Solve it without using division and in O(n) time.

---

### 15. Valid Sudoku

**Difficulty:** Medium  
**Topics:** Array, Hash Table, Matrix

**Problem:**
Determine if a 9x9 Sudoku board is valid.

**Key Skills:**

- Hash set usage
- Matrix traversal
- Validation logic

---

### 16. Rotate Image

**Difficulty:** Medium  
**Topics:** Array, Matrix

**Problem:**
You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise). You have to rotate the image in-place.

```javascript
// Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
// Output: [[7,4,1],[8,5,2],[9,6,3]]
```

---

### 17. Spiral Matrix

**Difficulty:** Medium  
**Topics:** Array, Matrix, Simulation

**Problem:**
Given an `m x n` matrix, return all elements of the matrix in spiral order.

```javascript
// Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
// Output: [1,2,3,6,9,8,7,4,5]
```

---

### 18. Binary Tree Level Order Traversal

**Difficulty:** Medium  
**Topics:** Tree, BFS, Binary Tree

**Problem:**
Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).

```javascript
// Input: root = [3,9,20,null,null,15,7]
// Output: [[3],[9,20],[15,7]]
```

---

### 19. Validate Binary Search Tree

**Difficulty:** Medium  
**Topics:** Tree, DFS, BST

**Problem:**
Given the root of a binary tree, determine if it is a valid binary search tree (BST).

**Key Skills:**

- Understanding BST properties
- Recursive validation
- Range checking

---

### 20. Implement Trie (Prefix Tree)

**Difficulty:** Medium  
**Topics:** String, Design, Trie

**Problem:**
Implement a trie with `insert`, `search`, and `startsWith` methods.

```javascript
// Trie trie = new Trie();
// trie.insert("apple");
// trie.search("apple");   // return True
// trie.search("app");     // return False
// trie.startsWith("app"); // return True
```

---

### 21. Course Schedule (Cycle Detection)

**Difficulty:** Medium  
**Topics:** Graph, DFS, BFS, Topological Sort

**Problem:**
There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. Given the total number of courses and prerequisites, return if you can finish all courses.

```javascript
// Input: numCourses = 2, prerequisites = [[1,0]]
// Output: true
// Explanation: Take course 0, then course 1
```

---

### 22. Number of Islands

**Difficulty:** Medium  
**Topics:** Array, DFS, BFS, Matrix

**Problem:**
Given an `m x n` 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.

```javascript
// Input: grid = [
//   ["1","1","0","0","0"],
//   ["1","1","0","0","0"],
//   ["0","0","1","0","0"],
//   ["0","0","0","1","1"]
// ]
// Output: 3
```

---

### 23. Clone Graph

**Difficulty:** Medium  
**Topics:** Graph, DFS, BFS, Hash Table

**Problem:**
Given a reference of a node in a connected undirected graph, return a deep copy of the graph.

---

### 24. Word Search

**Difficulty:** Medium  
**Topics:** Array, Backtracking, Matrix

**Problem:**
Given an `m x n` grid of characters and a string `word`, return `true` if `word` exists in the grid.

```javascript
// Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
// Output: true
```

---

### 25. Permutations

**Difficulty:** Medium  
**Topics:** Array, Backtracking

**Problem:**
Given an array `nums` of distinct integers, return all possible permutations.

```javascript
// Input: nums = [1,2,3]
// Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
```

---

## Senior Level (Medium-Hard)

### 26. Median of Two Sorted Arrays

**Difficulty:** Hard  
**Topics:** Array, Binary Search, Divide and Conquer

**Problem:**
Given two sorted arrays `nums1` and `nums2`, return the median of the two sorted arrays.

```javascript
// Input: nums1 = [1,3], nums2 = [2]
// Output: 2.00000
// Explanation: merged array = [1,2,3] and median is 2
```

**Constraint:** The overall run time complexity should be O(log (m+n)).

---

### 27. Trapping Rain Water

**Difficulty:** Hard  
**Topics:** Array, Two Pointers, Dynamic Programming, Stack

**Problem:**
Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

```javascript
// Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
// Output: 6
```

---

### 28. Longest Palindromic Substring

**Difficulty:** Medium  
**Topics:** String, Dynamic Programming

**Problem:**
Given a string `s`, return the longest palindromic substring in `s`.

```javascript
// Input: s = "babad"
// Output: "bab" or "aba"
```

---

### 29. Regular Expression Matching

**Difficulty:** Hard  
**Topics:** String, Dynamic Programming, Recursion

**Problem:**
Implement regular expression matching with support for '.' and '\*'.

```javascript
// Input: s = "aa", p = "a*"
// Output: true
// Explanation: '*' means zero or more of the preceding element 'a'
```

---

### 30. Merge k Sorted Lists

**Difficulty:** Hard  
**Topics:** Linked List, Heap, Divide and Conquer

**Problem:**
Merge k sorted linked lists and return it as one sorted list.

```javascript
// Input: lists = [[1,4,5],[1,3,4],[2,6]]
// Output: [1,1,2,3,4,4,5,6]
```

**Key Skills:**

- Min heap/priority queue
- Time complexity: O(N log k)

---

### 31. Serialize and Deserialize Binary Tree

**Difficulty:** Hard  
**Topics:** Tree, DFS, BFS, Design

**Problem:**
Design an algorithm to serialize and deserialize a binary tree.

```javascript
// Input: root = [1,2,3,null,null,4,5]
// serialized = "1,2,3,null,null,4,5"
// deserialize should return the original tree
```

---

### 32. Word Ladder

**Difficulty:** Hard  
**Topics:** Hash Table, String, BFS

**Problem:**
Given two words, `beginWord` and `endWord`, and a dictionary, find the length of shortest transformation sequence from `beginWord` to `endWord`.

```javascript
// Input: beginWord = "hit", endWord = "cog",
//        wordList = ["hot","dot","dog","lot","log","cog"]
// Output: 5
// Explanation: "hit" -> "hot" -> "dot" -> "dog" -> "cog"
```

---

### 33. LRU Cache

**Difficulty:** Medium  
**Topics:** Hash Table, Linked List, Design

**Problem:**
Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

```javascript
// Implement LRUCache class:
// - LRUCache(int capacity)
// - int get(int key)
// - void put(int key, int value)
```

**Key Skills:**

- Doubly linked list + hash map
- O(1) time complexity for both operations

---

### 34. Design Twitter

**Difficulty:** Medium  
**Topics:** Hash Table, Linked List, Design, Heap

**Problem:**
Design a simplified version of Twitter with:

- `postTweet(userId, tweetId)`
- `getNewsFeed(userId)` - Retrieve 10 most recent tweets
- `follow(followerId, followeeId)`
- `unfollow(followerId, followeeId)`

---

### 35. Find Median from Data Stream

**Difficulty:** Hard  
**Topics:** Two Pointers, Design, Sorting, Heap

**Problem:**
Design a data structure that supports:

- `addNum(int num)` - Add an integer to the data structure
- `findMedian()` - Return the median of all elements

**Key Skills:**

- Two heaps (max heap and min heap)
- O(log n) insertion, O(1) median retrieval

---

### 36. Sliding Window Maximum

**Difficulty:** Hard  
**Topics:** Array, Queue, Sliding Window, Heap, Monotonic Queue

**Problem:**
Given an array of integers and a sliding window of size `k`, find the maximum for each window position.

```javascript
// Input: nums = [1,3,-1,-3,5,3,6,7], k = 3
// Output: [3,3,5,5,6,7]
```

---

### 37. Word Break II

**Difficulty:** Hard  
**Topics:** String, Dynamic Programming, Backtracking, Trie

**Problem:**
Given a string `s` and a dictionary, add spaces to construct sentences where each word is in the dictionary. Return all possible sentences.

```javascript
// Input: s = "catsanddog", wordDict = ["cat","cats","and","sand","dog"]
// Output: ["cats and dog","cat sand dog"]
```

---

### 38. Longest Increasing Path in a Matrix

**Difficulty:** Hard  
**Topics:** Array, DFS, DP, Memoization, Matrix

**Problem:**
Given an `m x n` integers matrix, return the length of the longest increasing path in the matrix.

```javascript
// Input: matrix = [[9,9,4],[6,6,8],[2,1,1]]
// Output: 4
// Explanation: [1, 2, 6, 9]
```

---

### 39. Alien Dictionary

**Difficulty:** Hard  
**Topics:** Array, String, DFS, BFS, Graph, Topological Sort

**Problem:**
Given a sorted dictionary of an alien language, derive the order of letters in this language.

```javascript
// Input: words = ["wrt","wrf","er","ett","rftt"]
// Output: "wertf"
```

---

### 40. Design Search Autocomplete System

**Difficulty:** Hard  
**Topics:** Design, Trie, String, Heap

**Problem:**
Design a search autocomplete system that returns the top 3 historical hot sentences that have prefix the same as the part of sentence already typed.

---

## Bonus: System Design & Optimization

### 41. Debounce Function

**Difficulty:** Medium  
**Topics:** JavaScript, Closure, Timing

**Problem:**
Implement a debounce function that delays invoking `func` until after `wait` milliseconds have elapsed since the last time the debounced function was invoked.

```javascript
function debounce(func, wait) {
  // Your implementation
}
```

---

### 42. Throttle Function

**Difficulty:** Medium  
**Topics:** JavaScript, Closure, Timing

**Problem:**
Implement a throttle function that ensures a function is called at most once in a specified time period.

---

### 43. Deep Clone

**Difficulty:** Medium  
**Topics:** JavaScript, Recursion, Object

**Problem:**
Implement a deep clone function that handles:

- Primitive types
- Objects
- Arrays
- Circular references
- Functions
- Dates, RegExp, Map, Set

---

### 44. Promise.all Implementation

**Difficulty:** Medium  
**Topics:** JavaScript, Promise, Async

**Problem:**
Implement `Promise.all` from scratch.

```javascript
function promiseAll(promises) {
  // Your implementation
}
```

---

### 45. Event Emitter

**Difficulty:** Medium  
**Topics:** JavaScript, Design Pattern, Events

**Problem:**
Implement an EventEmitter class with:

- `on(event, callback)` - Subscribe to event
- `emit(event, ...args)` - Emit event
- `off(event, callback)` - Unsubscribe
- `once(event, callback)` - Subscribe once

---

### 46. Flatten Object

**Difficulty:** Medium  
**Topics:** JavaScript, Recursion, Object

**Problem:**
Flatten a nested object into a single level with dot notation.

```javascript
// Input: { a: { b: { c: 1 } }, d: 2 }
// Output: { 'a.b.c': 1, 'd': 2 }
```

---

### 47. Curry Function

**Difficulty:** Medium  
**Topics:** JavaScript, Functional Programming, Closure

**Problem:**
Implement a curry function that transforms `f(a, b, c)` into `f(a)(b)(c)`.

```javascript
function curry(fn) {
  // Your implementation
}

// Usage:
const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);
curriedAdd(1)(2)(3); // 6
```

---

### 48. Memoization Function

**Difficulty:** Medium  
**Topics:** JavaScript, Optimization, Closure

**Problem:**
Implement a memoize function that caches function results.

```javascript
function memoize(fn) {
  // Your implementation
}
```

---

### 49. Array.prototype.flat Implementation

**Difficulty:** Medium  
**Topics:** JavaScript, Array, Recursion

**Problem:**
Implement the flat method that flattens an array up to a specified depth.

```javascript
function flatten(arr, depth = 1) {
  // Your implementation
}
```

---

### 50. Virtual DOM Diff Algorithm (Simplified)

**Difficulty:** Hard  
**Topics:** JavaScript, Algorithm, Trees

**Problem:**
Implement a simplified version of Virtual DOM diffing algorithm that:

- Compares two tree structures
- Identifies changes (add, remove, update)
- Returns minimal set of operations

---

## Additional Important Patterns

### 51. Merge Intervals
**Difficulty:** Medium  
**Topics:** Array, Sorting

**Problem:**
Given an array of intervals, merge all overlapping intervals.

```javascript
// Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
// Output: [[1,6],[8,10],[15,18]]
// Explanation: [1,3] and [2,6] overlap, merge into [1,6]
```

**Key Skills:**
- Sorting by start time
- Interval merging logic
- Edge case handling

---

### 52. Insert Interval
**Difficulty:** Medium  
**Topics:** Array

**Problem:**
Given a set of non-overlapping intervals and a new interval, insert the new interval and merge if necessary.

```javascript
// Input: intervals = [[1,3],[6,9]], newInterval = [2,5]
// Output: [[1,5],[6,9]]
```

---

### 53. Meeting Rooms II
**Difficulty:** Medium  
**Topics:** Array, Sorting, Heap, Greedy

**Problem:**
Given an array of meeting time intervals, return the minimum number of conference rooms required.

```javascript
// Input: intervals = [[0,30],[5,10],[15,20]]
// Output: 2
// Explanation: One room for [0,30], another for [5,10] and [15,20]
```

**Key Skills:**
- Min heap for tracking end times
- Greedy algorithm

---

### 54. Non-overlapping Intervals
**Difficulty:** Medium  
**Topics:** Array, Greedy, Sorting

**Problem:**
Given an array of intervals, return the minimum number of intervals you need to remove to make the rest non-overlapping.

```javascript
// Input: intervals = [[1,2],[2,3],[3,4],[1,3]]
// Output: 1
// Explanation: Remove [1,3] to make rest non-overlapping
```

---

### 55. Coin Change
**Difficulty:** Medium  
**Topics:** Array, Dynamic Programming, BFS

**Problem:**
Given coins of different denominations and a total amount, return the fewest number of coins needed to make up that amount.

```javascript
// Input: coins = [1,2,5], amount = 11
// Output: 3
// Explanation: 11 = 5 + 5 + 1
```

**Key Skills:**
- Bottom-up DP
- Unbounded knapsack pattern

---

### 56. Coin Change II
**Difficulty:** Medium  
**Topics:** Array, Dynamic Programming

**Problem:**
Given coins of different denominations and a total amount, return the number of combinations that make up that amount.

```javascript
// Input: amount = 5, coins = [1,2,5]
// Output: 4
// Explanation: 5=5, 5=2+2+1, 5=2+1+1+1, 5=1+1+1+1+1
```

---

### 57. House Robber
**Difficulty:** Medium  
**Topics:** Array, Dynamic Programming

**Problem:**
You are a robber planning to rob houses along a street. Each house has a certain amount of money. Adjacent houses have security systems connected. Return the maximum amount you can rob.

```javascript
// Input: nums = [2,7,9,3,1]
// Output: 12
// Explanation: Rob house 1 (money = 2), house 3 (money = 9), house 5 (money = 1)
```

---

### 58. House Robber II
**Difficulty:** Medium  
**Topics:** Array, Dynamic Programming

**Problem:**
Same as House Robber but houses are arranged in a circle (first and last house are adjacent).

```javascript
// Input: nums = [2,3,2]
// Output: 3
// Explanation: Cannot rob house 1 and 3, so rob house 2
```

---

### 59. Longest Common Subsequence
**Difficulty:** Medium  
**Topics:** String, Dynamic Programming

**Problem:**
Given two strings `text1` and `text2`, return the length of their longest common subsequence.

```javascript
// Input: text1 = "abcde", text2 = "ace"
// Output: 3
// Explanation: "ace" is the longest common subsequence
```

**Key Skills:**
- 2D DP table
- Classic DP pattern

---

### 60. Edit Distance (Levenshtein Distance)
**Difficulty:** Hard  
**Topics:** String, Dynamic Programming

**Problem:**
Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`.

```javascript
// Input: word1 = "horse", word2 = "ros"
// Output: 3
// Explanation: horse -> rorse -> rose -> ros
```

**Operations:** Insert, delete, replace

---

### 61. Unique Paths
**Difficulty:** Medium  
**Topics:** Math, Dynamic Programming, Combinatorics

**Problem:**
A robot is on an `m x n` grid and can only move right or down. How many unique paths are there to reach bottom-right?

```javascript
// Input: m = 3, n = 7
// Output: 28
```

---

### 62. Jump Game
**Difficulty:** Medium  
**Topics:** Array, Greedy, Dynamic Programming

**Problem:**
Given an array of non-negative integers representing maximum jump length at each position, determine if you can reach the last index.

```javascript
// Input: nums = [2,3,1,1,4]
// Output: true
// Explanation: Jump 1 step from index 0 to 1, then 3 steps to the last index
```

---

### 63. Jump Game II
**Difficulty:** Medium  
**Topics:** Array, Greedy, Dynamic Programming

**Problem:**
Return the minimum number of jumps to reach the last index. You can assume you can always reach the last index.

```javascript
// Input: nums = [2,3,1,1,4]
// Output: 2
// Explanation: Jump 1 step from 0 to 1, then 3 steps to last index
```

---

### 64. Decode Ways
**Difficulty:** Medium  
**Topics:** String, Dynamic Programming

**Problem:**
A message containing letters from A-Z can be encoded into numbers using 'A' -> "1" to 'Z' -> "26". Given a string of digits, return the number of ways to decode it.

```javascript
// Input: s = "226"
// Output: 3
// Explanation: "BZ" (2 26), "VF" (22 6), or "BBF" (2 2 6)
```

---

### 65. Partition Equal Subset Sum
**Difficulty:** Medium  
**Topics:** Array, Dynamic Programming

**Problem:**
Given an integer array `nums`, return `true` if you can partition the array into two subsets with equal sum.

```javascript
// Input: nums = [1,5,11,5]
// Output: true
// Explanation: [1, 5, 5] and [11]
```

**Key Skills:**
- 0/1 Knapsack pattern
- Subset sum problem

---

### 66. Palindromic Substrings
**Difficulty:** Medium  
**Topics:** String, Dynamic Programming

**Problem:**
Given a string `s`, return the number of palindromic substrings in it.

```javascript
// Input: s = "aaa"
// Output: 6
// Explanation: "a", "a", "a", "aa", "aa", "aaa"
```

---

### 67. Minimum Window Substring
**Difficulty:** Hard  
**Topics:** String, Sliding Window, Hash Table

**Problem:**
Given strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` is included in the window.

```javascript
// Input: s = "ADOBECODEBANC", t = "ABC"
// Output: "BANC"
```

**Key Skills:**
- Advanced sliding window
- Character frequency tracking

---

### 68. Longest Repeating Character Replacement
**Difficulty:** Medium  
**Topics:** String, Sliding Window

**Problem:**
Given a string `s` and integer `k`, you can replace any character with any other uppercase English character at most `k` times. Return the length of the longest substring containing the same letter you can get.

```javascript
// Input: s = "AABABBA", k = 1
// Output: 4
// Explanation: Replace one 'A' with 'B' -> "AABBBBA"
```

---

### 69. Find First and Last Position of Element in Sorted Array
**Difficulty:** Medium  
**Topics:** Array, Binary Search

**Problem:**
Given an array of integers `nums` sorted in ascending order, find the starting and ending position of a given target value.

```javascript
// Input: nums = [5,7,7,8,8,10], target = 8
// Output: [3,4]
```

**Key Skills:**
- Modified binary search
- Finding boundaries

---

### 70. Search in Rotated Sorted Array
**Difficulty:** Medium  
**Topics:** Array, Binary Search

**Problem:**
Given the array `nums` after rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not.

```javascript
// Input: nums = [4,5,6,7,0,1,2], target = 0
// Output: 4
```

---

### 71. Find Minimum in Rotated Sorted Array
**Difficulty:** Medium  
**Topics:** Array, Binary Search

**Problem:**
Given the rotated sorted array `nums`, return the minimum element.

```javascript
// Input: nums = [3,4,5,1,2]
// Output: 1
```

---

### 72. Kth Largest Element in an Array
**Difficulty:** Medium  
**Topics:** Array, Divide and Conquer, Sorting, Heap, Quickselect

**Problem:**
Given an integer array `nums` and an integer `k`, return the kth largest element in the array.

```javascript
// Input: nums = [3,2,1,5,6,4], k = 2
// Output: 5
```

**Key Skills:**
- Min heap approach: O(n log k)
- Quickselect: O(n) average

---

### 73. Top K Frequent Elements
**Difficulty:** Medium  
**Topics:** Array, Hash Table, Divide and Conquer, Sorting, Heap, Bucket Sort

**Problem:**
Given an integer array `nums` and an integer `k`, return the `k` most frequent elements.

```javascript
// Input: nums = [1,1,1,2,2,3], k = 2
// Output: [1,2]
```

**Key Skills:**
- Bucket sort for O(n) solution
- Heap for O(n log k) solution

---

### 74. Kth Smallest Element in a BST
**Difficulty:** Medium  
**Topics:** Tree, DFS, BST, Binary Search

**Problem:**
Given the root of a binary search tree and an integer `k`, return the kth smallest value in the tree.

```javascript
// Input: root = [3,1,4,null,2], k = 1
// Output: 1
```

**Key Skills:**
- In-order traversal
- Early termination

---

### 75. Lowest Common Ancestor of a Binary Tree
**Difficulty:** Medium  
**Topics:** Tree, DFS, Binary Tree

**Problem:**
Given a binary tree, find the lowest common ancestor of two given nodes.

```javascript
// Input: root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1
// Output: 3
// Explanation: LCA of nodes 5 and 1 is 3
```

---

### 76. Binary Tree Maximum Path Sum
**Difficulty:** Hard  
**Topics:** Tree, DFS, Dynamic Programming, Binary Tree

**Problem:**
Given a binary tree, find the maximum path sum. A path can start and end at any node.

```javascript
// Input: root = [-10,9,20,null,null,15,7]
// Output: 42
// Explanation: 15 -> 20 -> 7
```

**Key Skills:**
- Post-order traversal
- Global maximum tracking

---

### 77. Construct Binary Tree from Preorder and Inorder Traversal
**Difficulty:** Medium  
**Topics:** Array, Hash Table, Tree, DFS, Binary Tree

**Problem:**
Given two integer arrays `preorder` and `inorder`, construct and return the binary tree.

```javascript
// Input: preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
// Output: [3,9,20,null,null,15,7]
```

---

### 78. Combination Sum
**Difficulty:** Medium  
**Topics:** Array, Backtracking

**Problem:**
Given an array of distinct integers `candidates` and a target integer, return all unique combinations that sum to target. Same number may be chosen unlimited times.

```javascript
// Input: candidates = [2,3,6,7], target = 7
// Output: [[2,2,3],[7]]
```

---

### 79. Subsets
**Difficulty:** Medium  
**Topics:** Array, Backtracking, Bit Manipulation

**Problem:**
Given an integer array `nums` of unique elements, return all possible subsets (the power set).

```javascript
// Input: nums = [1,2,3]
// Output: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]
```

---

### 80. Combination Sum II
**Difficulty:** Medium  
**Topics:** Array, Backtracking

**Problem:**
Given a collection of candidates (may have duplicates) and a target, find all unique combinations where each number may be used only once.

```javascript
// Input: candidates = [10,1,2,7,6,1,5], target = 8
// Output: [[1,1,6],[1,2,5],[1,7],[2,6]]
```

---

### 81. Generate Parentheses
**Difficulty:** Medium  
**Topics:** String, Dynamic Programming, Backtracking

**Problem:**
Given `n` pairs of parentheses, write a function to generate all combinations of well-formed parentheses.

```javascript
// Input: n = 3
// Output: ["((()))","(()())","(())()","()(())","()()()"]
```

---

### 82. Letter Combinations of a Phone Number
**Difficulty:** Medium  
**Topics:** String, Backtracking

**Problem:**
Given a string containing digits from 2-9, return all possible letter combinations that the number could represent.

```javascript
// Input: digits = "23"
// Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]
```

---

### 83. Palindrome Partitioning
**Difficulty:** Medium  
**Topics:** String, Dynamic Programming, Backtracking

**Problem:**
Given a string `s`, partition `s` such that every substring of the partition is a palindrome. Return all possible palindrome partitioning.

```javascript
// Input: s = "aab"
// Output: [["a","a","b"],["aa","b"]]
```

---

### 84. N-Queens
**Difficulty:** Hard  
**Topics:** Array, Backtracking

**Problem:**
Place n queens on an n×n chessboard such that no two queens attack each other.

```javascript
// Input: n = 4
// Output: [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]
```

---

### 85. Reverse Linked List
**Difficulty:** Easy  
**Topics:** Linked List, Recursion

**Problem:**
Reverse a singly linked list.

```javascript
// Input: head = [1,2,3,4,5]
// Output: [5,4,3,2,1]
```

**Key Skills:**
- Iterative approach
- Recursive approach

---

### 86. Linked List Cycle
**Difficulty:** Easy  
**Topics:** Hash Table, Linked List, Two Pointers

**Problem:**
Given `head`, determine if the linked list has a cycle in it.

**Key Skills:**
- Floyd's cycle detection (fast & slow pointers)

---

### 87. Remove Nth Node From End of List
**Difficulty:** Medium  
**Topics:** Linked List, Two Pointers

**Problem:**
Given the head of a linked list, remove the nth node from the end of the list.

```javascript
// Input: head = [1,2,3,4,5], n = 2
// Output: [1,2,3,5]
```

---

### 88. Reorder List
**Difficulty:** Medium  
**Topics:** Linked List, Two Pointers, Stack, Recursion

**Problem:**
Reorder the list to be in the form: L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …

```javascript
// Input: head = [1,2,3,4]
// Output: [1,4,2,3]
```

---

### 89. Add Two Numbers
**Difficulty:** Medium  
**Topics:** Linked List, Math, Recursion

**Problem:**
You are given two non-empty linked lists representing two non-negative integers in reverse order. Add the two numbers and return the sum as a linked list.

```javascript
// Input: l1 = [2,4,3], l2 = [5,6,4]
// Output: [7,0,8]
// Explanation: 342 + 465 = 807
```

---

### 90. Copy List with Random Pointer
**Difficulty:** Medium  
**Topics:** Hash Table, Linked List

**Problem:**
Construct a deep copy of a linked list where each node has a `next` and a `random` pointer.

**Key Skills:**
- Hash map for node mapping
- O(1) space solution using interweaving

---

### 91. Pow(x, n)
**Difficulty:** Medium  
**Topics:** Math, Recursion

**Problem:**
Implement pow(x, n), which calculates x raised to the power n.

```javascript
// Input: x = 2.00000, n = 10
// Output: 1024.00000
```

**Key Skills:**
- Binary exponentiation
- O(log n) time complexity

---

### 92. Sqrt(x)
**Difficulty:** Easy  
**Topics:** Math, Binary Search

**Problem:**
Given a non-negative integer `x`, compute and return the square root of `x` (rounded down).

```javascript
// Input: x = 8
// Output: 2
// Explanation: sqrt(8) = 2.828, rounded down to 2
```

---

### 93. Sum of Two Integers
**Difficulty:** Medium  
**Topics:** Math, Bit Manipulation

**Problem:**
Given two integers `a` and `b`, return the sum without using the operators `+` and `-`.

**Key Skills:**
- XOR for sum without carry
- AND << 1 for carry
- Bit manipulation mastery

---

### 94. Number of 1 Bits
**Difficulty:** Easy  
**Topics:** Divide and Conquer, Bit Manipulation

**Problem:**
Write a function that takes an unsigned integer and returns the number of '1' bits it has.

```javascript
// Input: n = 11 (binary: 1011)
// Output: 3
```

---

### 95. Counting Bits
**Difficulty:** Easy  
**Topics:** Dynamic Programming, Bit Manipulation

**Problem:**
Given an integer `n`, return an array of length `n + 1` where for each `i`, `ans[i]` is the number of 1's in the binary representation of `i`.

```javascript
// Input: n = 5
// Output: [0,1,1,2,1,2]
// Explanation: 0->0, 1->1, 2->10, 3->11, 4->100, 5->101
```

---

### 96. Reverse Bits
**Difficulty:** Easy  
**Topics:** Divide and Conquer, Bit Manipulation

**Problem:**
Reverse bits of a given 32-bit unsigned integer.

```javascript
// Input: n = 00000010100101000001111010011100
// Output:    964176192 (00111001011110000010100101000000)
```

---

### 97. Single Number
**Difficulty:** Easy  
**Topics:** Array, Bit Manipulation

**Problem:**
Given a non-empty array of integers where every element appears twice except for one, find that single one.

```javascript
// Input: nums = [2,2,1]
// Output: 1
```

**Key Skills:**
- XOR properties: a ^ a = 0, a ^ 0 = a

---

### 98. Single Number II
**Difficulty:** Medium  
**Topics:** Array, Bit Manipulation

**Problem:**
Given an integer array where every element appears three times except for one, find that single one.

**Key Skills:**
- Advanced bit manipulation
- Counting bits at each position

---

### 99. Graph Valid Tree
**Difficulty:** Medium  
**Topics:** Graph, DFS, BFS, Union Find

**Problem:**
Given `n` nodes and a list of undirected edges, check whether these edges form a valid tree.

**Key Skills:**
- Cycle detection
- Connectivity check
- Union-find algorithm

---

### 100. Pacific Atlantic Water Flow
**Difficulty:** Medium  
**Topics:** Array, DFS, BFS, Matrix

**Problem:**
Given an `m x n` matrix of heights, find all coordinates where rain water can flow to both the Pacific and Atlantic oceans.

```javascript
// Input: heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
// Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
```

**Key Skills:**
- Reverse thinking (start from ocean)
- Multiple DFS/BFS

---

## Interview Tips by Level

### Junior Developer Focus:

- **Data Structures:** Arrays, strings, hash tables, basic linked lists
- **Algorithms:** Two pointers, sliding window, basic recursion
- **Time Complexity:** Understand O(n), O(n²), O(log n)
- **Expected:** Solve 2-3 easy problems in 45 minutes

### Mid-Level Developer Focus:

- **Data Structures:** Trees, graphs, heaps, tries
- **Algorithms:** DFS, BFS, backtracking, dynamic programming basics
- **System Design:** Basic understanding of data structure design
- **Expected:** Solve 1-2 medium problems in 45 minutes

### Senior Developer Focus:

- **Advanced Algorithms:** Complex DP, graph algorithms, advanced trees
- **Optimization:** Space-time tradeoffs, caching strategies
- **System Design:** Design complex systems, scale considerations
- **JavaScript Mastery:** Closures, promises, async patterns, performance
- **Expected:** Solve 1 hard problem or multiple mediums with optimal solutions in 60 minutes

---

## Practice Resources

1. **LeetCode Patterns:**

   - Sliding Window
   - Two Pointers
   - Fast & Slow Pointers
   - Merge Intervals
   - Cyclic Sort
   - In-place Reversal of LinkedList
   - Tree BFS/DFS
   - Two Heaps
   - Subsets
   - Modified Binary Search
   - Top K Elements
   - K-way Merge
   - Topological Sort
   - 0/1 Knapsack

2. **JavaScript-Specific:**

   - Understand prototype chain
   - Master closures and scope
   - Async/await and promises
   - Event loop and concurrency
   - Memory management

3. **Interview Strategy:**
   - Always clarify requirements
   - Discuss edge cases
   - Start with brute force, then optimize
   - Explain your thought process
   - Test your code with examples
   - Analyze time and space complexity

---

## Evaluation Criteria

### Code Quality:

- Clean, readable code
- Proper variable naming
- Edge case handling
- Error handling

### Problem-Solving:

- Breaking down complex problems
- Multiple solution approaches
- Optimization thinking

### Communication:

- Explaining thought process
- Asking clarifying questions
- Discussing trade-offs

### Technical Knowledge:

- Data structure selection
- Algorithm choice
- Complexity analysis
- JavaScript best practices

---

**Good luck with your interviews! 🚀**
