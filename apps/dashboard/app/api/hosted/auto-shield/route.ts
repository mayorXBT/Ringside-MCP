import { sessionOwner, problem } from '@/lib/hosted/http';
import { autoShield } from '@/lib/hosted/auto-shield';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){try{const owner=await sessionOwner();if(!owner)return problem(401,'login_required');const body=await request.json().catch(()=>({})) as {retry?:boolean};return Response.json(await autoShield(owner,{retry:body.retry===true}),{headers:{'Cache-Control':'no-store'}})}catch{return problem(503,'auto_shield_unavailable','Auto-shield is unavailable. Please retry.')}}
