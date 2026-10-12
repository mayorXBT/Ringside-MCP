import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', allow: ['/', '/docs', '/demo', '/brand', '/onboard'], disallow: ['/app', '/api', '/oauth', '/mcp', '/connect', '/audit'] }, sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://ringside.ghoste.trade'}/sitemap.xml` }; }
