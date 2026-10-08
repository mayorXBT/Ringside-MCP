# Rust sidecar status

Tier C is active. The Rust swap and escrow sidecar and its devnet programs have not been built or deployed. MCP advertises their tool schemas so clients can discover the planned coverage, but calls return `ENGINE_UNAVAILABLE` even if an external binary path is set. Spend policy integration must be completed before the bridge can execute those operations. Do not claim these operations work on devnet.

The source orchestration references are in the `vendor/zolana-examples` submodule. The example programs use insecure deterministic proving keys and are suitable only for devnet test funds. The PRD's escrow contract allows creator withdrawal after a timelock; it has no trustless beneficiary release. `escrow_release` is intended as withdrawal followed by a separate private transfer.

This environment currently has no Rust compiler, Cargo, or Solana CLI. Building the engine requires those tools and Go 1.27.1+ as described in the PRD. A deployment must use new program keypairs and recompile `declare_id!`; the upstream swap and escrow program IDs are not deployed on devnet.
