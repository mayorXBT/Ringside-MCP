'use client';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { RotateCcw, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger, TextPlugin);

const command = '> private_transfer { to: "79AR…Er9J", amount: "0.003", asset: "SOL" }';
const checks = ['✓ policy ok · 0.003 / 0.05 SOL per tx', '✓ sent privately · sig 52yc…H1a9'];

export function LandingReveals({children}:{children:React.ReactNode}) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sections = gsap.utils.toArray<HTMLElement>('[data-reveal]');
    sections.forEach((section) => {
      const inner = section.querySelector('.landing-container');
      if (!inner) return;
      gsap.from(inner, { autoAlpha: 0, y: 8, duration: .32, ease: 'power2.out', clearProps: 'all', scrollTrigger: { trigger: section, start: 'top 88%', once: true } });
    });
  }, { scope: root });
  return <div ref={root}>{children}</div>;
}

export function HeroDemo() {
  const root = useRef<HTMLDivElement>(null);
  const line1 = useRef<HTMLDivElement>(null);
  const line2 = useRef<HTMLDivElement>(null);
  const line3 = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline|null>(null);
  const { contextSafe } = useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      if (line1.current) line1.current.textContent = command;
      if (line2.current) line2.current.textContent = checks[0];
      if (line3.current) line3.current.textContent = checks[1];
      return;
    }
    gsap.from('[data-hero-card]', { autoAlpha: 0, y: 8, duration: .32, ease: 'power2.out', clearProps: 'all' });
    gsap.from('[data-terminal]', { autoAlpha: 0, y: 8, duration: .32, delay: .12, ease: 'power2.out', clearProps: 'all' });
    const trigger = ScrollTrigger.create({trigger:root.current,start:'top 85%',once:true,onEnter:()=>play()});
    return () => { trigger.kill(); timeline.current?.kill(); };
  }, {scope:root});
  const play = contextSafe(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timeline.current?.kill();
    [line1,line2,line3].forEach(line=>{if(line.current)line.current.textContent=''});
    timeline.current=gsap.timeline();
    timeline.current.to(line1.current,{text:command,duration:command.length*.018,ease:'none'})
      .to(line2.current,{text:checks[0],duration:checks[0].length*.018,ease:'none'},'+=.4')
      .to(line3.current,{text:checks[1],duration:checks[1].length*.018,ease:'none'},'+=.4');
  });
  return <div className="hero-visual" ref={root}>
    <div className="card balance-card hero-balance" data-hero-card><div style={{display:'flex',gap:8,alignItems:'center',color:'var(--private)'}}><ShieldCheck size={18}/>Private balance</div><div className="badge private" style={{margin:'16px 0'}}>Amount hidden on-chain</div><div className="balance-figure">0.051 <span style={{fontSize:24,color:'var(--fg-muted)'}}>SOL</span></div><div className="metric-row" style={{marginTop:20}}><span>TEST</span><span className="mono">1.3 · 2 notes</span></div></div>
    <div className="code-block hero-terminal" data-terminal><div style={{display:'flex',justifyContent:'space-between',gap:10}}><span className="subtle-text">MCP exchange · illustrative</span><button className="replay-button" onClick={play} aria-label="Replay payment example"><RotateCcw size={13}/> Replay</button></div><div ref={line1} style={{minHeight:20}}/><div ref={line2} style={{color:'var(--success)',minHeight:20}}/><div ref={line3} style={{color:'var(--private)',minHeight:20}}/></div>
    <div className="card hero-explorer"><div className="subtle-text" style={{marginBottom:10}}>ON THE EXPLORER</div><span className="mono">From 4Hk2… · To 79AR…</span><br/><span className="badge private" style={{marginTop:8}}>Amount •••• · Asset ••••</span></div>
  </div>;
}
