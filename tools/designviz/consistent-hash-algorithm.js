/**
 * Consistent Hashing Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements consistent hashing with a hash ring and virtual nodes.
 * Contrasts with naive modulo hashing to show redistribution differences.
 *
 * Functions:
 *   createRing(config) — create a hash ring with given config
 *   addServer(ring, serverId) — add a server with virtual nodes to the ring
 *   removeServer(ring, serverId) — remove a server and its virtual nodes
 *   assignKey(ring, key) — find which server a key maps to
 *   assignKeyModulo(serverCount, key) — naive modulo assignment
 *   assignAllKeys(ring, keys) — assign all keys and return distribution
 *   compareRedistribution(ring, keys, addOrRemove, serverId) — compare redistribution
 *   hashString(str) — hash a string to a 32-bit integer
 *   getDistribution(ring, keys) — get per-server key counts
 *   getRingPositions(ring) — get all positions on the ring for visualization
 */
var ConsistentHashAlgorithm = (function () {
  "use strict";

  var RING_SIZE = 360; // Degrees for visualization (positions mapped to 0-359)

  /**
   * Simple hash function — djb2 variant producing a 32-bit unsigned integer.
   * @param {string} str
   * @returns {number} 32-bit unsigned hash
   */
  function hashString(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  /**
   * Map a hash value to a ring position (0 to RING_SIZE-1).
   * @param {number} hash — 32-bit unsigned integer
   * @returns {number} position on ring
   */
  function hashToPosition(hash) {
    return hash % RING_SIZE;
  }

  /**
   * Create a consistent hash ring.
   * @param {object} config
   * @param {number} config.virtualNodes — number of virtual nodes per server (1-20)
   * @returns {object} ring state
   */
  function createRing(config) {
    var vNodes = config.virtualNodes;
    if (vNodes < 1) vNodes = 1;
    if (vNodes > 20) vNodes = 20;

    return {
      virtualNodesPerServer: vNodes,
      servers: [],           // list of server IDs
      ring: [],              // sorted array of { position, serverId, vnodeIndex }
      serverColors: {},      // serverId -> colorIndex for visualization
      nextColorIndex: 0,
    };
  }

  /**
   * Insert a node into the sorted ring array maintaining sort order.
   * @param {Array} ring — sorted array of nodes
   * @param {object} node — { position, serverId, vnodeIndex }
   */
  function insertSorted(ring, node) {
    var low = 0;
    var high = ring.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      if (ring[mid].position < node.position) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    ring.splice(low, 0, node);
  }

  /**
   * Add a server to the ring with virtual nodes.
   * @param {object} ring — ring state (mutated)
   * @param {string} serverId — unique server identifier
   * @returns {object} { added, positions, error }
   */
  function addServer(ring, serverId) {
    if (ring.servers.indexOf(serverId) !== -1) {
      return { added: false, positions: [], error: "Server already exists: " + serverId };
    }

    ring.servers.push(serverId);
    ring.serverColors[serverId] = ring.nextColorIndex;
    ring.nextColorIndex++;

    var positions = [];
    for (var i = 0; i < ring.virtualNodesPerServer; i++) {
      var vnodeKey = serverId + "#vn" + i;
      var hash = hashString(vnodeKey);
      var position = hashToPosition(hash);
      var node = { position: position, serverId: serverId, vnodeIndex: i };
      insertSorted(ring.ring, node);
      positions.push(position);
    }

    return { added: true, positions: positions, error: null };
  }

  /**
   * Remove a server and all its virtual nodes from the ring.
   * @param {object} ring — ring state (mutated)
   * @param {string} serverId — server to remove
   * @returns {object} { removed, removedPositions, error }
   */
  function removeServer(ring, serverId) {
    var idx = ring.servers.indexOf(serverId);
    if (idx === -1) {
      return { removed: false, removedPositions: [], error: "Server not found: " + serverId };
    }

    ring.servers.splice(idx, 1);

    var removedPositions = [];
    var newRing = [];
    for (var i = 0; i < ring.ring.length; i++) {
      if (ring.ring[i].serverId === serverId) {
        removedPositions.push(ring.ring[i].position);
      } else {
        newRing.push(ring.ring[i]);
      }
    }
    ring.ring = newRing;

    delete ring.serverColors[serverId];

    return { removed: true, removedPositions: removedPositions, error: null };
  }

  /**
   * Find which server a key maps to on the ring.
   * Walk clockwise from the key's hash position to find the first server node.
   * @param {object} ring — ring state
   * @param {string} key — key to assign
   * @returns {object} { serverId, position, keyPosition } or { serverId: null } if ring empty
   */
  function assignKey(ring, key) {
    if (ring.ring.length === 0) {
      return { serverId: null, position: -1, keyPosition: -1 };
    }

    var hash = hashString(key);
    var keyPos = hashToPosition(hash);

    // Binary search for first node with position >= keyPos
    var low = 0;
    var high = ring.ring.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      if (ring.ring[mid].position < keyPos) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    // If no node found at or after keyPos, wrap around to first node
    if (low >= ring.ring.length) {
      low = 0;
    }

    return {
      serverId: ring.ring[low].serverId,
      position: ring.ring[low].position,
      keyPosition: keyPos,
    };
  }

  /**
   * Naive modulo-based key assignment.
   * @param {number} serverCount — total servers
   * @param {string} key — key to assign
   * @returns {object} { serverIndex, keyHash }
   */
  function assignKeyModulo(serverCount, key) {
    if (serverCount <= 0) {
      return { serverIndex: -1, keyHash: 0 };
    }
    var hash = hashString(key);
    return { serverIndex: hash % serverCount, keyHash: hash };
  }

  /**
   * Assign all keys and return per-server distribution.
   * @param {object} ring — ring state
   * @param {string[]} keys — array of key strings
   * @returns {object} { assignments: [{key, serverId, keyPosition}], distribution: {serverId: count} }
   */
  function assignAllKeys(ring, keys) {
    var assignments = [];
    var distribution = {};

    // Initialize distribution with 0 for each server
    for (var s = 0; s < ring.servers.length; s++) {
      distribution[ring.servers[s]] = 0;
    }

    for (var i = 0; i < keys.length; i++) {
      var result = assignKey(ring, keys[i]);
      assignments.push({
        key: keys[i],
        serverId: result.serverId,
        keyPosition: result.keyPosition,
      });
      if (result.serverId !== null) {
        if (distribution[result.serverId] === undefined) {
          distribution[result.serverId] = 0;
        }
        distribution[result.serverId]++;
      }
    }

    return { assignments: assignments, distribution: distribution };
  }

  /**
   * Compare key redistribution when adding or removing a server.
   * Returns how many keys change assignment under consistent hashing vs modulo.
   * @param {object} ring — ring state (NOT mutated — works on a copy internally)
   * @param {string[]} keys — keys to test
   * @param {string} action — "add" or "remove"
   * @param {string} serverId — server to add/remove
   * @returns {object} { consistentMoved, moduloMoved, totalKeys, consistentPct, moduloPct }
   */
  function compareRedistribution(ring, keys, action, serverId) {
    // Get current assignments (consistent hashing)
    var beforeConsistent = assignAllKeys(ring, keys);

    // Get current assignments (modulo)
    var beforeServerCount = ring.servers.length;
    var beforeModulo = {};
    for (var i = 0; i < keys.length; i++) {
      var mod = assignKeyModulo(beforeServerCount, keys[i]);
      beforeModulo[keys[i]] = mod.serverIndex;
    }

    // Simulate the change on a deep copy of the ring
    var copyRing = deepCopyRing(ring);
    var afterServerCount;

    if (action === "add") {
      addServer(copyRing, serverId);
      afterServerCount = copyRing.servers.length;
    } else {
      removeServer(copyRing, serverId);
      afterServerCount = copyRing.servers.length;
    }

    // Get after assignments (consistent hashing)
    var afterConsistent = assignAllKeys(copyRing, keys);

    // Compare consistent hashing redistribution
    var consistentMoved = 0;
    for (var j = 0; j < keys.length; j++) {
      var beforeServer = beforeConsistent.assignments[j].serverId;
      var afterServer = afterConsistent.assignments[j].serverId;
      if (beforeServer !== afterServer) {
        consistentMoved++;
      }
    }

    // Compare modulo redistribution
    var moduloMoved = 0;
    for (var k = 0; k < keys.length; k++) {
      var afterMod = assignKeyModulo(afterServerCount, keys[k]);
      if (beforeModulo[keys[k]] !== afterMod.serverIndex) {
        moduloMoved++;
      }
    }

    var totalKeys = keys.length;
    return {
      consistentMoved: consistentMoved,
      moduloMoved: moduloMoved,
      totalKeys: totalKeys,
      consistentPct: totalKeys > 0 ? Math.round((consistentMoved / totalKeys) * 100) : 0,
      moduloPct: totalKeys > 0 ? Math.round((moduloMoved / totalKeys) * 100) : 0,
    };
  }

  /**
   * Deep copy a ring state (for non-destructive comparison).
   * @param {object} ring
   * @returns {object} copy
   */
  function deepCopyRing(ring) {
    var copy = {
      virtualNodesPerServer: ring.virtualNodesPerServer,
      servers: ring.servers.slice(),
      ring: [],
      serverColors: {},
      nextColorIndex: ring.nextColorIndex,
    };
    for (var i = 0; i < ring.ring.length; i++) {
      copy.ring.push({
        position: ring.ring[i].position,
        serverId: ring.ring[i].serverId,
        vnodeIndex: ring.ring[i].vnodeIndex,
      });
    }
    for (var key in ring.serverColors) {
      if (ring.serverColors.hasOwnProperty(key)) {
        copy.serverColors[key] = ring.serverColors[key];
      }
    }
    return copy;
  }

  /**
   * Get per-server key counts for distribution visualization.
   * @param {object} ring
   * @param {string[]} keys
   * @returns {object} { serverId: count }
   */
  function getDistribution(ring, keys) {
    return assignAllKeys(ring, keys).distribution;
  }

  /**
   * Get all ring node positions for visualization.
   * @param {object} ring
   * @returns {Array} [{ position, serverId, vnodeIndex, colorIndex }]
   */
  function getRingPositions(ring) {
    var positions = [];
    for (var i = 0; i < ring.ring.length; i++) {
      var node = ring.ring[i];
      positions.push({
        position: node.position,
        serverId: node.serverId,
        vnodeIndex: node.vnodeIndex,
        colorIndex: ring.serverColors[node.serverId] || 0,
      });
    }
    return positions;
  }

  // --- Constants ---
  var constants = {
    RING_SIZE: RING_SIZE,
  };

  // --- Exports ---
  var exports = {
    createRing: createRing,
    addServer: addServer,
    removeServer: removeServer,
    assignKey: assignKey,
    assignKeyModulo: assignKeyModulo,
    assignAllKeys: assignAllKeys,
    compareRedistribution: compareRedistribution,
    hashString: hashString,
    getDistribution: getDistribution,
    getRingPositions: getRingPositions,
    deepCopyRing: deepCopyRing,
    RING_SIZE: RING_SIZE,
    constants: constants,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  }
  return exports;
})();
