import { getBase64EncodedWireTransaction, getSignatureFromTransaction, signTransactionWithSigners, type Transaction } from '@solana/kit';
import { buildDepositTransaction, buildRegistrationTransaction, buildTransferTransaction, buildWithdrawalTransaction, createZolanaClient, initializePoseidon, LocalKeys, ShieldedKeypair, SigningKey, Wallet, syncWallet, SOL_MINT, type Bytes32 } from '@heliuslabs/zolana04';
import { AssetRegistry, LocalShieldedKeys } from '@heliuslabs/zolana04/transaction';

const seedKey = 'ringside:demo:burner-seed';
const config = { solanaRpcUrl: 'https://api.devnet.solana.com', indexerUrl: 'https://d2xah7tnhdhcom.cloudfront.net', proverUrl: 'https://d21ni15goiip6l.cloudfront.net' };
export const demoSeller = '79ARuP2P78svsx3wRyYKuD6mizktZvqkhuqF3yJEUr9J';
type Client = Awaited<ReturnType<typeof createZolanaClient>>;

export function burnerIdentity() {
  let encoded = localStorage.getItem(seedKey) || sessionStorage.getItem(seedKey);
  if (!encoded) {
    const seed = crypto.getRandomValues(new Uint8Array(32));
    encoded = btoa(String.fromCharCode(...seed));
    localStorage.setItem(seedKey, encoded);
    seed.fill(0);
  }
  if (!localStorage.getItem(seedKey)) localStorage.setItem(seedKey, encoded);
  const seed = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
  const identity = ShieldedKeypair.fromKeypair(SigningKey.fromEd25519Bytes(seed as Bytes32));
  seed.fill(0);
  return identity;
}

export async function burnerContext() {
  await initializePoseidon();
  const identity = burnerIdentity();
  const client = await createZolanaClient(config);
  return { identity, client, owner: identity.toSolanaSigner().address };
}

async function send(client: Client, identity: ShieldedKeypair, transaction: Transaction) {
  const signed = await signTransactionWithSigners([identity.toSolanaSigner()], transaction);
  const signature = getSignatureFromTransaction(signed);
  const wire = getBase64EncodedWireTransaction(signed);
  const result = await fetch(config.solanaRpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sendTransaction', params: [wire, { encoding: 'base64', preflightCommitment: 'confirmed' }] }) });
  const body = await result.json() as { error?: { message?: string }; result?: string };
  if (!result.ok || body.error || !body.result) throw new Error(body.error?.message || `Devnet RPC returned HTTP ${result.status}`);
  await client.confirmTransaction(signature);
  return signature;
}

export async function burnerRegister() {
  const { client, identity, owner } = await burnerContext();
  const transaction = await buildRegistrationTransaction({ client, owner, address: identity.shieldedAddress() });
  return transaction ? { signature: await send(client, identity, transaction), owner } : { signature: null, owner };
}

export async function burnerDeposit() {
  const { client, identity, owner } = await burnerContext();
  const transaction = await buildDepositTransaction({ client, feePayer: owner, depositor: owner, recipient: identity.shieldedAddress(), asset: SOL_MINT, amount: 10_000_000n });
  return { signature: await send(client, identity, transaction), owner };
}

export async function burnerBalance() {
  const { client, identity } = await burnerContext();
  const wallet = new Wallet({ identity: identity.shieldedAddress(), registry: new AssetRegistry() });
  await syncWallet({ wallet, keys: LocalShieldedKeys.fromKeypair(identity), client, config: { pageLimit: 50 } });
  return { lamports: wallet.balances().filter(item => item.mint === SOL_MINT).reduce((sum, item) => sum + item.amount, 0n), wallet, client, identity };
}

export async function burnerWithdraw(recipient: string) {
  const { lamports, wallet, client, identity } = await burnerBalance();
  if (lamports <= 0n) throw new Error('No synced private SOL is available to withdraw.');
  const transaction = await buildWithdrawalTransaction({ client, wallet, keys: LocalKeys.fromKeypair(identity, client.proofService), feePayer: identity.toSolanaSigner().address, recipient: recipient as ReturnType<typeof identity.toSolanaSigner>['address'], asset: SOL_MINT, amount: lamports });
  return { signature: await send(client, identity, transaction), amount: Number(lamports) / 1e9 };
}

export async function burnerTransfer() {
  const { lamports, wallet, client, identity } = await burnerBalance();
  const amount = 1_000_000n;
  if (lamports < amount) throw new Error('Deposit and sync at least 0.001 private SOL first.');
  const transaction = await buildTransferTransaction({ client, wallet, keys: LocalKeys.fromKeypair(identity, client.proofService), feePayer: identity.toSolanaSigner().address, recipient: demoSeller as ReturnType<typeof identity.toSolanaSigner>['address'], asset: SOL_MINT, amount });
  return { signature: await send(client, identity, transaction), amount: 0.001, seller: demoSeller };
}
