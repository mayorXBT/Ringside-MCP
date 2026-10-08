# Build status

## Milestone 0: scaffold and upstream examples

- Workspace scaffold created for Node 24 and pnpm.
- Current upstream Zolana TypeScript examples staged as `vendor/zolana-examples` submodule at `3d39626853fea338efc802896024cabda39ed4ab`.
- Upstream examples pass `pnpm check`.
- Helius devnet RPC `getVersion` works with `HELIUS_API_KEY`.

## Milestone 1: core wallet (in progress)

PRD exit: MCP lists tools; registration, deposit, and balance work on devnet. The five upstream examples require a funded sponsor wallet. No wallet was present in this environment at the start of the build. Record transaction signatures and endpoint findings here when the funded run succeeds.

- MCP currently lists `wallet_info`, `register_private_wallet`, `deposit` (SOL), `sync_balance`, and `read_history`. TypeScript build passes.
- `wallet_info`, `sync_balance`, and `read_history` ran against devnet using the isolated M1 wallet. The two upstream read-only examples also ran without modification.
- Endpoint check: Helius devnet RPC works; the example CloudFront indexer sync works; the CloudFront prover health endpoint returns `ok`. Pointing all services at the single Helius URL fails for both sync and prover health, so separate defaults are required today.
- Funding check: the M1 wallet is `4a1bZaWDgDcThDNV5JPMXeqgVfFaPe5ju9WzQQWU4nB7` (key stored locally at ignored `.local/m1-agent.json`, mode 600). Helius `requestAirdrop` returned HTTP 500 for 0.1 and 1 SOL; public devnet RPC returned `Internal error`; Alchemy demo RPC returned HTTP 429. Registration simulation fails with zero balance. Funded registration and deposit remain unverified.
- The formal M1 check reached its funding gate and stopped at 0 SOL on Oct 8. Once funded, run `RINGSIDE_KEYPAIR=/workspace/Ringside-MCP/.local/m1-agent.json pnpm check:m1` with `HELIUS_API_KEY` set. This registers the wallet and deposits 0.01 devnet SOL.

The PRD references Zolana examples commit `3069d79` and SDK `0.3.1-alpha`. Upstream currently exposes commit `3d39626853fea338efc802896024cabda39ed4ab` and examples pinned to `0.4.0-alpha`. Keep this compatibility difference visible during the port.

## Milestone 2: transfers and policy (in progress)

- `private_transfer` uses recipient registration resolution and rejects an unregistered recipient before constructing a transaction. This guard was checked live against a devnet address.
- `withdraw` is implemented through the SDK helper. Both spend paths sync before proving and serialize spends within the MCP process.
- Policy reads local `config.json`, enforces kill switch, read-only mode, asset and recipient allowlists, per-transaction, session, and UTC day caps, and records confirmed spends in SQLite. Its enforcement test passes.
- Neither transfer nor withdrawal has a funded devnet end-to-end result yet. Sponsor registration and owner-signed policy writes are still pending.
- `create_test_token` and `deposit_with_interface_setup` are now compiled as MCP tools. They still need funded devnet execution; the policy test and TypeScript checks pass.

## Seller flow (in progress)

- `@ringside/verify` creates requests and checks private receipt evidence for amount, asset, payer, expiry, and replay. Its unit test passes.
- MCP tools `create_payment_request`, `pay_payment_request`, and `verify_payment` are wired to a SQLite nonce/replay store and the seller wallet's decrypted history. `examples/seller-api` serves `/report` with HTTP 402 and checks `X-PAYMENT` on retry.
- End-to-end seller API verification is pending funded keypair access. The named `/workspace/ringside-keys/buyer.json` and `seller.json` paths are absent in this execution environment as of the last check. No private key files are tracked.

## Local control (implemented, dashboard pending)

- `ringside-mcp init --owner <address>` creates an agent keypair, policy config, and pairing token with mode 600; `pair`, `kill`, and `status` work locally.
- Control API binds `127.0.0.1`, requires pairing token for reads, and verifies owner ed25519 signatures on policy/kill writes. Read endpoints for status, balances, activity, and policy are present. Signature tampering tests pass; unauthorized/authorized HTTP status checks returned 401/200.
- The dashboard UI, SSE feed, live signed-policy browser flow, approval queue, and auditor mode remain pending.
