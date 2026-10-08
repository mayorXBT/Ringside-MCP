import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import bs58 from 'bs58';
import { canonicalJson, verifyOwnerEnvelope } from '../dist/control.js';

test('owner envelope requires the configured wallet signature and exact payload', () => {
  const owner = generateKeyPairSync('ed25519');
  const attacker = generateKeyPairSync('ed25519');
  const ownerAddress = bs58.encode(owner.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32));
  const payload = { kill_switch: true };
  const issued = new Date();
  const envelope = {
    action: 'policy', payload_sha256: createHash('sha256').update(canonicalJson(payload)).digest('hex'),
    nonce: 'a'.repeat(32), issued_at: issued.toISOString(), expires_at: new Date(issued.getTime() + 60_000).toISOString(),
  };
  const signature = sign(null, Buffer.from(`ringside-mcp:v1:${canonicalJson(envelope)}`), owner.privateKey).toString('base64');
  const input = { action: 'policy', payload, envelope, signature, owner: ownerAddress };
  assert.equal(verifyOwnerEnvelope(input), true);
  assert.equal(verifyOwnerEnvelope({ ...input, payload: { kill_switch: false } }), false);
  assert.equal(verifyOwnerEnvelope({ ...input, signature: sign(null, Buffer.from(`ringside-mcp:v1:${canonicalJson(envelope)}`), attacker.privateKey).toString('base64') }), false);
  assert.equal(verifyOwnerEnvelope({ ...input, action: 'kill' }), false);
});
