import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

if (process.env.RINGSIDE_SEED_DEMO !== '1') throw new Error('Set RINGSIDE_SEED_DEMO=1 to fund and deposit demo wallets');
const buyerKey = process.env.RINGSIDE_BUYER_KEYPAIR;
const sellerKey = process.env.RINGSIDE_SELLER_KEYPAIR;
if (!buyerKey || !sellerKey) throw new Error('RINGSIDE_BUYER_KEYPAIR and RINGSIDE_SELLER_KEYPAIR are required');
const baseHome = process.env.RINGSIDE_TEST_HOME || resolve(import.meta.dirname, '../.local/demo');
const core = await import('../packages/mcp/dist/core.js');
const { runCli } = await import('../packages/mcp/dist/cli.js');
async function asWallet(key, role, run) {
  process.env.RINGSIDE_KEYPAIR = key;
  process.env.RINGSIDE_HOME = resolve(baseHome, role);
  return run();
}
async function localAirdrop(address) {
  if (process.env.RINGSIDE_NETWORK !== 'localnet') return;
  const endpoint = core.clientConfig().solanaRpcUrl;
  const rpc = async (method, params) => {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    const body = await response.json();
    if (body.error) throw new Error(`Localnet ${method}: ${body.error.message}`);
    return body.result;
  };
  if ((await rpc('getBalance', [address])).value >= 100_000_000) return;
  await rpc('requestAirdrop', [address, 1_000_000_000]);
  for (let i = 0; i < 20; i++) {
    if ((await rpc('getBalance', [address])).value >= 100_000_000) return;
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`Localnet airdrop failed for ${address}`);
}
for (const [role, key] of [['buyer', buyerKey], ['seller', sellerKey]]) {
  const info = await asWallet(key, role, () => core.walletInfo());
  await localAirdrop(info.solana_address);
  if (!info.registered) console.log(role, 'registration', JSON.stringify(await asWallet(key, role, () => core.registerWallet())));
  console.log(role, 'address', info.solana_address);
}
if (process.env.RINGSIDE_OWNER_ADDRESS && !existsSync(join(baseHome, 'buyer', 'config.json'))) {
  await asWallet(buyerKey, 'buyer', () => runCli(['init', '--owner', process.env.RINGSIDE_OWNER_ADDRESS, '--keypair', buyerKey]));
}
const balance = await asWallet(buyerKey, 'buyer', () => core.balances());
const privateSol = BigInt(balance.balances.find((entry) => entry.asset === 'SOL')?.amount_base_units || '0');
if (privateSol < 30_000_000n) console.log('buyer deposit', JSON.stringify(await asWallet(buyerKey, 'buyer', () => core.depositSol('0.05'))));
console.log('buyer balances', JSON.stringify(await asWallet(buyerKey, 'buyer', () => core.balances())));
console.log('seller balances', JSON.stringify(await asWallet(sellerKey, 'seller', () => core.balances())));
