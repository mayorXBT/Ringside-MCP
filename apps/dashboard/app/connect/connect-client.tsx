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

function ConnectInner({ mobileHint }: { mobileHint: boolean }) {
  const wallet = useWallet();
  const params = useSearchParams();
  const flow = params.get('flow');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [client, setClient] = useState('');
  const [authorizeUrl, setAuthorizeUrl] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [hasInjectedPhantom, setHasInjectedPhantom] = useState(false);
  const [forcePhantomLink, setForcePhantomLink] = useState(false);
  const [returnUrl, setReturnUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [handoffReady, setHandoffReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(mobileHint);
  const [isMobileOS, setIsMobileOS] = useState(mobileHint);

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
    const agentData = (navigator as Navigator & { userAgentData?: { mobile?: boolean; platform?: string } }).userAgentData;
    const mobileOS = mobileHint || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      /Android|iOS/i.test(agentData?.platform || '') ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsMobileOS(mobileOS);
    setIsMobile(mobileOS || (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches));
    setHasInjectedPhantom(Boolean((window as Window & { phantom?: { solana?: unknown } }).phantom?.solana));
    setCurrentUrl(window.location.href);
  }, [mobileHint]);
  useEffect(() => { void loadFlow(); }, [loadFlow]);
  useEffect(() => {
    if (!flow || hasInjectedPhantom || !currentUrl || returnUrl) return;
    let stopped = false;
    async function checkHandoff() {
      try {
        const response = await fetch(`/api/hosted/handoff?flow=${encodeURIComponent(flow!)}`, { cache: 'no-store' });
        if (!response.ok) return;
        const result = await response.json() as { status: string; redirect?: string };
        if (!stopped && result.status === 'ready' && result.redirect) {
          setHandoffReady(true);
          window.location.assign(result.redirect);
        }
      } catch { /* The next poll retries a transient network failure. */ }
    }
    void checkHandoff();
    const timer = window.setInterval(() => { void checkHandoff(); }, 1500);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [flow, hasInjectedPhantom, currentUrl, returnUrl]);
  const showPhantomLink = (isMobile && !hasInjectedPhantom) || forcePhantomLink;
  const phantomTarget = authorizeUrl || currentUrl;
  const phantomLink = phantomTarget && currentUrl
    ? `https://phantom.app/ul/browse/${encodeURIComponent(phantomTarget)}?ref=${encodeURIComponent(new URL(currentUrl).origin)}`
    : '';

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
      if (flow && isMobileOS) {
        setReturnUrl(result.redirect);
        // The original Chrome tab completes the OAuth callback through the handoff poll.
      } else window.location.replace(result.redirect);
    } catch (cause) { setError(messageFor(cause instanceof Error ? cause.message : 'unknown')); }
    finally { setBusy(false); }
  }

  async function connectOrSignIn() {
    try {
      if (!wallet.wallet) {
        const phantom = wallet.wallets.find(w => w.adapter.name === 'Phantom');
        if (!phantom) { if (isMobile) setForcePhantomLink(true); setError('Phantom is not available in this browser. Open this page in Phantom to continue.'); return; }
        wallet.select(phantom.adapter.name);
      } else if (!wallet.connected) await wallet.connect();
      else await signIn();
    } catch {
      if (isMobile) setForcePhantomLink(true);
      setError(isMobile ? 'Phantom could not connect in this browser. Open this page in Phantom to continue.' : 'Phantom could not connect. Please try again.');
    }
  }

  return <main className="hosted-connect"><Brand/><div className="hosted-connect-card">
    <div className="zero-eyebrow">/ HOSTED DEVNET</div>
    <h1>Connect your owner wallet.</h1>
    <p>Sign a message with Phantom to create your private agent wallet. No transaction is sent by signing in.</p>
    {flow && <p className="hosted-consent">Authorize <strong>{client || 'your connector'}</strong> to read balances and request devnet payments within your spending policy.</p>}
    <div className="hosted-custody">Ringside holds the agent key encrypted on its server. Give this agent only capped devnet funds: 0.05 SOL per payment and 0.2 SOL per day. Your owner wallet can stop spending.</div>
    {returnUrl ? <div role="status"><p>Signed in. Return to your original Chrome tab. It will finish connecting {client || 'your connector'} automatically.</p><p>If that tab cannot finish, copy this one-time completion link and paste it into Chrome within five minutes.</p><button className="zero-pill black" onClick={async () => { await navigator.clipboard.writeText(returnUrl); setCopied(true); }}>{copied ? 'Copied completion link' : 'Copy completion link'}</button></div> : <>
      {showPhantomLink ? <a className="zero-pill black" href={phantomLink || undefined} aria-disabled={!phantomLink || Boolean(flow && !authorizeUrl)} onClick={event => { if (!phantomLink || (flow && !authorizeUrl)) event.preventDefault(); }}>Open in Phantom</a> : <button className="zero-pill black" disabled={busy || available !== true || Boolean(flow && !authorizeUrl)} onClick={connectOrSignIn}>{busy ? 'Signing in…' : !wallet.connected ? 'Connect Phantom' : 'Sign in with Solana'}</button>}
    </>}
    {handoffReady && <p role="status">Sign-in complete. Returning to {client || 'your connector'} in this Chrome tab…</p>}
    {flow && showPhantomLink && !returnUrl && <p role="status">Keep this Chrome tab open. After signing in Phantom, come back here to finish connecting {client || 'your connector'}.</p>}
    {available === false && <p role="status">Hosted signup is temporarily unavailable.</p>}
    {error && <div role="alert"><p>{error}</p><button className="zero-pill" onClick={() => { setError(''); void loadFlow(); }}>Retry</button></div>}
  </div></main>;
}

export default function ConnectClient({ mobileHint }: { mobileHint: boolean }) { return <Suspense fallback={<main className="hosted-connect">Loading…</main>}><ConnectInner mobileHint={mobileHint}/></Suspense>; }
