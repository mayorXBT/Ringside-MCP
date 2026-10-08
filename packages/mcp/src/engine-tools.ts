import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { engine } from './engine.js';
import { privateTransfer } from './core.js';

const amount = z.string().regex(/^(0|[1-9]\d*)(\.\d+)?$/);
const spend = { destructiveHint: true, readOnlyHint: false, openWorldHint: true } as const;
const read = { readOnlyHint: true } as const;
const result = async (method: string, params: Record<string, unknown>) => {
  try { return { content: [{ type: 'text' as const, text: JSON.stringify(await engine.call(method, params)) }] }; }
  catch (error) { return { isError: true, content: [{ type: 'text' as const, text: error instanceof Error ? error.message : 'ENGINE_UNAVAILABLE' }] }; }
};

export function registerEngineTools(server: McpServer) {
  server.registerTool('swap_make_order', { description: 'Lock a confidential maker order (requires Rust engine)', inputSchema: { source_asset: z.string(), source_amount: amount, destination_asset: z.string(), destination_amount: amount, taker: z.string(), expires_in_seconds: z.number().int().positive(), take_mode: z.enum(['derived', 'verifiable_encryption']).default('derived') }, annotations: spend }, (params) => result('swap.make', params));
  server.registerTool('swap_list_orders', { description: 'Find confidential swap orders (requires Rust engine)', inputSchema: { role: z.enum(['taker', 'maker']), timeout_seconds: z.number().int().positive().default(30) }, annotations: read }, (params) => result('swap.list', params));
  server.registerTool('swap_take_order', { description: 'Settle a confidential swap order (requires Rust engine)', inputSchema: { order_utxo_hash: z.string() }, annotations: spend }, (params) => result('swap.take', params));
  server.registerTool('swap_take_order_verifiable', { description: 'Settle an encrypted taker swap order (requires Rust engine)', inputSchema: { order_utxo_hash: z.string() }, annotations: spend }, (params) => result('swap.take_ve', params));
  server.registerTool('swap_cancel_order', { description: 'Cancel an expired maker order (requires Rust engine)', inputSchema: { order_utxo_hash: z.string() }, annotations: spend }, (params) => result('swap.cancel', params));
  server.registerTool('escrow_lock', { description: 'Lock private funds until a deadline (requires Rust engine)', inputSchema: { asset: z.string(), amount, unlock_in_seconds: z.number().int().positive().optional(), unlock_at: z.string().optional(), label: z.string().optional(), beneficiary: z.string().optional() }, annotations: spend }, (params) => result('escrow.lock', params));
  server.registerTool('escrow_list', { description: 'List local private escrow notes (requires Rust engine)', inputSchema: { status: z.enum(['locked', 'unlockable', 'withdrawn']).optional() }, annotations: read }, (params) => result('escrow.list', params));
  server.registerTool('escrow_withdraw', { description: 'Reclaim unlocked private escrow (requires Rust engine)', inputSchema: { escrow_id: z.string() }, annotations: spend }, (params) => result('escrow.withdraw', params));
  server.registerTool('escrow_release', { description: 'Withdraw escrow then privately pay the beneficiary (requires Rust engine)', inputSchema: { escrow_id: z.string(), recipient: z.string().optional() }, annotations: spend }, async ({ escrow_id, recipient }) => {
    try {
      const withdrawn = await engine.call('escrow.withdraw', { escrow_id }) as { signature: string; asset: string; amount: string; beneficiary?: string };
      const destination = recipient || withdrawn.beneficiary;
      if (!destination) throw new Error('Beneficiary missing');
      const paid = await privateTransfer(destination, withdrawn.asset, withdrawn.amount);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ withdraw_signature: withdrawn.signature, transfer_signature: paid.signature }) }] };
    } catch (error) { return { isError: true, content: [{ type: 'text' as const, text: error instanceof Error ? error.message : 'ENGINE_UNAVAILABLE' }] }; }
  });
}
