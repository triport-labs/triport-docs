> Live version: https://triport.io/docs/base/flashblocks

# Base Flashblocks feed

> Availability: `unknown` · Minimum tier: `pro`

The staged client template is `{WSSBase}/ws/base-feed/{key}`, normalized to `/ws/base-feed` with scope `base:feed`; clients receive only bounded normalized events. An address filter is required: pass it as a JSON query value, for example `/ws/base-feed?filter={"addresses":["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"]}` (URL-encoded).

## Normalized schema example

This synthetic empty-delta object matches the frozen AsyncAPI shape. It is not a captured event and contains no transaction bytes.

```json
{
  "payload_id": "0x0000000000000001",
  "index": 0,
  "base": {},
  "diff": {
    "state_root": "0x00",
    "receipts_root": "0x00",
    "gas_used": "0x0",
    "block_hash": "0x00",
    "transactions": []
  },
  "provenance": "raw_flashblocks_primary",
  "finality": "preconfirmed"
}
```

`payload_id` is opaque, not a block hash or global cursor. `index` is an unsigned sequence value with no protocol maximum of 9 or 10. Consumers require index 0/base anchoring, contiguous deltas, bounded reorder/gap/reorg handling, original-byte Keccak transaction hashes, and independent number/parent/ordered-transaction reconciliation.
