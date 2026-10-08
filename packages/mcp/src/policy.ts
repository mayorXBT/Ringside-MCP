import { mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const limits = z.object({ max_per_tx: z.string(), max_per_session: z.string(), max_per_day: z.string() });
const schema = z.object({
  owner_pubkey: z.string().optional(),
  policy: z.object({
    kill_switch: z.boolean().default(false),
    read_only: z.boolean().default(false),
    assets: z.record(z.string(), limits).default({ SOL: { max_per_tx: '0.05', max_per_session: '0.2', max_per_day: '0.5' } }),
    asset_allowlist: z.array(z.string()).default(['SOL']),
    recipient_allowlist: z.array(z.string()).default([]),
    allowlist_mode: z.enum(['off', 'enforce']).default('off'),
    allow_withdrawal_fallback: z.boolean().default(false),
  }),
});
const session = randomUUID();
export const ringsideHome = () => process.env.RINGSIDE_HOME || join(homedir(), '.ringside');

export function loadPolicy() {
  let raw: unknown = { policy: {} };
  try { raw = JSON.parse(readFileSync(join(ringsideHome(), 'config.json'), 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  return schema.parse(raw).policy;
}

export function validatePolicy(value: unknown) { return schema.shape.policy.parse(value); }

function ledger() {
  mkdirSync(ringsideHome(), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(ringsideHome(), 'ledger.sqlite'));
  db.exec('CREATE TABLE IF NOT EXISTS spends (id TEXT PRIMARY KEY, ts INTEGER NOT NULL, session TEXT NOT NULL, tool TEXT NOT NULL, asset TEXT NOT NULL, amount_base TEXT NOT NULL, recipient TEXT, signature TEXT NOT NULL)');
  return db;
}

const decimalBase = (value: string, decimals: number): bigint => {
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) throw new Error('Invalid policy amount');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals) throw new Error('Policy amount has too many decimals');
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
};

export function assertSpend(tool: string, asset: string, amount: bigint, decimals: number, recipient?: string) {
  const policy = loadPolicy();
  if (policy.kill_switch) throw new Error('KILL_SWITCH: owner has stopped spending');
  if (policy.read_only) throw new Error('POLICY_DENIED: read-only mode');
  if (!policy.asset_allowlist.includes(asset)) throw new Error('POLICY_DENIED: asset is not allowed');
  if (policy.allowlist_mode === 'enforce' && recipient && !policy.recipient_allowlist.includes(recipient)) throw new Error('POLICY_DENIED: recipient is not allowed');
  const cap = policy.assets[asset];
  if (!cap) throw new Error('POLICY_DENIED: no cap configured for asset');
  if (amount > decimalBase(cap.max_per_tx, decimals)) throw new Error('POLICY_DENIED: transaction cap exceeded');
  const db = ledger();
  try {
    const day = new Date().setUTCHours(0, 0, 0, 0);
    const dayRows = db.prepare('SELECT amount_base FROM spends WHERE asset = ? AND ts >= ?').all(asset, day) as { amount_base: string }[];
    const sessionRows = db.prepare('SELECT amount_base FROM spends WHERE asset = ? AND session = ?').all(asset, session) as { amount_base: string }[];
    const daily = dayRows.reduce((sum, row) => sum + BigInt(row.amount_base), 0n);
    const currentSession = sessionRows.reduce((sum, row) => sum + BigInt(row.amount_base), 0n);
    if (daily + amount > decimalBase(cap.max_per_day, decimals)) throw new Error('POLICY_DENIED: daily cap exceeded');
    if (currentSession + amount > decimalBase(cap.max_per_session, decimals)) throw new Error('POLICY_DENIED: session cap exceeded');
    void tool;
  } finally { db.close(); }
}

export function recordSpend(tool: string, asset: string, amount: bigint, recipient: string | undefined, signature: string) {
  const db = ledger();
  try { db.prepare('INSERT INTO spends (id, ts, session, tool, asset, amount_base, recipient, signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), Date.now(), session, tool, asset, amount.toString(), recipient || null, signature); }
  finally { db.close(); }
}

export function solBudget() {
  const policy = loadPolicy();
  const caps = policy.assets.SOL;
  if (!caps) return null;
  const db = ledger();
  try {
    const day = new Date().setUTCHours(0, 0, 0, 0);
    const rows = db.prepare('SELECT ts, session, amount_base FROM spends WHERE asset = ?').all('SOL') as { ts: number; session: string; amount_base: string }[];
    const spentDay = rows.filter((row) => row.ts >= day).reduce((sum, row) => sum + BigInt(row.amount_base), 0n);
    const spentSession = rows.filter((row) => row.session === session).reduce((sum, row) => sum + BigInt(row.amount_base), 0n);
    const format = (amount: bigint) => (Number(amount) / 1e9).toString();
    return { asset: 'SOL', spent_today: format(spentDay), spent_session: format(spentSession), max_per_day: caps.max_per_day, max_per_session: caps.max_per_session };
  } finally { db.close(); }
}
