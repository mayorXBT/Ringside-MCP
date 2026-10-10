'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
export function DocsCopy({ text }: { text: string }) { const [copied, setCopied] = useState(false); return <button type="button" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }} aria-label={copied ? 'Copied' : 'Copy code'}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? 'Copied' : 'Copy'}</button>; }
