/**
 * TeleBotHost MCP Server — stdio transport entry point.
 *
 * This is the PRIMARY way to run the MCP server. It uses the stdio transport
 * (stdin/stdout) which is the standard MCP pattern for local AI clients
 * (Claude Desktop, Cursor, VS Code with Cline/Continue).
 *
 * Why stdio instead of HTTP?
 *   The TeleBotHost API is behind Cloudflare bot detection, which blocks
 *   requests from datacenter IPs (Vercel, Render, Railway, Fly, AWS, etc.).
 *   Running locally on the user's machine uses their residential IP, which
 *   Cloudflare allows. This is also the standard MCP deployment pattern.
 *
 * Usage:
 *   - Direct:    node --import tsx bin/mcp.ts
 *   - Via npx:   npx telebothost-mcp
 *   - Via bin:   telebothost-mcp (after npm install -g)
 *
 * The TBH API key is read from the TELEBOTHOST_API_KEY environment variable.
 * Set it in your MCP client config (Claude Desktop / Cursor / VS Code).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { TbhClient } from "../lib/client.js";
import { TbhApiError } from "../lib/types.js";
import { allTools } from "../lib/tools.js";

const SERVER_NAME = "telebothost-mcp";
const SERVER_VERSION = "1.4.0";
const PROTOCOL_VERSION = "2024-11-05";

// ---------------------------------------------------------------------------
// Create MCP server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } },
);

// --- ListTools ---
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

// --- CallTool ---
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = allTools.find((t) => t.name === name);
  if (!tool) {
    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  // stdio mode: single-user, key from env var (set in client config)
  const client = new TbhClient();
  try {
    return await tool.handler(args ?? {}, client);
  } catch (err) {
    if (err instanceof TbhApiError) {
      const detail = err.data ? `\n${JSON.stringify(err.data, null, 2)}` : "";
      return {
        content: [
          {
            type: "text" as const,
            text: `TeleBotHost API error ${err.status}: ${err.message}${detail}`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Connect via stdio
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);

// Log to stderr (stdout is reserved for JSON-RPC messages)
console.error(`[${SERVER_NAME} v${SERVER_VERSION}] MCP server running on stdio`);
console.error(`  Tools: ${allTools.length} (100% API coverage)`);
if (process.env.TELEBOTHOST_API_KEY) {
  const key = process.env.TELEBOTHOST_API_KEY;
  const masked = key.substring(0, 6) + "..." + key.substring(key.length - 4);
  console.error(`  API key: ${masked}`);
} else {
  console.error("  ⚠️  TELEBOTHOST_API_KEY not set.");
  console.error("     Set it in your MCP client config (env field).");
  console.error("     Get your key from: https://telebothost.com → Developer Settings → API Keys");
}
