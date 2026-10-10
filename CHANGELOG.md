# Changelog

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
