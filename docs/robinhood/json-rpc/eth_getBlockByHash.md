> Live version: https://triport.io/docs/robinhood/json-rpc/eth_getBlockByHash

# eth_getBlockByHash

> Return a block by hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockByHash` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockByHash` — return a block by hash. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

A block by hash, when you already know the hash and want exactly that block regardless of reorgs. This is the reorg-safe half of the pair: a number can come to mean a different block, a hash cannot.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | Hash | yes | 32-byte block hash. |
| `fullTransactions` | boolean | yes | `true` returns full transaction objects, `false` only their hashes. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBlockByHash","params":["0x0000000000000000000000000000000000000000000000000000000000000000",false]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getBlockByHash",
  "params": [
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    false
  ]
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "baseFeePerGas": "0x128b5080",
    "difficulty": "0x1",
    "extraData": "0x796e4c4336978c7ad60e6c8a54732e3d3da7111fd2b04210aa551999b763ccee",
    "gasLimit": "0x4000000000000",
    "gasUsed": "0x14c542",
    "hash": "0x16250ba41b4f026eced057ca70be950e90485ab8a43ec57786e4afafd2b8e6fb",
    "l1BlockNumber": "0x18b95b7",
    "logsBloom": "0x00000000011001008020010312080010201000011000090000020000240044010001000000004101000100000000020006000000042023200000000000200200010000000802442800008018002000800000080008000022000000021020000000040000020400000000100001000c10088000000001004000040250040a00080a0001080000000900000120000000000018001000000000020000000004100402220001004800300000002008000200000049800c80000000400004000080008000140200000002c000000000211420208000002420102000002000002020000010000000400000044000008128008000008000011008000010a2080a140000",
    "miner": "0xa4b000000000000000000073657175656e636572",
    "mixHash": "0x000000000000084200000000018b95b7000000000000003d0000000000000000",
    "nonce": "0x000000000003a638",
    "number": "0x3626e6a",
    "parentHash": "0x84745638f208c789569f131fc9935b3bb24c0506e5889cf6c56fd8b0ea167fe0",
    "receiptsRoot": "0xa94ed2ac6e0e1a14016f8c2d7b6c1360be86112e05d1a1a3245132dd3d284b2a",
    "sendCount": "0x842",
    "sendRoot": "0x796e4c4336978c7ad60e6c8a54732e3d3da7111fd2b04210aa551999b763ccee",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "size": "0x207a",
    "stateRoot": "0x60f3bff022953a223f622e7770e3206a86eda3f576b2e4e0d1425a12ca638c1d",
    "timestamp": "0x6a9e998b",
    "transactions": [
      "0x33d1506ccf25888d6f882aba0c4b0a71898dcebe5623e74c2c371cdfca34c5d2",
      "0xe72fc947a7b1aba1f9d33db70ca773b7ebd0a8048e2ba8f15d1b38355458f894",
      "0x8044b691f48d96e9dfbd78194f46cf9005759429d6ea0085602c9ff19afba61f",
      "0x85a09cf8c17f95a0549146aafacbd2090222e10c00d9a64e0fa6e1d3ff4c1d4e",
      "0xd1a5584d46235781ddd12796cfb5179e4cf87797bc33d5f6dc0346ddb0de36b3",
      "0x35d1dbe0c8fba8f469a63b7eed1446b132958d7b06ba68fea16463a792aa83ae",
      "0xb3729ac08081ebbb22316fdd48254fd1a85b704cd906bd06765b5649a154439d",
      "0xb4555bc3fd50336f71a288005bde0ba1f183754d286f904c4f15b0e6852301fe",
      "0x09b0826a2afa92d61f71d4f621e8885eac80343549ac7e1a98b3c728d002c498"
    ],
    "transactionsRoot": "0x83253981226e5a24da562ee65b6c85a8feb451c45ad06c1c90b788ac03395ca7",
    "uncles": []
  }
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getBlockByHash","params":["0x0000000000000000000000000000000000000000000000000000000000000000",false]}),
});
const payload = await response.json();
```

## Notes

- Reorg-safe half of the block pair: a number can come to mean a different block, a hash cannot.
- Use it to pin a backfill range before walking it.

## Related

[`eth_getBlockByNumber`](./eth_getBlockByNumber.md) · [`eth_getBalance`](./eth_getBalance.md) · [`eth_getCode`](./eth_getCode.md)

[Limits](../limits.md) · [Errors](../errors.md)
