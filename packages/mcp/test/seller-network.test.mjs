import assert from 'node:assert/strict';
import test from 'node:test';
import { payPaymentRequest } from '../dist/seller.js';

test('buyer rejects a payment request from another network', async () => {
  const prior = process.env.RINGSIDE_NETWORK;
  try {
    process.env.RINGSIDE_NETWORK = 'localnet';
    await assert.rejects(payPaymentRequest({ scheme: 'ringside-private-v1', network: 'solana-devnet', pay_to: 'seller', asset: 'SOL', amount: '0.01', nonce: 'nonce', expires_at: new Date(Date.now() + 60_000).toISOString(), resource: '/report' }), /cross-network/);
  } finally {
    if (prior === undefined) delete process.env.RINGSIDE_NETWORK;
    else process.env.RINGSIDE_NETWORK = prior;
  }
});
