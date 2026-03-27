/**
 * Dijkstra's Shortest Path Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Covers: basic shortest path, single node, empty graph, disconnected nodes,
 * negative weights (rejected), cycles, self-loops, max bounds, large graphs.
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const DijkstraAlgorithm = require("./dijkstra-algorithm.js");

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

  // --- Basic shortest path ---
  check(() => {
    // A -1-> B -2-> C
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 2 },
      ],
      source: "A",
    });
    assert(result.distances["A"] === 0, "Distance to source is 0");
    assert(result.distances["B"] === 1, "Distance A->B is 1");
    assert(result.distances["C"] === 3, "Distance A->B->C is 3");
    assertEqual(result.path("C"), ["A", "B", "C"], "Shortest path A->C");
    assert(result.snapshots.length > 0, "Has snapshots");
  }, "Basic: linear graph A->B->C");

  // --- Choose shorter path ---
  check(() => {
    // A -10-> C, A -1-> B -2-> C (shorter)
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "C", weight: 10 },
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 2 },
      ],
      source: "A",
    });
    assert(result.distances["C"] === 3, "Shortest is 3 via B, not 10 direct");
    assertEqual(result.path("C"), ["A", "B", "C"], "Path goes through B");
  }, "Picks shorter path over direct expensive edge");

  // --- Single node graph ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["X"],
      edges: [],
      source: "X",
    });
    assert(result.distances["X"] === 0, "Distance to self is 0");
    assertEqual(result.path("X"), ["X"], "Path to self");
    assert(result.snapshots.length >= 1, "At least one snapshot");
  }, "Single node graph");

  // --- Empty graph ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: [],
      edges: [],
      source: "A",
    });
    assert(result.distances["A"] === undefined, "No distances for empty graph");
    assert(result.snapshots.length === 0, "No snapshots for empty graph");
  }, "Empty graph (no nodes)");

  // --- Disconnected node ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [{ from: "A", to: "B", weight: 5 }],
      source: "A",
    });
    assert(result.distances["A"] === 0, "Source distance is 0");
    assert(result.distances["B"] === 5, "B is reachable");
    assert(result.distances["C"] === Infinity, "C is unreachable");
    assertEqual(result.path("C"), null, "No path to disconnected node");
  }, "Disconnected node returns Infinity distance and null path");

  // --- Negative weight rejected ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B"],
      edges: [{ from: "A", to: "B", weight: -3 }],
      source: "A",
    });
    assert(result.error === "negative-weight", "Rejects negative weights");
    assert(result.snapshots.length === 0, "No snapshots on error");
  }, "Negative weight edge is rejected");

  // --- Self-loop ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B"],
      edges: [
        { from: "A", to: "A", weight: 5 },
        { from: "A", to: "B", weight: 3 },
      ],
      source: "A",
    });
    assert(
      result.distances["A"] === 0,
      "Self-loop does not change source distance",
    );
    assert(result.distances["B"] === 3, "B reachable despite self-loop");
  }, "Self-loop does not affect distances");

  // --- Cycle ---
  check(() => {
    // A -1-> B -2-> C -3-> A (cycle), A -10-> D
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B", weight: 1 },
        { from: "B", to: "C", weight: 2 },
        { from: "C", to: "A", weight: 3 },
        { from: "A", to: "D", weight: 10 },
      ],
      source: "A",
    });
    assert(result.distances["A"] === 0, "Source stays 0 despite cycle");
    assert(result.distances["B"] === 1, "B distance correct");
    assert(result.distances["C"] === 3, "C distance correct");
    assert(result.distances["D"] === 10, "D distance correct");
  }, "Graph with cycle computes correct distances");

  // --- Undirected edges (bidirectional) ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B", weight: 4 },
        { from: "B", to: "A", weight: 4 },
        { from: "B", to: "C", weight: 1 },
        { from: "C", to: "B", weight: 1 },
        { from: "A", to: "C", weight: 6 },
        { from: "C", to: "A", weight: 6 },
      ],
      source: "A",
    });
    assert(result.distances["C"] === 5, "A->B->C = 5 shorter than A->C = 6");
  }, "Bidirectional edges find shortest path");

  // --- Zero-weight edges ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B", weight: 0 },
        { from: "B", to: "C", weight: 0 },
      ],
      source: "A",
    });
    assert(result.distances["B"] === 0, "Zero-weight edge gives 0 distance");
    assert(
      result.distances["C"] === 0,
      "Two zero-weight edges give 0 distance",
    );
  }, "Zero-weight edges are valid");

  // --- Regression: zero-weight edge creates zero-cost shortest path ---
  check(() => {
    // Bug: UI blocked weight=0 input (min="1"), so users could not demonstrate
    // zero-cost shortest paths. This test verifies zero-weight edges produce
    // correct shortest paths when competing with positive-weight alternatives.
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B", weight: 0 },
        { from: "B", to: "C", weight: 3 },
        { from: "A", to: "C", weight: 5 },
      ],
      source: "A",
    });
    assert(result.error === null, "No error for zero-weight edge graph");
    assert(result.distances["B"] === 0, "Zero-weight edge: A->B distance is 0");
    assert(
      result.distances["C"] === 3,
      "Zero-cost path A->B(0)->C(3) = 3 beats direct A->C(5) = 5",
    );
    assertEqual(
      result.path("C"),
      ["A", "B", "C"],
      "Shortest path uses zero-weight edge",
    );
  }, "Regression: zero-weight edge enables zero-cost shortest path");

  // --- Regression: weight=0 boundary is accepted, weight=-1 is rejected ---
  check(() => {
    const zeroResult = DijkstraAlgorithm.run({
      nodes: ["A", "B"],
      edges: [{ from: "A", to: "B", weight: 0 }],
      source: "A",
    });
    assert(zeroResult.error === null, "Weight 0 is accepted (no error)");
    assert(zeroResult.distances["B"] === 0, "Weight 0 gives distance 0");

    const negResult = DijkstraAlgorithm.run({
      nodes: ["A", "B"],
      edges: [{ from: "A", to: "B", weight: -1 }],
      source: "A",
    });
    assert(
      negResult.error === "negative-weight",
      "Weight -1 is rejected as negative",
    );
  }, "Regression: weight=0 accepted at boundary, weight=-1 rejected");

  // --- Source not in nodes ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B"],
      edges: [{ from: "A", to: "B", weight: 1 }],
      source: "Z",
    });
    assert(
      Object.keys(result.distances).length === 0,
      "Empty distances object for invalid source",
    );
    assert(result.snapshots.length === 0, "No snapshots for invalid source");
    assert(result.error === null, "No error (graceful empty result)");
  }, "Source not in graph returns empty result");

  // --- Large graph (20+ nodes) completes ---
  check(() => {
    const nodes = [];
    const edges = [];
    for (let i = 0; i < 25; i++) {
      nodes.push("N" + i);
      if (i > 0) {
        edges.push({ from: "N" + (i - 1), to: "N" + i, weight: i });
      }
    }
    const result = DijkstraAlgorithm.run({
      nodes: nodes,
      edges: edges,
      source: "N0",
    });
    assert(result.distances["N0"] === 0, "Source distance 0");
    // N0->N1 = 1, N1->N2 = 2, total = 1+2+...+24 = 300
    assert(
      result.distances["N24"] === 300,
      "Distance to N24 is sum 1..24 = 300",
    );
  }, "Large graph (25 nodes) completes correctly");

  // --- Multiple shortest paths (any valid is fine) ---
  check(() => {
    // A -5-> B -5-> D, A -5-> C -5-> D (both equal distance 10)
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B", weight: 5 },
        { from: "A", to: "C", weight: 5 },
        { from: "B", to: "D", weight: 5 },
        { from: "C", to: "D", weight: 5 },
      ],
      source: "A",
    });
    assert(result.distances["D"] === 10, "Distance to D is 10");
    const p = result.path("D");
    assert(p !== null, "Path exists");
    assert(p.length === 3, "Path has 3 nodes");
    assert(p[0] === "A", "Starts at A");
    assert(p[2] === "D", "Ends at D");
  }, "Multiple equal-cost paths: returns one valid path");

  // --- Snapshot structure ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B"],
      edges: [{ from: "A", to: "B", weight: 3 }],
      source: "A",
    });
    assert(result.snapshots.length > 0, "Has snapshots");
    const snap = result.snapshots[0];
    assert(snap.current !== undefined, "Snapshot has current node");
    assert(typeof snap.distances === "object", "Snapshot has distances");
    assert(
      Array.isArray(snap.priorityQueue),
      "Snapshot has priorityQueue array",
    );
    assert(Array.isArray(snap.visited), "Snapshot has visited array");
  }, "Snapshot structure is correct for visualization");

  // --- Edge weight bounds (max weight 999) ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B"],
      edges: [{ from: "A", to: "B", weight: 1000 }],
      source: "A",
    });
    assert(
      result.error === "weight-exceeds-max",
      "Weight > 999 returns weight-exceeds-max error",
    );
    assert(result.snapshots.length === 0, "No snapshots on weight error");
    assert(
      Object.keys(result.distances).length === 0,
      "No distances on weight error",
    );
  }, "Edge weight exceeding max (>999) is rejected");

  // --- Path reconstruction with predecessor ---
  check(() => {
    // A -2-> B -3-> C -1-> D
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B", weight: 2 },
        { from: "B", to: "C", weight: 3 },
        { from: "C", to: "D", weight: 1 },
      ],
      source: "A",
    });
    assertEqual(result.path("D"), ["A", "B", "C", "D"], "Full path A->B->C->D");
    assert(result.distances["D"] === 6, "Total distance 2+3+1=6");
  }, "Path reconstruction through multiple hops");

  // --- Dense graph (all nodes connected) ---
  check(() => {
    const result = DijkstraAlgorithm.run({
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B", weight: 1 },
        { from: "A", to: "C", weight: 4 },
        { from: "A", to: "D", weight: 7 },
        { from: "B", to: "C", weight: 2 },
        { from: "B", to: "D", weight: 5 },
        { from: "C", to: "D", weight: 1 },
      ],
      source: "A",
    });
    assert(result.distances["D"] === 4, "A->B->C->D = 1+2+1 = 4");
    assertEqual(result.path("D"), ["A", "B", "C", "D"], "Shortest through B,C");
  }, "Dense graph finds optimal path");

  return { passed, failed, failures };
}

module.exports = { runTests };
