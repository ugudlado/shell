/**
 * Connection Pool Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements a fixed-size connection pool with:
 *   - Acquire/release connections
 *   - Queue with wait times when pool exhausted
 *   - Connection timeout (max time a connection can be held)
 *   - Idle cleanup (recycle connections idle too long)
 *
 * Real-world: PostgreSQL pgBouncer managing N connections for many requests.
 *
 * Functions:
 *   createPool(config) — create a connection pool
 *   acquire(pool, clientId, timestamp) — acquire a connection or queue
 *   release(pool, connectionId, timestamp) — release a connection back to pool
 *   processQueue(pool, timestamp) — assign queued clients to free connections
 *   checkTimeouts(pool, timestamp) — force-release timed-out connections
 *   checkIdleConnections(pool, timestamp) — clean up idle connections
 *   tick(pool, timestamp) — run timeouts + idle cleanup + process queue
 *   reset(config) — create a fresh pool
 *   getStats(pool) — return current stats snapshot
 */
var ConnPoolAlgorithm = (function () {
  "use strict";

  var STATUS_IDLE = "idle";
  var STATUS_ACTIVE = "active";

  /**
   * Create a connection pool.
   * @param {object} config
   * @param {number} config.poolSize — max connections (1-50)
   * @param {number} config.connectionTimeout — seconds before force-release (1-120)
   * @param {number} config.idleTimeout — seconds before idle cleanup (1-300)
   * @param {number} config.maxQueueSize — max waiting clients (1-100)
   * @returns {object} pool state
   */
  function createPool(config) {
    var poolSize = Math.max(1, Math.min(50, Math.floor(config.poolSize || 5)));
    var connectionTimeout =
      Math.max(1, Math.min(120, config.connectionTimeout || 30));
    var idleTimeout = Math.max(1, Math.min(300, config.idleTimeout || 60));
    var maxQueueSize = Math.max(1, Math.min(100, config.maxQueueSize || 20));

    var connections = [];
    for (var i = 0; i < poolSize; i++) {
      connections.push({
        id: i,
        status: STATUS_IDLE,
        clientId: null,
        acquiredAt: null,
        lastActiveAt: null,
      });
    }

    return {
      connections: connections,
      queue: [],
      poolSize: poolSize,
      connectionTimeout: connectionTimeout,
      idleTimeout: idleTimeout,
      maxQueueSize: maxQueueSize,
      totalAcquired: 0,
      totalReleased: 0,
      totalTimedOut: 0,
      totalIdleCleaned: 0,
      totalQueueRejected: 0,
      totalQueued: 0,
      events: [],
    };
  }

  /**
   * Find an idle connection and assign it.
   * @returns {object|null} the connection or null
   */
  function findIdleConnection(pool) {
    for (var i = 0; i < pool.connections.length; i++) {
      if (pool.connections[i].status === STATUS_IDLE) {
        return pool.connections[i];
      }
    }
    return null;
  }

  /**
   * Acquire a connection from the pool.
   * @param {object} pool
   * @param {string} clientId
   * @param {number} timestamp — ms
   * @returns {object} { acquired, queued, rejected, connectionId, queuePosition, reason }
   */
  function acquire(pool, clientId, timestamp) {
    var conn = findIdleConnection(pool);

    if (conn) {
      conn.status = STATUS_ACTIVE;
      conn.clientId = clientId;
      conn.acquiredAt = timestamp;
      conn.lastActiveAt = timestamp;
      pool.totalAcquired++;

      pool.events.push({
        type: "acquire",
        clientId: clientId,
        connectionId: conn.id,
        timestamp: timestamp,
      });

      return {
        acquired: true,
        queued: false,
        rejected: false,
        connectionId: conn.id,
        queuePosition: null,
        reason:
          "Connection " +
          conn.id +
          " acquired by " +
          clientId +
          ".",
      };
    }

    // No idle connections — try to queue
    if (pool.queue.length >= pool.maxQueueSize) {
      pool.totalQueueRejected++;

      pool.events.push({
        type: "rejected",
        clientId: clientId,
        timestamp: timestamp,
      });

      return {
        acquired: false,
        queued: false,
        rejected: true,
        connectionId: null,
        queuePosition: null,
        reason:
          "Queue full (" +
          pool.maxQueueSize +
          "). " +
          clientId +
          " rejected.",
      };
    }

    pool.queue.push({
      clientId: clientId,
      queuedAt: timestamp,
    });
    pool.totalQueued++;

    pool.events.push({
      type: "queued",
      clientId: clientId,
      queuePosition: pool.queue.length,
      timestamp: timestamp,
    });

    return {
      acquired: false,
      queued: true,
      rejected: false,
      connectionId: null,
      queuePosition: pool.queue.length,
      reason:
        clientId +
        " queued at position " +
        pool.queue.length +
        ". All connections busy.",
    };
  }

  /**
   * Release a connection back to the pool.
   * @param {object} pool
   * @param {number} connectionId
   * @param {number} timestamp — ms
   * @returns {object} { released, reason, holdTime }
   */
  function release(pool, connectionId, timestamp) {
    if (connectionId < 0 || connectionId >= pool.connections.length) {
      return {
        released: false,
        reason: "Invalid connection ID: " + connectionId,
        holdTime: 0,
      };
    }

    var conn = pool.connections[connectionId];

    if (conn.status !== STATUS_ACTIVE) {
      return {
        released: false,
        reason: "Connection " + connectionId + " is not active.",
        holdTime: 0,
      };
    }

    var holdTime = conn.acquiredAt !== null ? timestamp - conn.acquiredAt : 0;

    pool.events.push({
      type: "release",
      clientId: conn.clientId,
      connectionId: connectionId,
      holdTime: holdTime,
      timestamp: timestamp,
    });

    conn.status = STATUS_IDLE;
    conn.clientId = null;
    conn.acquiredAt = null;
    conn.lastActiveAt = timestamp;
    pool.totalReleased++;

    return {
      released: true,
      reason: "Connection " + connectionId + " released.",
      holdTime: holdTime,
    };
  }

  /**
   * Process the queue — assign waiting clients to newly-free connections.
   * @param {object} pool
   * @param {number} timestamp — ms
   * @returns {Array} array of { clientId, connectionId, waitTime }
   */
  function processQueue(pool, timestamp) {
    var assigned = [];

    while (pool.queue.length > 0) {
      var conn = findIdleConnection(pool);
      if (!conn) break;

      var waiting = pool.queue.shift();
      conn.status = STATUS_ACTIVE;
      conn.clientId = waiting.clientId;
      conn.acquiredAt = timestamp;
      conn.lastActiveAt = timestamp;
      pool.totalAcquired++;

      var waitTime = timestamp - waiting.queuedAt;

      pool.events.push({
        type: "dequeued",
        clientId: waiting.clientId,
        connectionId: conn.id,
        waitTime: waitTime,
        timestamp: timestamp,
      });

      assigned.push({
        clientId: waiting.clientId,
        connectionId: conn.id,
        waitTime: waitTime,
      });
    }

    return assigned;
  }

  /**
   * Check for timed-out connections and force-release them.
   * @param {object} pool
   * @param {number} timestamp — ms
   * @returns {Array} array of { connectionId, clientId, holdTime }
   */
  function checkTimeouts(pool, timestamp) {
    var timedOut = [];
    var timeoutMs = pool.connectionTimeout * 1000;

    for (var i = 0; i < pool.connections.length; i++) {
      var conn = pool.connections[i];
      if (
        conn.status === STATUS_ACTIVE &&
        conn.acquiredAt !== null &&
        timestamp - conn.acquiredAt >= timeoutMs
      ) {
        var holdTime = timestamp - conn.acquiredAt;

        pool.events.push({
          type: "timeout",
          clientId: conn.clientId,
          connectionId: conn.id,
          holdTime: holdTime,
          timestamp: timestamp,
        });

        timedOut.push({
          connectionId: conn.id,
          clientId: conn.clientId,
          holdTime: holdTime,
        });

        conn.status = STATUS_IDLE;
        conn.clientId = null;
        conn.acquiredAt = null;
        conn.lastActiveAt = timestamp;
        pool.totalTimedOut++;
        pool.totalReleased++;
      }
    }

    return timedOut;
  }

  /**
   * Check for idle connections that have been unused too long.
   * Idle cleanup marks connections as "cleaned" — in a real pool this would
   * close the TCP connection. Here we reset lastActiveAt to simulate recycling.
   * @param {object} pool
   * @param {number} timestamp — ms
   * @returns {Array} array of { connectionId, idleTime }
   */
  function checkIdleConnections(pool, timestamp) {
    var cleaned = [];
    var idleMs = pool.idleTimeout * 1000;

    for (var i = 0; i < pool.connections.length; i++) {
      var conn = pool.connections[i];
      if (
        conn.status === STATUS_IDLE &&
        conn.lastActiveAt !== null &&
        timestamp - conn.lastActiveAt >= idleMs
      ) {
        var idleTime = timestamp - conn.lastActiveAt;

        pool.events.push({
          type: "idle-cleanup",
          connectionId: conn.id,
          idleTime: idleTime,
          timestamp: timestamp,
        });

        cleaned.push({
          connectionId: conn.id,
          idleTime: idleTime,
        });

        // Recycle: reset lastActiveAt
        conn.lastActiveAt = timestamp;
        pool.totalIdleCleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Run one tick: check timeouts, idle cleanup, process queue.
   * @param {object} pool
   * @param {number} timestamp — ms
   * @returns {object} { timedOut, idleCleaned, assigned }
   */
  function tick(pool, timestamp) {
    var timedOut = checkTimeouts(pool, timestamp);
    var idleCleaned = checkIdleConnections(pool, timestamp);
    var assigned = processQueue(pool, timestamp);

    return {
      timedOut: timedOut,
      idleCleaned: idleCleaned,
      assigned: assigned,
    };
  }

  /**
   * Create a fresh pool with same config.
   * @param {object} config
   * @returns {object} fresh pool
   */
  function resetPool(config) {
    return createPool(config);
  }

  /**
   * Get stats snapshot.
   * @param {object} pool
   * @returns {object} stats
   */
  function getStats(pool) {
    var activeCount = 0;
    var idleCount = 0;
    for (var i = 0; i < pool.connections.length; i++) {
      if (pool.connections[i].status === STATUS_ACTIVE) {
        activeCount++;
      } else {
        idleCount++;
      }
    }

    return {
      poolSize: pool.poolSize,
      activeConnections: activeCount,
      idleConnections: idleCount,
      queueLength: pool.queue.length,
      maxQueueSize: pool.maxQueueSize,
      connectionTimeout: pool.connectionTimeout,
      idleTimeout: pool.idleTimeout,
      totalAcquired: pool.totalAcquired,
      totalReleased: pool.totalReleased,
      totalTimedOut: pool.totalTimedOut,
      totalIdleCleaned: pool.totalIdleCleaned,
      totalQueueRejected: pool.totalQueueRejected,
      totalQueued: pool.totalQueued,
    };
  }

  // --- Constants ---
  var STATUSES = {
    IDLE: STATUS_IDLE,
    ACTIVE: STATUS_ACTIVE,
  };

  // --- Exports ---
  var exports = {
    createPool: createPool,
    acquire: acquire,
    release: release,
    processQueue: processQueue,
    checkTimeouts: checkTimeouts,
    checkIdleConnections: checkIdleConnections,
    tick: tick,
    reset: resetPool,
    getStats: getStats,
    STATUSES: STATUSES,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  }
  return exports;
})();
