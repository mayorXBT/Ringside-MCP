'use client';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function LandingReveals({children}:{children:React.ReactNode}) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((section) => {
      const inner = section.querySelector('.landing-container');
      if (!inner) return;
      gsap.from(inner, { autoAlpha: 0, y: 8, duration: .32, ease: 'power2.out', clearProps: 'all', scrollTrigger: { trigger: section, start: 'top 88%', once: true } });
    });
  }, { scope: root });
  return <div ref={root}>{children}</div>;
}
