'use client';
import { useEffect, useRef, useState } from 'react';
import { animate, inView, stagger, useInView, useMotionValue, useReducedMotion } from 'framer-motion';

export function LandingReveals({children}:{children:React.ReactNode}) {
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!root.current||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const seen=new WeakSet<Element>();
    const stops=Array.from(root.current.querySelectorAll<HTMLElement>('[data-reveal]')).map(section=>inView(section,()=>{
      if(seen.has(section))return;seen.add(section);section.classList.add('is-in-view');
      const nodes=Array.from(section.querySelectorAll<HTMLElement>(':scope > .landing-container > *'));
      animate(nodes,{opacity:[0.82,1],y:[12,0]},{duration:.4,delay:stagger(.065),ease:'easeOut'});
    },{amount:.12}));
    return()=>stops.forEach(stop=>stop());
  },[]);
  return <div ref={root}>{children}</div>;
}
export function CountUp({to,suffix='',decimals=0}:{to:number;suffix?:string;decimals?:number}){
  const ref=useRef<HTMLElement>(null),seen=useInView(ref,{once:true,amount:.5}),reduced=useReducedMotion(),value=useMotionValue(0),[shown,setShown]=useState(to);
  useEffect(()=>{if(!seen||reduced){if(reduced)setShown(to);return}setShown(0);value.set(0);const unsub=value.on('change',v=>setShown(v));const control=animate(value,to,{duration:.8,ease:'easeOut'});return()=>{unsub();control.stop()}},[seen,reduced,to,value]);
  return <span ref={ref}>{shown.toFixed(decimals)}{suffix}</span>;
}
export function TypedCall({text,complete='✓ sent privately'}:{text:string;complete?:string}){
  const ref=useRef<HTMLDivElement>(null),seen=useInView(ref,{once:true,amount:.35}),reduced=useReducedMotion(),[count,setCount]=useState(0);
  useEffect(()=>{if(!seen)return;if(reduced){setCount(text.length);return}setCount(0);let n=0;const timer=window.setInterval(()=>{n=Math.min(text.length,n+3);setCount(n);if(n===text.length)window.clearInterval(timer)},24);return()=>window.clearInterval(timer)},[text,seen,reduced]);
  return <div ref={ref}><pre>{text.slice(0,count)}{seen&&count<text.length&&<span aria-hidden="true" className="type-cursor">▍</span>}</pre><div className="zero-typed-status" aria-live="polite">{seen&&count===text.length?complete:'Preparing private call'}</div></div>;
}
export function MaskedAmount(){const ref=useRef<HTMLSpanElement>(null),seen=useInView(ref,{once:true,amount:.1}),reduced=useReducedMotion(),[masked,setMasked]=useState(false);useEffect(()=>{if(!seen)return;if(reduced){setMasked(true);return}const timer=window.setTimeout(()=>setMasked(true),800);return()=>window.clearTimeout(timer)},[seen,reduced]);return <span ref={ref} className={`mask-amount ${masked?'is-masked':''}`} aria-label="Amount hidden">{masked?'••••':'0.003'}</span>}
