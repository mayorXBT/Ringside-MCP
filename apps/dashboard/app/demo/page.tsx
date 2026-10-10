import type { Metadata } from 'next';
import DemoClient from './demo-client';
export const metadata: Metadata = { title: 'Guided demo · Ringside', description: 'Private payments for agents. Controls for owners. Run a browser-signed devnet transfer and withdrawal; seller verification checks the real payment.' };
export default function DemoPage() { return <DemoClient/>; }
