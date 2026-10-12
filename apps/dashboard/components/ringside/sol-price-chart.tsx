'use client';
import { useCallback, useEffect, useState } from 'react';

type Point = { at: number; usd: number };
type ChartData = { points: Point[]; source: string };

export function SolPriceChart() {
  const [chart, setChart] = useState<ChartData | null>(null);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/market/sol-chart', { cache: 'no-store' });
      if (!response.ok) throw new Error('Price history unavailable');
      const data = await response.json() as ChartData;
      if (!Array.isArray(data.points) || data.points.length < 2) throw new Error('Price history unavailable');
      setChart(data);
      setError(false);
    } catch { setError(true); }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 300000);
    return () => clearInterval(timer);
  }, [refresh]);

  const points = chart?.points || [];
  const first = points[0]?.usd || 0;
  const latest = points.at(-1)?.usd || 0;
  const change = first ? (latest / first - 1) * 100 : 0;
  const min = Math.min(...points.map(point => point.usd));
  const max = Math.max(...points.map(point => point.usd));
  const range = max - min || 1;
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${(index / (points.length - 1)) * 300} ${100 - ((point.usd - min) / range) * 82 - 9}`).join(' ');
  return <section className="rs-sol-chart" aria-label="SOL to USD market price over the past 24 hours">
    <div className="rs-sol-chart-top"><span>SOL / USD <small>24H</small></span>{chart&&<strong>${latest.toFixed(2)}</strong>}</div>
    {chart ? <><svg viewBox="0 0 300 110" role="img" aria-label={`SOL price moved ${change.toFixed(2)} percent in the past 24 hours`} preserveAspectRatio="none"><path d={path} fill="none" stroke={change>=0?'#4ADE80':'#F87171'} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="rs-sol-chart-foot"><span className={change>=0?'up':'down'}>{change>=0?'+':''}{change.toFixed(2)}% today</span><span>{chart.source} · updates every 5 min</span></div></> : <div className="rs-sol-chart-empty">{error?<>Price chart unavailable <button onClick={()=>void refresh()}>Retry</button></>:'Loading SOL price chart…'}</div>}
  </section>;
}
