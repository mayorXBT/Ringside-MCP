import assert from 'node:assert/strict';
import test from 'node:test';
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import bs58 from 'bs58';
import { runCli } from '../dist/cli.js';

test('init configures an existing funded keypair without copying it', async () => {
  const home = mkdtempSync(join(tmpdir(), 'ringside-existing-'));
  const pair = generateKeyPairSync('ed25519');
  const seed = pair.privateKey.export({ format: 'der', type: 'pkcs8' }).subarray(-32);
  const publicBytes = pair.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
  const path = join(home, 'funded.json');
  writeFileSync(path, JSON.stringify([...seed, ...publicBytes]), { mode: 0o600 });
  const prior = process.env.RINGSIDE_HOME;
  process.env.RINGSIDE_HOME = home;
  try {
    await runCli(['init', '--owner', bs58.encode(publicBytes), '--keypair', path]);
    assert.equal(existsSync(join(home, 'agent.json')), false);
    assert.equal(JSON.parse(readFileSync(join(home, 'config.json'), 'utf8')).owner_pubkey, bs58.encode(publicBytes));
    assert.equal(existsSync(join(home, 'pairing-token')), true);
  } finally {
    if (prior === undefined) delete process.env.RINGSIDE_HOME;
    else process.env.RINGSIDE_HOME = prior;
  }
});
