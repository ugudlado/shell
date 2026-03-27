/**
 * Topological Sort — Kahn's Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements Kahn's algorithm for topological sorting of a DAG,
 * recording each step as a snapshot for visualization.
 * Detects cycles by identifying nodes that never reach in-degree 0.
 *
 * @module TopoSortAlgorithm
 */
var TopoSortAlgorithm = (function () {
  "use strict";

  var MAX_NODES = 30;

  /**
   * Run Kahn's topological sort on a directed graph.
   *
   * @param {object} params
   * @param {string[]} params.nodes - node identifiers
   * @param {Array<{from: string, to: string}>} params.edges - directed edges
   * @returns {{
   *   order: string[],
   *   hasCycle: boolean,
   *   cycleNodes: string[],
   *   snapshots: Array<{inDegrees: object, queue: string[], order: string[], action: string, currentNode: string|null}>,
   *   error: string|null
   * }}
   */
  function run(params) {
    var nodes = params.nodes;
    var edges = params.edges;

    // Empty graph
    if (!nodes || nodes.length === 0) {
      return {
        order: [],
        hasCycle: false,
        cycleNodes: [],
        snapshots: [],
        error: null,
      };
    }

    // Build adjacency list and compute in-degrees
    var adjacency = {};
    var inDegrees = {};
    var i, j;

    for (i = 0; i < nodes.length; i++) {
      adjacency[nodes[i]] = [];
      inDegrees[nodes[i]] = 0;
    }

    // Deduplicate edges
    var edgeSet = {};
    var uniqueEdges = [];
    for (i = 0; i < edges.length; i++) {
      var edgeKey = edges[i].from + "->" + edges[i].to;
      if (!edgeSet[edgeKey]) {
        edgeSet[edgeKey] = true;
        uniqueEdges.push(edges[i]);
      }
    }

    for (i = 0; i < uniqueEdges.length; i++) {
      var from = uniqueEdges[i].from;
      var to = uniqueEdges[i].to;
      if (adjacency[from]) {
        adjacency[from].push(to);
      }
      if (inDegrees[to] !== undefined) {
        inDegrees[to]++;
      }
    }

    var snapshots = [];
    var queue = [];
    var order = [];

    // Enqueue all nodes with in-degree 0
    for (i = 0; i < nodes.length; i++) {
      if (inDegrees[nodes[i]] === 0) {
        queue.push(nodes[i]);
      }
    }

    // Initial snapshot
    snapshots.push({
      inDegrees: copyObj(inDegrees),
      queue: queue.slice(),
      order: order.slice(),
      action: "init",
      currentNode: null,
    });

    // Process queue
    while (queue.length > 0) {
      var current = queue.shift();

      order.push(current);

      // Snapshot: dequeue node
      snapshots.push({
        inDegrees: copyObj(inDegrees),
        queue: queue.slice(),
        order: order.slice(),
        action: "dequeue",
        currentNode: current,
      });

      // Decrease in-degree of neighbors
      var neighbors = adjacency[current] || [];
      for (j = 0; j < neighbors.length; j++) {
        var neighbor = neighbors[j];
        inDegrees[neighbor]--;

        if (inDegrees[neighbor] === 0) {
          queue.push(neighbor);
        }
      }

      // Snapshot: after processing neighbors
      if (neighbors.length > 0) {
        snapshots.push({
          inDegrees: copyObj(inDegrees),
          queue: queue.slice(),
          order: order.slice(),
          action: "update-neighbors",
          currentNode: current,
        });
      }
    }

    // Cycle detection: nodes not in order are stuck
    var hasCycle = order.length < nodes.length;
    var cycleNodes = [];

    if (hasCycle) {
      for (i = 0; i < nodes.length; i++) {
        if (order.indexOf(nodes[i]) === -1) {
          cycleNodes.push(nodes[i]);
        }
      }

      // Snapshot: cycle detected
      snapshots.push({
        inDegrees: copyObj(inDegrees),
        queue: [],
        order: order.slice(),
        action: "cycle-detected",
        currentNode: null,
      });
    }

    return {
      order: hasCycle ? order : order,
      hasCycle: hasCycle,
      cycleNodes: cycleNodes,
      snapshots: snapshots,
      error: null,
    };
  }

  function copyObj(obj) {
    var copy = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        copy[k] = obj[k];
      }
    }
    return copy;
  }

  // --- Presets ---
  var presets = {
    buildSystem: {
      name: "Build System (Compile Order)",
      nodes: [
        "utils.c",
        "logger.c",
        "config.c",
        "network.c",
        "database.c",
        "auth.c",
        "api.c",
        "main.c",
      ],
      edges: [
        { from: "utils.c", to: "logger.c" },
        { from: "utils.c", to: "config.c" },
        { from: "logger.c", to: "network.c" },
        { from: "config.c", to: "network.c" },
        { from: "config.c", to: "database.c" },
        { from: "network.c", to: "auth.c" },
        { from: "database.c", to: "auth.c" },
        { from: "auth.c", to: "api.c" },
        { from: "api.c", to: "main.c" },
        { from: "logger.c", to: "main.c" },
      ],
    },
    coursePrerequisites: {
      name: "Course Prerequisites",
      nodes: [
        "Intro CS",
        "Calculus I",
        "Data Structures",
        "Calculus II",
        "Algorithms",
        "Databases",
        "OS",
        "Networks",
      ],
      edges: [
        { from: "Intro CS", to: "Data Structures" },
        { from: "Calculus I", to: "Calculus II" },
        { from: "Data Structures", to: "Algorithms" },
        { from: "Data Structures", to: "Databases" },
        { from: "Data Structures", to: "OS" },
        { from: "Calculus II", to: "Algorithms" },
        { from: "OS", to: "Networks" },
      ],
    },
  };

  return {
    run: run,
    presets: presets,
    MAX_NODES: MAX_NODES,
  };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = TopoSortAlgorithm;
}
