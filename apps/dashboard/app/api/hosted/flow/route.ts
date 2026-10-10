import { db,ensureSchema } from '@/lib/hosted/db';
import { problem } from '@/lib/hosted/http';
export async function GET(request:Request){const id=new URL(request.url).searchParams.get('id');if(!id)return problem(400,'invalid_flow');try{await ensureSchema();const rows=await db()`SELECT c.name FROM hosted_authorizations a JOIN hosted_clients c ON c.client_id=a.client_id WHERE a.id=${id} AND a.expires_at>now()`;return rows[0]?Response.json({client_name:rows[0].name},{headers:{'Cache-Control':'no-store'}}):problem(400,'invalid_flow')}catch{return problem(503,'temporarily_unavailable')}}
