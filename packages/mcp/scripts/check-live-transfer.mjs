import { resolve } from 'node:path';

if (process.env.RINGSIDE_RUN_LIVE_TRANSFER !== '1') {
  throw new Error('Set RINGSIDE_RUN_LIVE_TRANSFER=1 to submit a private transfer and withdrawal');
}
const buyerKey = process.env.RINGSIDE_BUYER_KEYPAIR;
const sellerKey = process.env.RINGSIDE_SELLER_KEYPAIR;
if (!buyerKey || !sellerKey) throw new Error('RINGSIDE_BUYER_KEYPAIR and RINGSIDE_SELLER_KEYPAIR are required');
const baseHome = process.env.RINGSIDE_TEST_HOME || resolve(import.meta.dirname, '../../../.local/live-transfer');
const amount = process.env.RINGSIDE_TEST_AMOUNT || '0.003';
const withdrawAmount = process.env.RINGSIDE_TEST_WITHDRAW_AMOUNT || '0.001';
const core = await import('../dist/core.js');

async function fundLocalnet(address) {
  if (process.env.RINGSIDE_NETWORK !== 'localnet') return;
  const endpoint = core.clientConfig().solanaRpcUrl;
  async function rpc(method, params) {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    const body = await response.json();
    if (body.error) throw new Error(`Localnet ${method} failed: ${body.error.message}`);
    return body.result;
  }
  if ((await rpc('getBalance', [address])).value >= 100_000_000) return;
  await rpc('requestAirdrop', [address, 1_000_000_000]);
  for (let attempt = 0; attempt < 20; attempt++) {
    if ((await rpc('getBalance', [address])).value >= 100_000_000) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Localnet funding did not confirm for ${address}`);
}

async function asWallet(keypair, home, run) {
  process.env.RINGSIDE_KEYPAIR = keypair;
  process.env.RINGSIDE_HOME = resolve(baseHome, home);
  return run();
}

const seller = await asWallet(sellerKey, 'seller', () => core.walletInfo());
const buyer = await asWallet(buyerKey, 'buyer', () => core.walletInfo());
await fundLocalnet(seller.solana_address);
await fundLocalnet(buyer.solana_address);
if (!seller.registered) console.log('seller registration', JSON.stringify(await asWallet(sellerKey, 'seller', () => core.registerWallet())));
if (!buyer.registered) console.log('buyer registration', JSON.stringify(await asWallet(buyerKey, 'buyer', () => core.registerWallet())));
const buyerBalance = await asWallet(buyerKey, 'buyer', () => core.balances());
if (BigInt(buyerBalance.balances.find((entry) => entry.asset === 'SOL')?.amount_base_units || '0') < 5_000_000n) {
  console.log('buyer deposit', JSON.stringify(await asWallet(buyerKey, 'buyer', () => core.depositSol('0.01'))));
}
const before = await asWallet(sellerKey, 'seller', () => core.balances());
const transfer = await asWallet(buyerKey, 'buyer', () => core.privateTransfer(seller.solana_address, 'SOL', amount));
console.log('transfer', JSON.stringify(transfer));
const after = await asWallet(sellerKey, 'seller', () => core.balances());
const prior = BigInt(before.balances.find((entry) => entry.asset === 'SOL')?.amount_base_units || '0');
const current = BigInt(after.balances.find((entry) => entry.asset === 'SOL')?.amount_base_units || '0');
if (current <= prior) throw new Error('Seller private balance did not increase');
console.log('seller balances', JSON.stringify(after));
const withdrawn = await asWallet(sellerKey, 'seller', () => core.withdraw('SOL', withdrawAmount));
console.log('withdrawal', JSON.stringify(withdrawn));
console.log('Live private transfer and withdrawal passed');
