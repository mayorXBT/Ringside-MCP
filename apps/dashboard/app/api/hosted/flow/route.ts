import { db, ensureSchema } from '@/lib/hosted/db';
import { readFlowToken } from '@/lib/hosted/flow-token';
import { problem } from '@/lib/hosted/http';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('id');
  const id = readFlowToken(token);
  if (!id) return problem(400, 'invalid_flow');
  try {
    await ensureSchema();
    const rows = await db()`SELECT c.name, a.redirect_uri FROM hosted_authorizations a JOIN hosted_clients c ON c.client_id=a.client_id WHERE a.id=${id} AND a.expires_at>now()`;
    if (!rows[0]) return problem(400, 'invalid_flow');
    const redirectHost = new URL(String(rows[0].redirect_uri)).hostname.toLowerCase();
    const isChatGPT = redirectHost === 'chatgpt.com' || redirectHost.endsWith('.chatgpt.com') || redirectHost === 'openai.com' || redirectHost.endsWith('.openai.com');
    return Response.json({ client_name: isChatGPT ? 'ChatGPT' : String(rows[0].name), authorize_url: new URL(`/oauth/authorize?flow=${encodeURIComponent(token!)}`, request.url).toString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return problem(503, 'temporarily_unavailable'); }
}
