/**
 * Topological Sort (Kahn's Algorithm) Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Covers: empty graph, single node, linear chain, diamond DAG, cycle detection,
 * self-loop, disconnected components, large DAG (20+ nodes), multiple valid orderings,
 * build system preset, course prerequisites preset.
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const TopoSortAlgorithm = require("./topo-sort-algorithm.js");

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

  // --- Helper: verify topological order validity ---
  function isValidTopoOrder(nodes, edges, order) {
    if (order.length !== nodes.length) return false;
    var position = {};
    for (var i = 0; i < order.length; i++) {
      position[order[i]] = i;
    }
    for (var j = 0; j < edges.length; j++) {
      if (position[edges[j].from] >= position[edges[j].to]) return false;
    }
    return true;
  }

  // --- Empty graph ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: [],
      edges: [],
    });
    assertEqual(result.order, [], "Empty graph produces empty order");
    assertEqual(result.snapshots, [], "Empty graph produces no snapshots");
    assert(result.hasCycle === false, "Empty graph has no cycle");
    assert(result.cycleNodes.length === 0, "No cycle nodes for empty graph");
    assert(result.error === null, "No error for empty graph");
  }, "Empty graph");

  // --- Single node ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["A"],
      edges: [],
    });
    assertEqual(result.order, ["A"], "Single node is the order");
    assert(result.hasCycle === false, "Single node has no cycle");
    assert(result.snapshots.length >= 1, "At least one snapshot for single node");
  }, "Single node graph");

  // --- Linear chain A -> B -> C -> D ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "D" },
      ],
    });
    assertEqual(result.order, ["A", "B", "C", "D"], "Linear chain order");
    assert(result.hasCycle === false, "Linear chain has no cycle");
    assert(result.snapshots.length > 0, "Has snapshots");
  }, "Linear chain A->B->C->D");

  // --- Diamond DAG ---
  check(() => {
    // A -> B, A -> C, B -> D, C -> D
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
      ],
    });
    assert(result.hasCycle === false, "Diamond DAG has no cycle");
    assert(result.order.length === 4, "All 4 nodes in order");
    assert(result.order[0] === "A", "A must come first");
    assert(result.order[3] === "D", "D must come last");
    assert(
      isValidTopoOrder(["A", "B", "C", "D"], [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
        { from: "C", to: "D" },
      ], result.order),
      "Valid topological order for diamond DAG"
    );
  }, "Diamond DAG (A->B,C->D)");

  // --- Cycle detection: simple cycle A -> B -> C -> A ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "A" },
      ],
    });
    assert(result.hasCycle === true, "Detects cycle");
    assert(result.order.length === 0, "No order when cycle exists");
    assert(result.cycleNodes.length === 3, "All 3 nodes are in cycle");
    assert(result.cycleNodes.indexOf("A") >= 0, "A is a cycle node");
    assert(result.cycleNodes.indexOf("B") >= 0, "B is a cycle node");
    assert(result.cycleNodes.indexOf("C") >= 0, "C is a cycle node");
  }, "Cycle detection: A->B->C->A");

  // --- Self-loop ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["A"],
      edges: [{ from: "A", to: "A" }],
    });
    assert(result.hasCycle === true, "Self-loop is a cycle");
    assert(result.order.length === 0, "No order for self-loop");
    assert(result.cycleNodes.length === 1, "One cycle node for self-loop");
    assert(result.cycleNodes[0] === "A", "A is the cycle node");
  }, "Self-loop detection");

  // --- Disconnected components ---
  check(() => {
    // Component 1: A -> B, Component 2: C -> D (no edges between)
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B" },
        { from: "C", to: "D" },
      ],
    });
    assert(result.hasCycle === false, "Disconnected components have no cycle");
    assert(result.order.length === 4, "All 4 nodes in order");
    // A before B, C before D
    const idxA = result.order.indexOf("A");
    const idxB = result.order.indexOf("B");
    const idxC = result.order.indexOf("C");
    const idxD = result.order.indexOf("D");
    assert(idxA < idxB, "A comes before B");
    assert(idxC < idxD, "C comes before D");
  }, "Disconnected components");

  // --- Large DAG (25 nodes, chain) ---
  check(() => {
    const nodes = [];
    const edges = [];
    for (let i = 0; i < 25; i++) {
      nodes.push("N" + i);
      if (i > 0) {
        edges.push({ from: "N" + (i - 1), to: "N" + i });
      }
    }
    const result = TopoSortAlgorithm.run({ nodes, edges });
    assert(result.hasCycle === false, "Large chain has no cycle");
    assert(result.order.length === 25, "All 25 nodes in order");
    assertEqual(result.order[0], "N0", "First node is N0");
    assertEqual(result.order[24], "N24", "Last node is N24");
  }, "Large DAG (25 nodes chain)");

  // --- Large DAG with branches (20+ nodes) ---
  check(() => {
    const nodes = [];
    const edges = [];
    for (let i = 0; i < 22; i++) {
      nodes.push("T" + i);
    }
    // T0 -> T1..T5, T1..T5 -> T6..T10, T6..T10 -> T11..T15, T11..T15 -> T16..T20, T16..T20 -> T21
    for (let i = 1; i <= 5; i++) {
      edges.push({ from: "T0", to: "T" + i });
    }
    for (let i = 1; i <= 5; i++) {
      edges.push({ from: "T" + i, to: "T" + (i + 5) });
    }
    for (let i = 6; i <= 10; i++) {
      edges.push({ from: "T" + i, to: "T" + (i + 5) });
    }
    for (let i = 11; i <= 15; i++) {
      edges.push({ from: "T" + i, to: "T" + (i + 5) });
    }
    for (let i = 16; i <= 20; i++) {
      edges.push({ from: "T" + i, to: "T21" });
    }
    const result = TopoSortAlgorithm.run({ nodes, edges });
    assert(result.hasCycle === false, "Branched DAG has no cycle");
    assert(result.order.length === 22, "All 22 nodes in order");
    assert(result.order[0] === "T0", "T0 first (only zero in-degree)");
    assert(result.order[21] === "T21", "T21 last (all depend on it)");
    assert(
      isValidTopoOrder(nodes, edges, result.order),
      "Valid topological order for branched DAG"
    );
  }, "Large DAG with branches (22 nodes)");

  // --- Partial cycle (some nodes not in cycle) ---
  check(() => {
    // A -> B -> C -> B (cycle), A -> D (D is not in cycle)
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C", "D"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "B" },
        { from: "A", to: "D" },
      ],
    });
    assert(result.hasCycle === true, "Partial cycle detected");
    assert(result.cycleNodes.indexOf("B") >= 0, "B is in cycle");
    assert(result.cycleNodes.indexOf("C") >= 0, "C is in cycle");
    // A and D are NOT in the cycle (they have in-degree that gets resolved)
    // But since B and C are stuck, order is incomplete
    assert(result.order.length < 4, "Order is incomplete due to cycle");
  }, "Partial cycle: B<->C cycle with non-cycle nodes A, D");

  // --- In-degree tracking in snapshots ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
      ],
    });
    assert(result.snapshots.length > 0, "Has snapshots");
    const snap = result.snapshots[0];
    assert(typeof snap.inDegrees === "object", "Snapshot has inDegrees");
    assert(Array.isArray(snap.queue), "Snapshot has queue");
    assert(Array.isArray(snap.order), "Snapshot has order");
    assert(snap.action !== undefined, "Snapshot has action");
  }, "Snapshot structure has inDegrees, queue, order, action");

  // --- In-degree values correct initially ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "C" },
      ],
    });
    // First snapshot should show initial state
    assert(result.snapshots.length >= 1, "Has at least one snapshot");
    const firstSnap = result.snapshots[0];
    assert(firstSnap.inDegrees["A"] === 0, "A has in-degree 0 initially");
    // Note: B's in-degree is 1 (from A), but by the time we take the first
    // snapshot (enqueue A), the in-degrees reflect the initial computation
  }, "Initial in-degree computation is correct");

  // --- Multiple valid orderings (verify any valid one) ---
  check(() => {
    // A -> C, B -> C (A and B can be in any order)
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [
        { from: "A", to: "C" },
        { from: "B", to: "C" },
      ],
    });
    assert(result.hasCycle === false, "No cycle");
    assert(result.order.length === 3, "All nodes in order");
    assert(result.order[2] === "C", "C must come last");
    assert(
      isValidTopoOrder(
        ["A", "B", "C"],
        [{ from: "A", to: "C" }, { from: "B", to: "C" }],
        result.order
      ),
      "Valid topological order"
    );
  }, "Multiple valid orderings: A,B->C");

  // --- All isolated nodes (no edges) ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C"],
      edges: [],
    });
    assert(result.hasCycle === false, "No cycle for isolated nodes");
    assert(result.order.length === 3, "All 3 nodes in order");
  }, "All isolated nodes (no edges)");

  // --- Build system preset ---
  check(() => {
    const preset = TopoSortAlgorithm.presets.buildSystem;
    assert(preset !== undefined, "Build system preset exists");
    assert(Array.isArray(preset.nodes), "Preset has nodes array");
    assert(Array.isArray(preset.edges), "Preset has edges array");
    assert(preset.nodes.length >= 4, "Preset has at least 4 nodes");
    assert(preset.edges.length >= 3, "Preset has at least 3 edges");
    assert(typeof preset.name === "string", "Preset has a name");

    // Running it should produce valid order
    const result = TopoSortAlgorithm.run({
      nodes: preset.nodes,
      edges: preset.edges,
    });
    assert(result.hasCycle === false, "Build system preset has no cycle");
    assert(result.order.length === preset.nodes.length, "All nodes ordered");
    assert(
      isValidTopoOrder(preset.nodes, preset.edges, result.order),
      "Valid topological order for build system preset"
    );
  }, "Build system preset produces valid topological order");

  // --- Course prerequisites preset ---
  check(() => {
    const preset = TopoSortAlgorithm.presets.coursePrerequisites;
    assert(preset !== undefined, "Course prerequisites preset exists");
    assert(Array.isArray(preset.nodes), "Preset has nodes array");
    assert(Array.isArray(preset.edges), "Preset has edges array");
    assert(preset.nodes.length >= 4, "Preset has at least 4 nodes");
    assert(preset.edges.length >= 3, "Preset has at least 3 edges");
    assert(typeof preset.name === "string", "Preset has a name");

    const result = TopoSortAlgorithm.run({
      nodes: preset.nodes,
      edges: preset.edges,
    });
    assert(result.hasCycle === false, "Course prerequisites preset has no cycle");
    assert(result.order.length === preset.nodes.length, "All nodes ordered");
    assert(
      isValidTopoOrder(preset.nodes, preset.edges, result.order),
      "Valid topological order for course prerequisites preset"
    );
  }, "Course prerequisites preset produces valid topological order");

  // --- Cycle with more than 3 nodes ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B", "C", "D", "E"],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "C" },
        { from: "C", to: "D" },
        { from: "D", to: "B" },  // cycle B->C->D->B
        { from: "A", to: "E" },
      ],
    });
    assert(result.hasCycle === true, "Detects cycle in larger graph");
    assert(result.cycleNodes.indexOf("B") >= 0, "B is stuck");
    assert(result.cycleNodes.indexOf("C") >= 0, "C is stuck");
    assert(result.cycleNodes.indexOf("D") >= 0, "D is stuck");
  }, "Cycle detection in 5-node graph with 3-node cycle");

  // --- Node count in result matches input ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["X", "Y", "Z"],
      edges: [{ from: "X", to: "Y" }, { from: "Y", to: "Z" }],
    });
    assert(result.order.length === 3, "Order has exactly 3 nodes");
    // Verify no duplicates
    const unique = new Set(result.order);
    assert(unique.size === 3, "No duplicates in order");
  }, "No duplicate nodes in output order");

  // --- Duplicate edges are handled ---
  check(() => {
    const result = TopoSortAlgorithm.run({
      nodes: ["A", "B"],
      edges: [
        { from: "A", to: "B" },
        { from: "A", to: "B" },  // duplicate
      ],
    });
    assert(result.hasCycle === false, "Duplicate edges don't cause cycle");
    assert(result.order.length === 2, "Both nodes in order");
    assertEqual(result.order, ["A", "B"], "Correct order despite duplicate edges");
  }, "Duplicate edges handled correctly");

  // --- MAX_NODES constant exposed ---
  check(() => {
    assert(typeof TopoSortAlgorithm.MAX_NODES === "number", "MAX_NODES is a number");
    assert(TopoSortAlgorithm.MAX_NODES >= 15, "MAX_NODES is at least 15");
  }, "MAX_NODES constant is exposed");

  return { passed, failed, failures };
}

module.exports = { runTests };
