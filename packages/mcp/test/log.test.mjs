import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../dist/log.js';

test('tool and log error text removes configured API keys', () => {
  process.env.HELIUS_API_KEY = 'example-secret-value';
  const safe = redact('request to https://devnet.helius-rpc.com/?api-key=example-secret-value failed: example-secret-value');
  assert.equal(safe.includes('example-secret-value'), false);
  assert.match(safe, /\[redacted\]/);
  delete process.env.HELIUS_API_KEY;
});
