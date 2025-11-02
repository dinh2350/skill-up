/**
 * Returns both max sum and the subarray indices
 * @param {number[]} nums
 * @return {object}
 */
function maxSubArrayWithIndices(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];

  let maxStart = 0;
  let maxEnd = 0;
  let currentStart = 0;

  for (let i = 0; i < nums.length; i++) {
    // If current sum becomes negative, start fresh from current element
    console.log(nums[i], "-", currentSum);
    if (currentSum < 0) {
      currentSum = nums[i];
      currentStart = i;
    } else {
      currentSum += nums[i];
    }

    // Update max if we found a better sum
    if (currentSum > maxSum) {
      maxSum = currentSum;
      maxStart = currentStart;
      maxEnd = i;
    }
  }

  return {
    maxSum,
    start: maxStart,
    end: maxEnd,
    subarray: nums.slice(maxStart, maxEnd + 1),
  };
}

const result = maxSubArrayWithIndices([-2, 1, -3, 0, 4, -1, 2, 1, -5, 4]);
console.log(result); // { maxSum: 6, start: 3, end: 7, subarray: [ 0, 4, -1, 2, 1 ] }
