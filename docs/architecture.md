# Architecture

`packages/mcp` runs over MCP stdio and owns the devnet Zolana client, local policy, SQLite ledger, payment verification, and the localhost control API. The dedicated agent keypair stays on the local machine. The dashboard at `apps/dashboard` connects to the control API with a pairing token for reads and an owner wallet signature for writes. `packages/verify` contains the request and receipt checks used by the MCP seller tools and `examples/seller-api`.

The Zolana SDK receives separate devnet URLs for RPC, Photon indexer, and prover. The single Helius URL did not serve the indexer or prover in the Oct 8 check. Wallet history and balances are decrypted locally after indexer sync. The Rust swap/escrow sidecar is Tier C pending a toolchain and devnet deployment.
