import { randomBytes } from 'node:crypto';

export interface PaymentRequest {
  scheme: 'ringside-private-v1';
  network: 'solana-devnet' | 'solana-localnet';
  pay_to: string;
  asset: string;
  amount: string;
  nonce: string;
  expires_at: string;
  resource: string;
}

export interface PaymentEvidence {
  signature: string;
  asset: string;
  amount_base_units: bigint;
  payer: string;
  direction: 'inbound' | 'outbound' | 'selfTransfer';
  status: string;
  slot: bigint;
}

export function createPaymentRequest(input: { pay_to: string; asset: string; amount: string; resource: string; ttl_seconds?: number; network?: PaymentRequest['network'] }, now = Date.now()): PaymentRequest {
  const ttl = input.ttl_seconds ?? 300;
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > 3600) throw new Error('ttl_seconds must be 1 to 3600');
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(input.amount) || Number(input.amount) <= 0) throw new Error('Invalid payment amount');
  return { scheme: 'ringside-private-v1', network: input.network || 'solana-devnet', pay_to: input.pay_to, asset: input.asset, amount: input.amount, nonce: randomBytes(16).toString('hex'), expires_at: new Date(now + ttl * 1000).toISOString(), resource: input.resource };
}

export function verifyPayment(input: { request: PaymentRequest; evidence?: PaymentEvidence; expected_payer?: string; expected_amount_base_units: bigint; consumed: boolean; now?: number }) {
  const { request, evidence, expected_payer, expected_amount_base_units, consumed } = input;
  const now = input.now ?? Date.now();
  if (request.scheme !== 'ringside-private-v1' || !['solana-devnet', 'solana-localnet'].includes(request.network)) return { valid: false, reason: 'INVALID_REQUEST' };
  if (Date.parse(request.expires_at) <= now) return { valid: false, reason: 'EXPIRED' };
  if (consumed) return { valid: false, reason: 'REPLAY' };
  if (!evidence || evidence.status !== 'confirmed' || evidence.direction !== 'inbound') return { valid: false, reason: 'PAYMENT_NOT_FOUND' };
  if (evidence.asset !== request.asset) return { valid: false, reason: 'WRONG_ASSET' };
  if (evidence.amount_base_units < expected_amount_base_units) return { valid: false, reason: 'UNDERPAID' };
  if (expected_payer && evidence.payer !== expected_payer) return { valid: false, reason: 'WRONG_PAYER' };
  return { valid: true, payer: evidence.payer, asset: evidence.asset, amount_base_units: evidence.amount_base_units.toString(), signature: evidence.signature, slot: evidence.slot.toString() };
}
