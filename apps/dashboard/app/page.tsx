'use client';
import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

type Status = { solana_address: string; shielded_address: string; registered: boolean; public_sol_balance: string; network: string; owner_pubkey?: string; policy_version?: number; policy: Record<string, unknown>; budget?: { spent_today: string; spent_session: string; max_per_day: string; max_per_session: string } | null };
type Balance = { asset: string; amount: string; amount_base_units: string; utxos: number };
type Activity = { signature: string; slot: string; kind: string; direction: string; asset: string; amount: string; amount_base_units: string };
const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}` : JSON.stringify(value);
const toBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));

export default function Home() {
  const wallet = useWallet();
  const [url, setUrl] = useState(process.env.NEXT_PUBLIC_DEFAULT_CONTROL_URL || 'http://127.0.0.1:7420');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [tab, setTab] = useState<'overview' | 'activity' | 'policy'>('overview');
  const [policyText, setPolicyText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [walletAsset, setWalletAsset] = useState('SOL');
  const [walletAmount, setWalletAmount] = useState('0.01');
  const [withdrawRecipient, setWithdrawRecipient] = useState('');

  useEffect(() => { setUrl(localStorage.getItem('ringside-control-url') || url); setToken(localStorage.getItem('ringside-pair-token') || ''); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const request = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(`${url.replace(/\/$/, '')}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init?.headers } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
    return body;
  }, [url, token]);
  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [nextStatus, nextBalances, nextActivity] = await Promise.all([request('/v1/status'), request('/v1/balances'), request('/v1/activity')]);
      setStatus(nextStatus); setBalances(nextBalances.balances || []); setActivity(nextActivity.transactions || []); setError('');
      setPolicyText((old) => old || JSON.stringify(nextStatus.policy, null, 2));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Connection failed'); }
  }, [request, token]);
  useEffect(() => { void refresh(); const timer = setInterval(() => { void refresh(); }, 5000); return () => clearInterval(timer); }, [refresh]);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`${url.replace(/\/$/, '')}/v1/events`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (!response.ok || !response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          if (parts.some((part) => part.startsWith('data: '))) void refresh();
        }
      } catch { /* The five-second poll remains active if SSE disconnects. */ }
    })();
    return () => controller.abort();
  }, [token, url, refresh]);
  const pair = () => { localStorage.setItem('ringside-control-url', url); localStorage.setItem('ringside-pair-token', token); void refresh(); };
  const ownerReady = !!wallet.publicKey && wallet.publicKey.toBase58() === status?.owner_pubkey && !!wallet.signMessage;
  const signedWrite = async (action: 'policy' | 'kill' | 'deposit' | 'withdraw', payload: unknown, path: string, body: Record<string, unknown>) => {
    if (!ownerReady || !wallet.signMessage) throw new Error('Connect the configured owner wallet to sign changes');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(payload)));
    const envelope = { action, payload_sha256: Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(''), nonce: Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join(''), issued_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString() };
    const signature = toBase64(await wallet.signMessage(new TextEncoder().encode(`ringside-mcp:v1:${canonical(envelope)}`)));
    await request(path, { method: 'POST', body: JSON.stringify({ ...body, envelope, signature }) });
    await refresh();
  };
  const savePolicy = async () => {
    try {
      const policy = JSON.parse(policyText);
      if (!window.confirm(`Sign this policy change?\n\n${JSON.stringify(policy, null, 2)}`)) return;
      setBusy(true); await signedWrite('policy', policy, '/v1/policy', { policy });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Policy update failed'); } finally { setBusy(false); }
  };
  const toggleKill = async () => {
    try { setBusy(true); const on = status?.policy.kill_switch !== true; await signedWrite('kill', { on }, '/v1/kill', { on }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Kill switch update failed'); } finally { setBusy(false); }
  };
  const moveFunds = async (action: 'deposit' | 'withdraw') => {
    try {
      if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(walletAmount) || Number(walletAmount) <= 0) throw new Error('Enter a positive amount');
      const payload = { asset: walletAsset.trim(), amount: walletAmount, ...(action === 'withdraw' && withdrawRecipient.trim() ? { recipient: withdrawRecipient.trim() } : {}) };
      if (!window.confirm(`Sign ${action} of ${payload.amount} ${payload.asset}${'recipient' in payload ? ` to ${payload.recipient}` : ''}?`)) return;
      setBusy(true);
      await signedWrite(action, payload, `/v1/wallet/${action}`, payload);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Wallet action failed'); } finally { setBusy(false); }
  };
  return <main className="shell">
    <header className="top"><div><div className="brand">Ringside <span className="badge">DEVNET · BETA</span></div><div className="sub">Private payments for agents. Controls for owners.</div></div><div className="topright"><a href="/audit">Auditor view</a><span className={status ? 'success' : 'error'}>{status ? '● Agent connected' : '● Agent offline'}</span><button onClick={() => wallet.connected ? void wallet.disconnect() : wallet.wallet ? void wallet.connect() : wallet.wallets[0] && wallet.select(wallet.wallets[0].adapter.name)}>{wallet.connected ? `${wallet.publicKey?.toBase58().slice(0, 4)}…${wallet.publicKey?.toBase58().slice(-4)} · Disconnect` : wallet.wallet ? 'Connect owner wallet' : 'Select Phantom wallet'}</button></div></header>
    <section className="card"><h2>Pair with local agent</h2><div className="grid"><label>Control API URL<input value={url} onChange={(event) => setUrl(event.target.value)} /></label><label>Pairing token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} /></label></div><p className="muted">Run <span className="mono">ringside-mcp pair</span> on the agent machine to get the token.</p><button onClick={pair}>Pair and refresh</button></section>
    {error && <p className="error" role="alert">{error}</p>}
    <nav className="tabs">{(['overview', 'activity', 'policy'] as const).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
    {tab === 'overview' && <><div className="grid"><div className="card"><div className="label">Agent wallet</div><div className="mono">{status?.solana_address || '—'}</div><p className="muted">{status?.registered ? 'Private wallet registered' : 'Registration pending'}</p></div><div className="card"><div className="label">Public SOL</div><div className="metric">{status?.public_sol_balance || '—'}</div></div><div className="card"><div className="label">Kill switch</div><div className="metric">{status?.policy.kill_switch ? 'ON' : 'OFF'}</div><button className="danger" disabled={!ownerReady || busy} onClick={() => void toggleKill()}>{status?.policy.kill_switch ? 'Resume spending' : 'Stop spending'}</button></div></div><div className="grid">{status?.budget && <><div className="card"><div className="label">Spent today · SOL</div><div className="metric">{status.budget.spent_today} / {status.budget.max_per_day}</div><progress value={Number(status.budget.spent_today)} max={Number(status.budget.max_per_day)} /></div><div className="card"><div className="label">Spent this session · SOL</div><div className="metric">{status.budget.spent_session} / {status.budget.max_per_session}</div><progress value={Number(status.budget.spent_session)} max={Number(status.budget.max_per_session)} /></div></>}</div><section className="card"><h2>Private balances</h2>{balances.length ? balances.map((balance) => <div className="row" key={balance.asset}><span>{balance.asset}</span><strong>{balance.amount}</strong><span className="muted">{balance.utxos} notes</span></div>) : <p className="muted">No private balance yet.</p>}</section><section className="card"><h2>Deposit or withdraw</h2><p className="muted">Deposits and withdrawals are public on-chain. The owner wallet must sign each action; the agent wallet pays fees and holds the funds.</p><div className="grid"><label>Asset<input value={walletAsset} onChange={(event) => setWalletAsset(event.target.value)} /></label><label>Amount<input inputMode="decimal" value={walletAmount} onChange={(event) => setWalletAmount(event.target.value)} /></label><label>Withdraw to (optional)<input value={withdrawRecipient} onChange={(event) => setWithdrawRecipient(event.target.value)} placeholder="Agent address by default" /></label></div><div className="row"><button disabled={!ownerReady || busy} onClick={() => void moveFunds('deposit')}>Sign deposit</button><button disabled={!ownerReady || busy} onClick={() => void moveFunds('withdraw')}>Sign withdrawal</button></div></section></>}
    {tab === 'activity' && <section className="card"><h2>Private activity</h2><p className="muted">Amounts below are decrypted locally by the agent. Public explorer transactions do not show private transfer amounts.</p><ul className="activity">{activity.map((entry) => <li key={`${entry.signature}-${entry.slot}-${entry.kind}`}><span><strong>{entry.kind}</strong> · {entry.direction}<br /><span className="mono">{entry.amount} {entry.asset}</span></span><a target="_blank" rel="noreferrer" href={`https://explorer.solana.com/tx/${entry.signature}?cluster=devnet`}>Explorer ↗</a></li>)}</ul>{!activity.length && <p className="muted">No private transactions found.</p>}</section>}
    {tab === 'policy' && <section className="card"><div className="row"><h2>Owner policy</h2><span className="muted">Version {status?.policy_version || '—'}</span></div><p className="muted">Only the configured owner wallet can sign and apply changes. The next agent request uses the new policy.</p><textarea value={policyText} onChange={(event) => setPolicyText(event.target.value)} spellCheck={false} /><p><button disabled={!ownerReady || busy} onClick={() => void savePolicy()}>Review and sign policy</button></p>{wallet.connected && !ownerReady && <p className="error">The connected wallet is not this agent&apos;s owner.</p>}</section>}
  </main>;
}
