import { cookies } from 'next/headers';
import { db, ensureSchema } from '@/lib/hosted/db';
import { sha256 } from '@/lib/hosted/crypto';
export const runtime='nodejs';
export async function POST(){const jar=await cookies(),token=jar.get('ringside_hosted_session')?.value;if(token){await ensureSchema();await db()`DELETE FROM hosted_tokens WHERE hash=${sha256(token)} AND kind='session'`}jar.delete('ringside_hosted_session');return Response.json({signed_out:true},{headers:{'Cache-Control':'no-store'}})}
