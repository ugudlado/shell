/**
 * Pub/Sub Messaging Algorithm
 *
 * Pure functions — no DOM dependency.
 * Implements a message broker with topics, publishers, subscribers,
 * fan-out routing, delivery guarantees (at-most-once, at-least-once),
 * and backpressure queue management.
 *
 * Functions:
 *   createBroker() — create an empty broker
 *   addTopic(broker, name) — register a topic
 *   removeTopic(broker, name) — remove a topic
 *   addPublisher(broker, id, topicName) — register a publisher for a topic
 *   removePublisher(broker, id) — remove a publisher
 *   addSubscriber(broker, id, topicName, options) — register a subscriber
 *   removeSubscriber(broker, id) — remove a subscriber
 *   publish(broker, publisherId, payload) — publish a message, fan out to subscribers
 *   processNextMessage(broker, subscriberId) — dequeue and process one message
 *   getSubscriberQueueDepth(broker, subscriberId) — get queue length
 *   getSubscriberQueue(broker, subscriberId) — get queue contents
 *   getBrokerStats(broker) — get aggregate stats
 */
var PubSubAlgorithm = (function () {
  "use strict";

  /**
   * Create an empty broker.
   * @returns {object} broker state
   */
  function createBroker() {
    return {
      topics: {},
      publishers: {},
      subscribers: {},
      messageLog: [],
      nextId: 1,
      totalDelivered: 0,
      totalDropped: 0,
    };
  }

  /**
   * Add a topic to the broker.
   * @param {object} broker
   * @param {string} name — topic name (1-30 chars)
   * @returns {object} { success: boolean, error?: string }
   */
  function addTopic(broker, name) {
    if (typeof name !== "string" || name.length === 0 || name.length > 30) {
      return { success: false, error: "Topic name must be 1-30 characters" };
    }
    if (broker.topics[name]) {
      return { success: false, error: "Topic already exists: " + name };
    }
    broker.topics[name] = { subscribers: [] };
    return { success: true };
  }

  /**
   * Remove a topic from the broker.
   * @param {object} broker
   * @param {string} name
   * @returns {object} { success: boolean, error?: string }
   */
  function removeTopic(broker, name) {
    if (!broker.topics[name]) {
      return { success: false, error: "Topic not found: " + name };
    }
    // Remove subscriber associations
    var subs = broker.topics[name].subscribers;
    for (var i = 0; i < subs.length; i++) {
      if (broker.subscribers[subs[i]]) {
        delete broker.subscribers[subs[i]];
      }
    }
    // Remove publisher associations
    var pubIds = Object.keys(broker.publishers);
    for (var j = 0; j < pubIds.length; j++) {
      if (broker.publishers[pubIds[j]].topicName === name) {
        delete broker.publishers[pubIds[j]];
      }
    }
    delete broker.topics[name];
    return { success: true };
  }

  /**
   * Add a publisher to the broker.
   * @param {object} broker
   * @param {string} id — publisher ID (1-20 chars)
   * @param {string} topicName — topic to publish to
   * @returns {object} { success: boolean, error?: string }
   */
  function addPublisher(broker, id, topicName) {
    if (typeof id !== "string" || id.length === 0 || id.length > 20) {
      return { success: false, error: "Publisher ID must be 1-20 characters" };
    }
    if (broker.publishers[id]) {
      return { success: false, error: "Publisher already exists: " + id };
    }
    if (!broker.topics[topicName]) {
      return { success: false, error: "Topic not found: " + topicName };
    }
    broker.publishers[id] = { topicName: topicName };
    return { success: true };
  }

  /**
   * Remove a publisher.
   * @param {object} broker
   * @param {string} id
   * @returns {object} { success: boolean, error?: string }
   */
  function removePublisher(broker, id) {
    if (!broker.publishers[id]) {
      return { success: false, error: "Publisher not found: " + id };
    }
    delete broker.publishers[id];
    return { success: true };
  }

  /**
   * Add a subscriber to the broker.
   * @param {object} broker
   * @param {string} id — subscriber ID (1-20 chars)
   * @param {string} topicName — topic to subscribe to
   * @param {object} [options] — { processingDelay, maxQueueSize, guarantee }
   * @returns {object} { success: boolean, error?: string }
   */
  function addSubscriber(broker, id, topicName, options) {
    if (typeof id !== "string" || id.length === 0 || id.length > 20) {
      return {
        success: false,
        error: "Subscriber ID must be 1-20 characters",
      };
    }
    if (broker.subscribers[id]) {
      return { success: false, error: "Subscriber already exists: " + id };
    }
    if (!broker.topics[topicName]) {
      return { success: false, error: "Topic not found: " + topicName };
    }
    var opts = options || {};
    var processingDelay = opts.processingDelay;
    if (
      processingDelay === undefined ||
      processingDelay === null
    ) {
      processingDelay = 1000;
    }
    processingDelay = Math.max(100, Math.min(5000, processingDelay));

    var maxQueueSize = opts.maxQueueSize;
    if (maxQueueSize === undefined || maxQueueSize === null) {
      maxQueueSize = 10;
    }
    maxQueueSize = Math.max(1, Math.min(100, maxQueueSize));

    var guarantee = opts.guarantee === "at-least-once" ? "at-least-once" : "at-most-once";

    broker.subscribers[id] = {
      topicName: topicName,
      queue: [],
      processingDelay: processingDelay,
      maxQueueSize: maxQueueSize,
      guarantee: guarantee,
      delivered: 0,
      dropped: 0,
      retries: 0,
    };
    broker.topics[topicName].subscribers.push(id);
    return { success: true };
  }

  /**
   * Remove a subscriber.
   * @param {object} broker
   * @param {string} id
   * @returns {object} { success: boolean, error?: string }
   */
  function removeSubscriber(broker, id) {
    if (!broker.subscribers[id]) {
      return { success: false, error: "Subscriber not found: " + id };
    }
    var topicName = broker.subscribers[id].topicName;
    if (broker.topics[topicName]) {
      var subs = broker.topics[topicName].subscribers;
      var idx = subs.indexOf(id);
      if (idx !== -1) {
        subs.splice(idx, 1);
      }
    }
    delete broker.subscribers[id];
    return { success: true };
  }

  /**
   * Publish a message from a publisher.
   * Routes to all subscribers of the publisher's topic.
   * @param {object} broker
   * @param {string} publisherId
   * @param {string} payload — message content
   * @returns {object} { messageId, topicName, deliveries: [...], dropped: [...] }
   */
  function publish(broker, publisherId, payload) {
    var pub = broker.publishers[publisherId];
    if (!pub) {
      return {
        messageId: null,
        topicName: null,
        deliveries: [],
        dropped: [],
        error: "Publisher not found: " + publisherId,
      };
    }
    var topicName = pub.topicName;
    var topic = broker.topics[topicName];
    if (!topic) {
      return {
        messageId: null,
        topicName: topicName,
        deliveries: [],
        dropped: [],
        error: "Topic not found: " + topicName,
      };
    }

    var messageId = broker.nextId++;
    var message = {
      id: messageId,
      publisherId: publisherId,
      topicName: topicName,
      payload: payload,
      timestamp: Date.now(),
    };

    var deliveries = [];
    var dropped = [];

    var subscriberIds = topic.subscribers;
    for (var i = 0; i < subscriberIds.length; i++) {
      var subId = subscriberIds[i];
      var sub = broker.subscribers[subId];
      if (!sub) {
        continue;
      }

      if (sub.queue.length < sub.maxQueueSize) {
        // Queue has space — deliver
        sub.queue.push({
          id: messageId,
          payload: payload,
          publisherId: publisherId,
          topicName: topicName,
        });
        sub.delivered++;
        broker.totalDelivered++;
        deliveries.push(subId);
      } else if (sub.guarantee === "at-least-once") {
        // At-least-once: enqueue even if over max (unbounded retry)
        sub.queue.push({
          id: messageId,
          payload: payload,
          publisherId: publisherId,
          topicName: topicName,
        });
        sub.delivered++;
        sub.retries++;
        broker.totalDelivered++;
        deliveries.push(subId);
      } else {
        // At-most-once: drop
        sub.dropped++;
        broker.totalDropped++;
        dropped.push(subId);
      }
    }

    message.deliveries = deliveries.slice();
    message.dropped = dropped.slice();
    broker.messageLog.push(message);

    return {
      messageId: messageId,
      topicName: topicName,
      deliveries: deliveries,
      dropped: dropped,
    };
  }

  /**
   * Process the next message in a subscriber's queue.
   * @param {object} broker
   * @param {string} subscriberId
   * @returns {object} { message?: object, empty: boolean }
   */
  function processNextMessage(broker, subscriberId) {
    var sub = broker.subscribers[subscriberId];
    if (!sub) {
      return { message: null, empty: true, error: "Subscriber not found" };
    }
    if (sub.queue.length === 0) {
      return { message: null, empty: true };
    }
    var msg = sub.queue.shift();
    return { message: msg, empty: false };
  }

  /**
   * Get the queue depth for a subscriber.
   * @param {object} broker
   * @param {string} subscriberId
   * @returns {number} queue depth (0 if subscriber not found)
   */
  function getSubscriberQueueDepth(broker, subscriberId) {
    var sub = broker.subscribers[subscriberId];
    if (!sub) {
      return 0;
    }
    return sub.queue.length;
  }

  /**
   * Get the queue contents for a subscriber.
   * @param {object} broker
   * @param {string} subscriberId
   * @returns {Array} queue contents (empty array if not found)
   */
  function getSubscriberQueue(broker, subscriberId) {
    var sub = broker.subscribers[subscriberId];
    if (!sub) {
      return [];
    }
    return sub.queue.slice();
  }

  /**
   * Get aggregate broker statistics.
   * @param {object} broker
   * @returns {object} stats
   */
  function getBrokerStats(broker) {
    return {
      topicCount: Object.keys(broker.topics).length,
      publisherCount: Object.keys(broker.publishers).length,
      subscriberCount: Object.keys(broker.subscribers).length,
      totalMessages: broker.messageLog.length,
      totalDelivered: broker.totalDelivered,
      totalDropped: broker.totalDropped,
    };
  }

  /**
   * Process one tick for a subscriber's queue.
   * Manages _tickCount to throttle processing based on ticksNeeded.
   * Resets _tickCount when queue is empty (bugfix: prevents stale tick state).
   * @param {object} sub — subscriber object
   * @param {number} ticksNeeded — ticks required between message processing
   * @returns {object} { processed: boolean, message: object|null }
   */
  function processTick(sub, ticksNeeded) {
    if (sub.queue.length === 0) {
      sub._tickCount = 0;
      return { processed: false, message: null };
    }
    if (!sub._tickCount) sub._tickCount = 0;
    sub._tickCount++;
    if (sub._tickCount >= ticksNeeded) {
      sub._tickCount = 0;
      var msg = sub.queue.shift();
      return { processed: true, message: msg };
    }
    return { processed: false, message: null };
  }

  /**
   * Create a per-subscriber processing scheduler.
   * Each subscriber gets its own independent tick counter and processes
   * at its own rate based on processingDelay, so slow subscribers
   * never delay fast ones.
   *
   * @param {object} broker — broker state
   * @param {number} baseTickMs — base tick interval in ms (default 200)
   * @returns {object} scheduler with tickAll(), getProcessedCounts(), reset()
   */
  function createProcessingScheduler(broker, baseTickMs) {
    var tickMs = baseTickMs || 200;
    var tickCounts = {};
    var processedCounts = {};

    /**
     * Tick all subscribers independently.
     * Each subscriber's tick counter is tracked separately, and each
     * subscriber processes a message only when its own counter reaches
     * its ticksNeeded threshold (derived from processingDelay / baseTickMs).
     * Returns an array of { subscriberId, message } for each processed message.
     */
    function tickAll() {
      var results = [];
      var subIds = Object.keys(broker.subscribers);
      for (var i = 0; i < subIds.length; i++) {
        var subId = subIds[i];
        var sub = broker.subscribers[subId];
        if (!sub) continue;

        var ticksNeeded = Math.max(1, Math.round(sub.processingDelay / tickMs));
        var result = processTick(sub, ticksNeeded);
        if (result.processed) {
          if (!processedCounts[subId]) processedCounts[subId] = 0;
          processedCounts[subId]++;
          results.push({ subscriberId: subId, message: result.message });
        }
      }
      return results;
    }

    /**
     * Get the number of messages processed per subscriber.
     * @returns {object} { subscriberId: count, ... }
     */
    function getProcessedCounts() {
      var counts = {};
      var keys = Object.keys(processedCounts);
      for (var i = 0; i < keys.length; i++) {
        counts[keys[i]] = processedCounts[keys[i]];
      }
      return counts;
    }

    /**
     * Reset all tick counters and processed counts.
     */
    function reset() {
      tickCounts = {};
      processedCounts = {};
    }

    return {
      tickAll: tickAll,
      getProcessedCounts: getProcessedCounts,
      reset: reset,
    };
  }

  // --- Exports ---
  var exports = {
    createBroker: createBroker,
    addTopic: addTopic,
    removeTopic: removeTopic,
    addPublisher: addPublisher,
    removePublisher: removePublisher,
    addSubscriber: addSubscriber,
    removeSubscriber: removeSubscriber,
    publish: publish,
    processNextMessage: processNextMessage,
    processTick: processTick,
    createProcessingScheduler: createProcessingScheduler,
    getSubscriberQueueDepth: getSubscriberQueueDepth,
    getSubscriberQueue: getSubscriberQueue,
    getBrokerStats: getBrokerStats,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exports;
  }
  return exports;
})();
