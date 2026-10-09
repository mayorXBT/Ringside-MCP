# Changelog

## 2026-10-09

- Added the authoritative PRD to the repository.
- Validated funded buyer and seller keypairs outside Git; confirmed buyer registration and private SOL deposits on devnet, and seller registration.
- Corrected the M1 completion claim: the required private transfer and withdrawal have not passed. Upstream SDK `0.4.0-alpha` received prover HTTP 502; pinned SDK `0.3.1-alpha` received an indexer Merkle proof error. Recorded signatures and blockers in `STATUS.md`.
- Added localnet service selection and explicit live-transfer and seller-payment checks. Built and started upstream Zolana localnet; verified buyer deposit, private transfer, seller sync, and withdrawal.
- Added M2 tool aliases and a stdio MCP annotation test; changed daily spend limits to a rolling 24-hour window.
- Verified the seller API's 402, private payment, successful retry, and replay rejection on localnet.
- Added owner-signed dashboard deposit/withdraw actions, control API authorization checks, and a read-only `/audit` fallback backed by the local control API.
