# Contributing to TeleBotHost MCP

Thanks for your interest in improving this project! 🚀

## Development Setup

```bash
git clone https://github.com/sahilxteam/telebothost-mcp.git
cd telebothost-mcp
npm install
cp .env.example .env  # fill in your TELEBOTHOST_API_KEY
```

## Project Structure

```
bin/
  mcp.ts       → stdio MCP server entry point (primary)
  mcp.js       → shim that loads tsx and runs mcp.ts
lib/
  client.ts    → TeleBotHost API client (auth, retry, binary, errors)
  tools.ts     → All 48 MCP tool definitions
  types.ts     → Shared TypeScript types
  docs.ts      → HTML docs page generator (for HTTP mode)
server.ts      → HTTP server (optional, self-hosting only)
scripts/
  test-mcp.sh  → Compliance test suite
```

## Architecture: Why stdio?

The TeleBotHost API is behind Cloudflare bot detection, which blocks datacenter IPs. Running locally via stdio uses the user's residential IP — Cloudflare allows it. This is also the standard MCP pattern.

- **Primary mode: stdio** (`bin/mcp.ts`) — for Claude Desktop, Cursor, VS Code
- **Secondary mode: HTTP** (`server.ts`) — for self-hosting on residential IP only

## Adding a New Tool

1. Open `lib/tools.ts`
2. Add a new `ToolDef` object to the appropriate group array
3. Use short snake_case names (no prefix), clear description, JSON-Schema input
4. Run `npm run typecheck` to verify
5. Test locally: `npm start` then send JSON-RPC via stdin

```typescript
{
  name: "your_new_tool",
  description: "What it does, clearly.",
  inputSchema: {
    type: "object",
    properties: { /* ... */ },
    required: ["param1"],
  },
  handler: async (a, c) => json((await c.get("/your/endpoint")).data),
}
```

## Guidelines

- **Naming**: Short snake_case names, no prefix (e.g. `get_bot`, `start_broadcast`)
- **Descriptions**: First line = one-sentence summary. Add ⚠️ for dangerous ops
- **Errors**: Let `TbhApiError` bubble up — the handler converts it to a clean MCP error
- **Types**: Strict mode is on. No `any` (except the handler return type, which is intentional)
- **Tests**: Run `npm test` before submitting. Add new tool names to `REQUIRED_TOOLS` in `scripts/test-mcp.sh` if critical

## Submitting Changes

1. Fork → branch → commit
2. Open a PR with a clear description of what & why
3. Make sure `npm run typecheck` and `npm test` pass

## Reporting Issues

Use [GitHub Issues](https://github.com/sahilxteam/telebothost-mcp/issues) with:
- What you expected
- What happened
- How you're running the server (stdio / HTTP / which client)
- Redacted error output
