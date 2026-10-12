import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalOrigin, legacyOrigin, requestOrigin } from './origin.ts';

test('OAuth issuer follows the two allowed production hosts', () => {
  for (const origin of [canonicalOrigin, legacyOrigin]) {
    const request = new Request('http://127.0.0.1/mcp', { headers: { host: new URL(origin).host } });
    assert.equal(requestOrigin(request), origin);
  }
});

test('unrecognized hosts cannot choose an OAuth issuer', () => {
  const request = new Request('https://untrusted.example/mcp', { headers: { host: 'untrusted.example' } });
  assert.equal(requestOrigin(request), canonicalOrigin);
});
