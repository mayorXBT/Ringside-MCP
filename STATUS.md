# Build status

## Milestone 0: scaffold and upstream examples

- Workspace scaffold created for Node 24 and pnpm.
- Current upstream Zolana TypeScript examples staged as `vendor/zolana-examples` submodule at `3d39626853fea338efc802896024cabda39ed4ab`.
- Upstream examples pass `pnpm check`.
- Helius devnet RPC `getVersion` works with `HELIUS_API_KEY`.

## Milestone 1: core wallet (in progress)

PRD exit: MCP lists tools; registration, deposit, and balance work on devnet. The five upstream examples require a funded sponsor wallet. No wallet was present in this environment at the start of the build. Record transaction signatures and endpoint findings here when the funded run succeeds.

The PRD references Zolana examples commit `3069d79` and SDK `0.3.1-alpha`. Upstream currently exposes commit `3d39626853fea338efc802896024cabda39ed4ab` and examples pinned to `0.4.0-alpha`. Keep this compatibility difference visible during the port.
