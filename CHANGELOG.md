# Changelog

## 2026-10-09

- Added the authoritative PRD to the repository.
- Validated funded buyer and seller keypairs outside Git; confirmed buyer registration and private SOL deposits on devnet, and seller registration.
- Corrected the M1 completion claim: the required private transfer and withdrawal have not passed. Upstream SDK `0.4.0-alpha` received prover HTTP 502; pinned SDK `0.3.1-alpha` received an indexer Merkle proof error. Recorded signatures and blockers in `STATUS.md`.
