import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = { metadataBase: new URL('https://ringside-dashboard.vercel.app'), title: 'Ringside · Private agent payments', description: 'Private payments for agents. Controls for owners. Solana devnet beta.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}><body><Providers>{children}</Providers></body></html>; }
