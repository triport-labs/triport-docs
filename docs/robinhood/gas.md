> Live version: https://triport.io/docs/robinhood/gas

# Getting ETH for gas

Robinhood Chain uses ETH for transaction gas. The canonical route deposits ETH from L1 through the `DelayedInbox` contract at `0x1A07cc4BD17E0118BdB54D70990D2158AbAD7a2D` by calling `depositEth()` (selector `0x439370b1`). Allow about 10 minutes based on the September 2026 bridge measurement. The user pays L1 gas, so cost varies with L1 conditions.

Before sending value, verify the chain, contract address, wallet prompts, and current official instructions. Triport provides RPC connectivity and does not operate the bridge.

Partner routes may also be available; these are external services, not Triport products, and no availability is promised:

- [Official Robinhood bridging guide](https://docs.robinhood.com/chain/bridging/)
- [Across to Robinhood](https://across.to/?to=robinhood)
- [Relay bridge](https://relay.link/bridge/robinhood)
