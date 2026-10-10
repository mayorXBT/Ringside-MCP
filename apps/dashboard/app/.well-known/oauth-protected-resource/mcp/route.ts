import { issuer } from '@/lib/hosted/http';
export function GET(){return Response.json({resource:`${issuer}/mcp`,authorization_servers:[issuer],scopes_supported:['ringside:read','ringside:spend'],bearer_methods_supported:['header']},{headers:{'Cache-Control':'public, max-age=3600'}})}
