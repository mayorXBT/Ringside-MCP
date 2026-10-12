import 'server-only';
import { cookies } from 'next/headers';
import { db, getToken } from './db';
import { sha256 } from './crypto';
export const issuer='https://ringside-dashboard.vercel.app';
export function problem(status:number,error:string,description?:string){return Response.json({error,error_description:description||error},{status,headers:{'Cache-Control':'no-store'}})}
export async function sessionOwner(){const token=(await cookies()).get('ringside_hosted_session')?.value;return token?(await getToken(sha256(token),'session'))?.owner:undefined}
export async function bearerOwner(request:Request){const match=/^Bearer (\S+)$/i.exec(request.headers.get('authorization')||'');if(!match)return undefined;const hash=sha256(match[1]);const token=await getToken(hash,'access');if(token){try{await db()`UPDATE hosted_tokens SET last_used_at=now() WHERE hash=${hash}`}catch{}}return token?.owner}
export function appendQuery(uri:string,params:Record<string,string>){const url=new URL(uri);for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);return url.toString()}
