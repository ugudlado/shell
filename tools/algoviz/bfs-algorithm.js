// bfs-algorithm.js — Pure BFS pathfinding algorithm (no DOM, testable in Node)

var BFSAlgorithm = (function () {
  "use strict";

  /**
   * Run BFS on a 2D grid from start to end.
   * @param {object} options
   * @param {number} options.gridSize - Size of the square grid
   * @param {boolean[][]} options.walls - walls[r][c] = true if cell is a wall
   * @param {number[]} options.start - [row, col] start position
   * @param {number[]} options.end - [row, col] end position
   * @returns {object} { found, path, snapshots, visitedCount }
   */
  function search(options) {
    var gridSize = options.gridSize;
    var walls = options.walls;
    var start = options.start;
    var end = options.end;

    if (
      !start ||
      !end ||
      gridSize <= 0 ||
      start[0] < 0 ||
      start[0] >= gridSize ||
      start[1] < 0 ||
      start[1] >= gridSize ||
      end[0] < 0 ||
      end[0] >= gridSize ||
      end[1] < 0 ||
      end[1] >= gridSize
    ) {
      return { found: false, path: null, snapshots: [], visitedCount: 0 };
    }

    // Same position edge case
    if (start[0] === end[0] && start[1] === end[1]) {
      return {
        found: true,
        path: [[start[0], start[1]]],
        snapshots: [],
        visitedCount: 1,
      };
    }

    // Start or end on a wall
    if (walls[start[0]][start[1]] || walls[end[0]][end[1]]) {
      return { found: false, path: null, snapshots: [], visitedCount: 0 };
    }

    // Build internal grid state
    var distance = [];
    var parent = [];
    var visited = [];
    for (var r = 0; r < gridSize; r++) {
      distance[r] = [];
      parent[r] = [];
      visited[r] = [];
      for (var c = 0; c < gridSize; c++) {
        distance[r][c] = -1;
        parent[r][c] = null;
        visited[r][c] = false;
      }
    }

    var snapshots = [];
    var directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    var queue = [[start[0], start[1]]];
    visited[start[0]][start[1]] = true;
    distance[start[0]][start[1]] = 0;

    var allVisitedSet = {};
    allVisitedSet[key(start[0], start[1])] = true;

    var found = false;

    while (queue.length > 0 && !found) {
      var levelSize = queue.length;
      var frontier = [];

      // Snapshot BEFORE processing this level
      snapshots.push({
        frontier: queue.map(function (q) {
          return [q[0], q[1]];
        }),
        visited: Object.keys(allVisitedSet).map(function (k) {
          return k.split(",").map(Number);
        }),
        queue: queue.map(function (q) {
          return [q[0], q[1]];
        }),
        path: null,
        found: false,
      });

      for (var i = 0; i < levelSize; i++) {
        var current = queue.shift();
        var cr = current[0];
        var cc = current[1];

        for (var d = 0; d < directions.length; d++) {
          var dr = directions[d][0];
          var dc = directions[d][1];
          var nr = cr + dr;
          var nc = cc + dc;

          if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
          if (walls[nr][nc] || visited[nr][nc]) continue;

          visited[nr][nc] = true;
          distance[nr][nc] = distance[cr][cc] + 1;
          parent[nr][nc] = [cr, cc];
          queue.push([nr, nc]);
          allVisitedSet[key(nr, nc)] = true;
          frontier.push([nr, nc]);

          if (nr === end[0] && nc === end[1]) {
            found = true;
          }
        }
      }

      // Snapshot AFTER processing
      snapshots.push({
        frontier: frontier,
        visited: Object.keys(allVisitedSet).map(function (k) {
          return k.split(",").map(Number);
        }),
        queue: queue.map(function (q) {
          return [q[0], q[1]];
        }),
        path: null,
        found: false,
      });

      if (found) break;
    }

    // Reconstruct path
    var path = null;
    if (found) {
      path = [];
      var cur = end;
      while (cur) {
        path.unshift([cur[0], cur[1]]);
        cur = parent[cur[0]][cur[1]];
      }
    }

    // Final snapshot with path
    snapshots.push({
      frontier: [],
      visited: Object.keys(allVisitedSet).map(function (k) {
        return k.split(",").map(Number);
      }),
      queue: [],
      path: path,
      found: found,
    });

    var visitedCount = Object.keys(allVisitedSet).length;

    return {
      found: found,
      path: path,
      snapshots: snapshots,
      visitedCount: visitedCount,
    };
  }

  function key(r, c) {
    return r + "," + c;
  }

  return { search: search };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = BFSAlgorithm;
}
