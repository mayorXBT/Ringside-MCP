export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [response, indexer] = await Promise.all([
      fetch('https://d21ni15goiip6l.cloudfront.net/health', { cache: 'no-store', signal: AbortSignal.timeout(8000) }),
      fetch('https://d2xah7tnhdhcom.cloudfront.net', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'demo-health', method: 'getShieldedTransactionsBySignature', params: { txSignature: '5p4d4f5C73H7peAJa5TE6i8vRLd3nysS31ehwb9gotSFQvkPso6aTw5hZeMgWb6TkzGKwKJSeLxXPSw358CUntaB' } }), cache: 'no-store', signal: AbortSignal.timeout(8000) }),
    ]);
    if (!response.ok || !indexer.ok) throw new Error('Privacy service unavailable');
    const data: unknown = await response.json();
    const indexerData: unknown = await indexer.json();
    const keys = typeof data === 'object' && data !== null && 'keys' in data && Array.isArray(data.keys) ? data.keys : [];
    const indexerReady = typeof indexerData === 'object' && indexerData !== null && 'result' in indexerData && typeof indexerData.result === 'object' && indexerData.result !== null && 'transactions' in indexerData.result && Array.isArray(indexerData.result.transactions) && indexerData.result.transactions.length > 0;
    const transferReady = keys.includes('transfer_confidential_1_2') && indexerReady;
    return Response.json({ transferReady, checkedAt: new Date().toISOString(), reason: transferReady ? null : 'The devnet prover or indexer did not pass the Zolana 0.4 transfer check.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ transferReady: false, checkedAt: new Date().toISOString(), reason: 'The devnet prover or indexer is unavailable.' }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
