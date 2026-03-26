/**
 * Binary Search Tree Algorithm
 *
 * Pure functions — no DOM dependency.
 * Provides BST construction, three traversal orderings (inorder, preorder, postorder),
 * and a layout calculator for visualization.
 */
var BSTAlgorithm = (() => {
  "use strict";

  /**
   * Create an empty BST.
   * @returns {{ root: null }}
   */
  function createTree() {
    return { root: null };
  }

  /**
   * Create a new node.
   * @param {number} value
   * @returns {{ value: number, left: null, right: null }}
   */
  function createNode(value) {
    return { value: value, left: null, right: null };
  }

  /**
   * Insert a value into the BST. Mutates tree in place, returns same ref.
   * Values less than current node go left; equal or greater go right.
   *
   * @param {{ root: Object|null }} tree
   * @param {number} value
   * @returns {{ root: Object }}
   */
  function insert(tree, value) {
    var node = createNode(value);
    if (tree.root === null) {
      tree.root = node;
      return tree;
    }
    var current = tree.root;
    while (true) {
      if (value < current.value) {
        if (current.left === null) {
          current.left = node;
          return tree;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = node;
          return tree;
        }
        current = current.right;
      }
    }
  }

  /**
   * Insert multiple values sequentially.
   *
   * @param {{ root: Object|null }} tree
   * @param {number[]} values
   * @returns {{ root: Object }}
   */
  function bulkInsert(tree, values) {
    for (var i = 0; i < values.length; i++) {
      insert(tree, values[i]);
    }
    return tree;
  }

  /**
   * Inorder traversal (left, root, right).
   *
   * @param {{ root: Object|null }} tree
   * @returns {{ steps: Array, result: number[] }}
   */
  function inorder(tree) {
    var steps = [];
    var result = [];

    function traverse(node) {
      if (node === null) return;
      traverse(node.left);
      result.push(node.value);
      steps.push({
        visitedNode: node.value,
        visitedValues: result.slice(),
        currentNode: node.value,
        explanation:
          "Visit node " +
          node.value +
          " (inorder: left subtree done, visit root)",
      });
      traverse(node.right);
    }

    traverse(tree.root);

    // Add done step
    steps.push({
      visitedNode: null,
      visitedValues: result.slice(),
      currentNode: null,
      explanation:
        "Inorder traversal complete! Result: [" + result.join(", ") + "]",
    });

    return { steps: steps, result: result };
  }

  /**
   * Preorder traversal (root, left, right).
   *
   * @param {{ root: Object|null }} tree
   * @returns {{ steps: Array, result: number[] }}
   */
  function preorder(tree) {
    var steps = [];
    var result = [];

    function traverse(node) {
      if (node === null) return;
      result.push(node.value);
      steps.push({
        visitedNode: node.value,
        visitedValues: result.slice(),
        currentNode: node.value,
        explanation:
          "Visit node " +
          node.value +
          " (preorder: visit root first)",
      });
      traverse(node.left);
      traverse(node.right);
    }

    traverse(tree.root);

    steps.push({
      visitedNode: null,
      visitedValues: result.slice(),
      currentNode: null,
      explanation:
        "Preorder traversal complete! Result: [" + result.join(", ") + "]",
    });

    return { steps: steps, result: result };
  }

  /**
   * Postorder traversal (left, right, root).
   *
   * @param {{ root: Object|null }} tree
   * @returns {{ steps: Array, result: number[] }}
   */
  function postorder(tree) {
    var steps = [];
    var result = [];

    function traverse(node) {
      if (node === null) return;
      traverse(node.left);
      traverse(node.right);
      result.push(node.value);
      steps.push({
        visitedNode: node.value,
        visitedValues: result.slice(),
        currentNode: node.value,
        explanation:
          "Visit node " +
          node.value +
          " (postorder: both subtrees done, visit root)",
      });
    }

    traverse(tree.root);

    steps.push({
      visitedNode: null,
      visitedValues: result.slice(),
      currentNode: null,
      explanation:
        "Postorder traversal complete! Result: [" + result.join(", ") + "]",
    });

    return { steps: steps, result: result };
  }

  /**
   * Compute layout positions for tree nodes (for SVG rendering).
   * Returns positioned nodes and edges.
   *
   * @param {{ root: Object|null }} tree
   * @param {number} [width=600] - available width
   * @param {number} [verticalSpacing=70] - vertical gap between levels
   * @returns {{ nodes: Array<{value: number, x: number, y: number}>, edges: Array<{fromX: number, fromY: number, toX: number, toY: number}> }}
   */
  function getLayout(tree, width, verticalSpacing) {
    width = width || 600;
    verticalSpacing = verticalSpacing || 70;
    var topPadding = 30;

    var nodes = [];
    var edges = [];

    if (tree.root === null) {
      return { nodes: nodes, edges: edges };
    }

    function layoutNode(node, x, y, spread) {
      if (node === null) return;

      nodes.push({ value: node.value, x: x, y: y });

      var childY = y + verticalSpacing;
      var childSpread = spread / 2;

      if (node.left !== null) {
        var leftX = x - childSpread;
        edges.push({ fromX: x, fromY: y, toX: leftX, toY: childY });
        layoutNode(node.left, leftX, childY, childSpread);
      }

      if (node.right !== null) {
        var rightX = x + childSpread;
        edges.push({ fromX: x, fromY: y, toX: rightX, toY: childY });
        layoutNode(node.right, rightX, childY, childSpread);
      }
    }

    layoutNode(tree.root, width / 2, topPadding, width / 4);

    return { nodes: nodes, edges: edges };
  }

  /**
   * Count nodes in the tree.
   *
   * @param {{ root: Object|null }} tree
   * @returns {number}
   */
  function size(tree) {
    function count(node) {
      if (node === null) return 0;
      return 1 + count(node.left) + count(node.right);
    }
    return count(tree.root);
  }

  return {
    createTree: createTree,
    insert: insert,
    bulkInsert: bulkInsert,
    inorder: inorder,
    preorder: preorder,
    postorder: postorder,
    getLayout: getLayout,
    size: size,
  };
})();

// Node.js module export (for test runner)
if (typeof module !== "undefined" && module.exports) {
  module.exports = BSTAlgorithm;
}
