> Live version: https://triport.io/docs/ton/errors

# TON errors

General authentication, tier, and rate-limit errors are in the
[global error reference](../errors.md).

- `-32602`, `beyond_retention`, `oldest N`: the requested `seqno` is below the
  selected liteserver's measured retention floor. Choose `seqno >= N` or omit it.
- Liteserver messages such as `not in db`, `block not in db`, and `state not in
  db` are classified as the same retention boundary when they accompany an old
  block request; they are not rewritten to an empty result.
- `-32601` is returned for `sendBoc` and every other method outside the 13-method
  read-only catalog.
- `-32602` also covers malformed named parameters, including an array where the
  TON surface requires a `params` object.

A retention response is a measured boundary, not an internal failure. Retrying
the same historical request against pruned nodes cannot make it available.
