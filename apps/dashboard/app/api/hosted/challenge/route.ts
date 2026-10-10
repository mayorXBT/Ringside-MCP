import { randomUUID } from 'node:crypto';
import { db, ensureSchema } from '@/lib/hosted/db';
import { readFlowToken } from '@/lib/hosted/flow-token';
import { problem } from '@/lib/hosted/http';

export async function POST(request: Request) {
  try {
    const { flow_id } = await request.json() as { flow_id?: string };
    const id = flow_id ? readFlowToken(flow_id) : null;
    if (flow_id && !id) return problem(400, 'invalid_flow');
    await ensureSchema();
    if (id) {
      const rows = await db()`SELECT id FROM hosted_authorizations WHERE id=${id} AND expires_at>now()`;
      if (!rows[0]) return problem(400, 'invalid_flow');
    }
    const challengeId = randomUUID();
    const origin = new URL(request.url).origin;
    const message = `${origin} wants you to sign in to Ringside.\n\nThis creates a capped devnet agent wallet. Ringside stores its key encrypted on the server.\n\nURI: ${origin}\nVersion: 1\nChain ID: solana:devnet\nNonce: ${challengeId}\nIssued At: ${new Date().toISOString()}`;
    await db()`INSERT INTO hosted_challenges(id,message,flow_id,expires_at) VALUES(${challengeId},${message},${id},now()+interval '5 minutes')`;
    return Response.json({ challenge_id: challengeId, message }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return problem(503, 'temporarily_unavailable'); }
}
