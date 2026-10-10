import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const exampleRoot = resolve(import.meta.dirname, '../vendor/zolana-examples/typescript-client');
const requireExample = createRequire(resolve(exampleRoot, 'package.json'));
const zolana = await import(pathToFileURL(resolve(exampleRoot, 'node_modules/@heliuslabs/zolana/dist/index.js')));
const transaction = await import(pathToFileURL(resolve(exampleRoot, 'node_modules/@heliuslabs/zolana/dist/transaction/index.js')));
const kit = requireExample('@solana/kit');
const { ShieldedKeypair, SigningKey, createZolanaClient, initializePoseidon, syncWallet, Wallet, SOL_MINT, buildTransferTransaction, buildWithdrawalTransaction, LocalKeys } = zolana;
const { AssetRegistry, LocalShieldedKeys } = transaction;
const { signTransactionWithSigners, getSignatureFromTransaction, sendTransactionWithoutConfirmingFactory, assertIsTransactionWithBlockhashLifetime } = kit;

if (!process.env.HELIUS_API_KEY && !process.env.ZOLANA_ENDPOINT) throw new Error('HELIUS_API_KEY or ZOLANA_ENDPOINT is required');
const config = { solanaRpcUrl: process.env.ZOLANA_ENDPOINT || `https://devnet.helius-rpc.com/?api-key=${encodeURIComponent(process.env.HELIUS_API_KEY)}`, indexerUrl: process.env.ZOLANA_INDEXER_URL || 'https://d2xah7tnhdhcom.cloudfront.net', proverUrl: process.env.ZOLANA_PROVER_URL || 'https://d21ni15goiip6l.cloudfront.net' };
if (/mainnet/i.test(config.solanaRpcUrl)) throw new Error('Mainnet is disabled');
await initializePoseidon();
const client = await createZolanaClient(config);
async function identity(file) {
  const value = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(value) || value.length !== 64) throw new Error('Invalid local keypair');
  const seed = Uint8Array.from(value.slice(0, 32));
  const result = ShieldedKeypair.fromKeypair(SigningKey.fromEd25519Bytes(seed));
  seed.fill(0);
  return result;
}
async function walletFor(owner) {
  const wallet = new Wallet({ identity: owner.shieldedAddress(), registry: new AssetRegistry() });
  await syncWallet({ wallet, keys: LocalShieldedKeys.fromKeypair(owner), client, config: { pageLimit: 50 } });
  const lamports = wallet.balances().filter(entry => entry.mint === SOL_MINT).reduce((sum, entry) => sum + entry.amount, 0n);
  return { wallet, lamports };
}
async function send(owner, compiled) {
  const signed = await signTransactionWithSigners([owner.toSolanaSigner()], compiled);
  assertIsTransactionWithBlockhashLifetime(signed);
  await sendTransactionWithoutConfirmingFactory({ rpc: client.solanaRpc })(signed, { commitment: 'confirmed' });
  const signature = getSignatureFromTransaction(signed);
  const slot = await client.confirmTransaction(signature);
  return { signature, slot: String(slot), explorer_url: `https://explorer.solana.com/tx/${signature}?cluster=devnet` };
}
const buyer = await identity(process.env.RINGSIDE_BUYER_KEYPAIR || '/workspace/ringside-keys/buyer.json');
const seller = await identity(process.env.RINGSIDE_SELLER_KEYPAIR || '/workspace/ringside-keys/seller.json');
const beforeBuyer = await walletFor(buyer);
const beforeSeller = await walletFor(seller);
console.log(JSON.stringify({ phase: 'preflight', sdk: '0.4.0-alpha', buyer: buyer.toSolanaSigner().address, seller: seller.toSolanaSigner().address, buyer_private_lamports: String(beforeBuyer.lamports), seller_private_lamports: String(beforeSeller.lamports) }));
if (process.env.RINGSIDE_RUN_LIVE_TRANSFER !== '1') process.exit(0);
const amount = BigInt(process.env.RINGSIDE_TEST_AMOUNT_LAMPORTS || '1000000');
const withdrawAmount = BigInt(process.env.RINGSIDE_TEST_WITHDRAW_LAMPORTS || '500000');
if (amount <= 0n || beforeBuyer.lamports < amount) throw new Error('Existing buyer private balance is insufficient; no new deposit will be made');
const transfer = await buildTransferTransaction({ client, wallet: beforeBuyer.wallet, keys: LocalKeys.fromKeypair(buyer, client.proofService), feePayer: buyer.toSolanaSigner().address, recipient: seller.toSolanaSigner().address, asset: SOL_MINT, amount });
const transferResult = await send(buyer, transfer);
console.log(JSON.stringify({ phase: 'transfer', ...transferResult }));
const afterSeller = await walletFor(seller);
if (afterSeller.lamports < beforeSeller.lamports + amount) throw new Error('Seller private balance did not increase by transfer amount');
console.log(JSON.stringify({ phase: 'seller_balance', private_lamports: String(afterSeller.lamports) }));
if (withdrawAmount <= 0n || afterSeller.lamports < withdrawAmount) throw new Error('Seller private balance insufficient for withdrawal');
const withdrawal = await buildWithdrawalTransaction({ client, wallet: afterSeller.wallet, keys: LocalKeys.fromKeypair(seller, client.proofService), feePayer: seller.toSolanaSigner().address, recipient: seller.toSolanaSigner().address, asset: SOL_MINT, amount: withdrawAmount });
console.log(JSON.stringify({ phase: 'withdrawal', ...(await send(seller, withdrawal)) }));
