/**
 * Pub/Sub Algorithm Tests — Node.js runner compatible
 * Exports runTests() for run-tests.js harness
 *
 * Tests cover: broker creation, topic management, publisher/subscriber management,
 * message routing, fan-out, backpressure, delivery guarantees (at-most-once,
 * at-least-once), edge cases (0 subscribers, no matching topic, queue overflow,
 * duplicate IDs, invalid inputs).
 */

function runTests({ assert, assertEqual }) {
  var passed = 0;
  var failed = 0;
  var failures = [];

  var PubSubAlgorithm = require("./pubsub-algorithm.js");

  function check(fn, name) {
    try {
      fn();
      passed++;
      console.log("  PASS: " + name);
    } catch (e) {
      failed++;
      failures.push({ name: name, message: e.message });
      console.log("  FAIL: " + name + " — " + e.message);
    }
  }

  // ===========================
  // BROKER — Creation
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    assert(broker.topics !== undefined, "has topics");
    assert(broker.publishers !== undefined, "has publishers");
    assert(broker.subscribers !== undefined, "has subscribers");
    assertEqual(broker.messageLog.length, 0, "empty message log");
    assertEqual(broker.nextId, 1, "nextId starts at 1");
    assertEqual(broker.totalDelivered, 0, "totalDelivered starts at 0");
    assertEqual(broker.totalDropped, 0, "totalDropped starts at 0");
  }, "createBroker returns correct initial state");

  // ===========================
  // TOPIC — Add/Remove
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    var result = PubSubAlgorithm.addTopic(broker, "orders");
    assertEqual(result.success, true, "topic added");
    assert(broker.topics["orders"] !== undefined, "topic exists");
    assertEqual(broker.topics["orders"].subscribers.length, 0, "no subscribers yet");
  }, "addTopic creates a topic");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "orders");
    var result = PubSubAlgorithm.addTopic(broker, "orders");
    assertEqual(result.success, false, "duplicate rejected");
    assert(result.error.indexOf("already exists") !== -1, "error mentions already exists");
  }, "addTopic rejects duplicate topic");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    var r1 = PubSubAlgorithm.addTopic(broker, "");
    assertEqual(r1.success, false, "empty name rejected");
    var r2 = PubSubAlgorithm.addTopic(broker, "a".repeat(31));
    assertEqual(r2.success, false, "too-long name rejected");
  }, "addTopic validates name length (1-30)");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "orders");
    var result = PubSubAlgorithm.removeTopic(broker, "orders");
    assertEqual(result.success, true, "topic removed");
    assertEqual(broker.topics["orders"], undefined, "topic gone");
  }, "removeTopic removes a topic");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    var result = PubSubAlgorithm.removeTopic(broker, "nope");
    assertEqual(result.success, false, "nonexistent topic rejected");
  }, "removeTopic rejects nonexistent topic");

  // ===========================
  // PUBLISHER — Add/Remove
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "trips");
    var result = PubSubAlgorithm.addPublisher(broker, "pub1", "trips");
    assertEqual(result.success, true, "publisher added");
    assertEqual(broker.publishers["pub1"].topicName, "trips", "assigned to topic");
  }, "addPublisher registers a publisher");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    var result = PubSubAlgorithm.addPublisher(broker, "pub1", "nope");
    assertEqual(result.success, false, "rejected for nonexistent topic");
  }, "addPublisher rejects nonexistent topic");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    var result = PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    assertEqual(result.success, false, "duplicate rejected");
  }, "addPublisher rejects duplicate ID");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    var r1 = PubSubAlgorithm.addPublisher(broker, "", "t");
    assertEqual(r1.success, false, "empty ID rejected");
    var r2 = PubSubAlgorithm.addPublisher(broker, "a".repeat(21), "t");
    assertEqual(r2.success, false, "too-long ID rejected");
  }, "addPublisher validates ID length (1-20)");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    var result = PubSubAlgorithm.removePublisher(broker, "pub1");
    assertEqual(result.success, true, "removed");
    assertEqual(broker.publishers["pub1"], undefined, "publisher gone");
  }, "removePublisher removes a publisher");

  // ===========================
  // SUBSCRIBER — Add/Remove
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "trips");
    var result = PubSubAlgorithm.addSubscriber(broker, "sub1", "trips", {
      processingDelay: 500,
      maxQueueSize: 5,
      guarantee: "at-most-once",
    });
    assertEqual(result.success, true, "subscriber added");
    var sub = broker.subscribers["sub1"];
    assertEqual(sub.topicName, "trips", "correct topic");
    assertEqual(sub.processingDelay, 500, "processing delay");
    assertEqual(sub.maxQueueSize, 5, "max queue size");
    assertEqual(sub.guarantee, "at-most-once", "guarantee");
    assertEqual(sub.queue.length, 0, "empty queue");
    assertEqual(sub.delivered, 0, "delivered starts at 0");
    assertEqual(sub.dropped, 0, "dropped starts at 0");
  }, "addSubscriber registers with options");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t");
    var sub = broker.subscribers["sub1"];
    assertEqual(sub.processingDelay, 1000, "default delay 1000");
    assertEqual(sub.maxQueueSize, 10, "default queue 10");
    assertEqual(sub.guarantee, "at-most-once", "default guarantee");
  }, "addSubscriber uses defaults when no options");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    // processingDelay below min should clamp to 100
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t", { processingDelay: 10 });
    assertEqual(broker.subscribers["sub1"].processingDelay, 100, "clamped to min 100");
    // maxQueueSize above max should clamp to 100
    PubSubAlgorithm.addSubscriber(broker, "sub2", "t", { maxQueueSize: 999 });
    assertEqual(broker.subscribers["sub2"].maxQueueSize, 100, "clamped to max 100");
  }, "addSubscriber clamps options to valid bounds");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t");
    assert(broker.topics["t"].subscribers.indexOf("sub1") !== -1, "subscriber in topic list");
    PubSubAlgorithm.removeSubscriber(broker, "sub1");
    assertEqual(broker.subscribers["sub1"], undefined, "subscriber gone");
    assertEqual(broker.topics["t"].subscribers.indexOf("sub1"), -1, "removed from topic list");
  }, "removeSubscriber cleans up topic association");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    var result = PubSubAlgorithm.addSubscriber(broker, "sub1", "nope");
    assertEqual(result.success, false, "rejected for nonexistent topic");
  }, "addSubscriber rejects nonexistent topic");

  // ===========================
  // PUBLISH — Basic routing
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "trips");
    PubSubAlgorithm.addPublisher(broker, "pub1", "trips");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "trips");
    var result = PubSubAlgorithm.publish(broker, "pub1", "trip-started");
    assertEqual(result.messageId, 1, "message ID is 1");
    assertEqual(result.topicName, "trips", "correct topic");
    assertEqual(result.deliveries.length, 1, "one delivery");
    assertEqual(result.deliveries[0], "sub1", "delivered to sub1");
    assertEqual(result.dropped.length, 0, "nothing dropped");
    assertEqual(broker.subscribers["sub1"].queue.length, 1, "message in queue");
    assertEqual(broker.subscribers["sub1"].queue[0].payload, "trip-started", "correct payload");
  }, "publish routes message to matching subscriber");

  // ===========================
  // PUBLISH — Fan-out to multiple subscribers
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "trips");
    PubSubAlgorithm.addPublisher(broker, "pub1", "trips");
    PubSubAlgorithm.addSubscriber(broker, "billing", "trips");
    PubSubAlgorithm.addSubscriber(broker, "notif", "trips");
    PubSubAlgorithm.addSubscriber(broker, "analytics", "trips");
    var result = PubSubAlgorithm.publish(broker, "pub1", "trip-complete");
    assertEqual(result.deliveries.length, 3, "fan-out to 3 subscribers");
    assertEqual(broker.subscribers["billing"].queue.length, 1, "billing got message");
    assertEqual(broker.subscribers["notif"].queue.length, 1, "notif got message");
    assertEqual(broker.subscribers["analytics"].queue.length, 1, "analytics got message");
  }, "publish fans out to all topic subscribers");

  // ===========================
  // PUBLISH — Topic filtering (no cross-topic delivery)
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "trips");
    PubSubAlgorithm.addTopic(broker, "payments");
    PubSubAlgorithm.addPublisher(broker, "pub1", "trips");
    PubSubAlgorithm.addSubscriber(broker, "sub-trips", "trips");
    PubSubAlgorithm.addSubscriber(broker, "sub-payments", "payments");
    var result = PubSubAlgorithm.publish(broker, "pub1", "trip-event");
    assertEqual(result.deliveries.length, 1, "only trips subscriber");
    assertEqual(result.deliveries[0], "sub-trips", "correct subscriber");
    assertEqual(broker.subscribers["sub-payments"].queue.length, 0, "payments subscriber unaffected");
  }, "publish only routes to subscribers of the correct topic");

  // ===========================
  // PUBLISH — 0 subscribers
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "empty");
    PubSubAlgorithm.addPublisher(broker, "pub1", "empty");
    var result = PubSubAlgorithm.publish(broker, "pub1", "hello");
    assertEqual(result.messageId, 1, "message still gets ID");
    assertEqual(result.deliveries.length, 0, "no deliveries");
    assertEqual(result.dropped.length, 0, "no drops");
    assertEqual(broker.messageLog.length, 1, "message still logged");
  }, "publish to topic with 0 subscribers — message logged, no deliveries");

  // ===========================
  // PUBLISH — Nonexistent publisher
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    var result = PubSubAlgorithm.publish(broker, "ghost", "data");
    assertEqual(result.messageId, null, "no message ID");
    assert(result.error !== undefined, "has error");
  }, "publish with nonexistent publisher returns error");

  // ===========================
  // BACKPRESSURE — at-most-once drops
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    PubSubAlgorithm.addSubscriber(broker, "slow", "t", {
      maxQueueSize: 3,
      guarantee: "at-most-once",
    });
    // Fill the queue
    PubSubAlgorithm.publish(broker, "pub1", "msg1");
    PubSubAlgorithm.publish(broker, "pub1", "msg2");
    PubSubAlgorithm.publish(broker, "pub1", "msg3");
    assertEqual(broker.subscribers["slow"].queue.length, 3, "queue full");
    // This should be dropped
    var result = PubSubAlgorithm.publish(broker, "pub1", "msg4");
    assertEqual(result.dropped.length, 1, "one dropped");
    assertEqual(result.dropped[0], "slow", "dropped for slow");
    assertEqual(result.deliveries.length, 0, "no deliveries");
    assertEqual(broker.subscribers["slow"].queue.length, 3, "queue still at max");
    assertEqual(broker.subscribers["slow"].dropped, 1, "dropped counter incremented");
    assertEqual(broker.totalDropped, 1, "broker totalDropped incremented");
  }, "at-most-once drops message when queue full");

  // ===========================
  // BACKPRESSURE — at-least-once enqueues beyond max
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t", {
      maxQueueSize: 2,
      guarantee: "at-least-once",
    });
    PubSubAlgorithm.publish(broker, "pub1", "msg1");
    PubSubAlgorithm.publish(broker, "pub1", "msg2");
    assertEqual(broker.subscribers["sub1"].queue.length, 2, "queue at max");
    // This should still be enqueued (at-least-once)
    var result = PubSubAlgorithm.publish(broker, "pub1", "msg3");
    assertEqual(result.deliveries.length, 1, "still delivered");
    assertEqual(result.dropped.length, 0, "nothing dropped");
    assertEqual(broker.subscribers["sub1"].queue.length, 3, "queue exceeds max");
    assertEqual(broker.subscribers["sub1"].retries, 1, "retry counted");
  }, "at-least-once enqueues beyond max queue size");

  // ===========================
  // PROCESS — Dequeue messages
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t");
    PubSubAlgorithm.publish(broker, "pub1", "first");
    PubSubAlgorithm.publish(broker, "pub1", "second");
    var r1 = PubSubAlgorithm.processNextMessage(broker, "sub1");
    assertEqual(r1.empty, false, "not empty");
    assertEqual(r1.message.payload, "first", "FIFO order — first message");
    var r2 = PubSubAlgorithm.processNextMessage(broker, "sub1");
    assertEqual(r2.message.payload, "second", "second message");
    var r3 = PubSubAlgorithm.processNextMessage(broker, "sub1");
    assertEqual(r3.empty, true, "queue empty after processing");
    assertEqual(r3.message, null, "no message");
  }, "processNextMessage dequeues in FIFO order");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    var result = PubSubAlgorithm.processNextMessage(broker, "ghost");
    assertEqual(result.empty, true, "empty for nonexistent");
    assert(result.error !== undefined, "has error");
  }, "processNextMessage for nonexistent subscriber returns error");

  // ===========================
  // QUEUE DEPTH
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t");
    assertEqual(PubSubAlgorithm.getSubscriberQueueDepth(broker, "sub1"), 0, "starts at 0");
    PubSubAlgorithm.publish(broker, "pub1", "a");
    PubSubAlgorithm.publish(broker, "pub1", "b");
    assertEqual(PubSubAlgorithm.getSubscriberQueueDepth(broker, "sub1"), 2, "depth is 2");
    PubSubAlgorithm.processNextMessage(broker, "sub1");
    assertEqual(PubSubAlgorithm.getSubscriberQueueDepth(broker, "sub1"), 1, "depth is 1 after process");
  }, "getSubscriberQueueDepth tracks queue size");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    assertEqual(PubSubAlgorithm.getSubscriberQueueDepth(broker, "nope"), 0, "0 for nonexistent");
  }, "getSubscriberQueueDepth returns 0 for nonexistent subscriber");

  // ===========================
  // GET SUBSCRIBER QUEUE
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t");
    PubSubAlgorithm.publish(broker, "pub1", "x");
    var q = PubSubAlgorithm.getSubscriberQueue(broker, "sub1");
    assertEqual(q.length, 1, "queue has 1 message");
    assertEqual(q[0].payload, "x", "correct payload");
    // Verify it's a copy
    q.push({ payload: "fake" });
    assertEqual(PubSubAlgorithm.getSubscriberQueueDepth(broker, "sub1"), 1, "original unchanged");
  }, "getSubscriberQueue returns a copy of the queue");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    var q = PubSubAlgorithm.getSubscriberQueue(broker, "nope");
    assertEqual(q.length, 0, "empty for nonexistent");
  }, "getSubscriberQueue returns empty array for nonexistent subscriber");

  // ===========================
  // BROKER STATS
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t1");
    PubSubAlgorithm.addTopic(broker, "t2");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t1");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t1");
    PubSubAlgorithm.addSubscriber(broker, "sub2", "t2");
    PubSubAlgorithm.publish(broker, "pub1", "msg");
    var stats = PubSubAlgorithm.getBrokerStats(broker);
    assertEqual(stats.topicCount, 2, "2 topics");
    assertEqual(stats.publisherCount, 1, "1 publisher");
    assertEqual(stats.subscriberCount, 2, "2 subscribers");
    assertEqual(stats.totalMessages, 1, "1 message");
    assertEqual(stats.totalDelivered, 1, "1 delivered");
    assertEqual(stats.totalDropped, 0, "0 dropped");
  }, "getBrokerStats returns correct aggregates");

  // ===========================
  // EDGE — removeTopic cascades
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t");
    PubSubAlgorithm.removeTopic(broker, "t");
    assertEqual(broker.publishers["pub1"], undefined, "publisher removed");
    assertEqual(broker.subscribers["sub1"], undefined, "subscriber removed");
  }, "removeTopic cascades to publishers and subscribers");

  // ===========================
  // EDGE — Message IDs increment
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t", { maxQueueSize: 100 });
    var r1 = PubSubAlgorithm.publish(broker, "pub1", "a");
    var r2 = PubSubAlgorithm.publish(broker, "pub1", "b");
    var r3 = PubSubAlgorithm.publish(broker, "pub1", "c");
    assertEqual(r1.messageId, 1, "first ID is 1");
    assertEqual(r2.messageId, 2, "second ID is 2");
    assertEqual(r3.messageId, 3, "third ID is 3");
  }, "message IDs increment monotonically");

  // ===========================
  // EDGE — Multiple drops accumulate
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    PubSubAlgorithm.addSubscriber(broker, "slow", "t", {
      maxQueueSize: 1,
      guarantee: "at-most-once",
    });
    PubSubAlgorithm.publish(broker, "pub1", "a"); // queued
    PubSubAlgorithm.publish(broker, "pub1", "b"); // dropped
    PubSubAlgorithm.publish(broker, "pub1", "c"); // dropped
    PubSubAlgorithm.publish(broker, "pub1", "d"); // dropped
    assertEqual(broker.subscribers["slow"].dropped, 3, "3 drops");
    assertEqual(broker.subscribers["slow"].queue.length, 1, "queue stays at 1");
    assertEqual(broker.totalDropped, 3, "broker total 3 drops");
  }, "multiple drops accumulate correctly");

  // ===========================
  // EDGE — Mixed guarantees on same topic
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addPublisher(broker, "pub1", "t");
    PubSubAlgorithm.addSubscriber(broker, "fast", "t", {
      maxQueueSize: 1,
      guarantee: "at-most-once",
    });
    PubSubAlgorithm.addSubscriber(broker, "reliable", "t", {
      maxQueueSize: 1,
      guarantee: "at-least-once",
    });
    PubSubAlgorithm.publish(broker, "pub1", "msg1"); // both get it
    PubSubAlgorithm.publish(broker, "pub1", "msg2"); // fast drops, reliable enqueues
    assertEqual(broker.subscribers["fast"].queue.length, 1, "fast queue at max");
    assertEqual(broker.subscribers["fast"].dropped, 1, "fast dropped 1");
    assertEqual(broker.subscribers["reliable"].queue.length, 2, "reliable enqueued beyond max");
    assertEqual(broker.subscribers["reliable"].dropped, 0, "reliable dropped none");
  }, "mixed guarantees on same topic — at-most-once drops, at-least-once enqueues");

  // ===========================
  // EDGE — Subscriber add with at-least-once guarantee
  // ===========================

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t", {
      guarantee: "at-least-once",
    });
    assertEqual(broker.subscribers["sub1"].guarantee, "at-least-once", "guarantee set");
  }, "addSubscriber accepts at-least-once guarantee");

  check(function () {
    var broker = PubSubAlgorithm.createBroker();
    PubSubAlgorithm.addTopic(broker, "t");
    PubSubAlgorithm.addSubscriber(broker, "sub1", "t", {
      guarantee: "invalid-value",
    });
    assertEqual(
      broker.subscribers["sub1"].guarantee,
      "at-most-once",
      "invalid guarantee defaults to at-most-once"
    );
  }, "addSubscriber defaults invalid guarantee to at-most-once");

  return { passed: passed, failed: failed, failures: failures };
}

module.exports = { runTests };
