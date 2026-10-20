> Live version: https://triport.io/docs/guides/chains

# Chains (Networks)

> The Chains tab is the operational command center of the Triport workspace — unified observability over every registered network in a single pane of glass.

| | |
|---|---|
| **Method / Endpoint** | `n/a — dashboard guide` |
| **Network** | Any network in the registry |
| **Required scope** | — |
| **Tier / rate limit** | All tiers |

The **Chains** tab serves as the primary operational command center within the Triport workspace. It is engineered to provide multi-chain developers, indexing protocols, and high-frequency trading infrastructure with immediate, unified observability over their allocated endpoints and the real-time health of the underlying blockchain networks.

Instead of managing disparate infrastructure providers, the Chains tab consolidates every registered network into a single pane of glass, paired with deterministic telemetry.

## 1. Global Metrics Telemetry

The top panel of the Chains dashboard aggregates telemetry data across all supported geographic regions and active nodes. This provides a macroscopic view of your infrastructure's health before you initiate critical RPC calls or broadcast transactions.

* **Average Uptime (e.g., 99.97%):** This metric represents the historical availability of the Triport proxy routing layer across all regions. It is calculated by measuring the successful response rate of health-check methods. A high uptime percentage indicates that the routing layer is successfully connecting your requests to upstream nodes without triggering 5xx server errors.
* **Average P2P Latency:** Measured in milliseconds, this shows the average network-level transit time between the Triport edge proxies and the upstream node peers as the console observes it. Use it to spot degradation; it is an observation, not a performance guarantee.
* **Average Block:** A composite indicator confirming that the global infrastructure is actively processing new blocks across all chains.
* **Sync Status (e.g., 0%):** Displayed as a percentage, this metric tracks the aggregate synchronization health of the underlying nodes. If this drops to 0% (as seen during heavy global congestion or restarts), it indicates severe network degradation, warning you that read-requests might return stale on-chain state data even if the proxy itself is operational.

## 2. Supported Networks Architecture

Triport isolates infrastructure for each blockchain into dedicated, resilient modules. The generated cards below enumerate the production registry.

Each module features a real-time status indicator (e.g., **LIVE**). This badge confirms that the Triport load balancers are successfully routing traffic to responsive upstream providers for that specific network, regardless of the chain's underlying sync status.

Base is shown as the **ninth network in preview**, after the eight production-registry
cards. Preview means its frozen documentation exists, not that the Base handler,
streams, provider profiles, or dashboard telemetry are live. It must not receive a
**LIVE** badge before the registry and release gates pass.

## 3. Endpoint Management and Authentication

The core utility of the Chains tab is exposing your specific connection URLs. Triport eliminates the friction of managing multiple API keys across different networks through a unified authentication architecture.

* **HTTPS Endpoints** (`https://triport.io/<chain>`): Use these URLs for standard stateless requests, such as querying account balances or broadcasting raw, signed transactions.
* **WSS Endpoints** (`wss://triport.io/<chain>`): Use these WebSocket Secure URLs for maintaining persistent, stateful connections required for pub/sub streams.
* **Unified Bearer Authentication:** The endpoint URLs do not contain your API key in the path. Triport utilizes secure bearer token authentication. The key is passed securely in the HTTP header as `x-token: <YOUR_API_KEY>`. This design prevents key leakage in server logs and simplifies environment variable management.

## 4. Chain-Specific Telemetry & Observability (Expanded View)

Inside each network's dedicated card, Triport provides localized metrics. When the cards are expanded, developers can isolate performance issues to a specific blockchain:

* **TPS, Uptime, and Block:** Baseline metrics showing the localized Transactions Per Second, specific proxy uptime for that chain (e.g., 100%), and the exact block height.
* **Performance (1H) Chart:** A real-time data visualization tracking the latency of responses over the last 60 minutes. The interface highlights the current localized value at the top right of the chart. This allows you to visually identify sudden latency spikes caused by chain congestion.
* **Gas Price:** An indicator of the current network transaction fee baseline, allowing automated systems to gauge profitability before executing heavy contract interactions.
* **Sync Status (e.g., Synced):** A node-specific validation confirming that the exact RPC node serving your requests for this specific chain is fully caught up with the tip of the network.

## 5. UI Controls and Navigation

* **Copy Icons:** Adjacent to every HTTPS and WSS endpoint URL is a one-click copy button, ensuring exact string extraction without formatting errors.
* **Sync Button:** Located in the top right corner, the manual "Sync" trigger forces the dashboard to pull the absolute latest telemetry and node status data.
* **View Toggles:** The interface allows you to switch between a dense Grid view (for monitoring multiple chains simultaneously) and a structured List view.

## Frequently Asked Questions

**Q: Why is my API key missing from the HTTPS and WSS endpoint URLs?**
**A:** Triport uses secure bearer token authentication. Embedding keys directly in the URL path exposes credentials in server logs, proxy histories, and repository commits. You must pass your key securely via the HTTP header using `x-token: <YOUR_API_KEY>`.

**Q: The Global Sync Status shows 0%, but the network cards show "LIVE". What does this mean?**
**A:** The "LIVE" badge indicates our load balancers are successfully connecting to servers and not returning 502/503 errors. A 0% Sync Status means the upstream nodes are currently desynchronized from the blockchain consensus. During this state, `sendTransaction` calls may still broadcast, but read-requests will return stale on-chain data.

**Q: What exactly does the "Performance (1H)" chart display?**
**A:** This chart visualizes the transit latency between Triport edge proxies and the upstream blockchain nodes over the past 60 minutes. If you observe a sudden spike, it usually indicates heavy congestion or degradation on the base blockchain network itself, rather than an outage within the Triport proxy layer.

**Q: Can I use a single WSS endpoint URL for both Ethereum and Polygon?**
**A:** No. While your single Triport API key authenticates you across all networks, the endpoint URLs are strictly unique to each specific chain. You must copy the exact URL from the corresponding network card to route your traffic correctly.

**Q: Why does the TPS metric show a dash ("–") on the dashboard?**
**A:** A dash indicates that the system is either actively polling the current metric or the underlying network is temporarily halted and not producing new blocks. Always cross-reference this with the Performance chart and Sync Status before assuming an infrastructure outage.

- **Solana** (`sol`, chainId 101) — block, TPS, status.
- **Ethereum** (`eth`, chainId 1) — block, TPS, status, and gas.
- **Polygon** (`polygon`, chainId 137) — block, TPS, status, and gas.
- **BNB Smart Chain** (`bsc`, chainId 56) — block, TPS, status, and gas.
- **Base** (`base`, chainId 8453) — block, TPS, status.
- **Tron** (`tron`, chainId 728126428) — block, TPS, status, and gas.
- **Robinhood Chain** (`robinhood`, chainId 4663) — block, TPS, status, and gas.
- **Stellar** (`stellar`, chainId 102) — block, TPS, status.
- **TON** (`ton`, chainId 103) — block, TPS, status.
