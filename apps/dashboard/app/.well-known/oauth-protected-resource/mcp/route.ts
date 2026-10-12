import { requestOrigin } from '@/lib/hosted/origin';
export function GET(request:Request){const issuer=requestOrigin(request);return Response.json({resource:`${issuer}/mcp`,authorization_servers:[issuer],scopes_supported:['ringside:read','ringside:spend'],bearer_methods_supported:['header']},{headers:{'Cache-Control':'no-store'}})}
