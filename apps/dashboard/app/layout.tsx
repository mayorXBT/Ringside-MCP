import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = { metadataBase: new URL('https://ringside-dashboard.vercel.app'), title: 'Ringside | Private Payments for AI Agents', description: 'Private payments for agents. Controls for owners. Give an AI agent a test budget, set wallet-approved limits, and see a real payment on Solana devnet.', applicationName: 'Ringside', icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico' }], apple: '/apple-icon.png' }, openGraph: { title: 'Ringside | Private Payments for AI Agents', description: 'Private payments for agents. Controls for owners. Give an AI agent a test budget, set wallet-approved limits, and see a real payment on Solana devnet.', type: 'website', images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Ringside private payments and owner controls' }] }, twitter: { card: 'summary_large_image', title: 'Ringside | Private Payments for AI Agents', description: 'Private payments for agents. Controls for owners. Give an AI agent a test budget, set wallet-approved limits, and see a real payment on Solana devnet.', images: ['/opengraph-image.png'] } };
export const viewport: Viewport = { themeColor: '#F4F5F8' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}><body><Providers>{children}</Providers></body></html>; }
