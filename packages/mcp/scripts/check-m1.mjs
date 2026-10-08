import { resolve } from 'node:path';
process.env.RINGSIDE_HOME ||= resolve(import.meta.dirname, '../../../.local/m1-home');
const { balances, depositSol, history, registerWallet, walletInfo } = await import('../dist/core.js');

const info = await walletInfo();
console.log('wallet', info.solana_address, 'registered', info.registered, 'public SOL', info.public_sol_balance);
console.log('balances before', JSON.stringify(await balances()));
console.log('history rows', (await history(10)).transactions.length);
if (Number(info.public_sol_balance) < 0.03) {
  throw new Error('M1 funded check requires at least 0.03 devnet SOL in the agent wallet');
}
if (!info.registered) console.log('registration', JSON.stringify(await registerWallet()));
const deposit = await depositSol('0.01');
console.log('deposit', JSON.stringify(deposit));
const after = await balances();
console.log('balances after', JSON.stringify(after));
const sol = after.balances.find((entry) => entry.asset === 'SOL');
if (!sol || BigInt(sol.amount_base_units) < 10_000_000n) throw new Error('M1 deposit missing from synced private balance');
console.log('M1 devnet check passed');
