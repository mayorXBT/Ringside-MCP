import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { address, assertIsTransactionWithBlockhashLifetime, getSignatureFromTransaction, sendTransactionWithoutConfirmingFactory, signTransactionWithSigners } from '@solana/kit';
import { buildDepositTransaction, buildRegistrationTransaction, buildTransferTransaction, buildWithdrawalTransaction, createZolanaClient, fetchAssetMetadata, initializePoseidon, LocalKeys, parseAmount, ShieldedKeypair, SigningKey, syncWallet, Wallet, SOL_MINT, type Bytes32, type ZolanaClientConfig } from '@heliuslabs/zolana';
import { AssetRegistry, LocalShieldedKeys } from '@heliuslabs/zolana/transaction';
import { isWalletRegistered } from '@heliuslabs/zolana/wallet';
import { resolveRegisteredAddress } from '@heliuslabs/zolana/wallet';
import { assertSpend, recordSpend } from './policy.js';

const expand = (value: string) => value === '~' ? homedir() : value.startsWith('~/') ? join(homedir(), value.slice(2)) : value;

export function clientConfig(): ZolanaClientConfig {
  const key = process.env.HELIUS_API_KEY || process.env.API_KEY;
  const endpoint = process.env.ZOLANA_ENDPOINT || (key ? `https://devnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}` : undefined);
  if (!endpoint) throw new Error('HELIUS_API_KEY or ZOLANA_ENDPOINT is required');
  if (/mainnet/i.test(endpoint)) throw new Error('Mainnet is disabled');
  return {
    solanaRpcUrl: endpoint,
    indexerUrl: process.env.ZOLANA_INDEXER_URL || 'https://d2xah7tnhdhcom.cloudfront.net',
    proverUrl: process.env.ZOLANA_PROVER_URL || 'https://d21ni15goiip6l.cloudfront.net',
  };
}

export async function context() {
  await initializePoseidon();
  const path = expand(process.env.RINGSIDE_KEYPAIR || process.env.ZOLANA_PAYER_KEYPAIR || join(process.env.RINGSIDE_HOME || join(homedir(), '.ringside'), 'agent.json'));
  const data: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (!Array.isArray(data) || data.length !== 64 || data.some((v) => !Number.isInteger(v) || v < 0 || v > 255)) throw new Error(`Invalid Solana keypair at ${path}`);
  const seed = Uint8Array.from(data.slice(0, 32));
  const signing = SigningKey.fromEd25519Bytes(seed as Bytes32);
  seed.fill(0);
  const identity = ShieldedKeypair.fromKeypair(signing);
  return { client: await createZolanaClient(clientConfig()), identity, signer: identity.toSolanaSigner() };
}

export async function walletInfo() {
  const { client, identity, signer } = await context();
  const registered = await isWalletRegistered({ rpc: client, owner: signer.address });
  const publicLamports = await client.getBalance(signer.address);
  return { solana_address: signer.address, shielded_address: Buffer.from(identity.shieldedAddress().toBytes()).toString('hex'), registered, public_sol_balance: (Number(publicLamports) / 1e9).toString(), network: 'devnet' };
}

export async function sendTransaction(transaction: Parameters<typeof signTransactionWithSigners>[1]) {
  const { client, signer } = await context();
  const signed = await signTransactionWithSigners([signer], transaction);
  assertIsTransactionWithBlockhashLifetime(signed);
  await sendTransactionWithoutConfirmingFactory({ rpc: client.solanaRpc })(signed, { commitment: 'confirmed' });
  const signature = getSignatureFromTransaction(signed);
  const slot = await client.confirmTransaction(signature);
  return { signature, slot: slot.toString(), explorer_url: `https://explorer.solana.com/tx/${signature}?cluster=devnet` };
}

export async function registerWallet() {
  const { client, identity, signer } = await context();
  const transaction = await buildRegistrationTransaction({ client, owner: signer.address, address: identity.shieldedAddress() });
  if (!transaction) return { registered: true, already_registered: true };
  return { registered: true, ...await sendTransaction(transaction) };
}

export async function depositSol(amount: string) {
  return serializeSpend(() => depositSolLocked(amount));
}

async function depositSolLocked(amount: string) {
  if (!/^(0|[1-9]\d*)(\.\d{1,9})?$/.test(amount) || Number(amount) <= 0) throw new Error('amount must be positive SOL with at most 9 decimal places');
  const [whole, fraction = ''] = amount.split('.');
  const lamports = BigInt(whole) * 1_000_000_000n + BigInt(fraction.padEnd(9, '0'));
  assertSpend('deposit', 'SOL', lamports, 9);
  const { client, identity, signer } = await context();
  const transaction = await buildDepositTransaction({ client, feePayer: signer.address, depositor: signer.address, recipient: identity.shieldedAddress(), asset: SOL_MINT, amount: lamports });
  const sent = await sendTransaction(transaction);
  recordSpend('deposit', 'SOL', lamports, undefined, sent.signature);
  return { amount, amount_base_units: lamports.toString(), ...sent };
}

export async function syncPrivate() {
  const { client, identity } = await context();
  const wallet = new Wallet({ identity: identity.shieldedAddress(), registry: new AssetRegistry() });
  await syncWallet({ wallet, keys: LocalShieldedKeys.fromKeypair(identity), client, config: { pageLimit: 50 } });
  return wallet;
}

export async function balances() {
  const wallet = await syncPrivate();
  return { balances: wallet.balances().map((b) => ({ asset: b.mint === SOL_MINT ? 'SOL' : b.mint, amount_base_units: b.amount.toString(), amount: b.mint === SOL_MINT ? (Number(b.amount) / 1e9).toString() : b.amount.toString(), utxos: b.utxos.length })) };
}

export async function history(limit: number) {
  const wallet = await syncPrivate();
  return { transactions: wallet.privateTransactions().slice(-limit).map((t) => ({ signature: t.id.signature, slot: t.id.slot.toString(), kind: t.kind, direction: t.direction, status: t.status, asset: t.asset === SOL_MINT ? 'SOL' : t.asset, amount_base_units: t.amount.toString() })) };
}

let spendQueue: Promise<void> = Promise.resolve();
async function serializeSpend<T>(run: () => Promise<T>): Promise<T> {
  const previous = spendQueue;
  let release!: () => void;
  spendQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await run(); } finally { release(); }
}

async function assetAmount(client: Awaited<ReturnType<typeof createZolanaClient>>, asset: string, amount: string) {
  const mint = asset === 'SOL' ? SOL_MINT : address(asset);
  const decimals = asset === 'SOL' ? 9 : (await fetchAssetMetadata(client, mint)).decimals;
  const base = parseAmount(amount, decimals);
  if (base <= 0n) throw new Error('amount must be positive');
  return { mint, decimals, base };
}

export async function privateTransfer(recipient: string, asset: string, amount: string) {
  return serializeSpend(async () => {
    const { client, identity, signer } = await context();
    const { mint, decimals, base } = await assetAmount(client, asset, amount);
    const resolved = await resolveRegisteredAddress({ rpc: client, owner: address(recipient) });
    if (!resolved) throw new Error('RECIPIENT_NOT_REGISTERED: recipient must register a private wallet first');
    assertSpend('private_transfer', asset, base, decimals, recipient);
    const wallet = new Wallet({ identity: identity.shieldedAddress(), registry: new AssetRegistry() });
    const keys = LocalKeys.fromKeypair(identity, client.proofService);
    try {
      await syncWallet({ wallet, keys, client, config: { pageLimit: 50 } });
      const transaction = await buildTransferTransaction({ client, wallet, keys, feePayer: signer.address, recipient: resolved.address, asset: mint, amount: base });
      const sent = await sendTransaction(transaction);
      recordSpend('private_transfer', asset, base, recipient, sent.signature);
      return { amount, amount_base_units: base.toString(), recipient, ...sent };
    } finally { keys.destroy(); }
  });
}

export async function withdraw(asset: string, amount: string, recipient?: string) {
  return serializeSpend(async () => {
    const { client, identity, signer } = await context();
    const { mint, decimals, base } = await assetAmount(client, asset, amount);
    const destination = recipient ? address(recipient) : signer.address;
    assertSpend('withdraw', asset, base, decimals, destination);
    const wallet = new Wallet({ identity: identity.shieldedAddress(), registry: new AssetRegistry() });
    const keys = LocalKeys.fromKeypair(identity, client.proofService);
    try {
      await syncWallet({ wallet, keys, client, config: { pageLimit: 50 } });
      const transaction = await buildWithdrawalTransaction({ client, wallet, keys, feePayer: signer.address, recipient: destination, asset: mint, amount: base });
      const sent = await sendTransaction(transaction);
      recordSpend('withdraw', asset, base, destination, sent.signature);
      return { amount, amount_base_units: base.toString(), recipient: destination, ...sent };
    } finally { keys.destroy(); }
  });
}
