import type { NextConfig } from 'next';
const config: NextConfig = { reactStrictMode: true, serverExternalPackages: ['ringside-mcp', '@heliuslabs/zolana', '@lightprotocol/hasher.rs'] };
export default config;
