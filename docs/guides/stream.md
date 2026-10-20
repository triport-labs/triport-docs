> Live version: https://triport.io/docs/guides/stream

# Stream

> A dedicated observability interface for your Solana Yellowstone gRPC firehose — monitor ingestion rate, broadcast throughput, drop rate, and per-transaction payload health of your data feeds in real time.

| | |
|---|---|
| **Method / Endpoint** | `Yellowstone gRPC (Solana)` |
| **Network** | Solana |
| **Required scope** | — |
| **Tier / rate limit** | Pro and above (gRPC streaming) |

The **Stream** tab functions as a dedicated observability interface for your active Solana Yellowstone gRPC data feeds. It is not the production ingestion endpoint. Production applications should connect programmatically to the native [Solana gRPC (Yellowstone) endpoint](../streaming/sol-grpc.md) at `https://grpc.triport.io`; for every non-vote transaction over a WebSocket with no filters, use the [Firehose](../streaming/sol-stream.md) at `wss://triport.io/ws/sol-stream`; for transactions before they execute, use the [shred stream](../streaming/sol-preexec.md) at `wss://triport.io/ws/sol-preexec`.

Polling JSON-RPC means one request per read, and WebSocket subscriptions deliver per-subscription notifications; high-frequency trading (HFT) and mempool analysis usually need a continuous, server-filtered feed instead. Triport provides a direct gRPC firehose, and this interface allows you to monitor the exact health, throughput, and payload delivery of your persistent connections in real time.

Instead of operating blindly, you can visually verify that your infrastructure is receiving every non-vote transaction fanned out directly from the validator node.

## 1. Firehose Telemetry & Performance Metrics

The upper telemetry panel provides real-time quantitative metrics regarding your data ingestion pipeline. Understanding these numbers is critical for diagnosing client-side bottlenecks or verifying network velocity.

* **Upstream (e.g., 1.0k/s):** This metric represents the raw ingestion rate. It is the exact number of events per second that Triport's edge servers are successfully pulling directly from the Solana validator nodes. It reflects the current baseline activity level of the blockchain itself before any server-side filtering is applied.
* **Broadcast (e.g., 1.0k/s):** This indicates the outbound transmission rate pushed to your connected client applications. If you apply server-side filters (e.g., subscribing only to specific account addresses or program IDs), this number will be lower than the Upstream rate. When Upstream and Broadcast match (e.g., 1.0k/s for both), it indicates the client is receiving the unfiltered firehose.
* **Dropped (Targeting 0.0%):** This is the single most critical health indicator for your stream. A dropped packet means your client failed to acknowledge receipt of an event. This typically occurs because your application's processing queue is saturated or your local network bandwidth is exhausted. For MEV searchers, a non-zero drop rate means missing potentially profitable arbitrage opportunities.
* **Total Seen (e.g., 2.4k):** An aggregate counter of all unique events processed during your current active session. This is primarily used for spot-checking data completeness against a specific time window or validating that the stream has not silently stalled.

## 2. Live Feed & Diagnostic Visualization

Directly below the telemetry panel is the **Live Feed**, a rolling, raw visualization of the incoming data stream. A full Solana firehose moves too fast for human reading. Therefore, this diagnostic interface samples the data (e.g., displaying an active sampling like 49/60 events) to prove the pipeline is flowing and properly formatted.

The interface parses the raw gRPC payload and displays actionable metadata for each transaction:

* **Slot / Block Number (e.g., 424337726):** The exact ledger slot in which the transaction is currently being processed. Developers use this to cross-reference events with block explorers and precisely calculate their inclusion latency.
* **Transaction Hash (e.g., dSiQNo...KfQs):** The unique cryptographic identifier for the transaction. You can extract this directly from the feed to manually trace execution paths or debug failed bundle submissions.
* **Compute / Size Metrics (e.g., 5000):** Displays the transaction weight or compute units requested. Monitoring this helps developers understand the resource intensity of the current block and adjust priority fees accordingly for their own pending transactions.
* **Validation Status:** A real-time indicator represented by a green checkmark confirming the transaction's valid status. It allows you to immediately see that the fanned-out transactions are confirmed by the node, ensuring you are not processing invalid spam in your application logic.

## 3. Best Practices for Stream Management

* **Do not rely on the UI for data ingestion:** The Stream tab is strictly a diagnostic overlay. Your actual trading or indexing logic must connect to the gRPC endpoint programmatically via your backend infrastructure.
* **Monitor the Dropped metric closely:** If your Dropped percentage rises above 0.0%, immediately inspect your server's CPU and memory utilization. gRPC streams push data relentlessly; your client must be architected to consume and process it just as fast.
* **Use filtering to reduce overhead:** Instead of subscribing to the entire network firehose, configure your gRPC request to filter by specific Program IDs or Account Keys. This drastically lowers your Broadcast rate, saves bandwidth, and reduces the computational load on your local indexing infrastructure.

## Frequently Asked Questions

**Q: Why is my "Broadcast" rate identical to my "Upstream" rate?**
**A:** If both metrics match exactly (e.g., 1.0k/s), it indicates that your client is subscribed to the raw, unfiltered firehose. You are receiving every single non-vote transaction produced by the network. To save bandwidth and reduce your local computational overhead, you should apply server-side filters in your gRPC request (such as filtering by specific Account Keys or Program IDs).

**Q: My "Dropped" metric is showing a percentage greater than 0.0%. How do I fix this?**
**A:** A non-zero drop rate means the Triport proxy is pushing data faster than your client infrastructure can acknowledge and process it. This is a client-side bottleneck. To resolve this, you must optimize your application's ingestion queue, upgrade your server's CPU/network capacity, or apply strict filters to significantly reduce the incoming data volume.

**Q: Can I use the "Live Feed" UI to export or download historical transactions?**
**A:** No. The Live Feed is strictly a real-time diagnostic overlay. It intentionally samples the stream (e.g., showing 49 out of 60 recent events) so you can visually verify the pipeline's health and formatting. For historical data extraction or actual trading ingestion, you must connect to the gRPC endpoint programmatically via your backend code.

**Q: How do I use this in production?**
**A:** Use the native [Solana gRPC (Yellowstone) guide](../streaming/sol-grpc.md). The production endpoint is `https://grpc.triport.io` (`grpc.triport.io:443` for clients that take `host:port`), authenticated with `x-token` metadata from a backend service. Do not scrape or automate the Stream dashboard UI.

**Q: What does the green checkmark next to the transaction hash signify?**
**A:** The green checkmark represents the real-time validation status directly from the node. It confirms that the fanned-out transaction is valid and verified, ensuring your indexing or trading logic is not wasting compute cycles processing invalid network spam.

**Q: Is the Yellowstone gRPC firehose available for Ethereum or Polygon?**
**A:** The Yellowstone gRPC protocol and this specific high-velocity Stream interface are custom-built specifically for Solana's unique, high-throughput architecture. For EVM chains like Ethereum and Polygon, you should utilize the WSS (WebSocket Secure) endpoints located in the **Chains** tab to establish standard pub/sub event subscriptions.
