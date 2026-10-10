'use client';
import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

export default function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return <ConnectionProvider endpoint={typeof window === 'undefined' ? 'http://localhost:3000/api/demo/rpc' : `${window.location.origin}/api/demo/rpc`}><WalletProvider wallets={wallets} autoConnect>{children}</WalletProvider></ConnectionProvider>;
}
