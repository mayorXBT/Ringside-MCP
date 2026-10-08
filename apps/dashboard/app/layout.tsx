import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = { title: 'Ringside | Private agent payments', description: 'Owner dashboard for Solana devnet agent payments' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Providers>{children}</Providers></body></html>; }
