#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { balances, depositSol, history, privateTransfer, registerWallet, walletInfo, withdraw } from './core.js';
import { loadPolicy } from './policy.js';

const server = new McpServer({ name: 'ringside-mcp', version: '0.1.0' });
const output = async (fn: () => Promise<unknown>) => {
  try { return { content: [{ type: 'text' as const, text: JSON.stringify(await fn()) }] }; }
  catch (error) { return { isError: true, content: [{ type: 'text' as const, text: error instanceof Error ? error.message.replace(/api-key=[^&\s]+/gi, 'api-key=[redacted]') : 'Unknown error' }] }; }
};
server.registerTool('wallet_info', { description: 'Read the devnet agent identity and public SOL balance', annotations: { readOnlyHint: true } }, () => output(walletInfo));
server.registerTool('register_private_wallet', { description: 'Register this agent for private payments', annotations: { destructiveHint: true, readOnlyHint: false, openWorldHint: true } }, () => output(registerWallet));
server.registerTool('deposit', { description: 'Deposit public SOL to the private wallet', inputSchema: { asset: z.literal('SOL'), amount: z.string() }, annotations: { destructiveHint: true, readOnlyHint: false, openWorldHint: true } }, ({ amount }) => output(() => depositSol(amount)));
server.registerTool('sync_balance', { description: 'Read decrypted private balances', annotations: { readOnlyHint: true } }, () => output(balances));
server.registerTool('read_history', { description: 'Read decrypted private transaction history', inputSchema: { limit: z.number().int().min(1).max(500).default(50) }, annotations: { readOnlyHint: true } }, ({ limit }) => output(() => history(limit)));
server.registerTool('private_transfer', { description: 'Send a confidential payment to a registered devnet recipient', inputSchema: { recipient: z.string(), asset: z.string(), amount: z.string() }, annotations: { destructiveHint: true, readOnlyHint: false, openWorldHint: true } }, ({ recipient, asset, amount }) => output(() => privateTransfer(recipient, asset, amount)));
server.registerTool('withdraw', { description: 'Withdraw private funds to a public devnet address', inputSchema: { asset: z.string(), amount: z.string(), recipient: z.string().optional() }, annotations: { destructiveHint: true, readOnlyHint: false, openWorldHint: true } }, ({ asset, amount, recipient }) => output(() => withdraw(asset, amount, recipient)));
server.registerTool('get_policy', { description: 'Read the current owner spending policy', annotations: { readOnlyHint: true } }, () => output(async () => ({ policy: loadPolicy() })));
await server.connect(new StdioServerTransport());
