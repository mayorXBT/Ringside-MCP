'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { Brand } from '@/components/ringside/shell';

type FlowDetails = { client_name: string; authorize_url: string };
const messageFor = (code: string) => {
  if (code === 'invalid_flow') return 'This connector sign-in link has expired or was already used. Retry, or start the connection again in ChatGPT.';
  if (code === 'invalid_signature') return 'Phantom could not verify this sign-in. Please sign the new message and retry.';
  if (code === 'temporarily_unavailable') return 'Sign-in is temporarily unavailable. Please try again.';
  return 'Sign-in did not finish. Please try again.';
};

function ConnectInner() {
  const wallet = useWallet();
  const params = useSearchParams();
  const flow = params.get('flow');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [client, setClient] = useState('');
  const [authorizeUrl, setAuthorizeUrl] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [openInPhantom, setOpenInPhantom] = useState('');
  const [returnUrl, setReturnUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const loadFlow = useCallback(async () => {
    if (!flow) return;
    try {
      const response = await fetch(`/api/hosted/flow?id=${encodeURIComponent(flow)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).error || 'invalid_flow');
      const details = await response.json() as FlowDetails;
      setClient(details.client_name);
      setAuthorizeUrl(details.authorize_url);
      setError('');
    } catch (cause) {
      setError(messageFor(cause instanceof Error ? cause.message : 'invalid_flow'));
    }
  }, [flow]);

  useEffect(() => {
    fetch('/api/hosted/readiness').then(r => r.json()).then(v => setAvailable(v.available === true)).catch(() => setAvailable(false));
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobile);
    const injected = Boolean((window as Window & { phantom?: { solana?: { isPhantom?: boolean } }; solana?: { isPhantom?: boolean } }).phantom?.solana?.isPhantom || (window as Window & { solana?: { isPhantom?: boolean } }).solana?.isPhantom);
    if (mobile && !injected) {
      setOpenInPhantom('pending');
    }
  }, []);
  useEffect(() => { void loadFlow(); }, [loadFlow]);
  useEffect(() => {
    if (!isMobile || !openInPhantom) return;
    const target = authorizeUrl || window.location.href;
    setOpenInPhantom(`https://phantom.app/ul/browse/${encodeURIComponent(target)}?ref=${encodeURIComponent(window.location.origin)}`);
  // Rebuild only when the server supplies the signed authorization URL.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorizeUrl, isMobile]);

  async function signIn() {
    if (!wallet.publicKey || !wallet.signMessage) { setError('Connect Phantom first, then sign the login message.'); return; }
    if (flow && !authorizeUrl) { setError(messageFor('invalid_flow')); return; }
    setBusy(true);
    setError('');
    try {
      const challenge = await fetch('/api/hosted/challenge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ flow_id: flow }) });
      const body = await challenge.json();
      if (!challenge.ok) throw new Error(body.error);
      const signature = await wallet.signMessage(new TextEncoder().encode(body.message));
      const response = await fetch('/api/hosted/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ owner: wallet.publicKey.toBase58(), signature: btoa(Array.from(signature, byte => String.fromCharCode(byte)).join('')), challenge_id: body.challenge_id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (flow && isMobile) {
        setReturnUrl(result.redirect);
        // Keep the callback visible in case the mobile OS does not hand it to the connector.
        window.open(result.redirect, '_blank', 'noopener,noreferrer');
      } else window.location.assign(result.redirect);
    } catch (cause) { setError(messageFor(cause instanceof Error ? cause.message : 'unknown')); }
    finally { setBusy(false); }
  }

  async function connectOrSignIn() {
    try {
      if (!wallet.wallet) {
        const phantom = wallet.wallets.find(w => w.adapter.name === 'Phantom');
        if (!phantom) { setError('Phantom is not available in this browser. Open this page in Phantom to continue.'); return; }
        wallet.select(phantom.adapter.name);
      } else if (!wallet.connected) await wallet.connect();
      else await signIn();
    } catch { setError('Phantom could not connect. Please try again.'); }
  }

  return <main className="hosted-connect"><Brand/><div className="hosted-connect-card">
    <div className="zero-eyebrow">/ HOSTED DEVNET</div>
    <h1>Connect your owner wallet.</h1>
    <p>Sign a message with Phantom to create your private agent wallet. No transaction is sent by signing in.</p>
    {flow && <p className="hosted-consent">Authorize <strong>{client || 'your connector'}</strong> to read balances and request devnet payments within your spending policy.</p>}
    <div className="hosted-custody">Ringside holds the agent key encrypted on its server. Give this agent only capped devnet funds: 0.05 SOL per payment and 0.2 SOL per day. Your owner wallet can stop spending.</div>
    {returnUrl ? <div role="status"><p>Sign-in complete. If you are still here, return to {client || 'your connector'} with the same authorization link.</p><a className="zero-pill black" href={returnUrl}>Return to {client || 'connector'}</a></div> : <>
      {openInPhantom ? <a className="zero-pill black" href={openInPhantom}>Open in Phantom</a> : <button className="zero-pill black" disabled={busy || available !== true || Boolean(flow && !authorizeUrl)} onClick={connectOrSignIn}>{busy ? 'Signing in…' : !wallet.connected ? 'Connect Phantom' : 'Sign in with Solana'}</button>}
    </>}
    {available === false && <p role="status">Hosted signup is temporarily unavailable.</p>}
    {error && <div role="alert"><p>{error}</p><button className="zero-pill" onClick={() => { setError(''); void loadFlow(); }}>Retry</button></div>}
  </div></main>;
}

export default function Connect() { return <Suspense fallback={<main className="hosted-connect">Loading…</main>}><ConnectInner/></Suspense>; }
