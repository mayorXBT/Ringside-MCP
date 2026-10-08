# Security and demo limits

This build supports Solana devnet only. Default Rings transfers conceal asset and amount, while sender and recipient remain public. Deposits and withdrawals expose asset and amount. Keep agent funds separate from the owner's wallet and use only test funds.

`ringside-mcp init` creates a 0600 keypair, policy file, and pairing token in `RINGSIDE_HOME`. The MCP process reads the key locally; tool responses and control API responses do not return seed or keypair bytes. The control API binds to `127.0.0.1`, requires the pairing token for reads, and verifies owner ed25519 signatures with a nonce and expiry before changing policy. Agent tools cannot change policy. `ringside-mcp kill` is a local emergency stop.

The policy checks caps and allowlists before core spends. `private_transfer` rejects unregistered recipients to avoid public withdrawal fallback. Spend calls are serialized within one MCP process. Run one MCP process per wallet until cross-process locking is implemented.

The seller verifier checks an inbound decrypted receipt, its public fee payer, the request amount and asset, expiry, and a local replay store. The nonce is kept in the request database; the current confidential transfer has no on-chain memo binding it to that nonce, so the verifier also rejects transactions older than the request. Swap and escrow programs are not deployed; the upstream example proving keys are insecure test keys and must never be used on mainnet.
