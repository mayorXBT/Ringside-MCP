#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { balances, createTestToken, depositSol, depositWithInterfaceSetup, history, privateTransfer, registerWallet, walletInfo, withdraw } from './core.js';
import { loadPolicy } from './policy.js';
import { createPaymentRequest, payPaymentRequest, verifyPayment } from './seller.js';

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
server.registerTool('create_test_token', { description: 'Create and mint a devnet SPL test token', inputSchema: { amount: z.string(), decimals: z.number().int().min(0).max(9).default(9) }, annotations: { destructiveHint: true, readOnlyHint: false, openWorldHint: true } }, ({ amount, decimals }) => output(() => createTestToken(amount, decimals)));
server.registerTool('deposit_with_interface_setup', { description: 'Create an SPL private interface if needed and deposit tokens', inputSchema: { mint: z.string(), amount: z.string(), source_token_account: z.string() }, annotations: { destructiveHint: true, readOnlyHint: false, openWorldHint: true } }, ({ mint, amount, source_token_account }) => output(() => depositWithInterfaceSetup(mint, amount, source_token_account)));
server.registerTool('create_payment_request', { description: 'Issue a private payment request for a seller resource', inputSchema: { asset: z.string(), amount: z.string(), resource: z.string(), ttl_seconds: z.number().int().min(1).max(3600).default(300) }, annotations: { readOnlyHint: false, destructiveHint: false } }, ({ asset, amount, resource, ttl_seconds }) => output(() => createPaymentRequest(asset, amount, resource, ttl_seconds)));
const paymentRequestSchema = z.object({ scheme: z.literal('ringside-private-v1'), network: z.literal('solana-devnet'), pay_to: z.string(), asset: z.string(), amount: z.string(), nonce: z.string(), expires_at: z.string(), resource: z.string() });
server.registerTool('pay_payment_request', { description: 'Pay a seller request privately and return an X-PAYMENT header', inputSchema: { request: paymentRequestSchema }, annotations: { destructiveHint: true, readOnlyHint: false, openWorldHint: true } }, ({ request }) => output(() => payPaymentRequest(request)));
server.registerTool('verify_payment', { description: 'Verify an inbound private payment against a stored seller request', inputSchema: { signature: z.string(), nonce: z.string(), expected_payer: z.string().optional(), consume: z.boolean().default(true) }, annotations: { readOnlyHint: false, destructiveHint: false } }, ({ signature, nonce, expected_payer, consume }) => output(() => verifyPayment(signature, nonce, expected_payer, consume)));
await server.connect(new StdioServerTransport());
