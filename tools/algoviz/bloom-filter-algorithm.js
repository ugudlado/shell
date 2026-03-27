/**
 * Bloom Filter Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements a bloom filter: a probabilistic data structure that can tell you
 * "definitely not in set" or "probably in set" using a bit array and k hash functions.
 *
 * Operations:
 *   createFilter(m, k) — create empty filter with m bits and k hash functions
 *   insert(filter, word) — insert word, setting k bits
 *   query(filter, word) — check membership: true-positive, true-negative, or false-positive
 *   getFalsePositiveRate(n, m, k) — theoretical FP rate: (1 - e^(-kn/m))^k
 *   getFillLevel(filter) — percentage of bits set
 */
var BloomFilterAlgorithm = (function () {
  "use strict";

  /**
   * FNV-1a hash with seed mixing.
   * Returns a deterministic hash index in [0, m).
   * @param {string} word
   * @param {number} seed — hash function index (0..k-1)
   * @param {number} m — bit array size
   * @returns {number}
   */
  function hash(word, seed, m) {
    var FNV_OFFSET = 2166136261;
    var FNV_PRIME = 16777619;
    var h = FNV_OFFSET ^ (seed * 374761393);
    for (var i = 0; i < word.length; i++) {
      h ^= word.charCodeAt(i);
      h = Math.imul(h, FNV_PRIME);
      h = h >>> 0; // keep unsigned 32-bit
    }
    // Extra mixing
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = h >>> 0;
    return h % m;
  }

  /**
   * Get k hash indices for a word.
   * @param {string} word
   * @param {number} k — number of hash functions
   * @param {number} m — bit array size
   * @returns {number[]}
   */
  function getHashIndices(word, k, m) {
    var indices = [];
    for (var i = 0; i < k; i++) {
      indices.push(hash(word, i, m));
    }
    return indices;
  }

  /**
   * Create an empty bloom filter.
   * @param {number} m — bit array size (must be >= 1)
   * @param {number} k — number of hash functions (must be >= 1)
   * @returns {{ bits: number[], m: number, k: number, insertedWords: Object, n: number }}
   */
  function createFilter(m, k) {
    var bits = [];
    for (var i = 0; i < m; i++) {
      bits.push(0);
    }
    return {
      bits: bits,
      m: m,
      k: k,
      insertedWords: {},
      n: 0,
    };
  }

  /**
   * Insert a word into the filter.
   * @param {Object} filter
   * @param {string} word
   * @returns {{ indices: number[], alreadyPresent: boolean }}
   */
  function insert(filter, word) {
    var indices = getHashIndices(word, filter.k, filter.m);
    var alreadyPresent = filter.insertedWords[word] === true;
    for (var i = 0; i < indices.length; i++) {
      filter.bits[indices[i]] = 1;
    }
    if (!alreadyPresent) {
      filter.insertedWords[word] = true;
      filter.n++;
    }
    return { indices: indices, alreadyPresent: alreadyPresent };
  }

  /**
   * Query whether a word might be in the filter.
   * @param {Object} filter
   * @param {string} word
   * @returns {{ indices: number[], allBitsSet: boolean, isKnownInserted: boolean, result: string }}
   */
  function query(filter, word) {
    var indices = getHashIndices(word, filter.k, filter.m);
    var allBitsSet = true;
    for (var i = 0; i < indices.length; i++) {
      if (filter.bits[indices[i]] !== 1) {
        allBitsSet = false;
        break;
      }
    }
    var isKnownInserted = filter.insertedWords[word] === true;
    var result;
    if (!allBitsSet) {
      result = "true-negative";
    } else if (isKnownInserted) {
      result = "true-positive";
    } else {
      result = "false-positive";
    }
    return {
      indices: indices,
      allBitsSet: allBitsSet,
      isKnownInserted: isKnownInserted,
      result: result,
    };
  }

  /**
   * Theoretical false-positive rate: (1 - e^(-kn/m))^k
   * @param {number} n — number of inserted items
   * @param {number} m — bit array size
   * @param {number} k — number of hash functions
   * @returns {number}
   */
  function getFalsePositiveRate(n, m, k) {
    if (n === 0 || m === 0) {
      return 0;
    }
    var exponent = (-k * n) / m;
    return Math.pow(1 - Math.exp(exponent), k);
  }

  /**
   * Get fill level of the bit array.
   * @param {Object} filter
   * @returns {{ setBits: number, total: number, percentage: number }}
   */
  function getFillLevel(filter) {
    var setBits = 0;
    for (var i = 0; i < filter.bits.length; i++) {
      if (filter.bits[i] === 1) {
        setBits++;
      }
    }
    return {
      setBits: setBits,
      total: filter.m,
      percentage: (setBits / filter.m) * 100,
    };
  }

  /**
   * Preset: common passwords for the blacklist demo.
   * @returns {string[]}
   */
  function getPasswordPreset() {
    return [
      "password",
      "123456",
      "qwerty",
      "letmein",
      "admin",
      "welcome",
      "monkey",
      "dragon",
    ];
  }

  return {
    hash: hash,
    getHashIndices: getHashIndices,
    createFilter: createFilter,
    insert: insert,
    query: query,
    getFalsePositiveRate: getFalsePositiveRate,
    getFillLevel: getFillLevel,
    getPasswordPreset: getPasswordPreset,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = BloomFilterAlgorithm;
}
