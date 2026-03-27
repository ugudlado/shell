/**
 * A* Pathfinding Algorithm
 *
 * Pure functions — no DOM dependency.
 * Runs A* on a 2D grid with walls, recording each step as a snapshot
 * for visualization. Supports Manhattan and Euclidean heuristics.
 * Also includes BFS for side-by-side comparison.
 *
 * Real-world example: GPS finding fastest route between locations.
 */
var AStarAlgorithm = (function () {
  "use strict";

  var MAX_GRID_SIZE = 25;
  var MIN_GRID_SIZE = 1;

  // --- Heuristics ---
  var heuristics = {
    manhattan: function (r1, c1, r2, c2) {
      return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    },
    euclidean: function (r1, c1, r2, c2) {
      var dr = r1 - r2;
      var dc = c1 - c2;
      return Math.sqrt(dr * dr + dc * dc);
    },
  };

  // --- Directions: 4-directional movement ---
  var DIRS = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  /**
   * Build a 2D wall lookup from wall array.
   */
  function buildWallGrid(rows, cols, walls) {
    var wg = [];
    var r, c;
    for (r = 0; r < rows; r++) {
      wg[r] = [];
      for (c = 0; c < cols; c++) {
        wg[r][c] = false;
      }
    }
    for (var i = 0; i < walls.length; i++) {
      var wr = walls[i][0];
      var wc = walls[i][1];
      if (wr >= 0 && wr < rows && wc >= 0 && wc < cols) {
        wg[wr][wc] = true;
      }
    }
    return wg;
  }

  /**
   * Create a key from row, col.
   */
  function key(r, c) {
    return r + "," + c;
  }

  /**
   * Deep copy costs object.
   */
  function copyCosts(costs) {
    var result = {};
    for (var k in costs) {
      if (costs.hasOwnProperty(k)) {
        result[k] = { g: costs[k].g, h: costs[k].h, f: costs[k].f };
      }
    }
    return result;
  }

  /**
   * Copy an array of [r,c] pairs.
   */
  function copyCoordArray(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      result.push([arr[i][0], arr[i][1]]);
    }
    return result;
  }

  // --- Min-heap priority queue on f-cost, tie-break by higher g ---
  function heapPush(heap, entry) {
    heap.push(entry);
    var idx = heap.length - 1;
    while (idx > 0) {
      var parentIdx = Math.floor((idx - 1) / 2);
      if (heapCompare(heap[parentIdx], heap[idx]) <= 0) break;
      var tmp = heap[parentIdx];
      heap[parentIdx] = heap[idx];
      heap[idx] = tmp;
      idx = parentIdx;
    }
  }

  function heapPop(heap) {
    if (heap.length === 0) return null;
    var top = heap[0];
    var last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      var idx = 0;
      while (true) {
        var left = 2 * idx + 1;
        var right = 2 * idx + 2;
        var smallest = idx;
        if (
          left < heap.length &&
          heapCompare(heap[left], heap[smallest]) < 0
        ) {
          smallest = left;
        }
        if (
          right < heap.length &&
          heapCompare(heap[right], heap[smallest]) < 0
        ) {
          smallest = right;
        }
        if (smallest === idx) break;
        var tmp2 = heap[idx];
        heap[idx] = heap[smallest];
        heap[smallest] = tmp2;
        idx = smallest;
      }
    }
    return top;
  }

  function heapCompare(a, b) {
    if (a.f !== b.f) return a.f - b.f;
    // Tie-break: prefer higher g (closer to goal)
    return b.g - a.g;
  }

  /**
   * Make an empty result.
   */
  function emptyResult(error) {
    return {
      path: null,
      snapshots: [],
      explored: 0,
      pathLength: -1,
      error: error || null,
    };
  }

  /**
   * Run A* pathfinding.
   *
   * @param {object} params
   * @param {object} params.grid - { rows, cols, walls: [[r,c], ...] }
   * @param {number[]} params.start - [row, col]
   * @param {number[]} params.end - [row, col]
   * @param {string} params.heuristic - 'manhattan' | 'euclidean'
   * @returns {{ path, snapshots, explored, pathLength, error }}
   */
  function run(params) {
    var grid = params.grid;
    var start = params.start;
    var end = params.end;
    var hName = params.heuristic || "manhattan";
    var hFunc = heuristics[hName] || heuristics.manhattan;

    var rows = grid.rows;
    var cols = grid.cols;

    // Empty grid
    if (rows <= 0 || cols <= 0) {
      return emptyResult(null);
    }

    // Bounds validation
    if (
      start[0] < 0 ||
      start[0] >= rows ||
      start[1] < 0 ||
      start[1] >= cols
    ) {
      return emptyResult("invalid-start");
    }
    if (end[0] < 0 || end[0] >= rows || end[1] < 0 || end[1] >= cols) {
      return emptyResult("invalid-end");
    }

    var wallGrid = buildWallGrid(rows, cols, grid.walls);

    // Start or end on wall
    if (wallGrid[start[0]][start[1]]) {
      return emptyResult(null);
    }
    if (wallGrid[end[0]][end[1]]) {
      return emptyResult(null);
    }

    // Start == End
    if (start[0] === end[0] && start[1] === end[1]) {
      var startKey = key(start[0], start[1]);
      var trivialCosts = {};
      trivialCosts[startKey] = { g: 0, h: 0, f: 0 };
      return {
        path: [[start[0], start[1]]],
        snapshots: [
          {
            current: [start[0], start[1]],
            openSet: [],
            closedSet: [[start[0], start[1]]],
            costs: trivialCosts,
          },
        ],
        explored: 1,
        pathLength: 0,
        error: null,
      };
    }

    // A* algorithm
    var costs = {};
    var parent = {};
    var closedSet = {};
    var closedList = [];
    var openHeap = [];
    var snapshots = [];
    var exploredCount = 0;

    var sKey = key(start[0], start[1]);
    var hVal = hFunc(start[0], start[1], end[0], end[1]);
    costs[sKey] = { g: 0, h: hVal, f: hVal };
    parent[sKey] = null;
    heapPush(openHeap, {
      r: start[0],
      c: start[1],
      f: hVal,
      g: 0,
    });

    var found = false;

    while (openHeap.length > 0) {
      var current = heapPop(openHeap);
      var cr = current.r;
      var cc = current.c;
      var cKey = key(cr, cc);

      // Skip if already in closed set
      if (closedSet[cKey]) {
        continue;
      }

      closedSet[cKey] = true;
      closedList.push([cr, cc]);
      exploredCount++;

      // Build open set list from heap for snapshot
      var openList = [];
      for (var hi = 0; hi < openHeap.length; hi++) {
        if (!closedSet[key(openHeap[hi].r, openHeap[hi].c)]) {
          openList.push([openHeap[hi].r, openHeap[hi].c]);
        }
      }

      // Record snapshot
      snapshots.push({
        current: [cr, cc],
        openSet: copyCoordArray(openList),
        closedSet: copyCoordArray(closedList),
        costs: copyCosts(costs),
      });

      // Found goal
      if (cr === end[0] && cc === end[1]) {
        found = true;
        break;
      }

      // Expand neighbors
      for (var d = 0; d < DIRS.length; d++) {
        var nr = cr + DIRS[d][0];
        var nc = cc + DIRS[d][1];

        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (wallGrid[nr][nc]) continue;

        var nKey = key(nr, nc);
        if (closedSet[nKey]) continue;

        var tentativeG = costs[cKey].g + 1;
        var existingCost = costs[nKey];

        if (!existingCost || tentativeG < existingCost.g) {
          var nH = hFunc(nr, nc, end[0], end[1]);
          var nF = tentativeG + nH;
          costs[nKey] = { g: tentativeG, h: nH, f: nF };
          parent[nKey] = cKey;
          heapPush(openHeap, { r: nr, c: nc, f: nF, g: tentativeG });
        }
      }
    }

    // Reconstruct path
    var path = null;
    var pathLength = -1;
    if (found) {
      path = [];
      var cur = key(end[0], end[1]);
      var maxIter = rows * cols + 1;
      while (cur !== null && maxIter-- > 0) {
        var parts = cur.split(",");
        path.unshift([parseInt(parts[0], 10), parseInt(parts[1], 10)]);
        cur = parent[cur];
      }
      pathLength = path.length - 1;
    }

    return {
      path: path,
      snapshots: snapshots,
      explored: exploredCount,
      pathLength: pathLength,
      error: null,
    };
  }

  /**
   * Run BFS on the same grid format (for comparison).
   * Returns same structure as run() so UI can render identically.
   */
  function runBFS(params) {
    var grid = params.grid;
    var start = params.start;
    var end = params.end;

    var rows = grid.rows;
    var cols = grid.cols;

    if (rows <= 0 || cols <= 0) {
      return emptyResult(null);
    }

    if (
      start[0] < 0 ||
      start[0] >= rows ||
      start[1] < 0 ||
      start[1] >= cols
    ) {
      return emptyResult("invalid-start");
    }
    if (end[0] < 0 || end[0] >= rows || end[1] < 0 || end[1] >= cols) {
      return emptyResult("invalid-end");
    }

    var wallGrid = buildWallGrid(rows, cols, grid.walls);

    if (wallGrid[start[0]][start[1]]) {
      return emptyResult(null);
    }
    if (wallGrid[end[0]][end[1]]) {
      return emptyResult(null);
    }

    if (start[0] === end[0] && start[1] === end[1]) {
      var sKey = key(start[0], start[1]);
      var trivialCosts = {};
      trivialCosts[sKey] = { g: 0, h: 0, f: 0 };
      return {
        path: [[start[0], start[1]]],
        snapshots: [
          {
            current: [start[0], start[1]],
            openSet: [],
            closedSet: [[start[0], start[1]]],
            costs: trivialCosts,
          },
        ],
        explored: 1,
        pathLength: 0,
        error: null,
      };
    }

    var queue = [];
    var visited = {};
    var visitedList = [];
    var parentMap = {};
    var costs = {};
    var snapshots = [];
    var exploredCount = 0;

    var startKey = key(start[0], start[1]);
    queue.push([start[0], start[1]]);
    visited[startKey] = true;
    visitedList.push([start[0], start[1]]);
    parentMap[startKey] = null;
    costs[startKey] = { g: 0, h: 0, f: 0 };

    var found = false;

    while (queue.length > 0) {
      var cell = queue.shift();
      var cr = cell[0];
      var cc = cell[1];
      var cKey = key(cr, cc);
      exploredCount++;

      // Snapshot: current frontier is the queue
      var frontierCopy = [];
      for (var qi = 0; qi < queue.length; qi++) {
        frontierCopy.push([queue[qi][0], queue[qi][1]]);
      }

      snapshots.push({
        current: [cr, cc],
        openSet: copyCoordArray(frontierCopy),
        closedSet: copyCoordArray(visitedList),
        costs: copyCosts(costs),
      });

      if (cr === end[0] && cc === end[1]) {
        found = true;
        break;
      }

      for (var d = 0; d < DIRS.length; d++) {
        var nr = cr + DIRS[d][0];
        var nc = cc + DIRS[d][1];

        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (wallGrid[nr][nc]) continue;

        var nKey = key(nr, nc);
        if (visited[nKey]) continue;

        visited[nKey] = true;
        visitedList.push([nr, nc]);
        parentMap[nKey] = cKey;
        var nG = costs[cKey].g + 1;
        costs[nKey] = { g: nG, h: 0, f: nG };
        queue.push([nr, nc]);
      }
    }

    var path = null;
    var pathLength = -1;
    if (found) {
      path = [];
      var cur = key(end[0], end[1]);
      var maxIter = rows * cols + 1;
      while (cur !== null && maxIter-- > 0) {
        var parts = cur.split(",");
        path.unshift([parseInt(parts[0], 10), parseInt(parts[1], 10)]);
        cur = parentMap[cur];
      }
      pathLength = path.length - 1;
    }

    return {
      path: path,
      snapshots: snapshots,
      explored: exploredCount,
      pathLength: pathLength,
      error: null,
    };
  }

  return {
    run: run,
    runBFS: runBFS,
    heuristics: heuristics,
    MAX_GRID_SIZE: MAX_GRID_SIZE,
    MIN_GRID_SIZE: MIN_GRID_SIZE,
  };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = AStarAlgorithm;
}
