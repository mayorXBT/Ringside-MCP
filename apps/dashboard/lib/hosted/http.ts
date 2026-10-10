import 'server-only';
import { cookies } from 'next/headers';
import { getToken } from './db';
import { sha256 } from './crypto';
export const issuer='https://ringside-dashboard.vercel.app';
export function problem(status:number,error:string,description?:string){return Response.json({error,error_description:description||error},{status,headers:{'Cache-Control':'no-store'}})}
export async function sessionOwner(){const token=(await cookies()).get('ringside_hosted_session')?.value;return token?(await getToken(sha256(token),'session'))?.owner:undefined}
export async function bearerOwner(request:Request){const match=/^Bearer (\S+)$/i.exec(request.headers.get('authorization')||'');return match?(await getToken(sha256(match[1]),'access'))?.owner:undefined}
export function appendQuery(uri:string,params:Record<string,string>){const url=new URL(uri);for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);return url.toString()}
