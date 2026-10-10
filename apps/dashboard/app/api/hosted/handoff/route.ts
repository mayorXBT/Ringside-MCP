import { db, ensureSchema } from '@/lib/hosted/db';
import { readFlowToken } from '@/lib/hosted/flow-token';
import { problem } from '@/lib/hosted/http';

export async function GET(request: Request) {
  const id = readFlowToken(new URL(request.url).searchParams.get('flow'));
  if (!id) return problem(400, 'invalid_flow');
  try {
    await ensureSchema();
    const rows = await db()`SELECT redirect_url FROM hosted_handoffs WHERE flow_id=${id} AND expires_at>now()`;
    if (rows[0]) return Response.json({ status: 'ready', redirect: String(rows[0].redirect_url) }, { headers: { 'Cache-Control': 'no-store' } });
    const active = await db()`SELECT id FROM hosted_authorizations WHERE id=${id} AND expires_at>now()`;
    if (!active[0]) return problem(400, 'invalid_flow');
    return Response.json({ status: 'pending' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return problem(503, 'temporarily_unavailable'); }
}
