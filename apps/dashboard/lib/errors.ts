export function friendlyError(raw: string): string {
  if (raw.includes('WALLET_BUILD_REGISTRATION') || raw.includes('CLIENT_RPC')) return 'The devnet RPC could not prepare your registration. Refresh the burner balance, then retry. Your browser key is unchanged.';
  if (raw.includes('CLIENT_PROVER_HTTP') || raw.includes('WALLET_BUILD_WITHDRAWAL') || raw.includes('WALLET_BUILD_TRANSFER')) return 'The devnet proof service could not build this transaction. Check service health, then retry. No payment was submitted.';
  if (raw.includes('429') || raw.includes('Too Many Requests')) return 'Devnet is busy or this request has reached its limit. Wait briefly, then retry.';
  if (raw.includes('AGENT_NEEDS_FEE_SOL')) return raw.split('AGENT_NEEDS_FEE_SOL: ')[1] || 'Fund the agent’s public devnet wallet, refresh its balance, then retry.';
  if (raw.includes('-32002') || raw.includes('Transaction already in progress')) return 'Another transaction is still in progress. Finish any open wallet approval, wait for confirmation, then refresh and retry.';
  if (raw === 'AGENT_OFFLINE') return 'Could not reach your agent. Check that Ringside MCP is running, then retry.';
  if (raw === 'PAIRING_REJECTED') return 'That token did not work. Run ringside-mcp pair again and paste the new token.';
  if (raw.includes('KILL_SWITCH')) return 'Spending is stopped by the owner. Resume spending after reviewing the current limits.';
  if (raw.includes('transaction cap exceeded')) return 'Payment blocked: over the per-payment cap. Change the limit in Policy.';
  if (raw.includes('daily cap exceeded')) return 'Payment blocked: over the rolling 24-hour cap. Change the limit or wait for the window to roll.';
  if (raw.includes('session cap exceeded')) return 'Payment blocked: over the session cap. Change the limit in Policy.';
  if (raw.includes('asset is not allowed')) return 'Payment blocked: this asset is not on the allowlist. Review Policy.';
  if (raw.includes('recipient is not allowed')) return 'Payment blocked: this recipient is not on the allowlist. Review Policy.';
  if (raw.includes('read-only mode')) return 'Spending is blocked because read-only mode is on. Turn it off in Policy.';
  if (raw.includes('RECIPIENT_NOT_REGISTERED')) return 'The recipient has not set up a private wallet, so a private payment is not possible.';
  if (raw.includes('ENGINE_UNAVAILABLE')) return 'This advanced swap or escrow action is unavailable on devnet in this release. Retry the status check later; core payments use a separate path.';
  if (raw.includes('Invalid owner signature') || raw.includes('403')) return 'Signature rejected. Connect the owner wallet and try again within 60 seconds.';
  return raw;
}
