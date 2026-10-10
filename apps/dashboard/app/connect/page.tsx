import { headers } from 'next/headers';
import ConnectClient from './connect-client';

export default async function Connect() {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent') || '';
  const mobileHint = /Android|iPhone|iPad|iPod/i.test(userAgent) || requestHeaders.get('sec-ch-ua-mobile') === '?1' || /Android|iOS/i.test(requestHeaders.get('sec-ch-ua-platform') || '');
  return <ConnectClient mobileHint={mobileHint} />;
}
