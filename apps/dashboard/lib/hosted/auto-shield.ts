import 'server-only';
import { randomUUID } from 'node:crypto';
import { balances, deposit, registerWallet, walletInfo } from 'ringside-mcp/core';
import { db, ensureSchema, getOwner } from './db';
import { withOwner } from './service';
import { planAutoShield } from './auto-shield-plan';

export type AutoShieldPolicy={auto_shield_funds?:boolean;auto_shield_reserve_sol?:string;kill_switch?:boolean;read_only?:boolean};
const readable=(error:unknown)=>{const message=error instanceof Error?error.message:String(error);if(/prover|indexer|timeout|fetch failed|503/i.test(message))return 'The Helius privacy service is unavailable. Your public funds are safe. Retry when it is back.';if(/balance|insufficient|fee/i.test(message))return 'The agent needs more public devnet SOL for this action and network fees.';if(/already in progress|-32002/i.test(message))return 'Solana is processing another transaction. Wait a moment, then retry.';return 'Auto-shield could not finish. You can retry or use the manual controls.'};
const isSignature=(value:unknown):value is string=>typeof value==='string'&&/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(value);
export async function autoShieldSnapshot(owner:string,policy?:AutoShieldPolicy){await ensureSchema();const rows=await db()`SELECT stage,action,signature,amount,error,retry_required,updated_at FROM hosted_auto_shield_state WHERE owner=${owner}`;const row=rows[0];return {enabled:policy?.auto_shield_funds!==false,reserve_sol:policy?.auto_shield_reserve_sol||'0.005',stage:policy?.kill_switch?'stopped':policy?.auto_shield_funds===false?'off':row?.stage||'awaiting_funds',error:row?.error||undefined,retry_required:row?.retry_required===true,last_action:row?.action?{action:String(row.action),signature:row.signature||undefined,amount:row.amount||undefined,at:new Date(row.updated_at).toISOString()}:undefined}};
async function stage(owner:string,value:string,action?:string,signature?:string,amount?:string,error?:string,retry=false){await db()`INSERT INTO hosted_auto_shield_state(owner,stage,action,signature,amount,error,retry_required,updated_at) VALUES(${owner},${value},${action||null},${signature||null},${amount||null},${error||null},${retry},now()) ON CONFLICT(owner) DO UPDATE SET stage=EXCLUDED.stage,action=COALESCE(EXCLUDED.action,hosted_auto_shield_state.action),signature=COALESCE(EXCLUDED.signature,hosted_auto_shield_state.signature),amount=COALESCE(EXCLUDED.amount,hosted_auto_shield_state.amount),error=EXCLUDED.error,retry_required=EXCLUDED.retry_required,updated_at=now()`}
async function event(owner:string,action:string,signature?:string,amount?:string){await db()`INSERT INTO hosted_auto_shield_events(id,owner,action,signature,amount) VALUES(${randomUUID()},${owner},${action},${signature||null},${amount||null})`}
export async function autoShield(owner:string,{retry=false}:{retry?:boolean}={}){
 await ensureSchema();let account=await getOwner(owner);if(!account)throw new Error('HOSTED_OWNER_NOT_FOUND');let policy=account.policy as AutoShieldPolicy;
 if(policy.auto_shield_funds===false||policy.kill_switch||policy.read_only)return autoShieldSnapshot(owner,policy);
 const token=randomUUID();const claimed=await db()`INSERT INTO hosted_auto_shield_locks(owner,token,expires_at) VALUES(${owner},${token},now()+interval '90 seconds') ON CONFLICT(owner) DO UPDATE SET token=EXCLUDED.token,expires_at=EXCLUDED.expires_at WHERE hosted_auto_shield_locks.expires_at<now() RETURNING token`;
 if(!claimed[0])return autoShieldSnapshot(owner,policy);
 try{
  account=await getOwner(owner);if(!account)throw new Error('HOSTED_OWNER_NOT_FOUND');policy=account.policy as AutoShieldPolicy;
  if(policy.auto_shield_funds===false||policy.kill_switch||policy.read_only)return autoShieldSnapshot(owner,policy);
  const previous=await autoShieldSnapshot(owner,policy);if(previous.retry_required&&!retry)return previous;if(retry&&previous.retry_required&&previous.last_action?.action==='auto_deposit'&&previous.last_action.signature){try{await withOwner(owner,async()=>{await balances()});await stage(owner,'shielded','auto_deposit',previous.last_action.signature,previous.last_action.amount);return autoShieldSnapshot(owner,policy)}catch{}}if(!retry&&['registering','depositing','syncing'].includes(previous.stage)){await stage(owner,'error',undefined,undefined,undefined,'An earlier auto-shield action needs review. Check activity, then retry if funds remain public.',true);return autoShieldSnapshot(owner,policy)}
  await withOwner(owner,async()=>{
   let info=await walletInfo(),publicLamports=BigInt(info.public_lamports);
   if(!info.registered){if(planAutoShield(publicLamports,policy.auto_shield_reserve_sol||'0.005',false).action==='await_funds'){await stage(owner,'awaiting_funds');return}await stage(owner,'registering');const result=await registerWallet();const signature='signature' in result&&isSignature(result.signature)?result.signature:undefined;await event(owner,'register_private_wallet',signature);await stage(owner,'registered','register_private_wallet',signature);info=await walletInfo();publicLamports=BigInt(info.public_lamports)}
   const plan=planAutoShield(publicLamports,policy.auto_shield_reserve_sol||'0.005',true);
   if(plan.action!=='deposit'){if(previous.stage!=='shielded')await stage(owner,'awaiting_funds');return}
   const fresh=await getOwner(owner);if(!fresh||((fresh.policy as AutoShieldPolicy).kill_switch)||((fresh.policy as AutoShieldPolicy).auto_shield_funds===false))return;
   await stage(owner,'depositing');const value=plan.amountSol,result=await deposit('SOL',value,undefined,undefined,true);await event(owner,'auto_deposit',result.signature,value);await stage(owner,'syncing','auto_deposit',result.signature,value);await balances();await stage(owner,'shielded','auto_deposit',result.signature,value);
  });
 }catch(error){await stage(owner,'error',undefined,undefined,undefined,readable(error),true)}finally{await db()`DELETE FROM hosted_auto_shield_locks WHERE owner=${owner} AND token=${token}`}
 return autoShieldSnapshot(owner,policy);
}
export async function autoShieldEvents(owner:string){await ensureSchema();return db()`SELECT action,signature,amount,created_at FROM hosted_auto_shield_events WHERE owner=${owner} ORDER BY created_at DESC LIMIT 50`}
