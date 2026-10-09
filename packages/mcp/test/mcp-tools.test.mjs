import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('MCP lists core tools with spend and read annotations', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--use-env-proxy', new URL('../dist/index.js', import.meta.url).pathname],
    env: { ...process.env, RINGSIDE_CONTROL_PORT: '0' },
  });
  const client = new Client({ name: 'ringside-test', version: '0.1.0' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool]));
    for (const name of ['create_private_wallet', 'deposit', 'private_transfer', 'withdraw', 'deposit_with_interface_setup']) {
      assert.equal(byName.get(name)?.annotations?.destructiveHint, true, name);
    }
    for (const name of ['get_private_balance', 'get_private_history', 'sync_balance', 'read_history']) {
      assert.equal(byName.get(name)?.annotations?.readOnlyHint, true, name);
    }
    assert.equal(byName.has('set_policy'), false);
  } finally {
    await client.close();
  }
});
