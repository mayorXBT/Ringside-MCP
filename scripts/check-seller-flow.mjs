import { resolve } from 'node:path';

if (process.env.RINGSIDE_RUN_SELLER_PAYMENT !== '1') {
  throw new Error('Set RINGSIDE_RUN_SELLER_PAYMENT=1 to submit a private payment');
}
const buyerKeypair = process.env.RINGSIDE_BUYER_KEYPAIR;
if (!buyerKeypair) throw new Error('RINGSIDE_BUYER_KEYPAIR is required');
process.env.RINGSIDE_KEYPAIR = buyerKeypair;
process.env.RINGSIDE_HOME ||= resolve(import.meta.dirname, '../.local/demo-buyer');
const url = process.env.RINGSIDE_SELLER_URL || 'http://127.0.0.1:8787/report';
const { payPaymentRequest } = await import('../packages/mcp/dist/seller.js');

const first = await fetch(url);
const request = await first.json();
if (first.status !== 402 || request.scheme !== 'ringside-private-v1') throw new Error('Seller did not return a private payment request');
console.log('request', JSON.stringify({ status: first.status, network: request.network, asset: request.asset, amount: request.amount }));

const paid = await payPaymentRequest(request);
console.log('payment signature', paid.signature);
const retry = await fetch(url, { headers: { 'X-PAYMENT': paid.x_payment_header } });
const resource = await retry.json();
if (retry.status !== 200 || !resource.payment?.valid) throw new Error(`Seller rejected paid request: HTTP ${retry.status}`);
console.log('paid retry', JSON.stringify({ status: retry.status, signature: resource.payment.signature }));

const replay = await fetch(url, { headers: { 'X-PAYMENT': paid.x_payment_header } });
const replayBody = await replay.json();
if (replay.status !== 402 || replayBody.reason !== 'REPLAY') throw new Error('Seller did not reject replay');
console.log('replay', JSON.stringify({ status: replay.status, reason: replayBody.reason }));
console.log('Seller payment flow passed');
