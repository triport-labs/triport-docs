> Live version: https://triport.io/docs/robinhood/ecosystem

# Robinhood ecosystem links

The following sites are independent of Triport. They are links for discovery, not integrated products, endorsements, or availability promises.

- [Official Robinhood Chain explorer](https://robinhoodchain.blockscout.com/)
- [Robinscan documentation](https://docs.robinscan.io/)
- [Lighter API documentation](https://apidocs.rh.lighter.xyz/docs/get-started)
- [DexScreener: Robinhood](https://dexscreener.com/robinhood)
- [DefiLlama: Robinhood Chain](https://defillama.com/chain/robinhood-chain)

## What this RPC is, and what it is not

Triport publishes **chain-level JSON-RPC access** to Robinhood Chain mainnet: blocks, transactions, receipts, logs, proofs, best-effort debug, and transaction submission. Everything it returns is on-chain data read from the network.

Tokenized equities on this chain are **ordinary ERC-20 contracts**. A position moving between wallets appears as a `Transfer(address,address,uint256)` log like any other token, so it is read with `eth_getLogs` or a `logs` subscription — there is no separate "stock token" endpoint here, and no special log type. See [Track Stock Token transfers](./guides/track-stock-token-transfers.md).

What this RPC does **not** provide: off-chain product data such as quotes, order books, corporate actions or instrument reference data. Those come from the issuer's own APIs, which are separate products with their own terms and availability — Triport neither proxies nor mirrors them, and nothing on this endpoint should be read as a substitute for them.

## Public testnet

Robinhood publishes testnet chain ID `46630`, RPC `https://rpc.testnet.chain.robinhood.com`, feed `wss://feed.testnet.chain.robinhood.com`, and explorer [explorer.testnet.chain.robinhood.com](https://explorer.testnet.chain.robinhood.com/). Triport does **not** proxy this testnet. Check the [official connection guide](https://docs.robinhood.com/chain/connecting/) for current public endpoints.
