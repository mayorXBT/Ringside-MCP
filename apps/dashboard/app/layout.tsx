import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Instrument_Serif } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const instrument = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], variable: '--font-instrument' });
export const metadata: Metadata = { title: 'Ringside · Private agent payments', description: 'Private payments for agents. Controls for owners. Solana devnet beta.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${instrument.variable}`}><body><Providers>{children}</Providers></body></html>; }
