/**
 * Pub/Sub Messaging UI — canvas visualization + controls
 *
 * Calls PubSubAlgorithm functions for all logic (no duplicated algorithm code).
 * Uses textContent for all user-visible text.
 * Cleans up timers on reset and beforeunload.
 */
(function () {
  "use strict";

  // --- State ---
  let broker = null;
  let scheduler = null; // per-subscriber processing scheduler
  let autoPublishIntervalId = null;
  let processingIntervalId = null;
  let animationFrameId = null;
  let isAutoPublishing = false;
  let animations = []; // { fromX, fromY, toX, toY, progress, color, label }
  let publisherCounter = 0;
  let subscriberCounter = 0;

  // --- DOM refs ---
  const errorMsg = document.getElementById("errorMsg");
  const infoMsg = document.getElementById("infoMsg");
  const btnPublish = document.getElementById("btnPublish");
  const btnAutoPublish = document.getElementById("btnAutoPublish");
  const btnReset = document.getElementById("btnReset");

  const inputTopicName = document.getElementById("inputTopicName");
  const btnAddTopic = document.getElementById("btnAddTopic");

  const inputPubId = document.getElementById("inputPubId");
  const selectPubTopic = document.getElementById("selectPubTopic");
  const btnAddPublisher = document.getElementById("btnAddPublisher");

  const inputSubId = document.getElementById("inputSubId");
  const selectSubTopic = document.getElementById("selectSubTopic");
  const inputSubSpeed = document.getElementById("inputSubSpeed");
  const speedDisplay = document.getElementById("speedDisplay");
  const inputSubQueue = document.getElementById("inputSubQueue");
  const selectGuarantee = document.getElementById("selectGuarantee");
  const btnAddSubscriber = document.getElementById("btnAddSubscriber");

  const canvas = document.getElementById("psCanvas");
  const ctx = canvas.getContext("2d");

  const statTopics = document.getElementById("statTopics");
  const statPublishers = document.getElementById("statPublishers");
  const statSubscribers = document.getElementById("statSubscribers");
  const statMessages = document.getElementById("statMessages");
  const statDelivered = document.getElementById("statDelivered");
  const statDropped = document.getElementById("statDropped");

  const eventLog = document.getElementById("eventLog");

  // --- Error handling ---
  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }

  function hideError() {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");
  }

  // --- Timer management ---
  function clearTimers() {
    if (autoPublishIntervalId !== null) {
      clearInterval(autoPublishIntervalId);
      autoPublishIntervalId = null;
    }
    if (processingIntervalId !== null) {
      clearInterval(processingIntervalId);
      processingIntervalId = null;
    }
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // --- Topic dropdown sync ---
  function syncTopicDropdowns() {
    if (!broker) return;
    var topicNames = Object.keys(broker.topics);

    [selectPubTopic, selectSubTopic].forEach(function (sel) {
      var currentVal = sel.value;
      sel.textContent = "";
      topicNames.forEach(function (name) {
        var opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      });
      if (topicNames.indexOf(currentVal) !== -1) {
        sel.value = currentVal;
      }
    });
  }

  // --- Stats update ---
  function updateStats() {
    if (!broker) return;
    var stats = PubSubAlgorithm.getBrokerStats(broker);
    statTopics.textContent = stats.topicCount;
    statPublishers.textContent = stats.publisherCount;
    statSubscribers.textContent = stats.subscriberCount;
    statMessages.textContent = stats.totalMessages;
    statDelivered.textContent = stats.totalDelivered;
    statDropped.textContent = stats.totalDropped;
  }

  // --- Log entry ---
  function addLogEntry(type, text) {
    var entry = document.createElement("div");
    var className = "ps-log-entry";
    if (type === "delivered") {
      className += " ps-log-entry-delivered";
    } else if (type === "dropped") {
      className += " ps-log-entry-dropped";
    } else {
      className += " ps-log-entry-info";
    }
    entry.className = className;

    var idSpan = document.createElement("span");
    idSpan.className = "ps-log-entry-id";
    idSpan.textContent = type.toUpperCase();

    var detailSpan = document.createElement("span");
    detailSpan.className = "ps-log-entry-detail";
    detailSpan.textContent = text;

    entry.appendChild(idSpan);
    entry.appendChild(detailSpan);

    if (eventLog.firstChild) {
      eventLog.insertBefore(entry, eventLog.firstChild);
    } else {
      eventLog.appendChild(entry);
    }

    // Cap log entries at 50
    while (eventLog.children.length > 50) {
      eventLog.removeChild(eventLog.lastChild);
    }
  }

  // --- Canvas drawing ---
  function getNodePositions() {
    var w = canvas.width;
    var h = canvas.height;
    var positions = { publishers: [], subscribers: [], broker: { x: w / 2, y: h / 2 } };

    var pubIds = broker ? Object.keys(broker.publishers) : [];
    var subIds = broker ? Object.keys(broker.subscribers) : [];

    var pubSpacing = pubIds.length > 0 ? h / (pubIds.length + 1) : h / 2;
    pubIds.forEach(function (id, i) {
      positions.publishers.push({
        id: id,
        x: 120,
        y: pubSpacing * (i + 1),
        topicName: broker.publishers[id].topicName,
      });
    });

    var subSpacing = subIds.length > 0 ? h / (subIds.length + 1) : h / 2;
    subIds.forEach(function (id, i) {
      var sub = broker.subscribers[id];
      positions.subscribers.push({
        id: id,
        x: w - 120,
        y: subSpacing * (i + 1),
        queueDepth: PubSubAlgorithm.getSubscriberQueueDepth(broker, id),
        maxQueueSize: sub.maxQueueSize,
        guarantee: sub.guarantee,
      });
    });

    return positions;
  }

  function drawNode(x, y, label, color, shape) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    if (shape === "rect") {
      var rw = 90;
      var rh = 36;
      ctx.beginPath();
      ctx.roundRect(x - rw / 2, y - rh / 2, rw, rh, 6);
      ctx.stroke();
      ctx.fillStyle = color + "20";
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color + "20";
      ctx.fill();
    }

    ctx.fillStyle = "#c9d1d9";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Truncate label if too long
    var displayLabel = label.length > 12 ? label.substring(0, 11) + "\u2026" : label;
    ctx.fillText(displayLabel, x, y);
    ctx.restore();
  }

  function drawBroker(x, y) {
    ctx.save();
    var bw = 120;
    var bh = 60;
    ctx.fillStyle = "#58a6ff20";
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#58a6ff";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BROKER", x, y - 10);

    // Show topic count
    var topicCount = broker ? Object.keys(broker.topics).length : 0;
    ctx.fillStyle = "#8b949e";
    ctx.font = "10px monospace";
    ctx.fillText(topicCount + " topic" + (topicCount !== 1 ? "s" : ""), x, y + 10);
    ctx.restore();
  }

  function drawConnection(x1, y1, x2, y2, color) {
    ctx.save();
    ctx.strokeStyle = color || "#30363d";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawQueueBar(x, y, depth, maxSize, guarantee) {
    ctx.save();
    var barWidth = 60;
    var barHeight = 10;
    var bx = x - barWidth / 2;
    var by = y + 24;

    // Background
    ctx.fillStyle = "#21262d";
    ctx.fillRect(bx, by, barWidth, barHeight);

    // Fill
    var pct = maxSize > 0 ? Math.min(depth / maxSize, 1) : 0;
    var fillColor = pct >= 1 ? "#f85149" : pct >= 0.7 ? "#d29922" : "#2ea043";
    if (guarantee === "at-least-once" && depth > maxSize) {
      fillColor = "#d29922";
      pct = 1; // show full bar but in yellow
    }
    ctx.fillStyle = fillColor;
    ctx.fillRect(bx, by, barWidth * pct, barHeight);

    // Border
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barWidth, barHeight);

    // Depth label
    ctx.fillStyle = "#8b949e";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(depth + "/" + maxSize, x, by + barHeight + 10);
    ctx.restore();
  }

  function drawAnimations() {
    animations.forEach(function (anim) {
      var x = anim.fromX + (anim.toX - anim.fromX) * anim.progress;
      var y = anim.fromY + (anim.toY - anim.fromY) * anim.progress;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = anim.color;
      ctx.fill();

      // Glow effect
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = anim.color + "40";
      ctx.fill();
      ctx.restore();
    });
  }

  function render() {
    var w = canvas.width;
    var h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!broker) {
      ctx.fillStyle = "#8b949e";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Add topics, publishers, and subscribers to begin", w / 2, h / 2);
      return;
    }

    var pos = getNodePositions();

    // Draw connections
    pos.publishers.forEach(function (pub) {
      drawConnection(pub.x + 45, pub.y, pos.broker.x - 60, pos.broker.y, "#388bfd40");
    });
    pos.subscribers.forEach(function (sub) {
      drawConnection(pos.broker.x + 60, pos.broker.y, sub.x - 45, sub.y, "#2ea04340");
    });

    // Draw broker
    drawBroker(pos.broker.x, pos.broker.y);

    // Draw publishers
    pos.publishers.forEach(function (pub) {
      drawNode(pub.x, pub.y, pub.id, "#388bfd", "rect");
      // Topic label below
      ctx.save();
      ctx.fillStyle = "#8b949e";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("[" + pub.topicName + "]", pub.x, pub.y + 26);
      ctx.restore();
    });

    // Draw subscribers
    pos.subscribers.forEach(function (sub) {
      var color = sub.queueDepth >= sub.maxQueueSize ? "#f85149" : "#2ea043";
      drawNode(sub.x, sub.y, sub.id, color, "rect");
      drawQueueBar(sub.x, sub.y, sub.queueDepth, sub.maxQueueSize, sub.guarantee);
    });

    // Draw message animations
    drawAnimations();
  }

  function animationLoop() {
    // Update animation progress
    var stillActive = [];
    animations.forEach(function (anim) {
      anim.progress += 0.02;
      if (anim.progress < 1) {
        stillActive.push(anim);
      }
    });
    animations = stillActive;

    render();
    animationFrameId = requestAnimationFrame(animationLoop);
  }

  // --- Create message animations ---
  function createPublishAnimations(publisherId, result) {
    if (!broker) return;
    var pos = getNodePositions();
    var pubNode = null;
    pos.publishers.forEach(function (p) {
      if (p.id === publisherId) pubNode = p;
    });
    if (!pubNode) return;

    // Publisher to broker animation
    animations.push({
      fromX: pubNode.x + 45,
      fromY: pubNode.y,
      toX: pos.broker.x - 60,
      toY: pos.broker.y,
      progress: 0,
      color: "#388bfd",
    });

    // Broker to each delivered subscriber
    result.deliveries.forEach(function (subId) {
      var subNode = null;
      pos.subscribers.forEach(function (s) {
        if (s.id === subId) subNode = s;
      });
      if (subNode) {
        animations.push({
          fromX: pos.broker.x + 60,
          fromY: pos.broker.y,
          toX: subNode.x - 45,
          toY: subNode.y,
          progress: -0.5, // delay start
          color: "#2ea043",
        });
      }
    });

    // Broker to each dropped subscriber (red)
    result.dropped.forEach(function (subId) {
      var subNode = null;
      pos.subscribers.forEach(function (s) {
        if (s.id === subId) subNode = s;
      });
      if (subNode) {
        animations.push({
          fromX: pos.broker.x + 60,
          fromY: pos.broker.y,
          toX: subNode.x - 45,
          toY: subNode.y,
          progress: -0.5,
          color: "#f85149",
        });
      }
    });
  }

  // --- Processing simulation ---
  // Uses PubSubAlgorithm.createProcessingScheduler for per-subscriber
  // independent processing. Each subscriber processes at its own configured
  // speed — slow subscribers never delay fast ones.
  function startProcessing() {
    if (processingIntervalId !== null) {
      clearInterval(processingIntervalId);
    }
    scheduler = PubSubAlgorithm.createProcessingScheduler(broker, 200);
    processingIntervalId = setInterval(function () {
      if (!broker) return;
      scheduler.tickAll();
      updateStats();
    }, 200);
  }

  // --- Actions ---
  function addTopic() {
    hideError();
    var name = inputTopicName.value.trim();
    if (!name) {
      showError("Topic name is required (1-30 characters)");
      return;
    }
    if (name.length > 30) {
      showError("Topic name must be 1-30 characters");
      return;
    }
    if (!broker) {
      broker = PubSubAlgorithm.createBroker();
      startProcessing();
      animationLoop();
    }
    var result = PubSubAlgorithm.addTopic(broker, name);
    if (!result.success) {
      showError(result.error);
      return;
    }
    syncTopicDropdowns();
    updateStats();
    addLogEntry("info", "Topic created: " + name);
    infoMsg.textContent = "Topic '" + name + "' added. Now add publishers and subscribers.";
  }

  function addPublisher() {
    hideError();
    if (!broker) {
      showError("Add a topic first");
      return;
    }
    var id = inputPubId.value.trim();
    if (!id) {
      showError("Publisher ID is required (1-20 characters)");
      return;
    }
    if (id.length > 20) {
      showError("Publisher ID must be 1-20 characters");
      return;
    }
    var topicName = selectPubTopic.value;
    if (!topicName) {
      showError("Select a topic for the publisher");
      return;
    }
    var result = PubSubAlgorithm.addPublisher(broker, id, topicName);
    if (!result.success) {
      showError(result.error);
      return;
    }
    publisherCounter++;
    inputPubId.value = "pub-" + (publisherCounter + 1);
    updateStats();
    addLogEntry("info", "Publisher '" + id + "' added to topic '" + topicName + "'");
    infoMsg.textContent = "Publisher '" + id + "' publishing to '" + topicName + "'.";
  }

  function addSubscriber() {
    hideError();
    if (!broker) {
      showError("Add a topic first");
      return;
    }
    var id = inputSubId.value.trim();
    if (!id) {
      showError("Subscriber ID is required (1-20 characters)");
      return;
    }
    if (id.length > 20) {
      showError("Subscriber ID must be 1-20 characters");
      return;
    }
    var topicName = selectSubTopic.value;
    if (!topicName) {
      showError("Select a topic for the subscriber");
      return;
    }
    var queueMax = Number(inputSubQueue.value);
    if (isNaN(queueMax) || queueMax < 1 || queueMax > 100) {
      showError("Queue max must be 1-100");
      return;
    }
    var speed = Number(inputSubSpeed.value);
    if (isNaN(speed) || speed < 100 || speed > 5000) {
      showError("Processing speed must be 100-5000ms");
      return;
    }
    var guarantee = selectGuarantee.value;

    var result = PubSubAlgorithm.addSubscriber(broker, id, topicName, {
      processingDelay: speed,
      maxQueueSize: queueMax,
      guarantee: guarantee,
    });
    if (!result.success) {
      showError(result.error);
      return;
    }
    subscriberCounter++;
    inputSubId.value = "sub-" + (subscriberCounter + 1);
    updateStats();
    addLogEntry(
      "info",
      "Subscriber '" + id + "' on '" + topicName + "' (" + guarantee + ", " + speed + "ms, max " + queueMax + ")"
    );
    infoMsg.textContent = "Subscriber '" + id + "' listening on '" + topicName + "'.";
  }

  function publishEvent() {
    hideError();
    if (!broker) {
      showError("Set up broker first (add topics, publishers, subscribers)");
      return;
    }
    var pubIds = Object.keys(broker.publishers);
    if (pubIds.length === 0) {
      showError("Add a publisher first");
      return;
    }

    // Publish from each publisher
    pubIds.forEach(function (pubId) {
      var payload = "event-" + broker.nextId;
      var result = PubSubAlgorithm.publish(broker, pubId, payload);
      if (result.error) {
        addLogEntry("dropped", pubId + ": " + result.error);
        return;
      }

      createPublishAnimations(pubId, result);

      if (result.deliveries.length > 0) {
        addLogEntry(
          "delivered",
          "msg#" + result.messageId + " from " + pubId + " -> " + result.deliveries.join(", ")
        );
      }
      if (result.dropped.length > 0) {
        addLogEntry(
          "dropped",
          "msg#" + result.messageId + " DROPPED for: " + result.dropped.join(", ")
        );
      }
      if (result.deliveries.length === 0 && result.dropped.length === 0) {
        addLogEntry("info", "msg#" + result.messageId + " from " + pubId + " — no subscribers");
      }
    });

    updateStats();
    var stats = PubSubAlgorithm.getBrokerStats(broker);
    infoMsg.textContent =
      "Published event. Total: " +
      stats.totalMessages +
      " messages, " +
      stats.totalDelivered +
      " delivered, " +
      stats.totalDropped +
      " dropped.";
  }

  function toggleAutoPublish() {
    if (isAutoPublishing) {
      isAutoPublishing = false;
      if (autoPublishIntervalId !== null) {
        clearInterval(autoPublishIntervalId);
        autoPublishIntervalId = null;
      }
      btnAutoPublish.textContent = "Auto-Publish: OFF";
      infoMsg.textContent = "Auto-publish stopped.";
    } else {
      if (!broker || Object.keys(broker.publishers).length === 0) {
        showError("Add a publisher first");
        return;
      }
      isAutoPublishing = true;
      btnAutoPublish.textContent = "Auto-Publish: ON";
      autoPublishIntervalId = setInterval(publishEvent, 1000);
      infoMsg.textContent = "Auto-publishing every 1s...";
    }
  }

  function reset() {
    clearTimers();
    broker = null;
    scheduler = null;
    isAutoPublishing = false;
    animations = [];
    publisherCounter = 0;
    subscriberCounter = 0;

    btnAutoPublish.textContent = "Auto-Publish: OFF";

    statTopics.textContent = "0";
    statPublishers.textContent = "0";
    statSubscribers.textContent = "0";
    statMessages.textContent = "0";
    statDelivered.textContent = "0";
    statDropped.textContent = "0";

    eventLog.textContent = "";

    selectPubTopic.textContent = "";
    selectSubTopic.textContent = "";

    inputTopicName.value = "trips";
    inputPubId.value = "ride-service";
    inputSubId.value = "billing";
    inputSubSpeed.value = "1000";
    speedDisplay.textContent = "1000ms";
    inputSubQueue.value = "10";
    selectGuarantee.value = "at-most-once";

    hideError();
    infoMsg.textContent =
      "Add topics, publishers, and subscribers below, then publish events to watch messages fan out through the broker.";

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8b949e";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      "Add topics, publishers, and subscribers to begin",
      canvas.width / 2,
      canvas.height / 2
    );
  }

  // --- Event listeners ---
  btnAddTopic.addEventListener("click", addTopic);
  btnAddPublisher.addEventListener("click", addPublisher);
  btnAddSubscriber.addEventListener("click", addSubscriber);
  btnPublish.addEventListener("click", publishEvent);
  btnAutoPublish.addEventListener("click", toggleAutoPublish);
  btnReset.addEventListener("click", reset);

  inputSubSpeed.addEventListener("input", function () {
    speedDisplay.textContent = inputSubSpeed.value + "ms";
  });

  // --- Timer cleanup on page unload ---
  window.addEventListener("beforeunload", clearTimers);

  // --- Canvas resize handling ---
  function resizeCanvas() {
    var container = canvas.parentElement;
    var rect = container.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = 400;
    render();
  }

  window.addEventListener("resize", resizeCanvas);

  // --- Initialize ---
  resizeCanvas();
  render();
})();
