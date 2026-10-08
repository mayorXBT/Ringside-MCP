# Ringside MCP

Private agent payments on Solana devnet using Helius Privacy (Solana Rings). Work in progress.

The upstream TypeScript examples are staged in the `vendor/zolana-examples` submodule at commit `3d39626853fea338efc802896024cabda39ed4ab`. The PRD references `3069d79`, which is unavailable from the current upstream remote; current examples use SDK `0.4.0-alpha`. The server pins `@heliuslabs/zolana@0.3.1-alpha` as specified in the PRD.

## Quickstart

Install Node 24 and pnpm 11, then clone with submodules and build:

```bash
git clone --recurse-submodules https://github.com/mayorXBT/Ringside-MCP.git
cd Ringside-MCP
pnpm install --frozen-lockfile
pnpm build
export HELIUS_API_KEY='your-devnet-key'
node packages/mcp/dist/index.js init --owner YOUR_OWNER_WALLET_ADDRESS
```

Fund the printed **agent** address with devnet SOL. It is a dedicated hot wallet; the owner address is only used to sign policy changes. To start MCP over stdio, point your MCP client at the absolute `packages/mcp/dist/index.js` path. For Claude Desktop:

```json
{
  "mcpServers": {
    "ringside": {
      "command": "node",
      "args": ["/absolute/path/to/Ringside-MCP/packages/mcp/dist/index.js"],
      "env": { "HELIUS_API_KEY": "your-devnet-key" }
    }
  }
}
```

The same stdio command works in Claude Code and Cursor MCP settings. Keep `RINGSIDE_HOME` consistent between the MCP process, CLI, seller API, and dashboard control API.

Run `HELIUS_API_KEY=... pnpm check:devnet` for a read-only RPC check. After funding a dedicated devnet keypair with at least 0.03 SOL, run `RINGSIDE_KEYPAIR=/path/to/keypair.json pnpm check:m1` to register and deposit 0.01 SOL. Its result is tracked in [STATUS.md](STATUS.md). The server package builds with `pnpm --filter ringside-mcp build` and runs over stdio with `node --use-env-proxy packages/mcp/dist/index.js`.

`node packages/mcp/dist/index.js pair` prints the local dashboard pairing token; `kill` and `kill off` toggle the local emergency stop. The control API listens on `127.0.0.1:7420` and requires the pairing token; policy writes also require the owner's wallet signature.

The owner dashboard runs locally with `pnpm --dir apps/dashboard dev` after `pnpm install`. Open `http://localhost:3000`, paste the pairing token, then connect the configured Phantom owner wallet. Set `RINGSIDE_DASHBOARD_ORIGINS` on the MCP server to include a hosted dashboard origin before using it remotely.

Devnet only. Default Rings transfers hide asset and amount while sender and recipient remain public. Deposits and withdrawals reveal their details on-chain.

## Current tool coverage

| Group | Tools | Status |
|---|---|---|
| Core wallet | `wallet_info`, `register_private_wallet`, `deposit`, `sync_balance`, `read_history`, `private_transfer`, `withdraw`, `create_test_token`, `deposit_with_interface_setup` | Implemented; read calls checked on devnet, funded transactions pending |
| Owner policy | `get_policy` | Implemented; local caps, allowlist, kill switch and signed control writes tested |
| Seller | `create_payment_request`, `pay_payment_request`, `verify_payment` | Implemented; logic tested, devnet end-to-end pending |
| Swap and escrow | 9 tools | Tier C: return `ENGINE_UNAVAILABLE` until Rust engine and programs are built |

Run `pnpm check`, `pnpm test`, and `pnpm build` for local verification. See [STATUS.md](STATUS.md) for the live acceptance checklist and [docs/security.md](docs/security.md) for limits. The dashboard is built locally but is not yet deployed. Swap and escrow example circuits use insecure test keys and must never be treated as mainnet-ready.
