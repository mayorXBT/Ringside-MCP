# Reproduce the current Ringside demo

The localnet SOL payment flow below passes end to end. Devnet private transfer and withdrawal remain blocked by Helius proof services; swap and escrow are Tier C (`ENGINE_UNAVAILABLE`). The target 1 USDC and escrow bounty demos are not yet verified. Keep all keypair files outside Git.

## One-time setup

Use Node 24+, pnpm 11, Rust, and the upstream Zolana CLI from tag `v0.3.0-alpha`. From the repo root:

```bash
pnpm install --frozen-lockfile
pnpm build
cargo install --git https://github.com/helius-labs/zolana --tag v0.3.0-alpha zolana-cli --locked
```

Put funded buyer and seller Solana CLI keypair JSON files outside the repo and set these variables in each terminal. The two files used during development were `/workspace/ringside-keys/buyer.json` and `/workspace/ringside-keys/seller.json`; substitute your own paths on another machine.

```bash
export RINGSIDE_BUYER_KEYPAIR=/absolute/path/buyer.json
export RINGSIDE_SELLER_KEYPAIR=/absolute/path/seller.json
export RINGSIDE_TEST_HOME="$PWD/.local/demo"
export RINGSIDE_NETWORK=localnet
```

## Localnet payment and seller verification

1. Start localnet in a separate terminal and leave it running: `zolana dev start`. Its default RPC, indexer, and prover ports are 8899, 8784, and 3001. If its release downloader rejects a managed proxy certificate, download the pinned artifacts through your trusted HTTPS client into the CLI cache and verify their SHA-256 hashes against upstream `release-artifacts.lock` before retrying.
2. Set `RINGSIDE_OWNER_ADDRESS` to the public address of a wallet that supports `signMessage` if you will test owner controls. Seed the buyer and seller wallets:

   ```bash
   RINGSIDE_SEED_DEMO=1 pnpm seed:demo
   ```

   On localnet this airdrops test SOL when needed, registers both wallets, and deposits 0.05 SOL to the buyer if its private balance is below 0.03 SOL. If `RINGSIDE_OWNER_ADDRESS` is set, it also creates the buyer's policy and pairing token without copying the buyer key. Repeat runs inspect balances before depositing.
3. Start the seller API in another terminal:

   ```bash
   RINGSIDE_KEYPAIR="$RINGSIDE_SELLER_KEYPAIR" RINGSIDE_HOME="$RINGSIDE_TEST_HOME/seller" pnpm --filter ringside-seller-api-example start
   ```

4. Run the buyer payment check from the repo root:

   ```bash
   RINGSIDE_HOME="$RINGSIDE_TEST_HOME/buyer" RINGSIDE_RUN_SELLER_PAYMENT=1 pnpm check:seller
   ```

   Expect HTTP 402 with a `ringside-private-v1` request, a private transfer signature, HTTP 200 with the premium report after `verify_payment`, and HTTP 402 `REPLAY` for the same header. The guard flag prevents accidental payment on a routine check.
5. For MCP, start the buyer server with `RINGSIDE_KEYPAIR="$RINGSIDE_BUYER_KEYPAIR"` and `RINGSIDE_HOME="$RINGSIDE_TEST_HOME/buyer"`. Point Claude Desktop, Claude Code, or Cursor at `node --use-env-proxy /absolute/path/Ringside-MCP/packages/mcp/dist/index.js`, passing the same environment variables. Ask the agent to call `wallet_info`, `sync_balance`, `read_history`, and `get_policy`, then request a private payment to the seller address. The repository's stdio test verifies tool discovery and annotations; a Claude Desktop payment still needs manual acceptance.

## Dashboard and owner controls

If an owner address was provided during seeding, run `RINGSIDE_HOME="$RINGSIDE_TEST_HOME/buyer" node packages/mcp/dist/index.js pair` to obtain a pairing token locally. Never paste it into a public issue or commit. Start the buyer MCP process above to serve the control API on `127.0.0.1:7420`, then run `pnpm --dir apps/dashboard dev` and open `http://localhost:3000`. Pair with the token, connect the configured owner wallet, and sign a policy change or kill toggle. The `/audit` page provides read-only balances and history through the local control API.

The public dashboard is `https://ringside-dashboard.vercel.app/`. To connect that hosted origin to a local agent, include its exact origin in `RINGSIDE_DASHBOARD_ORIGINS` before starting the MCP process. The hosted page still reads the agent on `127.0.0.1`; use Chrome for localhost access from HTTPS. Owner wallet signing in the browser remains unverified.

## Devnet retry after Helius proof services recover

Set `RINGSIDE_NETWORK=devnet` and `HELIUS_API_KEY` in the environment, with the funded buyer and seller keypair paths. Build, then run:

```bash
RINGSIDE_RUN_LIVE_TRANSFER=1 pnpm check:live-transfer
```

The script registers wallets if needed, deposits 0.01 SOL only if the buyer has less than 0.005 private SOL, privately transfers 0.003 SOL to the seller, verifies the seller's decrypted balance increased, then withdraws 0.001 SOL. Record all transaction signatures in `STATUS.md`. Do not present localnet signatures as devnet evidence.
