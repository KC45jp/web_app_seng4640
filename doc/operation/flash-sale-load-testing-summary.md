# Flash Sale Load Testing Summary

## Main takeaway

The important distinction in our checkout load test is not "the system failed at 100 users," but rather:

- at smaller contention, the system preserved both correctness and responsiveness
- at higher contention, the system still preserved correctness, but response time degraded sharply

## Observed behavior

### Case 1: `50 stock / 55 concurrent checkout requests`

- Checkout correctness was preserved.
- Excess requests were rejected as expected with `409 Insufficient stock`.
- The system remained responsive enough for the test window.

### Case 2: `100 stock / 110 concurrent checkout requests`

- No oversell was observed.
- Stock still decreased in a controlled way and did not become negative.
- However, latency increased significantly.
- Many clients hit the JMeter response timeout before the backend finished responding.

This means the system remained logically correct under heavier contention, but its response-time scalability was not strong enough for the larger flash-sale burst on the current staging setup.

## Interpretation

The most likely bottleneck is not raw EC2 CPU saturation. EC2 CPU usage did not reach 100%, which suggests that the dominant issue is contention inside the checkout path rather than simple lack of compute.

In this workload, many requests try to update the same product stock record at nearly the same time. Since checkout uses a MongoDB transaction and a conditional stock update, the requests create a hot-document contention pattern. Under lower contention, this is handled well enough. Under higher contention, waiting and retry overhead become large enough that many clients exceed the timeout window.

So the correct conclusion is:

- correctness was preserved under both workloads
- responsiveness degraded substantially under the larger workload
- the current staging setup can protect inventory correctness, but not maintain the same response-time SLA under stronger flash-sale contention

## Why Atlas Free Tier may be contributing

If staging is backed by MongoDB Atlas Free tier, there are several concrete limits that can amplify this behavior.

- Atlas Free uses shared RAM and shared vCPU rather than dedicated compute.
- Atlas Free is limited to up to `100 operations per second`.
- Atlas Free can have at most `500` concurrent connections.
- Atlas may throttle network speed and add cooldown delays when the throughput limit is exceeded.

For this project, the most likely Atlas-side bottleneck is not the `500` connection cap, but the combination of:

- shared compute on the free tier
- the `100 ops/sec` limit
- heavy contention on the same stock document inside transactions

That combination is a strong match for the observed behavior:

- EC2 CPU did not reach 100%
- oversell did not occur
- many requests eventually completed
- response times increased sharply under the larger burst

In other words, Atlas Free tier may not be the only reason for the slowdown, but it is a credible contributor. Even if the application server still had available CPU, the database layer could already be throttling or queueing work under high contention.

## Report-ready paragraph

At 50 available units with 55 concurrent checkout attempts, the system preserved correctness and remained responsive, with the excess requests being rejected as expected. At 100 available units with 110 concurrent attempts, correctness was still preserved and no oversell was observed, but latency degraded significantly and many clients hit the timeout threshold before receiving a response. Because EC2 CPU utilization did not reach 100%, the bottleneck appears to be transaction and database contention rather than raw compute capacity. In this workload, many requests compete to update the same product stock record inside MongoDB transactions, creating a hot-document contention pattern. This indicates that the system remained logically correct under higher contention, but its response-time scalability was insufficient for the larger flash-sale burst on the current staging setup.

## Atlas-specific wording

If the staging database is running on MongoDB Atlas Free tier, the most likely database-side bottleneck is Atlas throughput throttling rather than application CPU saturation. Atlas Free clusters use shared RAM and shared vCPU, and MongoDB documents a limit of up to `100` database operations per second for the free tier. When that threshold is exceeded, Atlas can throttle throughput and introduce cooldown delays per connection. Since the checkout workload performs multi-step transactional updates against the same stock document, it creates hot-document contention and can exceed the effective throughput of the free tier even when EC2 CPU utilization remains below 100%.

## Why we did not move MongoDB to another EC2 instance

One possible improvement would be to move the database off Atlas Free tier and host MongoDB on a dedicated EC2 instance. That could reduce shared-tier throttling and give the project more predictable database performance.

However, for this project, that option would also add substantial development and operations cost, including:

- database installation and configuration
- transaction-safe MongoDB setup and replica set concerns
- security group and network configuration
- backup, recovery, and maintenance responsibilities
- additional infrastructure to monitor and troubleshoot

Because of that tradeoff, we treated a dedicated EC2-hosted database as a valid future improvement rather than an in-scope implementation. For the project scope, it was more reasonable to document the current staging bottlenecks and explain the likely cause than to introduce a much heavier database operations burden.

## Sources

- MongoDB Atlas Free cluster limits: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
- MongoDB Atlas pricing: https://www.mongodb.com/pricing

## Note on one setup issue

One intermediate run showed `10` login `401 Unauthorized` responses during a `110-thread` test. That turned out to be a test setup mismatch: only `100` users had been seeded while JMeter attempted to log in `110` users from the CSV. That result should not be used to evaluate checkout scalability.
