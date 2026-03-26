/**
 * Hash Table Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements a hash table with separate chaining for collision resolution.
 * Hash function: sum of character codes modulo bucket count.
 */
var HashTableAlgorithm = (() => {
  "use strict";

  /**
   * Create a new empty hash table.
   * @param {number} bucketCount - Number of buckets (default 8)
   * @returns {{ buckets: Array<Array<{key: string, value: string}>>, bucketCount: number, size: number }}
   */
  function createTable(bucketCount) {
    var count = typeof bucketCount === "number" && bucketCount >= 1 ? Math.floor(bucketCount) : 8;
    if (count < 1) count = 1;
    if (count > 64) count = 64;
    var buckets = [];
    for (var i = 0; i < count; i++) {
      buckets.push([]);
    }
    return { buckets: buckets, bucketCount: count, size: 0 };
  }

  /**
   * Hash a key to a bucket index with step-by-step breakdown.
   * @param {string} key
   * @param {number} bucketCount
   * @returns {{ charCodes: number[], sum: number, index: number }}
   */
  function hash(key, bucketCount) {
    var str = String(key);
    var charCodes = [];
    var sum = 0;
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      charCodes.push(code);
      sum += code;
    }
    var index = bucketCount > 0 ? sum % bucketCount : 0;
    return { charCodes: charCodes, sum: sum, index: index };
  }

  /**
   * Deep-copy a table state.
   */
  function cloneTable(table) {
    var buckets = [];
    for (var i = 0; i < table.bucketCount; i++) {
      var chain = [];
      for (var j = 0; j < table.buckets[i].length; j++) {
        chain.push({ key: table.buckets[i][j].key, value: table.buckets[i][j].value });
      }
      buckets.push(chain);
    }
    return { buckets: buckets, bucketCount: table.bucketCount, size: table.size };
  }

  /**
   * Insert a key-value pair into the hash table.
   * If the key already exists, update its value.
   * @param {{ buckets, bucketCount, size }} table
   * @param {string} key
   * @param {string} value
   * @returns {{ table, steps: Array<{type: string, detail: string}>, collision: boolean, updated: boolean }}
   */
  function insert(table, key, value) {
    var t = cloneTable(table);
    var steps = [];
    var keyStr = String(key);
    var valStr = String(value);

    // Step 1: compute hash
    var h = hash(keyStr, t.bucketCount);
    steps.push({
      type: "hash",
      detail: "Hash(\"" + keyStr + "\") = " + h.sum + " % " + t.bucketCount + " = " + h.index,
      bucketIndex: h.index,
      charCodes: h.charCodes,
      sum: h.sum,
    });

    var bucket = t.buckets[h.index];
    var collision = bucket.length > 0;

    // Step 2: check for existing key (traverse chain)
    var found = false;
    for (var i = 0; i < bucket.length; i++) {
      steps.push({
        type: "traverse",
        detail: "Check chain[" + i + "]: key=\"" + bucket[i].key + "\"",
        bucketIndex: h.index,
        chainIndex: i,
      });
      if (bucket[i].key === keyStr) {
        // Update existing
        bucket[i].value = valStr;
        found = true;
        steps.push({
          type: "update",
          detail: "Key \"" + keyStr + "\" exists — updated value to \"" + valStr + "\"",
          bucketIndex: h.index,
          chainIndex: i,
        });
        break;
      }
    }

    if (!found) {
      // Step 3: append to chain
      if (collision) {
        steps.push({
          type: "collision",
          detail: "Collision at bucket " + h.index + " — chaining",
          bucketIndex: h.index,
        });
      }
      bucket.push({ key: keyStr, value: valStr });
      t.size++;
      steps.push({
        type: "insert",
        detail: "Inserted \"" + keyStr + "\": \"" + valStr + "\" at bucket " + h.index + ", chain position " + (bucket.length - 1),
        bucketIndex: h.index,
        chainIndex: bucket.length - 1,
      });
    }

    return { table: t, steps: steps, collision: collision, updated: found };
  }

  /**
   * Search for a key in the hash table.
   * @param {{ buckets, bucketCount, size }} table
   * @param {string} key
   * @returns {{ found: boolean, value: string|null, steps: Array, bucketIndex: number, chainIndex: number }}
   */
  function search(table, key) {
    var keyStr = String(key);
    var steps = [];

    var h = hash(keyStr, table.bucketCount);
    steps.push({
      type: "hash",
      detail: "Hash(\"" + keyStr + "\") = " + h.sum + " % " + table.bucketCount + " = " + h.index,
      bucketIndex: h.index,
      charCodes: h.charCodes,
      sum: h.sum,
    });

    var bucket = table.buckets[h.index];

    for (var i = 0; i < bucket.length; i++) {
      steps.push({
        type: "traverse",
        detail: "Check chain[" + i + "]: key=\"" + bucket[i].key + "\"",
        bucketIndex: h.index,
        chainIndex: i,
      });
      if (bucket[i].key === keyStr) {
        steps.push({
          type: "found",
          detail: "Found \"" + keyStr + "\" = \"" + bucket[i].value + "\"",
          bucketIndex: h.index,
          chainIndex: i,
        });
        return { found: true, value: bucket[i].value, steps: steps, bucketIndex: h.index, chainIndex: i };
      }
    }

    steps.push({
      type: "not_found",
      detail: "Key \"" + keyStr + "\" not found in bucket " + h.index,
      bucketIndex: h.index,
      chainIndex: -1,
    });
    return { found: false, value: null, steps: steps, bucketIndex: h.index, chainIndex: -1 };
  }

  /**
   * Remove a key from the hash table.
   * @param {{ buckets, bucketCount, size }} table
   * @param {string} key
   * @returns {{ table, removed: boolean, steps: Array }}
   */
  function remove(table, key) {
    var t = cloneTable(table);
    var keyStr = String(key);
    var steps = [];

    var h = hash(keyStr, t.bucketCount);
    steps.push({
      type: "hash",
      detail: "Hash(\"" + keyStr + "\") = " + h.sum + " % " + t.bucketCount + " = " + h.index,
      bucketIndex: h.index,
    });

    var bucket = t.buckets[h.index];

    for (var i = 0; i < bucket.length; i++) {
      steps.push({
        type: "traverse",
        detail: "Check chain[" + i + "]: key=\"" + bucket[i].key + "\"",
        bucketIndex: h.index,
        chainIndex: i,
      });
      if (bucket[i].key === keyStr) {
        bucket.splice(i, 1);
        t.size--;
        steps.push({
          type: "remove",
          detail: "Removed \"" + keyStr + "\" from bucket " + h.index,
          bucketIndex: h.index,
          chainIndex: i,
        });
        return { table: t, removed: true, steps: steps };
      }
    }

    steps.push({
      type: "not_found",
      detail: "Key \"" + keyStr + "\" not found — nothing to remove",
      bucketIndex: h.index,
    });
    return { table: t, removed: false, steps: steps };
  }

  /**
   * Get statistics about the hash table.
   * @param {{ buckets, bucketCount, size }} table
   * @returns {{ size: number, bucketCount: number, loadFactor: number, longestChain: number, collisionCount: number, emptyBuckets: number }}
   */
  function getStats(table) {
    var longestChain = 0;
    var collisionCount = 0;
    var emptyBuckets = 0;

    for (var i = 0; i < table.bucketCount; i++) {
      var len = table.buckets[i].length;
      if (len > longestChain) longestChain = len;
      if (len > 1) collisionCount += len - 1;
      if (len === 0) emptyBuckets++;
    }

    return {
      size: table.size,
      bucketCount: table.bucketCount,
      loadFactor: table.bucketCount > 0 ? Math.round((table.size / table.bucketCount) * 100) / 100 : 0,
      longestChain: longestChain,
      collisionCount: collisionCount,
      emptyBuckets: emptyBuckets,
    };
  }

  return {
    createTable: createTable,
    hash: hash,
    insert: insert,
    search: search,
    remove: remove,
    getStats: getStats,
  };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = HashTableAlgorithm;
}
