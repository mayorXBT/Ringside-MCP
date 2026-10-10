import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', allow: ['/', '/docs', '/demo', '/brand', '/onboard'], disallow: ['/app', '/api', '/oauth', '/mcp', '/connect', '/audit'] }, sitemap: 'https://ringside-dashboard.vercel.app/sitemap.xml' }; }
