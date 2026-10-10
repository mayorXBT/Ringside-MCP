import 'server-only';
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export const randomToken=()=>randomBytes(32).toString('base64url');
export const sha256=(value:string)=>createHash('sha256').update(value).digest('base64url');
function perUserKey(owner:string){const secret=process.env.RINGSIDE_HOSTED_SECRET;if(!secret||secret.length<32)throw new Error('HOSTED_NOT_CONFIGURED: encryption secret is required');return Buffer.from(hkdfSync('sha256',Buffer.from(secret,'base64url'),Buffer.from(owner),Buffer.from('ringside-hosted-agent-v1'),32))}
export function createAgent(owner:string){const pair=nacl.sign.keyPair();const publicKey=bs58.encode(pair.publicKey);const iv=randomBytes(12),key=perUserKey(owner),cipher=createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([cipher.update(pair.secretKey),cipher.final()]);const tag=cipher.getAuthTag();pair.secretKey.fill(0);key.fill(0);return {publicKey,ciphertext:Buffer.concat([iv,tag,data]).toString('base64url')}}
export function decryptAgent(owner:string,ciphertext:string){const packed=Buffer.from(ciphertext,'base64url');if(packed.length<45)throw new Error('Invalid stored key');const key=perUserKey(owner),decipher=createDecipheriv('aes-256-gcm',key,packed.subarray(0,12));decipher.setAuthTag(packed.subarray(12,28));try{return Buffer.concat([decipher.update(packed.subarray(28)),decipher.final()])}finally{key.fill(0)}}
export function verifyWalletMessage(owner:string,message:string,signature:string){try{const key=bs58.decode(owner),sig=Buffer.from(signature,'base64');return key.length===32&&sig.length===64&&nacl.sign.detached.verify(new TextEncoder().encode(message),sig,key)}catch{return false}}
export function verifyChallenge(verifier:string,challenge:string){if(verifier.length<43||verifier.length>128||!/^[A-Za-z0-9._~-]+$/.test(verifier))return false;const got=Buffer.from(sha256(verifier));const expected=Buffer.from(challenge);return got.length===expected.length&&timingSafeEqual(got,expected)}
export const defaultPolicy={kill_switch:false,read_only:false,assets:{SOL:{max_per_tx:'0.05',max_per_session:'0.2',max_per_day:'0.2'}},asset_allowlist:['SOL'],recipient_allowlist:[],allowlist_mode:'off',allow_withdrawal_fallback:false};
