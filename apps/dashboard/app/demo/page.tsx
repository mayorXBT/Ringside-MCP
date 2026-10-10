import type { Metadata } from 'next';
import DemoClient from './demo-client';
export const metadata: Metadata = { title: 'Guided demo · Ringside', description: 'Private payments for agents. Controls for owners. Try the guided payment scenario with clearly labelled demo data.' };
export default function DemoPage() { return <DemoClient/>; }
