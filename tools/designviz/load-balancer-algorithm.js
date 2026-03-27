/**
 * Load Balancer Algorithm
 *
 * Pure functions -- no DOM dependency.
 * Implements three load balancing strategies:
 *   1. Round Robin -- cyclic distribution across servers
 *   2. Least Connections -- route to server with fewest active connections
 *   3. Weighted -- proportional distribution based on server weights
 *
 * Functions:
 *   createPool() -- create a new server pool
 *   addServer(pool, config) -- add a server to the pool
 *   removeServer(pool, name) -- remove a server by name
 *   routeRequest(pool) -- route a request using current algorithm
 *   releaseConnection(pool, name) -- release a connection from a server
 *   setAlgorithm(pool, algorithm) -- switch the routing algorithm
 *   setServerStatus(pool, name, isUp) -- mark a server up or down
 *   recordResponseTime(pool, name, ms) -- record a response time sample
 *   getPoolStats(pool) -- get a snapshot of pool stats
 */
var LoadBalancerAlgorithm = (function () {
  "use strict";

  var VALID_ALGORITHMS = ["round-robin", "least-connections", "weighted"];

  /**
   * Create a new empty server pool.
   * @returns {object} pool state
   */
  function createPool() {
    return {
      servers: [],
      algorithm: "round-robin",
      roundRobinIndex: 0,
      weightedIndex: 0,
      weightedSchedule: [],
      totalRequests: 0,
    };
  }

  /**
   * Add a server to the pool.
   * @param {object} pool -- pool state (mutated)
   * @param {object} config -- { name: string, weight: number }
   * @returns {object} the new server object
   */
  function addServer(pool, config) {
    var server = {
      name: config.name,
      weight: config.weight,
      connections: 0,
      totalRequests: 0,
      isUp: true,
      avgResponseTime: 0,
      responseTimeCount: 0,
    };
    pool.servers.push(server);
    rebuildWeightedSchedule(pool);
    return server;
  }

  /**
   * Remove a server from the pool by name.
   * @param {object} pool -- pool state (mutated)
   * @param {string} name -- server name
   * @returns {boolean} true if removed, false if not found
   */
  function removeServer(pool, name) {
    var idx = findServerIndex(pool, name);
    if (idx === -1) {
      return false;
    }
    pool.servers.splice(idx, 1);
    // Adjust round-robin index to stay in bounds
    if (pool.roundRobinIndex >= pool.servers.length) {
      pool.roundRobinIndex = 0;
    }
    rebuildWeightedSchedule(pool);
    return true;
  }

  /**
   * Route a request using the current algorithm.
   * @param {object} pool -- pool state (mutated)
   * @returns {object} { routed: boolean, server: object|null, reason: string }
   */
  function routeRequest(pool) {
    if (pool.servers.length === 0) {
      return { routed: false, server: null, reason: "No servers available" };
    }

    var upServers = pool.servers.filter(function (s) {
      return s.isUp;
    });

    if (upServers.length === 0) {
      return { routed: false, server: null, reason: "All servers are down" };
    }

    var server = null;

    if (pool.algorithm === "round-robin") {
      server = routeRoundRobin(pool);
    } else if (pool.algorithm === "least-connections") {
      server = routeLeastConnections(pool);
    } else if (pool.algorithm === "weighted") {
      server = routeWeighted(pool);
    }

    if (server === null) {
      return { routed: false, server: null, reason: "All servers have zero weight" };
    }

    pool.totalRequests++;
    server.totalRequests++;
    server.connections++;

    return {
      routed: true,
      server: server,
      reason: "Routed to " + server.name + " (" + pool.algorithm + ")",
    };
  }

  /**
   * Round-robin: cycle through up servers.
   */
  function routeRoundRobin(pool) {
    var serverCount = pool.servers.length;
    var checked = 0;
    while (checked < serverCount) {
      var idx = pool.roundRobinIndex % serverCount;
      pool.roundRobinIndex = (pool.roundRobinIndex + 1) % serverCount;
      if (pool.servers[idx].isUp) {
        return pool.servers[idx];
      }
      checked++;
    }
    return null;
  }

  /**
   * Least-connections: pick the up server with fewest connections.
   * Ties broken by first occurrence (stable).
   */
  function routeLeastConnections(pool) {
    var best = null;
    for (var i = 0; i < pool.servers.length; i++) {
      var s = pool.servers[i];
      if (!s.isUp) {
        continue;
      }
      if (best === null || s.connections < best.connections) {
        best = s;
      }
    }
    return best;
  }

  /**
   * Weighted round-robin: use a pre-built schedule for deterministic proportional distribution.
   */
  function routeWeighted(pool) {
    if (pool.weightedSchedule.length === 0) {
      return null;
    }

    // Find next up server in schedule
    var scheduleLen = pool.weightedSchedule.length;
    var checked = 0;
    while (checked < scheduleLen) {
      var idx = pool.weightedIndex % scheduleLen;
      pool.weightedIndex = (pool.weightedIndex + 1) % scheduleLen;
      var serverName = pool.weightedSchedule[idx];
      var server = findServer(pool, serverName);
      if (server && server.isUp) {
        return server;
      }
      checked++;
    }
    return null;
  }

  /**
   * Build the weighted schedule array.
   * For servers with weights [3, 1], schedule is ["A", "A", "A", "B"].
   * Only includes servers with weight > 0.
   */
  function rebuildWeightedSchedule(pool) {
    var schedule = [];
    for (var i = 0; i < pool.servers.length; i++) {
      var s = pool.servers[i];
      for (var w = 0; w < s.weight; w++) {
        schedule.push(s.name);
      }
    }
    pool.weightedSchedule = schedule;
    pool.weightedIndex = 0;
  }

  /**
   * Release one connection from a named server.
   * @param {object} pool
   * @param {string} name
   */
  function releaseConnection(pool, name) {
    var server = findServer(pool, name);
    if (server && server.connections > 0) {
      server.connections--;
    }
  }

  /**
   * Set the routing algorithm. Resets weighted schedule index.
   * @param {object} pool
   * @param {string} algorithm -- "round-robin", "least-connections", or "weighted"
   * @returns {boolean} true if valid, false if invalid
   */
  function setAlgorithm(pool, algorithm) {
    if (VALID_ALGORITHMS.indexOf(algorithm) === -1) {
      return false;
    }
    pool.algorithm = algorithm;
    pool.roundRobinIndex = 0;
    pool.weightedIndex = 0;
    rebuildWeightedSchedule(pool);
    return true;
  }

  /**
   * Set a server's up/down status.
   * @param {object} pool
   * @param {string} name
   * @param {boolean} isUp
   * @returns {boolean} true if found, false if not
   */
  function setServerStatus(pool, name, isUp) {
    var server = findServer(pool, name);
    if (!server) {
      return false;
    }
    server.isUp = isUp;
    return true;
  }

  /**
   * Record a response time sample for a server (running average).
   * @param {object} pool
   * @param {string} name
   * @param {number} ms -- response time in milliseconds
   */
  function recordResponseTime(pool, name, ms) {
    var server = findServer(pool, name);
    if (!server) {
      return;
    }
    server.responseTimeCount++;
    server.avgResponseTime =
      server.avgResponseTime +
      (ms - server.avgResponseTime) / server.responseTimeCount;
  }

  /**
   * Get a stats snapshot of the pool.
   * @param {object} pool
   * @returns {object} stats snapshot
   */
  function getPoolStats(pool) {
    return {
      totalRequests: pool.totalRequests,
      serverCount: pool.servers.length,
      algorithm: pool.algorithm,
      servers: pool.servers.map(function (s) {
        return {
          name: s.name,
          weight: s.weight,
          connections: s.connections,
          totalRequests: s.totalRequests,
          isUp: s.isUp,
          avgResponseTime: s.avgResponseTime,
        };
      }),
    };
  }

  // --- Helpers ---

  function findServer(pool, name) {
    for (var i = 0; i < pool.servers.length; i++) {
      if (pool.servers[i].name === name) {
        return pool.servers[i];
      }
    }
    return null;
  }

  function findServerIndex(pool, name) {
    for (var i = 0; i < pool.servers.length; i++) {
      if (pool.servers[i].name === name) {
        return i;
      }
    }
    return -1;
  }

  // --- Exports ---
  var exports = {
    createPool: createPool,
    addServer: addServer,
    removeServer: removeServer,
    routeRequest: routeRequest,
    releaseConnection: releaseConnection,
    setAlgorithm: setAlgorithm,
    setServerStatus: setServerStatus,
    recordResponseTime: recordResponseTime,
    getPoolStats: getPoolStats,
    ALGORITHMS: VALID_ALGORITHMS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  }
  return exports;
})();
