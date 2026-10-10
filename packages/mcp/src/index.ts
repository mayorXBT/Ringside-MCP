#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { runCli } from './cli.js';
import { startControlServer } from './control.js';
import { createRingsideServer } from './server.js';
if (process.argv.length > 2) { await runCli(process.argv.slice(2)); process.exit(0); }
const server=createRingsideServer();
await server.connect(new StdioServerTransport());
startControlServer();
