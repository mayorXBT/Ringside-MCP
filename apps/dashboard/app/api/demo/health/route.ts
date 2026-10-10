export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch('https://d21ni15goiip6l.cloudfront.net/health', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Prover returned HTTP ${response.status}`);
    const data: unknown = await response.json();
    const keys = typeof data === 'object' && data !== null && 'keys' in data && Array.isArray(data.keys) ? data.keys : [];
    const transferReady = keys.includes('transfer_confidential_2_3');
    return Response.json({ transferReady, checkedAt: new Date().toISOString(), reason: transferReady ? null : 'The devnet prover has no key mapping for the transfer shape required by the last live run (2 inputs, 3 outputs).' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ transferReady: false, checkedAt: new Date().toISOString(), reason: 'The devnet prover health check is unavailable.' }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
