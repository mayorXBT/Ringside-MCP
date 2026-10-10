import { randomUUID } from 'node:crypto';
import { db, ensureSchema } from '@/lib/hosted/db';
import { createFlowToken, readFlowToken } from '@/lib/hosted/flow-token';
import { problem } from '@/lib/hosted/http';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const resume = params.get('flow');
  if (resume) {
    const id = readFlowToken(resume);
    if (!id) return problem(400, 'invalid_flow');
    try {
      await ensureSchema();
      const rows = await db()`SELECT id FROM hosted_authorizations WHERE id=${id} AND expires_at>now()`;
      if (!rows[0]) return problem(400, 'invalid_flow');
      return Response.redirect(new URL(`/connect?flow=${encodeURIComponent(resume)}`, url));
    } catch { return problem(503, 'temporarily_unavailable'); }
  }
  const client = params.get('client_id');
  const redirect = params.get('redirect_uri');
  const challenge = params.get('code_challenge');
  const state = params.get('state') || '';
  if (!client || !redirect || !challenge || params.get('code_challenge_method') !== 'S256' ||
    !/^[A-Za-z0-9_-]{43}$/.test(challenge) || state.length > 512 || params.get('response_type') !== 'code')
    return problem(400, 'invalid_request');
  try {
    await ensureSchema();
    const rows = await db()`SELECT redirect_uris FROM hosted_clients WHERE client_id=${client}`;
    const uris = rows[0]?.redirect_uris as string[] | undefined;
    if (!uris?.includes(redirect)) return problem(400, 'invalid_client');
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db()`INSERT INTO hosted_authorizations(id,client_id,redirect_uri,state,code_challenge,expires_at) VALUES(${id},${client},${redirect},${state},${challenge},${expiresAt.toISOString()}::timestamptz)`;
    const token = createFlowToken(id, expiresAt);
    return Response.redirect(new URL(`/connect?flow=${encodeURIComponent(token)}`, url));
  } catch { return problem(503, 'temporarily_unavailable'); }
}
