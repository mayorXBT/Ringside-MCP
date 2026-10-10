import 'server-only';
import { createHmac } from 'node:crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { db } from '@/lib/hosted/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 30;
const headers = { 'Cache-Control': 'no-store' };
const input = z.object({ recipient: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/) });

export async function POST(request: Request) {
  try {
    if (!process.env.HELIUS_API_KEY || !process.env.RINGSIDE_DEMO_TREASURY_KEYPAIR || !process.env.RINGSIDE_HOSTED_SECRET || !process.env.DATABASE_URL)
      return Response.json({ error: 'Demo funding is unavailable. Retry later.' }, { status: 503, headers });
    const ip = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    if (!ip) return Response.json({ error: 'Could not identify this request for rate limiting.' }, { status: 400, headers });
    const { recipient } = input.parse(await request.json());
    const destination = new PublicKey(recipient);
    if (!PublicKey.isOnCurve(destination)) return Response.json({ error: 'Use a regular browser burner wallet address.' }, { status: 400, headers });
    const secret: unknown = JSON.parse(process.env.RINGSIDE_DEMO_TREASURY_KEYPAIR);
    if (!Array.isArray(secret) || secret.length !== 64 || secret.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) throw new Error('Invalid treasury configuration');
    const treasury = Keypair.fromSecretKey(Uint8Array.from(secret));
    const rpc = new Connection(`https://devnet.helius-rpc.com/?api-key=${encodeURIComponent(process.env.HELIUS_API_KEY)}`, 'confirmed');
    if (await rpc.getBalance(treasury.publicKey, 'confirmed') < 25_000_000) return Response.json({ error: 'Demo treasury is empty. Retry later.' }, { status: 503, headers });
    const day = new Date().toISOString().slice(0, 10);
    const claim = createHmac('sha256', process.env.RINGSIDE_HOSTED_SECRET).update(`${day}:${ip}`).digest('hex');
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS demo_faucet_claims (claim_key text PRIMARY KEY, recipient text UNIQUE NOT NULL, signature text, created_at timestamptz NOT NULL DEFAULT now())`;
    const reserved = await sql`INSERT INTO demo_faucet_claims(claim_key,recipient) VALUES(${claim},${recipient}) ON CONFLICT DO NOTHING RETURNING claim_key`;
    if (!reserved[0]) return Response.json({ error: 'Demo funding is limited to one 0.02 SOL transfer per IP per day and one per burner address.' }, { status: 429, headers });
    try {
      const { blockhash, lastValidBlockHeight } = await rpc.getLatestBlockhash('confirmed');
      const tx = new Transaction({ feePayer: treasury.publicKey, recentBlockhash: blockhash }).add(SystemProgram.transfer({ fromPubkey: treasury.publicKey, toPubkey: destination, lamports: 20_000_000 }));
      tx.sign(treasury);
      const signature = await rpc.sendRawTransaction(tx.serialize(), { preflightCommitment: 'confirmed' });
      await sql`UPDATE demo_faucet_claims SET signature=${signature} WHERE claim_key=${claim}`;
      const result = await rpc.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      if (result.value.err) throw new Error('Devnet rejected the funding transaction');
      return Response.json({ signature, amount: '0.02', explorer_url: `https://explorer.solana.com/tx/${signature}?cluster=devnet` }, { headers });
    } catch {
      return Response.json({ error: 'Funding may still be confirming. Refresh the burner balance before requesting again.' }, { status: 503, headers });
    }
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: 'Enter a valid burner wallet address.' }, { status: 400, headers });
    return Response.json({ error: 'Demo funding is temporarily unavailable. Retry later.' }, { status: 503, headers });
  }
}
