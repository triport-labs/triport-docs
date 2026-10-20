> Live version: https://triport.io/docs/robinhood/json-rpc/eth_getProof

# eth_getProof

> Return an account and storage Merkle proof.

| | |
|---|---|
| **Method / Endpoint** | `eth_getProof` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc_heavy` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getProof` — return an account and storage Merkle proof. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Merkle proof of an account and selected storage slots, for light clients and cross-checking. Proofs are bound to the block you request, so a proof and the state it proves must be read at the same block or they will not verify.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | Address | yes | Account or contract address (20-byte hex). |
| `storageKeys` | array | yes | Storage slots to include in the proof; pass an empty array for the account proof only. |
| `block` | BlockTag | yes | Block number in hex, or a tag: `latest`, `earliest`, `pending`. `safe` and `finalized` are not part of this contract. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getProof","params":["0x0000000000000000000000000000000000000000",[],"latest"]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getProof",
  "params": [
    "0x0000000000000000000000000000000000000000",
    [],
    "latest"
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
    "address": "0x0000000000000000000000000000000000000064",
    "accountProof": [
      "0xf90211a02d3e1bf540f7b51aaed735aff437db7385ad09dadf7e3a888989e317f42b0361a02a17e6d86a2fb1ff52af763f143b03e5b31f9f9abd72ca149c41937a70cd5edaa013675ebf4b11c6aaea3f712dded4098f6ee1698cc666043653c894cb041d4c59a02af46c3b4e66d17197e664b0f7b35daadf6d3b14b467c65ec8ba9d26ba687baea0ab78588204fc4e1b25e05f87a512ef6592e85d4735e3f5b557831192b8846239a0b4966b1601e41f0e20512932115f1a59387176e6f24d835869aba332b26c3c00a0a12f56d6e51910400d374dcbaf17e12595aab144964bf3a353d6585992542ab9a05886634daaaa09e7377e6d379460d69017853c434d6a335ddd6850e75889ee7fa09344b995cf0933678d5ef32ba6f886b8607f7eb2a59010fed3039e5b09f9ce70a0a59ab5d08f748948c4a1678ef1f776dddbdd8ffc71611ffd5ee4afabd726033fa02fdf3a98a7e55acaf0426d7a9fa8bb5768fb0ba195fc494f88838d14d23c1f19a02b7df130a43a0d5ce15657f68e1d8c59004325f311811b5cd960a9388187cabda0560f96bed92d924aa22aad8d17c8def4d20599fcf6e9ce81450004c20a5b6156a024f72f398cb41c380fdb05d5e3bd2aaa0cabaec22197c59c6bff5c0312b2b54ea0ae560919c6c296c417ec1ee0d1c0360706b48e8acf9005330d6fc30045876c36a017893a0a88508dacb419a7691b471e7c8e2fffd853492d23448a6d4d870e900480",
      "0xf90211a0aaaf4ee69bbaf2f65390772ec74ad539921ef7abc354b3f992048abf89687902a05cfb26f65221326b1dcb8427c75253ce37dabf8704447cdc33e8d6ac04f896a2a0a8206a94bb292d4533d45984b458b9123c672c8d837aa6391f61bc3be3fdf3b9a00bb597bd4dcbe57cbe7f59b9782fdfa053f02331468ffff0bfa1f0a331a02178a044efa9e2ee0642585067ab24d02b40ed70fca1baf538063cccc3edd6fc79c96da01a084972518aa49b5e04ea8392bbdccba6daf853dbcab771219d7a5f281cdd15a0310c18883d05360f4149de047fb703a8ff687259870cefadfdc8ff4866408271a09253c95434b9482a648022061d154f09545be483a995094c7c9181979d51502ea08811a729901d238e8d7f3c9794bd76df5cb1a844c4e3bf40884793f740408725a0b44f5d26b47a1186d5e8995e0839e6e01602df4cdae14cfa56be270ee750e7dea062a77b25a338e2b3453df0a1883eb87198cf0dcd23e2472c47830bfcd1d55ccca065f33f377efdb4406720ec05f470e9beac638bb0f7d6901a6dc1039b9c5906c2a0368d9ed07b83075170459bbfdf4f57c157b7331a9da06b27dc2ecd178219af4da025f4d411238cc305e7bd42b0d1dc9d1b2d87516fbb5815120031af08670d3a33a041f00ee8391dcc8832dff98a3147a4f2785366e3229f45c43b14e25f83d4ccbba0942fed0eb9534c29e4b97232085d7080acd6a0b3bf3b8443887cd7ecf2be8ea180",
      "0xf90211a0f956ad266e9d3e7f0d10975baca6ac9633ea039c5bd34dbed16c36626bc03ccaa0411914fe96c5e6dc42ce0ad2454410226a695ad0d074eea3d4717e9bf56d751aa065daed3b759987b5da7430dfe075d6870f038c77262594f952b07a117cdca3fea0ec3ef4060cc75a46fc9ee02ebeae219d0f98e3d1f750f956a771717f3ba62bf3a084671aef11b3efe2dae6d465dab34d185e3054e59328d2d5de8d7113bfa9533fa0eb6c1c774a5a7a3fbbf2c3daadb058ba87081ecf7ebc7ab20914188ce9e2a76da081309c859fa1d904e5c077010e9f2f8dfc795b344c49abdb39b4815ee409c7a2a04e0054c933e3810007b664fbe4184b7cb1b9786364dc3980fe94b995fa4489c2a09bc1c705a5714e808b02ebedef521d67dd8a4fa29a9ea58e36016f99331fcf9ca0114df95b1c01286e85f5d1805c565649749055dd184c7779d9fae5df8cd50fcca056c03e949cf4411f2b8d261ce5df40e590ba931f83733f98901ccced110a0ad4a0afc35785f568380f35c042fe85d6494867a635f14a19fa4876c43d47531e47c9a0c8c7e54ac745a14f7190267b3c6d59a4c0ddcac3fc39201836b5606e2d89954ea0914d9b88004450a6713fad8ed2245c2707722bcedeec542d32288c1f50903fd5a0832fcca3a2f0a65de237193281b0eb563e89da5b0cf1eb7fc5c96394e95ce602a0be15b67d4c844bf283cfa5e9586a723c6e8f3b228e62593f2bd9f497e68f8ef480",
      "0xf90211a01094ab61138836fb44a9e75106c8ead5e2bd80e7a161539271ee20a775963142a0a1437ef3767b58856cd2149af37410f5b34d5f1aecc3439452e217cdbcf4e12fa03cec0637f75931f8fb76088628442da3c7214892bf8b53d092aae2f869781ce2a0d7273dd93c702b8b059859ab08996f57e7ff0dd1f5a3cf6006c6f51ee7992579a05f1f6d704ce1934514c07bd93d42b68caabd0750e7c06ca82802e235b15b22b6a0f98c522144527eeae6450c695e1766a74eebdc004268543e3c0d216b1c151fa9a05fef77f3c93dd0b86dc0fdc907473b3d1858a63bf524796aa3e3fd09495f22b8a07f05e400c995063c948ee36c99f074efe358c0ee185ed1ffd0577c0d980a00cea08e2a7048471c8703d58998ccec5add979b950ca7165de493b7b4f1c935e8797fa0723f98975649fecc086dbbd63ccbb8ffef29001358981390b7bf3c9be0de8615a0fbc155a4df577daa63c46643d6e63495b72b7390cc099b0ace6957650044fa4fa0f4511aa839d39075bdf3d36c33edb3a543edbc2012f185d612f8685ac1534d7ea08971fd492908357f72c9d3ab17344ef6c1f10b6abeaf23f1aa352a85a4fc497ba0758702e2f2fa6529b59181d0e7024e7fd95448b34de7f2e8a648ab6b45e95279a052c3689cc9a29cc86934d45a9578029998e3c8c74ec5ffd82efa71d9acfec9f0a00649b10f503a0bf2637906310eea7999100ca6d09ac2324eba90d62cadc7e96680",
      "0xf90211a02c496d4d53717874704ffe32a1edc45e23aa5908cd3adf9a162d6078b0f1055ca0d1ae145c3d6e40fb62bd97970fe61bd57c4cf75ff5bf8b30e7418f2bbc0100dea06ad58a4c2af58780c91fef6f5919c06586132ab764b5dc606ba586094ead6dc0a0f7447c66271844c9ce1db3c77f29ec517c4c0c6e98c6e403aad1d1c3ec8e44c9a0c950e456986c7f175ec6ee892807cd0627afae0fbb6e0dac63b543ded4f959f4a0ba47cf3f3fc5d0fabab7a0d3a78cb3dd1cd772252ecd02a2a07003ac75e66a9ca0a09e33b7611e05e14444626c52ad327b9caa24469c1c5c40d9f7c762d7d999dfa07d195c29c999993123df26b5561a4d3c480cd6b41bd05050267883c33d0e0f19a01e22a9e988d7ecf0e599cd484e2cbd26a56b74d997b36bdecf031e4ab19d2acca094755839a0b591a936c5c2526631e524f4204dac811d9c645e6a2e82bd076d1ea0639e6b2ce811af97572cf906961f73adfa9c72861d244a490d2f347f4c8e568aa0dc497297f767a39798ff6a0948f7f4fe9c07914b0dce7a24814354ebcd2c3c12a0c8d7ae3ba40897a60145ac4e95dec1da8648fc76f3cbaa54bc7b97ed11562093a047e5082448f9a0a8af04f004121539bbab4f4c8c4bb467750abc058f5de447a2a02e2b237a743aa338ad88123515f4c92237fbd15d8e9940e3f005959c9a07e2b8a01a2e38f34fcb55ed872fd7576953277c768b9d66e6286cdb2c6a870ec9f9ae6580",
      "0xf9011180a085b16177e5db39a61328b1fcfede7dc1bd089c9ca385413c33e0098355a678dd8080a0a3e5485cd7e29ea4990a7fe85dddc45b57b8c30757f19716614533c01d8e15eba0d6145d760094c987d7b0d8b8088c3f5b1b11b4546a69ac9e62124c6df8905bbd80a00253a2ec8544802e7e4b236e2287613874cf45fc34eeb3ef56cfbe9b9c992f56a0d60471e7d395db4b843cce8ce430c06c2c77c0dc68d90352801c914f2846f783a07e919e6cf5ed7fabc394f76e16301814b3aff582dfc0694e09b29ce4632990d5808080a05a8cf176c81efeba764acace92cbb0bd8b9decaa6c492d446e358d9361a2325da0202d66a2406d4a1d8789c6cccea6a38ce92f330e43b33fb69e7e66564bf3ffa88080",
      "0xf8679e20829446ad570b5b97d38a504782a6522204c67d5f29b61515246d0410dcb846f8448080a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0bcc90f2d6dada5b18e155c17a1c0a55920aae94f39857d39d0d8ed07ae8f228b"
    ],
    "balance": "0x0",
    "codeHash": "0xbcc90f2d6dada5b18e155c17a1c0a55920aae94f39857d39d0d8ed07ae8f228b",
    "nonce": "0x0",
    "storageHash": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "storageProof": [
      {
        "key": "0x0",
        "value": "0x0",
        "proof": []
      }
    ]
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
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getProof","params":["0x0000000000000000000000000000000000000000",[],"latest"]}),
});
const payload = await response.json();
```

## Notes

- A proof is bound to the block it was requested at: verify it against state read at that same block.
- Historical proofs are subject to the same measured archive floor as other historical state.

## Related

[`eth_getBlockReceipts`](./eth_getBlockReceipts.md) · [`eth_getLogs`](./eth_getLogs.md) · [`debug_traceBlockByHash`](./debug_traceBlockByHash.md)

[Archive depth](../archive.md) · [Limits](../limits.md) · [Errors](../errors.md)
