/**
 * Dijkstra's Shortest Path Algorithm
 *
 * Pure functions — no DOM dependency.
 * Runs Dijkstra on a weighted directed graph,
 * recording each step as a snapshot for visualization.
 *
 * Real-world example: GPS navigation finding cheapest route between cities.
 */
var DijkstraAlgorithm = (function () {
  "use strict";

  var MAX_WEIGHT = 999;

  /**
   * Run Dijkstra's shortest path algorithm.
   *
   * @param {object} params
   * @param {string[]} params.nodes - array of node identifiers
   * @param {Array<{from: string, to: string, weight: number}>} params.edges - directed edges
   * @param {string} params.source - source node identifier
   * @returns {{
   *   distances: Object<string, number>,
   *   previous: Object<string, string|null>,
   *   snapshots: Array<{current: string, distances: Object, priorityQueue: Array, visited: string[], relaxedEdge: {from:string,to:string}|null}>,
   *   path: function(string): string[]|null,
   *   error: string|null
   * }}
   */
  function run(params) {
    var nodes = params.nodes;
    var edges = params.edges;
    var source = params.source;

    var emptyResult = {
      distances: {},
      previous: {},
      snapshots: [],
      path: function () {
        return null;
      },
      error: null,
    };

    // Empty graph
    if (!nodes || nodes.length === 0) {
      return emptyResult;
    }

    // Build node set for validation
    var nodeSet = {};
    for (var i = 0; i < nodes.length; i++) {
      nodeSet[nodes[i]] = true;
    }

    // Source not in graph
    if (!nodeSet[source]) {
      return emptyResult;
    }

    // Validate edges — check for negative weights and exceeds max
    for (var e = 0; e < edges.length; e++) {
      if (edges[e].weight < 0) {
        return {
          distances: {},
          previous: {},
          snapshots: [],
          path: function () {
            return null;
          },
          error: "negative-weight",
        };
      }
      if (edges[e].weight > MAX_WEIGHT) {
        return {
          distances: {},
          previous: {},
          snapshots: [],
          path: function () {
            return null;
          },
          error: "weight-exceeds-max",
        };
      }
    }

    // Build adjacency list
    var adjacency = {};
    for (var n = 0; n < nodes.length; n++) {
      adjacency[nodes[n]] = [];
    }
    for (var j = 0; j < edges.length; j++) {
      var edge = edges[j];
      if (adjacency[edge.from]) {
        adjacency[edge.from].push({ to: edge.to, weight: edge.weight });
      }
    }

    // Initialize distances and previous
    var distances = {};
    var previous = {};
    var visited = {};
    var visitedOrder = [];
    var snapshots = [];

    for (var k = 0; k < nodes.length; k++) {
      distances[nodes[k]] = Infinity;
      previous[nodes[k]] = null;
    }
    distances[source] = 0;

    // Priority queue (simple array-based min-heap for clarity)
    // Each entry: { node: string, distance: number }
    var pq = [];
    pqPush(pq, { node: source, distance: 0 });

    while (pq.length > 0) {
      var current = pqPop(pq);
      var currentNode = current.node;

      // Skip if already visited (stale entry in PQ)
      if (visited[currentNode]) {
        continue;
      }

      visited[currentNode] = true;
      visitedOrder.push(currentNode);

      // Record snapshot: processing this node
      snapshots.push({
        current: currentNode,
        distances: copyObj(distances),
        priorityQueue: pqToArray(pq),
        visited: visitedOrder.slice(),
        relaxedEdge: null,
      });

      // Relax edges
      var neighbors = adjacency[currentNode] || [];
      for (var m = 0; m < neighbors.length; m++) {
        var neighbor = neighbors[m];
        var toNode = neighbor.to;
        var newDist = distances[currentNode] + neighbor.weight;

        if (newDist < distances[toNode]) {
          distances[toNode] = newDist;
          previous[toNode] = currentNode;
          pqPush(pq, { node: toNode, distance: newDist });

          // Record snapshot: edge relaxation
          snapshots.push({
            current: currentNode,
            distances: copyObj(distances),
            priorityQueue: pqToArray(pq),
            visited: visitedOrder.slice(),
            relaxedEdge: { from: currentNode, to: toNode },
          });
        }
      }
    }

    // Path reconstruction function
    function pathTo(target) {
      if (!nodeSet[target]) return null;
      if (distances[target] === Infinity) return null;

      var result = [];
      var cur = target;
      var maxIter = nodes.length + 1;
      while (cur !== null && maxIter-- > 0) {
        result.unshift(cur);
        cur = previous[cur];
      }
      if (result.length === 0 || result[0] !== source) return null;
      return result;
    }

    return {
      distances: distances,
      previous: previous,
      snapshots: snapshots,
      path: pathTo,
      error: null,
    };
  }

  // --- Min-heap priority queue ---
  function pqPush(heap, entry) {
    heap.push(entry);
    var idx = heap.length - 1;
    while (idx > 0) {
      var parentIdx = Math.floor((idx - 1) / 2);
      if (heap[parentIdx].distance <= heap[idx].distance) break;
      var tmp = heap[parentIdx];
      heap[parentIdx] = heap[idx];
      heap[idx] = tmp;
      idx = parentIdx;
    }
  }

  function pqPop(heap) {
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
        if (left < heap.length && heap[left].distance < heap[smallest].distance) {
          smallest = left;
        }
        if (
          right < heap.length &&
          heap[right].distance < heap[smallest].distance
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

  function pqToArray(heap) {
    var result = [];
    for (var i = 0; i < heap.length; i++) {
      result.push({ node: heap[i].node, distance: heap[i].distance });
    }
    // Sort by distance for display
    result.sort(function (a, b) {
      return a.distance - b.distance;
    });
    return result;
  }

  function copyObj(obj) {
    var result = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  return { run: run, MAX_WEIGHT: MAX_WEIGHT };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = DijkstraAlgorithm;
}
