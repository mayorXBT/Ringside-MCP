const key = process.env.HELIUS_API_KEY;
if (!key) throw new Error('HELIUS_API_KEY is required');
const endpoint = `https://devnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`;
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getVersion' }),
});
if (!response.ok) throw new Error(`Helius RPC HTTP ${response.status}`);
const result = await response.json();
if (result.error || !result.result?.['solana-core']) throw new Error('Helius RPC version check failed');
console.log(`Helius devnet RPC ready: Solana ${result.result['solana-core']}`);
