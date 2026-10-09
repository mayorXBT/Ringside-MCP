import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...values: ClassValue[]) => twMerge(clsx(values));
export const shortAddress = (value?: string) => value ? `${value.slice(0, 4)}…${value.slice(-4)}` : '—';
export const explorerTx = (signature: string, network?: string) => `https://explorer.solana.com/tx/${signature}?cluster=${network === 'localnet' ? 'custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899' : 'devnet'}`;
export const explorerAddress = (address: string, network?: string) => `https://explorer.solana.com/address/${address}?cluster=${network === 'localnet' ? 'custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899' : 'devnet'}`;
