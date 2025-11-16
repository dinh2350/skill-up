/**
 * ============================================================================
 * LeetCode Problem 7: Best Time to Buy and Sell Stock
 * ============================================================================
 *
 * Difficulty: Easy
 * Topics: Array, Dynamic Programming, Greedy
 *
 * Problem Statement:
 * You are given an array prices where prices[i] is the price of a given stock
 * on the ith day.
 *
 * You want to maximize your profit by choosing a single day to buy one stock
 * and choosing a different day in the future to sell that stock.
 *
 * Return the maximum profit you can achieve from this transaction.
 * If you cannot achieve any profit, return 0.
 *
 * Constraints:
 * - 1 <= prices.length <= 10^5
 * - 0 <= prices[i] <= 10^4
 *
 * Examples:
 * Input: prices = [7,1,5,3,6,4]
 * Output: 5
 * Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5
 *
 * Input: prices = [7,6,4,3,1]
 * Output: 0
 * Explanation: No transactions are done and the max profit = 0
 */

// ============================================================================
// Approach 1: Brute Force (Two Nested Loops)
// ============================================================================
// Time Complexity: O(n²) - Two nested loops
// Space Complexity: O(1) - Only storing maxProfit
//
// Strategy:
// - Check every possible buy-sell combination
// - For each buy day, check all future sell days
// - Track the maximum profit found
//
// ❌ This approach will get Time Limit Exceeded on LeetCode for large inputs

function maxProfit_BruteForce(prices) {
  let maxProfit = 0;

  // Try every possible buy day
  for (let buy = 0; buy < prices.length - 1; buy++) {
    // Try every possible sell day after buy day
    for (let sell = buy + 1; sell < prices.length; sell++) {
      const profit = prices[sell] - prices[buy];
      maxProfit = Math.max(maxProfit, profit);
    }
  }

  return maxProfit;
}

// ============================================================================
// Approach 2: One Pass with Min Tracking (OPTIMAL) ⭐
// ============================================================================
// Time Complexity: O(n) - Single pass through array
// Space Complexity: O(1) - Only storing two variables
//
// Strategy:
// - Keep track of the minimum price seen so far (best buy price)
// - For each price, calculate profit if we sell today
// - Update maximum profit if current profit is better
//
// Key Insight:
// We want to buy at the lowest price and sell at the highest price AFTER that.
// As we iterate, we track:
// 1. The lowest price seen so far (minPrice)
// 2. The maximum profit we could make (maxProfit)
//
// ✅ This is the optimal solution for interviews

function maxProfit(prices) {
  let minPrice = Infinity; // Track the minimum price seen so far
  let maxProfit = 0; // Track the maximum profit found

  for (let i = 0; i < prices.length; i++) {
    // If current price is lower than minPrice, update minPrice
    // (This is a better day to buy)
    if (prices[i] < minPrice) {
      minPrice = prices[i];
    }
    // Otherwise, calculate profit if we sell today
    else {
      const profit = prices[i] - minPrice;
      maxProfit = Math.max(maxProfit, profit);
    }
  }

  return maxProfit;
}

// ============================================================================
// Approach 3: One Pass with Compact Math.max
// ============================================================================
// Time Complexity: O(n)
// Space Complexity: O(1)
//
// Same logic as Approach 2, but more compact code

function maxProfit_Compact(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;

  for (const price of prices) {
    minPrice = Math.min(minPrice, price);
    maxProfit = Math.max(maxProfit, price - minPrice);
  }

  return maxProfit;
}

// ============================================================================
// Approach 4: Using Array.reduce() (Functional Approach)
// ============================================================================
// Time Complexity: O(n)
// Space Complexity: O(1)
//
// Functional programming approach using reduce
// Accumulates both minPrice and maxProfit in a single pass

function maxProfit_Reduce(prices) {
  const result = prices.reduce(
    (acc, price) => {
      // Update minimum price
      acc.minPrice = Math.min(acc.minPrice, price);
      // Update maximum profit
      acc.maxProfit = Math.max(acc.maxProfit, price - acc.minPrice);
      return acc;
    },
    { minPrice: Infinity, maxProfit: 0 }
  );

  return result.maxProfit;
}

// ============================================================================
// Approach 5: Kadane's Algorithm Variation (Dynamic Programming)
// ============================================================================
// Time Complexity: O(n)
// Space Complexity: O(1)
//
// This is similar to Maximum Subarray problem (Kadane's Algorithm)
// Instead of tracking max sum, we track max profit
//
// Key Insight:
// Convert prices to daily differences, then find maximum subarray sum
// prices = [7,1,5,3,6,4]
// differences = [-6,4,-2,3,-2]  (each day's change from previous)
// Maximum subarray sum = 5 (indices 1-3: [4,-2,3])

function maxProfit_Kadane(prices) {
  if (prices.length < 2) return 0;

  let maxProfit = 0;
  let currentProfit = 0;

  for (let i = 1; i < prices.length; i++) {
    // Daily change (profit/loss from previous day)
    const dailyChange = prices[i] - prices[i - 1];

    // Either continue current transaction or start new
    currentProfit = Math.max(0, currentProfit + dailyChange);

    // Update maximum profit
    maxProfit = Math.max(maxProfit, currentProfit);
  }

  return maxProfit;
}

// ============================================================================
// VISUALIZATION: How the Algorithm Works
// ============================================================================

function visualizeAlgorithm(prices) {
  console.log("\n" + "=".repeat(70));
  console.log("VISUALIZATION: Best Time to Buy and Sell Stock");
  console.log("=".repeat(70));
  console.log(`Input: [${prices.join(", ")}]`);
  console.log("");

  let minPrice = Infinity;
  let maxProfit = 0;
  let buyDay = -1;
  let sellDay = -1;

  console.log("Day | Price | MinPrice | Profit | MaxProfit | Action");
  console.log("-".repeat(70));

  for (let i = 0; i < prices.length; i++) {
    const price = prices[i];
    const profit = price - minPrice;

    let action = "";

    if (price < minPrice) {
      minPrice = price;
      buyDay = i;
      action = "🔽 New min price (better buy day)";
    } else if (profit > maxProfit) {
      maxProfit = profit;
      sellDay = i;
      action = "📈 New max profit!";
    } else if (profit > 0) {
      action = "✓ Positive profit, but not max";
    } else {
      action = "- No profit";
    }

    console.log(
      ` ${i}  |  ${String(price).padStart(3)}  |   ${String(minPrice).padStart(
        3
      )}    |  ${String(profit).padStart(3)}   |    ${String(
        maxProfit
      ).padStart(3)}    | ${action}`
    );
  }

  console.log("-".repeat(70));
  console.log(`\n💰 Result: Max Profit = ${maxProfit}`);

  if (maxProfit > 0) {
    console.log(`   Buy on day ${buyDay} at price ${prices[buyDay]}`);
    console.log(`   Sell on day ${sellDay} at price ${prices[sellDay]}`);
    console.log(
      `   Profit = ${prices[sellDay]} - ${prices[buyDay]} = ${maxProfit}`
    );
  } else {
    console.log(`   No profitable transaction possible`);
  }

  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// VISUAL DIAGRAM: Price Chart
// ============================================================================

function visualizePriceChart(prices) {
  console.log("\n" + "=".repeat(70));
  console.log("PRICE CHART VISUALIZATION");
  console.log("=".repeat(70));

  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice;
  const height = 15; // Chart height

  // Create chart rows
  for (let row = height; row >= 0; row--) {
    const priceLevel = minPrice + (range * row) / height;
    let line = `${Math.round(priceLevel).toString().padStart(3)} | `;

    for (let i = 0; i < prices.length; i++) {
      const normalizedPrice = ((prices[i] - minPrice) / range) * height;

      if (Math.abs(normalizedPrice - row) < 0.5) {
        line += "●  ";
      } else if (normalizedPrice > row - 0.5 && normalizedPrice < row + 0.5) {
        line += "|  ";
      } else {
        line += "   ";
      }
    }

    console.log(line);
  }

  // X-axis
  console.log("    +" + "-".repeat(prices.length * 3));
  console.log("      " + prices.map((_, i) => String(i).padEnd(3)).join(""));
  console.log("      Days");
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// MATHEMATICAL EXPLANATION
// ============================================================================

function explainMathematically() {
  console.log("\n" + "=".repeat(70));
  console.log("MATHEMATICAL EXPLANATION");
  console.log("=".repeat(70));
  console.log(`
Why One Pass with Min Tracking Works:

Given prices array: [p₀, p₁, p₂, ..., pₙ]

Goal: Maximize profit = pₛₑₗₗ - pᵦᵤᵧ where sell > buy

Key Insight:
For any selling day i, the maximum profit is:
    profit(i) = prices[i] - min(prices[0...i-1])

Why?
- We can only sell on day i after buying on some previous day
- To maximize profit, we want to buy at the LOWEST price before day i
- So we need to track: min_price_so_far = min(prices[0...i-1])

Algorithm:
1. Initialize: min_price = ∞, max_profit = 0
2. For each day i:
   a. If prices[i] < min_price: 
      Update min_price = prices[i] (better buy opportunity)
   b. Else:
      current_profit = prices[i] - min_price
      max_profit = max(max_profit, current_profit)

Time Complexity: O(n) - Single pass
Space Complexity: O(1) - Only two variables

Proof of Correctness:
- We examine every possible selling day (i = 0 to n-1)
- For each selling day, we calculate profit using the best buy day before it
- We track the maximum profit across all days
- Therefore, we find the global maximum profit
    `);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// EDGE CASES
// ============================================================================

function testEdgeCases() {
  console.log("\n" + "=".repeat(70));
  console.log("EDGE CASES TESTING");
  console.log("=".repeat(70) + "\n");

  const edgeCases = [
    {
      name: "Single Element",
      input: [5],
      expected: 0,
      explanation: "Cannot make any transaction",
    },
    {
      name: "Two Elements - Profit",
      input: [1, 5],
      expected: 4,
      explanation: "Buy at 1, sell at 5",
    },
    {
      name: "Two Elements - Loss",
      input: [5, 1],
      expected: 0,
      explanation: "Cannot buy at 5 and sell at 1",
    },
    {
      name: "All Decreasing",
      input: [7, 6, 4, 3, 1],
      expected: 0,
      explanation: "Prices only go down, no profit possible",
    },
    {
      name: "All Increasing",
      input: [1, 2, 3, 4, 5],
      expected: 4,
      explanation:
        "Buy at 1, sell at 5 (or any buy day i, sell day j where j > i)",
    },
    {
      name: "All Same",
      input: [3, 3, 3, 3],
      expected: 0,
      explanation: "No price change, no profit",
    },
    {
      name: "Zero Prices",
      input: [0, 0, 0],
      expected: 0,
      explanation: "All prices are zero",
    },
    {
      name: "Min at End",
      input: [7, 5, 3, 1],
      expected: 0,
      explanation: "Lowest price is at the end, cannot sell after buying",
    },
    {
      name: "Max at Start",
      input: [10, 5, 3, 1],
      expected: 0,
      explanation: "Highest price is at the start, prices only decrease",
    },
    {
      name: "V-Shape",
      input: [5, 4, 3, 2, 1, 2, 3, 4, 5],
      expected: 4,
      explanation: "Buy at bottom (1), sell at end (5)",
    },
  ];

  edgeCases.forEach(({ name, input, expected, explanation }) => {
    const result = maxProfit(input);
    const status = result === expected ? "✅" : "❌";

    console.log(`${status} ${name}`);
    console.log(`   Input: [${input.join(", ")}]`);
    console.log(`   Expected: ${expected}, Got: ${result}`);
    console.log(`   Explanation: ${explanation}`);
    console.log("");
  });

  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// PERFORMANCE COMPARISON
// ============================================================================

function comparePerformance() {
  console.log("\n" + "=".repeat(70));
  console.log("PERFORMANCE COMPARISON");
  console.log("=".repeat(70) + "\n");

  // Test with different array sizes
  const sizes = [100, 1000, 10000];

  sizes.forEach((size) => {
    // Generate random prices
    const prices = Array.from({ length: size }, () =>
      Math.floor(Math.random() * 1000)
    );

    console.log(`Array Size: ${size.toLocaleString()} elements`);
    console.log("-".repeat(50));

    // Test Brute Force (only for small sizes)
    if (size <= 1000) {
      const start1 = performance.now();
      const result1 = maxProfit_BruteForce(prices);
      const time1 = performance.now() - start1;
      console.log(
        `Brute Force:        ${time1.toFixed(3)}ms (result: ${result1})`
      );
    } else {
      console.log(
        `Brute Force:        Skipped (too slow for ${size} elements)`
      );
    }

    // Test One Pass
    const start2 = performance.now();
    const result2 = maxProfit(prices);
    const time2 = performance.now() - start2;
    console.log(
      `One Pass:           ${time2.toFixed(3)}ms (result: ${result2})`
    );

    // Test Compact
    const start3 = performance.now();
    const result3 = maxProfit_Compact(prices);
    const time3 = performance.now() - start3;
    console.log(
      `Compact:            ${time3.toFixed(3)}ms (result: ${result3})`
    );

    // Test Reduce
    const start4 = performance.now();
    const result4 = maxProfit_Reduce(prices);
    const time4 = performance.now() - start4;
    console.log(
      `Reduce:             ${time4.toFixed(3)}ms (result: ${result4})`
    );

    // Test Kadane
    const start5 = performance.now();
    const result5 = maxProfit_Kadane(prices);
    const time5 = performance.now() - start5;
    console.log(
      `Kadane's Variation: ${time5.toFixed(3)}ms (result: ${result5})`
    );

    console.log("");
  });

  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// COMPREHENSIVE TEST CASES
// ============================================================================

function runTests() {
  console.log("\n" + "=".repeat(70));
  console.log("COMPREHENSIVE TEST CASES");
  console.log("=".repeat(70) + "\n");

  const testCases = [
    {
      input: [7, 1, 5, 3, 6, 4],
      expected: 5,
      description: "Standard case: Buy at 1, sell at 6",
    },
    {
      input: [7, 6, 4, 3, 1],
      expected: 0,
      description: "Decreasing prices: No profit",
    },
    {
      input: [1, 2],
      expected: 1,
      description: "Two elements: Simple profit",
    },
    {
      input: [2, 1],
      expected: 0,
      description: "Two elements: No profit",
    },
    {
      input: [3, 3, 5, 0, 0, 3, 1, 4],
      expected: 4,
      description: "Multiple peaks: Buy at 0, sell at 4",
    },
    {
      input: [1],
      expected: 0,
      description: "Single element: No transaction possible",
    },
    {
      input: [2, 4, 1],
      expected: 2,
      description: "Peak in middle: Buy at 2, sell at 4",
    },
    {
      input: [3, 2, 6, 5, 0, 3],
      expected: 4,
      description: "Buy at 2, sell at 6",
    },
  ];

  const approaches = [
    { name: "Brute Force", fn: maxProfit_BruteForce },
    { name: "One Pass (Optimal)", fn: maxProfit },
    { name: "Compact", fn: maxProfit_Compact },
    { name: "Reduce", fn: maxProfit_Reduce },
    { name: "Kadane's Variation", fn: maxProfit_Kadane },
  ];

  approaches.forEach(({ name, fn }) => {
    console.log(`\n${name}:`);
    console.log("-".repeat(70));

    let passed = 0;
    testCases.forEach(({ input, expected, description }, index) => {
      const result = fn(input);
      const status = result === expected ? "✅" : "❌";

      if (result === expected) passed++;

      console.log(`${status} Test ${index + 1}: ${description}`);
      console.log(`   Input: [${input.join(", ")}]`);
      console.log(`   Expected: ${expected}, Got: ${result}`);
    });

    console.log(`\nPassed: ${passed}/${testCases.length}`);
  });

  console.log("\n" + "=".repeat(70) + "\n");
}

// ============================================================================
// INTERVIEW TIPS
// ============================================================================

function printInterviewTips() {
  console.log("\n" + "=".repeat(70));
  console.log("💡 INTERVIEW TIPS & COMMON MISTAKES");
  console.log("=".repeat(70));
  console.log(`
1. CLARIFY THE PROBLEM:
   ✓ "Can I buy and sell on the same day?" → No, sell must be after buy
   ✓ "Can I make multiple transactions?" → No, only one buy-sell pair
   ✓ "What if prices are all decreasing?" → Return 0
   ✓ "What if array is empty or has 1 element?" → Return 0

2. START WITH BRUTE FORCE:
   - Show you understand the problem by explaining O(n²) approach
   - "We could check every buy-sell pair, but that's inefficient"
   - This demonstrates problem-solving thinking

3. OPTIMIZE TO ONE PASS:
   - Key insight: "For any sell day, we want the lowest buy day before it"
   - "We can track the minimum price as we iterate"
   - This shows you can optimize algorithms

4. DISCUSS EDGE CASES:
   ✓ Empty array or single element
   ✓ All prices decreasing
   ✓ All prices increasing
   ✓ All prices the same

5. COMMON MISTAKES TO AVOID:
   ❌ Trying to find max price first, then min price
      (Min must come BEFORE max in the array!)
   ❌ Forgetting to handle the case where no profit is possible
   ❌ Returning negative profit instead of 0
   ❌ Not initializing minPrice to Infinity or prices[0]

6. FOLLOW-UP QUESTIONS TO EXPECT:
   - "What if you could make unlimited transactions?" → Different problem
   - "What if you could make at most k transactions?" → DP problem
   - "What if there's a transaction fee?" → Variation with fee

7. CODE QUALITY:
   ✓ Use meaningful variable names (minPrice, maxProfit)
   ✓ Add comments explaining the logic
   ✓ Handle edge cases explicitly
   ✓ Keep code simple and readable

8. TIME & SPACE COMPLEXITY:
   - Always state: "O(n) time, O(1) space"
   - Explain why: "Single pass through array, only two variables"
    `);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// RELATED PROBLEMS
// ============================================================================

function printRelatedProblems() {
  console.log("\n" + "=".repeat(70));
  console.log("🔗 RELATED PROBLEMS");
  console.log("=".repeat(70));
  console.log(`
1. Best Time to Buy and Sell Stock II (Medium)
   - You can make unlimited transactions
   - Greedy approach: sum all positive differences

2. Best Time to Buy and Sell Stock III (Hard)
   - You can make at most 2 transactions
   - Dynamic programming with state machine

3. Best Time to Buy and Sell Stock IV (Hard)
   - You can make at most k transactions
   - Generalized DP solution

4. Best Time to Buy and Sell Stock with Cooldown (Medium)
   - Must wait 1 day after selling before buying again
   - DP with states: hold, sold, cooldown

5. Best Time to Buy and Sell Stock with Transaction Fee (Medium)
   - Each transaction has a fee
   - DP similar to unlimited transactions

6. Maximum Subarray (Easy)
   - Similar pattern: track running sum and maximum
   - Kadane's algorithm

7. House Robber (Medium)
   - DP problem with similar decision-making pattern
   - Choose optimal subset with constraints
    `);
  console.log("=".repeat(70) + "\n");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log("\n📊 PROBLEM 7: BEST TIME TO BUY AND SELL STOCK");
console.log("=".repeat(70));

// Example 1: Standard case
const prices1 = [7, 1, 5, 3, 6, 4];
console.log("\n📌 Example 1:");
console.log(`Input: [${prices1.join(", ")}]`);
console.log(`Output: ${maxProfit(prices1)}`);
console.log(
  "Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6)"
);
console.log("Profit = 6 - 1 = 5");

// Example 2: Decreasing prices
const prices2 = [7, 6, 4, 3, 1];
console.log("\n📌 Example 2:");
console.log(`Input: [${prices2.join(", ")}]`);
console.log(`Output: ${maxProfit(prices2)}`);
console.log("Explanation: No transactions are done, max profit = 0");

// Detailed visualization
visualizeAlgorithm(prices1);
visualizePriceChart(prices1);

// Mathematical explanation
explainMathematically();

// Run all tests
runTests();

// Test edge cases
testEdgeCases();

// Performance comparison
comparePerformance();

// Interview tips
printInterviewTips();

// Related problems
printRelatedProblems();

console.log("\n✅ All implementations completed!");
console.log(
  "Recommended approach for interviews: Approach 2 (One Pass with Min Tracking)"
);
console.log("Time: O(n) | Space: O(1)\n");
