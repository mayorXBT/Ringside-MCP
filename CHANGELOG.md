# Changelog

## 2026-10-10 — Devnet status copy

- Updated landing and docs claims after the confirmed Zolana 0.4.0-alpha devnet payments. The preview stays labelled illustrative, and the MCP 0.3.1-alpha and hosted connector limits remain explicit.

## 2026-10-10 — M1 devnet recovery

- Added a guarded Zolana 0.4.0-alpha preflight/transfer/withdrawal script that never deposits. Confirmed a real private transfer and public withdrawal from existing funded buyer state; recorded both signatures in `STATUS.md`.
- Added Zolana 0.4.0-alpha to the browser burner independently of the MCP pin. Confirmed a real browser-burner private transfer and withdrawal on devnet.
- Connected the guided `/demo` transfer and withdrawal steps to browser-signed devnet transactions, added a prover/indexer check and retry fallback, and displayed real signatures in the masked explorer view. Updated public copy to distinguish those live steps from recorded seller verification.
- Ran the full deployed browser-burner path on devnet: registration, deposit, private balance sync, private transfer, and withdrawal all confirmed; recorded the real signatures in `STATUS.md`.
- Repeated the guarded funded buyer → seller M1 transfer and seller withdrawal on devnet without a new deposit. Provisioned the demo seller key as a server-only production secret for the upcoming live verification endpoint.
- Added a server-side demo seller request and `verifyPayment` endpoint backed by Postgres, seller private-note sync, chain payer/time checks, and replay protection. Wired the guided seller step to this real verdict.
- Confirmed the seller verdict on the deployed site against a fresh browser-burner payment, verified that reuse returns `REPLAY`, and withdrew the remaining private SOL. Recorded the real signatures and the remaining dashboard illustration limit in `STATUS.md`.

## 2026-10-10

- Added a hosted Streamable HTTP MCP route, OAuth discovery/DCR/PKCE, Sign-In with Solana consent, encrypted per-owner agent keys, durable policy reservations, and the shared 25-tool server factory.
- Added hosted dashboard session, funding/deposit/withdraw and signed kill controls, plus Claude/ChatGPT connector onboarding and a self-host advanced path. Hosted signup fails closed until a production Postgres URL is configured.
- Polished the landing with one-shot Framer Motion scroll entrances, count-ups, a filling spend meter, typed MCP call, masked explorer amount, and reduced-motion support.
- Added custom duotone proof icons, a gap-ring brand mark, mobile hamburger, masked explorer and seller flow snippets, Helius/Solana logos, 2x WebP dashboard previews, and favicon/social assets.
- Refreshed 1280px and 390px screenshots after browser checks; all checks, tests, and builds pass.

## 2026-10-09

- Rebuilt the landing and app shell on a light 0x-inspired structural system: centered hero, audience cards, factual proof bento, framed dashboard UI, large controls and seller visuals, privacy table, and matching owner app. Kept product claims Ringside-specific and labeled fixture imagery.

- Fixed the design review issues: always-masked explorer example, overlapping white-balance hero, contained mobile proof strip, compact install button, stronger lower-section hierarchy, simplified badges and auditor copy, guided onboarding, and disabled unpaired navigation.

- Applied the private design and GSAP React skills to add a replayable MCP hero demonstration, privacy masking, restrained scroll entrances, and reduced-motion behavior. Removed unused `motion`.

- Deployed the redesign publicly to `ringside-dashboard.vercel.app` and verified the landing, owner, activity, policy, auditor, and legacy redirect routes.

- Added `DESIGN.md` and redesigned the public dashboard into a landing page plus `/app` owner, activity, policy, and auditor routes. Added first-run pairing, a connection drawer, signed review dialogs, structured policy editing, accurate privacy/preview copy, responsive navigation, and illustrative screenshots.

- Disabled Vercel project SSO protection for the dashboard; the public production and preview URLs return HTTP 200 without authentication.
- Built upstream swap and escrow SBF programs, loaded them on Zolana localnet, and passed upstream make/take and lock/withdraw fixture tests. Kept the Ringside engine at Tier C pending user-key orchestration and spend-policy integration; recorded a transient Photon migration failure and the successful fresh retry.

- Added the authoritative PRD to the repository.
- Validated funded buyer and seller keypairs outside Git; confirmed buyer registration and private SOL deposits on devnet, and seller registration.
- Corrected the M1 completion claim: the required private transfer and withdrawal have not passed. Upstream SDK `0.4.0-alpha` received prover HTTP 502; pinned SDK `0.3.1-alpha` received an indexer Merkle proof error. Recorded signatures and blockers in `STATUS.md`.
- Added localnet service selection and explicit live-transfer and seller-payment checks. Built and started upstream Zolana localnet; verified buyer deposit, private transfer, seller sync, and withdrawal.
- Added M2 tool aliases and a stdio MCP annotation test; changed daily spend limits to a rolling 24-hour window.
- Verified the seller API's 402, private payment, successful retry, and replay rejection on localnet.
- Added owner-signed dashboard deposit/withdraw actions, control API authorization checks, and a read-only `/audit` fallback backed by the local control API.
- Built a Tier C Rust stdio sidecar with health reporting and explicit unavailable errors; added Cargo tests to CI.
- Verified localnet SPL interface deposit and withdrawal with a six-decimal test mint, and verified a one-token seller payment including replay rejection.
- Deployed a Vercel dashboard preview and confirmed local browser activity refresh and owner-signed kill-switch enforcement with a synthetic test owner.
- Verified the latest Vercel preview from `main` responds on `/` and `/audit`; exercised four read tools through an MCP stdio client on localnet.
- Added an idempotent demo seed script, localnet runbook, existing-key CLI initialization, and dashboard screenshots. Updated README with install guidance, architecture, comparison, and current limits.

## Oct 10, 2026 — Web documentation

- Added a dedicated, responsive documentation page at `/docs`, with sidebar navigation, copyable setup commands, tool inventory, privacy table, release status, and troubleshooting.
- Linked the landing page and README to the new guide.

## Oct 10, 2026 — Helius Privacy guide integration

- Expanded web documentation with five Helius Privacy operation guides, private-state and localnet explanations, exact tool inputs, upstream references, and a full 25-tool reference table.
- Added clear visibility and availability notes for deposits, transfers, withdrawals, indexer reads, SPL interface setup, and the current devnet prover blocker.

## Oct 10, 2026 — Guided demo

- Added `/demo`, a no-install, seven-step interactive seller-payment walkthrough with owner policy rejection, seller verification, updated dashboard preview, and masked explorer view.
- Marked every transaction and balance as demo data while devnet proofs remain unverified; linked the route from landing hero and navigation.

- Added agent use-case grid to the public landing page.

- Clarified self-hosted versus hosted key custody across landing proof, privacy, FAQ, and a dedicated section.

- Added a Helius-aligned privacy FAQ and corrected the off-chain policy row.

- Added a contact section with direct GitHub issue and documentation links.

## Oct 10, 2026 — Unified Ringside brand

- Introduced the gap-shield logomark and light/dark SVG exports, new favicon and Apple icon, Geist Open Graph image, and 1920×1080 pitch title cards.
- Added `/brand`, downloadable assets and brand tokens; unified the tagline and added manifest, theme color, robots, and sitemap metadata.

## Oct 10, 2026 — Visitor-wallet demo groundwork

- Added Phantom connection, public devnet balance read, and zero-balance faucet link to `/demo`; retained explicit recorded-data labels for unverified payment steps.
# 2026-10-10 — Devnet demo prover check

- Added a specific Helius devnet prover capability probe and Retry control to `/demo`; the recorded transfer remains clearly labelled while the required proof key is missing.

# 2026-10-10 — Browser burner devnet actions

- Added browser-only devnet burner registration, 0.01 SOL deposit, private balance sync, and a withdrawal attempt to `/demo`. Confirmed registration, deposit, and balance with real devnet signatures; withdrawal still fails during proof building.
- Bundled the pinned Zolana browser WASM files during dashboard build and persisted the devnet burner seed in browser local storage for return visits.

# 2026-10-10 — Burner recovery and withdrawal retry

- Restored the devnet-only burner from browser local storage on reload, clarified the deposit warning, and surfaced nested withdrawal error codes. Full and partial live withdrawal attempts both reached the Helius prover and failed before submission.

# 2026-10-10 — Browser burner policy check

- Added a browser-local spend cap to the live burner panel. A 0.1 SOL test and a real deposit attempt reject before transaction building when over the cap.

# 2026-10-10 — Live explorer view

- Added explorer links and explicit public deposit visibility for real browser-burner devnet transactions; signatures survive reloads in browser storage.

