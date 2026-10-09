'use client';
import { useCallback, useEffect, useState } from 'react';

type Balance = { asset: string; amount: string; utxos: number };
type Activity = { signature: string; kind: string; direction: string; asset: string; amount: string };

export default function AuditPage() {
  const [url, setUrl] = useState('http://127.0.0.1:7420');
  const [token, setToken] = useState('');
  const [wallet, setWallet] = useState('');
  const [balances, setBalances] = useState<Balance[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const refresh = useCallback(async () => {
    if (!connected || !token) return;
    try {
      const get = async (path: string) => {
        const response = await fetch(`${url.replace(/\/$/, '')}${path}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error(`Control API returned ${response.status}`);
        return response.json();
      };
      const [status, balanceBody, activityBody] = await Promise.all([get('/v1/status'), get('/v1/balances'), get('/v1/activity')]);
      setWallet(status.solana_address); setBalances(balanceBody.balances || []); setActivity(activityBody.transactions || []); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Audit connection failed'); }
  }, [connected, token, url]);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 5000); return () => clearInterval(timer); }, [refresh]);
  return <main className="shell">
    <header className="top"><div><div className="brand">Ringside <span className="badge">VIEW ONLY</span></div><div className="sub">Local auditor view · balances and history refresh every five seconds</div></div><a href="/">Owner dashboard</a></header>
    <section className="card"><h2>Connect to a local agent</h2><p className="muted">Use a pairing token from the agent machine. This page can read balances and history; it has no policy or payment controls.</p><div className="grid"><label>Control API URL<input value={url} onChange={(event) => setUrl(event.target.value)} /></label><label>Pairing token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} /></label></div><button onClick={() => { setConnected(true); void refresh(); }}>Connect</button></section>
    {error && <p className="error" role="alert">{error}</p>}
    <section className="card"><h2>Agent</h2><div className="mono">{wallet || 'Not connected'}</div></section>
    <section className="card"><h2>Private balances</h2>{balances.length ? balances.map((entry) => <div className="row" key={entry.asset}><span>{entry.asset}</span><strong>{entry.amount}</strong><span>{entry.utxos} notes</span></div>) : <p className="muted">No balances available.</p>}</section>
    <section className="card"><h2>Private history</h2>{activity.length ? activity.map((entry) => <div className="row" key={`${entry.signature}-${entry.kind}`}><span>{entry.kind} · {entry.direction}</span><strong>{entry.amount} {entry.asset}</strong><span className="mono">{entry.signature.slice(0, 8)}…</span></div>) : <p className="muted">No history available.</p>}</section>
  </main>;
}
