import { readFile } from 'node:fs/promises';
import { createPaymentRequest, verifyPayment, type PaymentEvidence, type PaymentRequest } from '@ringside/verify';
import { createZolanaClient, initializePoseidon, ShieldedKeypair, SigningKey, SOL_MINT, syncWallet, Wallet, type Bytes32 } from '@heliuslabs/zolana04';
import { AssetRegistry, LocalShieldedKeys } from '@heliuslabs/zolana04/transaction';
import { db, ensureSchema } from '@/lib/hosted/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;
const seller = '79ARuP2P78svsx3wRyYKuD6mizktZvqkhuqF3yJEUr9J';
const address = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
const requestInput = z.object({ action: z.literal('request'), payer: address });
const verifyInput = z.object({ action: z.literal('verify'), payer: address, signature: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{80,90}$/), nonce: z.string().regex(/^[0-9a-f]{32}$/) });
const headers = { 'Cache-Control': 'no-store' };

async function sellerIdentity() {
  const raw = process.env.RINGSIDE_DEMO_SELLER_KEYPAIR || (process.env.NODE_ENV !== 'production' && process.env.RINGSIDE_DEMO_SELLER_KEYPAIR_FILE ? await readFile(process.env.RINGSIDE_DEMO_SELLER_KEYPAIR_FILE, 'utf8') : undefined);
  if (!raw) throw new Error('Demo seller key is not configured');
  const bytes: unknown = JSON.parse(raw);
  if (!Array.isArray(bytes) || bytes.length !== 64 || bytes.some(value => !Number.isInteger(value) || value < 0 || value > 255)) throw new Error('Invalid demo seller key');
  const seed = Uint8Array.from(bytes.slice(0, 32)) as Bytes32;
  const identity = ShieldedKeypair.fromKeypair(SigningKey.fromEd25519Bytes(seed));
  seed.fill(0);
  if (identity.toSolanaSigner().address !== seller) throw new Error('Demo seller key does not match the registered address');
  return identity;
}

async function inboundEvidence(signature: string): Promise<{ evidence: PaymentEvidence; paidAt: number } | undefined> {
  await initializePoseidon();
  const identity = await sellerIdentity();
  const rpc = process.env.HELIUS_API_KEY ? `https://devnet.helius-rpc.com/?api-key=${encodeURIComponent(process.env.HELIUS_API_KEY)}` : 'https://api.devnet.solana.com';
  const client = await createZolanaClient({ solanaRpcUrl: rpc, indexerUrl: 'https://d2xah7tnhdhcom.cloudfront.net', proverUrl: 'https://d21ni15goiip6l.cloudfront.net' });
  const wallet = new Wallet({ identity: identity.shieldedAddress(), registry: new AssetRegistry() });
  await syncWallet({ wallet, keys: LocalShieldedKeys.fromKeypair(identity), client, config: { pageLimit: 50 } });
  const entry = wallet.privateTransactions().find(tx => tx.id.signature === signature && tx.direction === 'inbound');
  if (!entry) return undefined;
  const response = await fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [signature, { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 1 }] }), cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) return undefined;
  const chain = await response.json() as { result?: { blockTime?: number | null; transaction?: { message?: { accountKeys?: Array<string | { pubkey: string }> } } } };
  const first = chain.result?.transaction?.message?.accountKeys?.[0];
  const payer = typeof first === 'string' ? first : first?.pubkey;
  if (!payer || !chain.result?.blockTime) return undefined;
  return { evidence: { signature, payer, asset: entry.asset === SOL_MINT ? 'SOL' : entry.asset, amount_base_units: entry.amount, direction: entry.direction, status: entry.status, slot: entry.id.slot }, paidAt: chain.result.blockTime * 1000 };
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) return Response.json({ error: 'seller_storage_unavailable' }, { status: 503, headers });
    const body: unknown = await request.json();
    await ensureSchema();
    if (typeof body === 'object' && body !== null && 'action' in body && body.action === 'request') {
      const input = requestInput.parse(body);
      await initializePoseidon();
      await sellerIdentity();
      const payment = createPaymentRequest({ pay_to: seller, asset: 'SOL', amount: '0.001', resource: '/demo/report', ttl_seconds: 900, network: 'solana-devnet' });
      await db()`INSERT INTO hosted_payment_requests(owner,nonce,body,created_at) VALUES(${seller},${payment.nonce},${JSON.stringify({ request: payment, payer: input.payer })},${Date.now()})`;
      return Response.json({ request: payment }, { headers });
    }
    const input = verifyInput.parse(body);
    const rows = await db()`SELECT body,created_at FROM hosted_payment_requests WHERE owner=${seller} AND nonce=${input.nonce}`;
    if (!rows[0]) return Response.json({ valid: false, reason: 'UNKNOWN_NONCE' }, { headers });
    const stored = JSON.parse(String(rows[0].body)) as { request: PaymentRequest; payer: string };
    if (stored.payer !== input.payer) return Response.json({ valid: false, reason: 'WRONG_PAYER' }, { headers });
    const existing = await db()`SELECT signature FROM hosted_consumed_payments WHERE signature=${input.signature}`;
    if (existing[0]) return Response.json({ valid: false, reason: 'REPLAY' }, { headers });
    const inbound = await inboundEvidence(input.signature);
    if (inbound && inbound.paidAt < Number(rows[0].created_at) - 2_000) return Response.json({ valid: false, reason: 'PAYMENT_PREDATES_REQUEST' }, { headers });
    const verdict = verifyPayment({ request: stored.request, evidence: inbound?.evidence, expected_payer: input.payer, expected_amount_base_units: 1_000_000n, consumed: false });
    if (!verdict.valid) return Response.json(verdict, { headers });
    const inserted = await db()`INSERT INTO hosted_consumed_payments(signature,owner,nonce) VALUES(${input.signature},${seller},${input.nonce}) ON CONFLICT DO NOTHING RETURNING signature`;
    if (!inserted[0]) return Response.json({ valid: false, reason: 'REPLAY' }, { headers });
    return Response.json({ ...verdict, report: 'Verified private payment. Ringside demo market report unlocked.' }, { headers });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: 'invalid_request' }, { status: 400, headers });
    return Response.json({ error: 'seller_verification_unavailable' }, { status: 503, headers });
  }
}
