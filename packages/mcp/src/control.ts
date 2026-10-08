import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash, createPublicKey, randomBytes, timingSafeEqual, verify as verifySignature } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bs58 from 'bs58';
import { balances, history, walletInfo } from './core.js';
import { loadPolicy, ringsideHome, validatePolicy } from './policy.js';

const corsOrigins = () => (process.env.RINGSIDE_DASHBOARD_ORIGINS || 'http://localhost:3000').split(',').map((item) => item.trim());
const tokenPath = () => join(ringsideHome(), 'pairing-token');
const configPath = () => join(ringsideHome(), 'config.json');
const json = (response: ServerResponse, status: number, body: unknown) => { response.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body)); };

function token() {
  mkdirSync(ringsideHome(), { recursive: true, mode: 0o700 });
  if (!existsSync(tokenPath())) writeFileSync(tokenPath(), randomBytes(32).toString('hex'), { mode: 0o600 });
  return readFileSync(tokenPath(), 'utf8').trim();
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

function authorizedRead(request: IncomingMessage) {
  const received = request.headers.authorization?.replace(/^Bearer /i, '') || request.headers['x-ringside-token'];
  if (typeof received !== 'string') return false;
  const a = Buffer.from(received), b = Buffer.from(token());
  return a.length === b.length && timingSafeEqual(a, b);
}

function nonceStore() {
  const db = new DatabaseSync(join(ringsideHome(), 'ledger.sqlite'));
  db.exec('CREATE TABLE IF NOT EXISTS policy_nonces (nonce TEXT PRIMARY KEY, ts INTEGER NOT NULL)');
  return db;
}

export function verifyOwnerEnvelope(input: { action: string; payload: unknown; envelope: { action: string; payload_sha256: string; nonce: string; issued_at: string; expires_at: string }; signature: string; owner: string }) {
  const { action, payload, envelope, signature, owner } = input;
  if (envelope.action !== action || !/^[a-f0-9]{32,128}$/.test(envelope.nonce)) return false;
  const issued = Date.parse(envelope.issued_at), expires = Date.parse(envelope.expires_at), now = Date.now();
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || issued > now + 30_000 || expires < now || expires - issued > 300_000) return false;
  const hash = createHash('sha256').update(canonicalJson(payload)).digest('hex');
  if (hash !== envelope.payload_sha256) return false;
  try {
    const publicBytes = bs58.decode(owner);
    if (publicBytes.length !== 32) return false;
    const publicKey = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), publicBytes]), format: 'der', type: 'spki' });
    const message = Buffer.from(`ringside-mcp:v1:${canonicalJson(envelope)}`);
    return verifySignature(null, message, publicKey, Buffer.from(signature, 'base64'));
  } catch { return false; }
}

async function bodyJson(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('Request body too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

async function handle(request: IncomingMessage, response: ServerResponse) {
  const origin = request.headers.origin;
  if (origin && corsOrigins().includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Ringside-Token');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  if (request.method === 'OPTIONS') { response.writeHead(origin && corsOrigins().includes(origin) ? 204 : 403).end(); return; }
  if (origin && !corsOrigins().includes(origin)) { json(response, 403, { error: 'Origin denied' }); return; }
  if (!authorizedRead(request)) { json(response, 401, { error: 'Pairing token required' }); return; }
  const path = new URL(request.url || '/', 'http://127.0.0.1').pathname;
  try {
    if (request.method === 'GET' && path === '/v1/status') { json(response, 200, { ...await walletInfo(), policy: loadPolicy() }); return; }
    if (request.method === 'GET' && path === '/v1/balances') { json(response, 200, await balances()); return; }
    if (request.method === 'GET' && path === '/v1/activity') { json(response, 200, await history(50)); return; }
    if (request.method === 'GET' && path === '/v1/policy') { json(response, 200, { policy: loadPolicy() }); return; }
    if (request.method === 'POST' && (path === '/v1/policy' || path === '/v1/kill')) {
      if (!existsSync(configPath())) { json(response, 409, { error: 'Run init with an owner wallet first' }); return; }
      const config = JSON.parse(readFileSync(configPath(), 'utf8')) as { owner_pubkey: string; policy: unknown; policy_version: number };
      const body = await bodyJson(request);
      if (path === '/v1/kill' && typeof body.on !== 'boolean') { json(response, 400, { error: 'on must be boolean' }); return; }
      const payload = path === '/v1/kill' ? { on: body.on } : body.policy;
      const envelope = body.envelope as Parameters<typeof verifyOwnerEnvelope>[0]['envelope'];
      if (!envelope || typeof body.signature !== 'string' || !verifyOwnerEnvelope({ action: path === '/v1/kill' ? 'kill' : 'policy', payload, envelope, signature: body.signature, owner: config.owner_pubkey })) { json(response, 403, { error: 'Invalid owner signature' }); return; }
      const db = nonceStore();
      try {
        const inserted = db.prepare('INSERT OR IGNORE INTO policy_nonces (nonce, ts) VALUES (?, ?)').run(envelope.nonce, Date.now());
        if (!inserted.changes) { json(response, 409, { error: 'Nonce already used' }); return; }
      } finally { db.close(); }
      const nextPolicy = path === '/v1/kill' ? { ...(config.policy as object), kill_switch: body.on === true } : payload;
      config.policy = validatePolicy(nextPolicy);
      config.policy_version += 1;
      const temp = `${configPath()}.tmp`;
      writeFileSync(temp, JSON.stringify(config, null, 2), { mode: 0o600 });
      renameSync(temp, configPath());
      json(response, 200, { policy_version: config.policy_version, policy: config.policy });
      return;
    }
    json(response, 404, { error: 'Not found' });
  } catch (error) {
    json(response, 500, { error: error instanceof Error ? error.message.replace(/api-key=[^&\s]+/gi, 'api-key=[redacted]') : 'Internal error' });
  }
}

export function startControlServer() {
  token();
  const port = Number(process.env.RINGSIDE_CONTROL_PORT || '7420');
  const server = createServer((request, response) => { void handle(request, response); });
  server.listen(port, '127.0.0.1');
  return server;
}
