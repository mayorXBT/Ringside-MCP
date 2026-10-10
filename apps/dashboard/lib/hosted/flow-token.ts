import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_AGE_MS = 10 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function secret() {
  const value = process.env.RINGSIDE_HOSTED_SECRET;
  if (!value || value.length < 32) throw new Error('HOSTED_NOT_CONFIGURED');
  return value;
}
function signature(payload: string) {
  return createHmac('sha256', secret()).update('ringside-oauth-flow-v1:').update(payload).digest('base64url');
}
export function createFlowToken(id: string, expiresAt: Date) {
  const payload = Buffer.from(JSON.stringify({ id, exp: expiresAt.getTime() })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}
export function readFlowToken(token: string | null | undefined): string | null {
  if (!token || token.length > 512) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    const expected = Buffer.from(signature(parts[0]));
    const supplied = Buffer.from(parts[1]);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const parsed: unknown = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    if (!parsed || typeof parsed !== 'object') return null;
    const { id, exp } = parsed as { id?: unknown; exp?: unknown };
    if (typeof id !== 'string' || !UUID.test(id) || typeof exp !== 'number') return null;
    const now = Date.now();
    if (exp <= now || exp > now + MAX_AGE_MS + 1000) return null;
    return id;
  } catch { return null; }
}
