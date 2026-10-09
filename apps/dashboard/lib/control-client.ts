'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export type Policy = {
  kill_switch: boolean;
  read_only: boolean;
  assets: Record<string, { max_per_tx: string; max_per_session: string; max_per_day: string }>;
  asset_allowlist: string[];
  recipient_allowlist: string[];
  allowlist_mode: 'off' | 'enforce';
  allow_withdrawal_fallback: boolean;
  [key: string]: unknown;
};
export type Status = {
  solana_address: string; shielded_address: string; registered: boolean;
  public_sol_balance: string; network: string; owner_pubkey?: string;
  policy_version?: number; policy: Policy;
  budget?: { spent_today: string; spent_session: string; max_per_day: string; max_per_session: string } | null;
};
export type Balance = { asset: string; amount: string; amount_base_units: string; utxos: number };
export type Activity = { signature: string; slot: string; kind: string; direction: string; asset: string; amount: string; amount_base_units: string };
export type AgentState = 'unpaired' | 'connecting' | 'online' | 'offline' | 'unauthorized';

export const defaultControlUrl = process.env.NEXT_PUBLIC_DEFAULT_CONTROL_URL || 'http://127.0.0.1:7420';
const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}` : JSON.stringify(value);
const toBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));

async function controlRequest<T>(url: string, token: string, path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/$/, '')}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init?.headers } });
  } catch { throw new Error('AGENT_OFFLINE'); }
  let body: Record<string, unknown> = {};
  try { body = await response.json(); } catch { /* The HTTP status remains actionable. */ }
  if (!response.ok) throw new Error(response.status === 401 ? 'PAIRING_REJECTED' : String(body.error || `HTTP ${response.status}`));
  return body as T;
}

export function useRingside(viewOnly = false) {
  const wallet = useWallet();
  const prefix = viewOnly ? 'ringside-audit' : 'ringside';
  const [url, setUrl] = useState(defaultControlUrl);
  const [token, setToken] = useState('');
  const [agentState, setAgentState] = useState<AgentState>('unpaired');
  const [status, setStatus] = useState<Status | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [sseLive, setSseLive] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem(`${prefix}-control-url`) || defaultControlUrl;
    const savedToken = localStorage.getItem(`${prefix}-pair-token`) || '';
    setUrl(savedUrl); setToken(savedToken);
    if (savedToken) setAgentState('connecting');
  }, [prefix]);

  const request = useCallback(<T,>(path: string, init?: RequestInit) => controlRequest<T>(url, token, path, init), [url, token]);
  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [nextStatus, nextBalances, nextActivity] = await Promise.all([
        request<Status>('/v1/status'), request<{ balances: Balance[] }>('/v1/balances'), request<{ transactions: Activity[] }>('/v1/activity'),
      ]);
      setStatus(nextStatus); setBalances(nextBalances.balances || []); setActivity(nextActivity.transactions || []);
      setLastSynced(Date.now()); setAgentState('online'); setError('');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'AGENT_OFFLINE';
      setError(message); setAgentState(message === 'PAIRING_REJECTED' ? 'unauthorized' : 'offline');
    }
  }, [request, token]);

  useEffect(() => { void refresh(); const timer = setInterval(() => { void refresh(); }, 5000); return () => clearInterval(timer); }, [refresh]);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`${url.replace(/\/$/, '')}/v1/events`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (!response.ok || !response.body) return;
        setSseLive(true);
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n'); buffer = parts.pop() || '';
          if (parts.some((part) => part.startsWith('data: '))) void refresh();
        }
      } catch { /* Polling remains active. */ } finally { setSseLive(false); }
    })();
    return () => controller.abort();
  }, [token, url, refresh]);

  const pair = useCallback(async (nextUrl: string, nextToken: string) => {
    setAgentState('connecting'); setError('');
    try {
      const nextStatus = await controlRequest<Status>(nextUrl, nextToken, '/v1/status');
      localStorage.setItem(`${prefix}-control-url`, nextUrl); localStorage.setItem(`${prefix}-pair-token`, nextToken);
      setUrl(nextUrl); setToken(nextToken); setStatus(nextStatus); setAgentState('online');
      return nextStatus;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'AGENT_OFFLINE';
      setError(message); setAgentState(message === 'PAIRING_REJECTED' ? 'unauthorized' : 'offline');
      throw cause;
    }
  }, [prefix]);
  const disconnect = useCallback(() => {
    localStorage.removeItem(`${prefix}-control-url`); localStorage.removeItem(`${prefix}-pair-token`);
    setToken(''); setStatus(null); setBalances([]); setActivity([]); setAgentState('unpaired'); setError(''); setSseLive(false);
  }, [prefix]);
  const ownerReady = !viewOnly && !!wallet.publicKey && wallet.publicKey.toBase58() === status?.owner_pubkey && !!wallet.signMessage;
  const signAndPost = useCallback(async <T,>(action: 'policy' | 'kill' | 'deposit' | 'withdraw', payload: unknown, path: string, body: Record<string, unknown>) => {
    if (!ownerReady || !wallet.signMessage) throw new Error('Connect the configured owner wallet to sign changes');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(payload)));
    const envelope = { action, payload_sha256: Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(''), nonce: Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join(''), issued_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString() };
    const signature = toBase64(await wallet.signMessage(new TextEncoder().encode(`ringside-mcp:v1:${canonical(envelope)}`)));
    const result = await request<T>(path, { method: 'POST', body: JSON.stringify({ ...body, envelope, signature }) });
    await refresh();
    return result;
  }, [ownerReady, wallet, request, refresh]);
  return { url, token, status, balances, activity, agentState, error, lastSynced, sseLive, wallet, ownerReady, pair, disconnect, refresh, request, signAndPost };
}

export type RingsideState = ReturnType<typeof useRingside>;
