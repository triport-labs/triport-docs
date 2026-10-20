> Live version: https://triport.io/docs/robinhood/conditional

# Conditional transaction submission

Robinhood's catalog includes `eth_sendRawTransactionConditional`. Call it at `POST /rpc/robinhood` with `robinhood:rpc` scope; it charges `robinhood_send_tx`.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_sendRawTransactionConditional",
  "params": ["0xSIGNED_TRANSACTION", {"blockNumberMax": "0x3600000"}]
}
```

The required `options` object accepts only:

| Option | Meaning |
|---|---|
| `blockNumberMin`, `blockNumberMax` | Inclusive block-number bounds. |
| `timestampMin`, `timestampMax` | Inclusive timestamp bounds. |
| `knownAccounts` | Address-to-state-root or address-to-storage-slot/value conditions. **Pin narrowly:** a whole state root changes on every unrelated write to that account, so a transaction pinned to it is dropped far more often than one pinned to the specific slots you depend on. |

Triport validates key names and value shapes before fanout. An unknown key, malformed number, address, slot, or value returns the exact local error:

```text
-32602 invalid conditional options: <field>: <reason>
```

The proxy does not evaluate conditions. A structurally valid request is passed to an eligible submission target, where conditions are evaluated at submission time. A local validation reject is free of network submission and gas cost. In a JSON-RPC batch, conditional requests are dispatched per item, so one invalid element gets its own `-32602` without blocking other elements.

## Two failures that look similar and are not

**Malformed options** are rejected by us before any upstream call: you get the `-32602` above, naming the exact field and reason. Nothing was submitted and no gas was spent — this is a bug in your request builder.

**Conditions that no longer hold** are decided at submission time by the target, not by us, and they are **not returned as an error at all**. The transaction simply does not land. Detect it the way you detect any non-inclusion: poll [`eth_getTransactionReceipt`](./json-rpc/eth_getTransactionReceipt.md) and, once your own deadline (`blockNumberMax` or `timestampMax`) has passed, stop waiting and rebuild.

The practical rule: treat `-32602` as "fix the code", and a missing receipt past `blockNumberMax` as "the world moved on" — the two need completely different responses. A returned transaction hash means the request was routed, not that the transaction was included.

It is not a private-orderflow facility: the sequencer decides inclusion. See the generated [`eth_sendRawTransactionConditional` reference](./json-rpc/eth_sendRawTransactionConditional.md).
