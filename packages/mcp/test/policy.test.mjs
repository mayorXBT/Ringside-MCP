import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertSpend, recordSpend } from '../dist/policy.js';

test('policy enforces transaction, session, recipient and kill limits', async () => {
  const home = mkdtempSync(join(tmpdir(), 'ringside-policy-'));
  process.env.RINGSIDE_HOME = home;
  const policy = {
    assets: { SOL: { max_per_tx: '0.05', max_per_session: '0.06', max_per_day: '0.1' } },
    asset_allowlist: ['SOL'], recipient_allowlist: ['allowed'], allowlist_mode: 'enforce',
    kill_switch: false, read_only: false,
  };
  writeFileSync(join(home, 'config.json'), JSON.stringify({ policy }));
  await assert.rejects(() => assertSpend('private_transfer', 'SOL', 60_000_000n, 9, 'allowed'), /transaction cap/);
  await assert.rejects(() => assertSpend('private_transfer', 'SOL', 10_000_000n, 9, 'denied'), /recipient/);
  await assertSpend('private_transfer', 'SOL', 40_000_000n, 9, 'allowed');
  await recordSpend('private_transfer', 'SOL', 40_000_000n, 'allowed', 'sig-1');
  await assert.rejects(() => assertSpend('private_transfer', 'SOL', 30_000_000n, 9, 'allowed'), /session cap/);
  policy.kill_switch = true;
  writeFileSync(join(home, 'config.json'), JSON.stringify({ policy }));
  await assert.rejects(() => assertSpend('private_transfer', 'SOL', 1n, 9, 'allowed'), /KILL_SWITCH/);
});
