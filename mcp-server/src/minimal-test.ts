import { FastMCP } from 'fastmcp';
import { z } from 'zod';

const server = new FastMCP({
  name: 'Minimal Test Server',
  version: '1.0.0',
});

server.addTool({
  name: 'hello',
  description: 'Say hello',
  parameters: z.object({
    name: z.string().describe('Name to greet')
  }),
  execute: async ({ name }) => {
    return `Hello, ${name}!`;
  }
});

console.log('Starting minimal MCP server...');
server.start({
  transportType: 'stdio'
}).catch(console.error);