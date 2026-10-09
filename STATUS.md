# Ringside MCP build status

Updated Oct 9, 2026 (UTC). This is the handoff for continuing the PRD build. The repository is on `main`, and completed stages have been committed and pushed to `mayorXBT/Ringside-MCP`.

## What is built

- **Workspace and source:** Node 24 / pnpm 11 monorepo, MIT license, README quickstart, architecture and security notes, GitHub Actions CI. `vendor/zolana-examples` is a git submodule at `3d39626853fea338efc802896024cabda39ed4ab`. The upstream TypeScript examples pass their format and type checks.
- **MCP server:** `packages/mcp` builds with `@heliuslabs/zolana@0.3.1-alpha` and lists 22 P0 tools. Core tool code covers wallet info, registration, SOL/SPL deposit, balance sync, history, private transfer, withdrawal, test token creation, and SPL interface setup. Private transfer resolves the recipient's registration and rejects an unregistered address before constructing a spend. Core spends are serialized within one process.
- **Policy and local control:** JSON policy plus SQLite ledger enforce kill switch, read-only mode, asset and recipient allowlists, and per-transaction, session, and UTC-day caps. The CLI supports `init`, `pair`, `kill`, and `status`; generated keypair, config, and pairing token files use mode 600. The control API binds `127.0.0.1`, requires a pairing token for reads, verifies owner ed25519 signatures for policy/kill writes, stores used nonces, and exposes status, balances, activity, policy, and SSE events. MCP tools cannot edit policy.
- **Seller flow:** `@ringside/verify` creates payment requests and checks receipt amount, asset, payer, expiry, and replay. MCP has `create_payment_request`, `pay_payment_request`, and `verify_payment`; `examples/seller-api` implements a `/report` HTTP 402 / `X-PAYMENT` retry flow. Tool and control error paths redact configured API keys.
- **Dashboard:** `apps/dashboard` is a locally built Next.js app with Phantom owner-wallet connect, pairing, private balances, SOL budget gauges, activity, owner-signed policy editor, kill switch, SSE refresh, and five-second polling fallback. Its production build and local HTTP 200 check passed. It has not been deployed or tested with a real owner wallet in the browser.
- **Swap/escrow coverage:** All nine tool schemas are listed. Tier C is active: calls return `ENGINE_UNAVAILABLE`, including when an external binary path is set. The bridge is gated until Rust orchestration and spend-policy integration are implemented. No swap/escrow programs have been deployed. See `engine/README.md`.

## Decisions and findings

1. **Devnet only.** Mainnet RPC URLs are refused. Default Rings transfers conceal asset and amount while sender and recipient remain public; deposits and withdrawals are public.
2. **SDK pin and examples:** The PRD's `zolana-examples` commit `3069d79` is not fetchable from the current upstream remote. Current examples use SDK `0.4.0-alpha`; the server pins the PRD-required `0.3.1-alpha`. Keep version differences visible while porting.
3. **Separate service URLs:** Helius devnet RPC works with `HELIUS_API_KEY`. The upstream CloudFront Photon indexer sync works, and the CloudFront prover health endpoint returns `ok`. Pointing all three services at the single Helius URL failed for indexer sync and prover health, so the server defaults to separate hosts with environment overrides.
4. **Local owner boundary:** The agent has a dedicated local signer; the owner wallet signs policy changes and need not be the agent's fee payer. No private key files are tracked. The seller verifier stores the request nonce locally; the transfer has no on-chain nonce memo, so it also rejects a payment whose block time precedes the request.
5. **Engine tier:** Rust, Cargo, and Solana CLI are absent here; `/usr/bin/go` is not the required Go toolchain. The PRD allows Tier C. Its upstream swap/escrow proving keys are insecure test keys, and the example escrow only lets its creator withdraw after a timelock. An owner-approved bounty release would be a second, separate private transfer.
6. **Dashboard scope:** A functional Next.js page was built with plain CSS first. Tailwind/shadcn styling, auditor mode, approval queue, and production deployment remain open.

## Milestone 1 funded result

- Supplied buyer and seller keypairs are outside the repository at `/workspace/ringside-keys/buyer.json` and `seller.json` (directory 0700, files 0600). Their derived public addresses are buyer `GxCNFRN7zRC43ugwdGQ5AsVZqkLFY2rviL8fts2gUaZP` and seller `79ARuP2P78svsx3wRyYKuD6mizktZvqkhuqF3yJEUr9J`. No private bytes were printed or tracked. The buyer was selected for M1.
- Locked dependencies installed after outbound access became available. The registration and deposit smoke check passed: buyer started with 5 public SOL, registration confirmed at slot `509082806` (signature `2QE6bivxfFTdHwGy4fEfn2gCxbJn8Ya4sg2CvcK58V4XVJwWowjTXbrrqAJe3ELZpR5hFs8ASYqgQmti3kctZkKS`), deposit of 0.01 SOL confirmed at slot `509082814` (signature `UzHbjEKqdWdbrNB9ccjXUrqAZXK4FG23hkVG6omoULxHwRJvodHJghNjNvJfDqV3h41hz1wdq3tqmfw9PanERas`), and sync returned a private balance of 0.01 SOL in one UTXO.
- **M1 is blocked, not complete.** The attached PRD is now committed as `PRD.md`; its M1 exit requires deposit, private transfer, and withdrawal. Upstream `register_private_wallet.ts` passed with the funded buyer as sponsor. Upstream `deposit_transfer_withdraw.ts` deposited 0.01 SOL but failed during transfer proof with `CLIENT_PROVER_HTTP` (HTTP 502) on SDK `0.4.0-alpha`. The repo's pinned SDK `0.3.1-alpha` path registered the seller (signature `4xNbMe4mrx2xSjveZAUVWxWzCzhC1eNvnH9ZCCX5VgdfyGbFCFxL3FSpbfnfyzbinqwhjGEDCyWgb6mWghdR8sLY`, slot `509084400`) but private transfer failed before submission with `WALLET_BUILD_TRANSFER` caused by `CLIENT_INDEXER` `getMerkleProofs` (`API_JSON_RPC`). No private transfer or withdrawal signature exists. Do not advance to M2 until a full loop passes.

## Verification completed

- `pnpm check`, `pnpm test`, and `pnpm build` pass locally, including the dashboard production build. `pnpm check:examples` passes against the upstream TypeScript examples.
- Latest CI run before this status update passed install, type checks, tests, and build on `main` (`e8c1305`, GitHub Actions run `37837219243`).
- Helius devnet `getVersion`, SDK `wallet_info`, `sync_balance`, and `read_history` passed using an empty isolated wallet. Upstream `sync_balance.ts` and `read_history.ts` ran unmodified. The MCP client listed all 22 tools; a swap call returned `ENGINE_UNAVAILABLE` as designed. A live recipient lookup returned `RECIPIENT_NOT_REGISTERED` for an unregistered devnet address.
- Tests cover policy limits and kill switch; seller wrong amount, asset, payer, expiry, and replay; owner signature tampering; control HTTP unauthorized, wrong-signer, valid-write, and replay cases; and API-key redaction. Control `/v1/status` returned 401 without the pairing token and 200 with it.

## Live checks blocked or still open

- M1 private transfer and withdrawal, the five upstream examples as a complete funded sequence, the buyer/seller 402 flow, dashboard wallet signing, and a clean-machine quickstart remain unverified. Registration's optional sponsor path is not implemented. SPL withdrawal and shielded-address recipient input still need live verification. Cross-process spend locking is not implemented; run one MCP process per wallet.
- Swap/escrow Tier A or B, Vercel deployment, videos, npm publishing, and hackathon submission have not been done. The current npm packages are private workspace packages.

## Next steps, in order

1. **Unblock M1 proof services.** Diagnose the devnet prover HTTP 502 and indexer `getMerkleProofs` JSON-RPC failure with Helius; retry a private transfer from the buyer to the registered seller, then withdrawal. The buyer and seller keypairs are available at the local paths above. Avoid rerunning the deposit unless another 0.01 SOL deposit is intended.
2. **Finish the upstream example run.** After transfer works, run the remaining staged TypeScript examples with the funded signer and record SDK-version differences.
3. **Finish M2 and seller end to end.** Register both buyer and seller, then run deposit → private transfer → sync/history → withdrawal, plus test token/interface setup and SPL withdrawal. Check policy denial, allowlist, and kill behavior against real tool calls. Start `examples/seller-api`, pay its 402 request, verify a 200 retry, then test wrong amount/asset/payer, expiry, and replay on devnet. Fix any SDK errors revealed by those runs.
4. **Exercise the dashboard with an owner wallet.** Pair in Chrome, inspect live balances/activity, sign a policy change and kill toggle, verify wrong-wallet rejection, then configure an allowed origin and deploy to Vercel if access is available. Add auditor mode and approvals only after the core demo is reliable.
5. **Decide engine tier after a real spike.** Install Rust/Cargo, Solana CLI, and Go 1.27.1+ in a suitable environment; build and deploy patched devnet programs with new IDs, test SPP CPI and escrow first, then swap. If that fails or the deadline is tight, keep Tier C explicit. Do not ungate engine spends before policy enforcement and encrypted escrow-note persistence are implemented.
6. **Ship after live acceptance:** rerun the demo from a clean state, record pitch/demo videos, finalize README and submission details, then publish/deploy/submit as appropriate. The PRD's internal target is Oct 12, 22:00 WAT; hard deadline is Oct 13, 07:59 WAT.
