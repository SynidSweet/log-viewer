"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastmcp_1 = require("fastmcp");
const zod_1 = require("zod");
const server = new fastmcp_1.FastMCP({
    name: 'Minimal Test Server',
    version: '1.0.0',
});
server.addTool({
    name: 'hello',
    description: 'Say hello',
    parameters: zod_1.z.object({
        name: zod_1.z.string().describe('Name to greet')
    }),
    execute: async ({ name }) => {
        return `Hello, ${name}!`;
    }
});
console.log('Starting minimal MCP server...');
server.start({
    transportType: 'stdio'
}).catch(console.error);
//# sourceMappingURL=minimal-test.js.map