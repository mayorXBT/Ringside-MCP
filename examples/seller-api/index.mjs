import { createServer } from 'node:http';
import { createPaymentRequest, verifyPayment } from 'ringside-mcp/seller';

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' || request.url !== '/report') {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const header = request.headers['x-payment'];
    if (typeof header === 'string') {
      let proof;
      try { proof = JSON.parse(Buffer.from(header, 'base64').toString('utf8')); }
      catch { response.writeHead(400).end('Invalid X-PAYMENT'); return; }
      if (typeof proof.signature !== 'string' || typeof proof.nonce !== 'string' || typeof proof.payer !== 'string') {
        response.writeHead(400).end('Invalid X-PAYMENT'); return;
      }
      const verdict = await verifyPayment(proof.signature, proof.nonce, proof.payer);
      if (verdict.valid) {
        response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ report: 'Premium market report', payment: verdict }));
        return;
      }
      response.writeHead(402, { 'content-type': 'application/json' }).end(JSON.stringify(verdict));
      return;
    }
    const asset = process.env.RINGSIDE_SELLER_ASSET || 'SOL';
    const amount = process.env.RINGSIDE_SELLER_AMOUNT || '0.01';
    const { request: payment } = await createPaymentRequest(asset, amount, '/report');
    response.writeHead(402, { 'content-type': 'application/json' }).end(JSON.stringify(payment));
  } catch (error) {
    response.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ error: error instanceof Error ? error.message.replace(/api-key=[^&\s]+/gi, 'api-key=[redacted]') : 'Server error' }));
  }
});

server.listen(8787, '127.0.0.1', () => console.log('Seller API listening on http://127.0.0.1:8787/report'));
