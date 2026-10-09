import { createPrivateKey, createPublicKey, randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { address } from '@solana/kit';
import { initializePoseidon, ShieldedKeypair, SigningKey, type Bytes32 } from '@heliuslabs/zolana';
import { ringsideHome } from './policy.js';

const configPath = () => join(ringsideHome(), 'config.json');
const keyPath = () => join(ringsideHome(), 'agent.json');
const tokenPath = () => join(ringsideHome(), 'pairing-token');
const savePrivate = (path: string, content: string) => { writeFileSync(path, content, { mode: 0o600 }); chmodSync(path, 0o600); };

export async function runCli(args: string[]) {
  const command = args[0];
  if (command === 'init') {
    const ownerArg = args.indexOf('--owner');
    if (ownerArg < 0 || !args[ownerArg + 1]) throw new Error('Usage: ringside-mcp init --owner <Solana owner address>');
    const owner = address(args[ownerArg + 1]);
    mkdirSync(ringsideHome(), { recursive: true, mode: 0o700 });
    if (existsSync(keyPath()) || existsSync(configPath())) throw new Error('Ringside home already initialized');
    const keyArg = args.indexOf('--keypair');
    const existingPath = keyArg >= 0 ? args[keyArg + 1] : undefined;
    if (keyArg >= 0 && !existingPath) throw new Error('Usage: ringside-mcp init --owner <address> --keypair <existing Solana keypair path>');
    const existing = existingPath ? JSON.parse(readFileSync(existingPath, 'utf8')) as unknown : undefined;
    if (existing !== undefined && (!Array.isArray(existing) || existing.length !== 64 || existing.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255))) throw new Error('Existing keypair must be a 64-byte Solana CLI JSON array');
    const seed = existing ? Buffer.from((existing as number[]).slice(0, 32)) : randomBytes(32);
    const privateKey = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]), format: 'der', type: 'pkcs8' });
    const publicKey = createPublicKey(privateKey).export({ format: 'der', type: 'spki' }).subarray(-32);
    if (existing && !publicKey.equals(Buffer.from((existing as number[]).slice(32)))) throw new Error('Existing keypair public bytes do not match its seed');
    await initializePoseidon();
    const agent = ShieldedKeypair.fromKeypair(SigningKey.fromEd25519Bytes(Uint8Array.from(seed) as Bytes32));
    const agentAddress = agent.toSolanaSigner().address;
    if (!existing) savePrivate(keyPath(), JSON.stringify([...seed, ...publicKey]));
    seed.fill(0);
    if (Array.isArray(existing)) existing.fill(0);
    savePrivate(configPath(), JSON.stringify({ network: 'devnet', owner_pubkey: owner, policy_version: 1, policy: { kill_switch: false, read_only: false, assets: { SOL: { max_per_tx: '0.05', max_per_session: '0.2', max_per_day: '0.5' } }, asset_allowlist: ['SOL'], recipient_allowlist: [], allowlist_mode: 'off', require_owner_approval_above: { SOL: '0.1' }, allow_withdrawal_fallback: false } }, null, 2));
    savePrivate(tokenPath(), randomBytes(32).toString('hex'));
    console.log(`${existing ? 'Configured existing' : 'Created'} agent ${agentAddress} in ${ringsideHome()}`);
    return;
  }
  if (command === 'pair') {
    if (!existsSync(tokenPath())) throw new Error('Run init first');
    console.log(readFileSync(tokenPath(), 'utf8'));
    return;
  }
  if (command === 'kill') {
    if (!existsSync(configPath())) throw new Error('Run init first');
    const config = JSON.parse(readFileSync(configPath(), 'utf8')) as { policy: { kill_switch: boolean }; policy_version: number };
    config.policy.kill_switch = args[1] !== 'off';
    config.policy_version += 1;
    savePrivate(configPath(), JSON.stringify(config, null, 2));
    console.log(config.policy.kill_switch ? 'Kill switch on' : 'Kill switch off');
    return;
  }
  if (command === 'status') {
    if (!existsSync(configPath())) throw new Error('Run init first');
    const config = JSON.parse(readFileSync(configPath(), 'utf8')) as { owner_pubkey: string; policy: { kill_switch: boolean } };
    console.log(JSON.stringify({ home: ringsideHome(), owner_pubkey: config.owner_pubkey, kill_switch: config.policy.kill_switch }));
    return;
  }
  throw new Error('Usage: ringside-mcp [init --owner <address> [--keypair <path>]|pair|kill [off]|status]');
}
