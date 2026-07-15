# TeleBotHost MCP Server

<div align="center">

**A production-ready [Model Context Protocol](https://modelcontextprotocol.io) server for the [TeleBotHost Developer API](https://telebothost.com).**

Runs **locally** via stdio — exposes **48 tools** covering **100% of the TeleBotHost Developer API** (47/47 endpoints) to any MCP-compatible AI client (Claude Desktop, Cursor, Continue, Cline, etc.).

[![MCP](https://img.shields.io/badge/MCP-2024--11--05-blue.svg)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933.svg)](https://nodejs.org/)
[![Coverage](https://img.shields.io/badge/API%20Coverage-100%25-brightgreen.svg)](#-api-coverage)
[![Tools](https://img.shields.io/badge/Tools-48-orange.svg)](#-available-tools-48)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Runtime: stdio](https://img.shields.io/badge/Runtime-stdio-9cf.svg)](#-why-local-stdio)

</div>

---

## ⚠️ Important: Why Local stdio (Not Cloud Hosted)

The TeleBotHost API is protected by **Cloudflare bot detection**, which blocks requests from datacenter IPs. This means:

| Platform | Works? | Why |
|----------|--------|-----|
| **Local stdio** (your machine) | ✅ **Yes** | Uses your residential IP — Cloudflare allows it |
| Vercel | ❌ No | Datacenter IP → Cloudflare 403 challenge |
| Render | ❌ No | AWS datacenter IP → Cloudflare 403 challenge |
| Railway | ❌ No | Datacenter IP → Cloudflare 403 challenge |
| Fly.io | ❌ No | Datacenter IP → Cloudflare 403 challenge |
| Self-hosted (home server) | ✅ Yes | Residential IP |

**This is why the server runs locally via stdio** — the standard MCP deployment pattern. Your AI client (Claude Desktop, Cursor) launches the server as a subprocess, and it makes API requests from your IP.

> 💡 **Advanced:** An HTTP server mode (`server.ts`) is included for self-hosting on residential connections. See [HTTP Server Mode](#-http-server-mode-optional) below.

---

## ✨ Features

- **🔧 48 Tools** — **100% coverage** of the TeleBotHost Developer API (47/47 endpoints + 1 quota helper)
- **🏠 Runs Locally** — stdio transport, uses your residential IP, no Cloudflare issues
- **🔐 Secure** — API key in env var (set in client config), never transmitted over network
- **⚡ Resilient** — Automatic 429 retry with exponential backoff, rate-limit header tracking
- **📦 Binary-Safe** — Base64-encoded ZIP download/upload for `download_bot` and `import_bot`
- **🛡️ Safe by Design** — Broadcast tool requires explicit `confirm: true` flag
- **🧪 Tested** — Compliance test suite verifies MCP spec adherence
- **🎯 Type-Safe** — Strict TypeScript throughout, clean compile
- **📦 Zero-Config Install** — Just `npx telebothost-mcp` or `npx github:sahilxteam/telebothost-mcp`

---

## 🚀 Quick Start

### 1. Get your TeleBotHost API key

1. Log in to [TeleBotHost](https://telebothost.com)
2. Go to **Developer Settings** → **API Keys**
3. Generate a key:
   - `sk_*` — **Secret key** (full write access) — keep private
   - `pub_*` — **Public key** (read-only) — safe for client-side

### 2. Add to your AI client

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "telebothost": {
      "command": "npx",
      "args": ["-y", "github:sahilxteam/telebothost-mcp"],
      "env": {
        "TELEBOTHOST_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

> **Note:** Replace `github:sahilxteam/telebothost-mcp` with `telebothost-mcp` once published to npm.

#### Cursor

Settings → MCP → Add Server:

```json
{
  "mcpServers": {
    "telebothost": {
      "command": "npx",
      "args": ["-y", "github:sahilxteam/telebothost-mcp"],
      "env": {
        "TELEBOTHOST_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

#### VS Code (with Cline / Continue)

Add to your MCP settings:

```json
{
  "mcp.servers": {
    "telebothost": {
      "command": "npx",
      "args": ["-y", "github:sahilxteam/telebothost-mcp"],
      "env": {
        "TELEBOTHOST_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

### 3. Restart & use

Restart your AI client. Try prompts like:
- "List my TeleBotHost bots"
- "Create a new command called /start on bot 12345"
- "Browse the community store and show me the top 5 bots"
- "What's my current API quota?"

---

## 📦 Alternative: Local Clone

If you prefer to clone the repo (for development or customization):

```bash
git clone https://github.com/sahilxteam/telebothost-mcp.git
cd telebothost-mcp
npm install
```

Then in your client config, point to the local clone:

```json
{
  "mcpServers": {
    "telebothost": {
      "command": "node",
      "args": ["--import", "tsx", "/absolute/path/to/telebothost-mcp/bin/mcp.ts"],
      "env": {
        "TELEBOTHOST_API_KEY": "sk_your_key_here"
      }
    }
  }
}
```

---

## 🛠️ Available Tools (48)

### 🩺 Health (1)

| Tool | Description |
|------|-------------|
| `get_status` | API health & version probe |

### 🌐 Public Discovery (8) — no auth required

| Tool | Description |
|------|-------------|
| `get_public_user` | Get a user's public profile |
| `list_public_user_bots` | List a user's published bots & templates |
| `get_public_user_bot` | Get a published bot by Telegram username |
| `get_public_user_bot_readme` | Get published bot README only |
| `list_templates` | Browse shareable bot templates |
| `get_template` | Get a template by ID |
| `get_template_readme` | Get template README |
| `list_public_store_bots` | Browse community store (public) |
| `get_public_store_bot` | Get a store listing (public) |

### 🤖 Bot Lifecycle (20) — `sk_*` key required for writes

| Tool | Description |
|------|-------------|
| `list_bots` | List your bots + statistics |
| `register_bot` | Register a new bot |
| `delete_bots` | Soft-delete bots (10-day backup) |
| `list_deleted_bots` | List soft-deleted bots |
| `recover_deleted_bot` | Recover a soft-deleted bot |
| `purge_deleted_bot` | Permanently delete from backup |
| `pin_bots` | Pin / unpin bots |
| `get_bot` | Get single bot details |
| `update_bot` | Update bot config |
| `export_bot` | Generate temp JWT download URL |
| `download_bot` | Download bot ZIP (base64-encoded binary) |
| `import_bot` | Import bot from base64-encoded ZIP |
| `clone_bot` | Clone a bot or template |
| `clone_bot_as_child` | Clone as child (inherits env/commands) |
| `list_bot_children` | List child bots of a parent |
| `transfer_bot` | Transfer bot to another user |
| `reset_bot` | Reset logs & sessions |
| `toggle_bot_template` | Toggle template status |
| `get_bot_readme` | Get bot README (owner) |
| `update_bot_readme` | Update README (template only) |

### 💾 Bot Storage (4)

| Tool | Description |
|------|-------------|
| `get_bot_storage_stats` | Sync/async storage size & metrics |
| `get_bot_storage_keys` | List storage keys (no values) |
| `clear_bot_storage` | Clear all storage (irreversible) |
| `migrate_bot_storage` | Migrate sync → async storage |

### 📢 Broadcasts (6)

| Tool | Description |
|------|-------------|
| `start_broadcast` | Start a broadcast (`confirm=true` required) |
| `get_broadcast_stats` | Real-time broadcast progress |
| `stop_broadcast` | Stop an active broadcast |
| `modify_broadcast` | Modify message body mid-run |
| `delete_broadcast` | Delete broadcast history record |
| `list_broadcasts` | List broadcasts for a bot |

### ⚡ Commands (5)

| Tool | Description |
|------|-------------|
| `list_commands` | List commands & folders |
| `create_command` | Create a new command |
| `delete_commands` | Batch delete commands |
| `list_deleted_commands` | List soft-deleted commands (7-day recovery) |
| `recover_deleted_command` | Recover a deleted command |

### 🛍️ Community Store (2)

| Tool | Description |
|------|-------------|
| `list_store_bots` | Browse store (authenticated) |
| `install_store_bot` | Install a store bot |

### 📊 Quota (1)

| Tool | Description |
|------|-------------|
| `get_quota` | Check daily / per-minute / monthly limits |

---

## 🔌 MCP Protocol

This server implements the [Model Context Protocol](https://modelcontextprotocol.io) **stdio transport** — the standard for local AI client integration.

### JSON-RPC 2.0 Methods Supported

| Method | Behavior |
|--------|----------|
| `initialize` | Returns `protocolVersion: 2024-11-05`, server capabilities, and server info |
| `notifications/initialized` | Acknowledged (no response) |
| `ping` | Returns empty `{result: {}}` — health check |
| `tools/list` | Returns all 48 tool definitions (name, description, inputSchema) |
| `tools/call` | Executes a tool by name with arguments; returns `{content, isError}` |

### Stdio Design

- The AI client launches the server as a subprocess
- Client writes JSON-RPC requests to the server's **stdin**
- Server writes JSON-RPC responses to **stdout**
- Server writes logs/diagnostics to **stderr**
- Single-user, single-session — no auth headers needed
- API key read from `TELEBOTHOST_API_KEY` env var (set in client config)

---

## 🚨 Error Handling

### Layer 1: Protocol Errors (JSON-RPC)

| Code | Meaning | When |
|------|---------|------|
| `-32700` | Parse error | Invalid JSON in request |
| `-32600` | Invalid Request | Missing `jsonrpc: "2.0"` or `method` |
| `-32601` | Method not found | Unknown JSON-RPC method |
| `-32602` | Invalid params | Unknown tool name |
| `-32603` | Internal error | Unexpected exception |

### Layer 2: Tool Errors (MCP `isError`)

When the upstream TBH API returns an error, the response includes `isError: true`:

```json
{
  "content": [{
    "type": "text",
    "text": "TeleBotHost API error 429: Rate limit exceeded. Retry after 60s."
  }],
  "isError": true
}
```

### Layer 3: Automatic Retry

HTTP 429 responses from the TBH API are automatically retried up to 3 times with exponential backoff (2s, 4s, 8s).

### Layer 4: Cloudflare Detection

If you accidentally run in a datacenter environment, the client detects Cloudflare challenge responses (HTTP 403 + `cf_chl` in body) and returns a clear error message instead of the raw HTML challenge page.

---

## 🧪 Testing

### Compliance Test Suite

```bash
# Test the stdio server
npm test

# Or test an HTTP deployment (advanced)
MCP_URL=http://localhost:3000/api/mcp bash scripts/test-mcp.sh
```

**What it verifies:**

1. `initialize` handshake returns correct protocol version & server info
2. `ping` returns a result
3. `tools/list` returns exactly 48 tools
4. All tools have `name` + `description` + `inputSchema`
5. All tools use clean names (no `telebothost_` prefix)
6. `tools/call` rejects unknown tools with error `-32602`
7. All required tools are present (10 critical tools checked)

### Manual Smoke Test

```bash
# Test stdio directly
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | \
  TELEBOTHOST_API_KEY=sk_your_key node --import tsx bin/mcp.ts
```

---

## 📊 API Coverage

This MCP server covers **100% of the TeleBotHost Developer API** — every endpoint in the [OpenAPI 3.0.3 spec](https://api.telebothost.com/api/v1/docs/openapi.json) is mapped to a tool.

| Group | Endpoints | Tools | Coverage |
|-------|-----------|-------|----------|
| Health | 1 | 1 | ✅ 100% |
| Public Discovery | 9 | 9 | ✅ 100% |
| Bot Lifecycle | 20 | 20 | ✅ 100% |
| Bot Storage | 4 | 4 | ✅ 100% |
| Broadcasts | 6 | 6 | ✅ 100% |
| Commands | 5 | 5 | ✅ 100% |
| Community Store | 2 | 2 | ✅ 100% |
| Quota (helper) | — | 1 | N/A (reuses `GET /bot`) |
| **Total** | **47** | **48** | **✅ 100%** |

### Binary Endpoints

Two endpoints involve binary data (ZIP files), handled via base64 encoding:

| Endpoint | Tool | Approach |
|----------|------|----------|
| `GET /bot/download` | `download_bot` | Downloads ZIP as `ArrayBuffer`, returns base64-encoded string with metadata |
| `POST /bot/import` | `import_bot` | Accepts base64-encoded ZIP, decodes to `Uint8Array`, uploads as `multipart/form-data` |

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEBOTHOST_API_KEY` | **Yes** | TeleBotHost Developer API key (`sk_*` for write, `pub_*` for read-only). Set in your MCP client config's `env` field. |
| `TELEBOTHOST_API_BASE` | No | Override API base URL (default: `https://api.telebothost.com/api/v1`) |

> In stdio mode, there is no `MCP_AUTH_TOKEN` — the server is single-user and access is controlled by your local machine.

---

## ⏱️ Rate Limits

The TeleBotHost API enforces plan-based limits. This MCP server automatically retries on HTTP 429 with exponential backoff.

| Plan | Daily | Per-min | Monthly |
|------|-------|---------|---------|
| FREE / FREEMIUM | 1,000 | 15 | 15,000 |
| PREMIUM | 5,000 | 60 | 75,000 |
| ELITE | 10,000 | 120 | 150,000 |

> `pub_*` keys are always capped at 1,000/day, 15/min, 15,000/month regardless of plan.

Use `get_quota` to check remaining quota at any time.

---

## 💻 HTTP Server Mode (Optional)

> ⚠️ **Only works on residential IPs.** Cloud hosting (Vercel/Render/Railway/Fly) will be blocked by Cloudflare.

For self-hosting on a home server or VPS with residential IP, an HTTP server mode is included:

```bash
# Install
git clone https://github.com/sahilxteam/telebothost-mcp.git
cd telebothost-mcp
npm install

# Set env vars
export TELEBOTHOST_API_KEY=sk_your_key_here
# Optional: export MCP_AUTH_TOKEN=your-mcp-access-token

# Start HTTP server on port 3000
npm run serve:http
```

### HTTP Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Documentation page (HTML) |
| `GET` | `/docs` | Alias for `/` |
| `GET` | `/api/health` | JSON health probe |
| `POST` | `/api/mcp` | MCP JSON-RPC endpoint |

### HTTP Auth (Two Layers)

| Layer | Header | Purpose |
|-------|--------|---------|
| **MCP access control** | `Authorization: Bearer <MCP_AUTH_TOKEN>` | Restrict WHO can call your MCP |
| **TeleBotHost API auth** | `X-Tbh-Api-Key: <sk_*>` | Per-user TBH API key (forwarded to TBH) |

---

## 📁 Project Structure

```
telebothost-mcp/
├── bin/
│   ├── mcp.js              # Entry point shim (loads tsx, runs mcp.ts)
│   └── mcp.ts              # stdio MCP server (primary entry point)
├── lib/
│   ├── types.ts            # Shared types & TbhApiError
│   ├── client.ts           # TeleBotHost API client (auth, retry, binary, errors)
│   ├── tools.ts            # All 48 MCP tool definitions
│   └── docs.ts             # HTML docs page generator (for HTTP mode)
├── scripts/
│   └── test-mcp.sh         # Compliance test suite
├── server.ts               # HTTP server (optional, self-hosting only)
├── render.yaml             # Render.com Blueprint (with Cloudflare warning)
├── .env.example            # Environment variable template
├── .nvmrc                  # Node version pin
├── package.json            # bin field → ./bin/mcp.js
├── tsconfig.json
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## 💻 Local Development

```bash
# Install deps
npm install

# Set env var
cp .env.example .env
# Edit .env with your TELEBOTHOST_API_KEY

# Run stdio server (primary mode)
npm start

# Run HTTP server (advanced, for testing docs page)
npm run serve:http
# → http://localhost:3000

# Type-check
npm run typecheck

# Run compliance tests
npm test
```

---

## 🗺️ Roadmap

- [x] **v1.0.0** — Initial release: 46 tools, Vercel deployment
- [x] **v1.1.0** — Cleaner tool names (dropped `telebothost_` prefix)
- [x] **v1.2.0** — 100% API coverage: added `download_bot` & `import_bot`, compliance test suite
- [x] **v1.3.0** — Per-request API key via `X-Tbh-Api-Key` header (HTTP mode)
- [x] **v1.4.0** — **Pivot to stdio (local run)** — removed Vercel/Render as primary options due to Cloudflare bot detection blocking datacenter IPs
- [ ] **v1.5.0** — Publish to npm, Docker support, GitHub Actions CI
- [ ] **v2.0.0** — Cloudflare Workers transport (whitelisted by Cloudflare)

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and PR guidelines.

---

## 📄 License

[MIT](LICENSE) © [Cyber X](https://github.com/sahilxteam)

---

## 🔗 Links

- **TeleBotHost:** [telebothost.com](https://telebothost.com)
- **Developer API Docs:** [api.telebothost.com/api/v1/docs](https://api.telebothost.com/api/v1/docs)
- **MCP Specification:** [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Issues:** [GitHub Issues](https://github.com/sahilxteam/telebothost-mcp/issues)

---

<div align="center">

Built with ❤️ for the TeleBotHost community

</div>
