export const runtime = 'nodejs';

type Point = { at: number; usd: number };
const valid = (at: number, usd: number): Point | null =>
  Number.isFinite(at) && Number.isFinite(usd) && at > 0 && usd > 0 ? { at, usd } : null;

async function coingecko(): Promise<{ points: Point[]; source: string }> {
  const response = await fetch('https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=1', {
    signal: AbortSignal.timeout(6000), next: { revalidate: 300 }
  });
  if (!response.ok) throw new Error('CoinGecko unavailable');
  const body = await response.json() as { prices?: [number, number][] };
  const points = (body.prices || []).map(([at, usd]) => valid(at, usd)).filter((point): point is Point => point !== null);
  if (points.length < 2) throw new Error('SOL price history unavailable');
  return { points, source: 'CoinGecko' };
}

async function coinbase(): Promise<{ points: Point[]; source: string }> {
  const response = await fetch('https://api.exchange.coinbase.com/products/SOL-USD/candles?granularity=300', {
    signal: AbortSignal.timeout(6000), next: { revalidate: 300 }
  });
  if (!response.ok) throw new Error('Coinbase unavailable');
  const candles = await response.json() as [number, number, number, number, number, number][];
  if (!Array.isArray(candles)) throw new Error('SOL price history unavailable');
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const points = candles.map(([time, , , , close]) => valid(time * 1000, close))
    .filter((point): point is Point => point !== null && point.at >= cutoff).sort((a, b) => a.at - b.at);
  if (points.length < 2) throw new Error('SOL price history unavailable');
  return { points, source: 'Coinbase' };
}

export async function GET() {
  try {
    const { points, source } = await coingecko().catch(() => coinbase());
    return Response.json({ symbol: 'SOL/USD', period: '24h', source, points }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' }
    });
  } catch {
    return Response.json({ error: 'SOL price chart temporarily unavailable' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' }
    });
  }
}
