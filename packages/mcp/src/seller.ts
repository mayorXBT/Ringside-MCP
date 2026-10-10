import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createPaymentRequest as makeRequest, verifyPayment as checkPayment, type PaymentRequest, type PaymentEvidence } from '@ringside/verify';
import { clientConfig, privateTransfer, syncPrivate, walletInfo } from './core.js';
import { ringsideHome } from './policy.js';
import { hostedContext } from './hosted.js';

function store() {
  mkdirSync(ringsideHome(), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(ringsideHome(), 'ledger.sqlite'));
  db.exec('CREATE TABLE IF NOT EXISTS payment_requests (nonce TEXT PRIMARY KEY, body TEXT NOT NULL, created_at INTEGER NOT NULL)');
  db.exec('CREATE TABLE IF NOT EXISTS consumed_payments (signature TEXT PRIMARY KEY, nonce TEXT NOT NULL, ts INTEGER NOT NULL)');
  return db;
}

export async function createPaymentRequest(asset: string, amount: string, resource: string, ttlSeconds = 300) {
  const info = await walletInfo();
  if (!info.registered) throw new Error('Seller wallet must register before requesting private payments');
  const request = makeRequest({ pay_to: info.solana_address, asset, amount, resource, ttl_seconds: ttlSeconds, network: info.network === 'localnet' ? 'solana-localnet' : 'solana-devnet' });
  const hosted=hostedContext();if(hosted)await hosted.savePaymentRequest(request.nonce,JSON.stringify(request),Date.now());
  else {const db=store();try { db.prepare('INSERT INTO payment_requests (nonce, body, created_at) VALUES (?, ?, ?)').run(request.nonce, JSON.stringify(request), Date.now()); }finally { db.close(); }}
  return { request };
}

export async function payPaymentRequest(request: PaymentRequest) {
  const expectedNetwork = process.env.RINGSIDE_NETWORK === 'localnet' ? 'solana-localnet' : 'solana-devnet';
  if (request.scheme !== 'ringside-private-v1' || request.network !== expectedNetwork || Date.parse(request.expires_at) <= Date.now()) throw new Error('Invalid, cross-network, or expired payment request');
  const sent = await privateTransfer(request.pay_to, request.asset, request.amount);
  const payer = (await walletInfo()).solana_address;
  const x_payment_header = Buffer.from(JSON.stringify({ signature: sent.signature, nonce: request.nonce, payer })).toString('base64');
  return { ...sent, x_payment_header };
}

async function transactionDetails(signature: string) {
  const endpoint = clientConfig().solanaRpcUrl;
  const response = await fetch(endpoint!, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [signature, { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 1 }] }) });
  if (!response.ok) throw new Error(`RPC_ERROR: transaction lookup HTTP ${response.status}`);
  const body = await response.json() as { result?: { blockTime?: number | null; transaction?: { message?: { accountKeys?: (string | { pubkey: string })[] } } }; error?: unknown };
  if (body.error) throw new Error('RPC_ERROR: transaction lookup failed');
  const keys = body.result?.transaction?.message?.accountKeys;
  const payer = keys?.[0];
  return { payer: typeof payer === 'string' ? payer : payer?.pubkey, paidAt: body.result?.blockTime ? body.result.blockTime * 1000 : undefined };
}

export async function verifyPayment(signature: string, nonce: string, expectedPayer?: string, consume = true, expectedAsset?: string, minAmount?: string) {
  const hosted=hostedContext(),db=hosted?undefined:store();
  try {
    const row = hosted?await hosted.getPaymentRequest(nonce):db!.prepare('SELECT body, created_at FROM payment_requests WHERE nonce = ?').get(nonce) as { body: string; created_at: number } | undefined;
    if (!row) return { valid: false, reason: 'UNKNOWN_NONCE' };
    const request = JSON.parse(row.body) as PaymentRequest;
    if (expectedAsset && expectedAsset !== request.asset) return { valid: false, reason: 'WRONG_ASSET' };
    const consumed = hosted?await hosted.isPaymentConsumed(signature):!!db!.prepare('SELECT signature FROM consumed_payments WHERE signature = ?').get(signature);
    if (consumed) return { valid: false, reason: 'REPLAY' };
    const wallet = await syncPrivate();
    const entry = wallet.privateTransactions().find((tx) => tx.id.signature === signature && tx.direction === 'inbound');
    const chain = await transactionDetails(signature);
    if (!chain.paidAt || chain.paidAt < row.created_at - 2_000) return { valid: false, reason: 'PAYMENT_PREDATES_REQUEST' };
    const metadata = request.asset === 'SOL' ? { decimals: 9 } : await import('@heliuslabs/zolana').then(async ({ createZolanaClient, fetchAssetMetadata }) => {
      const { address } = await import('@solana/kit');
      return fetchAssetMetadata(await createZolanaClient(clientConfig()), address(request.asset));
    });
    const { parseAmount } = await import('@heliuslabs/zolana');
    const requestRequired = parseAmount(request.amount, metadata.decimals);
    let minimum = requestRequired;
    if (minAmount) {
      try { const override = parseAmount(minAmount, metadata.decimals); if (override > minimum) minimum = override; }
      catch { return { valid: false, reason: 'INVALID_MIN_AMOUNT' }; }
    }
    const evidence: PaymentEvidence | undefined = entry && chain.payer ? { signature, asset: entry.asset === (await import('@heliuslabs/zolana')).SOL_MINT ? 'SOL' : entry.asset, amount_base_units: entry.amount, payer: chain.payer, direction: entry.direction, status: entry.status, slot: entry.id.slot } : undefined;
    const verdict = checkPayment({ request, evidence, expected_payer: expectedPayer, expected_amount_base_units: minimum, consumed });
    if (verdict.valid && consume) {
      const inserted=hosted?await hosted.consumePayment(signature,nonce):!!db!.prepare('INSERT OR IGNORE INTO consumed_payments (signature, nonce, ts) VALUES (?, ?, ?)').run(signature, nonce, Date.now()).changes;
      if (!inserted) return { valid: false, reason: 'REPLAY' };
    }
    return verdict;
  } finally { db?.close(); }
}
