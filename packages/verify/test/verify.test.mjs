import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentRequest, verifyPayment } from '../dist/index.js';

test('seller rejects mismatched and replayed private receipts', () => {
  const now = Date.parse('2026-10-08T20:00:00Z');
  const request = createPaymentRequest({ pay_to: 'seller', asset: 'SOL', amount: '0.01', resource: '/report' }, now);
  const evidence = { signature: 'sig', asset: 'SOL', amount_base_units: 10_000_000n, payer: 'buyer', direction: 'inbound', status: 'confirmed', slot: 123n };
  const check = (changes = {}) => verifyPayment({ request, evidence, expected_payer: 'buyer', expected_amount_base_units: 10_000_000n, consumed: false, now, ...changes });
  assert.equal(check().valid, true);
  assert.equal(check({ evidence: { ...evidence, amount_base_units: 9_999_999n } }).reason, 'UNDERPAID');
  assert.equal(check({ evidence: { ...evidence, asset: 'mint' } }).reason, 'WRONG_ASSET');
  assert.equal(check({ expected_payer: 'someone-else' }).reason, 'WRONG_PAYER');
  assert.equal(check({ consumed: true }).reason, 'REPLAY');
  assert.equal(check({ now: now + 301_000 }).reason, 'EXPIRED');
});
