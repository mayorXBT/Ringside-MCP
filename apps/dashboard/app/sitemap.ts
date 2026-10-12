import type { MetadataRoute } from 'next';
const base=process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://ringside.ghoste.trade';
export default function sitemap(): MetadataRoute.Sitemap { return ['/', '/docs', '/demo', '/brand', '/onboard'].map((path,index)=>({url:`${base}${path}`,changeFrequency:index===0?'weekly':'monthly',priority:index===0?1:0.7})); }
