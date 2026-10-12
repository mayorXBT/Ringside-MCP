export const canonicalOrigin = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://ringside.ghoste.trade').replace(/\/$/, '');
export const legacyOrigin = 'https://ringside-dashboard.vercel.app';

export function requestOrigin(request: Request): string {
  const host = request.headers.get('host')?.toLowerCase();
  if (host === new URL(canonicalOrigin).host) return canonicalOrigin;
  if (host === new URL(legacyOrigin).host) return legacyOrigin;
  const origin = new URL(request.url).origin;
  if (origin === canonicalOrigin || origin === legacyOrigin) return origin;
  if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return canonicalOrigin;
}
