> Live version: https://triport.io/docs/tron/wallet/triggerconstantcontract

# triggerconstantcontract

> Executes a read-only native Tron contract call without broadcasting a transaction.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/triggerconstantcontract` |
| **Type** | Native wallet HTTP contract read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc_heavy`: 2 / 5 / 20 / 80 RPS sustained · short burst 4 / 10 / 40 / 160 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`triggerconstantcontract` executes a constant contract function through the
native wallet interface. It is read-only and does not create or broadcast a
transaction. The function is identified by its Solidity signature, with
optional ABI-encoded arguments supplied separately.

Both address fields use hex-41 by default; all addresses must be Base58 when
`visible` is `true`. For a raw EVM call object and ABI-encoded return bytes, use
[`eth_call`](../json-rpc/eth_call.md). A successful HTTP status does not by
itself prove that contract execution succeeded.

## Parameters

The JSON body defines the caller, target, function, and optional arguments.

| Name | Type | Required | Description |
|---|---|---|---|
| `owner_address` | string | yes | Caller address in hex-41 form by default. |
| `contract_address` | string | yes | Target contract address in hex-41 form by default. |
| `function_selector` | string | yes | Non-empty Solidity signature such as `totalSupply()`. |
| `parameter` | string | no | ABI-encoded arguments as hexadecimal without a `0x` prefix. |
| `visible` | boolean | no | Defaults to `false`; set `true` only when every address is Base58. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/triggerconstantcontract \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"owner_address":"41a614f803b6fd780986a42c78ec9c7f77e6ded13c","contract_address":"41a614f803b6fd780986a42c78ec9c7f77e6ded13c","function_selector":"totalSupply()"}'
```

## Response

```json
{}
```

The concrete response example is **unknown**: the OpenAPI contract publishes no
response example or execution-result fields. `{}` is a schema-valid placeholder,
not evidence that the sample call succeeded.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Native constant-call result; properties are not enumerated by the schema. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | A required field is missing or an address/parameter is malformed. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc_heavy` budget is exceeded. |

Contract execution can also report a revert inside a successful HTTP response;
inspect the returned operation-specific object rather than checking HTTP alone.

## Examples

```js
const body = {
  owner_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
  contract_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
  function_selector: "totalSupply()",
};
const response = await fetch("https://triport.io/rpc/tron/wallet/triggerconstantcontract", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const callResult = await response.json();
```

## Notes

- This operation is read-only; no broadcast endpoint is part of this guide.
- Do not include `0x` in `parameter`; the schema accepts bare hexadecimal only.
- Related: [`eth_call`](../json-rpc/eth_call.md).
- A TRC-20 `balanceOf` that returns zero is usually a parameter-encoding issue; see [why a TRC-20 balanceOf call returns zero](https://triport.io/learn/tron-trc20-balance-returns-zero).
