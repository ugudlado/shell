/**
 * BFS Pathfinding Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const BFSAlgorithm = require("./bfs-algorithm.js");

  function check(fn, name) {
    try {
      fn();
      passed++;
      console.log("  PASS: " + name);
    } catch (e) {
      failed++;
      failures.push({ name, message: e.message });
      console.log("  FAIL: " + name + " — " + e.message);
    }
  }

  // Helper: create a grid of walls (all false)
  function emptyWalls(size) {
    var w = [];
    for (var r = 0; r < size; r++) {
      w[r] = [];
      for (var c = 0; c < size; c++) {
        w[r][c] = false;
      }
    }
    return w;
  }

  // --- Basic pathfinding ---
  check(function () {
    var walls = emptyWalls(5);
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === true, "Should find a path");
    assert(result.path !== null, "Path should not be null");
    assert(result.path.length >= 2, "Path should have at least start and end");
    assertEqual(result.path[0], [0, 0], "Path starts at start");
    assertEqual(
      result.path[result.path.length - 1],
      [4, 4],
      "Path ends at end",
    );
  }, "Basic: finds path from (0,0) to (4,4) on empty 5x5 grid");

  // --- BFS finds shortest path ---
  check(function () {
    var walls = emptyWalls(5);
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === true, "Path found");
    // Manhattan distance from (0,0) to (4,4) is 8, BFS on open grid gives shortest path
    assertEqual(result.path.length, 9, "Shortest path length is 9 (8 steps + start)");
  }, "BFS finds shortest path (Manhattan distance)");

  // --- Same start and end ---
  check(function () {
    var walls = emptyWalls(5);
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [2, 2],
      end: [2, 2],
    });
    assert(result.found === true, "Should find trivial path");
    assertEqual(result.path, [[2, 2]], "Path is just the one cell");
    assertEqual(result.visitedCount, 1, "Visited count is 1");
  }, "Same start and end cell");

  // --- No path (completely walled off) ---
  check(function () {
    var walls = emptyWalls(5);
    // Wall off row 2 completely
    for (var c = 0; c < 5; c++) {
      walls[2][c] = true;
    }
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === false, "Should not find path");
    assert(result.path === null, "Path should be null");
  }, "No path when end is walled off");

  // --- Start on wall ---
  check(function () {
    var walls = emptyWalls(5);
    walls[0][0] = true;
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === false, "No path when start is a wall");
    assertEqual(result.visitedCount, 0, "No cells visited");
  }, "Start on wall returns no path");

  // --- End on wall ---
  check(function () {
    var walls = emptyWalls(5);
    walls[4][4] = true;
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === false, "No path when end is a wall");
    assertEqual(result.visitedCount, 0, "No cells visited");
  }, "End on wall returns no path");

  // --- Invalid inputs: zero grid ---
  check(function () {
    var result = BFSAlgorithm.search({
      gridSize: 0,
      walls: [],
      start: [0, 0],
      end: [0, 0],
    });
    assert(result.found === false, "Empty grid returns no path");
    assertEqual(result.visitedCount, 0, "No cells visited");
  }, "Empty grid (size 0)");

  // --- Out-of-bounds start ---
  check(function () {
    var walls = emptyWalls(5);
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [-1, 0],
      end: [4, 4],
    });
    assert(result.found === false, "Out of bounds start");
  }, "Out-of-bounds start position");

  // --- Out-of-bounds end ---
  check(function () {
    var walls = emptyWalls(5);
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [0, 0],
      end: [5, 5],
    });
    assert(result.found === false, "Out of bounds end");
  }, "Out-of-bounds end position");

  // --- 1x1 grid ---
  check(function () {
    var walls = emptyWalls(1);
    var result = BFSAlgorithm.search({
      gridSize: 1,
      walls: walls,
      start: [0, 0],
      end: [0, 0],
    });
    assert(result.found === true, "1x1 same cell");
    assertEqual(result.path, [[0, 0]], "Path is the single cell");
  }, "1x1 grid: start == end");

  // --- Adjacent cells ---
  check(function () {
    var walls = emptyWalls(5);
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [0, 0],
      end: [0, 1],
    });
    assert(result.found === true, "Adjacent cells found");
    assertEqual(result.path.length, 2, "Path is 2 cells");
  }, "Adjacent start and end");

  // --- Snapshot structure ---
  check(function () {
    var walls = emptyWalls(3);
    var result = BFSAlgorithm.search({
      gridSize: 3,
      walls: walls,
      start: [0, 0],
      end: [2, 2],
    });
    assert(result.snapshots.length > 0, "Has snapshots");
    var snap = result.snapshots[0];
    assert(Array.isArray(snap.frontier), "Snapshot has frontier array");
    assert(Array.isArray(snap.visited), "Snapshot has visited array");
    assert(Array.isArray(snap.queue), "Snapshot has queue array");
    assert(typeof snap.found === "boolean", "Snapshot has found boolean");
  }, "Snapshot structure is correct");

  // --- Path is contiguous (each step is adjacent) ---
  check(function () {
    var walls = emptyWalls(5);
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === true, "Path found");
    for (var i = 1; i < result.path.length; i++) {
      var dr = Math.abs(result.path[i][0] - result.path[i - 1][0]);
      var dc = Math.abs(result.path[i][1] - result.path[i - 1][1]);
      assert(
        dr + dc === 1,
        "Step " + i + " is adjacent: dr=" + dr + " dc=" + dc,
      );
    }
  }, "Path is contiguous (each step adjacent)");

  // --- Large grid (20x20) doesn't hang ---
  check(function () {
    var walls = emptyWalls(20);
    var result = BFSAlgorithm.search({
      gridSize: 20,
      walls: walls,
      start: [0, 0],
      end: [19, 19],
    });
    assert(result.found === true, "Finds path on 20x20");
    assert(result.snapshots.length > 0, "Has snapshots");
    // BFS shortest path on 20x20: Manhattan distance = 38
    assertEqual(result.path.length, 39, "Shortest path on 20x20 is 39 cells");
  }, "Large grid (20x20) completes without hanging");

  // --- Maze with single solution path ---
  check(function () {
    // 3x3 maze:
    // S . .
    // # # .
    // . . E
    var walls = emptyWalls(3);
    walls[1][0] = true;
    walls[1][1] = true;
    var result = BFSAlgorithm.search({
      gridSize: 3,
      walls: walls,
      start: [0, 0],
      end: [2, 2],
    });
    assert(result.found === true, "Finds path through maze");
    // Path must go through (0,2) and (1,2) to reach (2,2)
    var pathKeys = result.path.map(function (p) {
      return p[0] + "," + p[1];
    });
    assert(pathKeys.indexOf("0,2") >= 0, "Path goes through (0,2)");
    assert(pathKeys.indexOf("1,2") >= 0, "Path goes through (1,2)");
  }, "Maze with single solution path");

  // --- No path to isolated end cell ---
  check(function () {
    var walls = emptyWalls(5);
    // Surround (4,4) with walls
    walls[3][3] = true;
    walls[3][4] = true;
    walls[4][3] = true;
    var result = BFSAlgorithm.search({
      gridSize: 5,
      walls: walls,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === false, "No path to isolated cell");
    assert(result.path === null, "Path is null");
  }, "No path to isolated end cell");

  // --- All duplicates: all walls ---
  check(function () {
    var size = 5;
    var walls = [];
    for (var r = 0; r < size; r++) {
      walls[r] = [];
      for (var c = 0; c < size; c++) {
        walls[r][c] = true;
      }
    }
    var result = BFSAlgorithm.search({
      gridSize: size,
      walls: walls,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === false, "All walls, no path");
    assertEqual(result.visitedCount, 0, "No cells visited");
  }, "All walls: no path possible");

  return { passed, failed, failures };
}

module.exports = { runTests };
