import type { NextConfig } from 'next';
const config: NextConfig = { reactStrictMode: true, serverExternalPackages: ['ringside-mcp', '@heliuslabs/zolana', '@lightprotocol/hasher.rs'], async headers() { return [{ source: '/connect', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }] }, { source: '/oauth/authorize', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }] }]; } };
export default config;
