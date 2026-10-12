export const runtime = 'nodejs';

async function coingecko() {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_last_updated_at=true', { signal: AbortSignal.timeout(5000), next: { revalidate: 300 } });
  if (!response.ok) throw new Error('CoinGecko unavailable');
  const body = await response.json() as { solana?: { usd?: number; last_updated_at?: number } };
  const price = body.solana?.usd;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) throw new Error('Invalid SOL price');
  return { usd_price: price, as_of: body.solana?.last_updated_at ? new Date(body.solana.last_updated_at * 1000).toISOString() : new Date().toISOString(), source: 'CoinGecko' };
}

async function coinbase() {
  const response = await fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot', { signal: AbortSignal.timeout(5000), next: { revalidate: 300 } });
  if (!response.ok) throw new Error('Coinbase unavailable');
  const body = await response.json() as { data?: { amount?: string } };
  const price = Number(body.data?.amount);
  if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid SOL price');
  return { usd_price: price, as_of: new Date().toISOString(), source: 'Coinbase' };
}

export async function GET() {
  try {
    const quote = await coingecko().catch(() => coinbase());
    return Response.json({ symbol: 'SOL', ...quote }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } });
  } catch {
    return Response.json({ error: 'USD price temporarily unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
