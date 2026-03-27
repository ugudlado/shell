# Pub/Sub Messaging -- Technical Design

## Files

| File | Purpose |
|------|---------|
| pubsub-algorithm.js | Pure broker logic: topics, subscriptions, routing, guarantees, backpressure |
| pubsub-algorithm.test.js | Tests for all algorithm functions |
| pubsub.html | Page with nav, controls, canvas, stats |
| pubsub.js | UI: canvas, animations, calls algorithm module |
| pubsub-style.css | Styles prefixed ps- |

## Algorithm API (PubSubAlgorithm)

- createBroker() -> broker state
- addTopic(broker, name) -> result
- addPublisher(broker, id, topicName) -> result
- addSubscriber(broker, id, topicName, options) -> result
- publish(broker, publisherId, payload) -> delivery report
- processNextMessage(broker, subscriberId) -> message or empty
- getSubscriberQueueDepth(broker, subscriberId) -> number
- getBrokerStats(broker) -> stats object

## Data Model

Broker: { topics, publishers, subscribers, messageLog, nextId }
Subscriber: { topicName, queue, processingDelay, maxQueueSize, guarantee, delivered, dropped }

## Message Flow

1. Publisher calls publish()
2. Broker finds topic subscribers
3. Per subscriber: enqueue if space, or drop/retry based on guarantee
4. Return delivery report

## Canvas Layout

Publishers left, broker center, subscribers right. Animated dots for messages.

## Edge Cases

- 0 subscribers: message logged, no deliveries
- No matching topic: error returned
- Queue overflow + at-most-once: drop
- Queue overflow + at-least-once: enqueue anyway
