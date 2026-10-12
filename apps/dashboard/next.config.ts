import type { NextConfig } from 'next';
const legacyPage = (source: string) => ({ source, has: [{ type: 'host' as const, value: 'ringside-dashboard.vercel.app' }], destination: `https://ringside.ghoste.trade${source}`, permanent: true });
const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['ringside-mcp', '@heliuslabs/zolana', '@lightprotocol/hasher.rs'],
  async redirects() { return ['/', '/app', '/app/:path*', '/demo', '/docs', '/onboard'].map(legacyPage); },
  async headers() { return [{ source: '/connect', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }] }, { source: '/oauth/authorize', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }] }]; }
};
export default config;
