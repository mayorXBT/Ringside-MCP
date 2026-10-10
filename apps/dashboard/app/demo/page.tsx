import type { Metadata } from 'next';
import DemoClient from './demo-client';
export const metadata: Metadata = { title: 'Guided demo · Ringside', description: 'Try a guided private agent payment and see owner policy, seller verification, and on-chain visibility.' };
export default function DemoPage() { return <DemoClient/>; }
