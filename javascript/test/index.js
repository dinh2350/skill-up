function canFinish_DFS(numCourses, prerequisites) {
  // Build adjacency list
  const graph = Array.from({ length: numCourses }, () => []);

  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course); // prereq -> course edge
  }

  console.log("graph:", graph);

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

const result = canFinish_DFS(3, [[1,0],[2,0],[3,1]]); // Example usage
console.log("Can finish courses:", result);