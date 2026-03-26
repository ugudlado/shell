/**
 * A* Pathfinding Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Covers: basic pathfinding, wall avoidance, no path, start==end, single cell,
 * empty grid, large grid, Manhattan heuristic, Euclidean heuristic, f=g+h invariant,
 * open/closed set correctness, snapshot structure, BFS comparison, optimality.
 */

function runTests({ assert, assertEqual }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var AStarAlgorithm = require("./astar-algorithm.js");

  function check(fn, name) {
    try {
      fn();
      passed++;
      console.log("  PASS: " + name);
    } catch (e) {
      failed++;
      failures.push({ name: name, message: e.message });
      console.log("  FAIL: " + name + " — " + e.message);
    }
  }

  // Helper: create key from row,col
  function k(r, c) {
    return r + "," + c;
  }

  // --- 1. Basic path on empty grid ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: [] },
      start: [0, 0],
      end: [4, 4],
      heuristic: "manhattan",
    });
    assert(result.path !== null, "Path should exist on empty grid");
    assert(result.path.length === 9, "Shortest path on 5x5 from (0,0) to (4,4) is 9 cells (8 steps)");
    assert(result.path[0][0] === 0 && result.path[0][1] === 0, "Path starts at (0,0)");
    assert(result.path[8][0] === 4 && result.path[8][1] === 4, "Path ends at (4,4)");
    assert(result.error === null, "No error");
  }, "Basic: shortest path on empty 5x5 grid");

  // --- 2. Wall avoidance ---
  check(function () {
    // Walls create S-shaped corridor forcing zigzag detour:
    // S . . . .
    // W W W . .
    // . . . . W
    // . W W W W
    // . . . . E
    var walls = [
      [1, 0], [1, 1], [1, 2],
      [2, 4],
      [3, 1], [3, 2], [3, 3], [3, 4],
    ];
    var result = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: walls },
      start: [0, 0],
      end: [4, 4],
      heuristic: "manhattan",
    });
    assert(result.path !== null, "Path should exist around walls");
    assert(result.path.length > 9, "Zigzag path is longer than direct 9-cell path");
    // Verify no path cell is a wall
    for (var i = 0; i < result.path.length; i++) {
      var isWall = false;
      for (var w = 0; w < walls.length; w++) {
        if (result.path[i][0] === walls[w][0] && result.path[i][1] === walls[w][1]) {
          isWall = true;
        }
      }
      assert(!isWall, "Path cell " + i + " should not be a wall");
    }
    // BFS on same grid should give same length (optimality check)
    var bfsResult = AStarAlgorithm.runBFS({
      grid: { rows: 5, cols: 5, walls: walls },
      start: [0, 0],
      end: [4, 4],
    });
    assert(
      result.path.length === bfsResult.path.length,
      "A* path length equals BFS path length (both optimal)"
    );
  }, "Wall avoidance: path goes around walls, matches BFS");

  // --- 3. No path possible ---
  check(function () {
    // End completely surrounded by walls
    var walls = [[3, 3], [3, 4], [4, 3]];
    var result = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: walls },
      start: [0, 0],
      end: [4, 4],
      heuristic: "manhattan",
    });
    assert(result.path === null, "No path when end is blocked");
    assert(result.explored > 0, "Some cells were still explored");
  }, "No path: end cell surrounded by walls");

  // --- 4. Start equals end ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: [] },
      start: [2, 2],
      end: [2, 2],
      heuristic: "manhattan",
    });
    assert(result.path !== null, "Path exists when start==end");
    assert(result.path.length === 1, "Path has exactly 1 cell");
    assert(result.path[0][0] === 2 && result.path[0][1] === 2, "Path is just the start/end cell");
    assert(result.pathLength === 0, "Path length is 0");
  }, "Start == End: immediate result");

  // --- 5. Single cell grid (1x1) ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 1, cols: 1, walls: [] },
      start: [0, 0],
      end: [0, 0],
      heuristic: "manhattan",
    });
    assert(result.path !== null, "Path exists on 1x1 grid");
    assert(result.path.length === 1, "Path is single cell");
    assert(result.pathLength === 0, "Path length is 0");
  }, "Single cell grid (1x1)");

  // --- 6. Empty grid (0x0) ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 0, cols: 0, walls: [] },
      start: [0, 0],
      end: [0, 0],
      heuristic: "manhattan",
    });
    assert(result.path === null, "No path on empty grid");
    assert(result.snapshots.length === 0, "No snapshots on empty grid");
    assert(result.explored === 0, "No cells explored on empty grid");
  }, "Empty grid (0x0): graceful empty result");

  // --- 7. Large grid (25x25) completes ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 25, cols: 25, walls: [] },
      start: [0, 0],
      end: [24, 24],
      heuristic: "manhattan",
    });
    assert(result.path !== null, "Path found on 25x25 grid");
    assert(result.path.length === 49, "Shortest path is 49 cells (48 steps)");
    assert(result.error === null, "No error on large grid");
  }, "Large grid (25x25) completes correctly");

  // --- 8. Manhattan heuristic values ---
  check(function () {
    var h = AStarAlgorithm.heuristics.manhattan;
    assert(h(0, 0, 4, 4) === 8, "Manhattan (0,0) to (4,4) = 8");
    assert(h(3, 3, 3, 3) === 0, "Manhattan same cell = 0");
    assert(h(0, 0, 0, 5) === 5, "Manhattan horizontal = 5");
    assert(h(0, 0, 5, 0) === 5, "Manhattan vertical = 5");
  }, "Manhattan heuristic computes |dx|+|dy|");

  // --- 9. Euclidean heuristic values ---
  check(function () {
    var h = AStarAlgorithm.heuristics.euclidean;
    var val = h(0, 0, 3, 4);
    assert(Math.abs(val - 5) < 0.001, "Euclidean (0,0) to (3,4) = 5");
    assert(h(0, 0, 0, 0) === 0, "Euclidean same cell = 0");
    var diag = h(0, 0, 1, 1);
    assert(Math.abs(diag - Math.SQRT2) < 0.001, "Euclidean (0,0) to (1,1) = sqrt(2)");
  }, "Euclidean heuristic computes sqrt(dx^2+dy^2)");

  // --- 10. f = g + h invariant ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: [] },
      start: [0, 0],
      end: [4, 4],
      heuristic: "manhattan",
    });
    assert(result.snapshots.length > 0, "Has snapshots");
    for (var s = 0; s < result.snapshots.length; s++) {
      var snap = result.snapshots[s];
      var costs = snap.costs;
      for (var key in costs) {
        if (costs.hasOwnProperty(key)) {
          var c = costs[key];
          assert(
            Math.abs(c.f - (c.g + c.h)) < 0.001,
            "f = g + h for cell " + key + " at snapshot " + s +
              " (f=" + c.f + ", g=" + c.g + ", h=" + c.h + ")"
          );
        }
      }
    }
  }, "f = g + h invariant holds for all cells in all snapshots");

  // --- 11. Open/closed set correctness ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: [] },
      start: [0, 0],
      end: [4, 4],
      heuristic: "manhattan",
    });
    // In the last snapshot, check that closed set nodes are not in open set
    var lastSnap = result.snapshots[result.snapshots.length - 1];
    var openKeys = {};
    for (var i = 0; i < lastSnap.openSet.length; i++) {
      openKeys[k(lastSnap.openSet[i][0], lastSnap.openSet[i][1])] = true;
    }
    for (var j = 0; j < lastSnap.closedSet.length; j++) {
      var ck = k(lastSnap.closedSet[j][0], lastSnap.closedSet[j][1]);
      assert(!openKeys[ck], "Closed set node " + ck + " should not be in open set");
    }
  }, "Open/closed sets are disjoint");

  // --- 12. Snapshot structure ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 3, cols: 3, walls: [] },
      start: [0, 0],
      end: [2, 2],
      heuristic: "manhattan",
    });
    assert(result.snapshots.length > 0, "Has snapshots");
    var snap = result.snapshots[0];
    assert(Array.isArray(snap.current), "Snapshot has current as array");
    assert(snap.current.length === 2, "Current is [r,c]");
    assert(Array.isArray(snap.openSet), "Snapshot has openSet array");
    assert(Array.isArray(snap.closedSet), "Snapshot has closedSet array");
    assert(typeof snap.costs === "object", "Snapshot has costs object");
  }, "Snapshot structure has required fields");

  // --- 13. Optimal path with Manhattan on 4-dir grid ---
  check(function () {
    // On a 4-directional grid, Manhattan is admissible and consistent,
    // so A* with Manhattan must find the true shortest path.
    // Compare against BFS which always finds shortest path.
    var walls = [[1, 1], [1, 2], [2, 1]];
    var astarResult = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: walls },
      start: [0, 0],
      end: [4, 4],
      heuristic: "manhattan",
    });
    var bfsResult = AStarAlgorithm.runBFS({
      grid: { rows: 5, cols: 5, walls: walls },
      start: [0, 0],
      end: [4, 4],
    });
    assert(astarResult.path !== null, "A* finds path");
    assert(bfsResult.path !== null, "BFS finds path");
    assert(
      astarResult.path.length === bfsResult.path.length,
      "A* path length (" + astarResult.path.length + ") equals BFS path length (" + bfsResult.path.length + ")"
    );
  }, "A* with Manhattan finds optimal path (same length as BFS)");

  // --- 14. BFS comparison: A* explores fewer cells ---
  check(function () {
    // On a guided search toward a distant goal, A* should explore fewer cells
    var result = AStarAlgorithm.run({
      grid: { rows: 15, cols: 15, walls: [] },
      start: [0, 0],
      end: [14, 14],
      heuristic: "manhattan",
    });
    var bfsResult = AStarAlgorithm.runBFS({
      grid: { rows: 15, cols: 15, walls: [] },
      start: [0, 0],
      end: [14, 14],
    });
    assert(result.explored < bfsResult.explored,
      "A* explored (" + result.explored + ") fewer cells than BFS (" + bfsResult.explored + ")"
    );
  }, "A* explores fewer cells than BFS on open grid");

  // --- 15. Movement is 4-directional only ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 3, cols: 3, walls: [] },
      start: [0, 0],
      end: [2, 2],
      heuristic: "manhattan",
    });
    assert(result.path !== null, "Path exists");
    // Each step in path should differ by exactly 1 in either row or col, not both
    for (var i = 1; i < result.path.length; i++) {
      var dr = Math.abs(result.path[i][0] - result.path[i - 1][0]);
      var dc = Math.abs(result.path[i][1] - result.path[i - 1][1]);
      assert(
        (dr === 1 && dc === 0) || (dr === 0 && dc === 1),
        "Step " + i + " is 4-directional: dr=" + dr + " dc=" + dc
      );
    }
  }, "Movement is 4-directional only (no diagonals)");

  // --- 16. Euclidean heuristic still finds valid path ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: [[1, 1], [1, 2]] },
      start: [0, 0],
      end: [4, 4],
      heuristic: "euclidean",
    });
    assert(result.path !== null, "Euclidean finds a path");
    assert(result.path[0][0] === 0 && result.path[0][1] === 0, "Starts at (0,0)");
    var last = result.path[result.path.length - 1];
    assert(last[0] === 4 && last[1] === 4, "Ends at (4,4)");
  }, "Euclidean heuristic finds valid path");

  // --- 17. Start on wall returns no path ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 3, cols: 3, walls: [[0, 0]] },
      start: [0, 0],
      end: [2, 2],
      heuristic: "manhattan",
    });
    assert(result.path === null, "No path when start is on a wall");
  }, "Start on wall: no path");

  // --- 18. End on wall returns no path ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 3, cols: 3, walls: [[2, 2]] },
      start: [0, 0],
      end: [2, 2],
      heuristic: "manhattan",
    });
    assert(result.path === null, "No path when end is on a wall");
  }, "End on wall: no path");

  // --- 19. Out of bounds start/end ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 3, cols: 3, walls: [] },
      start: [-1, 0],
      end: [2, 2],
      heuristic: "manhattan",
    });
    assert(result.error !== null, "Error for out-of-bounds start");
    assert(result.path === null, "No path for invalid start");
  }, "Out of bounds start returns error");

  // --- 20. BFS snapshot structure ---
  check(function () {
    var result = AStarAlgorithm.runBFS({
      grid: { rows: 3, cols: 3, walls: [] },
      start: [0, 0],
      end: [2, 2],
    });
    assert(result.path !== null, "BFS finds path");
    assert(result.snapshots.length > 0, "BFS has snapshots");
    assert(result.explored > 0, "BFS explored cells");
    var snap = result.snapshots[0];
    assert(Array.isArray(snap.current), "BFS snapshot has current");
    assert(Array.isArray(snap.openSet), "BFS snapshot has openSet (frontier)");
    assert(Array.isArray(snap.closedSet), "BFS snapshot has closedSet (visited)");
  }, "BFS returns same snapshot structure as A*");

  // --- 21. g values increase along path ---
  check(function () {
    var result = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: [] },
      start: [0, 0],
      end: [4, 4],
      heuristic: "manhattan",
    });
    // Get final costs from last snapshot
    var lastSnap = result.snapshots[result.snapshots.length - 1];
    for (var i = 1; i < result.path.length; i++) {
      var prevKey = k(result.path[i - 1][0], result.path[i - 1][1]);
      var currKey = k(result.path[i][0], result.path[i][1]);
      var prevG = lastSnap.costs[prevKey].g;
      var currG = lastSnap.costs[currKey].g;
      assert(currG === prevG + 1, "g increases by 1 along path at step " + i);
    }
  }, "g values increase by 1 along the path");

  // --- 22. All walls blocked (adversarial) ---
  check(function () {
    var walls = [];
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        if (!(r === 0 && c === 0) && !(r === 4 && c === 4)) {
          walls.push([r, c]);
        }
      }
    }
    var result = AStarAlgorithm.run({
      grid: { rows: 5, cols: 5, walls: walls },
      start: [0, 0],
      end: [4, 4],
      heuristic: "manhattan",
    });
    assert(result.path === null, "No path when all cells except start/end are walls");
  }, "All cells walled except start/end: no path");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests };
