/**
 * Convex Hull Algorithm — Graham Scan
 *
 * Pure functions — no DOM dependency.
 * Computes convex hull using Graham Scan with step recording for visualization.
 */
var ConvexHullAlgorithm = (() => {
  "use strict";

  /**
   * Cross product of vectors OA and OB where O is origin point.
   * Returns positive if counter-clockwise (left turn),
   * negative if clockwise (right turn), 0 if collinear.
   *
   * @param {{x: number, y: number}} O
   * @param {{x: number, y: number}} A
   * @param {{x: number, y: number}} B
   * @returns {number}
   */
  function cross(O, A, B) {
    return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
  }

  /**
   * Squared distance between two points.
   * @param {{x: number, y: number}} a
   * @param {{x: number, y: number}} b
   * @returns {number}
   */
  function distSq(a, b) {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
  }

  /**
   * Polar angle of point relative to pivot (using atan2).
   * @param {{x: number, y: number}} pivot
   * @param {{x: number, y: number}} point
   * @returns {number}
   */
  function polarAngle(pivot, point) {
    return Math.atan2(point.y - pivot.y, point.x - pivot.x);
  }

  /**
   * Run Graham Scan on a set of points, recording each step for animation.
   *
   * @param {Array<{x: number, y: number}>} inputPoints
   * @returns {{
   *   steps: Array<{type: string, stack: number[], currentPoint: number, discarded: number[], explanation: string, pointsProcessed: number, hullSize: number}>,
   *   hull: Array<{x: number, y: number}>,
   *   pivot: {x: number, y: number}|null,
   *   pivotIndex: number,
   *   sortedPoints: Array<{x: number, y: number}>,
   *   sortedIndices: number[]
   * }}
   */
  function grahamScan(inputPoints) {
    var points = [];
    var i;
    for (i = 0; i < inputPoints.length; i++) {
      points.push({ x: inputPoints[i].x, y: inputPoints[i].y });
    }

    var steps = [];
    var discarded = [];

    // --- Edge cases ---
    if (points.length === 0) {
      steps.push({
        type: "done",
        stack: [],
        currentPoint: -1,
        discarded: [],
        explanation: "No points to process.",
        pointsProcessed: 0,
        hullSize: 0,
      });
      return {
        steps: steps,
        hull: [],
        pivot: null,
        pivotIndex: -1,
        sortedPoints: [],
        sortedIndices: [],
      };
    }

    if (points.length === 1) {
      steps.push({
        type: "pivot",
        stack: [0],
        currentPoint: 0,
        discarded: [],
        explanation: "Only one point — it is the hull.",
        pointsProcessed: 1,
        hullSize: 1,
      });
      steps.push({
        type: "done",
        stack: [0],
        currentPoint: -1,
        discarded: [],
        explanation: "Hull complete: 1 point.",
        pointsProcessed: 1,
        hullSize: 1,
      });
      return {
        steps: steps,
        hull: [points[0]],
        pivot: points[0],
        pivotIndex: 0,
        sortedPoints: [points[0]],
        sortedIndices: [0],
      };
    }

    if (points.length === 2) {
      steps.push({
        type: "pivot",
        stack: [0],
        currentPoint: 0,
        discarded: [],
        explanation:
          "Pivot: point 0 (" + points[0].x + ", " + points[0].y + ")",
        pointsProcessed: 1,
        hullSize: 1,
      });
      steps.push({
        type: "push",
        stack: [0, 1],
        currentPoint: 1,
        discarded: [],
        explanation: "Two points form a line segment.",
        pointsProcessed: 2,
        hullSize: 2,
      });
      steps.push({
        type: "done",
        stack: [0, 1],
        currentPoint: -1,
        discarded: [],
        explanation: "Hull complete: 2 points (line segment).",
        pointsProcessed: 2,
        hullSize: 2,
      });

      // Find actual pivot (lowest y, then leftmost x)
      var p2pivot = 0;
      if (
        points[1].y < points[0].y ||
        (points[1].y === points[0].y && points[1].x < points[0].x)
      ) {
        p2pivot = 1;
      }
      var p2other = p2pivot === 0 ? 1 : 0;
      return {
        steps: steps,
        hull: [points[p2pivot], points[p2other]],
        pivot: points[p2pivot],
        pivotIndex: p2pivot,
        sortedPoints: [points[p2pivot], points[p2other]],
        sortedIndices: [p2pivot, p2other],
      };
    }

    // --- Find pivot: lowest y, then leftmost x ---
    var pivotIdx = 0;
    for (i = 1; i < points.length; i++) {
      if (
        points[i].y < points[pivotIdx].y ||
        (points[i].y === points[pivotIdx].y &&
          points[i].x < points[pivotIdx].x)
      ) {
        pivotIdx = i;
      }
    }

    var pivot = points[pivotIdx];

    steps.push({
      type: "pivot",
      stack: [pivotIdx],
      currentPoint: pivotIdx,
      discarded: [],
      explanation:
        "Pivot selected: point " +
        pivotIdx +
        " (" +
        pivot.x +
        ", " +
        pivot.y +
        ") — lowest y-coordinate.",
      pointsProcessed: 1,
      hullSize: 1,
    });

    // --- Build index array for sorting (exclude pivot) ---
    var indices = [];
    for (i = 0; i < points.length; i++) {
      if (i !== pivotIdx) {
        indices.push(i);
      }
    }

    // --- Polar angle sort ---
    indices.sort(function (a, b) {
      var angleA = polarAngle(pivot, points[a]);
      var angleB = polarAngle(pivot, points[b]);
      if (angleA !== angleB) {
        return angleA - angleB;
      }
      // Same angle: sort by distance (closer first)
      return distSq(pivot, points[a]) - distSq(pivot, points[b]);
    });

    // Remove points coincident with pivot (distance = 0)
    var nonCoincident = [];
    for (i = 0; i < indices.length; i++) {
      if (distSq(pivot, points[indices[i]]) === 0) {
        discarded.push(indices[i]);
      } else {
        nonCoincident.push(indices[i]);
      }
    }
    indices = nonCoincident;

    // Remove collinear points with same angle — keep farthest, discard closer
    var filtered = [];
    for (i = 0; i < indices.length; i++) {
      // While next point has same angle, skip to farthest
      while (
        i < indices.length - 1 &&
        polarAngle(pivot, points[indices[i]]) ===
          polarAngle(pivot, points[indices[i + 1]])
      ) {
        discarded.push(indices[i]);
        i++;
      }
      filtered.push(indices[i]);
    }
    indices = filtered;

    // Build sorted indices array (pivot first)
    var sortedIndices = [pivotIdx];
    for (i = 0; i < indices.length; i++) {
      sortedIndices.push(indices[i]);
    }

    var sortedPoints = [];
    for (i = 0; i < sortedIndices.length; i++) {
      sortedPoints.push(points[sortedIndices[i]]);
    }

    steps.push({
      type: "sort",
      stack: [pivotIdx],
      currentPoint: -1,
      discarded: [],
      explanation:
        "Points sorted by polar angle from pivot. " +
        sortedIndices.length +
        " points in sorted order.",
      pointsProcessed: 1,
      hullSize: 1,
    });

    // --- Check if all points are collinear after filtering ---
    if (indices.length === 0) {
      // All points are the same as pivot
      steps.push({
        type: "done",
        stack: [pivotIdx],
        currentPoint: -1,
        discarded: [],
        explanation: "All points are identical. Hull is a single point.",
        pointsProcessed: points.length,
        hullSize: 1,
      });
      return {
        steps: steps,
        hull: [pivot],
        pivot: pivot,
        pivotIndex: pivotIdx,
        sortedPoints: sortedPoints,
        sortedIndices: sortedIndices,
      };
    }

    if (indices.length === 1) {
      steps.push({
        type: "push",
        stack: [pivotIdx, indices[0]],
        currentPoint: indices[0],
        discarded: [],
        explanation: "Only one other unique direction. Hull is a line segment.",
        pointsProcessed: 2,
        hullSize: 2,
      });
      steps.push({
        type: "done",
        stack: [pivotIdx, indices[0]],
        currentPoint: -1,
        discarded: [],
        explanation: "Hull complete: 2 points (line segment).",
        pointsProcessed: points.length,
        hullSize: 2,
      });
      return {
        steps: steps,
        hull: [pivot, points[indices[0]]],
        pivot: pivot,
        pivotIndex: pivotIdx,
        sortedPoints: sortedPoints,
        sortedIndices: sortedIndices,
      };
    }

    // --- Graham Scan: stack-based hull construction ---
    var stack = [pivotIdx, indices[0], indices[1]];
    var pointsProcessed = 3;

    steps.push({
      type: "push",
      stack: stack.slice(),
      currentPoint: indices[0],
      discarded: discarded.slice(),
      explanation:
        "Push first sorted point " +
        indices[0] +
        " onto hull stack.",
      pointsProcessed: 2,
      hullSize: 2,
    });

    steps.push({
      type: "push",
      stack: stack.slice(),
      currentPoint: indices[1],
      discarded: discarded.slice(),
      explanation:
        "Push second sorted point " +
        indices[1] +
        " onto hull stack.",
      pointsProcessed: 3,
      hullSize: 3,
    });

    for (i = 2; i < indices.length; i++) {
      var ptIdx = indices[i];
      pointsProcessed++;

      // Test step — show what we're evaluating
      steps.push({
        type: "test",
        stack: stack.slice(),
        currentPoint: ptIdx,
        discarded: discarded.slice(),
        explanation:
          "Testing point " +
          ptIdx +
          " (" +
          points[ptIdx].x +
          ", " +
          points[ptIdx].y +
          ") — checking left turn.",
        pointsProcessed: pointsProcessed,
        hullSize: stack.length,
      });

      // While not a left turn, pop from stack
      while (
        stack.length > 1 &&
        cross(
          points[stack[stack.length - 2]],
          points[stack[stack.length - 1]],
          points[ptIdx]
        ) <= 0
      ) {
        var popped = stack.pop();
        discarded.push(popped);

        steps.push({
          type: "pop",
          stack: stack.slice(),
          currentPoint: ptIdx,
          discarded: discarded.slice(),
          explanation:
            "Right turn or collinear at point " +
            popped +
            " — removed from hull.",
          pointsProcessed: pointsProcessed,
          hullSize: stack.length,
        });
      }

      stack.push(ptIdx);

      steps.push({
        type: "push",
        stack: stack.slice(),
        currentPoint: ptIdx,
        discarded: discarded.slice(),
        explanation:
          "Left turn confirmed — point " +
          ptIdx +
          " added to hull.",
        pointsProcessed: pointsProcessed,
        hullSize: stack.length,
      });
    }

    // --- Done ---
    steps.push({
      type: "done",
      stack: stack.slice(),
      currentPoint: -1,
      discarded: discarded.slice(),
      explanation:
        "Hull complete! " +
        stack.length +
        " points on convex hull, " +
        discarded.length +
        " interior points discarded.",
      pointsProcessed: points.length,
      hullSize: stack.length,
    });

    var hull = [];
    for (i = 0; i < stack.length; i++) {
      hull.push(points[stack[i]]);
    }

    return {
      steps: steps,
      hull: hull,
      pivot: pivot,
      pivotIndex: pivotIdx,
      sortedPoints: sortedPoints,
      sortedIndices: sortedIndices,
    };
  }

  return { grahamScan: grahamScan, cross: cross, polarAngle: polarAngle };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = ConvexHullAlgorithm;
}
