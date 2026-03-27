/**
 * BST Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 */

function runTests({ assert, assertEqual }) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  const BSTAlgorithm = require("./bst-algorithm.js");

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

  // --- createTree ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    assertEqual(tree.root, null, "Empty tree has null root");
  }, "createTree returns empty tree");

  // --- insert ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.insert(tree, 5);
    assertEqual(tree.root.value, 5, "Root is 5");
    assertEqual(tree.root.left, null, "No left child");
    assertEqual(tree.root.right, null, "No right child");
  }, "Insert single value as root");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.insert(tree, 5);
    BSTAlgorithm.insert(tree, 3);
    assertEqual(tree.root.left.value, 3, "Left child is 3");
  }, "Insert smaller value goes left");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.insert(tree, 5);
    BSTAlgorithm.insert(tree, 7);
    assertEqual(tree.root.right.value, 7, "Right child is 7");
  }, "Insert larger value goes right");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.insert(tree, 5);
    BSTAlgorithm.insert(tree, 5);
    assertEqual(tree.root.right.value, 5, "Duplicate goes right");
  }, "Insert equal value goes right");

  // --- bulkInsert ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7, 1, 4, 6, 8]);
    assertEqual(tree.root.value, 5, "Root");
    assertEqual(tree.root.left.value, 3, "Left child");
    assertEqual(tree.root.right.value, 7, "Right child");
    assertEqual(tree.root.left.left.value, 1, "Left-left");
    assertEqual(tree.root.left.right.value, 4, "Left-right");
    assertEqual(tree.root.right.left.value, 6, "Right-left");
    assertEqual(tree.root.right.right.value, 8, "Right-right");
  }, "bulkInsert builds correct tree structure");

  // --- Inorder traversal ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7, 1, 4, 6, 8]);
    const result = BSTAlgorithm.inorder(tree);
    assertEqual(result.result, [1, 3, 4, 5, 6, 7, 8], "Inorder result");
  }, "Inorder traversal returns sorted order");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7, 1, 4, 6, 8]);
    const result = BSTAlgorithm.inorder(tree);
    // 7 visit steps + 1 done step = 8
    assertEqual(result.steps.length, 8, "7 visits + 1 done step");
  }, "Inorder step count matches node count + done");

  // --- Preorder traversal ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7, 1, 4, 6, 8]);
    const result = BSTAlgorithm.preorder(tree);
    assertEqual(result.result, [5, 3, 1, 4, 7, 6, 8], "Preorder result");
  }, "Preorder traversal visits root first");

  // --- Postorder traversal ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7, 1, 4, 6, 8]);
    const result = BSTAlgorithm.postorder(tree);
    assertEqual(result.result, [1, 4, 3, 6, 8, 7, 5], "Postorder result");
  }, "Postorder traversal visits root last");

  // --- Empty tree traversals ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    const inRes = BSTAlgorithm.inorder(tree);
    assertEqual(inRes.result, [], "Empty inorder");
    assertEqual(inRes.steps.length, 1, "Only done step");
  }, "Inorder on empty tree");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    const preRes = BSTAlgorithm.preorder(tree);
    assertEqual(preRes.result, [], "Empty preorder");
  }, "Preorder on empty tree");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    const postRes = BSTAlgorithm.postorder(tree);
    assertEqual(postRes.result, [], "Empty postorder");
  }, "Postorder on empty tree");

  // --- Single node ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.insert(tree, 42);
    const inRes = BSTAlgorithm.inorder(tree);
    assertEqual(inRes.result, [42], "Single inorder");
    const preRes = BSTAlgorithm.preorder(tree);
    assertEqual(preRes.result, [42], "Single preorder");
    const postRes = BSTAlgorithm.postorder(tree);
    assertEqual(postRes.result, [42], "Single postorder");
  }, "Single node tree: all traversals return [42]");

  // --- Step structure ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7]);
    const result = BSTAlgorithm.inorder(tree);
    const step = result.steps[0];
    assert(typeof step.visitedNode === "number", "visitedNode is number");
    assert(Array.isArray(step.visitedValues), "visitedValues is array");
    assert(typeof step.currentNode === "number", "currentNode is number");
    assert(typeof step.explanation === "string", "explanation is string");
  }, "Step object has correct structure");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7]);
    const result = BSTAlgorithm.inorder(tree);
    const doneStep = result.steps[result.steps.length - 1];
    assertEqual(doneStep.visitedNode, null, "Done step visitedNode is null");
    assertEqual(doneStep.currentNode, null, "Done step currentNode is null");
    assert(
      doneStep.explanation.indexOf("complete") >= 0,
      "Done step mentions complete",
    );
  }, "Done step structure");

  // --- visitedValues is cumulative ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7]);
    const result = BSTAlgorithm.inorder(tree);
    // Inorder: 3, 5, 7
    assertEqual(result.steps[0].visitedValues, [3], "After first visit");
    assertEqual(result.steps[1].visitedValues, [3, 5], "After second visit");
    assertEqual(result.steps[2].visitedValues, [3, 5, 7], "After third visit");
  }, "visitedValues accumulates correctly");

  // --- getLayout ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    const layout = BSTAlgorithm.getLayout(tree);
    assertEqual(layout.nodes.length, 0, "No nodes");
    assertEqual(layout.edges.length, 0, "No edges");
  }, "getLayout on empty tree");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.insert(tree, 5);
    const layout = BSTAlgorithm.getLayout(tree, 600, 70);
    assertEqual(layout.nodes.length, 1, "One node");
    assertEqual(layout.edges.length, 0, "No edges");
    assertEqual(layout.nodes[0].value, 5, "Node value");
    assert(typeof layout.nodes[0].x === "number", "Has x");
    assert(typeof layout.nodes[0].y === "number", "Has y");
  }, "getLayout single node");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7]);
    const layout = BSTAlgorithm.getLayout(tree, 600, 70);
    assertEqual(layout.nodes.length, 3, "Three nodes");
    assertEqual(layout.edges.length, 2, "Two edges");
    // Root should be at center x
    assertEqual(layout.nodes[0].x, 300, "Root at center x");
    // Left child should be left of root
    assert(layout.nodes[1].x < layout.nodes[0].x, "Left child left of root");
    // Right child should be right of root
    assert(layout.nodes[2].x > layout.nodes[0].x, "Right child right of root");
  }, "getLayout positions children correctly");

  // --- size ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    assertEqual(BSTAlgorithm.size(tree), 0, "Empty tree size");
  }, "Size of empty tree is 0");

  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 3, 7, 1, 4, 6, 8]);
    assertEqual(BSTAlgorithm.size(tree), 7, "Size is 7");
  }, "Size of 7-node tree");

  // --- Unbalanced tree (all left) ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [5, 4, 3, 2, 1]);
    const result = BSTAlgorithm.inorder(tree);
    assertEqual(result.result, [1, 2, 3, 4, 5], "Inorder still sorted");
  }, "Unbalanced (left-skewed) tree traversal");

  // --- Unbalanced tree (all right) ---
  check(() => {
    const tree = BSTAlgorithm.createTree();
    BSTAlgorithm.bulkInsert(tree, [1, 2, 3, 4, 5]);
    const preResult = BSTAlgorithm.preorder(tree);
    assertEqual(preResult.result, [1, 2, 3, 4, 5], "Preorder on right-skewed");
  }, "Unbalanced (right-skewed) tree traversal");

  return { passed, failed, failures };
}

module.exports = { runTests };
