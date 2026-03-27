/**
 * Convex Hull Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var ConvexHullAlgorithm = require("./convex-hull-algorithm.js");

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

  // --- Helper: sort hull points for comparison (order-independent) ---
  function sortPoints(pts) {
    return pts.slice().sort(function (a, b) {
      return a.x - b.x || a.y - b.y;
    });
  }

  // --- Empty input ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([]);
    assertEqual(result.hull, [], "Empty hull");
    assert(result.pivot === null, "No pivot");
    assertEqual(result.pivotIndex, -1, "No pivot index");
    assert(result.steps.length >= 1, "At least done step");
    assertEqual(
      result.steps[result.steps.length - 1].type,
      "done",
      "Last step is done",
    );
  }, "Empty input: no points");

  // --- Single point ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([{ x: 5, y: 3 }]);
    assertEqual(result.hull.length, 1, "Hull has 1 point");
    assertEqual(result.hull[0].x, 5, "Hull point x");
    assertEqual(result.hull[0].y, 3, "Hull point y");
    assertEqual(result.pivot.x, 5, "Pivot x");
    assertEqual(result.pivot.y, 3, "Pivot y");
    assertEqual(result.pivotIndex, 0, "Pivot index");
  }, "Single point");

  // --- Two points ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
    assertEqual(result.hull.length, 2, "Hull has 2 points");
    var sorted = sortPoints(result.hull);
    assertEqual(sorted[0].x, 0, "First point x");
    assertEqual(sorted[1].x, 5, "Second point x");
  }, "Two points: line segment");

  // --- Triangle ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 2, y: 4 },
    ]);
    assertEqual(result.hull.length, 3, "Hull has 3 points");
    // Pivot should be lowest-y point (y=0, leftmost x=0)
    assertEqual(result.pivot.x, 0, "Pivot x");
    assertEqual(result.pivot.y, 0, "Pivot y");
  }, "Triangle: all points on hull");

  // --- Square with interior point ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
      { x: 2, y: 2 }, // interior
    ]);
    assertEqual(result.hull.length, 4, "Hull has 4 points (square)");
    // Interior point should be discarded
    var lastStep = result.steps[result.steps.length - 1];
    assert(lastStep.discarded.length >= 1, "At least 1 discarded point");
  }, "Square with interior point");

  // --- Collinear points ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    // All collinear: hull should be the two extreme points
    assert(result.hull.length <= 2, "Collinear hull has at most 2 points");
    assert(result.hull.length >= 1, "Collinear hull has at least 1 point");
  }, "Collinear points: line");

  // --- All same point ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 3, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 3 },
    ]);
    assertEqual(result.hull.length, 1, "All same point: hull = 1");
    assertEqual(result.hull[0].x, 3, "Hull point x");
    assertEqual(result.hull[0].y, 3, "Hull point y");
  }, "All same point");

  // --- Large set (50+ points) ---
  check(function () {
    var points = [];
    for (var i = 0; i < 60; i++) {
      points.push({
        x: Math.cos((2 * Math.PI * i) / 60) * 100,
        y: Math.sin((2 * Math.PI * i) / 60) * 100,
      });
    }
    var result = ConvexHullAlgorithm.grahamScan(points);
    // Circle: all points should be on hull
    assertEqual(result.hull.length, 60, "All 60 points on circular hull");
    assert(result.steps.length > 0, "Has steps");
  }, "Large set: 60 points in circle");

  // --- Large set with interior points ---
  check(function () {
    // Box corners + interior points
    var points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    // Add 50 interior points
    for (var i = 0; i < 50; i++) {
      points.push({
        x: 1 + Math.floor((i * 7) % 8),
        y: 1 + Math.floor((i * 3) % 8),
      });
    }
    var result = ConvexHullAlgorithm.grahamScan(points);
    assertEqual(result.hull.length, 4, "Box hull has 4 corners");
    var lastStep = result.steps[result.steps.length - 1];
    assert(lastStep.discarded.length > 0, "Interior points discarded");
  }, "Large set: 54 points, 4 on hull, 50 interior");

  // --- Input immutability ---
  check(function () {
    var input = [
      { x: 3, y: 1 },
      { x: 1, y: 5 },
      { x: 7, y: 2 },
    ];
    var original = JSON.parse(JSON.stringify(input));
    ConvexHullAlgorithm.grahamScan(input);
    assertEqual(input, original, "Input not mutated");
  }, "Input array is not mutated");

  // --- Step structure ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 2, y: 4 },
      { x: 2, y: 1 }, // interior
    ]);
    var step = result.steps[0];
    assert(typeof step.type === "string", "Step has type");
    assert(Array.isArray(step.stack), "Step has stack");
    assert(typeof step.currentPoint === "number", "Step has currentPoint");
    assert(Array.isArray(step.discarded), "Step has discarded");
    assert(typeof step.explanation === "string", "Step has explanation");
    assert(typeof step.pointsProcessed === "number", "Step has pointsProcessed");
    assert(typeof step.hullSize === "number", "Step has hullSize");
  }, "Step object structure");

  // --- Final step is done ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 2, y: 4 },
    ]);
    var lastStep = result.steps[result.steps.length - 1];
    assertEqual(lastStep.type, "done", "Last step type is done");
    assertEqual(lastStep.currentPoint, -1, "Done step currentPoint = -1");
  }, "Final step is done marker");

  // --- Pivot selection: lowest y, then leftmost x ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 5, y: 3 },
      { x: 2, y: 1 },
      { x: 8, y: 1 },
      { x: 4, y: 6 },
    ]);
    assertEqual(result.pivot.x, 2, "Pivot x = leftmost of lowest y");
    assertEqual(result.pivot.y, 1, "Pivot y = lowest");
    assertEqual(result.pivotIndex, 1, "Pivot index");
  }, "Pivot: lowest y, leftmost x tiebreaker");

  // --- Cross product helper ---
  check(function () {
    // Counter-clockwise: positive
    var ccw = ConvexHullAlgorithm.cross(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    );
    assert(ccw > 0, "CCW should be positive");

    // Clockwise: negative
    var cw = ConvexHullAlgorithm.cross(
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    );
    assert(cw < 0, "CW should be negative");

    // Collinear: zero
    var col = ConvexHullAlgorithm.cross(
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    );
    assertEqual(col, 0, "Collinear should be zero");
  }, "Cross product: CCW, CW, collinear");

  // --- Pentagon (all on hull) ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 5, y: 0 },
      { x: 10, y: 4 },
      { x: 8, y: 10 },
      { x: 2, y: 10 },
      { x: 0, y: 4 },
    ]);
    assertEqual(result.hull.length, 5, "Pentagon: all 5 on hull");
  }, "Pentagon: all points on hull");

  // --- Duplicate points mixed in ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 0 },
      { x: 2, y: 4 },
      { x: 2, y: 4 },
    ]);
    // Should handle gracefully — hull is the triangle
    assertEqual(result.hull.length, 3, "Duplicates: triangle hull");
  }, "Duplicate points: handled gracefully");

  // --- Sorted points returned ---
  check(function () {
    var result = ConvexHullAlgorithm.grahamScan([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 2, y: 4 },
    ]);
    assert(Array.isArray(result.sortedPoints), "Has sortedPoints");
    assert(Array.isArray(result.sortedIndices), "Has sortedIndices");
    assert(result.sortedPoints.length > 0, "sortedPoints not empty");
    assertEqual(
      result.sortedIndices[0],
      result.pivotIndex,
      "First sorted index is pivot",
    );
  }, "sortedPoints and sortedIndices returned");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests };
