# DesignViz — Feature Backlog

Interactive software engineering design concept visualizations.

## Built (8 concepts)

| # | Concept | Schema | Tests | Status |
|---|---------|--------|-------|--------|
| 1 | Rate Limiter (Token Bucket + Sliding Window) | feature-tdd | 25 | Shipped |
| 2 | Circuit Breaker (Closed/Open/Half-Open) | feature-rapid | 22 | Shipped |
| 3 | Load Balancer (Round Robin, Least Conn, Weighted) | feature-tdd | 37 | Shipped |
| 4 | Pub/Sub Messaging (Topics, Fan-out, Backpressure) | feature-rapid | 38 | Shipped |
| 5 | Retry with Exponential Backoff | feature-tdd | 29 | Shipped |
| 6 | Connection Pooling (Acquire/Release/Queue/Timeout) | feature-tdd | 31 | Shipped |
| 7 | Consistent Hashing (Hash Ring, Virtual Nodes) | feature-rapid | 34 | Shipped |
| 8 | Pub/Sub Backpressure Bugfix (per-subscriber scheduling) | bugfix | 6 | Shipped |

**Total: 222 passing tests, 0 lint errors**

## Known Issues

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 1 | Load Balancer: release-connection setTimeout is untracked (orphaned on reset) | Low | load-balancer.js:414 |
| 2 | Load Balancer: test uses disjunctive assertion for RR after server removal | Low | load-balancer-algorithm.test.js:514 |
| 3 | Pub/Sub: `retries` label ambiguous (means "overflow-deliveries" not actual retries) | Low | pubsub-algorithm.js |

## Future Ideas (5)

### 1. Service Discovery & Health Checks
- **Concept**: How services find each other and detect failures (DNS-based, sidecar, gossip protocol)
- **Schema**: feature-tdd
- **Description**: Simulate a microservice mesh where services register/deregister. Animate health check pings, show what happens when a service goes unhealthy (removed from registry), and demonstrate the thundering herd problem when it comes back. Contrast pull-based (polling) vs push-based (heartbeat) discovery. Real-world: Consul, Eureka, Kubernetes service discovery.
- **Why interesting**: Every microservice architecture needs this but it's invisible until it breaks. Visualizing the gossip protocol spreading health state is fascinating.

### 2. Database Sharding with Query Routing
- **Concept**: Hash-based and range-based sharding with cross-shard queries
- **Schema**: feature-tdd
- **Description**: Show a table of records being distributed across N shards. Users can add records and watch them route to the correct shard via hash or range. Simulate a cross-shard query (scatter-gather) and show the latency difference vs single-shard query. Demonstrate rebalancing when a shard is added. Real-world: MongoDB sharding, Vitess for MySQL, DynamoDB partitions.
- **Why interesting**: Builds on Consistent Hashing (already built) but adds the data dimension — students see WHY sharding matters for query performance.

### 3. Event Sourcing & CQRS
- **Concept**: Command vs Query separation, event log as source of truth, materialized views
- **Schema**: feature-rapid
- **Description**: Side-by-side panels: left shows the command path (write events to an append-only log), right shows the query path (materialized view rebuilt from events). Users issue commands (CreateOrder, UpdateStatus, CancelOrder) and watch events flow into the log, then see the read model update asynchronously. Show the temporal gap between write and read consistency. Real-world: Stripe's payment event log, banking transaction ledgers.
- **Why interesting**: CQRS is abstract until you SEE the event log growing and the read model lagging behind the write model.

### 4. Distributed Lock with Fencing Tokens
- **Concept**: Mutual exclusion in distributed systems, lock expiry, fencing tokens preventing stale operations
- **Schema**: feature-tdd
- **Description**: Animate two clients competing for a lock. Show the dangerous scenario: Client A gets the lock, pauses (GC), lock expires, Client B gets the lock, Client A resumes and writes stale data. Then show fencing tokens preventing this. Users can trigger GC pauses, network partitions, and clock skew. Real-world: Redlock, ZooKeeper recipes, database advisory locks.
- **Why interesting**: The "paused client writes stale data" scenario is the classic distributed systems gotcha. Seeing it happen visually makes the need for fencing tokens obvious.

### 5. Bulkhead Pattern (Thread Pool Isolation)
- **Concept**: Isolating failures by partitioning resources into independent pools
- **Schema**: feature-rapid
- **Description**: Show a service with 3 downstream dependencies, each with its own thread/connection pool. When one dependency slows down, its pool fills up but the other pools continue serving. Contrast with a shared pool where one slow dependency consumes all threads. Animate request queuing, pool exhaustion, and rejection per-bulkhead. Real-world: Netflix Hystrix bulkheads, Kubernetes resource limits per container.
- **Why interesting**: Builds on Circuit Breaker and Connection Pooling (both already built). The "shared pool collapse" visualization makes the case for isolation viscerally.
