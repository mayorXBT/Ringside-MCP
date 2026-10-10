import 'server-only';

export const runtime = 'nodejs';
export const maxDuration = 30;

const methods = new Set([
  'getAccountInfo', 'getBalance', 'getBlockHeight', 'getEpochInfo', 'getFeeForMessage',
  'getGenesisHash', 'getLatestBlockhash', 'getMinimumBalanceForRentExemption',
  'getMultipleAccounts', 'getProgramAccounts', 'getRecentPrioritizationFees',
  'getSignatureStatuses', 'getSlot', 'getTokenAccountBalance', 'getTokenAccountsByOwner',
  'getTransaction', 'getVersion', 'sendTransaction', 'simulateTransaction',
]);
const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type RpcCall = { jsonrpc: '2.0'; id: string | number; method: string; params?: unknown[] };
function validCall(value: unknown): value is RpcCall {
  return typeof value === 'object' && value !== null &&
    (value as RpcCall).jsonrpc === '2.0' &&
    ['string', 'number'].includes(typeof (value as RpcCall).id) &&
    methods.has((value as RpcCall).method) &&
    ((value as RpcCall).params === undefined || Array.isArray((value as RpcCall).params));
}

export async function POST(request: Request) {
  const key = process.env.HELIUS_API_KEY;
  if (!key) return Response.json({ error: 'Devnet RPC is not configured.' }, { status: 503, headers });
  const raw = await request.text();
  if (raw.length > 64_000) return Response.json({ error: 'RPC request is too large.' }, { status: 413, headers });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: 'Invalid RPC JSON.' }, { status: 400, headers }); }
  if (!(Array.isArray(body) ? body.length > 0 && body.length <= 10 && body.every(validCall) : validCall(body)))
    return Response.json({ error: 'RPC method is not available through the demo proxy.' }, { status: 400, headers });
  const endpoint = `https://devnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const upstream = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw, cache: 'no-store', signal: AbortSignal.timeout(9000) });
      const result = await upstream.text();
      if ([429, 500, 502, 503, 504].includes(upstream.status) && attempt < 2) { await wait(250 * 2 ** attempt); continue; }
      return new Response(result, { status: upstream.status, headers });
    } catch {
      if (attempt < 2) { await wait(250 * 2 ** attempt); continue; }
    }
  }
  return Response.json({ jsonrpc: '2.0', id: Array.isArray(body) ? null : (body as RpcCall).id, error: { code: -32005, message: 'Devnet RPC is temporarily unavailable. Retry shortly.' } }, { status: 503, headers });
}
