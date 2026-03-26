/**
 * DFS Pathfinding Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const DFSAlgorithm = require("./dfs-algorithm.js");

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
    const w = [];
    for (let r = 0; r < size; r++) {
      w[r] = [];
      for (let c = 0; c < size; c++) {
        w[r][c] = false;
      }
    }
    return w;
  }

  // --- Basic pathfinding ---
  check(() => {
    const walls = emptyWalls(5);
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
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

  // --- Same start and end ---
  check(() => {
    const walls = emptyWalls(5);
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [2, 2],
      end: [2, 2],
    });
    assert(result.found === true, "Should find trivial path");
    assertEqual(result.path, [[2, 2]], "Path is just the one cell");
    assertEqual(result.snapshots.length, 1, "One snapshot for trivial case");
  }, "Same start and end cell");

  // --- No path (completely walled off) ---
  check(() => {
    const walls = emptyWalls(5);
    // Wall off row 2 completely
    for (let c = 0; c < 5; c++) {
      walls[2][c] = true;
    }
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === false, "Should not find path");
    assert(result.path === null, "Path should be null");
  }, "No path when end is walled off");

  // --- Start on wall ---
  check(() => {
    const walls = emptyWalls(5);
    walls[0][0] = true;
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === false, "No path when start is a wall");
    assertEqual(result.snapshots.length, 0, "No snapshots");
  }, "Start on wall returns no path");

  // --- End on wall ---
  check(() => {
    const walls = emptyWalls(5);
    walls[4][4] = true;
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === false, "No path when end is a wall");
    assertEqual(result.snapshots.length, 0, "No snapshots");
  }, "End on wall returns no path");

  // --- Invalid inputs ---
  check(() => {
    const result = DFSAlgorithm.search({
      walls: [],
      rows: 0,
      cols: 0,
      start: [0, 0],
      end: [0, 0],
    });
    assert(result.found === false, "Empty grid");
    assertEqual(result.snapshots.length, 0, "No snapshots for empty grid");
  }, "Empty grid (0x0)");

  check(() => {
    const walls = emptyWalls(5);
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [-1, 0],
      end: [4, 4],
    });
    assert(result.found === false, "Out of bounds start");
  }, "Out-of-bounds start position");

  check(() => {
    const walls = emptyWalls(5);
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [0, 0],
      end: [5, 5],
    });
    assert(result.found === false, "Out of bounds end");
  }, "Out-of-bounds end position");

  // --- 1x1 grid ---
  check(() => {
    const walls = emptyWalls(1);
    const result = DFSAlgorithm.search({
      walls,
      rows: 1,
      cols: 1,
      start: [0, 0],
      end: [0, 0],
    });
    assert(result.found === true, "1x1 same cell");
    assertEqual(result.path, [[0, 0]], "Path is the single cell");
  }, "1x1 grid: start == end");

  // --- Snapshot structure ---
  check(() => {
    const walls = emptyWalls(3);
    const result = DFSAlgorithm.search({
      walls,
      rows: 3,
      cols: 3,
      start: [0, 0],
      end: [2, 2],
    });
    assert(result.snapshots.length > 0, "Has snapshots");
    const snap = result.snapshots[0];
    assert(Array.isArray(snap.stack), "Snapshot has stack array");
    assert(Array.isArray(snap.visited), "Snapshot has visited array");
    assert(typeof snap.found === "boolean", "Snapshot has found boolean");
  }, "Snapshot structure is correct");

  // --- DFS explores depth-first (goes deep before backtracking) ---
  check(() => {
    // On a narrow corridor, DFS should explore straight through
    const walls = emptyWalls(5);
    // Wall off all but a narrow path: row 0 is clear
    for (let r = 1; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        walls[r][c] = true;
      }
    }
    // Open a path: (0,0)-(0,1)-(0,2)-(0,3)-(0,4)-(1,4)-(2,4)-(3,4)-(4,4)
    walls[1][4] = false;
    walls[2][4] = false;
    walls[3][4] = false;
    walls[4][4] = false;
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === true, "Finds path along corridor");
    assert(result.path.length > 0, "Path is non-empty");
  }, "DFS finds path through narrow corridor");

  // --- Adjacent cells ---
  check(() => {
    const walls = emptyWalls(5);
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [0, 0],
      end: [0, 1],
    });
    assert(result.found === true, "Adjacent cells found");
    assertEqual(result.path.length, 2, "Path is 2 cells");
  }, "Adjacent start and end");

  // --- Path is contiguous (each step is adjacent) ---
  check(() => {
    const walls = emptyWalls(5);
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === true, "Path found");
    for (let i = 1; i < result.path.length; i++) {
      const dr = Math.abs(result.path[i][0] - result.path[i - 1][0]);
      const dc = Math.abs(result.path[i][1] - result.path[i - 1][1]);
      assert(dr + dc === 1, "Step " + i + " is adjacent: dr=" + dr + " dc=" + dc);
    }
  }, "Path is contiguous (each step adjacent)");

  // --- Large grid (20x20) doesn't hang ---
  check(() => {
    const walls = emptyWalls(20);
    const result = DFSAlgorithm.search({
      walls,
      rows: 20,
      cols: 20,
      start: [0, 0],
      end: [19, 19],
    });
    assert(result.found === true, "Finds path on 20x20");
    assert(result.snapshots.length > 0, "Has snapshots");
  }, "Large grid (20x20) completes without hanging");

  // --- Maze with single solution path ---
  check(() => {
    // 3x3 maze:
    // S . .
    // # # .
    // . . E
    const walls = emptyWalls(3);
    walls[1][0] = true;
    walls[1][1] = true;
    const result = DFSAlgorithm.search({
      walls,
      rows: 3,
      cols: 3,
      start: [0, 0],
      end: [2, 2],
    });
    assert(result.found === true, "Finds path through maze");
    // Path must go through (0,2) and (1,2) to reach (2,2)
    const pathKeys = result.path.map((p) => p[0] + "," + p[1]);
    assert(pathKeys.indexOf("0,2") >= 0, "Path goes through (0,2)");
    assert(pathKeys.indexOf("1,2") >= 0, "Path goes through (1,2)");
  }, "Maze with single solution path");

  // --- No path at all (island) ---
  check(() => {
    const walls = emptyWalls(5);
    // Surround end with walls
    walls[3][3] = true;
    walls[3][4] = true;
    walls[4][3] = true;
    // End at (4,4), surround with walls on open sides
    // (4,4) neighbors: (3,4), (4,3) — both walled
    const result = DFSAlgorithm.search({
      walls,
      rows: 5,
      cols: 5,
      start: [0, 0],
      end: [4, 4],
    });
    assert(result.found === false, "No path to isolated cell");
    assert(result.path === null, "Path is null");
  }, "No path to isolated end cell");

  return { passed, failed, failures };
}

module.exports = { runTests };
