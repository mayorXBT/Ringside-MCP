import assert from 'node:assert/strict';
import test from 'node:test';
import { clientConfig } from '../dist/core.js';

test('localnet uses the zolana dev start services without a Helius key', () => {
  const old = Object.fromEntries(['RINGSIDE_NETWORK', 'ZOLANA_ENDPOINT', 'ZOLANA_INDEXER_URL', 'ZOLANA_PROVER_URL', 'HELIUS_API_KEY', 'API_KEY'].map((key) => [key, process.env[key]]));
  try {
    for (const key of Object.keys(old)) delete process.env[key];
    process.env.RINGSIDE_NETWORK = 'localnet';
    assert.deepEqual(clientConfig(), {
      solanaRpcUrl: 'http://127.0.0.1:8899',
      indexerUrl: 'http://127.0.0.1:8784',
      proverUrl: 'http://127.0.0.1:3001',
    });
    process.env.RINGSIDE_NETWORK = 'mainnet';
    assert.throws(() => clientConfig(), /must be devnet or localnet/);
  } finally {
    for (const [key, value] of Object.entries(old)) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
});
