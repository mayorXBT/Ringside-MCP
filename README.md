# Ringside MCP

Private agent payments on Solana devnet using Helius Privacy (Solana Rings). Work in progress.

The first milestone checks devnet connectivity and stages the upstream TypeScript examples. `vendor/zolana-examples` is a git submodule at `helius-labs/zolana-examples` commit `3d39626853fea338efc802896024cabda39ed4ab`. The PRD references `3069d79`, which is unavailable from the current upstream remote; current examples use SDK `0.4.0-alpha`. The server implementation will pin `0.3.1-alpha` as specified in the PRD and record any compatibility findings.

Run `HELIUS_API_KEY=... pnpm check:devnet` for a read-only RPC check. After funding a dedicated devnet keypair with at least 0.03 SOL, run `RINGSIDE_KEYPAIR=/path/to/keypair.json pnpm check:m1` to register and deposit 0.01 SOL. Its result is tracked in [STATUS.md](STATUS.md). The server package builds with `pnpm --filter ringside-mcp build` and runs over stdio with `node --use-env-proxy packages/mcp/dist/index.js`.

For a fresh dedicated wallet, run `node packages/mcp/dist/index.js init --owner <your-wallet-address>`, then fund the printed agent address with devnet SOL. `node packages/mcp/dist/index.js pair` prints the local dashboard pairing token; `kill` and `kill off` toggle the local emergency stop. Set `HELIUS_API_KEY` before starting the MCP server. The control API listens on `127.0.0.1:7420` and requires the pairing token; policy writes also require the owner's wallet signature.

Devnet only. Default Rings transfers hide asset and amount while sender and recipient remain public. Deposits and withdrawals reveal their details on-chain.
