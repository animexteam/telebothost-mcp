# TeleBotHost MCP Server

<div align="center">

**A production-ready [Model Context Protocol](https://modelcontextprotocol.io) server for the [TeleBotHost Developer API](https://telebothost.com).**

Expose 46 TeleBotHost tools — bot lifecycle, storage, broadcasts, commands, community store, and more — to any MCP-compatible AI client (Claude Desktop, Cursor, Continue, Cline, etc.).

[![MCP](https://img.shields.io/badge/MCP-1.0-blue.svg)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-000.svg)](https://vercel.com)
[![Deploy on Render](https://img.shields.io/badge/Deploy-Render-46e3b7.svg)](https://render.com)

</div>

---

## ✨ Features

- **🔧 46 Tools** — Full coverage of the TeleBotHost Developer API across 8 groups
- **🚀 Multi-Platform** — Deploys on Vercel, Render, Railway, Fly.io, or any Node host
- **🔐 Secure** — Bearer token auth, optional MCP endpoint protection, key-tier awareness (`sk_*` vs `pub_*`)
- **⚡ Resilient** — Automatic 429 retry with exponential backoff, rate-limit header tracking
- **🛡️ Safe by Design** — Broadcast tool requires explicit `confirm: true` flag
- **📦 Zero-Config** — Single env var (`TELEBOTHOST_API_KEY`) to get started
- **🎯 Type-Safe** — Strict TypeScript throughout, clean compile

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Deployment](#-deployment)
  - [Vercel](#vercel-recommended)
  - [Render](#render)
  - [Railway / Fly.io / Self-Host](#railway--flyio--self-host)
- [Connecting Your AI Client](#-connecting-your-ai-client)
- [Available Tools (46)]#-available-tools-46)
- [Environment Variables](#-environment-variables)
- [Rate Limits](#-rate-limits)
- [Local Development](#-local-development)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏗️ Architecture

```
┌─────────────────┐      POST /api/mcp       ┌─────────────────────┐      Bearer sk_*      ┌─────────────────────┐
│                 │      JSON-RPC 2.0        │  MCP Server         │      HTTPS            │  TeleBotHost API    │
│  Claude Desktop │  ───────────────────▶   │  (stateless)        │  ───────────────────▶ │  api.telebothost.com│
│  Cursor         │                          │  46 tools           │                       │                     │
│  Continue       │  ◀───────────────────   │  JSON-RPC router    │  ◀─────────────────── │  40 endpoints       │
│  Cline          │      JSON response      │  TBH API client     │      JSON             │                     │
└─────────────────┘                          └─────────────────────┘                       └─────────────────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │  Vercel         │  ← api/mcp.ts (serverless)
                                             │  OR Render      │  ← server.ts (Node HTTP)
                                             │  OR Railway     │
                                             │  OR Fly.io      │
                                             └─────────────────┘
```

**Transport:** Streamable HTTP (stateless JSON-RPC 2.0 over HTTP POST)
**Runtime:** Node.js 20+ · TypeScript 5.7 · @modelcontextprotocol/sdk 1.x

---

## 🚀 Quick Start

### 1. Get your TeleBotHost API key

1. Log in to [TeleBotHost](https://telebothost.com)
2. Go to **Developer Settings** → **API Keys**
3. Generate a key:
   - `sk_*` — **Secret key** (full write access) — keep private
   - `pub_*` — **Public key** (read-only) — safe for client-side

### 2. Deploy (pick a platform)

| Platform | One-click | Difficulty |
|----------|-----------|------------|
| **Vercel** | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sahilxteam/telebothost-mcp&env=TELEBOTHOST_API_KEY&envDescription=Your%20TeleBotHost%20Developer%20API%20key&project-name=telebothost-mcp) | ⭐ Easiest |
| **Render** | [Blueprint ready](#render) | ⭐ Easy |
| **Railway** | `railway up` | ⭐⭐ Medium |
| **Fly.io** | `fly launch` | ⭐⭐ Medium |
| **Self-host** | `npm start` | ⭐⭐ Medium |

### 3. Connect your AI client

See [Connecting Your AI Client](#-connecting-your-ai-client) below.

---

## 📦 Deployment

### Vercel (Recommended)

**One-click deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sahilxteam/telebothost-mcp&env=TELEBOTHOST_API_KEY&envDescription=Your%20TeleBotHost%20Developer%20API%20key&project-name=telebothost-mcp)

**Manual deploy:**

```bash
# Clone
git clone https://github.com/sahilxteam/telebothost-mcp.git
cd telebothost-mcp
npm install

# Set env var
vercel env add TELEBOTHOST_API_KEY production
# Paste your sk_* key when prompted

# Deploy
vercel --prod
```

Your MCP endpoint: `https://your-project.vercel.app/api/mcp`

---

### Render

This repo includes a `render.yaml` blueprint.

**Option A — Dashboard (easiest):**

1. Push this repo to your GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. Select your repo — Render auto-detects `render.yaml`
4. Add `TELEBOTHOST_API_KEY` as a secret env var
5. Click **Apply**

**Option B — CLI:**

```bash
# Install Render CLI
npm i -g @render-ai/render-cli

# Link & deploy
render blueprint deploy
```

Your MCP endpoint: `https://telebothost-mcp.onrender.com/api/mcp`

---

### Railway / Fly.io / Self-Host

These platforms use the generic Node server (`server.ts`) via `npm start`.

```bash
# Clone & install
git clone https://github.com/sahilxteam/telebothost-mcp.git
cd telebothost-mcp
npm install

# Set env vars
export TELEBOTHOST_API_KEY=sk_your_key_here
# Optional: export MCP_AUTH_TOKEN=your_mcp_protection_token

# Start
npm start
# → [telebothost-mcp v1.0.0] MCP server listening on :3000
```

**Railway:**

```bash
railway init
railway up
# Set TELEBOTHOST_API_KEY in Railway dashboard
```

**Fly.io:**

```bash
fly launch --no-deploy
fly secrets set TELEBOTHOST_API_KEY=sk_your_key_here
fly deploy
```

**Docker (any host):**

```bash
docker build -t telebothost-mcp .
docker run -p 3000:3000 -e TELEBOTHOST_API_KEY=sk_xxx telebothost-mcp
```

> **Note:** Create a `Dockerfile` if you need container builds — the Node server is runtime-agnostic.

---

## 🔌 Connecting Your AI Client

Once deployed, point any MCP-compatible client at your endpoint:

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "telebothost": {
      "url": "https://your-deployed-url/api/mcp",
      "transport": "http"
    }
  }
}
```

### Cursor

Settings → MCP → Add Server:

```json
{
  "mcpServers": {
    "telebothost": {
      "url": "https://your-deployed-url/api/mcp"
    }
  }
}
```

### VS Code (with Cline / Continue)

Add to your MCP settings:

```json
{
  "mcp.servers": {
    "telebothost": {
      "url": "https://your-deployed-url/api/mcp"
    }
  }
}
```

### With `MCP_AUTH_TOKEN` protection

If you set `MCP_AUTH_TOKEN`, add the Authorization header:

```json
{
  "mcpServers": {
    "telebothost": {
      "url": "https://your-deployed-url/api/mcp",
      "headers": {
        "Authorization": "Bearer your-mcp-auth-token"
      }
    }
  }
}
```

### Test with curl

```bash
# List all tools
curl -X POST https://your-deployed-url/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Call a tool (no auth required)
curl -X POST https://your-deployed-url/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_status","arguments":{}}}'
```

---

## 🛠️ Available Tools (46)

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

### 🤖 Bot Lifecycle (18) — `sk_*` key required for writes

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
| `export_bot` | Generate temp download URL |
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

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEBOTHOST_API_KEY` | **Yes** | TeleBotHost Developer API key (`sk_*` for write, `pub_*` for read-only) |
| `MCP_AUTH_TOKEN` | No | If set, clients must send `Authorization: Bearer <token>` to access the MCP |
| `TELEBOTHOST_API_BASE` | No | Override API base URL (default: `https://api.telebothost.com/api/v1`) |
| `PORT` | No | Port for `server.ts` (default: `3000`, auto-set by Render/Railway/Fly) |

---

## ⏱️ Rate Limits

The TeleBotHost API enforces plan-based limits. This MCP server automatically retries on HTTP 429 with exponential backoff (up to 3 retries).

| Plan | Daily | Per-min | Monthly |
|------|-------|---------|---------|
| FREE / FREEMIUM | 1,000 | 15 | 15,000 |
| PREMIUM | 5,000 | 60 | 75,000 |
| ELITE | 10,000 | 120 | 150,000 |

> `pub_*` keys are always capped at 1,000/day, 15/min, 15,000/month regardless of plan.

Use `get_quota` to check remaining quota at any time.

---

## 💻 Local Development

```bash
# Install deps
npm install

# Set env vars
cp .env.example .env
# Edit .env with your TELEBOTHOST_API_KEY

# Run locally (generic Node server)
npm run dev
# → http://localhost:3000/api/mcp

# OR run as Vercel dev (simulates serverless)
npm run vercel:dev

# Type-check
npm run typecheck

# Test
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

---

## 📁 Project Structure

```
telebothost-mcp/
├── api/
│   └── mcp.ts              # Vercel serverless endpoint (JSON-RPC router)
├── lib/
│   ├── types.ts            # Shared types & TbhApiError
│   ├── client.ts           # TeleBotHost API client (auth, retry, errors)
│   └── tools.ts            # All 46 MCP tool definitions
├── server.ts               # Generic Node HTTP server (Render/Railway/Fly)
├── render.yaml             # Render.com Blueprint config
├── vercel.json             # Vercel serverless config
├── .env.example            # Environment variable template
├── .nvmrc                  # Node version pin
├── package.json
├── tsconfig.json
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and PR guidelines.

### Adding a new tool

1. Open `lib/tools.ts`
2. Add a `ToolDef` to the appropriate group
3. Use `` prefix, clear description, JSON-Schema input
4. Run `npm run typecheck`
5. Open a PR

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
