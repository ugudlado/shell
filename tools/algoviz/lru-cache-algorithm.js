/**
 * LRU Cache Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements an LRU cache using a doubly-linked list (MRU at head, LRU at tail)
 * synchronized with a hash map for O(1) get/put operations.
 *
 * Operations:
 *   put(key, value) — insert or update; evicts LRU if at capacity
 *   get(key)        — returns value and promotes to MRU; returns -1 on miss
 *
 * The doubly-linked list maintains access order.
 * The hash map provides O(1) key lookup to the list node.
 */
var LRUCacheAlgorithm = (function () {
  "use strict";

  /**
   * Create a new doubly-linked list node.
   * @param {string} key
   * @param {*} value
   * @returns {{ key: string, value: *, prev: Object|null, next: Object|null }}
   */
  function createNode(key, value) {
    return { key: key, value: value, prev: null, next: null };
  }

  /**
   * Create an empty LRU cache with the given capacity.
   * @param {number} capacity — max number of entries
   * @returns {{ capacity: number, size: number, head: Object|null, tail: Object|null, map: Object }}
   */
  function createCache(capacity) {
    return {
      capacity: capacity,
      size: 0,
      head: null,
      tail: null,
      map: {},
    };
  }

  /**
   * Remove a node from the doubly-linked list (internal helper).
   * Does NOT remove from map or decrement size.
   * @param {Object} cache
   * @param {Object} node
   */
  function removeNode(cache, node) {
    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      cache.head = node.next;
    }
    if (node.next !== null) {
      node.next.prev = node.prev;
    } else {
      cache.tail = node.prev;
    }
    node.prev = null;
    node.next = null;
  }

  /**
   * Add a node to the front (head) of the list — makes it MRU (internal helper).
   * Does NOT add to map or increment size.
   * @param {Object} cache
   * @param {Object} node
   */
  function addToFront(cache, node) {
    node.prev = null;
    node.next = cache.head;
    if (cache.head !== null) {
      cache.head.prev = node;
    }
    cache.head = node;
    if (cache.tail === null) {
      cache.tail = node;
    }
  }

  /**
   * Move an existing node to the front (head) of the list.
   * @param {Object} cache
   * @param {Object} node
   */
  function moveToFront(cache, node) {
    if (cache.head === node) {
      return; // already MRU
    }
    removeNode(cache, node);
    addToFront(cache, node);
  }

  /**
   * Put a key-value pair into the cache.
   * If key exists, update its value and promote to MRU.
   * If at capacity, evict the LRU entry (tail).
   *
   * @param {Object} cache
   * @param {string} key
   * @param {*} value
   * @returns {{ action: string, evicted: Object|null }}
   *   action: "insert" | "update" | "evict"
   *   evicted: { key, value } of evicted entry, or null
   */
  function put(cache, key, value) {
    // Update existing key
    if (cache.map[key] !== undefined) {
      var existing = cache.map[key];
      existing.value = value;
      moveToFront(cache, existing);
      return { action: "update", evicted: null };
    }

    // New key — check capacity
    var evicted = null;
    var action = "insert";

    if (cache.size >= cache.capacity) {
      // Evict LRU (tail)
      var lruNode = cache.tail;
      evicted = { key: lruNode.key, value: lruNode.value };
      removeNode(cache, lruNode);
      delete cache.map[lruNode.key];
      cache.size--;
      action = "evict";
    }

    // Insert new node at front
    var node = createNode(key, value);
    addToFront(cache, node);
    cache.map[key] = node;
    cache.size++;

    return { action: action, evicted: evicted };
  }

  /**
   * Get the value for a key. On hit, promotes the entry to MRU.
   *
   * @param {Object} cache
   * @param {string} key
   * @returns {{ value: *, hit: boolean }}
   */
  function get(cache, key) {
    if (cache.map[key] === undefined) {
      return { value: -1, hit: false };
    }
    var node = cache.map[key];
    moveToFront(cache, node);
    return { value: node.value, hit: true };
  }

  /**
   * Get the current order of entries from MRU (head) to LRU (tail).
   *
   * @param {Object} cache
   * @returns {Array<{ key: string, value: * }>}
   */
  function getOrder(cache) {
    var result = [];
    var current = cache.head;
    while (current !== null) {
      result.push({ key: current.key, value: current.value });
      current = current.next;
    }
    return result;
  }

  /**
   * Create a snapshot of the map (key -> value, without node pointers).
   * @param {Object} cache
   * @returns {Object}
   */
  function getMapSnapshot(cache) {
    var snapshot = {};
    var keys = Object.keys(cache.map);
    for (var i = 0; i < keys.length; i++) {
      snapshot[keys[i]] = cache.map[keys[i]].value;
    }
    return snapshot;
  }

  /**
   * Put with step recording for visualization.
   * @param {Object} cache
   * @param {string} key
   * @param {*} value
   * @param {Array} steps — array to push step objects into
   * @returns {{ action: string, evicted: Object|null }}
   */
  function putWithSteps(cache, key, value, steps) {
    var result = put(cache, key, value);
    steps.push({
      type: "put",
      key: key,
      value: value,
      action: result.action,
      evicted: result.evicted,
      hit: null,
      order: getOrder(cache),
      mapSnapshot: getMapSnapshot(cache),
      explanation: buildPutExplanation(key, value, result),
    });
    return result;
  }

  /**
   * Get with step recording for visualization.
   * @param {Object} cache
   * @param {string} key
   * @param {Array} steps — array to push step objects into
   * @returns {{ value: *, hit: boolean }}
   */
  function getWithSteps(cache, key, steps) {
    var result = get(cache, key);
    steps.push({
      type: "get",
      key: key,
      value: result.value,
      action: result.hit ? "hit" : "miss",
      evicted: null,
      hit: result.hit,
      order: getOrder(cache),
      mapSnapshot: getMapSnapshot(cache),
      explanation: buildGetExplanation(key, result),
    });
    return result;
  }

  /**
   * Build a human-readable explanation for a put operation.
   */
  function buildPutExplanation(key, value, result) {
    if (result.action === "update") {
      return (
        "put(" +
        key +
        ", " +
        value +
        "): Key exists — updated value and promoted to MRU (head)."
      );
    }
    if (result.action === "evict") {
      return (
        "put(" +
        key +
        ", " +
        value +
        "): Cache full — evicted LRU entry '" +
        result.evicted.key +
        "' (value=" +
        result.evicted.value +
        "), inserted '" +
        key +
        "' at head."
      );
    }
    return (
      "put(" + key + ", " + value + "): Inserted '" + key + "' at head (MRU)."
    );
  }

  /**
   * Build a human-readable explanation for a get operation.
   */
  function buildGetExplanation(key, result) {
    if (result.hit) {
      return (
        "get(" +
        key +
        "): Cache HIT — value=" +
        result.value +
        ", promoted to MRU (head)."
      );
    }
    return "get(" + key + "): Cache MISS — key not found.";
  }

  /**
   * Browser cache preset — simulates a web browser's back/forward cache
   * dropping least recently visited pages.
   *
   * @returns {{ capacity: number, operations: Array<{ type: string, key: string, value: number|undefined }> }}
   */
  function getBrowserCachePreset() {
    return {
      capacity: 4,
      operations: [
        { type: "put", key: "google.com", value: 1 },
        { type: "put", key: "github.com", value: 2 },
        { type: "put", key: "stackoverflow.com", value: 3 },
        { type: "put", key: "docs.python.org", value: 4 },
        { type: "get", key: "google.com" },
        { type: "put", key: "reddit.com", value: 5 },
        { type: "get", key: "github.com" },
        { type: "put", key: "wikipedia.org", value: 6 },
        { type: "get", key: "stackoverflow.com" },
        { type: "put", key: "npmjs.com", value: 7 },
      ],
    };
  }

  return {
    createCache: createCache,
    put: put,
    get: get,
    getOrder: getOrder,
    getMapSnapshot: getMapSnapshot,
    putWithSteps: putWithSteps,
    getWithSteps: getWithSteps,
    getBrowserCachePreset: getBrowserCachePreset,
  };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = LRUCacheAlgorithm;
}
