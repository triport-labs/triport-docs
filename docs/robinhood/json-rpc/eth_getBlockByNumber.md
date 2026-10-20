> Live version: https://triport.io/docs/robinhood/json-rpc/eth_getBlockByNumber

# eth_getBlockByNumber

> Return a block by number or tag.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockByNumber` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockByNumber` — return a block by number or tag. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

A block by number or tag, with or without full transactions. At the `pending` tag the block is a changing view: its hash can be null or change, and it is not finality. Unrecognized transaction types are preserved rather than rejected — L2 blob type `0x03` was not observed across 13,652 feed transactions in three windows, so this guide makes no blob-support claim either way.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | BlockTag | yes | Block number in hex, or a tag: `latest`, `earliest`, `pending`. `safe` and `finalized` are not part of this contract. |
| `fullTransactions` | boolean | yes | `true` returns full transaction objects, `false` only their hashes. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBlockByNumber","params":["latest",false]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getBlockByNumber",
  "params": [
    "latest",
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
      {
        "blockHash": "0x16250ba41b4f026eced057ca70be950e90485ab8a43ec57786e4afafd2b8e6fb",
        "blockNumber": "0x3626e6a",
        "from": "0x00000000000000000000000000000000000a4b05",
        "gas": "0x0",
        "gasPrice": "0x0",
        "hash": "0x33d1506ccf25888d6f882aba0c4b0a71898dcebe5623e74c2c371cdfca34c5d2",
        "input": "0x6bf6a42d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018b95b70000000000000000000000000000000000000000000000000000000003626e6a0000000000000000000000000000000000000000000000000000000000000000",
        "nonce": "0x0",
        "to": "0x00000000000000000000000000000000000a4b05",
        "transactionIndex": "0x0",
        "value": "0x0",
        "type": "0x6a",
        "chainId": "0x1237",
        "v": "0x0",
        "r": "0x0",
        "s": "0x0"
      },
      {
        "blockHash": "0x16250ba41b4f026eced057ca70be950e90485ab8a43ec57786e4afafd2b8e6fb",
        "blockNumber": "0x3626e6a",
        "from": "0x712bcd0d74690d0afcbacb1118265e69243c930a",
        "gas": "0x879b",
        "gasPrice": "0x18813180",
        "maxFeePerGas": "0x2c3b3e00",
        "maxPriorityFeePerGas": "0x5f5e100",
        "hash": "0xe72fc947a7b1aba1f9d33db70ca773b7ebd0a8048e2ba8f15d1b38355458f894",
        "input": "0x095ea7b3000000000000000000000000b6cd257c56503b8f128f41a635c9f71aa212f35affffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        "nonce": "0xfad",
        "to": "0xe48c264dda3fc463ff2bad87a425d9ee259fef77",
        "transactionIndex": "0x1",
        "value": "0x0",
        "type": "0x2",
        "accessList": [],
        "chainId": "0x1237",
        "v": "0x0",
        "r": "0x66d6955db398b0fbe9c4df3a438e0f086a3e8bd7743e9e4f94f988c656a36f91",
        "s": "0x10ea2f9f4ad0bfecd89905101af0d387e00358fd471e66c3fe477b46181d004f",
        "yParity": "0x0"
      },
      {
        "blockHash": "0x16250ba41b4f026eced057ca70be950e90485ab8a43ec57786e4afafd2b8e6fb",
        "blockNumber": "0x3626e6a",
        "from": "0xbcf50a01c1f237f34960caff16484387d68b6d89",
        "gas": "0x6aa4",
        "gasPrice": "0x128b62aa",
        "maxFeePerGas": "0x18702caa",
        "maxPriorityFeePerGas": "0x122a",
        "hash": "0x8044b691f48d96e9dfbd78194f46cf9005759429d6ea0085602c9ff19afba61f",
        "input": "0x",
        "nonce": "0x0",
        "to": "0x53091256ebd2d8aa37b45536a5fd864ca764f32f",
        "transactionIndex": "0x2",
        "value": "0x2ea07b50c1f4400",
        "type": "0x2",
        "accessList": [],
        "chainId": "0x1237",
        "v": "0x0",
        "r": "0x2bf832761da64830d225f47bfc78099fb47cdeb4aa37fb8a3adbb9e7c87717fa",
        "s": "0x1c39720b3e7a53fa61fe6b547cca7800899aa9fb3b55fcfed0981ea753182380",
        "yParity": "0x0"
      }
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
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getBlockByNumber","params":["latest",false]}),
});
const payload = await response.json();
```

## Notes

- With the `pending` tag, the block is a right-now view. Its hash may be null or change, and the response is not finality.

## Related

[`eth_getBlockByHash`](./eth_getBlockByHash.md) · [`eth_getBalance`](./eth_getBalance.md) · [`eth_getCode`](./eth_getCode.md)

[Limits](../limits.md) · [Errors](../errors.md)
