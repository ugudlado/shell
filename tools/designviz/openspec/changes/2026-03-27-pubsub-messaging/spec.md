# Pub/Sub Messaging Visualization

## Motivation

Pub/Sub (publish-subscribe) is a fundamental messaging pattern used at scale by systems like Apache Kafka, Google Cloud Pub/Sub, and AWS SNS/SQS. Understanding how messages fan out through topics to subscribers, how delivery guarantees work, and how backpressure manifests is critical for distributed systems engineers.

## Real-World Context

Uber's trip events fan out via Kafka to billing, notifications, and analytics services. Each service subscribes to relevant topics and processes events at its own pace. Slow consumers create visible backpressure while fast consumers process instantly.

## Requirements

### Functional

1. Broker with Topics: Users can create named topics on a central broker
2. Publisher Nodes: Publishers publish events to specific topics
3. Subscriber Nodes: Subscribers listen to topics with configurable processing speed
4. Message Fan-Out: Events fan out to all matching subscribers
5. Topic Filtering: Subscribers only receive messages from subscribed topics
6. Delivery Guarantees: at-most-once (fire-and-forget) and at-least-once (retry)
7. Backpressure Queues: Slow subscribers accumulate visible queues
8. Publish Button + Auto-Publish mode
9. Reset: Clear all state

### Non-Functional

- All algorithm logic in pure pubsub-algorithm.js
- UI consumes algorithm module exclusively (DRY)
- CSS prefixed with ps-
- textContent for user-visible text
- Timer cleanup on reset and page unload
- Input bounds on all user inputs

## Acceptance Criteria

1. Users can add topics, publishers, and subscribers
2. Publishing shows animated message flow to matching subscribers
3. Non-matching subscribers do not receive messages
4. Slow subscribers show growing backpressure queues
5. At-most-once drops messages when queue full
6. At-least-once retries delivery
7. Edge cases: 0 subscribers, no matching topic, slow subscriber
8. Nav updated on ALL existing pages
9. npm test && npm run lint pass
10. All inputs have bounds validation
