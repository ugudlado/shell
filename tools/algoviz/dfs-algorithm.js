/**
 * DFS Pathfinding Algorithm
 *
 * Pure functions — no DOM dependency.
 * Runs depth-first search on a grid using an explicit stack,
 * recording each step as a snapshot for visualization.
 *
 * Contrasts with BFS: uses stack.pop() (LIFO) instead of queue.shift() (FIFO),
 * causing exploration to go deep before backtracking.
 */
var DFSAlgorithm = (function () {
  "use strict";

  /**
   * Run DFS pathfinding on a grid.
   *
   * @param {object} params
   * @param {boolean[][]} params.walls - walls[row][col] = true if wall
   * @param {number} params.rows - grid row count
   * @param {number} params.cols - grid column count
   * @param {number[]} params.start - [row, col]
   * @param {number[]} params.end - [row, col]
   * @returns {{
   *   snapshots: Array<{stack: number[][], visited: number[][], current: number[]|null, path: number[][]|null, found: boolean}>,
   *   path: number[][]|null,
   *   found: boolean
   * }}
   */
  function search(params) {
    var walls = params.walls;
    var rows = params.rows;
    var cols = params.cols;
    var start = params.start;
    var end = params.end;

    // Validate inputs
    if (rows < 1 || cols < 1) {
      return { snapshots: [], path: null, found: false };
    }
    if (
      !start ||
      !end ||
      start[0] < 0 ||
      start[0] >= rows ||
      start[1] < 0 ||
      start[1] >= cols ||
      end[0] < 0 ||
      end[0] >= rows ||
      end[1] < 0 ||
      end[1] >= cols
    ) {
      return { snapshots: [], path: null, found: false };
    }

    // Start or end on a wall
    if (walls[start[0]][start[1]] || walls[end[0]][end[1]]) {
      return { snapshots: [], path: null, found: false };
    }

    // Same cell
    if (start[0] === end[0] && start[1] === end[1]) {
      var snap = {
        stack: [],
        visited: [[start[0], start[1]]],
        current: [start[0], start[1]],
        path: [[start[0], start[1]]],
        found: true,
      };
      return { snapshots: [snap], path: [[start[0], start[1]]], found: true };
    }

    var directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]; // up, right, down, left

    var stack = [[start[0], start[1]]];
    var visitedSet = {};
    var parent = {};
    var snapshots = [];
    var stepCount = 0;
    var maxSteps = rows * cols + 1; // Safety bound

    visitedSet[key(start[0], start[1])] = true;

    while (stack.length > 0 && stepCount < maxSteps) {
      stepCount++;
      var current = stack.pop();
      var cr = current[0];
      var cc = current[1];

      // Record snapshot: exploring this cell
      snapshots.push({
        stack: copyStack(stack),
        visited: visitedKeys(visitedSet),
        current: [cr, cc],
        path: null,
        found: false,
      });

      // Found the end
      if (cr === end[0] && cc === end[1]) {
        var path = reconstructPath(parent, start, end);
        snapshots.push({
          stack: copyStack(stack),
          visited: visitedKeys(visitedSet),
          current: [cr, cc],
          path: path,
          found: true,
        });
        return { snapshots: snapshots, path: path, found: true };
      }

      // Explore neighbors (reverse order so first direction is popped first)
      for (var i = directions.length - 1; i >= 0; i--) {
        var dr = directions[i][0];
        var dc = directions[i][1];
        var nr = cr + dr;
        var nc = cc + dc;

        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (walls[nr][nc]) continue;
        if (visitedSet[key(nr, nc)]) continue;

        visitedSet[key(nr, nc)] = true;
        parent[key(nr, nc)] = [cr, cc];
        stack.push([nr, nc]);
      }
    }

    // No path found
    snapshots.push({
      stack: [],
      visited: visitedKeys(visitedSet),
      current: null,
      path: null,
      found: false,
    });
    return { snapshots: snapshots, path: null, found: false };
  }

  function key(r, c) {
    return r + "," + c;
  }

  function copyStack(stack) {
    var result = [];
    for (var i = 0; i < stack.length; i++) {
      result.push([stack[i][0], stack[i][1]]);
    }
    return result;
  }

  function visitedKeys(visitedSet) {
    var result = [];
    for (var k in visitedSet) {
      if (visitedSet.hasOwnProperty(k)) {
        var parts = k.split(",");
        result.push([parseInt(parts[0], 10), parseInt(parts[1], 10)]);
      }
    }
    return result;
  }

  function reconstructPath(parent, start, end) {
    var path = [];
    var cur = end;
    var maxIter = 10000;
    while (maxIter-- > 0) {
      path.unshift([cur[0], cur[1]]);
      if (cur[0] === start[0] && cur[1] === start[1]) break;
      var p = parent[key(cur[0], cur[1])];
      if (!p) break;
      cur = p;
    }
    return path;
  }

  return { search: search };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = DFSAlgorithm;
}
