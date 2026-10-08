import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import bs58 from 'bs58';
import { canonicalJson, startControlServer } from '../dist/control.js';

test('control API applies one owner-signed policy change and rejects replay', async () => {
  const home = mkdtempSync(join(tmpdir(), 'ringside-control-'));
  process.env.RINGSIDE_HOME = home;
  process.env.RINGSIDE_CONTROL_PORT = '0';
  const owner = generateKeyPairSync('ed25519');
  const wrong = generateKeyPairSync('ed25519');
  const ownerAddress = bs58.encode(owner.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32));
  const initial = { owner_pubkey: ownerAddress, policy_version: 1, policy: { kill_switch: false, read_only: false } };
  writeFileSync(join(home, 'config.json'), JSON.stringify(initial));
  const server = startControlServer();
  try {
    if (!server.listening) await once(server, 'listening');
    const url = `http://127.0.0.1:${server.address().port}/v1/policy`;
    const token = readFileSync(join(home, 'pairing-token'), 'utf8').trim();
    const policy = { kill_switch: false, read_only: true };
    const issued = new Date();
    const envelope = { action: 'policy', payload_sha256: createHash('sha256').update(canonicalJson(policy)).digest('hex'), nonce: 'b'.repeat(32), issued_at: issued.toISOString(), expires_at: new Date(issued.getTime() + 60_000).toISOString() };
    const bytes = Buffer.from(`ringside-mcp:v1:${canonicalJson(envelope)}`);
    const post = async (privateKey, auth = token) => fetch(url, { method: 'POST', headers: { authorization: `Bearer ${auth}`, 'content-type': 'application/json' }, body: JSON.stringify({ policy, envelope, signature: sign(null, bytes, privateKey).toString('base64') }) });
    assert.equal((await post(owner.privateKey, 'wrong-token')).status, 401);
    assert.equal((await post(wrong.privateKey)).status, 403);
    assert.equal((await post(owner.privateKey)).status, 200);
    assert.equal((await post(owner.privateKey)).status, 409);
    const stored = JSON.parse(readFileSync(join(home, 'config.json'), 'utf8'));
    assert.equal(stored.policy.read_only, true);
    assert.equal(stored.policy_version, 2);
  } finally { server.close(); }
});
