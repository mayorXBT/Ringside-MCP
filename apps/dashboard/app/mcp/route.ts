import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createRingsideServer } from 'ringside-mcp/server';
import { bearerOwner,issuer,problem } from '@/lib/hosted/http';
import { withOwner } from '@/lib/hosted/service';
export const runtime='nodejs';
export const maxDuration=60;
async function handle(request:Request){const owner=await bearerOwner(request).catch(()=>undefined);if(!owner){const response=problem(401,'invalid_token','Connect your owner wallet to authorize Ringside.');response.headers.set('WWW-Authenticate',`Bearer resource_metadata="${issuer}/.well-known/oauth-protected-resource/mcp"`);return response}if(request.method==='GET')return new Response(null,{status:405,headers:{Allow:'POST, DELETE'}});try{return await withOwner(owner,async()=>{const server:McpServer=createRingsideServer();const transport=new WebStandardStreamableHTTPServerTransport({enableJsonResponse:true});await server.connect(transport);try{return await transport.handleRequest(request)}finally{await server.close()}})}catch(error){return problem(503,'temporarily_unavailable',error instanceof Error&&error.message.startsWith('HOSTED_')?error.message:'Hosted MCP request failed')}}
export const POST=handle;
export const GET=handle;
export const DELETE=handle;
